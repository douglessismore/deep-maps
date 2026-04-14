# Deep Maps — TODOs

> Tracked follow-up items from reviews and sessions. Not a backlog — these are specific, actionable items with context.

---

## TODO 0: Tune Notability v0.3 Surprise Factor Weights

**What:** The surprise factor scoring infrastructure is fully built (obscurity-significance gap, structure-gone bonus, type-mismatch bonus) and tracked in `scripts/output/notability-scores.json` as diagnostic signals. It's NOT in the composite formula yet — `WEIGHT_SURPRISE = 0.0`. Tune the weights and activate it.

**Why:** Current v0.2 formula (sitelinks×0.45 + pageviews×0.35 + crossRef×0.20) rewards fame, not discovery. Prototype v0.3 (surprise×0.15) over-penalized locally iconic stories (Yogurt Shop Murders dropped from 61→38) because it also reduced pageview weight. The core issue: sitelinks-heavy formulas crush stories with <10 language Wikipedias, even if they're locally iconic.

**Open questions:**
- Should there be a "local significance floor" for moments with high pageviews but low sitelinks?
- Should cross-ref weight go back up (to 20%) when surprise is activated?
- Is the structure-gone keyword list comprehensive enough?
- Should surprise replace some sitelinks weight instead of pageviews?

**Effort:** human: ~2hrs deliberation / CC: ~5min to change constants and re-run

**How to activate:** In `scripts/score-moments.ts`, change `WEIGHT_SURPRISE` from 0.0 to desired weight, rebalance other weights to sum to 1.0, run `npx tsx scripts/score-moments.ts && npx tsx scripts/apply-scores.ts`.

**Files:** `scripts/score-moments.ts` (formula + `computeSurpriseScore` function), `scripts/output/notability-scores.json` (surprise signals already computed for all 2,679 moments)

**Source:** Session 34 (2026-04-11), user review of v0.3 prototype results.

---

## TODO 0b: Downgrade Minor Austin Entity Figures

**What:** Remove or lower visibility for minor person entities that clutter the people card browse: James Motheral, Joe Stack, Robert J. Townes, James O. Rice, Guiton Morgan. Keep moments, remove entityIds from moments so they don't show as Dive Deeper chips, then delete the entities.

**Why:** These are minor local figures where the story is interesting but the person isn't. Users care about the Motheral land scandal, not James Motheral as a person. Entity browse threshold (35) in ExplorePanel handles some of this, but these entities should also lose their Dive Deeper pill visibility.

**Effort:** human: ~10min / CC: ~5min

**Context:** Entity browse threshold of 35 was added to ExplorePanel.tsx (Session 34). Entities below threshold are hidden from people cards but still show as Dive Deeper pills. For these specific figures, we want to go further — remove the pill too.

**Source:** User feedback, Session 34.

---

## TODO 0c: Review Austin Content Bird's Eye View

**What:** A full Austin content audit report was generated at `austin-content-audit.txt` (1,908 lines). 279 Austin moments, 48 stories, 49 orphans. Several issues identified but not yet acted on:
- O. Henry has TWO stories (`o-henry-life` + `o-henry-biography`) with heavily overlapping moments
- Janis Joplin, Michael Dell, Willie Nelson also have duplicate story pairs
- McKinney Falls has 11 moments (possible filler)
- John Henry Faulk has 9 moments (possible filler for a regional figure)
- 49 orphaned Austin moments need homes (many are freedmen's community moments)

**Effort:** human: ~1hr review / CC: ~30min to execute cuts

**Source:** Session 34 content review.

---

## TODO 1: Wire 845 Orphan Moments to Entities and Stories

**What:** Run a batch script to link orphan moments (no `moment_entities` rows) to their correct entities, and unlinked moments (no `story_moments` rows) to their correct stories.

**Why:** Orphan moments are invisible in entity panels — content exists in Supabase but users can't discover it through entity or story navigation. 845 moments with no entity links + 1062 moments with no story links = significant content that's effectively hidden.

**Effort:** human: ~1 day / CC: ~30min

**Context:** These are pre-existing content quality issues from the LLM ingestion pipeline, not bugs from the content-type enforcement refactor. The `fix-orphan-biographies.ts` script (Session 2, 2026-03-25) fixed 48 orphan entities — a similar approach works for moments. Check `moment_entities` and `story_moments` join tables. Use entity name matching + coordinate proximity to auto-wire, with manual review for ambiguous cases.

**Depends on:** Nothing — independent of content-type enforcement PR.

**Source:** Eng review 2026-03-25, content validation results (Session 3).

---

## TODO 2: Add Validator Checks for Content Type Boundaries

**What:** Add two checks to `scripts/validate-data.ts`: (1) flag biography stories not claimed by any entity's `canonicalStoryId`, (2) flag stories with `storyType='place'` that should be place entities instead.

**Why:** The runtime whitelist filter (from the content-type enforcement PR) hides bad data, but the validator should catch it at commit time before it enters the system. Defense in depth.

**Effort:** human: ~2hrs / CC: ~10min

**Context:** The pre-commit validator currently checks ID uniqueness, entity references, temporal impossibility, and coordinate sanity — but NOT content type boundary violations. After the whitelist filter ships, these checks become documentation of the invariants the filter enforces. File: `scripts/validate-data.ts`.

**Depends on:** Content-type enforcement PR should ship first (establishes the whitelist invariant).

**Source:** Eng review 2026-03-25.
