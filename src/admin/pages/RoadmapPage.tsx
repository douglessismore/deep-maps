import { useState, useMemo } from 'react';
import { useAdminData } from '../AdminDataProvider';
import { RoadmapCard } from '../components/RoadmapCard';
import type { RoadmapItem } from '../../types';

const COLUMNS: { status: RoadmapItem['status']; label: string }[] = [
  { status: 'todo', label: 'Todo' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

const CATEGORY_ORDER = [
  'immediate', 'ux', 'content-curation', 'content-ideas', 'tooling', 'architecture', 'business',
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  immediate: { label: 'Immediate', color: 'text-red-400' },
  ux: { label: 'UX / Frontend', color: 'text-blue-400' },
  'content-curation': { label: 'Content Curation', color: 'text-green-400' },
  'content-ideas': { label: 'Content Ideas', color: 'text-purple-400' },
  tooling: { label: 'Tooling', color: 'text-yellow-400' },
  architecture: { label: 'Architecture', color: 'text-gray-400' },
  business: { label: 'Business', color: 'text-orange-400' },
};

const CATEGORY_OPTIONS = CATEGORY_ORDER;
const PRIORITY_OPTIONS: RoadmapItem['priority'][] = ['high', 'medium', 'low'];

interface AddFormState {
  title: string;
  description: string;
  category: string;
  priority: RoadmapItem['priority'];
}

const EMPTY_FORM: AddFormState = { title: '', description: '', category: 'ux', priority: 'medium' };

export function RoadmapPage() {
  const { roadmapItems, addRoadmapItem, updateRoadmapItem, deleteRoadmapItem } = useAdminData();
  const [addingFor, setAddingFor] = useState<RoadmapItem['status'] | null>(null);
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Group items by status, then by category within each column
  const grouped = useMemo(() => {
    const result: Record<RoadmapItem['status'], Record<string, RoadmapItem[]>> = {
      'todo': {},
      'in-progress': {},
      'done': {},
    };

    for (const item of roadmapItems) {
      if (!result[item.status]) continue;
      const cat = item.category || 'tooling';
      if (!result[item.status][cat]) result[item.status][cat] = [];
      result[item.status][cat].push(item);
    }

    return result;
  }, [roadmapItems]);

  const columnCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const col of COLUMNS) {
      counts[col.status] = roadmapItems.filter(i => i.status === col.status).length;
    }
    return counts;
  }, [roadmapItems]);

  const handleAdd = async (status: RoadmapItem['status']) => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    await addRoadmapItem({
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      priority: form.priority,
      status,
    });
    setForm(EMPTY_FORM);
    setAddingFor(null);
    setSubmitting(false);
  };

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-200">Roadmap</h1>
        <span className="text-xs text-gray-500 font-mono">{roadmapItems.length} items</span>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {COLUMNS.map(col => (
          <div key={col.status} className="flex-1 min-w-[320px]">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-300">{col.label}</h2>
                <span className="text-xs text-gray-600 font-mono">{columnCounts[col.status] ?? 0}</span>
              </div>
              <button
                onClick={() => {
                  setAddingFor(addingFor === col.status ? null : col.status);
                  setForm(EMPTY_FORM);
                }}
                className="px-2 py-0.5 text-xs bg-[#1a1a1a] hover:bg-[#222] text-gray-500 hover:text-gray-300 border border-[#2a2a2a] rounded transition-colors"
              >
                + Add
              </button>
            </div>

            {/* Add form */}
            {addingFor === col.status && (
              <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-3 mb-3 space-y-2">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Title"
                  className="w-full px-2 py-1.5 text-sm bg-[#1a1a1a] border border-[#333] rounded text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-red-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleAdd(col.status);
                    if (e.key === 'Escape') setAddingFor(null);
                  }}
                />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-2 py-1.5 text-xs bg-[#1a1a1a] border border-[#333] rounded text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-red-500 resize-y"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                    className="px-2 py-1 text-xs bg-[#1a1a1a] border border-[#333] rounded text-gray-400 focus:outline-none focus:border-red-500"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]?.label ?? c}</option>
                    ))}
                  </select>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as RoadmapItem['priority'] }))}
                    className="px-2 py-1 text-xs bg-[#1a1a1a] border border-[#333] rounded text-gray-400 focus:outline-none focus:border-red-500"
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <div className="flex-1" />
                  <button
                    onClick={() => handleAdd(col.status)}
                    disabled={submitting || !form.title.trim()}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAddingFor(null)}
                    className="px-2 py-1 text-xs bg-[#1a1a1a] hover:bg-[#222] text-gray-400 border border-[#2a2a2a] rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Cards grouped by category */}
            <div className="space-y-4">
              {CATEGORY_ORDER.filter(cat => grouped[col.status][cat]?.length).map(cat => (
                <div key={cat}>
                  <div className={`text-[10px] font-mono mb-1.5 ${CATEGORY_LABELS[cat]?.color ?? 'text-gray-500'}`}>
                    {CATEGORY_LABELS[cat]?.label ?? cat}
                  </div>
                  <div className="space-y-1.5">
                    {grouped[col.status][cat].map(item => (
                      <RoadmapCard
                        key={item.id}
                        item={item}
                        onUpdate={updateRoadmapItem}
                        onDelete={deleteRoadmapItem}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {!CATEGORY_ORDER.some(cat => grouped[col.status][cat]?.length) && (
                <div className="text-xs text-gray-600 text-center py-8">No items</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
