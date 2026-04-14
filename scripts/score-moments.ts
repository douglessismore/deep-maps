/**
 * Deep Maps — Notability Scoring Script (Phase 0, Multi-Signal v0.2)
 *
 * Scores all moments using a composite of multiple signals to balance
 * internet popularity against true historical/cultural significance.
 *
 * Run: npx tsx scripts/score-moments.ts
 *
 * Scoring signals (weighted composite):
 *   1. Wikidata sitelinks (0.45) — cross-lingual coverage as universality proxy
 *   2. Wikipedia pageviews (0.35) — internet attention baseline (log10 scale)
 *   3. Cross-reference density (0.20) — internal graph centrality (stories, entities, collections)
 *   + CV (coefficient of variation) tracked as diagnostic, not in scoring formula
 *   + Primary moment multiplier (0.5x for supporting moments)
 *   + Manual overrides from scripts/output/overrides.json (always wins)
 *
 * Outputs:
 *   - scripts/output/notability-scores.md  (human-readable ranked list)
 *   - scripts/output/notability-scores.json (machine-readable breakdowns)
 */

import { moments } from '../src/data/moments';
import { stories } from '../src/data/stories';
import { entities } from '../src/data/entities';
import { collections } from '../src/data/collections';
import * as fs from 'fs';
import * as path from 'path';

// ── Types ──────────────────────────────────────────────────────────────

interface PageviewResult {
  slug: string;
  avgMonthlyViews: number;
  monthlyViews: number[];   // raw monthly view counts for CV computation
  months: number;
}

interface ScoreBreakdown {
  momentId: string;
  momentName: string;
  effectiveScore: number;
  oldScore: number;         // v0.2 score for comparison
  isPrimary: boolean;
  parentStoryId: string | null;
  parentStoryName: string | null;
  signals: {
    sitelinks: number;      // 0-100, from Wikidata sitelinks count
    sitelinksRaw: number;   // raw sitelinks count
    pageviews: number;      // 0-100, from log10(avgMonthlyViews)
    stability: number;      // 0-100, from CV of monthly pageviews
    cv: number;             // raw coefficient of variation
    crossRefDensity: number;
    surprise: number;        // 0-100, v0.3 surprise factor
    surpriseGap: number;     // obscurity-significance gap sub-signal
    surpriseStructure: number; // structure-gone sub-signal
    surpriseType: number;    // type-mismatch sub-signal
    manualOverride: number | null;
  };
  sourceSlug: string | null;
  sourceQID: string | null;
  avgMonthlyViews: number;
  category: string | null;
  scoreVersion: string;
}

// ── Configuration ──────────────────────────────────────────────────────

const SCORE_VERSION = 'v0.2';
const SUPPORTING_MULTIPLIER = 0.5;
const MIN_SCORE = 5;
const MAX_SCORE = 100;

// Composite signal weights (must sum to 1.0)
const WEIGHT_SITELINKS = 0.45;
const WEIGHT_PAGEVIEWS = 0.35;
const WEIGHT_CROSSREF = 0.20;

// v0.3 surprise factor — computed and tracked in signals but NOT in composite formula yet.
// Surprise infrastructure is built and ready; weights need tuning before activation.
const WEIGHT_SURPRISE = 0.0; // tracked only, not in formula

