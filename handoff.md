# Deep Maps — Session Handoff

**Last updated:** 2026-04-03 (Session 19)
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)

## Current State
The 3 P0 bugs from FOCUS.md are **resolved and deployed**. The arrow flyTo → navigate → cleanup pipeline works end-to-end on mobile. Labels persist until user interaction, auto-navigate opens entity/story panels after 600ms, and stale labels are cleaned up via nuclear unmount.

## What Session 19 Fixed

### P0 Bug 1: Arrow click → label disappears instead of opening panel
- **Root cause:** `scrollHighlightSourceRef` overwritten by viewport reshuffles during flyTo
- **Fix:** Snapshot source entity at arrow-click time (`arrowFlyRef.sourceSnapshot`). Auto-navigate 600ms after landing. `handleScrollHighlightNavigate` accepts `overrideSource` param.
- **New prop:** `scrollHighlightSource` (state) passed through MapView → EmergenceLayer

### P0 Bug 2: Labels disappearing / wrong card highlighted after flyTo
- **Root cause:** 3s setTimeout auto-deleted labels. Lock released too early in moveEnd.
- **Fix:** No auto-timeout. Labels persist until user pans (dragstart), taps (click), or scrolls to different card (label comparison). Lock NOT released in moveEnd — only by user interaction. `arrowFlyRef.landed` flag distinguishes animation from landed state.

### P0 Bug 3: Stale labels persisting after navigation back
- **Root cause:** React effect early-return paths returned `undefined` (no cleanup). Leaflet markers from moveEnd handler invisible to effect lifecycle.
- **Fix:** All paths return cleanup. Nuclear unmount effect removes all DivIcon markers by `zIndexOffset` (900/1000).

## Key Decisions (and WHY — including what was rejected)

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| Lock release timing | On user interaction only | On moveEnd, after timeout | moveEnd release lets first post-flyTo render overwrite source data |
| Auto-navigate timing | 600ms after landing | Immediate, label-click-only | Immediate: no visual feedback. Click-only: label could be dismissed |
| Stale label cleanup | Nuclear unmount (eachLayer scan) | Effect cleanup only | moveEnd markers exist outside React lifecycle |
| Cleanup function | Inline closure per effect run | useCallback memoized | Simpler, no memoization edge cases |

## Open Issues (prioritized)

### P1: Quick fixes
1. **Current location marker hard to see** — Looks like story markers on satellite. Quick style fix in MapView.tsx geolocation marker. Try white/blue pulsing or larger size.
2. **Intermittent crash on arrow click** — Reported on volcano moment. Likely null ref from `momentStoryMap.get()` returning undefined. Add null guards in `showOffScreenArrow` and overlay effect.
3. **Plausible analytics** — `<script defer data-domain="deepmaps.app" src="https://plausible.io/js/script.js"></script>` in index.html. 2-minute task.

### P2: Features
4. **Infinite horizontal scroll** — Cards scroll endlessly with virtualization. Medium complexity. Needs virtual scroll (react-window or IntersectionObserver). Key challenge: maintaining scroll-active-index with virtualized containers. Affects all HomePage carousels.

### P3: Design strategy (SEPARATE CHAT — not code work)
5. **Content richness vs atomic cards** — User comparing DeepMaps cards to ExploreHere's rich formatted pages. Product design question. User has screenshots. Use `/office-hours` or `/plan-ceo-review`.

## Files Changed This Session
- `src/components/map/EmergenceLayer.tsx` — Arrow flyTo, overlay cleanup, nuclear unmount
- `src/App.tsx` — overrideSource param, scrollHighlightSource state, lock management
- `src/components/map/MapView.tsx` — Pass-through props + updated types
- `CLAUDE.md` — Arrow FlyTo System documentation under Known Gotchas

## Architecture Notes for Next Session
- **arrowFlyRef** in EmergenceLayer now has: `{ lat, lng, label, meta, navigate, sourceSnapshot, cleanup, landed? }`
- **arrowFlyLockRef** in App.tsx is the scroll highlight gate. Set true on arrow click, false on user interaction.
- **scrollHighlightSourceRef** (ref) AND **scrollHighlightSource** (state) both exist in App.tsx — ref for internal reads, state for prop passing.
- The overlay effect has TWO early-return guards: `!landed` (during animation) and `landed + sameEntity` (preserve label). Both return cleanup functions.
