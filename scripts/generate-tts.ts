/**
 * Generate TTS audio files from moment name + description (two-clip pipeline).
 *
 * Pipeline per moment:
 *   1. Generate title (moment.name) as WAV via OpenAI TTS
 *   2. Generate body (moment.description) as WAV via OpenAI TTS
 *   3. Trim trailing silence from each clip (ffmpeg silenceremove, -40dB, 0.1s pad)
 *   4. Stitch: trimmed title + 0.75s silence + trimmed body
 *   5. Single MP3 encode at 192kbps
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-tts.ts
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-tts.ts --moment annihilator-mollie-smith
 *   OPENAI_API_KEY=sk-... npx tsx scripts/generate-tts.ts --force
 *
 * Output: scripts/output/audio/{momentId}.mp3
 * Requires: ffmpeg installed and on PATH.
 */

import { moments } from '../src/data/moments';
import { writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Missing OPENAI_API_KEY. Set it in your environment.');
  process.exit(1);
}

// Check ffmpeg is available
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
} catch {
  console.error('ffmpeg is required but not found on PATH. Install it first:');
  console.error('  brew install ffmpeg');
  process.exit(1);
}

const OUTPUT_DIR = join(__dirname, 'output', 'audio');
const TMP_DIR = join(OUTPUT_DIR, '.tmp');
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

const VOICE = 'fable';
const MODEL = 'gpt-4o-mini-tts';
const INSTRUCTIONS = [
  "You're narrating a noir documentary about real places and real events.",
  "Your tone is cinematic but grounded — think of the best true crime documentaries",
  "where the narrator sounds like they've personally walked every block and read every court transcript.",
  "Measured pacing. Let certain words land with weight.",
  "You're not rushing — every sentence matters.",
  "When something is horrifying, you don't shout. You get quieter.",
  "The contrast between the ordinary present-day street and what happened there should feel electric in your delivery.",
  "You are a male narrator. Never change your voice to match characters or subjects being discussed.",
].join(' ');

/** Expand common address abbreviations for natural TTS pronunciation */
function expandAbbreviations(text: string): string {
  return text
    .replace(/\bW\.?\s+(?=\d|[A-Z][a-z])/g, 'West ')
    .replace(/\bE\.?\s+(?=\d|[A-Z][a-z])/g, 'East ')
    .replace(/\bN\.?\s+(?=\d|[A-Z][a-z])/g, 'North ')
    .replace(/\bS\.?\s+(?=\d|[A-Z][a-z])/g, 'South ')
    .replace(/\bSt\b(?=\s*[,.]|\s+[A-Z])/g, 'Street')
    .replace(/\bBlvd\b/g, 'Boulevard')
    .replace(/\bAve\b/g, 'Avenue')
    .replace(/\bRd\b/g, 'Road')
    .replace(/\bDr\b(?=\s*[,.]|\s+[A-Z])/g, 'Drive')
    .replace(/\bHwy\b/g, 'Highway')
    .replace(/\bPl\b/g, 'Place')
    .replace(/\bLn\b/g, 'Lane')
    .replace(/\bCt\b/g, 'Court');
}

/** Call OpenAI TTS API, return WAV buffer */
async function generateWav(text: string): Promise<Buffer> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input: text,
      instructions: INSTRUCTIONS,
      response_format: 'wav',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`TTS API ${response.status}: ${err}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/** Trim trailing silence from a WAV file using ffmpeg (-40dB threshold, 0.1s padding) */
function trimSilence(inputPath: string, outputPath: string): void {
  // reverse_silence: removes silence from the end by reversing, trimming start, reversing back
  execSync(
    `ffmpeg -y -i "${inputPath}" -af "silenceremove=stop_periods=1:stop_duration=0.1:stop_threshold=-40dB,apad=pad_dur=0.1" "${outputPath}"`,
    { stdio: 'ignore' },
  );
}

/** Generate 0.75s of silence as a WAV file */
function generateSilence(outputPath: string): void {
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.75 "${outputPath}"`,
    { stdio: 'ignore' },
  );
}

