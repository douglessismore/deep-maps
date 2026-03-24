// ─── Meteorite Impact Craters Draft ──────────────────────────────────────
// BATCH 1: 30 most notable/largest confirmed impact craters on Earth.
//
// EXISTING crater moments (already in moments.ts — DO NOT duplicate):
//   chicxulub-crater, tunguska-event, chelyabinsk-meteor, vredefort-crater,
//   sudbury-basin, manicouagan-crater, popigai-crater, chesapeake-bay-crater,
//   barringer-meteor-crater, nordlinger-ries, wolfe-creek-crater, gosses-bluff,
//   lonar-lake, kaali-crater, pingualuit-crater, hoba-meteorite,
//   campo-del-cielo, sikhote-alin, siljan-ring, tswaing-crater
//
// NOTE: tunguska-event-1908 also exists as a duplicate — use tunguska-event.
//
// Source: Earth Impact Database (University of New Brunswick), ~190 confirmed
// structures. Wikipedia "List of impact structures on Earth" cross-referenced.
// Impact Earth (University of Western Ontario) lists ~195 as of 2025.
//
// See COMPLETE TRACKING LIST at the bottom of this file for all ~190 craters.

import type { Moment, StoryCollection } from '../../src/types';

// ═══════════════════════════════════════════════════════════════════════════
// BATCH 1: 30 NEW MOMENTS — largest and most notable craters
// ═══════════════════════════════════════════════════════════════════════════

