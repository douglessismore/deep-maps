# Deep Maps Content Scaling Plan
## 671 → 10,000 → 100,000 → 1,000,000 Moments

### Current State (March 2026)
| Metric | Count |
|--------|-------|
| Moments | 671 |
| Stories | 182 |
| Entities | 215 (141 people, 43 places, 15 concepts, 11 orgs) |
| Collections | 30 |
| People pipeline | 28/507 fully imported, 53 partial, 426 not started |

**Geographic bias:** ~95% North America. Europe 327 people in queue but barely imported.
**Pipeline cost:** ~$0.03-0.05 per person (Claude API).

---

## Two Approaches (Run in Parallel)

### Top-Down: Start with Entities → Map Their Full Timelines
Pick a well-known entity — a person, a movie, a book, an organization — and exhaustively map its timeline across the globe. Einstein's life hits Princeton, Zurich, Berlin, Bern, Ulm. *The Godfather* was filmed at specific locations in NYC, Sicily, Las Vegas. The Apollo program touches Cape Canaveral, Houston, the Sea of Tranquility.

**Produces:** Moments scattered globally. High narrative quality — every moment belongs to a compelling arc. Users search for things they know.

### Bottom-Up: Start with Places → Find Everything That Happened There
Pick a place — Rome's Colosseum, Congress Avenue in Austin, a stretch of Pacific coastline — and find every notable thing that happened there across all of time.

**Produces:** Deep local coverage. A user standing anywhere finds the map richly populated. This is the Steve Jobs principle: make specific cities *incredible*.

### How They Complement Each Other
- Top-down scatters broadly but unevenly (clusters where famous entities operated)
- Bottom-up fills deeply but requires more research per location
- They overlap (Lincoln's assassination = his biography AND Ford's Theatre history). Dedup handles it.

---

## Verified Dataset Inventory

Real numbers from research, not estimates:

| Dataset | Total Records | Geo-located | License | Format | Moment Conversion |
|---------|--------------|-------------|---------|--------|-------------------|
| **NOAA Significant Earthquakes** | 5,700+ | 100% | Public domain | CSV | Direct — each record is an event with coords + date + magnitude |
| **Smithsonian Global Volcanism** | ~10,000 eruptions | 100% (volcano coords) | CC-BY | CSV/Excel | Direct — VEI 4+ = ~500 most notable |
| **UNESCO World Heritage** | 1,248 sites | 100% | Open | CSV/JSON/API | Place → moment ("UNESCO inscribes X in Y") |
| **Wikidata Battles** (Q178561) | ~8,000 items | ~410 direct P625+P585; ~10,000 with location resolution | CC0 | SPARQL | Needs ETL to resolve location chains |
| **EM-DAT / GDIS Disasters** | 27,000+ total; 9,924 geocoded (1960-2018) | ~10,000 via GDIS | Academic/free | CSV | GDIS subset is ready-made |
| **NRHP (US historic sites)** | 100,000+ | 100% (GIS data) | Public domain | CSV/GIS | Places, not events — curate notable subset |
| **Pleiades Gazetteer** | 36,000+ ancient places | ~30,000+ | CC-BY 3.0 | JSON/CSV/KML | Places — cross-ref with events for moments |
| **OSM historic=*** | 2,210,162 | 100% | ODbL | Overpass API | Mostly minor (crosses, stones). ~50-100K meaningful after filter |
| **Wikidata Shipwrecks** (Q852190) | Est. 5,000-15,000 | Unknown subset | CC0 | SPARQL | Run query to get exact count |

**Highest-yield, lowest-effort pipelines (in order):**
1. NOAA Earthquakes — 5,700 ready-made moments, public domain CSV
2. Smithsonian Volcanism — 10,000 eruptions, CSV download
3. UNESCO — 1,248 sites, structured data
4. EM-DAT/GDIS — 10,000 geocoded disasters, CSV
5. Wikidata Battles — 10,000 with ETL work

---

## Phase 1: Reach 10,000 Moments

### Execution Order (Specific, Sequential)

The strategy: **most notable first, then deeper passes.** For each dataset, take the top-tier records first (highest magnitude earthquakes, most famous battles, most iconic sites). Second pass fills in the rest.

---

