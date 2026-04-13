# Deep Maps — Session Handoff

**Last updated:** 2026-04-13 (Session 35 continued — Collections, sync fixes, content sprint)
**Branch:** `main`
**Latest commit:** `1364ab7` — Enum fixes + card height fix
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** https://deepmaps.app

## Current State

### What shipped this session (Session 35, 2026-04-12)

**Monetization Strategy (Office Hours)**
- Ran /office-hours in startup mode. Approved design doc: `~/.gstack/projects/douglessismore-deep-maps/sirdouglas-main-design-20260411-223526.md`
- **Plan: Phase A ($2 audio test) then Phase B (freemium $20/yr)**
- Key finding: Le Walk ($4.1M seed), Odisea (free AI audio), Herodot are all doing AI audio tours. "AI audio" is table stakes. Deep Maps differentiates on entity graph + hyper-precise coordinates + content depth.
- Tours are NOT a separate data type — collections become tours when user is physically there.

**Audio Playback MVP — SHIPPED AND LIVE**
- `audioUrl` field on Moment type
- `audioPlayer.ts`: singleton HTML5 audio manager, one-at-a-time playback, localStorage gate (5 free plays, then $2 paywall), Plausible event tracking
- `AudioGateModal`: $2 Stripe Payment Link + email waitlist capture
- `/audio-unlocked` route: post-payment redirect sets localStorage unlock
- Play/pause button on LocationCard (compact + normal views)
- **118 moments with TTS audio** (OpenAI nova voice, 1.1x speed, $1.37 total API cost)
- TTS preprocessing: abbreviation expansion (W→West, St→Street, etc.)
- `generate-tts.ts`: batch TTS generation with rate limiting
- `upload-audio.ts`: Supabase Storage upload + audioUrl patching
- Audio badge (🎵 Audio) on homepage WhatsHereStoryCard, ExplorePanel StoryCard, and CollectionCard

**Bug Fix: Collection marker click scroll**
- Root cause: auto-scroll effect only fired on moments tab, but collection view uses collections tab with separate `cardRefs` map.
- Fix: Extended auto-scroll effect for collections tab.

**5 New Collections:**
1. **Servant Girl Annihilator Trail** (10 moments) — verified coords against Google My Maps KML source
2. **Austin Music History** (21 moments)
3. **Keep Austin Weird** (12 moments)
4. **Hidden Beneath Austin** (9 moments)
5. **Haunted Austin** (5 moments, thin — needs research)

**Content Sprint:**
- 118 moments with narrativeContext (Annihilator, Music, plus 87 from prior sessions)
- narrativeContext 5-part spec added to CLAUDE.md
- Validator Check 1.15 for narrativeContext quality

**Data Integrity Fixes:**
- Annihilator coords verified against KML source (6/7 within 20m, christmas-massacre fixed)
- Exact street addresses added from KML (302 East Cypress, 302 East Linden, 300 East Cedar, etc.)
- 3 false "exact" accuracy tags downgraded to general-area/approximate
- 446 geoVerified flags restored from Supabase (sync was clobbering them)
- Sync script fixed to not overwrite geo_verified=true with null
- Supabase `audio_url` column added, loader updated to read it
- Duplicate Boeing moment deleted (sea-boeing-red-barn)
- Duplicate Vietnam moratorium moment renamed
- Barry Goldwater hidden from frontend (entity links removed, notability below threshold)

### Key Decisions (and WHY)
- **Audio is the delivery medium, not the moat:** Le Walk/Odisea proved AI audio tours are table stakes.
- **Serendipitous mode is the north star, not the first feature.**
- **Collections, not tours:** Tours are a UI mode, not a data type.
- **Phase A before Phase B:** $2 audio test with strangers before building full freemium.
- **OpenAI TTS over ElevenLabs:** $0.35 for 31 moments vs $5+/month. ElevenLabs has better voice quality but OpenAI scales to all 2,679 moments for ~$30.
- **narrativeContext as standalone clips:** Each moment works standalone. "Killer was never caught" only in final Annihilator moment. Story intro on first moment only is a Phase B feature.

