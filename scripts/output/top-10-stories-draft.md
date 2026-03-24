# Top 10 Missing Stories — Draft Content

> **Status**: DRAFT for review. Do not ingest.
> **Generated**: 2026-03-22
> **Content guide**: scripts/ingest/lib/content-guide-v3.md (v3)

---

## Story 1: The Sinking of the Titanic

### Story Object

```ts
{
  id: 'sinking-of-the-titanic',
  name: 'The Sinking of the Titanic',
  category: 'dark-history',
  storyType: 'incident',
  description: 'A brand-new "unsinkable" liner hits an iceberg on her maiden voyage and takes 1,517 people to the bottom of the North Atlantic. From the Belfast shipyard to the ocean floor, traced across five countries and 12,500 feet of seawater.',
  years: '1909–1912',
  wikipediaSlug: 'Sinking_of_the_Titanic',
}
```

### Moments

#### 1. Titanic's Keel Is Laid at the Harland and Wolff Shipyard

```ts
{
  id: 'titanic-keel-laid-1909',
  name: "Titanic's Keel Is Laid at the Harland and Wolff Shipyard",
  subtitle: "Queen's Island, Belfast. The Harland and Wolff cranes Samson and Goliath still dominate the skyline. Titanic Quarter is now a museum district",
  description: "On 31 March 1909, workers begin laying Titanic's keel in Slip No. 3 of the Harland and Wolff shipyard here on Queen's Island, Belfast. The ship will take 26 months and 15,000 workers to build. Eight workers die during construction. The massive steel gantry that held the hull — the Arrol Gantry — is long gone, but the slipway where Titanic took shape is marked in the ground outside the Titanic Belfast museum, its outline still visible at full scale.",
  lat: 54.6079,
  lng: -5.9099,
  type: 'industrial_site',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 1909,
  address: "Queen's Road, Titanic Quarter, Belfast BT3 9DT, Northern Ireland",
  entityIds: ['harland-and-wolff', 'rms-titanic'],
}
```

#### 2. Titanic Departs Southampton on Her Maiden Voyage

```ts
{
  id: 'titanic-departs-southampton-1912',
  name: 'Titanic Departs Southampton on Her Maiden Voyage',
  subtitle: 'Berth 44, Southampton Docks. The dock is now a car park, but a memorial stands in Andrews Park nearby',
  description: "At noon on 10 April 1912, Titanic pulls away from Berth 44 here at Southampton's White Star Dock with 922 passengers and 885 crew aboard. Her wake is so powerful it snaps the mooring lines of the nearby SS New York, nearly causing a collision before she even reaches open water. Of the crew, 724 are from Southampton. Five days later, 549 of them will be dead — gutting entire streets of this port city.",
  lat: 50.8958,
  lng: -1.4057,
  type: 'historical_site',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1912,
  address: 'Berth 44, Eastern Docks, Southampton SO14, England',
  entityIds: ['rms-titanic'],
}
```

#### 3. Titanic Makes Her Final Port Call at Queenstown

```ts
{
  id: 'titanic-queenstown-1912',
  name: 'Titanic Makes Her Final Port Call at Queenstown',
  subtitle: 'Cobh (formerly Queenstown), County Cork. The Titanic Experience museum is in the original White Star ticket office on the waterfront',
  description: "On 11 April 1912, Titanic anchors in Cork Harbour here at Queenstown — too large to dock, she receives passengers by tender. 123 third-class passengers board, most of them Irish emigrants. Seven passengers disembark, among the last people to leave Titanic alive. The White Star Line's original ticket office on the Cobh waterfront now houses a museum where visitors can look up the fates of the 123 who boarded here. Only 44 survived.",
  lat: 51.8503,
  lng: -8.2943,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1912,
  address: 'Casement Square, Cobh, County Cork, Ireland',
  entityIds: ['rms-titanic'],
}
```

#### 4. Lookout Frederick Fleet Spots an Iceberg Dead Ahead

```ts
{
  id: 'titanic-iceberg-spotted-1912',
  name: 'Lookout Frederick Fleet Spots an Iceberg Dead Ahead',
  subtitle: "North Atlantic, approximately 41.7\u00b0N 49.9\u00b0W. Open ocean \u2014 no marker, no memorial, just dark water 2.3 miles deep",
  description: "At 11:40 PM on 14 April 1912, lookout Frederick Fleet rings the crow's nest bell three times and telephones the bridge: \"Iceberg, right ahead.\" First Officer Murdoch orders hard-a-starboard. The ship turns, but the iceberg rakes 300 feet along the starboard hull below the waterline, buckling plates and popping rivets across six watertight compartments. Titanic is designed to float with four flooded. She has 2 hours and 40 minutes left.",
  lat: 41.7264,
  lng: -49.9478,
  type: 'disaster',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1912,
  address: 'North Atlantic Ocean, approx. 41.73\u00b0N 49.95\u00b0W',
  entityIds: ['rms-titanic', 'frederick-fleet'],
}
```

#### 5. The Band Plays as Titanic's Stern Rises Out of the Water

```ts
{
  id: 'titanic-sinks-1912',
  name: "Titanic Breaks Apart and Sinks in the North Atlantic",
  subtitle: "Wreck site: 41\u00b044'N, 49\u00b056'W. The bow and stern lie 600 meters apart on the ocean floor at 12,500 feet",
  description: "At 2:20 AM on 15 April 1912, Titanic's stern rises vertically, the hull snaps between the third and fourth funnels, and both halves plunge to the ocean floor here, 12,500 feet below the surface. Of the 2,208 people aboard, 1,517 die in 28\u00b0F water. Only 710 are pulled into lifeboats. The ship carried enough boats for 1,178 people, barely half those aboard. The wreck lay undiscovered on the seabed until Robert Ballard found it in 1985.",
  lat: 41.7325,
  lng: -49.9469,
  type: 'disaster',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1912,
  address: 'North Atlantic Ocean, approx. 41\u00b044\'N 49\u00b056\'W',
  entityIds: ['rms-titanic'],
}
```

#### 6. Carpathia Rescues 710 Survivors at Dawn

```ts
{
  id: 'titanic-carpathia-rescue-1912',
  name: 'Carpathia Rescues 710 Titanic Survivors at Dawn',
  subtitle: "North Atlantic, near the sinking site. Open ocean \u2014 Carpathia arrived 1.5 hours after Titanic went down",
  description: "At 4:10 AM on 15 April 1912, RMS Carpathia reaches the lifeboats here after racing 58 miles through ice fields at maximum speed. Captain Arthur Rostron had ordered every available space converted for survivors, hot drinks prepared, and doctors stationed at each gangway. Over the next four hours, 710 survivors are pulled aboard. The sea is littered with debris and empty life jackets. Carpathia turns for New York with the survivors and 13 of Titanic's lifeboats lashed to her deck.",
  lat: 41.7300,
  lng: -49.9500,
  type: 'disaster',
  importance: 'minor',
  accuracy: 'general-area',
  kind: 'event',
  year: 1912,
  address: 'North Atlantic Ocean, near 41\u00b044\'N 49\u00b056\'W',
  entityIds: ['rms-titanic'],
}
```

#### 7. Titanic Survivors Arrive at Pier 54 in New York

```ts
{
  id: 'titanic-survivors-new-york-1912',
  name: 'Titanic Survivors Arrive at Pier 54 in New York',
  subtitle: 'Pier 54, West 13th St and the Hudson River, Manhattan. The rusted pier arch still reads "Cunard White Star." Now part of Little Island park',
  description: "On the rainy evening of 18 April 1912, Carpathia docks at Pier 54 here on Manhattan's West Side with 710 Titanic survivors. Thirty thousand people crowd the waterfront. Flashbulbs from press cameras light up the pier as dazed passengers descend the gangway. The original pier arch — still bearing the faded words \"Cunard White Star\" — survived until Little Island park was built over the pier pilings in 2021.",
  lat: 40.7411,
  lng: -74.0096,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 1912,
  address: 'Pier 54, West 13th Street at the Hudson River, New York, NY 10014',
  entityIds: ['rms-titanic'],
}
```

### New Entities

```ts
{
  id: 'rms-titanic',
  name: 'RMS Titanic',
  type: 'work',  // vessel
  years: '1909–1912',
  description: "The \"unsinkable\" ocean liner that sank on her maiden voyage. Built in Belfast, launched in 1911, Titanic was the largest moving object ever made. She carried 2,208 people and enough lifeboats for barely half. Her wreck sits upright on the ocean floor at 12,500 feet, slowly dissolving.",
  wikipediaSlug: 'Titanic',
}
```

```ts
{
  id: 'harland-and-wolff',
  name: 'Harland and Wolff',
  type: 'organization',
  years: '1861–present',
  description: "The Belfast shipyard that built Titanic, Olympic, and Britannic. Founded in 1861, Harland and Wolff employed 35,000 workers at its peak and dominated Queen's Island with massive gantries. The yard's twin cranes Samson and Goliath remain Belfast's most recognizable landmarks.",
  wikipediaSlug: 'Harland_and_Wolff',
}
```

```ts
{
  id: 'frederick-fleet',
  name: 'Frederick Fleet',
  type: 'person',
  years: '1887–1965',
  description: "The lookout who spotted the iceberg that sank Titanic. Fleet rang the bell three times and phoned the bridge, but without binoculars — locked in a cabinet whose key was left ashore — he saw it too late. He survived the sinking and later hanged himself at 77.",
  wikipediaSlug: 'Frederick_Fleet',
}
```

---

## Story 2: The Eruption of Mount Vesuvius (79 AD)

### Story Object

