/**
 * Merge all 8 draft content files into main data files.
 * Run: npx tsx scripts/merge-drafts.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Import draft data ──────────────────────────────────────────────────
// 1. science-culture-draft
import {
  newEntities as sciCultureEntities,
  scienceDiscoveryMoments,
  musicHistoryMoments,
  literaryLandmarkMoments,
  architectureEngineeringMoments,
} from './output/science-culture-draft';

// 2. diverse-stories-draft
import {
  entities as diverseEntities,
  stories as diverseStories,
  moments as diverseMoments,
} from './output/diverse-stories-draft';

// 3. exploration-disasters-draft
import {
  explorationDisasterMoments,
  explorationDisasterEntities,
  explorationDisasterStories,
} from './output/exploration-disasters-draft';

// 4. sports-culture-draft
import {
  moments as sportsMoments,
  entities as sportsEntities,
  stories as sportsStories,
  collectionSuggestions as sportsCollections,
} from './output/sports-culture-draft';

// 5. dense-tourist-europe-nyc-draft
import {
  denseWalkableMoments,
} from './output/dense-tourist-europe-nyc-draft';

// 6. ancient-world-draft
import {
  newEntities as ancientEntities,
  newStories as ancientStories,
  ancientWorldMoments,
} from './output/ancient-world-draft';

// 7. modern-history-draft
import {
  modernHistoryMoments,
  modernHistoryEntities,
  modernHistoryStories,
} from './output/modern-history-draft';

// 8. dense-tourist-asia-americas-draft
import {
  denseTokyoMoments,
  denseKyotoMoments,
  denseMexicoCityMoments,
  denseBuenosAiresMoments,
  denseIstanbulMoments,
} from './output/dense-tourist-asia-americas-draft';

// ── Import existing data to check for dupes ────────────────────────────
import { moments as existingMoments } from '../src/data/moments';
import { entities as existingEntities } from '../src/data/entities';
import { stories as existingStories } from '../src/data/stories';
import { collections as existingCollections } from '../src/data/collections';

// ── Build existing ID sets ─────────────────────────────────────────────
const existingMomentIds = new Set(existingMoments.map(m => m.id));
const existingEntityIds = new Set(existingEntities.map(e => e.id));
const existingStoryIds = new Set(existingStories.map(s => s.id));

// ── Dedup helper ───────────────────────────────────────────────────────
function dedup<T extends { id: string }>(
  items: T[],
  existingIds: Set<string>,
  seenIds: Set<string>,
  source: string,
): { kept: T[]; dupes: string[] } {
  const kept: T[] = [];
  const dupes: string[] = [];
  for (const item of items) {
    if (existingIds.has(item.id)) {
      dupes.push(`${item.id} (already in main data)`);
    } else if (seenIds.has(item.id)) {
      dupes.push(`${item.id} (duplicate across drafts)`);
    } else {
      seenIds.add(item.id);
      kept.push(item);
    }
  }
  if (dupes.length > 0) {
    console.log(`  [${source}] Skipped ${dupes.length} dupes: ${dupes.join(', ')}`);
  }
  return { kept, dupes };
}

// ── Collect all draft data by type ─────────────────────────────────────
interface DraftBatch {
  label: string;
  moments: any[];
  entities: any[];
  stories: any[];
}

const batches: DraftBatch[] = [
  {
    label: 'Science & Culture',
    moments: [
      ...scienceDiscoveryMoments,
      ...musicHistoryMoments,
      ...literaryLandmarkMoments,
      ...architectureEngineeringMoments,
    ],
    entities: sciCultureEntities,
    stories: [],
  },
  {
    label: 'Diverse Stories',
    moments: diverseMoments,
    entities: diverseEntities,
    stories: diverseStories,
  },
  {
    label: 'Exploration & Disasters',
    moments: explorationDisasterMoments,
    entities: explorationDisasterEntities,
    stories: explorationDisasterStories,
  },
  {
    label: 'Sports & Culture',
    moments: sportsMoments,
    entities: sportsEntities,
    stories: sportsStories,
  },
  {
    label: 'Dense Tourist — Europe & NYC',
    moments: denseWalkableMoments,
    entities: [],
    stories: [],
  },
  {
    label: 'Ancient World',
    moments: ancientWorldMoments,
    entities: ancientEntities,
    stories: ancientStories,
  },
  {
    label: 'Modern History',
    moments: modernHistoryMoments,
    entities: modernHistoryEntities,
    stories: modernHistoryStories,
  },
  {
    label: 'Dense Tourist — Asia & Americas',
    moments: [
      ...denseTokyoMoments,
      ...denseKyotoMoments,
      ...denseMexicoCityMoments,
      ...denseBuenosAiresMoments,
      ...denseIstanbulMoments,
    ],
    entities: [],
    stories: [],
  },
];

// ── Dedup across all batches ───────────────────────────────────────────
console.log('\n=== DEDUP CHECK ===\n');

const seenMomentIds = new Set<string>();
const seenEntityIds = new Set<string>();
const seenStoryIds = new Set<string>();

const dedupedBatches: { label: string; moments: any[]; entities: any[]; stories: any[] }[] = [];

for (const batch of batches) {
  console.log(`Processing: ${batch.label}`);
  const m = dedup(batch.moments, existingMomentIds, seenMomentIds, `${batch.label}/moments`);
  const e = dedup(batch.entities, existingEntityIds, seenEntityIds, `${batch.label}/entities`);
  const s = dedup(batch.stories, existingStoryIds, seenStoryIds, `${batch.label}/stories`);
  dedupedBatches.push({ label: batch.label, moments: m.kept, entities: e.kept, stories: s.kept });
}

// ── Stats ──────────────────────────────────────────────────────────────
const totalMoments = dedupedBatches.reduce((n, b) => n + b.moments.length, 0);
const totalEntities = dedupedBatches.reduce((n, b) => n + b.entities.length, 0);
const totalStories = dedupedBatches.reduce((n, b) => n + b.stories.length, 0);

console.log(`\n=== TOTALS AFTER DEDUP ===`);
console.log(`Moments:  ${totalMoments}`);
console.log(`Entities: ${totalEntities}`);
console.log(`Stories:  ${totalStories}`);

// ── Validate entity references ─────────────────────────────────────────
console.log('\n=== ENTITY REFERENCE CHECK ===\n');

// Combine all known entity IDs (existing + new)
const allEntityIds = new Set([...existingEntityIds, ...seenEntityIds]);

// Check all new moments' entityIds
let missingEntityRefs = 0;
for (const batch of dedupedBatches) {
  for (const moment of batch.moments) {
    if (moment.entityIds) {
      for (const eid of moment.entityIds) {
        if (!allEntityIds.has(eid)) {
          console.log(`  WARNING: Moment "${moment.id}" references missing entity "${eid}"`);
          missingEntityRefs++;
        }
      }
    }
  }
}
if (missingEntityRefs === 0) {
  console.log('  All entity references valid.');
} else {
  console.log(`  ${missingEntityRefs} missing entity references found.`);
}

// ── Serialize helper ───────────────────────────────────────────────────
function serializeItem(item: any, indent: number = 2): string {
  const pad = ' '.repeat(indent);
  const pad2 = ' '.repeat(indent + 2);
  const lines: string[] = [];
  lines.push(`${pad}{`);
  for (const [key, value] of Object.entries(item)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${pad2}${key}: [],`);
      } else if (typeof value[0] === 'object') {
        // Array of objects (like moments: [{momentId: '...'}])
        const items = value.map((v: any) => {
          const props = Object.entries(v).map(([k, val]) => `${k}: ${JSON.stringify(val)}`).join(', ');
          return `{ ${props} }`;
        });
        if (items.join(', ').length < 100) {
          lines.push(`${pad2}${key}: [${items.join(', ')}],`);
        } else {
          lines.push(`${pad2}${key}: [`);
          for (const it of items) {
            lines.push(`${pad2}  ${it},`);
          }
          lines.push(`${pad2}],`);
        }
      } else {
        // Array of primitives
        const joined = value.map(v => JSON.stringify(v)).join(', ');
        if (joined.length < 80) {
          lines.push(`${pad2}${key}: [${joined}],`);
        } else {
          lines.push(`${pad2}${key}: [`);
          for (const v of value) {
            lines.push(`${pad2}  ${JSON.stringify(v)},`);
          }
          lines.push(`${pad2}],`);
        }
      }
    } else if (typeof value === 'string') {
      // Escape single quotes for consistency with existing code style
      const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      lines.push(`${pad2}${key}: '${escaped}',`);
    } else {
      lines.push(`${pad2}${key}: ${JSON.stringify(value)},`);
    }
  }
  lines.push(`${pad}},`);
  return lines.join('\n');
}

// ── Ensure default fields on moments ───────────────────────────────────
function normalizeMoment(m: any): any {
  return {
    id: m.id,
    name: m.name,
    subtitle: m.subtitle || '',
    description: m.description || '',
    lat: m.lat,
    lng: m.lng,
    type: m.type || 'landmark',
    importance: m.importance || 'major',
    notability: m.notability ?? 30,
    verificationLevel: m.verificationLevel || 'verified',
    accuracy: m.accuracy || 'approximate',
    kind: m.kind || 'event',
    year: m.year,
    ...(m.date ? { date: m.date } : {}),
    address: m.address || '',
    entityIds: m.entityIds || [],
    ...(m.wikiSection ? { wikiSection: m.wikiSection } : {}),
  };
}

// ── Generate append text ───────────────────────────────────────────────
function generateMomentsAppend(): string {
  const lines: string[] = [];
  for (const batch of dedupedBatches) {
    if (batch.moments.length === 0) continue;
    lines.push(`  // ─── ${batch.label} ──────────────────────────────────────────`);
    for (const m of batch.moments) {
      lines.push(serializeItem(normalizeMoment(m)));
    }
  }
  return lines.join('\n');
}

function generateEntitiesAppend(): string {
  const lines: string[] = [];
  for (const batch of dedupedBatches) {
    if (batch.entities.length === 0) continue;
    lines.push(`  // ─── ${batch.label} ──────────────────────────────────────────`);
    for (const e of batch.entities) {
      lines.push(serializeItem(e));
    }
  }
  return lines.join('\n');
}

function generateStoriesAppend(): string {
  const lines: string[] = [];
  for (const batch of dedupedBatches) {
    if (batch.stories.length === 0) continue;
    lines.push(`  // ─── ${batch.label} ──────────────────────────────────────────`);
    for (const s of batch.stories) {
      lines.push(serializeItem(s));
    }
  }
  return lines.join('\n');
}

// ── Write to files ─────────────────────────────────────────────────────
const dataDir = path.join(__dirname, '..', 'src', 'data');

function appendBeforeClosingBracket(filePath: string, content: string): void {
  const existing = fs.readFileSync(filePath, 'utf-8');
  // Find the last "];" and insert before it
  const lastIdx = existing.lastIndexOf('];');
  if (lastIdx === -1) throw new Error(`Could not find ]; in ${filePath}`);
  const before = existing.substring(0, lastIdx);
  const after = existing.substring(lastIdx);
  const newContent = before + content + '\n' + after;
  fs.writeFileSync(filePath, newContent, 'utf-8');
}

// Moments
const momentsAppend = generateMomentsAppend();
if (momentsAppend) {
  appendBeforeClosingBracket(path.join(dataDir, 'moments.ts'), momentsAppend);
  console.log(`\nAppended ${totalMoments} moments to moments.ts`);
}

// Entities
const entitiesAppend = generateEntitiesAppend();
if (entitiesAppend) {
  appendBeforeClosingBracket(path.join(dataDir, 'entities.ts'), entitiesAppend);
  console.log(`Appended ${totalEntities} entities to entities.ts`);
}

// Stories
const storiesAppend = generateStoriesAppend();
if (storiesAppend) {
  appendBeforeClosingBracket(path.join(dataDir, 'stories.ts'), storiesAppend);
  console.log(`Appended ${totalStories} stories to stories.ts`);
}

// ── Add stub entities for missing references ──────────────────────────
const stubEntities = [
  {
    id: 'steve-jobs',
    name: 'Steve Jobs',
    type: 'person',
    years: '1955–2011',
    description: 'Co-founder of Apple who built the most valuable company on Earth. Jobs was fired from Apple in 1985, returned in 1997, and launched the iMac, iPod, iPhone, and iPad — products that redefined personal computing, music, and mobile communication.',
    wikipediaSlug: 'Steve_Jobs',
  },
  {
    id: 'jesse-owens',
    name: 'Jesse Owens',
    type: 'person',
    years: '1913–1980',
    description: 'Track and field athlete who won four gold medals at the 1936 Berlin Olympics, embarrassing Hitler\'s vision of Aryan supremacy. At the 1935 Big Ten meet in Ann Arbor, he broke three world records and tied a fourth in 45 minutes — still called the greatest single-day athletic achievement.',
    wikipediaSlug: 'Jesse_Owens',
  },
  {
    id: 'andre-breton',
    name: 'André Breton',
    type: 'person',
    years: '1896–1966',
    description: 'French writer and poet who founded the Surrealist movement. His 1924 Manifesto of Surrealism defined the movement\'s principles, and he held court at Parisian cafés where he attracted Dalí, Ernst, and Magritte to the cause.',
    wikipediaSlug: 'André_Breton',
  },
  {
    id: 'virginia-woolf',
    name: 'Virginia Woolf',
    type: 'person',
    years: '1882–1941',
    description: 'Modernist novelist who pioneered stream-of-consciousness narrative in Mrs Dalloway and To the Lighthouse. Central figure of the Bloomsbury Group, she co-founded the Hogarth Press with her husband Leonard and reshaped English prose before drowning herself in the River Ouse.',
    wikipediaSlug: 'Virginia_Woolf',
  },
  {
    id: 'gian-lorenzo-bernini',
    name: 'Gian Lorenzo Bernini',
    type: 'person',
    years: '1598–1680',
    description: 'The sculptor and architect who shaped Baroque Rome. Bernini carved the Ecstasy of Saint Teresa at 24, designed St. Peter\'s Square colonnade, and created the Fountain of the Four Rivers in Piazza Navona. Eight popes kept him employed for six decades.',
    wikipediaSlug: 'Gian_Lorenzo_Bernini',
  },
  {
    id: 'langston-hughes',
    name: 'Langston Hughes',
    type: 'person',
    years: '1901–1967',
    description: 'Poet, novelist, and playwright who became the voice of the Harlem Renaissance. Hughes wrote "The Negro Speaks of Rivers" at 17, coined the term "the dream deferred," and spent four decades chronicling Black American life in jazz-inflected verse.',
    wikipediaSlug: 'Langston_Hughes',
  },
];

// Add stubs for missing entities
for (const stub of stubEntities) {
  if (!allEntityIds.has(stub.id)) {
    // Find a batch to attach it to, or add to the first one
    dedupedBatches[0].entities.push(stub);
    allEntityIds.add(stub.id);
    seenEntityIds.add(stub.id);
    console.log(`  Added stub entity: ${stub.id}`);
  }
}

// Recount after stubs
const finalTotalEntities = dedupedBatches.reduce((n, b) => n + b.entities.length, 0);
console.log(`\nFinal entity count after stubs: ${finalTotalEntities}`);

// ── Collections (sports-culture has collection suggestions) ────────────
if (sportsCollections) {
  console.log('\n=== COLLECTION SUGGESTIONS FROM sports-culture-draft ===');
  console.log(JSON.stringify(sportsCollections, null, 2));
  console.log('(Review and add manually if desired — not auto-appended)');
}

console.log('\n=== MERGE COMPLETE ===\n');
