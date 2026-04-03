# Deep Maps Roadmap

> Organized by the 3-gate strategy from the April 2026 market analysis.
> Full strategy: `~/.gstack/projects/douglessismore-deep-maps/sirdouglas-main-design-20260402-111344.md`
> Market research: `scripts/output/market-research-2026-04.md`
> This week's focus: `FOCUS.md`

---

## GATE 1: Content-Market Fit (Target: 10K monthly visitors)

> **The question:** Does anyone engage with this beyond a 3-minute browse?
> **How we know:** 5K+ visitors from viral collections, 3%+ click into moment details, return visits.

### This Week (see FOCUS.md)
- [ ] Watch 3 people use Deep Maps (10 min each, no helping)
- [ ] Add Plausible analytics
- [ ] Post first viral collection to Reddit

### Viral Collection Posts
- [ ] Serial Killer Crime Scenes → r/TrueCrime
- [ ] Nuclear Detonation Sites → r/MapPorn
- [ ] Famous Assassination Sites → r/history or Show HN
- [ ] Crash Sites → r/aviation or r/CatastrophicFailure
- [ ] Film Locations Where Real Events Happened → r/movies

### Content Needed for Viral Success
- [ ] Fix 323 orphan moments (invisible content — wasted assets)
- [ ] Fix 25 biography wiring issues
- [ ] Merge overnight content agent drafts (Scandinavia, Central Asia, Oceania, Caribbean)
- [ ] Scale to 5,000+ moments via LLM pipeline (content density = stickiness)
- [ ] Rename "Indigenous Peoples: Resistance and Survival" — too stylized

### UX Bugs That Hurt First Impressions
- [ ] Fix scroll bounce on short stories
- [ ] Investigate Armstrong/stuck-story bug
- [ ] Moment click zoom inconsistency
- [ ] Collection click UX — don't zoom out from local view
- [ ] Timeline bar clarity on mobile (Nate feedback)
- [ ] Near Me / Surprise Me button clarity (Nate feedback)

---

## GATE 2: Willingness to Pay (Target: 100 subscribers at $20/yr)

> **The question:** Will people pay $20/yr for premium features?
> **How we know:** 100 paying subscribers within 90 days of paywall launch.
> **Prerequisites:** Gate 1 passed. Proven engagement. Real traffic.

### Austin Walking Tour Prototype (Phase 1, Track B)
- [ ] GPS feasibility spike — test `watchPosition` on Android Chrome + iOS Safari
- [ ] Curate 8-12 moment walking tour for downtown Austin (~2 miles)
- [ ] Pre-generate TTS audio via OpenAI TTS API (static MP3s)
- [ ] Build `/walk/austin-history` route (map, pins, polyline, bottom sheet, audio)
- [ ] Print 80-100 QR codes, hand out on 6th Street on Saturday
- [ ] Shadow 3-5 users in person

### Audio Narration (table stakes for paid tier)
- [ ] TTS pipeline for moment descriptions
- [ ] Auto-play audio on GPS proximity (50m)
- [ ] Play/pause controls, skip to next
- [ ] Hands-free travel mode

### Proximity Notifications
- [ ] Background geolocation watch (`watchPosition`)
- [ ] Trigger notification within 200m of a moment
- [ ] Web Push API (Android, iOS 16.4+ installed PWA)
- [ ] User opt-in flow
- [ ] Cooldown logic (max 1 per 5 min)

### Offline Mode
- [ ] Service worker caching for moment data
- [ ] Download collections/regions for offline use
- [ ] Offline map tiles (or graceful degradation)

### Subscription Infrastructure
- [ ] Stripe Checkout + webhook integration
- [ ] Free tier: browse, read, explore, share
- [ ] Premium tier: audio, proximity, offline, advanced collections
- [ ] $20/yr or $4/mo pricing

### SEO Landing Pages
- [ ] Each collection as an indexed landing page
- [ ] OG meta tags for social sharing (already partial)
- [ ] Sitemap generation

### PWA → App Store
- [ ] TWA wrapper for Android (Google Play)
- [ ] iOS PWA install prompt optimization

---

## GATE 3: Scalable Revenue (Target: $5K MRR)

> **The question:** Can this generate meaningful revenue beyond subscriptions?
> **How we know:** $5K MRR from subscription + affiliate + tour sales.
> **Prerequisites:** Gate 2 passed. 100+ paying subscribers. Proven audio/proximity.

### Dynamic Tour Guide (the novel feature nobody else has)
- [ ] Route-based tour generation: user enters A→B, LLM scans nearby moments
- [ ] LLM narrative generation — weave moments into cohesive story
- [ ] TTS conversion with prefetch strategy (2-3 segments ahead)
- [ ] GPS-triggered playback of pre-fetched segments
- [ ] Theme preferences ("dark history only", "sports focused", "mix of everything")
- [ ] Serendipity mode: wander and discover (always-on GPS + real-time generation)

### Affiliate / Transaction Layer
- [ ] LocationLink UI in moment cards ("Book a tour", "Stay nearby")
- [ ] GetYourGuide / Viator affiliate integration (8-12% commission)
- [ ] Hotel affiliate links near story locations (3-5% commission)
- [ ] Ticket affiliate links for museums/sites

### Curated Tour Products
- [ ] Walking tour collections for major cities (Rome, Paris, London, Austin)
- [ ] Road trip tour collections (Route 66, Pacific Coast Highway)
- [ ] Per-tour pricing ($5-10 each) alongside subscription

### Community Verification (iNaturalist Model)
- [ ] User accounts + verification history
- [ ] Accuracy tiers: Unverified → Admin Verified → Community Verified → Research Grade → Expedition
- [ ] Points for verifying pins (harder = more points)
- [ ] Leaderboard, streaks, badges
- [ ] Bounties on hard-to-verify pins
- [ ] Invite-only beta verifiers first, then open

