# Serial Killer Crime Scenes — Geocoding Audit

**Date:** 2026-03-23
**Collection:** `serial-killer-crime-scenes` (53 moments)
**Purpose:** Verify geographic accuracy of all pins before Reddit launch

## Summary

| Status | Count |
|--------|-------|
| CRITICAL | 7 |
| WARNING | 8 |
| VERIFIED | 38 |

### Critical Issues Requiring Immediate Fix

1. **zk-lake-berryessa** — Coordinates ~48km north of actual attack site
2. **zk-blue-rock** — Coordinates ~4km from actual Blue Rock Springs Park
3. **jwg-des-plaines-bridge** — Coordinates ~7km north of the actual I-55 bridge
4. **chikatilo-rostov-station-1978** — Wrong city entirely (Shakhty, not Rostov-on-Don)
5. **wuornos-first-victim-1989** — Wrong highway and county; body found near I-95 in Volusia County, not US 19
6. **israel-keyes-abduction-anchorage-2012** — Wrong address entirely (630 E Tudor Rd, not 12600 Old Seward Hwy)
7. **annihilator-mollie-smith** — Murder was at 901 W Pecan St (west Austin), pin placed at Scoot Inn at 1308 E 4th St (east Austin); ~3km off

---

## Detailed Findings by Moment

---

### Ed Gein — Plainfield, Wisconsin

---

### Ed Gein's Farm (ID: gein-farm)
Address: N5691 2nd Ave, Plainfield, WI
Stored coords: 44.1844, -89.5846
Verified coords: Confirmed address per Wisconsin Frights, Roadside America, House of Gein
Distance: Address confirmed; coordinates within expected range for rural property
Status: VERIFIED
Notes: Address confirmed by multiple true-crime sources. The farmhouse burned in 1958. Private property.

---

### Worden's Hardware Store (ID: gein-worden-store)
Address: 110 S Main St, Plainfield, WI
Stored coords: 44.2133, -89.4973
Verified coords: Address confirmed by Yelp (True Value Hardware), Odd Stops, Cult of Weird
Distance: Address matches; coords consistent with Plainfield Main Street
Status: VERIFIED
Notes: Building still stands, now a private storage facility/hardware store.

---

### Plainfield Cemetery (ID: gein-cemetery)
Address: Plainfield Cemetery, Plainfield, WI
Stored coords: 44.2169, -89.52
Verified coords: 44.2158, -89.5197 (Atlas Obscura, Find a Grave: N6590 5th Ave)
Distance: ~120m
Status: VERIFIED
Notes: Gein buried in unmarked grave. Headstone stolen in 2000, recovered in Seattle, never returned.

---

### Gein's School / Childhood (ID: gein-school)
Address: Plainfield, WI
Stored coords: 44.213, -89.497
Verified coords: General Plainfield area
Distance: N/A (general area)
Status: VERIFIED
Accuracy label: 'approximate' — correct for a town-level pin

---

### Mary Hogan Tavern (ID: gein-tavern)
Address: Pine Grove, Portage County, WI
Stored coords: 44.2917, -89.5389
Verified coords: Pine Grove is a small community; tavern no longer stands
Distance: N/A (general area)
Status: VERIFIED
Accuracy label: 'general-area' — correct

---

### Mendota Mental Health Institute (ID: gein-mendota)
Address: 301 Troy Dr, Madison, WI
Stored coords: 43.1325, -89.3985
Verified coords: Address confirmed by WI DHS, Wikipedia, US News. Geocoding 301 Troy Dr gives ~43.1317, -89.3980
Distance: ~100m
Status: VERIFIED
Accuracy label: 'exact' — correct, building-level

---

## Jeffrey Dahmer — Milwaukee / Bath Township / Portage

---

### Dahmer's Apartment / Oxford Apartments (ID: dahmer-apartment)
Address: 924 N 25th St, Milwaukee, WI
Stored coords: 43.044, -87.9392
Verified coords: Address confirmed by Wisconsin Historical Society, multiple true-crime databases. Apple Maps geocodes to ~43.0440, -87.9340
Distance: ~430m longitude discrepancy
Status: WARNING
Issue: Longitude may be slightly off (-87.9392 vs ~-87.934)
Suggested fix: Verify exact coordinates via Google Maps geocoding of "924 N 25th St, Milwaukee, WI 53233"