```ts
{
  id: 'eruption-of-mount-vesuvius-79-ad',
  name: 'Eruption of Mount Vesuvius in 79 AD',
  category: 'dark-history',
  storyType: 'incident',
  description: "A volcano buries two Roman cities under 20 feet of ash and pumice, killing thousands and preserving their final moments for 1,700 years. Pliny the Elder sails toward the eruption to rescue survivors and dies on the beach at Stabiae.",
  years: '79',
  wikipediaSlug: 'Eruption_of_Mount_Vesuvius_in_79_AD',
}
```

### Moments

#### 1. Mount Vesuvius Erupts and Sends a Column of Ash 21 Miles into the Sky

```ts
{
  id: 'vesuvius-erupts-79',
  name: 'Mount Vesuvius Erupts and Sends a Column of Ash 21 Miles into the Sky',
  subtitle: 'Summit of Vesuvius, Naples. The crater rim is accessible by foot trail from 1,000m. The cone formed inside the original caldera',
  description: "Around midday on 24 August 79 AD, Vesuvius detonates here with a thermal energy 100,000 times greater than the Hiroshima bomb. A column of pumice and volcanic gas rises 33 kilometers into the sky — visible from Rome, 250 km away. The eruption will last 18 hours and release 1.5 cubic miles of rock. Pliny the Younger, watching from Misenum across the bay, describes the cloud as shaped like a pine tree. The volcano had been dormant so long that no Latin word for volcano existed.",
  lat: 40.8210,
  lng: 14.4260,
  type: 'disaster',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 79,
  address: 'Summit of Mount Vesuvius, Metropolitan City of Naples, Italy',
  entityIds: ['mount-vesuvius', 'pliny-the-younger'],
}
```

#### 2. Pompeii Is Buried Under 20 Feet of Volcanic Ash and Pumice

```ts
{
  id: 'pompeii-buried-79',
  name: 'Pompeii Is Buried Under 20 Feet of Volcanic Ash and Pumice',
  subtitle: 'Via Villa dei Misteri 2, Pompeii. The excavated city covers 170 acres and is open daily. About a third remains unexcavated',
  description: "By morning on 25 August 79 AD, six surges of superheated gas and rock — pyroclastic flows traveling at 450 mph and reaching 500\u00b0C — sweep down Vesuvius and bury Pompeii here under 4 to 6 meters of ash and pumice. Of the city's estimated 11,000 residents, roughly 2,000 die — many of those who stayed behind. Their bodies decompose inside ash cocoons, leaving voids that archaeologists later fill with plaster to create haunting casts of people frozen in their final positions.",
  lat: 40.7508,
  lng: 14.4869,
  type: 'archaeological_site',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 79,
  address: 'Via Villa dei Misteri 2, 80045 Pompei NA, Italy',
  entityIds: ['mount-vesuvius'],
}
```

#### 3. Herculaneum Is Sealed Under 60 Feet of Volcanic Mud

```ts
{
  id: 'herculaneum-buried-79',
  name: 'Herculaneum Is Sealed Under 60 Feet of Volcanic Mud',
  subtitle: 'Corso Resina 187, Ercolano. The site sits 20 meters below modern street level. The ancient beachfront boat chambers are open to visitors',
  description: "Around 1 AM on 25 August 79, the first pyroclastic surge hits the wealthy seaside town of Herculaneum here, 7 km west of Vesuvius. Superheated gas at 500\u00b0C kills everyone instantly — hundreds of skeletons were discovered in 1982 huddled in the boat chambers along the ancient waterfront, where they had gathered hoping to escape by sea. The volcanic material solidified into stone, preserving organic material that disintegrated at Pompeii: wooden furniture, food, and even a library of carbonized papyrus scrolls.",
  lat: 40.8062,
  lng: 14.3476,
  type: 'archaeological_site',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 79,
  address: 'Corso Resina 187, 80056 Ercolano NA, Italy',
  entityIds: ['mount-vesuvius'],
}
```

#### 4. Pliny the Elder Sails Toward Vesuvius and Dies at Stabiae

```ts
{
  id: 'pliny-elder-dies-stabiae-79',
  name: 'Pliny the Elder Sails Toward Vesuvius and Dies at Stabiae',
  subtitle: 'Castellammare di Stabia, on the Bay of Naples. The ancient Villa of San Marco and Villa Arianna are open to visitors',
  description: "On the afternoon of 24 August 79, Pliny the Elder — 56-year-old admiral of the Roman fleet at Misenum and author of the 37-volume Natural History — orders his galleys toward the eruption to rescue stranded civilians along the coast. He lands here at Stabiae, 16 km south of Vesuvius, at the villa of his friend Pomponianus. The next morning, overcome by volcanic gases on the beach as his party flees, Pliny collapses and dies. His nephew's eyewitness account gives the eruption type its scientific name: Plinian.",
  lat: 40.6942,
  lng: 14.4822,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 79,
  address: 'Castellammare di Stabia, Metropolitan City of Naples, Italy',
  entityIds: ['pliny-the-elder', 'mount-vesuvius'],
}
```

#### 5. Pliny the Younger Watches the Eruption from Misenum Across the Bay

```ts
{
  id: 'pliny-younger-misenum-79',
  name: 'Pliny the Younger Watches the Eruption from Misenum Across the Bay',
  subtitle: 'Bacoli (ancient Misenum), west side of the Bay of Naples. Ruins of the Roman naval base are scattered through the modern town',
  description: "From the Roman naval base here at Misenum, 35 km across the Bay of Naples, 17-year-old Pliny the Younger watches his uncle sail toward the eruption and never return. He later writes two letters to the historian Tacitus describing the pine-shaped cloud, the falling pumice, the earthquakes, and the darkness that engulfed the coast. These letters — the only surviving eyewitness account — became the foundation of modern volcanology and gave the Plinian eruption type its name.",
  lat: 40.7862,
  lng: 14.0845,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 79,
  address: 'Bacoli (ancient Misenum), Metropolitan City of Naples, Italy',
  entityIds: ['pliny-the-younger'],
}
```

#### 6. Workers Digging a Water Channel Rediscover Pompeii

```ts
{
  id: 'pompeii-rediscovered-1748',
  name: 'Workers Digging a Water Channel Rediscover Pompeii',
  subtitle: 'Via Villa dei Misteri 2, Pompeii. The first systematic excavations began here near the amphitheatre',
  description: "In 1748, Spanish military engineer Roque Joaquin de Alcubierre begins systematic excavations here at Pompeii under orders from King Charles III of Naples. Workers had stumbled across walls and frescoes while digging an irrigation channel. The excavation reveals streets, houses, and bodies frozen in ash exactly as they were 1,669 years earlier — loaves of bread still in ovens, election slogans painted on walls, and graffiti that reads \"I don't want to sell my husband.\"",
  lat: 40.7489,
  lng: 14.4848,
  type: 'discovery_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1748,
  address: 'Archaeological Park of Pompeii, 80045 Pompei NA, Italy',
  entityIds: ['mount-vesuvius'],
}
```

### New Entities

```ts
{
  id: 'mount-vesuvius',
  name: 'Mount Vesuvius',
  type: 'place',
  years: '',
  description: "Europe's most dangerous volcano, responsible for the most famous eruption in history. Vesuvius looms over Naples and the ruins of the cities it destroyed. It last erupted in 1944 and remains active. Three million people live in its shadow.",
  wikipediaSlug: 'Mount_Vesuvius',
}
```

```ts
{
  id: 'pliny-the-elder',
  name: 'Pliny the Elder',
  type: 'person',
  years: '23–79',
  description: "Roman admiral who sailed toward a volcano and died. Author of the 37-volume Natural History — the ancient world's encyclopedia — Pliny commanded the fleet at Misenum and launched a rescue mission during the eruption of Vesuvius. He collapsed from volcanic gas on the beach at Stabiae.",
  wikipediaSlug: 'Pliny_the_Elder',
}
```

```ts
{
  id: 'pliny-the-younger',
  name: 'Pliny the Younger',
  type: 'person',
  years: '61–c. 113',
  description: "The 17-year-old who wrote the only eyewitness account of Vesuvius's eruption. Pliny's two letters to Tacitus describing the 79 AD disaster gave volcanology its founding text and the word 'Plinian' its meaning. He later served as a Roman senator and governor of Bithynia.",
  wikipediaSlug: 'Pliny_the_Younger',
}
```

---

## Story 3: The Apollo 11 Moon Landing

### Story Object

```ts
{
  id: 'apollo-11',
  name: 'Apollo 11',
  category: 'discovery-science',
  storyType: 'incident',
  description: "Three astronauts fly 240,000 miles to the Moon, two of them walk on it, and all three come home alive. From the launch pad at Cape Canaveral to the quarantine trailer on the USS Hornet, the eight days that fulfilled Kennedy's deadline.",
  years: '1969',
  wikipediaSlug: 'Apollo_11',
}
```

### Moments

#### 1. Saturn V Launches Apollo 11 from Pad 39A at Kennedy Space Center

```ts
{
  id: 'apollo-11-launch-1969',
  name: 'Saturn V Launches Apollo 11 from Pad 39A at Kennedy Space Center',
  subtitle: 'Launch Complex 39A, Kennedy Space Center, Merritt Island, FL. The pad is now leased by SpaceX. A viewing gantry is open to visitors',
  description: "At 9:32 AM EDT on 16 July 1969, the 363-foot Saturn V rocket ignites here at Pad 39A, generating 7.6 million pounds of thrust — enough to shake press stands three miles away. One million spectators line the beaches and causeways of the Space Coast. The rocket clears the tower in 12 seconds. On board are Neil Armstrong, Buzz Aldrin, and Michael Collins. The launch vehicle is the most powerful machine ever flown, burning 15 tons of fuel per second.",
  lat: 28.6082,
  lng: -80.6041,
  type: 'landmark',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1969,
  address: 'Launch Complex 39A, Kennedy Space Center, FL 32899',
  entityIds: ['nasa', 'neil-armstrong', 'buzz-aldrin', 'michael-collins-astronaut'],
}
```

