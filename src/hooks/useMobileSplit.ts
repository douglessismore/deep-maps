import { useRef, useEffect, useCallback } from 'react';

export type SplitSnap = 'peek' | 'half' | 'full';

interface UseMobileSplitOptions {
  /** Starting snap position (default: 'half') */
  initialSnap?: SplitSnap;
  /** Called when snap position changes */
  onSnapChange?: (snap: SplitSnap) => void;
}

/** Map height as fraction of container height for each snap */
const SNAP_RATIOS: Record<SplitSnap, number> = {
  peek: 0.15,  // 15% map, 85% panel — max card space
  half: 0.50,  // 50/50 balanced view
  full: 0.85,  // 85% map, 15% panel — max map
};

const SNAP_ORDER: SplitSnap[] = ['peek', 'half', 'full'];
const FLICK_VELOCITY_THRESHOLD = 0.4; // px/ms — above this, snap in flick direction
const SNAP_TRANSITION = 'flex-basis 400ms cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Draggable split between map and panel on mobile.
 * Direct DOM manipulation during drag for 60fps.
 * No-op on desktop (lg: breakpoint).
 */
export function useMobileSplit(options: UseMobileSplitOptions = {}) {
  const { initialSnap = 'half', onSnapChange } = options;

  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // Drag state — all refs to avoid re-renders during drag
  const currentRatio = useRef(SNAP_RATIOS[initialSnap]);
  const currentSnapRef = useRef<SplitSnap>(initialSnap);
  const dragStartY = useRef(0);
  const dragStartRatio = useRef(0);
  const lastMoveY = useRef(0);
  const lastMoveTime = useRef(0);
  const velocity = useRef(0);
  const isDragging = useRef(false);
  const rafId = useRef(0);
  const isMobileRef = useRef(false);
  const containerHeight = useRef(0);
  const onSnapChangeRef = useRef(onSnapChange);

  // Keep callback ref fresh
  useEffect(() => {
    onSnapChangeRef.current = onSnapChange;
  }, [onSnapChange]);

  /** Apply current ratio to DOM elements */
  const applyRatio = useCallback((ratio: number) => {
    const mapEl = mapRef.current;
    const panelEl = panelRef.current;
    if (!mapEl || !panelEl) return;

    const mapPercent = `${(ratio * 100).toFixed(2)}%`;
    const panelPercent = `${((1 - ratio) * 100).toFixed(2)}%`;
    mapEl.style.flexBasis = mapPercent;
    panelEl.style.flexBasis = panelPercent;
  }, []);

  /** Snap to a named position with animation */
  const snapTo = useCallback((snap: SplitSnap) => {
    const mapEl = mapRef.current;
    const panelEl = panelRef.current;
    if (!mapEl || !panelEl || !isMobileRef.current) return;

    const ratio = SNAP_RATIOS[snap];
    currentRatio.current = ratio;
    currentSnapRef.current = snap;

    // Add transition for smooth snap
    mapEl.style.transition = SNAP_TRANSITION;
    panelEl.style.transition = SNAP_TRANSITION;
    applyRatio(ratio);

    // Remove transition after animation completes
    const cleanup = () => {
      mapEl.style.transition = '';
      panelEl.style.transition = '';
    };
    setTimeout(cleanup, 420);

    onSnapChangeRef.current?.(snap);
  }, [applyRatio]);

  /** Find nearest snap, accounting for flick velocity */
  const findSnapTarget = useCallback((): SplitSnap => {
    const ratio = currentRatio.current;
    const v = velocity.current;

    // Flick detection: if moving fast enough, snap in that direction
    if (Math.abs(v) > FLICK_VELOCITY_THRESHOLD) {
      const currentIdx = SNAP_ORDER.indexOf(currentSnapRef.current);
      if (v < 0 && currentIdx < SNAP_ORDER.length - 1) {
        // Dragging up = more map = next snap toward 'full'
        return SNAP_ORDER[currentIdx + 1];
      }
      if (v > 0 && currentIdx > 0) {
        // Dragging down = more panel = next snap toward 'peek'
        return SNAP_ORDER[currentIdx - 1];
      }
    }

    // Otherwise snap to nearest
    let closest: SplitSnap = 'half';
    let minDist = Infinity;
    for (const snap of SNAP_ORDER) {
      const dist = Math.abs(ratio - SNAP_RATIOS[snap]);
      if (dist < minDist) {
        minDist = dist;
        closest = snap;
      }
    }
    return closest;
  }, []);

  // Initialize: detect mobile, set initial sizes, attach touch listeners
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    isMobileRef.current = mq.matches;

    const handleMediaChange = (e: MediaQueryListEvent) => {
      isMobileRef.current = e.matches;
      if (e.matches) {
        // Switched to mobile — apply current ratio
        applyRatio(currentRatio.current);
      } else {
        // Switched to desktop — clear inline styles so Tailwind lg: classes take over
        const mapEl = mapRef.current;
        const panelEl = panelRef.current;
        if (mapEl) { mapEl.style.flexBasis = ''; mapEl.style.transition = ''; }
        if (panelEl) { panelEl.style.flexBasis = ''; panelEl.style.transition = ''; }
      }
    };

    mq.addEventListener('change', handleMediaChange);

    // Set initial sizes on mobile
    if (isMobileRef.current) {
      applyRatio(currentRatio.current);
    }

    return () => {
      mq.removeEventListener('change', handleMediaChange);
    };
  }, [applyRatio]);

  // Attach touch events on the handle
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const onTouchStart = (e: TouchEvent) => {
      if (!isMobileRef.current) return;
      e.preventDefault();

      // Measure container height at drag start
      const container = mapRef.current?.parentElement;
      containerHeight.current = container ? container.clientHeight : window.innerHeight;

      isDragging.current = true;
      dragStartY.current = e.touches[0].clientY;
      dragStartRatio.current = currentRatio.current;
      lastMoveY.current = e.touches[0].clientY;
      lastMoveTime.current = performance.now();
      velocity.current = 0;

      // Remove any lingering transition during drag
      const mapEl = mapRef.current;
      const panelEl = panelRef.current;
      if (mapEl) { mapEl.style.transition = ''; mapEl.style.willChange = 'flex-basis'; }
      if (panelEl) { panelEl.style.transition = ''; panelEl.style.willChange = 'flex-basis'; }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();

      const clientY = e.touches[0].clientY;
      const now = performance.now();
      const dt = now - lastMoveTime.current;
      if (dt > 0) {
        velocity.current = (clientY - lastMoveY.current) / dt;
      }
      lastMoveY.current = clientY;
      lastMoveTime.current = now;

      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const deltaY = clientY - dragStartY.current;
        // Moving up (negative deltaY) = handle moves up = more map
        const deltaRatio = -deltaY / containerHeight.current;
        const newRatio = Math.max(0.10, Math.min(0.90, dragStartRatio.current + deltaRatio));
        currentRatio.current = newRatio;
        applyRatio(newRatio);
      });
    };

    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      cancelAnimationFrame(rafId.current);

      // Clear will-change
      const mapEl = mapRef.current;
      const panelEl = panelRef.current;
      if (mapEl) mapEl.style.willChange = '';
      if (panelEl) panelEl.style.willChange = '';

      // Note: velocity is negative when dragging up (toward more map)
      // Invert for our logic: negative velocity = dragging up = should go toward 'full'
      velocity.current = -velocity.current;
      const target = findSnapTarget();
      snapTo(target);
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
  }, [applyRatio, findSnapTarget, snapTo]);

  return { mapRef, panelRef, handleRef, snapTo, isDragging };
}
