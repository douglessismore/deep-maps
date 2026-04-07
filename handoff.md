# Deep Maps — Session Handoff

**Last updated:** 2026-04-07 (Session 30 continued — Reconciliation + orphan tagging + content enrichment + admin edit bug fix)
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** https://deepmaps.app

## Current State
Session 30 resolved the P0 static/Supabase desync and continued with orphan tagging, content enrichment, and bug fixes:
- **2,584 moments** — 1 new (Olalla Cemetery for Starvation Heights)
- **617 entities** — 29 new (Mexican history, serial killers, landmarks, cultural figures)
- **628 stories** — unchanged
- **30 collections** — unchanged
- **2,148 entity links** — 70.1% coverage (was 59.7%)
- **Zero drift** between static and Supabase

Static files are now dumped directly from Supabase (flat arrays, no regional imports). Regional content files (austin-barnes, del-valle, mesa-phoenix, seattle) still exist on disk but are dead code — only referenced by one-time ingest scripts.

## What Session 30 Shipped

### P0 Reconciliation — Zero Drift Achieved
1. **Detailed drift audit** (`scripts/reconcile/detailed-drift.ts`) — field-level comparison of every table and join table between static and Supabase
2. **Push static → Supabase** (`scripts/reconcile/push-static-to-supabase.ts`) — safe UPSERT of 17 entities, 40 moments, 19 stories, 66 story_moments, 195 entity links, 192 related_stories. Zero deletes.
3. **Dump Supabase → static** — regenerated all 4 static data files from Supabase as flat arrays
4. **TS2590 fix** — `@ts-expect-error` on moments.ts array literal (2,583 items exceed TS union inference limit). Dump script updated to emit this automatically.
5. **Ongoing sync script** (`scripts/sync-to-supabase.ts`) — UPSERT-only, preserves Supabase-only columns, `--dry-run` flag, for use after any static file edit
6. **Fixed 2 moments** with invalid `importance: 'moderate'` (not a valid enum) — set to 'minor'
7. **6 new moment_types created**: sighting, hotel, fire_origin, military, maritime, ghost_town

### Orphan Entity Tagging — 148 New Links
8. **Automated name matching** (`scripts/tag-orphans.ts`) — matched 68 orphans to existing entities by entity name in moment name/subtitle
9. **Sibling story inference** — matched 40 orphans by inheriting entity links from sibling moments in the same story
10. **Entity link coverage**: 59.7% → **67.4%** (1,741 of 2,583 moments)
11. **Remaining orphans**: 842 (most need new entities created, not just wiring)

### Content Fixes
12. **DB Cooper split** — 3 atomic moments: Portland boarding, Sea-Tac ransom exchange, Columbia River money. Story now has all 3 in correct order.
13. **DB Cooper subtitle fixed** — `sea-cooper-seatac`: "ransom delivered on tarmac" (was: "terminal where Cooper collected the ransom")
14. **Miranda SCOTUS unlinked** — removed entity link (no physical presence at Supreme Court)
15. **Ransom money accuracy** — set to 'exact' (admin edit bug workaround)

### Admin Edit Location Bug — FIXED
16. **RPC fix** — `update_moment_location` now accepts `p_accuracy TEXT` param, casts to `location_accuracy` enum. Migration `011_fix_geo_rpc_accuracy.sql` deployed to production. Had to DROP old 4-param version first (ambiguous function name error), then cast `p_accuracy::location_accuracy` (type mismatch error).
17. **Provider coord override fix** — `provider.tsx` no longer overwrites Supabase coordinates when `geoVerified=true`. Admin-verified coords persist across app reloads.
18. **PinEditor accuracy pass-through** — admin save now sends `suggestAccuracy` to the RPC.

### More Orphan Entity Work (Session 30 continued)
19. **29 new entities created** — Mexican history (María Sabina, Porfirio Díaz, Vicente Guerrero, Emperor Maximilian, Subcomandante Marcos, Jacobo Grinberg, Luis Donaldo Colosio), places (Teotihuacán, Chichén Itzá, WTC, Pentagon, Greenwood District, Angkor Wat, Easter Island, Rosetta Stone), serial killers (Ramirez, Fish, Little, DC Snipers, Berkowitz), people (Jesse Washington, James Dean, Brad Will, Buddy Holly, Joe Stack, Mary Leakey, Elvis Presley, George Orwell, John Keats)
20. **Entity link coverage**: 59.7% → **70.1%** (1,811 of 2,584 moments linked to entities)

