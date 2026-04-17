# Deep Maps — Session Handoff

**Last updated:** 2026-04-17 (Session 37 — Geo-verified coord protection, NYC ingestion, audio DNS proxy fix)
**Branch:** `main`
**Latest commit:** `b574e5b` — Proxy audio through Vercel to eliminate DNS dependency on supabase.co
**Uncommitted changes:** Only generated artifacts (scripts/output/notability-scores.*) + untracked staging/scripts
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** https://deepmaps.app

---

## Session 37 — 2026-04-17

### 1. Audio playback broken by DNS — FIXED (P0)
- **Symptom:** Audio silently failed on hotel Wi-Fi — UI showed pause icon as if playing, but no sound
- **Root cause:** Audio URLs hardcoded to `fhxyaoaaeztrycfoppeu.supabase.co`. When user's DNS resolver can't resolve supabase.co (hotel/airport Wi-Fi, flaky ISPs), Audio element silently fails to load. No error surfaced because the `play()` call resolves even when the source never loaded.
- **Not caused by any recent change** — latent single-point-of-failure all along.
- **Fix:** Vercel rewrite + client-side URL translation
  - `vercel.json`: `/audio/:filename` → `https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/moment-audio/:filename`
  - `audioPlayer.ts`: `proxyAudioUrl()` helper translates stored Supabase URLs to `/audio/*` at playback time
  - No data migration needed — static `audioUrl` values stay as full Supabase URLs, client rewrites them transparently
- **Impact:** If site loads, audio loads. DNS-resilient on any network.
- **Reversible:** Remove the rewrite + helper function.

### 2. Geo-verified coord overwrite bug — FIXED (P0)
- **Root cause:** Old `sync-to-supabase.ts` always wrote `location` column regardless of `geo_verified` flag. Admin edits from mobile admin UI were correctly saved to Supabase (via `update_moment_location` RPC, which sets `geo_verified=true`), but the next sync would overwrite them with stale static file coords.
- **Impact:** All 452 admin-verified coord edits in Supabase were overwritten by subsequent syncs. The coord values themselves are lost (static file values now = Supabase values). Can only be recovered by re-verification.
- **Fix (three layers of protection):**
  1. **Sync script:** Queries `geo_verified=true` moment IDs before upsert; app-level check documented
  2. **DB trigger (migration 016):** `BEFORE UPDATE` trigger silently preserves `location` when `geo_verified=true` and `geo_verified_at` isn't being updated. Belt-and-suspenders.
  3. **`--pull-verified` flag:** Dumps Supabase-verified coords back into `moments.ts` as backup
- **Migration to run manually in Supabase SQL Editor:** `supabase/migrations/016_protect_verified_coords.sql` — USER CONFIRMED ALREADY RAN IT
- **Follow-up:** User has ~100 recent verifications (Apr 8-14) in Austin/Mesa/Seattle that need re-verification. All 452 verified moments had `updated_at > geo_verified_at` confirming they were all overwritten at some point.

### 3. NYC / Tribeca content ingestion (21 new moments)
User staying at AMTD Idea Tribeca Hotel — ingested content within walking distance.

**From OddStops (11 dark-history moments):**
- `etan-patz-disappearance-1979` — SoHo bodega, 448 W Broadway
- `bobby-driscoll-found-dead-1968` — East Village tenement, 371 E 10th St
- `rifkin-bresciani-murder-1993` — Parking lot, 210 South St
- `ghostbusters-firehouse-tribeca` — Hook & Ladder 8, 14 N Moore St (right next to hotel)
- `naudet-films-first-plane-9-11` — Church & Lispenard, only known footage of Flight 11 impact
- `heath-ledger-death-soho-2008` — 421 Broome St
- `sid-vicious-overdose-greenwich-1979` — 63 Bank St
- `groovy-murders-east-village-1967` — 169 Ave B
- `marilyn-monroe-subway-grate-1954` — Lex & 52nd (reshot on Hollywood soundstage)
- `nyc-napoli-e-notte-cafe` — 165 Thompson St, Genovese hangout
- `nyc-toyland-social-club` — 94 Hester St, Gambino hangout

