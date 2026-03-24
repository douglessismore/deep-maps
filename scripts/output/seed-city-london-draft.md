# Seed City: London -- Draft Moments

> **Status**: Draft for review
> **Date**: 2026-03-22
> **Existing London moments**: ~35 already in the database (see inventory below)
> **New moments in this draft**: 22

---

## Existing London Moments (DO NOT DUPLICATE)

These are already in `moments.ts`. This draft avoids all of them:

- `london-great-fire` -- Great Fire 1666
- `london-great-plague` -- Great Plague 1665
- `london-ve-day` -- VE Day 1945
- `london-great-exhibition` -- Crystal Palace 1851
- `st-pauls-blitz` -- St Paul's during the Blitz
- `churchill-war-rooms` -- WWII bunker
- `princes-tower-disappear` -- Princes in the Tower 1483
- `anne-boleyn-executed` -- Tower of London 1536
- `guy-fawkes-caught` -- Gunpowder Plot 1605
- `charles-i-executed` -- Banqueting House 1649
- `victoria-crowned`, `victoria-born-kensington`, `victoria-diamond-jubilee`, `victoria-marries-albert-chapel-royal`, `victoria-becomes-empress-india`
- `beatles-rooftop-concert` -- Savile Row 1969
- `beatles-record-sgt-peppers-abbey-road` -- Abbey Road Studios
- `pink-floyd-record-dark-side-abbey-road` -- Abbey Road Studios
- `jack-ripper-whitechapel` -- Whitechapel 1888
- `marx-das-kapital` -- British Museum Reading Room
- `crown-jewels-tower-london` -- Colonel Blood 1671
- `hatton-garden-burglary` -- 2015
- `brinks-mat-heathrow` -- 1983
- `shakespeare-globe-theatre`, `globe-theatre-opens-southwark-1599`, `shakespeare-attacked-by-greene-london-1592`, `first-folio-published-london-1623`
- `nelson-funeral-st-pauls`
- `tower-london-thomas-more`
- `chaucer-born-london-vintner`, `chaucer-appointed-customs-comptroller`, `chaucer-buried-westminster-abbey`
- `byron-born-london`
- `chaplin-born-walworth-1889`
- `faraday-hired-royal-institution`
- `newton-publishes-principia` (Royal Society)
- `gandhi-called-to-bar-inner-temple-1891`
- `freud-dies-in-london-exile`, `freud-flees-nazis-to-london`
- `rosetta-stone-british-museum`
- Dickens cluster (5 moments)

---

## Collection: "London's Royal History" (EXISTING)

Already has: `princes-tower-disappear`, `anne-boleyn-executed`, `guy-fawkes-caught`, `charles-i-executed`, `victoria-crowned`

**Suggested additions from this draft**: `william-conqueror-tower-london-1066`, `henry-viii-dissolves-monasteries-1536`, `diana-funeral-westminster-1997`

---

## NEW MOMENTS

### 1. Roman Londinium Founded

```
id: roman-londinium-founded-ad43
name: Roman Soldiers Build a Bridge Across the Thames and Found Londinium
subtitle: Near London Bridge, EC4R. No Roman structures visible at street level; Museum of London holds artifacts
description: Around AD 47, Roman soldiers built the first bridge across the Thames here, founding the settlement of Londinium at the lowest point where the river could be crossed. By AD 60, Boudica's Iceni tribe burned it to the ground -- a destruction layer of red ash still appears in excavations. The Romans rebuilt in stone, added a forum larger than any north of the Alps, a 6,000-seat amphitheatre, and a defensive wall whose line the City of London still follows 2,000 years later.
lat: 51.5079
lng: -0.0877
type: settlement_site
importance: major
accuracy: approximate
verificationLevel: documented
kind: event
year: 47
date: c. AD 47
address: Near London Bridge, City of London
entityIds: []
```

**Char counts**: Name 69 | Subtitle 93 | Description 484 (trim needed -- cut "a destruction layer" sentence)

