/**
 * Applies Gemini Phase 2 output back to moments.ts.
 * Reads all batch-XX-output.json files and updates the moment data.
 *
 * Usage: npx tsx scripts/apply-gemini-output.ts
 *
 * What it updates on each moment:
 * - name (verb-first rewrite)
 * - subtitle (if Gemini provided a new one)
 * - kind (event/milestone/presence)
 * - entityIds (from Gemini suggestions)
 * - description (only if descriptionRewrite is non-null)
 *
 * Also collects storyType flags for separate processing.
 */
import { moments } from '../src/data/moments';
import { stories } from '../src/data/stories';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface GeminiMomentOutput {
  id: string;
  name: string;
  subtitle: string;
  kind: 'event' | 'milestone' | 'presence';
  entityIds: string[];
  descriptionRewrite: string | null;
  storyTypeFlags: Record<string, string> | null;
}

const BATCHES_DIR = path.join(__dirname, 'batches');

// Find all output files
const outputFiles = fs.readdirSync(BATCHES_DIR)
  .filter(f => f.match(/^batch-\d+-output\.json$/))
  .sort();

if (outputFiles.length === 0) {
  console.error('No batch output files found in scripts/batches/');
  console.error('Expected files like: batch-01-output.json, batch-02-output.json, etc.');
  process.exit(1);
}

console.log(`Found ${outputFiles.length} output files`);

// Collect all Gemini outputs
const allOutputs: GeminiMomentOutput[] = [];
const storyTypeUpdates: Record<string, string> = {};

for (const file of outputFiles) {
  const raw = fs.readFileSync(path.join(BATCHES_DIR, file), 'utf-8');
  const data: GeminiMomentOutput[] = JSON.parse(raw);
  console.log(`  ${file}: ${data.length} moments`);
  allOutputs.push(...data);

  // Collect story type flags
  for (const item of data) {
    if (item.storyTypeFlags) {
      Object.assign(storyTypeUpdates, item.storyTypeFlags);
    }
  }
}

console.log(`\nTotal outputs: ${allOutputs.length}`);

// Build lookup
const outputMap = new Map(allOutputs.map(o => [o.id, o]));

// Validate — check for missing moments
const missing = moments.filter(m => !outputMap.has(m.id));
if (missing.length > 0) {
  console.warn(`\nWARNING: ${missing.length} moments have no Gemini output:`);
  missing.forEach(m => console.warn(`  - ${m.id}: "${m.name}"`));
}

// Apply updates to moments
let updated = 0;
let descriptionRewrites = 0;
const kindCounts: Record<string, number> = { event: 0, milestone: 0, presence: 0 };

const updatedMoments = moments.map(m => {
  const output = outputMap.get(m.id);
  if (!output) return m; // No Gemini output, keep as-is

  updated++;
  kindCounts[output.kind]++;

  const result = { ...m };

  // Always update name, subtitle, kind, entityIds
  result.name = output.name;
  result.subtitle = output.subtitle;
  result.kind = output.kind;
  result.entityIds = output.entityIds;

  // Only update description if Gemini flagged it
  if (output.descriptionRewrite) {
    result.description = output.descriptionRewrite;
    descriptionRewrites++;
  }

  return result;
});

console.log(`\nUpdated ${updated} moments:`);
console.log(`  Kinds: event=${kindCounts.event}, milestone=${kindCounts.milestone}, presence=${kindCounts.presence}`);
console.log(`  Description rewrites: ${descriptionRewrites}`);

// Generate new moments.ts
function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function formatMoment(m: typeof updatedMoments[0]): string {
  const lines: string[] = [];
  lines.push('  {');
  lines.push(`    id: '${escapeString(m.id)}',`);
  lines.push(`    name: '${escapeString(m.name)}',`);
  lines.push(`    subtitle: '${escapeString(m.subtitle)}',`);
  lines.push(`    description: '${escapeString(m.description)}',`);
  lines.push(`    lat: ${m.lat},`);
  lines.push(`    lng: ${m.lng},`);
  lines.push(`    type: '${escapeString(m.type)}',`);
  lines.push(`    importance: '${m.importance}',`);
  lines.push(`    accuracy: '${m.accuracy}',`);
  if (m.kind) lines.push(`    kind: '${m.kind}',`);
  if (m.year) lines.push(`    year: ${m.year},`);
  if (m.date) lines.push(`    date: '${escapeString(m.date)}',`);
  if (m.address) lines.push(`    address: '${escapeString(m.address)}',`);
  if (m.entityIds && m.entityIds.length > 0) {
    lines.push(`    entityIds: [${m.entityIds.map(e => `'${escapeString(e)}'`).join(', ')}],`);
  }
  if (m.media && m.media.length > 0) {
    lines.push(`    media: ${JSON.stringify(m.media)},`);
  }
  if (m.wikiSection) lines.push(`    wikiSection: '${escapeString(m.wikiSection)}',`);
  if (m.links && m.links.length > 0) {
    lines.push(`    links: ${JSON.stringify(m.links)},`);
  }
  lines.push('  },');
  return lines.join('\n');
}

const momentsTs = `import type { Moment } from '../types';

export const moments: Moment[] = [
${updatedMoments.map(formatMoment).join('\n')}
];
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'moments.ts'), momentsTs);
console.log('\nWrote updated src/data/moments.ts');

// Story type updates
if (Object.keys(storyTypeUpdates).length > 0) {
  console.log(`\nStory type updates needed (${Object.keys(storyTypeUpdates).length}):`);
  for (const [storyId, newType] of Object.entries(storyTypeUpdates)) {
    const story = stories.find(s => s.id === storyId);
    console.log(`  ${storyId}: ${story?.storyType} → ${newType}`);
  }
  fs.writeFileSync(
    path.join(BATCHES_DIR, 'story-type-updates.json'),
    JSON.stringify(storyTypeUpdates, null, 2)
  );
  console.log('  Saved to scripts/batches/story-type-updates.json');
  console.log('  Run apply-story-types.ts to apply these changes.');
}

// Generate entities list from all entityIds
const allEntityIds = new Set<string>();
updatedMoments.forEach(m => {
  if (m.entityIds) m.entityIds.forEach(e => allEntityIds.add(e));
});
const sortedEntities = [...allEntityIds].sort();
fs.writeFileSync(
  path.join(BATCHES_DIR, 'all-entity-ids.json'),
  JSON.stringify(sortedEntities, null, 2)
);
console.log(`\nCollected ${sortedEntities.length} unique entity IDs → scripts/batches/all-entity-ids.json`);
console.log('These will need Entity objects created in src/data/entities.ts');
