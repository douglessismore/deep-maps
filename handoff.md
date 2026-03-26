# Deep Maps — Session Handoff

**Last updated:** 2026-03-26 (Session 5)
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** deepmaps.app (Vercel + Supabase)
**Latest commit:** `7fd9307` — Merged `fix/content-type-enforcement` → deployed to Vercel

---

## CRITICAL: Launch from Project Root

```bash
cd ~/Documents/claude-code-projects/deep-maps && claude
```

NOT from the parent directory. MCP servers, slash commands, and settings only load when CWD matches the project root.

---

## Resources to Load (read these at session start)

| File | What | Why |
|------|------|-----|
| `handoff.md` (this file) | Session state, decisions, architecture | Orientation |
| `CLAUDE.md` | Project conventions, stack, negative constraints | Code rules |
| `ROADMAP.md` | Feature/content roadmap with priorities | What's next |
| `TODOS.md` | Actionable follow-up items with context | Deferred work |
| `DATA-SOURCES.md` | 25+ data source ideas with URLs + feasibility | Content pipeline |
| `scripts/ingest/lib/content-guide-v3.md` | Content creation standards (v3) | Quality bar |
| `.claude/commands/deep-maps-validator.md` | Validator skill (13 checks) | Content QA |
| `designs/stitch/labyrinthian_noir/DESIGN.md` | V2 design system spec from Stitch | Design reference |
| `~/.gstack/projects/douglessismore-deep-maps/sirdouglas-main-design-20260323-114828.md` | Office Hours design doc (viral launch strategy) | Product strategy |

---

## Current State

- **App:** Deep Maps — geospatial storytelling app (React 19 + TypeScript + Vite + Tailwind 4 + Leaflet + Wouter)
- **Data:** ~2,330 moments, 539 entities, 506 stories, 28 collections in Supabase
- **Backend:** Supabase is source of truth for production
- **Deployed:** Vercel at deepmaps.app, shareable URLs working (`/c/:id`, `/s/:id`, `/e/:id`)
- **Dev server:** `npx vite --host --port 5178`
- **Admin panel:** Live at `/admin`
- **Rapid Verify:** Live at `/verify`
- **Tests:** Vitest installed, 7 tests for content-type filter (first test infrastructure)
- **Typography:** Newsreader (serif), Manrope (sans), Space Grotesk (mono) — applied to both V1 default and V2 themes

---

## What Was Done This Session (2026-03-26 Session 5)

### 1. Eng Review on Data Architecture (gstack /plan-eng-review)
- Full review of story/entity/place boundary enforcement
- Identified root cause: 6 scattered blacklist filters with inconsistent coverage
- Plan: `.claude/plans/gleaming-percolating-lampson.md`

### 2. Content-Type Boundary Enforcement
- **Centralized filter:** `filterBrowseableStories()` in entityHelpers.ts — whitelist `storyType === 'incident'`
- **DataProvider dual export:** `stories` (all types for entity panels/admin) + `browseableStories` (incident-only for browse/search)
- **Replaced 6 scattered filters** in ExplorePanel, SearchOverlay, StoryPanel, LocationCard, EntityPanel
- **App.tsx pipeline** uses `browseableStories` → `displayStories` → `timelineFilteredStories`

### 3. Concept Entity Filtering
- Removed `servant-girl-annihilator` concept entity from static data (was duplicating the incident story in Dive Deeper)
- Added `entity.type !== 'concept'` filter to both LocationCard and StoryPanel Dive Deeper sections
- Concept entities are abstract labels, not navigable destinations — filtered from all Dive Deeper cards

### 4. V2 Fonts Applied to V1 Default Theme
- CSS variables: Newsreader (serif), Manrope (sans), Space Grotesk (mono) now in `:root`
- All card titles (StoryCard, PersonCard, CollectionCard, LocationCard, GoDeeperCard) changed from `font-sans` to `font-serif`
- Mobile panel headers changed to `font-serif`
- All hardcoded Crimson Text / IBM Plex Mono references replaced in MapView, EmergenceLayer, constellation.ts, index.css

### 5. Database Migration 008 (Written, Not Yet Run)
- `supabase/migrations/008_content_type_constraints.sql`
- Validation trigger: person entity `canonical_story_id` must reference biography story
- Backslash cleanup trigger on INSERT/UPDATE for moments, stories, entities
- One-time data cleanup SQL for existing trailing backslashes

### 6. Write-Path Sanitization
- `cleanStr()` added to `seed-supabase.ts` and `full-sync-to-supabase.ts`
- Prevents backslash artifacts at write time (read-time `cleanStr()` in supabase-loader.ts remains as safety net)

### 7. Drift Detection Script
- `scripts/check-drift.ts` — compares Supabase row counts vs static file counts
- Warns on drift, suggests `dump-from-supabase.ts` to sync

### 8. First Test Infrastructure
- Vitest installed, `npm test` runs `vitest run`
- 7 tests for `filterBrowseableStories()` in `src/lib/__tests__/entityHelpers.test.ts`

---

## Not Yet Done (Needs Action)