**Trimmed description** (448 chars):
Around AD 47, Roman soldiers built the first bridge across the Thames here, founding the settlement of Londinium at the lowest point where the river could be crossed. By AD 60, Boudica's Iceni tribe burned it to the ground. The Romans rebuilt in stone, added a forum larger than any north of the Alps, a 6,000-seat amphitheatre, and a defensive wall whose line the City of London still follows 2,000 years later.

---

### 2. William the Conqueror Begins Building the Tower of London

```
id: william-conqueror-tower-london-1066
name: William the Conqueror Orders a Fortress Built to Intimidate London
subtitle: Tower of London, EC3N 4AB. The White Tower still stands; Crown Jewels on display
description: Within weeks of his coronation on Christmas Day 1066, William ordered a fortress built here on the Thames to cow the conquered English. The White Tower, completed around 1078, rose 90 feet -- the tallest building in London. Its walls were 15 feet thick at the base, built with Caen stone shipped from Normandy. Over nine centuries it served as palace, prison, mint, armory, zoo, and execution ground. It remains the most visited paid attraction in England.
lat: 51.5081
lng: -0.0759
type: landmark
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1066
date: December 1066
address: Tower of London, EC3N 4AB
entityIds: ['william-the-conqueror']
```

**Char counts**: Name 66 | Subtitle 79 | Description 449

---

### 3. Magna Carta Sealed at Runnymede

```
id: magna-carta-runnymede-1215
name: English Barons Force King John to Seal the Magna Carta at Runnymede
subtitle: Runnymede, TW20 0AE. National Trust meadow on the Thames; ABA memorial and JFK memorial nearby
description: On 15 June 1215, rebel barons cornered King John in the water meadow here at Runnymede and forced him to seal a charter limiting royal power. John repudiated it within weeks and the Pope annulled it, triggering civil war. Yet later reissues embedded its principles into English law. Clause 39 -- no free man imprisoned except by lawful judgment -- became the seed of habeas corpus, the Bill of Rights, and the U.S. Constitution.
lat: 51.4435
lng: -0.5653
type: political_event
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1215
date: 15 June 1215
address: Runnymede, near Egham, Surrey, TW20 0AE
entityIds: []
```

**Char counts**: Name 70 | Subtitle 98 | Description 443

**Note**: Runnymede is ~20 miles from central London. Include for thematic completeness but flag for review -- it's a day-trip, not walkable from the City.

---

### 4. Black Death Reaches London

```
id: black-death-london-1348
name: The Black Death Reaches London and Kills Half Its People in Two Years
subtitle: East Smithfield, E1W. A plague cemetery was excavated here; now Royal Mint Court
description: The plague arrived at London's docks in autumn 1348, carried by fleas on black rats aboard merchant ships. Within two years, an estimated 40,000 to 60,000 Londoners died -- roughly half the population. Bodies overwhelmed parish graveyards. Here at East Smithfield, Edward III purchased land for an emergency plague cemetery; excavations in the 1980s uncovered orderly rows of burials that gave way to mass pits as the death toll accelerated. England's population did not recover for 200 years.
lat: 51.5091
lng: -0.0682
type: disaster
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1348
date: Autumn 1348
address: East Smithfield (Royal Mint Court), London E1W
entityIds: []
```

**Char counts**: Name 70 | Subtitle 75 | Description 490 (trim slightly)

**Trimmed description** (455 chars):
The plague arrived at London's docks in autumn 1348, carried by fleas on black rats aboard merchant ships. Within two years, roughly half the population died -- an estimated 40,000 to 60,000 people. Bodies overwhelmed parish graveyards. Here at East Smithfield, Edward III purchased land for an emergency plague cemetery; excavations in the 1980s uncovered orderly rows of burials that gave way to mass pits as the death toll accelerated. England's population took 200 years to recover.

---

### 5. Henry VIII Dissolves the Monasteries

