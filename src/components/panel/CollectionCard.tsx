import type { StoryCollection } from '../../types';
import { isV2 } from '../../lib/theme';

interface CollectionCardProps {
  collection: StoryCollection;
  momentCount: number;
  onClick: (collection: StoryCollection) => void;
}

export function CollectionCard({ collection, momentCount, onClick }: CollectionCardProps) {
  const v2 = isV2();

  return (
    <button
      onClick={() => onClick(collection)}
      className={v2
        ? 'w-full text-left rounded-xl bg-[var(--bg-card)] p-5 transition-all duration-200 hover:bg-[var(--bg-card-hover)] active:scale-[0.97] group'
        : 'w-full text-left rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-hover)] bg-[var(--bg-card)] p-3.5 transition-all duration-200 hover:bg-[var(--bg-card-hover)] active:scale-[0.97] group'
      }
    >
      {/* Title with emoji icon */}
      <div className={v2 && collection.icon ? 'mb-2 flex items-start gap-3' : 'mb-2'}>
        {v2 && collection.icon && (
          <span className="text-2xl leading-none shrink-0 mt-0.5">{collection.icon}</span>
        )}
        <div>
        <h3 className={v2
          ? 'text-base font-serif font-bold text-[var(--text-primary)] leading-tight group-hover:text-[var(--text-primary)] transition-colors'
          : 'text-sm font-serif font-semibold text-[var(--text-primary)] leading-tight group-hover:text-[var(--text-primary)] transition-colors'
        }>
          {collection.name}
        </h3>
        <p className={v2
          ? 'text-xs text-[var(--text-secondary)] mt-1 leading-relaxed line-clamp-2 font-light'
          : 'text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug line-clamp-2'
        }>
          {collection.subtitle}
        </p>
        </div>
      </div>

      {/* Stats row */}
      <div className={v2 ? 'flex items-center gap-3 mt-3' : 'flex items-center gap-3 mt-2.5'}>
        <span className={v2
          ? 'text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider'
          : 'text-[10px] font-mono text-[var(--text-muted)]'
        }>
          {momentCount} {momentCount === 1 ? 'moment' : 'moments'}
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
