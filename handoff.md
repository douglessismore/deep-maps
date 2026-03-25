# Deep Maps — Session Handoff

**Last updated:** 2026-03-25
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** deepmaps.app (Vercel + Supabase)

---

## Current State

- **App:** Deep Maps — geospatial storytelling app (React 19 + TypeScript + Vite + Tailwind 4 + Leaflet + Wouter)
- **Data:** 2,291 moments, 488 entities, 459 stories, 27 collections in Supabase
- **Backend:** All synced to Supabase
- **Deployed:** Vercel at deepmaps.app, shareable URLs working (`/c/:id`, `/s/:id`, `/e/:id`)
- **Dev server:** `npx vite --host --port 5178`
- **Admin panel:** Live at `/admin`
- **Rapid Verify:** Live at `/verify`
- **OG meta tags:** Verified on Twitter Card Validator and Facebook Sharing Debugger
- **Vercel Edge Middleware:** Serving OG tags to social crawlers
- **Frontend pin editor:** Live on all moment cards (admin mode)
- **Batch geocoding:** 270 pins auto-corrected via Nominatim
- **Pinpoint accuracy tier:** Added to Supabase enum

---

## Key Tools Built This Session

### 1. Shareable URLs + Vercel Edge Middleware for OG Tags
- Vercel Edge Middleware (`middleware.ts`) intercepts social crawlers via user-agent detection
- Direct Supabase REST API fetch for OG metadata (no SDK, ~50ms)
- Wouter routes: `/c/:id`, `/s/:id`, `/e/:id`
- URL-to-state bidirectional sync in `App.tsx`
- Generic `og-default.png` preview image
- Fix: removed Route wrapper that was blocking deep link panel rendering

### 2. Rapid Verify Tool (`/verify`)
Mobile-first geo-verification workflow:
- Satellite map with draggable pins + street labels
- "Is this pin in the right spot?" flow: Yes / Adjust / Skip
- Snap-to-address geocoding button
- Multi-source URLs + notes fields
- Search/jump-to any moment (Supabase fallback for pagination)
- Streak counter, progress bar, keyboard shortcuts
- Collection + unverified + flagged filters

### 3. Frontend Pin Editor
- Admin overlay on LocationCard (all moment cards)
- Draggable markers for coordinate correction
- Satellite imagery toggle for visual verification
- Geo verification workflow (verified/unverified status)
- Source URL tracking per moment
- Batch review mode with auto-advance

### 4. Batch Geocode Script (`scripts/batch-geocode.ts`)
- Nominatim-based batch geocoding
- 270 auto-corrections, 17 flagged, 127 failed

### 5. Pre-Commit Data Validator (13 checks)
- 1.1-1.8: Original checks (schema, refs, content quality)
- 1.9: Collection content appropriateness
- 1.10: Duplicate collection detection
- 1.11: False entity link detection (substring matching)
- 1.12: Duplicate moment detection within stories/entities
- 1.13: Sensitivity and tone check

### 6. Validator Skill (`/deep-maps-validator`)
- Claude skill at `.claude/commands/deep-maps-validator.md`
- Runs all 13 checks against content guide as source of truth

---

## Content Changes

- **Billy the Kid:** 6 moments (was 3), burial at pinpoint coords from HMdb/Google Maps
- **30 serial killer expansion moments** (Night Stalker, BTK, Green River, Wuornos, Manson, etc.)
- **30 meteorite crater moments** (batch 1 of ~194 confirmed structures)
- **342 moments from 8 content batches** (cities, people, films, science, culture, exploration, sports, ancient world, modern history, geographic gaps)
- **Dense tourist content:** Paris, London, Rome, NYC, Tokyo, Kyoto, Mexico City, Buenos Aires, Istanbul
- **Collection cleanup:** 39 issues fixed, duplicates merged (sports, inventions)
- **Serial killer collection** scoped to crime scenes only (removed arrests, prisons, executions, workplaces)
- **Trump content** noted for rewrite (not yet done)
- **O. Henry:** 9 orphan moments wired into biography + entityIds added
- **Wikipedia encoding:** fixed 17 percent-encoded slugs
- **Munich massacre** removed from sports collection
- **Wright Brothers** duplicate moments removed
- **Devil in the White City** renamed
- **Clyde Barrow** duplicate grave story removed

---

## Audits Completed

- **Serial killer geocoding:** 15 fixes (7 critical, 8 warning)
- **All-collections geocoding:** 6 critical + 11 warning across 89 moments sampled
- **Collection content audit:** 39 issues (broken refs, misplaced moments, duplicate collections)
- **Batch geocode:** 270 auto-corrections, 17 flagged, 127 failed
- Reports at `scripts/output/serial-killer-geocoding-audit.md`, `all-collections-geocoding-audit.md`, `collection-full-audit.md`

