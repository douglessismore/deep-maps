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

### Attempt 3 — follow-up regressions (IMPLEMENTED)

**Bugs reported after Attempt 2:**
- Dupe label flash STILL happening on orphan click (mobile)
- All pins dimmed after clicking orphan → Home, only fixes with hard refresh
- Austin jitter: map shakes, two labels flashing between each other

**Root causes found (fresh):**
- **RC-C (dupe label flash):** `EmergenceLayer` pin loop calls `bindTooltip` unconditionally. On touch devices, mobile Safari emits synthetic `mouseover` on tap, which pops the tooltip alongside the scroll-overlay label. The existing `eachLayer → closeTooltip` sweep runs AFTER React renders, so both coexist for ~1 frame. **NOT the same as the past MapView fix** (`permanentTooltip = isActive && !isHighlighted`) — that covered the focused-locations path in MapView, not the emergence layer.
- **RC-D (pin dim persistence):** `getHighlightOpacity` drops non-highlighted moments to 0.08 opacity when `scrollHighlight` is set. `handleBack` / `handleBackToExplore` never clear `scrollHighlight`, so dimming persists.
- **RC-E (jitter vector 1):** My Attempt-2 moveend listener rebuilt the scroll overlay icon on EVERY map move, even when orientation didn't change.
- **RC-E (jitter vector 2):** Scroll-driven `panToAboveSheet` re-fires for the same card if moveend cascades back into the scroll handler.

**Fixes:**
- `EmergenceLayer.tsx`: skip `bindTooltip` on touch devices (`'ontouchstart' in window || navigator.maxTouchPoints > 0`). Click handler now also calls `marker.closeTooltip?.()` synchronously as a belt-and-suspenders fallback.
- `App.tsx handleBack`: clear `scrollHighlight`, `scrollHighlightLabel`, `scrollHighlightMeta`, `scrollHighlightIdsRef`.
- `App.tsx handleBackToExplore`: same scroll highlight clears.
- `EmergenceLayer.tsx` moveend reposition: `buildIcon()` now returns `{icon, key}` where `key` is `'left' | 'right' | 'bottom'`. `onMoveEnd` compares key and skips `setIcon` if unchanged.
- `ExplorePanel.tsx`: `lastScrollPanKeyRef` guards scroll-driven `onScrollHighlight` + `panToAboveSheet` from firing for the same card twice in a row.

### Verification (Attempt 3)
- `npm run build` ✅
- `npm test` ✅ 14/14
- User manual test: pending

### Attempt 4 — PLAN OF ATTACK (not yet implemented)

**Bugs reported after Attempt 3:**
1. **Label still bleeds off left edge** (Tesla pin example) — orientation key fix doesn't help when label is simply too long for max-width.
2. **Wrong-moment on re-click** (CRITICAL) — First click on Josiah works. After panning, re-clicking Josiah shows Obama or Mason Family moment in the panel. Also observed after a fresh refresh + Josiah click landing on Mason Family.
3. **Map jitter/jumping** between different labels — frequent throughout session. User says "wasn't happening earlier today, what changed?" → regression signal.

---

