# Deep Maps Content Guide v3

> **Purpose**: The definitive editorial standard for all Deep Maps content. Every moment, story, entity, and collection must conform to this guide. Used for both human authoring and LLM-assisted content generation.
>
> **Supersedes**: content-guide.md (v1), content-guide-prompt.ts (v2)

---

## Part 1: Core Principles

### The Five-Second Test

Every card must be understandable by a stranger who has never used the app within five seconds of reading it. If the moment name requires context from the story, entity, or description to make sense, it fails.

### The "So What?" Test

After reading the name and subtitle, would a user tap to read more? If the answer is "I get it, but why should I care?" -- rewrite. Stakes, irony, or a surprising detail must be present.

### Tone: Information-Dense, Awe-Invoking

- Sentences are declarative and information-dense. Encyclopedic clarity.
- When a fact is surprising, state it plainly and let the reader react. Never use breathless modifiers to tell the reader something is impressive. Show it with specifics.
- No first person, no opinion. "The greatest [X] in history" is acceptable as commonly agreed fact; "I think this was important" is not.

### The Specificity Rule

When tempted to write a generic statement about significance, replace it with the specific fact that proves the significance. Let the reader draw the conclusion.

- Bad: "Einstein's theory changed the course of physics forever"
- Good: "Einstein's theory predicted that gravity bends light -- confirmed four years later when stars shifted position during a solar eclipse"
- Bad: "She left an indelible mark on science"
- Good: "She remains the only person to win Nobel Prizes in two different sciences"

### Strotability (Story-Trotting Potential)

Prefer moments and stories that intersect with other stories, people, places, and entities. A moment is "strotable" when a reader can trot from it into multiple other timelines. The more connections a moment has, the more it rewards exploration.

- **High strotability**: Einstein signs the Roosevelt letter (connects to Szilárd, FDR, Manhattan Project, Los Alamos, Oppenheimer, Hiroshima, Nagasaki, the Cold War)
- **Low strotability**: Einstein receives an honorary degree (connects to nothing beyond Einstein himself)

When choosing which moments to include for a person, place, or event, prefer moments that create intersections. Every pin should ideally connect to at least one other entity, story, or place entity in the database. Dead-end pins — moments with no outward connections — are the lowest value content.

**For density**: Optimize for walkable areas. Three pins on one downtown block are more valuable than three pins spread across three suburbs. Someone physically strolling through a neighborhood should encounter a rewarding density of pins.

### Attribution for Uncertain Claims

If the Wikipedia source hedges a claim ("reportedly," "allegedly," "according to tradition"), preserve that hedging in the description. Do not present uncertain claims as established fact.

- Good: "Adams's reported last words were 'Thomas Jefferson survives'"
- Bad: "Adams's last words were 'Thomas Jefferson survives'"

---

## Part 2: Field Roles

This is the structural heart of the guide. Each field has a single job. No field should duplicate another's purpose.

### 2.1 Moment Names

**Role**: Encyclopedic headline. What happened, stated plainly.

**Rules**:

1. **VERB-FIRST, EVENT-BASED** -- Describe what happened, not what the place is.
2. **SELF-EXPLANATORY** -- Zero context required. A user with no prior knowledge must understand the core event.
3. **ENCYCLOPEDIC HEADLINE** -- State the event plainly. No editorial flourish in the name. Save hooks for the subtitle.
   - Good: "Einstein Publishes Four Papers That Rewrite Physics"
   - Bad: "A Patent Clerk's Miracle Year Overturns Classical Physics"
4. **SPECIFICITY IS THE HOOK** -- Numbers, names, concrete details create curiosity.
   - Bad: "A Fire Destroys London"
   - Good: "A Baker's Oven Starts a Fire That Destroys 13,200 Houses in Four Days"
5. **HEADLINE PRESENT TENSE OK** -- "Caesar Is Stabbed", "Jesus Feeds Five Thousand" (these describe specific one-time events).
6. **NO ONGOING ACTIVITIES** -- "Hindus Bathe..." or "Pilgrims Walk..." is banned. Reframe as founding or origin event.
7. **NO PLACE NAMES AS TITLES** -- "The Empire Theatre Bus Stop" is banned. Describe the event that happened there.
8. **NO SENSATIONALIZED FRAMING** -- Name the event from the subject's perspective, not from a journalist's angle. Do not center bystanders, audiences, or outsiders as the headline actors when the subject is the venue, person, or institution.
   - Bad: "Charlie's Playhouse Draws White Students Across Segregation Lines" (centers white students)
   - Good: "Charlie's Playhouse Becomes Austin's First Integrated Music Venue" (centers the venue)
