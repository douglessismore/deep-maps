import { useEffect, useRef, useState, useCallback, useLayoutEffect, type ReactNode } from 'react';

export type SheetSnap = 'peek' | 'half' | 'full';

interface BottomSheetProps {
  children: ReactNode;
  /** Called when user DRAGS to a new snap position */
  onSnapChange?: (snap: SheetSnap) => void;
}

const PEEK_HEIGHT = 140;
const HALF_RATIO = 0.55;
const FULL_TOP = 8;
const FLICK_THRESHOLD = 0.5;
const SNAP_DURATION = 400;

/**
 * Google/Apple Maps-style bottom sheet overlay on mobile.
 * On desktop (lg:), renders as a standard side panel pass-through.
 *
 * RULES:
 * 1. The sheet only moves when the USER drags it. No programmatic snapping.
 * 2. `currentTranslateY` ref exclusively owns the DOM transform.
 *    React NEVER sets transform — so re-renders can't override position.
 * 3. No resize handler — the browser address bar collapsing/expanding fires
 *    resize events that caused the sheet to jump. The sheet stays at its
 *    pixel position; the user can drag to adjust if needed.
 */
export function BottomSheet({ children, onSnapChange }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );

  const currentTranslateY = useRef(0);
  const currentSnapRef = useRef<SheetSnap>('half');
  const initialized = useRef(false);

  const [currentSnap, setCurrentSnap] = useState<SheetSnap>('half');

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

  const getSnapPositions = useCallback(() => {
    const container = sheetRef.current?.parentElement;
    const totalH = container ? container.clientHeight : window.innerHeight;
    return {
      peek: totalH - PEEK_HEIGHT,
      half: totalH * (1 - HALF_RATIO),
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
    let closest: SheetSnap = 'half';
    let minDist = Infinity;
    for (const snap of order) {
      const dist = Math.abs(y - snaps[snap]);
      if (dist < minDist) { minDist = dist; closest = snap; }
    }
    return closest;
  }, [getSnapPositions]);

  // Media query
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Initialize sheet to half on mobile — useLayoutEffect runs before paint, no flash.
  useLayoutEffect(() => {
    if (!isMobile || initialized.current || !sheetRef.current) return;
    const container = sheetRef.current.parentElement;
    const totalH = container ? container.clientHeight : window.innerHeight;
    const halfY = totalH * (1 - HALF_RATIO);
    currentTranslateY.current = halfY;
    currentSnapRef.current = 'half';
    sheetRef.current.style.transform = `translate3d(0, ${halfY}px, 0)`;
    initialized.current = true;
  }, [isMobile]);

  // NO resize handler — the mobile browser's address bar collapsing/expanding
  // fires resize events that caused the sheet to jump (26 snapTo calls in a row).
  // The sheet stays at its pixel position. User drags to adjust if needed.

  // Touch events — drag handle ONLY
  useEffect(() => {
    if (!isMobile) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const handle = sheet.querySelector('[data-drag-handle]') as HTMLElement;
    if (!handle) return;

    const onTouchStart = (e: TouchEvent) => {
      if (isAnimating.current) return;
      e.preventDefault();
      isDragging.current = true;
      startY.current = e.touches[0].clientY;
      startTranslateY.current = currentTranslateY.current;
      lastMoveY.current = e.touches[0].clientY;
      lastMoveTime.current = performance.now();
      velocity.current = 0;
      sheet.style.transition = '';
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const clientY = e.touches[0].clientY;
      const now = performance.now();
      const dt = now - lastMoveTime.current;
      if (dt > 0) velocity.current = (clientY - lastMoveY.current) / dt;
      lastMoveY.current = clientY;
      lastMoveTime.current = now;
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
      if (!isDragging.current) return;
      isDragging.current = false;
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

  // ── Desktop: pass-through side panel ──
  if (!isMobile) {
    return (
      <div className="w-[420px] flex-none overflow-hidden flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)]">
        {children}
      </div>
    );
  }

  const isFullSnap = currentSnap === 'full';

  // ── Mobile: bottom sheet overlay ──
  // No inline `transform` — the ref exclusively owns it via applyTranslate.
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
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
          className="shrink-0 cursor-grab active:cursor-grabbing flex items-center justify-center"
          style={{ touchAction: 'none', height: 48 }}
        >
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Content — overscroll-behavior:contain prevents scroll chaining to parent */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ overscrollBehavior: 'contain' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
