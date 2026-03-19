import { useEffect, useRef, useState, useCallback, useLayoutEffect, type ReactNode } from 'react';

export type SheetSnap = 'peek' | 'half' | 'full';

interface BottomSheetProps {
  children: ReactNode;
  onSnapChange?: (snap: SheetSnap) => void;
  snapTo?: SheetSnap;
  /** Increment to force a re-snap even if snapTo value hasn't changed */
  snapKey?: number;
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
 * ARCHITECTURE: Single source of truth.
 * - `currentTranslateY` ref owns the DOM transform at all times.
 * - React NEVER sets an inline transform style — the ref controls the DOM directly.
 * - `currentSnap` state exists only for derived rendering (rounded corners).
 * - This eliminates the dual-state drift that caused sheets to jump/expand unexpectedly.
 */
export function BottomSheet({ children, onSnapChange, snapTo: snapToProp, snapKey }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );

  // SINGLE source of truth for sheet position (the ref)
  const currentTranslateY = useRef(0);
  const currentSnapRef = useRef<SheetSnap>('half');
  const initialized = useRef(false);

  // React state ONLY for derived rendering (rounded corners, etc.)
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

  const snapTo = useCallback((snap: SheetSnap, notify = true) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const snaps = getSnapPositions();
    const y = snaps[snap];
    currentTranslateY.current = y;
    currentSnapRef.current = snap;
    isAnimating.current = true;
    sheet.style.transition = `transform ${SNAP_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    applyTranslate(y);
    // Update React state for rounded corners
    setCurrentSnap(snap);
    setTimeout(() => {
      if (sheet) sheet.style.transition = '';
      isAnimating.current = false;
    }, SNAP_DURATION + 20);
    if (notify) onSnapChangeRef.current?.(snap);
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

  // Initialize sheet position on mobile — useLayoutEffect runs synchronously before paint.
  // Since `transform` is NOT in the style prop, React never touches it — the ref owns it.
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

  // Handle resize
  useEffect(() => {
    if (!isMobile) return;
    const handler = () => snapTo(currentSnapRef.current, false);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isMobile, snapTo]);

  // Respond to external snapTo prop OR snapKey changes.
  // useLayoutEffect ensures this runs before paint — no visual flash.
  const prevSnapKey = useRef(snapKey);
  const prevSnapProp = useRef(snapToProp);
  useLayoutEffect(() => {
    if (!snapToProp || !isMobile) return;
    const keyChanged = snapKey !== prevSnapKey.current;
    const propChanged = snapToProp !== prevSnapProp.current;
    prevSnapKey.current = snapKey;
    prevSnapProp.current = snapToProp;
    if (keyChanged || propChanged) {
      // Don't notify parent — this is the parent telling US to snap
      snapTo(snapToProp, false);
    }
  }, [snapToProp, snapKey, isMobile, snapTo]);

  // Touch events on drag handle only
  useEffect(() => {
    if (!isMobile) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const handle = sheet.querySelector('[data-drag-handle]') as HTMLElement;
    if (!handle) return;

    const onTouchStart = (e: TouchEvent) => {
      // Don't start drag if animating a snap
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

  // Remove border-radius when at full snap
  const isFullSnap = currentSnap === 'full';

  // ── Mobile: bottom sheet overlay ──
  // NOTE: No inline `transform` style — the ref controls the DOM directly via applyTranslate.
  // This prevents React re-renders from fighting with the ref's position.
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
          // NO transform here — the ref exclusively owns the CSS transform property.
          // If React sets transform in the style prop, it re-applies it on EVERY re-render,
          // overwriting whatever the ref set via applyTranslate. This was the root cause
          // of the sheet jumping to unexpected positions during content scrolling/navigation.
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

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
