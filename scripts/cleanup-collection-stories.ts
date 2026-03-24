#!/usr/bin/env npx tsx
/**
 * Deep Maps — Collection-Style Story Cleanup
 *
 * Removes stories that are actually collections (lists of unrelated moments
 * grouped by theme, not narrative arcs). Safety checks ensure no moments
 * are orphaned — each moment must be wired to at least one other story
 * or collection before its fake-story link is removed.
 *
 * Usage:
 *   npx tsx scripts/cleanup-collection-stories.ts              # dry run (report only)
 *   npx tsx scripts/cleanup-collection-stories.ts --execute     # actually delete
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DRY_RUN = !process.argv.includes('--execute');

// ── Stories to remove ──────────────────────────────────────────────
const STORIES_TO_DELETE = [
  'wwii-decisive-battles',
  'literary-titans',
  'holy-land-biblical-sites',
  'eastern-pilgrimage-sites',
  'catholic-pilgrimage-sites',
  'ancient-battles',
  'american-battlefields',
  'wars-of-empire',
  'empire-builders',
  'thinkers-sages',
  'revolutionary-leaders',
  'artists-writers-immortal',
  'artists-composers-icons',
  'famous-impact-craters',
  'meteorite-falls-and-fields',
  'ancient-impact-structures',
  'medieval-conquests',
  'wwi-battlefields',
  'notable-people',
  'notable-people-2',
  'historys-bravest',
  'scientific-minds-2',
  'scientific-revolution',
  'great-events-hebrew-bible',
  'revolutionaries-pen-pulpit',
];

// ── Helpers ────────────────────────────────────────────────────────
async function fetchAll(table: string, select = '*') {
  const { data, error } = await sb.from(table).select(select);
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
  return data ?? [];
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🧹 Collection-Style Story Cleanup ${DRY_RUN ? '(DRY RUN)' : '(EXECUTING)'}`);
  console.log('─'.repeat(60));

  // 1. Fetch all join tables
  const [storyMoments, collectionMoments, relatedStories, stories] = await Promise.all([
    fetchAll('story_moments'),
    fetchAll('collection_moments'),
    fetchAll('related_stories'),
    fetchAll('stories', 'id,name,story_type'),
  ]);

  // Build lookup maps
  const deleteSet = new Set(STORIES_TO_DELETE);

  // Verify all target stories exist
  const existingIds = new Set(stories.map((s: any) => s.id));
  const missing = STORIES_TO_DELETE.filter(id => !existingIds.has(id));
  if (missing.length) {
    console.log(`⚠️  ${missing.length} stories not found in DB (already deleted?): ${missing.join(', ')}`);
  }
  const toDelete = STORIES_TO_DELETE.filter(id => existingIds.has(id));
  console.log(`\n📋 Stories to delete: ${toDelete.length}`);
  for (const id of toDelete) {
    const s = stories.find((s: any) => s.id === id);
    console.log(`   - ${id} → "${s?.name}"`);
  }

  // 2. Find all moments linked to these stories
  const momentsInTargetStories = storyMoments
    .filter((sm: any) => deleteSet.has(sm.story_id))
    .map((sm: any) => sm.moment_id);
  const uniqueMomentIds = [...new Set(momentsInTargetStories)];

  console.log(`\n📌 Moments linked to target stories: ${uniqueMomentIds.length}`);

  // 3. For each moment, check if it's safe (wired elsewhere)
  const orphaned: string[] = [];
  const safeViaStory: string[] = [];
  const safeViaCollection: string[] = [];

  const collectionMomentIds = new Set(collectionMoments.map((cm: any) => cm.moment_id));

  for (const momentId of uniqueMomentIds) {
    // Check other stories (not in our delete list)
    const otherStoryLinks = storyMoments.filter(
      (sm: any) => sm.moment_id === momentId && !deleteSet.has(sm.story_id)
    );
    const inCollection = collectionMomentIds.has(momentId);

    if (otherStoryLinks.length > 0) {
      safeViaStory.push(momentId);
    } else if (inCollection) {
      safeViaCollection.push(momentId);
    } else {
      orphaned.push(momentId);
    }
  }

  console.log(`\n🔒 Safety check:`);
  console.log(`   ✅ Safe via other stories: ${safeViaStory.length}`);
  console.log(`   ✅ Safe via collections:   ${safeViaCollection.length}`);
  console.log(`   ⚠️  Would be orphaned:     ${orphaned.length}`);

  if (orphaned.length > 0) {
    console.log(`\n   Orphaned moments:`);
    for (const id of orphaned) {
      console.log(`      - ${id}`);
    }

    // Auto-fix: add orphaned moments to 'famous-battlefields' collection
    console.log(`\n   → Will add orphaned moments to 'famous-battlefields' collection`);
    if (!DRY_RUN) {
      for (const momentId of orphaned) {
        const { error } = await sb.from('collection_moments').upsert({
          collection_id: 'famous-battlefields',
          moment_id: momentId,
        }, { onConflict: 'collection_id,moment_id' });
        if (error) {
          console.log(`      ❌ Failed to add ${momentId}: ${error.message}`);
        } else {
          console.log(`      ✅ Added ${momentId} to famous-battlefields`);
        }
      }
    }
  }

  // 4. Find related_stories entries referencing target stories
  const relatedToDelete = relatedStories.filter(
    (rs: any) => deleteSet.has(rs.story_id) || deleteSet.has(rs.related_story_id)
  );
  console.log(`\n🔗 related_stories entries to remove: ${relatedToDelete.length}`);

  // 5. Count story_moments entries to remove
  const storyMomentsToDelete = storyMoments.filter(
    (sm: any) => deleteSet.has(sm.story_id)
  );
  console.log(`🔗 story_moments entries to remove: ${storyMomentsToDelete.length}`);

  // 6. Execute deletions
  if (DRY_RUN) {
    console.log(`\n⏸️  DRY RUN — no changes made. Run with --execute to apply.`);
    console.log(`\n   Summary of what would happen:`);
    console.log(`   - Delete ${storyMomentsToDelete.length} story_moments rows`);
    console.log(`   - Delete ${relatedToDelete.length} related_stories rows`);
    console.log(`   - Delete ${toDelete.length} stories`);
    if (orphaned.length > 0) {
      console.log(`   - Add ${orphaned.length} orphaned moments to famous-battlefields`);
    }
    return;
  }

  console.log(`\n🚀 Executing deletions...`);

  // Step A: Remove story_moments for target stories
  for (const storyId of toDelete) {
    const { error, count } = await sb
      .from('story_moments')
      .delete({ count: 'exact' })
      .eq('story_id', storyId);
    if (error) {
      console.log(`   ❌ story_moments for ${storyId}: ${error.message}`);
    } else {
      console.log(`   ✅ story_moments for ${storyId}: ${count} rows deleted`);
    }
  }

  // Step B: Remove related_stories referencing target stories
  for (const storyId of toDelete) {
    await sb.from('related_stories').delete().eq('story_id', storyId);
    await sb.from('related_stories').delete().eq('related_story_id', storyId);
  }
  console.log(`   ✅ related_stories: cleaned`);

  // Step C: Null out any entity.canonical_story_id pointing to deleted stories
  for (const storyId of toDelete) {
    const { error } = await sb
      .from('entities')
      .update({ canonical_story_id: null })
      .eq('canonical_story_id', storyId);
    if (error) {
      console.log(`   ⚠️  entities.canonical_story_id for ${storyId}: ${error.message}`);
    }
  }
  console.log(`   ✅ entities.canonical_story_id: nulled where needed`);

  // Step D: Delete the stories themselves
  for (const storyId of toDelete) {
    const { error } = await sb.from('stories').delete().eq('id', storyId);
    if (error) {
      console.log(`   ❌ stories ${storyId}: ${error.message}`);
    } else {
      console.log(`   ✅ Deleted story: ${storyId}`);
    }
  }

  // 7. Final count
  const { count: finalStoryCount } = await sb
    .from('stories')
    .select('*', { count: 'exact', head: true });
  console.log(`\n✅ Done. Stories remaining: ${finalStoryCount}`);
  console.log(`   (Was ${stories.length}, deleted ${toDelete.length})`);
}

main().catch(console.error);