#### Sprint 1 (Week 1-2): Austin Deep History + Pipeline Foundation

**Goal:** 671 → ~900 moments. Build the demo for Michael Barnes. Build the bottom-up pipeline.

| Task | Approach | Moments | Type |
|------|----------|---------|------|
| **Austin deep history** | Claude researches Austin's full history via Wikipedia + Michael Barnes' themes from "Indelible Austin" | ~80 | Bottom-up city dive |
| **Michael Barnes stories** | Entity timelines for Barnes-adjacent topics: Congress Avenue, UT Austin, Barton Springs, the Capitol, East Austin, SoCo | ~40 | Top-down (entity = place/institution) |
| **Build `places-events.ts`** | Generic bottom-up pipeline: CSV/JSON → normalize → Claude → review queue | 0 (infra) | Pipeline |
| **Continue people pipeline** | `notable-people.ts` offset 28 → 58 (30 people) | ~120 | Top-down |

**Austin moments should include:**
- Pre-colonial: Tonkawa and Comanche presence along the Colorado
- Republic of Texas: Mirabeau Lamar chooses the site for the capital (1839)
- Congress Avenue: evolution from muddy frontier road to main street
- UT Austin: founding (1883), Tower shooting (1966), integration battles
- Barton Springs: sacred springs → public pool → environmental fights
- Capitol building: construction (1888), convict labor, limestone quarry
- East Austin: segregation, Eastside blues scene, gentrification
- Moonlight Towers (1895) — only surviving set of moonlight towers in the world
- Treaty Oak poisoning (1989)
- Fort Magruder (Civil War fortification under Ben White Freeway)
- Stephen F. Austin Hotel (1924) — first high-rise, lost rooftop garden
- Paramount Theatre (1915) — vaudeville to film preservation
- Scholz Garten (1866) — oldest beer garden in Texas
- SXSW founding (1987)
- Live music capital — Armadillo World HQ, Continental Club, Broken Spoke
- Zilker Park — Andrew Zilker donation, Barton Creek, Splash exhibit
- O. Henry's Austin years (1893-1898) — lived at 409 East 5th Street
- Lady Bird Lake creation and naming

**Deliverable for Michael Barnes:** A shareable Deep Maps view centered on Austin showing 80+ moments layered across 10,000+ years.

---

#### Sprint 2 (Week 3-4): First Dataset Ingest — NOAA Earthquakes

**Goal:** ~900 → ~1,600 moments.

| Task | Approach | Moments | Type |
|------|----------|---------|------|
| **NOAA earthquakes — Pass 1** | Download CSV. Filter: magnitude ≥ 7.0 OR deaths ≥ 1,000. Most dramatic events. | ~350 | Bottom-up dataset |
| **NOAA earthquakes — Pass 2** | Filter: magnitude ≥ 6.0 OR deaths ≥ 100. Fill in remaining notable quakes. | ~350 | Bottom-up dataset |
| **Continue people pipeline** | Offset 58 → 108 (50 people) | ~200 | Top-down |

**NOAA pipeline details:**
- Download: `ngdc.noaa.gov/hazel/view/hazards/earthquake/search` → CSV export
- Fields used: year, month, day, latitude, longitude, magnitude, deaths, injuries, description
- Claude prompt: generate verb-first moment name + 2-sentence description from structured data
- Story grouping: Claude decides — some go into regional stories ("Ring of Fire Earthquakes"), most standalone
- Notability filter: magnitude ≥ 6.0 OR deaths ≥ 100 OR historical significance (e.g., 1755 Lisbon)
- Dedup: lat/lng proximity + date match against existing moments

---

#### Sprint 3 (Week 5-6): UNESCO + Smithsonian Volcanism

**Goal:** ~1,600 → ~2,800 moments.

| Task | Approach | Moments | Type |
|------|----------|---------|------|
| **UNESCO — Pass 1** | All 1,248 sites. Generate moment for inscription + founding event. | ~800 | Bottom-up dataset |
| **Smithsonian Volcanism — Pass 1** | Filter: VEI ≥ 5 OR deaths ≥ 100. Only the biggest eruptions. | ~200 | Bottom-up dataset |
| **Continue people pipeline** | Offset 108 → 158 (50 people) | ~200 | Top-down |

