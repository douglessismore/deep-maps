# Deep Maps — Session Handoff (Updated Mar 15, 2026, Session 41)

> **Structure note**: Living snapshot. Main sections = current state. Historical decisions in Key Decisions table.

## Current State

### App
- **602 moments**, **195 stories**, **211 entities**, **23 collections** in static TypeScript data files
- **8 story categories**: dark-history, last-stands, discovery-science, arts-culture, mystery-unexplained, political-drama, everyday-extraordinary, sacred-history
- Architecture: Moments-First model — moments.ts, entities.ts, stories.ts (StoryMoment[] references), collections.ts (momentIds[])
- MomentKind taxonomy: `'event' | 'milestone' | 'presence'` (optional, defaults to event)
- Dev server: `cd deep-maps && npx vite --host --port 5174`
- Build check: `npx tsc -b` (NOT `tsc --noEmit` — tsc -b is stricter, matches Vercel)
- **Fractal Zoom**: Phases 0–2.5 COMPLETE. Notability scoring (0-100 per moment) + Story Constellation Clusters at low zoom + 4 visual variants with toggle.

### What Changed Sessions 40-41

**Session 41: Content Audit Completion + Mobile Context Fix**

1. **Stories→Collections migration (dual-presence)**: Added 7 curated-list stories to `collections.ts` (historys-bravest, rome-renaissance-masters, london-under-fire, london-great-stages, scientific-minds-2, artists-writers-immortal, revolutionaries-pen-pulpit). Kept in stories.ts because `getLocationsInBounds()` in geo.ts only iterates stories, not collections — removing them would orphan 34 moments from the Moments tab. Full removal deferred to post-Supabase.

2. **Bug fixes — Map navigation**:
   - **Scroll-to-top fitBounds**: When scrolling back to top of a story, map now resets to show all story moments (added `onScrollToTop` callback to StoryPanel.tsx)
   - **Entity zoom-out**: Clicking an entity from a story moment now zooms to show ALL entity moments globally, not just the local one (fixed `handleEntitySelect` to set `activeLocation(null)` so MapView fitBounds fires)

3. **Content audit data fixes**:
   - Fleshed out 5 entity description stubs (Santa Anna, Travis, Mackenzie, Prince Carl, Comanche Nation) to 200-350 char content-guide standard
   - Fixed 6 subtitles that restated the moment name (tomb-7-discovery, palace-santa-fe, wb-kitty-hawk, wkm-mass-grave, rwm-cedar-key-rail, nordlinger-ries)
   - Fixed 4 entity descriptions with weak "Born [real name]" openings (O. Henry, Paul the Apostle, Genghis Khan, Mark Twain) — frontloaded the hook per content-guide

4. **Mobile description visibility (SHIPPED)**:
   - StoryCard and PersonCard now show 1-line truncated descriptions on mobile (`text-xs line-clamp-1`) instead of hiding them entirely
   - This solves the "contextless cards" problem — every card now passes the five-second test on mobile
   - Content audit confirmed: 195/195 story descriptions and 206/210 entity descriptions frontload well for 1-line truncation

5. **Content guide updated**: Section 5 (entity descriptions), section 8 (card UI reference), section 10 (mobile-first rule), and Appendix A updated to reflect mobile descriptions and the "Born [real name]" anti-pattern.

**Session 40: Emergence, Essence, Wisps Variants + Story Ranking**

Built 3 new map visualization variants (Wisps, Essence, Emergence), implemented story ranking by notability in the Stories tab, fixed duplicate entity rendering issue, and various UX improvements.

### What Changed Session 39

**Phase 2.5v4: Constellation Visual Variants — "Portals You Can Fall Into"**

User feedback on Session 38's constellation clusters: concept works (clustering, fracture zoom, hover tooltips) but visual aesthetic wrong — opaque dark circles with count numbers "overwhelm the map" and feel like "data dashboard widgets." User wants "portals" or "rabbit holes you can fall down" that evoke "endless layers of curiosity." AI council (Gemini, ChatGPT, DeepSeek) all converged: remove opaque fill, hide count until hover, use transparency/glass/luminous effects.

Built 4 visual variants with a toggle switcher for rapid comparison:

| Variant | Key Visual | Fill | Count | CSS Effect |
|---------|-----------|------|-------|------------|
| **Glass** (default) | Thin category ring + frosted blur | Semi-transparent (backdrop-filter) | Hover only | `backdrop-filter: blur(4px)`, circular frosted glass over map |
| **Glow** | Single luminous ring + soft glow behind | None — fully transparent | Hover only | Thick transparent ring behind crisp ring = glow without SVG filters |
| **Depth** | 3 concentric rings at decreasing opacity | None — fully transparent | Hover only | Outer category ring + dashed middle ring + tiny inner ring |
| **Classic** | Original donut chart + dark fill | Opaque dark (rgba 10,10,10,0.88) | Always visible | Original Session 38 design, kept as baseline |

**Files modified:**

