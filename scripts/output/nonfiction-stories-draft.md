# Nonfiction Stories Draft -- Top 5 from Audit

> **Status**: DRAFT for review. Do not ingest.
> **Source**: nonfiction-documentary-stories.md Tier 1 entries
> **Selection criteria**: Strongest WHERE component, fills geographic gaps (Kansas, Himalayas, Chicago, Antarctica, South America)

---

## Overlap Check

No existing stories, moments, or entities in the database overlap with any of these 5 stories. Jackson Park in Chicago has an Obama Presidential Center moment (2021) at the same park where the 1893 World's Fair took place -- note for potential cross-linking via place entity, not duplication.

---

## Story 1: In Cold Blood

### Story Object

```ts
{
  id: 'in-cold-blood',
  name: 'The Clutter Family Murders',
  years: '1959-1965',
  category: 'dark-history',
  storyType: 'incident',
  description: 'Two drifters murder a Kansas wheat farmer and his family for a nonexistent safe, a novelist and his childhood friend arrive to report the story, and the resulting book invents a genre. Six years from farmhouse to gallows, all within 400 miles of flat prairie.',
  tags: ['true-crime', 'kansas', 'nonfiction'],
  moments: [
    { momentId: 'clutter-murders-holcomb-1959' },
    { momentId: 'capote-lee-arrive-holcomb-1959' },
    { momentId: 'smith-hickock-arrested-vegas-1959' },
    { momentId: 'clutter-trial-garden-city-1960' },
    { momentId: 'capote-interviews-smith-lansing-1960' },
    { momentId: 'smith-hickock-hanged-lansing-1965' }
  ],
  relatedStoryIds: [],  // fill during wiring
  wikipediaSlug: 'In_Cold_Blood'
}
```

### Moments

#### 1. clutter-murders-holcomb-1959

```ts
{
  id: 'clutter-murders-holcomb-1959',
  name: 'Two Drifters Murder the Clutter Family in Their Farmhouse for a Safe That Does Not Exist',
  subtitle: 'River Valley Farm, west of Holcomb, KS. The house still stands as a private residence on a dirt road off US-50',
  description: 'Herbert Clutter was a prosperous wheat farmer, a 4-H leader, a man who did not keep cash in the house. On 15 November 1959, Perry Smith and Dick Hickock entered this farmhouse on a tip from a prison cellmate about a safe full of money. They found no safe. They bound and gagged all four family members in separate rooms and killed them with a shotgun and a knife. The total haul: less than fifty dollars and a transistor radio.',
  lat: 37.9864,
  lng: -100.6376,
  type: 'crime_scene',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1959,
  address: 'River Valley Farm, Holcomb, KS',
  entityIds: ['perry-smith', 'dick-hickock']
}
```

#### 2. capote-lee-arrive-holcomb-1959

```ts
{
  id: 'capote-lee-arrive-holcomb-1959',
  name: 'Truman Capote and Harper Lee Arrive in Holcomb to Report on the Murders',
  subtitle: 'Holcomb, KS, population ~270. The town remains a small farming community along US-50',
  description: 'Capote read a 300-word New York Times item about the Clutter murders and saw something no other writer saw: a book-length narrative in the form of a novel. He arrived here in Holcomb in December 1959 with childhood friend Harper Lee as his research partner. Lee -- herself finishing a manuscript called To Kill a Mockingbird -- charmed the suspicious townspeople while Capote filled notebooks. The resulting six-year obsession produced the first "nonfiction novel."',
  lat: 37.9864,
  lng: -100.6376,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'general-area',
  kind: 'event',
  year: 1959,
  address: 'Holcomb, KS',
  entityIds: ['truman-capote', 'harper-lee']
}
```

#### 3. smith-hickock-arrested-vegas-1959

```ts
{
  id: 'smith-hickock-arrested-vegas-1959',
  name: 'Perry Smith and Dick Hickock Are Arrested in a Las Vegas Rooming House',
  subtitle: 'Las Vegas, NV. The exact rooming house location is not definitively recorded',
  description: 'After six weeks on the run through Mexico and Florida, Smith and Hickock were arrested here in Las Vegas on 30 December 1959 after a stolen-car check flagged their license plate. KBI agent Alvin Dewey had circulated their descriptions to every law enforcement agency in the country. Smith confessed within hours, describing each murder in clinical detail. Hickock crumbled shortly after.',
  lat: 36.1699,
  lng: -115.1398,
  type: 'crime_scene',
  importance: 'minor',
  accuracy: 'general-area',
  kind: 'event',
  year: 1959,
  address: 'Las Vegas, NV',
  entityIds: ['perry-smith', 'dick-hickock']
}
```

#### 4. clutter-trial-garden-city-1960

```ts
{
  id: 'clutter-trial-garden-city-1960',
  name: 'Smith and Hickock Are Tried at the Finney County Courthouse in Garden City',
  subtitle: 'Finney County Courthouse, 311 N 9th St, Garden City, KS. The courthouse still operates',
  description: 'The trial opened here on 22 March 1960 in a packed courtroom in Garden City, the county seat nearest Holcomb. Both defendants pleaded not guilty by reason of insanity. The jury deliberated forty minutes and returned two death sentences. Capote attended every session, sitting close enough to read the jurors\' faces, and later called the verdict the moment that locked him into years of waiting for an ending to his book.',
  lat: 37.9717,
  lng: -100.8727,
  type: 'government',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 1960,
  address: '311 N 9th St, Garden City, KS',
  entityIds: ['perry-smith', 'dick-hickock', 'truman-capote']
}
```

#### 5. capote-interviews-smith-lansing-1960

```ts
{
  id: 'capote-interviews-smith-lansing-1960',
  name: 'Capote Conducts Hundreds of Hours of Interviews with Perry Smith on Death Row',
  subtitle: 'Kansas State Penitentiary, 714 S 8th St, Lansing, KS. The prison complex is still active',
  description: 'Over five years on death row, Capote visited Smith here at the Kansas State Penitentiary dozens of times, building an intimacy that became the emotional core of In Cold Blood. Smith drew portraits, wrote letters, and confided details he had withheld from police. Capote later admitted the relationship destroyed him -- he allegedly needed Smith dead so the book could end, yet dreaded the execution. He never finished another novel.',
  lat: 39.2486,
  lng: -94.9002,
  type: 'institution',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'presence',
  year: 1960,
  address: '714 S 8th St, Lansing, KS',
  entityIds: ['truman-capote', 'perry-smith']
}
```

