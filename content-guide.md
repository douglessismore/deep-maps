# Deep Maps — Content Styling Guide

> **Purpose**: Ensure every piece of content in Deep Maps is consistent, compelling, and self-explanatory. Used for both auditing existing content and creating new content.
>
> **Expert Council** (5 members):
> - **Jimmy Wales** — encyclopedic rigor, neutral tone, verifiability
> - **Steve Jobs** — design simplicity, ruthless prioritization
> - **Edward Tufte** — data visualization, information density
> - **Tim Urban** — invokes awe and curiosity about complex topics in plain, to-the-point language (content sub-council)
> - **Rand Fishkin** — content discoverability, what makes people click and stay (content sub-council)

---

## Core Principle: The Five-Second Test

**Every card a user sees must pass this test: Can a stranger who has never used the app understand what happened here within five seconds of reading it?**

If the moment name requires context from the story, entity, or description to make sense, it fails.

### Bad Examples (from our data)

| Current Name | Problem | Fix |
|---|---|---|
| "Young Ed Gein Laughs Alone at Plainfield School" | Who is Ed Gein? What does "laughs alone" mean? No event. | "Classmates Recall a Boy Who Laughed Alone — He Would Later Become America's Most Notorious Killer" |
| "Mary Hogan Disappears from Her Tavern" | Who? Why should I care? Even with "Ed Gein" in small text below. | "A Tavern Owner Vanishes — Her Skull Is Later Found in Ed Gein's Farmhouse" |
| "The Empire Theatre Bus Stop" | This isn't even a moment. It's a place name. | "Rosa Parks Refuses to Give Up Her Bus Seat and Launches the Civil Rights Movement" |

### Good Examples (from our data)

| Name | Why It Works |
|---|---|
| "A Baker's Oven Starts a Fire That Destroys 13,200 Houses in Four Days" | Instantly tells you WHAT, HOW BIG, and makes you want to know more |
| "Soldiers Catch Guy Fawkes Guarding 36 Barrels of Gunpowder Beneath Parliament" | Specific, dramatic, self-explanatory |
| "A Completely Deaf Beethoven Premieres His Ninth Symphony and Has to Be Turned Around to See the Applause" | The irony is the hook — you don't even need to know who Beethoven is |

---

## 1. MOMENT NAMES (The Most Important Field)

### Rules

1. **VERB-FIRST, EVENT-BASED** — Describe what happened, not what the place is
2. **SELF-EXPLANATORY** — A user with zero context must understand the core event
3. **SPECIFICITY IS THE HOOK** — Numbers, names, and concrete details create curiosity
   - Bad: "A Fire Destroys London"
   - Good: "A Baker's Oven Starts a Fire That Destroys 13,200 Houses in Four Days"
4. **HEADLINE PRESENT TENSE OK** — "Caesar Is Stabbed", "Jesus Feeds Five Thousand" (these describe specific one-time events)
5. **NO ONGOING ACTIVITIES** — "Hindus Bathe..." or "Pilgrims Walk..." is banned. Reframe as founding/origin event.
6. **NO PLACE NAMES AS TITLES** — "The Empire Theatre Bus Stop" is banned. Describe the event.
7. **INCLUDE THE "WHY CARE" SIGNAL** — If the person isn't universally famous, the name must hint at significance
   - Bad: "O. Henry Works at the Land Office" (who? why care?)
   - Better: Ensure the subtitle carries the hook if the name can't fit it

### Character Guidelines

| Field | Target Length | Max Length | Notes |
|---|---|---|---|
| `name` | 50-80 chars | 120 chars | Must work standalone. This is the headline. |
| `subtitle` | 60-100 chars | 140 chars | The "second hook" — adds irony, stakes, or context |
| `description` | 400-600 chars | 800 chars | Standalone mini-article. Answers: What? When? Why does it matter? |

### The Name-Subtitle Contract

The **name** tells you WHAT HAPPENED. The **subtitle** tells you WHY IT MATTERS or adds the emotional hook.

