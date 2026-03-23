import { useState } from 'react';
import { useAdminData } from '../AdminDataProvider';
import type { NormalizedItem } from './ContentRow';
import type { ReviewStatus, AdminItemType } from '../../types';

// Map item_type to Supabase table name
const TABLE_MAP: Record<AdminItemType, string> = {
  story: 'stories',
  moment: 'moments',
  entity: 'entities',
  collection: 'collections',
};

interface BulkActionBarProps {
  selectedItems: NormalizedItem[];
  onClearSelection: () => void;
}

export function BulkActionBar({ selectedItems, onClearSelection }: BulkActionBarProps) {
  const { updateReviewStatus } = useAdminData();
  const [processing, setProcessing] = useState(false);

  if (selectedItems.length === 0) return null;

  const handleBulkAction = async (status: ReviewStatus) => {
    setProcessing(true);
    try {
      await Promise.all(
        selectedItems.map(item =>
          updateReviewStatus(TABLE_MAP[item.type], item.id, status)
        )
      );
    } finally {
      setProcessing(false);
      onClearSelection();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111] border-t border-[#2a2a2a] px-6 py-3 flex items-center gap-4 shadow-lg">
      <span className="text-sm text-gray-300 font-mono">
        {selectedItems.length} selected
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleBulkAction('approved')}
          disabled={processing}
          className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 transition-colors"
        >
          Approve All
        </button>
        <button
          onClick={() => handleBulkAction('needs-fix')}
          disabled={processing}
          className="px-3 py-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded disabled:opacity-50 transition-colors"
        >
          Flag All
        </button>
      </div>
      <div className="flex-1" />
      <button
        onClick={onClearSelection}
        className="px-3 py-1.5 text-xs bg-[#1a1a1a] hover:bg-[#222] text-gray-400 border border-[#2a2a2a] rounded transition-colors"
      >
        Clear Selection
      </button>
    </div>
  );
}
