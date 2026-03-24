# Orphan Moments Analysis

Generated: 2026-03-22

## Summary

| Metric | Count |
|--------|-------|
| Total moments | 1453 |
| Moments wired to stories | 630 |
| **Orphan moments** | **823** |
| Total stories | 158 |
| Total entities | 304 |

## Bucket Breakdown

| Bucket | Description | Count |
|--------|------------|-------|
| **A** | Has entity with existing biography story — just add to moments[] | **22** |
| **B** | Has person entity but NO biography story | **357** |
| **C** | Has non-person entity only (place, org, work, concept) | **44** |
| **D** | No entityIds at all — needs entity tagging | **399** |
| **E** | Other (missing entities, edge cases) | **1** |

---

## Bucket A: Ready to Wire (22 moments)

These orphans have at least one entity with a `canonicalStoryId` pointing to an existing biography story. They just need to be added to that story's `moments[]` array.

### Stories That Need Updating

#### `jesus-ministry` (currently 17 moments, adding 6)

```
{ momentId: 'holy-sepulchre' }
{ momentId: 'church-nativity' }
{ momentId: 'fatima-sanctuary' }
{ momentId: 'lourdes-sanctuary' }
{ momentId: 'holy-family-egypt' }
{ momentId: 'john-baptizes-jesus-in-the-jordan-river' }
```

#### `fall-of-tenochtitlan` (currently 4 moments, adding 5)

```
{ momentId: 'cortes-born-medellin' }
{ momentId: 'cortes-scuttles-ships-veracruz' }
{ momentId: 'cortes-cholula-massacre' }
{ momentId: 'cortes-arrives-hispaniola-1504' }
{ momentId: 'cortes-death-castilleja-de-la-cuesta' }
```

#### `rise-fall-rome` (currently 5 moments, adding 5)

```
{ momentId: 'nero-becomes-emperor-age-16' }
{ momentId: 'nero-murders-agrippina' }
{ momentId: 'nero-performs-olympics-greece' }
{ momentId: 'nero-commits-suicide' }
{ momentId: 'seneca-becomes-nero-advisor' }
```

#### `moses-exodus` (currently 9 moments, adding 2)

```
{ momentId: 'mount-sinai-monastery' }
{ momentId: 'jericho-walls-fall' }
```

#### `wright-brothers` (currently 3 moments, adding 2)

```
{ momentId: 'inv-wright-dayton-shop' }
{ momentId: 'inv-wright-kitty-hawk' }
```

#### `j-robert-oppenheimer` (currently 3 moments, adding 1)

```
{ momentId: 'lanl-lab' }
```

#### `abraham-journey` (currently 7 moments, adding 1)

```
{ momentId: 'dome-of-the-rock' }
```


### Bucket A — Full Edit Map (JSON)

```json
{
  "fall-of-tenochtitlan": [
    "cortes-born-medellin",
    "cortes-scuttles-ships-veracruz",
    "cortes-cholula-massacre",
    "cortes-arrives-hispaniola-1504",
    "cortes-death-castilleja-de-la-cuesta"
  ],
  "j-robert-oppenheimer": [
    "lanl-lab"
  ],
  "abraham-journey": [
    "dome-of-the-rock"
  ],
  "jesus-ministry": [
    "holy-sepulchre",
    "church-nativity",
    "fatima-sanctuary",
    "lourdes-sanctuary",
    "holy-family-egypt",
    "john-baptizes-jesus-in-the-jordan-river"
  ],
  "moses-exodus": [
    "mount-sinai-monastery",
    "jericho-walls-fall"
  ],
  "wright-brothers": [
    "inv-wright-dayton-shop",
    "inv-wright-kitty-hawk"
  ],
  "rise-fall-rome": [
    "nero-becomes-emperor-age-16",
    "nero-murders-agrippina",
    "nero-performs-olympics-greece",
    "nero-commits-suicide",
    "seneca-becomes-nero-advisor"
  ]
}
```

---

## Bucket B: Needs Biography Story Created (357 moments)

These orphans have person entities that lack a `canonicalStoryId`. A biography story must be created first, then the moments wired to it.

### Person Entities Needing Biography Stories (124 entities)