/** Stitch WAV files together and encode as MP3 at 192kbps */
function stitchAndEncode(wavFiles: string[], outputMp3: string): void {
  // Create a concat file list
  const concatPath = join(TMP_DIR, 'concat.txt');
  const concatContent = wavFiles.map(f => `file '${f}'`).join('\n');
  writeFileSync(concatPath, concatContent);

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -codec:a libmp3lame -b:a 192k "${outputMp3}"`,
    { stdio: 'ignore' },
  );

  unlinkSync(concatPath);
}

/** Clean up temporary files */
function cleanupTmp(files: string[]): void {
  for (const f of files) {
    try { unlinkSync(f); } catch { /* ignore */ }
  }
}

async function main() {
  // Parse args
  const args = process.argv.slice(2);
  const momentIdx = args.indexOf('--moment');
  const singleMoment = momentIdx !== -1 ? args[momentIdx + 1] : null;
  const force = args.includes('--force');

  // Filter moments with a description (required for body clip)
  let eligible = moments.filter((m) => m.description && m.description.trim().length > 0);
  if (singleMoment) {
    eligible = eligible.filter((m) => m.id === singleMoment);
    if (eligible.length === 0) {
      console.error(`Moment '${singleMoment}' not found or has no description.`);
      process.exit(1);
    }
  }

  console.log(`Found ${eligible.length} moments with descriptions.`);
  console.log(`Voice: ${VOICE} | Model: ${MODEL} | Output: ${OUTPUT_DIR}`);
  console.log('Pipeline: title WAV → trim → 0.75s gap → body WAV → trim → MP3 192kbps');
  console.log('');

  // Pre-generate the silence gap (reused for every moment)
  const silencePath = join(TMP_DIR, 'silence-750ms.wav');
  generateSilence(silencePath);

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

    const titleText = expandAbbreviations(moment.name.trim());
    const bodyText = expandAbbreviations(moment.description.trim());
    const charCount = titleText.length + bodyText.length;
    totalChars += charCount;

    const tmpFiles: string[] = [];

    try {
      const idx = generated + skipped + errors + 1;
      console.log(`[${idx}/${eligible.length}] ${moment.id} (${charCount} chars)...`);

      // 1. Generate title WAV
      const titleRaw = join(TMP_DIR, `${moment.id}-title-raw.wav`);
      const titleTrimmed = join(TMP_DIR, `${moment.id}-title.wav`);
      const titleBuf = await generateWav(titleText);
      writeFileSync(titleRaw, titleBuf);
      tmpFiles.push(titleRaw, titleTrimmed);

      // Rate limit between API calls
      await new Promise((r) => setTimeout(r, 1100));

      // 2. Generate body WAV
      const bodyRaw = join(TMP_DIR, `${moment.id}-body-raw.wav`);
      const bodyTrimmed = join(TMP_DIR, `${moment.id}-body.wav`);
      const bodyBuf = await generateWav(bodyText);
      writeFileSync(bodyRaw, bodyBuf);
      tmpFiles.push(bodyRaw, bodyTrimmed);

      // 3. Trim silence from both clips
      trimSilence(titleRaw, titleTrimmed);
      trimSilence(bodyRaw, bodyTrimmed);

      // 4. Stitch: title + 0.75s silence + body → MP3
      stitchAndEncode([titleTrimmed, silencePath, bodyTrimmed], outPath);

      console.log(`  -> ${outPath}`);
      generated++;

      // Rate limit before next moment
      await new Promise((r) => setTimeout(r, 1100));
    } catch (err) {
      console.error(`  ERROR: ${err}`);
      errors++;
    } finally {
      cleanupTmp(tmpFiles);
    }
  }

  // Clean up shared silence file
  try { unlinkSync(silencePath); } catch { /* ignore */ }

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
