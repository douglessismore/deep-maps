# Deep Maps — Session Handoff

**Last updated:** 2026-03-22
**Branch:** `main`
**Deploy:** Vercel via GitHub (repo: douglessismore/deep-maps)
**Production:** deepmaps.app (Vercel + Supabase)

---

## Current State

- **App:** Deep Maps — geospatial storytelling app (React 19 + TypeScript + Vite + Tailwind 4 + Leaflet + Wouter)
- **Data:** 1,453 moments, 304 entities, 158 stories, 23 collections
- **Backend:** Supabase synced and matching static files (0 errors)
- **Dev server:** `cd deep-maps && npx vite --host --port 5178`
- **Validator health score:** 38/100 (see breakdown below)

---

## Key Decisions Made This Session (and WHY)

### 1. Runtime data loader pagination fix (THE big fix)
- **Problem:** supabase-loader's `fetchAll()` used `.limit(10000)` but Supabase caps at 1000 rows server-side
- **Impact:** 453 of 1453 moments were silently missing from the app — Einstein and many other entities invisible
- **Fix:** Paginated `.range()` loop matching the sync script pattern
- **Safeguard:** Added sanity check that logs `console.error` if any fetch returns exactly PAGE_SIZE rows
- **Rejected alternative:** Single large limit — Supabase silently truncates, so pagination is the only reliable approach

### 2. Entity link audit — 56 false positives removed
- **Problem:** Gemini batch enrichment used substring matching: "Great" matched Constantine, "Emperor" matched Charles V, "Smith" matched Adam Smith
- **Scale:** 6% false positive rate across 882 person-entity links
- **Fix:** Removed 56 false links, added 6 missing Constantine links
- **Prevention:** Content guide updated with physical-presence rule to prevent recurrence

### 3. 57 biography stories created
- **Problem:** 205 of 235 person entities had no canonicalStoryId or biography story
- **Fix:** Created biography stories for 57 most notable figures (Mandela, Picasso, Beethoven, etc.)
- **Remaining:** 131 more person entities still need biography stories (next batch)
- **Note:** Descriptions are empty — need to be written

### 4. EntityPanel rendering fix
- **Problem:** `if (!primaryStory) return null` guard silently dropped story-less moments — panel showed "Moments (7)" but rendered 0 cards
- **Fix:** Removed the guard; LocationCard already handles optional story prop

### 5. Sync script fixes
- Added `canonical_story_id` to `syncEntities()` (was completely missing)
- Fixed description NOT NULL constraint (empty string instead of null)
- Added `fetchAll` pagination to sync script and `audit-wiring.ts`
- All three scripts (loader, sync, audit) now use consistent paginated fetching

### 6. Content guide updates
- Physical presence rule for entity linking
- Official/Wikipedia naming convention for stories
- Duplicate prevention checklist

### 7. Deep Maps Validator skill created
- `.claude/commands/deep-maps-validator.md` — invoke via `/deep-maps-validator`
- Also copied to `networking-dashboard-fresh/.claude/commands/` for cross-project access
- 3 layers: structural validation, content quality scoring, technical wiring checks

---

## Validator Health Score Breakdown

**Score: 38/100**

| Issue | Count | Severity |
|-------|-------|----------|
| Orphan moments (not in any story) | 823 | CRITICAL |
| Moments with no entityIds | 594 | HIGH |
| Person entities missing canonicalStoryId | 131 | HIGH |
| Moments not in any collection | 1028 | MEDIUM |
| Stories with no relatedStoryIds | 72 | LOW |
| Orphan entities (no moments reference them) | 55 | LOW |

---

## Content Roadmap

### Approach 1: "Stories That Should Exist" (IN PROGRESS)
- Full audit at `scripts/output/missing-stories-audit.md`
- **Top 10 priority:** Titanic, Pompeii, Apollo 11, Chernobyl, Berlin Wall, 9/11, Tutankhamun, Trail of Tears, Great Pyramid, Rwandan Genocide
- 50 total missing stories identified across all categories and regions

### Approach 2: Seed Cities
- Fill out Rome, Paris, London, NYC, Istanbul, Beijing, Cairo
- Also US cities: New Orleans, San Francisco, Chicago, Philadelphia, DC
- Target: 20-50 moments per city

### Approach 3: Genre Collections
- Movies: where Oscar-winning films really happened
- Music: where genres were born (fills Sub-Saharan Africa, South America, Caribbean)
- Documentaries: locations you can visit

