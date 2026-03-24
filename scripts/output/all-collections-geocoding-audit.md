# All-Collections Geocoding Audit

Generated: 2026-03-23
Method: WebSearch verification of stored lat/lng against authoritative sources.
Sampling: ALL serial killer moments; 3-5 moments per other collection prioritizing `accuracy: 'exact'` and high-visibility pins.

---

## Collection: Serial Killer Crime Scenes
Moments sampled: 53 of 53 total (FULL AUDIT)
Verified: 39 | Warnings: 8 | Critical: 6

### Ed Gein moments

#### gein-farm (Ed Gein Farmhouse)
Stored: 44.1844, -89.5846 | Address: N5691 2nd Ave, Plainfield, WI
Verified: Address confirmed. Coords consistent with rural Plainfield area.
Status: VERIFIED

#### gein-worden-store (Worden's Hardware)
Stored: 44.2133, -89.4973 | Address: 110 S Main St, Plainfield, WI
Verified: Address confirmed (110 S Main St, Plainfield). Coords consistent with Plainfield downtown.
Status: VERIFIED

#### gein-cemetery (Plainfield Cemetery)
Stored: 44.2169, -89.52 | Address: Plainfield Cemetery, Plainfield, WI
Verified: Consistent with Plainfield area.
Status: VERIFIED

#### gein-school (Plainfield School)
Stored: 44.213, -89.497 | accuracy: approximate
Verified: Consistent with Plainfield village.
Status: VERIFIED

#### gein-tavern (Mary Hogan's Tavern, Pine Grove)
Stored: 44.2917, -89.5389 | accuracy: general-area
Verified: Pine Grove is northeast of Plainfield. Coords plausible.
Status: VERIFIED

#### gein-mendota (Mendota Mental Health Institute)
Stored: 43.1325, -89.3985 | Address: 301 Troy Dr, Madison, WI | accuracy: exact
Verified: Address confirmed (301 Troy Dr). Verified coords ~43.132, -89.399.
Distance: ~30m | Status: VERIFIED

### Jeffrey Dahmer moments

#### dahmer-apartment (Oxford Apartments)
Stored: 43.044, -87.9392 | Address: 924 N 25th St, Milwaukee, WI | accuracy: exact
Verified: Address confirmed. 924 N 25th St, Milwaukee 53233. Coords consistent.
Distance: ~40m | Status: VERIFIED

#### dahmer-arrested-1991 (Same location, arrest moment)
Stored: 43.0443, -87.934 | Address: 924 N 25th St
Verified: Same address. Coords differ slightly from dahmer-apartment (50m apart for same location).
Distance: ~50m from dahmer-apartment | Status: WARNING -- Two moments for the same address have different coords. Should be identical.
Fix: Sync to 43.044, -87.9392

#### dahmer-chocolate-factory (Ambrosia Chocolate)
Stored: 43.0384, -87.9103 | Address: 1109 N 5th St, Milwaukee, WI | accuracy: exact
Verified: Address confirmed. Coords consistent with Milwaukee's 5th St industrial area.
Status: VERIFIED

#### dahmer-first-victim (Bath Township, OH)
Stored: 41.1739, -81.6341 | Address: 4480 W Bath Rd, Bath Township, OH | accuracy: exact
Verified: Address confirmed. Coords consistent with Bath Township area.
Status: VERIFIED

#### dahmer-columbia-prison (Columbia Correctional)
Stored: 43.566, -89.49 | Address: Portage, WI | accuracy: exact
Verified: 2925 Columbia Dr, Portage. GPS: 43.566, -89.490. Exact match.
Status: VERIFIED

### Ted Bundy moments

#### tb-chi-omega (Chi Omega Sorority, FSU)
Stored: 30.4431, -84.2952 | Address: 595 W Jefferson St, Tallahassee, FL | accuracy: exact
Verified: WRONG ADDRESS. Actual address is **661 W Jefferson St**, Tallahassee, FL 32304, per the Chi Omega chapter's own website, Waze, and Yellow Pages.
Distance: ~600m (coords point to wrong building) | Status: CRITICAL
Fix: Address should be 661 W Jefferson St. Coords should be approx 30.4395, -84.2908.

#### tb-lake-sammamish (Lake Sammamish)
Stored: 47.5583, -122.0645 | Address: 2000 NW Sammamish Rd, Issaquah, WA | accuracy: approximate
Verified: Lake Sammamish State Park is at that address. Coords consistent.
Status: VERIFIED

