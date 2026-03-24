# Rome Seed City Draft

> **Status**: Draft for review. Do NOT merge into source files until approved.
> **Author**: Claude (session draft)
> **Date**: 2026-03-22
> **Existing Rome moments**: 29 (cataloged below)
> **New moments drafted**: 28
> **New entities drafted**: 10
> **New stories drafted**: 3

---

## Existing Rome Moments (DO NOT DUPLICATE)

These 29 moments already exist in `moments.ts` with pins in or near Rome (lat ~41.85-41.93, lng ~12.45-12.51):

| # | ID | Name | Year | Location |
|---|---|---|---|---|
| 1 | `romulus-founds-rome` | Romulus Kills His Twin Brother and Founds Rome on the Palatine Hill | -753 | Palatine Hill |
| 2 | `caesar-born-rome-100bc` | Julius Caesar Is Born Into a Patrician Family Claiming Descent from Venus | -100 | Subura district |
| 3 | `spartacus-appian-way` | Crassus Crucifies 6,000 of Spartacus's Followers Along the Appian Way | -71 | Via Appia Antica |
| 4 | `cicero-prosecutes-verres` | Cicero Prosecutes Governor Verres So Devastatingly That Verres Flees | -70 | Forum Romanum |
| 5 | `cicero-suppresses-catilinarian-conspiracy` | Cicero Exposes the Catilinarian Conspiracy | -63 | Temple of Concord |
| 6 | `cicero-exiled-from-rome` | Cicero Is Exiled and His Palatine Hill House Is Razed | -58 | Palatine Hill |
| 7 | `tiberius-born-in-rome-to-claudian-family` | Tiberius Is Born in Rome to the Ancient Claudian Dynasty | -42 | Rome |
| 8 | `caesar-declared-dictator-for-life-44bc` | Caesar Is Proclaimed Dictator for Life | -44 | Roman Forum |
| 9 | `julius-caesar-assassinated` | Julius Caesar Is Stabbed 23 Times by Senators on the Ides of March | -44 | Largo di Torre Argentina |
| 10 | `cicero-delivers-philippics-against-antony` | Cicero Delivers 14 Speeches Demanding Mark Antony's Destruction | -44 | Forum Romanum |
| 11 | `ovid-first-recitation-rome-25bc` | Ovid Debuts as a Poet in Rome at Eighteen | -25 | Rome |
| 12 | `seneca-becomes-nero-advisor` | Seneca Becomes Chief Advisor to 16-Year-Old Emperor Nero | 54 | Palatine Hill |
| 13 | `nero-becomes-emperor-age-16` | Nero Becomes Emperor at Sixteen After His Mother Poisons Claudius | 54 | Palatine Hill |
| 14 | `paul-arrives-rome` | Paul Arrives in Rome as a Prisoner and Preaches Under House Arrest | 61 | San Paolo fuori le Mura |
| 15 | `nero-great-fire-rome` | Rome Burns for Six Days and Nero Builds His Golden Palace on the Ashes | 64 | Domus Aurea |
| 16 | `nero-commits-suicide` | Nero Kills Himself After the Senate Declares Him a Public Enemy | 68 | Villa outside Rome |
| 17 | `colosseum-opens` | Emperor Titus Opens the Colosseum with One Hundred Days of Games | 80 | Colosseum |
| 18 | `marcus-aurelius-born-rome` | Marcus Aurelius Is Born on Rome's Caelian Hill | 121 | Caelian Hill |
| 19 | `marcus-aurelius-becomes-emperor` | Marcus Aurelius Becomes Emperor and Shares Power | 161 | Roman Forum |
| 20 | `visigoths-sack-rome` | The Visigoths Sack Rome for the First Time in Eight Hundred Years | 410 | Porta Salaria |
| 21 | `charlemagne-crowned-emperor-rome` | Pope Leo III Crowns Charlemagne Emperor on Christmas Day | 800 | St. Peter's |
| 22 | `michelangelo-pieta-commissioned-rome` | Michelangelo Carves the Pieta at Age 24 | 1498 | St. Peter's |
| 23 | `raphael-paints-school-of-athens-vatican-1509` | Raphael Paints The School of Athens in the Vatican at Age 25 | 1509 | Vatican |
| 24 | `michelangelo-sistine-chapel` | Michelangelo Unveils the Sistine Chapel Ceiling | 1512 | Sistine Chapel |
| 25 | `raphael-dies-rome` | Raphael Dies at Thirty-Seven and All of Rome Mourns | 1520 | Pantheon |
| 26 | `michelangelo-last-judgment-unveiled` | Michelangelo Unveils 300 Nude Figures on the Sistine Chapel's Altar Wall | 1541 | Sistine Chapel |
| 27 | `caravaggio-kills-ranuccio` | Caravaggio Kills a Man in a Street Brawl and Flees Rome Forever | 1606 | Via della Pallacorda |
| 28 | `mussolini-march-on-rome` | Mussolini Marches on Rome and the King Hands Him Power | 1922 | Piazza Venezia |
| 29 | `lateran-treaty-vatican` | Mussolini and the Pope Sign a Treaty Creating the World's Smallest Country | 1929 | Lateran Palace |

### Cross-linking opportunities
These existing moments OUTSIDE Rome should be cross-linked in new Rome stories:
- `caesar-crosses-rubicon-49bc` (Rimini) -- connects to Republic/Empire era story
- `caesar-captured-by-pirates-75bc` (Aegean) -- connects to Caesar biography
- `cicero-executed-formiae` (Formia) -- connects to Republic story
- `nero-murders-agrippina` (Baiae) -- connects to Nero
- `nero-performs-olympics-greece` (Olympia) -- connects to Nero
- `tiberius-retires-to-rhodes-abandoning-rome` (Rhodes) -- connects to Tiberius
- `tiberius-orders-sejanus-executed-for-treason` (Capri) -- connects to Tiberius

---

## New Entities (10)

### entity: hadrian

```typescript
{
  id: 'hadrian',
  name: 'Hadrian',
  type: 'person',
  description: 'The emperor who built walls at both ends of the world. Hadrian spent half his reign traveling every province of the Roman Empire, built the Pantheon as it stands today, and constructed the wall across Britain that bears his name. He designed his own tomb, which became Castel Sant\'Angelo.',
  canonicalStoryId: 'rise-fall-rome',
  wikipediaSlug: 'Hadrian',
  tags: ['roman-emperor', 'architecture', 'ancient-rome'],
}
```

