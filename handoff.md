# Deep Maps — Session Handoff

**Last updated:** 2026-03-19 (Session 55 — v3 content rewrite 96% complete, review page live)
**Branch:** `main`

---

## Current State

### Database
- **304 entities**, **293 stories**, **1,260 moments**, **219 images**, **30 collections**
- **~124/507** planned people fully imported (≥4 moments) — was 76 last session
- Pipeline offset: **152** (people 1-152 processed across runs 1-15)
- **V3 content rewrite in progress** — 1,260 moments being rewritten under new framework

### What Shipped (Session 54)

1. **Content framework v3** (`scripts/ingest/lib/content-guide-v3.md`)
   - Field role separation: Name = encyclopedic headline, Subtitle = place/visit annotation, Description = compact narrative
   - Names: verb-first, event-based, no editorial flourish (encyclopedic standard)
   - Subtitles: address, what remains today, what to look for if you visit (60-120 chars)
   - Descriptions: tighter 350-450 chars (down from 400-650), "here" anchoring, DD Month YYYY dates
   - Entity descriptions: consolidated (entity + story merge into one field, 200-350 chars)
   - Story names: codified by type (biography = canonical name, incident = factual event, era = encyclopedic)
   - Wikipedia naming rule: story names must roughly match a Wikipedia article title
   - Em-dash rule: max 1 per description, parenthetical only
   - Geo-accuracy: "prefer approximate over wrong exact"
   - Tour guide voice: "here" anchoring for future AR/VR, but no second-person

2. **Style comparison tool** (`style-comparison.html`)
   - 6 styles tested (Current, Place Leads, Blunt+Place, Grounded, Direct, Encyclopedic)
   - Framework B (Place Leads) selected by user
   - Then refined into the v3 field-role framework

3. **Story audit** (`story-audit.html`)
   - 293 stories catalogued with type badges, description previews, and flags
   - 55 flagged: 32 place→entity conversions, 6 redundant person merges, 3 bio tagline strips, 8 era renames, 1 wrong-type fix
   - Filterable by type, flag category, and search

4. **V3 dry run** (`v3-dryrun.html`)
   - 10 diverse moments rewritten under v3 — before/after comparison
   - User approved quality — proceeded to full rewrite

5. **Full v3 rewrite — 1,210/1,260 moments complete** (96%)
   - 25 of 26 batches done, batch 20 (50 moments) in final run
   - Output: `/tmp/v3-rewrite-{0-25}.json` files with old + new content
   - Merged file: `/tmp/v3-rewrite-merged.json` (1,210 moments)
   - Review page: `v3-review.html` (localhost:8896) — before/after comparison
   - **Validation results**: 84.5% under 500-char hard max (avg 451 chars), 188 slightly over (mostly 501-550), 0 em-dash violations
   - **Subtitle confidence**: 523 verified, 335 plausible, 102 uncertain, 250 missing (early batches)
   - Will NOT modify database until reviewed — JSON output only

6. **V3 review page** (`v3-review.html`)
   - Shows all 1,210 rewritten moments with old→new name and subtitle changes
   - Filterable: Name Changed, Subtitle Changed, Desc Over 500, Uncertain confidence
   - Searchable by keyword

### What Shipped (Session 52)

1. **Subagent pipeline adapter** (`scripts/ingest/notable-people-local.ts`)
   - Three-phase pipeline: prep → generate (subagents) → assemble
   - Eliminates Claude API costs — uses plan credits instead ($150-250 savings)
   - Phase 1 (prep): fetches Wikipedia, checks dedup, writes prompt JSON files
   - Phase 2 (generate): subagents read prompts, generate content, write outputs
   - Phase 3 (assemble): validates, searches Wikimedia Commons images, inserts to review queue
   - Wikipedia rate limiting fixed: retry logic + 2s delays + better User-Agent

2. **Content guide v2** (`scripts/ingest/lib/content-guide-prompt.ts`)
   - Expert council audit (6 specialists: Pulitzer historian, NYT editor, narrative nonfiction, data journalism, museum curator, AI ethics)
   - 8 high-value changes adopted:
     - "So What?" test for subtitles (5 patterns: ironic reversal, foreshadowing, human detail, scale shift, dramatic contrast)
     - Sense-of-place rule: every description MUST include physical/sensory detail about the location
     - Specificity Rule: replace vague significance claims with specific facts (replaces banned-phrases approach)
     - Description opening variety: 5 patterns, at least 3 different per person
     - Attribution rule: preserve Wikipedia hedging for uncertain claims
     - DD Month YYYY date format standard
     - Tightened description length: STRICTLY 400-650 chars with rejection warning
     - 4 new failure patterns added (6-9)