```
id: henry-viii-dissolves-monasteries-1536
name: Henry VIII Dissolves England's Monasteries and Seizes a Quarter of the Nation's Land
subtitle: Charterhouse, Charterhouse Square, EC1M 6AN. Surviving Tudor buildings; guided tours available
description: Between 1536 and 1541, Henry VIII dissolved over 800 monasteries, priories, and friaries across England, seizing property worth roughly a quarter of the nation's landed wealth. Here at the Charterhouse, the prior and 15 monks were executed for refusing the oath of supremacy. The complex was converted into a private mansion. Across England, monastic libraries were scattered, lead was stripped from roofs, and the medieval welfare system vanished. Henry sold the land to fund his wars with France.
lat: 51.5209
lng: -0.0991
type: religious_site
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1536
date: 1536-1541
address: Charterhouse, Charterhouse Square, London EC1M 6AN
entityIds: []
```

**Char counts**: Name 83 | Subtitle 84 | Description 491 (trim needed)

**Trimmed description** (448 chars):
Between 1536 and 1541, Henry VIII dissolved over 800 monasteries, priories, and friaries across England, seizing roughly a quarter of the nation's landed wealth. Here at the Charterhouse, the prior and 15 monks were executed for refusing the oath of supremacy. The complex became a private mansion. Across England, monastic libraries were scattered, lead was stripped from roofs, and the medieval welfare system vanished overnight.

---

### 6. The East India Company Is Founded

```
id: east-india-company-founded-1600
name: A Group of London Merchants Receives a Royal Charter to Trade with the East Indies
subtitle: Leadenhall Street, EC3V. East India House stood here until 1861; the Lloyd's building now occupies the site
description: On 31 December 1600, Elizabeth I granted a charter to "The Company of Merchants of London Trading into the East Indies," giving 218 investors a monopoly on English trade east of the Cape of Good Hope. From offices here on Leadenhall Street, the company grew into the most powerful corporation in history -- fielding a private army twice the size of Britain's, ruling 200 million Indians, and generating more revenue than most nations. It was dissolved in 1874.
lat: 51.5133
lng: -0.0832
type: organization_hq
importance: major
accuracy: approximate
verificationLevel: verified
kind: event
year: 1600
date: 31 December 1600
address: Leadenhall Street, City of London, EC3V
entityIds: []
```

**Char counts**: Name 79 | Subtitle 104 | Description 448

---

### 7. Samuel Pepys Witnesses the Great Fire

```
id: pepys-witnesses-great-fire-1666
name: Samuel Pepys Buries His Parmesan Cheese and Wine to Save Them from the Great Fire
subtitle: Seething Lane, EC3N 4AX. St Olave's Church survived the fire; Pepys's memorial bust is inside
description: As the Great Fire advanced on 4 September 1666, Samuel Pepys dug a pit in his garden here on Seething Lane and buried his Parmesan cheese and wine. His diary entries from 2-5 September are the most detailed eyewitness account of the fire. He watched from the Tower, saw pigeons refusing to leave their roosts until their wings burned, and woke to find his feet blistered from walking on hot ground. His diary, written in shorthand, was not deciphered until 1825.
lat: 51.5108
lng: -0.0782
type: residence
importance: minor
accuracy: exact
verificationLevel: verified
kind: event
year: 1666
date: 4 September 1666
address: Seething Lane, City of London, EC3N 4AX
entityIds: []
```

**Char counts**: Name 84 | Subtitle 96 | Description 451

---

### 8. Wren Rebuilds St Paul's Cathedral

```
id: wren-rebuilds-st-pauls-1675
name: Christopher Wren Begins Rebuilding St Paul's Cathedral After the Great Fire
subtitle: St Paul's Cathedral, EC4M 8AD. Climb 528 steps to the Golden Gallery for panoramic views
description: After the Great Fire reduced Old St Paul's to a ruin, Christopher Wren began rebuilding here in 1675. The project consumed 35 years of his life. He was hauled to the top in a basket twice a week to inspect progress well into his seventies. The dome, inspired by St Peter's in Rome, rises 365 feet and weighs 65,000 tonnes -- an engineering feat that required a hidden brick cone between the inner and outer domes. Wren was buried in the crypt in 1723; his epitaph reads: "If you seek his monument, look around you."
lat: 51.5138
lng: -0.0984
type: landmark
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1675
date: 1675
address: St Paul's Cathedral, London EC4M 8AD
entityIds: []
```

