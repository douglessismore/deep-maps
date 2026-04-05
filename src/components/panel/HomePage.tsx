import React, { useState, useMemo, useRef, useEffect, useCallback, Fragment } from 'react';
import type { Entity, Moment, Story, StoryCategory, StoryCollection, ViewportLocation } from '../../types';
import type { EntityWithCounts } from '../../lib/entityHelpers';
import { getMomentsForEntity } from '../../lib/entityHelpers';
import { CATEGORIES } from '../../lib/categories';
import { distanceMiles } from '../../lib/geo';
import { getEffectiveNotability } from '../../lib/notability';
import { useAppData } from '../../lib/data/provider';
import { useInViewAnimation } from '../../lib/useInViewAnimation';
import { ScrollTimeline } from '../ui/ScrollTimeline';
import type { ScrollTimelineItem } from '../ui/ScrollTimeline';
import { SurpriseMeButton } from '../ui/SurpriseMeButton';

// ─── Utilities ────────────────────────────────────────────────────────

/** Extract the first 3-4 digit year from a years string like "1862-1910" or "c. 1850" */
function parseStartYear(years?: string): number | null {
  if (!years) return null;
  const match = years.match(/(\d{3,4})/);
  return match ? parseInt(match[1], 10) : null;
}

// ─── Sort Toggle (shared between People/Stories sections) ────────────

function SortToggle({
  value,
  onChange,
}: {
  value: 'nearest' | 'timeline';
  onChange: (v: 'nearest' | 'timeline') => void;
}) {
  return (
    <div className="px-4 pb-2 flex items-center gap-2">
      {(['nearest', 'timeline'] as const).map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 text-[13px] font-mono rounded-full transition-colors ${
            value === opt
              ? 'bg-white/15 text-[var(--text-primary)] ring-1 ring-white/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5'
          }`}
        >
          {opt === 'nearest' ? 'Nearest' : 'Timeline'}
        </button>
      ))}
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────

type ExpandedSection = 'nearYou' | 'stories' | 'collections' | 'people' | null;

// Module-level: persists across HomePage unmount/remount so horizontal scroll
// positions survive back navigation (component unmounts when viewing entity/story).
let savedWhatsHereScrollLeft = 0;
let savedPeopleScrollLeft = 0;
let savedStoriesScrollLeft = 0;
let savedNearYouScrollLeft = 0;
let savedCollectionsScrollLeft = 0;
let isRestoringFromBack = false; // skip viewport-change scroll reset during back nav

interface HomePageProps {
  /** Viewport-filtered moments sorted by hybridNearestScore */
  viewportLocations: ViewportLocation[];
  /** All collections from data provider */
  collections: StoryCollection[];
  /** Person entities sorted by maxNotability */
  personEntities: EntityWithCounts[];
  /** Backfill people from expanded bounds when viewport has few people */
  backfillPeople?: EntityWithCounts[];
  /** User GPS location (null if unavailable) */
  userLocation: { lat: number; lng: number } | null;
  /** Whether the user's GPS location is within the current map viewport */
  isNearUser: boolean;
  /** Callbacks */
  onMomentClick: (moment: Moment, story: Story) => void;
  onCollectionSelect: (collection: StoryCollection) => void;
  onEntityClick: (entity: Entity) => void;
  onSurpriseMe: () => void;
  /** Navigate to the explorer/4-tab view */
  onBrowseAll: () => void;
  /** Scroll highlight — called when a card scrolls into view in the horizontal row */
  onScrollHighlight?: (locations: Moment[], storyId?: string, label?: string, meta?: string, sourceType?: 'entity' | 'story' | 'collection' | 'moment', sourceId?: string) => void;
  /** Scroll-driven map pan — called with lat/lng to gently follow the highlighted card */
  onScrollPan?: (lat: number, lng: number) => void;
  /** Category filter — synced with App.tsx to also filter map markers */
  categoryFilter: StoryCategory | null;
  onCategoryFilter: (category: StoryCategory | null) => void;
  /** Categories with moments in the viewport (computed from UNFILTERED data) */
  allCategoriesInView?: Set<StoryCategory>;
  /** Browseable stories with at least one moment in viewport */
  viewportStories?: Story[];
  /** Backfill stories from expanded bounds */
  backfillStories?: Story[];
  /** Backfill moments from expanded bounds */
  backfillMoments?: ViewportLocation[];
  /** Backfill collections from expanded bounds */
  backfillCollections?: StoryCollection[];
  /** Story click handler */
  onStorySelect?: (story: Story) => void;
  /** Ref callback for the home scroll container (used by parent to snapshot scroll on nav) */
  scrollRef?: (el: HTMLDivElement | null) => void;
  /** Scroll position tracking — saves scroll position for back navigation */
  onScrollPosition?: (scrollTop: number) => void;
  /** Restore scroll position after back navigation */
  restoreScrollTop?: number | null;
  onScrollRestored?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDistance(miles: number): string {
  if (miles < 0.1) return 'Here';
  if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`;
  if (miles < 100) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

/** Get the story category for a ViewportLocation */
function getVlCategory(vl: ViewportLocation): StoryCategory | null {
  return vl.story?.category ?? null;
}

// ─── useScrollActiveIndex hook ──────────────────────────────────────
// Shared IntersectionObserver logic for detecting the centered card in a scroll row.
// Returns the index of the card closest to center (horizontal) or top (vertical).

function useScrollActiveIndex(
  containerRef: React.RefObject<HTMLElement | null>,
  itemCount: number,
  enabled: boolean,
  mode: 'horizontal' | 'vertical' = 'horizontal',
  /** For vertical mode: listen for scroll on this parent instead of containerRef */
  scrollParentRef?: React.RefObject<HTMLElement | null>,
): { index: number; cardId: string | null } {
  // Start at -1 so the initial findCenter() call (which sets 0) registers as a
  // state change, enabling the first card to be highlighted.
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || itemCount === 0) return;

    const scrollTarget = (mode === 'vertical' && scrollParentRef?.current) ? scrollParentRef.current : container;

    let rafId = 0;
    const findCenter = () => {
      const allChildren = container.children;
      let closestIdx = 0;
      let closestDist = Infinity;
      let closestCardId: string | null = null;

      if (mode === 'horizontal') {
        const rect = container.getBoundingClientRect();
        // When scrolled to the very start, the first card is active
        const atStart = container.scrollLeft < 20;
        // Use 30% from left — biased toward the snapped card's body.
        const referenceX = rect.left + rect.width * 0.3;
        for (let i = 0; i < allChildren.length; i++) {
          const child = allChildren[i] as HTMLElement;
          const cardIndex = child.dataset?.cardIndex;
          if (cardIndex === undefined) continue;
          const idx = parseInt(cardIndex, 10);
          const cardRect = child.getBoundingClientRect();
          const cardDetectX = cardRect.left + cardRect.width * 0.33;
          const dist = Math.abs(cardDetectX - referenceX);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = idx;
            closestCardId = child.dataset?.cardId ?? null;
          }
        }
        // When scrolled all the way left, force the first card as active
        if (atStart) {
          for (let i = 0; i < allChildren.length; i++) {
            const child = allChildren[i] as HTMLElement;
            if (child.dataset?.cardIndex !== undefined) {
              closestIdx = parseInt(child.dataset.cardIndex, 10);
              closestCardId = child.dataset?.cardId ?? null;
              break;
            }
          }
        }
      } else {
        const parentRect = scrollTarget.getBoundingClientRect();
        const targetY = parentRect.top + parentRect.height * 0.35;
        for (let i = 0; i < allChildren.length; i++) {
          const child = allChildren[i] as HTMLElement;
          const cardIndex = child.dataset?.cardIndex;
          if (cardIndex === undefined) continue;
          const idx = parseInt(cardIndex, 10);
          const cardRect = child.getBoundingClientRect();
          const cardCenterY = cardRect.top + cardRect.height / 2;
          const dist = Math.abs(cardCenterY - targetY);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = idx;
            closestCardId = child.dataset?.cardId ?? null;
          }
        }
      }
      setActiveIndex(closestIdx);
      setActiveCardId(closestCardId);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(findCenter);
    };

    // scrollend fires after scroll-snap animation completes — ensures we
    // detect the final settled position (critical for first-card detection
    // when snapping back to scrollLeft=0).
    let scrollEndTimer: ReturnType<typeof setTimeout>;
    const onScrollEnd = () => {
      findCenter();
    };
    // Fallback for browsers without scrollend: debounced timer
    const onScrollFallback = () => {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(findCenter, 120);
    };

    // Initial calculation
    findCenter();

    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    scrollTarget.addEventListener('scrollend', onScrollEnd, { passive: true });
    scrollTarget.addEventListener('scroll', onScrollFallback, { passive: true });
    return () => {
      scrollTarget.removeEventListener('scroll', onScroll);
      scrollTarget.removeEventListener('scrollend', onScrollEnd);
      scrollTarget.removeEventListener('scroll', onScrollFallback);
      cancelAnimationFrame(rafId);
      clearTimeout(scrollEndTimer);
    };
  }, [containerRef, scrollParentRef, itemCount, enabled, mode]);

  return { index: activeIndex, cardId: activeCardId };
}

// ─── Section heading ─────────────────────────────────────────────────

function SectionHeading({
  title,
  expanded,
  onToggle,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-baseline justify-between px-4 mb-4 sticky top-0 z-10 bg-[var(--bg-primary)] py-2 -mt-2">
      <h2 className="text-[18px] font-serif font-semibold text-[var(--text-primary)] tracking-[-0.01em]">
        {title}
      </h2>
      <button
        onClick={onToggle}
        className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0 ml-4"
      >
        {expanded ? '\u2190 Show less' : 'See all \u2192'}
      </button>
    </div>
  );
}

/** Simple section heading without toggle */
function SectionTitle({ title }: { title: string }) {
  return (
    <div className="px-4 mb-4 sticky top-0 z-10 bg-[var(--bg-primary)] py-2 -mt-2">
      <h2 className="text-[18px] font-serif font-semibold text-[var(--text-primary)] tracking-[-0.01em]">
        {title}
      </h2>
    </div>
  );
}

// ─── Category filter pills ──────────────────────────────────────────

const CATEGORY_ENTRIES = Object.entries(CATEGORIES) as [StoryCategory, { label: string; color: string; bgColor: string; borderColor: string }][];

