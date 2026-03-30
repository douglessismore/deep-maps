#!/usr/bin/env npx tsx
/**
 * Import validated content files into Supabase.
 *
 * Imports entities, moments, stories, and all join-table links
 * (story_moments, moment_entities, related_stories) from:
 *   - del-valle-content.ts
 *   - mesa-phoenix-content.ts
 *   - seattle-portorchard-content.ts
 *
 * Also updates existing collections with new moment IDs where relevant.
 *
 * Usage:
 *   npx tsx scripts/ingest/import-validated-content.ts
 *   npx tsx scripts/ingest/import-validated-content.ts --dry-run
 */

import { getSupabase } from './lib/pipeline.js';
import type { Entity, Moment, Story } from '../../src/types/index.js';

import { delValleMoments, delValleStories, delValleEntities } from '../../src/data/del-valle-content.js';
import { mesaPhoenixMoments, mesaPhoenixStories, mesaPhoenixEntities } from '../../src/data/mesa-phoenix-content.js';
import { seattleMoments, seattleStories, seattleEntities } from '../../src/data/seattle-portorchard-content.js';

const DRY_RUN = process.argv.includes('--dry-run');

// ── All content combined ────────────────────────────────────────────

const allMoments: Moment[] = [...delValleMoments, ...mesaPhoenixMoments, ...seattleMoments];
const allStories: Story[] = [...delValleStories, ...mesaPhoenixStories, ...seattleStories];
const allEntities: Entity[] = [...delValleEntities, ...mesaPhoenixEntities, ...seattleEntities];

// ── Existing entities that appear in new moments (need moment_entities links) ──
// elizabeth-ii: bergstrom-queen-concorde
// barbara-jordan: aus-airport-opens
// ted-bundy: sea-bundy-sammamish
// william-boeing: sea-boeing-red-barn
// (These are already in Supabase — we just need the join-table entries)

// ── Collection updates: new moment IDs to add to existing collections ──
const collectionUpdates: Record<string, string[]> = {
  // Serial killer crime scenes
  'serial-killer-crime-scenes': [
    'sea-bundy-sammamish',       // Bundy abduction at Lake Sammamish
    'sea-green-river-first-body', // Green River first body
  ],
  // UFO sightings
  'ufo-sightings-crash-sites': [
    'phx-lights-piestewa-peak',  // Phoenix Lights main event
    'phx-lights-sierra-estrella', // Phoenix Lights second wave
  ],
  // Archaeological discoveries of the Americas
  'archaeological-discoveries-americas': [
    'phx-hohokam-pueblo-grande',  // Hohokam canal nerve center
    'phx-hohokam-mesa-grande',    // Mesa Grande platform mound
    'phx-hohokam-park-canals',    // Park of the Canals
    'mckinney-falls-indigenous',  // 9,000 years at Onion Creek
  ],
  // Indigenous peoples
  'indigenous-peoples-resistance-and-survival': [
    'sea-suquamish-old-man-house', // Suquamish longhouse burned
    'sea-chief-seattle-speech',    // Chief Seattle's speech
    'phx-hohokam-pueblo-grande',   // Hohokam civilization
  ],
};

// ── Stats tracking ─────────────────────────────────────────────────

const stats = {
  entitiesInserted: 0,
  entitiesSkipped: 0,
  momentsInserted: 0,
  momentsSkipped: 0,
  storiesInserted: 0,
  storiesSkipped: 0,
  storyMomentsLinked: 0,
  momentEntitiesLinked: 0,
  relatedStoriesLinked: 0,
  collectionMomentsAdded: 0,
  errors: 0,
};

// ── Helpers ────────────────────────────────────────────────────────

