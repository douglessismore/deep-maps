# Deep Maps — Session Handoff (2026-03-15, Session 43)

## Current State

**Build:** Clean (`npx tsc -b` + `npx vite build` — zero errors)
**Branch:** `main` at `3508c03`, pushed to remote
**Data:** 602 moments, 190 stories, 210 entities (141 person, 43 place, 15 concept, 11 org), 30 collections

The app is **ready for Supabase migration.** All pre-migration data architecture cleanup is complete.

---

## Changelog (Sessions 41-43)

| Commit | What |
|--------|------|
| `3508c03` | Fix expanded moment cards collapsing while reading (5s grace period after click) |
| `dcf0391` | GPS error text visible on mobile (was hidden in tooltip). Error clears after 8s. |
| `099c47f` | Smart sort: auto-Nearest on GPS. Sort toggle on Stories tab. GPS trigger on Nearest tap. |
| `a571eff` | **Big cleanup:** Category rename `last-stands`→`battles-conflicts`. Delete 5 duplicate stories. Create `londons-trials-fire-war` (10 moments). Fix 7 entity refs. Stuck viewport fix. All moments in panel. Collection scroll highlighting. |
| `bca886f` | Fix Nearest sort to use GPS (was viewport center) |
| `c178d0e` | `verificationLevel` on all 602 moments + sort toggle (Notable · Nearest · Oldest) |
| `455d6bf` | Content audit: notability scores, moment names, sacred tone, O. Henry consolidation |
| `e6d4bb1` | Code cleanup + content audit synthesis |
| `23ec99c` | Scroll-driven card activation with hysteresis |
| `df4b87a` | 3 bugs: scroll jitter, collection scroll highlight, collection pin filtering |
| `95ccf1e` | Moment expand jitter + scroll-to-map responsiveness |

---

## Immediate Next Step: Supabase Migration

### Schema (from comprehensive audit)

**Tables:** `moments` (PostGIS geography), `stories` (+`start_year`/`end_year`), `entities`, `collections`

**Join tables:**
- `story_moments(story_id, moment_id, sort_order, narrative_glue, is_primary)` — sort_order critical
- `collection_moments(collection_id, moment_id, sort_order)`
- `moment_entities(moment_id, entity_id)` — replaces `entityIds[]`
- `related_stories(story_id, related_story_id)` — keep asymmetric

**10 Postgres enums.** Moment `type` (31 values) → reference table, not enum.

**NOT NULL upgrades:** Moment `notability`, `year`, `verificationLevel`. Entity `years`, `description`.

**Empty schema (future):** `moment_media`, `moment_links`, `StoryMoment.isPrimary`

### Migration Decisions Made
1. Moment `type` → reference table (will keep growing). Consolidate 3 overlaps during import.
2. EntityIds gap (34% untagged) → close during migration script.
3. RelatedStoryIds → preserve asymmetry (editorial choice).
4. isPrimary → include with default false.

---

## Known Bugs

- [x] **Moment expansion collapses too quickly** — Fixed in `3508c03`. 5s grace period after manual click prevents scroll auto-selection from collapsing the card.
- [ ] **GPS blocked in Brave private browsing** — Brave's Privacy Shield silently blocks geolocation. Error now visible but underlying behavior is a browser limitation.

---

## Pending Items

### Content Work
- [ ] **Create ~20-30 place entities for world landmarks** — All 43 current are Americas-only. Gaps: Jerusalem (4+ moments), Tokyo (4), Paris (3), London (2+), Rome (2+). Best with Supabase spatial queries.
- [ ] **Convert "Literary Titans" to collection** — Story-shaped collection. Easier post-Supabase.
- [ ] **Tag remaining 204 moments with entityIds** — 34% untagged.

### UX
- [ ] **People sub-tab** — Skip for now, revisit post-Supabase.
- [ ] **Moment type consolidation** — 31 values, some overlapping. Clean during import.

### Architecture (Post-Supabase)
- [ ] Moments become independent (no parent story required)
- [ ] Runtime lookups → SQL joins (`momentToStoryMap`, entity aggregations)
- [ ] PostGIS spatial queries (`ST_DWithin`, `ST_Distance`)
- [ ] Timeline queries via `start_year`/`end_year` columns

---

## Key Decisions (and Why)

| Decision | Choice | Why |
|----------|--------|-----|
| Stories vs Collections | Stories = narrative arcs. Collections = thematic lists. | User pushed back on "stories" that were really collections. Only London had a real thread. |
| Category rename | `battles-conflicts` ("Battles & Conflicts") | Expert council unanimous: clean, neutral, encyclopedic |
| Auto-sort | GPS acquired → Nearest. Manual override wins. No auto-flip on pan. | Tufte: smart default, not a hand fighting for the wheel |
| Panel moments | Show ALL in viewport (no notability filter). Map still filters pins. | User wanted endless scroll discovery |
| Verification display | Badge only for non-verified (traditional/legendary/documented) | Verified is default — showing it = noise |
| 15 orphaned moments | Collection-only, no forced stories | Transitional until Supabase makes moments independent |
| relatedStoryIds | Asymmetric | "A recommends B" ≠ "B recommends A" — editorial choice |

## Expert Council
Jimmy Wales (encyclopedic clarity), Steve Jobs (design simplicity), Edward Tufte (data visualization).

## File Map

| File | Role |
|------|------|
| `src/types/index.ts` | All type definitions |
| `src/data/moments.ts` | 602 moments |
| `src/data/stories.ts` | 190 stories |
| `src/data/entities.ts` | 210 entities |
| `src/data/collections.ts` | 30 collections |
| `src/components/panel/ExplorePanel.tsx` | Main panel — tabs, sort, scroll, viewport |
| `src/components/panel/StoryPanel.tsx` | Story detail view |
| `src/components/panel/EntityPanel.tsx` | Entity detail view |
| `src/components/map/MapView.tsx` | Leaflet map, pins, notability filtering |
| `src/components/ui/Header.tsx` | Top bar, Near Me, search |
| `src/lib/geo.ts` | Spatial utils |
| `src/lib/notability.ts` | Notability threshold by zoom |
| `src/lib/entityHelpers.ts` | Entity aggregation |
| `src/lib/storyHelpers.ts` | Story → moment resolution |
| `src/lib/categories.ts` | Category display mapping |
