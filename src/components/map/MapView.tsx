import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Story, StoryLocation, StoryCategory, InteractionMode, TileStyle } from '../../types';
import { CATEGORIES, IMPORTANCE_SIZE } from '../../lib/categories';

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
  activeLocation: StoryLocation | null;
  scrollHighlight?: StoryLocation | null; // Lightweight highlight during explore scroll (no zoom)
  mode: InteractionMode;
  categoryFilter: StoryCategory | null;
  resetViewKey?: number; // Incremented to trigger zoom-out to all pins
  onMapReady: (map: L.Map) => void;
  onLocationClick: (location: StoryLocation, story: Story) => void;
  onStoryClick: (story: Story) => void;
  userLocation?: { lat: number; lng: number } | null;
  nearMeZoomKey?: number;
  restoreView?: { center: [number, number]; zoom: number } | null;
}

function createMarkerIcon(color: string, size: number, isActive: boolean, isScrollHighlighted?: boolean): L.DivIcon {
  // Scroll-highlighted markers get enlarged and pulsing
  const highlighted = isActive || isScrollHighlighted;
  const displaySize = isScrollHighlighted && !isActive ? Math.max(size * 1.6, 16) : size;
  const classes = `story-marker${highlighted ? ' active pulsing' : ''}`;
  return L.divIcon({
    className: '',
    html: `<div class="${classes}" style="width:${displaySize}px;height:${displaySize}px;background:${color};"></div>`,
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
    if (mode === 'story' && activeStory) {
      return activeStory.locations.map((loc) => ({ location: loc, story: activeStory }));
    }
    // Filter by category if set
    const filteredStories = categoryFilter
      ? stories.filter((s) => s.category === categoryFilter)
      : stories;
    return filteredStories.flatMap((story) =>
      story.locations.map((loc) => ({ location: loc, story }))
    );
  }, [stories, activeStory, mode, categoryFilter]);

  // Render markers
  useEffect(() => {
    const group = markersRef.current;
    group.clearLayers();

    visibleLocations.forEach(({ location, story }) => {
      const cat = CATEGORIES[story.category];
      const size = IMPORTANCE_SIZE[location.importance] || 10;
      const isActive = activeLocation?.id === location.id;
      const isScrollHighlighted = scrollHighlight?.id === location.id;
      const icon = createMarkerIcon(cat.color, size, isActive, isScrollHighlighted);

      const marker = L.marker([location.lat, location.lng], { icon });

      const displaySize = isScrollHighlighted && !isActive ? Math.max(size * 1.6, 16) : size;
      marker.bindTooltip(
        `<div style="font-family:'Crimson Text',serif;font-size:13px;max-width:220px;">
          <strong>${location.name}</strong>
          <div style="font-size:11px;color:#bfbfbf;margin-top:2px;font-family:'IBM Plex Mono',monospace;">${story.name}</div>
        </div>`,
        {
          direction: 'top',
          offset: [0, -displaySize / 2 - 4],
          className: 'dark-tooltip',
          permanent: isScrollHighlighted, // Auto-show tooltip for scroll-highlighted marker
        }
      );

      marker.on('click', () => {
        onLocationClick(location, story);
      });

      group.addLayer(marker);
    });

    if (!map.hasLayer(group)) {
      group.addTo(map);
    }

    return () => {
      group.clearLayers();
    };
  }, [visibleLocations, activeLocation, scrollHighlight, map, onLocationClick]);

  // Fly to active location or fit story/category bounds
  useEffect(() => {
    if (isUserDragging.current) return;

    if (activeLocation) {
      // Slow enough for satellite tiles to load and for the journey to feel intentional
      map.flyTo([activeLocation.lat, activeLocation.lng], 14, { duration: 2.0 });
    } else if (mode === 'story' && activeStory) {
      const bounds = L.latLngBounds(
        activeStory.locations.map((loc) => [loc.lat, loc.lng] as [number, number])
      );
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 14, duration: 1.8 });
    } else if (categoryFilter) {
      const catStories = stories.filter((s) => s.category === categoryFilter);
      const coords = catStories.flatMap((s) =>
        s.locations.map((l) => [l.lat, l.lng] as [number, number])
      );
      if (coords.length > 0) {
        map.flyToBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 10, duration: 1.8 });
      }
    }
  }, [activeLocation, activeStory, mode, map, categoryFilter, stories]);

  // Zoom out to show all pins when resetViewKey changes (back-to-explore)
  // Uses hardcoded US center instead of flyToBounds to prevent intermittent Africa bug
  const prevResetKey = useRef(resetViewKey);
  useEffect(() => {
    if (resetViewKey === prevResetKey.current) return;
    prevResetKey.current = resetViewKey;
    map.flyTo([39.5, -98.5], 4, { duration: 1.5 });
  }, [resetViewKey, map]);

  // Zoom to nearest ~20 moments around user location
  const zoomToNearestMoments = useCallback((loc: { lat: number; lng: number }) => {
    const allCoords = stories.flatMap(s =>
      s.locations.map(l => ({
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
      map.flyToBounds(L.latLngBounds(points), {
        padding: [40, 40],
        maxZoom: 12,
        duration: 1.5,
      });
    } else {
      map.flyTo([loc.lat, loc.lng], 8, { duration: 1.5 });
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
    map.flyTo(restoreView.center, restoreView.zoom, { duration: 1.2 });
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
  const [tileStyle, setTileStyle] = useState<TileStyle>('dark');

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