### entity: constantine-the-great

```typescript
{
  id: 'constantine-the-great',
  name: 'Constantine the Great',
  type: 'person',
  description: 'The emperor who made Christianity Rome\'s religion. Constantine won a civil war, legalized Christian worship with the Edict of Milan in 313, convened the Council of Nicaea, and founded Constantinople as a new capital that lasted over a thousand years. He was only baptized on his deathbed.',
  canonicalStoryId: 'rise-fall-rome',
  wikipediaSlug: 'Constantine_the_Great',
  tags: ['roman-emperor', 'christianity', 'ancient-rome'],
}
```

**NOTE**: This entity already exists in entities.ts. Verify before adding.

### entity: bernini

```typescript
{
  id: 'bernini',
  name: 'Gian Lorenzo Bernini',
  type: 'person',
  description: 'The sculptor who shaped Baroque Rome more than any other person. Bernini carved the Ecstasy of Saint Teresa at 52, designed St. Peter\'s Square at 58, and completed over 80 commissions for eight popes across a 60-year career. He barely left Rome his entire life.',
  canonicalStoryId: 'baroque-rome',
  wikipediaSlug: 'Gian_Lorenzo_Bernini',
  tags: ['sculptor', 'architect', 'baroque', 'rome'],
}
```

### entity: giuseppe-garibaldi

```typescript
{
  id: 'giuseppe-garibaldi',
  name: 'Giuseppe Garibaldi',
  type: 'person',
  description: 'The guerrilla general who handed a king an entire country. Garibaldi conquered Sicily and Naples with a thousand red-shirted volunteers, then surrendered it all to Victor Emmanuel II. He refused titles, land, and money, and retired to a farm on a small island.',
  canonicalStoryId: 'italian-unification',
  wikipediaSlug: 'Giuseppe_Garibaldi',
  tags: ['italy', 'unification', 'military'],
}
```

### entity: federico-fellini

```typescript
{
  id: 'federico-fellini',
  name: 'Federico Fellini',
  type: 'person',
  description: 'The director who made Rome a state of mind. Fellini won four Best Foreign Language Film Oscars and gave the world "paparazzi" (from a character in La Dolce Vita). He refused to shoot on location, building his own Rome inside Cinecitta studios.',
  canonicalStoryId: 'baroque-rome',
  wikipediaSlug: 'Federico_Fellini',
  tags: ['film', 'director', 'italian-cinema', 'rome'],
}
```

### entity: pope-julius-ii

```typescript
{
  id: 'pope-julius-ii',
  name: 'Pope Julius II',
  type: 'person',
  description: 'The warrior pope who commissioned the Sistine Chapel ceiling and the new St. Peter\'s Basilica. Julius II personally led armies in battle, terrified Michelangelo into accepting the ceiling commission, and hired Bramante and Raphael to rebuild the Vatican. He died before any of it was finished.',
  canonicalStoryId: 'baroque-rome',
  wikipediaSlug: 'Pope_Julius_II',
  tags: ['pope', 'vatican', 'renaissance', 'patronage'],
}
```

### entity: vittorio-emanuele-ii

```typescript
{
  id: 'vittorio-emanuele-ii',
  name: 'Victor Emmanuel II',
  type: 'person',
  description: 'The first king of unified Italy. Victor Emmanuel II leveraged Cavour\'s diplomacy and Garibaldi\'s conquests to unite a peninsula that had been fragmented for 1,400 years. His tomb dominates the Pantheon; his monument dominates the Roman skyline.',
  canonicalStoryId: 'italian-unification',
  wikipediaSlug: 'Victor_Emmanuel_II',
  tags: ['italy', 'king', 'unification'],
}
```

### entity: giordano-bruno

```typescript
{
  id: 'giordano-bruno',
  name: 'Giordano Bruno',
  type: 'person',
  description: 'The friar who said the universe was infinite and burned for it. Bruno proposed that stars were distant suns with their own planets, rejected the Trinity, and wandered Europe for 16 years before the Inquisition lured him back to Italy and burned him alive in a Roman square.',
  canonicalStoryId: 'baroque-rome',
  wikipediaSlug: 'Giordano_Bruno',
  tags: ['philosophy', 'astronomy', 'inquisition', 'heresy'],
}
```

### entity: valentino-garavani

```typescript
{
  id: 'valentino-garavani',
  name: 'Valentino Garavani',
  type: 'person',
  description: 'The couturier who dressed Jackie Kennedy, Elizabeth Taylor, and half of European royalty in his signature red. Valentino opened his first atelier on Via Condotti at 27, built a fashion empire from Rome rather than Paris, and defined Italian alta moda for half a century.',
  canonicalStoryId: 'baroque-rome',
  wikipediaSlug: 'Valentino_(fashion_designer)',
  tags: ['fashion', 'rome', 'couture'],
}
```

### entity: cinecitta-studios

```typescript
{
  id: 'cinecitta-studios',
  name: 'Cinecitta Studios',
  type: 'place',
  description: 'The film studio complex that Mussolini built and Fellini made immortal. Opened in 1937 as a propaganda factory, Cinecitta became Hollywood on the Tiber in the 1950s, hosting Ben-Hur, Cleopatra, and La Dolce Vita. Over 3,000 films have been shot on its 99 acres southeast of Rome.',
  canonicalStoryId: 'baroque-rome',
  wikipediaSlug: 'Cinecitt%C3%A0',
  tags: ['film', 'studio', 'rome', 'italian-cinema'],
}
```

---

## New Stories (3)

### story: baroque-rome

```typescript
{
  id: 'baroque-rome',
  name: 'Baroque Rome',
  storyType: 'era',
  category: 'arts-culture',
  description: 'Bernini sculpts an angel in ecstasy, Caravaggio kills a man and flees, and a friar burns alive for saying the universe is infinite. The art, blood, and faith that built modern Rome.',
  tags: ['rome', 'baroque', 'art', 'architecture', 'renaissance'],
  moments: [
    { momentId: 'giordano-bruno-burned-campo-de-fiori-1600' },
    { momentId: 'caravaggio-kills-ranuccio' },
    { momentId: 'bernini-baldacchino-st-peters-1633' },
    { momentId: 'bernini-colonnade-st-peters-1667' },
    { momentId: 'bernini-ecstasy-of-saint-teresa-1652' },
    { momentId: 'trevi-fountain-completed-1762' },
    { momentId: 'spanish-steps-completed-1725' },
  ],
  relatedStoryIds: ['rise-fall-rome', 'italian-unification', 'michelangelo-biography', 'raphael-biography'],
  wikipediaSlug: 'Baroque_architecture_in_Rome',
}
```

