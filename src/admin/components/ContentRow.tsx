import { useState } from 'react';
import { TypeBadge } from './TypeBadge';
import { StatusBadge } from './StatusBadge';
import { useAdminData } from '../AdminDataProvider';
import type { ReviewStatus, AdminItemType } from '../../types';

/** Normalized item shape used across the admin panel */
export interface NormalizedItem {
  id: string;
  name: string;
  type: AdminItemType;
  subType?: string; // entity type (person/place), story type (incident/biography), etc.
  status: ReviewStatus;
  year?: number | string;
  category?: string;
  description?: string;
  created_at?: string;
  // Extra fields for detail view
  subtitle?: string;
  lat?: number;
  lng?: number;
  entityIds?: string[];
  momentCount?: number;
  storyType?: string;
  canonicalStoryId?: string;
}

// Map item_type to Supabase table name
const TABLE_MAP: Record<AdminItemType, string> = {
  story: 'stories',
  moment: 'moments',
  entity: 'entities',
  collection: 'collections',
};

export function ContentRow({ item }: { item: NormalizedItem }) {
  const { ratings, updateRating, updateReviewStatus } = useAdminData();
  const [ratingInput, setRatingInput] = useState<string>(() => {
    const existing = ratings.find(r => r.item_type === item.type && r.item_id === item.id);
    return existing ? String(existing.rating) : '';
  });
  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleStatusChange = async (newStatus: ReviewStatus) => {
    setStatusUpdating(true);
    await updateReviewStatus(TABLE_MAP[item.type], item.id, newStatus);
    setStatusUpdating(false);
  };

  const handleRatingSubmit = async () => {
    const val = parseInt(ratingInput, 10);
    if (isNaN(val) || val < 0 || val > 100) return;
    await updateRating(item.type, item.id, val);
  };

  return (
    <div className="px-4 py-3 bg-[#0d0d0d] border-t border-[#2a2a2a]">
      {/* Top row: type + status + actions */}
      <div className="flex items-center gap-3 mb-3">
        <TypeBadge type={item.subType ?? item.type} />
        <StatusBadge status={item.status} />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStatusChange('approved')}
            disabled={statusUpdating}
            className="px-2.5 py-1 text-xs bg-green-500/10 text-green-400 border border-green-500/30 rounded hover:bg-green-500/20 disabled:opacity-50 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => handleStatusChange('needs-fix')}
            disabled={statusUpdating}
            className="px-2.5 py-1 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/20 disabled:opacity-50 transition-colors"
          >
            Flag
          </button>
          <button
            onClick={() => handleStatusChange('unreviewed')}
            disabled={statusUpdating}
            className="px-2.5 py-1 text-xs bg-gray-500/10 text-gray-400 border border-gray-500/30 rounded hover:bg-gray-500/20 disabled:opacity-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-1.5 text-sm">
        <span className="text-gray-500 font-mono text-xs">ID</span>
        <span className="text-gray-400 font-mono text-xs truncate">{item.id}</span>

        <span className="text-gray-500 font-mono text-xs">Name</span>
        <span className="text-gray-200">{item.name}</span>

        {item.subtitle && (
          <>
            <span className="text-gray-500 font-mono text-xs">Subtitle</span>
            <span className="text-gray-300">{item.subtitle}</span>
          </>
        )}

        {item.description && (
          <>
            <span className="text-gray-500 font-mono text-xs">Description</span>
            <span className="text-gray-400 text-xs leading-relaxed">{item.description}</span>
          </>
        )}

        {item.year != null && (
          <>
            <span className="text-gray-500 font-mono text-xs">Year</span>
            <span className="text-gray-300">{item.year}</span>
          </>
        )}

        {item.category && (
          <>
            <span className="text-gray-500 font-mono text-xs">Category</span>
            <span className="text-gray-300">{item.category}</span>
          </>
        )}

        {item.storyType && (
          <>
            <span className="text-gray-500 font-mono text-xs">Story Type</span>
            <span className="text-gray-300">{item.storyType}</span>
          </>
        )}

        {item.lat != null && item.lng != null && (
          <>
            <span className="text-gray-500 font-mono text-xs">Location</span>
            <span className="text-gray-400 font-mono text-xs">{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</span>
          </>
        )}

        {item.entityIds && item.entityIds.length > 0 && (
          <>
            <span className="text-gray-500 font-mono text-xs">Entities</span>
            <div className="flex flex-wrap gap-1">
              {item.entityIds.map(eid => (
                <span key={eid} className="px-1.5 py-0.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-mono">
                  {eid}
                </span>
              ))}
            </div>
          </>
        )}

        {item.momentCount != null && (
          <>
            <span className="text-gray-500 font-mono text-xs">Moments</span>
            <span className="text-gray-300">{item.momentCount}</span>
          </>
        )}

        {item.canonicalStoryId && (
          <>
            <span className="text-gray-500 font-mono text-xs">Canon Story</span>
            <span className="text-gray-400 font-mono text-xs">{item.canonicalStoryId}</span>
          </>
        )}
      </div>

      {/* Rating input */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2a2a2a]">
        <span className="text-xs text-gray-500">Rating</span>
        <input
          type="number"
          min={0}
          max={100}
          value={ratingInput}
          onChange={(e) => setRatingInput(e.target.value)}
          onBlur={handleRatingSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRatingSubmit(); }}
          placeholder="0-100"
          className="w-20 px-2 py-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-sm text-gray-200 font-mono focus:outline-none focus:border-red-500/50"
        />
        <span className="text-xs text-gray-600">/ 100</span>
      </div>
    </div>
  );
}
