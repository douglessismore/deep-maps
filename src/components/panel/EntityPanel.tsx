import type { Entity, Moment, Story } from '../../types';
import type L from 'leaflet';
import { CATEGORIES } from '../../lib/categories';
import { distanceMiles } from '../../lib/geo';
import {
  getEntityMomentStories,
  getEntityStories,
  getNotableFigures,
  getKeyLocations,
  getEntityIcon,
} from '../../lib/entityHelpers';
import { isV2 } from '../../lib/theme';
import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useUIVariant } from '../../lib/uiVariant';
import { GoDeeperCard } from './GoDeeperCard';
import { LocationCard } from './LocationCard';
import { EntityWikiPanel } from './EntityWikiPanel';
import type { SheetSnap } from '../ui/BottomSheet';
import { ScrollTimeline } from '../ui/ScrollTimeline';
import type { ScrollTimelineItem } from '../ui/ScrollTimeline';
import { SurpriseMeButton } from '../ui/SurpriseMeButton';

interface EntityPanelProps {
  entity: Entity;
  onStoryClick: (story: Story, moment?: Moment) => void;
  onEntityClick: (entity: Entity, fromMoment?: Moment) => void;
  onScrollLocationActive?: (moment: Moment, story: Story) => void;
  onMomentClick?: (moment: Moment, story: Story) => void;
  onScrollToTop?: () => void;
  activeLocationId?: string | null;
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
  sheetSnap?: SheetSnap;
  onExpandRequest?: () => void;
  suppressDetailPan?: React.RefObject<boolean>;
  mapInstance?: L.Map | null;
  /** Highlight a moment on the map without zooming/panning (for stay-local mode) */
  onHighlightOnly?: (moment: Moment) => void;
  onSurpriseMe?: () => void;
}

