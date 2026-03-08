import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Story, Moment, StoryCategory, InteractionMode, ViewportLocation, StoryCollection } from '../../types';
import { getLocationsInBounds, getStoriesInBounds } from '../../lib/geo';
import { moments } from '../../data/moments';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';

const momentMap = buildMomentMap(moments);
import { StoryCard } from './StoryCard';
import { LocationCard } from './LocationCard';
import { CollectionCard } from './CollectionCard';

interface ExplorePanelProps {
  stories: Story[];
  collections: StoryCollection[];
  activeCollection: StoryCollection | null;
  mapInstance: LeafletMap | null;
  onStorySelect: (story: Story) => void;
  onLocationSelect: (location: Moment, story: Story) => void;
  onCollectionSelect: (collection: StoryCollection) => void;
  onClearCollection: () => void;
  onScrollHighlight: (location: Moment | null) => void;
  onModeChange: (mode: InteractionMode) => void;
  mode: InteractionMode;
  searchQuery: string;
  categoryFilter: StoryCategory | null;
  onCategoryFilter: (category: StoryCategory | null) => void;
  onSurpriseMe: () => void;
  userLocation?: { lat: number; lng: number } | null;
}

type PanelTab = 'locations' | 'stories' | 'collections';

/** Haversine distance in miles between two lat/lng points */
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get the nearest location distance from a story to a point */
function nearestDistance(story: Story, lat: number, lng: number): number {
  return Math.min(...resolveLocationsFromMap(story, momentMap).map((l) => distanceMiles(lat, lng, l.lat, l.lng)));
}

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
  userLocation,
}: ExplorePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('stories');
  const [viewportLocations, setViewportLocations] = useState<ViewportLocation[]>([]);
  const [viewportStories, setViewportStories] = useState<Story[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);

  // Compact cards on mobile to show more stories below the map
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
  );
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

  // Auto-switch to stories tab when a collection is selected
  useEffect(() => {
    if (activeCollection) {
      setActiveTab('stories');
    }
  }, [activeCollection]);

  // Filter collections to only those with at least one story in the (timeline-filtered) stories prop
  const filteredCollections = useMemo(() => {
    const storyIdSet = new Set(stories.map((s) => s.id));
    return collections.filter((c) => c.storyIds.some((id) => storyIdSet.has(id)));
  }, [stories, collections]);

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
        if (story && story.moments.length > 0) {
          onModeChange('scroll');

          // Find the first location of this story that's in the current viewport
          const mapBounds = mapInstance.getBounds();
          const resolved = resolveLocationsFromMap(story, momentMap);
          const locsInView = resolved.filter((l) =>
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
    (location: Moment, story: Story) => {
      setActiveLocationId(location.id);
      onLocationSelect(location, story);
    },
    [onLocationSelect]
  );

  // Scroll-driven location navigation (Locations tab)
  useEffect(() => {
    if (activeTab !== 'locations' || !mapInstance) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
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
        // Key format is "storyId-locationId"
        const vl = viewportLocations.find(
          (v) => `${v.story.id}-${v.location.id}` === closestKey
        );
        if (vl) {
          setActiveLocationId(vl.location.id);
          onScrollHighlight(vl.location);
          mapInstance.panTo([vl.location.lat, vl.location.lng], {
            animate: true,
            duration: 0.6,
          });
        }
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [activeTab, mapInstance, viewportLocations, onScrollHighlight]);

  // Stories tab: show viewport stories if available, else filtered stories
  // When geolocated, sort by nearest distance
  const displayStories = useMemo(() => {
    let result: Story[];
    if (searchQuery.trim()) result = filteredStories;
    else if (viewportStories.length > 0) result = viewportStories;
    else result = filteredStories;

    if (userLocation) {
      return [...result].sort(
        (a, b) =>
          nearestDistance(a, userLocation.lat, userLocation.lng) -
          nearestDistance(b, userLocation.lat, userLocation.lng)
      );
    }
    return result;
  }, [filteredStories, viewportStories, searchQuery, userLocation]);

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
          Moments
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
          <span className="ml-1 text-[10px] text-[var(--text-muted)]">({filteredCollections.length})</span>
          {activeTab === 'collections' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {activeTab === 'collections' ? (
          filteredCollections.length === 0 ? (
            <EmptyState message="No collections match this time period" onSurpriseMe={onSurpriseMe} />
          ) : (
            filteredCollections.map((collection) => {
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
              message="Pan or zoom the map to see moments in this area"
              onSurpriseMe={onSurpriseMe}
            />
          ) : (
            viewportLocations.map((vl) => {
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
                  onClick={(loc) => handleLocationClick(loc, vl.story)}
                  showStoryName
                />
              );
            })
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
              <StoryCard
                story={story}
                onClick={onStorySelect}
                compact={isMobile}
                distanceMi={
                  userLocation
                    ? nearestDistance(story, userLocation.lat, userLocation.lng)
                    : undefined
                }
              />
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
