# Pin Accuracy Audit: Hyper-Specific Coordinate Assessment

**Date:** 2026-03-22
**File:** `src/data/moments.ts`
**Total moments audited:** 1,453

## Summary

| Category | Count | % |
|---|---|---|
| Already hyper-specific | 271 | 18.7% |
| Could be upgraded | 869 | 59.8% |
| Cannot be hyper-specific | 313 | 21.5% |

### Coordinate Precision (current state across all 1,453 moments)

| Decimal places | Count | Approx. accuracy |
|---|---|---|
| 1-3 decimals | 231 | ~100m to 11km |
| 4 decimals | 1,168 | ~11m |
| 5+ decimals | 54 | ~1m |

### Hyper-Specific Group Precision (271 moments)

| Decimal places | Count | Note |
|---|---|---|
| <4 decimals | 11 | Have address but coords need refinement |
| 4 decimals | 248 | Good precision (~11m) |
| 5+ decimals | 12 | Excellent precision (~1m) |

---

## 1. Already Hyper-Specific (271 moments)

These moments meet all criteria: `accuracy='exact'`, have a specific street address with a house/building number, and are pinned to a verifiable location.

**What qualifies them:** Each has a numbered street address (e.g., "231 W Jefferson Blvd" or "3 Savile Row") and is marked `exact`. Most have 4-decimal coordinate precision (~11m), which is adequate for building-level placement.

**11 moments with <4 decimal places need coordinate refinement** despite having good addresses. These should be the first priority for a precision pass.

### Full ID List (271)

<details>
<summary>Click to expand</summary>