**UNESCO pipeline details:**
- Download: `ihp-wins.unesco.org/dataset/unesco-world-heritage-sites` → CSV
- Fields: site name, country, coordinates, inscription year, type (cultural/natural/mixed)
- Two moments per site: (1) the founding/creation event, (2) the UNESCO inscription
- But only create both if the founding event is historically notable — otherwise just one
- Realistic yield: ~800 moments (some sites are too obscure for two moments)

**Smithsonian pipeline details:**
- Download: `volcano.si.edu` → eruption search → Excel/CSV export
- Fields: volcano name, coordinates, eruption start date, VEI, eruption type
- Pass 1 = VEI ≥ 5 only (~40 eruptions — Krakatoa, Tambora, Pinatubo, etc.) + any with deaths ≥ 100 (~160 more)
- Claude generates moment: "Krakatoa Erupts and Kills 36,000 People (1883)" with coordinates of the volcano

---

#### Sprint 4 (Week 7-8): Wikidata Battles + Candidates.md

**Goal:** ~2,800 → ~4,200 moments.

| Task | Approach | Moments | Type |
|------|----------|---------|------|
| **Wikidata battles — Pass 1** | SPARQL query for battles with direct P625+P585. Top 400 (by sitelinks count = notability). | ~400 | Bottom-up dataset |
| **candidates.md ingestion** | 60+ curated candidates already researched with Wikidata IDs and coordinates | ~60 | Bottom-up curated |
| **First entity timelines (movies)** | Top 20 iconic movies → filming locations + real events | ~100 | Top-down |
| **Continue people pipeline** | Offset 158 → 258 (100 people) | ~400 | Top-down |
| **Expand people list** | Add 100 African + 60 South American + 80 Asian + 50 indigenous figures to `top-people.json` | 0 (prep) | Top-down |

**Wikidata battles pipeline:**
- SPARQL query: `SELECT ?item ?itemLabel ?coord ?date WHERE { ?item wdt:P31 wd:Q178561 . ?item wdt:P625 ?coord . ?item wdt:P585 ?date . SERVICE wikibase:label { bd:serviceParam wikibase:language "en" } }`
- Only ~410 have direct coords+date. Sort by sitelinks count (proxy for notability).
- Pass 1 takes the top 400. Claude generates moment text from Wikidata labels + Wikipedia summaries.
- Pass 2 (Phase 2) will resolve the ~10,000 with indirect locations.

---

#### Sprint 5 (Week 9-10): City Deep-Dives + Entity Expansion

**Goal:** ~4,200 → ~5,800 moments.

| Task | Approach | Moments | Type |
|------|----------|---------|------|
| **City deep-dive: Rome** | Claude researches + generates ~100 moments across 2,700 years | ~100 | Bottom-up city |
| **City deep-dive: Jerusalem** | Same approach, 3,000+ years of history | ~100 | Bottom-up city |
| **City deep-dive: London** | 2,000 years | ~100 | Bottom-up city |
| **City deep-dive: NYC** | 400 years, dense | ~100 | Bottom-up city |
| **City deep-dive: Paris** | Revolution → modern | ~100 | Bottom-up city |
| **Continue people pipeline** | Offset 258 → 358 (100 people, including new African/Asian/SA lists) | ~400 | Top-down |
| **Entity timelines: books** | 10 iconic novels → real-world settings | ~50 | Top-down |
| **Entity timelines: music** | 15 music landmarks (Abbey Road, Sun Studio, etc.) | ~50 | Top-down |
| **EM-DAT/GDIS — Pass 1** | Geocoded disasters with deaths ≥ 500 | ~300 | Bottom-up dataset |
| **Smithsonian Volcanism — Pass 2** | VEI ≥ 4 | ~200 | Bottom-up dataset |

---

#### Sprint 6 (Week 11-12): Push to 10K

**Goal:** ~5,800 → ~10,000 moments.