### Content Enrichment (Session 30 continued)
21. **Starvation Heights story expanded** — new Olalla Pioneer Cemetery moment (alleged burial site), sanitarium coords verified (47.4294, -122.5505 from wahauntedhouses.com), courthouse coords updated (47.5378, -122.6384 from kitsap.gov). All three moments validated against content guide v3.
22. **L. Ron Hubbard cabin** — coords updated to user-verified South Colby location (47.5336, -122.5461). Both moments (cabin writing 1936, Excalibur manuscript 1938) at same location, distinct events. Accuracy: approximate.
23. **DB Cooper ransom money** — accuracy fixed to 'exact' (admin edit bug had prevented persistence).

### Data Architecture Change
- Static files no longer use regional spread imports. `moments.ts`, `stories.ts`, `entities.ts` are complete flat arrays dumped from Supabase.
- Regional content files (`austin-barnes-content.ts`, `del-valle-content.ts`, etc.) are now dead code — their content is included in the main dump.
- Going forward: edit in Supabase → run `dump-from-supabase.ts` → commit. Or edit static → run `sync-to-supabase.ts` → commit.

## Key Decisions (Session 30)

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Reconciliation strategy | Push up, then dump down | Surgical merge into existing files | Cleaner — ensures exact parity, single source of truth |
| Shared item conflicts | Supabase wins (no overwrite) | Static wins | Supabase is declared source of truth |
| Regional content files | Keep as dead code | Delete them | Still referenced by ingest scripts, can clean up later |
| TS2590 fix | @ts-expect-error annotation | Split into chunks, JSON file | Simplest — one-line fix, dump script emits it |
| Sync direction | UPSERT only, never DELETE | Bidirectional sync with deletes | Too risky to auto-delete; manual review for removals |

## Sync Workflow (New)

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

### ~~P0 — Admin Edit Doesn't Persist Accuracy~~ ✅ FIXED Session 30
- **Root cause 1:** `update_moment_location` RPC didn't accept or save `accuracy` param
- **Root cause 2:** `provider.tsx` overrode Supabase coords with static coords on every load, even after admin verification
- **Fix 1:** New migration `011_fix_geo_rpc_accuracy.sql` — adds `p_accuracy` param with `::location_accuracy` cast, deployed to production
- **Fix 2:** Provider now skips coord override when `geoVerified=true` — admin-verified coords always win
- **Fix 3:** PinEditor passes `suggestAccuracy` in admin save path

