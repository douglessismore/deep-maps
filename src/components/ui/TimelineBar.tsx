import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Story, StoryCategory } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import {
  getTimelinePoints,
  getEraWeights,
  yearToAdaptiveX,
  getEraForYear,
  formatYear,
  ERAS,
  type TimelinePoint,
  type EraId,
} from '../../lib/timeline';

interface TimelineBarProps {
  stories: Story[];
  categoryFilter: StoryCategory | null;
  onStorySelect: (story: Story) => void;
  onViewRangeChange: (range: [number, number] | null) => void;
  highlightedStoryId?: string | null;
  /** Story IDs with at least one pin visible on the current map viewport */
  mapVisibleStoryIds?: Set<string> | null;
}

const DOT_RADIUS = 2.5;
const DOT_HOVER_RADIUS = 4;
const TAP_THRESHOLD = 8; // px — movement below this is a tap, above is a scrub
const DATA_MIN_YEAR = -25000;
const DATA_MAX_YEAR = 2030;

function getBarMetrics(isMobile: boolean) {
  return isMobile
    ? { BAR_HEIGHT: 68, TOP_H: 16, DOT_H: 28, CHIP_H: 24, DOT_Y: 14 }
    : { BAR_HEIGHT: 80, TOP_H: 20, DOT_H: 36, CHIP_H: 24, DOT_Y: 18 };
}

