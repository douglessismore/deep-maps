import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Entity, Story, Moment, StoryCategory, InteractionMode, ViewportLocation, StoryCollection } from '../../types';
import { getLocationsInBounds, getStoriesInBounds } from '../../lib/geo';
import { moments } from '../../data/moments';
import { stories as allStories } from '../../data/stories';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';
import { getViewportEntities, getInitial, groupAlphabetically, getMomentsForEntity, type EntityWithCounts } from '../../lib/entityHelpers';
import { StoryCard } from './StoryCard';
import { CollectionCard } from './CollectionCard';

const momentMap = buildMomentMap(moments);

interface ExplorePanelProps {
  stories: Story[];
  collections: StoryCollection[];
  activeCollection: StoryCollection | null;
  mapInstance: LeafletMap | null;
  onStorySelect: (story: Story) => void;
  onLocationSelect: (location: Moment, story: Story) => void;
  onCollectionSelect: (collection: StoryCollection) => void;
  onClearCollection: () => void;
  onScrollHighlight: (locations: Moment[]) => void;
  onModeChange: (mode: InteractionMode) => void;
  mode: InteractionMode;
  searchQuery: string;
  categoryFilter: StoryCategory | null;
  onCategoryFilter: (category: StoryCategory | null) => void;
  onSurpriseMe: () => void;
  userLocation?: { lat: number; lng: number } | null;
  onEntityClick?: (entity: Entity) => void;
}

