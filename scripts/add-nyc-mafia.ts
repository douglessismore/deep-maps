/**
 * Add NYC Mafia story with 20 most notable moments + key entities
 * Source: OddStops.com (coords offset ~1m)
 * Run: npx tsx scripts/add-nyc-mafia.ts
 */
import * as fs from 'fs';

const moments = [
  {
    id: 'nyc-anastasia-barber',
    name: 'Gunmen Execute Albert Anastasia in a Midtown Barber Chair as He Attacks Their Reflections in the Mirror',
    subtitle: '870 7th Ave (Park Sheraton Hotel), Manhattan. The barber shop is now a Starbucks inside the Park Central Hotel',
    description: 'On 25 October 1957, Albert Anastasia sat in chair No. 4 at Arthur Grasso\'s barber shop here in the Park Sheraton Hotel, his eyes closed under hot towels. Two gunmen with scarves over their faces walked in and opened fire. Anastasia lunged at them — but in his confusion attacked their reflections in the mirror. The boss of Murder, Inc., responsible for an estimated 1,000 contract killings, collapsed on the tile floor. His bodyguard had conveniently stepped away. The hit was orchestrated by Vito Genovese and Carlo Gambino.',
    lat: 40.764463, lng: -73.981044, type: 'crime_scene', importance: 'major' as const, notability: 65,
    accuracy: 'exact', kind: 'event', year: 1957, date: '25 October 1957',
    address: '870 7th Avenue, Manhattan, NY 10019',
    entityIds: ['albert-anastasia', 'carlo-gambino'],
    geoVerified: true,
  },
  {
    id: 'nyc-sparks-castellano',
    name: 'Paul Castellano Is Shot Dead Outside Sparks Steak House While John Gotti Watches from a Parked Car',
    subtitle: '210 E 46th St, Manhattan. Sparks Steak House still operates at this location',
    description: 'On 16 December 1985, three gunmen in trench coats and fur hats waited outside Sparks Steak House here on East 46th Street. As Gambino boss Paul Castellano and underboss Thomas Bilotti stepped from their Lincoln, the shooters opened fire. Castellano collapsed beside a lamppost; Bilotti fell in the street. John Gotti and Sammy Gravano sat in a parked car at 3rd Avenue watching. In thirty seconds, Gotti had seized control of the most powerful crime family in America.',
    lat: 40.753045, lng: -73.971989, type: 'crime_scene', importance: 'major' as const, notability: 70,
    accuracy: 'exact', kind: 'event', year: 1985, date: '16 December 1985',
    address: '210 East 46th Street, Manhattan, NY 10017',
    entityIds: ['john-gotti', 'paul-castellano'],
    geoVerified: true,
  },
  {
    id: 'nyc-ravenite-club',
    name: 'FBI Bugs an Upstairs Apartment at the Ravenite Social Club and Records John Gotti Discussing Murders',
    subtitle: '247 Mulberry St, Little Italy. Now Descendant of Thieves menswear; 120 ft south of Prince St',
    description: 'The Ravenite Social Club here on Mulberry Street served as Gambino family headquarters from the 1950s through Anastasia, Gambino, Dellacroce, and Gotti. Every Wednesday night, Gotti summoned his capos. The FBI planted cameras in 1988 but mobsters blasted a radio and ran a white noise machine. The breakthrough came when agents bugged apartment 10 upstairs — a widow\'s unit where Gotti snuck to talk business. On 11 December 1990, agents raided and arrested Gotti. Gravano flipped after hearing tapes of Gotti disparaging him.',
    lat: 40.723068, lng: -73.995930, type: 'government', importance: 'major' as const, notability: 60,
    accuracy: 'exact', kind: 'event', year: 1990, date: '11 December 1990',
    address: '247 Mulberry Street, Manhattan, NY 10012',
    entityIds: ['john-gotti'],
    geoVerified: true,
  },
  {
    id: 'nyc-umbertos-gallo',
    name: 'Joe "Crazy Joe" Gallo Is Shot Dead at His 43rd Birthday Dinner at Umberto\'s Clam House',
    subtitle: '129 Mulberry St at Hester St, Little Italy. Now Da Gennaro restaurant; Umberto\'s relocated twice',
    description: 'In the early hours of 7 April 1972, Joe Gallo was celebrating his 43rd birthday here at Umberto\'s Clam House with family and his bodyguard. Three gunmen entered and opened fire. Gallo yelled obscenities, tried to shoot back, was hit multiple times, staggered outside and collapsed dead on the street. The murder remains officially unsolved. Gallo was believed to have participated in the Anastasia hit and had sparked the First Colombo War. The Colombo family is widely suspected of ordering his death.',
    lat: 40.718266, lng: -73.997974, type: 'crime_scene', importance: 'major' as const, notability: 55,
    accuracy: 'exact', kind: 'event', year: 1972, date: '7 April 1972',
    address: '129 Mulberry Street, Manhattan, NY 10013',
    entityIds: ['albert-anastasia'],
    geoVerified: true,
  },
  {
    id: 'nyc-galante-joemary',
    name: 'Carmine "The Cigar" Galante Is Gunned Down on a Restaurant Patio with the Cigar Still in His Mouth',
    subtitle: '205 Knickerbocker Ave, Bushwick, Brooklyn. The restaurant is shuttered; near Maria Hernandez Park',
    description: 'On 12 July 1979, Carmine Galante sat eating lunch on the outdoor patio of Joe and Mary\'s Italian-American Restaurant here on Knickerbocker Avenue. Three hitmen in ski masks entered through the back and opened fire. Galante absorbed over 80 rounds. When police arrived, the cigar was still hanging from his mouth. His two bodyguards stood by unharmed — they were in on it. Galante had seized the Bonanno family without Commission sanction and was trying to unite all Five Families under his control. The Commission ordered his death.',
    lat: 40.703536, lng: -73.926393, type: 'crime_scene', importance: 'major' as const, notability: 55,
    accuracy: 'exact', kind: 'event', year: 1979, date: '12 July 1979',
    address: '205 Knickerbocker Avenue, Brooklyn, NY 11237',
    geoVerified: true,
  },
  {
    id: 'nyc-gemini-lounge',
    name: 'The DeMeo Crew Murders and Dismembers an Estimated 200 People at the Gemini Lounge',
    subtitle: '4021 Flatlands Ave at Troy Ave, Brooklyn. Now Purpose Life Church',
    description: 'Throughout the 1970s and early 1980s, this nondescript bar here on Flatlands Avenue served as the Gambino family\'s most prolific killing floor. Roy DeMeo\'s crew lured victims through a side door, shot them with a silenced pistol, wrapped a towel around the wound to contain blood, stabbed the heart to stop circulation, then dismembered the body in the bathtub. Parts were boxed and dumped at the Fountain Avenue landfill. The crew refined this into a routine they used an estimated 100 to 200 times.',
    lat: 40.622805, lng: -73.933336, type: 'crime_scene', importance: 'major' as const, notability: 55,
    accuracy: 'exact', kind: 'event', year: 1980, date: '1970s–1983',
    address: '4021 Flatlands Avenue, Brooklyn, NY 11234',
    geoVerified: true,
  },
  {
    id: 'nyc-gotti-house',
    name: 'John Gotti Lives in a Modest Howard Beach Home While Running the Gambino Empire',
    subtitle: '160-11 85th St, Howard Beach, Queens. Private residence; reporters regularly camped outside',
    description: 'From this modest 2,430-square-foot house here in Howard Beach, John Gotti ran the most powerful crime family in America. Camera crews camped on the sidewalk. Neighbors treated him like a celebrity. On 18 March 1980, neighbor John Favara accidentally killed Gotti\'s 12-year-old son Frank with his car. Victoria Gotti attacked Favara with a baseball bat. Four months later, Favara was abducted and murdered — his body was never found. Gotti lived here until his arrest in 1990. He died in prison in 2002.',
    lat: 40.656078, lng: -73.846572, type: 'residence', importance: 'major' as const, notability: 60,
    accuracy: 'exact', kind: 'event', year: 1985, date: '1985–1990',
    address: '160-11 85th Street, Queens, NY 11414',
    entityIds: ['john-gotti'],
    geoVerified: true,
  },
  {
    id: 'nyc-castellano-mansion',
    name: 'Paul Castellano Builds a 17-Bathroom Mansion the FBI Bugs by Posing as a Cable Technician',
    subtitle: '177 Benedict Rd, Todt Hill, Staten Island. Private residence; sold for $3.1M in 2000',
    description: 'Paul Castellano commissioned this 10,436-square-foot mansion here on Todt Hill in 1976, completing it in 1980. It had 8 bedrooms, 17 bathrooms, a 13-car garage, and Carrara marble interiors. Mobsters called it "the White House." Castellano summoned capos here to give orders, but his reclusive style alienated the family. The FBI bugged his dining room by having an agent pose as a cable TV technician. The recordings helped build the case that eventually led to Gotti orchestrating his murder outside Sparks Steak House.',
    lat: 40.595026, lng: -74.106501, type: 'residence', importance: 'major' as const, notability: 50,
    accuracy: 'exact', kind: 'event', year: 1980, date: '1976–1985',
    address: '177 Benedict Road, Staten Island, NY 10304',
    entityIds: ['paul-castellano'],
    geoVerified: true,
  },
  {
    id: 'nyc-luciano-home',
    name: 'Lucky Luciano Grows Up on East 10th Street and Invents the Modern American Mafia',
    subtitle: '265 E 10th St, East Village, Manhattan. The 1900 residential building still stands',
    description: 'The Lucania family settled here on East 10th Street in 1906 after emigrating from Sicily. Young Salvatore — later Charles "Lucky" Luciano — was shoplifting by age 10 and running a street gang by 14, extorting Jewish immigrants for protection money. He rose through Prohibition bootlegging, betrayed boss Joe Masseria in 1931 by having him shot at a Coney Island restaurant, then killed successor Salvatore Maranzano five months later. He established the Commission — the governing body of the Five Families — a structure that endured for 70 years.',
    lat: 40.728396, lng: -73.983253, type: 'residence', importance: 'major' as const, notability: 60,
    accuracy: 'exact', kind: 'event', year: 1906, date: '1906–1936',
    address: '265 East 10th Street, Manhattan, NY 10009',
    entityIds: ['lucky-luciano'],
    geoVerified: true,
  },
  {
    id: 'nyc-gambino-house',
    name: 'Carlo Gambino Rules All Five Families from a Modest Brooklyn Home Until His Death',
    subtitle: '2230 Ocean Pkwy, Gravesend, Brooklyn. Private residence; 90 yards south of Ocean Pkwy and Ave V',
    description: 'From this unassuming 2,724-square-foot house here on Ocean Parkway, Carlo Gambino quietly controlled the most powerful crime family in New York for two decades. He had conspired with Vito Genovese to murder boss Albert Anastasia in 1957, then took over. An illegal immigrant from Palermo who arrived as a stowaway in 1921, Gambino avoided the flashy lifestyle that drew FBI attention. He died of heart disease here on 15 October 1976, naming brother-in-law Paul Castellano as his successor over underboss Aniello Dellacroce — a decision that split the family and led to Castellano\'s assassination nine years later.',
    lat: 40.594958, lng: -73.965448, type: 'residence', importance: 'major' as const, notability: 55,
    accuracy: 'exact', kind: 'event', year: 1976, date: '1957–1976',
    address: '2230 Ocean Parkway, Brooklyn, NY 11223',
    entityIds: ['carlo-gambino'],
    geoVerified: true,
  },
  {
    id: 'nyc-the-hole',
    name: 'FBI Excavates a Desolate Queens Lot and Finds Two Bonanno Captains Buried for 23 Years',
    subtitle: 'Ruby St between Blake Ave and Dumont Ave, Queens/Brooklyn border. Paved-over lot with RV trailers',
    description: 'This desolate five-block area straddling the Brooklyn-Queens border sits 30 feet below its surroundings and floods regularly. On 5 May 1981, Bonanno captain Joseph Massino lured three rival capos here and had them killed. John Gotti\'s crew buried the bodies as a favor. Children found one body ten days later — a tattooed arm poking from the mud. The other two were not found until October 2004, when Massino turned state witness and FBI backhoes dug for three weeks. The Hole is also suspected as the burial site of John Favara, whose body was never recovered.',
    lat: 40.672210, lng: -73.860381, type: 'crime_scene', importance: 'major' as const, notability: 50,
    accuracy: 'approximate', kind: 'event', year: 1981, date: '5 May 1981',
    address: 'Ruby Street, Queens, NY 11414',
    entityIds: ['john-gotti'],
    geoVerified: true,
  },
  {
    id: 'nyc-triangle-club',
    name: 'Vincent "The Chin" Gigante Wanders Greenwich Village in Pajamas to Fake Mental Illness for Seven Years',
    subtitle: '208 Sullivan St, Greenwich Village. Now a tea and spice shop; just north of Bleecker St',
    description: 'The Triangle Social Club here on Sullivan Street was the real headquarters of the Genovese family — the Greenwich Village Crew that grossed $100 million a year behind white-painted windows. Boss Vincent Gigante sat inside playing cards daily. Outside, he wandered the neighborhood in pajamas and a bathrobe, mumbling and staring blankly, a bodyguard trailing behind. The act — which earned him the nickname "The Oddfather" — delayed federal prosecution for seven years. In 2003, the FBI obtained video of him behaving lucidly and forced his confession.',
    lat: 40.729176, lng: -74.000241, type: 'crime_scene', importance: 'major' as const, notability: 55,
    accuracy: 'exact', kind: 'event', year: 1981, date: '1981–2003',
    address: '208 Sullivan Street, Manhattan, NY 10012',
    geoVerified: true,
  },
  {
    id: 'nyc-bergin-club',
    name: 'John Gotti Runs the Bergin Hunt and Fish Club and Hosts Annual Fourth of July Fireworks for the Neighborhood',
    subtitle: '98-04 101st Ave at 98th St, Ozone Park, Queens. Now a church and bubble tea store',
    description: 'This storefront here on 101st Avenue in Ozone Park served as Gambino family headquarters from the 1960s. Carmine Fatico ran it first; Gotti took over in 1977. Every Fourth of July, Gotti threw an enormous barbecue with professional fireworks for the neighborhood — the Don as benefactor. The FBI found a listening device here in July 1988. The club operated until roughly 2005, outlasting Gotti\'s death by three years. Today, the space is split between a Christian church and a bubble tea shop.',
    lat: 40.684991, lng: -73.843107, type: 'crime_scene', importance: 'minor' as const, notability: 45,
    accuracy: 'exact', kind: 'event', year: 1977, date: '1977–2005',
    address: '98-04 101st Avenue, Queens, NY 11416',
    entityIds: ['john-gotti'],
    geoVerified: true,
  },
  {
    id: 'nyc-motion-lounge',
    name: 'FBI Agent "Donnie Brasco" Infiltrates the Bonanno Family Through the Motion Lounge in Williamsburg',
    subtitle: '420 Graham Ave at Withers St, Williamsburg, Brooklyn',
    description: 'FBI agent Joseph Pistone spent six years as "Donnie Brasco" infiltrating the Bonanno family, and this bar here on Graham Avenue was his way in. Owner Dominick "Sonny Black" Napolitano, who kept pigeon coops on the roof above, brought Brasco deeper into the family — nearly making him. When the FBI ended the operation in July 1981, agents showed Napolitano photos of the real Pistone. Napolitano knew he was dead. He handed his jewelry to a bartender. On 17 August, he was summoned to a meeting and murdered. His body was found a year later in a bag on Staten Island, hands severed.',
    lat: 40.717479, lng: -73.944712, type: 'crime_scene', importance: 'major' as const, notability: 55,
    accuracy: 'exact', kind: 'event', year: 1981, date: '1976–1981',
    address: '420 Graham Avenue, Brooklyn, NY 11211',
    geoVerified: true,
  },
  {
    id: 'nyc-roberts-lounge',
    name: 'Jimmy Burke Plans the $5.85 Million Lufthansa Heist from Robert\'s Lounge in South Ozone Park',
    subtitle: '114-45 Lefferts Blvd, South Ozone Park, Queens. Now GT Kingston karaoke bar',
    description: 'This Lucchese family hangout here on Lefferts Boulevard was the planning headquarters for the infamous Lufthansa heist — the largest cash robbery in American history at the time. In December 1978, Jimmy "The Gent" Burke\'s crew stole $5.85 million from the Lufthansa cargo terminal at JFK airport. Burke renamed the bar "South Side Inn" afterward to avoid attention. Nearly everyone involved in the heist was subsequently murdered. Henry Hill became an FBI informant, and his testimony brought down capo Paul Vario and inspired the film Goodfellas.',
    lat: 40.677530, lng: -73.819668, type: 'crime_scene', importance: 'major' as const, notability: 55,
    accuracy: 'exact', kind: 'event', year: 1978, date: 'December 1978',
    address: '114-45 Lefferts Boulevard, Queens, NY 11420',
    geoVerified: true,
  },
  {
    id: 'nyc-decicco-carbomb',
    name: 'A C4 Car Bomb Kills Gambino Underboss Frank DeCicco on a Brooklyn Street',
    subtitle: '1455 86th St, Bensonhurst, Brooklyn. Now an AutoZone; Veterans & Friends club was across the street',
    description: 'On 13 April 1986, Genovese hitman Herbert Pate detonated a remote C4 car bomb here on 86th Street as Frank DeCicco sat in his Buick. The blast turned the car into a fireball. DeCicco, who had helped Gotti assassinate Castellano four months earlier, was killed instantly. Lucchese soldier Frank Bellino, standing nearby, was severely injured — Pate may have mistaken him for Gotti. The hit was ordered by Genovese boss Vincent Gigante as revenge for the unsanctioned Castellano murder. Gotti survived only because he changed plans at the last moment.',
    lat: 40.612009, lng: -74.010251, type: 'crime_scene', importance: 'major' as const, notability: 50,
    accuracy: 'exact', kind: 'event', year: 1986, date: '13 April 1986',
    address: '1455 86th Street, Brooklyn, NY 11228',
    entityIds: ['john-gotti'],
    geoVerified: true,
  },
  {
    id: 'nyc-cali-murder',
    name: 'A Conspiracy Theorist Shoots Gambino Boss Frank Cali Outside His Staten Island Home',
    subtitle: '25 Hilltop Terrace, Todt Hill, Staten Island. Private residence',
    description: 'On 13 March 2019, Anthony Comello crashed his pickup truck into Frank Cali\'s Cadillac Escalade parked outside this house on Hilltop Terrace. Cali came out, they spoke briefly and shook hands, then Comello shot him multiple times when Cali turned to go inside. But this was no mob hit — Comello was a paranoid conspiracy theorist who believed the CIA had infiltrated the Gambino family. He was deemed mentally unfit in 2020. Cali, who had become boss around 2015, was known as a "ghost" who maintained the lowest profile of any modern Gambino leader.',
    lat: 40.591225, lng: -74.108857, type: 'crime_scene', importance: 'minor' as const, notability: 45,
    accuracy: 'exact', kind: 'event', year: 2019, date: '13 March 2019',
    address: '25 Hilltop Terrace, Staten Island, NY 10304',
    geoVerified: true,
  },
  {
    id: 'nyc-palma-boys',
    name: 'FBI Plants a Bug in Fat Tony Salerno\'s East Harlem Social Club and Records a Year of Mob Business',
    subtitle: '416 E 115th St, East Harlem. Four-story tenement; used by Scorsese for The Irishman',
    description: 'In June 1983, the FBI planted a listening device inside the Palma Boys Social Club here on East 115th Street — headquarters of Anthony "Fat Tony" Salerno, the most powerful Genovese capo. For over a year, agents recorded dozens of conversations about gambling, loansharking, and racketeering. What they did not know was that Salerno was only a front boss — the real power was Vincent "The Chin" Gigante, wandering Greenwich Village in his pajamas. Salerno was indicted in the 1985 Mafia Commission Trial and sentenced to 100 years. He died in prison in 1992.',
    lat: 40.794981, lng: -73.935301, type: 'crime_scene', importance: 'major' as const, notability: 50,
    accuracy: 'exact', kind: 'event', year: 1985, date: '1983–1985',
    address: '416 East 115th Street, Manhattan, NY 10029',
    geoVerified: true,
  },
  {
    id: 'nyc-demeo-body',
    name: 'Roy DeMeo\'s Own Crew Murders Him and Stuffs His Body in His Wife\'s Cadillac at a Boat Club',
    subtitle: '2806 Emmons Ave, Sheepshead Bay, Brooklyn. Varuna Boat Club still exists',
    description: 'On 10 January 1983, Roy DeMeo — whose crew had murdered an estimated 200 people at the Gemini Lounge — was himself lured to a meeting and killed by his own men, Joseph Testa and Anthony Senter. They shot him five times in the head, stuffed his body in the trunk of his wife\'s maroon Cadillac Coupe DeVille, and parked it here at the Varuna Boat Club on Emmons Avenue. His body was found ten days later, partially frozen beneath a chandelier he had placed in the car. Paul Castellano had ordered the hit, fearing DeMeo would become an informant.',
    lat: 40.583672, lng: -73.940526, type: 'crime_scene', importance: 'minor' as const, notability: 45,
    accuracy: 'exact', kind: 'event', year: 1983, date: '10 January 1983',
    address: '2806 Emmons Avenue, Brooklyn, NY 11235',
    entityIds: ['paul-castellano'],
    geoVerified: true,
  },
  {
    id: 'nyc-scarpa-wimpy',
    name: 'Colombo Hitman Gregory Scarpa Runs a Brooklyn Social Club While Secretly Working as an FBI Informant',
    subtitle: '7506 13th Ave at Bay Ridge Pkwy, Dyker Heights, Brooklyn. Now a foot massage parlor',
    description: 'Gregory Scarpa Sr. — "the Grim Reaper" — ran the Wimpy Boys Social Club here on 13th Avenue while secretly feeding information to the FBI for most of his career. On 25 September 1984, he murdered 31-year-old Mary Bari inside the club after luring her with a promise of a waitressing job; he feared she knew the whereabouts of fugitive Alphonse Persico. The FBI planted a microphone but captured nothing useful. Scarpa contracted HIV from a blood transfusion and died of AIDS complications in prison in 1994, convicted of multiple murders during the Colombo family war.',
    lat: 40.620198, lng: -74.007796, type: 'crime_scene', importance: 'minor' as const, notability: 45,
    accuracy: 'exact', kind: 'event', year: 1984, date: '1970s–1994',
    address: '7506 13th Avenue, Brooklyn, NY 11228',
    geoVerified: true,
  },
];

