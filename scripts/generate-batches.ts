/**
 * Generates batch files for Gemini Phase 2 processing.
 * Each batch contains ~30 moments in JSON format, ready to paste into Gemini.
 *
 * Usage: npx tsx scripts/generate-batches.ts
 * Output: scripts/batches/batch-01.json, batch-02.json, etc.
 */
import { moments } from '../src/data/moments';
import { stories } from '../src/data/stories';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BATCH_SIZE = 30;
const OUTPUT_DIR = path.join(__dirname, 'batches');

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
stories.forEach(s => storyNames.set(s.id, s.name));

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate batches
const totalBatches = Math.ceil(moments.length / BATCH_SIZE);
console.log(`Generating ${totalBatches} batches of ~${BATCH_SIZE} moments each (${moments.length} total)`);

for (let i = 0; i < totalBatches; i++) {
  const start = i * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, moments.length);
  const batch = moments.slice(start, end);

  const batchData = batch.map(m => ({
    id: m.id,
    currentName: m.name,
    currentSubtitle: m.subtitle,
    currentDescription: m.description,
    year: m.year || null,
    type: m.type,
    importance: m.importance,
    parentStories: (momentStories.get(m.id) || []).map(sid => ({
      id: sid,
      name: storyNames.get(sid) || sid,
    })),
  }));

  const batchNum = String(i + 1).padStart(2, '0');
  const filename = `batch-${batchNum}.json`;
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), JSON.stringify(batchData, null, 2));
  console.log(`  ${filename}: moments ${start + 1}-${end} (${batch.length} moments)`);
}

// Also generate story type review
const storyTypeReview = stories.map(s => ({
  id: s.id,
  name: s.name,
  nickname: s.nickname || null,
  years: s.years,
  currentStoryType: s.storyType,
  tags: s.tags,
  momentCount: s.moments.length,
}));
fs.writeFileSync(path.join(OUTPUT_DIR, 'story-types-review.json'), JSON.stringify(storyTypeReview, null, 2));
console.log(`\n  story-types-review.json: ${stories.length} stories for storyType classification`);

console.log(`\nDone! Files are in scripts/batches/`);
console.log(`\nWorkflow:`);
console.log(`  1. Copy scripts/gemini-prompt-phase2.md instructions into Gemini chat`);
console.log(`  2. Paste each batch-XX.json and get back the rewritten JSON`);
console.log(`  3. Save Gemini output as scripts/batches/batch-XX-output.json`);
console.log(`  4. Run: npx tsx scripts/apply-gemini-output.ts`);