#### 2. Eagle Lands on the Moon at Tranquility Base

```ts
{
  id: 'apollo-11-moon-landing-1969',
  name: 'Eagle Lands on the Moon at Tranquility Base',
  subtitle: "Sea of Tranquility, the Moon. The landing site at 0.6744\u00b0N, 23.4731\u00b0E is designated a UNESCO-protected heritage site",
  description: "At 4:17 PM EDT on 20 July 1969, the lunar module Eagle touches down here in the Sea of Tranquility with fewer than 25 seconds of fuel remaining. Armstrong, who manually steered past a boulder field, radios Houston: \"The Eagle has landed.\" Mission Control erupts. An estimated 600 million people — one-fifth of Earth's population — are watching on television. The descent computer had thrown multiple alarms; 26-year-old guidance officer Steve Bales made the call to continue.",
  lat: 0.6744,
  lng: 23.4731,
  type: 'landmark',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1969,
  address: 'Tranquility Base, Sea of Tranquility, the Moon',
  entityIds: ['nasa', 'neil-armstrong', 'buzz-aldrin'],
}
```

#### 3. Neil Armstrong Takes the First Human Step on the Moon

```ts
{
  id: 'armstrong-first-step-1969',
  name: 'Neil Armstrong Takes the First Human Step on the Moon',
  subtitle: "Tranquility Base, the Moon. Armstrong's bootprint and the descent stage of Eagle remain undisturbed on the surface",
  description: "At 10:56 PM EDT on 20 July 1969, Armstrong steps off Eagle's ladder onto the lunar surface here and says: \"That's one small step for man, one giant leap for mankind.\" He and Aldrin spend 2 hours and 31 minutes outside, planting a flag, collecting 47.5 pounds of lunar samples, and deploying scientific instruments. Armstrong photographs Aldrin but no one photographs Armstrong — nearly every iconic image from the moonwalk is of Aldrin, reflected in his visor.",
  lat: 0.6744,
  lng: 23.4731,
  type: 'landmark',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1969,
  address: 'Tranquility Base, Sea of Tranquility, the Moon',
  entityIds: ['nasa', 'neil-armstrong', 'buzz-aldrin'],
}
```

#### 4. Mission Control Houston Guides Apollo 11 to the Moon and Back

```ts
{
  id: 'apollo-11-mission-control-1969',
  name: 'Mission Control Houston Guides Apollo 11 to the Moon and Back',
  subtitle: 'Building 30, Johnson Space Center, 2101 E NASA Pkwy, Houston. The restored 1960s Mission Control Room is open for tours',
  description: "From the Mission Operations Control Room here in Building 30 at the Manned Spacecraft Center, flight director Gene Kranz and his team of 30 controllers manage every phase of Apollo 11's 195-hour mission. When the landing computer throws alarm codes 1202 and 1201 during descent, guidance officer Steve Bales has seconds to decide: abort or continue. He calls \"Go.\" The room — with its original consoles, ashtrays, and coffee-stained carpet — was restored to its 1969 appearance in 2019.",
  lat: 29.5593,
  lng: -95.0893,
  type: 'historical_site',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1969,
  address: '2101 E NASA Parkway, Houston, TX 77058',
  entityIds: ['nasa'],
}
```

#### 5. Apollo 11 Splashes Down in the Pacific and the Crew Enters Quarantine

```ts
{
  id: 'apollo-11-splashdown-1969',
  name: 'Apollo 11 Splashes Down in the Pacific and the Crew Enters Quarantine',
  subtitle: 'North Pacific Ocean, 920 miles SW of Honolulu. USS Hornet picked up the capsule. The command module Columbia is at the National Air and Space Museum, DC',
  description: "At 12:50 PM EDT on 24 July 1969, the command module Columbia splashes down here in the Pacific Ocean, 13 miles from the recovery ship USS Hornet. President Nixon watches from the deck. The three astronauts are immediately sealed into a modified Airstream trailer for 21 days of quarantine — NASA feared unknown lunar pathogens. Armstrong, Aldrin, and Collins wave to Nixon through a glass window. No lunar microbes were ever found.",
  lat: 13.3190,
  lng: -169.1500,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'general-area',
  kind: 'event',
  year: 1969,
  address: 'North Pacific Ocean, approximately 13\u00b019\'N 169\u00b009\'W',
  entityIds: ['nasa', 'neil-armstrong', 'buzz-aldrin', 'michael-collins-astronaut'],
}
```

### New Entities

```ts
{
  id: 'neil-armstrong',
  name: 'Neil Armstrong',
  type: 'person',
  years: '1930–2012',
  description: "First human to walk on the Moon, and the quietest hero of the Space Age. A Korean War combat pilot and test pilot who flew the X-15 to the edge of space, Armstrong commanded Apollo 11 at 38. He gave almost no interviews afterward and lived on a farm in Ohio.",
  wikipediaSlug: 'Neil_Armstrong',
}
```

```ts
{
  id: 'buzz-aldrin',
  name: 'Buzz Aldrin',
  type: 'person',
  years: '1930–present',
  description: "Second human to walk on the Moon and the first to take Communion there. An MIT-educated fighter pilot who flew 66 combat missions in Korea, Aldrin followed Armstrong down Eagle's ladder and later struggled publicly with depression and alcoholism. He punched a conspiracy theorist on camera at 72.",
  wikipediaSlug: 'Buzz_Aldrin',
}
```

```ts
{
  id: 'michael-collins-astronaut',
  name: 'Michael Collins',
  type: 'person',
  years: '1930–2021',
  description: "The loneliest man in history — he orbited the Moon alone while Armstrong and Aldrin walked on it. Collins piloted the command module Columbia for 21.5 hours of solo flight, out of radio contact with Earth for 48 minutes per orbit. He never walked on the Moon and said he never minded.",
  wikipediaSlug: 'Michael_Collins_(astronaut)',
}
```

---

## Story 4: The Chernobyl Disaster

### Story Object

```ts
{
  id: 'chernobyl-disaster',
  name: 'Chernobyl Disaster',
  category: 'dark-history',
  storyType: 'incident',
  description: "A botched safety test blows the lid off Reactor No. 4 and spreads radioactive fallout across Europe. The Soviet government evacuates 350,000 people and entombs the reactor in concrete. The ghost city of Pripyat remains frozen in 1986.",
  years: '1986',
  wikipediaSlug: 'Chernobyl_disaster',
}
```

### Moments

#### 1. Reactor No. 4 Explodes During a Safety Test at Chernobyl

```ts
{
  id: 'chernobyl-reactor-4-explosion-1986',
  name: 'Reactor No. 4 Explodes During a Safety Test at Chernobyl',
  subtitle: 'Chernobyl Nuclear Power Plant, Pripyat, Ukraine. Reactor 4 is now sealed inside the New Safe Confinement arch, completed in 2016',
  description: "At 1:23 AM on 26 April 1986, operators conducting a turbine coast-down test here at Reactor No. 4 trigger a power surge that causes two explosions, blowing the 1,000-ton reactor lid into the air and exposing the core. The graphite moderator catches fire and burns for 10 days, sending 400 times more radioactive material into the atmosphere than the Hiroshima bomb. The explosion kills two workers instantly. Firefighters arrive within minutes, unaware the debris is lethally radioactive.",
  lat: 51.3893,
  lng: 30.0992,
  type: 'disaster',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1986,
  address: 'Chernobyl Nuclear Power Plant, Pripyat, Kyiv Oblast, Ukraine',
  entityIds: ['chernobyl-npp'],
}
```

#### 2. Firefighters Battle the Reactor Fire Without Knowing the Radiation Levels

```ts
{
  id: 'chernobyl-firefighters-1986',
  name: 'Firefighters Battle the Reactor Fire Without Knowing the Radiation Levels',
  subtitle: 'Chernobyl NPP, at the base of Reactor 4 and on the roof of Reactor 3. A memorial to the firefighters stands near the plant entrance',
  description: "Within minutes of the explosion, 28 firefighters from Pripyat Station No. 2 arrive here at the burning reactor. Lieutenant Vasily Ignatenko and his crew climb to the roof of the adjacent Reactor 3 building to prevent the fire from spreading to the other three reactors. Their dosimeters max out immediately. The men report a metallic taste and uncontrollable vomiting within hours. Of the first responders, 28 die of acute radiation syndrome within four months. Their uniforms remain in the basement of Pripyat Hospital, still too radioactive to touch.",
  lat: 51.3893,
  lng: 30.0985,
  type: 'disaster',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 1986,
  address: 'Chernobyl Nuclear Power Plant, Pripyat, Kyiv Oblast, Ukraine',
  entityIds: ['chernobyl-npp'],
}
```

#### 3. The Soviet Government Evacuates 49,000 People from Pripyat

```ts
{
  id: 'pripyat-evacuation-1986',
  name: 'The Soviet Government Evacuates 49,000 People from Pripyat in Three Hours',
  subtitle: "Pripyat city center, 3 km from Reactor 4. The ghost city is visitable via guided tour from the Chernobyl Exclusion Zone checkpoint",
  description: "At 2 PM on 27 April 1986 — 36 hours after the explosion — 1,200 buses line up here on the streets of Pripyat and evacuate the entire city of 49,000 in three hours and 20 minutes. Residents are told they will return in three days. They never do. Apartments are left with meals on tables, laundry on lines, toys on floors. Today the city stands exactly as it was abandoned — trees grow through buildings, a Ferris wheel in the amusement park never opened, and a swimming pool stayed in use for workers until 1998.",
  lat: 51.4045,
  lng: 30.0542,
  type: 'historical_site',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1986,
  address: 'Pripyat, Chernobyl Exclusion Zone, Kyiv Oblast, Ukraine',
  entityIds: ['chernobyl-npp'],
}
```

