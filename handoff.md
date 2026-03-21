# Deep Maps — Session Handoff

**Last updated:** 2026-03-21 (Session 61 — Data consolidation, EntityPanel unification, collections, splash screen)
**Branch:** `main`

---

## What Shipped (Session 61)

### Data Consolidation
1. **Deleted 46 duplicate stories** — 24 person biography stories, 18 place stories, 4 concept stories that duplicated their matching entities. Entities are now the single source of truth for people, places, and concepts.
2. **Fixed 5 orphaned moments** — Added missing `entityIds` (congress-avenue-bats, menger-hotel-rough-riders, los-alamos-national-laboratory) so no moments were lost.
3. **Cleaned 47 canonicalStoryId refs** — Removed pointers to deleted stories from entities.ts.
4. **Cleaned 34 relatedStoryIds** — Removed deleted IDs from surviving stories' relatedStoryIds arrays.
5. **Full wiring audit** — Zero broken references across stories, entities, moments, collections.

### EntityPanel Unification
6. **Restructured EntityPanel** to match StoryPanel layout:
   - Header now scrolls away (was fixed outside scroll container)
   - Added "Dive Deeper" horizontal card strip (related stories + connected entities)
   - Sticky tab bar (Moments / Wikipedia) freezes at top when scrolled
   - Simplified from 3 tabs (moments/connections/stories) to 2 tabs (moments/wiki)
7. **Created EntityWikiPanel** — Slim Wikipedia panel for entities (~140 lines, no geo-anchors)
8. **Removed duplicate "Moments (N)" heading** from StoryPanel

### UX Fixes
9. **Jitter fix** — Tolerance-based bounds comparison (zoom diff < 1.2 + intersects) for both story and entity modes
10. **Dynamic era pill counts** — Timeline pills now reflect stories visible on the map. Empty eras hide.
11. **Era pill fallback fix** — Empty set shows 0, not all stories
12. **Place click zoom** — Single-moment entities zoom to level 14+ instead of staying zoomed out
13. **TS build fix** — `getBoundsZoom` expects `L.Point`, not `PointTuple` — fixed Vercel deployment

### Collections
14. **Deleted 10 weak/generic collections** — mexico-political-assassinations, sacred-pilgrimage-sites, historys-bravest, massacre-sites, notable-people, unsolved-disappearances, notable-people-2, scientific-minds-2, revolutionaries-pen-pulpit, artists-writers-immortal
15. **Fixed "locations" → "moments"** label in CollectionCard and empty state

### Content
16. **35 entity description rewrites** — Removed BuzzFeed-style editorializing, applied encyclopedic tone per content guide v3 (in progress — agent applying edits)

---

## 🟡 In Progress (Agents Running at Session End)

### New Collections (11 agents — results ready, need integration)
| Collection | Status | Moments |
|---|---|---|
| Game of Thrones Filming Locations | ✅ Done | 17 |
| Famous Prisons and Their Most Notable Inmates | ✅ Done | 14 |
| Major Fossil Discovery Sites | ✅ Done | 15 |
| Where Famous Albums Were Recorded | ✅ Done | 17 |
| Historic Events Along Route 66 | ✅ Done | 19 |
| Evolution of Life on Earth | ⏳ Running (Opus) | ~24 |
| Famous Heists and Robberies | ⏳ Running | ~15 |
| Historic Sports Moments | ⏳ Running | ~18 |
| Where Famous Books Were Written | ⏳ Running | ~18 |
| Where Inventions Were Born | ⏳ Running | ~20 |
| Ancient Human Settlements | ⏳ Running | ~15 |

**Agent results are in** `/private/tmp/claude-501/.../tasks/` — read each agent's output file to get the TypeScript-ready moment objects and collection definitions.

### Other Agents
- **Entity description rewrites** — Applying 35 edits to entities.ts (agent running)
- **Splash screen variations** — 3 variants of Option C (pin drop + ripple) being generated

### Integration Steps (Next Session)
1. Read each completed agent's output file
2. Add moments to `moments.ts`, collections to `collections.ts`
3. Create needed entities (studios, paleontologists, prisons, etc.)
4. Run wiring audit to verify all references
5. Type-check and push
6. Pick a splash screen variation and wire it in

---

## Architecture Notes

