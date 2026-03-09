import type { Entity, Moment, Story } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { entityMap, getEntityMomentStories, getNotableFigures } from '../../lib/entityHelpers';
import { useMemo, useEffect, useRef, useState, useCallback } from 'react';

interface EntityPanelProps {
  entity: Entity;
  onStoryClick: (story: Story, moment?: Moment) => void;
  onEntityClick: (entity: Entity) => void;
  onScrollLocationActive?: (moment: Moment, story: Story) => void;
  activeLocationId?: string | null;
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
}

export function EntityPanel({
  entity,
  onStoryClick,
  onEntityClick,
  onScrollLocationActive,
  activeLocationId,
  onBack,
  backLabel,
  onHome,
}: EntityPanelProps) {
  const momentEntries = useMemo(
    () => getEntityMomentStories(entity.id),
    [entity.id]
  );

  // Notable figures for place entities
  const notableFigures = useMemo(
    () => (entity.type === 'place' ? getNotableFigures(entity.id) : []),
    [entity.id, entity.type]
  );

  // ─── Scroll-driven map highlighting ──────────────────────────────
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const momentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(null);
  const isProgrammaticScroll = useRef(false);

  // Set initial active to first moment
  useEffect(() => {
    if (momentEntries.length > 0 && !scrollActiveId) {
      const first = momentEntries[0];
      setScrollActiveId(first.moment.id);
      if (onScrollLocationActive && first.stories.length > 0) {
        onScrollLocationActive(first.moment, first.stories[0]);
      }
    }
  }, [momentEntries, scrollActiveId, onScrollLocationActive]);

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
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (isProgrammaticScroll.current) return;

      const containerRect = container.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height * 0.4;

      // Near bottom → pick last moment
      const isNearBottom =
        container.scrollTop + container.clientHeight >= container.scrollHeight - 30;

      let closestId: string | null = null;
      let closestDist = Infinity;

      momentRefs.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const dist = Math.abs(cardCenter - centerY);
        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
        }
      });

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
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [momentEntries, scrollActiveId, onScrollLocationActive]);

  // Click a moment card → highlight it + tell map
  const handleMomentClick = useCallback(
    (moment: Moment, stories: Story[]) => {
      setScrollActiveId(moment.id);
      if (onScrollLocationActive && stories.length > 0) {
        onScrollLocationActive(moment, stories[0]);
      }
      // Scroll card into view
      const el = momentRefs.current.get(moment.id);
      if (el) {
        isProgrammaticScroll.current = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            isProgrammaticScroll.current = false;
          });
        });
      }
    },
    [onScrollLocationActive]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile breadcrumb */}
      {onBack && (
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

      {/* Scroll container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Entity header */}
        <div className="p-4 border-b border-[var(--border-subtle)]">
          {/* Accent bar */}
          <div className="h-1 rounded-full mb-4" style={{ backgroundColor: 'var(--accent-red)' }} />

          {/* Name */}
          <h2 className="font-serif text-xl font-bold text-white">{entity.name}</h2>

          {/* Type badge + years */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-mono text-[var(--text-muted)] capitalize px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              {entity.type}
            </span>
            {entity.years && (
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {entity.years}
              </span>
            )}
          </div>

          {/* Description */}
          {entity.description && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3">
              {entity.description}
            </p>
          )}

          {/* Wikipedia link */}
          {entity.wikipediaSlug && (
            <a
              href={`https://en.wikipedia.org/wiki/${entity.wikipediaSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
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

        {/* Notable Figures — for place entities only */}
        {notableFigures.length > 0 && (
          <div className="border-b border-[var(--border-subtle)]">
            <div className="px-4 pt-3 pb-1">
              <h3 className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                Notable Figures
              </h3>
            </div>
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto custom-scrollbar">
              {notableFigures.map((figure) => (
                <button
                  key={figure.id}
                  onClick={() => onEntityClick(figure)}
                  className="shrink-0 flex items-center gap-2 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] rounded-lg px-3 py-2 transition-all group max-w-[200px]"
                >
                  <span className="text-sm shrink-0 opacity-60">👤</span>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-serif font-semibold text-[var(--text-primary)] group-hover:text-white truncate transition-colors">
                      {figure.name}
                    </p>
                    {figure.years && (
                      <p className="text-[10px] font-mono text-[var(--text-muted)]">
                        {figure.years}
                      </p>
                    )}
                  </div>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                    <path d="M3.5 2L7 5l-3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Moments section — compact cards with inline navigation chips */}
        <div className="p-4">
          <h3 className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Moments ({momentEntries.length})
          </h3>

          {momentEntries.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] italic">No moments tagged yet</p>
          ) : (
            <div className="space-y-1">
              {momentEntries.map(({ moment, stories }) => {
                const isActive = scrollActiveId === moment.id;
                // Entities on this moment (excluding the one we're viewing)
                const otherEntities = (moment.entityIds ?? [])
                  .map((eid) => (eid !== entity.id ? entityMap.get(eid) : null))
                  .filter((e): e is Entity => e != null);

                return (
                  <div
                    key={moment.id}
                    ref={(el) => {
                      if (el) momentRefs.current.set(moment.id, el);
                      else momentRefs.current.delete(moment.id);
                    }}
                    onClick={() => handleMomentClick(moment, stories)}
                    className={`cursor-pointer transition-all duration-200 rounded-r-lg py-2.5 pl-3 pr-3 border-l-2 ${
                      isActive
                        ? 'bg-[var(--bg-card-hover)] border-l-[var(--accent-red)]'
                        : 'bg-[var(--bg-card)] border-l-transparent hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    {/* Name + year */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-serif text-sm font-semibold text-[var(--text-primary)] leading-tight">
                        {moment.name}
                      </h4>
                      {moment.year && (
                        <span className="shrink-0 text-[10px] font-mono text-[var(--text-muted)]">
                          {moment.year}
                        </span>
                      )}
                    </div>

                    {/* Story chips — which stories contain this moment */}
                    {stories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {stories.map((s) => {
                          const sCat = CATEGORIES[s.category];
                          return (
                            <button
                              key={s.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onStoryClick(s, moment);
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] hover:text-white bg-[var(--bg-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-colors truncate max-w-[180px]"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0 inline-block"
                                style={{ backgroundColor: sCat.color }}
                              />
                              <span className="truncate">{s.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Go Deeper — other entity chips on this moment */}
                    {otherEntities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {otherEntities.map((otherEntity) => (
                          <button
                            key={otherEntity.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEntityClick(otherEntity);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] hover:text-white bg-[var(--bg-primary)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-colors"
                          >
                            <span className="opacity-60">
                              {otherEntity.type === 'person' ? '👤' : '📍'}
                            </span>
                            <span className="truncate max-w-[140px]">{otherEntity.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
