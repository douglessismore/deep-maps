# Deep Maps — Session Handoff (Updated Mar 13, 2026, Session 33c)

> **Structure note**: Living snapshot. Main sections = current state. Historical decisions in Key Decisions table.

## Current State

### App
- **569 moments**, **184 stories**, **208 entities**, **23 collections** in static TypeScript data files
- **8 story categories**: dark-history, last-stands, discovery-science, arts-culture, mystery-unexplained, political-drama, everyday-extraordinary, sacred-history
- Architecture: Moments-First model — moments.ts, entities.ts, stories.ts (StoryMoment[] references), collections.ts (momentIds[])
- MomentKind taxonomy: `'event' | 'milestone' | 'presence'` (optional, defaults to event)
- Dev server: `cd deep-maps && npx vite --host --port 5174`
- Build check: `npx tsc -b` (NOT `tsc --noEmit` — tsc -b is stricter, matches Vercel)

### What Changed This Session (33b)

**Critical Bug Fixes — Story suppression, entity panel contamination, UI**

User reported multiple issues on mobile: Stories tab only showing people (no story cards), entity panels showing unrelated moments (Tubman→Cleopatra), UI glitches. Investigation found two pre-existing root causes, neither caused by Session 33.

**1. Story Suppression Bug (THE BIG FIX)**
- `canonicalStoryIds` set in entityHelpers.ts collected ALL entity canonicalStoryIds (100 unique), hiding 52% of stories (95/184) from the Stories tab
- **Fix**: Changed to only suppress stories where `storyType === 'biography'` AND claimed by a person entity via `canonicalStoryId`
- Result: 31 suppressed (17%), 153 visible. Servant Girl Annihilator, Lincoln Assassination, all city stories now visible. True biographies (Ed Gein, O. Henry Life, Tubman, etc.) correctly suppressed.

**2. Entity Panel Contamination (32 entities)**
- 53 entities had `canonicalStoryId` pointing to omnibus "grab bag" stories (revolutionary-leaders, literary-titans, historys-bravest, etc.)
- Entity panel safety net pulled ALL moments from canonical story → Tubman showed Cleopatra, Bolivar showed Mao
- **Fix**: Removed all 53 omnibus canonicalStoryId references from entities.ts
- Deleted duplicate Harriet Tubman entity (overwriting correct one)
- Deleted Richard Linklater entity (below notability bar per user decision)

**3. Data & UI Fixes**
- Removed `mlk-clayborn-temple` and `mx-birthplace` from famous-assassinations collection
- Fixed EntityPanel over-scroll padding (40vh → h-16)
- Fixed Places tab back button label (was always "Stories", now infers "Places" from entity type)

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

### Geographic Distribution (unchanged from session 31)
| Region | Moments | Notes |
|--------|---------|-------|
| USA + Canada | ~260 | Still dominant, mostly Austin/Texas + serial killers + biographies |
| Middle East / N. Africa | ~80 | Biblical events + sacred sites + Avicenna |
| Mexico | ~58 | Unchanged |
| Western Europe | ~30 | Battlefields + notable people (London, Milan, Rome, Arles, Bern, Vienna, Paris, Prague) |
| Eastern Europe / Russia | ~15 | St. Petersburg, Yasnaya Polyana + nuclear tests |
| South America | ~6 | Bogotá, La Higuera, Santiago, Rio |
| South Asia | ~10 | Dandi, Santiniketan, New Delhi + sacred sites |
| East Asia | ~8 | Beijing, Qufu, Mongolia, Tokyo + nuclear tests |
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

