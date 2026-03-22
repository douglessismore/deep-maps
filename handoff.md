# Deep Maps — Session Handoff

**Last updated:** 2026-03-22 (Session 61 — massive session)
**Branch:** `main`

---

## What Shipped This Session

### Architecture
1. ✅ **Supabase single source of truth** — removed `?data=static`, added fallback, seed/dump scripts
2. ✅ **Pre-push hook** — `tsc -b` runs before every push, prevents broken Vercel deploys
3. ✅ **Full Supabase sync** — 447 records updated, 21 stories deleted, 21 collections inserted

### Data Consolidation
4. ✅ **Deleted 46 duplicate stories** (biography/place stories that mirrored entities)
5. ✅ **Converted 21 list-style stories → collections** with encyclopedic names
6. ✅ **Renamed 12 stories** to Wikipedia-style titles
7. ✅ **452 subtitles rewritten** from editorial hooks to place annotations
8. ✅ **41 entity descriptions rewritten** — encyclopedic tone
9. ✅ **Austin moment rewrites** per voice note (Willie Nelson, Lady Bird, Janis Joplin, Congress Bats)
10. ✅ **Evolution of Life** converted from collection to story (24 moments)

### UX Features
11. ✅ **Search** — real-time filtering, grouped results, mobile keyboard handling
12. ✅ **Collection markers** — unified with story experience (numbered, highlight/dim, click-to-zoom)
13. ✅ **Unified sticky headers** across all drill-in views
14. ✅ **Collection polylines FIXED** — root cause was mode='scroll' carrying over from stories tab
15. ✅ **Place entity zoom** — clicks now zoom to level 14+
16. ✅ **Dynamic era pill counts** — reflect map-visible stories
17. ✅ **Splash screen** — SplashScreenA (pin drop + ripple) wired

### Content
18. ✅ **11 new collections** added (170 moments): GoT, Sports, Books, Prisons, Fossils, Heists, Settlements, Albums, Route 66, Inventions, Evolution
19. ✅ **Content guide v3 updated** — hyper-specific subtitles, anti-examples added

---

## 🔴 IMMEDIATE NEXT SESSION — Story/Collection Cleanup

User approved these changes. IMPLEMENT FIRST THING:

### Stories to DELETE (moments stay, just remove story wrapper)
- `islamic-holy-cities` — Holy Cities of Islam (list, not narrative)
- `jerusalem-holy-sites` — Holy Sites of Jerusalem (redundant with biblical collection)
- `chicxulub-impact` — 1 moment, already in Evolution of Life story
- `modern-impact-events` — 2 unrelated impacts, not a story
- `confederate-mesilla` — not interesting enough yet
- `modern-rome` — Rome in the 20th Century (map timeline handles this)
- `paris-capital-culture` — The Golden Age of Paris (too general)
- `paris-under-fire` — rename to "Disasters and Crises of Paris" then convert to collection... actually DELETE all city history stories except London's Royal History (see below)
- `londons-trials-fire-war` — Disasters and Crises of London → DELETE
- `edo-to-tokyo` — DELETE
- `tokyo-under-fire` — DELETE
- `postwar-tokyo` — DELETE
- `london-crown-scaffold` — KEEP but convert to collection, rename (remove "Crown and Execution")

### All nuclear test site stories → DELETE (moments stay in nuclear collection)
- `bikini-atoll-tests`, `enewetak-atoll-tests`, `nevada-test-site`, `us-pacific-nuclear-tests`, `semipalatinsk-tests`, `novaya-zemlya-tsar-bomba`, `totsk-nuclear-exercise`, `british-nuclear-tests`, `french-nuclear-tests`, `lop-nur-chinese-tests`, `south-asian-nuclear-tests`, `punggye-ri-north-korea`

### Collections to DELETE or MERGE
- **Delete**: `literary-titans` (overlaps with Books), `artists-writers-immortal`, `artists-composers-icons` (same problem), `historical-figure-biographies` (too generic), `medieval-conquests` (3 moments, merge into battlefields), `revolutionaries-pen-pulpit` (3 moments), `empire-builders` (3 moments), `scientific-revolution` (4 moments, vague)
- **Delete**: `catholic-pilgrimage-sites`, `eastern-pilgrimage-sites`, `holy-land-biblical-sites`, `great-events-hebrew-bible` (all overlap with `biblical-events`)
- **Delete**: `london-under-fire`, `london-great-stages`, `rome-renaissance-masters` (niche city sub-collections)
- **Delete**: `london-history`, `rome-history`, `paris-history`, `tokyo-history` (generic city collections)
- **Merge into `famous-battlefields`**: `wwii-decisive-battles`, `wwi-battlefields`, `ancient-battles`, `american-battlefields`, `wars-of-empire`
- **Merge all meteorite/impact**: `meteorite-impact-craters` + `famous-impact-craters` + `ancient-impact-structures` + `meteorite-falls-and-fields` → 1 collection: "Everywhere a Meteorite Has Hit the Earth"

### Collections to RENAME
- `nuclear-weapon-sites` → "Every Place a Nuclear Weapon Has Been Detonated" (verify completeness first)
- `civil-rights-landmarks` → "Civil Rights Movement Sites" (not "landmarks")
- `thinkers-sages` → "Where Famous Philosophers Philosophized" (Greek schools through Sartre)
- `invention-birthplaces` → "Where Famous Inventions Were Created"
- `music-venues` → evaluate overlap with Albums collection, possibly merge
- `revolutionary-leaders` → evaluate if worth keeping at 10 moments

