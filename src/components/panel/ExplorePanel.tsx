import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Story, StoryLocation, StoryCategory, InteractionMode, ViewportLocation, StoryCollection } from '../../types';
import { getLocationsInBounds, getStoriesInBounds } from '../../lib/geo';
import { StoryCard } from './StoryCard';
import { LocationCard } from './LocationCard';
import { CollectionCard } from './CollectionCard';

interface ExplorePanelProps {
  stories: Story[];
  collections: StoryCollection[];
  activeCollection: StoryCollection | null;
  mapInstance: LeafletMap | null;
  onStorySelect: (story: Story) => void;
  onLocationSelect: (location: StoryLocation, story: Story) => void;
  onCollectionSelect: (collection: StoryCollection) => void;
  onClearCollection: () => void;
  onScrollHighlight: (location: StoryLocation | null) => void;
  onModeChange: (mode: InteractionMode) => void;
  mode: InteractionMode;
  searchQuery: string;
  categoryFilter: StoryCategory | null;
  onCategoryFilter: (category: StoryCategory | null) => void;
  onSurpriseMe: () => void;
}

type PanelTab = 'locations' | 'stories' | 'collections';

export function ExplorePanel({
  stories,
  collections,
  activeCollection,
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
}: ExplorePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('stories');
  const [viewportLocations, setViewportLocations] = useState<ViewportLocation[]>([]);
  const [viewportStories, setViewportStories] = useState<Story[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isScrollDriving = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  // Filter stories by search + category
  const filteredStories = useMemo(() => {
    let result = stories;
    if (categoryFilter) {
      result = result.filter((s) => s.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nickname?.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q)) ||
          s.locations.some((l) => l.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [stories, searchQuery, categoryFilter]);

  // Update viewport data when map moves
  const updateViewport = useCallback(() => {
    if (!mapInstance || isScrollDriving.current) return;
    const bounds = mapInstance.getBounds();
    // Filter by category if active
    const sourceStories = categoryFilter
      ? stories.filter((s) => s.category === categoryFilter)
      : stories;
    setViewportLocations(getLocationsInBounds(sourceStories, bounds));
    setViewportStories(getStoriesInBounds(sourceStories, bounds));
  }, [mapInstance, stories, categoryFilter]);

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

  // Scroll-driven navigation (Stories tab)
  // When the user is zoomed into an area and scrolling through story cards,
  // we should NOT fly the map to the full story bounds (which could be across the state).
  // Instead, we only fly if the story's locations fit within or near the current viewport.
  useEffect(() => {
    if (activeTab !== 'stories' || !mapInstance) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      isScrollDriving.current = true;
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = window.setTimeout(() => {
        isScrollDriving.current = false;
        updateViewport();
      }, 600);

      const containerRect = container.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height * 0.4;
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
        const story = displayStories.find((s) => s.id === closestId);
        if (story && story.locations.length > 0) {
          onModeChange('scroll');

          // Find the first location of this story that's in the current viewport
          const mapBounds = mapInstance.getBounds();
          const locsInView = story.locations.filter((l) =>
            mapBounds.contains([l.lat, l.lng])
          );

          // Pick the "primary" location to highlight: first in-view, or first overall
          const highlightLoc = locsInView[0] || null;

          if (highlightLoc) {
            // Enlarge + pulse this marker, and gently pan to keep it centered
            onScrollHighlight(highlightLoc);
            mapInstance.panTo([highlightLoc.lat, highlightLoc.lng], {
              animate: true,
              duration: 0.6,
            });
          } else {
            // Story has no locations in view — clear highlight, don't pan
            onScrollHighlight(null);
          }
        }
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [activeTab, mapInstance, filteredStories, viewportStories, onModeChange, updateViewport]);

  const handleLocationClick = useCallback(
    (location: StoryLocation, story: Story) => {
      setActiveLocationId(location.id);
      onLocationSelect(location, story);
    },
    [onLocationSelect]
  );

  // Stories tab: show viewport stories if available, else filtered stories
  const displayStories = useMemo(() => {
    if (searchQuery.trim()) return filteredStories;
    if (viewportStories.length > 0) return viewportStories;
    return filteredStories;
  }, [filteredStories, viewportStories, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Active collection banner */}
      {activeCollection && (
        <div className="shrink-0 px-3 py-2.5 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] flex items-center gap-2.5">
          <button
            onClick={onClearCollection}
            className="text-[var(--text-muted)] hover:text-white transition-colors shrink-0"
            title="Back to all stories"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="text-lg shrink-0">{activeCollection.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-serif font-semibold text-[var(--text-primary)] truncate">
              {activeCollection.name}
            </p>
            <p className="text-[10px] font-mono text-[var(--text-muted)]">
              {stories.length} {stories.length === 1 ? 'story' : 'stories'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-subtle)] shrink-0">
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
            activeTab === 'locations'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Locations
          {viewportLocations.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">({viewportLocations.length})</span>
          )}
          {activeTab === 'locations' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('stories')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
            activeTab === 'stories'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Stories
          {viewportStories.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">({displayStories.length})</span>
          )}
          {activeTab === 'stories' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
            activeTab === 'collections'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Collections
          <span className="ml-1 text-[10px] text-[var(--text-muted)]">({collections.length})</span>
          {activeTab === 'collections' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {activeTab === 'collections' ? (
          collections.length === 0 ? (
            <EmptyState message="No collections yet" onSurpriseMe={onSurpriseMe} />
          ) : (
            collections.map((collection) => {
              const resolvedStories = collection.storyIds
                .map(id => stories.find(s => s.id === id))
                .filter((s): s is Story => s !== undefined);
              return (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  stories={resolvedStories}
                  onClick={onCollectionSelect}
                />
              );
            })
          )
        ) : activeTab === 'locations' ? (
          viewportLocations.length === 0 ? (
            <EmptyState
              message="Pan or zoom the map to see story points in this area"
              onSurpriseMe={onSurpriseMe}
            />
          ) : (
            viewportLocations.map((vl) => (
              <LocationCard
                key={`${vl.story.id}-${vl.location.id}`}
                location={vl.location}
                story={vl.story}
                isActive={activeLocationId === vl.location.id}
                onClick={(loc) => handleLocationClick(loc, vl.story)}
                showStoryName
              />
            ))
          )
        ) : displayStories.length === 0 ? (
          <EmptyState
            message={searchQuery ? 'No stories match your search' : 'No stories in this area — zoom out or pan around'}
            onSurpriseMe={onSurpriseMe}
          />
        ) : (
          displayStories.map((story) => (
            <div
              key={story.id}
              ref={(el) => {
                if (el) cardRefs.current.set(story.id, el);
                else cardRefs.current.delete(story.id);
              }}
            >
              <StoryCard story={story} onClick={onStorySelect} />
            </div>
          ))
        )}
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
