# Collection Wiring Audit

Audit of moments that thematically match existing collections but are not currently wired.
Only unambiguous fits are listed. Generated 2026-03-23.

---

## 1. `famous-books-written` — "Where the World's Most Famous Books Were Written"

**Current count:** 18 moments

**Missing moments (books/writing clearly about the act of writing a famous book):**

| ID | Name | Rationale |
|----|------|-----------|
| `machiavelli-writes-the-prince-sant-andrea-1513` | Machiavelli Writes The Prince on a Tuscan Farm | Canonical political text, written at a specific location |
| `augustine-writes-city-of-god-hippo-413` | Augustine Begins Writing The City of God | One of the most influential books in Western history |
| `ovid-writes-tristia-exile-poetry-ad9-12` | Ovid Writes the Tristia from Exile on the Black Sea | Major literary work composed at a specific place |
| `dickens-christmas-carol` | Charles Dickens Writes A Christmas Carol in Six Weeks | One of the most famous books ever written, at a known location |
| `dickens-bleak-house-legal-reform` | Dickens Publishes Bleak House | Major novel written at Tavistock House |
| `hugo-writes-les-miserables-place-des-vosges` | Victor Hugo Writes Les Miserables from Place des Vosges | NOTE: This ID IS in the collection already -- duplicate check OK |
| `victor-hugo-writes-les-miserables-hauteville-1862` | Victor Hugo Writes Les Miserables in Exile on a Channel Island | Duplicate/alternate moment for same book -- may need dedup |
| `goethe-publishes-faust-part-one-1808` | Goethe Publishes Faust Part One After 36 Years | One of the defining works of world literature |
| `goethe-publishes-werther-1774` | Goethe Publishes The Sorrows of Young Werther | First international literary sensation of the modern era |
| `hugo-hunchback-notre-dame-published` | Hugo Publishes Notre-Dame de Paris | Major novel that saved a cathedral |
| `pushkin-writes-boris-godunov-in-exile` | Pushkin Writes Boris Godunov and Eugene Onegin Under House Arrest | Russia's foundational literary works |
| `nietzsche-writes-zarathustra-in-rapallo` | Nietzsche Writes Part One of Zarathustra in Ten Days | Major philosophical work written at a specific location |
| `poe-publishes-the-raven` | Poe Publishes The Raven | Iconic poem, though more of a publication than a writing moment |
| `voltaire-candide-published-1759` | Voltaire Publishes Candide | Written at Ferney estate; canonical novella |
| `virgil-writes-aeneid-naples` | Virgil Spends Eleven Years Writing the Aeneid in Naples | Foundational Western epic |
| `murasaki-writes-genji-1000` | Murasaki Shikibu Writes the World's First Novel | World's first novel, at the Heian Court |
| `ibn-khaldun-writes-muqaddimah` | Ibn Khaldun Writes the Muqaddimah in a Desert Fortress | Foundational work of historiography |
| `dostoevsky-writes-crime-punishment-haymarket-1866` | Dostoevsky Writes Crime and Punishment (duplicate) | Duplicate of existing `dostoevsky-writes-crime-punishment-stolyarny` |
| `gabriel-garcia-marquez-writes-one-hundred-years-1966` | Garcia Marquez Writes One Hundred Years of Solitude (duplicate) | Duplicate of existing `garcia-marquez-writes-hundred-years-solitude-cdmx` |
| `orwell-writes-1984-jura-1948` | George Orwell Writes 1984 on a Scottish Island (duplicate) | Duplicate of existing `orwell-writes-1984-barnhill-jura` |
| `euclid-writes-elements-alexandria` | Euclid Writes the Elements at Alexandria | Most enduring textbook in history |
| `al-khwarizmi-publishes-algebra` | Al-Khwarizmi Publishes the Book That Gives Algebra Its Name | Foundational mathematical text |

**Strong recommendations (unambiguous fits, not duplicates):**
- `machiavelli-writes-the-prince-sant-andrea-1513`
- `augustine-writes-city-of-god-hippo-413`
- `ovid-writes-tristia-exile-poetry-ad9-12`
- `dickens-christmas-carol`
- `goethe-publishes-faust-part-one-1808`
- `goethe-publishes-werther-1774`
- `hugo-hunchback-notre-dame-published`
- `pushkin-writes-boris-godunov-in-exile`
- `nietzsche-writes-zarathustra-in-rapallo`
- `voltaire-candide-published-1759`
- `virgil-writes-aeneid-naples`
- `murasaki-writes-genji-1000`
- `ibn-khaldun-writes-muqaddimah`
- `euclid-writes-elements-alexandria`
- `al-khwarizmi-publishes-algebra`