1. **`src/lib/constellation.ts`** — Full rewrite
   - New type: `ConstellationVariant = 'classic' | 'glass' | 'rings' | 'luminous'`
   - Extracted shared `buildRingSegments()` function (DRY across all 4 variants)
   - 4 SVG generator functions: `createClassicSVG()`, `createGlassPortalSVG()`, `createDepthRingsSVG()`, `createLuminousOutlineSVG()`
   - `createConstellationSVG()` dispatches to variant generator based on param
   - New export: `createCountLabel()` — HTML overlay for hover-reveal count

2. **`src/index.css`** — Variant-specific CSS
   - Base `.constellation-node` stripped of animation (each variant defines its own)
   - `.constellation-count` — absolute-positioned text overlay, opacity 0→1 on hover
   - `.constellation-classic` — original breathing animation + drop-shadow
   - `.constellation-glass` — `backdrop-filter: blur(4px)`, `border-radius: 50%`, `overflow: hidden`, subtle background pulse
   - `.constellation-rings` — slower breathing (5s), subtle glow pulse
   - `.constellation-luminous` — faster glow pulse (3.5s), strongest hover glow
   - Each variant has custom `@keyframes` and hover state

3. **`src/components/map/MapView.tsx`** — Variant wiring
   - New state: `constellationVariant` in MapView (default: 'glass')
   - `MapController` accepts `constellationVariant` as additional prop
   - `createConstellationIcon()` wraps SVG in variant-specific CSS class + count overlay
   - MarkerEntry extended with `variant?` field for differential update detection
   - Cluster icon rebuilds when variant changes (added to update condition)
   - `constellationVariant` added to marker useEffect dependency array
   - New `VariantSwitcher` component — dropdown matching TileSwitcher pattern
   - TileSwitcher refactored: absolute positioning moved to shared container div
   - Both switchers in flex column container at `top-3 right-3`

**Verified:**
- ✅ All 4 variants render correctly on light tiles
- ✅ All 4 variants render correctly on dark tiles
- ✅ Toggle switcher opens/closes, shows current variant, highlights active
- ✅ Switching variants instantly updates all cluster icons (no page reload)
- ✅ Click-to-zoom fracture works across all variants
- ✅ Tooltips work across all variants
- ✅ Category filter works across all variants
- ✅ Story/entity mode bypass works (direct pins, no clusters)
- ✅ TypeScript build: zero errors
- ✅ Vite production build: succeeds

### What Changed Session 38 (Summary)

**Phase 2.5v3: Story Constellation Clusters — Complete Rewrite of Map Visualization**

Replaced the previous approaches (heatmap layer rejected, continuous opacity ramp underwhelming) with a Supercluster-based constellation system. At low zoom, nearby moments aggregate into constellation orbs — SVG donut ring charts showing category composition, moment count, and top stories. As you zoom in, constellations fracture into smaller clusters, then into individual pins.

**New files:** `src/lib/clustering.ts` (Supercluster engine with map/reduce aggregation, lazy per-category indices), `src/lib/constellation.ts` (SVG donut ring chart generator). Complete MapView.tsx rewrite for cluster-aware rendering with two paths: focused mode (story/entity) uses direct pins, explore/scroll mode uses Supercluster. Dependencies: supercluster 8.0.1, @types/supercluster.

**What was rejected/replaced:**
- Phase 2.5v1 (leaflet.heat heatmap): User rejected as "too blobby, not enough signal"
- Phase 2.5v2 (continuous opacity ramp): User said "looks almost the same as before"
- `HeatmapLayer.tsx` still exists as disconnected file (not imported anywhere)

### What Changed Sessions 35-37 (Summary)

**Sessions 35-36: Phase 0C + Phase 1 (Scoring Calibration + Types)**
- Recalibrated sitelinks curve (multiplier 38→46, 300 SL = 100)
- Shifted tier thresholds to match natural distribution (S: 82+, A: 65-81, B: 45-64, C: 25-44, D: 5-24)
- Added `notability?: number` to Moment type, `isPrimary?: boolean` to StoryMoment
- Applied scores to all 601 moments in moments.ts
- Created `src/lib/notability.ts`: threshold functions, hysteresis, primary moment logic

**Session 37: Phase 2 (Zoom-Based Filtering)**
- MapView: zoom tracking + notability filter in visibleLocations useMemo
- ExplorePanel: notability filter in updateViewport + "zoom in to see more" UI ("14/567" format)
- Category filter: threshold lowered by 20 when category active
- Story/entity mode bypass: all moments shown regardless of zoom
- Differential marker updates: only rebuild icons when state changes

### What Changed This Session (34)

**Phase 0: Notability Scoring — Fractal Zoom Roadmap**

Built and validated the notability scoring script as Phase 0 of the Fractal Zoom Roadmap (plan file: `.claude/plans/magical-singing-beaver.md`). This enables zoom-based progressive disclosure: globally significant moments show at world zoom, local content reveals as you zoom in.

