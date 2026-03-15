# Deep Maps — Story Ideas, Datasets & Content Strategy

> **Purpose**: Living document for tracking content ideas, dataset links, collection concepts, and strategic discussion. Separate from handoff.md (which tracks implementation state).

## Active Datasets & Sources

### Notable People (2.29M people, structured, importable)
- **Map**: https://tjukanovt.github.io/notable-people (Topi Tjukanov, Mapbox)
- **Dataset**: https://data.sciencespo.fr/dataset.xhtml?persistentId=doi:10.21410/7E4/RDAG3O
- **Paper**: Laouenan et al., "A cross-verified database of notable people, 3500BC-2018AD", Nature Scientific Data (2022)
- **GitHub**: https://github.com/tjukanovt/tjukanovt.github.io
- **Fields**: Name, birth coordinates, notability rank, occupation category, birth/death dates
- **Size**: 2.29 million individuals (top 1/43,000 of all humans who ever lived)
- **Quality note**: Low error rates for well-documented individuals, "nontrivial" errors at bottom of notability distribution
- **UX inspiration**: Zoom-based progressive disclosure — most famous names at global zoom, progressively reveal less famous as you zoom in. Labels adapt per zoom level. Beautiful handling of density.
- **Status**: Supabase-era import. Too large for static files. Need notability threshold filter.

