import { useMemo } from 'react';
import type { Entity, Moment, Story, StoryCollection, ViewportLocation } from '../../types';
import type { EntityWithCounts } from '../../lib/entityHelpers';
import { CATEGORIES } from '../../lib/categories';
import { distanceMiles } from '../../lib/geo';
import { getEffectiveNotability } from '../../lib/notability';

// ─── Types ───────────────────────────────────────────────────────────

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
}

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDistance(miles: number): string {
  if (miles < 0.1) return 'Here';
  if (miles < 1) return `${(miles * 5280).toFixed(0)} ft`;
  if (miles < 100) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

// ─── Section heading ─────────────────────────────────────────────────

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline justify-between px-4 mb-3">
      <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      {subtitle && (
        <button className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors shrink-0 ml-4">
          {subtitle}
        </button>
      )}
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

// ─── Person pill ─────────────────────────────────────────────────────

function PersonPill({
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
      className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[rgba(139,92,246,0.4)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] snap-start"
    >
      {/* Avatar circle */}
      <span className="w-6 h-6 rounded-full bg-[rgba(139,92,246,0.15)] ring-1 ring-[rgba(139,92,246,0.3)] flex items-center justify-center text-[10px] font-bold text-[rgba(139,92,246,0.8)] shrink-0">
        {entity.name[0].toUpperCase()}
      </span>
      <span className="text-[12px] font-sans font-medium text-[var(--text-primary)] whitespace-nowrap">
        {entity.name}
      </span>
      <span className="text-[10px] font-mono text-[var(--text-muted)] whitespace-nowrap">
        {momentCount}
      </span>
    </button>
  );
}

// ─── Horizontal scroll container ─────────────────────────────────────

function HScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar"
      style={{
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x',
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
}: HomePageProps) {

  // Section 1: Near You — top moments by hybridNearestScore (already sorted from parent)
  const nearYouMoments = useMemo(() => {
    // Sort by notability * proximity hybrid
    const sorted = [...viewportLocations].sort((a, b) => {
      const aN = getEffectiveNotability(a.location);
      const bN = getEffectiveNotability(b.location);
      // Higher notability first, then closer distance as tiebreak
      return bN - aN || a.distance - b.distance;
    });
    return sorted.slice(0, 20);
  }, [viewportLocations]);

  const hasGps = !!userLocation;
  const nearYouTitle = hasGps ? 'Near You' : 'Notable Events';

  // Section 3: Notable People — sorted by maxNotability
  const topPeople = useMemo(() => {
    return [...personEntities]
      .sort((a, b) => b.maxNotability - a.maxNotability)
      .slice(0, 30);
  }, [personEntities]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 lg:pb-[40vh]">
      {/* Inner wrapper for iOS rubber-band */}
      <div style={{ minHeight: 'calc(100% + 1px)' }}>
        {/* ── Section 1: Near You ── */}
        <div className="pt-4 pb-2">
          <SectionHeading title={nearYouTitle} subtitle="See all &rarr;" />
          {nearYouMoments.length > 0 ? (
            <HScrollRow>
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
          <SectionHeading title="Collections" subtitle="See all &rarr;" />
          {collections.length > 0 ? (
            <HScrollRow>
              {collections.map((collection) => (
                <HomeCollectionCard
                  key={collection.id}
                  collection={collection}
                  onClick={() => onCollectionSelect(collection)}
                />
              ))}
            </HScrollRow>
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

        {/* ── Section 3: Notable People ── */}
        <div className="pt-4 pb-2">
          <SectionHeading title="Notable People" subtitle="See all &rarr;" />
          {topPeople.length > 0 ? (
            <HScrollRow>
              {topPeople.map(({ entity, momentCount }) => (
                <PersonPill
                  key={entity.id}
                  entity={entity}
                  momentCount={momentCount}
                  onClick={() => onEntityClick(entity)}
                />
              ))}
            </HScrollRow>
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

        {/* ── Section 4: Surprise Me ── */}
        <div className="px-4 pt-4 pb-6">
          <button
            onClick={onSurpriseMe}
            className="w-full rounded-xl bg-[var(--accent-red)] hover:bg-[var(--accent-red)]/90 transition-all duration-200 active:scale-[0.98] p-5 text-center group"
          >
            <div className="text-lg font-serif font-bold text-white mb-1">
              Surprise Me
            </div>
            <p className="text-sm text-white/70 font-sans">
              Discover a random event from history
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
