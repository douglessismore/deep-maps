import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { MapView, smartFlyToBounds } from './components/map/MapView';
import { ExplorePanel, type PanelTab } from './components/panel/ExplorePanel';
import { Header } from './components/ui/Header';
import { BottomSheet, type SheetSnap } from './components/ui/BottomSheet';
import { ClaudeSheet } from './components/ui/ClaudeSheet';
import { CinemaSheet } from './components/ui/CinemaSheet';
import { FadeIn } from './components/ui/FadeIn';
import { PanelSkeleton } from './components/ui/Skeleton';
import { VariantToggle } from './components/ui/VariantToggle';
import { getSheetAwarePadding } from './lib/sheetAwareMap';
import { CATEGORIES } from './lib/categories';
import { useUIVariant } from './lib/uiVariant';

const StoryPanel = lazy(() => import('./components/panel/StoryPanel').then(m => ({ default: m.StoryPanel })));
const EntityPanel = lazy(() => import('./components/panel/EntityPanel').then(m => ({ default: m.EntityPanel })));
import { TimelineBar } from './components/ui/TimelineBar';
import { parseYears } from './lib/timeline';
import { buildMomentMap, resolveLocationsFromMap } from './lib/storyHelpers';
import { getEntityLocations } from './lib/entityHelpers';
import { useAppData } from './lib/data/provider';
import type { Entity, Story, Moment, StoryCategory, StoryCollection, InteractionMode } from './types';
import L from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';

type SavedMapView = { center: [number, number]; zoom: number };

type NavEntry = {
  mode: InteractionMode;
  activeStory: Story | null;
  activeLocation: Moment | null;
  activeEntity: Entity | null;
  activeCollection: StoryCollection | null;
  categoryFilter: StoryCategory | null;
  savedMapView?: SavedMapView;
  exploreTab?: PanelTab;
  exploreScrollTop?: number;
};

