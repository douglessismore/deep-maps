/**
 * Mesa / Phoenix / Scottsdale, Arizona — Curated content
 *
 * Stories, moments, and entities for the greater Phoenix metro area.
 * These are NEW items — do not duplicate IDs from stories.ts / moments.ts / entities.ts.
 *
 * To integrate: import and spread into the main arrays in the respective seed files,
 * or load via Supabase.
 */
import type { Story, Moment, Entity } from '../types';

// ─── ENTITIES ────────────────────────────────────────────────────────

export const mesaPhoenixEntities: Entity[] = [
  {
    id: 'ernesto-miranda',
    name: 'Ernesto Miranda',
    type: 'person',
    years: '1941–1976',
    description:
      'A Phoenix laborer whose botched interrogation reached the Supreme Court and gave every arrested person in America the right to remain silent. Stabbed to death in a bar fight ten years later; his killer was read Miranda rights and released.',
    canonicalStoryId: '', // TODO: no biography story exists yet
    wikipediaSlug: 'Ernesto_Miranda',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Ernesto_Miranda_crop.jpg/300px-Ernesto_Miranda_crop.jpg',
  },
  {
    id: 'barry-goldwater',
    name: 'Barry Goldwater',
    type: 'person',
    years: '1909–1998',
    description:
      'The father of modern American conservatism and five-term Arizona senator. A department-store heir who flew 163 different aircraft, set up one of Arizona\'s first radio transmitters at age 13, and spent his final years advocating for gay rights and marijuana legalization.',
    canonicalStoryId: 'barry-goldwater-life',
    wikipediaSlug: 'Barry_Goldwater',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Barry_Goldwater_photo1962.jpg/300px-Barry_Goldwater_photo1962.jpg',
  },
  {
    id: 'frank-lloyd-wright',
    name: 'Frank Lloyd Wright',
    type: 'person',
    years: '1867–1959',
    description:
      'America\'s most famous architect designed over 1,000 structures across 70 years. He built Taliesin West in the Scottsdale desert as a winter laboratory, hand-mixing local rock and sand into the concrete to make the building look like it grew out of the earth.',
    canonicalStoryId: 'frank-lloyd-wright-biography',
    wikipediaSlug: 'Frank_Lloyd_Wright',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Frank_Lloyd_Wright_portrait.jpg/300px-Frank_Lloyd_Wright_portrait.jpg',
  },
  // Demoted entities (tag-only): winnie-ruth-judd, don-bolles
  // Their IDs remain in moment entityIds[] for tagging.
];

// ─── MOMENTS ─────────────────────────────────────────────────────────

