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
  const [timelineFilterRange, setTimelineFilterRange] = useState<[number, number] | null>(null);
  // No more mobileMapExpanded — map is always visible at 30vh (story) or 45vh (explore)

  // When a collection is active, filter stories to only those in the collection
  const displayStories = useMemo(() => {
    if (!activeCollection) return stories;
    const idSet = new Set(activeCollection.storyIds);
    return stories.filter(s => idSet.has(s.id));
  }, [activeCollection]);

  // Filter stories by timeline filter range (when slider handles are active)
  const timelineFilteredStories = useMemo(() => {
    if (!timelineFilterRange) return displayStories;
    const [rangeStart, rangeEnd] = timelineFilterRange;
    return displayStories.filter((s) => {
      const [start, end] = parseYears(s.years);
      return end >= rangeStart && start <= rangeEnd;
    });
  }, [displayStories, timelineFilterRange]);

  // Derive which story is currently scroll-highlighted (for timeline dot pulse)
  const scrollHighlightStoryId = useMemo(() => {
    if (!scrollHighlight) return null;
    return stories.find((s) => s.locations.some((l) => l.id === scrollHighlight.id))?.id ?? null;
  }, [scrollHighlight]);

  const handleStorySelect = useCallback((story: Story) => {
    setActiveStory(story);
    setActiveLocation(null);
    setCategoryFilter(null);
    setMode('story');
  }, []);

  const handleLocationSelect = useCallback((location: StoryLocation, story: Story) => {
    setActiveStory(story);
    setActiveLocation(location);
    setMode('story');
  }, []);

  // Back from story → keeps active collection if there was one
  const handleBackFromStory = useCallback(() => {
    setActiveStory(null);
    setActiveLocation(null);
    setCategoryFilter(null);
    setMode('explore');
    setResetViewKey((k) => k + 1);
  }, []);

  // Full reset → clears everything including collection
  const handleBackToExplore = useCallback(() => {
    setActiveStory(null);
    setActiveLocation(null);
    setCategoryFilter(null);
    setActiveCollection(null);
    setMode('explore');
    setResetViewKey((k) => k + 1);
  }, []);

  const handleCollectionSelect = useCallback((collection: StoryCollection) => {
    setActiveCollection(collection);
    setCategoryFilter(null);
    setActiveStory(null);
    setActiveLocation(null);
    setMode('explore');
  }, []);

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

  const handleSurpriseMe = useCallback(() => {
    const randomStory = stories[Math.floor(Math.random() * stories.length)];
    const randomLoc = randomStory.locations[Math.floor(Math.random() * randomStory.locations.length)];
    setCategoryFilter(null);
    setActiveStory(randomStory);
    setActiveLocation(randomLoc);
    setMode('story');
  }, []);

  return (
    <div className="h-full flex flex-col">
      <Header
        mode={mode}
        activeStory={activeStory}
        onBackToExplore={handleBackToExplore}
        onBackFromStory={handleBackFromStory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilter={handleCategoryFilter}
        onSurpriseMe={handleSurpriseMe}
      />
      {mode !== 'story' && (
        <TimelineBar
          stories={stories}
          categoryFilter={categoryFilter}
          onStorySelect={handleStorySelect}
          onFilterRangeChange={setTimelineFilterRange}
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
                  onRelatedStoryClick={handleStorySelect}
                  onTagClick={handleTagClick}
                  allStories={stories}
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
