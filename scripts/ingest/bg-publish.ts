#!/usr/bin/env npx tsx
/**
 * Publish verified burial moments to Supabase.
 *
 * Reads bg-generated-moments-fixed.json, inserts each moment into:
 * 1. moments table (with GPS, metadata)
 * 2. moment_entities join table (link to person entity)
 * 3. story_moments join table (link to entity's canonical story, if exists)
 *
 * Usage:
 *   npx tsx scripts/ingest/bg-publish.ts --dry-run    # preview
 *   npx tsx scripts/ingest/bg-publish.ts               # publish
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getSupabase } from './lib/pipeline.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '../output');
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const sb = getSupabase();
  const moments = JSON.parse(
    readFileSync(resolve(OUTPUT_DIR, 'bg-generated-moments-fixed.json'), 'utf-8')
  );

  console.log(`Publishing ${moments.length} burial moments ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}\n`);

  // Pre-fetch entity canonical story IDs for wiring
  const entityIds = moments.map((m: any) => m.id.replace('-burial', ''));
  const { data: entities } = await sb
    .from('entities')
    .select('id, canonical_story_id')
    .in('id', entityIds);

  const storyMap = new Map<string, string>();
  for (const e of entities ?? []) {
    if (e.canonical_story_id) storyMap.set(e.id, e.canonical_story_id);
  }

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const m of moments) {
    const entityId = m.id.replace('-burial', '');
    console.log(`[${inserted + skipped + errors + 1}/${moments.length}] ${m.name}`);

    // Check if moment already exists
    const { data: existing } = await sb
      .from('moments')
      .select('id')
      .eq('id', m.id)
      .single();

    if (existing) {
      console.log(`  ⏭ Already exists — skipping`);
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would insert: ${m.id} → ${entityId}`);
      const storyId = storyMap.get(entityId);
      if (storyId) console.log(`  [DRY RUN] Would link to story: ${storyId}`);
      else console.log(`  [DRY RUN] No canonical story for ${entityId}`);
      inserted++;
      continue;
    }

    // Insert moment (using RPC for PostGIS point, then update other fields)
    // First insert the basic moment row
    const { error: insertErr } = await sb.from('moments').insert({
      id: m.id,
      name: m.name,
      subtitle: m.subtitle,
      description: m.description,
      type_id: m.type_id,
      importance: m.importance,
      accuracy: m.accuracy,
      kind: m.kind,
      year: m.year,
      date: m.date,
      address: m.address,
      verification_level: m.verification_level,
      source: m.source,
      source_id: m.source_id,
      geo_verified: m.geo_verified,
      geo_source_url: m.geo_source_url,
      geo_verified_at: m.geo_verified_at,
      // PostGIS point — use ST_MakePoint via raw SQL or the location column
      location: `SRID=4326;POINT(${m.lng} ${m.lat})`,
    });

    if (insertErr) {
      // Try with RPC if direct insert doesn't work with PostGIS
      console.log(`  ⚠ Direct insert failed (${insertErr.message}), trying without location...`);

      const { error: insertErr2 } = await sb.from('moments').insert({
        id: m.id,
        name: m.name,
        subtitle: m.subtitle,
        description: m.description,
        type_id: m.type_id,
        importance: m.importance,
        accuracy: m.accuracy,
        kind: m.kind,
        year: m.year,
        date: m.date,
        address: m.address,
        verification_level: m.verification_level,
        source: m.source,
        source_id: m.source_id,
        geo_verified: m.geo_verified,
        geo_source_url: m.geo_source_url,
        geo_verified_at: m.geo_verified_at,
      });

      if (insertErr2) {
        console.error(`  ❌ Insert failed: ${insertErr2.message}`);
        errors++;
        continue;
      }

      // Set location via RPC
      const { error: rpcErr } = await sb.rpc('update_moment_location', {
        p_id: m.id,
        p_lng: m.lng,
        p_lat: m.lat,
        p_source_url: m.geo_source_url,
      });

      if (rpcErr) {
        console.error(`  ❌ Location RPC failed: ${rpcErr.message}`);
      }
    }

    // Insert moment_entities join
    const { error: entityErr } = await sb.from('moment_entities').insert({
      moment_id: m.id,
      entity_id: entityId,
    });
    if (entityErr) {
      console.error(`  ⚠ Entity link failed: ${entityErr.message}`);
    }

    // Insert story_moments join (if entity has canonical story)
    const storyId = storyMap.get(entityId);
    if (storyId) {
      // Get next sort_order
      const { data: existingStoryMoments } = await sb
        .from('story_moments')
        .select('sort_order')
        .eq('story_id', storyId)
        .order('sort_order', { ascending: false })
        .limit(1);
      const nextSort = (existingStoryMoments?.[0]?.sort_order ?? 0) + 1;

      const { error: storyErr } = await sb.from('story_moments').insert({
        story_id: storyId,
        moment_id: m.id,
        sort_order: nextSort,
        is_primary: false,
      });
      if (storyErr) {
        console.error(`  ⚠ Story link failed: ${storyErr.message}`);
      } else {
        console.log(`  ✓ Linked to story: ${storyId} (sort: ${nextSort})`);
      }
    } else {
      console.log(`  ℹ No canonical story for ${entityId} — moment is standalone`);
    }

    console.log(`  ✓ Published`);
    inserted++;
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log('═══════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
