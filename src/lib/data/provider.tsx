/**
 * Data provider — Supabase is the SINGLE source of truth.
 * Static files are seed data / backup only (used as fallback when Supabase is unreachable).
 *
 * Why context here (when we chose TanStack Query over context)?
 * TanStack Query handles the FETCH lifecycle (loading, error, caching, dedup).
 * The context just distributes the already-loaded data arrays.
 * This is fine because the data is loaded ONCE and never changes — no
 * re-render cascading from frequent updates.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Moment, Story, Entity, StoryCollection } from '../../types';
import { initEntityHelpers, filterBrowseableStories } from '../entityHelpers';
import { initClustering } from '../clustering';
import { SplashScreenD } from '../../components/SplashScreenD';

// ─── Data source ─────────────────────────────────────────────────────
// Supabase is always the primary. Static files are only a dev/offline fallback.
// In local dev, VITE_DATA_SOURCE=static forces static-only mode (no Supabase needed).
export const dataSource: 'supabase' | 'static' = import.meta.env.VITE_DATA_SOURCE === 'static' ? 'static' : 'supabase';

// ─── Data shape ──────────────────────────────────────────────────────

export interface AppData {
  moments: Moment[];
  stories: Story[];
  /** Only incident stories — filtered for browse tabs, search, related/nearby.
   *  Use `stories` (unfiltered) for entity panels, admin, and map rendering. */
  browseableStories: Story[];
  entities: Entity[];
  collections: StoryCollection[];
}

// ─── Context ─────────────────────────────────────────────────────────

const DataContext = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAppData must be used within DataProvider');
  return ctx;
}

// ─── Query client ────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,      // Data loaded once per session
      gcTime: Infinity,         // Never garbage collect
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

// ─── Static fallback loader ──────────────────────────────────────────

async function loadStaticData(): Promise<AppData> {
  const { moments } = await import('../../data/moments');
  const { stories } = await import('../../data/stories');
  const { entities } = await import('../../data/entities');
  const { collections } = await import('../../data/collections');
  return { moments, stories, browseableStories: filterBrowseableStories(stories), entities, collections };
}

// ─── Loader function ─────────────────────────────────────────────────
// Supabase is the single source of truth. Static files are seed data only.
// If Supabase fails or returns empty data, we fall back to static files
// with a console warning so the app still works in offline/dev scenarios.

// Cached promise so Supabase load can continue in the background
let supabasePromise: Promise<AppData | null> | null = null;

async function loadData(): Promise<AppData> {
  if (dataSource === 'static') {
    console.info('[data] Using static files (VITE_DATA_SOURCE=static)');
    return loadStaticData();
  }

  // Start Supabase load (or reuse existing promise)
  if (!supabasePromise) {
    supabasePromise = (async () => {
      try {
        const { loadFromSupabase } = await import('./supabase-loader');
        const data = await loadFromSupabase();
        if (data.moments.length === 0) return null;
        return { ...data, browseableStories: filterBrowseableStories(data.stories) };
      } catch (err) {
        console.warn('[data] Supabase load failed:', err);
        return null;
      }
    })();
  }

  // Race: Supabase (8s timeout) vs static data
  // If Supabase responds within 8s, use it. Otherwise load static immediately.
  const timeout = new Promise<'timeout'>(r => setTimeout(() => r('timeout'), 8000));
  const result = await Promise.race([supabasePromise, timeout]);

  if (result !== 'timeout' && result !== null) {
    console.info('[data] Loaded from Supabase');
    return result;
  }

  // Supabase too slow or failed — load static immediately
  console.info('[data] Supabase slow/failed — loading static data');
  return loadStaticData();
}

// ─── Inner provider (uses TanStack Query) ────────────────────────────

function DataLoader({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['app-data', dataSource],
    queryFn: loadData,
    retry: false, // loadData handles its own retries + timeout + static fallback
  });

  // Initialize module-scope helpers once when data arrives.
  // Must be called before any early returns to satisfy Rules of Hooks.
  useMemo(() => {
    if (!data) return;
    initEntityHelpers(data.entities, data.moments, data.stories);
    initClustering(data.moments, data.stories);
  }, [data]);


  if (isLoading) {
    return <SplashScreenD />;
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center max-w-md px-4">
          <div className="text-lg font-serif text-red-600">Failed to load data</div>
          <div className="text-sm text-[var(--text-muted)] mt-2">{(error as Error).message}</div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['app-data'] })}
            className="mt-4 px-4 py-2 bg-[var(--accent)] text-white rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  );
}

// ─── Public provider (wraps QueryClient + DataLoader) ────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <DataLoader>
        {children}
      </DataLoader>
    </QueryClientProvider>
  );
}
// cache bust 1774925157
