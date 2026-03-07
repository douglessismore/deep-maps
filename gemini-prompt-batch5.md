# Gemini Prompt — Batch 5: Austin Deepening + Texas Gap Fill

## Context

You are generating geospatial story data for Deep Maps, an interactive storytelling map. Each story has multiple "moments" (locations) that trace through time and space.

**This batch has THREE parts:**
1. **EXPAND** — Add new locations to existing stories that currently have too few moments
2. **NEW PLACE/EVENT STORIES** — Create entirely new stories about places and events
3. **NEW PERSON STORIES** — Create life-arc stories for renowned figures who appear in existing incident stories. These create web connections: a user reading about the Booker T. Washington Snub in Austin can click through to Washington's full life story spanning Virginia, Alabama, and DC.

---

## PART 1: EXPAND EXISTING STORIES

For each story below, I'm providing the existing story ID and its current locations. Generate ONLY the new locations to ADD. Use the same format as the examples. Do NOT regenerate the existing locations.

### 1. Expand: `servant-girl-annihilator` (currently 3 locations → target 6)

**Current locations:** Murder of Mollie Smith (Dec 1884), The Christmas Eve Double Murder (Dec 1885), The Moonlight Tower (1894)

**Add these 3 new locations:**
- **The Murder of Eliza Shelley** — 2nd victim, May 7, 1885. A Black cook attacked with an axe in her cabin behind the Hancock house. Her face was mutilated. This was the attack that proved Mollie Smith wasn't an isolated incident and that a serial killer was stalking Austin. Location: near 30.265, -97.741 (East Austin). Type: crime_scene, importance: major.
- **O. Henry Names the Killer** — In a May 10, 1885 letter to his friend Dave Hall, William Sydney Porter (O. Henry) coined the term "Servant Girl Annihilators." He wrote from his Austin home: "Town is fearfully dull... except for the frequent raids of the Servant Girl Annihilators who make things lively in the dull hours of the night." The term stuck and became one of the first American serial killer nicknames. Location: 30.2647, -97.7412 (O. Henry's Austin residence area). Type: historic_home, importance: minor.
- **The Attack on Gracie Vance** — August 30, 1885. Gracie Vance, a servant, was murdered with an axe and her companion Orange Washington was also attacked. The killer was growing bolder, attacking both victims and anyone nearby. The African American community was terrorized, with some families fleeing Austin entirely. Location: 30.2838, -97.7421. Type: crime_scene, importance: major.

### 2. Expand: `o-henry-embezzlement` (currently 2 locations → target 5)

**Current locations:** First National Bank (embezzlement), Travis County Jail (trial/imprisonment)

**Add these 3 new locations:**
- **The Morley Brothers Drug Store** — When O. Henry arrived in Austin in 1884, he worked as a pharmacist at the Morley Brothers Drug Store on East 8th Street. It was here he began sketching the characters and eavesdropping on conversations that would fuel his later stories. Austin in the 1880s was a boomtown of 11,000 people. Location: 30.2674, -97.7411 (East 8th Street). Type: workplace, importance: minor.
- **The General Land Office** — In 1887, O. Henry took a job as a draftsman at the Texas General Land Office (now the Capitol Visitors Center). He worked here for four years, and the old building's atmosphere inspired his story "Bexar Scrip No. 2692." He also married Athol Estes during this period. Location: 30.2726, -97.7303. Type: workplace, importance: major.
- **Scholz Beer Garden** — O. Henry sang with the Hill City Quartette at Scholz Garden, Austin's oldest beer garden (est. 1866). The table and chair he used are on display at the O. Henry Museum. He was a regular at this German biergarten, and its characters populated his stories. Location: 30.2727, -97.7412 (Scholz Garden, 1607 San Jacinto Blvd). Type: cultural_venue, importance: minor.

### 3. Expand: `armadillo-world-hq` (currently 2 locations → target 4)

**Current locations:** Wooldridge Square Benefit (1968), The Armadillo Venue (opening)

**Add these 2 new locations:**
- **Willie Nelson's 1972 Performance** — On August 12, 1972, Willie Nelson played the Armadillo World Headquarters. This moment is recognized as the starting point of the modern Austin music scene and the "cosmic cowboy" movement that fused hippie counterculture with country music. Rednecks and longhairs shared the dance floor for the first time. Location: 30.2584, -97.7498 (Armadillo World HQ site, now a high-rise). Type: cultural_venue, importance: major.
- **The Final Concert & Demolition** — On New Year's Eve 1980, the Armadillo held its last show. Asleep at the Wheel and Commander Cody played until morning as the audience mourned the end of an era. The building was demolished in 1981 to make way for an office tower. A plaque and mural are all that remain. The venue had hosted AC/DC's first American show (1977), The Clash (1979, whose London Calling album features a photo from their Armadillo gig), and hundreds of other acts. Location: 30.2630, -97.7489 (525 Barton Springs Rd). Type: cultural_venue, importance: major.

### 4. Expand: `congress-avenue-bats` (currently 1 location → target 3)

**Current locations:** Congress Avenue Bridge

**Add these 2 new locations:**
- **The Accidental Discovery** — In 1980, the Congress Avenue Bridge was reconstructed with expansion joints that created ideal crevices for Mexican free-tailed bats. By 1984, an estimated 750,000 bats had moved in, and horrified Austinites demanded their removal. The Austin American-Statesman ran headlines calling them "health hazards." Location: 30.2617, -97.7454 (bridge underside). Type: natural_site, importance: major. Year: 1980.
- **Bat Conservation International Saves the Colony** — Bat expert Merlin Tuttle moved Bat Conservation International's headquarters to Austin specifically because of the Congress Avenue colony. He launched a public education campaign that transformed Austin from wanting to exterminate the bats to making them a tourist attraction drawing 100,000 visitors per season. It's now the largest urban bat colony in North America (1.5 million bats). Location: 30.2583, -97.7474 (BCI headquarters area). Type: organization_hq, importance: minor. Year: 1986.

### 5. Expand: `menger-hotel-rough-riders` (currently 1 location → target 3)

**Current locations:** Rough Riders Bar

**Add these 2 new locations:**
- **The Menger Hotel Opens** — In 1859, German immigrant William Menger built the hotel next to the Alamo, making it the finest hotel west of the Mississippi. It featured the first enclosed swimming pool in Texas. Over the decades it hosted Robert E. Lee, Ulysses S. Grant, Oscar Wilde, Babe Ruth, and every president from Ulysses S. Grant through George H.W. Bush. Location: 30.2755, -97.4881 (204 Alamo Plaza, San Antonio). Type: landmark, importance: major. Year: 1859.
- **The Ghost of Sallie White** — Sallie White, a chambermaid shot by her common-law husband in 1876, is the most frequently reported ghost at the Menger. Guests in the third-floor hallway report seeing a woman in a long skirt carrying towels. She was 26 when she died, and the hotel paid for her funeral. The Menger is now considered one of the most haunted hotels in America, with over 32 documented ghostly encounters. Location: 30.2756, -97.4879 (Menger Hotel 3rd floor). Type: haunted_site, importance: minor. Year: 1876.

### 6. Expand: `cadillac-ranch-amarillo` (currently 1 location → target 3)

**Current locations:** Cadillac Ranch Site

**Add these 2 new locations:**
- **The Ant Farm Studio** — Cadillac Ranch was conceived by the San Francisco art collective Ant Farm (Chip Lord, Hudson Marquez, Doug Michels) and funded by eccentric Amarillo millionaire Stanley Marsh 3. They bought ten Cadillacs from 1949-1963, representing the "golden age" of the American tailfin, and buried them nose-first at the same angle as the Great Pyramid of Giza. Location: 35.1873, -101.9872 (Ant Farm conceived the piece in San Francisco, but the funding meeting with Marsh happened at his Amarillo estate). Type: historic_meeting, importance: minor. Year: 1974.
- **The Relocation & Spray Paint Tradition** — In 1997, the installation was moved two miles west to escape Amarillo's urban sprawl. Marsh encouraged visitors to spray paint the cars, creating an ever-changing canvas. The original cars have been repainted thousands of times, with each layer adding to an increasingly thick shell. After Marsh's death in 2014, his estate continued maintaining the installation as a free public artwork on Route 66. Location: 35.1873, -101.9872. Type: art_installation, importance: major. Year: 1997.

### 7. Expand: `new-braunfels-adelsverein` (currently 1 location → target 3)

**Current locations:** Sophienburg Hill

**Add these 2 new locations:**
- **The Comal River Landing** — In March 1845, Prince Carl of Solms-Braunfels led 200 exhausted German immigrants to the junction of the Comal and Guadalupe Rivers. Many had survived a grueling journey from the coast where hundreds died of disease at Indianola. Prince Carl chose this spot for its springs and named the settlement after his family seat in Germany. The Comal River, at only 2.5 miles, is the shortest navigable river in Texas. Location: 29.7080, -98.1230 (Comal River headwaters, Landa Park). Type: settlement_site, importance: major. Year: 1845.
- **Gruene Hall** — Built in 1878, Gruene Hall is the oldest continually operating dance hall in Texas. When the cotton market crashed in the 1920s, the town of Gruene nearly became a ghost town. In the 1970s, the whole town was bought and restored, and the dance hall became a pilgrimage site for Texas country music. George Strait played some of his earliest gigs here. Willie Nelson, Merle Haggard, and Lyle Lovett have all graced its creaky wooden stage. Location: 29.7371, -98.1053 (1281 Gruene Rd, New Braunfels). Type: cultural_venue, importance: major. Year: 1878.

---

## PART 2: NEW STORIES

Generate these as COMPLETE story objects following the TypeScript format below.

### Story Format (TypeScript)

```typescript
{
  id: 'story-id-here',
  name: 'Story Name',
  nickname: 'Optional Nickname',
  years: '1970–1980',
  category: 'arts-culture', // one of: dark-history, last-stands, discovery-science, arts-culture, mystery-unexplained, political-drama, everyday-extraordinary
  description: '150-200 word narrative. Should make someone say "wait, WHAT happened here?"',
  tags: ['tag1', 'tag2'],
  relatedStoryIds: ['other-story-id'],
  wikipediaSlug: 'Wikipedia_Article_Name',
  locations: [
    {
      id: 'location-id',
      name: 'Location Name',
      subtitle: 'A punchy one-liner',
      description: '100-150 word vivid description of what happened HERE at THIS specific spot.',
      lat: 30.2672,
      lng: -97.7431,
      type: 'crime_scene', // descriptive string
      importance: 'major', // 'major' | 'minor' | 'contextual'
      accuracy: 'exact', // 'exact' | 'approximate' | 'general-area'
      year: 1972,
      address: '123 Example St, Austin, TX 78701',
    },
    // ... more locations (minimum 3, target 3-5)
  ],
}
```

### Example Story (from existing data)

```typescript
{
  id: 'janis-joplin-austin',
  name: 'Janis Joplin\'s Austin Years',
  nickname: 'The Ugliest Man on Campus',
  years: '1962–1963',
  category: 'arts-culture',
  description: 'Before she was the queen of psychedelic rock, Janis Joplin was a misfit art student at the University of Texas who was cruelly voted "Ugliest Man on Campus" by a fraternity. She found her voice at Threadgill\'s, a converted gas station where an old bootlegger named Kenneth Threadgill ran a weekly hootenanny. Joplin\'s raw, bluesy wail stunned the regulars. She left Austin broken but transformed — within five years she\'d be performing at Monterey Pop.',
  tags: ['austin', 'music', 'rock', '1960s', 'counterculture'],
  relatedStoryIds: ['armadillo-world-hq', 'stevie-ray-vaughan'],
  wikipediaSlug: 'Janis_Joplin',
  locations: [
    {
      id: 'joplin-ut-campus',
      name: 'University of Texas Campus',
      subtitle: 'Voted "Ugliest Man on Campus"',
      description: 'Joplin enrolled at UT in 1962 as an art student...',
      lat: 30.2850,
      lng: -97.7394,
      type: 'university',
      importance: 'major' as const,
      accuracy: 'general-area' as const,
      year: 1962,
    },
    // ... 2 more locations
  ],
}
```

---

### New Story 8: Willie Nelson's Austin

**Category:** arts-culture
**Years:** 1972–present
**Why:** Willie Nelson is THE defining figure of Austin music. Your spreadsheet has 10+ mappable moments. His 1972 Armadillo show literally created "cosmic cowboy" Austin.

**Required locations (4-5):**
1. **Abbott, TX birthplace** — Born April 29, 1933 in Abbott, Texas (pop. 356). Raised by grandparents who ordered music lessons from mail-order catalogs. Wrote his first song at age 7. Played in polka bands as a teenager. The tiny town of Abbott still celebrates "Willie Nelson Day." Location: Abbott, TX (~31.88, -97.07). importance: major.
2. **Nashville failure & the house fire** — After years of writing hits for others in Nashville ("Crazy," "Hello Walls"), Willie's own career stalled. In 1970, his house burned down. He rescued his guitar "Trigger" and a pound of marijuana from the flames. Took it as a sign to leave Nashville for Austin. Location: Nashville area (~36.17, -86.73). importance: minor.
3. **The 1972 Armadillo World Headquarters show** — August 12, 1972: Willie played the Armadillo and the cosmic cowboy movement was born. Rednecks and hippies shared the dance floor. This night is widely recognized as the starting point of the modern Austin music scene. Location: ~30.2630, -97.7489 (Armadillo site). importance: major.
4. **The First 4th of July Picnic** — In 1973, Willie threw his first 4th of July Picnic at Dripping Springs. The lineup included Waylon Jennings, Kris Kristofferson, John Prine, Doug Sahm, and Tom T. Hall. Heavy rains at the 4th of July picnic: 1 person drowned, 4 were stabbed, 4 kidnapped, 3 raped, and ~140 arrested. It became an annual tradition that has run for 50+ years. Location: Dripping Springs, TX (~30.19, -98.08). importance: major.
5. **Luck, Texas** — Willie's ranch west of Austin, named after the movie set for "Red Headed Stranger" that he kept. "When you're here, you're in Luck. When you leave, you're out of Luck." He hosts private concerts and poker games. His bus was raided here in 2010 — police found 6 ounces of marijuana. Location: Spicewood, TX area (~30.47, -98.13). importance: minor.

**relatedStoryIds:** ['armadillo-world-hq', 'janis-joplin-austin', 'broken-spoke-austin']
**wikipediaSlug:** 'Willie_Nelson'
**tags:** ['austin', 'music', 'country', 'outlaw-country', 'cosmic-cowboy', 'texas']

---

### New Story 9: The Victory Grill & Austin's Chitlin' Circuit

**Category:** arts-culture
**Years:** 1945–present
**Why:** African American music history in Austin is a critical gap. The Victory Grill is a landmark that hosted every major Black musician passing through the Jim Crow South.

**Required locations (3-4):**
1. **The Victory Grill Opens** — Johnny Holmes opened the Victory Grill on V-J Day (Victory over Japan Day) in 1945, as a restaurant and bar for Black soldiers returning from the war on East 11th Street. During legal segregation, it became THE stop on the Chitlin' Circuit for African American musicians touring the South. Bobby Bland, Clarence "Gatemouth" Brown, W.C. Clark, and B.B. King all played here when Austin was legally segregated. Ike & Tina Turner, James Brown, Etta James, Billie Holiday, Chuck Berry, and Janis Joplin also performed. In 1988 it suffered major fire damage. Location: 1104 E 11th St, Austin (~30.2717, -97.7279). importance: major.
2. **Doris Miller Auditorium** — Named after the Pearl Harbor hero from Waco, this East Austin auditorium was part of the Chitlin' Circuit. Ella Fitzgerald, Ike and Tina Turner performed here. During segregation, it was one of the few large venues where Black artists could perform and Black audiences could gather. Location: East Austin (~30.2680, -97.7230). importance: major.
3. **Charlie's Playhouse / East 11th Street** — The blocks of East 11th and East 12th Streets formed the heart of Austin's Black entertainment district. Charlie's Playhouse, the IL Club, and dozens of other venues created a thriving nightlife scene that was systematically dismantled by urban renewal in the 1960s-70s. Location: East 11th St corridor (~30.2720, -97.7260). importance: major.
4. **The Chitlin' Circuit Historical Marker** — Despite its importance, much of East Austin's music heritage was nearly forgotten. The Victory Grill was designated a historic landmark and became a symbol of Austin's African American cultural identity. Current preservation efforts aim to honor this history before gentrification erases the last traces. Location: Same as Victory Grill. importance: minor.

**relatedStoryIds:** ['stevie-ray-vaughan', 'armadillo-world-hq', 'austin-1928-plan']
**wikipediaSlug:** 'Victory_Grill'
**tags:** ['austin', 'music', 'civil-rights', 'african-american', 'blues', 'segregation']

---

### New Story 10: The Broken Spoke

**Category:** arts-culture
**Years:** 1964–present
**Why:** "The last of the true Texas dance halls." Iconic Austin honky-tonk where George Strait, Willie Nelson, and Kris Kristofferson launched careers.

**Required locations (3):**
1. **Opening Night, 1964** — James White opened the Broken Spoke on South Lamar in 1964 as a dancehall serving live country music and southern fried cooking. When Austin was still a small college town, the Spoke was already hosting Bob Wills, Tex Ritter, and Ernest Tubb. The original tin building, sawdust floor, and chicken-fried steak remain unchanged. Location: 3201 S Lamar Blvd, Austin (~30.2405, -97.7856). importance: major.
2. **George Strait's Early Gigs** — In the late 1970s, an unknown George Strait played the Broken Spoke regularly for $500 a night. Willie Nelson, Kris Kristofferson, and Dolly Parton all performed here. The walls are covered with photos and memorabilia from 60 years of Texas country music. Location: same address. importance: major.
3. **Survival Against Development** — By the 2000s, condos and shopping centers surrounded the Spoke on all sides. Developers offered millions for the land. James White refused every offer until his death in 2021, saying "I'd rather be broke and keep the Spoke." His family continues to run it. In a city obsessed with "progress," the Broken Spoke remains a defiant time capsule. Location: same address. importance: major.

**relatedStoryIds:** ['armadillo-world-hq', 'willie-nelson-austin']
**wikipediaSlug:** 'Broken_Spoke_(dance_hall)'
**tags:** ['austin', 'music', 'country', 'honky-tonk', 'preservation', 'texas']

---

### New Story 11: The Paramount Theatre

**Category:** arts-culture
**Years:** 1915–present
**Why:** Austin's oldest surviving theater. From vaudeville to psychedelic rock to film premieres, it mirrors Austin's cultural evolution.

**Required locations (3):**
1. **The Majestic Theatre Opens** — In 1915, the theater opened as "The Majestic," a vaudeville house on Congress Avenue designed by architect John Eberson. It featured an atmospheric ceiling painted to look like a night sky with twinkling stars. Houdini performed here. By mid-century it had become a movie palace, screening first-run films for decades. Location: 713 Congress Ave, Austin (~30.2682, -97.7432). importance: major.
2. **The Psychedelic Era & Near-Death** — In the 1970s, the theater was part of a franchise showing kung fu and blaxploitation films. It nearly closed permanently. A preservation campaign led by the community saved it in 1975, and it was renamed The Paramount. The restored theater became a beacon for Austin's emerging cultural identity. Location: same address. importance: major.
3. **Austin Film Society & Modern Revival** — Richard Linklater's Austin Film Society made the Paramount its home for screenings, and it became the premiere venue for SXSW film premieres. The State Theatre next door was incorporated in 2000. Today it hosts over 200 events per year, from classic films to comedy to live music. Location: same address (~30.2682, -97.7432). importance: major.

**relatedStoryIds:** ['dazed-and-confused-austin', 'cathedral-of-junk']
**wikipediaSlug:** 'Paramount_Theatre_(Austin,_Texas)'
**tags:** ['austin', 'theater', 'film', 'preservation', 'vaudeville', 'architecture']

---

### New Story 12: Scholz Garden — Austin's Oldest Bar

**Category:** everyday-extraordinary
**Years:** 1866–present
**Why:** Oldest continuously operated business in Austin. German heritage, political history, UT tradition.

**Required locations (3):**
1. **August Scholz Opens a Beer Garden** — In 1866, German immigrant August Scholz opened a boarding house and beer garden on San Jacinto Boulevard. It became the meeting place for the Austin Saengerrunde (German singing society, founded 1879). Every Sunday, German families gathered for concerts, food, and fellowship. It survived Prohibition by selling "near beer" and food. Location: 1607 San Jacinto Blvd, Austin (~30.2727, -97.7398). importance: major.
2. **The Political Backroom** — Scholz Garden became the unofficial headquarters of Texas Democratic politics. LBJ, Ann Richards, and generations of lawmakers cut deals over pitchers of beer in the garden. Every election night, the garden fills with politicians and press watching returns. The Texas Legislature's proximity (3 blocks away) made Scholz the ultimate political watering hole. Location: same address. importance: major.
3. **UT Football & Preservation** — For over a century, UT Longhorn fans have gathered at Scholz before and after football games. The garden was nearly lost multiple times to development but the Saengerrunde's ownership protected it. Today it remains gloriously unchanged — long wooden tables, pitchers of Shiner, and a biergarten atmosphere that feels like 1920s Texas. Location: same address. importance: minor.

**relatedStoryIds:** ['o-henry-embezzlement', 'lbj-lady-bird-austin']
**wikipediaSlug:** 'Scholz_Garten'
**tags:** ['austin', 'beer', 'german-heritage', 'politics', 'preservation', 'texas']

---

### New Story 13: Texas State Cemetery

**Category:** political-drama
**Years:** 1851–present
**Why:** "The Arlington of Texas." Republic heroes, governors, Rangers, Confederate generals — a compressed history of Texas in one graveyard.

**Required locations (3-4):**
1. **Stephen F. Austin's Reburial** — The cemetery was established in 1851 when the Texas Legislature voted to move Stephen F. Austin's remains here from Peach Point Plantation. The "Father of Texas" had died penniless in 1836, just months after Texas won independence. His reburial made this ground sacred to Texas identity. Location: 909 Navasota St, Austin (~30.2619, -97.7258). importance: major.
2. **The Republic of Texas Section** — The cemetery holds 11 governors, 5 speakers of the Texas House, 10 signers of the Texas Declaration of Independence, 4 U.S. Representatives, 4 first ladies, 36 Texas Rangers, 11 Republic of Texas veterans, and 2,000+ Confederate and state veterans. Mirabeau B. Lamar, the "Father of Texas Education," is buried steps from his political rivals. Location: same grounds. importance: major.
3. **Barbara Jordan's Grave** — Barbara Jordan, the first African American elected to the Texas Senate (1966) and the first Southern Black woman in Congress, is buried here. Her thundering Watergate speech ("My faith in the Constitution is whole") made her a national icon. She shares these grounds with Confederate generals — a physical embodiment of Texas's complicated history. Location: same grounds (~30.2615, -97.7255). importance: major.
4. **The 1990s Restoration** — By the 1990s, the cemetery had fallen into disrepair. Governor George W. Bush championed a $4.8 million restoration in 1994, adding a visitors center and new landscaping. The renovation transformed it from a neglected graveyard into an active memorial. An episode of "King of the Hill" featured a plot in this cemetery. Location: same grounds. importance: minor.

**relatedStoryIds:** ['battle-of-the-alamo', 'lbj-lady-bird-austin', 'booker-t-washington-snub']
**wikipediaSlug:** 'Texas_State_Cemetery'
**tags:** ['austin', 'texas', 'cemetery', 'republic-of-texas', 'civil-rights', 'governors']

---

### New Story 14: Mt. Bonnell

**Category:** everyday-extraordinary
**Years:** 1840–present
**Why:** Austin's most iconic viewpoint. 240 million year old limestone, lover's leap legend, oldest tourist destination in Texas.

**Required locations (3):**
1. **The Summit** — At 775 feet above sea level, Mt. Bonnell is the highest point in Austin city limits. The 100-step climb offers panoramic views of Lake Austin, the Hill Country, and the downtown skyline. Named (disputedly) for George W. Bonnell, Texas's first Commissioner of Indian Affairs who allegedly leaped to his death from the cliff in 1842 to avoid capture by Comanche. Location: 3800 Mt Bonnell Rd, Austin (~30.3210, -97.7734). importance: major.
2. **Austin's Oldest Tourist Attraction** — Since the 1840s, Mt. Bonnell has been a popular destination. In the 1850s, visitors arrived by steamboat up the Colorado River. Picnics and dances were held at the summit throughout the 19th century. A popular superstition says that a couple who climbs Mt. Bonnell together will fall in love — but breaking up after a Mt. Bonnell visit brings bad luck. Location: same site. importance: major.
3. **Lady Bird Johnson's Favorite View** — Lady Bird Johnson, champion of Texas wildflowers and conservation, considered the view from Mt. Bonnell her favorite in Austin. She advocated for preserving the natural beauty of the Colorado River corridor that stretches below. The wildflowers visible from the summit each spring are a direct result of her highway beautification efforts. Location: same site. importance: minor.

**relatedStoryIds:** ['lbj-lady-bird-austin', 'treaty-oak-poisoning', 'barton-springs-sos']
**wikipediaSlug:** 'Mount_Bonnell'
**tags:** ['austin', 'nature', 'landmark', 'geology', 'romance', 'texas']

---

### New Story 15: Dazed and Confused — Austin on Film

**Category:** arts-culture
**Years:** 1993
**Why:** Richard Linklater's film captured 1970s Austin and was filmed entirely in the city. The moonlight tower scene, Top Notch Burgers — these are pilgrimage sites.

**Required locations (3-4):**
1. **Top Notch Hamburgers (The Emporium)** — The drive-in burger joint on Burnet Road served as "The Emporium," the central hangout. The "check ya later" scene was filmed here. Top Notch is still open and largely unchanged since 1971. Matthew McConaughey's breakout role — Wooderson — was largely improvised, including the iconic "alright, alright, alright" which was his very first line in any movie. Location: 7525 Burnet Rd, Austin (~30.3474, -97.7389). importance: major.
2. **The Moonlight Tower Party** — The film's climactic party scene was filmed at a real Austin moonlight tower. These 165-foot towers, installed in 1894, are unique to Austin — the only surviving moonlight tower system in the world. The movie immortalized them and made Austinites aware of their own bizarre heritage. Location: actual moonlight tower used in filming (~30.2856, -97.7351, near Hemphill Park). importance: major.
3. **Bedichek Middle School** — The school scenes, including the iconic first-day-of-school hazing, were filmed at this Austin middle school during summer break. Linklater, who grew up in Huntsville, TX, set the film in Austin because it was "the freest place in Texas." Location: 6800 Bill Hughes Rd, Austin (~30.3150, -97.7550). importance: minor.
4. **The Austin Film Revolution** — Linklater had already put Austin on the film map with "Slacker" (1991), shot for $23,000. Dazed and Confused's success (made for $6.9M, earned $8M theatrically, became a massive cult hit) cemented Austin as an independent film capital and helped establish the infrastructure that would grow into SXSW Film. Location: Austin Studios area (~30.3000, -97.7000). importance: minor.

**relatedStoryIds:** ['servant-girl-annihilator', 'paramount-theatre-austin']
**tags:** ['austin', 'film', '1970s', 'coming-of-age', 'linklater', 'mcconaughey']
**wikipediaSlug:** 'Dazed_and_Confused_(film)'

---

---

## PART 3: RENOWNED FIGURE LIFE STORIES

These stories trace a famous person's entire life arc across multiple locations. They create "story web" connections — a user reading about the Booker T. Washington Snub in Austin can click through to see Washington's full journey from enslaved child to national figure.

### New Story 16: Booker T. Washington — From Slavery to the White House

**Category:** political-drama
**Years:** 1856–1915
**Why:** Already appears in `booker-t-washington-snub` (Austin incident). His full life story creates connections across Virginia, Alabama, Georgia, Texas, and DC. One of the most remarkable arcs in American history.

**Required locations (5-6):**
1. **Born Into Slavery** — Booker Taliaferro Washington was born enslaved on April 5, 1856, on the Burroughs tobacco plantation in Hale's Ford, Virginia. He didn't know his father (a white man from a neighboring plantation). At age 9, he was emancipated and walked with his family to Malden, West Virginia, where he worked in salt furnaces and coal mines while teaching himself to read. Location: Hale's Ford / Hardy, Virginia (~37.06, -79.72, Booker T. Washington National Monument). importance: major.
2. **Hampton Normal School** — At 16, Washington walked 500 miles to Hampton Normal and Agricultural Institute in Virginia. His entrance exam was sweeping a floor — the head teacher told him to clean a recitation room and he swept it three times and dusted it four times. She admitted him. He worked as a janitor to pay his tuition. This moment defined his philosophy: prove your worth through work. Location: Hampton, VA (~37.02, -76.34). importance: major.
3. **Founding Tuskegee Institute** — In 1881, at age 25, Washington was chosen to lead a new school for Black students in Tuskegee, Alabama. He arrived to find no building, no land, and a $2,000 state appropriation. He borrowed money to buy an abandoned plantation and his students literally built the school — making bricks, constructing buildings, growing food. Within 20 years Tuskegee had 1,500 students and a $2 million endowment. Location: Tuskegee, AL (~32.43, -85.71). importance: major.
4. **The Atlanta Compromise Speech** — On September 18, 1895, Washington delivered what became known as the "Atlanta Compromise" speech at the Cotton States Exposition. He told a majority-white audience: "Cast down your bucket where you are." He argued Black Americans should focus on economic self-improvement rather than political agitation. It made him the most powerful Black leader in America — and the most controversial. W.E.B. Du Bois would later call it a capitulation. Location: Piedmont Park, Atlanta, GA (~33.78, -84.37). importance: major.
5. **The Austin Snub at Wooldridge Square** — In 1911, Booker T. Washington spoke to 5,000 people at Wooldridge Square in Austin. Despite being the most famous Black American alive, he was denied a room at the Driskill Hotel. Austin's population was 29,000; he drew a crowd larger than a quarter of the city. The speech was one of his last major public appearances. Location: Wooldridge Square, Austin, TX (~30.2724, -97.7456). importance: major.
6. **Dinner at the White House** — On October 16, 1901, President Theodore Roosevelt invited Washington to dinner at the White House — the first time a Black American had dined there as a guest. The backlash was volcanic. Senator Ben Tillman declared: "The action of President Roosevelt in entertaining that n***** will necessitate our killing a thousand n****** in the South before they will learn their place again." Roosevelt never invited another Black guest. Location: The White House, Washington DC (~38.8977, -77.0365). importance: major.

**relatedStoryIds:** ['booker-t-washington-snub', 'austin-1928-plan', 'rosewood-massacre']
**wikipediaSlug:** 'Booker_T._Washington'
**tags:** ['civil-rights', 'education', 'slavery', 'reconstruction', 'texas', 'virginia', 'alabama']

---

### New Story 17: O. Henry — The Fugitive Writer

**Category:** arts-culture
**Years:** 1862–1910
**Why:** Already appears in `o-henry-embezzlement` (Austin bank incident) and connects to `servant-girl-annihilator` (he coined the name!). His full life is a picaresque adventure: orphan → pharmacist → Austin bohemian → embezzler → fugitive in Honduras → prisoner → America's most beloved short story writer.

**Required locations (5-6):**
1. **Greensboro, North Carolina — The Orphan Pharmacist** — William Sidney Porter was born September 11, 1862, in Greensboro, NC. His mother died when he was 3. Raised by his aunt and grandmother, he apprenticed at his uncle's drugstore at 15 and became a licensed pharmacist. He was a voracious reader and obsessive sketcher — the drugstore regulars became characters in his later stories. Location: Greensboro, NC (~36.07, -79.79). importance: major.
2. **Austin Arrival — The Bohemian Years** — Porter arrived in Austin in 1884 at age 21, fleeing a dead-end life. He worked as a pharmacist, a draftsman at the General Land Office, a teller at the First National Bank, and sang with the Hill City Quartette at Scholz Beer Garden. He started a humor newspaper called "The Rolling Stone." Austin in the 1880s was a boomtown of 11,000, and Porter absorbed everything. Location: Austin, TX (~30.267, -97.743, downtown Austin). importance: major.
3. **"Servant Girl Annihilators"** — In a May 10, 1885 letter to his friend Dave Hall, Porter coined one of America's first serial killer nicknames: "Town is fearfully dull... except for the frequent raids of the Servant Girl Annihilators who make things lively in the dull hours of the night." He was living blocks from the crime scenes. This letter is now a primary historical document of the case. Location: Austin, TX (~30.2647, -97.7412, Porter's Austin home area). importance: minor.
4. **Honduras — The Fugitive** — When federal auditors discovered a $5,654.20 shortage at the First National Bank in 1896, Porter was indicted for embezzlement. Rather than face trial, he fled to Honduras — one of the few countries without a US extradition treaty. He spent six months there, reportedly befriending bank robber Al Jennings. He returned to Austin only when his wife was dying of tuberculosis. Location: Tegucigalpa/Trujillo, Honduras (~15.50, -88.00). importance: major.
5. **The Ohio Penitentiary — A Writer Is Born** — Porter was convicted in February 1898 and served 3 years at the Ohio State Penitentiary in Columbus. In prison, he began writing short stories under the pen name "O. Henry" — possibly named after a guard, or a reference to a French pharmacist. He published 14 stories from his cell. By the time he was released, editors were clamoring for his work. Location: Columbus, OH (~39.96, -82.99). importance: major.
6. **New York — The Master of the Twist Ending** — After prison, Porter moved to New York City in 1902 and became the most prolific and popular short story writer in America. He wrote 381 stories in 8 years, including "The Gift of the Magi" and "The Ransom of Red Chief." He died at 47 of cirrhosis and complications from diabetes, alone in a hotel room. His last words: "Turn up the lights. I don't want to go home in the dark." Location: New York City (~40.7128, -74.0060). importance: major.

