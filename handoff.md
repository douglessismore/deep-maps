# Deep Maps — Session Handoff

**Last updated:** 2026-03-20 (Session 59 — split layout polish, polylines, auto-zoom removal, dimming fixes)
**Branch:** `main`

---

## Bug Tracker

### ✅ Resolved (Session 59)
- **Story/entity click not zooming** — Root cause: `userInteractUntil` guard blocked ALL zooms for 4s after any map interaction. Fix: mode-change zooms (story/entity entry) bypass the guard entirely; only single-pin pans respect it.
- **Collection click zooms to blank map** — Root cause: `smartFlyToBounds` called from App.tsx without `isProgrammaticMove` flag, so MapController treated it as user interaction. Fix: moved collection zoom into MapController's zoom effect.
- **Pin dimming not working in focused mode** — Two causes: (1) StoryPanel/EntityPanel never set `scrollHighlight`, so dimming had no trigger. Fix: dim based on `activeLocation` in focused mode. (2) DOM opacity update via `getElement()` silently failed on unrendered markers. Fix: always rebuild icon when faded state changes.
- **Pin dimming not working in explore mode** — Root cause: EmergenceLayer's `zoomend` handler reset all marker opacity without checking scroll highlight. Also, create/update effect set normal alpha without checking highlight state. Fix: centralized highlight logic into shared helpers; all code paths (create, update, zoomend, highlight) use same `getHighlightOpacity`/`getHighlightRadius`.
- **Auto-zoom janky on scroll** — Removed entirely (Option A). Polylines communicate geographic scope visually. User controls zoom. Clicking a story still zooms to bounds.
- **Collection scroll snapping to different collection** — Root cause: `updateViewport()` fired after 400ms scroll pause, reshuffling `viewportCollections` and changing which card was closest to center. Fix: skip viewport update during collections list scroll.
- **Entity tab bar hidden for single-tab entities** — Reagan and others with only moments (no connections/stories) showed no tabs. Fix: always render tab bar.
- **Map pin centering in split mode** — Root cause: panels received `sheetSnap='peek'` in split mode, causing phantom offset. Fix: `effectiveSheetSnap='full'` for split mode.

### ✅ Resolved (Session 58)
- **BUG-5: Missing DIVE DEEPER on biographies** — Fix: stopped filtering canonical stories from connectedEntries in StoryPanel.
- **BUG-6: Tab switch resets scroll** — Fix: moved header and tab bar outside scroll container in EntityPanel.
- **Scroll cutoff at bottom of lists** — Fix: explicit `visibleContentHeight` computed from currentSnap.
- **Excess black space at bottom of lists** — Fix: responsive spacers (pb-24 mobile, 40vh desktop).

### ✅ Resolved (Sessions 56-57)
- **Bottom sheet auto-expands on navigation/scroll** — Fix: `fixed inset-0` with `height: 100dvh`.
- **Vercel deploy failures** — Fix: explicit file list in `.vercelignore`.
- **Active pin hidden behind bottom sheet** — Fix: `panToAboveSheet` with project/unproject offset.
- **Map marker clicks not working on mobile** — Fix: `tolerance: 16` on canvas renderer.
- **Moment expansion finicky (BUG-3)** — Fix: removed expansion entirely, always-collapsed with description preview.
- **Scroll-driven map panning blocked** — Fix: isProgrammaticMove flag + 4s cooldown.
- **Default sheet at peek** — Sheet starts at 260px (peek).

### 🟡 Potential Issues (Monitoring)
- **Focused-mode dimming** — User reported "better" for issues 1/2/4/5 but "still not working" for dimming. Latest fix (icon rebuild instead of DOM manipulation) pushed but NOT yet confirmed by user.
- **Compact card density on mobile** — User flagged moment cards as "busy" even in compact mode. Park for future session.
- **Landscape map area tiny** — User noted, not a priority.

### 🟡 Open Issues (Non-Bug)
- **Co-located moments (Texas State Cemetery)** — Content issue, convert to place entity.
- **Trump notability ranking** — Scoring issue.
- **188 descriptions over 500 chars** — Trimming pass needed.
- **BUG-4: Entity sub-tab inconsistency** — Low priority, data-driven.

---

## What Shipped (Session 59)

