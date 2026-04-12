# Deep Maps — Project CLAUDE.md

## What This Is
Interactive geospatial storytelling platform. Users explore curated stories tied to real places
through bidirectional map-list interaction. Core mechanic: scrolling stories pans the map AND
panning the map updates the story list. The goal is an addictive "rabbit hole" experience where
interconnected stories make you say "I had no idea."

**Mission:** The most comprehensive map of human history ever made — and beyond.

## Stack
- React 19 + TypeScript + Vite + Tailwind CSS 4 (via @tailwindcss/vite plugin)
- Leaflet + react-leaflet (no API key — CartoDB/Esri free tiles)
- Wouter for routing, Framer Motion available but not yet used
- Wikipedia via MediaWiki Action API (action=parse, CORS origin=*)
- Vitest for testing (`npm test`)
- Dev server: `npx vite --host --port 5178`

## Architecture Patterns
- **3 interaction modes**: explore (map drives list), scroll (list drives map), story (deep dive)
- **Bidirectional map-list**: `isScrollDriving` ref with 600ms timeout prevents feedback loops
- **State lives in App.tsx**: mode, activeStory, activeLocation, categoryFilter, searchQuery, scrollHighlight, activeCollection
- **MapController** is a renderless component inside MapContainer that manages markers and flyTo
- **Categories are fixed**: 7 categories with hardcoded hex colors in lib/categories.ts
- **Accuracy labels**: every StoryLocation has `accuracy: 'exact' | 'approximate' | 'general-area'`
- **Scroll highlight**: separate from activeLocation; markers enlarge + pulse, map panTo (not flyTo)
- **Wikipedia integration**: WikiPanel with storypoint navigator, auto-validated pills, scroll tracking
- **Ref pattern for callbacks**: `const ref = useRef(fn); ref.current = fn;` to avoid useCallback dep churn
- **Collections**: Curated groupings of stories by theme. `StoryCollection` references story IDs. Selecting a collection filters map + story list to only those stories. Third tab in ExplorePanel.
- **browseableStories whitelist**: DataProvider exports `stories` (all types) + `browseableStories` (incident + era). Browse tabs, search, and related stories use `browseableStories`. Entity panels and admin use `stories`. Whitelist: `storyType === 'incident' || 'era'` — new types hidden by default.
- **Concept entities filtered from Dive Deeper**: `entity.type !== 'concept'` in LocationCard + StoryPanel. Concepts are abstract labels, not navigable.

## Key Decisions (and Why)
- **Leaflet over Google Maps**: Free, no API key, good enough tiles. User chose this explicitly.
- **No shadcn/ui**: Went with pure Tailwind for bespoke dark aesthetic.
- **CSS variables for theming**: --bg-primary, --text-primary, etc. defined in index.css
- **forwardRef on LocationCard**: needed for scroll-driven map panning (measuring card positions)
- **flyTo duration = 2.0s**: Deliberately slow so satellite tiles load; was 0.6s and user called it out
- **fitBounds uses flyToBounds**: Same reason — animate smoothly, not instant jump
- **panTo for scroll tracking**: Gentle map movement when scrolling cards; flyTo only for intentional navigation
- **Wiki pills auto-validated**: Only show pills for sections confirmed in rendered HTML (prevents silent failures)
- **wikiSection values verified via API**: MediaWiki sections endpoint, not guessed from article text
- **CSS.escape() for wiki selectors**: Handles apostrophes and special chars in Wikipedia heading IDs
- **Collections are just references**: `StoryCollection.storyIds` points to existing stories — no data duplication
- **LocationLink type for monetization**: `links?: LocationLink[]` on StoryLocation, not yet used in UI but available for affiliate/tour/stay links
- **browseableStories at DataProvider level**: Only incident + era stories in browse/search. Never use raw `stories` for user-facing lists.
- **Concept entities are not navigable**: Filtered from Dive Deeper. Don't create concept entities — use person/place/organization/work.

## Negative Constraints
- Do NOT speed up flyTo animations — user explicitly wants them slow enough for tiles to load
- Do NOT hide the "Surprise Me" button in story mode — it must always be visible for endless rabbit trail
- Do NOT make the list one-directional — map MUST update list AND list MUST update map
- Do NOT use Google Maps API — stick with free tile providers
- Do NOT auto-detect geographic references in text (future feature, not now)
- Do NOT add wikiSection values without verifying them against actual Wikipedia heading IDs
- Do NOT reference `props` in destructured function components — causes runtime crash (learned the hard way)
- Do NOT use raw `stories` array for browse/search UI — always use `browseableStories` from DataProvider
- Do NOT create concept entities — they're abstract labels that duplicate stories. Use person/place/organization/work.
- Do NOT add inline storyType filters in components — filtering is centralized in DataProvider via `browseableStories`