#### 4. Sweden Detects Chernobyl's Radiation and Forces Moscow to Admit the Disaster

```ts
{
  id: 'chernobyl-sweden-detection-1986',
  name: "Sweden Detects Chernobyl's Radiation and Forces Moscow to Admit the Disaster",
  subtitle: 'Forsmark Nuclear Power Plant, Östhammar, Sweden. The plant is 1,100 km from Chernobyl and still operational',
  description: "On the morning of 28 April 1986 — two days after the explosion — workers arriving at the Forsmark nuclear plant here in Sweden trigger radiation alarms. A check of their shoes reveals radioactive particles that did not come from Forsmark. Swedish authorities initially suspect a leak at their own plant before tracing the contamination to the Soviet Union via wind patterns. Confronted with evidence from 1,100 km away, Moscow issues a terse 14-word statement that evening acknowledging an accident at Chernobyl.",
  lat: 60.4082,
  lng: 18.1682,
  type: 'industrial_site',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 1986,
  address: 'Forsmark Nuclear Power Plant, 742 03 Östhammar, Sweden',
  entityIds: ['chernobyl-npp'],
}
```

#### 5. The Sarcophagus Is Built Over Reactor 4 by 600,000 Liquidators

```ts
{
  id: 'chernobyl-sarcophagus-1986',
  name: 'The Sarcophagus Is Built Over Reactor 4 by 600,000 Liquidators',
  subtitle: 'Reactor 4, Chernobyl NPP. The original concrete sarcophagus is now inside the New Safe Confinement, a 36,000-ton steel arch completed in 2016',
  description: "Between May and November 1986, an estimated 600,000 Soviet military reservists, miners, and construction workers — called liquidators — build a concrete and steel sarcophagus over the exposed reactor core here. Many work 90-second shifts on the roof, shoveling highly radioactive graphite debris by hand because robots fail in the radiation. The original sarcophagus began leaking within years. In 2016, a 36,000-ton stainless steel arch — the largest movable structure ever built — was slid over it on rails.",
  lat: 51.3893,
  lng: 30.0992,
  type: 'industrial_site',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 1986,
  address: 'Chernobyl Nuclear Power Plant, Pripyat, Kyiv Oblast, Ukraine',
  entityIds: ['chernobyl-npp'],
}
```

### New Entities

```ts
{
  id: 'chernobyl-npp',
  name: 'Chernobyl Nuclear Power Plant',
  type: 'place',
  years: '1977–2000',
  description: "Site of the worst nuclear disaster in history. Four RBMK reactors on the Pripyat River in northern Ukraine; Reactor 4 exploded on 26 April 1986. The last reactor shut down in 2000. The 30-km Exclusion Zone around the plant remains largely uninhabited.",
  wikipediaSlug: 'Chernobyl_Nuclear_Power_Plant',
}
```

---

## Story 5: The Fall of the Berlin Wall

### Story Object

```ts
{
  id: 'fall-of-the-berlin-wall',
  name: 'Fall of the Berlin Wall',
  category: 'political-drama',
  storyType: 'incident',
  description: "A confused press conference, a crowd at a border crossing, and a night of sledgehammers end 28 years of a wall that split a city, a nation, and a continent. From Checkpoint Charlie to the Brandenburg Gate, the night the Cold War ended.",
  years: '1961–1989',
  wikipediaSlug: 'Fall_of_the_Berlin_Wall',
}
```

### Moments

#### 1. East Germany Begins Building the Berlin Wall Overnight

```ts
{
  id: 'berlin-wall-construction-1961',
  name: 'East Germany Begins Building the Berlin Wall Overnight',
  subtitle: 'Bernauer Strasse, Berlin. The Berlin Wall Memorial spans the full length of the street with preserved wall segments and a documentation center',
  description: "In the early hours of 13 August 1961, East German soldiers and construction workers begin sealing the border between East and West Berlin here with barbed wire and concrete blocks. By morning, families on opposite sides of Bernauer Strasse are separated — some residents of the street's East-facing apartments escape by jumping from upper-floor windows into West Berlin below. Over the next months the barbed wire becomes a 155-km concrete wall, 3.6 meters high, with 302 watchtowers and a death strip patrolled by guards with shoot-to-kill orders.",
  lat: 52.5351,
  lng: 13.3901,
  type: 'political_event',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1961,
  address: 'Bernauer Strasse, 13355 Berlin, Germany',
  entityIds: [],
}
```

#### 2. Peter Fechter Is Shot and Bleeds to Death at the Wall as Crowds Watch

```ts
{
  id: 'peter-fechter-shot-1962',
  name: 'Peter Fechter Is Shot and Bleeds to Death at the Wall as Crowds Watch',
  subtitle: 'Corner of Zimmerstrasse and Charlottenstrasse, Berlin. A memorial cross and plaque mark the spot near Checkpoint Charlie',
  description: "On 17 August 1962, 18-year-old bricklayer Peter Fechter and a friend dash toward the wall here near Checkpoint Charlie. His friend clears the wall; Fechter is shot in the pelvis and falls back into the death strip on the East side. He lies in plain view, crying for help, for nearly an hour while East German guards watch and West Berlin police and American soldiers stand helpless on the other side. He bleeds to death. He is the 27th person killed at the Wall; at least 140 will follow.",
  lat: 52.5076,
  lng: 13.3908,
  type: 'crime_scene',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 1962,
  address: 'Zimmerstrasse / Charlottenstrasse, 10117 Berlin, Germany',
  entityIds: ['peter-fechter'],
}
```

#### 3. Reagan Delivers "Tear Down This Wall" Speech at the Brandenburg Gate

```ts
{
  id: 'reagan-tear-down-wall-1987',
  name: 'Reagan Delivers "Tear Down This Wall" Speech at the Brandenburg Gate',
  subtitle: 'Brandenburg Gate, Pariser Platz, Berlin. The gate is open and walkable. Reagan spoke from a platform on the West side',
  description: "On 12 June 1987, President Ronald Reagan stands here at the Brandenburg Gate with bulletproof glass panels flanking the podium and the Berlin Wall directly behind him. Addressing Soviet leader Mikhail Gorbachev, he delivers the line his own State Department tried to delete from the speech: \"Mr. Gorbachev, tear down this wall.\" The East German government pipes loud music over the Wall to drown him out. Two years and five months later, the wall is gone.",
  lat: 52.5163,
  lng: 13.3777,
  type: 'political_event',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1987,
  address: 'Pariser Platz, 10117 Berlin, Germany',
  entityIds: ['ronald-reagan'],
}
```

#### 4. A Confused Press Conference Opens the Berlin Wall by Accident

```ts
{
  id: 'schabowski-press-conference-1989',
  name: 'A Confused Press Conference Opens the Berlin Wall by Accident',
  subtitle: 'International Press Center, Mohrenstrasse 36, Berlin. The building is now a Marriott hotel',
  description: "At 6:53 PM on 9 November 1989, East German spokesman Gunter Schabowski reads a new travel regulation at a press conference here and — not fully briefed on the details — announces it takes effect \"immediately, without delay.\" He had been handed the note minutes before and not read it carefully. Within an hour, the announcement is broadcast worldwide. Thousands of East Berliners rush to border crossings, where bewildered guards, receiving no orders, eventually open the gates.",
  lat: 52.5112,
  lng: 13.3881,
  type: 'political_event',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1989,
  address: 'Mohrenstrasse 36, 10117 Berlin, Germany',
  entityIds: ['gunter-schabowski'],
}
```

#### 5. Thousands Storm the Bornholmer Strasse Crossing

```ts
{
  id: 'bornholmer-strasse-opens-1989',
  name: 'Thousands Storm the Bornholmer Strasse Crossing into West Berlin',
  subtitle: 'Bornholmer Strasse bridge, Berlin. A memorial and open-air exhibit mark the first crossing point. The bridge is a working road',
  description: "Around 11:30 PM on 9 November 1989, Lieutenant Colonel Harald Jager — the passport control officer here at Bornholmer Strasse — makes the decision to open the gate. Overwhelmed by a crowd of 20,000 pressing against the barriers and unable to reach superiors by phone, he orders the guards to stop stamping passports and simply let everyone through. It is the first crossing to open. Thousands pour across the bridge into West Berlin, many weeping, some sprinting, all disbelieving.",
  lat: 52.5556,
  lng: 13.3979,
  type: 'political_event',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1989,
  address: 'Bornholmer Strasse, 10439 Berlin, Germany',
  entityIds: [],
}
```

#### 6. Berliners Dance on the Wall at the Brandenburg Gate

```ts
{
  id: 'dancing-on-wall-brandenburg-1989',
  name: 'Berliners Dance on Top of the Wall at the Brandenburg Gate',
  subtitle: 'Brandenburg Gate, Pariser Platz, Berlin. The wall segment in front of the gate was among the last removed. No original wall remains here',
  description: "In the early hours of 10 November 1989, thousands of Berliners climb on top of the wall here at the Brandenburg Gate — the symbolic heart of the divided city — and dance, sing, and swing sledgehammers. The wall at this point is 3.6 meters high and a meter thick. Champagne is passed up from both sides. The images broadcast worldwide become the defining visual of the Cold War's end. The gate itself, closed since 1961, officially reopens on 22 December 1989.",
  lat: 52.5163,
  lng: 13.3777,
  type: 'political_event',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1989,
  address: 'Brandenburg Gate, Pariser Platz, 10117 Berlin, Germany',
  entityIds: [],
}
```

### New Entities

```ts
{
  id: 'peter-fechter',
  name: 'Peter Fechter',
  type: 'person',
  years: '1944–1962',
  description: "The teenager who bled to death at the Berlin Wall while the world watched. An 18-year-old East Berlin bricklayer, Fechter was shot trying to cross and lay dying in the death strip for nearly an hour. His death became a symbol of the Wall's brutality.",
  wikipediaSlug: 'Peter_Fechter',
}
```

