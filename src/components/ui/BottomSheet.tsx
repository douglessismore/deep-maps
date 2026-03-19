import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

export type SheetSnap = 'peek' | 'half' | 'full';

interface BottomSheetProps {
  children: ReactNode;
  onSnapChange?: (snap: SheetSnap) => void;
  snapTo?: SheetSnap;
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
 * Sheet position is tracked in BOTH React state (for render) and refs (for 60fps drag).
 * State ensures React never clears the transform; refs ensure smooth drag performance.
 */
export function BottomSheet({ children, onSnapChange, snapTo: snapToProp }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );

  // Sheet Y position — tracked in BOTH state and ref.
  // State: used in inline style so React always renders correct transform.
  // Ref: used during drag for 60fps updates without re-renders.
  const [sheetY, setSheetY] = useState<number | null>(null);
  const currentTranslateY = useRef(0);

  const isDragging = useRef(false);
  const startY = useRef(0);
  const startTranslateY = useRef(0);
  const lastMoveY = useRef(0);
  const lastMoveTime = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef(0);
  const currentSnapRef = useRef<SheetSnap>('half');
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
    // Update React state so inline style stays in sync after animation
    setSheetY(y);
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

  // Listen for media query changes
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Initialize sheet position on mobile
  useEffect(() => {
    if (!isMobile || sheetY !== null) return;
    // Calculate initial half position
    // Use rAF to ensure the container has been laid out
    requestAnimationFrame(() => {
      const container = sheetRef.current?.parentElement;
      const totalH = container ? container.clientHeight : window.innerHeight;
      const halfY = totalH * (1 - HALF_RATIO);
      currentTranslateY.current = halfY;
      setSheetY(halfY);
    });
  }, [isMobile, sheetY]);

  // Handle resize
  useEffect(() => {
    if (!isMobile) return;
    const handler = () => snapTo(currentSnapRef.current);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isMobile, snapTo]);

  // Respond to external snapTo prop changes
  const prevSnapProp = useRef(snapToProp);
  useEffect(() => {
    if (snapToProp && isMobile && snapToProp !== prevSnapProp.current) {
      prevSnapProp.current = snapToProp;
      snapTo(snapToProp);
    }
  }, [snapToProp, isMobile, snapTo]);

  // Touch events on drag handle
  useEffect(() => {
    if (!isMobile) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const handle = sheet.querySelector('[data-drag-handle]') as HTMLElement;
    if (!handle) return;

    // Content area — allow drag-down to collapse when scrolled to top
    const contentArea = sheet.querySelector('[data-sheet-content]') as HTMLElement;
    const contentDragging = { active: false, startScrollTop: 0 };

    const onTouchStart = (e: TouchEvent) => {
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

    // Content area: allow pulling down to collapse the sheet when content is scrolled to top
    const onContentTouchStart = (e: TouchEvent) => {
      if (!contentArea) return;
      contentDragging.startScrollTop = contentArea.scrollTop;
      contentDragging.active = false;
    };

    const onContentTouchMove = (e: TouchEvent) => {
      if (!contentArea) return;
      // If content was at scroll top and user is pulling down, intercept and drag the sheet
      if (contentDragging.startScrollTop <= 0 && !contentDragging.active) {
        const deltaY = e.touches[0].clientY - (lastMoveY.current || e.touches[0].clientY);
        if (deltaY > 5) {
          // User is pulling down from scroll-top — hijack into sheet drag
          contentDragging.active = true;
          isDragging.current = true;
          startY.current = e.touches[0].clientY;
          startTranslateY.current = currentTranslateY.current;
          lastMoveY.current = e.touches[0].clientY;
          lastMoveTime.current = performance.now();
          velocity.current = 0;
          sheet.style.transition = '';
          e.preventDefault();
          return;
        }
      }
      if (contentDragging.active) {
        e.preventDefault();
        onTouchMove(e);
      }
    };

    const onContentTouchEnd = () => {
      if (contentDragging.active) {
        contentDragging.active = false;
        onTouchEnd();
      }
    };

    handle.addEventListener('touchstart', onTouchStart, { passive: false });
    handle.addEventListener('touchmove', onTouchMove, { passive: false });
    handle.addEventListener('touchend', onTouchEnd);

    if (contentArea) {
      contentArea.addEventListener('touchstart', onContentTouchStart, { passive: true });
      contentArea.addEventListener('touchmove', onContentTouchMove, { passive: false });
      contentArea.addEventListener('touchend', onContentTouchEnd);
    }

    return () => {
      handle.removeEventListener('touchstart', onTouchStart);
      handle.removeEventListener('touchmove', onTouchMove);
      handle.removeEventListener('touchend', onTouchEnd);
      if (contentArea) {
        contentArea.removeEventListener('touchstart', onContentTouchStart);
        contentArea.removeEventListener('touchmove', onContentTouchMove);
        contentArea.removeEventListener('touchend', onContentTouchEnd);
      }
      cancelAnimationFrame(rafId.current);
    };
  // Note: sheetY intentionally excluded — handlers use currentTranslateY ref, not state.
  // Including sheetY caused listener teardown/reattach on every snap, which could leave
  // the handle without listeners during rapid tab/mode changes.
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

  // Compute transform: use state value, or start off-screen if not yet initialized
  const transformValue = sheetY !== null
    ? `translate3d(0, ${sheetY}px, 0)`
    : 'translate3d(0, 100%, 0)';

  // Remove border-radius at full snap to avoid corner gap against top bar
  const isFullSnap = sheetY !== null && sheetY <= FULL_TOP + 20;

  // ── Mobile: bottom sheet overlay ──
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
          transform: transformValue,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
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
        <div data-sheet-content className="flex-1 overflow-hidden flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
