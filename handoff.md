# Deep Maps — Session Handoff

**Last updated:** 2026-03-25 (Session 2)
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** deepmaps.app (Vercel + Supabase)
**Latest commit:** `0951f63` — scroll highlight fix + president scripts + roadmap

---

## Current State

- **App:** Deep Maps — geospatial storytelling app (React 19 + TypeScript + Vite + Tailwind 4 + Leaflet + Wouter)
- **Data:** ~2,330 moments, 539 entities, 506 stories, 28 collections in Supabase
- **Backend:** All synced to Supabase (source of truth for production)
- **Deployed:** Vercel at deepmaps.app, shareable URLs working (`/c/:id`, `/s/:id`, `/e/:id`)
- **Dev server:** `npx vite --host --port 5178`
- **Admin panel:** Live at `/admin`
- **Rapid Verify:** Live at `/verify`
- **Stitch MCP:** User ran `claude mcp add stitch` — restart Claude Code to activate

---

## What Was Done This Session (2026-03-25 Session 2)

### 1. Fixed 48 Orphan Person Entities — Biography Stories Created
- Script: `scripts/ingest/fix-orphan-biographies.ts`
- 47 new biography stories created in Supabase (invisible infrastructure)
- 1 existing story re-linked (Tokugawa Ieyasu)
- Covers: Napoleon, Rosa Parks, Steve Jobs, FDR, Poe, Jesse Owens, Virginia Woolf, Oskar Schindler, Bill Gates, + all BG entities (Garland, Ramone, Proust, Bernstein, Pulitzer, etc.)
- All entities now have `canonical_story_id` → moments visible in entity panels
- **13 person entities remain without stories** (zero moments — no action needed)

### 2. Completed US Presidents Burials Collection (39/39)
- **24 existing** BillionGraves-sourced burials (pinpoint ~3m accuracy)
- **15 new** manually-researched burials (exact ~10-50m accuracy)
  - Script: `scripts/ingest/presidents-missing-generate.ts`
  - Added: John Adams, Madison, W.H. Harrison, Polk, Buchanan, Hayes, Garfield, Chester Arthur, McKinley, Wilson, Harding, JFK, Nixon, Ford, Carter
  - Created entities + biography stories + moments + all join table wiring
- **Collection created:** "Where Every US President Is Buried" (`us-presidents-burials`) with all 39 moments

### 3. Created 8 Cemetery Place Entities
- Hollywood Forever Cemetery (5 burials: Garland, DeMille, Fairbanks, Ramone, Rooney)
- Woodlawn Cemetery, Bronx (4: Berlin, Stanton, Pulitzer, La Guardia)
- Highgate Cemetery, London (3: Faraday, Litvinenko, Marx)
- Père Lachaise Cemetery, Paris (2: Proust, Stein)
- Green-Wood Cemetery, Brooklyn (2: Bernstein, Tiffany)
- Arlington National Cemetery (2: Taft, JFK)
- Westminster Abbey, London (2: Dickens, Livingstone)
- Hollywood Cemetery, Richmond (2: Monroe, Tyler)
- All wired via `moment_entities` join table — visible in Places tab

### 4. Fixed Moments Tab Scroll Highlight Bug
- **Root cause:** Key mismatch in ExplorePanel.tsx — card keys used `'no-story'` for story-less moments but lookup used `undefined`
- **Fix:** Changed lookup to `v.story?.id ?? 'no-story'` + used `viewportLocationsRef` to prevent effect re-runs
- **Deployed:** Commit `0951f63`, live on Vercel
- **Status:** User reports highlight still not working — likely browser cache. Hard refresh needed.

### 5. Updated Barbara Jordan Burial
- GPS: 30.265358, -97.727207 (pinpoint from cemetery.texas.gov)
- Subtitle: "Texas State Cemetery, Republic Hill Section 1 Row N Number 6 · 909 Navasota St, Austin, TX"
- Source: https://cemetery.texas.gov/locate-a-plot/