**1. Scoring Script (`scripts/score-moments.ts`)**
- Fetches Wikipedia pageview data for 316 unique slugs (299 successful, 17 failed)
- Scores each moment on 0-100 scale using log10 formula: `clamp(round((log10(avgMonthlyViews) - 1.5) * 20), 5, 100)`
- Primary Moment logic: first moment in each story is "primary" (inherits full score); supporting moments get 0.5x multiplier (prevents Einstein/Gein blob clusters at low zoom)
- Cross-reference density fallback for moments without Wikipedia coverage
- Manual override support from `scripts/output/overrides.json`
- Retry logic with exponential backoff for rate-limited requests

**2. Key Bug Fixes During Development**
- **Rate limiting**: Reduced from 50 concurrent to 10 concurrent with 500ms delay + retry on 429/5xx
- **Story-first slug bias**: Fixed getSlugForMoment to compare ALL slugs (story + entity) and pick highest-pageview one. Before fix: Jesus scored 57 (using "Ministry_of_Jesus" story slug, 12K views). After fix: Jesus scored 87 (using "Jesus" entity slug, 416K views).
- **URL double-encoding**: Slugs with `%27` (apostrophe) were double-encoded. Added decodeURIComponent before re-encoding. Fixed O'Keeffe, Halley's Comet, Popé, etc.

**3. Scoring Results (Phase 0 Dry Run)**
Distribution across 601 moments:
| Tier | Score Range | Count | % | Zoom Level |
|------|-----------|-------|---|-----------|
| S | 90-100 | 6 | 1.0% | World |
| A | 70-89 | 80 | 13.3% | Continental |
| B | 50-69 | 68 | 11.3% | Country |
| C | 30-49 | 332 | 55.2% | Regional |
| D | 10-29 | 112 | 18.6% | City/local |
| Archive | 0-9 | 3 | 0.5% | Deep cuts |

Top 10: D-Day (100), Ed Gein (100, true crime bias), Cleopatra (96), Google at Denny's (96), Somme (90), JFK assassination (90), Dahmer (89), JFK birth (89), Trafalgar (87), Bundy (87).

**4. Known Issues in Scoring (For User Review)**
- **True crime bias**: Ed Gein (2.6M views/mo) scores 100, outranking most civilizational anchors. Correction planned via: cross-lingual sitelinks boost (Phase 1), editorial must-show whitelist, manual overrides.
- **Eiffel Tower scores 19**: No entity wired to the moment — falls back to "Culture_of_Paris" story slug (1.5K views). Data wiring gap, not algorithm issue.
- **4 primary moment mismatches flagged**: Ed Gein (first moment is `contextual`), Bermeja Island, Aluxes, London Crown & Scaffold.
- **17 slugs still fail**: Mostly very obscure articles or articles with unusual naming.

**5. Output Files**
- `scripts/output/notability-scores.md` — Full ranked list for human review
- `scripts/output/notability-scores.json` — Machine-readable score breakdowns (601 entries)
- `scripts/output/overrides.json` — Manual override file (empty, ready for user edits)

**6. Mexico Content (Batches 1 & 2, from earlier this session)**
- **Batch 1** (commit `92ab156`): 5 stories (sacred-history, arts-culture), 11 moments, 3 entities. Covers Cristero War, Guadalupe apparitions, Day of the Dead origins, Chichén Itzá equinox, Monarch butterfly discovery.
- **Batch 2** (commit `68dacdc`): 6 stories filling everyday-extraordinary and discovery-science gaps. Added Teotihuacán, Olmec, Pakal tomb, Monarch butterflies, Chicxulub crater, Monte Albán.
- Net from both batches: +32 moments, +11 stories, +3 entities.

### Previous Session (33b)

**Critical Bug Fixes — Story suppression, entity panel contamination, UI**

User reported multiple issues on mobile: Stories tab only showing people (no story cards), entity panels showing unrelated moments (Tubman→Cleopatra), UI glitches. Investigation found two pre-existing root causes, neither caused by Session 33.

1. Story suppression bug: `canonicalStoryIds` set hid 52% of stories → fixed to biography-only suppression (31 suppressed, 153 visible)
2. Entity panel contamination: 53 omnibus canonicalStoryId references → all removed
3. UI: over-scroll padding, Places back button label, assassination collection cleanup

### Previous Session (33) — Gold Standard Content Audit

Applied content-guide.md end-to-end to one story, one person, one place. Each was audited in the browser for rendering, navigation, entity chips, and cross-wiring. These are now the reference targets for the bulk audit.

**1. Story Gold Standard: Lincoln Assassination**
- Added missing `date` and `kind` fields to all 3 moments
- Improved Garrett Farm subtitle (was repeating the name, now hooks with drama)
- Added `canonicalStoryId` to John Wilkes Booth entity
- Improved Booth entity description frontloading
- **Result**: Tight 3-moment incident story. Self-explanatory names, complete metadata, strong cross-wiring via relatedStoryIds and entityIds. Dive deeper shows entities + cross-stories.

**2. Person Gold Standard: Ed Gein**
- **Complete name rewrites** on all 6 remaining moments to pass five-second test:
  - "Police Discover a Farmhouse Full of Furniture Made from Human Bones"
  - "A Killer Leaves an Antifreeze Receipt That Leads Police to His Farmhouse of Horrors"
  - "A Grave Robber Reads Obituaries to Find His Next Victims — Then Is Buried Among Them"
  - "A Future Serial Killer Grows Up Isolated by His Mother in Rural Wisconsin"
  - "A Tavern Owner Vanishes — Her Skull Is Found Three Years Later in a Killer's Farmhouse"
  - "The Killer Who Inspired Psycho Is Declared Insane and Locked Away for Life"
