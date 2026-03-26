/**
 * Full sync: static TypeScript files → Supabase
 * Schema: location = PostGIS POINT(lng lat), type_id = string FK to moment_types(id)
 */
import { createClient } from '@supabase/supabase-js';
import { moments } from '../src/data/moments';
import { entities } from '../src/data/entities';
import { stories } from '../src/data/stories';
import { collections } from '../src/data/collections';

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** Strip trailing backslashes from string fields (pipeline artifact). */
const cleanStr = (s: string | null | undefined): string => (s ?? '').replace(/\\+$/, '') || '';

let totalUpdated = 0, totalInserted = 0, totalDeleted = 0, totalErrors = 0;

const PAGE_SIZE = 1000;

/**
 * Fetch ALL rows from a Supabase table, paginating past the 1000-row default limit.
 * `selectCols` is the column spec passed to .select().
 */
async function fetchAll<T = any>(table: string, selectCols: string = '*'): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(selectCols)
      .range(from, from + PAGE_SIZE - 1);
    if (error) { console.error(`fetchAll ${table} failed at offset ${from}: ${error.message}`); break; }
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }
  return all;
}

// Known moment_types in Supabase
let validTypes: Set<string> = new Set();

async function loadTypes() {
  const data = await fetchAll<{ id: string }>('moment_types', 'id');
  data.forEach(t => validTypes.add(t.id));
  console.log(`Loaded ${validTypes.size} moment types`);
}

async function ensureType(typeName: string): Promise<string> {
  if (validTypes.has(typeName)) return typeName;
  // Try to insert
  const label = typeName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const { error } = await supabase.from('moment_types').insert({ id: typeName, label });
  if (!error) { validTypes.add(typeName); return typeName; }
  // Fallback
  return 'historical_site';
}

