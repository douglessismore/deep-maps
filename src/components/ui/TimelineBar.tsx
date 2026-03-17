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
  type EraWeight,
  type EraId,
} from '../../lib/timeline';

interface TimelineBarProps {
  stories: Story[];
  categoryFilter: StoryCategory | null;
  onStorySelect: (story: Story) => void;
  onViewRangeChange: (range: [number, number] | null) => void;
  highlightedStoryId?: string | null;
}

const DOT_RADIUS = 3.5;
const DOT_HOVER_RADIUS = 5.5;

function getBarMetrics(isMobile: boolean) {
  return isMobile
    ? { BAR_HEIGHT: 64, TOP_H: 16, DOT_H: 28, CHIP_H: 20, DOT_Y: 14 }
    : { BAR_HEIGHT: 80, TOP_H: 20, DOT_H: 36, CHIP_H: 24, DOT_Y: 18 };
}

export function TimelineBar({
  stories,
  categoryFilter,
  onStorySelect,
  onViewRangeChange,
  highlightedStoryId,
}: TimelineBarProps) {
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

  // ── Drag state ──
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWeights = useRef<EraWeight[]>([]);

  // Reset on data change
  useEffect(() => {
    setActiveEra(null);
    setHasInteracted(false);
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

  // ── Scroll-linked era highlight ──
  const highlightedEra = useMemo(() => {
    if (!highlightedStoryId) return null;
    const pt = allPoints.find((p) => p.storyId === highlightedStoryId);
    if (!pt) return null;
    return getEraForYear(pt.startYear);
  }, [highlightedStoryId, allPoints]);

  // ── Era chip click ──
  const handleEraClick = useCallback(
    (eraId: EraId | null) => {
      if (eraId === activeEra) {
        // Toggle off
        setActiveEra(null);
        setHasInteracted(false);
        onViewRangeChange(null);
        return;
      }
      setActiveEra(eraId);
      if (eraId) {
        setHasInteracted(true);
        const era = ERAS.find((e) => e.id === eraId)!;
        onViewRangeChange([era.start, era.end]);
      } else {
        setHasInteracted(false);
        onViewRangeChange(null);
      }
    },
    [activeEra, onViewRangeChange]
  );

  // ── Clear filter ──
  const handleClear = useCallback(() => {
    setActiveEra(null);
    setHasInteracted(false);
    onViewRangeChange(null);
  }, [onViewRangeChange]);

  // ── Zoom (step) ──
  const handleZoomIn = useCallback(() => {
    // If no era is active, zoom to the densest era
    if (!activeEra) {
      const densest = [...eraWeights].sort((a, b) => b.count - a.count)[0];
      if (densest) handleEraClick(densest.id);
      return;
    }
    // If era is active, zoom is already at era level — no further zoom in this model
  }, [activeEra, eraWeights, handleEraClick]);

  const handleZoomOut = useCallback(() => {
    if (activeEra) handleClear();
  }, [activeEra, handleClear]);

  // ── Pointer handlers on SVG ──
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check dot clicks
      for (const pt of visiblePoints) {
        const dotX = yearToAdaptiveX(pt.startYear, eraWeights);
        const isFiltered = activeEra && getEraForYear(pt.startYear) !== activeEra;
        if (isFiltered) continue;
        if (Math.abs(x - dotX) < 10 && Math.abs(y - DOT_Y) < 12) {
          const story = stories.find((s) => s.id === pt.storyId);
          if (story) {
            onStorySelect(story);
            return;
          }
        }
      }

      // Start drag for pan
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartWeights.current = [...eraWeights];
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [visiblePoints, eraWeights, activeEra, stories, onStorySelect, DOT_Y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging.current) return; // No visual pan in adaptive mode — just hover

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (y < DOT_H) {
        let closest: string | null = null;
        let closestDist = 12;
        for (const pt of visiblePoints) {
          const isFiltered = activeEra && getEraForYear(pt.startYear) !== activeEra;
          if (isFiltered) continue;
          const dotX = yearToAdaptiveX(pt.startYear, eraWeights);
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
    },
    [DOT_H, visiblePoints, eraWeights, activeEra]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Tooltip data ──
  const hoveredData = hoveredPoint
    ? visiblePoints.find((p) => p.storyId === hoveredPoint)
    : null;

  // ── Year range label ──
  const rangeLabel = useMemo(() => {
    if (activeEra) {
      const era = ERAS.find((e) => e.id === activeEra);
      if (era) return `${formatYear(era.start)} — ${formatYear(era.end)}`;
    }
    // Show full range
    if (visiblePoints.length === 0) return '';
    const years = visiblePoints.map((p) => p.startYear);
    const min = Math.min(...years);
    const max = Math.max(...years);
    return `${formatYear(min)} — ${formatYear(max)}`;
  }, [activeEra, visiblePoints]);

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
            fontSize: isMobile ? 9 : 10,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: '0.3px',
          }}
        >
          {rangeLabel}
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className="flex items-center justify-center rounded font-mono font-semibold"
            style={{
              width: isMobile ? 20 : 24,
              height: isMobile ? 16 : 18,
              fontSize: isMobile ? 10 : 11,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            className="flex items-center justify-center rounded font-mono font-semibold"
            style={{
              width: isMobile ? 20 : 24,
              height: isMobile ? 16 : 18,
              fontSize: isMobile ? 10 : 11,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
            title="Zoom out"
          >
            −
          </button>
          {/* Clear button — always rendered, visibility via opacity */}
          <button
            onClick={(e) => { e.stopPropagation(); handleClear(); }}
            className="flex items-center justify-center rounded font-mono font-semibold"
            style={{
              width: isMobile ? 20 : 24,
              height: isMobile ? 16 : 18,
              fontSize: isMobile ? 10 : 11,
              background: hasInteracted ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${hasInteracted ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.15)'}`,
              color: hasInteracted ? 'rgba(234,179,8,0.9)' : 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              opacity: hasInteracted ? 1 : 0,
              pointerEvents: hasInteracted ? 'auto' : 'none',
              transition: 'opacity 0.2s',
            }}
            title="Clear filter"
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Middle zone: SVG dots ── */}
      <div
        style={{
          height: DOT_H,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'pan-y',
        }}
      >
        <svg
          ref={svgRef}
          width={containerWidth}
          height={DOT_H}
          style={{
            display: 'block',
            cursor: 'default',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            setHoveredPoint(null);
            isDragging.current = false;
          }}
        >
          {/* Era segment hairlines */}
          {eraWeights.map((w, i) =>
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

          {/* Story range bars when a single era is active */}
          {activeEra &&
            visiblePoints
              .filter(
                (pt) =>
                  pt.endYear - pt.startYear > 0 &&
                  getEraForYear(pt.startYear) === activeEra
              )
              .map((pt) => {
                const isActive =
                  hoveredPoint === pt.storyId || highlightedStoryId === pt.storyId;
                return (
                  <line
                    key={`range-${pt.storyId}`}
                    x1={yearToAdaptiveX(pt.startYear, eraWeights)}
                    y1={DOT_Y}
                    x2={yearToAdaptiveX(
                      Math.min(pt.endYear, ERAS.find((e) => e.id === activeEra)!.end),
                      eraWeights
                    )}
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
            const cx = yearToAdaptiveX(pt.startYear, eraWeights);
            if (cx < -10 || cx > containerWidth + 10) return null;

            const isFiltered = activeEra && getEraForYear(pt.startYear) !== activeEra;
            const isHovered = hoveredPoint === pt.storyId;
            const isScrollHL = highlightedStoryId === pt.storyId;
            const isActive = isHovered || isScrollHL;
            const r = isActive ? DOT_HOVER_RADIUS : isFiltered ? 1.5 : DOT_RADIUS;
            const color = CATEGORIES[pt.category].color;
            const opacity = isFiltered ? 0.12 : isActive ? 1 : 0.85;
            const dotFilter = isActive
              ? `drop-shadow(0 0 5px ${color})`
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
                    r={r + 4}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.5}
                  />
                )}
                {isScrollHL && !isHovered && !isFiltered && (
                  <circle cx={cx} cy={DOT_Y + yOffset} r={r + 7} fill="none" stroke={color} strokeWidth={0.5}>
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
        </svg>

        {/* Tooltip */}
        {hoveredData && (
          <TooltipOverlay
            point={hoveredData}
            x={yearToAdaptiveX(hoveredData.startYear, eraWeights)}
            containerWidth={containerWidth}
            dotY={DOT_Y}
            dotH={DOT_H}
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
          isActive={!activeEra}
          isHighlighted={false}
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
  isMobile,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  isHighlighted: boolean;
  isMobile: boolean;
  onClick: () => void;
}) {
  const chipH = isMobile ? 14 : 16;
  const fontSize = isMobile ? 8 : 9;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="font-mono shrink-0"
      style={{
        height: chipH,
        padding: `0 ${isMobile ? 5 : 7}px`,
        borderRadius: chipH / 2,
        fontSize,
        whiteSpace: 'nowrap',
        border: `1px solid ${
          isActive
            ? 'rgba(234,179,8,0.4)'
            : isHighlighted
            ? 'rgba(234,179,8,0.25)'
            : 'rgba(255,255,255,0.08)'
        }`,
        background: isActive
          ? 'rgba(234,179,8,0.2)'
          : isHighlighted
          ? 'rgba(234,179,8,0.08)'
          : 'rgba(255,255,255,0.04)',
        color: isActive
          ? 'rgba(234,179,8,0.9)'
          : isHighlighted
          ? 'rgba(234,179,8,0.6)'
          : count === 0
          ? 'rgba(255,255,255,0.15)'
          : 'rgba(255,255,255,0.5)',
        cursor: count === 0 && label !== 'All' ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s',
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
