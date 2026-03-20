import { useEffect, useRef, useState, useCallback, useLayoutEffect, useMemo, type ReactNode } from 'react';
import type { SheetSnap } from './BottomSheet';

/**
 * CinemaSheet — ultra-minimal "cinema mode" variant.
 *
 * Maximum map immersion. Just a translucent 80px banner at the very bottom
 * showing the moment name + subtitle. Tap to expand to a ~40% card.
 * The map takes up nearly 100% of the screen at all times.
 *
 * Snap mapping:
 *   'peek'  → banner mode  (~80px)  — default
 *   'half'  → card mode    (~40% of screen)
 *   'full'  → expanded     (~85% of screen)
 */

export interface CinemaSheetProps {
  children: ReactNode;
  onSnapChange?: (snap: SheetSnap) => void;
  targetSnap?: SheetSnap;
  /** Story or entity name for the banner */
  contextLabel?: string;
  /** e.g. "3 of 7 moments" */
  contextSublabel?: string;
  /** Total moments in the active story */
  momentCount?: number;
  /** 0-based index of the current moment */
  currentMomentIndex?: number;
  /** Category color accent */
  categoryColor?: string;
  /** Called when user taps the banner to expand */
  onExpandRequest?: () => void;
}

// ── Layout constants ──
const BANNER_HEIGHT = 80;
const CARD_RATIO = 0.40;
const FULL_TOP = 8;
const FLICK_THRESHOLD = 0.5;
const SNAP_DURATION = 300;

export function CinemaSheet({
  children,
  onSnapChange,
  targetSnap,
  contextLabel,
  contextSublabel,
  momentCount,
  currentMomentIndex,
  categoryColor = '#fff',
  onExpandRequest,
}: CinemaSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );

  const currentTranslateY = useRef(0);
  const currentSnapRef = useRef<SheetSnap>('peek');
  const initialized = useRef(false);

  const [currentSnap, setCurrentSnap] = useState<SheetSnap>('peek');

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

  // ── Snap positions ──
  const getSnapPositions = useCallback(() => {
    const container = sheetRef.current?.parentElement;
    const totalH = container ? container.clientHeight : window.innerHeight;
    return {
      peek: totalH - BANNER_HEIGHT,
      half: totalH * (1 - CARD_RATIO),
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
      if (v < 0 && idx > 0) return order[idx - 1];
      if (v > 0 && idx < order.length - 1) return order[idx + 1];
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

  // ── Initialize to peek (banner) ──
  useLayoutEffect(() => {
    if (!isMobile || initialized.current || !sheetRef.current) return;
    const container = sheetRef.current.parentElement;
    const totalH = container ? container.clientHeight : window.innerHeight;
    const peekY = totalH - BANNER_HEIGHT;
    currentTranslateY.current = peekY;
    currentSnapRef.current = 'peek';
    sheetRef.current.style.transform = `translate3d(0, ${peekY}px, 0)`;
    initialized.current = true;
  }, [isMobile]);

  // ── Programmatic snap ──
  const prevTargetSnap = useRef(targetSnap);
  useEffect(() => {
    if (!isMobile || !initialized.current) return;
    if (targetSnap && targetSnap !== prevTargetSnap.current) {
      prevTargetSnap.current = targetSnap;
      if (currentSnapRef.current !== targetSnap) {
        snapTo(targetSnap);
      }
    }
  }, [targetSnap, isMobile, snapTo]);

  // ── Touch events ──
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
        // Tap on banner at peek = expand to card
        if (currentSnapRef.current === 'peek') {
          snapTo('half');
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

  // ── Content height ──
  const visibleContentHeight = useMemo(() => {
    const totalH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const snapPositions = {
      peek: totalH - BANNER_HEIGHT,
      half: totalH * (1 - CARD_RATIO),
      full: FULL_TOP,
    };
    const translateY = snapPositions[currentSnap];
    return totalH - translateY;
  }, [currentSnap]);

  // ── Mini progress bar (thin line at the very bottom of the banner) ──
  const progressPercent = useMemo(() => {
    if (!momentCount || momentCount <= 1 || currentMomentIndex == null) return 0;
    return ((currentMomentIndex + 1) / momentCount) * 100;
  }, [momentCount, currentMomentIndex]);

  // ── Desktop: pass-through side panel ──
  if (!isMobile) {
    return (
      <div className="w-[420px] flex-none overflow-hidden flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)]">
        {children}
      </div>
    );
  }

  // ── Mobile: Cinema mode ──
  const isAtPeek = currentSnap === 'peek';

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 30, height: '100dvh' }}>
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 pointer-events-auto flex flex-col"
        style={{
          top: 0,
          height: '100%',
          background: isAtPeek ? 'rgba(0, 0, 0, 0.70)' : 'rgba(17, 17, 17, 0.90)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: isAtPeek ? '12px 12px 0 0' : '20px 20px 0 0',
          boxShadow: '0 -1px 12px rgba(0, 0, 0, 0.2)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform',
          transition: 'background 300ms ease, border-radius 300ms ease',
        }}
      >
        {/* Banner / drag handle area */}
        <div
          data-drag-handle
          className="shrink-0 cursor-grab active:cursor-grabbing"
          style={{
            touchAction: 'none',
            minHeight: isAtPeek ? BANNER_HEIGHT : 36,
          }}
        >
          {isAtPeek ? (
            // ── Banner mode: moment name + subtitle ──
            <div className="flex items-center h-full px-4 py-3">
              {/* Category color accent dot */}
              <div
                className="shrink-0 mr-3 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: categoryColor,
                  boxShadow: `0 0 6px ${categoryColor}40`,
                }}
              />
              <div className="flex-1 min-w-0">
                {contextLabel && (
                  <div className="text-[13px] font-semibold text-white/90 truncate leading-tight">
                    {contextLabel}
                  </div>
                )}
                {contextSublabel && (
                  <div className="text-[11px] font-mono text-white/50 truncate leading-tight mt-0.5">
                    {contextSublabel}
                  </div>
                )}
              </div>
              {/* Expand chevron */}
              <div className="shrink-0 ml-2 text-white/30">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 10L8 6L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ) : (
            // ── Expanded mode: minimal drag hint ──
            <div className="flex items-center justify-center h-full">
              <div
                className="rounded-full"
                style={{
                  width: 28,
                  height: 3,
                  background: 'rgba(255, 255, 255, 0.15)',
                }}
              />
            </div>
          )}

          {/* Thin progress bar at bottom of banner */}
          {progressPercent > 0 && (
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: 0,
                height: 2,
                background: 'rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: categoryColor,
                  opacity: 0.6,
                  transition: 'width 300ms ease',
                }}
              />
            </div>
          )}
        </div>

        {/* Content area — only visible when expanded past banner */}
        <div
          className="flex flex-col"
          style={{
            overflow: isAtPeek ? 'hidden' : 'auto',
            overscrollBehavior: 'contain',
            height: isAtPeek ? 0 : visibleContentHeight - (isAtPeek ? BANNER_HEIGHT : 36),
            opacity: isAtPeek ? 0 : 1,
            transition: 'opacity 200ms ease',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
