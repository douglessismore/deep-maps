import type { ReactNode } from 'react';


interface GoDeeperCardProps {
  label: string;
  sublabel: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'compact' | 'full-width';
  description?: string;
  badge?: { text: string; color: 'blue' | 'yellow' };
}

const BADGE_COLORS = {
  blue: 'bg-[rgba(96,165,250,0.12)] text-blue-400',
  yellow: 'bg-[rgba(234,179,8,0.12)] text-yellow-500',
};

export function GoDeeperCard({
  label,
  sublabel,
  icon,
  onClick,
  variant = 'compact',
  description,
  badge,
}: GoDeeperCardProps) {
  const isCompact = variant === 'compact';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex ${isCompact ? 'items-center' : 'items-start'} gap-2 ${
        isCompact
          ? 'shrink-0 max-w-[220px] bg-[var(--bg-primary)] px-3 py-2'
          : 'w-full bg-[var(--bg-card)] px-3 py-2.5 text-left'
      } hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] rounded-[10px] transition-all duration-200 active:scale-[0.97] group`}
    >
      <span className={`shrink-0 ${isCompact ? '' : 'mt-0.5'}`}>{icon}</span>
      <div className={`min-w-0 ${isCompact ? '' : 'flex-1'} text-left`}>
        <p className={`${isCompact ? 'text-xs' : 'text-sm'} font-serif font-semibold text-[var(--text-primary)] group-hover:text-[var(--text-primary)] truncate transition-colors leading-tight`}>
          {label}
        </p>
        <p className="text-[10px] font-mono text-[var(--text-muted)]">{sublabel}</p>
        {!isCompact && description && (
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}
      </div>
      {badge && (
        <span className={`shrink-0 text-[8px] font-mono px-1.5 py-0.5 rounded-full ${BADGE_COLORS[badge.color]}`}>
          {badge.text}
        </span>
      )}
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`shrink-0 ${isCompact ? '' : 'mt-1'} text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors`}>
        <path d="M3.5 2L7 5l-3.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

interface GoDeeperSectionProps {
  children: ReactNode;
  layout?: 'horizontal' | 'vertical';
}

export function GoDeeperSection({ children, layout = 'horizontal' }: GoDeeperSectionProps) {
  return (
    <div className="pt-2 border-t border-[var(--border-subtle)]">
      <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
        Dive Deeper
      </p>
      {layout === 'horizontal' ? (
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">{children}</div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  );
}
