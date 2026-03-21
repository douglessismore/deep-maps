# Deep Maps — Session Handoff

**Last updated:** 2026-03-20 (Session 60 — moment click zoom, collection polyline removal, collection filtering investigation)
**Branch:** `main`

---

## Bug Tracker

### ✅ Resolved (Session 60)
- **Moment click doesn't zoom** — Clicking a moment card in story/entity mode now zooms to that moment (zoom 14+). Scrolling back to the story header zooms back out to show all markers. Implementation: `zoomToActiveLocation` boolean state in App.tsx, set true on `handleLocationSelect` (click), false on `handleScrollLocationSelect` (scroll) and `onScrollToTop`. MapView.tsx uses `flyTo` with `targetZoom = Math.max(currentZoom, 14)` when true, instant `panToAboveSheet` when false.
- **Collection polylines look sloppy** — Polylines now suppressed when `activeCollection` is set. Collections are curated lists, not narratives — connecting lines don't add meaning. Fix: guard `!activeCollection` in polyline useEffect.
- **Pin jitter during zoom** — CSS `transition: transform` on `.story-marker` base state caused markers to lag behind Leaflet's zoom animation. Fix: removed transform from base transition, only applied on `:hover`.
- **Inconsistent story/entity map framing** — Stories with tightly clustered markers stayed too zoomed out. Fix: proportional padding (15% of viewport dimensions) + maxZoom raised to 16.
- **scrollHighlight not cleared on navigation** — All pins appeared highlighted when entering story/entity mode from explore scroll. Fix: clear `scrollHighlight` and `scrollHighlightIdsRef` in all 4 navigation handlers.
- **Pin dimming too invisible** — 0.12 opacity made dimmed pins nearly invisible. Fix: raised to 0.3.
- **"Snub" content renamed** — `booker-t-washington-snub` → `booker-t-washington-denied-capitol`, "snub" → "refusal" everywhere.

### ✅ Resolved (Session 59)
- **Story/entity click not zooming** — Root cause: `userInteractUntil` guard blocked ALL zooms for 4s after any map interaction. Fix: mode-change zooms bypass the guard entirely.
- **Collection click zooms to blank map** — Fix: moved collection zoom into MapController's zoom effect.
- **Pin dimming not working in focused mode** — Fix: dim based on `activeLocation` in focused mode; always rebuild icon when faded state changes.
- **Pin dimming not working in explore mode** — Fix: centralized highlight logic into shared helpers.
- **Auto-zoom janky on scroll** — Removed entirely. Polylines communicate geographic scope visually.
- **Collection scroll snapping to different collection** — Fix: skip viewport update during collections list scroll.
- **Entity tab bar hidden for single-tab entities** — Fix: always render tab bar.
- **Map pin centering in split mode** — Fix: `effectiveSheetSnap='full'` for split mode.

### ✅ Resolved (Session 58)
- **BUG-5: Missing DIVE DEEPER on biographies** — Fix: stopped filtering canonical stories from connectedEntries in StoryPanel.
- **BUG-6: Tab switch resets scroll** — Fix: moved header and tab bar outside scroll container in EntityPanel.
- **Scroll cutoff at bottom of lists** — Fix: explicit `visibleContentHeight` computed from currentSnap.
- **Excess black space at bottom of lists** — Fix: responsive spacers (pb-24 mobile, 40vh desktop).

### 🟡 Potential Issues (Monitoring)
- **Collections "no moments" on Supabase** — With `?data=static`, Famous Battlefields renders 21 moment cards correctly. With Supabase (default), shows 24 locations but may have rendering issues. The `momentToStoryMap` lookup may fail for moments that exist in Supabase but whose parent stories aren't loaded. Needs investigation if user reports it again.
- **Compact card density on mobile** — User flagged moment cards as "busy" even in compact mode. Park for future session.
- **Landscape map area tiny** — User noted, not a priority.

### 🟡 Open Issues (Non-Bug)
- **Co-located moments (Texas State Cemetery)** — Content issue, convert to place entity.
- **Trump notability ranking** — Scoring issue.
- **188 descriptions over 500 chars** — Trimming pass needed.
- **BUG-4: Entity sub-tab inconsistency** — Low priority, data-driven.
- **Los Alamos polyline overshoot** — 16px offset between polyline SVG coordinates and marker visual centers due to touch target iconAnchor. Not yet fixed.

---

## What Shipped (Session 60)

### Features
1. **Moment click zoom** — Clicking a moment card in StoryPanel/EntityPanel zooms the map to that moment at zoom 14+. Scrolling back to the story/entity header zooms out to show all markers. Uses `zoomToActiveLocation` boolean state wired through App.tsx → MapView.tsx.
2. **Collection polyline suppression** — Collections no longer draw connecting polylines between moments. Guard added to polyline useEffect: `!activeCollection && scrollHighlight.length >= 2`.

### Bug Fixes
3. **Pin jitter** — Removed CSS transform transition from base `.story-marker` state.
4. **Consistent map framing** — Proportional padding (15% viewport) + maxZoom 16 for story/entity fitBounds.
5. **scrollHighlight cleared on navigation** — Prevents all-pins-highlighted state when entering story/entity mode.
6. **Pin dimming opacity** — Raised from 0.12 to 0.3 for visibility.