- Merged `gein-burial` into `gein-cemetery` (duplicate pin at same lat/lng)
- **Removed 5 sub-entities** that failed notability bar: plainfield-cemetery, plainfield-school, worden-hardware-store, mary-hogan-tavern, mendota-mental-health (all venues/places, not notable entities)
- Reordered story moments chronologically
- Fixed metadata: added dates, addresses, corrected year (1957→1958 for commitment)
- **Result**: Every moment passes five-second test without knowing who Gein is. Name alone conveys the horror. No sub-notability clutter.

**3. Place Gold Standard: London (london-history collection)**
- **Created 5 new entities**: Charles I, Horatio Nelson, Jack the Ripper, The Beatles, Richard III
- **Wired entityIds** to 5 previously unlinked moments (was 53% missing entityIds, now ~18%)
- **Differentiated importance**: 5 moments changed from major→minor (princes-tower, rosetta-stone, nelson-funeral, great-exhibition, st-pauls-blitz)
- **Fixed chronological ordering** in both london-under-fire (Nelson 1806 was after Ripper 1888) and london-great-stages (Shakespeare 1599 was after Great Exhibition 1851)
- Fixed london-great-stages years: 1687–1969 → 1599–1969
- **Evaluated stories vs collections**: london-crown-scaffold ✅ is a real story (narrative arc). london-under-fire ❌ and london-great-stages ❌ are curated lists, not narrative arcs — conversion deferred to story→collection refactoring session.
- **Result**: Entity chips render on moments. Pin density differentiated. Stories/collection tab navigation works end-to-end. 3 moments still lack entityIds (plague, fire, rosetta stone — no single notable figure).

### Gold Standard Patterns (Reference for Bulk Audit)

**Gold Standard Story** (Lincoln Assassination):
- Tight narrative arc with beginning/middle/end (or at least clear progression)
- Every moment name self-explanatory to a stranger
- All metadata complete: date, kind, year, type, importance, address
- entityIds on every moment → entity chips render in UI
- relatedStoryIds cross-wire to related stories → dive deeper works
- Chronological moment ordering in stories.ts

**Gold Standard Person** (Ed Gein):
- Every moment passes the five-second test WITHOUT knowing who the person is
- Name alone conveys the dramatic event (mobile-first: descriptions hidden)
- Subtitle adds new information (never repeats the name)
- Entity description frontloads the hook — first 8 words work as tagline
- Sub-entities meet notability bar (remove venue/location entities that only matter in context)
- No duplicate pins (merge moments at same lat/lng)
- Chronological story ordering

**Gold Standard Place** (London):
- Collection subtitle does all the work (description NOT rendered in UI)
- Every moment has entityIds → entity chips visible on cards
- Importance differentiated: not everything is major
- Stories within the place are genuine narrative arcs (if not, convert to collections)
- Moments ordered chronologically within each story
- Entity canonicalStoryId correctly set for all related entities

### Geographic Distribution (updated session 34)
| Region | Moments | Notes |
|--------|---------|-------|
| USA + Canada | ~260 | Still dominant, mostly Austin/Texas + serial killers + biographies |
| Middle East / N. Africa | ~80 | Biblical events + sacred sites + Avicenna |
| Mexico | ~90 | Expanded: +32 moments in Session 34 (Teotihuacán, Olmec, Cristero War, Day of Dead, Chicxulub, Monte Albán, Monarchs) |
| Western Europe | ~85 | London, Paris, Rome, Tokyo + battlefields + notable people |
| Eastern Europe / Russia | ~15 | St. Petersburg, Yasnaya Polyana + nuclear tests |
| South America | ~6 | Bogotá, La Higuera, Santiago, Rio |
| South Asia | ~10 | Dandi, Santiniketan, New Delhi + sacred sites |
| East Asia | ~22 | Beijing, Qufu, Mongolia, Tokyo + nuclear tests |
| Sub-Saharan Africa | ~5 | Robben Island, Harare + meteorite craters |
| Southeast Asia | ~3 | Yangon + Angkor Wat + nuclear test |
| Central Asia / Iran | ~3 | Isfahan, Konya |
| Caribbean | ~2 | Havana |
| Pacific / Oceania | ~9 | Nuclear tests + Midway |

## Content Standards (CRITICAL — must maintain)

### Moment Naming Convention — STRICT EVENT-ONLY (Decision #10)
- **Every moment must describe a specific historical event** — no ongoing activities, no place descriptions
- Headline present tense ("Jesus Feeds Five Thousand") is fine — it describes a one-time event
- ✅ "Gandhi Walks 240 Miles to the Sea to Defy the British Salt Tax" (specific event)
- ✅ "Marines Raise the Flag on Mount Suribachi After Five Weeks of Carnage" (specific event)
- ✅ "Jesus Feeds Five Thousand People with Five Loaves and Two Fish" (headline present, specific event)
- ❌ "Hindus Bathe in the Sacred Ganges at the World's Oldest Living City" (ongoing activity)
- ❌ "The Largest Impact Crater on Earth Lies Beneath South African Farmland" (place description)
- ❌ "The Western Wall" (just a place name)
- **Reframing rule**: Ongoing activities → founding/construction/origin event. Place descriptions → the event that created/discovered the place.

