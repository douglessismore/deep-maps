# Deep Maps Roadmap

> Persistent feature, content, and strategy priorities. Updated each session.
> For session-specific context, see `handoff.md`.

---

## 🔴 Immediate / Quick Wins

- [ ] **Static map on scroll** — Map stays put when scrolling through cards. Only pan on explicit click. Highlight pin without moving map.
- [ ] **Fix Einstein duplicate moments** — `publishes-relativity` vs `annus-mirabilis` are same 1905 event at two Bern addresses. Merge.
- [ ] **Fix tenochtitlan-fall moment** — has Istanbul subtitle text (data bug from seed city batch)
- [ ] **Fix 3 Evolution moments** — year overflow in Supabase (bigint migration needed for deep-time years)
- [ ] **Willie Nelson non-Austin markers** — confusing for "Willie Nelson's Austin" story
- [ ] **LBJ / Lady Bird story split** — currently combined, should be separate person entities
- [ ] **Thinkers/Sages collection** — only 4 moments, should be 20+
- [ ] **content-guide-prompt.ts (v2) cleanup** — still has editorial subtitle rules; v3 is the source of truth

---

## 🟡 UX / Frontend

### High Priority
- [ ] **In-app admin panel (`/admin`)** — Full CMS for content management. Tabs: Stories | Moments | People | Places. Queue with approve/reject/edit/notes. User ratings alongside system notability scores. Dive deeper link auditing. Geo accuracy flagging. Reads/writes Supabase directly.
- [ ] **Entity type subtabs** — Add type filter row below Stories/Places tabs (All | Biographies | Film | Music | Books | Artifacts). Preserves familiar tab structure, scales to new entity types.
- [ ] **Collection click UX** — Don't zoom out from local view when clicking a collection. Show in-viewport moments. "Show all on map" for explicit zoom-out. Plan at `.claude/plans/adaptive-noodling-deer.md`.
- [ ] **Notability ranking transparency** — System score visible alongside optional user rating. User disagrees Trump should be #1 → user rating provides ground truth for tuning.

### Medium Priority
- [ ] **Hyper-specific pin tier** — Add tier above "exact" for sub-building precision (specific gravesite, specific corner). Visual distinction on map. Parked per user: "not high-pri but the logical conclusion of Deep Maps."
- [ ] **Place story renaming** — Stories like "Brooklyn Bridge" need narrative names that pass the "So What?" test (e.g., "The Bridge That Killed Its Designer").
- [ ] **Back button pollution** — clicking moments creates excessive nav history entries
- [ ] **Moment click zoom inconsistency** — some moments don't zoom on click
- [ ] **SRV single-moment jitter** — scroll-to-top jitter on single-moment stories
- [ ] **Polyline overshoot** — 16px offset on story path lines
- [ ] **Splash screen** — user hasn't reviewed variants B and C

### Low Priority / Parked
- [ ] Sub-moments (Option A: sub-pins for AR/VR better long-term; Option B: separate clustered moments for now)
- [ ] Dark mode
- [ ] PWA wrapper for app store distribution
- [ ] SEO landing pages for collections

---

## 📚 Content Curation

### In Progress
- [ ] Fix remaining ~237 orphan moments (not in any story or collection)
- [ ] 23 person entities still missing biography story wiring
- [ ] Write descriptions for ~196 empty biography stories

### Top-Down Curation (Global Coverage)
- [ ] **Seed cities batch 2**: Cairo, Beijing, Tokyo, Athens, Jerusalem (20-30 moments each)
- [ ] **Seed cities batch 3**: Mexico City, Delhi, Sydney, Nairobi, Rio de Janeiro
- [ ] **Notable people pipeline**: Next 30 from ranking (start with Gautama Buddha, rank 9)
- [ ] **Biblical content audit** — descriptions too narrative, not atomic enough. Compare to Wikipedia. See `feedback_biblical_content.md`.

