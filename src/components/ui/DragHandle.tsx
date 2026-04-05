import { forwardRef } from 'react';

/**
 * Visual drag handle between map and panel on mobile.
 * 44px invisible touch target with a centered pill indicator.
 * Hidden on desktop (lg:).
 */
export const DragHandle = forwardRef<HTMLDivElement>(function DragHandle(_props, ref) {
  return (
    <div
      ref={ref}
      className="lg:hidden relative z-20 flex items-center justify-center shrink-0"
      style={{
        height: 44,
        // Overlap map and panel slightly so the handle sits on the border
        marginTop: -22,
        marginBottom: -22,
        touchAction: 'none',
        cursor: 'grab',
      }}
    >
      {/* Background band for visibility */}
      <div
        className="absolute inset-x-0 pointer-events-none rounded-sm"
        style={{
          top: 14,
          bottom: 14,
          background: 'var(--bg-primary)',
          opacity: 0.8,
          backdropFilter: 'blur(4px)',
        }}
      />
      {/* Pill indicator */}
      <div className="w-10 h-1 bg-[var(--text-muted)] rounded-full relative z-10" />
    </div>
  );
});
