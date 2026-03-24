# Entity Link Audit: Moment-Person Physical Presence

**Date:** 2026-03-22
**Rule:** A person entity should only be linked to a moment if that person was physically present at that location during that moment.

---

## 1. FALSE LINKS TO REMOVE

### Pattern A: "Great" in moment name/ID triggers Constantine the Great (18 false positives)

The entity `constantine-the-great` is linked to every moment containing "Great" in its name or ID, regardless of whether Constantine (272-337 AD) was physically present. None of the following are legitimate links.

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 1 | `chaplin-great-dictator-released-1940` | Chaplin Releases The Great Dictator | "Great" in title. 1940 film premiere. |
| 2 | `london-great-fire` | A Baker's Fire Destroys London | "Great" in title. 1666 event. |
| 3 | `peter-great-founds-petersburg` | Peter the Great Founds St. Petersburg | "Great" in title. 1703 event. |
| 4 | `evo-meishan-great-dying` | 96% of Marine Species Vanish (Permian extinction) | "Great" in title. 251 million years ago. |
| 5 | `london-great-plague` | The Great Plague Kills a Quarter of London | "Great" in title. 1665 event. |
| 6 | `london-great-exhibition` | Crystal Palace Great Exhibition | "Great" in title. 1851 event. |
| 7 | `nero-great-fire-rome` | Rome Burns for Six Days | "Great" in title. 64 AD, before Constantine was born. |
| 8 | `great-fire-meireki` | Great Fire of Meireki Destroys Edo | "Great" in title. 1657 event in Japan. |
| 9 | `great-kanto-earthquake` | Great Kanto Earthquake Levels Tokyo | "Great" in title. 1923 event. |
| 10 | `stalin-great-purge-executions-1936-1938` | Stalin's Great Purge | "Great" in title. 1936-1938 event. |
| 11 | `fitzgerald-writes-great-gatsby-great-neck` | F. Scott Fitzgerald Drafts The Great Gatsby | "Great" in title. 1922 event. |
| 12 | `great-train-robbery-bridego` | Gang Stops the Glasgow-to-London Mail Train | "Great" in title. 1963 event. |
| 13 | `great-train-robbery-cheddington` | Great Train Robbery Gang Retreats to Leatherslade Farm | "Great" in title. 1963 event. |
| 14 | `great-zimbabwe-peak` | Shona Builders Raise a Stone Enclosure | "Great" in title. 1100-1450 CE event in Zimbabwe. |
| 15 | `peter-great-captures-azov` | Peter the Great Captures Azov | "Great" in title. 1696 event. |
| 16 | `peter-great-dies-winter-palace` | Peter the Great Dies | "Great" in title. 1725 event. |
| 17 | `peter-great-born-moscow` | Peter the Great Is Born | "Great" in title. 1672 event. |
| 18 | `peter-great-works-dutch-shipyard` | Peter the Great Works in Dutch Shipyard | "Great" in title. 1697 event. |

### Pattern B: "Emperor" in moment triggers Charles V, Holy Roman Emperor (8 false positives)

The entity `charles-v-holy-roman-emperor` (1500-1558) is linked to unrelated moments about other emperors.

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 19 | `emperor-wu-han-confucianism-official` | Emperor Wu of Han Makes Confucianism Mandatory | 136 BCE. Wrong emperor, wrong millennium. |
| 20 | `caligula-becomes-emperor-misenum` | Caligula Is Hailed Emperor at Misenum | 37 AD. Charles V not born for 1,463 years. |
| 21 | `charlemagne-crowned-emperor-rome` | Charlemagne Crowned Emperor on Christmas Day | 800 AD. Wrong emperor. |
| 22 | `emperor-meiji-moves-tokyo` | Emperor Meiji Enters Edo Castle | 1868. Wrong emperor, wrong continent. |
| 23 | `constantine-proclaimed-emperor-at-york` | Constantine Proclaimed Emperor at York | 306 AD. Wrong emperor. |
| 24 | `nero-becomes-emperor-age-16` | Nero Becomes Emperor at Sixteen | 54 AD. Wrong emperor. |
| 25 | `tiberius-becomes-emperor-after-augustus-dies` | Tiberius Becomes Emperor | 14 AD. Wrong emperor. |
| 26 | `marcus-aurelius-becomes-emperor` | Marcus Aurelius Becomes Emperor | 161 AD. Wrong emperor. |

### Pattern C: "Jordan" in moment triggers Barbara Jordan (4 false positives)

The entity `barbara-jordan` (Texas politician, 1936-1996) is linked to moments containing "Jordan" as a geographic name or surname.

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 27 | `jordan-river-baptism` | John the Baptist Baptizes Jesus in the Jordan River | Jordan River, not Barbara Jordan. Biblical event. |
| 28 | `john-the-baptist-preaches-repentance-in-jordan-wilderness` | John the Baptist Draws Crowds to the Jordan River | Jordan River geographic match. |
| 29 | `jordan-last-shot-delta-center-1998` | Michael Jordan Hits a Jumper to Win His Sixth Title | Michael Jordan surname match. 1998. |
| 30 | `john-baptizes-jesus-in-the-jordan-river` | John the Baptist Baptizes Jesus | Jordan River geographic match. |