9. **LEAD WITH THE PERSON, NOT THEIR DEMOGRAPHIC** -- When a moment is about a notable person's achievement, lead with their name and the event. Race, gender, and identity context belongs in the subtitle or description.
   - Bad: "First Southern Black Congresswoman Buried Among Texas Elite"
   - Good: "Barbara Jordan Is Interred at the Texas State Cemetery"
10. **PLACE SPECIFICITY IS THE PRODUCT** -- Include the most specific verified location detail: the building, the street, the room. If we only know the city, say so, but never settle for vague when specific is available.
    - Bad: "Willie Nelson Is Born in Abbott, Texas"
    - Good: "Willie Nelson Is Born in a Two-Room House on First Street in Abbott, Texas"
11. **CULTURAL SENSITIVITY REVIEW** -- For moments involving race, religion, gender, colonialism, or indigenous peoples, apply extra scrutiny. The name should be factually neutral. When in doubt, describe the event from the perspective of the community it happened to, not from an outsider's gaze.

**Length**: Target 50-80 chars. Max 120 chars.

### 2.2 Moment Subtitles

**Role**: Place and visit annotation. Address, what remains today, what to look for if you visit.

This is a major change from v2. Subtitles no longer carry the editorial hook -- that job is now handled by the name's specificity and the description's opening line. Subtitles anchor the reader to the physical place.

**Rules**:

1. **BE AS SPECIFIC AS PHYSICALLY POSSIBLE** -- Pin the reader to the exact point on the ground. Not just the building, but the floor, the room, the corner, the wing. "NE corner of the 2nd floor" is better than "the building." If you know the room number, use it. If you know which window he looked out of, say so. The subtitle should make a visitor feel they could stand on the exact spot.
2. **INCLUDE THE SPECIFIC ADDRESS WHEN KNOWN** -- Street address, building name, or precise location.
3. **NOTE WHETHER ORIGINAL STRUCTURES STILL STAND** -- "The building still stands", "Demolished in 1945", "Now a parking lot".
4. **TIPS FOR FINDING THE EXACT SPOT** -- What to look for if you visit: plaques, markers, architectural features.
5. **ONE SENTENCE OR TWO SHORT ONES** -- No period at end if a single sentence.
6. **NEVER REPEAT THE NAME** -- Add new information only.
7. **NEVER USE EDITORIAL HOOKS** -- No narrative teasers, literary descriptions, or dramatic language. This is a place annotation, not a headline.

**Examples**:

- "Speichergasse 2, Bern. The building still stands. Einstein worked on the second floor."
- "Ford's Theatre, 511 10th St NW, Washington. The theater is now a museum and active playhouse"
- "The house at 112 Mercer St, Princeton, is now private but marked with a plaque"
- "Corner of Milk and Congress Streets, Boston. A plaque marks the site"
- "Room 1E455, Building 1, Bell Labs, Murray Hill NJ. The building is now Nokia Bell Labs"
- "NE corner of the 2nd floor, Villa Griffone, Pontecchio Marconi. Now a museum"

**Anti-examples** (these are WRONG):

- ❌ "A fratricide over where to build a city creates the eternal empire" (editorial hook, not a place)
- ❌ "The shot heard round the world" (narrative teaser)
- ❌ "Where it all began" (vague, no place info)

**Length**: Target 60-120 chars. Max 140 chars.

### 2.3 Moment Descriptions

**Role**: The compact narrative. Place-grounded, factual, economical.

**Rules**:

1. **STANDALONE** -- Must make complete sense without any story, entity, or collection context.
2. **ANSWER THREE QUESTIONS** -- What happened? When exactly? Why does it matter?
3. **SENSE OF PLACE (CRITICAL)** -- Every description must include at least one physical or sensory detail about the location itself. The reader should feel WHERE this happened. Use "here" to anchor the reader to the place.
   - Good: "In the rented second-floor parlor of bricklayer Jacob Graff's house on Market Street..."
   - Good: "Einstein was born here on 14 March 1879, in a two-story house on Bahnhofstrasse"
   - Bad: "In Paris, France, Dali met Picasso" (no sense of place)
