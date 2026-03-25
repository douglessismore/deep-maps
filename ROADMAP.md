# Deep Maps Roadmap

> Persistent feature, content, and strategy priorities. Updated each session.
> For session-specific context, see `handoff.md`.

---

## Immediate / Quick Wins

- [ ] **Fix scroll bounce on short stories** — StoryPanel needs same scrollIntoView fix applied to EntityPanel
- [ ] **Static map on scroll** — Attempted 4x, reverted. Needs holistic rethink — map stays put when scrolling cards, only pan on explicit click.
- [ ] **Investigate Armstrong/stuck-story bug** — Back button may not properly reset to explore mode
- [ ] **Fix 3 Evolution moments** — year overflow in Supabase (bigint migration needed for deep-time years)
- [ ] **LBJ / Lady Bird story split** — currently combined, should be separate person entities
- [ ] **Thinkers/Sages collection** — only 4 moments, should be 20+
- [x] ~~**Fix Einstein duplicate moments**~~ — merged (session 2026-03-23)
- [x] ~~**Fix tenochtitlan-fall moment**~~ — fixed Istanbul subtitle (session 2026-03-23)
- [x] ~~**Willie Nelson non-Austin markers**~~ — cleaned up (session 2026-03-23)
- [x] ~~**content-guide-prompt.ts (v2) cleanup**~~ — deprecated (session 2026-03-23)
- [x] ~~**Wikipedia encoding**~~ — fixed 17 percent-encoded slugs (session 2026-03-24)
- [x] ~~**Search back button**~~ — clears search query so tabs aren't filtered (session 2026-03-24)
- [x] ~~**Entity panel jump fix**~~ — no longer jumps to first moment on entry (session 2026-03-24)

---

## UX / Frontend

### High Priority
- [x] ~~**In-app admin panel (`/admin`)**~~ — Full CMS shipped: Overview, Content Queue (2,400+ items, inline editing, ratings, notes, MiniMap, LinkAudit), Roadmap kanban (61 items). Supabase migration 006. (session 2026-03-23)
- [x] ~~**Admin pin editor (Phases 1-8)**~~ — Draggable markers, satellite toggle, geo verification workflow, source URLs, batch review with auto-advance. Supabase migration 007. (session 2026-03-24)
- [x] ~~**DeepMaps branding**~~ — "Deep Maps" renamed to "DeepMaps" everywhere: loading screen, HTML title, OG tags, admin panel (session 2026-03-24)
- [ ] **Admin panel refinements** — User feedback pending, iterate on UX
- [ ] **User-facing "Report Inaccuracy" button** — Crowdsource accuracy fixes from users (v2)
- [ ] **Entity type subtabs** — Add type filter row below Stories/Places tabs (All | Biographies | Film | Music | Books | Artifacts). Preserves familiar tab structure, scales to new entity types.
- [ ] **Place type filtering** — Filter/sort moments by `type_id` (burial, residence, battlefield, landmark, church, cemetery, etc.). Could enable "show me all cemeteries" or "show me all battlefields" browsing. Data already exists in `moment_types` table — needs UI.
- [ ] **Collection click UX** — Don't zoom out from local view when clicking a collection. Show in-viewport moments. "Show all on map" for explicit zoom-out. Plan at `.claude/plans/adaptive-noodling-deer.md`.
- [ ] **Notability ranking transparency** — System score visible alongside optional user rating. User disagrees Trump should be #1 → user rating provides ground truth for tuning.
- [ ] **Story/collection zoom UX** — Maintain zoom level when clicking from zoomed-in view

### Medium Priority
- [ ] **Timeline bar clarity on mobile** — Nate feedback: confusing on mobile, needs UX rethink
- [ ] **Near Me / Surprise Me button clarity** — Nate feedback: buttons unclear, improve labels or onboarding
- [ ] **Pictures for events** — Nate feedback: add images to moment cards (rights/sourcing TBD)
- [ ] **Hyper-specific pin tier** — Add tier above "exact" for sub-building precision (specific gravesite, specific corner). Visual distinction on map. Parked per user: "not high-pri but the logical conclusion of Deep Maps."
- [ ] **Place story renaming** — Stories like "Brooklyn Bridge" need narrative names that pass the "So What?" test (e.g., "The Bridge That Killed Its Designer").
- [x] ~~**Back button prominence**~~ — made more prominent (13px semibold, persistent background) (session 2026-03-23)
- [ ] **Moment click zoom inconsistency** — some moments don't zoom on click
- [ ] **SRV single-moment jitter** — scroll-to-top jitter on single-moment stories
- [ ] **Polyline overshoot** — 16px offset on story path lines
- [ ] **Splash screen** — user hasn't reviewed variants B and C