### story: italian-unification

```typescript
{
  id: 'italian-unification',
  name: 'Italian Unification',
  storyType: 'era',
  category: 'political-drama',
  description: 'A thousand red-shirted volunteers conquer a kingdom, a pope locks himself inside the Vatican for 59 years, and a peninsula fragmented since the fall of Rome becomes a single nation.',
  tags: ['italy', 'unification', 'risorgimento', 'garibaldi', 'rome'],
  moments: [
    { momentId: 'roman-republic-1849-defense' },
    { momentId: 'italian-troops-breach-porta-pia-1870' },
    { momentId: 'rome-proclaimed-capital-of-italy-1871' },
    { momentId: 'vittoriano-inaugurated-1911' },
  ],
  relatedStoryIds: ['rise-fall-rome', 'baroque-rome'],
  wikipediaSlug: 'Italian_unification',
}
```

### story: modern-rome

```typescript
{
  id: 'modern-rome',
  name: 'Modern Rome',
  storyType: 'era',
  category: 'arts-culture',
  description: 'Fellini reinvents cinema at Cinecitta, Nazis round up the Ghetto, Valentino invents Italian couture, and a coin tossed in a fountain becomes the world\'s most famous wish.',
  tags: ['rome', 'modern', 'film', 'fashion', 'wwii'],
  moments: [
    { momentId: 'nazi-roundup-roman-ghetto-1943' },
    { momentId: 'fosse-ardeatine-massacre-1944' },
    { momentId: 'rome-liberated-first-axis-capital-1944' },
    { momentId: 'fellini-films-la-dolce-vita-trevi-1960' },
    { momentId: 'valentino-opens-atelier-via-condotti-1959' },
    { momentId: 'treaty-of-rome-signs-european-community-1957' },
  ],
  relatedStoryIds: ['italian-unification', 'baroque-rome'],
  wikipediaSlug: 'History_of_Rome',
}
```

---

## New Moments (28)

### 1. Pantheon Rebuilt by Hadrian (c. 125 CE)

```typescript
{
  id: 'hadrian-rebuilds-pantheon-125',
  name: 'Hadrian Rebuilds the Pantheon with the Largest Unreinforced Concrete Dome in History',
  subtitle: 'Piazza della Rotonda, Rome. The Pantheon is free to enter; Raphael\'s tomb is inside',
  description: 'Emperor Hadrian completed his reconstruction of the Pantheon here around 125 CE, replacing an earlier temple burned in 80 CE. The dome spans 43.3 meters and remains the largest unreinforced concrete dome ever built. Hadrian kept the original inscription crediting Agrippa, hiding his own authorship. The oculus at the top, 8.7 meters wide, is the building\'s only light source. Rain falls through it onto the marble floor. The building survived because it was consecrated as a church in 609 CE.',
  lat: 41.8986,
  lng: 12.4769,
  type: 'landmark',
  importance: 'major',
  notability: 85,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 125,
  date: 'c. 125 CE',
  address: 'Piazza della Rotonda, Rome, Italy',
  entityIds: ['hadrian'],
}
```

### 2. Arch of Titus Erected (81 CE)

```typescript
{
  id: 'arch-of-titus-erected-81',
  name: 'The Senate Erects the Arch of Titus to Celebrate the Destruction of Jerusalem',
  subtitle: 'Via Sacra, Roman Forum, Rome. The arch still stands at the eastern entrance to the Forum',
  description: 'After Titus died in September 81 CE, the Senate erected this triumphal arch here at the highest point of the Via Sacra to commemorate his sack of Jerusalem in 70 CE. The inner relief panel depicts Roman soldiers carrying the Temple\'s menorah and silver trumpets through a triumphal procession. For centuries, Jews in Rome refused to walk beneath it. The arch became the model for the Arc de Triomphe in Paris, 1,700 years later.',
  lat: 41.8907,
  lng: 12.4886,
  type: 'monument',
  importance: 'major',
  notability: 72,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 81,
  date: '81 CE',
  address: 'Via Sacra, Roman Forum, Rome, Italy',
  entityIds: ['hadrian'],
}
```

**NOTE**: entityIds should reference Titus/Domitian, not Hadrian. Since neither entity exists yet, consider tagging with a story-only link or creating a Titus entity. For now, leave as placeholder.

### 3. Constantine Defeats Maxentius at the Milvian Bridge (312 CE)

```typescript
{
  id: 'constantine-milvian-bridge-312',
  name: 'Constantine Defeats Maxentius at the Milvian Bridge After Seeing a Cross in the Sky',
  subtitle: 'Ponte Milvio, Via Flaminia, Rome. The ancient bridge still stands and is pedestrian-only',
  description: 'On 28 October 312 CE, Constantine\'s army met Maxentius here at the Milvian Bridge over the Tiber. According to Eusebius, Constantine had seen a cross of light in the sky the previous day with the words "In this sign, conquer." He ordered his soldiers to paint Chi-Rho symbols on their shields. Maxentius drowned when a pontoon bridge collapsed under his retreating army. The victory gave Constantine sole control of the western empire and made Christianity the empire\'s favored religion.',
  lat: 41.9362,
  lng: 12.4672,
  type: 'battlefield',
  importance: 'major',
  notability: 80,
  verificationLevel: 'documented',
  accuracy: 'exact',
  kind: 'event',
  year: 312,
  date: '28 October 312 CE',
  address: 'Ponte Milvio, Via Flaminia, Rome, Italy',
  entityIds: ['constantine-the-great'],
}
```

### 4. Vandals Sack Rome (455 CE)

