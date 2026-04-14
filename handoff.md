# Deep Maps — Session Handoff

**Last updated:** 2026-04-14 (Session 36 — Voice selection, audio pipeline, indigenous content, collection audit)
**Branch:** `main`
**Latest commit:** `3c1ea14` — Switch TTS to gpt-4o-mini-tts with Ash voice + true crime podcaster instructions
**Uncommitted changes:** 11 modified files + many untracked (see "Uncommitted Work" below)
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** https://deepmaps.app

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

### P0: Fix sync-to-supabase.ts geo_verified protection
See "CRITICAL BUG" section above. Must fix before any more content syncs.

### P1: Regenerate all audio with new pipeline
- `generate-tts.ts` needs rewrite for two-clip title+description pipeline with ffmpeg stitching
- Only 5 Josiah moments done with new structure; 132 others still have old narrativeContext-based audio
- Pipeline spec: WAV generation → ffmpeg silence trim (-40dB, 0.1s pad) → 0.75s gap → WAV stitch → single MP3 encode at 192kbps
- Voice: fable, instructions: noir narrator + "male narrator, never change voice"

### P1: Supabase migration for `sources` column
- `sources?: string[]` exists in TypeScript type but not in Supabase table
- Need: `ALTER TABLE moments ADD COLUMN sources TEXT[];`
- Sync script needs update to write sources

### P1: Commit uncommitted changes
- 11 modified files with significant content + tooling changes
- Should commit before more work piles up

### P2: Stripe Payment Link
- Waiting on Stripe account verification
- Update `STRIPE_PAYMENT_LINK` constant in AudioGateModal.tsx when ready

### P2: Thin collections need content
- `austin-natural-swimming` (3 moments)
- `german-texan-austin` (5 moments)

---

## Key Decisions (and WHY)

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
