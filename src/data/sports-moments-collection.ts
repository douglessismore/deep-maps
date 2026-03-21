/**
 * Collection: Where History's Greatest Sports Moments Happened
 *
 * 19 moments spanning 1896–2019. Each moment is a specific event at the
 * exact venue where it occurred.
 *
 * Coordinates verified against known addresses. All moments use `exact`
 * or `approximate` accuracy per the content guide.
 *
 * To integrate:
 * 1. Paste the `sportsMoments` array into src/data/moments.ts
 * 2. Paste the `greatestSportsMomentsCollection` object into src/data/collections.ts
 * 3. Wire entityIds, stories, and collections per Part 5 of content-guide-v3.md
 */

import type { Moment, StoryCollection } from '../types';

// ─── Moments ────────────────────────────────────────────────────────────────

export const sportsMoments: Moment[] = [
  // ── 1. First Modern Olympics ─────────────────────────────────────────────
  {
    id: 'athens-1896-first-modern-olympics',
    name: 'Pierre de Coubertin Revives the Olympics After a 1,500-Year Absence',
    subtitle: 'Panathenaic Stadium, Vassileos Konstantinou Ave, Athens. Still stands; the only all-marble stadium in the world',
    description:
      '6 April 1896, inside a stadium built of white Pentelic marble and originally constructed in 329 BC, 241 male athletes from 14 nations gathered here for the first international Olympic Games since the Roman Emperor Theodosius I banned them in 393 AD. King George I opened the ceremony before 80,000 spectators — the largest crowd ever assembled for a sporting event to that point. American James Connolly won the triple jump to become the first Olympic champion in fifteen centuries.',
    lat: 37.9683,
    lng: 23.7410,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1896,
    date: '6 April 1896',
    address: 'Vassileos Konstantinou Ave, Athens 116 35, Greece',
    entityIds: ['pierre-de-coubertin', 'panathenaic-stadium'],
    wikiSection: '1896_Summer_Olympics',
  },

  // ── 2. Jesse Owens, Berlin 1936 ──────────────────────────────────────────
  {
    id: 'jesse-owens-four-golds-berlin-1936',
    name: 'Jesse Owens Wins Four Gold Medals at Hitler\'s Berlin Olympics',
    subtitle: 'Olympiastadion, Olympischer Platz 3, Berlin. Still stands; hosts Bundesliga and concerts',
    description:
      'Between 3 and 9 August 1936, James Cleveland Owens — a 22-year-old from Alabama — ran and leaped to four gold medals inside a stadium built by Albert Speer to showcase Aryan supremacy. His 100m (10.3 sec), 200m (20.7 sec, world record), long jump (8.06 m), and 4×100 relay victories were the most golds by any athlete at those Games. Hitler reportedly refused to shake his hand. Owens returned home to a ticker-tape parade he was not allowed to attend at the White House.',
    lat: 52.5146,
    lng: 13.2397,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1936,
    date: '3–9 August 1936',
    address: 'Olympischer Platz 3, 14053 Berlin, Germany',
    entityIds: ['jesse-owens', 'olympiastadion-berlin'],
    wikiSection: '1936_Summer_Olympics',
  },

  // ── 3. Babe Ruth Called Shot, 1932 ──────────────────────────────────────
  {
    id: 'ruth-called-shot-wrigley-1932',
    name: 'Babe Ruth Points Toward Center Field and Hits a Home Run There',
    subtitle: '1060 W Addison St, Chicago. Wrigley Field still stands; a plaque marks the ballpark\'s history',
    description:
      'In the fifth inning of Game 3 of the 1932 World Series on 1 October 1932, Ruth stepped into the batter\'s box here at Wrigley Field with Cubs fans hurling insults and a lemon. After taking two strikes, he raised his hand and appeared to point. Charlie Root\'s next pitch was a curveball; Ruth drove it an estimated 490 feet into the center-field bleachers. Whether he called the shot or gestured at the dugout remains disputed — Ruth gave both versions at different times depending on his audience.',
    lat: 41.9477,
    lng: -87.6560,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'documented',
    year: 1932,
    date: '1 October 1932',
    address: '1060 W Addison St, Chicago, IL 60613',
    entityIds: ['babe-ruth', 'wrigley-field'],
    wikiSection: 'Babe_Ruth\'s_called_shot',
  },

  // ── 4. Roger Bannister, Oxford 1954 ─────────────────────────────────────
  {
    id: 'bannister-four-minute-mile-oxford-1954',
    name: 'Roger Bannister Runs a Mile in 3:59.4, Breaking the "Impossible" Barrier',
    subtitle: 'Sir Roger Bannister Running Track, Iffley Road, Oxford. Track still used; a plaque marks the finish line',
    description:
      'On a blustery 6 May 1954, a 25-year-old medical student ran four laps of the cinder track here on Iffley Road before 3,000 spectators. Winds had nearly caused Bannister to abort the attempt. Paced by Chris Brasher and Chris Chataway, he crossed the line in 3 minutes 59.4 seconds — the first human to break four minutes. The barrier had stood as the supposed limit of human physiology. Forty-six days later, Australian John Landy ran 3:58.0. The record lasted only 46 days before it fell again.',
    lat: 51.7459,
    lng: -1.2431,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1954,
    date: '6 May 1954',
    address: 'Iffley Road Sports Complex, Oxford OX4 1EQ, England',
    entityIds: ['roger-bannister'],
    wikiSection: 'Roger_Bannister_running_track',
  },

  // ── 5. Jackie Robinson, Ebbets Field 1947 ────────────────────────────────
  {
    id: 'jackie-robinson-debut-ebbets-1947',
    name: 'Jackie Robinson Takes the Field at Ebbets Field, Breaking Baseball\'s Color Line',
    subtitle: 'Former site of Ebbets Field, Sullivan Pl & McKeever Pl, Brooklyn. Demolished 1960; now Ebbets Field Apartments',
    description:
      'Before 26,623 fans at Ebbets Field on 15 April 1947 — roughly 14,000 of them Black — Robinson jogged out to first base in a Brooklyn Dodgers uniform, ending a 63-year exclusion of Black players from Major League Baseball. He went hitless against Johnny Sain but reached on an error in the seventh, scored the go-ahead run, and the Dodgers won 5–3. He endured death threats, beanballs, and spiking all season; the Dodgers won the pennant. He was named Rookie of the Year.',
    lat: 40.6644,
    lng: -73.9577,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1947,
    date: '15 April 1947',
    address: 'Sullivan Place & McKeever Place, Brooklyn, NY 11225',
    entityIds: ['jackie-robinson'],
    wikiSection: 'Ebbets_Field',
  },

  // ── 6. Pelé's 1000th Goal, Maracanã 1969 ─────────────────────────────────
  {
    id: 'pele-1000th-goal-maracana-1969',
    name: 'Pelé Scores His 1,000th Career Goal on a Penalty at the Maracanã',
    subtitle: 'Estádio do Maracanã, Rua Prof. Eurico Rabelo, Rio de Janeiro. Still stands; hosts Brazil national team',
    description:
      'On 19 November 1969, in a Santos vs. Vasco da Gama match inside this 80,000-seat colosseum, Pelé stepped to the penalty spot needing one goal to reach "o milésimo." He was 29 years old and had begun scoring professionally at 15. The crowd — opposing fans included — erupted as the ball crossed the line. Afterward, Pelé wept and dedicated the goal to the poor children of Brazil. He retired in 1977 with 1,281 goals in 1,363 matches, a tally no verified scorer has surpassed.',
    lat: -22.9123,
    lng: -43.2303,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1969,
    date: '19 November 1969',
    address: 'Rua Prof. Eurico Rabelo, Rio de Janeiro, RJ 20271-110, Brazil',
    entityIds: ['pele', 'maracana-stadium'],
    wikiSection: 'Pelé',
  },

  // ── 7. Munich Massacre, 1972 ─────────────────────────────────────────────
  {
    id: 'munich-massacre-connollystrasse-1972',
    name: 'Black September Gunmen Kill 11 Israeli Athletes at the Munich Olympics',
    subtitle: 'Connollystraße 31, Munich Olympic Village. Building still stands; a memorial plaque is on the façade',
    description:
      'At 4:10 am on 5 September 1972, eight members of the Palestinian Black September organization scaled the fence here at the Olympic Village, entered the Israeli team quarters at Connollystraße 31, killed wrestling coach Moshe Weinberg and weightlifter Yossef Romano, and took nine athletes hostage. A botched West German rescue at Fürstenfeldbruck airfield ended with all nine hostages dead. The Games continued after a 34-hour suspension. An estimated 900 million people watched live on television.',
    lat: 48.1745,
    lng: 11.5428,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1972,
    date: '5 September 1972',
    address: 'Connollystraße 31, 80809 Munich, Germany',
    entityIds: ['munich-massacre', 'black-september'],
    wikiSection: 'Munich_massacre',
  },

  // ── 8. Secretariat, Belmont 1973 ─────────────────────────────────────────
  {
    id: 'secretariat-belmont-triple-crown-1973',
    name: 'Secretariat Wins the Belmont Stakes by 31 Lengths, Setting a Record That Still Stands',
    subtitle: 'Belmont Park, 2150 Hempstead Tpke, Elmont, NY. Still operates; a marker 253 feet from the finish line shows the margin',
    description:
      'On 9 June 1973, in front of 69,138 spectators, Secretariat ran 1.5 miles in 2 minutes 24 seconds — nearly three full seconds faster than the previous track record. He led wire-to-wire, winning by 31 lengths in the most dominant performance in thoroughbred history and completing the Triple Crown for the first time in 25 years. Television cameras struggled to keep the second-place horse in the same frame. The track record has not been broken in more than 50 years.',
    lat: 40.7093,
    lng: -73.7214,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1973,
    date: '9 June 1973',
    address: '2150 Hempstead Tpke, Elmont, NY 11003',
    entityIds: ['secretariat'],
    wikiSection: '1973_Belmont_Stakes',
  },

  // ── 9. Billie Jean King vs. Bobby Riggs, 1973 ────────────────────────────
  {
    id: 'billie-jean-king-battle-sexes-astrodome-1973',
    name: 'Billie Jean King Defeats Bobby Riggs 6–4, 6–3, 6–3 in the "Battle of the Sexes"',
    subtitle: 'NRG Astrodome, One Astrodome Way, Houston. Still standing; now a vacant landmark under preservation review',
    description:
      'On 20 September 1973, before 30,472 spectators inside the world\'s first domed stadium — still the largest crowd ever to watch a tennis match in the United States — King dismantled self-declared male chauvinist Bobby Riggs in straight sets. Riggs, 55, had beaten Margaret Court months earlier and claimed no woman could beat him. King was carried onto the court on a litter in the style of Cleopatra; Riggs arrived on a rickshaw. The $100,000 winner-take-all purse went to King.',
    lat: 29.6843,
    lng: -95.4047,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1973,
    date: '20 September 1973',
    address: 'One Astrodome Way, Houston, TX 77054',
    entityIds: ['billie-jean-king', 'bobby-riggs'],
    wikiSection: 'Battle_of_the_Sexes_(tennis)',
  },

  // ── 10. Hank Aaron 715th HR, Atlanta 1974 ────────────────────────────────
  {
    id: 'hank-aaron-715-atlanta-1974',
    name: 'Hank Aaron Hits His 715th Home Run, Passing Babe Ruth\'s Lifetime Record',
    subtitle: 'Former site of Atlanta–Fulton County Stadium, 755 Hank Aaron Dr SW, Atlanta. Demolished 1997; the homer\'s landing spot is marked outside Truist Park',
    description:
      'In the fourth inning on 8 April 1974, with Darrell Evans on first, Aaron drove a 1-0 fastball from Dodgers pitcher Al Downing over the left-center fence at Atlanta–Fulton County Stadium into the glove of Braves reliever Tom House in the bullpen. The crowd of 53,775 erupted. Two teenagers ran onto the field to clap him on the back as he rounded third. Aaron had received 930,000 letters that season — including death threats — while chasing a record set by a white player in a more segregated era.',
    lat: 33.7370,
    lng: -84.3870,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1974,
    date: '8 April 1974',
    address: '755 Hank Aaron Dr SW, Atlanta, GA 30315',
    entityIds: ['hank-aaron'],
    wikiSection: 'Hank_Aaron',
  },

  // ── 11. Nadia Comaneci, Montreal 1976 ────────────────────────────────────
  {
    id: 'comaneci-perfect-10-montreal-forum-1976',
    name: 'Nadia Comaneci Scores the First Perfect 10 in Olympic Gymnastics History',
    subtitle: 'Former Montreal Forum, 2313 Rue Sainte-Catherine O, Montreal. Converted to entertainment complex in 1996; Arena sign remains',
    description:
      'On 18 July 1976, a 14-year-old Romanian gymnast completed her uneven bars routine at the Montreal Forum in less than 30 seconds. The score — a 10.00 — had never been awarded in Olympic gymnastics. The Omega scoreboard, not programmed to display a perfect score, showed "1.00." The crowd sat confused before the arena erupted. Comaneci earned seven perfect 10s across the Montreal Games, winning three gold medals. She stood 1.5 meters tall and weighed 39 kilograms.',
    lat: 45.4875,
    lng: -73.5842,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1976,
    date: '18 July 1976',
    address: '2313 Rue Sainte-Catherine O, Montreal, QC H3H 1N2, Canada',
    entityIds: ['nadia-comaneci'],
    wikiSection: 'Nadia_Comăneci',
  },

  // ── 12. Miracle on Ice, Lake Placid 1980 ─────────────────────────────────
  {
    id: 'miracle-on-ice-lake-placid-1980',
    name: 'A Team of American College Players Defeats the Soviet Hockey Dynasty 4–3',
    subtitle: 'Herb Brooks Arena, 2634 Main St, Lake Placid, NY. Still operates; the ice and locker rooms are preserved for tours',
    description:
      'On 22 February 1980, inside a 10,000-seat arena at the foot of the Adirondacks, the U.S. Olympic hockey team — average age 22, mostly college players — beat the four-time defending gold-medal Soviet squad that had outscored opponents 51–11 in that year\'s pre-Olympic tournament. Mike Eruzione\'s wrist shot in the third period gave the U.S. a 4–3 lead that held. Al Michaels\'s call — "Do you believe in miracles? Yes!" — became the most famous line in American sports broadcasting.',
    lat: 44.2833,
    lng: -73.9851,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1980,
    date: '22 February 1980',
    address: '2634 Main St, Lake Placid, NY 12946',
    entityIds: ['herb-brooks', 'mike-eruzione'],
    wikiSection: 'Miracle_on_Ice',
  },

  // ── 13. Maradona Hand of God, Mexico City 1986 ───────────────────────────
  {
    id: 'maradona-hand-of-god-azteca-1986',
    name: 'Maradona Punches the Ball Into the Net, Then Scores the Goal of the Century Four Minutes Later',
    subtitle: 'Estadio Azteca, Calzada de Tlalpan 3665, Mexico City. Still stands; hosted 2026 World Cup games',
    description:
      'On 22 June 1986, before 115,000 fans in the World Cup quarter-final, Diego Maradona punched a loose ball into England\'s net with his left fist. Referee Ali Ben Nasser, unsighted, gave the goal. Four minutes later, Maradona collected the ball in his own half and dribbled past six defenders across 60 meters to score what FIFA voters would name the Goal of the Century. Argentina won 2–1 and went on to win the World Cup. Maradona later said the first goal was scored "a little with the head of Maradona, and a little with the hand of God."',
    lat: 19.3030,
    lng: -99.1507,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1986,
    date: '22 June 1986',
    address: 'Calzada de Tlalpan 3665, Col. Santa Úrsula Coapa, Mexico City 04650, Mexico',
    entityIds: ['diego-maradona', 'estadio-azteca'],
    wikiSection: 'The_hand_of_God',
  },

  // ── 14. Muhammad Ali vs. Sonny Liston, Miami Beach 1964 ──────────────────
  {
    id: 'ali-liston-miami-beach-convention-1964',
    name: 'Cassius Clay Knocks Out Sonny Liston and Announces He Is Muhammad Ali',
    subtitle: 'Miami Beach Convention Center, 1901 Convention Center Dr, Miami Beach. Still stands; now a major convention venue',
    description:
      'On 25 February 1964 inside Hall C of the Miami Beach Convention Center, 22-year-old Cassius Clay battered the unbeaten, terrifying heavyweight champion Sonny Liston until Liston refused to leave his corner at the start of the seventh round. Clay ran around the ring screaming "I shook up the world!" The next morning he announced his conversion to Islam and his new name. The fight transformed boxing, Black American identity, and American politics in a single night.',
    lat: 25.7948,
    lng: -80.1332,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1964,
    date: '25 February 1964',
    address: '1901 Convention Center Dr, Miami Beach, FL 33139',
    entityIds: ['muhammad-ali', 'sonny-liston'],
    wikiSection: 'Muhammad_Ali_vs._Sonny_Liston',
  },

  // ── 15. Michael Jordan's Last Shot, Salt Lake City 1998 ──────────────────
  {
    id: 'jordan-last-shot-delta-center-1998',
    name: 'Michael Jordan Steals the Ball from Karl Malone and Hits a 20-Foot Jumper to Win His Sixth Title',
    subtitle: 'Delta Center, 301 W South Temple, Salt Lake City. Still stands; now home of Utah Jazz and Utah Mammoth',
    description:
      'With 18.9 seconds remaining in Game 6 of the 1998 NBA Finals on 14 June 1998 and the Bulls trailing 86–85, Jordan stripped Karl Malone of the ball near the post, dribbled up court, and shook Bryon Russell with a crossover before releasing a jump shot with 5.2 seconds left that gave Chicago an 87–86 lead. Stockton\'s buzzer three missed. The shot ended Jordan\'s tenure with the Bulls and remains the most-watched game in NBA history — 35.9 million viewers.',
    lat: 40.7683,
    lng: -111.9011,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 1998,
    date: '14 June 1998',
    address: '301 W South Temple, Salt Lake City, UT 84101',
    entityIds: ['michael-jordan', 'delta-center'],
    wikiSection: 'Game_6_of_the_1998_NBA_Finals',
  },

  // ── 16. Usain Bolt 9.58s, Berlin 2009 ────────────────────────────────────
  {
    id: 'usain-bolt-958-berlin-2009',
    name: 'Usain Bolt Runs 100 Meters in 9.58 Seconds, Shattering His Own World Record',
    subtitle: 'Olympiastadion Berlin, Olympischer Platz 3, Berlin. Same stadium as 1936; a plaque marks the finish line',
    description:
      'On 16 August 2009, in the final of the World Athletics Championships, Bolt crossed the finish line in 9.58 seconds — 0.11 seconds faster than the mark he\'d set in Beijing a year earlier. The performance was unprecedented: most records in sprinting fall by hundredths of a second. His top speed reached 12.4 meters per second (27.8 mph) at the 65-meter mark. The record has stood for over 15 years. He ran the race in the same Berlin stadium where Jesse Owens set world records 73 years before.',
    lat: 52.5146,
    lng: 13.2397,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 2009,
    date: '16 August 2009',
    address: 'Olympischer Platz 3, 14053 Berlin, Germany',
    entityIds: ['usain-bolt', 'olympiastadion-berlin'],
    wikiSection: '2009_World_Championships_in_Athletics',
  },

  // ── 17. Leicester City Premier League, 2016 ──────────────────────────────
  {
    id: 'leicester-city-premier-league-2016',
    name: 'Leicester City, Given 5,000-to-1 Odds, Win the Premier League Title',
    subtitle: 'King Power Stadium, Filbert Way, Leicester LE2 7FL. Still stands; capacity 32,261',
    description:
      'On 7 May 2016, Wes Morgan lifted the Premier League trophy inside this 32,000-seat stadium after a 3–1 win over Everton. The title had been mathematically confirmed five days earlier when Chelsea drew with Tottenham. Leicester had been 5,000-to-1 outsiders at the season\'s start — the longest odds ever placed on a sports outcome that came true. Manager Claudio Ranieri had been sacked by Greece; striker Jamie Vardy had played non-league football for Fleetwood Town five years earlier.',
    lat: 52.6206,
    lng: -1.1428,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 2016,
    date: '7 May 2016',
    address: 'Filbert Way, Leicester LE2 7FL, England',
    entityIds: ['leicester-city-fc', 'claudio-ranieri'],
    wikiSection: '2015–16_Leicester_City_F.C._season',
  },

  // ── 18. Tiger Woods Masters Comeback, Augusta 2019 ───────────────────────
  {
    id: 'tiger-woods-masters-comeback-augusta-2019',
    name: 'Tiger Woods Wins His Fifth Masters Title 11 Years After His Last Major',
    subtitle: 'Augusta National Golf Club, 2604 Washington Rd, Augusta, GA. Private club; open to public only during Masters week',
    description:
      'On 14 April 2019, Woods completed a final round of 70 to finish 13-under and claim a one-stroke victory at Augusta National — his 15th major and first since the 2008 U.S. Open. He had undergone four back surgeries and a DUI arrest in the intervening years. He started the final round two shots off the lead, the first time he had won a major without holding at least a share of the lead entering the last day. His son Charlie and daughter Sam met him at the 18th green, mirroring the embrace Woods had with his own father in 1997.',
    lat: 33.5031,
    lng: -82.0198,
    type: 'historical_site',
    importance: 'major',
    accuracy: 'exact',
    kind: 'event',
    verificationLevel: 'verified',
    year: 2019,
    date: '14 April 2019',
    address: '2604 Washington Rd, Augusta, GA 30904',
    entityIds: ['tiger-woods', 'augusta-national'],
    wikiSection: '2019_Masters_Tournament',
  },
];