export const meteoriteCraterMoments: Moment[] = [
  // ── 1. Morokweng — South Africa, 70 km, 145 Ma ──
  {
    id: 'morokweng-crater',
    name: 'A Meteorite Strikes the Kalahari and Leaves a 70-Kilometer Crater Buried Under Desert Sand',
    subtitle: 'Near Morokweng, North West Province, South Africa. Crater buried under Kalahari sand; no surface expression',
    description: 'A large asteroid struck here roughly 145 million years ago, carving a crater 70 km across at the Jurassic-Cretaceous boundary. The structure lies completely buried beneath Kalahari sand and was only discovered in 1994 through magnetic anomaly surveys. In 2006, a 25-cm fragment of the original meteorite was found intact in the drill core at 770 m depth — an extraordinary find, since impactors are almost always vaporized. The discovery rewrote assumptions about what survives cosmic collisions.',
    lat: -26.47,
    lng: 23.53,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -145000000,
    address: 'Near Morokweng, North West Province, South Africa',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 2. Kara — Russia, 65 km, 70.3 Ma ──
  {
    id: 'kara-crater',
    name: 'An Asteroid Strikes the Arctic Tundra and Carves a 65-Kilometer Crater on the Yugorsky Peninsula',
    subtitle: 'Yugorsky Peninsula, Nenets Autonomous Okrug, Russia. Remote Arctic tundra; heavily eroded with no visible rim',
    description: 'This 65-km impact structure on the Yugorsky Peninsula near the Kara Sea formed roughly 70 million years ago, just before the end of the Cretaceous. Once thought to be paired with the nearby Ust-Kara structure as a single 120-km crater, they are now considered a single eroded structure. The site is one of the northernmost confirmed impact craters on Earth, lying above the Arctic Circle in treeless tundra accessible only by helicopter.',
    lat: 69.1,
    lng: 64.15,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -70300000,
    address: 'Yugorsky Peninsula, Nenets Autonomous Okrug, Russia',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 3. Puchezh-Katunki — Russia, 80 km, 196 Ma ──
  {
    id: 'puchezh-katunki-crater',
    name: 'A Jurassic Asteroid Carves an 80-Kilometer Crater into What Is Now Central Russia',
    subtitle: 'Nizhny Novgorod Oblast, Russia. Heavily eroded; the structure is visible only in geological surveys',
    description: 'An asteroid struck here roughly 196 million years ago in the Early Jurassic, creating an 80-km impact structure in what is now the Nizhny Novgorod Oblast along the Volga. The crater is so deeply eroded that no surface expression remains — it was identified through deep drilling that revealed a central uplift of rocks raised 2 km from their original depth. The drill core reached impact melt at 5 km, making it one of the most deeply explored impact structures on Earth.',
    lat: 56.95,
    lng: 43.72,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -196000000,
    address: 'Nizhny Novgorod Oblast, Russia',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 4. Araguainha — Brazil, 40 km, 254.7 Ma ──
  {
    id: 'araguainha-crater',
    name: 'South America\'s Largest Impact Crater Forms at the Deadliest Mass Extinction in History',
    subtitle: 'Border of Mato Grosso and Goiás states, Brazil. The dome is visible in satellite imagery; accessible by road',
    description: 'At 40 km across, Araguainha here on the Mato Grosso-Goiás border is the largest confirmed impact crater in South America. It formed roughly 254.7 million years ago — near the end of the Permian, when 90% of all species went extinct. The timing is suggestive but the crater is too small to have caused the Great Dying alone. A prominent granite core rises at the center, visible as a dome in satellite imagery, surrounded by concentric ridges of upturned sedimentary rock.',
    lat: -16.783,
    lng: -52.983,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -254700000,
    address: 'Border of Mato Grosso and Goiás, Brazil',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 5. Acraman — Australia, 90 km, ~580 Ma ──
  {
    id: 'acraman-crater',
    name: 'A Precambrian Asteroid Blasts a 90-Kilometer Crater into South Australia',
    subtitle: 'Lake Acraman, Gawler Ranges, South Australia. Remote salt lake; the circular structure is visible from satellite',
    description: 'Lake Acraman here in the Gawler Ranges occupies the eroded remnant of a ~90-km impact structure formed roughly 580 million years ago in the late Precambrian. The impact ejected debris that has been found as a distinct layer in sedimentary rocks 300 km away in the Flinders Ranges. The timing coincides with the Ediacaran biota explosion, and some researchers have speculated the impact may have influenced early complex life. The dry salt lake and surrounding circular ridges are stark from the air.',
    lat: -32.017,
    lng: 135.45,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -580000000,
    address: 'Lake Acraman, Gawler Ranges, South Australia',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 6. Woodleigh — Australia, ~60 km, ~364 Ma ──
  {
    id: 'woodleigh-crater',
    name: 'Drilling Reveals a Giant Buried Impact Crater Beneath Western Australia\'s Shark Bay Coast',
    subtitle: 'Near Woodleigh Station, Carnarvon Basin, Western Australia. Completely buried; no surface expression',
    description: 'Discovered in 2000 through analysis of drill cores from the Carnarvon Basin, the Woodleigh structure here east of Shark Bay has a debated diameter — estimates range from 40 to 120 km. If the larger figure is correct, it ranks among Earth\'s five biggest craters. The impact occurred roughly 364 million years ago in the Late Devonian, a period of severe marine extinctions. Shocked quartz and impact melt confirm the cosmic origin, but the structure lies entirely hidden beneath younger sediment.',
    lat: -26.05,
    lng: 114.67,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -364000000,
    address: 'Near Woodleigh Station, Carnarvon Basin, Western Australia',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 7. Charlevoix — Canada, 54 km, 450 Ma ──
  {
    id: 'charlevoix-crater',
    name: 'An Ordovician Asteroid Carves a 54-Kilometer Crater That Becomes Quebec\'s Most Scenic Region',
    subtitle: 'Charlevoix, Quebec, Canada. The crater basin forms the region\'s distinctive ring of hills; Mont des Éboulements is part of the rim',
    description: 'The Charlevoix impact structure here along the St. Lawrence River formed roughly 450 million years ago, carving a 54-km crater into the Canadian Shield. The semi-circular ring of hills that defines the Charlevoix landscape — now a UNESCO Biosphere Reserve — traces the original crater rim. Mont des Éboulements, a prominent peak, sits on the rim\'s edge. The 1663 Charlevoix earthquake, one of eastern Canada\'s strongest, occurred along faults reactivated by the ancient impact.',
    lat: 47.53,
    lng: -70.3,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -450000000,
    address: 'Charlevoix, Quebec, Canada',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 8. Mjolnir — Barents Sea, 40 km, 142 Ma ──
  {
    id: 'mjolnir-crater',
    name: 'A Cretaceous Asteroid Strikes the Barents Sea Floor and Creates a 40-Kilometer Submarine Crater',
    subtitle: 'Barents Sea, off the coast of Norway. Submarine crater; mapped by seismic surveys; not visible from the surface',
    description: 'Named after Thor\'s hammer, Mjolnir is a 40-km submarine impact crater on the floor of the Barents Sea, roughly 142 million years old. Discovered through seismic surveys in 1993, it lies beneath 350 m of water and additional sediment. The impact into shallow Cretaceous seas generated a massive tsunami and ejected superheated material across the Arctic. Drill cores reveal shocked quartz and iridium anomalies. It is one of the best-documented submarine impact structures on Earth.',
    lat: 73.8,
    lng: 29.67,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -142000000,
    address: 'Barents Sea, Arctic Norway',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 9. Rochechouart — France, 23 km, 207 Ma ──
  {
    id: 'rochechouart-crater',
    name: 'A Triassic Asteroid Strikes Western France, and Locals Build a Town from the Impact Rock',
    subtitle: 'Rochechouart, Haute-Vienne, France. The town\'s medieval buildings are constructed from suevite impact breccia; museum on-site',
    description: 'Rochechouart here near Limoges was the first impact structure confirmed by extraterrestrial contamination rather than a visible crater or meteorite fragments. The 23-km structure formed roughly 207 million years ago at the end of the Triassic. The crater has been eroded flat, but its legacy is visible in every building in town — the medieval houses and castle are built from suevite, a bubbly impact breccia the locals quarried for centuries without knowing its cosmic origin.',
    lat: 45.833,
    lng: 0.933,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -207000000,
    address: 'Rochechouart, Haute-Vienne, France',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 10. Steinheim — Germany, 3.8 km, 14.8 Ma ──
  {
    id: 'steinheim-basin',
    name: 'A Second Asteroid Strikes Bavaria Just Miles from the Ries Crater',
    subtitle: 'Steinheim am Albuch, Baden-Württemberg, Germany. The basin is a nature reserve; Meteor Museum in town',
    description: 'The Steinheim Basin here in the Swabian Alb is a 3.8-km impact crater that formed roughly 14.8 million years ago, likely from a companion body of the asteroid that created the nearby 26-km Nördlinger Ries. The two craters are only 42 km apart. A distinctive central hill rises 50 m from the crater floor — the rebound peak of the ancient impact. The basin later filled with a lake whose fossil-rich sediments have yielded one of Europe\'s best Miocene snail and mammal assemblages.',
    lat: 48.685,
    lng: 10.065,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'exact',
    kind: 'event',
    year: -14800000,
    address: 'Steinheim am Albuch, Baden-Württemberg, Germany',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 11. Bosumtwi — Ghana, 10.5 km, 1.07 Ma ──
  {
    id: 'bosumtwi-crater',
    name: 'A Meteorite Creates a Sacred Crater Lake in the Ashanti Forest of Ghana',
    subtitle: 'Lake Bosumtwi, Ashanti Region, Ghana. Sacred to the Ashanti people; villages ring the shore; no motorized boats allowed',
    description: 'Lake Bosumtwi here in Ghana\'s Ashanti Region fills a 10.5-km impact crater formed 1.07 million years ago — the best-preserved young complex crater on Earth. The Ashanti consider the lake sacred: the dead are said to bid farewell to the god Twi from its shores, and tradition forbids metal boats. The impact scattered tektites (glass droplets) across the Ivory Coast strewn field, thousands of kilometres away. International drilling in 2004 recovered 1,800 m of core preserving a million-year climate record.',
    lat: 6.5,
    lng: -1.417,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'exact',
    kind: 'event',
    year: -1070000,
    address: 'Lake Bosumtwi, Ashanti Region, Ghana',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 12. Clearwater Lakes (East and West) — Canada ──
  {
    id: 'clearwater-lakes-craters',
    name: 'Twin Asteroids Punch Two Circular Lakes into the Canadian Shield',
    subtitle: 'Clearwater Lakes, Quebec, Canada. Visible from satellite as twin rings; accessible by floatplane from the Cree community of Wemindji',
    description: 'The twin Clearwater Lakes here in northern Quebec are among the most visually striking impact structures on Earth — two near-perfect circles in the boreal shield, 36 km and 26 km across. Clearwater West, the larger lake, has a ring of islands marking its central uplift. Long assumed to be a simultaneous double impact ~290 million years ago, recent dating suggests they formed 4 million years apart. The Cree people have fished and traveled these lakes for millennia.',
    lat: 56.05,
    lng: -74.3,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -290000000,
    address: 'Clearwater Lakes, Eeyou Istchee, Quebec, Canada',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 13. Haughton — Canada, 23 km, 39 Ma ──
  {
    id: 'haughton-crater',
    name: 'NASA Uses an Arctic Impact Crater as a Training Ground for Mars Missions',
    subtitle: 'Devon Island, Nunavut, Canada. The Haughton-Mars Project operates a research station inside the crater each summer',
    description: 'Haughton crater here on Devon Island — the largest uninhabited island on Earth — is a 23-km impact structure formed 39 million years ago in Eocene carbonate rocks. Its barren, frost-shattered terrain so closely resembles Mars that NASA and the Canadian Space Agency have operated the Haughton-Mars Project here since 1997, testing rovers, spacesuits, and drilling equipment. The polar desert conditions, impact-shattered rock, and total isolation make it the closest analogue to the Martian surface on Earth.',
    lat: 75.383,
    lng: -89.667,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -39000000,
    address: 'Devon Island, Nunavut, Canada',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 14. Manson — Iowa, USA, 35 km, 74 Ma ──
  {
    id: 'manson-crater',
    name: 'Iowa\'s Largest Impact Crater Lies Completely Buried Beneath Farmland',
    subtitle: 'Near Manson, Calhoun County, Iowa, USA. Completely buried under glacial drift; no surface expression',
    description: 'The Manson impact structure here in northwest Iowa is 35 km across and roughly 74 million years old — once a leading candidate for the dinosaur-killing impact before Chicxulub was confirmed. It lies completely hidden beneath 30 m of glacial till deposited by Ice Age glaciers. The only surface clue is slightly different well-water chemistry in the area. Deep drilling in 1991-92 reached the central uplift, confirming shocked quartz and impact melt at depth beneath ordinary Iowa cornfields.',
    lat: 42.533,
    lng: -94.55,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -74000000,
    address: 'Near Manson, Calhoun County, Iowa, USA',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 15. Mistastin — Canada, 28 km, 36.6 Ma ──
  {
    id: 'mistastin-crater',
    name: 'An Eocene Asteroid Generates the Hottest Temperatures Ever Recorded on Earth\'s Surface',
    subtitle: 'Mistastin Lake, Labrador, Newfoundland and Labrador, Canada. Remote; accessible by floatplane; horseshoe-shaped lake',
    description: 'The 28-km Mistastin crater here in Labrador formed 36.6 million years ago when an asteroid struck Precambrian crystalline rock. In 2017, researchers analyzing zircons from the impact melt discovered they had been heated above 2,370°C — the highest crustal temperature ever recorded from an impact on Earth. The horseshoe-shaped Mistastin Lake now fills the crater. Discovery Hill, an island of uplifted rock in the lake, marks the central peak. NASA has used the site to train astronauts in impact geology.',
    lat: 55.883,
    lng: -63.3,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -36600000,
    address: 'Mistastin Lake, Labrador, Newfoundland and Labrador, Canada',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 16. Elgygytgyn — Russia, 18 km, 3.6 Ma ──
  {
    id: 'elgygytgyn-crater',
    name: 'A Pliocene Asteroid Creates a Crater Lake That Preserves 3.6 Million Years of Arctic Climate',
    subtitle: 'Lake Elgygytgyn, Chukotka, Russia. Remote; accessible by helicopter; never covered by glaciers',
    description: 'Lake Elgygytgyn here in Chukotka fills an 18-km impact crater formed 3.6 million years ago in volcanic rock. What makes it unique: the crater was never overridden by glaciers, so its lake sediments preserve an unbroken 3.6-million-year climate record — the longest continuous Arctic paleoclimate archive on land. International drilling in 2009 recovered 318 m of core. The name comes from the Chukchi language meaning "white lake." Temperatures here reach -40°C in winter.',
    lat: 67.5,
    lng: 172.083,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'exact',
    kind: 'event',
    year: -3600000,
    address: 'Lake Elgygytgyn, Chukotka Autonomous Okrug, Russia',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 17. Boltysh — Ukraine, 24 km, 65.39 Ma ──
  {
    id: 'boltysh-crater',
    name: 'A Second Asteroid Strikes Earth Within Thousands of Years of the Dinosaur-Killing Impact',
    subtitle: 'Near Bovtyshka, Kirovohrad Oblast, Ukraine. Buried crater; no surface expression; discovered through drilling',
    description: 'The 24-km Boltysh crater here in central Ukraine formed 65.39 million years ago — within a few thousand years of the Chicxulub impact that ended the Cretaceous. Drill cores reveal that the crater lake sediments record the immediate aftermath of both impacts: first the Boltysh event itself, then a charcoal-rich layer from the Chicxulub-triggered global firestorm. Whether the two impacts are related or coincidental remains debated. The site provides a rare ground-level record of the K-Pg extinction.',
    lat: 48.9,
    lng: 32.25,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -65390000,
    address: 'Near Bovtyshka, Kirovohrad Oblast, Ukraine',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 18. Yarrabubba — Australia, 70 km, 2,229 Ma ──
  {
    id: 'yarrabubba-crater',
    name: 'Earth\'s Oldest Confirmed Impact Crater Forms During a Global Ice Age 2.2 Billion Years Ago',
    subtitle: 'Near Meekatharra, Western Australia. Heavily eroded; visible only in geological surveys; remote outback station country',
    description: 'Yarrabubba here in the outback of Western Australia is the oldest confirmed impact structure on Earth at 2.229 billion years. Dated precisely in 2020 using uranium-lead isotopes in shocked zircon and monazite, the crater originally spanned roughly 70 km. It formed during the Huronian glaciation, when Earth may have been a "Snowball." Researchers speculate the impact into glacial ice could have injected enough water vapour into the atmosphere to help end the ice age. Almost nothing remains at the surface.',
    lat: -27.167,
    lng: 118.833,
    type: 'discovery_site',
    importance: 'major',
    accuracy: 'approximate',
    kind: 'event',
    year: -2229000000,
    address: 'Near Meekatharra, Western Australia',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 19. Wetumpka — Alabama, USA, 7.6 km, 83 Ma ──
  {
    id: 'wetumpka-crater',
    name: 'An Asteroid Splashes into a Shallow Cretaceous Sea and Creates Alabama\'s Only Impact Crater',
    subtitle: 'Near Wetumpka, Elmore County, Alabama, USA. The half-rim is visible as a crescent ridge east of town',
    description: 'The 7.6-km Wetumpka crater here in central Alabama formed roughly 83 million years ago when an asteroid struck a shallow sea covering what is now the coastal plain. The western half of the rim was destroyed by the marine impact — the ocean rushed back in and washed it away. The eastern half survives as a prominent crescent-shaped ridge east of town, visible from the road. Drilling in 1998 confirmed shocked quartz beneath the ridge. It is the best-exposed marine-target impact crater in the eastern U.S.',
    lat: 32.523,
    lng: -86.167,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -83000000,
    address: 'Near Wetumpka, Elmore County, Alabama, USA',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 20. Upheaval Dome — Utah, USA, 10 km, ~170 Ma ──
  {
    id: 'upheaval-dome-crater',
    name: 'A Mysterious Dome in Canyonlands Is Confirmed as a 170-Million-Year-Old Impact Crater',
    subtitle: 'Canyonlands National Park, Utah, USA. Accessible by trail from the Upheaval Dome parking area; overlook viewpoints at the rim',
    description: 'Upheaval Dome here in Canyonlands National Park puzzled geologists for decades — its concentric rings of tilted sandstone were variously attributed to salt domes, volcanic intrusion, or meteorite impact. The debate was settled in 2008 when shocked quartz was found in the central uplift. The ~10-km structure formed roughly 170 million years ago in the Jurassic. From the rim overlook, visitors peer into a bowl of white Navajo Sandstone surrounded by red Wingate cliffs — a rare impact crater you can hike to.',
    lat: 38.437,
    lng: -109.929,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'exact',
    kind: 'event',
    year: -170000000,
    address: 'Canyonlands National Park, Utah, USA',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 21. Roter Kamm — Namibia, 2.5 km, 3.7 Ma ──
  {
    id: 'roter-kamm-crater',
    name: 'A Near-Perfect Impact Crater Sits Half-Buried in the Namib Desert Dunes',
    subtitle: 'Sperrgebiet, southern Namibia. In the restricted diamond area; visible from the air but ground access requires permits',
    description: 'Roter Kamm ("Red Ridge") here in the Sperrgebiet of southern Namibia is a 2.5-km crater formed 3.7 million years ago. Half-filled with orange Namib Desert sand, the bowl is strikingly photogenic from the air — a sharp crescent rim rising 130 m above the surrounding gravel plain, with dunes spilling over the southern lip. The crater sits inside Namibia\'s restricted diamond mining zone, so few people have ever visited on foot. Impact melt and shocked quartz confirm its cosmic origin.',
    lat: -27.767,
    lng: 16.3,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'exact',
    kind: 'event',
    year: -3700000,
    address: 'Sperrgebiet, Karas Region, Namibia',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 22. Zhamanshin — Kazakhstan, 14 km, 0.9 Ma ──
  {
    id: 'zhamanshin-crater',
    name: 'Central Asia\'s Largest Impact Crater Produces Glass So Exotic It Was Mistaken for Meteorites',
    subtitle: 'Irgiz District, Aktobe Region, Kazakhstan. Remote steppe; the rim is partially visible; irghizites found on-site',
    description: 'The 14-km Zhamanshin crater here in the Kazakh steppe formed roughly 900,000 years ago — making it one of the youngest large impact structures on Earth. The impact produced irghizites, strange glassy objects with aerodynamic shapes so unusual they were initially classified as a new type of meteorite. The crater\'s youth means its rim and ejecta blanket are still partially preserved on the flat steppe, giving geologists a rare chance to study a large impact before erosion erases the evidence.',
    lat: 48.4,
    lng: 60.967,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -900000,
    address: 'Irgiz District, Aktobe Region, Kazakhstan',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 23. Henbury — Australia, 0.157 km (cluster), ~4,200 years ──
  {
    id: 'henbury-craters',
    name: 'A Meteorite Shatters into Fragments and Blasts a Cluster of 13 Craters into the Central Australian Desert',
    subtitle: 'Henbury Meteorites Conservation Reserve, Northern Territory, Australia. 145 km south of Alice Springs; open to visitors',
    description: 'The Henbury crater field here south of Alice Springs consists of 13 impact craters, the largest 180 m wide and 15 m deep, formed roughly 4,200 years ago when an iron meteorite broke apart during entry. The Aboriginal Luritja people call the site "sun walk fire devil rock" and avoided it, believing anyone who collected the iron stones would be struck by a fiery devil. Meteorite fragments were first collected by Europeans in 1899. The craters are well-preserved in the arid desert climate.',
    lat: -24.573,
    lng: 133.133,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'exact',
    kind: 'event',
    year: -2200,
    address: 'Henbury Meteorites Conservation Reserve, Northern Territory, Australia',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 24. Steen River — Canada, 25 km, 91 Ma ──
  {
    id: 'steen-river-crater',
    name: 'An Asteroid Strikes Northern Alberta and the Crater Becomes an Oil and Gas Field',
    subtitle: 'Near Steen River, Alberta, Canada. Buried under forest; no surface expression; oil wells mark the structure',
    description: 'The 25-km Steen River crater here in northern Alberta formed roughly 91 million years ago in the Late Cretaceous. Completely buried beneath younger sediments and boreal forest, it was discovered through geophysical surveys in the 1960s. The fractured and porous rock created by the impact has trapped significant oil and gas deposits, making it one of several impact craters worldwide that double as petroleum reservoirs. The structure is detectable only through drilling and seismic data.',
    lat: 59.517,
    lng: -117.633,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -91000000,
    address: 'Near Steen River, Alberta, Canada',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 25. Montagnais — Canada, 45 km, 50.5 Ma ──
  {
    id: 'montagnais-crater',
    name: 'An Eocene Asteroid Punches a 45-Kilometer Crater into the Atlantic Seafloor off Nova Scotia',
    subtitle: 'Continental shelf, 200 km SE of Nova Scotia, Canada. Submarine crater; mapped by seismic surveys',
    description: 'The 45-km Montagnais structure lies on the continental shelf 200 km southeast of Nova Scotia, buried under 120 m of water and additional post-impact sediment. Formed roughly 50.5 million years ago in the Eocene, it was discovered through oil exploration seismic surveys in the 1980s and confirmed by drilling that found impact melt and shocked quartz. It remains one of few confirmed submarine impact craters that have been drilled and is a key site for studying marine-target impacts.',
    lat: 42.883,
    lng: -64.217,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -50500000,
    address: 'Continental shelf, SE of Nova Scotia, Canada',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 26. Lappajärvi — Finland, 23 km, 77.85 Ma ──
  {
    id: 'lappajarvi-crater',
    name: 'A Meteorite Creates Finland\'s Deepest Lake Inside a 23-Kilometer Impact Crater',
    subtitle: 'Lake Lappajärvi, South Ostrobothnia, Finland. The lake is a popular summer destination; kärnäite impact melt found on islands',
    description: 'Lake Lappajärvi here in western Finland fills a 23-km crater formed 77.85 million years ago in the Late Cretaceous. The impact melted local rock into kärnäite, a distinctive green glass found on islands in the lake and used by locals as a decorative stone. A central island, Kärnänsaari, marks the crater\'s central uplift. At 36 m, it is Finland\'s deepest lake relative to its size. The crater was confirmed in the 1970s through the discovery of shatter cones and shocked minerals.',
    lat: 63.15,
    lng: 23.667,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'exact',
    kind: 'event',
    year: -77850000,
    address: 'Lake Lappajärvi, South Ostrobothnia, Finland',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 27. Aorounga — Chad, 12.6 km, <345 Ma ──
  {
    id: 'aorounga-crater',
    name: 'Satellite Radar Reveals a Triple Impact Crater Chain in the Sahara Desert',
    subtitle: 'Aorounga, Borkou Region, Chad. Remote Sahara; visible from satellite; extremely difficult ground access',
    description: 'The 12.6-km Aorounga crater here in northern Chad was first identified from Landsat satellite imagery in the 1960s. Radar imaging from the Space Shuttle in 1994 revealed two additional buried ring structures aligned with the main crater, suggesting a chain of three impacts from a fragmented asteroid. The main crater\'s concentric rings are clearly visible from orbit, standing out against the flat Sahara. The age is poorly constrained at less than 345 million years. Ground access remains nearly impossible.',
    lat: 19.1,
    lng: 19.25,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -345000000,
    address: 'Aorounga, Borkou Region, Chad',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 28. Luizi — DRC, 17 km, <573 Ma ──
  {
    id: 'luizi-crater',
    name: 'A Geologist Confirms the Democratic Republic of Congo\'s Only Impact Crater After Decades of Suspicion',
    subtitle: 'Near Luizi, Haut-Katanga Province, Democratic Republic of Congo. Remote; circular depression visible from satellite',
    description: 'The 17-km Luizi structure here in Katanga province was first described as a possible crater in 1919 but not confirmed until 2011, when geologist Ludovic Ferrière found shatter cones and shocked quartz on an expedition to the remote site. It has a classic complex structure with an inner ring 5.2 km across and a central peak 2 km wide. Confirming the crater took nearly a century because the DRC\'s instability made fieldwork dangerous. It remains the only confirmed impact structure in Central Africa.',
    lat: -10.167,
    lng: 28.0,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -573000000,
    address: 'Near Luizi, Haut-Katanga Province, DRC',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 29. Shoemaker (Teague Ring) — Australia, 30 km, 1,630 Ma ──
  {
    id: 'shoemaker-crater',
    name: 'Australia\'s Oldest Exposed Impact Crater Is Renamed for the Father of Impact Science',
    subtitle: 'Lake Teague, Western Australia. Remote outback; the ring structure surrounds a salt lake; accessible by 4WD',
    description: 'Originally called Teague Ring, this 30-km crater here in the Western Australian outback was renamed in 1998 to honor Eugene Shoemaker, the geologist who pioneered impact crater science and co-discovered Comet Shoemaker-Levy 9. At 1.63 billion years old, it is the oldest exposed impact structure in Australia. A ring of hills surrounds a salt lake that fills the eroded crater floor. After Shoemaker died in a car accident in 1997 while studying craters in Australia, some of his ashes were sent to the Moon.',
    lat: -25.867,
    lng: 120.883,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'approximate',
    kind: 'event',
    year: -1630000000,
    address: 'Lake Teague, Western Australia',
    entityIds: [],
    verificationLevel: 'verified',
  },

  // ── 30. Carancas — Peru, 0.0136 km, 2007 ──
  {
    id: 'carancas-crater',
    name: 'A Small Meteorite Defies Physics and Blasts a 14-Meter Crater Near Lake Titicaca',
    subtitle: 'Near Carancas, Puno Region, Peru. The water-filled crater is open to visitors; near the Desaguadero highway',
    description: 'On 15 September 2007, a stony meteorite roughly 1 m across slammed into the ground here near Carancas at over 3,700 m elevation on the Altiplano, creating a 14-m crater that filled with groundwater. Scientists were stunned — objects this small were thought to slow to terminal velocity and never form craters. The high altitude and low air density may explain the anomaly. Locals reported a sulphurous smell and some fell ill from arsenic-contaminated groundwater stirred up by the impact.',
    lat: -16.665,
    lng: -69.044,
    type: 'discovery_site',
    importance: 'minor',
    accuracy: 'exact',
    kind: 'event',
    year: 2007,
    date: '15 September 2007',
    address: 'Near Carancas, Puno Region, Peru',
    entityIds: [],
    verificationLevel: 'verified',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// UPDATED COLLECTION
// ═══════════════════════════════════════════════════════════════════════════

export const meteoriteCraterCollection: StoryCollection = {
  id: 'meteorite-impact-craters',
  name: 'Every Confirmed Meteorite Impact Crater on Earth',
  subtitle: 'All ~190 confirmed impact structures from the Earth Impact Database — from the 300-km Vredefort dome to the 14-m Carancas hole',
  description: 'From the 2.2-billion-year-old Yarrabubba in Western Australia to the 2007 Carancas crater in Peru — every confirmed place where an object from space struck the Earth and left a mark.',
  momentIds: [
    // ── EXISTING moments (20) ──
    'chicxulub-crater',
    'tunguska-event',
    'chelyabinsk-meteor',
    'vredefort-crater',
    'sudbury-basin',
    'manicouagan-crater',
    'popigai-crater',
    'chesapeake-bay-crater',
    'barringer-meteor-crater',
    'nordlinger-ries',
    'wolfe-creek-crater',
    'gosses-bluff',
    'lonar-lake',
    'kaali-crater',
    'pingualuit-crater',
    'hoba-meteorite',
    'campo-del-cielo',
    'sikhote-alin',
    'siljan-ring',
    'tswaing-crater',
    // ── BATCH 1: NEW moments (30) ──
    'morokweng-crater',
    'kara-crater',
    'puchezh-katunki-crater',
    'araguainha-crater',
    'acraman-crater',
    'woodleigh-crater',
    'charlevoix-crater',
    'mjolnir-crater',
    'rochechouart-crater',
    'steinheim-basin',
    'bosumtwi-crater',
    'clearwater-lakes-craters',
    'haughton-crater',
    'manson-crater',
    'mistastin-crater',
    'elgygytgyn-crater',
    'boltysh-crater',
    'yarrabubba-crater',
    'wetumpka-crater',
    'upheaval-dome-crater',
    'roter-kamm-crater',
    'zhamanshin-crater',
    'henbury-craters',
    'steen-river-crater',
    'montagnais-crater',
    'lappajarvi-crater',
    'aorounga-crater',
    'luizi-crater',
    'shoemaker-crater',
    'carancas-crater',
  ],
  tags: ['meteorite', 'impact-crater', 'geology', 'space', 'asteroid'],
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE TRACKING LIST — ALL ~190 CONFIRMED IMPACT STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════
//
// Source: Earth Impact Database (PASSC, University of New Brunswick) as of 2025,
// cross-referenced with Impact Earth (University of Western Ontario) and
// Wikipedia "List of impact structures on Earth."
//
// Status key:
//   [DONE]   = moment exists in moments.ts
//   [BATCH1] = new moment in this draft file
//   [TODO]   = needs moment created in a follow-up batch
//
// ═══════════════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────────────────
// AFRICA (20 confirmed)
// ──────────────────────────────────────────────────────────────────────────
// 1.  Agoudal           — Morocco, 10.5 km, <3 Ma                [TODO]
// 2.  Amguid            — Algeria, 0.45 km, <0.1 Ma              [TODO]
// 3.  Aorounga          — Chad, 12.6 km, <345 Ma                 [BATCH1]
// 4.  Aouelloul         — Mauritania, 0.39 km, 3.1 Ma            [TODO]
// 5.  B.P. Structure    — Libya, 2.8 km, <120 Ma                 [TODO]
// 6.  Bosumtwi          — Ghana, 10.5 km, 1.07 Ma                [BATCH1]
// 7.  Gweni-Fada        — Chad, 14 km, <345 Ma                   [TODO]
// 8.  Highbury          — Zimbabwe, 20 km, <500 Ma (disputed)    [TODO]
// 9.  Kalkkop           — South Africa, 0.64 km, 0.25 Ma         [TODO]
// 10. Kamil             — Egypt, 0.045 km, <5000 years            [TODO]
// 11. Kgagodi           — Botswana, 3.5 km, <180 Ma              [TODO]
// 12. Luizi             — DRC, 17 km, <573 Ma                    [BATCH1]
// 13. Morokweng         — South Africa, 70 km, 145 Ma            [BATCH1]
// 14. Oasis             — Libya, 18 km, <120 Ma                  [TODO]
// 15. Ouarkziz          — Algeria, 3.5 km, <70 Ma                [TODO]
// 16. Roter Kamm        — Namibia, 2.5 km, 3.7 Ma                [BATCH1]
// 17. Talemzane         — Algeria, 1.75 km, <3 Ma                [TODO]
// 18. Tenoumer          — Mauritania, 1.9 km, 0.021 Ma           [TODO]
// 19. Tin Bider         — Algeria, 6 km, <70 Ma                  [TODO]
// 20. Tswaing           — South Africa, 1.13 km, 0.22 Ma         [DONE]
// 21. Vredefort         — South Africa, 300 km, 2023 Ma          [DONE]

// ──────────────────────────────────────────────────────────────────────────
// ASIA & RUSSIA (31 confirmed)
// ──────────────────────────────────────────────────────────────────────────
// 22. Beyenchime-Salaatin — Russia, 8 km, 40 Ma                  [TODO]
// 23. Bigach            — Kazakhstan, 8 km, 5 Ma                  [TODO]
// 24. Boltysh           — Ukraine, 24 km, 65.39 Ma                [BATCH1]
// 25. Chiyli            — Kazakhstan, 5.5 km, 46 Ma               [TODO]
// 26. Elgygytgyn        — Russia, 18 km, 3.6 Ma                  [BATCH1]
// 27. Ilyinets          — Ukraine, 8.5 km, 378 Ma                [TODO]
// 28. Janisjarvi        — Russia, 14 km, 700 Ma                  [TODO]
// 29. Kaluga            — Russia, 15 km, 380 Ma                  [TODO]
// 30. Kamensk           — Russia, 25 km, 49 Ma                   [TODO]
// 31. Kara              — Russia, 65 km, 70.3 Ma                 [BATCH1]
// 32. Karla             — Russia, 10 km, 5 Ma                    [TODO]
// 33. Kursk             — Russia, 6 km, 250 Ma                   [TODO]
// 34. Logancha          — Russia, 20 km, 40 Ma                   [TODO]
// 35. Lonar             — India, 1.83 km, 0.052 Ma               [DONE]
// 36. Macha             — Russia, 0.3 km, <7000 years             [TODO]
// 37. Mishina Gora      — Russia, 2.5 km, 300 Ma                 [TODO]
// 38. Obolon            — Ukraine, 20 km, 169 Ma                 [TODO]
// 39. Popigai           — Russia, 100 km, 35.7 Ma                [DONE]
// 40. Puchezh-Katunki   — Russia, 80 km, 196 Ma                  [BATCH1]
// 41. Ragozinka         — Russia, 9 km, 46 Ma                    [TODO]
// 42. Rotmistrovka      — Ukraine, 2.7 km, 140 Ma                [TODO]
// 43. Shunak            — Kazakhstan, 2.8 km, 45 Ma              [TODO]
// 44. Sikhote-Alin      — Russia, 0.027 km, 1947                 [DONE]
// 45. Sobolev           — Russia, 0.053 km, <1000 years           [TODO]
// 46. Tabun-Khara-Obo   — Mongolia, 1.3 km, 150 Ma               [TODO]
// 47. Ternovka (Trnava) — Ukraine, 12 km, 280 Ma                 [TODO]
// 48. Zhamanshin        — Kazakhstan, 14 km, 0.9 Ma              [BATCH1]
// 49. Zeleny Gai        — Ukraine, 2.5 km, 80 Ma                 [TODO]
// 50. Beyenchime-Salaatin — Russia, 8 km, 40 Ma                  [TODO]
// 51. Chukcha           — Russia, 6 km, <70 Ma                   [TODO]
// 52. Wabar             — Saudi Arabia, 0.116 km, ~1863           [TODO]

// ──────────────────────────────────────────────────────────────────────────
// AUSTRALIA (27 confirmed)
// ──────────────────────────────────────────────────────────────────────────
// 53. Acraman           — South Australia, 90 km, 580 Ma          [BATCH1]
// 54. Amelia Creek      — Northern Territory, 20 km, 1660 Ma      [TODO]
// 55. Boxhole           — Northern Territory, 0.17 km, 30,000 yr  [TODO]
// 56. Connolly Basin    — Western Australia, 9 km, <60 Ma         [TODO]
// 57. Crawford          — South Australia, 8.5 km, >35 Ma         [TODO]
// 58. Dalgaranga        — Western Australia, 0.024 km, ~3000 yr   [TODO]
// 59. Darwin            — Tasmania, 1.2 km, 0.816 Ma              [TODO]
// 60. Foelsche          — Northern Territory, 6 km, >545 Ma       [TODO]
// 61. Glikson           — Western Australia, 19 km, >508 Ma       [TODO]
// 62. Goat Paddock      — Western Australia, 5.1 km, <50 Ma       [TODO]
// 63. Gosses Bluff      — Northern Territory, 22 km, 142 Ma       [DONE]
// 64. Goyder            — Northern Territory, 3 km, >1400 Ma      [TODO]
// 65. Henbury           — Northern Territory, cluster, ~4200 yr    [BATCH1]
// 66. Kelly West        — Northern Territory, 10 km, >550 Ma      [TODO]
// 67. Lawn Hill         — Queensland, 18 km, >515 Ma              [TODO]
// 68. Liverpool         — Northern Territory, 1.6 km, 150 Ma      [TODO]
// 69. Matt Wilson       — Northern Territory, 6.3 km, >1400 Ma    [TODO]
// 70. Mount Toondina    — South Australia, 4 km, <110 Ma          [TODO]
// 71. Piccaninny        — Western Australia, 7 km, <360 Ma        [TODO]
// 72. Shoemaker         — Western Australia, 30 km, 1630 Ma       [BATCH1]
// 73. Spider            — Western Australia, 13 km, 570 Ma        [TODO]
// 74. Strangways        — Northern Territory, 25 km, 646 Ma       [TODO]
// 75. Tookoonooka       — Queensland, 55 km, 128 Ma               [TODO]
// 76. Veevers           — Western Australia, 0.07 km, <1 Ma       [TODO]
// 77. Wolfe Creek       — Western Australia, 0.875 km, 120 ka     [DONE]
// 78. Woodleigh         — Western Australia, ~60 km, 364 Ma       [BATCH1]
// 79. Yallalie          — Western Australia, 12 km, <30 Ma        [TODO]
// 80. Yarrabubba        — Western Australia, 70 km, 2229 Ma       [BATCH1]

// ──────────────────────────────────────────────────────────────────────────
// EUROPE (41 confirmed)
// ──────────────────────────────────────────────────────────────────────────
// 81. Azuara            — Spain, 30 km, ~35 Ma (disputed)         [TODO]
// 82. Boltysh           — Ukraine, 24 km, 65.39 Ma                [BATCH1] (listed above w/ Asia)
// 83. Dellen            — Sweden, 19 km, 89 Ma                    [TODO]
// 84. Dobele            — Latvia, 4.5 km, 290 Ma                  [TODO]
// 85. Gardnos           — Norway, 5 km, 500 Ma                    [TODO]
// 86. Granby            — Sweden, 3 km, ~470 Ma                   [TODO]
// 87. Ilumetsa          — Estonia, 0.08 km, ~6600 yr              [TODO]
// 88. Iso-Naakkima      — Finland, 3 km, >1000 Ma                 [TODO]
// 89. Kaali             — Estonia, 0.11 km, ~1530 BCE             [DONE]
// 90. Kaluga            — Russia, 15 km, 380 Ma                   [TODO] (listed above w/ Asia)
// 91. Kärdla            — Estonia, 4 km, 455 Ma                   [TODO]
// 92. Karikkoselkä      — Finland, 1.5 km, 230 Ma                 [TODO]
// 93. Lappajärvi        — Finland, 23 km, 77.85 Ma                [BATCH1]
// 94. Lockne            — Sweden, 7.5 km, 455 Ma                  [TODO]
// 95. Logoisk           — Belarus, 15 km, 42 Ma                   [TODO]
// 96. Lumparn           — Finland (Åland), 9 km, ~1000 Ma         [TODO]
// 97. Mien              — Sweden, 9 km, 121 Ma                    [TODO]
// 98. Mjølnir           — Barents Sea (Norway), 40 km, 142 Ma     [BATCH1]
// 99. Mizarai           — Lithuania, 5 km, 500 Ma                 [TODO]
// 100. Morasko          — Poland, 0.1 km, ~5000 yr                [TODO]
// 101. Neugrund         — Estonia, 8 km, ~535 Ma                  [TODO]
// 102. Nördlinger Ries  — Germany, 24 km, 14.81 Ma                [DONE]
// 103. Obolon           — Ukraine, 20 km, 169 Ma                  [TODO] (listed above w/ Asia)
// 104. Rochechouart     — France, 23 km, 207 Ma                   [BATCH1]
// 105. Rotmistrovka     — Ukraine, 2.7 km, 140 Ma                 [TODO] (listed above w/ Asia)
// 106. Sääksjärvi       — Finland, 6 km, ~560 Ma                  [TODO]
// 107. Siljan           — Sweden, 52 km, 377 Ma                   [DONE]
// 108. Söderfjärden     — Finland, 6.6 km, ~600 Ma                [TODO]
// 109. Steinheim        — Germany, 3.8 km, 14.8 Ma                [BATCH1]
// 110. Suavjärvi        — Russia, 16 km, ~2400 Ma                 [TODO]
// 111. Suvasvesi North  — Finland, 4 km, <1000 Ma                 [TODO]
// 112. Tvären           — Sweden, 2 km, 455 Ma                    [TODO]
// 113. Vepriai          — Lithuania, 8 km, 160 Ma                  [TODO]
// 114. Zapadnaya        — Ukraine, 3.2 km, 165 Ma                 [TODO]

// ──────────────────────────────────────────────────────────────────────────
// NORTH AMERICA (60 confirmed)
// ──────────────────────────────────────────────────────────────────────────
//
// — CANADA (31) —
// 115. Brent            — Ontario, 3.8 km, 396 Ma                 [TODO]
// 116. Carswell         — Saskatchewan, 39 km, 115 Ma             [TODO]
// 117. Charlevoix       — Quebec, 54 km, 450 Ma                   [BATCH1]
// 118. Clearwater East  — Quebec, 26 km, 290 Ma                   [BATCH1] (combined)
// 119. Clearwater West  — Quebec, 36 km, 286 Ma                   [BATCH1] (combined)
// 120. Cloud Creek      — Wyoming, 7 km, 190 Ma                   [TODO]
// 121. Couture          — Quebec, 8 km, 430 Ma                    [TODO]
// 122. Deep Bay         — Saskatchewan, 13 km, 99 Ma              [TODO]
// 123. Eagle Butte      — Alberta, 10 km, <65 Ma                  [TODO]
// 124. Elbow            — Saskatchewan, 8 km, 395 Ma              [TODO]
// 125. Gow              — Saskatchewan, 5 km, <250 Ma             [TODO]
// 126. Haughton         — Nunavut, 23 km, 39 Ma                   [BATCH1]
// 127. Holleford        — Ontario, 2.35 km, 550 Ma                [TODO]
// 128. Île Rouleau      — Quebec, 4 km, <300 Ma                   [TODO]
// 129. La Moinerie      — Quebec, 8 km, 400 Ma                    [TODO]
// 130. Lac Couture      — Quebec, 8 km, 430 Ma                    [TODO]
// 131. Lac Wiyashakimi  — Quebec, 3 km, <300 Ma                   [TODO]
// 132. Lake St. Martin  — Manitoba, 40 km, 228 Ma                 [TODO]
// 133. Manicouagan      — Quebec, 100 km, 214 Ma                  [DONE]
// 134. Manitouwadge     — Ontario, 9 km, <1200 Ma                 [TODO]
// 135. Merewether (Mistissini) — Quebec, 12 km, <300 Ma           [TODO]
// 136. Mistastin        — Labrador, 28 km, 36.6 Ma                [BATCH1]
// 137. Montagnais       — Offshore Nova Scotia, 45 km, 50.5 Ma    [BATCH1]
// 138. Nicholson        — NWT, 12.5 km, 400 Ma                    [TODO]
// 139. Pilot Lake       — NWT, 6 km, 445 Ma                       [TODO]
// 140. Pingualuit       — Quebec, 3.44 km, 1.4 Ma                 [DONE]
// 141. Presqu'île       — Quebec, 24 km, <500 Ma                  [TODO]
// 142. Slate Islands    — Ontario, 30 km, 450 Ma                  [TODO]
// 143. Steen River      — Alberta, 25 km, 91 Ma                   [BATCH1]
// 144. Sudbury          — Ontario, 130 km, 1849 Ma                [DONE]
// 145. Wanapitei        — Ontario, 7.5 km, 37 Ma                  [TODO]
// 146. West Hawk        — Manitoba, 2.44 km, 351 Ma               [TODO]
//
// — USA (28) —
// 147. Ames             — Oklahoma, 16 km, 470 Ma                 [TODO]
// 148. Avak             — Alaska, 12 km, <100 Ma                  [TODO]
// 149. Barringer        — Arizona, 1.186 km, 0.049 Ma             [DONE]
// 150. Beaverhead       — Montana/Idaho, 60 km, 600 Ma            [TODO]
// 151. Calvin            — Michigan, 8.5 km, 450 Ma               [TODO]
// 152. Chesapeake Bay   — Virginia, 85 km, 35.5 Ma                [DONE]
// 153. Crooked Creek    — Missouri, 7 km, 320 Ma                  [TODO]
// 154. Decaturville     — Missouri, 6 km, <300 Ma                 [TODO]
// 155. Des Plaines      — Illinois, 8 km, <280 Ma                 [TODO]
// 156. Flynn Creek      — Tennessee, 3.8 km, 360 Ma               [TODO]
// 157. Glasford         — Illinois, 4 km, <430 Ma                 [TODO]
// 158. Glover Bluff     — Wisconsin, 8 km, <500 Ma                [TODO]
// 159. Haviland         — Kansas, 0.015 km, <1000 yr              [TODO]
// 160. Kentland         — Indiana, 13 km, <97 Ma                  [TODO]
// 161. Manson           — Iowa, 35 km, 74 Ma                      [BATCH1]
// 162. Maple Creek      — Saskatchewan (listed under Canada above) [—]
// 163. Marquez          — Texas, 22 km, 58 Ma                     [TODO]
// 164. Middlesboro      — Kentucky, 6 km, <300 Ma                 [TODO]
// 165. Newporte         — North Dakota, 3.2 km, <500 Ma           [TODO]
// 166. Odessa           — Texas, 0.168 km, <63,500 yr             [TODO]
// 167. Red Wing Creek   — North Dakota, 9 km, 200 Ma              [TODO]
// 168. Rock Elm         — Wisconsin, 6 km, <505 Ma                [TODO]
// 169. Santa Fe         — New Mexico, 6-13 km, ~1200 Ma           [TODO]
// 170. Serpent Mound    — Ohio, 8 km, <320 Ma                     [TODO]
// 171. Sierra Madera    — Texas, 13 km, <100 Ma                   [TODO]
// 172. Upheaval Dome    — Utah, 10 km, ~170 Ma                    [BATCH1]
// 173. Wells Creek      — Tennessee, 12 km, 200 Ma                [TODO]
// 174. Wetumpka         — Alabama, 7.6 km, 83 Ma                  [BATCH1]
//
// — MEXICO (1) —
// 175. Chicxulub        — Yucatan, 180 km, 66 Ma                  [DONE]

// ──────────────────────────────────────────────────────────────────────────
// SOUTH AMERICA (11 confirmed)
// ──────────────────────────────────────────────────────────────────────────
// 176. Araguainha       — Brazil, 40 km, 254.7 Ma                 [BATCH1]
// 177. Campo del Cielo  — Argentina, strewn field, ~4000 yr       [DONE]
// 178. Carancas         — Peru, 0.0136 km, 2007                   [BATCH1]
// 179. Cerro do Jarau   — Brazil, 13.5 km, <120 Ma                [TODO]
// 180. Colônia          — Brazil, 3.6 km, <36 Ma                  [TODO]
// 181. Riachão Ring     — Brazil, 4.1 km, ~200 Ma                 [TODO]
// 182. Santa Marta      — Brazil, 10 km, 66-100 Ma                [TODO]
// 183. Serra da Cangalha — Brazil, 12 km, 220 Ma                  [TODO]
// 184. Vargeão Dome     — Brazil, 12 km, <70 Ma                   [TODO]
// 185. Vista Alegre     — Brazil, 9.5 km, <70 Ma                  [TODO]

// ──────────────────────────────────────────────────────────────────────────
// EVENTS / AIRBURSTS / STREWN FIELDS (not traditional craters but in EID)
// ──────────────────────────────────────────────────────────────────────────
// 186. Tunguska         — Russia (airburst), 1908                  [DONE]
// 187. Chelyabinsk      — Russia (airburst), 2013                  [DONE]
// 188. Hoba             — Namibia (meteorite, no crater), 80 ka    [DONE]

// ──────────────────────────────────────────────────────────────────────────
// RECENTLY CONFIRMED (2022-2025, not yet in PASSC but in Impact Earth)
// ──────────────────────────────────────────────────────────────────────────
// 189. Nova Colinas     — Brazil, ~2.5 km, 2022 confirmed          [TODO]
// 190. Ora Banda        — Australia, ~5 km, 2022 confirmed          [TODO]
// 191. Ilkurlka         — Australia, ~0.3 km, 2022 confirmed        [TODO]
// 192. Alhama de Almería — Spain, ~3 km, 2023 confirmed             [TODO]
// 193. Luna             — India, ~1.5 km, 2024 confirmed            [TODO]
// 194. Jake Seller Draw — USA, ~2 km, 2024 confirmed                [TODO]

// ──────────────────────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────────────────────
// Total confirmed structures:     ~190 (PASSC) / ~195 (Impact Earth 2025)
// Moments DONE (in moments.ts):   20
// Moments in BATCH 1 (this file): 30
// Moments TODO (follow-up):       ~140-145
//
// BATCH 2 PRIORITIES (next session):
//   - All remaining >10 km craters (~40 structures)
//   - All craters with notable stories (Wabar, Kamil, etc.)
//   - Complete geographic coverage
//
// BATCH 3 PRIORITIES:
//   - Small craters (<5 km) with less individual notability
//   - Strewn fields and microcrater clusters
//   - Recently confirmed structures (2022-2025)