| Entity ID | Entity Name | Type | Orphan Moment Count |
|-----------|-------------|------|---------------------|
| `michael-faraday` | Michael Faraday | person | 5 |
| `herodotus` | Herodotus | person | 5 |
| `billy-the-kid` | Billy the Kid | person | 3 |
| `john-tunstall` | John Tunstall | person | 1 |
| `leonardo-da-vinci` | Leonardo da Vinci | person | 2 |
| `frederic-chopin` | Frédéric Chopin | person | 5 |
| `johannes-kepler` | Johannes Kepler | person | 5 |
| `leonhard-euler` | Leonhard Euler | person | 5 |
| `timur` | Timur (Tamerlane) | person | 6 |
| `ferdinand-magellan` | Ferdinand Magellan | person | 5 |
| `tutankhamun` | Tutankhamun | person | 5 |
| `alexander-hamilton` | Alexander Hamilton | person | 1 |
| `richard-wagner` | Richard Wagner | person | 5 |
| `geronimo` | Geronimo | person | 1 |
| `nelson-miles` | Nelson Miles | person | 1 |
| `johann-sebastian-bach` | Johann Sebastian Bach | person | 3 |
| `charles-darwin` | Charles Darwin | person | 1 |
| `augustine-of-hippo` | Augustine of Hippo | person | 1 |
| `vasco-da-gama` | Vasco da Gama | person | 5 |
| `albrecht-durer` | Albrecht Dürer | person | 6 |
| `rene-descartes` | René Descartes | person | 5 |
| `immanuel-kant` | Immanuel Kant | person | 5 |
| `avicenna` | Avicenna (Ibn Sina) | person | 6 |
| `harriet-tubman` | Harriet Tubman | person | 4 |
| `democritus` | Democritus | person | 4 |
| `li-bai` | Li Bai | person | 5 |
| `jacques-cartier` | Jacques Cartier | person | 5 |
| `amelia-earhart` | Amelia Earhart | person | 4 |
| `confucius` | Confucius | person | 4 |
| `vladimir-lenin` | Vladimir Lenin | person | 4 |
| `jim-white` | Jim White | person | 1 |
| `johann-wolfgang-von-goethe` | Johann Wolfgang von Goethe | person | 5 |
| `michael-jackson` | Michael Jackson | person | 4 |
| `plato` | Plato | person | 2 |
| `fidel-castro` | Fidel Castro | person | 1 |
| `dennis-hopper` | Dennis Hopper | person | 1 |
| `ibn-battuta` | Ibn Battuta | person | 5 |
| `solomon` | Solomon | person | 6 |
| `walt-disney` | Walt Disney | person | 4 |
| `hammurabi` | Hammurabi | person | 5 |
| `pat-garrett` | Pat Garrett | person | 1 |
| `isaac-newton` | Isaac Newton | person | 1 |
| `horatio-nelson` | Horatio Nelson | person | 1 |
| `umar` | Umar | person | 5 |
| `dalai-lama-14` | 14th Dalai Lama | person | 1 |
| `charlemagne` | Charlemagne | person | 4 |
| `winston-churchill` | Winston Churchill | person | 2 |
| `karl-marx` | Karl Marx | person | 4 |
| `rumi` | Rumi | person | 1 |
| `charles-i` | Charles I | person | 1 |
| `che-guevara` | Che Guevara | person | 1 |
| `mussolini` | Benito Mussolini | person | 2 |
| `ed-gein` | Ed Gein | person | 6 |
| `jeffrey-dahmer` | Jeffrey Dahmer | person | 4 |
| `nikola-tesla` | Nikola Tesla | person | 1 |
| `georgia-okeeffe` | Georgia O\ | person | 2 |
| `john-wayne-gacy` | John Wayne Gacy | person | 3 |
| `oscar-wilde` | Oscar Wilde | person | 1 |
| `rabindranath-tagore` | Rabindranath Tagore | person | 1 |
| `malcolm-x` | Malcolm X | person | 2 |
| `o-henry` | O. Henry | person | 1 |
| `janis-joplin` | Janis Joplin | person | 3 |
| `willie-nelson` | Willie Nelson | person | 2 |
| `charles-de-gaulle` | Charles de Gaulle | person | 1 |
| `michael-dell` | Michael Dell | person | 2 |
| `theodore-roosevelt` | Theodore Roosevelt | person | 1 |
| `stephen-f-austin` | Stephen F. Austin | person | 1 |
| `elijah-prophet` | Elijah | person | 1 |
| `hannibal-barca` | Hannibal Barca | person | 1 |
| `pablo-neruda` | Pablo Neruda | person | 1 |
| `simon-bolivar` | Simón Bolívar | person | 5 |
| `mao-zedong` | Mao Zedong | person | 1 |
| `mustafa-kemal-ataturk` | Mustafa Kemal Atatürk | person | 6 |
| `indira-gandhi` | Indira Gandhi | person | 1 |
| `genghis-khan` | Genghis Khan | person | 1 |
| `franz-kafka` | Franz Kafka | person | 2 |
| `galileo-galilei` | Galileo Galilei | person | 1 |
| `gabriel-garcia-marquez` | Gabriel García Márquez | person | 2 |
| `wolfgang-mozart` | Wolfgang Amadeus Mozart | person | 1 |
| `bob-marley` | Bob Marley | person | 1 |
| `pele` | Pelé | person | 2 |
| `anne-boleyn` | Anne Boleyn | person | 2 |
| `guy-fawkes` | Guy Fawkes | person | 1 |
| `jack-the-ripper` | Jack the Ripper | person | 1 |
| `caravaggio` | Caravaggio | person | 1 |
| `josephine-baker` | Josephine Baker | person | 1 |
| `diego-rivera` | Diego Rivera | person | 3 |
| `yukio-mishima` | Yukio Mishima | person | 1 |
| `cleopatra` | Cleopatra VII | person | 1 |
| `martin-luther` | Martin Luther | person | 2 |
| `ernest-hemingway` | Ernest Hemingway | person | 2 |
| `mark-twain` | Mark Twain | person | 2 |
| `florence-nightingale` | Florence Nightingale | person | 1 |
| `alexander-pushkin` | Alexander Pushkin | person | 5 |
| `hans-christian-andersen` | Hans Christian Andersen | person | 4 |
| `jean-jacques-rousseau` | Jean-Jacques Rousseau | person | 5 |
| `john-the-baptist` | John the Baptist | person | 2 |
| `thales-of-miletus` | Thales of Miletus | person | 2 |
| `john-locke` | John Locke | person | 5 |
| `sappho` | Sappho | person | 3 |
| `geoffrey-chaucer` | Geoffrey Chaucer | person | 5 |
| `sun-tzu` | Sun Tzu | person | 2 |
| `otto-von-bismarck` | Otto von Bismarck | person | 5 |
| `tiberius` | Tiberius | person | 3 |
| `carl-linnaeus` | Carl Linnaeus | person | 5 |
| `moliere` | Molière | person | 5 |
| `epicurus` | Epicurus | person | 5 |
| `chanakya` | Chanakya | person | 5 |
| `marcus-aurelius` | Marcus Aurelius | person | 4 |
| `omar-khayyam` | Omar Khayyam | person | 5 |
| `lord-byron` | Lord Byron | person | 4 |
| `gottfried-wilhelm-leibniz` | Gottfried Wilhelm Leibniz | person | 4 |
| `william-the-conqueror` | William the Conqueror | person | 2 |
| `francisco-goya` | Francisco Goya | person | 5 |
| `john-adams` | John Adams | person | 5 |
| `antonio-vivaldi` | Antonio Vivaldi | person | 4 |
| `francis-of-assisi` | Francis of Assisi | person | 2 |
| `carl-friedrich-gauss` | Carl Friedrich Gauss | person | 5 |
| `barbara-jordan` | Barbara Jordan | person | 1 |
| `adam-smith` | Adam Smith | person | 4 |
| `alexander-the-great` | Alexander the Great | person | 1 |
| `aung-san-suu-kyi` | Aung San Suu Kyi | person | 1 |
| `akira-kurosawa` | Akira Kurosawa | person | 1 |
| `elfego-baca` | Elfego Baca | person | 1 |

### Bucket B — Orphan Moments by Entity

#### `michael-faraday` — Michael Faraday (5 orphans)

- `faraday-hired-royal-institution`
- `faraday-born-newington-butts`
- `faraday-discovers-electromagnetic-induction`
- `faraday-refuses-knighthood`
- `faraday-dies-hampton-court`

#### `herodotus` — Herodotus (5 orphans)

- `herodotus-exiled-samos`
- `herodotus-born-halicarnassus`
- `herodotus-settles-thurii`
- `herodotus-reads-histories-olympia`
- `herodotus-travels-egypt-babylon`

#### `billy-the-kid` — Billy the Kid (3 orphans)

- `btk-tunstall-store`
- `btk-death`
- `btk-courthouse-escape`

#### `john-tunstall` — John Tunstall (1 orphans)

- `btk-tunstall-store`

#### `leonardo-da-vinci` — Leonardo da Vinci (2 orphans)

- `leonardo-born-vinci-1452`
- `da-vinci-last-supper`

#### `frederic-chopin` — Frédéric Chopin (5 orphans)

- `chopin-winter-mallorca-george-sand`
- `chopin-settles-paris-salons`
- `chopin-dies-paris-place-vendome`
- `chopin-born-zelazowa-wola`
- `chopin-farewell-concert-warsaw`

#### `johannes-kepler` — Johannes Kepler (5 orphans)

- `kepler-dies-regensburg`
- `kepler-born-weil-der-stadt`
- `kepler-meets-tycho-brahe-prague`
- `kepler-publishes-harmonice-mundi`
- `kepler-publishes-astronomia-nova`

#### `leonhard-euler` — Leonhard Euler (5 orphans)

- `euler-born-basel`
- `euler-solves-seven-bridges-konigsberg`
- `euler-goes-blind-continues-work`
- `euler-publishes-letters-german-princess`
- `euler-dies-st-petersburg`

#### `timur` — Timur (Tamerlane) (6 orphans)

- `timur-born-shahrisabz`
- `timur-arrow-wounds-disable-him`
- `timur-dies-otrar-1405`
- `timur-sacks-delhi-1398`
- `timur-captures-ottoman-sultan-ankara-1402`
- `timur-proclaimed-sovereign-balkh-1370`

#### `ferdinand-magellan` — Ferdinand Magellan (5 orphans)

