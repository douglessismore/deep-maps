#!/usr/bin/env python3
"""
Batch 5 Story Insertion Script
Adds 7 story expansions (new locations to existing stories) and 10 new stories.
Handles known Gemini output issues: apostrophe escaping, smart quotes, etc.
"""

import re

STORIES_FILE = '/Users/sirdouglas/Documents/claude-code-projects/deep-maps/src/data/stories.ts'

def fix_apostrophes(s: str) -> str:
    """Fix unescaped apostrophes inside single-quoted TypeScript strings."""
    # Replace smart quotes with straight quotes
    s = s.replace('\u2018', "'").replace('\u2019', "'")
    s = s.replace('\u201c', '"').replace('\u201d', '"')
    # Replace em dashes that might be unicode
    s = s.replace('\u2014', '—')
    s = s.replace('\u2013', '–')
    return s

# ============================================================
# EXPANSION DATA: new locations to add to existing stories
# ============================================================

EXPANSIONS = {
    'servant-girl-annihilator': [
        """      {
        id: 'annihilator-eliza-shelley',
        name: 'The Murder of Eliza Shelley',
        subtitle: 'The second victim proves a pattern of madness',
        description: 'On May 7, 1885, the peace of a quiet Austin spring was shattered when Eliza Shelley, a Black cook, was found brutally murdered in her cabin behind the Hancock house. She had been struck with an axe, her face mutilated with chilling precision. While the earlier murder of Mollie Smith had been dismissed by many as an isolated domestic tragedy, Shelley\\'s death sent a wave of terror through the city. It was the moment Austin realized it wasn\\'t dealing with a common criminal, but a predator stalking the night.',
        lat: 30.2650,
        lng: -97.7410,
        type: 'crime_scene',
        importance: 'major' as const,
        accuracy: 'general-area' as const,
        year: 1885,
      },""",
        """      {
        id: 'annihilator-o-henry-letter',
        name: 'O. Henry Names the Killer',
        subtitle: 'A literary legend coins a terrifying moniker',
        description: 'Living just blocks from the scenes of the carnage, a young bank clerk named William Sydney Porter—later the world-famous author O. Henry—watched the city descend into hysteria. In a letter to his friend Dave Hall dated May 10, 1885, he wrote: "Town is fearfully dull... except for the frequent raids of the Servant Girl Annihilators who make things lively in the dull hours of the night." This offhand remark in a private letter gave birth to one of America\\'s first true serial killer nicknames.',
        lat: 30.2647,
        lng: -97.7412,
        type: 'historic_home',
        importance: 'minor' as const,
        accuracy: 'approximate' as const,
        year: 1885,
      },""",
        """      {
        id: 'annihilator-gracie-vance',
        name: 'The Attack on Gracie Vance',
        subtitle: 'A community in exile from its own streets',
        description: 'On the night of August 30, 1885, the killer\\'s boldness reached a new peak. Gracie Vance was murdered with an axe while her companion, Orange Washington, was also viciously attacked. By this point, the African American community was in a state of total siege; businesses closed at sunset, and groups of armed men patrolled the neighborhoods. The failure of the police to make an arrest led to accusations of systemic neglect, and many Black residents abandoned their homes in Austin entirely.',
        lat: 30.2838,
        lng: -97.7421,
        type: 'crime_scene',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1885,
      },""",
    ],
    'o-henry-embezzlement': [
        """      {
        id: 'ohenry-morley-brothers',
        name: 'The Morley Brothers Drug Store',
        subtitle: 'Where a pharmacist began sketching the world',
        description: 'When William Sydney Porter arrived in Austin in 1884, he was a 21-year-old pharmacist looking for a fresh start. He found it at Morley Brothers on East 8th Street. Between filling prescriptions, he was an obsessive observer, sketching the town\\'s gamblers, cowboys, and elite who frequented the shop. The conversations he eavesdropped on here became the raw material for his early humorous writing.',
        lat: 30.2674,
        lng: -97.7411,
        type: 'workplace',
        importance: 'minor' as const,
        accuracy: 'exact' as const,
        year: 1884,
        address: 'East 8th St, Austin, TX',
      },""",
        """      {
        id: 'ohenry-land-office',
        name: 'The General Land Office',
        subtitle: 'Drafting the boundaries of a literary career',
        description: 'In 1887, Porter took a job as a draftsman at the Texas General Land Office, now the oldest state office building in Texas. He spent four years here mapping the wild geography of the state. The thick stone walls and bureaucratic atmosphere left a deep impression, later serving as the setting for his story "Bexar Scrip No. 2692." This was a period of stability where he married Athol Estes and began his humor magazine, The Rolling Stone.',
        lat: 30.2727,
        lng: -97.7393,
        type: 'workplace',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1887,
        address: '112 E 11th St, Austin, TX 78701',
      },""",
        """      {
        id: 'ohenry-scholz-garden',
        name: 'Scholz Beer Garden',
        subtitle: 'The Hill City Quartette\\'s favorite stage',
        description: 'Porter was a fixture at Scholz Garden, Austin\\'s oldest biergarten and political hub. He was a gifted singer and a member of the Hill City Quartette, which performed German lieder and folk songs for the regulars. Scholz was more than a bar; it was where the town\\'s German heritage and Texas politics collided. The museum still displays the chair and table he used, a physical link to the bohemian lifestyle he enjoyed before the embezzlement charges forced him into exile and prison.',
        lat: 30.2777,
        lng: -97.7363,
        type: 'cultural_venue',
        importance: 'minor' as const,
        accuracy: 'exact' as const,
        year: 1886,
        address: '1607 San Jacinto Blvd, Austin, TX 78701',
      },""",
    ],
    'armadillo-world-hq': [
        """      {
        id: 'armadillo-willie-1972',
        name: 'Willie Nelson\\'s 1972 Performance',
        subtitle: 'The night the "Cosmic Cowboy" was born',
        description: 'On August 12, 1972, Willie Nelson stepped onto the stage at the Armadillo World Headquarters and changed the trajectory of American music. Before this night, country music and rock and roll were on opposite sides of a cultural war. Willie, having fled the rigid hierarchies of Nashville, appeared with long hair and a beat-up guitar, bridging the gap between conservative cowboys and hippie counterculture. For the first time, rednecks and longhairs shared the same dance floor, giving birth to the "cosmic cowboy" movement.',
        lat: 30.2584,
        lng: -97.7498,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1972,
        address: '525 Barton Springs Rd, Austin, TX',
      },""",
        """      {
        id: 'armadillo-final-concert',
        name: 'The Final Concert & Demolition',
        subtitle: 'The end of an era on New Year\\'s Eve',
        description: 'On New Year\\'s Eve 1980, the Armadillo World Headquarters held its last show. Asleep at the Wheel and Commander Cody played until the sun rose, as a crowd of thousands mourned the loss of the city\\'s cultural heart. The building, a former National Guard armory, was demolished in 1981 to make way for a high-rise office tower. Its closure signaled the beginning of Austin\\'s transition from a sleepy college town to a commercialized tech hub.',
        lat: 30.2630,
        lng: -97.7489,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1980,
        address: '525 Barton Springs Rd, Austin, TX',
      },""",
    ],
    'congress-avenue-bats': [
        """      {
        id: 'bats-accidental-joints',
        name: 'The Accidental Discovery',
        subtitle: 'An engineering fluke creates a bat sanctuary',
        description: 'When the Congress Avenue Bridge was reconstructed in 1980, engineers had no idea they were building a massive incubator. The 18-inch-deep expansion joints used in the design were accidentally the perfect temperature and width for Mexican free-tailed bats. By 1984, the population exploded to 750,000, and a city-wide panic ensued. Local newspapers ran sensationalist headlines about "rabid invaders," and petrified residents petitioned the city to exterminate the colony.',
        lat: 30.2617,
        lng: -97.7454,
        type: 'natural_site',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1980,
      },""",
        """      {
        id: 'bats-bci-saves-colony',
        name: 'BCI Saves the Colony',
        subtitle: 'Dr. Merlin Tuttle turns fear into tourism',
        description: 'In 1986, bat expert Dr. Merlin Tuttle made a bold move: he relocated the headquarters of Bat Conservation International to Austin specifically to save the Congress Avenue colony. He launched a massive public education campaign, explaining that the bats eat 20,000 pounds of insects every single night. The panic turned into pride. Today, the colony has grown to 1.5 million bats, making it the largest urban colony in North America.',
        lat: 30.2583,
        lng: -97.7474,
        type: 'organization_hq',
        importance: 'minor' as const,
        accuracy: 'general-area' as const,
        year: 1986,
      },""",
    ],
    'menger-hotel-rough-riders': [
        """      {
        id: 'menger-hotel-opening',
        name: 'The Menger Hotel Opens',
        subtitle: 'The finest hotel west of the Mississippi',
        description: 'In 1859, German immigrant William Menger realized his dream by building a luxurious hotel right next to the ruins of the Alamo. It was an immediate sensation, featuring the first enclosed swimming pool in Texas and the finest cellar in the region. Every U.S. president from Ulysses S. Grant to George H.W. Bush has stayed here. The hotel\\'s limestone walls have witnessed the entire transformation of Texas from a wild frontier into an industrial powerhouse.',
        lat: 29.4249,
        lng: -98.4856,
        type: 'landmark',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1859,
        address: '204 Alamo Plaza, San Antonio, TX 78205',
      },""",
        """      {
        id: 'menger-sallie-white',
        name: 'The Ghost of Sallie White',
        subtitle: 'A chambermaid who never left the third floor',
        description: 'On March 28, 1876, a 26-year-old chambermaid named Sallie White was shot in the street by her common-law husband after an argument. She died in the hotel two days later. The hotel management was so devastated they paid for her entire funeral. Today, Sallie is the Menger\\'s most frequently reported apparition. Guests in the third-floor hallway often see a woman in a long Victorian skirt and a white apron carrying fresh towels; she vanishes as soon as she is approached.',
        lat: 29.4250,
        lng: -98.4855,
        type: 'haunted_site',
        importance: 'minor' as const,
        accuracy: 'exact' as const,
        year: 1876,
      },""",
    ],
    'cadillac-ranch-amarillo': [
        """      {
        id: 'cad-ant-farm-studio',
        name: 'The Ant Farm Studio',
        subtitle: 'Where the "Golden Age" of tailfins was conceived',
        description: 'Cadillac Ranch began as a radical vision by the San Francisco art collective Ant Farm. Members Chip Lord, Hudson Marquez, and Doug Michels wanted to create a monument to the American dream and the evolution of the tailfin. In 1974, they met with eccentric Amarillo billionaire Stanley Marsh 3 at his estate to pitch the idea. Marsh, known for his absurdist pranks, immediately funded the project. The installation was placed at the exact same angle as the Great Pyramid of Giza.',
        lat: 35.1873,
        lng: -101.9872,
        type: 'historic_meeting',
        importance: 'minor' as const,
        accuracy: 'general-area' as const,
        year: 1974,
      },""",
        """      {
        id: 'cad-relocation-spray',
        name: 'The Relocation & Spray Paint Tradition',
        subtitle: 'An ever-changing thick-skinned organism',
        description: 'In 1997, Cadillac Ranch was physically uprooted and moved two miles west to escape the encroaching urban sprawl of Amarillo. Stanley Marsh 3 famously encouraged visitors to spray-paint the cars, turning a static sculpture into a living, participatory artwork. Today, the cars are encased in thousands of layers of paint. Each visitor who adds a layer participates in a sanctioned act of vandalism that has made the site a global pilgrimage point on Route 66.',
        lat: 35.1873,
        lng: -101.9872,
        type: 'art_installation',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1997,
        address: '13651 I-40 Frontage Rd, Amarillo, TX 79124',
      },""",
    ],
    'new-braunfels-adelsverein': [
        """      {
        id: 'adel-comal-landing',
        name: 'The Comal River Landing',
        subtitle: 'Prince Carl chooses a sanctuary in the wilderness',
        description: 'In March 1845, Prince Carl of Solms-Braunfels led 200 exhausted German immigrants to the junction of the Comal and Guadalupe Rivers. They had survived a nightmare journey from the coast where hundreds of their kin had died of cholera. Prince Carl, captivated by the crystalline waters of the Comal springs, purchased the land and named the settlement after his family seat in Germany. It was the birth of the state\\'s most culturally distinct corridor.',
        lat: 29.7080,
        lng: -98.1230,
        type: 'settlement_site',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1845,
        address: 'Landa Park Dr, New Braunfels, TX 78130',
      },""",
        """      {
        id: 'adel-gruene-hall',
        name: 'Gruene Hall',
        subtitle: 'The oldest dance hall in the Lone Star State',
        description: 'Built in 1878 by Henry Gruene, this 6,000-square-foot tin-roofed building is the oldest continually operating dance hall in Texas. It survived the Great Depression, the collapse of the cotton market, and the modernization of rural music. In the 1970s, the hall became a pilgrimage site for the emerging outlaw country scene. George Strait, Willie Nelson, and Lyle Lovett all honed their craft on its creaky wooden stage.',
        lat: 29.7371,
        lng: -98.1053,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1878,
        address: '1281 Gruene Rd, New Braunfels, TX 78130',
      },""",
    ],
}