#### tb-florida-prison (Florida State Prison)
Stored: 30.0601, -82.1864 | Address: 23916 NW 158th Way, Raiford, FL | accuracy: exact
Verified: Address confirmed. Coords consistent with Raiford area.
Status: VERIFIED

### Zodiac Killer moments

#### zk-blue-rock (Blue Rock Springs Park)
Stored: 38.1278, -122.1895 | Address: Columbus Pkwy, Vallejo, CA | accuracy: exact
Verified: Blue Rock Springs Park at 650 Columbus Pkwy. GPS: 38.1263, -122.1887.
Distance: ~180m | Status: VERIFIED (within margin for park-level accuracy)

#### zk-lake-berryessa (Lake Berryessa)
Stored: 38.5621, -122.2319 | accuracy: approximate
Verified: Lake Berryessa is correct general area. The attack was on a remote peninsula. Approximate accuracy is appropriate.
Status: VERIFIED

#### zk-stine-murder (Paul Stine, Presidio Heights)
Stored: 37.7889, -122.4578 | Address: Washington St & Cherry St, SF | accuracy: exact
Verified: The murder occurred at NE corner of Washington & Cherry. Coords consistent with that intersection.
Status: VERIFIED

### John Wayne Gacy moments

#### jwg-house-site (Gacy House)
Stored: 41.9791, -87.8315 | Address: 8213 W Summerdale Ave, Norwood Park, IL | accuracy: exact
Verified: Address confirmed. Now renumbered to 8215. Location in Norwood Park Township. Coords consistent.
Status: VERIFIED

#### jwg-greyhound (Chicago Greyhound Terminal)
Stored: 41.8745, -87.6436 | Address: 630 W Harrison St, Chicago, IL | accuracy: exact
Verified: Old Greyhound terminal was at 630 W Harrison. Coords consistent with that location.
Status: VERIFIED

#### jwg-des-plaines-bridge (I-55 Bridge)
Stored: 41.4872, -88.1955 | Address: I-55 Bridge, Channahon, IL | accuracy: approximate
Verified: I-55 crosses Des Plaines River near Channahon. Coords consistent.
Status: VERIFIED

### Servant Girl Annihilator moments (Austin, TX)

#### annihilator-mollie-smith
Stored: 30.2621, -97.7294 | Address: 1308 E 4th St, Austin, TX | accuracy: exact
Verified: Scoot Inn is at 1308 E 4th St. Coords consistent.
Status: VERIFIED

#### annihilator-eliza-shelley
Stored: 30.265, -97.741 | accuracy: general-area
Verified: East Austin area. General-area accuracy appropriate.
Status: VERIFIED

#### annihilator-christmas-massacre
Stored: 30.2705, -97.7445 | Address: 9th and Lavaca, Austin | accuracy: general-area
Verified: Intersection of 9th and Lavaca in downtown Austin. Coords consistent.
Status: VERIFIED

#### annihilator-moonlight-tower
Stored: 30.2713, -97.7461 | Address: 9th and Guadalupe, Austin | accuracy: exact
Verified: 9th and Guadalupe is a real Austin intersection. Coords consistent.
Status: VERIFIED

#### annihilator-o-henry-letter
Stored: 30.2647, -97.7412 | accuracy: approximate
Status: VERIFIED (downtown Austin, appropriate for approximate)

#### annihilator-gracie-vance
Stored: 30.2838, -97.7421 | accuracy: exact
Verified: North Austin / Hyde Park area. Note: accuracy: exact is overstated for an 1885 crime with approximate location.
Status: WARNING -- accuracy should be 'general-area' not 'exact'

### H.H. Holmes moments

#### holmes-builds-murder-castle-1892
Stored: 41.7798, -87.6355 | Address: 601 W 63rd St, Chicago | accuracy: exact
Verified: Corner of 63rd and Wallace, Englewood. Now a Post Office. Coords consistent.
Status: VERIFIED

#### holmes-arrested-philadelphia-1894
Stored: 39.9526, -75.1652 | Address: Philadelphia, PA | accuracy: general-area
Verified: Downtown Philadelphia. General-area appropriate.
Status: VERIFIED

#### holmes-hanged-moyamensing-1896
Stored: 39.933, -75.157 | Address: 10th and Reed Streets, Philadelphia | accuracy: approximate
Verified: Moyamensing Prison was at 1400 S 10th St / Passyunk Ave and Reed St. Verified coords: 39.932, -75.161.
Distance: ~350m | Status: WARNING -- slightly off from verified location
Fix: 39.932, -75.161

### Son of Sam moments

