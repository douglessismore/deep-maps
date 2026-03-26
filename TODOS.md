# Deep Maps — TODOs

> Tracked follow-up items from reviews and sessions. Not a backlog — these are specific, actionable items with context.

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
