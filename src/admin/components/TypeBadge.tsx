const TYPE_COLORS: Record<string, string> = {
  story: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  moment: 'bg-red-500/20 text-red-400 border-red-500/30',
  person: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  place: 'bg-green-500/20 text-green-400 border-green-500/30',
  organization: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  concept: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  work: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  collection: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  entity: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function TypeBadge({ type }: { type: string }) {
  const colors = TYPE_COLORS[type] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono border rounded ${colors}`}>
      {type}
    </span>
  );
}
