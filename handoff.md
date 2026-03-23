# Deep Maps — Session Handoff

**Last updated:** 2026-03-23
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** deepmaps.app (Vercel + Supabase)

---

## Current State

- **App:** Deep Maps — geospatial storytelling app (React 19 + TypeScript + Vite + Tailwind 4 + Leaflet + Wouter)
- **Data:** 1,878 moments, 414 entities, 387 stories, 26 collections, 1,208 entity links
- **Backend:** All synced to Supabase (0 errors)
- **Dev server:** `cd deep-maps && npx vite --host --port 5178`
- **Admin panel:** Live at `/admin` with Overview, Content Queue, and Roadmap pages
- **Content agents:** 2 overnight agents may have completed drafts in `scripts/output/` (Scandinavia/Nordic, Central Asia, Oceania, Caribbean + Science/Culture/Music/Literature)

---

## This Session's Accomplishments

### Admin Panel (shipped)
1. **Full /admin route** with Overview, Content Queue, Roadmap pages
2. **Phase 1:** Content queue with 2,400+ items, paginated table, type/status filters
3. **Phase 2:** Inline editing, notes panel, star ratings (0-100), bulk approve/flag
4. **Phase 3:** MiniMap with pin display, LinkAudit showing entity chips
5. **Phase 4:** Roadmap kanban board with 61 items imported from ROADMAP.md
6. **Supabase migration 006:** admin_ratings, admin_notes, roadmap_items tables + review_status columns
7. **vercel.json SPA rewrite** for /admin routes

### Content Added (218 new moments)
- **Crash sites:** 27 (Tenerife, JAL 123, Lockerbie, MH370, Miracle on Hudson, etc.)
- **Seed cities:** 84 (Cairo 22, Beijing 22, Tokyo 20, Athens 20)
- **Notable people:** 42 (Buddha, Archimedes, Qin Shi Huang, Dante, Marco Polo, al-Khwarizmi, Ibn Khaldun, Murasaki Shikibu, Sima Qian, Zheng He)
- **Film locations:** 28 (Harry Potter 11, Breaking Bad 8, real-event films 9)
- **Geographic gaps:** 49 (Canada 10, Pacific NW 10, Latin America 10, Sub-Saharan Africa 10, Southeast Asia 9)

### Bug Fixes
1. **Biography story leak** — PERMANENT fix at data layer (getEntityStories + getEntityMomentStories filter canonical stories)
2. **Antimeridian bug** — markers now show when scrolling west to Asia (worldCopyJump + wrapped bounds)
3. **Moon landing pins** — moved from lunar coordinates (rendered in Africa) to Mission Control Houston
4. **Brooklyn Bridge/Empire State/Broken Spoke** — converted to place entities (storyType biography)
5. **Back button** — more prominent (13px semibold, persistent background)
6. **Variant toggle removed** — split mode is final UI
7. **Darwin scroll bounce** — fixed scrollIntoView loop on 2-moment entities
8. **Place entities** no longer leak into Stories tab (removed person-only filter)
9. **Einstein duplicate moments** merged
10. **Tenochtitlan subtitle** fixed (had Istanbul text)
11. **content-guide-prompt.ts v2** deprecated

### Tooling
- **Pre-commit validator** with coordinate sanity check (Earth-only rule)
- **Content guide updated:** Earth-only coordinates, physical presence refinements
- **Roadmap imported to Supabase** (61 items in admin panel kanban)
- **Static map on scroll** attempted 4x, reverted — parked for rethinking

---

## Key Architectural Decisions

1. **Biography stories are invisible infrastructure** — Users see person entities, not biography stories. Filtered from search, browse, related/nearby.
2. **Runtime loader uses paginated `.range()`** — NEVER `.limit()` for bulk fetches. Supabase silently truncates at 1000.
3. **Moments array uses `@ts-expect-error` for TS2590** — Union too complex at 1500+ items. Unavoidable with static files at this scale.
4. **Content guide is single source of truth** — Validator checks AGAINST it, never modifies it.
5. **Sync script runs two passes** — FK ordering requires stories to exist before entities can reference them.
6. **Admin panel reads/writes Supabase directly** — No static file dependency for admin workflows.

---

## Known Issues (Carried Forward)