- `magellan-discovers-strait-patagonia`
- `magellan-killed-battle-of-mactan`
- `magellan-crosses-pacific-ocean`
- `magellan-fleet-departs-sanlucar-de-barrameda`
- `magellan-born-sabrosa-portugal`

#### `tutankhamun` — Tutankhamun (5 orphans)

- `tutankhamun-moves-court-memphis`
- `tutankhamun-dies-aged-18`
- `tutankhamun-mask-egyptian-museum-cairo`
- `tutankhamun-restores-amun-thebes`
- `tutankhamun-born-amarna`

#### `alexander-hamilton` — Alexander Hamilton (1 orphans)

- `hamilton-killed-duel`

#### `richard-wagner` — Richard Wagner (5 orphans)

- `wagner-opens-bayreuth-festspielhaus-ring-cycle`
- `wagner-dies-venice-palazzo-vendramin`
- `wagner-born-leipzig-jewish-quarter`
- `wagner-flees-dresden-uprising`
- `wagner-premieres-tristan-und-isolde-munich`

#### `geronimo` — Geronimo (1 orphans)

- `geronimo-skeleton-canyon`

#### `nelson-miles` — Nelson Miles (1 orphans)

- `geronimo-skeleton-canyon`

#### `johann-sebastian-bach` — Johann Sebastian Bach (3 orphans)

- `bach-born-eisenach-1685`
- `bach-st-matthew-passion-premiere-1727`
- `bach-walks-to-lubeck-buxtehude-1705`

#### `charles-darwin` — Charles Darwin (1 orphans)

- `darwin-galapagos`

#### `augustine-of-hippo` — Augustine of Hippo (1 orphans)

- `augustine-writes-city-of-god-hippo-413`

#### `vasco-da-gama` — Vasco da Gama (5 orphans)

- `vasco-da-gama-appointed-viceroy-india`
- `vasco-da-gama-born-sines`
- `vasco-da-gama-arrives-kozhikode-india`
- `vasco-da-gama-fleet-departs-lisbon`
- `vasco-da-gama-rounds-cape-good-hope`

#### `albrecht-durer` — Albrecht Dürer (6 orphans)

- `durer-apocalypse-woodcuts-published-1498`
- `durer-born-nuremberg-1471`
- `durer-first-journey-italy-venice-1494`
- `durer-feast-rose-garlands-venice-1506`
- `durer-dies-nuremberg-1528`
- `durer-draws-self-portrait-age-13`

#### `rene-descartes` — René Descartes (5 orphans)

- `descartes-daughter-francine-dies-scarlet-fever`
- `descartes-dies-stockholm-queens-lessons`
- `descartes-publishes-discourse-on-method`
- `descartes-born-la-haye-en-touraine`
- `descartes-dreams-in-stove-room-neuburg`

#### `immanuel-kant` — Immanuel Kant (5 orphans)

- `kant-enrolls-university-konigsberg-1740`
- `kant-publishes-universal-natural-history-1755`
- `kant-born-konigsberg-1724`
- `kant-dies-konigsberg-1804`
- `kant-publishes-critique-of-pure-reason-1781`

#### `avicenna` — Avicenna (Ibn Sina) (6 orphans)

- `avicenna-imprisoned-fardajan`
- `avicenna-physician-nuh-ii`
- `avicenna-isfahan-stable-years`
- `avicenna-dies-hamadan`
- `avicenna-canon-medicine`
- `avicenna-born-afshana`

#### `harriet-tubman` — Harriet Tubman (4 orphans)

- `htb-bucktown-store`
- `htb-combahee-river`
- `htb-auburn-home`
- `tubman-escapes-slavery`

#### `democritus` — Democritus (4 orphans)

- `democritus-studies-with-egyptian-mathematicians`
- `democritus-dies-in-abdera-possibly-over-100`
- `democritus-born-in-abdera-thrace`
- `democritus-proposes-atomic-theory-of-universe`

#### `li-bai` — Li Bai (5 orphans)

- `li-bai-dismissed-from-court-after-boot-incident`
- `li-bai-summoned-to-tang-imperial-court`
- `li-bai-dies-in-dangtu`
- `li-bai-born-on-silk-road-in-suyab`
- `li-bai-meets-du-fu-in-luoyang`

#### `jacques-cartier` — Jacques Cartier (5 orphans)

- `cartier-returns-with-fake-diamonds-from-third-voyage`
- `cartier-learns-scurvy-cure-from-iroquoians`
- `cartier-plants-cross-at-gaspe-claims-land-for-france`
- `cartier-reaches-hochelaga-blocked-by-rapids`
- `cartier-dies-in-saint-malo-during-epidemic`

#### `amelia-earhart` — Amelia Earhart (4 orphans)

- `ae-lae-airfield`
- `ae-harbour-grace`
- `ae-howland-island`
- `earhart-disappears`

#### `confucius` — Confucius (4 orphans)

- `confucius-begins-14-year-exile`
- `confucius-born-qufu`
- `confucius-appointed-minister-of-crime`
- `confucius-teaches-qufu`

#### `vladimir-lenin` — Vladimir Lenin (4 orphans)

- `lenin-returns-russia-sealed-train-1917`
- `lenin-assassination-attempt-1918`
- `lenin-born-simbirsk-1870`
- `lenin-dies-gorki-1924`

#### `jim-white` — Jim White (1 orphans)

- `carlsbad-entrance`

#### `johann-wolfgang-von-goethe` — Johann Wolfgang von Goethe (5 orphans)

- `goethe-schiller-friendship-begins-1794`
- `goethe-arrives-weimar-1775`
- `goethe-publishes-faust-part-one-1808`
- `goethe-born-frankfurt-1749`
- `goethe-publishes-werther-1774`

#### `michael-jackson` — Michael Jackson (4 orphans)

- `michael-jackson-moonwalk-debut-motown-25`
- `jackson-5-win-apollo-theater-amateur-night`
- `michael-jackson-dies-propofol-overdose-bel-air`
- `michael-jackson-born-gary-indiana`

#### `plato` — Plato (2 orphans)

- `plato-visits-syracuse-dionysius`
- `plato-founds-academy`

#### `fidel-castro` — Fidel Castro (1 orphans)

- `castro-enters-havana`

#### `dennis-hopper` — Dennis Hopper (1 orphans)

- `hopper-taos`

#### `ibn-battuta` — Ibn Battuta (5 orphans)

- `ibn-battuta-leaves-tangier-alone-for-mecca`
- `ibn-battuta-completes-first-hajj-pilgrimage`
- `ibn-battuta-visits-mogadishu-at-its-zenith`
- `ibn-battuta-dictates-the-rihla-in-fez`
- `ibn-battuta-reaches-kilwa-gold-trading-hub`

#### `solomon` — Solomon (6 orphans)

- `solomon-dies-kingdom-splits`
- `queen-of-sheba-visits-solomon`
- `solomon-builds-first-temple-jerusalem`
- `solomon-born-jerusalem`
- `solomon-judgment-two-mothers`
- `solomon-dream-gibeon-wisdom`

#### `walt-disney` — Walt Disney (4 orphans)

- `disney-laugh-o-gram-goes-bankrupt`
- `disney-creates-mickey-mouse`
- `disney-dies-lung-cancer-burbank`
- `disney-born-chicago-hermosa`

#### `hammurabi` — Hammurabi (5 orphans)

