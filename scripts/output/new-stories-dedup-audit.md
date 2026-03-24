# New Stories Deduplication Audit

**Date:** 2026-03-22
**Scope:** 10 new stories added under `// --- Top 10 Stories ---` (lines 3208-3396 of stories.ts, moments at lines 26141-27070 of moments.ts)

---

## CRITICAL: September 11 vs. United Flight 93

### The Problem

The new `september-11-attacks` story was added **without consolidating** the existing `flight-93` story and its three moments. Both stories now cover the Flight 93 crash at Shanksville, resulting in duplicate moments at nearly identical coordinates.

### Existing Content (Pre-Batch)

**Story:** `flight-93` (line 404, stories.ts)
- Name: "United Flight 93"
- Moments:
  - `f93-impact` — "Flight 93 Crashes After Passengers Storm the Cockpit" (lat 40.0505, lng -78.9054)
  - `f93-tower` — "Forty Wind Chimes Sound for the Passengers of Flight 93" (lat 40.0558, lng -78.8978)
  - `f93-newark` — "Flight 93 Departs 42 Minutes Late, Changing Everything" (lat 40.6895, lng -74.1745)
- Referenced by: `twa-flight-800`, `valujet-592` (both via relatedStoryIds)

### New Content

**Story:** `september-11-attacks` (line 3305, stories.ts)
- Moments:
  - `911-north-tower-hit-2001`
  - `911-south-tower-hit-2001`
  - `911-pentagon-hit-2001`
  - **`911-flight-93-shanksville-2001`** — "Passengers on United Flight 93 Storm the Cockpit Over Shanksville" (lat 40.0525, lng -78.9044)
  - `911-north-tower-collapse-2001`
  - `911-tribute-in-light-2002`

### Duplicate Pair

| Field | Existing `f93-impact` | New `911-flight-93-shanksville-2001` |
|-------|----------------------|--------------------------------------|
| Name | Flight 93 Crashes After Passengers Storm the Cockpit | Passengers on United Flight 93 Storm the Cockpit Over Shanksville |
| Lat | 40.0505 | 40.0525 |
| Lng | -78.9054 | -78.9044 |
| Address | 6424 Lincoln Hwy, Stoystown, PA 15563 | 6424 Lincoln Highway, Stoystown, PA 15563 |
| Year | 2001 | 2001 |

**These are the same event at the same location.** The coordinates are ~200 meters apart due to imprecision.

### Recommended Fix

**Option A (Recommended): Keep the new moment, retire the old one, and wire the old story to the new moment.**

1. In `september-11-attacks` story: keep `911-flight-93-shanksville-2001` as-is (it has the better description).
2. In `flight-93` story: replace `f93-impact` with `911-flight-93-shanksville-2001` in its moments[] array. Keep `f93-tower` and `f93-newark` (these are unique and NOT duplicated in the new story).
3. Delete the `f93-impact` moment from moments.ts.
4. Add `flight-93` to `september-11-attacks.relatedStoryIds`.
5. Add `september-11-attacks` to `flight-93.relatedStoryIds`.
6. The `f93-tower` (Tower of Voices) and `f93-newark` (Newark departure) moments are unique content that adds depth to the Flight 93 narrative. Consider adding them to `september-11-attacks.moments[]` as well, OR leave them as Flight-93-specific detail accessible via the relatedStoryIds link.

**Option B: Keep both moments, just cross-link the stories.**

If you want to keep both moments (slightly different narrative angles), just:
1. Add `flight-93` to `september-11-attacks.relatedStoryIds`.
2. Add `september-11-attacks` to `flight-93.relatedStoryIds`.
3. Accept that the map will show two pins ~200m apart for the same event.

---

## Tutankhamun: Discovery Story vs. Biography

### Overlap Found

**Existing biography story:** `tutankhamun-biography` (line 1954, stories.ts)
- Moments: `tutankhamun-born-amarna`, `tutankhamun-moves-court-memphis`, `tutankhamun-restores-amun-thebes`, `tutankhamun-dies-aged-18`, **`tutankhamun-mask-egyptian-museum-cairo`**