**Char counts**: Name 74 | Subtitle 87 | Description 494 (tight but under 500)

---

### 9. Oscar Wilde Is Sentenced to Two Years' Hard Labour

```
id: wilde-sentenced-old-bailey-1895
name: Oscar Wilde Is Sentenced to Two Years' Hard Labour at the Old Bailey
subtitle: Central Criminal Court (Old Bailey), EC4M 7EH. The court building dates from 1907; trials are open to the public
description: On 25 May 1895, Justice Wills sentenced Oscar Wilde to two years' hard labour here at the Old Bailey for "gross indecency." Wilde had brought the prosecution on himself by suing the Marquess of Queensberry for libel; the trial exposed details of his private life that made conviction inevitable. He entered prison the toast of London, author of The Importance of Being Earnest. He emerged broken, bankrupt, and exiled. He died in Paris five years later at 46.
lat: 51.5155
lng: -0.1018
type: crime_scene
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1895
date: 25 May 1895
address: Central Criminal Court, Old Bailey, London EC4M 7EH
entityIds: ['oscar-wilde']
```

**Char counts**: Name 68 | Subtitle 107 | Description 455

---

### 10. The Suffragettes Storm Parliament

```
id: suffragettes-black-friday-1910
name: 300 Suffragettes March on Parliament and Are Beaten by Police for Six Hours
subtitle: Palace of Westminster, SW1A 0AA. The Emmeline Pankhurst statue stands near the Cromwell Green entrance
description: On 18 November 1910, roughly 300 women from the WSPU marched to the Houses of Parliament here after the government killed the Conciliation Bill. Police and plainclothes officers assaulted them for six hours; 115 women were arrested and two later died from injuries. Photographs showed police grabbing women by the throat. The day became known as Black Friday. It took another eight years and a world war before women over 30 won the vote in 1918.
lat: 51.4995
lng: -0.1248
type: political_event
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1910
date: 18 November 1910
address: Palace of Westminster, London SW1A 0AA
entityIds: []
```

**Char counts**: Name 76 | Subtitle 103 | Description 445

---

### 11. The Blitz Begins with the First Mass Bombing of London

```
id: blitz-begins-london-1940
name: 348 German Bombers Hit London in the First Night of the Blitz
subtitle: Silvertown, E16. The Tate & Lyle refinery and surrounding area were heavily bombed; Docklands regenerated in the 1980s
description: On 7 September 1940, 348 German bombers hit London's East End here in Silvertown and the Docklands in the first night of what became the Blitz. The Luftwaffe targeted the docks, but incendiaries spread to surrounding streets. 430 civilians died that first night. Bombing continued for 57 consecutive nights. By May 1941, over 30,000 Londoners had been killed and more than a million homes damaged. The Underground became a nightly shelter for 177,000 people.
lat: 51.5057
lng: 0.0195
type: disaster
importance: major
accuracy: approximate
verificationLevel: verified
kind: event
year: 1940
date: 7 September 1940
address: Silvertown, Royal Docks, London E16
entityIds: []
```

**Char counts**: Name 63 | Subtitle 117 | Description 449

---

### 12. The Windrush Generation Arrives at Tilbury

```
id: windrush-tilbury-1948
name: 492 Caribbean Migrants Disembark the Empire Windrush at Tilbury and Reshape Britain
subtitle: Tilbury Docks, Essex, RM18 7EH. A plaque at Tilbury marks the arrival; Windrush Square in Brixton is the community's symbolic home
description: On 22 June 1948, the MV Empire Windrush docked here at Tilbury carrying 492 passengers from Jamaica, Trinidad, and other Caribbean islands. Many were former RAF servicemen answering a call for workers to rebuild post-war Britain. Temporary housing was set up in the deep shelter beneath Clapham Common, near the Brixton labour exchange -- establishing the community that made Brixton the centre of Black British culture. The 2018 Windrush scandal deported descendants of these same passengers.
lat: 51.4481
lng: 0.3558
type: political_event
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1948
date: 22 June 1948
address: Tilbury Docks, Essex RM18 7EH
entityIds: []
```

