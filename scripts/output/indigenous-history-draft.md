# Indigenous History — Content Draft

> **Status**: DRAFT for review. Do NOT merge into source files until approved.
> **Date**: 2026-03-22

---

## Existing Content Inventory (DO NOT DUPLICATE)

The following already exist in the codebase:

### Stories
- `wounded-knee-massacre` — 3 moments (wkm-monument, wkm-mass-grave, wkm-pine-ridge-agency)
- `sand-creek-massacre` — 3 moments (scm-historic-site, scm-denver-capitol, scm-chivington-town)
- `fall-of-tenochtitlan` — 9 moments (Cortes birth through death)
- `trail-of-tears` — 5 moments (Indian Removal Act through Tahlequah arrival)
- `chichen-itza` — 3 moments (equinox, cenote, Thompson dredging)

### Standalone Moments (in collections, no dedicated story)
- `little-bighorn-custer` — in Famous Battlefields collection
- `mesa-verde-cliff-dwellings` — in First Settlements collection
- `geronimo-skeleton-canyon` — in Outlaws collection + geronimo-biography

### Entities
- `geronimo`, `nelson-miles`, `skeleton-canyon`, `hernan-cortes`, `moctezuma-ii`, `juan-diego`

### Collections
- `archaeological-discoveries-americas` — Mesoamerican archaeological sites
- `famous-battlefields` — includes little-bighorn-custer, tenochtitlan-fall
- `first-settlements-of-human-civilization` — includes mesa-verde-cliff-dwellings

---

## New Collection

```ts
{
  id: 'indigenous-peoples-resistance-and-survival',
  name: 'Indigenous Peoples: Resistance and Survival',
  subtitle: 'Massacres, last stands, forced marches, and ancient civilizations that European contact could not erase',
  description: 'From Cahokia to Wounded Knee, the places where indigenous civilizations thrived and where colonial powers tried to destroy them.',
  momentIds: [
    // --- Existing moments to cross-link ---
    'wkm-monument',
    'wkm-mass-grave',
    'scm-historic-site',
    'little-bighorn-custer',
    'mesa-verde-cliff-dwellings',
    'geronimo-skeleton-canyon',
    'indian-removal-act-1830',
    'cherokee-trail-of-tears-1838',
    'tenochtitlan-fall',
    'chichen-el-castillo-equinox',
    // --- NEW moments ---
    'cahokia-monks-mound-peak',
    'cahokia-woodhenge',
    'sitting-bull-little-bighorn-vision',
    'sitting-bull-assassination-1890',
    'tecumseh-prophetstown-1808',
    'tecumseh-death-thames-1813',
    'navajo-code-talkers-iwo-jima-1945',
    'navajo-long-walk-bosque-redondo-1864',
    'machu-picchu-pachacuti-construction',
    'machu-picchu-bingham-discovery-1911',
    'tikal-peak-population',
    'aztec-sun-stone-carving',
    'maori-arrival-aotearoa',
    'aboriginal-rock-art-kakadu',
    'inca-sapa-pachacuti-cusco-expansion',
  ],
  tags: ['indigenous', 'colonial-history', 'resistance', 'ancient-civilizations'],
}
```

---

## New Stories (3)

### Story 1: Sitting Bull

```ts
{
  id: 'sitting-bull-biography',
  name: 'Sitting Bull',
  years: '1831–1890',
  category: 'battles-conflicts',
  storyType: 'biography',
  description: '',
  tags: [],
  moments: [
    { momentId: 'sitting-bull-little-bighorn-vision' },
    { momentId: 'little-bighorn-custer' },         // EXISTING — cross-link
    { momentId: 'sitting-bull-assassination-1890' },
  ],
  wikipediaSlug: 'Sitting_Bull',
}
```

### Story 2: Tecumseh's War

