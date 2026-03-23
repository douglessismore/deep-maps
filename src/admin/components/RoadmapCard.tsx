import { useState } from 'react';
import { InlineEditor } from './InlineEditor';
import type { RoadmapItem } from '../../types';

const CATEGORY_COLORS: Record<string, string> = {
  immediate: 'bg-red-500/15 text-red-400 border-red-500/30',
  ux: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'content-curation': 'bg-green-500/15 text-green-400 border-green-500/30',
  'content-ideas': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  tooling: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  architecture: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  business: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/15 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const STATUS_OPTIONS: { value: RoadmapItem['status']; label: string }[] = [
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const CATEGORY_OPTIONS = [
  'immediate', 'ux', 'content-curation', 'content-ideas', 'tooling', 'architecture', 'business',
];

const PRIORITY_OPTIONS: RoadmapItem['priority'][] = ['high', 'medium', 'low'];

interface RoadmapCardProps {
  item: RoadmapItem;
  onUpdate: (id: string, changes: Partial<RoadmapItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RoadmapCard({ item, onUpdate, onDelete }: RoadmapCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const catColor = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.architecture;
  const priColor = PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.low;

  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg overflow-hidden">
      {/* Compact view */}
      <div
        className="px-3 py-2.5 cursor-pointer hover:bg-[#151515] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-200 leading-tight">{item.title}</div>
            {item.description && !expanded && (
              <div className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</div>
            )}
          </div>
          <span className={`px-1.5 py-0.5 text-[10px] border rounded flex-shrink-0 ${priColor}`}>
            {item.priority}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`px-1.5 py-0.5 text-[10px] border rounded ${catColor}`}>
            {item.category}
          </span>
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="px-3 py-3 border-t border-[#2a2a2a] space-y-3">
          {/* Editable title */}
          <div>
            <div className="text-[10px] text-gray-600 mb-0.5">Title</div>
            <InlineEditor
              value={item.title}
              onSave={(v) => onUpdate(item.id, { title: v })}
            />
          </div>

          {/* Editable description */}
          <div>
            <div className="text-[10px] text-gray-600 mb-0.5">Description</div>
            <InlineEditor
              value={item.description ?? ''}
              onSave={(v) => onUpdate(item.id, { description: v || null })}
              multiline
            />
          </div>

          {/* Dropdowns row */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[10px] text-gray-600 mb-0.5">Status</div>
              <select
                value={item.status}
                onChange={(e) => onUpdate(item.id, { status: e.target.value as RoadmapItem['status'] })}
                className="px-2 py-1 text-xs bg-[#1a1a1a] border border-[#333] rounded text-gray-300 focus:outline-none focus:border-red-500"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 mb-0.5">Category</div>
              <select
                value={item.category}
                onChange={(e) => onUpdate(item.id, { category: e.target.value })}
                className="px-2 py-1 text-xs bg-[#1a1a1a] border border-[#333] rounded text-gray-300 focus:outline-none focus:border-red-500"
              >
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 mb-0.5">Priority</div>
              <select
                value={item.priority}
                onChange={(e) => onUpdate(item.id, { priority: e.target.value as RoadmapItem['priority'] })}
                className="px-2 py-1 text-xs bg-[#1a1a1a] border border-[#333] rounded text-gray-300 focus:outline-none focus:border-red-500"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Delete */}
          <div className="pt-2 border-t border-[#2a2a2a]">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Delete this item?</span>
                <button
                  onClick={() => onDelete(item.id)}
                  className="px-2 py-0.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-0.5 text-xs bg-[#1a1a1a] hover:bg-[#222] text-gray-400 border border-[#2a2a2a] rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                Delete item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