## File Structure
```
src/
  App.tsx                    # Root: all state, mode switching, layout, collection filtering
  main.tsx                   # Entry point
  index.css                  # Tailwind + Leaflet dark overrides + CSS vars + wiki highlight animation
  types/index.ts             # All TS interfaces (Story, StoryLocation, StoryCollection, LocationLink)
  data/stories.ts            # Seed stories (Supabase is source of truth)
  data/moments.ts            # Seed moments
  data/entities.ts           # Seed entities
  data/collections.ts        # Seed collections
  lib/categories.ts          # 7 category colors + importance sizing
  lib/geo.ts                 # Distance calc, viewport filtering
  lib/entityHelpers.ts       # filterBrowseableStories, entity lookups, viewport entities
  lib/data/provider.tsx      # DataProvider: Supabase-first, browseableStories, static fallback
  lib/data/supabase-loader.ts # Supabase → app types (paginated, cleanStr)
  lib/__tests__/             # Vitest tests
  lib/wikipedia.ts           # fetchWikiArticle, cleanWikiHtml, getContentSections (MediaWiki API)
  components/
    map/MapView.tsx          # Leaflet map, MapController, TileSwitcher, markers, scroll highlight
    panel/ExplorePanel.tsx   # Locations/Stories/Collections tabs + collection banner + scroll highlight
    panel/CollectionCard.tsx # Collection summary card with icon, stats, category dots
    panel/StoryPanel.tsx     # Story deep dive: Locations/Wiki tab toggle
    panel/WikiPanel.tsx      # Wikipedia article display + storypoint navigator + scroll tracking
    panel/StoryCard.tsx      # Story summary card
    panel/LocationCard.tsx   # Location card (forwardRef, accuracy label, Google Maps link)
    panel/MediaDisplay.tsx   # Image/YouTube embed with fallback
    ui/Header.tsx            # Logo, Surprise Me, search, category filter bar
    ui/CategoryBadge.tsx     # Category color badge
    ui/ContentWarning.tsx    # Dismissible content warning
```

## Data Model
```typescript
// 7 categories (type is a union, not extensible without updating categories.ts)
type StoryCategory = 'dark-history' | 'last-stands' | 'discovery-science' |
  'arts-culture' | 'mystery-unexplained' | 'political-drama' | 'everyday-extraordinary';

// Location types (string, not a union — flexible)
// Common values: crime_scene, landmark, burial, institution, government,
//   discovery_site, residence, battlefield, natural_feature

// Story has: id, name, nickname?, years, category, description, tags[],
//   contentWarning?, locations[], relatedStoryIds?, wikipediaSlug?

// StoryLocation has: id, name, subtitle, description, lat, lng, type, importance,
//   accuracy, year?, date?, address?, media?, wikiSection?, links?, narrativeContext?

// narrativeContext: Rich background context for AI audio narration + future tour guide.
//   NOT rendered in UI yet. Will be source material for TTS audio clips.
//   Supabase column: narrative_context (TEXT). Synced via sync-to-supabase.ts.
//   
//   STRUCTURE (5 parts, natural paragraph flow, 100-200 words total):
//   1. Physical anchor (1-2 sentences): What you'd see standing on this exact spot TODAY.
//      Be absurdly specific: building name, current use, what replaced the original structure.
//      "You're standing in front of a beige strip mall at 912 Congress Ave. In 1885, this
//      was the home of Eliza Shelly, the Annihilator's sixth victim."
//   2. What happened (2-4 sentences): The event with narrative tension. Human moment, not
//      Wikipedia summary. Sensory details when sources support them.
//   3. Connective tissue (1-2 sentences): How this links to other moments/entities/stories.
//      "The detective who investigated this murder also handled the Treaty Oak poisoning."
//   4. Hyperspecific location detail (1-2 sentences): Exact address, cardinal direction,
//      which side of the street, what's across the road, how to find the exact spot.
//   5. Hook (1 sentence, optional): Surprising fact or unanswered question that pulls you
//      to the next moment. "Nobody was ever charged. The murders just... stopped."
//   
//   VOICE: Conversational second person ("you're standing where..."). Knowledgeable friend,
//   not encyclopedia. NOT: generic historical context, birth/death dates unless relevant,
//   citations, textbook tone.
//   
//   VALIDATOR: narrativeContext must be 50-500 words. Must contain at least one of:
//   address/street name, cardinal direction, or physical description of current state.

// StoryCollection has: id, name, subtitle, description, icon (emoji), storyIds[],
//   featuredLocationIds?, tags[]

// LocationLink has: label, url, type ('affiliate' | 'wiki' | 'source' | 'tour' | 'stay')
```

## Development
```bash
cd /Users/sirdouglas/Documents/claude-code-projects/deep-maps
npm run dev          # or: npx vite --host --port 5178
npm run build        # tsc -b && vite build
npm test             # vitest run
npx tsc --noEmit     # type-check only
```