### Content Guide Updates Needed
- Add rule: "A single-moment story is not a story. It's a moment. Don't create story wrappers for individual moments."
- Add rule: "City-level aggregations are not stories or collections. The map's viewport filtering and timeline handle this natively."
- Add rule: "Before creating a collection, verify it doesn't overlap with an existing one. Search existing collections by keyword."
- Strengthen: "Collections must have a clear, specific theme that would work as a Wikipedia 'List of...' article. Generic themes like 'Famous X' are weak."

### Austin Subtitles
- The subtitle audit agent SKIPPED all Austin moments assuming they were "already fixed"
- Only 6 Austin moments were actually fixed (Willie Nelson, Lady Bird, Janis Joplin, Congress Bats, Cathedral of Junk, Michael Dell)
- ~70 Austin subtitles still need place-annotation rewrites
- Run a targeted subtitle audit on Austin moments only

---

## 🟡 Other Pending Items

### Bugs
1. ⬜ **Back button pollution** — clicking moments creates nav entries (needs testing)
2. ⬜ **Moment click zoom inconsistency** — some moments don't zoom on click
3. ⬜ **SRV single-moment jitter** — scroll-to-top jitter

### Content
4. ⬜ **Create entities** for new collection moments (studios, paleontologists, inventors, etc.)
5. ⬜ **Fix 3 Evolution moments** — year overflow in Supabase (bigint migration needed)
6. ⬜ **Willie Nelson non-Austin markers** — confusing for "Willie Nelson's Austin"
7. ⬜ **LBJ / Lady Bird story split** — currently combined story

### UX
8. ⬜ **Polyline overshoot** — 16px offset between coords and marker centers
9. ⬜ **Splash screen** — user hasn't reviewed variants B and C
10. ⬜ **Notability scoring transparency** — need guide for how notability is scored

### Future / Roadmap
11. ⬜ **gstack /office-hours** — prompt ready (see below), run in fresh session
12. ⬜ **SEO landing pages** for collections
13. ⬜ **More collections**: Harry Potter, Breaking Bad, historic concerts
14. ⬜ **Admin panel** for non-developer content curation
15. ⬜ **Automated testing** — zero tests currently
16. ⬜ **Supabase bigint migration** for deep-time year values

---

## /office-hours Prompt (Ready to Use)

```
I'm building Deep Maps — a geospatial storytelling platform that layers history onto an interactive map. Every event that ever happened, happened somewhere. We pin moments to exact locations, connect them into stories and entity profiles, and let users explore history by scrolling a map.

The pain: History is taught as a timeline, not a geography. You can stand on the exact spot where Lincoln was shot, where the Wright Brothers flew, where Hendrix built his studio — but there's no way to discover that in context. Google Maps shows restaurants. Wikipedia has no map. Atlas Obscura is a listicle. Nothing connects the physical place to the full historical depth.

Where I am: Working React/TypeScript app at deepmaps.app. ~1000 moments, 125 stories, 210 entities, 50 collections. Supabase + PostGIS backend. One developer (me + Claude Code). Pre-revenue, pre-launch.

Content is the bottleneck: Need to scale from 1K to 1M moments while maintaining editorial quality. Currently batch-generating with AI agents + human curation.

Revenue ideas I'm exploring: SEO-driven traffic monetization (each collection = a landing page like "Every Place a Nuclear Weapon Has Been Detonated"), premium city guides (Austin first with local historian Michael Barnes), API licensing for travel/tourism apps, educational licensing for schools, AR features (point phone at building → see history), affiliate partnerships with tourism/travel platforms.

What I think the product is: A map-first encyclopedia of history. The "Wikipedia of places." Eventually AR-ready.

What keeps me up at night: How to monetize before running out of runway. Whether to go deep on one city (Austin) or broad globally. Whether SEO landing pages are the right first revenue play. Whether the map UI is intuitive enough on mobile. Content quality at scale.
```

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
| `src/components/ui/SearchOverlay.tsx` | Real-time search |
| `src/lib/data/provider.tsx` | Data loading (Supabase primary, static fallback) |
| `src/lib/data/supabase-loader.ts` | Supabase → app data mapping |
| `scripts/full-sync-to-supabase.ts` | Static → Supabase sync |
| `scripts/seed-supabase.ts` | Initialize fresh Supabase |
| `scripts/dump-from-supabase.ts` | Supabase → static backup |
| `scripts/ingest/lib/content-guide-v3.md` | Content standards |

### Guardrails
- Pre-push hook: `tsc -b` runs before every push
- Supabase fallback: static files load if Supabase fails
- Supabase validation: moments checked for required fields on load

### Supabase Schema Gotchas
- `moments.location` = PostGIS POINT(lng lat), not separate lat/lng
- `moments.type_id` = string FK to `moment_types(id)`, not inline
- `moments.year` = int4, overflows at ±2.1B (affects deep-time)
- `moments.verification_level` not `verificationLevel` (snake_case)
- `moments.notability` is NOT NULL, default 50

### Session Startup
1. Read `handoff.md` and `CLAUDE.md`
2. CWD locked to `networking-dashboard-fresh` — use full paths for deep-maps
3. User accesses production at **deepmaps.app** (Vercel + Supabase)
4. **Always verify Vercel deployment after push** (`gh api .../deployments`)
5. **Always use `tsc -b` not `tsc --noEmit`** — Vercel uses `-b`