### Low Priority / Parked
- [ ] Sub-moments (Option A: sub-pins for AR/VR better long-term; Option B: separate clustered moments for now)
- [ ] Dark mode
- [ ] PWA wrapper for app store distribution
- [ ] SEO landing pages for collections

### Long-Term / Premium Features
- [ ] **Tour Guide Mode** — Give your route (A→B), DeepMaps suggests minor detours to pass the most interesting stories. User picks theme preferences ("dark history only", "sports focused", "mix of everything"). LLM generates a geo-coded, geo-triggered narration that strings stories together as a tailored tour — flowing between moments as you walk/drive. Notifications fire at proximity triggers. Could start with simple "what's around me" alerts and build toward the full route-planning + narrative generation. Likely premium feature (LLM token cost per tour). Key tech: PWA geofencing, route optimization, narrative generation pipeline.
- [ ] **Curated walking tours as collections** — Pre-built walking paths (Rome, Paris, London) ordered by geography so moments flow naturally. Could be the "lite" version of Tour Guide Mode — no LLM generation, just curated sequence.

---

## Content Curation

### In Progress
- [ ] **Fix 323 orphan moments** (not in any story or collection)
- [ ] **25 biography wiring issues**
- [ ] Write descriptions for ~196 empty biography stories
- [ ] Merge overnight content agent drafts (Scandinavia/Nordic, Central Asia, Oceania, Caribbean + Science/Culture/Music/Literature)

### Collection Fixes
- [ ] **Rename "Indigenous Peoples: Resistance and Survival"** — too stylized. Should be matter-of-fact so users know what they're filtering to (e.g., "Indigenous History Sites" or similar). Match the directness of other collections.
- [ ] **Walking tour / road trip collections** — Curate collections for specific walking paths (start with Rome, Paris, London) and road trip routes. Pull from best walking tour guides, compile into geo-sequenced collections. Test with seed cities first.
- [x] **US Presidents Burials** — "Where Every US President Is Buried" collection created with all 39 deceased presidents (session 2026-03-25)

### Completed This Session (2026-03-23)
- [x] Crash sites collection — 27 moments (Tenerife, JAL 123, Lockerbie, MH370, Miracle on Hudson, etc.)
- [x] Seed cities batch 2 — Cairo 22, Beijing 22, Tokyo 20, Athens 20
- [x] Notable people — 42 moments (Buddha, Archimedes, Qin Shi Huang, Dante, Marco Polo, al-Khwarizmi, Ibn Khaldun, Murasaki Shikibu, Sima Qian, Zheng He)
- [x] Film locations — Harry Potter 11, Breaking Bad 8, real-event films 9
- [x] Geographic gaps — Canada 10, Pacific NW 10, Latin America 10, Sub-Saharan Africa 10, Southeast Asia 9
- [x] Antimeridian fix (markers show when scrolling west to Asia)
- [x] Moon landing pins moved to Mission Control Houston
- [x] Biography story leak permanent fix at data layer
- [x] Place entities (Brooklyn Bridge, Empire State, Broken Spoke) converted

### Top-Down Curation (Global Coverage)
- [x] ~~**Seed cities batch 2**: Cairo, Beijing, Tokyo, Athens~~ — completed (session 2026-03-23)
- [ ] **Seed cities batch 3**: Mexico City, Delhi, Sydney, Nairobi, Rio de Janeiro
- [x] ~~**Notable people pipeline**: start with Gautama Buddha~~ — Buddha + 41 others added (session 2026-03-23)
- [ ] **Biblical content audit** — descriptions too narrative, not atomic enough. Compare to Wikipedia. See `feedback_biblical_content.md`.