```
jfk-texas-theatre
goat-trading-post
cham-national-memorial
faraday-hired-royal-institution
victory-doris-miller
washington-inaugurated-first-president
globe-theatre-opens-southwark-1599
ala-san-fernando
shakespeare-retires-new-place-stratford-1613
annihilator-mollie-smith
bach-st-matthew-passion-premiere-1727
leonardo-dies-amboise-france-1519
shakespeare-baptised-stratford-1564
obama-elected-44th-president-2008
obama-orders-operation-neptune-spear-2011
bac-western-heights
ohenry-federal-trial
obama-signs-affordable-care-act-2010
chopin-dies-paris-place-vendome
ohenry-land-office
twa-calverton
dickens-born-portsmouth
htb-bucktown-store
dickens-death-gads-hill
bonnell-summit
waco-horror-courthouse
shakespeare-dies-stratford-1616
scholz-opening-1866
leonardo-invited-france-amboise-1516
leonardo-dies-amboise-1519
michael-jackson-moonwalk-debut-motown-25
picasso-paints-les-demoiselles-davignon-1907
ohenry-petes-tavern
rp-dexter-church
obama-elected-harvard-law-review-president-1990
treaty-oak-site
rp-detroit-home
tulsa-drexel
wac-mt-carmel
dtm-little-rock-afb
lho-beckley-rooming
mlk-dexter-church
gandhi-assassinated-birla-house-delhi-1948
jfk-birthplace
srv-antones-6th
ww-fault-line
sos-barton-springs
palace-santa-fe
rp-arrest-site
picasso-meets-matisse-gertrude-stein-salon-1905
ohenry-chelsea-hotel
jackson-5-win-apollo-theater-amateur-night
ala-long-barrack
adel-gruene-hall
mlk-lorraine-motel
salt-plaza-siege
trump-wins-2016-presidential-election
thriller-wins-8-grammys-record-single-night
trump-convicted-34-felony-counts-new-york
trump-mar-a-lago-primary-residence-declared
hernani-riots-comedie-francaise
hugo-exiled-guernsey
hugo-hunchback-notre-dame-published
trump-tower-opens-midtown-manhattan
beethoven-baptism-bonn-1770
reagan-assassination-attempt-washington
beethoven-eroica-premiere-1805
beethoven-fidelio-premiere-1805
gein-mendota
dahmer-apartment
dahmer-chocolate-factory
norman-petty-studios
dennys-google-meeting
hnb-hiroshima-hypocenter
wac-courthouse
la-fords-theatre
la-petersen-house
jfk-dealey-plaza
jfk-parkland
mlk-clayborn-temple
ala-shrine
lho-police-hq
wac-ranger-museum
tb-chi-omega
tb-florida-prison
jwg-house-site
jwg-greyhound
oscar-wilde-dies-paris
scm-historic-site
scm-denver-capitol
rwm-wright-house
jro-princeton-ias
lrn-central-high
lrn-bates-house
lrn-capitol-standoff
lin-new-salem
lin-state-capitol
jfk-choate
mlk-birth-home
mlk-morehouse
wb-bicycle-shop
htb-auburn-home
mx-birthplace
mx-audubon
first-impressionist-exhibition
f93-impact
f93-tower
f93-newark
janis-pink-palace
armadillo-wooldridge-poster
armadillo-venue-site
armadillo-willie-1972
plan-wheatville-school
btw-capitol-refusal
btw-wooldridge-square
ohenry-first-national-bank
ohenry-scholz-garden
junk-cathedral-site
junk-city-hall-hearing
dell-dobie-room
uttower-observation-deck
dell-braker-office
sos-city-hall-hearing
lbj-driskill-date
orph-st-marys-site
enron-smith-street
apollo-mission-control
free-balinese-room
spindletop-lucas-site
cad-ranch-site
cad-relocation-spray
victory-grill-opening
men-rough-riders-bar
menger-hotel-opening
queen-milam-park
clyde-western-heights
spoke-opening-night
cemetery-stephen-austin
paramount-majestic-opening
dazed-top-notch
dazed-bedichek-middle
btw-virginia-birth
btw-hampton-entrance
btw-tuskegee-founding
ohenry-marriage-athol
ohenry-ohio-pen
ohenry-rolling-stone
ohenry-irving-place
cemetery-hogg-burial
cemetery-john-connally
cemetery-ann-richards
cemetery-johnston-monument
shelley-writes-frankenstein-diodati
indira-gandhi-assassinated
beatles-rooftop-concert
keats-dies-spanish-steps
tolkien-writes-lord-of-rings-northmoor
anne-frank-writes-diary-prinsengracht
hemingway-farewell-arms
twain-mississippi
dickens-writes-oliver-twist-doughty-street
rowling-writes-potter-elephant-house
orwell-writes-1984-barnhill-jura
brinks-mat-heathrow
austen-revises-pride-prejudice-chawton
kafka-writes-trial-oppelthaus-prague
rivera-rockefeller-destroyed
got-castle-ward
hemingway-writes-sun-also-rises-closerie
brontes-write-jane-eyre-wuthering-heights-haworth
hugo-writes-les-miserables-place-des-vosges
kerouac-types-on-the-road-chelsea-scroll
got-dark-hedges
athens-1896-first-modern-olympics
twain-writes-huckleberry-finn-hartford
antwerp-diamond-heist
inv-wright-dayton-shop
inv-amazon-garage
got-ballintoy-harbour
jesse-owens-four-golds-berlin-1936
db-cooper-portland-airport
inv-fleming-penicillin
ruth-called-shot-wrigley-1932
proust-writes-recherche-boulevard-haussmann
inv-eniac-computer
bannister-four-minute-mile-oxford-1954
mona-lisa-theft-louvre
inv-edison-lightbulb
inv-apple-garage
got-alcazar-seville
gardner-museum-heist
inv-marconi-radio
inv-hp-garage
got-girona-cathedral
norrmalmstorg-kreditbanken
inv-wright-kitty-hawk
inv-google-garage
secretariat-belmont-triple-crown-1973
pasteur-founds-pasteur-institute-paris
hatton-garden-burglary
inv-farnsworth-tv
jefferson-drafts-declaration-of-independence
harry-winston-paris-heist
inv-ford-assembly-line
inv-jenner-vaccination
got-doune-castle
inv-transistor-bell-labs
munich-massacre-connollystrasse-1972
edison-lights-lower-manhattan-pearl-street
hank-aaron-715-atlanta-1974
comaneci-perfect-10-montreal-forum-1976
miracle-on-ice-lake-placid-1980
freud-dies-in-london-exile
eastern-state-capone-cell
bastille-storming-1789
ali-liston-miami-beach-convention-1964
jordan-last-shot-delta-center-1998
freud-flees-nazis-to-london
hanoi-hilton-mccain
usain-bolt-958-berlin-2009
spandau-hess-sole-prisoner
leicester-city-premier-league-2016
disneyland-opens-anaheim
tiger-woods-masters-comeback-augusta-2019
sing-sing-rosenbergs-execution
chateau-dif-mirabeau
la-brea-systematic-excavation
disney-born-chicago-hermosa
skara-brae-occupation
beatles-record-sgt-peppers-abbey-road
pink-floyd-record-dark-side-abbey-road
elvis-records-thats-all-right-sun-studio
poverty-point-construction
prince-mixes-purple-rain-sunset-sound
eagles-record-hotel-california-criteria
r66-chicago-terminus-opens
million-dollar-quartet-sun-studio
bowie-records-heroes-hansa-berlin
aretha-franklin-records-i-never-loved-fame
u2-begin-achtung-baby-hansa-berlin
rolling-stones-record-sticky-fingers-muscle-shoals
elvis-records-nashville-rca-studio-b
r66-meramec-caverns-barnstorming
hendrix-builds-electric-lady-studios
r66-gable-lombard-kingman-wedding
bee-gees-record-saturday-night-fever-criteria
r66-amblers-texaco-opens
r66-blue-swallow-motel-opens
r66-chain-of-rocks-opens
adams-first-president-white-house
dahmer-first-victim
wailers-record-simmer-down-studio-one-kingston
r66-okc-bombing
r66-wigwam-motel-closed-bypass
faraday-discovers-electromagnetic-induction
faraday-refuses-knighthood
faraday-dies-hampton-court
cemetery-james-michener
elizabeth-ii-born-mayfair
gein-worden-store
adel-sophienburg-hill
driskill-poker-loss
armadillo-final-concert
lin-birthplace
srv-auditorium-shores
janis-threadgills
aung-san-suu-kyi-house-arrest
bac-filling-station
btw-white-house-dinner
obama-born-kapiolani-honolulu-1961
gein-farm
```