export const mesaPhoenixMoments: Moment[] = [
  // ── Story: Hohokam Canal Builders ──
  {
    id: 'phx-hohokam-pueblo-grande',
    name: 'The Hohokam Build a 1,000-Mile Canal Network That Modern Phoenix Still Uses',
    subtitle: 'S\'edav Va\'aki Museum (Pueblo Grande), 4619 E Washington St, Phoenix. Platform mound and original canals visible on-site',
    description:
      'The platform mound here at Pueblo Grande was the nerve center of the most sophisticated pre-Columbian irrigation system in North America. Between 450 and 1450 AD, the Hohokam engineered over 1,000 miles of canals watering 110,000 acres of Sonoran Desert. When the Salt River Project mapped its modern canal routes in the early 1900s, engineers discovered they were tracing Hohokam alignments that were already optimal. The mound now sits squeezed between Sky Harbor Airport and a freeway.',
    lat: 33.4458,
    lng: -111.9533,
    type: 'archaeological_site',
    importance: 'major',
    notability: 55,
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'presence',
    year: 1100,
    date: 'c. 450–1450 AD',
    address: '4619 E Washington St, Phoenix, AZ 85034',
    wikiSection: 'Irrigation',
  },
  {
    id: 'phx-hohokam-mesa-grande',
    name: 'Mesa Grande Rises as a Hohokam Ceremonial Center',
    subtitle: 'Mesa Grande Cultural Park, 1000 N Date, Mesa. One of only two surviving Hohokam platform mounds in the metro area',
    description:
      'This massive platform mound here in downtown Mesa was built in stages between 1100 and 1400 AD, reaching 20 feet high and covering nearly an acre. It served as a ceremonial and administrative hub for a Hohokam community that thrived on canal-fed agriculture. Today the mound sits surrounded by suburban homes, a remnant of a civilization that vanished centuries before Europeans arrived, leaving no written record of why they abandoned their cities.',
    lat: 33.4275,
    lng: -111.8384,
    type: 'archaeological_site',
    importance: 'minor',
    notability: 30,
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'presence',
    year: 1200,
    date: 'c. 1100–1400 AD',
    address: '1000 N Date, Mesa, AZ 85201',
  },
  {
    id: 'phx-hohokam-park-canals',
    name: 'The Hohokam Vanish and Leave Behind a Canal System That Stumps Archaeologists',
    subtitle: 'Park of the Canals, 1710 N Horne, Mesa. Preserved canal segments visible along walking paths',
    description:
      'The preserved canal segments here at Park of the Canals are among the last visible traces of a civilization that walked away. By 1450, the Hohokam had abandoned their canal systems and dispersed. Leading theories include prolonged drought, catastrophic flooding, soil salinization, or social collapse. Tens of thousands of people across dozens of interconnected villages stopped maintaining the most advanced irrigation network in the pre-Columbian Americas.',
    lat: 33.4369,
    lng: -111.8242,
    type: 'archaeological_site',
    importance: 'minor',
    notability: 25,
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1450,
    date: 'c. 1450 AD',
    address: '1710 N Horne, Mesa, AZ 85203',
  },

  // ── Story: Miranda Rights ──
  {
    id: 'phx-miranda-arrest',
    name: 'Police Arrest Ernesto Miranda Without Telling Him He Can Stay Silent',
    subtitle: 'Phoenix Police HQ (demolished), 17 S 2nd Ave, Phoenix. The original building no longer exists',
    description:
      'Inside the Phoenix police station that once stood here at 17 South 2nd Avenue, detectives interrogated 23-year-old Ernesto Miranda for two hours on 13 March 1963 without ever telling him he had the right to remain silent or to an attorney. Miranda signed a written confession with a pre-printed header stating it was voluntary. The Supreme Court would later rule that was not good enough, and the case rewrote American criminal procedure.',
    lat: 33.4484,
    lng: -112.0740,
    type: 'government',
    importance: 'major',
    notability: 70,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1963,
    date: '13 March 1963',
    entityIds: ['ernesto-miranda'],
    wikiSection: 'Arrest_and_conviction',
  },
  {
    id: 'phx-miranda-scotus',
    name: 'The Supreme Court Rules 5-4 and Creates the Miranda Warning',
    subtitle: 'U.S. Supreme Court, 1 First St NE, Washington, DC. The building is open to the public for oral arguments',
    description:
      'Chief Justice Earl Warren delivered the majority opinion here on 13 June 1966 in Miranda v. Arizona: any statement made during custodial interrogation is inadmissible unless police first inform the suspect of their rights. The four-part warning became the most recited legal script in American history, memorized by millions who have never been arrested thanks to television cop shows.',
    lat: 38.8907,
    lng: -77.0044,
    type: 'government',
    importance: 'major',
    notability: 80,
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1966,
    date: '13 June 1966',
    entityIds: ['ernesto-miranda'],
    wikiSection: 'Decision',
  },
  {
    id: 'phx-miranda-stabbed',
    name: 'Ernesto Miranda Is Stabbed to Death in a Phoenix Bar',
    subtitle: 'La Amapola Bar (demolished), 233 S 2nd St, Phoenix. The bar no longer exists',
    description:
      'Ten years after the Supreme Court decision that bore his name, Ernesto Miranda was stabbed to death during a card game here at La Amapola bar in downtown Phoenix on 31 January 1976. Police arrested a suspect and pulled out a Miranda card to read him his rights. The suspect exercised those rights, refused to talk, and was released. The primary suspect fled to Mexico and was never prosecuted. Miranda was 34.',
    lat: 33.4435,
    lng: -112.0720,
    type: 'crime_scene',
    importance: 'major',
    notability: 65,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1976,
    date: '31 January 1976',
    entityIds: ['ernesto-miranda'],
    wikiSection: 'Death',
  },

  // ── Story: The Great Papago Escape ──
  {
    id: 'phx-papago-escape-tunnel',
    name: 'Twenty-Five German POWs Tunnel Out of a Phoenix Prison Camp',
    subtitle: 'Camp Papago Park (now Papago Park), Phoenix. The tunnel entrance site is near the current park area',
    description:
      'Twenty-five German prisoners of war escaped through a 178-foot tunnel beneath this camp here in Papago Park on the night of 23 December 1944. They had hidden excavated dirt under a volleyball court they convinced guards to let them build. It was the largest POW breakout on American soil during WWII. The Germans planned to raft the Gila River to Mexico, but their highway map showed it as a blue line; when they reached it, the river was a dry wash. All were recaptured within weeks.',
    lat: 33.4538,
    lng: -111.9468,
    type: 'military_site',
    importance: 'major',
    notability: 55,
    verificationLevel: 'verified',
    accuracy: 'general-area',
    kind: 'event',
    year: 1944,
    date: '23 December 1944',
    wikiSection: 'The_escape',
  },

  // ── Story: Trunk Murderess ──
  {
    id: 'phx-judd-murder-scene',
    name: 'Winnie Ruth Judd Kills Two Friends and Packs Their Bodies in Trunks',
    subtitle: '2929 N 2nd St (approximate), Phoenix. The original bungalow no longer stands',
    description:
      'Inside a small duplex near here on the night of 16 October 1931, Winnie Ruth Judd shot and killed her friends Agnes Anne LeRoi and Hedvig Samuelson after a fight erupted. Judd crammed LeRoi\'s body into a large trunk, dismembered Samuelson to fit the pieces into suitcases, then hauled the luggage to Union Station and boarded a Southern Pacific train to Los Angeles. Newspapers dubbed her the "Tiger Woman" and the "Blonde Butcher."',
    lat: 33.4659,
    lng: -112.0680,
    type: 'crime_scene',
    importance: 'major',
    notability: 50,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1931,
    date: '16 October 1931',
    entityIds: ['winnie-ruth-judd'],
  },
  {
    id: 'phx-judd-asylum-escapes',
    name: 'Judd Escapes the Arizona State Asylum Seven Times in Thirty-Eight Years',
    subtitle: 'Arizona State Hospital, 2500 E Van Buren St, Phoenix. The facility still operates as a psychiatric hospital',
    description:
      'From this psychiatric hospital here on Van Buren Street, Winnie Ruth Judd escaped seven times between 1939 and 1962 after her death sentence was commuted to commitment. Her most audacious escape came in 1962: she vanished for over six years, assuming the identity "Marian Lane" and working as a live-in nanny in the San Francisco Bay Area. Governor Jack Williams commuted her sentence in 1971. She died in 1998 at age 93.',
    lat: 33.4518,
    lng: -112.0311,
    type: 'institution',
    importance: 'minor',
    notability: 40,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1962,
    entityIds: ['winnie-ruth-judd'],
  },

  // ── Story: Phoenix Lights ──
  {
    id: 'phx-lights-piestewa-peak',
    name: 'Thousands Watch a Mile-Wide V-Shaped Light Formation Glide Over Phoenix',
    subtitle: 'Piestewa Peak, Phoenix. The summit trail offers the same vantage point witnesses used; trailhead parking off E Lincoln Dr',
    description:
      'Thousands watched from here atop this peak on the evening of 13 March 1997 as a massive V-shaped formation of lights silently glided over Phoenix from the northwest. Governor Fife Symington initially mocked the sighting by having an aide dress as an alien, but years later admitted he had seen the formation himself and called it "enormous and inexplicable." It remains the most widely witnessed UFO event in American history.',
    lat: 33.5313,
    lng: -112.0230,
    type: 'landmark',
    importance: 'major',
    notability: 60,
    verificationLevel: 'legendary',
    accuracy: 'general-area',
    kind: 'event',
    year: 1997,
    date: '13 March 1997',
    wikiSection: 'Events',
  },
  {
    id: 'phx-lights-sierra-estrella',
    name: 'A Second Wave of Lights Appears Over the Sierra Estrella',
    subtitle: 'Sierra Estrella, southwest of Phoenix. The mountain range is visible from much of the metro area',
    description:
      'Around 10 p.m. on the same night, a second set of lights appeared in the sky above this mountain range here southwest of Phoenix. The military later identified them as A-10 Warthog aircraft dropping illumination flares over the Barry Goldwater Range during a training exercise. Many witnesses insisted the second event looked nothing like the first and that neither resembled flares. The Air Force explanation satisfied some but deepened the mystery for others.',
    lat: 33.3500,
    lng: -112.3700,
    type: 'military_site',
    importance: 'minor',
    notability: 40,
    verificationLevel: 'legendary',
    accuracy: 'general-area',
    kind: 'event',
    year: 1997,
    date: '13 March 1997',
    wikiSection: 'Explanations',
  },

  // ── Story: Taliesin West ──
  {
    id: 'phx-taliesin-west',
    name: 'Frank Lloyd Wright Builds a Desert Laboratory Out of Local Rock and Sand',
    subtitle: 'Taliesin West, 12621 N Frank Lloyd Wright Blvd, Scottsdale. UNESCO World Heritage Site, open for tours',
    description:
      'Wright began constructing his winter compound here in the McDowell Mountain foothills in 1937. He had students haul boulders from the desert wash and mix them with sand and cement to create "desert masonry" walls that look like they grew from the landscape. Canvas roofs filtered the light. Wright redesigned and rebuilt portions every year for two decades, living and working here each winter until his death in 1959. It is now a UNESCO World Heritage Site.',
    lat: 33.6065,
    lng: -111.8453,
    type: 'landmark',
    importance: 'major',
    notability: 60,
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'presence',
    year: 1937,
    address: '12621 N Frank Lloyd Wright Blvd, Scottsdale, AZ 85259',
    entityIds: ['frank-lloyd-wright'],
    wikiSection: 'Design_and_construction',
  },

  // ── Story: Frank Lloyd Wright (biography) ──
  {
    id: 'flw-fallingwater-built',
    name: 'Frank Lloyd Wright Builds a House Over a Waterfall and Rescues His Career',
    subtitle: 'Fallingwater, 1491 Mill Run Rd, Mill Run, PA. Open for tours; the house cantilevers directly over Bear Run falls',
    description:
      'Wright was 67 and nearly forgotten when department store heir Edgar Kaufmann Sr. commissioned a weekend home here in the Laurel Highlands. Instead of placing the house with a view of the waterfall, Wright cantilevered it directly over the falls on 15 September 1935. Engineers warned the concrete would collapse. Kaufmann\'s contractor secretly doubled the steel reinforcement. The house held. Time magazine put Wright on its cover in 1938, and the AIA later named Fallingwater the best all-time work of American architecture.',
    lat: 39.9064,
    lng: -79.4681,
    type: 'landmark',
    importance: 'major',
    notability: 65,
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1935,
    date: '15 September 1935',
    address: '1491 Mill Run Rd, Mill Run, PA 15464',
    entityIds: ['frank-lloyd-wright'],
    wikiSection: 'History',
  },
  {
    id: 'flw-guggenheim-opens',
    name: 'The Guggenheim Museum Opens Six Months After Wright Dies',
    subtitle: '1071 Fifth Ave, New York, NY. The spiral ramp museum is open to the public on Museum Mile',
    description:
      'Wright spent 16 years fighting with Solomon Guggenheim, city officials, and 21 artists who signed a letter protesting the design of this museum here on Fifth Avenue. The building inverts the typical gallery: visitors take an elevator to the top and walk down a continuous quarter-mile spiral ramp. Wright died on 9 April 1959 at age 91. The museum opened on 21 October 1959 to divided reviews. Today it is a UNESCO World Heritage Site and one of the most recognized buildings on Earth.',
    lat: 40.7830,
    lng: -73.9590,
    type: 'landmark',
    importance: 'major',
    notability: 70,
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1959,
    date: '21 October 1959',
    address: '1071 Fifth Ave, New York, NY 10128',
    entityIds: ['frank-lloyd-wright'],
    wikiSection: 'History',
  },

  // ── Story: Japanese Internment in Arizona ──
  {
    id: 'phx-gila-river-camp',
    name: 'Thirteen Thousand Japanese Americans Are Imprisoned in the Desert South of Phoenix',
    subtitle: 'Gila River War Relocation Center site, Sacaton, AZ. Interpretive markers on the Gila River Indian Community',
    description:
      'The U.S. government opened the Gila River War Relocation Center here on the Gila River Indian Reservation in May 1942, 30 miles southeast of Phoenix. At its peak, 13,348 Japanese Americans were confined in two camps named Canal and Butte, making it Arizona\'s fourth-largest city. Internees farmed 7,000 acres of desert land and endured 120-degree summers in tar-paper barracks. The Gila River Indian Community had not been consulted about the camp\'s placement on their land.',
    lat: 33.0736,
    lng: -111.7400,
    type: 'military_site',
    importance: 'major',
    notability: 55,
    verificationLevel: 'verified',
    accuracy: 'general-area',
    kind: 'presence',
    year: 1942,
    date: 'May 1942 – November 1945',
    wikiSection: 'History',
  },

  // ── Story: Don Bolles Car Bombing ──
  {
    id: 'phx-bolles-bombing',
    name: 'A Car Bomb Kills Investigative Reporter Don Bolles in a Hotel Parking Lot',
    subtitle: 'Hotel Clarendon (demolished), 4th Ave & Clarendon, Phoenix. Commemorative street sign at the intersection',
    description:
      'Arizona Republic reporter Don Bolles drove to the Hotel Clarendon here in midtown Phoenix on 2 June 1976 to meet a source promising information about land fraud. While he waited in the lobby, someone wired six sticks of dynamite to his Datsun. The remote-detonated explosion cost Bolles both legs and an arm; he died eleven days later. His murder triggered the "Arizona Project," in which 38 journalists descended on Phoenix to finish his stories, producing a 23-part series on organized crime.',
    lat: 33.4787,
    lng: -112.0764,
    type: 'crime_scene',
    importance: 'major',
    notability: 55,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1976,
    date: '2 June 1976',
    entityIds: ['don-bolles'],
    wikiSection: 'Murder',
  },

  // ── Story: Barry Goldwater ──
  {
    id: 'phx-goldwater-store',
    name: 'Barry Goldwater Wins a Phoenix City Council Seat and Begins His Political Rise',
    subtitle: 'Goldwater\'s Department Store (demolished), 1st St & Adams, Phoenix. The building no longer exists',
    description:
      'Goldwater inherited his family\'s upscale department store that once stood here in downtown Phoenix and served as its president before entering politics. In 1949, he won a Phoenix City Council seat as a reform candidate opposing organized crime. Three years later he defeated sitting U.S. Senate Majority Leader Ernest McFarland. His 1964 presidential campaign was a landslide loss to Lyndon Johnson but launched the movement that elected Ronald Reagan sixteen years later.',
    lat: 33.4486,
    lng: -112.0733,
    type: 'cultural_site',
    importance: 'major',
    notability: 50,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'milestone',
    year: 1949,
    entityIds: ['barry-goldwater'],
  },
  {
    id: 'phx-goldwater-paradise-valley',
    name: 'Goldwater Publicly Breaks with the Religious Right He Empowered',
    subtitle: 'Be-Nun-I-Kin, Paradise Valley, AZ. Goldwater\'s hilltop home overlooking Phoenix (private residence)',
    description:
      'From his hilltop home here in Paradise Valley, the aging Goldwater became increasingly vocal in support of gay Americans in the military, environmental protection, and medical marijuana. In 1994, he told the Washington Post the Republican Party\'s embrace of the religious right was making it a party of intolerance. His most quoted late-life line: "Every good Christian ought to kick Falwell right in the ass." He died in 1998 at 89, too liberal for the movement he started.',
    lat: 33.5325,
    lng: -111.9455,
    type: 'residence',
    importance: 'minor',
    notability: 45,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'presence',
    year: 1994,
    entityIds: ['barry-goldwater'],
  },
];