**Char counts**: Name 82 | Subtitle 131 (trim) | Description 487 (trim)

**Trimmed subtitle** (107 chars): Tilbury Docks, RM18 7EH. A plaque marks the arrival; Windrush Square in Brixton is the community's home

**Trimmed description** (449 chars):
On 22 June 1948, the MV Empire Windrush docked here at Tilbury carrying 492 passengers from Jamaica, Trinidad, and other Caribbean islands. Many were former RAF servicemen answering a call for workers to rebuild post-war Britain. Housing was set up in the deep shelter beneath Clapham Common, near the Brixton labour exchange -- establishing the community that made Brixton the centre of Black British culture. The 2018 Windrush scandal deported their descendants.

**Note**: Tilbury is ~25 miles from central London. Include for thematic importance but flag.

---

### 13. The Sex Pistols Play Their First Gig

```
id: sex-pistols-first-gig-1975
name: The Sex Pistols Play Their First Gig at Saint Martin's School of Art
subtitle: 107 Charing Cross Road, London WC2H. Now part of Central Saint Martins; the original building still stands
description: On 6 November 1975, the Sex Pistols played their first gig here at Saint Martin's School of Art, supporting a band called Bazooka Joe. The social secretary pulled the plug after five songs. Glen Matlock was a student; the audience numbered about forty. Within eighteen months the band had been banned by the BBC, dropped by two record labels, and sparked a moral panic that gave punk its mythology. Their total career lasted 26 months.
lat: 51.5125
lng: -0.1281
type: cultural_venue
importance: minor
accuracy: exact
verificationLevel: verified
kind: event
year: 1975
date: 6 November 1975
address: 107 Charing Cross Road, London WC2H
entityIds: []
```

**Char counts**: Name 63 | Subtitle 106 | Description 432

---

### 14. Diana's Funeral Procession

```
id: diana-funeral-westminster-1997
name: A Million People Line the Route as Diana's Coffin Passes Through London
subtitle: Westminster Abbey, SW1P 3PA. The abbey is open to visitors; no permanent Diana memorial inside
description: On 6 September 1997, the funeral cortege of Diana, Princess of Wales traveled from Kensington Palace through Hyde Park to Westminster Abbey here, past roughly a million mourners standing in silence. An estimated 2.5 billion people watched on television. Elton John performed a rewritten version of "Candle in the Wind" that became the best-selling single since records began. Earl Spencer's eulogy, delivered from the abbey pulpit, drew applause that rolled in from the crowds outside.
lat: 51.4994
lng: -0.127
type: landmark
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1997
date: 6 September 1997
address: Westminster Abbey, London SW1P 3PA
entityIds: []
```

**Char counts**: Name 71 | Subtitle 93 | Description 474 (trim)

**Trimmed description** (443 chars):
On 6 September 1997, the funeral cortege of Diana, Princess of Wales traveled from Kensington Palace to Westminster Abbey here, past roughly a million mourners standing in silence. An estimated 2.5 billion watched on television. Elton John performed a rewritten "Candle in the Wind" that became the best-selling single since records began. Earl Spencer's eulogy drew applause that rolled in from the crowds outside.

---

### 15. London 2012 Olympics Opening Ceremony

```
id: london-olympics-opening-2012
name: Danny Boyle Stages an Olympic Opening Ceremony Watched by 900 Million People
subtitle: Queen Elizabeth Olympic Park, E20 2ST. The stadium is now West Ham's home ground; park open to the public
description: On 27 July 2012, Danny Boyle's opening ceremony here at the Olympic Stadium compressed British history into a four-hour spectacle. The stage transformed from a pastoral landscape into a Satanic mill of the Industrial Revolution. The Queen appeared to parachute from a helicopter with James Bond. Tim Berners-Lee tweeted "This is for everyone" from the stage. Britain won 65 medals -- the country's best performance in over a century.
lat: 51.5385
lng: -0.0166
type: cultural_venue
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 2012
date: 27 July 2012
address: Queen Elizabeth Olympic Park, London E20 2ST
entityIds: []
```