```ts
{
  id: 'gunter-schabowski',
  name: 'Gunter Schabowski',
  type: 'person',
  years: '1929–2015',
  description: "The bureaucrat who accidentally opened the Berlin Wall. Poorly briefed on a new travel policy, Schabowski told reporters at a press conference that the border was open \"immediately, without delay.\" His fumbled answer triggered the end of the Cold War's most visible symbol.",
  wikipediaSlug: 'Günter_Schabowski',
}
```

---

## Story 6: The September 11 Attacks

### Story Object

```ts
{
  id: 'september-11-attacks',
  name: 'September 11 Attacks',
  category: 'dark-history',
  storyType: 'incident',
  description: "Four hijacked airliners, two towers, the Pentagon, and a field in Pennsylvania. 2,977 people die in 102 minutes on the morning that reshapes the 21st century. The footprints of the Twin Towers are now the largest man-made waterfalls in North America.",
  years: '2001',
  wikipediaSlug: 'September_11_attacks',
}
```

### Moments

#### 1. American Airlines Flight 11 Strikes the North Tower of the World Trade Center

```ts
{
  id: '911-north-tower-hit-2001',
  name: 'American Airlines Flight 11 Strikes the North Tower of the World Trade Center',
  subtitle: '1 World Trade Center (North Tower) footprint, now the North Pool of the 9/11 Memorial, 180 Greenwich St, Manhattan',
  description: "At 8:46 AM on 11 September 2001, American Airlines Flight 11 — a Boeing 767 carrying 92 people and 10,000 gallons of jet fuel — strikes the north face of the North Tower here between floors 93 and 99 at 466 mph. Everyone above the impact zone is trapped. The tower stands for 102 more minutes. Where it stood, a one-acre waterfall now cascades into a square void, the names of the 1,402 people who died in this building inscribed in bronze around its rim.",
  lat: 40.7116,
  lng: -74.0133,
  type: 'disaster',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 2001,
  address: '180 Greenwich St, New York, NY 10007',
  entityIds: [],
}
```

#### 2. United Airlines Flight 175 Strikes the South Tower on Live Television

```ts
{
  id: '911-south-tower-hit-2001',
  name: 'United Airlines Flight 175 Strikes the South Tower on Live Television',
  subtitle: '2 World Trade Center (South Tower) footprint, now the South Pool of the 9/11 Memorial, 180 Greenwich St, Manhattan',
  description: "At 9:03 AM, with television cameras already broadcasting the burning North Tower, United Flight 175 slams into the south face of the South Tower here between floors 77 and 85 at 590 mph. Millions watch it happen live. The South Tower, struck second, collapses first — at 9:59 AM, 56 minutes after impact. The force of its collapse generates a pyroclastic-like dust cloud that races through Lower Manhattan's streets at 60 mph.",
  lat: 40.7112,
  lng: -74.0133,
  type: 'disaster',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 2001,
  address: '180 Greenwich St, New York, NY 10007',
  entityIds: [],
}
```

#### 3. American Airlines Flight 77 Hits the Pentagon

```ts
{
  id: '911-pentagon-hit-2001',
  name: 'American Airlines Flight 77 Hits the Pentagon',
  subtitle: 'Pentagon west wall, Arlington, VA. The rebuilt section is marked by the Pentagon Memorial — 184 illuminated benches on 2 acres of lawn',
  description: "At 9:37 AM, American Airlines Flight 77 — carrying 64 people — strikes the west face of the Pentagon here at 530 mph, penetrating three of the building's five rings. 125 people inside the Pentagon die, plus all 64 on the plane. The impact zone had recently been reinforced with blast-resistant windows and Kevlar walls, limiting casualties. The 184 dead are memorialized by 184 cantilevered illuminated benches, each aligned to the victim's age, on the lawn outside the rebuilt wall.",
  lat: 38.8711,
  lng: -77.0579,
  type: 'disaster',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 2001,
  address: 'Pentagon, Arlington, VA 22202',
  entityIds: [],
}
```

#### 4. Passengers on United Flight 93 Storm the Cockpit Over Shanksville

```ts
{
  id: '911-flight-93-shanksville-2001',
  name: 'Passengers on United Flight 93 Storm the Cockpit Over Shanksville',
  subtitle: 'Flight 93 National Memorial, 6424 Lincoln Hwy, Stoystown, PA. The crash site is marked by a boulder at the exact impact point',
  description: "At 10:03 AM, United Flight 93 crashes here into a reclaimed strip mine at 563 mph after passengers — who learned about the other attacks via airphone calls — storm the cockpit. The plane creates a crater 35 feet deep and 8 feet wide. All 44 aboard die. The cockpit voice recorder captures the passengers' assault and the hijackers' decision to crash rather than lose control. The plane's target was likely the U.S. Capitol, 124 miles southeast. A boulder now marks the impact point.",
  lat: 40.0525,
  lng: -78.9044,
  type: 'disaster',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 2001,
  address: '6424 Lincoln Highway, Stoystown, PA 15563',
  entityIds: [],
}
```

#### 5. The North Tower Collapses 102 Minutes After Impact

```ts
{
  id: '911-north-tower-collapse-2001',
  name: 'The North Tower Collapses 102 Minutes After Impact',
  subtitle: 'North Pool, 9/11 Memorial, 180 Greenwich St, Manhattan. The survivor staircase from the original complex is inside the 9/11 Museum',
  description: "At 10:28 AM, the North Tower collapses here in 11 seconds, sending a wall of dust and debris billowing through Lower Manhattan. The collapse kills 1,402 people in and around the building, including 343 firefighters who had climbed into the tower to evacuate civilians — the deadliest day in the history of American firefighting. The Marriott hotel between the two towers is crushed; a 47-story building nearby collapses later that afternoon. Recovery at Ground Zero continues for eight months.",
  lat: 40.7116,
  lng: -74.0133,
  type: 'disaster',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 2001,
  address: '180 Greenwich St, New York, NY 10007',
  entityIds: [],
}
```

#### 6. The Tribute in Light First Illuminates the Manhattan Skyline

```ts
{
  id: '911-tribute-in-light-2002',
  name: 'The Tribute in Light First Illuminates the Manhattan Skyline',
  subtitle: 'Rooftop of a parking garage at the Battery Parking Garage, near West and Murray Streets, Manhattan. Lit annually on September 11',
  description: "On 11 March 2002, six months after the attacks, 88 xenon searchlights arranged in two 48-foot squares are switched on here near the World Trade Center site, projecting twin columns of light 4 miles into the sky above Manhattan. The beams — visible from 60 miles away — trace the approximate footprints of the fallen towers. The Tribute in Light has been lit every September 11 since, occasionally paused mid-evening when migrating birds become trapped in the beams.",
  lat: 40.7078,
  lng: -74.0145,
  type: 'monument',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 2002,
  address: 'Near West and Murray Streets, New York, NY 10007',
  entityIds: [],
}
```

### New Entities

No new entities needed. The 9/11 attacks are an event-centric story. Individual hijackers should not be elevated to entity status. Notable people (firefighters, passengers) could be entities in future expansion but are not required for the story to function.

---

## Story 7: The Discovery of Tutankhamun's Tomb

### Story Object

```ts
{
  id: 'discovery-of-tutankhamuns-tomb',
  name: "Discovery of Tutankhamun's Tomb",
  category: 'discovery-science',
  storyType: 'incident',
  description: "After six years of fruitless digging, an archaeologist's water boy trips over a stone step in the Valley of the Kings. Behind a sealed door lies the most intact royal burial ever found in Egypt — 5,398 objects packed into four small rooms, untouched for 3,245 years.",
  years: '1922–1925',
  wikipediaSlug: "Discovery_of_the_tomb_of_Tutankhamun",
}
```

### Moments

#### 1. A Water Boy Uncovers a Stone Step in the Valley of the Kings

```ts
{
  id: 'tutankhamun-step-found-1922',
  name: "A Water Boy Uncovers a Stone Step in the Valley of the Kings",
  subtitle: "KV62, Valley of the Kings, West Bank, Luxor. The tomb entrance is open to visitors with a timed ticket",
  description: "On 4 November 1922, a water boy digging a hole for his jars here in the Valley of the Kings strikes a stone step cut into the bedrock beneath the remains of workmen's huts near the tomb of Ramesses VI. Howard Carter's team clears 16 steps to reveal a sealed doorway stamped with the royal necropolis seal. Carter cables his patron Lord Carnarvon in England: \"At last have made wonderful discovery in valley; a magnificent tomb with seals intact.\" Carnarvon boards the next ship to Egypt.",
  lat: 25.7402,
  lng: 32.6014,
  type: 'discovery_site',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1922,
  address: 'KV62, Valley of the Kings, Luxor, Egypt',
  entityIds: ['tutankhamun', 'howard-carter'],
}
```

#### 2. Howard Carter Peers Through the Sealed Doorway and Sees "Wonderful Things"

```ts
{
  id: 'tutankhamun-wonderful-things-1922',
  name: 'Howard Carter Peers Through the Sealed Doorway and Sees "Wonderful Things"',
  subtitle: "KV62, Valley of the Kings, Luxor. The antechamber is the first room visitors enter today",
  description: "On 26 November 1922, Carter makes a small hole in the upper left corner of the sealed second doorway here and holds a candle inside. Lord Carnarvon, standing behind him, asks: \"Can you see anything?\" Carter replies: \"Yes, wonderful things.\" By candlelight he sees gilded couches shaped like animals, dismantled golden chariots, and alabaster vases stacked to the ceiling — 3,245 years of undisturbed silence broken by a single flame. The antechamber alone contains over 700 objects.",
  lat: 25.7402,
  lng: 32.6014,
  type: 'discovery_site',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1922,
  address: 'KV62, Valley of the Kings, Luxor, Egypt',
  entityIds: ['tutankhamun', 'howard-carter', 'lord-carnarvon'],
}
```