- `hammurabi-inherits-throne-of-minor-babylon`
- `hammurabi-dies-empire-begins-to-collapse`
- `hammurabi-conquers-larsa-controls-lower-mesopotamia`
- `hammurabi-inscribes-282-laws-on-stele`
- `hammurabi-code-stele-rediscovered-in-susa`

#### `pat-garrett` — Pat Garrett (1 orphans)

- `btk-death`

#### `isaac-newton` — Isaac Newton (1 orphans)

- `newton-publishes-principia`

#### `horatio-nelson` — Horatio Nelson (1 orphans)

- `nelson-funeral-st-pauls`

#### `umar` — Umar (5 orphans)

- `umar-assassinated-by-persian-slave`
- `umar-helps-elect-abu-bakr-at-saqifah`
- `umar-fights-battle-of-badr`
- `umar-converts-to-islam-sword-in-hand`
- `umar-opens-jerusalem-to-jews`

#### `dalai-lama-14` — 14th Dalai Lama (1 orphans)

- `dalai-lama-flees-tibet`

#### `charlemagne` — Charlemagne (4 orphans)

- `charlemagne-crowned-emperor-rome`
- `charlemagne-crowned-king-of-franks`
- `charlemagne-massacre-of-verden`
- `charlemagne-palace-school-aachen`

#### `winston-churchill` — Winston Churchill (2 orphans)

- `churchill-war-rooms`
- `london-ve-day`

#### `karl-marx` — Karl Marx (4 orphans)

- `marx-born-trier-1818`
- `marx-communist-manifesto-brussels-1848`
- `marx-meets-engels-paris-1844`
- `marx-das-kapital`

#### `rumi` — Rumi (1 orphans)

- `rumi-settles-konya`

#### `charles-i` — Charles I (1 orphans)

- `charles-i-executed`

#### `che-guevara` — Che Guevara (1 orphans)

- `che-guevara-executed`

#### `mussolini` — Benito Mussolini (2 orphans)

- `mussolini-march-on-rome`
- `lateran-treaty-vatican`

#### `ed-gein` — Ed Gein (6 orphans)

- `gein-tavern`
- `gein-mendota`
- `gein-school`
- `gein-worden-store`
- `gein-farm`
- `gein-cemetery`

#### `jeffrey-dahmer` — Jeffrey Dahmer (4 orphans)

- `dahmer-apartment`
- `dahmer-chocolate-factory`
- `dahmer-first-victim`
- `dahmer-columbia-prison`

#### `nikola-tesla` — Nikola Tesla (1 orphans)

- `tesla-wardenclyffe`

#### `georgia-okeeffe` — Georgia O\ (2 orphans)

- `okeeffe-abiquiu`
- `okeeffe-ghost-ranch`

#### `john-wayne-gacy` — John Wayne Gacy (3 orphans)

- `jwg-house-site`
- `jwg-greyhound`
- `jwg-des-plaines-bridge`

#### `oscar-wilde` — Oscar Wilde (1 orphans)

- `oscar-wilde-dies-paris`

#### `rabindranath-tagore` — Rabindranath Tagore (1 orphans)

- `tagore-wins-nobel`

#### `malcolm-x` — Malcolm X (2 orphans)

- `mx-birthplace`
- `mx-audubon`

#### `o-henry` — O. Henry (1 orphans)

- `annihilator-o-henry-letter`

#### `janis-joplin` — Janis Joplin (3 orphans)

- `janis-pink-palace`
- `janis-ut-campus`
- `janis-threadgills`

#### `willie-nelson` — Willie Nelson (2 orphans)

- `armadillo-willie-1972`
- `willie-nelson-records-arlyn-austin`

#### `charles-de-gaulle` — Charles de Gaulle (1 orphans)

- `de-gaulle-liberation-paris`

#### `michael-dell` — Michael Dell (2 orphans)

- `dell-dobie-room`
- `dell-braker-office`

#### `theodore-roosevelt` — Theodore Roosevelt (1 orphans)

- `men-rough-riders-bar`

#### `stephen-f-austin` — Stephen F. Austin (1 orphans)

- `cemetery-stephen-austin`

#### `elijah-prophet` — Elijah (1 orphans)

- `elijah-carmel-fire`

#### `hannibal-barca` — Hannibal Barca (1 orphans)

- `cannae-hannibal`

#### `pablo-neruda` — Pablo Neruda (1 orphans)

- `neruda-dies-after-coup`

#### `simon-bolivar` — Simón Bolívar (5 orphans)

- `bolivar-liberates-bogota`
- `bolivar-born-caracas`
- `bolivar-oath-monte-sacro`
- `bolivar-dies-santa-marta`
- `bolivar-secures-haitian-support`

#### `mao-zedong` — Mao Zedong (1 orphans)

- `mao-proclaims-prc`

#### `mustafa-kemal-ataturk` — Mustafa Kemal Atatürk (6 orphans)

- `ataturk-founds-republic`
- `ataturk-born-salonica`
- `ataturk-dies-dolmabahce`
- `ataturk-abolishes-caliphate`
- `ataturk-introduces-latin-alphabet`
- `gallipoli-anzac`

#### `indira-gandhi` — Indira Gandhi (1 orphans)

- `indira-gandhi-assassinated`

#### `genghis-khan` — Genghis Khan (1 orphans)

- `genghis-khan-unites-mongols`

#### `franz-kafka` — Franz Kafka (2 orphans)

- `kafka-writes-trial`
- `kafka-writes-trial-oppelthaus-prague`

#### `galileo-galilei` — Galileo Galilei (1 orphans)

- `galileo-faces-inquisition`

#### `gabriel-garcia-marquez` — Gabriel García Márquez (2 orphans)

- `garcia-marquez-writes-solitude`
- `garcia-marquez-writes-hundred-years-solitude-cdmx`

#### `wolfgang-mozart` — Wolfgang Amadeus Mozart (1 orphans)

- `mozart-dies-penniless`

#### `bob-marley` — Bob Marley (1 orphans)

- `bob-marley-zimbabwe`

#### `pele` — Pelé (2 orphans)

- `pele-1000th-goal`
- `pele-1000th-goal-maracana-1969`

#### `anne-boleyn` — Anne Boleyn (2 orphans)

- `anne-boleyn-executed`
- `tower-london-anne-boleyn`

#### `guy-fawkes` — Guy Fawkes (1 orphans)

- `guy-fawkes-caught`

#### `jack-the-ripper` — Jack the Ripper (1 orphans)

- `jack-ripper-whitechapel`

#### `caravaggio` — Caravaggio (1 orphans)

- `caravaggio-kills-ranuccio`

#### `josephine-baker` — Josephine Baker (1 orphans)

- `josephine-baker-paris`

#### `diego-rivera` — Diego Rivera (3 orphans)

- `rivera-detroit-industry`
- `rivera-palacio-nacional`
- `rivera-rockefeller-destroyed`

#### `yukio-mishima` — Yukio Mishima (1 orphans)

- `mishima-seppuku`

#### `cleopatra` — Cleopatra VII (1 orphans)

- `cleopatra-suicide-alexandria`

#### `martin-luther` — Martin Luther (2 orphans)

- `luther-95-theses`
- `charles-v-outlaws-luther-worms`

#### `ernest-hemingway` — Ernest Hemingway (2 orphans)

- `hemingway-farewell-arms`
- `hemingway-writes-sun-also-rises-closerie`

#### `mark-twain` — Mark Twain (2 orphans)