### Thematic Collections
- [ ] **Nonfiction/Documentary Locations** — 29 more from audit (`scripts/output/nonfiction-documentary-stories.md`)
- [x] ~~**Comprehensive Crash Sites**~~ — 27 crash sites added (session 2026-03-23)
- [ ] **Music Birthplaces** — Fela Kuti's Lagos, reggae Jamaica, Tropicalia Sao Paulo (fills Africa, Caribbean, South America)
- [x] ~~**Film Locations Where Real Events Happened**~~ — 28 film locations added (session 2026-03-23)
- [ ] **Indigenous History expansion** — Wounded Knee, Mesa Verde, plus more beyond current 15 moments
- [ ] **Ancient Trade Routes** — Silk Road, spice routes, amber road
- [ ] **Olympic Host Cities** — Every Olympic venue with key moments
- [ ] **Space Launch Sites** — Cape Canaveral, Baikonur, Wenchang, Tanegashima
- [ ] **More collections**: historic concerts, music venues
- [ ] **Books/Movies entity type** — Add as first-class entities (not just stories)
- [ ] **Cool places collection** — Springs, ruins, trails, natural wonders (Nate feedback)
- [ ] **Current events integration** — Tie moments to news for retention (Nate feedback)
- [ ] **Famous Cemeteries collection** — Père Lachaise, Highgate, Hollywood Forever, Green-Wood, Woodlawn, Recoleta, Westminster Abbey. Each cemetery as a strollable cluster of pinpoint burial moments. BG pipeline provides GPS.
- [ ] **US Presidents: Burials & Birthplaces** — All 46 presidents with pinpoint burial + birthplace coordinates. BG for burials, historical markers for birthplaces. Two sub-collections: "Where Presidents Are Buried" + "Where Presidents Were Born"
- [ ] **Notable Graves by Category** — Sub-collections: Scientists' Graves, Writers' Graves, Musicians' Graves, Artists' Graves. Each organized by field, every grave GPS-verified via BG.
- [ ] **Famous Last Resting Places** — Cross-cemetery collection of the most visited individual graves worldwide (Jim Morrison, Elvis, Princess Diana, Marx, Wilde, etc.)

### Geographic Gap-Filling
- [x] ~~Sub-Saharan Africa~~ — 10 moments added (session 2026-03-23), still underrepresented — more needed
- [x] ~~Southeast Asia~~ — 9 moments added (session 2026-03-23), still needs more (Angkor Wat, Borobudur, modern history)
- [ ] South America (beyond Machu Picchu/Rio)
- [ ] Grid-based coverage audit (split globe into N squares, ensure each land square has content)
- [ ] Country-by-country coverage (US has ~3,143 counties for fine-grained audit)

### Austin Local
- [ ] Import Michael Barnes stories (lower notability bar for local content)
- [ ] Austin music history (Armadillo World HQ, Continental Club, etc.)
- [ ] Austin civil rights history
- [ ] UT Austin campus moments
- [ ] Fix Austin subtitles skipped from session 62 audit

---

## Data Quality / Tooling

### Implemented
- [x] Pre-commit validator (`scripts/validate-data.ts`) — blocks commits with errors
- [x] Pre-commit hook wired in `.git/hooks/pre-commit`
- [x] Coordinate sanity check (Earth-only rule) — added session 2026-03-23
- [x] Ingestion tracker Review tab (accept/reject/feedback workflow)
- [x] Temporal impossibility detection (dead person on future moment)
- [x] Entity reference validation + ID uniqueness
- [x] Content guide v3 with physical presence rule (burial sites, sacred sites, apparitions documented)
- [x] Validator skill (`/deep-maps-validator`)
- [x] Entity presence check in tracker (years comparison, temporal violation highlighting)
- [x] Admin panel with content queue, ratings, notes, MiniMap, LinkAudit

### Needed
- [ ] **Duplicate detection** — Automated check for similar moment names/coordinates before creating new content
- [ ] **Biography-story-visibility check** — Add to validator: flag any biography story that could leak into user-facing UI
- [ ] **Supabase row count parity check** — Compare static file counts against API response counts
- [ ] **Pin accuracy upgrade pipeline** — Systematic geocoding for 869 upgradeable moments
- [ ] **Full entity link audit automation** — Scan ALL moment-entity links for false positives (not just Rome batch)
- [ ] **Check for other storyType: 'place' stories** — Brooklyn Bridge/Empire State fixed, but may be others

