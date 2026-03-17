import { useState, useEffect, type ReactNode } from 'react';

/**
 * Lightweight fade-in wrapper for mode transitions.
 * Renders children at opacity 0, then transitions to opacity 1 on the next frame.
 * Use with a `key` prop to trigger fade on mount (e.g., key={mode}).
 */
export function FadeIn({ children, duration = 200 }: { children: ReactNode; duration?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // rAF ensures the browser has painted opacity:0 before transitioning
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="flex-1 flex flex-col"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${duration}ms ease`,
      }}
    >
      {children}
    </div>
  );
}
