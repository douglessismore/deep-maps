# Deep Maps — Session Handoff

**Last updated:** 2026-04-09 (Session 33 — Orphan click sheet fix, 3 Seattle wirings, Vercel deploy pending)
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** https://deepmaps.app

## Current State (Session 33)

### ⚠️ OPEN: Vercel Deploy Not Confirmed for Commit `e367a7f`

All Session 33 fixes are committed and pushed, but as of last check the deployed bundle on deepmaps.app was still `index-BQa_uxGH.js` (pre-fix, `snapRequestKey` absent). The HTML edge cache had `age: 42931` (~11.9 hours) and `x-vercel-cache: HIT`. Query-string cache-busting didn't invalidate. User confirmed "nothing improved" which is consistent with the deploy not having shipped.

**Before debugging further next session: verify the deployed bundle actually contains the fix.**

```bash
# Must return a bundle path that DIFFERS from BQa_uxGH:
curl -s https://deepmaps.app/ | grep -oE 'assets/index-[a-zA-Z0-9_-]+\.js' | head -1
# Then grep the bundle for the fix identifier:
curl -s https://deepmaps.app/<bundle-path> | grep -o 'snapRequestKey' | head -1
```

If Vercel still hasn't deployed, trigger a redeploy manually via the Vercel dashboard or push an empty commit. Only debug the click behavior AFTER confirming the new bundle is live.

### What Session 33 Actually Shipped (committed, push confirmed)

**Commit `e367a7f`**: "Fix programmatic sheet snap dropping re-requests; wire 3 Seattle orphans"

1. **Sheet programmatic-snap bug fix (root cause for the orphan-click UX issue)**
   - File: `src/App.tsx`, `src/components/ui/{BottomSheet,ClaudeSheet,CinemaSheet}.tsx`
   - Root cause: all three sheets used `prevTargetSnap.current !== targetSnap` to guard the programmatic-snap effect. When App called `setTargetSheetSnap('half')` and the state was already `'half'` (e.g. user had dragged back to collapsed after a previous half-snap), React didn't re-render, the effect didn't run, and the sheet stayed put. Orphan-pin clicks fired `handleOrphanMomentClick` but the sheet was silently stuck.
   - Fix: added `snapRequestKey` counter in App.tsx, bumped on every `setTargetSheetSnap` call. All three sheets now key their effect off `snapRequestKey` instead of the value, so repeat requests always re-fire.
   - This ALSO fixes any other programmatic snap that was silently dropping on repeat (several: entity select, collection select, story select paths).

2. **Three Seattle orphan wirings (Supabase writes, then dumped to static)**
   - `grunge-sub-pop-seattle-1988` → `seattle-grunge-era` story (sort_order 8) + `kurt-cobain` entity tag. Script: `scripts/wire-sub-pop.ts`
   - New incident story `seattle-general-strike-1919` ("The Seattle General Strike", category political-drama, 1919, wikipedia_slug Seattle_General_Strike) created and the existing orphan moment wired as primary. Script: `scripts/create-general-strike-story.ts`
   - New collection `seattle-dark-history` ("Seattle Dark History") created, `sea-capitol-hill-massacre` wired. Subagent scanned broader Puget Sound + text-searched; only the capitol hill massacre met strict dark-history criteria. **Collection is currently 1-moment**. Script: `scripts/create-seattle-dark-history-collection.ts`
   - Post-dump: 2593 moments, **634 stories** (+1), 624 entities, **34 collections** (+1)

### Remaining Gray-Pin Reports From User (ALL TO BE RE-VERIFIED POST-DEPLOY)

User reported the following pins were still gray + non-clickable after pushing `e367a7f` — but the push predated deploy confirmation. MANY of these should be wired once the commit deploys:

**Should no longer be gray after deploy (already wired in `e367a7f`):**
- Capitol Hill rave after-party gunman (`sea-capitol-hill-massacre`) — wired to Seattle Dark History collection
- Sub Pop grunge single (`grunge-sub-pop-seattle-1988`) — wired to Grunge Explosion story
- Seattle General Strike 1919 (`seattle-general-strike-1919`) — has new incident story

