import type { Story } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { CategoryBadge } from '../ui/CategoryBadge';
import { isV2 } from '../../lib/theme';

interface StoryCardProps {
  story: Story;
  onClick: (story: Story) => void;
  compact?: boolean;
  distanceMi?: number; // Distance in miles from user location
}

export function StoryCard({ story, onClick, compact = false, distanceMi }: StoryCardProps) {
  const cat = CATEGORIES[story.category];
  const locationCount = story.moments.length;
  const v2 = isV2();

  return (
    <button
      onClick={() => onClick(story)}
      className="w-full text-left group"
    >
      <div
        className={v2
          ? 'bg-[var(--bg-card)] rounded-xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--bg-card-hover)] active:scale-[0.97]'
          : 'bg-[var(--bg-card)] rounded-[14px] overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-lg hover:shadow-black/30 active:scale-[0.97]'
        }
      >
        {/* Hero image */}
        {story.imageUrl && !compact && (
          <div className="relative w-full h-32 overflow-hidden">
            <img
              src={story.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
            {/* Category color bar overlaid on image bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: cat.color }} />
          </div>
        )}
        {/* Category color bar — only when no image */}
        {(!story.imageUrl || compact) && (
          <div className={v2 ? 'h-1' : 'h-[3px]'} style={{ backgroundColor: cat.color }} />
        )}

        <div className={compact ? 'p-3' : (v2 ? 'p-5' : 'p-4')}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              {v2 && !compact && (
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase mb-1 block" style={{ color: cat.color }}>
                  {cat.label}
                </span>
              )}
              <h3 className={v2
                ? `font-serif font-bold text-white group-hover:text-white transition-colors leading-tight ${compact ? 'text-sm' : 'text-lg'}`
                : `font-serif font-bold text-white group-hover:text-white transition-colors leading-[1.3] ${compact ? 'text-sm' : 'text-[16px]'}`
              }>
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
          <p className={v2
            ? `text-[var(--text-secondary)] leading-relaxed mt-2 font-light ${compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'}`
            : `text-[var(--text-secondary)] leading-[1.5] mt-2 ${compact ? 'text-xs line-clamp-1' : 'text-[13px] line-clamp-2'}`
          }>
            {story.description}
          </p>

          {/* Footer */}
          <div className={v2 ? 'flex items-center justify-between mt-4 gap-2' : 'flex items-center justify-between mt-3 gap-2'}>
            <div className="flex items-center gap-2">
              {!v2 && <CategoryBadge category={story.category} />}
              {story.storyType && story.storyType !== 'incident' && (
                <span className={v2
                  ? 'text-[10px] font-mono text-[var(--text-muted)] capitalize tracking-wider uppercase'
                  : 'text-[10px] font-mono text-[var(--text-muted)] capitalize'
                }>
                  {story.storyType}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {typeof distanceMi === 'number' && (
                <span className="text-[10px] text-blue-400 font-mono">
                  {distanceMi < 1
                    ? '< 1 mi'
                    : distanceMi < 100
                    ? `${Math.round(distanceMi)} mi`
                    : `${Math.round(distanceMi).toLocaleString()} mi`}
                </span>
              )}
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {locationCount} {locationCount === 1 ? 'moment' : 'moments'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
