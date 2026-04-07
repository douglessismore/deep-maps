# Deep Maps — Session Handoff

**Last updated:** 2026-04-07 (Session 30 — P0 Reconciliation + Orphan Tagging + Content Fixes)
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** https://deepmaps.app

## Current State
Session 30 resolved the P0 static/Supabase desync. Both sources are now perfectly synchronized:
- **2,583 moments** (was: 2,492 static / 2,543 Supabase)
- **628 stories** (was: 526 / 609)
- **588 entities** (was: 504 / 571)
- **30 collections** (was: 29 / 30)
- **1,931 entity links** — zero asymmetry (was: 196 static-only, 293 Supabase-only)
- **1,887 story_moments** — zero asymmetry (was: 68 static-only, 239 Supabase-only)

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
16. **RPC fix** — `update_moment_location` now accepts `p_accuracy TEXT` param, casts to `location_accuracy` enum. Migration `011_fix_geo_rpc_accuracy.sql` deployed to production.
17. **Provider coord override fix** — `provider.tsx` no longer overwrites Supabase coordinates when `geoVerified=true`. Admin-verified coords persist across app reloads.
18. **PinEditor accuracy pass-through** — admin save now sends `suggestAccuracy` to the RPC.

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

### P0 — Stray Marker / Wrong Position Bug
- **Yogurt Shop story** has marker #3 appearing disconnected from polyline, label bleeding off map edge.
- This is the P0 corner label bug from Sessions 25-27. Lives in MapView.tsx and EmergenceLayer.tsx.
- Session 27's marker nudge (`3213606`) may be making it worse.
- **Needs dedicated session** — constrained from modifying MapView.tsx/EmergenceLayer.tsx in current work.

### P0 — Verification Testing
- Full suggest → agree → verify flow not yet tested between two accounts on production.
- Magic link rate limit (~3-4/hour) blocking rapid testing. Wait and retry.
- Need to confirm: (a) session persists after magic link click, (b) suggestion appears in thread, (c) agree from second account verifies and updates moment.

### P1 — Email Customization
- Magic link emails show "Supabase Auth" as sender. Needs custom SMTP to change from-name.

### P1 — RapidVerify Upgrades
- POI-first sorting, notability weighting, crosshair picker, note box

### P1 — ~842 Orphan Moments (updated Session 30)
- Session 30 tagged 108 moments with 148 entity links (67.4% coverage, was 59.7%)
- Remaining 842 mostly need **new entities created**, not just wiring
- ~200 Mexican/Latin American moments → create entities
- ~150 filming locations → collections
- ~100 aviation disasters → collections
- ~300 world history → assess for entity wiring
- **Planned: entity resolution pipeline** using 2.29M people DB

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