### Supabase Actions (FIRST PRIORITY next session)
1. **Run migration 008** against Supabase SQL Editor — `supabase/migrations/008_content_type_constraints.sql`. Adds validation triggers (entity-story type matching, backslash cleanup on write) + one-time data cleanup of existing trailing backslashes. Safe and reversible.
2. **Remove SGA concept entity** from Supabase `entities` table + its `moment_entities` rows
3. **Clean 3 duplicate moments** in Supabase (Jordan River baptism, Comaneci perfect 10, Einstein papers)
4. **Fix Treaty Oak related-story wiring** — remove from SGA's `related_stories` (should be "nearby" not "related")
5. **6 content fixes from Session 4:** Dazed rename, Booker T delete, Paramount/Scholz wiring, Outlaw rename, backslash audit
6. **Run Supabase data integrity audit** — query for all orphan moments (no entity links), unlinked moments (no story_moments), concept entities, and duplicate moments. Batch-fix with scripts.
7. **Run `dump-from-supabase.ts`** to sync static files (46 stories behind)
8. **Reclassify 14 concept entities** — most should be stories or organizations, not concepts

---

## Immediate Next Session Priorities

1. **Supabase data integrity cleanup** — Run migration 008, remove SGA concept, fix orphans/dupes/wiring. See "Supabase Actions" above.
2. **Ship shareable collection URLs with OG tags** — #1 strategic priority per office hours doc
3. **Add Plausible analytics** — one script tag, tracks collection performance
4. **Post first collection to Reddit** — Serial Killer Crime Scenes to r/TrueCrime

---

## Key Architectural Decisions

1. **`browseableStories` whitelist** — DataProvider exports `stories` (all) + `browseableStories` (incident-only). UI components use the appropriate one. Whitelist `storyType === 'incident'` means new types are hidden by default.
2. **Concept entities filtered from Dive Deeper** — `entity.type !== 'concept'` in LocationCard + StoryPanel.
3. **Biography stories are invisible infrastructure** — Users see person entities, not biography stories.
4. **Runtime loader uses paginated `.range()`** — NEVER `.limit()` for bulk fetches.
5. **All join tables must be populated** — `moment_entities`, `story_moments`, `collection_moments` required for visibility.
6. **Content guide is single source of truth** — Validator checks AGAINST it, never modifies it.
7. **Sync script runs two passes** — FK ordering requires stories before entities.
8. **Admin panel reads/writes Supabase directly** — No static file dependency.
9. **Vercel Edge Middleware for OG tags** — User-agent detection, direct Supabase REST fetch.
10. **URL routing is state-driven** — Wouter `useLocation` syncs URL and React state.
11. **Deep links activate on DataProvider ready** — URL routing waits for data.
12. **Accuracy tiers:** pinpoint (~3m), exact (~10-50m), approximate (~100-500m), general-area (1km+).
13. **`update_moment_location` RPC** for atomic coordinate updates.

---

## Known Issues

1. **Desktop header clutter** — Category pills + Near Me + Surprise Me + Search crowd the V1 header on desktop. Flagged this session. V2 header is cleaner.
2. **Map panning randomly** (Andrew's bug) — scroll-driven, not yet fixed
3. **Markers disappearing intermittently** — monitoring
4. **845 orphan moments** without entity links — see TODOS.md
5. **46 stories in Supabase but not in static files** — run `dump-from-supabase.ts` to sync
6. **14 remaining concept entities** — 6 have canonicalStoryIds (caught by filter), 8 don't. Content cleanup needed.
7. **V2 collection zoom** — zooms in too far when clicking collections. V1 does not have this issue.

---

## Architecture Reference

### Key Files

| File | Role |
|------|------|
| `middleware.ts` | Vercel Edge Middleware — OG tags for social crawlers |
| `src/App.tsx` | State, URL sync, deep link activation, `browseableStories` pipeline |
| `src/components/map/MapView.tsx` | Map, markers, polylines, scroll highlight |
| `src/components/panel/ExplorePanel.tsx` | All 4 tabs, scroll tracking, viewport entity display |
| `src/lib/entityHelpers.ts` | `filterBrowseableStories()`, entity functions, viewport entities |
| `src/lib/data/supabase-loader.ts` | Supabase → app data mapping (paginated fetchAll, cleanStr) |
| `src/lib/data/provider.tsx` | DataProvider: Supabase-first, static fallback, `browseableStories` |
| `src/lib/__tests__/entityHelpers.test.ts` | Vitest tests for content-type filter |
| `scripts/check-drift.ts` | Supabase vs static file parity check |
| `supabase/migrations/008_content_type_constraints.sql` | Validation triggers (not yet run) |

---

## Session Startup Checklist

0. **Launch Claude Code from project root** — `cd ~/Documents/claude-code-projects/deep-maps && claude`
1. Read this `handoff.md`
2. Read `CLAUDE.md`
3. Read `ROADMAP.md` + `TODOS.md`
4. Read content guide: `scripts/ingest/lib/content-guide-v3.md`
5. Check `.gstack/` for QA reports and design docs
6. Dev server: `npx vite --host --port 5178`
7. Run tests: `npm test`
