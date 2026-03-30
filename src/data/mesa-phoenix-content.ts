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
      'A Phoenix laborer whose botched police interrogation reached the Supreme Court and gave every arrested person in America the right to remain silent. Miranda was stabbed to death in a bar fight ten years later; his killer was read his Miranda rights and released.',
    wikipediaSlug: 'Ernesto_Miranda',
  },
  {
    id: 'barry-goldwater',
    name: 'Barry Goldwater',
    type: 'person',
    years: '1909–1998',
    description:
      'Five-term Arizona senator, 1964 Republican presidential nominee, and the father of American conservatism. A department-store heir who flew 163 different aircraft, set up one of Arizona\'s first radio transmitters at age 13, and spent his final years advocating for gay rights and marijuana legalization — baffling the movement he created.',
    wikipediaSlug: 'Barry_Goldwater',
  },
  {
    id: 'frank-lloyd-wright',
    name: 'Frank Lloyd Wright',
    type: 'person',
    years: '1867–1959',
    description:
      'America\'s most famous architect designed over 1,000 structures across 70 years. He built Taliesin West in the Scottsdale desert as a winter laboratory, hand-mixing local rock and sand into the concrete to make the building look like it grew out of the earth.',
    wikipediaSlug: 'Frank_Lloyd_Wright',
  },
  {
    id: 'winnie-ruth-judd',
    name: 'Winnie Ruth Judd',
    type: 'person',
    years: '1905–1998',
    description:
      'The "Trunk Murderess" who killed two friends in Phoenix in 1931, packed their bodies into luggage, and shipped them by train to Los Angeles. Sentenced to hang, she was declared insane and escaped from the state asylum seven times over 38 years — once living undetected as a nanny in California for six years.',
    wikipediaSlug: 'Winnie_Ruth_Judd',
  },
  {
    id: 'don-bolles',
    name: 'Don Bolles',
    type: 'person',
    years: '1928–1976',
    description:
      'An Arizona Republic investigative reporter who spent a decade exposing land fraud and organized crime in Phoenix. On June 2, 1976, a car bomb blew apart his Datsun in a hotel parking lot. His murder triggered the largest collaborative journalism investigation in American history.',
    wikipediaSlug: 'Don_Bolles',
  },
];

// ─── MOMENTS ─────────────────────────────────────────────────────────

