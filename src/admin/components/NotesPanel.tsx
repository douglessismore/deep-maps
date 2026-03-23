import { useState, useMemo } from 'react';
import { useAdminData } from '../AdminDataProvider';
import type { AdminItemType } from '../../types';

const FIELD_OPTIONS = [
  'General',
  'Name',
  'Subtitle',
  'Description',
  'Location',
  'Entity Links',
] as const;

interface NotesPanelProps {
  itemType: AdminItemType;
  itemId: string;
}

export function NotesPanel({ itemType, itemId }: NotesPanelProps) {
  const { notes, addNote, resolveNote } = useAdminData();
  const [showResolved, setShowResolved] = useState(false);
  const [newText, setNewText] = useState('');
  const [fieldName, setFieldName] = useState<string>('General');
  const [adding, setAdding] = useState(false);

  const itemNotes = useMemo(() => {
    return notes
      .filter(n => n.item_type === itemType && n.item_id === itemId)
      .filter(n => showResolved || !n.resolved);
  }, [notes, itemType, itemId, showResolved]);

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    setAdding(true);
    const fn = fieldName === 'General' ? null : fieldName;
    await addNote(itemType, itemId, fn, text);
    setNewText('');
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-gray-500">Notes</span>
        <label className="flex items-center gap-1.5 text-[10px] text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="accent-red-500"
          />
          Show resolved
        </label>
      </div>

      {/* Notes list */}
      {itemNotes.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {itemNotes.map(note => (
            <div
              key={note.id}
              className={`flex items-start gap-2 px-2 py-1.5 bg-[#111] rounded text-xs ${
                note.resolved ? 'opacity-50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className={note.resolved ? 'line-through text-gray-500' : 'text-gray-300'}>
                  {note.text}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {note.field_name && (
                    <span className="px-1 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px]">
                      {note.field_name}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-600">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {!note.resolved && (
                <button
                  onClick={() => resolveNote(note.id)}
                  className="px-1.5 py-0.5 text-[10px] bg-[#1a1a1a] hover:bg-[#222] text-gray-500 hover:text-gray-300 border border-[#2a2a2a] rounded transition-colors flex-shrink-0"
                >
                  Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[10px] text-gray-600 mb-3">No notes yet.</div>
      )}

      {/* Add note */}
      <div className="flex items-start gap-2">
        <select
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          className="px-1.5 py-1 text-xs bg-[#1a1a1a] border border-[#333] rounded text-gray-400 focus:outline-none focus:border-red-500"
        >
          {FIELD_OPTIONS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note..."
          className="flex-1 px-2 py-1 text-xs bg-[#1a1a1a] border border-[#333] rounded text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-red-500"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newText.trim()}
          className="px-2 py-1 text-xs bg-[#1a1a1a] hover:bg-[#222] text-gray-400 border border-[#2a2a2a] rounded disabled:opacity-30 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