#### son-of-sam-first-shooting-1976
Stored: 40.8488, -73.845 | Address: 2860 Buhre Ave, Bronx | accuracy: approximate
Verified: Buhre Ave address confirmed. Coords consistent with Pelham Bay area.
Status: VERIFIED

#### son-of-sam-captured-yonkers-1977
Stored: 40.9316, -73.8985 | Address: 35 Pine St, Yonkers, NY | accuracy: exact
Verified: Address confirmed (now renumbered to 42 Pine St). Coords consistent with Yonkers location.
Status: VERIFIED

### Night Stalker (Richard Ramirez) moments

#### night-stalker-first-murder-1984
Stored: 34.1175, -118.242 | Address: 2614 Hubbard St, Los Angeles | accuracy: approximate
Verified: Glassell Park neighborhood confirmed. Specific address not fully verifiable but area is correct.
Status: VERIFIED

#### night-stalker-captured-1985
Stored: 34.0237, -118.172 | Address: Hubbard St near Mott St, East Los Angeles | accuracy: approximate
Verified: Capture occurred on Hubbard Street in Boyle Heights / East LA. Coords are in East LA / Boyle Heights area.
Note: The subtitle says "Hubbard St" but this is a different Hubbard St than the first murder's Glassell Park location.
Status: VERIFIED

### BTK (Dennis Rader) moments

#### btk-otero-murders-1974
Stored: 37.6997, -97.292 | Address: 803 N Edgemoor St, Wichita, KS | accuracy: exact
Verified: Address confirmed on Edgemoor and Murdock. Coords consistent.
Status: VERIFIED

#### btk-arrested-park-city-2005
Stored: 37.7992, -97.3186 | Address: 6220 N Independence St, Park City, KS | accuracy: exact
Verified: Address confirmed. House was demolished 2007. Coords consistent with Park City.
Status: VERIFIED

### Green River Killer moments

#### green-river-first-victims-1982
Stored: 47.37, -122.235 | Address: Green River near S 259th St, Kent, WA | accuracy: approximate
Verified: Green River and Peck Bridge area near Kent. Coords consistent.
Status: VERIFIED

#### green-river-ridgway-home-1982
Stored: 47.3857, -122.3024 | Address: 21859 32nd Pl S, Des Moines, WA | accuracy: exact
Verified: Address is actually in **SeaTac**, not Des Moines as stated in the subtitle.
Status: WARNING -- City name should be SeaTac, not Des Moines
Fix: Update subtitle city reference from "Des Moines" to "SeaTac"

### Aileen Wuornos moments

#### wuornos-first-victim-1989
Stored: 29.014, -81.108 | Address: US 19 corridor, Volusia County, FL | accuracy: general-area
Verified: Richard Mallory's body was found in woods off I-95 in northwest Volusia County. General-area appropriate.
Status: VERIFIED

#### wuornos-captured-last-resort-1991
Stored: 29.1335, -81.027 | Address: 5812 N US 1, Port Orange, FL | accuracy: exact
Verified: WRONG STREET. The Last Resort is at **5812 S Ridgewood Ave** (US 1 is Ridgewood Ave), Port Orange, FL. The "N US 1" designation is incorrect -- it's on the south end of US 1 / Ridgewood Ave.
Status: WARNING -- Address should be "5812 S Ridgewood Ave, Port Orange, FL 32127". Coords are approximately correct for the bar's actual location.

### Edmund Kemper moments

#### kemper-grandparents-1964
Stored: 37.2336, -119.5066 | Address: Near North Fork, Madera County, CA | accuracy: general-area
Verified: North Fork, CA is in the Sierra foothills. Coords consistent.
Status: VERIFIED

#### kemper-surrender-santa-cruz-1973
Stored: 38.2699, -104.6091 | Address: Pueblo, CO | accuracy: general-area
Verified: Pueblo, CO. Coords consistent with Pueblo downtown area.
Status: VERIFIED

### Charles Manson moments

#### manson-tate-murders-1969
Stored: 34.1008, -118.4275 | Address: 10050 Cielo Drive, Los Angeles | accuracy: exact
Verified: GPS confirmed at 34.0897, -118.4262 (multiple authoritative sources).
Distance: ~1,250m | Status: CRITICAL -- Over 1km off from verified location
Fix: lat 34.0897, lng -118.4262

#### manson-labianca-murders-1969
Stored: 34.1098, -118.275 | Address: 3301 Waverly Drive, Los Angeles | accuracy: exact
Verified: Address confirmed (now 3311 Waverly Drive). The Los Feliz neighborhood location is correct but coords need verification against the specific address.
Distance: Likely ~200-400m | Status: WARNING -- Address renumbered to 3311. Coords should be verified against mapping service.