</details>

### Representative Examples

| ID | Address | What makes it hyper-specific |
|---|---|---|
| `jfk-texas-theatre` | 231 W Jefferson Blvd, Dallas, TX | Building still operates as movie theatre |
| `beatles-rooftop-concert` | 3 Savile Row, Mayfair, London | Exact rooftop, building still stands |
| `hnb-hiroshima-hypocenter` | Specific street address in Hiroshima | Peace Memorial marks exact spot |
| `mlk-lorraine-motel` | Specific address in Memphis | Now National Civil Rights Museum |
| `chopin-dies-paris-place-vendome` | 12 Place Vendome, Paris | Building still stands |
| `bach-st-matthew-passion-premiere-1727` | Thomaskirchhof 18, Leipzig | Church still active; Bach buried inside |
| `inv-wright-kitty-hawk` | Specific address at Kill Devil Hills | National Memorial marks exact spot |

---

## 2. Could Be Upgraded (869 moments)

These moments have enough information to potentially reach hyper-specific status with targeted research. Broken into sub-categories by the type of work needed:

### 2a. Exact accuracy but no street address (418 moments)

**The problem:** These are already marked `accuracy='exact'` but their address field contains a landmark/place name rather than a numbered street address. Many are at well-known, standing buildings where a street address is trivially findable.

**Research needed:** Google Maps lookup to convert place names to street addresses. Most are 5-minute fixes.

**Priority tier:** HIGH -- these are the lowest-hanging fruit. A single geocoding pass could upgrade hundreds.

<details>
<summary>Full ID list (418)</summary>

```
btk-tunstall-store
tokugawa-edo-shogunate
chopin-winter-mallorca-george-sand
macarthur-meets-hirohito
mandela-rivonia-trial-verdict-1964
ashoka-lion-capital-sarnath
leonardo-paints-last-supper-milan-1495
mandela-released-victor-verster-1990
wagner-opens-bayreuth-festspielhaus-ring-cycle
washington-dies-mount-vernon
trinity-site
vj-sabretech
raphael-paints-school-of-athens-vatican-1509
mandela-inaugurated-president-1994
machiavelli-dies-florence-1527
wagner-dies-venice-palazzo-vendramin
vj-memorial
fire-main-square
jefferson-dies-july-fourth-monticello
bats-accidental-joints
cemetery-1994-restoration
guiengola-fortress
voltaire-imprisoned-bastille-1717
teotihuacan-avenue-dead
dickens-bleak-house-legal-reform
dickens-father-marshalsea-prison
washington-born-popes-creek
sabina-first-velada
diaz-battle-miahuatlan
aquinas-begins-summa-theologiae-santa-sabina
lenin-returns-russia-sealed-train-1917
michelangelo-laurentian-library-florence
carlsbad-entrance
vla-site
michelangelo-last-judgment-unveiled
durer-feast-rose-garlands-venice-1506
aquinas-dies-fossanova-abbey
jro-berkeley
columbus-raid
hastings-norman-conquest
michelangelo-david-unveiled-florence
pakal-museum-anthropology
hopper-taos
napoleon-crowns-himself
muhammad-first-revelation-hira
tutankhamun-mask-egyptian-museum-cairo
michelangelo-pieta-commissioned-rome
zk-stine-murder
varanasi-ganges
cyrus-founds-pasargadae-capital
tri-ground-zero
bermeja-mapped-existence
bonnell-picnic-tradition
chaplin-dies-vevey-1977
hnb-nagasaki-hypocenter
```
(and 363 more -- see `audit-ids-upgrade-1.txt` for full list)

