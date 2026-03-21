# Deep Maps — Session Handoff

**Last updated:** 2026-03-20 (Session 60 — UX polish, numbered markers, labels, content audit)
**Branch:** `main`

---

## What Shipped (Session 60)

### UX Features
1. **Moment click zoom** — Clicking a moment card zooms to zoom 14+. Scrolling back to header zooms out. `zoomToActiveLocation` state in App.tsx.
2. **Numbered markers** — 1-based numbers inside marker dots in story/entity mode. Numbers scale with marker size.
3. **Contextual labels** — Active moment shows permanent tooltip (moment name, 2-line max, right-aligned). Other moments show on hover.
4. **Card expansion** — Clicking moment card expands to full description, address, wiki link, entity cards. Works in both full and compact mode. Auto-scrolls to show expanded content.
5. **Smooth scroll panning** — Scroll-driven location changes animate (0.3s) instead of instant snap.
6. **Collection polyline suppression** — Collections don't draw connecting lines.
7. **Collection dimming** — Non-highlighted moments dim to 0.3 (was 0.08, essentially invisible).

### Bug Fixes
8. **Back button pollution** — In-story moment clicks no longer push nav history.
9. **Inconsistent moment zoom** — Click-driven zoom bypasses `userInteractUntil` guard (was blocked for 4s after any flyTo).
10. **Single-moment story jitter** — Stories with 1 moment instant-pan instead of fitBounds animation.
11. **Nearby-moment story jitter** — Stories where all moments already visible skip fitBounds animation.
12. **Tooltip clipping** — Labels render right of marker with max-width, 2-line clamp, ellipsis truncation.
13. **Pin jitter during zoom** — Removed CSS transform transition from base marker state.
14. **scrollHighlight not cleared** — Fixed all-pins-highlighted state on story/entity entry.

### Content
15. **"Snub" → "refusal"** — Booker T. Washington story renamed.

---

## 🟡 Known Jitter Issues (Not Yet Resolved)

- **SRV (Stevie Ray Vaughan)** — 2 moments very close in Austin. Jitter on scroll-to-top despite nearby-bounds fix. Supabase shows only 1 moment (data sync gap). Static has 2.
- **Sam Houston entity** — Jitter on scroll-to-top. Same root cause: fitBounds animating to nearly-identical bounds.
- Root cause theory: the `map.getBounds().contains(bounds)` check may be failing because the story bounds are slightly different from the current viewport after a moment zoom. May need a tolerance-based comparison.

---

## Content Audit Findings (From Voice Note + Investigation)

### Cathedral of Junk — Supabase data mismatch
- Static data is correct: Moment 1 (`junk-cathedral-site`): 4422 Lareina Dr. Moment 2 (`junk-city-hall-hearing`): 301 W 2nd St (City Hall).
- **Supabase shows 4422 Lareina Dr for BOTH moments** — the City Hall hearing address was not synced correctly.
- Pins appear on different map locations (lat/lng is correct in both), but the displayed address text is wrong for the second moment in Supabase.
- **Fix needed**: Update `junk-city-hall-hearing` address in Supabase to `301 W 2nd St, Austin, TX`.

### LBJ / Lady Bird — Combined story, not a wiring bug
- Only ONE story: `lbj-lady-bird-austin` with moments `lbj-driskill-date` + `lbj-lady-bird-lake`
- Both LBJ and Lady Bird are separate entities with `canonicalStoryId` pointing to this story
- The Lady Bird Town Lake moment appears under LBJ because it's a combined story. **Consider splitting into separate stories** if this is confusing.

### De-duplication Audit (Pending — agents were running)
**Stories that should be places** (candidates):
- Stories about specific venues/places rather than narrative arcs need identification
- Examples flagged by user: Congress Avenue Bats, Cathedral of Junk

**Stories that duplicate entities** (need full audit):
- Many biography stories have matching person entities (e.g., `stevie-ray-vaughan` story + `stevie-ray-vaughan` entity)
- This is BY DESIGN (entity.canonicalStoryId links them), but some may need consolidation

**Action needed**: Run full dedup audit in next session. Extract all story IDs + entity IDs, find overlaps, decide which to consolidate.

