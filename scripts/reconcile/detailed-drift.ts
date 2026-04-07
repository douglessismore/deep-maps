/**
 * Detailed drift report: field-level comparison of static files vs Supabase.
 * READ-ONLY — does not modify anything.
 *
 * Usage:
 *   export SUPABASE_SERVICE_ROLE_KEY=... && npx tsx scripts/reconcile/detailed-drift.ts
 */
import { createClient } from '@supabase/supabase-js';
import { moments } from '../../src/data/moments';
import { entities } from '../../src/data/entities';
import { stories } from '../../src/data/stories';
import { collections } from '../../src/data/collections';

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PAGE_SIZE = 1000;

async function fetchAll<T = any>(table: string, selectCols: string = '*'): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(selectCols)
      .range(from, from + PAGE_SIZE - 1);
    if (error) { console.error(`fetchAll ${table} failed: ${error.message}`); break; }
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

// ─── MOMENTS ────────────────────────────────────────────────────────

async function diffMoments() {
  console.log('\n' + '═'.repeat(60));
  console.log('  MOMENTS');
  console.log('═'.repeat(60));

  const dbRows = await fetchAll('moments', 'id, name, subtitle, year, type_id, importance, accuracy, kind');
  const dbIds = new Set(dbRows.map(r => r.id));
  const staticIds = new Set(moments.map(m => m.id));

  const onlyInSupabase = dbRows.filter(r => !staticIds.has(r.id));
  const onlyInStatic = moments.filter(m => !dbIds.has(m.id));

  console.log(`\n  Static: ${moments.length}  |  Supabase: ${dbRows.length}`);
  console.log(`  Only in Supabase: ${onlyInSupabase.length}`);
  console.log(`  Only in static: ${onlyInStatic.length}`);

  if (onlyInSupabase.length > 0) {
    console.log('\n  --- Supabase-only moments (first 20) ---');
    onlyInSupabase.slice(0, 20).forEach(r =>
      console.log(`    ${r.id}: ${r.name} (${r.year || 'no year'})`)
    );
    if (onlyInSupabase.length > 20) console.log(`    ... and ${onlyInSupabase.length - 20} more`);
  }

  if (onlyInStatic.length > 0) {
    console.log('\n  --- Static-only moments (first 20) ---');
    onlyInStatic.slice(0, 20).forEach(m =>
      console.log(`    ${m.id}: ${m.name} (${m.year || 'no year'})`)
    );
    if (onlyInStatic.length > 20) console.log(`    ... and ${onlyInStatic.length - 20} more`);
  }

  // Field-level diffs for shared moments (sample first 10 mismatches)
  const dbMap = new Map(dbRows.map(r => [r.id, r]));
  let fieldDiffs = 0;
  const fieldDiffExamples: string[] = [];
  for (const m of moments) {
    const db = dbMap.get(m.id);
    if (!db) continue;
    const diffs: string[] = [];
    if (db.name !== m.name) diffs.push(`name: "${db.name}" vs "${m.name}"`);
    if (db.year !== (m.year ?? null)) diffs.push(`year: ${db.year} vs ${m.year}`);
    if (db.type_id !== (m.type || 'historical_site')) diffs.push(`type: ${db.type_id} vs ${m.type}`);
    if (db.importance !== (m.importance || 'minor')) diffs.push(`importance: ${db.importance} vs ${m.importance}`);
    if (db.accuracy !== (m.accuracy || 'approximate')) diffs.push(`accuracy: ${db.accuracy} vs ${m.accuracy}`);
    if (diffs.length > 0) {
      fieldDiffs++;
      if (fieldDiffExamples.length < 10) {
        fieldDiffExamples.push(`    ${m.id}: ${diffs.join('; ')}`);
      }
    }
  }
  console.log(`\n  Shared moments with field differences: ${fieldDiffs}`);
  if (fieldDiffExamples.length > 0) {
    console.log('  --- Examples ---');
    fieldDiffExamples.forEach(e => console.log(e));
  }

  return { onlyInSupabase: onlyInSupabase.length, onlyInStatic: onlyInStatic.length, fieldDiffs };
}

// ─── ENTITIES ───────────────────────────────────────────────────────