### Thematic Collections
- [ ] **Nonfiction/Documentary Locations** — 29 more from audit (`scripts/output/nonfiction-documentary-stories.md`)
- [ ] **Comprehensive Crash Sites** — "Every Commercial Airline Crash Site on Earth"
- [ ] **Music Birthplaces** — Fela Kuti's Lagos, reggae Jamaica, Tropicália São Paulo (fills Africa, Caribbean, South America)
- [ ] **Film Locations Where Real Events Happened** — Schindler's factory, Hotel Rwanda, Bridge on River Kwai
- [ ] **Indigenous History expansion** — Wounded Knee, Mesa Verde, plus more beyond current 15 moments
- [ ] **Ancient Trade Routes** — Silk Road, spice routes, amber road
- [ ] **Olympic Host Cities** — Every Olympic venue with key moments
- [ ] **Space Launch Sites** — Cape Canaveral, Baikonur, Wenchang, Tanegashima
- [ ] **More collections**: Harry Potter, Breaking Bad, historic concerts
- [ ] **Books/Movies entity type** — Add as first-class entities (not just stories)

### Geographic Gap-Filling
- [ ] Sub-Saharan Africa (most underrepresented region)
- [ ] South America (beyond Machu Picchu/Rio)
- [ ] Southeast Asia (Angkor Wat, Borobudur, plus modern history)
- [ ] Grid-based coverage audit (split globe into N squares, ensure each land square has content)
- [ ] Country-by-country coverage (US has ~3,143 counties for fine-grained audit)

### Austin Local
- [ ] Import Michael Barnes stories (lower notability bar for local content)
- [ ] Austin music history (Armadillo World HQ, Continental Club, etc.)
- [ ] Austin civil rights history
- [ ] UT Austin campus moments
- [ ] Fix Austin subtitles skipped from session 62 audit

---

## 🔧 Data Quality / Tooling

### Implemented ✅
- [x] Pre-commit validator (`scripts/validate-data.ts`) — blocks commits with errors
- [x] Pre-commit hook wired in `.git/hooks/pre-commit`
- [x] Ingestion tracker Review tab (accept/reject/feedback workflow)
- [x] Temporal impossibility detection (dead person on future moment)
- [x] Entity reference validation + ID uniqueness
- [x] Content guide v3 with physical presence rule (burial sites, sacred sites, apparitions documented)
- [x] Validator skill (`/deep-maps-validator`)
- [x] Entity presence check in tracker (years comparison, temporal violation highlighting)

### Needed
- [ ] **Duplicate detection** — Automated check for similar moment names/coordinates before creating new content. Prevent recurrence of 9/11 + United Flight 93 overlap.
- [ ] **Biography-story-visibility check** — Add to validator: flag any biography story that could leak into user-facing UI
- [ ] **Supabase row count parity check** — Compare static file counts against API response counts
- [ ] **Pin accuracy upgrade pipeline** — Systematic geocoding for 869 upgradeable moments
- [ ] **Full entity link audit automation** — Scan ALL moment-entity links for false positives (not just Rome batch)
- [ ] **Check for other storyType: 'place' stories** — Brooklyn Bridge/Empire State fixed, but may be others

---

## 🏗️ Architecture / Scaling

### When hitting ~3,000-5,000 moments
- [ ] Static .ts files → Supabase-only writes (dump for backup)
- [ ] Viewport-based loading (PostGIS spatial queries)
- [ ] Server-side search (Supabase full-text search)
- [ ] Pre-computed clustering at zoom levels
- [ ] Automated testing (zero tests currently)

---

## 💼 Business / Strategy

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

## 📋 Content Principles (Quick Reference)

- **Content guide**: `scripts/ingest/lib/content-guide-v3.md`
- **Physical presence rule**: Person must have been at exact coordinates at some point. Burial sites valid. Sacred sites valid if person was there during their lifetime. Apparitions are judgment calls.
- **Story naming**: Use most common/official name (Wikipedia article title preferred)
- **Biography = invisible infrastructure**: Users see entities, not biography stories
- **Notability bar**: Recognizable names, or names where the one-liner makes you want to Google them
- **Moment names = events, not places**: Verb-first, describe WHAT HAPPENED
- **Collections = lists, not narratives**: Names should read like "List of..." articles
- **Encyclopedic tone**: Wikipedia's matter-of-fact clarity, not BuzzFeed
- **Dedup rule**: Always search existing content before creating. Check by name, coordinates, and entity links.

---

*Last updated: 2026-03-22*
