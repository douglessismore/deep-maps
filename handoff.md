# Deep Maps — Session Handoff

**Last updated:** 2026-03-22
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** deepmaps.app (Vercel + Supabase)

---

## Current State

- **App:** Deep Maps — geospatial storytelling app (React 19 + TypeScript + Vite + Tailwind 4 + Leaflet + Wouter)
- **Data:** 1,665 moments, 368 entities, 343 stories, 24 collections, 1,097 entity links
- **Backend:** All synced to Supabase (0 errors)
- **Dev server:** `cd deep-maps && npx vite --host --port 5178`
- **Tracker:** Live at `/tracker.html` with new Review tab (accept/reject workflow)

---

## This Session's Accomplishments

### Critical Fixes
1. **Runtime data loader pagination fix** — Root cause of Einstein + 453 moments being invisible. Supabase caps at 1000 rows server-side; `.limit(10000)` was silently truncated. Fixed with paginated `.range()` loop.
2. **56 false entity links removed** — Substring matching from Gemini batch enrichment: Great matched Constantine, Emperor matched Charles V, Smith matched Adam Smith. 6% false positive rate across 882 person-entity links.
3. **EntityPanel rendering fix** — Count showed but no cards rendered. Removed `primaryStory` guard that silently dropped story-less moments.
4. **Biography story UI leakage fixed** — Hidden from search, related stories, and nearby panels.
5. **Collection polylines bug fixed** — Mode-gating + same-story verification.
6. **Sync script fixes** — Added `canonical_story_id` to entity sync (was completely missing), pagination, description NOT NULL constraint (empty string instead of null).

### Content Added
- **212 new moments** across: 10 world stories, 5 seed cities (Rome 28, London 22, Paris 22, NYC 21, Istanbul 18), indigenous history (15), nonfiction stories (29)
- **379 orphan moments wired into stories** (Bucket A + B)

### Tooling
- **Validator skill created** (`/deep-maps-validator`) with dedup check
- **Content guide updated** — Physical presence rule, naming conventions, dedup checklist, biography-as-infrastructure
- **Tracker regenerated** with Review tab (accept/reject/feedback workflow)

---

## Key Architectural Decisions

1. **Biography stories are invisible infrastructure** — Users see person entities, not biography stories. Filtered from search, browse, related/nearby.
2. **Runtime loader uses paginated `.range()`** — NEVER `.limit()` for bulk fetches. Supabase silently truncates at 1000.
3. **Moments array uses `@ts-expect-error` for TS2590** — Union too complex at 1500+ items. Unavoidable with static files at this scale.
4. **Content guide is single source of truth** — Validator checks AGAINST it, never modifies it.
5. **Sync script runs two passes** — FK ordering requires stories to exist before entities can reference them.

---

## Validator Health Score

- **Last score:** 38/100 (before orphan fixes — likely improved significantly after wiring 379 orphans)
- **Remaining issues:** ~444 orphan moments (Bucket C: 44 non-person entity, Bucket D: 399 no entityIds)
- Need to re-run validator to get updated score

---

## Content Roadmap

### Completed
- 10 world stories (Titanic, Pompeii, Apollo 11, Chernobyl, Berlin Wall, 9/11, Tutankhamun, Trail of Tears, Great Pyramid, Rwanda)
- 5 seed cities (Rome, London, Paris, NYC, Istanbul)
- Indigenous history collection (Cahokia, Sitting Bull, Tecumseh, Navajo, Pachacuti, Maori, Aboriginal)
- 5 nonfiction stories (In Cold Blood, Everest 1996, Devil in the White City, Shackleton, Lost City of Z)

### Queued (drafts ready at scripts/output/)
- `missing-stories-audit.md` — 50 more stories identified
- `nonfiction-documentary-stories.md` — 34 nonfiction/doc entries in 3 tiers
- `people-pipeline-next-batch.md` — next 30 people to import
- `pin-accuracy-audit.md` — 869 moments that could be upgraded

