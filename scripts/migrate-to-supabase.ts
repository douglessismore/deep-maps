/**
 * Deep Maps → Supabase Migration Script
 *
 * Reads static TS data files → transforms → upserts to Supabase.
 * Idempotent: safe to re-run (ON CONFLICT DO UPDATE).
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase.ts              # full run
 *   npx tsx scripts/migrate-to-supabase.ts --dry-run     # log transforms, don't write
 */

import { createClient } from '@supabase/supabase-js';
import { moments } from '../src/data/moments.js';
import { stories } from '../src/data/stories.js';
import { entities } from '../src/data/entities.js';
import { collections } from '../src/data/collections.js';

// ─── Config ──────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoeHlhb2FhZXp0cnljZm9wcGV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYzNjA0MiwiZXhwIjoyMDg5MjEyMDQyfQ.JHLXdq7e46RRRuAR06px5-x3g0uL41wz3MBHxSpxb88';

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── Type consolidation map ──────────────────────────────────────────

const TYPE_MAP: Record<string, string> = {
  home: 'residence',
  historic_home: 'residence',
  natural_feature: 'natural_site',
};

function mapType(t: string): string {
  return TYPE_MAP[t] || t;
}

// ─── Parse years string → start_year / end_year ─────────────────────

function parseYears(years: string): { startYear: number | null; endYear: number | null } {
  // Handle patterns: "1957", "1978–1991", "c. 1200 BCE", "3100 BCE–30 BCE",
  // "1860s–1930s", "33 AD", "1st century AD", etc.
  const cleaned = years.replace(/c\.\s*/g, '').replace(/s\b/g, '');

  // Match BCE/BC years
  const bcePattern = /(\d+)\s*(?:BCE|BC)/gi;
  const adPattern = /(\d+)\s*(?:AD|CE)/gi;

  // Try range first: "X–Y" or "X-Y"
  const rangeMatch = cleaned.match(/^(.+?)\s*[–\-]\s*(.+?)$/);

  if (rangeMatch) {
    return {
      startYear: parseOneYear(rangeMatch[1]),
      endYear: parseOneYear(rangeMatch[2]),
    };
  }

  // Single year
  const single = parseOneYear(cleaned);
  return { startYear: single, endYear: single };
}

