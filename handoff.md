# Deep Maps — Session Handoff

**Last updated:** 2026-03-23
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** deepmaps.app (Vercel + Supabase)

---

## Current State

- **App:** Deep Maps — geospatial storytelling app (React 19 + TypeScript + Vite + Tailwind 4 + Leaflet + Wouter)
- **Data:** 2,225 moments, 488 entities, 459 stories, 27 collections
- **Backend:** All synced to Supabase
- **Deployed:** Vercel at deepmaps.app
- **Dev server:** `npx vite --host --port 5178`
- **Admin panel:** Live at `/admin`
- **Shareable URLs:** Live — `/c/:id`, `/s/:id`, `/e/:id` with OG meta tags
- **Vercel Edge Middleware:** Serving OG tags to social crawlers

---

## This Session's Accomplishments

### Shareable URLs (the big one)
- Vercel Edge Middleware (`middleware.ts`) intercepts social crawlers via user-agent detection
- Direct Supabase REST API fetch for OG metadata (no SDK, ~50ms)
- Wouter routes: `/c/:id`, `/s/:id`, `/e/:id`
- URL-to-state bidirectional sync in `App.tsx`
- Generic `og-default.png` preview image
- OG tags verified on Twitter Card Validator and Facebook Sharing Debugger
- Fix: removed Route wrapper that was blocking deep link panel rendering

### Bug Fixes
- **Spartacus/era story leak:** `getEntityMomentStories` only pulls from biography storyType (75 entities affected)
- **Scroll bouncing:** `isUserScrolling` ref prevents external scroll-to during user scroll (both panels)
- **"0 stories" hidden** on person cards when count is 0

### Gstack Integration
- Installed and updated gstack (v0.3.10+)
- `/office-hours` completed — viral collection launch strategy designed
- `/plan-eng-review` completed — shareable URL architecture locked
- `/qa` completed — health score 72/100, 8 issues documented
- Design doc: `~/.gstack/projects/douglessismore-netaction-app/sirdouglas-main-design-20260323-114828.md`
- QA report: `.gstack/qa-reports/qa-report-deep-maps-vercel-app-2026-03-23.md`

### Content
- 342 moments merged from 8 content batches (science, culture, exploration, sports, tourist density, ancient world, modern history, geographic gaps)
- Collection wiring audit completed (`scripts/output/collection-wiring-audit.md`)

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
- Critical: shareable URLs — NOW FIXED
- High: search result click timeout, accessibility gaps
- Medium: map zoom lag at global scale, "Near Me" already handled, "0 stories" fixed
- Low: era filter already has active state, collection polylines verify manually

---

## Known Issues (Carried Forward)

1. **Static map on scroll** — reverted, parked for rethinking
2. **Story/collection zoom-out UX** — parked
3. **Armstrong/stuck-story bug** — unresolved
4. **323 orphan moments** not in any story
5. **25 biography wiring issues**
6. **Architecture won't scale past ~3-5K moments** in static .ts files
7. **Collection wiring gaps** (15+ moments need wiring per audit)
8. **8 duplicate moment IDs** need deduping
9. **Search result click** intermittently times out

---

## Content Roadmap

### Completed
- 10 world stories, 5 seed cities batch 1, 4 seed cities batch 2
- Notable people (Buddha, Archimedes, etc.), film locations, geographic gaps
- Science/culture, exploration/disasters, sports/culture, ancient world, modern history
- Dense tourist content: Paris, London, Rome, NYC, Tokyo, Kyoto, Mexico City, Buenos Aires, Istanbul

### Next Priorities
1. **POST TO REDDIT** — Serial Killer Crime Scenes collection
2. Add Plausible analytics
3. Wire 15+ moments into Famous Books collection
4. Fix 8 duplicate moment IDs
5. Seed cities batch 3
6. Music birthplaces collection
7. Write descriptions for ~196 empty biography stories

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
| `src/App.tsx` | State, URL sync, mode system |
| `src/components/map/MapView.tsx` | Map, markers, polylines |
| `src/lib/entityHelpers.ts` | Entity helper functions (biography filter) |
| `src/lib/data/supabase-loader.ts` | Supabase -> app data mapping |
| `scripts/full-sync-to-supabase.ts` | Static -> Supabase sync |
| `scripts/ingest/lib/content-guide-v3.md` | Content standards (v3) |
| `.claude/commands/deep-maps-validator.md` | Validator skill |
| `public/og-default.png` | Generic OG preview image |

---

## Session Startup Checklist

1. Read this `handoff.md`
2. Read `.claude/CLAUDE.md` (in networking-dashboard-fresh)
3. Check `MEMORY.md` for cross-project context
4. Check `.gstack/qa-reports/` for any pending issues
5. Check `~/.gstack/projects/` for design docs
6. Run dev server if needed: `pushd deep-maps && npx vite --host --port 5178`
