import type { StoryCollection } from '../../types';

interface CollectionCardProps {
  collection: StoryCollection;
  momentCount: number;
  onClick: (collection: StoryCollection) => void;
}

export function CollectionCard({ collection, momentCount, onClick }: CollectionCardProps) {
  return (
    <button
      onClick={() => onClick(collection)}
      className="w-full text-left rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-hover)] bg-[var(--bg-card)] p-3.5 transition-all duration-200 hover:bg-[var(--bg-card-hover)] group"
    >
      {/* Title */}
      <div className="mb-2">
        <h3 className="text-sm font-sans font-semibold text-[var(--text-primary)] leading-tight group-hover:text-white transition-colors">
          {collection.name}
        </h3>
        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug line-clamp-2">
          {collection.subtitle}
        </p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 mt-2.5">
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          {momentCount} {momentCount === 1 ? 'location' : 'locations'}
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
