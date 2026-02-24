import { useState, useCallback, useMemo } from 'react';
import { Route, Switch } from 'wouter';
import { MapView } from './components/map/MapView';
import { ExplorePanel } from './components/panel/ExplorePanel';
import { StoryPanel } from './components/panel/StoryPanel';
import { Header } from './components/ui/Header';
import { TimelineBar } from './components/ui/TimelineBar';
import { stories } from './data/stories';
import { collections } from './data/collections';
import { parseYears } from './lib/timeline';
import type { Story, StoryLocation, StoryCategory, StoryCollection, InteractionMode } from './types';
import type { Map as LeafletMap } from 'leaflet';

type NavEntry = {
  mode: InteractionMode;
  activeStory: Story | null;
  activeLocation: StoryLocation | null;
  activeCollection: StoryCollection | null;
  categoryFilter: StoryCategory | null;
};

function App() {
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [mode, setMode] = useState<InteractionMode>('explore');
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [activeLocation, setActiveLocation] = useState<StoryLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<StoryCategory | null>(null);
  const [scrollHighlight, setScrollHighlight] = useState<StoryLocation | null>(null);
  const [activeCollection, setActiveCollection] = useState<StoryCollection | null>(null);
  const [resetViewKey, setResetViewKey] = useState(0);
  const [timelineViewRange, setTimelineViewRange] = useState<[number, number] | null>(null);
  const [navHistory, setNavHistory] = useState<NavEntry[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // When a collection is active, filter stories to only those in the collection
  const displayStories = useMemo(() => {
    if (!activeCollection) return stories;
    const idSet = new Set(activeCollection.storyIds);
    return stories.filter(s => idSet.has(s.id));
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
    if (!scrollHighlight) return null;
    return stories.find((s) => s.locations.some((l) => l.id === scrollHighlight.id))?.id ?? null;
  }, [scrollHighlight]);

  // Push current state onto navigation history before changing
  const pushNav = useCallback(() => {
    setNavHistory((prev) => {
      const entry: NavEntry = { mode, activeStory, activeLocation, activeCollection, categoryFilter };
      const next = [...prev, entry];
      return next.length > 10 ? next.slice(-10) : next;
    });
  }, [mode, activeStory, activeLocation, activeCollection, categoryFilter]);

  // Clear activeCollection when navigating to a story NOT in the collection
  const handleStorySelect = useCallback((story: Story) => {
    pushNav();
    if (activeCollection && !activeCollection.storyIds.includes(story.id)) {
      setActiveCollection(null);
    }
    setActiveStory(story);
    setActiveLocation(null);
    setCategoryFilter(null);
    setMode('story');
  }, [activeCollection, pushNav]);

  const handleLocationSelect = useCallback((location: StoryLocation, story: Story) => {
    pushNav();
    if (activeCollection && !activeCollection.storyIds.includes(story.id)) {
      setActiveCollection(null);
    }
    setActiveStory(story);
    setActiveLocation(location);
    setMode('story');
  }, [activeCollection, pushNav]);

  // Scroll-driven location select — no history push (avoids back-button pollution)
  const handleScrollLocationSelect = useCallback((location: StoryLocation, story: Story) => {
    if (activeCollection && !activeCollection.storyIds.includes(story.id)) {
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
      setActiveCollection(entry.activeCollection);
      setCategoryFilter(entry.categoryFilter);
      if (!entry.activeStory) {
        setResetViewKey((k) => k + 1);
      }
      return next;
    });
  }, []);

  // Full reset → clears everything including collection and history
  const handleBackToExplore = useCallback(() => {
    setActiveStory(null);
    setActiveLocation(null);
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
  }, [pushNav]);

  const handleModeChange = useCallback((newMode: InteractionMode) => {
    setMode(newMode);
    // Clear scroll highlight when entering story mode (full location select takes over)
    if (newMode === 'story') setScrollHighlight(null);
  }, []);

  const handleScrollHighlight = useCallback((location: StoryLocation | null) => {
    setScrollHighlight(location);
  }, []);

  const handleCategoryFilter = useCallback((category: StoryCategory | null) => {
    setCategoryFilter(category);
    setActiveStory(null);
    setActiveLocation(null);
    setMode('explore');
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    setSearchQuery(tag);
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
    const randomLoc = randomStory.locations[Math.floor(Math.random() * randomStory.locations.length)];
    setCategoryFilter(null);
    setActiveStory(randomStory);
    setActiveLocation(randomLoc);
    setMode('story');
  }, [pushNav]);

  // Contextual back label from navigation history
  const backLabel = useMemo(() => {
    if (navHistory.length === 0) return 'Stories';
    const prev = navHistory[navHistory.length - 1];
    if (prev.activeStory) return prev.activeStory.name;
    if (prev.activeCollection) return prev.activeCollection.name;
    return 'Stories';
  }, [navHistory]);

  return (
    <div className="h-full flex flex-col">
      <Header
        mode={mode}
        activeStory={activeStory}
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
      {mode !== 'story' && (
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
          mode === 'story' ? 'h-[30vh]' : 'h-[45vh]'
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
            onLocationClick={handleLocationSelect}
            onStoryClick={handleStorySelect}
            userLocation={userLocation}
          />
        </div>

        {/* Panel */}
        <div className="flex-1 lg:w-[420px] lg:flex-none overflow-hidden flex flex-col bg-[var(--bg-secondary)] border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)]">
          <Switch>
            <Route path="/">
              {mode === 'story' && activeStory ? (
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
                />
              ) : (
                <ExplorePanel
                  stories={timelineFilteredStories}
                  collections={collections}
                  activeCollection={activeCollection}
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