</details>

**Representative examples needing simple address lookup:**

| ID | Current address | What to look up |
|---|---|---|
| `leonardo-paints-last-supper-milan-1495` | Piazza di Santa Maria delle Grazie, Milan | Add street number (Piazza di Santa Maria delle Grazie 2) |
| `michelangelo-david-unveiled-florence` | Galleria dell'Accademia, Via Ricasoli 58-60, Florence | Already has a street number in the address -- just needs reclassification |
| `mandela-released-victor-verster-1990` | Victor Verster Prison, Paarl | Look up R101 Paarl address |
| `napoleon-crowns-himself` | Cathedral of Notre-Dame, Paris | 6 Parvis Notre-Dame, Paris |
| `washington-dies-mount-vernon` | Mount Vernon, Fairfax County, VA | 3200 Mount Vernon Memorial Hwy |
| `trinity-site` | White Sands Missile Range, NM | Exact GPS coords for ground zero obelisk |
| `chaplin-dies-vevey-1977` | Manoir de Ban, Corsier-sur-Vevey | Route de Fenil 2, Corsier-sur-Vevey |

### 2b. Standing structure mentioned, research address (236 moments)

**The problem:** The subtitle mentions a structure that "still stands," is "now a museum," or "remains" -- but the accuracy is `approximate` or `general-area` and the address is a city/region, not a specific street.

**Research needed:** Identify the specific building, look up its address, verify coordinates with Google Maps satellite view.

**Priority tier:** MEDIUM -- requires more research than 2a but has high success rate since the structure is confirmed to exist.

<details>
<summary>Full ID list (236)</summary>

