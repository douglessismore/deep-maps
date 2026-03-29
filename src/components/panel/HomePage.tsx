import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Entity, Moment, Story, StoryCategory, StoryCollection, ViewportLocation } from '../../types';
import type { EntityWithCounts } from '../../lib/entityHelpers';
import { getMomentsForEntity } from '../../lib/entityHelpers';
import { CATEGORIES } from '../../lib/categories';
import { distanceMiles } from '../../lib/geo';
import { getEffectiveNotability } from '../../lib/notability';
import { useAppData } from '../../lib/data/provider';
import { ContextStrip } from './ContextStrip';

// ─── Types ───────────────────────────────────────────────────────────

type ExpandedSection = 'nearYou' | 'collections' | 'people' | null;

interface HomePageProps {
  /** Viewport-filtered moments sorted by hybridNearestScore */
  viewportLocations: ViewportLocation[];
  /** All collections from data provider */
  collections: StoryCollection[];
  /** Person entities sorted by maxNotability */
  personEntities: EntityWithCounts[];
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
  /** Category filter — synced with App.tsx to also filter map markers */
  categoryFilter: StoryCategory | null;
  onCategoryFilter: (category: StoryCategory | null) => void;
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
): number {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled || itemCount === 0) return;

    let rafId = 0;
    const findCenter = () => {
      const rect = container.getBoundingClientRect();
      const cards = container.children;
      let closestIdx = 0;
      let closestDist = Infinity;

      for (let i = 0; i < cards.length; i++) {
        const cardRect = cards[i].getBoundingClientRect();
        let dist: number;
        if (mode === 'horizontal') {
          const cardCenterX = cardRect.left + cardRect.width / 2;
          const containerCenterX = rect.left + rect.width / 2;
          dist = Math.abs(cardCenterX - containerCenterX);
        } else {
          // Vertical: closest to the top of the visible area + small offset
          const cardTop = cardRect.top - rect.top;
          dist = Math.abs(cardTop - 40); // 40px offset from top
        }
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
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

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [containerRef, itemCount, enabled, mode]);

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
      <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">
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
      <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">
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
}: {
  selected: StoryCategory | null;
  onSelect: (cat: StoryCategory | null) => void;
}) {
  return (
    <div
      className="flex gap-2.5 overflow-x-auto px-4 pb-2 no-scrollbar"
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
      {CATEGORY_ENTRIES.map(([key, config]) => {
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
    </div>
  );
}

// ─── Highlight style helper ─────────────────────────────────────────
// Returns inline style for a card based on whether it's the active (centered) one.

function cardHighlightStyle(isActive: boolean): React.CSSProperties {
  if (!isActive) return {};
  return {
    transform: 'scale(1.02)',
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'var(--bg-card-hover)',
    boxShadow: '0 0 12px rgba(255,255,255,0.06)',
  };
}

// ─── Near You card ───────────────────────────────────────────────────

function NearYouCard({
  location,
  story,
  distance,
  onClick,
  isActive,
}: {
  location: Moment;
  story: Story | null;
  distance: number;
  onClick: () => void;
  isActive?: boolean;
}) {
  const cat = story ? CATEGORIES[story.category] : undefined;

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-[200px] rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden snap-start"
      style={cardHighlightStyle(!!isActive)}
    >
      {/* Category accent bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: cat?.color ?? 'var(--text-muted)' }}
      />
      <div className="p-3 flex flex-col justify-between h-[120px]">
        <div className="min-w-0">
          <h3 className="text-[14px] font-serif font-bold text-white leading-tight line-clamp-2">
            {location.name}
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] leading-snug mt-1 line-clamp-2 italic">
            {location.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-1">
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
}: {
  location: Moment;
  story: Story | null;
  distance: number;
  onClick: () => void;
  isActive?: boolean;
}) {
  const cat = story ? CATEGORIES[story.category] : undefined;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden"
      style={cardHighlightStyle(!!isActive)}
    >
      <div className="flex items-start gap-3 p-3.5">
        {/* Category accent dot */}
        <div
          className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
          style={{ backgroundColor: cat?.color ?? 'var(--text-muted)' }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-serif font-bold text-white leading-tight line-clamp-2">
            {location.name}
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] leading-snug mt-0.5 line-clamp-1 italic">
            {location.subtitle}
          </p>
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
  onClick,
  isActive,
}: {
  collection: StoryCollection;
  onClick: () => void;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-[180px] rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left p-4 snap-start"
      style={cardHighlightStyle(!!isActive)}
    >
      <div className="flex flex-col h-[100px] justify-between">
        <div className="min-w-0">
          <h3 className="text-[13px] font-serif font-bold text-white leading-tight line-clamp-2">
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

// ─── Collection card (grid/expanded) ─────────────────────────────────

function CollectionGridCard({
  collection,
  onClick,
}: {
  collection: StoryCollection;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left p-3"
    >
      <div className="flex flex-col h-[90px] justify-between">
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

// ─── Person grid card ───────────────────────────────────────────────

function PersonGridCard({
  entity,
  momentCount,
  onClick,
}: {
  entity: Entity;
  momentCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[rgba(139,92,246,0.4)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left"
    >
      {/* Avatar circle */}
      <span className="w-8 h-8 rounded-full bg-[rgba(139,92,246,0.15)] ring-1 ring-[rgba(139,92,246,0.3)] flex items-center justify-center text-[11px] font-bold text-[rgba(139,92,246,0.8)] shrink-0 mt-0.5">
        {entity.name[0].toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[12px] font-sans font-semibold text-[var(--text-primary)] leading-tight line-clamp-1">
          {entity.name}
        </h3>
        {entity.description ? (
          <p className="text-[10px] text-[var(--text-muted)] leading-snug mt-0.5 line-clamp-1">
            {entity.description}
          </p>
        ) : entity.years ? (
          <p className="text-[10px] text-[var(--text-muted)] leading-snug mt-0.5">
            {entity.years}
          </p>
        ) : null}
        <span className="text-[9px] font-mono text-[var(--text-muted)] mt-1 block">
          {momentCount} {momentCount === 1 ? 'event' : 'events'}
        </span>
      </div>
    </button>
  );
}

// ─── Person row (expanded) ──────────────────────────────────────────

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
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.99] text-left"
      style={isActive ? {
        backgroundColor: 'var(--bg-card-hover)',
        boxShadow: '0 0 12px rgba(139,92,246,0.08)',
      } : undefined}
    >
      <span className={`w-8 h-8 rounded-full bg-[rgba(139,92,246,0.15)] ring-1 flex items-center justify-center text-[11px] font-bold text-[rgba(139,92,246,0.8)] shrink-0 ${isActive ? 'ring-[rgba(139,92,246,0.6)]' : 'ring-[rgba(139,92,246,0.3)]'}`}
      >
        {entity.name[0].toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-sans font-medium text-[var(--text-primary)] block truncate">
          {entity.name}
        </span>
        {entity.description && (
          <span className="text-[10px] text-[var(--text-muted)] block truncate">
            {entity.description}
          </span>
        )}
      </div>
      <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
        {momentCount} events
      </span>
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
  userLocation,
  isNearUser,
  onMomentClick,
  onCollectionSelect: _onCollectionSelect,
  onEntityClick: _onEntityClick,
  onSurpriseMe,
  onBrowseAll,
  onScrollHighlight,
  categoryFilter,
  onCategoryFilter,
}: HomePageProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);

  // ── Context Strip state ──
  type StripContextType =
    | { type: 'nearby' }
    | { type: 'collection'; collection: StoryCollection }
    | { type: 'person'; entity: Entity };
  const [stripContext, setStripContext] = useState<StripContextType>({ type: 'nearby' });

  // Global data for counts + moment lookup
  const { moments: allMoments, browseableStories: allStories, stories } = useAppData();

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

  // ── Context Strip: resolve moments based on context ──
  const stripMoments = useMemo(() => {
    if (stripContext.type === 'collection') {
      const coll = stripContext.collection;
      return coll.momentIds
        .map((mid) => momentById.get(mid))
        .filter((m): m is Moment => m != null)
        .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    }
    if (stripContext.type === 'person') {
      return getMomentsForEntity(stripContext.entity.id)
        .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    }
    // Default: nearby — use the same viewport moments as Near You section
    return viewportLocations
      .filter((vl) => vl.story !== null)
      .sort((a, b) => getEffectiveNotability(b.location) - getEffectiveNotability(a.location))
      .slice(0, 30)
      .map((vl) => vl.location);
  }, [stripContext, momentById, viewportLocations]);

  const stripLabel = useMemo(() => {
    if (stripContext.type === 'collection') return stripContext.collection.name;
    if (stripContext.type === 'person') return `👤 ${stripContext.entity.name}`;
    return isNearUser ? 'Near You' : 'In View';
  }, [stripContext, isNearUser]);

  const stripSublabel = `${stripMoments.length} moment${stripMoments.length !== 1 ? 's' : ''}`;

  const categoryForMoment = useCallback((momentId: string): StoryCategory | undefined => {
    return momentToStoryMap.get(momentId)?.category;
  }, [momentToStoryMap]);

  const handleStripCardTap = useCallback((moment: Moment) => {
    const story = momentToStoryMap.get(moment.id);
    if (story) onMomentClick(moment, story);
  }, [momentToStoryMap, onMomentClick]);

  const handleStripScrollHighlight = useCallback((moment: Moment) => {
    onScrollHighlight?.([moment], momentToStoryMap.get(moment.id)?.id);
  }, [momentToStoryMap, onScrollHighlight]);

  // V4: When tapping a collection, update the strip instead of navigating
  const handleCollectionTapForStrip = useCallback((collection: StoryCollection) => {
    setStripContext({ type: 'collection', collection });
  }, []);

  // V4: When tapping a person, update the strip instead of navigating
  const handlePersonTapForStrip = useCallback((entity: Entity) => {
    setStripContext({ type: 'person', entity });
  }, []);

  const handleStripClear = useCallback(() => {
    setStripContext({ type: 'nearby' });
  }, []);

  // Section 1: Near You — top moments by hybridNearestScore (already sorted from parent)
  // Filter to moments that have a parent story so every card is clickable
  const nearYouMoments = useMemo(() => {
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

  // Dynamic title: "Near you" when GPS is in viewport, "In view" otherwise
  const nearYouTitle = isNearUser ? 'Near You' : 'In View';

  // Filtered collections — when a category filter is active, only show
  // collections that contain at least one moment from a story in that category.
  const filteredCollections = useMemo(() => {
    if (categoryFilter === null) return collections;
    return collections.filter((c) =>
      c.momentIds.some((mid) => {
        const parentStory = momentToStoryMap.get(mid);
        return parentStory?.category === categoryFilter;
      })
    );
  }, [collections, categoryFilter, momentToStoryMap]);

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
  const gridPeople = useMemo(() => {
    return [...filteredPersonEntities]
      .sort((a, b) => b.maxNotability - a.maxNotability)
      .slice(0, 10);
  }, [filteredPersonEntities]);

  // All people for expanded view
  const allPeople = useMemo(() => {
    return [...filteredPersonEntities]
      .sort((a, b) => b.maxNotability - a.maxNotability);
  }, [filteredPersonEntities]);

  // ── Scroll refs for each section ──
  const nearYouScrollRef = useRef<HTMLDivElement | null>(null);
  const nearYouExpandedRef = useRef<HTMLDivElement | null>(null);
  const collectionsScrollRef = useRef<HTMLDivElement | null>(null);
  const peopleExpandedRef = useRef<HTMLDivElement | null>(null);

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
  );
  const collectionsActiveIdx = useScrollActiveIndex(
    collectionsScrollRef,
    filteredCollections.length,
    expandedSection !== 'collections',
    'horizontal',
  );
  const peopleExpandedActiveIdx = useScrollActiveIndex(
    peopleExpandedRef,
    allPeople.length,
    expandedSection === 'people',
    'vertical',
  );

  // Stable ref pattern for callbacks
  const onScrollHighlightRef = useRef(onScrollHighlight);
  onScrollHighlightRef.current = onScrollHighlight;
  const nearYouMomentsRef = useRef(nearYouMoments);
  nearYouMomentsRef.current = nearYouMoments;

  // ── Near You scroll → map highlight ──
  // Use the active index from our hook to drive map highlighting
  const prevNearYouIdx = useRef(-1);
  useEffect(() => {
    if (!onScrollHighlightRef.current) return;
    const idx = expandedSection === 'nearYou' ? nearYouExpandedActiveIdx : nearYouActiveIdx;
    if (idx === prevNearYouIdx.current) return;
    prevNearYouIdx.current = idx;

    if (idx >= 0 && idx < nearYouMomentsRef.current.length) {
      const vl = nearYouMomentsRef.current[idx];
      onScrollHighlightRef.current([vl.location], vl.story?.id);
    }
  }, [nearYouActiveIdx, nearYouExpandedActiveIdx, expandedSection]);

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
    }
  }, [collectionsActiveIdx, expandedSection]);

  // ── People expanded scroll → map highlight ──
  // When a person scrolls into view in the expanded list, highlight their locations.
  const allPeopleRef = useRef(allPeople);
  allPeopleRef.current = allPeople;

  const prevPeopleIdx = useRef(-1);
  useEffect(() => {
    if (!onScrollHighlightRef.current || expandedSection !== 'people') return;
    if (peopleExpandedActiveIdx === prevPeopleIdx.current) return;
    prevPeopleIdx.current = peopleExpandedActiveIdx;

    const personData = allPeopleRef.current[peopleExpandedActiveIdx];
    if (!personData) return;

    const entityMoments = getMomentsForEntity(personData.entity.id);
    if (entityMoments.length > 0) {
      onScrollHighlightRef.current(entityMoments);
    }
  }, [peopleExpandedActiveIdx, expandedSection]);

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

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-24 lg:pb-[40vh]"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Inner wrapper for iOS rubber-band */}
      <div style={{ minHeight: 'calc(100% + 1px)' }}>
        {/* ── Tagline ── */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-[24px] font-serif font-bold text-[#f5f0eb] leading-tight tracking-[-0.01em]">
            Discover what happened <span className="text-[#D4A853]">here</span>
          </h1>
          <p className="text-[14px] text-[var(--text-muted)] font-sans mt-2 leading-relaxed">
            The map of everything that ever happened. Start anywhere.
          </p>
        </div>

        {/* ── Context Strip (V4) — sticky so it stays visible while scrolling ── */}
        <div className="sticky top-0 z-20 bg-[var(--bg-primary)]">
          <ContextStrip
            moments={stripMoments}
            contextLabel={stripLabel}
            contextSublabel={stripSublabel}
            showClear={stripContext.type !== 'nearby'}
            onClear={handleStripClear}
            onCardTap={handleStripCardTap}
            onScrollHighlight={handleStripScrollHighlight}
            userLocation={userLocation}
            categoryForMoment={categoryForMoment}
          />
        </div>

        {/* ── Category filter pills ── */}
        <div className="pb-5 pt-2">
          <CategoryFilterPills selected={categoryFilter} onSelect={onCategoryFilter} />
        </div>

        {/* ── Section 1: Near You / In View ── */}
        <div className="pb-4">
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
                    distance={
                      userLocation
                        ? distanceMiles(userLocation.lat, userLocation.lng, vl.location.lat, vl.location.lng)
                        : 0
                    }
                    onClick={() => {
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
                    distance={
                      userLocation
                        ? distanceMiles(userLocation.lat, userLocation.lng, vl.location.lat, vl.location.lng)
                        : 0
                    }
                    onClick={() => {
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

        {/* Everywhere divider */}
        <div className="mx-4 my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-[var(--border-subtle)]" />
          <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Everywhere</span>
          <div className="flex-1 border-t border-[var(--border-subtle)]" />
        </div>

        {/* ── Section 2: Collections ── */}
        <div className="pt-4 pb-4">
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
                    onClick={() => handleCollectionTapForStrip(collection)}
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
                    onClick={() => handleCollectionTapForStrip(collection)}
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

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-[var(--border-subtle)]" />

        {/* ── Section 3: Notable People (grid) ── */}
        <div className="pt-4 pb-4">
          <SectionHeading
            title="Notable People"
            expanded={expandedSection === 'people'}
            onToggle={() => toggleSection('people')}
          />
          {(expandedSection === 'people' ? allPeople : gridPeople).length > 0 ? (
            expandedSection === 'people' ? (
              // Expanded: vertical list with scroll tracking
              <div ref={peopleExpandedRef} className="flex flex-col">
                {allPeople.map(({ entity, momentCount }, i) => (
                  <PersonRow
                    key={entity.id}
                    entity={entity}
                    momentCount={momentCount}
                    isActive={i === peopleExpandedActiveIdx}
                    onClick={() => handlePersonTapForStrip(entity)}
                  />
                ))}
              </div>
            ) : (
              // Collapsed: 2-column grid
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 px-4">
                {gridPeople.map(({ entity, momentCount }) => (
                  <PersonGridCard
                    key={entity.id}
                    entity={entity}
                    momentCount={momentCount}
                    onClick={() => handlePersonTapForStrip(entity)}
                  />
                ))}
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

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-[var(--border-subtle)]" />

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
        <div className="mx-4 my-2 border-t border-[var(--border-subtle)]" />

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
