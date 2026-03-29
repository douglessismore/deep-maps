import { useRef, useEffect, useState, useCallback } from 'react';
import type { Moment, StoryCategory } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { distanceMiles } from '../../lib/geo';

interface ContextStripProps {
  moments: Moment[];
  contextLabel: string;
  contextSublabel?: string;
  showClear?: boolean;
  onClear?: () => void;
  onCardTap?: (moment: Moment) => void;
  onScrollHighlight?: (moment: Moment) => void;
  userLocation?: { lat: number; lng: number } | null;
  /** Parent story category for color accent (optional) */
  categoryForMoment?: (momentId: string) => StoryCategory | undefined;
}

export function ContextStrip({
  moments,
  contextLabel,
  contextSublabel,
  showClear,
  onClear,
  onCardTap,
  onScrollHighlight,
  userLocation,
  categoryForMoment,
}: ContextStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isScrollDriving = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Track which card is centered
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>('[data-strip-card]');
    if (cards.length === 0) return;

    const containerCenter = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const dist = Math.abs(containerCenter - cardCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });

    if (closest !== activeIndex) {
      setActiveIndex(closest);
      const moment = moments[closest];
      if (moment && onScrollHighlight) {
        isScrollDriving.current = true;
        clearTimeout(scrollTimer.current);
        scrollTimer.current = setTimeout(() => { isScrollDriving.current = false; }, 600);
        onScrollHighlight(moment);
      }
    }
  }, [activeIndex, moments, onScrollHighlight]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Reset scroll when moments change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    setActiveIndex(0);
  }, [moments]);

  if (moments.length === 0) {
    return (
      <div className="px-4 py-3 border-b border-white/5">
        <div className="text-sm text-[var(--text-secondary)]">{contextLabel}</div>
        <div className="text-xs text-[var(--text-muted)] mt-1">No moments to show</div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#D4A853]/15" style={{ background: 'rgba(212,168,83,0.03)' }}>
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {contextLabel}
          </div>
          {contextSublabel && (
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{contextSublabel}</div>
          )}
        </div>
        {showClear && onClear && (
          <button
            onClick={onClear}
            className="text-xs text-[#D4A853] hover:text-[#D4A853]/80 shrink-0 ml-3"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Horizontal card strip */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-3 snap-x snap-mandatory"
        style={{ touchAction: 'manipulation', WebkitOverflowScrolling: 'touch' }}
      >
        {moments.map((moment, i) => {
          const cat = categoryForMoment?.(moment.id);
          const catColor = cat ? CATEGORIES[cat]?.color : undefined;
          const isActive = i === activeIndex;
          const year = moment.year ?? null;
          const dist = userLocation
            ? distanceMiles(userLocation.lat, userLocation.lng, moment.lat, moment.lng)
            : null;

          return (
            <button
              key={moment.id}
              data-strip-card
              onClick={() => onCardTap?.(moment)}
              className="snap-center shrink-0 text-left rounded-lg transition-all duration-200"
              style={{
                width: '180px',
                minHeight: '76px',
                background: isActive ? 'rgba(212,168,83,0.08)' : 'rgba(255,255,255,0.04)',
                border: isActive ? '1px solid rgba(212,168,83,0.3)' : '1px solid rgba(255,255,255,0.06)',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isActive ? '0 2px 12px rgba(212,168,83,0.12)' : 'none',
              }}
            >
              <div className="p-2.5">
                {/* Category accent bar */}
                {catColor && (
                  <div className="w-6 h-0.5 rounded-full mb-1.5" style={{ background: catColor }} />
                )}
                <div className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 leading-tight">
                  {moment.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-[var(--text-muted)]">
                  {year != null && <span>{year}</span>}
                  {dist !== null && <span>· {dist < 1 ? `${(dist * 5280).toFixed(0)} ft` : `${dist.toFixed(1)} mi`}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
