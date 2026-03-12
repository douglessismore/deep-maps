import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Route, Switch } from 'wouter';
import { MapView, smartFlyToBounds } from './components/map/MapView';
import { ExplorePanel } from './components/panel/ExplorePanel';
import { StoryPanel } from './components/panel/StoryPanel';
import { EntityPanel } from './components/panel/EntityPanel';
import { Header } from './components/ui/Header';
import { TimelineBar } from './components/ui/TimelineBar';
import { stories } from './data/stories';
import { collections } from './data/collections';
import { moments } from './data/moments';
import { parseYears } from './lib/timeline';
import { buildMomentMap, resolveLocationsFromMap } from './lib/storyHelpers';
import { getEntityLocations } from './lib/entityHelpers';
import type { Entity, Story, Moment, StoryCategory, StoryCollection, InteractionMode } from './types';
import L from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';


const momentMap = buildMomentMap(moments);

type SavedMapView = { center: [number, number]; zoom: number };

type NavEntry = {
  mode: InteractionMode;
  activeStory: Story | null;
  activeLocation: Moment | null;
  activeEntity: Entity | null;
  activeCollection: StoryCollection | null;
  categoryFilter: StoryCategory | null;
  savedMapView?: SavedMapView;
};

function App() {
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
  const [navHistory, setNavHistory] = useState<NavEntry[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [nearMeZoomKey, setNearMeZoomKey] = useState(0);
  const [restoreView, setRestoreView] = useState<SavedMapView | null>(null);
  const autoGeoRequested = useRef(false);

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
  }, []);

  // When a collection is active, resolve its moments
  const displayMoments = useMemo(() => {
    if (!activeCollection) return [];
    const idSet = new Set(activeCollection.momentIds);
    return moments.filter(m => idSet.has(m.id));
  }, [activeCollection]);

  // When a collection is active, filter stories to those that have moments in the collection
  const displayStories = useMemo(() => {
    if (!activeCollection) return stories;
    const midSet = new Set(activeCollection.momentIds);
    return stories.filter(s => s.moments.some(sm => midSet.has(sm.momentId)));
  }, [activeCollection]);

  // Filter stories by timeline view range (when user has interacted with timeline)
  const timelineFilteredStories = useMemo(() => {
    if (!timelineViewRange) return displayStories;
    const [rangeStart, rangeEnd] = timelineViewRange;
    return displayStories.filter((s) => {
      const [start, end] = parseYears(s.years);
      return end >= rangeStart && start <= rangeEnd;
    });
  }, [displayStories, timelineViewRange]);

  // Derive which story is currently scroll-highlighted (for timeline dot pulse)
  const scrollHighlightStoryId = useMemo(() => {
    if (scrollHighlight.length === 0) return null;
    const highlightIds = new Set(scrollHighlight.map(m => m.id));
    return stories.find((s) => resolveLocationsFromMap(s, momentMap).some((l) => highlightIds.has(l.id)))?.id ?? null;
  }, [scrollHighlight]);

  // Push current state onto navigation history before changing
  const pushNav = useCallback(() => {
    const savedMapView: SavedMapView | undefined = mapInstance
      ? { center: [mapInstance.getCenter().lat, mapInstance.getCenter().lng], zoom: mapInstance.getZoom() }
      : undefined;
    setNavHistory((prev) => {
      const entry: NavEntry = { mode, activeStory, activeLocation, activeEntity, activeCollection, categoryFilter, savedMapView };
      const next = [...prev, entry];
      return next.length > 10 ? next.slice(-10) : next;
    });
  }, [mode, activeStory, activeLocation, activeEntity, activeCollection, categoryFilter, mapInstance]);

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
    setMode('story');
  }, [activeCollection, pushNav]);

  // Scroll-driven location select — no history push (avoids back-button pollution)
  const handleScrollLocationSelect = useCallback((location: Moment, story: Story) => {
    if (activeCollection && !story.moments.some(sm => activeCollection.momentIds.includes(sm.momentId))) {
      setActiveCollection(null);
    }
    setActiveStory(story);
    setActiveLocation(location);
    setMode('story');
  }, [activeCollection]);

  // Back: pop from navigation history, or fall back to explore
  const handleBack = useCallback(() => {
    setNavHistory((prev) => {
      if (prev.length === 0) {
        // No history — go to explore
        setActiveStory(null);
        setActiveLocation(null);
        setActiveEntity(null);
        setCategoryFilter(null);
        setMode('explore');
        setResetViewKey((k) => k + 1);
        return prev;
      }
      const next = [...prev];
      const entry = next.pop()!;
      setMode(entry.mode === 'scroll' ? 'explore' : entry.mode);
      setActiveStory(entry.activeStory);
      setActiveLocation(entry.activeLocation);
      setActiveEntity(entry.activeEntity);
      setActiveCollection(entry.activeCollection);
      setCategoryFilter(entry.categoryFilter);
      if (!entry.activeStory && !entry.activeEntity) {
        // Restore saved map view if available, otherwise reset to US center
        if (entry.savedMapView) {
          setRestoreView(entry.savedMapView);
        } else {
          setResetViewKey((k) => k + 1);
        }
      }
      return next;
    });
  }, []);

  // Full reset → clears everything including collection and history
  const handleBackToExplore = useCallback(() => {
    setActiveStory(null);
    setActiveLocation(null);
    setActiveEntity(null);
    setCategoryFilter(null);
    setActiveCollection(null);
    setNavHistory([]);
    setMode('explore');
    setResetViewKey((k) => k + 1);
  }, []);

  const handleCollectionSelect = useCallback((collection: StoryCollection) => {
    pushNav();
    setActiveCollection(collection);
    setCategoryFilter(null);
    setActiveStory(null);
    setActiveLocation(null);
    setMode('explore');

    // Zoom map to fit all collection story locations
    if (mapInstance) {
      const midSet = new Set(collection.momentIds);
      const coords = moments.filter(m => midSet.has(m.id)).map(m => [m.lat, m.lng] as [number, number]);
      if (coords.length > 0) {
        smartFlyToBounds(mapInstance, L.latLngBounds(coords), { padding: [60, 60], maxZoom: 14, duration: 1.8 });
      }
    }
  }, [pushNav, mapInstance]);

  const handleModeChange = useCallback((newMode: InteractionMode) => {
    setMode(newMode);
    // Clear scroll highlight when entering story mode (full location select takes over)
    if (newMode === 'story') setScrollHighlight([]);
  }, []);

  // Deduplicate scrollHighlight — bail when moment IDs haven't changed
  const scrollHighlightIdsRef = useRef<string>('');
  const handleScrollHighlight = useCallback((locations: Moment[]) => {
    const key = locations.map(m => m.id).join(',');
    if (key === scrollHighlightIdsRef.current) return; // same set — skip re-render
    scrollHighlightIdsRef.current = key;
    setScrollHighlight(locations);
  }, []);

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
        // Clear error after 3 seconds
        setTimeout(() => setGeoError(null), 3000);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const handleSurpriseMe = useCallback(() => {
    pushNav();
    const randomStory = stories[Math.floor(Math.random() * stories.length)];
    const resolved = resolveLocationsFromMap(randomStory, momentMap);
    const randomLoc = resolved[Math.floor(Math.random() * resolved.length)];
    setCategoryFilter(null);
    setActiveStory(randomStory);
    setActiveLocation(randomLoc);
    setMode('story');
  }, [pushNav]);

  const handleEntitySelect = useCallback((entity: Entity, fromMoment?: Moment) => {
    pushNav();
    setActiveEntity(entity);
    setActiveStory(null);
    setActiveLocation(fromMoment ?? null);
    setCategoryFilter(null);
    setMode('entity');
  }, [pushNav]);

  // Entity-mode scroll → highlight map marker without exiting entity mode
  const handleEntityScrollLocationActive = useCallback((moment: Moment, _story: Story) => {
    setActiveLocation(moment);
  }, []);

  // Entity-mode story click → navigate to story with optional moment active
  const handleEntityStoryClick = useCallback((story: Story, moment?: Moment) => {
    pushNav();
    if (activeCollection && !story.moments.some(sm => activeCollection.momentIds.includes(sm.momentId))) {
      setActiveCollection(null);
    }
    // Validate moment exists in target story before setting as active
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
    return 'Stories';
  }, [navHistory]);

  return (
    <div className="h-full flex flex-col">
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
      />
      {mode !== 'story' && mode !== 'entity' && (
        <TimelineBar
          stories={stories}
          categoryFilter={categoryFilter}
          onStorySelect={handleStorySelect}
          onViewRangeChange={setTimelineViewRange}
          highlightedStoryId={scrollHighlightStoryId}
        />
      )}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map — always visible: 30vh in story mode, 45vh in explore */}
        <div className={`${
          mode === 'story' || mode === 'entity' ? 'h-[30vh]' : 'h-[45vh]'
        } lg:h-full lg:flex-1 relative transition-[height] duration-300 overflow-hidden`}>
          <MapView
            stories={timelineFilteredStories}
            activeStory={activeStory}
            activeLocation={activeLocation}
            scrollHighlight={scrollHighlight}
            mode={mode}
            categoryFilter={categoryFilter}
            resetViewKey={resetViewKey}
            onMapReady={setMapInstance}
            onLocationClick={handleMapLocationClick}
            onStoryClick={handleStorySelect}
            userLocation={userLocation}
            nearMeZoomKey={nearMeZoomKey}
            restoreView={restoreView}
            entityLocations={entityLocations}
          />
        </div>

        {/* Panel */}
        <div className="flex-1 lg:w-[420px] lg:flex-none overflow-hidden flex flex-col bg-[var(--bg-secondary)] border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)]">
          <Switch>
            <Route path="/">
              {mode === 'entity' && activeEntity ? (
                <EntityPanel
                  entity={activeEntity}
                  onStoryClick={handleEntityStoryClick}
                  onEntityClick={handleEntitySelect}
                  onScrollLocationActive={handleEntityScrollLocationActive}
                  activeLocationId={activeLocation?.id ?? null}
                  onBack={handleBack}
                  backLabel={backLabel}
                  onHome={handleBackToExplore}
                />
              ) : mode === 'story' && activeStory ? (
                <StoryPanel
                  story={activeStory}
                  activeLocation={activeLocation}
                  onLocationSelect={(loc) => handleLocationSelect(loc, activeStory)}
                  onScrollLocationSelect={(loc) => handleScrollLocationSelect(loc, activeStory)}
                  onRelatedStoryClick={handleStorySelect}
                  onTagClick={handleTagClick}
                  allStories={stories}
                  onBack={handleBack}
                  backLabel={backLabel}
                  onHome={handleBackToExplore}
                  onEntityClick={handleEntitySelect}
                />
              ) : (
                <ExplorePanel
                  stories={timelineFilteredStories}
                  collections={collections}
                  activeCollection={activeCollection}
                  displayMoments={displayMoments}
                  momentToStoryMap={momentToStoryMap}
                  allMoments={moments}
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
                  onEntityClick={handleEntitySelect}
                />
              )}
            </Route>
          </Switch>
        </div>
      </div>
    </div>
  );
}

export default App;