### 🔴 STORY→COLLECTION REFACTORING (Part of Content Audit)
**Priority: HIGH** — 6 items currently coded as stories that should be collections:
- `historys-bravest` — subjective label, curated list, no narrative arc
- `rome-renaissance-masters` — list of artists, no narrative thread
- `london-under-fire` — list of disasters, no connecting narrative (also: vague name, Nelson funeral doesn't fit "under fire" theme). **Confirmed in Session 33 audit.**
- `london-great-stages` — disconnected cultural achievements, no narrative arc. **Confirmed in Session 33 audit.**
- `scientific-minds-2` — list of scientists across centuries, no arc
Also review: `artists-writers-immortal`, `revolutionaries-pen-pulpit` (same pattern)
**Action**: Move from stories.ts to collections.ts, retype, rewire momentIds. Must also update all entity `canonicalStoryId` references that point to converted stories.

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

### 🟡 CONTEXTLESS CARDS UX (Flagged Session 33c)
- Cards in Stories/People/Places tabs show names but lack mini-descriptions or subtitles for scannability.
- Related to the "Caravaggio problem" (item 7 in Next Steps) — obscure names have zero context.
- Design approach TBD — revisit in dedicated UX session.

### 🟡 STORY/BIOGRAPHY EDGE CASES
- `zodiac-killer` story has `storyType: 'incident'` but entity `zodiac-killer` exists → both story card and person card visible (minor duplicate, acceptable since the case is unsolved)
- `j-robert-oppenheimer` story has `storyType: 'incident'` but is functionally a biography → not suppressed. Could change storyType to 'biography' if desired.
- `bonnie-and-clyde`, `wright-brothers`, `lbj-lady-bird-austin` are joint biographies suppressed by the new logic — correct since person entities exist, but the joint narrative may add value beyond individual cards.

### 🟡 PIN DENSITY AT WORLD ZOOM
- At full world zoom, pins overlap into blobs (especially US cluster, Europe cluster, Middle East cluster)
- Need zoom-based progressive disclosure: show only `major` importance at low zoom, reveal `minor`/`contextual` as you zoom in
- Consider Leaflet.markercluster or custom zoom-level filtering
- This will become more urgent as we add more content

### 🟡 Performance Plan (from Session 26)
- Steps 2-3 (People-in-Stories, Collections 4th tab) COMPLETE
- Step 1 partially done: rAF throttle + panTo debounce done
- Still TODO: Differential marker updates in MapView (stable marker map instead of clearLayers rebuild), StoryPanel memoization

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

## Next Steps (Priority Order)

1. **BULK CONTENT QUALITY AUDIT** — Gold standards now established (Session 33). Apply content-guide.md to ALL ~569 remaining moments. Use the 3 gold standards as reference targets. Includes:
   - a. Rewrite 17 present-tense moments (5 pilgrimage + 10 craters + 2 Austin)
   - b. Refactor 6 stories→collections (historys-bravest, rome-renaissance-masters, london-under-fire, london-great-stages, scientific-minds-2, plus review artists-writers-immortal, revolutionaries-pen-pulpit)
   - c. Apply five-second test to ALL moment names (Gein-style rewrites where needed)
   - d. Verify data wiring: entityIds on every moment, canonicalStoryId on every entity, relatedStoryIds on every story
   - e. Importance differentiation: not everything should be major (London pattern: 12 major / 5 minor)
   - f. Fill entity wiring gaps across all city clusters (Rome, Paris, Tokyo likely have same gaps as London)
2. **Panel UX redesign** — Dedicated session. Card sorting/grouping/hierarchy for Stories panel at scale. Consider: distance sort, category grouping, progressive disclosure.
3. **Pin density: zoom-based filtering or clustering** — Implement progressive disclosure at world zoom (importance differentiation from audit will help)
4. **Roadtrip collections** — "History Along Route 66", "Pacific Coast Highway" (linear marker density through empty regions)
5. **Story connectivity audit** — Ensure no standalone moments lack parent stories (some nuclear test moments may be orphaned)
6. **MapView differential updates** — Performance optimization from Session 26 plan
7. **UX: mobile card descriptions** — Stories and People cards don't show descriptions on mobile compact mode. Entity "Caravaggio problem" (obscure names have zero context on mobile). May be addressed as part of Panel UX redesign.

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