const entities = [
  {
    id: 'john-gotti',
    name: 'John Gotti',
    type: 'person',
    description: 'The "Teflon Don" who beat three federal cases before the tapes brought him down. Gotti orchestrated Paul Castellano\'s assassination outside Sparks Steak House in 1985, seized control of the Gambino family, and became the most famous mob boss since Al Capone — until underboss Sammy Gravano flipped and put him away for life.',
    canonicalStoryId: 'nyc-five-families',
    wikipediaSlug: 'John_Gotti',
  },
  {
    id: 'carlo-gambino',
    name: 'Carlo Gambino',
    type: 'person',
    description: 'The quiet Sicilian stowaway who became the most powerful mob boss in America. Gambino conspired to murder Albert Anastasia in 1957, took over the family, and ruled all Five Families from a modest Brooklyn house for two decades. His appointment of brother-in-law Paul Castellano as successor triggered the chain of events that ended with Castellano dead outside a steakhouse.',
    canonicalStoryId: 'nyc-five-families',
    wikipediaSlug: 'Carlo_Gambino',
  },
  {
    id: 'paul-castellano',
    name: 'Paul Castellano',
    type: 'person',
    description: 'The Gambino boss who built a 17-bathroom Staten Island mansion and ran the family like a CEO — until John Gotti gunned him down outside a Manhattan steakhouse. Castellano inherited power from his brother-in-law Carlo Gambino in 1976, but his reclusive style and preference for white-collar rackets over street crime alienated the family\'s soldiers.',
    canonicalStoryId: 'nyc-five-families',
    wikipediaSlug: 'Paul_Castellano',
  },
  {
    id: 'lucky-luciano',
    name: 'Lucky Luciano',
    type: 'person',
    description: 'Father of modern organized crime in America. Luciano murdered two rival bosses in 1931, established the Commission governing the Five Families, and built an empire that survived his 1936 imprisonment and 1946 deportation to Italy. He continued orchestrating from Naples until his death in 1962.',
    canonicalStoryId: 'nyc-five-families',
    wikipediaSlug: 'Lucky_Luciano',
  },
  {
    id: 'albert-anastasia',
    name: 'Albert Anastasia',
    type: 'person',
    description: 'The lord of Murder, Inc. who ordered an estimated 1,000 contract killings before being shot dead in a Midtown barber chair. Anastasia ran the Mangano/Gambino family\'s enforcement arm and was feared as the most violent boss in Mafia history. His murder in 1957 was orchestrated by his own underboss, Carlo Gambino.',
    canonicalStoryId: 'nyc-five-families',
    wikipediaSlug: 'Albert_Anastasia',
  },
];