1. **Scroll bounce on stories with 2-3 moments** — StoryPanel needs same fix as EntityPanel
2. **Static map on scroll** — reverted after 4 attempts, needs holistic approach
3. **Story/collection zoom-out** — clicking from zoomed-in view should maintain zoom; parked
4. **Armstrong/stuck-story bug** — back button may not properly reset to explore mode
5. **Deployment caching** — changes sometimes don't reflect immediately on mobile
6. **323 orphan moments** still not in any story
7. **25 biography wiring issues**
8. **18 temporal warnings** (all reviewed and legitimate)
9. **Fix 3 Evolution moments** — year overflow in Supabase (bigint migration needed)
10. **Architecture won't scale past ~3,000-5,000 moments** in static .ts files (TS compiler limits)

---

## Content Roadmap

### Completed This Session
- [x] Crash sites collection (27 moments)
- [x] Seed cities batch 2: Cairo, Beijing, Tokyo, Athens (84 moments)
- [x] Notable people: Buddha, Archimedes, Qin Shi Huang, Dante, Marco Polo, al-Khwarizmi, Ibn Khaldun, Murasaki Shikibu, Sima Qian, Zheng He (42 moments)
- [x] Film locations: Harry Potter, Breaking Bad, real-event films (28 moments)
- [x] Geographic gap-filling: Canada, Pacific NW, Latin America, Sub-Saharan Africa, Southeast Asia (49 moments)

### Queued (drafts in scripts/output/)
- Possible overnight agent drafts: `diverse-stories-draft.ts`, `science-culture-draft.ts`
- `missing-stories-audit.md` — 50 more stories identified
- `nonfiction-documentary-stories.md` — 34 nonfiction/doc entries in 3 tiers
- `people-pipeline-next-batch.md` — next 30 people to import
- `pin-accuracy-audit.md` — 869 moments that could be upgraded

### Next Priorities
1. Merge overnight content agent drafts (check `scripts/output/`)
2. Seed cities batch 3: Mexico City, Delhi, Sydney, Nairobi, Rio
3. Fix 323 orphan moments
4. Write descriptions for ~196 empty biography stories
5. Music birthplaces collection (fills Africa, Caribbean, South America)
6. Ancient trade routes collection
7. Olympic host cities collection

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
| `src/pages/AdminPage.tsx` | Admin panel entry point |
| `scripts/full-sync-to-supabase.ts` | Static -> Supabase sync (doesn't sync coordinates) |
| `scripts/dump-from-supabase.ts` | Supabase -> static backup (paginated) |
| `scripts/audit-wiring.ts` | Data integrity audit script |
| `scripts/validate-data.ts` | Pre-commit validator |
| `scripts/ingest/lib/content-guide-v3.md` | Content standards (v3) |
| `supabase/migrations/006_admin_panel.sql` | Admin panel tables (ratings, notes, roadmap) |
| `.claude/commands/deep-maps-validator.md` | Validator skill |
| `CONTENT-SCALING-PLAN.md` | Full scaling roadmap |

### Guardrails
- Pre-push hook: `tsc -b` runs before every push
- Pre-commit validator: coordinate sanity check (Earth-only rule)
- Supabase fallback: static files load if Supabase fails
- `full-sync-to-supabase.ts` skips coordinate updates (text fields only)
- `dump-from-supabase.ts` paginates beyond 1000 rows

---

## Business / Strategy

### It Happened Here — Prior Art
- Ken Dodelin's app reached #1 iTunes Travel, "Best iPhone Tour App" by Travel+Leisure
- 2,000+ events across 10 cities, $2.99 — pulled due to content cost
- **LLM pipeline is Deep Maps' structural advantage**
- Ken now at Georgetown, involved in AI projects
- **Action**: Reach out when Deep Maps hits 3,000-5,000 polished moments

### Monetization
- IHH proved $2.99 works at #1 ranking scale
- Consider: freemium, one-time purchase, subscription
- PWA can be wrapped for app stores

---

## Session Startup Checklist

1. Read this `handoff.md`
2. Read `.claude/CLAUDE.md` (in networking-dashboard-fresh)
3. Check `MEMORY.md` for cross-project context
4. Check for completed content agent drafts in `scripts/output/` (diverse-stories-draft.ts, science-culture-draft.ts)
5. If drafts exist, merge them
6. Run validator: `npx tsx scripts/validate-data.ts`
7. Run Supabase sync: `export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/full-sync-to-supabase.ts`
8. Check admin panel at `/admin` for any user-rejected items
9. Dev server: `cd deep-maps && npx vite --host --port 5178`
10. CWD locked to `networking-dashboard-fresh` — use full paths for deep-maps
11. User accesses production at **deepmaps.app** (Vercel + Supabase)
12. **Always verify Vercel deployment after push** (`gh api .../deployments`)
13. **Always use `tsc -b` not `tsc --noEmit`** — Vercel uses `-b`
14. **Always dump from Supabase before editing static files** — static may be stale