#### 6. smith-hickock-hanged-lansing-1965

```ts
{
  id: 'smith-hickock-hanged-lansing-1965',
  name: 'Smith and Hickock Are Hanged at the Kansas State Penitentiary',
  subtitle: 'Kansas State Penitentiary, Lansing, KS. The warehouse where executions took place has been demolished',
  description: 'On 14 April 1965 -- five years, five months, and twenty-nine days after the Clutter murders -- Smith and Hickock were hanged in a warehouse inside the prison walls. Capote attended as a witness. Smith\'s reportedly last words were an apology: "Maybe I had something to contribute, something..." The execution gave Capote his ending. In Cold Blood was published the following January and sold out within weeks.',
  lat: 39.2486,
  lng: -94.9002,
  type: 'historical_site',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1965,
  address: 'Kansas State Penitentiary, Lansing, KS',
  entityIds: ['perry-smith', 'dick-hickock', 'truman-capote']
}
```

---

## Story 2: The 1996 Everest Disaster

### Story Object

```ts
{
  id: '1996-everest-disaster',
  name: 'The 1996 Mount Everest Disaster',
  years: '1996',
  category: 'everyday-extraordinary',
  storyType: 'incident',
  description: 'Climbers fly into the world\'s most dangerous airstrip, a bottleneck at 28,000 feet traps them in a storm, and a guide makes a last radio call to his pregnant wife from the summit ridge. Eight people die in a single night on the mountain.',
  tags: ['mountaineering', 'disaster', 'nepal', 'nonfiction'],
  moments: [
    { momentId: 'everest-lukla-arrival-1996' },
    { momentId: 'everest-base-camp-1996' },
    { momentId: 'everest-hillary-step-bottleneck-1996' },
    { momentId: 'everest-rob-hall-last-call-1996' },
    { momentId: 'everest-beck-weathers-survives-1996' },
    { momentId: 'everest-fischer-dies-balcony-1996' }
  ],
  relatedStoryIds: [],
  wikipediaSlug: '1996_Mount_Everest_disaster'
}
```

### Moments

#### 1. everest-lukla-arrival-1996

```ts
{
  id: 'everest-lukla-arrival-1996',
  name: 'Climbers Fly Into Lukla on a Runway Carved Into a Mountainside',
  subtitle: 'Tenzing-Hillary Airport, Lukla, Nepal. The 527m runway ends at a stone wall; still the primary gateway to Everest',
  description: 'Every Everest expedition begins with a 35-minute flight from Kathmandu that ends here at Lukla\'s Tenzing-Hillary Airport, a 527-meter runway with a 12% gradient carved into a mountainside at 2,860 meters. The uphill strip ends at a stone wall; the downhill end drops into a valley. In the spring of 1996, dozens of commercial clients paid $65,000 each for guided summit attempts, landing here before the ten-day trek to Base Camp. The airport has one of the highest accident rates in the world.',
  lat: 27.6870,
  lng: 86.7310,
  type: 'landmark',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 1996,
  address: 'Tenzing-Hillary Airport, Lukla, Solukhumbu District, Nepal',
  entityIds: ['jon-krakauer', 'rob-hall']
}
```

#### 2. everest-base-camp-1996

```ts
{
  id: 'everest-base-camp-1996',
  name: 'Rival Expedition Teams Gather at Everest Base Camp',
  subtitle: 'Everest Base Camp, 5,364m, Khumbu Glacier, Nepal. A seasonal tent city accessible by trek from Lukla',
  description: 'By late March 1996, Everest Base Camp here on the Khumbu Glacier held over 300 people from more than a dozen expeditions. Rob Hall\'s Adventure Consultants and Scott Fischer\'s Mountain Madness pitched their tents within shouting distance. Journalist Jon Krakauer had a magazine assignment to report on the commercialization of Everest. The crowding -- too many teams, too many clients, too few summit windows -- was already the disaster in embryo.',
  lat: 28.0025,
  lng: 86.8528,
  type: 'natural_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1996,
  address: 'Everest Base Camp, Khumbu Glacier, Nepal',
  entityIds: ['jon-krakauer', 'rob-hall', 'scott-fischer']
}
```

#### 3. everest-hillary-step-bottleneck-1996

```ts
{
  id: 'everest-hillary-step-bottleneck-1996',
  name: 'A Bottleneck at the Hillary Step Traps Dozens of Climbers Above 28,000 Feet',
  subtitle: 'Hillary Step, ~8,790m, SE ridge of Everest. The rock step partially collapsed in the 2015 earthquake',
  description: 'On 10 May 1996, a critical miscommunication left the Hillary Step unroped. Climbers queued here for over an hour at 8,790 meters in the Death Zone, burning oxygen and daylight. The fixed lines that Sherpas were supposed to set the night before had not been placed. By the time the last climbers reached the summit, it was after 2pm -- well past the standard turnaround time. The storm arrived two hours later. The delay at this single 12-meter rock step killed eight people.',
  lat: 27.9880,
  lng: 86.9253,
  type: 'natural_site',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1996,
  address: 'Hillary Step, SE Ridge, Mt Everest, Nepal',
  entityIds: ['rob-hall', 'scott-fischer', 'jon-krakauer']
}
```

#### 4. everest-rob-hall-last-call-1996

```ts
{
  id: 'everest-rob-hall-last-call-1996',
  name: 'Rob Hall Makes a Satellite Phone Call to His Pregnant Wife from the South Summit',
  subtitle: 'South Summit, ~8,749m, Everest. An exposed ridge position with no shelter',
  description: 'Rob Hall, one of the most experienced Everest guides alive, refused to descend without his client Doug Hansen, who had collapsed near the summit. Trapped by the storm at 8,749 meters, frostbitten and out of supplemental oxygen, Hall patched a satellite phone call through Base Camp to his wife Jan Arnold in New Zealand. He told her to sleep well and not to worry too much. He died on the ridge overnight. His daughter, Latimer, was born seven months later.',
  lat: 27.9870,
  lng: 86.9240,
  type: 'natural_site',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1996,
  address: 'South Summit, Mt Everest, Nepal',
  entityIds: ['rob-hall']
}
```