```
machiavelli-witnesses-borgia-massacre-sinigaglia-1502
herodotus-exiled-samos
leonardo-born-vinci-1452
grinberg-home-disappearance
magellan-discovers-strait-patagonia
ashoka-born-pataliputra
magellan-killed-battle-of-mactan
mandela-born-mvezo-1918
tutankhamun-moves-court-memphis
art-of-war-bamboo-slips-discovered-at-yinqueshan
geronimo-skeleton-canyon
copernicus-doctorate-ferrara
bach-born-eisenach-1685
darwin-galapagos
raphael-born-urbino-1483
augustine-writes-city-of-god-hippo-413
herodotus-reads-histories-olympia
vasco-da-gama-arrives-kozhikode-india
vasco-da-gama-fleet-departs-lisbon
mao-born-shaoshan
edison-builds-first-industrial-research-lab
washington-ambush-jumonville-glen
tutankhamun-dies-aged-18
machiavelli-appointed-second-chancery-1498
pasteur-discovers-molecular-chirality
picasso-born-malaga-1881
machiavelli-writes-the-prince-sant-andrea-1513
cannibal-tlatelolco-dump
cicero-suppresses-catilinarian-conspiracy
dostoevsky-dies-st-petersburg
pasteur-born-dole-tanner-son
voltaire-candide-published-1759
magellan-fleet-departs-sanlucar-de-barrameda
marie-curie-born-warsaw
caesar-declared-dictator-for-life-44bc
dickens-warrens-blacking-warehouse
aristotle-born-stagira
thales-named-first-of-seven-sages-at-delphi
leonardo-arrives-milan-sforza-1482
columbus-dies-valladolid-1506
ae-lae-airfield
putin-serves-kgb-dresden
columbus-departs-palos-1492
durer-born-nuremberg-1471
columbus-lands-guanahani-1492
goethe-schiller-friendship-begins-1794
hannibal-defeated-at-battle-of-zama
confucius-born-qufu
alexander-founds-alexandria-egypt
confucius-appointed-minister-of-crime
alexander-destroys-thebes
hippocrates-trains-asklepion-kos
castro-enters-havana
gutenberg-recognized-by-archbishop
muhammad-born-mecca
muhammad-conquest-mecca
diaz-ajusco-sighting
gandhi-born-porbandar-1869
muhammad-farewell-pilgrimage
ibn-battuta-leaves-tangier-alone-for-mecca
michelangelo-born-caprese
augustus-born-palatine-hill
caligula-born-antium
tutankhamun-restores-amun-thebes
senate-grants-augustus-title-27bc
octavian-becomes-youngest-consul-rome
solomon-builds-first-temple-jerusalem
chelyabinsk-meteor
hannibal-dies-by-poison-bithynia
totsk-snowball
disney-laugh-o-gram-goes-bankrupt
beethoven-heiligenstadt-testament-1802
caligula-joins-tiberius-capri
lenin-born-simbirsk-1870
lenin-dies-gorki-1924
btk-death
gandhi-quit-india-speech-bombay-1942
hippocrates-born-kos
stalin-born-gori-georgia-1878
dali-joins-surrealists-paints-persistence-of-memory
aquinas-family-kidnaps-him-monte-san-giovanni
sophocles-born-colonus
thermopylae-last-stand
van-gogh-moves-to-paris-meets-avant-garde
van-gogh-dies-auvers-sur-oise
van-gogh-missionary-borinage
victor-hugo-born-besancon
van-gogh-born-groot-zundert
marx-born-trier-1818
goethe-publishes-werther-1774
reagan-born-tampico-illinois
reagan-death-bel-air-california
galileo-dies-under-house-arrest-arcetri-1642
copernicus-matriculates-krakow
copernicus-born-torun
charlemagne-massacre-of-verden
joan-of-arc-born-domremy
hawikku
tri-control-bunker
rwm-cedar-key-rail
sabina-home-arson
bikini-crossroads-baker
amchitka-cannikin
montebello-hurricane
reggane-gerboise-bleue
chicxulub-crater
vredefort-crater
sudbury-basin
jesus-feeds-five-thousand
jesus-resurrection
moses-twelve-spies
moses-death-nebo
paul-conversion-damascus
paul-antioch-commission
paul-cyprus-paphos
cannae-hannibal
neruda-dies-after-coup
evo-laetoli-footprints
evo-gilboa-forest
evo-hadar-lucy
bolivar-liberates-bogota
evo-joggins-reptiles
avicenna-canon-medicine
marie-curie-discovers-radium
evo-ischigualasto-dinosaurs
evo-solnhofen-archaeopteryx
allies-liberate-rome
great-fire-meireki
great-kanto-earthquake
tokyo-firebombing
rwm-sumner-mill
gutenberg-prints-bible
olmec-tres-zapotes-discovery
stalin-great-purge-executions-1936-1938
stalin-dies-kuntsevo-dacha-1953
machiavelli-tortured-imprisoned-medici-1513
cortes-arrives-hispaniola-1504
cortes-death-castilleja-de-la-cuesta
edison-born-milan-ohio
pushkin-killed-in-duel-at-black-river
edison-invents-phonograph-menlo-park
cervantes-dies-madrid
rembrandt-declares-insolvency
cervantes-born-alcala
rembrandt-night-watch-completed
suleiman-captures-baghdad
ali-assassinated-by-kharijite-at-kufa-mosque
dostoevsky-siberian-labor-camp
pasteur-disproves-spontaneous-generation
andersen-arrives-copenhagen
pushkin-writes-boris-godunov-in-exile
andersen-born-odense
dali-co-writes-un-chien-andalou
thales-calculates-pyramid-heights-in-egypt
suleiman-destroys-hungarian-army-at-mohacs
johanson-finds-lucy
turkana-boy-nariokotome
marie-curie-dies-radiation-exposure
tolstoy-survives-siege-of-sevastopol
marie-curie-arrives-paris-sorbonne
linnaeus-born-rashult
homo-naledi-rising-star
linnaeus-lectures-uppsala-second-year
archaeopteryx-solnhofen
sue-rex-hendrickson
cook-claims-eastern-australia
mao-discovers-marxism-peking-university
moliere-dies-onstage-imaginary-invalid
linnaeus-dies-uppsala
mao-takes-command-long-march
ataturk-born-salonica
ibn-battuta-dictates-the-rihla-in-fez
mary-leakey-finds-zinjanthropus
bolivar-born-caracas
locke-born-wrington-somerset
linnaeus-lapland-expedition
cook-first-voyage-endeavour-departs
bolivar-oath-monte-sacro
ibn-battuta-reaches-kilwa-gold-trading-hub
teotihuacan-burning
ataturk-abolishes-caliphate
frida-kahlo-detroit-paintings
hammurabi-dies-empire-begins-to-collapse
putin-annexes-crimea
cartier-plants-cross-at-gaspe-claims-land-for-france
nostradamus-publishes-les-propheties
fdr-paralyzed-campobello
marcus-aurelius-becomes-emperor
kepler-born-weil-der-stadt
marcus-aurelius-marcomannic-wars
nietzsche-collapses-in-turin
mehrgarh-first-farmers
goya-born-fuendetodos
nostradamus-is-born-in-saint-remy-de-provence
byron-born-london
hammurabi-inscribes-282-laws-on-stele
goya-becomes-prime-court-painter
nietzsche-dies-in-weimar
hammurabi-code-stele-rediscovered-in-susa
goya-dies-bordeaux
chanakya-discovers-chandragupta-playing-king
charles-v-outlaws-luther-worms
leibniz-born-leipzig
byron-dies-missolonghi
vivaldi-dies-penniless-vienna
vivaldi-publishes-lestro-armonico
charles-v-troops-sack-rome
goya-paints-third-of-may
adams-born-braintree
francis-founds-franciscan-order
adams-defends-boston-massacre-soldiers
r66-budville-murders
faraday-born-newington-butts
peter-great-captures-azov
peter-great-dies-winter-palace
peter-great-born-moscow
peter-great-works-dutch-shipyard
elizabeth-ii-ve-day-incognito
david-death-jerusalem
euler-goes-blind-continues-work
gauss-predicts-orbit-ceres
gauss-weber-build-telegraph
einstein-general-relativity-berlin-1915
frida-bus-accident
magellan-born-sabrosa-portugal
midway-ambush
aristotle-founds-lyceum-athens
augustine-reads-cicero-carthage-370
ataturk-introduces-latin-alphabet
william-the-conqueror-is-born-at-falaise
ashoka-conquers-kalinga
einstein-annus-mirabilis-bern-1905
cartier-reaches-hochelaga-blocked-by-rapids
charlemagne-palace-school-aachen
andersen-overstays-dickens-home
cartier-dies-in-saint-malo-during-epidemic
```

