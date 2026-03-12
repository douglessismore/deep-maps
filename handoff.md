# Deep Maps — Session Handoff (Updated Mar 12, 2026, Session 32)

> **Structure note**: Living snapshot. Main sections = current state. Historical decisions in Key Decisions table.

## Current State

### App
- **~570 moments**, **~57 stories**, **~204 entities**, **23 collections** in static TypeScript data files
- **8 story categories**: dark-history, last-stands, discovery-science, arts-culture, mystery-unexplained, political-drama, everyday-extraordinary, sacred-history
- Architecture: Moments-First model — moments.ts, entities.ts, stories.ts (StoryMoment[] references), collections.ts (momentIds[])
- MomentKind taxonomy: `'event' | 'milestone' | 'presence'` (optional, defaults to event)
- Dev server: `cd deep-maps && npx vite --host --port 5174`
- Build check: `npx tsc -b` (NOT `tsc --noEmit` — tsc -b is stricter, matches Vercel)

### What Changed This Session (32)

**1. Full Content Naming Audit — completed, rewrite deferred**
- Audited all ~495 moments against the verb-first/event naming standard
- **Biblical events (57 moments): CLEAN.** Every one uses headline present describing a specific event. Zero violations.
- **Sacred pilgrimage sites: 5 of 23 violate** — describe ongoing activities ("Hindus Bathe...", "Millions Circle the Kaaba...", "Pilgrims Walk...", "Pilgrims Complete...", "Four Religions Venerate...")
- **Meteorite craters: 10 of ~20 violate** — describe what a place IS now ("A Crater Sits in the Arizona Desert", "The Largest Impact Crater Lies Beneath South African Farmland")
- **Austin/Texas: 2 violations** — "Charlie's Playhouse Draws..." and "Longhorn Fans Gather..."
- **Total: 17 moments need rewriting** (not hundreds as feared)
- **Decision: Strict event-only.** All 17 will be reframed as historical events. Deferred to its own dedicated session.

**2. City Clusters: London, Rome, Paris, Tokyo** (commit faf376a)
- 55 new moments across 4 cities, each with 15 curated "what happened here" events
- 12 new stories (3 per city): Crown & Scaffold, Under Fire, Great Stages (London); Rise & Fall, Renaissance Masters, Modern Rome; French Revolution, Capital of Culture, Under Fire (Paris); Edo to Tokyo, Under Fire, Postwar (Tokyo)
- 17 new entities including Newton, Churchill, Victoria, Michelangelo, Nero, Marie Antoinette, de Gaulle, Tokugawa Ieyasu, Mishima
- 4 new city collections

**3. Notable People Batch 2** (commit 01032b7)
- 20 new moments: Darwin (Galápagos), Beethoven (Vienna), Marx (London), Luther (Wittenberg), Frida Kahlo (Mexico City), Picasso (Paris), Hemingway (Key West), Twain (Missouri), Dickens (London), Nightingale (Istanbul), Freud (Vienna), Joan of Arc (Rouen), Gutenberg (Mainz), Earhart (Pacific), Tesla (Long Island), Copernicus (Poland), Hamilton (NJ), Tubman (Maryland), Pasteur (Paris), Cleopatra (Alexandria)
- 4 new stories, 20 new entities, 1 new collection

**4. Content Styling Guide Created + Rewritten** (`content-guide.md`)
- First draft created, then comprehensively rewritten based on user feedback (605 lines)
- Expert council: Tim Urban (content voice) + Rand Fishkin (content strategy) added as content sub-council
- 12 sections + 3 appendices: naming rules, metadata fields, complete UI card reference, data wiring rules, stories vs collections distinction, audit checklist
- Flagged 4 stories that should be collections: historys-bravest, rome-renaissance-masters, london-under-fire, scientific-minds-2
- Mobile-first rule: name field must work alone (descriptions hidden on mobile)
- Entity "Caravaggio problem" documented: frontload-the-hook rule for entity descriptions
- Common failure patterns identified and documented with fixes
- Appendices: unused fields (moment.date, moment.kind, moment.links, collection.description not rendered), terminology consistency

**5. Panel/Card UX Concern Flagged**
- With ~570 moments, the Stories panel is just a random list of whatever is in the map viewport
- No ordering logic, no grouping, no hierarchy — feels disorganized at scale
- Needs a UX design pass: sort by relevance/distance? Group by category? Progressive disclosure?
- Deferred to its own session — requires design decisions before implementation

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
**Priority: HIGH** — 4 items currently coded as stories that should be collections:
- `historys-bravest` — subjective label, curated list, no narrative arc
- `rome-renaissance-masters` — list of artists, no narrative thread
- `london-under-fire` — list of disasters, no connecting narrative (also: vague name)
- `scientific-minds-2` — list of scientists across centuries, no arc
Also review: `artists-writers-immortal`, `revolutionaries-pen-pulpit` (same pattern)
**Action**: Move from stories.ts to collections.ts, retype, rewire momentIds.

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

1. **CONTENT QUALITY AUDIT** — Apply content-guide.md to ALL existing moments. Fix early-session content (Gein, Rosa Parks, etc.) that fails the five-second test. This is the highest priority — bad content undermines everything else. Includes:
   - a. Rewrite 17 present-tense moments (5 pilgrimage + 10 craters + 2 Austin)
   - b. Refactor 4-6 stories→collections (historys-bravest, rome-renaissance-masters, london-under-fire, scientific-minds-2, possibly artists-writers-immortal, revolutionaries-pen-pulpit)
   - c. Apply five-second test to ALL ~570 moment names
   - d. Verify data wiring (entityIds, story membership, collection membership)
2. **Panel UX redesign** — Dedicated session. Card sorting/grouping/hierarchy for Stories panel at scale. Consider: distance sort, category grouping, progressive disclosure.
3. **Pin density: zoom-based filtering or clustering** — Implement progressive disclosure at world zoom
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