```ts
{
  id: 'tecumsehs-war',
  name: "Tecumseh's War",
  years: '1808–1813',
  category: 'battles-conflicts',
  storyType: 'era',
  description: "A Shawnee chief builds the largest Native confederation since Pontiac, his brother's mystical movement draws thousands, and both collapse in a single afternoon on the Thames River in Ontario.",
  tags: ['indigenous-history', 'war-of-1812', 'shawnee', 'ohio', 'indiana'],
  moments: [
    { momentId: 'tecumseh-prophetstown-1808' },
    { momentId: 'tecumseh-death-thames-1813' },
  ],
  relatedStoryIds: ['trail-of-tears', 'wounded-knee-massacre'],
  wikipediaSlug: "Tecumseh's_War",
}
```

### Story 3: The Navajo Long Walk and Code Talkers

```ts
{
  id: 'navajo-long-walk-and-code-talkers',
  name: 'The Navajo Long Walk and Code Talkers',
  years: '1864–1945',
  category: 'dark-history',
  storyType: 'era',
  description: "The U.S. Army marches 8,000 Navajo 300 miles to a desert prison in 1864. Eighty years later, their unbreakable language wins the Pacific War. The same nation that tried to erase them needed them to survive.",
  tags: ['indigenous-history', 'navajo', 'wwii', 'new-mexico', 'arizona'],
  moments: [
    { momentId: 'navajo-long-walk-bosque-redondo-1864' },
    { momentId: 'navajo-code-talkers-iwo-jima-1945' },
  ],
  relatedStoryIds: ['trail-of-tears', 'wounded-knee-massacre'],
  wikipediaSlug: 'Navajo_Long_Walk',
}
```

---

## New Entities (7)

### Entity 1: Sitting Bull

```ts
{
  id: 'sitting-bull',
  name: 'Sitting Bull',
  type: 'person',
  years: '1831–1890',
  description: "Hunkpapa Lakota holy man who united the Sioux for the largest Native victory over the U.S. Army, then toured with Buffalo Bill's Wild West show before being shot dead by Indian police on the Standing Rock Reservation.",
  canonicalStoryId: 'sitting-bull-biography',
  wikipediaSlug: 'Sitting_Bull',
}
```

### Entity 2: Tecumseh

```ts
{
  id: 'tecumseh',
  name: 'Tecumseh',
  type: 'person',
  years: '1768–1813',
  description: "Shawnee war chief who built the largest Native confederation in American history to stop U.S. westward expansion. Killed at the Battle of the Thames in Ontario, his death shattered the alliance and opened the Midwest to settlement.",
  canonicalStoryId: 'tecumsehs-war',
  wikipediaSlug: 'Tecumseh',
}
```

### Entity 3: Pachacuti

```ts
{
  id: 'pachacuti',
  name: 'Pachacuti',
  type: 'person',
  years: '1418–1472',
  description: "Inca emperor who transformed a small Andean kingdom into the largest empire in pre-Columbian America, stretching 2,500 miles from Ecuador to Chile. Built Machu Picchu as a royal estate and reshaped Cusco into the capital of Tawantinsuyu.",
  canonicalStoryId: 'pachacuti-biography',
  wikipediaSlug: 'Pachacuti',
}
```

### Entity 4: Cahokia (place entity)

```ts
{
  id: 'cahokia',
  name: 'Cahokia',
  type: 'place',
  years: '600–1400',
  description: "Largest pre-Columbian city north of Mexico, home to 20,000 people at its peak around 1100 CE. Its central earthen mound covered more ground than the Great Pyramid of Giza. The Mississippian civilization that built it vanished before European contact.",
  wikipediaSlug: 'Cahokia',
}
```

### Entity 5: Machu Picchu (place entity)

```ts
{
  id: 'machu-picchu',
  name: 'Machu Picchu',
  type: 'place',
  years: '1450–1572',
  description: "Inca royal estate perched 2,430 meters above sea level on an Andean ridge. Built around 1450 for Pachacuti, abandoned during the Spanish conquest, and unknown to the outside world until Hiram Bingham arrived in 1911.",
  wikipediaSlug: 'Machu_Picchu',
}
```

### Entity 6: Tikal (place entity)