### Additional work (Day 2 of Session 35, 2026-04-13)

**New Collections Shipped:**
- **Haunted Austin** expanded from 5→12 moments (Tavern ghost Emily, Clay Pit typhoid child, Littlefield House attic screams, Governor's Mansion Sam Houston ghost, Buffalo Billiards Fox News ghost, Driskill Samantha)
- **Austin's Secret Missiles** (5 moments) — Nike Hercules sites on Bee Cave Rd + Cuernavaca Dr, Elroy launcher, Zilker Park fallout shelter, "Target Austin" propaganda film
- **Guy Town: Austin's Buried Red-Light District** (8 moments) — district formation, Iron Front Saloon gunfight, Caroline Robinson freedwoman property, Ben Thompson marshal, Annihilator connection, police containment, 10K-artifact archaeological dig, 1915 closure
- **Merged** "10,000 Years Under Austin" + "Hidden Beneath Austin" into single "Hidden Beneath Austin: 10,000 Years Under Your Feet" (12 moments)

**Sync Infrastructure Fixed:**
- Added `notability` column to Supabase entities table
- Sync script now DELETES stale rows from moment_entities, story_moments, collection_moments, related_stories (the "never deletes" problem that caused Barry Goldwater persistence)
- Supabase loader now reads entity notability (enables browse threshold on live site)
- Fixed enum mismatch: importance 'notable' → 'minor', kind 'era' → 'event' (caused 5 moments to fail sync)
- Deleted stale `ancient-austin` collection from Supabase after merge

**UI Fixes:**
- Admin users bypass audio gate (unlimited plays)
- Audio badge added to ALL card types (homepage story, homepage collection, homepage collection grid, ExplorePanel story, ExplorePanel collection)
- Collection card height increased from 100px→130px to fit title + subtitle + audio badge
- Overflow-hidden on collection cards to prevent audio badge bleed

**Content Fixes:**
- Deleted duplicate Boeing moment (sea-boeing-red-barn)
- 446 geoVerified flags restored from Supabase (sync was clobbering them)

### Next Steps (in order)
1. **Stripe Payment Link** — waiting on Stripe account verification. Update `STRIPE_PAYMENT_LINK` constant in AudioGateModal.tsx when ready.
2. **Test with strangers** — Reddit (r/Austin, r/TrueCrime) for demand signal + Del Valle neighborhood Facebook page (Sundays) + $5 screen recording offer (10 people)
3. **Share with Rob Reinold** — casual: "I couldn't help myself... deepmaps.app". Ask: "What's the first thing you'd change?"
4. **Share with Michael Barnes / history buffs** — show specific Austin story, ask "did we get this right?"
5. **Sync imageUrl from Supabase into static file** — 55 stories have images in Supabase but static file has 0. Images ARE uploaded and showing on live site, just not in static.
6. **Content expansion** — Shoal Creek Treasure Hunt, Prohibition Austin, Austin Punk (Raul's) collections from CONTENT-IDEAS.md
7. **Story intro audio** — Play story context overview on first moment only
8. **narrativeContext voice modes** — "you're standing" for walking tours, "you're passing" for driving tours

### Previous Session Context (Session 34)

All fixes target orphan moment pin click regressions. See `ATTEMPTS.md` for full attempt history with root causes A–E and theories A–E.

**Attempt 2 (`859d268`):** Rewrote `handleOrphanMomentClick` — calls `pushNav()` first, uses `scrollHighlight` as sole overlay, `arrowFlyLockRef` blocks scroll hijack.

**Attempt 3 (`a1f4ab0`):** Skip `bindTooltip` on touch (dupe label flash), clear `scrollHighlight` in back handlers (pin dim persistence), orientation-key guard on moveend.

**Attempt 4 (`e086daf`):** `locationSnapKey` counter bumped on every pin click → forces re-scroll. Diagnostic console logs added.

**Attempt 5 (`50c1728`):** Two root causes fixed:
- Card key separator bug: `no-story-${locationId}` parsed with `indexOf('-')` found dash in "no-story", not the delimiter. Changed separator to `::`. All orphan card lookups were silently failing.
- Label bleed: replaced left/right/bottom orientation logic with always-centered-below-dot (`translateX(-50%)`). Removed moveend reposition handler entirely. -72 lines, +21 lines.

**Attempt 6 (`d9894a7`):** Passed `arrowFlyLockRef` to ExplorePanel as `scrollLockRef`. Scroll-driven highlight handler now early-returns when lock is active, breaking the pan→scroll→highlight→pan feedback loop (Theory E). This was the last piece — user confirmed orphan clicks now work correctly.

### User verification: ALL orphan click bugs confirmed fixed on mobile

## Remaining Bugs (P0–P1)

### P0 — FOCUS.md bugs (will confuse testers)
- [ ] **Arrow click → label disappears instead of opening panel** — clicking a person label after arrow flyTo dismisses it. Root cause likely in EmergenceLayer click handler not threading `targetId`/`targetType` from arrow flyTo system.
- [ ] **Corner label when scrolling person moments** — label partially off-screen after clicking into a person. Stale scroll overlay or activeLocation overlay positioning.
- [ ] **Gray markers for wrong person after arrow click** — 3 purple markers appear that don't belong to the person. May be `getMomentsForEntity` returning wrong moments.

### P1 — Likely to hit in testing
- [ ] **Labels hiding their markers** — LBJ label covers the marker dot.
- [ ] **Downtown Austin shows only 3 moments** — `viewportLocations` may not update after flyTo. Bad look for Austin testers.
- [ ] **Pin visibility at zoom** — pins sometimes transparent/hard to see when zoomed in. When solid, they cover too much space at high zoom. Need zoom-aware sizing in EmergenceLayer.
- [ ] **App load speed** — delay when clicking back from story/person to main page.
- [ ] **Header sizing** — story/entity names should be larger than moment names.

### P1 — Tech debt
- [ ] **Dead regional files** — austin-barnes, del-valle, mesa-phoenix, seattle-portorchard are dead code.
- [ ] **Content staging pipeline** — filter-notable.ts, match-entities.ts, promote-batch.ts not yet built.
- [ ] **Magic link emails** — show "Supabase Auth" as sender.

## UX Ideas (parked, not this week)
- **Zoom-to-accuracy-radius on moment click** — When clicking a moment, zoom to the level that shows the accuracy circle (exact/approximate/general-area). User sees exactly how much of the map the moment covers. The accuracy circle UI already exists in the admin edit flow (pinpoint zoom → exact, zoom out → bigger circle). Extension: render the accuracy circle on the public map too, not just admin. Prerequisite: most moments don't have accurate circles placed yet — this gets more valuable as accuracy data improves. Differentiator: hyperspecific location accuracy is a unique Deep Maps value prop.
- **Map background click → back navigation** — clicking map (not marker) while in story/entity view acts like back button. Moderate risk due to mobile touch event ordering and pan-vs-tap ambiguity. Revisit after current fixes are battle-tested.

## Session 34 — What Shipped

### Content (Batch 5)
- **27 new moments** (was 37, cut 10 during review): Roosevelt 1905 Austin visit (5), Sweatt v. Painter (3), Shoal Creek landmarks (6), Clio Austin landmarks (5), Austin civil rights/protest/natural (8)
- **2 new stories:** Roosevelt Austin Visit, Sweatt v. Painter
- **4 new collections:** Along Shoal Creek (6 moments), German Austin (5), Austin Civil Rights Trail (7), Austin Natural Swimming (3)
- **5 new entities:** S.W.T. Lanham, George Armstrong Custer, Clara Driscoll, West Sixth Street Bridge, Heman Sweatt
- **Cross-wiring:** TR biography updated, Menger Hotel cross-linked, Custer wired to Little Bighorn + Mt. Bonnell, Clara Driscoll added to Alamo story, French Legation added to Archive War
- **Camp Mabry story trimmed** from 6 to 3 moments (cut land purchase filler)
- **Faulk "dirty theater" moment** softened for wider audiences
- **Stale Supabase join table rows** manually cleaned (28 collection_moments + 3 story_moments)

### Scoring Engine (v0.3 infrastructure)
- **Surprise factor computed** for all 2,679 moments (3 sub-signals: obscurity-significance gap, structure-gone bonus, type mismatch)
- **NOT activated in formula** — tracked as diagnostic in `notability-scores.json`. Weights need tuning (see TODOS.md TODO 0).
- **All 2,679 moments re-scored** with v0.2 weights and applied to `moments.ts`
- **Entity `notability?: number` field** added to Entity type in `types/index.ts`
- **Entity browse threshold** (35) added to ExplorePanel.tsx — hides D-tier entities from people card browse, keeps them as Dive Deeper pills

### Key Decisions (and WHY)
- **Surprise factor deferred:** Prototype v0.3 (surprise×0.15) over-penalized locally iconic stories (Yogurt Shop dropped 61→38). Root cause: sitelinks-heavy formulas crush <10-sitelink stories. Needs a "local significance floor" before activation.
- **Reverted to v0.2 weights:** sitelinks×0.45 + pageviews×0.35 + crossRef×0.20. Surprise data collected but weight=0.
- **Cut 10 moments in review:** Generic "building was built" moments (Seaholm, Pemberton castle, Bremond Block, Millett Opera), redundant pins (Roosevelt departure), misfit moments (Cactus Theatre, Waller Creek tree-sit, Lundberg bakery, Austin History Center).
- **Collection tightening:** Shoal Creek stripped to creek-adjacent only (19→6). German-Texan stripped to genuinely German (9→5). Civil Rights stripped to racial justice (9→7). Natural Swimming removed protest moment (3→2).

## Content Pipeline — Pending Work

Ordered by priority/effort:

0. **Tune notability v0.3 surprise weights** — see TODOS.md TODO 0. Infrastructure ready, just needs weight constants.
0b. **Downgrade minor Austin entities** — Motheral, Stack, Townes, Rice, Morgan. See TODOS.md TODO 0b.
0c. **Austin content audit** — report at `austin-content-audit.txt`. O. Henry/Joplin/Dell/Willie have duplicate stories. 49 Austin orphans. See TODOS.md TODO 0c.
1. **Process 39 dupe pairs** — 3 flagged false positives, 36 likely real dupes. Script: `scripts/dedupe-moments.ts`.
2. **Process 98 absorbs** — highest-value content work. Script: `scripts/absorb-orphans-to-bios.ts`.
3. **Run HMDB net-new analysis** — surface ~50–100 notable markers we're missing. Script: `scripts/staging/analyze-hmdb.ts`.
4. **Tackle 284 fully-isolated orphans** — geographic clusters (Tokyo, Mexico City, Istanbul) need themed collections.
5. **Hanford plutonium orphan** → wire into Manhattan Project story.
6. **Michael Barnes test user setup** — make Barnes a test user, verify Austin content.
7. **Dinosaur footprints collection** — user idea: every documented location with dinosaur tracks (Leander + broader). Needs research.
8. **Cemetery depth** — Oakwood Cemetery has a moment but could be a full story with notable burials wired to existing entities. Also Austin Memorial Park, Bagdad Cemetery.

**Always dump after bulk DB mutations:** `npx tsx scripts/dump-from-supabase.ts`

## Key Files

- `src/App.tsx` — all state, `handleOrphanMomentClick` (line ~738), `locationSnapKey`, `arrowFlyLockRef`
- `src/components/map/EmergenceLayer.tsx` — pin markers, scroll overlay (now always centered below dot)
- `src/components/panel/ExplorePanel.tsx` — auto-scroll effect (line ~580), scroll handler with `scrollLockRef` guard (line ~670), card key format is `storyId::locationId`
- `ATTEMPTS.md` — full attempt log with theories A–E, what worked, what didn't

## What NOT to Touch
- Arrow flyTo system (separate subsystem, see CLAUDE.md)
- `browseableStories` filtering (centralized in DataProvider)
- flyTo duration (deliberately slow)

## This Week's Focus (from FOCUS.md)
1. Fix bugs that will derail user testing (P0s above)
2. Watch 3 people use Deep Maps (10 min each, no helping)
3. Add Plausible analytics
4. Post first viral collection (Serial Killer Crime Scenes recommended)

## Next Session: Monetization / Tours (office-hours)
Separate chat running /office-hours to evaluate AI-guided audio tour monetization. Prompt prepared in Session 34. Key ideas: serendipitous mode (always-on AI guide activated by geolocation), AI deep-dive narrator (30s/1m/3m lengths), curated walking+driving tours, historical map overlays, haunted places category, freemium model. See project_tours_feature.md memory file for prior thinking.

## Previous Session Context
See `ATTEMPTS.md` for complete history. Session 32 was orphan cleanup (38 dupes deleted, 92 absorbed into bios). Session 31 was OddStops content enrichment + admin edit cache fix.

---

## Session 34 — Content Enrichment + narrativeContext (2026-04-10, separate chat)

**Uncommitted changes on `main`.** This session ran concurrently with Session 33's bug fixes.

### What changed (not yet committed)

**Wilbarger story fleshed out from 1 orphan moment → 5 wired moments:**
1. `wilbarger-scalping-1832` — Attack at Tannehill Branch Creek / Pecan Springs (REPLACED old `wilbarger-scalping-hornsby-1833` — date corrected from 1833 to 1832, coords improved from general-area to approximate)
2. `wilbarger-found-post-oak-1832` — Rescue site at 51st St & Old Manor Rd
3. `wilbarger-rescue-hornsby-dream-1832` — Sarah Hornsby's dream at Hornsby homestead
4. `wilbarger-monument-erected-1927` — 1927 granite monument (erected, moved 1985, removed ~2023)
5. `wilbarger-reinterred-state-cemetery` — Burial at Texas State Cemetery

**New entities:** `josiah-wilbarger`, `sarah-hornsby`
**New stories:** `josiah-wilbarger-biography`, `sarah-hornsby-biography`, `wilbarger-scalping` (incident)
**Source:** Reddit r/Austin post + *Republic of Austin* by Jeffrey Kerr + HMDB markers

**Type system: `narrativeContext` field added to Moment (`types/index.ts`)**
- Optional string, not rendered in UI — for future AI tour guide
- Written in user-facing-ready voice (no rewrite needed later)
- Emphasizes hyperspecific location details (what's physically there today)
- Supabase does NOT have `narrative_context` column yet

**Dev environment: `VITE_DATA_SOURCE=static` added to `.env.local`**
- Bypasses Supabase so new static-only content is visible locally
- **REMOVE after reconciliation sync**

**Staging cleanup:** Old moment in `austin-barnes-content.ts` replaced with migration comment

### User priorities for next session
1. **P0: Static/Supabase reconciliation** — user explicitly wants this NEXT. See memory `project_sync_reconciliation.md`.
2. Continue content enrichment (user will keep dropping story ideas)
3. Always invoke validator skill after ingesting content

### Content session notes
- Don't create new content docs — use existing `CONTENT-IDEAS.md`, `CONTENT-SOURCES.md`
- Sarah Hornsby entity: user questioned notability, kept for now (dream story hooks, passes strotability)
- Two images in `images/`: `Josiah-Wilbarger-1.jpg`, `scalping-josiah-wilbarger.png` (not uploaded to CDN)
- Validator passed: all field lengths in spec, foreign keys valid, physical presence rule passes
