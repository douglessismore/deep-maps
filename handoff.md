# Deep Maps — Session Handoff

**Last updated:** 2026-03-22 (Session 62 — cleanup + zoom fix + biblical audit)
**Branch:** `main`

---

## What Shipped This Session

### Data Cleanup (6 commits)
1. ✅ **Deleted 25 stories** — nuclear test sites (12), city clusters (7), sacred sites (2), meteorite (2), confederate-mesilla, chicxulub
2. ✅ **Deleted 29 collections** — city histories (4), sub-battlefields (5), sub-meteorites (3), religious overlap (4), generic themes (11), music-venues, revolutionary-leaders
3. ✅ **Renamed 5 collections** — nuclear, civil-rights, meteorite, philosophers, inventions to Wikipedia-style names
4. ✅ **Converted london-crown-scaffold** → london-royal-history collection
5. ✅ **Content guide v3 updated** — 6 new rules: structural rules (single-moment stories, city aggregations, overlap checking, theme specificity), official naming rule, presence-moment guidance, physical-presence entity tagging
6. ✅ **Renamed Galveston** — "Free State of Galveston" (matches Wikipedia article title)

### Subtitle Rewrites
7. ✅ **49 Austin moment subtitles** rewritten from editorial hooks to place annotations
8. ✅ **7 cemetery subtitles** fixed
9. ✅ Non-Austin spot-check: 14/15 pass (1 edge case: Justinian's Monastery)

### Biblical Content Audit
10. ✅ **57 biblical moment descriptions** rewritten — place-anchored, atomic, encyclopedic
11. ✅ **Removed holy-family-egypt** from jesus-ministry (pre-ministry, geographic outlier)

### Bug Fixes
12. ✅ **Mobile story zoom fix** — `alreadyVisible` check now requires `zoomDiff < 2` (was skipping fitBounds from global view because "everything is visible" at zoom 2)
13. ✅ **Story-less moments now discoverable** — `getLocationsInBounds` includes moments not in any story (cemetery burials, etc.). Places tab went from 8 → 23 entities.
14. ✅ **Cemetery coordinates spread** across actual grounds (8 moments differentiated)

### Infrastructure
15. ✅ **Supabase dump pagination** — fixed 1000-row cap in dump-from-supabase.ts
16. ✅ **Static files synced** — dumped 1453 moments, 304 entities from Supabase (was stale at 795 moments)

---

## 🔴 IMMEDIATE NEXT SESSION

### Content Pipeline (from CONTENT-SCALING-PLAN.md)
- People pipeline: offset 28→58 (next 30 notable people). Check for existing entities before creating.
- Pin accuracy audit: scan all 1453 moments, flag which can be upgraded to hyper-specific coordinates

### Collection Click UX (Plan ready, not implemented)
- When clicking a collection from zoomed-in view, DON'T zoom out. Show in-view moments.
- "Show all on map" button for explicit zoom-out.
- Plan at `.claude/plans/adaptive-noodling-deer.md`

### Content Notes (saved to memory)
- Biblical descriptions were audited but may need future review (user wants more atomic)
- "Hyper-specific pin" accuracy level above 'exact' — parked for later (memory: `project_pin_precision.md`)
- Physical presence rule for entity tags — saved to content guide
- Moments don't need story wrappers — saved to content guide

---

## 🟡 Other Pending Items

### Bugs
1. ⬜ **Back button pollution** — clicking moments creates nav entries
2. ⬜ **Moment click zoom inconsistency** — some moments don't zoom on click
3. ⬜ **SRV single-moment jitter** — scroll-to-top jitter

### Content
4. ⬜ **Create entities** for new collection moments (studios, paleontologists, inventors)
5. ⬜ **Fix 3 Evolution moments** — year overflow in Supabase (bigint migration)
6. ⬜ **Willie Nelson non-Austin markers** — confusing for "Willie Nelson's Austin"
7. ⬜ **LBJ / Lady Bird story split** — currently combined story
8. ⬜ **Thinkers/Sages collection** — only 4 moments, should be 20+

### UX
9. ⬜ **Polyline overshoot** — 16px offset
10. ⬜ **Splash screen** — user hasn't reviewed variants B and C
11. ⬜ **Notability scoring transparency**

### Future / Roadmap
12. ⬜ **SEO landing pages** for collections
13. ⬜ **More collections**: Harry Potter, Breaking Bad, historic concerts
14. ⬜ **Admin panel** for non-developer content curation
15. ⬜ **Automated testing** — zero tests
16. ⬜ **Supabase bigint migration** for deep-time year values

---

## Architecture Reference

### Data Flow (Post-Migration)
```
Supabase (PostGIS) ← SINGLE SOURCE OF TRUTH
    ↓ (runtime)
supabase-loader.ts → provider.tsx → App components
    ↓ (backup)
dump-from-supabase.ts → static .ts files (git)
    ↓ (seed)
seed-supabase.ts → fresh Supabase instance
```

### Key Files
| File | Role |
|------|------|
| `src/App.tsx` | State, routing, mode system |
| `src/components/map/MapView.tsx` | Map, markers, polylines, tooltips |
| `src/components/panel/ExplorePanel.tsx` | Explore panel, collections, scroll |
| `src/components/panel/StoryPanel.tsx` | Story detail view |
| `src/components/panel/EntityPanel.tsx` | Entity detail view |
| `src/components/panel/LocationCard.tsx` | Moment card (now supports story-less moments) |
| `src/components/ui/SearchOverlay.tsx` | Real-time search |
| `src/lib/data/provider.tsx` | Data loading (Supabase primary, static fallback) |
| `src/lib/data/supabase-loader.ts` | Supabase → app data mapping |
| `src/lib/geo.ts` | Viewport bounds (now includes story-less moments) |
| `src/lib/sheetAwareMap.ts` | Mobile sheet padding calculations |
| `scripts/full-sync-to-supabase.ts` | Static → Supabase sync (note: doesn't sync coordinates) |
| `scripts/dump-from-supabase.ts` | Supabase → static backup (now paginated) |
| `scripts/ingest/lib/content-guide-v3.md` | Content standards |
| `CONTENT-SCALING-PLAN.md` | Full scaling roadmap |

### Guardrails
- Pre-push hook: `tsc -b` runs before every push
- Supabase fallback: static files load if Supabase fails
- `full-sync-to-supabase.ts` skips coordinate updates (text fields only)
- `dump-from-supabase.ts` now paginates beyond 1000 rows

### Session Startup
1. Read `handoff.md` and `CLAUDE.md`
2. CWD locked to `networking-dashboard-fresh` — use full paths for deep-maps
3. User accesses production at **deepmaps.app** (Vercel + Supabase)
4. **Always verify Vercel deployment after push** (`gh api .../deployments`)
5. **Always use `tsc -b` not `tsc --noEmit`** — Vercel uses `-b`
6. **Always dump from Supabase before editing static files** — static may be stale
