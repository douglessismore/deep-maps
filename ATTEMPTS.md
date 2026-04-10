# Attempts Log — Orphan Click Regressions (Session 33 continued)

Tracks what we've tried so we don't repeat failed approaches.

## Bugs being fixed
1. **Dupe label flash** on orphan click
2. **Label bleeds off left side** after pan
3. **"< Home" resets to US-level zoom** instead of restoring viewport
4. **Second click scrolls to wrong moment** in explorer
5. **Texas 85 → Lewis Hamilton** (nearest-moment hijack)
6. **"< Home" consistently fails viewport preservation** (same as 3)

## Root causes identified (not yet fixed)
- **RC-A:** `handleOrphanMomentClick` bypasses navigation pattern (no `pushNav`, sets both `activeLocation` + `scrollHighlight`, races with auto-scroll effect). Causes 1, 3, 4, 5, 6.
- **RC-B:** Scroll overlay label orientation in `EmergenceLayer` is computed pre-`panTo` and never reconciled post-pan. Causes 2.

## Attempts

### Attempt 1 — earlier session
- Added `snapRequestKey` counter pattern so programmatic snap reruns. ✅ Confirmed in deploy `ac7d7fa`.
- Fixed Vercel build failure (missing panel/helper files). ✅

### Attempt 2 — this session (IMPLEMENTED, awaiting user verification)
- **Fix RC-A:** Rewrite `handleOrphanMomentClick` to:
  - Call `pushNav()` first (so "< Home" restores savedMapView).
  - Use ONLY `scrollHighlight` for the overlay (drop `setActiveLocation` to kill dupe-label race).
  - Set an `orphanClickLockRef` that blocks `ExplorePanel`'s scroll-driven highlight handler during panTo animation (mirrors `arrowFlyLockRef` pattern from Session 19).
- **Fix ExplorePanel auto-scroll race:**
  - Add `viewportLocations.length` (or a version counter) to auto-scroll effect deps so it re-runs after viewport updates.
  - Guard with "only run once per activeLocationId change" using a ref.
- **Fix RC-B:** In `EmergenceLayer` single-moment overlay, center the label horizontally below the dot (always) — removes the left/right orientation dependency entirely, which is what causes the bleed after pan.

### Changes in Attempt 2
- `App.tsx handleOrphanMomentClick`: added `pushNav()`, clears `activeCollection`, seeds `scrollHighlightIdsRef`, sets `arrowFlyLockRef` + 900ms release around panTo.
- `EmergenceLayer.tsx` active-location effect: skips rendering when `scrollHighlight` covers the same moment. `scrollHighlight` added to deps.
- `EmergenceLayer.tsx` single-moment scroll overlay: hoisted icon creation into `buildIcon()`, re-runs on `moveend` via one-shot listener that swaps `marker.setIcon(buildIcon())` and re-attaches click handler. Label now has `max-width:260px` + `white-space:normal` to prevent long names overflowing viewport.
- `ExplorePanel.tsx`: added `programmaticScrollRef` and `lastScrolledLocationIdRef`. Auto-scroll effect now depends on `viewportLocations` and guards against re-scrolling same id. `prevActiveLocationIdRef` resets guard when id changes. Scroll-driven onScroll handler early-returns while programmatic scroll is animating.

### Verification
- `npm run build` ✅ (tsc -b + vite build, 5.04s)
- `npm test` ✅ (14/14)
- User manual test: pending

## Rules
- Do NOT patch symptoms. Go for root cause.
- Do NOT add a lock ref without a clear release path.
- Do NOT touch the arrow flyTo system (separate subsystem per CLAUDE.md).
- Verify: type-check + build locally before pushing.
