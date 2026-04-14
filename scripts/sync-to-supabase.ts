/**
 * Safe ongoing sync: push static TypeScript content → Supabase.
 *
 * Rules:
 * - UPSERT for all tables + DELETE stale rows from join tables
 * - Preserves Supabase-only columns (source, source_id, review_status)
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
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { moments } from '../src/data/moments';
import { entities } from '../src/data/entities';
import { stories } from '../src/data/stories';
import { collections } from '../src/data/collections';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Run: source .env.local');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = process.argv.includes('--dry-run');
const PULL_VERIFIED = process.argv.includes('--pull-verified');

const PAGE_SIZE = 1000;

// Moment IDs where Supabase has geo_verified=true — we must NOT overwrite their coords
let geoVerifiedIds: Set<string> = new Set();

async function loadGeoVerifiedIds() {
  const rows = await fetchAll<{ id: string }>('moments', 'id');
  // Fetch geo_verified separately (PostGIS columns can complicate selects)
  const verified = await fetchAll<{ id: string; geo_verified: boolean }>(
    'moments',
    'id, geo_verified',
  );
  for (const row of verified) {
    if (row.geo_verified) geoVerifiedIds.add(row.id);
  }
  if (geoVerifiedIds.size > 0) {
    console.log(`  Found ${geoVerifiedIds.size} geo-verified moments in Supabase (coords protected)`);
  }
}

/** --pull-verified: dump Supabase-verified coords back into moments.ts so static file stays in sync */
async function pullVerifiedCoords() {
  if (!PULL_VERIFIED) return;
  console.log('\n--- PULL VERIFIED COORDS ---');

  // Fetch verified moments with their PostGIS coords
  const { data, error } = await supabase
    .from('moments')
    .select('id, geo_verified, location')
    .eq('geo_verified', true);

  if (error) {
    console.error(`  ERROR fetching verified coords: ${error.message}`);
    return;
  }
  if (!data || data.length === 0) {
    console.log('  No geo-verified moments found in Supabase.');
    return;
  }

  // Parse PostGIS POINT strings: "SRID=4326;POINT(lng lat)" or raw "POINT(lng lat)"
  const updates: { id: string; lat: number; lng: number }[] = [];
  for (const row of data) {
    const loc = row.location as string;
    if (!loc) continue;
    const match = loc.match(/POINT\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/);
    if (!match) continue;
    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);
    updates.push({ id: row.id, lat, lng });
  }

  if (updates.length === 0) {
    console.log('  No parseable coords found.');
    return;
  }

  // Read moments.ts, apply coord updates
  const { readFileSync, writeFileSync: writeFs } = await import('fs');
  const { join } = await import('path');
  const momentsPath = join(__dirname, '..', 'src', 'data', 'moments.ts');
  let src = readFileSync(momentsPath, 'utf-8');
  let applied = 0;

  for (const u of updates) {
    // Find the moment block by id and update lat/lng
    // Match: id: 'moment-id' followed by lat: and lng: within the same object
    const idPattern = new RegExp(
      `(id:\\s*'${u.id}'[\\s\\S]*?)(lat:\\s*)([-\\d.]+)(,[\\s\\S]*?)(lng:\\s*)([-\\d.]+)`,
    );
    const m = src.match(idPattern);
    if (m) {
      const oldLat = parseFloat(m[3]);
      const oldLng = parseFloat(m[6]);
      if (Math.abs(oldLat - u.lat) > 0.000001 || Math.abs(oldLng - u.lng) > 0.000001) {
        src = src.replace(
          idPattern,
          `$1$2${u.lat}$4$5${u.lng}`,
        );
        console.log(`  ${u.id}: (${oldLat}, ${oldLng}) → (${u.lat}, ${u.lng})`);
        applied++;
      }
    }
  }

  if (applied > 0) {
    writeFs(momentsPath, src);
    console.log(`  Updated ${applied} moment coords in moments.ts`);
  } else {
    console.log('  All static coords already match Supabase verified coords.');
  }
}

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
  staleMomentEntitiesDeleted: 0,
  staleStoryMomentsDeleted: 0,
  staleCollectionMomentsDeleted: 0,
  staleRelatedStoriesDeleted: 0,
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
      // UPSERT: insert if new, update name/type/years/description/wikipedia_slug/notability
      // Does NOT touch: source, source_id, review_status (Supabase-only)
      const { error } = await supabase.from('entities').upsert(
        {
          id: e.id,
          name: cleanStr(e.name),
          type: e.type,
          years: e.years ?? null,
          description: cleanStr(e.description) || null,
          wikipedia_slug: e.wikipediaSlug ?? null,
          notability: e.notability ?? null,
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
  let protectedCount = 0;
  for (const m of moments) {
    const typeId = await ensureType(m.type || 'historical_site');
    const isVerifiedInSupabase = geoVerifiedIds.has(m.id);
    if (isVerifiedInSupabase) protectedCount++;
    if (!DRY_RUN) {
      // UPSERT: insert if new, update text fields + coordinates
      // Does NOT touch: notability, source, source_id, review_status
      // If Supabase has geo_verified=true, skip location to preserve manually verified coords
      const payload: Record<string, any> = {
        id: m.id,
        name: cleanStr(m.name),
        subtitle: cleanStr(m.subtitle) || null,
        description: cleanStr(m.description) || null,
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
        audio_url: (m as any).audioUrl ?? null,
        sources: m.sources ?? null,
        ...(m.geoVerified ? { geo_verified: true } : {}),
        ...(m.geoSourceUrl ? { geo_source_url: m.geoSourceUrl } : {}),
      };

      if (isVerifiedInSupabase) {
        // Do NOT overwrite coords — Supabase has manually verified position
      } else {
        payload.location = `SRID=4326;POINT(${m.lng} ${m.lat})`;
      }

      const { error } = await supabase.from('moments').upsert(
        payload,
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
  console.log(`  ${stats.momentsUpserted} moments upserted (${protectedCount} geo-verified coords protected)`);
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

// ─── STALE LINK CLEANUP ─────────────────────────────────────────────

async function cleanupStaleLinks() {
  console.log('\n--- STALE LINK CLEANUP ---');

  // 1. moment_entities
  const expectedME = new Set<string>();
  for (const m of moments) {
    for (const eid of (m.entityIds ?? [])) {
      expectedME.add(`${m.id}::${eid}`);
    }
  }
  const dbME = await fetchAll<{ moment_id: string; entity_id: string }>('moment_entities', 'moment_id, entity_id');
  const staleME = dbME.filter(row => !expectedME.has(`${row.moment_id}::${row.entity_id}`));
  if (staleME.length > 0) {
    for (const stale of staleME) {
      console.log(`  DELETE moment_entities: ${stale.moment_id} ↔ ${stale.entity_id}`);
      if (!DRY_RUN) {
        const { error } = await supabase.from('moment_entities').delete()
          .eq('moment_id', stale.moment_id)
          .eq('entity_id', stale.entity_id);
        if (error) { console.error(`    ERROR: ${error.message}`); stats.errors++; }
      }
    }
  }
  stats.staleMomentEntitiesDeleted = staleME.length;
  console.log(`  ${staleME.length} stale moment_entities ${DRY_RUN ? 'would be' : ''} deleted`);

  // 2. story_moments
  const expectedSM = new Set<string>();
  for (const s of stories) {
    for (const sm of s.moments) {
      expectedSM.add(`${s.id}::${sm.momentId}`);
    }
  }
  const dbSM = await fetchAll<{ story_id: string; moment_id: string }>('story_moments', 'story_id, moment_id');
  const staleSM = dbSM.filter(row => !expectedSM.has(`${row.story_id}::${row.moment_id}`));
  if (staleSM.length > 0) {
    for (const stale of staleSM) {
      console.log(`  DELETE story_moments: ${stale.story_id} ↔ ${stale.moment_id}`);
      if (!DRY_RUN) {
        const { error } = await supabase.from('story_moments').delete()
          .eq('story_id', stale.story_id)
          .eq('moment_id', stale.moment_id);
        if (error) { console.error(`    ERROR: ${error.message}`); stats.errors++; }
      }
    }
  }
  stats.staleStoryMomentsDeleted = staleSM.length;
  console.log(`  ${staleSM.length} stale story_moments ${DRY_RUN ? 'would be' : ''} deleted`);

  // 3. collection_moments
  const expectedCM = new Set<string>();
  for (const c of collections) {
    for (const mid of c.momentIds) {
      expectedCM.add(`${c.id}::${mid}`);
    }
  }
  const dbCM = await fetchAll<{ collection_id: string; moment_id: string }>('collection_moments', 'collection_id, moment_id');
  const staleCM = dbCM.filter(row => !expectedCM.has(`${row.collection_id}::${row.moment_id}`));
  if (staleCM.length > 0) {
    for (const stale of staleCM) {
      console.log(`  DELETE collection_moments: ${stale.collection_id} ↔ ${stale.moment_id}`);
      if (!DRY_RUN) {
        const { error } = await supabase.from('collection_moments').delete()
          .eq('collection_id', stale.collection_id)
          .eq('moment_id', stale.moment_id);
        if (error) { console.error(`    ERROR: ${error.message}`); stats.errors++; }
      }
    }
  }
  stats.staleCollectionMomentsDeleted = staleCM.length;
  console.log(`  ${staleCM.length} stale collection_moments ${DRY_RUN ? 'would be' : ''} deleted`);

  // 4. related_stories
  const expectedRS = new Set<string>();
  for (const s of stories) {
    for (const relId of (s.relatedStoryIds ?? [])) {
      expectedRS.add(`${s.id}::${relId}`);
    }
  }
  const dbRS = await fetchAll<{ story_id: string; related_story_id: string }>('related_stories', 'story_id, related_story_id');
  const staleRS = dbRS.filter(row => !expectedRS.has(`${row.story_id}::${row.related_story_id}`));
  if (staleRS.length > 0) {
    for (const stale of staleRS) {
      console.log(`  DELETE related_stories: ${stale.story_id} ↔ ${stale.related_story_id}`);
      if (!DRY_RUN) {
        const { error } = await supabase.from('related_stories').delete()
          .eq('story_id', stale.story_id)
          .eq('related_story_id', stale.related_story_id);
        if (error) { console.error(`    ERROR: ${error.message}`); stats.errors++; }
      }
    }
  }
  stats.staleRelatedStoriesDeleted = staleRS.length;
  console.log(`  ${staleRS.length} stale related_stories ${DRY_RUN ? 'would be' : ''} deleted`);
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
  await loadGeoVerifiedIds();

  // If --pull-verified, dump Supabase-verified coords into moments.ts and exit
  if (PULL_VERIFIED) {
    await pullVerifiedCoords();
    return;
  }

  // Order matters: entities → moments → stories → links → collections → cleanup
  await syncEntities();
  await syncMoments();
  await syncStories();
  await syncStoryMoments();
  await syncMomentEntities();
  await syncRelatedStories();
  await syncCollections();
  await syncCanonicalStoryIds();
  await cleanupStaleLinks();

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
  console.log(`  ── Stale deletions ──`);
  console.log(`  Stale moment_entities:    ${stats.staleMomentEntitiesDeleted}`);
  console.log(`  Stale story_moments:      ${stats.staleStoryMomentsDeleted}`);
  console.log(`  Stale collection_moments: ${stats.staleCollectionMomentsDeleted}`);
  console.log(`  Stale related_stories:    ${stats.staleRelatedStoriesDeleted}`);
  console.log(`  Errors:             ${stats.errors}`);
  console.log(`${'═'.repeat(60)}\n`);

  if (stats.errors > 0) process.exit(1);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