---

## User Feedback (Andrew + Nate + Mom)

- **Andrew:** Map jumps randomly, markers disappear
- **Nate:** Wikipedia preview broken (fixed), timeline bar confusing, wants pictures, wants current events, asks about monetization
- **Mom:** Elvis search -> blank panel (fixed for orphan moments)
- **Billy the Kid** moments had incorrect entity linking (fixed)
- **oddstops.com** suggested as geo-verification source
- **Expansion idea:** cool places like springs, ruins, trails (Nate)
- **Retention idea:** incorporate current events (Nate)

---

## Bug Fixes This Session

- **Entity panel jumping:** No longer jumps to first moment on entry, shows all markers
- **Search orphan moments:** Search result click -> blank panel for orphan moments (now goes to moments tab)
- **Search query persistence:** Query now cleared after navigation so tabs aren't filtered
- **Wikipedia slug encoding:** Percent-encoded -> actual characters (17 slugs fixed)
- **Biography story leak:** `getEntityMomentStories` only pulls from biography storyType (75 entities affected)
- **Antimeridian bug:** Markers vanish scrolling west (fixed)
- **Moon landing pins:** Placed at Mission Control, not Moon (fixed)
- **Collection polylines:** Working on collections
- **Scroll bouncing:** `isUserScrolling` ref prevents external scroll-to during user scroll (both panels)
- **"0 stories" hidden** on person cards when count is 0
- **Entity scroll panning** re-enabled for mobile
- **Orville Wright** false entity link (Rosewood/John Wright) removed
- **Various entity false positive links** cleaned up

---

## BillionGraves Integration (Built This Session)

### Pipeline Architecture (Two-Phase)
- **Phase 1 (Discovery):** Chrome browser automation searches BG for each entity. Uses Next.js client-side router trick for batch navigation (~5 min for 60 entities). Outputs search results JSON.
- **Phase 2 (Verification):** `npx tsx scripts/ingest/billiongraves.ts` reads mapping file → fetches GPS from BG record pages via `__NEXT_DATA__` → compares with existing coords → auto-updates or flags for review.

### Key Finding: BG GPS Extraction
BG record pages embed full data in `__NEXT_DATA__.props.pageProps.apiData.Record` including `lat`, `lon`, `cemetery_name`, etc. No auth needed — just fetch the page and parse JSON. Headstone-level GPS (~3m precision).

### What Was Published
1. **2 existing burial GPS corrections:** Clyde Barrow (50m), Barbara Jordan (437m) → pinpoint accuracy
2. **15 burial moments for existing entities:** Lincoln, Hamilton, Poe, Marx, Curie, Ali, FDR, TR, Edison, Churchill, Livingstone, Rosa Parks, Burnham, Gauss, Dick Hickock
3. **14 NEW person entities + burial moments from notable cemeteries:** Proust, Stein (Père Lachaise), Faraday, Litvinenko (Highgate), Garland, DeMille, Fairbanks, Ramone, Rooney (Hollywood Forever), Berlin, Stanton, Pulitzer, La Guardia (Woodlawn), Bernstein, Tiffany (Green-Wood)

### Known Issues
- 8 of 15 existing-entity burial descriptions exceed 500 char limit (need trimming)
- Validator skill was NOT run on new content — should be run before considering production-ready
- Some BG matches were false positives (wrong person at wrong cemetery) — filtered by cemetery-aware scoring

### Key Files
| File | Purpose |
|------|---------|
| `scripts/ingest/billiongraves.ts` | Phase 2: mapping-based GPS verification pipeline |
| `scripts/ingest/lib/billiongraves-client.ts` | BG page fetch + `__NEXT_DATA__` GPS extraction |
| `scripts/ingest/lib/name-matching.ts` | Jaro-Winkler + death year + cemetery scoring |
| `scripts/ingest/bg-score-matches.ts` | Score BG search results against entities |
| `scripts/ingest/bg-generate-moments.ts` | LLM burial moment generation for existing entities |
| `scripts/ingest/bg-cemetery-generate.ts` | LLM burial moment + entity generation for new people |
| `scripts/ingest/bg-publish.ts` | Publish reviewed moments to Supabase |
| `scripts/output/bg-*.json` | Various intermediate data files |

---

## Critical Fixes Deployed This Session