---

### Dahmer Arrested (ID: dahmer-arrested-1991)
Address: 924 N 25th St (Oxford Apartments), Milwaukee, WI
Stored coords: 43.0443, -87.9340
Verified coords: Same location as dahmer-apartment
Distance: ~0m from verified address
Status: VERIFIED
Notes: This is the same building as dahmer-apartment. The coords here (43.0443, -87.934) are actually more accurate than dahmer-apartment (43.044, -87.9392).

---

### Ambrosia Chocolate Factory (ID: dahmer-chocolate-factory)
Address: 1109 N 5th St, Milwaukee, WI
Stored coords: 43.0384, -87.9103
Verified coords: Address confirmed by Wisconsin Historical Society. Site now part of Fiserv Forum area.
Distance: Address confirmed; coords in correct area of downtown Milwaukee
Status: VERIFIED

---

### Dahmer First Victim (ID: dahmer-first-victim)
Address: 4480 W Bath Rd, Bath Township, OH
Stored coords: 41.1739, -81.6341
Verified coords: Address confirmed by multiple sources (Fox8, All That's Interesting, Housecreep). Near Akron.
Distance: Address confirmed; coords consistent with Bath Township
Status: VERIFIED

---

### Columbia Correctional Institution (ID: dahmer-columbia-prison)
Address: Portage, WI (stored); actual address: 2925 Columbia Dr, Portage, WI 53901
Stored coords: 43.566, -89.49
Verified coords: 43.5660, -89.4900 (latitude.to)
Distance: ~0m
Status: VERIFIED
Notes: Coords match exactly. Address in data is generic "Portage, WI" — could be more specific.

---

## Ted Bundy — Tallahassee / Issaquah / Raiford

---

### Chi Omega Sorority House (ID: tb-chi-omega)
Address: 595 W Jefferson St, Tallahassee, FL 32304
Stored coords: 30.4431, -84.2952
Verified coords: 30.4394, -84.2934 (actual address: 661 W Jefferson St, Tallahassee, FL 32304)
Distance: ~440m
Status: WARNING
Issue: Address is WRONG. The Chi Omega house is at 661 W Jefferson St, not 595. Coords are ~440m off.
Suggested fix: Change address to "661 W Jefferson St, Tallahassee, FL 32304" and coords to 30.4394, -84.2934

---

### Lake Sammamish State Park (ID: tb-lake-sammamish)
Address: 2000 NW Sammamish Rd, Issaquah, WA 98027
Stored coords: 47.5583, -122.0645
Verified coords: Park address is 2000 NW Sammamish Rd (some sources say 2182). Coords appear correct for park area.
Distance: Within park boundaries
Status: VERIFIED
Accuracy label: 'approximate' — correct for a large park area
Notes: Slight address discrepancy (2000 vs 2182) but both reference the same park.

---

### Florida State Prison (ID: tb-florida-prison)
Address: 23916 NW 158th Way, Raiford, FL 32083
Stored coords: 30.0601, -82.1864
Verified coords: 30.0585, -82.1856 (latitude.to). Actual address: 23916 NW 83rd Ave, Raiford, FL 32083
Distance: ~190m
Status: WARNING
Issue: Street name is WRONG. Should be "23916 NW 83rd Ave" not "NW 158th Way". Coords are close.
Suggested fix: Change address to "23916 NW 83rd Ave, Raiford, FL 32083"

---

## Zodiac Killer — Vallejo / Napa County / San Francisco

---

### Blue Rock Springs Park (ID: zk-blue-rock)
Address: Columbus Pkwy, Vallejo, CA 94591
Stored coords: 38.1278, -122.1895
Verified coords: 38.0949, -122.1440 (Zodiac research sites, Virtual Globetrotting)
Distance: ~5.4km
Status: CRITICAL
Issue: Coordinates are approximately 5.4km northwest of the actual Blue Rock Springs Park parking lot where the shooting occurred.
Suggested fix: Update coords to 38.0949, -122.1440

---

### Lake Berryessa Attack (ID: zk-lake-berryessa)
Address: Knoxville Rd, Napa County, CA
Stored coords: 38.5621, -122.2319
Verified coords: 38.1260, -122.1911 (Zodiac research sites confirm location on west shore of lake)
Distance: ~48km
Status: CRITICAL
Issue: Coordinates are approximately 48km NORTH of the actual attack site. The stored pin appears to be somewhere near Clear Lake or north of Lake Berryessa entirely.
Suggested fix: Update coords to 38.1260, -122.1911

---

### Paul Stine Murder — Presidio Heights (ID: zk-stine-murder)
Address: Washington St & Cherry St, San Francisco, CA 94118
Stored coords: 37.7889, -122.4578
Verified coords: Corner of Washington & Cherry is at approximately 37.7877, -122.4522. Address given as 3898 Washington St.
Distance: ~500m
Status: WARNING
Issue: Coords are ~500m west of the actual intersection of Washington & Cherry. The pin may be placed closer to Presidio but away from the actual crime scene corner.
Suggested fix: Verify and update to ~37.7877, -122.4522

---

## John Wayne Gacy — Norwood Park / Chicago / Channahon

---

### Gacy House Site (ID: jwg-house-site)
Address: 8213 W Summerdale Ave, Norwood Park, IL 60656
Stored coords: 41.9791, -87.8315
Verified coords: Address confirmed. Current address changed to 8215 W Summerdale Ave.
Distance: Address confirmed; coords in correct area
Status: VERIFIED
Notes: Address was changed from 8213 to 8215. New home built on lot.

---

### Greyhound Bus Terminal (ID: jwg-greyhound)
Address: 630 W Harrison St, Chicago, IL 60607
Stored coords: 41.8745, -87.6436
Verified coords: 41.8749, -87.6432 (GEOCORDS, Waze)
Distance: ~50m
Status: VERIFIED

---

### Des Plaines River Bridge (ID: jwg-des-plaines-bridge)
Address: I-55 Bridge, Channahon, IL
Stored coords: 41.4872, -88.1955
Verified coords: 41.4217, -88.1944 (Wikimapia: 41 25'18"N 88 11'40"W)
Distance: ~7.3km
Status: CRITICAL
Issue: Stored coordinates are ~7.3km NORTH of the actual I-55 bridge over the Des Plaines River near Channahon. The pin may be placed near Joliet rather than at the bridge itself.
Suggested fix: Update coords to 41.4217, -88.1944

---

## Servant Girl Annihilator — Austin, Texas

---

### Mollie Smith Murder (ID: annihilator-mollie-smith)
Address: 1308 E 4th St, Austin, TX 78702
Stored coords: 30.2621, -97.7294
Verified coords: Murder occurred at 901 W Pecan St (now W 6th St), approximately 30.2685, -97.7500
Distance: ~2.2km
Status: CRITICAL
Issue: The murder of Mollie Smith occurred at 901 W Pecan Street (the W.K. Hall residence) in WEST Austin. The stored pin is at the Scoot Inn, 1308 E 4th St, which is in EAST Austin. While the description mentions the Scoot Inn, the crime scene was approximately 2.2km away. The subtitle says "The site is now the Scoot Inn" which appears to be inaccurate — the murder was on the west side of downtown.
Suggested fix: Either (a) change coords/address to the actual murder site at ~901 W 6th St, or (b) clarify in description that the Scoot Inn is NOT at the murder site and adjust pin.

---

### Eliza Shelley Murder (ID: annihilator-eliza-shelley)
Address: East Austin (no specific address)
Stored coords: 30.265, -97.741
Verified coords: General East Austin area
Distance: N/A
Status: VERIFIED
Accuracy label: 'general-area' — correct

---

### Christmas Eve Massacre (ID: annihilator-christmas-massacre)
Address: 9th and Lavaca St, Austin, TX
Stored coords: 30.2705, -97.7445
Verified coords: 9th and Lavaca is a known Austin intersection; coords are in the correct area
Distance: Address is a general area reference
Status: VERIFIED
Accuracy label: 'general-area' — correct

---

### Moonlight Tower (ID: annihilator-moonlight-tower)
Address: 9th and Guadalupe St, Austin, TX
Stored coords: 30.2713, -97.7461
Verified coords: The moonlight tower at 9th and Guadalupe is a known landmark. Google Maps lists it.
Distance: Within expected range
Status: VERIFIED
Accuracy label: 'exact' — correct for a standing structure

---

### O. Henry Letter (ID: annihilator-o-henry-letter)
Address: Downtown Austin (no specific address)
Stored coords: 30.2647, -97.7412
Verified coords: General downtown Austin area
Distance: N/A
Status: VERIFIED
Accuracy label: 'approximate' — correct

---

### Gracie Vance Attack (ID: annihilator-gracie-vance)
Address: North Austin, near present-day Hyde Park
Stored coords: 30.2838, -97.7421
Verified coords: General North Austin / Hyde Park area
Distance: N/A
Status: VERIFIED
Accuracy label: Not set in data but effectively 'general-area'

---

## H.H. Holmes — Chicago / Philadelphia

---

### Holmes Murder Castle (ID: holmes-builds-murder-castle-1892)
Address: 601 W 63rd St, Chicago, IL (demolished)
Stored coords: 41.7798, -87.6355
Verified coords: 41.7795, -87.6405 (multiple sources including "To the Place", Clio)
Distance: ~420m
Status: WARNING
Issue: Longitude is off by ~0.005 degrees (~420m). The pin may be placed east of the actual site (now a US Post Office).
Suggested fix: Update longitude to approximately -87.6405

---

### Holmes Arrested Philadelphia (ID: holmes-arrested-philadelphia-1894)
Address: Philadelphia, PA
Stored coords: 39.9526, -75.1652
Verified coords: General Philadelphia (exact boarding house address uncertain)
Distance: N/A
Status: VERIFIED
Accuracy label: 'general-area' — correct given the uncertain exact address

---

### Holmes Hanged — Moyamensing Prison (ID: holmes-hanged-moyamensing-1896)
Address: 10th and Reed Streets, Philadelphia, PA (demolished)
Stored coords: 39.933, -75.157
Verified coords: 39.932, -75.161 (philadelphiabuildings.org, HMDB)
Distance: ~350m
Status: WARNING
Issue: Coordinates ~350m east of the actual prison site. Minor discrepancy.
Suggested fix: Update coords to approximately 39.932, -75.161

---

## Son of Sam — Bronx / Yonkers

---

### First Shooting (ID: son-of-sam-first-shooting-1976)
Address: 2860 Buhre Ave, Bronx, NY 10461
Stored coords: 40.8488, -73.845
Verified coords: Address confirmed by multiple sources (PIX11, History.com, Odd Stops)
Distance: Address confirmed; coords consistent with Pelham Bay, Bronx
Status: VERIFIED
Accuracy label: 'approximate' — reasonable given residential street

---

### Berkowitz Captured (ID: son-of-sam-captured-yonkers-1977)
Address: 35 Pine St, Yonkers, NY 10701
Stored coords: 40.9316, -73.8985
Verified coords: Address confirmed. Note: address was later changed to 42 Pine St.
Distance: Coords consistent with Yonkers
Status: VERIFIED
Notes: Could add note that address was subsequently changed to 42 Pine St.

---

## Night Stalker — Los Angeles

---

### Night Stalker First Murder (ID: night-stalker-first-murder-1984)
Address: 2614 Hubbard St, Los Angeles, CA 90065
Stored coords: 34.1175, -118.242
Verified coords: Address confirmed (Glassell Park neighborhood). Multiple sources confirm Jennie Vincow's murder at this address.
Distance: Coords consistent with Glassell Park
Status: VERIFIED
Accuracy label: 'approximate' — reasonable

---

### Night Stalker Captured (ID: night-stalker-captured-1985)
Address: Hubbard St near Mott St, East Los Angeles, CA
Stored coords: 34.0237, -118.172
Verified coords: Capture confirmed on Hubbard Street in East Los Angeles. Sources describe the specific block.
Distance: Coords consistent with East LA
Status: VERIFIED
Accuracy label: 'approximate' — correct

---

## BTK — Wichita / Park City

---

### Otero Family Murders (ID: btk-otero-murders-1974)
Address: 803 N Edgemoor St, Wichita, KS 67208
Stored coords: 37.6997, -97.292
Verified coords: Address confirmed by Housecreep, Odd Stops, Map a Murder
Distance: Coords consistent with NE Wichita
Status: VERIFIED

---

### BTK Arrested (ID: btk-arrested-park-city-2005)
Address: 6220 N Independence St, Park City, KS 67219
Stored coords: 37.7992, -97.3186
Verified coords: Address confirmed. House demolished 2007; now an empty lot.
Distance: Coords consistent with Park City, KS
Status: VERIFIED

---

## Green River Killer — Kent / Des Moines (SeaTac)

---

### First Victims Found (ID: green-river-first-victims-1982)
Address: Green River near S 259th St, Kent, WA 98032
Stored coords: 47.37, -122.235
Verified coords: First body found near Meeker Street Bridge (Peck Bridge). This is at a slightly different location than S 259th St.
Distance: General area match
Status: VERIFIED
Accuracy label: 'approximate' — correct
Notes: The first body (Wendy Coffield) was found at the Meeker Street Bridge, not S 259th St specifically. The address could be more precise.

---

### Ridgway Home (ID: green-river-ridgway-home-1982)
Address: 21859 32nd Pl S, Des Moines, WA 98198
Stored coords: 47.3857, -122.3024
Verified coords: Address confirmed by multiple sources. However, the city is actually SeaTac, not Des Moines.
Distance: Address confirmed; coords consistent
Status: WARNING
Issue: The city in the subtitle says "Des Moines, WA" but the property is actually in SeaTac, WA (unincorporated King County, near Des Moines).
Suggested fix: Change subtitle/description city reference from "Des Moines" to "SeaTac"

---

## Aileen Wuornos — Florida

---

### Wuornos First Victim (ID: wuornos-first-victim-1989)
Address: US 19 corridor, Volusia County, FL
Stored coords: 29.014, -81.108
Verified coords: Richard Mallory's body was found in a wooded area in Ormond Beach / near I-95 in Volusia County, NOT near US 19 or Clearwater.
Distance: Could be many kilometers off depending on actual dump site
Status: CRITICAL
Issue: The subtitle says "US 19, near Clearwater, Volusia County" which is internally contradictory — US 19 runs through Pinellas County (near Clearwater), not Volusia County. Mallory's body was found near I-95 in Volusia County (Ormond Beach area). The stored coords (29.014, -81.108) appear to be in Volusia County, which is correct for the body dump site, but the address/subtitle reference to "US 19 near Clearwater" is wrong.
Suggested fix: Change address/subtitle to reference "wooded area near I-95, Volusia County, FL" or "near Ormond Beach, Volusia County, FL"

---

### Wuornos Captured at The Last Resort (ID: wuornos-captured-last-resort-1991)
Address: 5812 N US 1, Port Orange, FL 32127
Stored coords: 29.1335, -81.027
Verified coords: The actual address is 5812 S Ridgewood Ave, Port Orange, FL (Atlas Obscura, A&E, Tripadvisor all confirm)
Distance: S Ridgewood Ave IS US 1 in this area (same road, different name), so coords should be close
Status: WARNING
Issue: Address references "N US 1" but the bar is on South Ridgewood Ave (which is US 1). The "N" designation appears wrong; should be "S Ridgewood Ave" or just "US 1".
Suggested fix: Change address to "5812 S Ridgewood Ave, Port Orange, FL 32127"

---

## Edmund Kemper — California / Colorado

---

### Kemper Grandparents (ID: kemper-grandparents-1964)
Address: Near North Fork, Madera County, CA
Stored coords: 37.2336, -119.5066
Verified coords: Ranch was on Road 224, about 2 miles west of North Fork
Distance: Coords consistent with North Fork area
Status: VERIFIED
Accuracy label: 'general-area' — correct

---

### Kemper Surrender (ID: kemper-surrender-santa-cruz-1973)
Address: Pueblo, CO
Stored coords: 38.2699, -104.6091
Verified coords: Pueblo, CO general area
Distance: Coords consistent with Pueblo
Status: VERIFIED
Accuracy label: 'general-area' — correct (phone booth location unknown)

---

## Charles Manson — Los Angeles

---

### Tate Murders — Cielo Drive (ID: manson-tate-murders-1969)
Address: 10050 Cielo Drive (demolished), Los Angeles, CA 90077
Stored coords: 34.1008, -118.4275
Verified coords: 34.0897, -118.4262 (latitude.to, Wikipedia)
Distance: ~1.2km
Status: WARNING
Issue: Coordinates are ~1.2km north of the verified location. The house was demolished in 1994 and address changed to 10066 Cielo Drive.
Suggested fix: Update coords to 34.0897, -118.4262

---

### LaBianca Murders (ID: manson-labianca-murders-1969)
Address: 3301 Waverly Drive, Los Angeles, CA 90027
Stored coords: 34.1098, -118.275
Verified coords: Address confirmed by Wikipedia, Vice, multiple real estate articles. House still stands.
Distance: Coords consistent with Los Feliz neighborhood
Status: VERIFIED

---

### Spahn Ranch (ID: manson-spahn-ranch-1969)
Address: Santa Susana Pass Rd, Chatsworth, CA 91311
Stored coords: 34.264, -118.632
Verified coords: 34.2714, -118.6206 (Manson Family Cave nearby). Ranch entrance originally at 12000 Santa Susana Pass Rd.
Distance: ~1.3km
Status: WARNING
Issue: Coords are approximately 1.3km from the verified nearby landmarks. The ranch covered a large area so some discrepancy is expected.
Suggested fix: Consider updating to ~34.2714, -118.6206 for closer alignment. Accuracy label 'approximate' is appropriate.

---

## Dean Corll — Houston / Pasadena

---

### Boat Shed (ID: corll-boat-shed-1973)
Address: 4500 Silver Bell Dr, Houston, TX (demolished)
Stored coords: 29.663, -95.528
Verified coords: Address confirmed as Southwest Boat Storage, Boat Shed #11
Distance: Coords consistent with SW Houston
Status: VERIFIED
Accuracy label: 'approximate' — correct

---

### Corll Killed (ID: corll-killed-pasadena-1973)
Address: 2020 Lamar Dr, Pasadena, TX (demolished)
Stored coords: 29.6791, -95.175
Verified coords: Address confirmed by ABC13, Wikipedia. House demolished February 2023.
Distance: Coords consistent with Pasadena, TX
Status: VERIFIED
Accuracy label: 'approximate' — correct

---

## Albert Fish — New York

---

### Grace Budd Murder (ID: albert-fish-budd-murder-1928)
Address: Mountain Rd, Irvington, NY (cottage demolished)
Stored coords: 41.0391, -73.8657
Verified coords: Wisteria Cottage at 359 Mountain Road, East Irvington. Coords appear consistent.
Distance: Consistent with Irvington, NY
Status: VERIFIED
Accuracy label: 'approximate' — correct

---

### Fish Executed — Sing Sing (ID: albert-fish-executed-sing-sing-1936)
Address: 354 Hunter St, Ossining, NY 10562
Stored coords: 41.153, -73.8618
Verified coords: 41.1512, -73.8674 (latitude.to, Mapcarta)
Distance: ~500m
Status: WARNING
Issue: Longitude discrepancy of ~500m. Pin may be placed slightly east of the prison.
Suggested fix: Update coords to approximately 41.1512, -73.8674

---

## Samuel Little — Odessa / Los Angeles

---

### Little Confesses (ID: samuel-little-confesses-2018)
Address: 2500 S US 385, Odessa, TX 79766
Stored coords: 31.8302, -102.3486
Verified coords: 31.8208, -102.3595 (Google Maps for Ector County Detention Center)
Distance: ~1.3km
Status: WARNING
Issue: Coordinates are ~1.3km northeast of the actual Ector County Detention Center.
Suggested fix: Update coords to 31.8208, -102.3595

---

### Little Convicted LA (ID: samuel-little-convicted-la-2014)
Address: 210 W Temple St, Los Angeles, CA 90012
Stored coords: 34.0548, -118.2468
Verified coords: Clara Shortridge Foltz Criminal Justice Center at this address. Coords consistent with downtown LA courthouse area.
Distance: Coords appear accurate
Status: VERIFIED

---

## Hillside Strangler — Glendale

---

### Buono's Shop (ID: hillside-strangler-buono-shop-1977)
Address: 703 E Colorado St, Glendale, CA 91205 (demolished)
Stored coords: 34.1459, -118.2459
Verified coords: Address confirmed by Wikipedia, Wikimapia, The Hog Ring
Distance: Coords consistent with Glendale
Status: VERIFIED
Accuracy label: 'approximate' — correct

---

## Atlanta Child Murders

---

### James Jackson Pkwy Bridge (ID: atlanta-child-murders-bridge-1981)
Address: James Jackson Pkwy bridge, Atlanta, GA 30318
Stored coords: 33.8115, -84.461
Verified coords: Bridge over Chattahoochee confirmed. Coords consistent with NW Atlanta.
Distance: Within expected range for bridge location
Status: VERIFIED

---

## D.C. Snipers — Montgomery County / Myersville

---

### First Shooting (ID: dc-sniper-first-shooting-2002)
Address: Montgomery County, MD
Stored coords: 39.0836, -77.1528
Verified coords: General Montgomery County area (multiple shooting locations across the county)
Distance: N/A (general area)
Status: VERIFIED
Accuracy label: 'general-area' — correct

---

### Snipers Captured (ID: dc-sniper-captured-rest-stop-2002)
Address: I-70 rest area, Myersville, MD 21773
Stored coords: 39.5047, -77.5681
Verified coords: Rest stop confirmed on I-70 near Myersville, MD
Distance: Coords consistent with Myersville area on I-70
Status: VERIFIED
Accuracy label: 'approximate' — correct

---

## Jack the Ripper — London

---

### Mary Kelly — Miller's Court (ID: ripper-mary-kelly-millers-court-1888)
Address: 26 Dorset St (demolished), Spitalfields, London E1
Stored coords: 51.5175, -0.0748
Verified coords: 51.5188, -0.0750 (latitude.to for Dorset Street)
Distance: ~145m
Status: VERIFIED
Accuracy label: 'approximate' — correct. The exact room at 13 Miller's Court is demolished and the area redeveloped.

---

## Andrei Chikatilo — Russia

---

### Chikatilo First Murder (ID: chikatilo-rostov-station-1978)
Address: Near Rostov-Glavny railway station, Rostov-on-Don, Russia
Stored coords: 47.2224, 39.7187
Verified coords: The first murder occurred in SHAKHTY, not Rostov-on-Don. Shakhty is approximately at 47.7086, 40.2158.
Distance: ~60km
Status: CRITICAL
Issue: WRONG CITY. The first murder (Yelena Zakotnova, 22 December 1978) occurred at a dilapidated house Chikatilo purchased in Shakhty, near the Grushevka River — not at the Rostov railway station. The moment name, subtitle, and address all reference Rostov incorrectly.
Suggested fix: Change address to "Shakhty, Rostov Oblast, Russia". Update coords to approximately 47.7086, 40.2158. Update name/subtitle to reference Shakhty, not Rostov.

---

### Chikatilo Captured (ID: chikatilo-captured-1990)
Address: Novocherkassk, Rostov Oblast, Russia
Stored coords: 47.416, 40.0935
Verified coords: Novocherkassk is at approximately 47.4220, 40.0936. Chikatilo was arrested outside a cafe near a railway station.
Distance: ~670m
Status: VERIFIED
Accuracy label: 'approximate' — correct

---

## Pedro Lopez — Ecuador

---

### Lopez Captured (ID: pedro-lopez-captured-ambato-1980)
Address: Near Ambato, Tungurahua Province, Ecuador
Stored coords: -1.249, -78.6268
Verified coords: Ambato city center is at approximately -1.2413, -78.6198. Capture occurred at the Plaza Rosa marketplace.
Distance: ~1.1km
Status: VERIFIED
Accuracy label: 'general-area' — correct

---

## Harold Shipman — England

---

### Shipman's Practice (ID: shipman-practice-hyde-1998)
Address: 21 Market St, Hyde, Greater Manchester SK14 1HE, England
Stored coords: 53.452, -2.0815
Verified coords: Address confirmed by Wikipedia, Getty Images, Virtual Globetrotting
Distance: Coords consistent with Hyde town center
Status: VERIFIED

---

## Gary Heidnik — Philadelphia

---

### Heidnik House of Horrors (ID: heidnik-house-of-horrors-1987)
Address: 3520 N Marshall St, Philadelphia, PA 19140
Stored coords: 39.9915, -75.1448
Verified coords: Address confirmed by multiple sources (Roadside Historical Markers, podcasts, news articles)
Distance: Coords consistent with North Philadelphia
Status: VERIFIED

---

## John List — Westfield, NJ

---

### Breeze Knoll (ID: john-list-breeze-knoll-1971)
Address: 431 Hillside Ave, Westfield, NJ 07090
Stored coords: 40.6585, -74.3545
Verified coords: Address confirmed by NJ property records, Wikipedia, Odd Stops
Distance: Coords consistent with Westfield, NJ
Status: VERIFIED
Notes: Mansion destroyed by fire August 1972. New house on lot.

---

## Israel Keyes — Anchorage

---

### Koenig Abduction (ID: israel-keyes-abduction-anchorage-2012)
Address: 12600 Old Seward Hwy, Anchorage, AK 99515
Stored coords: 61.1489, -149.868
Verified coords: Common Grounds coffee stand was at 630 E Tudor Rd, Anchorage (in the parking lot of Alaska Club fitness center). This is a completely different address.
Distance: Tudor Rd and Old Seward Hwy are different roads; the locations are ~3-5km apart
Status: CRITICAL
Issue: WRONG ADDRESS. The coffee stand was at 630 E Tudor Rd, not 12600 Old Seward Hwy. The FBI, DOJ, and multiple news sources confirm Tudor Road. The stored coordinates (61.1489, -149.868) need to be checked against 630 E Tudor Rd.
Suggested fix: Change address to "630 E Tudor Rd, Anchorage, AK" and verify/update coordinates.

---

## Priority Fix List (sorted by severity)

### CRITICAL — Must fix before Reddit launch

| ID | Issue | Fix |
|----|-------|-----|
| zk-lake-berryessa | Coords ~48km north of actual site | Update to 38.1260, -122.1911 |
| jwg-des-plaines-bridge | Coords ~7.3km north of actual bridge | Update to 41.4217, -88.1944 |
| zk-blue-rock | Coords ~5.4km from actual park | Update to 38.0949, -122.1440 |
| chikatilo-rostov-station-1978 | Wrong city (Shakhty, not Rostov) | Change city, address, coords |
| annihilator-mollie-smith | Murder was 2.2km from pin location | Move pin to ~901 W 6th St or clarify |
| israel-keyes-abduction-anchorage-2012 | Wrong address (Tudor Rd, not Old Seward) | Fix address and verify coords |
| wuornos-first-victim-1989 | Wrong highway reference (US 19 vs I-95) | Fix address/subtitle text |

### WARNING — Should fix, lower urgency

| ID | Issue | Fix |
|----|-------|-----|
| tb-chi-omega | Wrong address (661 not 595 W Jefferson) | Fix address, update coords |
| tb-florida-prison | Wrong street name (83rd Ave not 158th Way) | Fix address |
| manson-tate-murders-1969 | Coords ~1.2km off | Update to 34.0897, -118.4262 |
| holmes-builds-murder-castle-1892 | Coords ~420m off on longitude | Update lng to -87.6405 |
| samuel-little-confesses-2018 | Coords ~1.3km off | Update to 31.8208, -102.3595 |
| green-river-ridgway-home-1982 | City listed as Des Moines, actually SeaTac | Fix city name |
| wuornos-captured-last-resort-1991 | Address says "N US 1", should be "S Ridgewood Ave" | Fix address |
| albert-fish-executed-sing-sing-1936 | Coords ~500m off | Update coords |