| Task | Approach | Moments | Type |
|------|----------|---------|------|
| **Complete people pipeline** | Offset 358 → 507 (remaining 149 people) + expanded lists | ~700 | Top-down |
| **5 more city deep-dives** | Istanbul, Cairo, Beijing, Athens, Mexico City | ~500 | Bottom-up city |
| **NOAA earthquakes — Pass 3** | Remaining quakes magnitude ≥ 5.0 with named Wikipedia articles | ~500 | Bottom-up dataset |
| **EM-DAT/GDIS — Pass 2** | Deaths ≥ 50 | ~700 | Bottom-up dataset |
| **Wikidata shipwrecks** | Run SPARQL, take top 200 by sitelinks | ~200 | Bottom-up dataset |
| **Pleiades — Pass 1** | Ancient sites with ≥3 connected places (major ancient cities) | ~500 | Bottom-up dataset |
| **Entity timelines: orgs + movements** | NASA, Olympics, Civil Rights trail, Underground Railroad | ~200 | Top-down |
| **Movies — Pass 2** | Next 30 films | ~150 | Top-down |
| **Geo-specificity upgrades** | Fix 203 approximate moments from existing data | 0 (quality) | Maintenance |
| **Full-text search** | Supabase tsvector | 0 (infra) | Tech |
| **Paginate Supabase loader** | Handle >10K rows | 0 (infra) | Tech |

### Phase 1 Totals

| Source Type | Moments | % |
|-------------|---------|---|
| **Top-down: People pipeline** (507 + expanded list) | ~2,720 | 27% |
| **Top-down: Movies/books/music/orgs** | ~550 | 6% |
| **Bottom-up: NOAA earthquakes** | ~1,200 | 12% |
| **Bottom-up: UNESCO** | ~800 | 8% |
| **Bottom-up: Smithsonian volcanism** | ~400 | 4% |
| **Bottom-up: Wikidata battles** | ~400 | 4% |
| **Bottom-up: EM-DAT/GDIS disasters** | ~1,000 | 10% |
| **Bottom-up: City deep-dives** (Austin + 10 cities) | ~1,180 | 12% |
| **Bottom-up: Pleiades ancient world** | ~500 | 5% |
| **Bottom-up: Shipwrecks** | ~200 | 2% |
| **Bottom-up: Curated candidates** | ~60 | 1% |
| **Existing** | ~671 | 7% |
| **TOTAL** | **~9,681** | |

**Timeline: 12 weeks (3 months).**
**API cost estimate: ~$150-250 (3,000-5,000 Claude calls × $0.03-0.05 each).**

---

## Phase 2: Reach 100,000 Moments (Month 4-6)

### Top-Down Expansion (~25,000 total entity-driven moments)

| Source | New Entities | New Moments | Notes |
|--------|-------------|-------------|-------|
| **Laouenan extended** (rank 508-2,500) | 2,000 people | ~8,000 | Same pipeline, lower notability threshold |
| **Region-specific people lists** | 500 people | ~2,000 | Wikipedia "List of [Country] people" |
| **Top 500 movies** (IMDb/AFI/BFI lists) | 500 movies | ~2,500 | Filming locations, premieres, depicted events |
| **Top 200 novels** (world literature) | 200 books | ~1,000 | Real settings, author connections |
| **Major organizations** | 200 orgs | ~1,000 | Founding, HQ, key events |
| **Music history** (Rolling Stone 500 + global) | 300 artists/albums | ~1,500 | Studios, venues, cultural moments |

### Bottom-Up Deep Passes (~75,000 total place-driven moments)

#### Dataset Second Passes (deeper into each dataset)

| Dataset | Filter | New Moments | Cumulative |
|---------|--------|-------------|------------|
| **NOAA earthquakes** — all remaining | Magnitude ≥ 4.5 with Wikipedia article | ~2,000 | ~3,200 |
| **Smithsonian volcanism** — all remaining | VEI ≥ 3 | ~1,500 | ~1,900 |
| **EM-DAT/GDIS** — all remaining | Deaths ≥ 10 | ~3,000 | ~4,000 |
| **Wikidata battles** — full resolution | Resolve indirect locations for all ~10,000 | ~6,000 | ~6,400 |

#### New Wikidata Query Families

