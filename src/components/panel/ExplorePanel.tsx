import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Entity, Story, Moment, StoryCategory, InteractionMode, ViewportLocation, StoryCollection } from '../../types';
import { getLocationsInBounds, getStoriesInBounds, distanceMiles } from '../../lib/geo';
import { getEffectiveNotability } from '../../lib/notability';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';
import { getViewportEntities, getMomentsForEntity, type EntityWithCounts } from '../../lib/entityHelpers';
import { useAppData } from '../../lib/data/provider';
import { useUIVariant } from '../../lib/uiVariant';
import { panToAboveSheet } from '../../lib/sheetAwareMap';
import type { SheetSnap } from '../../lib/sheetAwareMap';
import { StoryCard } from './StoryCard';
import { PersonCard } from './PersonCard';
import { CollectionCard } from './CollectionCard';
import { LocationCard } from './LocationCard';
import { PersonChip } from './PersonChip';
import { isV2 } from '../../lib/theme';

type MixedListItem =
  | { kind: 'story'; story: Story; distance: number; notability: number }
  | { kind: 'person'; data: EntityWithCounts; distance: number; notability: number };


interface ExplorePanelProps {
  stories: Story[];
  collections: StoryCollection[];
  activeCollection: StoryCollection | null;
  displayMoments: Moment[];
  momentToStoryMap: Map<string, Story>;
  mapInstance: LeafletMap | null;
  onStorySelect: (story: Story) => void;
  onLocationSelect: (location: Moment, story: Story) => void;
  onCollectionSelect: (collection: StoryCollection) => void;
  onClearCollection: () => void;
  onScrollHighlight: (locations: Moment[], storyId?: string) => void;
  onModeChange: (mode: InteractionMode) => void;
  mode: InteractionMode;
  searchQuery: string;
  categoryFilter: StoryCategory | null;
  onCategoryFilter: (category: StoryCategory | null) => void;
  onSurpriseMe: () => void;
  userLocation?: { lat: number; lng: number } | null;
  onRequestGeo?: () => void;
  onEntityClick?: (entity: Entity) => void;
  activeTab?: PanelTab;
  onTabChange?: (tab: PanelTab) => void;
  sheetSnap?: import('../../lib/sheetAwareMap').SheetSnap;
  onScrollPosition?: (scrollTop: number) => void;
  restoreScrollTop?: number | null;
  onScrollRestored?: () => void;
  onExpandRequest?: () => void;
  /** Collection moment click — sets activeLocation + zoomToActiveLocation */
  onCollectionMomentClick?: (moment: Moment) => void;
  /** Collection scroll highlight — sets activeLocation without zoom */
  onCollectionScrollHighlight?: (moment: Moment) => void;
  /** Currently active location ID (for highlighting collection moment cards) */
  activeLocationId?: string | null;
  /** Back button handler — shown when nav history exists */
  onBack?: () => void;
  onHome?: () => void;
  hasNavHistory?: boolean;
}

export type PanelTab = 'map' | 'people' | 'collections';

const TAB_INDEX: Record<PanelTab, number> = { map: 0, people: 1, collections: 2 };

/** Get the nearest location distance from a story to a point */
function nearestDistance(story: Story, lat: number, lng: number, mMap: Map<string, Moment>): number {
  return Math.min(...resolveLocationsFromMap(story, mMap).map((l) => distanceMiles(lat, lng, l.lat, l.lng)));
}

/** Get the max notability score across a story's moments */
function storyNotability(story: Story, mMap: Map<string, Moment>): number {
  const locs = resolveLocationsFromMap(story, mMap);
  if (locs.length === 0) return 0;
  return Math.max(...locs.map(l => getEffectiveNotability(l)));
}

/**
 * Compute a hybrid "nearest" sort score that blends distance and notability
 * based on the current map zoom level.
 *
 * At tight zoom (≥12): distance dominates (nearby things first)
 * At loose zoom (≤6): notability dominates (important things first)
 * In between: smooth linear blend
 *
 * Returns a score where LOWER = should appear first in the list.
 */
function hybridNearestScore(distance: number, notability: number, zoom: number): number {
  // zoomFactor: 0.5 at zoom ≤6 (loose), 1 at zoom ≥12 (tight)
  // Floor at 0.5 so distance always matters when user explicitly picks "Nearest"
  const zoomFactor = Math.max(0.5, Math.min(1, (zoom - 6) / 6));

  // Normalize distance: use log scale to tame extreme ranges.
  // +1 to avoid log(0). Lower distance → lower distanceScore → sorts first.
  const distanceScore = Math.log1p(distance);

  // Normalize notability: invert so higher notability → lower score (sorts first).
  // Notability ranges roughly 5–88; map to 0–1 then invert.
  const notabilityScore = 1 - Math.min(1, notability / 100);

  return (zoomFactor * distanceScore) + ((1 - zoomFactor) * notabilityScore);
}

