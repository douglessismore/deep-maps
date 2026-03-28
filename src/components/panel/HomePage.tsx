import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type { Entity, Moment, Story, StoryCategory, StoryCollection, ViewportLocation } from '../../types';
import type { EntityWithCounts } from '../../lib/entityHelpers';
import { CATEGORIES } from '../../lib/categories';
import { distanceMiles } from '../../lib/geo';
import { getEffectiveNotability } from '../../lib/notability';
import { useAppData } from '../../lib/data/provider';

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
  /** Callbacks */
  onMomentClick: (moment: Moment, story: Story) => void;
  onCollectionSelect: (collection: StoryCollection) => void;
  onEntityClick: (entity: Entity) => void;
  onSurpriseMe: () => void;
  /** Navigate to the explorer/4-tab view */
  onBrowseAll: () => void;
  /** Scroll highlight — called when a card scrolls into view in the horizontal row */
  onScrollHighlight?: (locations: Moment[], storyId?: string) => void;
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
    <div className="flex items-baseline justify-between px-4 mb-3">
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
    <div className="px-4 mb-3">
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
      className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar"
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

// ─── Near You card ───────────────────────────────────────────────────

function NearYouCard({
  location,
  story,
  distance,
  onClick,
}: {
  location: Moment;
  story: Story | null;
  distance: number;
  onClick: () => void;
}) {
  const cat = story ? CATEGORIES[story.category] : undefined;

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-[200px] rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden snap-start"
    >
      {/* Category accent bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: cat?.color ?? 'var(--text-muted)' }}
      />
      <div className="p-3 flex flex-col justify-between h-[112px]">
        <div className="min-w-0">
          <h3 className="text-[13px] font-serif font-bold text-white leading-tight line-clamp-2">
            {location.name}
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-1 line-clamp-2 italic">
            {location.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-1">
          {location.year && (
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {location.year}
            </span>
          )}
          {location.year && distance > 0 && (
            <span className="text-[var(--text-muted)]">&middot;</span>
          )}
          {distance > 0 && (
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
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
}: {
  location: Moment;
  story: Story | null;
  distance: number;
  onClick: () => void;
}) {
  const cat = story ? CATEGORIES[story.category] : undefined;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden"
    >
      <div className="flex items-start gap-3 p-3">
        {/* Category accent dot */}
        <div
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ backgroundColor: cat?.color ?? 'var(--text-muted)' }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-serif font-bold text-white leading-tight line-clamp-2">
            {location.name}
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5 line-clamp-1 italic">
            {location.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {location.year && (
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {location.year}
            </span>
          )}
          {distance > 0 && (
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
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
}: {
  collection: StoryCollection;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-[180px] rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left p-4 snap-start"
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
}: {
  entity: Entity;
  momentCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-card-hover)] transition-colors active:scale-[0.99] text-left"
    >
      <span className="w-8 h-8 rounded-full bg-[rgba(139,92,246,0.15)] ring-1 ring-[rgba(139,92,246,0.3)] flex items-center justify-center text-[11px] font-bold text-[rgba(139,92,246,0.8)] shrink-0">
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
  onMomentClick,
  onCollectionSelect,
  onEntityClick,
  onSurpriseMe,
  onBrowseAll,
  onScrollHighlight,
}: HomePageProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [categoryFilter, setCategoryFilter] = useState<StoryCategory | null>(null);

  // Global data for counts
  const { moments: allMoments, browseableStories: allStories } = useAppData();

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

  const hasGps = !!userLocation;
  const nearYouTitle = hasGps ? 'Near You' : 'Notable Events';

  // Filtered collections
  const filteredCollections = useMemo(() => {
    if (categoryFilter === null) return collections;
    // Collections don't have a single category — show all when filter is active
    // (they span multiple categories)
    return collections;
  }, [collections, categoryFilter]);

  // Section 3: Notable People — sorted by maxNotability, grid of 10
  const gridPeople = useMemo(() => {
    return [...personEntities]
      .sort((a, b) => b.maxNotability - a.maxNotability)
      .slice(0, 10);
  }, [personEntities]);

  // All people for expanded view
  const allPeople = useMemo(() => {
    return [...personEntities]
      .sort((a, b) => b.maxNotability - a.maxNotability);
  }, [personEntities]);

  // ── Scroll highlight for Near You horizontal row ──
  const nearYouScrollRef = useRef<HTMLDivElement | null>(null);
  const onScrollHighlightRef = useRef(onScrollHighlight);
  onScrollHighlightRef.current = onScrollHighlight;
  const nearYouMomentsRef = useRef(nearYouMoments);
  nearYouMomentsRef.current = nearYouMoments;

  const handleNearYouScroll = useCallback(() => {
    const container = nearYouScrollRef.current;
    if (!container || !onScrollHighlightRef.current) return;

    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;

    // Find the card closest to the horizontal center
    let closestIdx = -1;
    let closestDist = Infinity;
    const cards = container.children;
    for (let i = 0; i < cards.length; i++) {
      const cardRect = cards[i].getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const dist = Math.abs(cardCenterX - centerX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }

    if (closestIdx >= 0 && closestIdx < nearYouMomentsRef.current.length) {
      const vl = nearYouMomentsRef.current[closestIdx];
      onScrollHighlightRef.current([vl.location], vl.story?.id);
    }
  }, []);

  useEffect(() => {
    const container = nearYouScrollRef.current;
    if (!container || expandedSection === 'nearYou') return;

    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleNearYouScroll);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [handleNearYouScroll, expandedSection]);

  // Clear scroll highlight when leaving Near You section
  useEffect(() => {
    if (expandedSection !== null && expandedSection !== 'nearYou') {
      onScrollHighlight?.([]);
    }
  }, [expandedSection, onScrollHighlight]);

  const toggleSection = useCallback((section: ExpandedSection) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-24 lg:pb-[40vh]"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Inner wrapper for iOS rubber-band */}
      <div style={{ minHeight: 'calc(100% + 1px)' }}>
        {/* ── Tagline ── */}
        <div className="px-4 pt-5 pb-2">
          <h1 className="text-[22px] font-serif font-bold text-[#f5f0eb] leading-tight tracking-[-0.01em]">
            {hasGps ? (
              <>Dive into history <span className="text-[var(--accent-red)]">around you</span></>
            ) : (
              <>Dive into the map <span className="text-[var(--accent-red)]">of history</span></>
            )}
          </h1>
          <p className="text-[13px] text-[var(--text-muted)] font-sans mt-1.5">
            Every place has a story
          </p>
        </div>

        {/* ── Category filter pills ── */}
        <div className="pt-1 pb-3">
          <CategoryFilterPills selected={categoryFilter} onSelect={setCategoryFilter} />
        </div>

        {/* ── Section 1: Near You ── */}
        <div className="pb-2">
          <SectionHeading
            title={nearYouTitle}
            expanded={expandedSection === 'nearYou'}
            onToggle={() => toggleSection('nearYou')}
          />
          {nearYouMoments.length > 0 ? (
            expandedSection === 'nearYou' ? (
              // Expanded: vertical list
              <div className="flex flex-col gap-2 px-4">
                {nearYouMoments.map((vl) => (
                  <NearYouCardVertical
                    key={vl.location.id}
                    location={vl.location}
                    story={vl.story}
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
                {nearYouMoments.map((vl) => (
                  <NearYouCard
                    key={vl.location.id}
                    location={vl.location}
                    story={vl.story}
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

        {/* Divider */}
        <div className="mx-4 border-t border-[var(--border-subtle)]" />

        {/* ── Section 2: Collections ── */}
        <div className="pt-4 pb-2">
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
              <HScrollRow>
                {filteredCollections.map((collection) => (
                  <HomeCollectionCard
                    key={collection.id}
                    collection={collection}
                    onClick={() => onCollectionSelect(collection)}
                  />
                ))}
              </HScrollRow>
            )
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)] font-mono">
                No collections available
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-[var(--border-subtle)]" />

        {/* ── Section 3: Notable People (grid) ── */}
        <div className="pt-4 pb-2">
          <SectionHeading
            title="Notable People"
            expanded={expandedSection === 'people'}
            onToggle={() => toggleSection('people')}
          />
          {(expandedSection === 'people' ? allPeople : gridPeople).length > 0 ? (
            expandedSection === 'people' ? (
              // Expanded: vertical list
              <div className="flex flex-col">
                {allPeople.map(({ entity, momentCount }) => (
                  <PersonRow
                    key={entity.id}
                    entity={entity}
                    momentCount={momentCount}
                    onClick={() => onEntityClick(entity)}
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
                    onClick={() => onEntityClick(entity)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-muted)] font-mono">
                Pan or zoom the map to see notable people
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-[var(--border-subtle)]" />

        {/* ── Section 4: Browse the Encyclopedia ── */}
        <div className="pt-4 pb-2">
          <SectionTitle title="Browse the Encyclopedia" />
          <div className="px-4">
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-4">
              <p className="text-[13px] text-[var(--text-secondary)] font-sans leading-relaxed">
                Explore{' '}
                <span className="text-[var(--text-primary)] font-semibold">{allMoments.length.toLocaleString()}</span>{' '}
                moments across{' '}
                <span className="text-[var(--text-primary)] font-semibold">{allStories.length.toLocaleString()}</span>{' '}
                stories. Search, filter, and find the events that shaped the world.
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
        <div className="mx-4 border-t border-[var(--border-subtle)]" />

        {/* ── Section 5: Surprise Me ── */}
        <div className="px-4 pt-4 pb-6 flex justify-center">
          <button
            onClick={onSurpriseMe}
            className="w-[65%] rounded-xl border border-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 transition-all duration-200 active:scale-[0.98] py-3 px-4 text-center group"
          >
            <div className="text-sm font-serif font-bold text-[var(--accent-red)]">
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
