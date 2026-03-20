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
import { GoDeeperCard } from './GoDeeperCard';
import { LocationCard } from './LocationCard';

interface EntityPanelProps {
  entity: Entity;
  onStoryClick: (story: Story, moment?: Moment) => void;
  onEntityClick: (entity: Entity, fromMoment?: Moment) => void;
  onScrollLocationActive?: (moment: Moment, story: Story) => void;
  onScrollToTop?: () => void;
  activeLocationId?: string | null;
  onBack?: () => void;
  backLabel?: string;
  onHome?: () => void;
}

type EntityTab = 'moments' | 'connections' | 'stories';

export function EntityPanel({
  entity,
  onStoryClick,
  onEntityClick,
  onScrollLocationActive,
  onScrollToTop,
  activeLocationId,
  onBack,
  backLabel,
  onHome,
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

  // Stories — always computed for all entity types
  // Filter out canonical stories — they're invisible infrastructure
  const entityStories = useMemo(
    () => getEntityStories(entity.id).filter(s => !canonicalStoryIds.has(s.id)),
    [entity.id]
  );

  // ─── Tabs ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<EntityTab>('moments');

  // Reset tab when entity changes
  useEffect(() => {
    setActiveTab('moments');
  }, [entity.id]);

  // Determine which tabs are visible (hide empty, single tab = no bar)
  const connectionsLabel = entity.type === 'place' ? 'Notable Figures' : 'Key Places';
  const connectionsIcon = entity.type === 'place' ? '👤' : (entity.type === 'person' ? '📍' : '👤');
  const showConnections = connections.length > 0;
  const showStories = entityStories.length > 0;
  const tabCount = 1 + (showConnections ? 1 : 0) + (showStories ? 1 : 0);

  // ─── Expandable moments ───────────────────────────────────────────
  const [expandedMomentId, setExpandedMomentId] = useState<string | null>(null);
  const expandedMomentIdRef = useRef<string | null>(null);
  useEffect(() => { expandedMomentIdRef.current = expandedMomentId; }, [expandedMomentId]);

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
  const scrollRafId = useRef(0);

  useEffect(() => {
    if (activeTab !== 'moments') return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (isProgrammaticScroll.current) return;

      cancelAnimationFrame(scrollRafId.current);
      scrollRafId.current = requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const centerY = containerRect.top + containerRect.height * 0.4;

        // If scrolled near bottom, activate the last card (it can't reach center)
        const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;

        let closestId: string | null = null;
        let closestDist = Infinity;

        // Check if all moment cards are below the center line (user scrolled to top/header)
        let allBelowCenter = true;
        momentRefs.current.forEach((el, id) => {
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          if (cardCenter <= centerY) allBelowCenter = false;
          const dist = Math.abs(cardCenter - centerY);
          if (dist < closestDist) {
            closestDist = dist;
            closestId = id;
          }
        });

        // Scrolled above all moments → reset to show all entity pins on map
        if (allBelowCenter && momentRefs.current.size > 0) {
          if (scrollActiveId) {
            setScrollActiveId(null);
            onScrollToTop?.();
          }
          // Collapse any expanded card when scrolling to top
          if (expandedMomentIdRef.current) {
            setExpandedMomentId(null);
          }
          return;
        }

        // Near bottom of scroll: force last moment active
        if (isNearBottom && momentEntries.length > 0) {
          closestId = momentEntries[momentEntries.length - 1].moment.id;
        }

        if (closestId && closestId !== scrollActiveId) {
          // Auto-collapse expanded card when scroll moves to a different card.
          // But don't collapse if the scroll center is still within the expanded card
          // (user might be reading a long expanded description).
          const currentExpanded = expandedMomentIdRef.current;
          if (currentExpanded && currentExpanded !== closestId) {
            const expandedEl = momentRefs.current.get(currentExpanded);
            const centerStillInExpanded = expandedEl && !isNearBottom && (() => {
              const r = expandedEl.getBoundingClientRect();
              return centerY >= r.top && centerY <= r.bottom;
            })();
            if (!centerStillInExpanded) {
              setExpandedMomentId(null);
              // Suppress scroll handler briefly during collapse transition
              // to prevent layout shift from flipping activation
              isProgrammaticScroll.current = true;
              setTimeout(() => { isProgrammaticScroll.current = false; }, 300);
            }
          }

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
  const renderTabButton = (key: EntityTab, label: string, icon: string, count: number) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      className={`flex-1 py-2.5 text-xs font-mono transition-colors relative ${
        activeTab === key
          ? 'text-[var(--text-primary)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
      }`}
    >
      <span className="inline-flex items-center gap-1">
        <span className="text-sm">{icon}</span>
        {label}
        <span className="text-[10px] text-[var(--text-muted)]">({count})</span>
      </span>
      {activeTab === key && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-red)]" />
      )}
    </button>
  );

  const renderTabBar = () => {
    if (tabCount <= 1) return null;
    return (
      <div className="flex border-b border-[var(--border-subtle)] shrink-0 sticky top-0 z-10 bg-[var(--bg-secondary)]">
        {renderTabButton('moments', 'Moments', '📍', momentEntries.length)}
        {showConnections && renderTabButton('connections', connectionsLabel, connectionsIcon, connections.length)}
        {showStories && renderTabButton('stories', 'Stories', '📖', entityStories.length)}
      </div>
    );
  };

  const renderMomentCard = (
    moment: Moment,
    parentStories: Story[]
  ) => {
    const primaryStory = parentStories[0];
    if (!primaryStory) return null;
    return (
      <LocationCard
        key={moment.id}
        ref={(el) => {
          if (el) momentRefs.current.set(moment.id, el);
          else momentRefs.current.delete(moment.id);
        }}
        location={moment}
        story={primaryStory}
        isActive={scrollActiveId === moment.id}
        isExpanded={expandedMomentId === moment.id}
        showExpandChevron
        skipCanonicalFilter
        parentStories={parentStories}
        excludeEntityIds={[entity.id]}
        onClick={() => handleMomentClick(moment, parentStories)}
        onStoryClick={(story) => onStoryClick(story, moment)}
        onEntityClick={(e, fromMoment) => onEntityClick(e, fromMoment)}
      />
    );
  };

  const renderStoriesTab = () => (
    <div className="p-4 space-y-2 pb-[40vh]">
      {entityStories.map((story) => {
        const sCat = CATEGORIES[story.category];
        const entityMomentCount = momentEntries.filter(({ stories: s }) =>
          s.some((ps) => ps.id === story.id)
        ).length;
        const storyTypeLabel = story.storyType && story.storyType !== 'incident' ? ` · ${story.storyType}` : '';
        return (
          <GoDeeperCard
            key={story.id}
            variant="full-width"
            label={story.name}
            sublabel={`${story.years || ''}${storyTypeLabel} · ${entityMomentCount} ${entityMomentCount === 1 ? 'moment' : 'moments'}`}
            icon={<span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: sCat.color }} />}
            onClick={() => onStoryClick(story)}
          />
        );
      })}
    </div>
  );

  const renderConnectionsTab = () => (
    <div className="p-4 space-y-2 pb-[40vh]">
      {connections.map((connEntity) => {
        const sharedMoments = momentEntries.filter(({ moment }) =>
          moment.entityIds?.includes(connEntity.id)
        ).length;
        const sharedLabel = entity.type === 'place' ? 'here' : 'shared';
        return (
          <GoDeeperCard
            key={connEntity.id}
            variant="full-width"
            label={connEntity.name}
            sublabel={`${connEntity.years || ''} · ${sharedMoments} ${sharedMoments === 1 ? 'moment' : 'moments'} ${sharedLabel}`}
            icon={<span className="text-lg opacity-60">{getEntityIcon(connEntity)}</span>}
            onClick={() => onEntityClick(connEntity)}
            description={connEntity.description}
          />
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
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
            {/* Bottom padding so last card can scroll fully into view */}
            <div className="h-[40vh]" />
          </div>
        ) : activeTab === 'connections' ? (
          renderConnectionsTab()
        ) : activeTab === 'stories' ? (
          renderStoriesTab()
        ) : null}
      </div>
    </div>
  );
}
