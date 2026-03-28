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
import { CollectionCard } from './CollectionCard';
import { LocationCard } from './LocationCard';

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
  panelView?: PanelView;
  onPanelViewChange?: (view: PanelView) => void;
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

/** @deprecated Use PanelView instead — kept for backward compatibility during migration */
export type PanelTab = 'moments' | 'stories' | 'places' | 'collections';

export type PanelView = 'feed' | 'library';

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
  panelView: controlledView,
  onPanelViewChange,
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
  const [internalView, setInternalView] = useState<PanelView>('feed');
  const panelView = controlledView ?? internalView;
  const setPanelView = useCallback((view: PanelView) => {
    if (onPanelViewChange) onPanelViewChange(view);
    else setInternalView(view);
  }, [onPanelViewChange]);
  // activeTab alias removed in cold-open — panelView drives the UI directly
  const [expandedLocationKey, setExpandedLocationKey] = useState<string | null>(null);
  const [viewportLocations, setViewportLocations] = useState<ViewportLocation[]>([]);
  const viewportLocationsRef = useRef<ViewportLocation[]>(viewportLocations);
  viewportLocationsRef.current = viewportLocations;
  const [momentSort, setMomentSort] = useState<'notable' | 'nearest' | 'oldest'>('notable');
  const [storySort, setStorySort] = useState<'notable' | 'nearest' | 'a-z'>('notable');
  const hasManualSort = useRef(false);
  const [viewportStories, setViewportStories] = useState<Story[]>([]);
  // activeLocationId comes from props (driven by App.tsx activeLocation)
  const [scrollActiveStoryId, setScrollActiveStoryId] = useState<string | null>(null);

  const [_scrollActiveEntityId, setScrollActiveEntityId] = useState<string | null>(null);
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

  // Auto-switch to feed when a collection is selected (collection moments show in the feed)
  useEffect(() => {
    if (activeCollection) {
      setPanelView('feed');
    }
  }, [activeCollection]);

  // Clear scroll highlight when switching between feed and library
  useEffect(() => {
    if (panelView === 'library') {
      setScrollActiveStoryId(null);
      setScrollActiveEntityId(null);
      onScrollHighlight([]);
      onModeChange('explore');
    }
  }, [panelView]);

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

  // Scroll-driven navigation (active collection view)
  useEffect(() => {
    const isActiveCollectionTab = panelView === 'feed' && activeCollection != null;
    if (!isActiveCollectionTab || !mapInstance) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      cancelAnimationFrame(scrollRafId.current);
      scrollRafId.current = requestAnimationFrame(() => {
        isScrollDriving.current = true;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = window.setTimeout(() => {
          isScrollDriving.current = false;
          updateViewport();
        }, 600);

        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height * 0.4;

        // Collection list scroll removed in cold-open (collection list is in library)

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
  }, [panelView, activeCollection, collections, mapInstance, filteredStories, viewportStories, onModeChange, updateViewport, displayMoments, onCollectionScrollHighlight]);

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
  // (only relevant in library view, which doesn't have bidirectional scroll — disabled in cold-open)
  useEffect(() => {
    const isCollectionsListTab = false; // Disabled in cold-open — collections list is in library
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
  }, [panelView, activeCollection, viewportCollections, mapInstance]);

  // Scroll-driven location navigation (Feed view — moments)
  useEffect(() => {
    if (panelView !== 'feed' || activeCollection || !mapInstance) return;
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
  }, [panelView, activeCollection, mapInstance, onScrollHighlight, updateViewport]);

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

  // (Stories mixed list, places, place sorts removed in cold-open — those are in the library now)

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

  // Places scroll-driven highlighting removed in cold-open (places are in the library now)

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
            {activeCollection ? 'Feed' : 'Back'}
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
      {/* Tab bar removed in cold-open — single feed or library */}

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 pb-24 lg:pb-[40vh]">
        {/* Inner wrapper: min-height forces tiny overflow so iOS bounce/rubber-band always works */}
        <div style={{ minHeight: 'calc(100% + 1px)' }} className="space-y-3">

        {panelView === 'library' ? (
          /* ── Library / Directory View ── */
          <LibraryView
            collections={collections}
            browseableStories={stories}
            personEntities={personEntities}
            onCollectionSelect={onCollectionSelect}
            onStorySelect={onStorySelect}
            onEntityClick={onEntityClick}
            onClose={() => setPanelView('feed')}
          />
        ) : activeCollection ? (
          /* ── Active Collection — moment cards ── */
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
          /* ── Feed View — viewport-filtered moments ── */
          sortedMoments.length === 0 ? (
            <EmptyState
              message={searchQuery ? 'No events match your search' : 'Pan or zoom the map to discover events in this area'}
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
              {sortedMoments.map((vl, index) => {
                const key = `${vl.story?.id ?? 'no-story'}-${vl.location.id}`;
                const isHero = index === 0;
                return (
                  <div key={key} className={isHero ? 'cold-open-hero' : ''}>
                    <LocationCard
                      ref={(el) => {
                        if (el) locationCardRefs.current.set(key, el);
                        else locationCardRefs.current.delete(key);
                      }}
                      location={vl.location}
                      story={vl.story ?? undefined}
                      isActive={activeLocationId === vl.location.id || scrollActiveMomentKey === key}
                      isExpanded={isHero || expandedLocationKey === key}
                      compact={!isHero && useCompactCards && expandedLocationKey !== key}
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
                  </div>
                );
              })}
              {/* Bottom padding for scroll detection */}
              <div className="h-16" />
            </>
          )
        )}

        </div>{/* end rubber-band wrapper */}
      </div>
    </div>
  );
}

