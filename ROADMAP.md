# Deep Maps Roadmap

> Persistent feature and content priorities. Updated each session.
> For session-specific context, see `handoff.md`.

---

## UX / Frontend

### High Priority
- [ ] **Static map on scroll** — Map stays put when scrolling through story/moment cards. Only pan on click. Highlight pin without moving map. Prevents disorienting card reshuffle.
- [ ] **Entity type subtabs** — Add type filter row below Stories/Places tabs (All | Biographies | Film | Music | Books). Preserves familiar tab structure, scales to new entity types. Long-term: consider unified browse with faceted filters.
- [ ] **Collection click UX** — Don't zoom out from local view when clicking a collection. Show collection moments within current viewport context.

### Medium Priority
- [ ] **Place story naming** — Stories like "Brooklyn Bridge" and "Empire State Building" need narrative names that pass the "So What?" test (e.g., "The Bridge That Killed Its Designer").
- [ ] **Hyper-specific pin tier** — Add a tier above "exact" for sub-building precision (specific gravesite, specific corner, specific room). Visual distinction on map.
- [ ] **Entity panel "Stories" label** — When showing biography story connection, label it as "Life Timeline" not as a separate story link to avoid confusion.

### Low Priority / Parked
- [ ] Sub-moments (Option A: sub-pins for AR/VR, Option B: separate clustered moments for now)
- [ ] Dark mode
- [ ] PWA wrapper for app store distribution

---

## Content Curation

### In Progress
- [ ] Fix remaining ~237 orphan moments (moments not in any story or collection)
- [ ] 23 person entities still missing biography story wiring

### Top-Down Curation (Global Coverage)
- [ ] **Seed cities batch 2**: Cairo, Beijing, Tokyo, Athens, Jerusalem (20-30 moments each)
- [ ] **Seed cities batch 3**: Mexico City, Delhi, Sydney, Nairobi, Rio de Janeiro
- [ ] **Notable people pipeline**: Next 30 from ranking (start with Gautama Buddha, rank 9)
- [ ] **Write descriptions** for ~196 empty biography stories

### Thematic Collections
- [ ] **Indigenous History** — Wounded Knee, Mesa Verde, and expansion beyond current 15 moments
- [ ] **Nonfiction/Documentary Locations** — 29 more from audit (scripts/output/nonfiction-documentary-stories.md)
- [ ] **Comprehensive Crash Sites** — "Every Commercial Airline Crash Site on Earth"
- [ ] **Music Birthplaces** — Fela Kuti's Lagos, reggae Jamaica, Tropicália São Paulo (fills Africa, Caribbean, South America)
- [ ] **Film Locations Where Real Events Happened** — Schindler's factory, Hotel Rwanda, Bridge on River Kwai
- [ ] **Ancient Trade Routes** — Silk Road, spice routes, amber road
- [ ] **Olympic Host Cities** — Every Olympic venue with key moments
- [ ] **Space Launch Sites** — Cape Canaveral, Baikonur, Wenchang, Tanegashima

### Geographic Gap-Filling
- [ ] Sub-Saharan Africa (most underrepresented region)
- [ ] South America (beyond Machu Picchu/Rio)
- [ ] Southeast Asia (Angkor Wat, Borobudur, but need modern history too)
- [ ] Grid-based coverage audit (split globe into N squares, ensure each land square has content)

### Austin Local (Michael Barnes stories + local history)
- [ ] Import Barnes stories (lower notability bar acceptable for local content)
- [ ] Austin music history (Armadillo World HQ, Continental Club, etc.)
- [ ] Austin civil rights history
- [ ] UT Austin campus moments

---

## Data Quality / Tooling

### Enforcement (Implemented)
- [x] Pre-commit validator (`scripts/validate-data.ts`) — blocks commits with data errors
- [x] Ingestion tracker Review tab with accept/reject workflow
- [x] Temporal impossibility detection (flags dead person tagged on future moment)
- [x] Entity reference validation
- [x] ID uniqueness check
- [x] Content guide v3 with physical presence rule

### Needed
- [ ] **Validator skill integration** — Make `/deep-maps-validator` run automatically during content creation
- [ ] **Duplicate detection** — Automated check for similar moment names/coordinates before creating new content
- [ ] **Add biography-story-visibility check to validator** — Flag any biography story that could leak into user-facing UI
- [ ] **Supabase row count parity check** — Compare static file counts against API response counts
- [ ] **Pin accuracy upgrade pipeline** — Systematic geocoding for the 869 upgradeable moments

---

## Architecture / Scaling

### When hitting ~3,000-5,000 moments
- [ ] Static .ts files → Supabase-only writes (dump for backup)
- [ ] Viewport-based loading (PostGIS spatial queries)
- [ ] Server-side search (Supabase full-text search)
- [ ] Pre-computed clustering at zoom levels

---

## Business / Strategy

### It Happened Here (Prior Art)
- Ken Dodelin's app reached #1 iTunes Travel, "Best iPhone Tour App" by Travel+Leisure
- Had 2,000+ events across 10 cities, $2.99 price point
- Pulled due to content cost — LLM pipeline is Deep Maps' structural advantage
- **Action item**: Reach out to Ken when Deep Maps hits 3,000-5,000 polished moments
- Ken now at Georgetown business school, involved in AI projects
- Add to gstack officehours for strategy discussion

### Monetization Considerations
- Freemium vs one-time purchase vs subscription
- IHH proved $2.99 works at scale
- Deep Maps targeting millions of moments vs IHH's 2,000
- PWA can be wrapped for app stores

---

*Last updated: 2026-03-22*
