import type { StoryCollection, Story } from '../../types';
import { CATEGORIES } from '../../lib/categories';

interface CollectionCardProps {
  collection: StoryCollection;
  stories: Story[]; // resolved stories for this collection
  onClick: (collection: StoryCollection) => void;
}

export function CollectionCard({ collection, stories, onClick }: CollectionCardProps) {
  // Gather unique categories for color dots
  const categorySet = new Set(stories.map(s => s.category));
  const locationCount = stories.reduce((sum, s) => sum + s.moments.length, 0);

  return (
    <button
      onClick={() => onClick(collection)}
      className="w-full text-left rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-hover)] bg-[var(--bg-card)] p-3.5 transition-all duration-200 hover:bg-[var(--bg-card-hover)] group"
    >
      {/* Icon + Title */}
      <div className="flex items-start gap-3 mb-2">
        <span className="text-2xl shrink-0 mt-0.5">{collection.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-serif font-semibold text-[var(--text-primary)] leading-tight group-hover:text-white transition-colors">
            {collection.name}
          </h3>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug line-clamp-2">
            {collection.subtitle}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mt-2.5">
        {/* Category dots */}
        <div className="flex items-center gap-1">
          {[...categorySet].map(cat => (
            <span
              key={cat}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: CATEGORIES[cat].color }}
              title={CATEGORIES[cat].label}
            />
          ))}
        </div>

        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          {stories.length} {stories.length === 1 ? 'story' : 'stories'}
        </span>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          {locationCount} {locationCount === 1 ? 'location' : 'locations'}
        </span>

        {/* Arrow */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors"
        >
          <path
            d="M4.5 2.5L8 6l-3.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
}