### Entity vs Story (Post-Consolidation)
- **Entity** = a thing (person, place, concept). Has profile, description, wikipedia. Moments link via `entityIds`.
- **Story** = a narrative arc connecting moments into a sequence. Has beginning/middle/end. Characters (entities) appear IN stories.
- **No more biography stories** — person entities ARE the profile. Stories are thematic narratives.
- `canonicalStoryId` is now only used for stories that still exist (e.g., `lbj-lady-bird-austin`).

### Collections Strategy
- **Collections = lists, not narratives.** Names read like Wikipedia "List of..." articles.
- **SEO-first naming** — clear, searchable titles
- **Future**: Each collection becomes an SEO landing page at `/list/[collection-id]`
- **No orphan risk** — all collection moments have entity links; deleting a collection doesn't lose moments

### EntityPanel Layout (Matches StoryPanel)
```
scroll container [
  header (name, type badge, expandable description)
  → dive deeper strip (connected entities + related stories)
  → sticky tab bar (Moments / Wikipedia)
  → moments or EntityWikiPanel
]
```

---

## Immediate Next Steps

### Priority 1 — Integration
1. ⬜ Integrate 11 new collections (moments + entities + collection objects)
2. ⬜ Verify entity description rewrites applied correctly
3. ⬜ Pick and wire splash screen variation
4. ⬜ Push all to Vercel

### Priority 2 — Content
5. ⬜ Austin moment rewrites from voice note (Session 60 feedback)
6. ⬜ Rename existing collections for SEO (e.g., "Nuclear Weapon Detonation and Test Sites" → "Every Place a Nuclear Weapon Has Been Detonated")
7. ⬜ Sync static data → Supabase
8. ⬜ Willie Nelson story — non-Austin moments need separate handling

### Priority 3 — UX Polish
9. ⬜ Splash screen polish (3 variants ready for review)
10. ⬜ Search UX on mobile (keyboard covers results, no auto-suggestions)
11. ⬜ Polyline overshoot (16px offset)

### Priority 4 — Future Collections
- Famous heists and robberies
- Historic sports moments
- Where famous books were written
- Terrorist attack locations (sensitive — needs editorial policy)
- More film/TV (Harry Potter, Lord of the Rings, Breaking Bad)
- Historic concert venues and performances

---

## Session Startup Checklist

1. Read this file (`handoff.md`) and `CLAUDE.md`
2. Read memory at `~/.claude/projects/.../memory/MEMORY.md`
3. CWD is locked to `networking-dashboard-fresh` — use `pushd ~/Documents/claude-code-projects/deep-maps`
4. Check for completed agent output files in `/private/tmp/claude-501/.../tasks/`
5. Start dev server: `pushd ~/Documents/claude-code-projects/deep-maps && npx vite --host --port 5178`
6. User accesses production at **deepmaps.app** (Vercel)
7. Data source: Supabase by default; `?data=static` for local

## Common Commands

```bash
# Dev server
cd deep-maps && npx vite --host --port 5178

# Type check
npx tsc --noEmit

# Wiring audit
npx tsx -e "import {stories} from './src/data/stories'; ..."
```

---

## Architecture Reference

| File | Role |
|------|------|
| `src/App.tsx` | Layout, routing, mode system, `zoomToActiveLocation` state |
| `src/components/map/MapView.tsx` | Map + zoom effect, markers (numbered), polylines, tooltips |
| `src/components/map/EmergenceLayer.tsx` | Canvas markers (highlight-aware, collection dimming) |
| `src/components/panel/StoryPanel.tsx` | Story view, card expansion, scroll handling |
| `src/components/panel/EntityPanel.tsx` | Entity view — now matches StoryPanel layout with dive deeper + wiki tab |
| `src/components/panel/EntityWikiPanel.tsx` | **NEW** — Slim wiki panel for entities |
| `src/components/panel/LocationCard.tsx` | Moment card (expansion, compact fallthrough) |
| `src/components/panel/ExplorePanel.tsx` | Explore panel, scroll highlighting, collections |
| `src/components/panel/CollectionCard.tsx` | Collection card (now says "moments" not "locations") |
| `src/components/ui/TimelineBar.tsx` | Era pills (dynamic counts from mapVisibleStoryIds) |
| `src/index.css` | Tooltip styles (`.dark-tooltip`), marker styles |
| `src/data/stories.ts` | 145 stories (down from 191 after consolidation) |
| `src/data/entities.ts` | 210 entities |
| `src/data/moments.ts` | 602 moments |
| `src/data/collections.ts` | 20 collections (down from 30) |