#### 3. Carter Opens the Burial Chamber and Finds the Sarcophagus

```ts
{
  id: 'tutankhamun-burial-chamber-1923',
  name: "Carter Opens the Burial Chamber and Finds Tutankhamun's Sarcophagus",
  subtitle: "KV62, Valley of the Kings, Luxor. The sarcophagus and outermost coffin remain in the burial chamber",
  description: "On 16 February 1923, before a small audience of officials and dignitaries, Carter breaks through the sealed wall between the antechamber and the burial chamber here. Inside stands a golden shrine nearly filling the room — the first of four nested shrines. Within them lies a quartzite sarcophagus containing three coffins nested like Russian dolls. The innermost coffin, which Carter will not reach until 1925, is solid gold and weighs 110 kilograms. The mummy inside wears a death mask that becomes the most recognized artifact in archaeology.",
  lat: 25.7402,
  lng: 32.6014,
  type: 'discovery_site',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1923,
  address: 'KV62, Valley of the Kings, Luxor, Egypt',
  entityIds: ['tutankhamun', 'howard-carter', 'lord-carnarvon'],
}
```

#### 4. Lord Carnarvon Dies and the "Curse of the Pharaohs" Myth Begins

```ts
{
  id: 'carnarvon-death-curse-1923',
  name: 'Lord Carnarvon Dies and the "Curse of the Pharaohs" Myth Begins',
  subtitle: 'Continental-Savoy Hotel (now Sofitel Winter Palace), Corniche El Nile, Luxor. The historic hotel is still operating',
  description: "On 5 April 1923, Lord Carnarvon — the aristocrat who funded Carter's six years of excavation — dies here at Cairo's Continental Hotel from an infected mosquito bite on his cheek, nicked while shaving. He is 56. The press seizes on the death: newspapers worldwide run stories of a pharaoh's curse. Arthur Conan Doyle suggests the death was caused by \"elementals\" guarding the tomb. Carter dismisses the curse as nonsense. Of the 26 people present at the tomb opening, only six die within a decade. Carter himself lives until 1939.",
  lat: 30.0444,
  lng: 31.2357,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1923,
  address: 'Continental-Savoy Hotel, Cairo, Egypt',
  entityIds: ['lord-carnarvon'],
}
```

#### 5. Tutankhamun's Death Mask Goes on Display at the Egyptian Museum

```ts
{
  id: 'tutankhamun-mask-display-cairo',
  name: "Tutankhamun's Death Mask Goes on Display at the Egyptian Museum in Cairo",
  subtitle: 'Grand Egyptian Museum, Al Remayah Square, Giza. The mask and 5,000+ Tutankhamun artifacts moved here from the old Tahrir Square museum',
  description: "Tutankhamun's 11-kilogram solid gold death mask — inlaid with lapis lazuli, turquoise, and carnelian — goes on permanent display here at the Egyptian Museum in Cairo. The mask covered the head and shoulders of the mummy inside the innermost coffin. Its striped nemes headdress, cobra and vulture on the brow, and false beard identify the wearer as a god-king. It is the most photographed artifact in the world. The mask and over 5,000 objects from the tomb are now housed at the Grand Egyptian Museum near the Giza Pyramids.",
  lat: 29.9943,
  lng: 31.1163,
  type: 'cultural_site',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'presence',
  year: 1925,
  address: 'Grand Egyptian Museum, Al Remayah Square, Giza, Egypt',
  entityIds: ['tutankhamun'],
}
```

### New Entities

Note: `tutankhamun` already exists in entities.ts.

```ts
{
  id: 'howard-carter',
  name: 'Howard Carter',
  type: 'person',
  years: '1874–1939',
  description: "The archaeologist who found the most intact pharaoh's tomb ever opened. Self-taught and temperamental, Carter spent six frustrating seasons in the Valley of the Kings before his water boy found a stone step. He spent the next 10 years cataloguing 5,398 objects from four cramped rooms.",
  wikipediaSlug: 'Howard_Carter',
}
```

```ts
{
  id: 'lord-carnarvon',
  name: 'Lord Carnarvon',
  type: 'person',
  years: '1866–1923',
  description: "The aristocrat whose money funded the discovery of Tutankhamun's tomb — and whose death launched the curse myth. George Herbert, 5th Earl of Carnarvon, financed Howard Carter's excavations for six years. He died five months after the tomb opened, from an infected mosquito bite.",
  wikipediaSlug: 'George_Herbert,_5th_Earl_of_Carnarvon',
}
```

---

## Story 8: The Trail of Tears

### Story Object

```ts
{
  id: 'trail-of-tears',
  name: 'Trail of Tears',
  category: 'dark-history',
  storyType: 'era',
  description: "The U.S. government forces 60,000 Native Americans from their ancestral lands and marches them west to Indian Territory. Thousands die of disease, starvation, and exposure along routes spanning a thousand miles. The Cherokee lose a quarter of their nation.",
  years: '1830–1850',
  wikipediaSlug: 'Trail_of_Tears',
}
```

### Moments

#### 1. Andrew Jackson Signs the Indian Removal Act

```ts
{
  id: 'indian-removal-act-1830',
  name: 'Andrew Jackson Signs the Indian Removal Act into Law',
  subtitle: 'The White House, 1600 Pennsylvania Ave NW, Washington, DC. The act passed the Senate by a single vote',
  description: "On 28 May 1830, President Andrew Jackson signs the Indian Removal Act here at the White House, authorizing the federal government to negotiate — and ultimately force — the removal of Native American nations from their lands east of the Mississippi River. The act passes the Senate by a single vote, 28 to 19. It targets the Cherokee, Chickasaw, Choctaw, Creek, and Seminole nations — the so-called \"Five Civilized Tribes\" — who collectively hold 25 million acres across the Southeast.",
  lat: 38.8977,
  lng: -77.0365,
  type: 'political_event',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1830,
  address: '1600 Pennsylvania Ave NW, Washington, DC 20500',
  entityIds: ['andrew-jackson'],
}
```

#### 2. The Choctaw Begin the First Forced March West

```ts
{
  id: 'choctaw-removal-1831',
  name: 'The Choctaw Begin the First Forced March West',
  subtitle: 'Near Vicksburg, MS. The Choctaw crossed the Mississippi here. The Trail of Tears National Historic Trail marks segments of the route',
  description: "In November 1831, the Choctaw Nation becomes the first to be forcibly removed, departing from the Mississippi River crossing here near Vicksburg. Approximately 17,000 Choctaw march west to Indian Territory in three waves over three winters, along muddy trails and through freezing swamps. Between 2,500 and 6,000 die en route from exposure, cholera, and starvation. One Choctaw leader describes the march to an Alabama newspaper as \"a trail of tears and death.\" The phrase sticks.",
  lat: 32.3526,
  lng: -90.8779,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'general-area',
  kind: 'event',
  year: 1831,
  address: 'Near Vicksburg, Warren County, Mississippi',
  entityIds: [],
}
```

#### 3. A Minority Faction Signs Away Cherokee Land at New Echota

```ts
{
  id: 'treaty-new-echota-1835',
  name: 'A Minority Faction Signs Away Cherokee Land at New Echota',
  subtitle: 'New Echota Historic Site, 1211 Chatsworth Hwy NE, Calhoun, GA. The reconstructed Cherokee capital is a state park with original and rebuilt structures',
  description: "On 29 December 1835, a group of roughly 500 Cherokee — out of a nation of 17,000 — sign the Treaty of New Echota here at the Cherokee capital, ceding all Cherokee land east of the Mississippi in exchange for $5 million and land in Indian Territory. The treaty is opposed by elected Principal Chief John Ross and 15,665 Cherokee who sign a petition of protest. The U.S. Senate ratifies it anyway by a single vote. Three of the Cherokee signers will be assassinated by their own people after removal.",
  lat: 34.6863,
  lng: -84.7877,
  type: 'political_event',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1835,
  address: '1211 Chatsworth Hwy NE, Calhoun, GA 30701',
  entityIds: [],
}
```

#### 4. U.S. Soldiers Round Up 16,000 Cherokee into Stockades

```ts
{
  id: 'cherokee-roundup-1838',
  name: 'U.S. Soldiers Round Up 16,000 Cherokee into Stockades',
  subtitle: 'Fort Cass (now the town of Charleston), Bradley County, TN. The Trail of Tears Interpretive Center is nearby in Cleveland, TN',
  description: "In May 1838, 7,000 U.S. Army troops under General Winfield Scott begin rounding up Cherokee families from their homes across Georgia, Tennessee, and North Carolina. Families are seized at gunpoint — some from dinner tables, some from fields — and marched to stockades here at Fort Cass and other holding camps. Livestock, homes, and possessions are looted by white settlers before the Cherokee are out of sight. An estimated 16,000 Cherokee are concentrated in camps through the summer, where dysentery and measles begin killing hundreds before the march even starts.",
  lat: 35.2868,
  lng: -84.8493,
  type: 'military_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1838,
  address: 'Charleston, Bradley County, TN 37310',
  entityIds: [],
}
```

#### 5. The Cherokee March 1,200 Miles to Indian Territory Through Winter