function CategoryFilterPills({
  selected,
  onSelect,
  categoriesInView,
}: {
  selected: StoryCategory | null;
  onSelect: (cat: StoryCategory | null) => void;
  categoriesInView?: Set<StoryCategory>;
}) {
  // Split categories: in-view first, then out-of-view
  const inView = CATEGORY_ENTRIES.filter(([key]) => !categoriesInView || categoriesInView.has(key));
  const outOfView = categoriesInView ? CATEGORY_ENTRIES.filter(([key]) => !categoriesInView.has(key)) : [];

  return (
    <div
      className="flex gap-2.5 overflow-x-auto px-4 pb-2 no-scrollbar items-center"
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: 'manipulation',
      }}
    >
      {/* "All" pill */}
      <button
        onClick={() => onSelect(null)}
        className="shrink-0 px-3 py-1 rounded-full text-[11px] font-sans font-medium transition-all duration-150"
        style={{
          backgroundColor: selected === null ? 'rgba(255,255,255,0.12)' : 'transparent',
          color: selected === null ? 'var(--text-primary)' : 'var(--text-muted)',
          border: `1px solid ${selected === null ? 'rgba(255,255,255,0.2)' : 'var(--border-subtle)'}`,
        }}
      >
        All
      </button>
      {/* Categories with moments in view */}
      {inView.map(([key, config]) => {
        const isActive = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(isActive ? null : key)}
            className="shrink-0 px-3 py-1 rounded-full text-[11px] font-sans font-medium transition-all duration-150 whitespace-nowrap"
            style={{
              backgroundColor: isActive ? config.bgColor : 'transparent',
              color: isActive ? config.color : 'var(--text-muted)',
              border: `1px solid ${isActive ? config.borderColor : 'var(--border-subtle)'}`,
            }}
          >
            {config.label}
          </button>
        );
      })}
      {/* Separator + out-of-view categories (dimmed, with "zoom out" hint) */}
      {outOfView.length > 0 && (
        <>
          <span className="shrink-0 text-[10px] font-sans text-[var(--text-muted)] opacity-50 px-1">
            zoom out
          </span>
          {outOfView.map(([key, config]) => {
            const isActive = selected === key;
            return (
              <button
                key={key}
                onClick={() => onSelect(isActive ? null : key)}
                className="shrink-0 px-3 py-1 rounded-full text-[11px] font-sans font-medium transition-all duration-150 whitespace-nowrap opacity-40"
                style={{
                  backgroundColor: isActive ? config.bgColor : 'transparent',
                  color: isActive ? config.color : 'var(--text-muted)',
                  border: `1px solid ${isActive ? config.borderColor : 'var(--border-subtle)'}`,
                }}
              >
                {config.label}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── Highlight style helper ─────────────────────────────────────────
// Returns inline style for a card based on whether it's the active (centered) one.

function cardHighlightStyle(isActive: boolean, categoryColor?: string): React.CSSProperties {
  if (!isActive) return {};
  const color = categoryColor || '#D4A853';
  return {
    transform: 'scale(1.03)',
    borderColor: `${color}aa`,
    borderWidth: '2px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    boxShadow: `0 0 16px ${color}44, 0 4px 12px rgba(0,0,0,0.4)`,
  };
}

// ─── Near You card ───────────────────────────────────────────────────

function NearYouCard({
  location,
  story,
  distance,
  onClick,
  isActive,
  contextLine,
  cardIndex,
  cardId,
}: {
  location: Moment;
  story: Story | null;
  distance: number;
  onClick: () => void;
  isActive?: boolean;
  /** "Serial Killer Crime Scenes" or "3 people · 2 places connected" */
  contextLine?: string | null;
  cardIndex?: number;
  cardId?: string;
}) {
  const cat = story ? CATEGORIES[story.category] : undefined;

  return (
    <button
      onClick={onClick}
      data-card-index={cardIndex}
      data-card-id={cardId}
      className="shrink-0 w-[200px] rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden snap-start card-animate-in"
      style={cardHighlightStyle(!!isActive, cat?.color)}
    >
      {/* Category accent bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: cat?.color ?? 'var(--text-muted)' }}
      />
      <div className="p-3 flex flex-col justify-between h-[140px]">
        <div className="min-w-0">
          {story && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[11px] font-sans text-[var(--text-muted)] truncate">
                {story.nickname && story.nickname.includes(' ') ? story.nickname : story.name}
              </span>
            </div>
          )}
          <h3 className="text-[15px] font-serif font-bold text-white leading-tight line-clamp-2">
            {location.name}
          </h3>
          {(location.subtitle || location.address) && (
            <p className="text-[12px] text-[var(--text-secondary)] leading-snug mt-1 line-clamp-1 italic">
              {location.subtitle || location.address}
            </p>
          )}
        </div>
        <div className="mt-auto pt-1">
          {contextLine ? (
            <p className="text-[10px] font-mono text-[var(--accent-red)] opacity-70 truncate mb-0.5">
              {contextLine}
            </p>
          ) : cat && (
            <p className="text-[10px] font-mono opacity-60 truncate mb-0.5" style={{ color: cat.color }}>
              {cat.label}
            </p>
          )}
          <div className="flex items-center gap-2">
            {location.year && (
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {location.year}
              </span>
            )}
            {location.year && distance > 0 && (
              <span className="text-[var(--text-muted)]">&middot;</span>
            )}
            {distance > 0 && (
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Near You card (vertical/expanded) ──────────────────────────────

function NearYouCardVertical({
  location,
  story,
  distance,
  onClick,
  isActive,
  contextLine,
}: {
  location: Moment;
  story: Story | null;
  distance: number;
  onClick: () => void;
  isActive?: boolean;
  contextLine?: string | null;
}) {
  const cat = story ? CATEGORIES[story.category] : undefined;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden card-animate-in"
      style={cardHighlightStyle(!!isActive, cat?.color)}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Category accent dot */}
        <div
          className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
          style={{ backgroundColor: cat?.color ?? 'var(--text-muted)' }}
        />
        <div className="min-w-0 flex-1">
          {story && (
            <span className="text-[11px] font-sans text-[var(--text-muted)] block truncate mb-0.5">
              {story.nickname && story.nickname.includes(' ') ? story.nickname : story.name}
            </span>
          )}
          <h3 className="text-[15px] font-serif font-bold text-white leading-tight line-clamp-2">
            {location.name}
          </h3>
          {(location.subtitle || location.address) && (
            <p className="text-[12px] text-[var(--text-secondary)] leading-snug mt-0.5 line-clamp-1 italic">
              {location.subtitle || location.address}
            </p>
          )}
          {contextLine ? (
            <p className="text-[10px] font-mono text-[var(--accent-red)] opacity-70 truncate mt-1">
              {contextLine}
            </p>
          ) : cat && (
            <p className="text-[10px] font-mono opacity-60 truncate mt-1" style={{ color: cat.color }}>
              {cat.label}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {location.year && (
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {location.year}
            </span>
          )}
          {distance > 0 && (
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {formatDistance(distance)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Collection card (horizontal) ────────────────────────────────────

function HomeCollectionCard({
  collection,
  imageUrl,
  onClick,
  isActive,
  inViewCount,
  isBackfill,
  cardIndex,
  cardId,
}: {
  collection: StoryCollection;
  imageUrl?: string;
  onClick: () => void;
  isActive?: boolean;
  /** How many of this collection's moments are currently visible on the map */
  inViewCount?: number;
  isBackfill?: boolean;
  cardIndex?: number;
  cardId?: string;
}) {
  const total = collection.momentIds.length;
  const hasMore = isActive && inViewCount != null && inViewCount < total;

  return (
    <button
      onClick={onClick}
      data-card-index={cardIndex}
      data-card-id={cardId}
      className="shrink-0 w-[200px] rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden snap-start card-animate-in"
      style={cardHighlightStyle(!!isActive)}
    >
      {imageUrl && (
        <div className="h-[80px] w-full overflow-hidden">
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3 flex flex-col justify-between" style={{ height: imageUrl ? '90px' : '100px' }}>
        <div className="min-w-0">
          <h3 className="text-[13px] font-serif font-bold text-white leading-tight line-clamp-2">
            {collection.name}
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-1 line-clamp-2">
            {collection.subtitle}
          </p>
        </div>
        <div className="mt-auto pt-1 flex items-baseline gap-1.5">
          {hasMore && !isBackfill ? (
            <>
              <span className="text-[10px] font-mono text-[var(--text-primary)] uppercase tracking-wider">
                {inViewCount} of {total} in view
              </span>
              <span className="text-[9px] font-mono text-[var(--accent-red)] opacity-80">
                zoom out ↗
              </span>
            </>
          ) : (
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              {total} events
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Collection card (grid/expanded) ─────────────────────────────────

function CollectionGridCard({
  collection,
  imageUrl,
  onClick,
}: {
  collection: StoryCollection;
  imageUrl?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden"
    >
      {imageUrl && (
        <div className="h-[70px] w-full overflow-hidden">
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3 flex flex-col justify-between" style={{ height: imageUrl ? '80px' : '90px' }}>
        <div className="min-w-0">
          <h3 className="text-[12px] font-serif font-bold text-white leading-tight line-clamp-2">
            {collection.name}
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-1 line-clamp-2">
            {collection.subtitle}
          </p>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mt-auto pt-1">
          {collection.momentIds.length} events
        </span>
      </div>
    </button>
  );
}

// ─── Story card (horizontal scroll) ─────────────────────────────────

function HomeStoryCard({
  story,
  inViewCount,
  isActive,
  isBackfill,
  distanceMi,
  onClick,
  cardIndex,
  cardId,
}: {
  story: Story;
  inViewCount: number;
  isActive?: boolean;
  isBackfill?: boolean;
  distanceMi?: number;
  onClick: () => void;
  cardIndex?: number;
  cardId?: string;
}) {
  const cat = CATEGORIES[story.category];
  const total = story.moments.length;
  return (
    <button
      onClick={onClick}
      data-card-index={cardIndex}
      data-card-id={cardId}
      className="w-[200px] shrink-0 snap-start rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden text-left transition-all duration-300 active:scale-[0.97]"
      style={cardHighlightStyle(!!isActive, cat?.color)}
    >
      {/* Image or category color bar */}
      {story.imageUrl ? (
        <div className="h-[80px] w-full overflow-hidden">
          <img
            src={story.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-1" style={{ background: cat?.color ?? '#666' }} />
      )}
      <div className={`p-3 flex flex-col justify-between ${story.imageUrl ? 'h-[72px]' : 'h-[110px]'}`}>
        <div className="min-w-0">
          <h4 className="text-[14px] font-serif font-bold text-[var(--text-primary)] leading-tight line-clamp-2">
            {story.name}
          </h4>
          {!story.imageUrl && (
            <p className="text-[11px] text-[var(--text-muted)] font-mono mt-1">{story.years}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {story.imageUrl ? story.years : ''}{story.imageUrl && ' · '}{!isBackfill && inViewCount < total
              ? `${inViewCount} of ${total} moments`
              : `${total} moments`}{distanceMi != null ? ` · ${formatDistance(distanceMi)}` : ''}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─── Person grid card ───────────────────────────────────────────────

// ─── Person row ─────────────────────────────────────────────────────

function PersonRow({
  entity,
  momentCount,
  onClick,
  isActive,
}: {
  entity: Entity;
  momentCount: number;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.99] text-left card-animate-in"
      style={isActive ? {
        backgroundColor: 'rgba(139,92,246,0.06)',
        boxShadow: '0 0 20px rgba(139,92,246,0.15), inset 2px 0 0 rgba(139,92,246,0.6)',
      } : undefined}
    >
      {entity.imageUrl ? (
        <img
          src={entity.imageUrl}
          alt={entity.name}
          className={`w-9 h-9 rounded-full object-cover shrink-0 ring-1 ${isActive ? 'ring-[rgba(139,92,246,0.6)]' : 'ring-[rgba(255,255,255,0.1)]'}`}
          loading="lazy"
        />
      ) : (
        <span className={`w-9 h-9 rounded-full bg-[rgba(139,92,246,0.15)] ring-1 flex items-center justify-center text-[12px] font-bold text-[rgba(139,92,246,0.8)] shrink-0 ${isActive ? 'ring-[rgba(139,92,246,0.6)]' : 'ring-[rgba(139,92,246,0.3)]'}`}>
          {entity.name[0].toUpperCase()}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-[14px] font-sans font-semibold text-[var(--text-primary)] block truncate">
          {entity.name}
        </span>
        {entity.description && (
          <span className="text-[12px] text-[var(--text-muted)] block truncate mt-0.5">
            {entity.description}
          </span>
        )}
      </div>
      <div className="shrink-0 text-right">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          {momentCount} events
        </span>
      </div>
    </button>
  );
}

function PersonCard({
  entity,
  momentCount,
  onClick,
  isActive,
  distanceMi,
  yearLabel,
  cardIndex,
  cardId,
}: {
  entity: Entity;
  momentCount: number;
  onClick: () => void;
  isActive?: boolean;
  distanceMi?: number;
  yearLabel?: string;
  cardIndex?: number;
  cardId?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-card-index={cardIndex}
      data-card-id={cardId}
      className="flex flex-col items-center w-[130px] shrink-0 snap-start pt-3 pb-2 rounded-xl transition-all duration-200 active:scale-[0.97] card-animate-in"
      style={{
        scrollSnapAlign: 'start',
        ...(isActive ? {
          backgroundColor: 'rgba(139,92,246,0.1)',
          boxShadow: '0 0 16px rgba(139,92,246,0.3), inset 0 0 0 2px rgba(139,92,246,0.5)',
          borderRadius: '12px',
        } : {}),
      }}
    >
      {entity.imageUrl ? (
        <img
          src={entity.imageUrl}
          alt={entity.name}
          className={`w-14 h-14 rounded-full object-cover ${isActive ? 'ring-2 ring-[rgba(139,92,246,0.7)]' : 'ring-1 ring-[rgba(255,255,255,0.1)]'}`}
          loading="lazy"
        />
      ) : (
        <span className={`w-14 h-14 rounded-full bg-[rgba(139,92,246,0.15)] flex items-center justify-center text-[16px] font-bold text-[rgba(139,92,246,0.8)] ${isActive ? 'ring-2 ring-[rgba(139,92,246,0.7)]' : 'ring-1 ring-[rgba(139,92,246,0.3)]'}`}>
          {entity.name[0].toUpperCase()}
        </span>
      )}
      <span className="mt-1.5 text-[14px] font-serif font-bold text-[var(--text-primary)] w-full text-center truncate px-1">
        {entity.name}
      </span>
      <span className="text-[11px] font-mono text-[var(--text-muted)]">
        {yearLabel
          ? `${yearLabel} · ${momentCount} events`
          : `${momentCount} events${distanceMi != null ? ` · ${formatDistance(distanceMi)}` : ''}`
        }
      </span>
    </button>
  );
}

// ─── Backfill divider (between in-view and off-screen items) ────────

function BackfillDivider() {
  return (
    <div className="shrink-0 flex items-center self-stretch px-2 snap-start">
      <div className="flex flex-col items-center gap-1.5 py-2">
        <div className="w-px h-4 bg-[rgba(255,255,255,0.2)]" />
        <div className="flex flex-col items-center gap-0.5 px-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] whitespace-nowrap">
            Zoom out
          </span>
          <span className="text-[9px] text-[var(--text-muted)] opacity-60 whitespace-nowrap">
            to see more
          </span>
        </div>
        <div className="w-px h-4 bg-[rgba(255,255,255,0.2)]" />
      </div>
    </div>
  );
}

// ─── Backfill hint (when ALL items are off-screen) ──────────────────

function BackfillHint() {
  return (
    <div className="mx-4 mb-2 px-3 py-1.5 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]">
      <p className="text-[11px] font-mono text-[var(--text-secondary)]">
        Not on the map yet — zoom out or tap to explore
      </p>
    </div>
  );
}

// ─── What's Here unified carousel types + cards ─────────────────────

type WhatsHereItem =
  | { kind: 'story'; story: Story; distance: number; inViewCount: number }
  | { kind: 'person'; entity: Entity; momentCount: number; maxNotability: number; distance: number }
  | { kind: 'moment'; vl: ViewportLocation; distance: number }
  | { kind: 'place'; entity: Entity; momentCount: number; distance: number };

const WHATS_HERE_CARD_W = 'w-[280px]';

function WhatsHereStoryCard({
  story,
  inViewCount,
  distance,
  isActive,
  onClick,
  cardIndex,
  cardId,
}: {
  story: Story;
  inViewCount: number;
  distance: number;
  isActive?: boolean;
  onClick: () => void;
  cardIndex?: number;
  cardId?: string;
}) {
  const cat = CATEGORIES[story.category];
  const total = story.moments.length;
  const hasImage = !!story.imageUrl;

  return (
    <button
      onClick={onClick}
      data-card-index={cardIndex}
      data-card-id={cardId}
      className={`${WHATS_HERE_CARD_W} h-[150px] shrink-0 snap-start rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden text-left transition-all duration-300 active:scale-[0.97]`}
      style={cardHighlightStyle(!!isActive, cat?.color)}
    >
      {hasImage ? (
        /* Image card: image fills top, title overlaid at bottom of image */
        <div className="flex flex-col h-full">
          <div className="relative w-full flex-1 min-h-0 overflow-hidden">
            <img src={story.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-1">
              <h4 className="text-[14px] font-serif font-bold text-white leading-tight line-clamp-2 drop-shadow-sm">
                {story.name}
              </h4>
            </div>
          </div>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: cat?.color ?? 'var(--text-muted)' }}>Story</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {story.years} &middot; {inViewCount < total ? `${inViewCount}/${total}` : total} moments &middot; {formatDistance(distance)}
            </span>
          </div>
        </div>
      ) : (
        /* No-image card: color bar + text content */
        <div className="flex flex-col h-full">
          <div className="h-[3px] shrink-0" style={{ backgroundColor: cat?.color ?? '#666' }} />
          <div className="px-3 pt-2.5 pb-2 flex flex-col justify-between flex-1">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: cat?.color ?? 'var(--text-muted)' }}>Story</span>
              <h4 className="text-[14px] font-serif font-bold text-[var(--text-primary)] leading-tight line-clamp-2">
                {story.name}
              </h4>
              {story.description && (
                <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-1 line-clamp-2">
                  {story.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-auto pt-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {story.years} &middot; {inViewCount < total ? `${inViewCount}/${total}` : total} moments &middot; {formatDistance(distance)}
              </span>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

function WhatsHerePersonCard({
  entity,
  momentCount,
  distance,
  isActive,
  onClick,
  cardIndex,
  cardId,
}: {
  entity: Entity;
  momentCount: number;
  distance: number;
  isActive?: boolean;
  isFeature?: boolean;
  onClick: () => void;
  cardIndex?: number;
  cardId?: string;
}) {
  const PURPLE = 'rgba(139,92,246';

  return (
    <button
      onClick={onClick}
      data-card-index={cardIndex}
      data-card-id={cardId}
      className={`${WHATS_HERE_CARD_W} h-[150px] shrink-0 snap-start rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden text-left transition-all duration-300 active:scale-[0.97]`}
      style={{
        ...cardHighlightStyle(!!isActive, `${PURPLE},1)`),
        borderLeft: `3px solid ${PURPLE},0.6)`,
      }}
    >
      <div className="p-3 flex gap-3 h-full">
        {entity.imageUrl ? (
          <img
            src={entity.imageUrl}
            alt={entity.name}
            className="w-16 h-16 rounded-full object-cover shrink-0 ring-1 ring-[rgba(139,92,246,0.3)]"
            loading="lazy"
          />
        ) : (
          <span className="w-16 h-16 rounded-full bg-[rgba(139,92,246,0.15)] ring-1 ring-[rgba(139,92,246,0.3)] flex items-center justify-center text-[18px] font-bold text-[rgba(139,92,246,0.8)] shrink-0">
            {entity.name[0].toUpperCase()}
          </span>
        )}
        <div className="flex flex-col justify-between min-w-0 flex-1">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(139,92,246,0.8)]">Person</span>
            <h4 className="text-[14px] font-serif font-bold text-[var(--text-primary)] leading-tight line-clamp-2">
              {entity.name}
            </h4>
            {entity.years && (
              <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">{entity.years}</p>
            )}
            {entity.description && (
              <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5 line-clamp-2">
                {entity.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-auto pt-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {momentCount} events
            </span>
            <span className="text-[var(--text-muted)]">&middot;</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {formatDistance(distance)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function WhatsHereMomentCard({
  vl,
  distance,
  isActive,
  onClick,
  cardIndex,
  cardId,
}: {
  vl: ViewportLocation;
  distance: number;
  isActive?: boolean;
  onClick: () => void;
  cardIndex?: number;
  cardId?: string;
}) {
  const cat = vl.story ? CATEGORIES[vl.story.category] : undefined;
  const heroImage = vl.location.media?.[0]?.type === 'image' ? vl.location.media[0].url
    : vl.story?.imageUrl ?? null;

  return (
    <button
      onClick={onClick}
      data-card-index={cardIndex}
      data-card-id={cardId}
      className={`${WHATS_HERE_CARD_W} h-[150px] shrink-0 snap-start rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden`}
      style={cardHighlightStyle(!!isActive, cat?.color)}
    >
      {heroImage ? (
        /* Image card: image fills top, title overlaid */
        <div className="flex flex-col h-full">
          <div className="relative w-full flex-1 min-h-0 overflow-hidden">
            <img src={heroImage} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-1">
              <h4 className="text-[14px] font-serif font-bold text-white leading-tight line-clamp-2 drop-shadow-sm">
                {vl.location.name}
              </h4>
            </div>
          </div>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: cat?.color ?? 'var(--text-muted)' }}>Moment</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {vl.location.year ? `${vl.location.year} · ` : ''}{formatDistance(distance)}
            </span>
          </div>
        </div>
      ) : (
        /* No-image card: color bar + text */
        <div className="flex flex-col h-full">
          <div className="h-[3px] shrink-0" style={{ backgroundColor: cat?.color ?? '#666' }} />
          <div className="px-3 pt-2.5 pb-2 flex flex-col justify-between flex-1">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: cat?.color ?? 'var(--text-muted)' }}>Moment</span>
              <h4 className="text-[14px] font-serif font-bold text-white leading-tight line-clamp-2">
                {vl.location.name}
              </h4>
              {vl.story && (
                <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5 line-clamp-1">
                  {vl.story.nickname && vl.story.nickname.includes(' ') ? vl.story.nickname : vl.story.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-auto pt-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {vl.location.year ? `${vl.location.year} · ` : ''}{formatDistance(distance)}
              </span>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

function WhatsHerePlaceCard({
  entity,
  momentCount,
  distance,
  isActive,
  onClick,
  cardIndex,
  cardId,
}: {
  entity: Entity;
  momentCount: number;
  distance: number;
  isActive?: boolean;
  onClick: () => void;
  cardIndex?: number;
  cardId?: string;
}) {
  const GREEN = '#059669';
  const hasImage = !!entity.imageUrl;

  return (
    <button
      onClick={onClick}
      data-card-index={cardIndex}
      data-card-id={cardId}
      className={`${WHATS_HERE_CARD_W} h-[150px] shrink-0 snap-start rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden`}
      style={cardHighlightStyle(!!isActive, GREEN)}
    >
      {hasImage ? (
        <div className="flex flex-col h-full">
          <div className="relative w-full flex-1 min-h-0 overflow-hidden">
            <img src={entity.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-1">
              <h4 className="text-[14px] font-serif font-bold text-white leading-tight line-clamp-2 drop-shadow-sm">
                {entity.name}
              </h4>
            </div>
          </div>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(5,150,105,0.8)]">Place</span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {momentCount} events &middot; {formatDistance(distance)}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="h-[3px] shrink-0" style={{ backgroundColor: GREEN }} />
          <div className="px-3 pt-2.5 pb-2 flex flex-col justify-between flex-1">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(5,150,105,0.8)]">Place</span>
              <h4 className="text-[14px] font-serif font-bold text-white leading-tight line-clamp-2">
                {entity.name}
              </h4>
              {entity.description && (
                <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-1 line-clamp-2">
                  {entity.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 mt-auto pt-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                {momentCount} events &middot; {formatDistance(distance)}
              </span>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Horizontal scroll container ─────────────────────────────────────

function HScrollRow({
  children,
  scrollRef,
  onLoadMore,
}: {
  children: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  /** Called when user scrolls near the end — triggers loading more items */
  onLoadMore?: () => void;
}) {
  const loadMoreFired = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  // Reset the load-more gate when children count changes (new batch loaded)
  const childCount = React.Children.count(children);
  useEffect(() => {
    loadMoreFired.current = false;
  }, [childCount]);

  useEffect(() => {
    if (!onLoadMoreRef.current) return;
    const el = scrollRef?.current;
    if (!el) return;
    const onScroll = () => {
      if (loadMoreFired.current || !onLoadMoreRef.current) return;
      // Fire when within ~2 card widths (400px) of the end
      if (el.scrollLeft + el.clientWidth > el.scrollWidth - 400) {
        loadMoreFired.current = true;
        onLoadMoreRef.current();
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollRef, childCount]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar"
      style={{
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'manipulation',
        overscrollBehaviorX: 'contain',
      }}
    >
      {children}
      {/* End spacer: allows the last card to scroll to the detection point.
          Has snap-start so scroll-snap-type:mandatory allows reaching it. */}
      <div className="shrink-0 w-[40vw] snap-start" aria-hidden="true" />
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export function HomePage({
  viewportLocations,
  collections,
  personEntities,
  backfillPeople,
  userLocation,
  isNearUser: _isNearUser,
  onMomentClick,
  onCollectionSelect,
  onEntityClick,
  onSurpriseMe,
  onBrowseAll,
  onScrollHighlight,
  onScrollPan,
  categoryFilter,
  onCategoryFilter,
  allCategoriesInView,
  viewportStories,
  backfillStories,
  backfillMoments,
  backfillCollections,
  onStorySelect,
  scrollRef,
  onScrollPosition,
  restoreScrollTop,
  onScrollRestored,
}: HomePageProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);

  // Sort mode for People, Stories, and Moments sections
  const [peopleSort, setPeopleSort] = useState<'nearest' | 'timeline'>('nearest');
  const [storiesSort, setStoriesSort] = useState<'nearest' | 'timeline'>('nearest');
  const [nearYouSort, setNearYouSort] = useState<'nearest' | 'timeline'>('nearest');
  const [whatsHereSort, setWhatsHereSort] = useState<'nearest' | 'timeline'>('nearest');

  // Layout variant switcher — tap hero text 3 times to cycle through orderings
  type LayoutVariant = 'A' | 'B' | 'C' | 'D';
  const LAYOUT_LABELS: Record<LayoutVariant, string> = {
    A: 'People → Stories → Moments → Collections',
    B: 'Stories → People → Moments → Collections',
    C: 'Moments → People → Stories → Collections',
    D: 'Collections → People → Stories → Moments',
  };
  const LAYOUT_ORDERS: Record<LayoutVariant, string[]> = {
    A: ['people', 'stories', 'moments', 'collections'],
    B: ['stories', 'people', 'moments', 'collections'],
    C: ['moments', 'people', 'stories', 'collections'],
    D: ['collections', 'people', 'stories', 'moments'],
  };
  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant>('A');
  const layoutTapCount = useRef(0);
  const layoutTapTimer = useRef(0);
  const handleHeroTap = useCallback(() => {
    layoutTapCount.current++;
    clearTimeout(layoutTapTimer.current);
    layoutTapTimer.current = window.setTimeout(() => { layoutTapCount.current = 0; }, 800);
    if (layoutTapCount.current >= 3) {
      layoutTapCount.current = 0;
      setLayoutVariant((prev) => {
        const variants: LayoutVariant[] = ['A', 'B', 'C', 'D'];
        const idx = variants.indexOf(prev);
        return variants[(idx + 1) % variants.length];
      });
    }
  }, []);

  // Global data for counts + moment lookup
  const { moments: allMoments, browseableStories: allStories, stories, entities } = useAppData();

  // Build moment-to-story lookup for collection highlighting
  const momentToStoryMap = useMemo(() => {
    const m = new Map<string, Story>();
    stories.forEach((s) => {
      s.moments.forEach((sm) => {
        if (!m.has(sm.momentId)) m.set(sm.momentId, s);
      });
    });
    return m;
  }, [stories]);

  // Build moment-by-id lookup
  const momentById = useMemo(() => new Map(allMoments.map((m) => [m.id, m])), [allMoments]);

  // ── Context line for moment cards ──
  // Priority: collection name pill > entity count ("3 people · 2 places")
  const entityById = useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);
  const momentToCollectionName = useMemo(() => {
    const m = new Map<string, string>();
    collections.forEach((c) => {
      c.momentIds.forEach((mid) => {
        if (!m.has(mid)) m.set(mid, c.name);
      });
    });
    return m;
  }, [collections]);

  const getMomentContextLine = useCallback((moment: Moment): string | null => {
    // Priority 1: collection name
    const collName = momentToCollectionName.get(moment.id);
    if (collName) return collName;

    // Priority 2: entity counts by type
    if (!moment.entityIds?.length) return null;
    let people = 0;
    let places = 0;
    for (const eid of moment.entityIds) {
      const e = entityById.get(eid);
      if (!e) continue;
      if (e.type === 'person') people++;
      else if (e.type === 'place' || e.type === 'organization') places++;
    }
    const parts: string[] = [];
    if (people > 0) parts.push(`${people} ${people === 1 ? 'person' : 'people'}`);
    if (places > 0) parts.push(`${places} ${places === 1 ? 'place' : 'places'}`);
    if (parts.length === 0) return null;
    return parts.join(' · ') + ' connected';
  }, [entityById, momentToCollectionName]);

  // Collection hero images disabled — Wikipedia lead images were poor picks.
  // Re-enable when we have curated images per collection.

  // Section 1: Near You — top moments by hybridNearestScore (already sorted from parent)
  // Filter to moments that have a parent story so every card is clickable.
  // Frozen while user scrolls to prevent card reshuffling mid-scroll (map pan changes viewport).
  const [isNearYouScrolling, setIsNearYouScrolling] = useState(false);
  const isNavigating = useRef(false);
  const nearYouScrollTimeout = useRef(0);
  const nearYouMomentsLive = useMemo(() => {
    const sorted = [...viewportLocations]
      .filter((vl) => vl.story !== null)
      .filter((vl) => categoryFilter === null || getVlCategory(vl) === categoryFilter)
      .sort((a, b) => {
        const aN = getEffectiveNotability(a.location);
        const bN = getEffectiveNotability(b.location);
        return bN - aN || a.distance - b.distance;
      });
    return sorted.slice(0, 20);
  }, [viewportLocations, categoryFilter]);
  // Fallback: when viewport has no moments, show nearest globally (so content is never empty)
  // Fallback: when viewport has no moments, show nearest globally (so content is never empty)
  const nearestFallback = useMemo(() => {
    if (nearYouMomentsLive.length > 0 || !userLocation) return [];
    // Build moment→story lookup
    const momentToStory = new Map<string, Story>();
    for (const s of stories) {
      for (const sm of s.moments) {
        momentToStory.set(sm.momentId, s);
      }
    }
    return allMoments
      .filter(m => {
        const s = momentToStory.get(m.id);
        return s && (categoryFilter === null || s.category === categoryFilter);
      })
      .map(m => ({
        location: m,
        story: momentToStory.get(m.id) ?? null,
        distance: distanceMiles(userLocation.lat, userLocation.lng, m.lat, m.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20);
  }, [nearYouMomentsLive.length, userLocation, allMoments, stories, categoryFilter]);

  // Merge viewport moments with backfill (off-screen) moments
  const nearYouWithBackfill = useMemo(() => {
    const base = nearYouMomentsLive.length > 0 ? nearYouMomentsLive : nearestFallback;
    if (!backfillMoments || backfillMoments.length === 0) return base;
    const inViewIds = new Set(base.map(vl => vl.location.id));
    let fill = backfillMoments.filter(vl => !inViewIds.has(vl.location.id));
    // Apply category filter to backfill moments
    if (categoryFilter !== null) {
      fill = fill.filter(vl => vl.story?.category === categoryFilter);
    }
    return [...base, ...fill];
  }, [nearYouMomentsLive, nearestFallback, backfillMoments, categoryFilter]);

  const frozenNearYou = useRef(nearYouWithBackfill);
  if (!isNearYouScrolling) frozenNearYou.current = nearYouWithBackfill;
  const nearYouMoments = isNearYouScrolling
    ? frozenNearYou.current
    : nearYouWithBackfill;

  // Dynamic title: context-aware
  const isUsingFallback = nearYouMomentsLive.length === 0 && nearestFallback.length > 0;
  const nearYouTitle = nearYouSort === 'timeline'
    ? 'Moments Through Time'
    : (isUsingFallback ? 'Moments Nearby' : 'Moments');

  // Set of moment IDs visible on the map — used to filter collections
  const viewportMomentIds = useMemo(
    () => new Set(viewportLocations.map((vl) => vl.location.id)),
    [viewportLocations],
  );

  // Filtered collections — only show collections that have at least one
  // moment visible on the current map viewport (+ respect category filter).
  const viewportFilteredCollections = useMemo(() => {
    return collections.filter((c) => {
      // Must have at least one moment on the map
      const hasVisibleMoment = c.momentIds.some((mid) => viewportMomentIds.has(mid));
      if (!hasVisibleMoment) return false;
      // Respect category filter if active
      if (categoryFilter !== null) {
        return c.momentIds.some((mid) => {
          const parentStory = momentToStoryMap.get(mid);
          return parentStory?.category === categoryFilter;
        });
      }
      return true;
    });
  }, [collections, categoryFilter, momentToStoryMap, viewportMomentIds]);

  // Combined collections: viewport + backfill (like stories)
  const filteredCollections = useMemo(() => {
    const inView = viewportFilteredCollections;
    let fill = (backfillCollections ?? []).filter(c => !inView.some(vc => vc.id === c.id));
    // Apply category filter to backfill collections
    if (categoryFilter !== null) {
      fill = fill.filter(c => c.momentIds.some(mid => {
        const parentStory = momentToStoryMap.get(mid);
        return parentStory?.category === categoryFilter;
      }));
    }
    return [...inView, ...fill];
  }, [viewportFilteredCollections, backfillCollections, categoryFilter, momentToStoryMap]);

  const backfillCollectionIds = useMemo(
    () => new Set((backfillCollections ?? []).map(c => c.id)),
    [backfillCollections],
  );

  // Combined stories: viewport + backfill (for Stories Near You section)
  const allHomeStories = useMemo(() => {
    const inView = viewportStories ?? [];
    let fill = (backfillStories ?? []).filter(s => !inView.some(vs => vs.id === s.id));
    // Apply category filter to backfill stories
    if (categoryFilter !== null) {
      fill = fill.filter(s => s.category === categoryFilter);
    }
    return [...inView, ...fill];
  }, [viewportStories, backfillStories, categoryFilter]);

  const backfillStoryIds = useMemo(() => new Set((backfillStories ?? []).map(s => s.id)), [backfillStories]);
  const storiesSectionTitle = storiesSort === 'timeline' ? 'Stories Through Time' : 'Stories';

  // Story in-view counts — how many of each story's moments are visible on the map
  const storyInViewCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of allHomeStories) {
      const inView = s.moments.filter((sm) => viewportMomentIds.has(sm.momentId)).length;
      counts.set(s.id, inView);
    }
    return counts;
  }, [allHomeStories, viewportMomentIds]);

  // Filtered people — when a category filter is active, only show
  // people who have moments in stories matching that category.
  const filteredPersonEntities = useMemo(() => {
    if (categoryFilter === null) return personEntities;
    return personEntities.filter(({ entity }) => {
      const entityMoments = getMomentsForEntity(entity.id);
      return entityMoments.some((m) => {
        const parentStory = momentToStoryMap.get(m.id);
        return parentStory?.category === categoryFilter;
      });
    });
  }, [personEntities, categoryFilter, momentToStoryMap]);

  // Section 3: Notable People — sorted by maxNotability, grid of 10
  // Merge in backfill people (off-screen, sorted by distance)

  // Apply category filter to backfill people (same logic as filteredPersonEntities)
  const filteredBackfillPeople = useMemo(() => {
    if (categoryFilter === null) return backfillPeople ?? [];
    const result = (backfillPeople ?? []).filter(({ entity }) => {
      const entityMoments = getMomentsForEntity(entity.id);
      const pass = entityMoments.some((m) => {
        const parentStory = momentToStoryMap.get(m.id);
        return parentStory?.category === categoryFilter;
      });
      if (!pass) console.log(`[backfill-filter] REMOVED ${entity.name} (${entity.id}) — no ${categoryFilter} moments (has ${entityMoments.length} moments)`);
      return pass;
    });
    console.log(`[backfill-filter] category=${categoryFilter}, input=${(backfillPeople ?? []).length}, output=${result.length}`);
    return result;
  }, [backfillPeople, categoryFilter, momentToStoryMap]);

  const gridPeople = useMemo(() => {
    const inView = [...filteredPersonEntities].sort((a, b) => b.maxNotability - a.maxNotability);
    const fill = filteredBackfillPeople
      .filter(p => !filteredPersonEntities.some(fp => fp.entity.id === p.entity.id))
      .sort((a, b) => b.maxNotability - a.maxNotability);
    return [...inView, ...fill].slice(0, 25);
  }, [filteredPersonEntities, filteredBackfillPeople]);

  // All people for expanded view
  const allPeople = useMemo(() => {
    const inView = [...filteredPersonEntities].sort((a, b) => b.maxNotability - a.maxNotability);
    const fill = filteredBackfillPeople
      .filter(p => !filteredPersonEntities.some(fp => fp.entity.id === p.entity.id))
      .sort((a, b) => b.maxNotability - a.maxNotability);
    return [...inView, ...fill];
  }, [filteredPersonEntities, filteredBackfillPeople]);

  // Backfill boundary indices (where in-view items end and off-screen items begin)
  // In timeline mode, no backfill divider — it's a flat chronological list
  const peopleBackfillStart = peopleSort === 'timeline' ? Infinity : filteredPersonEntities.length;
  const storiesBackfillStart = storiesSort === 'timeline' ? Infinity : (viewportStories ?? []).length;
  const momentsBackfillStart = nearYouSort === 'timeline' ? Infinity : nearYouMomentsLive.length;
  const collectionsBackfillStart = viewportFilteredCollections.length;

  // ── Infinite scroll: progressive loading from full dataset ────────
  // Page sizes grow by 20 as user scrolls near the end of each carousel.
  const LOAD_MORE_BATCH = 20;
  const [nearYouPageSize, setNearYouPageSize] = useState(35);
  const [peoplePageSize, setPeoplePageSize] = useState(25);
  const [storiesPageSize, setStoriesPageSize] = useState(35);
  // Collections: only ~29 total, no infinite scroll needed

  // Reset page sizes when map moves (viewport data changes) so we don't
  // carry a huge page size from a previous pan.
  const prevVpKey = useRef('');
  useEffect(() => {
    const vpKey = `${viewportLocations[0]?.location.id ?? ''}-${viewportLocations.length}`;
    if (vpKey !== prevVpKey.current) {
      prevVpKey.current = vpKey;
      setNearYouPageSize(35);
      setPeoplePageSize(25);
      setStoriesPageSize(35);
    }
  }, [viewportLocations]);

  // Reference point for distance sorting: userLocation, or centroid of viewport
  const sortCenter = useMemo(() => {
    if (userLocation) return userLocation;
    if (viewportLocations.length === 0) return null;
    const lats = viewportLocations.map(vl => vl.location.lat);
    const lngs = viewportLocations.map(vl => vl.location.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  }, [userLocation, viewportLocations]);

  // ─── What's Here: unified carousel merging all content types ───────
  // Viewport place entities (same pattern as personEntities but for places)
  const viewportPlaceEntities = useMemo(() => {
    return entities
      .filter(e => e.type === 'place')
      .map(entity => {
        const ms = getMomentsForEntity(entity.id);
        const inViewport = ms.filter(m => viewportMomentIds.has(m.id));
        if (inViewport.length === 0) return null;
        if (categoryFilter !== null) {
          const hasMatch = ms.some(m => {
            const s = momentToStoryMap.get(m.id);
            return s?.category === categoryFilter;
          });
          if (!hasMatch) return null;
        }
        const minDist = sortCenter
          ? Math.min(...inViewport.map(m => distanceMiles(sortCenter.lat, sortCenter.lng, m.lat, m.lng)))
          : 0;
        return { entity, momentCount: ms.length, distance: minDist };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [entities, viewportMomentIds, sortCenter, categoryFilter, momentToStoryMap]);

  const whatsHereItems = useMemo((): WhatsHereItem[] => {
    if (!sortCenter) return [];
    const items: WhatsHereItem[] = [];

    // 1. Stories with moments in viewport
    const storiesInView = viewportStories ?? [];
    for (const story of storiesInView) {
      if (categoryFilter !== null && story.category !== categoryFilter) continue;
      const storyMoments = story.moments.map(sm => momentById.get(sm.momentId)).filter(Boolean) as Moment[];
      const minDist = storyMoments.length > 0
        ? Math.min(...storyMoments.map(m => distanceMiles(sortCenter.lat, sortCenter.lng, m.lat, m.lng)))
        : Infinity;
      const inViewCount = story.moments.filter(sm => viewportMomentIds.has(sm.momentId)).length;
      items.push({ kind: 'story', story, distance: minDist, inViewCount });
    }

    // 2. People entities in viewport (top 3 by notability become features)
    const sortedPeople = [...filteredPersonEntities].sort((a, b) => b.maxNotability - a.maxNotability);
    for (const p of sortedPeople) {
      const ms = getMomentsForEntity(p.entity.id);
      const inViewport = ms.filter(m => viewportMomentIds.has(m.id));
      const minDist = inViewport.length > 0
        ? Math.min(...inViewport.map(m => distanceMiles(sortCenter.lat, sortCenter.lng, m.lat, m.lng)))
        : Infinity;
      items.push({ kind: 'person', entity: p.entity, momentCount: p.momentCount, maxNotability: p.maxNotability, distance: minDist });
    }

    // 3. Individual moments in viewport
    const momentsInView = viewportLocations
      .filter(vl => vl.story !== null)
      .filter(vl => categoryFilter === null || getVlCategory(vl) === categoryFilter);
    for (const vl of momentsInView) {
      const dist = sortCenter
        ? distanceMiles(sortCenter.lat, sortCenter.lng, vl.location.lat, vl.location.lng)
        : vl.distance;
      items.push({ kind: 'moment', vl, distance: dist });
    }

    // 4. Place entities in viewport
    for (const p of viewportPlaceEntities) {
      items.push({ kind: 'place', entity: p.entity, momentCount: p.momentCount, distance: p.distance });
    }

    // Sort by distance or timeline
    if (whatsHereSort === 'timeline') {
      const getYear = (item: WhatsHereItem): number | null => {
        if (item.kind === 'story') return parseStartYear(item.story.years);
        if (item.kind === 'person') return parseStartYear(item.entity.years);
        if (item.kind === 'moment') return item.vl.location.year ?? parseStartYear(item.vl.story?.years);
        if (item.kind === 'place') return parseStartYear(item.entity.years);
        return null;
      };
      items.sort((a, b) => {
        const ya = getYear(a);
        const yb = getYear(b);
        if (ya === null && yb === null) return 0;
        if (ya === null) return 1;
        if (yb === null) return -1;
        return ya - yb;
      });
    } else {
      items.sort((a, b) => a.distance - b.distance);
    }

    return items;
  }, [sortCenter, viewportStories, filteredPersonEntities, viewportLocations, viewportPlaceEntities, viewportMomentIds, momentById, categoryFilter, momentToStoryMap, whatsHereSort]);

  // ScrollTimeline labels for What's Here
  const whatsHereScrollLabels = useMemo((): ScrollTimelineItem[] => {
    return whatsHereItems.map(item => {
      if (whatsHereSort === 'timeline') {
        let yr: number | null = null;
        if (item.kind === 'story') yr = parseStartYear(item.story.years);
        else if (item.kind === 'person') yr = parseStartYear(item.entity.years);
        else if (item.kind === 'moment') yr = item.vl.location.year ?? parseStartYear(item.vl.story?.years);
        else if (item.kind === 'place') yr = parseStartYear(item.entity.years);
        return { label: yr ? String(yr) : null };
      }
      const dist = item.distance;
      if (item.kind === 'moment') {
        const yr = item.vl.location.year;
        if (yr && dist > 0) return { label: `${yr} \u00b7 ${formatDistance(dist)}` };
        if (yr) return { label: String(yr) };
      }
      if (dist > 0) return { label: formatDistance(dist) };
      return { label: null };
    });
  }, [whatsHereItems, whatsHereSort]);

  // Globally-sorted moments by distance (for near you infinite tail)
  const allMomentsSorted = useMemo(() => {
    if (!sortCenter) return [];
    return allMoments
      .filter(m => {
        const s = momentToStoryMap.get(m.id);
        return s && (categoryFilter === null || s.category === categoryFilter);
      })
      .map(m => ({
        location: m,
        story: momentToStoryMap.get(m.id) ?? null,
        distance: distanceMiles(sortCenter.lat, sortCenter.lng, m.lat, m.lng),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [allMoments, sortCenter, categoryFilter, momentToStoryMap]);

  // Globally-sorted stories by nearest moment distance
  // MUST use allStories (browseableStories) — NOT raw stories — to exclude biography/place types
  const allStoriesSorted = useMemo(() => {
    if (!sortCenter) return [];
    const storyDist = new Map<string, number>();
    for (const s of allStories) {
      if (categoryFilter !== null && s.category !== categoryFilter) continue;
      let minDist = Infinity;
      for (const sm of s.moments) {
        const m = momentById.get(sm.momentId);
        if (m) {
          const d = distanceMiles(sortCenter.lat, sortCenter.lng, m.lat, m.lng);
          if (d < minDist) minDist = d;
        }
      }
      if (minDist < Infinity) storyDist.set(s.id, minDist);
    }
    return [...allStories]
      .filter(s => storyDist.has(s.id))
      .sort((a, b) => (storyDist.get(a.id) ?? 0) - (storyDist.get(b.id) ?? 0));
  }, [allStories, sortCenter, categoryFilter, momentById]);

  // Globally-sorted people by nearest moment distance
  const allPeopleSorted = useMemo(() => {
    if (!sortCenter) return [];
    return entities
      .filter(e => e.type === 'person')
      .map(entity => {
        const ms = getMomentsForEntity(entity.id);
        if (categoryFilter !== null) {
          const hasMatch = ms.some(m => {
            const s = momentToStoryMap.get(m.id);
            return s?.category === categoryFilter;
          });
          if (!hasMatch) return null;
        }
        const minDist = ms.length > 0
          ? Math.min(...ms.map(m => distanceMiles(sortCenter.lat, sortCenter.lng, m.lat, m.lng)))
          : Infinity;
        return { entity, momentCount: ms.length, maxNotability: 0, minDist };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null && x.minDist < Infinity)
      .sort((a, b) => a.minDist - b.minDist);
  }, [entities, sortCenter, categoryFilter, momentToStoryMap]);

  // Timeline-sorted people: in-view first (chronological), then backfill (chronological)
  const allPeopleTimeline = useMemo(() => {
    const yearSort = (a: { startYear: number | null }, b: { startYear: number | null }) => {
      if (a.startYear === null && b.startYear === null) return 0;
      if (a.startYear === null) return 1;
      if (b.startYear === null) return -1;
      return a.startYear - b.startYear;
    };
    const inView = filteredPersonEntities.map(p => ({ ...p, startYear: parseStartYear(p.entity.years) })).sort(yearSort);
    const backfill = filteredBackfillPeople
      .filter(p => !filteredPersonEntities.some(fp => fp.entity.id === p.entity.id))
      .map(p => ({ ...p, startYear: parseStartYear(p.entity.years) })).sort(yearSort);
    return [...inView, ...backfill];
  }, [filteredPersonEntities, filteredBackfillPeople]);

  // Timeline-sorted stories: in-view first (chronological), then backfill (chronological)
  const allStoriesTimeline = useMemo(() => {
    const yearSort = (a: { startYear: number | null }, b: { startYear: number | null }) => {
      if (a.startYear === null && b.startYear === null) return 0;
      if (a.startYear === null) return 1;
      if (b.startYear === null) return -1;
      return a.startYear - b.startYear;
    };
    const inView = allHomeStories.map(s => ({ story: s, startYear: parseStartYear(s.years) })).sort(yearSort);
    const backfill = allStoriesSorted
      .filter(s => !allHomeStories.some(hs => hs.id === s.id))
      .map(s => ({ story: s, startYear: parseStartYear(s.years) })).sort(yearSort);
    return [...inView, ...backfill].map(x => x.story);
  }, [allHomeStories, allStoriesSorted]);

  // Timeline-sorted moments: chronological by year
  const allMomentsTimeline = useMemo((): ViewportLocation[] => {
    const yearSort = (a: { startYear: number | null }, b: { startYear: number | null }) => {
      if (a.startYear === null && b.startYear === null) return 0;
      if (a.startYear === null) return 1;
      if (b.startYear === null) return -1;
      return a.startYear - b.startYear;
    };
    const inView = nearYouMoments.map(vl => ({ vl, startYear: vl.location.year ?? parseStartYear(vl.story?.years) })).sort(yearSort);
    const backfill = allMomentsSorted
      .filter(vl => !nearYouMoments.some(nm => nm.location.id === vl.location.id))
      .map(vl => ({ vl, startYear: vl.location.year ?? parseStartYear(vl.story?.years) })).sort(yearSort);
    return [...inView, ...backfill].map(x => x.vl);
  }, [nearYouMoments, allMomentsSorted]);

  // Merge existing carousel data with infinite tail
  const nearYouDisplay = useMemo(() => {
    if (nearYouSort === 'timeline') {
      return allMomentsTimeline.slice(0, nearYouPageSize);
    }
    const base = nearYouMoments;
    if (base.length >= nearYouPageSize) return base.slice(0, nearYouPageSize);
    const existingIds = new Set(base.map(vl => vl.location.id));
    const extra = allMomentsSorted.filter(vl => !existingIds.has(vl.location.id));
    return [...base, ...extra].slice(0, nearYouPageSize);
  }, [nearYouMoments, allMomentsSorted, nearYouPageSize, nearYouSort, allMomentsTimeline]);

  const storiesDisplay = useMemo(() => {
    if (storiesSort === 'timeline') {
      return allStoriesTimeline.slice(0, storiesPageSize);
    }
    const base = allHomeStories;
    if (base.length >= storiesPageSize) return base.slice(0, storiesPageSize);
    const existingIds = new Set(base.map(s => s.id));
    const extra = allStoriesSorted.filter(s => !existingIds.has(s.id));
    return [...base, ...extra].slice(0, storiesPageSize);
  }, [allHomeStories, allStoriesSorted, storiesPageSize, storiesSort, allStoriesTimeline]);

  const peopleDisplay = useMemo(() => {
    if (peopleSort === 'timeline') {
      return allPeopleTimeline.slice(0, peoplePageSize);
    }
    const base = gridPeople;
    if (base.length >= peoplePageSize) return base.slice(0, peoplePageSize);
    const existingIds = new Set(base.map(p => p.entity.id));
    const extra = allPeopleSorted
      .filter(p => !existingIds.has(p.entity.id))
      .map(p => ({ entity: p.entity, momentCount: p.momentCount, maxNotability: p.maxNotability }));
    return [...base, ...extra].slice(0, peoplePageSize);
  }, [gridPeople, allPeopleSorted, peoplePageSize, peopleSort, allPeopleTimeline]);

  // Load-more callbacks
  const loadMoreNearYou = useCallback(() => {
    setNearYouPageSize(prev => prev + LOAD_MORE_BATCH);
  }, []);
  const loadMoreStories = useCallback(() => {
    setStoriesPageSize(prev => prev + LOAD_MORE_BATCH);
  }, []);
  const loadMorePeople = useCallback(() => {
    setPeoplePageSize(prev => prev + LOAD_MORE_BATCH);
  }, []);

  // ── ScrollTimeline label arrays (precomputed, no work during scroll) ──
  const peopleScrollLabels = useMemo((): ScrollTimelineItem[] => {
    return peopleDisplay.map((p) => {
      if (peopleSort === 'timeline') {
        const yr = parseStartYear(p.entity.years);
        return { label: yr ? String(yr) : null };
      }
      if (!sortCenter) return { label: null };
      const ms = getMomentsForEntity(p.entity.id);
      if (ms.length === 0) return { label: null };
      const minDist = Math.min(...ms.map(m => distanceMiles(sortCenter.lat, sortCenter.lng, m.lat, m.lng)));
      return { label: formatDistance(minDist) };
    });
  }, [peopleDisplay, peopleSort, sortCenter]);

  const storiesScrollLabels = useMemo((): ScrollTimelineItem[] => {
    return storiesDisplay.map((story) => {
      if (storiesSort === 'timeline') {
        const yr = parseStartYear(story.years);
        return { label: yr ? String(yr) : null };
      }
      if (!sortCenter) return { label: null };
      const ms = story.moments.map(sm => momentById.get(sm.momentId)).filter(Boolean) as Moment[];
      if (ms.length === 0) return { label: null };
      const minDist = Math.min(...ms.map(m => distanceMiles(sortCenter.lat, sortCenter.lng, m.lat, m.lng)));
      return { label: formatDistance(minDist) };
    });
  }, [storiesDisplay, storiesSort, sortCenter, momentById]);

  const momentsScrollLabels = useMemo((): ScrollTimelineItem[] => {
    return nearYouDisplay.map(vl => {
      if (nearYouSort === 'timeline') {
        const yr = vl.location.year ?? parseStartYear(vl.story?.years);
        return { label: yr ? String(yr) : null };
      }
      const yr = vl.location.year;
      const dist = sortCenter ? distanceMiles(sortCenter.lat, sortCenter.lng, vl.location.lat, vl.location.lng) : 0;
      if (yr && dist > 0) return { label: `${yr} · ${formatDistance(dist)}` };
      if (yr) return { label: String(yr) };
      if (dist > 0) return { label: formatDistance(dist) };
      return { label: null };
    });
  }, [nearYouDisplay, sortCenter, nearYouSort]);

  // Expanded-view scroll labels (use full lists, not paginated display)
  const peopleExpandedLabels = useMemo((): ScrollTimelineItem[] => {
    return allPeople.map((p) => {
      if (peopleSort === 'timeline') {
        const yr = parseStartYear(p.entity.years);
        return { label: yr ? String(yr) : null };
      }
      if (!sortCenter) return { label: null };
      const ms = getMomentsForEntity(p.entity.id);
      if (ms.length === 0) return { label: null };
      const minDist = Math.min(...ms.map(m => distanceMiles(sortCenter.lat, sortCenter.lng, m.lat, m.lng)));
      return { label: formatDistance(minDist) };
    });
  }, [allPeople, peopleSort, sortCenter]);

  const nearYouExpandedLabels = useMemo((): ScrollTimelineItem[] => {
    return nearYouMoments.map(vl => {
      if (nearYouSort === 'timeline') {
        const yr = vl.location.year ?? parseStartYear(vl.story?.years);
        return { label: yr ? String(yr) : null };
      }
      const yr = vl.location.year;
      const dist = sortCenter ? distanceMiles(sortCenter.lat, sortCenter.lng, vl.location.lat, vl.location.lng) : 0;
      if (yr && dist > 0) return { label: `${yr} · ${formatDistance(dist)}` };
      if (yr) return { label: String(yr) };
      if (dist > 0) return { label: formatDistance(dist) };
      return { label: null };
    });
  }, [nearYouMoments, sortCenter, nearYouSort]);

  // Title adapts based on whether we're showing backfill people
  const peopleSectionTitle = peopleSort === 'timeline'
    ? 'People Through Time'
    : (filteredPersonEntities.length > 0 ? 'Who Was Here' : 'Who Was Nearby');

  // ── Scroll refs for each section ──
  const homeScrollRef = useRef<HTMLDivElement | null>(null); // main vertical scroll container

  // Card entry animations — fade + slide up on first appearance
  useInViewAnimation(homeScrollRef);
  const whatsHereScrollRef = useRef<HTMLDivElement | null>(null);
  const nearYouScrollRef = useRef<HTMLDivElement | null>(null);
  const nearYouExpandedRef = useRef<HTMLDivElement | null>(null);
  const collectionsScrollRef = useRef<HTMLDivElement | null>(null);
  const peopleExpandedRef = useRef<HTMLDivElement | null>(null);
  const peopleScrollRef = useRef<HTMLDivElement | null>(null); // horizontal scroll for collapsed people
  const storiesScrollRef = useRef<HTMLDivElement | null>(null); // horizontal scroll for collapsed stories

  // Save all carousel horizontal scroll on unmount, restore on mount
  useEffect(() => {
    if (whatsHereScrollRef.current && savedWhatsHereScrollLeft > 0) {
      whatsHereScrollRef.current.scrollLeft = savedWhatsHereScrollLeft;
    }
    if (peopleScrollRef.current && savedPeopleScrollLeft > 0) {
      peopleScrollRef.current.scrollLeft = savedPeopleScrollLeft;
    }
    if (storiesScrollRef.current && savedStoriesScrollLeft > 0) {
      storiesScrollRef.current.scrollLeft = savedStoriesScrollLeft;
    }
    if (nearYouScrollRef.current && savedNearYouScrollLeft > 0) {
      nearYouScrollRef.current.scrollLeft = savedNearYouScrollLeft;
    }
    if (collectionsScrollRef.current && savedCollectionsScrollLeft > 0) {
      collectionsScrollRef.current.scrollLeft = savedCollectionsScrollLeft;
    }
    return () => {
      if (whatsHereScrollRef.current) {
        savedWhatsHereScrollLeft = whatsHereScrollRef.current.scrollLeft;
      }
      if (peopleScrollRef.current) {
        savedPeopleScrollLeft = peopleScrollRef.current.scrollLeft;
      }
      if (storiesScrollRef.current) {
        savedStoriesScrollLeft = storiesScrollRef.current.scrollLeft;
      }
      if (nearYouScrollRef.current) {
        savedNearYouScrollLeft = nearYouScrollRef.current.scrollLeft;
      }
      if (collectionsScrollRef.current) {
        savedCollectionsScrollLeft = collectionsScrollRef.current.scrollLeft;
      }
    };
  }, []);

  // ── Reset horizontal scroll when viewport data changes (map pan) ──
  // When the map is panned, in-view cards reshuffle to the beginning of each row.
  // Reset scrollLeft so the user sees the new in-view cards, not stale backfill.
  // SKIP reset during back navigation so saved positions survive the map restore.
  const prevFirstWhatsHereId = useRef(whatsHereItems[0] ? (whatsHereItems[0].kind + '-' + (whatsHereItems[0].kind === 'story' ? whatsHereItems[0].story.id : whatsHereItems[0].kind === 'moment' ? whatsHereItems[0].vl.location.id : whatsHereItems[0].entity.id)) : '');
  const prevFirstPeopleId = useRef(gridPeople[0]?.entity.id);
  const prevFirstStoryId = useRef(allHomeStories[0]?.id);
  const prevFirstMomentId = useRef(nearYouMoments[0]?.location.id);
  const prevFirstCollectionId = useRef(filteredCollections[0]?.id);

  useEffect(() => {
    if (isRestoringFromBack) return; // don't reset during back-nav restore

    const curWhatsHere = whatsHereItems[0] ? (whatsHereItems[0].kind + '-' + (whatsHereItems[0].kind === 'story' ? whatsHereItems[0].story.id : whatsHereItems[0].kind === 'moment' ? whatsHereItems[0].vl.location.id : whatsHereItems[0].entity.id)) : '';
    const curPeople = gridPeople[0]?.entity.id;
    const curStory = allHomeStories[0]?.id;
    const curMoment = nearYouMoments[0]?.location.id;
    const curCollection = filteredCollections[0]?.id;

    if (curWhatsHere !== prevFirstWhatsHereId.current) {
      prevFirstWhatsHereId.current = curWhatsHere;
      if (whatsHereScrollRef.current) { whatsHereScrollRef.current.scrollLeft = 0; savedWhatsHereScrollLeft = 0; }
    }
    if (curPeople !== prevFirstPeopleId.current) {
      prevFirstPeopleId.current = curPeople;
      if (peopleScrollRef.current) { peopleScrollRef.current.scrollLeft = 0; savedPeopleScrollLeft = 0; }
    }
    if (curStory !== prevFirstStoryId.current) {
      prevFirstStoryId.current = curStory;
      if (storiesScrollRef.current) { storiesScrollRef.current.scrollLeft = 0; savedStoriesScrollLeft = 0; }
    }
    if (curMoment !== prevFirstMomentId.current) {
      prevFirstMomentId.current = curMoment;
      if (nearYouScrollRef.current) { nearYouScrollRef.current.scrollLeft = 0; savedNearYouScrollLeft = 0; }
    }
    if (curCollection !== prevFirstCollectionId.current) {
      prevFirstCollectionId.current = curCollection;
      if (collectionsScrollRef.current) { collectionsScrollRef.current.scrollLeft = 0; savedCollectionsScrollLeft = 0; }
    }
  }, [whatsHereItems, gridPeople, allHomeStories, nearYouMoments, filteredCollections]);

  // ── Scroll position tracking for back navigation ──
  useEffect(() => {
    const container = homeScrollRef.current;
    if (!container || !onScrollPosition) return;
    const handler = () => onScrollPosition(container.scrollTop);
    container.addEventListener('scroll', handler, { passive: true });
    return () => container.removeEventListener('scroll', handler);
  }, [onScrollPosition]);

  // ── Freeze Near You list during horizontal scroll ──
  // Prevents card reshuffling caused by map pan → viewport change → list recompute.
  useEffect(() => {
    const container = nearYouScrollRef.current;
    if (!container) return;
    const handler = () => {
      setIsNearYouScrolling(true);
      clearTimeout(nearYouScrollTimeout.current);
      nearYouScrollTimeout.current = window.setTimeout(() => setIsNearYouScrolling(false), 1500);
    };
    container.addEventListener('scroll', handler, { passive: true });
    return () => {
      container.removeEventListener('scroll', handler);
      clearTimeout(nearYouScrollTimeout.current);
    };
  }, []);

  // ── Restore scroll position after back navigation ──
  // Nudge 100px upward so the clicked card is comfortably in view, not at the bottom edge.
  // Use a short timeout to let the DOM fully render before restoring scroll position.
  // Set isRestoringFromBack to prevent viewport-change scroll resets during restore.
  useEffect(() => {
    if (restoreScrollTop == null || !homeScrollRef.current) return;
    isRestoringFromBack = true;
    const timer = setTimeout(() => {
      if (homeScrollRef.current) {
        homeScrollRef.current.scrollTop = Math.max(0, restoreScrollTop - 100);
        // Dispatch scroll event so the section observer detects the restored position
        homeScrollRef.current.dispatchEvent(new Event('scroll'));
      }
      // Re-apply saved horizontal positions after DOM settles (carousel refs may not be ready yet)
      requestAnimationFrame(() => {
        if (whatsHereScrollRef.current && savedWhatsHereScrollLeft > 0) {
          whatsHereScrollRef.current.scrollLeft = savedWhatsHereScrollLeft;
        }
        if (peopleScrollRef.current && savedPeopleScrollLeft > 0) {
          peopleScrollRef.current.scrollLeft = savedPeopleScrollLeft;
        }
        if (storiesScrollRef.current && savedStoriesScrollLeft > 0) {
          storiesScrollRef.current.scrollLeft = savedStoriesScrollLeft;
        }
        if (nearYouScrollRef.current && savedNearYouScrollLeft > 0) {
          nearYouScrollRef.current.scrollLeft = savedNearYouScrollLeft;
        }
        if (collectionsScrollRef.current && savedCollectionsScrollLeft > 0) {
          collectionsScrollRef.current.scrollLeft = savedCollectionsScrollLeft;
        }
        // Allow viewport-change resets again after restore settles
        setTimeout(() => { isRestoringFromBack = false; }, 500);
      });
      onScrollRestored?.();
    }, 50);
    return () => clearTimeout(timer);
  }, [restoreScrollTop, onScrollRestored]);

  // ── Active index tracking via scroll position ──
  const { index: whatsHereActiveIdx, cardId: whatsHereActiveCardId } = useScrollActiveIndex(
    whatsHereScrollRef,
    whatsHereItems.length,
    true,
    'horizontal',
  );
  const { index: nearYouActiveIdx, cardId: nearYouActiveCardId } = useScrollActiveIndex(
    nearYouScrollRef,
    nearYouDisplay.length,
    expandedSection !== 'nearYou',
    'horizontal',
  );
  const { index: nearYouExpandedActiveIdx } = useScrollActiveIndex(
    nearYouExpandedRef,
    nearYouMoments.length,
    expandedSection === 'nearYou',
    'vertical',
    homeScrollRef,
  );
  const { index: collectionsActiveIdx, cardId: collectionsActiveCardId } = useScrollActiveIndex(
    collectionsScrollRef,
    filteredCollections.length,
    expandedSection !== 'collections',
    'horizontal',
  );
  const { index: peopleActiveIdx, cardId: peopleActiveCardId } = useScrollActiveIndex(
    peopleScrollRef,
    peopleDisplay.length,
    expandedSection !== 'people',
    'horizontal',
  );
  const { index: storiesActiveIdx, cardId: storiesActiveCardId } = useScrollActiveIndex(
    storiesScrollRef,
    storiesDisplay.length,
    expandedSection !== 'stories',
    'horizontal',
  );
  const { index: peopleExpandedActiveIdx } = useScrollActiveIndex(
    peopleExpandedRef,
    allPeople.length,
    expandedSection === 'people',
    'vertical',
    homeScrollRef,
  );
  // Stable ref pattern for callbacks
  const onScrollHighlightRef = useRef(onScrollHighlight);
  onScrollHighlightRef.current = onScrollHighlight;
  const onScrollPanRef = useRef(onScrollPan);
  onScrollPanRef.current = onScrollPan;
  const nearYouMomentsRef = useRef(nearYouDisplay);
  nearYouMomentsRef.current = nearYouDisplay;

  // ── Near You scroll → map highlight ──
  // Use the active index from our hook to drive map highlighting.
  // hasMountedRef prevents panning on first render (e.g. after back navigation).
  // isNavigating prevents fly-through cascade when clicking a card (scroll fires for intermediate cards).
  // Near You scroll panning removed — all sections stay in place now.
  // The unified highlight system handles marker highlighting for all sections.

  // ── Initial highlight on mount ──
  // ═══════════════════════════════════════════════════════════════════
  // UNIFIED SCROLL HIGHLIGHT SYSTEM
  // One source of truth: `activeHomeSection` tracks which section is
  // visible. Only the active section drives map highlights.
  // ═══════════════════════════════════════════════════════════════════
  const filteredCollectionsRef = useRef(filteredCollections);
  filteredCollectionsRef.current = filteredCollections;
  const momentByIdRef = useRef(momentById);
  momentByIdRef.current = momentById;
  const whatsHereItemsRef = useRef(whatsHereItems);
  whatsHereItemsRef.current = whatsHereItems;
  const allPeopleRef = useRef(allPeople);
  allPeopleRef.current = allPeople;
  const gridPeopleRef = useRef(peopleDisplay);
  gridPeopleRef.current = peopleDisplay;
  const allHomeStoriesRef = useRef(storiesDisplay);
  allHomeStoriesRef.current = storiesDisplay;
  // Stable collection/story/person ID refs — store the ID at the active scroll
  // index so computeHighlight can look up by ID even after the list reshuffles.
  const activeCollectionIdRef = useRef<string | null>(null);
  const activeStoryIdRef = useRef<string | null>(null);
  const activePersonIdRef = useRef<string | null>(null);

  type HomeSection = 'whatsHere' | 'people' | 'stories' | 'nearYou' | 'collections' | null;
  // Null on mount — section observer sets it when user scrolls to a section
  const [activeHomeSection, setActiveHomeSection] = useState<HomeSection>(null);
  // Gate: no highlights until the user has explicitly interacted (scroll/swipe).
  // Prevents initial layout, data loading, and horizontal findCenter() from
  // triggering map labels before the user interacts.
  const hasUserScrolledRef = useRef(false);
  // Flag is set ONLY by: (1) vertical scroll observer after 600ms mount guard,
  // (2) user touch on any scroll container. No auto-enable timeout.

  // Compute highlight for a given section using cardId from DOM (primary)
  // or index fallback. cardId is read directly from the visible card element,
  // so it's always in sync with what the user sees — immune to array reshuffling.
  const computeHighlight = useCallback((section: HomeSection): { moments: Moment[]; label: string | null; meta: string | null; sourceType: 'entity' | 'story' | 'collection' | 'moment' | null; sourceId: string | null } => {
    if (section === 'whatsHere') {
      const items = whatsHereItemsRef.current;
      // Find the item by cardId or fallback to index
      const cardId = whatsHereActiveCardId;
      const idx = Math.max(0, whatsHereActiveIdx);
      const item = cardId
        ? items.find(it => {
            if (it.kind === 'story') return `story-${it.story.id}` === cardId;
            if (it.kind === 'person') return `person-${it.entity.id}` === cardId;
            if (it.kind === 'moment') return `moment-${it.vl.location.id}` === cardId;
            if (it.kind === 'place') return `place-${it.entity.id}` === cardId;
            return false;
          })
        : items[idx];
      if (item) {
        if (item.kind === 'story') {
          const moments: Moment[] = [];
          for (const sm of item.story.moments) {
            const m = momentByIdRef.current.get(sm.momentId);
            if (m) moments.push(m);
          }
          return { moments, label: item.story.name, meta: `${moments.length} moment${moments.length !== 1 ? 's' : ''}`, sourceType: 'story', sourceId: item.story.id };
        }
        if (item.kind === 'person') {
          const moments = getMomentsForEntity(item.entity.id);
          return { moments, label: item.entity.name, meta: `${moments.length} event${moments.length !== 1 ? 's' : ''}`, sourceType: 'entity', sourceId: item.entity.id };
        }
        if (item.kind === 'moment') {
          const story = item.vl.story;
          const year = item.vl.location.year;
          const meta = story ? (year ? `${story.name} \u00b7 ${year}` : story.name) : (year ? `${year}` : null);
          return { moments: [item.vl.location], label: null, meta, sourceType: 'moment', sourceId: item.vl.location.id };
        }
        if (item.kind === 'place') {
          const moments = getMomentsForEntity(item.entity.id);
          return { moments, label: item.entity.name, meta: `${moments.length} event${moments.length !== 1 ? 's' : ''}`, sourceType: 'entity', sourceId: item.entity.id };
        }
      }
    }
    if (section === 'people') {
      const people = expandedSection === 'people' ? allPeopleRef.current : gridPeopleRef.current;
      const cardId = peopleActiveCardId;
      const idx = expandedSection === 'people' ? peopleExpandedActiveIdx : peopleActiveIdx;
      const person = (cardId ? people.find(p => p.entity.id === cardId) : null)
        ?? people[Math.max(0, idx)];
      if (person) {
        const moments = getMomentsForEntity(person.entity.id);
        return { moments, label: person.entity.name, meta: `${moments.length} event${moments.length !== 1 ? 's' : ''} nearby`, sourceType: 'entity', sourceId: person.entity.id };
      }
    }
    if (section === 'nearYou') {
      const cardId = nearYouActiveCardId;
      const idx = expandedSection === 'nearYou' ? nearYouExpandedActiveIdx : nearYouActiveIdx;
      const vl = (cardId ? nearYouMomentsRef.current.find(v => v.location.id === cardId) : null)
        ?? nearYouMomentsRef.current[Math.max(0, idx)];
      if (vl) {
        const story = vl.story;
        const year = vl.location.year;
        const meta = story ? (year ? `${story.name} · ${year}` : story.name) : (year ? `${year}` : null);
        return { moments: [vl.location], label: null, meta, sourceType: 'moment', sourceId: vl.location.id };
      }
    }
    if (section === 'collections') {
      const cardId = collectionsActiveCardId;
      const idx = expandedSection === 'collections' ? 0 : collectionsActiveIdx;
      const coll = (cardId ? filteredCollectionsRef.current.find(c => c.id === cardId) : null)
        ?? filteredCollectionsRef.current[Math.max(0, idx)];
      if (coll) {
        const moments: Moment[] = [];
        for (const mid of coll.momentIds) {
          const m = momentByIdRef.current.get(mid);
          if (m) moments.push(m);
        }
        return { moments, label: coll.name, meta: `${moments.length} moment${moments.length !== 1 ? 's' : ''}`, sourceType: 'collection', sourceId: coll.id };
      }
    }
    if (section === 'stories') {
      const cardId = storiesActiveCardId;
      const story = (cardId ? allHomeStoriesRef.current.find(s => s.id === cardId) : null)
        ?? allHomeStoriesRef.current[Math.max(0, storiesActiveIdx)];
      if (story) {
        const moments: Moment[] = [];
        for (const sm of story.moments) {
          const m = momentByIdRef.current.get(sm.momentId);
          if (m) moments.push(m);
        }
        return { moments, label: story.name, meta: `${moments.length} moment${moments.length !== 1 ? 's' : ''}`, sourceType: 'story', sourceId: story.id };
      }
    }
    return { moments: [], label: null, meta: null, sourceType: null, sourceId: null };
  }, [expandedSection, whatsHereActiveIdx, whatsHereActiveCardId, peopleActiveIdx, peopleExpandedActiveIdx, nearYouActiveIdx, nearYouExpandedActiveIdx, collectionsActiveIdx, storiesActiveIdx, peopleActiveCardId, storiesActiveCardId, collectionsActiveCardId, nearYouActiveCardId]);

  // Fire highlight whenever the active section or its horizontal index changes
  // Also re-fire when data changes (gridPeople/allHomeStories may load async)
  const highlightDataKey = `${gridPeople[0]?.entity.id ?? ''}-${allHomeStories[0]?.id ?? ''}-${nearYouMoments[0]?.location.id ?? ''}-${filteredCollections[0]?.id ?? ''}`;
  useEffect(() => {
    if (!onScrollHighlightRef.current || !activeHomeSection || !hasUserScrolledRef.current) return;
    const { moments, label, meta, sourceType, sourceId } = computeHighlight(activeHomeSection);
    if (moments.length > 0) {
      onScrollHighlightRef.current(moments, undefined, label ?? undefined, meta ?? undefined, sourceType ?? undefined, sourceId ?? undefined);
    }
  }, [activeHomeSection, computeHighlight, highlightDataKey]);

  // Horizontal scroll within a section should activate that section even if
  // the user hasn't scrolled vertically yet. Track the initial index to avoid
  // triggering on mount (which would highlight LBJ before user interacts).
  // Initialize to -1 so the first detection (index 0) registers as a change,
  // allowing the first visible card to be highlighted after hasUserScrolled.
  const prevWhatsHereIdx = useRef(-1);
  const prevPeopleIdx = useRef(-1);
  const prevStoriesIdx = useRef(-1);
  const prevCollectionsIdx = useRef(-1);
  const prevNearYouIdx = useRef(-1);
  // When a horizontal swipe activates a section, suppress vertical observer
  // Horizontal swipe locks the active section until the user scrolls vertically
  // enough to move to a different section. Prevents vertical observer from
  // overriding a People swipe with Collections.
  const horizontalLockRef = useRef(false);
  const lastVerticalScrollTop = useRef(0);

  useEffect(() => {
    if (whatsHereActiveIdx !== prevWhatsHereIdx.current) {
      prevWhatsHereIdx.current = whatsHereActiveIdx;
      if (hasUserScrolledRef.current) {
        setActiveHomeSection('whatsHere');
        horizontalLockRef.current = true;
      }
    }
  }, [whatsHereActiveIdx]);

  useEffect(() => {
    if (peopleActiveIdx !== prevPeopleIdx.current) {
      prevPeopleIdx.current = peopleActiveIdx;
      const p = gridPeopleRef.current[Math.max(0, peopleActiveIdx)];
      activePersonIdRef.current = p?.entity.id ?? null;
      if (hasUserScrolledRef.current) {
        setActiveHomeSection('people');
        horizontalLockRef.current = true;
      }
    }
  }, [peopleActiveIdx]);

  useEffect(() => {
    if (storiesActiveIdx !== prevStoriesIdx.current) {
      prevStoriesIdx.current = storiesActiveIdx;
      const s = allHomeStoriesRef.current[Math.max(0, storiesActiveIdx)];
      activeStoryIdRef.current = s?.id ?? null;
      if (hasUserScrolledRef.current) {
        setActiveHomeSection('stories');
        horizontalLockRef.current = true;
      }
    }
  }, [storiesActiveIdx]);

  useEffect(() => {
    if (collectionsActiveIdx !== prevCollectionsIdx.current) {
      prevCollectionsIdx.current = collectionsActiveIdx;
      const c = filteredCollectionsRef.current[Math.max(0, collectionsActiveIdx)];
      activeCollectionIdRef.current = c?.id ?? null;
      if (hasUserScrolledRef.current) {
        setActiveHomeSection('collections');
        horizontalLockRef.current = true;
      }
    }
  }, [collectionsActiveIdx]);

  useEffect(() => {
    if (nearYouActiveIdx !== prevNearYouIdx.current) {
      prevNearYouIdx.current = nearYouActiveIdx;
      if (hasUserScrolledRef.current) {
        setActiveHomeSection('nearYou');
        horizontalLockRef.current = true;
      }
    }
  }, [nearYouActiveIdx]);

  // Clear highlights on expanded section change
  useEffect(() => {
    onScrollHighlight?.([]);
  }, [expandedSection, onScrollHighlight]);

  const toggleSection = useCallback((section: ExpandedSection) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  // Surprise Me — respect category filter
  const handleSurpriseMe = useCallback(() => {
    if (categoryFilter === null) {
      onSurpriseMe();
      return;
    }
    // Filter stories by category, then pick random
    const filteredStories = allStories.filter((s) => s.category === categoryFilter);
    if (filteredStories.length === 0) {
      onSurpriseMe(); // Fallback to unfiltered
      return;
    }
    // We don't have a direct "surprise from filtered" callback, so just call the normal one
    // The parent will handle it. In the future we could pass the filter up.
    onSurpriseMe();
  }, [categoryFilter, allStories, onSurpriseMe]);

  // ── Vertical scroll → section-aware map highlighting ──
  // As user scrolls the home page vertically, highlight pins for whichever section is in view.
  const whatsHereSectionRef = useRef<HTMLDivElement>(null);
  const nearYouSectionRef = useRef<HTMLDivElement>(null);
  const collectionsSectionRef = useRef<HTMLDivElement>(null);
  const peopleSectionRef = useRef<HTMLDivElement>(null);
  const storiesSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = homeScrollRef.current;
    if (!container || !onScrollHighlightRef.current) return;

    let rafId = 0;
    // Mount guard: ignore scroll events during first 600ms to prevent
    // initial layout/render from activating a section highlight
    const mountTime = Date.now();
    const onScroll = () => {
      if (Date.now() - mountTime < 600) return;
      hasUserScrolledRef.current = true;
      // If horizontal swipe locked a section, only unlock on significant vertical scroll
      if (horizontalLockRef.current) {
        const scrollDelta = Math.abs(container.scrollTop - lastVerticalScrollTop.current);
        if (scrollDelta < 80) return; // Less than ~80px vertical movement — still horizontal swipe territory
        horizontalLockRef.current = false;
      }
      lastVerticalScrollTop.current = container.scrollTop;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const midY = containerRect.top + containerRect.height * 0.4;

        // Check which section is at the midpoint
        const sections = [
          { ref: whatsHereSectionRef, type: 'whatsHere' as const },
          { ref: peopleSectionRef, type: 'people' as const },
          { ref: storiesSectionRef, type: 'stories' as const },
          { ref: nearYouSectionRef, type: 'nearYou' as const },
          { ref: collectionsSectionRef, type: 'collections' as const },
        ];

        let activeSection: typeof sections[0] | null = null;
        let closestSection: typeof sections[0] | null = null;
        let closestDist = Infinity;
        for (const section of sections) {
          const el = section.ref.current;
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top <= midY && rect.bottom >= midY) {
            activeSection = section;
            break;
          }
          // Track closest section as fallback (e.g., hero is at midpoint but people is close)
          const dist = Math.min(Math.abs(rect.top - midY), Math.abs(rect.bottom - midY));
          if (dist < closestDist) {
            closestDist = dist;
            closestSection = section;
          }
        }

        // Use closest section as fallback, but only if reasonably close (within 150px)
        if (!activeSection && closestDist < 150) activeSection = closestSection;

        if (!activeSection) {
          // Scrolled to hero or between sections — clear highlight
          setActiveHomeSection(null);
          onScrollHighlightRef.current?.([]);
          return;
        }

        // Just set which section is active — the unified highlight effect handles the rest
        setActiveHomeSection(activeSection.type as HomeSection);
      });
    };

    // Also enable on any touch — covers horizontal swipes before vertical scroll
    const onTouch = () => { hasUserScrolledRef.current = true; };
    container.addEventListener('scroll', onScroll, { passive: true });
    container.addEventListener('touchstart', onTouch, { passive: true, once: true });
    // Don't run on mount — no section should highlight until the user scrolls
    return () => {
      container.removeEventListener('scroll', onScroll);
      container.removeEventListener('touchstart', onTouch);
      cancelAnimationFrame(rafId);
    };
  }, [expandedSection]);

  return (
    <div
      ref={(el) => { homeScrollRef.current = el; scrollRef?.(el); }}
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-24 lg:pb-[40vh]"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Inner wrapper for iOS rubber-band */}
      <div style={{ minHeight: 'calc(100% + 1px)' }}>
        {/* ── Tagline (tap 3x to cycle layout variants) ── */}
        <div className="px-4 pt-4 pb-4" onClick={handleHeroTap}>
          <h1 className="text-[28px] lg:text-[36px] font-serif font-bold text-[#f5f0eb] leading-tight tracking-[-0.02em]">
            Discover what happened{' '}
            <span className="text-[#D4A853] border-b-2 border-[#D4A853] pb-0.5">here</span>
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] font-sans mt-2">
            The map of everything that ever happened.{' '}
            <span className="whitespace-nowrap">Start anywhere.</span>
          </p>
          {layoutVariant !== 'A' && (
            <p className="text-[10px] font-mono text-[#D4A853] mt-1 opacity-70">
              Layout {layoutVariant}: {LAYOUT_LABELS[layoutVariant]}
            </p>
          )}
        </div>

        {/* ── Category filter pills ── */}
        <div className="pb-3">
          <CategoryFilterPills selected={categoryFilter} onSelect={onCategoryFilter} categoriesInView={allCategoriesInView} />
        </div>

        {/* ── What's Here: unified carousel (all content types, distance-sorted) ── */}
        {whatsHereItems.length > 0 && (
          <div ref={whatsHereSectionRef} className="pb-4">
            <div className="px-4 mb-1 sticky top-0 z-10 bg-[var(--bg-primary)] py-2 -mt-2">
              <h2 className="text-[18px] font-serif font-semibold text-[var(--text-primary)] tracking-[-0.01em]">
                What&apos;s Here
              </h2>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {whatsHereItems.length} nearby
              </span>
            </div>
            {whatsHereItems.length > 1 && (
              <SortToggle value={whatsHereSort} onChange={(v) => {
                setWhatsHereSort(v);
                if (whatsHereScrollRef.current) whatsHereScrollRef.current.scrollLeft = 0;
              }} />
            )}
            <HScrollRow scrollRef={whatsHereScrollRef}>
              {whatsHereItems.map((item, i) => {
                const isActive = i === whatsHereActiveIdx;
                if (item.kind === 'story') {
                  return (
                    <WhatsHereStoryCard
                      key={`story-${item.story.id}`}
                      story={item.story}
                      inViewCount={item.inViewCount}
                      distance={item.distance}
                      isActive={isActive}
                      cardIndex={i}
                      cardId={`story-${item.story.id}`}
                      onClick={() => onStorySelect?.(item.story)}
                    />
                  );
                }
                if (item.kind === 'person') {
                  return (
                    <WhatsHerePersonCard
                      key={`person-${item.entity.id}`}
                      entity={item.entity}
                      momentCount={item.momentCount}
                      distance={item.distance}
                      isActive={isActive}
                      cardIndex={i}
                      cardId={`person-${item.entity.id}`}
                      onClick={() => onEntityClick(item.entity)}
                    />
                  );
                }
                if (item.kind === 'moment') {
                  return (
                    <WhatsHereMomentCard
                      key={`moment-${item.vl.location.id}`}
                      vl={item.vl}
                      distance={item.distance}
                      isActive={isActive}
                      cardIndex={i}
                      cardId={`moment-${item.vl.location.id}`}
                      onClick={() => {
                        if (item.vl.story) onMomentClick(item.vl.location, item.vl.story);
                      }}
                    />
                  );
                }
                if (item.kind === 'place') {
                  return (
                    <WhatsHerePlaceCard
                      key={`place-${item.entity.id}`}
                      entity={item.entity}
                      momentCount={item.momentCount}
                      distance={item.distance}
                      isActive={isActive}
                      cardIndex={i}
                      cardId={`place-${item.entity.id}`}
                      onClick={() => onEntityClick(item.entity)}
                    />
                  );
                }
                return null;
              })}
            </HScrollRow>
            <ScrollTimeline items={whatsHereScrollLabels} activeIndex={whatsHereActiveIdx} orientation="horizontal" />
          </div>
        )}

        {/* ── Dive Deeper: progressive depth transition ── */}
        <div className="px-4 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.3)] to-transparent" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-[rgba(212,168,83,0.5)]">▼</span>
              <span className="text-[12px] font-mono tracking-[0.2em] uppercase text-[#D4A853]">
                Dive Deeper
              </span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.3)] to-transparent" />
          </div>
        </div>

        {/* ── Sections: order controlled by layoutVariant (tap hero 3x to cycle) ── */}
        {(() => {
          const order = LAYOUT_ORDERS[layoutVariant];
          const o = (key: string) => order.indexOf(key);
          return (<div className="flex flex-col">

        {/* ── People ── */}
        <div style={{ order: o('people') }}>
        <div ref={peopleSectionRef} className="pt-4 pb-4">
          <SectionHeading
            title={peopleSectionTitle}
            expanded={expandedSection === 'people'}
            onToggle={() => toggleSection('people')}
          />
          {(expandedSection === 'people' ? allPeople.length : peopleDisplay.length) > 1 && (
            <SortToggle value={peopleSort} onChange={(v) => {
              setPeopleSort(v);
              if (peopleScrollRef.current) peopleScrollRef.current.scrollLeft = 0;
            }} />
          )}
          {(expandedSection === 'people' ? allPeople : gridPeople).length > 0 ? (
            expandedSection === 'people' ? (
              <div ref={peopleExpandedRef} className="relative flex flex-col">
                {allPeople.map(({ entity, momentCount }, i) => (
                  <PersonRow
                    key={entity.id}
                    entity={entity}
                    momentCount={momentCount}
                    isActive={i === peopleExpandedActiveIdx}

                    onClick={() => onEntityClick(entity)}
                  />
                ))}
                <SurpriseMeButton onClick={onSurpriseMe} />
                {allPeople.length >= 2 && (
                  <ScrollTimeline items={peopleExpandedLabels} activeIndex={peopleExpandedActiveIdx} orientation="vertical" />
                )}
              </div>
            ) : (
              <div>
                {peopleBackfillStart === 0 && peopleDisplay.length > 0 && <BackfillHint />}
                <HScrollRow scrollRef={peopleScrollRef} onLoadMore={loadMorePeople}>
                  {peopleDisplay.map(({ entity, momentCount }, i) => (
                    <Fragment key={entity.id}>
                      {i === peopleBackfillStart && peopleBackfillStart > 0 && peopleBackfillStart < peopleDisplay.length && <BackfillDivider />}
                      <PersonCard
                        entity={entity}
                        momentCount={momentCount}
                        cardIndex={i}
                        cardId={entity.id}
                        isActive={i === peopleActiveIdx}
                        yearLabel={peopleSort === 'timeline' ? (entity.years ?? undefined) : undefined}
                        distanceMi={peopleSort !== 'timeline' && i >= peopleBackfillStart && userLocation ? (() => {
                          const ms = getMomentsForEntity(entity.id);
                          return ms.length > 0 ? Math.min(...ms.map(m => distanceMiles(userLocation.lat, userLocation.lng, m.lat, m.lng))) : undefined;
                        })() : undefined}
                        onClick={() => onEntityClick(entity)}
                      />
                    </Fragment>
                  ))}
                </HScrollRow>
                <ScrollTimeline items={peopleScrollLabels} activeIndex={peopleActiveIdx} orientation="horizontal" />
                {allPeople.length > gridPeople.length && (
                  <button
                    onClick={() => toggleSection('people')}
                    className="mx-auto block mt-1 mb-2 px-4 py-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-white transition-colors"
                  >
                    See all {allPeople.length} people →
                  </button>
                )}
              </div>
            )
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)] font-mono">
                {categoryFilter ? 'No people for this category' : 'Pan or zoom the map to see notable people'}
              </p>
            </div>
          )}
        </div>
        </div>{/* end People order wrapper */}

        {/* ── Stories Near You ── */}
        <div style={{ order: o('stories') }}>
        {storiesDisplay.length > 0 && (
          <>
            <div ref={storiesSectionRef} className="pt-4 pb-4">
              <SectionHeading
                title={storiesSectionTitle}
                expanded={expandedSection === 'stories'}
                onToggle={() => toggleSection('stories')}
              />
              {(expandedSection === 'stories' ? allHomeStories.length : storiesDisplay.length) > 1 && (
                <SortToggle value={storiesSort} onChange={(v) => {
                  setStoriesSort(v);
                  if (storiesScrollRef.current) storiesScrollRef.current.scrollLeft = 0;
                }} />
              )}
              {expandedSection === 'stories' ? (
                <div className="flex flex-col gap-2 px-4">
                  {allHomeStories.map((story) => (
                    <button
                      key={story.id}
                      onClick={() => onStorySelect?.(story)}
                      className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] p-3 text-left transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-1 h-8 rounded-full shrink-0 mt-0.5" style={{ background: CATEGORIES[story.category]?.color ?? '#666' }} />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[14px] font-serif font-bold text-[var(--text-primary)] leading-tight truncate">
                            {story.nickname && story.nickname.includes(' ') ? story.nickname : story.name}
                          </h4>
                          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                            {story.years} · {backfillStoryIds.has(story.id)
                              ? `${story.moments.length} moments`
                              : `${storyInViewCounts.get(story.id) ?? 0} of ${story.moments.length} moments in view`}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                  <SurpriseMeButton onClick={onSurpriseMe} />
                </div>
              ) : (
                <>
                {storiesBackfillStart === 0 && storiesDisplay.length > 0 && <BackfillHint />}
                <HScrollRow scrollRef={storiesScrollRef} onLoadMore={loadMoreStories}>
                  {storiesDisplay.map((story, i) => (
                    <Fragment key={story.id}>
                      {i === storiesBackfillStart && storiesBackfillStart > 0 && storiesBackfillStart < storiesDisplay.length && <BackfillDivider />}
                      <HomeStoryCard
                        story={story}
                        cardIndex={i}
                        cardId={story.id}
                        isActive={i === storiesActiveIdx}
                        isBackfill={backfillStoryIds.has(story.id)}
                        inViewCount={storyInViewCounts.get(story.id) ?? 0}
                        distanceMi={i >= storiesBackfillStart && userLocation ? (() => {
                          const ms = story.moments.map(sm => momentById.get(sm.momentId)).filter(Boolean) as Moment[];
                          return ms.length > 0 ? Math.min(...ms.map(m => distanceMiles(userLocation.lat, userLocation.lng, m.lat, m.lng))) : undefined;
                        })() : undefined}
                        onClick={() => onStorySelect?.(story)}
                      />
                    </Fragment>
                  ))}
                </HScrollRow>
                <ScrollTimeline items={storiesScrollLabels} activeIndex={storiesActiveIdx} orientation="horizontal" />
                </>
              )}
            </div>
          </>
        )}
        </div>{/* end Stories order wrapper */}

        {/* Near You / In View */}
        <div style={{ order: o('moments') }}>
        <div ref={nearYouSectionRef} className="pt-4 pb-4">
          <SectionHeading
            title={nearYouTitle}
            expanded={expandedSection === 'nearYou'}
            onToggle={() => toggleSection('nearYou')}
          />
          {(expandedSection === 'nearYou' ? nearYouMoments.length : nearYouDisplay.length) > 1 && (
            <SortToggle value={nearYouSort} onChange={(v) => {
              setNearYouSort(v);
              if (nearYouScrollRef.current) nearYouScrollRef.current.scrollLeft = 0;
            }} />
          )}
          {nearYouDisplay.length > 0 ? (
            expandedSection === 'nearYou' ? (
              // Expanded: vertical list
              <div ref={nearYouExpandedRef} className="relative flex flex-col gap-2 px-4">
                {nearYouMoments.map((vl, i) => (
                  <NearYouCardVertical
                    key={vl.location.id}
                    location={vl.location}
                    story={vl.story}
                    isActive={i === nearYouExpandedActiveIdx}
                    contextLine={getMomentContextLine(vl.location)}
                    distance={
                      userLocation
                        ? distanceMiles(userLocation.lat, userLocation.lng, vl.location.lat, vl.location.lng)
                        : 0
                    }
                    onClick={() => {
                      isNavigating.current = true;
                      if (vl.story) onMomentClick(vl.location, vl.story);
                    }}
                  />
                ))}
                <SurpriseMeButton onClick={onSurpriseMe} />
                {nearYouMoments.length >= 2 && (
                  <ScrollTimeline items={nearYouExpandedLabels} activeIndex={nearYouExpandedActiveIdx} orientation="vertical" />
                )}
              </div>
            ) : (
              // Collapsed: horizontal scroll
              <>
              {momentsBackfillStart === 0 && nearYouDisplay.length > 0 && <BackfillHint />}
              <HScrollRow scrollRef={nearYouScrollRef} onLoadMore={loadMoreNearYou}>
                {nearYouDisplay.map((vl, i) => (
                  <Fragment key={vl.location.id}>
                    {i === momentsBackfillStart && momentsBackfillStart > 0 && momentsBackfillStart < nearYouDisplay.length && <BackfillDivider />}
                    <NearYouCard
                      location={vl.location}
                      story={vl.story}
                      cardIndex={i}
                      cardId={vl.location.id}
                      isActive={i === nearYouActiveIdx}
                      contextLine={getMomentContextLine(vl.location)}
                      distance={
                        userLocation
                          ? distanceMiles(userLocation.lat, userLocation.lng, vl.location.lat, vl.location.lng)
                          : 0
                      }
                      onClick={() => {
                        isNavigating.current = true;
                        if (vl.story) onMomentClick(vl.location, vl.story);
                      }}
                    />
                  </Fragment>
                ))}
              </HScrollRow>
              <ScrollTimeline items={momentsScrollLabels} activeIndex={nearYouActiveIdx} orientation="horizontal" />
              </>
            )
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)] font-mono">
                Zoom or pan the map to discover events
              </p>
            </div>
          )}
        </div>

        </div>{/* end Moments order wrapper */}

        {/* ── Collections ── */}
        <div style={{ order: o('collections') }}>
        <div ref={collectionsSectionRef} className="pt-4 pb-4">
          <SectionHeading
            title="Collections"
            expanded={expandedSection === 'collections'}
            onToggle={() => toggleSection('collections')}
          />
          {filteredCollections.length > 0 ? (
            expandedSection === 'collections' ? (
              // Expanded: 2-column grid
              <div className="grid grid-cols-2 gap-2 px-4">
                {filteredCollections.map((collection) => (
                  <CollectionGridCard
                    key={collection.id}
                    collection={collection}
                    onClick={() => onCollectionSelect(collection)}
                  />
                ))}
                <div className="col-span-2">
                  <SurpriseMeButton onClick={onSurpriseMe} />
                </div>
              </div>
            ) : (
              // Collapsed: horizontal scroll
              <>
              {collectionsBackfillStart === 0 && filteredCollections.length > 0 && <BackfillHint />}
              <HScrollRow scrollRef={collectionsScrollRef}>
                {filteredCollections.map((collection, i) => (
                  <Fragment key={collection.id}>
                    {i === collectionsBackfillStart && collectionsBackfillStart > 0 && collectionsBackfillStart < filteredCollections.length && <BackfillDivider />}
                    <HomeCollectionCard
                      collection={collection}
                      cardIndex={i}
                      cardId={collection.id}
                      isActive={i === collectionsActiveIdx}
                      isBackfill={backfillCollectionIds.has(collection.id)}
                      inViewCount={collection.momentIds.filter((mid) => viewportMomentIds.has(mid)).length}
                      onClick={() => onCollectionSelect(collection)}
                    />
                  </Fragment>
                ))}
              </HScrollRow>
              </>
            )
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)] font-mono">
                {categoryFilter ? 'No collections for this category' : 'Zoom or pan the map to discover collections'}
              </p>
            </div>
          )}
        </div>

        </div>{/* end Collections order wrapper */}

        </div>); /* end flex container + IIFE */
        })()}

        {/* ── Dive Even Deeper: progressive depth transition ── */}
        <div className="px-4 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.25)] to-transparent" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-[rgba(212,168,83,0.4)]">▼▼</span>
              <span className="text-[12px] font-mono tracking-[0.2em] uppercase text-[rgba(212,168,83,0.75)]">
                Dive Even Deeper
              </span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.25)] to-transparent" />
          </div>
        </div>

        {/* ── Section 4: Browse the Encyclopedia ── */}
        <div className="pt-4 pb-4">
          <SectionTitle title="The Encyclopedia of Everything That Ever Happened" />
          <div className="px-4">
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-4">
              <p className="text-[14px] text-[var(--text-secondary)] font-sans leading-relaxed">
                <span className="text-[var(--text-primary)] font-semibold">{allMoments.length.toLocaleString()}</span>{' '}
                moments.{' '}
                <span className="text-[var(--text-primary)] font-semibold">{allStories.length.toLocaleString()}</span>{' '}
                stories. All searchable, all connected.
              </p>
              <button
                onClick={onBrowseAll}
                className="mt-3 w-full rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all duration-200 active:scale-[0.98] py-2.5 px-4 text-center"
              >
                <span className="text-[13px] font-sans font-semibold text-[var(--text-primary)]">
                  Browse all &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 my-4 border-t border-[var(--border-subtle)]" />

        {/* ── Section 5: Surprise Me ── */}
        <div className="px-4 pt-6 pb-8 flex justify-center">
          <button
            onClick={handleSurpriseMe}
            className="w-[65%] rounded-xl border border-[#D4A853] hover:bg-[#D4A853]/10 transition-all duration-200 active:scale-[0.98] py-3 px-4 text-center group"
          >
            <div className="text-sm font-serif font-bold text-[#D4A853]">
              Surprise Me
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-sans mt-0.5">
              Discover a random event
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