#### 5. everest-beck-weathers-survives-1996

```ts
{
  id: 'everest-beck-weathers-survives-1996',
  name: 'Beck Weathers Is Left for Dead Twice and Walks Into Camp',
  subtitle: 'Camp IV, South Col, ~7,920m, Everest. A bleak, wind-scoured saddle between Everest and Lhotse',
  description: 'Dallas pathologist Beck Weathers lay face-down in the snow at the South Col for eighteen hours, passed over by two rescue teams who believed he was dead. Hypothermic, blind in one eye, his right hand and face already frozen black, Weathers stood up and walked into Camp IV. Rescuers were so stunned they initially thought he was a ghost. He lost his nose, both hands, and most of his fingers. He returned to medical practice with prosthetics.',
  lat: 27.9710,
  lng: 86.9290,
  type: 'natural_site',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1996,
  address: 'South Col (Camp IV), Mt Everest, Nepal',
  entityIds: ['beck-weathers']
}
```

#### 6. everest-fischer-dies-balcony-1996

```ts
{
  id: 'everest-fischer-dies-balcony-1996',
  name: 'Scott Fischer Collapses and Dies on the Balcony at 8,400 Meters',
  subtitle: 'The Balcony, ~8,400m, SE ridge of Everest. An exposed rock ledge used as a rest point above Camp IV',
  description: 'Mountain Madness leader Scott Fischer summited Everest on 10 May 1996 but was already ill and exhausted. Guide Anatoli Boukreev found Fischer sitting in the snow here at the Balcony, unresponsive and unable to move. Boukreev gave him oxygen and hot tea but could not carry him down alone. A Sherpa attempt the next morning found Fischer dead, still sitting upright. He was 40 years old and had summited Everest without supplemental oxygen just two years earlier.',
  lat: 27.9780,
  lng: 86.9260,
  type: 'natural_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1996,
  address: 'The Balcony, SE Ridge, Mt Everest, Nepal',
  entityIds: ['scott-fischer']
}
```

---

## Story 3: The Devil in the White City

### Story Object

```ts
{
  id: 'devil-in-the-white-city',
  name: 'The World\'s Columbian Exposition and H.H. Holmes',
  years: '1893',
  category: 'dark-history',
  storyType: 'incident',
  description: 'An architect builds a plaster-and-staff wonderland in a Chicago swamp, an inventor unveils a 264-foot wheel, and a pharmacist operates a murder hotel three miles away. The 1893 World\'s Fair drew 27 million visitors; an unknown number never left.',
  tags: ['true-crime', 'chicago', 'worlds-fair', '1890s'],
  moments: [
    { momentId: 'white-city-opens-jackson-park-1893' },
    { momentId: 'holmes-builds-murder-castle-1892' },
    { momentId: 'ferris-wheel-unveiled-1893' },
    { momentId: 'harrison-assassinated-1893' },
    { momentId: 'holmes-arrested-philadelphia-1894' },
    { momentId: 'holmes-hanged-moyamensing-1896' }
  ],
  relatedStoryIds: [],
  wikipediaSlug: 'The_Devil_in_the_White_City'
}
```

**Cross-link note**: Jackson Park (41.7829, -87.5836) overlaps with existing moment `obama-presidential-center-groundbreaking-chicago-2021`. Consider a Jackson Park place entity to connect both eras.

### Moments

#### 1. white-city-opens-jackson-park-1893

```ts
{
  id: 'white-city-opens-jackson-park-1893',
  name: 'The World\'s Columbian Exposition Opens in Jackson Park to 27 Million Visitors',
  subtitle: 'Jackson Park, 6401 S Stony Island Ave, Chicago. The Museum of Science and Industry occupies the Fair\'s only surviving building',
  description: 'Daniel Burnham\'s "White City" opened here on 1 May 1893, a neoclassical fantasy of plaster and staff built on reclaimed swampland along Lake Michigan. The 600-acre fairgrounds introduced electric lighting on a mass scale, the Midway Plaisance entertainment strip, and Cracker Jack. Over its six-month run, 27.5 million people visited -- equivalent to nearly half the US population. The fair cost $28 million (over $900 million today) and ran at a loss. Only the Palace of Fine Arts survived; it is now the Museum of Science and Industry.',
  lat: 41.7829,
  lng: -87.5836,
  type: 'cultural_site',
  importance: 'major',
  accuracy: 'exact',
  kind: 'event',
  year: 1893,
  address: 'Jackson Park, Chicago, IL',
  entityIds: ['daniel-burnham', 'frederick-law-olmsted']
}
```

#### 2. holmes-builds-murder-castle-1892

```ts
{
  id: 'holmes-builds-murder-castle-1892',
  name: 'H.H. Holmes Builds a Three-Story "Murder Castle" Three Miles from the World\'s Fair',
  subtitle: '601 W 63rd St, Englewood, Chicago. Demolished 1938. Now a US Post Office building',
  description: 'In 1892, a pharmacist named H.H. Holmes completed a three-story building here at 63rd and Wallace in Englewood, three miles from the fairgrounds. He designed it himself, cycling through construction crews so no one saw the full plan: soundproofed rooms, gas lines controlled from his office, a chute to the basement, and a kiln. During the Fair, he lured visitors -- often young women seeking employment -- into the building. The exact number of victims remains unknown; Holmes confessed to 27 murders but may have killed fewer or far more.',
  lat: 41.7798,
  lng: -87.6355,
  type: 'crime_scene',
  importance: 'major',
  accuracy: 'exact',
  kind: 'presence',
  year: 1892,
  address: '601 W 63rd St, Chicago, IL (demolished)',
  entityIds: ['hh-holmes']
}
```

#### 3. ferris-wheel-unveiled-1893

