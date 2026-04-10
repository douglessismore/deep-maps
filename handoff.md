# Deep Maps — Session Handoff

**Last updated:** 2026-04-10 (Session 33 continued — Orphan click fixes finalized)
**Branch:** `main`
**Latest commit:** `d9894a7` — "Block ExplorePanel scroll handler during pin-click pans (Theory E fix)"
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** https://deepmaps.app

## Current State

### What shipped this session (7 commits: `ac7d7fa` → ... → `d9894a7`)

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

## Content Pipeline — Pending Work

Ordered by priority/effort:

1. **Process 39 dupe pairs** — 3 flagged false positives, 36 likely real dupes. Script: `scripts/dedupe-moments.ts`.
2. **Process 98 absorbs** — highest-value content work. Script: `scripts/absorb-orphans-to-bios.ts`.
3. **Run HMDB net-new analysis** — surface ~50–100 notable markers we're missing. Script: `scripts/staging/analyze-hmdb.ts`.
4. **Tackle 284 fully-isolated orphans** — geographic clusters (Tokyo, Mexico City, Istanbul) need themed collections.
5. **Hanford plutonium orphan** → wire into Manhattan Project story.
6. **Michael Barnes test user setup** — make Barnes a test user, verify Austin content.

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
