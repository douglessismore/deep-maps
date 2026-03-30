import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Entity, Moment, Story, StoryCategory, StoryCollection, ViewportLocation } from '../../types';
import type { EntityWithCounts } from '../../lib/entityHelpers';
import { getMomentsForEntity } from '../../lib/entityHelpers';
import { CATEGORIES } from '../../lib/categories';
import { distanceMiles } from '../../lib/geo';
import { getEffectiveNotability } from '../../lib/notability';
import { useAppData } from '../../lib/data/provider';
import { useInViewAnimation } from '../../lib/useInViewAnimation';

// ─── Types ───────────────────────────────────────────────────────────

type ExpandedSection = 'nearYou' | 'stories' | 'collections' | 'people' | null;

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
  onScrollHighlight?: (locations: Moment[], storyId?: string) => void;
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
): number {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || itemCount === 0) return;

    // For vertical mode, scroll events fire on the parent scroll container,
    // not on the items container itself (which is just a flex-col div).
    const scrollTarget = (mode === 'vertical' && scrollParentRef?.current) ? scrollParentRef.current : container;

    let rafId = 0;
    const findCenter = () => {
      const cards = container.children;
      let closestIdx = 0;
      let closestDist = Infinity;

      if (mode === 'horizontal') {
        const rect = container.getBoundingClientRect();
        const containerCenterX = rect.left + rect.width / 2;
        for (let i = 0; i < cards.length; i++) {
          const cardRect = cards[i].getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2;
          const dist = Math.abs(cardCenterX - containerCenterX);
          if (dist < closestDist) { closestDist = dist; closestIdx = i; }
        }
      } else {
        // Vertical: use the scroll parent's visible area as reference
        const parentRect = scrollTarget.getBoundingClientRect();
        const targetY = parentRect.top + parentRect.height * 0.35; // 35% from top of visible area
        for (let i = 0; i < cards.length; i++) {
          const cardRect = cards[i].getBoundingClientRect();
          const cardCenterY = cardRect.top + cardRect.height / 2;
          const dist = Math.abs(cardCenterY - targetY);
          if (dist < closestDist) { closestDist = dist; closestIdx = i; }
        }
      }
      setActiveIndex(closestIdx);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(findCenter);
    };

    // Initial calculation
    findCenter();

    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollTarget.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [containerRef, scrollParentRef, itemCount, enabled, mode]);

  return activeIndex;
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
  const catGlow = categoryColor ? `0 -2px 16px ${categoryColor}26` : ''; // 26 = ~15% alpha
  return {
    transform: 'scale(1.04)',
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'var(--bg-card-hover)',
    boxShadow: `0 0 24px rgba(255,255,255,0.12)${catGlow ? `, ${catGlow}` : ''}`,
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
}: {
  location: Moment;
  story: Story | null;
  distance: number;
  onClick: () => void;
  isActive?: boolean;
  /** "Serial Killer Crime Scenes" or "3 people · 2 places connected" */
  contextLine?: string | null;
}) {
  const cat = story ? CATEGORIES[story.category] : undefined;

  return (
    <button
      onClick={onClick}
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
}: {
  collection: StoryCollection;
  imageUrl?: string;
  onClick: () => void;
  isActive?: boolean;
  /** How many of this collection's moments are currently visible on the map */
  inViewCount?: number;
}) {
  const total = collection.momentIds.length;
  const hasMore = isActive && inViewCount != null && inViewCount < total;

  return (
    <button
      onClick={onClick}
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
          {hasMore ? (
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
  onClick,
}: {
  story: Story;
  inViewCount: number;
  isActive?: boolean;
  onClick: () => void;
}) {
  const cat = CATEGORIES[story.category];
  const total = story.moments.length;
  return (
    <button
      onClick={onClick}
      className={`w-[200px] shrink-0 snap-start rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden text-left transition-all duration-300 active:scale-[0.97] ${
        isActive ? 'scale-[1.04] shadow-lg' : ''
      }`}
      style={isActive ? { boxShadow: `0 0 24px ${cat?.color ?? '#D4A853'}33` } : undefined}
    >
      {/* Category color bar */}
      <div className="h-1" style={{ background: cat?.color ?? '#666' }} />
      <div className="p-3 flex flex-col justify-between h-[110px]">
        <div className="min-w-0">
          <h4 className="text-[14px] font-serif font-bold text-[var(--text-primary)] leading-tight line-clamp-2">
            {story.nickname && story.nickname.includes(' ') ? story.nickname : story.name}
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-1">{story.years}</p>
        </div>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {inViewCount < total
              ? `${inViewCount} of ${total} moments`
              : `${total} moments`}
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
  isBackfill,
}: {
  entity: Entity;
  momentCount: number;
  onClick: () => void;
  isActive?: boolean;
  isBackfill?: boolean;
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
        {isBackfill && (
          <span className="text-[9px] font-mono text-[var(--text-muted)] block opacity-60">nearby</span>
        )}
      </div>
    </button>
  );
}

function PersonCard({
  entity,
  momentCount,
  onClick,
  isActive,
  isBackfill,
}: {
  entity: Entity;
  momentCount: number;
  onClick: () => void;
  isActive?: boolean;
  isBackfill?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center w-[130px] shrink-0 snap-start pt-3 pb-2 rounded-xl transition-all duration-200 active:scale-[0.97] card-animate-in"
      style={{
        scrollSnapAlign: 'start',
        ...(isActive ? {
          transform: 'scale(1.04)',
          backgroundColor: 'rgba(139,92,246,0.06)',
          boxShadow: '0 0 20px rgba(139,92,246,0.15)',
        } : {}),
      }}
    >
      {entity.imageUrl ? (
        <img
          src={entity.imageUrl}
          alt={entity.name}
          className={`w-14 h-14 rounded-full object-cover ring-1 ${isActive ? 'ring-[rgba(139,92,246,0.6)]' : 'ring-[rgba(255,255,255,0.1)]'}`}
          loading="lazy"
        />
      ) : (
        <span className={`w-14 h-14 rounded-full bg-[rgba(139,92,246,0.15)] ring-1 flex items-center justify-center text-[16px] font-bold text-[rgba(139,92,246,0.8)] ${isActive ? 'ring-[rgba(139,92,246,0.6)]' : 'ring-[rgba(139,92,246,0.3)]'}`}>
          {entity.name[0].toUpperCase()}
        </span>
      )}
      <span className="mt-1.5 text-[14px] font-serif font-bold text-[var(--text-primary)] w-full text-center truncate px-1">
        {entity.name}
      </span>
      <span className="text-[11px] font-mono text-[var(--text-muted)]">
        {momentCount} events
      </span>
      {isBackfill && (
        <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-60">nearby</span>
      )}
    </button>
  );
}

// ─── Horizontal scroll container ─────────────────────────────────────

function HScrollRow({
  children,
  scrollRef,
}: {
  children: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}) {
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
  isNearUser,
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
  onStorySelect,
  scrollRef,
  onScrollPosition,
  restoreScrollTop,
  onScrollRestored,
}: HomePageProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);

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

  const frozenNearYou = useRef(nearYouMomentsLive);
  if (!isNearYouScrolling) frozenNearYou.current = nearYouMomentsLive;
  const nearYouMoments = isNearYouScrolling
    ? frozenNearYou.current
    : (nearYouMomentsLive.length > 0 ? nearYouMomentsLive : nearestFallback);

  // Dynamic title: context-aware
  const isUsingFallback = nearYouMomentsLive.length === 0 && nearestFallback.length > 0;
  const nearYouTitle = isUsingFallback ? 'Nearest' : (isNearUser ? 'Near You' : 'In View');

  // Set of moment IDs visible on the map — used to filter collections
  const viewportMomentIds = useMemo(
    () => new Set(viewportLocations.map((vl) => vl.location.id)),
    [viewportLocations],
  );

  // Filtered collections — only show collections that have at least one
  // moment visible on the current map viewport (+ respect category filter).
  const filteredCollections = useMemo(() => {
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

  // Combined stories: viewport + backfill (for Stories Near You section)
  const allHomeStories = useMemo(() => {
    const inView = viewportStories ?? [];
    const fill = (backfillStories ?? []).filter(s => !inView.some(vs => vs.id === s.id));
    return [...inView, ...fill];
  }, [viewportStories, backfillStories]);

  const backfillStoryIds = useMemo(() => new Set((backfillStories ?? []).map(s => s.id)), [backfillStories]);
  const storiesSectionTitle = (viewportStories ?? []).length > 0 ? 'Stories Near You' : 'Stories Nearby';

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
  // Merge in backfill people (off-screen but nearby) when viewport has few
  const backfillIds = useMemo(() => new Set((backfillPeople ?? []).map(p => p.entity.id)), [backfillPeople]);

  const gridPeople = useMemo(() => {
    const inView = [...filteredPersonEntities].sort((a, b) => b.maxNotability - a.maxNotability);
    const fill = (backfillPeople ?? [])
      .filter(p => !filteredPersonEntities.some(fp => fp.entity.id === p.entity.id))
      .sort((a, b) => b.maxNotability - a.maxNotability);
    return [...inView, ...fill].slice(0, 10);
  }, [filteredPersonEntities, backfillPeople]);

  // All people for expanded view
  const allPeople = useMemo(() => {
    const inView = [...filteredPersonEntities].sort((a, b) => b.maxNotability - a.maxNotability);
    const fill = (backfillPeople ?? [])
      .filter(p => !filteredPersonEntities.some(fp => fp.entity.id === p.entity.id))
      .sort((a, b) => b.maxNotability - a.maxNotability);
    return [...inView, ...fill];
  }, [filteredPersonEntities, backfillPeople]);

  // Title adapts based on whether we're showing backfill people
  const peopleSectionTitle = filteredPersonEntities.length > 0 ? 'Notable People' : 'Notable People Nearby';

  // ── Scroll refs for each section ──
  const homeScrollRef = useRef<HTMLDivElement | null>(null); // main vertical scroll container

  // Card entry animations — fade + slide up on first appearance
  useInViewAnimation(homeScrollRef);
  const nearYouScrollRef = useRef<HTMLDivElement | null>(null);
  const nearYouExpandedRef = useRef<HTMLDivElement | null>(null);
  const collectionsScrollRef = useRef<HTMLDivElement | null>(null);
  const peopleExpandedRef = useRef<HTMLDivElement | null>(null);
  const peopleScrollRef = useRef<HTMLDivElement | null>(null); // horizontal scroll for collapsed people

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
  useEffect(() => {
    if (restoreScrollTop == null || !homeScrollRef.current) return;
    const timer = setTimeout(() => {
      if (homeScrollRef.current) {
        homeScrollRef.current.scrollTop = Math.max(0, restoreScrollTop - 100);
      }
      onScrollRestored?.();
    }, 50);
    return () => clearTimeout(timer);
  }, [restoreScrollTop, onScrollRestored]);

  // ── Active index tracking via scroll position ──
  const nearYouActiveIdx = useScrollActiveIndex(
    nearYouScrollRef,
    nearYouMoments.length,
    expandedSection !== 'nearYou',
    'horizontal',
  );
  const nearYouExpandedActiveIdx = useScrollActiveIndex(
    nearYouExpandedRef,
    nearYouMoments.length,
    expandedSection === 'nearYou',
    'vertical',
    homeScrollRef,
  );
  const collectionsActiveIdx = useScrollActiveIndex(
    collectionsScrollRef,
    filteredCollections.length,
    expandedSection !== 'collections',
    'horizontal',
  );
  const peopleActiveIdx = useScrollActiveIndex(
    peopleScrollRef,
    gridPeople.length,
    expandedSection !== 'people', // active when collapsed (horizontal)
    'horizontal',
  );
  const peopleExpandedActiveIdx = useScrollActiveIndex(
    peopleExpandedRef,
    allPeople.length,
    expandedSection === 'people', // active when expanded (vertical)
    'vertical',
    homeScrollRef,
  );
  // Unified people index — use horizontal when collapsed, vertical when expanded
  const currentPeopleIdx = expandedSection === 'people' ? peopleExpandedActiveIdx : peopleActiveIdx;

  // Stable ref pattern for callbacks
  const onScrollHighlightRef = useRef(onScrollHighlight);
  onScrollHighlightRef.current = onScrollHighlight;
  const onScrollPanRef = useRef(onScrollPan);
  onScrollPanRef.current = onScrollPan;
  const nearYouMomentsRef = useRef(nearYouMoments);
  nearYouMomentsRef.current = nearYouMoments;

  // ── Near You scroll → map highlight ──
  // Use the active index from our hook to drive map highlighting.
  // hasMountedRef prevents panning on first render (e.g. after back navigation).
  // isNavigating prevents fly-through cascade when clicking a card (scroll fires for intermediate cards).
  const prevNearYouIdx = useRef(-1);
  const hasMountedNearYou = useRef(false);
  useEffect(() => {
    if (!onScrollHighlightRef.current || isNavigating.current) return;
    const idx = expandedSection === 'nearYou' ? nearYouExpandedActiveIdx : nearYouActiveIdx;
    if (idx === prevNearYouIdx.current) return;
    prevNearYouIdx.current = idx;

    if (idx >= 0 && idx < nearYouMomentsRef.current.length) {
      const vl = nearYouMomentsRef.current[idx];
      onScrollHighlightRef.current([vl.location], vl.story?.id);
      // Only pan after initial render and in collapsed mode — expanded Near You is
      // viewport-derived, so panning would change the viewport → feedback loop.
      // Skip first render to prevent pan on back navigation.
      if (hasMountedNearYou.current && expandedSection !== 'nearYou') {
        onScrollPanRef.current?.(vl.location.lat, vl.location.lng);
      }
      hasMountedNearYou.current = true;
    }
  }, [nearYouActiveIdx, nearYouExpandedActiveIdx, expandedSection]);

  // ── Initial highlight on mount ──
  // Highlight ALL Near You moments so pins are prominently visible on page load.
  // Without this, only tiny cluster dots appear.
  const initialHighlightDone = useRef(false);
  useEffect(() => {
    if (initialHighlightDone.current || !onScrollHighlightRef.current) return;
    if (nearYouMomentsRef.current.length === 0) return;
    initialHighlightDone.current = true;
    const allLocs = nearYouMomentsRef.current.map(vl => vl.location);
    onScrollHighlightRef.current(allLocs);
  }, [nearYouMoments]);

  // ── Collection scroll → map highlight ──
  // When a collection card scrolls into the center, highlight its moments on the map.
  const filteredCollectionsRef = useRef(filteredCollections);
  filteredCollectionsRef.current = filteredCollections;
  const momentByIdRef = useRef(momentById);
  momentByIdRef.current = momentById;

  const prevCollectionIdx = useRef(-1);
  useEffect(() => {
    if (!onScrollHighlightRef.current || expandedSection === 'collections') return;
    if (collectionsActiveIdx === prevCollectionIdx.current) return;
    prevCollectionIdx.current = collectionsActiveIdx;

    const collection = filteredCollectionsRef.current[collectionsActiveIdx];
    if (!collection) return;

    // Resolve collection's moments for map highlighting
    const collMoments: Moment[] = [];
    for (const mid of collection.momentIds) {
      const m = momentByIdRef.current.get(mid);
      if (m) collMoments.push(m);
    }
    if (collMoments.length > 0) {
      onScrollHighlightRef.current(collMoments);
      // No panTo for collections — their moments span the country, so panning
      // to the first one zooms away from the rest. Markers highlight in place.
    }
  }, [collectionsActiveIdx, expandedSection]);

  // ── People expanded scroll → map highlight ──
  // When a person scrolls into view in the expanded list, highlight their locations.
  const allPeopleRef = useRef(allPeople);
  allPeopleRef.current = allPeople;
  const gridPeopleRef = useRef(gridPeople);
  gridPeopleRef.current = gridPeople;

  const prevPeopleIdx = useRef(-1);
  useEffect(() => {
    if (!onScrollHighlightRef.current) return;
    if (currentPeopleIdx === prevPeopleIdx.current) return;
    prevPeopleIdx.current = currentPeopleIdx;

    const currentPeople = expandedSection === 'people' ? allPeopleRef.current : gridPeopleRef.current;
    const personData = currentPeople[currentPeopleIdx];
    if (!personData) return;

    const entityMoments = getMomentsForEntity(personData.entity.id);
    if (entityMoments.length > 0) {
      onScrollHighlightRef.current(entityMoments);
    }
  }, [currentPeopleIdx, expandedSection]);

  // Clear scroll highlight when switching sections
  useEffect(() => {
    onScrollHighlight?.([]);
    prevNearYouIdx.current = -1;
    prevCollectionIdx.current = -1;
    prevPeopleIdx.current = -1;
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
  const nearYouSectionRef = useRef<HTMLDivElement>(null);
  const collectionsSectionRef = useRef<HTMLDivElement>(null);
  const peopleSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = homeScrollRef.current;
    if (!container || !onScrollHighlightRef.current) return;

    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const midY = containerRect.top + containerRect.height * 0.4;

        // Check which section is at the midpoint
        const sections = [
          { ref: nearYouSectionRef, type: 'nearYou' as const },
          { ref: collectionsSectionRef, type: 'collections' as const },
          { ref: peopleSectionRef, type: 'people' as const },
        ];

        let activeSection: typeof sections[0] | null = null;
        for (const section of sections) {
          const el = section.ref.current;
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top <= midY && rect.bottom >= midY) {
            activeSection = section;
            break;
          }
        }

        if (!activeSection) return;

        // For Near You: highlight the first moment (horizontal scroll handles the rest)
        if (activeSection.type === 'nearYou' && nearYouMomentsRef.current.length > 0) {
          const idx = expandedSection === 'nearYou' ? nearYouExpandedActiveIdx : nearYouActiveIdx;
          const vl = nearYouMomentsRef.current[Math.max(0, idx)];
          if (vl) onScrollHighlightRef.current!([vl.location], vl.story?.id);
        }

        // For Collections: highlight the active collection's moments
        if (activeSection.type === 'collections' && filteredCollectionsRef.current.length > 0) {
          const idx = expandedSection === 'collections' ? 0 : collectionsActiveIdx;
          const collection = filteredCollectionsRef.current[Math.max(0, idx)];
          if (collection) {
            const collMoments: Moment[] = [];
            for (const mid of collection.momentIds) {
              const m = momentByIdRef.current.get(mid);
              if (m) collMoments.push(m);
            }
            if (collMoments.length > 0) {
              onScrollHighlightRef.current!(collMoments);
            }
          }
        }

        // For People: handled by the peopleActiveIdx / peopleExpandedActiveIdx effects
        // (horizontal scroll effects are the authority — don't override them here)
      });
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [expandedSection, nearYouActiveIdx, nearYouExpandedActiveIdx, collectionsActiveIdx]);

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
          {(expandedSection === 'people' ? allPeople : gridPeople).length > 0 ? (
            expandedSection === 'people' ? (
              <div ref={peopleExpandedRef} className="relative flex flex-col">
                {allPeople.map(({ entity, momentCount }, i) => (
                  <PersonRow
                    key={entity.id}
                    entity={entity}
                    momentCount={momentCount}
                    isActive={i === peopleExpandedActiveIdx}
                    isBackfill={backfillIds.has(entity.id)}
                    onClick={() => onEntityClick(entity)}
                  />
                ))}
              </div>
            ) : (
              <div>
                <HScrollRow scrollRef={peopleScrollRef}>
                  {gridPeople.map(({ entity, momentCount }, i) => (
                    <PersonCard
                      key={entity.id}
                      entity={entity}
                      momentCount={momentCount}
                      isActive={i === peopleActiveIdx}
                      isBackfill={backfillIds.has(entity.id)}
                      onClick={() => onEntityClick(entity)}
                    />
                  ))}
                </HScrollRow>
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
        {allHomeStories.length > 0 && (
          <>
            <div className="pb-4">
              <SectionHeading
                title={storiesSectionTitle}
                expanded={expandedSection === 'stories'}
                onToggle={() => toggleSection('stories')}
              />
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
                              ? `${story.moments.length} moments · nearby`
                              : `${storyInViewCounts.get(story.id) ?? 0} of ${story.moments.length} moments in view`}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <HScrollRow>
                  {allHomeStories.map((story) => (
                    <HomeStoryCard
                      key={story.id}
                      story={story}
                      inViewCount={storyInViewCounts.get(story.id) ?? 0}
                      onClick={() => onStorySelect?.(story)}
                    />
                  ))}
                </HScrollRow>
              )}
            </div>
            <div className="mx-4 my-4 border-t border-[var(--border-subtle)]" />
          </>
        )}
        </div>{/* end Stories order wrapper */}

        {/* Near You / In View */}
        <div style={{ order: o('moments') }}>
        <div ref={nearYouSectionRef} className="pb-4">
          <SectionHeading
            title={nearYouTitle}
            expanded={expandedSection === 'nearYou'}
            onToggle={() => toggleSection('nearYou')}
          />
          {nearYouMoments.length > 0 ? (
            expandedSection === 'nearYou' ? (
              // Expanded: vertical list
              <div ref={nearYouExpandedRef} className="flex flex-col gap-2 px-4">
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
              </div>
            ) : (
              // Collapsed: horizontal scroll
              <HScrollRow scrollRef={nearYouScrollRef}>
                {nearYouMoments.map((vl, i) => (
                  <NearYouCard
                    key={vl.location.id}
                    location={vl.location}
                    story={vl.story}
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
                ))}
              </HScrollRow>
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
              </div>
            ) : (
              // Collapsed: horizontal scroll
              <HScrollRow scrollRef={collectionsScrollRef}>
                {filteredCollections.map((collection, i) => (
                  <HomeCollectionCard
                    key={collection.id}
                    collection={collection}
                    isActive={i === collectionsActiveIdx}
                    inViewCount={collection.momentIds.filter((mid) => viewportMomentIds.has(mid)).length}
                    onClick={() => onCollectionSelect(collection)}
                  />
                ))}
              </HScrollRow>
            )
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)] font-mono">
                {categoryFilter ? 'No collections for this category' : 'No collections available'}
              </p>
            </div>
          )}
        </div>

        </div>{/* end Collections order wrapper */}

        </div>); /* end flex container + IIFE */
        })()}

        {/* Divider before encyclopedia */}
        <div className="mx-4 my-4 border-t border-[var(--border-subtle)]" />

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