export function TimelineBar({
  stories,
  categoryFilter,
  onStorySelect: _onStorySelect,
  onViewRangeChange,
  highlightedStoryId,
  mapVisibleStoryIds,
}: TimelineBarProps) {
  void _onStorySelect; // Reserved for future desktop dot-click-to-select
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const isMobile = containerWidth > 0 && containerWidth < 640;
  const { BAR_HEIGHT, TOP_H, DOT_H, CHIP_H, DOT_Y } = getBarMetrics(isMobile);

  // ── Data ──
  const allPoints = useMemo(() => getTimelinePoints(stories), [stories]);
  const visiblePoints = useMemo(() => {
    if (!categoryFilter) return allPoints;
    return allPoints.filter((p) => p.category === categoryFilter);
  }, [allPoints, categoryFilter]);

  // ── Adaptive scale — recomputes when data or width changes ──
  const eraWeights = useMemo(
    () => getEraWeights(visiblePoints, containerWidth),
    [visiblePoints, containerWidth]
  );

  // ── Filter state ──
  const [activeEra, setActiveEra] = useState<EraId | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // ── Hover state ──
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  // ── Scrub state — the era being scrubbed over (during drag, unzoomed only) ──
  const [scrubEra, setScrubEra] = useState<EraId | null>(null);

  // ── Zoom+pan state ──
  // When set, dot strip shows this year range linearly (instead of adaptive layout).
  // null = overview mode (all eras, adaptive widths).
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);
  const zoomRangeRef = useRef<[number, number] | null>(null);
  const lastDragX = useRef(0);
  // Keep ref in sync for use in callbacks without re-creating them
  useEffect(() => { zoomRangeRef.current = zoomRange; }, [zoomRange]);

  // ── Pointer tracking for tap vs scrub/pan detection ──
  const pointerState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    pointerId: number;
    hasMoved: boolean; // true once movement exceeds TAP_THRESHOLD
  } | null>(null);

  // Reset all interaction state on data change
  useEffect(() => {
    setActiveEra(null);
    setHasInteracted(false);
    setHoveredPoint(null);
    setScrubEra(null);
    setZoomRange(null);
    onViewRangeChange(null);
  }, [allPoints, onViewRangeChange]);

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

  // ── Scroll-linked highlight data ──
  const highlightedPoint = useMemo(() => {
    if (!highlightedStoryId) return null;
    return allPoints.find((p) => p.storyId === highlightedStoryId) ?? null;
  }, [highlightedStoryId, allPoints]);

  const highlightedEra = useMemo(() => {
    if (!highlightedPoint) return null;
    return getEraForYear(highlightedPoint.startYear);
  }, [highlightedPoint]);

  // ── Dot positioning helper — adaptive when unzoomed, linear when zoomed ──
  const getDotX = useCallback(
    (year: number): number => {
      if (zoomRange) {
        const [start, end] = zoomRange;
        if (end === start) return containerWidth / 2;
        return ((year - start) / (end - start)) * containerWidth;
      }
      return yearToAdaptiveX(year, eraWeights);
    },
    [zoomRange, eraWeights, containerWidth]
  );

  // ── Era chip click ──
  const handleEraClick = useCallback(
    (eraId: EraId | null) => {
      if (eraId === activeEra) {
        // Toggle off → back to overview
        setActiveEra(null);
        setHasInteracted(false);
        setZoomRange(null);
        onViewRangeChange(null);
        return;
      }
      setActiveEra(eraId);
      if (eraId) {
        setHasInteracted(true);
        const era = ERAS.find((e) => e.id === eraId)!;
        // Zoom dot strip to this era with 5% padding
        const span = era.end - era.start;
        const pad = span * 0.05;
        setZoomRange([era.start - pad, era.end + pad]);
        onViewRangeChange([era.start, era.end]);
      } else {
        setHasInteracted(false);
        setZoomRange(null);
        onViewRangeChange(null);
      }
    },
    [activeEra, onViewRangeChange]
  );

  // ── Clear filter ──
  const handleClear = useCallback(() => {
    setActiveEra(null);
    setHasInteracted(false);
    setZoomRange(null);
    onViewRangeChange(null);
  }, [onViewRangeChange]);

  // ── Find era at pixel X (adaptive layout only) ──
  const getEraAtX = useCallback(
    (x: number): EraId | null => {
      for (const w of eraWeights) {
        if (x >= w.xStart && x < w.xStart + w.width) return w.id;
      }
      return null;
    },
    [eraWeights]
  );

  // ── Find nearest dot to pixel X ──
  const findNearestDot = useCallback(
    (x: number): TimelinePoint | null => {
      let closest: TimelinePoint | null = null;
      let closestDist = 10; // max hit distance
      for (const pt of visiblePoints) {
        const isFiltered = activeEra && getEraForYear(pt.startYear) !== activeEra;
        if (isFiltered) continue;
        const dotX = getDotX(pt.startYear);
        const dist = Math.abs(x - dotX);
        if (dist < closestDist) {
          closestDist = dist;
          closest = pt;
        }
      }
      return closest;
    },
    [visiblePoints, getDotX, activeEra]
  );

  // ── Pointer handlers: tap / scrub (unzoomed) / pan (zoomed) ──
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      lastDragX.current = e.clientX;
      pointerState.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        pointerId: e.pointerId,
        hasMoved: false,
      };

      (e.target as Element).setPointerCapture(e.pointerId);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const ps = pointerState.current;
      if (!ps || !ps.active) {
        // Just hovering (desktop) — find nearest dot
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (y < DOT_H) {
          const dot = findNearestDot(x);
          setHoveredPoint(dot?.storyId ?? null);
        } else {
          setHoveredPoint(null);
        }
        return;
      }

      // Pointer is down — check if we've exceeded tap threshold
      const dx = Math.abs(e.clientX - ps.startX);
      ps.currentX = e.clientX;

      if (!ps.hasMoved && dx > TAP_THRESHOLD) {
        ps.hasMoved = true;
      }

      if (ps.hasMoved) {
        const zr = zoomRangeRef.current;
        if (zr) {
          // ZOOMED: pan — shift zoom range based on drag delta
          const pixelDx = e.clientX - lastDragX.current;
          lastDragX.current = e.clientX;
          const yearPerPx = (zr[1] - zr[0]) / containerWidth;
          const yearDelta = -pixelDx * yearPerPx; // drag right → see earlier years
          let newStart = zr[0] + yearDelta;
          let newEnd = zr[1] + yearDelta;
          // Clamp to data bounds
          if (newStart < DATA_MIN_YEAR) {
            newEnd += DATA_MIN_YEAR - newStart;
            newStart = DATA_MIN_YEAR;
          }
          if (newEnd > DATA_MAX_YEAR) {
            newStart -= newEnd - DATA_MAX_YEAR;
            newEnd = DATA_MAX_YEAR;
          }
          const newRange: [number, number] = [newStart, newEnd];
          setZoomRange(newRange);
          zoomRangeRef.current = newRange; // immediate update for next frame
          // Update era chip highlight based on center of view
          const centerYear = (newStart + newEnd) / 2;
          const newEra = getEraForYear(centerYear);
          setActiveEra(newEra);
          // Update story filter to match visible range
          onViewRangeChange(newRange);
          setHoveredPoint(null);
        } else {
          // UNZOOMED: scrub — highlight the era under the finger
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = e.clientX - rect.left;
          const era = getEraAtX(x);
          setScrubEra(era);
          setHoveredPoint(null);
        }
      }
    },
    [DOT_H, findNearestDot, getEraAtX, containerWidth, onViewRangeChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const ps = pointerState.current;
      pointerState.current = null;
      setScrubEra(null);

      // Release pointer capture
      try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}

      if (!ps || !ps.active) return;

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;

      if (!ps.hasMoved) {
        if (zoomRange) {
          // ZOOMED + TAP → go back to overview
          handleClear();
        } else {
          // UNZOOMED + TAP → filter to the era at the tap location
          const era = getEraAtX(x);
          if (era) {
            if (era === activeEra) {
              handleClear();
            } else {
              handleEraClick(era);
            }
          } else if (activeEra) {
            handleClear();
          }
        }
      }
      // Pan drag (zoomed) already updated state during move.
      // Scrub drag (unzoomed) only highlights visually — does NOT filter on release.
    },
    [getEraAtX, handleEraClick, handleClear, activeEra, zoomRange]
  );

  // ── Desktop mouse wheel zoom (when zoomed in) ──
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handleWheel = (e: WheelEvent) => {
      const zr = zoomRangeRef.current;
      if (!zr) return; // Only zoom when already zoomed in
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseRatio = mouseX / containerWidth;
      const span = zr[1] - zr[0];
      // Zoom factor — scroll up shrinks range (zoom in), scroll down expands (zoom out)
      const factor = e.deltaY > 0 ? 1.15 : 0.87;
      const newSpan = Math.max(10, Math.min(DATA_MAX_YEAR - DATA_MIN_YEAR, span * factor));
      // Anchor zoom around mouse position
      const mouseYear = zr[0] + mouseRatio * span;
      const newStart = mouseYear - mouseRatio * newSpan;
      const newEnd = mouseYear + (1 - mouseRatio) * newSpan;
      const newRange: [number, number] = [
        Math.max(DATA_MIN_YEAR, newStart),
        Math.min(DATA_MAX_YEAR, newEnd),
      ];
      setZoomRange(newRange);
      zoomRangeRef.current = newRange;
      onViewRangeChange(newRange);
      // Update era chip
      const center = (newRange[0] + newRange[1]) / 2;
      setActiveEra(getEraForYear(center));
    };
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [containerWidth, onViewRangeChange]);

  // ── Touch pinch zoom ──
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let lastPinchDist = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        lastPinchDist = Math.abs(dx);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const zr = zoomRangeRef.current;
      if (!zr) return;
      e.preventDefault();

      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dist = Math.abs(dx);
      const center = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const rect = svg.getBoundingClientRect();
      const centerX = center - rect.left;
      const centerRatio = centerX / containerWidth;

      if (lastPinchDist > 0) {
        const scale = lastPinchDist / dist; // pinch out = dist increases = scale < 1 = zoom in
        const span = zr[1] - zr[0];
        const newSpan = Math.max(10, Math.min(DATA_MAX_YEAR - DATA_MIN_YEAR, span * scale));
        const centerYear = zr[0] + centerRatio * span;
        const newStart = centerYear - centerRatio * newSpan;
        const newEnd = centerYear + (1 - centerRatio) * newSpan;
        const newRange: [number, number] = [
          Math.max(DATA_MIN_YEAR, newStart),
          Math.min(DATA_MAX_YEAR, newEnd),
        ];
        setZoomRange(newRange);
        zoomRangeRef.current = newRange;
        onViewRangeChange(newRange);
        setActiveEra(getEraForYear((newRange[0] + newRange[1]) / 2));
      }

      lastPinchDist = dist;
    };

    svg.addEventListener('touchstart', handleTouchStart, { passive: true });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      svg.removeEventListener('touchstart', handleTouchStart);
      svg.removeEventListener('touchmove', handleTouchMove);
    };
  }, [containerWidth, onViewRangeChange]);

  // ── Tooltip data ──
  const hoveredData = hoveredPoint
    ? visiblePoints.find((p) => p.storyId === hoveredPoint)
    : null;

  // ── Year range label ──
  const rangeLabel = useMemo(() => {
    if (zoomRange) {
      return `${formatYear(Math.round(zoomRange[0]))} — ${formatYear(Math.round(zoomRange[1]))}`;
    }
    if (activeEra) {
      const era = ERAS.find((e) => e.id === activeEra);
      if (era) return `${formatYear(era.start)} — ${formatYear(era.end)}`;
    }
    if (visiblePoints.length === 0) return '';
    const years = visiblePoints.map((p) => p.startYear);
    const min = Math.min(...years);
    const max = Math.max(...years);
    return `${formatYear(min)} — ${formatYear(max)}`;
  }, [zoomRange, activeEra, visiblePoints]);

  // Wait for measurement
  if (containerWidth === 0) {
    return (
      <div
        ref={containerRef}
        className="shrink-0"
        style={{ height: BAR_HEIGHT, background: 'rgba(35,35,35,0.98)' }}
      />
    );
  }

  const isZoomed = !!zoomRange;

  return (
    <div
      ref={containerRef}
      className="shrink-0 select-none"
      style={{
        height: BAR_HEIGHT,
        background: 'linear-gradient(180deg, rgba(44,44,44,0.98) 0%, rgba(30,30,30,0.99) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 6px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Top zone: year range + controls ── */}
      <div
        style={{
          height: TOP_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          flexShrink: 0,
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: isMobile ? 10 : 11,
            color: 'rgba(255,255,255,0.55)',
            letterSpacing: '0.3px',
          }}
          aria-label={`Timeline range: ${rangeLabel}`}
        >
          {rangeLabel}
        </span>
        {/* Clear filter button — only visible when a filter is active */}
        {hasInteracted && (
          <button
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="flex items-center gap-1 rounded-full font-mono hover:bg-yellow-500/25 active:bg-yellow-500/30 transition-colors"
            style={{
              height: isMobile ? 16 : 18,
              padding: '0 8px',
              fontSize: isMobile ? 9 : 10,
              background: 'rgba(234,179,8,0.15)',
              border: '1px solid rgba(234,179,8,0.3)',
              color: 'rgba(234,179,8,0.9)',
              cursor: 'pointer',
            }}
            aria-label="Clear era filter"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Middle zone: SVG dots ── */}
      <div
        style={{
          height: DOT_H,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          // When zoomed, prevent browser from stealing horizontal touch for page scroll
          touchAction: isZoomed ? 'none' : 'pan-y',
          cursor: isZoomed ? 'grab' : 'default',
        }}
      >
        <svg
          ref={svgRef}
          width={containerWidth}
          height={DOT_H}
          role="img"
          aria-label={`Timeline with ${visiblePoints.length} stories. ${isZoomed ? 'Drag to pan through time.' : 'Tap to zoom into an era.'}`}
          style={{ display: 'block' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            setHoveredPoint(null);
            setScrubEra(null);
            pointerState.current = null;
          }}
        >
          {/* Era segment backgrounds — only shown in overview (unzoomed) mode */}
          {!isZoomed && eraWeights.map((w) => {
            const isScrubbed = scrubEra === w.id;
            const isActiveEra = activeEra === w.id;
            if (!isScrubbed && !isActiveEra) return null;
            return (
              <rect
                key={`bg-${w.id}`}
                x={w.xStart}
                y={0}
                width={w.width}
                height={DOT_H}
                fill={isScrubbed ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.04)'}
                style={{ transition: 'fill 0.15s' }}
              />
            );
          })}

          {/* Era segment hairlines — only in overview mode */}
          {!isZoomed && eraWeights.map((w, i) =>
            i > 0 ? (
              <line
                key={`hairline-${w.id}`}
                x1={w.xStart}
                y1={2}
                x2={w.xStart}
                y2={DOT_H - 2}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={0.5}
              />
            ) : null
          )}

          {/* Story range bars when zoomed into an era */}
          {isZoomed &&
            visiblePoints
              .filter(
                (pt) =>
                  pt.endYear - pt.startYear > 0 &&
                  (!activeEra || getEraForYear(pt.startYear) === activeEra)
              )
              .map((pt) => {
                const x1 = getDotX(pt.startYear);
                const x2 = getDotX(pt.endYear);
                // Cull if fully off-screen
                if (x2 < -10 && x1 < -10) return null;
                if (x1 > containerWidth + 10 && x2 > containerWidth + 10) return null;
                const isActive =
                  hoveredPoint === pt.storyId || highlightedStoryId === pt.storyId;
                return (
                  <line
                    key={`range-${pt.storyId}`}
                    x1={Math.max(-10, x1)}
                    y1={DOT_Y}
                    x2={Math.min(containerWidth + 10, x2)}
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

          {/* Dots — always category-colored */}
          {visiblePoints.map((pt) => {
            const cx = getDotX(pt.startYear);
            if (cx < -10 || cx > containerWidth + 10) return null;

            const isFiltered = activeEra && getEraForYear(pt.startYear) !== activeEra;
            const isHovered = hoveredPoint === pt.storyId;
            const isScrollHL = highlightedStoryId === pt.storyId;
            const isActive = isHovered || isScrollHL;
            // Dim dots not visible on map (when map has moved to show a subset)
            const isOffMap = mapVisibleStoryIds && mapVisibleStoryIds.size > 0 && !mapVisibleStoryIds.has(pt.storyId);
            const r = isActive ? DOT_HOVER_RADIUS : isFiltered ? 1 : DOT_RADIUS;
            const color = CATEGORIES[pt.category].color;
            // Dimming priority: filtered > off-map > default. Active always bright.
            const opacity = isFiltered ? 0.1 : isActive ? 1 : isOffMap ? 0.15 : 0.75;
            const dotFilter = isActive
              ? `drop-shadow(0 0 4px ${color})`
              : 'none';

            // Stagger dots vertically to reduce overlap
            const hash = pt.storyId.charCodeAt(0) + pt.storyId.charCodeAt(1);
            const yOffset = (hash % 3 - 1) * 3;

            return (
              <g key={pt.storyId}>
                {isActive && !isFiltered && (
                  <circle
                    cx={cx}
                    cy={DOT_Y + yOffset}
                    r={r + 3}
                    fill="none"
                    stroke={color}
                    strokeWidth={0.8}
                    opacity={0.4}
                  />
                )}
                {isScrollHL && !isHovered && !isFiltered && (
                  <circle cx={cx} cy={DOT_Y + yOffset} r={r + 6} fill="none" stroke={color} strokeWidth={0.5}>
                    <animate
                      attributeName="r"
                      from={String(r + 3)}
                      to={String(r + 10)}
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
                  cy={DOT_Y + yOffset}
                  r={r}
                  fill={color}
                  opacity={opacity}
                  style={{
                    transition: 'r 0.15s, opacity 0.2s',
                    filter: dotFilter,
                  }}
                />
              </g>
            );
          })}

          {/* Zoomed mode: gradient fades at edges to hint at more content */}
          {isZoomed && (
            <>
              <defs>
                <linearGradient id="fadeLeft" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="rgb(37,37,37)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="rgb(37,37,37)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fadeRight" x1="1" x2="0" y1="0" y2="0">
                  <stop offset="0%" stopColor="rgb(37,37,37)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="rgb(37,37,37)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <rect x={0} y={0} width={20} height={DOT_H} fill="url(#fadeLeft)" />
              <rect x={containerWidth - 20} y={0} width={20} height={DOT_H} fill="url(#fadeRight)" />
            </>
          )}
        </svg>

        {/* Desktop hover tooltip */}
        {hoveredData && !highlightedPoint && (
          <TooltipOverlay
            point={hoveredData}
            x={getDotX(hoveredData.startYear)}
            containerWidth={containerWidth}
            dotY={DOT_Y}
            dotH={DOT_H}
          />
        )}

        {/* Scroll-linked year indicator — pops up above the highlighted dot */}
        {highlightedPoint && containerWidth > 0 && (
          <YearIndicator
            point={highlightedPoint}
            x={getDotX(highlightedPoint.startYear)}
            containerWidth={containerWidth}
            dotY={DOT_Y}
          />
        )}
      </div>

      {/* ── Bottom zone: era chips ── */}
      <div
        style={{
          height: CHIP_H,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 6px',
          overflowX: 'auto',
          flexShrink: 0,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        {/* "All" chip */}
        <EraChip
          label="All"
          count={visiblePoints.length}
          isActive={false}
          isHighlighted={false}
          isDefault={!activeEra}
          isScrubbed={false}
          isMobile={isMobile}
          onClick={() => handleEraClick(null)}
        />
        {ERAS.map((era) => {
          const w = eraWeights.find((e) => e.id === era.id);
          return (
            <EraChip
              key={era.id}
              label={era.label}
              count={w?.count ?? 0}
              isActive={activeEra === era.id}
              isHighlighted={highlightedEra === era.id && !activeEra}
              isDefault={false}
              isScrubbed={scrubEra === era.id}
              isMobile={isMobile}
              onClick={() => handleEraClick(era.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Era Chip Component ──
function EraChip({
  label,
  count,
  isActive,
  isHighlighted,
  isDefault,
  isScrubbed,
  isMobile,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  /** Scroll-linked: the era of the currently-scrolled story (subtle hint, not gold) */
  isHighlighted: boolean;
  /** "All" chip when no filter is active — slightly brighter than siblings */
  isDefault: boolean;
  isScrubbed: boolean;
  isMobile: boolean;
  onClick: () => void;
}) {
  const chipH = isMobile ? 18 : 20;
  const fontSize = isMobile ? 9 : 10;

  // Active filter or scrub target — strong gold
  const isEmphasized = isActive || isScrubbed;

  // Compute border
  let border: string;
  if (isEmphasized) border = '1px solid rgba(234,179,8,0.5)';
  else if (isHighlighted) border = '1px solid rgba(255,255,255,0.25)';
  else if (isDefault) border = '1px solid rgba(255,255,255,0.2)';
  else border = '1px solid rgba(255,255,255,0.12)';

  // Compute background
  let bg: string;
  if (isEmphasized) bg = 'rgba(234,179,8,0.2)';
  else if (isDefault) bg = 'rgba(255,255,255,0.08)';
  else bg = 'rgba(255,255,255,0.05)';

  // Compute text color
  let textColor: string;
  if (isEmphasized) textColor = 'rgba(234,179,8,0.95)';
  else if (isHighlighted) textColor = 'rgba(255,255,255,0.75)';
  else if (isDefault) textColor = 'rgba(255,255,255,0.7)';
  else if (count === 0) textColor = 'rgba(255,255,255,0.2)';
  else textColor = 'rgba(255,255,255,0.55)';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="font-mono shrink-0"
      aria-label={`${label}${count > 0 ? ` (${count} stories)` : ''}`}
      style={{
        height: chipH,
        padding: `0 ${isMobile ? 6 : 8}px`,
        borderRadius: chipH / 2,
        fontSize,
        whiteSpace: 'nowrap',
        border,
        background: bg,
        color: textColor,
        cursor: count === 0 && label !== 'All' ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.15s',
        transform: isScrubbed ? 'scale(1.08)' : 'scale(1)',
        // Scroll highlight: subtle bottom accent line instead of gold fill
        borderBottom: isHighlighted ? '2px solid rgba(234,179,8,0.5)' : undefined,
      }}
      disabled={count === 0 && label !== 'All'}
    >
      {label}
      {count > 0 && (
        <span style={{ marginLeft: 3, opacity: 0.6, fontSize: fontSize - 1 }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Tooltip ──
function TooltipOverlay({
  point,
  x,
  containerWidth,
  dotY,
  dotH,
}: {
  point: TimelinePoint;
  x: number;
  containerWidth: number;
  dotY: number;
  dotH: number;
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
        bottom: dotH - dotY + DOT_HOVER_RADIUS + 6,
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

// ── Year Indicator (scroll-linked) ──
function YearIndicator({
  point,
  x,
  containerWidth,
  dotY,
}: {
  point: TimelinePoint;
  x: number;
  containerWidth: number;
  dotY: number;
}) {
  const year = formatYear(point.startYear);
  const left = Math.max(20, Math.min(x, containerWidth - 20));

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left,
        top: Math.max(0, dotY - 16),
        transform: 'translateX(-50%)',
        zIndex: 10,
      }}
    >
      <span
        className="font-mono"
        style={{
          fontSize: 9,
          color: 'rgba(234,179,8,0.85)',
          textShadow: '0 0 4px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.6)',
          letterSpacing: '0.3px',
        }}
      >
        {year}
      </span>
    </div>
  );
}