```ts
{
  id: 'ferris-wheel-unveiled-1893',
  name: 'George Ferris Unveils the First Ferris Wheel as America\'s Answer to the Eiffel Tower',
  subtitle: 'Midway Plaisance, between Jackson and Washington Parks, Chicago. The wheel was scrapped in 1906; the Midway is now a public park',
  description: 'The 1889 Paris Exposition had the Eiffel Tower; Burnham demanded an engineering marvel to match it. George Washington Gale Ferris Jr. delivered: a 264-foot steel wheel here on the Midway Plaisance carrying 36 cars, each holding 60 passengers. It opened on 21 June 1893, two months late, and immediately became the fair\'s biggest draw. A single ride cost 50 cents -- a day\'s wage for many workers. The wheel earned $726,000 and repaid its construction cost. Ferris died broke three years later at 37.',
  lat: 41.7726,
  lng: -87.5984,
  type: 'landmark',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1893,
  address: 'Midway Plaisance, Chicago, IL',
  entityIds: ['george-ferris']
}
```

#### 4. harrison-assassinated-1893

```ts
{
  id: 'harrison-assassinated-1893',
  name: 'Chicago\'s Mayor Is Shot in His Own Doorway on the Fair\'s Last Night',
  subtitle: 'Harrison residence, 231 S Ashland Ave, Chicago. The house was later demolished',
  description: 'On 28 October 1893 -- the closing night of the World\'s Columbian Exposition -- Mayor Carter Harrison Sr. returned home from the fairgrounds in high spirits. A disgruntled office-seeker named Patrick Prendergast rang the doorbell and shot Harrison three times in the hallway. Harrison died within minutes. The city that had spent six months celebrating its arrival as a world-class metropolis ended the night in shock. Prendergast was hanged the following year.',
  lat: 41.8600,
  lng: -87.6660,
  type: 'crime_scene',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1893,
  address: '231 S Ashland Ave, Chicago, IL (demolished)',
  entityIds: ['carter-harrison-sr']
}
```

#### 5. holmes-arrested-philadelphia-1894

```ts
{
  id: 'holmes-arrested-philadelphia-1894',
  name: 'H.H. Holmes Is Arrested in Philadelphia After an Insurance Fraud Scheme Unravels',
  subtitle: 'Philadelphia, PA. Holmes was arrested at a boarding house; exact address uncertain',
  description: 'Holmes fled Chicago after the Fair closed but was arrested here in Philadelphia on 17 November 1894 on an insurance fraud charge -- he had faked the death of an associate named Benjamin Pitezel, then murdered him for real. When detective Frank Geyer tracked three missing Pitezel children across the Midwest and found their remains, the fraud case became a murder investigation. Geyer\'s search eventually led investigators back to the 63rd Street building in Chicago and its basement horrors.',
  lat: 39.9526,
  lng: -75.1652,
  type: 'crime_scene',
  importance: 'minor',
  accuracy: 'general-area',
  kind: 'event',
  year: 1894,
  address: 'Philadelphia, PA',
  entityIds: ['hh-holmes']
}
```

#### 6. holmes-hanged-moyamensing-1896

```ts
{
  id: 'holmes-hanged-moyamensing-1896',
  name: 'H.H. Holmes Is Hanged at Moyamensing Prison',
  subtitle: 'Moyamensing Prison, 10th and Reed Streets, Philadelphia. Demolished 1968; now a supermarket site',
  description: 'On 7 May 1896, H.H. Holmes was hanged here at Moyamensing Prison in South Philadelphia. He reportedly remained calm on the scaffold and told the crowd he had only killed two people -- contradicting his own written confession of 27 murders, itself riddled with names of people still alive. He asked to be buried in concrete so no one could dig up his body. His request was granted. The prison was demolished in 1968; a supermarket now occupies the site.',
  lat: 39.9330,
  lng: -75.1570,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'approximate',
  kind: 'event',
  year: 1896,
  address: '10th and Reed Streets, Philadelphia, PA (demolished)',
  entityIds: ['hh-holmes']
}
```

---

## Story 4: The Shackleton Expedition

### Story Object

```ts
{
  id: 'shackleton-endurance-expedition',
  name: 'The Imperial Trans-Antarctic Expedition',
  years: '1914-1916',
  category: 'everyday-extraordinary',
  storyType: 'incident',
  description: 'A ship is crushed in Antarctic pack ice, 28 men camp on floes for five months, and their leader sails an open boat 800 miles across the Southern Ocean and crosses an uncharted mountain range to reach a whaling station. Every crew member survives.',
  tags: ['exploration', 'antarctica', 'survival', 'nonfiction'],
  moments: [
    { momentId: 'endurance-departs-south-georgia-1914' },
    { momentId: 'endurance-trapped-weddell-sea-1915' },
    { momentId: 'endurance-crushed-sinks-1915' },
    { momentId: 'crew-reaches-elephant-island-1916' },
    { momentId: 'james-caird-voyage-1916' },
    { momentId: 'shackleton-crosses-south-georgia-1916' }
  ],
  relatedStoryIds: [],
  wikipediaSlug: 'Imperial_Trans-Antarctic_Expedition'
}
```

### Moments

#### 1. endurance-departs-south-georgia-1914

```ts
{
  id: 'endurance-departs-south-georgia-1914',
  name: 'The Endurance Departs Grytviken for the Weddell Sea',
  subtitle: 'Grytviken, South Georgia Island. The abandoned whaling station is now a museum; Shackleton is buried in the cemetery here',
  description: 'On 5 December 1914, Ernest Shackleton\'s ship Endurance left this Norwegian whaling station at Grytviken, the last outpost of civilization before Antarctica. The whalers warned Shackleton that the pack ice was the worst they had seen in years. He sailed anyway. Shackleton would return to Grytviken in January 1922 on a later expedition and die of a heart attack aboard his ship in the harbor. He is buried in the whalers\' cemetery here, facing south toward the continent he never crossed.',
  lat: -54.2814,
  lng: -36.5090,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 1914,
  address: 'Grytviken, South Georgia Island',
  entityIds: ['ernest-shackleton', 'frank-worsley']
}
```

