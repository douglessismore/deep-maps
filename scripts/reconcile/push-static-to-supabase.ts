/**
 * Push static-only content UP to Supabase using safe UPSERT pattern.
 * NEVER deletes anything. Preserves all Supabase-only columns.
 *
 * For items that exist in BOTH: Supabase wins (no overwrite).
 * For items only in static: INSERT them into Supabase.
 *
 * Usage:
 *   export SUPABASE_SERVICE_ROLE_KEY=... && npx tsx scripts/reconcile/push-static-to-supabase.ts
 *   export SUPABASE_SERVICE_ROLE_KEY=... && npx tsx scripts/reconcile/push-static-to-supabase.ts --dry-run
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
const DRY_RUN = process.argv.includes('--dry-run');

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

const cleanStr = (s: string | null | undefined): string => (s ?? '').replace(/\\+$/, '') || '';

const stats = {
  entitiesInserted: 0,
  momentsInserted: 0,
  storiesInserted: 0,
  storyMomentsInserted: 0,
  momentEntitiesInserted: 0,
  relatedStoriesInserted: 0,
  collectionsInserted: 0,
  collectionMomentsInserted: 0,
  momentTypesInserted: 0,
  errors: 0,
};

// ─── Moment types ───────────────────────────────────────────────────

let validTypes: Set<string> = new Set();

async function loadTypes() {
  const data = await fetchAll<{ id: string }>('moment_types', 'id');
  data.forEach(t => validTypes.add(t.id));
}

async function ensureType(typeName: string): Promise<string> {
  if (validTypes.has(typeName)) return typeName;
  const label = typeName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  if (!DRY_RUN) {
    const { error } = await supabase.from('moment_types').insert({ id: typeName, label });
    if (!error) {
      validTypes.add(typeName);
      stats.momentTypesInserted++;
      console.log(`    + moment_type: ${typeName}`);
      return typeName;
    }
  }
  validTypes.add(typeName);
  return typeName;
}

// ─── Parse years helper ─────────────────────────────────────────────

function parseYears(years: string): { startYear: number | null; endYear: number | null } {
  const matches = years.match(/(-?\d[\d,]*)/g);
  if (!matches) return { startYear: null, endYear: null };
  const nums = matches.map(m => parseInt(m.replace(/,/g, ''), 10));
  return { startYear: nums[0] ?? null, endYear: nums.length > 1 ? nums[1] : null };
}

// ─── ENTITIES (insert only new) ─────────────────────────────────────

async function pushEntities() {
  console.log('\n--- ENTITIES ---');
  const dbRows = await fetchAll<{ id: string }>('entities', 'id');
  const dbIds = new Set(dbRows.map(r => r.id));

  const toInsert = entities.filter(e => !dbIds.has(e.id));
  console.log(`  ${toInsert.length} static-only entities to insert`);

  for (const e of toInsert) {
    console.log(`    + ${e.id}: ${e.name} (${e.type})`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('entities').insert({
        id: e.id,
        name: cleanStr(e.name),
        type: e.type,
        years: e.years ?? null,
        description: cleanStr(e.description) || null,
        canonical_story_id: null, // set after stories exist
        wikipedia_slug: e.wikipediaSlug ?? null,
      });
      if (error) {
        console.error(`      ERROR: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.entitiesInserted++;
  }
}

// ─── MOMENTS (insert only new) ──────────────────────────────────────

async function pushMoments() {
  console.log('\n--- MOMENTS ---');
  const dbRows = await fetchAll<{ id: string }>('moments', 'id');
  const dbIds = new Set(dbRows.map(r => r.id));

  const toInsert = moments.filter(m => !dbIds.has(m.id));
  console.log(`  ${toInsert.length} static-only moments to insert`);

  for (const m of toInsert) {
    const typeId = await ensureType(m.type || 'historical_site');
    console.log(`    + ${m.id}: ${m.name.slice(0, 70)}`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('moments').insert({
        id: m.id,
        name: cleanStr(m.name),
        subtitle: cleanStr(m.subtitle) || null,
        description: cleanStr(m.description) || null,
        location: `SRID=4326;POINT(${m.lng} ${m.lat})`,
        type_id: typeId,
        importance: m.importance || 'minor',
        notability: m.notability ?? 30,
        accuracy: m.accuracy || 'approximate',
        kind: m.kind || 'event',
        year: m.year ?? null,
        date: (m as any).date ?? null,
        address: m.address ?? null,
        verification_level: m.verificationLevel ?? 'documented',
        wiki_section: (m as any).wikiSection ?? null,
        source: 'static-reconcile',
        source_id: null,
      });
      if (error) {
        console.error(`      ERROR: ${error.message}`);
        stats.errors++;
      }
    }
    stats.momentsInserted++;
  }
}

// ─── STORIES (insert only new) ──────────────────────────────────────

async function pushStories() {
  console.log('\n--- STORIES ---');
  const dbRows = await fetchAll<{ id: string }>('stories', 'id');
  const dbIds = new Set(dbRows.map(r => r.id));

  const toInsert = stories.filter(s => !dbIds.has(s.id));
  console.log(`  ${toInsert.length} static-only stories to insert`);

  for (const s of toInsert) {
    const { startYear, endYear } = parseYears(s.years);
    console.log(`    + ${s.id}: ${s.name} (${s.category})`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('stories').insert({
        id: s.id,
        name: cleanStr(s.name),
        nickname: cleanStr(s.nickname) || null,
        years: s.years,
        start_year: startYear,
        end_year: endYear,
        category: s.category,
        story_type: s.storyType,
        description: cleanStr(s.description) || '',
        tags: s.tags,
        content_warning: s.contentWarning ?? null,
        wikipedia_slug: s.wikipediaSlug ?? null,
      });
      if (error) {
        console.error(`      ERROR: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.storiesInserted++;
  }
}

// ─── STORY_MOMENTS (insert missing links) ───────────────────────────

async function pushStoryMoments() {
  console.log('\n--- STORY_MOMENTS ---');
  const dbLinks = await fetchAll<{ story_id: string; moment_id: string }>('story_moments', 'story_id, moment_id');
  const dbKeys = new Set(dbLinks.map(r => `${r.story_id}|${r.moment_id}`));

  // Also need to know which moments and stories exist in DB now
  const dbMomentIds = new Set((await fetchAll<{ id: string }>('moments', 'id')).map(r => r.id));
  const dbStoryIds = new Set((await fetchAll<{ id: string }>('stories', 'id')).map(r => r.id));

  let toInsert: { story_id: string; moment_id: string; sort_order: number; narrative_glue: string | null; is_primary: boolean }[] = [];

  for (const s of stories) {
    if (!dbStoryIds.has(s.id)) continue;
    for (let i = 0; i < s.moments.length; i++) {
      const sm = s.moments[i];
      const key = `${s.id}|${sm.momentId}`;
      if (!dbKeys.has(key) && dbMomentIds.has(sm.momentId)) {
        toInsert.push({
          story_id: s.id,
          moment_id: sm.momentId,
          sort_order: i,
          narrative_glue: sm.narrativeGlue ?? null,
          is_primary: sm.isPrimary ?? false,
        });
      }
    }
  }

  console.log(`  ${toInsert.length} static-only story_moment links to insert`);

  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    if (!DRY_RUN) {
      const { error } = await supabase.from('story_moments').insert(batch);
      if (error) {
        console.error(`    BATCH ${i} ERROR: ${error.message}`);
        stats.errors++;
        // Try one-by-one
        for (const row of batch) {
          const { error: singleErr } = await supabase.from('story_moments').insert(row);
          if (singleErr) {
            console.error(`      ${row.story_id}|${row.moment_id}: ${singleErr.message}`);
          } else {
            stats.storyMomentsInserted++;
          }
        }
        continue;
      }
    }
    stats.storyMomentsInserted += batch.length;
  }
}

// ─── MOMENT_ENTITIES (insert missing links) ─────────────────────────

async function pushMomentEntities() {
  console.log('\n--- MOMENT_ENTITIES ---');
  const dbLinks = await fetchAll<{ moment_id: string; entity_id: string }>('moment_entities', 'moment_id, entity_id');
  const dbKeys = new Set(dbLinks.map(r => `${r.moment_id}|${r.entity_id}`));

  const dbMomentIds = new Set((await fetchAll<{ id: string }>('moments', 'id')).map(r => r.id));
  const dbEntityIds = new Set((await fetchAll<{ id: string }>('entities', 'id')).map(r => r.id));

  const toInsert: { moment_id: string; entity_id: string }[] = [];
  let skippedMissing = 0;

  for (const m of moments) {
    if (!m.entityIds || !dbMomentIds.has(m.id)) continue;
    for (const eid of m.entityIds) {
      const key = `${m.id}|${eid}`;
      if (!dbKeys.has(key)) {
        if (!dbEntityIds.has(eid)) {
          skippedMissing++;
          continue;
        }
        toInsert.push({ moment_id: m.id, entity_id: eid });
      }
    }
  }

  console.log(`  ${toInsert.length} static-only entity links to insert (${skippedMissing} skipped — entity not in DB)`);

  for (let i = 0; i < toInsert.length; i += 500) {
    const batch = toInsert.slice(i, i + 500);
    if (!DRY_RUN) {
      const { error } = await supabase.from('moment_entities').insert(batch);
      if (error) {
        console.error(`    BATCH ${i} ERROR: ${error.message}`);
        stats.errors++;
        // Try one-by-one
        for (const row of batch) {
          const { error: singleErr } = await supabase.from('moment_entities').insert(row);
          if (singleErr) {
            console.error(`      ${row.moment_id}|${row.entity_id}: ${singleErr.message}`);
          } else {
            stats.momentEntitiesInserted++;
          }
        }
        continue;
      }
    }
    stats.momentEntitiesInserted += batch.length;
  }
}

// ─── RELATED_STORIES (insert missing) ───────────────────────────────

async function pushRelatedStories() {
  console.log('\n--- RELATED_STORIES ---');
  const dbLinks = await fetchAll<{ story_id: string; related_story_id: string }>('related_stories', 'story_id, related_story_id');
  const dbKeys = new Set(dbLinks.map(r => `${r.story_id}|${r.related_story_id}`));
  const dbStoryIds = new Set((await fetchAll<{ id: string }>('stories', 'id')).map(r => r.id));

  const toInsert: { story_id: string; related_story_id: string }[] = [];

  for (const s of stories) {
    if (!s.relatedStoryIds || !dbStoryIds.has(s.id)) continue;
    for (const relId of s.relatedStoryIds) {
      const key = `${s.id}|${relId}`;
      if (!dbKeys.has(key) && dbStoryIds.has(relId)) {
        toInsert.push({ story_id: s.id, related_story_id: relId });
      }
    }
  }

  console.log(`  ${toInsert.length} static-only related_story links to insert`);

  for (const row of toInsert) {
    if (!DRY_RUN) {
      const { error } = await supabase.from('related_stories').insert(row);
      if (error) {
        console.error(`    ${row.story_id} -> ${row.related_story_id}: ${error.message}`);
        stats.errors++;
      } else {
        stats.relatedStoriesInserted++;
      }
    } else {
      stats.relatedStoriesInserted++;
    }
  }
}

// ─── COLLECTIONS (insert missing + collection_moments) ──────────────

async function pushCollections() {
  console.log('\n--- COLLECTIONS ---');
  const dbRows = await fetchAll<{ id: string }>('collections', 'id');
  const dbIds = new Set(dbRows.map(r => r.id));

  const toInsert = collections.filter(c => !dbIds.has(c.id));
  console.log(`  ${toInsert.length} static-only collections to insert`);

  for (const c of toInsert) {
    console.log(`    + ${c.id}: ${c.name}`);
    if (!DRY_RUN) {
      const { error } = await supabase.from('collections').insert({
        id: c.id, name: c.name, subtitle: c.subtitle || null,
        description: c.description || null, tags: c.tags || [],
      });
      if (error) {
        console.error(`      ERROR: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.collectionsInserted++;
  }

  // Push missing collection_moments for ALL collections (not just new ones)
  console.log('\n--- COLLECTION_MOMENTS ---');
  const dbCmLinks = await fetchAll<{ collection_id: string; moment_id: string }>('collection_moments', 'collection_id, moment_id');
  const dbCmKeys = new Set(dbCmLinks.map(r => `${r.collection_id}|${r.moment_id}`));
  const dbMomentIds = new Set((await fetchAll<{ id: string }>('moments', 'id')).map(r => r.id));

  let cmToInsert: { collection_id: string; moment_id: string; sort_order: number }[] = [];

  for (const c of collections) {
    for (let i = 0; i < c.momentIds.length; i++) {
      const mid = c.momentIds[i];
      const key = `${c.id}|${mid}`;
      if (!dbCmKeys.has(key) && dbMomentIds.has(mid)) {
        cmToInsert.push({ collection_id: c.id, moment_id: mid, sort_order: i });
      }
    }
  }

  console.log(`  ${cmToInsert.length} static-only collection_moment links to insert`);

  for (let i = 0; i < cmToInsert.length; i += 100) {
    const batch = cmToInsert.slice(i, i + 100);
    if (!DRY_RUN) {
      const { error } = await supabase.from('collection_moments').insert(batch);
      if (error) {
        console.error(`    BATCH ERROR: ${error.message}`);
        stats.errors++;
      } else {
        stats.collectionMomentsInserted += batch.length;
      }
    } else {
      stats.collectionMomentsInserted += batch.length;
    }
  }
}

// ─── Update canonical_story_id on entities ──────────────────────────

async function updateCanonicalStoryIds() {
  console.log('\n--- CANONICAL_STORY_ID UPDATES ---');
  const dbStoryIds = new Set((await fetchAll<{ id: string }>('stories', 'id')).map(r => r.id));

  let updated = 0;
  for (const e of entities) {
    if (e.canonicalStoryId && dbStoryIds.has(e.canonicalStoryId)) {
      if (!DRY_RUN) {
        const { error } = await supabase.from('entities')
          .update({ canonical_story_id: e.canonicalStoryId })
          .eq('id', e.id);
        if (error) {
          console.error(`    ${e.id}: ${error.message}`);
        } else {
          updated++;
        }
      } else {
        updated++;
      }
    }
  }
  console.log(`  Updated ${updated} canonical_story_id references`);
}

// ─── MAIN ───────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  PUSH STATIC → SUPABASE ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`  Static: ${moments.length} moments, ${entities.length} entities, ${stories.length} stories, ${collections.length} collections`);
  console.log(`${'═'.repeat(60)}`);

  await loadTypes();
  await pushEntities();    // Entities first (FKs from moments + stories)
  await pushMoments();     // Moments second (FKs from story_moments + moment_entities)
  await pushStories();     // Stories third
  await pushStoryMoments();
  await pushMomentEntities();
  await pushRelatedStories();
  await pushCollections();
  await updateCanonicalStoryIds();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RESULTS ${DRY_RUN ? '(DRY RUN — nothing written)' : ''}`);
  console.log(`  Entities inserted:        ${stats.entitiesInserted}`);
  console.log(`  Moments inserted:         ${stats.momentsInserted}`);
  console.log(`  Stories inserted:          ${stats.storiesInserted}`);
  console.log(`  Story-Moments linked:      ${stats.storyMomentsInserted}`);
  console.log(`  Moment-Entities linked:    ${stats.momentEntitiesInserted}`);
  console.log(`  Related Stories linked:    ${stats.relatedStoriesInserted}`);
  console.log(`  Collections inserted:      ${stats.collectionsInserted}`);
  console.log(`  Collection-Moments linked: ${stats.collectionMomentsInserted}`);
  console.log(`  Moment types created:      ${stats.momentTypesInserted}`);
  console.log(`  Errors:                    ${stats.errors}`);
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
