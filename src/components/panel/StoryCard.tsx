import type { Story } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { CategoryBadge } from '../ui/CategoryBadge';

interface StoryCardProps {
  story: Story;
  onClick: (story: Story) => void;
  compact?: boolean;
}

export function StoryCard({ story, onClick, compact = false }: StoryCardProps) {
  const cat = CATEGORIES[story.category];
  const locationCount = story.locations.length;

  return (
    <button
      onClick={() => onClick(story)}
      className="w-full text-left group"
    >
      <div
        className="bg-[var(--bg-card)] rounded-lg overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
      >
        {/* Category color bar */}
        <div className="h-0.5" style={{ backgroundColor: cat.color }} />

        <div className={compact ? 'p-3' : 'p-4'}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className={`font-serif font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors ${compact ? 'text-sm' : 'text-base'}`}>
                {story.name}
              </h3>
              {story.nickname && !compact && (
                <p className="text-xs text-[var(--text-muted)] font-mono italic mt-0.5">
                  {story.nickname}
                </p>
              )}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
              {story.years}
            </span>
          </div>

          {/* Description */}
          {!compact && (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-2 line-clamp-3">
              {story.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 gap-2">
            <CategoryBadge category={story.category} />
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              {locationCount} {locationCount === 1 ? 'location' : 'locations'}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
