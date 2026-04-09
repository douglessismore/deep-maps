import { useEffect, useRef, useState, useCallback, useLayoutEffect, useMemo, type ReactNode } from 'react';
import type { SheetSnap } from './BottomSheet';

/**
 * ClaudeSheet — Claude's map-first HUD variant.
 *
 * Design philosophy: the map IS the UI. Content lives as a translucent
 * overlay card pinned to the bottom, never dominating. One card at a time
 * in the default view; pull up for the full list.
 *
 * Snap mapping:
 *   'peek'  → card mode   (~30% of screen) — default
 *   'half'  → list mode   (~60% of screen)
 *   'full'  → expanded    (~85% of screen)
 *
 * Fires onSnapChange with standard SheetSnap values so the rest of the
 * app works unchanged.
 */

export interface ClaudeSheetProps {
  children: ReactNode;
  onSnapChange?: (snap: SheetSnap) => void;
  targetSnap?: SheetSnap;
  /** Bumped on every snap request so re-requesting the same target still fires */
  snapRequestKey?: number;
  /** Story or entity name for the floating context pill */
  contextLabel?: string;
  /** e.g. "3 of 7 moments" */
  contextSublabel?: string;
  /** Total moments in the active story */
  momentCount?: number;
  /** 0-based index of the current moment */
  currentMomentIndex?: number;
  /** Category color for the left-border accent */
  categoryColor?: string;
  /** Called when user taps the peek card to expand */
  onExpandRequest?: () => void;
}

// ── Layout constants ──
const CARD_RATIO = 0.30;   // peek: 30% of screen
const LIST_RATIO = 0.60;   // half: 60% of screen
const FULL_TOP = 8;        // full: 8px from top (near-full)
const FLICK_THRESHOLD = 0.5;
const SNAP_DURATION = 350;
const PROGRESS_DOT_SIZE = 6;
const PROGRESS_DOT_GAP = 8;

