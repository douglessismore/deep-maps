import type { Entity } from '../../types';

interface PersonChipProps {
  entity: Entity;
  momentCount: number;
  isActive: boolean;
  onClick: (entity: Entity) => void;
}

export function PersonChip({ entity, momentCount, isActive, onClick }: PersonChipProps) {
  return (
    <button
      onClick={() => onClick(entity)}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-sans whitespace-nowrap transition-all duration-200 ${
        isActive
          ? 'bg-[var(--accent-red)] text-white font-semibold shadow-md'
          : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
      }`}
    >
      {entity.name}
      <span className={`ml-1 text-[10px] ${isActive ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
        · {momentCount}
      </span>
    </button>
  );
}