### 6. Roadmap Updates
- Added: Place type filtering (filter moments by burial/residence/battlefield/etc.)
- Added: Tour Guide Mode (premium — route-based narration with theme preferences)
- Added: Walking tour / road trip collections (start with Rome, Paris, London)
- Added: Indigenous collection rename (too stylized, needs matter-of-fact name)
- Added: Texas State Cemetery ArcGIS scrape (~3,200 burials with pinpoint GPS)
- Added: US Presidents Burials collection (completed)

---

## Stitch MCP Integration

- User completed `npx @_davideast/stitch-mcp init` with Proxy transport + API Key auth
- User ran `claude mcp add stitch -e STITCH_API_KEY=... -- npx @_davideast/stitch-mcp proxy`
- **Next:** Restart Claude Code → tools available: `get_screen_code`, `get_screen_image`, `build_site`
- Stitch project has Deep Maps redesign mockups: dark/light explore, entity profile, story detail, timeline redesign

## Design Redesign Plan

- Create `design-v2` branch for full redesign
- Implement Stitch design ideas incrementally (highest-impact first)
- Priority order: (A) color palette + typography, (B) card redesign, (C) timeline bar polish, (D) mobile bottom nav, (E) "Follow This Rabbit Hole" CTA
- Keep all existing functionality (scroll-driven map, clustering, story mode, entity mode, collections, timeline)

---

## Immediate Next Session Priorities

1. **Test Stitch MCP connection** — pull design mockups, analyze for implementation
2. **Create `design-v2` branch** — start with color palette + typography
3. **Verify scroll highlight fix** — user hard-refresh, confirm tooltips appear on scroll
4. **Subtitle format for burials** — update all cemetery burial subtitles to include plot/section/row info where available (pattern: "Cemetery Name, Section X Row Y Number Z · Address")
5. **Run `/deep-maps-validator`** on all new content (47 biographies + 39 president burials)
6. **Restore 46 deleted stories to static `stories.ts`** — low priority, Supabase is source of truth
7. **Post first collection to Reddit** (after geo-verification)

---

## Key Architectural Decisions

1. **Biography stories are invisible infrastructure** — Users see person entities, not biography stories. Filtered from search, browse, related/nearby.
2. **Runtime loader uses paginated `.range()`** — NEVER `.limit()` for bulk fetches. Supabase silently truncates at 1000.
3. **All join tables must be populated** — `moment_entities`, `story_moments`, `collection_moments` are required for entities/stories/collections to appear in the app. See memory: `feedback_supabase_visibility.md`.
4. **Content guide is single source of truth** — Validator checks AGAINST it, never modifies it.
5. **Sync script runs two passes** — FK ordering requires stories to exist before entities can reference them.
6. **Admin panel reads/writes Supabase directly** — No static file dependency for admin workflows.
7. **Vercel Edge Middleware for OG tags** — User-agent detection, direct Supabase REST fetch.
8. **URL routing is state-driven** — Wouter `useLocation` syncs URL and React state.
9. **`getEntityLocations` includes story-less moments** — `story: Story | null` pattern.
10. **`getEntityMomentStories` only pulls canonical moments** from biography storyType.
11. **Accuracy tiers:** pinpoint (~3m BillionGraves headstone), exact (~10-50m), approximate (~100-500m), general-area (1km+).
12. **Geo verification columns:** `geo_verified`, `geo_source_url`, `geo_verified_at` in Supabase.
13. **`update_moment_location` RPC** for atomic coordinate updates.
14. **Deep links activate on DataProvider ready** — URL routing waits for data.
15. **Place entities need moment_entities rows** to appear in Places tab — `getViewportEntities()` filters entities by whether they have moments in the viewport.

---

## BillionGraves Integration

### Pipeline Architecture (Two-Phase)
- **Phase 1 (Discovery):** Chrome browser automation searches BG for each entity → `bg-chrome-results.json`
- **Phase 2 (Verification):** `npx tsx scripts/ingest/billiongraves.ts` reads mapping → fetches GPS via `__NEXT_DATA__` → compares → publishes