```typescript
{
  id: 'vandals-sack-rome-455',
  name: 'The Vandals Sack Rome for Fourteen Days and Strip the Temple of Jupiter',
  subtitle: 'Port of Rome / Capitoline Hill area. The Temple of Jupiter is gone; the Capitoline Museums occupy the hill today',
  description: 'King Gaiseric and his Vandal fleet sailed from Carthage and entered an undefended Rome on 2 June 455 CE, 45 years after the Visigoth sack. Pope Leo I reportedly persuaded Gaiseric not to burn the city, but the Vandals spent fourteen days stripping it systematically. They removed the gilded bronze roof tiles from the Temple of Jupiter on the Capitoline and carried off treasures from the Temple of Jerusalem that Titus had brought to Rome four centuries earlier. The word "vandalism" derives from this event.',
  lat: 41.8931,
  lng: 12.4828,
  type: 'disaster',
  importance: 'major',
  notability: 70,
  verificationLevel: 'documented',
  accuracy: 'approximate',
  kind: 'event',
  year: 455,
  date: '2 June 455 CE',
  address: 'Capitoline Hill, Rome, Italy',
  entityIds: [],
}
```

### 5. St. Peter's Basilica Cornerstone Laid (1506)

```typescript
{
  id: 'st-peters-cornerstone-laid-1506',
  name: 'Pope Julius II Lays the Cornerstone of the New St. Peter\'s Basilica',
  subtitle: 'St. Peter\'s Basilica, Vatican City. The basilica took 120 years to complete; open daily, free entry',
  description: 'On 18 April 1506, Pope Julius II descended into a trench here and laid the first stone of a new basilica to replace the crumbling 1,200-year-old church built by Constantine. Bramante\'s design called for a Greek cross plan; it would be changed by Raphael, Sangallo, and finally Michelangelo, who designed the dome at 71. The project took 120 years and consumed the wealth of the papacy. The sale of indulgences to fund it triggered Martin Luther\'s Reformation in 1517.',
  lat: 41.9022,
  lng: 12.4539,
  type: 'religious_site',
  importance: 'major',
  notability: 78,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1506,
  date: '18 April 1506',
  address: 'St. Peter\'s Basilica, Vatican City',
  entityIds: ['pope-julius-ii'],
}
```

### 6. Giordano Bruno Burned at the Stake (1600)

```typescript
{
  id: 'giordano-bruno-burned-campo-de-fiori-1600',
  name: 'The Inquisition Burns Giordano Bruno Alive for Claiming the Universe Is Infinite',
  subtitle: 'Campo de\' Fiori, Rome. A bronze statue of Bruno has stood at the center of the square since 1889',
  description: 'On 17 February 1600, the Dominican friar Giordano Bruno was led to the stake here in the Campo de\' Fiori after eight years of imprisonment and trial by the Roman Inquisition. He had proposed that stars were distant suns orbited by their own planets, rejected the Trinity, and refused to recant. When shown the crucifix before the flames were lit, he reportedly turned his face away. The square where he burned is now Rome\'s liveliest open-air market. His statue faces the Vatican.',
  lat: 41.8956,
  lng: 12.4722,
  type: 'crime_scene',
  importance: 'major',
  notability: 75,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1600,
  date: '17 February 1600',
  address: 'Campo de\' Fiori, Rome, Italy',
  entityIds: ['giordano-bruno'],
}
```

### 7. Bernini Completes the Baldacchino in St. Peter's (1633)

```typescript
{
  id: 'bernini-baldacchino-st-peters-1633',
  name: 'Bernini Erects a 29-Meter Bronze Canopy Inside St. Peter\'s Using Metal Stripped from the Pantheon',
  subtitle: 'St. Peter\'s Basilica, Vatican City. The baldacchino stands directly over the papal altar and Peter\'s tomb',
  description: 'Gian Lorenzo Bernini completed the baldacchino here inside St. Peter\'s in 1633, a bronze canopy standing 29 meters tall over the high altar. Pope Urban VIII had the bronze stripped from the Pantheon\'s ancient portico beams to cast it, provoking the Roman saying: "What the barbarians did not do, the Barberini did." Four twisted Solomonic columns support a canopy topped with a cross. It remains the largest bronze structure in the world.',
  lat: 41.9022,
  lng: 12.4536,
  type: 'religious_site',
  importance: 'major',
  notability: 73,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1633,
  date: '1633',
  address: 'St. Peter\'s Basilica, Vatican City',
  entityIds: ['bernini'],
}
```

### 8. Bernini Sculpts the Ecstasy of Saint Teresa (1652)

```typescript
{
  id: 'bernini-ecstasy-of-saint-teresa-1652',
  name: 'Bernini Sculpts the Ecstasy of Saint Teresa in a Chapel Lit by a Hidden Window',
  subtitle: 'Santa Maria della Vittoria, Via XX Settembre 17, Rome. The chapel is in the left transept; free entry',
  description: 'Bernini completed the Ecstasy of Saint Teresa here in the Cornaro Chapel around 1652, carving Teresa in a state of spiritual rapture as a smiling angel holds a golden arrow. He designed the entire chapel as a theater: the Cornaro family watches from marble opera boxes on either side, and a hidden window above floods the sculpture with natural light through gilded bronze rays. The openly sensual rendering of a saint\'s mystical experience scandalized and fascinated Rome in equal measure.',
  lat: 41.9044,
  lng: 12.4947,
  type: 'religious_site',
  importance: 'major',
  notability: 76,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1652,
  date: 'c. 1647-1652',
  address: 'Santa Maria della Vittoria, Via XX Settembre 17, Rome, Italy',
  entityIds: ['bernini'],
}
```

### 9. Bernini Designs the Colonnade of St. Peter's Square (1667)

```typescript
{
  id: 'bernini-colonnade-st-peters-1667',
  name: 'Bernini Completes the Colonnade That Makes St. Peter\'s Square the Arms of the Church',
  subtitle: 'St. Peter\'s Square, Vatican City. 284 columns and 140 statues; stand on the focal disc to see them align',
  description: 'Bernini completed the colonnade enclosing St. Peter\'s Square in 1667, deploying 284 Doric columns in four rows to form two sweeping arcs. He described the design as the arms of the Church reaching out to embrace the faithful. Two focal points in the piazza, marked by stone discs, are positioned so that standing on either one makes all four rows of columns align into a single row. The optical illusion was Bernini\'s signature trick: engineering awe through geometry.',
  lat: 41.9021,
  lng: 12.4567,
  type: 'landmark',
  importance: 'major',
  notability: 74,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1667,
  date: '1656-1667',
  address: 'St. Peter\'s Square, Vatican City',
  entityIds: ['bernini'],
}
```

### 10. Spanish Steps Completed (1725)

