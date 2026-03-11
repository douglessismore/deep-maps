import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Story, Moment, StoryCategory, InteractionMode, TileStyle } from '../../types';
import { CATEGORIES, IMPORTANCE_SIZE } from '../../lib/categories';
import { moments } from '../../data/moments';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';

const momentMap = buildMomentMap(moments);

/** Approximate distance in degrees between two lat/lng points. */
function degreeDistance(a: [number, number], b: [number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

/**
 * Distance-aware flyTo — simplified for honest transitions.
 * Far = instant snap (clean chapter break). Near = smooth pan.
 * Mid-range = animated with duration scaled by distance.
 */
export function smartFlyTo(
  map: L.Map,
  target: L.LatLngExpression,
  zoom: number,
  baseDuration: number = 1.8
) {
  const center = map.getCenter();
  const tll = L.latLng(target);
  const dist = degreeDistance([center.lat, center.lng], [tll.lat, tll.lng]);

  if (dist > 5) {
    // Cross-country: instant snap — no choppy tile loading
    map.setView(target, zoom);
  } else if (dist > 1.5) {
    // Mid-range (cross-city or nearby state): animate with scaled duration
    const duration = Math.min(baseDuration + dist * 0.25, 2.8);
    map.flyTo(target, zoom, { duration });
  } else {
    // Nearby (within city): smooth pan
    map.flyTo(target, zoom, { duration: baseDuration });
  }
}

/**
 * Distance-aware flyToBounds — simplified for honest transitions.
 * Far = instant snap. Near = smooth animation.
 */
export function smartFlyToBounds(
  map: L.Map,
  bounds: L.LatLngBounds,
  options: L.FitBoundsOptions & { duration?: number } = {}
) {
  const center = map.getCenter();
  const tc = bounds.getCenter();
  const dist = degreeDistance([center.lat, center.lng], [tc.lat, tc.lng]);
  const baseDuration = options.duration ?? 1.8;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { duration: _, ...fitOpts } = options;

  if (dist > 5) {
    // Cross-country: instant snap
    map.fitBounds(bounds, { ...fitOpts, animate: false });
  } else if (dist > 1.5) {
    // Mid-range: animate with scaled duration
    const duration = Math.min(baseDuration + dist * 0.25, 2.8);
    map.flyToBounds(bounds, { ...fitOpts, duration });
  } else {
    // Nearby: smooth animation
    map.flyToBounds(bounds, { ...fitOpts, duration: baseDuration });
  }
}

const TILE_URLS: Record<TileStyle, { url: string; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
  },
};

interface MapViewProps {
  stories: Story[];
  activeStory: Story | null;
  activeLocation: Moment | null;
  scrollHighlight?: Moment[]; // Lightweight highlight during explore scroll (no zoom)
  mode: InteractionMode;
  categoryFilter: StoryCategory | null;
  resetViewKey?: number; // Incremented to trigger zoom-out to all pins
  onMapReady: (map: L.Map) => void;
  onLocationClick: (location: Moment, story: Story) => void;
  onStoryClick: (story: Story) => void;
  userLocation?: { lat: number; lng: number } | null;
  nearMeZoomKey?: number;
  restoreView?: { center: [number, number]; zoom: number } | null;
  entityLocations?: Array<{ location: Moment; story: Story }>;
}

function createMarkerIcon(color: string, size: number, isActive: boolean, isScrollHighlighted?: boolean, opacity?: number): L.DivIcon {
  // Scroll-highlighted markers get enlarged and pulsing
  const highlighted = isActive || isScrollHighlighted;
  const displaySize = isScrollHighlighted && !isActive ? Math.max(size * 1.6, 16) : size;
  const classes = `story-marker${highlighted ? ' active pulsing' : ''}`;
  const opacityStyle = opacity !== undefined ? `opacity:${opacity};` : '';
  return L.divIcon({
    className: '',
    html: `<div class="${classes}" style="width:${displaySize}px;height:${displaySize}px;background:${color};${opacityStyle}"></div>`,
    iconSize: [displaySize, displaySize],
    iconAnchor: [displaySize / 2, displaySize / 2],
  });
}

function MapController({
  stories,
  activeStory,
  activeLocation,
  scrollHighlight,
  mode,
  categoryFilter,
  resetViewKey,
  onMapReady,
  onLocationClick,
  userLocation,
  nearMeZoomKey,
  restoreView,
  entityLocations,
}: MapViewProps) {
  const map = useMap();
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const isUserDragging = useRef(false);

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  // Invalidate Leaflet when container resizes (mobile map collapse/expand)
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      setTimeout(() => map.invalidateSize(), 350);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  useMapEvents({
    dragstart: () => { isUserDragging.current = true; },
    dragend: () => { setTimeout(() => { isUserDragging.current = false; }, 300); },
  });

  // Determine which locations to show
  const visibleLocations = useMemo(() => {
    if (mode === 'entity' && entityLocations) {
      return entityLocations;
    }
    if (mode === 'story' && activeStory) {
      return resolveLocationsFromMap(activeStory, momentMap).map((loc) => ({ location: loc, story: activeStory }));
    }
    // Filter by category if set
    const filteredStories = categoryFilter
      ? stories.filter((s) => s.category === categoryFilter)
      : stories;
    return filteredStories.flatMap((story) =>
      resolveLocationsFromMap(story, momentMap).map((loc) => ({ location: loc, story }))
    );
  }, [stories, activeStory, mode, categoryFilter, entityLocations]);

  // Stable marker map — only update markers whose state actually changed
  interface MarkerEntry {
    marker: L.Marker;
    isActive: boolean;
    isHighlighted: boolean;
    isFaded: boolean;
    permanentTooltip: boolean;
  }
  const markerMapRef = useRef<Map<string, MarkerEntry>>(new Map());

  // Mount/unmount: manage layer group lifecycle (separate from updates)
  useEffect(() => {
    const group = markersRef.current;
    group.addTo(map);
    return () => {
      group.clearLayers();
      markerMapRef.current.clear();
    };
  }, [map]);

  // Render markers — differential update (NO cleanup — markers persist for diffing)
  useEffect(() => {
    const group = markersRef.current;
    const prevMarkers = markerMapRef.current;
    const nextKeys = new Set<string>();

    const isMultiHighlight = (scrollHighlight?.length ?? 0) > 1;
    const highlightIds = new Set(scrollHighlight?.map(m => m.id) ?? []);
    const singleHighlight = (scrollHighlight?.length ?? 0) === 1;

    visibleLocations.forEach(({ location, story }) => {
      const key = `${story.id}-${location.id}`;
      nextKeys.add(key);

      const cat = CATEGORIES[story.category];
      const size = IMPORTANCE_SIZE[location.importance] || 10;
      const isActive = activeLocation?.id === location.id;
      const isHighlighted = highlightIds.has(location.id);
      const isFaded = isMultiHighlight && !isHighlighted && !isActive;
      const permanentTooltip = isHighlighted && singleHighlight;

      const existing = prevMarkers.get(key);

      if (existing) {
        // Only update if state changed
        if (
          existing.isActive !== isActive ||
          existing.isHighlighted !== isHighlighted ||
          existing.isFaded !== isFaded ||
          existing.permanentTooltip !== permanentTooltip
        ) {
          const icon = createMarkerIcon(cat.color, size, isActive, isHighlighted, isFaded ? 0.15 : undefined);
          existing.marker.setIcon(icon);

          // Rebind tooltip (offset may change with highlight size)
          existing.marker.unbindTooltip();
          const displaySize = isHighlighted && !isActive ? Math.max(size * 1.6, 16) : size;
          existing.marker.bindTooltip(
            `<div style="font-family:'Crimson Text',serif;font-size:13px;max-width:220px;">
              <strong>${location.name}</strong>
              <div style="font-size:11px;color:#bfbfbf;margin-top:2px;font-family:'IBM Plex Mono',monospace;">${story.name}</div>
            </div>`,
            {
              direction: 'top',
              offset: [0, -displaySize / 2 - 4],
              className: 'dark-tooltip',
              permanent: permanentTooltip,
            }
          );

          existing.isActive = isActive;
          existing.isHighlighted = isHighlighted;
          existing.isFaded = isFaded;
          existing.permanentTooltip = permanentTooltip;
        }
      } else {
        // New marker — create from scratch
        const icon = createMarkerIcon(cat.color, size, isActive, isHighlighted, isFaded ? 0.15 : undefined);
        const marker = L.marker([location.lat, location.lng], { icon });

        const displaySize = isHighlighted && !isActive ? Math.max(size * 1.6, 16) : size;
        marker.bindTooltip(
          `<div style="font-family:'Crimson Text',serif;font-size:13px;max-width:220px;">
            <strong>${location.name}</strong>
            <div style="font-size:11px;color:#bfbfbf;margin-top:2px;font-family:'IBM Plex Mono',monospace;">${story.name}</div>
          </div>`,
          {
            direction: 'top',
            offset: [0, -displaySize / 2 - 4],
            className: 'dark-tooltip',
            permanent: permanentTooltip,
          }
        );

        marker.on('click', () => {
          onLocationClick(location, story);
        });

        group.addLayer(marker);
        prevMarkers.set(key, { marker, isActive, isHighlighted, isFaded, permanentTooltip });
      }
    });

    // Remove markers that are no longer in visibleLocations
    for (const [key, entry] of prevMarkers) {
      if (!nextKeys.has(key)) {
        group.removeLayer(entry.marker);
        prevMarkers.delete(key);
      }
    }

    // group.addTo handled by mount effect above
    // NO cleanup — markers persist across re-renders for true differential updates
  }, [visibleLocations, activeLocation, scrollHighlight, map, onLocationClick]);

  // Fly to active location or fit story/entity/category bounds
  useEffect(() => {
    if (isUserDragging.current) return;

    if (activeLocation) {
      smartFlyTo(map, [activeLocation.lat, activeLocation.lng], 14, 2.0);
    } else if (mode === 'entity' && entityLocations && entityLocations.length > 0) {
      const coords = entityLocations.map(({ location: l }) => [l.lat, l.lng] as [number, number]);
      smartFlyToBounds(map, L.latLngBounds(coords), { padding: [60, 60], maxZoom: 14, duration: 1.8 });
    } else if (mode === 'story' && activeStory) {
      const bounds = L.latLngBounds(
        resolveLocationsFromMap(activeStory, momentMap).map((loc) => [loc.lat, loc.lng] as [number, number])
      );
      smartFlyToBounds(map, bounds, { padding: [60, 60], maxZoom: 14, duration: 1.8 });
    } else if (categoryFilter) {
      const catStories = stories.filter((s) => s.category === categoryFilter);
      const coords = catStories.flatMap((s) =>
        resolveLocationsFromMap(s, momentMap).map((l) => [l.lat, l.lng] as [number, number])
      );
      if (coords.length > 0) {
        smartFlyToBounds(map, L.latLngBounds(coords), { padding: [60, 60], maxZoom: 10, duration: 1.8 });
      }
    }
  }, [activeLocation, activeStory, mode, map, categoryFilter, stories, entityLocations]);

  // Zoom out to show all pins when resetViewKey changes (back-to-explore)
  // Uses hardcoded US center instead of flyToBounds to prevent intermittent Africa bug
  const prevResetKey = useRef(resetViewKey);
  useEffect(() => {
    if (resetViewKey === prevResetKey.current) return;
    prevResetKey.current = resetViewKey;
    smartFlyTo(map, [39.5, -98.5], 4, 1.5);
  }, [resetViewKey, map]);

  // Zoom to nearest ~20 moments around user location
  const zoomToNearestMoments = useCallback((loc: { lat: number; lng: number }) => {
    const allCoords = stories.flatMap(s =>
      resolveLocationsFromMap(s, momentMap).map(l => ({
        lat: l.lat,
        lng: l.lng,
        dist: Math.sqrt((l.lat - loc.lat) ** 2 + (l.lng - loc.lng) ** 2),
      }))
    );
    allCoords.sort((a, b) => a.dist - b.dist);
    const nearest = allCoords.slice(0, 20);

    if (nearest.length > 0) {
      const points: [number, number][] = [
        [loc.lat, loc.lng],
        ...nearest.map(c => [c.lat, c.lng] as [number, number]),
      ];
      smartFlyToBounds(map, L.latLngBounds(points), {
        padding: [40, 40],
        maxZoom: 12,
        duration: 1.5,
      });
    } else {
      smartFlyTo(map, [loc.lat, loc.lng], 8, 1.5);
    }
  }, [stories, map]);

  // Auto-zoom to user location on first load
  const hasAutoZoomed = useRef(false);
  useEffect(() => {
    if (hasAutoZoomed.current || !userLocation || mode !== 'explore') return;
    hasAutoZoomed.current = true;
    zoomToNearestMoments(userLocation);
  }, [userLocation, mode, zoomToNearestMoments]);

  // Near Me button: zoom to nearest 20 on every click (key increments)
  const prevNearMeKey = useRef(nearMeZoomKey);
  useEffect(() => {
    if (nearMeZoomKey === prevNearMeKey.current) return;
    prevNearMeKey.current = nearMeZoomKey;
    if (userLocation) {
      zoomToNearestMoments(userLocation);
    }
  }, [nearMeZoomKey, userLocation, zoomToNearestMoments]);

  // Restore map view when navigating back (instead of resetting to US center)
  const prevRestoreView = useRef(restoreView);
  useEffect(() => {
    if (restoreView === prevRestoreView.current || !restoreView) return;
    prevRestoreView.current = restoreView;
    smartFlyTo(map, restoreView.center, restoreView.zoom, 1.2);
  }, [restoreView, map]);

  // User location marker (blue pulsing dot)
  const userMarkerRef = useRef<L.Marker | null>(null);
  useEffect(() => {
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (userLocation) {
      const icon = L.divIcon({
        className: '',
        html: '<div class="geo-marker"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon, interactive: false });
      marker.addTo(map);
      userMarkerRef.current = marker;
    }
    return () => {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    };
  }, [userLocation, map]);

  return null;
}

function TileSwitcher({ tileStyle, onTileChange }: { tileStyle: TileStyle; onTileChange: (s: TileStyle) => void }) {
  const [open, setOpen] = useState(false);
  const styles: { key: TileStyle; label: string; icon: string }[] = [
    { key: 'dark', label: 'Dark', icon: '🌑' },
    { key: 'light', label: 'Light', icon: '☀️' },
    { key: 'satellite', label: 'Satellite', icon: '🛰' },
  ];
  return (
    <div className="absolute top-3 right-3 z-[1000]">
      {open ? (
        <div className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-lg overflow-hidden">
          {styles.map((s) => (
            <button
              key={s.key}
              onClick={() => { onTileChange(s.key); setOpen(false); }}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-mono w-full text-left transition-colors ${
                tileStyle === s.key
                  ? 'bg-[rgba(220,38,38,0.15)] text-white'
                  : 'text-[#a3a3a3] hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#a3a3a3] hover:text-white hover:bg-[#252525] transition-colors shadow-lg flex items-center gap-1.5"
          title="Change map style"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          <span className="hidden sm:inline">{styles.find(s => s.key === tileStyle)?.label}</span>
        </button>
      )}
    </div>
  );
}

export function MapView(props: MapViewProps) {
  const [tileStyle, setTileStyle] = useState<TileStyle>('light');

  const tile = TILE_URLS[tileStyle];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[39.5, -98.5]}
        zoom={4}
        className="h-full w-full"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          key={tileStyle}
          url={tile.url}
          attribution={tile.attribution}
          maxZoom={19}
        />
        <MapController {...props} />
      </MapContainer>
      <TileSwitcher tileStyle={tileStyle} onTileChange={setTileStyle} />
    </div>
  );
}