### What Was Published (Total)
- 24 president burials (pinpoint from BG)
- 15 existing-entity burials (Lincoln, Hamilton, Poe, Marx, Curie, Ali, etc.)
- 14 new person entities from notable cemeteries (Proust, Stein, Faraday, Garland, etc.)
- 8 cemetery place entities

### Key Files
| File | Purpose |
|------|---------|
| `scripts/ingest/billiongraves.ts` | Phase 2: mapping-based GPS verification |
| `scripts/ingest/lib/billiongraves-client.ts` | BG page fetch + GPS extraction |
| `scripts/ingest/bg-presidents-generate.ts` | President burial moment generation (BG) |
| `scripts/ingest/presidents-missing-generate.ts` | 15 missing presidents (manual research) |
| `scripts/ingest/fix-orphan-biographies.ts` | Batch create biography stories for orphan entities |
| `scripts/ingest/bg-publish.ts` | Publish moments to Supabase |
| `scripts/output/bg-*.json` | Intermediate data files |

---

## Bug Fixes This Session

- **Moments tab scroll highlight:** Key mismatch (`undefined` vs `'no-story'`) + race condition from viewportLocations effect dependency. Fix deployed in `0951f63`.
- **Phase A orphan wiring:** 1 moment (`clyde-western-heights`) wired to Bonnie and Clyde story.

---

## Known Issues

1. **Scroll highlight may need hard refresh** — deployed fix in `0951f63`, user reports not working (likely cached JS)
2. **Map panning randomly** (Andrew's bug) — scroll-driven, not yet fixed
3. **Markers disappearing intermittently** — monitoring
4. **~163 orphan moments** without entity links (reduced from 574)
5. **Static map on scroll** — parked
6. **46 stories in Supabase but not in static `stories.ts`** — low priority
7. **8 BG burial descriptions exceed 500 char limit** — need trimming
8. **Indigenous collection name too stylized** — needs rename to matter-of-fact

---

## Data Sources

- See `DATA-SOURCES.md` for full list (25+ sources)
- **BillionGraves:** Per-headstone GPS, pinpoint accuracy (~3m)
- **Texas State Cemetery:** ArcGIS map with ~3,200 burials, pinpoint GPS. Source: https://cemetery.texas.gov/locate-a-plot/
- **Cross-verified database** (2.29M people) for notability scoring
- **oddstops.com** — verified crime/dark history locations

---

## Architecture Reference

### Key Files

| File | Role |
|------|------|
| `middleware.ts` | Vercel Edge Middleware — OG tags for social crawlers |
| `src/App.tsx` | State, URL sync, deep link activation |
| `src/components/map/MapView.tsx` | Map, markers, polylines, scroll highlight |
| `src/components/panel/ExplorePanel.tsx` | All 4 tabs, scroll tracking, viewport entity display |
| `src/lib/entityHelpers.ts` | Entity functions (biography filter, viewport entities, orphan inclusion) |
| `src/lib/data/supabase-loader.ts` | Supabase → app data mapping (paginated fetchAll) |
| `src/lib/data/provider.tsx` | DataProvider with Supabase-first, static fallback |
| `scripts/ingest/lib/content-guide-v3.md` | Content creation standards (v3) |
| `.claude/commands/deep-maps-validator.md` | Validator skill (13 checks) |
| `ROADMAP.md` | Feature/content roadmap (updated this session) |

---

## Session Startup Checklist

1. Read this `handoff.md`
2. Read `ROADMAP.md`
3. Read `DATA-SOURCES.md`
4. Read content guide: `scripts/ingest/lib/content-guide-v3.md`
5. Check memory: `~/.claude/projects/.../memory/MEMORY.md`
6. Check `.gstack/` for QA reports and design docs
7. Test Stitch MCP tools: `get_screen_image`, `get_screen_code`
8. Dev server: `pushd deep-maps && npx vite --host --port 5178`