- `twain-mississippi`
- `twain-writes-huckleberry-finn-hartford`

#### `florence-nightingale` — Florence Nightingale (1 orphans)

- `nightingale-scutari`

#### `alexander-pushkin` — Alexander Pushkin (5 orphans)

- `pushkin-killed-in-duel-at-black-river`
- `pushkin-marries-natalia-goncharova-moscow`
- `pushkin-writes-boris-godunov-in-exile`
- `pushkin-graduates-imperial-lyceum-recognized-as-literary-talent`
- `pushkin-born-into-russian-nobility-in-moscow`

#### `hans-christian-andersen` — Hans Christian Andersen (4 orphans)

- `andersen-dies-copenhagen`
- `andersen-arrives-copenhagen`
- `andersen-born-odense`
- `andersen-publishes-first-fairy-tales`

#### `jean-jacques-rousseau` — Jean-Jacques Rousseau (5 orphans)

- `rousseau-born-in-geneva-mother-dies`
- `rousseau-wins-dijon-prize-with-discourse`
- `rousseau-dies-at-ermenonville`
- `rousseau-runs-away-from-geneva-at-15`
- `rousseau-publishes-social-contract`

#### `john-the-baptist` — John the Baptist (2 orphans)

- `herod-antipas-beheads-john-the-baptist-at-machaerus`
- `john-the-baptist-preaches-repentance-in-jordan-wilderness`

#### `thales-of-miletus` — Thales of Miletus (2 orphans)

- `thales-born-in-miletus-ionia`
- `thales-advises-miletus-against-lydian-alliance`

#### `john-locke` — John Locke (5 orphans)

- `locke-dies-oates-essex`
- `locke-flees-to-netherlands-exile`
- `locke-born-wrington-somerset`
- `locke-saves-shaftesbury-life-surgery`
- `locke-publishes-two-treatises-essay`

#### `sappho` — Sappho (3 orphans)

- `sappho-exiled-from-lesbos-to-sicily`
- `alexandrian-scholars-compile-sappho-into-nine-books`
- `sappho-composes-lyric-poetry-on-lesbos`

#### `geoffrey-chaucer` — Geoffrey Chaucer (5 orphans)

- `chaucer-buried-westminster-abbey`
- `chaucer-born-london-vintner`
- `chaucer-appointed-customs-comptroller`
- `chaucer-captured-reims`
- `chaucer-visits-italy-meets-petrarch`

#### `sun-tzu` — Sun Tzu (2 orphans)

- `sun-tzu-executes-kings-concubines-to-prove-discipline`
- `sun-tzu-born-in-state-of-qi`

#### `otto-von-bismarck` — Otto von Bismarck (5 orphans)

- `bismarck-creates-welfare-state`
- `bismarck-dismissed-by-wilhelm-ii`
- `bismarck-blood-iron-speech`
- `bismarck-born-schonhausen`
- `bismarck-proclaims-german-empire-versailles`

#### `tiberius` — Tiberius (3 orphans)

- `tiberius-retires-to-rhodes-abandoning-rome`
- `tiberius-born-in-rome-to-claudian-family`
- `tiberius-orders-sejanus-executed-for-treason`

#### `carl-linnaeus` — Carl Linnaeus (5 orphans)

- `linnaeus-born-rashult`
- `linnaeus-lectures-uppsala-second-year`
- `linnaeus-dies-uppsala`
- `linnaeus-lapland-expedition`
- `linnaeus-publishes-systema-naturae`

#### `moliere` — Molière (5 orphans)

- `moliere-dies-onstage-imaginary-invalid`
- `moliere-founds-illustre-theatre`
- `moliere-premieres-precieuses-ridicules`
- `moliere-tartuffe-banned`
- `moliere-performs-for-louis-xiv`

#### `epicurus` — Epicurus (5 orphans)

- `epicurus-is-born-on-samos`
- `epicurus-dies-cheerfully-in-agony`
- `epicurus-is-expelled-from-mytilene`
- `epicurus-proposes-atomic-swerve-theory`
- `epicurus-founds-the-garden-in-athens`

#### `chanakya` — Chanakya (5 orphans)

- `chanakya-saves-bindusara-from-poisoned-empress`
- `chanakya-humiliated-at-nanda-court`
- `chanakya-discovers-chandragupta-playing-king`
- `chanakya-overthrows-nanda-dynasty`
- `chanakya-learns-strategy-from-woman-scolding-son`

#### `marcus-aurelius` — Marcus Aurelius (4 orphans)

- `marcus-aurelius-dies-vindobona`
- `marcus-aurelius-becomes-emperor`
- `marcus-aurelius-marcomannic-wars`
- `marcus-aurelius-born-rome`

#### `omar-khayyam` — Omar Khayyam (5 orphans)

- `khayyam-born-nishapur`
- `khayyam-writes-treatise-algebra-samarkand`
- `khayyam-measures-solar-year-isfahan`
- `khayyam-dies-nishapur`
- `khayyam-falls-from-favor-pilgrimage-mecca`

#### `lord-byron` — Lord Byron (4 orphans)

- `byron-childe-harold-fame`
- `byron-born-london`
- `byron-exile-venice`
- `byron-dies-missolonghi`

#### `gottfried-wilhelm-leibniz` — Gottfried Wilhelm Leibniz (4 orphans)

- `leibniz-dies-alone-hanover`
- `leibniz-born-leipzig`
- `leibniz-demonstrates-calculator-royal-society`
- `leibniz-develops-calculus-paris`

#### `william-the-conqueror` — William the Conqueror (2 orphans)

- `william-the-conqueror-dies-in-rouen`
- `william-the-conqueror-is-born-at-falaise`

#### `francisco-goya` — Francisco Goya (5 orphans)

- `goya-born-fuendetodos`
- `goya-becomes-prime-court-painter`
- `goya-dies-bordeaux`
- `goya-paints-third-of-may`
- `goya-black-paintings-quinta`

#### `john-adams` — John Adams (5 orphans)

- `adams-dies-fourth-of-july`
- `adams-champions-declaration-independence`
- `adams-born-braintree`
- `adams-defends-boston-massacre-soldiers`
- `adams-first-president-white-house`

#### `antonio-vivaldi` — Antonio Vivaldi (4 orphans)

- `vivaldi-hired-ospedale-pieta`
- `vivaldi-dies-penniless-vienna`
- `vivaldi-publishes-lestro-armonico`
- `vivaldi-born-venice`

#### `francis-of-assisi` — Francis of Assisi (2 orphans)

- `francis-assisi-renounces-father`
- `francis-assisi-dies-porziuncola`

#### `carl-friedrich-gauss` — Carl Friedrich Gauss (5 orphans)

- `gauss-born-brunswick`
- `gauss-proves-heptadecagon-construction`
- `gauss-predicts-orbit-ceres`
- `gauss-weber-build-telegraph`
- `gauss-dies-gottingen`

#### `barbara-jordan` — Barbara Jordan (1 orphans)

- `cemetery-barbara-jordan`

#### `adam-smith` — Adam Smith (4 orphans)

- `adam-smith-professorship-glasgow`
- `adam-smith-born-kirkcaldy`
- `adam-smith-publishes-wealth-of-nations`
- `adam-smith-dies-edinburgh`

#### `alexander-the-great` — Alexander the Great (1 orphans)

- `gaugamela-alexander`

