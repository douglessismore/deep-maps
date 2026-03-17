import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';

type Snap = 'peek' | 'half';

interface BottomSheetProps {
  children: ReactNode;
  /** Height of app header + timeline to avoid overlap */
  headerOffset?: number;
  /** Called when snap state changes */
  onSnapChange?: (snap: Snap) => void;
  /** Initial snap position */
  initialSnap?: Snap;
  /** Whether to show the sheet (false = hidden/collapsed) */
  visible?: boolean;
}

/**
 * Mobile-only draggable bottom sheet for explore mode.
 * Two snap points: peek (~140px visible) and half (~50vh).
 * On desktop (lg:), renders children in a pass-through side panel.
 */
export function BottomSheet({
  children,
  headerOffset = 0,
  onSnapChange,
  initialSnap = 'half',
  visible = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Drag state (refs to avoid re-renders during drag)
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startTranslateY = useRef(0);
  const currentY = useRef(0);
  const rafId = useRef(0);

  const [currentSnap, setCurrentSnap] = useState<Snap>(initialSnap);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile vs desktop
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Calculate snap positions based on actual container height
  const getSnapPositions = useCallback(() => {
    // Use the sheet's parent container height (accounts for header/timeline above)
    const container = sheetRef.current?.parentElement;
    const totalH = container ? container.clientHeight : (window.innerHeight - headerOffset);
    return {
      peek: totalH - 140,  // 140px visible from bottom
      half: totalH * 0.42, // ~58% of available height visible (more content)
    };
  }, [headerOffset]);

  // Set initial position
  useEffect(() => {
    if (!isMobile || !sheetRef.current) return;
    const snaps = getSnapPositions();
    const y = snaps[initialSnap];
    sheetRef.current.style.transform = `translateY(${y}px)`;
    currentY.current = y;
  }, [isMobile, headerOffset, initialSnap, getSnapPositions]);

  // Snap to a position
  const snapTo = useCallback((snap: Snap) => {
    if (!sheetRef.current) return;
    const snaps = getSnapPositions();
    const y = snaps[snap];
    currentY.current = y;
    setCurrentSnap(snap);
    setIsSnapping(true);
    sheetRef.current.style.transform = `translateY(${y}px)`;
    onSnapChange?.(snap);

    // Remove snapping class after animation
    setTimeout(() => setIsSnapping(false), 400);
  }, [getSnapPositions, onSnapChange]);

  // Handle window resize
  useEffect(() => {
    const handler = () => {
      if (!isMobile) return;
      snapTo(currentSnap);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isMobile, currentSnap, snapTo]);

  // ── Touch/mouse handling on drag handle ──
  const handleDragStart = useCallback((clientY: number) => {
    if (!sheetRef.current) return;
    isDragging.current = true;
    startY.current = clientY;
    startTranslateY.current = currentY.current;
    setIsSnapping(false);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging.current || !sheetRef.current) return;
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const snaps = getSnapPositions();
      const delta = clientY - startY.current;
      const newY = Math.max(snaps.half, Math.min(snaps.peek, startTranslateY.current + delta));
      currentY.current = newY;
      sheetRef.current!.style.transform = `translateY(${newY}px)`;
    });
  }, [getSnapPositions]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    cancelAnimationFrame(rafId.current);

    const snaps = getSnapPositions();
    // Find nearest snap
    const distPeek = Math.abs(currentY.current - snaps.peek);
    const distHalf = Math.abs(currentY.current - snaps.half);
    snapTo(distPeek < distHalf ? 'peek' : 'half');
  }, [getSnapPositions, snapTo]);

  // Touch events on handle
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse events on handle (for desktop testing)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();
    if (isMobile) return; // Touch handles mobile
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleDragMove, handleDragEnd, isMobile]);

  // ── Desktop: don't render (standard panel handles desktop) ──
  if (!isMobile) {
    return null;
  }

  // ── Mobile: bottom sheet ──
  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ top: headerOffset, zIndex: 30 }}>
      <div
        ref={sheetRef}
        className={`absolute left-0 right-0 pointer-events-auto flex flex-col ${
          isSnapping ? 'transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]' : ''
        }`}
        style={{
          height: '100%',
          background: 'var(--bg-primary)',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
          willChange: 'transform',
        }}
      >
        {/* Drag handle */}
        <div
          className="shrink-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none', padding: '10px 0 6px' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={(e) => handleDragStart(e.clientY)}
        >
          <div className="w-9 h-1 bg-white/20 rounded-full mx-auto" />
        </div>

        {/* Content area — no scroll in sheet, panels handle their own scroll */}
        <div
          ref={contentRef}
          className="flex-1 overflow-hidden flex flex-col"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