async function diffEntities() {
  console.log('\n' + '═'.repeat(60));
  console.log('  ENTITIES');
  console.log('═'.repeat(60));

  const dbRows = await fetchAll('entities', 'id, name, type, years, canonical_story_id, wikipedia_slug');
  const dbIds = new Set(dbRows.map(r => r.id));
  const staticIds = new Set(entities.map(e => e.id));

  const onlyInSupabase = dbRows.filter(r => !staticIds.has(r.id));
  const onlyInStatic = entities.filter(e => !dbIds.has(e.id));

  console.log(`\n  Static: ${entities.length}  |  Supabase: ${dbRows.length}`);
  console.log(`  Only in Supabase: ${onlyInSupabase.length}`);
  console.log(`  Only in static: ${onlyInStatic.length}`);

  if (onlyInSupabase.length > 0) {
    console.log('\n  --- Supabase-only entities (first 20) ---');
    onlyInSupabase.slice(0, 20).forEach(r =>
      console.log(`    ${r.id}: ${r.name} (${r.type})`)
    );
    if (onlyInSupabase.length > 20) console.log(`    ... and ${onlyInSupabase.length - 20} more`);
  }

  if (onlyInStatic.length > 0) {
    console.log('\n  --- Static-only entities ---');
    onlyInStatic.forEach(e =>
      console.log(`    ${e.id}: ${e.name} (${e.type})`)
    );
  }

  return { onlyInSupabase: onlyInSupabase.length, onlyInStatic: onlyInStatic.length };
}

// ─── STORIES ────────────────────────────────────────────────────────

async function diffStories() {
  console.log('\n' + '═'.repeat(60));
  console.log('  STORIES');
  console.log('═'.repeat(60));

  const dbRows = await fetchAll('stories', 'id, name, category, story_type');
  const dbIds = new Set(dbRows.map(r => r.id));
  const staticIds = new Set(stories.map(s => s.id));

  const onlyInSupabase = dbRows.filter(r => !staticIds.has(r.id));
  const onlyInStatic = stories.filter(s => !dbIds.has(s.id));

  console.log(`\n  Static: ${stories.length}  |  Supabase: ${dbRows.length}`);
  console.log(`  Only in Supabase: ${onlyInSupabase.length}`);
  console.log(`  Only in static: ${onlyInStatic.length}`);

  if (onlyInSupabase.length > 0) {
    console.log('\n  --- Supabase-only stories (first 20) ---');
    onlyInSupabase.slice(0, 20).forEach(r =>
      console.log(`    ${r.id}: ${r.name} (${r.category})`)
    );
    if (onlyInSupabase.length > 20) console.log(`    ... and ${onlyInSupabase.length - 20} more`);
  }

  if (onlyInStatic.length > 0) {
    console.log('\n  --- Static-only stories ---');
    onlyInStatic.forEach(s =>
      console.log(`    ${s.id}: ${s.name} (${s.category})`)
    );
  }

  return { onlyInSupabase: onlyInSupabase.length, onlyInStatic: onlyInStatic.length };
}

// ─── ENTITY LINKS ───────────────────────────────────────────────────

async function diffEntityLinks() {
  console.log('\n' + '═'.repeat(60));
  console.log('  MOMENT_ENTITIES (entity links)');
  console.log('═'.repeat(60));

  const dbLinks = await fetchAll<{ moment_id: string; entity_id: string }>('moment_entities', 'moment_id, entity_id');
  const dbKeys = new Set(dbLinks.map(r => `${r.moment_id}|${r.entity_id}`));

  // Build static links
  const staticLinks: { moment_id: string; entity_id: string }[] = [];
  for (const m of moments) {
    if (m.entityIds) {
      for (const eid of m.entityIds) {
        staticLinks.push({ moment_id: m.id, entity_id: eid });
      }
    }
  }
  const staticKeys = new Set(staticLinks.map(r => `${r.moment_id}|${r.entity_id}`));

  const onlyInSupabase = dbLinks.filter(r => !staticKeys.has(`${r.moment_id}|${r.entity_id}`));
  const onlyInStatic = staticLinks.filter(r => !dbKeys.has(`${r.moment_id}|${r.entity_id}`));

  console.log(`\n  Static links: ${staticLinks.length}  |  Supabase links: ${dbLinks.length}`);
  console.log(`  Only in Supabase: ${onlyInSupabase.length}`);
  console.log(`  Only in static: ${onlyInStatic.length}`);

  if (onlyInStatic.length > 0) {
    console.log('\n  --- Static-only entity links (first 20) ---');
    onlyInStatic.slice(0, 20).forEach(r =>
      console.log(`    ${r.moment_id} -> ${r.entity_id}`)
    );
    if (onlyInStatic.length > 20) console.log(`    ... and ${onlyInStatic.length - 20} more`);
  }

  return { onlyInSupabase: onlyInSupabase.length, onlyInStatic: onlyInStatic.length, totalDb: dbLinks.length, totalStatic: staticLinks.length };
}

// ─── STORY_MOMENTS ──────────────────────────────────────────────────

