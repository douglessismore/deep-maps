import { useState, useCallback, useMemo, useEffect } from 'react';
import { Route, Switch } from 'wouter';
import { MapView } from './components/map/MapView';
import { ExplorePanel } from './components/panel/ExplorePanel';
import { StoryPanel } from './components/panel/StoryPanel';
import { Header } from './components/ui/Header';
import { stories } from './data/stories';
import { collections } from './data/collections';
import { CATEGORIES } from './lib/categories';
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
  const [mobileMapExpanded, setMobileMapExpanded] = useState(true);

  // Auto-collapse map on mobile when entering story mode, expand when leaving
  useEffect(() => {
    if (mode === 'story') {
      setMobileMapExpanded(false);
    } else {
      setMobileMapExpanded(true);
    }
  }, [mode]);

  // When a collection is active, filter stories to only those in the collection
  const displayStories = useMemo(() => {
    if (!activeCollection) return stories;
    const idSet = new Set(activeCollection.storyIds);
    return stories.filter(s => idSet.has(s.id));
  }, [activeCollection]);

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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilter={handleCategoryFilter}
        onSurpriseMe={handleSurpriseMe}
      />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map — collapses on mobile in story mode to give panel more room */}
        <div className={`${
          !mobileMapExpanded ? 'h-12' : mode === 'story' ? 'h-[30vh]' : 'h-[45vh]'
        } lg:h-full lg:flex-1 relative transition-[height] duration-300 overflow-hidden`}>
          <MapView
            stories={displayStories}
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
          {/* Collapsed map bar — mobile only, story mode */}
          {!mobileMapExpanded && mode === 'story' && activeStory && (
            <div className="lg:hidden absolute inset-0 z-[1000] bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] flex items-center px-4 gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORIES[activeStory.category].color }}
              />
              <span className="text-xs font-mono text-[var(--text-secondary)] truncate flex-1">
                {activeLocation?.name || activeStory.name}
              </span>
              <button
                onClick={() => setMobileMapExpanded(true)}
                className="shrink-0 text-[10px] font-mono text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1"
              >
                Map
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2.5 6.5L5 4l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
          {/* Collapse button — mobile only, when map is expanded in story mode */}
          {mobileMapExpanded && mode === 'story' && (
            <button
              onClick={() => setMobileMapExpanded(false)}
              className="lg:hidden absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-[var(--bg-primary)]/90 border border-[var(--border-subtle)] rounded-full px-3 py-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-white transition-colors backdrop-blur-sm"
            >
              Hide map ▾
            </button>
          )}
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
                  onBackToExplore={handleBackToExplore}
                  onRelatedStoryClick={handleStorySelect}
                  onTagClick={handleTagClick}
                  allStories={stories}
                />
              ) : (
                <ExplorePanel
                  stories={displayStories}
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
