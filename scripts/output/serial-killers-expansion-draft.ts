// Serial Killers Expansion Draft — New Moments
// Generated 2026-03-23
//
// EXISTING KILLERS ALREADY IN DATABASE (DO NOT DUPLICATE):
//   - Ed Gein (gein-*) — 6 moments
//   - Jeffrey Dahmer (dahmer-*) — 4 moments
//   - Ted Bundy (tb-*) — 3 moments
//   - Zodiac Killer (zk-*) — 3 moments
//   - John Wayne Gacy (jwg-*) — 3 moments
//   - Servant Girl Annihilator (annihilator-*) — 5 moments
//   - H.H. Holmes (holmes-*) — 3 moments (NOT in collection yet)
//   - Son of Sam / David Berkowitz (son-of-sam-*) — 1 moment (NOT in collection yet)
//
// NEW KILLERS ADDED BELOW: 12 killers, ~30 new moments
// Also includes additional moments for existing killers where warranted.
//
// NOTE: entityIds are empty [] per instructions — no person entities for serial killers
// unless they already exist. H.H. Holmes moments use ['hh-holmes'] since that entity exists.

import type { Moment } from '../../src/types';

export const serialKillerExpansionMoments: Moment[] = [

  // ═══════════════════════════════════════════════════════════════════════
  // RICHARD RAMIREZ — "The Night Stalker" (1984–1985, Los Angeles)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'night-stalker-first-murder-1984',
    name: 'The "Night Stalker" Murders a 79-Year-Old Woman in Her Glassell Park Home',
    subtitle: '2614 Hubbard St, Glassell Park, Los Angeles. The residential street is unchanged',
    description: 'On 28 June 1984, Jennie Vincow was found dead here in her Glassell Park apartment, nearly decapitated. She was 79. The murder went unsolved for months, but it was the first killing attributed to Richard Ramirez, a drifter from El Paso who would terrorize greater Los Angeles for the next 14 months. Ramirez entered homes through unlocked doors and windows, attacking victims of all ages. His spree killed at least 13 people before a neighborhood mob tackled him on a street in East Los Angeles.',
    lat: 34.1175,
    lng: -118.2420,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'documented',
    accuracy: 'approximate',
    kind: 'event',
    year: 1984,
    date: '28 June 1984',
    address: '2614 Hubbard St, Los Angeles, CA 90065',
    entityIds: [],
  },
  {
    id: 'night-stalker-captured-1985',
    name: 'A Neighborhood Mob Tackles the "Night Stalker" on a Street in East Los Angeles',
    subtitle: 'Hubbard St near Mott St, East Los Angeles. The residential neighborhood is unchanged',
    description: 'On 31 August 1985, Richard Ramirez was recognized from newspaper photos while trying to steal a car here in East Los Angeles. Residents chased him for blocks. Manuel de la Torres tackled him to the ground and others pinned him until police arrived. Ramirez had terrorized the Los Angeles area for over a year, breaking into homes at night and killing 13 people. His capture ended one of the most intense manhunts in California history. He was sentenced to death in 1989 and died of cancer on death row in 2013.',
    lat: 34.0237,
    lng: -118.1720,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1985,
    date: '31 August 1985',
    address: 'Hubbard St near Mott St, East Los Angeles, CA',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DENNIS RADER — "BTK" (1974–1991, Wichita, KS)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'btk-otero-murders-1974',
    name: 'The "BTK Strangler" Murders Four Members of the Otero Family in Their Wichita Home',
    subtitle: '803 N Edgemoor St, Wichita, KS. The house still stands in a quiet residential area',
    description: 'On 15 January 1974, Dennis Rader entered this house here on North Edgemoor and strangled four members of the Otero family, including two children aged 9 and 11. He later sent a letter to a local newspaper describing the murders in clinical detail and coined his own name: "BTK" for Bind, Torture, Kill. Rader, a married father, church president, and city compliance officer, would kill at least six more people over the next 17 years before going silent. He was caught in 2005 after a floppy disk he sent to police was traced to his church computer.',
    lat: 37.6997,
    lng: -97.2920,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1974,
    date: '15 January 1974',
    address: '803 N Edgemoor St, Wichita, KS 67208',
    entityIds: [],
  },
  {
    id: 'btk-arrested-park-city-2005',
    name: 'Dennis Rader Is Arrested as the BTK Killer After 31 Years at His Park City Home',
    subtitle: '6220 N Independence St, Park City, KS. The house still stands; a quiet suburb of Wichita',
    description: 'On 25 February 2005, police arrested Dennis Rader here at his Park City home, ending a 31-year hunt for the BTK killer. Rader had resurfaced in 2004 after a decade of silence, sending letters, packages, and a floppy disk to police and media. The disk metadata contained "Christ Lutheran Church" and the name "Dennis." DNA from his daughter confirmed the match. Rader had lived here as a seemingly ordinary husband, father, Cub Scout leader, and municipal worker. He confessed to 10 murders and received 10 consecutive life sentences.',
    lat: 37.7992,
    lng: -97.3186,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 2005,
    date: '25 February 2005',
    address: '6220 N Independence St, Park City, KS 67219',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GARY RIDGWAY — "The Green River Killer" (1982–2001, Seattle/Tacoma)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'green-river-first-victims-1982',
    name: 'Five Bodies Surface in the Green River Near Kent, Washington',
    subtitle: 'Peck Bridge, Green River, Kent, WA. The river banks near S 259th St remain accessible',
    description: 'Between 15 July and 15 August 1982, five bodies were pulled from the Green River here near Kent, south of Seattle. The victims were young women, most involved in sex work along the Sea-Tac strip. The discoveries launched the Green River Task Force, which at its peak was the largest serial murder investigation in American history. Gary Ridgway, a truck painter who lived nearby, was interviewed and released twice before DNA evidence finally linked him in 2001. He eventually confessed to 49 murders, though investigators believe the true count exceeds 70.',
    lat: 47.3700,
    lng: -122.2350,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1982,
    address: 'Green River near S 259th St, Kent, WA 98032',
    entityIds: [],
  },
  {
    id: 'green-river-ridgway-home-1982',
    name: 'Gary Ridgway Lives Three Miles from the Green River While Killing for Two Decades',
    subtitle: '21859 32nd Pl S, Des Moines, WA. The house still stands in a residential neighborhood',
    description: 'Gary Ridgway lived here in this unassuming ranch house in Des Moines, Washington, throughout his killing spree from 1982 to at least 1998. A truck painter at the nearby Kenworth plant, he drove the Sea-Tac strip picking up women and strangling them, often returning to dump sites to have sex with the bodies. Police interviewed him in 1983 and again in 1984. He passed a polygraph in 1984. A 1987 search warrant on this house turned up nothing. Only a 2001 DNA match from evidence saved since 1987 finally ended the longest serial murder investigation in U.S. history.',
    lat: 47.3857,
    lng: -122.3024,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'presence',
    year: 1982,
    address: '21859 32nd Pl S, Des Moines, WA 98198',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // AILEEN WUORNOS (1989–1990, Florida)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'wuornos-first-victim-1989',
    name: 'Aileen Wuornos Shoots a Man on a Rural Road North of Tampa — Her First of Seven Victims',
    subtitle: 'US 19, near Clearwater, Volusia County, FL. The body was found in a wooded area off the highway',
    description: 'On 30 November 1989, the body of Richard Mallory was found here in woods off US 19 in Volusia County, shot multiple times. He was the first of seven men killed by Aileen Wuornos, a sex worker who shot her clients along Florida highways between 1989 and 1990. Wuornos claimed all seven were self-defense, but juries convicted her of six murders. She became one of the most famous female serial killers in history, the subject of the 2003 film "Monster." She was executed by lethal injection in Florida on 9 October 2002.',
    lat: 29.0140,
    lng: -81.1080,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'documented',
    accuracy: 'general-area',
    kind: 'event',
    year: 1989,
    date: '30 November 1989',
    address: 'US 19 corridor, Volusia County, FL',
    entityIds: [],
  },
  {
    id: 'wuornos-captured-last-resort-1991',
    name: 'Aileen Wuornos Is Arrested at The Last Resort Biker Bar in Volusia County',
    subtitle: 'The Last Resort, 5812 N US 1, Port Orange, FL. The bar still operates under the same name',
    description: 'On 9 January 1991, police arrested Aileen Wuornos here at The Last Resort, a biker bar on US 1 in Port Orange where she was a regular. Investigators had linked pawn shop records and fingerprints from abandoned cars to identify her. Her companion Tyria Moore cooperated with police, calling Wuornos from a monitored phone to elicit a confession. Wuornos eventually confessed to seven murders along Florida highways. The bar still operates and has embraced its notoriety.',
    lat: 29.1335,
    lng: -81.0270,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1991,
    date: '9 January 1991',
    address: '5812 N US 1, Port Orange, FL 32127',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // EDMUND KEMPER — "The Co-Ed Killer" (1964–1973, Santa Cruz, CA)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'kemper-grandparents-1964',
    name: 'A 15-Year-Old Edmund Kemper Shoots Both Grandparents at Their California Ranch',
    subtitle: 'Near N Fork, Madera County, CA. The rural property is in the Sierra Nevada foothills',
    description: 'On 27 August 1964, 15-year-old Edmund Kemper shot his grandmother in the kitchen of her ranch here in the Sierra Nevada foothills, then shot his grandfather when he returned from errands. Asked later why he did it, Kemper said he "wanted to see what it felt like." He was committed to Atascadero State Hospital and released at 21 against the psychiatrists\' advice. Within two years he began killing hitchhiking college students in Santa Cruz, eventually murdering six young women, his mother, and her friend.',
    lat: 37.2336,
    lng: -119.5066,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'documented',
    accuracy: 'general-area',
    kind: 'event',
    year: 1964,
    date: '27 August 1964',
    address: 'Near North Fork, Madera County, CA',
    entityIds: [],
  },
  {
    id: 'kemper-surrender-santa-cruz-1973',
    name: 'Edmund Kemper Calls Police from a Phone Booth in Pueblo to Confess to Eight Murders',
    subtitle: 'Kemper called from a phone booth in Pueblo, CO. He had killed six co-eds, his mother, and her friend',
    description: 'On 23 April 1973, Edmund Kemper called the Santa Cruz police from a phone booth here in Pueblo, Colorado, and confessed to murdering his mother and her friend — and six UC Santa Cruz hitchhikers before them. Standing 6\'9" and weighing 280 pounds, Kemper had befriended local police while picking up students along Highway 1. He drank beer with officers at a bar called the Jury Room, where they nicknamed him "Big Ed." He had to call back three times before anyone took his confession seriously. He remains in prison at California Medical Facility in Vacaville.',
    lat: 38.2699,
    lng: -104.6091,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'documented',
    accuracy: 'general-area',
    kind: 'event',
    year: 1973,
    date: '23 April 1973',
    address: 'Pueblo, CO',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CHARLES MANSON & THE MANSON FAMILY (1969, Los Angeles)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'manson-tate-murders-1969',
    name: 'The Manson Family Murders Five People at Sharon Tate\'s Home on Cielo Drive',
    subtitle: '10050 Cielo Drive, Benedict Canyon, Los Angeles. The original house was demolished in 1994; a new house stands on the lot',
    description: 'On the night of 8 August 1969, four members of the Manson Family entered this house here on Cielo Drive and murdered five people, including actress Sharon Tate, who was eight months pregnant. The victims were stabbed dozens of times. The word "Pig" was written in blood on the front door. Charles Manson had ordered the killings to ignite a race war he called "Helter Skelter." The original house was demolished in 1994 and the address changed. The Tate-LaBianca murders ended the 1960s counterculture dream overnight.',
    lat: 34.1008,
    lng: -118.4275,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1969,
    date: '8 August 1969',
    address: '10050 Cielo Drive (demolished), Los Angeles, CA 90077',
    entityIds: [],
  },
  {
    id: 'manson-labianca-murders-1969',
    name: 'The Manson Family Murders Leno and Rosemary LaBianca the Night After the Tate Killings',
    subtitle: '3301 Waverly Drive, Los Feliz, Los Angeles. The house still stands as a private residence',
    description: 'On the night of 10 August 1969, Charles Manson personally entered this house here in the Los Feliz neighborhood and tied up Leno and Rosemary LaBianca before ordering his followers to kill them. "Death to Pigs" and "Healter Skelter" (misspelled) were written in blood on the walls. A fork was left protruding from Leno\'s stomach. The LaBianca murders, combined with the Tate killings the night before, created a panic across Los Angeles. Gun sales doubled. The house remains a private residence.',
    lat: 34.1098,
    lng: -118.2750,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1969,
    date: '10 August 1969',
    address: '3301 Waverly Drive, Los Angeles, CA 90027',
    entityIds: [],
  },
  {
    id: 'manson-spahn-ranch-1969',
    name: 'The Manson Family Squats at an Abandoned Movie Ranch in Chatsworth',
    subtitle: 'Spahn Ranch, 12000 Santa Susana Pass Rd, Chatsworth, CA. Burned in a 1970 wildfire; now open space in Santa Susana Pass State Historic Park',
    description: 'Charles Manson and his followers occupied Spahn Ranch here in the Santa Susana Mountains from 1968 to 1969. The ranch was a former Western movie set owned by 80-year-old George Spahn, who was blind. The Family traded labor and sex for free lodging. Manson held his followers under near-total control, preaching an apocalyptic race war drawn from the Beatles\' White Album. Police raided the ranch on 16 August 1969 for auto theft but did not connect the group to the Tate-LaBianca murders for months. The ranch burned in a wildfire in 1970.',
    lat: 34.2640,
    lng: -118.6320,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'presence',
    year: 1969,
    address: 'Santa Susana Pass Rd, Chatsworth, CA 91311',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DEAN CORLL — "The Candy Man" (1970–1973, Houston, TX)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'corll-boat-shed-1973',
    name: 'Police Find 17 Bodies Buried in a Rented Boat Shed in Southwest Houston',
    subtitle: 'Southwest Boat Storage, 4500 Silver Bell Dr, Houston, TX. The shed was demolished; the area is now developed',
    description: 'On 9 August 1973, police opened a rented boat shed here on Silver Bell Drive in southwest Houston and began digging. They found 17 bodies of teenage boys buried in lime. The shed had been rented by Dean Corll, a 33-year-old electrician known as "the Candy Man" because his family ran a candy factory. Corll had been killed the night before by his own teenage accomplice, David Brooks and Elmer Wayne Henley. In total, 28 victims were found at three sites — the worst serial murder case in U.S. history at the time.',
    lat: 29.6630,
    lng: -95.5280,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1973,
    date: '9 August 1973',
    address: '4500 Silver Bell Dr, Houston, TX (demolished)',
    entityIds: [],
  },
  {
    id: 'corll-killed-pasadena-1973',
    name: 'Teenage Accomplice Elmer Wayne Henley Shoots Dean Corll at His Pasadena House',
    subtitle: '2020 Lamar Dr, Pasadena, TX. The house was demolished; a new residence occupies the lot',
    description: 'In the early hours of 8 August 1973, 17-year-old Elmer Wayne Henley shot and killed Dean Corll here at Corll\'s house in Pasadena after Corll threatened to kill Henley and two friends he had brought over. Henley then called police and told them where to find bodies. Corll had been luring teenage boys to his homes since 1970, using his two teenage accomplices as bait with promises of money, drugs, and parties. The discovery of 28 bodies made it the deadliest serial murder case in U.S. history until Gacy surpassed it five years later.',
    lat: 29.6791,
    lng: -95.1750,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1973,
    date: '8 August 1973',
    address: '2020 Lamar Dr, Pasadena, TX (demolished)',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ALBERT FISH (1924–1934, New York)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'albert-fish-budd-murder-1928',
    name: 'Albert Fish Lures 10-Year-Old Grace Budd to a Cottage in Westchester and Murders Her',
    subtitle: 'Wisteria Cottage, Mountain Rd, Worthington (now Irvington), NY. The cottage was demolished',
    description: 'On 3 June 1928, Albert Fish — a 58-year-old house painter — took 10-year-old Grace Budd from her Manhattan home under the pretense of a birthday party and brought her here to an abandoned cottage called Wisteria in Westchester County. He murdered her and left her remains in the woods. Six years later, Fish sent an anonymous letter to Grace\'s mother describing the crime in graphic detail. The letter was traced to a boarding house flophouse, where Fish was arrested. He confessed to at least three child murders and was executed at Sing Sing in 1936.',
    lat: 41.0391,
    lng: -73.8657,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'documented',
    accuracy: 'approximate',
    kind: 'event',
    year: 1928,
    date: '3 June 1928',
    address: 'Mountain Rd, Irvington, NY (cottage demolished)',
    entityIds: [],
  },
  {
    id: 'albert-fish-executed-sing-sing-1936',
    name: 'Albert Fish Is Electrocuted at Sing Sing Prison at Age 65',
    subtitle: 'Sing Sing Correctional Facility, 354 Hunter St, Ossining, NY. The prison still operates; the old death house was demolished',
    description: 'On 16 January 1936, Albert Fish was electrocuted here at Sing Sing Prison in Ossining. He reportedly walked to the electric chair eagerly and helped the guards adjust the electrodes. Fish had confessed to molesting over 400 children across 23 states and murdering at least three. His trial featured testimony about extreme self-mutilation — X-rays showed 29 needles embedded in his pelvis. He remains one of the most disturbing criminals in American history. The jury deliberated for less than an hour.',
    lat: 41.1530,
    lng: -73.8618,
    type: 'historical_site',
    importance: 'minor',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1936,
    date: '16 January 1936',
    address: '354 Hunter St, Ossining, NY 10562',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SAMUEL LITTLE — Most Prolific Serial Killer in U.S. History (1970–2005)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'samuel-little-confesses-2018',
    name: 'Samuel Little Confesses to 93 Murders from a Texas Prison Cell — the FBI Confirms Over 60',
    subtitle: 'Ector County Detention Center, 2500 S US 385, Odessa, TX. Active jail facility',
    description: 'In 2018, while imprisoned here at the Ector County Detention Center in Odessa, Texas, 78-year-old Samuel Little began confessing to murders spanning 35 years and 19 states. He drew portraits of his victims from memory with startling accuracy. The FBI eventually confirmed over 60 of his confessions, making him the most prolific serial killer in American history. Little had been arrested and released dozens of times over decades. He targeted vulnerable women — often sex workers, addicts, or homeless — whose disappearances drew little attention. He died in prison on 30 December 2020.',
    lat: 31.8302,
    lng: -102.3486,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 2018,
    address: '2500 S US 385, Odessa, TX 79766',
    entityIds: [],
  },
  {
    id: 'samuel-little-convicted-la-2014',
    name: 'Samuel Little Is Convicted of Three 1987 Murders in Los Angeles After a DNA Cold Hit',
    subtitle: 'Clara Shortridge Foltz Criminal Justice Center, 210 W Temple St, Los Angeles. The courthouse is active',
    description: 'On 25 September 2014, Samuel Little was convicted here at the downtown Los Angeles courthouse of three murders dating to 1987 — women strangled and dumped in alleys in south Los Angeles. Little had been a suspect in the 1980s but was released for lack of evidence. A 2012 DNA match from a narcotics arrest in Kentucky finally tied him to the cold cases. Little was 74 at conviction. The three murders he was sentenced for were a fraction of what investigators would later learn: he eventually confessed to 93 killings across three decades.',
    lat: 34.0548,
    lng: -118.2468,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 2014,
    address: '210 W Temple St, Los Angeles, CA 90012',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // THE HILLSIDE STRANGLERS — Angelo Buono & Kenneth Bianchi (1977–1978, Los Angeles)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'hillside-strangler-buono-shop-1977',
    name: 'The "Hillside Stranglers" Use an Auto Upholstery Shop as Their Torture Site',
    subtitle: '703 E Colorado St, Glendale, CA. The building was demolished; the site is redeveloped',
    description: 'Between October 1977 and February 1978, cousins Angelo Buono and Kenneth Bianchi lured ten young women and girls to Buono\'s auto upholstery shop here on Colorado Street in Glendale. They tortured, raped, and strangled the victims, then dumped the bodies on hillsides around Los Angeles. The nude bodies displayed along roads and freeways terrorized the city. Bianchi was caught after moving to Bellingham, Washington, where he killed two more women. He implicated Buono in a plea deal. Buono died in prison in 2002; Bianchi remains incarcerated.',
    lat: 34.1459,
    lng: -118.2459,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'documented',
    accuracy: 'approximate',
    kind: 'presence',
    year: 1977,
    address: '703 E Colorado St, Glendale, CA 91205 (demolished)',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DAVID BERKOWITZ — "Son of Sam" additional moment
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'son-of-sam-captured-yonkers-1977',
    name: 'David Berkowitz Is Arrested Outside His Yonkers Apartment After a Parking Ticket Cracks the Case',
    subtitle: '35 Pine St, Yonkers, NY. The apartment building still stands',
    description: 'On 10 August 1977, police arrested David Berkowitz here outside his apartment at 35 Pine Street in Yonkers. The break came from a parking ticket issued near the scene of his final shooting — one of 10,000 leads that investigators had to run down. When officers arrived, they found a .44 caliber Bulldog revolver on his car seat and a duffel bag of ammunition. Berkowitz smiled and said, "Well, you got me." Over 13 months, his shootings of young couples parked in cars had paralyzed New York City and spawned the largest manhunt in NYPD history.',
    lat: 40.9316,
    lng: -73.8985,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1977,
    date: '10 August 1977',
    address: '35 Pine St, Yonkers, NY 10701',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // WAYNE WILLIAMS — Atlanta Child Murders (1979–1981)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'atlanta-child-murders-bridge-1981',
    name: 'Police Staking Out the Chattahoochee River Bridge Hear a Splash and Stop Wayne Williams',
    subtitle: 'James Jackson Pkwy bridge over Chattahoochee River, Atlanta, GA. The bridge still carries traffic',
    description: 'In the early hours of 22 May 1981, FBI agents and police staking out this bridge over the Chattahoochee River here heard a loud splash. They stopped Wayne Williams, a 23-year-old aspiring music promoter, driving away from the bridge. Two days later, the body of 27-year-old Nathaniel Cater surfaced downstream. Between 1979 and 1981, at least 28 African American children and young adults were murdered in Atlanta. Williams was convicted of two adult murders and linked by fiber evidence to many others. The case remains controversial — some victims\' families dispute his guilt.',
    lat: 33.8115,
    lng: -84.4610,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1981,
    date: '22 May 1981',
    address: 'James Jackson Pkwy bridge, Atlanta, GA 30318',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // JOHN ALLEN MUHAMMAD & LEE BOYD MALVO — D.C. Snipers (2002)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'dc-sniper-first-shooting-2002',
    name: 'A Sniper Kills Five Strangers in 15 Hours Across the D.C. Suburbs',
    subtitle: 'Various locations, Montgomery County, MD. The shootings occurred at gas stations, parking lots, and bus stops',
    description: 'On 3 October 2002, five people were shot dead in 15 hours across Montgomery County, Maryland — at a grocery store, a gas station, a post office, a bus stop, and a vacuum shop. Each victim was killed by a single rifle shot from long range while performing ordinary tasks. Over the next three weeks, John Allen Muhammad and 17-year-old Lee Boyd Malvo killed 10 people and wounded 3 others across Maryland, Virginia, and D.C. They fired from a hole cut in the trunk of a 1990 Chevrolet Caprice. The randomness of the attacks paralyzed the capital region for 23 days.',
    lat: 39.0836,
    lng: -77.1528,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'general-area',
    kind: 'event',
    year: 2002,
    date: '3 October 2002',
    address: 'Montgomery County, MD',
    entityIds: [],
  },
  {
    id: 'dc-sniper-captured-rest-stop-2002',
    name: 'The D.C. Snipers Are Found Sleeping in Their Car at a Maryland Rest Stop',
    subtitle: 'Myersville rest area, I-70, Myersville, MD. The rest area still operates along the interstate',
    description: 'At 3:19 AM on 24 October 2002, police surrounded a blue 1990 Chevrolet Caprice here at a rest stop on I-70 near Myersville, Maryland, and arrested John Allen Muhammad and Lee Boyd Malvo as they slept. The car had been converted into a mobile sniper platform — a hole cut above the license plate allowed Malvo to fire a Bushmaster rifle from the trunk. A tip from a phone call led to the car\'s identification. Muhammad was executed in 2009. Malvo, who was 17 during the shootings, received multiple life sentences.',
    lat: 39.5047,
    lng: -77.5681,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 2002,
    date: '24 October 2002',
    address: 'I-70 rest area, Myersville, MD 21773',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // JACK THE RIPPER (1888, London) — International
  // ═══════════════════════════════════════════════════════════════════════

  // NOTE: Jack the Ripper entity already exists in the database as 'jack-the-ripper'.
  // Check if moments already exist before adding.

  {
    id: 'ripper-mary-kelly-millers-court-1888',
    name: 'Jack the Ripper\'s Final and Most Gruesome Murder Occurs in a Rented Room Off Dorset Street',
    subtitle: '13 Miller\'s Court, 26 Dorset St, Spitalfields, London. Demolished; a car park occupies the site',
    description: 'On 9 November 1888, the body of Mary Jane Kelly was found here in a rented room at 13 Miller\'s Court, off Dorset Street in Spitalfields. She was the fifth and final canonical victim of Jack the Ripper, and the only one killed indoors. The scene was so horrific that the first officer on the scene reportedly never fully recovered. The Ripper\'s identity remains unknown despite over a century of investigation and hundreds of suspects. The murders created the modern true-crime genre and turned Whitechapel into the most notorious neighborhood in Victorian London.',
    lat: 51.5175,
    lng: -0.0748,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 1888,
    date: '9 November 1888',
    address: '26 Dorset St (demolished), Spitalfields, London E1',
    entityIds: ['jack-the-ripper'],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ANDREI CHIKATILO — "The Butcher of Rostov" (1978–1990, Soviet Union) — International
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'chikatilo-rostov-station-1978',
    name: 'Andrei Chikatilo Commits His First Murder Near the Rostov Railway Station',
    subtitle: 'Near Rostov-on-Don railway station, Russia. The industrial area along the Don River remains',
    description: 'On 22 December 1978, Andrei Chikatilo lured a 9-year-old girl to a dilapidated house he had secretly purchased near the railway station here in Rostov-on-Don. He murdered her and dumped her body in the Grushyovka River. Another man was convicted and executed for the crime. Chikatilo, a schoolteacher with a university degree, went on to murder at least 52 women and children over 12 years, luring victims from railway stations across southern Russia. Soviet police incompetence and the refusal to acknowledge serial killing as a phenomenon allowed him to continue for over a decade.',
    lat: 47.2224,
    lng: 39.7187,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'documented',
    accuracy: 'approximate',
    kind: 'event',
    year: 1978,
    date: '22 December 1978',
    address: 'Near Rostov-Glavny railway station, Rostov-on-Don, Russia',
    entityIds: [],
  },
  {
    id: 'chikatilo-captured-1990',
    name: 'Andrei Chikatilo Is Finally Arrested After a 12-Year Manhunt Across Southern Russia',
    subtitle: 'Novocherkassk, Rostov Oblast, Russia. Chikatilo was arrested outside a cafe near a railway station',
    description: 'On 20 November 1990, police arrested Andrei Chikatilo here near a railway station in Novocherkassk after an undercover officer observed him approaching children. He had been questioned and released in 1984 when his blood type appeared not to match crime scene evidence — a rare genetic anomaly meant his blood and semen were different types. Over 12 years, he killed at least 52 people, mostly along railway lines in southern Russia. His trial in 1992 was held inside a cage. He was executed by a single gunshot on 14 February 1994.',
    lat: 47.4160,
    lng: 40.0935,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'documented',
    accuracy: 'approximate',
    kind: 'event',
    year: 1990,
    date: '20 November 1990',
    address: 'Novocherkassk, Rostov Oblast, Russia',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PEDRO LOPEZ — "The Monster of the Andes" (1969–1980, South America) — International
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'pedro-lopez-captured-ambato-1980',
    name: 'Pedro Lopez Is Captured in Ecuador After a Flash Flood Exposes a Mass Grave',
    subtitle: 'Near Ambato, Tungurahua Province, Ecuador. The market town sits in the Ecuadorian highlands',
    description: 'In March 1980, a flash flood near Ambato, Ecuador, exposed the remains of four missing girls in a shallow grave. Shortly after, Pedro Lopez was caught trying to abduct a girl from the local market. Under interrogation, he confessed to murdering over 300 girls across Colombia, Ecuador, and Peru since the early 1970s. He led police to 53 graves in Ecuador alone. Dubbed "the Monster of the Andes," Lopez is considered one of the most prolific serial killers in recorded history. He was released from an Ecuadorian psychiatric hospital in 1998 and his current whereabouts are unknown.',
    lat: -1.2490,
    lng: -78.6268,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'documented',
    accuracy: 'general-area',
    kind: 'event',
    year: 1980,
    address: 'Near Ambato, Tungurahua Province, Ecuador',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // HAROLD SHIPMAN — "Dr. Death" (1975–1998, England) — International
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'shipman-practice-hyde-1998',
    name: 'A Concerned Colleague Reports Dr. Harold Shipman, Triggering History\'s Largest Murder Investigation',
    subtitle: '21 Market St, Hyde, Greater Manchester, England. The building is now a different business; the surgery was closed',
    description: 'Dr. Harold Shipman practiced here at 21 Market Street in Hyde, a small town east of Manchester, where he was one of the most popular GPs in the area. In March 1998, fellow physician Linda Reynolds reported concerns about the high death rate among his elderly female patients. Investigation revealed Shipman had been injecting patients with lethal doses of diamorphine (heroin), then falsifying death certificates. A public inquiry concluded he killed at least 218 patients between 1975 and 1998, making him the most prolific serial killer in modern history. He hanged himself in prison on 13 January 2004.',
    lat: 53.4520,
    lng: -2.0815,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'presence',
    year: 1998,
    address: '21 Market St, Hyde, Greater Manchester SK14 1HE, England',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // JEFFREY DAHMER — Additional moment (arrest)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'dahmer-arrested-1991',
    name: 'A Man Escapes Jeffrey Dahmer\'s Apartment in Handcuffs and Flags Down Police',
    subtitle: '924 N 25th St (Oxford Apartments, demolished), Milwaukee, WI. Now a vacant lot',
    description: 'On 22 July 1991, Tracy Edwards flagged down a Milwaukee police car here on 25th Street with a handcuff dangling from his wrist. He led officers to Apartment 213 of the Oxford Apartments, where Jeffrey Dahmer had held him for hours. Inside, police found Polaroid photographs of dismembered bodies, a human head in the refrigerator, and a 57-gallon drum containing decomposing remains. Dahmer confessed to murdering 17 men and boys since 1978. The building was demolished in 1992. The lot remains vacant — no developer has built on it.',
    lat: 43.0443,
    lng: -87.9340,
    type: 'crime_scene',
    importance: 'major',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1991,
    date: '22 July 1991',
    address: '924 N 25th St (demolished), Milwaukee, WI 53233',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // GARY HEIDNIK (1986–1987, Philadelphia)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'heidnik-house-of-horrors-1987',
    name: 'Police Rescue Three Women from Gary Heidnik\'s Basement in North Philadelphia',
    subtitle: '3520 N Marshall St, Philadelphia, PA. The house still stands in a residential area',
    description: 'On 24 March 1987, police entered this row house here on North Marshall Street in Philadelphia and found three women chained in the basement. Gary Heidnik had kidnapped six women between November 1986 and March 1987, holding them in a pit he had dug in the cellar. Two died in captivity. One survivor, Josefina Rivera, convinced Heidnik to let her leave briefly, then led police back to the house. Heidnik\'s crimes reportedly inspired the character of Buffalo Bill in Thomas Harris\'s novel "The Silence of the Lambs." Heidnik was executed in 1999.',
    lat: 39.9915,
    lng: -75.1448,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1987,
    date: '24 March 1987',
    address: '3520 N Marshall St, Philadelphia, PA 19140',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // JOHN LIST (1971, Westfield, NJ)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'john-list-breeze-knoll-1971',
    name: 'John List Murders His Entire Family in Their Mansion and Disappears for 18 Years',
    subtitle: '431 Hillside Ave (Breeze Knoll), Westfield, NJ. The mansion burned in 1972; a new house stands on the lot',
    description: 'On 9 November 1971, accountant John List methodically shot his mother, wife, and three children here in their 19-room Victorian mansion called Breeze Knoll in Westfield, New Jersey. He arranged the bodies on sleeping bags in the ballroom, turned on the radio to a religious station, then disappeared. The bodies were not found for a month. List lived under a false identity in Virginia for 18 years until a 1989 "America\'s Most Wanted" segment featured a forensic sculpture of what he might look like. A neighbor recognized him. The mansion burned under suspicious circumstances in 1972.',
    lat: 40.6585,
    lng: -74.3545,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'verified',
    accuracy: 'exact',
    kind: 'event',
    year: 1971,
    date: '9 November 1971',
    address: '431 Hillside Ave, Westfield, NJ 07090 (mansion burned 1972)',
    entityIds: [],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ISRAEL KEYES (2001–2012, Alaska/nationwide)
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'israel-keyes-abduction-anchorage-2012',
    name: 'Israel Keyes Abducts a Barista from a Coffee Stand in Anchorage, Leading to His Capture',
    subtitle: 'Common Grounds coffee stand, 12600 Old Seward Hwy, Anchorage, AK. The stand has been moved',
    description: 'On 1 February 2012, Israel Keyes abducted 18-year-old Samantha Koenig from this drive-through coffee stand here on Old Seward Highway in Anchorage. He murdered her and then used her debit card and staged a photo to demand ransom from her family. FBI agents traced the card usage across the country and arrested Keyes at a traffic stop in Texas on 13 March. Keyes was unlike any serial killer profilers had encountered: he buried "murder kits" across the country years in advance and traveled thousands of miles to kill strangers with no connection to him. He confessed to multiple murders, then killed himself in his Anchorage jail cell on 2 December 2012.',
    lat: 61.1489,
    lng: -149.8680,
    type: 'crime_scene',
    importance: 'minor',
    verificationLevel: 'verified',
    accuracy: 'approximate',
    kind: 'event',
    year: 2012,
    date: '1 February 2012',
    address: '12600 Old Seward Hwy, Anchorage, AK 99515',
    entityIds: [],
  },
];