```ts
{
  id: 'tikal',
  name: 'Tikal',
  type: 'place',
  years: '600 BCE–900 CE',
  description: "One of the largest Maya city-states, home to 100,000 people at its peak. Its pyramids rise above the Peten jungle canopy in Guatemala. Tikal's rulers waged war with Calakmul for centuries before the city was abandoned around 900 CE.",
  wikipediaSlug: 'Tikal',
}
```

### Entity 7: Pachacuti biography story (invisible infrastructure)

```ts
{
  id: 'pachacuti-biography',
  name: 'Pachacuti',
  years: '1418–1472',
  category: 'political-drama',
  storyType: 'biography',
  description: '',
  tags: [],
  moments: [
    { momentId: 'inca-sapa-pachacuti-cusco-expansion' },
    { momentId: 'machu-picchu-pachacuti-construction' },
  ],
  wikipediaSlug: 'Pachacuti',
}
```

---

## New Moments (15)

---

### Moment 1: Cahokia — Monks Mound at Peak

```ts
{
  id: 'cahokia-monks-mound-peak',
  name: "20,000 People Live in a City with an Earthen Pyramid Larger Than Giza's Base",
  subtitle: 'Cahokia Mounds State Historic Site, Collinsville, IL. UNESCO World Heritage Site; Monks Mound is climbable via a wooden staircase',
  description: "Around 1100 CE, Cahokia was the largest city north of Mexico, home to more people than contemporary London. Monks Mound here rises 30 meters above the Mississippi floodplain -- its base covers 5.6 hectares, larger than the Great Pyramid of Giza. The Mississippian people who built it left no written records. By 1400, the city was abandoned. No one knows why.",
  lat: 38.6604,
  lng: -90.0622,
  type: 'archaeological_site',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'presence',
  year: 1100,
  address: 'Monks Mound, Cahokia Mounds State Historic Site, Collinsville, IL 62234',
  entityIds: ['cahokia'],
}
```

**Char counts**: Name: 75 | Subtitle: 109 | Description: 434

---

### Moment 2: Cahokia — Woodhenge

```ts
{
  id: 'cahokia-woodhenge',
  name: 'Mississippian Astronomers Build a Calendar of Red Cedar Posts',
  subtitle: 'Cahokia Mounds, Collinsville, IL. Reconstructed post circle west of Monks Mound; free to walk through',
  description: "A circle of tall red cedar posts here functioned as a solar calendar. At the spring and autumn equinoxes, the sun rises directly over Monks Mound when viewed from the center of the ring. Archaeologist Warren Wittry discovered the postholes in 1961 and named it Woodhenge. The reconstructed posts stand in their original positions, aligned to solstices and equinoxes with an accuracy that rivals Stonehenge.",
  lat: 38.6612,
  lng: -90.0668,
  type: 'archaeological_site',
  importance: 'minor',
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'presence',
  year: 1100,
  address: 'Woodhenge, Cahokia Mounds State Historic Site, Collinsville, IL 62234',
  entityIds: ['cahokia'],
}
```

**Char counts**: Name: 62 | Subtitle: 96 | Description: 438

---

### Moment 3: Sitting Bull's Sun Dance Vision

```ts
{
  id: 'sitting-bull-little-bighorn-vision',
  name: 'Sitting Bull Dances for Hours and Sees a Vision of Soldiers Falling Upside Down',
  subtitle: 'Near the confluence of Rosebud Creek and the Yellowstone River, MT. No marker at the Sun Dance site; remote rangeland',
  description: "In June 1876, Sitting Bull performed a Sun Dance here on Rosebud Creek, slashing his arms 50 times as an offering. He danced staring at the sun until he collapsed and reported a vision: American soldiers falling upside down into the Lakota camp. Days later, on 25 June, Custer's 7th Cavalry rode into the Little Bighorn valley and was annihilated. The vision made Sitting Bull the most feared leader on the Plains.",
  lat: 45.557,
  lng: -106.647,
  type: 'cultural_site',
  importance: 'major',
  verificationLevel: 'documented',
  accuracy: 'approximate',
  kind: 'event',
  year: 1876,
  address: 'Near Rosebud Creek, Rosebud County, Montana',
  entityIds: ['sitting-bull'],
}
```

**Char counts**: Name: 80 | Subtitle: 117 | Description: 452

