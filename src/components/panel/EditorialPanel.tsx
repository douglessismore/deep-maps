import { useMemo, useRef, useState, useEffect } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Entity, Moment, Story, StoryCategory, StoryCollection, ViewportLocation } from '../../types';
import { getViewportEntities } from '../../lib/entityHelpers';
import { getLocationsInBounds } from '../../lib/geo';
import { getEffectiveNotability } from '../../lib/notability';
import { buildMomentMap } from '../../lib/storyHelpers';
import { CATEGORIES } from '../../lib/categories';
import { useAppData } from '../../lib/data/provider';

// ─── Types ───────────────────────────────────────────────────────────

interface EditorialPanelProps {
  stories: Story[];
  collections: StoryCollection[];
  mapInstance: LeafletMap | null;
  categoryFilter: StoryCategory | null;
  onStorySelect: (story: Story) => void;
  onLocationSelect: (location: Moment, story: Story) => void;
  onCollectionSelect: (collection: StoryCollection) => void;
  onEntityClick: (entity: Entity) => void;
  onSurpriseMe: () => void;
  onCategoryFilter: (category: StoryCategory | null) => void;
  /** Zoom the map to a specific lat/lng (triggers transition to zoomed-in mode) */
  onZoomToLocation: (lat: number, lng: number) => void;
}

// ─── Horizontal scroll row ───────────────────────────────────────────

function HScrollRow({ children, minHeight }: { children: React.ReactNode; minHeight?: number }) {
  return (
    <div
      className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory shrink-0"
      style={{ WebkitOverflowScrolling: 'touch', minHeight: minHeight ?? 'auto' }}
    >
      {children}
    </div>
  );
}

// ─── Section heading ─────────────────────────────────────────────────

function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-baseline gap-2 px-4 mb-3 mt-6 first:mt-2 shrink-0">
      <h2 className="text-base font-sans font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      {count != null && count > 0 && (
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Notable moment card (large) ────────────────────────────────────