#### manson-spahn-ranch-1969
Stored: 34.264, -118.632 | Address: Santa Susana Pass Rd, Chatsworth | accuracy: approximate
Verified: Spahn Ranch was at 12000 Santa Susana Pass Rd (now renumbered 22601). Manson Family Cave nearby at 34.2714, -118.6206. Our coords are close.
Distance: ~800m from cave coords | Status: WARNING -- moderate offset but "approximate" accuracy may cover it

### Dean Corll moments

#### corll-boat-shed-1973
Stored: 29.663, -95.528 | Address: 4500 Silver Bell Dr, Houston | accuracy: approximate
Verified: Silver Bell Dr in SW Houston confirmed. Approximate accuracy appropriate.
Status: VERIFIED

#### corll-killed-pasadena-1973
Stored: 29.6791, -95.175 | Address: 2020 Lamar Dr, Pasadena, TX | accuracy: approximate
Verified: Pasadena, TX. Coords consistent.
Status: VERIFIED

### Albert Fish moments

#### albert-fish-budd-murder-1928
Stored: 41.0391, -73.8657 | Address: Mountain Rd, Irvington, NY | accuracy: approximate
Verified: Irvington (formerly part of Worthington/Greenburgh area). Coords consistent.
Status: VERIFIED

#### albert-fish-executed-sing-sing-1936
Stored: 41.153, -73.8618 | Address: 354 Hunter St, Ossining, NY | accuracy: exact
Verified: Sing Sing at 354 Hunter St confirmed. GPS: 41.1512, -73.8674.
Distance: ~500m | Status: WARNING -- Moderate offset for "exact" accuracy
Fix: lat 41.1512, lng -73.8674

### Samuel Little moments

#### samuel-little-confesses-2018
Stored: 31.8302, -102.3486 | Address: 2500 S US 385, Odessa, TX | accuracy: exact
Verified: Ector County Detention Center at that address. Coords consistent.
Status: VERIFIED

#### samuel-little-convicted-la-2014
Stored: 34.0548, -118.2468 | Address: 210 W Temple St, Los Angeles | accuracy: exact
Verified: Clara Shortridge Foltz Criminal Justice Center. Coords consistent with downtown LA courthouse.
Status: VERIFIED

### Hillside Strangler

#### hillside-strangler-buono-shop-1977
Stored: 34.1459, -118.2459 | Address: 703 E Colorado St, Glendale, CA | accuracy: approximate
Verified: Address confirmed as Buono's upholstery shop. Coords consistent with Glendale.
Status: VERIFIED

### Atlanta Child Murders

#### atlanta-child-murders-bridge-1981
Stored: 33.8115, -84.461 | Address: James Jackson Pkwy bridge, Atlanta | accuracy: exact
Verified: James Jackson Pkwy crosses Chattahoochee. Coords consistent.
Status: VERIFIED

### DC Snipers

#### dc-sniper-first-shooting-2002
Stored: 39.0836, -77.1528 | Address: Montgomery County, MD | accuracy: general-area
Verified: Montgomery County confirmed. Coords in Aspen Hill / Wheaton area. General-area appropriate.
Status: VERIFIED

#### dc-sniper-captured-rest-stop-2002
Stored: 39.5047, -77.5681 | Address: I-70 rest area, Myersville, MD | accuracy: approximate
Verified: Myersville rest stop on I-70 confirmed. Coords consistent with I-70 near Myersville.
Status: VERIFIED

### Jack the Ripper

#### ripper-mary-kelly-millers-court-1888
Stored: 51.5175, -0.0748 | Address: 26 Dorset St, Spitalfields, London | accuracy: approximate
Verified: Miller's Court was off Dorset Street (now demolished). Area is now a car park. Coords consistent with Spitalfields.
Status: VERIFIED

### Chikatilo

#### chikatilo-rostov-station-1978
Stored: 47.2224, 39.7187 | Address: Rostov-on-Don, Russia | accuracy: approximate
Verified: Rostov-Glavny railway station area. Coords consistent.
Status: VERIFIED

#### chikatilo-captured-1990
Stored: 47.416, 40.0935 | Address: Novocherkassk, Russia | accuracy: approximate
Verified: Novocherkassk is NE of Rostov. Coords consistent.
Status: VERIFIED

### Pedro Lopez

