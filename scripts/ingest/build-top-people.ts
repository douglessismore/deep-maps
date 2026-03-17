#!/usr/bin/env npx tsx
/**
 * Deep Maps — Build Top Notable People List from Laouenan Dataset
 *
 * Reads the cross-verified-database.csv (2.29M people) and scores them
 * using our own composite that prioritizes civilizational significance
 * over internet popularity:
 *
 *   - Wikipedia language editions (sitelinks proxy): 50% weight
 *   - Pageviews (log-dampened): 25% weight
 *   - Temporal bonus (older = more proven): 15% weight
 *   - Biographical completeness: 10% weight
 *
 * Then applies geographic, temporal, and category floors for diversity.
 *
 * Usage:
 *   npx tsx scripts/ingest/build-top-people.ts [--limit 500] [--floor 8]
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';

const LIMIT = parseInt(process.argv.find(a => a === '--limit')
  ? process.argv[process.argv.indexOf('--limit') + 1] : '500');
const FLOOR = parseInt(process.argv.find(a => a === '--floor')
  ? process.argv[process.argv.indexOf('--floor') + 1] : '8');

const CSV_PATH = path.join(import.meta.dirname, '../../data/cross-verified-database.csv');

interface Person {
  wikidataCode: string;
  name: string;
  birth: number;
  death: number | null;
  gender: string;
  occupation: string;       // level1_main_occ
  occupationDetail: string; // level2_main_occ
  unRegion: string;
  unSubregion: string;
  citizenship: string;
  wikiReaders: number;      // wiki_readers_2015_2018
  numWikiEditions: number;  // number_wiki_editions — our primary signal
  sumVisibLn: number;       // sum_visib_ln_5criteria (Laouenan composite)
  datasetRank: number;      // ranking_visib_5criteria (Laouenan rank)
  nonMissingScore: number;  // biographical completeness
  totalWords: number;       // total_count_words_b
  birthLat: number | null;
  birthLng: number | null;
  deathLat: number | null;
  deathLng: number | null;
  // Our computed score
  deepMapsScore: number;
}

function parseRow(row: Record<string, string>): Person | null {
  const get = (col: string) => row[col] || '';

  const birth = parseInt(get('birth'));
  const death = get('death') ? parseInt(get('death')) : null;
  const numWikiEditions = parseInt(get('number_wiki_editions')) || 0;
  const birthLat = parseFloat(get('bpla1'));
  const birthLng = parseFloat(get('bplo1'));
  const wikiReaders = parseInt(get('wiki_readers_2015_2018')) || 0;

  // Skip rows with missing critical data
  if (isNaN(birth)) return null;
  if (isNaN(birthLat) || isNaN(birthLng)) return null;
  if (numWikiEditions < 15) return null; // hard floor: must appear in 15+ Wikipedias

  return {
    wikidataCode: get('wikidata_code'),
    name: get('name').replace(/_/g, ' '),
    birth,
    death: death && !isNaN(death) ? death : null,
    gender: get('gender'),
    occupation: get('level1_main_occ'),
    occupationDetail: get('level2_main_occ'),
    unRegion: get('un_region'),
    unSubregion: get('un_subregion'),
    citizenship: get('citizenship_1_b'),
    wikiReaders,
    numWikiEditions,
    sumVisibLn: parseFloat(get('sum_visib_ln_5criteria')) || 0,
    datasetRank: parseInt(get('ranking_visib_5criteria')) || 999999,
    nonMissingScore: parseInt(get('non_missing_score')) || 0,
    totalWords: parseInt(get('total_count_words_b')) || 0,
    birthLat,
    birthLng,
    deathLat: parseFloat(get('dpla1')) || null,
    deathLng: parseFloat(get('dplo1')) || null,
    deepMapsScore: 0,
  };
}

/**
 * Deep Maps Notability Score (for person selection)
 *
 * Prioritizes civilizational significance over internet fame.
 * Wikipedia language editions (sitelinks) are the strongest signal because
 * they reflect cross-cultural consensus: if 200 language communities
 * independently decided someone deserves an article, that's universal significance.
 *
 * Pageviews are log-dampened to reduce pop culture inflation.
 * Temporal bonus rewards proven staying power (older figures have survived
 * the test of time).
 */
