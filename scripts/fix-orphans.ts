#!/usr/bin/env npx tsx
/**
 * Find orphan moments and wire them to appropriate stories.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

async function main() {
  // Get all moments and story_moments
  const { data: allMoments } = await sb.from('moments').select('id, name, source');
  const { data: storyMoments } = await sb.from('story_moments').select('moment_id');
  const inStory = new Set((storyMoments || []).map(sm => sm.moment_id));

  const orphans = (allMoments || []).filter(m => {
    return !inStory.has(m.id);
  });

  console.log(`=== ORPHAN MOMENTS (${orphans.length}) ===\n`);

  for (const m of orphans) {
    // Check entity links
    const { data: entities } = await sb.from('moment_entities').select('entity_id').eq('moment_id', m.id);
    const entityIds = (entities || []).map(e => e.entity_id);

    let targetStory: string | null = null;

    if (entityIds.length > 0) {
      for (const eid of entityIds) {
        const { data: entity } = await sb.from('entities').select('canonical_story_id, name').eq('id', eid);
        if (entity && entity[0]?.canonical_story_id) {
          targetStory = entity[0].canonical_story_id;
          console.log(`${m.id} → entity "${entity[0].name}" → story "${targetStory}"`);
          break;
        }
      }
    }

    if (!targetStory) {
      // Try to infer from moment ID prefix
      const prefix = m.id.split('-').slice(0, 2).join('-');
      const { data: matchingStories } = await sb.from('stories').select('id').ilike('id', `%${prefix}%`).limit(1);
      if (matchingStories && matchingStories.length > 0) {
        targetStory = matchingStories[0].id;
        console.log(`${m.id} → inferred from prefix → story "${targetStory}"`);
      } else {
        console.log(`${m.id} → ❌ NO story found (no entity links, no prefix match)`);
        console.log(`  Name: ${m.name}`);
      }
    }

    // Wire it
    if (targetStory) {
      // Check story exists
      const { data: storyExists } = await sb.from('stories').select('id').eq('id', targetStory);
      if (!storyExists || storyExists.length === 0) {
        console.log(`  ⚠ Story "${targetStory}" doesn't exist — can't wire`);
        continue;
      }

      // Get current max sort_order for this story
      const { data: existing } = await sb.from('story_moments').select('sort_order').eq('story_id', targetStory).order('sort_order', { ascending: false }).limit(1);
      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

      const { error } = await sb.from('story_moments').upsert({
        story_id: targetStory,
        moment_id: m.id,
        sort_order: nextOrder,
        is_primary: false,
      }, { onConflict: 'story_id,moment_id' });

      if (error) {
        console.log(`  ❌ Failed to wire: ${error.message}`);
      } else {
        console.log(`  ✅ Wired to "${targetStory}" (sort_order: ${nextOrder})`);
      }
    }
  }

  // Also fix the 5 pipeline stories with no relatedStoryIds
  console.log('\n=== ADDING relatedStoryIds TO PIPELINE STORIES ===\n');

  const pipelineRelations: [string, string[]][] = [
    ['albert-einstein-life', ['isaac-newton', 'galileo-galilei', 'marie-curie']],
    ['william-shakespeare-life', ['charles-dickens', 'oscar-wilde', 'victor-hugo']],
    ['leonardo-da-vinci-life', ['michelangelo', 'galileo-galilei', 'caravaggio']],
    ['aristotle-life', ['plato', 'alexander-the-great']],
    ['julius-caesar-life', ['alexander-the-great', 'cleopatra', 'napoleon-bonaparte']],
  ];

  for (const [storyId, relatedIds] of pipelineRelations) {
    // Check which related stories actually exist
    for (const relId of relatedIds) {
      const { data: exists } = await sb.from('stories').select('id').eq('id', relId).limit(1);
      if (!exists || exists.length === 0) {
        console.log(`  ⚠ "${relId}" doesn't exist as a story — skipping`);
        continue;
      }
      // Upsert both directions
      const { error: e1 } = await sb.from('related_stories').upsert(
        { story_id: storyId, related_story_id: relId },
        { onConflict: 'story_id,related_story_id' }
      );
      const { error: e2 } = await sb.from('related_stories').upsert(
        { story_id: relId, related_story_id: storyId },
        { onConflict: 'story_id,related_story_id' }
      );
      if (e1 || e2) {
        console.log(`  ❌ ${storyId} ↔ ${relId}: ${e1?.message || e2?.message}`);
      } else {
        console.log(`  ✅ ${storyId} ↔ ${relId}`);
      }
    }
  }
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