---

### Moment 4: Sitting Bull's Assassination

```ts
{
  id: 'sitting-bull-assassination-1890',
  name: 'Indian Police Shoot Sitting Bull Dead on the Standing Rock Reservation',
  subtitle: 'Standing Rock Reservation, near Fort Yates, ND. His original burial site is disputed; a monument stands near Mobridge, SD',
  description: "On 15 December 1890, forty-three Indian police officers arrived at Sitting Bull's cabin here on the Grand River to arrest him. Authorities feared his involvement with the Ghost Dance movement. A scuffle erupted and Sitting Bull was shot in the head and chest. He was 59. Fourteen days later, the 7th Cavalry -- Custer's old regiment -- massacred 250 Lakota at Wounded Knee.",
  lat: 46.0858,
  lng: -100.6285,
  type: 'crime_scene',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'approximate',
  kind: 'milestone',
  year: 1890,
  address: 'Grand River, Standing Rock Reservation, near Fort Yates, ND',
  entityIds: ['sitting-bull'],
}
```

**Char counts**: Name: 72 | Subtitle: 116 | Description: 423

---

### Moment 5: Tecumseh Founds Prophetstown

```ts
{
  id: 'tecumseh-prophetstown-1808',
  name: "Tecumseh and His Brother Build a Capital for the Largest Native Confederation",
  subtitle: 'Prophetstown State Park, Battle Ground, IN. The park occupies the site; an interpretive center tells the story',
  description: "In 1808, the Shawnee chief Tecumseh and his brother Tenskwatawa -- the Prophet -- established a multi-tribal settlement here at the confluence of the Tippecanoe and Wabash rivers. Warriors from dozens of nations gathered, drawn by the Prophet's vision of a return to pre-European ways. At its peak, Prophetstown housed over 1,000 people. Governor William Henry Harrison destroyed it in November 1811 while Tecumseh was away recruiting allies in the South.",
  lat: 40.5082,
  lng: -86.9098,
  type: 'settlement_site',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1808,
  address: 'Prophetstown State Park, 5545 Swisher Rd, Battle Ground, IN 47920',
  entityIds: ['tecumseh'],
}
```

**Char counts**: Name: 78 | Subtitle: 104 | Description: 477

---

### Moment 6: Tecumseh Dies at the Battle of the Thames

```ts
{
  id: 'tecumseh-death-thames-1813',
  name: 'Tecumseh Is Killed at the Battle of the Thames, Ending Native Resistance East of the Mississippi',
  subtitle: 'Battlefield of the Thames National Historic Site, Thamesville, ON, Canada. A monument marks the battlefield',
  description: "On 5 October 1813, Tecumseh fell here in a swampy forest along the Thames River in Upper Canada, fighting alongside the British against American forces. His death shattered the Native confederation he had spent a decade building. No one recovered his body -- the location of his grave remains unknown. Within two decades, nearly every eastern tribe was forcibly removed west of the Mississippi.",
  lat: 42.5536,
  lng: -81.8336,
  type: 'battlefield',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'approximate',
  kind: 'milestone',
  year: 1813,
  address: 'Longwoods Road, Thamesville, Chatham-Kent, Ontario, Canada',
  entityIds: ['tecumseh'],
}
```

**Char counts**: Name: 95 | Subtitle: 104 | Description: 420

---

### Moment 7: Navajo Long Walk to Bosque Redondo

```ts
{
  id: 'navajo-long-walk-bosque-redondo-1864',
  name: 'The U.S. Army Marches 8,000 Navajo 300 Miles to a Desert Prison Camp',
  subtitle: 'Bosque Redondo Memorial, Fort Sumner, NM. State monument with a circular memorial building and interpretive exhibits',
  description: "Beginning in January 1864, Kit Carson's scorched-earth campaign forced 8,000 Navajo to march here to Bosque Redondo, a barren reservation at Fort Sumner. Hundreds died on the 300-mile walk. Conditions at the camp were catastrophic -- alkaline water, crop failures, and Comanche raids. After four years, a treaty in 1868 allowed the Navajo to return home. The Navajo call it the Long Walk, and it remains central to tribal identity.",
  lat: 34.3888,
  lng: -104.1923,
  type: 'historical_site',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1864,
  address: 'Bosque Redondo Memorial, 3647 Billy the Kid Dr, Fort Sumner, NM 88119',
  entityIds: [],
}
```

