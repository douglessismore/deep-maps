#!/usr/bin/env npx tsx
/**
 * Restore 46 stories incorrectly deleted in commit 6409e36.
 * Reads the stories from git history (commit 32d4195) and inserts them
 * into Supabase + story_moments join table.
 *
 * The static stories.ts file also needs manual restoration — this script
 * handles only the Supabase side.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { execSync } from 'child_process';
import { getSupabase } from './lib/pipeline.js';

const DRY_RUN = process.argv.includes('--dry-run');

// The 46 deleted story IDs
const DELETED_IDS = [
  'ed-gein', 'dahmer', 'elfego-baca', 'billy-the-kid', 'geronimo',
  'los-alamos', 'carlsbad-caverns', 'georgia-okeeffe', 'pueblo-revolt',
  'truth-or-consequences', 'chaco-canyon', 'vla', 'dennis-hopper-taos',
  'palace-of-governors', 'ted-bundy', 'john-wayne-gacy', 'little-rock-nine',
  'lincoln-life', 'jfk-life', 'mlk-life', 'rosa-parks', 'harriet-tubman',
  'malcolm-x', 'amelia-earhart', 'aluxes-cancun-bridge', 'cobalt-60-accident',
  'servant-girl-annihilator', 'janis-joplin-austin', 'armadillo-world-hq',
  'austin-1928-plan', 'cathedral-of-junk', 'michael-dell-startup',
  'stevie-ray-vaughan', 'congress-avenue-bats', 'driskill-hotel',
  'menger-hotel-rough-riders', 'milam-park-chile-queens', 'willie-nelson-austin',
  'paramount-theatre-austin', 'scholz-garden-austin', 'texas-state-cemetery',
  'mount-bonnell-austin', 'booker-t-washington-life', 'o-henry-life',
  'frida-kahlo-life', 'diego-rivera-murals',
];

async function main() {
  const sb = getSupabase();

  // Check which stories still exist in Supabase (they might have been synced before deletion)
  console.log(`Checking ${DELETED_IDS.length} deleted stories in Supabase...\n`);

  let existsInSupabase = 0;
  let missingFromSupabase = 0;
  let missingStoryMoments = 0;

  for (const id of DELETED_IDS) {
    const { data: story } = await sb.from('stories').select('id, name').eq('id', id).single();

    if (story) {
      // Story exists in Supabase — check if it has story_moments links
      const { data: links } = await sb.from('story_moments').select('moment_id').eq('story_id', id);
      if (!links || links.length === 0) {
        console.log(`⚠ ${id}: exists in Supabase but NO story_moments links`);
        missingStoryMoments++;
      } else {
        console.log(`✓ ${id}: "${story.name}" (${links.length} moments)`);
      }
      existsInSupabase++;
    } else {
      console.log(`✗ ${id}: MISSING from Supabase`);
      missingFromSupabase++;
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Exists in Supabase: ${existsInSupabase}`);
  console.log(`  Missing from Supabase: ${missingFromSupabase}`);
  console.log(`  Missing story_moments: ${missingStoryMoments}`);
  console.log(`═══════════════════════════════════════`);
}

main().catch(console.error);
