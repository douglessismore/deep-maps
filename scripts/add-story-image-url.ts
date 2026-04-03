/**
 * Add image_url column to stories table and backfill from static data.
 * Also sets up storage policy for anon uploads to story-images bucket.
 *
 * Usage:
 *   npx tsx scripts/add-story-image-url.ts
 *   npx tsx scripts/add-story-image-url.ts --dry-run
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var (from .env.local or shell)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local or as an env var.');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Static image data to backfill ──────────────────────────────────
// Map of story_id → Supabase Storage URL (only stories with images in static data)

const STATIC_IMAGES: Record<string, string> = {
  'archive-war': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/archive-war.webp',
  'treaty-oak': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/treaty-oak.jpg',
  'austin-dam-collapse': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/austin-dam-1900.jpeg',
  'ut-tower-shooting': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/ut-tower-shooting.jpg',
  'chitlin-circuit': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/chitlin-circuit.jpg',
  'dazed-and-confused': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/dazed-and-confused.jpg',
  'miranda-v-arizona': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/miranda-arizona.jpg',
  'papago-park-escape': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/papago-escape.jpg',
  'trunk-murderess': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/trunk-murderess.jpg',
  'phoenix-lights': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/phoenix-lights.jpg',
  'az-internment-camps': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/az-internment-camps.jpg',
  'don-bolles': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/don-bolles.jpg',
  'pitch-putt': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/pitch-putt.jpeg',
  'capital-city-klan': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/capital-city-klan.webp',
  'austin-antiwar': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/antiwar-1.webp',
  'spanish-missions': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/spanish-missions.jpg',
  'clarksville-freedmens': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/clarksville-freedmens.webp',
  'capitol-dedication': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/capitol-dedication.jpg',
  'economy-furniture': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/economy-furniture.webp',
  'origin-of-writing': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/origin-writing.jpg',
  'austin-flood-1915': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/austin-flood-1915.png',
  'austin-tornado-1922': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/austin-tornado-stedwards.jpg',
  'barton-springs-deseg': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/barton-springs-deseg.webp',
  'yogurt-shop-murders': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/yogurt-shop.jpeg',
  'acl-founding': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/acl-founding.jpg',
  'irs-suicide-attack': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/2010-suicide-attack.jpg',
  'servant-girl-annihilator': 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/story-images/servant-girl.jpg',
};

async function main() {
  console.log(dryRun ? '=== DRY RUN ===' : '=== LIVE RUN ===');

  // Step 1: Add image_url column if it doesn't exist
  console.log('\n1. Adding image_url column to stories table...');
  if (!dryRun) {
    const { error: colError } = await sb.rpc('exec_sql', {
      sql: 'ALTER TABLE stories ADD COLUMN IF NOT EXISTS image_url TEXT;',
    });
    // rpc('exec_sql') may not exist — fall back to raw REST
    if (colError) {
      console.log('   rpc failed, trying raw SQL via postgrest...');
      // Use the Supabase management API or just try the update — column may already exist
      console.log('   Column may already exist or needs manual creation via Supabase dashboard.');
      console.log('   SQL: ALTER TABLE stories ADD COLUMN IF NOT EXISTS image_url TEXT;');
    } else {
      console.log('   ✓ Column added');
    }
  }

  // Step 2: Backfill image URLs
  console.log(`\n2. Backfilling ${Object.keys(STATIC_IMAGES).length} story image URLs...`);
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const [storyId, imageUrl] of Object.entries(STATIC_IMAGES)) {
    if (dryRun) {
      console.log(`   [dry] Would set ${storyId} → ${imageUrl.split('/').pop()}`);
      updated++;
      continue;
    }

    const { error, count } = await sb
      .from('stories')
      .update({ image_url: imageUrl })
      .eq('id', storyId);

    if (error) {
      if (error.message.includes('column "image_url" of relation "stories" does not exist')) {
        console.error('\n   ✗ image_url column does not exist. Run this SQL in Supabase dashboard:');
        console.error('     ALTER TABLE stories ADD COLUMN IF NOT EXISTS image_url TEXT;');
        process.exit(1);
      }
      console.log(`   ✗ ${storyId}: ${error.message}`);
      notFound++;
    } else {
      console.log(`   ✓ ${storyId} → ${imageUrl.split('/').pop()}`);
      updated++;
    }
  }

  console.log(`\n   Done: ${updated} updated, ${skipped} skipped, ${notFound} errors`);

  // Step 3: Storage policy info
  console.log('\n3. Storage policy for anon uploads:');
  console.log('   Run this SQL in Supabase dashboard (SQL Editor):');
  console.log(`
  -- Allow anonymous uploads to story-images bucket
  INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
  VALUES (
    'Allow anon uploads to story-images',
    'story-images',
    'INSERT',
    'true',
    'true'
  )
  ON CONFLICT DO NOTHING;
  `);
  console.log('   Or use the Supabase dashboard: Storage → story-images → Policies → New Policy → Allow uploads for anon role');
}

main().catch(console.error);