#### 2. endurance-trapped-weddell-sea-1915

```ts
{
  id: 'endurance-trapped-weddell-sea-1915',
  name: 'The Endurance Becomes Trapped in Weddell Sea Pack Ice for Ten Months',
  subtitle: 'Weddell Sea, approximately 76 degrees S. Open ocean; no landmarks or structures',
  description: 'On 19 January 1915, pack ice closed around the Endurance in the Weddell Sea and held her fast. For ten months the ship drifted with the ice, tilting and groaning as pressure ridges built around the hull. Shackleton kept the 28-man crew occupied with football matches on the ice, dog sled training, and theatrical performances. Photographer Frank Hurley documented everything. The ship drifted over 1,100 miles north before the ice finally crushed her.',
  lat: -76.0000,
  lng: -32.0000,
  type: 'disaster',
  importance: 'minor',
  accuracy: 'general-area',
  kind: 'event',
  year: 1915,
  address: 'Weddell Sea, Antarctica',
  entityIds: ['ernest-shackleton']
}
```

#### 3. endurance-crushed-sinks-1915

```ts
{
  id: 'endurance-crushed-sinks-1915',
  name: 'The Endurance Is Crushed by Ice Pressure and Sinks in the Weddell Sea',
  subtitle: 'Weddell Sea, ~68.6 S, 52.3 W. The wreck was found on the seabed in 2022 at 3,008 meters depth',
  description: 'On 21 November 1915, the pressure of millions of tons of pack ice finally broke the Endurance apart. The crew watched from their camp on the ice as the ship\'s stern rose out of the water and she sank bow-first. Shackleton wrote in his diary: "She\'s going, boys." The crew was now stranded on drifting ice floes with three salvaged lifeboats, limited food, and no way to signal for help. The wreck lay undiscovered at 3,008 meters until a 2022 expedition found her upright and remarkably intact.',
  lat: -68.6450,
  lng: -52.3300,
  type: 'disaster',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1915,
  address: 'Weddell Sea, Antarctica',
  entityIds: ['ernest-shackleton']
}
```

#### 4. crew-reaches-elephant-island-1916

```ts
{
  id: 'crew-reaches-elephant-island-1916',
  name: 'The Crew Reaches Elephant Island After Seven Days in Open Boats',
  subtitle: 'Point Wild, Elephant Island, South Shetland Islands. A bronze bust of Frank Wild marks the landing spot',
  description: 'After five months camping on drifting ice floes, the crew launched three lifeboats on 9 April 1916 and reached Elephant Island on 15 April -- the first time they had stood on solid ground in 497 days. The island was a desolate, wind-blasted rock with no inhabitants and no chance of rescue. Shackleton left 22 men here under Frank Wild\'s command and set out with five others in the James Caird, a 22-foot lifeboat, to cross 800 miles of the Southern Ocean.',
  lat: -61.1350,
  lng: -55.1170,
  type: 'natural_site',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1916,
  address: 'Point Wild, Elephant Island, South Shetland Islands',
  entityIds: ['ernest-shackleton', 'frank-wild']
}
```

#### 5. james-caird-voyage-1916

```ts
{
  id: 'james-caird-voyage-1916',
  name: 'Shackleton Sails a 22-Foot Lifeboat 800 Miles Across the Southern Ocean',
  subtitle: 'Southern Ocean, between Elephant Island and South Georgia. Open water; no landmarks',
  description: 'On 24 April 1916, Shackleton and five men launched the James Caird from Elephant Island into the most treacherous ocean on Earth. Navigator Frank Worsley had to calculate their position using a sextant from the deck of a pitching 22-foot boat with waves reaching 60 feet. They sailed for 16 days, surviving hurricane-force winds and navigating by dead reckoning when clouds hid the sun. Worsley\'s navigation was off by less than a degree. They made landfall on the wrong side of South Georgia on 10 May.',
  lat: -57.0000,
  lng: -42.0000,
  type: 'natural_site',
  importance: 'major',
  accuracy: 'general-area',
  kind: 'event',
  year: 1916,
  address: 'Southern Ocean',
  entityIds: ['ernest-shackleton', 'frank-worsley', 'tom-crean']
}
```

#### 6. shackleton-crosses-south-georgia-1916

```ts
{
  id: 'shackleton-crosses-south-georgia-1916',
  name: 'Shackleton Crosses South Georgia\'s Uncharted Mountains on Foot to Reach Help',
  subtitle: 'Stromness whaling station, South Georgia Island. The abandoned station is still standing but restricted',
  description: 'The James Caird landed on South Georgia\'s uninhabited south coast. The whaling stations were on the north side, separated by a mountain range no one had ever crossed. On 19 May 1916, Shackleton, Worsley, and Crean set out with 50 feet of rope, a carpenter\'s adze, and no map. They crossed the mountains in 36 hours without sleep, navigating by the stars and the sound of the Stromness factory whistle. The Norwegian whalers who saw them stumble into the station wept -- the three men were unrecognizable.',
  lat: -54.1550,
  lng: -36.7110,
  type: 'historical_site',
  importance: 'major',
  accuracy: 'approximate',
  kind: 'event',
  year: 1916,
  address: 'Stromness, South Georgia Island',
  entityIds: ['ernest-shackleton', 'frank-worsley', 'tom-crean']
}
```

---

## Story 5: The Lost City of Z

### Story Object

```ts
{
  id: 'lost-city-of-z',
  name: 'Percy Fawcett\'s Search for the Lost City of Z',
  years: '1906-1925',
  category: 'discovery-science',
  storyType: 'incident',
  description: 'A British surveyor spends two decades mapping the Amazon, becomes convinced a lost civilization lies in the Mato Grosso, and walks into the jungle with his son and a friend in 1925. None of them are ever seen again.',
  tags: ['exploration', 'amazon', 'mystery', 'south-america'],
  moments: [
    { momentId: 'fawcett-rgs-presentation-1910' },
    { momentId: 'fawcett-surveys-verde-river-1908' },
    { momentId: 'fawcett-final-expedition-cuiaba-1925' },
    { momentId: 'fawcett-dead-horse-camp-1925' },
    { momentId: 'fawcett-vanishes-xingu-1925' }
  ],
  relatedStoryIds: [],
  wikipediaSlug: 'Percy_Fawcett'
}
```