**Cultural/arts (10 moments):**
- `jane-jacobs-defeats-lomex-1969` — the meta-moment that saved SoHo from a 10-lane highway
- `judd-buys-101-spring-street-1968` — Donald Judd's permanent installation
- `basquiat-studio-great-jones-1983` — Warhol's building, Basquiat's final years
- `haring-pop-shop-lafayette-1986` — painted ceiling now at N-YHS
- `soho-gallery-explosion-420-broadway-1971` — Castelli + ex-wife Sonnabend same building
- `haughwout-building-first-elevator-1857` — Otis's first passenger elevator, enabled skyscrapers
- `bowie-soho-apartment-1999` — chocolate factory, 17 years unbothered
- `tribeca-film-festival-founded-2002` — De Niro's post-9/11 recovery effort
- `ear-inn-oldest-bar-manhattan-1817` — painted out the "B" to say "EAR"
- `city-hall-station-abandoned-1945` — stay on the 6 train past Brooklyn Bridge to see it

**Wiring:**
- Mafia moments → `nyc-mafia-sites` collection + `nyc-five-families` story
- Dark/crime + cultural → `nyc-hidden-history` collection (now 18 moments)
- Naudet 9/11 → `september-11-attacks` story
- New collection: `soho-art-district-that-almost-wasnt` (15 moments)

### 4. Settler-on-indigenous content (balance fix)
User noted existing Texas content only showed indigenous-attacks-settlers side (Wilbarger, Webster, Simpson). Added:
- `tonkawa-forced-removal-shoal-creek-1855` — Austin downtown; allies who were expelled after protecting the capital
- `battle-brushy-creek-1839` — Burleson attacks Comanche camp months before Austin's founding

**Not yet added** (researched but skipped — geographically distant from Austin core):
- Council House Fight (San Antonio, 1840)
- Battle of Plum Creek (Lockhart, 1840)
- Battle of the Neches (East TX, 1839)
- Dove Creek (Tom Green County, 1865)
- Brazos Reserve Removal (Graham, 1859)

New entities: `tonkawa-nation`, `edward-burleson`. Tonkawa camp moment updated to reference the new entity.

### 5. TTS rewritten for two-clip pipeline
- `scripts/generate-tts.ts` now generates title + 0.75s silence + body WAV → single MP3 at 192kbps
- Uses fable voice + noir narrator instructions + "male narrator, never change voice"
- Requires ffmpeg on PATH; errors clearly if missing
- Test moment `annihilator-mollie-smith.mp3` generated; user approved voice/pacing
- **Batch generation of remaining 132 moments NOT YET RUN** — only 5 Josiah + 1 test so far

### 6. Sources column added
- `sources?: string[]` field on Moment type
- Migration 015: `ALTER TABLE moments ADD COLUMN sources TEXT[]`
- Sync script updated to write sources
- Used by new indigenous + NYC moments for citation tracking

### 7. Verified content coords against OddStops
- Ted Bundy: 5 matching moments, all exact match ✅
- Gary Ridgway: 1 matching moment (his house), exact match ✅

---

---

## What Changed This Session

### 1. TTS Voice Selection (DECIDED)
- **Final choice: Fable voice + noir narrator instructions** for all audio
- Tested ballad+haunted-local, fable+noir-narrator, and multiple instruction variants
- Using `gpt-4o-mini-tts` model (supports `instructions` parameter for voice personality)
- Key instruction: includes "You are a male narrator. Never change your voice to match characters" to prevent TTS switching to female voice for female subjects
- Test files at `/tmp/deepmaps-voice-*.wav`

### 2. Audio Pipeline Architecture (DECIDED, NOT YET IMPLEMENTED)
- **Old approach:** Single clip from `narrativeContext` field — rejected due to hallucination risk (LLM-generated narrativeContext had invented details)
- **New approach:** Title + 0.75s silence + Description — uses only existing verified data fields
- **Pipeline:** Generate title and body as separate TTS calls (WAV format) → trim silence with ffmpeg (-40dB threshold, 0.1s padding) → stitch with 0.75s silence gap → single MP3 encode at 192kbps
- **Critical:** Must generate as WAV throughout pipeline, single lossy encode at the end. Multiple MP3 re-encodings cause audible quality degradation
- **Status:** `generate-tts.ts` still uses OLD single-clip narrativeContext approach. Needs rewrite for two-clip pipeline. Only 5 Josiah moments were generated with new structure manually.