type PanelTab = 'moments' | 'stories' | 'directory';

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
  onEntityClick,
}: ExplorePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('stories');
  const [expandedLocationKey, setExpandedLocationKey] = useState<string | null>(null);
  const [viewportLocations, setViewportLocations] = useState<ViewportLocation[]>([]);
  const [viewportStories, setViewportStories] = useState<Story[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [directoryFilter, setDirectoryFilter] = useState<'person' | 'place'>('person');
  const [collectionsOpen, setCollectionsOpen] = useState(false);

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
  const directoryCardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isScrollDriving = useRef(false);
  const scrollTimeout = useRef<number | null>(null);

  // Auto-switch to stories tab when a collection is selected
  useEffect(() => {
    if (activeCollection) {
      setActiveTab('stories');
      setCollectionsOpen(false);
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

          // Highlight ALL story pins on the map
          const resolved = resolveLocationsFromMap(story, momentMap);
          onScrollHighlight(resolved);

          // Pan to first in-view pin (or first pin overall)
          const mapBounds = mapInstance.getBounds();
          const locsInView = resolved.filter((l) =>
            mapBounds.contains([l.lat, l.lng])
          );
          const panTarget = locsInView[0] || resolved[0];
          if (panTarget) {
            mapInstance.panTo([panTarget.lat, panTarget.lng], {
              animate: true,
              duration: 0.6,
            });
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

  // Scroll-driven location navigation (Moments tab)
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
        const vl = viewportLocations.find(
          (v) => `${v.story.id}-${v.location.id}` === closestKey
        );
        if (vl) {
          setActiveLocationId(vl.location.id);
          onScrollHighlight([vl.location]);
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

  // Directory tab: viewport entities
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

  const directoryEntities = useMemo(() => {
    return viewportEntities.filter((e) => e.entity.type === directoryFilter);
  }, [viewportEntities, directoryFilter]);

  const alphabeticalGroups = useMemo(
    () => groupAlphabetically(directoryEntities),
    [directoryEntities]
  );

  const personCount = useMemo(
    () => viewportEntities.filter((e) => e.entity.type === 'person').length,
    [viewportEntities]
  );
  const placeCount = useMemo(
    () => viewportEntities.filter((e) => e.entity.type === 'place').length,
    [viewportEntities]
  );

  // Scroll-driven entity highlighting (Directory tab)
  // NOTE: Must be after directoryEntities useMemo to avoid TDZ
  useEffect(() => {
    if (activeTab !== 'directory' || !mapInstance) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height * 0.4;
      let closestId: string | null = null;
      let closestDist = Infinity;

      directoryCardRefs.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenter - centerY);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
        }
      });

      if (closestId) {
        // Highlight ALL moments for this entity on the map
        const entityMoments = getMomentsForEntity(closestId);
        onScrollHighlight(entityMoments);
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [activeTab, mapInstance, directoryEntities, onScrollHighlight]);

  return (
    <div className="flex flex-col h-full relative">
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

      {/* Tabs + Collections button */}
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
        {activeTab === 'directory' ? (
          /* When Directory is active, show inline People/Places toggles */
          <div className="flex flex-1 relative">
            <button
              onClick={() => setDirectoryFilter('person')}
              className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
                directoryFilter === 'person'
                  ? 'text-[rgba(167,139,250,1)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              People
              {personCount > 0 && (
                <span className="ml-1 text-[10px] text-[var(--text-muted)]">({personCount})</span>
              )}
            </button>
            <button
              onClick={() => setDirectoryFilter('place')}
              className={`flex-1 py-2.5 text-xs font-mono transition-colors ${
                directoryFilter === 'place'
                  ? 'text-[rgba(96,165,250,1)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Places
              {placeCount > 0 && (
                <span className="ml-1 text-[10px] text-[var(--text-muted)]">({placeCount})</span>
              )}
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('directory')}
            className="flex-1 py-2.5 text-xs font-mono transition-colors relative text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            Directory
            {viewportEntities.length > 0 && (
              <span className="ml-1 text-[10px] text-[var(--text-muted)]">({viewportEntities.length})</span>
            )}
          </button>
        )}
        {/* Collections button */}
        <button
          onClick={() => setCollectionsOpen(!collectionsOpen)}
          className={`shrink-0 px-2.5 py-2.5 text-xs font-mono transition-colors border-l border-[var(--border-subtle)] ${
            activeCollection
              ? 'text-[var(--accent-red)]'
              : collectionsOpen
                ? 'text-[var(--text-primary)] bg-[var(--bg-card)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
          title="Browse curated collections"
        >
          <span className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
              <rect x="1" y="2" width="12" height="2" rx="0.5" stroke="currentColor" strokeWidth="1"/>
              <rect x="2" y="5.5" width="10" height="2" rx="0.5" stroke="currentColor" strokeWidth="1"/>
              <rect x="3" y="9" width="8" height="2" rx="0.5" stroke="currentColor" strokeWidth="1"/>
            </svg>
            <span className="hidden sm:inline">Collections</span>
          </span>
        </button>
      </div>

      {/* Collections popover */}
      {collectionsOpen && (
        <div className="absolute left-0 right-0 z-20 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] shadow-lg max-h-[50vh] overflow-y-auto custom-scrollbar p-3 space-y-2"
          style={{ top: activeCollection ? '92px' : '41px' }}
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-mono font-semibold text-[var(--text-primary)]">
              Curated Collections
            </h3>
            <button
              onClick={() => setCollectionsOpen(false)}
              className="text-[var(--text-muted)] hover:text-white text-xs p-1"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {collections.map((collection) => {
            const collectionStories = allStories.filter((s) =>
              collection.storyIds.includes(s.id)
            );
            return (
              <CollectionCard
                key={collection.id}
                collection={collection}
                stories={collectionStories}
                onClick={(c) => {
                  onCollectionSelect(c);
                  setCollectionsOpen(false);
                }}
              />
            );
          })}
        </div>
      )}

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
                      onScrollHighlight([vl.location]);
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
        ) : activeTab === 'directory' ? (
          viewportEntities.length === 0 ? (
            <EmptyState
              message="Pan or zoom the map to see people and places in this area"
              onSurpriseMe={onSurpriseMe}
            />
          ) : (
            <div>
              {/* Alphabetical entity list */}
              {Array.from(alphabeticalGroups.entries()).map(([letter, items]) => (
                <div key={letter}>
                  <div className="sticky top-0 z-[9] px-1 py-0.5 text-[10px] font-mono font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                    {letter}
                  </div>
                  {items.map(({ entity, momentCount }) => (
                    <button
                      key={entity.id}
                      ref={(el) => {
                        if (el) directoryCardRefs.current.set(entity.id, el);
                        else directoryCardRefs.current.delete(entity.id);
                      }}
                      onClick={() => onEntityClick?.(entity)}
                      className="w-full flex items-center gap-2.5 px-1 py-2 text-left transition-colors group hover:bg-[var(--bg-card)] rounded"
                    >
                      {/* Avatar/icon */}
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        entity.type === 'person'
                          ? 'bg-[rgba(139,92,246,0.12)] ring-1 ring-[rgba(139,92,246,0.3)]'
                          : 'bg-[rgba(59,130,246,0.12)] ring-1 ring-[rgba(59,130,246,0.3)]'
                      }`}>
                        {entity.type === 'person' ? (
                          <span className="text-[11px] font-serif font-bold text-[rgba(139,92,246,0.8)]">
                            {getInitial(entity.name)}
                          </span>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" className="text-[rgba(59,130,246,0.7)]">
                            <path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5zm0 6.75a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5z" fill="currentColor"/>
                          </svg>
                        )}
                      </span>
                      {/* Name */}
                      <span className="text-xs font-serif font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors truncate flex-1">
                        {entity.name}
                      </span>
                      {/* Years */}
                      {entity.years && (
                        <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0">
                          {entity.years}
                        </span>
                      )}
                      {/* Moment count */}
                      <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0">
                        {momentCount}m
                      </span>
                      {/* Chevron */}
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors opacity-50">
                        <path d="M3 1.5L5.5 4 3 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  ))}
                </div>
              ))}
              {/* Bottom padding for scroll detection */}
              <div className="h-[30vh]" />
            </div>
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
