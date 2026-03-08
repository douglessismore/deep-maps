/**
 * Applies storyType updates to stories.ts.
 * Reads story-type-updates.json (from Gemini Phase 2 output) and updates the stories data.
 *
 * Usage: npx tsx scripts/apply-story-types.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPDATES_FILE = path.join(__dirname, 'batches', 'story-type-updates.json');
const STORIES_FILE = path.join(__dirname, '..', 'src', 'data', 'stories.ts');

if (!fs.existsSync(UPDATES_FILE)) {
  console.error('No story-type-updates.json found. Run apply-gemini-output.ts first.');
  process.exit(1);
}

const updates: Record<string, string> = JSON.parse(fs.readFileSync(UPDATES_FILE, 'utf-8'));
let storiesContent = fs.readFileSync(STORIES_FILE, 'utf-8');

let applied = 0;
for (const [storyId, newType] of Object.entries(updates)) {
  // Find the story block and replace its storyType
  // Pattern: after `id: 'storyId',` ... `storyType: 'oldType',`
  const idPattern = new RegExp(`(id: '${storyId}',\\n[\\s\\S]*?storyType: )'[^']*'`, 'm');
  const match = storiesContent.match(idPattern);
  if (match) {
    storiesContent = storiesContent.replace(idPattern, `$1'${newType}'`);
    applied++;
    console.log(`  ${storyId}: → ${newType}`);
  } else {
    console.warn(`  WARNING: Could not find storyType for ${storyId}`);
  }
}

fs.writeFileSync(STORIES_FILE, storiesContent);
console.log(`\nApplied ${applied}/${Object.keys(updates).length} storyType updates to stories.ts`);