**relatedStoryIds:** ['o-henry-embezzlement', 'servant-girl-annihilator', 'scholz-garden-austin', 'driskill-hotel']
**wikipediaSlug:** 'O._Henry'
**tags:** ['literature', 'austin', 'crime', 'prison', 'texas', 'new-york', 'fugitive']

---

## OUTPUT REQUIREMENTS

### For PART 1 (Expansions):
Output ONLY the new locations as TypeScript arrays, labeled with the story ID they belong to. Example:
```typescript
// ADD TO: servant-girl-annihilator
[
  { id: 'annihilator-eliza-shelley', name: '...', ... },
  { id: 'annihilator-o-henry-letter', name: '...', ... },
  { id: 'annihilator-gracie-vance', name: '...', ... },
]
```

### For PART 2 (New Stories):
Output complete story objects as TypeScript, ready to paste into the data file.

### Quality Requirements:
- Every coordinate must be REAL and ACCURATE (verify against known addresses)
- Every description must be 100-150 words and tell a specific, vivid story about THAT EXACT SPOT
- Every subtitle must be a punchy one-liner (8 words max)
- `years` field format: `'1972–present'` or `'1993'` (single year). No `'1950s'` style.
- Minimum 3 locations per story, no single-location stories
- Escape apostrophes in single-quoted strings: `'Mexico\'s'`
- Do NOT include `wikipediaSlug: 'None'` — omit the field entirely if no Wikipedia article exists
- Include `relatedStoryIds` cross-references between stories in this batch AND to existing stories listed above
- `importance` values: `'major'` for key story moments, `'minor'` for supporting context, `'contextual'` for background
- `accuracy` values: `'exact'` if address is known and building exists, `'approximate'` if within a block, `'general-area'` if neighborhood-level

### Existing story IDs for cross-references:
servant-girl-annihilator, archive-war-1842, janis-joplin-austin, armadillo-world-hq, treaty-oak-poisoning, austin-1928-plan, booker-t-washington-snub, 1900-granite-dam-disaster, o-henry-embezzlement, cathedral-of-junk, michael-dell-startup, ut-tower-shooting, stevie-ray-vaughan, congress-avenue-bats, barton-springs-sos, lbj-lady-bird-austin, driskill-hotel, battle-of-the-alamo, bonnie-and-clyde, waco-siege, jfk-assassination, galveston-orphanage-stand, spindletop-gusher, menger-hotel-rough-riders, cadillac-ranch-amarillo, palo-duro-final-stand, marfa-lights, new-braunfels-adelsverein