### Pattern D: "White" in moment triggers Jim White (4 false positives)

The entity `jim-white` (Carlsbad Caverns discoverer, 1882-1946) is linked to moments containing "White" as a surname, place name, or building name.

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 31 | `white-sands-prints` | 23,000-Year-Old Footprints at White Sands | "White" Sands place name. 23,000 years ago. |
| 32 | `menger-sallie-white` | Chambermaid Sallie White Shot Dead | Sallie White surname match. 1876 event. |
| 33 | `adams-first-president-white-house` | John Adams Moves into the White House | "White" House building name. 1800 event. |
| 34 | `btw-white-house-dinner` | Booker T. Washington Dines at the White House | "White" House building name. 1901 event. |

### Pattern E: "Smith" in moment triggers Adam Smith (3 false positives)

The entity `adam-smith` (economist, 1723-1790) is linked to moments containing "Smith" as a surname or street name.

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 35 | `annihilator-mollie-smith` | Mollie Smith Is Murdered in Her Bed | Mollie Smith surname. 1884 Austin murder. |
| 36 | `twa-smith-point` | 230 Names Carved in Granite (TWA 800 memorial) | Smith Point place name. 1996 memorial. |
| 37 | `enron-smith-street` | Enron Traders Orchestrate Power Outages | Smith Street address in Houston. 2000-2001. |

### Pattern F: "Nelson" in moment triggers Willie Nelson (2 false positives)

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 38 | `nelson-funeral-st-pauls` | Lord Nelson's Funeral at St. Paul's | Horatio Nelson surname match. 1806 event. |
| 39 | `trafalgar-nelson` | Admiral Nelson Destroys Napoleon's Fleet | Horatio Nelson surname match. 1805 event. |

### Pattern G: "Henry" in moment triggers O. Henry (1 false positive)

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 40 | `goat-henry-statue` | Clay Henry III Castration Triggers Legal Scandal | Clay Henry goat name match. 2002. |

### Pattern H: "Austin" in moment triggers Stephen F. Austin (2 false positives)

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 41 | `ohenry-austin-jail` | William Sydney Porter Is Detained in Austin | Austin city name. 1898. Stephen F. Austin died 1836. |
| 42 | `willie-nelson-records-arlyn-austin` | Willie Nelson Records at Arlyn Studios | Austin city name in venue name. |

### Pattern I: "Strait" in moment triggers George Strait (1 false positive)

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 43 | `magellan-discovers-strait-patagonia` | Magellan Discovers the Strait | "Strait" of Magellan geographic feature. 1520 event. |

### Pattern J: "Garrett" in moment triggers Pat Garrett (1 false positive)

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 44 | `la-garrett-farm` | Booth Is Shot and Killed in a Burning Tobacco Barn | Richard Garrett's farm, not Pat Garrett. 1865 event. |

### Pattern K: "Columbus" in moment triggers Christopher Columbus (1 false positive)

| # | Moment ID | Moment Name | Reason |
|---|-----------|-------------|--------|
| 45 | `columbus-raid` | Pancho Villa Invades Columbus, New Mexico | Columbus, NM town name. 1916 event. Columbus died 1506. |

### Pattern L: Surname match across unrelated people (4 false positives)

| # | Moment ID | Moment Name | Entity (false link) | Reason |
|---|-----------|-------------|---------------------|--------|
| 46 | `indira-gandhi-assassinated` | Indira Gandhi Is Assassinated | `mahatma-gandhi` | Same surname, different person. Mahatma Gandhi died 1948; Indira assassinated 1984. |
| 47 | `frida-kahlo-marries-diego-rivera` | Frida Kahlo Marries Diego Rivera in Coyoacan | `juan-diego` | "Diego" name match. Juan Diego died 1548; wedding was 1929. |
| 48 | `great-fire-meireki` | Great Fire of Meireki Destroys Edo | `tokugawa-ieyasu` | Tokugawa name match on Edo period. Ieyasu died 1616; fire was 1657. |
| 49 | `reagan-assassination-attempt-washington` | Reagan Is Shot Outside the Washington Hilton | `george-washington` | "Washington" in hotel name. George Washington died 1799. |

### Pattern M: Strategic involvement but not physical presence (4 false positives)

| # | Moment ID | Moment Name | Entity (false link) | Reason |
|---|-----------|-------------|---------------------|--------|
| 50 | `normandy-dday` | Allied Forces Storm the Beaches of Normandy | `winston-churchill` | Churchill was PM in London, not on the beaches. |
| 51 | `gallipoli-anzac` | Allied Forces Land at Gallipoli | `winston-churchill` | Churchill was First Lord of the Admiralty in London, not at Gallipoli. |
| 52 | `einstein-signs-roosevelt-letter-1939` | Einstein Signs a Letter Urging Roosevelt to Build the Bomb | `franklin-d-roosevelt` | FDR was not at Nassau Point, Long Island. Einstein signed the letter there; FDR received it later in Washington. |
| 53 | `allies-liberate-rome` | Allied Forces Liberate Rome | `mussolini` | Mussolini was running the Salo Republic in northern Italy, not in Rome. |