</details>

**Representative examples:**

| ID | Current address | Research needed |
|---|---|---|
| `bach-born-eisenach-1685` | Eisenach, Thuringia, Germany | Bachhaus museum at Frauenplan 21 |
| `picasso-born-malaga-1881` | Plaza de la Merced 15, Malaga | Already has a street number -- just needs coord verification |
| `gandhi-born-porbandar-1869` | Kirti Mandir, Porbandar | Look up exact Kirti Mandir coordinates |
| `marx-born-trier-1818` | Trier, Germany | Karl-Marx-Haus at Bruckenstrasse 10 |
| `van-gogh-dies-auvers-sur-oise` | Auvers-sur-Oise, France | Auberge Ravoux at Place de la Mairie |
| `copernicus-born-torun` | Torun, Poland | Birthplace museum at ul. Kopernika 15/17 |
| `einstein-annus-mirabilis-bern-1905` | Bern, Switzerland | Kramgasse 49 (Einstein House) |

### 2c. Has street address, verify coordinates (22 moments)

**The problem:** These have a specific street address but are marked `approximate` -- meaning the coordinates may not match the address precisely.

**Research needed:** Geocode the existing address to get precise lat/lng. Quick fixes.

**Priority tier:** HIGHEST -- the address is already there, just need to geocode it.

**Examples:** `obama-presidential-center-groundbreaking-chicago-2021` (has "6401 S Stony Island Ave" but marked approximate)

### 2d. Research specific location (193 moments)

**The problem:** These are marked `approximate` with a general area address (city name, region, or landmark without number). The event likely occurred at a specific place that can be identified with research.

**Research needed:** Historical research to identify the specific building/site, then geocode.

**Priority tier:** LOW-MEDIUM -- requires actual historical research, not just geocoding.

<details>
<summary>Representative examples</summary>

| ID | Current address | Research needed |
|---|---|---|
| `hamilton-killed-duel` | Hamilton Park, Weehawken, NJ | Exact dueling ground coordinates at Hamilton Park |
| `socrates-drinks-hemlock-399-bc` | State Prison, Ancient Agora, Athens | Archaeological site of the Athenian prison |
| `galileo-demonstrates-telescope-venice-1609` | Campanile di San Marco, Venice | Campanile has exact coordinates |
| `augustine-baptized-milan-387` | Cathedral Baptistery, Milan | Remains under Piazza del Duomo |
| `washington-crosses-delaware-trenton` | Trenton, NJ | Washington Crossing Historic Park has exact coordinates |
| `romulus-founds-rome` | Palatine Hill, Rome | Via di San Gregorio 30 entrance |

</details>

---

## 3. Cannot Be Hyper-Specific (313 moments)

These moments will remain at their current accuracy level. Broken into sub-categories:

### 3a. General area, no specific pinnable location (264 moments)

**Why:** The event occurred in a city/region but is not tied to a specific standing structure. Common patterns:
- Ancient events where the exact location is lost (births in ancient cities, battles in approximate regions)
- Events that happened "somewhere in" a city without a specific building
- Diffuse events (wandering, exile periods, general political developments)
- Prehistoric/geological events covering large areas

<details>
<summary>Full ID list (264)</summary>

