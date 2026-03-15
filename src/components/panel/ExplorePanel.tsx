import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Entity, Story, Moment, StoryCategory, InteractionMode, ViewportLocation, StoryCollection, VerificationLevel } from '../../types';
import { getLocationsInBounds, getStoriesInBounds, distanceMiles } from '../../lib/geo';
import { getEffectiveNotability } from '../../lib/notability';
import { moments } from '../../data/moments';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';
import { getViewportEntities, groupAlphabetically, getMomentsForEntity, canonicalStoryIds, type EntityWithCounts } from '../../lib/entityHelpers';
import { StoryCard } from './StoryCard';
import { PersonCard } from './PersonCard';
import { CollectionCard } from './CollectionCard';

type MixedListItem =
  | { kind: 'story'; story: Story; distance: number }
  | { kind: 'person'; data: EntityWithCounts; distance: number };

const momentMap = buildMomentMap(moments);

const VERIFICATION_DISPLAY: Record<VerificationLevel, { label: string; color: string; title: string }> = {
  verified: { label: 'Verified', color: '#22c55e', title: 'Corroborated by multiple independent historical sources' },
  documented: { label: 'Documented', color: '#eab308', title: 'Historical record exists but key details are disputed' },
  traditional: { label: 'Traditional', color: '#60a5fa', title: 'Religious or cultural tradition' },
  legendary: { label: 'Legendary', color: '#a78bfa', title: 'Folklore, unverified claims, or paranormal' },
};

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
  onScrollHighlight: (locations: Moment[]) => void;
  onModeChange: (mode: InteractionMode) => void;
  mode: InteractionMode;
  searchQuery: string;
  categoryFilter: StoryCategory | null;
  onCategoryFilter: (category: StoryCategory | null) => void;
  onSurpriseMe: () => void;
  userLocation?: { lat: number; lng: number } | null;
  onRequestGeo?: () => void;
  onEntityClick?: (entity: Entity) => void;
}

type PanelTab = 'moments' | 'stories' | 'places' | 'collections';

/** Get the nearest location distance from a story to a point */
function nearestDistance(story: Story, lat: number, lng: number): number {
  return Math.min(...resolveLocationsFromMap(story, momentMap).map((l) => distanceMiles(lat, lng, l.lat, l.lng)));
}