**Should be CLICKABLE after deploy (orphan + sheet fix):** Even if still gray, clicking should now open the Moments tab card:
- Original Starbucks `sea-original-starbucks` (1971) — orphan. Confirmed in Supabase as orphan; has a gold-pin duplicate right next to it per user (🔴 DUPE SUSPECT — needs investigation).
- Bezos/Amazon garage `inv-amazon-garage` — orphan
- Ridgway lives three miles — orphan
- Five bodies surface in Green River — orphan
- Oregon Trail ends — orphan
- Celilo Falls fishing — orphan
- Hanford plutonium — orphan (user: "could be added to atomic bombing of japan story, with all the locations that came together")
- Austin's many gray dots — not enumerated

**Starbucks duplicate investigation needed**: User saw two pins with the same title side-by-side, one gray and one gold. The gold one opens its bottom sheet card; the gray one does not. Both share the name "Three Friends Open a Coffee Bean Shop Near Pike Place and Call It Starbucks". My Supabase query found exactly ONE moment with that name (`sea-original-starbucks`), which is an orphan. The gold duplicate must be a differently-named moment in the same location (e.g. a moment titled differently but at 47.6101, -122.3426). Needs a coordinate-proximity dedupe check next session. Possible candidates: another Starbucks-related moment wired into a story.

### Code Paths Traced This Session (for faster onboarding next time)

- **Click path**: `EmergenceLayer.tsx:259-261` binds a per-marker click handler at creation time via `onOrphanClickRef.current?.(m)` → `App.tsx:711 handleOrphanMomentClick` → sets `exploreTab='moments'`, `panelView='explorer'`, `activeLocation`, `scrollHighlight`, and calls `setTargetSheetSnap('half')`.
- **Sheet response path**: `ClaudeSheet.tsx:156-165` (and equivalents in BottomSheet, CinemaSheet) run a `useEffect` on `targetSnap` change. The pre-fix code compared the new value to `prevTargetSnap.current` — if equal, effect no-op. With the fix, they key on `snapRequestKey` (monotonic counter) instead.
- **Moments tab rendering**: `ExplorePanel.tsx:1140-1204`. Builds `sortedMoments` from `viewportLocations`, which is populated via `getLocationsInBounds(stories, bounds, momentMap, moments)` at `ExplorePanel.tsx:274-294`. Crucially, `getLocationsInBounds` at `src/lib/geo.ts:92-102` DOES include story-less moments (orphans) as `{ location: m, story: null }`. So orphans appear in the moments list — the auto-scroll effect at `ExplorePanel.tsx:547-560` scrolls the clicked orphan into view.
- **Marker-color ("gray pin") logic**: `EmergenceLayer.tsx:217-218`. Gray = `momentCategoryMap.get(moment.id)` returns undefined, which happens when NO story in the `stories` array (i.e., browseable incident+era stories) contains the moment. Collection membership alone does NOT color a pin. This means the capitol-hill-massacre pin will stay gray even after being wired into the Seattle Dark History collection — a collection is not a story. **This is worth fixing separately**: either color pins by collection category when no story category is available, or make the "clickable orphan → Moments tab" UX the first-class affordance for collection-only moments.

### Deferred: Marker Click-Handler Staleness Bug (Not Yet Fixed)

`EmergenceLayer.tsx:222-225` — when a marker is reused across data updates (same moment.id), the effect calls `setRadius` + `setStyle` but does NOT rebind `marker.on('click', ...)`. The original click handler captured `story` in closure at creation time. If a moment gets newly wired to a story after the marker was created (e.g. via the dump-from-supabase → static refresh during a running session), the old click handler still routes to `onOrphanMomentClick` instead of `onLocationClick`. Fix: remove old handler + re-bind on the `existing` branch, OR rebuild the marker when story changes. Low priority — it only affects hot-reload dev sessions, not production.

## Previous State (Session 32)
Orphan moment cleanup pass. Started with 896 orphans (flagged by buggy script that ignored collection_moments). After fixing the orphan definition, deleting 38 dupes, and absorbing 92 biography moments, **orphan count is now 416** (down from a real starting count of 537).