### Three Styles Identified (only Style A is allowed)
| Style | Example | Allowed? |
|-------|---------|----------|
| **A. Headline present (event)** | "Jesus Feeds Five Thousand" | ✅ YES |
| **B. Ongoing activity** | "Hindus Bathe in the Sacred Ganges" | ❌ Rewrite as A |
| **C. Place description** | "A Crater Sits in the Arizona Desert" | ❌ Rewrite as A |

### Descriptions
- STANDALONE — must make sense without any story context
- Informative-encyclopedic tone (Wikipedia clarity, not BuzzFeed)
- Information-dense, matter-of-fact
- Each description should answer: What happened? When? Why does it matter?

### Entity Notability Bar
- Recognizable names globally, or names where the one-liner makes you want to Google them
- No victims, venue founders, minor characters

### Collections = Lists, Not Narratives
- Names should read like Wikipedia "List of..." articles
- User knows what's in it before clicking

## Known Issues / Tech Debt

### 🔴 CONTENT REWRITE — 17 Present-Tense Moments (OWN SESSION)
**Priority: HIGH** — Audited in Session 32. Exactly 17 moments need rewriting:
- 5 sacred pilgrimage sites (ongoing activities → founding/origin events)
- 10 meteorite craters (place descriptions → impact events)
- 2 Austin/Texas moments (ongoing traditions → historical events)
**Biblical events are CLEAN — no rewrites needed.**
**Decision: Strict event-only. Dedicated rewrite session.**

### 🔴 PANEL UX — Card List Needs Design at Scale (OWN SESSION)
**Priority: HIGH** — The Stories/Moments panel is an unordered list of everything in the viewport. At ~495 moments this feels random and disorganized. Needs:
- Sorting logic (distance? relevance? chronological?)
- Grouping (by category? by story? by era?)
- Progressive disclosure (show top N, expand for more?)
- Visual hierarchy (featured vs. supporting content)
**Requires design decisions before implementation. Dedicated UX session.**

### 🟡 STORY→COLLECTION REFACTORING — PHASE 1 COMPLETE (Session 41)
**Priority: MEDIUM** — 7 curated-list stories now exist in BOTH stories.ts AND collections.ts (dual-presence):
- `historys-bravest`, `rome-renaissance-masters`, `london-under-fire`, `london-great-stages`, `scientific-minds-2`, `artists-writers-immortal`, `revolutionaries-pen-pulpit`
**Phase 2 (full removal from stories.ts)** blocked on: `getLocationsInBounds()` in geo.ts only iterates stories, not collections. Removing them would orphan 34 moments from the Moments tab. Fix requires updating the panel rendering pipeline to also iterate collections. Deferred to post-Supabase.
**Additional candidates identified**: `presidential-assassinations`, `american-serial-killers`, `nuclear-test-sites`, `meteorite-impact-craters`, `mass-shootings`, `american-disasters` (from plan file).

### 🟡 PHANTOM MOMENT: aung-san-suu-kyi-house-arrest
- Referenced in stories.ts and collections.ts but moment data DOESN'T EXIST in moments.ts
- Suu Kyi entity exists but has 0 moments (her moments silently fail to render)
- Need to create the moment or remove the references

### 🟡 HOLISTIC CONTENT AUDIT (Flagged Session 33c)
- **Geographic topic skew**: Mexico region heavily skewed toward dark/paranormal. Need non-paranormal Mexico stories (culture, history, art, food, pre-Columbian civilization) to balance.
- **Voice & formatting consistency**: Audit ALL content for consistent informative-encyclopedic tone (per Session 29 principles). Check naming style, description length, subtitle quality across the board.
- **Topic distribution review**: Check all regions for over-representation of any single genre (not just Mexico).

### 🟡 NOTABILITY / NOISE FILTERING AUDIT (Flagged Session 33c)
- Filter out noisy/obscure person and place entities, stories, and moments that dilute the graph.
- Needs human review (not fully automatable) — produce a ranked list sorted by "obscurity score" (heuristics: no Wikipedia article, single moment only, zero cross-references, no entityIds pointing to them).
- User wants to review the output before any deletions.

### ✅ CONTEXTLESS CARDS UX — RESOLVED (Session 41)
- StoryCard and PersonCard now show 1-line truncated descriptions on mobile (`text-xs line-clamp-1`)
- Entity descriptions audited: 206/210 pass the "first 8 words = tagline" test; 4 weak openings fixed
- Story descriptions naturally frontload well ("book jacket blurb" style)
- Content guide updated with "Born [real name]" anti-pattern and mobile frontloading guidance