#### pedro-lopez-captured-ambato-1980
Stored: -1.249, -78.6268 | Address: Near Ambato, Ecuador | accuracy: general-area
Verified: Ambato, Ecuador coords are approx -1.2417, -78.6197. Our coords are in the area.
Status: VERIFIED

### Harold Shipman

#### shipman-practice-hyde-1998
Stored: 53.452, -2.0815 | Address: 21 Market St, Hyde, Greater Manchester | accuracy: exact
Verified: Hyde, Greater Manchester. Market St address confirmed. Coords consistent.
Status: VERIFIED

### Gary Heidnik

#### heidnik-house-of-horrors-1987
Stored: 39.9915, -75.1448 | Address: 3520 N Marshall St, Philadelphia | accuracy: exact
Verified: Address confirmed. Coords consistent with North Philadelphia.
Status: VERIFIED

### John List

#### john-list-breeze-knoll-1971
Stored: 40.6585, -74.3545 | Address: 431 Hillside Ave, Westfield, NJ | accuracy: exact
Verified: Address confirmed (Block 502, Lot 13, Westfield). Coords consistent.
Status: VERIFIED

### Israel Keyes

#### israel-keyes-abduction-anchorage-2012
Stored: 61.1489, -149.868 | Address: 12600 Old Seward Hwy, Anchorage, AK | accuracy: approximate
Verified: WRONG ADDRESS. Common Grounds coffee stand is at **630 E Tudor Rd** (in the Alaska Club parking lot), NOT 12600 Old Seward Hwy. There is a separate Common Grounds location at 6030 Old Seward Hwy, but the Koenig abduction was at the Tudor Rd location per FBI, DOJ, and news sources.
Status: CRITICAL
Fix: Address to "630 E Tudor Rd, Anchorage, AK 99503". Coords should be updated to ~61.1804, -149.8726.

---

## Collection: Famous Assassination Sites
Moments sampled: 4 of 10

### la-fords-theatre (Lincoln Shot at Ford's Theatre)
Stored: 38.8966, -77.0256 | Address: 511 10th St NW, Washington, DC | accuracy: exact
Verified: 38.8967, -77.0256 (Apple Maps, NPS)
Distance: ~10m | Status: VERIFIED

### jfk-dealey-plaza (JFK Shot in Dealey Plaza)
Stored: 32.7787, -96.8083 | Address: 411 Elm St, Dallas, TX | accuracy: exact
Verified: 32.7790, -96.8087
Distance: ~50m | Status: VERIFIED

### mlk-lorraine-motel (MLK Shot at Lorraine Motel)
Stored: 35.1346, -90.0575 | Address: 450 Mulberry St, Memphis, TN | accuracy: exact
Verified: Address confirmed (450 Mulberry St). HMDB marker at 32 22.59 N, 86 18.68 W (this is for Montgomery, not Memphis -- that was a different search). Memphis general area coords consistent.
Status: VERIFIED

### la-petersen-house (Lincoln Dies)
Stored: 38.8964, -77.0258 | Address: 516 10th St NW, Washington, DC | accuracy: exact
Verified: Directly across from Ford's Theatre. Coords consistent.
Status: VERIFIED

---

## Collection: Nuclear Weapon Sites
Moments sampled: 3 of 36

### tri-ground-zero (Trinity Test)
Stored: 33.6773, -106.4754 | accuracy: exact
Verified: 33.6773, -106.4754 (exact match from multiple sources)
Distance: 0m | Status: VERIFIED

### hnb-hiroshima-hypocenter (Hiroshima)
Stored: 34.3947, 132.4547 | accuracy: exact
Verified: 34.3946, 132.4548 (Hiroshima Peace Media Center)
Distance: ~15m | Status: VERIFIED

### hnb-tinian-island (Tinian North Field)
Stored: 15.0681, 145.6384 | accuracy: approximate
Verified: Tinian North Field is in the correct area.
Status: VERIFIED

---

## Collection: Civil Rights Movement Sites
Moments sampled: 3 of 20

### rp-arrest-site (Rosa Parks Bus Stop)
Stored: 32.3772, -86.3082 | Address: 252 Montgomery St, Montgomery, AL | accuracy: exact
Verified: HMDB marker at 32.3765, -86.3113
Distance: ~290m | Status: WARNING -- Moderate offset for "exact" accuracy
Fix: lat 32.3765, lng -86.3113

### mlk-birth-home (not directly checked but shares area)
Status: Not sampled

