interface FilterBarProps {
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function FilterBar({
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#111] border border-[#2a2a2a] rounded-lg">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name..."
        className="flex-1 min-w-0 px-3 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
      />
      <select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value)}
        className="px-3 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
      >
        <option value="all">All Types</option>
        <option value="story">Stories</option>
        <option value="moment">Moments</option>
        <option value="entity">Entities</option>
        <option value="collection">Collections</option>
      </select>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="px-3 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
      >
        <option value="all">All Statuses</option>
        <option value="unreviewed">Unreviewed</option>
        <option value="approved">Approved</option>
        <option value="needs-fix">Needs Fix</option>
      </select>
    </div>
  );
}