const story = {
  id: 'nyc-five-families',
  name: 'The Five Families',
  nickname: 'Murder, Power, and Betrayal Across Five Boroughs',
  years: '1906–2019',
  category: 'dark-history',
  storyType: 'era',
  description: 'Lucky Luciano invents the Commission from a tenement on East 10th Street, Anastasia is gunned down in a barber chair attacking his killers\' reflections, the DeMeo crew dismembers 200 people in a Flatlands bar, and Gotti watches his predecessor die outside a steakhouse — a century of organized crime mapped across New York.',
  tags: ['mafia', 'organized-crime', 'nyc', 'gambino', 'genovese', 'bonanno', 'lucchese', 'colombo'],
  contentWarning: 'Contains graphic descriptions of murder and organized crime violence.',
  moments: moments.map(m => ({ momentId: m.id })),
  relatedStoryIds: [] as string[],
  wikipediaSlug: 'Five_Families',
};

// --- APPEND TO FILES ---

// Read current files
let momentsFile = fs.readFileSync('src/data/moments.ts', 'utf-8');
let storiesFile = fs.readFileSync('src/data/stories.ts', 'utf-8');
let entitiesFile = fs.readFileSync('src/data/entities.ts', 'utf-8');

// Check for duplicates
for (const m of moments) {
  if (momentsFile.includes(`id: '${m.id}'`)) {
    console.log(`SKIP (exists): moment ${m.id}`);
    process.exit(0);
  }
}
for (const e of entities) {
  if (entitiesFile.includes(`id: '${e.id}'`)) {
    console.log(`SKIP (exists): entity ${e.id}`);
    process.exit(0);
  }
}