### Moments

#### 1. fawcett-rgs-presentation-1910

```ts
{
  id: 'fawcett-rgs-presentation-1910',
  name: 'Percy Fawcett Presents His Theory of a Lost Amazonian Civilization at the Royal Geographical Society',
  subtitle: '1 Kensington Gore, London SW7. The RGS building still stands opposite the Royal Albert Hall',
  description: 'In this ornate lecture hall opposite the Albert Hall, Colonel Percy Fawcett presented his accumulated evidence for a lost civilization he called "Z" -- pottery fragments, indigenous oral histories, and the 1753 account of a Portuguese bandeirante who claimed to have found a ruined stone city in the Brazilian interior. The RGS had funded seven of Fawcett\'s South American expeditions; his audience included some of the most famous explorers alive. Many were skeptical. Fawcett was undeterred.',
  lat: 51.5014,
  lng: -0.1745,
  type: 'institution',
  importance: 'minor',
  accuracy: 'exact',
  kind: 'event',
  year: 1910,
  address: '1 Kensington Gore, London SW7',
  entityIds: ['percy-fawcett']
}
```

#### 2. fawcett-surveys-verde-river-1908

```ts
{
  id: 'fawcett-surveys-verde-river-1908',
  name: 'Fawcett Surveys the Rio Verde Border Region for Bolivia and Brazil',
  subtitle: 'Rio Verde, Bolivia-Brazil border region. Dense jungle; largely unchanged from Fawcett\'s era',
  description: 'Between 1906 and 1914, the RGS sent Fawcett to survey disputed borders in the Amazon basin. Working here along the Rio Verde in 1908, his team was attacked by indigenous groups, lost mules to piranhas, and navigated rapids that had killed previous expeditions. Fawcett thrived. The surveys were his apprenticeship in jungle survival, but they also planted the obsession: indigenous people he encountered spoke of stone ruins deeper in the forest. Each expedition pushed him further from maps and closer to Z.',
  lat: -14.8500,
  lng: -60.7500,
  type: 'natural_site',
  importance: 'contextual',
  accuracy: 'general-area',
  kind: 'event',
  year: 1908,
  address: 'Rio Verde, Bolivia-Brazil border region',
  entityIds: ['percy-fawcett']
}
```

#### 3. fawcett-final-expedition-cuiaba-1925

```ts
{
  id: 'fawcett-final-expedition-cuiaba-1925',
  name: 'Fawcett, His Son, and Raleigh Rimmell Depart Cuiaba Into the Mato Grosso',
  subtitle: 'Cuiaba, Mato Grosso, Brazil. The state capital is now a city of 600,000 and was a 2014 World Cup host city',
  description: 'On 20 April 1925, Percy Fawcett set out from this frontier town with his 21-year-old son Jack and Jack\'s friend Raleigh Rimmell. He had rejected all offers of larger parties and radio equipment, believing a small, fast group had the best chance. The three men carried minimal supplies and Fawcett\'s hand-drawn maps. He wrote to his wife Nina: "You need have no fear of failure." It was the last expedition with a fixed departure point and a known starting date.',
  lat: -15.6014,
  lng: -56.0979,
  type: 'historical_site',
  importance: 'minor',
  accuracy: 'general-area',
  kind: 'event',
  year: 1925,
  address: 'Cuiaba, Mato Grosso, Brazil',
  entityIds: ['percy-fawcett', 'jack-fawcett']
}
```

#### 4. fawcett-dead-horse-camp-1925

```ts
{
  id: 'fawcett-dead-horse-camp-1925',
  name: 'Fawcett Sends His Last Known Communication from "Dead Horse Camp"',
  subtitle: 'Upper Xingu region, Mato Grosso, Brazil. Exact location uncertain; deep jungle, limited access',
  description: 'On 29 May 1925, Fawcett dispatched a letter to his wife via an indigenous runner from a camp he named "Dead Horse Camp" after a pack animal that died there during a previous expedition. He wrote that Rimmell\'s foot was infected and their food was low, but he remained confident: "You need have no fear of any failure." The letter reached Nina Fawcett months later. It was the last confirmed communication from the expedition. Over 100 subsequent search parties failed to find any trace of the three men.',
  lat: -11.8000,
  lng: -53.5000,
  type: 'historical_site',
  importance: 'major',
  accuracy: 'general-area',
  kind: 'event',
  year: 1925,
  address: 'Upper Xingu region, Mato Grosso, Brazil',
  entityIds: ['percy-fawcett', 'jack-fawcett']
}
```

#### 5. fawcett-vanishes-xingu-1925

```ts
{
  id: 'fawcett-vanishes-xingu-1925',
  name: 'Fawcett\'s Expedition Vanishes in the Xingu Region and Is Never Found',
  subtitle: 'Xingu Indigenous Park, Mato Grosso, Brazil. The region is now a protected indigenous reserve, largely off-limits',
  description: 'After Dead Horse Camp, the three men walked east into territory inhabited by the Kalapalo and other Xingu peoples. They were never seen again by the outside world. Theories range from murder by indigenous groups to starvation to the possibility that Fawcett chose not to return. The Kalapalo told later investigators that they saw the men walking east until their campfire smoke disappeared. Over 100 rescue expeditions followed; at least 13 people died searching for Fawcett. David Grann\'s 2009 book revealed that Fawcett may have been closer to the truth than anyone knew -- satellite imagery later showed geometric earthworks in the region matching his descriptions.',
  lat: -12.0000,
  lng: -53.0000,
  type: 'historical_site',
  importance: 'major',
  accuracy: 'general-area',
  kind: 'event',
  year: 1925,
  address: 'Xingu region, Mato Grosso, Brazil',
  entityIds: ['percy-fawcett', 'jack-fawcett']
}
```

---

## New Entities

### Person Entities