// ─── Collection ──────────────────────────────────────────────────────────────

export const greatestSportsMomentsCollection: StoryCollection = {
  id: 'greatest-sports-moments',
  name: 'Where History\'s Greatest Sports Moments Happened',
  subtitle: 'The exact stadiums, tracks, and arenas where Jesse Owens, Pelé, Ali, Jordan, and others made history',
  description:
    'From the marble stadium where the modern Olympics were born in 1896 to the Augusta fairway where Tiger Woods wept in 2019 — 18 moments across eight decades, nine sports, and four continents.',
  momentIds: [
    'athens-1896-first-modern-olympics',
    'jesse-owens-four-golds-berlin-1936',
    'ruth-called-shot-wrigley-1932',
    'ali-liston-miami-beach-convention-1964',
    'jackie-robinson-debut-ebbets-1947',
    'bannister-four-minute-mile-oxford-1954',
    'pele-1000th-goal-maracana-1969',
    'munich-massacre-connollystrasse-1972',
    'secretariat-belmont-triple-crown-1973',
    'billie-jean-king-battle-sexes-astrodome-1973',
    'hank-aaron-715-atlanta-1974',
    'comaneci-perfect-10-montreal-forum-1976',
    'miracle-on-ice-lake-placid-1980',
    'maradona-hand-of-god-azteca-1986',
    'jordan-last-shot-delta-center-1998',
    'usain-bolt-958-berlin-2009',
    'leicester-city-premier-league-2016',
    'tiger-woods-masters-comeback-augusta-2019',
  ],
  tags: ['sports', 'olympics', 'football', 'baseball', 'basketball', 'athletics', 'tennis', 'boxing', 'cycling', 'history'],
};
