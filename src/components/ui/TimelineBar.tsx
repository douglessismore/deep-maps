import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Story, StoryCategory } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import {
  getTimelinePoints,
  getDataRange,
  getTickYears,
  formatYear,
  type TimelinePoint,
} from '../../lib/timeline';

interface TimelineBarProps {
  stories: Story[];
  categoryFilter: StoryCategory | null;
  onStorySelect: (story: Story) => void;
  onViewRangeChange: (range: [number, number] | null) => void;
}

const BAR_HEIGHT = 68;
const DOT_Y = 20;
const LABEL_Y = 44;
const SLIDER_Y = 56; // center of the slider track
const SLIDER_TRACK_H = 6;
const DOT_RADIUS = 3.5;
const DOT_HOVER_RADIUS = 5.5;
const HANDLE_W = 8;
const HANDLE_H = 14;
const HANDLE_HIT = 20;
const MIN_VIEW_SPAN = 20;
const ZOOM_FACTOR = 1.4;

type DragState = 'none' | 'pan' | 'handle-left' | 'handle-right';

export function TimelineBar({
  stories,
  categoryFilter,
  onStorySelect,
  onViewRangeChange,
}: TimelineBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const allPoints = useMemo(() => getTimelinePoints(stories), [stories]);
  const fullRange = useMemo(() => getDataRange(allPoints), [allPoints]);
  const fullSpan = fullRange[1] - fullRange[0];

  // View range — ref + state combo for responsive zoom
  const [viewRange, setViewRange] = useState<[number, number]>(fullRange);
  const viewRangeRef = useRef<[number, number]>(fullRange);
  const setViewRangeBoth = useCallback(
    (range: [number, number]) => {
      viewRangeRef.current = range;
      setViewRange(range);
      // Notify parent: null when at full range, otherwise the range
      const atFull = range[0] <= fullRange[0] + 1 && range[1] >= fullRange[1] - 1;
      onViewRangeChange(atFull ? null : range);
    },
    [fullRange, onViewRangeChange]
  );
  const isZoomed = viewRange[0] > fullRange[0] + 1 || viewRange[1] < fullRange[1] - 1;

  useEffect(() => {
    viewRangeRef.current = fullRange;
    setViewRange(fullRange);
  }, [fullRange]);

  // Interaction state
  const [dragState, setDragState] = useState<DragState>('none');
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, viewRange: [0, 0] as [number, number] });

  const visiblePoints = useMemo(() => {
    if (!categoryFilter) return allPoints;
    return allPoints.filter((p) => p.category === categoryFilter);
  }, [allPoints, categoryFilter]);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Coordinate transforms (view range → screen)
  const yearToX = useCallback(
    (year: number) => {
      if (containerWidth === 0) return 0;
      return ((year - viewRange[0]) / (viewRange[1] - viewRange[0])) * containerWidth;
    },
    [viewRange, containerWidth]
  );

  // Full range → screen (for the slider track)
  const fullYearToX = useCallback(
    (year: number) => {
      if (containerWidth === 0 || fullSpan === 0) return 0;
      return ((year - fullRange[0]) / fullSpan) * containerWidth;
    },
    [fullRange, fullSpan, containerWidth]
  );

  const fullXToYear = useCallback(
    (x: number) => {
      if (containerWidth === 0) return fullRange[0];
      return fullRange[0] + (x / containerWidth) * fullSpan;
    },
    [fullRange, fullSpan, containerWidth]
  );

  const clampViewRange = useCallback(
    (start: number, end: number): [number, number] => {
      let span = end - start;
      if (span < MIN_VIEW_SPAN) {
        const center = (start + end) / 2;
        start = center - MIN_VIEW_SPAN / 2;
        end = center + MIN_VIEW_SPAN / 2;
        span = MIN_VIEW_SPAN;
      }
      if (span > fullSpan) return [...fullRange] as [number, number];
      if (start < fullRange[0]) { start = fullRange[0]; end = start + span; }
      if (end > fullRange[1]) { end = fullRange[1]; start = end - span; }
      return [start, end];
    },
    [fullRange, fullSpan]
  );

  // Wheel zoom — ref-based to avoid stale closure
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const w = el.clientWidth;
      if (w === 0) return;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const vr = viewRangeRef.current;
      const mouseYear = vr[0] + (mouseX / w) * (vr[1] - vr[0]);
      const zoomDir = e.deltaY > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const currentSpan = vr[1] - vr[0];
      const newSpan = currentSpan * zoomDir;
      const mouseRatio = (mouseYear - vr[0]) / currentSpan;
      setViewRangeBoth(clampViewRange(mouseYear - mouseRatio * newSpan, mouseYear - mouseRatio * newSpan + newSpan));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clampViewRange, setViewRangeBoth]);

  // Pinch zoom (touch)
  const lastPinchRef = useRef<{ dist: number; center: number } | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        lastPinchRef.current = {
          dist: Math.abs(e.touches[0].clientX - e.touches[1].clientX),
          center: ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left,
        };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastPinchRef.current) {
        e.preventDefault();
        const w = el.clientWidth;
        if (w === 0) return;
        const rect = el.getBoundingClientRect();
        const newDist = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
        const newCenter = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
        const vr = viewRangeRef.current;
        const scale = lastPinchRef.current.dist / Math.max(newDist, 1);
        const centerYear = vr[0] + (newCenter / w) * (vr[1] - vr[0]);
        const currentSpan = vr[1] - vr[0];
        const newSpan = currentSpan * scale;
        const centerRatio = (centerYear - vr[0]) / currentSpan;
        setViewRangeBoth(clampViewRange(centerYear - centerRatio * newSpan, centerYear - centerRatio * newSpan + newSpan));
        lastPinchRef.current = { dist: newDist, center: newCenter };
      }
    };
    const onTouchEnd = () => { lastPinchRef.current = null; };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => { el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchmove', onTouchMove); el.removeEventListener('touchend', onTouchEnd); };
  }, [clampViewRange, setViewRangeBoth]);

  // Pointer handlers
  const getPointerX = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return e.clientX - rect.left;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const x = getPointerX(e);
    const y = e.clientY - containerRef.current!.getBoundingClientRect().top;

    // Slider area: check if clicking a handle
    if (y > SLIDER_Y - HANDLE_H && containerWidth > 0) {
      const leftHandleX = fullYearToX(viewRange[0]);
      const rightHandleX = fullYearToX(viewRange[1]);
      if (Math.abs(x - leftHandleX) < HANDLE_HIT) {
        setDragState('handle-left');
        dragStartRef.current = { x, viewRange: [...viewRange] as [number, number] };
        (e.target as Element).setPointerCapture(e.pointerId);
        return;
      }
      if (Math.abs(x - rightHandleX) < HANDLE_HIT) {
        setDragState('handle-right');
        dragStartRef.current = { x, viewRange: [...viewRange] as [number, number] };
        (e.target as Element).setPointerCapture(e.pointerId);
        return;
      }
      // Click on slider track → jump to that position (center view there)
      if (y > SLIDER_Y - SLIDER_TRACK_H) {
        const clickYear = fullXToYear(x);
        const span = viewRange[1] - viewRange[0];
        setViewRangeBoth(clampViewRange(clickYear - span / 2, clickYear + span / 2));
        return;
      }
    }

    // Dot area: check dot clicks
    for (const pt of visiblePoints) {
      const dotX = yearToX(pt.startYear);
      if (Math.abs(x - dotX) < 10 && Math.abs(y - DOT_Y) < 12) {
        const story = stories.find((s) => s.id === pt.storyId);
        if (story) { onStorySelect(story); return; }
      }
    }

    // Pan (only when zoomed)
    if (isZoomed) {
      setDragState('pan');
      dragStartRef.current = { x, viewRange: [...viewRange] as [number, number] };
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const x = getPointerX(e);

    if (dragState === 'none') {
      // Hover detection on dots
      const y = e.clientY - containerRef.current!.getBoundingClientRect().top;
      if (y < SLIDER_Y - HANDLE_H) {
        let closest: string | null = null;
        let closestDist = 12;
        for (const pt of visiblePoints) {
          const dotX = yearToX(pt.startYear);
          const dist = Math.abs(x - dotX);
          if (dist < closestDist) { closestDist = dist; closest = pt.storyId; }
        }
        setHoveredPoint(closest);
      } else {
        setHoveredPoint(null);
      }
      return;
    }

    if (dragState === 'pan') {
      const deltaX = x - dragStartRef.current.x;
      const span = viewRange[1] - viewRange[0];
      const deltaYears = (deltaX / containerWidth) * span;
      const orig = dragStartRef.current.viewRange;
      setViewRangeBoth(clampViewRange(orig[0] - deltaYears, orig[1] - deltaYears));
    } else if (dragState === 'handle-left') {
      const year = fullXToYear(x);
      const clamped = Math.min(year, viewRange[1] - MIN_VIEW_SPAN);
      setViewRangeBoth(clampViewRange(clamped, viewRange[1]));
    } else if (dragState === 'handle-right') {
      const year = fullXToYear(x);
      const clamped = Math.max(year, viewRange[0] + MIN_VIEW_SPAN);
      setViewRangeBoth(clampViewRange(viewRange[0], clamped));
    }
  };

  const handlePointerUp = () => setDragState('none');

  const handleResetZoom = () => setViewRangeBoth([...fullRange] as [number, number]);

  const ticks = useMemo(() => getTickYears(viewRange[0], viewRange[1]), [viewRange]);

  const hoveredData = hoveredPoint ? visiblePoints.find((p) => p.storyId === hoveredPoint) : null;

  if (containerWidth === 0) {
    return <div ref={containerRef} className="shrink-0 bg-[var(--bg-card)] border-y border-[var(--border-subtle)]" style={{ height: BAR_HEIGHT }} />;
  }

  // Slider handle positions (in full-range coordinates)
  const sliderLeftX = fullYearToX(viewRange[0]);
  const sliderRightX = fullYearToX(viewRange[1]);

  return (
    <div
      ref={containerRef}
      className="shrink-0 relative select-none"
      style={{
        height: BAR_HEIGHT,
        touchAction: 'none',
        background: 'linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.98) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <svg
        width={containerWidth}
        height={BAR_HEIGHT}
        className="block"
        style={{ cursor: dragState === 'pan' ? 'grabbing' : isZoomed ? 'grab' : 'default' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { if (dragState === 'none') setHoveredPoint(null); }}
      >
        {/* Story range bars when zoomed in */}
        {viewRange[1] - viewRange[0] < 500 &&
          visiblePoints
            .filter((pt) => pt.endYear - pt.startYear > 0)
            .map((pt) => (
              <line
                key={`range-${pt.storyId}`}
                x1={yearToX(pt.startYear)} y1={DOT_Y}
                x2={yearToX(pt.endYear)} y2={DOT_Y}
                stroke={CATEGORIES[pt.category].color}
                strokeWidth={1.5} opacity={0.3} strokeLinecap="round"
              />
            ))}

        {/* Dots */}
        {visiblePoints.map((pt) => {
          const cx = yearToX(pt.startYear);
          if (cx < -10 || cx > containerWidth + 10) return null;
          const isHovered = hoveredPoint === pt.storyId;
          const r = isHovered ? DOT_HOVER_RADIUS : DOT_RADIUS;
          return (
            <g key={pt.storyId}>
              {isHovered && (
                <circle cx={cx} cy={DOT_Y} r={r + 4} fill="none"
                  stroke={CATEGORIES[pt.category].color} strokeWidth={1} opacity={0.4} />
              )}
              <circle cx={cx} cy={DOT_Y} r={r}
                fill={CATEGORIES[pt.category].color} opacity={0.9}
                style={{ transition: 'r 0.15s' }} />
            </g>
          );
        })}

        {/* Tick labels */}
        {ticks.map((year) => {
          const x = yearToX(year);
          if (x < 25 || x > containerWidth - 25) return null;
          return (
            <g key={`tick-${year}`}>
              <line x1={x} y1={DOT_Y + 10} x2={x} y2={DOT_Y + 14}
                stroke="var(--text-muted)" strokeWidth={0.5} opacity={0.3} />
              <text x={x} y={LABEL_Y} textAnchor="middle" fill="var(--text-muted)"
                fontSize={9} fontFamily="var(--font-mono, monospace)" opacity={0.5}>
                {formatYear(year)}
              </text>
            </g>
          );
        })}

        {/* ── Range slider track ── */}
        {/* Full track */}
        <rect x={0} y={SLIDER_Y - SLIDER_TRACK_H / 2} width={containerWidth} height={SLIDER_TRACK_H}
          rx={3} fill="rgba(255,255,255,0.06)" />
        {/* Active range highlight */}
        <rect
          x={sliderLeftX} y={SLIDER_Y - SLIDER_TRACK_H / 2}
          width={Math.max(0, sliderRightX - sliderLeftX)} height={SLIDER_TRACK_H}
          rx={3} fill="rgba(255,255,255,0.2)"
        />
        {/* Left handle */}
        <rect x={sliderLeftX - HANDLE_W / 2} y={SLIDER_Y - HANDLE_H / 2}
          width={HANDLE_W} height={HANDLE_H} rx={3}
          fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.9)" strokeWidth={0.5}
          style={{ cursor: 'ew-resize' }} />
        {/* Right handle */}
        <rect x={sliderRightX - HANDLE_W / 2} y={SLIDER_Y - HANDLE_H / 2}
          width={HANDLE_W} height={HANDLE_H} rx={3}
          fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.9)" strokeWidth={0.5}
          style={{ cursor: 'ew-resize' }} />

        {/* Slider range year labels */}
        {isZoomed && (
          <>
            <text x={sliderLeftX} y={SLIDER_Y + HANDLE_H / 2 + 9} textAnchor="middle"
              fill="var(--text-muted)" fontSize={8} fontFamily="var(--font-mono, monospace)" opacity={0.6}>
              {formatYear(Math.round(viewRange[0]))}
            </text>
            <text x={sliderRightX} y={SLIDER_Y + HANDLE_H / 2 + 9} textAnchor="middle"
              fill="var(--text-muted)" fontSize={8} fontFamily="var(--font-mono, monospace)" opacity={0.6}>
              {formatYear(Math.round(viewRange[1]))}
            </text>
          </>
        )}
      </svg>

      {/* Tooltip — rendered as HTML div above the SVG for no clipping */}
      {hoveredData && (
        <TooltipOverlay point={hoveredData} x={yearToX(hoveredData.startYear)} containerWidth={containerWidth} />
      )}

      {/* Reset button */}
      {isZoomed && (
        <button
          onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
          className="absolute top-1 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-[var(--text-muted)] hover:text-white hover:bg-[rgba(255,255,255,0.15)] transition-colors"
          title="Reset zoom"
        >
          Reset
        </button>
      )}

      {/* Hint text */}
      {!isZoomed && visiblePoints.length > 0 && (
        <div className="absolute top-1 right-2 text-[9px] font-mono text-[var(--text-muted)] opacity-40 pointer-events-none">
          scroll to zoom · drag handles to filter
        </div>
      )}
    </div>
  );
}

/** Tooltip as HTML overlay — no SVG clipping */
function TooltipOverlay({
  point,
  x,
  containerWidth,
}: {
  point: TimelinePoint;
  x: number;
  containerWidth: number;
}) {
  const years =
    point.startYear === point.endYear
      ? formatYear(point.startYear)
      : `${formatYear(point.startYear)}–${formatYear(point.endYear)}`;

  // Clamp position
  const left = Math.max(8, Math.min(x, containerWidth - 8));

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left,
        bottom: BAR_HEIGHT - DOT_Y + DOT_HOVER_RADIUS + 6,
        transform: 'translateX(-50%)',
        zIndex: 10,
      }}
    >
      <div
        className="px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap"
        style={{
          background: 'rgba(15,15,15,0.95)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ color: CATEGORIES[point.category].color, fontWeight: 500 }}>
          {point.name}
        </span>
        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
          {years}
        </span>
      </div>
    </div>
  );
}
