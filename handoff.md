# Deep Maps — Session Handoff

**Last updated:** 2026-03-31 (Session 16)
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** deepmaps.app (Vercel + Supabase)
**Latest commit:** `ab998a1`

---

## CRITICAL: Launch from Project Root

```bash
cd ~/Documents/claude-code-projects/deep-maps && claude
```

NOT from the parent directory. MCP servers, slash commands, and settings only load when CWD matches the project root.

---

## Resources to Load (read these at session start)

| File | What | Why |
|------|------|-----|
| `handoff.md` (this file) | Session state, decisions, architecture | Orientation |
| `CLAUDE.md` | Project conventions, stack, negative constraints | Code rules |
| `ROADMAP.md` | Feature/content roadmap with priorities | What's next |
| `TODOS.md` | Actionable follow-up items with context | Deferred work |
| `DATA-SOURCES.md` | 25+ data source ideas with URLs + feasibility | Content pipeline |
| `scripts/ingest/lib/content-guide-v3.md` | Content creation standards (v3) | Quality bar |
| `.claude/commands/deep-maps-validator.md` | Validator skill (13 checks) | Content QA |
| `designs/stitch/labyrinthian_noir/DESIGN.md` | V2 design system spec from Stitch | Design reference |
| `~/.gstack/projects/douglessismore-deep-maps/sirdouglas-main-design-20260323-114828.md` | Office Hours design doc (viral launch strategy) | Product strategy |

---

## Current State

- **App:** Deep Maps — geospatial storytelling app (React 19 + TypeScript + Vite + Tailwind 4 + Leaflet + Wouter)
- **Data:** ~2,428 moments, 575 entities, 552 stories, 28 collections in Supabase
- **Backend:** Supabase is source of truth for production
- **Deployed:** Vercel at deepmaps.app, shareable URLs working (`/c/:id`, `/s/:id`, `/e/:id`)
- **Dev server:** `npx vite --host --port 5178`
- **Admin panel:** Live at `/admin`
- **Rapid Verify:** Live at `/verify`
- **Tests:** Vitest installed, 7 tests for content-type filter (first test infrastructure)
- **Typography:** Newsreader (serif), Manrope (sans), Space Grotelock (mono) — applied to both V1 default and V2 themes
- **Default tile:** Vivid Satellite (Esri World Imagery with CSS filter: `contrast(1.2) saturate(1.4) brightness(0.92) sepia(0.08)`)

---

## What Was Done This Session (2026-03-31 Session 16)

### Content Fixes

1. **McKinney Falls place entity added** — `mckinney-falls-state-park` entity (type: place) with Wikipedia slug. Tagged 4 moments (pilot-knob-eruption, mckinney-falls-indigenous, mckinney-homestead-mill, onion-creek-flood-2013). Story kept as hidden `storyType: 'place'` infrastructure.
2. **del-valle-land-grant removed from McKinney Falls story** — The 1832 Mexican land grant is an independent event, not part of McKinney Falls.
3. **Tavo Hellmund demoted** — Removed entityId from COTA construction moment + deleted `moment_entities` row from Supabase. Not notable enough for a person card.
4. **Santiago del Valle demoted** — Same treatment. Moment still exists as a standalone pin.
5. **Barbara Jordan removed from airport opening** — She died 1996; airport opened 1999. Terminal named posthumously. Per physical presence rule, removed.
6. **Dangling entity refs noted** — `thomas-mckinney`, `pilot-knob`, `onion-creek` are referenced in moment entityIds but have no entity definitions. Pre-existing issue from ingestion pipeline.

### UI Fixes (shipped)