3. **burial_site FK constraint fixed**
   - Added `burial_site` row to `moment_types` table
   - Unblocked 11+ moments that had been failing across runs

4. **Pipeline runs 14-15** — 48 people (offsets 103-152)
   - 229 moments, 46 stories, 40 entities, 7 images published
   - 0 validation errors
   - Key people: Molière, Bismarck, Linnaeus, Nietzsche, FDR, Disney, Franklin, Marie Curie, Elizabeth II, William the Conqueror, Marcus Aurelius, Nostradamus, etc.

### What Shipped (Session 53)

1. **V2 content guide prompt tightened** — added explicit "pipeline rejects over 650" warning
   - Retest results: 16/17 descriptions compliant (94%), vs 0/14 before tightening
   - Average description length ~590 chars (was ~760 in first v2 test)
   - Quality preserved: sense of place, opening variety, strong endings all intact

2. **True before/after comparison** — regenerated Einstein through v2 guide
   - Same person, old vs new: dramatically more sense of place in openings
   - Temporarily swapped in DB for live preview, then reverted

3. **GPT editorial audit reviewed** — feedback evaluated:
   - "No variability in depth" — valid future concern, not a content guide change
   - "Notability implicit" — incorrect, we have explicit notability scoring
   - "No connection structure" — incorrect, we have relatedStoryIds, entityIds, story_moments
   - Conclusion: no content guide changes needed from GPT feedback

4. **Batches 103+125 assembled and published** — 229 new moments (runs 14-15)