- **-38 duplicate moments** deleted (9 round-1 + 29 round-2 pairs), refs migrated winner-takes-wiring
- **+92 story_moments rows** linking orphans to their biography subjects
- **Accuracy chips** now render in map tooltips for approximate / general-area pins
- **Biographies remain invisible on frontend** (confirmed via browseableStories whitelist — incident + era only)

## Previous State (Session 31)
Session 31 focused on OddStops content enrichment, fixing the admin edit propagation bug, and building the content staging pipeline:
- **2,597 moments** — 12 new, 1 deleted (tb-lake-sammamish duplicate), 3 corrected
- **618 entities** — 1 new (Layne Staley)
- **628 stories** — unchanged count, 4 stories expanded
- **30 collections** — unchanged
- **2,161 entity links** — 70.1% coverage
- **18 moments geoVerified** from OddStops
- **Zero drift** between static and Supabase
- **136,118 external records** staged (78,344 NTSB aviation + 57,774 Vici.org ancient sites)

## Gotcha — Dedupe/Absorb Scripts Must Be Followed by Dump Sync
Session 32 discovered: `scripts/dedupe-moments*.ts` and `scripts/absorb-orphans-to-bios.ts`
only mutate Supabase. The provider's merge logic (`src/lib/data/provider.tsx:108`)
adds "static-only" moments back in as a fallback, so deleted-from-Supabase losers
reappear on the frontend as gray unclickable orphans until `npx tsx scripts/dump-from-supabase.ts`
is run to refresh static files. ALWAYS dump after bulk DB mutations.

## What Session 32 Shipped

### Dedupe Round 1 + Round 2 (38 moments deleted)
- Built `scripts/investigate-dupe-moments.ts` — pair-level wiring check
- Built `scripts/dedupe-moments.ts` — migrates entity/story/collection refs from LOSER → WINNER (upsert semantics), then deletes loser. Round 1 cleared 9 hand-confirmed pairs.
- Built `scripts/analyze-orphans.ts` — full categorization into dupes / absorbs / coord leads / remaining. Output: `scripts/staging/orphan-analysis.md`.
- Built `scripts/dedupe-moments-round2.ts` — 29 auto-winner pairs flagged by the analysis (winner = most wiring; tie → longer/year-suffixed ID).

### Orphan Definition Fix
- `scripts/match-orphans-to-hmdb.ts` previously treated any moment missing from `story_moments` as an orphan. Added `collection_moments` check so moments wired via collections aren't falsely counted.
- Orphan count dropped 896 → 537 → 508 (post-dedupe) → 416 (post-absorbs).

### Biography Absorb Pipeline (92 moments linked)
- Built `scripts/absorb-orphans-to-bios.ts` — inserts `story_moments` rows linking orphans to the biography of their tagged person entity.
- **5 guardrails** iteratively tuned against the Physical Presence Rule:
  1. Entity must be `type='person'`
  2. Story must be `story_type='biography'`
  3. Orphan name must share a distinctive token with the entity name (with a FILLER blocklist for epithets like "great", "barca", "galilei", "conqueror")
  4. Biography's id/name must contain an entity-name token (prevents Augustine→Cicero bugs where the entity was just tagged on a shared moment)
  5. Year within biography's existing range: ±15yr for ≥5 existing moments, ±100yr for sparse bios, with a hard lifetime cap of +150yr from the earliest moment (catches post-death legacy events like Tut mask display 1925)
- Result: 92 absorbed, 34 rejected (all legit: Sharpeville→Mandela, Bay of Pigs→Kennedy, Gallipoli→Churchill, Curie Panthéon reinterment 1995, Globe Theatre rebuild 1997, etc.)
- Top clusters absorbed: Alexander (8), Leonardo (7), Galileo (6), Hannibal (5), FDR (5), Mao (4), William the Conqueror (4)

