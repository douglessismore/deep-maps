import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Entity, Story, Moment, StoryCategory, InteractionMode, ViewportLocation, StoryCollection } from '../../types';
import { getLocationsInBounds, getStoriesInBounds } from '../../lib/geo';
import { moments } from '../../data/moments';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';
import { EntityRibbon } from './EntityRibbon';

const momentMap = buildMomentMap(moments);
import { StoryCard } from './StoryCard';

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
  onEntityClick?: (entity: Entity) => void;
}

type PanelTab = 'moments' | 'stories';

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
  collections: _collections,
  activeCollection,
  mapInstance,
  onStorySelect,
  onLocationSelect,
  onCollectionSelect: _onCollectionSelect,
  onClearCollection,
  onScrollHighlight,
  onModeChange,
  searchQuery,
  categoryFilter,
  onSurpriseMe,
  userLocation,
  onEntityClick,
}: ExplorePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('stories');
  const [expandedLocationKey, setExpandedLocationKey] = useState<string | null>(null);
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

  // Scroll-driven location navigation (Locations tab)
  useEffect(() => {
    if (activeTab !== 'moments' || !mapInstance) return;
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

      {/* Entity Ribbon — above tabs, always visible */}
      {onEntityClick && (
        <EntityRibbon
          viewportLocations={viewportLocations}
          searchQuery={searchQuery}
          onEntityClick={onEntityClick}
          mapInstance={mapInstance}
        />
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-subtle)] shrink-0">
        <button
          onClick={() => setActiveTab('moments')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
            activeTab === 'moments'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Moments
          {viewportLocations.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">({viewportLocations.length})</span>
          )}
          {activeTab === 'moments' && (
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
      </div>

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {activeTab === 'moments' ? (
          viewportLocations.length === 0 ? (
            <EmptyState
              message="Pan or zoom the map to see moments in this area"
              onSurpriseMe={onSurpriseMe}
            />
          ) : (
            <>
              {viewportLocations.map((vl) => {
                const key = `${vl.story.id}-${vl.location.id}`;
                const isActive = activeLocationId === vl.location.id;
                const isExpanded = expandedLocationKey === key;
                return (
                  <div
                    key={key}
                    ref={(el) => {
                      if (el) locationCardRefs.current.set(key, el);
                      else locationCardRefs.current.delete(key);
                    }}
                    onClick={() => {
                      setExpandedLocationKey(isExpanded ? null : key);
                      setActiveLocationId(vl.location.id);
                      // Highlight on map (pan to pin) without navigating to story
                      onScrollHighlight(vl.location);
                      if (mapInstance) {
                        mapInstance.panTo([vl.location.lat, vl.location.lng], {
                          animate: true,
                          duration: 0.6,
                        });
                      }
                    }}
                    className={`cursor-pointer transition-all duration-200 rounded-r-lg py-2.5 pl-3 pr-3 border-l-2 ${
                      isActive
                        ? 'bg-[var(--bg-card-hover)] border-l-[var(--accent-red)]'
                        : 'bg-[var(--bg-card)] border-l-transparent hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    {/* Title + year */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-serif text-sm font-semibold text-[var(--text-primary)] leading-tight">
                        {vl.location.name}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {vl.location.year && (
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {vl.location.year}
                          </span>
                        )}
                        <svg
                          width="10" height="10" viewBox="0 0 10 10" fill="none"
                          className={`text-[var(--text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                    {/* Story name chip */}
                    <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5 truncate">
                      {vl.story.name}
                    </p>
                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-3 space-y-2.5">
                        {vl.location.description && (
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            {vl.location.description}
                          </p>
                        )}
                        {vl.location.address && (
                          <p className="text-[10px] font-mono text-[var(--text-muted)]">
                            &#128205; {vl.location.address}
                          </p>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${vl.location.lat},${vl.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M6 1C3.79 1 2 2.79 2 5c0 3 4 6 4 6s4-3 4-6c0-2.21-1.79-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor"/>
                          </svg>
                          Open in Google Maps
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-50">
                            <path d="M6 2L2 6M6 2H3M6 2v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </a>
                        {/* Navigate to story */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLocationSelect(vl.location, vl.story);
                          }}
                          className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--accent-red)] hover:text-white transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Read Story
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Bottom padding for scroll detection */}
              <div className="h-[30vh]" />
            </>
          )
        ) : displayStories.length === 0 ? (
          <EmptyState
            message={searchQuery ? 'No stories match your search' : 'No stories in this area — zoom out or pan around'}
            onSurpriseMe={onSurpriseMe}
          />
        ) : (
          <>
            {/* Story cards */}
            {displayStories.map((story) => (
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
            ))}
          </>
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