### Known Issues
- **Notable sort in app may be off** — user reported Einstein appearing low in notable sort. Needs investigation.
- **Search UX** — searching "Einstein" on Moments tab shows no results (search may only match story names, not moment text or entity names). Needs investigation.
- **V2 live swap broke moment visibility** — when Einstein moments were temporarily updated with v2 content, only 1 moment appeared. Likely cause: the v2 generated a Nobel Prize moment that replaced the "flees Germany" moment by position, but the ID stayed as `einstein-flees-germany-princeton-1933`, potentially breaking joins or filters. The consistency pass script must handle this properly — update content in-place without changing IDs or creating mismatches.
- **3 description-too-long items** — Marx, Bach moments need descriptions trimmed
- **Gautama Buddha** Wikipedia lookup failed (article name mismatch)
- **Louis XIV** Wikipedia slug failure (comma in slug)
- **209 moments** with no entity links (pre-existing editorial debt)
- **~15 moments with noun-phrase names** still need rewrites
- **3 moments with `milestone` type_id** — cosmetic (it's a `kind`, not a `type`)
- **Browser caching** — Python HTTP server aggressively caches; use Cmd+Shift+R
- **Bottom card rounded corners** — Intermittent UI issue where dragging the bottom card section up shows rounded corners on the black card part. Not reproducible on demand. Likely border-radius not switching to 0 at full-height. Need screenshot to debug.

---

## Key Decisions Made

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Pipeline architecture | Subagent-based generation (plan credits) | API-only pipeline | Eliminates $150-250 API cost, same quality, subagents isolate context |
| Content guide improvement | Specificity Rule (positive instruction) | Banned-phrases list | Tim Urban principle — tell writers what TO do, not what NOT to do |
| Sense-of-place rule | Required in every description | Optional/nice-to-have | App's core differentiator is WHERE things happened |
| Description length enforcement | Tightened to 450-550 target, 650 hard max with rejection | Relaxed limits to accommodate richer content | Forces better writing; pipeline can enforce |
| Entity tab design | All 5 tabs now | Progressive (people-only first) | User wanted full entity-type awareness immediately |
| City/place scoring | Curate seed cities by gut, build scoring later | Build scoring system first | Not enough data yet |
| Content framework v3 | Field-role separation (name=what, subtitle=where, desc=story) | V2 literary style, blunt telegram style | User found v2 too stylized; Framework B selected after 6-style comparison |
| Subtitle purpose | Place/visit annotation (address, what remains) | Editorial hook ("where a refusal changed America") | Core differentiator — tells you what to look for if you visit |
| Description length v3 | 350-450 chars, 500 hard max | 400-650 from v2 | Mobile vertical space constraints; brevity forces better writing |
| Story naming | Wikipedia article title rule | Editorial names ("Paris Under Fire") | Kills ~20 editorial names; encyclopedic standard is clearer |
| Eras approach | Keep for now, revisit later | New story types (journeys, rivalries) | User not sold on new types; eras are tricky but functional |
| Places-as-stories | Convert to place entities (32 identified) | Keep as stories | Places carry specific definition; moments must belong to same place |

---

## Open Decisions

1. **Eras taxonomy** — Current eras are a mix of legitimate (French Revolution) and editorial bundles (London: Plague, Fire, and Blitz). User acknowledges eras are tricky. Approach: keep for now, consider splitting editorial bundles into component events later.
2. **Sub-moments / multi-location moments** — Some moments (e.g., Los Alamos) describe events across micro-locations. Options: (a) sub-pins within a moment, (b) break into separate clustered moments, (c) description-only. Parked for later. Option B works within current architecture; option A is better long-term for AR/VR.
3. **Day of the Dead** — Currently typed as `place` but is a cultural tradition, not a place. No clean entity type for it. Consider adding `tradition` or `cultural_event` type.
4. **Business entities** (Google, Dell) — Currently stories. Could be org entities or folded into founder person entities. Needs decision.
5. **Which mobile UX concept?** 3 mockups ready at `/mockups/`
6. **Museum artifacts / "current location" moments** — data model TBD
7. **Logo** — marker-over-rabbit-hole concept to explore
8. **Seed cities for places pipeline** — Rome, London, Jerusalem, Athens, Austin as first candidates
9. **Map aesthetic** — User shared reference image (dark blue network/constellation style). Not for this session.

---

## Immediate Next Steps

### Priority 1 — V3 Content Rewrite (96% COMPLETE)
1. ✅ **V3 rewrite of 1,210/1,260 moments** — batch 20 (50 moments) still running
2. ✅ **Review page built** — `v3-review.html` (localhost:8896)
3. 🔄 **User review of v3 rewrites** — browse review page, spot-check quality
4. ⬜ **Cleanup pass** — trim 188 descriptions over 500 chars (mostly 501-550 range)
5. ⬜ **Apply v3 rewrites to database** — after review approval, update moments in-place (preserve IDs, coords, types)
6. ⬜ **Integrate v3 guide into content-guide-prompt.ts** — so pipeline uses v3 for new content
7. ⬜ **Rewrite story names/descriptions** — 293 stories, ~20 need renaming, all need description updates

### Priority 2 — Structural Fixes (after v3 rewrite)
6. ⬜ **32 place→entity conversions** — verify each story's moments truly belong to one place first
7. ⬜ **6 redundant person merges** (Moses, Jesus, Abraham, Paul, King David, John the Baptist)
8. ⬜ **3 biography tagline strips** (Booker T. Washington, O. Henry, Scholz Garden)
9. ⬜ **1 wrong-type fix** (Oppenheimer: incident → biography)
10. ⬜ **~8 era renames** (editorial → encyclopedic)

### Priority 3 — Continue Pipeline + Fixes
11. ⬜ **Continue people pipeline** — offset 153, ~355 remaining
12. ⬜ **Investigate notable sort issue** — Einstein appearing low in list
13. ⬜ **Investigate search UX** — Moments tab doesn't surface results by entity name
14. ⬜ **Regenerate tracker + dashboard** with current data

---

## Project Tracking — Where to Find Things

| What | How to Generate | Output | Status |
|------|----------------|--------|--------|
| **Project dashboard** | `npx tsx scripts/generate-dashboard.ts` | `dashboard.html` | ✅ Active |
| **Ingestion tracker** | `npx tsx scripts/generate-tracker.ts` | `tracker.html` | ✅ Active |
| **Wiring audit** | `npx tsx scripts/audit-wiring.ts` | Terminal output | ✅ Active |
| **Session context** | Read this file | `handoff.md` | ✅ Updated session 52 |
| **Content standards** | Read directly | `content-guide-v3.md` + `content-guide-prompt.ts` | ✅ v3 active (v2 in prompt.ts pending update) |
| **Style comparison** | Open in browser | `style-comparison.html` (localhost:8896) | ✅ Framework B selected |
| **Story audit** | Open in browser | `story-audit.html` (localhost:8896) | ✅ 293 stories, 55 flagged |
| **V3 dry run** | Open in browser | `v3-dryrun.html` (localhost:8896) | ✅ 10 moments, approved |
| **V3 rewrite output** | Check /tmp/ | `/tmp/v3-rewrite-{0-25}.json` | ✅ 1,210/1,260 done |
| **V3 rewrite review** | Open in browser | `v3-review.html` (localhost:8896) | ✅ Before/after comparison |
| **Content scaling plan** | Read directly | `CONTENT-SCALING-PLAN.md` | ✅ Rewritten session 50 |
| **Pipeline tasks** | Read directly | `data/pending-tasks.json` | ✅ Refreshed session 50 |

---

## Common Commands

```bash
# Dev server
cd deep-maps && npx vite --host --port 5178

# Static file server (for tracker/dashboard)
cd deep-maps && python3 -m http.server 8896

# Pipeline — subagent mode (preferred, uses plan credits)
npx tsx scripts/ingest/notable-people-local.ts --phase prep --offset 153 --limit 25
# ... subagents process prompt files ...
npx tsx scripts/ingest/notable-people-local.ts --phase assemble --batch <batch-id>

# Pipeline — API mode (uses Anthropic API credits)
npx tsx scripts/ingest/notable-people.ts --limit 25 --offset 153

# Review + publish
npx tsx scripts/ingest/review.ts --run <ID> --auto-approve
npx tsx scripts/ingest/review.ts --run <ID> --publish

# Audit
npx tsx scripts/audit-wiring.ts

# Regenerate dashboards
npx tsx scripts/generate-tracker.ts
npx tsx scripts/generate-dashboard.ts
```

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/ingest/notable-people-local.ts` | **Subagent pipeline** — Wikipedia → prompt files → subagent generation → review_queue |
| `scripts/ingest/notable-people.ts` | API pipeline — Wikipedia → Claude API → review_queue |
| `scripts/ingest/review.ts` | Interactive review + publish |
| `scripts/ingest/lib/pipeline.ts` | Shared utils (dedup, validation, Wikipedia fetch with retry) |
| `scripts/ingest/lib/llm-client.ts` | Claude API wrapper (Sonnet 4.6) |
| `scripts/ingest/lib/content-guide-prompt.ts` | Editorial system prompt v2 for LLM content generation |
| `scripts/audit-wiring.ts` | 14-rule wiring integrity checker |
| `scripts/generate-tracker.ts` | Ingestion progress tracker (entity tabs, image/accuracy stats) |
| `scripts/generate-dashboard.ts` | Project dashboard generator |

## Architecture Reference

| File | Role |
|------|------|
| `src/App.tsx` | Main layout — map/panel split, routing, mode system |
| `src/lib/data/provider.tsx` | DataProvider — TanStack Query + Context + loading screen |
| `src/lib/data/supabase-loader.ts` | Fetches all tables, reassembles joins |
| `src/components/ui/TimelineBar.tsx` | Timeline visualization + filtering |
| `src/components/panel/ExplorePanel.tsx` | Panel with hybrid nearest/notable sort |
| `src/components/map/EmergenceLayer.tsx` | Canvas-based moment renderer (respects storyIdFilter) |
| `supabase/migrations/` | 005 = tracker_notes entity_slug + category upgrade |
| `content-guide.md` | Editorial standards (11 moment name rules) |
| `CONTENT-SCALING-PLAN.md` | Scaling strategy: 671 → 10K → 100K → 1M |
| `data/top-people.json` | 507 ranked notable people (source list) |
| `data/pipeline-batches/` | Subagent batch files (prompts + outputs per batch) |

## Roadmap Ideas

### Historical Media Integration (Primary Sources)
Bring moments to life with actual newspaper pages, book excerpts, documentary clips.

**Low-hanging fruit (free APIs):**
- **Library of Congress Chronicling America** — Digitized newspapers 1777-1963. Free API, keyword + date search, returns scanned page images with OCR. Public domain.
- **Wikimedia Commons** — Free images tied to Wikipedia articles we already link. Many events have public domain photos/engravings.
- **Internet Archive** — Books, newspapers, some video. Free API.

**Medium effort:**
- **Newspapers.com** — Paid, massive 20th century archive. Would cover modern Austin stories.
- **Google Books API** — Snippet previews from books mentioning specific events.
- **YouTube Data API** — Documentary clips, news segments (link + thumbnail, not embed).

**Dream tier:**
- AP/Getty/Reuters photo archive licensing
- AR overlay of historical photos at the actual location
- Short documentary clip fair-use excerpts

**First spike:** LOC Chronicling America — free, public domain, actual newspaper images. The "here's the front page from the day this happened" moment.

### Strotability Scoring
Content quality metric: how many outbound connections a moment has to other stories, entities, places. Higher strotability = more rabbit trails = more engagement. Could inform content prioritization and guide generation.

### Sub-moments / Multi-location Moments
Some events span micro-locations within a site (e.g., Los Alamos — Oppenheimer's cottage vs Fermi's quarters vs the lab). Options: sub-pins on a moment, clustered separate moments, or description-only. Parked for now; option 2 (separate clustered moments) works within current architecture.

### Immersive / AR Mode
Tour guide voice content (Style D in comparison tool) could power an audio walking tour mode. "Here" anchoring in v3 descriptions is designed to support this. Content already written for future AR/VR use.

## Expert Council
- **Jimmy Wales** (encyclopedic clarity)
- **Steve Jobs** (design simplicity)
- **Edward Tufte** (data visualization)
- **Martin Kleppmann** (data architecture)
- **Paul Ramsey** (PostGIS)
- **Dan Abramov** (React)
