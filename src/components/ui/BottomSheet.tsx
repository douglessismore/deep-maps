import { useEffect, useRef, useState, useCallback, useLayoutEffect, useMemo, type ReactNode } from 'react';
import { useUIVariant } from '../../lib/uiVariant';

export type SheetSnap = 'peek' | 'half' | 'full';

interface BottomSheetProps {
  children: ReactNode;
  /** Called when user DRAGS to a new snap position */
  onSnapChange?: (snap: SheetSnap) => void;
  /** Programmatic snap — when this changes, the sheet animates to this position */
  targetSnap?: SheetSnap;
  /** Contextual label for spotlight handle (e.g. story name) */
  contextLabel?: string;
  /** Contextual sublabel for spotlight handle (e.g. "3 of 7 moments") */
  contextSublabel?: string;
  /** Called when user taps the peek card in spotlight mode to expand */
  onExpandRequest?: () => void;
}

const PEEK_HEIGHT = 260;
const SPOTLIGHT_PEEK_HEIGHT = 300;
const HALF_RATIO = 0.55;
const FULL_TOP = 8;
const FLICK_THRESHOLD = 0.5;
const SNAP_DURATION = 400;

/**
 * Google/Apple Maps-style bottom sheet overlay on mobile.
 * On desktop (lg:), renders as a standard side panel pass-through.
 *
 * Supports 3 UI variants:
 * - current: Original 3-snap (peek/half/full) bottom sheet
 * - spotlight: 2-snap (peek/full) with contextual drag handle
 * - split: No bottom sheet — returns a simple flex container (parent handles layout)
 *
 * RULES:
 * 1. The sheet only moves when the USER drags it. No programmatic snapping.
 * 2. `currentTranslateY` ref exclusively owns the DOM transform.
 *    React NEVER sets transform — so re-renders can't override position.
 * 3. No resize handler — the browser address bar collapsing/expanding fires
 *    resize events that caused the sheet to jump. The sheet stays at its
 *    pixel position; the user can drag to adjust if needed.
 */
