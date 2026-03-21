import type { Entity, Moment, Story } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import {
  getEntityMomentStories,
  getEntityStories,
  getNotableFigures,
  getKeyLocations,
  canonicalStoryIds,
  getEntityIcon,
} from '../../lib/entityHelpers';
import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useUIVariant } from '../../lib/uiVariant';
import { GoDeeperCard } from './GoDeeperCard';
import { LocationCard } from './LocationCard';
import type { SheetSnap } from '../ui/BottomSheet';

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
}: EntityPanelProps) {
  const momentEntries = useMemo(
    () => getEntityMomentStories(entity.id),
    [entity.id]
  );

  // Connections: place → Notable Figures (people), person → Key Locations (places)
  const connections = useMemo(
    () => (entity.type === 'place' ? getNotableFigures(entity.id) : getKeyLocations(entity.id)),
    [entity.id, entity.type]
  );

  // Stories — filter out canonical stories (invisible infrastructure)
  const entityStories = useMemo(
    () => getEntityStories(entity.id).filter(s => !canonicalStoryIds.has(s.id)),
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

  // Mobile header collapse — compact by default, expandable on tap
  const [headerExpanded, setHeaderExpanded] = useState(false);

  // ─── Scroll container ref ─────────────────────────────────────────
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset expanded state when entity changes
  useEffect(() => {
    setHeaderExpanded(false);
  }, [entity.id]);

  // ─── Scroll-driven map highlighting ──────────────────────────────
  const momentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(null);
  const [expandedLocationKey, setExpandedLocationKey] = useState<string | null>(null);
  const isProgrammaticScroll = useRef(false);

  // Set initial active to first moment (or activeLocationId if provided)
  useEffect(() => {
    if (momentEntries.length > 0) {
      const initialId = activeLocationId ?? momentEntries[0].moment.id;
      const entry = momentEntries.find((e) => e.moment.id === initialId);
      if (entry) {
        setScrollActiveId(entry.moment.id);
        if (onScrollLocationActive && entry.stories.length > 0) {
          onScrollLocationActive(entry.moment, entry.stories[0]);
        }
        if (activeLocationId) {
          requestAnimationFrame(() => {
            const el = momentRefs.current.get(initialId);
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
      }
    }
  }, [entity.id]); // Only on entity mount/change

  // External sync: when map pin is clicked, scroll to that moment
  useEffect(() => {
    if (!activeLocationId || activeLocationId === scrollActiveId) return;
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

  // Scroll handler — find moment closest to 40% viewport line
  const scrollRafId = useRef(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (isProgrammaticScroll.current) return;

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
          setScrollActiveId(closestId);
          const entry = momentEntries.find((e) => e.moment.id === closestId);
          if (entry && onScrollLocationActive && entry.stories.length > 0) {
            onScrollLocationActive(entry.moment, entry.stories[0]);
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
      if (parentStories.length > 0) {
        if (onMomentClick) {
          onMomentClick(moment, parentStories[0]);
        } else if (onScrollLocationActive) {
          onScrollLocationActive(moment, parentStories[0]);
        }
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
        <div className="lg:hidden shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M6.5 2L3 5l3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {backLabel || 'Stories'}
          </button>
          {onHome && (
            <button
              onClick={onHome}
              className="ml-auto text-[11px] font-mono text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-1"
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
            {/* Mobile: compact collapsible header */}
            <div className="lg:hidden">
              <button
                onClick={() => setHeaderExpanded(!headerExpanded)}
                className="w-full flex items-center gap-2 px-4 py-2.5"
              >
                <div className="h-1 w-6 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent-red)' }} />
                <h2 className="font-sans text-sm font-bold text-white truncate">{entity.name}</h2>
                <span className="text-[10px] font-mono text-[var(--text-muted)] capitalize shrink-0">{entity.type}</span>
                {entity.years && (
                  <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">{entity.years}</span>
                )}
                <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                  headerExpanded ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)] bg-[var(--bg-card)]'
                }`}>
                  {headerExpanded ? 'Less' : 'More'}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                    className={`inline ml-0.5 transition-transform ${headerExpanded ? 'rotate-180' : ''}`}
                  >
                    <path d="M2.5 3.5L5 6l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              {headerExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  {entity.description && (
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{entity.description}</p>
                  )}
                  {entity.wikipediaSlug && (
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
                  )}
                </div>
              )}
            </div>

            {/* Desktop: full header */}
            <div className="hidden lg:block p-4">
              <div className="h-1 rounded-full mb-4" style={{ backgroundColor: 'var(--accent-red)' }} />
              <h2 className="font-serif text-xl font-bold text-white">{entity.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono text-[var(--text-muted)] capitalize px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                  {entity.type}
                </span>
                {entity.years && (
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{entity.years}</span>
                )}
              </div>
              {entity.description && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3">{entity.description}</p>
              )}
              {entity.wikipediaSlug && (
                <a href={`https://en.wikipedia.org/wiki/${entity.wikipediaSlug}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
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
              className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
                'text-[var(--text-primary)]'
              }`}
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-sm">📍</span>
                Moments
                <span className="text-[10px] text-[var(--text-muted)]">({momentEntries.length})</span>
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
            </button>
          </div>
        )}

        {/* Moments */}
        <div className="p-4">
          {momentEntries.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] italic">No moments tagged yet</p>
          ) : (
            <div className="space-y-1" onClick={isSpotlightPeek ? () => onExpandRequest?.() : undefined}>
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
                  if (!primaryStory) return null;
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
            </div>
          )}
          {/* Bottom padding so last card can scroll fully into view */}
          {!isSpotlightPeek && <div className="h-24 lg:h-[40vh]" />}
        </div>
      </div>
    </div>
  );
}