```
guiengola-river-stalemate
may-68-barricades
constantine-convenes-council-of-nicaea
zone-silence-impact
euler-born-basel
timur-born-shahrisabz
ashoka-dies-pataliputra
ashoka-ascends-throne-pataliputra
shakespeare-attacked-by-greene-london-1592
washington-farewell-address-published
augustine-born-thagaste-354
mandela-anc-youth-league-cofounded-1944
first-folio-published-london-1623
augustine-meets-ambrose-milan-384
herodotus-born-halicarnassus
herodotus-settles-thurii
leonardo-paints-mona-lisa-florence-1503
herodotus-travels-egypt-babylon
vasco-da-gama-appointed-viceroy-india
sophocles-elected-general-441bc
annihilator-eliza-shelley
chopin-settles-paris-salons
sophocles-dies-406bc
sophocles-hosts-asclepius-cult-420bc
descartes-daughter-francine-dies-scarlet-fever
machiavelli-born-florence-1469
caesar-captured-by-pirates-75bc
aristotle-flees-athens-impiety-charge
caesar-crosses-rubicon-49bc
cicero-prosecutes-verres
caesar-born-rome-100bc
avicenna-imprisoned-fardajan
avicenna-physician-nuh-ii
democritus-studies-with-egyptian-mathematicians
li-bai-dismissed-from-court-after-boot-incident
wu-defeats-chu-at-battle-of-boju
cicero-born-arpinum
descartes-publishes-discourse-on-method
aristotle-tutors-alexander-mieza
emperor-wu-han-confucianism-official
picasso-founds-arte-joven-madrid-1901
hannibal-swears-oath-against-rome
confucius-begins-14-year-exile
dotd-aztec-origins
cicero-executed-formiae
evo-pilbara-stromatolites
leonardo-qualifies-guild-saint-luke-1472
timur-arrow-wounds-disable-him
evo-hamersley-bif
socrates-born-alopece-athens
durer-first-journey-italy-venice-1494
plato-burns-poems-meets-socrates
columbus-born-genoa-1451
li-bai-summoned-to-tang-imperial-court
evo-strelley-pool
salt-lake-deposits
constantine-baptized-and-dies-at-nicomedia
alexander-born-pella
avicenna-isfahan-stable-years
alexander-battle-of-hydaspes
hippocrates-travels-teaches-thrace
alexander-battle-of-issus
alexander-dies-babylon
timur-dies-otrar-1405
ovid-first-recitation-rome-25bc
plato-visits-syracuse-dionysius
franklin-runs-away-to-philadelphia
gutenberg-strasbourg-secret-experiments
raphael-orphaned-joins-perugino-workshop-1494
gutenberg-born-mainz
socrates-battlefield-potidaea-432-bc
saladin-born-tikrit
saladin-conquers-damascus-1174
saladin-appointed-vizier-egypt
cyrus-dies-battle-massagetae
saladin-recaptures-jerusalem-1187
octavian-accepts-caesars-will-brundisium
solomon-dies-kingdom-splits
queen-of-sheba-visits-solomon
augustus-dies-nola-ad14
solomon-born-jerusalem
solomon-judgment-two-mothers
gutenberg-fust-lawsuit
tutankhamun-born-amarna
timur-sacks-delhi-1398
chaplin-united-artists-founded-1919
hippocrates-hippocratic-oath-composed
hippocrates-dies-larissa
vasco-da-gama-appointed-viceroy-india
caesar-crosses-rubicon-49bc
cicero-born-arpinum
kant-born-konigsberg-1724
descartes-publishes-discourse-on-method
aristotle-tutors-alexander-mieza
emperor-wu-han-confucianism-official
picasso-founds-arte-joven-madrid-1901
hannibal-swears-oath-against-rome
confucius-begins-14-year-exile
dotd-aztec-origins
cicero-executed-formiae
evo-pilbara-stromatolites
leonardo-qualifies-guild-saint-luke-1472
timur-arrow-wounds-disable-him
evo-hamersley-bif
durer-first-journey-italy-venice-1494
plato-burns-poems-meets-socrates
columbus-born-genoa-1451
li-bai-summoned-to-tang-imperial-court
evo-strelley-pool
salt-lake-deposits
```
(and ~150 more)

</details>

**Why these stay general:**

| Pattern | Example | Reason |
|---|---|---|
| Ancient birth, no surviving building | `caesar-born-rome-100bc` | Subura district long gone |
| Battlefield, imprecise location | `alexander-battle-of-issus` | Ancient battlefield, rough area |
| Diffuse event | `may-68-barricades` | Happened across many streets |
| Prehistoric | `evo-pilbara-stromatolites` | Geological formation, not a building |
| Lost to history | `socrates-born-alopece-athens` | Ancient deme, exact location unknown |
| Event at sea | `cyrus-dies-battle-massagetae` | River region, unknown exact spot |