/** Get the max notability score across a story's moments */
function storyNotability(story: Story): number {
  const locs = resolveLocationsFromMap(story, momentMap);
  if (locs.length === 0) return 0;
  return Math.max(...locs.map(l => getEffectiveNotability(l)));
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
}: ExplorePanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('stories');
  const [expandedLocationKey, setExpandedLocationKey] = useState<string | null>(null);
  const [viewportLocations, setViewportLocations] = useState<ViewportLocation[]>([]);
  const [momentSort, setMomentSort] = useState<'notable' | 'nearest' | 'oldest'>('notable');
  const [storySort, setStorySort] = useState<'notable' | 'nearest'>('notable');
  const hasManualSort = useRef(false);
  const [viewportStories, setViewportStories] = useState<Story[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [scrollActiveStoryId, setScrollActiveStoryId] = useState<string | null>(null);
  const [scrollActiveEntityId, setScrollActiveEntityId] = useState<string | null>(null);

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
  const collectionListCardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const placesCardRefs = useRef<Map<string, HTMLElement>>(new Map());
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

  // Auto-switch to collections tab when a collection is selected
  useEffect(() => {
    if (activeCollection) {
      setActiveTab('collections');
    }
  }, [activeCollection]);

  // Clear scroll highlight + active collection when switching tabs
  useEffect(() => {
    if (activeTab !== 'stories' && activeTab !== 'collections') setScrollActiveStoryId(null);
    if (activeTab !== 'places') setScrollActiveEntityId(null);
    // Auto-clear collection filter when navigating away from Collections tab
    if (activeTab !== 'collections' && activeCollection) onClearCollection();
    // Clear map highlight to prevent ghosting from previous tab's scroll position
    onScrollHighlight([]);
  }, [activeTab]);

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

    const allInBounds = getLocationsInBounds(sourceStories, bounds);
    setViewportLocations(allInBounds);
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

  // Scroll-driven navigation (Stories tab + Collections views)
  useEffect(() => {
    const isStoriesTab = activeTab === 'stories';
    const isActiveCollectionTab = activeTab === 'collections' && activeCollection != null;
    const isCollectionsListTab = activeTab === 'collections' && activeCollection == null;
    if ((!isStoriesTab && !isActiveCollectionTab && !isCollectionsListTab) || !mapInstance) return;
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
        }, 400);

        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height * 0.4;

        // Collection list — highlight collection's moments on map
        if (isCollectionsListTab) {
          let closestCollId: string | null = null;
          let closestCollDist = Infinity;
          collectionListCardRefs.current.forEach((el, id) => {
            const rect = el.getBoundingClientRect();
            const cardCenter = rect.top + rect.height / 2;
            const dist = Math.abs(cardCenter - centerY);
            if (dist < closestCollDist) {
              closestCollDist = dist;
              closestCollId = id;
            }
          });
          if (closestCollId) {
            const coll = collections.find(c => c.id === closestCollId);
            if (coll) {
              setScrollActiveStoryId(closestCollId);
              const collMoments = coll.momentIds
                .map(mid => moments.find(m => m.id === mid))
                .filter((m): m is Moment => m != null);
              if (collMoments.length > 0) {
                onModeChange('scroll');
                clearTimeout(highlightDebounce.current);
                highlightDebounce.current = window.setTimeout(() => onScrollHighlight(collMoments), 30);
                // Fit bounds to show all collection moments
                clearTimeout(panTimeout.current);
                panTimeout.current = window.setTimeout(() => {
                  if (collMoments.length === 1) {
                    mapInstance.panTo([collMoments[0].lat, collMoments[0].lng], { animate: true, duration: 0.3 });
                  } else {
                    const lats = collMoments.map(m => m.lat);
                    const lngs = collMoments.map(m => m.lng);
                    mapInstance.fitBounds(
                      [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
                      { padding: [40, 40], animate: true, duration: 0.3, maxZoom: mapInstance.getZoom() }
                    );
                  }
                }, 80);
              }
            }
          }
          return; // Don't fall through to story/entity logic
        }

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
          // Check if it's a story or a person entity
          const story = displayStories.find((s) => s.id === closestId);
          if (story && story.moments.length > 0) {
            onModeChange('scroll');
            setScrollActiveStoryId(closestId);

            // Highlight ALL story pins on the map
            const resolved = resolveLocationsFromMap(story, momentMap);
            clearTimeout(highlightDebounce.current);
            highlightDebounce.current = window.setTimeout(() => onScrollHighlight(resolved), 30);

            // Pan to first in-view pin (or first pin overall)
            const mapBounds = mapInstance.getBounds();
            const locsInView = resolved.filter((l) =>
              mapBounds.contains([l.lat, l.lng])
            );
            const panTarget = locsInView[0] || resolved[0];
            if (panTarget) {
              clearTimeout(panTimeout.current);
              panTimeout.current = window.setTimeout(() => {
                mapInstance.panTo([panTarget.lat, panTarget.lng], {
                  animate: true,
                  duration: 0.15,
                });
              }, 80);
            }
          } else if (isActiveCollectionTab) {
            // Collection moment — highlight single pin + pan
            const collectionMoment = displayMoments.find(m => m.id === closestId);
            if (collectionMoment) {
              onModeChange('scroll');
              setScrollActiveStoryId(closestId);
              clearTimeout(highlightDebounce.current);
              highlightDebounce.current = window.setTimeout(() => onScrollHighlight([collectionMoment]), 30);
              clearTimeout(panTimeout.current);
              panTimeout.current = window.setTimeout(() => {
                mapInstance.panTo([collectionMoment.lat, collectionMoment.lng], {
                  animate: true,
                  duration: 0.15,
                });
              }, 80);
            }
          } else {
            // Person entity — highlight their moments on the map
            const entityMoments = getMomentsForEntity(closestId);
            if (entityMoments.length > 0) {
              onModeChange('scroll');
              setScrollActiveStoryId(closestId);
              clearTimeout(highlightDebounce.current);
              highlightDebounce.current = window.setTimeout(() => onScrollHighlight(entityMoments), 30);

              const mapBounds = mapInstance.getBounds();
              const locsInView = entityMoments.filter((l) =>
                mapBounds.contains([l.lat, l.lng])
              );
              const panTarget = locsInView[0] || entityMoments[0];
              clearTimeout(panTimeout.current);
              panTimeout.current = window.setTimeout(() => {
                mapInstance.panTo([panTarget.lat, panTarget.lng], {
                  animate: true,
                  duration: 0.15,
                });
              }, 80);
            }
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
      isScrollDriving.current = false; // Prevent stuck flag when switching tabs mid-scroll
    };
  }, [activeTab, activeCollection, collections, mapInstance, filteredStories, viewportStories, onModeChange, updateViewport, displayMoments]);

  // Scroll-driven location navigation (Moments tab)
  useEffect(() => {
    if (activeTab !== 'moments' || !mapInstance) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      cancelAnimationFrame(scrollRafId.current);
      scrollRafId.current = requestAnimationFrame(() => {
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
            clearTimeout(highlightDebounce.current);
            highlightDebounce.current = window.setTimeout(() => onScrollHighlight([vl.location]), 30);
            clearTimeout(panTimeout.current);
            panTimeout.current = window.setTimeout(() => {
              mapInstance.panTo([vl.location.lat, vl.location.lng], {
                animate: true,
                duration: 0.15,
              });
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
    };
  }, [activeTab, mapInstance, viewportLocations, onScrollHighlight]);

  // Stories tab: show viewport stories if available, else filtered stories
  // Filter out canonical stories — they're invisible infrastructure
  const displayStories = useMemo(() => {
    let result: Story[];
    if (searchQuery.trim()) result = filteredStories;
    else if (viewportStories.length > 0) result = viewportStories;
    else result = filteredStories;

    // Suppress canonical stories from browseable list
    result = result.filter(s => !canonicalStoryIds.has(s.id));

    // Sort by active story sort mode
    if (storySort === 'nearest' && userLocation) {
      return [...result].sort((a, b) =>
        nearestDistance(a, userLocation.lat, userLocation.lng) -
        nearestDistance(b, userLocation.lat, userLocation.lng)
      );
    }
    return [...result].sort((a, b) => storyNotability(b) - storyNotability(a));
  }, [filteredStories, viewportStories, searchQuery, userLocation, storySort]);

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

  // Mixed list: stories + people sorted by distance (or stories first if no location)
  const mixedList: MixedListItem[] = useMemo(() => {
    const storyItems: MixedListItem[] = displayStories.map((story) => ({
      kind: 'story' as const,
      story,
      distance: userLocation
        ? nearestDistance(story, userLocation.lat, userLocation.lng)
        : 0,
    }));
    const personItems: MixedListItem[] = personEntities.map((data) => {
      let dist = Infinity;
      if (userLocation) {
        const entityMoments = getMomentsForEntity(data.entity.id);
        for (const m of entityMoments) {
          const d = distanceMiles(userLocation.lat, userLocation.lng, m.lat, m.lng);
          if (d < dist) dist = d;
        }
      }
      return { kind: 'person' as const, data, distance: dist === Infinity ? 0 : dist };
    });

    const combined = [...storyItems, ...personItems];
    if (storySort === 'nearest' && userLocation) {
      combined.sort((a, b) => a.distance - b.distance);
    }
    return combined;
  }, [displayStories, personEntities, userLocation, storySort]);

  // Place entities — shown in Places tab
  const placeEntities = useMemo(
    () => viewportEntities.filter((e) => e.entity.type === 'place'),
    [viewportEntities]
  );

  const placeAlphabeticalGroups = useMemo(
    () => groupAlphabetically(placeEntities),
    [placeEntities]
  );

  const sortedMoments = useMemo(() => {
    const arr = [...viewportLocations];
    switch (momentSort) {
      case 'notable':
        return arr.sort((a, b) => (b.location.notability ?? 0) - (a.location.notability ?? 0));
      case 'nearest':
        if (userLocation) {
          // Sort by distance from user's GPS location
          return arr.sort((a, b) => {
            const da = distanceMiles(userLocation.lat, userLocation.lng, a.location.lat, a.location.lng);
            const db = distanceMiles(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
            return da - db;
          });
        }
        // Fallback: distance from viewport center (pre-computed)
        return arr.sort((a, b) => a.distance - b.distance);
      case 'oldest':
        return arr.sort((a, b) => (a.location.year ?? 9999) - (b.location.year ?? 9999));
      default:
        return arr;
    }
  }, [viewportLocations, momentSort, userLocation]);

  // Scroll-driven entity highlighting (Places tab)
  // Shows single primary pin for each entity (not all moments)
  useEffect(() => {
    if (activeTab !== 'places' || !mapInstance) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      cancelAnimationFrame(scrollRafId.current);
      scrollRafId.current = requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height * 0.4;
        let closestId: string | null = null;
        let closestDist = Infinity;

        placesCardRefs.current.forEach((el, id) => {
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const dist = Math.abs(cardCenter - centerY);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
          }
        });

        if (closestId) {
          setScrollActiveEntityId(closestId);
          // Highlight only the first (primary) moment for this entity — single pin
          const entityMoments = getMomentsForEntity(closestId);
          if (entityMoments.length > 0) {
            clearTimeout(highlightDebounce.current);
            highlightDebounce.current = window.setTimeout(() => onScrollHighlight([entityMoments[0]]), 50);
            clearTimeout(panTimeout.current);
            panTimeout.current = window.setTimeout(() => {
              mapInstance.panTo([entityMoments[0].lat, entityMoments[0].lng], {
                animate: true,
                duration: 0.6,
              });
            }, 150);
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
    };
  }, [activeTab, mapInstance, placeEntities, onScrollHighlight]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Tabs — 4 equal tabs */}
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
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">
              ({viewportLocations.length})
            </span>
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
          {mixedList.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">({mixedList.length})</span>
          )}
          {activeTab === 'stories' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('places')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
            activeTab === 'places'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Places
          {placeEntities.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">({placeEntities.length})</span>
          )}
          {activeTab === 'places' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 min-w-0 py-2.5 text-xs font-mono transition-colors relative ${
            activeTab === 'collections'
              ? 'text-[var(--text-primary)]'
              : activeCollection
                ? 'text-[var(--accent-red)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          {activeCollection ? (
            <span className="truncate">{activeCollection.name}</span>
          ) : (
            'Collections'
          )}
          {activeTab === 'collections' && (
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
              {sortedMoments.map((vl) => {
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
                          duration: 0.3,
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
                    {/* Subtitle hook */}
                    {vl.location.subtitle && (
                      <p className="text-xs italic text-[var(--text-secondary)] line-clamp-1 font-serif mt-0.5 opacity-75">
                        {vl.location.subtitle}
                      </p>
                    )}
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
                        {vl.location.verificationLevel && vl.location.verificationLevel !== 'verified' && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)]"
                            title={VERIFICATION_DISPLAY[vl.location.verificationLevel].title}
                          >
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: VERIFICATION_DISPLAY[vl.location.verificationLevel].color }}
                            />
                            {VERIFICATION_DISPLAY[vl.location.verificationLevel].label}
                          </span>
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
              {/* Bottom padding for scroll detection — minimal to avoid black space */}
              <div className="h-16" />
            </>
          )
        ) : activeTab === 'places' ? (
          placeEntities.length === 0 ? (
            <EmptyState
              message="Pan or zoom the map to see places in this area"
              onSurpriseMe={onSurpriseMe}
            />
          ) : (
            <div>
              {/* Alphabetical place entity list */}
              {Array.from(placeAlphabeticalGroups.entries()).map(([letter, items]) => (
                <div key={letter}>
                  <div className="sticky top-0 z-[9] px-1 py-0.5 text-[10px] font-mono font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                    {letter}
                  </div>
                  {items.map(({ entity, momentCount }) => {
                    const isActive = scrollActiveEntityId === entity.id;
                    return (
                      <button
                        key={entity.id}
                        ref={(el) => {
                          if (el) placesCardRefs.current.set(entity.id, el);
                          else placesCardRefs.current.delete(entity.id);
                        }}
                        onClick={() => onEntityClick?.(entity)}
                        className={`w-full flex items-center gap-2.5 px-1 py-2.5 text-left transition-colors group rounded border-b border-[var(--border-subtle)]/30 ${
                          isActive ? 'bg-[var(--bg-card-hover)]' : 'hover:bg-[var(--bg-card)]'
                        }`}
                      >
                        {/* Place icon */}
                        <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-[rgba(59,130,246,0.12)] ring-1 ring-[rgba(59,130,246,0.3)]">
                          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" className="text-[rgba(59,130,246,0.7)]">
                            <path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5zm0 6.75a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5z" fill="currentColor"/>
                          </svg>
                        </span>
                        {/* Name */}
                        <span className={`text-xs font-serif font-semibold transition-colors truncate flex-1 ${
                          isActive ? 'text-white' : 'text-[var(--text-primary)] group-hover:text-white'
                        }`}>
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
                    );
                  })}
                </div>
              ))}
              {/* Bottom padding for scroll detection — minimal to avoid black space */}
              <div className="h-16" />
            </div>
          )
        ) : activeTab === 'collections' ? (
          activeCollection ? (
            /* Active collection — moment list with back header */
            <>
              <div className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-3 py-2 flex items-center gap-2.5">
                <button
                  onClick={onClearCollection}
                  className="text-[var(--text-muted)] hover:text-white transition-colors shrink-0"
                  title="Back to all collections"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-serif font-semibold text-[var(--text-primary)] truncate">
                    {activeCollection.name}
                  </p>
                  <p className="text-[10px] font-mono text-[var(--text-muted)]">
                    {displayMoments.length} {displayMoments.length === 1 ? 'location' : 'locations'}
                  </p>
                </div>
              </div>
              {displayMoments.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-[var(--text-muted)] font-mono">No locations in this collection</p>
                </div>
              ) : (
                displayMoments.map((moment) => {
                  const parentStory = momentToStoryMap.get(moment.id);
                  return (
                    <button
                      key={moment.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(moment.id, el);
                        else cardRefs.current.delete(moment.id);
                      }}
                      onClick={() => {
                        if (parentStory) onLocationSelect(moment, parentStory);
                      }}
                      className={`w-full text-left px-3 py-2.5 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] transition-colors group ${
                        scrollActiveStoryId === moment.id ? 'bg-[var(--bg-card-hover)]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-serif font-semibold text-[var(--text-primary)] leading-tight group-hover:text-white transition-colors">
                            {moment.name}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-snug line-clamp-1">
                            {moment.subtitle}
                          </p>
                        </div>
                        {moment.year && (
                          <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0 mt-0.5">
                            {moment.year}
                          </span>
                        )}
                      </div>
                      {parentStory && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <span
                            className="text-[10px] font-mono text-[var(--accent-red)] hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStorySelect(parentStory);
                            }}
                          >
                            Dive Deep &rarr;
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                            {parentStory.name}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </>
          ) : (
            /* Collection list — no active collection */
            collections.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-[var(--text-muted)] font-mono">No collections available</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Curated Collections
                </p>
                {collections.map((collection) => {
                  const momentCount = collection.momentIds.length;
                  return (
                    <div
                      key={collection.id}
                      ref={(el) => {
                        if (el) collectionListCardRefs.current.set(collection.id, el);
                        else collectionListCardRefs.current.delete(collection.id);
                      }}
                      className={scrollActiveStoryId === collection.id
                        ? 'ring-1 ring-[var(--accent-red)] rounded-lg transition-all duration-300'
                        : 'transition-all duration-300'}
                    >
                      <CollectionCard
                        collection={collection}
                        momentCount={momentCount}
                        onClick={onCollectionSelect}
                      />
                    </div>
                  );
                })}
              </>
            )
          )
        ) : /* stories tab (default) */ mixedList.length === 0 ? (
          <EmptyState
            message={searchQuery ? 'No stories match your search' : 'No stories in this area — zoom out or pan around'}
            onSurpriseMe={onSurpriseMe}
          />
        ) : (
          <>
            {/* Sort toggle */}
            <div className="flex items-center gap-1 mb-2 text-[10px] font-mono">
              {(['notable', 'nearest'] as const).map((mode, i) => (
                <span key={mode} className="flex items-center">
                  {i > 0 && <span className="text-[var(--text-muted)] mx-1">·</span>}
                  <button
                    onClick={() => {
                      hasManualSort.current = true;
                      setStorySort(mode);
                      if (mode === 'nearest' && !userLocation) onRequestGeo?.();
                    }}
                    className={`transition-colors ${
                      storySort === mode
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                </span>
              ))}
            </div>
            {/* Mixed story + person cards */}
            {mixedList.map((item) => {
              if (item.kind === 'story') {
                return (
                  <div
                    key={item.story.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(item.story.id, el);
                      else cardRefs.current.delete(item.story.id);
                    }}
                    className={scrollActiveStoryId === item.story.id
                      ? 'ring-1 ring-[var(--accent-red)] rounded-lg transition-all duration-300'
                      : 'transition-all duration-300'}
                  >
                    <StoryCard
                      story={item.story}
                      onClick={onStorySelect}
                      compact={isMobile}
                      distanceMi={
                        userLocation
                          ? nearestDistance(item.story, userLocation.lat, userLocation.lng)
                          : undefined
                      }
                    />
                  </div>
                );
              } else {
                return (
                  <div
                    key={`person-${item.data.entity.id}`}
                    ref={(el) => {
                      if (el) cardRefs.current.set(item.data.entity.id, el);
                      else cardRefs.current.delete(item.data.entity.id);
                    }}
                    className={scrollActiveStoryId === item.data.entity.id
                      ? 'ring-1 ring-[rgba(139,92,246,0.6)] rounded-lg transition-all duration-300'
                      : 'transition-all duration-300'}
                  >
                    <PersonCard
                      data={item.data}
                      onClick={(entity) => onEntityClick?.(entity)}
                      compact={isMobile}
                      distanceMi={item.distance > 0 ? item.distance : undefined}
                    />
                  </div>
                );
              }
            })}
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