export const mesaPhoenixMoments: Moment[] = [
  // ── Story: Hohokam Canal Builders ──
  {
    id: 'phx-hohokam-pueblo-grande',
    name: 'The Hohokam Build a 1,000-Mile Canal Network That Modern Phoenix Still Uses',
    subtitle: 'S\'edav Va\'aki Museum (Pueblo Grande), 4619 E Washington St, Phoenix. The platform mound and original canals are visible on-site',
    description:
      'Between 450 and 1450 AD, the Hohokam people engineered the most sophisticated pre-Columbian irrigation system in North America — over 1,000 miles of canals watering 110,000 acres of Sonoran Desert. When the Salt River Project mapped its modern canal routes in the early 1900s, engineers discovered they were building directly on top of Hohokam alignments that were already optimal. The Pueblo Grande platform mound, now squeezed between Sky Harbor Airport and a freeway, was once the nerve center of a canal system that sustained 80,000 people.',
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
      'This massive platform mound in what is now downtown Mesa was built in stages between 1100 and 1400 AD, reaching 20 feet high and covering nearly an acre. It served as a ceremonial and administrative hub for a Hohokam community that thrived on canal-fed agriculture. Today it sits surrounded by suburban homes — a remnant of a civilization that vanished centuries before Europeans arrived, leaving no written record of why they abandoned one of the largest irrigation societies in the ancient Americas.',
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
    subtitle: 'Park of the Canals, 1710 N Horne, Mesa. Preserved canal segments are visible along walking paths',
    description:
      'By 1450, the Hohokam had abandoned their canal systems and dispersed. The leading theories include prolonged drought, catastrophic flooding that destroyed canal infrastructure, soil salinization from centuries of irrigation, or internal social collapse. What makes the mystery exceptional is the scale: this was not a small settlement. Tens of thousands of people across dozens of interconnected villages simply stopped maintaining the most advanced irrigation network in the pre-Columbian Americas and walked away.',
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
      'On March 13, 1963, Phoenix police arrested 23-year-old Ernesto Miranda at his home and brought him to the station at 17 South 2nd Avenue. In a two-hour interrogation, detectives never told Miranda he had the right to remain silent or the right to an attorney. He signed a written confession that included a pre-printed header stating the confession was voluntary — but the Supreme Court would later rule that was not good enough. The case rewrote American criminal law.',
    lat: 33.4484,
    lng: -112.0740,
    type: 'government',
    importance: 'major',
    notability: 70,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1963,
    date: 'March 13, 1963',
    entityIds: ['ernesto-miranda'],
    wikiSection: 'Arrest_and_conviction',
  },
  {
    id: 'phx-miranda-scotus',
    name: 'The Supreme Court Rules 5-4 and Creates the Miranda Warning',
    subtitle: 'U.S. Supreme Court, 1 First St NE, Washington, DC. The decision reshaped every police encounter in America',
    description:
      'On June 13, 1966, Chief Justice Earl Warren delivered the majority opinion in Miranda v. Arizona: any statement made by a suspect during custodial interrogation is inadmissible unless police first inform the suspect of their rights. The four-part warning — right to silence, anything said can be used against you, right to an attorney, one will be appointed if you cannot afford one — became the most recited legal script in American history, memorized by millions who have never been arrested thanks to television cop shows.',
    lat: 38.8907,
    lng: -77.0044,
    type: 'government',
    importance: 'major',
    notability: 80,
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1966,
    date: 'June 13, 1966',
    entityIds: ['ernesto-miranda'],
    wikiSection: 'Decision',
  },
  {
    id: 'phx-miranda-stabbed',
    name: 'Ernesto Miranda Is Stabbed to Death — His Killer Is Read His Miranda Rights',
    subtitle: 'La Amapola Bar (demolished), 233 S 2nd St, Phoenix. The bar no longer exists',
    description:
      'On January 31, 1976, ten years after the Supreme Court decision that bore his name, Ernesto Miranda was stabbed to death during a card game at La Amapola bar in downtown Phoenix. Police arrested a suspect named Fernando Zamora Rodriguez. In what may be the most darkly ironic moment in American legal history, the arresting officers pulled out a Miranda card and read the suspect his rights. Rodriguez exercised those rights, refused to talk, and was released. The primary suspect fled to Mexico and was never prosecuted. Miranda was 34.',
    lat: 33.4435,
    lng: -112.0720,
    type: 'crime_scene',
    importance: 'major',
    notability: 65,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1976,
    date: 'January 31, 1976',
    entityIds: ['ernesto-miranda'],
    wikiSection: 'Death',
  },

  // ── Story: The Great Papago Escape ──
  {
    id: 'phx-papago-escape-tunnel',
    name: 'Twenty-Five German POWs Tunnel Out of a Phoenix Prison Camp on Christmas Eve',
    subtitle: 'Camp Papago Park (now Papago Park), Phoenix. The tunnel entrance site is near the current park area',
    description:
      'On the night of December 23, 1944, twenty-five German prisoners of war escaped through a 178-foot tunnel they had dug beneath Camp Papago Park. They had hidden the excavated dirt by convincing guards to let them build a volleyball court — and dumped the soil underneath it. The tunnel was three feet high and eighteen inches wide. The escape was the largest POW breakout on American soil during World War II. But the Germans had planned their escape using a highway map that showed the Gila River as a blue line — and assumed they could raft to Mexico. When they reached the river, it was a dry wash. All twenty-five were recaptured within weeks, most because they were starving or sunburned. One turned himself back in after seeing the camp\'s Christmas dinner menu.',
    lat: 33.4538,
    lng: -111.9468,
    type: 'military',
    importance: 'major',
    notability: 55,
    verificationLevel: 'verified',
    accuracy: 'general-area',
    kind: 'event',
    year: 1944,
    date: 'December 23, 1944',
    wikiSection: 'The_escape',
  },

  // ── Story: Trunk Murderess ──
  {
    id: 'phx-judd-murder-scene',
    name: 'Winnie Ruth Judd Kills Two Friends and Packs Their Bodies in Trunks',
    subtitle: '2929 N 2nd St (approximate), Phoenix. The original bungalow no longer stands',
    description:
      'On the night of October 16, 1931, Winnie Ruth Judd visited her friends Agnes Anne LeRoi and Hedvig "Sammy" Samuelson at their duplex near downtown Phoenix. A fight erupted and all three women were shot — Judd in the hand, the other two fatally. Judd crammed LeRoi\'s body into a large trunk. When Samuelson\'s body would not fit, Judd dismembered it and packed the pieces into suitcases. She then hauled the luggage to Union Station and boarded a Southern Pacific train to Los Angeles. The crime became a national sensation, with newspapers calling Judd the "Tiger Woman" and the "Blonde Butcher."',
    lat: 33.4659,
    lng: -112.0680,
    type: 'crime_scene',
    importance: 'major',
    notability: 50,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1931,
    date: 'October 16, 1931',
    entityIds: ['winnie-ruth-judd'],

  },
  {
    id: 'phx-judd-asylum-escapes',
    name: 'Judd Escapes the Arizona State Asylum Seven Times in Thirty-Eight Years',
    subtitle: 'Arizona State Hospital, 2500 E Van Buren St, Phoenix. The facility still operates as a psychiatric hospital',
    description:
      'After her death sentence was commuted to commitment at the Arizona State Asylum, Winnie Ruth Judd escaped seven times between 1939 and 1962. Her final escape in 1962 was the most audacious: she disappeared for over six years, assuming the identity "Marian Lane" and working as a live-in nanny for a wealthy family in the San Francisco Bay Area. She was finally recognized and returned to Arizona in 1969. In 1971, Governor Jack Williams commuted her sentence. She lived quietly in California and later Phoenix until her death in 1998 at age 93.',
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
    subtitle: 'Piestewa Peak, Phoenix. The peak offers the same vantage point witnesses used in 1997',
    description:
      'On the evening of March 13, 1997, a massive V-shaped formation of lights — estimated at over a mile wide — silently glided across the Arizona sky from Henderson, Nevada, through Prescott and over the Phoenix metro area, before disappearing near Tucson. Thousands of people saw it, including Arizona Governor Fife Symington, who joined a crowd of skywatchers at Piestewa Peak (then Squaw Peak). The governor initially mocked the sighting at a press conference by having an aide dress as an alien, but years later admitted he had seen the formation himself and called it "enormous and inexplicable." The Phoenix Lights remain the most widely witnessed UFO event in American history.',
    lat: 33.5313,
    lng: -112.0230,
    type: 'landmark',
    importance: 'major',
    notability: 60,
    verificationLevel: 'legendary',
    accuracy: 'general-area',
    kind: 'event',
    year: 1997,
    date: 'March 13, 1997',
    wikiSection: 'Events',
  },
  {
    id: 'phx-lights-sierra-estrella',
    name: 'A Second Wave of Lights Appears Over the Sierra Estrella — the Air Force Calls Them Flares',
    subtitle: 'Sierra Estrella, southwest of Phoenix. The mountain range is visible from much of the metro area',
    description:
      'Around 10 p.m. on the same night, a second set of lights appeared in the sky southwest of Phoenix, seemingly hovering over the Sierra Estrella mountain range. The military later identified these as A-10 Warthog aircraft dropping illumination flares over the Barry Goldwater Range during a training exercise. But many witnesses insisted the second event looked nothing like the first — and that neither looked like flares. The Air Force explanation satisfied some observers but deepened the mystery for others, and the debate continues decades later.',
    lat: 33.3500,
    lng: -112.3700,
    type: 'military',
    importance: 'minor',
    notability: 40,
    verificationLevel: 'legendary',
    accuracy: 'general-area',
    kind: 'event',
    year: 1997,
    date: 'March 13, 1997',
    wikiSection: 'Explanations',
  },

  // ── Story: Taliesin West ──
  {
    id: 'phx-taliesin-west',
    name: 'Frank Lloyd Wright Builds a Desert Laboratory Out of Local Rock and Sand',
    subtitle: 'Taliesin West, 12621 N Frank Lloyd Wright Blvd, Scottsdale. UNESCO World Heritage Site, open for tours',
    description:
      'In 1937, Frank Lloyd Wright began constructing Taliesin West in the foothills of the McDowell Mountains as a winter home, studio, and architectural school. Rather than importing materials, Wright had students haul boulders from the desert wash and mix them with sand and cement to create "desert masonry" — walls that look like they grew from the landscape. The camp was an ongoing experiment: Wright redesigned and rebuilt portions of it every year for two decades. Canvas roofs filtered the desert light. Wright lived and worked here every winter until his death in 1959. The compound is now a UNESCO World Heritage Site and the headquarters of the Frank Lloyd Wright Foundation.',
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

  // ── Story: Japanese Internment in Arizona ──
  {
    id: 'phx-gila-river-camp',
    name: 'Thirteen Thousand Japanese Americans Are Imprisoned in the Desert South of Phoenix',
    subtitle: 'Gila River War Relocation Center site, Sacaton, AZ. Interpretive markers on the Gila River Indian Community',
    description:
      'In May 1942, the U.S. government opened the Gila River War Relocation Center on the Gila River Indian Reservation, 30 miles southeast of Phoenix. At its peak, 13,348 Japanese Americans — most from California — were confined in two camps named Canal and Butte. The camp became the fourth-largest city in Arizona. Internees farmed 7,000 acres of desert land, built their own schools and hospitals, and endured summer temperatures exceeding 120 degrees in tar-paper barracks. The irony of imprisoning one minority on the reservation of another was not lost on the Gila River Indian Community, who had not been consulted about the camp\'s placement on their land.',
    lat: 33.0736,
    lng: -111.7400,
    type: 'military',
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
    name: 'A Car Bomb Kills an Investigative Reporter in a Phoenix Hotel Parking Lot',
    subtitle: 'Hotel Clarendon (now demolished), 4th Ave & Clarendon, Phoenix. Commemorative street sign at the intersection',
    description:
      'On June 2, 1976, Arizona Republic reporter Don Bolles drove to the Hotel Clarendon in midtown Phoenix to meet a source promising information about land fraud. While Bolles waited in the lobby, someone wired six sticks of dynamite to his Datsun. When he started the car, a remote detonator triggered the explosion. Bolles lost both legs and an arm before dying eleven days later. His murder triggered the "Arizona Project" — 38 journalists from across the country descended on Phoenix to finish the stories Bolles had been investigating, producing a 23-part series exposing organized crime\'s grip on the state. It was the largest collaborative investigative journalism effort in American history.',
    lat: 33.4787,
    lng: -112.0764,
    type: 'crime_scene',
    importance: 'major',
    notability: 55,
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1976,
    date: 'June 2, 1976',
    entityIds: ['don-bolles'],
    wikiSection: 'Murder',
  },

  // ── Story: Barry Goldwater ──
  {
    id: 'phx-goldwater-store',
    name: 'A Department Store Heir Runs for Phoenix City Council and Launches the Conservative Movement',
    subtitle: 'Goldwater\'s Department Store (demolished), 1st St & Adams, Phoenix. The building no longer exists',
    description:
      'Barry Goldwater inherited his family\'s upscale department store in downtown Phoenix and served as its president. In 1949, he won a seat on the Phoenix City Council as a reform candidate opposing organized crime and corruption. Three years later, he stunned the political establishment by defeating the sitting U.S. Senate Majority Leader, Ernest McFarland. Goldwater\'s 1964 presidential campaign — though a landslide loss to Lyndon Johnson — planted the seeds of the modern conservative movement and paved the way for Ronald Reagan sixteen years later.',
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
    name: 'Goldwater Spends His Final Years Advocating Gay Rights — Baffling the Movement He Created',
    subtitle: 'Be-Nun-I-Kin, Paradise Valley, AZ. Goldwater\'s hilltop home overlooking Phoenix (private residence)',
    description:
      'From his home on a Paradise Valley hilltop, the aging Goldwater became increasingly vocal in support of gay Americans serving in the military, environmental protection, and medical marijuana. In 1994, he told the Washington Post that the Republican Party\'s embrace of the religious right was turning it into a party of intolerance. His most quoted late-life statement: "Every good Christian ought to kick Falwell right in the ass." The father of modern conservatism died in 1998 at 89, having become too liberal for the movement he started.',
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
      'A thousand years before Phoenix was founded, the Hohokam built the most complex irrigation system in the pre-Columbian Americas — over 1,000 miles of canals that modern engineers found were already optimally routed. Then they vanished, and nobody knows why.',
    tags: ['archaeology', 'indigenous', 'arizona', 'engineering', 'mystery'],
    moments: [
      { momentId: 'phx-hohokam-pueblo-grande' },
      { momentId: 'phx-hohokam-mesa-grande' },
      { momentId: 'phx-hohokam-park-canals' },
    ],
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
      'A Phoenix laborer\'s botched interrogation went to the Supreme Court and gave every arrested person in America four rights they can recite from memory. The man whose name became synonymous with those rights was stabbed to death in a bar — and his killer was read his Miranda rights and walked free.',
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
      'On Christmas Eve 1944, twenty-five German POWs tunneled out of a Phoenix prison camp in the largest wartime escape on American soil. They had planned to raft down the Gila River to Mexico — but their highway map showed it as a blue line, and when they reached it, it was bone dry.',
    tags: ['wwii', 'escape', 'phoenix', 'prisoners-of-war'],
    moments: [{ momentId: 'phx-papago-escape-tunnel' }],
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
      'Winnie Ruth Judd killed two friends, packed their bodies in trunks, and shipped them by train to Los Angeles. Sentenced to hang, she was declared insane, escaped the asylum seven times over 38 years, and lived quietly as a nanny under a fake name before dying at 93.',
    tags: ['true-crime', 'phoenix', '1930s', 'escape'],

    moments: [
      { momentId: 'phx-judd-murder-scene' },
      { momentId: 'phx-judd-asylum-escapes' },
    ],
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
      'On March 13, 1997, a mile-wide V-shaped formation of lights silently crossed 300 miles of Arizona sky in front of thousands of witnesses — including the governor, who first mocked the sighting and then admitted years later he had seen it too. It remains the most widely witnessed UFO event in American history.',
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
      'Frank Lloyd Wright spent two decades building, demolishing, and rebuilding his winter compound in the Scottsdale desert — mixing local rock into the walls so the building would look like it grew from the earth. It is now a UNESCO World Heritage Site.',
    tags: ['architecture', 'scottsdale', 'frank-lloyd-wright', 'unesco'],
    moments: [{ momentId: 'phx-taliesin-west' }],
    wikipediaSlug: 'Taliesin_West',
  },
  {
    id: 'japanese-internment-arizona',
    name: 'Arizona\'s Internment Camps',
    nickname: 'The Fourth-Largest City in the State Was a Prison',
    years: '1942–1945',
    category: 'dark-history',
    storyType: 'incident',
    description:
      'During World War II, over 13,000 Japanese Americans were imprisoned at the Gila River War Relocation Center, built on the Gila River Indian Reservation without the tribe\'s consent. At its peak, the camp was the fourth-largest city in Arizona — and one minority was being imprisoned on the land of another.',
    tags: ['wwii', 'internment', 'civil-rights', 'arizona'],
    moments: [{ momentId: 'phx-gila-river-camp' }],
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
      'When a car bomb killed Arizona Republic reporter Don Bolles in a Phoenix hotel parking lot, 38 journalists from across America descended on the state to finish his work — producing the largest collaborative investigative journalism project in history.',
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
      'The department-store heir who became the father of modern American conservatism — and spent his final years advocating for gay rights, environmentalism, and marijuana legalization, leaving the movement he created bewildered.',
    tags: ['politics', 'phoenix', 'conservatism', 'republican'],
    moments: [
      { momentId: 'phx-goldwater-store' },
      { momentId: 'phx-goldwater-paradise-valley' },
    ],
    wikipediaSlug: 'Barry_Goldwater',
  },
];