```typescript
{
  id: 'spanish-steps-completed-1725',
  name: 'Rome Completes the Spanish Steps After a 100-Year Dispute Between France and Spain',
  subtitle: 'Piazza di Spagna / Trinita dei Monti, Rome. 135 steps; sitting on them is now banned since 2019',
  description: 'The 135-step staircase connecting Piazza di Spagna to the Trinita dei Monti church was completed here in 1725, ending a century-long diplomatic fight. France owned the church at the top; Spain claimed the piazza at the bottom. French diplomat Etienne Gueffier left the money in 1660, but construction did not begin until 1723. Architect Francesco de Sanctis designed the curving travertine flights. Keats died in the house at the foot of the steps in 1821. Since 2019, sitting on the steps carries a fine.',
  lat: 41.9060,
  lng: 12.4828,
  type: 'landmark',
  importance: 'minor',
  notability: 68,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1725,
  date: '1725',
  address: 'Piazza di Spagna, Rome, Italy',
  entityIds: [],
}
```

### 11. Trevi Fountain Completed (1762)

```typescript
{
  id: 'trevi-fountain-completed-1762',
  name: 'Nicola Salvi Dies Before Seeing His Trevi Fountain Completed',
  subtitle: 'Piazza di Trevi, Rome. Coins thrown into the fountain collect roughly 3,000 euros daily, donated to Caritas',
  description: 'Architect Nicola Salvi won the commission for the Trevi Fountain in 1732 and spent the next 19 years building it against the rear wall of Palazzo Poli. He died in 1751, and Giuseppe Pannini completed it in 1762. At 26 meters high and 50 meters wide, it is the largest Baroque fountain in Rome. The central Neptune rides a shell chariot pulled by seahorses. Visitors throw roughly 3,000 euros into the water daily, collected each morning and donated to the Catholic charity Caritas.',
  lat: 41.9009,
  lng: 12.4833,
  type: 'landmark',
  importance: 'major',
  notability: 82,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1762,
  date: '1762',
  address: 'Piazza di Trevi, Rome, Italy',
  entityIds: [],
}
```

### 12. Keats Dies at the Foot of the Spanish Steps (1821)

```typescript
{
  id: 'keats-dies-spanish-steps-1821',
  name: 'John Keats Dies of Tuberculosis at 25 in a Room Overlooking the Spanish Steps',
  subtitle: 'Keats-Shelley House, Piazza di Spagna 26, Rome. Now a museum; the room where he died is preserved',
  description: 'The English poet John Keats died here at Piazza di Spagna 26 on 23 February 1821, in a small room overlooking the Spanish Steps. He had sailed to Rome five months earlier hoping the warm climate would cure his tuberculosis. His friend Joseph Severn nursed him through the final weeks. Keats asked that his tombstone read only "Here lies One whose Name was writ in Water." He was 25. The building is now the Keats-Shelley Memorial House, preserving the room exactly as it was.',
  lat: 41.9057,
  lng: 12.4825,
  type: 'residence',
  importance: 'minor',
  notability: 65,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'milestone',
  year: 1821,
  date: '23 February 1821',
  address: 'Piazza di Spagna 26, Rome, Italy',
  entityIds: [],
}
```

### 13. Roman Republic Defended by Garibaldi (1849)

```typescript
{
  id: 'roman-republic-1849-defense',
  name: 'Garibaldi Defends the Short-Lived Roman Republic Against French Troops on the Janiculum',
  subtitle: 'Janiculum Hill, Rome. The Garibaldi equestrian monument and panoramic terrace overlook the city',
  description: 'In June 1849, Giuseppe Garibaldi commanded the defense of the fledgling Roman Republic from the Janiculum Hill here as 30,000 French troops besieged the city to restore Pope Pius IX. The republic had been proclaimed in February after the Pope fled. Garibaldi\'s volunteers held the hill for a month before the French breached the walls on 30 June. Garibaldi fled Rome with 4,000 followers; his pregnant wife Anita died during the retreat. The republic lasted 142 days.',
  lat: 41.8890,
  lng: 12.4618,
  type: 'battlefield',
  importance: 'minor',
  notability: 60,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1849,
  date: 'June 1849',
  address: 'Janiculum Hill, Rome, Italy',
  entityIds: ['giuseppe-garibaldi'],
}
```

### 14. Italian Troops Breach the Porta Pia (1870)

```typescript
{
  id: 'italian-troops-breach-porta-pia-1870',
  name: 'Italian Troops Breach the Porta Pia and End 1,116 Years of Papal Rule Over Rome',
  subtitle: 'Porta Pia, Via XX Settembre, Rome. The gate still stands; the breach is on the adjacent wall section',
  description: 'On 20 September 1870, Italian Bersaglieri troops fired cannons at the Aurelian Walls here near the Porta Pia and breached them within hours. The papal garrison of 13,000 surrendered after token resistance. Pope Pius IX retreated to the Vatican and declared himself "prisoner of the Pope" -- a self-imposed exile that lasted 59 years until the Lateran Treaty in 1929. The breach ended over a millennium of papal temporal power and made Rome the capital of unified Italy.',
  lat: 41.9103,
  lng: 12.4981,
  type: 'battlefield',
  importance: 'major',
  notability: 72,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1870,
  date: '20 September 1870',
  address: 'Porta Pia, Via XX Settembre, Rome, Italy',
  entityIds: ['vittorio-emanuele-ii'],
}
```

### 15. Rome Proclaimed Capital of Italy (1871)

```typescript
{
  id: 'rome-proclaimed-capital-of-italy-1871',
  name: 'Rome Is Proclaimed the Capital of Unified Italy After 1,400 Years of Fragmentation',
  subtitle: 'Palazzo del Quirinale, Piazza del Quirinale, Rome. The Quirinal Palace is now the presidential residence',
  description: 'On 3 February 1871, the Italian parliament in Florence voted to transfer the capital to Rome. King Victor Emmanuel II moved into the Quirinal Palace here, which had served as the papal residence since the 16th century. For the first time since the fall of the Western Roman Empire in 476 CE, the Italian peninsula had a single capital. The city\'s population was just 200,000, a fraction of ancient Rome\'s million. Within decades, new neighborhoods would sprawl beyond the Aurelian Walls.',
  lat: 41.8993,
  lng: 12.4872,
  type: 'government',
  importance: 'major',
  notability: 70,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1871,
  date: '3 February 1871',
  address: 'Palazzo del Quirinale, Piazza del Quirinale, Rome, Italy',
  entityIds: ['vittorio-emanuele-ii'],
}
```

