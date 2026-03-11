/**
 * Applies Gemini Phase 3 enrichment output back to data files.
 *
 * Reads:
 *   scripts/batches/enrich-XX-output.json → entityIds for orphaned moments
 *   scripts/batches/related-stories-output.json → relatedStoryIds for orphaned stories
 *
 * Writes:
 *   src/data/moments.ts (updated with entityIds)
 *   src/data/stories.ts (updated with relatedStoryIds)
 *   scripts/batches/new-entity-ids.json (any NEW entity IDs that need Entity records)
 *
 * Usage: npx tsx scripts/apply-enrichment.ts
 */
import { moments } from '../src/data/moments';
import { stories } from '../src/data/stories';
import { entities } from '../src/data/entities';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCHES_DIR = path.join(__dirname, 'batches');

// ── Phase 3A: Apply entityIds to moments ─────────────────────────────

interface EnrichMomentOutput {
  id: string;
  entityIds: string[];
}

const enrichFiles = fs.readdirSync(BATCHES_DIR)
  .filter(f => f.match(/^enrich-\d+-output\.json$/))
  .sort();

console.log(`=== Phase 3A: Entity Tags ===`);
console.log(`Found ${enrichFiles.length} enrichment output files`);

const entityUpdates = new Map<string, string[]>();
const allNewEntityIds = new Set<string>();
const definedEntityIds = new Set(entities.map(e => e.id));

for (const file of enrichFiles) {
  const raw = fs.readFileSync(path.join(BATCHES_DIR, file), 'utf-8');
  const data: EnrichMomentOutput[] = JSON.parse(raw);
  console.log(`  ${file}: ${data.length} moments`);
  for (const item of data) {
    entityUpdates.set(item.id, item.entityIds);
    for (const eid of item.entityIds) {
      if (!definedEntityIds.has(eid)) {
        allNewEntityIds.add(eid);
      }
    }
  }
}

// Apply entityIds to moments
let momentsUpdated = 0;
const updatedMoments = moments.map(m => {
  const newEntityIds = entityUpdates.get(m.id);
  if (newEntityIds && (!m.entityIds || m.entityIds.length === 0)) {
    momentsUpdated++;
    return { ...m, entityIds: newEntityIds };
  }
  return m;
});

console.log(`\nApplied entityIds to ${momentsUpdated} moments`);

if (allNewEntityIds.size > 0) {
  console.log(`\n⚠️  ${allNewEntityIds.size} NEW entity IDs (need Entity records in entities.ts):`);
  for (const id of [...allNewEntityIds].sort()) {
    console.log(`    - ${id}`);
  }
  fs.writeFileSync(
    path.join(BATCHES_DIR, 'new-entity-ids.json'),
    JSON.stringify([...allNewEntityIds].sort(), null, 2)
  );
  console.log(`  Saved to scripts/batches/new-entity-ids.json`);
}

// Write updated moments.ts
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

if (enrichFiles.length > 0) {
  const momentsTs = `import type { Moment } from '../types';\n\nexport const moments: Moment[] = [\n${updatedMoments.map(formatMoment).join('\n')}\n];\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'moments.ts'), momentsTs);
  console.log('\nWrote updated src/data/moments.ts');
}

// ── Phase 3B: Apply relatedStoryIds to stories ──────────────────────

interface RelatedStoryOutput {
  id: string;
  relatedStoryIds: string[];
  bidirectionalFixes?: { storyId: string; addRelated: string }[];
}

const relatedFile = path.join(BATCHES_DIR, 'related-stories-output.json');

if (fs.existsSync(relatedFile)) {
  console.log(`\n=== Phase 3B: Related Stories ===`);
  const raw = fs.readFileSync(relatedFile, 'utf-8');
  const data: RelatedStoryOutput[] = JSON.parse(raw);
  console.log(`Found ${data.length} story updates`);

  // Build update map
  const storyUpdates = new Map<string, string[]>();
  const bidirectionalFixes: { storyId: string; addRelated: string }[] = [];

  for (const item of data) {
    if (item.relatedStoryIds && item.relatedStoryIds.length > 0) {
      storyUpdates.set(item.id, item.relatedStoryIds);
    }
    if (item.bidirectionalFixes) {
      bidirectionalFixes.push(...item.bidirectionalFixes);
    }
  }

  // Apply updates
  let storiesUpdated = 0;
  const updatedStories = stories.map(s => {
    const newRelated = storyUpdates.get(s.id);
    const fixes = bidirectionalFixes.filter(f => f.storyId === s.id);

    let related = s.relatedStoryIds ? [...s.relatedStoryIds] : [];

    // Add new relatedStoryIds for orphaned stories
    if (newRelated && (!s.relatedStoryIds || s.relatedStoryIds.length === 0)) {
      related = newRelated;
      storiesUpdated++;
    }

    // Apply bidirectional fixes
    for (const fix of fixes) {
      if (!related.includes(fix.addRelated)) {
        related.push(fix.addRelated);
      }
    }

    return { ...s, relatedStoryIds: related.length > 0 ? related : undefined };
  });

  console.log(`Updated relatedStoryIds on ${storiesUpdated} stories`);
  if (bidirectionalFixes.length > 0) {
    console.log(`Applied ${bidirectionalFixes.length} bidirectional fixes`);
  }

  // Write updated stories.ts
  function formatStory(s: typeof updatedStories[0]): string {
    const lines: string[] = [];
    lines.push('  {');
    lines.push(`    id: '${escapeString(s.id)}',`);
    lines.push(`    name: '${escapeString(s.name)}',`);
    if (s.nickname) lines.push(`    nickname: '${escapeString(s.nickname)}',`);
    lines.push(`    years: '${escapeString(s.years)}',`);
    lines.push(`    category: '${s.category}',`);
    lines.push(`    storyType: '${s.storyType}',`);
    lines.push(`    description: '${escapeString(s.description)}',`);
    lines.push(`    tags: [${s.tags.map(t => `'${escapeString(t)}'`).join(', ')}],`);
    if (s.contentWarning) lines.push(`    contentWarning: '${escapeString(s.contentWarning)}',`);
    lines.push(`    moments: [${s.moments.map(m => `{ momentId: '${escapeString(m.momentId)}'${m.narrativeGlue ? `, narrativeGlue: '${escapeString(m.narrativeGlue)}'` : ''} }`).join(', ')}],`);
    if (s.relatedStoryIds && s.relatedStoryIds.length > 0) {
      lines.push(`    relatedStoryIds: [${s.relatedStoryIds.map(r => `'${escapeString(r)}'`).join(', ')}],`);
    }
    if (s.wikipediaSlug) lines.push(`    wikipediaSlug: '${escapeString(s.wikipediaSlug)}',`);
    lines.push('  },');
    return lines.join('\n');
  }

  const storiesTs = `import type { Story } from '../types';\n\nexport const stories: Story[] = [\n${updatedStories.map(formatStory).join('\n')}\n];\n`;
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'data', 'stories.ts'), storiesTs);
  console.log('Wrote updated src/data/stories.ts');
} else {
  console.log('\n(No related-stories-output.json found — skipping Phase 3B)');
}

// ── Summary ──────────────────────────────────────────────────────────

console.log(`\n=== Summary ===`);
console.log(`Moments updated with entityIds: ${momentsUpdated}`);
console.log(`New entity IDs needing records: ${allNewEntityIds.size}`);
console.log(`\nDone! Run \`npx tsc --noEmit\` to verify.`);