### Next Priorities
1. Fix remaining 444 orphan moments (Bucket C + D)
2. More seed cities: Cairo, Beijing, Tokyo
3. Comprehensive airline crash sites collection
4. Music birthplaces collection (fills Africa, Caribbean, South America)
5. Film locations where real events happened
6. Import Gautama Buddha (rank 9, highest-priority missing person)
7. Write descriptions for ~196 empty biography stories

### Curation Ideas
- **Indigenous History:** Wounded Knee, Cahokia (done), Mesa Verde, Inca (done), Aboriginal (done), plus more
- **Nonfiction/Documentaries:** In Cold Blood (done), Into Thin Air (done), plus 29 more from audit
- **Comprehensive Crash Sites:** "Every Commercial Airline Crash Site on Earth"
- **Music Birthplaces:** Fela Kuti's Lagos, reggae Jamaica, Tropicalia Sao Paulo
- **Film Locations:** Schindler's factory, Hotel Rwanda, Bridge on the River Kwai

---

## Known Technical Issues

1. **tenochtitlan-fall moment** has Istanbul subtitle text (data bug)
2. **Aretha Franklin entity doesn't exist** — moment references non-existent entity ID
3. **Einstein duplicate moments** — `publishes-relativity` vs `annus-mirabilis` are same 1905 event at two Bern addresses
4. **content-guide-prompt.ts (v2)** still has editorial subtitle rules while v3 uses place annotations
5. **Architecture won't scale past ~3,000-5,000 moments** in static .ts files (TS compiler limits)

---

## Architecture Scaling Plan (for 10K+ moments)

1. Static files -> Supabase-only (write directly, dump for backup)
2. Viewport-based loading (PostGIS spatial queries instead of loading all moments)
3. Server-side search (Supabase full-text search)
4. Pre-computed clustering at zoom levels
- **Target:** implement when hitting ~3,000-5,000 moments

---

## Known UX Bugs (Carried Forward)

1. **Back button pollution** — clicking moments creates nav entries
2. **Moment click zoom inconsistency** — some moments don't zoom on click
3. **SRV single-moment jitter** — scroll-to-top jitter
4. **Polyline overshoot** — 16px offset
5. **Splash screen** — user hasn't reviewed variants B and C

---

## Pending Content Work (Carried Forward)

- Create entities for new collection moments (studios, paleontologists, inventors)
- Fix 3 Evolution moments — year overflow in Supabase (bigint migration needed)
- Willie Nelson non-Austin markers — confusing for "Willie Nelson's Austin"
- LBJ / Lady Bird story split — currently combined story
- Thinkers/Sages collection — only 4 moments, should be 20+
- Biblical descriptions may need future review (user wants more atomic)

---

## Pending Feature Work

- **Collection click UX** — plan at `.claude/plans/adaptive-noodling-deer.md`. When clicking a collection from zoomed-in view, don't zoom out; show in-view moments. "Show all on map" button for explicit zoom-out.
- **SEO landing pages** for collections
- **More collections:** Harry Potter, Breaking Bad, historic concerts
- **Admin panel** for non-developer content curation
- **Automated testing** — zero tests currently
- **Supabase bigint migration** for deep-time year values
- **Notability scoring transparency**

---

## Business/Strategy

### It Happened Here — Prior Art & Strategic Context
- Ken Dodelin created "It Happened Here" app (2013-2016), reached #1 in iTunes Travel category
- Named "Best iPhone Tour App" by Travel+Leisure
- Had 2,000+ events across 10 cities (NYC, LA, SF, DC, Chicago, London, Paris, Rome, Berlin, Barcelona)
- Pulled from app store due to content cost and software maintenance
- Sold for $2.99 — validates willingness to pay for this type of content
- Doug reached out in 2017 and 2019 — Ken was open but had investment partner constraints
- Ken is now at Georgetown business school, involved in AI projects
- **Action item**: Reach out to Ken again once Deep Maps has 3,000-5,000 moments and a polished demo
- **Lesson**: Content cost was the killer — LLM-assisted pipeline is Deep Maps' structural advantage
- **Monetization signal**: $2.99 price point with #1 ranking = proven demand. Deep Maps will be 1000x better.
- Add to gstack officehours prompt draft for business strategy discussion
- Ken's links: ithappenedhere.com, Georgetown profile, Crunchbase, CXO Talk AI episode

