import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Story, StoryCategory } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import {
  getTimelinePoints,
  getDataRange,
  getDenseRange,
  getTickYears,
  formatYear,
  type TimelinePoint,
} from '../../lib/timeline';

interface TimelineBarProps {
  stories: Story[];
  categoryFilter: StoryCategory | null;
  onStorySelect: (story: Story) => void;
  onViewRangeChange: (range: [number, number] | null) => void;
  highlightedStoryId?: string | null;
}

const BAR_HEIGHT = 72;
const DOT_Y = 22;
const LABEL_Y = 46;
const SLIDER_Y = 60;
const SLIDER_TRACK_H = 6;
const DOT_RADIUS = 3.5;
const DOT_HOVER_RADIUS = 5.5;
const MIN_SPAN = 20;

type DragState = 'none' | 'pan';

const ERAS = [
  { label: 'Origins', start: -25000, end: -3000 },
  { label: 'Ancient', start: -3000, end: 500 },
  { label: 'Medieval', start: 500, end: 1500 },
  { label: 'Early Modern', start: 1500, end: 1800 },
  { label: 'Industrial', start: 1800, end: 1914 },
  { label: '20th Century', start: 1914, end: 2000 },
  { label: 'Now', start: 2000, end: 2030 },
] as const;

export function TimelineBar({
  stories,
  categoryFilter,
  onStorySelect,
  onViewRangeChange,
  highlightedStoryId,
}: TimelineBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const isMobile = containerWidth > 0 && containerWidth < 640;

  const allPoints = useMemo(() => getTimelinePoints(stories), [stories]);
  const fullRange = useMemo(() => getDataRange(allPoints), [allPoints]);
  const fullSpan = fullRange[1] - fullRange[0];
  const initialRange = useMemo(() => getDenseRange(allPoints), [allPoints]);

  // ── View range: what dots are visible. Also filters map+stories when hasInteracted. ──
  const [viewRange, setViewRange] = useState<[number, number]>(initialRange);
  const viewRangeRef = useRef<[number, number]>(initialRange);

  // ── Interaction flag: no filtering until user intentionally zooms/pans ──
  const hasInteractedRef = useRef(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [activeEra, setActiveEra] = useState<string | null>(null);

  const markInteracted = useCallback(() => {
    setActiveEra(null); // Manual interaction clears era preset
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
  }, []);

  const setViewRangeBoth = useCallback(
    (range: [number, number]) => {
      viewRangeRef.current = range;
      setViewRange(range);
      if (hasInteractedRef.current) {
        // If view encompasses nearly the full range, treat as no filter
        const coversAll = range[0] <= fullRange[0] + 5 && range[1] >= fullRange[1] - 5;
        onViewRangeChange(coversAll ? null : range);
      }
    },
    [onViewRangeChange, fullRange]
  );

  // Reset on data change
  useEffect(() => {
    const dr = getDenseRange(allPoints);
    viewRangeRef.current = dr;
    setViewRange(dr);
    hasInteractedRef.current = false;
    setHasInteracted(false);
    onViewRangeChange(null);
  }, [allPoints, onViewRangeChange]);

  const canPan = viewRange[0] > fullRange[0] + 1 || viewRange[1] < fullRange[1] - 1;
  const showReset = hasInteracted;

  // Interaction state
  const [dragState, setDragState] = useState<DragState>('none');
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, viewRange: [0, 0] as [number, number] });

  const visiblePoints = useMemo(() => {
    if (!categoryFilter) return allPoints;
    return allPoints.filter((p) => p.category === categoryFilter);
  }, [allPoints, categoryFilter]);

  // Dots outside the current view (for "← N ancient" indicators)
  const { leftOutCount, rightOutCount } = useMemo(() => {
    let left = 0;
    let right = 0;
    for (const pt of visiblePoints) {
      if (pt.startYear < viewRange[0]) left++;
      if (pt.startYear > viewRange[1]) right++;
    }
    return { leftOutCount: left, rightOutCount: right };
  }, [visiblePoints, viewRange]);

  // ── Measure container ──
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

  // ── Coordinate transforms ──
  const yearToX = useCallback(
    (year: number) => {
      if (containerWidth === 0) return 0;
      return ((year - viewRange[0]) / (viewRange[1] - viewRange[0])) * containerWidth;
    },
    [viewRange, containerWidth]
  );

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
      if (span < MIN_SPAN) {
        const center = (start + end) / 2;
        start = center - MIN_SPAN / 2;
        end = center + MIN_SPAN / 2;
        span = MIN_SPAN;
      }
      if (span > fullSpan) return [...fullRange] as [number, number];
      if (start < fullRange[0]) {
        start = fullRange[0];
        end = start + span;
      }
      if (end > fullRange[1]) {
        end = fullRange[1];
        start = end - span;
      }
      return [start, end];
    },
    [fullRange, fullSpan]
  );

  // ── Wheel zoom ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      markInteracted();
      const w = el.clientWidth;
      if (w === 0) return;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const vr = viewRangeRef.current;
      const mouseYear = vr[0] + (mouseX / w) * (vr[1] - vr[0]);
      const absDelta = Math.abs(e.deltaY);
      const zoomAmount = 1 + Math.min(absDelta / 300, 0.5);
      const zoomDir = e.deltaY > 0 ? zoomAmount : 1 / zoomAmount;
      const currentSpan = vr[1] - vr[0];
      const newSpan = currentSpan * zoomDir;
      const mouseRatio = (mouseYear - vr[0]) / currentSpan;
      setViewRangeBoth(
        clampViewRange(mouseYear - mouseRatio * newSpan, mouseYear - mouseRatio * newSpan + newSpan)
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clampViewRange, setViewRangeBoth, markInteracted]);

  // ── Pinch zoom + prevent browser back-swipe on ALL touches (desktop only) ──
  const lastPinchRef = useRef<{ dist: number; center: number } | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isMobile) return;
    const onTouchStart = (e: TouchEvent) => {
      // Prevent browser back/forward gesture for ALL touches in the timeline
      e.preventDefault();
      if (e.touches.length === 2) {
        const rect = el.getBoundingClientRect();
        lastPinchRef.current = {
          dist: Math.abs(e.touches[0].clientX - e.touches[1].clientX),
          center: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
        };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastPinchRef.current) {
        e.preventDefault();
        markInteracted();
        const w = el.clientWidth;
        if (w === 0) return;
        const rect = el.getBoundingClientRect();
        const newDist = Math.abs(e.touches[0].clientX - e.touches[1].clientX);
        const newCenter = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const vr = viewRangeRef.current;
        const scale = lastPinchRef.current.dist / Math.max(newDist, 1);
        const centerYear = vr[0] + (newCenter / w) * (vr[1] - vr[0]);
        const currentSpan = vr[1] - vr[0];
        const newSpan = currentSpan * scale;
        const centerRatio = (centerYear - vr[0]) / currentSpan;
        setViewRangeBoth(
          clampViewRange(
            centerYear - centerRatio * newSpan,
            centerYear - centerRatio * newSpan + newSpan
          )
        );
        lastPinchRef.current = { dist: newDist, center: newCenter };
      }
    };
    const onTouchEnd = () => {
      lastPinchRef.current = null;
    };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [clampViewRange, setViewRangeBoth, markInteracted, isMobile]);

  // ── Zoom button handlers ──
  const handleZoomIn = useCallback(() => {
    markInteracted();
    const vr = viewRangeRef.current;
    const center = (vr[0] + vr[1]) / 2;
    const newSpan = (vr[1] - vr[0]) / 1.5;
    setViewRangeBoth(clampViewRange(center - newSpan / 2, center + newSpan / 2));
  }, [clampViewRange, setViewRangeBoth, markInteracted]);

  const handleZoomOut = useCallback(() => {
    markInteracted();
    const vr = viewRangeRef.current;
    const center = (vr[0] + vr[1]) / 2;
    const newSpan = (vr[1] - vr[0]) * 1.5;
    setViewRangeBoth(clampViewRange(center - newSpan / 2, center + newSpan / 2));
  }, [clampViewRange, setViewRangeBoth, markInteracted]);

  // ── Pan to off-screen stories ──
  const handlePanLeft = useCallback(() => {
    markInteracted();
    const leftMost = Math.min(...visiblePoints.map((p) => p.startYear));
    const span = viewRangeRef.current[1] - viewRangeRef.current[0];
    setViewRangeBoth(clampViewRange(leftMost - span * 0.1, leftMost - span * 0.1 + span));
  }, [visiblePoints, clampViewRange, setViewRangeBoth, markInteracted]);

  const handlePanRight = useCallback(() => {
    markInteracted();
    const rightMost = Math.max(...visiblePoints.map((p) => p.startYear));
    const span = viewRangeRef.current[1] - viewRangeRef.current[0];
    setViewRangeBoth(clampViewRange(rightMost - span * 0.9, rightMost - span * 0.9 + span));
  }, [visiblePoints, clampViewRange, setViewRangeBoth, markInteracted]);

  // ── Reset: back to initial view + clear filter ──
  const handleReset = useCallback(() => {
    setActiveEra(null);
    hasInteractedRef.current = false;
    setHasInteracted(false);
    const range = [...initialRange] as [number, number];
    viewRangeRef.current = range;
    setViewRange(range);
    onViewRangeChange(null);
  }, [initialRange, onViewRangeChange]);

  // ── Era quick-filter: snap to predefined time period ──
  const handleEraClick = useCallback((era: typeof ERAS[number]) => {
    if (activeEra === era.label) {
      // Toggle off — reset to default
      handleReset();
      return;
    }
    // Set era view range (markInteracted clears activeEra, so set it after)
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      setHasInteracted(true);
    }
    setActiveEra(era.label);
    setViewRangeBoth(clampViewRange(era.start, era.end));
  }, [activeEra, handleReset, setViewRangeBoth, clampViewRange]);

  // Story counts per era (for pill badges)
  const eraStoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const era of ERAS) {
      counts[era.label] = allPoints.filter(
        (pt) => pt.startYear >= era.start && pt.startYear < era.end
      ).length;
    }
    return counts;
  }, [allPoints]);

  // ── Pointer handlers ──
  const getPointerX = (e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return e.clientX - rect.left;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const x = getPointerX(e);
    const y = e.clientY - containerRef.current!.getBoundingClientRect().top;

    // Slider track: click to pan view to that position
    if (y > SLIDER_Y - SLIDER_TRACK_H - 4) {
      markInteracted();
      const clickYear = fullXToYear(x);
      const span = viewRangeRef.current[1] - viewRangeRef.current[0];
      setViewRangeBoth(clampViewRange(clickYear - span / 2, clickYear + span / 2));
      return;
    }

    // Dot area: check dot clicks
    for (const pt of visiblePoints) {
      const dotX = yearToX(pt.startYear);
      if (Math.abs(x - dotX) < 10 && Math.abs(y - DOT_Y) < 12) {
        const story = stories.find((s) => s.id === pt.storyId);
        if (story) {
          onStorySelect(story);
          return;
        }
      }
    }

    // Pan (available when view is narrower than full range)
    if (canPan) {
      markInteracted();
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
      if (y < SLIDER_Y - 8) {
        let closest: string | null = null;
        let closestDist = 12;
        for (const pt of visiblePoints) {
          const dotX = yearToX(pt.startYear);
          const dist = Math.abs(x - dotX);
          if (dist < closestDist) {
            closestDist = dist;
            closest = pt.storyId;
          }
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
    }
  };

  const handlePointerUp = () => setDragState('none');

  const ticks = useMemo(() => getTickYears(viewRange[0], viewRange[1]), [viewRange]);
  const hoveredData = hoveredPoint
    ? visiblePoints.find((p) => p.storyId === hoveredPoint)
    : null;

  if (containerWidth === 0) {
    return (
      <div
        ref={containerRef}
        className="shrink-0"
        style={{ height: BAR_HEIGHT, background: 'rgba(35,35,35,0.98)' }}
      />
    );
  }

  // Slider positions
  const vpLeftX = fullYearToX(viewRange[0]);
  const vpRightX = fullYearToX(viewRange[1]);

  return (
    <>
    <div
      ref={containerRef}
      className="shrink-0 relative select-none"
      style={{
        height: BAR_HEIGHT,
        touchAction: isMobile ? 'manipulation' : 'none',
        overscrollBehaviorX: 'none',
        background: 'linear-gradient(180deg, rgba(44,44,44,0.98) 0%, rgba(30,30,30,0.99) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.4)',
      }}
    >
      <svg
        width={containerWidth}
        height={BAR_HEIGHT}
        className="block"
        style={{ cursor: isMobile ? 'default' : dragState === 'pan' ? 'grabbing' : canPan ? 'grab' : 'default' }}
        onPointerDown={isMobile ? undefined : handlePointerDown}
        onPointerMove={isMobile ? undefined : handlePointerMove}
        onPointerUp={isMobile ? undefined : handlePointerUp}
        onPointerLeave={isMobile ? undefined : () => {
          if (dragState === 'none') setHoveredPoint(null);
        }}
      >
        {/* Story range bars when zoomed in — grayscale default, color on hover/highlight */}
        {viewRange[1] - viewRange[0] < 500 &&
          visiblePoints
            .filter((pt) => pt.endYear - pt.startYear > 0)
            .map((pt) => {
              const isActive =
                hoveredPoint === pt.storyId || highlightedStoryId === pt.storyId;
              return (
                <line
                  key={`range-${pt.storyId}`}
                  x1={yearToX(pt.startYear)}
                  y1={DOT_Y}
                  x2={yearToX(pt.endYear)}
                  y2={DOT_Y}
                  stroke={
                    isActive
                      ? CATEGORIES[pt.category].color
                      : 'rgba(180,185,190,0.25)'
                  }
                  strokeWidth={1.5}
                  opacity={isActive ? 0.4 : 0.15}
                  strokeLinecap="round"
                />
              );
            })}

        {/* Dots — grayscale by default, category color on hover/highlight */}
        {visiblePoints.map((pt) => {
          const cx = yearToX(pt.startYear);
          if (cx < -10 || cx > containerWidth + 10) return null;
          const isHovered = hoveredPoint === pt.storyId;
          const isScrollHL = highlightedStoryId === pt.storyId;
          const isActive = isHovered || isScrollHL;
          const r = isActive ? DOT_HOVER_RADIUS : DOT_RADIUS;
          const color = CATEGORIES[pt.category].color;
          const dotFill = isActive ? color : 'rgba(180,185,190,0.55)';
          const dotFilter = isActive
            ? `drop-shadow(0 0 5px ${color})`
            : 'drop-shadow(0 0 1.5px rgba(255,255,255,0.2))';
          return (
            <g key={pt.storyId}>
              {isActive && (
                <circle
                  cx={cx}
                  cy={DOT_Y}
                  r={r + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.5}
                />
              )}
              {isScrollHL && !isHovered && (
                <circle cx={cx} cy={DOT_Y} r={r + 7} fill="none" stroke={color} strokeWidth={0.5}>
                  <animate
                    attributeName="r"
                    from={String(r + 4)}
                    to={String(r + 12)}
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.4"
                    to="0"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={cx}
                cy={DOT_Y}
                r={r}
                fill={dotFill}
                opacity={1}
                style={{
                  transition: 'r 0.15s, fill 0.2s',
                  filter: dotFilter,
                }}
              />
            </g>
          );
        })}

        {/* Tick labels */}
        {ticks.map((year) => {
          const x = yearToX(year);
          if (x < 30 || x > containerWidth - 30) return null;
          return (
            <g key={`tick-${year}`}>
              <line
                x1={x}
                y1={DOT_Y + 10}
                x2={x}
                y2={DOT_Y + 15}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={0.5}
              />
              <text
                x={x}
                y={LABEL_Y}
                textAnchor="middle"
                fill="rgba(255,255,255,0.55)"
                fontSize={10}
                fontFamily="var(--font-mono, monospace)"
              >
                {formatYear(year)}
              </text>
            </g>
          );
        })}

        {/* ── Slider track (mini-map) ── */}
        <rect
          x={0}
          y={SLIDER_Y - SLIDER_TRACK_H / 2}
          width={containerWidth}
          height={SLIDER_TRACK_H}
          rx={3}
          fill="rgba(255,255,255,0.07)"
        />
        {/* Viewport indicator — warm gold when filtering is active, thicker on mobile */}
        <rect
          x={vpLeftX}
          y={SLIDER_Y - (isMobile ? 5 : SLIDER_TRACK_H / 2)}
          width={Math.max(3, vpRightX - vpLeftX)}
          height={isMobile ? 10 : SLIDER_TRACK_H}
          rx={isMobile ? 5 : 3}
          fill={hasInteracted ? 'rgba(234,179,8,0.45)' : 'rgba(255,255,255,0.22)'}
        />
      </svg>

      {/* Mobile native range input — replaces custom SVG drag for reliable touch panning */}
      {isMobile && (
        <input
          type="range"
          min={fullRange[0]}
          max={fullRange[1]}
          step={1}
          value={Math.round((viewRange[0] + viewRange[1]) / 2)}
          onChange={(e) => {
            markInteracted();
            const newCenter = Number(e.target.value);
            const span = viewRange[1] - viewRange[0];
            setViewRangeBoth(clampViewRange(newCenter - span / 2, newCenter + span / 2));
          }}
          className="mobile-timeline-range"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 4,
            width: 'calc(100% - 32px)',
            height: 20,
            zIndex: 5,
            appearance: 'none',
            WebkitAppearance: 'none',
            background: 'transparent',
            outline: 'none',
            margin: 0,
            padding: 0,
          }}
        />
      )}

      {/* Tooltip */}
      {hoveredData && (
        <TooltipOverlay
          point={hoveredData}
          x={yearToX(hoveredData.startYear)}
          containerWidth={containerWidth}
        />
      )}

      {/* "← N ancient" indicator */}
      {leftOutCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePanLeft();
          }}
          className="absolute text-[10px] font-mono text-[rgba(255,255,255,0.45)] hover:text-white transition-colors"
          style={{ top: DOT_Y - 7, left: 4 }}
        >
          ← {leftOutCount} ancient
        </button>
      )}

      {/* "N more →" indicator */}
      {rightOutCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePanRight();
          }}
          className="absolute text-[10px] font-mono text-[rgba(255,255,255,0.45)] hover:text-white transition-colors"
          style={{ top: DOT_Y - 7, right: showReset ? 180 : 120 }}
        >
          {rightOutCount} more →
        </button>
      )}

      {/* Top-right: zoom buttons + reset/hint */}
      <div className="absolute top-1 right-2 flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="w-9 h-9 flex items-center justify-center rounded text-base font-mono font-semibold text-[rgba(255,255,255,0.85)] bg-[rgba(255,255,255,0.15)] hover:text-white hover:bg-[rgba(255,255,255,0.25)] transition-colors border border-[rgba(255,255,255,0.25)]"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="w-9 h-9 flex items-center justify-center rounded text-base font-mono font-semibold text-[rgba(255,255,255,0.85)] bg-[rgba(255,255,255,0.15)] hover:text-white hover:bg-[rgba(255,255,255,0.25)] transition-colors border border-[rgba(255,255,255,0.25)]"
          title="Zoom out"
        >
          −
        </button>
        {showReset && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="ml-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.55)] hover:text-white hover:bg-[rgba(255,255,255,0.18)] transition-colors"
            title="Reset view and show all stories"
          >
            Reset
          </button>
        )}
        {visiblePoints.length > 0 && (
          <span className="ml-1 text-[9px] font-mono text-[rgba(255,255,255,0.35)] pointer-events-none whitespace-nowrap">
            {formatYear(Math.round(viewRange[0]))} — {formatYear(Math.round(viewRange[1]))}
            {!showReset && (
              <span className="text-[rgba(255,255,255,0.25)]">
                {isMobile ? ' · slide to explore' : ' · scroll to zoom'}
              </span>
            )}
          </span>
        )}
      </div>
    </div>

    {/* Era quick-filters — hidden on mobile to save vertical space */}
    {!isMobile && (
      <div className="shrink-0 flex items-center gap-1 px-3 py-1 overflow-x-auto bg-[rgba(26,26,26,0.98)] border-b border-[rgba(255,255,255,0.08)]">
        {ERAS.map((era) => {
          const count = eraStoryCounts[era.label];
          const isActive = activeEra === era.label;
          return (
            <button
              key={era.label}
              onClick={() => handleEraClick(era)}
              disabled={count === 0}
              className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[rgba(234,179,8,0.25)] text-[rgba(234,179,8,0.9)] border border-[rgba(234,179,8,0.4)]'
                  : count === 0
                  ? 'text-[rgba(255,255,255,0.15)] cursor-default'
                  : 'text-[rgba(255,255,255,0.45)] hover:text-white bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] border border-transparent'
              }`}
            >
              {era.label}
              {count > 0 && (
                <span className="ml-1 text-[8px] opacity-50">({count})</span>
              )}
            </button>
          );
        })}
      </div>
    )}
    </>
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
        <span style={{ color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>{years}</span>
      </div>
    </div>
  );
}