```
Name:     "Soldiers Catch Guy Fawkes Guarding 36 Barrels of Gunpowder Beneath Parliament"
Subtitle: "A Catholic conspiracy to blow up the king and the entire House of Lords is foiled at the last moment"
```

The name gives you the event. The subtitle gives you the stakes.

```
Name:     "Harriet Tubman Escapes Slavery and Returns Thirteen Times to Free Seventy More"
Subtitle: "An enslaved woman walks 90 miles to freedom, then goes back into the lion's den again and again"
```

Both are self-explanatory alone, but together they're irresistible.

---

## 2. MOMENT SUBTITLES

### Rules

1. **NEVER REPEAT THE NAME** — Subtitles add new information, not rephrase
2. **ADD STAKES, IRONY, OR HUMAN DETAIL** — The detail that makes you feel something
   - "A French swordsman is imported for the execution of a queen who failed to produce a male heir"
   - "The greatest composer in history conducts his masterpiece without hearing a single note"
3. **LOWERCASE START** (unless proper noun) — Reads as a continuation of the name
4. **ONE SENTENCE** — No periods. It's a teaser line, not a paragraph.

---

## 3. MOMENT DESCRIPTIONS

### Rules

1. **STANDALONE** — Must make complete sense without ANY other context (no story, no entity, no collection)
2. **ENCYCLOPEDIC TONE** — Wikipedia's matter-of-fact clarity. Tim Urban's to-the-point specificity. Information-dense, not breathless.
3. **ANSWER THREE QUESTIONS**: What happened? When exactly? Why does it matter?
4. **INCLUDE THE SPECIFIC DATE** — The `moment.date` field is NOT displayed in the UI. Only the `year` number appears on cards. So descriptions are the ONLY place users see "July 14, 1789" vs just "1789." Include month/day when known. Don't redundantly open with just the year ("In 1789...") since that's already shown in card meta.
5. **SPECIFIC NUMBERS AND DETAILS** — "100,000 people died" not "many people died"
6. **END WITH LEGACY OR IRONY** — The last sentence should give the reader a reason to remember this
   - "She was declared a saint by the Catholic Church in 1920"
   - "Dickens earned less than he hoped, but he had permanently altered Western culture"
7. **NO FIRST PERSON, NO OPINION** — "The greatest [X] in history" is acceptable as commonly agreed fact; "I think this was important" is not

### Structure Template

```
[Opening: Specific date/month/day + context] + [What happened: the event in detail] +
[Key details: numbers, names, consequences] + [Closing: legacy, irony, or lasting impact]
```

### Length