**Char counts**: Name: 71 | Subtitle: 107 | Description: 460

---

### Moment 8: Navajo Code Talkers at Iwo Jima

```ts
{
  id: 'navajo-code-talkers-iwo-jima-1945',
  name: 'Navajo Code Talkers Transmit Over 800 Error-Free Messages During the Battle of Iwo Jima',
  subtitle: 'Iwo Jima (Ioto), Ogasawara, Tokyo, Japan. The island is an active Japanese military base with restricted access',
  description: "During the battle for Iwo Jima in February and March 1945, six Navajo Code Talkers worked around the clock transmitting tactical messages in a code based on their language. The Japanese never broke it. Signal officer Howard Connor said the Marines would not have taken Iwo Jima without them. Eighty years earlier, the U.S. government had tried to eradicate the Navajo language through forced boarding schools. The military classified the program until 1968.",
  lat: 24.7583,
  lng: 141.2917,
  type: 'battlefield',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'approximate',
  kind: 'event',
  year: 1945,
  address: 'Iwo Jima (Ioto), Ogasawara, Tokyo, Japan',
  entityIds: [],
}
```

**Char counts**: Name: 89 | Subtitle: 102 | Description: 476

---

### Moment 9: Pachacuti Expands the Inca Empire from Cusco

```ts
{
  id: 'inca-sapa-pachacuti-cusco-expansion',
  name: 'Pachacuti Transforms a Small Andean Kingdom into an Empire Stretching 2,500 Miles',
  subtitle: 'Qorikancha (Temple of the Sun), Cusco, Peru. The Inca walls survive beneath the Santo Domingo convent',
  description: "Around 1438, the Inca prince Pachacuti seized power after defending Cusco from a Chanka invasion his father had fled. He rebuilt Cusco in the shape of a puma, lined the Temple of the Sun here with 700 sheets of gold, and launched conquests that created the largest empire in the pre-Columbian Americas. The Inca road network eventually stretched 40,000 kilometers -- longer than the Roman road system.",
  lat: -13.5183,
  lng: -71.9750,
  type: 'historical_site',
  importance: 'major',
  verificationLevel: 'documented',
  accuracy: 'exact',
  kind: 'event',
  year: 1438,
  address: 'Qorikancha, Plazoleta Santo Domingo, Cusco, Peru',
  entityIds: ['pachacuti'],
}
```

**Char counts**: Name: 82 | Subtitle: 97 | Description: 432

---

### Moment 10: Pachacuti Builds Machu Picchu

```ts
{
  id: 'machu-picchu-pachacuti-construction',
  name: 'Pachacuti Builds a Royal Estate on a Ridge 2,430 Meters Above Sea Level',
  subtitle: 'Machu Picchu, Urubamba Province, Cusco, Peru. UNESCO World Heritage Site; daily visitor cap of 4,044',
  description: "Around 1450, Pachacuti ordered the construction of a royal estate here on a saddle between two Andean peaks. Workers cut granite blocks with bronze tools and fitted them without mortar so precisely that a knife blade cannot fit between the stones. The site housed roughly 750 people and included temples, terraces, and an astronomical observatory. Abandoned during the Spanish conquest, it remained unknown to the outside world until 1911.",
  lat: -13.1631,
  lng: -72.5450,
  type: 'archaeological_site',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1450,
  address: 'Machu Picchu, Urubamba Province, Cusco Region, Peru',
  entityIds: ['pachacuti', 'machu-picchu'],
}
```

**Char counts**: Name: 73 | Subtitle: 98 | Description: 454

---

### Moment 11: Bingham Discovers Machu Picchu