1. **Black screen crash (FIXED, deployed):** `accuracy: 'pinpoint'` not in frontend `ACCURACY_DISPLAY` lookup → React crash. Added `pinpoint` to `LocationAccuracy` type, `LocationCard.tsx`, `MiniMap.tsx`, `RapidVerify.tsx`. Commit `d46991f`, deployed to Vercel.
2. **46 deleted stories restored to Supabase:** Commit `6409e36` incorrectly deleted 46 stories (Servant Girl Annihilator, Ed Gein, Dahmer, Bundy, JFK, MLK, Rosa Parks, Willie Nelson, Congress Ave Bats, Texas State Cemetery, etc.). All 46 restored to Supabase with 138 story_moments links. NOT yet restored to static `stories.ts` file (Supabase is source of truth for production).

## Stitch MCP Integration (In Progress)

- User ran `npx @_davideast/stitch-mcp init --client cc --transport stdio --yes`
- Selected API Key auth, pasted key
- **Next:** Restart Claude Code to activate MCP tools (`get_screen_code`, `get_screen_image`, `build_site`)
- Stitch project has Deep Maps redesign mockups: dark/light explore, entity profile, story detail, timeline

## Design Redesign Plan

- Create `design-v2` branch for full redesign
- Implement Stitch design ideas incrementally (highest-impact first)
- Priority order: (A) color palette + typography, (B) card redesign, (C) timeline bar polish, (D) mobile bottom nav, (E) "Follow This Rabbit Hole" CTA
- Keep all existing functionality (scroll-driven map, clustering, story mode, etc.)

## Immediate Next Session Priorities

1. **Test Stitch MCP connection** — verify tools work after restart
2. **Create `design-v2` branch** — start implementing Stitch design ideas
3. **Create biography stories for 33 orphan BG entities** — so their burial moments show as proper stories
4. **Complete US Presidents collection** — 15 missing presidents, create Supabase collection
5. **Run `/deep-maps-validator`** on all 51 BG burial moments
6. **Fix remaining UX bugs:** map panning randomly (Andrew), markers disappearing
7. **Post first collection to Reddit** (after geo-verification)
8. **Restore 46 deleted stories to static `stories.ts`** — currently only in Supabase

---

## Key Architectural Decisions

1. **Biography stories are invisible infrastructure** — Users see person entities, not biography stories. Filtered from search, browse, related/nearby.
2. **Runtime loader uses paginated `.range()`** — NEVER `.limit()` for bulk fetches. Supabase silently truncates at 1000.
3. **Moments array uses `@ts-expect-error` for TS2590** — Union too complex at 1500+ items. Unavoidable with static files at this scale.
4. **Content guide is single source of truth** — Validator checks AGAINST it, never modifies it.
5. **Sync script runs two passes** — FK ordering requires stories to exist before entities can reference them.
6. **Admin panel reads/writes Supabase directly** — No static file dependency for admin workflows.
7. **Vercel Edge Middleware for OG tags** — User-agent detection, direct Supabase REST fetch, crawlers get minimal HTML, real users get SPA.
8. **URL routing is state-driven** — Wouter `useLocation` syncs URL and React state, no Route wrapper on panel content.
9. **`getEntityLocations` includes story-less moments** — `story: Story | null` pattern for orphan moment coverage.
10. **`getEntityMomentStories` only pulls canonical moments** from biography storyType.
11. **Accuracy tiers:** pinpoint (~3m), exact (~10-50m), approximate (~100-500m), general-area (1km+).
12. **Geo verification columns:** `geo_verified`, `geo_source_url`, `geo_verified_at` in Supabase.
13. **`update_moment_location` RPC** for atomic coordinate updates.
14. **Deep links activate on DataProvider ready** — URL routing waits for data before resolving.

---

## Viral Launch Strategy (from /office-hours)

- Unit of virality = the collection, not the app
- First target: Serial Killer Crime Scenes -> r/TrueCrime
- Then: Nuclear Detonation Sites -> r/MapPorn, Famous Assassinations -> r/history + HN
- Failure criteria: if 6 posts across 4 weeks get <50 upvotes, pivot
- Consumer-first, platform-later
- Ken Dodelin outreach: when traction data exists, not before
- Full design doc at `~/.gstack/projects/`

---

## QA Report Summary (health score 72/100)

- 0 console errors (excellent)
- Critical: shareable URLs — FIXED
- High: search result click timeout, accessibility gaps
- Medium: map zoom lag at global scale, "Near Me" already handled, "0 stories" fixed
- Low: era filter already has active state, collection polylines verify manually

---

## Gstack Integration