# ============================================================
# NEW STORIES DATA
# ============================================================

NEW_STORIES = [
    # Willie Nelson's Austin
    """  {
    id: 'willie-nelson-austin',
    name: 'Willie Nelson\\'s Austin',
    years: '1972–present',
    category: 'arts-culture',
    description: 'Willie Nelson is THE defining figure of Austin music. After failing in Nashville, he returned to Texas and staged a 1972 performance at the Armadillo that fused redneck and hippie cultures into the "cosmic cowboy" movement. His annual 4th of July picnics and his "Luck" ranch have turned these coordinates into sacred sites of Texas outlaw country.',
    tags: ['austin', 'music', 'country', 'outlaw-country', 'cosmic-cowboy', 'texas'],
    relatedStoryIds: ['armadillo-world-hq', 'janis-joplin-austin', 'broken-spoke-austin'],
    wikipediaSlug: 'Willie_Nelson',
    locations: [
      {
        id: 'willie-abbott-birth',
        name: 'Born in Abbott',
        subtitle: 'The tiny town where a legend began',
        description: 'Willie Taliaferro Nelson was born April 29, 1933, in this tiny cotton town. Raised by his grandparents, he took music lessons from mail-order catalogs and wrote his first song at age seven. The town of Abbott (population 356) remains a pilgrimage site for fans, where the small Methodist church he once attended is still standing.',
        lat: 31.8841,
        lng: -97.0731,
        type: 'residence',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1933,
        address: 'Abbott, TX 76621',
      },
      {
        id: 'willie-nashville-fire',
        name: 'The Nashville Sign',
        subtitle: 'Rescuing Trigger from the flames',
        description: 'By 1970, Willie was a successful Nashville songwriter ("Crazy", "Hello Walls") but a failure as a recording artist. In a dramatic turning point, his Nashville home caught fire. Willie famously ran into the burning building to save two things: his guitar "Trigger" and a pound of marijuana. He took the disaster as a sign that his time in Nashville was over.',
        lat: 36.1627,
        lng: -86.7816,
        type: 'residence',
        importance: 'minor' as const,
        accuracy: 'general-area' as const,
        year: 1970,
      },
      {
        id: 'willie-dripping-picnic',
        name: 'The First 4th of July Picnic',
        subtitle: 'Chaos and country music in the rain',
        description: 'In 1973, Willie threw his first 4th of July Picnic at Dripping Springs. The lineup was a Texas dream: Waylon Jennings, Kris Kristofferson, and Doug Sahm. However, the event descended into beautiful chaos when torrential rains hit. Despite the mayhem, the Picnic became a foundational myth for the Austin music scene, an annual rite of passage that has continued for over 50 years.',
        lat: 30.1917,
        lng: -98.0833,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'approximate' as const,
        year: 1973,
        address: 'Dripping Springs, TX',
      },
      {
        id: 'willie-luck-ranch',
        name: 'Luck, Texas',
        subtitle: 'A movie set turned into a private sanctuary',
        description: 'Located in Spicewood, "Luck" is Willie Nelson\\'s private ranch, named after the 1880s Western movie set built for the film "Red Headed Stranger." Willie famously says: "When you\\'re here, you\\'re in Luck. When you leave, you\\'re out of Luck." The site includes a chapel, a general store, and an opera house where he hosts exclusive concerts.',
        lat: 30.4700,
        lng: -98.1300,
        type: 'residence',
        importance: 'minor' as const,
        accuracy: 'general-area' as const,
        year: 2010,
      },
    ],
  },""",

    # Victory Grill & Chitlin' Circuit
    """  {
    id: 'victory-grill-chitlin',
    name: 'The Victory Grill & Austin\\'s Chitlin\\' Circuit',
    years: '1945–present',
    category: 'arts-culture',
    description: 'During the era of legal segregation, the Victory Grill was THE anchor of Austin\\'s African American music scene. Opened on V-J Day in 1945, it became a mandatory stop on the legendary "Chitlin\\' Circuit," hosting everyone from B.B. King to Billie Holiday. It remains a rare surviving monument to the vibrant Black culture of East Austin.',
    tags: ['austin', 'music', 'civil-rights', 'african-american', 'blues', 'segregation'],
    relatedStoryIds: ['stevie-ray-vaughan', 'armadillo-world-hq', 'austin-1928-plan'],
    wikipediaSlug: 'Victory_Grill',
    locations: [
      {
        id: 'victory-grill-opening',
        name: 'The Victory Grill',
        subtitle: 'A homecoming sanctuary for Black veterans',
        description: 'Johnny Holmes opened the Victory Grill on August 15, 1945—the day Japan surrendered—as a place for returning Black soldiers to feel at home in a segregated city. It quickly evolved from a restaurant into a premier blues and jazz venue. Every major African American act touring the South played here, including Bobby Bland, Gatemouth Brown, and Janis Joplin. In 1988, a devastating fire nearly destroyed the building, but it was painstakingly restored as a National Historic Landmark.',
        lat: 30.2717,
        lng: -97.7279,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1945,
        address: '1104 E 11th St, Austin, TX 78702',
      },
      {
        id: 'victory-doris-miller',
        name: 'Doris Miller Auditorium',
        subtitle: 'Named for a hero, built for the community',
        description: 'Named after the Pearl Harbor hero Doris Miller, this East Austin auditorium was a massive pillar of the Chitlin\\' Circuit. During segregation, it was one of the few large-scale venues in Texas where Black artists like Ella Fitzgerald and Ike & Tina Turner could perform for Black audiences without harassment. Its sheer scale allowed the community to congregate in a way that smaller clubs could not.',
        lat: 30.2680,
        lng: -97.7230,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1950,
        address: '2300 Rosewood Ave, Austin, TX 78702',
      },
      {
        id: 'victory-charlies-playhouse',
        name: 'Charlie\\'s Playhouse',
        subtitle: 'The integration of the East 11th corridor',
        description: 'In the 1950s and 60s, Charlie\\'s Playhouse was the hottest ticket in Austin. While most of the city was strictly segregated, Charlie\\'s became a "cross-over" club where adventurous white students from UT would cross East Avenue to hear authentic R&B and blues. The venue was part of a thriving entertainment district that included dozens of Black-owned businesses, a world that was largely destroyed when the city used "urban renewal" funds to bulldoze much of the corridor in the 1970s.',
        lat: 30.2720,
        lng: -97.7260,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'approximate' as const,
        year: 1955,
      },
    ],
  },""",

    # The Broken Spoke
    """  {
    id: 'broken-spoke-austin',
    name: 'The Broken Spoke',
    years: '1964–present',
    category: 'arts-culture',
    description: 'Known as the "last of the true Texas dance halls," the Broken Spoke is an iconic honky-tonk that has refused to change even as luxury condos surrounded it on all sides. George Strait launched his career here, and Willie Nelson is a regular. James White, the legendary owner, turned down millions from developers to keep the sawdust on the floor.',
    tags: ['austin', 'music', 'country', 'honky-tonk', 'preservation', 'texas'],
    relatedStoryIds: ['armadillo-world-hq', 'willie-nelson-austin'],
    wikipediaSlug: 'Broken_Spoke_(dance_hall)',
    locations: [
      {
        id: 'spoke-opening-night',
        name: 'Opening Night 1964',
        subtitle: 'Sawdust and southern fried cooking on South Lamar',
        description: 'James White opened the Broken Spoke in 1964 when South Lamar was just a dusty road on the outskirts of town. He built the original tin structure himself, serving chicken-fried steak and hosting legendary acts like Bob Wills and Tex Ritter. The original sawdust floor and low ceilings have remained unchanged for six decades.',
        lat: 30.2405,
        lng: -97.7856,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1964,
        address: '3201 S Lamar Blvd, Austin, TX 78704',
      },
      {
        id: 'spoke-george-strait',
        name: 'George Strait\\'s Early Gigs',
        subtitle: 'The King of Country plays for $500 a night',
        description: 'In the late 1970s, a young and unknown George Strait played the Broken Spoke regularly with his Ace in the Hole Band. Long before he was selling out stadiums, he was playing for a few hundred dollars and a pitcher of beer. The walls of the Spoke are now a museum of country music history, covered in photos of Strait, Dolly Parton, and Kris Kristofferson.',
        lat: 30.2405,
        lng: -97.7856,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1979,
      },
      {
        id: 'spoke-survival-battle',
        name: 'Survival Against Development',
        subtitle: '"I\\'d rather be broke and keep the Spoke"',
        description: 'By the early 2000s, the land under the Broken Spoke was worth tens of millions of dollars. Developers built five-story luxury apartment complexes that now tower over the small tin building, literally surrounding it on all sides. James White famously refused every buyout offer. After his death in 2021, his family continued to run the hall, maintaining the tradition of live country music every night.',
        lat: 30.2405,
        lng: -97.7856,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 2010,
      },
    ],
  },""",

    # The Paramount Theatre
    """  {
    id: 'paramount-theatre-austin',
    name: 'The Paramount Theatre',
    years: '1915–present',
    category: 'arts-culture',
    description: 'Austin\\'s oldest surviving theater is a portal into the city\\'s evolving soul. From vaudeville acts and Houdini escapes to psychedelic rock and world film premieres, the Paramount has survived near-death and urban neglect to become the center of Austin\\'s modern cultural revival.',
    tags: ['austin', 'theater', 'film', 'preservation', 'vaudeville', 'architecture'],
    relatedStoryIds: ['dazed-and-confused-austin', 'cathedral-of-junk'],
    wikipediaSlug: 'Paramount_Theatre_(Austin,_Texas)',
    locations: [
      {
        id: 'paramount-majestic-opening',
        name: 'The Majestic Theatre',
        subtitle: 'Vaudeville and twinkling stars on Congress Avenue',
        description: 'Opened in 1915 as "The Majestic," this vaudeville house was designed by John Eberson to be an "atmospheric" experience. The ceiling was painted to look like a night sky with twinkling electric stars, a wonder for early 20th-century Austin. The theater hosted every major traveling act of the era, including a legendary performance by Houdini.',
        lat: 30.2682,
        lng: -97.7432,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1915,
        address: '713 Congress Ave, Austin, TX 78701',
      },
      {
        id: 'paramount-near-death',
        name: 'The Psychedelic Era & Near-Death',
        subtitle: 'Saving a landmark from the wrecking ball',
        description: 'By the 1970s, the theater had fallen into serious disrepair. It was part of a franchise showing kung fu and blaxploitation films, and the building was slated for demolition as part of a downtown redevelopment plan. A grassroots campaign led by the Austin Heritage Society saved the theater in 1975, renaming it The Paramount. This restoration was the first major win for the city\\'s modern preservation movement.',
        lat: 30.2682,
        lng: -97.7432,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1975,
      },
      {
        id: 'paramount-film-revival',
        name: 'Austin Film Society & SXSW',
        subtitle: 'The premiere venue for the film capital of the South',
        description: 'In the 1990s, director Richard Linklater\\'s Austin Film Society made the Paramount its primary home for classic and independent screenings. The theater\\'s status was further cemented as the main stage for SXSW Film premieres. Today, the Paramount hosts over 200 events annually, from the Austin Film Festival to national comedy acts, standing as the most active and successful historic preservation project in the state of Texas.',
        lat: 30.2682,
        lng: -97.7432,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1993,
      },
    ],
  },""",

    # Scholz Garden
    """  {
    id: 'scholz-garden-austin',
    name: 'Scholz Garden — Austin\\'s Oldest Bar',
    years: '1866–present',
    category: 'everyday-extraordinary',
    description: 'Opened just after the Civil War, Scholz Garden is the oldest continuously operated business in Austin and the oldest bar in Texas. It has survived Prohibition, the rise and fall of political dynasties, and 150 years of UT football. For generations, it has served as the unofficial headquarters of Texas Democratic politics.',
    tags: ['austin', 'beer', 'german-heritage', 'politics', 'preservation', 'texas'],
    relatedStoryIds: ['o-henry-embezzlement', 'lbj-lady-bird-austin'],
    wikipediaSlug: 'Scholz_Garten',
    locations: [
      {
        id: 'scholz-opening-1866',
        name: 'August Scholz\\'s Boarding House',
        subtitle: 'A German immigrant\\'s sanctuary in the capital',
        description: 'In 1866, German immigrant and former Confederate soldier August Scholz opened a boarding house and beer garden on San Jacinto Boulevard. It immediately became the social hub for the city\\'s thriving German population. In 1879, it became the home of the Austin Saengerrunde, a German singing society that still owns the building today. The garden survived Prohibition by selling "near beer" and bratwurst.',
        lat: 30.2777,
        lng: -97.7363,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1866,
        address: '1607 San Jacinto Blvd, Austin, TX 78701',
      },
      {
        id: 'scholz-political-backroom',
        name: 'The Political Watering Hole',
        subtitle: 'Pitchers of beer and the levers of power',
        description: 'Located just three blocks from the Texas Capitol, Scholz Garden became the unofficial clubhouse for the state legislature. LBJ and Ann Richards were regulars, and generations of lobbyists and lawmakers have settled political scores at its long wooden tables. Every election night, the garden is the site of massive watch parties where the state\\'s political future is debated in real-time.',
        lat: 30.2777,
        lng: -97.7363,
        type: 'government',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1948,
      },
      {
        id: 'scholz-longhorn-tradition',
        name: 'UT Football & Preservation',
        subtitle: 'The ultimate pre-game ritual for over 100 years',
        description: 'For as long as UT has played football, Longhorn fans have gathered at Scholz Garden before and after games. The biergarten atmosphere, complete with a vintage bowling alley and oom-pah bands, creates a unique Texas-German fusion found nowhere else. The Saengerrunde\\'s refusal to sell ensured its survival. Today, it remains a living time capsule where a freshman and a state senator can share a pitcher of Shiner.',
        lat: 30.2777,
        lng: -97.7363,
        type: 'cultural_venue',
        importance: 'minor' as const,
        accuracy: 'exact' as const,
        year: 1920,
      },
    ],
  },""",

    # Texas State Cemetery
    """  {
    id: 'texas-state-cemetery',
    name: 'Texas State Cemetery',
    years: '1851–present',
    category: 'political-drama',
    description: 'Known as the "Arlington of Texas," this 22-acre site is the final resting place for the Republic\\'s greatest heroes and its most controversial figures. From Stephen F. Austin and Barbara Jordan to Confederate generals and modern governors, the cemetery is a physical compressed history of the state.',
    tags: ['austin', 'texas', 'cemetery', 'republic-of-texas', 'civil-rights', 'governors'],
    relatedStoryIds: ['battle-of-the-alamo', 'lbj-lady-bird-austin', 'booker-t-washington-snub'],
    wikipediaSlug: 'Texas_State_Cemetery',
    locations: [
      {
        id: 'cemetery-stephen-austin',
        name: 'Stephen F. Austin\\'s Reburial',
        subtitle: 'The Father of Texas returns to the capital',
        description: 'The cemetery was established in 1851 specifically to provide a final resting place for Stephen F. Austin. He had died penniless in a small cabin in 1836, and his body was moved here from a remote plantation. His massive monument at the center of the grounds established the site as the state\\'s primary secular shrine.',
        lat: 30.2619,
        lng: -97.7258,
        type: 'burial',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1851,
        address: '909 Navasota St, Austin, TX 78702',
      },
      {
        id: 'cemetery-barbara-jordan',
        name: 'Barbara Jordan\\'s Grave',
        subtitle: 'A voice for the Constitution in the heart of Texas',
        description: 'Barbara Jordan, the first Southern Black woman in Congress, is buried here, making her one of the most prominent African American figures in the cemetery. Her grave stands in a section that once only honored the state\\'s white elite, a powerful symbol of the progress of civil rights in Texas.',
        lat: 30.2615,
        lng: -97.7255,
        type: 'burial',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1996,
      },
      {
        id: 'cemetery-1994-restoration',
        name: 'The 1994 Restoration',
        subtitle: 'Transforming a neglected yard into a national monument',
        description: 'By the early 1990s, the cemetery had fallen into serious disrepair, with toppled stones and overgrown weeds. Governor George W. Bush championed a $4.8 million restoration that added a state-of-the-art visitors center and extensive new landscaping. The project transformed the site into an active memorial and a major tourist attraction.',
        lat: 30.2619,
        lng: -97.7258,
        type: 'cultural_venue',
        importance: 'minor' as const,
        accuracy: 'exact' as const,
        year: 1994,
      },
    ],
  },""",

    # Mt. Bonnell
    """  {
    id: 'mount-bonnell-austin',
    name: 'Mt. Bonnell',
    years: '1840–present',
    category: 'everyday-extraordinary',
    description: 'Austin\\'s most iconic viewpoint is a 240-million-year-old limestone ridge that has served as a sanctuary and a lover\\'s leap for centuries. From prehistoric settlements to 19th-century steamboat picnics, Mt. Bonnell is the city\\'s oldest tourist destination. Its 775-foot summit offers a panorama of the Hill Country.',
    tags: ['austin', 'nature', 'landmark', 'geology', 'romance', 'texas'],
    relatedStoryIds: ['lbj-lady-bird-austin', 'treaty-oak-poisoning', 'barton-springs-sos'],
    wikipediaSlug: 'Mount_Bonnell',
    locations: [
      {
        id: 'bonnell-summit',
        name: 'The Summit',
        subtitle: '775 feet above the Colorado River',
        description: 'Mt. Bonnell is the highest point within Austin city limits, a sheer limestone cliff offering a 360-degree view of Lake Austin and the downtown skyline. Named after George W. Bonnell, a Commissioner of Indian Affairs who allegedly leaped to his death from the cliff in 1842 to avoid capture by a Comanche raiding party, the site is steeped in local lore.',
        lat: 30.3210,
        lng: -97.7734,
        type: 'natural_site',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1840,
        address: '3800 Mt Bonnell Rd, Austin, TX 78731',
      },
      {
        id: 'bonnell-picnic-tradition',
        name: 'Texas\\'s Oldest Tourist Attraction',
        subtitle: 'Steamboats and dances at the Lover\\'s Leap',
        description: 'Since the 1850s, Mt. Bonnell has been the city\\'s primary social destination. In the mid-19th century, visitors would take steamboats up the Colorado River to the base of the mountain and hike to the top for picnics and dances. A popular superstition developed: if a couple climbs the mountain together, they will fall in love.',
        lat: 30.3210,
        lng: -97.7734,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1860,
      },
      {
        id: 'bonnell-lady-bird-view',
        name: 'Lady Bird\\'s Favorite View',
        subtitle: 'Wildflowers and the protection of the river corridor',
        description: 'Lady Bird Johnson considered the view from Mt. Bonnell to be her favorite in all of Austin. She used her national influence to advocate for the preservation of the natural beauty of the river corridor that stretches below the summit. The wildflowers that carpet the slopes each spring are a direct result of her highway beautification efforts.',
        lat: 30.3210,
        lng: -97.7734,
        type: 'natural_site',
        importance: 'minor' as const,
        accuracy: 'exact' as const,
        year: 1970,
      },
    ],
  },""",

    # Dazed and Confused
    """  {
    id: 'dazed-and-confused-austin',
    name: 'Dazed and Confused — Austin on Film',
    years: '1993',
    category: 'arts-culture',
    description: 'Richard Linklater\\'s 1993 cult classic perfectly captured the soul of 1970s Austin. Filmed entirely in the city, the movie used local landmarks like Top Notch Hamburgers and a real moonlight tower to create a world that felt more authentic than the 70s themselves. Matthew McConaughey\\'s breakout role as Wooderson cemented Austin\\'s status as the independent film capital of the South.',
    tags: ['austin', 'film', '1970s', 'coming-of-age', 'linklater', 'mcconaughey'],
    relatedStoryIds: ['servant-girl-annihilator', 'paramount-theatre-austin'],
    wikipediaSlug: 'Dazed_and_Confused_(film)',
    locations: [
      {
        id: 'dazed-top-notch',
        name: 'Top Notch Hamburgers',
        subtitle: 'The Emporium and the breakout of Wooderson',
        description: 'This drive-in burger joint served as "The Emporium," the central hangout where the film\\'s characters congregate. It was here that Matthew McConaughey improvised the line "alright, alright, alright," which became a global catchphrase. Top Notch is still open and almost entirely unchanged since its 1971 opening.',
        lat: 30.3474,
        lng: -97.7389,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1993,
        address: '7525 Burnet Rd, Austin, TX 78757',
      },
      {
        id: 'dazed-moonlight-party',
        name: 'The Moonlight Tower Party',
        subtitle: 'Party at the tower under the artificial moon',
        description: 'The film\\'s climactic keg party was filmed at a real Austin moonlight tower near Hemphill Park. These 165-foot towers, originally installed in 1894 to catch a serial killer, are unique to Austin—the only surviving system in the world. Linklater used the tower as a symbol of the city\\'s weird and enduring heritage.',
        lat: 30.2856,
        lng: -97.7351,
        type: 'landmark',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1993,
      },
      {
        id: 'dazed-bedichek-middle',
        name: 'Bedichek Middle School',
        subtitle: 'The hazing rituals of Huntsville and Austin',
        description: 'The school scenes, including the iconic first-day-of-school hazing rituals, were filmed at Bedichek Middle School during the summer break. Linklater, who grew up in Huntsville, Texas, set the film in Austin because he considered it the "freest place in Texas." The success of the film helped establish the infrastructure for the Austin film industry.',
        lat: 30.1906,
        lng: -97.7869,
        type: 'university',
        importance: 'minor' as const,
        accuracy: 'exact' as const,
        year: 1993,
        address: '6800 Bill Hughes Rd, Austin, TX 78745',
      },
    ],
  },""",

    # Booker T. Washington — life story
    """  {
    id: 'booker-t-washington-life',
    name: 'Booker T. Washington — From Slavery to the White House',
    years: '1856–1915',
    category: 'political-drama',
    description: 'Booker T. Washington\\'s life is one of the most remarkable arcs in American history. Born into slavery on a Virginia tobacco plantation, he walked hundreds of miles to gain an education and eventually founded the Tuskegee Institute. As the most powerful Black leader in America, he advised presidents and faced volcanic backlash for his "Atlanta Compromise" speech.',
    tags: ['civil-rights', 'education', 'slavery', 'reconstruction', 'texas', 'virginia', 'alabama'],
    relatedStoryIds: ['booker-t-washington-snub', 'austin-1928-plan'],
    wikipediaSlug: 'Booker_T._Washington',
    locations: [
      {
        id: 'btw-virginia-birth',
        name: 'Born Into Slavery',
        subtitle: 'The Burroughs plantation and the walk to Malden',
        description: 'Washington was born enslaved on April 5, 1856, on a small tobacco plantation in Virginia. He never knew his father, a white man from a neighboring farm. At age nine, following emancipation, he walked with his family to West Virginia to work in salt furnaces and coal mines. This period of extreme labor shaped his later philosophy that economic independence through manual work was the only path to Black advancement.',
        lat: 37.0600,
        lng: -79.7200,
        type: 'discovery_site',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1856,
        address: '12130 Booker T. Washington Hwy, Hardy, VA 24101',
      },
      {
        id: 'btw-hampton-entrance',
        name: 'Hampton Normal School',
        subtitle: 'An entrance exam involving a broom and a duster',
        description: 'At age 16, Washington walked 500 miles to reach the Hampton Institute. His entrance exam was an unconventional test of character: a teacher told him to clean a recitation room. Washington swept the floor three times and dusted every surface four times. When the teacher returned and could find no dirt, she quietly said, "I guess you will do to enter this institution."',
        lat: 37.0200,
        lng: -76.3400,
        type: 'university',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1872,
        address: '100 E Queen St, Hampton, VA 23668',
      },
      {
        id: 'btw-tuskegee-founding',
        name: 'Founding Tuskegee Institute',
        subtitle: 'A school built from the clay of a cotton field',
        description: 'In 1881, Washington arrived in Tuskegee, Alabama, to find a school that existed only on paper. With no land and only a small state appropriation, he borrowed money to buy an abandoned plantation. His students literally built the school from the ground up—clearing the land, making their own bricks, and constructing the first buildings. By the time of his death, Tuskegee had over 1,500 students and 100 buildings.',
        lat: 32.4300,
        lng: -85.7100,
        type: 'university',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1881,
        address: '1200 W Montgomery Rd, Tuskegee, AL 36088',
      },
      {
        id: 'btw-atlanta-compromise',
        name: 'The Atlanta Compromise',
        subtitle: 'The speech that split a movement',
        description: 'On September 18, 1895, Washington delivered his most famous and controversial speech at the Cotton States Exposition. He told a mostly white audience: "Cast down your bucket where you are," arguing that Black Americans should accept social segregation in exchange for economic opportunity. The speech made him a national hero to whites and the most powerful Black man in America, but it also earned him the lifelong opposition of W.E.B. Du Bois.',
        lat: 33.7800,
        lng: -84.3700,
        type: 'cultural_venue',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1895,
        address: 'Piedmont Park, Atlanta, GA',
      },
      {
        id: 'btw-white-house-dinner',
        name: 'Dinner at the White House',
        subtitle: 'A historic meal that triggered a national scandal',
        description: 'On October 16, 1901, President Theodore Roosevelt invited Washington to dinner at the White House—the first time a Black American had dined there as a guest. The backlash from the white South was volcanic; newspapers described the dinner as a "national outrage." Roosevelt, stunned by the intensity of the racism, never invited another Black guest to a formal dinner.',
        lat: 38.8977,
        lng: -77.0365,
        type: 'government',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1901,
        address: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
      },
    ],
  },""",

    # O. Henry — life story
    """  {
    id: 'o-henry-life',
    name: 'O. Henry — The Fugitive Writer',
    years: '1862–1910',
    category: 'arts-culture',
    description: 'William Sydney Porter\\'s life was more dramatic than any of the stories he wrote. From an orphan pharmacist in North Carolina to an Austin bohemian, he went from a fugitive in Honduras to a convict in the Ohio Penitentiary. It was behind bars that "O. Henry" was born, writing the twist-ending stories that would make him the most beloved author in America.',
    tags: ['literature', 'austin', 'crime', 'prison', 'texas', 'new-york', 'fugitive'],
    relatedStoryIds: ['o-henry-embezzlement', 'servant-girl-annihilator', 'scholz-garden-austin', 'driskill-hotel'],
    wikipediaSlug: 'O._Henry',
    locations: [
      {
        id: 'ohenry-greensboro-birth',
        name: 'The Orphan Pharmacist',
        subtitle: 'Raised in a drugstore in Greensboro',
        description: 'Porter was born September 11, 1862, in Greensboro, NC. His mother died when he was only three, and he was raised by his aunt in a house filled with books and sketching paper. At age 15, he began an apprenticeship at his uncle\\'s drugstore, eventually becoming a licensed pharmacist. The regulars at the shop became the prototypes for his later characters.',
        lat: 36.0729,
        lng: -79.7956,
        type: 'residence',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1862,
        address: 'Greensboro, NC',
      },
      {
        id: 'ohenry-honduras-exile',
        name: 'Honduras — The Fugitive',
        subtitle: 'Fleeing the law in a country with no treaty',
        description: 'When federal auditors indicted Porter for a $5,654.20 shortage at the First National Bank in 1896, he made a snap decision that ruined his reputation: he fled. He took a train to New Orleans and then a steamer to Honduras, one of the few countries without a US extradition treaty. He spent six months living as a bohemian, reportedly befriending the infamous bank robber Al Jennings.',
        lat: 15.9181,
        lng: -85.9525,
        type: 'discovery_site',
        importance: 'major' as const,
        accuracy: 'general-area' as const,
        year: 1896,
        address: 'Trujillo, Honduras',
      },
      {
        id: 'ohenry-ohio-pen',
        name: 'The Ohio Penitentiary',
        subtitle: 'A master writer is born in a prison cell',
        description: 'Convicted in February 1898, Porter served three years in the Ohio State Penitentiary in Columbus. His training as a pharmacist saved him from hard labor; he was assigned to the prison hospital. In the quiet of the night shifts, he began writing short stories to support his daughter, adopting the pen name "O. Henry" to protect his identity. He published 14 stories from prison.',
        lat: 39.9722,
        lng: -83.0139,
        type: 'discovery_site',
        importance: 'major' as const,
        accuracy: 'exact' as const,
        year: 1898,
        address: '248 W Spring St, Columbus, OH 43215',
      },
      {
        id: 'ohenry-new-york-death',
        name: 'New York — The Final Act',
        subtitle: 'The master of the twist ending dies in the dark',
        description: 'After prison, Porter moved to New York City in 1902 and entered a period of staggering productivity, writing a story a week for the New York World. He became a celebrity, known for his reclusive habits. He died at age 47 in a New York hotel room from cirrhosis. His last words were a final touch of O. Henry irony: "Turn up the lights. I don\\'t want to go home in the dark."',
        lat: 40.7128,
        lng: -74.0060,
        type: 'residence',
        importance: 'major' as const,
        accuracy: 'general-area' as const,
        year: 1910,
      },
    ],
  },""",
]


