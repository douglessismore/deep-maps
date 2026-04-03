# Deep Maps — Session Handoff

**Last updated:** 2026-04-03 (Session 20)
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)

## Current State
Session 19's arrow flyTo fixes are stable. Session 20 added infinite horizontal scroll, fixed the location marker, hardened arrow null guards, and tuned arrow visibility. All deployed to Vercel.

## What Session 20 Shipped

### Infinite Horizontal Scroll
- All 3 carousels (People, Stories, Moments) now load 20 more items when user scrolls near the end
- Data source: globally-sorted full dataset by distance from user/viewport center
- Initial load: viewport + backfill (~35 items). Each scroll-near-end appends next 20 nearest.
- Page sizes reset on map pan so stale distant items don't persist
- `HScrollRow` gained `onLoadMore` prop with scroll-position-based trigger
- `HomePage` has `allMomentsSorted`, `allStoriesSorted`, `allPeopleSorted` useMemos for the infinite tail
- Collections (only ~29) don't need infinite scroll

### Stories Always Visible
- Stories section now shows even when no stories are in the viewport
- Falls back to globally-sorted stories from the infinite scroll system
- Shows `BackfillHint` ("Not on the map yet — zoom out or tap to explore") when all stories are off-map

### Location Marker
- Geo marker: 10px → 14px, 0.6 → 0.95 opacity, 3px white border, outer ring glow pulse
- DivIcon: 14px → 20px to match

### Arrow Null Guards
- `showOffScreenArrow`: validates coordinates are finite
- Single-moment overlay: guards against missing `scrollHighlight[0]`
- Multi-moment off-screen: filters invalid coordinates before `reduce`

### Arrow Styling
- White chevron on dark frosted pill (`rgba(0,0,0,0.45)` + blur)
- Gold accent on distance text
- Iterated 3 times: too subtle → too prominent → balanced

### Data Fixes
- Removed 11 broken entity references across del-valle, mesa-phoenix, seattle content

## Key Decisions (and WHY)

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Infinite scroll approach | Progressive load-more from global sort | 3x clone wrap-around | User wanted "next nearest" not looping; simpler, no position-reset hacks |
| Distance reference point | userLocation ?? viewport centroid | mapCenter prop | Avoids new prop; centroid is close enough for sort ordering |
| Page size reset | On viewport data change | Never reset | Prevents carrying 200 distant items after panning to new area |
| Arrow contrast | Dark pill backdrop | Brighter gold color | No color works on all satellite tiles; dark pill guarantees contrast |

## Open Issues (prioritized)

### P1: Quick fixes
1. **Plausible domain** — Currently `deepmaps.vercel.app` in index.html. Should it be `deepmaps.app`? User hasn't confirmed.
2. **Pre-existing HScrollRow React warning** — "An error occurred in the <HScrollRow> component" appears in dev console. Present before Session 20 changes. Non-blocking — page renders fine.

### P2: Features
3. **Content richness vs atomic cards** — User comparing DeepMaps cards to ExploreHere's rich formatted pages. Product design question. Use `/office-hours` or `/plan-ceo-review`. (SEPARATE CHAT — not code work)

### P3: Bugs from FOCUS.md (not yet verified as fixed)
4. **Labels hiding their markers** — LBJ label covers the marker dot
5. **Downtown Austin shows only 3 moments** — `viewportLocations` may not update after flyTo

## Files Changed This Session
- `src/components/map/EmergenceLayer.tsx` — Arrow null guards, arrow styling (dark pill + white chevron)
- `src/components/map/MapView.tsx` — Geo marker DivIcon size
- `src/components/panel/HomePage.tsx` — Infinite scroll system, stories always visible
- `src/index.css` — Geo marker styling (larger, brighter, ring glow)
- `src/data/del-valle-content.ts` — Removed broken entity refs
- `src/data/mesa-phoenix-content.ts` — Removed broken entity refs
- `src/data/seattle-portorchard-content.ts` — Removed broken entity refs

## Architecture Notes for Next Session
- **Infinite scroll data flow**: `viewportItems + backfill` → merge with `allItemsSorted` (global, distance-ordered) → `.slice(0, pageSize)`. Page size bumps by 20 on scroll-near-end.
- **`sortCenter`**: computed as `userLocation ?? centroid(viewportLocations)`. Used by all 3 global sort memos.
- **Frozen scroll**: `frozenNearYou` ref still prevents reshuffling during scroll. Page size bump happens after the 1500ms freeze timeout — no conflict.
- **Arrow styling**: inline HTML in `updateArrowPosition()`. Dark pill container set in `showOffScreenArrow()`. Both in EmergenceLayer.tsx.