### Biblical Locations (OpenBible.info)
- **Main site**: https://www.openbible.info/geo/
- **Per-book maps**: https://www.openbible.info/geo/preview/matt (example: Matthew)
- **Data format**: KML files per book of Bible (XML with coordinates, place names, verse references, confidence bands)
- **Matthew sample**: 38-43 distinct places, many with multiple candidate coordinates and confidence isobands
- **License**: Creative Commons Attribution
- **GitHub**: Has raw data repo available
- **Competitor analysis**: Very comprehensive. 20+ sources per location. Confidence levels. Photo gallery (~1,000 images). Active blog. Hard to compete on completeness for biblical geocoding specifically.
- **Strategy**: Don't try to out-OpenBible OpenBible. Instead, add what they DON'T have: narrative storytelling, entity timelines (trace Jesus's ministry, Moses's journey, Paul's missionary routes), connections between biblical events and modern sites. Our value-add is the "Dive Deep" layer, not raw pin count.

### Nuclear Test Sites
- **CTBTO database**: https://www.ctbto.org/specials/testing-times/
- **Johnston Archive**: http://www.johnstonsarchive.net/nuclear/tests/ (2000+ individual detonations)
- **Wikipedia list**: https://en.wikipedia.org/wiki/List_of_nuclear_weapons_tests
- **Current state**: 37 locations across 10 countries (site-level granularity). Could expand to ~100 by adding individual notable test shots within large sites (NTS, Semipalatinsk, etc.)

### Battles & Conflicts
- **UCDP dataset**: https://ucdp.uu.se/downloads/ (thousands of conflicts)
- **Correlates of War**: https://correlatesofwar.org/
- **Wikipedia list of battles**: https://en.wikipedia.org/wiki/List_of_battles
- **Current state**: 21 major battlefields researched with coordinates. Ready to implement.

### Film & TV Locations
- **Movie Locations**: https://www.movie-locations.com/ (ranks well, catalogs thousands)
- **Atlas of Wonders**: https://www.atlasofwonders.com/ (e.g., GoT filming locations)
- **IMDb filming locations**: https://www.imdb.com/search/title/?locations=
- **Wikipedia lists**: https://en.wikipedia.org/wiki/List_of_films_shot_in_New_York_City (per city)
- **SEO opportunity**: Massive. "Where was X filmed" is searched constantly. Existing sites are ugly and ad-ridden. Start with 5-6 iconic franchises (Breaking Bad, Game of Thrones, Lord of the Rings, Star Wars, The Godfather, Jaws).

### UFO Sightings
- **NUFORC database**: https://nuforc.org/ (90k+ sightings)
- **Kaggle UFO dataset**: https://www.kaggle.com/datasets/NUFORC/ufo-sightings
- **Visualization**: https://informationisbeautiful.net/visualizations/ufo-sightings/
- **Note**: High noise. 99% are "saw a light." Would need aggressive curation to stay encyclopedic. Lower priority.

### Meteorite Impacts
- **Earth Impact Database**: https://www.passc.net/EarthImpactDatabase/ (190 confirmed craters)
- **Current state**: 20 locations implemented with 5 stories. Comprehensive for notable craters.

### Fossil Discoveries
- **Paleobiology Database**: https://paleobiodb.org/
- **Status**: Not started. Natural complement to meteorite craters.

### Shipwrecks
- **Wrecksite database**: https://wrecksite.eu/
- **NOAA shipwrecks**: https://wrecks.noaa.gov/
- **Status**: Lower priority per user — "armchair explorer" content, not stumble-upon.

### Celebrity/Famous People Death Locations
- **OddStops Hollywood deaths**: https://oddstops.com/places.php?id=20
- **Find A Grave**: https://www.findagrave.com/
- **Atlas Obscura**: https://www.atlasobscura.com/articles/where-famous-people-died-map
- **Privacy note**: Focus on deceased public figures at locations already recognized as landmarks/historical sites. Avoid private residences of living people or recent suicide locations at private homes.
- **Geographic skew warning**: LA would be overwhelmed by celebrity death pins. Need category weighting per viewport and notability thresholds.

### Archaeological Sites
- **Open Context**: https://opencontext.org/
- **Archaeology Data Service**: https://www.archaeologydataservice.ac.uk/

### UNESCO World Heritage Sites
- **Dataset**: https://whc.unesco.org/en/list/

### Other Reference
- **Atlas Obscura** (closest competitor): https://www.atlasobscura.com/places (20,000+ unusual places). Their weakness: no narrative connections. Our edge: storytelling layer.
- **Pantheon (Notable People by birthplace)**: https://pantheon.world/

## Viral Map Patterns (Research, Session 30)
Key drivers of viral geographic content:
1. **Personalization** ("Where is MY X?") — #1 driver. Dialect quiz, NUKEMAP, Ancient Earth.
2. **Completeness** ("EVERY X") — Every building, every police killing. The word "every" signals authority.
3. **Shattering a misconception** — True Size Of, election dot maps.
4. **Morbid/dark curiosity made safe** — NUKEMAP is the poster child.
5. **Identity + tribalism** — Dialect quiz, regional maps.
6. **Beautiful enough to screenshot** — Wind Map, racial dot map.
7. **Timely + emotional** — COVID dashboard, bushfire map.

Notable viral maps: Johns Hopkins COVID (3.6B views), NYT Dialect Quiz (#1 NYT content 2013), NUKEMAP (50M+ users), Racial Dot Map, True Size Of, Wind Map (MoMA collection), NYT Every Building in America.

## Strategic Four-Category Framework (from ChatGPT analysis)
Most viral location datasets fall into:
1. **Disasters** — nuclear tests, earthquakes, shipwrecks
2. **Pop culture** — filming locations, music history
3. **Conflict** — battles, assassinations
4. **Discovery** — fossils, meteorites, archaeology

## Collection Priority Queue

> **Detailed roadmap**: See `.claude/plans/magical-singing-beaver.md` (Fractal Zoom Roadmap, Phase 5) for full dataset aggregation plan with moment estimates and implementation order.

### Pre-Database (static TS files, target ~1,500-2,000 moments)
| Priority | Collection | Status | Est. Moments | Notes |
|----------|-----------|--------|-------------|-------|
| 1 | Notable People (top 200) | Not started | ~800-1,000 | 200 people × 4-5 moments. Prioritize Africa, S. America, SE Asia, Central Asia. |
| 2 | UNESCO World Heritage Sites | Not started | ~200 | Clean structured data. Best global coverage filler. |
| 3 | Film & TV Locations (5-6 franchises) | Not started | ~80 | Breaking Bad, GoT, LotR, Star Wars, Godfather, Jaws. High SEO. |
| 4 | Austin Deep Dive | Not started | ~50 | First AI pipeline test. Barnes's "Indelible Austin" content. |
| 5 | Famous Battlefields (expanded) | Research done | ~100 | 21 already researched. Expand globally. |
| — | Biblical Events | **Partially done** | 58 done | 5 stories implemented (Session 31). Full OpenBible dataset post-database. |

### Post-Database (requires Supabase, scaling to 10K-100K+)
| Priority | Collection | Est. Size | Notes |
|----------|-----------|----------|-------|
| 6 | Notable People (full top 2,000) | ~6,000-8,000 | Needs DB for this volume. |
| 7 | Biblical Locations (full OpenBible) | ~500+ | All books, narrative framing. |
| 8 | National Register of Historic Places | 95,000+ | US-only, AI extraction + notability scoring. |
| 9 | Pleiades (ancient world) | ~35,000 | Greek/Roman ancient places. |
| 10 | ICBe Crisis Events (1918-2017) | ~5,000 | Structured international crises. |

## Scaling UX — Fractal Zoom (IN PROGRESS)
- **Phase 0 COMPLETE**: Notability scoring script built. 601 moments scored 0-100 using Wikipedia pageviews.
- **Phase 1 NEXT**: Add `notability` field to Moment type, apply scores.
- **Phase 2**: Zoom-based threshold filtering in MapView. Linear interpolation: zoom 2-3 → threshold 80-90 (S-tier only), zoom 10+ → threshold 0 (everything).
- **Bypass rules**: Story/entity/collection/search/Near Me modes bypass notability filtering.
- **Geographic rarity floor**: Ensures each 500km tile has representation at regional zoom. Cap at score 60.
- **Category filter interaction**: Active category filter lowers threshold by 20 points.
- **Personalization** (future): "What happened near you?" — the single most reliable viral mechanic

## Privacy Guidelines
- **Safe**: Deceased public figures at landmark/museum locations. Historical death sites. Schools/workplaces that are public institutions.
- **Avoid**: Current home addresses of living people. Private residences where living celebrities' children live. Suicide locations at private homes of recently deceased.
- **Standard**: If Wikipedia lists the specific address, we probably can too. If Wikipedia avoids it, so should we.