- **/office-hours:** Viral collection launch strategy (design doc at `~/.gstack/projects/`)
- **/plan-eng-review:** Shareable URL architecture (3 decisions locked)
- **/qa:** Health score 72/100, 8 issues documented
- **/design-review:** Rapid Verify audit (design score C, actionable fixes applied)

---

## Data Sources + Ingestion Pipeline

- See `DATA-SOURCES.md` for full list (25+ sources)
- **BillionGraves:** Per-headstone GPS, #1 priority for burial verification
- **Cross-verified database** (2.29M people) for notability scoring
- **Pipeline:** external DB -> match -> score -> generate -> validate -> review -> production
- **oddstops.com** — rich source of verified crime/dark history locations with exact coordinates

---

## Known Issues

1. **Geocoding accuracy unreliable** (~28% error rate from LLM-generated coords) — batch geocode fixed 270, need manual verification for rest
2. **Map panning randomly** (Andrew's bug) — scroll-driven, attempted fix reverted
3. **Markers disappearing intermittently** — may be fixed by entity panel changes, monitoring
4. **574 orphan moments** not in any story
5. **Static map on scroll** — parked for rethinking
6. **Story/collection zoom-out UX** — parked
7. **5 moments with prehistoric year overflow** (int32 limit)
8. **Architecture won't scale past ~3-5K moments** in static .ts files
9. **Search result click** intermittently times out

---

## Content Roadmap

### Completed
- 10 world stories, 5 seed cities batch 1, 4 seed cities batch 2
- Notable people (Buddha, Archimedes, etc.), film locations, geographic gaps
- Science/culture, exploration/disasters, sports/culture, ancient world, modern history
- Dense tourist content: Paris, London, Rome, NYC, Tokyo, Kyoto, Mexico City, Buenos Aires, Istanbul
- 30 serial killer expansion moments
- 30 meteorite impact craters (batch 1)
- Billy the Kid expanded to 6 moments with pinpoint burial coords
- O. Henry 9 orphan moments wired in

### Next Priorities
1. Wire 15+ moments into Famous Books collection
2. Fix 8 duplicate moment IDs
3. Seed cities batch 3
4. Music birthplaces collection
5. Write descriptions for ~196 empty biography stories
6. Continue meteorite crater batches (144 remaining)

---

## Roadmap Highlights

- **Community verification** (iNaturalist model): 5 accuracy tiers, gamification, phased rollout
- **Proximity notifications** (PWA geofencing + push)
- **Admin panel phases 2-4** (editing, audit tools, roadmap dashboard)
- **Content:** comprehensive meteorite craters (144 remaining), more seed cities, Austin density
- **Architecture:** migrate to Supabase-only at ~3-5K moments

---

## Business / Strategy

- **It Happened Here prior art** — reach out to Ken Dodelin when traction exists
- **LLM pipeline is structural advantage** over all prior art
- Between hobby and business — monetize but not necessarily full startup
- Design doc covers monetization options (deferred until user validation)

---

## Architecture Reference

### Key Files

| File | Role |
|------|------|
| `middleware.ts` | Vercel Edge Middleware — OG tags for social crawlers |
| `src/components/RapidVerify.tsx` | Rapid Verify geo-verification tool |
| `src/components/ui/PinEditor.tsx` | Frontend pin editor modal |
| `src/main.tsx` | Top-level routes (`/admin`, `/verify`, `/c/:id`, `/s/:id`, `/e/:id`) |
| `src/App.tsx` | State, URL sync, deep link activation |
| `src/components/map/MapView.tsx` | Map, markers, polylines |
| `src/lib/entityHelpers.ts` | Entity functions (biography filter, orphan inclusion) |
| `src/lib/data/supabase-loader.ts` | Supabase -> app data mapping |
| `scripts/batch-geocode.ts` | Batch geocoding via Nominatim |
| `scripts/full-sync-to-supabase.ts` | Static -> Supabase sync |
| `scripts/ingest/lib/content-guide-v3.md` | Content creation standards (v3) |
| `.claude/commands/deep-maps-validator.md` | Validator skill (13 checks) |
| `public/og-default.png` | Generic OG preview image |
| `scripts/output/*.md` | Audit reports |
| `DATA-SOURCES.md` | Verification references + ingestion pipeline |
| `ROADMAP.md` | Feature/content roadmap |

---

## Session Startup Checklist

1. Read this `handoff.md`
2. Read `ROADMAP.md`
3. Read `DATA-SOURCES.md`
4. Read content guide: `scripts/ingest/lib/content-guide-v3.md`
5. Check `.gstack/` for QA reports and design docs
6. Dev server: `pushd deep-maps && npx vite --host --port 5178`