### 3. Content Changes
**Removed:**
- `tonkawa-artifacts-travis-peak-1840s` — fabricated moment (coords wrong by 14 miles, no published archaeological evidence, conflated several real facts into one fake location)

**Added (8 new moments):**
- `jetta-court-site-41tv151` — 1968 UT salvage archaeology, Walnut Creek
- `millican-bench-41tv163` — First federally mandated archaeological dig in TX, Loop 360
- `comanche-peak-lake-travis` — Penateka Comanche observation post, The Oasis area
- `simpson-children-abduction-1844` — Comanche abduction near Shoal Creek
- `defeat-hollow-comanche-skirmish` — Last Comanche skirmish in Travis County
- `santa-monica-springs-campground` — Comanche-Tonkawa campground, River Place area
- `camino-real-montopolis-crossing` — Spanish colonial river crossing
- `chisholm-trail-congress-ave-crossing` — Cattle drive crossing at Congress Ave Bridge
- Sources: Travis County Historical Commission PDF, Reddit r/Austin, published archaeological reports

**Fixed:**
- `wilbarger-monument-erected-1927`: coords moved from Bartholomew Park (30.3039, -97.6990) to Fairview Cemetery Bastrop (30.1156, -97.3058), accuracy 'exact' → 'approximate', description rewritten with full relocation history
- `wilbarger-rescue-hornsby-dream-1832`: "fifty Indians" → "fifty Comanche warriors"
- All 8 new moments passed validator (descriptions ≤500 chars, correct enums, addresses added)

**New collection:**
- `before-austin-indigenous-central-texas` ("Before Austin: Indigenous Sites of Central Texas") — 12 moments

**Collection cleanup (5 fixes):**
- Added `scholz-opening-1866` to `german-texan-austin`
- Removed `mccallum-house-suffrage-1920s` from `austin-civil-rights-trail` (suffrage ≠ Jim Crow)
- Removed `oakwood-cemetery-founded-1839` and `paramount-majestic-opening` from `haunted-austin` (not haunted)
- Removed `hamilton-pool-cultural-remains` from `austin-natural-swimming` (not a swimming moment)
- Removed Camino Real + Chisholm Trail from `indigenous-peoples-resistance-and-survival` (trade/cattle routes ≠ indigenous resistance)

**Renamed:**
- `hidden-beneath-austin` → "Hidden Beneath the Austin Area" (accommodates Georgetown cave moment)

### 4. Type System
- Added `sources?: string[]` to Moment interface in `types/index.ts`
- New moments use it (e.g., `sources: ['Bulletin of the Texas Archeological Society, Volume 47, 1976']`)
- **Supabase does NOT have a `sources` column yet** — needs migration

### 5. CLAUDE.md Updates
- Added "Content Validation (MANDATORY)" section enforcing `/deep-maps-validator` before Supabase sync

### 6. ROADMAP.md Updates
- Added "Interactive Deep Dive Audio (Phase B)" section — on-demand LLM narration from verified sources + post-narration Q&A (NotebookLM-inspired)
- Updated audio narration checklist with completed items

---

## CRITICAL BUG: Sync Script Overwrites User-Verified Coordinates

**Root cause found:** `scripts/sync-to-supabase.ts` line 148 ALWAYS overwrites `location` from static file coords. The `geo_verified` flag on line 160 is only WRITTEN (static → Supabase), never READ to protect Supabase coords from being clobbered.

**Impact:** When Doug verifies pin locations via Supabase admin UI, the next `sync-to-supabase.ts` run overwrites those verified coords with stale static file coords.

**Fix needed:** Before upserting a moment, check if Supabase has `geo_verified=true` for that moment. If yes, skip the `location` field in the upsert (or pull verified coords from Supabase into static file first).

**Recommended approach:**
1. Query all `geo_verified=true` moments from Supabase before the sync loop
2. For those moments, omit `location` from the upsert payload
3. Optionally, dump verified coords back into static file so they stay in sync

