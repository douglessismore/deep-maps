import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Story, Moment, StoryCategory, StoryCollection, InteractionMode, TileStyle } from '../../types';
import { CATEGORIES, IMPORTANCE_SIZE } from '../../lib/categories';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';
import { getNotabilityThreshold, getEffectiveNotability } from '../../lib/notability';
import { getClusterData, getClusterExpansionZoom, isCluster } from '../../lib/clustering';
import type { ClusterOrPoint, MomentPointProps, ConstellationClusterProps } from '../../lib/clustering';
import { createConstellationSVG, createConstellationTooltip, computeConstellationSize, createCountLabel, createWispsContent, computeEssenceSize, createEssenceHoverRing, createPalimpsestContent, createPalimpsestPinContent, getVariantRenderMode } from '../../lib/constellation';
import type { ConstellationVariant } from '../../lib/constellation';
import { useAppData } from '../../lib/data/provider';
import { getSheetAwarePadding, panToAboveSheet } from '../../lib/sheetAwareMap';
import type { SheetSnap } from '../../lib/sheetAwareMap';
import { EmergenceLayer } from './EmergenceLayer';

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
  baseDuration: number = 1.2
) {
  const center = map.getCenter();
  const tll = L.latLng(target);
  const dist = degreeDistance([center.lat, center.lng], [tll.lat, tll.lng]);

  if (dist > 3) {
    map.setView(target, zoom);
  } else if (dist > 1) {
    const duration = Math.min(baseDuration + dist * 0.15, 2.0);
    map.flyTo(target, zoom, { duration });
  } else {
    map.flyTo(target, zoom, { duration: baseDuration });
  }
}

/**
 * Distance-aware flyToBounds — simplified for honest transitions.
 */