async function syncMoments() {
  console.log('\n=== MOMENTS ===');
  const dbMoments = await fetchAll('moments', 'id, name, description, subtitle, year, address, accuracy, kind, importance, type_id');

  const dbMap = new Map(dbMoments.map(m => [m.id, m]));
  let updated = 0, inserted = 0, mismatches: string[] = [];

  for (const m of moments) {
    const typeId = await ensureType(m.type || 'historical_site');
    const db = dbMap.get(m.id);

    if (!db) {
      const { error: err } = await supabase.from('moments').insert({
        id: m.id, name: cleanStr(m.name), subtitle: cleanStr(m.subtitle) || null,
        description: cleanStr(m.description) || null,
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

    // Compare text fields only (skip location — too complex to compare via select)
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
      const { error: err } = await supabase.from('moments').update(updates).eq('id', m.id);
      if (err) { console.error(`  UPDATE FAIL ${m.id}: ${err.message}`); totalErrors++; }
      else updated++;
    }
  }

  if (mismatches.length > 0) {
    console.log(`  Mismatches (${mismatches.length}):`);
    mismatches.slice(0, 50).forEach(m => console.log(`    ${m}`));
    if (mismatches.length > 50) console.log(`    ... and ${mismatches.length - 50} more`);
  }
  console.log(`  Result: ${inserted} inserted, ${updated} updated, ${dbMoments.length} in DB, ${moments.length} in static`);
  totalUpdated += updated; totalInserted += inserted;
}

async function syncEntities() {
  console.log('\n=== ENTITIES ===');
  const dbEntities = await fetchAll('entities');

  const dbMap = new Map(dbEntities.map(e => [e.id, e]));
  let updated = 0, inserted = 0, mismatches: string[] = [];

  for (const e of entities) {
    const db = dbMap.get(e.id);
    if (!db) {
      const { error: err } = await supabase.from('entities').insert({
        id: e.id, name: cleanStr(e.name), type: e.type,
        description: cleanStr(e.description) || null, years: e.years || null,
        wikipedia_slug: e.wikipediaSlug || null,
        canonical_story_id: e.canonicalStoryId || null,
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
    if (db.canonical_story_id !== (e.canonicalStoryId || null)) updates.canonical_story_id = e.canonicalStoryId || null;

    if (Object.keys(updates).length > 0) {
      mismatches.push(`${e.id}: ${Object.keys(updates).join(', ')}`);
      const { error: err } = await supabase.from('entities').update(updates).eq('id', e.id);
      if (err) { console.error(`  UPDATE FAIL ${e.id}: ${err.message}`); totalErrors++; }
      else updated++;
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
  const dbStories = await fetchAll('stories');

  const dbMap = new Map(dbStories.map(s => [s.id, s]));
  const staticIds = new Set(stories.map(s => s.id));
  let updated = 0, inserted = 0, deleted = 0, mismatches: string[] = [];

  // Delete stories not in static — first clear canonical_story_id refs
  for (const db of dbStories) {
    if (!staticIds.has(db.id)) {
      // Clear canonical_story_id on entities that reference this story
      await supabase.from('entities').update({ canonical_story_id: null }).eq('canonical_story_id', db.id);
      await supabase.from('story_moments').delete().eq('story_id', db.id);
      // Try to delete related_stories refs too
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
      const { error: err } = await supabase.from('stories').insert({
        id: s.id, name: cleanStr(s.name), description: cleanStr(s.description) || '',
        category: s.category, story_type: s.storyType,
        years: s.years || null, wikipedia_slug: s.wikipediaSlug || null,
        nickname: cleanStr(s.nickname) || null, content_warning: s.contentWarning || null,
      });
      if (err) { console.error(`  INSERT FAIL ${s.id}: ${err.message}`); totalErrors++; }
      else inserted++;
      continue;
    }

    const updates: Record<string, any> = {};
    if (db.name !== s.name) updates.name = s.name;
    if (db.description !== (s.description || '')) updates.description = s.description || '';
    if (db.category !== s.category) updates.category = s.category;
    if (db.story_type !== s.storyType) updates.story_type = s.storyType;

    if (Object.keys(updates).length > 0) {
      mismatches.push(`${s.id}: ${Object.keys(updates).join(', ')}`);
      const { error: err } = await supabase.from('stories').update(updates).eq('id', s.id);
      if (err) { console.error(`  UPDATE FAIL ${s.id}: ${err.message}`); totalErrors++; }
      else updated++;
    }
  }

  // Re-sync ALL story_moments (after inserts/deletes are done)
  console.log('  Re-syncing story_moments...');
  for (const s of stories) {
    await supabase.from('story_moments').delete().eq('story_id', s.id);
    const rows = s.moments.map((sm, i) => ({ story_id: s.id, moment_id: sm.momentId, sort_order: i }));
    if (rows.length > 0) {
      const { error: smErr } = await supabase.from('story_moments').insert(rows);
      if (smErr) console.error(`  story_moments FAIL ${s.id}: ${smErr.message}`);
    }
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
  const dbColls = await fetchAll('collections');

  const dbMap = new Map(dbColls.map(c => [c.id, c]));
  const staticIds = new Set(collections.map(c => c.id));
  let updated = 0, inserted = 0, deleted = 0;

  for (const db of dbColls) {
    if (!staticIds.has(db.id)) {
      await supabase.from('collection_moments').delete().eq('collection_id', db.id);
      const { error: err } = await supabase.from('collections').delete().eq('id', db.id);
      if (!err) { console.log(`  DELETED: ${db.id}`); deleted++; }
    }
  }

  for (const c of collections) {
    const db = dbMap.get(c.id);
    if (!db) {
      await supabase.from('collections').insert({
        id: c.id, name: c.name, subtitle: c.subtitle || null, description: c.description || null,
      });
      inserted++;
    } else {
      const updates: Record<string, any> = {};
      if (db.name !== c.name) updates.name = c.name;
      if (db.description !== (c.description || null)) updates.description = c.description || null;
      if (Object.keys(updates).length > 0) {
        await supabase.from('collections').update(updates).eq('id', c.id);
        updated++;
      }
    }

    await supabase.from('collection_moments').delete().eq('collection_id', c.id);
    const { data: valid } = await supabase.from('moments').select('id').in('id', c.momentIds);
    const validIds = new Set(valid?.map(m => m.id) ?? []);
    const rows = c.momentIds.filter(mid => validIds.has(mid)).map((mid, i) => ({
      collection_id: c.id, moment_id: mid, sort_order: i,
    }));
    if (rows.length > 0) await supabase.from('collection_moments').insert(rows);
  }

  console.log(`  Result: ${inserted} inserted, ${updated} updated, ${deleted} deleted`);
  totalUpdated += updated; totalInserted += inserted; totalDeleted += deleted;
}

async function syncMomentEntities() {
  console.log('\n=== MOMENT_ENTITIES ===');
  const dbM = await fetchAll<{ id: string }>('moments', 'id');
  const dbE = await fetchAll<{ id: string }>('entities', 'id');
  const dbMids = new Set(dbM.map(m => m.id));
  const dbEids = new Set(dbE.map(e => e.id));
  console.log(`  DB has ${dbMids.size} moments, ${dbEids.size} entities`);

  // Build desired link set from static data
  const desiredRows: { moment_id: string; entity_id: string }[] = [];
  for (const m of moments) {
    if (!m.entityIds || !dbMids.has(m.id)) continue;
    for (const eid of m.entityIds) {
      if (dbEids.has(eid)) desiredRows.push({ moment_id: m.id, entity_id: eid });
    }
  }
  const desiredKeys = new Set(desiredRows.map(r => `${r.moment_id}|${r.entity_id}`));

  // Fetch ALL existing links
  const existingLinks = await fetchAll<{ moment_id: string; entity_id: string }>('moment_entities', 'moment_id, entity_id');
  const existingKeys = new Set(existingLinks.map(r => `${r.moment_id}|${r.entity_id}`));
  console.log(`  Existing links: ${existingLinks.length}, desired links: ${desiredRows.length}`);

  // Delete links that shouldn't exist
  const toDelete = existingLinks.filter(r => !desiredKeys.has(`${r.moment_id}|${r.entity_id}`));
  let deleted = 0;
  for (const r of toDelete) {
    const { error } = await supabase.from('moment_entities').delete()
      .eq('moment_id', r.moment_id).eq('entity_id', r.entity_id);
    if (error) console.error(`  DELETE FAIL ${r.moment_id}|${r.entity_id}: ${error.message}`);
    else deleted++;
  }

  // Insert links that are missing
  const toInsert = desiredRows.filter(r => !existingKeys.has(`${r.moment_id}|${r.entity_id}`));
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    const batch = toInsert.slice(i, i + 500);
    const { error } = await supabase.from('moment_entities').insert(batch);
    if (error) console.error(`  BATCH INSERT FAIL at ${i}: ${error.message}`);
    else inserted += batch.length;
  }
  console.log(`  Result: ${inserted} links inserted, ${deleted} links deleted, ${existingLinks.length - deleted + inserted} total`);
}

async function main() {
  console.log('Full sync: static → Supabase');
  console.log(`Static: ${moments.length} moments, ${entities.length} entities, ${stories.length} stories, ${collections.length} collections\n`);

  await loadTypes();
  await syncMoments();
  await syncEntities();
  await syncStories();
  await syncCollections();
  await syncMomentEntities();

  console.log('\n=== SUMMARY ===');
  console.log(`Updated: ${totalUpdated}, Inserted: ${totalInserted}, Deleted: ${totalDeleted}, Errors: ${totalErrors}`);
}

main().catch(console.error);