### Marker Accuracy Indicator (map tooltips)
- `src/lib/geo.ts` — added `accuracyTooltipHtml(accuracy)` helper returning HTML chip
- `src/components/map/EmergenceLayer.tsx` + `src/components/map/MapView.tsx` — 5 tooltip renderers now show "◎ approximate location" or "◯ general area" in muted italic for non-exact pins. Exact/pinpoint/undefined render nothing.
- Verified: tsc clean, 14/14 tests pass

## What Session 31 Shipped

### OddStops Content Enrichment
1. **10 new moments** across Bundy, Cobain, Ridgway, Dahmer, and Seattle dark history — all with OddStops-verified GPS coordinates offset ~1m from source
2. **Ted Bundy expanded**: 11 moments across 2 stories (was 3). New: first attack, Hawkins abduction, Healy abduction, Taylor Mountain dump, Aspen escape, Pensacola arrest, birthplace, rooming house
3. **Kurt Cobain expanded**: 6 grunge story moments (was 4). New: Rome overdose (Westin Excelsior), shotgun purchase (Stan Baker Sports)
4. **Green River Killer**: 4 moments (was 3). New: Ridgway house
5. **Nirvana first gig corrected**: Wrong date (Jun 28→Mar 19, 1988), wrong drummer (Crover→Foster), wrong venue status (demolished→Templo Maranatha church still standing)
6. **Dahmer arrest coords updated** from OddStops (43.0443→43.042272)
7. **1 duplicate removed**: tb-lake-sammamish (duplicated sea-bundy-sammamish). Deleted from static AND Supabase (story_moments, moment_entities, collection_moments, moments).
8. **Layne Staley entity created** with canonical story
9. **18 moments marked geoVerified** — all OddStops-sourced coords now show verified checkmark

### PinEditor Cache Propagation Fix
10. **Root cause**: Admin edits wrote to Supabase via RPC but never updated TanStack Query cache. `staleTime: Infinity` meant no re-fetch. Users saw stale data until full page reload.
11. **Fix**: `queryClient.setQueryData` patch after RPC success in PinEditor.tsx, following StoryPanel image upload pattern. Coords, accuracy, geoVerified, and address all update instantly.

### Content Staging Pipeline (NEW)
12. **Architecture**: `scripts/staging/` directory with normalized StagingRecord format for any external dataset
13. **NTSB Aviation Database**: 78,344 records with lat/lng, 1948-2026, 14,967 with fatalities. Sourced from official NTSB MDB bulk downloads. Script: `scripts/ingest/pull-ntsb.ts`
14. **Vici.org Ancient Sites**: 57,774 Greco-Roman archaeological sites (castles, villas, graves, temples, cities, shipwrecks). CC-BY-SA. Script: `scripts/ingest/pull-vici.ts`
15. **Pipeline flow**: External sources → staging/ (normalized JSON) → filter by notability → match against existing entities → promote in themed batches → validate → sync

### Content Sources Roadmap (NEW)
16. **CONTENT-SOURCES.md** created — tiered evaluation of 15+ external data sources for geo-precise historical content, with pipeline process and evaluation criteria

### OddStops Competitive Analysis
17. OddStops: ~50-150K monthly visits, ~$500-1500/mo AdSense. Encyclopedia format, no map interface, no entity graph. Validates demand for GPS-precise dark history content.

## Key Decisions (Session 31)

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| OddStops coord handling | Offset ~1m (±0.00001°) | Use exact coords | Avoid exact coordinate matching with source |
| Admin edit propagation | queryClient.setQueryData patch | invalidateQueries (full reload) | Targeted patch is instant; invalidation would trigger full Supabase reload |
| Duplicate moment resolution | Delete from both static + Supabase | Keep both | One event = one moment. UPSERT-only sync means Supabase deletes must be manual |
| Content pipeline architecture | Staging dir with normalized JSON | Direct ingestion to live data | Review before promoting; cross-source dedup; notability filtering |
| External dataset approach | Hybrid: pull all → filter → promote in themed batches | Source-by-source ingestion | See full picture for dedup, but commit in reviewable chunks |
| Placing Literature | Deprioritize (site is dead) | Build pilot story | App returns 503, data locked, would need founder contact |

