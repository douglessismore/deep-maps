# Phase 2: Moment Quality Pass — Gemini Prompt

## Instructions

You are helping rewrite a geospatial storytelling app's moment data. A "moment" is an atomic historical event pinned to a specific location on a map. Think of it like a Wikipedia article for a single event at a single place.

I'll give you batches of moments in JSON. For each moment, you need to:

### 1. Rewrite the `name` to be VERB-FIRST

The name should describe what HAPPENED, not what the place IS called.

**BAD (noun-driven):**
- "Ed Gein's Farmhouse"
- "Plainfield Cemetery"
- "Norman Petty Studios"
- "Tunstall's Store"
- "The Driskill Lobby"

**GOOD (verb-driven):**
- "Police Uncover Gein's House of Horrors"
- "Gein Robs Graves for a Decade at Plainfield Cemetery"
- "Buddy Holly Records 'That'll Be the Day' in a Garage Studio"
- "Billy the Kid's Employer Is Gunned Down at His Own Store"
- "A Cattle Baron Loses His Hotel in a Poker Game"

**Rules for verb-first names:**
- Start with WHO did WHAT (or WHAT happened)
- Use active voice, past tense or present tense narrative
- Include the most surprising/interesting detail
- Keep under ~60 characters when possible (80 max)
- Should make someone say "wait, WHAT?" when they see it on a map pin
- **Tone: Wikipedia, not novel.** Be factual and specific. Let the facts be surprising — don't editorialize or add poetic flourishes.
  - BAD: "Young Ed Gein Laughs Alone at Plainfield School" (novelistic, weird)
  - GOOD: "Ed Gein Grows Up Isolated at Plainfield School" (factual, clear)
  - BAD: "Shadows Fall Over the Old Mill" (creative writing)
  - GOOD: "Fire Destroys the Old Mill, Killing 14 Workers" (specific, factual)

**Splitting moments:** If a moment conflates two events separated by significant time (e.g., "grave robbing 1947–1957" AND "burial in 1984"), flag it for splitting. In your output, set `"splitSuggestion": "description of the split"` instead of just rewriting.

### 2. Classify the `kind`

Each moment gets one of three kinds:

- **`event`** — A dramatic, discrete happening. "Police Discover Gein's Farmhouse." "The Hindenburg Explodes Over Lakehurst." Most moments are events.
- **`milestone`** — A life event (birth, death, marriage, graduation, founding). "O. Henry Born in Greensboro." "Rosa Parks Dies in Detroit." These mark beginnings/endings.
- **`presence`** — Ongoing association with a place (lived, worked, studied, operated). "O. Henry Works at the General Land Office." "Dahmer Works the Night Shift at Ambrosia Chocolate." These represent someone or something BEING at a place over time, not a single dramatic event.

**When in doubt:** If something dramatic happened there → `event`. If it's about someone being associated with a place → `presence`. If it marks a beginning or ending → `milestone`.

### 3. Suggest `entityIds`

List the key people, places, and organizations involved. Use kebab-case IDs.

Examples:
- A moment about O. Henry at Scholz Garden: `["o-henry", "scholz-garden"]`
- A moment about the FBI raiding Waco: `["fbi", "branch-davidians", "david-koresh"]`
- A moment about Rosa Parks on the bus: `["rosa-parks", "montgomery-bus-boycott"]`

**Rules:**
- People: first-last or common-name (`billy-the-kid`, `pancho-villa`)
- Places: name-city or just name (`scholz-garden`, `ford-theatre`)
- Orgs: short name (`fbi`, `naacp`, `branch-davidians`)
- Only include entities that are significant to the moment — 2-4 per moment is typical

### 4. Fix `description` if context-dependent

If the description says things like "the killer" without saying who, or "this location" without context, or assumes you already know what story you're reading — rewrite it to be standalone.

**BAD:** "Living just blocks from the scenes of the carnage, the young bank clerk..."
**GOOD:** "Living just blocks from the Servant Girl Annihilator's crime scenes in 1885, Austin bank clerk William Sydney Porter — later famous as O. Henry — coined the phrase..."