### 16. Vittoriano Monument Inaugurated (1911)

```typescript
{
  id: 'vittoriano-inaugurated-1911',
  name: 'Rome Inaugurates the Vittoriano, Demolishing a Medieval Neighborhood to Build It',
  subtitle: 'Piazza Venezia, Rome. The monument is free to enter; a glass elevator reaches the rooftop terrace',
  description: 'On 4 June 1911, King Victor Emmanuel III inaugurated the Vittoriano here in Piazza Venezia, a white marble monument to his grandfather and Italian unification. Construction required demolishing an entire medieval neighborhood on the Capitoline slope. Romans immediately hated it. They called it the "wedding cake," the "typewriter," and the "dentures." At 70 meters tall and 135 meters wide, it remains the most conspicuous and most debated building in Rome\'s skyline.',
  lat: 41.8946,
  lng: 12.4832,
  type: 'monument',
  importance: 'minor',
  notability: 65,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1911,
  date: '4 June 1911',
  address: 'Piazza Venezia, Rome, Italy',
  entityIds: [],
}
```

### 17. Nazis Round Up the Roman Ghetto (1943)

```typescript
{
  id: 'nazi-roundup-roman-ghetto-1943',
  name: 'The SS Rounds Up 1,024 Jews from the Roman Ghetto; 16 Return',
  subtitle: 'Via del Portico d\'Ottavia, Rome. Stumbling stones (Stolpersteine) and a memorial plaque mark the site',
  description: 'At dawn on 16 October 1943, SS troops sealed the streets around the ancient Jewish Ghetto here along the Via del Portico d\'Ottavia and arrested 1,024 men, women, and children. The community had lived in Rome continuously for over 2,000 years, making it the oldest Jewish settlement in Europe outside Israel. Two days later, the prisoners were loaded onto trains at Tiburtina station. They arrived at Auschwitz on 22 October. Sixteen survived. Brass Stolpersteine embedded in the cobblestones mark individual doorways.',
  lat: 41.8915,
  lng: 12.4778,
  type: 'crime_scene',
  importance: 'major',
  notability: 74,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1943,
  date: '16 October 1943',
  address: 'Via del Portico d\'Ottavia, Rome, Italy',
  entityIds: [],
}
```

### 18. Fosse Ardeatine Massacre (1944)

```typescript
{
  id: 'fosse-ardeatine-massacre-1944',
  name: 'The SS Executes 335 Civilians in the Ardeatine Caves in Reprisal for a Partisan Attack',
  subtitle: 'Fosse Ardeatine, Via Ardeatina 174, Rome. The caves are a national memorial; open daily, free entry',
  description: 'On 24 March 1944, SS troops led 335 Italian prisoners into the Ardeatine Caves here on the Via Ardeatina, south of Rome, and shot them in groups of five. The massacre was reprisal for a partisan bombing on Via Rasella that killed 33 German soldiers the previous day. SS commander Herbert Kappler ordered ten Italians killed for each German. The victims included 75 Jews, political prisoners, and random civilians pulled from Regina Coeli prison. The caves were sealed with explosives. They are now a national memorial.',
  lat: 41.8556,
  lng: 12.5106,
  type: 'crime_scene',
  importance: 'major',
  notability: 72,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1944,
  date: '24 March 1944',
  address: 'Via Ardeatina 174, Rome, Italy',
  entityIds: [],
}
```

### 19. Rome Liberated as First Axis Capital (1944)

```typescript
{
  id: 'rome-liberated-first-axis-capital-1944',
  name: 'The Allies Liberate Rome, the First Axis Capital to Fall',
  subtitle: 'Via Appia Nuova / Piazza Venezia area, Rome. Fifth Army troops entered from the south',
  description: 'On 4 June 1944, U.S. Fifth Army troops entered Rome from the south along the Via Appia Nuova, making it the first Axis capital to be liberated. The Germans had declared Rome an "open city" and withdrew northward without a fight. Romans flooded the streets to greet the Americans with flowers and wine. The liberation was front-page news for exactly one day: on 6 June, the D-Day landings in Normandy pushed Rome off every front page in the world.',
  lat: 41.8946,
  lng: 12.4832,
  type: 'political_event',
  importance: 'major',
  notability: 73,
  verificationLevel: 'verified',
  accuracy: 'approximate',
  kind: 'event',
  year: 1944,
  date: '4 June 1944',
  address: 'Piazza Venezia, Rome, Italy',
  entityIds: [],
}
```

### 20. Treaty of Rome Signs the European Community into Existence (1957)

```typescript
{
  id: 'treaty-of-rome-signs-european-community-1957',
  name: 'Six Nations Sign the Treaty of Rome, Creating the European Economic Community',
  subtitle: 'Palazzo dei Conservatori, Capitoline Museums, Piazza del Campidoglio, Rome. The Hall of the Horatii and Curiatii where they signed is open to museum visitors',
  description: 'On 25 March 1957, representatives of France, West Germany, Italy, Belgium, the Netherlands, and Luxembourg signed two treaties here in the Hall of the Horatii and Curiatii on the Capitoline Hill. The Treaties of Rome created the European Economic Community and Euratom, laying the foundation for what would become the European Union. The signing hall, designed by Michelangelo, features frescoes depicting ancient Rome. Twenty-seven nations now belong to the union born in this room.',
  lat: 41.8930,
  lng: 12.4830,
  type: 'political_event',
  importance: 'major',
  notability: 78,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1957,
  date: '25 March 1957',
  address: 'Palazzo dei Conservatori, Piazza del Campidoglio, Rome, Italy',
  entityIds: [],
}
```

### 21. Valentino Opens His First Atelier on Via Condotti (1959)

```typescript
{
  id: 'valentino-opens-atelier-via-condotti-1959',
  name: 'Valentino Opens His First Atelier on Rome\'s Via Condotti at Age 27',
  subtitle: 'Via Condotti, Rome. The street remains Rome\'s most exclusive shopping address',
  description: 'In 1959, the 27-year-old Valentino Garavani opened his first fashion house here on Via Condotti, one of Rome\'s most fashionable streets leading away from the Spanish Steps. Trained in Paris under Guy Laroche, he bet that Rome could rival Paris as a couture capital. Within four years, Jackie Kennedy ordered a white dress from him. His signature Valentino Red became the most recognizable color in Italian fashion. Rome\'s alta moda district along Via Condotti traces its identity to this atelier.',
  lat: 41.9055,
  lng: 12.4800,
  type: 'workplace',
  importance: 'minor',
  notability: 58,
  verificationLevel: 'verified',
  accuracy: 'approximate',
  kind: 'event',
  year: 1959,
  date: '1959',
  address: 'Via Condotti, Rome, Italy',
  entityIds: ['valentino-garavani'],
}
```