**Theories investigated (documented so we don't re-explore dead ends):**

- **Theory A — re-click early-return in auto-scroll effect (HIGH CONFIDENCE, likely root cause of Bug 2):**
  `ExplorePanel`'s auto-scroll effect guards with `lastScrolledLocationIdRef.current === activeLocationId`. On the SECOND click of the same pin, `activeLocationId` doesn't change, so the guard early-returns and the card is NOT re-centered. Meanwhile the user has scrolled/panned in the interim, so the visible "top" card in the sheet is whatever drifted into view (Mason Family, Obama). User perceives this as "wrong moment selected" — but `activeLocation` in state is actually correct. This is a UX/rendering bug, not a data bug. **Verify:** add console log in `handleOrphanMomentClick` and in ExplorePanel auto-scroll effect to confirm activeLocation.id matches what user clicked but scroll is skipped.

- **Theory B — scroll-overlay label click uses stale `onNavigateRef` (RULED OUT for orphans):**
  Read `handleScrollHighlightNavigate` at App.tsx:668. For `source.type === 'moment'`, it calls `momentToStoryMap.get(source.id)`. If the moment is orphan, `story` is undefined → early return, no navigation. So clicking the scroll overlay LABEL for an orphan does nothing wrong — it's a no-op. Bug 2 is NOT this path.

- **Theory C — card-key `endsWith` collision in ExplorePanel (UNLIKELY but cheap to fix):**
  Auto-scroll effect iterates `locationCardRefs.current.entries()` and matches via `key.endsWith(\`-${activeLocationId}\`)`. If two moment IDs share a suffix (e.g., `xyz-123` and `abc-123`), wrong card could match. Switch to exact match using the full key format `${storyId ?? 'no-story'}-${locationId}`. Low likelihood given ID generation but easy belt-and-suspenders.

- **Theory D — stale closure in EmergenceLayer marker click handler (RULED OUT):**
  Marker creation effect depends on `[filteredMoments, map]`. Cleanup runs on every re-run, removing all markers. Fresh closures on re-creation. The `existing` branch only triggers for intra-run duplicates. Click handler captures the correct moment object.

- **Theory E — scroll-driven `onScrollHighlight` racing with pin click (MEDIUM, likely cause of Bug 3 jitter):**
  When `handleOrphanMomentClick` fires, `mapInstance.panTo(...)` animates. During animation, `moveend` does NOT fire (only on settle), but the pan causes viewportLocations to change → ExplorePanel re-renders → `onScroll` handler may fire if sheet scroll position shifts → calls `onScrollHighlight(otherMoment, ...)` → sets `scrollHighlight` to a DIFFERENT moment → EmergenceLayer rebuilds scroll overlay at the NEW location → moveend handler may trigger another pan via `panToAboveSheet`. Loop: pan → scroll → highlight → pan → scroll → ...
  `arrowFlyLockRef` blocks `handleScrollHighlight` but NOT the panel's internal `onScrollHighlight` → `setScrollHighlight` path.

---

**Plan of attack:**

**Fix #1 — Label bleed (Bug 1):**
Stop playing orientation whack-a-mole. In `EmergenceLayer`'s single-moment scroll overlay `buildIcon()`, ALWAYS anchor the label centered below the dot (no left/right/smart positioning). Use CSS `transform: translateX(-50%)` on an inner span so it self-centers horizontally around the pin regardless of screen position. Reduce `max-width` to something that fits even on narrow phones (~220px). Drop the orientation key logic entirely — overlay never needs to re-orient on moveend because it's always centered. Eliminates moveend icon rebuild (also helps Bug 3).

**Fix #2 — Wrong-moment re-click (Bug 2, CRITICAL):**
Introduce a `snapRequestKey` counter in App.tsx — bump it on EVERY orphan/location click. Pass as a prop to `ExplorePanel`. Auto-scroll effect depends on `[activeLocationId, activeTab, snapRequestKey]`. Remove the `lastScrolledLocationIdRef === activeLocationId` guard — instead, only skip when `snapRequestKey` is unchanged AND id unchanged. This mirrors the `snapRequestKey` pattern already used elsewhere (see commit `ac7d7fa`). Also apply exact-match (not `endsWith`) on card keys to close Theory C.

**Fix #3 — Map jitter (Bug 3):**
Two-part:
(a) Eliminate the overlay moveend handler entirely (Fix #1 removes the need).
(b) Extend `arrowFlyLockRef` semantics to ALSO block `ExplorePanel`'s internal scroll-driven `onScrollHighlight` during pin-click pan animations. Add a new prop `scrollPanLocked: boolean` to ExplorePanel derived from `arrowFlyLockRef.current`. When locked, `onScroll` handler early-returns (same as `programmaticScrollRef`). This breaks the pan → scroll → highlight → pan feedback loop.
(c) If jitter persists, increase the scroll-driven `panToAboveSheet` debounce from 80ms → 200ms to give pans time to settle.

**Verification order:**
1. Implement Fix #1 (label center) — visual check on Tesla pin, check moveend handler removal.
2. Implement Fix #2 (snapRequestKey) — re-click Josiah, confirm card re-scrolls into view.
3. Implement Fix #3 (lock extension) — click several pins in rapid succession, confirm no jitter.
4. `npm run build` + `npm test` + manual mobile test before commit.

**What changed between "earlier today" and now (regression investigation):**
- Attempt 2 added `ExplorePanel`'s `programmaticScrollRef` + `lastScrolledLocationIdRef` guards. The guards are the likely source of the re-click bug.
- Attempt 3 added the moveend orientation-key icon rebuild in `EmergenceLayer`. The rebuild is likely the source of jitter (changes icon → forces marker layer redraw → map reflow).
- Prior to Attempt 2, there was no guard, so re-click always re-scrolled (buggy in a different way — infinite loops — but not "wrong moment" symptom).
- Prior to Attempt 3, scroll overlay icon was built once and never rebuilt.

**Open question — do we need the guards at all?**
The original reason for `lastScrolledLocationIdRef` was to prevent the auto-scroll effect from re-firing when `viewportLocations` changes (added as a dep in Attempt 2). Alternative: keep the guard but bump the counter pattern so intentional clicks bypass it. This is what Fix #2 does.

## Rules
- Do NOT patch symptoms. Go for root cause.
- Do NOT add a lock ref without a clear release path.
- Do NOT touch the arrow flyTo system (separate subsystem per CLAUDE.md).
- Verify: type-check + build locally before pushing.
