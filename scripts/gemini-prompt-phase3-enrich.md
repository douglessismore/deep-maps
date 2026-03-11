# Phase 3: Entity Tagging & Story Connections — Gemini Prompt

## Context

You're enriching a geospatial storytelling app called Deep Maps. It has three data layers:

- **Moments** — atomic historical events pinned to map locations (e.g., "Police Uncover Gein's House of Horrors")
- **Entities** — people, places, organizations, concepts that appear across moments (e.g., "Ed Gein", "UT Austin", "Manhattan Project")
- **Stories** — narrative threads that connect moments (e.g., "Billy the Kid", "Tulsa Race Massacre")

## Task A: Tag Orphaned Moments with EntityIds

I'll give you batches of moments that are MISSING `entityIds`. For each moment, identify 2–5 entities that are significant to that moment.

### Rules for EntityIds

1. **Use the entity reference list** I'll provide first. Always prefer existing entity IDs over creating new ones.
2. **Only create new IDs** if no existing entity matches. Use kebab-case: `first-last` for people, `place-name` for places, `org-name` for organizations.
3. **2–5 entities per moment is typical.** Include the primary subject + the key place/organization involved.
4. **Be consistent.** The same person/place gets the same ID in every moment.

### Entity Type Guidelines

- **People:** `billy-the-kid`, `rosa-parks`, `robert-oppenheimer`
- **Places:** `ford-theatre`, `barton-springs`, `dealey-plaza`
- **Organizations:** `fbi`, `naacp`, `branch-davidians`, `ut-austin`
- **Concepts:** `manhattan-project`, `tulsa-race-massacre`, `1900-galveston-hurricane`

### Output Format (Task A)

Return a JSON array:

```json
[
  {
    "id": "moment-id",
    "entityIds": ["entity-1", "entity-2", "entity-3"]
  }
]
```

## Task B: Suggest relatedStoryIds for Orphaned Stories

After the moment batches, I'll send the full story catalogue. For stories marked `"needsRelated": true`, suggest 1–4 related stories based on:

- **Thematic overlap** — same category, similar tags
- **Geographic proximity** — stories in the same region
- **Temporal connections** — stories from the same era
- **Entity bridges** — stories sharing the same people/places
- **Narrative contrast** — stories that illuminate each other through difference

### Rules for relatedStoryIds

- Only suggest connections that would genuinely interest a reader
- Bidirectional: if A relates to B, B should relate to A (flag if the reverse is missing)
- Don't connect everything to everything — be selective (1-4 connections)
- Cross-category connections are MORE valuable than same-category

### Output Format (Task B)

```json
[
  {
    "id": "story-id",
    "relatedStoryIds": ["related-1", "related-2"],
    "bidirectionalFixes": [
      { "storyId": "related-1", "addRelated": "story-id" }
    ]
  }
]
```

`bidirectionalFixes` flags cases where story A already references B, but B doesn't reference A back.

---

## Workflow

1. I'll paste the **entity reference list** first (128 existing entities)
2. Then I'll paste moment batches for Task A (one at a time, ~30 moments each)
3. After all moment batches, I'll paste the **story catalogue** for Task B

Ready? Let me start with the entity reference list.
