/**
 * Backfill Wikipedia thumbnail images for all entities with a wikipediaSlug.
 *
 * For each entity:
 *   1. Fetches https://en.wikipedia.org/api/rest_v1/page/summary/{slug}
 *   2. Extracts thumbnail.source (URL to ~320px image)
 *   3. Upserts image_url to the Supabase `entities` table
 *
 * Usage:
 *   npx tsx scripts/backfill-entity-images.ts
 *   npx tsx scripts/backfill-entity-images.ts --dry-run
 *   npx tsx scripts/backfill-entity-images.ts --type person     # only person entities
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var (from .env.local or shell)
 *
 * Supabase schema prerequisite:
 *   ALTER TABLE entities ADD COLUMN IF NOT EXISTS image_url text;
 */

import { createClient } from '@supabase/supabase-js';

// ─── Config ──────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local or as an env var.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const WIKI_API_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const DELAY_MS = 600; // Polite rate limit for Wikipedia API (429 at 200ms)
const USER_AGENT = 'DeepMaps/1.0 (backfill-entity-images; contact: deep-maps project)';

// ─── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const typeFilterIdx = args.indexOf('--type');
const typeFilter = typeFilterIdx !== -1 ? args[typeFilterIdx + 1] : null;

if (dryRun) console.log('🏃 DRY RUN — no Supabase writes will be made.\n');

// ─── Types ───────────────────────────────────────────────────────────

interface EntityRow {
  id: string;
  name: string;
  type: string;
  wikipedia_slug: string | null;
  image_url: string | null;
}

interface WikiSummary {
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWikiThumbnail(slug: string): Promise<{ thumbnailUrl: string | null; error?: string }> {
  const url = `${WIKI_API_BASE}/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow', // Handle redirects automatically
    });

    if (res.status === 404) {
      return { thumbnailUrl: null, error: `404 — article not found` };
    }
    if (res.status === 429) {
      // Rate limited — wait and retry once
      await sleep(2000);
      const retry = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
      if (!retry.ok) return { thumbnailUrl: null, error: `HTTP ${retry.status} (after retry)` };
      const retryData = (await retry.json()) as WikiSummary;
      return { thumbnailUrl: retryData.thumbnail?.source ?? null };
    }
    if (!res.ok) {
      return { thumbnailUrl: null, error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as WikiSummary;
    const thumbnailUrl = data.thumbnail?.source ?? null;
    return { thumbnailUrl };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { thumbnailUrl: null, error: msg };
  }
}

// ─── Pagination helper ───────────────────────────────────────────────

const PAGE_SIZE = 1000;

async function fetchAllEntities(): Promise<EntityRow[]> {
  const all: EntityRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('entities')
      .select('id, name, type, wikipedia_slug, image_url')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch entities at offset ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as EntityRow[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching entities from Supabase...');
  const allEntities = await fetchAllEntities();
  console.log(`Found ${allEntities.length} total entities.\n`);

  // Filter to entities with a wikipedia slug
  let candidates = allEntities.filter((e) => e.wikipedia_slug);

  // Optionally filter by entity type
  if (typeFilter) {
    candidates = candidates.filter((e) => e.type === typeFilter);
    console.log(`Filtered to type="${typeFilter}": ${candidates.length} entities.\n`);
  }

  // Skip entities that already have an image_url
  const needsImage = candidates.filter((e) => !e.image_url);
  const alreadyHave = candidates.length - needsImage.length;
  if (alreadyHave > 0) {
    console.log(`Skipping ${alreadyHave} entities that already have an image_url.`);
  }
  console.log(`Processing ${needsImage.length} entities...\n`);

  let found = 0;
  let skipped = 0;
  let failed = 0;
  const failures: { id: string; name: string; error: string }[] = [];

  for (let i = 0; i < needsImage.length; i++) {
    const entity = needsImage[i];
    const slug = entity.wikipedia_slug!;
    const progress = `[${i + 1}/${needsImage.length}]`;

    const { thumbnailUrl, error } = await fetchWikiThumbnail(slug);

    if (error) {
      console.log(`${progress} FAIL  ${entity.name} (${slug}): ${error}`);
      failures.push({ id: entity.id, name: entity.name, error });
      failed++;
    } else if (!thumbnailUrl) {
      console.log(`${progress} SKIP  ${entity.name} (${slug}): no thumbnail`);
      skipped++;
    } else {
      console.log(`${progress} OK    ${entity.name} → ${thumbnailUrl.substring(0, 80)}...`);
      found++;

      if (!dryRun) {
        const { error: upsertError } = await supabase
          .from('entities')
          .update({ image_url: thumbnailUrl })
          .eq('id', entity.id);

        if (upsertError) {
          console.error(`  ⚠ Supabase update failed for ${entity.id}: ${upsertError.message}`);
          // If the column doesn't exist, bail early with instructions
          if (upsertError.message.includes('image_url')) {
            console.error('\n──────────────────────────────────────────────────────');
            console.error('The image_url column does not exist on the entities table.');
            console.error('Run this SQL in the Supabase dashboard first:');
            console.error('  ALTER TABLE entities ADD COLUMN image_url text;');
            console.error('──────────────────────────────────────────────────────\n');
            process.exit(1);
          }
        }
      }
    }

    // Rate limit: wait between Wikipedia requests
    if (i < needsImage.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  Entities processed: ${needsImage.length}`);
  console.log(`  Images found:       ${found}`);
  console.log(`  No thumbnail:       ${skipped}`);
  console.log(`  Failures:           ${failed}`);
  console.log(`  Already had image:  ${alreadyHave}`);
  if (dryRun) console.log(`  Mode:               DRY RUN (nothing written)`);
  console.log('══════════════════════════════════════════════════════\n');

  if (failures.length > 0) {
    console.log('Failed entities:');
    for (const f of failures) {
      console.log(`  - ${f.name} (${f.id}): ${f.error}`);
    }
    console.log('');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
