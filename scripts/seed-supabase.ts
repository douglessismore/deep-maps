/**
 * Seed Supabase from static TypeScript files.
 * Use this to initialize a fresh Supabase instance or re-sync from seed data.
 *
 * Supabase is the single source of truth. This script pushes seed data INTO Supabase.
 * To go the other direction (Supabase → static files), use dump-from-supabase.ts.
 *
 * Usage:
 *   npx tsx scripts/seed-supabase.ts              # Full sync
 *   npx tsx scripts/seed-supabase.ts --dry-run     # Report only, no writes
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var (from .env.local)
 * Schema: location = PostGIS POINT(lng lat), type_id = string FK to moment_types(id)
 */
import { createClient } from '@supabase/supabase-js';
import { moments } from '../src/data/moments';
import { entities } from '../src/data/entities';
import { stories } from '../src/data/stories';
import { collections } from '../src/data/collections';

const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local or as an env var.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let totalUpdated = 0, totalInserted = 0, totalDeleted = 0, totalErrors = 0;

// Known moment_types in Supabase
let validTypes: Set<string> = new Set();

async function loadTypes() {
  const { data } = await supabase.from('moment_types').select('id');
  if (data) data.forEach(t => validTypes.add(t.id));
  console.log(`Loaded ${validTypes.size} moment types`);
}

async function ensureType(typeName: string): Promise<string> {
  if (validTypes.has(typeName)) return typeName;
  if (DRY_RUN) { console.log(`  [dry-run] Would create moment_type: ${typeName}`); validTypes.add(typeName); return typeName; }
  const label = typeName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const { error } = await supabase.from('moment_types').insert({ id: typeName, label });
  if (!error) { validTypes.add(typeName); return typeName; }
  return 'historical_site';
}

async function syncMoments() {
  console.log('\n=== MOMENTS ===');
  const { data: dbMoments, error } = await supabase.from('moments').select('id, name, description, subtitle, year, address, accuracy, kind, importance, type_id');
  if (error) { console.error('Failed:', error.message); return; }

  const dbMap = new Map(dbMoments!.map(m => [m.id, m]));
  let updated = 0, inserted = 0, mismatches: string[] = [];

  for (const m of moments) {
    const typeId = await ensureType(m.type || 'historical_site');
    const db = dbMap.get(m.id);

    if (!db) {
      if (DRY_RUN) { console.log(`  [dry-run] Would INSERT moment: ${m.id}`); inserted++; continue; }
      const { error: err } = await supabase.from('moments').insert({
        id: m.id, name: m.name, subtitle: m.subtitle || null,
        description: m.description || null,
        location: `POINT(${m.lng} ${m.lat})`,
        type_id: typeId, importance: m.importance || 'minor',
        year: m.year, date: (m as any).date || null,
        address: m.address || null, accuracy: m.accuracy || 'approximate',
        kind: m.kind || 'event', notability: (m as any).notability || 50,
        verification_level: (m as any).verificationLevel || 'documented',
        wiki_section: (m as any).wikiSection || null,
      });
      if (err) { console.error(`  INSERT FAIL ${m.id}: ${err.message}`); totalErrors++; }
      else inserted++;
      continue;
    }

    const updates: Record<string, any> = {};
    if (db.name !== m.name) updates.name = m.name;
    if (db.description !== (m.description || null)) updates.description = m.description || null;
    if (db.subtitle !== (m.subtitle || null)) updates.subtitle = m.subtitle || null;
    if (db.year !== m.year) updates.year = m.year;
    if (db.address !== (m.address || null)) updates.address = m.address || null;
    if (db.accuracy !== (m.accuracy || 'approximate')) updates.accuracy = m.accuracy || 'approximate';
    if (db.kind !== (m.kind || 'event')) updates.kind = m.kind || 'event';
    if (db.importance !== (m.importance || 'minor')) updates.importance = m.importance || 'minor';
    if (db.type_id !== typeId) updates.type_id = typeId;

    if (Object.keys(updates).length > 0) {
      mismatches.push(`${m.id}: ${Object.keys(updates).join(', ')}`);
      if (!DRY_RUN) {
        const { error: err } = await supabase.from('moments').update(updates).eq('id', m.id);
        if (err) { console.error(`  UPDATE FAIL ${m.id}: ${err.message}`); totalErrors++; }
        else updated++;
      } else {
        updated++;
      }
    }
  }

  if (mismatches.length > 0) {
    console.log(`  Mismatches (${mismatches.length}):`);
    mismatches.slice(0, 50).forEach(m => console.log(`    ${m}`));
    if (mismatches.length > 50) console.log(`    ... and ${mismatches.length - 50} more`);
  }
  console.log(`  Result: ${inserted} inserted, ${updated} updated, ${dbMoments!.length} in DB, ${moments.length} in static`);
  totalUpdated += updated; totalInserted += inserted;
}