## Adding New Stories
New stories go directly in `src/data/stories.ts`. Static files are the canonical source of truth.
- Every location MUST have `accuracy` field (exact/approximate/general-area)
- `wikiSection` MUST be verified against actual Wikipedia heading IDs or omitted
- `relatedStoryIds` should reference existing story IDs when connections exist
- Location IDs should be prefixed with story abbreviation (e.g., `btk-courthouse`)

## Syncing Static ↔ Supabase (MANDATORY)
After editing ANY data file (`moments.ts`, `entities.ts`, `stories.ts`, `collections.ts`), you MUST sync to Supabase:
```bash
source .env.local && npx tsx scripts/sync-to-supabase.ts --dry-run  # preview
source .env.local && npx tsx scripts/sync-to-supabase.ts            # live
```
- The sync script uses UPSERT only — it never deletes. If you REMOVE entity links or moments, you must delete the stale rows from Supabase manually.
- The live site (`deepmaps.app`) loads from Supabase. If you skip this step, new content is invisible to users.
- After sync, optionally run `npx tsx scripts/reconcile/detailed-drift.ts` to verify zero drift.
- Do NOT consider a content task complete until sync is done and verified.

## Adding New Collections
Collections go in `src/data/collections.ts`. A collection only references story IDs — no data duplication.
- Every collection needs an `icon` (emoji), `subtitle` (clickbait hook), and `storyIds[]`
- Stories can appear in multiple collections
- `featuredLocationIds` is optional — for cherry-picking specific locations across stories

## Monetization Architecture (future, not yet in UI)
- `LocationLink` type exists on `StoryLocation` for affiliate links, tour links, stay links
- Collections are the SEO/shareable unit — each will eventually have its own URL route
- Planned: "Stays" tab for hotel affiliate links near story locations
- Planned: URL routes per story/location/collection for SEO + deep linking

## Known Gotchas
- Wikipedia reorganizes section headings periodically — wikiSection values can go stale
- WikiPanel auto-validates pills against rendered HTML, so stale sections just disappear (no crash)
- Browser caches JS aggressively with Python HTTP server — use different ports or Vite dev server
- `cleanWikiHtml` handles both modern (`<h2 id="X">`) and legacy (`<span class="mw-headline" id="X">`) Wikipedia HTML

### Arrow FlyTo System (hard-won lessons from Session 19)
The golden arrow → flyTo → navigate system in EmergenceLayer has three interacting
subsystems that can cause subtle bugs. Document these patterns so future debugging
starts from known solutions, not from scratch.

**Problem 1: Viewport reshuffles overwrite entity data during flyTo.**
When `map.flyTo()` changes the viewport, HomePage's people/stories lists reshuffle.
`handleScrollHighlight` fires with wrong-person data, overwriting `scrollHighlightSourceRef`.
**Fix:** `arrowFlyLockRef` in App.tsx blocks `handleScrollHighlight` during flyTo. The lock
is set on arrow click and released only by user interaction (pan/tap/navigate), NOT on moveEnd.

**Problem 2: React effect early returns must still return cleanup functions.**
When the overlay effect returns early (e.g., `arrowFlyRef.landed` same-entity check),
returning `undefined` means React has NO cleanup to run on unmount. Leaflet markers
created by the moveEnd handler (outside React lifecycle) leak onto the map.
**Fix:** Every early-return path returns a cleanup function. Additionally, a dedicated
unmount-only effect iterates all map layers and removes DivIcon markers by `zIndexOffset`
(900 for scroll overlays, 1000 for landed labels) — nuclear cleanup that catches anything
the effect-based cleanup missed.

**Problem 3: Navigation source must be snapshotted at arrow-click time.**
`handleScrollHighlightNavigate` reads `scrollHighlightSourceRef.current`. After flyTo,
this ref may point to the wrong entity (overwritten by reshuffles after lock release).
**Fix:** Snapshot `scrollHighlightSource` into `arrowFlyRef.sourceSnapshot` at click time.
The auto-navigate (600ms after landing) and label click both pass this snapshot as
`overrideSource` to `handleScrollHighlightNavigate`, bypassing the potentially-stale ref.

**Key architectural pattern:** Leaflet markers created outside React effects (e.g., in map
event handlers like `moveend`) are invisible to React's cleanup lifecycle. Always pair
such markers with a nuclear cleanup effect that runs on unmount.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming -> invoke office-hours
- Bugs, errors, "why is this broken", 500 errors -> invoke investigate
- Ship, deploy, push, create PR -> invoke ship
- QA, test the site, find bugs -> invoke qa
- Code review, check my diff -> invoke review
- Update docs after shipping -> invoke document-release
- Weekly retro -> invoke retro
- Design system, brand -> invoke design-consultation
- Visual audit, design polish -> invoke design-review
- Architecture review -> invoke plan-eng-review
- Save progress, checkpoint, resume -> invoke checkpoint
- Code quality, health check -> invoke health
