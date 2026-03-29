/**
 * Backfill moment_media rows using Wikipedia lead images from parent stories.
 *
 * Strategy:
 *   1. Find all moments that belong to stories with a wikipedia_slug
 *   2. For each, fetch the Wikipedia page summary to get the lead image
 *   3. Insert into moment_media (type: 'image', url, caption)
 *
 * This populates hero images for collection cards (which look for the first
 * moment media item) and any other UI that uses moment.media.
 *
 * Usage:
 *   npx tsx scripts/backfill-moment-media.ts
 *   npx tsx scripts/backfill-moment-media.ts --dry-run
 *   npx tsx scripts/backfill-moment-media.ts --collections-only   # only moments in collections
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var (from .env.local or shell)
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
const DELAY_MS = 600;
const USER_AGENT = 'DeepMaps/1.0 (backfill-moment-media; contact: deep-maps project)';
const PAGE_SIZE = 1000;

// ─── CLI args ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const collectionsOnly = args.includes('--collections-only');

if (dryRun) console.log('DRY RUN — no Supabase writes will be made.\n');

// ─── Types ───────────────────────────────────────────────────────────

interface StoryMomentRow {
  story_id: string;
  moment_id: string;
  sort_order: number;
}

interface StoryRow {
  id: string;
  name: string;
  wikipedia_slug: string | null;
}

interface CollectionMomentRow {
  collection_id: string;
  moment_id: string;
  sort_order: number;
}

interface MomentMediaRow {
  moment_id: string;
}

interface WikiSummary {
  thumbnail?: { source: string; width: number; height: number };
  originalimage?: { source: string; width: number; height: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAll<T>(table: string, select: string): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch ${table} at offset ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

async function fetchWikiImage(slug: string): Promise<{ imageUrl: string | null; error?: string }> {
  // Decode first to avoid double-encoding (some slugs are stored pre-encoded)
  const decoded = decodeURIComponent(slug);
  const url = `${WIKI_API_BASE}/${encodeURIComponent(decoded)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });

    if (res.status === 404) return { imageUrl: null, error: '404 — article not found' };
    if (res.status === 429) {
      await sleep(2000);
      const retry = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
      if (!retry.ok) return { imageUrl: null, error: `HTTP ${retry.status} (after retry)` };
      const data = (await retry.json()) as WikiSummary;
      return { imageUrl: data.thumbnail?.source ?? null };
    }
    if (!res.ok) return { imageUrl: null, error: `HTTP ${res.status}` };

    const data = (await res.json()) as WikiSummary;
    // Prefer original image for higher quality, fallback to thumbnail
    const imageUrl = data.originalimage?.source ?? data.thumbnail?.source ?? null;
    return { imageUrl };
  } catch (err) {
    return { imageUrl: null, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching data from Supabase...');

  // Fetch all needed tables in parallel
  const [storyMoments, stories, existingMedia, collectionMoments] = await Promise.all([
    fetchAll<StoryMomentRow>('story_moments', 'story_id, moment_id, sort_order'),
    fetchAll<StoryRow>('stories', 'id, name, wikipedia_slug'),
    fetchAll<MomentMediaRow>('moment_media', 'moment_id'),
    fetchAll<CollectionMomentRow>('collection_moments', 'collection_id, moment_id, sort_order'),
  ]);

  console.log(`  story_moments: ${storyMoments.length}`);
  console.log(`  stories: ${stories.length}`);
  console.log(`  existing moment_media: ${existingMedia.length}`);
  console.log(`  collection_moments: ${collectionMoments.length}\n`);

  // Build lookup maps
  const storyById = new Map(stories.map(s => [s.id, s]));
  const existingMediaMomentIds = new Set(existingMedia.map(m => m.moment_id));

  // Build moment → story mapping (use first story found for each moment)
  const momentToStory = new Map<string, StoryRow>();
  for (const sm of storyMoments) {
    if (momentToStory.has(sm.moment_id)) continue;
    const story = storyById.get(sm.story_id);
    if (story) momentToStory.set(sm.moment_id, story);
  }

  // Determine which moments need media
  let targetMomentIds: Set<string>;

  if (collectionsOnly) {
    // Only moments that appear in collections
    targetMomentIds = new Set(collectionMoments.map(cm => cm.moment_id));
    console.log(`Collections-only mode: ${targetMomentIds.size} unique moments in collections.`);
  } else {
    // All moments that have a parent story with a wikipedia_slug
    targetMomentIds = new Set(
      [...momentToStory.entries()]
        .filter(([, story]) => story.wikipedia_slug)
        .map(([momentId]) => momentId)
    );
    console.log(`All-stories mode: ${targetMomentIds.size} moments with Wikipedia-linked stories.`);
  }

  // Filter out moments that already have media
  const candidates: { momentId: string; story: StoryRow }[] = [];
  for (const momentId of targetMomentIds) {
    if (existingMediaMomentIds.has(momentId)) continue;
    const story = momentToStory.get(momentId);
    if (!story?.wikipedia_slug) continue;
    candidates.push({ momentId, story });
  }

  // Deduplicate Wikipedia fetches — many moments share the same story slug
  const slugToMoments = new Map<string, { momentId: string; story: StoryRow }[]>();
  for (const c of candidates) {
    const slug = c.story.wikipedia_slug!;
    if (!slugToMoments.has(slug)) slugToMoments.set(slug, []);
    slugToMoments.get(slug)!.push(c);
  }

  const alreadyHave = targetMomentIds.size - candidates.length;
  console.log(`Skipping ${alreadyHave} moments that already have media.`);
  console.log(`${candidates.length} moments need media across ${slugToMoments.size} unique Wikipedia slugs.\n`);

  let found = 0;
  let skipped = 0;
  let failed = 0;
  let inserted = 0;
  const failures: { slug: string; storyName: string; error: string }[] = [];

  const slugEntries = [...slugToMoments.entries()];

  for (let i = 0; i < slugEntries.length; i++) {
    const [slug, momentEntries] = slugEntries[i];
    const storyName = momentEntries[0].story.name;
    const progress = `[${i + 1}/${slugEntries.length}]`;

    const { imageUrl, error } = await fetchWikiImage(slug);

    if (error) {
      console.log(`${progress} FAIL  ${storyName} (${slug}): ${error}`);
      failures.push({ slug, storyName, error });
      failed++;
    } else if (!imageUrl) {
      console.log(`${progress} SKIP  ${storyName} (${slug}): no image`);
      skipped++;
    } else {
      console.log(`${progress} OK    ${storyName} → ${momentEntries.length} moments`);
      found++;

      if (!dryRun) {
        // Insert media rows for all moments under this story
        const rows = momentEntries.map(e => ({
          moment_id: e.momentId,
          type: 'image' as const,
          url: imageUrl,
          caption: storyName,
          sort_order: 0,
        }));

        const { error: insertError } = await supabase
          .from('moment_media')
          .insert(rows);

        if (insertError) {
          console.error(`  WARNING: Insert failed: ${insertError.message}`);
        } else {
          inserted += rows.length;
        }
      }
    }

    if (i < slugEntries.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  Wikipedia slugs processed: ${slugEntries.length}`);
  console.log(`  Images found:              ${found}`);
  console.log(`  No image:                  ${skipped}`);
  console.log(`  Failures:                  ${failed}`);
  console.log(`  Already had media:         ${alreadyHave}`);
  console.log(`  moment_media rows inserted: ${inserted}`);
  if (dryRun) console.log(`  Mode:                      DRY RUN (nothing written)`);
  console.log('══════════════════════════════════════════════════════\n');

  if (failures.length > 0) {
    console.log('Failed slugs:');
    for (const f of failures) {
      console.log(`  - ${f.storyName} (${f.slug}): ${f.error}`);
    }
    console.log('');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