async function syncEntities() {
  console.log('\n=== ENTITIES ===');
  const { data: dbEntities, error } = await supabase.from('entities').select('*');
  if (error) { console.error('Failed:', error.message); return; }

  const dbMap = new Map(dbEntities!.map(e => [e.id, e]));
  let updated = 0, inserted = 0, mismatches: string[] = [];

  for (const e of entities) {
    const db = dbMap.get(e.id);
    if (!db) {
      if (DRY_RUN) { console.log(`  [dry-run] Would INSERT entity: ${e.id}`); inserted++; continue; }
      const { error: err } = await supabase.from('entities').insert({
        id: e.id, name: e.name, type: e.type,
        description: e.description || null, years: e.years || null,
        wikipedia_slug: e.wikipediaSlug || null,
      });
      if (err) { console.error(`  INSERT FAIL ${e.id}: ${err.message}`); totalErrors++; }
      else inserted++;
      continue;
    }

    const updates: Record<string, any> = {};
    if (db.name !== e.name) updates.name = e.name;
    if (db.description !== (e.description || null)) updates.description = e.description || null;
    if (db.years !== (e.years || null)) updates.years = e.years || null;
    if (db.wikipedia_slug !== (e.wikipediaSlug || null)) updates.wikipedia_slug = e.wikipediaSlug || null;

    if (Object.keys(updates).length > 0) {
      mismatches.push(`${e.id}: ${Object.keys(updates).join(', ')}`);
      if (!DRY_RUN) {
        const { error: err } = await supabase.from('entities').update(updates).eq('id', e.id);
        if (err) { console.error(`  UPDATE FAIL ${e.id}: ${err.message}`); totalErrors++; }
        else updated++;
      } else {
        updated++;
      }
    }
  }

  if (mismatches.length > 0) {
    console.log(`  Mismatches (${mismatches.length}):`);
    mismatches.forEach(m => console.log(`    ${m}`));
  }
  console.log(`  Result: ${inserted} inserted, ${updated} updated`);
  totalUpdated += updated; totalInserted += inserted;
}

async function syncStories() {
  console.log('\n=== STORIES ===');
  const { data: dbStories, error } = await supabase.from('stories').select('*');
  if (error) { console.error('Failed:', error.message); return; }

  const dbMap = new Map(dbStories!.map(s => [s.id, s]));
  const staticIds = new Set(stories.map(s => s.id));
  let updated = 0, inserted = 0, deleted = 0, mismatches: string[] = [];

  for (const db of dbStories!) {
    if (!staticIds.has(db.id)) {
      if (DRY_RUN) { console.log(`  [dry-run] Would DELETE story: ${db.id}`); deleted++; continue; }
      await supabase.from('entities').update({ canonical_story_id: null }).eq('canonical_story_id', db.id);
      await supabase.from('story_moments').delete().eq('story_id', db.id);
      await supabase.from('related_stories').delete().eq('story_id', db.id);
      await supabase.from('related_stories').delete().eq('related_story_id', db.id);
      const { error: err } = await supabase.from('stories').delete().eq('id', db.id);
      if (err) { console.error(`  DELETE FAIL ${db.id}: ${err.message}`); totalErrors++; }
      else { console.log(`  DELETED: ${db.id}`); deleted++; }
    }
  }

  for (const s of stories) {
    const db = dbMap.get(s.id);
    if (!db) {
      if (DRY_RUN) { console.log(`  [dry-run] Would INSERT story: ${s.id}`); inserted++; continue; }
      const { error: err } = await supabase.from('stories').insert({
        id: s.id, name: s.name, description: s.description || null,
        category: s.category, story_type: s.storyType,
        years: s.years || null, wikipedia_slug: s.wikipediaSlug || null,
        nickname: s.nickname || null, content_warning: s.contentWarning || null,
      });
      if (err) { console.error(`  INSERT FAIL ${s.id}: ${err.message}`); totalErrors++; }
      else inserted++;
      continue;
    }

    const updates: Record<string, any> = {};
    if (db.name !== s.name) updates.name = s.name;
    if (db.description !== (s.description || null)) updates.description = s.description || null;
    if (db.category !== s.category) updates.category = s.category;
    if (db.story_type !== s.storyType) updates.story_type = s.storyType;

    if (Object.keys(updates).length > 0) {
      mismatches.push(`${s.id}: ${Object.keys(updates).join(', ')}`);
      if (!DRY_RUN) {
        const { error: err } = await supabase.from('stories').update(updates).eq('id', s.id);
        if (err) { console.error(`  UPDATE FAIL ${s.id}: ${err.message}`); totalErrors++; }
        else updated++;
      } else {
        updated++;
      }
    }
  }

  if (!DRY_RUN) {
    console.log('  Re-syncing story_moments...');
    for (const s of stories) {
      await supabase.from('story_moments').delete().eq('story_id', s.id);
      const rows = s.moments.map((sm, i) => ({ story_id: s.id, moment_id: sm.momentId, sort_order: i }));
      if (rows.length > 0) {
        const { error: smErr } = await supabase.from('story_moments').insert(rows);
        if (smErr) console.error(`  story_moments FAIL ${s.id}: ${smErr.message}`);
      }
    }
  } else {
    console.log('  [dry-run] Would re-sync all story_moments');
  }

  if (mismatches.length > 0) {
    console.log(`  Mismatches (${mismatches.length}):`);
    mismatches.forEach(m => console.log(`    ${m}`));
  }
  console.log(`  Result: ${inserted} inserted, ${updated} updated, ${deleted} deleted`);
  totalUpdated += updated; totalInserted += inserted; totalDeleted += deleted;
}