function parseYears(years: string): { startYear: number | null; endYear: number | null } {
  const matches = years.match(/(-?\d[\d,]*)/g);
  if (!matches) return { startYear: null, endYear: null };
  const nums = matches.map(m => parseInt(m.replace(/,/g, ''), 10));
  return {
    startYear: nums[0] ?? null,
    endYear: nums.length > 1 ? nums[1] : null,
  };
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const sb = getSupabase();
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  IMPORT VALIDATED CONTENT ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`  Entities: ${allEntities.length}  Moments: ${allMoments.length}  Stories: ${allStories.length}`);
  console.log(`${'═'.repeat(60)}\n`);

  // ── 1. ENTITIES ──
  console.log('--- ENTITIES ---');
  for (const e of allEntities) {
    const { data: existing } = await sb.from('entities').select('id').eq('id', e.id).single();
    if (existing) {
      console.log(`  skip ${e.id} (exists)`);
      stats.entitiesSkipped++;
      continue;
    }

    console.log(`  + ${e.id}: ${e.name}`);
    if (!DRY_RUN) {
      // Insert without canonical_story_id first (story may not exist yet)
      // We'll update canonical_story_id after stories are inserted.
      const { error } = await sb.from('entities').insert({
        id: e.id,
        name: e.name,
        type: e.type,
        years: e.years ?? null,
        description: e.description ?? null,
        canonical_story_id: null,
        wikipedia_slug: e.wikipediaSlug ?? null,
      });
      if (error) {
        console.error(`    ERROR: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.entitiesInserted++;
  }

  // ── 2. MOMENTS ──
  console.log('\n--- MOMENTS ---');
  for (const m of allMoments) {
    const { data: existing } = await sb.from('moments').select('id').eq('id', m.id).single();
    if (existing) {
      console.log(`  skip ${m.id} (exists)`);
      stats.momentsSkipped++;
      continue;
    }

    console.log(`  + ${m.id}: ${m.name.slice(0, 60)}...`);
    if (!DRY_RUN) {
      const { error } = await sb.from('moments').insert({
        id: m.id,
        name: m.name,
        subtitle: m.subtitle,
        description: m.description,
        location: `SRID=4326;POINT(${m.lng} ${m.lat})`,
        type_id: m.type,
        importance: m.importance,
        notability: m.notability ?? 30,
        accuracy: m.accuracy,
        kind: m.kind ?? 'event',
        year: m.year ?? null,
        date: m.date ?? null,
        address: m.address ?? null,
        verification_level: m.verificationLevel ?? 'verified',
        wiki_section: m.wikiSection ?? null,
        source: 'validated-content',
        source_id: null,
      });
      if (error) {
        console.error(`    ERROR: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.momentsInserted++;

    // moment_entities links
    if (m.entityIds && m.entityIds.length > 0) {
      for (const entityId of m.entityIds) {
        if (!DRY_RUN) {
          const { error } = await sb.from('moment_entities').upsert(
            { moment_id: m.id, entity_id: entityId },
            { onConflict: 'moment_id,entity_id' },
          );
          if (error) {
            console.error(`    ME link error ${m.id} -> ${entityId}: ${error.message}`);
          } else {
            stats.momentEntitiesLinked++;
          }
        } else {
          stats.momentEntitiesLinked++;
        }
      }
    }
  }

  // ── 3. STORIES ──
  console.log('\n--- STORIES ---');
  for (const s of allStories) {
    const { data: existing } = await sb.from('stories').select('id').eq('id', s.id).single();
    if (existing) {
      console.log(`  skip ${s.id} (exists)`);
      stats.storiesSkipped++;
      continue;
    }

    const { startYear, endYear } = parseYears(s.years);
    console.log(`  + ${s.id}: ${s.name} (${s.category})`);
    if (!DRY_RUN) {
      const { error } = await sb.from('stories').insert({
        id: s.id,
        name: s.name,
        nickname: s.nickname ?? null,
        years: s.years,
        start_year: startYear,
        end_year: endYear,
        category: s.category,
        story_type: s.storyType,
        description: s.description,
        tags: s.tags,
        content_warning: s.contentWarning ?? null,
        wikipedia_slug: s.wikipediaSlug ?? null,
      });
      if (error) {
        console.error(`    ERROR: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.storiesInserted++;

    // story_moments links
    for (let i = 0; i < s.moments.length; i++) {
      const sm = s.moments[i];
      if (!DRY_RUN) {
        const { error } = await sb.from('story_moments').upsert(
          {
            story_id: s.id,
            moment_id: sm.momentId,
            sort_order: i,
            narrative_glue: sm.narrativeGlue ?? null,
            is_primary: sm.isPrimary ?? false,
          },
          { onConflict: 'story_id,moment_id' },
        );
        if (error) {
          console.error(`    SM link error ${s.id} -> ${sm.momentId}: ${error.message}`);
        } else {
          stats.storyMomentsLinked++;
        }
      } else {
        stats.storyMomentsLinked++;
      }
    }

    // related_stories links
    if (s.relatedStoryIds) {
      for (const relatedId of s.relatedStoryIds) {
        if (!DRY_RUN) {
          const { error } = await sb.from('related_stories').upsert(
            { story_id: s.id, related_story_id: relatedId },
            { onConflict: 'story_id,related_story_id' },
          );
          if (error && !error.message.includes('violates foreign key')) {
            console.error(`    RS link error ${s.id} -> ${relatedId}: ${error.message}`);
          } else if (!error) {
            stats.relatedStoriesLinked++;
          }
        } else {
          stats.relatedStoriesLinked++;
        }
      }
    }
  }

  // ── 3b. UPDATE canonical_story_id on entities (now that stories exist) ──
  console.log('\n--- ENTITY canonical_story_id UPDATES ---');
  for (const e of allEntities) {
    if (e.canonicalStoryId) {
      if (!DRY_RUN) {
        const { error } = await sb.from('entities')
          .update({ canonical_story_id: e.canonicalStoryId })
          .eq('id', e.id);
        if (error) {
          console.error(`  canonical_story_id update error ${e.id} -> ${e.canonicalStoryId}: ${error.message}`);
        } else {
          console.log(`  ~ ${e.id} -> canonical_story_id = ${e.canonicalStoryId}`);
        }
      } else {
        console.log(`  ~ ${e.id} -> canonical_story_id = ${e.canonicalStoryId}`);
      }
    }
  }

  // ── 3c. RETRY failed moment_entities links (entities that failed to insert earlier) ──
  console.log('\n--- RETRY MOMENT_ENTITIES ---');
  for (const m of allMoments) {
    if (m.entityIds && m.entityIds.length > 0) {
      for (const entityId of m.entityIds) {
        if (!DRY_RUN) {
          const { error } = await sb.from('moment_entities').upsert(
            { moment_id: m.id, entity_id: entityId },
            { onConflict: 'moment_id,entity_id' },
          );
          if (error) {
            console.error(`    ME retry error ${m.id} -> ${entityId}: ${error.message}`);
          }
          // Don't increment stats again — just fixing failures
        }
      }
    }
  }

  // ── 4. COLLECTION UPDATES ──
  console.log('\n--- COLLECTION UPDATES ---');
  for (const [collectionId, newMomentIds] of Object.entries(collectionUpdates)) {
    console.log(`  ${collectionId}:`);

    // Get existing moment IDs for this collection
    const { data: existingLinks } = await sb
      .from('collection_moments')
      .select('moment_id, sort_order')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: false })
      .limit(1);

    let nextSortOrder = (existingLinks?.[0]?.sort_order ?? -1) + 1;

    for (const momentId of newMomentIds) {
      // Check if link already exists
      const { data: existingLink } = await sb
        .from('collection_moments')
        .select('moment_id')
        .eq('collection_id', collectionId)
        .eq('moment_id', momentId)
        .single();

      if (existingLink) {
        console.log(`    skip ${momentId} (already linked)`);
        continue;
      }

      console.log(`    + ${momentId} (sort_order: ${nextSortOrder})`);
      if (!DRY_RUN) {
        const { error } = await sb.from('collection_moments').insert({
          collection_id: collectionId,
          moment_id: momentId,
          sort_order: nextSortOrder,
        });
        if (error) {
          console.error(`      ERROR: ${error.message}`);
        } else {
          stats.collectionMomentsAdded++;
        }
      } else {
        stats.collectionMomentsAdded++;
      }
      nextSortOrder++;
    }
  }

  // ── Summary ──
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RESULTS ${DRY_RUN ? '(DRY RUN — nothing written)' : ''}`);
  console.log(`  Entities:       ${stats.entitiesInserted} inserted, ${stats.entitiesSkipped} skipped`);
  console.log(`  Moments:        ${stats.momentsInserted} inserted, ${stats.momentsSkipped} skipped`);
  console.log(`  Stories:        ${stats.storiesInserted} inserted, ${stats.storiesSkipped} skipped`);
  console.log(`  Story-Moments:  ${stats.storyMomentsLinked} linked`);
  console.log(`  Moment-Entities: ${stats.momentEntitiesLinked} linked`);
  console.log(`  Related Stories: ${stats.relatedStoriesLinked} linked`);
  console.log(`  Collection adds: ${stats.collectionMomentsAdded}`);
  console.log(`  Errors:         ${stats.errors}`);
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
