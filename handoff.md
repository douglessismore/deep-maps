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

## Immediate Next Session Priorities

1. **Fix remaining UX bugs:** map panning randomly (Andrew), markers disappearing
2. **Verify serial killer collection geo-accuracy** (all pins) before Reddit post
3. **Build entity/story/collection browse mode** in Rapid Verify
4. **Run /design-review on main app** (not just /verify)
5. **Trump content rewrite**
6. **Post first collection to Reddit** (after geo-verification)
7. **Add Plausible analytics**
8. **Build BillionGraves integration** for burial moment coordinates

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