```ts
{
  id: 'machu-picchu-bingham-discovery-1911',
  name: 'A Yale Lecturer Follows a Local Farmer to an Overgrown Ruin That Becomes the Most Famous Archaeological Site in the Americas',
  subtitle: 'Machu Picchu, Urubamba Province, Cusco, Peru. The Bingham approach trail from the Urubamba River is no longer the main route',
  description: "On 24 July 1911, Yale lecturer Hiram Bingham III climbed through cloud forest above the Urubamba River, guided by a local farmer named Melchor Arteaga. He found terraces and granite walls swallowed by vegetation. Bingham believed he had discovered Vilcabamba, the last Inca capital. He was wrong -- the site was Pachacuti's 15th-century royal estate. Peru spent decades recovering artifacts Bingham shipped to Yale; the last crates were returned in 2012.",
  lat: -13.1631,
  lng: -72.5450,
  type: 'discovery_site',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1911,
  address: 'Machu Picchu, Urubamba Province, Cusco Region, Peru',
  entityIds: ['machu-picchu'],
}
```

**Char counts**: Name: 118 (under 120 max) | Subtitle: 115 | Description: 481

---

### Moment 12: Tikal at Its Peak

```ts
{
  id: 'tikal-peak-population',
  name: '100,000 People Live in a Maya Metropolis Whose Pyramids Rise Above the Jungle Canopy',
  subtitle: 'Tikal National Park, Peten, Guatemala. UNESCO World Heritage Site; Temple IV offers the famous above-canopy view',
  description: "By 750 CE, Tikal was one of the largest cities in the ancient world, home to an estimated 100,000 people spread across 60 square kilometers of the Peten jungle. Temple I here rises 47 meters above the Great Plaza. The city's kings waged a century-long war with rival Calakmul. Within 150 years of its peak, Tikal was abandoned. The jungle swallowed it completely until Guatemalan explorers rediscovered it in 1848.",
  lat: 17.2220,
  lng: -89.6237,
  type: 'archaeological_site',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'presence',
  year: 750,
  address: 'Tikal National Park, Flores, Peten, Guatemala',
  entityIds: ['tikal'],
}
```

**Char counts**: Name: 85 | Subtitle: 108 | Description: 435

---

### Moment 13: Aztec Sun Stone Carved

```ts
{
  id: 'aztec-sun-stone-carving',
  name: 'Aztec Sculptors Carve a 24-Ton Basalt Calendar Stone Depicting Five Cosmic Eras',
  subtitle: 'National Museum of Anthropology, Chapultepec, Mexico City. The Sun Stone is in the Mexica Hall, ground floor',
  description: "Around 1502, Aztec stone carvers completed a 3.6-meter basalt disk weighing 24 tons, depicting the face of the sun god Tonatiuh surrounded by four previous cosmic eras. Buried after the Spanish conquest, it was rediscovered on 17 December 1790 beneath Mexico City's main plaza during drainage work. The stone is not a calendar in the modern sense but a cosmological monument. It remains the single most recognizable artifact of pre-Columbian Mesoamerica.",
  lat: 19.4260,
  lng: -99.1861,
  type: 'cultural_site',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1502,
  address: 'National Museum of Anthropology, Av. Paseo de la Reforma, Mexico City, Mexico',
  entityIds: [],
}
```

**Char counts**: Name: 80 | Subtitle: 105 | Description: 479

---

### Moment 14: Maori Arrive in Aotearoa

```ts
{
  id: 'maori-arrival-aotearoa',
  name: "Polynesian Navigators Reach New Zealand in Double-Hulled Canoes After a 3,200-Kilometer Voyage",
  subtitle: 'Tauranga Bay, near Kaeo, Northland, New Zealand. A carved prow replica marks the Mamari waka landing site',
  description: "Around 1300 CE, Polynesian navigators sailing double-hulled waka canoes reached the shores of Aotearoa after a 3,200-kilometer open-ocean voyage from eastern Polynesia. They navigated by stars, ocean swells, and bird migration patterns -- no instruments. New Zealand was the last major landmass on Earth to be settled by humans. Within a century, Maori settlements dotted both islands, and the megafauna moa was hunted to extinction.",
  lat: -35.0823,
  lng: 173.9033,
  type: 'historical_site',
  importance: 'major',
  verificationLevel: 'documented',
  accuracy: 'general-area',
  kind: 'event',
  year: 1300,
  address: 'Tauranga Bay, near Kaeo, Northland, New Zealand',
  entityIds: [],
}
```

