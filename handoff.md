# Deep Maps — Session Handoff

**Last updated:** 2026-04-05 (Session 24–25)
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)

## Current State
Sessions 24–25 were a major UX overhaul focused on the main HomePage experience. Added "What's Here" unified carousel, progressive depth labels ("Dive Deeper" / "Dive Even Deeper"), sort toggles on all sections, sticky context bars, nearest-moment zoom, scroll position restoration, and extensive card design iteration. The app's main flow now follows a clear hierarchy: What's Here → Dive Deeper (People/Stories/Moments/Collections) → Dive Even Deeper (Encyclopedia). **Corner label bug** still needs a dedicated session. Content side is blocked on scaling images to all entities/stories.

## What Sessions 24–25 Shipped

### Core Navigation
1. **Nearest-moment zoom** — Clicking a story or entity card from HomePage now flies to the nearest moment on the current map view, not all moments. Both `handleStorySelect` and `handleEntitySelect` in App.tsx compute nearest moment via `distanceMiles` from map center.
2. **Scroll position restoration** — All 5 horizontal carousels (What's Here, People, Stories, Near You, Collections) save scroll position to module-level variables on unmount. Back navigation restores exact position. `isRestoringFromBack` flag prevents viewport-change scroll resets during restore.
3. **Sticky context bars** — StoryPanel and EntityPanel show a sticky bar with name/category when the header scrolls out of view. Uses IntersectionObserver on a sentinel div. Expandable description + "↑ Back to top" link.

### What's Here Carousel (NEW)
4. **Unified carousel** — New top-level "What's Here" section mixing stories, people, and places sorted by distance. First thing users see below the hero.
5. **Card design** — Fixed 150px height, 280px width. Image cards: hero fills top with title overlaid on gradient, type label pill at top-left with frosted glass (`bg-black/50 backdrop-blur`). No-image cards: color bar + text layout. All cards have type label pills (Story/Person/Place) with accent-colored tinted backgrounds.
6. **Moment dedup** — Moments removed from What's Here entirely. Stories and people are the navigable units; moments live in their own section below.
7. **Person avatar alignment** — Avatars align to name text level (mt-4 to clear the type pill).

### Progressive Depth
8. **"Dive Deeper" divider** — Gold (#D4A853) divider with ▼ arrow between What's Here and the People/Stories/Moments sections.
9. **"Dive Even Deeper" divider** — Same style with ▼▼ before the Encyclopedia section. Progressive rabbit-hole feeling.

### Sort Toggles
10. **Moments sort toggle** — Nearest/Timeline pill toggle on the Near You section (was missing, user asked multiple times).
11. **What's Here sort toggle** — Nearest/Timeline toggle on What's Here carousel. Timeline sorts all content types by year.
12. **Section spacing** — All sections normalized to `pt-4 pb-4`. Removed extra divider after Stories.

### Explorer / Encyclopedia
13. **Story hero images** — StoryCard shows 128px hero image with gradient overlay when `story.imageUrl` exists.
14. **Toggle pill style** — Explorer sort toggles match main page pill style (`rounded-full`).
15. **ScrollTimeline** — Vertical timeline with year labels added to explorer story list.

### Other Fixes
16. **PinEditor mobile layout** — Map reduced to 200px on mobile, controls below map, satellite toggle overlaid.
17. **Austin validator errors** — Added missing `barnesMoments` import to `moments.ts`.

## Key Decisions

| Decision | Chosen | Rejected | Why |
|----------|--------|----------|-----|
| What's Here content | Stories + People + Places only | Include moments too | Moments don't have their own images, creating visual inconsistency. Stories are the navigable unit. |
| Card sizing | Fixed 150px height, all same width | Variable height / mixed sizes | User said different sizes "look weird". Fixed height aligns text across cards. |
| Image card type label | Top-left overlay on image with frosted glass | In footer below image | Consistent with no-image cards (label always at top). User noticed inconsistency. |
| Dive Deeper styling | Gold (#D4A853) with ▼ arrows | Gray/subtle dividers | User wanted more prominence, rabbit-hole feeling. Matches Surprise Me gold. |
| Moment dedup approach | Remove moments from What's Here | Suppress duplicate images / suppress cards | Every approach had edge cases. Clean removal is simplest. |
| Person avatar position | Aligned to name text (mt-4) | Centered vertically | User pointed out misalignment — avatar was too high. |

## Open Issues (prioritized)

### P0 — Corner Label Bug (DEDICATED SESSION NEEDED)

**Bug:** When viewing entity panels, moment labels/overlays render in the upper-left corner of the map instead of at correct coordinates. Confirmed on Prince Carl of Solms-Braunfels and Elisabet Ney.

**Investigation so far:**
- EmergenceLayer active overlay (line 800) creates marker without coord validation
- MapView focusedLocations (line 466) creates permanent tooltips on active pins
- Scroll overlay system (line 580+) has proper coord validation
- Three interacting subsystems: EmergenceLayer overlays, MapView permanent tooltips, scroll highlight system
- Also: Arrow click → label disappears instead of opening panel; gray markers for wrong person after arrow click
- See CLAUDE.md "Arrow FlyTo System" section for documented interaction patterns

### P1 — UX Issues (user-reported this session)

1. **What's Here too few items** — When zoomed into area with just a couple pins, only those show. Should have backfill from nearby areas (like other sections do) with "zoom out" hint.
2. **Category filter + empty people** — "No people for this category" should show nearest people in that category from expanded bounds, not empty state with "zoom out" message.
3. **Image lightbox** — Cropped hero images need tap-to-expand.
4. **Entity image upload in admin mode** — Upload works for stories but not entities.
5. **Places not discoverable on main** — `storyType: 'place'` hidden from browse. No way to discover places.
6. **Gray markers not clickable** — Orphan moments on map have no click handler. Need stories created for them or hide from map.
7. **Canonical entity filter in Dive Deeper** — Entities with `canonicalStoryId === story.id` hidden from Dive Deeper on own story.
8. **Labels hiding markers** — LBJ label covers the marker dot.
9. **Downtown Austin shows only 3 moments** — `viewportLocations` may not update after flyTo.

### P2 — Content / Data

10. **Images for all stories/people/places** — Visual cohesion requires images everywhere. Most entities have `wikipediaSlug` — could auto-fetch Wikimedia Commons lead images. Need batch tooling.
11. **845 orphan moments** — Moments in Supabase with no entity links or story links. Need batch wiring script. See TODOS.md.
12. **51 pre-existing validator errors** — Austin stories referencing Supabase-only moments.
13. **Content creation for orphan moments** — NYC area gray markers need stories. Content-guide.md has standards (verb-first moment names, Caravaggio test for entity descriptions, hook-first 8 words).
14. **"Summarize this area" AI feature** — Saved to memory. AI scans visible stories/moments and generates overview with deep links.

### P3 — Future

15. **Batch image pipeline** — Auto-fetch from Wikimedia Commons via `wikipediaSlug`. Scale to thousands of entities.
16. **Image upload for moments** — Moments currently have no images; eventually needed.
17. **Plausible analytics** — Add tracking before user testing.
18. **Viral collection post** — Reddit r/TrueCrime with serial killer collection.

## Content Standards (from content-guide.md)

- **Moment names**: Verb-first, 5-second test ("Capture the Fort" not "The Fort")
- **Entity descriptions**: Caravaggio test — hook-first 8 words, no birth/death dates in first sentence
- **Story names**: Wikipedia article title style
- **Dedup rules**: Check existing entities before creating new ones
- **Notability**: Don't create concept entities — use person/place/organization/work

## Architecture Notes
- **51 pre-existing validator errors** — Austin stories referencing moments in Supabase but not static data. `--no-verify` is acceptable for commits until fixed.
- **Static coord override** — Provider overrides Supabase moment coordinates when static data differs.
- **browseableStories filter**: `storyType === 'incident'` only. Places, biographies, eras hidden from browse.
- **Module-level scroll saves** — 5 variables (`savedWhatsHereScrollLeft`, etc.) persist across HomePage unmount/remount.
- **`isRestoringFromBack`** — Flag prevents viewport-change scroll reset during back navigation, cleared after 500ms.
- **Card highlight style** — `cardHighlightStyle()` helper returns glow + border color for active cards.
- **`.wh-type-label`** — CSS class in index.css for consistent What's Here type label pills.

## Files Changed Sessions 24–25
- `src/App.tsx` — Nearest-moment zoom for story/entity select, `handleEntitySelect` pattern
- `src/components/panel/HomePage.tsx` — What's Here carousel, all sort toggles, Dive Deeper/Even Deeper, card components, scroll save/restore, section spacing
- `src/components/panel/StoryPanel.tsx` — Sticky context bar with IntersectionObserver
- `src/components/panel/EntityPanel.tsx` — Sticky context bar (same pattern)
- `src/components/panel/StoryCard.tsx` — Hero images on story cards
- `src/components/panel/ExplorePanel.tsx` — Pill-style toggles, ScrollTimeline for stories
- `src/components/ui/PinEditor.tsx` — Mobile layout fix (200px map, controls below)
- `src/data/moments.ts` — Austin moments import fix
- `src/index.css` — `.wh-type-label` CSS class