**New discovery story:** `discovery-of-tutankhamuns-tomb` (line 3324, stories.ts)
- Moments: `tutankhamun-step-found-1922`, `tutankhamun-wonderful-things-1922`, `tutankhamun-burial-chamber-1923`, `carnarvon-death-curse-1923`, **`tutankhamun-mask-display-cairo`**

### Duplicate Pair: Death Mask Moment

| Field | Existing `tutankhamun-mask-egyptian-museum-cairo` | New `tutankhamun-mask-display-cairo` |
|-------|--------------------------------------------------|--------------------------------------|
| Name | Tutankhamun's 10-Kilogram Gold Death Mask Goes on Display in Cairo | Tutankhamun's Death Mask Goes on Display at the Egyptian Museum in Cairo |
| Lat | 30.0478 | 29.9943 |
| Lng | 31.2336 | 31.1163 |
| Year | 1926 | 1925 |
| Address | Egyptian Museum, Tahrir Square, Cairo | Grand Egyptian Museum, Al Remayah Square, Giza |

**These are the same artifact and event.** The existing moment has the Tahrir Square address (original museum); the new one has the Giza address (GEM, opened 2023). The coordinates differ because they point to different buildings, but both describe the initial display of the mask.

### Pre-Existing Overlap: Howard Carter Discovery Moment

There is also an **existing standalone moment** `howard-carter-discovers-tomb-kv62` (line 6876, moments.ts) that covers the same event as the new `tutankhamun-step-found-1922` + `tutankhamun-wonderful-things-1922`:
- Existing: "Howard Carter Opens Tutankhamun's Sealed Tomb in the Valley of the Kings" (KV62, 1922) -- covers both the step discovery AND the "wonderful things" moment in a single entry
- New: Split into two moments (step found on Nov 4, peering through on Nov 26)