4. **INCLUDE SPECIFIC DATES** -- Use DD Month YYYY format. Include month and day when known. The year appears on cards as metadata, but full dates only exist in description text. Dates add value even though the year is shown separately.
5. **SPECIFIC NUMBERS AND DETAILS** -- "100,000 people died" not "many people died".

**Opening Variety** -- Use at least 3 different opening patterns across a person's moments. Do not always start with "On [date]...":

1. Consequence-first: "The document that founded American democracy was written by a 33-year-old in a rented room."
2. Place-first: "In the second-floor parlor of a Philadelphia bricklayer's house, Thomas Jefferson..."
3. Surprising detail: "Nobody expected nine dollars to buy literary immortality."
4. Date-first (use sparingly): "On 17 March 180, Marcus Aurelius died..."
5. Person-first: "Thomas Edison, deaf in one ear since childhood, pressed his teeth against the phonograph..."

**Ending Rule** -- End with legacy or irony. The final sentence test: would a reader quote this to a friend? If not, it is not strong enough. End with a specific, surprising fact -- not a generic summary like "cemented his reputation" or "changed the course of history."

**Length**: Target 350-450 chars. Never exceed 500 chars. If a draft is over 450, cut a clause. Brevity forces better writing.

### 2.4 Entity Descriptions

**Role**: Consolidated identity card. The entity description is the single description field for a person, place, or organization.

**Rules**:

1. **FIRST 8 WORDS = THE HOOK** -- Mobile shows a 1-line truncated description. Those 8 words must work as a standalone tagline.
   - Good: "The painter who killed a man and fled Rome forever"
   - Bad: "Michelangelo Merisi da Caravaggio was an Italian painter..."
2. **NEVER OPEN WITH "Born [real name]..."** -- This wastes the mobile-visible line on a name nobody recognizes.
   - Bad: "Born Samuel Clemens, he became America's greatest humorist..."
   - Good: "America's greatest humorist and the voice of the Mississippi River..."
3. **THEN 2-3 KEY FACTS** -- The things you would tell someone at a dinner party.
4. **END WITH A MEMORABLE DETAIL** -- The humanizing fact that sticks.
   - "Died alone in a New York hotel room"
   - "His face -- via the V for Vendetta mask -- became the global symbol of anti-establishment protest"

**Length**: Target 200-350 chars. Max 400 chars.

### 2.5 Story Names

Naming conventions vary by story type:

| Story Type | Naming Rule | Example |
|---|---|---|
| biography | Canonical name only. Wikipedia standard. No taglines. | "Albert Einstein", "Harriet Tubman" |
| incident | Factual event name. No editorial framing. | "The JFK Assassination", "The Trinity Test" |
| era | Encyclopedic. Not editorial. | "The French Revolution", "The Cristero War" |
| place | Should not exist as stories. These should be place entities. | Convert to entity type "place" |

**Anti-patterns**:
- "A Patent Clerk's Miracle Year" -- editorial framing. Use "Albert Einstein".
- "Paris Under Fire" -- vague and editorialized. Use "The Great Fire of Paris" or specific incident name.
- "London's Crown and Scaffold" -- poetic but unclear. Use "The Tower of London" (as place entity) or name the specific event.

### 2.6 Story Descriptions

**Role**: Book jacket blurb. Tell the user what they will find if they click.

**Rules**:

1. **LIST 3-4 MOST DRAMATIC MOMENTS IN VIVID SHORTHAND** -- Not vague summaries. Namecheck specific events.
2. **FIRST ~60 CHARS SERVE AS SUBTITLE PREVIEW** -- The app truncates on mobile. Front-load the hook.
3. **END WITH A CATEGORY STATEMENT** -- What ties the moments together.

**Example**: "A mob tears down a fortress, a queen rides an open cart to the guillotine, and an artillery officer takes the crown from the Pope's hands."

**Length**: Target 150-250 chars.

---

## Part 3: Quality Standards

### 3.1 Geo-Accuracy

Coordinates must be verified against known addresses. The accuracy field must honestly reflect confidence:

| Value | Meaning | When to Use |
|---|---|---|
| `exact` | Specific building or site confirmed | Only when the building/site is confirmed. You could walk there with the pin as a guide. |
| `approximate` | Within a block or two | Location is narrowed to a block but the exact structure is uncertain. |
| `general-area` | City or neighborhood level | We know the city/neighborhood but not the specific spot. |

