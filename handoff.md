# Deep Maps — Session Handoff

**Last updated:** 2026-04-09 (Session 32 — Orphan cleanup pass: dedupe + biography absorbs + accuracy indicators)
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** https://deepmaps.app

## Current State (Session 32)
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

### P1 — 416 Orphan Moments (down from 537)
- Session 32 deleted 38 dupes + absorbed 92 into biographies
- Next: HMDB net-new notable moments analysis
- Next: fully-isolated orphan clusters (Tokyo, Mexico City, Istanbul) — need themed collections or standalone stories
- Create UNAM, Palacio de Bellas Artes, Templo Mayor, etc. as **place entities** (not stories) when processing Mexico City batch

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