### 🟡 STORY/BIOGRAPHY EDGE CASES
- `zodiac-killer` story has `storyType: 'incident'` but entity `zodiac-killer` exists → both story card and person card visible (minor duplicate, acceptable since the case is unsolved)
- `j-robert-oppenheimer` story has `storyType: 'incident'` but is functionally a biography → not suppressed. Could change storyType to 'biography' if desired.
- `bonnie-and-clyde`, `wright-brothers`, `lbj-lady-bird-austin` are joint biographies suppressed by the new logic — correct since person entities exist, but the joint narrative may add value beyond individual cards.

### ✅ FRACTAL ZOOM ROADMAP — Phases 0-2.5 COMPLETE
- **Phase 0**: Notability scoring (v0.2 composite: sitelinks×0.45 + pageviews×0.35 + crossRef×0.20). 601 moments scored.
- **Phase 0C**: Recalibrated sitelinks curve (38→46), shifted tier thresholds.
- **Phase 1**: Types updated, scores applied to moments.ts, notability.ts helper lib.
- **Phase 2**: Zoom-based filtering in MapView + ExplorePanel. "Zoom in to see more" UI.
- **Phase 2.5**: Story Constellation Clusters (Supercluster + SVG donut rings). Replaced rejected heatmap and opacity ramp approaches.
- **Phase 2.5v4**: 4 visual variants with toggle (Glass, Glow, Depth, Classic). Glass Portal is default — frosted blur + transparent.
- Full plan in `.claude/plans/magical-singing-beaver.md`
- **NEXT**: User to pick preferred variant (or hybrid), then Phase 2.5b (Narrative Threads), Phase 3 (Supabase)

### ✅ Performance Plan (from Session 26) — MOSTLY COMPLETE
- Steps 2-3 (People-in-Stories, Collections 4th tab) COMPLETE
- Step 1 (rAF throttle + panTo debounce) COMPLETE
- MapView differential marker updates COMPLETE (stable marker map with diffing, no clearLayers rebuild)
- Still TODO: StoryPanel memoization (low priority)

### 🟢 Globe Interface (Deferred)
- User likes the idea, council unanimously advises against globe as PRIMARY interface
- Acceptable as landing/discovery mode that morphs into flat map (Phase 2+)
- Would require CesiumJS/Mapbox Globe — full rewrite of map layer

## Key Decisions

| # | Decision | Chosen | Rejected | Why |
|---|----------|--------|----------|-----|
| 1 | Data storage | Static TS files | Supabase/DB | Good enough for <1000 moments. Revisit at ~2000. |
| 2 | Category system | 8 fixed categories | Tags-only | Provides visual consistency, color coding, filter pills |
| 3 | Moment naming | Verb-first events | Place names | "Verb = story hook" principle. Drives engagement. |
| 4 | Entity notability | Global recognition | Regional figures | Users should recognize the name or be intrigued by the one-liner |
| 5 | Collections model | momentIds (pins) | storyIds | Each collection = list of map pins, not list of narratives |
| 6 | BCE dates | Negative year values | String-only | `year: -480` for Thermopylae. Enables sorting. `date` field for display. |
| 7 | Globe interface | Deferred (Phase 2+) | Replace Leaflet now | Half-sphere visibility problem, scroll UX breaks, full rewrite cost |
| 8 | Notable people approach | Cherry-pick top 500 for geo diversity | Bulk import | Dataset is 56% European. Must prioritize gap-filling, not rank. |
| 9 | Dual strategy | Story depth + geographic density simultaneously | One or the other | Story depth = retention, geographic density = discovery. Both needed. |
| 10 | Naming strictness | Strict event-only (Style A) | Allow ongoing activities (B) or place descriptions (C) | App identity is "what happened here." Every moment CAN be reframed as an event. Keeps identity razor-sharp. |
| 11 | Content guide | Comprehensive guide (`content-guide.md`) | Ad-hoc standards | Consistency at scale requires written standards. Guide covers naming, lengths, tone, mobile-first rules, audit checklist. |
| 12 | Expert council | Tim Urban (awe/curiosity, plain language) + Rand Fishkin (content discoverability) as content sub-council | Maria Popova | Tim Urban's voice matches Deep Maps' "make complex history fascinating in plain language" goal. Rand Fishkin brings content strategy: what makes people click and stay. Both recommended by multiple AI models. |
| 13 | Stories vs Collections | Stories = narrative arcs; Collections = curated lists | Everything is a story | If items can be rearranged without losing meaning, it's a collection, not a story. Keeps story tab meaningful. |
| 14 | Notability scoring | Wikipedia pageviews (log10) + entity slugs + primary moment logic | Multi-dimensional scores, Wikidata QID, spatial deconfliction | Single composite score + manual overrides is sufficient at 601 moments. Entity slugs beat story slugs for pageview accuracy. Primary moment prevents cluster blobs. |
| 15 | Fractal zoom filtering | Notability threshold per zoom level (linear interpolation) | Target-count thresholds | Notability filtering is simpler, more predictable, and preserves pin identity. |
| 16 | Low-zoom visualization | Story Constellation Clusters (Supercluster + SVG donut rings) | Heatmap (too blobby), continuous opacity ramp (too subtle), Leaflet.markercluster (too generic) | Constellations are unique to Deep Maps, communicate density AND category composition, and create the "galaxy fracture" zoom effect. Each cluster is a portal that invites exploration. |
| 17 | Cluster visual style | 4 variants with toggle (Glass default) | Single opaque donut chart | User found opaque dark circles "overwhelming." AI council (3 models) unanimously recommended transparency + hidden counts. Glass Portal = frosted blur over map; Glow = luminous ring; Depth = concentric rings; Classic = original. Toggle enables rapid comparison. |