### Austin Content Feedback (From Voice Note)
| Item | Story/Moment | Issue | Action |
|------|-------------|-------|--------|
| Weak moment name | Lady Bird transforms Town Lake | Too general | Rewrite to be more specific/atomic |
| Questionable moment | Janis Joplin "ugliest man on campus" | Weird choice for UT location | Check if better Janis moment exists |
| Moment specificity | Willie Nelson saves guitar from fire | Location only "area" | Get specific address if possible |
| Too general | Willie Nelson unites hippies/cowboys | Describes an era, not a moment | Make more atomic — specific event/date |
| Michael Dell | First moment shows office park | Dorm room would be more interesting | Consider adding dorm as separate moment |
| Congress Ave Bats | Merlin Tuttle moment pin | Away from bridge, says "area" | Verify location accuracy |
| O. Henry | "Coins servant girl annihilator" | Location approximate | Verify pin matches his residence |
| SRV location | "Coins servant girl annihilator" | Location approximate | Verify pin placement |

### Search UX (Mobile)
- Keyboard covers results on mobile — no visible feedback when typing
- No auto-suggestions / typeahead
- Enter key doesn't surface results visibly
- **Needs**: scroll panel when search activates, real-time filtering as user types, maybe a search overlay

### Supabase Data Sync Gap
- SRV shows 1 moment on Supabase vs 2 in static data
- Implies other content may be out of sync
- **Action**: Re-sync static data to Supabase before content curation work

---

## Key Architecture (Session 60)

**Zoom effect priority chain** (MapView.tsx):
1. Entity mode (no activeLocation) → `smartFlyToBounds` to entity bounds
2. Story mode (no activeLocation) → `smartFlyToBounds` to story bounds (skip if single-moment or all visible)
3. Active location (not bounds-locked):
   - `zoomToActiveLocation=true` → `flyTo` zoom 14+ (bypasses userInteractUntil)
   - `zoomToActiveLocation=false` → `panToAboveSheet` smooth 0.3s
4. Active collection → `smartFlyToBounds`
5. Category filter → `smartFlyToBounds`

**`zoomToActiveLocation` flow:**
- Set `true`: in-story moment click (StoryPanel), entity moment click (EntityPanel `onMomentClick`)
- Set `false`: scroll-driven handlers, `onScrollToTop` callbacks
- Click-driven zoom clears `userInteractUntil` (prevents 4s blocking between clicks)

---

## Immediate Next Steps

### Priority 1 — Data Cleanup (Before Curation)
1. ⬜ **Geo-accuracy audit** — Triple-check ALL lat/lng coordinates. Get as hyperspecific as possible. Cross-reference with Google Maps/Wikipedia. Flag any "area" accuracy moments that could be "exact".
2. ⬜ **Full dedup audit** — Extract all story/entity IDs, find overlaps, decide consolidation
3. ⬜ **Re-sync static → Supabase** — Ensure Supabase matches static data
4. ⬜ **Split LBJ/Lady Bird** — Into separate stories if user confirms
5. ⬜ **Austin content rewrites** — Apply voice note feedback (moment names, specificity)

### Priority 2 — UX Polish
5. ⬜ **Fix remaining jitter** — SRV, Sam Houston (tolerance-based bounds comparison)
6. ⬜ **Search UX on mobile** — At minimum: scroll panel on focus, real-time filtering
7. ⬜ **Polyline overshoot** — 16px offset between polyline coordinates and marker centers

### Priority 3 — Future
8. ⬜ **V3 rewrite cleanup** — trim 188 descriptions over 500 chars
9. ⬜ **Continue people pipeline** — offset 153
10. ⬜ **Reduce ExplorePanel tabs** — 4 tabs → 2

---

## Common Commands

```bash
# Dev server
cd deep-maps && npx vite --host --port 5178

# Pipeline
npx tsx scripts/ingest/notable-people-local.ts --phase prep --offset 153 --limit 25

# Audit
npx tsx scripts/audit-wiring.ts

# Dashboards
npx tsx scripts/generate-tracker.ts
npx tsx scripts/generate-dashboard.ts
```

---

## Architecture Reference

| File | Role |
|------|------|
| `src/App.tsx` | Layout, routing, mode system, `zoomToActiveLocation` state |
| `src/components/map/MapView.tsx` | Map + zoom effect, markers (numbered), polylines, tooltips |
| `src/components/map/EmergenceLayer.tsx` | Canvas markers (highlight-aware, collection dimming) |
| `src/components/panel/StoryPanel.tsx` | Story view, card expansion, scroll handling |
| `src/components/panel/EntityPanel.tsx` | Entity view, `onMomentClick` for click-zoom |
| `src/components/panel/LocationCard.tsx` | Moment card (expansion, compact fallthrough) |
| `src/components/panel/ExplorePanel.tsx` | Explore panel, scroll highlighting, collections |
| `src/index.css` | Tooltip styles (`.dark-tooltip`), marker styles |
