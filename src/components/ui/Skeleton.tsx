/**
 * Skeleton loading placeholders with shimmer animation.
 * Uses .skeleton-bone CSS class from index.css for the gradient shimmer effect.
 */

function SkeletonStoryCard() {
  return (
    <div className="bg-[var(--bg-card)] rounded-[14px] overflow-hidden border border-[var(--border-subtle)]">
      {/* Category color bar placeholder */}
      <div className="h-[3px] skeleton-bone" style={{ borderRadius: 0 }} />
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="skeleton-bone" style={{ width: '60%', height: 16 }} />
        {/* Description lines */}
        <div className="space-y-2">
          <div className="skeleton-bone" style={{ width: '90%', height: 12 }} />
          <div className="skeleton-bone" style={{ width: '70%', height: 12 }} />
        </div>
        {/* Footer badges */}
        <div className="flex gap-2 pt-1">
          <div className="skeleton-bone" style={{ width: 48, height: 16 }} />
          <div className="skeleton-bone" style={{ width: 64, height: 16 }} />
        </div>
      </div>
    </div>
  );
}

function SkeletonTabBar() {
  return (
    <div className="flex border-b border-[var(--border-subtle)] shrink-0 px-2 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex-1 py-3 flex justify-center">
          <div className="skeleton-bone" style={{ width: 48 + i * 8, height: 12 }} />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <SkeletonTabBar />
      <div className="flex-1 overflow-hidden p-3 space-y-3">
        <SkeletonStoryCard />
        <SkeletonStoryCard />
        <SkeletonStoryCard />
      </div>
    </div>
  );
}
