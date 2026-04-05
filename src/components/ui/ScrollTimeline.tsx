/**
 * ScrollTimeline — thin track with floating label showing position in a scrolling list.
 * Piggybacks on existing active index tracking (useScrollActiveIndex or scrollActiveId).
 * No scroll listeners of its own — purely renders based on activeIndex prop.
 */

export interface ScrollTimelineItem {
  label: string | null;
}

interface ScrollTimelineProps {
  items: ScrollTimelineItem[];
  activeIndex: number;
  orientation: 'horizontal' | 'vertical';
}

export function ScrollTimeline({ items, activeIndex, orientation }: ScrollTimelineProps) {
  if (items.length < 2) return null;

  const isHorizontal = orientation === 'horizontal';
  const pct = items.length > 1 ? (activeIndex / (items.length - 1)) * 100 : 0;
  const label = items[Math.max(0, Math.min(activeIndex, items.length - 1))]?.label;

  // Clamp label position to keep it visible at edges
  const clampedPct = Math.max(5, Math.min(95, pct));

  return (
    <div
      className={`relative ${isHorizontal ? 'mx-4 mt-1 h-5' : 'w-5 my-2'}`}
      aria-hidden="true"
    >
      {/* Track */}
      <div
        className={`absolute rounded-full ${
          isHorizontal
            ? 'left-0 right-0 top-[6px] h-[2px] bg-[var(--bg-overlay-hover)]'
            : 'top-0 bottom-0 left-[8px] w-[2px] bg-[var(--bg-overlay-hover)]'
        }`}
      />

      {/* Active dot */}
      <div
        className="absolute w-[6px] h-[6px] bg-[var(--text-muted)] rounded-full transition-all duration-200 ease-out"
        style={isHorizontal
          ? { left: `${pct}%`, top: '4px', transform: 'translateX(-50%)' }
          : { top: `${pct}%`, left: '6px', transform: 'translateY(-50%)' }
        }
      />

      {/* Floating label */}
      {label && (
        <div
          className="absolute transition-all duration-200 ease-out pointer-events-none"
          style={isHorizontal
            ? { left: `${clampedPct}%`, top: '12px', transform: 'translateX(-50%)' }
            : { top: `${clampedPct}%`, right: '18px', transform: 'translateY(-50%)' }
          }
        >
          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-primary)]/80 backdrop-blur-sm border border-[var(--border-subtle)] px-1.5 py-0.5 rounded whitespace-nowrap">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
