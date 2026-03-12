# Deep Maps — Content Styling Guide

> **Purpose**: Ensure every piece of content in Deep Maps is consistent, compelling, and self-explanatory. Used for both auditing existing content and creating new content.
>
> **Expert Council**: Jimmy Wales (encyclopedic clarity), Steve Jobs (design simplicity), Edward Tufte (data visualization), Maria Popova (content curation — "every word earns its place")

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
5. **NO ONGOING ACTIVITIES** — "Hindus Bathe..." or "Pilgrims Walk..." (style B) is banned. Reframe as founding/origin event.
6. **NO PLACE NAMES AS TITLES** — "The Empire Theatre Bus Stop" is banned. Describe the event.
7. **INCLUDE THE "WHY CARE" SIGNAL** — If the person isn't universally famous, the name must hint at significance
   - Bad: "O. Henry Works at the Land Office" (who? why care?)
   - Good: "A Bank Clerk Who Will Become America's Most Famous Short-Story Writer Takes a Job at the Texas Land Office"
   - Or better: Just ensure the subtitle carries the hook if the name can't fit it

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
2. **ENCYCLOPEDIC TONE** — Wikipedia's matter-of-fact clarity. Information-dense, not breathless.
3. **ANSWER THREE QUESTIONS**: What happened? When exactly? Why does it matter?
4. **SPECIFIC NUMBERS AND DETAILS** — "100,000 people died" not "many people died"
5. **END WITH LEGACY OR IRONY** — The last sentence should give the reader a reason to remember this
   - "She was declared a saint by the Catholic Church in 1920"
   - "Dickens earned less than he hoped, but he had permanently altered Western culture"
6. **NO FIRST PERSON, NO OPINION** — "The greatest [X] in history" is acceptable as commonly agreed fact; "I think this was important" is not

### Structure Template

```
[Opening: Specific date/context] + [What happened: the event in detail] +
[Key details: numbers, names, consequences] + [Closing: legacy, irony, or lasting impact]
```

### Length