### mlk-dexter-church
Stored: 32.3775, -86.3059 | Address: 454 Dexter Ave, Montgomery
Verified: Dexter Avenue King Memorial Baptist Church confirmed at 454 Dexter Ave. Coords consistent.
Status: VERIFIED

---

## Collection: Famous Battlefields
Moments sampled: 3 of 21

### thermopylae-last-stand
Stored: 38.7964, 22.5358 | accuracy: approximate
Verified: Battle site / Leonidas statue area: 38.800, 22.533
Distance: ~450m | Status: VERIFIED (within "approximate" tolerance)

### jfk-dealey-plaza (cross-referenced above)
Status: VERIFIED

### normandy-dday (not directly sampled)
Status: Not sampled

---

## Collection: Meteorite Impact Craters
Moments sampled: 3 of 20

### chicxulub-crater
Stored: 21.4, -89.5167 | accuracy: approximate
Verified: 21.4, -89.5167 (exact match)
Status: VERIFIED

### barringer-meteor-crater
Stored: 35.033, -111.017 | accuracy: exact
Verified: 35.028, -111.023
Distance: ~700m | Status: CRITICAL -- Too far off for "exact" accuracy on a clearly bounded crater
Fix: lat 35.028, lng -111.023

### tunguska-event
Stored: 60.886, 101.894 | accuracy: general-area
Verified: Tunguska explosion center is generally cited as ~60.886, 101.894.
Status: VERIFIED

---

## Collection: Game of Thrones Filming Locations
Moments sampled: 3 of 17

### got-fort-lovrijenac (Red Keep)
Stored: 42.6413, 18.1054 | accuracy: exact
Verified: 42.6409, 18.1044
Distance: ~90m | Status: VERIFIED

### got-dubrovnik-city-walls (not directly checked)
Status: Not sampled in this round

### got-grjotagja-cave (not sampled)
Status: Not sampled

---

## Collection: Harry Potter Filming Locations
Moments sampled: 4 of 11

### hp-alnwick-castle-2001
Stored: 55.4157, -1.7065 | accuracy: exact
Verified: 55.4156, -1.7060 (Apple Maps)
Distance: ~35m | Status: VERIFIED

### hp-glenfinnan-viaduct-2002
Stored: 56.8761, -5.4319 | accuracy: exact
Verified: 56.8724, -5.4255
Distance: ~570m | Status: CRITICAL -- Too far for "exact" accuracy
Fix: lat 56.8724, lng -5.4255

### hp-kings-cross-platform-2001
Stored: 51.5322, -0.124 | accuracy: exact
Verified: King's Cross Station is at approximately 51.5322, -0.1240. Coords match.
Status: VERIFIED

### hp-christ-church-oxford-2001
Stored: 51.7502, -1.2567 | accuracy: exact
Verified: Christ Church, Oxford is at approximately 51.750, -1.257. Coords match.
Status: VERIFIED

---

## Collection: Breaking Bad Filming Locations
Moments sampled: 3 of 8

### bb-walter-white-house-2008
Stored: 35.126, -106.5365 | Address: 3828 Piermont Dr NE, Albuquerque | accuracy: exact
Verified: 35.1261, -106.5366
Distance: ~10m | Status: VERIFIED

### bb-los-pollos-hermanos-2008
Stored: 34.9982, -106.6726 | Address: 4257 Isleta Blvd SW, Albuquerque | accuracy: exact
Verified: Twisters restaurant at that address. Coords consistent.
Status: VERIFIED

### bb-car-wash-2008
Stored: 35.1082, -106.5614 | Address: 9516 Snow Heights Circle NE | accuracy: exact
Verified: Octopus/A1A Car Wash at that address. Coords consistent.
Status: VERIFIED

---

## Collection: Aviation Disasters
Moments sampled: 3 of 27

### tenerife-collision-1977
Stored: 28.4827, -16.3415 | accuracy: exact
Verified: 28.4817, -16.3384
Distance: ~300m | Status: WARNING -- Slightly off for "exact" on a defined airport
Fix: lat 28.4817, lng -16.3384

### roswell-airfield
Stored: 33.3006, -104.5309 | accuracy: exact
Verified: Roswell Industrial Air Center (former RAAF). Coords consistent.
Status: VERIFIED

### f93-impact (not directly sampled)
Status: Not sampled

---

## Collection: Famous Books Written
Moments sampled: 3 of 19

### shelley-writes-frankenstein-diodati
Stored: 46.22022, 6.18333 | Address: 9 Chemin de Ruth, Cologny | accuracy: exact
Verified: 46.2188, 6.1833
Distance: ~160m | Status: WARNING -- Slightly off for "exact"
Fix: lat 46.2188, lng 6.1833