export function BottomSheet({ children, onSnapChange, targetSnap, contextLabel, contextSublabel, onExpandRequest }: BottomSheetProps) {
  const { variant } = useUIVariant();
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

  const isSpotlight = variant === 'spotlight';
  const peekHeight = isSpotlight ? SPOTLIGHT_PEEK_HEIGHT : PEEK_HEIGHT;

  const getSnapPositions = useCallback(() => {
    const container = sheetRef.current?.parentElement;
    const totalH = container ? container.clientHeight : window.innerHeight;
    if (isSpotlight) {
      // Spotlight: only peek and full. 'half' maps to 'full' so code referencing it won't break.
      return {
        peek: totalH - peekHeight,
        half: FULL_TOP, // half → full for spotlight
        full: FULL_TOP,
      };
    }
    return {
      peek: totalH - peekHeight,
      half: totalH * (1 - HALF_RATIO),
      full: FULL_TOP,
    };
  }, [isSpotlight, peekHeight]);

  const applyTranslate = useCallback((y: number) => {
    if (!sheetRef.current) return;
    sheetRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
  }, []);

  const snapTo = useCallback((snap: SheetSnap) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    // For spotlight, remap 'half' to 'full'
    const effectiveSnap: SheetSnap = (isSpotlight && snap === 'half') ? 'full' : snap;
    const snaps = getSnapPositions();
    const y = snaps[effectiveSnap];
    currentTranslateY.current = y;
    currentSnapRef.current = effectiveSnap;
    isAnimating.current = true;
    sheet.style.transition = `transform ${SNAP_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    applyTranslate(y);
    setCurrentSnap(effectiveSnap);
    setTimeout(() => {
      if (sheet) sheet.style.transition = '';
      isAnimating.current = false;
    }, SNAP_DURATION + 20);
    onSnapChangeRef.current?.(effectiveSnap);
  }, [getSnapPositions, applyTranslate, isSpotlight]);

  const findSnapTarget = useCallback((): SheetSnap => {
    const y = currentTranslateY.current;
    const v = velocity.current;
    const snaps = getSnapPositions();
    const order: SheetSnap[] = isSpotlight ? ['full', 'peek'] : ['full', 'half', 'peek'];
    if (Math.abs(v) > FLICK_THRESHOLD) {
      const idx = order.indexOf(currentSnapRef.current);
      if (v < 0 && idx > 0) return order[idx - 1];
      if (v > 0 && idx < order.length - 1) return order[idx + 1];
    }
    let closest: SheetSnap = isSpotlight ? 'peek' : 'half';
    let minDist = Infinity;
    for (const snap of order) {
      const dist = Math.abs(y - snaps[snap]);
      if (dist < minDist) { minDist = dist; closest = snap; }
    }
    return closest;
  }, [getSnapPositions, isSpotlight]);

  // Media query
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Initialize sheet to peek on mobile — shows more map on first load.
  // useLayoutEffect runs before paint, no flash.
  useLayoutEffect(() => {
    if (!isMobile || initialized.current || !sheetRef.current) return;
    // Split variant doesn't use sheet positioning
    if (variant === 'split') return;
    const container = sheetRef.current.parentElement;
    const totalH = container ? container.clientHeight : window.innerHeight;
    const peekY = totalH - peekHeight;
    currentTranslateY.current = peekY;
    currentSnapRef.current = 'peek';
    sheetRef.current.style.transform = `translate3d(0, ${peekY}px, 0)`;
    initialized.current = true;
  }, [isMobile, variant, peekHeight]);

  // Programmatic snap — parent can tell the sheet to move (e.g., expand on navigation)
  const prevTargetSnap = useRef(targetSnap);
  useEffect(() => {
    if (!isMobile || !initialized.current) return;
    if (variant === 'split') return;
    if (targetSnap && targetSnap !== prevTargetSnap.current) {
      prevTargetSnap.current = targetSnap;
      // Only snap if we're not already at the target
      if (currentSnapRef.current !== targetSnap) {
        snapTo(targetSnap);
      }
    }
  }, [targetSnap, isMobile, snapTo, variant]);

  // Re-initialize when variant changes (e.g., user toggles from split → current)
  const prevVariant = useRef(variant);
  useLayoutEffect(() => {
    if (variant === prevVariant.current) return;
    prevVariant.current = variant;
    // Reset initialization so the sheet re-positions on next layout
    initialized.current = false;
    if (variant !== 'split' && isMobile && sheetRef.current) {
      const container = sheetRef.current.parentElement;
      const totalH = container ? container.clientHeight : window.innerHeight;
      const peekY = totalH - peekHeight;
      currentTranslateY.current = peekY;
      currentSnapRef.current = 'peek';
      sheetRef.current.style.transform = `translate3d(0, ${peekY}px, 0)`;
      setCurrentSnap('peek');
      initialized.current = true;
      onSnapChangeRef.current?.('peek');
    }
  }, [variant, isMobile, peekHeight]);

  // Touch events — drag handle ONLY
  useEffect(() => {
    if (!isMobile || variant === 'split') return;
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
  }, [isMobile, variant, getSnapPositions, applyTranslate, findSnapTarget, snapTo]);

  // ── Desktop: pass-through side panel (always, regardless of variant) ──
  if (!isMobile) {
    return (
      <div className="w-[420px] flex-none overflow-hidden flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)]">
        {children}
      </div>
    );
  }

  // ── Mobile: Split variant — simple flex container, no sheet ──
  if (variant === 'split') {
    return (
      <div className="flex-1 overflow-hidden flex flex-col bg-[var(--bg-primary)]">
        {children}
      </div>
    );
  }

  // ── Mobile: Current / Spotlight — bottom sheet overlay ──
  const isFullSnap = currentSnap === 'full';

  const HANDLE_HEIGHT = isSpotlight ? 64 : 48;
  const visibleContentHeight = useMemo(() => {
    const totalH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const effectivePeekHeight = isSpotlight ? SPOTLIGHT_PEEK_HEIGHT : PEEK_HEIGHT;
    const snapPositions = {
      peek: totalH - effectivePeekHeight,
      half: isSpotlight ? FULL_TOP : totalH * (1 - HALF_RATIO),
      full: FULL_TOP,
    };
    const translateY = snapPositions[currentSnap];
    return totalH - translateY - HANDLE_HEIGHT;
  }, [currentSnap, isSpotlight, HANDLE_HEIGHT]);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 30, height: '100dvh' }}>
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 pointer-events-auto flex flex-col"
        style={{
          top: 0,
          height: '100%',
          background: 'var(--bg-primary)',
          borderRadius: isFullSnap ? '0' : '16px 16px 0 0',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
      >
        {/* Drag handle */}
        <div
          data-drag-handle
          className="shrink-0 cursor-grab active:cursor-grabbing flex flex-col items-center justify-center"
          style={{ touchAction: 'none', height: HANDLE_HEIGHT }}
          onClick={() => {
            // Spotlight: tapping handle at peek expands to full
            if (isSpotlight && currentSnap === 'peek') {
              onExpandRequest?.();
            }
          }}
        >
          <div className={`${isSpotlight ? 'w-8' : 'w-10'} h-1 bg-[var(--text-muted)] rounded-full`} />
          {isSpotlight && (contextLabel || contextSublabel) && (
            <div className="mt-1.5 text-center px-4 max-w-full">
              <div className="text-[10px] font-mono text-[var(--text-muted)] truncate leading-tight">
                {contextLabel && <span className="text-[var(--text-secondary)]">{contextLabel}</span>}
                {contextLabel && contextSublabel && <span className="mx-1">·</span>}
                {contextSublabel}
              </div>
            </div>
          )}
        </div>

        {/* Content — height limited to visible portion so scroll doesn't extend below viewport */}
        <div className="overflow-hidden flex flex-col" style={{
          overscrollBehavior: 'contain',
          height: visibleContentHeight,
          minHeight: 0,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