```ts
{
  id: 'cherokee-trail-of-tears-1838',
  name: 'The Cherokee March 1,200 Miles to Indian Territory Through Winter',
  subtitle: 'Mantle Rock, Livingston County, KY. A natural sandstone arch where Cherokee sheltered during a frozen Mississippi crossing. Maintained by the Nature Conservancy',
  description: "Between October 1838 and March 1839, approximately 16,000 Cherokee walk in 13 detachments from stockades in Tennessee across Kentucky, Illinois, Missouri, and Arkansas to Indian Territory. The northern route spans 1,200 miles. Winter catches them at the Mississippi River crossing, where ice blocks passage for weeks. Families huddle here under Mantle Rock, a 30-foot sandstone arch, waiting to cross. An estimated 4,000 Cherokee die on the march — roughly one in four. The survivors call it Nunna daul Tsuny: \"the trail where they cried.\"",
  lat: 37.2125,
  lng: -88.2858,
  type: 'historical_site',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1838,
  address: 'Mantle Rock Nature Preserve, Livingston County, KY 42045',
  entityIds: [],
}
```

#### 6. The Cherokee Arrive at Tahlequah and Reestablish Their Nation

```ts
{
  id: 'cherokee-arrive-tahlequah-1839',
  name: 'The Cherokee Arrive at Tahlequah and Reestablish Their Nation',
  subtitle: 'Cherokee Square, Tahlequah, OK. The Cherokee Nation headquarters is still located here. The Cherokee Heritage Center is nearby',
  description: "By March 1839, the surviving Cherokee reach Indian Territory and establish their new capital here at Tahlequah in present-day Oklahoma. On 6 September 1839, they adopt a new constitution modeled on the one they wrote in Georgia in 1827. Within months, the three Cherokee leaders who signed the Treaty of New Echota — Major Ridge, John Ridge, and Elias Boudinot — are assassinated on the same day. The Cherokee Nation headquarters remains in Tahlequah today, governing over 440,000 citizens, the largest tribal nation in the United States.",
  lat: 35.9155,
  lng: -94.9700,
  type: 'settlement_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1839,
  address: 'Cherokee Square, Tahlequah, OK 74464',
  entityIds: [],
}
```

### New Entities

```ts
{
  id: 'andrew-jackson',
  name: 'Andrew Jackson',
  type: 'person',
  years: '1767–1845',
  description: "The president who signed the Indian Removal Act and forced 60,000 Native Americans from their land. A frontier war hero who killed a man in a duel, Jackson won the presidency as a populist outsider. His face is on the $20 bill; his legacy is the Trail of Tears.",
  wikipediaSlug: 'Andrew_Jackson',
}
```

---

## Story 9: The Construction of the Great Pyramid of Giza

### Story Object

```ts
{
  id: 'construction-of-the-great-pyramid',
  name: 'Great Pyramid of Giza',
  category: 'everyday-extraordinary',
  storyType: 'place',
  description: "2.3 million stone blocks, each averaging 2.5 tons, assembled into a 481-foot structure that remained the tallest building on Earth for 3,800 years. Built without the wheel, iron, or pulleys by a workforce that ate 11 cattle and 33 sheep per day.",
  years: 'c. 2580–2560 BCE',
  wikipediaSlug: 'Great_Pyramid_of_Giza',
}
```

### Moments

#### 1. Pharaoh Khufu Orders the Construction of the Great Pyramid

```ts
{
  id: 'khufu-orders-pyramid-2580bce',
  name: 'Pharaoh Khufu Orders the Construction of the Great Pyramid',
  subtitle: 'Giza Plateau, Al Haram, Giza, Egypt. The pyramid stands at the northern end of the plateau. Entry is through a passage on the north face',
  description: "Around 2580 BCE, Pharaoh Khufu commissions the construction of his tomb here on the Giza plateau, a limestone ridge overlooking the Nile valley west of what is now Cairo. The project will take roughly 20 years, employ an estimated 20,000 to 30,000 workers, and consume 2.3 million stone blocks averaging 2.5 tons each. When completed, the pyramid stands 146.6 meters tall — the tallest structure on Earth, a record it holds for 3,800 years until Lincoln Cathedral's spire surpasses it around 1300 AD.",
  lat: 29.9792,
  lng: 31.1342,
  type: 'landmark',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: -2580,
  address: 'Great Pyramid of Giza, Al Haram, Giza, Egypt',
  entityIds: ['khufu'],
}
```

#### 2. Workers Quarry and Transport 2.3 Million Limestone Blocks to the Plateau

```ts
{
  id: 'pyramid-quarry-transport-2570bce',
  name: 'Workers Quarry and Transport 2.3 Million Limestone Blocks to the Plateau',
  subtitle: 'Tura quarries, east bank of the Nile opposite Giza. The ancient quarry caves are partially visible. Granite came from Aswan, 900 km upriver',
  description: "The core blocks are quarried from the Giza plateau itself, but the fine white limestone casing stones are cut here at the Tura quarries on the Nile's east bank and barged across the river. Granite beams for the King's Chamber — some weighing 80 tons — are quarried at Aswan, 900 km upriver, and floated downstream on barges during the annual flood. Workers move the blocks up ramps using sledges, water, and leverage. A recently discovered papyrus from overseer Merer logs daily deliveries of limestone blocks by boat.",
  lat: 29.9375,
  lng: 31.3333,
  type: 'industrial_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'presence',
  year: -2570,
  address: 'Tura, Helwan, Cairo Governorate, Egypt',
  entityIds: ['khufu'],
}
```

#### 3. Archaeologists Discover the Workers' Village That Built the Pyramids

```ts
{
  id: 'pyramid-workers-village-1990',
  name: "Archaeologists Discover the Workers' Village That Built the Pyramids",
  subtitle: "South of the Giza plateau, near the Wall of the Crow gate. The workers' cemetery is partially visible from the plateau edge",
  description: "In 1990, a tourist's horse stumbles over a mud-brick wall here south of the Great Sphinx, leading to the discovery of the workers' village that housed the pyramid builders. Archaeologist Mark Lehner excavates barracks, bakeries capable of producing thousands of loaves daily, a copper workshop, and a hospital with evidence of healed bone fractures. The skeletons show hard labor but proper nutrition and medical care — strong evidence the builders were not slaves but organized laborers fed 11 cattle and 33 sheep per day. The village could house 20,000.",
  lat: 29.9720,
  lng: 31.1310,
  type: 'archaeological_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1990,
  address: 'South of the Giza Plateau, Giza, Egypt',
  entityIds: [],
}
```

#### 4. The Great Sphinx Is Carved from Bedrock Alongside Khafre's Pyramid

```ts
{
  id: 'great-sphinx-carved-2500bce',
  name: "The Great Sphinx Is Carved from a Single Limestone Outcrop",
  subtitle: "Giza Plateau, directly east of Khafre's pyramid. The Sphinx sits in a trench cut into the bedrock. Best viewed from the panoramic terrace",
  description: "Around 2500 BCE, workers carve the Great Sphinx here from a single limestone outcrop left over from the quarrying of Khufu's pyramid, likely under the direction of Pharaoh Khafre. The figure — a lion's body with a human head — is 73 meters long and 20 meters high, the largest monolith statue in the world. Its nose, missing since at least the 15th century, was not shot off by Napoleon's troops (a popular myth contradicted by 18th-century drawings). The Sphinx was buried up to its shoulders in sand for most of its existence.",
  lat: 29.9753,
  lng: 31.1376,
  type: 'landmark',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: -2500,
  address: 'Great Sphinx, Giza Plateau, Giza, Egypt',
  entityIds: ['khafre'],
}
```

#### 5. Khufu's Solar Boat Is Sealed in a Pit Beside the Pyramid

```ts
{
  id: 'khufu-solar-boat-2560bce',
  name: "Khufu's Full-Size Cedarwood Boat Is Sealed in a Pit Beside the Pyramid",
  subtitle: 'Grand Egyptian Museum, Giza. The reassembled boat was moved from a glass museum beside the pyramid to the GEM in 2021',
  description: "Around 2560 BCE, a 43.6-meter cedarwood boat — fully assembled, with oars and rigging — is disassembled into 1,224 pieces and sealed in an airtight pit cut into the bedrock here beside the Great Pyramid's south face. It remains undiscovered for 4,500 years until Egyptian archaeologist Kamal el-Mallakh finds the pit in 1954. Reassembly takes 14 years. The boat, one of the oldest and largest intact vessels ever found, likely carried Khufu's body across the Nile or served as his vessel for the afterlife.",
  lat: 29.9779,
  lng: 31.1345,
  type: 'discovery_site',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: -2560,
  address: 'South side of the Great Pyramid, Giza Plateau, Egypt',
  entityIds: ['khufu'],
}
```

### New Entities

```ts
{
  id: 'khufu',
  name: 'Khufu',
  type: 'person',
  years: 'c. 2609–c. 2566 BCE',
  description: "The pharaoh who built the largest pyramid ever constructed. Khufu (Cheops in Greek) ruled Egypt for roughly 23 years during the Fourth Dynasty. Almost nothing is known about his life — the only surviving likeness is a 3-inch ivory figurine, the smallest royal sculpture from ancient Egypt.",
  wikipediaSlug: 'Khufu',
}
```

```ts
{
  id: 'khafre',
  name: 'Khafre',
  type: 'person',
  years: 'c. 2558–c. 2532 BCE',
  description: "The pharaoh whose face may be the Great Sphinx. Khafre built the second-largest pyramid at Giza and is widely credited with commissioning the Sphinx, which appears to bear his likeness. His mortuary complex is the best-preserved of the three Giza kings.",
  wikipediaSlug: 'Khafre',
}
```

---

## Story 10: The Rwandan Genocide

### Story Object

```ts
{
  id: 'rwandan-genocide',
  name: 'Rwandan Genocide',
  category: 'dark-history',
  storyType: 'incident',
  description: "In 100 days, Hutu extremists murder an estimated 800,000 Tutsi and moderate Hutu — one-tenth of Rwanda's population — while the world watches and does nothing. The killing is carried out with machetes, and much of it happens in churches where people fled for sanctuary.",
  years: '1994',
  wikipediaSlug: 'Rwandan_genocide',
}
```

