# Deep Maps — Session Handoff

**Last updated:** 2026-03-21 (Session 61 — Data consolidation, EntityPanel, 11 collections, splash screen)
**Branch:** `main`

---

## What Shipped (Session 61)

### Data Consolidation
1. **Deleted 46 duplicate stories** from static + Supabase — biography/place stories that mirrored entities
2. **Fixed 5 orphaned moments** with missing entityIds
3. **Cleaned 47 canonicalStoryId refs** + 34 relatedStoryIds
4. **Full wiring audit** — zero broken references

### EntityPanel Unification
5. **Restructured EntityPanel** — scrollable header, dive deeper strip, sticky tabs (Moments/Wikipedia)
6. **Created EntityWikiPanel** — slim wiki panel for entities
7. **Removed duplicate "Moments (N)" heading** from StoryPanel

### UX Fixes
8. **Jitter fix** — tolerance-based bounds comparison
9. **Dynamic era pill counts** — reflect map-visible stories, hide empty eras
10. **Place click zoom** — single-moment entities zoom to level 14+
11. **Collection back button** — sticky header with moment count
12. **Collection moments rendering** — stub story fallback for orphan moments
13. **Splash screen** — SplashScreenA (pin drop + ripple) wired as loading screen

### Collections
14. **Deleted 10 weak collections** from static + Supabase
15. **Added 11 new collections** (170 moments) — synced to Supabase:
    - Game of Thrones Filming Locations (17)
    - Greatest Sports Moments (18)
    - Where Famous Books Were Written (19)
    - Famous Prisons and Notable Inmates (14)
    - Major Fossil Discovery Sites (15)
    - Famous Heists and Robberies (15)
    - Oldest Human Settlements (15)
    - Where Famous Albums Were Recorded (17)
    - Historic Events Along Route 66 (19)
    - Where Important Inventions Were Born (21)
    - Evolution of Life on Earth (24 — 21 linked in Supabase, 3 overflow integer year)

### Content
16. **41 entity descriptions rewritten** — encyclopedic tone, person-focused (synced to Supabase)
17. **3 splash screen variants** created (A wired, B and C available)

---

## 🔴 CRITICAL BUG — Polylines Still Showing for Old Collections

**Status:** THREE attempts to fix. Code looks correct but user still sees polylines on deepmaps.app for old collections (assassinations, nuclear, serial killers, etc.) but NOT new ones (books, heists, sports).

**What was tried:**
1. Clear `scrollHighlight` on collection entry + `!activeCollection` guard on polyline paths
2. Early return in polyline useEffect when `activeCollection` is set
3. Dual gate: `activeCollection || mode not in story/entity/scroll` → early return

**Code is correct** — the early return fires, cleanup removes existing polylines, and `activeCollection` is properly passed to both MapView instances. Build succeeds. Deploy succeeds.

**Theories:**
- Browser cache? User tried private tab in Brave. Still showed.
- Different code path? All polyline creation goes through the one useEffect. No other `L.polyline` calls exist outside it.
- EmergenceLayer drawing lines? Only draws circles, not polylines.
- Supabase data difference? Old collections have story-linked moments, new ones don't. But the code gates on `activeCollection`, not on story linkage.

**Next step:** User restarting computer. If still persists, add `console.log('POLYLINE BLOCKED BY COLLECTION')` to the early return and have user check browser console to verify the code is actually running.

---

## 🟡 Pending Items

### Priority 1 — Bugs
1. ⬜ **Polylines for collections** — see critical bug above
2. ⬜ **Collection marker dimming** — should show all markers, dim non-active (like stories/entities)
3. ⬜ **Collection back button position** — sticky but shows text peeking above it

### Priority 2 — Content
4. ⬜ **Convert Evolution of Life from collection to story** — linear narrative, not a list. Fossil Discoveries stays as collection. Add dive deeper links between them.
5. ⬜ **Fix 3 Evolution moments** — year values (-3.48B, -3.43B, -2.4B) overflow PostgreSQL integer. Need bigint column or capped values.
6. ⬜ **Create entities** for new collection moments (studios, paleontologists, inventors, prisons, etc.)
7. ⬜ **Austin moment rewrites** from voice note (Session 60 feedback)
8. ⬜ **Rename existing collections for SEO** (e.g., nuclear → "Every Place a Nuclear Weapon Has Been Detonated")

