/**
 * Upload generated TTS audio files to Supabase Storage and patch moments.ts with audioUrl.
 *
 * Prerequisites:
 *   1. Create a Supabase Storage bucket named 'moment-audio' with public access
 *   2. Generate MP3s with generate-tts.ts
 *
 * Usage:
 *   source .env.local && npx tsx scripts/upload-audio.ts           # upload + patch
 *   source .env.local && npx tsx scripts/upload-audio.ts --dry-run # show what would happen
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Run: source .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET = 'moment-audio';
const AUDIO_DIR = join(__dirname, 'output', 'audio');
const MOMENTS_FILE = join(__dirname, '..', 'src', 'data', 'moments.ts');
const dryRun = process.argv.includes('--dry-run');

async function main() {

// Find all MP3 files
const mp3Files = readdirSync(AUDIO_DIR).filter((f) => f.endsWith('.mp3'));
console.log(`Found ${mp3Files.length} MP3 files in ${AUDIO_DIR}`);
if (dryRun) console.log('DRY RUN — nothing will be uploaded or patched\n');

const audioUrls: Record<string, string> = {};
let uploaded = 0;
let errors = 0;

for (const file of mp3Files) {
  const momentId = file.replace('.mp3', '');
  const filePath = join(AUDIO_DIR, file);
  const fileData = readFileSync(filePath);
  const storagePath = `${momentId}.mp3`;

  console.log(`[${uploaded + errors + 1}/${mp3Files.length}] ${momentId}...`);

  if (dryRun) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    audioUrls[momentId] = data.publicUrl;
    uploaded++;
    console.log(`  -> ${data.publicUrl} (dry run)`);
    continue;
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileData, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000', // 1 year cache
        upsert: true,
      });

    if (error) {
      console.error(`  ERROR: ${error.message}`);
      errors++;
      continue;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    audioUrls[momentId] = data.publicUrl;
    uploaded++;
    console.log(`  -> ${data.publicUrl}`);
  } catch (err) {
    console.error(`  ERROR: ${err}`);
    errors++;
  }
}

// Patch moments.ts with audioUrl values
console.log('\nPatching moments.ts...');
let momentsSource = readFileSync(MOMENTS_FILE, 'utf-8');
let patched = 0;

for (const [momentId, url] of Object.entries(audioUrls)) {
  // Find the moment block and add audioUrl after narrativeContext (or after description if no narrativeContext)
  // Pattern: look for the line with this moment's id, then find the closing of the object
  const idPattern = `id: '${momentId}'`;
  const idIdx = momentsSource.indexOf(idPattern);
  if (idIdx === -1) {
    console.log(`  SKIP: ${momentId} — not found in moments.ts`);
    continue;
  }

  // Check if audioUrl already exists for this moment
  const blockEnd = momentsSource.indexOf('\n  },', idIdx);
  const block = momentsSource.slice(idIdx, blockEnd);
  if (block.includes('audioUrl:')) {
    // Update existing audioUrl
    const audioUrlLine = momentsSource.slice(idIdx, blockEnd).match(/audioUrl: '[^']*'/);
    if (audioUrlLine) {
      momentsSource = momentsSource.slice(0, idIdx) +
        momentsSource.slice(idIdx, blockEnd).replace(/audioUrl: '[^']*'/, `audioUrl: '${url}'`) +
        momentsSource.slice(blockEnd);
    }
    patched++;
    continue;
  }

  // Insert audioUrl after narrativeContext line (or after description if no narrativeContext)
  const insertAfter = block.includes('narrativeContext') ? 'narrativeContext' : 'description';
  // Find the end of the insertAfter field's value in the block
  const fieldIdx = momentsSource.indexOf(insertAfter, idIdx);
  if (fieldIdx === -1 || fieldIdx > blockEnd) continue;

  // Find the next comma+newline after this field
  let searchFrom = fieldIdx;
  // Handle multi-line strings (template literals or long strings)
  let depth = 0;
  let inString = false;
  let stringChar = '';
  for (let i = searchFrom; i < blockEnd; i++) {
    const ch = momentsSource[i];
    if (!inString) {
      if (ch === '\'' || ch === '"' || ch === '`') { inString = true; stringChar = ch; }
    } else {
      if (ch === stringChar && momentsSource[i - 1] !== '\\') { inString = false; }
    }
    if (!inString && ch === ',' && momentsSource[i + 1] === '\n') {
      // Found the end of the field line — insert after this comma
      const insertPos = i + 1;
      const indent = '    '; // 4 spaces to match moment field indentation
      momentsSource = momentsSource.slice(0, insertPos) +
        `\n${indent}audioUrl: '${url}',` +
        momentsSource.slice(insertPos);
      patched++;
      break;
    }
  }
}

if (!dryRun && patched > 0) {
  writeFileSync(MOMENTS_FILE, momentsSource);
}

console.log('');
console.log('════════════════════════════════════════');
console.log(`  Uploaded: ${uploaded}`);
console.log(`  Patched:  ${patched}`);
console.log(`  Errors:   ${errors}`);
if (dryRun) console.log('  (DRY RUN — no changes made)');
console.log('════════════════════════════════════════');
if (!dryRun && patched > 0) {
  console.log('\nNext steps:');
  console.log('  1. Review changes: git diff src/data/moments.ts | head -100');
  console.log('  2. Sync to Supabase: source .env.local && npx tsx scripts/sync-to-supabase.ts');
}
}

main().catch(console.error);