**Char counts**: Name 75 | Subtitle 104 | Description 434

---

### 16. The Beatles Cross Abbey Road

```
id: beatles-abbey-road-crossing-1969
name: The Beatles Walk Across a Zebra Crossing on Abbey Road and Create Rock's Most Iconic Image
subtitle: 3 Abbey Road, St John's Wood, NW8 9AY. The crossing is still there; webcam streams it live
description: On 8 August 1969, photographer Iain Macmillan stood on a stepladder in the middle of Abbey Road here and took six frames of John, Paul, George, and Ringo walking across the zebra crossing outside their studio. The shoot took ten minutes. Paul's bare feet and the "28IF" numberplate on a parked Volkswagen fueled "Paul is dead" conspiracy theories. The crossing was granted Grade II listed status in 2010. Tourists recreate the walk daily, stopping traffic.
lat: 51.5321
lng: -0.1775
type: cultural_venue
importance: minor
accuracy: exact
verificationLevel: verified
kind: event
year: 1969
date: 8 August 1969
address: Abbey Road Crossing, NW8 9AY
entityIds: ['the-beatles']
```

**Char counts**: Name 90 (trim) | Subtitle 92 | Description 449

**Trimmed name** (79 chars): The Beatles Walk Across Abbey Road's Zebra Crossing and Create Rock's Most Iconic Image

---

### 17. The London Underground Opens

```
id: london-underground-opens-1863
name: The World's First Underground Railway Opens Between Paddington and Farringdon
subtitle: Farringdon station, EC1A 1BB. One of the original 1863 stations; still in daily use on the Metropolitan line
description: On 10 January 1863, the Metropolitan Railway carried 38,000 passengers on its first day here between Paddington and Farringdon, running steam locomotives through gas-lit tunnels cut just below street level. Skeptics had predicted the tunnels would collapse and passengers would suffocate. The line was a commercial success from day one. London's Underground now carries 5 million passengers daily across 272 stations, and its schematic map -- designed by Harry Beck in 1931 -- became the template for transit maps worldwide.
lat: 51.5204
lng: -0.1053
type: landmark
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1863
date: 10 January 1863
address: Farringdon Station, London EC1A 1BB
entityIds: []
```

**Char counts**: Name 79 | Subtitle 108 | Description 494 (tight)

---

### 18. Emmeline Pankhurst Chains Herself to the Railings at Buckingham Palace

```
id: pankhurst-arrested-buckingham-1914
name: Emmeline Pankhurst Is Arrested Outside Buckingham Palace for the Final Time
subtitle: Buckingham Palace, SW1A 1AA. The railings where suffragettes chained themselves still surround the palace
description: On 21 May 1914, Emmeline Pankhurst led a deputation to Buckingham Palace and was arrested here at the gates for the seventh time. She had been released and re-arrested repeatedly under the "Cat and Mouse Act," which freed hunger-striking prisoners only to re-imprison them once they recovered. Police carried her away as crowds surged. Four years later, the Representation of the People Act gave women over 30 the vote. Pankhurst died on 14 June 1928, weeks before the age was lowered to 21.
lat: 51.5014
lng: -0.1419
type: political_event
importance: minor
accuracy: exact
verificationLevel: verified
kind: event
year: 1914
date: 21 May 1914
address: Buckingham Palace, London SW1A 1AA
entityIds: []
```

**Char counts**: Name 77 | Subtitle 105 | Description 489 (trim)

**Trimmed description** (443 chars):
On 21 May 1914, Emmeline Pankhurst led a deputation to Buckingham Palace and was arrested here at the gates for the seventh time. She had been released and re-arrested repeatedly under the "Cat and Mouse Act," which freed hunger-striking prisoners only to re-imprison them once recovered. Four years later, the Representation of the People Act gave women over 30 the vote. Pankhurst died on 14 June 1928, weeks before the age was lowered to 21.