async function diffStoryMoments() {
  console.log('\n' + '═'.repeat(60));
  console.log('  STORY_MOMENTS');
  console.log('═'.repeat(60));

  const dbLinks = await fetchAll<{ story_id: string; moment_id: string }>('story_moments', 'story_id, moment_id');
  const dbKeys = new Set(dbLinks.map(r => `${r.story_id}|${r.moment_id}`));

  const staticLinks: { story_id: string; moment_id: string }[] = [];
  for (const s of stories) {
    for (const sm of s.moments) {
      staticLinks.push({ story_id: s.id, moment_id: sm.momentId });
    }
  }
  const staticKeys = new Set(staticLinks.map(r => `${r.story_id}|${r.moment_id}`));

  const onlyInSupabase = dbLinks.filter(r => !staticKeys.has(`${r.story_id}|${r.moment_id}`));
  const onlyInStatic = staticLinks.filter(r => !dbKeys.has(`${r.story_id}|${r.moment_id}`));

  console.log(`\n  Static links: ${staticLinks.length}  |  Supabase links: ${dbLinks.length}`);
  console.log(`  Only in Supabase: ${onlyInSupabase.length}`);
  console.log(`  Only in static: ${onlyInStatic.length}`);

  return { onlyInSupabase: onlyInSupabase.length, onlyInStatic: onlyInStatic.length };
}

// ─── COLLECTIONS ────────────────────────────────────────────────────

async function diffCollections() {
  console.log('\n' + '═'.repeat(60));
  console.log('  COLLECTIONS');
  console.log('═'.repeat(60));

  const dbRows = await fetchAll('collections', 'id, name');
  const dbIds = new Set(dbRows.map(r => r.id));
  const staticIds = new Set(collections.map(c => c.id));

  const onlyInSupabase = dbRows.filter(r => !staticIds.has(r.id));
  const onlyInStatic = collections.filter(c => !dbIds.has(c.id));

  console.log(`\n  Static: ${collections.length}  |  Supabase: ${dbRows.length}`);
  console.log(`  Only in Supabase: ${onlyInSupabase.length}`);
  console.log(`  Only in static: ${onlyInStatic.length}`);

  if (onlyInSupabase.length > 0) {
    console.log('\n  --- Supabase-only collections ---');
    onlyInSupabase.forEach(r => console.log(`    ${r.id}: ${r.name}`));
  }

  return { onlyInSupabase: onlyInSupabase.length, onlyInStatic: onlyInStatic.length };
}

// ─── MAIN ───────────────────────────────────────────────────────────

async function main() {
  console.log('Detailed Drift Report: Static vs Supabase');
  console.log('Generated: ' + new Date().toISOString());

  const mDiff = await diffMoments();
  const eDiff = await diffEntities();
  const sDiff = await diffStories();
  const elDiff = await diffEntityLinks();
  const smDiff = await diffStoryMoments();
  const cDiff = await diffCollections();

  console.log('\n' + '═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Moments:        +${mDiff.onlyInSupabase} Supabase-only, +${mDiff.onlyInStatic} static-only, ${mDiff.fieldDiffs} field diffs`);
  console.log(`  Entities:       +${eDiff.onlyInSupabase} Supabase-only, +${eDiff.onlyInStatic} static-only`);
  console.log(`  Stories:        +${sDiff.onlyInSupabase} Supabase-only, +${sDiff.onlyInStatic} static-only`);
  console.log(`  Entity links:   +${elDiff.onlyInSupabase} Supabase-only, +${elDiff.onlyInStatic} static-only (${elDiff.totalDb} DB / ${elDiff.totalStatic} static)`);
  console.log(`  Story moments:  +${smDiff.onlyInSupabase} Supabase-only, +${smDiff.onlyInStatic} static-only`);
  console.log(`  Collections:    +${cDiff.onlyInSupabase} Supabase-only, +${cDiff.onlyInStatic} static-only`);

  const totalPushUp = mDiff.onlyInStatic + eDiff.onlyInStatic + sDiff.onlyInStatic + elDiff.onlyInStatic + smDiff.onlyInStatic + cDiff.onlyInStatic;
  const totalPullDown = mDiff.onlyInSupabase + eDiff.onlyInSupabase + sDiff.onlyInSupabase + elDiff.onlyInSupabase + smDiff.onlyInSupabase + cDiff.onlyInSupabase;

  console.log(`\n  Total items to push UP to Supabase: ${totalPushUp}`);
  console.log(`  Total items already in Supabase (will come down in dump): ${totalPullDown}`);
}

main().catch(console.error);
