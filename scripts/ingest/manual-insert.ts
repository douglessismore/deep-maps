/**
 * Deep Maps — Manual Content Insert
 *
 * Generates review queue items for Einstein, da Vinci, and Shakespeare
 * without requiring Anthropic API credits. Content hand-crafted following
 * the content guide.
 *
 * Usage: npx tsx scripts/ingest/manual-insert.ts
 */

import {
  createIngestionRun,
  updateIngestionRun,
  insertToReviewQueue,
  type ReviewQueueItem,
} from './lib/pipeline.js';

// ── Einstein ──────────────────────────────────────────────────────────

const einstein = {
  entity: {
    id: 'albert-einstein',
    name: 'Albert Einstein',
    type: 'person',
    years: '1879–1955',
    description:
      'The physicist who rewrote the laws of the universe from a patent office desk. His 1905 papers on relativity and quantum theory overturned three centuries of Newtonian physics. Fled Nazi Germany in 1933, urged FDR to build the atomic bomb, then spent his final decades warning the world against using it.',
    wikipediaSlug: 'Albert_Einstein',
    canonicalStoryId: 'albert-einstein',
  },
  story: {
    id: 'albert-einstein',
    name: 'Albert Einstein',
    years: '1879–1955',
    start_year: 1879,
    end_year: 1955,
    category: 'discovery-science',
    storyType: 'biography',
    description:
      'A patent clerk publishes four papers that overturn physics, flees the Nazis to America, urges Roosevelt to build the atomic bomb, then spends his final years warning the world against nuclear war.',
    tags: ['physics', 'relativity', 'nobel-prize', 'wwii', 'nuclear'],
    wikipediaSlug: 'Albert_Einstein',
  },
  moments: [
    {
      id: 'einstein-born-in-ulm',
      name: 'Albert Einstein Is Born in the Kingdom of Württemberg',
      subtitle: 'The child who will reshape physics arrives in a family of secular German Jews',
      description:
        'On March 14, 1879, Albert Einstein is born at Bahnhofstraße 20 in Ulm, in the Kingdom of Württemberg in the German Empire. His father Hermann runs an electrochemical business; his mother Pauline comes from a prosperous family. The family moves to Munich when Albert is one year old, where his father and uncle open an electrical equipment company. Einstein later recalls being fascinated by a compass at age five — the invisible force moving the needle strikes him as evidence of "something deeply hidden behind things." The house where he was born was destroyed in a World War II bombing raid in 1944.',
      lat: 48.3984,
      lng: 9.9916,
      type_id: 'residence',
      importance: 'minor',
      accuracy: 'exact',
      kind: 'milestone',
      year: 1879,
      date: '1879-03-14',
      address: 'Bahnhofstraße 20, Ulm, Germany',
      notability: 90,
      source: 'notable-people',
      source_id: 'manual-1',
      verificationLevel: 'verified',
      wikiSection: 'Early_life_and_education',
    },
    {
      id: 'einstein-publishes-four-papers',
      name: 'A 26-Year-Old Patent Clerk Publishes Four Papers That Reshape Physics',
      subtitle: 'In a single year, Einstein overturns three centuries of Newtonian certainty',
      description:
        'In 1905, while working as a third-class patent examiner at the Swiss Patent Office in Bern, 26-year-old Albert Einstein publishes four papers in Annalen der Physik that transform modern physics. The papers introduce special relativity, the equivalence of mass and energy (E=mc²), the photoelectric effect (which later wins his Nobel Prize), and a mathematical explanation of Brownian motion proving atoms exist. No single year in the history of physics produces comparable breakthroughs. Einstein is still evaluating other people\'s inventions for a living — his academic career does not begin until 1908.',
      lat: 46.9480,
      lng: 7.4474,
      type_id: 'workplace',
      importance: 'major',
      accuracy: 'exact',
      kind: 'event',
      year: 1905,
      date: '1905-06-30',
      address: 'Speichergasse 2, Bern, Switzerland',
      notability: 95,
      source: 'notable-people',
      source_id: 'manual-1',
      verificationLevel: 'verified',
      wikiSection: 'Annus_mirabilis_papers',
    },
    {
      id: 'einstein-confirms-general-relativity',
      name: 'A Solar Eclipse Proves Einstein Right and Makes Him World-Famous',
      subtitle: 'Starlight bends around the sun exactly as general relativity predicts',
      description:
        'On May 29, 1919, British astronomer Arthur Eddington photographs a total solar eclipse from the island of Príncipe off the west coast of Africa. His measurements show that starlight passing near the sun bends by 1.75 arcseconds — exactly as Einstein\'s 1915 general theory of relativity predicts, and twice the value Newton\'s theory would give. When the results are announced at a joint meeting of the Royal Society and Royal Astronomical Society on November 6, 1919, Einstein becomes the most famous scientist in the world overnight. The London Times headline reads: "Revolution in Science — New Theory of the Universe."',
      lat: 1.6167,
      lng: 7.3833,
      type_id: 'discovery_site',
      importance: 'major',
      accuracy: 'general-area',
      kind: 'event',
      year: 1919,
      date: '1919-05-29',
      address: 'Roça Sundy, Príncipe Island',
      notability: 90,
      source: 'notable-people',
      source_id: 'manual-1',
      verificationLevel: 'verified',
      wikiSection: 'General_relativity',
    },
    {
      id: 'einstein-letter-to-roosevelt',
      name: 'Einstein Signs a Letter Urging Roosevelt to Build an Atomic Bomb',
      subtitle: 'The pacifist physicist warns that Nazi Germany may be building nuclear weapons first',
      description:
        'On August 2, 1939, Albert Einstein signs a letter to President Franklin D. Roosevelt warning that recent nuclear fission research could lead to "extremely powerful bombs" and that Germany may already be pursuing this path. The letter, drafted by physicist Leó Szilárd and signed at Einstein\'s summer cottage on Long Island, leads directly to the creation of the Advisory Committee on Uranium and eventually the Manhattan Project. Einstein himself is excluded from the bomb project — the FBI considers him a security risk. He later calls signing the letter "the one great mistake" of his life.',
      lat: 40.9636,
      lng: -72.1978,
      type_id: 'residence',
      importance: 'major',
      accuracy: 'approximate',
      kind: 'event',
      year: 1939,
      date: '1939-08-02',
      address: 'Nassau Point, Peconic, Long Island, New York',
      notability: 88,
      source: 'notable-people',
      source_id: 'manual-1',
      verificationLevel: 'verified',
      wikiSection: 'Einstein%E2%80%93Szil%C3%A1rd_letter',
    },
    {
      id: 'einstein-dies-in-princeton',
      name: 'Einstein Dies in Princeton, Refusing Surgery to the End',
      subtitle: 'His brain is removed without permission and studied for decades',
      description:
        'On April 18, 1955, Albert Einstein dies at Princeton Hospital of an abdominal aortic aneurysm at age 76. He refuses surgery, saying "I want to go when I want. It is tasteless to prolong life artificially." A draft of a speech celebrating Israel\'s seventh anniversary lies unfinished on his desk. Pathologist Thomas Harvey removes Einstein\'s brain during the autopsy without the family\'s permission, keeping it in jars for over 40 years and mailing slices to researchers around the world. Einstein\'s body is cremated the same day and his ashes scattered at an undisclosed location along the Delaware River.',
      lat: 40.3487,
      lng: -74.6593,
      type_id: 'landmark',
      importance: 'minor',
      accuracy: 'approximate',
      kind: 'milestone',
      year: 1955,
      date: '1955-04-18',
      address: 'Princeton Hospital, Princeton, New Jersey',
      notability: 85,
      source: 'notable-people',
      source_id: 'manual-1',
      verificationLevel: 'verified',
      wikiSection: 'Death',
    },
  ],
  suggestedCollections: ['notable-scientists', 'nobel-laureates'],
};