7. **Tooltip flash eliminated** — Replaced Leaflet's tooltip system with inline DivIcon containing both dot and label as a single DOM element. No tooltip repositioning = no flash.
8. **"Zoom out to explore" pill removed** — Was confusing; planned replacement with scroll-driven zoom (see #11 below).
9. **Story/collection click now pans to markers** — Removed `preserveViewport` for story and collection clicks from homepage. Map flies to content. Person clicks still stay local.
10. **Label overflow at map edges fixed** — Added `overflow: visible` to `.leaflet-marker-pane` and `.leaflet-container` so labels near edges aren't clipped.

### Validator Skill

11. **Layer 4: Post-Import Guardrails added** — 5 new checks: entity image completeness, demoted entity cleanup, place story visibility, static load performance, content type boundaries.

### Attempted & Reverted

12. **Scroll-driven zoom for off-screen cards** — Attempted 3 times, reverted each time. The approach (auto-zoom map as user scrolls past in-view cards into backfill territory) caused: janky map snapping, scroll position jumping, zoom level instability, cards reshuffling during zoom. **Root cause:** the scroll highlight system and map zoom fight each other — scroll changes trigger map moves, which trigger viewport recalculation, which reshuffles cards, which triggers more scroll events. Needs a fundamentally different architecture (see Next Steps).
13. **"How it Works" card** — Added between hero and first section ("Every pin is a moment..."). User feedback: too busy. Removed.

### Still Pending (carried forward)

- Collection card colors don't match their map pin colors (parked)
- Profile images missing for some entities (no imageUrl in static data or Supabase)
- Collection labels on map still may not show (needs more investigation)
- "See all on map" button for entity/story panels not yet implemented
- Notability threshold could be smarter

---

## What Was Done Previous Session (2026-03-30 Session 15)

### Content Work

1. **49 moments, 18 entities, 23 stories imported** — Across 3 regions: Del Valle TX, Mesa/Phoenix AZ, Seattle/Port Orchard WA. All validated and upserted to Supabase.
2. **Validator ran, all issues fixed** — Descriptions, entityIds, types, dates, addresses all cleaned up.
3. **7 obscure entities demoted** — Below notability threshold.
4. **5 "needs more" people backfilled** — Added 2+ moments each.
5. **Biography stories added** — Hamilton, Verstappen, Andretti, Frank Lloyd Wright.
6. **397 entity imageUrls baked into static `entities.ts`** — From Supabase, so images load even in static fallback.
7. **COTA story reclassified** — `storyType: 'place'` (hidden from browse, infrastructure only).
8. **Content guide v3 updated** — New rule: "places must NOT have separate incident story."

### Loading / Performance

9. **Static-first loading** — App renders immediately from static data; Supabase upgrades in background.
10. **Retry logic + 8s timeout** for Supabase fetches — Prevents infinite loading on slow/failed connections.
11. **Fixed infinite loading screen on mobile** — Was blocking render waiting for Supabase.

### UI / UX

12. **Reverted places row + merged stories/moments** — Premature; needs dedicated design session.
13. **Zoom to nearest 10 pins** (was 20) — Tighter initial view.
14. **Marker visibility tuned** — Softer white border, min 4px radius, min 0.5 opacity.
15. **Continuous GPS tracking** — `watchPosition` instead of `getCurrentPosition`. Map follows user movement.
16. **Stray label fix** — Skip overlay when moments are outside viewport.
17. **Single-moment tooltip auto-direction** — Tooltip flips to stay on-screen.
18. **Section headers renamed** — "Who Was Here", "Stories", "What Happened Here", "Collections".
19. **Collection backfill** — Shows nearest collections when none in viewport.
20. **"Zoom out to explore" pill** — Appears on map when highlighted content is off-screen.
21. **Backfill indicators** — Story/collection cards show visual indicator when item is from backfill (outside viewport).

### Still Pending (carried forward)

- Collection card colors don't match their map pin colors (parked)
- Profile images sometimes don't load on first page load (lazy loading timing)
- Collection labels on map still may not show (needs more investigation)
- "See all on map" button for entity/story panels not yet implemented
- Notability threshold could be smarter (show all markers in areas with no visible markers)

---

## What Was Done Previous Session (2026-03-30 Session 14)

### Content Import

1. **49 moments, 18 entities, 23 stories imported to Supabase** — Across 3 regions: Del Valle TX, Mesa/Phoenix AZ, Seattle/Port Orchard WA.
2. **4 existing collections cross-wired with new moments** — New content integrated into existing collection groupings.
3. **Reusable import script** — `scripts/ingest/import-validated-content.ts` created for batch content imports.

### UI Fixes

4. **Glassmorphism tooltip design** — Frosted glass effect with category color accent bar, fade-up animation.
5. **Map tooltips now clickable** — `tooltipopen` event pattern.
6. **Tooltip overflow fixed** — Labels near map edges no longer clipped.
7. **People horizontal scroll position preserved** — Module-level variable survives unmount/remount.
8. **Horizontal scroll activates section highlight** — No longer requires vertical scroll first.
9. **Back navigation dispatches scroll event** — Forces observer re-evaluation.
10. **Story panel scroll highlighting with pan suppression** — `onHighlightOnly` callback.

---

## What Was Done (2026-03-30 Session 13)

### Scroll Highlight System (fully rewritten)

1. Unified scroll highlight system — `activeHomeSection` + `computeHighlight` as single source of truth.
2. Section observer for all 4 sections: People, Stories, Near You, Collections.
3. Highlights clear when scrolling back to hero (150px threshold).
4. Map labels show parent name for multi-moment highlights, centered on visible markers.
5. Non-highlighted markers shrink + dim (50% radius, 30% opacity).

### Entity Panel

6. Nearest/Timeline toggle replacing dual-section layout.
7. `onHighlightOnly` callback separates marker visuals from map panning.
8. `disableScrollPanForSession` via useRef (fixed closure variable issue).

### Story Panel

9. Scroll highlighting with pan suppression via `onHighlightOnly`.

### Homepage

10. People-first ordering permanent, layout variant switcher (triple-tap), adaptive backfill.

### Map

11. Collection moments sorted by distance, stay-local click behavior, minimum marker opacity 0.35.

---

## What Was Done (2026-03-30 Session 12)

### Scroll Highlight System (initial unified approach)

1. Single source of truth for scroll highlights — `activeHomeSection` + `computeHighlight`. Section observer with closest-section fallback.
2. Stories Near You scroll highlight wiring — `storiesActiveIdx` tracking.
3. Horizontal PersonCard Netflix-style cards (130px, 56px photos) + vertical PersonRow on "See all".
4. Layout variant switcher — triple-tap hero to cycle A/B/C/D orderings.
5. Soft highlight mode — non-highlighted markers dim to 30% alpha, shrink to 50% radius.
6. Entity panel nearby-first sorting (2x viewport) + highlight-without-pan callback.

---

## What Was Done (2026-03-30 Session 11)

### Homepage Section Ordering & Navigation

1. **People-first section ordering made permanent** — Removed URL param toggle (`?order=people-first`). People section is now always first on the homepage.
2. **Stay-local click behavior** — Added `preserveViewport` ref that prevents the map from zooming away when clicking a person, collection, or story from the homepage. Users stay in their current viewport context.
3. **Stories Near You section** — New section between People and In View moments on the homepage. Shows stories with moments in the current viewport.
4. **Adaptive backfill for people and stories** — When viewport has fewer than 5 entries, expands search to 3x viewport bounds and shows nearby entries with a "nearby" label. Prevents empty-feeling sections at tight zoom levels.
5. **Adaptive section titles** — "Notable People" vs "Notable People Nearby", "Stories Near You" vs "Stories Nearby" — titles change based on whether results are in-viewport or backfilled from expanded bounds.
6. **`getExpandedBounds()` helper** — Added to `geo.ts` for computing expanded viewport bounds used by adaptive backfill.

---

## What Was Done (2026-03-30 Session 10)

### Bug Fixes

1. **Scroll position save/restore** — Passive listener wasn't firing. Fixed by snapshotting scroll position directly from DOM before each navigation via `scrollRef` callback.
2. **Category filter in-place** — Now filters without panning map. Respects user's viewport.
3. **Near You card shuffle** — Freezes the moment list while user is actively scrolling horizontally.
4. **Moment click fly-through** — `isNavigating` ref prevents scroll highlight from firing during flyTo.
5. **Card height bumped** — 120px to 140px to fit context lines without cutoff.
6. **Single-word nicknames filtered** — "Austin" falls through to full story name.
7. **Back button labels** — Shows "Home" when coming from home page.
8. **Scroll restore nudge** — 100px upward so clicked card stays in view.
9. **Category pills viewport-aware** — Only show categories with moments in current viewport; out-of-view categories hidden with "Zoom out for more" teaser.
10. **Category pill dimming fixed** — Was making all unselected pills unreadable; now only dims out-of-view categories.
11. **Scroll highlight cleared on category change** — Sticky tooltip no longer persists after switching categories.
12. **Skip far-away scroll pans** — Prevents jarring map jumps during scroll.

### Features Added

1. **Vivid Satellite as default tile**.
2. **Collection "X of Y in view" counter** on collection cards during scroll highlight.
3. **Moment card context lines** — Collection name pill if in collection, otherwise entity count ("3 people - 2 places connected").
4. **People section fade-out gradient** + "See all X people" button at bottom.
5. **Encyclopedia visual polish** — Pill-shaped tab bar, scroll highlight glow with category colors, gradient fade at scroll bottom, collection emoji icons, contextual empty states.
6. **Pixar-style splash screen animation** (SplashScreenD) — Pin bounces into 3D hole.
7. **3D hole effect on splash screen** — Ellipse with depth shadow.

### Product / Strategy

- Synthesized AI council feedback on use cases (Gemini, ChatGPT, DeepSeek, Grok).
- Identified 3 priority personas: Curious Traveler, Rabbit Hole Scroller, Dark History/Niche Fan.
- User testing approach: voice-recorded guerrilla usability tests with brothers.
- Key test question: "What made you stop?"

---

## What Was Done (2026-03-29 Session 9)

### V2 Home Page Bug Fixes

1. Near You card shuffling during scroll — frozen list during active scrolling.
2. Scroll position restore on back navigation — snapshot via `homeScrollElRef` callback ref.
3. Back button labels — default to "Home".
4. Collections filtered to viewport.
5. Moment card context improvements — story nickname, address fallback.
6. Einstein first-moment zoom delay.
7. Entity panel profile photo display.

---

## Key Architectural Decisions

1. **`browseableStories` whitelist** — DataProvider exports `stories` (all) + `browseableStories` (incident-only). UI components use the appropriate one. Whitelist `storyType === 'incident'` means new types are hidden by default.
2. **Concept entities filtered from Dive Deeper** — `entity.type !== 'concept'` in LocationCard + StoryPanel.
3. **Biography stories are invisible infrastructure** — Users see person entities, not biography stories.
4. **Runtime loader uses paginated `.range()`** — NEVER `.limit()` for bulk fetches.
5. **All join tables must be populated** — `moment_entities`, `story_moments`, `collection_moments` required for visibility.
6. **Content guide is single source of truth** — Validator checks AGAINST it, never modifies it.
7. **Sync script runs two passes** — FK ordering requires stories before entities.
8. **Admin panel reads/writes Supabase directly** — No static file dependency.
9. **Vercel Edge Middleware for OG tags** — User-agent detection, direct Supabase REST fetch.
10. **URL routing is state-driven** — Wouter `useLocation` syncs URL and React state.
11. **Deep links activate on DataProvider ready** — URL routing waits for data.
12. **Accuracy tiers:** pinpoint (~3m), exact (~10-50m), approximate (~100-500m), general-area (1km+).
13. **`update_moment_location` RPC** for atomic coordinate updates.
14. **CSS-only animations over Framer Motion** — Framer Motion isn't installed; needed animations (fade+slide, glow) are within CSS capability, avoids ~45KB bundle bloat.
15. **Scroll-highlighted markers get own CSS class** — `scroll-highlighted` class uses `currentColor` for category-colored glow.
16. **No polylines on home page** — At US zoom level, lines spanning the country look like spaghetti. Save polylines for entity/story deep dive.
17. **Collections filtered to viewport** — Prevents irrelevant collections.
18. **IntersectionObserver for card entry** — `once: true` so cards only animate on first appearance.
19. **Near You scroll freeze** — 800ms debounce via `isNearYouScrolling` + `frozenNearYou` ref prevents card reshuffling during scroll.
20. **`isNavigating` ref** — Suppresses scroll highlights during fly-through navigation.
21. **Category filter is filter-in-place** — No map panning on filter change. User chose their viewport, respect it.
22. **Scroll position snapshot is synchronous** — Happens before navigation, not via passive listener.
23. **Single-word nicknames replaced** — Falls through to full story name (code workaround for bad Supabase data).
24. **Context line priority on cards** — Collection pill > entity count > nothing.
25. **Category pills are viewport-aware** — Only categories with moments in view are shown; others hidden with "Zoom out for more" teaser. Unselected pills dim only if out-of-view, not all unselected.
26. **People-first ordering is permanent** — Was behind `?order=people-first` URL param; user decided it's the right default. Toggle removed.
27. **`preserveViewport` ref for stay-local clicks** — Clicking person/collection/story from homepage sets this ref to prevent map flyTo. User stays in their viewport context.
28. **Adaptive backfill with 3x expanded bounds** — When viewport has <5 people or stories, `getExpandedBounds()` expands to 3x and labels results as "nearby". Prevents empty sections at tight zoom.
29. **Unified scroll highlight via `activeHomeSection` + `computeHighlight`** — Single source of truth replaces 5 competing highlight effects. Each section owns its index; system routes to the correct one.
30. **`onHighlightOnly` callback pattern** — Separates scroll highlighting (marker visual update) from map panning. Used in both entity panel and story panel.
31. **Soft highlight dimming in EmergenceLayer** — Non-highlighted markers dim to 30% alpha, shrink to 50% radius. Explore mode only.
32. **Layout variant switcher (hidden)** — Triple-tap hero text cycles A/B/C/D section orderings via CSS flexbox `order`. Power-user/testing feature, not exposed in UI.
33. **Entity panel nearby-first sorting** — Moments split into "Nearby" (2x viewport) and "Full Timeline" sections. Spatial context before chronological completeness.
34. **`disableScrollPanForSession` via useRef** — Entity panel flag that prevents scroll-driven map panning. Must be a ref (not closure variable) to survive re-renders.
35. **Active card detection biased left (30%)** — Leftmost visible card is "active" for scroll highlight, not center card. More natural for horizontal scroll UX.
36. **Map labels positioned beside markers** — Label placed at center of VISIBLE markers in viewport, offset to avoid covering the marker itself. Shows parent name (person/story/collection).
37. **Minimum marker opacity 0.35** — Even fully dimmed markers stay visible enough to notice in sparse areas.
38. **Glassmorphism tooltips** — Frosted glass with `backdrop-filter: blur`, category color accent bar, fade-up CSS animation. Clickable via `tooltipopen` event handler that attaches click listeners.
39. **People scroll position preserved at module level** — Module-scoped variable (not state/ref) survives component unmount/remount during navigation.
40. **Horizontal scroll triggers section observer** — Back navigation dispatches synthetic scroll event to force observer re-evaluation without requiring vertical scroll first.
41. **Static-first loading** — App renders immediately from baked-in static data. Supabase fetch runs in background and upgrades data when ready. Prevents blank screen on slow connections.
42. **Entity imageUrls baked into static files** — 397 entity images in `entities.ts` so faces render even without Supabase. From `scripts/update-entity-images.ts`.
43. **Continuous GPS via watchPosition** — Replaced one-shot `getCurrentPosition` with `watchPosition` for live tracking. Map follows user movement.
44. **Collection backfill** — When no collections match viewport, shows nearest collections globally. Prevents empty Collections section.
45. **"Zoom out to explore" pill** — Map overlay appears when scroll-highlighted content is off-screen. Guides user to zoom out.
46. **Places must not have separate incident stories** — Content guide v3 rule. Place entities get biography stories only; incidents reference the place entity directly. Prevents duplication.
47. **Nearest 10 pins (not 20)** — Tighter initial zoom for more focused experience. Was 20, felt too zoomed out.
48. **Min marker radius 4px, min opacity 0.5** — Ensures all markers remain visible even when dimmed. Previous 0.35 was too faint on satellite tiles.

---

## Not Yet Done (Needs Action)

### Supabase Actions
1. **Run migration 008** against Supabase SQL Editor — `supabase/migrations/008_content_type_constraints.sql`. Adds validation triggers + one-time data cleanup. Safe and reversible.
2. **Remove SGA concept entity** from Supabase `entities` table + its `moment_entities` rows
3. **Clean 3 duplicate moments** in Supabase (Jordan River baptism, Comaneci perfect 10, Einstein papers)
4. **Fix Treaty Oak related-story wiring** — remove from SGA's `related_stories`
5. **6 content fixes from Session 4:** Dazed rename, Booker T delete, Paramount/Scholz wiring, Outlaw rename, backslash audit
6. **Run Supabase data integrity audit** — orphan moments, unlinked moments, concept entities, duplicate moments
7. **Run `dump-from-supabase.ts`** to sync static files (46 stories behind)
8. **Reclassify 14 concept entities** — most should be stories or organizations

### Homepage Polish (from Session 13)
1. **"See all on map" button** — Needed in EntityPanel and StoryPanel
2. **Collection card colors don't match map pin colors** — Parked for now
3. **Profile images lazy loading timing** — Sometimes don't load on first page load
4. **Collection labels on map** — May not show; needs more investigation
5. **Notability threshold for sparse areas** — Should show markers regardless of notability when area is sparse
6. ~~**Story panel highlight-only treatment**~~ — DONE (commit `39ebaf8`)

### Strategic
1. **Ship shareable collection URLs with OG tags** — #1 strategic priority per office hours doc
2. **Add Plausible analytics** — one script tag
3. **Post first collection to Reddit** — Serial Killer Crime Scenes to r/TrueCrime

---

## Open Questions

- Polylines connecting person's moments in chrono order on map
- Story web dimming (highlight active moment, dim siblings)
- Person card highlight prominence on map
- Homepage endless scroll / depth — reaches bottom too quickly
- ~~"Zoom out for more" map chip~~ — Removed (pill was confusing)
- "See all" label clarity — should show counts and be more descriptive
- ~~Encyclopedia hierarchy explainer~~ — Tried "How it Works" card, too busy. Consider temporary help tip instead.
- Map tile default may change based on user testing (vivid satellite is current default)
- Collection images blocked by `moment_media` Supabase migration (table is empty for most moments)
- **Off-screen card → map zoom** — Attempted 3x, reverted each time. Scroll-driven zoom causes feedback loops (scroll → zoom → viewport change → card reshuffle → scroll). Needs architecture that decouples card list from viewport. Consider: (A) freeze card list during zoom, (B) use a separate "preview" map state, (C) only zoom on explicit tap, not scroll.
- Stories and places on homepage — Needs dedicated design session (reverted premature attempt)

---

## Next Steps

1. **Off-screen card UX — tap-to-zoom approach (user's idea, Session 16)** — Always list off-screen people/stories/collections after in-view ones, sorted nearest-to-furthest, with an "out of view" indicator. Scrolling does NOTHING to the map (no feedback loop). Only when user TAPS an off-screen card does the map zoom to include that item's nearest marker, THEN navigate to the detail panel. Implementation: click handler calls `flyToBounds` first, waits for `moveend`, then opens the panel. This avoids the scroll↔zoom feedback loop that failed 3 times.
2. **Missing entity profile images** — Many entities in Del Valle area have no imageUrl. Run `scripts/update-entity-images.ts` after adding images to Supabase, or add Wikipedia images manually.
3. **Dangling entity references** — `thomas-mckinney`, `pilot-knob`, `onion-creek` need entity definitions or their entityId refs should be removed from moments.
4. **Stories and places on homepage** — Deferred; needs dedicated design session.
5. **F1 content notability tuning** — Hamilton/Verstappen/Andretti dominate; needs balancing.
6. ~~**Ingestion guardrail in validator skill**~~ — DONE (Layer 4 added).
7. **A/B testing section ordering** — People vs Stories vs What Happened Here first.
8. **Polylines for people** — Chrono connections between a person's moments on map.
9. **Story web dimming** — Highlight active moment, dim siblings.
10. **User testing with brothers** — Voice-recorded guerrilla usability tests.

---

## Known Issues

1. **Desktop header clutter** — V1 header is crowded. V2 header is cleaner.
2. **Map panning randomly** (Andrew's bug) — scroll-driven, not yet fixed
3. **Markers disappearing intermittently** — monitoring
4. **845 orphan moments** without entity links — see TODOS.md
5. **46 stories in Supabase but not in static files** — run `dump-from-supabase.ts` to sync
6. **14 remaining concept entities** — content cleanup needed
7. **V2 collection zoom** — zooms in too far when clicking collections
8. **Collection images** — blocked by `moment_media` Supabase migration
9. **`homeScrollElRef` is null when not on home page** — set via callback ref from HomePage, only valid in that view (handled with optional chaining)
10. **Collection URL deep links (`/c/...`)** persist `activeCollection` across reloads — intentional but means back button behavior differs from fresh-load vs navigated-to
11. **Bad nicknames in Supabase** — some stories have single-word city names as nicknames. Code workaround in place but data should be cleaned.
12. **Vertical scroll unresponsive after horizontal swipe** — Intermittent: touch event conflict with scroll-snap on Near You cards.
13. **"See all" labels not descriptive enough** — Should show counts (e.g. "12 of 540 people nearby").

---

## Architecture Reference

### Key Files

| File | Role |
|------|------|
| `middleware.ts` | Vercel Edge Middleware — OG tags for social crawlers |
| `src/App.tsx` | State, URL sync, deep link activation, `browseableStories` pipeline |
| `src/components/map/MapView.tsx` | Map, markers, polylines, scroll highlight, vivid satellite CSS |
| `src/components/panel/ExplorePanel.tsx` | All 4 tabs, scroll tracking, viewport entity display, scroll position snapshot |
| `src/components/panel/HomePage.tsx` | V2 home page — Near You (with scroll freeze), People, Collections, In View |
| `src/components/panel/StoryPanel.tsx` | Story deep dive: Locations/Wiki tab toggle |
| `src/components/panel/EntityPanel.tsx` | Entity detail view |
| `src/lib/entityHelpers.ts` | `filterBrowseableStories()`, entity functions, viewport entities |
| `src/lib/data/supabase-loader.ts` | Supabase -> app data mapping (paginated fetchAll, cleanStr) |
| `src/lib/data/provider.tsx` | DataProvider: Supabase-first, static fallback, `browseableStories` |
| `src/lib/__tests__/entityHelpers.test.ts` | Vitest tests for content-type filter |
| `scripts/ingest/import-validated-content.ts` | Batch content import to Supabase (reusable) |
| `scripts/update-entity-images.ts` | Bake Supabase entity imageUrls into static entities.ts |
| `scripts/check-drift.ts` | Supabase vs static file parity check |
| `supabase/migrations/008_content_type_constraints.sql` | Validation triggers (not yet run) |
| `.claude/plans/dapper-coalescing-volcano.md` | Visual polish plan (Phases 1-4) |

---

## Session Startup Checklist

0. **Launch Claude Code from project root** — `cd ~/Documents/claude-code-projects/deep-maps && claude`
1. Read this `handoff.md`
2. Read `CLAUDE.md`
3. Read `ROADMAP.md` + `TODOS.md`
4. Read content guide: `scripts/ingest/lib/content-guide-v3.md`
5. Check `.gstack/` for QA reports and design docs
6. Dev server: `npx vite --host --port 5178`
7. Run tests: `npm test`