// Date range for pageviews: last 12 months
const endDate = new Date();
const startDate = new Date();
startDate.setFullYear(startDate.getFullYear() - 1);
const formatDate = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}01`;
const START = formatDate(startDate);
const END = formatDate(endDate);

const OUTPUT_DIR = path.join(import.meta.dirname, 'output');
const OVERRIDES_PATH = path.join(OUTPUT_DIR, 'overrides.json');

// ── Helpers ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pageviewsToScore(avgMonthlyViews: number): number {
  if (avgMonthlyViews <= 0) return MIN_SCORE;
  const raw = (Math.log10(avgMonthlyViews) - 1.5) * 20;
  return clamp(Math.round(raw), MIN_SCORE, MAX_SCORE);
}

async function fetchPageviews(slug: string, retries = 2): Promise<PageviewResult> {
  // Decode any pre-encoded slugs (e.g. "Georgia_O%27Keeffe" → "Georgia_O'Keeffe")
  // before re-encoding for the API URL. Prevents double-encoding.
  const decodedSlug = decodeURIComponent(slug);
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/all-agents/${encodeURIComponent(decodedSlug)}/monthly/${START}/${END}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'DeepMaps/1.0 (deep-maps-project; contact@example.com)' },
      });
      if (resp.status === 429 || resp.status >= 500) {
        // Rate limited or server error — retry after delay
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        return { slug, avgMonthlyViews: 0, monthlyViews: [], months: 0 };
      }
      if (!resp.ok) {
        // 404 = article doesn't exist or no pageview data (expected for obscure articles)
        return { slug, avgMonthlyViews: 0, monthlyViews: [], months: 0 };
      }
      const data = await resp.json();
      const items = data.items || [];
      if (items.length === 0) return { slug, avgMonthlyViews: 0, monthlyViews: [], months: 0 };
      const monthlyViews = items.map((i: { views: number }) => i.views);
      const avg = Math.round(monthlyViews.reduce((a: number, b: number) => a + b, 0) / monthlyViews.length);
      return { slug, avgMonthlyViews: avg, monthlyViews, months: monthlyViews.length };
    } catch {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      return { slug, avgMonthlyViews: 0, monthlyViews: [], months: 0 };
    }
  }
  return { slug, avgMonthlyViews: 0, monthlyViews: [], months: 0 };
}

// Batch fetch with rate limiting — conservative to avoid Wikimedia throttling
async function fetchAllPageviews(slugs: string[]): Promise<Map<string, PageviewResult>> {
  const results = new Map<string, PageviewResult>();
  const BATCH_SIZE = 10;
  const DELAY_MS = 500;
  let failCount = 0;

  for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
    const batch = slugs.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(fetchPageviews));
    for (const r of batchResults) {
      results.set(r.slug, r);
      if (r.avgMonthlyViews === 0) failCount++;
    }
    if (i + BATCH_SIZE < slugs.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
    process.stdout.write(`  Fetched ${Math.min(i + BATCH_SIZE, slugs.length)}/${slugs.length} slugs (${failCount} failed)\r`);
  }
  console.log(); // newline after progress
  return results;
}

// ── Wikidata: QID Resolution + Sitelinks ─────────────────────────────

/**
 * Resolve Wikipedia article slugs to Wikidata QIDs via Wikipedia API.
 * Uses action=query&prop=pageprops to get wikibase_item (the QID).
 * Batches up to 50 titles per request.
 */
async function resolveWikipediaToQIDs(slugs: string[]): Promise<Map<string, string>> {
  const slugToQID = new Map<string, string>();
  const BATCH_SIZE = 50;
  const DELAY_MS = 300;

  for (let i = 0; i < slugs.length; i += BATCH_SIZE) {
    const batch = slugs.slice(i, i + BATCH_SIZE);
    // Decode pre-encoded slugs, then join with pipe separator
    const titles = batch.map(s => decodeURIComponent(s).replace(/_/g, ' ')).join('|');
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=pageprops&ppprop=wikibase_item&format=json&formatversion=2`;

    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'DeepMaps/1.0 (deep-maps-project; contact@example.com)' },
      });
      if (resp.ok) {
        const data = await resp.json();
        const pages = data.query?.pages || [];
        for (const page of pages) {
          if (page.pageprops?.wikibase_item) {
            // Map normalized title back to the original slug
            const qid = page.pageprops.wikibase_item;
            // Find which slug this page corresponds to by matching title
            const pageTitle = page.title.replace(/ /g, '_');
            for (const slug of batch) {
              const decodedSlug = decodeURIComponent(slug);
              if (decodedSlug === pageTitle || decodedSlug.replace(/_/g, ' ') === page.title) {
                slugToQID.set(slug, qid);
                break;
              }
            }
            // Also try direct match with the normalized form
            if (!Array.from(slugToQID.values()).includes(qid) || true) {
              // Store by title form too for safety
              slugToQID.set(pageTitle, qid);
            }
          }
        }

        // Handle Wikipedia's normalization: the API may normalize titles
        // (e.g., "jesus" → "Jesus"). Map those back to our original slugs.
        const normalizations = data.query?.normalized || [];
        for (const norm of normalizations) {
          const from = norm.from.replace(/ /g, '_');
          const to = norm.to.replace(/ /g, '_');
          if (slugToQID.has(to) && !slugToQID.has(from)) {
            slugToQID.set(from, slugToQID.get(to)!);
          }
        }
      }
    } catch (err) {
      console.warn(`  ⚠️ QID resolution batch failed at offset ${i}: ${err}`);
    }

    if (i + BATCH_SIZE < slugs.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
    process.stdout.write(`  Resolved QIDs: ${slugToQID.size}/${Math.min(i + BATCH_SIZE, slugs.length)} slugs processed\r`);
  }
  console.log();
  return slugToQID;
}

/**
 * Fetch sitelinks counts from Wikidata for a set of QIDs.
 * Sitelinks = number of Wikipedia language editions covering the topic.
 * High sitelinks = universally significant (Jesus ~300, Ed Gein ~40).
 * Batches up to 50 QIDs per request.
 */