The existing moment is NOT referenced by the new story. It belongs to no story currently (it's a standalone/orphan or wired elsewhere).

### Recommended Fix

1. **Death mask:** Delete `tutankhamun-mask-display-cairo` (the new one). In the `discovery-of-tutankhamuns-tomb` story, replace that momentId with the existing `tutankhamun-mask-egyptian-museum-cairo`. The existing version has the correct original location (Tahrir Square) and a slightly better description.
2. **Howard Carter moment:** The new story's split into two moments (step-found + wonderful-things) is better granularity than the existing standalone `howard-carter-discovers-tomb-kv62`. Delete the standalone or relegate it. The new split moments should be the canonical versions.
3. **Cross-link:** Add `tutankhamun-biography` to `discovery-of-tutankhamuns-tomb.relatedStoryIds` and vice versa.

---

## Apollo 11 vs. Apollo 13 (Mission Control)

### Overlap Found

**Existing:** `apollo-13-houston` story (line 821, stories.ts)
- Moment `apollo-mission-control` at 2101 NASA Pkwy, Houston (lat 29.5581, lng -95.0897)
- Moment `apollo-lunar-lab` at same complex (lat 29.5595, lng -95.0912)

**New:** `apollo-11` story (line 3250, stories.ts)
- Moment `apollo-11-mission-control-1969` at 2101 E NASA Parkway, Houston (lat 29.5593, lng -95.0893)

### Assessment: NOT a duplicate

These are different events at the same physical location (Johnson Space Center Mission Control). Apollo 13 (1970) and Apollo 11 (1969) are distinct missions. The moments describe different events. **No action needed** -- this is correct behavior (multiple moments at same physical location for different historical events).

### Recommended: Cross-link stories
- Add `apollo-13-houston` to `apollo-11.relatedStoryIds`
- Add `apollo-11` to `apollo-13-houston.relatedStoryIds`

---

## All Other Stories: No Duplicates Found

### Sinking of the Titanic
- **Searched for:** titanic, white star, harland, wolff, belfast
- **Existing content:** None. All 7 moments (`titanic-keel-laid-1909` through `titanic-survivors-new-york-1912`) are new.
- **Status: CLEAN** -- no dedup needed.

### Eruption of Mount Vesuvius (79 AD)
- **Searched for:** vesuvius, pompeii, herculaneum, pliny
- **Existing content:** One existing moment `herodotus-travels-egypt-babylon` mentions pyramids at Giza but has no Vesuvius connection. No pre-existing Vesuvius/Pompeii moments.
- **Status: CLEAN** -- no dedup needed.

### Chernobyl Disaster
- **Searched for:** chernobyl, pripyat, reactor
- **Existing content:** None. All 5 moments are new.
- **Status: CLEAN** -- no dedup needed.

### Fall of the Berlin Wall
- **Searched for:** berlin wall, checkpoint charlie, brandenburg
- **Existing content:** One existing moment `david-bowie-records-heroes-hansa-studios` (line 23270, moments.ts) mentions the Berlin Wall but is about Bowie's recording session in 1977, not about the Wall's construction or fall. Not a duplicate.
- **Existing content:** Putin/Dresden moment (line 3341, stories.ts description) mentions the Wall falling, but it's about Putin's KGB service. Not a duplicate.
- **Status: CLEAN** -- no dedup needed.

### Trail of Tears
- **Searched for:** trail of tears, cherokee, indian removal
- **Existing content:** None. All 6 moments are new.
- **Status: CLEAN** -- no dedup needed.

### Great Pyramid of Giza
- **Searched for:** pyramid, giza, khufu, sphinx
- **Existing moments at Giza (not in the new story):**
  - `herodotus-travels-egypt-babylon` (c. 454 BC, Giza) -- Herodotus visits the pyramids
  - `thales-calculates-pyramid-heights-in-egypt` (c. 600 BC, Giza) -- Thales measures pyramid shadow
  - `eclipse-ufo-pyramids` -- UFO sighting, different topic
  - Various Mesoamerican pyramid moments (Teotihuacan, Palenque, Cholula) -- different locations/cultures
- **Assessment:** The Herodotus and Thales moments are at the same physical location (Giza) but are about visits TO the pyramid centuries later, not about its construction. These are legitimately different events. However, consider whether `herodotus-travels-egypt-babylon` and `thales-calculates-pyramid-heights-in-egypt` should be added to the `construction-of-the-great-pyramid` story as "legacy" moments showing the pyramid's enduring significance.
- **Status: CLEAN** -- no dedup needed, but cross-wiring opportunity exists.

### Rwandan Genocide
- **Searched for:** rwanda, genocide, hutu, tutsi
- **Existing content:** None. All 6 moments are new.
- **Status: CLEAN** -- no dedup needed.

---

## Summary of Required Actions

### Must Fix (Duplicates)

| # | Issue | Existing ID | New ID | Action |
|---|-------|-------------|--------|--------|
| 1 | Flight 93 crash site | `f93-impact` | `911-flight-93-shanksville-2001` | Delete `f93-impact`, rewire `flight-93` story to use `911-flight-93-shanksville-2001`. Cross-link both stories. |
| 2 | Tutankhamun death mask display | `tutankhamun-mask-egyptian-museum-cairo` | `tutankhamun-mask-display-cairo` | Delete `tutankhamun-mask-display-cairo`, rewire `discovery-of-tutankhamuns-tomb` to use existing `tutankhamun-mask-egyptian-museum-cairo`. |
| 3 | Howard Carter tomb discovery (standalone) | `howard-carter-discovers-tomb-kv62` | `tutankhamun-step-found-1922` + `tutankhamun-wonderful-things-1922` | Delete standalone `howard-carter-discovers-tomb-kv62` (the new split into two moments is better). Check if any other story references it. |

### Should Fix (Cross-Links)

| # | Story A | Story B | Action |
|---|---------|---------|--------|
| 4 | `september-11-attacks` | `flight-93` | Add each to the other's relatedStoryIds |
| 5 | `discovery-of-tutankhamuns-tomb` | `tutankhamun-biography` | Add each to the other's relatedStoryIds |
| 6 | `apollo-11` | `apollo-13-houston` | Add each to the other's relatedStoryIds |

### Optional (Enrichment)

| # | Suggestion |
|---|------------|
| 7 | Add `f93-tower` and `f93-newark` to `september-11-attacks.moments[]` for a complete 9/11 picture |
| 8 | Consider adding `thales-calculates-pyramid-heights-in-egypt` and `herodotus-travels-egypt-babylon` to `construction-of-the-great-pyramid` story |