### Content
7. **"Snub" → "refusal"** — Renamed Booker T. Washington story and updated all text.

---

## Key Decisions Made (Session 60)

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Moment click zoom level | `Math.max(currentZoom, 14)` | Fixed zoom 14, or fitBounds with small padding | Only zooms IN, never out. If user is already at zoom 16, stays there. Zoom 14 gives good street-level context. |
| Zoom-back-out trigger | `onScrollToTop` sets `activeLocation=null` | Separate "zoom out" button, timer-based reset | Natural: scrolling to story header = "show me the whole story". Existing `smartFlyToBounds` handles the rest. |
| Collection polylines | Suppress entirely | Show but style differently, make optional | Collections are curated lists, not chronological narratives. Lines between unrelated moments add visual noise. |
| Dimmed pin opacity | 0.3 | 0.08, 0.12, 0.15 | 0.12 was essentially invisible on light map backgrounds, making polylines look like they overshoot past the last marker. 0.3 is dim enough to not compete but visible enough to show the point exists. |

---

## Current State

### Database
- **304 entities**, **293 stories**, **1,260 moments**, **219 images**, **30 collections**
- **~124/507** planned people fully imported (≥4 moments)
- Pipeline offset: **152** (people 1-152 processed across runs 1-15)

### Key Architecture (Session 60)

**Zoom effect priority chain** (MapView.tsx MapController):
1. Entity mode (no activeLocation) → `smartFlyToBounds` to entity bounds
2. Story mode (no activeLocation) → `smartFlyToBounds` to story bounds
3. Active location (not bounds-locked):
   - `zoomToActiveLocation=true` → `flyTo` zoom 14+ (user clicked a moment card)
   - `zoomToActiveLocation=false` → `panToAboveSheet` instant snap (scroll-driven)
4. Active collection → `smartFlyToBounds` to collection bounds
5. Category filter → `smartFlyToBounds` to category bounds

**`zoomToActiveLocation` state flow:**
- Set `true` in: `handleLocationSelect` (click from panel)
- Set `false` in: `handleScrollLocationSelect` (scroll), `handleEntityScrollLocationActive` (entity scroll), `onScrollToTop` callbacks
- Read in: MapView.tsx zoom effect

**EmergenceLayer highlight architecture:**
- Shared helpers: `getHighlightOpacity()`, `getHighlightRadius()`
- Three code paths all use same helpers: create/update effect, zoomend handler, scroll highlight effect
- `scrollHighlightRef` (ref) keeps highlight state available without being a dependency

---

## Immediate Next Steps

### Priority 1 — Verify & Polish
1. ⬜ **Test moment zoom on Supabase data** — verified with static, need Supabase confirmation
2. ⬜ **Polyline overshoot fix** — 16px offset between polyline coordinates and marker visual centers

### Priority 2 — Content & Data
3. ⬜ **V3 rewrite cleanup** — trim 188 descriptions over 500 chars
4. ⬜ **Apply v3 rewrites to database**
5. ⬜ **32 place→entity conversions**
6. ⬜ **Continue people pipeline** — offset 153

### Priority 3 — Future UX
7. ⬜ **Idle zoom** — slow zoom-in after 1.5s pause on a moment (parked user idea)
8. ⬜ **Reduce ExplorePanel tabs** — 4 tabs → 2 ("Nearby" + "Collections")

---

## Common Commands

```bash
# Dev server
cd deep-maps && npx vite --host --port 5178

# Static file server (for tracker/dashboard)
cd deep-maps && python3 -m http.server 8896

# Pipeline — subagent mode
npx tsx scripts/ingest/notable-people-local.ts --phase prep --offset 153 --limit 25
npx tsx scripts/ingest/notable-people-local.ts --phase assemble --batch <batch-id>

# Audit
npx tsx scripts/audit-wiring.ts

# Regenerate dashboards
npx tsx scripts/generate-tracker.ts
npx tsx scripts/generate-dashboard.ts
```

---

## Architecture Reference

| File | Role |
|------|------|
| `src/App.tsx` | Main layout — variant-aware map/panel split, routing, mode system, `zoomToActiveLocation` state |
| `src/lib/uiVariant.tsx` | UI variant context (default: split) |
| `src/lib/data/provider.tsx` | DataProvider — TanStack Query + Context + loading screen |
| `src/lib/sheetAwareMap.ts` | Sheet-aware map panning — panToAboveSheet |
| `src/components/map/MapView.tsx` | Map + MapController (zoom effect, markers, polylines, `zoomToActiveLocation` prop) |
| `src/components/map/EmergenceLayer.tsx` | Canvas-based moment renderer (highlight-aware) |
| `src/components/panel/ExplorePanel.tsx` | Panel with hybrid nearest/notable sort, scroll-driven highlighting |
| `src/components/panel/StoryPanel.tsx` | Story detail view with moment cards |
| `src/components/panel/EntityPanel.tsx` | Entity detail view with moments/connections/stories tabs |
| `src/components/ui/BottomSheet.tsx` | Mobile bottom sheet — Current + Spotlight variants |
| `src/components/ui/TimelineBar.tsx` | Era chips + date range (merged row) |
