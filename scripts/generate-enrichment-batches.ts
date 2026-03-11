/**
 * Generates batch files for Gemini Phase 3 enrichment.
 *
 * Phase 3A: Orphaned moments (no entityIds) → batches for entity tagging
 * Phase 3B: Stories without relatedStoryIds → batch for story connections
 *
 * Usage: npx tsx scripts/generate-enrichment-batches.ts
 * Output: scripts/batches/enrich-01.json, enrich-02.json, etc.
 *         scripts/batches/related-stories.json
 */
import { moments } from '../src/data/moments';
import { stories } from '../src/data/stories';
import { entities } from '../src/data/entities';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCH_SIZE = 30;
const OUTPUT_DIR = path.join(__dirname, 'batches');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ── Phase 3A: Orphaned moments (no entityIds) ───────────────────────

// Build moment → stories mapping
const momentStories = new Map<string, string[]>();
stories.forEach(s => {
  s.moments.forEach(sm => {
    const list = momentStories.get(sm.momentId) || [];
    list.push(s.id);
    momentStories.set(sm.momentId, list);
  });
});

// Build story name lookup
const storyNames = new Map<string, string>();
stories.forEach(s => storyNames.set(s.id, `${s.name}${s.nickname ? ` (${s.nickname})` : ''}`));

// Filter to moments WITHOUT entityIds
const orphanedMoments = moments.filter(m => !m.entityIds || m.entityIds.length === 0);

console.log(`\n=== Phase 3A: Entity Tagging ===`);
console.log(`Total moments: ${moments.length}`);
console.log(`Moments with entityIds: ${moments.length - orphanedMoments.length}`);
console.log(`Orphaned moments (need tagging): ${orphanedMoments.length}`);

// Generate entity reference list for the prompt
const entityList = entities.map(e => ({
  id: e.id,
  name: e.name,
  type: e.type,
}));

// Save entity reference list
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'entity-reference.json'),
  JSON.stringify(entityList, null, 2)
);
console.log(`\nSaved entity reference list (${entityList.length} entities) → entity-reference.json`);

// Generate orphaned moment batches
const totalBatches = Math.ceil(orphanedMoments.length / BATCH_SIZE);
console.log(`\nGenerating ${totalBatches} batches of ~${BATCH_SIZE} moments each`);

for (let i = 0; i < totalBatches; i++) {
  const start = i * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, orphanedMoments.length);
  const batch = orphanedMoments.slice(start, end);

  const batchData = batch.map(m => ({
    id: m.id,
    name: m.name,
    subtitle: m.subtitle,
    description: m.description,
    year: m.year || null,
    type: m.type,
    parentStories: (momentStories.get(m.id) || []).map(sid => ({
      id: sid,
      name: storyNames.get(sid) || sid,
    })),
  }));

  const batchNum = String(i + 1).padStart(2, '0');
  const filename = `enrich-${batchNum}.json`;
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), JSON.stringify(batchData, null, 2));
  console.log(`  ${filename}: moments ${start + 1}-${end} (${batch.length} moments)`);
}

// ── Phase 3B: Stories without relatedStoryIds ────────────────────────

const orphanedStories = stories.filter(s => !s.relatedStoryIds || s.relatedStoryIds.length === 0);

console.log(`\n=== Phase 3B: Related Stories ===`);
console.log(`Total stories: ${stories.length}`);
console.log(`Stories with relatedStoryIds: ${stories.length - orphanedStories.length}`);
console.log(`Orphaned stories (need connections): ${orphanedStories.length}`);

// Generate story data for relatedStoryIds suggestions
// Include ALL stories so Gemini can suggest connections from the full catalogue
const allStorySummaries = stories.map(s => ({
  id: s.id,
  name: s.name,
  nickname: s.nickname || null,
  category: s.category,
  storyType: s.storyType,
  tags: s.tags,
  years: s.years,
  momentCount: s.moments.length,
  existingRelated: s.relatedStoryIds || [],
  needsRelated: !s.relatedStoryIds || s.relatedStoryIds.length === 0,
}));

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'related-stories.json'),
  JSON.stringify(allStorySummaries, null, 2)
);
console.log(`  related-stories.json: ${stories.length} stories (${orphanedStories.length} need connections)`);

// ── Summary ──────────────────────────────────────────────────────────

console.log(`\n=== Workflow ===`);
console.log(`1. Copy scripts/gemini-prompt-phase3-enrich.md instructions into Gemini chat`);
console.log(`2. Paste entity-reference.json first (Gemini needs the ID list)`);
console.log(`3. Paste each enrich-XX.json and get back JSON with entityIds`);
console.log(`4. Save output as scripts/batches/enrich-XX-output.json`);
console.log(`5. Paste related-stories.json and get back relatedStoryIds suggestions`);
console.log(`6. Save output as scripts/batches/related-stories-output.json`);
console.log(`7. Run: npx tsx scripts/apply-enrichment.ts`);