```ts
// In Cold Blood
{
  id: 'truman-capote',
  name: 'Truman Capote',
  type: 'person',
  description: 'The writer who invented the "nonfiction novel" and destroyed himself doing it. His six-year immersion in the Clutter murder case produced In Cold Blood (1966), the best-selling true crime book ever written. He never completed another book, dying in 1984 of liver failure from alcoholism and drug abuse.',
  wikipediaSlug: 'Truman_Capote',
  canonicalStoryId: 'truman-capote-biography',  // would need biography story
  tags: ['writer', 'nonfiction', 'true-crime']
}

{
  id: 'perry-smith',
  name: 'Perry Smith',
  type: 'person',
  description: 'Half-Cherokee drifter who murdered four members of the Clutter family in Holcomb, Kansas on 15 November 1959. A talented artist and autodidact with a brutal childhood, he became the emotional center of Capote\'s In Cold Blood. Hanged at age 36 in 1965.',
  wikipediaSlug: 'Perry_Smith_(murderer)',
  canonicalStoryId: 'in-cold-blood',
  tags: ['criminal', 'true-crime']
}

{
  id: 'dick-hickock',
  name: 'Dick Hickock',
  type: 'person',
  description: 'Perry Smith\'s accomplice in the Clutter family murders. A high school football star turned petty criminal, Hickock masterminded the robbery based on a prison cellmate\'s tip about a safe that did not exist. Hanged alongside Smith on 14 April 1965 in Lansing, Kansas.',
  wikipediaSlug: 'Richard_Hickock',
  canonicalStoryId: 'in-cold-blood',
  tags: ['criminal', 'true-crime']
}

// Note: harper-lee entity likely already exists or would be created for To Kill a Mockingbird content.
// Check before creating.
{
  id: 'harper-lee',
  name: 'Harper Lee',
  type: 'person',
  description: 'The author of To Kill a Mockingbird who served as Truman Capote\'s research partner in Holcomb, Kansas. Her childhood friendship with Capote -- she was the model for Dill in her novel -- gave her access to suspicious townspeople that Capote alone could never have gained. She published one more novel and died in 2016.',
  wikipediaSlug: 'Harper_Lee',
  canonicalStoryId: 'harper-lee-biography',
  tags: ['writer', 'literature']
}

// 1996 Everest Disaster
{
  id: 'jon-krakauer',
  name: 'Jon Krakauer',
  type: 'person',
  description: 'The journalist who survived the 1996 Everest disaster and wrote Into Thin Air, the definitive account. His magazine assignment to report on commercialized mountaineering became an accidental witness narrative when eight people died around him. Later wrote Into the Wild and Under the Banner of Heaven.',
  wikipediaSlug: 'Jon_Krakauer',
  canonicalStoryId: '1996-everest-disaster',
  tags: ['journalist', 'mountaineer', 'writer']
}

{
  id: 'rob-hall',
  name: 'Rob Hall',
  type: 'person',
  description: 'New Zealand mountaineer who guided 39 clients to the summit of Everest before the 1996 disaster. Considered the gold standard of commercial guiding, he refused to abandon a struggling client near the summit and died at 8,749 meters after a satellite phone call to his pregnant wife. He was 35.',
  wikipediaSlug: 'Rob_Hall',
  canonicalStoryId: '1996-everest-disaster',
  tags: ['mountaineer', 'guide']
}

{
  id: 'scott-fischer',
  name: 'Scott Fischer',
  type: 'person',
  description: 'American mountaineer who summited Everest without supplemental oxygen in 1994, then died on the same mountain two years later leading a commercial expedition. Collapsed at 8,400 meters on 10 May 1996 and could not be rescued. He was 40.',
  wikipediaSlug: 'Scott_Fischer',
  canonicalStoryId: '1996-everest-disaster',
  tags: ['mountaineer', 'guide']
}

{
  id: 'beck-weathers',
  name: 'Beck Weathers',
  type: 'person',
  description: 'Dallas pathologist left for dead twice on Everest at 7,920 meters during the 1996 disaster. After eighteen hours in the open, hypothermic and blind, he stood up and walked into camp. Lost his nose, both hands, and most of his fingers. Returned to medical practice and wrote Left for Dead.',
  wikipediaSlug: 'Beck_Weathers',
  canonicalStoryId: '1996-everest-disaster',
  tags: ['mountaineer', 'survivor']
}

// Devil in the White City
{
  id: 'daniel-burnham',
  name: 'Daniel Burnham',
  type: 'person',
  description: 'The architect who built the White City. As director of works for the 1893 World\'s Columbian Exposition, he transformed 600 acres of Chicago swampland into a neoclassical fantasy that drew 27.5 million visitors. Later created the master plans for Chicago, Washington, D.C., and Manila.',
  wikipediaSlug: 'Daniel_Burnham',
  canonicalStoryId: 'daniel-burnham-biography',
  tags: ['architect', 'urban-planner']
}

{
  id: 'hh-holmes',
  name: 'H.H. Holmes',
  type: 'person',
  description: 'America\'s first documented serial killer. Born Herman Webster Mudgett, he built a three-story "Murder Castle" near the 1893 World\'s Fair with soundproofed rooms, gas lines, and a basement kiln. Confessed to 27 murders but the true count is unknown. Hanged in Philadelphia in 1896 at age 34.',
  wikipediaSlug: 'H._H._Holmes',
  canonicalStoryId: 'devil-in-the-white-city',
  tags: ['serial-killer', 'criminal']
}

{
  id: 'george-ferris',
  name: 'George Washington Gale Ferris Jr.',
  type: 'person',
  description: 'The engineer who invented the Ferris wheel. Built the 264-foot original for the 1893 World\'s Columbian Exposition as America\'s answer to the Eiffel Tower. The wheel earned $726,000 in six months. Ferris died bankrupt and largely forgotten three years later at 37, his invention a victim of patent disputes.',
  wikipediaSlug: 'George_Washington_Gale_Ferris_Jr.',
  canonicalStoryId: 'devil-in-the-white-city',
  tags: ['engineer', 'inventor']
}

{
  id: 'frederick-law-olmsted',
  name: 'Frederick Law Olmsted',
  type: 'person',
  description: 'The father of American landscape architecture. Designed Central Park, Prospect Park, the Biltmore Estate grounds, and the 1893 World\'s Fair\'s lagoon-and-canal system in Jackson Park. By the time of the Fair he was 71, ill, and losing his memory; it was his last great project.',
  wikipediaSlug: 'Frederick_Law_Olmsted',
  canonicalStoryId: 'frederick-law-olmsted-biography',
  tags: ['architect', 'landscape-designer']
}

{
  id: 'carter-harrison-sr',
  name: 'Carter Harrison Sr.',
  type: 'person',
  description: 'Five-term mayor of Chicago, assassinated in his own doorway on the closing night of the 1893 World\'s Fair. A populist Democrat who had championed the Fair as proof of Chicago\'s world-class status. Shot three times by a disgruntled office-seeker named Patrick Prendergast.',
  wikipediaSlug: 'Carter_Harrison_Sr.',
  canonicalStoryId: 'devil-in-the-white-city',
  tags: ['politician', 'assassination-victim']
}

// Shackleton Expedition
{
  id: 'ernest-shackleton',
  name: 'Ernest Shackleton',
  type: 'person',
  description: 'The polar explorer who lost his ship, saved every man, and became the archetype of crisis leadership. Led the Imperial Trans-Antarctic Expedition (1914-1916), surviving the crushing of the Endurance, five months on ice floes, and an 800-mile open-boat voyage. Died of a heart attack at 47 in South Georgia, the island where he had once stumbled into a whaling station and wept.',
  wikipediaSlug: 'Ernest_Shackleton',
  canonicalStoryId: 'ernest-shackleton-biography',
  tags: ['explorer', 'polar', 'leadership']
}

{
  id: 'frank-worsley',
  name: 'Frank Worsley',
  type: 'person',
  description: 'The New Zealand sea captain whose navigation saved the Endurance expedition. Guided the 22-foot James Caird across 800 miles of Southern Ocean using a sextant from a pitching deck with visibility measured in seconds between wave crests. His calculations were off by less than a degree.',
  wikipediaSlug: 'Frank_Worsley',
  canonicalStoryId: 'shackleton-endurance-expedition',
  tags: ['navigator', 'explorer', 'polar']
}

{
  id: 'tom-crean',
  name: 'Tom Crean',
  type: 'person',
  description: 'Irish Antarctic explorer who served on three major expeditions -- with Scott twice and Shackleton once. Crossed South Georgia\'s uncharted mountains with Shackleton and Worsley in 1916. Retired to Annascaul, County Kerry, where he opened a pub called the South Pole Inn. Rarely spoke of his exploits.',
  wikipediaSlug: 'Tom_Crean_(explorer)',
  canonicalStoryId: 'shackleton-endurance-expedition',
  tags: ['explorer', 'polar']
}

{
  id: 'frank-wild',
  name: 'Frank Wild',
  type: 'person',
  description: 'Shackleton\'s second-in-command, left on Elephant Island with 21 men while the boss sailed for help. Kept the stranded crew alive for four and a half months by maintaining strict routines, rationing seal meat, and rolling out sleeping bags each morning so no one could give up. Led five Antarctic expeditions total.',
  wikipediaSlug: 'Frank_Wild',
  canonicalStoryId: 'shackleton-endurance-expedition',
  tags: ['explorer', 'polar']
}

// Lost City of Z
{
  id: 'percy-fawcett',
  name: 'Percy Fawcett',
  type: 'person',
  description: 'The British explorer who vanished in the Amazon searching for a lost civilization he called "Z." Spent two decades surveying South American borders for the Royal Geographical Society before his final 1925 expedition into the Mato Grosso. Over 100 rescue parties searched for him; at least 13 people died trying. Satellite imagery later revealed pre-Columbian earthworks in the region he described.',
  wikipediaSlug: 'Percy_Fawcett',
  canonicalStoryId: 'percy-fawcett-biography',
  tags: ['explorer', 'surveyor', 'mystery']
}

{
  id: 'jack-fawcett',
  name: 'Jack Fawcett',
  type: 'person',
  description: 'Percy Fawcett\'s eldest son, 21 years old when he accompanied his father on the 1925 expedition into the Mato Grosso. A strong athlete and eager participant, he vanished alongside his father and friend Raleigh Rimmell somewhere in the Xingu region of Brazil.',
  wikipediaSlug: 'Percy_Fawcett',  // no separate article
  canonicalStoryId: 'lost-city-of-z',
  tags: ['explorer']
}
```