---

## Architecture / Scaling

### When hitting ~3,000-5,000 moments
- [ ] Static .ts files -> Supabase-only writes (dump for backup)
- [ ] Viewport-based loading (PostGIS spatial queries)
- [ ] Server-side search (Supabase full-text search)
- [ ] Pre-computed clustering at zoom levels
- [ ] Automated testing (zero tests currently)

---

## Business / Strategy

### It Happened Here (Prior Art)
- Ken Dodelin's app reached #1 iTunes Travel, "Best iPhone Tour App" by Travel+Leisure
- 2,000+ events across 10 cities (NYC, LA, SF, DC, Chicago, London, Paris, Rome, Berlin, Barcelona), $2.99
- Pulled due to content cost — **LLM pipeline is Deep Maps' structural advantage**
- Ken now at Georgetown business school, involved in AI (CXO Talk episode on AI)
- **Action**: Reach out when Deep Maps hits 3,000-5,000 polished moments
- **Action**: Add to gstack officehours prompt for strategy discussion
- Links: ithappenedhere.com, Georgetown profile, Crunchbase, CXO Talk

### Monetization
- IHH proved $2.99 works at #1 ranking scale
- Consider: freemium (free browse, paid offline/premium), one-time purchase, subscription
- Deep Maps targeting millions of moments vs IHH's 2,000
- PWA can be wrapped for app stores

---

## Content Principles (Quick Reference)

- **Content guide**: `scripts/ingest/lib/content-guide-v3.md`
- **Physical presence rule**: Person must have been at exact coordinates at some point. Burial sites valid. Sacred sites valid if person was there during their lifetime. Apparitions are judgment calls.
- **Story naming**: Use most common/official name (Wikipedia article title preferred)
- **Biography = invisible infrastructure**: Users see entities, not biography stories
- **Notability bar**: Recognizable names, or names where the one-liner makes you want to Google them
- **Moment names = events, not places**: Verb-first, describe WHAT HAPPENED
- **Collections = lists, not narratives**: Names should read like "List of..." articles
- **Encyclopedic tone**: Wikipedia's matter-of-fact clarity, not BuzzFeed
- **Dedup rule**: Always search existing content before creating. Check by name, coordinates, and entity links.
- **Earth-only coordinates**: Validator blocks non-Earth coordinates (moon landing pins go at Mission Control)

---

*Last updated: 2026-03-24*

## Proximity Notifications (PWA Push + Geofencing)

- [ ] Background geolocation watch (Geolocation API watchPosition)
- [ ] Trigger notification when within 200m of a moment
- [ ] Web Push API integration (works on Android, iOS 16.4+ with installed PWA)
- [ ] User opt-in flow: Enable nearby story alerts
- [ ] Notification content: moment name + one-line description
- [ ] Cooldown logic (max 1 notification per 5 min)
- [ ] Proactive tour guide mode for tourists

## Community Verification (iNaturalist Model)

Crowdsourced pin verification with accuracy tiers and gamification.

### Accuracy Tiers
- **Unverified** — LLM-generated, no human check
- **Admin Verified** — Doug manually verified
- **Community Verified** — 2+ users agree on location
- **Research Grade** — verified with primary source (book, archive, plaque photo)
- **Expedition** — original research that located something for the first time

### Gamification
- [ ] User accounts + verification history
- [ ] Points for verifying pins (harder pins = more points)
- [ ] Leaderboard: top verifiers
- [ ] Streaks: verify X pins in a row
- [ ] Badges: "Verified 100 pins", "Found a new location", "Research Grade contributor"
- [ ] Bounties on hard-to-verify pins (e.g., exact Chisholm Trail start)

### Inspiration
- **iNaturalist**: millions of user submissions → research grade data
- **OpenStreetMap**: community-built map data
- **Wikipedia**: volunteer knowledge curation
- **Geocaching**: gamified location discovery

### Implementation Phases
1. Admin-only verification (current — Rapid Verify tool)
2. Invite-only beta verifiers (trusted friends/historians)
3. Open verification with agreement threshold
4. Bounty system for unverified/hard pins
5. Expedition mode: guided historical research challenges