Most descriptions are already decent. Only rewrite if they assume story context.

### 5. Update `subtitle` if the name changed significantly

The subtitle is a one-line hook. If the new verb-first name covers the hook well, the subtitle might need updating to add a different angle.

### 6. Review `storyType` for parent stories

When you see the parent story context, flag if the storyType seems wrong:
- `biography` — The story follows a person's life across locations
- `incident` — The story covers a specific event or series of related events
- `place` — The story is about a place's history across time
- `era` — The story covers a time period or movement

Many stories currently typed as `incident` should be `biography` (especially ones with person names like "Rosa Parks", "Billy the Kid", etc.).

---

## Output Format

Return a JSON array. For each moment, provide:

```json
{
  "id": "gein-farm",
  "name": "Police Uncover Gein's House of Horrors",
  "subtitle": "A search for a missing shopkeeper reveals bone furniture and skull bowls",
  "kind": "event",
  "entityIds": ["ed-gein", "bernice-worden"],
  "descriptionRewrite": null,
  "storyTypeFlags": null
}
```

- `descriptionRewrite`: Only include if the description needs fixing. Set to `null` if it's fine as-is.
- `storyTypeFlags`: Only include if a parent story has the wrong storyType. Format: `{"story-id": "biography"}`. Set to `null` if fine.

---

## Example Batch (Input → Output)

### Input:
```json
[
  {
    "id": "gein-farm",
    "currentName": "Ed Gein's Farmhouse",
    "currentSubtitle": "Where police discovered a house of horrors that shocked America",
    "currentDescription": "On November 16, 1957, police entered this farmhouse searching for missing hardware store owner Bernice Worden. What they found was beyond comprehension...",
    "year": 1957,
    "type": "crime_scene",
    "importance": "major",
    "parentStories": ["ed-gein"]
  },
  {
    "id": "gein-school",
    "currentName": "Plainfield School",
    "currentSubtitle": "Where classmates remembered a quiet boy who laughed at inappropriate times",
    "currentDescription": "Gein attended school here as a boy. Classmates remembered him as shy and odd...",
    "year": 1920,
    "type": "institution",
    "importance": "minor",
    "parentStories": ["ed-gein"]
  },
  {
    "id": "gein-mendota",
    "currentName": "Mendota Mental Health Institute",
    "currentSubtitle": "Where Gein was declared legally insane and spent his final decades",
    "currentDescription": "After being found not guilty by reason of insanity in 1957, Gein was committed to this institution...",
    "year": 1957,
    "type": "institution",
    "importance": "minor",
    "parentStories": ["ed-gein"]
  }
]
```

### Output:
```json
[
  {
    "id": "gein-farm",
    "name": "Police Uncover Gein's House of Horrors",
    "subtitle": "A search for a missing shopkeeper reveals bone furniture and skull bowls",
    "kind": "event",
    "entityIds": ["ed-gein", "bernice-worden"],
    "descriptionRewrite": null,
    "storyTypeFlags": null
  },
  {
    "id": "gein-school",
    "name": "Young Ed Gein Laughs Alone at Plainfield School",
    "subtitle": "Classmates recall a shy boy whose mother forbade friendships as sinful",
    "kind": "presence",
    "entityIds": ["ed-gein"],
    "descriptionRewrite": null,
    "storyTypeFlags": null
  },
  {
    "id": "gein-mendota",
    "name": "Gein Declared Insane, Confined Until Death",
    "subtitle": "A model patient dies at 77 — his car sold to a carnival sideshow",
    "kind": "milestone",
    "entityIds": ["ed-gein", "mendota-mental-health"],
    "descriptionRewrite": null,
    "storyTypeFlags": null
  }
]
```

---

## Batch Processing

I'll send moments in batches of ~30-40. Process each batch and return the JSON array. Maintain consistency:
- Same entity gets the same ID across batches (e.g., always `o-henry`, not sometimes `william-porter`)
- Same person referenced in different moments gets tagged consistently

After all batches, I'll also send the full story list for storyType review.

---

## Ready for Batch 1

Here are the first 30 moments. Return the JSON array with rewrites:

</content>
</invoke>