/**
 * Generate TTS audio files from moment narrativeContext.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-tts.ts
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-tts.ts --voice alloy
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-tts.ts --moment annihilator-mollie-smith
 *
 * Output: scripts/output/audio/{momentId}.mp3
 * Idempotent: skips existing files unless --force is passed.
 */

import { moments } from '../src/data/moments';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Missing OPENAI_API_KEY. Set it in your environment.');
  process.exit(1);
}

const OUTPUT_DIR = join(__dirname, 'output', 'audio');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

async function main() {

// Parse args
const args = process.argv.slice(2);
const voiceIdx = args.indexOf('--voice');
const voice = voiceIdx !== -1 ? args[voiceIdx + 1] : 'ash';
const momentIdx = args.indexOf('--moment');
const singleMoment = momentIdx !== -1 ? args[momentIdx + 1] : null;
const force = args.includes('--force');

// Filter moments with narrativeContext
let eligible = moments.filter((m) => m.narrativeContext && m.narrativeContext.trim().length > 0);
if (singleMoment) {
  eligible = eligible.filter((m) => m.id === singleMoment);
  if (eligible.length === 0) {
    console.error(`Moment '${singleMoment}' not found or has no narrativeContext.`);
    process.exit(1);
  }
}

console.log(`Found ${eligible.length} moments with narrativeContext.`);
console.log(`Voice: ${voice} | Output: ${OUTPUT_DIR}`);
console.log('');

let generated = 0;
let skipped = 0;
let errors = 0;
let totalChars = 0;

for (const moment of eligible) {
  const outPath = join(OUTPUT_DIR, `${moment.id}.mp3`);

  // Skip existing unless --force
  if (existsSync(outPath) && !force) {
    skipped++;
    continue;
  }

  const rawText = moment.narrativeContext!.trim();
  // Preprocess for TTS pronunciation: expand abbreviations that get read as letters
  const text = rawText
    .replace(/\bW\.?\s+(?=\d|[A-Z][a-z])/g, 'West ')    // W 6th → West 6th
    .replace(/\bE\.?\s+(?=\d|[A-Z][a-z])/g, 'East ')     // E 4th → East 4th
    .replace(/\bN\.?\s+(?=\d|[A-Z][a-z])/g, 'North ')    // N Lamar → North Lamar
    .replace(/\bS\.?\s+(?=\d|[A-Z][a-z])/g, 'South ')    // S Congress → South Congress
    .replace(/\bSt\b(?=\s*[,.]|\s+[A-Z])/g, 'Street')    // 6th St, → 6th Street,
    .replace(/\bBlvd\b/g, 'Boulevard')
    .replace(/\bAve\b/g, 'Avenue')
    .replace(/\bRd\b/g, 'Road')
    .replace(/\bDr\b(?=\s*[,.]|\s+[A-Z])/g, 'Drive')     // Academy Dr, → Academy Drive,
    .replace(/\bHwy\b/g, 'Highway')
    .replace(/\bPl\b/g, 'Place')
    .replace(/\bLn\b/g, 'Lane')
    .replace(/\bCt\b/g, 'Court');
  totalChars += text.length;

  try {
    console.log(`[${generated + skipped + errors + 1}/${eligible.length}] ${moment.id} (${text.length} chars)...`);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice,
        input: text,
        instructions: 'You\'re a true crime podcaster who just moved to Austin and is losing their mind over what they\'re discovering. Every location makes you more obsessed. You talk like someone leaving a voice memo for a friend at midnight because you just found out something incredible and can\'t wait until morning. Natural, raw, real. Not polished — urgent. Breathe. React to what you\'re saying. If something is horrifying, sound horrified. If something is ironic, let yourself almost laugh. This is not a performance. This is someone who genuinely cannot believe what happened right here.',
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`  ERROR: ${response.status} ${err}`);
      errors++;
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(outPath, buffer);
    console.log(`  -> ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
    generated++;

    // Rate limit: 1 req/sec
    await new Promise((r) => setTimeout(r, 1100));
  } catch (err) {
    console.error(`  ERROR: ${err}`);
    errors++;
  }
}

console.log('');
console.log('════════════════════════════════════════');
console.log(`  Generated: ${generated}`);
console.log(`  Skipped:   ${skipped}`);
console.log(`  Errors:    ${errors}`);
console.log(`  Total chars: ${totalChars}`);
console.log(`  Est. cost: $${(totalChars * 0.015 / 1000).toFixed(2)}`);
console.log('════════════════════════════════════════');
}

main().catch(console.error);