### Features
1. **Split layout as default** — Vertical flex: map top 45%, panel bottom 55%. No bottom sheet overlay.
2. **Chronological path lines (polylines)** — Connect story/entity moments on the map with dashed polylines, directional arrows at midpoints, and active segment highlighting.
3. **Timeline date range merged with era chips** — Saved 16-20px vertical space by combining year range label with era chip row.
4. **Collapsible entity header on mobile** — Maximizes vertical space in split mode.
5. **Landscape layout support** — `mobile-landscape:flex-row` switches to side-by-side layout.
6. **Category pills hidden on mobile** — `hidden lg:flex` to save space.

### Bug Fixes
7. **Story/entity/collection zoom reliability** — Mode-change zooms bypass user interaction guard.
8. **EmergenceLayer pin dimming** — Centralized highlight logic, fixed zoomend override bug.
9. **Focused-mode pin dimming** — Dim non-active pins based on `activeLocation`, icon rebuild instead of DOM manipulation.
10. **Entity tab bar always visible** — Even single-tab entities show the bar.
11. **Collection scroll stability** — Skip viewport update during collections list scroll.

### Content
12. **Booker T. Washington story renamed** — `booker-t-washington-snub` → `booker-t-washington-denied-capitol`. "Snub" → "refusal" in all descriptions.

---

## Key Decisions Made (Session 59)

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Auto-zoom on scroll | Remove entirely (Option A) | Story-driven zoom, dwell-based zoom, per-card zoom button | Every good map UI avoids this pattern (Google Maps, Airbnb, Apple Maps). Stories at wildly different geographic scales make constant zoom changes jarring. Polylines communicate scope visually. |
| Map pin centering in split mode | `effectiveSheetSnap='full'` | Per-variant offset calculation | Clean: split mode has no sheet, so tell panToAboveSheet there's no offset. |
| Focused-mode dimming trigger | `activeLocation` (no scrollHighlight needed) | Require StoryPanel/EntityPanel to call onScrollHighlight | Simpler: MapController already knows `activeLocation`, no new wiring needed. |
| Collection zoom location | Inside MapController's zoom effect | App.tsx direct `smartFlyToBounds` | Must use `isProgrammaticMove` flag to prevent MapController from treating it as user interaction. |

---

## Current State

### Database
- **304 entities**, **293 stories**, **1,260 moments**, **219 images**, **30 collections**
- **~124/507** planned people fully imported (≥4 moments)
- Pipeline offset: **152** (people 1-152 processed across runs 1-15)

### Key Architecture (Session 59)

**Zoom effect priority chain** (MapView.tsx MapController):
1. Entity mode (no activeLocation) → `smartFlyToBounds` to entity bounds
2. Story mode (no activeLocation) → `smartFlyToBounds` to story bounds
3. Active location (not bounds-locked) → `panToAboveSheet` instant snap (respects user interaction guard)
4. Active collection → `smartFlyToBounds` to collection bounds
5. Category filter → `smartFlyToBounds` to category bounds

**EmergenceLayer highlight architecture:**
- Shared helpers: `getHighlightOpacity()`, `getHighlightRadius()`
- Three code paths all use same helpers: create/update effect, zoomend handler, scroll highlight effect
- `scrollHighlightRef` (ref) keeps highlight state available without being a dependency

**Removed:**
- `storyDrivenZoom` ref and all related suppression logic in ExplorePanel
- Auto-zoom from MapView polyline effect
- Collection zoom from App.tsx (moved to MapController)

---

## Immediate Next Steps

### Priority 1 — Verify & Polish
1. ⬜ **Confirm focused-mode dimming works** — latest fix pushed, awaiting user test
2. ⬜ **Test collection click zoom** — should zoom to collection's moments, not blank map

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
| `src/App.tsx` | Main layout — variant-aware map/panel split, routing, mode system |
| `src/lib/uiVariant.tsx` | UI variant context (default: split) |
| `src/lib/data/provider.tsx` | DataProvider — TanStack Query + Context + loading screen |
| `src/lib/sheetAwareMap.ts` | Sheet-aware map panning — panToAboveSheet |
| `src/components/map/MapView.tsx` | Map + MapController (zoom effect, markers, polylines) |
| `src/components/map/EmergenceLayer.tsx` | Canvas-based moment renderer (highlight-aware) |
| `src/components/panel/ExplorePanel.tsx` | Panel with hybrid nearest/notable sort, scroll-driven highlighting |
| `src/components/panel/StoryPanel.tsx` | Story detail view with moment cards |
| `src/components/panel/EntityPanel.tsx` | Entity detail view with moments/connections/stories tabs |
| `src/components/ui/BottomSheet.tsx` | Mobile bottom sheet — Current + Spotlight variants |
| `src/components/ui/TimelineBar.tsx` | Era chips + date range (merged row) |