## Content Staging Pipeline

```bash
# Staging data lives in scripts/staging/sources/ (not committed — too large)
# See scripts/staging/README.md for full architecture

# Pull scripts (one-time, data cached locally):
npx tsx scripts/ingest/pull-ntsb.ts        # 78K aviation records (needs NTSB MDB files)
npx tsx scripts/ingest/pull-vici.ts        # 58K ancient sites (hits vici.org API)

# Next steps (not yet built):
# scripts/staging/filter-notable.ts        # Score + filter by notability
# scripts/staging/match-entities.ts        # Cross-reference with existing Deep Maps entities
# scripts/staging/promote-batch.ts         # Generate content-guide-compliant moments
```

## Sync Workflow

```bash
# After editing static files:
source .env.local && npx tsx scripts/sync-to-supabase.ts --dry-run  # preview
source .env.local && npx tsx scripts/sync-to-supabase.ts             # push

# After editing in Supabase:
source .env.local && npx tsx scripts/dump-from-supabase.ts           # pull
git diff src/data/  # review changes

# Check for drift:
source .env.local && npx tsx scripts/check-drift.ts                  # row counts
source .env.local && npx tsx scripts/reconcile/detailed-drift.ts     # field-level
```

## Open Issues (prioritized)

### ~~P0 — Admin Edit Doesn't Persist / Propagate~~ ✅ FIXED Session 31
- **Root cause 1:** RPC didn't accept accuracy param → FIXED Session 30 (migration 011)
- **Root cause 2:** Provider overrode coords when geoVerified=false → FIXED Session 30
- **Root cause 3:** TanStack Query cache never updated after RPC → FIXED Session 31 (PinEditor.tsx queryClient.setQueryData patch)

### P0 — Label Positioning / Marker Accuracy (Sessions 27-31)
- **Marker nudge REVERTED** (Session 31, commit `cd2aa51`) — overlap detection pushed pins to wrong locations
- **DivIcon inline labels** work but have edge cases at screen edges
- **Remaining:** Labels bleed off edges, near-identical coords look like one pin

### P0 — FOCUS.md Bugs (User Testing Blockers)
- Arrow click → label disappears instead of opening panel
- Corner label when scrolling person moments
- Gray markers for wrong person after arrow click
- Labels hiding their markers (LBJ)
- Downtown Austin shows only 3 moments

### P0 — Verification Testing
- Full suggest → agree → verify flow not yet tested between two accounts on production

### P1 — Content Staging Pipeline (Next Steps)
- Build `filter-notable.ts` — score 136K staging records by notability
- Build `match-entities.ts` — cross-reference against 618 existing entities
- Promote first themed batch: "Major Aviation Disasters" (~50-100 notable crashes)
- Promote first ancient world batch: "UNESCO Ancient Sites" (~50-100 notable ruins)
- HMDb.org dataset — download Kaggle dump, add to staging (230K+ records)

### P1 — OddStops Content Enrichment (Ongoing)
- More locations available: Gacy, Zodiac, Ed Gein, H.H. Holmes, Son of Sam
- sea-capitol-hill-massacre is orphaned (needs story or collection)
- Bundy burial location not yet researched
- Sandpiper Tavern data collected but not turned into moment
- Consider "Seattle Dark History" collection

### P1 — Email Customization
- Magic link emails show "Supabase Auth" as sender

### P1 — ~413 Orphan Moments (down from 416)
- Session 32 deleted 38 dupes + absorbed 92 into biographies → 416
- Session 33 wired 3 more (grunge-sub-pop, general-strike, capitol-hill-massacre) → ~413
- Next: HMDB net-new notable moments analysis
- Next: fully-isolated orphan clusters (Tokyo, Mexico City, Istanbul) — need themed collections or standalone stories
- Create UNAM, Palacio de Bellas Artes, Templo Mayor, etc. as **place entities** (not stories) when processing Mexico City batch
- Hanford plutonium orphan → wire into Manhattan Project / atomic bombing story (user suggestion: flesh out "all the locations that came together to make it happen")