def main():
    # Read the file
    with open(STORIES_FILE, 'r') as f:
        lines = f.readlines()

    print(f"Original file: {len(lines)} lines")

    # Process expansions (work bottom-up to preserve line numbers)
    # Sort stories by their locations array end position, descending
    story_positions = {}
    for i, line in enumerate(lines, 1):
        for story_id in EXPANSIONS:
            if f"id: '{story_id}'," in line:
                story_positions[story_id] = i

    # Find locations array end for each story
    expansion_inserts = []
    for story_id, start_line in story_positions.items():
        # Find the locations: [ line
        loc_start = None
        bracket_depth = 0
        loc_end = None

        for i in range(start_line - 1, min(start_line + 200, len(lines))):
            if 'locations: [' in lines[i]:
                loc_start = i
                bracket_depth = 1
                continue
            if loc_start is not None:
                bracket_depth += lines[i].count('[') - lines[i].count(']')
                if bracket_depth == 0:
                    loc_end = i  # This is the line with ],
                    break

        if loc_end is not None:
            expansion_inserts.append((loc_end, story_id))
            print(f"  Found {story_id} locations end at line {loc_end + 1}")
        else:
            print(f"  WARNING: Could not find locations end for {story_id}")

    # Sort inserts by line number descending (so we insert from bottom up)
    expansion_inserts.sort(key=lambda x: x[0], reverse=True)

    for loc_end, story_id in expansion_inserts:
        new_locations = EXPANSIONS[story_id]
        insert_text = '\n'.join(new_locations) + '\n'
        # Insert before the ], line
        lines.insert(loc_end, insert_text)
        print(f"  Inserted {len(new_locations)} locations for {story_id}")

    # Now append new stories before the final ];
    # Find the last ]; in the file
    file_end = None
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].strip() == '];':
            file_end = i
            break

    if file_end is None:
        print("ERROR: Could not find closing ]; of stories array")
        return

    print(f"\n  Found array end at line {file_end + 1}")

    # Insert all new stories before ];
    all_new_stories = '\n'.join(NEW_STORIES) + '\n'
    lines.insert(file_end, all_new_stories)
    print(f"  Inserted {len(NEW_STORIES)} new stories")

    # Write back
    with open(STORIES_FILE, 'w') as f:
        f.writelines(lines)

    final_count = len(lines)
    print(f"\nDone! File now has {final_count} lines")

    # Also update relatedStoryIds for existing stories that should reference new ones
    # Read the file again for these targeted edits
    with open(STORIES_FILE, 'r') as f:
        content = f.read()

    # Add cross-references
    updates = {
        # armadillo should reference willie
        "id: 'armadillo-world-hq',": {
            "old": "relatedStoryIds: ['janis-joplin-austin'],",
            "new": "relatedStoryIds: ['janis-joplin-austin', 'willie-nelson-austin', 'broken-spoke-austin'],",
        },
        # servant-girl should reference dazed-and-confused (moonlight towers connection)
        "id: 'servant-girl-annihilator',": {
            "old": "relatedStoryIds: ['treaty-oak-poisoning'],",
            "new": "relatedStoryIds: ['treaty-oak-poisoning', 'dazed-and-confused-austin', 'o-henry-life'],",
        },
        # o-henry-embezzlement should reference o-henry-life and scholz-garden
        "id: 'o-henry-embezzlement',": {
            "old_pattern": r"relatedStoryIds: \[[^\]]*\],",
            "new": "relatedStoryIds: ['o-henry-life', 'scholz-garden-austin', 'servant-girl-annihilator'],",
        },
    }

    for story_marker, update in updates.items():
        # Find the story section
        pos = content.find(story_marker)
        if pos == -1:
            print(f"  WARNING: Could not find {story_marker} for cross-ref update")
            continue

        if 'old' in update:
            # Simple string replacement within the story section
            old_str = update['old']
            # Find it near the story marker
            search_start = pos
            search_end = content.find('\n  },\n', search_start)
            if search_end == -1:
                search_end = search_start + 2000

            section = content[search_start:search_end]
            if old_str in section:
                content = content[:search_start] + section.replace(old_str, update['new']) + content[search_end:]
                print(f"  Updated relatedStoryIds for {story_marker}")
            else:
                print(f"  WARNING: Could not find relatedStoryIds pattern in {story_marker}")
        elif 'old_pattern' in update:
            import re
            search_start = pos
            search_end = content.find('\n  },\n', search_start)
            if search_end == -1:
                search_end = search_start + 2000
            section = content[search_start:search_end]
            new_section = re.sub(update['old_pattern'], update['new'], section, count=1)
            if new_section != section:
                content = content[:search_start] + new_section + content[search_end:]
                print(f"  Updated relatedStoryIds for {story_marker}")
            else:
                print(f"  WARNING: regex did not match for {story_marker}")

    with open(STORIES_FILE, 'w') as f:
        f.write(content)

    print("\nAll cross-references updated.")
    print("Run: npx tsc --noEmit to verify")


if __name__ == '__main__':
    main()
