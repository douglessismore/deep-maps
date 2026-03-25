# Deep Maps — Data Sources & Verification References

> Living document of websites, databases, and APIs useful for content curation and geo-verification.

---

## Historical Markers & Plaques
- **[HMdb.org — The Historical Marker Database](https://www.hmdb.org/)** — Community-maintained database of historical markers with GPS coordinates. Excellent for verification. Has downloadable GPX/KML files.
- **[Historical Marker Project](https://www.historicalmarkerproject.com/)** — US historical markers with photos and coordinates.

## Graves & Burial Sites
- **[Find A Grave](https://www.findagrave.com/)** — 230M+ grave records with cemetery coordinates. Great for burial moment verification.
- **[BillionGraves](https://billiongraves.com/)** — GPS-tagged headstone photos. Higher coordinate precision than Find A Grave.

## Homes & Residences
- **[History's Homes](http://www.historyshomes.com/)** — Historical homes of famous people. Addresses and some coordinates.

## Crime & Dark History
- **[OddStops](https://oddstops.com/)** — Verified crime scene locations with exact addresses, photos, and current state. Excellent for serial killer collection verification.
- **[Murder Map](https://www.murdermap.co.uk/)** — UK historical murders mapped.

## Geocoding APIs (for batch verification)
- **[Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/)** — Free geocoding, 1 req/sec. Used for batch geocode (270 pins corrected).
- **[Mapbox Geocoding](https://docs.mapbox.com/api/search/geocoding/)** — 100K free requests/month. Higher accuracy than Nominatim for US addresses.
- **[Google Geocoding API](https://developers.google.com/maps/documentation/geocoding)** — Most accurate, $5/1000 requests.

## General Reference
- **[Wikipedia Coordinates](https://en.wikipedia.org/)** — Many articles include coordinates. Community-verified. Use GeoHack links.
- **[Google Maps](https://maps.google.com/)** — Primary visual verification tool. Satellite view for building identification.
- **[Google Earth](https://earth.google.com/)** — Historical imagery useful for demolished sites.
- **[OpenStreetMap](https://www.openstreetmap.org/)** — Community-mapped building footprints, historical sites.

## Specialized Databases
- **[Atlas Obscura](https://www.atlasobscura.com/)** — Unusual places with coordinates. Good for "hidden gems" content.
- **[Pleiades](https://pleiades.stoa.org/)** — Ancient world gazetteer with verified coordinates for classical sites.
- **[GeoNames](https://www.geonames.org/)** — Global gazetteer, 12M+ place names with coordinates.
- **[Earth Impact Database](https://www.passc.net/EarthImpactDatabase/)** — Confirmed meteorite impact craters (University of New Brunswick).

## Architecture & Built Environment
- **[Emporis](https://www.emporis.com/)** — Building data with coordinates (skyscrapers, landmarks).
- **[Structurae](https://structurae.net/)** — International database of structures (bridges, towers, dams).

## Conflict & Military
- **[American Battlefield Trust](https://www.battlefields.org/)** — US Civil War and Revolutionary War battle sites with maps.
- **[CWSAC Battle Summaries](https://www.nps.gov/abpp/battles/bystate.htm)** — National Park Service battle site data.

## Music & Film
- **[Songkick](https://www.songkick.com/)** — Concert venue data.
- **[Movie Locations Guide](https://www.movie-locations.com/)** — Film shooting locations.
- **[IMDB Filming Locations](https://www.imdb.com/)** — Searchable by film title.

## Government & Open Data
- **[National Register of Historic Places](https://www.nps.gov/subjects/nationalregister/)** — US historic sites with documentation.
- **[UNESCO World Heritage List](https://whc.unesco.org/)** — 1,199 sites with coordinates.
- **[Wikidata](https://www.wikidata.org/)** — Structured data including coordinates for millions of entities.

---

## Future Potential Sources
- Texas Historical Commission markers
- UK Listed Buildings database
- European cultural heritage databases
- iNaturalist (for natural history overlaps)
- OpenHistoricalMap (historical boundary data)
- Chronicling America (newspaper archives for location mentions)

## Data Import Priorities
1. HMdb.org markers — download GPX, cross-reference with our moments
2. Find A Grave — verify all burial moments
3. OddStops — verify all crime scene moments
4. Earth Impact Database — complete crater collection
5. Pleiades — verify all ancient world moments