export function smartFlyToBounds(
  map: L.Map,
  bounds: L.LatLngBounds,
  options: L.FitBoundsOptions & { duration?: number } = {}
) {
  const center = map.getCenter();
  const tc = bounds.getCenter();
  const dist = degreeDistance([center.lat, center.lng], [tc.lat, tc.lng]);
  const baseDuration = options.duration ?? 1.2;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { duration: _, ...fitOpts } = options;

  if (dist > 3) {
    map.fitBounds(bounds, { ...fitOpts, animate: false });
  } else if (dist > 1) {
    const duration = Math.min(baseDuration + dist * 0.15, 2.0);
    map.flyToBounds(bounds, { ...fitOpts, duration });
  } else {
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
  scrollHighlight?: Moment[];
  mode: InteractionMode;
  categoryFilter: StoryCategory | null;
  /** Filter map pins to only stories in this set (timeline era filtering) */
  storyIdFilter?: Set<string> | null;
  activeCollection?: StoryCollection | null;
  resetViewKey?: number;
  onMapReady: (map: L.Map) => void;
  onLocationClick: (location: Moment, story: Story) => void;
  onStoryClick: (story: Story) => void;
  userLocation?: { lat: number; lng: number } | null;
  nearMeZoomKey?: number;
  restoreView?: { center: [number, number]; zoom: number } | null;
  entityLocations?: Array<{ location: Moment; story: Story | null }>;
  sheetSnap?: import('../../lib/sheetAwareMap').SheetSnap;
  /** When true, zoom in to activeLocation (user clicked a moment card) */
  zoomToActiveLocation?: boolean;
  /** Called when the map zoom level changes */
  onZoomChange?: (zoom: number) => void;
}

// ── Notability helpers (used for individual pin rendering) ──────────

function computeNotabilityAlpha(location: Moment, zoom: number): number {
  const threshold = getNotabilityThreshold(zoom);
  if (threshold <= 0) return 1;
  const notability = getEffectiveNotability(location);
  if (notability >= threshold) return 1;
  return Math.max(0.15, notability / threshold);
}

function computeNotabilitySize(baseSize: number, alpha: number): number {
  if (alpha >= 1) return baseSize;
  return Math.max(5, Math.round(baseSize * Math.max(0.45, alpha)));
}

// ── Marker icon creation ───────────────────────────────────────────────

const MIN_TOUCH_TARGET = 32;
const isMobileDevice = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;

function createMarkerIcon(color: string, size: number, isActive: boolean, isScrollHighlighted?: boolean, opacity?: number, label?: number): L.DivIcon {
  const highlighted = isActive || isScrollHighlighted;
  const displaySize = isScrollHighlighted && !isActive ? Math.max(size * 1.6, 16) : size;
  const classes = `story-marker${highlighted ? ' active pulsing' : ''}`;
  const opacityStyle = opacity !== undefined ? `opacity:${opacity};` : '';

  // Number label inside the marker (story/entity mode only)
  const labelHtml = label !== undefined && displaySize >= 10
    ? `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:${Math.max(8, displaySize * 0.55)}px;font-weight:700;font-family:'Space Grotesk','Courier New',monospace;color:#000;opacity:0.8;pointer-events:none;">${label}</span>`
    : '';

  // On mobile, wrap small markers in a larger transparent touch target
  if (isMobileDevice && displaySize < MIN_TOUCH_TARGET) {
    return L.divIcon({
      className: '',
      html: `<div style="width:${MIN_TOUCH_TARGET}px;height:${MIN_TOUCH_TARGET}px;display:flex;align-items:center;justify-content:center;">` +
            `<div class="${classes}" style="position:relative;width:${displaySize}px;height:${displaySize}px;background:${color};${opacityStyle}">${labelHtml}</div></div>`,
      iconSize: [MIN_TOUCH_TARGET, MIN_TOUCH_TARGET],
      iconAnchor: [MIN_TOUCH_TARGET / 2, MIN_TOUCH_TARGET / 2],
    });
  }

  return L.divIcon({
    className: '',
    html: `<div class="${classes}" style="position:relative;width:${displaySize}px;height:${displaySize}px;background:${color};${opacityStyle}">${labelHtml}</div>`,
    iconSize: [displaySize, displaySize],
    iconAnchor: [displaySize / 2, displaySize / 2],
  });
}

function createConstellationIcon(
  cluster: ConstellationClusterProps & { point_count: number },
  variant: ConstellationVariant = 'classic',
  zoom: number = 4,
): L.DivIcon {
  // Essence uses its own smaller size computation
  if (variant === 'essence') {
    const size = computeEssenceSize(cluster.point_count);
    const svg = createConstellationSVG(cluster, variant);
    const hoverRing = createEssenceHoverRing(cluster);
    const countOverlay = createCountLabel(cluster.point_count);
    return L.divIcon({
      className: '',
      html: `<div class="constellation-node constellation-essence">${svg}${hoverRing}${countOverlay}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  // Palimpsest uses text content instead of SVG, zoom-aware
  if (variant === 'palimpsest') {
    const content = createPalimpsestContent(cluster, zoom);
    return L.divIcon({
      className: '',
      html: `<div class="constellation-node constellation-palimpsest">${content}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 8],
    });
  }

  const size = computeConstellationSize(cluster.point_count);
  const countOverlay = variant !== 'classic' ? createCountLabel(cluster.point_count) : '';

  // Wisps uses HTML elements instead of SVG
  const innerContent = variant === 'wisps'
    ? createWispsContent(cluster)
    : createConstellationSVG(cluster, variant);

  return L.divIcon({
    className: '',
    html: `<div class="constellation-node constellation-${variant}">${innerContent}${countOverlay}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ── MapController ──────────────────────────────────────────────────────

function MapController({
  stories,
  activeStory,
  activeLocation,
  scrollHighlight,
  mode,
  categoryFilter,
  storyIdFilter,
  activeCollection,
  resetViewKey,
  onMapReady,
  onLocationClick,
  userLocation,
  nearMeZoomKey,
  restoreView,
  entityLocations,
  sheetSnap: sheetSnapProp,
  zoomToActiveLocation,
  onZoomChange,
  constellationVariant,
}: MapViewProps & { constellationVariant: ConstellationVariant }) {
  const { moments: allMoments, stories: allStories } = useAppData();
  const momentMap = useMemo(() => buildMomentMap(allMoments), [allMoments]);
  const momentById = useMemo(() => new Map(allMoments.map(m => [m.id, m])), [allMoments]);
  const storyById = useMemo(() => new Map(allStories.map(s => [s.id, s])), [allStories]);
  const map = useMap();
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const isUserDragging = useRef(false);
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
  const sheetSnap: SheetSnap = sheetSnapProp ?? 'half';

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

  // Track user map interaction — suppress flyTo effects while user is
  // actively panning/zooming and for a cooldown after, so the map doesn't snap back.
  const userInteractUntil = useRef(0);
  const isProgrammaticMove = useRef(false); // Flag to distinguish our flyTo from user gestures

  useMapEvents({
    dragstart: () => {
      isUserDragging.current = true;
      userInteractUntil.current = Infinity; // Active drag — block indefinitely
    },
    dragend: () => {
      isUserDragging.current = false;
      userInteractUntil.current = Date.now() + 4000; // Block flyTo for 4s after drag
    },
    zoomstart: () => {
      // Only block if this is a USER-initiated zoom (not our flyTo)
      if (!isProgrammaticMove.current) {
        userInteractUntil.current = Infinity;
      }
    },
    zoomend: () => {
      const z = map.getZoom();
      setCurrentZoom(z);
      onZoomChange?.(z);
      if (!isUserDragging.current && !isProgrammaticMove.current) {
        userInteractUntil.current = Date.now() + 4000; // Block flyTo for 4s after user zoom
      }
    },
    moveend: () => { /* Triggers re-render for cluster updates via currentBoundsKey */ },
  });

  // ── Moment→Story reverse lookup (for collection focused mode) ──────
  const momentToStory = useMemo(() => {
    const m2s = new Map<string, Story>();
    allStories.forEach(story => {
      story.moments.forEach(sm => {
        if (!m2s.has(sm.momentId)) m2s.set(sm.momentId, story);
      });
    });
    return m2s;
  }, [allStories]);

  // ── Focused-mode locations (story/entity/collection) — bypass clustering ──

  const focusedLocations = useMemo(() => {
    if (mode === 'entity' && entityLocations) return entityLocations;
    if (mode === 'story' && activeStory) {
      return resolveLocationsFromMap(activeStory, momentMap)
        .map((loc) => ({ location: loc, story: activeStory }));
    }
    // Collection mode — show focused markers for all collection moments
    if (activeCollection) {
      const locs: Array<{ location: Moment; story: Story }> = [];
      for (const mid of activeCollection.momentIds) {
        const moment = momentById.get(mid);
        if (!moment) continue;
        const parentStory = momentToStory.get(mid);
        // Use parent story if available, otherwise create a minimal stub
        const story: Story = parentStory ?? {
          id: '__collection-stub__',
          name: activeCollection.name,
          description: '',
          category: 'dark-history' as Story['category'],
          moments: [],
          years: '',
          storyType: 'incident' as Story['storyType'],
          tags: [],
        };
        locs.push({ location: moment, story });
      }
      return locs.length > 0 ? locs : null;
    }
    return null; // null = use cluster mode
  }, [mode, activeStory, entityLocations, activeCollection, momentById, momentToStory, momentMap]);

  // Index map for numbered markers in story mode (1-based)
  // Skip numbering in entity mode — place entity moments cluster on/near the same pin
  const focusedIndexMap = useMemo(() => {
    if (!focusedLocations || mode === 'entity') return null;
    const map = new Map<string, number>();
    focusedLocations.forEach(({ location }, i) => map.set(location.id, i + 1));
    return map;
  }, [focusedLocations, mode]);

  // ── Cluster data for explore/scroll mode ───────────────────────────

  // Memoize bounds to avoid re-computing clusters on every render
  const bounds = map.getBounds();
  const boundsKey = `${bounds.getWest().toFixed(3)},${bounds.getSouth().toFixed(3)},${bounds.getEast().toFixed(3)},${bounds.getNorth().toFixed(3)}`;

  const clusterFeatures = useMemo(() => {
    if (focusedLocations) return []; // Not in explore mode
    return getClusterData(currentZoom, {
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    }, categoryFilter, storyIdFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedLocations, currentZoom, categoryFilter, storyIdFilter, boundsKey]);

  // ── Marker rendering ───────────────────────────────────────────────

  interface MarkerEntry {
    marker: L.Marker;
    type: 'pin' | 'constellation';
    isActive: boolean;
    isHighlighted: boolean;
    isFaded: boolean;
    permanentTooltip: boolean;
    notabilityAlpha: number;
    effectiveSize: number;
    pointCount?: number; // For constellation diffing
    variant?: ConstellationVariant; // Track which visual variant was rendered
    renderedZoom?: number; // Track zoom for palimpsest text scaling
  }
  const markerMapRef = useRef<Map<string, MarkerEntry>>(new Map());

  // Mount/unmount layer group
  useEffect(() => {
    const group = markersRef.current;
    group.addTo(map);
    return () => {
      group.clearLayers();
      markerMapRef.current.clear();
    };
  }, [map]);

  // ── RENDER: Focused mode (story/entity) — direct pins, no clustering
  // ── RENDER: Explore/scroll mode — constellation clusters + individual pins

  useEffect(() => {
    const group = markersRef.current;
    const prevMarkers = markerMapRef.current;
    const nextKeys = new Set<string>();

    const hasHighlight = (scrollHighlight?.length ?? 0) > 0;
    const highlightIds = new Set(scrollHighlight?.map(m => m.id) ?? []);
    const singleHighlight = (scrollHighlight?.length ?? 0) === 1;

    if (focusedLocations) {
      // ── FOCUSED MODE: Direct pin rendering (story/entity view) ──
      // Dim non-active pins when there's an active location (even without scrollHighlight).
      // This makes it clear which moment is currently selected as user scrolls.
      const hasActivePin = activeLocation != null;

      focusedLocations.forEach(({ location, story }) => {
        const key = `pin-${story?.id ?? 'orphan'}-${location.id}`;
        nextKeys.add(key);

        const cat = story ? CATEGORIES[story.category] : { color: '#ef4444', label: 'Uncategorized' };
        const baseSize = IMPORTANCE_SIZE[location.importance] || 10;
        const isActive = activeLocation?.id === location.id;
        const isHighlighted = highlightIds.has(location.id);
        // Fade if: scrollHighlight is set and this pin isn't in it, OR
        // activeLocation is set and this isn't the active pin.
        const isFaded = (hasHighlight && !isHighlighted && !isActive) ||
                        (hasActivePin && !hasHighlight && !isActive);
        // Show permanent tooltip only for the active moment
        const permanentTooltip = isActive || (isHighlighted && singleHighlight);
        const markerOpacity = isFaded ? 0.3 : undefined;
        const effectiveSize = isActive ? Math.max(baseSize * 1.4, 16) : baseSize;
        const label = focusedIndexMap?.get(location.id);

        const existing = prevMarkers.get(key);

        if (existing) {
          const needsRebuild =
            existing.isActive !== isActive ||
            existing.isHighlighted !== isHighlighted ||
            existing.isFaded !== isFaded ||
            existing.effectiveSize !== effectiveSize;

          if (needsRebuild) {
            existing.marker.setIcon(createMarkerIcon(cat.color, effectiveSize, isActive, isHighlighted, markerOpacity, label));
          }

          if (existing.permanentTooltip !== permanentTooltip || needsRebuild) {
            existing.marker.unbindTooltip();
            existing.marker.bindTooltip(
              `<strong style="font-family:'Newsreader',Georgia,serif;font-size:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${location.name}</strong>`,
              { direction: 'right', offset: [8, 0], className: 'dark-tooltip', permanent: permanentTooltip }
            );
          }

          existing.isActive = isActive;
          existing.isHighlighted = isHighlighted;
          existing.isFaded = isFaded;
          existing.permanentTooltip = permanentTooltip;
          existing.notabilityAlpha = 1;
          existing.effectiveSize = effectiveSize;
        } else {
          const icon = createMarkerIcon(cat.color, effectiveSize, isActive, isHighlighted, markerOpacity, label);
          const marker = L.marker([location.lat, location.lng], { icon });
          marker.bindTooltip(
            `<div style="font-family:'Newsreader',Georgia,serif;font-size:13px;max-width:220px;">
              <strong>${location.name}</strong>
            </div>`,
            { direction: 'right', offset: [8, 0], className: 'dark-tooltip', permanent: permanentTooltip }
          );
          marker.on('click', () => { if (story) onLocationClick(location, story); });
          group.addLayer(marker);
          prevMarkers.set(key, {
            marker, type: 'pin', isActive, isHighlighted, isFaded, permanentTooltip,
            notabilityAlpha: 1, effectiveSize,
          });
        }
      });
    } else if (getVariantRenderMode(constellationVariant) === 'unclustered') {
      // ── EMERGENCE MODE: EmergenceLayer handles rendering, clear cluster markers ──
      for (const [key, entry] of prevMarkers) {
        group.removeLayer(entry.marker);
        prevMarkers.delete(key);
      }
    } else {
      // ── EXPLORE/SCROLL MODE: Cluster-aware rendering ──
      clusterFeatures.forEach((feature: ClusterOrPoint) => {
        const [lng, lat] = feature.geometry.coordinates;

        if (isCluster(feature)) {
          // ── CONSTELLATION CLUSTER ──
          const clusterId = feature.properties.cluster_id;
          const key = `cluster-${clusterId}`;
          nextKeys.add(key);

          const clusterProps = {
            ...feature.properties,
            point_count: feature.properties.point_count,
          };
          const size = computeConstellationSize(feature.properties.point_count);

          const existing = prevMarkers.get(key);

          if (existing && existing.type === 'constellation') {
            // Update if point count, variant, or zoom (for palimpsest text scaling) changed
            const needsRebuild =
              existing.pointCount !== feature.properties.point_count ||
              existing.variant !== constellationVariant ||
              (constellationVariant === 'palimpsest' && existing.renderedZoom !== currentZoom);

            if (needsRebuild) {
              existing.marker.setIcon(createConstellationIcon(clusterProps, constellationVariant, currentZoom));
              existing.marker.unbindTooltip();
              existing.marker.bindTooltip(
                createConstellationTooltip(clusterProps),
                { direction: 'top', offset: [0, -size / 2 - 6], className: 'dark-tooltip' }
              );
              existing.pointCount = feature.properties.point_count;
              existing.variant = constellationVariant;
              existing.renderedZoom = currentZoom;
            }
            // Update position (clusters can shift)
            existing.marker.setLatLng([lat, lng]);
          } else {
            // New cluster marker
            const icon = createConstellationIcon(clusterProps, constellationVariant, currentZoom);
            const marker = L.marker([lat, lng], { icon, zIndexOffset: 100 });
            marker.bindTooltip(
              createConstellationTooltip(clusterProps),
              { direction: 'top', offset: [0, -size / 2 - 6], className: 'dark-tooltip' }
            );
            // Click to zoom into cluster
            marker.on('click', () => {
              const expansionZoom = getClusterExpansionZoom(clusterId, categoryFilter);
              map.flyTo([lat, lng], Math.min(expansionZoom, 14), { duration: 1.2 });
            });
            group.addLayer(marker);
            prevMarkers.set(key, {
              marker, type: 'constellation',
              isActive: false, isHighlighted: false, isFaded: false,
              permanentTooltip: false, notabilityAlpha: 1, effectiveSize: size,
              pointCount: feature.properties.point_count,
              variant: constellationVariant,
              renderedZoom: currentZoom,
            });
          }
        } else {
          // ── INDIVIDUAL PIN (unclustered point) ──
          const props = feature.properties as MomentPointProps;
          const moment = momentById.get(props.momentId);
          const story = storyById.get(props.storyId);
          if (!moment || !story) return;

          const key = `pin-${story.id}-${moment.id}`;
          nextKeys.add(key);

          const cat = CATEGORIES[story.category];
          const baseSize = IMPORTANCE_SIZE[moment.importance] || 10;
          const isActive = activeLocation?.id === moment.id;
          const isHighlighted = highlightIds.has(moment.id);
          const isFaded = hasHighlight && !isHighlighted && !isActive;
          const permanentTooltip = isHighlighted && singleHighlight;

          // Notability alpha for continuous opacity
          const notabilityAlpha = computeNotabilityAlpha(moment, currentZoom);
          const visualAlpha = (isActive || isHighlighted) ? 1 : notabilityAlpha;
          const effectiveSize = computeNotabilitySize(baseSize, visualAlpha);

          let markerOpacity: number | undefined;
          if (isActive || isHighlighted) {
            markerOpacity = undefined;
          } else if (isFaded) {
            markerOpacity = Math.min(0.15, notabilityAlpha);
          } else if (notabilityAlpha < 1) {
            markerOpacity = notabilityAlpha;
          }

          const existing = prevMarkers.get(key);

          if (existing && existing.type === 'pin') {
            const needsIconRebuild =
              existing.isActive !== isActive ||
              existing.isHighlighted !== isHighlighted ||
              existing.effectiveSize !== effectiveSize;

            const needsOpacityUpdate = !needsIconRebuild && (
              existing.isFaded !== isFaded ||
              Math.abs(existing.notabilityAlpha - notabilityAlpha) > 0.01
            );

            if (needsIconRebuild) {
              if (constellationVariant === 'palimpsest') {
                const pinContent = createPalimpsestPinContent(moment.name, cat.color, currentZoom, markerOpacity ?? notabilityAlpha);
                existing.marker.setIcon(L.divIcon({
                  className: '',
                  html: `<div class="constellation-node constellation-palimpsest">${pinContent}</div>`,
                  iconSize: [0, 0],
                  iconAnchor: [0, 5],
                }));
              } else {
                existing.marker.setIcon(createMarkerIcon(cat.color, effectiveSize, isActive, isHighlighted, markerOpacity));
              }
            } else if (needsOpacityUpdate) {
              const el = existing.marker.getElement();
              if (el) {
                const inner = el.firstElementChild as HTMLElement;
                if (inner) inner.style.opacity = markerOpacity !== undefined ? String(markerOpacity) : '';
              }
            }

            if (existing.permanentTooltip !== permanentTooltip || needsIconRebuild) {
              existing.marker.unbindTooltip();
              const displaySize = isHighlighted && !isActive ? Math.max(effectiveSize * 1.6, 16) : effectiveSize;
              existing.marker.bindTooltip(
                `<div style="font-family:'Newsreader',Georgia,serif;font-size:13px;max-width:220px;">
                  <strong>${moment.name}</strong>
                  <div style="font-size:11px;color:#bfbfbf;margin-top:2px;font-family:'Space Grotesk','Courier New',monospace;">${story.name}</div>
                </div>`,
                { direction: 'top', offset: [0, -displaySize / 2 - 4], className: 'dark-tooltip', permanent: permanentTooltip }
              );
            }

            existing.isActive = isActive;
            existing.isHighlighted = isHighlighted;
            existing.isFaded = isFaded;
            existing.permanentTooltip = permanentTooltip;
            existing.notabilityAlpha = notabilityAlpha;
            existing.effectiveSize = effectiveSize;
          } else {
            // New individual pin
            let icon: L.DivIcon;
            if (constellationVariant === 'palimpsest') {
              const pinContent = createPalimpsestPinContent(moment.name, cat.color, currentZoom, markerOpacity ?? notabilityAlpha);
              icon = L.divIcon({
                className: '',
                html: `<div class="constellation-node constellation-palimpsest">${pinContent}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 5],
              });
            } else {
              icon = createMarkerIcon(cat.color, effectiveSize, isActive, isHighlighted, markerOpacity);
            }
            const marker = L.marker([moment.lat, moment.lng], { icon });
            const displaySize = isHighlighted && !isActive ? Math.max(effectiveSize * 1.6, 16) : effectiveSize;
            marker.bindTooltip(
              `<div style="font-family:'Newsreader',Georgia,serif;font-size:13px;max-width:220px;">
                <strong>${moment.name}</strong>
                <div style="font-size:11px;color:#bfbfbf;margin-top:2px;font-family:'Space Grotesk','Courier New',monospace;">${story.name}</div>
              </div>`,
              { direction: 'top', offset: [0, -displaySize / 2 - 4], className: 'dark-tooltip', permanent: permanentTooltip }
            );
            marker.on('click', () => onLocationClick(moment, story));
            group.addLayer(marker);
            prevMarkers.set(key, {
              marker, type: 'pin', isActive, isHighlighted, isFaded, permanentTooltip,
              notabilityAlpha, effectiveSize,
            });
          }
        }
      });
    }

    // Remove markers no longer in the scene
    for (const [key, entry] of prevMarkers) {
      if (!nextKeys.has(key)) {
        group.removeLayer(entry.marker);
        prevMarkers.delete(key);
      }
    }
  }, [focusedLocations, clusterFeatures, activeLocation, scrollHighlight, map, onLocationClick, currentZoom, mode, categoryFilter, constellationVariant]);

  // ── Story/entity path lines — connect moments chronologically ─────

  const pathLineRef = useRef<L.Polyline | null>(null);
  const pathArrowheadsRef = useRef<L.LayerGroup>(L.layerGroup());
  const prevPathMomentIds = useRef<string>('');

  useEffect(() => {
    // Clean up previous line
    if (pathLineRef.current) {
      map.removeLayer(pathLineRef.current);
      pathLineRef.current = null;
    }
    pathArrowheadsRef.current.clearLayers();

    // Never draw polylines for collections — guard both activeCollection and
    // focusedLocations that originated from a collection (mode won't be story/entity).
    // Belt-and-suspenders: also block if mode isn't explicitly story/entity/scroll.
    if (activeCollection) {
      prevPathMomentIds.current = '';
      return;
    }
    if (mode !== 'story' && mode !== 'entity' && mode !== 'scroll') {
      prevPathMomentIds.current = '';
      return;
    }

    // Determine which moments to connect
    let pathMoments: Moment[] = [];
    let pathColor = 'rgba(255,255,255,0.5)';

    if (focusedLocations && focusedLocations.length >= 2 && (mode === 'story' || mode === 'entity')) {
      // Story or entity mode — use all focused locations
      pathMoments = focusedLocations.map(fl => fl.location);
      // Use the story/entity's category color if available
      const firstStory = focusedLocations[0]?.story;
      if (firstStory) {
        pathColor = CATEGORIES[firstStory.category]?.color ?? pathColor;
      }
    } else if (mode === 'scroll' && scrollHighlight && scrollHighlight.length >= 2) {
      // Scroll mode ONLY — connect highlighted story's moments.
      // Extra mode === 'scroll' check prevents race conditions where
      // scrollHighlight is set with collection moments while mode is stale.
      // Verify all highlighted moments belong to a single story (collection
      // moments span multiple stories and must never get polylines).
      const hlStory = allStories.find(s =>
        s.moments.some(sm => {
          const m = momentMap.get(sm.momentId);
          return m && scrollHighlight.some(sh => sh.id === m.id);
        })
      );
      if (hlStory) {
        const storyMomentIds = new Set(
          hlStory.moments.map(sm => sm.momentId)
        );
        const allFromSameStory = scrollHighlight.every(sh => storyMomentIds.has(sh.id));
        if (allFromSameStory) {
          pathMoments = [...scrollHighlight];
          pathColor = CATEGORIES[hlStory.category]?.color ?? pathColor;
        }
        // If moments span multiple stories (collection highlight), pathMoments stays empty
      }
    }

    if (pathMoments.length < 2) return;

    // Sort chronologically by year (nulls last)
    const sorted = [...pathMoments].sort((a, b) => {
      const ya = a.year ?? 9999;
      const yb = b.year ?? 9999;
      return ya - yb;
    });

    // Build coordinate array
    const coords: L.LatLngExpression[] = sorted.map(m => [m.lat, m.lng]);

    // Draw the polyline
    const line = L.polyline(coords, {
      color: pathColor,
      weight: 2,
      opacity: 0.45,
      dashArray: '6, 8',
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    });

    line.addTo(map);
    pathLineRef.current = line;

    // Track which story's polyline is displayed (for active segment highlight).
    // No auto-zoom on scroll — polylines communicate geographic scope visually.
    // User controls zoom; clicking a story still zooms to its bounds.
    prevPathMomentIds.current = sorted.map(m => m.id).join(',');

    // Add small directional arrows at midpoints of each segment
    pathArrowheadsRef.current.addTo(map);
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i];
      const to = sorted[i + 1];
      const midLat = (from.lat + to.lat) / 2;
      const midLng = (from.lng + to.lng) / 2;
      // Calculate angle for arrow direction
      const dy = to.lat - from.lat;
      const dx = to.lng - from.lng;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      const arrow = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="transform:rotate(${-angle + 90}deg);color:${pathColor};opacity:0.5;font-size:10px;line-height:1;">▾</div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
        interactive: false,
        zIndexOffset: -500,
      });
      pathArrowheadsRef.current.addLayer(arrow);
    }

    return () => {
      if (pathLineRef.current) {
        map.removeLayer(pathLineRef.current);
        pathLineRef.current = null;
      }
      pathArrowheadsRef.current.clearLayers();
    };
  }, [focusedLocations, scrollHighlight, mode, activeCollection, map, allStories, momentMap]);

  // Highlight the active segment of the path line
  const activeSegmentRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (activeSegmentRef.current) {
      map.removeLayer(activeSegmentRef.current);
      activeSegmentRef.current = null;
    }

    // Never draw active segment for collections — same guard as pathLine effect.
    // Also block when mode isn't story/entity/scroll (defensive, matches pathLine).
    if (activeCollection) return;
    if (mode !== 'story' && mode !== 'entity' && mode !== 'scroll') return;
    if (!activeLocation || !pathLineRef.current) return;

    // Find the active moment's position in the sorted path
    let pathMoments: Moment[] = [];
    if (focusedLocations && focusedLocations.length >= 2 && (mode === 'story' || mode === 'entity')) {
      pathMoments = focusedLocations.map(fl => fl.location);
    } else if (mode === 'scroll' && scrollHighlight && scrollHighlight.length >= 2) {
      pathMoments = [...scrollHighlight];
    }
    if (pathMoments.length < 2) return;

    const sorted = [...pathMoments].sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    const activeIdx = sorted.findIndex(m => m.id === activeLocation.id);
    if (activeIdx < 0) return;

    // Draw bright segment from start up to the active moment
    const activeCoords: L.LatLngExpression[] = sorted
      .slice(0, activeIdx + 1)
      .map(m => [m.lat, m.lng]);

    if (activeCoords.length < 2) return;

    // Get color from the path line
    const lineOpts = pathLineRef.current.options;
    const color = lineOpts.color ?? 'rgba(255,255,255,0.7)';

    const segment = L.polyline(activeCoords, {
      color,
      weight: 3,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    });

    segment.addTo(map);
    activeSegmentRef.current = segment;

    return () => {
      if (activeSegmentRef.current) {
        map.removeLayer(activeSegmentRef.current);
        activeSegmentRef.current = null;
      }
    };
  }, [activeLocation, focusedLocations, scrollHighlight, activeCollection, mode, map]);

  // ── Fly to active location or fit story/entity/category bounds ────

  // After fitBounds fires (story/entity open or scroll-to-top), suppress single-pin
  // zoom for a brief window so the panel's auto-set of the first moment doesn't
  // immediately override the overview. The user must actually scroll to trigger zoom.
  const boundsLockUntil = useRef(0);

  // Track previous key values to prevent spurious re-fires from reference changes
  // (stories array, sheetSnap, entityLocations) that shouldn't trigger map movement
  const prevZoomEffectKey = useRef({ mode: '', activeStoryId: '', activeLocationId: '', activeCollectionId: '', categoryFilter: '', entityLocCount: 0, zoomToActiveLocation: false });

  useEffect(() => {
    // Only fire when something meaningful changed — not just reference identity
    const key = {
      mode,
      activeStoryId: activeStory?.id ?? '',
      activeLocationId: activeLocation?.id ?? '',
      activeCollectionId: activeCollection?.id ?? '',
      categoryFilter: categoryFilter ?? '',
      entityLocCount: entityLocations?.length ?? 0,
      zoomToActiveLocation: zoomToActiveLocation ?? false,
    };
    const prev = prevZoomEffectKey.current;
    const changed = key.mode !== prev.mode || key.activeStoryId !== prev.activeStoryId ||
      key.activeLocationId !== prev.activeLocationId || key.activeCollectionId !== prev.activeCollectionId ||
      key.categoryFilter !== prev.categoryFilter || key.entityLocCount !== prev.entityLocCount ||
      key.zoomToActiveLocation !== prev.zoomToActiveLocation;
    prevZoomEffectKey.current = key;
    if (!changed) return; // Skip — only stories/sheetSnap/etc reference changed
    const containerH = map.getSize().y;
    const isBoundsLocked = Date.now() < boundsLockUntil.current;

    // Sheet-aware padding: accounts for bottom sheet overlay on mobile
    const storyPad = getSheetAwarePadding(isMobile, sheetSnap ?? 'peek', containerH);

    // Flag programmatic moves so zoomstart/zoomend don't set userInteractUntil.
    // Timeout must cover the longest animation duration + buffer.
    isProgrammaticMove.current = true;
    const clearFlag = () => { setTimeout(() => { isProgrammaticMove.current = false; }, 2000); };

    // Mode-change zooms (entering story/entity view) ALWAYS fire — user clicking
    // a story card is an intentional navigation, not a conflict with map interaction.
    if (mode === 'entity' && entityLocations && entityLocations.length > 0 && !activeLocation) {
      const coords = entityLocations.map(({ location: l }) => [l.lat, l.lng] as [number, number]);
      if (coords.length === 1) {
        // Single-moment entity (common for places): zoom directly to it.
        // Use smartFlyTo-style distance check so far-away points snap instantly
        // instead of relying on flyTo animation which can fail to complete.
        const targetZoom = Math.max(map.getZoom(), 14);
        const center = map.getCenter();
        const dist = degreeDistance([center.lat, center.lng], coords[0]);
        if (dist > 3) {
          // Far away — instant snap, then offset for sheet
          panToAboveSheet(map, coords[0], sheetSnap ?? 'half', isMobile, { animate: false, zoom: targetZoom });
        } else {
          panToAboveSheet(map, coords[0], sheetSnap ?? 'half', isMobile, { animate: true, duration: 0.8, zoom: targetZoom });
        }
        boundsLockUntil.current = Date.now() + 1200;
      } else {
        const eBounds = L.latLngBounds(coords);
        const currentBounds = map.getBounds();
        const eTargetZoom = map.getBoundsZoom(eBounds, false, L.point(40, 40));
        const eZoomDiff = Math.abs(map.getZoom() - eTargetZoom);
        // "Already visible" only counts if zoom is also close — at global zoom
        // everything is technically visible but useless
        const eAlreadyVisible = currentBounds.contains(eBounds) && eZoomDiff < 2;
        const eNearlyThere = eZoomDiff < 1.2 && currentBounds.intersects(eBounds);
        if (eAlreadyVisible || eNearlyThere) {
          if (!eAlreadyVisible) {
            map.fitBounds(eBounds, { ...storyPad, maxZoom: 16, animate: false });
          }
          isProgrammaticMove.current = false;
        } else {
          smartFlyToBounds(map, eBounds, { ...storyPad, maxZoom: 16, duration: 0.8 });
          boundsLockUntil.current = Date.now() + 1200;
        }
      }
      userInteractUntil.current = 0;
      clearFlag();
    } else if (mode === 'story' && activeStory && !activeLocation) {
      const storyLocs = resolveLocationsFromMap(activeStory, momentMap);
      if (storyLocs.length <= 1) {
        // Single-moment story: just pan to it, no fitBounds animation (avoids jitter)
        if (storyLocs.length === 1) {
          panToAboveSheet(map, [storyLocs[0].lat, storyLocs[0].lng], sheetSnap ?? 'half', isMobile, { animate: false });
        }
        isProgrammaticMove.current = false;
      } else {
        const bounds = L.latLngBounds(storyLocs.map((loc) => [loc.lat, loc.lng] as [number, number]));
        // Skip animation if bounds change is negligible (avoids jitter on scroll-to-top
        // for nearby clusters like SRV's Austin moments or single-city stories)
        const currentBounds = map.getBounds();
        const targetZoom = map.getBoundsZoom(bounds, false, L.point(40, 40));
        const zoomDiff = Math.abs(map.getZoom() - targetZoom);
        // "Already visible" only counts if zoom is also close — at global zoom
        // everything is technically visible but useless
        const alreadyVisible = currentBounds.contains(bounds) && zoomDiff < 2;
        const nearlyThere = zoomDiff < 1.2 && currentBounds.intersects(bounds);
        if (alreadyVisible || nearlyThere) {
          // Tiny adjustment — set view instantly, no animation
          if (!alreadyVisible) {
            map.fitBounds(bounds, { ...storyPad, maxZoom: 16, animate: false });
          }
          isProgrammaticMove.current = false;
        } else {
          smartFlyToBounds(map, bounds, { ...storyPad, maxZoom: 16, duration: 0.8 });
          boundsLockUntil.current = Date.now() + 1200;
        }
      }
      userInteractUntil.current = 0;
      clearFlag();
    } else if (activeLocation && !isBoundsLocked) {
      // Single-pin pan — respect user interaction guard (don't fight user's drag/zoom)
      // Exception: explicit click-zoom always fires (user tapped a card deliberately)
      if (!zoomToActiveLocation && (isUserDragging.current || Date.now() < userInteractUntil.current)) {
        isProgrammaticMove.current = false;
        return;
      }
      if (zoomToActiveLocation) {
        // User clicked a moment card — zoom in to it
        userInteractUntil.current = 0; // Clear interaction guard for intentional clicks
        const targetZoom = Math.max(map.getZoom(), 14);
        map.flyTo([activeLocation.lat, activeLocation.lng], targetZoom, { duration: 0.6 });
      } else {
        panToAboveSheet(
          map,
          [activeLocation.lat, activeLocation.lng],
          sheetSnap ?? 'half',
          isMobile,
          { animate: true, duration: 0.3 },
        );
      }
      clearFlag();
    } else if (activeCollection) {
      // Collection selected — zoom to fit all collection moments
      const sheetPad = getSheetAwarePadding(isMobile, sheetSnap, containerH);
      const midSet = new Set(activeCollection.momentIds);
      const coords = allMoments.filter(m => midSet.has(m.id)).map(m => [m.lat, m.lng] as [number, number]);
      if (coords.length > 0) {
        smartFlyToBounds(map, L.latLngBounds(coords), { ...sheetPad, maxZoom: 14, duration: 1.8 });
      }
      userInteractUntil.current = 0;
      clearFlag();
    } else if (categoryFilter) {
      const sheetPad = getSheetAwarePadding(isMobile, sheetSnap, containerH);
      const catStories = stories.filter((s) => s.category === categoryFilter);
      const coords = catStories.flatMap((s) =>
        resolveLocationsFromMap(s, momentMap).map((l) => [l.lat, l.lng] as [number, number])
      );
      if (coords.length > 0) {
        smartFlyToBounds(map, L.latLngBounds(coords), { ...sheetPad, maxZoom: 10, duration: 1.8 });
      }
      clearFlag();
    } else {
      isProgrammaticMove.current = false;
    }
  }, [activeLocation, activeStory, activeCollection, mode, map, categoryFilter, stories, entityLocations, isMobile, sheetSnap, zoomToActiveLocation]);

  // Zoom out to show all pins when resetViewKey changes
  const prevResetKey = useRef(resetViewKey);
  useEffect(() => {
    if (resetViewKey === prevResetKey.current) return;
    prevResetKey.current = resetViewKey;
    smartFlyTo(map, [39.5, -98.5], 4, 1.5);
  }, [resetViewKey, map]);

  // Near Me: zoom to nearest ~20 moments
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
      smartFlyToBounds(map, L.latLngBounds(points), { padding: [40, 40], maxZoom: 12, duration: 1.5 });
    } else {
      smartFlyTo(map, [loc.lat, loc.lng], 8, 1.5);
    }
  }, [stories, map]);

  const hasAutoZoomed = useRef(false);
  useEffect(() => {
    if (hasAutoZoomed.current || !userLocation || mode !== 'explore') return;
    hasAutoZoomed.current = true;
    zoomToNearestMoments(userLocation);
  }, [userLocation, mode, zoomToNearestMoments]);

  const prevNearMeKey = useRef(nearMeZoomKey);
  useEffect(() => {
    if (nearMeZoomKey === prevNearMeKey.current) return;
    prevNearMeKey.current = nearMeZoomKey;
    if (userLocation) zoomToNearestMoments(userLocation);
  }, [nearMeZoomKey, userLocation, zoomToNearestMoments]);

  // Restore map view
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
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([userLocation.lat, userLocation.lng], { icon, interactive: false, zIndexOffset: -1000 });
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

// ── TileSwitcher ───────────────────────────────────────────────────────

function TileSwitcher({ tileStyle, onTileChange }: { tileStyle: TileStyle; onTileChange: (s: TileStyle) => void }) {
  const [open, setOpen] = useState(false);
  const styles: { key: TileStyle; label: string; icon: string }[] = [
    { key: 'dark', label: 'Dark', icon: '🌑' },
    { key: 'light', label: 'Light', icon: '☀️' },
    { key: 'satellite', label: 'Satellite', icon: '🛰' },
  ];
  return (
    <div>
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

// ── MapView ────────────────────────────────────────────────────────────

export function MapView(props: MapViewProps) {
  const [tileStyle, setTileStyle] = useState<TileStyle>('light');
  // Emergence is the only rendering mode — canvas-based, no DOM overhead
  const constellationVariant: ConstellationVariant = 'emergence';
  const tile = TILE_URLS[tileStyle];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[39.5, -98.5]}
        zoom={4}
        minZoom={2}
        className="h-full w-full"
        zoomControl={true}
        attributionControl={true}
        worldCopyJump={true}
      >
        <TileLayer
          key={tileStyle}
          url={tile.url}
          attribution={tile.attribution}
          maxZoom={19}
        />
        <MapController {...props} constellationVariant={constellationVariant} />
        {props.mode !== 'story' && props.mode !== 'entity' && (
          <EmergenceLayer
            categoryFilter={props.categoryFilter}
            activeCollection={props.activeCollection}
            storyIdFilter={props.storyIdFilter}
            onLocationClick={props.onLocationClick}
            activeLocation={props.activeLocation}
            scrollHighlight={props.scrollHighlight}
          />
        )}
      </MapContainer>
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2 items-end">
        <TileSwitcher tileStyle={tileStyle} onTileChange={setTileStyle} />
      </div>
    </div>
  );
}