---

## 2. SUSPICIOUS LINKS NEEDING REVIEW

| # | Moment ID | Entity | Concern |
|---|-----------|--------|---------|
| 1 | `jfk-parkland` | `lee-harvey-oswald` | Oswald was brought to Parkland 2 days later (after being shot by Ruby), not when JFK was pronounced dead. The description mentions this. Physical presence at the location: yes, but at a different moment in time. |
| 2 | `jfk-parkland` | `jack-ruby` | Ruby shot Oswald at the police station; he was never at Parkland. More clearly a false positive than Oswald. |
| 3 | `may-68-barricades` | `charles-de-gaulle` | De Gaulle was president of France during May 68 and was in Paris (then fled to Germany). He was not at the Sorbonne/Latin Quarter barricades. He was involved in the event but not at the specific location described. |
| 4 | `columbus-raid` | `john-pershing` | Pershing led the Punitive Expedition from Columbus AFTER the Villa raid. He was not present during the dawn attack, but arrived shortly after. |
| 5 | `mlk-dexter-church` | `rosa-parks` | Parks was part of the Montgomery community and her arrest sparked the boycott organized at this church. She likely attended meetings there, but the moment focuses on King's pastorate. |
| 6 | `adel-gruene-hall` | `george-strait` | Strait has played Gruene Hall, but the moment describes the hall's 1878 founding and general history, not a specific Strait performance. Reasonable if he performed there. |
| 7 | `adel-gruene-hall` | `willie-nelson` | Same as above -- Nelson has played there, but the moment is about the hall's full history. |

---

## 3. MISSING LINKS

### Constantine the Great missing from his own moments

The entity `constantine-the-great` is NOT linked to 5 moments where Constantine was indisputably physically present, while being falsely linked to 18 unrelated "Great" moments.

| # | Moment ID | Moment Name | Missing Entity |
|---|-----------|-------------|---------------|
| 1 | `constantine-convenes-council-of-nicaea` | Constantine Convenes 318 Bishops at Nicaea | `constantine-the-great` (he presided over the council) |
| 2 | `constantine-baptized-and-dies-at-nicomedia` | Constantine Is Baptized on His Deathbed | `constantine-the-great` (he was baptized and died there) |
| 3 | `constantine-born-in-naissus` | Constantine Is Born in Naissus | `constantine-the-great` (his birth) |
| 4 | `constantine-issues-edict-of-milan` | Constantine Issues the Edict of Milan | `constantine-the-great` (he issued the edict) |
| 5 | `constantine-founds-constantinople` | Constantine Dedicates Constantinople | `constantine-the-great` (he founded the city) |

### Constantine the Great missing from a moment that DOES link to Charles V instead

| # | Moment ID | Moment Name | Missing Entity | Has Wrong Entity |
|---|-----------|-------------|---------------|-----------------|
| 6 | `constantine-proclaimed-emperor-at-york` | Roman Troops Proclaim Constantine Emperor | `constantine-the-great` | Has `charles-v-holy-roman-emperor` instead |

---

## 4. STATS

| Metric | Count |
|--------|-------|
| Total moment-person entity links audited | 882 |
| **False positives found (definite)** | **53** |
| False positive rate | **6.0%** |
| Suspicious links needing review | 7 |
| Missing links found | 6 |

### Breakdown by root cause

| Root Cause | Count | Examples |
|------------|-------|---------|
| "Great" keyword match to Constantine the Great | 18 | Great Fire, Great Gatsby, Peter the Great |
| "Emperor" keyword match to Charles V | 8 | Emperor Meiji, Caligula, Marcus Aurelius |
| "Jordan" keyword match to Barbara Jordan | 4 | Jordan River, Michael Jordan |
| "White" keyword match to Jim White | 4 | White House, White Sands, Sallie White |
| "Smith" keyword match to Adam Smith | 3 | Mollie Smith, Smith Point, Smith Street |
| "Nelson" keyword match to Willie Nelson | 2 | Lord Nelson's funeral, Trafalgar |
| "Austin" keyword match to Stephen F. Austin | 2 | Austin city references |
| Surname match (Gandhi, Diego, etc.) | 4 | Indira Gandhi, Juan Diego, Tokugawa, Washington |
| Strategic/reference link, not physical presence | 4 | Churchill at D-Day, FDR at Einstein letter |
| "Strait" keyword match to George Strait | 1 | Strait of Magellan |
| "Garrett" keyword match to Pat Garrett | 1 | Richard Garrett's farm |
| "Columbus" keyword match to Christopher Columbus | 1 | Columbus, NM |
| "Henry" keyword match to O. Henry | 1 | Clay Henry goat |

### Systemic issue

The linking system appears to use keyword/substring matching on moment IDs, names, descriptions, or addresses, matching entity names (or partial names) to moment text. This creates predictable false positive patterns wherever a person's name or surname fragment appears in geographic names, street names, building names, or other people's names. The "Constantine the Great" and "Charles V" patterns are the most severe, accounting for 26 of 53 false positives (49%).