### P1 — Private Property / Access Labels
- Formalize `accessLevel` field

### P1 — Phoenix Place Entity (4 moments)
- City-level entities need minimum moment threshold

### P1 — Header Sizing
- Story/entity names should be larger than moment names

### P1 — Clean Up Dead Regional Files
- austin-barnes, del-valle, mesa-phoenix, seattle-portorchard content files are dead code

### P1 — App Load Speed
- Delay when clicking back from story/person to main page

### P1 — Encyclopedia People Tab
- Needs separate tab, story cards too large

### P2 — Barry Goldwater Content Quality
### P2 — Previous Session Issues
- What's Here too few items, category filter + empty state, image lightbox, places not discoverable, gray markers not clickable

## Architecture Notes
- **PKCE auth** — `flowType: 'pkce'` in supabase client config
- **Crosshair approach** — map `moveend` event → `getCenter()` → state
- **ntfy.sh notifications** — `pg_net` HTTP POST from DB trigger
- **Two edit modes** — Admin "Edit Location" (direct DB update) vs Community "Suggest"
- **Profile join workaround** — profiles fetched via batch `IN` query
- **Static data = Supabase dump** — flat arrays, no regional imports, `@ts-expect-error` for large arrays
- **Content staging pipeline** — external datasets → `scripts/staging/sources/` → filter → promote → live data
- **Coordinate offset policy** — all externally-sourced coords offset ~1m (±0.00001°) from source

## Files Changed Session 33
- `src/App.tsx` — added `snapRequestKey` counter, wrapped `setTargetSheetSnap`, passed counter to all 3 sheet variants
- `src/components/ui/BottomSheet.tsx` — snapRequestKey-keyed effect
- `src/components/ui/ClaudeSheet.tsx` — snapRequestKey-keyed effect
- `src/components/ui/CinemaSheet.tsx` — snapRequestKey-keyed effect
- `src/data/{moments,stories,entities,collections}.ts` — dumped from Supabase after wiring (634 stories +1, 34 collections +1)
- `scripts/wire-sub-pop.ts` — NEW, Sub Pop → grunge era wiring script
- `scripts/create-general-strike-story.ts` — NEW, creates incident story + wires moment
- `scripts/create-seattle-dark-history-collection.ts` — NEW, creates collection + wires moment
- `scripts/investigate-gray-pins.ts` — NEW, investigation helper

### NOT modified in Session 33 (but present in working tree from prior sessions — leave alone or commit separately)
- `CLAUDE.md`
- `src/components/panel/EntityPanel.tsx`
- `src/components/panel/LocationCard.tsx`
- `src/components/panel/StoryPanel.tsx`
- `src/lib/entityHelpers.ts`
- `src/lib/__tests__/entityHelpers.test.ts`

## Files Changed Session 31
- `src/data/moments.ts` — 12 new moments, 1 deleted, 3 corrected, 18 geoVerified
- `src/data/stories.ts` — 4 stories expanded (ted-bundy, bundy-seattle-years, seattle-grunge-era, green-river-killer)
- `src/data/entities.ts` — 1 new entity (layne-staley)
- `src/data/collections.ts` — Updated reference (tb-lake-sammamish → sea-bundy-sammamish)
- `src/components/ui/PinEditor.tsx` — TanStack Query cache patch after admin edit
- `src/lib/data/provider.tsx` — Export queryClient and dataSource for PinEditor
- `scripts/staging/` — NEW: content staging pipeline directory
- `scripts/staging/README.md` — NEW: staging architecture documentation
- `scripts/ingest/pull-ntsb.ts` — NEW: NTSB aviation data pull script
- `scripts/ingest/pull-vici.ts` — NEW: Vici.org archaeological data pull script
- `CONTENT-SOURCES.md` — NEW: data sources roadmap with 15+ evaluated sources

### NOT modified
- `src/App.tsx`
- `src/components/map/MapView.tsx`
- `src/components/map/EmergenceLayer.tsx`
- `src/index.css`
- Community verification tables
- Supabase-only columns (preserved)