#### `aung-san-suu-kyi` — Aung San Suu Kyi (1 orphans)

- `aung-san-suu-kyi-house-arrest`

#### `akira-kurosawa` — Akira Kurosawa (1 orphans)

- `kurosawa-seven-samurai`

#### `elfego-baca` — Elfego Baca (1 orphans)

- `baca-standoff`


---

## Bucket C: Non-Person Entities (44 moments)

These orphans have entities that are not person-type (places, organizations, works, concepts). They need a different kind of story or collection.

### Non-Person Entity Summary

| Entity ID | Type | Orphan Count |
|-----------|------|--------------|
| `manhattan-project` (The Manhattan Project) | concept | 8 |
| `texas-state-cemetery` (Texas State Cemetery) | place | 6 |
| `servant-girl-annihilator` (The Servant Girl Annihilator) | concept | 5 |
| `congress-avenue-bats` (The Congress Avenue Bats) | place | 3 |
| `mount-bonnell-austin` (Mt. Bonnell) | place | 3 |
| `little-rock-nine` (The Little Rock Nine) | concept | 3 |
| `cobalt-60-accident` (The Radioactive Rebar Crisis) | place | 3 |
| `armadillo-world-hq` (Armadillo World Headquarters) | place | 3 |
| `mexican-free-tailed-bats` (Mexican Free-Tailed Bats) | concept | 2 |
| `aluxes-cancun-bridge` (The Aluxes and the Cancun Bridge) | place | 2 |
| `cathedral-of-junk` (The Cathedral of Junk) | place | 2 |
| `driskill-hotel` (The Driskill Hotel) | place | 2 |
| `menger-hotel-rough-riders` (The Menger Hotel & Rough Riders) | place | 2 |
| `the-beatles` (The Beatles) | organization | 2 |
| `moonlight-towers` (Moonlight Towers) | place | 1 |
| `bat-conservation-international` (Bat Conservation International) | organization | 1 |

### Bucket C — All Orphan Moment IDs

- `annihilator-mollie-smith` → entities: `servant-girl-annihilator` (concept)
- `annihilator-eliza-shelley` → entities: `servant-girl-annihilator` (concept)
- `bats-accidental-joints` → entities: `mexican-free-tailed-bats` (concept), `congress-avenue-bats` (place)
- `cemetery-1994-restoration` → entities: `texas-state-cemetery` (place)
- `bonnell-summit` → entities: `mount-bonnell-austin` (place)
- `bonnell-picnic-tradition` → entities: `mount-bonnell-austin` (place)
- `alux-bridge-sabotage` → entities: `aluxes-cancun-bridge` (place)
- `lrn-central-high` → entities: `little-rock-nine` (concept)
- `lrn-bates-house` → entities: `little-rock-nine` (concept)
- `lrn-capitol-standoff` → entities: `little-rock-nine` (concept)
- `alux-stone-house` → entities: `aluxes-cancun-bridge` (place)
- `cobalt-medical-theft` → entities: `cobalt-60-accident` (place)
- `cobalt-foundry-melting` → entities: `cobalt-60-accident` (place)
- `annihilator-christmas-massacre` → entities: `servant-girl-annihilator` (concept)
- `annihilator-moonlight-tower` → entities: `servant-girl-annihilator` (concept), `moonlight-towers` (place)
- `annihilator-gracie-vance` → entities: `servant-girl-annihilator` (concept)
- `armadillo-wooldridge-poster` → entities: `armadillo-world-hq` (place)
- `armadillo-venue-site` → entities: `armadillo-world-hq` (place)
- `junk-cathedral-site` → entities: `cathedral-of-junk` (place)
- `junk-city-hall-hearing` → entities: `cathedral-of-junk` (place)
- `bats-congress-bridge` → entities: `mexican-free-tailed-bats` (concept), `congress-avenue-bats` (place)
- `driskill-room-525` → entities: `driskill-hotel` (place)
- `bats-bci-saves-colony` → entities: `bat-conservation-international` (organization), `congress-avenue-bats` (place)
- `menger-hotel-opening` → entities: `menger-hotel-rough-riders` (place)
- `menger-sallie-white` → entities: `menger-hotel-rough-riders` (place)
- `bonnell-lady-bird-view` → entities: `mount-bonnell-austin` (place)
- `bikini-crossroads-baker` → entities: `manhattan-project` (concept)
- `bikini-castle-bravo` → entities: `manhattan-project` (concept)
- `enewetak-ivy-mike` → entities: `manhattan-project` (concept)
- `enewetak-runit-dome` → entities: `manhattan-project` (concept)
- `nts-atmospheric-era` → entities: `manhattan-project` (concept)
- `cemetery-hogg-burial` → entities: `texas-state-cemetery` (place)
- `cemetery-john-connally` → entities: `texas-state-cemetery` (place)
- `cemetery-ann-richards` → entities: `texas-state-cemetery` (place)
- `cemetery-johnston-monument` → entities: `texas-state-cemetery` (place)
- `nts-sedan-crater` → entities: `manhattan-project` (concept)
- `johnston-starfish-prime` → entities: `manhattan-project` (concept)
- `amchitka-cannikin` → entities: `manhattan-project` (concept)
- `beatles-rooftop-concert` → entities: `the-beatles` (organization)
- `cobalt-junkyard-crush` → entities: `cobalt-60-accident` (place)
- `beatles-record-sgt-peppers-abbey-road` → entities: `the-beatles` (organization)
- `cemetery-james-michener` → entities: `texas-state-cemetery` (place)
- `driskill-poker-loss` → entities: `driskill-hotel` (place)
- `armadillo-final-concert` → entities: `armadillo-world-hq` (place)

---

## Bucket D: No Entity Tags (399 moments)

These orphans have no `entityIds` at all. They need entity tagging before they can be wired to any story.

### All Bucket D Moment IDs

