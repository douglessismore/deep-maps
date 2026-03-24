#!/usr/bin/env node
/**
 * Generate biography stories for Bucket B orphan entities.
 * Reads entities.ts and moments.ts, outputs:
 *   1. Story entries to append to stories.ts
 *   2. Entity canonicalStoryId updates
 */

import { readFileSync, writeFileSync } from 'fs';

const DEEP_MAPS = '/Users/sirdouglas/Documents/claude-code-projects/deep-maps';
const entitiesSrc = readFileSync(`${DEEP_MAPS}/src/data/entities.ts`, 'utf8');
const momentsSrc = readFileSync(`${DEEP_MAPS}/src/data/moments.ts`, 'utf8');
const analysisSrc = readFileSync(`${DEEP_MAPS}/scripts/output/orphan-moments-analysis.md`, 'utf8');

// ── Parse Bucket B entity IDs and their orphan moments from the analysis ──

const bucketBSection = analysisSrc.split('## Bucket B:')[1].split('## Bucket C:')[0];

// Extract entity-to-moments mapping from the "#### `entity-id`" sections
const entityMomentMap = new Map(); // entityId -> [momentId, ...]
const entityRegex = /#### `([^`]+)` — .+?\n\n((?:- `[^`]+`\n?)+)/g;
let match;
while ((match = entityRegex.exec(bucketBSection)) !== null) {
  const entityId = match[1];
  const momentIds = [...match[2].matchAll(/- `([^`]+)`/g)].map(m => m[1]);
  entityMomentMap.set(entityId, momentIds);
}

console.error(`Found ${entityMomentMap.size} Bucket B entities in analysis`);

// ── Parse entities ──

// Extract entity objects from entities.ts
const entityMap = new Map(); // id -> { name, type, years, description, wikipediaSlug, canonicalStoryId }
const entityBlockRegex = /\{\s*\n\s+id:\s*'([^']+)',\s*\n\s+name:\s*'([^']*(?:\\.[^']*)*)',\s*\n\s+type:\s*'([^']+)',/g;
let eMatch;
while ((eMatch = entityBlockRegex.exec(entitiesSrc)) !== null) {
  const id = eMatch[1];
  const name = eMatch[2].replace(/\\'/g, "'");
  const type = eMatch[3];

  // Extract fields from this entity block only (up to next closing `},`)
  const blockStart = eMatch.index;
  const blockEndIdx = entitiesSrc.indexOf('\n  },', blockStart);
  const chunk = entitiesSrc.substring(blockStart, blockEndIdx !== -1 ? blockEndIdx + 5 : blockStart + 800);
  const yearsMatch = chunk.match(/years:\s*'([^']+)'/);
  const wikiMatch = chunk.match(/wikipediaSlug:\s*'([^']+)'/);
  const canonMatch = chunk.match(/canonicalStoryId:\s*'([^']+)'/);

  entityMap.set(id, {
    name,
    type,
    years: yearsMatch ? yearsMatch[1] : undefined,
    wikipediaSlug: wikiMatch ? wikiMatch[1] : undefined,
    canonicalStoryId: canonMatch ? canonMatch[1] : undefined,
  });
}

console.error(`Parsed ${entityMap.size} entities`);

// ── Parse moments (just id and year) ──

const momentYearMap = new Map(); // momentId -> year (number)
const momentBlockRegex = /\{\s*\n\s+id:\s*'([^']+)',/g;
let mMatch;
while ((mMatch = momentBlockRegex.exec(momentsSrc)) !== null) {
  const id = mMatch[1];
  const chunk = momentsSrc.substring(mMatch.index, mMatch.index + 2000);
  const yearMatch = chunk.match(/\n\s+year:\s*(-?\d+),/);
  if (yearMatch) {
    momentYearMap.set(id, parseInt(yearMatch[1]));
  }
}

console.error(`Parsed ${momentYearMap.size} moments with years`);

// ── Category mapping for person entities ──

function categorizeEntity(entityId, entityName) {
  // Sacred/biblical figures
  const sacred = ['solomon', 'elijah-prophet', 'john-the-baptist', 'umar', 'augustine-of-hippo',
    'francis-of-assisi', 'rumi', 'confucius', 'chanakya'];
  if (sacred.includes(entityId)) return 'sacred-history';

  // Dark history / true crime
  const dark = ['ed-gein', 'jeffrey-dahmer', 'john-wayne-gacy', 'jack-the-ripper',
    'billy-the-kid', 'pat-garrett', 'john-tunstall'];
  if (dark.includes(entityId)) return 'dark-history';

  // Scientists / discoverers / inventors
  const science = ['michael-faraday', 'johannes-kepler', 'leonhard-euler', 'charles-darwin',
    'rene-descartes', 'immanuel-kant', 'isaac-newton', 'nikola-tesla', 'galileo-galilei',
    'democritus', 'carl-linnaeus', 'carl-friedrich-gauss', 'thales-of-miletus',
    'gottfried-wilhelm-leibniz', 'omar-khayyam', 'avicenna', 'herodotus',
    'epicurus', 'adam-smith', 'john-locke', 'plato', 'sun-tzu'];
  if (science.includes(entityId)) return 'discovery-science';

  // Artists / writers / musicians / filmmakers
  const arts = ['frederic-chopin', 'richard-wagner', 'johann-sebastian-bach',
    'albrecht-durer', 'leonardo-da-vinci', 'li-bai', 'johann-wolfgang-von-goethe',
    'michael-jackson', 'oscar-wilde', 'rabindranath-tagore', 'janis-joplin',
    'willie-nelson', 'franz-kafka', 'gabriel-garcia-marquez', 'wolfgang-mozart',
    'bob-marley', 'caravaggio', 'josephine-baker', 'diego-rivera', 'yukio-mishima',
    'ernest-hemingway', 'mark-twain', 'alexander-pushkin', 'hans-christian-andersen',
    'sappho', 'geoffrey-chaucer', 'moliere', 'lord-byron', 'francisco-goya',
    'antonio-vivaldi', 'georgia-okeeffe', 'pablo-neruda', 'akira-kurosawa',
    'dennis-hopper', 'o-henry', 'jean-jacques-rousseau', 'walt-disney'];
  if (arts.includes(entityId)) return 'arts-culture';

  // Military / battles / conflicts
  const battles = ['timur', 'hannibal-barca', 'alexander-the-great',
    'horatio-nelson', 'geronimo', 'nelson-miles', 'william-the-conqueror'];
  if (battles.includes(entityId)) return 'battles-conflicts';

  // Explorers
  const explorers = ['ferdinand-magellan', 'vasco-da-gama', 'jacques-cartier',
    'amelia-earhart', 'ibn-battuta', 'jim-white'];
  if (explorers.includes(entityId)) return 'discovery-science';

  // Political figures
  const political = ['alexander-hamilton', 'harriet-tubman', 'vladimir-lenin',
    'fidel-castro', 'dalai-lama-14', 'charlemagne', 'winston-churchill',
    'karl-marx', 'charles-i', 'che-guevara', 'mussolini', 'malcolm-x',
    'charles-de-gaulle', 'michael-dell', 'theodore-roosevelt', 'stephen-f-austin',
    'simon-bolivar', 'mao-zedong', 'mustafa-kemal-ataturk', 'indira-gandhi',
    'genghis-khan', 'anne-boleyn', 'guy-fawkes', 'cleopatra', 'martin-luther',
    'florence-nightingale', 'otto-von-bismarck', 'john-adams', 'barbara-jordan',
    'aung-san-suu-kyi', 'elfego-baca', 'marcus-aurelius', 'tiberius',
    'tutankhamun', 'hammurabi', 'pele'];
  if (political.includes(entityId)) return 'political-drama';

  // Default
  console.error(`  WARNING: No category for ${entityId} (${entityName}), defaulting to 'political-drama'`);
  return 'political-drama';
}

// ── Generate stories ──

const storyEntries = [];
const entityUpdates = []; // { entityId, canonicalStoryId }

for (const [entityId, momentIds] of entityMomentMap) {
  const entity = entityMap.get(entityId);
  if (!entity) {
    console.error(`  SKIP: Entity '${entityId}' not found in entities.ts`);
    continue;
  }

  if (entity.type !== 'person') {
    console.error(`  SKIP: Entity '${entityId}' is type '${entity.type}', not person`);
    continue;
  }

  if (entity.canonicalStoryId) {
    console.error(`  SKIP: Entity '${entityId}' already has canonicalStoryId '${entity.canonicalStoryId}'`);
    continue;
  }

  const storyId = `${entityId}-biography`;
  const category = categorizeEntity(entityId, entity.name);

  // Sort moments by year
  const sortedMoments = [...momentIds].sort((a, b) => {
    const ya = momentYearMap.get(a) ?? 999999;
    const yb = momentYearMap.get(b) ?? 999999;
    return ya - yb;
  });

  const momentsStr = sortedMoments.map(m => `{ momentId: '${m}' }`).join(', ');

  let entry = `  {\n    id: '${storyId}',\n    name: '${entity.name.replace(/'/g, "\\'")}',\n    years: '${entity.years || ''}',\n    category: '${category}',\n    storyType: 'biography',\n    description: '',\n    tags: [],\n    moments: [${momentsStr}],`;
  if (entity.wikipediaSlug) {
    entry += `\n    wikipediaSlug: '${entity.wikipediaSlug}',`;
  }
  entry += '\n  },';

  storyEntries.push(entry);
  entityUpdates.push({ entityId, canonicalStoryId: storyId });
}

console.error(`\nGenerated ${storyEntries.length} biography stories`);
console.error(`Need to update ${entityUpdates.length} entities with canonicalStoryId\n`);

// Output the story entries
console.log('// ═══ BUCKET B BIOGRAPHY STORIES (generated) ═══');
console.log(storyEntries.join('\n'));

// Output entity update instructions
console.log('\n// ═══ ENTITY canonicalStoryId UPDATES ═══');
for (const { entityId, canonicalStoryId } of entityUpdates) {
  console.log(`// ${entityId} → canonicalStoryId: '${canonicalStoryId}'`);
}

// Write the entity updates as JSON to a file
writeFileSync('/tmp/bucket-b-entity-updates.json', JSON.stringify(entityUpdates, null, 2));
console.error('Wrote entity updates to /tmp/bucket-b-entity-updates.json');