function computeDeepMapsScore(p: Person): number {
  // 1. Wikipedia editions score (50% weight)
  // 300 editions → 100, 150 → ~82, 50 → ~55, 15 → ~30
  const editionsScore = p.numWikiEditions > 0
    ? Math.min(100, (Math.log10(p.numWikiEditions) - 0.3) * 46)
    : 0;

  // 2. Pageviews score (25% weight) — log-dampened to reduce pop culture inflation
  // 1M views → ~70, 100K → ~55, 10K → ~40, 1K → ~25
  // Double log dampening vs score-moments.ts to further suppress recency bias
  const pvScore = p.wikiReaders > 0
    ? Math.min(100, (Math.log10(p.wikiReaders) - 2) * 14)
    : 0;

  // 3. Temporal staying power (15% weight)
  // Figures born before 1000 CE get full bonus. Modern figures get less.
  // This counteracts the pageview bias toward living people.
  const currentYear = 2026;
  const age = currentYear - p.birth;
  let temporalScore: number;
  if (age > 2000) temporalScore = 100;      // Ancient: maximum staying power
  else if (age > 500) temporalScore = 85;    // Medieval/Renaissance
  else if (age > 200) temporalScore = 65;    // Early modern
  else if (age > 100) temporalScore = 45;    // Modern (dead, established)
  else if (age > 50) temporalScore = 25;     // Recent (still proving relevance)
  else temporalScore = 10;                    // Contemporary (unproven)

  // 4. Biographical completeness (10% weight)
  // More complete biographical data = better documented = more notable
  const completenessScore = Math.min(100, p.nonMissingScore * 20);

  // Composite
  const raw = editionsScore * 0.50
            + pvScore * 0.25
            + temporalScore * 0.15
            + completenessScore * 0.10;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

/**
 * Categorize occupation for display and diversity floors
 */
function broadCategory(occ: string, detail: string): string {
  if (occ === 'Leadership') return 'Politics/Leadership';
  if (occ === 'Sports/Games') return 'Sports';
  if (occ === 'Discovery/Science') return 'Science/Discovery';
  // Split "Culture" into sub-categories
  const d = detail.toLowerCase();
  if (d.includes('music') || d.includes('singer') || d.includes('composer')) return 'Music';
  if (d.includes('paint') || d.includes('sculpt') || d.includes('artist') || d.includes('architect')) return 'Visual Arts';
  if (d.includes('film') || d.includes('actor') || d.includes('direct')) return 'Film/Theater';
  if (d.includes('writ') || d.includes('poet') || d.includes('novel') || d.includes('literature') || d.includes('playwright')) return 'Literature';
  if (d.includes('philos')) return 'Philosophy';
  if (d.includes('relig') || d.includes('theolog')) return 'Religion';
  return occ || 'Other';
}

/**
 * Map UN region to our continent categories
 */
function toContinent(unRegion: string): string {
  if (!unRegion || unRegion === '-') return 'Unknown';
  if (unRegion === 'America') return 'Americas';
  return unRegion;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Deep Maps — Build Top Notable People List (v2)');
  console.log(`  Scoring: editions×0.50 + pageviews×0.25 + temporal×0.15 + completeness×0.10`);
  console.log(`  Target: ${LIMIT} people, geographic floor: ${FLOOR}/region`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }

  let totalRows = 0;
  let passedFilter = 0;
  const candidates: Person[] = [];

  console.log('Reading CSV (streaming 1.1GB with proper CSV parser, filtering to 15+ wiki editions)...');

  const parser = fs.createReadStream(CSV_PATH).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_column_count: true })
  );

  for await (const row of parser) {
    totalRows++;
    const person = parseRow(row);

    if (person) {
      person.deepMapsScore = computeDeepMapsScore(person);
      candidates.push(person);
      passedFilter++;
    }

    if (totalRows % 500000 === 0) {
      console.log(`  ... ${totalRows.toLocaleString()} rows, ${passedFilter.toLocaleString()} pass filter`);
    }
  }

  console.log(`\n✓ Read ${totalRows.toLocaleString()} rows`);
  console.log(`  ${passedFilter.toLocaleString()} people have 15+ Wikipedia editions\n`);

  // Sort by our score (higher = more notable)
  candidates.sort((a, b) => b.deepMapsScore - a.deepMapsScore || a.datasetRank - b.datasetRank);

  // --- Exclusion filters ---
  // Remove living pop culture figures who don't meet a significance threshold
  // (actors, pop singers born after 1970 need editions >= 80 to make the cut)
  const isRecentPopCulture = (p: Person): boolean => {
    if (p.birth < 1970) return false;
    const cat = broadCategory(p.occupation, p.occupationDetail);
    return ['Film/Theater', 'Music', 'Sports'].includes(cat);
  };

  const filtered = candidates.filter(p => {
    if (isRecentPopCulture(p) && p.numWikiEditions < 80) return false;
    return true;
  });

  console.log(`After pop culture filter: ${filtered.length} candidates remain\n`);

  // --- Selection with diversity floors ---
  const selected = new Map<string, Person>(); // keyed by wikidataCode for dedup

  // Pass 1: Take top N globally by score
  for (const p of filtered) {
    if (selected.size >= LIMIT) break;
    selected.set(p.wikidataCode, p);
  }

  // Pass 2: Geographic floor — ensure each continent has minimum representation
  const continents = ['Europe', 'Americas', 'Asia', 'Africa', 'Oceania'];
  for (const continent of continents) {
    const inSelected = [...selected.values()].filter(p => toContinent(p.unRegion) === continent).length;
    if (inSelected < FLOOR) {
      const need = FLOOR - inSelected;
      let added = 0;
      for (const p of filtered) {
        if (selected.has(p.wikidataCode)) continue;
        if (toContinent(p.unRegion) !== continent) continue;
        selected.set(p.wikidataCode, p);
        added++;
        if (added >= need) break;
      }
    }
  }

  // Pass 3: Temporal floor — ensure ancient/medieval representation
  const ancientInSelected = [...selected.values()].filter(p => p.birth < 0).length;
  if (ancientInSelected < 15) {
    const need = 15 - ancientInSelected;
    let added = 0;
    for (const p of filtered) {
      if (selected.has(p.wikidataCode)) continue;
      if (p.birth >= 0) continue;
      selected.set(p.wikidataCode, p);
      added++;
      if (added >= need) break;
    }
  }

  const medievalInSelected = [...selected.values()].filter(p => p.birth >= 0 && p.birth < 1400).length;
  if (medievalInSelected < 15) {
    const need = 15 - medievalInSelected;
    let added = 0;
    for (const p of filtered) {
      if (selected.has(p.wikidataCode)) continue;
      if (p.birth < 0 || p.birth >= 1400) continue;
      selected.set(p.wikidataCode, p);
      added++;
      if (added >= need) break;
    }
  }

  // Final sort by score
  const finalList = [...selected.values()].sort((a, b) =>
    b.deepMapsScore - a.deepMapsScore || a.datasetRank - b.datasetRank
  );

  // === Output ===

  // Geographic distribution
  console.log('🌍 Geographic Distribution:');
  const regionCounts = new Map<string, number>();
  for (const p of finalList) {
    const c = toContinent(p.unRegion);
    regionCounts.set(c, (regionCounts.get(c) || 0) + 1);
  }
  for (const [region, count] of [...regionCounts].sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.ceil(count / 3));
    console.log(`  ${region.padEnd(15)} ${String(count).padStart(4)} ${bar}`);
  }

  // Category distribution
  console.log('\n📊 Category Distribution:');
  const catCounts = new Map<string, number>();
  for (const p of finalList) {
    const cat = broadCategory(p.occupation, p.occupationDetail);
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
  }
  for (const [cat, count] of [...catCounts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(25)} ${count}`);
  }

  // Gender
  const genderCounts = new Map<string, number>();
  for (const p of finalList) genderCounts.set(p.gender, (genderCounts.get(p.gender) || 0) + 1);
  console.log('\n👥 Gender:');
  for (const [g, c] of [...genderCounts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${g.padEnd(10)} ${c} (${((c / finalList.length) * 100).toFixed(1)}%)`);
  }

  // Era distribution
  console.log('\n📅 Era Distribution:');
  const eras = [
    { label: 'Ancient (< 0 CE)', min: -10000, max: 0 },
    { label: 'Classical (0-500)', min: 0, max: 500 },
    { label: 'Medieval (500-1400)', min: 500, max: 1400 },
    { label: 'Renaissance (1400-1600)', min: 1400, max: 1600 },
    { label: 'Early Modern (1600-1800)', min: 1600, max: 1800 },
    { label: 'Modern (1800-1950)', min: 1800, max: 1950 },
    { label: 'Contemporary (1950+)', min: 1950, max: 2100 },
  ];
  for (const era of eras) {
    const count = finalList.filter(p => p.birth >= era.min && p.birth < era.max).length;
    const bar = '█'.repeat(Math.ceil(count / 3));
    console.log(`  ${era.label.padEnd(28)} ${String(count).padStart(4)} ${bar}`);
  }

  // Score distribution
  console.log('\n📈 Score Distribution:');
  const tiers = [
    { label: 'S (80-100)', min: 80, max: 100 },
    { label: 'A (65-79)', min: 65, max: 79 },
    { label: 'B (50-64)', min: 50, max: 64 },
    { label: 'C (35-49)', min: 35, max: 49 },
    { label: 'D (0-34)', min: 0, max: 34 },
  ];
  for (const tier of tiers) {
    const count = finalList.filter(p => p.deepMapsScore >= tier.min && p.deepMapsScore <= tier.max).length;
    console.log(`  ${tier.label.padEnd(15)} ${count}`);
  }

  // Full ranked list
  console.log(`\n${'═'.repeat(140)}`);
  console.log(`  TOP ${finalList.length} NOTABLE PEOPLE — Deep Maps Scoring (editions×0.50 + pageviews×0.25 + temporal×0.15 + completeness×0.10)`);
  console.log(`${'═'.repeat(140)}`);
  console.log(`${'#'.padStart(4)}  ${'Score'.padStart(5)}  ${'WikiEd'.padStart(6)}  ${'Name'.padEnd(35)}  ${'Years'.padEnd(14)}  ${'Continent'.padEnd(12)}  ${'Category'.padEnd(22)}  ${'Views/yr'.padStart(12)}  ${'LRank'.padStart(6)}`);
  console.log(`${'─'.repeat(140)}`);

  for (let i = 0; i < finalList.length; i++) {
    const p = finalList[i];
    const years = p.death ? `${p.birth}–${p.death}` : `${p.birth}–present`;
    const views = p.wikiReaders > 0 ? p.wikiReaders.toLocaleString() : '-';
    const cat = broadCategory(p.occupation, p.occupationDetail);
    const continent = toContinent(p.unRegion);
    console.log(
      `${String(i + 1).padStart(4)}  ${String(p.deepMapsScore).padStart(5)}  ${String(p.numWikiEditions).padStart(6)}  ${p.name.padEnd(35).slice(0, 35)}  ${years.padEnd(14)}  ${continent.padEnd(12).slice(0, 12)}  ${cat.padEnd(22).slice(0, 22)}  ${views.padStart(12)}  ${String(p.datasetRank).padStart(6)}`
    );
  }

  // Write output JSON
  const outputPath = path.join(import.meta.dirname, '../../data/top-people.json');
  const output = finalList.map((p, i) => ({
    rank: i + 1,
    deepMapsScore: p.deepMapsScore,
    datasetRank: p.datasetRank,
    wikidataCode: p.wikidataCode,
    name: p.name,
    birthYear: p.birth,
    deathYear: p.death,
    gender: p.gender,
    occupation: p.occupation,
    occupationDetail: p.occupationDetail,
    category: broadCategory(p.occupation, p.occupationDetail),
    unRegion: p.unRegion,
    unSubregion: p.unSubregion,
    continent: toContinent(p.unRegion),
    citizenship: p.citizenship,
    birthLat: p.birthLat,
    birthLng: p.birthLng,
    deathLat: p.deathLat,
    deathLng: p.deathLng,
    wikiReaders: p.wikiReaders,
    numWikiEditions: p.numWikiEditions,
    sumVisibLn: p.sumVisibLn,
    wikipediaSlug: p.name.replace(/ /g, '_'),
  }));

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Wrote ${finalList.length} people to ${outputPath}`);

  // Sanity checks: people who SHOULD be in the list
  const mustHave = [
    'Jesus', 'Muhammad', 'Buddha', 'Confucius', 'Albert Einstein',
    'Isaac Newton', 'Galileo Galilei', 'Leonardo da Vinci', 'Michelangelo',
    'William Shakespeare', 'Beethoven', 'Mozart', 'Bach', 'Darwin',
    'Marie Curie', 'Nikola Tesla', 'Aristotle', 'Plato', 'Socrates',
    'Napoleon', 'Julius Caesar', 'Alexander the Great', 'Cleopatra',
    'Gandhi', 'Martin Luther King', 'Nelson Mandela', 'Abraham Lincoln',
    'Genghis Khan', 'Joan of Arc',
  ];
  const names = new Set(finalList.map(p => p.name));
  const missing = mustHave.filter(n => !names.has(n) && ![...names].some(fn => fn.includes(n)));
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing expected figures (check data):`);
    for (const m of missing) console.log(`  - ${m}`);
  } else {
    console.log(`\n✅ All ${mustHave.length} expected civilizational anchors present`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