**Rule**: Prefer `approximate` over a wrong `exact`. A pin on the wrong building is worse than a pin in the right neighborhood. When in doubt, downgrade accuracy and note the uncertainty in the subtitle or description.

**Verification**: Cross-check coordinates against the address field. If the address says "511 10th St NW, Washington" but the coordinates point to 12th Street, the coordinates are wrong.

### 3.2 Em-Dash Usage

Use em-dashes sparingly. Only for parenthetical asides, not for dramatic effect. Maximum one em-dash per description.

- Acceptable: "Einstein -- deaf in one ear since a childhood illness -- pressed his teeth against the phonograph"
- Not acceptable: "The theory was published -- and the world changed -- forever -- nothing would be the same"
- Not acceptable: Using em-dashes as dramatic flourish or as a substitute for periods

### 3.3 Tour Guide Voice

Content may be used in AR, VR, and audio contexts. The "here" anchoring in descriptions ("Einstein was born here on 14 March 1879") supports this use case. However, the default text voice remains factual and encyclopedic. Do not write in second person ("you can see...") or adopt a tour-guide persona. The physical grounding should come from descriptive detail, not from addressing the reader.

### 3.4 Date Format

All dates in descriptions use DD Month YYYY format:

- "17 March 180" not "March 17, 180"
- "4 July 1776" not "July 4, 1776"
- "14 March 1879" not "March 14th, 1879"

Include month and day when known. Do not redundantly open with just the year ("In 1789...") since the year is already shown in card metadata.

### 3.5 Structural Rules

These rules prevent content sprawl and keep the data model clean.

1. **Single-moment stories are not stories.** A single moment is just a moment. Don't create story wrappers for individual moments — they add navigation overhead with zero narrative value.

2. **City-level aggregations are not stories or collections.** "History of London" or "History of Tokyo" are not valid stories or collections. The map's viewport filtering and timeline handle city-level browsing natively. City aggregations duplicate functionality that the UI already provides.

3. **Check for overlap before creating a collection.** Before creating a new collection, search existing collections by keyword. If an existing collection already covers the theme (e.g., "Famous Battlefields" already includes ancient, medieval, WWI, and WWII battles), do not create a sub-collection. Add moments to the existing collection instead.

4. **Use the most common or official name.** If a story has an established name people already reference (a Wikipedia article title, a historical term of art, or an official designation), use that. Don't invent a literary alternative. "Free State of Galveston" not "When Galveston Was the Gambling Capital of the South." "Tulsa Race Massacre" not "The Day Black Wall Street Burned." Easy reference beats clever framing.

5. **Collections must have a specific, listable theme.** Every collection name should work as a Wikipedia "List of..." article. Generic themes like "Famous X," "Great Y," or "Notable Z" are too weak. The reader should know exactly what's in the collection before opening it. Good: "Every Place a Nuclear Weapon Has Been Detonated." Bad: "Famous Historical Figures."

---

## Part 4: Metadata Vocabulary

All type values must match the database schema exactly.

### moment.type

Use these exact values:

`archaeological_site`, `art_installation`, `battlefield`, `biblical_event`, `burial`, `burial_site`, `crash_site`, `crime_scene`, `cultural_site`, `cultural_venue`, `disaster`, `discovery_site`, `government`, `haunted_site`, `historic_meeting`, `historical_site`, `industrial_site`, `institution`, `landmark`, `military_site`, `monument`, `natural_site`, `organization_hq`, `political_event`, `religious_site`, `residence`, `settlement_site`, `university`, `workplace`

Do not invent new types without checking this list first.

### moment.importance

| Value | Pin Size | When to Use |
|---|---|---|
| `major` | 14px | Globally significant. A well-read person has heard of this. |
| `minor` | 10px | Regionally or thematically significant. |
| `contextual` | 7px | Supporting detail. Makes sense within a story but would not stand alone. |

Rule of thumb: If a user zoomed into the area for the first time with no context, would they click this pin? `major` = yes, `minor` = maybe, `contextual` = only if they are already in the story.

### moment.accuracy

| Value | Dot Color | When to Use |
|---|---|---|
| `exact` | Green | Pin drops at the specific building/site. Verified against known address. |
| `approximate` | Yellow | Within a block or two of the actual location. |
| `general-area` | Orange | City/neighborhood level only. |