export function ExplorePanel({
  stories,
  collections,
  activeCollection,
  displayMoments,
  momentToStoryMap,
  mapInstance,
  onStorySelect,
  onLocationSelect,
  onCollectionSelect,
  onClearCollection,
  onScrollHighlight,
  onModeChange,
  searchQuery,
  categoryFilter,
  onSurpriseMe,
  userLocation,
  onRequestGeo,
  onEntityClick,
  activeTab: controlledTab,
  onTabChange,
  sheetSnap: sheetSnapProp,
  onScrollPosition,
  restoreScrollTop,
  onScrollRestored,
  onExpandRequest: _onExpandRequest,
  onCollectionMomentClick,
  onCollectionScrollHighlight,
  activeLocationId,
  onBack,
  onHome,
  hasNavHistory,
}: ExplorePanelProps) {
  const { moments } = useAppData();
  const { variant } = useUIVariant();
  const momentMap = useMemo(() => buildMomentMap(moments), [moments]);
  const isSheetMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
  const sheetSnap: SheetSnap = sheetSnapProp ?? 'half';
  const [internalTab, setInternalTab] = useState<PanelTab>('map');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = useCallback((tab: PanelTab) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  }, [onTabChange]);
  // Suppress initial-render slide animation for tab underline
  const hasTabRendered = useRef(false);
  useEffect(() => { hasTabRendered.current = true; }, []);
  const [expandedLocationKey, setExpandedLocationKey] = useState<string | null>(null);
  const [viewportLocations, setViewportLocations] = useState<ViewportLocation[]>([]);
  const viewportLocationsRef = useRef<ViewportLocation[]>(viewportLocations);
  viewportLocationsRef.current = viewportLocations;
  const [momentSort, setMomentSort] = useState<'notable' | 'nearest' | 'oldest'>('notable');
  const [storySort, setStorySort] = useState<'notable' | 'nearest' | 'a-z'>('notable');
  // placeSort removed — Places tab removed in 3-tab redesign
  const hasManualSort = useRef(false);
  const [viewportStories, setViewportStories] = useState<Story[]>([]);
  // activeLocationId comes from props (driven by App.tsx activeLocation)
  const [scrollActiveStoryId, setScrollActiveStoryId] = useState<string | null>(null);

  // Anchor & Stream: selected person in horizontal strip (People tab)
  const [anchorPersonId, setAnchorPersonId] = useState<string | null>(null);
  const [scrollActiveMomentKey, setScrollActiveMomentKey] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(mapInstance?.getZoom() ?? 10);

  // Compact cards on mobile to show more stories below the map
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
  );
  // Split = always rich cards; spotlight peek = rich single card
  const useCompactCards = variant === 'split' ? false : isMobile;

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const locationCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const collectionListCardRefs = useRef<Map<string, HTMLElement>>(new Map());
  // placesCardRefs removed — Places tab removed in 3-tab redesign
  const isScrollDriving = useRef(false);
  const scrollTimeout = useRef<number | null>(null);
  const scrollRafId = useRef(0);
  const panTimeout = useRef(0);
  const highlightDebounce = useRef(0);

  // Auto-sort by Nearest when GPS is first acquired (unless user manually chose a sort)
  const prevUserLocation = useRef(userLocation);
  useEffect(() => {
    if (!prevUserLocation.current && userLocation && !hasManualSort.current) {
      setMomentSort('nearest');
      setStorySort('nearest');
    }
    prevUserLocation.current = userLocation;
  }, [userLocation]);

  // Auto-switch to collections tab when a collection is selected
  useEffect(() => {
    if (activeCollection) {
      setActiveTab('collections');
    }
  }, [activeCollection]);

  // Clear scroll highlight + active collection when switching tabs
  useEffect(() => {
    if (activeTab !== 'people' && activeTab !== 'collections') setScrollActiveStoryId(null);
    // scrollActiveEntityId removed — Places tab removed in 3-tab redesign
    // Clear collection when leaving collections tab — collection is a destination, not a filter
    if (activeTab !== 'collections' && activeCollection) onClearCollection();
    // Clear map highlight and reset mode to prevent polylines from carrying over
    onScrollHighlight([]);
    onModeChange('explore');
  }, [activeTab]);

  // Filter stories by search + category (timeline filtering already done in App.tsx)
  const filteredStories = useMemo(() => {
    let result = stories;
    if (categoryFilter) {
      result = result.filter((s) => s.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const raw = searchQuery.trim();
      if (raw.startsWith('#')) {
        // Exact tag match — "#janis-joplin" matches tag "janis-joplin"
        const tagQuery = raw.slice(1).toLowerCase();
        result = result.filter((s) => s.tags.some((t) => t === tagQuery));
      } else {
        const q = raw.toLowerCase();
        result = result.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.nickname?.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.tags.some((t) => t.includes(q)) ||
            resolveLocationsFromMap(s, momentMap).some((l) => l.name.toLowerCase().includes(q))
        );
      }
    }
    return result;
  }, [stories, searchQuery, categoryFilter]);

  // Update viewport data when map moves (panel shows ALL moments — no notability filter)
  const updateViewport = useCallback(() => {
    if (!mapInstance || isScrollDriving.current) return;
    const bounds = mapInstance.getBounds();

    // Filter by category if active
    const sourceStories = categoryFilter
      ? stories.filter((s) => s.category === categoryFilter)
      : stories;

    const allInBounds = getLocationsInBounds(sourceStories, bounds, momentMap, moments);
    setViewportLocations(allInBounds);
    setViewportStories(getStoriesInBounds(sourceStories, bounds, momentMap));
    setMapZoom(mapInstance.getZoom());
  }, [mapInstance, stories, categoryFilter, momentMap, moments]);

  useEffect(() => {
    if (!mapInstance) return;
    updateViewport();
    mapInstance.on('moveend', updateViewport);
    mapInstance.on('zoomend', updateViewport);
    return () => {
      mapInstance.off('moveend', updateViewport);
      mapInstance.off('zoomend', updateViewport);
    };
  }, [mapInstance, updateViewport]);



  // Collections filtered to viewport — only show collections with ≥1 moment in current map bounds
  const viewportCollections = useMemo(() => {
    if (!mapInstance) return collections;
    const bounds = mapInstance.getBounds();
    return collections.filter(c =>
      c.momentIds.some(mid => {
        const m = moments.find(mm => mm.id === mid);
        return m && bounds.contains([m.lat, m.lng]);
      })
    );
  }, [collections, mapInstance, viewportLocations]); // viewportLocations triggers recompute on map move

  // Scroll-driven navigation (Stories tab + Collections views)
  useEffect(() => {
    const isPeopleTab = activeTab === 'people';
    const isActiveCollectionTab = activeTab === 'collections' && activeCollection != null;
    const isCollectionsListTab = activeTab === 'collections' && activeCollection == null;
    if ((!isPeopleTab && !isActiveCollectionTab && !isCollectionsListTab) || !mapInstance) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      cancelAnimationFrame(scrollRafId.current);
      scrollRafId.current = requestAnimationFrame(() => {
        isScrollDriving.current = true;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = window.setTimeout(() => {
          isScrollDriving.current = false;
          // Don't reshuffle the collections list during scroll — it causes
          // the highlighted collection to snap to a different one when the
          // list reorders based on viewport changes from scroll-driven panTo.
          if (!isCollectionsListTab) {
            updateViewport();
          }
        }, 600);

        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height * 0.4;

        // Collection list — highlight collection's moments on map
        if (isCollectionsListTab) {
          let closestCollId: string | null = null;
          let closestCollDist = Infinity;
          collectionListCardRefs.current.forEach((el, id) => {
            const rect = el.getBoundingClientRect();
            const cardCenter = rect.top + rect.height / 2;
            const dist = Math.abs(cardCenter - centerY);
            if (dist < closestCollDist) {
              closestCollDist = dist;
              closestCollId = id;
            }
          });
          if (closestCollId) {
            const coll = collections.find(c => c.id === closestCollId);
            if (coll) {
              setScrollActiveStoryId(closestCollId);
              const collMoments = coll.momentIds
                .map(mid => moments.find(m => m.id === mid))
                .filter((m): m is Moment => m != null);
              if (collMoments.length > 0) {
                // Don't set mode to 'scroll' for collection list — prevents polylines.
                // EmergenceLayer highlights markers via scrollHighlight directly.
                onScrollHighlight(collMoments);
                // Pan to first in-view moment (or first overall) — don't fitBounds
                // on scroll, as that overrides the user's zoom level and causes
                // the map to snap back when they try to zoom into an area.
                clearTimeout(panTimeout.current);
                panTimeout.current = window.setTimeout(() => {
                  const mapBounds = mapInstance.getBounds();
                  const inView = collMoments.filter(m => mapBounds.contains([m.lat, m.lng]));
                  const panTarget = inView[0] || collMoments[0];
                  panToAboveSheet(mapInstance, [panTarget.lat, panTarget.lng], sheetSnap, isSheetMobile, { duration: 0.15 });
                }, 80);
              }
            }
          }
          return; // Don't fall through to story/entity logic
        }

        let closestId: string | null = null;
        let closestDist = Infinity;

        cardRefs.current.forEach((el, id) => {
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenter - centerY);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
          }
        });

        if (closestId) {
          // Inside a collection — always highlight single moment, never story polylines
          if (isActiveCollectionTab) {
            const collectionMoment = displayMoments.find(m => m.id === closestId);
            if (collectionMoment) {
              onModeChange('scroll');
              setScrollActiveStoryId(closestId);
              onScrollHighlight([collectionMoment]);
              onCollectionScrollHighlight?.(collectionMoment);
              clearTimeout(panTimeout.current);
              panTimeout.current = window.setTimeout(() => {
                panToAboveSheet(mapInstance, [collectionMoment.lat, collectionMoment.lng], sheetSnap, isSheetMobile, { duration: 0.15 });
              }, 80);
            }
          } else {
          // Check if it's a story or a person entity
          const story = displayStories.find((s) => s.id === closestId);
          if (story && story.moments.length > 0) {
            onModeChange('scroll');
            setScrollActiveStoryId(closestId);

            // Highlight ALL story pins on the map — pass storyId to skip reverse-lookup
            const resolved = resolveLocationsFromMap(story, momentMap);
            onScrollHighlight(resolved, story.id);

            clearTimeout(panTimeout.current);
            panTimeout.current = window.setTimeout(() => {
              // Pan to first in-view pin (or first overall)
              const mapBounds = mapInstance.getBounds();
              const locsInView = resolved.filter(l => mapBounds.contains([l.lat, l.lng]));
              const panTarget = locsInView[0] || resolved[0];
              panToAboveSheet(mapInstance, [panTarget.lat, panTarget.lng], sheetSnap, isSheetMobile, { duration: 0.15 });
            }, 80);
          } else {
            // Person entity — highlight their moments on the map
            const entityMoments = getMomentsForEntity(closestId);
            if (entityMoments.length > 0) {
              onModeChange('scroll');
              setScrollActiveStoryId(closestId);
                onScrollHighlight(entityMoments);

              clearTimeout(panTimeout.current);
              panTimeout.current = window.setTimeout(() => {
                const mapBounds = mapInstance.getBounds();
                const locsInView = entityMoments.filter(l => mapBounds.contains([l.lat, l.lng]));
                const panTarget = locsInView[0] || entityMoments[0];
                panToAboveSheet(mapInstance, [panTarget.lat, panTarget.lng], sheetSnap, isSheetMobile, { duration: 0.15 });
              }, 80);
            }
          }
          } // close outer else (non-collection)
        }
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(scrollRafId.current);
      clearTimeout(panTimeout.current);
      clearTimeout(highlightDebounce.current);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      isScrollDriving.current = false; // Prevent stuck flag when switching tabs mid-scroll
    };
  }, [activeTab, activeCollection, collections, mapInstance, filteredStories, viewportStories, onModeChange, updateViewport, displayMoments, onCollectionScrollHighlight]);

  // Track scroll position for navigation history save/restore
  useEffect(() => {
    if (!onScrollPosition) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => { onScrollPosition(container.scrollTop); };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScrollPosition]);

  // Restore scroll position when navigating back
  useEffect(() => {
    if (restoreScrollTop == null) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    // Use rAF to wait for DOM to render content before scrolling
    const raf = requestAnimationFrame(() => {
      container.scrollTop = restoreScrollTop;
      onScrollRestored?.();
    });
    return () => cancelAnimationFrame(raf);
  }, [restoreScrollTop, onScrollRestored]);


  // Initial activation for collections list — highlight the first collection's pins on mount
  // so the map shows relevant markers immediately instead of waiting for user to scroll
  useEffect(() => {
    const isCollectionsListTab = activeTab === 'collections' && activeCollection == null;
    if (!isCollectionsListTab || !mapInstance || viewportCollections.length === 0) return;
    // Small delay to allow DOM refs to populate
    const timer = setTimeout(() => {
      const firstColl = viewportCollections[0];
      setScrollActiveStoryId(firstColl.id);
      const collMoments = firstColl.momentIds
        .map(mid => moments.find(m => m.id === mid))
        .filter((m): m is Moment => m != null);
      if (collMoments.length > 0) {
        onScrollHighlight(collMoments);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab, activeCollection, viewportCollections, mapInstance]);

  // Scroll-driven location navigation (Moments tab)
  useEffect(() => {
    if (activeTab !== 'map' || !mapInstance) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      cancelAnimationFrame(scrollRafId.current);
      scrollRafId.current = requestAnimationFrame(() => {
        // Suppress viewport updates while scrolling — prevents the moments list
        // from reshuffling when panTo triggers a moveend that recomputes viewportLocations
        isScrollDriving.current = true;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = window.setTimeout(() => {
          isScrollDriving.current = false;
          updateViewport();
        }, 400);

        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height * 0.4;
        let closestKey: string | null = null;
        let closestDist = Infinity;

        locationCardRefs.current.forEach((el, key) => {
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenter - centerY);
          if (dist < closestDist) {
            closestDist = dist;
            closestKey = key;
          }
        });

        if (closestKey) {
          const vl = viewportLocationsRef.current.find(
            (v) => `${v.story?.id ?? 'no-story'}-${v.location.id}` === closestKey
          );
          if (vl) {
            setScrollActiveMomentKey(closestKey);
            onScrollHighlight([vl.location], vl.story?.id);
            clearTimeout(panTimeout.current);
            panTimeout.current = window.setTimeout(() => {
              panToAboveSheet(mapInstance, [vl.location.lat, vl.location.lng], sheetSnap, isSheetMobile, { duration: 0.15 });
            }, 80);
          }
        }
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(scrollRafId.current);
      clearTimeout(panTimeout.current);
      clearTimeout(highlightDebounce.current);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      isScrollDriving.current = false;
    };
  }, [activeTab, mapInstance, onScrollHighlight, updateViewport]);

  // Stories tab: show viewport stories if available, else filtered stories
  // Filter out canonical stories — they're invisible infrastructure
  const displayStories = useMemo(() => {
    let result: Story[];
    if (searchQuery.trim()) result = filteredStories;
    else if (viewportStories.length > 0) result = viewportStories;
    else result = filteredStories;

    // Sort by active story sort mode
    if (storySort === 'nearest' && userLocation) {
      return [...result].sort((a, b) => {
        const scoreA = hybridNearestScore(
          nearestDistance(a, userLocation.lat, userLocation.lng, momentMap),
          storyNotability(a, momentMap),
          mapZoom,
        );
        const scoreB = hybridNearestScore(
          nearestDistance(b, userLocation.lat, userLocation.lng, momentMap),
          storyNotability(b, momentMap),
          mapZoom,
        );
        return scoreA - scoreB;
      });
    }
    return [...result].sort((a, b) => storyNotability(b, momentMap) - storyNotability(a, momentMap));
  }, [filteredStories, viewportStories, searchQuery, userLocation, storySort, momentMap, mapZoom]);

  // Viewport entities — split into people and places
  const viewportEntities: EntityWithCounts[] = useMemo(() => {
    if (viewportLocations.length === 0) return [];
    const ids = new Set(viewportLocations.map((vl) => vl.location.id));
    let result = getViewportEntities(ids);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        ({ entity }) =>
          entity.name.toLowerCase().includes(q) ||
          entity.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [viewportLocations, searchQuery]);

  // People entities — mixed into Stories tab
  const personEntities = useMemo(
    () => viewportEntities.filter((e) => e.entity.type === 'person'),
    [viewportEntities]
  );

  // Anchor & Stream: auto-select highest-notability person when entering People tab
  useEffect(() => {
    if (activeTab === 'people' && personEntities.length > 0 && !anchorPersonId) {
      // Sort by max notability descending, pick first
      const sorted = [...personEntities].sort((a, b) => b.maxNotability - a.maxNotability);
      setAnchorPersonId(sorted[0].entity.id);
    }
    if (activeTab !== 'people') {
      setAnchorPersonId(null);
    }
  }, [activeTab, personEntities]);

  // Anchor & Stream: moments for the selected person
  const anchorMoments = useMemo(() => {
    if (!anchorPersonId) return [];
    return getMomentsForEntity(anchorPersonId).sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  }, [anchorPersonId]);

  // Anchor & Stream: highlight selected person's moments on map
  useEffect(() => {
    if (activeTab !== 'people' || !anchorPersonId) return;
    const moments = getMomentsForEntity(anchorPersonId);
    if (moments.length > 0) {
      onScrollHighlight(moments);
    }
  }, [anchorPersonId, activeTab]);

  // personAlphabeticalGroups removed — People tab uses horizontal strip, not A-Z list

  // Mixed list: stories + people sorted by distance (or stories first if no location)
  const mixedList: MixedListItem[] = useMemo(() => {
    const storyItems: MixedListItem[] = displayStories.map((story) => ({
      kind: 'story' as const,
      story,
      distance: userLocation
        ? nearestDistance(story, userLocation.lat, userLocation.lng, momentMap)
        : 0,
      notability: storyNotability(story, momentMap),
    }));
    const personItems: MixedListItem[] = personEntities.map((data) => {
      let dist = Infinity;
      if (userLocation) {
        const entityMoments = getMomentsForEntity(data.entity.id);
        for (const m of entityMoments) {
          const d = distanceMiles(userLocation.lat, userLocation.lng, m.lat, m.lng);
          if (d < dist) dist = d;
        }
      }
      return { kind: 'person' as const, data, distance: dist === Infinity ? 0 : dist, notability: data.maxNotability };
    });

    const combined = [...storyItems, ...personItems];
    if (storySort === 'nearest' && userLocation) {
      combined.sort((a, b) =>
        hybridNearestScore(a.distance, a.notability, mapZoom) -
        hybridNearestScore(b.distance, b.notability, mapZoom)
      );
    } else if (storySort === 'notable') {
      combined.sort((a, b) => b.notability - a.notability);
    }
    return combined;
  }, [displayStories, personEntities, userLocation, storySort, mapZoom]);

  // placeEntities + computed values removed — Places tab removed in 3-tab redesign

  const sortedMoments = useMemo(() => {
    let arr = [...viewportLocations];
    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      arr = arr.filter(
        (vl) =>
          vl.location.name.toLowerCase().includes(q) ||
          vl.location.subtitle?.toLowerCase().includes(q) ||
          vl.story?.name.toLowerCase().includes(q)
      );
    }
    switch (momentSort) {
      case 'notable':
        return arr.sort((a, b) => (b.location.notability ?? 0) - (a.location.notability ?? 0));
      case 'nearest':
        if (userLocation) {
          // Hybrid sort: blends distance and notability based on zoom level
          return arr.sort((a, b) => {
            const da = distanceMiles(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng);
            const db = distanceMiles(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
            const na = getEffectiveNotability(a.location);
            const nb = getEffectiveNotability(b.location);
            return hybridNearestScore(da, na, mapZoom) - hybridNearestScore(db, nb, mapZoom);
          });
        }
        // Fallback: distance from viewport center (pre-computed)
        return arr.sort((a, b) => a.distance - b.distance);
      case 'oldest':
        return arr.sort((a, b) => (a.location.year ?? 9999) - (b.location.year ?? 9999));
      default:
        return arr;
    }
  }, [viewportLocations, momentSort, userLocation, mapZoom, searchQuery]);

  // Places tab removed in 3-tab redesign (Map / People / Collections)
  // Place entities will appear in the Map tab alongside moments in a future iteration

  return (
    <div className="flex flex-col h-full relative">
      {/* Back bar — shown when there's nav history or inside a collection */}
      {(hasNavHistory || activeCollection) && (
        <div className="lg:hidden shrink-0 flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <button
            onClick={activeCollection ? onClearCollection : onBack}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-white transition-colors shrink-0 py-1 px-2 -ml-2 rounded-md bg-white/[0.04] hover:bg-white/10"
          >
            <svg width="14" height="14" viewBox="0 0 10 10" fill="none">
              <path d="M6.5 2L3 5l3.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {activeCollection ? 'Collections' : 'Stories'}
          </button>
          {onHome && (
            <button
              onClick={onHome}
              className="ml-auto text-[11px] font-mono text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7L7 2.5L11.5 7M4 5.5V11.5h2.5V9h3v2.5H12V5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Home
            </button>
          )}
        </div>
      )}
      {/* Tabs — hidden when inside a collection (collection is a full destination) */}
      {!activeCollection && <div className={isV2()
        ? 'flex shrink-0 relative'
        : 'flex border-b border-[var(--border-subtle)] shrink-0 relative'
      }>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
            activeTab === 'map'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Map
          {sortedMoments.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">
              ({sortedMoments.length})
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('people')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
            activeTab === 'people'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          People
          {mixedList.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">({mixedList.length})</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
            activeTab === 'collections'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Collections
          {viewportCollections.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">({viewportCollections.length})</span>
          )}
        </button>
        {/* Sliding tab underline */}
        <div
          className={`absolute bottom-0 left-0 h-0.5 bg-[var(--accent-red)] ${
            hasTabRendered.current
              ? 'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
              : ''
          }`}
          style={{ width: '33.33%', transform: `translateX(${TAB_INDEX[activeTab] * 100}%)` }}
        />
      </div>}

      {/* Content */}
      {/* Horizontal person strip — People tab only */}
      {activeTab === 'people' && personEntities.length > 0 && (
        <div
          className="flex gap-2 px-3 py-2 overflow-x-auto shrink-0 border-b border-[var(--border-subtle)]"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          <button
            onClick={() => setAnchorPersonId(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all duration-200 ${
              !anchorPersonId
                ? 'bg-[var(--accent-red)] text-white font-semibold shadow-md'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
            }`}
            style={{ scrollSnapAlign: 'start' }}
          >
            All
          </button>
          {[...personEntities]
            .sort((a, b) => b.maxNotability - a.maxNotability)
            .map((data) => (
              <div key={data.entity.id} style={{ scrollSnapAlign: 'start' }}>
                <PersonChip
                  entity={data.entity}
                  momentCount={data.momentCount}
                  isActive={anchorPersonId === data.entity.id}
                  onClick={(e) => setAnchorPersonId(e.id)}
                />
              </div>
            ))
          }
        </div>
      )}

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 pb-24 lg:pb-[40vh]" style={{ touchAction: 'pan-y' }}>
        {/* Inner wrapper: min-height forces tiny overflow so iOS bounce/rubber-band always works */}
        <div style={{ minHeight: 'calc(100% + 1px)' }} className="space-y-3">
        {activeTab === 'map' ? (
          sortedMoments.length === 0 ? (
            <EmptyState
              message={searchQuery ? 'No events match your search' : 'Pan or zoom the map to see events in this area'}
              onSurpriseMe={onSurpriseMe}
            />
          ) : (
            <>
              {/* Sort toggle */}
              <div className="flex items-center gap-1 mb-2 text-[10px] font-mono">
                {(['notable', 'nearest', 'oldest'] as const).map((mode, i) => (
                  <span key={mode} className="flex items-center">
                    {i > 0 && <span className="text-[var(--text-muted)] mx-1">·</span>}
                    <button
                      onClick={() => {
                        hasManualSort.current = true;
                        setMomentSort(mode);
                        if (mode === 'nearest' && !userLocation) onRequestGeo?.();
                      }}
                      className={`transition-colors ${
                        momentSort === mode
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  </span>
                ))}
              </div>
              {sortedMoments.map((vl) => {
                const key = `${vl.story?.id ?? 'no-story'}-${vl.location.id}`;
                return (
                  <LocationCard
                    key={key}
                    ref={(el) => {
                      if (el) locationCardRefs.current.set(key, el);
                      else locationCardRefs.current.delete(key);
                    }}
                    location={vl.location}
                    story={vl.story ?? undefined}
                    isActive={activeLocationId === vl.location.id || scrollActiveMomentKey === key}
                    isExpanded={expandedLocationKey === key}
                    compact={useCompactCards && expandedLocationKey !== key}
                    showExpandChevron={!isMobile}
                    skipCanonicalFilter
                    parentStories={vl.story ? [vl.story] : []}
                    onClick={(moment) => {
                      setExpandedLocationKey(expandedLocationKey === key ? null : key);
                      onScrollHighlight([moment]);
                      if (mapInstance) {
                        panToAboveSheet(mapInstance, [moment.lat, moment.lng], sheetSnap, isSheetMobile, { duration: 0.3 });
                      }
                    }}
                    onStoryClick={(story) => onLocationSelect(vl.location, story)}
                    onEntityClick={onEntityClick ? (entity) => onEntityClick(entity) : undefined}
                  />
                );
              })}
              {/* Bottom padding for scroll detection — minimal to avoid black space */}
              <div className="h-16" />
            </>
          )
        ) : activeTab === 'collections' ? (
          activeCollection ? (
            /* Active collection — moment list with back header */
            <>
              <div className="sticky -top-3 z-10 -mx-3 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-3 py-1.5 flex items-center gap-1.5">
                <p className="text-[11px] font-mono text-[var(--text-primary)] truncate min-w-0">
                  {activeCollection.name}
                </p>
                <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 ml-auto">
                  {displayMoments.length} {displayMoments.length === 1 ? 'event' : 'events'}
                </span>
              </div>
              {displayMoments.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-[var(--text-muted)] font-mono">No events in this collection</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {displayMoments.map((moment) => {
                    const parentStory = momentToStoryMap.get(moment.id);
                    // Fallback stub for collection moments without a parent story
                    const storyOrStub = parentStory ?? ({
                      id: '__collection-stub__',
                      name: activeCollection?.name ?? 'Collection',
                      subtitle: '',
                      description: '',
                      category: 'dark-history',
                      moments: [],
                      years: '',
                      storyType: 'incident',
                      tags: [],
                    } as Story);
                    return (
                      <LocationCard
                        key={moment.id}
                        ref={(el) => {
                          if (el) cardRefs.current.set(moment.id, el);
                          else cardRefs.current.delete(moment.id);
                        }}
                        location={moment}
                        story={storyOrStub}
                        isActive={activeLocationId === moment.id || scrollActiveStoryId === moment.id}
                        isExpanded={expandedLocationKey === moment.id}
                        showExpandChevron
                        skipCanonicalFilter
                        parentStories={parentStory ? [parentStory] : []}
                        onClick={(m) => {
                          setExpandedLocationKey(expandedLocationKey === m.id ? null : m.id);
                          onScrollHighlight([m]);
                          onCollectionMomentClick?.(m);
                        }}
                        onStoryClick={parentStory ? (story) => onLocationSelect(moment, story) : undefined}
                        onEntityClick={onEntityClick ? (entity) => onEntityClick(entity) : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Collection list — no active collection */
            viewportCollections.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-[var(--text-muted)] font-mono">Pan or zoom the map to see collections in this area</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Curated Collections
                </p>
                {viewportCollections.map((collection) => {
                  const momentCount = collection.momentIds.length;
                  return (
                    <div
                      key={collection.id}
                      ref={(el) => {
                        if (el) collectionListCardRefs.current.set(collection.id, el);
                        else collectionListCardRefs.current.delete(collection.id);
                      }}
                      className={scrollActiveStoryId === collection.id
                        ? 'border-l-[3px] border-l-[var(--accent-red)] rounded-lg transition-all duration-300 bg-[var(--bg-card-hover)]/30'
                        : 'border-l-[3px] border-l-transparent rounded-lg transition-all duration-300'}
                    >
                      <CollectionCard
                        collection={collection}
                        momentCount={momentCount}
                        onClick={onCollectionSelect}
                      />
                    </div>
                  );
                })}
              </>
            )
          )
        ) : /* people tab — Anchor & Stream */ personEntities.length === 0 ? (
          <EmptyState
            message={searchQuery ? 'No people match your search' : 'No known people in this area — try zooming out'}
            onSurpriseMe={onSurpriseMe}
          />
        ) : anchorPersonId ? (
          /* Stream: selected person's moments */
          <>
            {(() => {
              const person = personEntities.find(p => p.entity.id === anchorPersonId);
              return person ? (
                <div className="mb-2">
                  <p className="text-[11px] font-mono text-[var(--text-muted)]">
                    {person.entity.name} · {anchorMoments.length} {anchorMoments.length === 1 ? 'event' : 'events'}
                  </p>
                  {person.entity.description && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{person.entity.description}</p>
                  )}
                  <button
                    onClick={() => onEntityClick?.(person.entity)}
                    className="text-[10px] text-[var(--accent-red)] hover:underline mt-1"
                  >
                    View full profile →
                  </button>
                </div>
              ) : null;
            })()}
            {anchorMoments.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">No events for this person in view</p>
            ) : (
              anchorMoments.map((moment) => {
                const parentStory = momentToStoryMap.get(moment.id);
                const storyOrStub = parentStory ?? ({
                  id: '__person-stub__',
                  name: 'Event',
                  subtitle: '',
                  description: '',
                  category: 'dark-history',
                  moments: [],
                  years: '',
                  storyType: 'incident',
                  tags: [],
                } as Story);
                return (
                  <LocationCard
                    key={moment.id}
                    location={moment}
                    story={storyOrStub}
                    isActive={activeLocationId === moment.id}
                    isExpanded={expandedLocationKey === moment.id}
                    showExpandChevron
                    skipCanonicalFilter
                    parentStories={parentStory ? [parentStory] : []}
                    onClick={(m) => {
                      setExpandedLocationKey(expandedLocationKey === m.id ? null : m.id);
                      onScrollHighlight([m]);
                      if (mapInstance) {
                        panToAboveSheet(mapInstance, [m.lat, m.lng], sheetSnap, isSheetMobile, { duration: 0.6 });
                      }
                    }}
                    onStoryClick={parentStory ? (story) => onLocationSelect(moment, story) : undefined}
                    onEntityClick={onEntityClick ? (entity) => onEntityClick(entity) : undefined}
                  />
                );
              })
            )}
            <div className="h-16" />
          </>
        ) : (
          /* "All" selected — show mixed people + stories list */
          <>
            {mixedList.map((item) => {
              if (item.kind === 'story') {
                return (
                  <StoryCard
                    key={item.story.id}
                    story={item.story}
                    onClick={onStorySelect}
                    compact={useCompactCards}
                  />
                );
              } else {
                return (
                  <PersonCard
                    key={`person-${item.data.entity.id}`}
                    data={item.data}
                    onClick={(entity) => onEntityClick?.(entity)}
                    compact={useCompactCards}
                  />
                );
              }
            })}
          </>
        )}

        </div>{/* end rubber-band wrapper */}
      </div>
    </div>
  );
}

function EmptyState({ message, onSurpriseMe }: { message: string; onSurpriseMe?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="text-3xl mb-1 opacity-30">&#x1F5FA;</div>
      <p className="text-sm text-[var(--text-muted)] font-mono">{message}</p>
      {onSurpriseMe && (
        <button
          onClick={onSurpriseMe}
          className="bg-[var(--accent-red)] hover:bg-[#ef4444] text-white px-4 py-1.5 rounded-md text-xs font-mono transition-colors"
        >
          Surprise Me — Go Somewhere Random
        </button>
      )}
    </div>
  );
}