## Next Steps (Priority Order)

1. **BULK CONTENT QUALITY AUDIT** — Gold standards established (Session 33), mobile descriptions shipped (Session 41). Remaining work:
   - a. Rewrite 17 present-tense moments (5 pilgrimage + 10 craters + 2 Austin)
   - b. ~~Refactor 6 stories→collections~~ Phase 1 done (dual-presence). Phase 2 post-Supabase.
   - c. Apply five-second test to ALL moment names (~30 Mexico/Oaxaca fragments need rewriting — see plan Part 3A)
   - d. Verify data wiring: entityIds on every moment, canonicalStoryId on every entity
   - e. Fix broken references: 4 canonicalStoryId mismatches, 2 broken relatedStoryIds, phantom moment (see plan Part 2C-2E)
   - f. Fix 12 truncated entity descriptions (see plan Part 2A)
   - g. Fix storyType mismatches (5 stories — see plan Part 3E)
2. **Phase 2.5b: Narrative Threads / Story Paths** — Polylines connecting story moments chronologically on map. Contextual (on story selection), not always-on. Low effort (~30-50 lines of Leaflet polyline code). See plan file for design details.
3. **Phase 3: Supabase + PostGIS Migration** — Unblock content scaling past 2000 moments. Server-side spatial queries, real graph centrality computation. Keep TS files as authoring format initially with `scripts/sync-to-db.ts`.
4. **Content Scaling: Notable People top 200** — ~800-1000 new moments. Prioritize Africa, S. America, SE Asia, Central Asia (geographic gaps).
5. **Panel UX redesign** — Card sorting/grouping/hierarchy for Stories panel at scale
6. **Roadtrip collections** — "History Along Route 66", "Pacific Coast Highway"
7. **HeatmapLayer.tsx cleanup** — Currently disconnected/unused. Remove or defer to post-Supabase at 10K+ moments.

## Session History

