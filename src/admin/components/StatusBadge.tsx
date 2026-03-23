import type { ReviewStatus } from '../../types';

const STATUS_COLORS: Record<ReviewStatus, string> = {
  unreviewed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  'needs-fix': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  unreviewed: 'Unreviewed',
  approved: 'Approved',
  'needs-fix': 'Needs Fix',
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.unreviewed;
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono border rounded ${colors}`}>
      {label}
    </span>
  );
}