async function fetchSitelinks(qids: string[]): Promise<Map<string, number>> {
  const qidToSitelinks = new Map<string, number>();
  const BATCH_SIZE = 50;
  const DELAY_MS = 300;

  // Deduplicate QIDs
  const uniqueQIDs = Array.from(new Set(qids));

  for (let i = 0; i < uniqueQIDs.length; i += BATCH_SIZE) {
    const batch = uniqueQIDs.slice(i, i + BATCH_SIZE);
    const ids = batch.join('|');
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}&props=sitelinks&format=json`;

    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'DeepMaps/1.0 (deep-maps-project; contact@example.com)' },
      });
      if (resp.ok) {
        const data = await resp.json();
        const fetchedEntities = data.entities || {};
        for (const [qid, entity] of Object.entries(fetchedEntities)) {
          const e = entity as { sitelinks?: Record<string, unknown> };
          if (e.sitelinks) {
            qidToSitelinks.set(qid, Object.keys(e.sitelinks).length);
          }
        }
      }
    } catch (err) {
      console.warn(`  ⚠️ Sitelinks fetch failed at offset ${i}: ${err}`);
    }

    if (i + BATCH_SIZE < uniqueQIDs.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
    process.stdout.write(`  Fetched sitelinks: ${qidToSitelinks.size}/${Math.min(i + BATCH_SIZE, uniqueQIDs.length)} QIDs processed\r`);
  }
  console.log();
  return qidToSitelinks;
}

// ── Coefficient of Variation ─────────────────────────────────────────

/**
 * Compute the coefficient of variation (stddev / mean) from monthly pageview data.
 * Low CV = stable interest (civilizational anchors).
 * High CV = spike-driven (true crime after Netflix, viral moments).
 *
 * Returns 0 for insufficient data (< 3 months).
 */
function computeCV(monthlyViews: number[]): number {
  if (monthlyViews.length < 3) return 0;
  const mean = monthlyViews.reduce((a, b) => a + b, 0) / monthlyViews.length;
  if (mean === 0) return 0;
  const variance = monthlyViews.reduce((sum, v) => sum + (v - mean) ** 2, 0) / monthlyViews.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Convert CV to a stability score (0-100).
 * CV ≤ 0.15 → 100 (rock-solid interest like Jesus, WWII)
 * CV ≥ 0.80 → 0 (extreme spike-driven like Netflix true crime)
 * Linear interpolation between.
 */
function cvToStabilityScore(cv: number): number {
  if (cv <= 0.15) return 100;
  if (cv >= 0.80) return 0;
  return clamp(Math.round(100 * (1 - (cv - 0.15) / 0.65)), 0, 100);
}

// ── Signal Normalization ─────────────────────────────────────────────

/**
 * Convert raw sitelinks count to 0-100 score.
 * Uses log scale since sitelinks range is ~1-350.
 *
 * Calibrated so 300+ sitelinks (Jesus, Shakespeare) → 100.
 * Rationale: 300+ Wikipedia language editions IS the ceiling of
 * human cultural significance. The ruler should reflect that.
 *
 * Tuned so:
 *   300 sitelinks (Jesus, Shakespeare) → 100
 *   150 sitelinks (major historical) → ~82
 *   50 sitelinks (notable) → ~55
 *   15 sitelinks (minor) → ~30
 *   3 sitelinks (obscure) → ~8
 */
function sitelinksToScore(count: number): number {
  if (count <= 0) return 0;
  // log10(300) ≈ 2.48, log10(3) ≈ 0.48
  // Scale: (log10(count) - 0.3) * 46 → maps 3→8, 15→30, 50→55, 150→82, 300→100
  const raw = (Math.log10(count) - 0.3) * 46;
  return clamp(Math.round(raw), 0, 100);
}

// ── Build lookup maps ──────────────────────────────────────────────────

function buildMomentToStoriesMap(): Map<string, typeof stories> {
  const map = new Map<string, typeof stories>();
  for (const story of stories) {
    for (const sm of story.moments) {
      const existing = map.get(sm.momentId) || [];
      existing.push(story);
      map.set(sm.momentId, existing);
    }
  }
  return map;
}

function buildMomentToCollectionsMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (const col of collections) {
    for (const mId of col.momentIds) {
      map.set(mId, (map.get(mId) || 0) + 1);
    }
  }
  return map;
}

function isPrimaryMoment(momentId: string, story: (typeof stories)[0]): boolean {
  // Check for explicit isPrimary flag first
  for (const sm of story.moments) {
    if (sm.isPrimary && sm.momentId === momentId) return true;
    if (sm.isPrimary && sm.momentId !== momentId) return false;
  }
  // Default: first moment in array is primary
  return story.moments.length > 0 && story.moments[0].momentId === momentId;
}

// Find the best Wikipedia slug for a moment by comparing ALL available slugs
// (from parent stories AND linked entities) and returning the one with the
// highest pageviews. This avoids the trap where a story has a niche slug
// like "Ministry_of_Jesus" (12K views) when the entity "Jesus" has 416K views.
function getSlugForMoment(
  momentId: string,
  momentToStories: Map<string, typeof stories>,
  entityMap: Map<string, (typeof entities)[0]>,
  moment: (typeof moments)[0],
  pageviews: Map<string, PageviewResult>
): string | null {
  let bestSlug: string | null = null;
  let bestViews = -1;

  // Check parent story slugs
  const parentStories = momentToStories.get(momentId) || [];
  for (const story of parentStories) {
    if (story.wikipediaSlug) {
      const pv = pageviews.get(story.wikipediaSlug);
      if (pv && pv.avgMonthlyViews > bestViews) {
        bestViews = pv.avgMonthlyViews;
        bestSlug = story.wikipediaSlug;
      }
    }
  }

  // Check linked entity slugs — may beat story slugs
  if (moment.entityIds) {
    for (const eid of moment.entityIds) {
      const entity = entityMap.get(eid);
      if (entity?.wikipediaSlug) {
        const pv = pageviews.get(entity.wikipediaSlug);
        if (pv && pv.avgMonthlyViews > bestViews) {
          bestViews = pv.avgMonthlyViews;
          bestSlug = entity.wikipediaSlug;
        }
      }
    }
  }

  return bestSlug;
}

// Cross-reference density score for moments without Wikipedia
function getCrossRefScore(
  momentId: string,
  moment: (typeof moments)[0],
  momentToStories: Map<string, typeof stories>,
  momentToCollections: Map<string, number>
): number {
  const storyCount = (momentToStories.get(momentId) || []).length;
  const entityCount = (moment.entityIds || []).length;
  const collectionCount = momentToCollections.get(momentId) || 0;

  // Base from importance
  let base: number;
  switch (moment.importance) {
    case 'major': base = 35; break;
    case 'minor': base = 25; break;
    case 'contextual': base = 15; break;
    default: base = 20;
  }

  return clamp(base + storyCount * 3 + entityCount * 2 + collectionCount * 4, MIN_SCORE, 70);
}

// ── Surprise factor (v0.3) ────────────────────────────────────────────

// Keywords that indicate the original structure is gone or transformed
const STRUCTURE_GONE_KEYWORDS = [
  'demolished', 'torn down', 'parking lot', 'now a ', 'no longer',
  'replaced by', 'nothing remains', 'was torn', 'site is now',
  'building is gone', 'has since been', 'was later replaced',
  'no trace', 'long gone', 'razed',
];
const STRUCTURE_STANDS_KEYWORDS = [
  'still stands', 'still in use', 'still open', 'still operates',
  'still carries', 'still serves', 'now a museum', 'now houses',
  'is now a', 'still intact',
];

// Moment types that are "dramatic" when found at mundane locations
const DRAMATIC_TYPES = new Set([
  'political_event', 'crime_scene', 'battlefield', 'execution_site',
]);
const MUNDANE_TYPES = new Set([
  'residence', 'institution', 'cultural_site', 'landmark',
]);

function computeSurpriseScore(
  moment: (typeof moments)[0],
  sitelinksScore: number,
  pvScore: number
): { surprise: number; gap: number; structure: number; typeMismatch: number } {
  // 1. Obscurity-Significance Gap (60% of surprise)
  // High sitelinks + low pageviews = historically significant but not commonly known
  const rawGap = sitelinksScore - pvScore;
  // Normalize: gap of +50 → 100, gap of -50 → 0, gap of 0 → 50
  const gapScore = clamp(Math.round((rawGap + 50) / 100 * 100), 0, 100);

  // 2. Structure-Gone Bonus (25% of surprise)
  const subtitle = (moment.subtitle || '').toLowerCase();
  const description = (moment.description || '').toLowerCase();
  const text = subtitle + ' ' + description;
  let structureScore: number;
  if (STRUCTURE_GONE_KEYWORDS.some(kw => text.includes(kw))) {
    structureScore = 80;
  } else if (STRUCTURE_STANDS_KEYWORDS.some(kw => text.includes(kw))) {
    structureScore = 20;
  } else {
    structureScore = 40;
  }

  // 3. Type Mismatch Bonus (15% of surprise)
  let typeScore = 30; // default
  if (DRAMATIC_TYPES.has(moment.type)) {
    // Dramatic event type gets a bonus
    typeScore = 60;
  }
  // Extra bonus if moment has content warning (implies dramatic content)
  // Note: contentWarning lives on stories, not moments — check if this moment's
  // parent story has one. For now, use type as proxy.
  if (moment.type === 'crime_scene' || moment.type === 'execution_site' || moment.type === 'battlefield') {
    typeScore = 70;
  }

  const surprise = Math.round(
    gapScore * 0.60 +
    structureScore * 0.25 +
    typeScore * 0.15
  );

  return { surprise: clamp(surprise, 0, 100), gap: gapScore, structure: structureScore, typeMismatch: typeScore };
}

// ── Validation: flag primary moment mismatches ─────────────────────────

interface PrimaryMismatch {
  storyId: string;
  storyName: string;
  firstMomentId: string;
  firstMomentImportance: string;
  suggestedMomentId: string;
  suggestedMomentImportance: string;
}

function findPrimaryMismatches(): PrimaryMismatch[] {
  const momentMap = new Map(moments.map(m => [m.id, m]));
  const mismatches: PrimaryMismatch[] = [];

  for (const story of stories) {
    if (story.moments.length < 2) continue;
    // Skip if any moment has explicit isPrimary
    if (story.moments.some(sm => sm.isPrimary)) continue;

    const firstMoment = momentMap.get(story.moments[0].momentId);
    if (!firstMoment) continue;

    // Check if any later moment has higher importance
    if (firstMoment.importance === 'contextual' || firstMoment.importance === 'minor') {
      const majorMoment = story.moments.find((sm, i) => {
        if (i === 0) return false;
        const m = momentMap.get(sm.momentId);
        return m && m.importance === 'major';
      });
      if (majorMoment) {
        const suggested = momentMap.get(majorMoment.momentId);
        if (suggested) {
          mismatches.push({
            storyId: story.id,
            storyName: story.name,
            firstMomentId: firstMoment.id,
            firstMomentImportance: firstMoment.importance,
            suggestedMomentId: suggested.id,
            suggestedMomentImportance: suggested.importance,
          });
        }
      }
    }
  }

  return mismatches;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('Deep Maps — Notability Scoring Script');
  console.log('=====================================\n');

  // Load manual overrides
  let overrides: Record<string, number> = {};
  if (fs.existsSync(OVERRIDES_PATH)) {
    overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf-8'));
    console.log(`Loaded ${Object.keys(overrides).length} manual overrides from overrides.json`);
  }

  // 1. Collect all unique Wikipedia slugs
  console.log('\n1. Collecting Wikipedia slugs...');
  const slugSet = new Set<string>();
  for (const story of stories) {
    if (story.wikipediaSlug) slugSet.add(story.wikipediaSlug);
  }
  for (const entity of entities) {
    if (entity.wikipediaSlug) slugSet.add(entity.wikipediaSlug);
  }
  const uniqueSlugs = Array.from(slugSet);
  console.log(`   Found ${uniqueSlugs.length} unique slugs (${stories.filter(s => s.wikipediaSlug).length} stories, ${entities.filter(e => e.wikipediaSlug).length} entities)`);

  // 2. Fetch pageviews
  console.log('\n2. Fetching Wikipedia pageviews...');
  const pageviews = await fetchAllPageviews(uniqueSlugs);
  const successCount = Array.from(pageviews.values()).filter(pv => pv.avgMonthlyViews > 0).length;
  console.log(`   Got data for ${successCount}/${uniqueSlugs.length} slugs`);

  // 3. Resolve Wikipedia slugs to Wikidata QIDs
  console.log('\n3. Resolving Wikipedia slugs to Wikidata QIDs...');
  const slugsWithData = uniqueSlugs.filter(s => {
    const pv = pageviews.get(s);
    return pv && pv.avgMonthlyViews > 0;
  });
  const slugToQID = await resolveWikipediaToQIDs(slugsWithData);
  console.log(`   Resolved ${slugToQID.size} QIDs from ${slugsWithData.length} slugs`);

  // 4. Fetch sitelinks from Wikidata
  console.log('\n4. Fetching Wikidata sitelinks...');
  const allQIDs = Array.from(new Set(slugToQID.values()));
  const qidToSitelinks = await fetchSitelinks(allQIDs);
  console.log(`   Got sitelinks for ${qidToSitelinks.size}/${allQIDs.length} QIDs`);

  // Build slug→sitelinks convenience map
  const slugToSitelinks = new Map<string, number>();
  const slugToQIDResolved = new Map<string, string>(); // track which QID each slug uses
  for (const [slug, qid] of slugToQID.entries()) {
    const count = qidToSitelinks.get(qid);
    if (count !== undefined) {
      slugToSitelinks.set(slug, count);
      slugToQIDResolved.set(slug, qid);
    }
  }

  // 5. Build lookup maps
  console.log('\n5. Building lookup maps...');
  const momentToStories = buildMomentToStoriesMap();
  const momentToCollections = buildMomentToCollectionsMap();
  const entityMap = new Map(entities.map(e => [e.id, e]));

  // 6. Score each moment with composite formula
  console.log('\n6. Scoring moments (composite: sitelinks×0.45 + pageviews×0.35 + crossRef×0.20 [surprise tracked but not in formula])...');
  const scoreBreakdowns: ScoreBreakdown[] = [];

  for (const moment of moments) {
    // Determine primary status first (used by both override and computed paths)
    const parentStories = momentToStories.get(moment.id) || [];
    let bestParentStory = parentStories[0] || null;
    let primary = bestParentStory ? isPrimaryMoment(moment.id, bestParentStory) : true;
    for (const ps of parentStories) {
      if (isPrimaryMoment(moment.id, ps)) {
        primary = true;
        bestParentStory = ps;
        break;
      }
    }

    // Check manual override first
    if (overrides[moment.id] != null) {
      scoreBreakdowns.push({
        momentId: moment.id,
        momentName: moment.name,
        effectiveScore: overrides[moment.id],
        oldScore: 0,
        isPrimary: primary,
        parentStoryId: bestParentStory?.id || null,
        parentStoryName: bestParentStory?.name || null,
        signals: {
          sitelinks: 0,
          sitelinksRaw: 0,
          pageviews: 0,
          stability: 0,
          cv: 0,
          crossRefDensity: 0,
          manualOverride: overrides[moment.id],
        },
        sourceSlug: null,
        sourceQID: null,
        avgMonthlyViews: 0,
        category: bestParentStory?.category || null,
        scoreVersion: SCORE_VERSION,
      });
      continue;
    }

    // Find best slug for this moment
    const slug = getSlugForMoment(moment.id, momentToStories, entityMap, moment, pageviews);

    // Gather raw signals
    const pv = slug ? pageviews.get(slug) : null;
    const pvViews = pv?.avgMonthlyViews || 0;
    const monthlyViews = pv?.monthlyViews || [];
    const sitelinksRaw = slug ? (slugToSitelinks.get(slug) || 0) : 0;
    const qid = slug ? (slugToQIDResolved.get(slug) || null) : null;
    const crossRef = getCrossRefScore(moment.id, moment, momentToStories, momentToCollections);

    // Compute individual signal scores (all on 0-100 scale)
    const pvScore = pvViews > 0 ? pageviewsToScore(pvViews) : 0;
    const sitelinksScore = sitelinksRaw > 0 ? sitelinksToScore(sitelinksRaw) : 0;
    const cv = monthlyViews.length >= 3 ? computeCV(monthlyViews) : 0;
    const stabilityScore = monthlyViews.length >= 3 ? cvToStabilityScore(cv) : 50; // default 50 for no data

    // Compute old-style v0.1 score for comparison
    let oldScore: number;
    if (pvViews > 0) {
      oldScore = pvScore;
      // Add old cross-ref bonus
      const oldCrossRefBonus = Math.min(5, Math.round(crossRef / 10));
      oldScore = clamp(oldScore + oldCrossRefBonus, MIN_SCORE, MAX_SCORE);
    } else {
      oldScore = crossRef;
    }
    // Apply primary multiplier for old score
    if (!primary) {
      oldScore = clamp(Math.round(oldScore * SUPPORTING_MULTIPLIER), MIN_SCORE, MAX_SCORE);
    }

    // v0.3: Compute surprise factor
    const { surprise: surpriseScore, gap: surpriseGap, structure: surpriseStructure, typeMismatch: surpriseType } =
      computeSurpriseScore(moment, sitelinksScore, pvScore);

    // Composite score: weighted blend of all signals
    // CV is tracked as diagnostic only — not in the formula
    // (legitimate topics spike for good reasons: Jesus at Easter, Einstein at anniversaries)
    let baseScore: number;
    if (pvViews > 0 || sitelinksRaw > 0) {
      // We have at least some Wikipedia/Wikidata data
      baseScore = Math.round(
        sitelinksScore * WEIGHT_SITELINKS +
        pvScore * WEIGHT_PAGEVIEWS +
        crossRef * WEIGHT_CROSSREF
        // surpriseScore tracked in signals but not in formula until weights are tuned
      );
    } else {
      // No Wikipedia/Wikidata data at all — fall back to cross-ref density only
      baseScore = crossRef;
    }
    baseScore = clamp(baseScore, MIN_SCORE, MAX_SCORE);

    // Apply primary moment multiplier
    const effectiveScore = primary
      ? baseScore
      : clamp(Math.round(baseScore * SUPPORTING_MULTIPLIER), MIN_SCORE, MAX_SCORE);

    scoreBreakdowns.push({
      momentId: moment.id,
      momentName: moment.name,
      effectiveScore,
      oldScore,
      isPrimary: primary,
      parentStoryId: bestParentStory?.id || null,
      parentStoryName: bestParentStory?.name || null,
      signals: {
        sitelinks: sitelinksScore,
        sitelinksRaw,
        pageviews: pvScore,
        stability: stabilityScore,
        cv: Math.round(cv * 1000) / 1000,  // 3 decimal places
        crossRefDensity: crossRef,
        surprise: surpriseScore,
        surpriseGap,
        surpriseStructure,
        surpriseType,
        manualOverride: null,
      },
      sourceSlug: slug,
      sourceQID: qid,
      avgMonthlyViews: pvViews,
      category: bestParentStory?.category || null,
      scoreVersion: SCORE_VERSION,
    });
  }

  // Sort by effective score descending
  scoreBreakdowns.sort((a, b) => b.effectiveScore - a.effectiveScore || a.momentName.localeCompare(b.momentName));

  // 7. Validate primary moment choices
  console.log('\n7. Validating primary moment choices...');
  const mismatches = findPrimaryMismatches();

  // 8. Generate outputs
  console.log('\n8. Generating outputs...');

  // Tier boundaries
  // Tier thresholds calibrated to v0.2 distribution.
  // Natural composite ceiling is ~88 (no moment maxes all 3 signals).
  // Thresholds shifted to match the actual data distribution (Tufte principle).
  const tiers = [
    { name: 'S', min: 82, max: 100, label: 'World zoom — civilizational anchors' },
    { name: 'A', min: 65, max: 81, label: 'Continental zoom — globally significant' },
    { name: 'B', min: 45, max: 64, label: 'Country zoom — nationally significant' },
    { name: 'C', min: 25, max: 44, label: 'Regional zoom — locally notable' },
    { name: 'D', min: 5, max: 24, label: 'City/local zoom — deep cuts' },
    { name: 'ARCHIVE', min: 0, max: 4, label: 'Deep Archive — review for buried gems' },
  ];

  // Generate markdown
  let md = '# Deep Maps — Notability Scores (Multi-Signal Composite v0.2)\n\n';
  md += `Generated: ${new Date().toISOString()}\n`;
  md += `Score version: ${SCORE_VERSION}\n`;
  md += `Composite formula: sitelinks×${WEIGHT_SITELINKS} + pageviews×${WEIGHT_PAGEVIEWS} + crossRef×${WEIGHT_CROSSREF}\n`;
  md += `Total moments: ${scoreBreakdowns.length}\n`;
  md += `Primary moments: ${scoreBreakdowns.filter(s => s.isPrimary).length}\n`;
  md += `Supporting moments: ${scoreBreakdowns.filter(s => !s.isPrimary).length}\n`;
  md += `Sitelinks data: ${scoreBreakdowns.filter(s => s.signals.sitelinksRaw > 0).length} moments\n`;
  md += `Stability data (CV): ${scoreBreakdowns.filter(s => s.signals.cv > 0).length} moments\n\n`;

  // Summary stats
  md += '## Distribution\n\n';
  md += '| Tier | Score Range | Count | % |\n';
  md += '|------|-----------|-------|---|\n';
  for (const tier of tiers) {
    const count = scoreBreakdowns.filter(s => s.effectiveScore >= tier.min && s.effectiveScore <= tier.max).length;
    const pct = ((count / scoreBreakdowns.length) * 100).toFixed(1);
    md += `| ${tier.name} | ${tier.min}-${tier.max} | ${count} | ${pct}% |\n`;
  }

  // Category breakdown
  md += '\n## Category Breakdown\n\n';
  md += '| Category | Count | Avg Score | Top Moment |\n';
  md += '|----------|-------|-----------|------------|\n';
  const categories = new Map<string, ScoreBreakdown[]>();
  for (const sb of scoreBreakdowns) {
    const cat = sb.category || 'uncategorized';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(sb);
  }
  for (const [cat, items] of Array.from(categories.entries()).sort()) {
    const avgScore = Math.round(items.reduce((sum, i) => sum + i.effectiveScore, 0) / items.length);
    const top = items[0];
    md += `| ${cat} | ${items.length} | ${avgScore} | ${top.momentName.slice(0, 60)} |\n`;
  }

  // Primary moment mismatches
  if (mismatches.length > 0) {
    md += '\n## ⚠️ Primary Moment Mismatches\n\n';
    md += 'These stories have their first moment at lower importance than a later moment.\n';
    md += 'Consider adding `isPrimary: true` to the suggested moment.\n\n';
    md += '| Story | First Moment (current primary) | Importance | Suggested Primary | Importance |\n';
    md += '|-------|-------------------------------|------------|-------------------|------------|\n';
    for (const mm of mismatches) {
      md += `| ${mm.storyName} | \`${mm.firstMomentId}\` | ${mm.firstMomentImportance} | \`${mm.suggestedMomentId}\` | ${mm.suggestedMomentImportance} |\n`;
    }
  }

  // Score movement analysis (v0.1 → v0.2)
  md += '\n## 🔄 Score Movement (v0.1 → v0.2)\n\n';
  md += 'Top 30 moments with biggest score changes:\n\n';
  md += '| Moment | Old (v0.1) | New (v0.2) | Δ | Sitelinks | PV | Stability | CV | Why |\n';
  md += '|--------|-----------|-----------|---|-----------|----|-----------|----|-----|\n';

  const movements = scoreBreakdowns
    .filter(s => s.oldScore > 0)
    .map(s => ({ ...s, delta: s.effectiveScore - s.oldScore }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  for (const m of movements.slice(0, 30)) {
    const arrow = m.delta > 0 ? '↑' : m.delta < 0 ? '↓' : '→';
    const reason = m.delta < -10 ? 'low sitelinks' :
                   m.delta > 10 ? 'high sitelinks' :
                   m.delta < -5 ? 'spike traffic' :
                   m.delta > 5 ? 'stable+universal' : 'similar';
    md += `| ${m.momentName.slice(0, 50)} | ${m.oldScore} | ${m.effectiveScore} | ${arrow}${Math.abs(m.delta)} | ${m.signals.sitelinksRaw} (${m.signals.sitelinks}) | ${m.signals.pageviews} | ${m.signals.stability} | ${m.signals.cv} | ${reason} |\n`;
  }

  // Top 30 comparison table
  md += '\n## 🏆 Top 30 Comparison (v0.1 vs v0.2)\n\n';
  md += '| # | v0.2 Score | v0.1 Score | Δ | Moment | Sitelinks | Category |\n';
  md += '|---|-----------|-----------|---|--------|-----------|----------|\n';
  for (let i = 0; i < Math.min(30, scoreBreakdowns.length); i++) {
    const sb = scoreBreakdowns[i];
    const delta = sb.effectiveScore - sb.oldScore;
    const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
    md += `| ${i + 1} | **${sb.effectiveScore}** | ${sb.oldScore} | ${deltaStr} | ${sb.momentName.slice(0, 55)} | ${sb.signals.sitelinksRaw} | ${sb.category || '-'} |\n`;
  }

  // Tiered listing
  for (const tier of tiers) {
    const tierMoments = scoreBreakdowns.filter(
      s => s.effectiveScore >= tier.min && s.effectiveScore <= tier.max
    );
    if (tierMoments.length === 0) continue;

    md += `\n## TIER ${tier.name} (${tier.min}-${tier.max}) — ${tier.label}\n\n`;
    md += `${tierMoments.length} moments\n\n`;

    for (const sb of tierMoments) {
      const primaryTag = sb.isPrimary ? '★' : '○';
      const views = sb.avgMonthlyViews > 0 ? ` (${sb.avgMonthlyViews.toLocaleString()} views/mo)` : '';
      const cat = sb.category ? ` [${sb.category}]` : '';
      const sitelinksInfo = sb.signals.sitelinksRaw > 0 ? ` [SL:${sb.signals.sitelinksRaw}]` : '';
      const delta = sb.effectiveScore - sb.oldScore;
      const deltaStr = delta !== 0 ? ` (${delta > 0 ? '+' : ''}${delta} from v0.1)` : '';
      md += `${primaryTag} **${sb.effectiveScore}** \`${sb.momentId}\` — "${sb.momentName.slice(0, 80)}"${views}${sitelinksInfo}${cat}${deltaStr}\n`;
      if (sb.signals.manualOverride !== null) {
        md += `  ↳ Manual override: ${sb.signals.manualOverride}\n`;
      }
    }
  }

  // Signal diagnostics
  md += '\n## 📊 Signal Diagnostics\n\n';
  md += '### Sitelinks Distribution\n';
  const sitelinksRanges = [
    { label: '200+', min: 200, count: 0 },
    { label: '100-199', min: 100, count: 0 },
    { label: '50-99', min: 50, count: 0 },
    { label: '20-49', min: 20, count: 0 },
    { label: '1-19', min: 1, count: 0 },
    { label: '0 (no data)', min: 0, count: 0 },
  ];
  for (const sb of scoreBreakdowns) {
    const sl = sb.signals.sitelinksRaw;
    if (sl >= 200) sitelinksRanges[0].count++;
    else if (sl >= 100) sitelinksRanges[1].count++;
    else if (sl >= 50) sitelinksRanges[2].count++;
    else if (sl >= 20) sitelinksRanges[3].count++;
    else if (sl >= 1) sitelinksRanges[4].count++;
    else sitelinksRanges[5].count++;
  }
  md += '| Range | Count |\n|-------|-------|\n';
  for (const r of sitelinksRanges) {
    md += `| ${r.label} | ${r.count} |\n`;
  }

  md += '\n### Stability (CV) Distribution\n';
  md += '| CV Range | Meaning | Count |\n|----------|---------|-------|\n';
  const cvLow = scoreBreakdowns.filter(s => s.signals.cv > 0 && s.signals.cv <= 0.2).length;
  const cvMed = scoreBreakdowns.filter(s => s.signals.cv > 0.2 && s.signals.cv <= 0.5).length;
  const cvHigh = scoreBreakdowns.filter(s => s.signals.cv > 0.5 && s.signals.cv <= 0.8).length;
  const cvExtreme = scoreBreakdowns.filter(s => s.signals.cv > 0.8).length;
  const cvNone = scoreBreakdowns.filter(s => s.signals.cv === 0).length;
  md += `| 0-0.2 | Rock solid | ${cvLow} |\n`;
  md += `| 0.2-0.5 | Normal variation | ${cvMed} |\n`;
  md += `| 0.5-0.8 | Spike-influenced | ${cvHigh} |\n`;
  md += `| 0.8+ | Extreme spikes | ${cvExtreme} |\n`;
  md += `| N/A | No monthly data | ${cvNone} |\n`;

  md += '\n### True Crime Bias Correction Check\n\n';
  md += 'How did the composite score correct true crime inflation?\n\n';
  md += '| Moment | Pageviews/mo | PV Score | Sitelinks | SL Score | CV | Stability | Old Score | New Score | Δ |\n';
  md += '|--------|-------------|----------|-----------|----------|-----|-----------|-----------|-----------|---|\n';
  const biasCheckIds = [
    'gein-school', 'gein-farmhouse', 'dahmer-apartment', 'bundy-sorority-house',
    'zodiac-presidio-heights', 'jfk-dealey-plaza', 'normandy-dday',
    'jesus-sermon-mount', 'gutenberg-printing-press', 'hiroshima-bombing',
    'cleopatra-suicide-alexandria', 'gandhi-dandi-march',
  ];
  for (const id of biasCheckIds) {
    const sb = scoreBreakdowns.find(s => s.momentId === id);
    if (sb) {
      const delta = sb.effectiveScore - sb.oldScore;
      md += `| ${sb.momentName.slice(0, 45)} | ${sb.avgMonthlyViews.toLocaleString()} | ${sb.signals.pageviews} | ${sb.signals.sitelinksRaw} | ${sb.signals.sitelinks} | ${sb.signals.cv} | ${sb.signals.stability} | ${sb.oldScore} | ${sb.effectiveScore} | ${delta > 0 ? '+' : ''}${delta} |\n`;
    }
  }
  md += '\n';

  // Write outputs
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'notability-scores.md'), md);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'notability-scores.json'),
    JSON.stringify(scoreBreakdowns, null, 2)
  );

  // Create empty overrides.json if it doesn't exist
  if (!fs.existsSync(OVERRIDES_PATH)) {
    fs.writeFileSync(OVERRIDES_PATH, '{}');
  }

  console.log(`\n✅ Done!`);
  console.log(`   ${scoreBreakdowns.length} moments scored (composite v0.2)`);
  console.log(`   ${scoreBreakdowns.filter(s => s.isPrimary).length} primary, ${scoreBreakdowns.filter(s => !s.isPrimary).length} supporting`);
  console.log(`   ${scoreBreakdowns.filter(s => s.signals.sitelinksRaw > 0).length} with sitelinks data`);
  console.log(`   ${mismatches.length} primary moment mismatches flagged`);
  console.log(`\n📄 Output files:`);
  console.log(`   scripts/output/notability-scores.md   (human review)`);
  console.log(`   scripts/output/notability-scores.json (machine-readable)`);
  console.log(`   scripts/output/overrides.json         (manual overrides)`);

  // Print quick summary
  console.log('\n📊 Quick Distribution:');
  for (const tier of tiers) {
    const count = scoreBreakdowns.filter(s => s.effectiveScore >= tier.min && s.effectiveScore <= tier.max).length;
    if (count === 0) continue;
    const bar = '█'.repeat(Math.ceil(count / 10));
    console.log(`   Tier ${tier.name} (${tier.min}-${tier.max}): ${String(count).padStart(4)} ${bar}`);
  }

  // Print top 30 with signal breakdown
  console.log('\n🏆 Top 30 Moments (v0.2 composite):');
  console.log('   Score  Old   Δ   SL   PV  XRef  Moment');
  console.log('   ─────  ───  ───  ───  ───  ────  ──────');
  for (const sb of scoreBreakdowns.slice(0, 30)) {
    const primaryTag = sb.isPrimary ? '★' : '○';
    const delta = sb.effectiveScore - sb.oldScore;
    const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
    console.log(
      `   ${primaryTag}${String(sb.effectiveScore).padStart(3)}  ${String(sb.oldScore).padStart(3)}  ${deltaStr.padStart(3)}  ` +
      `${String(sb.signals.sitelinksRaw).padStart(3)}  ${String(sb.signals.pageviews).padStart(3)}  ` +
      `${String(sb.signals.crossRefDensity).padStart(4)}  "${sb.momentName.slice(0, 50)}"`
    );
  }

  // Print biggest movers (true crime should drop, civilizational anchors should rise)
  console.log('\n🔄 Biggest Score Drops (true crime correction?):');
  const bigDrops = scoreBreakdowns
    .filter(s => s.oldScore > 0)
    .sort((a, b) => (a.effectiveScore - a.oldScore) - (b.effectiveScore - b.oldScore));
  for (const sb of bigDrops.slice(0, 10)) {
    const delta = sb.effectiveScore - sb.oldScore;
    console.log(`   ${delta > 0 ? '+' : ''}${delta}  ${sb.momentId.padEnd(40)} (SL:${sb.signals.sitelinksRaw} CV:${sb.signals.cv})`);
  }

  console.log('\n📈 Biggest Score Rises (civilizational anchors?):');
  const bigRises = scoreBreakdowns
    .filter(s => s.oldScore > 0)
    .sort((a, b) => (b.effectiveScore - b.oldScore) - (a.effectiveScore - a.oldScore));
  for (const sb of bigRises.slice(0, 10)) {
    const delta = sb.effectiveScore - sb.oldScore;
    console.log(`   ${delta > 0 ? '+' : ''}${delta}  ${sb.momentId.padEnd(40)} (SL:${sb.signals.sitelinksRaw} CV:${sb.signals.cv})`);
  }

  // Print bottom 10 (Deep Archive)
  const archived = scoreBreakdowns.filter(s => s.effectiveScore < 20);
  if (archived.length > 0) {
    console.log(`\n📦 Deep Archive (score < 20): ${archived.length} moments`);
    for (const sb of archived.slice(0, 10)) {
      console.log(`   ${String(sb.effectiveScore).padStart(3)}  ${sb.momentId.padEnd(40)} "${sb.momentName.slice(0, 55)}"`);
    }
    if (archived.length > 10) {
      console.log(`   ... and ${archived.length - 10} more (see notability-scores.md)`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