### P0 — Label Positioning / Marker Accuracy (Sessions 27-31)
- **Marker nudge REVERTED** (Session 31, commit `cd2aa51`) — the overlap detection from `3213606` was pushing pins to wrong geographic locations (Solomon #6 in the sea, Servant Girl south of the river, APD moment displaced). The "duplicate pin" appearance is actually two real moments at nearly identical coordinates — a data characteristic, not a rendering bug.
- **DivIcon inline labels** — `createLabeledMarkerIcon()` + `pickLabelDir()` system works (commit `c7f8075`). Labels are embedded in DivIcon HTML with direction-aware positioning (left/right/top based on available viewport space). Still has edge cases where labels clip at screen edges for moments near the map boundary.
- **Scroll overlay labels fixed** — `width: max-content` on `.scroll-label-container` escapes the 12px DivIcon parent constraint. `flex-shrink: 0` prevents text collapse.
- **Path arrowheads removed** (commit `073d452`) — were confused for duplicate pins.
- **Remaining issues:**
  - Labels can still bleed off screen edges in some scenarios (e.g., last moment in a story near map edge)
  - Two moments at near-identical coords still look like one fat pin (data issue, not rendering)
  - `contain: paint` on `.leaflet-container` clips overflow but doesn't reposition labels

### P0 — Verification Testing
- Full suggest → agree → verify flow not yet tested between two accounts on production.
- Magic link rate limit (~3-4/hour) blocking rapid testing. Wait and retry.
- Need to confirm: (a) session persists after magic link click, (b) suggestion appears in thread, (c) agree from second account verifies and updates moment.

### P1 — Email Customization
- Magic link emails show "Supabase Auth" as sender. Needs custom SMTP to change from-name.

### P1 — RapidVerify Upgrades
- POI-first sorting, notability weighting, crosshair picker, note box

### P1 — ~772 Orphan Moments (updated Session 30 continued)
- Session 30 total: 29 new entities created, 221 entity links added (70.1% coverage, was 59.7%)
- Three passes: automated name matching (68), sibling story inference (40), manual entity creation + wiring (73)
- Remaining 772 mostly need **new entities created** or belong to collections (not entity-taggable)
- ~200 Mexican/Latin American moments → create entities
- ~150 filming locations → collections
- ~100 aviation disasters → collections
- ~300 world history → assess for entity wiring
- **Planned: entity resolution pipeline** using 2.29M people DB

### P1 — OddStops Content Enrichment (NEW)
- OddStops.com has pinpoint GPS coordinates and detailed location info for dark history / true crime sites
- Overlapping stories: Ridgway (Green River Killer), Bundy, Cobain, BTK, Dahmer, and more
- OddStops blocks automated fetching (403) — must browse via Chrome
- **Plan:** Browse OddStops pages, extract coords/addresses/facts, add new moments to existing stories, verify coordinates
- Priority regions: Washington, Arizona, Texas
- Product question: how to accommodate OddStops-level detail within the atomic moment model (more moments per story? richer descriptions? LocationLinks to external sources?)

### P1 — Private Property / Access Labels (NEW)
- Currently handled ad-hoc in subtitles ("Private property — not open to the public")
- Formalize as a field: `accessLevel: 'public' | 'private' | 'restricted' | 'view-from-road'`
- UI badge showing access status
- Content guide amendment needed for Section 2.2 (Subtitles)

### P1 — Phoenix Place Entity Showing with Only 4 Moments
- `phoenix-az` entity (type: place) appears in "What's Here" but only has 4 linked moments
- City-level entities should either have ALL markers in that city, or not appear at all
- Consider: dedicated "Places" row on main page? Or filter out city entities with < N moments?

### P1 — Header Sizing (Entity/Story Names vs Moment Names)
- Story name and entity name should be larger than moment names inside them
- Currently same size — eyes don't know where the hierarchy starts
- CSS fix in StoryPanel/EntityPanel header elements

### P2 — Barry Goldwater Content Quality
- User not satisfied with Goldwater moments — consider hiding this timeline for now

### P1 — Clean Up Dead Regional Files
- `src/data/austin-barnes-content.ts`, `del-valle-content.ts`, `mesa-phoenix-content.ts`, `seattle-portorchard-content.ts`
- Content is now in main dump files. Regional files only referenced by ingest scripts.
- Can delete or archive after confirming ingest scripts aren't needed.

### P1 — App Load Speed
- Delay when clicking back from story/person to main page. User-reported.

### P1 — Encyclopedia People Tab
- Encyclopedia section needs a separate tab for People (currently mixed with stories).
- Story cards in encyclopedia section are too large — take up most of the bottomsheet.

### P2 — Previous Session Issues
- What's Here too few items when zoomed tight
- Category filter + empty people state
- Image lightbox for cropped heroes
- Places not discoverable on main (`storyType: 'place'` hidden)
- Gray markers not clickable (orphan moments)

## Architecture Notes
- **PKCE auth** — `flowType: 'pkce'` in supabase client config
- **Crosshair approach** — map `moveend` event → `getCenter()` → state
- **ntfy.sh notifications** — `pg_net` HTTP POST from DB trigger
- **Two edit modes** — Admin "Edit Location" (direct DB update) vs Community "Suggest"
- **Profile join workaround** — profiles fetched via batch `IN` query
- **Static data = Supabase dump** — flat arrays, no regional imports, `@ts-expect-error` for large arrays

## Files Changed Session 30
- `src/data/moments.ts` — REGENERATED from Supabase (2,583 moments, flat array)
- `src/data/stories.ts` — REGENERATED (628 stories)
- `src/data/entities.ts` — REGENERATED (588 entities)
- `src/data/collections.ts` — REGENERATED (30 collections)
- `src/lib/data/provider.tsx` — Skip coord override when `geoVerified=true`
- `src/components/ui/PinEditor.tsx` — Pass `suggestAccuracy` to RPC in admin save
- `supabase/migrations/011_fix_geo_rpc_accuracy.sql` — NEW: adds `p_accuracy` to RPC
- `scripts/reconcile/detailed-drift.ts` — NEW: field-level drift audit
- `scripts/reconcile/push-static-to-supabase.ts` — NEW: safe UPSERT push
- `scripts/sync-to-supabase.ts` — NEW: ongoing sync script
- `scripts/tag-orphans.ts` — NEW: automated orphan entity matching
- `scripts/dump-from-supabase.ts` — Updated: emits @ts-expect-error for large arrays

### NOT modified
- `src/App.tsx`
- `src/components/map/MapView.tsx`
- `src/components/map/EmergenceLayer.tsx`
- `src/index.css`
- Community verification tables (untouched)
- Supabase-only columns (notability, source, source_id, review_status — preserved)
