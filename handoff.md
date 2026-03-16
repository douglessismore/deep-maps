# Deep Maps — Session Handoff (2026-03-16, Session 45)

## Current State

**Build:** Clean (`npx tsc -b` + `npx vite build` — zero errors)
**Branch:** `main` (uncommitted — all Phase 0-6 changes are staged but not committed)
**Data:** 602 moments, 191 stories, 210 entities (141 person, 43 place, 15 concept, 11 org), 30 collections
**Supabase:** Project `fhxyaoaaeztrycfoppeu` in douglaslabs org. Schema deployed, data migrated. **Default data source is now Supabase.**
**Main bundle:** 493KB (down from 1,232KB — static data code-split into lazy chunks)

---

## Supabase Migration — Status

### Phase 0: Schema ✅ COMPLETE
- Schema deployed to Supabase SQL Editor
- Extensions: `postgis`, `pg_trgm`
- 9 enums, 28 moment types, 4 core tables, 6 join tables
- GEOMETRY(Point, 4326), GIST indexes, GRANT-based security (no RLS)

### Phase 1: Migration ✅ COMPLETE
- `scripts/migrate-to-supabase.ts` — ran successfully
- 602 moments, 191 stories, 210 entities, 30 collections + all join tables migrated
- Type consolidation: `home`→`residence`, `historic_home`→`residence`, `natural_feature`→`natural_site`
- Years parsing: handles "1957", "1978–1991", "c. 1200 BCE", "3100 BCE–30 BCE"
- 1 invalid FK ref found and skipped: `wwii-decisive-battles` → `manhattan-project`

### Phase 2: Client Data Layer ✅ COMPLETE
- `src/lib/supabase.ts` — module-scope singleton
- `src/lib/data/supabase-loader.ts` — fetches all 10 tables in parallel, reassembles joins
- `src/lib/data/provider.tsx` — DataProvider with TanStack Query + React Context
- Feature flag: `?data=supabase` URL param or `VITE_DATA_SOURCE` env var (default: `static`)
- `.env.local` has credentials (gitignored)

### Phase 3: Swap Imports ✅ COMPLETE
ALL component files rewired from static imports to `useAppData()`:
- `App.tsx`, `ExplorePanel.tsx`, `StoryPanel.tsx`, `WikiPanel.tsx`
- `MapView.tsx`, `EmergenceLayer.tsx`, `HeatmapLayer.tsx`

ALL library files rewired from static imports:
- `geo.ts` — parameterized (`momentMap` as function param)
- `entityHelpers.ts` — deferred init (`initEntityHelpers()` called by DataProvider)
- `clustering.ts` — deferred init (`initClustering()` called by DataProvider)

**Only `provider.tsx` still imports from `src/data/`** — needed for the `static` data path.

Both data paths verified identical: `?data=static` and `?data=supabase` show 133 moments, 85 stories, 24 places, 17 collections.

### Phase 4: PostGIS Viewport RPC ⏳ DEFERRED
Not needed at 602 moments. Becomes critical at 5K+.

### Phase 5: External Data Ingestion ⏳ NOT STARTED
Waiting for Phase 4 or direct dataset ingestion.

### Phase 6: Cleanup ✅ COMPLETE
- Default data source switched to `supabase`
- Static data imports made lazy (dynamic `import()`) — code-split into separate chunks
- Static files kept as `?data=static` escape hatch (not deleted — zero cost, safety net)
- Main bundle: 1,232KB → 493KB (60% reduction)

---

## ⚠️ BEFORE DEPLOYING — Vercel Env Vars Required

