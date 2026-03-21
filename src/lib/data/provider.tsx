/**
 * Data provider — loads all data from either static files or Supabase,
 * then exposes it via React context for the app.
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
import { initEntityHelpers } from '../entityHelpers';
import { initClustering } from '../clustering';
import { SplashScreenA } from '../../components/SplashScreenA';

// Static data loaded lazily (only when ?data=static) so it doesn't bloat the Supabase bundle

// ─── Data source detection ───────────────────────────────────────────

function getDataSource(): 'static' | 'supabase' {
  // URL param overrides everything: ?data=supabase or ?data=static
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('data');
    if (param === 'supabase' || param === 'static') return param;
  }
  // Env var fallback
  const env = import.meta.env.VITE_DATA_SOURCE;
  if (env === 'supabase' || env === 'static') return env;
  // Default — Supabase is the primary data source
  return 'supabase';
}

export const dataSource = getDataSource();

// ─── Data shape ──────────────────────────────────────────────────────

export interface AppData {
  moments: Moment[];
  stories: Story[];
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

const queryClient = new QueryClient({
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

// ─── Loader function ─────────────────────────────────────────────────

async function loadData(): Promise<AppData> {
  if (dataSource === 'supabase') {
    const { loadFromSupabase } = await import('./supabase-loader');
    return loadFromSupabase();
  }
  // Static data — lazy import so it's tree-shaken from production bundle
  const { moments } = await import('../../data/moments');
  const { stories } = await import('../../data/stories');
  const { entities } = await import('../../data/entities');
  const { collections } = await import('../../data/collections');
  return { moments, stories, entities, collections };
}

// ─── Inner provider (uses TanStack Query) ────────────────────────────

function DataLoader({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['app-data', dataSource],
    queryFn: loadData,
  });

  // Initialize module-scope helpers once when data arrives.
  // Must be called before any early returns to satisfy Rules of Hooks.
  useMemo(() => {
    if (!data) return;
    initEntityHelpers(data.entities, data.moments, data.stories);
    initClustering(data.moments, data.stories);
  }, [data]);

  if (isLoading) {
    return <SplashScreenA />;
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