### Moments

#### 1. President Habyarimana's Plane Is Shot Down Over Kigali

```ts
{
  id: 'habyarimana-plane-shot-down-1994',
  name: "President Habyarimana's Plane Is Shot Down Over Kigali",
  subtitle: "Kigali International Airport area. The wreckage landed in the garden of the presidential palace, now the Kandt House Museum",
  description: "At approximately 8:20 PM on 6 April 1994, a surface-to-air missile strikes the Dassault Falcon 50 carrying Rwandan President Juvenal Habyarimana and Burundian President Cyprien Ntaryamira as it approaches Kigali airport here. The plane crashes into the garden of the presidential palace, killing everyone aboard. Within an hour, roadblocks appear across Kigali and Hutu militia — the Interahamwe — begin systematic killings of Tutsi civilians using pre-prepared lists. The perpetrators of the shoot-down have never been conclusively identified.",
  lat: -1.9686,
  lng: 30.1395,
  type: 'disaster',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1994,
  address: 'Near Kigali International Airport, Kigali, Rwanda',
  entityIds: [],
}
```

#### 2. Thousands Seek Refuge and Are Massacred Inside Nyamata Church

```ts
{
  id: 'nyamata-church-massacre-1994',
  name: 'Thousands Seek Refuge and Are Massacred Inside Nyamata Church',
  subtitle: 'Nyamata Catholic Church, Bugesera District, 30 km south of Kigali. The church is preserved as a genocide memorial. Clothing of victims covers the pews',
  description: "On 11 April 1994, Interahamwe militia attack the Nyamata Catholic Church here, where approximately 10,000 Tutsi civilians have taken refuge. The militia breach the iron doors with grenades and enter with machetes and clubs. Over the following days, virtually everyone inside is killed. The church is preserved exactly as it was found — clothing of the victims drapes every pew, bullet and grenade marks scar the walls, and a mass grave behind the building holds 45,000 remains from Nyamata and the surrounding area.",
  lat: -2.1411,
  lng: 30.0928,
  type: 'crime_scene',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1994,
  address: 'Nyamata Catholic Church, Bugesera District, Rwanda',
  entityIds: [],
}
```

#### 3. The Hotel des Mille Collines Shelters 1,268 Refugees

```ts
{
  id: 'hotel-mille-collines-1994',
  name: 'The Hotel des Mille Collines Shelters 1,268 Refugees',
  subtitle: '2 KN 6 Ave, Kigali. The hotel is still operating as a four-star Kigali Serena Hotel. The original building and pool are intact',
  description: "Between April and July 1994, hotel manager Paul Rusesabagina uses the four-star Hotel des Mille Collines here in central Kigali to shelter 1,268 Tutsi and moderate Hutu refugees, bribing militia leaders with the hotel's liquor supply and calling international contacts to pressure the army. The hotel's swimming pool provides drinking water when the militia cut off the supply. The story becomes the basis for the 2004 film Hotel Rwanda. The hotel still operates under the name Kigali Serena Hotel, its original colonial-era facade and pool intact.",
  lat: -1.9500,
  lng: 30.0619,
  type: 'historical_site',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1994,
  address: '2 KN 6 Ave, Kigali, Rwanda',
  entityIds: ['paul-rusesabagina'],
}
```

#### 4. Bodies Are Preserved in Lime at Murambi Technical School

```ts
{
  id: 'murambi-massacre-1994',
  name: '45,000 People Are Killed at Murambi Technical School in Three Days',
  subtitle: 'Murambi Genocide Memorial, Nyamagabe District, southern Rwanda. The preserved bodies are displayed in the school classrooms',
  description: "On 21 April 1994, approximately 50,000 Tutsi gathered at the Murambi Technical School here are attacked by Interahamwe militia and Rwandan soldiers. French troops had recently evacuated, leaving the refugees unprotected. Over three days, an estimated 45,000 are killed. The bodies, preserved in lime by the killers to speed decomposition, instead partially mummified. Today, more than 800 preserved bodies lie on wooden racks in the school's former classrooms — a deliberate memorial decision so the world cannot deny what happened.",
  lat: -2.4667,
  lng: 29.5667,
  type: 'crime_scene',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1994,
  address: 'Murambi Technical School, Nyamagabe District, Rwanda',
  entityIds: [],
}
```

#### 5. The RPF Takes Kigali and Ends the Genocide

```ts
{
  id: 'rpf-takes-kigali-1994',
  name: 'The Rwandan Patriotic Front Takes Kigali and Ends the Genocide',
  subtitle: 'Kigali city center, Rwanda. The RPF advance ended the genocide but triggered a refugee crisis in neighboring Congo',
  description: "On 4 July 1994, the Rwandan Patriotic Front under Paul Kagame captures Kigali here after a three-month military campaign from Uganda. The genocide, which began 100 days earlier, effectively ends. An estimated 800,000 to 1,000,000 Tutsi and moderate Hutu have been killed — roughly 10,000 per day, mostly with machetes and clubs. The United Nations, with 2,500 peacekeepers in-country, had refused to intervene. Two million Hutu, including many perpetrators, flee to refugee camps in eastern Congo, triggering the First Congo War.",
  lat: -1.9441,
  lng: 30.0619,
  type: 'political_event',
  importance: 'major',
  accuracy: 'general-area',
  kind: 'event',
  year: 1994,
  address: 'Kigali, Rwanda',
  entityIds: ['paul-kagame'],
}
```

#### 6. The Kigali Genocide Memorial Opens with 250,000 Victims Interred

```ts
{
  id: 'kigali-genocide-memorial-2004',
  name: 'The Kigali Genocide Memorial Opens with 250,000 Victims Interred',
  subtitle: 'KG 14 Ave, Gisozi, Kigali. The memorial is open daily and free to enter. It is the final resting place of 250,000 victims',
  description: "On 7 April 2004, the 10th anniversary of the genocide, the Kigali Genocide Memorial Centre opens here in the Gisozi neighborhood. The hillside site contains mass graves holding the remains of 250,000 victims recovered from across Kigali. The museum documents the genocide through photographs, personal belongings, and testimonies. A children's memorial displays enlarged photographs of murdered children with captions noting their favorite food and last words. The memorial was built with support from the Aegis Trust and serves as Rwanda's primary site of remembrance.",
  lat: -1.9353,
  lng: 30.0458,
  type: 'monument',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 2004,
  address: 'KG 14 Ave, Gisozi, Kigali, Rwanda',
  entityIds: [],
}
```

### New Entities

```ts
{
  id: 'paul-rusesabagina',
  name: 'Paul Rusesabagina',
  type: 'person',
  years: '1954–present',
  description: "The hotel manager who sheltered 1,268 people during the Rwandan genocide. Rusesabagina used the Hotel des Mille Collines as a sanctuary, bribing militia with liquor and calling foreign contacts. He received the Presidential Medal of Freedom in 2005, then was controversially imprisoned by Rwanda's government in 2020.",
  wikipediaSlug: 'Paul_Rusesabagina',
}
```

```ts
{
  id: 'paul-kagame',
  name: 'Paul Kagame',
  type: 'person',
  years: '1957–present',
  description: "The rebel commander who ended the Rwandan genocide and has ruled Rwanda since. Kagame led the RPF's military campaign from Uganda, captured Kigali in July 1994, and became president in 2000. He rebuilt Rwanda into Africa's fastest-growing economy while facing criticism for authoritarian rule and suppression of dissent.",
  wikipediaSlug: 'Paul_Kagame',
}
```

---

## Summary: New Entities Needed

| Entity ID | Name | Type | Story |
|-----------|------|------|-------|
| `rms-titanic` | RMS Titanic | work | Titanic |
| `harland-and-wolff` | Harland and Wolff | organization | Titanic |
| `frederick-fleet` | Frederick Fleet | person | Titanic |
| `mount-vesuvius` | Mount Vesuvius | place | Vesuvius |
| `pliny-the-elder` | Pliny the Elder | person | Vesuvius |
| `pliny-the-younger` | Pliny the Younger | person | Vesuvius |
| `neil-armstrong` | Neil Armstrong | person | Apollo 11 |
| `buzz-aldrin` | Buzz Aldrin | person | Apollo 11 |
| `michael-collins-astronaut` | Michael Collins | person | Apollo 11 |
| `chernobyl-npp` | Chernobyl Nuclear Power Plant | place | Chernobyl |
| `peter-fechter` | Peter Fechter | person | Berlin Wall |
| `gunter-schabowski` | Gunter Schabowski | person | Berlin Wall |
| `howard-carter` | Howard Carter | person | Tutankhamun |
| `lord-carnarvon` | Lord Carnarvon | person | Tutankhamun |
| `andrew-jackson` | Andrew Jackson | person | Trail of Tears |
| `khufu` | Khufu | person | Great Pyramid |
| `khafre` | Khafre | person | Great Pyramid |
| `paul-rusesabagina` | Paul Rusesabagina | person | Rwandan Genocide |
| `paul-kagame` | Paul Kagame | person | Rwandan Genocide |

**Existing entities referenced**: `tutankhamun`, `nasa`, `ronald-reagan`

---

## Counts

| Story | Moments | New Entities |
|-------|---------|-------------|
| Sinking of the Titanic | 7 | 3 |
| Eruption of Vesuvius | 6 | 3 |
| Apollo 11 Moon Landing | 5 | 3 |
| Chernobyl Disaster | 5 | 1 |
| Fall of the Berlin Wall | 6 | 2 |
| September 11 Attacks | 6 | 0 |
| Discovery of Tutankhamun's Tomb | 5 | 2 |
| Trail of Tears | 6 | 1 |
| Great Pyramid of Giza | 5 | 2 |
| Rwandan Genocide | 6 | 2 |
| **Totals** | **57** | **19** |