Add these in Vercel dashboard → Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://fhxyaoaaeztrycfoppeu.supabase.co
VITE_SUPABASE_ANON_KEY=<copy from .env.local>
```
Without these, the production app will fail to connect to Supabase.

---

## Changelog (Session 45)

| What | Files |
|------|-------|
| Phase 1: Migration script | `scripts/migrate-to-supabase.ts` |
| Phase 2: Client data layer | `src/lib/supabase.ts`, `src/lib/data/supabase-loader.ts`, `src/lib/data/provider.tsx`, `src/main.tsx` |
| Phase 3: Swap imports (components) | `App.tsx`, `ExplorePanel.tsx`, `StoryPanel.tsx`, `WikiPanel.tsx`, `MapView.tsx`, `EmergenceLayer.tsx`, `HeatmapLayer.tsx` |
| Phase 3: Swap imports (libraries) | `geo.ts`, `entityHelpers.ts`, `clustering.ts` |
| Phase 6: Default → Supabase, lazy static | `src/lib/data/provider.tsx` |

---

## Key Architecture Decisions (Supabase Migration)

| Decision | Choice | Why |
|----------|--------|-----|
| GEOMETRY vs GEOGRAPHY | **GEOMETRY(Point, 4326)** | All queries are bounding-box viewport queries. Paul Ramsey recommendation. |
| State management | **TanStack Query + Context** | TQ handles fetch lifecycle, Context distributes loaded data. Dan Abramov recommendation. |
| Non-spatial queries | **PostgREST** | Faster, cacheable, auto-typed. RPC only for spatial viewport query. |
| Security | **GRANT SELECT, no RLS** | Public-read with service_role writes. 10-15% faster. |
| Library refactoring | **Deferred init** (not parameterize every function) | entityHelpers and clustering have 10+ functions closing over data. `initEntityHelpers(entities, moments, stories)` called once by DataProvider. Minimal caller changes. |
| Feature flag | **URL param + env var** | `?data=supabase` for testing without rebuilding. |
| PostgREST returns GeoJSON | Transform in `supabase-loader.ts` | `coordinates: [lng, lat]` → `{ lat, lng }` on Moment type |
| EWKT for inserts | `SRID=4326;POINT(lng lat)` | PostgREST format for GEOMETRY columns |

---

## Pending Items

### Immediate Next Steps
- [ ] **Set Vercel env vars** — `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (copy from `.env.local`)
- [ ] **Commit all changes** — Phases 0-6 are complete but uncommitted
- [ ] **Fix missing story** — Create `manhattan-project` story (referenced by `wwii-decisive-battles`)
- [ ] **Desktop card expansion bug** — Fix wheel-scroll feedback loop (Option A: debounce wheel events separately from touch)

### Content Work
- [ ] Create ~20-30 place entities for world landmarks (all 43 current are Americas-only)
- [ ] Tag remaining 204 moments with entityIds (34% untagged)
- [ ] Add notable film-related moments (council says: curate 50-200 where filming IS the history, not bulk ingest)

### Architecture (Post-Supabase)
- [ ] Phase 4: PostGIS viewport RPC (when scaling past 5K moments)
- [ ] Phase 5: External data ingestion (notable people, UNESCO, NRHP, etc.)
- [ ] Supercluster → Web Worker at 50K+ moments
- [ ] Server-side clustering via PostGIS grid at 500K+
- [ ] PWA setup (`vite-plugin-pwa`) — recommended first step toward native app
- [ ] Capacitor wrapper — add later if App Store presence needed

### Decided (Expert Council Verdicts)
- **Films:** Don't add as entity type. Add film moments that pass notability bar. Use `creative_work` entity type only if cross-referencing proves needed. Wikidata P915 (~15-25K entries) is best open dataset for research, not bulk ingest.
- **"Here" phrasing:** Don't rewrite descriptions. Build render-time transformation: inject spatial framing only when user is in proximity mode + accuracy is `exact` + verification is `verified`/`documented`. Keeps descriptions context-independent.
- **Native app:** PWA first (days of work), Capacitor later if needed. React Native is overkill (full rewrite).

---

## Supabase Credentials

- **Project ref:** `fhxyaoaaeztrycfoppeu`
- **URL:** `https://fhxyaoaaeztrycfoppeu.supabase.co`
- **Org:** douglaslabs
- **Keys:** in `.env.local` (gitignored)

## Expert Council
Jimmy Wales (encyclopedic clarity), Steve Jobs (design simplicity), Edward Tufte (data visualization).
Martin Kleppmann (data migration), Paul Ramsey (PostGIS), Dan Abramov (React architecture).

## File Map

| File | Role |
|------|------|
| `src/lib/data/provider.tsx` | **DataProvider** — TanStack Query + Context, dual data source, init helpers |
| `src/lib/data/supabase-loader.ts` | Fetches all tables, reassembles joins into app types |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/entityHelpers.ts` | Entity aggregation (deferred init) |
| `src/lib/clustering.ts` | Supercluster index (deferred init) |
| `src/lib/geo.ts` | Spatial utils (parameterized) |
| `src/data/*.ts` | Static data files (kept as `?data=static` fallback, lazy-loaded) |
| `scripts/migrate-to-supabase.ts` | One-time migration script |
| `supabase/migrations/001_initial_schema.sql` | Full Supabase schema |
| `.claude/plans/magical-singing-beaver.md` | Full 6-phase migration plan |