**Current state:** All 5 Wilbarger moments now have matching coords between static and Supabase (verified this session). But the underlying bug remains — any future manual coord edit in Supabase will be overwritten on next sync.

---

## Uncommitted Work (11 modified + many untracked)

### Modified files:
| File | What changed |
|------|-------------|
| `CLAUDE.md` | Added mandatory validator section |
| `ROADMAP.md` | Added Phase B audio concept, updated checklist |
| `TODOS.md` | New items |
| `scripts/generate-tts.ts` | Voice: fable, instructions: noir narrator |
| `scripts/test-voice.ts` | Voice: fable, instructions: midnight voice memo |
| `scripts/score-moments.ts` | Scoring changes |
| `scripts/output/notability-scores.json` | Re-scored (large diff) |
| `scripts/output/notability-scores.md` | Re-scored |
| `src/data/collections.ts` | New collection + cleanup fixes |
| `src/data/moments.ts` | 8 new moments, 1 removed, 2 fixed |
| `src/types/index.ts` | Added `sources?: string[]` |

### Key untracked files (not all need committing):
- `CONTENT-SOURCES.md` — reference doc
- `scripts/output/audio/` — generated audio files (should NOT be committed)
- `supabase/migrations/012_narrative_context.sql` — pending migration
- Various staging scripts and data files

---

## Pending Work (ordered by priority)

### P1: Re-verify lost coord edits (~100 recent)
- All 452 admin-verified moments had their coords overwritten by old sync. Zero-drift means static file values replaced the verified values.
- Recent verification sessions likely to be fresh in user's memory:
  - Apr 14: 9 moments (Del Valle, Wilbarger, Armadillo)
  - Apr 13: 25 moments (Boeing, Seattle, Phoenix/Mesa, Miranda, Hohokam, Falcon Field)
  - Apr 8: 66 moments (COTA, Lost Dutchman, Seattle, NYC Mafia, Bundy, etc.)
- The old values are GONE — can't recover from DB history (we overwrote them via sync). Only path is re-verification.
- DB trigger (migration 016) now prevents this recurring.

### P1: Regenerate all audio with new two-clip pipeline
- `generate-tts.ts` rewrite DONE (title + 0.75s silence + body → 192kbps MP3)
- Only 5 Josiah + 1 test (annihilator-mollie-smith) done so far
- 132 other moments still have old narrativeContext-based audio
- Run: `OPENAI_API_KEY=... npx tsx scripts/generate-tts.ts`  (all moments) or `--moment <id>` for one
- Then upload via `scripts/upload-audio.ts`

### P2: "What's Here" should include collections + "Top" sort pill
- User request: mix collections into "What's Here" proximity view
- Add "Top" sort option that orders by notability within map view
- SEPARATE SESSION — touches scroll/marker highlight system that has had subtle bugs before (see Arrow FlyTo lessons in CLAUDE.md)

### P2: 5 statewide Texas settler-on-indigenous moments
- Researched but skipped — too geographically distant from Austin core
- Council House Fight 1840 (San Antonio), Battle of Plum Creek 1840 (Lockhart), Battle of the Neches 1839 (East TX, killed Chief Bowles), Dove Creek 1865 (Tom Green County — Confederates vs Kickapoo), Brazos Reserve Removal 1859 (Young County)
- Could be a "Texas Settler Violence Against Indigenous Peoples" statewide collection if/when added

### P2: Stripe Payment Link
- Waiting on Stripe account verification
- Update `STRIPE_PAYMENT_LINK` constant in AudioGateModal.tsx when ready

### P2: Thin collections need content
- `austin-natural-swimming` (3 moments)
- `german-texan-austin` (5 moments)

### P3: Architecture — collapse static vs Supabase duality
- Current model loads static first (instant), then upgrades from Supabase in background
- Failure modes are hidden: if Supabase unreachable, app "works" from static but silently stale
- Audio URLs were a case of this: they pointed at Supabase with no fallback, broke on DNS failure
- Patched with Vercel proxy, but the fundamental duality remains. Consider consolidating or making failures visible.
- Keep static fallback for speed — user confirmed that's why it was built this way.

---

## Key Decisions (and WHY)