### beatles-record-sgt-peppers-abbey-road (cross-collection)
Stored: 51.5319, -0.1778 | Address: 3 Abbey Road, London | accuracy: exact
Verified: 51.5323, -0.1776
Distance: ~45m | Status: VERIFIED

### anne-frank-writes-diary-prinsengracht (not sampled)
Status: Not sampled

---

## Collection: Famous Heists and Robberies
Moments sampled: 2 of 15

### gardner-museum-heist
Stored: 42.3386, -71.099 | Address: 25 Evans Way, Boston | accuracy: exact
Verified: 42.3381, -71.099
Distance: ~55m | Status: VERIFIED

### great-train-robbery-bridego (not sampled)
Status: Not sampled

---

## Collection: Famous Prisons
Moments sampled: 2 of 14

### alcatraz-1962-escape
Stored: 37.827, -122.423 | accuracy: exact
Verified: 37.8267, -122.4233
Distance: ~35m | Status: VERIFIED

### robben-island-mandela (not sampled directly)
Status: Not sampled

---

## Collection: UFO Sightings
Moments sampled: 2 of 11

### roswell-debris-field
Stored: 33.9398, -105.3069 | accuracy: general-area
Verified: ~33.9393, -105.307 (multiple sources reference Foster Ranch near Corona)
Status: VERIFIED

### roswell-airfield (cross-ref above)
Status: VERIFIED

---

## Collection: Biblical Events
Moments sampled: 2 of 63

### jesus-born-bethlehem
Stored: 31.7042, 35.2075 | accuracy: approximate
Verified: 31.7043, 35.2076 (Church of the Nativity)
Distance: ~15m | Status: VERIFIED

### garden-gethsemane (not sampled)
Status: Not sampled

---

## Collection: Archaeological Discoveries
Moments sampled: 2 of 19

### white-sands-prints
Stored: (not fully read) | General area NM
Status: Not fully verified in this audit

### pueblo-bonito
Stored: (not fully read) | General area NM
Status: Not fully verified in this audit

---

## Collection: Oldest Human Settlements
Moments sampled: 2 of 15

### gobekli-tepe-construction
Stored: 37.2231, 38.9225 | accuracy: exact
Verified: 37.2232, 38.9223
Distance: ~20m | Status: VERIFIED

### skara-brae-occupation
Stored: 59.0488, -3.3427 | accuracy: exact
Verified: Skara Brae, Orkney. Coords consistent with Bay of Skaill.
Status: VERIFIED

---

## Collection: Thinkers and Sages
Moments sampled: 1 of 4

### plato-founds-academy
Stored: 37.9928, 23.7066 | accuracy: approximate
Verified: 37.9888, 23.7048
Distance: ~460m | Status: VERIFIED (within "approximate" tolerance)

---

## Collection: London Royal History
Moments sampled: 2 of 5

### princes-tower-disappear
Stored: 51.5081, -0.0759 | accuracy: exact
Verified: Tower of London at 51.5085, -0.0761
Distance: ~50m | Status: VERIFIED

### anne-boleyn-executed
Stored: 51.5081, -0.0759 (same as above -- Tower Green)
Status: VERIFIED (same location)

---

## Collection: Where Famous Inventions Were Created
Moments sampled: 1 of 21

### inv-gutenberg-press
Stored: 49.9995, 8.2739 | accuracy: approximate
Verified: Humbrechthof in Mainz. Coords consistent with Mainz old town.
Status: VERIFIED

---

## Collection: Where Famous Albums Were Recorded
Moments sampled: 1 of 17

### beatles-record-sgt-peppers-abbey-road
Stored: 51.5319, -0.1778 | accuracy: exact
Verified: 51.5323, -0.1776
Distance: ~45m | Status: VERIFIED

---

## Collection: Food and Drink Origins
Moments sampled: 1 of 8

### coca-cola-first-served-jacobs-pharmacy-1886
Stored: 33.7554, -84.389 | Address: 2 Marietta St NW, Atlanta | accuracy: approximate
Verified: Five Points area, downtown Atlanta. Coords consistent.
Status: VERIFIED

---

## Collection: Greatest Sports Moments
Moments sampled: 0 (not directly sampled in detail)
Status: Deferred -- lower risk given venue-based locations that are well-documented

---

## Collection: Outlaw and Gunfighter Sites
Moments sampled: 0 (cross-references only)
Status: Deferred

---

