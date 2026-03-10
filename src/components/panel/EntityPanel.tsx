import type { Entity, Moment, Story } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import {
  entityMap,
  getEntityMomentStories,
  getEntityStories,
  getNotableFigures,
} from '../../lib/entityHelpers';
import { useMemo, useEffect, useRef, useState, useCallback } from 'react';

interface EntityPanelProps {
  entity: Entity;
  onStoryClick: (story: Story, moment?: Moment) => void;
  onEntityClick: (entity: Entity, fromMoment?: Moment) => void;
  onScrollLocationActive?: (moment: Moment, story: Story) => void;
  activeLocationId?: string | null;
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
}

type EntityTab = 'moments' | 'stories' | 'figures';

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

  // Stories for person entities
  const entityStories = useMemo(
    () => (entity.type === 'person' ? getEntityStories(entity.id) : []),
    [entity.id, entity.type]
  );

  // ─── Tabs ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<EntityTab>('moments');

  // Reset tab when entity changes
  useEffect(() => {
    setActiveTab('moments');
  }, [entity.id]);

  // Determine second tab based on entity type
  const secondTab: { key: EntityTab; label: string; count: number } | null =
    useMemo(() => {
      if (entity.type === 'place' && notableFigures.length > 0)
        return { key: 'figures', label: 'Notable Figures', count: notableFigures.length };
      if (entity.type === 'person' && entityStories.length > 0)
        return { key: 'stories', label: 'Stories', count: entityStories.length };
      return null;
    }, [entity.type, notableFigures.length, entityStories.length]);

  // ─── Expandable moments ───────────────────────────────────────────
  const [expandedMomentId, setExpandedMomentId] = useState<string | null>(null);

  // Auto-expand on navigation: if activeLocationId matches a moment, expand it
  useEffect(() => {
    if (activeLocationId) {
      const hasMatch = momentEntries.some(
        (e) => e.moment.id === activeLocationId
      );
      if (hasMatch) {
        setExpandedMomentId(activeLocationId);
      }
    }
  }, [entity.id]); // Only on entity mount/change, not on every activeLocationId change

  // ─── Scroll-driven map highlighting ──────────────────────────────
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const momentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [scrollActiveId, setScrollActiveId] = useState<string | null>(null);
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
        // If we have an activeLocationId, scroll to it
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
  useEffect(() => {
    if (activeTab !== 'moments') return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (isProgrammaticScroll.current) return;

      const containerRect = container.getBoundingClientRect();
      const centerY = containerRect.top + containerRect.height * 0.4;

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
  }, [activeTab, momentEntries, scrollActiveId, onScrollLocationActive]);

  // Click a moment card → toggle expand + highlight + tell map
  const handleMomentClick = useCallback(
    (moment: Moment, parentStories: Story[]) => {
      // Toggle expanded
      setExpandedMomentId((prev) => (prev === moment.id ? null : moment.id));
      // Set scroll highlight
      setScrollActiveId(moment.id);
      if (onScrollLocationActive && parentStories.length > 0) {
        onScrollLocationActive(moment, parentStories[0]);
      }
    },
    [onScrollLocationActive]
  );

  // ─── Render helpers ───────────────────────────────────────────────
  const renderTabBar = () => {
    if (!secondTab) return null;
    return (
      <div className="flex border-b border-[var(--border-subtle)] shrink-0 sticky top-0 z-10 bg-[var(--bg-secondary)]">
        <button
          onClick={() => setActiveTab('moments')}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
            activeTab === 'moments'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <span className="text-sm">📍</span>
            Moments
            <span className="text-[10px] text-[var(--text-muted)]">
              ({momentEntries.length})
            </span>
          </span>
          {activeTab === 'moments' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab(secondTab.key)}
          className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
            activeTab === secondTab.key
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <span className="text-sm">{secondTab.key === 'figures' ? '👤' : '📖'}</span>
            {secondTab.label}
            <span className="text-[10px] text-[var(--text-muted)]">
              ({secondTab.count})
            </span>
          </span>
          {activeTab === secondTab.key && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
          )}
        </button>
      </div>
    );
  };

  const renderMomentCard = (
    moment: Moment,
    parentStories: Story[]
  ) => {
    const isScrollActive = scrollActiveId === moment.id;
    const isExpanded = expandedMomentId === moment.id;
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
        onClick={() => handleMomentClick(moment, parentStories)}
        className={`cursor-pointer transition-all duration-200 rounded-r-lg py-2.5 pl-3 pr-3 border-l-2 ${
          isScrollActive
            ? 'bg-[var(--bg-card-hover)] border-l-[var(--accent-red)]'
            : 'bg-[var(--bg-card)] border-l-transparent hover:bg-[var(--bg-card-hover)]'
        }`}
      >
        {/* Name + year */}
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="font-serif text-sm font-semibold text-[var(--text-primary)] leading-tight">
            {moment.name}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            {moment.year && (
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {moment.year}
              </span>
            )}
            {/* Expand/collapse indicator */}
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className={`text-[var(--text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-3 space-y-2.5">
            {/* Description */}
            {moment.description && (
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {moment.description}
              </p>
            )}
            {/* Address */}
            {moment.address && (
              <p className="text-[10px] font-mono text-[var(--text-muted)]">
                &#128205; {moment.address}
              </p>
            )}
            {/* Google Maps link */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${moment.lat},${moment.lng}`}
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
            {/* Wikipedia link — use first parent story's slug + moment's wikiSection */}
            {(() => {
              const wikiStory = parentStories.find((s) => s.wikipediaSlug);
              if (!wikiStory) return null;
              const url = `https://en.wikipedia.org/wiki/${wikiStory.wikipediaSlug}${moment.wikiSection ? '#' + moment.wikiSection : ''}`;
              return (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
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
              );
            })()}
          </div>
        )}

        {/* Story chips — which stories contain this moment */}
        {parentStories.length > 0 && (
          <div className={`flex flex-wrap gap-1 ${isExpanded ? 'mt-3 pt-2.5 border-t border-[var(--border-subtle)]' : 'mt-1.5'}`}>
            {parentStories.map((s) => {
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
                  onEntityClick(otherEntity, moment);
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
  };

  const renderStoriesTab = () => (
    <div className="p-4 space-y-2">
      {entityStories.map((story) => {
        const sCat = CATEGORIES[story.category];
        // Count how many of this entity's moments are in this story
        const entityMomentCount = momentEntries.filter(({ stories: s }) =>
          s.some((ps) => ps.id === story.id)
        ).length;
        return (
          <button
            key={story.id}
            onClick={() => onStoryClick(story)}
            className="w-full flex items-start gap-3 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] rounded-lg px-3 py-2.5 transition-all group text-left"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
              style={{ backgroundColor: sCat.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-serif font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors leading-tight">
                {story.name}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[var(--text-muted)]">
                {story.years && <span>{story.years}</span>}
                {story.storyType && story.storyType !== 'incident' && (
                  <>
                    <span>·</span>
                    <span className="capitalize">{story.storyType}</span>
                  </>
                )}
                <span>·</span>
                <span>
                  {entityMomentCount} {entityMomentCount === 1 ? 'moment' : 'moments'}
                </span>
              </div>
            </div>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 mt-1 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
              <path d="M3.5 2L7 5l-3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        );
      })}
    </div>
  );

  const renderFiguresTab = () => (
    <div className="p-4 space-y-2">
      {notableFigures.map((figure) => {
        // Count moments this figure shares with this place
        const sharedMoments = momentEntries.filter(({ moment }) =>
          moment.entityIds?.includes(figure.id)
        ).length;
        return (
          <button
            key={figure.id}
            onClick={() => onEntityClick(figure)}
            className="w-full flex items-start gap-3 bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] rounded-lg px-3 py-2.5 transition-all group text-left"
          >
            <span className="text-lg shrink-0 opacity-60 mt-0.5">👤</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-serif font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors leading-tight">
                {figure.name}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[var(--text-muted)]">
                {figure.years && <span>{figure.years}</span>}
                <span>·</span>
                <span>
                  {sharedMoments} {sharedMoments === 1 ? 'moment' : 'moments'} here
                </span>
              </div>
              {figure.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-2">
                  {figure.description}
                </p>
              )}
            </div>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 mt-1 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
              <path d="M3.5 2L7 5l-3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        );
      })}
    </div>
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

        {/* Tab bar */}
        {renderTabBar()}

        {/* Tab content */}
        {activeTab === 'moments' ? (
          <div className="p-4">
            {momentEntries.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] italic">No moments tagged yet</p>
            ) : (
              <div className="space-y-1">
                {momentEntries.map(({ moment, stories }) =>
                  renderMomentCard(moment, stories)
                )}
              </div>
            )}
            {/* Bottom padding so last moments can reach the 40% scroll detection line */}
            <div className="h-[40vh]" />
          </div>
        ) : activeTab === 'stories' ? (
          renderStoriesTab()
        ) : activeTab === 'figures' ? (
          renderFiguresTab()
        ) : null}
      </div>
    </div>
  );
}