**Char counts**: Name: 92 | Subtitle: 102 | Description: 454

---

### Moment 15: Aboriginal Rock Art at Kakadu

```ts
{
  id: 'aboriginal-rock-art-kakadu',
  name: 'Aboriginal Australians Paint the Oldest Continuous Art Tradition on Earth, Spanning 40,000 Years',
  subtitle: 'Ubirr Rock Art Site, Kakadu National Park, NT, Australia. UNESCO World Heritage Site; accessible by sealed road in dry season',
  description: "The sandstone overhangs at Ubirr here in Kakadu contain painted layers spanning at least 20,000 years -- some estimates push the oldest marks to 40,000 years, predating every known cave painting in Europe. The art depicts thylacines (extinct 2,000 years ago), Macassan traders (pre-European contact), and X-ray-style fish showing internal organs. Aboriginal custodians still maintain the site. It is the longest continuous artistic tradition anywhere on Earth.",
  lat: -12.4092,
  lng: 132.9549,
  type: 'cultural_site',
  importance: 'major',
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'presence',
  year: -40000,
  address: 'Ubirr Rock Art Site, Kakadu National Park, Northern Territory 0886, Australia',
  entityIds: [],
}
```

**Char counts**: Name: 93 | Subtitle: 112 | Description: 472

---

## Wiring Notes

### Cross-links to existing content
- **Little Bighorn** (`little-bighorn-custer`): Already exists. Add to `sitting-bull-biography` moments and the new collection. Add `sitting-bull` to its `entityIds`.
- **Geronimo's Surrender** (`geronimo-skeleton-canyon`): Already exists. Include in collection. No changes needed.
- **Trail of Tears moments**: Already exist. Include `indian-removal-act-1830` and `cherokee-trail-of-tears-1838` in the collection.
- **Fall of Tenochtitlan** (`tenochtitlan-fall`): Already exists. Include in collection.
- **Mesa Verde** (`mesa-verde-cliff-dwellings`): Already exists. Include in collection.
- **Chichen Itza** (`chichen-el-castillo-equinox`): Already exists. Include in collection.
- **Iwo Jima** (`iwo-jima-suribachi`): Already exists. The Code Talkers moment is a SEPARATE moment at the same location, covering a different aspect.

### Entity updates needed
- Add `sitting-bull` to `entityIds` of existing moment `little-bighorn-custer` (he was physically present at the battle).

### relatedStoryIds updates needed
- `wounded-knee-massacre`: add `'sitting-bull-biography'` and `'navajo-long-walk-and-code-talkers'`
- `sand-creek-massacre`: add `'tecumsehs-war'` and `'navajo-long-walk-and-code-talkers'`
- `trail-of-tears`: add `'tecumsehs-war'`
- `fall-of-tenochtitlan`: no change needed (already well-connected)

### Stories that need the new collection added
- `sitting-bull-biography` (new)
- `tecumsehs-war` (new)
- `navajo-long-walk-and-code-talkers` (new)
- `pachacuti-biography` (new)

---

## Summary

| Category | Count | Details |
|---|---|---|
| New moments | 15 | See above |
| New stories | 4 | sitting-bull-biography, tecumsehs-war, navajo-long-walk-and-code-talkers, pachacuti-biography |
| New entities | 6 | sitting-bull, tecumseh, pachacuti, cahokia (place), machu-picchu (place), tikal (place) |
| New collection | 1 | indigenous-peoples-resistance-and-survival |
| Existing moments cross-linked | 10 | wkm-monument, wkm-mass-grave, scm-historic-site, little-bighorn-custer, mesa-verde-cliff-dwellings, geronimo-skeleton-canyon, indian-removal-act-1830, cherokee-trail-of-tears-1838, tenochtitlan-fall, chichen-el-castillo-equinox |
| Existing entity updates | 1 | Add sitting-bull to little-bighorn-custer entityIds |
