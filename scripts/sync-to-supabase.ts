/**
 * Safe ongoing sync: push static TypeScript content → Supabase.
 *
 * Rules:
 * - UPSERT only — NEVER deletes anything
 * - Preserves Supabase-only columns (notability, source, source_id, review_status)
 * - Skips community verification tables (location_suggestions, suggestion_votes, etc.)
 * - Logs every change for audit trail
 * - Use --dry-run to preview changes
 *
 * Run after any static file edit to keep Supabase in sync.
 *
 * Usage:
 *   export SUPABASE_SERVICE_ROLE_KEY=... && npx tsx scripts/sync-to-supabase.ts
 *   export SUPABASE_SERVICE_ROLE_KEY=... && npx tsx scripts/sync-to-supabase.ts --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import { moments } from '../src/data/moments';
import { entities } from '../src/data/entities';
import { stories } from '../src/data/stories';
import { collections } from '../src/data/collections';

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Run: source .env.local');
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

function parseYears(years: string): { startYear: number | null; endYear: number | null } {
  const matches = years.match(/(-?\d[\d,]*)/g);
  if (!matches) return { startYear: null, endYear: null };
  const nums = matches.map(m => parseInt(m.replace(/,/g, ''), 10));
  return { startYear: nums[0] ?? null, endYear: nums.length > 1 ? nums[1] : null };
}

const stats = {
  entitiesUpserted: 0,
  momentsUpserted: 0,
  storiesUpserted: 0,
  storyMomentsUpserted: 0,
  momentEntitiesUpserted: 0,
  relatedStoriesUpserted: 0,
  collectionsUpserted: 0,
  collectionMomentsUpserted: 0,
  momentTypesCreated: 0,
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
      stats.momentTypesCreated++;
      console.log(`    + moment_type: ${typeName}`);
    }
  }
  validTypes.add(typeName);
  return typeName;
}

// ─── ENTITIES ───────────────────────────────────────────────────────

async function syncEntities() {
  console.log('\n--- ENTITIES ---');
  for (const e of entities) {
    if (!DRY_RUN) {
      // UPSERT: insert if new, update name/type/years/description/wikipedia_slug
      // Does NOT touch: notability, source, source_id, review_status (Supabase-only)
      const { error } = await supabase.from('entities').upsert(
        {
          id: e.id,
          name: cleanStr(e.name),
          type: e.type,
          years: e.years ?? null,
          description: cleanStr(e.description) || null,
          wikipedia_slug: e.wikipediaSlug ?? null,
          // canonical_story_id handled separately after stories
        },
        { onConflict: 'id' },
      );
      if (error) {
        console.error(`  ERROR ${e.id}: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.entitiesUpserted++;
  }
  console.log(`  ${stats.entitiesUpserted} entities upserted`);
}

// ─── MOMENTS ────────────────────────────────────────────────────────

async function syncMoments() {
  console.log('\n--- MOMENTS ---');
  for (const m of moments) {
    const typeId = await ensureType(m.type || 'historical_site');
    if (!DRY_RUN) {
      // UPSERT: insert if new, update text fields + coordinates
      // Does NOT touch: notability, source, source_id, review_status
      const { error } = await supabase.from('moments').upsert(
        {
          id: m.id,
          name: cleanStr(m.name),
          subtitle: cleanStr(m.subtitle) || null,
          description: cleanStr(m.description) || null,
          location: `SRID=4326;POINT(${m.lng} ${m.lat})`,
          type_id: typeId,
          importance: m.importance || 'minor',
          accuracy: m.accuracy || 'approximate',
          kind: m.kind || 'event',
          year: m.year ?? null,
          date: (m as any).date ?? null,
          address: m.address ?? null,
          verification_level: m.verificationLevel ?? 'documented',
          wiki_section: (m as any).wikiSection ?? null,
          narrative_context: (m as any).narrativeContext ?? null,
        },
        { onConflict: 'id', ignoreDuplicates: false },
      );
      if (error) {
        console.error(`  ERROR ${m.id}: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.momentsUpserted++;
  }
  console.log(`  ${stats.momentsUpserted} moments upserted`);
}

// ─── STORIES ────────────────────────────────────────────────────────

async function syncStories() {
  console.log('\n--- STORIES ---');
  for (const s of stories) {
    const { startYear, endYear } = parseYears(s.years);
    if (!DRY_RUN) {
      const { error } = await supabase.from('stories').upsert(
        {
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
        },
        { onConflict: 'id' },
      );
      if (error) {
        console.error(`  ERROR ${s.id}: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.storiesUpserted++;
  }
  console.log(`  ${stats.storiesUpserted} stories upserted`);
}

// ─── STORY_MOMENTS ──────────────────────────────────────────────────

async function syncStoryMoments() {
  console.log('\n--- STORY_MOMENTS ---');
  for (const s of stories) {
    for (let i = 0; i < s.moments.length; i++) {
      const sm = s.moments[i];
      if (!DRY_RUN) {
        const { error } = await supabase.from('story_moments').upsert(
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
          console.error(`  ERROR ${s.id}|${sm.momentId}: ${error.message}`);
          stats.errors++;
        } else {
          stats.storyMomentsUpserted++;
        }
      } else {
        stats.storyMomentsUpserted++;
      }
    }
  }
  console.log(`  ${stats.storyMomentsUpserted} story_moments upserted`);
}

// ─── MOMENT_ENTITIES ────────────────────────────────────────────────

async function syncMomentEntities() {
  console.log('\n--- MOMENT_ENTITIES ---');
  const dbEntityIds = new Set((await fetchAll<{ id: string }>('entities', 'id')).map(r => r.id));

  for (const m of moments) {
    if (!m.entityIds) continue;
    for (const eid of m.entityIds) {
      if (!dbEntityIds.has(eid)) continue; // skip if entity doesn't exist
      if (!DRY_RUN) {
        const { error } = await supabase.from('moment_entities').upsert(
          { moment_id: m.id, entity_id: eid },
          { onConflict: 'moment_id,entity_id' },
        );
        if (error) {
          console.error(`  ERROR ${m.id}|${eid}: ${error.message}`);
          stats.errors++;
        } else {
          stats.momentEntitiesUpserted++;
        }
      } else {
        stats.momentEntitiesUpserted++;
      }
    }
  }
  console.log(`  ${stats.momentEntitiesUpserted} moment_entities upserted`);
}

// ─── RELATED_STORIES ────────────────────────────────────────────────

async function syncRelatedStories() {
  console.log('\n--- RELATED_STORIES ---');
  const dbStoryIds = new Set((await fetchAll<{ id: string }>('stories', 'id')).map(r => r.id));

  for (const s of stories) {
    if (!s.relatedStoryIds) continue;
    for (const relId of s.relatedStoryIds) {
      if (!dbStoryIds.has(relId)) continue;
      if (!DRY_RUN) {
        const { error } = await supabase.from('related_stories').upsert(
          { story_id: s.id, related_story_id: relId },
          { onConflict: 'story_id,related_story_id' },
        );
        if (error) {
          console.error(`  ERROR ${s.id}|${relId}: ${error.message}`);
          stats.errors++;
        } else {
          stats.relatedStoriesUpserted++;
        }
      } else {
        stats.relatedStoriesUpserted++;
      }
    }
  }
  console.log(`  ${stats.relatedStoriesUpserted} related_stories upserted`);
}

// ─── COLLECTIONS ────────────────────────────────────────────────────

async function syncCollections() {
  console.log('\n--- COLLECTIONS ---');
  const dbMomentIds = new Set((await fetchAll<{ id: string }>('moments', 'id')).map(r => r.id));

  for (const c of collections) {
    if (!DRY_RUN) {
      const { error } = await supabase.from('collections').upsert(
        {
          id: c.id,
          name: c.name,
          subtitle: c.subtitle || null,
          description: c.description || null,
          tags: c.tags || [],
        },
        { onConflict: 'id' },
      );
      if (error) {
        console.error(`  ERROR ${c.id}: ${error.message}`);
        stats.errors++;
        continue;
      }
    }
    stats.collectionsUpserted++;

    // collection_moments
    for (let i = 0; i < c.momentIds.length; i++) {
      const mid = c.momentIds[i];
      if (!dbMomentIds.has(mid)) continue;
      if (!DRY_RUN) {
        const { error } = await supabase.from('collection_moments').upsert(
          { collection_id: c.id, moment_id: mid, sort_order: i },
          { onConflict: 'collection_id,moment_id' },
        );
        if (error) {
          console.error(`  CM ERROR ${c.id}|${mid}: ${error.message}`);
        } else {
          stats.collectionMomentsUpserted++;
        }
      } else {
        stats.collectionMomentsUpserted++;
      }
    }
  }
  console.log(`  ${stats.collectionsUpserted} collections, ${stats.collectionMomentsUpserted} collection_moments upserted`);
}

// ─── CANONICAL_STORY_ID ─────────────────────────────────────────────

async function syncCanonicalStoryIds() {
  console.log('\n--- CANONICAL_STORY_ID ---');
  const dbStoryIds = new Set((await fetchAll<{ id: string }>('stories', 'id')).map(r => r.id));
  let updated = 0;

  for (const e of entities) {
    if (e.canonicalStoryId && dbStoryIds.has(e.canonicalStoryId)) {
      if (!DRY_RUN) {
        await supabase.from('entities')
          .update({ canonical_story_id: e.canonicalStoryId })
          .eq('id', e.id);
      }
      updated++;
    }
  }
  console.log(`  ${updated} canonical_story_id refs updated`);
}

// ─── MAIN ───────────────────────────────────────────────────────────

async function main() {
  console.log(`${'═'.repeat(60)}`);
  console.log(`  SYNC STATIC → SUPABASE ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`  Static: ${moments.length} moments, ${entities.length} entities, ${stories.length} stories, ${collections.length} collections`);
  console.log(`${'═'.repeat(60)}`);

  await loadTypes();

  // Order matters: entities → moments → stories → links → collections
  await syncEntities();
  await syncMoments();
  await syncStories();
  await syncStoryMoments();
  await syncMomentEntities();
  await syncRelatedStories();
  await syncCollections();
  await syncCanonicalStoryIds();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RESULTS ${DRY_RUN ? '(DRY RUN — nothing written)' : ''}`);
  console.log(`  Entities:           ${stats.entitiesUpserted}`);
  console.log(`  Moments:            ${stats.momentsUpserted}`);
  console.log(`  Stories:            ${stats.storiesUpserted}`);
  console.log(`  Story-Moments:      ${stats.storyMomentsUpserted}`);
  console.log(`  Moment-Entities:    ${stats.momentEntitiesUpserted}`);
  console.log(`  Related Stories:    ${stats.relatedStoriesUpserted}`);
  console.log(`  Collections:        ${stats.collectionsUpserted}`);
  console.log(`  Collection-Moments: ${stats.collectionMomentsUpserted}`);
  console.log(`  Moment types:       ${stats.momentTypesCreated}`);
  console.log(`  Errors:             ${stats.errors}`);
  console.log(`${'═'.repeat(60)}\n`);

  if (stats.errors > 0) process.exit(1);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