### Priority 3 — UX
9. ⬜ **Search UX on mobile** — keyboard covers results, no auto-suggestions
10. ⬜ **Polyline overshoot** — 16px offset between polyline coords and marker centers
11. ⬜ **Splash screen choice** — user hasn't reviewed variants B and C yet

### Priority 4 — Future
12. ⬜ More collections (terrorist attacks, Harry Potter, Breaking Bad, historic concerts)
13. ⬜ SEO landing pages for collections
14. ⬜ Supabase full re-sync (static has 795 moments, Supabase has 1000+ from earlier pipeline)

---

## Supabase Sync Notes

**Current state:** Static and Supabase are partially synced. Key differences:
- Static: 795 moments, 145 stories, 210 entities, 31 collections
- Supabase: ~1000 moments (includes pipeline-generated ones), 247 stories, 210 entities, 31 collections
- Entity descriptions: synced ✓
- New collection moments: synced (115 inserted, some failed as duplicates)
- Collection links: synced (all 31 collections have moment links)
- 46 deleted stories: removed from Supabase ✓
- 10 deleted collections: removed from Supabase ✓

**To sync:** Use service role key. See `.env` for credentials. Pattern:
```bash
cd deep-maps && export SUPABASE_SERVICE_ROLE_KEY="..." && npx tsx -e "..."
```

**Schema gotchas:**
- `moments.location` is PostGIS POINT, not separate lat/lng: `POINT(lng lat)`
- `moments.type_id` references `moment_types` table (not inline string)
- `moments.notability` is NOT NULL — must provide default (50)
- `moments.year` is integer — overflows at ±2.1 billion (affects deep-time moments)
- `moments.verification_level` not `verificationLevel` (snake_case)

---

## Vercel Deployment Notes

**CRITICAL:** Always verify deployment after push:
1. `gh api repos/douglessismore/deep-maps/deployments --jq '.[0].id'`
2. Check status: `gh api .../deployments/{ID}/statuses --jq '.[0].state'`
3. If "failure": `npx vercel inspect dpl_XXX --logs | tail -20`
4. Common failures: `tsc -b` is stricter than `tsc --noEmit` (checks project references)

**Past failures this session:**
- TS2352: Story stub missing required fields (years, storyType, tags)
- TS2352: StoryCategory type mismatch ('dark_history' vs 'dark-history')
- Broken string literals from `$` signs split across lines by agents

---

## Session Startup Checklist

1. Read `handoff.md` and `CLAUDE.md`
2. Read memory at `~/.claude/projects/.../memory/MEMORY.md`
3. CWD locked to `networking-dashboard-fresh` — use full paths for deep-maps
4. Start dev server: `cd /Users/sirdouglas/Documents/claude-code-projects/deep-maps && npx vite --host --port 5178`
5. User accesses production at **deepmaps.app** (Vercel, Supabase data)
6. `?data=static` for local static files
7. **Always check Vercel deployment status after pushing**

## Architecture Reference

| File | Role |
|------|------|
| `src/App.tsx` | Layout, routing, mode system, zoomToActiveLocation |
| `src/components/map/MapView.tsx` | Map + zoom + markers + polylines + tooltips |
| `src/components/map/EmergenceLayer.tsx` | Canvas markers (explore mode) |
| `src/components/panel/StoryPanel.tsx` | Story view |
| `src/components/panel/EntityPanel.tsx` | Entity view (unified with StoryPanel layout) |
| `src/components/panel/EntityWikiPanel.tsx` | Wiki tab for entities |
| `src/components/panel/ExplorePanel.tsx` | Explore panel, collections, scroll highlighting |
| `src/components/panel/CollectionCard.tsx` | Collection card ("moments" label) |
| `src/components/ui/TimelineBar.tsx` | Era pills (dynamic counts) |
| `src/components/SplashScreenA.tsx` | Pin drop splash (active) |
| `src/components/SplashScreenB.tsx` | Pulse & reveal splash (available) |
| `src/components/SplashScreenC.tsx` | Map fragment splash (available) |
| `src/lib/data/provider.tsx` | Data loading, splash screen rendering |
| `src/lib/data/supabase-loader.ts` | Supabase → app data mapping |
| `src/data/stories.ts` | 145 stories |
| `src/data/entities.ts` | 210 entities |
| `src/data/moments.ts` | 795 moments |
| `src/data/collections.ts` | 31 collections |
