#!/usr/bin/env npx tsx
/**
 * Fix orphan BG burial moments — link them to their entity's canonical story.
 * Moments without a story_moments entry are invisible on the map.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { getSupabase } from './lib/pipeline.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const sb = getSupabase();

  // Get all BG moments
  const { data: bgMoments } = await sb
    .from('moments')
    .select('id, name, source')
    .eq('source', 'billiongraves');

  console.log(`Checking ${bgMoments?.length} BG moments for story linkage...\n`);

  let orphans = 0;
  let linked = 0;
  let noStory = 0;
  let alreadyLinked = 0;

  for (const m of bgMoments ?? []) {
    // Check if moment has a story_moments entry
    const { data: storyLinks } = await sb
      .from('story_moments')
      .select('story_id')
      .eq('moment_id', m.id);

    if (storyLinks && storyLinks.length > 0) {
      alreadyLinked++;
      continue;
    }

    // Orphan! Find the entity and its canonical story
    const { data: entityLinks } = await sb
      .from('moment_entities')
      .select('entity_id')
      .eq('moment_id', m.id);

    if (!entityLinks || entityLinks.length === 0) {
      console.log(`⚠ ${m.id}: no entity link — true orphan`);
      orphans++;
      continue;
    }

    const { data: entity } = await sb
      .from('entities')
      .select('id, name, canonical_story_id')
      .eq('id', entityLinks[0].entity_id)
      .single();

    if (!entity?.canonical_story_id) {
      console.log(`⚠ ${m.id}: entity "${entity?.name}" has no canonical_story_id`);
      noStory++;
      continue;
    }

    // Get next sort_order for this story
    const { data: existing } = await sb
      .from('story_moments')
      .select('sort_order')
      .eq('story_id', entity.canonical_story_id)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSort = (existing?.[0]?.sort_order ?? 0) + 1;

    if (DRY_RUN) {
      console.log(`→ ${m.id}: would link to ${entity.canonical_story_id} (sort: ${nextSort})`);
    } else {
      const { error } = await sb.from('story_moments').insert({
        story_id: entity.canonical_story_id,
        moment_id: m.id,
        sort_order: nextSort,
        is_primary: false,
      });
      if (error) {
        console.error(`❌ ${m.id}: ${error.message}`);
      } else {
        console.log(`✓ ${m.id} → ${entity.canonical_story_id}`);
      }
    }
    linked++;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Already linked: ${alreadyLinked}`);
  console.log(`  Newly linked: ${linked}`);
  console.log(`  No story available: ${noStory}`);
  console.log(`  True orphans: ${orphans}`);
  console.log(`═══════════════════════════════════════`);
}

main().catch(console.error);
