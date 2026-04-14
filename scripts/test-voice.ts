/**
 * Quick voice test script. Generates a single MP3 with custom voice + instructions.
 *
 * Usage:
 *   OPENAI_API_KEY=... npx tsx scripts/test-voice.ts
 *   open /tmp/deepmaps-voice-test.mp3
 */
import { writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const text = `You're standing on West 6th Street near the 900 block, which used to be called Pecan Street. There's nothing here now that hints at what happened. The W.K. Hall residence is long gone, replaced by the bars and restaurants of the Sixth Street entertainment district. On the night of December 30, 1884, a servant named Mollie Smith was dragged from her bed in the servants' quarters out back and killed with an axe. Her companion, Walter Spencer, was found unconscious with a bloody head wound. Nobody in the main house heard a thing.`;

const instructions = `You're a true crime podcaster who just moved to Austin and is losing their mind over what they're discovering. Every location makes you more obsessed. You talk like someone leaving a voice memo for a friend at midnight because you just found out something incredible and can't wait until morning. Natural, raw, real. Not polished — urgent. Breathe. React to what you're saying. If something is horrifying, sound horrified. If something is ironic, let yourself almost laugh. This is not a performance. This is someone who genuinely cannot believe what happened right here.`;

async function main() {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'ash',
      input: text,
      instructions,
      speed: 1.1,
      response_format: 'wav',
    }),
  });

  if (!response.ok) {
    console.error('Error:', response.status, await response.text());
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync('/tmp/deepmaps-voice-test.wav', buffer);
  console.log('Done: /tmp/deepmaps-voice-test.wav (' + (buffer.length / 1024).toFixed(1) + ' KB)');
}

main().catch(console.error);