/** Library / Directory view — collections, people, stories */
function LibraryView({
  collections,
  browseableStories,
  personEntities: _viewportPeople,
  onCollectionSelect,
  onStorySelect,
  onEntityClick,
  onClose,
}: {
  collections: StoryCollection[];
  browseableStories: Story[];
  personEntities: EntityWithCounts[];
  onCollectionSelect: (c: StoryCollection) => void;
  onStorySelect: (s: Story) => void;
  onEntityClick?: (e: Entity) => void;
  onClose: () => void;
}) {
  // Get ALL entities (not viewport-filtered) for the library directory
  const { entities } = useAppData();
  const allPeople = useMemo(
    () => entities
      .filter(e => e.type === 'person')
      .sort((a, b) => (a.name > b.name ? 1 : -1)),
    [entities]
  );

  // Sort stories by notability (uses story name as proxy — already sorted by App.tsx)
  const sortedStories = useMemo(
    () => [...browseableStories].slice(0, 50), // Limit for performance
    [browseableStories]
  );

  return (
    <div className="space-y-6">
      {/* Back to feed */}
      <button
        onClick={onClose}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-white transition-colors py-1 px-2 -ml-1 rounded-md bg-white/[0.04] hover:bg-white/10"
      >
        <svg width="14" height="14" viewBox="0 0 10 10" fill="none">
          <path d="M6.5 2L3 5l3.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to feed
      </button>

      {/* Collections section */}
      {collections.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Collections
          </p>
          <div className="grid grid-cols-2 gap-2">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                momentCount={collection.momentIds.length}
                onClick={onCollectionSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* People section */}
      {allPeople.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
            People ({allPeople.length})
          </p>
          <div className="space-y-0.5">
            {allPeople.map((entity) => (
              <button
                key={`lib-person-${entity.id}`}
                onClick={() => onEntityClick?.(entity)}
                className="w-full flex items-center gap-2 px-2 py-2 text-left rounded-md hover:bg-[var(--bg-card)] transition-colors group"
              >
                <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[rgba(139,92,246,0.12)] ring-1 ring-[rgba(139,92,246,0.3)]">
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none" className="text-[rgba(139,92,246,0.7)]">
                    <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M2 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-sans font-medium text-[var(--text-primary)] group-hover:text-white truncate block">
                    {entity.name}
                  </span>
                  {entity.years && (
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{entity.years}</span>
                  )}
                </div>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0 text-[var(--text-muted)] opacity-50">
                  <path d="M3 1.5L5.5 4 3 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stories section */}
      {sortedStories.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Stories
          </p>
          <div className="space-y-2">
            {sortedStories.map((story) => (
              <StoryCard
                key={`lib-story-${story.id}`}
                story={story}
                onClick={onStorySelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom padding */}
      <div className="h-16" />
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
