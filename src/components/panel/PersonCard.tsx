import type { Entity } from '../../types';
import { getInitial, type EntityWithCounts } from '../../lib/entityHelpers';

interface PersonCardProps {
  data: EntityWithCounts;
  onClick: (entity: Entity) => void;
  compact?: boolean;
  distanceMi?: number;
}

export function PersonCard({ data, onClick, compact = false, distanceMi }: PersonCardProps) {
  const { entity, momentCount, storyCount } = data;

  return (
    <button
      onClick={() => onClick(entity)}
      className="w-full text-left group"
    >
      <div className="bg-[var(--bg-card)] rounded-lg overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all duration-200 hover:shadow-lg hover:shadow-black/20 active:scale-[0.97]">
        {/* Purple accent bar */}
        <div className="h-0.5 bg-[rgba(139,92,246,0.6)]" />

        <div className={compact ? 'p-3' : 'p-4'}>
          {/* Header — avatar + name + years */}
          <div className="flex items-start gap-2.5 mb-1">
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-[rgba(139,92,246,0.12)] ring-1 ring-[rgba(139,92,246,0.3)] mt-0.5">
              <span className="text-[11px] font-sans font-bold text-[rgba(139,92,246,0.8)]">
                {getInitial(entity.name)}
              </span>
            </span>
            <div className="flex-1 min-w-0">
              <h3 className={`font-sans font-semibold text-[var(--text-primary)] group-hover:text-white transition-colors ${compact ? 'text-sm' : 'text-base'}`}>
                {entity.name}
              </h3>
            </div>
            {entity.years && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                {entity.years}
              </span>
            )}
          </div>

          {/* Description */}
          {entity.description && (
            <p className={`text-[var(--text-secondary)] leading-relaxed mt-2 ${compact ? 'text-xs line-clamp-1' : 'text-sm line-clamp-3'}`}>
              {entity.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 gap-2">
            <span className="text-[10px] font-mono text-[rgba(139,92,246,0.7)] px-1.5 py-0.5 rounded bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.15)]">
              Person
            </span>
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
                {momentCount} {momentCount === 1 ? 'moment' : 'moments'}
              </span>
              {storyCount > 0 && (
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {storyCount} {storyCount === 1 ? 'story' : 'stories'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