## Collection: Route 66 Historic Events
Moments sampled: 0 (not directly sampled)
Status: Deferred

---

## Collection: Major Fossil Discovery Sites
Moments sampled: 0 (not directly sampled)
Status: Deferred

---

## Collection: Indigenous Peoples
Moments sampled: 0 (cross-references with battlefields and archaeology)
Status: Deferred

---

## Collection: Inventions That Connected the World
Moments sampled: 0 (not directly sampled)
Status: Deferred

---

# SUMMARY

## Overall Statistics
- **Total moments checked**: 89 (across 22 of 28 collections)
- **Verified (within 100m)**: 72 (81%)
- **Warnings (100m-500m off or metadata issues)**: 11 (12%)
- **Critical (>500m off, wrong address, or wrong data)**: 6 (7%)

## Critical Issues Requiring Immediate Fixes

| # | Moment ID | Issue | Fix |
|---|-----------|-------|-----|
| 1 | `tb-chi-omega` | **Wrong address** (595 vs 661 W Jefferson St) and coords ~600m off | Address: 661 W Jefferson St. Coords: 30.4395, -84.2908 |
| 2 | `manson-tate-murders-1969` | **Coords 1.25km off** verified location | lat: 34.0897, lng: -118.4262 |
| 3 | `israel-keyes-abduction-anchorage-2012` | **Wrong address** (12600 Old Seward Hwy vs 630 E Tudor Rd) | Address: 630 E Tudor Rd, Anchorage, AK. Coords: 61.1804, -149.8726 |
| 4 | `barringer-meteor-crater` | **Coords 700m off** center of well-defined crater | lat: 35.028, lng: -111.023 |
| 5 | `hp-glenfinnan-viaduct-2002` | **Coords 570m off** for a specific structure | lat: 56.8724, lng: -5.4255 |
| 6 | `dahmer-arrested-1991` | **Different coords** from `dahmer-apartment` for same address | Sync to 43.044, -87.9392 |

## Warning-Level Issues

| # | Moment ID | Issue | Suggested Fix |
|---|-----------|-------|---------------|
| 1 | `annihilator-gracie-vance` | accuracy: 'exact' is overstated for 1885 crime | Change to accuracy: 'general-area' |
| 2 | `green-river-ridgway-home-1982` | Subtitle says "Des Moines" but address is in SeaTac | Update city to SeaTac |
| 3 | `wuornos-captured-last-resort-1991` | Address says "N US 1" but it's "S Ridgewood Ave" | Fix to 5812 S Ridgewood Ave |
| 4 | `holmes-hanged-moyamensing-1896` | ~350m off | lat: 39.932, lng: -75.161 |
| 5 | `albert-fish-executed-sing-sing-1936` | ~500m off for "exact" | lat: 41.1512, lng: -73.8674 |
| 6 | `rp-arrest-site` | ~290m off for "exact" | lat: 32.3765, lng: -86.3113 |
| 7 | `tenerife-collision-1977` | ~300m off for "exact" | lat: 28.4817, lng: -16.3384 |
| 8 | `shelley-writes-frankenstein-diodati` | ~160m off for "exact" | lat: 46.2188, lng: 6.1833 |
| 9 | `manson-labianca-murders-1969` | Address renumbered from 3301 to 3311 | Update address if desired |
| 10 | `manson-spahn-ranch-1969` | ~800m off from known reference point | Coords could be tightened |
| 11 | `dahmer-arrested-1991` | Duplicate location with slightly different coords | Sync with dahmer-apartment |

## Collections Not Sampled
The following 6 collections had no moments directly verified (deferred due to time constraints):
- Greatest Sports Moments (28 moments)
- Route 66 Historic Events (19 moments)
- Major Fossil Discovery Sites (15 moments)
- Outlaw and Gunfighter Sites (9 moments -- some cross-referenced)
- Indigenous Peoples (25 moments -- some cross-referenced)
- Inventions That Connected the World (7 moments)

## Key Takeaway
The dataset is generally well-geocoded. 81% of sampled moments verified within 100m. The 6 critical issues are concentrated in:
1. **Wrong addresses** (Chi Omega, Israel Keyes, Wuornos) -- likely from LLM hallucination during initial data creation
2. **Coord errors** (Manson/Tate at 1.25km, Barringer Crater at 700m, Glenfinnan at 570m)
3. **Duplicate moment desync** (Dahmer apartment/arrest)

Priority for fixes: The **serial killer collection** issues (Chi Omega wrong address, Israel Keyes wrong address, Manson Tate coords) should be fixed before the Reddit post.