### 3b. Demolished/destroyed (49 moments)

**Why:** The original building was demolished, razed, or destroyed and no memorial marks the exact spot (or the subtitle explicitly says so).

<details>
<summary>Full ID list (49)</summary>

```
kepler-dies-regensburg
constantine-baptized-and-dies-at-nicomedia
voltaire-born-paris-1694
kant-born-konigsberg-1724
angel-gabriel-foretells-johns-birth-in-jerusalem-temple
chaplin-keystone-tramp-debut-1914
chaplin-great-dictator-released-1940
gandhi-launches-satyagraha-south-africa-1906
lenin-assassination-attempt-1918
gutenberg-dies-buried-mainz
sophocles-leads-paean-salamis-victory
michael-jackson-dies-propofol-overdose-bel-air
gein-tavern
annihilator-o-henry-letter
enewetak-ivy-mike
van-gogh-cuts-ear
mozart-dies-penniless
london-great-exhibition
visigoths-sack-rome
beethoven-ninth-symphony
cervantes-conceives-don-quixote-carcel-real
wagner-born-leipzig-jewish-quarter
securitas-depot-tonbridge
inv-gutenberg-press
great-train-robbery-cheddington
inv-bell-telephone
rembrandt-born-leiden
umar-helps-elect-abu-bakr-at-saqifah
poe-publishes-the-raven
rousseau-runs-away-from-geneva-at-15
freud-dissects-eels-in-trieste
locke-dies-oates-essex
disney-creates-mickey-mouse
poe-found-delirious-dies-in-baltimore
franklin-secures-french-alliance
alexandrian-scholars-compile-sappho-into-nine-books
cook-born-marton-yorkshire
locke-saves-shaftesbury-life-surgery
moliere-premieres-precieuses-ridicules
khayyam-measures-solar-year-isfahan
frida-kahlo-louvre-purchase
gein-school
kepler-meets-tycho-brahe-prague
gauss-born-brunswick
einstein-born-ulm-1879
beethoven-death-vienna-1827
goya-black-paintings-quinta
pushkin-born-into-russian-nobility-in-moscow
bolivar-secures-haitian-support
```

</details>

**Note:** Some demolished-building moments could potentially be upgraded IF a plaque, memorial, or archaeological marker exists at the site. A handful (e.g., `mozart-dies-penniless`, `einstein-born-ulm-1879`) have known locations where a memorial plaque marks the spot -- these could be re-evaluated.

---

## Recommended Action Plan

### Phase 1: Quick Wins (est. 2-4 hours)
1. **Geocode the 22 "has address, verify coords" moments** -- these already have addresses, just need lat/lng verification
2. **Reclassify ~20-30 moments in the "exact but no street address" group** that actually do have street numbers buried in their address field (e.g., `michelangelo-david-unveiled-florence` has "Via Ricasoli 58-60")
3. **Fix the 11 hyper-specific moments with <4 decimal places** -- they have addresses, just need more precise coordinates

### Phase 2: Address Lookup (est. 1-2 days)
4. **Batch-geocode the 418 "exact but no street address" moments** -- write a script that uses Google Maps Geocoding API or Nominatim to convert place names to street addresses and precise coordinates
5. Focus on moments at museums, churches, and government buildings first -- these are the easiest to geocode

### Phase 3: Historical Research (est. 1-2 weeks)
6. **Research the 236 "standing structure" moments** -- identify specific buildings and addresses
7. **Triage the 193 "research specific location" moments** -- some are trivial (Campanile di San Marco), others require deep research

### Phase 4: Re-evaluate Demolished (est. 2-3 days)
8. **Check if memorial plaques exist** for the 49 demolished-building moments
9. Some well-known demolished sites (Crystal Palace, Keystone Studios) have markers that could allow hyper-specific placement

---

## Data Quality Notes

1. **Inconsistent address granularity:** Some moments marked `exact` have less specific addresses than some marked `approximate`. The accuracy field seems to reflect event-location confidence rather than coordinate precision.

2. **Some "Standing structure" detections are false positives:** The subtitle parser flags words like "remains" and "memorial" which sometimes refer to archaeological remains or abstract memorials, not standing buildings. Examples: `magellan-discovers-strait-patagonia` (a waterway, not a building), `chelyabinsk-meteor` (a lake, not a structure).

3. **Coordinate precision vs. accuracy mismatch:** 1,168 moments have 4-decimal precision (~11m) regardless of accuracy level. The coordinate precision is fairly uniform and doesn't distinguish between exact and general-area placements.

4. **Null addresses:** ~106 moments have no address field at all. These should be filled in where possible, even if only a city-level address.
