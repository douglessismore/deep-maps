import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Entity, Story, Moment, StoryCategory, InteractionMode, ViewportLocation, StoryCollection } from '../../types';
import { getLocationsInBounds, getStoriesInBounds, distanceMiles } from '../../lib/geo';
import { getEffectiveNotability } from '../../lib/notability';
import { moments } from '../../data/moments';
import { buildMomentMap, resolveLocationsFromMap } from '../../lib/storyHelpers';
import { getViewportEntities, groupAlphabetically, getMomentsForEntity, canonicalStoryIds, type EntityWithCounts } from '../../lib/entityHelpers';
import { StoryCard } from './StoryCard';
import { PersonCard } from './PersonCard';
import { CollectionCard } from './CollectionCard';
import { LocationCard } from './LocationCard';

type MixedListItem =
  | { kind: 'story'; story: Story; distance: number }
  | { kind: 'person'; data: EntityWithCounts; distance: number };

const momentMap = buildMomentMap(moments);


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
  const [storySort, setStorySort] = useState<'notable' | 'nearest' | 'a-z'>('notable');
  const [placeSort, setPlaceSort] = useState<'notable' | 'nearest' | 'a-z'>('notable');
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
    // Collection filter persists across all tabs — user clears it via the ✕ chip
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

  // Collections filtered to viewport — only show collections with ≥1 moment in current map bounds
  const viewportCollections = useMemo(() => {
    if (!mapInstance) return collections;
    const bounds = mapInstance.getBounds();
    return collections.filter(c =>
      c.momentIds.some(mid => {
        const m = moments.find(mm => mm.id === mid);
        return m && bounds.contains([m.lat, m.lng]);
      })
    );
  }, [collections, mapInstance, viewportLocations]); // viewportLocations triggers recompute on map move

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

  // Initial activation for collections list — highlight the first collection's pins on mount
  // so the map shows relevant markers immediately instead of waiting for user to scroll
  useEffect(() => {
    const isCollectionsListTab = activeTab === 'collections' && activeCollection == null;
    if (!isCollectionsListTab || !mapInstance || viewportCollections.length === 0) return;
    // Small delay to allow DOM refs to populate
    const timer = setTimeout(() => {
      const firstColl = viewportCollections[0];
      setScrollActiveStoryId(firstColl.id);
      const collMoments = firstColl.momentIds
        .map(mid => moments.find(m => m.id === mid))
        .filter((m): m is Moment => m != null);
      if (collMoments.length > 0) {
        onScrollHighlight(collMoments);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab, activeCollection, viewportCollections, mapInstance]);

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

    // When a collection is active, filter to stories that contain collection moments
    if (activeCollection) {
      const collMomentIds = new Set(activeCollection.momentIds);
      result = result.filter(s =>
        s.moments.some(sm => collMomentIds.has(sm.momentId))
      );
    }

    // Sort by active story sort mode
    if (storySort === 'nearest' && userLocation) {
      return [...result].sort((a, b) =>
        nearestDistance(a, userLocation.lat, userLocation.lng) -
        nearestDistance(b, userLocation.lat, userLocation.lng)
      );
    }
    return [...result].sort((a, b) => storyNotability(b) - storyNotability(a));
  }, [filteredStories, viewportStories, searchQuery, userLocation, storySort, activeCollection]);

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

  // Alphabetical grouping of people for A-Z mode in Stories tab
  const personAlphabeticalGroups = useMemo(
    () => groupAlphabetically(personEntities),
    [personEntities]
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

  // Sorted places for Notable/Nearest modes
  const sortedPlaces = useMemo(() => {
    const arr = [...placeEntities];
    if (placeSort === 'notable') {
      return arr.sort((a, b) => {
        // Sort by storyCount desc (connection richness), then momentCount desc
        const sa = a.storyCount * 10 + a.momentCount;
        const sb = b.storyCount * 10 + b.momentCount;
        return sb - sa;
      });
    }
    if (placeSort === 'nearest' && userLocation) {
      return arr.sort((a, b) => {
        const aMoments = getMomentsForEntity(a.entity.id);
        const bMoments = getMomentsForEntity(b.entity.id);
        const aDist = aMoments.length > 0 ? Math.min(...aMoments.map(m => distanceMiles(userLocation.lat, userLocation.lng, m.lat, m.lng))) : Infinity;
        const bDist = bMoments.length > 0 ? Math.min(...bMoments.map(m => distanceMiles(userLocation.lat, userLocation.lng, m.lat, m.lng))) : Infinity;
        return aDist - bDist;
      });
    }
    // a-z handled by placeAlphabeticalGroups
    return arr.sort((a, b) => a.entity.name.localeCompare(b.entity.name));
  }, [placeEntities, placeSort, userLocation]);

  const sortedMoments = useMemo(() => {
    // When a collection is active, filter to only that collection's moments
    const base = activeCollection
      ? viewportLocations.filter(vl => activeCollection.momentIds.includes(vl.location.id))
      : viewportLocations;
    const arr = [...base];
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
  }, [viewportLocations, momentSort, userLocation, activeCollection]);

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

  const renderPlaceRow = (entity: Entity, momentCount: number, isActive: boolean) => (
    <button
      key={entity.id}
      ref={(el) => {
        if (el) placesCardRefs.current.set(entity.id, el);
        else placesCardRefs.current.delete(entity.id);
      }}
      onClick={() => onEntityClick?.(entity)}
      className={`w-full flex items-start gap-2.5 px-1 py-2.5 text-left transition-colors group rounded border-b border-[var(--border-subtle)]/30 ${
        isActive ? 'bg-[var(--bg-card-hover)]' : 'hover:bg-[var(--bg-card)]'
      }`}
    >
      {/* Place icon */}
      <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-[rgba(59,130,246,0.12)] ring-1 ring-[rgba(59,130,246,0.3)] mt-0.5">
        <svg width="11" height="11" viewBox="0 0 14 14" fill="none" className="text-[rgba(59,130,246,0.7)]">
          <path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 7 5 7s5-3.5 5-7c0-2.76-2.24-5-5-5zm0 6.75a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5z" fill="currentColor"/>
        </svg>
      </span>
      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <span className={`text-xs font-serif font-semibold transition-colors truncate block ${
          isActive ? 'text-white' : 'text-[var(--text-primary)] group-hover:text-white'
        }`}>
          {entity.name}
        </span>
        {entity.description && (
          <span className="text-[10px] text-[var(--text-muted)] line-clamp-1 block mt-0.5">
            {entity.description}
          </span>
        )}
      </div>
      {/* Years */}
      {entity.years && (
        <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0 mt-0.5">
          {entity.years}
        </span>
      )}
      {/* Moment count */}
      <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0 mt-0.5">
        {momentCount}m
      </span>
      {/* Chevron */}
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors opacity-50 mt-1.5">
        <path d="M3 1.5L5.5 4 3 6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );

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
          {sortedMoments.length > 0 && (
            <span className="ml-1 text-[10px] text-[var(--text-muted)]">
              ({sortedMoments.length})
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
            <>
              Collections
              {viewportCollections.length > 0 && (
                <span className="ml-1 text-[10px] text-[var(--text-muted)]">({viewportCollections.length})</span>
              )}
            </>
          )}
          {activeTab === 'collections' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
          )}
        </button>
      </div>

      {/* Collection lens indicator — persistent chip when collection is active on non-collections tabs */}
      {activeCollection && activeTab !== 'collections' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] shrink-0">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">Filtered by</span>
          <span className="text-[10px] font-mono text-[var(--accent-red)] truncate flex-1">{activeCollection.name}</span>
          <button
            onClick={onClearCollection}
            className="text-[var(--text-muted)] hover:text-white transition-colors shrink-0"
            title="Clear collection filter"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {activeTab === 'moments' ? (
          sortedMoments.length === 0 ? (
            <EmptyState
              message={activeCollection ? "No collection moments visible — zoom out to see more" : "Pan or zoom the map to see moments in this area"}
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
                    isExpanded={expandedLocationKey === key}
                    showExpandChevron
                    parentStories={[vl.story]}
                    onClick={(moment) => {
                      setExpandedLocationKey(expandedLocationKey === key ? null : key);
                      setActiveLocationId(moment.id);
                      onScrollHighlight([moment]);
                      if (mapInstance) {
                        mapInstance.panTo([moment.lat, moment.lng], {
                          animate: true,
                          duration: 0.3,
                        });
                      }
                    }}
                    onStoryClick={(story) => onLocationSelect(vl.location, story)}
                    onEntityClick={onEntityClick ? (entity) => onEntityClick(entity) : undefined}
                  />
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
              {/* Sort toggle */}
              <div className="flex items-center gap-1 mb-2 text-[10px] font-mono">
                {(['notable', 'nearest', 'a-z'] as const).map((mode, i) => (
                  <span key={mode} className="flex items-center">
                    {i > 0 && <span className="text-[var(--text-muted)] mx-1">·</span>}
                    <button
                      onClick={() => {
                        hasManualSort.current = true;
                        setPlaceSort(mode);
                        if (mode === 'nearest' && !userLocation) onRequestGeo?.();
                      }}
                      className={`transition-colors ${
                        placeSort === mode
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {mode === 'a-z' ? 'A-Z' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  </span>
                ))}
              </div>
              {placeSort === 'a-z' ? (
                /* Alphabetical with letter headers */
                Array.from(placeAlphabeticalGroups.entries()).map(([letter, items]) => (
                  <div key={letter}>
                    <div className="sticky top-0 z-[9] px-1 py-0.5 text-[10px] font-mono font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                      {letter}
                    </div>
                    {items.map(({ entity, momentCount }) => renderPlaceRow(entity, momentCount, scrollActiveEntityId === entity.id))}
                  </div>
                ))
              ) : (
                /* Notable / Nearest — flat sorted list */
                sortedPlaces.map(({ entity, momentCount }) => renderPlaceRow(entity, momentCount, scrollActiveEntityId === entity.id))
              )}
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
                <div className="p-2 space-y-1">
                  {displayMoments.map((moment) => {
                    const parentStory = momentToStoryMap.get(moment.id);
                    if (!parentStory) return null;
                    return (
                      <LocationCard
                        key={moment.id}
                        ref={(el) => {
                          if (el) cardRefs.current.set(moment.id, el);
                          else cardRefs.current.delete(moment.id);
                        }}
                        location={moment}
                        story={parentStory}
                        isActive={scrollActiveStoryId === moment.id}
                        isExpanded={expandedLocationKey === moment.id}
                        showExpandChevron
                        parentStories={[parentStory]}
                        onClick={(m) => {
                          setExpandedLocationKey(expandedLocationKey === m.id ? null : m.id);
                          onScrollHighlight([m]);
                          if (mapInstance) {
                            mapInstance.panTo([m.lat, m.lng], { animate: true, duration: 0.3 });
                          }
                        }}
                        onStoryClick={(story) => onLocationSelect(moment, story)}
                        onEntityClick={onEntityClick ? (entity) => onEntityClick(entity) : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Collection list — no active collection */
            viewportCollections.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-[var(--text-muted)] font-mono">Pan or zoom the map to see collections in this area</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Curated Collections
                </p>
                {viewportCollections.map((collection) => {
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
        ) : /* stories tab (default) */ (storySort === 'a-z' ? personEntities.length === 0 : mixedList.length === 0) ? (
          <EmptyState
            message={searchQuery ? 'No stories match your search' : storySort === 'a-z' ? 'No people in this area — zoom out or pan around' : 'No stories in this area — zoom out or pan around'}
            onSurpriseMe={onSurpriseMe}
          />
        ) : (
          <>
            {/* Sort toggle */}
            <div className="flex items-center gap-1 mb-2 text-[10px] font-mono">
              {(['notable', 'nearest', 'a-z'] as const).map((mode, i) => (
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
                    {mode === 'a-z' ? 'A-Z (People)' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                </span>
              ))}
            </div>
            {storySort === 'a-z' ? (
              /* A-Z people with letter headers */
              <>
                {Array.from(personAlphabeticalGroups.entries()).map(([letter, items]) => (
                  <div key={letter}>
                    <div className="sticky top-0 z-[9] px-1 py-0.5 text-[10px] font-mono font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)] border-b border-[var(--border-subtle)]">
                      {letter}
                    </div>
                    {items.map(({ entity, momentCount, storyCount }) => (
                      <div
                        key={`person-${entity.id}`}
                        ref={(el) => {
                          if (el) cardRefs.current.set(entity.id, el);
                          else cardRefs.current.delete(entity.id);
                        }}
                        className={scrollActiveStoryId === entity.id
                          ? 'ring-1 ring-[rgba(139,92,246,0.6)] rounded-lg transition-all duration-300'
                          : 'transition-all duration-300'}
                      >
                        <PersonCard
                          data={{ entity, momentCount, storyCount }}
                          onClick={(e) => onEntityClick?.(e)}
                          compact={isMobile}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              /* Mixed story + person cards (Notable / Nearest) */
              mixedList.map((item) => {
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
              })
            )}
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