// Append moments before the closing ];
const momentStrings = moments.map(m => {
  const lines = [
    `  {`,
    `    id: '${m.id}',`,
    `    name: '${m.name.replace(/'/g, "\\'")}',`,
    `    subtitle: '${m.subtitle.replace(/'/g, "\\'")}',`,
    `    description: '${m.description.replace(/'/g, "\\'")}',`,
    `    lat: ${m.lat},`,
    `    lng: ${m.lng},`,
    `    type: '${m.type}',`,
    `    importance: '${m.importance}',`,
    `    notability: ${m.notability},`,
    `    verificationLevel: 'verified',`,
    `    accuracy: '${m.accuracy}',`,
    `    geoVerified: true,`,
    `    kind: '${m.kind}',`,
    `    year: ${m.year},`,
    `    date: '${m.date}',`,
    `    address: '${m.address.replace(/'/g, "\\'")}',`,
  ];
  if (m.entityIds && m.entityIds.length > 0) {
    lines.push(`    entityIds: [${m.entityIds.map(id => `'${id}'`).join(', ')}],`);
  }
  lines.push(`  },`);
  return lines.join('\n');
}).join('\n');

momentsFile = momentsFile.replace(/\n\];\s*$/, `\n${momentStrings}\n];\n`);
fs.writeFileSync('src/data/moments.ts', momentsFile);
console.log(`Added ${moments.length} moments`);