### 22. Fellini Films La Dolce Vita at the Trevi Fountain (1960)

```typescript
{
  id: 'fellini-films-la-dolce-vita-trevi-1960',
  name: 'Fellini Films Anita Ekberg Wading into the Trevi Fountain at 3 AM',
  subtitle: 'Trevi Fountain, Piazza di Trevi, Rome. The fountain scene was shot on location in the winter of 1959',
  description: 'During the winter of 1959, Federico Fellini filmed Anita Ekberg wading into the Trevi Fountain here at 3 AM for La Dolce Vita, while Marcello Mastroianni shivered in a suit beside her. Ekberg, reportedly unbothered by the cold, had to be dragged out between takes. The scene became the most iconic image in Italian cinema. La Dolce Vita premiered in February 1960 and gave the world the word "paparazzi," named after a photographer character. It won the Palme d\'Or at Cannes.',
  lat: 41.9009,
  lng: 12.4833,
  type: 'cultural_site',
  importance: 'major',
  notability: 77,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 1960,
  date: 'Winter 1959 (released February 1960)',
  address: 'Piazza di Trevi, Rome, Italy',
  entityIds: ['federico-fellini'],
}
```

### 23. Early Christians Bury Their Dead in the Catacombs (2nd-5th century)

```typescript
{
  id: 'catacombs-san-callisto-rome-200',
  name: 'Early Christians Begin Burying Their Dead in Underground Tunnels Along the Appian Way',
  subtitle: 'Catacombs of San Callisto, Via Appia Antica 110-126, Rome. Guided tours only; closed Wednesdays',
  description: 'Beginning in the 2nd century CE, Christians in Rome carved an underground network of tunnels here along the Via Appia Antica for burying their dead. The Catacombs of San Callisto eventually stretched across 20 kilometers of galleries on four levels, holding an estimated 500,000 burials. Sixteen popes from the 3rd century were interred in the Crypt of the Popes. The catacombs were rediscovered in 1849 after centuries of neglect. Visitors descend narrow stairs into cool, dimly lit corridors lined with stacked niches.',
  lat: 41.8558,
  lng: 12.5119,
  type: 'burial_site',
  importance: 'major',
  notability: 72,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'presence',
  year: 200,
  date: '2nd-5th century CE',
  address: 'Via Appia Antica 110-126, Rome, Italy',
  entityIds: [],
}
```

### 24. Castel Sant'Angelo Built as Hadrian's Mausoleum (139 CE)

```typescript
{
  id: 'hadrian-mausoleum-castel-santangelo-139',
  name: 'Hadrian\'s Mausoleum Is Completed, Later Becoming the Pope\'s Fortress and Prison',
  subtitle: 'Castel Sant\'Angelo, Lungotevere Castello 50, Rome. Museum open daily; rooftop has panoramic views',
  description: 'Emperor Hadrian began building his family tomb here on the right bank of the Tiber around 135 CE; it was completed after his death in 139 CE. The cylindrical structure, originally clad in white marble and topped with a bronze chariot, held the ashes of every emperor from Hadrian to Caracalla. In 590 CE, Pope Gregory I reportedly saw the Archangel Michael sheathing his sword atop the structure, signaling the end of a plague. It became Castel Sant\'Angelo, serving as papal fortress, prison, and escape route via the Passetto di Borgo.',
  lat: 41.9031,
  lng: 12.4663,
  type: 'burial_site',
  importance: 'major',
  notability: 76,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: 139,
  date: '135-139 CE',
  address: 'Lungotevere Castello 50, Rome, Italy',
  entityIds: ['hadrian'],
}
```

### 25. Augustus Builds the Ara Pacis to Mark the End of War (-9)

```typescript
{
  id: 'ara-pacis-consecrated-rome-9bc',
  name: 'The Senate Consecrates the Ara Pacis to Celebrate Augustus\'s Return from Gaul and Spain',
  subtitle: 'Museo dell\'Ara Pacis, Lungotevere in Augusta, Rome. The altar is inside a modern glass museum by Richard Meier',
  description: 'On 30 January 9 BC, the Senate consecrated the Ara Pacis Augustae here on the Campus Martius to mark the peace Augustus had established after campaigns in Gaul and Spain. The marble altar, carved with procession scenes showing Augustus, his family, and priests, was the most refined piece of Roman sculpture of its era. It was lost for centuries, buried under sediment. Fragments surfaced in the 16th century; systematic excavation in 1937-38 recovered enough to reassemble it. It now sits in a glass pavilion designed by Richard Meier.',
  lat: 41.9060,
  lng: 12.4745,
  type: 'monument',
  importance: 'minor',
  notability: 65,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: -9,
  date: '30 January 9 BC',
  address: 'Lungotevere in Augusta, Rome, Italy',
  entityIds: ['augustus'],
}
```

### 26. The Sack of Rome by the Gauls (-390)

```typescript
{
  id: 'gauls-sack-rome-390bc',
  name: 'Gallic Warriors Sack Rome and Only the Sacred Geese of Juno Save the Capitol',
  subtitle: 'Capitoline Hill, Rome. The hill is now home to the Capitoline Museums and Piazza del Campidoglio',
  description: 'Around 390 BC, a Gallic army under Brennus defeated the Roman army at the Battle of the Allia and swept into the undefended city. They sacked and burned Rome for months. According to tradition, when Gauls tried to climb the Capitoline Hill at night, the sacred geese of Juno\'s temple honked loud enough to wake the defenders. When Rome finally paid a ransom in gold, Brennus reportedly threw his sword on the scales and declared "Vae victis" -- woe to the vanquished. The trauma shaped Roman military policy for centuries.',
  lat: 41.8934,
  lng: 12.4828,
  type: 'battlefield',
  importance: 'major',
  notability: 68,
  verificationLevel: 'traditional',
  accuracy: 'approximate',
  kind: 'event',
  year: -390,
  date: 'c. 390 BC',
  address: 'Capitoline Hill, Rome, Italy',
  entityIds: [],
}
```

### 27. Augustus Transforms Rome from Brick to Marble

