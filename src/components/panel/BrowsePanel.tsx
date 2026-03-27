import { useState, useMemo, useRef, useEffect, useCallback, forwardRef } from 'react';
import type { Entity, Story, StoryCollection } from '../../types';
import { CollectionCard } from './CollectionCard';
import { StoryCard } from './StoryCard';
import { PersonCard } from './PersonCard';
import { getMomentsForEntity, getEntityIcon, type EntityWithCounts } from '../../lib/entityHelpers';

// ── Types ──

interface BrowsePanelProps {
  collections: StoryCollection[];
  browseableStories: Story[];
  entities: Entity[];
  onCollectionSelect: (collection: StoryCollection) => void;
  onStorySelect: (story: Story) => void;
  onEntitySelect: (entity: Entity) => void;
}

type BrowseView = 'index' | 'all-collections' | 'all-people' | 'all-stories' | 'all-places';

const ITEMS_PER_BATCH = 20;
const PREVIEW_COUNT = 6;

// ── Section Component ──

function BrowseSection({
  title,
  subtitle,
  count,
  onSeeAll,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  onSeeAll: () => void;
  children: React.ReactNode;
}) {
  return (
    <section role="region" aria-label={title} className="mb-6">
      {/* Section header — sits on panel surface */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <div>
          <h2 className="font-sans text-xl font-semibold text-[var(--text-primary)] tracking-tight">
            {title}
          </h2>
          <p className="font-serif text-sm italic text-[var(--text-muted)] opacity-60 mt-0.5">
            {subtitle}
          </p>
        </div>
        <button
          onClick={onSeeAll}
          className="text-sm font-sans font-medium text-[#68dba9] hover:text-[#8aebc4] transition-colors shrink-0"
          aria-label={`See all ${count} ${title.toLowerCase()}`}
        >
          See all {count} →
        </button>
      </div>
      {/* Section content */}
      <div className="bg-[#201f1f] rounded-xl p-4">
        {children}
      </div>
    </section>
  );
}

// ── "See All" Sub-Navigation ──

function SeeAllView({
  title,
  count,
  onBack,
  children,
}: {
  title: string;
  count: number;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)]">
        <button
          onClick={onBack}
          className="text-[var(--text-secondary)] hover:text-white transition-colors p-1"
          aria-label="Back to Browse"
        >
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="font-sans text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <span className="font-mono text-xs text-[var(--text-muted)]">
          {count}
        </span>
      </div>
      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {children}
      </div>
    </div>
  );
}

// ── Infinite Scroll Hook ──

function useInfiniteScroll(totalItems: number) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < totalItems) {
          setVisibleCount(prev => Math.min(prev + ITEMS_PER_BATCH, totalItems));
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, totalItems]);

  // Reset when total changes (e.g., switching sections)
  useEffect(() => {
    setVisibleCount(ITEMS_PER_BATCH);
  }, [totalItems]);

  return { visibleCount, sentinelRef };
}

// ── Main Component ──