### Session 37
- **Proxy audio through Vercel rewrite vs. migrating to new CDN:** Lowest-risk fix. One-line Vercel config + 3-line client helper. No data migration needed. If site loads, audio loads. Reversible.
- **DB trigger for geo_verified protection:** Belt-and-suspenders. Even if a future script forgets the check, the DB itself blocks overwrites. Chose `NEW.location := OLD.location` silent preserve (vs raising an error) so syncs don't fail noisily.
- **Keep both static and Supabase sources:** User confirmed static was added for load speed. Not touching that architecture — just making audio resilient.
- **Always include `location` in upsert payload (relying on trigger):** Tried omitting `location` for verified moments but hit NOT NULL constraint on upsert. Including it everywhere + trusting the trigger is simpler and satisfies Postgres constraints.
- **Re-verify lost coords manually vs attempt recovery:** The old values aren't recoverable — Supabase only stores current state, no history of what coords used to be. Accept the loss, re-verify.
- **Add Tonkawa removal + Brushy Creek but skip farther statewide moments:** User requested density within walking distance of Austin hotel. Council House Fight et al. are great but geographically distant — future "Texas statewide" collection.

### Session 36
- **Fable voice over ballad/alloy/ash:** Best balance of cinematic tone and natural delivery. Ballad was too intense for non-dark-history. Ash sounded generic.
- **Title+description over narrativeContext for audio:** narrativeContext is LLM-generated with no source constraints, causing invented details in audio. Title+description are human-verified data.
- **0.75s pause between title and description:** Tested 0.4s (too short), 0.8s (too long), 1.0s (way too long). 0.75s felt right after trimming baked-in silence from TTS clips.
- **WAV throughout pipeline:** Multiple MP3 re-encodings cause audible hiss/quality degradation. Single lossy encode at the end.
- **Travis Peak removed entirely:** Verified via multi-source research — fabricated location conflating several real facts. Better to have no moment than a wrong one.
- **"Before Austin" collection name:** User rejected "Comanche Territory" because it would need parallel Tonkawa/Apache collections. Broader "Indigenous Sites of Central Texas" covers all tribes.

---

## Architecture Reference

### Sync flow: Static → Supabase
```
moments.ts → sync-to-supabase.ts → Supabase (UPSERT)
                                  → moment_entities (DELETE stale + INSERT)
                                  → collection_moments (DELETE stale + INSERT)
```
The sync script DELETES stale join table rows (fixed in Session 35). It does NOT delete moments themselves.

### Audio flow (current, needs update)
```
moments.ts (narrativeContext) → generate-tts.ts → OpenAI TTS API → MP3 → upload-audio.ts → Supabase Storage → audioUrl on moment
```

### Audio flow (target)
```
moments.ts (name + description) → generate-tts-v2.ts → OpenAI TTS (WAV, 2 clips) → ffmpeg trim+stitch → MP3 → upload → Supabase Storage
```

### Env var gotcha
- `.env.local` has `VITE_SUPABASE_URL` (for Vite client) but scripts need `SUPABASE_URL` — the sync script hardcodes the URL, other scripts may not
- `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local` but `source .env.local` doesn't always propagate to child processes. Use: `export $(grep -v '^#' .env.local | xargs)` instead.

---

## Files Reference

- `scripts/generate-tts.ts` — Current TTS script (needs rewrite for v2 pipeline)
- `scripts/test-voice.ts` — Quick single-moment voice testing
- `scripts/sync-to-supabase.ts` — Static → Supabase sync (has geo_verified bug)
- `scripts/upload-audio.ts` — Upload MP3s to Supabase Storage + patch audioUrl
- `src/lib/audioPlayer.ts` — Singleton audio manager with 5-play gate
- `src/components/ui/AudioGateModal.tsx` — $2 Stripe payment modal
- `ROADMAP.md` — Full roadmap with Phase B audio concept

## Previous Session Context

See git log for Session 35 work (collections, sync fixes, audio MVP). See `ATTEMPTS.md` for Session 34 orphan click bug history. The plan file at `~/.claude/plans/zesty-scribbling-lovelace.md` describes the original audio MVP implementation (mostly complete, steps 1-6 done, steps 7-8 partially done).
