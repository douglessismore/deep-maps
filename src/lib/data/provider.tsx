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
    return (
      <div
        className="h-full relative overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 35% 75%, rgba(234,179,8,0.03) 0%, transparent 70%), var(--bg-primary)`,
        }}
      >
        {/* Crosshair lines — cartographic priming */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            animation: 'dm-fade-in 0.6s ease-out forwards',
            opacity: 0,
          }}
        >
          {/* Horizontal */}
          <div
            className="absolute left-0 right-0"
            style={{ top: '50%', height: 1, background: 'rgba(229,229,229,0.05)' }}
          />
          {/* Vertical */}
          <div
            className="absolute top-0 bottom-0"
            style={{ left: '50%', width: 1, background: 'rgba(229,229,229,0.05)' }}
          />
        </div>

        {/* Centered pin dropping into depth — the rabbit hole */}
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '38%',
            transform: 'translate(-50%, -50%)',
            animation: 'dm-fade-in 0.4s ease-out 0.1s forwards',
            opacity: 0,
          }}
        >
          <svg width="48" height="72" viewBox="0 0 48 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Concentric rings — the depth hole */}
            <ellipse cx="24" cy="60" rx="18" ry="6" stroke="rgba(234,179,8,0.15)" strokeWidth="1" style={{ animation: 'dm-ring-pulse 2s ease-in-out 0.8s infinite' }} />
            <ellipse cx="24" cy="60" rx="12" ry="4" stroke="rgba(234,179,8,0.1)" strokeWidth="0.5" style={{ animation: 'dm-ring-pulse 2s ease-in-out 1.2s infinite' }} />
            <ellipse cx="24" cy="60" rx="6" ry="2" stroke="rgba(234,179,8,0.08)" strokeWidth="0.5" style={{ animation: 'dm-ring-pulse 2s ease-in-out 1.6s infinite' }} />
            {/* Pin — dropping in */}
            <g style={{ animation: 'dm-pin-drop 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.3s forwards', opacity: 0, transform: 'translateY(-12px)', transformOrigin: 'center' }}>
              <path d="M24 4C17.4 4 12 9.4 12 16c0 9 12 22 12 22s12-13 12-22c0-6.6-5.4-12-12-12z" fill="#eab308" />
              <circle cx="24" cy="16" r="5" fill="#1a1a2e" />
            </g>
          </svg>
        </div>

        {/* Title + tagline block — centered below pin */}
        <div
          className="absolute w-full text-center"
          style={{ top: '55%' }}
        >
          <div
            className="font-serif"
            style={{
              fontSize: 'clamp(32px, 6vw, 48px)',
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#e5e5e5',
              animation: 'dm-slide-up 0.6s cubic-bezier(0.25,0.1,0.25,1) 0.5s forwards',
              opacity: 0,
            }}
          >
            Deep Maps
          </div>
          {/* Tagline — visible, centered, below title */}
          <div
            className="font-mono"
            style={{
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: '0.08em',
              color: 'rgba(229,229,229,0.5)',
              marginTop: 16,
              animation: 'dm-fade-in 0.6s ease-out 0.9s forwards',
              opacity: 0,
            }}
          >
            Everything that ever happened happened somewhere.
          </div>
        </div>

        {/* Inline keyframes */}
        <style>{`
          @keyframes dm-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes dm-slide-up {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes dm-line-expand {
            from { width: 0; }
            to { width: 40px; }
          }
          @keyframes dm-pin-drop {
            from { opacity: 0; transform: translateY(-12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes dm-ring-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.08); }
          }
        `}</style>
      </div>
    );
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