export const BrowsePanel = forwardRef<HTMLDivElement, BrowsePanelProps>(function BrowsePanel(
  { collections, browseableStories, entities, onCollectionSelect, onStorySelect, onEntitySelect },
  ref
) {
  const [view, setView] = useState<BrowseView>('index');
  const [indexScrollTop, setIndexScrollTop] = useState(0);
  const indexRef = useRef<HTMLDivElement>(null);

  // ── Computed Data ──

  // Entity data with counts — computed once from full entity list
  const entityData: EntityWithCounts[] = useMemo(() => {
    return entities
      .filter(e => e.type !== 'concept')
      .map(entity => {
        const moments = getMomentsForEntity(entity.id);
        return {
          entity,
          momentCount: moments.length,
          storyCount: 0, // Not used in Browse
          maxNotability: moments.reduce((max, m) => Math.max(max, m.notability ?? 0), 0),
        };
      })
      .filter(e => e.momentCount > 0);
  }, [entities]);

  const personEntities = useMemo(
    () => entityData
      .filter(e => e.entity.type === 'person')
      .sort((a, b) => b.maxNotability - a.maxNotability),
    [entityData]
  );

  const placeEntities = useMemo(
    () => entityData
      .filter(e => e.entity.type === 'place')
      .sort((a, b) => b.momentCount - a.momentCount),
    [entityData]
  );

  const sortedStories = useMemo(
    () => [...browseableStories].sort((a, b) => {
      // Sort by max moment notability
      const aMax = Math.max(...(a.moments || []).map(() => 0), 0);
      const bMax = Math.max(...(b.moments || []).map(() => 0), 0);
      return bMax - aMax || a.name.localeCompare(b.name);
    }),
    [browseableStories]
  );

  // Collection moment counts
  const collectionMomentCounts = useMemo(() => {
    const map = new Map<string, number>();
    collections.forEach(c => map.set(c.id, c.momentIds.length));
    return map;
  }, [collections]);

  // ── See All Navigation ──

  const handleSeeAll = useCallback((target: BrowseView) => {
    // Save scroll position of index view
    if (indexRef.current) {
      setIndexScrollTop(indexRef.current.scrollTop);
    }
    setView(target);
  }, []);

  const handleBackToIndex = useCallback(() => {
    setView('index');
    // Restore scroll position on next frame
    requestAnimationFrame(() => {
      if (indexRef.current) {
        indexRef.current.scrollTop = indexScrollTop;
      }
    });
  }, [indexScrollTop]);

  // ── Infinite Scroll for See All views ──
  const collectionsScroll = useInfiniteScroll(collections.length);
  const peopleScroll = useInfiniteScroll(personEntities.length);
  const storiesScroll = useInfiniteScroll(sortedStories.length);
  const placesScroll = useInfiniteScroll(placeEntities.length);

  // ── Render ──

  if (view === 'all-collections') {
    return (
      <SeeAllView title="Collections" count={collections.length} onBack={handleBackToIndex}>
        <div className="grid grid-cols-2 gap-3">
          {collections.slice(0, collectionsScroll.visibleCount).map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              momentCount={collectionMomentCounts.get(collection.id) ?? 0}
              onClick={() => onCollectionSelect(collection)}
            />
          ))}
        </div>
        <div ref={collectionsScroll.sentinelRef} className="h-4" aria-live="polite" />
      </SeeAllView>
    );
  }

  if (view === 'all-people') {
    return (
      <SeeAllView title="People" count={personEntities.length} onBack={handleBackToIndex}>
        <div className="space-y-2">
          {personEntities.slice(0, peopleScroll.visibleCount).map(data => (
            <PersonCard key={data.entity.id} data={data} onClick={onEntitySelect} compact />
          ))}
        </div>
        <div ref={peopleScroll.sentinelRef} className="h-4" aria-live="polite" />
      </SeeAllView>
    );
  }

  if (view === 'all-stories') {
    return (
      <SeeAllView title="Stories" count={sortedStories.length} onBack={handleBackToIndex}>
        <div className="space-y-2">
          {sortedStories.slice(0, storiesScroll.visibleCount).map(story => (
            <StoryCard key={story.id} story={story} onClick={onStorySelect} compact />
          ))}
        </div>
        <div ref={storiesScroll.sentinelRef} className="h-4" aria-live="polite" />
      </SeeAllView>
    );
  }

  if (view === 'all-places') {
    return (
      <SeeAllView title="Places" count={placeEntities.length} onBack={handleBackToIndex}>
        <div className="space-y-2">
          {placeEntities.slice(0, placesScroll.visibleCount).map(data => (
            <PlaceRow key={data.entity.id} data={data} onClick={onEntitySelect} />
          ))}
        </div>
        <div ref={placesScroll.sentinelRef} className="h-4" aria-live="polite" />
      </SeeAllView>
    );
  }

  // ── Index View (default) ──
  return (
    <div ref={(el) => {
      // Forward ref + local ref
      (indexRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    }} className="flex-1 overflow-y-auto px-4 py-4 bg-[#131313]">
      {/* Collections — 2-column grid */}
      <BrowseSection
        title="Collections"
        subtitle="Curated lists of moments by theme"
        count={collections.length}
        onSeeAll={() => handleSeeAll('all-collections')}
      >
        <div className="grid grid-cols-2 gap-3">
          {collections.slice(0, PREVIEW_COUNT).map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              momentCount={collectionMomentCounts.get(collection.id) ?? 0}
              onClick={() => onCollectionSelect(collection)}
            />
          ))}
        </div>
      </BrowseSection>

      {/* People — compact vertical list */}
      <BrowseSection
        title="People"
        subtitle="Historical figures and their maps"
        count={personEntities.length}
        onSeeAll={() => handleSeeAll('all-people')}
      >
        <div className="space-y-2">
          {personEntities.slice(0, PREVIEW_COUNT).map(data => (
            <PersonCard key={data.entity.id} data={data} onClick={onEntitySelect} compact />
          ))}
        </div>
      </BrowseSection>

      {/* Stories — compact vertical list */}
      <BrowseSection
        title="Stories"
        subtitle="Narrative arcs spanning places"
        count={sortedStories.length}
        onSeeAll={() => handleSeeAll('all-stories')}
      >
        <div className="space-y-2">
          {sortedStories.slice(0, PREVIEW_COUNT).map(story => (
            <StoryCard key={story.id} story={story} onClick={onStorySelect} compact />
          ))}
        </div>
      </BrowseSection>

      {/* Places — compact list rows */}
      <BrowseSection
        title="Places"
        subtitle="Where history happened"
        count={placeEntities.length}
        onSeeAll={() => handleSeeAll('all-places')}
      >
        <div className="space-y-1">
          {placeEntities.slice(0, PREVIEW_COUNT).map(data => (
            <PlaceRow key={data.entity.id} data={data} onClick={onEntitySelect} />
          ))}
        </div>
      </BrowseSection>
    </div>
  );
});

// ── Place Row (compact list item for Places section) ──

function PlaceRow({ data, onClick }: { data: EntityWithCounts; onClick: (entity: Entity) => void }) {
  const { entity, momentCount } = data;
  const icon = getEntityIcon(entity);

  return (
    <button
      onClick={() => onClick(entity)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors text-left min-h-[44px]"
    >
      <span className="text-base shrink-0">{icon}</span>
      <span className="font-sans text-sm text-[var(--text-primary)] truncate flex-1">
        {entity.name}
      </span>
      <span className="font-mono text-xs text-[var(--text-muted)] shrink-0">
        {momentCount} {momentCount === 1 ? 'event' : 'events'}
      </span>
    </button>
  );
}