// Append entities
const entityStrings = entities.map(e => {
  return [
    `  {`,
    `    id: '${e.id}',`,
    `    name: '${e.name}',`,
    `    type: '${e.type}',`,
    `    description: '${e.description.replace(/'/g, "\\'")}',`,
    `    canonicalStoryId: '${e.canonicalStoryId}',`,
    `    wikipediaSlug: '${e.wikipediaSlug}',`,
    `  },`,
  ].join('\n');
}).join('\n');

entitiesFile = entitiesFile.replace(/\n\];\s*$/, `\n${entityStrings}\n];\n`);
fs.writeFileSync('src/data/entities.ts', entitiesFile);
console.log(`Added ${entities.length} entities`);

// Append story
const storyStr = [
  `  {`,
  `    id: '${story.id}',`,
  `    name: '${story.name}',`,
  `    nickname: '${story.nickname}',`,
  `    years: '${story.years}',`,
  `    category: '${story.category}',`,
  `    storyType: '${story.storyType}',`,
  `    description: '${story.description.replace(/'/g, "\\'")}',`,
  `    tags: [${story.tags.map(t => `'${t}'`).join(', ')}],`,
  `    contentWarning: '${story.contentWarning}',`,
  `    moments: [${story.moments.map(m => `{ momentId: '${m.momentId}' }`).join(', ')}],`,
  `    relatedStoryIds: [],`,
  `    wikipediaSlug: '${story.wikipediaSlug}',`,
  `  },`,
].join('\n');

storiesFile = storiesFile.replace(/\n\];\s*$/, `\n${storyStr}\n];\n`);
fs.writeFileSync('src/data/stories.ts', storiesFile);
console.log(`Added story: ${story.id}`);

console.log('\nDone! Run validator next.');