async function syncCollections() {
  console.log('\n=== COLLECTIONS ===');
  const { data: dbColls, error } = await supabase.from('collections').select('*');
  if (error) { console.error('Failed:', error.message); return; }

  const dbMap = new Map(dbColls!.map(c => [c.id, c]));
  const staticIds = new Set(collections.map(c => c.id));
  let updated = 0, inserted = 0, deleted = 0;

  for (const db of dbColls!) {
    if (!staticIds.has(db.id)) {
      if (DRY_RUN) { console.log(`  [dry-run] Would DELETE collection: ${db.id}`); deleted++; continue; }
      await supabase.from('collection_moments').delete().eq('collection_id', db.id);
      const { error: err } = await supabase.from('collections').delete().eq('id', db.id);
      if (!err) { console.log(`  DELETED: ${db.id}`); deleted++; }
    }
  }

  for (const c of collections) {
    const db = dbMap.get(c.id);
    if (!db) {
      if (DRY_RUN) { console.log(`  [dry-run] Would INSERT collection: ${c.id}`); inserted++; continue; }
      await supabase.from('collections').insert({
        id: c.id, name: c.name, subtitle: c.subtitle || null, description: c.description || null,
      });
      inserted++;
    } else {
      const updates: Record<string, any> = {};
      if (db.name !== c.name) updates.name = c.name;
      if (db.description !== (c.description || null)) updates.description = c.description || null;
      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) await supabase.from('collections').update(updates).eq('id', c.id);
        updated++;
      }
    }

    if (!DRY_RUN) {
      await supabase.from('collection_moments').delete().eq('collection_id', c.id);
      const { data: valid } = await supabase.from('moments').select('id').in('id', c.momentIds);
      const validIds = new Set(valid?.map(m => m.id) ?? []);
      const rows = c.momentIds.filter(mid => validIds.has(mid)).map((mid, i) => ({
        collection_id: c.id, moment_id: mid, sort_order: i,
      }));
      if (rows.length > 0) await supabase.from('collection_moments').insert(rows);
    }
  }

  console.log(`  Result: ${inserted} inserted, ${updated} updated, ${deleted} deleted`);
  totalUpdated += updated; totalInserted += inserted; totalDeleted += deleted;
}

async function syncMomentEntities() {
  console.log('\n=== MOMENT_ENTITIES ===');
  const { data: dbM } = await supabase.from('moments').select('id');
  const { data: dbE } = await supabase.from('entities').select('id');
  const dbMids = new Set(dbM?.map(m => m.id) ?? []);
  const dbEids = new Set(dbE?.map(e => e.id) ?? []);

  const rows: { moment_id: string; entity_id: string }[] = [];
  for (const m of moments) {
    if (!m.entityIds || !dbMids.has(m.id)) continue;
    for (const eid of m.entityIds) {
      if (dbEids.has(eid)) rows.push({ moment_id: m.id, entity_id: eid });
    }
  }

  if (DRY_RUN) {
    console.log(`  [dry-run] Would delete all moment_entities and re-insert ${rows.length} links`);
    return;
  }

  await supabase.from('moment_entities').delete().neq('moment_id', '___x___');

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('moment_entities').insert(rows.slice(i, i + 500));
    if (error) console.error(`  BATCH FAIL at ${i}: ${error.message}`);
    else inserted += rows.slice(i, i + 500).length;
  }
  console.log(`  Result: ${inserted} links inserted`);
}

async function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN — no changes will be written to Supabase\n');
  console.log('Seed: static files → Supabase');
  console.log(`Static: ${moments.length} moments, ${entities.length} entities, ${stories.length} stories, ${collections.length} collections\n`);

  await loadTypes();
  await syncMoments();
  await syncEntities();
  await syncStories();
  await syncCollections();
  await syncMomentEntities();

  console.log('\n=== SUMMARY ===');
  if (DRY_RUN) console.log('(DRY RUN — nothing was written)');
  console.log(`Updated: ${totalUpdated}, Inserted: ${totalInserted}, Deleted: ${totalDeleted}, Errors: ${totalErrors}`);
}

main().catch(console.error);