| Query Family | Wikidata Type | Filter | Moments |
|-------------|---------------|--------|---------|
| **Notable buildings** | Q41176 | sitelinks ≥ 5, P625+P571 | ~8,000 |
| **Archaeological sites** | Q839954 | P625 | ~3,000 |
| **Sieges** | Q188055 | P625 | ~1,500 |
| **Assassinations** | Q3882219 | P625 | ~1,000 |
| **Volcanic eruptions** (Wikidata, not Smithsonian) | Q7692360 | P625 | ~800 |
| **Treaties** | Q131569 | P625 | ~800 |
| **Revolutions/uprisings** | Q7281 | P625 | ~800 |
| **Shipwrecks** (full set) | Q852190 | P625 | ~2,000 |

#### Supplementary Datasets

| Source | Subset | Moments |
|--------|--------|---------|
| **NRHP** (US historic sites) | Events/battlefields, not just buildings — curate by significance | ~5,000 |
| **Pleiades** — full pass | All 36,000 ancient places, cross-ref with events | ~5,000 |
| **OSM historic tags** | Cross-ref with Wikidata for entries with Wikipedia links | ~3,000 |

#### City Deep-Dives — Scale to 50 Cities (~8,000 new moments)

Expand from 11 cities (Phase 1) to 50. Each gets 100-200 moments.

Priority cities for Phase 2:
Istanbul, Cairo, Delhi, Beijing, Mexico City (if not done in Sprint 6), Tokyo, Baghdad, Kyoto, Cusco, Timbuktu, Nairobi, São Paulo, Sydney, Havana, Vienna, St. Petersburg, Florence, Seville, Marrakech, Samarkand, Angkor (Cambodia), Varanasi, Fez, Addis Ababa, Lhasa, Dubrovnik, Krakow, Prague, Amsterdam, Lisbon, Edinburgh, Dublin, Buenos Aires, Lima, Bogotá, Accra, Lagos, Cape Town, Tehran, Damascus, Hanoi, Osaka, Singapore, Hong Kong

### Technical Changes at 100K
- **Viewport-based loading** — PostGIS spatial queries replace full-data fetch
- **URL routing** — `/story/{slug}`, `/moment/{slug}`, `/city/{slug}`
- **SSR** for SEO (Vite SSR or Astro)
- **Schema.org JSON-LD** on every page
- **Full-text search** with autocomplete
- **Affiliate links** on place-based moments
- **City landing pages** — `/city/rome` as SEO magnets

---

## Phase 3: Reach 1,000,000 Moments (Month 7-12)

### Top-Down: ~100,000 entity-driven moments
- Expand people list to ~15,000 (Laouenan full + regional supplements)
- 2,000+ movies, 1,000+ books, 500+ organizations, 1,000+ music landmarks
- Each entity's full timeline: every place they touched

### Bottom-Up: ~900,000 place-driven moments

| Source | Method | Target |
|--------|--------|--------|
| **Wikidata full dump** | All items with P625 + temporal property, sitelinks ≥ 3 | ~300,000 |
| **City-by-city deep coverage** | Top 500 cities × 200 moments | ~100,000 |
| **Government monument/heritage registries** | Every country's listed sites with AI enrichment | ~150,000 |
| **Newspaper archives** (Library of Congress, British Library) | OCR + NER for geo-located events | ~100,000 |
| **Academic databases** (UCDP conflict, non-ACLED) | Conflict events with coordinates | ~50,000 |
| **Archaeological databases** (national registries) | Sites with excavation history | ~50,000 |
| **Community contributions** | Moderated submissions, AI-assisted | ~50,000 |
| **Museum/archive APIs** (Europeana, Smithsonian Open Access) | Geo-located cultural objects | ~50,000 |
| **Historical map overlays** | Geo-referenced annotations from digitized maps | ~50,000 |

### Technical Changes at 1M
- **Vector tiles** (Mapbox MVT) — pre-computed per zoom level
- **CDN caching** for spatial queries
- **Database partitioning** by continent
- **Community moderation pipeline**
- **Multi-language** (EN, ES, FR, DE, ZH, JA, AR)

---

## Quality Pipeline (Both Approaches)

Both top-down and bottom-up feed the **same review queue** and pass the **same quality gates:**

1. ✅ Verb-first name that describes WHAT HAPPENED
2. ✅ Standalone description (5-second test from content guide)
3. ✅ Coordinates at building/block level (or acknowledged approximate)
4. ✅ Date or date range
5. ✅ Notability score ≥ threshold for its era
6. ✅ No duplicate (lat/lng + date proximity)
7. ✅ Encyclopedic tone (content guide rules 1-11)
8. ✅ Cultural sensitivity review for race/religion/colonialism (R8, R9, R11)