function NotableMomentCard({
  location,
  story,
  onClick,
}: {
  location: Moment;
  story: Story | null;
  onClick: () => void;
}) {
  const cat = story ? CATEGORIES[story.category] : undefined;

  return (
    <button
      onClick={onClick}
      className="shrink-0 w-[240px] rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left overflow-hidden snap-start"
    >
      {/* Category accent bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: cat?.color ?? 'var(--text-muted)' }}
      />
      <div className="p-4 flex flex-col justify-between h-[140px]">
        <div className="min-w-0">
          <h3 className="text-[14px] font-serif font-bold text-white leading-tight line-clamp-2">
            {location.name}
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)] leading-snug mt-1.5 line-clamp-2 italic">
            {location.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-2">
          {cat && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ color: cat.color, backgroundColor: cat.bgColor }}
            >
              {cat.label}
            </span>
          )}
          {location.year && (
            <span className="text-[10px] font-mono text-[var(--text-muted)] ml-auto">
              {location.year}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Collection card (horizontal) ────────────────────────────────────

function EditorialCollectionCard({
  collection,
  onClick,
}: {
  collection: StoryCollection;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-[200px] rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left p-4 snap-start"
    >
      <div className="flex flex-col h-[110px] justify-between">
        <div className="min-w-0">
          <h3 className="text-[13px] font-serif font-bold text-white leading-tight line-clamp-2">
            {collection.name}
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] leading-snug mt-1 line-clamp-2">
            {collection.subtitle}
          </p>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mt-auto pt-1">
          {collection.momentIds.length} moments
        </span>
      </div>
    </button>
  );
}

// ─── Person chip (horizontal) ────────────────────────────────────────

function PersonChip({
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
      className="shrink-0 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 active:scale-[0.97] text-left px-4 py-3 snap-start"
    >
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-serif font-bold text-white whitespace-nowrap">
          {entity.name}
        </span>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          {momentCount} {momentCount === 1 ? 'moment' : 'moments'}
          {entity.years ? ` · ${entity.years}` : ''}
        </span>
      </div>
    </button>
  );
}

// ─── Category filter pills ──────────────────────────────────────────

const CATEGORY_ENTRIES = Object.entries(CATEGORIES) as [StoryCategory, { label: string; color: string; bgColor: string; borderColor: string }][];

function CategoryPills({
  selected,
  onSelect,
}: {
  selected: StoryCategory | null;
  onSelect: (cat: StoryCategory | null) => void;
}) {
  return (
    <div
      className="flex gap-2.5 overflow-x-auto px-4 pb-2 no-scrollbar"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <button
        onClick={() => onSelect(null)}
        className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-sans font-medium transition-all duration-150"
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
            className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-sans font-medium transition-all duration-150 whitespace-nowrap"
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

// ─── Main component ──────────────────────────────────────────────────

export function EditorialPanel({
  stories,
  collections,
  mapInstance,
  categoryFilter,
  onStorySelect: _onStorySelect,
  onLocationSelect,
  onCollectionSelect,
  onEntityClick,
  onCategoryFilter,
  onZoomToLocation,
}: EditorialPanelProps) {
  const { moments } = useAppData();
  const momentMap = useMemo(() => buildMomentMap(moments), [moments]);

  // Viewport-filtered data — updates when map moves
  const [viewportLocations, setViewportLocations] = useState<ViewportLocation[]>([]);
  const updateKey = useRef(0);

  useEffect(() => {
    if (!mapInstance) return;

    const update = () => {
      const bounds = mapInstance.getBounds();
      const sourceStories = categoryFilter
        ? stories.filter(s => s.category === categoryFilter)
        : stories;
      const allInBounds = getLocationsInBounds(sourceStories, bounds, momentMap, moments);
      setViewportLocations(allInBounds);
      updateKey.current += 1;
    };

    update();
    mapInstance.on('moveend', update);
    mapInstance.on('zoomend', update);
    return () => {
      mapInstance.off('moveend', update);
      mapInstance.off('zoomend', update);
    };
  }, [mapInstance, stories, categoryFilter, momentMap, moments]);

  // Most Notable — top moments sorted by notability
  const notableMoments = useMemo(() => {
    return [...viewportLocations]
      .sort((a, b) => {
        const na = getEffectiveNotability(a.location);
        const nb = getEffectiveNotability(b.location);
        return nb - na;
      })
      .slice(0, 20);
  }, [viewportLocations]);

  // Collections in viewport — collections with at least one moment visible
  const viewportCollections = useMemo(() => {
    if (!mapInstance) return collections;
    const bounds = mapInstance.getBounds();
    return collections.filter(c =>
      c.momentIds.some(mid => {
        const m = moments.find(mm => mm.id === mid);
        return m && bounds.contains([m.lat, m.lng]);
      })
    );
  }, [collections, mapInstance, moments, viewportLocations]);

  // Person entities in viewport
  const personEntities = useMemo(() => {
    const vpMomentIds = new Set(viewportLocations.map(vl => vl.location.id));
    return getViewportEntities(vpMomentIds)
      .filter(ec => ec.entity.type === 'person')
      .sort((a, b) => b.maxNotability - a.maxNotability)
      .slice(0, 30);
  }, [viewportLocations]);

  // Moment-to-story lookup for card clicks
  const momentToStory = useMemo(() => {
    const map = new Map<string, Story>();
    stories.forEach(story => {
      story.moments.forEach(sm => {
        if (!map.has(sm.momentId)) map.set(sm.momentId, story);
      });
    });
    return map;
  }, [stories]);

  const handleMomentClick = (location: Moment) => {
    // Zoom to the moment's location — this will trigger the transition to zoomed-in mode
    onZoomToLocation(location.lat, location.lng);
    // Also select the story so the user lands in context
    const story = momentToStory.get(location.id);
    if (story) {
      // Small delay so the zoom animation starts before the panel switches
      setTimeout(() => onLocationSelect(location, story), 100);
    }
  };

  const inViewCount = viewportLocations.length;

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
      {/* Mode indicator */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
            Discovery
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            · {inViewCount} moments in view
          </span>
        </div>
      </div>

      {/* Category filter */}
      <div className="mt-3">
        <CategoryPills selected={categoryFilter} onSelect={onCategoryFilter} />
      </div>

      {/* Most Notable */}
      {notableMoments.length > 0 && (
        <>
          <SectionHeading title="Most Notable" count={notableMoments.length} />
          <HScrollRow minHeight={168}>
            {notableMoments.map(vl => (
              <NotableMomentCard
                key={vl.location.id}
                location={vl.location}
                story={vl.story}
                onClick={() => handleMomentClick(vl.location)}
              />
            ))}
          </HScrollRow>
        </>
      )}

      {/* Collections */}
      {viewportCollections.length > 0 && (
        <>
          <SectionHeading title="Collections" count={viewportCollections.length} />
          <HScrollRow minHeight={140}>
            {viewportCollections.map(coll => (
              <EditorialCollectionCard
                key={coll.id}
                collection={coll}
                onClick={() => onCollectionSelect(coll)}
              />
            ))}
          </HScrollRow>
        </>
      )}

      {/* Notable People */}
      {personEntities.length > 0 && (
        <>
          <SectionHeading title="Notable People" count={personEntities.length} />
          <HScrollRow minHeight={64}>
            {personEntities.map(ec => (
              <PersonChip
                key={ec.entity.id}
                entity={ec.entity}
                momentCount={ec.momentCount}
                onClick={() => onEntityClick(ec.entity)}
              />
            ))}
          </HScrollRow>
        </>
      )}

      {/* Bottom spacer for mobile sheet */}
      <div className="h-24 shrink-0" />
    </div>
  );
}