**Note:** Several moments have duplicates (Hugo Les Mis has 3 versions, Garcia Marquez has 3 versions, Orwell 1984 has 2, Dostoevsky Crime and Punishment has 2, Kafka Trial has 2). These need dedup before wiring.

---

## 2. `famous-album-recording-studios` — "Where Famous Albums Were Recorded"

**Current count:** 17 moments

**Missing moments:**

| ID | Name | Rationale |
|----|------|-----------|
| `bob-marley-records-exodus-london-1977` | Bob Marley Records Exodus in London | Exodus is consistently ranked among greatest albums ever |
| `robert-johnson-records-crossroads-san-antonio-1936` | Robert Johnson Records 29 Songs in a San Antonio Hotel Room | Foundational blues recordings |

**Note:** `marley-records-exodus-london-1977` (line 34626) appears to be a duplicate of `bob-marley-records-exodus-london-1977` (line 33710). Dedup needed.

`norman-petty-studios` is already in the aviation-disasters collection (Buddy Holly connection) but is a recording studio -- consider adding to this collection too.

---

## 3. `invention-birthplaces` — "Where Famous Inventions Were Created"

**Current count:** 21 moments

**Missing moments:**

| ID | Name | Rationale |
|----|------|-----------|
| `edison-phonograph-menlo-park-1877` | Edison Invents the Phonograph at Menlo Park | Major invention; already in `inventions-that-connected-the-world` but not in this collection |
| `first-telephone-call-boston-1876` | First Telephone Call in Boston | Already in `inventions-that-connected-the-world` but not in this collection |
| `first-arpanet-message-ucla-1969` | First ARPANET Message from UCLA | Already in `inventions-that-connected-the-world` but not here |
| `pasteur-discovers-molecular-chirality` | Pasteur Discovers Molecular Chirality | Scientific discovery rather than invention -- borderline |
| `pasteur-invents-pasteurization-wine` | Pasteur Patents Pasteurization | Practical invention at a specific lab |

**Note:** There is overlap between `invention-birthplaces` and `inventions-that-connected-the-world`. The two collections serve different purposes (physical birthplace vs. communication theme), so cross-listing is reasonable. Strong adds:
- `pasteur-invents-pasteurization-wine`

The others are judgment calls about whether to cross-list between the two invention collections.

---

## 4. `famous-prisons-notable-inmates` — "Famous Prisons and Their Most Notable Inmates"

**Current count:** 14 moments

**Current IDs:** alcatraz-capone-arrives, alcatraz-1962-escape, tower-london-anne-boleyn, tower-london-thomas-more, chateau-dif-mirabeau, robben-island-mandela-sentenced, devils-island-dreyfus, eastern-state-capone-cell, bastille-storming-1789, lubyanka-solzhenitsyn, hanoi-hilton-mccain, spandau-hess-sole-prisoner, san-quentin-cash-concert, sing-sing-rosenbergs-execution

**Missing moments (type: 'prison' or clear prison theme):**

| ID | Name | Rationale |
|----|------|-----------|
| `voltaire-imprisoned-bastille-1717` | Voltaire Is Jailed in the Bastille for Mocking the Regent | Famous prisoner, famous prison |
| `avicenna-imprisoned-fardajan` | Avicenna Is Imprisoned in Fardajan Fortress | Notable intellectual in prison |
| `dostoevsky-arrives-omsk-prison-camp` (line ~18409) | Dostoevsky Arrives at Omsk Prison Camp | Famous author's formative imprisonment |
| `machiavelli-tortured-imprisoned-medici-1513` | Machiavelli Tortured and Imprisoned by the Medici | Led directly to writing The Prince |
| `ohenry-austin-jail` | William Sydney Porter Is Detained While Awaiting Sentencing | O. Henry's imprisonment |
| `socrates-drinks-hemlock-399-bc` | Socrates Refuses Escape and Drinks Hemlock in an Athenian Prison | Most famous prison death in philosophy |
| `mandela-walks-free-victor-verster` (line ~636) | Nelson Mandela Walks Out of Victor Verster Prison After 27 Years | Iconic release; current collection has sentencing but not release |
| `robben-island-mandela-18-years` (line ~20219) | Nelson Mandela Begins 18 Years in a Robben Island Cell | The actual Robben Island imprisonment moment |
| `cervantes-conceives-don-quixote-carcel-real` | Cervantes Conceives Don Quixote in the Royal Jail of Seville | Already in `famous-books-written`; famous prison moment |

**Strong recommendations:**
- `voltaire-imprisoned-bastille-1717`
- `socrates-drinks-hemlock-399-bc`
- `machiavelli-tortured-imprisoned-medici-1513`
- `cervantes-conceives-don-quixote-carcel-real` (cross-list from books)