### moment.kind

| Value | When to Use |
|---|---|
| `event` | Dramatic happening (default) |
| `milestone` | Life event: birth, death, marriage |
| `presence` | Ongoing association with a place |

**Writing `presence` moments:** A person attending a school, living in a house, or working at a factory for years is a valid moment — don't skip it just because it spans time rather than a single day. But the description must still be atomic: focus on what this place meant for this person's story. Lead with the most specific, interesting fact about the association rather than a generic summary.

- GOOD: "Oppenheimer spent 14 years at the Institute for Advanced Study, where he championed interdisciplinary work and hosted Einstein for daily walks. His office on the second floor overlooked the deer meadow."
- BAD: "Oppenheimer worked at the Institute, contributed to physics, advised the government, and was stripped of his security clearance" (that's 4 events, not one presence).

The key test: if the description covers events that happened at OTHER places, it's too broad. A presence moment describes what happened HERE.

Not displayed in UI. Backend metadata only.

### moment.verificationLevel

| Value | When to Use |
|---|---|
| `verified` | Multiple independent historical sources confirm the core event |
| `documented` | Historical record exists, details may be disputed |
| `traditional` | Faith-based, not empirically testable |
| `legendary` | Folklore, unverified claims |

### story.category

`dark-history`, `battles-conflicts`, `discovery-science`, `arts-culture`, `mystery-unexplained`, `political-drama`, `everyday-extraordinary`, `sacred-history`

### story.storyType

| Value | Displays As | When to Use |
|---|---|---|
| `incident` | *(hidden)* | A specific event or crime. Default type. |
| `biography` | "Biography" | A person's life story told through places. |
| `place` | "Place" | A location's history. |
| `era` | "Era" | A time period or movement. |

### moment.year

- Required for all moments.
- Use negative numbers for BCE: `year: -753` for 753 BCE.
- Used for timeline positioning and sorting.

---

## Part 5: Data Wiring Rules

Bad wiring makes content invisible in the UI. These are non-negotiable.

### Every moment MUST have:
- At least one `entityId` referencing an existing entity
- Membership in at least one story's `moments[]` array
- Membership in relevant collection's `momentIds[]` array (if part of a thematic group)

### Every entity MUST have:
- A `canonicalStoryId` pointing to a real story
- A `wikipediaSlug` (enables "Read on Wikipedia" link)
- At least one moment referencing it via `entityIds`

### Every story MUST have:
- At least one `relatedStoryId` (populates "Dive Deeper" section)
- A `wikipediaSlug` (enables Wikipedia tab in StoryPanel)
- Its `moments[]` array ordered chronologically or narratively

### Why wiring matters:
- GoDeeperCards only appear if wiring exists -- no `entityIds` = no "Dive Deeper" for that moment.
- Intersection counts on cards ("3 moments, 2 stories") are auto-calculated from wiring.
- Cross-referencing is what makes the app feel connected vs. like a flat list.
- Without full wiring, ingested content is invisible in half the navigation paths.

---

## Part 6: Style Decisions (Locked In)

| # | Decision | Rule | Rationale |
|---|---|---|---|
| 1 | Tense | Headline present for events ("Caesar Is Stabbed") | News headline convention; creates immediacy |
| 2 | Naming | Strict event-only. Every pin is a verb. | App identity is "what happened here" |
| 3 | Notability bar | Globally recognizable OR the one-liner hooks you | Obscure names are fine if the event description is self-explanatory |
| 4 | Tone | Information-dense, awe-invoking specificity | Encyclopedic clarity. Let surprising facts speak for themselves. |
| 5 | Content type | All moments = specific historical events | No ongoing activities, no place descriptions |
| 6 | Mobile priority | Name + first ~8 words of description must work together | Mobile shows 1-line truncated description |
| 7 | Entity hook | First 8 words = tagline. Never open with "Born [real name]" | Those 8 words are the mobile experience |
| 8 | Story vs Collection | Stories = narrative arcs. Collections = curated lists. | If you can rearrange items without losing anything, it's a collection |
| 9 | Story naming | Wikipedia article title style | Canonical, specific, recognizable |
| 10 | Dates in descriptions | Include month/day using DD Month YYYY | Year shown as metadata, but full date only exists in description text |
| 11 | Moment subtitles | Place/visit annotation, not editorial hook | Subtitles anchor to the physical place. Hooks live in names and descriptions. |
| 12 | Em-dashes | Sparingly. Parenthetical asides only. Max 1 per description. | Prevents breathless, over-punctuated prose |
| 13 | Geo-accuracy | Prefer approximate over wrong exact | A pin on the wrong building is worse than a pin in the right neighborhood |

---

## Part 7: Banned Phrases and Anti-Patterns

### Banned Phrases

Never use these in any field:

- "changed the course of history"
- "left an indelible mark"
- "cemented his/her reputation"
- "the world would never be the same"
- "little did he/she know"
- "it was here that..."
- "this [place] would go on to..."
- "a pivotal moment in history"
- "forever altered the landscape of"
- "one of the most important [X] in history"

Replace every one of these with the specific fact that proves the claim. Show, don't tell.

### Common Failure Patterns

1. **"Insider Knowledge Required"** -- Content assumes the reader already knows who or what is being discussed.
   - "Young Ed Gein Laughs Alone at Plainfield School" -- requires knowing Gein is a serial killer.

2. **"Place Name Masquerading as Event"** -- The moment name is a location, not something that happened there.
   - "The Empire Theatre Bus Stop" -- should describe Rosa Parks's refusal.

3. **"Vague Activity, Not Specific Event"** -- The name describes something that happened repeatedly, not a specific moment.
   - "Hindus Bathe in the Sacred Ganges" -- when? Which time?

4. **"Too Clever, Not Clear Enough"** -- The name tries to be poetic or mysterious at the expense of clarity.
   - "Where a Refusal to Move Changed the Direction of America" -- only works if the name told you what the refusal was.

5. **"Dead-weight Opening"** -- Entity description opens with formal biographical filler instead of the hook.
   - "Michelangelo Merisi da Caravaggio was an Italian painter..."

6. **"No Sense of Place"** -- Description could have happened anywhere. No physical detail of the location.
   - "In Paris, Dali met Picasso" -- which building? What did it look like?

7. **"Vague Significance"** -- Uses generic claims instead of the specific fact that proves it.
   - "Changed the course of history" instead of stating what actually changed.

8. **"Monotonous Openings"** -- Every description starts with "On [date], [person]..."

9. **"Whimper Ending"** -- Last sentence is a generic summary instead of a memorable fact.
   - "...cemented his reputation as one of the greatest scientists of all time."

10. **"Em-Dash Cascade"** -- Multiple em-dashes used for dramatic rhythm instead of conveying information.
    - "The building -- once a palace -- now a ruin -- stood as testament to..."

11. **"Subtitle Repeats the Name"** -- Subtitle rephrases the name instead of adding place or visit information.

12. **"Wrong Exact"** -- Coordinates marked as `exact` but pointing to the wrong building or a demolished site without noting the discrepancy.

13. **"Editorial Headline"** -- Moment name uses editorial framing instead of stating the event plainly.
    - "A Patent Clerk's Miracle Year Overturns Classical Physics" instead of "Einstein Publishes Four Papers That Rewrite Physics"

---

## Part 8: Character Limit Reference

| Field | Target | Max | Hard Reject |
|---|---|---|---|
| Moment name | 50-80 chars | 120 chars | Over 120 |
| Moment subtitle | 60-120 chars | 140 chars | Over 140 |
| Moment description | 350-450 chars | 500 chars | Over 500 |
| Entity description | 200-350 chars | 400 chars | Over 400 |
| Story description | 150-250 chars | 300 chars | Over 300 |

When a draft exceeds the target range, cut a clause. Do not compress by removing articles or making the prose telegraphic. Cut an entire thought instead.

---

## Part 9: Audit Checklist

### For every moment:

**Name**
- [ ] Verb-first, event-based (not a place name or ongoing activity)
- [ ] Self-explanatory to a stranger with zero context
- [ ] Encyclopedic headline, no editorial flourish
- [ ] Specific (numbers, names, concrete details)
- [ ] Under 120 characters
- [ ] Passes the five-second test

**Subtitle**
- [ ] Place/visit annotation: address, what remains, what to look for
- [ ] Does not repeat the name
- [ ] One sentence or two short ones, no trailing period if single sentence
- [ ] 60-120 characters

**Description**
- [ ] Standalone (makes sense without any story/entity context)
- [ ] Answers: What happened? When (specific date in DD Month YYYY)? Why does it matter?
- [ ] Includes sense of place (physical/sensory detail of the location)
- [ ] Uses "here" to anchor reader to the place at least once
- [ ] Encyclopedic tone (no breathless language, no opinions)
- [ ] Varied opening (not "On [date]...")
- [ ] Ends with legacy, irony, or a specific memorable fact
- [ ] No more than one em-dash
- [ ] 350-450 characters (never over 500)
- [ ] No banned phrases

**Metadata**
- [ ] `year` is set (negative for BCE)
- [ ] `type` uses a value from the standard vocabulary
- [ ] `importance` is appropriate (major/minor/contextual)
- [ ] `accuracy` is honest and verified against the address
- [ ] `verificationLevel` matches source confidence
- [ ] `address` is set and specific enough to find on a map
- [ ] Coordinates verified against the address

**Wiring**
- [ ] `entityIds` reference entities that exist
- [ ] Moment appears in at least one story's `moments[]` array
- [ ] Moment appears in relevant collection's `momentIds[]` array

### For every entity:

- [ ] First ~8 words work as a standalone tagline
- [ ] Does not open with "Born [real name]..."
- [ ] Contains 2-3 key facts after the hook
- [ ] Ends with a memorable humanizing detail
- [ ] 200-350 characters
- [ ] `canonicalStoryId` references an existing story
- [ ] `wikipediaSlug` is set and correct
- [ ] Referenced by at least one moment's `entityIds`

### For every story:

- [ ] Name follows the naming convention for its storyType (biography/incident/era)
- [ ] Is actually a narrative arc, not a curated list
- [ ] Description front-loads the hook in the first ~60 chars
- [ ] Description lists 3-4 specific dramatic moments
- [ ] 150-250 characters
- [ ] `moments[]` ordered chronologically or narratively
- [ ] `relatedStoryIds` point to real stories
- [ ] `wikipediaSlug` is set
- [ ] `category` matches the content

### For every collection:

- [ ] Name reads like "List of..." (user knows what's in it before clicking)
- [ ] `subtitle` does all the work (since `description` is not displayed)
- [ ] All `momentIds` reference real moments

---

## Appendix A: Expert Council

The editorial voice is guided by five reference points:

- **Jimmy Wales** -- Encyclopedic rigor, neutral tone, verifiability
- **Steve Jobs** -- Design simplicity, ruthless prioritization
- **Edward Tufte** -- Data visualization, information density
- **Tim Urban** -- Awe and curiosity about complex topics in plain, to-the-point language
- **Rand Fishkin** -- Content discoverability, what makes people click and stay

## Appendix B: Fields Not Displayed in UI

| Field | Status | Notes |
|---|---|---|
| `moment.date` | Not rendered | Formatted date string. Only `year` (number) is shown on cards. |
| `moment.kind` | Not rendered | Backend metadata only. |
| `moment.links` | Not rendered | LocationLink[] for affiliates/tours/sources. UI does not support it yet. |
| `collection.description` | Not rendered | Only `name` and `subtitle` appear on CollectionCards. |

## Appendix C: Work Entities

Entity type `work` covers films, TV shows, books, journals, religious texts, scientific papers, albums -- any notable work referenced by moments.

**Rules**:
- Only create when the work is referenced by 2+ moments (otherwise it is just a tag).
- Description follows entity hook-first rule (first 8 words = tagline).
- Use tags for subtype: `film`, `book`, `journal`, `scripture`, `paper`, `album`, `tv-show`.

## Appendix D: Deduplication Rules

When ingesting new content, the pipeline must check for existing entities, stories, and moments before creating new ones.

**Pre-flight checks**:
1. Entity check: Search by `wikipedia_slug` (canonical) and `name` (fuzzy).
2. Story check: Search for biography stories linked to that entity via `canonical_story_id`.
3. Moment check: Search by geographic proximity (same lat/lng +/- 0.01 degrees) AND year overlap AND name similarity.

**ID canonicalization**:
- Entity IDs: Use the Wikipedia slug as the canonical ID when possible.
- Story IDs: Use `{entity-id}` for biography stories. Only add suffixes for non-biography stories about the same entity.
- Moment IDs: Use `{entity-slug}-{event-keyword}-{year}` format.
