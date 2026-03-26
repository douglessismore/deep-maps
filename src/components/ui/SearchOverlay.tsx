import { useMemo, useRef, useEffect } from 'react';
import type { Story, Entity, Moment, StoryCollection } from '../../types';
import { useAppData } from '../../lib/data/provider';
import { CATEGORIES } from '../../lib/categories';
import { canonicalStoryIds } from '../../lib/entityHelpers';

interface SearchOverlayProps {
  query: string;
  onStorySelect: (story: Story) => void;
  onEntitySelect: (entity: Entity) => void;
  onCollectionSelect: (collection: StoryCollection) => void;
  onMomentSelect: (moment: Moment) => void;
  onClose: () => void;
}

const MAX_PER_GROUP = 5;

/** Case-insensitive match against multiple fields */
function matches(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.toLowerCase();
  return fields.some(f => f?.toLowerCase().includes(q));
}

/** Get entity type label for display */
function entityGroupLabel(type: Entity['type']): string {
  switch (type) {
    case 'person': return 'People';
    case 'place': return 'Places';
    case 'organization': return 'Organizations';
    case 'concept': return 'Concepts';
    case 'work': return 'Works';
    default: return 'Entities';
  }
}

/** Icon for entity type */
function EntityIcon({ type }: { type: Entity['type'] }) {
  switch (type) {
    case 'person':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2.5 12.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case 'place':
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <path d="M7 1.5C4.5 1.5 2.5 3.5 2.5 6c0 3.5 4.5 6.5 4.5 6.5s4.5-3 4.5-6.5c0-2.5-2-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="7" cy="6" r="1.5" stroke="currentColor" strokeWidth="1" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
          <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
  }
}

export function SearchOverlay({
  query,
  onStorySelect,
  onEntitySelect,
  onCollectionSelect,
  onMomentSelect,
  onClose,
}: SearchOverlayProps) {
  const { stories, entities, moments, collections } = useAppData();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const trimmed = query.trim();

  const results = useMemo(() => {
    if (trimmed.length < 2) return null;

    const matchedStories = stories
      .filter(s => s.storyType !== 'biography' && !canonicalStoryIds.has(s.id))
      .filter(s => matches(trimmed, s.name, s.nickname, s.description, ...s.tags))
      .slice(0, MAX_PER_GROUP);

    const matchedEntities = entities
      .filter(e => matches(trimmed, e.name, e.description, e.years))
      .slice(0, MAX_PER_GROUP);

    const matchedMoments = moments
      .filter(m => matches(trimmed, m.name, m.subtitle, m.description))
      .slice(0, MAX_PER_GROUP);

    const matchedCollections = collections
      .filter(c => matches(trimmed, c.name, c.subtitle, c.description, ...c.tags))
      .slice(0, MAX_PER_GROUP);

    const totalCount = matchedStories.length + matchedEntities.length +
      matchedMoments.length + matchedCollections.length;

    return { matchedStories, matchedEntities, matchedMoments, matchedCollections, totalCount };
  }, [trimmed, stories, entities, moments, collections]);

  if (!results) return null;

  if (results.totalCount === 0) {
    return (
      <div
        ref={overlayRef}
        className="absolute top-full right-0 mt-1 w-[min(85vw,360px)] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg shadow-xl shadow-black/40 z-50 p-4 max-h-[60vh] overflow-y-auto overscroll-contain"
      >
        <p className="text-sm text-[var(--text-muted)] font-mono text-center">
          No results for "{trimmed}"
        </p>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="absolute top-full right-0 mt-1 w-[min(85vw,360px)] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg shadow-xl shadow-black/40 z-50 max-h-[60vh] overflow-y-auto overscroll-contain"
    >
      {/* Stories */}
      {results.matchedStories.length > 0 && (
        <ResultGroup label="Stories">
          {results.matchedStories.map(story => (
            <ResultRow
              key={story.id}
              onClick={() => { onStorySelect(story); onClose(); }}
              icon={
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORIES[story.category]?.color ?? '#888' }}
                />
              }
              title={story.name}
              subtitle={story.nickname || story.years}
            />
          ))}
        </ResultGroup>
      )}

      {/* Entities — grouped by type label */}
      {results.matchedEntities.length > 0 && (
        <ResultGroup label={entityGroupLabel(results.matchedEntities[0].type)}>
          {results.matchedEntities.map(entity => (
            <ResultRow
              key={entity.id}
              onClick={() => { onEntitySelect(entity); onClose(); }}
              icon={<EntityIcon type={entity.type} />}
              title={entity.name}
              subtitle={entity.years || entity.type}
            />
          ))}
        </ResultGroup>
      )}

      {/* Moments */}
      {results.matchedMoments.length > 0 && (
        <ResultGroup label="Moments">
          {results.matchedMoments.map(moment => (
            <ResultRow
              key={moment.id}
              onClick={() => { onMomentSelect(moment); onClose(); }}
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <path d="M7 1.5C4.5 1.5 2.5 3.5 2.5 6c0 3.5 4.5 6.5 4.5 6.5s4.5-3 4.5-6.5c0-2.5-2-4.5-4.5-4.5z" fill="var(--accent-red)" opacity="0.6" />
                  <circle cx="7" cy="6" r="1.5" fill="var(--bg-primary)" />
                </svg>
              }
              title={moment.name}
              subtitle={moment.subtitle}
            />
          ))}
        </ResultGroup>
      )}

      {/* Collections */}
      {results.matchedCollections.length > 0 && (
        <ResultGroup label="Collections">
          {results.matchedCollections.map(collection => (
            <ResultRow
              key={collection.id}
              onClick={() => { onCollectionSelect(collection); onClose(); }}
              icon={
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="3" y="1.5" width="8" height="2" rx="0.75" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
                </svg>
              }
              title={collection.name}
              subtitle={`${collection.momentIds.length} moments`}
            />
          ))}
        </ResultGroup>
      )}
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[var(--border-subtle)] last:border-b-0">
      <div className="px-3 pt-2.5 pb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  onClick,
  icon,
  title,
  subtitle,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
    >
      <span className="text-[var(--text-muted)]">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--text-primary)] truncate leading-tight">{title}</div>
        {subtitle && (
          <div className="text-[11px] text-[var(--text-muted)] font-mono truncate leading-tight mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </button>
  );
}
