import { useState, useMemo, useCallback } from 'react';
import { ContentRow, type NormalizedItem } from './ContentRow';
import { TypeBadge } from './TypeBadge';
import { StatusBadge } from './StatusBadge';
import { BulkActionBar } from './BulkActionBar';

interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (item: NormalizedItem) => React.ReactNode;
}

interface ContentTableProps {
  items: NormalizedItem[];
  columns?: Column[];
  pageSize?: number;
}

const DEFAULT_COLUMNS: Column[] = [
  { key: 'name', label: 'Name', render: (item) => (
    <span className="text-gray-200 truncate block max-w-[400px]">{item.name}</span>
  )},
  { key: 'type', label: 'Type', width: '100px', render: (item) => (
    <TypeBadge type={item.subType ?? item.type} />
  )},
  { key: 'status', label: 'Status', width: '110px', render: (item) => (
    <StatusBadge status={item.status} />
  )},
  { key: 'year', label: 'Year', width: '80px', render: (item) => (
    <span className="text-gray-400 font-mono text-xs">{item.year ?? '—'}</span>
  )},
  { key: 'category', label: 'Category', width: '160px', render: (item) => (
    <span className="text-gray-400 text-xs">{item.category ?? '—'}</span>
  )},
];

export function ContentTable({ items, columns = DEFAULT_COLUMNS, pageSize = 50 }: ContentTableProps) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort items
  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortKey];
      const bVal = (b as unknown as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [items, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const pageItems = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }, [sortKey]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === pageItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageItems.map(i => i.id)));
    }
  }, [pageItems, selectedIds.size]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Resolve selected items for bulk actions
  const selectedItems = useMemo(() => {
    return items.filter(i => selectedIds.has(i.id));
  }, [items, selectedIds]);

  // Reset page when items change
  useMemo(() => { setPage(0); }, [items.length]);

  return (
    <>
      <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="flex items-center bg-[#111] border-b border-[#2a2a2a] text-xs text-gray-500 font-mono">
          <div className="w-10 flex-shrink-0 flex items-center justify-center py-2">
            <input
              type="checkbox"
              checked={selectedIds.size === pageItems.length && pageItems.length > 0}
              onChange={toggleSelectAll}
              className="accent-red-500"
            />
          </div>
          {columns.map(col => (
            <div
              key={col.key}
              className="py-2 px-3 cursor-pointer hover:text-gray-300 select-none flex items-center gap-1 transition-colors"
              style={{ width: col.width, flex: col.width ? `0 0 ${col.width}` : '1' }}
              onClick={() => handleSort(col.key)}
            >
              {col.label}
              {sortKey === col.key && (
                <span className="text-red-400">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
              )}
            </div>
          ))}
        </div>

        {/* Table rows */}
        {pageItems.map(item => (
          <div key={item.id}>
            <div
              className={`flex items-center border-b border-[#1a1a1a] hover:bg-[#111] cursor-pointer transition-colors text-sm ${
                expandedId === item.id ? 'bg-[#111]' : ''
              }`}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div
                className="w-10 flex-shrink-0 flex items-center justify-center py-2"
                onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="accent-red-500"
                />
              </div>
              {columns.map(col => (
                <div
                  key={col.key}
                  className="py-2 px-3 truncate"
                  style={{ width: col.width, flex: col.width ? `0 0 ${col.width}` : '1' }}
                >
                  {col.render ? col.render(item) : (
                    <span className="text-gray-300">{String((item as unknown as Record<string, unknown>)[col.key] ?? '—')}</span>
                  )}
                </div>
              ))}
            </div>
            {/* Expanded detail */}
            {expandedId === item.id && (
              <ContentRow
                item={item}
                onGeoSaved={() => {
                  const idx = pageItems.findIndex(i => i.id === item.id);
                  if (idx >= 0 && idx < pageItems.length - 1) {
                    setExpandedId(pageItems[idx + 1].id);
                  }
                }}
              />
            )}
          </div>
        ))}

        {pageItems.length === 0 && (
          <div className="py-12 text-center text-gray-600 text-sm">No items match the current filters.</div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#111] border-t border-[#2a2a2a] text-xs text-gray-500">
          <span>
            {sorted.length} items{selectedIds.size > 0 && ` \u00B7 ${selectedIds.size} selected`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded hover:bg-[#222] disabled:opacity-30 disabled:hover:bg-[#1a1a1a] transition-colors"
            >
              Prev
            </button>
            <span className="text-gray-400 font-mono">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded hover:bg-[#222] disabled:opacity-30 disabled:hover:bg-[#1a1a1a] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      <BulkActionBar selectedItems={selectedItems} onClearSelection={clearSelection} />
    </>
  );
}