// ── Leonardo da Vinci ─────────────────────────────────────────────────

const davinci = {
  entity: {
    id: 'leonardo-da-vinci',
    name: 'Leonardo da Vinci',
    type: 'person',
    years: '1452–1519',
    description:
      'The artist-engineer who painted the Mona Lisa, designed flying machines, and dissected 30 human bodies to understand anatomy. Born illegitimate in Tuscany, he moved between Florence, Milan, Rome, and France, leaving behind 7,200 pages of notebooks filled with inventions centuries ahead of their time.',
    wikipediaSlug: 'Leonardo_da_Vinci',
    canonicalStoryId: 'leonardo-da-vinci',
  },
  story: {
    id: 'leonardo-da-vinci',
    name: 'Leonardo da Vinci',
    years: '1452–1519',
    start_year: 1452,
    end_year: 1519,
    category: 'arts-culture',
    storyType: 'biography',
    description:
      'An illegitimate child apprentices in Florence, paints the most famous portrait in history, designs war machines for a duke, dissects corpses in secret, and dies in a French château with a king at his bedside.',
    tags: ['renaissance', 'art', 'invention', 'anatomy', 'painting'],
    wikipediaSlug: 'Leonardo_da_Vinci',
  },
  moments: [
    {
      id: 'leonardo-born-in-vinci',
      name: 'Leonardo Is Born Illegitimate in the Tuscan Hill Town of Vinci',
      subtitle: 'His father is a notary, his mother a peasant — he will never attend university',
      description:
        'On April 15, 1452, Leonardo is born in or near the hill town of Vinci in the Republic of Florence, the illegitimate son of Ser Piero da Vinci, a Florentine notary, and Caterina, a young woman of lower social class. His illegitimacy bars him from attending university or entering most professions, but it frees him from pressure to follow his father into law. He spends his early childhood in the countryside around Vinci, developing the intense observation of nature that defines his life\'s work. At around age 14, his father arranges an apprenticeship with Andrea del Verrocchio in Florence — one of the most consequential career moves in the history of art.',
      lat: 43.7872,
      lng: 10.9246,
      type_id: 'residence',
      importance: 'minor',
      accuracy: 'general-area',
      kind: 'milestone',
      year: 1452,
      date: '1452-04-15',
      address: 'Vinci, Republic of Florence (modern Tuscany, Italy)',
      notability: 85,
      source: 'notable-people',
      source_id: 'manual-2',
      verificationLevel: 'verified',
      wikiSection: 'Early_life_(1452–1472)',
    },
    {
      id: 'leonardo-paints-last-supper',
      name: 'Leonardo Paints The Last Supper on a Milan Refectory Wall',
      subtitle: 'He uses an experimental technique that begins deteriorating almost immediately',
      description:
        'Between 1495 and 1498, Leonardo da Vinci paints The Last Supper on the back wall of the refectory of Santa Maria delle Grazie in Milan, commissioned by Duke Ludovico Sforza. Rather than using traditional fresco technique (painting on wet plaster), Leonardo experiments with tempera on a dry gesso ground, allowing him to work slowly and revise. The result is a masterpiece of dramatic composition — the moment Christ announces one of his apostles will betray him — but the experimental technique means the paint begins flaking within 20 years. The painting survives French soldiers using it for target practice, Napoleon\'s troops stabling horses in the refectory, and a World War II bombing that destroys three walls of the room but leaves The Last Supper standing.',
      lat: 45.4660,
      lng: 9.1711,
      type_id: 'cultural_venue',
      importance: 'major',
      accuracy: 'exact',
      kind: 'event',
      year: 1498,
      date: '1498',
      address: 'Santa Maria delle Grazie, Milan, Italy',
      notability: 90,
      source: 'notable-people',
      source_id: 'manual-2',
      verificationLevel: 'verified',
      wikiSection: 'The_Last_Supper',
    },
    {
      id: 'leonardo-begins-mona-lisa',
      name: 'Leonardo Begins Painting the Mona Lisa in Florence',
      subtitle: 'He carries the small portrait with him for 16 years and never delivers it to the client',
      description:
        'Around 1503, Leonardo da Vinci begins painting a portrait of Lisa Gherardini, the wife of Florentine merchant Francesco del Giocondo, in his Florence workshop. He works on the 30-by-21-inch poplar panel intermittently for years, perfecting his sfumato technique — building up translucent layers so thin that no brushstrokes are visible, creating the enigmatic expression that has fascinated viewers for five centuries. Leonardo never delivers the painting to the Giocondo family. He carries it with him to Rome and eventually to France, where King Francis I acquires it after Leonardo\'s death. The Mona Lisa now hangs in the Louvre behind bulletproof glass, where it is seen by roughly 10 million visitors per year.',
      lat: 43.7696,
      lng: 11.2558,
      type_id: 'workplace',
      importance: 'major',
      accuracy: 'general-area',
      kind: 'event',
      year: 1503,
      date: '1503',
      address: 'Florence, Republic of Florence (modern Tuscany, Italy)',
      notability: 95,
      source: 'notable-people',
      source_id: 'manual-2',
      verificationLevel: 'documented',
      wikiSection: 'Mona_Lisa',
    },
    {
      id: 'leonardo-dissects-bodies-in-florence',
      name: 'Leonardo Dissects Over 30 Human Bodies to Map Anatomy',
      subtitle: 'His anatomical drawings are not surpassed for 300 years',
      description:
        'Between roughly 1507 and 1513, Leonardo da Vinci conducts systematic human dissections at the hospital of Santa Maria Nuova in Florence and later at the Ospedale di Santo Spirito in Rome. Working by candlelight with decomposing cadavers, he dissects over 30 bodies and produces more than 240 anatomical drawings that are centuries ahead of their time. He correctly depicts the heart\'s four chambers, the curvature of the spine, the fetus in the womb, and the vascular system. His drawings are not published during his lifetime — they remain in notebooks and are not rediscovered until the 18th century. Had they been published, they would have advanced medical knowledge by generations.',
      lat: 43.7737,
      lng: 11.2588,
      type_id: 'institution',
      importance: 'minor',
      accuracy: 'approximate',
      kind: 'presence',
      year: 1510,
      date: '1507–1513',
      address: 'Santa Maria Nuova, Florence, Italy',
      notability: 82,
      source: 'notable-people',
      source_id: 'manual-2',
      verificationLevel: 'documented',
      wikiSection: 'Anatomical_studies_and_drawings',
    },
    {
      id: 'leonardo-dies-at-amboise',
      name: 'Leonardo Dies at Amboise with a King as His Patron',
      subtitle: 'He leaves behind 7,200 pages of notebooks and a handful of finished paintings',
      description:
        'On May 2, 1519, Leonardo da Vinci dies at the Château du Clos Lucé near Amboise, France, at age 67. He has spent his final three years as "First Painter, Engineer, and Architect to the King" under Francis I, who gives him a generous pension and a manor house connected to the royal château by an underground tunnel. According to tradition (likely apocryphal), the king cradles Leonardo\'s head as he dies. Leonardo leaves his notebooks and paintings to his pupil Francesco Melzi, who preserves them but never publishes the scientific work. Of the roughly 15 paintings Leonardo completes in his lifetime, only about 20 survive today — yet they include two of the most famous artworks in human history.',
      lat: 47.4102,
      lng: 0.9913,
      type_id: 'residence',
      importance: 'minor',
      accuracy: 'exact',
      kind: 'milestone',
      year: 1519,
      date: '1519-05-02',
      address: 'Château du Clos Lucé, Amboise, France',
      notability: 85,
      source: 'notable-people',
      source_id: 'manual-2',
      verificationLevel: 'documented',
      wikiSection: 'Old_age_and_death',
    },
  ],
  suggestedCollections: ['renaissance-masters', 'notable-artists'],
};