### Approach 4: Regional Gap Filling
| Region | Current | Target |
|--------|---------|--------|
| Southeast Asia | 3 | 30+ |
| South America | 8 | 50+ |
| Sub-Saharan Africa | 24 | 50+ |
| North Africa | 4 | 20+ |
| Central America | 4 | 20+ |

### People Pipeline
- 507 people queued in ranked order
- 175 already imported, next 30 identified
- Buddha (rank 9) is the highest-priority missing person
- Next batch: Archimedes, Qin Shi Huang, Dante, Marco Polo, etc.

### Curation Ideas (from user feedback)
- **Indigenous History Collection**: Wounded Knee, Sand Creek Massacre, Cahokia, Mesa Verde, Inca Empire (Machu Picchu/Cusco), Aztec Empire (Tenochtitlan), Maya collapse, Aboriginal Australian songlines, Māori arrival, Sitting Bull, Crazy Horse, Geronimo, Tecumseh, Pachacuti, Montezuma
- **Nonfiction Books & Documentaries**: Full audit at scripts/output/nonfiction-documentary-stories.md. Tier 1 includes In Cold Blood, Into Thin Air, Devil in the White City, Killers of the Flower Moon, Making a Murderer, Endurance/Shackleton, Serial, Free Solo
- **Comprehensive Crash Sites Collection**: "Every Commercial Airline Crash Site on Earth" — similar in spirit to the nuclear detonations collection. Replace or evolve the current "Aviation Disasters" collection into something more comprehensive and data-driven
- **Music Birthplaces**: Where genres were born — fills Sub-Saharan Africa (Fela Kuti's Lagos), Caribbean (reggae), South America (Tropicália)
- **Film Locations Where Real Events Happened**: Not "filmed here" but "happened here" — Schindler's factory, Hotel Rwanda, Bridge on the River Kwai

---

## Immediate Next Steps

1. **Wire 823 orphan moments into stories** — biggest health score improvement
2. **Create biography stories for remaining 131 person entities** with moments
3. **Start building top 10 missing stories** (Titanic through Rwandan Genocide)
4. **Write descriptions for 57 empty biography stories**
5. **Import Gautama Buddha** (highest-ranked missing person entity)
6. **Run full validator after each batch of changes**

---

## Known Technical Issues

1. **Aretha Franklin entity doesn't exist** — moment linked to entity ID that doesn't exist
2. **Einstein duplicate moments** — `einstein-publishes-relativity` and `einstein-annus-mirabilis-bern-1905` are same event at different Bern addresses
3. **ExplorePanel line 535** filters ALL canonical/biography stories from Stories browse tab — by design but may need revisiting as biography count grows
4. **content-guide-prompt.ts (v2)** still has editorial subtitle rules while `content-guide-v3.md` uses place annotations

---

## Known UX Bugs (Carried Forward)

1. **Back button pollution** — clicking moments creates nav entries
2. **Moment click zoom inconsistency** — some moments don't zoom on click
3. **SRV single-moment jitter** — scroll-to-top jitter
4. **Polyline overshoot** — 16px offset
5. **Splash screen** — user hasn't reviewed variants B and C

---

## Pending Content Work (Carried Forward)

- Create entities for new collection moments (studios, paleontologists, inventors)
- Fix 3 Evolution moments — year overflow in Supabase (bigint migration needed)
- Willie Nelson non-Austin markers — confusing for "Willie Nelson's Austin"
- LBJ / Lady Bird story split — currently combined story
- Thinkers/Sages collection — only 4 moments, should be 20+
- Biblical descriptions may need future review (user wants more atomic)

---

## Pending Feature Work

- **Collection click UX** — plan at `.claude/plans/adaptive-noodling-deer.md`. When clicking a collection from zoomed-in view, don't zoom out; show in-view moments. "Show all on map" button for explicit zoom-out.
- **SEO landing pages** for collections
- **More collections:** Harry Potter, Breaking Bad, historic concerts
- **Admin panel** for non-developer content curation
- **Automated testing** — zero tests currently
- **Supabase bigint migration** for deep-time year values
- **Notability scoring transparency**

---

## Architecture Reference

### Data Flow
```
Supabase (PostGIS) ← SINGLE SOURCE OF TRUTH
    ↓ (runtime)
supabase-loader.ts → provider.tsx → App components
    ↓ (backup)
dump-from-supabase.ts → static .ts files (git)
    ↓ (seed)
seed-supabase.ts → fresh Supabase instance
```

- App reads from Supabase at runtime (NOT from static .ts files)
- Static files are seed data for the sync script
- The sync script pushes static -> Supabase
- `dump-from-supabase.ts` pulls Supabase -> static (for backup/versioning)
- All three data paths (loader, sync, audit) now use paginated `fetchAll`

### Key Files

| File | Role |
|------|------|
| `src/App.tsx` | State, routing, mode system |
| `src/components/map/MapView.tsx` | Map, markers, polylines, tooltips |
| `src/components/panel/ExplorePanel.tsx` | Explore panel, collections, scroll |
| `src/components/panel/StoryPanel.tsx` | Story detail view |
| `src/components/panel/EntityPanel.tsx` | Entity detail view |
| `src/components/panel/LocationCard.tsx` | Moment card (supports story-less moments) |
| `src/components/ui/SearchOverlay.tsx` | Real-time search |
| `src/lib/data/provider.tsx` | Data loading (Supabase primary, static fallback) |
| `src/lib/data/supabase-loader.ts` | Supabase -> app data mapping |
| `src/lib/entityHelpers.ts` | Entity helper functions |
| `src/lib/geo.ts` | Viewport bounds (includes story-less moments) |
| `src/lib/sheetAwareMap.ts` | Mobile sheet padding calculations |
| `scripts/full-sync-to-supabase.ts` | Static -> Supabase sync (doesn't sync coordinates) |
| `scripts/dump-from-supabase.ts` | Supabase -> static backup (paginated) |
| `scripts/audit-wiring.ts` | Data integrity audit script |
| `scripts/ingest/lib/content-guide-v3.md` | Content standards (v3) |
| `scripts/output/missing-stories-audit.md` | Full missing stories audit |
| `scripts/output/people-pipeline-next-batch.md` | People pipeline batch |
| `scripts/output/pin-accuracy-audit.md` | Pin accuracy audit |
| `scripts/output/entity-link-audit.md` | Entity link audit |
| `.claude/commands/deep-maps-validator.md` | Validator skill |
| `CONTENT-SCALING-PLAN.md` | Full scaling roadmap |

### Guardrails
- Pre-push hook: `tsc -b` runs before every push
- Supabase fallback: static files load if Supabase fails
- `full-sync-to-supabase.ts` skips coordinate updates (text fields only)
- `dump-from-supabase.ts` paginates beyond 1000 rows

---

## Business/Strategy

### It Happened Here — Prior Art & Strategic Context
- Ken Dodelin created "It Happened Here" app (2013-2016), reached #1 in iTunes Travel category
- Named "Best iPhone Tour App" by Travel+Leisure
- Had 2,000+ events across 10 cities (NYC, LA, SF, DC, Chicago, London, Paris, Rome, Berlin, Barcelona)
- Pulled from app store due to content cost and software maintenance
- Sold for $2.99 — validates willingness to pay for this type of content
- Doug reached out in 2017 and 2019 — Ken was open but had investment partner constraints
- Ken is now at Georgetown business school, involved in AI projects
- **Action item**: Reach out to Ken again once Deep Maps has 3,000-5,000 moments and a polished demo
- **Lesson**: Content cost was the killer — LLM-assisted pipeline is Deep Maps' structural advantage
- **Monetization signal**: $2.99 price point with #1 ranking = proven demand. Deep Maps will be 1000x better.
- Add to gstack officehours prompt draft for business strategy discussion
- Ken's links: ithappenedhere.com, Georgetown profile, Crunchbase, CXO Talk AI episode

### App Store Monetization Potential
- IHH proved $2.99 price point works for travel/history apps at scale
- Deep Maps will have dramatically more content (targeting millions of moments vs 2,000)
- PWA can be wrapped for app stores (or go native later)
- Consider: freemium (free browse, paid offline/premium stories), one-time purchase, subscription
- Add to gstack officehours strategy discussion

---

## Session Startup Checklist

1. Read `handoff.md` and `CLAUDE.md`
2. CWD locked to `networking-dashboard-fresh` — use full paths for deep-maps
3. User accesses production at **deepmaps.app** (Vercel + Supabase)
4. **Always verify Vercel deployment after push** (`gh api .../deployments`)
5. **Always use `tsc -b` not `tsc --noEmit`** — Vercel uses `-b`
6. **Always dump from Supabase before editing static files** — static may be stale