export function EntityPanel({
  entity,
  onStoryClick,
  onEntityClick,
  onScrollLocationActive,
  onMomentClick,
  onScrollToTop,
  activeLocationId,
  onBack,
  backLabel,
  onHome,
  sheetSnap,
  onExpandRequest,
  suppressDetailPan,
  mapInstance,
  onHighlightOnly,
  onSurpriseMe,
}: EntityPanelProps) {
  const allMomentEntries = useMemo(
    () => getEntityMomentStories(entity.id),
    [entity.id]
  );

  // Sort modes: "nearest" (by distance from map center) or "timeline" (chronological)
  const [entitySort, setEntitySort] = useState<'nearest' | 'timeline'>('nearest');

  const momentEntries = useMemo(() => {
    if (entitySort === 'timeline' || !mapInstance) return allMomentEntries;
    const center = mapInstance.getCenter();
    return [...allMomentEntries].sort((a, b) => {
      const distA = distanceMiles(center.lat, center.lng, a.moment.lat, a.moment.lng);
      const distB = distanceMiles(center.lat, center.lng, b.moment.lat, b.moment.lng);
      return distA - distB;
    });
  }, [allMomentEntries, entitySort, mapInstance]);

  // Connections: place → Notable Figures (people), person → Key Locations (places)
  const connections = useMemo(
    () => (entity.type === 'place' ? getNotableFigures(entity.id) : getKeyLocations(entity.id)),
    [entity.id, entity.type]
  );

  // Stories — whitelist: only incident stories are browseable
  const entityStories = useMemo(
    () => getEntityStories(entity.id).filter(s => s.storyType === 'incident'),
    [entity.id]
  );

  // Mobile detection for compact cards
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );
  const { variant } = useUIVariant();
  const isSpotlightPeek = variant === 'spotlight' && isMobile && sheetSnap === 'peek';
  const useCompactCards = variant === 'split' ? false : (variant === 'spotlight' ? (!isMobile || sheetSnap !== 'peek') && isMobile : isMobile);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Mobile header collapse — expanded by default so bio is visible
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [headerOutOfView, setHeaderOutOfView] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);
  const headerSentinelRef = useRef<HTMLDivElement>(null);

  // Tab state — moments vs wiki
  type EntityTab = 'moments' | 'wiki';
  const [activeTab, setActiveTab] = useState<EntityTab>('moments');
  const hasWiki = !!entity.wikipediaSlug;

  // ─── Scroll container ref ─────────────────────────────────────────
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when entity changes
  useEffect(() => {
    setHeaderExpanded(true);
    setHeaderOutOfView(false);
    setContextExpanded(false);
    setActiveTab('moments');
  }, [entity.id]);

  // Detect when entity header scrolls out of view → show sticky context bar
  useEffect(() => {
    const sentinel = headerSentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderOutOfView(!entry.isIntersecting),
      { root: container, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab]);

  // ─── Scroll-driven map highlighting ──────────────────────────────
  const momentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(null);

  // ─── ScrollTimeline labels for vertical moment list ─────────────
  const momentScrollActiveIndex = useMemo(() => {
    if (!scrollActiveId) return 0;
    const idx = momentEntries.findIndex(e => e.moment.id === scrollActiveId);
    return idx >= 0 ? idx : 0;
  }, [scrollActiveId, momentEntries]);

  const momentScrollLabels = useMemo((): ScrollTimelineItem[] => {
    return momentEntries.map(e => {
      if (entitySort === 'timeline') {
        return { label: e.moment.year ? String(e.moment.year) : null };
      }
      if (!mapInstance) return { label: null };
      const center = mapInstance.getCenter();
      const dist = distanceMiles(center.lat, center.lng, e.moment.lat, e.moment.lng);
      return { label: `${dist < 1 ? dist.toFixed(1) : Math.round(dist)} mi` };
    });
  }, [momentEntries, entitySort, mapInstance]);
  const [expandedLocationKey, setExpandedLocationKey] = useState<string | null>(null);
  const isProgrammaticScroll = useRef(false);
  // Track scroll-driven activeLocationId changes to avoid scroll-into-view loops
  const lastScrollDrivenId = useRef<string | null>(null);

  // Set initial active to first moment (or activeLocationId if provided)
  useEffect(() => {
    if (momentEntries.length > 0) {
      const shouldSuppressPan = suppressDetailPan?.current;
      if (activeLocationId) {
        // Entering entity with a specific moment pre-selected (e.g., from search)
        const entry = momentEntries.find((e) => e.moment.id === activeLocationId);
        if (entry) {
          setScrollActiveId(entry.moment.id);
          if (onScrollLocationActive && !shouldSuppressPan) {
            const fallbackStory = entry.stories[0] ?? { id: '__orphan__', name: '', category: 'discovery-science' as const, storyType: 'incident' as const, years: '', description: '', tags: [], moments: [], wikipediaSlug: '' };
            onScrollLocationActive(entry.moment, fallbackStory);
          }
          requestAnimationFrame(() => {
            const el = momentRefs.current.get(activeLocationId);
            if (el) {
              isProgrammaticScroll.current = true;
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  isProgrammaticScroll.current = false;
                });
              });
            }
          });
        }
      } else {
        // Fresh entity entry — highlight first card and zoom to it after a brief pause
        // so the user sees all markers before zooming to the first moment.
        const first = momentEntries[0];
        setScrollActiveId(first.moment.id);
        const firstStory = first.stories[0];
        if (firstStory && !shouldSuppressPan) {
          setTimeout(() => {
            onScrollLocationActive?.(first.moment, firstStory);
          }, 800);
        }
      }
    }
  }, [entity.id]); // Only on entity mount/change

  // External sync: when map pin is clicked, scroll to that moment
  // Skip if the change came from our own scroll handler (prevents bounce loops)
  // Track whether user is actively scrolling — suppress external scroll-to during scrolls
  const isUserScrolling = useRef(false);
  const scrollEndTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!activeLocationId || activeLocationId === scrollActiveId) return;
    // If scroll-driven or user is mid-scroll, don't fight the user
    if (activeLocationId === lastScrollDrivenId.current) {
      setScrollActiveId(activeLocationId);
      lastScrollDrivenId.current = null;
      return;
    }
    if (isUserScrolling.current) return; // User is scrolling, don't bounce back
    const el = momentRefs.current.get(activeLocationId);
    if (el) {
      isProgrammaticScroll.current = true;
      setScrollActiveId(activeLocationId);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isProgrammaticScroll.current = false;
        });
      });
    }
  }, [activeLocationId, scrollActiveId]);

  // If we entered from homepage, disable scroll-driven panning for the entire panel session
  // Captured once at mount, before any effect can clear the global ref
  const disableScrollPanForSession = useRef(!!suppressDetailPan?.current);

  // Scroll handler — find moment closest to 40% viewport line
  const scrollRafId = useRef(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (isProgrammaticScroll.current) return;
      // Clear the global flag so other panels don't inherit it
      if (suppressDetailPan?.current) {
        suppressDetailPan.current = false;
      }
      // Mark user as actively scrolling — prevents external scroll-to from bouncing
      isUserScrolling.current = true;
      clearTimeout(scrollEndTimer.current);
      scrollEndTimer.current = window.setTimeout(() => { isUserScrolling.current = false; }, 500);

      cancelAnimationFrame(scrollRafId.current);
      scrollRafId.current = requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height * 0.4;

        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;

        let closestId: string | null = null;
        let closestDist = Infinity;

        let allBelowCenter = true;
        momentRefs.current.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          if (cardCenter <= centerY) allBelowCenter = false;
          const dist = Math.abs(cardCenter - centerY);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = el.dataset.momentId ?? null;
          }
        });

        // Scrolled above all moments → show all entity pins
        if (allBelowCenter && momentRefs.current.size > 0) {
          if (scrollActiveId) {
            setScrollActiveId(null);
            onScrollToTop?.();
          }
          return;
        }

        if (isNearBottom && momentEntries.length > 0) {
          closestId = momentEntries[momentEntries.length - 1].moment.id;
        }

        if (closestId && closestId !== scrollActiveId) {
          lastScrollDrivenId.current = closestId; // Mark as scroll-driven
          setScrollActiveId(closestId);
          const entry = momentEntries.find((e) => e.moment.id === closestId);
          if (entry && onScrollLocationActive) {
            const fallbackStory = entry.stories[0] ?? { id: '__orphan__', name: '', category: 'discovery-science' as const, storyType: 'incident' as const, years: '', description: '', tags: [], moments: [], wikipediaSlug: '' };
            // When coming from homepage, highlight but don't zoom/pan
            if (disableScrollPanForSession.current) {
              onHighlightOnly?.(entry.moment);
            } else {
              onScrollLocationActive(entry.moment, fallbackStory);
            }
          }
        }
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(scrollRafId.current);
    };
  }, [momentEntries, scrollActiveId, onScrollLocationActive]);

  // Click a moment card → highlight + tell map
  const handleMomentClick = useCallback(
    (moment: Moment, parentStories: Story[]) => {
      setScrollActiveId(moment.id);
      setExpandedLocationKey(prev => prev === moment.id ? null : moment.id);
      const story = parentStories[0] ?? { id: '__orphan__', name: '', category: 'discovery-science' as const, storyType: 'incident' as const, years: '', description: '', tags: [], moments: [], wikipediaSlug: '' };
      if (onMomentClick) {
        onMomentClick(moment, story);
      } else if (onScrollLocationActive) {
        onScrollLocationActive(moment, story);
      }
    },
    [onMomentClick, onScrollLocationActive]
  );

  // ─── Dive deeper items ──────────────────────────────────────────
  const hasDiveDeeper = connections.length > 0 || entityStories.length > 0;

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile breadcrumb (hidden in spotlight peek) */}
      {onBack && !isSpotlightPeek && (
        <div className="lg:hidden shrink-0 flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 py-1 px-2 -ml-2 rounded-md bg-[var(--bg-overlay-subtle)] hover:bg-[var(--bg-overlay-hover)]"
          >
            <svg width="14" height="14" viewBox="0 0 10 10" fill="none">
              <path d="M6.5 2L3 5l3.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {backLabel || 'Home'}
          </button>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">·</span>
          <p className="text-[11px] font-mono text-[var(--text-primary)] truncate min-w-0">
            {entity.name}
          </p>
          {onHome && (
            <button
              onClick={onHome}
              className="ml-auto text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 shrink-0"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5L5 1.5L8.5 5M3 4v4h1.5V6.5h3V8H9V4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Home
            </button>
          )}
        </div>
      )}

      {/* Single scroll container — header, dive deeper, sticky tab bar, moments */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>

        {/* Entity header — scrolls away (hidden in spotlight peek) */}
        {!isSpotlightPeek && (
          <div className="border-b border-[var(--border-subtle)]">
            {/* Mobile: hero bio header — always visible, collapsible bio text */}
            <div className="lg:hidden">
              {/* Identity row: photo + name + metadata */}
              <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                {entity.imageUrl ? (
                  <img src={entity.imageUrl} alt={entity.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-[rgba(255,255,255,0.12)] shadow-lg"
                    loading="lazy" />
                ) : (
                  <div className="w-12 h-12 rounded-full shrink-0 bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center">
                    <span className="text-lg">{getEntityIcon(entity)}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="font-serif text-lg font-bold text-[var(--text-primary)] leading-tight">{entity.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-[var(--accent-red)] uppercase tracking-wider">{entity.type}</span>
                    {entity.years && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">{entity.years}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio section — always visible, tap to collapse long bios */}
              {entity.description && (
                <button
                  onClick={() => setHeaderExpanded(!headerExpanded)}
                  className="w-full text-left px-4 pb-3"
                >
                  <div className="border-l-2 border-[var(--accent-red)] pl-3">
                    <p className={`text-sm text-[var(--text-secondary)] leading-relaxed ${
                      !headerExpanded ? 'line-clamp-3' : ''
                    }`}>
                      {entity.description}
                    </p>
                    {!headerExpanded && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)] mt-1 inline-block">
                        Read more ↓
                      </span>
                    )}
                  </div>
                </button>
              )}

              {/* Wikipedia link — always visible when expanded */}
              {headerExpanded && entity.wikipediaSlug && (
                <div className="px-4 pb-3 pl-7">
                  <a href={`https://en.wikipedia.org/wiki/${entity.wikipediaSlug}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/>
                      <text x="6" y="8.5" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="serif" fontWeight="bold">W</text>
                    </svg>
                    Read on Wikipedia
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-50">
                      <path d="M6 2L2 6M6 2H3M6 2v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>
              )}
            </div>

            {/* Desktop: full header — V2 gets hero treatment */}
            <div className={isV2() ? 'hidden lg:block px-6 py-8 text-center' : 'hidden lg:block p-4'}>
              {!isV2() && <div className="h-1 rounded-full mb-4" style={{ backgroundColor: 'var(--accent-red)' }} />}
              {isV2() && entity.imageUrl && (
                <img src={entity.imageUrl} alt={entity.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 ring-[rgba(255,255,255,0.1)]"
                  loading="lazy" />
              )}
              <h2 className={isV2()
                ? 'font-serif text-4xl font-bold text-[var(--text-primary)] tracking-tight'
                : 'font-serif text-xl font-bold text-[var(--text-primary)]'
              }>{entity.name}</h2>
              <div className={isV2() ? 'flex items-center justify-center gap-2 mt-3' : 'flex items-center gap-2 mt-2'}>
                {isV2() ? (
                  <span className="text-xs font-mono text-[var(--accent-red)] uppercase tracking-[0.3em]">
                    {entity.years ? `${entity.years} · ` : ''}{entity.type}
                  </span>
                ) : (
                  <>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] capitalize px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                      {entity.type}
                    </span>
                    {entity.years && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">{entity.years}</span>
                    )}
                  </>
                )}
              </div>
              {entity.description && (
                <p className={isV2()
                  ? 'text-[var(--text-secondary)] text-base leading-relaxed mt-4 max-w-lg mx-auto font-light'
                  : 'text-sm text-[var(--text-secondary)] leading-relaxed mt-3'
                }>{entity.description}</p>
              )}
              {entity.wikipediaSlug && (
                <a href={`https://en.wikipedia.org/wiki/${entity.wikipediaSlug}`} target="_blank" rel="noopener noreferrer"
                  className={isV2()
                    ? 'inline-flex items-center gap-1.5 mt-4 text-xs font-mono text-[var(--accent-red)] hover:text-[var(--text-primary)] transition-colors'
                    : 'inline-flex items-center gap-1.5 mt-3 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors'
                  }>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/>
                    <text x="6" y="8.5" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="serif" fontWeight="bold">W</text>
                  </svg>
                  Read on Wikipedia
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-50">
                    <path d="M6 2L2 6M6 2H3M6 2v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              )}
            </div>
            {/* Sentinel — triggers sticky context bar when header scrolls out */}
            <div ref={headerSentinelRef} className="h-0" />
          </div>
        )}

        {/* Sticky context bar — appears when entity header scrolls out of view */}
        {headerOutOfView && !isSpotlightPeek && (
          <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-subtle)]">
            <button
              onClick={() => setContextExpanded(!contextExpanded)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-2.5 px-4 py-2">
                {entity.imageUrl ? (
                  <img src={entity.imageUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" loading="lazy" />
                ) : (
                  <span className="text-base shrink-0">{getEntityIcon(entity)}</span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-serif font-bold text-[var(--text-primary)] truncate">{entity.name}</h3>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {entity.years ? `${entity.years} · ` : ''}{entity.type}
                  </span>
                </div>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  className={`shrink-0 text-[var(--text-muted)] transition-transform ${contextExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            {contextExpanded && entity.description && (
              <div className="px-4 pb-2.5 pl-[42px]">
                <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{entity.description}</p>
                <button
                  onClick={() => {
                    setContextExpanded(false);
                    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="mt-1.5 text-[10px] font-mono text-[var(--accent-red)] hover:text-[var(--text-primary)] transition-colors"
                >
                  ↑ Back to top
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dive Deeper — horizontal strip (hidden in spotlight peek) */}
        {!isSpotlightPeek && hasDiveDeeper && (
          <div className="border-b border-[var(--border-subtle)]">
            <div className="px-4 pt-2 pb-1">
              <h3 className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Dive Deeper
              </h3>
            </div>
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto custom-scrollbar">
              {/* Related stories */}
              {entityStories.map((story) => {
                const sCat = CATEGORIES[story.category];
                const entityMomentCount = momentEntries.filter(({ stories: s }) =>
                  s.some((ps) => ps.id === story.id)
                ).length;
                return (
                  <GoDeeperCard
                    key={story.id}
                    label={story.name}
                    sublabel={`${entityMomentCount} ${entityMomentCount === 1 ? 'moment' : 'moments'} · ${story.years || ''}`}
                    icon={<span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sCat.color }} />}
                    onClick={() => onStoryClick(story)}
                  />
                );
              })}
              {/* Connected entities */}
              {connections.map((connEntity) => {
                const sharedMoments = momentEntries.filter(({ moment }) =>
                  moment.entityIds?.includes(connEntity.id)
                ).length;
                const sharedLabel = entity.type === 'place' ? 'here' : 'shared';
                return (
                  <GoDeeperCard
                    key={connEntity.id}
                    label={connEntity.name}
                    sublabel={`${sharedMoments} ${sharedMoments === 1 ? 'moment' : 'moments'} ${sharedLabel}`}
                    icon={<span className="text-sm opacity-60">{getEntityIcon(connEntity)}</span>}
                    onClick={() => onEntityClick(connEntity)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky tab bar — sticks at top when scrolled past header */}
        {!isSpotlightPeek && (
          <div className="sticky top-0 z-10 flex border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <button
              onClick={() => setActiveTab('moments')}
              className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
                activeTab === 'moments' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-sm">📍</span>
                Moments
                <span className="text-[10px] text-[var(--text-muted)]">({momentEntries.length})</span>
              </span>
              {activeTab === 'moments' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
              )}
            </button>
            {hasWiki && (
              <button
                onClick={() => setActiveTab('wiki')}
                className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
                  activeTab === 'wiki' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <span className="text-sm">📖</span>
                  Wikipedia
                </span>
                {activeTab === 'wiki' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Sort toggle for moments — nearest vs timeline */}
        {activeTab === 'moments' && allMomentEntries.length >= 2 && (
          <div className="px-4 pt-2 pb-1 flex items-center gap-2">
            <button
              onClick={() => setEntitySort('nearest')}
              className={`px-3 py-1.5 text-[13px] font-mono rounded-full transition-colors ${
                entitySort === 'nearest'
                  ? 'bg-[var(--bg-overlay-active)] text-[var(--text-primary)] ring-1 ring-[var(--border-hover)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-overlay-subtle)]'
              }`}
            >
              Nearest
            </button>
            <button
              onClick={() => setEntitySort('timeline')}
              className={`px-3 py-1.5 text-[13px] font-mono rounded-full transition-colors ${
                entitySort === 'timeline'
                  ? 'bg-[var(--bg-overlay-active)] text-[var(--text-primary)] ring-1 ring-[var(--border-hover)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-overlay-subtle)]'
              }`}
            >
              Timeline
            </button>
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'wiki' && hasWiki ? (
          <EntityWikiPanel entity={entity} />
        ) : (
        <div className="p-4">
          {momentEntries.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] italic">No moments tagged yet</p>
          ) : (
            <div className="flex gap-1">
            <div className="flex-1 min-w-0 space-y-1" onClick={isSpotlightPeek ? () => onExpandRequest?.() : undefined}>
              {(() => {
                if (isSpotlightPeek) {
                  const activeEntry = scrollActiveId
                    ? momentEntries.find(e => e.moment.id === scrollActiveId)
                    : momentEntries[0];
                  if (activeEntry) {
                    return (
                      <LocationCard
                        key={activeEntry.moment.id}
                        ref={(el) => {
                          if (el) momentRefs.current.set(activeEntry.moment.id, el);
                          else momentRefs.current.delete(activeEntry.moment.id);
                        }}
                        location={activeEntry.moment}
                        story={activeEntry.stories[0]}
                        isActive
                        isExpanded={false}
                        compact={useCompactCards}
                        skipCanonicalFilter
                        parentStories={activeEntry.stories}
                        excludeEntityIds={[entity.id]}
                        onClick={() => onExpandRequest?.()}
                        onStoryClick={(story) => onStoryClick(story, activeEntry.moment)}
                        onEntityClick={(e, fromMoment) => onEntityClick(e, fromMoment)}
                      />
                    );
                  }
                  return null;
                }
                return momentEntries.map(({ moment, stories }) => {
                  const primaryStory = stories[0];
                  return (
                    <LocationCard
                      key={moment.id}
                      ref={(el) => {
                        if (el) {
                          momentRefs.current.set(moment.id, el);
                          el.dataset.momentId = moment.id;
                        } else {
                          momentRefs.current.delete(moment.id);
                        }
                      }}
                      location={moment}
                      story={primaryStory}
                      isActive={scrollActiveId === moment.id}
                      isExpanded={expandedLocationKey === moment.id}
                      compact={useCompactCards}
                      skipCanonicalFilter
                      parentStories={stories}
                      excludeEntityIds={[entity.id]}
                      onClick={isSpotlightPeek ? () => onExpandRequest?.() : () => handleMomentClick(moment, stories)}
                      onStoryClick={(story) => onStoryClick(story, moment)}
                      onEntityClick={(e, fromMoment) => onEntityClick(e, fromMoment)}
                    />
                  );
                });
              })()}

              {/* Full timeline section removed — replaced by Nearest/Timeline toggle */}
            </div>
            {!isSpotlightPeek && momentEntries.length >= 2 && (
              <ScrollTimeline items={momentScrollLabels} activeIndex={momentScrollActiveIndex} orientation="vertical" />
            )}
            </div>
          )}
          {!isSpotlightPeek && onSurpriseMe && <SurpriseMeButton onClick={onSurpriseMe} />}
          {/* Bottom padding so last card can scroll fully into view */}
          {!isSpotlightPeek && <div className="h-24 lg:h-[40vh]" />}
        </div>
        )}
      </div>
    </div>
  );
}