// ── William Shakespeare ───────────────────────────────────────────────

const shakespeare = {
  entity: {
    id: 'william-shakespeare',
    name: 'William Shakespeare',
    type: 'person',
    years: '1564–1616',
    description:
      'The playwright who invented 1,700 English words and wrote the stories the world still tells. A glover\'s son from Stratford, he became part-owner of London\'s most successful theater company and retired rich — yet we know almost nothing about his inner life, which has fueled 400 years of conspiracy theories.',
    wikipediaSlug: 'William_Shakespeare',
    canonicalStoryId: 'william-shakespeare',
  },
  story: {
    id: 'william-shakespeare',
    name: 'William Shakespeare',
    years: '1564–1616',
    start_year: 1564,
    end_year: 1616,
    category: 'arts-culture',
    storyType: 'biography',
    description:
      'A glover\'s son is baptized in Stratford, vanishes for seven "lost years," resurfaces as London\'s hottest playwright, builds the Globe Theatre, and retires home to die on his 52nd birthday.',
    tags: ['theater', 'literature', 'english-renaissance', 'poetry', 'playwright'],
    wikipediaSlug: 'William_Shakespeare',
  },
  moments: [
    {
      id: 'shakespeare-baptized-stratford',
      name: 'William Shakespeare Is Baptized in Stratford-upon-Avon',
      subtitle: 'The son of a glove-maker enters the parish register three days after birth',
      description:
        'On April 26, 1564, the infant William Shakespeare is baptized at Holy Trinity Church in Stratford-upon-Avon, Warwickshire. His father John Shakespeare is a successful glove-maker and alderman; his mother Mary Arden comes from a family of minor gentry. The baptism record — "Gulielmus filius Johannes Shakspere" — is one of the few undisputed documents from his early life. Shakespeare likely attends the King\'s New School in Stratford, where he receives a solid education in Latin grammar and rhetoric. He marries Anne Hathaway at age 18, has three children, and then disappears from the historical record for seven years — the famous "lost years" that have fueled centuries of speculation.',
      lat: 52.1937,
      lng: -1.7066,
      type_id: 'religious_site',
      importance: 'minor',
      accuracy: 'exact',
      kind: 'milestone',
      year: 1564,
      date: '1564-04-26',
      address: 'Holy Trinity Church, Stratford-upon-Avon, England',
      notability: 85,
      source: 'notable-people',
      source_id: 'manual-3',
      verificationLevel: 'verified',
      wikiSection: 'Early_life',
    },
    {
      id: 'shakespeare-establishes-reputation-london',
      name: 'Shakespeare Emerges as London\'s Rising Playwright',
      subtitle: 'A jealous rival calls him an "upstart crow" — the first proof he is writing plays',
      description:
        'By 1592, William Shakespeare has established himself in London\'s theater scene sufficiently to attract the jealousy of fellow playwright Robert Greene, who in a deathbed pamphlet calls him "an upstart Crow, beautified with our feathers." This is the first documentary evidence of Shakespeare as a playwright. He has likely been writing and acting for several years by this point, associated with the Lord Chamberlain\'s Men acting company. Over the next decade, he writes roughly two plays per year — an extraordinary output that includes Romeo and Juliet, A Midsummer Night\'s Dream, and The Merchant of Venice. By the mid-1590s, he is the most popular playwright in England.',
      lat: 51.5074,
      lng: -0.0876,
      type_id: 'cultural_venue',
      importance: 'minor',
      accuracy: 'general-area',
      kind: 'event',
      year: 1592,
      date: '1592',
      address: 'Bankside, Southwark, London, England',
      notability: 82,
      source: 'notable-people',
      source_id: 'manual-3',
      verificationLevel: 'documented',
      wikiSection: 'London_and_theatrical_career',
    },
    {
      id: 'globe-theatre-opens-bankside',
      name: 'Shakespeare\'s Company Opens the Globe Theatre on Bankside',
      subtitle: 'They carry the timbers of their old theater across the frozen Thames to build it',
      description:
        'In 1599, Shakespeare\'s acting company, the Lord Chamberlain\'s Men, opens the Globe Theatre on Bankside in Southwark, south of the Thames. The theater is built from timbers of their previous venue, The Theatre in Shoreditch, which they had dismantled and carried across the river after a lease dispute with the landowner. Shakespeare is a part-owner, holding a 12.5% share — a business arrangement that makes him wealthy. The Globe becomes the venue for the greatest plays in the English language: Hamlet, Othello, King Lear, and Macbeth are all first performed here. The original Globe burns down on June 29, 1613, when a theatrical cannon misfires during a performance of Henry VIII and ignites the thatched roof.',
      lat: 51.5081,
      lng: -0.0972,
      type_id: 'cultural_venue',
      importance: 'major',
      accuracy: 'approximate',
      kind: 'event',
      year: 1599,
      date: '1599',
      address: 'Bankside, Southwark, London, England',
      notability: 92,
      source: 'notable-people',
      source_id: 'manual-3',
      verificationLevel: 'verified',
      wikiSection: 'Globe_Theatre',
    },
    {
      id: 'shakespeare-writes-hamlet',
      name: 'Shakespeare Writes Hamlet, the Most Performed Play in History',
      subtitle: 'The prince who cannot decide becomes literature\'s most analyzed character',
      description:
        'Around 1600–1601, William Shakespeare writes The Tragedy of Hamlet, Prince of Denmark, most likely performing the role of the Ghost himself at the Globe Theatre. The play — a revenge tragedy about a prince who agonizes over whether to kill his uncle — is Shakespeare\'s longest work at 4,042 lines and becomes the most frequently performed play in the world. The role of Hamlet is considered the ultimate test of a dramatic actor. The play\'s most famous line, "To be, or not to be," has been translated into every major language. Hamlet is first published in a pirated "bad quarto" in 1603, followed by an authoritative edition in 1604. Over four centuries later, it is performed somewhere in the world on any given day.',
      lat: 51.5081,
      lng: -0.0972,
      type_id: 'cultural_venue',
      importance: 'major',
      accuracy: 'approximate',
      kind: 'event',
      year: 1601,
      date: '1600–1601',
      address: 'Globe Theatre, Bankside, Southwark, London, England',
      notability: 93,
      source: 'notable-people',
      source_id: 'manual-3',
      verificationLevel: 'documented',
      wikiSection: 'Hamlet',
    },
    {
      id: 'shakespeare-dies-stratford',
      name: 'Shakespeare Dies on His 52nd Birthday in Stratford',
      subtitle: 'His will famously leaves his wife the "second-best bed"',
      description:
        'On April 23, 1616, William Shakespeare dies at his home, New Place, in Stratford-upon-Avon, at age 52. The cause of death is unknown, though a local vicar writing 50 years later claims Shakespeare fell ill after a "merry meeting" with fellow playwrights Ben Jonson and Michael Drayton. His will, signed a month before his death, famously bequeaths his wife Anne the "second-best bed" — a detail that has puzzled scholars for centuries (the best bed was typically reserved for guests). Shakespeare is buried in the chancel of Holy Trinity Church, the same church where he was baptized. His epitaph threatens a curse on anyone who moves his bones — and nobody ever has.',
      lat: 52.1937,
      lng: -1.7066,
      type_id: 'burial_site',
      importance: 'minor',
      accuracy: 'exact',
      kind: 'milestone',
      year: 1616,
      date: '1616-04-23',
      address: 'Holy Trinity Church, Stratford-upon-Avon, England',
      notability: 85,
      source: 'notable-people',
      source_id: 'manual-3',
      verificationLevel: 'documented',
      wikiSection: 'Death_and_legacy',
    },
  ],
  suggestedCollections: ['literary-giants', 'english-history'],
};

