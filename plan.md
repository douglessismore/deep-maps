# Plan: Entity Page Overhaul — "The One True View"

## Core Decision: Kill the Main Story Button

The entity page and the "Main Story" are nearly identical (18 vs 17 moments for O. Henry). This confuses users. **The entity page IS the canonical view for a person or place.**

The canonical story (`o-henry-life`) still exists in the data — it's findable via search, Explore Further links on related stories, and via story chips on entity page moments. But it's no longer prominently linked from the entity page itself.

When you want the **narrative version** with glue text, you click into a specific story from the entity page. When you want the **reference view** showing everything, you're already on the entity page.

---

## Implementation Steps

### Step 1: Remove Main Story button from EntityPanel
- Delete the `canonicalStory` lookup and the "Main Story" button block
- Keep the Wikipedia link (it's independent reference)

### Step 2: Redesign entity moment cards as compact hubs
Replace the current clickable buttons in EntityPanel's moments list with compact cards that have **inline navigation chips**:

```
┌───────────────────────────────────────────────┐
│ Coins 'Servant Girl Annihilators'        1885 │
│ ● Servant Girl Annihilator  ● O. Henry Emb…  │  ← story chips
│ 👤 O. Henry                                   │  ← entity Go Deeper chip
└───────────────────────────────────────────────┘
```

Each moment card shows:
- **Name + year** (always visible)
- **Story chips** — small bordered pills showing each parent story (with category color dot). Click → navigate to that story with this moment active.
- **Entity chips** — "Go Deeper" pills for person/place entities on this moment (excluding the entity you're currently viewing). Click → navigate to that entity page.
- **NO description expansion** — the entity page is a scannable table of contents

### Step 3: Scroll-driven map marker highlighting
Adapt StoryPanel's IntersectionObserver scroll pattern for EntityPanel:
- Track which moment is nearest the 40% viewport line as user scrolls
- Highlight that moment's map marker (glow/pulse effect)
- New prop: `onScrollLocationActive: (moment: Moment, story: Story) => void`
- In App.tsx: wire this to set `activeLocation` WITHOUT exiting entity mode

Key refs to add to EntityPanel:
- `scrollContainerRef` — the scroll container
- `momentRefs` — Map of momentId → HTMLDivElement
- `scrollActiveId` — currently scroll-highlighted moment
- `isProgrammaticScroll` — guard against scroll handler recursion

### Step 4: Map pin click stays in entity mode
**Current behavior:** Clicking a map pin in entity mode exits entity mode and enters story mode.
**New behavior:** Clicking a map pin in entity mode scrolls the EntityPanel to that moment and highlights it. Does NOT exit entity mode.

Implementation:
- Add `onEntityLocationClick` callback in App.tsx that:
  - Sets `activeLocation` (for marker highlight)
  - Does NOT push nav, change mode, or clear activeEntity
- EntityPanel receives this click event and scrolls to the matching moment card
- Pass a different `onLocationClick` to MapView when in entity mode

### Step 5: Notable Figures section for place entities
For place-type entities, add a section above the moments list:

```
NOTABLE FIGURES
┌────────────────┐  ┌─────────────────────┐
│ 👤 Barbara     │  │ 👤 Stephen F.       │
│    Jordan      │  │    Austin           │
│ 1936–1996      │  │ 1793–1836          │
└────────────────┘  └─────────────────────┘
```

Implementation:
- Scan all moments for this entity
- Collect unique person-type entityIds from those moments (excluding self)
- Render as horizontal card strip (same visual as Explore Further)
- Each card clickable → navigates to that person's entity page

### Step 6: Data — create demo person entities for cemetery
Create minimal person entities to demonstrate Notable Figures:

**New entities:**
- `barbara-jordan` — Person, 1936–1996, "First Southern Black woman in Congress..."
- `stephen-f-austin` — Person, 1793–1836, "The Father of Texas..."

**Tag cemetery moments:**
- `cemetery-barbara-jordan` → `entityIds: ['texas-state-cemetery', 'barbara-jordan']`
- `cemetery-stephen-austin` → `entityIds: ['texas-state-cemetery', 'stephen-f-austin']`

---

## Files Changed

| File | Change |
|------|--------|
| `EntityPanel.tsx` | Major rewrite — remove Main Story, compact moment cards with chips, scroll highlighting, Notable Figures section |
| `App.tsx` | Add entity-mode scroll handler, modify entity-mode map click behavior |
| `MapView.tsx` | Support entity-mode pin click without mode exit |
| `entityHelpers.ts` | Add helper: `getNotableFigures(entityId)` — collects person entities from a place's moments |
| `entities.ts` | Add 2 new person entities (Barbara Jordan, Stephen F. Austin) |
| `moments.ts` | Tag 2 cemetery moments with person entityIds |

---

## Order of Operations

1. Data first (entities.ts, moments.ts) — get the data right
2. EntityPanel rewrite — the big change
3. App.tsx wiring — scroll handler + map click behavior
4. MapView.tsx — entity-mode pin click change
5. entityHelpers.ts — Notable Figures helper
6. TypeScript verify + visual test

---

## What This Does NOT Change
- StoryPanel behavior (unchanged)
- LocationCard "Go Deeper" section (unchanged — stays on story moments)
- Explore mode (unchanged)
- The canonical story data still exists — just not linked from entity page
- Search still finds stories by name
