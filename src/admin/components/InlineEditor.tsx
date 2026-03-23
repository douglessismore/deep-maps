import { useState, useRef, useEffect, useCallback } from 'react';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface InlineEditorProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  multiline?: boolean;
  label?: string;
}

export function InlineEditor({ value, onSave, multiline = false, label }: InlineEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // Sync draft when value prop changes while not editing
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(draft.length, draft.length);
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaveState('saving');
    try {
      await onSave(draft);
      setSaveState('saved');
      setEditing(false);
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
    }
  }, [draft, value, onSave]);

  const handleCancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
    setSaveState('idle');
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSave();
    }
    // For single-line, Enter also saves
    if (!multiline && e.key === 'Enter') {
      handleSave();
    }
  }, [handleCancel, handleSave, multiline]);

  if (editing) {
    const sharedClasses = 'w-full px-2 py-1 bg-[#1a1a1a] border border-[#333] rounded text-sm text-gray-200 focus:outline-none focus:border-red-500 transition-colors';
    return (
      <div className="flex-1">
        {label && <div className="text-[10px] text-gray-600 mb-0.5">{label}</div>}
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            className={`${sharedClasses} resize-y`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={sharedClasses}
          />
        )}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="px-2 py-0.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 transition-colors"
          >
            {saveState === 'saving' ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="px-2 py-0.5 text-xs bg-[#1a1a1a] hover:bg-[#222] text-gray-400 border border-[#2a2a2a] rounded transition-colors"
          >
            Cancel
          </button>
          <span className="text-[10px] text-gray-600">Esc cancel · {multiline ? 'Cmd+Enter' : 'Enter'} save</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 group">
      {label && <div className="text-[10px] text-gray-600 mb-0.5">{label}</div>}
      <div className="flex items-start gap-1.5">
        <span
          onClick={() => setEditing(true)}
          className={`cursor-pointer hover:bg-[#1a1a1a] rounded px-1 -mx-1 transition-colors ${
            multiline ? 'text-gray-400 text-xs leading-relaxed' : 'text-gray-200'
          }`}
          title="Click to edit"
        >
          {value || <span className="text-gray-600 italic">empty</span>}
        </span>
        {saveState === 'saved' && (
          <span className="text-green-400 text-xs flex-shrink-0">&#10003;</span>
        )}
        {saveState === 'error' && (
          <span className="text-red-400 text-xs flex-shrink-0">Save failed</span>
        )}
      </div>
    </div>
  );
}
