import { useState, useMemo } from 'react';
import { useAdminData } from '../AdminDataProvider';
import { ContentTable } from '../components/ContentTable';
import { FilterBar } from '../components/FilterBar';
import type { NormalizedItem } from '../components/ContentRow';
import type { ReviewStatus } from '../../types';

export function ContentQueuePage() {
  const { appData } = useAdminData();
  const { moments, stories, entities, collections } = appData;

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize all items into a single flat list
  const allItems = useMemo<NormalizedItem[]>(() => {
    const items: NormalizedItem[] = [];

    for (const s of stories) {
      items.push({
        id: s.id,
        name: s.name,
        type: 'story',
        subType: s.storyType,
        status: ((s as unknown as Record<string, unknown>).review_status as ReviewStatus) ?? 'unreviewed',
        year: s.years,
        category: s.category,
        description: s.description,
        storyType: s.storyType,
        momentCount: s.moments.length,
      });
    }

    for (const m of moments) {
      items.push({
        id: m.id,
        name: m.name,
        type: 'moment',
        subType: m.type,
        status: ((m as unknown as Record<string, unknown>).review_status as ReviewStatus) ?? 'unreviewed',
        year: m.year,
        category: m.type,
        description: m.description,
        subtitle: m.subtitle,
        lat: m.lat,
        lng: m.lng,
        accuracy: m.accuracy,
        entityIds: m.entityIds,
      });
    }

    for (const e of entities) {
      items.push({
        id: e.id,
        name: e.name,
        type: 'entity',
        subType: e.type,
        status: ((e as unknown as Record<string, unknown>).review_status as ReviewStatus) ?? 'unreviewed',
        year: e.years ? String(e.years) : undefined,
        description: e.description,
        canonicalStoryId: e.canonicalStoryId,
      });
    }

    for (const c of collections) {
      items.push({
        id: c.id,
        name: c.name,
        type: 'collection',
        status: ((c as unknown as Record<string, unknown>).review_status as ReviewStatus) ?? 'unreviewed',
        description: c.description,
        subtitle: c.subtitle,
        momentCount: c.momentIds.length,
      });
    }

    return items;
  }, [moments, stories, entities, collections]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = allItems;

    if (typeFilter !== 'all') {
      result = result.filter(i => i.type === typeFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(i => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }

    return result;
  }, [allItems, typeFilter, statusFilter, searchQuery]);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-200">Content Queue</h1>
        <span className="text-xs text-gray-500 font-mono">{filtered.length} items</span>
      </div>

      <div className="mb-4">
        <FilterBar
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      <ContentTable items={filtered} />
    </div>
  );
}
