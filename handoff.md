# Deep Maps — Session Handoff

**Last updated:** 2026-03-23
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** deepmaps.app (Vercel + Supabase)

---

## Current State

- **App:** Deep Maps — geospatial storytelling app (React 19 + TypeScript + Vite + Tailwind 4 + Leaflet + Wouter)
- **Data:** 2,283 moments, 487 entities, 458 stories, 27 collections
- **Backend:** All synced to Supabase
- **Deployed:** Vercel at deepmaps.app
- **Dev server:** `npx vite --host --port 5178`
- **Admin panel:** Live at `/admin`
- **Shareable URLs:** Live — `/c/:id`, `/s/:id`, `/e/:id` with OG meta tags
- **Vercel Edge Middleware:** Serving OG tags to social crawlers
- **OG tags verified** on Twitter Card Validator and Facebook Sharing Debugger

---

## This Session's Accomplishments

### Shareable URLs
- Vercel Edge Middleware (`middleware.ts`) intercepts social crawlers via user-agent detection
- Direct Supabase REST API fetch for OG metadata (no SDK, ~50ms)
- Wouter routes: `/c/:id`, `/s/:id`, `/e/:id`
- URL-to-state bidirectional sync in `App.tsx`
- Generic `og-default.png` preview image
- OG tags verified on Twitter Card Validator and Facebook Sharing Debugger
- Fix: removed Route wrapper that was blocking deep link panel rendering

### Gstack Sprint
- `/office-hours`: viral collection launch strategy — post collections to Reddit/HN
- `/plan-eng-review`: shareable URL architecture locked (3 decisions: user-agent detection, useLocation sync, direct REST fetch)
- `/qa`: health score 72/100, 8 issues documented
- Design doc: `~/.gstack/projects/douglessismore-netaction-app/sirdouglas-main-design-20260323-114828.md`
- QA report: `.gstack/qa-reports/qa-report-deep-maps-vercel-app-2026-03-23.md`

### Content Added
- 30 serial killer expansion moments (Night Stalker, BTK, Green River, Wuornos, Manson, etc.)
- 30 meteorite impact craters (batch 1 of ~194 confirmed structures)
- 342 moments from 8 overnight content batches (science, culture, exploration, sports, tourist density, ancient world, modern history, geographic gaps)

### Audits Completed
- Serial killer geocoding: 15 fixes (7 critical, 8 warning)
- All-collections geocoding: 6 critical + 11 warning across 89 moments sampled
- Collection content audit: 39 issues (broken refs, misplaced moments, duplicate collections)
- Reports at `scripts/output/serial-killer-geocoding-audit.md`, `all-collections-geocoding-audit.md`, `collection-full-audit.md`

### Bug Fixes
- **Entity markers disappearing:** `getEntityLocations` now includes story-less orphan moments
- **Spartacus/era story leak:** `getEntityMomentStories` only pulls from biography storyType (75 entities affected)
- **Scroll bouncing:** `isUserScrolling` ref prevents external scroll-to during user scroll (both panels)
- **"0 stories" hidden** on person cards when count is 0
- **Munich massacre** removed from sports collection
- **Merged duplicate sports collections** (iconic + greatest into one)
- **Merged duplicate inventions collections**
- **Wright Brothers** duplicate moments removed
- **Orville Wright** false entity link (Rosewood/John Wright) removed
- **Clyde Barrow** duplicate grave story removed
- **Devil in the White City** renamed
- **Entity scroll panning** re-enabled for mobile
- **Serial killer collection** scoped to crime scenes only (removed arrests, prisons, executions, workplaces)

### Validator Updated (5 new checks)
- 1.9: Collection content appropriateness
- 1.10: Duplicate collection detection
- 1.11: False entity link detection (substring matching)
- 1.12: Duplicate moment detection within stories/entities
- 1.13: Sensitivity and tone check

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

## Immediate Next Session Priorities

1. **Build geo review queue in ingestion tracker** — map view, draggable pins, source URLs, verified/unverified status. This is the blocker for going public.
2. **Manual geo spot-check of all 38 serial killer crime scene pins** — use the geo queue to verify each pin on Google Maps before posting to Reddit
3. **Add semantic appropriateness check to validator** — auto-flag non-crime-scenes in crime scene collection, etc.
4. **Add collection header/description in UI** — currently barely visible what collection you're in
5. **Post serial killer collection to Reddit** — ONLY after geo verification complete
6. **Add Plausible analytics** — one script tag
7. **Continue meteorite crater batches** — 144 more craters to reach comprehensive ~194

---

## Content Ideas Noted

- oddstops.com — rich source of verified crime/dark history locations with exact coordinates
- Comprehensive serial killer list from Wikipedia (List_of_serial_killers_by_number_of_victims)

---

## Known Issues

1. **Geocoding accuracy unreliable** (~28% error rate from LLM-generated coords) — MUST verify via geocoding API or manual review before any collection goes public
2. **Static map on scroll** — reverted, parked for rethinking
3. **Story/collection zoom-out UX** — parked
4. **Armstrong/stuck-story bug** — unresolved
5. **583 orphan moments** not in any story
6. **Architecture won't scale past ~3-5K moments** in static .ts files
7. **5 moments with year overflow** (int32 limit for prehistoric dates)
8. **Supabase has 5 orphan records** not in static files (need cleanup)
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

### Next Priorities
1. Wire 15+ moments into Famous Books collection
2. Fix 8 duplicate moment IDs
3. Seed cities batch 3
4. Music birthplaces collection
5. Write descriptions for ~196 empty biography stories
6. Continue meteorite crater batches (144 remaining)

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
| `src/main.tsx` | Top-level routes (`/admin`, `/c/:id`, `/s/:id`, `/e/:id`) |
| `src/App.tsx` | State, URL sync, deep link activation |
| `src/components/map/MapView.tsx` | Map, markers, polylines |
| `src/lib/entityHelpers.ts` | Entity functions (biography filter, orphan inclusion) |
| `src/lib/data/supabase-loader.ts` | Supabase -> app data mapping |
| `scripts/full-sync-to-supabase.ts` | Static -> Supabase sync |
| `scripts/ingest/lib/content-guide-v3.md` | Content standards (v3) |
| `.claude/commands/deep-maps-validator.md` | Validator skill (13 checks) |
| `public/og-default.png` | Generic OG preview image |
| `scripts/output/*.md` | Audit reports |

---

## Session Startup Checklist

1. Read this `handoff.md`
2. Read `.claude/CLAUDE.md` (in networking-dashboard-fresh)
3. Check `MEMORY.md` for cross-project context
4. Check `.gstack/qa-reports/` for any pending issues
5. Check `~/.gstack/projects/` for design docs
6. Run dev server if needed: `pushd deep-maps && npx vite --host --port 5178`
