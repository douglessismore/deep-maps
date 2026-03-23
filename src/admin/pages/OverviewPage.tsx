import { useMemo } from 'react';
import { Link } from 'wouter';
import { useAdminData } from '../AdminDataProvider';
import { TypeBadge } from '../components/TypeBadge';

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-4">
      <div className={`text-2xl font-mono font-bold ${accent ? 'text-red-400' : 'text-gray-200'}`}>
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export function OverviewPage() {
  const { appData, ratings, notes } = useAdminData();
  const { moments, stories, entities, collections } = appData;

  // Recent items — merge all types and sort by name (no created_at on app data, so just take a slice)
  const recentItems = useMemo(() => {
    const all: { id: string; name: string; type: string }[] = [
      ...stories.slice(-5).map(s => ({ id: s.id, name: s.name, type: 'story' })),
      ...moments.slice(-5).map(m => ({ id: m.id, name: m.name, type: 'moment' })),
      ...entities.slice(-5).map(e => ({ id: e.id, name: e.name, type: 'entity' })),
    ];
    return all.slice(0, 10);
  }, [stories, moments, entities]);

  const totalRated = ratings.length;
  const totalNotes = notes.filter(n => !n.resolved).length;

  return (
    <div className="max-w-5xl">
      <h1 className="text-xl font-bold text-gray-200 mb-6">Overview</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Moments" value={moments.length} accent />
        <StatCard label="Total Stories" value={stories.length} />
        <StatCard label="Total Entities" value={entities.length} />
        <StatCard label="Total Collections" value={collections.length} />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Items Rated" value={totalRated} />
        <StatCard label="Open Notes" value={totalNotes} />
        <StatCard label="Moment Types" value={new Set(moments.map(m => m.type)).size} />
        <StatCard label="Story Categories" value={new Set(stories.map(s => s.category)).size} />
      </div>

      {/* Quick links */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/admin/queue"
          className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
        >
          Content Queue
        </Link>
        <Link
          href="/admin/roadmap"
          className="px-4 py-2 bg-[#111] text-gray-400 border border-[#2a2a2a] rounded-lg text-sm hover:bg-[#1a1a1a] transition-colors"
        >
          Roadmap
        </Link>
      </div>

      {/* Recent items */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-lg">
        <div className="px-4 py-3 border-b border-[#2a2a2a]">
          <h2 className="text-sm font-bold text-gray-300">Sample Content</h2>
        </div>
        <div>
          {recentItems.map(item => (
            <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 px-4 py-2 border-b border-[#1a1a1a] last:border-b-0">
              <TypeBadge type={item.type} />
              <span className="text-sm text-gray-300 truncate">{item.name}</span>
              <span className="text-xs text-gray-600 font-mono ml-auto truncate max-w-[200px]">{item.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