```typescript
{
  id: 'augustus-forum-dedicated-rome-2bc',
  name: 'Augustus Dedicates His Forum and Declares He Found Rome Brick and Left It Marble',
  subtitle: 'Forum of Augustus, Via dei Fori Imperiali, Rome. Ruins visible from the street; nighttime light show available',
  description: 'In 2 BC, Augustus dedicated his new forum here, forty years after vowing to build it before the Battle of Philippi. The Forum of Augustus featured a Temple of Mars Ultor flanked by colonnades displaying statues of great Romans. According to Suetonius, Augustus boasted he found Rome a city of brick and left it a city of marble. The forum was the second of what would become five imperial forums, each emperor outdoing the last. The Temple of Mars Ultor\'s three standing columns are visible from Via dei Fori Imperiali today.',
  lat: 41.8938,
  lng: 12.4870,
  type: 'landmark',
  importance: 'major',
  notability: 72,
  verificationLevel: 'verified',
  accuracy: 'exact',
  kind: 'event',
  year: -2,
  date: '2 BC',
  address: 'Via dei Fori Imperiali, Rome, Italy',
  entityIds: ['augustus'],
}
```

### 28. Galileo's Trial at the Palazzo del Sant'Uffizio (1633)

```typescript
{
  id: 'galileo-tried-by-inquisition-rome-1633',
  name: 'The Inquisition Forces Galileo to Recant That the Earth Moves Around the Sun',
  subtitle: 'Palazzo del Sant\'Uffizio (Holy Office), south of St. Peter\'s Square, Vatican City. The building still houses the Dicastery for the Doctrine of the Faith',
  description: 'On 22 June 1633, Galileo Galilei knelt before the Roman Inquisition here in the convent of Santa Maria sopra Minerva and read a prepared statement recanting heliocentrism. He was 69, nearly blind, and had been threatened with torture. The tribunal sentenced him to house arrest for life and banned his Dialogue. According to legend, he muttered "Eppur si muove" -- and yet it moves -- as he rose. The Vatican formally acknowledged the error in 1992, 359 years later.',
  lat: 41.9012,
  lng: 12.4580,
  type: 'political_event',
  importance: 'major',
  notability: 82,
  verificationLevel: 'documented',
  accuracy: 'approximate',
  kind: 'event',
  year: 1633,
  date: '22 June 1633',
  address: 'Convent of Santa Maria sopra Minerva / Palazzo del Sant\'Uffizio, Rome, Italy',
  entityIds: [],
}
```

**NOTE**: Galileo entity may exist or need creation. Check entities.ts for `galileo` before ingesting.

---

## Summary of Coverage

### Timeline distribution of ALL Rome moments (existing + new = 57):

| Era | Existing | New | Total |
|---|---|---|---|
| Legendary/Archaic (-753 to -509) | 1 | 1 | 2 |
| Republic (-509 to -27) | 7 | 1 | 8 |
| Empire (-27 to 476) | 10 | 6 | 16 |
| Medieval/Renaissance (476-1600) | 6 | 2 | 8 |
| Baroque (1600-1800) | 1 | 6 | 7 |
| Modern (1800-1945) | 2 | 7 | 9 |
| Contemporary (1945-present) | 0 | 3 | 3 |
| **Total** | **29** | **28** | **57** |

### Location distribution of new moments:

| Area | Count | Moments |
|---|---|---|
| Vatican/St. Peter's | 4 | Cornerstone, Baldacchino, Colonnade, Galileo trial |
| Roman Forum area | 2 | Gauls sack, Augustus Forum |
| Capitoline Hill | 2 | Vandals, Treaty of Rome |
| Via Appia / South | 2 | Catacombs, Fosse Ardeatine |
| Pantheon area | 1 | Hadrian rebuilds |
| Tiber banks | 2 | Milvian Bridge, Castel Sant'Angelo |
| Piazza di Spagna | 2 | Spanish Steps, Keats dies |
| Trevi Fountain | 2 | Fountain completed, Fellini films |
| Campo de' Fiori | 1 | Bruno burned |
| Piazza Venezia | 2 | Vittoriano, Liberation |
| Jewish Ghetto | 1 | Nazi roundup |
| Santa Maria della Vittoria | 1 | Bernini Ecstasy |
| Via Condotti | 1 | Valentino |
| Janiculum Hill | 1 | Garibaldi 1849 |
| Porta Pia | 1 | 1870 breach |
| Quirinal Palace | 1 | Capital proclaimed |
| Campus Martius | 1 | Ara Pacis |
| Arch of Titus | 1 | Arch erected |

### Existing entities reused:
- `augustus` (existing)
- `julius-caesar` (existing)
- `constantine-the-great` (existing -- verify)
- `hadrian` (new)
- `bernini` (new)
- `giuseppe-garibaldi` (new)
- `federico-fellini` (new)
- `pope-julius-ii` (new)
- `vittorio-emanuele-ii` (new)
- `giordano-bruno` (new)
- `valentino-garavani` (new)
- `cinecitta-studios` (new, place entity)

### Entities to verify before ingesting:
1. `constantine-the-great` -- appears to already exist in entities.ts
2. Check if `galileo` entity exists (for moment #28)
3. Need a `titus` or `domitian` entity for the Arch of Titus (moment #2) -- currently has Hadrian as placeholder

### Stories wiring:
- `rise-fall-rome` (existing) -- add new moments: `gauls-sack-rome-390bc`, `ara-pacis-consecrated-rome-9bc`, `arch-of-titus-erected-81`, `hadrian-rebuilds-pantheon-125`, `hadrian-mausoleum-castel-santangelo-139`, `constantine-milvian-bridge-312`, `vandals-sack-rome-455`, `augustus-forum-dedicated-rome-2bc`
- `baroque-rome` (new) -- 7 moments listed in story definition
- `italian-unification` (new) -- 4 moments listed in story definition
- `modern-rome` (new) -- 6 moments listed in story definition

### Missing from this draft (potential follow-up):
- Borgia family at the Vatican
- Cola di Rienzo's medieval republic
- Bramante and the Tempietto
- The opening of the Vatican Museums (1771)
- Rome's 1960 Summer Olympics (Bikila's barefoot marathon)
- EUR district (Mussolini's planned world fair)
- Pasolini's murder (1975)
- Studio di Mosaico at the Vatican
- Stendhal syndrome first described in Rome