- `may-68-barricades`
- `tokugawa-edo-shogunate`
- `macarthur-meets-hirohito`
- `leonardo-paints-last-supper-milan-1495`
- `art-of-war-bamboo-slips-discovered-at-yinqueshan`
- `globe-theatre-opens-southwark-1599`
- `augustine-born-thagaste-354`
- `trinity-site`
- `first-folio-published-london-1623`
- `augustine-baptized-milan-387`
- `augustine-meets-ambrose-milan-384`
- `leonardo-paints-mona-lisa-florence-1503`
- `leonardo-dies-amboise-france-1519`
- `mao-born-shaoshan`
- `ohenry-federal-trial`
- `leonardo-apprenticed-verrocchio-florence-1466`
- `ohenry-land-office`
- `wu-defeats-chu-at-battle-of-boju`
- `suleiman-dies-during-siege-of-szigetvar`
- `thales-named-first-of-seven-sages-at-delphi`
- `galileo-demonstrates-telescope-venice-1609`
- `leonardo-arrives-milan-sforza-1482`
- `emperor-wu-han-confucianism-official`
- `hannibal-swears-oath-against-rome`
- `leonardo-qualifies-guild-saint-luke-1472`
- `scholz-opening-1866`
- `leonardo-invited-france-amboise-1516`
- `leonardo-dies-amboise-1519`
- `vla-site`
- `hannibal-defeated-at-battle-of-zama`
- `alexander-founds-alexandria-egypt`
- `ohenry-petes-tavern`
- `alexander-born-pella`
- `rp-dexter-church`
- `february-26-incident`
- `alexander-destroys-thebes`
- `alexander-battle-of-hydaspes`
- `angel-gabriel-foretells-johns-birth-in-jerusalem-temple`
- `rp-detroit-home`
- `alexander-battle-of-issus`
- `alexander-dies-babylon`
- `hastings-norman-conquest`
- `sikhote-alin`
- `cyrus-conquers-babylon-frees-jews`
- `cyrus-dies-battle-massagetae`
- `octavian-accepts-caesars-will-brundisium`
- `alexander-ulyanov-executed-1887`
- `octavian-becomes-youngest-consul-rome`
- `varanasi-ganges`
- `cyrus-founds-pasargadae-capital`
- `chelyabinsk-meteor`
- `srv-antones-6th`
- `hannibal-dies-by-poison-bithynia`
- `totsk-snowball`
- `cyrus-tomb-pasargadae`
- `palace-santa-fe`
- `rp-arrest-site`
- `stalingrad-encirclement`
- `cyrus-born-anshan-persis`
- `ohenry-chelsea-hotel`
- `pokhran-shakti`
- `willie-dripping-picnic`
- `october-revolution-winter-palace-1917`
- `manicouagan-crater`
- `hoba-meteorite`
- `howard-carter-discovers-tomb-kv62`
- `masada-fortress`
- `waterloo-napoleon`
- `cyrus-defeats-astyages-median-empire`
- `hannibal-crosses-the-alps-with-elephants`
- `thriller-wins-8-grammys-record-single-night`
- `thermopylae-last-stand`
- `hernani-riots-comedie-francaise`
- `london-great-fire`
- `trafalgar-nelson`
- `yorktown-surrender`
- `verdun-attrition`
- `galileo-dies-under-house-arrest-arcetri-1642`
- `galileo-discovers-jupiters-moons-1610`
- `galileo-born-pisa-1564`
- `galileo-publishes-dialogue-two-chief-world-systems-1632`
- `pueblo-palace`
- `toc-downtown`
- `pueblo-bonito`
- `mesilla-plaza`
- `tb-chi-omega`
- `tb-lake-sammamish`
- `tb-florida-prison`
- `eiffel-tower-opens`
- `first-impressionist-exhibition`
- `plan-east-avenue`
- `plan-wheatville-school`
- `ohenry-first-national-bank`
- `ohenry-morley-brothers`
- `ohenry-austin-jail`
- `meiji-shrine-built`
- `ohenry-scholz-garden`
- `godzilla-premieres-tokyo`
- `tokyo-1964-olympics`
- `aum-sarin-attack`
- `willie-luck-ranch`
- `queen-milam-park`
- `queen-military-plaza`
- `willie-abbott-birth`
- `willie-nashville-fire`
- `paramount-majestic-opening`
- `paramount-near-death`
- `paramount-film-revival`
- `scholz-political-backroom`
- `scholz-longhorn-tradition`
- `ohenry-marriage-athol`
- `ohenry-greensboro-birth`
- `ohenry-honduras-exile`
- `ohenry-ohio-pen`
- `ohenry-new-york-death`
- `ohenry-rolling-stone`
- `ohenry-irving-place`
- `ohenry-furnished-room`
- `ohenry-second-marriage`
- `christmas-island-grapple`
- `semi-first-lightning`
- `semi-lake-chagan`
- `novaya-tsar-bomba`
- `montebello-hurricane`
- `emu-field-black-mist`
- `maralinga-tests`
- `reggane-gerboise-bleue`
- `in-ekker-beryl`
- `mururoa-tests`
- `lop-nur-596`
- `lop-nur-thermonuclear`
- `pokhran-smiling-buddha`
- `ras-koh-chagai`
- `punggye-ri-first-test`
- `punggye-ri-thermonuclear`
- `tunguska-event`
- `vredefort-crater`
- `sudbury-basin`
- `chesapeake-bay-crater`
- `popigai-crater`
- `barringer-meteor-crater`
- `wolfe-creek-crater`
- `gosses-bluff`
- `lonar-lake`
- `kaali-crater`
- `pingualuit-crater`
- `campo-del-cielo`
- `siljan-ring`
- `tswaing-crater`
- `western-wall`
- `via-dolorosa`
- `qumran-scrolls`
- `mecca-kaaba`
- `medina-prophets-mosque`
- `bodh-gaya-temple`
- `vatican-st-peters`
- `santiago-compostela`
- `mount-kailash`
- `angkor-wat`
- `hagia-sophia`
- `noahs-ark-ararat`
- `sodom-gomorrah-destruction`
- `samson-gaza-temple`
- `tower-of-babel`
- `agincourt-longbow`
- `isandlwana-zulu`
- `dien-bien-phu-siege`
- `gettysburg-pickett`
- `little-bighorn-custer`
- `somme-first-day`
- `normandy-dday`
- `el-alamein-montgomery`
- `iwo-jima-suribachi`
- `got-fort-lovrijenac`
- `shelley-writes-frankenstein-diodati`
- `got-dubrovnik-city-walls`
- `peter-great-founds-petersburg`
- `princes-tower-disappear`
- `london-great-plague`
- `rosetta-stone-british-museum`
- `got-jesuit-staircase`
- `st-pauls-blitz`
- `keats-dies-spanish-steps`
- `allies-liberate-rome`
- `got-trsteno-arboretum`
- `paris-commune-tuileries`
- `got-azure-window`
- `treaty-versailles`
- `notre-dame-fire`
- `great-fire-meireki`
- `47-ronin-sengakuji`
- `emperor-meiji-moves-tokyo`
- `great-kanto-earthquake`
- `tolkien-writes-lord-of-rings-northmoor`
- `anne-frank-writes-diary-prinsengracht`
- `tokyo-firebombing`
- `hirohito-surrender-broadcast`
- `got-diocletian-palace`
- `rowling-writes-potter-elephant-house`
- `orwell-writes-1984-barnhill-jura`
- `brinks-mat-heathrow`
- `got-klis-fortress`
- `austen-revises-pride-prejudice-chawton`
- `crown-jewels-tower-london`
- `got-castle-ward`
- `brontes-write-jane-eyre-wuthering-heights-haworth`
- `kerouac-types-on-the-road-chelsea-scroll`
- `got-dark-hedges`
- `athens-1896-first-modern-olympics`
- `antwerp-diamond-heist`
- `securitas-depot-tonbridge`
- `inv-amazon-garage`
- `got-ballintoy-harbour`
- `jesse-owens-four-golds-berlin-1936`
- `hannibal-destroys-roman-army-lake-trasimene`
- `db-cooper-portland-airport`
- `inv-fleming-penicillin`
- `inv-nobel-dynamite`
- `got-grjotagja-cave`
- `ruth-called-shot-wrigley-1932`
- `got-thingvellir`
- `proust-writes-recherche-boulevard-haussmann`
- `banco-central-fortaleza`
- `inv-eniac-computer`
- `inv-spinning-jenny`
- `bannister-four-minute-mile-oxford-1954`
- `fitzgerald-writes-great-gatsby-great-neck`
- `mona-lisa-theft-louvre`
- `inv-apple-garage`
- `got-alcazar-seville`
- `jackie-robinson-debut-ebbets-1947`
- `gardner-museum-heist`
- `ucb-laguna-niguel-burglary`
- `inv-marconi-radio`
- `inv-hp-garage`
- `got-girona-cathedral`
- `great-train-robbery-bridego`
- `norrmalmstorg-kreditbanken`
- `inv-google-garage`
- `got-mdina`
- `secretariat-belmont-triple-crown-1973`
- `hatton-garden-burglary`
- `great-train-robbery-cheddington`
- `inv-farnsworth-tv`
- `lufthansa-heist-jfk`
- `inv-bell-telephone`
- `harry-winston-paris-heist`
- `inv-ford-assembly-line`
- `inv-jenner-vaccination`
- `got-ait-benhaddou`
- `got-doune-castle`
- `inv-watt-soho`
- `suleiman-captures-baghdad`
- `inv-transistor-bell-labs`
- `munich-massacre-connollystrasse-1972`
- `ali-assassinated-by-kharijite-at-kufa-mosque`
- `billie-jean-king-battle-sexes-astrodome-1973`
- `inv-www-cern`
- `suleiman-born-in-trabzon`
- `inv-niepce-photograph`
- `hank-aaron-715-atlanta-1974`
- `thales-calculates-pyramid-heights-in-egypt`
- `comaneci-perfect-10-montreal-forum-1976`
- `devils-island-dreyfus`
- `miracle-on-ice-lake-placid-1980`
- `poe-gets-court-martialed-at-west-point`
- `suleiman-destroys-hungarian-army-at-mohacs`
- `eastern-state-capone-cell`
- `maradona-hand-of-god-azteca-1986`
- `bastille-storming-1789`
- `poe-publishes-the-raven`
- `suleiman-fails-to-take-vienna`
- `ali-liston-miami-beach-convention-1964`
- `lubyanka-solzhenitsyn`
- `mary-leakey-finds-laetoli-footprints`
- `jordan-last-shot-delta-center-1998`
- `alcatraz-capone-arrives`
- `poe-born-to-actors-in-boston`
- `hanoi-hilton-mccain`
- `johanson-finds-lucy`
- `usain-bolt-958-berlin-2009`
- `thales-predicts-solar-eclipse`
- `alcatraz-1962-escape`
- `poe-marries-13-year-old-cousin`
- `spandau-hess-sole-prisoner`
- `turkana-boy-nariokotome`
- `leicester-city-premier-league-2016`
- `mao-dies-beijing`
- `disneyland-opens-anaheim`
- `poe-found-delirious-dies-in-baltimore`
- `mao-cofounds-ccp-shanghai`
- `tiger-woods-masters-comeback-augusta-2019`
- `tower-london-thomas-more`
- `sing-sing-rosenbergs-execution`
- `chateau-dif-mirabeau`
- `mary-anning-finds-ichthyosaur`
- `ali-serves-as-muhammads-decoy-during-hijra`
- `ali-defeats-rebels-at-battle-of-the-camel`
- `san-quentin-cash-concert`
- `joggins-hylonomus-discovery`
- `ali-fights-muawiya-at-battle-of-siffin`
- `brothers-poem-discovered-on-papyrus`
- `walcott-discovers-burgess-shale`
- `cook-born-marton-yorkshire`
- `homo-naledi-rising-star`
- `archaeopteryx-solnhofen`
- `sue-rex-hendrickson`
- `cook-claims-eastern-australia`
- `mao-discovers-marxism-peking-university`
- `sprigg-finds-ediacaran-life`
- `shubin-finds-tiktaalik`
- `mao-takes-command-long-march`
- `mary-leakey-finds-zinjanthropus`
- `ibrahim-spinosaurus-morocco`
- `cook-charts-st-lawrence-quebec`
- `la-brea-systematic-excavation`
- `lepenski-vir-founding`
- `cook-first-voyage-endeavour-departs`
- `messel-pit-scientific-excavation`
- `catalhoyuk-settlement-peak`
- `cook-killed-kealakekua-bay`
- `mohenjo-daro-peak`
- `ali-born-possibly-inside-the-kaaba`
- `william-wins-battle-of-val-es-dunes`
- `caral-pyramid-construction`
- `gobekli-tepe-construction`
- `skara-brae-occupation`
- `fdr-born-hyde-park`
- `jericho-first-settlement`
- `akrotiri-minoan-settlement`
- `fdr-paralyzed-campobello`
- `banpo-village-founding`
- `william-is-crowned-king-on-christmas-day`
- `great-zimbabwe-peak`
- `william-orders-the-domesday-book`
- `mehrgarh-first-farmers`
- `eridu-first-temple`
- `seneca-forced-suicide-rome`
- `pink-floyd-record-dark-side-abbey-road`
- `uruk-first-city`
- `elvis-records-thats-all-right-sun-studio`
- `fdr-inaugurated-new-deal`
- `poverty-point-construction`
- `fdr-dies-warm-springs`
- `prince-mixes-purple-rain-sunset-sound`
- `mesa-verde-cliff-dwellings`
- `eagles-record-hotel-california-criteria`
- `r66-chicago-terminus-opens`
- `charles-v-born-ghent`
- `fdr-requests-declaration-of-war-pearl-harbor`
- `million-dollar-quartet-sun-studio`
- `charles-v-abdicates-brussels`
- `william-defeats-harold-at-battle-of-hastings`
- `bowie-records-heroes-hansa-berlin`
- `r66-sundown-town-stroud-oklahoma`
- `charles-v-troops-sack-rome`
- `u2-begin-achtung-baby-hansa-berlin`
- `r66-grapes-of-wrath-published`
- `r66-decertification-1985`
- `rolling-stones-record-sticky-fingers-muscle-shoals`
- `elvis-records-nashville-rca-studio-b`
- `r66-meramec-caverns-barnstorming`
- `francis-receives-stigmata-la-verna`
- `r66-santa-monica-endpoint`
- `hendrix-builds-electric-lady-studios`
- `charles-v-dies-yuste`
- `r66-gable-lombard-kingman-wedding`
- `bee-gees-record-saturday-night-fever-criteria`
- `francis-founds-franciscan-order`
- `r66-amblers-texaco-opens`
- `r66-blue-swallow-motel-opens`
- `acdc-records-back-in-black-compass-point`
- `r66-chain-of-rocks-opens`
- `francis-meets-sultan-egypt`
- `r66-budville-murders`
- `grace-jones-records-nightclubbing-compass-point`
- `r66-tulsa-massacre-greenwood`
- `r66-cadillac-ranch-installed`
- `wailers-record-simmer-down-studio-one-kingston`
- `r66-dust-bowl-begins-sallisaw`
- `r66-okc-bombing`
- `r66-number-chosen-springfield`
- `r66-wigwam-motel-closed-bypass`
- `peter-great-captures-azov`
- `peter-great-dies-winter-palace`
- `peter-great-born-moscow`
- `peter-great-works-dutch-shipyard`
- `r66-williams-arizona-last-bypass`
- `seneca-exiled-corsica`
- `r66-will-rogers-highway-plaque`
- `daniel-lions-den`
- `seneca-born-cordoba`
- `midway-ambush`
- `nordlinger-ries`
- `plan-city-hall`
- `srv-auditorium-shores`
- `dreyfus-degraded`
- `antonine-plague-devastates-rome`
- `jonah-nineveh`

---

## Bucket E: Other / Edge Cases (1 moments)

- `aretha-franklin-records-i-never-loved-fame` — Entity ID(s) not found in entities.ts: aretha-franklin