// ─── STORIES ─────────────────────────────────────────────────────────

export const mesaPhoenixStories: Story[] = [
  {
    id: 'hohokam-canal-builders',
    name: 'The Hohokam Canal Builders',
    nickname: 'The Civilization That Engineered Phoenix Before Phoenix Existed',
    years: '450–1450 AD',
    category: 'discovery-science',
    storyType: 'era',
    description:
      'Over 1,000 miles of canals that modern engineers found were already optimally routed, a platform mound squeezed between an airport and a freeway, and a mass disappearance that archaeologists still cannot explain.',
    tags: ['archaeology', 'indigenous', 'arizona', 'engineering', 'mystery'],
    moments: [
      { momentId: 'phx-hohokam-pueblo-grande' },
      { momentId: 'phx-hohokam-mesa-grande' },
      { momentId: 'phx-hohokam-park-canals' },
    ],
    relatedStoryIds: ['japanese-internment-arizona'],
    wikipediaSlug: 'Hohokam',
  },
  {
    id: 'miranda-rights-phoenix',
    name: 'Miranda v. Arizona',
    nickname: 'You Have the Right to Remain Silent',
    years: '1963–1976',
    category: 'political-drama',
    storyType: 'incident',
    description:
      'A botched interrogation in a Phoenix police station, a 5-4 Supreme Court ruling, and a stabbing in a downtown bar where the killer was read the dead man\'s own rights.',
    tags: ['supreme-court', 'civil-rights', 'phoenix', 'law-enforcement'],
    moments: [
      { momentId: 'phx-miranda-arrest' },
      { momentId: 'phx-miranda-scotus' },
      { momentId: 'phx-miranda-stabbed' },
    ],
    relatedStoryIds: ['don-bolles-murder'],
    wikipediaSlug: 'Miranda_v._Arizona',
  },
  {
    id: 'great-papago-escape',
    name: 'The Great Papago Escape',
    nickname: 'The POWs Who Tried to Raft Down a Dry River',
    years: '1944',
    category: 'everyday-extraordinary',
    storyType: 'incident',
    description:
      'Twenty-five German POWs tunnel out of a Phoenix camp on Christmas Eve in the largest wartime escape on American soil, then discover the Gila River on their highway map is a dry wash.',
    tags: ['wwii', 'escape', 'phoenix', 'prisoners-of-war'],
    moments: [{ momentId: 'phx-papago-escape-tunnel' }],
    relatedStoryIds: ['japanese-internment-arizona'],
    wikipediaSlug: 'Great_Papago_Escape',
  },
  {
    id: 'trunk-murderess',
    name: 'The Trunk Murderess',
    nickname: 'The Tiger Woman of Phoenix',
    years: '1931–1998',
    category: 'dark-history',
    storyType: 'incident',
    description:
      'A Phoenix woman kills two friends, ships their bodies by train in luggage, is sentenced to hang, escapes the asylum seven times, and lives undetected as a nanny for six years.',
    tags: ['true-crime', 'phoenix', '1930s', 'escape'],
    moments: [
      { momentId: 'phx-judd-murder-scene' },
      { momentId: 'phx-judd-asylum-escapes' },
    ],
    relatedStoryIds: ['don-bolles-murder'],
    wikipediaSlug: 'Winnie_Ruth_Judd',
  },
  {
    id: 'phoenix-lights-1997',
    name: 'The Phoenix Lights',
    nickname: 'The Night the Sky Opened Over Arizona',
    years: '1997',
    category: 'mystery-unexplained',
    storyType: 'incident',
    description:
      'A mile-wide V-shaped formation crosses 300 miles of Arizona sky in front of thousands of witnesses, the governor mocks the sighting then admits he saw it too, and the Air Force blames flares.',
    tags: ['ufo', 'phoenix', 'mystery', '1990s'],
    moments: [
      { momentId: 'phx-lights-piestewa-peak' },
      { momentId: 'phx-lights-sierra-estrella' },
    ],
    relatedStoryIds: ['roswell'],
    wikipediaSlug: 'Phoenix_Lights',
  },
  {
    id: 'taliesin-west',
    name: 'Taliesin West',
    nickname: 'The Desert Laboratory',
    years: '1937–1959',
    category: 'arts-culture',
    storyType: 'place',
    description:
      'Frank Lloyd Wright spends two decades building and rebuilding his Scottsdale compound with desert masonry mixed from local rock. Canvas roofs filter the light. Now a UNESCO World Heritage Site.',
    tags: ['architecture', 'scottsdale', 'frank-lloyd-wright', 'unesco'],
    moments: [{ momentId: 'phx-taliesin-west' }],
    relatedStoryIds: ['barry-goldwater-life', 'frank-lloyd-wright-biography'],
    wikipediaSlug: 'Taliesin_West',
  },
  {
    id: 'frank-lloyd-wright-biography',
    name: 'Frank Lloyd Wright',
    nickname: 'America\'s Architect',
    years: '1867–1959',
    category: 'arts-culture',
    storyType: 'biography',
    description:
      'A house cantilevered over a waterfall rescues a 67-year-old\'s career, a spiral museum on Fifth Avenue opens six months after he dies, and a desert compound built from local rock becomes a UNESCO site.',
    tags: ['architecture', 'frank-lloyd-wright', 'unesco', 'modernism'],
    moments: [
      { momentId: 'flw-fallingwater-built' },
      { momentId: 'phx-taliesin-west' },
      { momentId: 'flw-guggenheim-opens' },
    ],
    relatedStoryIds: ['taliesin-west'],
    wikipediaSlug: 'Frank_Lloyd_Wright',
  },
  {
    id: 'japanese-internment-arizona',
    name: 'Arizona\'s Internment Camps',
    nickname: 'The Fourth-Largest City in the State Was a Prison',
    years: '1942–1945',
    category: 'dark-history',
    storyType: 'incident',
    description:
      'Over 13,000 Japanese Americans imprisoned at a camp built on the Gila River Indian Reservation without the tribe\'s consent, farming 7,000 desert acres in 120-degree heat.',
    tags: ['wwii', 'internment', 'civil-rights', 'arizona'],
    moments: [{ momentId: 'phx-gila-river-camp' }],
    relatedStoryIds: ['great-papago-escape'],
    wikipediaSlug: 'Gila_River_War_Relocation_Center',
  },
  {
    id: 'don-bolles-murder',
    name: 'The Don Bolles Murder',
    nickname: 'The Reporter They Could Not Silence',
    years: '1976',
    category: 'dark-history',
    storyType: 'incident',
    description:
      'A car bomb kills an Arizona Republic reporter in a hotel parking lot, and 38 journalists from across America descend on the state to finish his work in the largest collaborative investigative project in history.',
    tags: ['journalism', 'organized-crime', 'phoenix', 'car-bomb'],
    moments: [{ momentId: 'phx-bolles-bombing' }],
    relatedStoryIds: ['miranda-rights-phoenix'],
    wikipediaSlug: 'Don_Bolles',
  },
  {
    id: 'barry-goldwater-life',
    name: 'Barry Goldwater',
    nickname: 'Mr. Conservative',
    years: '1909–1998',
    category: 'political-drama',
    storyType: 'biography',
    description:
      'A department-store heir defeats a Senate Majority Leader, loses a presidential landslide that launches modern conservatism, then spends his final years advocating gay rights and telling Jerry Falwell off.',
    tags: ['politics', 'phoenix', 'conservatism', 'republican'],
    moments: [
      { momentId: 'phx-goldwater-store' },
      { momentId: 'phx-goldwater-paradise-valley' },
    ],
    relatedStoryIds: ['miranda-rights-phoenix'],
    wikipediaSlug: 'Barry_Goldwater',
  },
];