function App() {
  const { moments, stories, collections } = useAppData();
  const { variant } = useUIVariant();
  const momentMap = useMemo(() => buildMomentMap(moments), [moments]);
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [mode, setMode] = useState<InteractionMode>('explore');
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [activeLocation, setActiveLocation] = useState<Moment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StoryCategory | null>(null);
  const [scrollHighlight, setScrollHighlight] = useState<Moment[]>([]);
  const [activeCollection, setActiveCollection] = useState<StoryCollection | null>(null);
  const [activeEntity, setActiveEntity] = useState<Entity | null>(null);
  const [resetViewKey, setResetViewKey] = useState(0);
  const [timelineViewRange, setTimelineViewRange] = useState<[number, number] | null>(null);
  const [mapVisibleStoryIds, setMapVisibleStoryIds] = useState<Set<string> | null>(null);
  const [navHistory, setNavHistory] = useState<NavEntry[]>([]);
  const [exploreTab, setExploreTab] = useState<PanelTab>('stories');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [nearMeZoomKey, setNearMeZoomKey] = useState(0);
  const [restoreView, setRestoreView] = useState<SavedMapView | null>(null);
  const exploreScrollTop = useRef(0);
  const [restoreScrollTop, setRestoreScrollTop] = useState<number | null>(null);
  const [zoomToActiveLocation, setZoomToActiveLocation] = useState(false);
  const autoGeoRequested = useRef(false);

  // Bottom sheet snap state (mobile only)
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek');
  // In split mode there's no bottom sheet — tell panels the sheet is "full"
  // so panToAboveSheet uses no offset. Without this, panels apply peek/half
  // offsets that push pins north and cause the map to pan out of the zoomed area.
  const effectiveSheetSnap: SheetSnap = (variant === 'split' && isMobile) ? 'full' : sheetSnap;
  // Programmatic snap target — changes trigger sheet animation
  const [targetSheetSnap, setTargetSheetSnap] = useState<SheetSnap | undefined>(undefined);
  // Save pre-navigation snap so we can restore it on back
  const preNavSheetSnap = useRef<SheetSnap>('peek');

  // Refit map bounds when sheet snap changes in story/entity mode
  // (e.g., user pulls sheet down to peek → show all story pins in the now-larger map area)
  const prevSheetSnap = useRef(sheetSnap);
  useEffect(() => {
    if (sheetSnap === prevSheetSnap.current) return;
    prevSheetSnap.current = sheetSnap;
    if (!mapInstance || !isMobile) return;

    const containerH = mapInstance.getSize().y;
    const padOpts = getSheetAwarePadding(isMobile, sheetSnap, containerH);

    if (mode === 'story' && activeStory && !activeLocation) {
      const coords = resolveLocationsFromMap(activeStory, momentMap).map(
        (loc) => [loc.lat, loc.lng] as [number, number]
      );
      if (coords.length > 0) {
        smartFlyToBounds(mapInstance, L.latLngBounds(coords), { ...padOpts, maxZoom: 12, duration: 0.8 });
      }
    } else if (mode === 'entity' && activeEntity) {
      const entLocs = getEntityLocations(activeEntity.id);
      const coords = entLocs.map(({ location: l }) => [l.lat, l.lng] as [number, number]);
      if (coords.length > 0) {
        smartFlyToBounds(mapInstance, L.latLngBounds(coords), { ...padOpts, maxZoom: 12, duration: 0.8 });
      }
    }
  }, [sheetSnap, mode, activeStory, activeEntity, activeLocation, mapInstance, isMobile, momentMap]);

  // Track which stories have pins visible on the map (for timeline dimming)
  useEffect(() => {
    if (!mapInstance) return;
    let rafId = 0;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const bounds = mapInstance.getBounds();
        const ids = new Set<string>();
        for (const story of stories) {
          for (const sm of story.moments) {
            const m = momentMap.get(sm.momentId);
            if (m && bounds.contains([m.lat, m.lng])) {
              ids.add(story.id);
              break; // one visible pin is enough
            }
          }
        }
        setMapVisibleStoryIds(ids);
      });
    };
    update();
    mapInstance.on('moveend', update);
    mapInstance.on('zoomend', update);
    return () => {
      cancelAnimationFrame(rafId);
      mapInstance.off('moveend', update);
      mapInstance.off('zoomend', update);
    };
  }, [mapInstance, stories, momentMap]);

  // Auto-request geolocation on first load
  useEffect(() => {
    if (autoGeoRequested.current || !navigator.geolocation) return;
    autoGeoRequested.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Silently fail — user denied or timed out, fall back to default view
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 }
    );
  }, []);

  // Moment→Story reverse lookup (which story owns each moment?)
  const momentToStoryMap = useMemo(() => {
    const map = new Map<string, Story>();
    stories.forEach(story => {
      story.moments.forEach(sm => {
        if (!map.has(sm.momentId)) map.set(sm.momentId, story);
      });
    });
    return map;
  }, [stories]);

  // When a collection is active, resolve its moments
  const displayMoments = useMemo(() => {
    if (!activeCollection) return [];
    const idSet = new Set(activeCollection.momentIds);
    return moments.filter(m => idSet.has(m.id));
  }, [activeCollection, moments]);

  // When a collection is active, filter stories to those that have moments in the collection
  const displayStories = useMemo(() => {
    if (!activeCollection) return stories;
    const midSet = new Set(activeCollection.momentIds);
    return stories.filter(s => s.moments.some(sm => midSet.has(sm.momentId)));
  }, [activeCollection, stories]);

  // Filter stories by timeline view range (when user has interacted with timeline)
  const timelineFilteredStories = useMemo(() => {
    if (!timelineViewRange) return displayStories;
    const [rangeStart, rangeEnd] = timelineViewRange;
    return displayStories.filter((s) => {
      const [start, end] = parseYears(s.years);
      return end >= rangeStart && start <= rangeEnd;
    });
  }, [displayStories, timelineViewRange]);

  // Story IDs matching the timeline filter — passed to MapView to hide non-matching pins
  const timelineStoryIdFilter = useMemo(() => {
    if (!timelineViewRange) return null; // No filter active
    return new Set(timelineFilteredStories.map(s => s.id));
  }, [timelineViewRange, timelineFilteredStories]);

  // Which story is scroll-highlighted (for timeline dot pulse).
  // Prefer the directly-supplied storyId (fast path) over the expensive fallback lookup.
  const [scrollHighlightDirectId, setScrollHighlightDirectId] = useState<string | null>(null);
  const scrollHighlightStoryId = useMemo(() => {
    if (scrollHighlightDirectId) return scrollHighlightDirectId;
    if (scrollHighlight.length === 0) return null;
    const highlightIds = new Set(scrollHighlight.map(m => m.id));
    return stories.find((s) => resolveLocationsFromMap(s, momentMap).some((l) => highlightIds.has(l.id)))?.id ?? null;
  }, [scrollHighlightDirectId, scrollHighlight, stories, momentMap]);

  // Push current state onto navigation history before changing
  const pushNav = useCallback(() => {
    const savedMapView: SavedMapView | undefined = mapInstance
      ? { center: [mapInstance.getCenter().lat, mapInstance.getCenter().lng], zoom: mapInstance.getZoom() }
      : undefined;
    // Save current sheet snap before navigating deeper
    preNavSheetSnap.current = sheetSnap;
    setNavHistory((prev) => {
      const entry: NavEntry = { mode, activeStory, activeLocation, activeEntity, activeCollection, categoryFilter, savedMapView, exploreTab, exploreScrollTop: exploreScrollTop.current };
      const next = [...prev, entry];
      return next.length > 10 ? next.slice(-10) : next;
    });
    // Expand sheet to half when navigating into content
    setTargetSheetSnap('half');
  }, [mode, activeStory, activeLocation, activeEntity, activeCollection, categoryFilter, mapInstance, exploreTab, sheetSnap]);

  // Clear activeCollection when navigating to a story NOT in the collection
  const handleStorySelect = useCallback((story: Story) => {
    pushNav();

    if (activeCollection && !story.moments.some(sm => activeCollection.momentIds.includes(sm.momentId))) {
      setActiveCollection(null);
    }
    setActiveStory(story);
    setActiveLocation(null);
    setActiveEntity(null);
    setCategoryFilter(null);
    setScrollHighlight([]);
    scrollHighlightIdsRef.current = '';
    setMode('story');
  }, [activeCollection, pushNav]);

  const handleLocationSelect = useCallback((location: Moment, story: Story) => {
    pushNav();

    if (activeCollection && !story.moments.some(sm => activeCollection.momentIds.includes(sm.momentId))) {
      setActiveCollection(null);
    }
    setActiveStory(story);
    setActiveLocation(location);
    setActiveEntity(null);
    setScrollHighlight([]);
    scrollHighlightIdsRef.current = '';
    setZoomToActiveLocation(true);
    setMode('story');
  }, [activeCollection, pushNav]);

  // Scroll-driven location select — no history push (avoids back-button pollution)
  const handleScrollLocationSelect = useCallback((location: Moment, story: Story) => {
    if (activeCollection && !story.moments.some(sm => activeCollection.momentIds.includes(sm.momentId))) {
      setActiveCollection(null);
    }
    setActiveStory(story);
    setActiveLocation(location);
    setScrollHighlight([]);
    scrollHighlightIdsRef.current = '';
    setZoomToActiveLocation(false);
    setMode('story');
  }, [activeCollection]);

  // Back: pop from navigation history, or fall back to explore
  const handleBack = useCallback(() => {
    setNavHistory((prev) => {
      if (prev.length === 0) {
        // No history — go to explore (full reset including timeline)
        setActiveStory(null);
        setActiveLocation(null);
        setActiveEntity(null);
        setCategoryFilter(null);
        setTimelineViewRange(null);
        setMode('explore');
        setResetViewKey((k) => k + 1);
        // Restore sheet to pre-navigation position (or peek for full reset)
        setTargetSheetSnap(preNavSheetSnap.current);
        return prev;
      }
      const next = [...prev];
      const entry = next.pop()!;
      const restoredMode = entry.mode === 'scroll' ? 'explore' : entry.mode;
      setMode(restoredMode);

      setActiveStory(entry.activeStory);
      setActiveLocation(entry.activeLocation);
      setActiveEntity(entry.activeEntity);
      setActiveCollection(entry.activeCollection);
      setCategoryFilter(entry.categoryFilter);
      if (entry.exploreTab) setExploreTab(entry.exploreTab);
      if (entry.exploreScrollTop != null) setRestoreScrollTop(entry.exploreScrollTop);
      if (!entry.activeStory && !entry.activeEntity) {
        // Restore saved map view if available, otherwise reset to US center
        if (entry.savedMapView) {
          setRestoreView(entry.savedMapView);
        } else {
          setResetViewKey((k) => k + 1);
        }
        // Going back to explore — restore pre-navigation sheet position
        setTargetSheetSnap(preNavSheetSnap.current);
      } else {
        // Going back to a story/entity — keep sheet at half
        setTargetSheetSnap('half');
      }
      return next;
    });
  }, []);

  // Full reset → clears everything including collection, history, and timeline filter
  const handleBackToExplore = useCallback(() => {
    setActiveStory(null);
    setActiveLocation(null);
    setActiveEntity(null);
    setCategoryFilter(null);
    setActiveCollection(null);
    setSearchQuery('');
    setNavHistory([]);
    setTimelineViewRange(null);
    setMode('explore');
    setResetViewKey((k) => k + 1);
    setTargetSheetSnap('peek');
  }, []);

  const handleCollectionSelect = useCallback((collection: StoryCollection) => {
    pushNav();
    setActiveCollection(collection);
    setCategoryFilter(null);
    setActiveStory(null);
    setActiveLocation(null);
    setScrollHighlight([]);
    scrollHighlightIdsRef.current = '';
    setMode('explore');
    // Zoom handled by MapController's zoom effect when activeCollection changes
  }, [pushNav]);

  // Collection moment click — zoom to the moment (like story mode location click)
  const handleCollectionMomentClick = useCallback((moment: Moment) => {
    setActiveLocation(moment);
    setZoomToActiveLocation(true);
  }, []);

  // Collection scroll-driven highlight — pan without zoom (like story scroll)
  const handleCollectionScrollHighlight = useCallback((moment: Moment) => {
    setActiveLocation(moment);
    setZoomToActiveLocation(false);
  }, []);

  const handleModeChange = useCallback((newMode: InteractionMode) => {
    setMode(newMode);
    // Clear scroll highlight when entering story mode (full location select takes over)
    if (newMode === 'story') setScrollHighlight([]);
  }, []);

  // Deduplicate scrollHighlight — bail when moment IDs haven't changed.
  // Optional storyId shortcuts the expensive story-lookup in scrollHighlightStoryId.
  const scrollHighlightIdsRef = useRef<string>('');
  const handleScrollHighlight = useCallback((locations: Moment[], storyId?: string) => {
    // Inside a collection, never allow multi-moment highlights (prevents polylines)
    const safeLocations = activeCollection && locations.length > 1 ? [locations[0]] : locations;
    const key = safeLocations.map(m => m.id).join(',');
    if (key === scrollHighlightIdsRef.current) return; // same set — skip re-render
    scrollHighlightIdsRef.current = key;
    setScrollHighlightDirectId(storyId ?? null);
    setScrollHighlight(safeLocations);
  }, [activeCollection]);

  const handleCategoryFilter = useCallback((category: StoryCategory | null) => {
    setCategoryFilter(category);
    setActiveStory(null);
    setActiveLocation(null);
    setMode('explore');
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    setSearchQuery(`#${tag}`);
    setActiveStory(null);
    setActiveLocation(null);
    setMode('explore');
  }, []);

  // GPS-only request (no map zoom) — for sort triggers
  const handleRequestGeo = useCallback(() => {
    if (!navigator.geolocation || userLocation) return; // already have it or can't get it
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => { /* silent — sort will fall back to viewport center */ },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [userLocation]);

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setNearMeZoomKey((k) => k + 1);
        setGeoLoading(false);
        setGeoError(null);
      },
      (error) => {
        setGeoLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location access denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location unavailable');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out');
            break;
          default:
            setGeoError('Could not get location');
        }
        // Clear error after 8 seconds (visible on mobile where tooltip isn't available)
        setTimeout(() => setGeoError(null), 8000);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Search result: moment clicked — find its parent story and navigate
  const handleMomentSelect = useCallback((moment: Moment) => {
    const ownerStory = momentToStoryMap.get(moment.id);
    if (ownerStory) {
      handleLocationSelect(moment, ownerStory);
    }
  }, [momentToStoryMap, handleLocationSelect]);

  const handleSurpriseMe = useCallback(() => {
    pushNav();

    const randomStory = stories[Math.floor(Math.random() * stories.length)];
    const resolved = resolveLocationsFromMap(randomStory, momentMap);
    const randomLoc = resolved[Math.floor(Math.random() * resolved.length)];
    setCategoryFilter(null);
    setActiveStory(randomStory);
    setActiveLocation(randomLoc);
    setMode('story');
  }, [pushNav, stories, momentMap]);

  const handleEntitySelect = useCallback((entity: Entity, _fromMoment?: Moment) => {
    pushNav();

    setActiveEntity(entity);
    setActiveStory(null);
    setActiveLocation(null);
    setCategoryFilter(null);
    setScrollHighlight([]);
    scrollHighlightIdsRef.current = '';
    setMode('entity');
  }, [pushNav]);

  // Entity-mode location highlight — used for both scroll-driven and click-driven
  const handleEntityScrollLocationActive = useCallback((moment: Moment, _story: Story) => {
    setZoomToActiveLocation(false);
    setActiveLocation(moment);
  }, []);

  // Entity-mode moment click — zoom to it (separate from scroll)
  const handleEntityMomentClick = useCallback((moment: Moment, _story: Story) => {
    setZoomToActiveLocation(true);
    setActiveLocation(moment);
  }, []);

  // Entity-mode story click → navigate to story with optional moment active
  const handleEntityStoryClick = useCallback((story: Story, moment?: Moment) => {
    pushNav();

    if (activeCollection && !story.moments.some(sm => activeCollection.momentIds.includes(sm.momentId))) {
      setActiveCollection(null);
    }
    let targetMoment: Moment | null = null;
    if (moment) {
      const storyMomentIds = new Set(story.moments.map(sm => sm.momentId));
      if (storyMomentIds.has(moment.id)) {
        targetMoment = moment;
      }
    }
    setActiveStory(story);
    setActiveLocation(targetMoment);
    setActiveEntity(null);
    setMode('story');
  }, [activeCollection, pushNav]);

  // Map pin click — in entity mode, stay in entity mode; otherwise normal behavior
  const handleMapLocationClick = useCallback((location: Moment, story: Story) => {
    if (mode === 'entity') {
      // Just highlight — EntityPanel reacts via activeLocationId
      setActiveLocation(location);
    } else {
      handleLocationSelect(location, story);
    }
  }, [mode, handleLocationSelect]);

  // Entity locations for map display
  const entityLocations = useMemo(() => {
    if (mode !== 'entity' || !activeEntity) return undefined;
    return getEntityLocations(activeEntity.id);
  }, [mode, activeEntity]);

  // Contextual back label from navigation history
  const backLabel = useMemo(() => {
    if (navHistory.length === 0) return 'Stories';
    const prev = navHistory[navHistory.length - 1];
    if (prev.activeEntity) return prev.activeEntity.name;
    if (prev.activeStory) return prev.activeStory.name;
    if (prev.activeCollection) return prev.activeCollection.name;
    if (prev.mode === 'explore' && prev.exploreTab) {
      const tabLabels: Record<PanelTab, string> = {
        stories: 'Stories',
        places: 'Places',
        moments: 'Moments',
        collections: 'Collections',
      };
      return tabLabels[prev.exploreTab];
    }
    return 'Stories';
  }, [navHistory]);

  // ── Context labels for variant drag handles / HUDs ──
  const sheetContext = useMemo(() => {
    const none = { label: undefined as string | undefined, sublabel: undefined as string | undefined, momentCount: 0, currentMomentIndex: 0, categoryColor: '#fff' };
    if (mode === 'story' && activeStory) {
      const resolved = resolveLocationsFromMap(activeStory, momentMap);
      const activeIdx = activeLocation
        ? resolved.findIndex(l => l.id === activeLocation.id)
        : 0;
      const cat = CATEGORIES[activeStory.category];
      return {
        label: activeStory.name,
        sublabel: `${Math.max(activeIdx + 1, 1)} of ${resolved.length} moments`,
        momentCount: resolved.length,
        currentMomentIndex: Math.max(activeIdx, 0),
        categoryColor: cat?.color ?? '#fff',
      };
    }
    if (mode === 'entity' && activeEntity) {
      return { ...none, label: activeEntity.name, sublabel: activeEntity.type };
    }
    return { ...none, sublabel: `${timelineFilteredStories.length} stories` };
  }, [mode, activeStory, activeLocation, activeEntity, momentMap, timelineFilteredStories.length]);

  // Spotlight expand handler — tapping peek card expands sheet to full
  const handleExpandRequest = useCallback(() => {
    setTargetSheetSnap('full');
  }, []);

  // ── Shared panel content (used by both sheet and split layouts) ──
  const panelContent = (
    <Switch>
      <Route path="/">
        <Suspense fallback={<PanelSkeleton />}>
        {mode === 'entity' && activeEntity ? (
          <FadeIn key="entity">
          <EntityPanel
            entity={activeEntity}
            onStoryClick={handleEntityStoryClick}
            onEntityClick={handleEntitySelect}
            onScrollLocationActive={handleEntityScrollLocationActive}
            onMomentClick={handleEntityMomentClick}
            onScrollToTop={() => { setActiveLocation(null); setZoomToActiveLocation(false); }}
            activeLocationId={activeLocation?.id ?? null}
            onBack={handleBack}
            backLabel={backLabel}
            onHome={handleBackToExplore}
            sheetSnap={effectiveSheetSnap}
            onExpandRequest={handleExpandRequest}
          />
          </FadeIn>
        ) : mode === 'story' && activeStory ? (
          <FadeIn key="story">
          <StoryPanel
            story={activeStory}
            activeLocation={activeLocation}
            onLocationSelect={(loc) => {
              // In-story moment click: zoom to it but don't push nav history
              // (user expects one "back" to leave the story, not one per moment clicked)
              setActiveLocation(loc);
              setZoomToActiveLocation(true);
            }}
            onScrollLocationSelect={(loc) => handleScrollLocationSelect(loc, activeStory)}
            onScrollToTop={() => { setActiveLocation(null); setZoomToActiveLocation(false); }}
            onRelatedStoryClick={handleStorySelect}
            onTagClick={handleTagClick}
            allStories={stories}
            onBack={handleBack}
            backLabel={backLabel}
            onHome={handleBackToExplore}
            onEntityClick={handleEntitySelect}
            sheetSnap={effectiveSheetSnap}
            onExpandRequest={handleExpandRequest}
          />
          </FadeIn>
        ) : (
          <FadeIn key="explore">
          <ExplorePanel
            stories={timelineFilteredStories}
            collections={collections}
            activeCollection={activeCollection}
            displayMoments={displayMoments}
            momentToStoryMap={momentToStoryMap}
            mapInstance={mapInstance}
            onStorySelect={handleStorySelect}
            onLocationSelect={handleLocationSelect}
            onCollectionSelect={handleCollectionSelect}
            onClearCollection={() => setActiveCollection(null)}
            onScrollHighlight={handleScrollHighlight}
            onModeChange={handleModeChange}
            mode={mode}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            onCategoryFilter={handleCategoryFilter}
            onSurpriseMe={handleSurpriseMe}
            userLocation={userLocation}
            onRequestGeo={handleRequestGeo}
            onEntityClick={handleEntitySelect}
            activeTab={exploreTab}
            onTabChange={setExploreTab}
            sheetSnap={effectiveSheetSnap}
            onScrollPosition={(top) => { exploreScrollTop.current = top; }}
            restoreScrollTop={restoreScrollTop}
            onScrollRestored={() => setRestoreScrollTop(null)}
            onExpandRequest={handleExpandRequest}
            onCollectionMomentClick={handleCollectionMomentClick}
            onCollectionScrollHighlight={handleCollectionScrollHighlight}
            activeLocationId={activeLocation?.id ?? null}
          />
          </FadeIn>
        )}
        </Suspense>
      </Route>
    </Switch>
  );

  const isSplit = variant === 'split' && isMobile;

  return (
    <div className="h-full flex flex-col">
      <VariantToggle />
      <Header
        mode={mode}
        activeStory={activeStory}
        activeEntity={activeEntity}
        onBackToExplore={handleBackToExplore}
        onBack={handleBack}
        backLabel={backLabel}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilter={handleCategoryFilter}
        onSurpriseMe={handleSurpriseMe}
        onNearMe={handleNearMe}
        geoLoading={geoLoading}
        geoError={geoError}
        userLocation={userLocation}
        onStorySelect={handleStorySelect}
        onEntitySelect={handleEntitySelect}
        onCollectionSelect={handleCollectionSelect}
        onMomentSelect={handleMomentSelect}
      />
      {mode !== 'story' && mode !== 'entity' && (
        <TimelineBar
          stories={stories}
          categoryFilter={categoryFilter}
          onStorySelect={handleStorySelect}
          onViewRangeChange={setTimelineViewRange}
          highlightedStoryId={scrollHighlightStoryId}
          mapVisibleStoryIds={mapVisibleStoryIds}
        />
      )}

      {isSplit ? (
        /* ── Split variant: fixed vertical layout, no bottom sheet ── */
        <div className="flex-1 flex flex-col mobile-landscape:flex-row overflow-hidden relative">
          {/* Map — top 45% */}
          <div className="h-[45%] relative shrink-0 overflow-hidden" style={{ isolation: 'isolate' }}>
            <MapView
              stories={timelineFilteredStories}
              activeStory={activeStory}
              activeLocation={activeLocation}
              scrollHighlight={scrollHighlight}
              mode={mode}
              categoryFilter={categoryFilter}
              storyIdFilter={timelineStoryIdFilter}
              activeCollection={activeCollection}
              resetViewKey={resetViewKey}
              onMapReady={setMapInstance}
              onLocationClick={handleMapLocationClick}
              onStoryClick={handleStorySelect}
              userLocation={userLocation}
              nearMeZoomKey={nearMeZoomKey}
              restoreView={restoreView}
              entityLocations={entityLocations}
              sheetSnap="full"
              zoomToActiveLocation={zoomToActiveLocation}
            />
          </div>
          {/* Panel — bottom 55%, normal scroll */}
          <div className="flex-1 overflow-hidden flex flex-col bg-[var(--bg-primary)]">
            {panelContent}
          </div>
        </div>
      ) : (
        /* ── Current / Spotlight: map full screen + BottomSheet overlay ── */
        <div className="flex-1 flex flex-col lg:flex-row mobile-landscape:flex-row overflow-hidden relative">
          {/* Map — mobile: full screen behind sheet. Desktop: flex-1 fills left side. */}
          <div className="absolute inset-0 lg:relative lg:h-full lg:flex-1 overflow-hidden" style={{ isolation: 'isolate' }}>
            <MapView
              stories={timelineFilteredStories}
              activeStory={activeStory}
              activeLocation={activeLocation}
              scrollHighlight={scrollHighlight}
              mode={mode}
              categoryFilter={categoryFilter}
              storyIdFilter={timelineStoryIdFilter}
              activeCollection={activeCollection}
              resetViewKey={resetViewKey}
              onMapReady={setMapInstance}
              onLocationClick={handleMapLocationClick}
              onStoryClick={handleStorySelect}
              userLocation={userLocation}
              nearMeZoomKey={nearMeZoomKey}
              restoreView={restoreView}
              entityLocations={entityLocations}
              sheetSnap={sheetSnap}
              zoomToActiveLocation={zoomToActiveLocation}
            />
          </div>

          {/* Panel — variant-aware sheet component */}
          {variant === 'claude' ? (
            <ClaudeSheet
              onSnapChange={setSheetSnap}
              targetSnap={targetSheetSnap}
              contextLabel={sheetContext.label}
              contextSublabel={sheetContext.sublabel}
              momentCount={sheetContext.momentCount}
              currentMomentIndex={sheetContext.currentMomentIndex}
              categoryColor={sheetContext.categoryColor}
              onExpandRequest={handleExpandRequest}
            >
              {panelContent}
            </ClaudeSheet>
          ) : variant === 'cinema' ? (
            <CinemaSheet
              onSnapChange={setSheetSnap}
              targetSnap={targetSheetSnap}
              contextLabel={sheetContext.label}
              contextSublabel={sheetContext.sublabel}
              momentCount={sheetContext.momentCount}
              currentMomentIndex={sheetContext.currentMomentIndex}
              categoryColor={sheetContext.categoryColor}
              onExpandRequest={handleExpandRequest}
            >
              {panelContent}
            </CinemaSheet>
          ) : (
            <BottomSheet
              onSnapChange={setSheetSnap}
              targetSnap={targetSheetSnap}
              contextLabel={sheetContext.label}
              contextSublabel={sheetContext.sublabel}
              onExpandRequest={handleExpandRequest}
            >
              {panelContent}
            </BottomSheet>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