---

## 5. `famous-battlefields` — "Famous Battlefields"

**Current count:** 21 moments

**Current IDs:** thermopylae-last-stand, gaugamela-alexander, cannae-hannibal, hastings-norman-conquest, agincourt-longbow, tenochtitlan-fall, trafalgar-nelson, waterloo-napoleon, isandlwana-zulu, dien-bien-phu-siege, yorktown-surrender, gettysburg-pickett, little-bighorn-custer, somme-first-day, verdun-attrition, gallipoli-anzac, normandy-dday, stalingrad-encirclement, midway-ambush, el-alamein-montgomery, iwo-jima-suribachi

There are ~120 battlefield-type moments in the dataset. The collection is titled "Famous Battlefields" and is curated, not exhaustive. The following are major, world-famous battlefields that are notably absent:

| ID | Name | Rationale |
|----|------|-----------|
| `battle-marathon-490bce` | Athenians Defeat Persians at Marathon | One of the most famous battles in history |
| `mehmed-ii-conquers-constantinople-1453` | Mehmed II Breaches the Walls and Ends the Roman Empire | Fall of Constantinople -- defining world-historical battle |
| `tokugawa-wins-sekigahara-1600` | Tokugawa Wins at Sekigahara and Unifies Japan | Japan's most consequential battle |
| `joan-of-arc-siege-orleans-lifted` | Joan Lifts the Siege of Orleans | Turning point of the Hundred Years' War |
| `spartacus-appian-way` | Crassus Crucifies 6,000 Along the Appian Way | Famous conclusion to the slave revolt |
| `saladin-annihilates-crusaders-hattin` (id: from line ~4652) | Saladin Annihilates the Crusader Army at Hattin | Pivotal Crusades battle |
| `ramesses-battle-kadesh-1274bce` | Ramesses II at the Battle of Kadesh | Oldest documented battle in history |
| `ashoka-conquers-kalinga` | Ashoka Conquers Kalinga | Transformed an empire and a religion |

**Strong recommendations** (world-famous, would clearly belong in any "Famous Battlefields" list):
- `battle-marathon-490bce`
- `mehmed-ii-conquers-constantinople-1453`
- `tokugawa-wins-sekigahara-1600`
- `joan-of-arc-siege-orleans-lifted`

---

## 6. `aviation-disasters` — "Aviation Disasters and Disappearances"

**Current count:** 28 moments (after the crash sites batch)

**Missing moments (type: 'crash_site' or clear aviation disaster):**

| ID | Name | Rationale |
|----|------|-----------|
| `amundsen-disappears-arctic-1928` | Amundsen Vanishes Over the Arctic Sea | type: crash_site; aviation disappearance of a famous explorer |
| `dean-crash-site` | James Dean Dies at 24 in a Porsche Collision | NOT aviation -- car crash. Do not add. |

**Assessment:** This collection is already very comprehensive. The only aviation-specific crash_site moment not already included is `amundsen-disappears-arctic-1928`, which is borderline (seaplane disappearance, not commercial aviation). The `ss-grandcamp` (Texas City disaster) is type: crash_site but is an industrial explosion, not aviation.

No strong recommendations -- the collection is well-curated.

---

## 7. `greatest-sports-moments` — "Where History's Greatest Sports Moments Happened"

**Current count:** 18 moments

**Current IDs:** athens-1896-first-modern-olympics, jesse-owens-four-golds-berlin-1936, ruth-called-shot-wrigley-1932, ali-liston-miami-beach-convention-1964, jackie-robinson-debut-ebbets-1947, bannister-four-minute-mile-oxford-1954, pele-1000th-goal-maracana-1969, munich-massacre-connollystrasse-1972, secretariat-belmont-triple-crown-1973, billie-jean-king-battle-sexes-astrodome-1973, hank-aaron-715-atlanta-1974, comaneci-perfect-10-montreal-forum-1976, miracle-on-ice-lake-placid-1980, maradona-hand-of-god-azteca-1986, jordan-last-shot-delta-center-1998, usain-bolt-958-berlin-2009, leicester-city-premier-league-2016, tiger-woods-masters-comeback-augusta-2019

**Missing from this collection but present in `iconic-sports-moments`:**