// ── Build review queue items ──────────────────────────────────────────

function buildReviewItems(
  person: typeof einstein,
  runId: number,
): ReviewQueueItem[] {
  const items: ReviewQueueItem[] = [];

  // Entity
  items.push({
    ingestion_run_id: runId,
    item_type: 'entity',
    item_id: person.entity.id,
    draft_data: person.entity as unknown as Record<string, unknown>,
  });

  // Story
  const storyData = { ...person.story } as Record<string, unknown>;
  delete storyData.relatedStoryIds;
  items.push({
    ingestion_run_id: runId,
    item_type: 'story',
    item_id: person.story.id,
    draft_data: storyData,
  });

  // Moments
  for (let i = 0; i < person.moments.length; i++) {
    const moment = person.moments[i];
    const momentData = { ...moment } as Record<string, unknown>;

    // Build related items (join tables)
    const related: Record<string, unknown[]> = {};

    // story_moments join
    related.story_moments = [{
      story_id: person.story.id,
      moment_id: moment.id,
      sort_order: i,
      is_primary: i === 0,
    }];

    // moment_entities join — link to the person entity
    related.moment_entities = [{
      moment_id: moment.id,
      entity_id: person.entity.id,
    }];

    items.push({
      ingestion_run_id: runId,
      item_type: 'moment',
      item_id: moment.id,
      draft_data: momentData,
      related_items: related,
    });
  }

  return items;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Creating ingestion run for manual content insert...');

  const runId = await createIngestionRun('notable-people-manual', {
    method: 'manual-chat',
    people: ['Albert Einstein', 'Leonardo da Vinci', 'William Shakespeare'],
    count: 3,
  });
  console.log(`  ✅ Ingestion run created: #${runId}`);

  const allItems: ReviewQueueItem[] = [];

  console.log('\n📝 Building review items...');

  console.log('  → Albert Einstein (5 moments)');
  allItems.push(...buildReviewItems(einstein, runId));

  console.log('  → Leonardo da Vinci (5 moments)');
  allItems.push(...buildReviewItems(davinci, runId));

  console.log('  → William Shakespeare (5 moments)');
  allItems.push(...buildReviewItems(shakespeare, runId));

  console.log(`\n📤 Inserting ${allItems.length} items into review queue...`);
  await insertToReviewQueue(allItems);
  console.log('  ✅ All items inserted!');

  await updateIngestionRun(runId, 'completed', {
    people_processed: 3,
    entities_created: 3,
    stories_created: 3,
    moments_created: 15,
    total_review_items: allItems.length,
  });

  console.log(`\n✅ Done! Run #${runId} — ${allItems.length} items ready for review.`);
  console.log('\nNext step: npx tsx scripts/ingest/review.ts --run ' + runId);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