**No visible quality tiers.** Every published moment passes the same bar regardless of which pipeline produced it.

**"Most notable first" principle:** Every dataset gets multiple passes. Pass 1 takes the cream (highest magnitude, most sitelinks, most deaths, most cultural significance). Pass 2 fills in the next tier. This means the map is always maximally interesting relative to its size.

---

## SEO & Monetization Architecture

### URL Structure (implement at Phase 2)
```
deepmaps.io/                          → Homepage / explore map
deepmaps.io/story/{slug}              → Story page (SSR)
deepmaps.io/moment/{slug}             → Moment page (SSR)
deepmaps.io/collection/{slug}         → Collection page (SSR)
deepmaps.io/person/{slug}             → Entity page (SSR)
deepmaps.io/place/{slug}              → Place page (SSR)
deepmaps.io/city/{slug}               → City landing page (SEO + affiliate)
deepmaps.io/era/{slug}                → Era landing page
deepmaps.io/explore?lat=X&lng=Y&z=Z   → Deep link to map view
```

### Revenue Streams
1. **Affiliate links** — hotels (Booking.com), tours (GetYourGuide/Viator)
2. **City landing pages** — `/city/austin` = SEO magnet + affiliate hub
3. **Premium features** — offline maps, trip planning, custom collections
4. **API access** — developers/educators

---

## Bottom-Up Pipeline Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SOURCE     │     │  EXTRACT     │     │  TRANSFORM   │     │   REVIEW     │
│              │     │              │     │              │     │              │
│ NOAA CSV     │     │ CSV parse    │     │ Claude API   │     │ Same review  │
│ Smithsonian  │────▶│ SPARQL query │────▶│ generates:   │────▶│ queue as     │
│ UNESCO       │     │ JSON load    │     │ - verb name  │     │ people       │
│ Wikidata     │     │              │     │ - description│     │ pipeline     │
│ EM-DAT/GDIS  │     │ Normalize to │     │ - notability │     │              │
│              │     │ {name, lat,  │     │ - category   │     │ Human spot-  │
│              │     │  lng, date,  │     │ - story?     │     │ check (10%)  │
│              │     │  source_url} │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Austin Deep History — Michael Barnes Demo

**Purpose:** First bottom-up city deep-dive. Show to Michael Barnes (Austin American-Statesman historian, author of "Indelible Austin" 4-volume series). Prove the concept with a city he knows intimately.

**Target:** ~80-120 moments spanning 10,000+ years across Austin.

**Thematic layers (inspired by Barnes' work):**
1. **Pre-colonial** — Tonkawa, Comanche, ancient springs
2. **Republic of Texas** — capital selection (1839), early settlement
3. **Civil War** — Fort Magruder (under Ben White Freeway), divided loyalties
4. **Reconstruction → early 20th century** — Moonlight Towers (1895), Dam break (1900), streetcars
5. **Built environment** — Congress Avenue evolution, Capitol (1888), Driskill Hotel (1886), Paramount (1915)
6. **UT Austin** — founding (1883), Tower shooting (1966), integration, football
7. **Music & culture** — Armadillo World HQ, Continental Club, SXSW (1987), "Live Music Capital"
8. **East Austin** — segregation plan (1928), Eastside blues, gentrification battles
9. **Natural Austin** — Barton Springs, Treaty Oak (poisoning 1989), Town Lake/Lady Bird Lake
10. **Modern Austin** — tech boom, population explosion, "Keep Austin Weird"

**Barnes-specific highlights:**
- Stephen F. Austin Hotel centennial (Congress Ave) — first high-rise, lost rooftop garden
- Scholz Garten (1866) — oldest beer garden in Texas
- Castle Hill / Texas Military Institute (1869)
- Scarbrough Building (1908) — Confederate veteran's department store
- O. Henry's years at 409 East 5th Street (1893-1898)
- Fort Magruder — Civil War fortification buried under modern freeway
- Jim Duncan's Austin business histories (600+ locations)

**Deliverable:** Shareable Deep Maps view centered on Austin at `/city/austin`.