function parseOneYear(s: string): number | null {
  const trimmed = s.trim();

  // "1st century AD" etc.
  const centuryMatch = trimmed.match(/(\d+)(?:st|nd|rd|th)\s+century\s*(BCE|BC|AD|CE)?/i);
  if (centuryMatch) {
    const century = parseInt(centuryMatch[1]);
    const era = centuryMatch[2]?.toUpperCase();
    const yearApprox = (century - 1) * 100 + 50; // middle of century
    return era === 'BCE' || era === 'BC' ? -yearApprox : yearApprox;
  }

  // "3100 BCE" or "33 AD"
  const eraMatch = trimmed.match(/(\d+)\s*(BCE|BC|AD|CE)?/i);
  if (eraMatch) {
    const num = parseInt(eraMatch[1]);
    const era = eraMatch[2]?.toUpperCase();
    if (era === 'BCE' || era === 'BC') return -num;
    return num;
  }

  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

let errorCount = 0;

async function upsertBatch(
  table: string,
  rows: Record<string, unknown>[],
  options?: { onConflict?: string; ignoreDuplicates?: boolean }
) {
  if (rows.length === 0) return;
  if (DRY_RUN) {
    console.log(`  [DRY RUN] ${table}: ${rows.length} rows`);
    return;
  }

  // Upsert in chunks of 500
  for (const batch of chunk(rows, 500)) {
    const query = supabase.from(table).upsert(batch, {
      onConflict: options?.onConflict,
      ignoreDuplicates: options?.ignoreDuplicates,
    });

    const { error } = await query;
    if (error) {
      errorCount++;
      console.error(`  ✗ ${table}: ${error.message}`);
      // Log first failing row for debugging
      console.error(`    First row:`, JSON.stringify(batch[0]).slice(0, 200));
    }
  }
}

// ─── Main migration ─────────────────────────────────────────────────

async function migrate() {
  console.log(DRY_RUN ? '═══ DRY RUN ═══' : '═══ MIGRATING ═══');
  console.log(`Source: ${moments.length} moments, ${stories.length} stories, ${entities.length} entities, ${collections.length} collections\n`);

  // ── 1. Stories (must go before moments for FK on entities.canonical_story_id) ──
  console.log('1. Stories...');
  const storyRows = stories.map((s) => {
    const { startYear, endYear } = parseYears(s.years);
    return {
      id: s.id,
      name: s.name,
      nickname: s.nickname || null,
      years: s.years,
      start_year: startYear,
      end_year: endYear,
      category: s.category,
      story_type: s.storyType,
      description: s.description,
      tags: s.tags,
      content_warning: s.contentWarning || null,
      wikipedia_slug: s.wikipediaSlug || null,
    };
  });
  await upsertBatch('stories', storyRows, { onConflict: 'id' });
  console.log(`  ✓ ${storyRows.length} stories`);

  // ── 2. Entities ──
  console.log('2. Entities...');
  const entityRows = entities.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    years: e.years || null,
    description: e.description || null,
    canonical_story_id: e.canonicalStoryId || null,
    wikipedia_slug: e.wikipediaSlug || null,
  }));
  await upsertBatch('entities', entityRows, { onConflict: 'id' });
  console.log(`  ✓ ${entityRows.length} entities`);

  // ── 3. Collections ──
  console.log('3. Collections...');
  const collectionRows = collections.map((c) => ({
    id: c.id,
    name: c.name,
    subtitle: c.subtitle,
    description: c.description,
    tags: c.tags,
  }));
  await upsertBatch('collections', collectionRows, { onConflict: 'id' });
  console.log(`  ✓ ${collectionRows.length} collections`);

  // ── 4. Moments (uses PostGIS ST_MakePoint via raw SQL for geometry) ──
  console.log('4. Moments...');
  // PostgREST can't directly insert GEOMETRY — we need to use RPC or raw insert
  // Use a workaround: insert with a text representation that PostGIS can cast
  const momentRows = moments.map((m) => ({
    id: m.id,
    name: m.name,
    subtitle: m.subtitle,
    description: m.description,
    // PostgREST accepts WKT (Well-Known Text) for geometry columns
    location: `SRID=4326;POINT(${m.lng} ${m.lat})`,
    type_id: mapType(m.type),
    importance: m.importance,
    notability: m.notability ?? 30,
    accuracy: m.accuracy,
    kind: m.kind || 'event',
    year: m.year ?? null,
    date: m.date || null,
    address: m.address || null,
    verification_level: m.verificationLevel || 'verified',
    wiki_section: m.wikiSection || null,
    source: 'editorial',
    source_id: null,
  }));
  await upsertBatch('moments', momentRows, { onConflict: 'id' });
  console.log(`  ✓ ${momentRows.length} moments`);

  // ── 5. Join tables ──

  // story_moments
  console.log('5. Story → Moment links...');
  const storyMomentRows: Record<string, unknown>[] = [];
  for (const story of stories) {
    for (let i = 0; i < story.moments.length; i++) {
      const sm = story.moments[i];
      storyMomentRows.push({
        story_id: story.id,
        moment_id: sm.momentId,
        sort_order: i,
        narrative_glue: sm.narrativeGlue || null,
        is_primary: sm.isPrimary || false,
      });
    }
  }
  await upsertBatch('story_moments', storyMomentRows, {
    onConflict: 'story_id,moment_id',
  });
  console.log(`  ✓ ${storyMomentRows.length} story_moments`);

  // collection_moments
  console.log('6. Collection → Moment links...');
  const collectionMomentRows: Record<string, unknown>[] = [];
  for (const col of collections) {
    for (let i = 0; i < col.momentIds.length; i++) {
      collectionMomentRows.push({
        collection_id: col.id,
        moment_id: col.momentIds[i],
        sort_order: i,
      });
    }
  }
  await upsertBatch('collection_moments', collectionMomentRows, {
    onConflict: 'collection_id,moment_id',
  });
  console.log(`  ✓ ${collectionMomentRows.length} collection_moments`);

  // moment_entities
  console.log('7. Moment → Entity links...');
  const momentEntityRows: Record<string, unknown>[] = [];
  for (const m of moments) {
    if (m.entityIds) {
      for (const eid of m.entityIds) {
        momentEntityRows.push({
          moment_id: m.id,
          entity_id: eid,
        });
      }
    }
  }
  await upsertBatch('moment_entities', momentEntityRows, {
    onConflict: 'moment_id,entity_id',
  });
  console.log(`  ✓ ${momentEntityRows.length} moment_entities`);

  // related_stories (filter out invalid references)
  console.log('8. Related stories...');
  const storyIdSet = new Set(stories.map((s) => s.id));
  const relatedStoryRows: Record<string, unknown>[] = [];
  let skippedRefs = 0;
  for (const story of stories) {
    if (story.relatedStoryIds) {
      for (const rid of story.relatedStoryIds) {
        if (!storyIdSet.has(rid)) {
          skippedRefs++;
          console.log(`  ⚠ Skipping invalid ref: ${story.id} → ${rid}`);
          continue;
        }
        relatedStoryRows.push({
          story_id: story.id,
          related_story_id: rid,
        });
      }
    }
  }
  await upsertBatch('related_stories', relatedStoryRows, {
    onConflict: 'story_id,related_story_id',
  });
  console.log(`  ✓ ${relatedStoryRows.length} related_stories`);

  // moment_media
  console.log('9. Moment media...');
  const momentMediaRows: Record<string, unknown>[] = [];
  for (const m of moments) {
    if (m.media) {
      for (let i = 0; i < m.media.length; i++) {
        const med = m.media[i];
        momentMediaRows.push({
          moment_id: m.id,
          type: med.type,
          url: med.url,
          caption: med.caption || null,
          sort_order: i,
        });
      }
    }
  }
  // Media has serial PK — can't upsert by conflict. Delete + re-insert.
  if (!DRY_RUN && momentMediaRows.length > 0) {
    await supabase.from('moment_media').delete().neq('id', -1); // delete all
    await upsertBatch('moment_media', momentMediaRows);
  } else if (DRY_RUN) {
    console.log(`  [DRY RUN] moment_media: ${momentMediaRows.length} rows`);
  }
  console.log(`  ✓ ${momentMediaRows.length} moment_media`);

  // moment_links
  console.log('10. Moment links...');
  const momentLinkRows: Record<string, unknown>[] = [];
  for (const m of moments) {
    if (m.links) {
      for (let i = 0; i < m.links.length; i++) {
        const link = m.links[i];
        momentLinkRows.push({
          moment_id: m.id,
          label: link.label,
          url: link.url,
          type: link.type,
          sort_order: i,
        });
      }
    }
  }
  if (!DRY_RUN && momentLinkRows.length > 0) {
    await supabase.from('moment_links').delete().neq('id', -1); // delete all
    await upsertBatch('moment_links', momentLinkRows);
  } else if (DRY_RUN) {
    console.log(`  [DRY RUN] moment_links: ${momentLinkRows.length} rows`);
  }
  console.log(`  ✓ ${momentLinkRows.length} moment_links`);

  // ── Validation ──
  console.log('\n═══ VALIDATION ═══');
  if (DRY_RUN) {
    console.log('Skipping validation in dry-run mode.\n');
    return;
  }

  const counts = await Promise.all([
    supabase.from('moments').select('id', { count: 'exact', head: true }),
    supabase.from('stories').select('id', { count: 'exact', head: true }),
    supabase.from('entities').select('id', { count: 'exact', head: true }),
    supabase.from('collections').select('id', { count: 'exact', head: true }),
    supabase.from('story_moments').select('story_id', { count: 'exact', head: true }),
    supabase.from('collection_moments').select('collection_id', { count: 'exact', head: true }),
    supabase.from('moment_entities').select('moment_id', { count: 'exact', head: true }),
    supabase.from('related_stories').select('story_id', { count: 'exact', head: true }),
    supabase.from('moment_media').select('id', { count: 'exact', head: true }),
    supabase.from('moment_links').select('id', { count: 'exact', head: true }),
  ]);

  const expected = [
    { table: 'moments', expected: moments.length },
    { table: 'stories', expected: stories.length },
    { table: 'entities', expected: entities.length },
    { table: 'collections', expected: collections.length },
    { table: 'story_moments', expected: storyMomentRows.length },
    { table: 'collection_moments', expected: collectionMomentRows.length },
    { table: 'moment_entities', expected: momentEntityRows.length },
    { table: 'related_stories', expected: relatedStoryRows.length },
    { table: 'moment_media', expected: momentMediaRows.length },
    { table: 'moment_links', expected: momentLinkRows.length },
  ];

  let allPass = true;
  for (let i = 0; i < expected.length; i++) {
    const actual = counts[i].count ?? 0;
    const exp = expected[i].expected;
    const match = actual === exp;
    if (!match) allPass = false;
    console.log(
      `  ${match ? '✓' : '✗'} ${expected[i].table}: ${actual} rows (expected ${exp})`
    );
  }

  console.log(allPass ? '\n✅ All counts match!' : '\n❌ Some counts do not match.');
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount} error(s) during migration.`);
  }
}

migrate().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
