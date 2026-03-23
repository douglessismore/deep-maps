import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAppData } from '../lib/data/provider';
import { supabase } from '../lib/supabase';
import type { AdminRating, AdminNote, RoadmapItem, ReviewStatus, AdminItemType } from '../types';

// ─── Admin data shape ─────────────────────────────────────────────────

export interface AdminData {
  // App data (from DataProvider)
  appData: ReturnType<typeof useAppData>;
  // Admin-specific data
  ratings: AdminRating[];
  notes: AdminNote[];
  roadmapItems: RoadmapItem[];
  isLoading: boolean;
  // Mutations
  updateRating: (itemType: AdminItemType, itemId: string, rating: number) => Promise<void>;
  addNote: (itemType: AdminItemType, itemId: string, fieldName: string | null, text: string) => Promise<void>;
  resolveNote: (noteId: string) => Promise<void>;
  updateReviewStatus: (table: string, itemId: string, status: ReviewStatus) => Promise<void>;
  addRoadmapItem: (item: Pick<RoadmapItem, 'title' | 'description' | 'category' | 'priority' | 'status'>) => Promise<void>;
  updateRoadmapItem: (id: string, changes: Partial<RoadmapItem>) => Promise<void>;
  deleteRoadmapItem: (id: string) => Promise<void>;
}

const AdminDataContext = createContext<AdminData | null>(null);

export function useAdminData(): AdminData {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider');
  return ctx;
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const appData = useAppData();
  const [ratings, setRatings] = useState<AdminRating[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch admin data on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchAdminData() {
      setIsLoading(true);
      try {
        const [ratingsRes, notesRes, roadmapRes] = await Promise.all([
          supabase.from('admin_ratings').select('*'),
          supabase.from('admin_notes').select('*').order('created_at', { ascending: false }),
          supabase.from('roadmap_items').select('*').order('sort_order', { ascending: true }),
        ]);

        if (cancelled) return;

        if (ratingsRes.data) setRatings(ratingsRes.data as AdminRating[]);
        if (notesRes.data) setNotes(notesRes.data as AdminNote[]);
        if (roadmapRes.data) setRoadmapItems(roadmapRes.data as RoadmapItem[]);
      } catch (err) {
        console.warn('[admin] Failed to fetch admin data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAdminData();
    return () => { cancelled = true; };
  }, []);

  const updateRating = useCallback(async (itemType: AdminItemType, itemId: string, rating: number) => {
    const existing = ratings.find(r => r.item_type === itemType && r.item_id === itemId);

    if (existing) {
      const { data, error } = await supabase
        .from('admin_ratings')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) { console.error('[admin] updateRating error:', error); return; }
      if (data) setRatings(prev => prev.map(r => r.id === existing.id ? data as AdminRating : r));
    } else {
      const { data, error } = await supabase
        .from('admin_ratings')
        .insert({ item_type: itemType, item_id: itemId, rating })
        .select()
        .single();

      if (error) { console.error('[admin] updateRating error:', error); return; }
      if (data) setRatings(prev => [...prev, data as AdminRating]);
    }
  }, [ratings]);

  const addNote = useCallback(async (itemType: AdminItemType, itemId: string, fieldName: string | null, text: string) => {
    const { data, error } = await supabase
      .from('admin_notes')
      .insert({ item_type: itemType, item_id: itemId, field_name: fieldName, text })
      .select()
      .single();

    if (error) { console.error('[admin] addNote error:', error); return; }
    if (data) setNotes(prev => [data as AdminNote, ...prev]);
  }, []);

  const resolveNote = useCallback(async (noteId: string) => {
    const { error } = await supabase
      .from('admin_notes')
      .update({ resolved: true })
      .eq('id', noteId);

    if (error) { console.error('[admin] resolveNote error:', error); return; }
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, resolved: true } : n));
  }, []);

  const updateReviewStatus = useCallback(async (table: string, itemId: string, status: ReviewStatus) => {
    const { error } = await supabase
      .from(table)
      .update({ review_status: status })
      .eq('id', itemId);

    if (error) { console.error('[admin] updateReviewStatus error:', error); return; }
  }, []);

  // ─── Roadmap mutations ──────────────────────────────────────────────

  const addRoadmapItem = useCallback(async (item: Pick<RoadmapItem, 'title' | 'description' | 'category' | 'priority' | 'status'>) => {
    // Use max sort_order + 1 for new items
    const maxSort = roadmapItems.reduce((max, r) => Math.max(max, r.sort_order), 0);

    const { data, error } = await supabase
      .from('roadmap_items')
      .insert({ ...item, sort_order: maxSort + 1 })
      .select()
      .single();

    if (error) { console.error('[admin] addRoadmapItem error:', error); return; }
    if (data) setRoadmapItems(prev => [...prev, data as RoadmapItem]);
  }, [roadmapItems]);

  const updateRoadmapItem = useCallback(async (id: string, changes: Partial<RoadmapItem>) => {
    const { error } = await supabase
      .from('roadmap_items')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) { console.error('[admin] updateRoadmapItem error:', error); return; }
    setRoadmapItems(prev => prev.map(r => r.id === id ? { ...r, ...changes } : r));
  }, []);

  const deleteRoadmapItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('roadmap_items')
      .delete()
      .eq('id', id);

    if (error) { console.error('[admin] deleteRoadmapItem error:', error); return; }
    setRoadmapItems(prev => prev.filter(r => r.id !== id));
  }, []);

  return (
    <AdminDataContext.Provider
      value={{
        appData,
        ratings,
        notes,
        roadmapItems,
        isLoading,
        updateRating,
        addNote,
        resolveNote,
        updateReviewStatus,
        addRoadmapItem,
        updateRoadmapItem,
        deleteRoadmapItem,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}