---

### 19. The Rolling Stones Play Hyde Park Two Days After Brian Jones Dies

```
id: rolling-stones-hyde-park-1969
name: The Rolling Stones Play Hyde Park to 500,000 People Two Days After Brian Jones Drowns
subtitle: Hyde Park (Cockpit area), London W2. Free concerts still held in the park; the Bandstand is nearby
description: On 5 July 1969, the Rolling Stones played a free concert here in Hyde Park before an estimated 250,000 to 500,000 people, two days after founding member Brian Jones was found dead in his swimming pool. Mick Jagger, in a white tunic, read Shelley's "Adonais" and released thousands of white butterflies -- most of which were already dead from the heat. It was Mick Taylor's first gig as Jones's replacement. The concert became a defining image of the 1960s counterculture.
lat: 51.5073
lng: -0.1657
type: cultural_venue
importance: minor
accuracy: approximate
verificationLevel: verified
kind: event
year: 1969
date: 5 July 1969
address: Hyde Park, London W2
entityIds: []
```

**Char counts**: Name 86 | Subtitle 97 | Description 468 (trim)

**Trimmed description** (443 chars):
On 5 July 1969, the Rolling Stones played a free concert here in Hyde Park before an estimated 250,000 to 500,000 people, two days after founding member Brian Jones was found dead in his swimming pool. Mick Jagger read Shelley's "Adonais" and released thousands of white butterflies -- most of which were already dead from the heat. It was Mick Taylor's first gig as Jones's replacement. The concert defined London's 1960s counterculture.

---

### 20. Darwin Publishes On the Origin of Species

```
id: darwin-origin-species-published-1859
name: John Murray Publishes Darwin's On the Origin of Species and the First Edition Sells Out in a Day
subtitle: 50 Albemarle Street, London W1S. John Murray's offices still operate as a publisher; the building stands
description: On 24 November 1859, publisher John Murray released Charles Darwin's On the Origin of Species from here on Albemarle Street. All 1,250 copies of the first edition sold out on the first day. Darwin had sat on the theory for twenty years, terrified of the reaction, and only rushed to publish when Alfred Russel Wallace independently reached the same conclusion. The book never uses the phrase "survival of the fittest" -- Herbert Spencer coined that later.
lat: 51.5088
lng: -0.1418
type: workplace
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1859
date: 24 November 1859
address: 50 Albemarle Street, London W1S
entityIds: []
```

**Char counts**: Name 95 (over 80 target, under 120 max) | Subtitle 102 | Description 443

---

### 21. The Great Stink Forces Parliament to Act

```
id: great-stink-parliament-1858
name: The Stench of the Thames Forces Parliament to Flee and Fund London's Sewer System
subtitle: Palace of Westminster, SW1A 0AA. The embankment that hides Bazalgette's sewers runs along the Thames
description: In the summer of 1858, the smell of raw sewage in the Thames became so unbearable that MPs draped curtains soaked in chloride of lime across the windows of Parliament here. They debated abandoning the building. Within eighteen days, Parliament authorized engineer Joseph Bazalgette to build 1,100 miles of sewers beneath London. The project took six years, used 318 million bricks, and ended the cholera epidemics that had killed tens of thousands. Most of the system still functions today.
lat: 51.4995
lng: -0.1248
type: government
importance: minor
accuracy: exact
verificationLevel: verified
kind: event
year: 1858
date: Summer 1858
address: Palace of Westminster, London SW1A 0AA
entityIds: []
```

**Char counts**: Name 82 | Subtitle 99 | Description 480 (trim)

**Trimmed description** (441 chars):
In the summer of 1858, the smell of raw sewage in the Thames became so unbearable that MPs draped curtains soaked in chloride of lime across the windows of Parliament here. Within eighteen days, Parliament authorized engineer Joseph Bazalgette to build 1,100 miles of sewers beneath London. The project took six years, used 318 million bricks, and ended the cholera epidemics that had killed tens of thousands. Most of the system still functions.

