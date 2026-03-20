import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Entity, Story, Moment, StoryCategory, InteractionMode, ViewportLocation, StoryCollection } from '../../types';
import { getLocationsInBounds, getStoriesInBounds, distanceMiles } from '../../lib/geo';
import { getEffectiveNotability } from '../../lib/notability';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';
import { getViewportEntities, groupAlphabetically, getMomentsForEntity, canonicalStoryIds, type EntityWithCounts } from '../../lib/entityHelpers';
import { useAppData } from '../../lib/data/provider';
import { useUIVariant } from '../../lib/uiVariant';
import { panToAboveSheet } from '../../lib/sheetAwareMap';
import type { SheetSnap } from '../../lib/sheetAwareMap';
import { StoryCard } from './StoryCard';
import { PersonCard } from './PersonCard';
import { CollectionCard } from './CollectionCard';
import { LocationCard } from './LocationCard';

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
}

export type PanelTab = 'moments' | 'stories' | 'places' | 'collections';

const TAB_INDEX: Record<PanelTab, number> = { moments: 0, stories: 1, places: 2, collections: 3 };

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
}: ExplorePanelProps) {
  const { moments } = useAppData();
  const { variant } = useUIVariant();
  const momentMap = useMemo(() => buildMomentMap(moments), [moments]);
  const isSheetMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
  const sheetSnap: SheetSnap = sheetSnapProp ?? 'half';
  const [internalTab, setInternalTab] = useState<PanelTab>('stories');
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
  const [momentSort, setMomentSort] = useState<'notable' | 'nearest' | 'oldest'>('notable');
  const [storySort, setStorySort] = useState<'notable' | 'nearest' | 'a-z'>('notable');
  const [placeSort, setPlaceSort] = useState<'notable' | 'nearest' | 'a-z'>('notable');
  const hasManualSort = useRef(false);
  const [viewportStories, setViewportStories] = useState<Story[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [scrollActiveStoryId, setScrollActiveStoryId] = useState<string | null>(null);

  const [scrollActiveEntityId, setScrollActiveEntityId] = useState<string | null>(null);
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
  const placesCardRefs = useRef<Map<string, HTMLElement>>(new Map());
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
    if (activeTab !== 'stories' && activeTab !== 'collections') setScrollActiveStoryId(null);
    if (activeTab !== 'places') setScrollActiveEntityId(null);
    // Clear collection when leaving collections tab — collection is a destination, not a filter
    if (activeTab !== 'collections' && activeCollection) onClearCollection();
    // Clear map highlight to prevent ghosting from previous tab's scroll position
    onScrollHighlight([]);
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

    const allInBounds = getLocationsInBounds(sourceStories, bounds, momentMap);
    setViewportLocations(allInBounds);
    setViewportStories(getStoriesInBounds(sourceStories, bounds, momentMap));
    setMapZoom(mapInstance.getZoom());
  }, [mapInstance, stories, categoryFilter, momentMap]);

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
    const isStoriesTab = activeTab === 'stories';
    const isActiveCollectionTab = activeTab === 'collections' && activeCollection != null;
    const isCollectionsListTab = activeTab === 'collections' && activeCollection == null;
    if ((!isStoriesTab && !isActiveCollectionTab && !isCollectionsListTab) || !mapInstance) return;
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
                onModeChange('scroll');
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
          } else if (isActiveCollectionTab) {
            // Collection moment — highlight single pin + pan
            const collectionMoment = displayMoments.find(m => m.id === closestId);
            if (collectionMoment) {
              onModeChange('scroll');
              setScrollActiveStoryId(closestId);
              onScrollHighlight([collectionMoment]);
              clearTimeout(panTimeout.current);
              panTimeout.current = window.setTimeout(() => {
                panToAboveSheet(mapInstance, [collectionMoment.lat, collectionMoment.lng], sheetSnap, isSheetMobile, { duration: 0.15 });
              }, 80);
            }
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
  }, [activeTab, activeCollection, collections, mapInstance, filteredStories, viewportStories, onModeChange, updateViewport, displayMoments]);

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
    if (activeTab !== 'moments' || !mapInstance) return;
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
          const vl = viewportLocations.find(
            (v) => `${v.story.id}-${v.location.id}` === closestKey
          );
          if (vl) {
            setActiveLocationId(vl.location.id);
            onScrollHighlight([vl.location], vl.story.id);
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
  }, [activeTab, mapInstance, viewportLocations, onScrollHighlight, updateViewport]);

  // Stories tab: show viewport stories if available, else filtered stories
  // Filter out canonical stories — they're invisible infrastructure
  const displayStories = useMemo(() => {
    let result: Story[];
    if (searchQuery.trim()) result = filteredStories;
    else if (viewportStories.length > 0) result = viewportStories;
    else result = filteredStories;

    // Suppress canonical stories from browseable list
    result = result.filter(s => !canonicalStoryIds.has(s.id));

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

  // Alphabetical grouping of people for A-Z mode in Stories tab
  const personAlphabeticalGroups = useMemo(
    () => groupAlphabetically(personEntities),
    [personEntities]
  );

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

  // Place entities — shown in Places tab
  const placeEntities = useMemo(
    () => viewportEntities.filter((e) => e.entity.type === 'place'),
    [viewportEntities]
  );

  const placeAlphabeticalGroups = useMemo(
    () => groupAlphabetically(placeEntities),
    [placeEntities]
  );

  // Sorted places for Notable/Nearest modes
  const sortedPlaces = useMemo(() => {
    const arr = [...placeEntities];
    if (placeSort === 'notable') {
      return arr.sort((a, b) => {
        // Sort by max notability of associated moments, then momentCount as tiebreaker
        const diff = b.maxNotability - a.maxNotability;
        return diff !== 0 ? diff : b.momentCount - a.momentCount;
      });
    }
    if (placeSort === 'nearest' && userLocation) {
      return arr.sort((a, b) => {
        const aMoments = getMomentsForEntity(a.entity.id);
        const bMoments = getMomentsForEntity(b.entity.id);
        const aDist = aMoments.length > 0 ? Math.min(...aMoments.map(m => distanceMiles(userLocation.lat, userLocation.lng, m.lat, m.lng))) : Infinity;
        const bDist = bMoments.length > 0 ? Math.min(...bMoments.map(m => distanceMiles(userLocation.lat, userLocation.lng, m.lat, m.lng))) : Infinity;
        return hybridNearestScore(aDist, a.maxNotability, mapZoom) -
               hybridNearestScore(bDist, b.maxNotability, mapZoom);
      });
    }
    // a-z handled by placeAlphabeticalGroups
    return arr.sort((a, b) => a.entity.name.localeCompare(b.entity.name));
  }, [placeEntities, placeSort, userLocation, mapZoom]);

  const sortedMoments = useMemo(() => {
    let arr = [...viewportLocations];
    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      arr = arr.filter(
        (vl) =>
          vl.location.name.toLowerCase().includes(q) ||
          vl.location.subtitle?.toLowerCase().includes(q) ||
          vl.story.name.toLowerCase().includes(q)
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

  // Scroll-driven entity highlighting (Places tab)
  // Shows single primary pin for each entity (not all moments)
  useEffect(() => {
    if (activeTab !== 'places' || !mapInstance) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      cancelAnimationFrame(scrollRafId.current);
      scrollRafId.current = requestAnimationFrame(() => {
        // Suppress viewport updates while scrolling — same guard as Stories/Moments tabs
        isScrollDriving.current = true;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = window.setTimeout(() => {
          isScrollDriving.current = false;
          updateViewport();
        }, 400);

        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height * 0.4;
        let closestId: string | null = null;
        let closestDist = Infinity;

        placesCardRefs.current.forEach((el, id) => {
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenter - centerY);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
          }
        });

        if (closestId) {
          setScrollActiveEntityId(closestId);
          // Highlight only the first (primary) moment for this entity — single pin
          const entityMoments = getMomentsForEntity(closestId);
          if (entityMoments.length > 0) {
            onScrollHighlight([entityMoments[0]]);
            clearTimeout(panTimeout.current);
            panTimeout.current = window.setTimeout(() => {
              panToAboveSheet(mapInstance, [entityMoments[0].lat, entityMoments[0].lng], sheetSnap, isSheetMobile, { duration: 0.6 });
            }, 150);
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
  }, [activeTab, mapInstance, placeEntities, onScrollHighlight, updateViewport]);

  const renderPlaceRow = (entity: Entity, momentCount: number, isActive: boolean) => (
    <button
      key={entity.id}
      ref={(el) => {
        if (el) placesCardRefs.current.set(entity.id, el);
        else placesCardRefs.current.delete(entity.id);
      }}
      onClick={() => onEntityClick?.(entity)}
      className={`w-full flex items-start gap-2.5 px-1 py-2.5 text-left transition-colors group rounded border-b border-[var(--border-subtle)]/30 ${
        isActive ? 'bg-[var(--bg-card-hover)]' : 'hover:bg-[var(--bg-card)]'
      }`}
    >
      {/* Place icon */}
      <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-[rgba(59,130,246,0.12)] ring-1 ring-[rgba(59,130,246,0.3)] mt-0.5">
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" className="text-[rgba(59,130,246,0.7)]">
          <path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5zm0 6.75a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5z" fill="currentColor"/>
        </svg>
      </span>
      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-sans font-semibold transition-colors truncate block ${
          isActive ? 'text-white' : 'text-[var(--text-primary)] group-hover:text-white'
        }`}>
          {entity.name}
        </span>
        {entity.description && (
          <span className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
            {entity.description}
          </span>
        )}
      </div>
      {/* Years */}
      {entity.years && (
        <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0 mt-0.5">
          {entity.years}
        </span>
      )}
      {/* Moment count */}
      <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0 mt-0.5">
        {momentCount}m
      </span>
      {/* Chevron */}
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors opacity-50 mt-1.5">
        <path d="M3 1.5L5.5 4 3 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Tabs — hidden when inside a collection (collection is a full destination) */}
      {!activeCollection && <div className="flex border-b border-[var(--border-subtle)] shrink-0 relative">
        <button
          onClick={() => setActiveTab('moments')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
            activeTab === 'moments'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Moments
          {sortedMoments.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">
              ({sortedMoments.length})
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('stories')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
            activeTab === 'stories'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Stories
          {mixedList.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">({mixedList.length})</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('places')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
            activeTab === 'places'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Places
          {placeEntities.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">({placeEntities.length})</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 min-w-0 py-2.5 text-xs font-mono transition-colors ${
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
          style={{ width: '25%', transform: `translateX(${TAB_INDEX[activeTab] * 100}%)` }}
        />
      </div>}

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 pb-24 lg:pb-[40vh]">
        {/* Inner wrapper: min-height forces tiny overflow so iOS bounce/rubber-band always works */}
        <div style={{ minHeight: 'calc(100% + 1px)' }} className="space-y-3">
        {activeTab === 'moments' ? (
          sortedMoments.length === 0 ? (
            <EmptyState
              message={searchQuery ? 'No moments match your search' : 'Pan or zoom the map to see moments in this area'}
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
                const key = `${vl.story.id}-${vl.location.id}`;
                return (
                  <LocationCard
                    key={key}
                    ref={(el) => {
                      if (el) locationCardRefs.current.set(key, el);
                      else locationCardRefs.current.delete(key);
                    }}
                    location={vl.location}
                    story={vl.story}
                    isActive={activeLocationId === vl.location.id}
                    isExpanded={expandedLocationKey === key}
                    compact={useCompactCards && expandedLocationKey !== key}
                    showExpandChevron={!isMobile}
                    skipCanonicalFilter
                    parentStories={[vl.story]}
                    onClick={(moment) => {
                      setExpandedLocationKey(expandedLocationKey === key ? null : key);
                      setActiveLocationId(moment.id);
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
        ) : activeTab === 'places' ? (
          placeEntities.length === 0 ? (
            <EmptyState
              message="Pan or zoom the map to see places in this area"
              onSurpriseMe={onSurpriseMe}
            />
          ) : (
            <div>
              {/* Sort toggle */}
              <div className="flex items-center gap-1 mb-2 text-[10px] font-mono">
                {(['notable', 'nearest', 'a-z'] as const).map((mode, i) => (
                  <span key={mode} className="flex items-center">
                    {i > 0 && <span className="text-[var(--text-muted)] mx-1">·</span>}
                    <button
                      onClick={() => {
                        hasManualSort.current = true;
                        setPlaceSort(mode);
                        if (mode === 'nearest' && !userLocation) onRequestGeo?.();
                      }}
                      className={`transition-colors ${
                        placeSort === mode
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {mode === 'a-z' ? 'A-Z' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  </span>
                ))}
              </div>
              {placeSort === 'a-z' ? (
                /* Alphabetical with letter headers */
                Array.from(placeAlphabeticalGroups.entries()).map(([letter, items]) => (
                  <div key={letter}>
                    <div className="sticky top-0 z-[9] px-1 py-0.5 text-[10px] font-mono font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                      {letter}
                    </div>
                    {items.map(({ entity, momentCount }) => renderPlaceRow(entity, momentCount, scrollActiveEntityId === entity.id))}
                  </div>
                ))
              ) : (
                /* Notable / Nearest — flat sorted list */
                sortedPlaces.map(({ entity, momentCount }) => renderPlaceRow(entity, momentCount, scrollActiveEntityId === entity.id))
              )}
              {/* Bottom padding for scroll detection — minimal to avoid black space */}
              <div className="h-16" />
            </div>
          )
        ) : activeTab === 'collections' ? (
          activeCollection ? (
            /* Active collection — moment list with back header */
            <>
              <div className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-3 py-2 flex items-center gap-2.5">
                <button
                  onClick={onClearCollection}
                  className="text-[var(--text-muted)] hover:text-white transition-colors shrink-0"
                  title="Back to all collections"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-sans font-semibold text-[var(--text-primary)] truncate">
                    {activeCollection.name}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--text-muted)]">
                    {displayMoments.length} {displayMoments.length === 1 ? 'location' : 'locations'}
                  </p>
                </div>
              </div>
              {displayMoments.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-[var(--text-muted)] font-mono">No locations in this collection</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {displayMoments.map((moment) => {
                    const parentStory = momentToStoryMap.get(moment.id);
                    if (!parentStory) return null;
                    return (
                      <LocationCard
                        key={moment.id}
                        ref={(el) => {
                          if (el) cardRefs.current.set(moment.id, el);
                          else cardRefs.current.delete(moment.id);
                        }}
                        location={moment}
                        story={parentStory}
                        isActive={scrollActiveStoryId === moment.id}
                        isExpanded={expandedLocationKey === moment.id}
                        showExpandChevron
                        skipCanonicalFilter
                        parentStories={[parentStory]}
                        onClick={(m) => {
                          setExpandedLocationKey(expandedLocationKey === m.id ? null : m.id);
                          onScrollHighlight([m]);
                          if (mapInstance) {
                            panToAboveSheet(mapInstance, [m.lat, m.lng], sheetSnap, isSheetMobile, { duration: 0.3 });
                          }
                        }}
                        onStoryClick={(story) => onLocationSelect(moment, story)}
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
        ) : /* stories tab (default) */ (storySort === 'a-z' ? personEntities.length === 0 : mixedList.length === 0) ? (
          <EmptyState
            message={searchQuery ? 'No stories match your search' : storySort === 'a-z' ? 'No people in this area — zoom out or pan around' : 'No stories in this area — zoom out or pan around'}
            onSurpriseMe={onSurpriseMe}
          />
        ) : (
          <>
            {/* Sort toggle */}
            <div className="flex items-center gap-1 mb-2 text-[10px] font-mono">
              {(['notable', 'nearest', 'a-z'] as const).map((mode, i) => (
                <span key={mode} className="flex items-center">
                  {i > 0 && <span className="text-[var(--text-muted)] mx-1">·</span>}
                  <button
                    onClick={() => {
                      hasManualSort.current = true;
                      setStorySort(mode);
                      if (mode === 'nearest' && !userLocation) onRequestGeo?.();
                    }}
                    className={`transition-colors ${
                      storySort === mode
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {mode === 'a-z' ? 'A-Z (People)' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                </span>
              ))}
            </div>
            {storySort === 'a-z' ? (
              /* A-Z people with letter headers */
              <>
                {Array.from(personAlphabeticalGroups.entries()).map(([letter, items]) => (
                  <div key={letter}>
                    <div className="sticky top-0 z-[9] px-1 py-0.5 text-[10px] font-mono font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                      {letter}
                    </div>
                    {items.map((personData) => (
                      <div
                        key={`person-${personData.entity.id}`}
                        ref={(el) => {
                          if (el) cardRefs.current.set(personData.entity.id, el);
                          else cardRefs.current.delete(personData.entity.id);
                        }}
                        className={scrollActiveStoryId === personData.entity.id
                          ? 'border-l-[3px] border-l-[rgba(139,92,246,0.6)] rounded-lg transition-all duration-300 bg-[var(--bg-card-hover)]/30'
                          : 'border-l-[3px] border-l-transparent rounded-lg transition-all duration-300'}
                      >
                        <PersonCard
                          data={personData}
                          onClick={(e) => onEntityClick?.(e)}
                          compact={useCompactCards}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              /* Mixed story + person cards (Notable / Nearest) */
              mixedList.map((item) => {
                if (item.kind === 'story') {
                  return (
                    <div
                      key={item.story.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(item.story.id, el);
                        else cardRefs.current.delete(item.story.id);
                      }}
                      className={scrollActiveStoryId === item.story.id
                        ? 'border-l-[3px] border-l-[var(--accent-red)] rounded-lg transition-all duration-300 bg-[var(--bg-card-hover)]/30'
                        : 'border-l-[3px] border-l-transparent rounded-lg transition-all duration-300'}
                    >
                      <StoryCard
                        story={item.story}
                        onClick={onStorySelect}
                        compact={useCompactCards}
                        distanceMi={
                          userLocation
                            ? nearestDistance(item.story, userLocation.lat, userLocation.lng, momentMap)
                            : undefined
                        }
                      />
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={`person-${item.data.entity.id}`}
                      ref={(el) => {
                        if (el) cardRefs.current.set(item.data.entity.id, el);
                        else cardRefs.current.delete(item.data.entity.id);
                      }}
                      className={scrollActiveStoryId === item.data.entity.id
                        ? 'border-l-[3px] border-l-[rgba(139,92,246,0.6)] rounded-lg transition-all duration-300 bg-[var(--bg-card-hover)]/30'
                        : 'border-l-[3px] border-l-transparent rounded-lg transition-all duration-300'}
                    >
                      <PersonCard
                        data={item.data}
                        onClick={(entity) => onEntityClick?.(entity)}
                        compact={useCompactCards}
                        distanceMi={item.distance > 0 ? item.distance : undefined}
                      />
                    </div>
                  );
                }
              })
            )}
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