### Creator Platform
- [ ] Michael Barnes CMS use case — journalist story map publishing
- [ ] Creator accounts with content submission
- [ ] Editorial review pipeline
- [ ] Revenue sharing for creator-generated tours

---

## Backlog (not gated — do when relevant or fun)

### Content Expansion
- [ ] Seed cities batch 3: Mexico City, Delhi, Sydney, Nairobi, Rio de Janeiro
- [ ] Music Birthplaces (Fela Kuti's Lagos, reggae Jamaica, Tropicalia Sao Paulo)
- [ ] Ancient Trade Routes (Silk Road, spice routes, amber road)
- [ ] Olympic Host Cities
- [ ] Space Launch Sites
- [ ] Famous Cemeteries collection
- [ ] US Presidents: Birthplaces (burials done)
- [ ] Notable Graves by Category
- [ ] Famous Last Resting Places
- [ ] Nonfiction/Documentary Locations (29 more from audit)
- [ ] Indigenous History expansion
- [ ] Books/Movies entity type
- [ ] Cool places collection (Nate feedback)
- [ ] Current events integration (Nate feedback)
- [ ] Historic concerts, music venues
- [ ] Texas State Cemetery ArcGIS scrape
- [ ] Austin local: Barnes stories, music history, civil rights, UT campus
- [ ] Biblical content audit
- [ ] South America gap-filling
- [ ] Grid-based coverage audit
- [ ] Walking tour collections (Rome, Paris, London)
- [ ] Write descriptions for ~196 empty biography stories
- [ ] Thinkers/Sages collection (needs 20+ moments, has 4)

### UX Polish
- [ ] Entity type subtabs (All | Biographies | Film | Music | Books | Artifacts)
- [ ] Place type filtering (show all cemeteries / battlefields)
- [ ] Notability ranking transparency
- [ ] Story/collection zoom UX
- [ ] Desktop header layout cleanup
- [ ] Pictures for events (rights/sourcing TBD)
- [ ] Hyper-specific pin tier
- [ ] Place story renaming ("So What?" test)
- [ ] Static map on scroll (attempted 4x, needs rethink)
- [ ] SRV single-moment jitter
- [ ] Polyline overshoot (16px offset)
- [ ] Splash screen variants B/C
- [ ] Sub-moments
- [ ] Dark mode
- [ ] LBJ / Lady Bird story split
- [ ] Fix 3 Evolution moments (bigint migration)
- [ ] User-facing "Report Inaccuracy" button

### Data Quality / Tooling
- [ ] Duplicate detection (similar names/coordinates)
- [ ] Biography-story-visibility check in validator
- [ ] Pin accuracy upgrade pipeline (869 upgradeable moments)
- [ ] Full entity link audit automation
- [ ] Reclassify 14 concept entities

### Architecture / Scaling (at 3,000-5,000 moments)
- [ ] Static .ts files → Supabase-only writes
- [ ] Viewport-based loading (PostGIS spatial queries)
- [ ] Server-side search (Supabase full-text)
- [ ] Pre-computed clustering at zoom levels
- [ ] Expand test coverage

### Long-Term Vision
- [ ] AR overlays (Meta Ray-Ban, smart glasses)
- [ ] B2B licensing to tourism boards / DMOs
- [ ] Data licensing
- [ ] Reach out to Ken Dodelin (IHH founder) at 3-5K polished moments

---

## Business / Strategy Reference

### Competitive Landscape (April 2026)
| Competitor | Content | Model | Status |
|-----------|---------|-------|--------|
| ExploreHere | 240K markers (US) | $20/yr subscription | Active, closest competitor |
| Autio | 25K stories (US) | $36/yr subscription | Active, $10.7M raised |
| VoiceMap | 2K+ tours (global) | Per-tour marketplace | Active, growing |
| Questo | 2.5K quests (global) | Per-quest + annual pass | Active, gamified |
| Clio | 30K entries (US) | Free (nonprofit) | Active, grant-funded |
| HistoryPin | 365K stories (global) | Grants + institutional | Active, web-only |
| IHH | 2K events (10 cities) | $0.99/city one-time | Dead — content costs |
| Detour | 120 tours (13 cities) | Per-tour | Dead — founder pivoted to Descript |
| Field Trip | Partner databases | Free | Dead — Niantic chose Pokemon Go |
| Triposo | Open data aggregation | Free | Dead — acqui-hired by Musement/TUI |

### Deep Maps Moats
1. **LLM content pipeline** — 300+ moments/day at near-zero marginal cost
2. **Entity graph interconnection** — people ↔ events ↔ places ↔ stories ↔ collections
3. **Hyperspecific pin accuracy** — exact locations, not general areas

### Content Principles (Quick Reference)
- **Content guide**: `scripts/ingest/lib/content-guide-v3.md`
- **Physical presence rule**: Person must have been at exact coordinates at some point
- **Story naming**: Wikipedia article title preferred
- **Biography = invisible infrastructure**: Users see entities, not biography stories
- **Notability bar**: Recognizable names, or "one-liner makes you want to Google them"
- **Moment names = events, not places**: Verb-first, describe WHAT HAPPENED
- **Collections = lists, not narratives**: Names should read like "List of..." articles
- **Encyclopedic tone**: Wikipedia's matter-of-fact clarity
- **Dedup rule**: Always search existing content before creating
- **Earth-only coordinates**: Moon landing pins go at Mission Control

---

*Last updated: 2026-04-02*
*Strategy: 3-gate model from April 2026 market analysis + office hours*