- **Sessions 1-25**: Austin core content, serial killers, civil rights, assassinations, aviation, O. Henry biography, Texas history, Mexico batch, Wild West, music venues
- **Session 26**: Performance plan (partially implemented), People-in-Stories, Collections 4th tab
- **Session 27**: Map performance fixes, Austin graph wiring
- **Session 28-29**: Entity enrichment, moment naming audit, relatedStoryIds wiring
- **Session 30**: Collections→moments refactor, nuclear test sites (37 locations), meteorite craters (20 locations), sacred pilgrimage sites (23 locations), biblical events research, story-ideas.md
- **Session 31**: Biblical events (58 moments, 5 stories, 7 entities), famous battlefields (21 moments, 6 stories, 5 entities), notable people batch 1 (33 moments, 6 stories, 33 entities). Downloaded notable people dataset (2.29M). Geographic distribution analysis. Globe interface decision (deferred). Content standards concern flagged for present-tense moments.
- **Session 32**: Full naming audit (17 violations found). Decision: strict event-only naming (#10). City clusters: London (15), Rome (12+3 existing), Paris (14+1 existing), Tokyo (14+1 existing) = 55 new moments, 12 stories, 17 entities, 4 collections. Notable people batch 2: Darwin, Beethoven, Marx, Luther, Frida Kahlo, Picasso, Hemingway, Twain, Dickens, Nightingale, Freud, Joan of Arc, Gutenberg, Earhart, Tesla, Copernicus, Hamilton, Tubman, Pasteur, Cleopatra = 20 new moments, 4 stories, 20 entities. Content styling guide created then comprehensively rewritten (605 lines, 12 sections + 3 appendices). Expert council: Tim Urban + Rand Fishkin as content sub-council (replacing Maria Popova). Stories vs Collections distinction established (decision #13). 4 stories flagged as should-be-collections. Panel UX concern flagged.
- **Session 33**: Gold standard content audit — 3 reference examples. Lincoln assassination (story): added date/kind metadata, improved Booth entity wiring. Ed Gein (person): complete rewrite of all 6 moment names to pass five-second test, merged duplicate pin, removed 5 sub-notability entities, reordered chronologically. London (place): created 5 new entities (Charles I, Nelson, Jack the Ripper, Beatles, Richard III), wired entityIds to 5 moments, differentiated importance (12 major / 5 minor), fixed chronological ordering, confirmed london-under-fire + london-great-stages should be collections. Gold standard patterns documented in handoff. Net: -1 moment (merged gein-burial), +5 entities, -5 entities = ~569 moments, ~205 entities.
- **Session 33b**: Critical bug fixes. Story suppression was hiding 52% of stories (95/184) — fixed to use storyType 'biography' + person entity claim (31 suppressed, 153 visible). Entity panel contamination from 53 omnibus canonicalStoryId references — all removed. Deleted duplicate Tubman entity, deleted Linklater entity. Fixed assassination collection (removed 2 wrong moments). UI: over-scroll padding, Places back button label. Self-link fix in Dive Deeper (entity.canonicalStoryId === story.id filtered in LocationCard + StoryPanel). Net: -2 entities = ~208 entities. All pre-existing bugs, none caused by Session 33.
- **Session 33c**: Data gap audit and fill. Wired entityIds for 51 moments (Trinity→manhattan-project, holy sites→jesus/moses, battles→napoleon/nelson/churchill, Texas places→menger-hotel/chile-queens). Filled years for all 20 entities that were missing them. Added wikipediaSlug to 7 stories + 2 entities. Added year to 4 ancient moments (Capernaum, Mecca, Varanasi, Kailash). Coverage: 67.7% moments have entityIds (was 59%), 0 entities missing years (was 20), 14 stories missing wiki (was 21, remaining are genuinely obscure).
- **Session 34**: Mexico content batches 1-2 (+32 moments, +11 stories, +3 entities covering Cristero War, Guadalupe, Day of Dead, Teotihuacán, Olmec, Chicxulub, Monte Albán, Monarchs). Fractal Zoom Roadmap: designed 5-phase plan with AI review synthesis (Gemini, ChatGPT, Deepseek). Built `scripts/score-moments.ts` — notability scoring using Wikipedia pageviews (log10 scale) + primary moment logic + entity slug comparison + manual override support. Fixed 3 bugs during development (rate limiting, story-first slug bias, URL double-encoding). Output: 601 moments scored, distribution S=6/A=80/B=68/C=332/D=112/Archive=3. Validated top 20 includes Jesus, Gandhi, Shakespeare, Lincoln, MLK alongside true crime (known bias, Phase 1 correction planned). Net: 601 moments, 195 stories, 211 entities, 23 collections.
- **Session 35**: AI council review (Gemini, ChatGPT, DeepSeek round 3). Validated v0.2 composite scoring. Designed compression fix (sitelinks curve recalibration + threshold shift). Expert council designed map lenses concept (Story Map, Near Me, Themes, Deep Archive). Density heatmap earmarked for Phase 2.5.
- **Session 36**: Phase 0C complete (sitelinks 38→46, tier thresholds shifted). Phase 1 complete (types + 601 moments scored). Phase 2 started (zoom-based filtering in MapView). Created `src/lib/notability.ts`.
- **Session 37**: Phase 2 complete (zoom filtering in both MapView + ExplorePanel, "zoom in to see more" panel UX, category filter threshold lowering, story/entity bypass). Built and validated at all zoom levels.
- **Session 38**: Phase 2.5v1 (leaflet.heat heatmap) built but rejected by user as "too blobby." Phase 2.5v2 (continuous opacity ramp) deployed to Vercel but user said "looks almost the same." Expert council + AI council convened — diagnosed core issue: 601 individual dots will never be visually rich at world zoom; need different visual form at different zoom bands. Phase 2.5v3: Story Constellation Clusters built. New files: `src/lib/clustering.ts` (Supercluster engine), `src/lib/constellation.ts` (SVG donut ring generator). Complete MapView.tsx rewrite for cluster-aware rendering. Dependencies: supercluster 8.0.1. All modes verified (explore, story, entity, category filter, mobile). TypeScript + Vite builds clean.
- **Session 39**: Phase 2.5v4: User found opaque dark circles "overwhelming the map." AI council (Gemini, ChatGPT, DeepSeek) + expert council (Tufte, Jobs, Wales) all recommended: remove opaque fill, hide counts until hover, use transparency/glass effects. Built 4 visual variants with toggle switcher: Glass Portal (frosted `backdrop-filter: blur`, default), Glow (luminous outline ring), Depth (concentric rings), Classic (original baseline). Full constellation.ts rewrite with shared `buildRingSegments()`. CSS: per-variant animations, hover states, count overlay. MapView: variant state, VariantSwitcher component, TileSwitcher refactored into shared control container. All 4 variants verified on light + dark tiles. Key decision #17.
- **Session 40**: Built 3 new map variants (Wisps, Essence, Emergence). Story ranking by notability in Stories tab. Duplicate entity fix. UX improvements. Emergence mode renders all 602 moments as canvas dots at every zoom level — bypasses clustering entirely.
- **Session 41**: Content audit completion + mobile context fix. Stories→collections dual-presence migration (7 stories). Two map navigation bug fixes (scroll-to-top fitBounds, entity zoom-out). Content fixes: 5 entity description stubs fleshed out, 6 subtitle overlaps rewritten, 4 entity "Born [real name]" openings frontloaded. **Mobile descriptions shipped**: StoryCard and PersonCard now show 1-line truncated descriptions on mobile, solving the "contextless cards" problem. Full audit: 195/195 story descriptions and 206/210 entity descriptions pass frontloading test. Content guide updated with mobile frontloading guidance and "Born [real name]" anti-pattern.