- **Target**: 400-600 characters (~3-5 sentences)
- **Max**: 800 characters
- **Min**: 300 characters (if shorter, you're probably missing the "why it matters")

---

## 4. STORY NAMES AND DESCRIPTIONS

### Story Names

Stories are **thematic groupings**, not individual events. Names should read like Wikipedia article titles or book chapter headings.

| Good | Bad |
|---|---|
| "London Under Fire" | "Bad Things in London" |
| "The French Revolution" | "France Gets Crazy" |
| "Rome's Renaissance Masters" | "Art Stuff in Rome" |
| "History's Bravest" | "Cool People" |

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

---

## 5. ENTITY DESCRIPTIONS

### Rules

1. **ONE-LINER FIRST** — The first sentence must be the "elevator pitch" that makes you want to Google them
   - "The man who liberated India without firing a shot"
   - "The sculptor who insisted he wasn't a painter"
2. **THEN 2-3 KEY FACTS** — The things you'd tell someone at a dinner party
3. **END WITH A MEMORABLE DETAIL** — The humanizing fact that sticks
   - "Died alone in a New York hotel room"
   - "His face — via the V for Vendetta mask — became the global symbol of anti-establishment protest"

### Length

- **Target**: 200-350 characters (~2-3 sentences)
- **Max**: 400 characters

---

## 6. COLLECTION NAMES AND DESCRIPTIONS

### Collection Names

Should read like Wikipedia "List of..." articles. User knows what's in it before clicking.

| Good | Bad |
|---|---|
| "History of London" | "Cool London Stuff" |
| "Nuclear Weapon Detonation and Test Sites" | "Nukes" |
| "Famous Assassination Sites" | "Deaths" |

### Collection Subtitles

One sentence that adds specificity or a hook.

```
"From the princes who vanished in the Tower to the Blitz that nearly leveled it"
```

---

## 7. WHAT APPEARS ON EACH CARD (UI Context)

Understanding what the user actually SEES determines what matters most.

### Moments Tab (collapsed card)
- **`name`** (primary text, serif) — THIS IS ALL THE USER SEES INITIALLY
- `year` (tiny, muted)
- `story.name` (tiny chip)
- No subtitle, no description visible until expanded

**Implication**: The moment `name` must work completely alone. If it needs the subtitle or description to make sense, it fails.

### Stories Tab (card)
- **`name`** (primary text, serif)
- `years` (tiny, muted)
- Category badge (color-coded)
- `description` (desktop only, 3 lines max) — **HIDDEN ON MOBILE**
- `nickname` (desktop only)

**Implication**: On mobile, only the story name and years are visible. The name alone must convey what this story is about.

### Person Cards (in Stories tab)
- **`entity.name`** (primary text, serif)
- `years` (tiny)
- "Person" badge
- `description` (desktop only, 3 lines max) — **HIDDEN ON MOBILE**

**Implication**: Entity descriptions are invisible on mobile. The person's name must be recognizable, or the moment they're attached to must be the hook.

### Collections Tab (card)
- **`name`** (primary text, serif)
- `subtitle` (2 lines max)
- Moment count

---

## 8. MOBILE-FIRST CONTENT RULE

Since descriptions are hidden on mobile:

> **The `name` field is the ONLY text most users will see.**
>
> If your content doesn't work with just the `name` visible, it doesn't work.

This means:
- "Ed Gein" (story name) is fine IF the associated moment names are self-explanatory
- But "Mary Hogan Disappears from Her Tavern" next to a tiny "Ed Gein" chip is NOT fine
- Story names like "The Lincoln Assassination" work because Lincoln is universally known
- Story names like "Elfego Baca" do NOT work alone — but could work if the subtitle were visible

### The Notability Shortcut

If the person/event is **universally famous** (Lincoln, Shakespeare, Napoleon, Jesus), the name alone works:
- "The Lincoln Assassination" ✓
- "Shakespeare" ✓

If the person/event is **NOT universally famous**, the moment name must carry the hook:
- "Elfego Baca" ✗ (who?)
- "A Sheriff Survives 4,000 Bullets in an Eighty-Hour Siege" ✓ (WHO?! Tell me more!)

---

## 9. AUDIT CHECKLIST

For every moment, verify:

### Name
- [ ] Verb-first, event-based (not a place name or ongoing activity)
- [ ] Self-explanatory to a stranger with zero context
- [ ] Specific (numbers, names, concrete details)
- [ ] Under 120 characters
- [ ] Passes the five-second test

### Subtitle
- [ ] Adds new information (doesn't repeat the name)
- [ ] Provides stakes, irony, or human detail
- [ ] One sentence, no period
- [ ] Under 140 characters

### Description
- [ ] Standalone (makes sense without any story/entity context)
- [ ] Answers: What happened? When? Why does it matter?
- [ ] Encyclopedic tone (no breathless language, no opinions)
- [ ] Contains specific numbers and dates
- [ ] Ends with legacy, irony, or lasting impact
- [ ] 300-800 characters

### Accuracy
- [ ] Dates verified (year field matches description's stated date)
- [ ] Coordinates verified (pin drops at the correct location, not the center of a city)
- [ ] Key claims are accurate and could be sourced to Wikipedia
- [ ] `entityIds` reference entities that actually exist in entities.ts
- [ ] `type` field is appropriate for the content

### Entity (if applicable)
- [ ] First sentence is a compelling one-liner hook
- [ ] Contains 2-3 key facts
- [ ] Ends with a memorable humanizing detail
- [ ] `canonicalStoryId` references a story that exists
- [ ] `wikipediaSlug` is correct and the page exists

---

## 10. STYLE DECISIONS (Locked In)

| Decision | Rule | Rationale |
|---|---|---|
| Tense | Headline present for events ("Caesar Is Stabbed") | Matches news headline convention; creates immediacy |
| Naming | Strict event-only (Style A) | App identity is "what happened here" — every pin is a verb |
| Notability bar | Globally recognizable OR the one-liner hooks you | Obscure names are fine if the event description is self-explanatory |
| Tone | Wikipedia + Economist | Matter-of-fact, information-dense, no superlatives unless factual |
| Content type | All moments MUST describe a specific historical event | No ongoing activities, no place descriptions |
| Mobile priority | Name field must work alone | Descriptions are hidden on mobile; name is all users see |

---

## Appendix: Common Failure Patterns

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
- "Where a Refusal to Move Changed the Direction of America" — subtitle of the Empire Theatre moment. Beautiful, but only works if the name told you what the refusal was.

### 5. "Present Tense Describing Current State"
The name describes what a place IS now, not what happened.
- "A Crater Sits in the Arizona Desert" — should describe the impact event