export function ClaudeSheet({
  children,
  onSnapChange,
  targetSnap,
  snapRequestKey,
  contextLabel,
  contextSublabel,
  momentCount,
  currentMomentIndex,
  categoryColor = '#fff',
  onExpandRequest,
}: ClaudeSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );

  const currentTranslateY = useRef(0);
  const currentSnapRef = useRef<SheetSnap>('peek');
  const initialized = useRef(false);

  const [currentSnap, setCurrentSnap] = useState<SheetSnap>('peek');
  const [pillExpanded, setPillExpanded] = useState(false);

  const isDragging = useRef(false);
  const startY = useRef(0);
  const startTranslateY = useRef(0);
  const lastMoveY = useRef(0);
  const lastMoveTime = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef(0);
  const onSnapChangeRef = useRef(onSnapChange);
  const isAnimating = useRef(false);

  useEffect(() => { onSnapChangeRef.current = onSnapChange; }, [onSnapChange]);

  // ── Snap position calculations ──
  const getSnapPositions = useCallback(() => {
    const container = sheetRef.current?.parentElement;
    const totalH = container ? container.clientHeight : window.innerHeight;
    return {
      peek: totalH * (1 - CARD_RATIO),
      half: totalH * (1 - LIST_RATIO),
      full: FULL_TOP,
    };
  }, []);

  const applyTranslate = useCallback((y: number) => {
    if (!sheetRef.current) return;
    sheetRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
  }, []);

  const snapTo = useCallback((snap: SheetSnap) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const snaps = getSnapPositions();
    const y = snaps[snap];
    currentTranslateY.current = y;
    currentSnapRef.current = snap;
    isAnimating.current = true;
    sheet.style.transition = `transform ${SNAP_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    applyTranslate(y);
    setCurrentSnap(snap);
    setTimeout(() => {
      if (sheet) sheet.style.transition = '';
      isAnimating.current = false;
    }, SNAP_DURATION + 20);
    onSnapChangeRef.current?.(snap);
  }, [getSnapPositions, applyTranslate]);

  const findSnapTarget = useCallback((): SheetSnap => {
    const y = currentTranslateY.current;
    const v = velocity.current;
    const snaps = getSnapPositions();
    const order: SheetSnap[] = ['full', 'half', 'peek'];
    if (Math.abs(v) > FLICK_THRESHOLD) {
      const idx = order.indexOf(currentSnapRef.current);
      if (v < 0 && idx > 0) return order[idx - 1]; // flick up
      if (v > 0 && idx < order.length - 1) return order[idx + 1]; // flick down
    }
    let closest: SheetSnap = 'peek';
    let minDist = Infinity;
    for (const snap of order) {
      const dist = Math.abs(y - snaps[snap]);
      if (dist < minDist) { minDist = dist; closest = snap; }
    }
    return closest;
  }, [getSnapPositions]);

  // ── Media query ──
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Initialize to peek on mobile ──
  useLayoutEffect(() => {
    if (!isMobile || initialized.current || !sheetRef.current) return;
    const container = sheetRef.current.parentElement;
    const totalH = container ? container.clientHeight : window.innerHeight;
    const peekY = totalH * (1 - CARD_RATIO);
    currentTranslateY.current = peekY;
    currentSnapRef.current = 'peek';
    sheetRef.current.style.transform = `translate3d(0, ${peekY}px, 0)`;
    initialized.current = true;
  }, [isMobile]);

  // ── Programmatic snap from parent ──
  // Uses snapRequestKey (a monotonic counter bumped by parent on every
  // request) so that re-requesting the same target still fires this effect.
  // The old prevTargetSnap-value check silently dropped re-requests, which
  // stranded orphan-click flows when the user had dragged back to collapsed.
  const prevSnapRequestKey = useRef(snapRequestKey);
  useEffect(() => {
    if (!isMobile || !initialized.current) return;
    if (snapRequestKey !== prevSnapRequestKey.current) {
      prevSnapRequestKey.current = snapRequestKey;
      if (targetSnap && currentSnapRef.current !== targetSnap) {
        snapTo(targetSnap);
      }
    }
  }, [snapRequestKey, targetSnap, isMobile, snapTo]);

  // ── Touch drag on the entire card top area ──
  useEffect(() => {
    if (!isMobile) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const handle = sheet.querySelector('[data-drag-handle]') as HTMLElement;
    if (!handle) return;

    const DRAG_THRESHOLD = 8;
    let touchStarted = false;
    let dragCommitted = false;

    const onTouchStart = (e: TouchEvent) => {
      if (isAnimating.current) {
        sheet.style.transition = '';
        isAnimating.current = false;
      }
      e.preventDefault();
      touchStarted = true;
      dragCommitted = false;
      startY.current = e.touches[0].clientY;
      startTranslateY.current = currentTranslateY.current;
      lastMoveY.current = e.touches[0].clientY;
      lastMoveTime.current = performance.now();
      velocity.current = 0;
      sheet.style.transition = '';
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStarted) return;
      e.preventDefault();
      const clientY = e.touches[0].clientY;
      const now = performance.now();
      const dt = now - lastMoveTime.current;
      if (dt > 0) velocity.current = (clientY - lastMoveY.current) / dt;
      lastMoveY.current = clientY;
      lastMoveTime.current = now;

      if (!dragCommitted) {
        if (Math.abs(clientY - startY.current) < DRAG_THRESHOLD) return;
        dragCommitted = true;
        isDragging.current = true;
      }

      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const snaps = getSnapPositions();
        const delta = clientY - startY.current;
        const newY = Math.max(snaps.full - 20, Math.min(snaps.peek + 20, startTranslateY.current + delta));
        currentTranslateY.current = newY;
        applyTranslate(newY);
      });
    };

    const onTouchEnd = () => {
      if (!touchStarted) return;
      touchStarted = false;
      if (!dragCommitted) {
        isDragging.current = false;
        // Tap on handle at peek = expand
        if (currentSnapRef.current === 'peek') {
          onExpandRequest?.();
        }
        return;
      }
      isDragging.current = false;
      dragCommitted = false;
      cancelAnimationFrame(rafId.current);
      snapTo(findSnapTarget());
    };

    handle.addEventListener('touchstart', onTouchStart, { passive: false });
    handle.addEventListener('touchmove', onTouchMove, { passive: false });
    handle.addEventListener('touchend', onTouchEnd);

    return () => {
      handle.removeEventListener('touchstart', onTouchStart);
      handle.removeEventListener('touchmove', onTouchMove);
      handle.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(rafId.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, getSnapPositions, applyTranslate, findSnapTarget, snapTo]);

  // ── Content height calculation ──
  const DRAG_AREA_HEIGHT = 28; // Slim drag area — no visible pill
  const visibleContentHeight = useMemo(() => {
    const totalH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const snapPositions = {
      peek: totalH * (1 - CARD_RATIO),
      half: totalH * (1 - LIST_RATIO),
      full: FULL_TOP,
    };
    const translateY = snapPositions[currentSnap];
    return totalH - translateY - DRAG_AREA_HEIGHT;
  }, [currentSnap]);

  // ── Progress dots ──
  const progressDots = useMemo(() => {
    if (!momentCount || momentCount <= 1) return null;
    // Cap visible dots at 12, show abbreviated for longer lists
    const maxDots = 12;
    const showAll = momentCount <= maxDots;
    const dots: { index: number; active: boolean }[] = [];

    if (showAll) {
      for (let i = 0; i < momentCount; i++) {
        dots.push({ index: i, active: i === currentMomentIndex });
      }
    } else {
      // Show first, last, current, and neighbors
      const show = new Set<number>();
      show.add(0);
      show.add(momentCount - 1);
      if (currentMomentIndex != null) {
        for (let i = Math.max(0, currentMomentIndex - 2); i <= Math.min(momentCount - 1, currentMomentIndex + 2); i++) {
          show.add(i);
        }
      }
      const sorted = [...show].sort((a, b) => a - b);
      for (const i of sorted) {
        dots.push({ index: i, active: i === currentMomentIndex });
      }
    }
    return dots;
  }, [momentCount, currentMomentIndex]);

  // ── Desktop: pass-through side panel ──
  if (!isMobile) {
    return (
      <div className="w-[420px] flex-none overflow-hidden flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)]">
        {children}
      </div>
    );
  }

  // ── Mobile: Claude's map-first HUD ──
  const isAtPeek = currentSnap === 'peek';

  return (
    <>
      {/* ── Floating context pill ── */}
      {contextLabel && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[40] flex items-center gap-1.5 px-3 py-1 rounded-full font-mono select-none"
          style={{
            top: 12,
            background: 'var(--bg-primary)',
            opacity: 0.95,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
          }}
          onClick={() => setPillExpanded(!pillExpanded)}
        >
          <span className="text-[11px] text-[var(--text-primary)] truncate max-w-[200px]">
            {contextLabel}
          </span>
          {contextSublabel && (
            <span className="text-[11px] text-[var(--text-muted)]">
              {contextSublabel}
            </span>
          )}
        </div>
      )}

      {/* ── Progress dots ── */}
      {progressDots && progressDots.length > 1 && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[31] flex items-center"
          style={{
            bottom: `calc(${CARD_RATIO * 100}% + 12px)`,
            gap: PROGRESS_DOT_GAP,
            transition: 'bottom 350ms cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
          }}
        >
          {progressDots.map((dot) => (
            <div
              key={dot.index}
              style={{
                width: dot.active ? PROGRESS_DOT_SIZE + 2 : PROGRESS_DOT_SIZE,
                height: dot.active ? PROGRESS_DOT_SIZE + 2 : PROGRESS_DOT_SIZE,
                borderRadius: '50%',
                backgroundColor: dot.active ? categoryColor : 'transparent',
                border: dot.active ? 'none' : `1.5px solid rgba(255, 255, 255, 0.30)`,
                transition: 'all 200ms ease',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Card overlay ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 30, height: '100dvh' }}>
        <div
          ref={sheetRef}
          className="absolute left-0 right-0 pointer-events-auto flex flex-col"
          style={{
            top: 0,
            height: '100%',
            background: 'rgba(17, 17, 17, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -2px 20px rgba(0, 0, 0, 0.3)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform',
            // Category color as left border accent
            borderLeft: `3px solid ${categoryColor}`,
          }}
        >
          {/* Drag area — no visible pill, entire top edge is draggable */}
          <div
            data-drag-handle
            className="shrink-0 cursor-grab active:cursor-grabbing flex items-center justify-center"
            style={{ touchAction: 'none', height: DRAG_AREA_HEIGHT }}
          >
            {/* Subtle visual hint — thin line that's barely visible */}
            <div
              className="rounded-full"
              style={{
                width: 32,
                height: 3,
                background: 'rgba(255, 255, 255, 0.15)',
              }}
            />
          </div>

          {/* Content area */}
          <div
            className="flex flex-col"
            style={{
              overflow: isAtPeek ? 'hidden' : 'auto',
              overscrollBehavior: 'contain',
              height: visibleContentHeight,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