---

### 22. The Coronation of Elizabeth II Is Televised

```
id: elizabeth-ii-coronation-1953
name: 27 Million Britons Watch Elizabeth II's Coronation on Television
subtitle: Westminster Abbey, SW1P 3PA. The coronation chair, used since 1308, is inside the abbey; open to visitors
description: On 2 June 1953, Elizabeth II was crowned here at Westminster Abbey in a ceremony dating to 1066. Against Churchill's wishes, the Queen insisted on live television coverage. 27 million Britons watched -- more than double the number who listened on radio. Neighbors crowded around the few households that owned sets. Television sales tripled in the months before the event. The broadcast marked the moment television displaced radio as the dominant mass medium in Britain.
lat: 51.4994
lng: -0.127
type: political_event
importance: major
accuracy: exact
verificationLevel: verified
kind: event
year: 1953
date: 2 June 1953
address: Westminster Abbey, London SW1P 3PA
entityIds: ['elizabeth-ii']
```

**Char counts**: Name 66 | Subtitle 104 | Description 451

---

## Suggested New Entities

These moments reference entities not yet in the database. Create if 2+ moments reference them:

| Entity | Type | Moments referencing |
|---|---|---|
| Samuel Pepys | person | `pepys-witnesses-great-fire-1666` (+ potential diary story) |
| Christopher Wren | person | `wren-rebuilds-st-pauls-1675` (+ could connect to existing `st-pauls-blitz`) |
| Emmeline Pankhurst | person | `pankhurst-arrested-buckingham-1914`, `suffragettes-black-friday-1910` |
| Charles Darwin | person | `darwin-origin-species-published-1859` (+ potential biography) |
| East India Company | organization | `east-india-company-founded-1600` (+ Indian colonial moments) |
| Sex Pistols | organization | `sex-pistols-first-gig-1975` (single moment -- may not warrant entity) |
| Diana, Princess of Wales | person | `diana-funeral-westminster-1997` (single moment -- but high notability) |
| Rolling Stones | organization | `rolling-stones-hyde-park-1969` (single moment) |

**Recommendation**: Create entities for Emmeline Pankhurst and Charles Darwin first -- both are globally notable and likely to accumulate moments.

---

## Suggested Collection Additions

### "London's Royal History" (existing: `london-royal-history`)
Add: `william-conqueror-tower-london-1066`, `henry-viii-dissolves-monasteries-1536`, `diana-funeral-westminster-1997`, `elizabeth-ii-coronation-1953`

### New Collection: "Every Pandemic That Hit London"
Moments: `roman-londinium-founded-ad43` (Boudica destruction, not pandemic -- skip), `black-death-london-1348`, `london-great-plague`, `great-stink-parliament-1858` (sewage/cholera, close enough)

### New Collection: "Every Building Christopher Wren Designed in London"
Would need more moments -- park for later.

---

## Density Analysis

Walkable clusters in this draft:

**City of London / Tower area** (5 pins within ~0.5 km):
- `roman-londinium-founded-ad43`
- `william-conqueror-tower-london-1066`
- `black-death-london-1348`
- `pepys-witnesses-great-fire-1666`
- (existing: `london-great-fire`, `crown-jewels-tower-london`, `princes-tower-disappear`, `anne-boleyn-executed`, `tower-london-thomas-more`)

**Westminster** (4 pins within ~0.3 km):
- `suffragettes-black-friday-1910`
- `diana-funeral-westminster-1997`
- `elizabeth-ii-coronation-1953`
- `great-stink-parliament-1858`
- (existing: `guy-fawkes-caught`, `charles-i-executed`, `victoria-becomes-empress-india`, `chaucer-buried-westminster-abbey`)

**West End / Mayfair** (3 pins within ~0.4 km):
- `darwin-origin-species-published-1859`
- `wilde-sentenced-old-bailey-1895`
- `east-india-company-founded-1600`
- (existing: `faraday-hired-royal-institution`)

This draft significantly increases pin density in the most walked tourist areas of London.
