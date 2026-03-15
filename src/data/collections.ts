import type { StoryCollection } from '../types';

export const collections: StoryCollection[] = [
  {
    id: 'famous-assassinations',
    name: 'Famous Assassination Sites',
    subtitle: 'The exact locations where political leaders and civil rights figures were killed',
    description: 'Ford\'s Theatre, Dealey Plaza, the Lorraine Motel, the Audubon Ballroom — the buildings, balconies, and streets where assassinations changed history.',
    momentIds: ['la-fords-theatre', 'la-petersen-house', 'la-garrett-farm', 'jfk-dealey-plaza', 'jfk-parkland', 'jfk-texas-theatre', 'mlk-lorraine-motel', 'mlk-sniper-nest', 'mx-audubon', 'colosio-lomas-taurinas'],
    tags: ['assassination', 'political', 'dark-history'],
  },
  {
    id: 'nuclear-weapon-sites',
    name: 'Nuclear Weapon Detonation and Test Sites',
    subtitle: 'Every place a nuclear weapon was built, tested, or dropped',
    description: 'From the secret labs of Los Alamos to the Trinity crater to Hiroshima ground zero — the physical locations of the atomic age.',
    momentIds: [
      // Manhattan Project & WWII
      'lanl-lab', 'tri-ground-zero', 'tri-mcdonald-ranch', 'tri-control-bunker', 'trinity-site',
      'hnb-hiroshima-hypocenter', 'hnb-nagasaki-hypocenter', 'hnb-tinian-island',
      // US — Bikini Atoll
      'bikini-crossroads-baker', 'bikini-castle-bravo',
      // US — Enewetak Atoll
      'enewetak-ivy-mike', 'enewetak-runit-dome',
      // US — Nevada Test Site
      'nts-atmospheric-era', 'nts-sedan-crater',
      // US — Pacific & Remote
      'johnston-starfish-prime', 'amchitka-cannikin', 'christmas-island-grapple',
      // US — Damascus Mishap
      'dtm-silo-site', 'dtm-warhead-impact', 'dtm-little-rock-afb',
      // Soviet — Semipalatinsk
      'semi-first-lightning', 'semi-lake-chagan',
      // Soviet — Novaya Zemlya
      'novaya-tsar-bomba',
      // Soviet — Totsk
      'totsk-snowball',
      // British — Australia
      'montebello-hurricane', 'emu-field-black-mist', 'maralinga-tests',
      // French — Sahara & Pacific
      'reggane-gerboise-bleue', 'in-ekker-beryl', 'mururoa-tests',
      // Chinese — Lop Nur
      'lop-nur-596', 'lop-nur-thermonuclear',
      // India — Pokhran
      'pokhran-smiling-buddha', 'pokhran-shakti',
      // Pakistan — Ras Koh
      'ras-koh-chagai',
      // North Korea — Punggye-ri
      'punggye-ri-first-test', 'punggye-ri-thermonuclear',
    ],
    tags: ['nuclear', 'manhattan-project', 'cold-war', 'weapons'],
  },
  {
    id: 'serial-killer-crime-scenes',
    name: 'Serial Killer Crime Scenes in America',
    subtitle: 'The homes, hunting grounds, and burial sites of America\'s most notorious serial killers',
    description: 'Crime scenes, courthouses, prisons, and dump sites tied to Ed Gein, Dahmer, Bundy, the Zodiac, Gacy, and Austin\'s Servant Girl Annihilator.',
    momentIds: ['gein-farm', 'gein-worden-store', 'gein-cemetery', 'gein-school', 'gein-tavern', 'gein-mendota', 'dahmer-apartment', 'dahmer-chocolate-factory', 'dahmer-first-victim', 'dahmer-columbia-prison', 'tb-chi-omega', 'tb-lake-sammamish', 'tb-florida-prison', 'zk-blue-rock', 'zk-lake-berryessa', 'zk-stine-murder', 'jwg-house-site', 'jwg-greyhound', 'jwg-des-plaines-bridge', 'annihilator-mollie-smith', 'annihilator-christmas-massacre', 'annihilator-moonlight-tower', 'annihilator-eliza-shelley', 'annihilator-o-henry-letter', 'annihilator-gracie-vance'],
    tags: ['serial-killer', 'true-crime', 'dark-history'],
  },
  {
    id: 'civil-rights-landmarks',
    name: 'Civil Rights Movement Landmarks',
    subtitle: 'The streets, schools, buses, and churches where the civil rights movement happened',
    description: 'Where Rosa Parks refused to move, where the Little Rock Nine walked through a mob, where Harriet Tubman led escapes, and where segregation was enforced and fought.',
    momentIds: ['rp-arrest-site', 'rp-dexter-church', 'rp-detroit-home', 'lrn-central-high', 'lrn-bates-house', 'lrn-capitol-standoff', 'mlk-birth-home', 'mlk-morehouse', 'mlk-dexter-church', 'htb-bucktown-store', 'htb-combahee-river', 'htb-auburn-home', 'btw-virginia-birth', 'btw-hampton-entrance', 'btw-tuskegee-founding', 'btw-atlanta-compromise', 'btw-white-house-dinner', 'plan-city-hall', 'plan-east-avenue', 'plan-wheatville-school'],
    tags: ['civil-rights', 'racial-justice', 'activism'],
  },
  {
    id: 'aviation-disasters',
    name: 'Aviation Disasters and Disappearances',
    subtitle: 'Crash sites, debris fields, and memorials of notable plane crashes and vanished aircraft',
    description: 'From Amelia Earhart vanishing over the Pacific to TWA 800 exploding over Long Island to Flight 93 in Shanksville — where aviation met tragedy.',
    momentIds: ['ae-harbour-grace', 'ae-lae-airfield', 'ae-howland-island', 'twa-smith-point', 'twa-impact-zone', 'twa-calverton', 'vj-memorial', 'vj-crash-site', 'vj-sabretech', 'f93-impact', 'f93-tower', 'f93-newark', 'norman-petty-studios'],
    tags: ['aviation', 'disaster', 'crash'],
  },
  {
    id: 'massacre-sites',
    name: 'Sites of Massacres and Mass Racial Violence',
    subtitle: 'Locations of massacres, race riots, and mass violence in the Americas',
    description: 'The neighborhoods burned, the fields where troops opened fire, and the communities destroyed — Tulsa, Wounded Knee, Sand Creek, Rosewood, and beyond.',
    momentIds: ['tulsa-greenwood', 'tulsa-drexel', 'wkm-monument', 'wkm-mass-grave', 'wkm-pine-ridge-agency', 'scm-historic-site', 'scm-denver-capitol', 'scm-chivington-town', 'rwm-wright-house', 'rwm-sumner-mill', 'rwm-cedar-key-rail', 'waco-horror-courthouse', 'waco-horror-square', 'torreon-plaza-massacre'],
    tags: ['massacre', 'racial-violence', 'hidden-history'],
  },
  {
    id: 'outlaw-gunfighter-sites',
    name: 'Outlaw and Gunfighter Sites of the American West',
    subtitle: 'Jailbreaks, ambush sites, hideouts, and graves of Old West outlaws and Depression-era bandits',
    description: 'Billy the Kid, Geronimo, Bonnie & Clyde, Pancho Villa — the courthouses, canyons, and crossroads where outlaws lived and died.',
    momentIds: ['btk-courthouse-escape', 'btk-death', 'btk-tunstall-store', 'geronimo-skeleton-canyon', 'baca-standoff', 'columbus-raid', 'bac-filling-station', 'bac-grapevine-site', 'bac-western-heights'],
    tags: ['outlaw', 'old-west', 'frontier', 'gangster'],
  },
  {
    id: 'archaeological-discoveries-americas',
    name: 'Archaeological Discoveries of the Americas',
    subtitle: 'Ancient ruins, fossil sites, and archaeological finds across North and Central America',
    description: 'From 23,000-year-old human footprints at White Sands to the mercury rivers beneath Teotihuacan to Pakal\'s jade death mask — the oldest things on the continent.',
    momentIds: ['white-sands-prints', 'pueblo-bonito', 'blackwater-draw', 'hawikku', 'pakal-temple-inscriptions', 'pakal-museum-anthropology', 'tomb-7-discovery', 'tomb-7-museum', 'teotihuacan-tunnel-entrance', 'teotihuacan-mercury-chamber', 'chichen-el-castillo-equinox', 'chichen-sacred-cenote', 'chichen-thompson-dredging', 'olmec-tres-zapotes-discovery', 'olmec-san-lorenzo', 'olmec-la-venta-museum', 'teotihuacan-pyramid-sun', 'teotihuacan-avenue-dead', 'teotihuacan-burning'],
    tags: ['archaeology', 'ancient-history', 'indigenous', 'mesoamerican'],
  },
  {
    id: 'historical-figure-biographies',
    name: 'Birthplaces, Homes, and Graves of Historical Figures',
    subtitle: 'Where famous people were born, lived, worked, and died — traced on the map',
    description: 'Full life arcs of Lincoln, JFK, MLK, the Wright Brothers, Oppenheimer, Rosa Parks, Harriet Tubman, and others — from birthplace to grave.',
    momentIds: ['lin-birthplace', 'lin-new-salem', 'lin-state-capitol', 'jfk-birthplace', 'jfk-choate', 'jfk-hammersmith', 'mlk-birth-home', 'mlk-morehouse', 'mlk-dexter-church', 'wb-bicycle-shop', 'wb-kitty-hawk', 'wb-huffman-prairie', 'jro-berkeley', 'jro-tech-area', 'jro-princeton-ias', 'rp-arrest-site', 'rp-dexter-church', 'rp-detroit-home', 'htb-bucktown-store', 'htb-combahee-river', 'htb-auburn-home', 'btw-virginia-birth', 'btw-hampton-entrance', 'btw-tuskegee-founding', 'btw-atlanta-compromise', 'btw-white-house-dinner', 'ohenry-greensboro-birth', 'ohenry-morley-brothers', 'ohenry-scholz-garden', 'ohenry-land-office', 'ohenry-marriage-athol', 'annihilator-o-henry-letter', 'ohenry-rolling-stone', 'ohenry-first-national-bank', 'ohenry-honduras-exile', 'ohenry-federal-trial', 'ohenry-ohio-pen', 'ohenry-irving-place', 'ohenry-furnished-room', 'ohenry-petes-tavern', 'ohenry-second-marriage', 'ohenry-chelsea-hotel', 'ohenry-new-york-death'],
    tags: ['biography', 'birthplace', 'grave', 'life-story'],
  },
  {
    id: 'music-venues',
    name: 'Music Venues and the Performances That Made Them Famous',
    subtitle: 'Studios, honky-tonks, and stages where legendary music was played or recorded',
    description: 'The Armadillo World Headquarters, the Victory Grill\'s chitlin\' circuit, Buddy Holly\'s studio, the Broken Spoke — places that shaped American music.',
    momentIds: ['willie-abbott-birth', 'willie-nashville-fire', 'armadillo-willie-1972', 'willie-dripping-picnic', 'willie-luck-ranch', 'armadillo-wooldridge-poster', 'armadillo-venue-site', 'armadillo-final-concert', 'victory-grill-opening', 'victory-doris-miller', 'victory-charlies-playhouse', 'spoke-opening-night', 'spoke-george-strait', 'spoke-survival-battle', 'srv-antones-6th', 'srv-auditorium-shores', 'norman-petty-studios', 'paramount-majestic-opening', 'paramount-near-death', 'paramount-film-revival'],
    tags: ['music', 'venue', 'performance', 'arts-culture'],
  },
  {
    id: 'ufo-sightings-crash-sites',
    name: 'UFO Sightings and Alleged Crash Sites',
    subtitle: 'Locations of notable UFO sightings, alleged crashes, and government investigations',
    description: 'Roswell, the Coyame incident, Mexico\'s military FLIR footage, the Marfa lights, and the 1991 Mexico City eclipse sightings.',
    momentIds: ['roswell-debris-field', 'roswell-airfield', 'coyame-crash-site', 'coyame-toxic-convoy', 'marfa-viewing-area', 'eclipse-ufo-zocalo', 'eclipse-ufo-pyramids', 'diaz-ajusco-sighting', 'diaz-press-demonstration', 'flir-campeche-skies', 'flir-press-conference'],
    tags: ['ufo', 'paranormal', 'mystery-unexplained'],
  },
  {
    id: 'unsolved-disappearances',
    name: 'Unsolved Disappearances and Unexplained Phenomena',
    subtitle: 'Missing persons, vanished islands, and places where strange things happen',
    description: 'An island that disappeared from maps, a scientist who vanished without a trace, a zone where radios go silent, and other genuinely unexplained cases.',
    momentIds: ['bermeja-mapped-existence', 'bermeja-navy-search', 'zone-silence-impact', 'zone-silence-ceballos', 'grinberg-home-disappearance', 'grinberg-unam-lab', 'monchito-rubble-site', 'stranger-planting-site', 'stranger-vatican-relic', 'sabina-first-velada', 'sabina-home-arson'],
    tags: ['disappearance', 'unsolved', 'unexplained', 'mystery'],
  },
  {
    id: 'mexico-political-assassinations',
    name: 'Political Assassinations, Coups, and Uprisings in Mexico',
    subtitle: 'The plazas, prisons, and podiums where Mexican political power was seized or destroyed',
    description: 'From the execution of Emperor Maximilian to the Tlatelolco student massacre to the Colosio assassination — political violence across Mexican history.',
    momentIds: ['colosio-lomas-taurinas', 'maximilian-convent-prison', 'maximilian-firing-squad', 'tlatelolco-flare-signal', 'tlatelolco-chihuahua-snipers', 'tlatelolco-church-sanctuary', 'guerrero-acapulco-lure', 'guerrero-la-entrega', 'guerrero-cuilapan-execution', 'diaz-convent-escape', 'diaz-battle-miahuatlan', 'marcos-san-cristobal', 'marcos-unmasking'],
    tags: ['mexico', 'political', 'assassination', 'uprising'],
  },
  {
    id: 'meteorite-impact-craters',
    name: 'Meteorite Impact Craters and Impact Sites',
    subtitle: 'Craters, strewn fields, and blast zones where objects from space struck the Earth',
    description: 'From the buried crater that killed the dinosaurs to the Arizona hole where Apollo astronauts trained — every confirmed place where something from space hit the ground.',
    momentIds: [
      'chicxulub-crater', 'tunguska-event', 'chelyabinsk-meteor',
      'vredefort-crater', 'sudbury-basin', 'manicouagan-crater', 'popigai-crater', 'chesapeake-bay-crater',
      'barringer-meteor-crater', 'nordlinger-ries', 'wolfe-creek-crater', 'gosses-bluff', 'lonar-lake', 'kaali-crater', 'pingualuit-crater',
      'hoba-meteorite', 'campo-del-cielo', 'sikhote-alin', 'siljan-ring', 'tswaing-crater',
    ],
    tags: ['meteorite', 'impact-crater', 'geology', 'space'],
  },
  {
    id: 'sacred-pilgrimage-sites',
    name: 'Sacred Sites and Pilgrimage Destinations',
    subtitle: 'Temples, churches, mosques, and mountains where billions have prayed, walked, and wept',
    description: 'From the tomb of Jesus to the Kaaba to the tree where the Buddha found enlightenment — the holiest places on Earth, mapped.',
    momentIds: [
      // Jerusalem
      'holy-sepulchre', 'western-wall', 'dome-of-the-rock', 'garden-gethsemane', 'via-dolorosa',
      // Holy Land
      'church-nativity', 'capernaum-galilee', 'mount-sinai-monastery', 'jordan-river-baptism', 'nazareth-annunciation', 'qumran-scrolls', 'masada-fortress',
      // Islamic
      'mecca-kaaba', 'medina-prophets-mosque',
      // Catholic
      'vatican-st-peters', 'santiago-compostela', 'lourdes-sanctuary', 'fatima-sanctuary',
      // Eastern
      'bodh-gaya-temple', 'varanasi-ganges', 'mount-kailash', 'angkor-wat', 'hagia-sophia',
      // Guadalupe
      'guadalupe-tepeyac-apparition', 'guadalupe-tilma-reveal', 'guadalupe-new-basilica',
      // Cristero + Day of the Dead
      'cristero-cubilete-monument', 'dotd-janitzio-vigil',
    ],
    tags: ['religion', 'pilgrimage', 'sacred', 'holy-land'],
  },
  {
    id: 'biblical-events',
    name: 'Biblical Events and Locations',
    subtitle: 'Where the events of the Bible actually happened — from Genesis to Acts, mapped',
    description: 'The birth of Jesus, the parting of the Red Sea, Paul\'s shipwreck, David and Goliath, the Tower of Babel, and dozens more — the specific places where biblical events occurred, traced across the ancient world.',
    momentIds: [
      // Jesus's Ministry
      'jesus-born-bethlehem', 'holy-family-egypt', 'nazareth-annunciation',
      'jordan-river-baptism', 'jesus-temptation-wilderness', 'jesus-cana-wedding',
      'capernaum-galilee', 'jesus-sermon-mount', 'jesus-feeds-five-thousand',
      'jesus-walks-water', 'jesus-transfiguration', 'jesus-raises-lazarus',
      'jesus-triumphal-entry', 'jesus-last-supper', 'garden-gethsemane',
      'jesus-crucified-golgotha', 'jesus-resurrection', 'jesus-ascension-olives',
      // Moses and the Exodus
      'moses-born-nile', 'moses-burning-bush', 'moses-plagues-egypt',
      'moses-crosses-red-sea', 'moses-ten-commandments', 'moses-golden-calf',
      'moses-twelve-spies', 'moses-water-meribah', 'moses-death-nebo',
      // Paul's Missionary Journeys
      'paul-conversion-damascus', 'paul-antioch-commission', 'paul-cyprus-paphos',
      'paul-pisidian-antioch', 'paul-lystra-stoned', 'paul-philippi-prison',
      'paul-athens-areopagus', 'paul-corinth-gallio', 'paul-ephesus-riot',
      'paul-arrest-jerusalem', 'paul-shipwreck-malta', 'paul-arrives-rome',
      // Abraham's Journey
      'abraham-leaves-ur', 'abraham-haran', 'abraham-shechem',
      'abraham-lot-separation', 'abraham-covenant', 'abraham-binding-isaac',
      'abraham-machpelah',
      // King David
      'david-anointed-bethlehem', 'david-goliath-elah', 'david-flees-ein-gedi',
      'david-captures-jerusalem', 'david-ark-jerusalem', 'david-bathsheba',
      'david-death-jerusalem',
      // Standalone Biblical Events
      'noahs-ark-ararat', 'tower-of-babel', 'sodom-gomorrah-destruction',
      'jericho-walls-fall', 'samson-gaza-temple', 'elijah-carmel-fire',
      'jonah-nineveh', 'daniel-lions-den',
    ],
    tags: ['bible', 'christianity', 'judaism', 'holy-land', 'sacred-history'],
  },
  {
    id: 'famous-battlefields',
    name: 'Famous Battlefields',
    subtitle: 'The fields, beaches, passes, and ridges where history was decided by force',
    description: 'From Thermopylae to Normandy, the specific places where armies clashed and the course of civilization changed. Twenty-one battlefields across six continents and three millennia.',
    momentIds: [
      // Ancient World
      'thermopylae-last-stand', 'gaugamela-alexander', 'cannae-hannibal',
      // Medieval
      'hastings-norman-conquest', 'agincourt-longbow', 'tenochtitlan-fall',
      // Wars of Empire
      'trafalgar-nelson', 'waterloo-napoleon', 'isandlwana-zulu', 'dien-bien-phu-siege',
      // American Battlefields
      'yorktown-surrender', 'gettysburg-pickett', 'little-bighorn-custer',
      // World War I
      'somme-first-day', 'verdun-attrition', 'gallipoli-anzac',
      // World War II
      'normandy-dday', 'stalingrad-encirclement', 'midway-ambush', 'el-alamein-montgomery', 'iwo-jima-suribachi',
    ],
    tags: ['battle', 'war', 'military', 'history'],
  },
  {
    id: 'notable-people',
    name: 'History\'s Most Notable People',
    subtitle: 'The most dramatic moments in the lives of the most famous humans who ever lived',
    description: 'Gandhi picking up salt, Einstein rewriting physics as a patent clerk, Caesar stabbed by his friends, Genghis Khan uniting the Mongols — one defining moment for each of 33 of history\'s most globally recognized figures.',
    momentIds: [
      // Revolutionary Leaders
      'gandhi-salt-march', 'mandela-robben-island', 'bolivar-liberates-bogota',
      'che-guevara-executed', 'castro-enters-havana', 'mao-proclaims-prc',
      'ataturk-founds-republic', 'indira-gandhi-assassinated',
      'dalai-lama-flees-tibet', 'aung-san-suu-kyi-house-arrest',
      // Empire Builders
      'genghis-khan-unites-mongols', 'peter-great-founds-petersburg', 'julius-caesar-assassinated',
      // Thinkers and Sages
      'plato-founds-academy', 'confucius-teaches-qufu', 'avicenna-canon-medicine', 'rumi-settles-konya',
      // Scientists
      'da-vinci-last-supper', 'galileo-faces-inquisition', 'einstein-publishes-relativity', 'marie-curie-discovers-radium',
      // Literary Titans
      'shakespeare-globe-theatre', 'dostoevsky-mock-execution', 'tolstoy-flees-estate',
      'garcia-marquez-writes-solitude', 'neruda-dies-after-coup', 'kafka-writes-trial', 'tagore-wins-nobel',
      // Artists, Composers, Icons
      'van-gogh-cuts-ear', 'mozart-dies-penniless', 'bob-marley-zimbabwe',
      'kurosawa-seven-samurai', 'pele-1000th-goal',
    ],
    tags: ['notable-people', 'biography', 'history', 'global'],
  },

  // ─── City Clusters ─────────────────────────────────────────────────────

  {
    id: 'london-history',
    name: 'History of London',
    subtitle: 'Two thousand years of intrigue, disaster, and reinvention in the world\'s most storied city',
    description: 'From the princes who vanished in the Tower to the Blitz that nearly leveled it — every pin is a moment that shaped London and, through London, the world.',
    momentIds: [
      'princes-tower-disappear', 'anne-boleyn-executed', 'guy-fawkes-caught',
      'charles-i-executed', 'london-great-plague', 'london-great-fire',
      'newton-publishes-principia', 'nelson-funeral-st-pauls', 'rosetta-stone-british-museum',
      'victoria-crowned', 'london-great-exhibition', 'jack-ripper-whitechapel',
      'churchill-war-rooms', 'st-pauls-blitz', 'london-ve-day',
      'beatles-rooftop-concert', 'shakespeare-globe-theatre',
    ],
    tags: ['london', 'england', 'city-cluster', 'history'],
  },
  {
    id: 'rome-history',
    name: 'History of Rome',
    subtitle: 'From Romulus to Mussolini — three thousand years of drama in the Eternal City',
    description: 'A fratricide on a hilltop, gladiators in the Colosseum, Michelangelo on his back painting God, and Allied tanks rolling past the Forum — the city where Western civilization was born, fell, and rose again.',
    momentIds: [
      'romulus-founds-rome', 'spartacus-appian-way', 'nero-great-fire-rome',
      'colosseum-opens', 'visigoths-sack-rome', 'julius-caesar-assassinated',
      'michelangelo-sistine-chapel', 'raphael-dies-rome', 'caravaggio-kills-ranuccio',
      'galileo-faces-inquisition', 'keats-dies-spanish-steps',
      'mussolini-march-on-rome', 'lateran-treaty-vatican', 'allies-liberate-rome',
      'paul-arrives-rome',
    ],
    tags: ['rome', 'italy', 'city-cluster', 'history'],
  },
  {
    id: 'paris-history',
    name: 'History of Paris',
    subtitle: 'Revolution, culture, and catastrophe in the City of Light',
    description: 'The Bastille falls, a queen rides to the guillotine, Napoleon crowns himself, the Impressionists shock the world, and Notre-Dame burns — Paris as the stage for humanity\'s most dramatic moments.',
    momentIds: [
      'storming-bastille', 'marie-antoinette-guillotined', 'napoleon-crowns-himself',
      'paris-commune-tuileries', 'first-impressionist-exhibition', 'victor-hugo-funeral',
      'eiffel-tower-opens', 'dreyfus-degraded', 'oscar-wilde-dies-paris',
      'marie-curie-discovers-radium', 'treaty-versailles', 'josephine-baker-paris',
      'de-gaulle-liberation-paris', 'may-68-barricades', 'notre-dame-fire',
    ],
    tags: ['paris', 'france', 'city-cluster', 'history'],
  },
  {
    id: 'tokyo-history',
    name: 'History of Tokyo',
    subtitle: 'From shogun\'s castle town to modern superpower capital',
    description: 'A warlord builds a castle, ronin avenge their master, an earthquake and firebombs level everything, a monster movie processes nuclear trauma, and the Olympics announce rebirth — Tokyo\'s relentless cycle of destruction and reinvention.',
    momentIds: [
      'tokugawa-edo-shogunate', 'great-fire-meireki', '47-ronin-sengakuji',
      'emperor-meiji-moves-tokyo', 'meiji-shrine-built', 'great-kanto-earthquake',
      'february-26-incident', 'tokyo-firebombing', 'hirohito-surrender-broadcast',
      'macarthur-meets-hirohito', 'godzilla-premieres-tokyo', 'kurosawa-seven-samurai',
      'tokyo-1964-olympics', 'mishima-seppuku', 'aum-sarin-attack',
    ],
    tags: ['tokyo', 'japan', 'city-cluster', 'history'],
  },

  {
    id: 'notable-people-2',
    name: 'History\'s Greatest Minds and Bravest Souls',
    subtitle: 'Scientists, artists, writers, and heroes whose single moments changed everything',
    description: 'Darwin noticing finch beaks in the Galápagos, a deaf Beethoven being turned around to see his ovation, Gutenberg printing the first book, Joan of Arc burning at 19, and Tubman going back into slavery thirteen times to free others.',
    momentIds: [
      'cleopatra-suicide-alexandria', 'darwin-galapagos', 'beethoven-ninth-symphony',
      'marx-das-kapital', 'luther-95-theses', 'frida-kahlo-casa-azul',
      'picasso-paints-guernica', 'hemingway-farewell-arms', 'twain-mississippi',
      'dickens-christmas-carol', 'nightingale-scutari', 'freud-interpretation-dreams',
      'joan-of-arc-burned', 'gutenberg-prints-bible', 'earhart-disappears',
      'tesla-wardenclyffe', 'copernicus-deathbed', 'hamilton-killed-duel',
      'tubman-escapes-slavery', 'pasteur-rabies-vaccine',
    ],
    tags: ['notable-people', 'biography', 'history', 'global', 'batch-2'],
  },

  // ─── Curated thematic collections (migrated from stories) ──────────
  // These also exist in stories.ts for panel rendering compatibility.
  // Full story removal deferred until panel supports collection-only moments.

  {
    id: 'london-under-fire',
    name: 'Plagues, Fires, and Blitz of London',
    subtitle: 'Plague, fire, murder, and bombardment — the catastrophes that forged London',
    description: 'Plague, fire, a serial killer who was never caught, and the most sustained aerial bombardment in history — London has been tested by catastrophe more than almost any city on earth, and rebuilt every time.',
    momentIds: ['london-great-plague', 'london-great-fire', 'nelson-funeral-st-pauls', 'jack-ripper-whitechapel', 'churchill-war-rooms', 'st-pauls-blitz', 'london-ve-day'],
    tags: ['london', 'disaster', 'blitz', 'plague', 'fire', 'crime'],
  },
  {
    id: 'london-great-stages',
    name: 'London\'s Great Stages',
    subtitle: 'The moments when London was the stage for ideas that changed everything',
    description: 'Newton\'s laws, the key to Egyptian hieroglyphics, a glass cathedral of human achievement, and the Beatles\' final performance — the moments when London was the stage for ideas that changed everything.',
    momentIds: ['shakespeare-globe-theatre', 'newton-publishes-principia', 'rosetta-stone-british-museum', 'london-great-exhibition', 'beatles-rooftop-concert'],
    tags: ['london', 'science', 'culture', 'music', 'exhibition'],
  },
  {
    id: 'rome-renaissance-masters',
    name: 'Rome\'s Renaissance Masters',
    subtitle: 'Art\'s greatest dramas, played out on Rome\'s canvas',
    description: 'The Sistine Chapel ceiling, the painter who died at 37 and was mourned by a Pope, a genius who committed murder, and a poet who died overlooking the Spanish Steps — Rome as the canvas for art\'s greatest dramas.',
    momentIds: ['michelangelo-sistine-chapel', 'raphael-dies-rome', 'caravaggio-kills-ranuccio', 'keats-dies-spanish-steps'],
    tags: ['rome', 'renaissance', 'art', 'painting', 'literature'],
  },
  {
    id: 'scientific-minds-2',
    name: 'Scientific Minds That Changed Everything',
    subtitle: 'Five discoveries that rewired humanity\'s understanding of the universe',
    description: 'A dying astronomer who removed Earth from the center of the universe, a naturalist who noticed finch beaks, a chemist who saved a boy from rabies, an inventor who tried to give the world free energy, and a doctor who explained why you dream.',
    momentIds: ['copernicus-deathbed', 'darwin-galapagos', 'pasteur-rabies-vaccine', 'tesla-wardenclyffe', 'freud-interpretation-dreams'],
    tags: ['science', 'discovery', 'evolution', 'astronomy', 'medicine', 'invention'],
  },
  {
    id: 'revolutionaries-pen-pulpit',
    name: 'Revolutionaries of the Pen and the Pulpit',
    subtitle: 'Three men who reshaped civilization with words, not weapons',
    description: 'A goldsmith who made knowledge reproducible, a monk who split Christianity, and a penniless exile who wrote the book that split the world — three men who reshaped civilization with words, not weapons.',
    momentIds: ['gutenberg-prints-bible', 'luther-95-theses', 'marx-das-kapital'],
    tags: ['revolution', 'printing', 'reformation', 'communism', 'ideas'],
  },
  {
    id: 'artists-writers-immortal',
    name: 'Artists and Writers Who Became Immortal',
    subtitle: 'The masterpieces that made their creators eternal',
    description: 'A deaf composer who had to be turned around to see his ovation, an author who reinvented Christmas, a painter who turned her pain into self-portraits, and Picasso responding to a bombing with the most famous anti-war painting in history.',
    momentIds: ['beethoven-ninth-symphony', 'dickens-christmas-carol', 'twain-mississippi', 'hemingway-farewell-arms', 'frida-kahlo-casa-azul', 'picasso-paints-guernica'],
    tags: ['art', 'music', 'literature', 'painting', 'culture'],
  },
  {
    id: 'historys-bravest',
    name: 'History\'s Bravest',
    subtitle: 'Six lives defined by extraordinary courage in the face of death',
    description: 'A pharaoh who chose death over chains, a teenage girl burned for heresy, a society woman who walked into a death trap, a slave who went back thirteen times, a founding father killed by the vice president, and a pilot who vanished over the Pacific.',
    momentIds: ['cleopatra-suicide-alexandria', 'joan-of-arc-burned', 'nightingale-scutari', 'tubman-escapes-slavery', 'hamilton-killed-duel', 'earhart-disappears'],
    tags: ['courage', 'sacrifice', 'heroism', 'women', 'freedom'],
  },
];