- **Target**: 400-600 characters (~3-5 sentences)
- **Max**: 800 characters
- **Min**: 300 characters (if shorter, you're probably missing the "why it matters")

---

## 4. STORIES vs COLLECTIONS (Critical Distinction)

### Stories = Narrative Arcs

A story is a **narrative thread** — moments that are ordered and tell a story with a beginning, middle, and end (or at least a clear thematic arc through time).

**Test**: Do the moments have a chronological flow? Would someone want to read them in order? Is there a protagonist or through-line?

✅ Story examples:
- "The Lincoln Assassination" — one event, multiple locations, clear narrative
- "Ed Gein" — biography with chronological moments
- "The French Revolution" — 1789→1793→1804, clear arc from revolt to empire

### Collections = Curated Lists

A collection is a **curated set of pins** — related moments grouped by theme, geography, or category. No narrative ordering required.

**Test**: Is this just a list of interesting things that share a trait? Could you rearrange the items without losing anything?

✅ Collection examples:
- "History of London" — curated list of London's greatest hits
- "Nuclear Weapon Detonation and Test Sites" — related pins, no narrative
- "Famous Assassination Sites" — same theme, different stories

### Things Currently Coded as Stories That Should Be Collections

| Current Story | Problem | Should Be |
|---|---|---|
| "History's Bravest" | Subjective label. Curated list of brave people, no narrative arc. | Collection |
| "Rome's Renaissance Masters" | List of artists. No narrative thread. | Collection |
| "London Under Fire" | List of disasters. No connecting narrative. | Collection (or rename to something canonical) |
| "Scientific Minds That Changed Everything" | List of scientists across centuries. No arc. | Collection |

### Story Names

Story names should read like **Wikipedia article titles** or book chapter headings — canonical and specific.

| Good (Wikipedia-style) | Bad (vague/subjective) |
|---|---|
| "The French Revolution" | "France Gets Crazy" |
| "The Great Fire of London" | "London Under Fire" |
| "Ed Gein" | "A Monster in Wisconsin" |
| "The Lincoln Assassination" | "Death of a President" |

### Story Descriptions

**Purpose**: Tell the user what they'll find if they click. Like a book jacket blurb.

**Pattern**: List the most dramatic 3-4 moments in vivid shorthand, connected with commas/dashes.

```
"A mob tears down a fortress, a queen rides an open cart to the guillotine, and an artillery officer
takes the crown from the Pope's hands — the revolution that remade the world."
```

**Rules**:
1. **3-5 specific moments namechecked** — not vague summaries
2. **End with a category statement** — what ties them together
3. **Target**: 150-250 characters

### Collection Names

Should read like Wikipedia "List of..." articles. User knows what's in it before clicking.

| Good | Bad |
|---|---|
| "History of London" | "Cool London Stuff" |
| "Nuclear Weapon Detonation and Test Sites" | "Nukes" |
| "Famous Assassination Sites" | "Deaths" |

### Collection Subtitles (IMPORTANT: Only visible text besides name)

`collection.description` is **NOT displayed** in the UI. Only `name` and `subtitle` appear on cards. This means the subtitle must do all the heavy lifting.

```
"From the princes who vanished in the Tower to the Blitz that nearly leveled it"
```

---

## 5. ENTITY DESCRIPTIONS

### Mobile: 1-Line Truncated Descriptions (SHIPPED)

On mobile, entity cards show a **1-line truncated description** (`text-xs line-clamp-1`). Only the first ~8-10 words are visible. This means the opening words ARE the mobile experience:
- ✅ "America's master of the twist ending — a pharmacist..." (O. Henry) — hooks immediately
- ✅ "Christianity's most tireless missionary began as its fiercest persecutor..." (Paul) — dramatic irony in 8 words
- ❌ "Born William Sydney Porter, O. Henry was a pharmacist..." — wastes 5 words on a real name nobody knows

**Rule: FRONTLOAD THE HOOK in the first ~8 words of every entity description.** The truncated 1-line is what mobile users see. Those 8 words must work as a standalone tagline.

### Rules

1. **FIRST 8 WORDS = THE HOOK** — Must work as a standalone tagline
   - ✅ "The painter who killed a man and fled Rome forever" — even truncated to "The painter who killed a man..." this hooks you
   - ✅ "The woman for whom Henry VIII broke with the Pope" — immediately tells you the stakes
   - ❌ "Michelangelo Merisi da Caravaggio was an Italian painter..." — encyclopedic filler, wastes the mobile-visible opening
2. **THEN 2-3 KEY FACTS** — The things you'd tell someone at a dinner party
3. **END WITH A MEMORABLE DETAIL** — The humanizing fact that sticks
   - "Died alone in a New York hotel room"
   - "His face — via the V for Vendetta mask — became the global symbol of anti-establishment protest"

### Length

- **Target**: 200-350 characters (~2-3 sentences)
- **Max**: 400 characters

---

## 6. MOMENT METADATA FIELDS

These fields appear in the UI and need consistent conventions.

### `moment.type` — Displayed as a label in LocationCard

The `type` field is a free-form string. Underscores become spaces and the first letter is capitalized (via CSS). Use these standard values:

| Type Value | Displays As | When to Use |
|---|---|---|
| `crime_scene` | "Crime scene" | Murders, robberies, criminal events |
| `political_event` | "Political event" | Government actions, revolutions, treaties, coronations |
| `battlefield` | "Battlefield" | Military engagements, sieges, surrenders |
| `cultural_venue` | "Cultural venue" | Theaters, museums, studios, churches, universities |
| `disaster` | "Disaster" | Fires, earthquakes, floods, epidemics, bombings |
| `religious_site` | "Religious site" | Churches, temples, mosques, pilgrimage sites |
| `home` | "Home" | Birthplaces, residences, death locations |
| `burial_site` | "Burial site" | Graves, cemeteries, memorials |
| `landmark` | "Landmark" | Natural features, monuments, geographic markers |
| `test_site` | "Test site" | Nuclear tests, scientific experiments |

**Don't invent new types without checking this list first.** If a new type is needed, add it here.

### `moment.importance` — Displayed as label + controls pin size

| Value | Displays As | Pin Size | When to Use |
|---|---|---|---|
| `major` | "Major" | 14px | Globally significant events. A well-read person has heard of this. |
| `minor` | "Minor" | 10px | Regionally or thematically significant. Interesting to someone exploring the area/topic. |
| `contextual` | "Contextual" | 7px | Supporting detail. Makes sense within a story but wouldn't stand alone as a destination. |

**Rule of thumb**: If a user zoomed into the area for the first time with no context, would they click this pin? `major` = yes, `minor` = maybe, `contextual` = only if they're already in the story.

### `moment.accuracy` — Displayed as colored dot + label in LocationCard

| Value | Displays As | Dot Color | When to Use |
|---|---|---|---|
| `exact` | "Exact" | Green | Pin drops at the specific building/site. You could walk there with the pin as a guide. |
| `approximate` | "Approx" | Yellow | Within a block or two of the actual location. |
| `general-area` | "Area" | Orange | We know the city/neighborhood but not the specific spot. |

### `moment.year` — Displayed as metadata on cards

- **Required for all moments** (or should be — flag any moment without a year)
- **Use negative numbers for BCE**: `year: -753` for 753 BCE
- Used for timeline positioning and sorting

### `moment.date` — NOT displayed in UI

This formatted string (e.g., "July 14, 1789") exists in the data but is **never rendered** by any component. It serves as a reference for content creators and for potential future UI use. Since it's not displayed, the description must include the specific date.

### `moment.kind` — NOT displayed in UI

The `MomentKind` field (`'event' | 'milestone' | 'presence'`) exists in the type system but is **never rendered**. It's backend metadata only. Default to `'event'` for most moments.

### `moment.links` — NOT displayed in UI

The `LocationLink[]` field (for affiliates, tours, stays, sources) exists in the type but **nothing renders it**. Don't spend time populating this until the UI supports it.

---

## 7. STORY METADATA FIELDS

### `story.storyType` — Displayed as label (except 'incident')

| Value | Displays As | When to Use |
|---|---|---|
| `incident` | *(not shown)* | A specific event or crime. Default type — hidden in UI. |
| `biography` | "Biography" | A person's life story told through places |
| `place` | "Place" | A location's history (a building, venue, or site) |
| `era` | "Era" | A time period or movement told through moments |

### `story.category` — Displayed as colored badge + filter pill

Uses the lookup table in `categories.ts`:
- "Dark History" (dark-history)
- "Last Stands & Conflicts" (last-stands)
- "Discovery & Science" (discovery-science)
- "Arts & Culture" (arts-culture)
- "Mystery & Unexplained" (mystery-unexplained)
- "Political Drama" (political-drama)
- "Everyday Extraordinary" (everyday-extraordinary)
- "Sacred History" (sacred-history)

### `story.nickname` — Displayed on desktop only

Optional. Shown italic below the story name. Use for well-known aliases:
- "The Butcher of Plainfield" (Ed Gein)
- "The Milwaukee Cannibal" (Jeffrey Dahmer)

### `story.contentWarning` — Displayed as dismissible banner

Use for genuinely disturbing content only. Don't overuse.

---

## 8. WHAT APPEARS ON EACH CARD (Complete UI Reference)

### Moments Tab — Collapsed Card
- **`moment.name`** (serif, primary) ← THE MOST IMPORTANT FIELD
- `moment.year` (tiny mono, right-aligned)
- `story.name` (tiny chip, truncated)

### Moments Tab — Expanded Card
All of the above, plus:
- `moment.description` (full text)
- `moment.address` (with 📍 pin emoji)
- "Open in Google Maps" link
- "Read Story" button → navigates to parent story

### LocationCard (in StoryPanel, active/expanded)
- **Index number** (colored circle)
- **`moment.name`** (serif bold)
- **`moment.subtitle`** (italic serif)
- **Meta row**: `year` · `type` · `importance` · accuracy dot+label
- `narrativeGlue` (if story provides one — italic story-specific intro)
- `moment.description` (full text)
- `moment.address` + Google Maps link
- "Read on Wikipedia" button (if wiki available)
- **"Dive Deeper" section**: entity cards (name + moment/story counts) + cross-story cards (name + years + moment counts)
- Entity chips (inline buttons even when collapsed)
- Media (images/videos if present)

### Stories Tab — StoryCard
- **`story.name`** (serif, primary)
- `story.years` (tiny mono)
- Category badge (colored pill with label)
- `story.storyType` (capitalized, hidden if "incident")
- `story.description` — desktop: 3-line clamp (text-sm); **mobile: 1-line clamp (text-xs)**
- `story.nickname` (desktop only, italic)
- Moment count: "N moments"
- Distance from user (if location available)

### Stories Tab — PersonCard
- **`entity.name`** (serif, primary)
- Avatar circle with first initial
- `entity.years` (tiny mono)
- "Person" badge (purple)
- `entity.description` — desktop: 3-line clamp (text-sm); **mobile: 1-line clamp (text-xs)**
- Moment count + story count

### Collections Tab — CollectionCard
- **`collection.name`** (serif, primary)
- `collection.subtitle` (2-line clamp)
- Location count: "N locations"
- NOTE: `collection.description` is **NOT displayed**

### StoryPanel (full detail view)
- Category color bar
- `story.name` + `story.nickname`
- Category badge + storyType
- `story.years`
- Content warning (if exists)
- `story.description` (full text)
- `story.tags` as clickable `#{tag}` buttons
- **"Dive Deeper" section**: entity GoDeeperCards + connected story GoDeeperCards (with "Related" or "Nearby" badges)
- Tab bar: "Moments (N)" | "Wikipedia" (if slug exists)
- Ordered LocationCard list

### EntityPanel (full detail view)
- Red accent bar
- `entity.name` + `entity.type` badge + `entity.years`
- `entity.description` (full text)
- "Read on Wikipedia" link
- Tab bar: "Moments" + "Notable Figures"/"Key Places" + "Stories" (dynamic)
- Expandable moment cards
- Connected entity GoDeeperCards (with description)
- Connected story GoDeeperCards

### "Dive Deeper" GoDeeperCards — What They Show
Entity cards: icon (👤/📍) + **entity.name** + sublabel ("N moments · N stories")
Story cards: category color dot + **story.name** + sublabel ("N moments · YEARS") + badge ("Related" or "Nearby")

### Header
- Logo: "Deep" (red) + "Maps" (white)
- Tagline (explore mode, desktop only): "Everything that ever happened happened somewhere"
- "Surprise Me" button
- Search input
- "Near Me" button
- Category filter pills (8 categories + "All")
- Breadcrumb (story/entity mode): chevron + name + nickname/years

---

## 9. DATA WIRING RULES

These aren't "content" per se, but bad wiring makes content invisible in the UI.

### Every moment SHOULD have:
- [ ] At least one `entityId` referencing an existing entity
- [ ] Be included in at least one story's `moments[]` array
- [ ] Be included in at least one collection's `momentIds[]` array (if part of a thematic group)

### Every entity SHOULD have:
- [ ] A `canonicalStoryId` pointing to a real story
- [ ] A `wikipediaSlug` (enables "Read on Wikipedia" link)
- [ ] Be referenced by at least one moment's `entityIds`

### Every story SHOULD have:
- [ ] At least one `relatedStoryId` (populates "Dive Deeper" section)
- [ ] A `wikipediaSlug` (enables Wikipedia tab in StoryPanel)
- [ ] Its `moments[]` array ordered chronologically or narratively

### Why wiring matters:
- **GoDeeperCards** only appear if wiring exists — no entityIds = no "Dive Deeper" for that moment
- **Intersection counts** on cards (e.g., "3 moments · 2 stories") are auto-calculated from wiring
- **Cross-referencing** is what makes the app feel connected vs. like a flat list

---

## 10. MOBILE-FIRST CONTENT RULE

Story and entity cards now show a **1-line truncated description** on mobile (`text-xs line-clamp-1`). This means the `name` plus `~8 words of description` is the mobile experience.

> **The `name` + first line of description must work together to tell the user what this is.**
>
> If the name is obscure, the description's opening words must carry the context.

This means:
- "Ed Gein" (story name) + "A Wisconsin farmer's arrest reveals a farmhouse..." ✓ — name + opening line gives full context
- Story names like "The Lincoln Assassination" work because Lincoln is universally known — the description line is bonus context
- Story names like "Elfego Baca" need the description to do the work: "A New Mexican sheriff survives 4,000 bullets..." ✓
- Entity names like "Caravaggio" need frontloaded descriptions: "The painter who killed a man and fled Rome..." ✓

### The Notability Shortcut

If the person/event is **universally famous** (Lincoln, Shakespeare, Napoleon, Jesus), the name alone works:
- "The Lincoln Assassination" ✓
- "Shakespeare" ✓

If the person/event is **NOT universally famous**, the moment name must carry the hook:
- "Elfego Baca" ✗ (who?)
- "A Sheriff Survives 4,000 Bullets in an Eighty-Hour Siege" ✓ (WHO?! Tell me more!)

### Entity & story descriptions: frontload for mobile

Entity and story descriptions now show as a **1-line truncated preview** on mobile. Only the first ~8-10 words are visible. Write descriptions so those first 8 words ARE the tagline:
- ✅ "The painter who killed a man and fled Rome..." (Caravaggio)
- ✅ "The woman for whom Henry VIII broke with the Pope..." (Anne Boleyn)
- ✅ "America's master of the twist ending — a pharmacist..." (O. Henry)
- ❌ "Michelangelo Merisi da Caravaggio was an Italian painter known for..." (wasted words)
- ❌ "Born Samuel Clemens, he became America's greatest humorist..." (real name nobody knows)

---

## 11. AUDIT CHECKLIST

### For every moment, verify:

**Name**
- [ ] Verb-first, event-based (not a place name or ongoing activity)
- [ ] Self-explanatory to a stranger with zero context
- [ ] Specific (numbers, names, concrete details)
- [ ] Under 120 characters
- [ ] Passes the five-second test

**Subtitle**
- [ ] Adds new information (doesn't repeat the name)
- [ ] Provides stakes, irony, or human detail
- [ ] One sentence, no period
- [ ] Under 140 characters

**Description**
- [ ] Standalone (makes sense without any story/entity context)
- [ ] Answers: What happened? When (specific date)? Why does it matter?
- [ ] Encyclopedic tone (no breathless language, no opinions)
- [ ] Contains specific numbers and full dates (month/day, since `moment.date` is not displayed)
- [ ] Ends with legacy, irony, or lasting impact
- [ ] 300-800 characters

**Metadata**
- [ ] `year` is set (negative for BCE)
- [ ] `type` uses a standard value from the vocabulary (section 6)
- [ ] `importance` is appropriate (major/minor/contextual — see criteria in section 6)
- [ ] `accuracy` is honest (exact/approximate/general-area)
- [ ] `address` is set and specific enough to find on a map

**Wiring**
- [ ] `entityIds` reference entities that exist in entities.ts
- [ ] Moment appears in at least one story's `moments[]` array
- [ ] Moment appears in relevant collection's `momentIds[]` array

### For every entity, verify:

- [ ] First ~8 words work as a standalone tagline (the "Caravaggio test")
- [ ] Contains 2-3 key facts after the hook
- [ ] Ends with a memorable humanizing detail
- [ ] `canonicalStoryId` references an existing story
- [ ] `wikipediaSlug` is set and correct
- [ ] Referenced by at least one moment's `entityIds`

### For every story, verify:

- [ ] Name reads like a Wikipedia article title (canonical, specific)
- [ ] Is actually a narrative arc, not a curated list (if the latter, it should be a collection)
- [ ] `moments[]` are ordered chronologically or narratively
- [ ] `relatedStoryIds` point to real stories
- [ ] `wikipediaSlug` is set
- [ ] `category` matches the content

### For every collection, verify:

- [ ] Name reads like "List of..." (user knows what's in it before clicking)
- [ ] `subtitle` does all the work (since `description` is not displayed)
- [ ] All `momentIds` reference real moments
- [ ] Tags are relevant

---

## 12. STYLE DECISIONS (Locked In)

| # | Decision | Rule | Rationale |
|---|---|---|---|
| 1 | Tense | Headline present for events ("Caesar Is Stabbed") | News headline convention; creates immediacy |
| 2 | Naming | Strict event-only (Style A) | App identity is "what happened here" — every pin is a verb |
| 3 | Notability bar | Globally recognizable OR the one-liner hooks you | Obscure names are fine if the event description is self-explanatory |
| 4 | Tone | Wikipedia + Tim Urban | Matter-of-fact, to-the-point, awe-invoking specificity without hyperbole |
| 5 | Content type | All moments = specific historical events | No ongoing activities, no place descriptions |
| 6 | Mobile priority | Name + first ~8 words of description must work together | Mobile shows 1-line truncated description; frontload the hook |
| 7 | Entity hook | First 8 words = tagline; never open with "Born [real name]" | Mobile shows 1-line truncated description; those 8 words are all users see |
| 8 | Story vs Collection | Stories = narrative arcs; Collections = curated lists | If you can rearrange the items without losing anything, it's a collection |
| 9 | Story naming | Wikipedia article title style | Canonical, specific, recognizable — "The French Revolution" not "Paris Gets Wild" |
| 10 | Dates in descriptions | Include month/day (moment.date not displayed in UI) | Year shown as metadata, but full date only exists in description text |

---

## Appendix A: Common Failure Patterns

### 1. "Insider Knowledge Required"
The content assumes the reader already knows who/what is being discussed.
- "Young Ed Gein Laughs Alone at Plainfield School" — requires knowing Gein is a serial killer

### 2. "Place Name Masquerading as Event"
The moment name is a location, not something that happened there.
- "The Empire Theatre Bus Stop" — should describe Rosa Parks's refusal

### 3. "Vague Activity, Not Specific Event"
The name describes something that happened repeatedly, not a specific moment.
- "Hindus Bathe in the Sacred Ganges" — when? which time? This is an ongoing activity.

### 4. "Too Clever, Not Clear Enough"
The name tries to be poetic or mysterious at the expense of clarity.
- "Where a Refusal to Move Changed the Direction of America" — beautiful, but only works if the name told you what the refusal was.

### 5. "Present Tense Describing Current State"
The name describes what a place IS now, not what happened.
- "A Crater Sits in the Arizona Desert" — should describe the impact event

### 6. "Dead-weight Opening" (for entity descriptions)
The description opens with formal biographical filler instead of the hook.
- "Michelangelo Merisi da Caravaggio was an Italian painter..." — first 8 words wasted
- Better: "The most revolutionary painter in Europe — also a killer on the run..."

**"Born [Real Name]" anti-pattern**: Never open with "Born [real name]..." — this wastes the entire mobile-visible line on a name nobody recognizes. Frontload what the person DID or IS KNOWN FOR.
- ❌ "Born Samuel Clemens, he became America's greatest humorist..."
- ✅ "America's greatest humorist and the voice of the Mississippi River..."
- ❌ "Born Temüjin. Orphaned, enslaved, escaped..."
- ✅ "Orphaned, enslaved, and left for dead — then unified the Mongol tribes..."

---

## 13. DATA WIRING FOR INGESTED CONTENT

When ingesting content from external sources (datasets, AI-drafted content), every item must be fully wired for discoverability.

### Every ingested person/place/event MUST have:
- [ ] A person/place entity with hook-first description and `wikipediaSlug`
- [ ] A biography/place story linking all moments in chronological order
- [ ] Each moment linked to relevant entities via `entityIds`
- [ ] `relatedStoryIds` connecting to thematically/geographically related existing stories
- [ ] Membership in at least one collection (existing or new)
- [ ] `source` field set to dataset name (e.g., `'notable-people'`)
- [ ] All moments scored for notability (0-100)

### Storyability checklist (what makes content navigable):
- Entity chips on moments → tappable → entity panel with all their moments
- Dive Deeper cards on stories → related stories + entities
- Collection membership → discoverable via Collections tab
- Wikipedia integration → geo-linked reading experience
- Search → findable by name, entity, or keyword

### Why wiring matters for ingested content:
- **GoDeeperCards** only appear if wiring exists — no entityIds = no "Dive Deeper"
- **Intersection counts** ("3 moments · 2 stories") require entity + story linkage
- **Cross-referencing** is what makes the app feel connected, not like a flat database dump
- **Without full wiring, ingested content is invisible** in half the navigation paths

---

## 14. WORK ENTITIES

Entity type `work` covers films, TV shows, books, journals, religious texts, scientific papers, explorer logs, albums — any notable work referenced by moments.

### Rules
- Only create when the work is referenced by **2+ moments** (otherwise it's just a tag)
- Description follows entity hook-first rule (first 8 words = tagline)
- Use tags for subtype: `film`, `book`, `journal`, `scripture`, `paper`, `album`, `tv-show`
- No dedicated browse tab until 50+ work entities exist — works surface via entity chips, search, and Dive Deeper

### Examples
| Work | Description (hook-first) |
|---|---|
| The Godfather | "The film that redefined the American gangster genre — shot across New York and Sicily..." |
| Journals of Lewis and Clark | "The journals that mapped the American West for the first time — a 28-month expedition..." |
| On the Origin of Species | "The book that made evolution undeniable — published by a man who delayed 20 years..." |

### Icon by subtype tag
| Tag | Icon |
|---|---|
| `film` | 🎬 |
| `book`, `journal`, `paper` | 📚 |
| `tv-show` | 📺 |
| `scripture` | 📜 |
| `album` | 🎵 |

---

## Appendix B: Fields That Exist But Are NOT Displayed

| Field | Status | Notes |
|---|---|---|
| `moment.date` | Not rendered | Formatted date string. Only `year` (number) is shown on cards. |
| `moment.kind` | Not rendered | 'event' / 'milestone' / 'presence'. Backend metadata only. |
| `moment.links` | Not rendered | LocationLink[] for affiliates/tours/sources. UI doesn't support it yet. |
| `collection.description` | Not rendered | Only `name` and `subtitle` appear on CollectionCards. |

---

## Appendix C: Terminology Consistency

| In the data | Displayed as | Context |
|---|---|---|
| `moment` | "moment" or "location" | Collections use "N locations"; everything else uses "N moments" |
| `story.moments.length` | "N moments" | StoryCard footer, StoryPanel section heading |
| `collection.momentIds.length` | "N locations" | CollectionCard, active collection header |
| `entity` type values | "Person", "Place", "Organization", "Concept" | CSS capitalized |
| `story.storyType` | "Biography", "Place", "Era" | Hidden when "incident" (default) |