### App Store Monetization Potential
- IHH proved $2.99 price point works for travel/history apps at scale
- Deep Maps will have dramatically more content (targeting millions of moments vs 2,000)
- PWA can be wrapped for app stores (or go native later)
- Consider: freemium (free browse, paid offline/premium stories), one-time purchase, subscription
- Add to gstack officehours strategy discussion

---

## Architecture Reference

### Data Flow
```
Supabase (PostGIS) <- SINGLE SOURCE OF TRUTH
    | (runtime)
supabase-loader.ts -> provider.tsx -> App components
    | (backup)
dump-from-supabase.ts -> static .ts files (git)
    | (seed)
seed-supabase.ts -> fresh Supabase instance
```

- App reads from Supabase at runtime (NOT from static .ts files)
- Static files are seed data for the sync script
- The sync script pushes static -> Supabase
- `dump-from-supabase.ts` pulls Supabase -> static (for backup/versioning)
- All three data paths (loader, sync, audit) now use paginated `fetchAll`

### Key Files

| File | Role |
|------|------|
| `src/App.tsx` | State, routing, mode system |
| `src/components/map/MapView.tsx` | Map, markers, polylines, tooltips |
| `src/components/panel/ExplorePanel.tsx` | Explore panel, collections, scroll |
| `src/components/panel/StoryPanel.tsx` | Story detail view |
| `src/components/panel/EntityPanel.tsx` | Entity detail view |
| `src/components/panel/LocationCard.tsx` | Moment card (supports story-less moments) |
| `src/components/ui/SearchOverlay.tsx` | Real-time search |
| `src/lib/data/provider.tsx` | Data loading (Supabase primary, static fallback) |
| `src/lib/data/supabase-loader.ts` | Supabase -> app data mapping |
| `src/lib/entityHelpers.ts` | Entity helper functions |
| `src/lib/geo.ts` | Viewport bounds (includes story-less moments) |
| `src/lib/sheetAwareMap.ts` | Mobile sheet padding calculations |
| `scripts/full-sync-to-supabase.ts` | Static -> Supabase sync (doesn't sync coordinates) |
| `scripts/dump-from-supabase.ts` | Supabase -> static backup (paginated) |
| `scripts/audit-wiring.ts` | Data integrity audit script |
| `scripts/generate-tracker.ts` | Tracker HTML generator |
| `scripts/ingest/lib/content-guide-v3.md` | Content standards (v3) |
| `scripts/output/missing-stories-audit.md` | Full missing stories audit |
| `scripts/output/nonfiction-documentary-stories.md` | Nonfiction/documentary audit |
| `scripts/output/people-pipeline-next-batch.md` | People pipeline batch |
| `scripts/output/pin-accuracy-audit.md` | Pin accuracy audit |
| `scripts/output/entity-link-audit.md` | Entity link audit |
| `.claude/commands/deep-maps-validator.md` | Validator skill |
| `CONTENT-SCALING-PLAN.md` | Full scaling roadmap |

### Guardrails
- Pre-push hook: `tsc -b` runs before every push
- Supabase fallback: static files load if Supabase fails
- `full-sync-to-supabase.ts` skips coordinate updates (text fields only)
- `dump-from-supabase.ts` paginates beyond 1000 rows

---

## Session Startup Checklist

1. Read this `handoff.md`
2. Read `.claude/CLAUDE.md` (in networking-dashboard-fresh)
3. Check `MEMORY.md` for cross-project context
4. Run the dev server if needed: `pushd deep-maps && npx vite --host --port 5178`
5. Check tracker at `/tracker.html` for any rejected items to address
6. CWD locked to `networking-dashboard-fresh` — use full paths for deep-maps
7. User accesses production at **deepmaps.app** (Vercel + Supabase)
8. **Always verify Vercel deployment after push** (`gh api .../deployments`)
9. **Always use `tsc -b` not `tsc --noEmit`** — Vercel uses `-b`
10. **Always dump from Supabase before editing static files** — static may be stale