| ID | Name |
|----|------|
| `ali-foreman-rumble-in-the-jungle-1974` | Ali Knocks Out Foreman in the Jungle |
| `maracana-world-cup-final-1950` | Uruguay Stuns Brazil in the World Cup Final |
| `fischer-spassky-reykjavik-1972` | Fischer Defeats Spassky in the Match of the Century |
| `black-power-salute-mexico-city-1968` | Smith and Carlos Raise Fists on the Medal Stand |
| `bradman-last-innings-the-oval-1948` | Bradman Bowled for a Duck in His Final Innings |
| `jesse-owens-45-minutes-ann-arbor-1935` | Owens Breaks Three World Records in 45 Minutes |
| `wilma-rudolph-three-golds-rome-1960` | Wilma Rudolph Wins Three Golds at Rome |
| `mandela-rugby-world-cup-1995` | Mandela Hands the Rugby World Cup to Pienaar |
| `billie-jean-king-battle-of-sexes-1973` | Billie Jean King Beats Bobby Riggs |

**Assessment:** These two sports collections (`greatest-sports-moments` and `iconic-sports-moments`) have significant overlap but use different moment IDs. Some moments appear to be duplicates with different IDs:
- `comaneci-perfect-10-montreal-forum-1976` vs `nadia-comaneci-perfect-10-montreal-1976`
- `maradona-hand-of-god-azteca-1986` vs `hand-of-god-azteca-1986`
- `billie-jean-king-battle-sexes-astrodome-1973` vs `billie-jean-king-battle-of-sexes-1973`
- `ruth-called-shot-wrigley-1932` vs `babe-ruth-called-shot-wrigley-1932`

**Recommendation:** These two collections need a dedup pass. Many moments exist with slightly different IDs covering the same event.

---

## 8. `iconic-sports-moments` — "Iconic Moments in Sports History"

**Current count:** 13 moments

See analysis above. Same dedup concern applies. The `tokyo-1964-olympics` moment could also fit either sports collection.

---

## 9. `food-and-drink-origins` — "Where Iconic Foods and Drinks Were Born"

**Current count:** 8 moments

**Current IDs:** coca-cola-first-served-jacobs-pharmacy-1886, mcdonalds-first-franchise-des-plaines-1955, prohibition-begins-midnight-1920, french-laundry-opens-yountville-1994, escoffier-ritz-paris-1898, julia-child-le-cordon-bleu-1949, first-michelin-guide-paris-1900, boston-tea-party-1773

**Missing moments:**

| ID | Name | Rationale |
|----|------|-----------|
| `pasteur-invents-pasteurization-wine` | Pasteur Patents Pasteurization to Save French Wine | Directly about food preservation; strong fit |

**Assessment:** This is a small, curated collection. The `pasteur-invents-pasteurization-wine` moment is the only clear thematic fit in the dataset. Other food/drink references (beer goat, Scholz beer garden, wedding at Cana) do not fit the "origins of iconic foods/drinks" theme.

---

## Cross-Cutting Issues

### Duplicate Moment IDs
Multiple events exist with different IDs covering the same moment. These need dedup before any wiring changes:

1. **Les Miserables writing:** `hugo-writes-les-miserables-place-des-vosges`, `victor-hugo-writes-les-miserables-hauteville-1862`, and the Hugo publishes moment
2. **Garcia Marquez 100 Years:** `garcia-marquez-writes-hundred-years-solitude-cdmx`, `garcia-marquez-writes-solitude`, `gabriel-garcia-marquez-writes-one-hundred-years-1966`
3. **Orwell 1984:** `orwell-writes-1984-barnhill-jura`, `orwell-writes-1984-jura-1948`
4. **Dostoevsky Crime & Punishment:** `dostoevsky-writes-crime-punishment-stolyarny`, `dostoevsky-writes-crime-punishment-haymarket-1866`
5. **Kafka Trial:** `kafka-writes-trial`, `kafka-writes-trial-oppelthaus-prague`
6. **Bob Marley Exodus:** `bob-marley-records-exodus-london-1977`, `marley-records-exodus-london-1977`
7. **Sports duplicates:** Multiple pairs with different IDs (see sports section above)
8. **Murasaki Genji:** `murasaki-writes-genji-1000`, `murasaki-writes-genji-kyoto`

### Summary of Strongest Recommendations

| Collection | Missing Count | Highest-Priority Adds |
|------------|:------------:|----------------------|
| `famous-books-written` | ~15 | Machiavelli, Augustine, Virgil, Goethe Faust, Goethe Werther, Dickens Christmas Carol |
| `famous-prisons-notable-inmates` | ~4 | Voltaire/Bastille, Socrates/hemlock, Machiavelli, Cervantes |
| `famous-battlefields` | ~4 | Marathon, Constantinople 1453, Sekigahara, Orleans |
| `famous-album-recording-studios` | 2 | Bob Marley Exodus, Robert Johnson |
| `food-and-drink-origins` | 1 | Pasteur pasteurization |
| `invention-birthplaces` | 1 | Pasteur pasteurization |
| `aviation-disasters` | 0 | Already comprehensive |
| Sports collections | 0 new | Need dedup between two overlapping collections |