---

## Summary

| # | Story | Moments | New Entities | Geographic Gap Filled |
|---|-------|---------|-------------|----------------------|
| 1 | The Clutter Family Murders (In Cold Blood) | 6 | 4 (Capote, Smith, Hickock, Lee) | Rural Kansas, Las Vegas |
| 2 | The 1996 Mount Everest Disaster | 6 | 4 (Krakauer, Hall, Fischer, Weathers) | Nepal/Himalayas |
| 3 | The World's Columbian Exposition and H.H. Holmes | 6 | 5 (Burnham, Holmes, Ferris, Olmsted, Harrison) | Chicago, Philadelphia |
| 4 | The Imperial Trans-Antarctic Expedition | 6 | 4 (Shackleton, Worsley, Crean, Wild) | Antarctica, South Georgia, Southern Ocean |
| 5 | Percy Fawcett's Search for the Lost City of Z | 5 | 2 (Percy Fawcett, Jack Fawcett) | Brazil/Amazon, London |

**Total**: 5 stories, 29 moments, 19 new entities

### Cross-link Opportunities

- **Jackson Park**: The White City moment (1893) and the Obama Presidential Center moment (2021) share the same park. A Jackson Park place entity would connect them across 128 years.
- **Harper Lee**: If a To Kill a Mockingbird story is ever added, the Holcomb moment links Lee to both Capote and her own literary career.
- **Olmsted**: Central Park, Prospect Park, and Biltmore content would all wire to this entity.
- **RGS London**: The Fawcett moment at 1 Kensington Gore could link to any future exploration stories presented at the RGS (Darwin, Livingstone, etc.).
