#!/usr/bin/env npx tsx
/**
 * Deep Maps — Notable People Ingestion Pipeline
 *
 * Selects top notable people from the Laouenan et al. dataset (2.29M people),
 * generates biography moments via Claude API, validates against content guide,
 * and inserts into the review queue for human approval.
 *
 * Usage:
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   npx tsx scripts/ingest/notable-people.ts --limit 3         # test with 3 people
 *   npx tsx scripts/ingest/notable-people.ts --limit 20        # first batch
 *   npx tsx scripts/ingest/notable-people.ts                   # full 200
 *
 * Options:
 *   --limit N        Process only N people (for testing)
 *   --offset N       Skip first N people
 *   --dry-run        Generate but don't insert into review queue
 *   --continent X    Only process people from continent X
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchWikipediaFullText,
  fetchPageviews,
  estimateNotability,
  validateMoment,
  validateEntity,
  validateStory,
  createIngestionRun,
  updateIngestionRun,
  insertToReviewQueue,
  toKebabCase,
  deriveWikipediaSlug,
  searchCommonsImage,
  validateImageUrl,
  fetchWikipediaMainImage,
  buildImageSearchQuery,
  checkExistingPerson,
  type ReviewQueueItem,
  type ExistingPersonData,
} from './lib/pipeline.js';
import { generateJSON } from './lib/llm-client.js';
import {
  CONTENT_GUIDE_SYSTEM_PROMPT,
  BIOGRAPHY_GENERATION_PROMPT,
} from './lib/content-guide-prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── CLI Args ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const LIMIT = getArg('limit') ? parseInt(getArg('limit')!, 10) : 200;
const OFFSET = getArg('offset') ? parseInt(getArg('offset')!, 10) : 0;
const DRY_RUN = hasFlag('dry-run');
const CONTINENT_FILTER = getArg('continent');

// ── Dataset Loading ──────────────────────────────────────────────────

interface NotablePerson {
  name: string;
  birthYear: number;
  deathYear?: number;
  birthLat: number;
  birthLng: number;
  occupation: string;
  notabilityRank: number;
  continent: string;
  wikipediaSlug?: string;
  deepMapsScore?: number;
}

/** Entry shape in data/top-people.json (output of build-top-people.ts) */
interface TopPersonEntry {
  rank: number;
  deepMapsScore: number;
  datasetRank: number;
  wikidataCode: string;
  name: string;
  birthYear: number;
  deathYear: number | null;
  gender: string;
  occupation: string;
  occupationDetail: string;
  category: string;
  continent: string;
  citizenship: string;
  birthLat: number;
  birthLng: number;
  deathLat: number | null;
  deathLng: number | null;
  wikiReaders: number;
  numWikiEditions: number;
  sumVisibLn: number;
  wikipediaSlug: string;
}

/**
 * Load the ranked notable people dataset.
 *
 * Primary source: data/top-people.json (507 people, scored and ranked by
 * build-top-people.ts from the 2.29M Laouenan et al. dataset).
 *
 * Fallback: curated SEED_PEOPLE list of ~50 people (for when JSON hasn't been built).
 */
function loadDataset(): NotablePerson[] {
  const jsonPath = path.resolve(__dirname, '../../data/top-people.json');

  if (fs.existsSync(jsonPath)) {
    console.log(`📂 Loading ranked dataset from ${jsonPath}`);
    const raw: TopPersonEntry[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const people: NotablePerson[] = raw.map(p => ({
      name: p.name,
      birthYear: p.birthYear,
      deathYear: p.deathYear ?? undefined,
      birthLat: p.birthLat,
      birthLng: p.birthLng,
      occupation: p.occupationDetail || p.occupation,
      notabilityRank: p.rank,
      continent: p.continent,
      wikipediaSlug: p.wikipediaSlug,
      deepMapsScore: p.deepMapsScore,
    }));
    console.log(`  Loaded ${people.length} people (pre-ranked by Deep Maps score)`);
    return people;
  }

  // Fallback: curated seed list
  console.log('📂 Using curated seed list (data/top-people.json not found)');
  console.log(`  Build it: npx tsx scripts/ingest/build-top-people.ts`);
  return SEED_PEOPLE;
}

/**
 * Select people for processing.
 *
 * When using top-people.json, the list is already ranked with geographic/temporal
 * diversity floors applied by build-top-people.ts. Just slice by offset/limit.
 *
 * When using SEED_PEOPLE fallback, sort by notabilityRank (hand-assigned).
 */
function selectPeople(allPeople: NotablePerson[], limit: number, offset: number): NotablePerson[] {
  // Already sorted by rank from top-people.json or SEED_PEOPLE
  const sorted = [...allPeople].sort((a, b) => a.notabilityRank - b.notabilityRank);
  const result = sorted.slice(offset, offset + limit);

  // Log continent distribution
  const distrib = new Map<string, number>();
  for (const p of result) {
    distrib.set(p.continent, (distrib.get(p.continent) || 0) + 1);
  }
  console.log(`\n🌍 Geographic distribution:`);
  for (const [cont, count] of [...distrib].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cont}: ${count}`);
  }

  return result;
}

// ── LLM Content Generation ──────────────────────────────────────────

interface GeneratedContent {
  entity: {
    id: string;
    name: string;
    type: string;
    years: string;
    description: string;
    wikipediaSlug: string;
    canonicalStoryId: string;
  };
  story: {
    id: string;
    name: string;
    years: string;
    category: string;
    storyType: string;
    description: string;
    tags: string[];
    wikipediaSlug: string;
    relatedStoryIds: string[];
  };
  moments: Array<{
    id: string;
    name: string;
    subtitle: string;
    description: string;
    lat: number;
    lng: number;
    type: string;
    importance: string;
    accuracy: string;
    kind: string;
    year: number;
    date?: string;
    address?: string;
    entityIds: string[];
    verificationLevel: string;
    wikiSection?: string;
    media?: Array<{ type: string; url: string; caption?: string }>;
  }>;
  suggestedCollections: string[];
}

async function generatePersonContent(
  person: NotablePerson,
  wikiText: string,
  existing?: ExistingPersonData,
): Promise<GeneratedContent | null> {
  const years = person.deathYear
    ? `${person.birthYear}–${person.deathYear}`
    : `${person.birthYear}–present`;

  let prompt = BIOGRAPHY_GENERATION_PROMPT
    .replace('{name}', person.name)
    .replace('{years}', years)
    .replace('{occupation}', person.occupation)
    .replace('{birthLat}', String(person.birthLat))
    .replace('{birthLng}', String(person.birthLng))
    .replace('{wikiText}', wikiText.slice(0, 12000)); // truncate to fit context

  // If existing data found, add dedup context to prompt
  if (existing) {
    const dedupContext = [
      `\n\nIMPORTANT — DEDUPLICATION CONTEXT:`,
      `This person already exists in our database. You must:`,
      `1. Use entity ID: "${existing.entityId}" (do NOT create a new entity ID)`,
      existing.storyId ? `2. Use story ID: "${existing.storyId}" (do NOT create a new story ID)` : `2. Create a new biography story.`,
      `3. Do NOT generate moments that duplicate these existing moments:`,
      ...existing.existingMomentNames.map(n => `   - ${n}`),
      `4. Generate ONLY new moments covering events/locations NOT already in the list above.`,
      `5. Still generate the entity and story objects (we need them for validation), but use the existing IDs.`,
    ];
    prompt += dedupContext.join('\n');
  }

  try {
    const result = await generateJSON<GeneratedContent>({
      system: CONTENT_GUIDE_SYSTEM_PROMPT,
      prompt,
      maxTokens: 8192,
      temperature: 0.3,
    });
    return result;
  } catch (err) {
    console.error(`  ❌ LLM generation failed for ${person.name}:`, err);
    return null;
  }
}

// ── Main Pipeline ────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Deep Maps — Notable People Ingestion Pipeline');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Limit: ${LIMIT} | Offset: ${OFFSET} | Dry run: ${DRY_RUN}`);
  if (CONTINENT_FILTER) console.log(`  Continent filter: ${CONTINENT_FILTER}`);
  console.log('');

  // 1. Load and select people
  let allPeople = loadDataset();
  if (CONTINENT_FILTER) {
    allPeople = allPeople.filter(p =>
      p.continent.toLowerCase() === CONTINENT_FILTER.toLowerCase()
    );
  }
  const selected = selectPeople(allPeople, LIMIT, OFFSET);
  console.log(`\n📋 Selected ${selected.length} people for processing\n`);

  // 2. Create ingestion run
  let runId = 0;
  if (!DRY_RUN) {
    runId = await createIngestionRun('notable-people', {
      limit: LIMIT,
      offset: OFFSET,
      continent: CONTINENT_FILTER || null,
      selectedCount: selected.length,
    });
    console.log(`📝 Ingestion run #${runId} created\n`);
  }

  // 3. Process each person
  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    momentsGenerated: 0,
    validationWarnings: 0,
    validationErrors: 0,
  };

  const reviewItems: ReviewQueueItem[] = [];

  for (let i = 0; i < selected.length; i++) {
    const person = selected[i];
    console.log(`\n[${i + 1}/${selected.length}] ${person.name} (${person.birthYear}–${person.deathYear || 'present'}, ${person.continent})`);

    // ── Dedup Check ──────────────────────────────────────────────
    const slug = person.wikipediaSlug || deriveWikipediaSlug(person.name);
    const existing = await checkExistingPerson(person.name, slug);

    if (existing) {
      console.log(`  🔍 EXISTING DATA FOUND:`);
      console.log(`    Entity: ${existing.entityId}`);
      console.log(`    Story: ${existing.storyId || '(none)'}`);
      console.log(`    Moments: ${existing.existingMomentIds.length}`);
      if (existing.existingMomentIds.length > 0) {
        for (const mn of existing.existingMomentNames.slice(0, 5)) {
          console.log(`      - ${mn}`);
        }
        if (existing.existingMomentNames.length > 5) {
          console.log(`      ... and ${existing.existingMomentNames.length - 5} more`);
        }
      }

      // Skip entirely if person already has 4+ moments (well-covered)
      if (existing.existingMomentIds.length >= 4) {
        console.log(`  ⏭ Skipping — already has ${existing.existingMomentIds.length} moments (well-covered)`);
        stats.processed++;
        continue;
      }

      console.log(`  📝 Will generate gap-fill content (adding to existing entity/story)`);
    }

    // ── Fetch Wikipedia ──────────────────────────────────────────
    console.log(`  📖 Fetching Wikipedia: ${slug}`);
    const wikiText = await fetchWikipediaFullText(slug);
    if (!wikiText) {
      console.log(`  ⚠ No Wikipedia article found — skipping`);
      stats.failed++;
      stats.processed++;
      continue;
    }
    console.log(`  ✓ Article fetched (${wikiText.length} chars)`);

    // Fetch pageviews for notability
    const avgViews = await fetchPageviews(slug);
    const baseNotability = estimateNotability(avgViews);
    console.log(`  📊 Pageviews: ~${avgViews.toLocaleString()}/mo → notability: ${baseNotability}`);

    // Generate content via LLM
    console.log(`  🤖 Generating content via Claude...`);
    const content = existing
      ? await generatePersonContent(person, wikiText, existing)
      : await generatePersonContent(person, wikiText);
    if (!content) {
      stats.failed++;
      stats.processed++;
      continue;
    }

    // If existing data, override entity/story IDs to match existing
    if (existing) {
      content.entity.id = existing.entityId;
      if (existing.storyId) {
        content.story.id = existing.storyId;
      }
      content.entity.canonicalStoryId = content.story.id;

      // Filter out moments that look like duplicates of existing ones
      const existingNamesLower = existing.existingMomentNames.map(n => n.toLowerCase());
      const originalCount = content.moments.length;
      content.moments = content.moments.filter(m => {
        // Check if moment ID already exists
        if (existing.existingMomentIds.includes(m.id)) return false;
        // Check fuzzy name match (>60% word overlap)
        const mWords = new Set(m.name.toLowerCase().split(/\s+/));
        for (const en of existingNamesLower) {
          const enWords = en.split(/:\s*/)[1]?.split(/\s+/) || en.split(/\s+/);
          const overlap = enWords.filter(w => mWords.has(w)).length;
          if (overlap / Math.max(mWords.size, enWords.length) > 0.5) return false;
        }
        return true;
      });
      const filtered = originalCount - content.moments.length;
      if (filtered > 0) console.log(`  🔍 Filtered ${filtered} duplicate moments`);
    }

    console.log(`  ✓ Generated: ${content.moments.length} moments, 1 story, 1 entity${existing ? ' (gap-fill mode)' : ''}`);

    // Validate content
    const entityErrors = validateEntity(content.entity);
    const storyErrors = validateStory(content.story);
    const momentErrors = content.moments.flatMap((m, idx) => {
      const errs = validateMoment(m);
      return errs.map(e => ({ ...e, field: `moments[${idx}].${e.field}` }));
    });

    const allErrors = [...entityErrors, ...storyErrors, ...momentErrors];
    const errors = allErrors.filter(e => e.severity === 'error');
    const warnings = allErrors.filter(e => e.severity === 'warning');

    stats.validationErrors += errors.length;
    stats.validationWarnings += warnings.length;

    if (errors.length > 0) {
      console.log(`  ⚠ Validation errors: ${errors.length}`);
      for (const err of errors) {
        console.log(`    ❌ ${err.field}: ${err.message}`);
      }
    }
    if (warnings.length > 0) {
      console.log(`  ⚡ Validation warnings: ${warnings.length}`);
    }

    // Apply notability score to all moments
    for (const moment of content.moments) {
      (moment as Record<string, unknown>).notability = baseNotability;
      (moment as Record<string, unknown>).source = 'notable-people';
      (moment as Record<string, unknown>).source_id = String(person.notabilityRank);
    }

    // Build review queue items

    // Entity — skip if already exists in database
    if (!existing) {
      reviewItems.push({
        ingestion_run_id: runId,
        item_type: 'entity',
        item_id: content.entity.id,
        draft_data: content.entity as unknown as Record<string, unknown>,
        validation_errors: entityErrors.length > 0 ? entityErrors : undefined,
      });
    } else {
      console.log(`  ⏭ Skipping entity creation — "${existing.entityId}" already exists`);
    }

    // Story — skip if already exists in database
    const storyData = { ...content.story } as Record<string, unknown>;
    // Parse years for start_year / end_year
    const yearsMatch = content.story.years.match(/(-?\d+)/g);
    if (yearsMatch) {
      storyData.start_year = parseInt(yearsMatch[0], 10);
      if (yearsMatch.length > 1) storyData.end_year = parseInt(yearsMatch[1], 10);
    }
    // Related stories go into related_items
    const storyRelated: Record<string, unknown[]> = {};
    if (content.story.relatedStoryIds?.length) {
      storyRelated.related_stories = content.story.relatedStoryIds.map(rid => ({
        story_id: content.story.id,
        related_story_id: rid,
      }));
    }
    delete storyData.relatedStoryIds;

    if (!existing?.storyId) {
      reviewItems.push({
        ingestion_run_id: runId,
        item_type: 'story',
        item_id: content.story.id,
        draft_data: storyData,
        related_items: Object.keys(storyRelated).length > 0 ? storyRelated : undefined,
        validation_errors: storyErrors.length > 0 ? storyErrors : undefined,
      });
    } else {
      console.log(`  ⏭ Skipping story creation — "${existing.storyId}" already exists`);
    }

    // Moments (always create — dedup filtering already happened above)
    const sortOrderOffset = existing?.existingMomentIds.length || 0;
    for (let mIdx = 0; mIdx < content.moments.length; mIdx++) {
      const moment = content.moments[mIdx];
      const momentData = { ...moment } as Record<string, unknown>;
      const related: Record<string, unknown[]> = {};

      // Story moments join — offset sort_order when adding to existing story
      related.story_moments = [{
        story_id: content.story.id,
        moment_id: moment.id,
        sort_order: sortOrderOffset + mIdx,
        is_primary: !existing && mIdx === 0,  // only set primary if new story
      }];

      // Entity links
      if (moment.entityIds?.length) {
        related.moment_entities = moment.entityIds.map(eid => ({
          moment_id: moment.id,
          entity_id: eid,
        }));
      }

      // Media: search Wikimedia Commons for location-relevant photo
      const searchQuery = buildImageSearchQuery({
        name: moment.name,
        address: moment.address,
        year: moment.year,
      });
      const commonsImg = await searchCommonsImage(searchQuery);
      if (commonsImg) {
        const isValid = await validateImageUrl(commonsImg.thumbUrl);
        if (isValid) {
          related.moment_media = [{
            moment_id: moment.id,
            type: 'image',
            url: commonsImg.thumbUrl,
            caption: commonsImg.title.replace('File:', '').replace(/\.[^.]+$/, '').replace(/_/g, ' '),
            sort_order: 0,
          }];
          console.log(`    📷 Found image: ${commonsImg.title}`);
        }
      }

      // Clean fields that go into join tables, not moments table
      delete momentData.entityIds;
      delete momentData.media;

      // Map type to type_id (moments table uses type_id FK)
      momentData.type_id = momentData.type;
      delete momentData.type;

      const mErrors = validateMoment(moment);
      reviewItems.push({
        ingestion_run_id: runId,
        item_type: 'moment',
        item_id: moment.id,
        draft_data: momentData,
        related_items: related,
        validation_errors: mErrors.length > 0 ? mErrors : undefined,
      });
    }

    stats.succeeded++;
    stats.momentsGenerated += content.moments.length;
    stats.processed++;

    // Rate limit: 1 second between people
    if (i < selected.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // 4. Insert into review queue
  if (!DRY_RUN && reviewItems.length > 0) {
    console.log(`\n📤 Inserting ${reviewItems.length} items into review queue...`);
    await insertToReviewQueue(reviewItems);
    await updateIngestionRun(runId, 'completed', stats);
    console.log('  ✓ Done');
  }

  // 5. Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Pipeline Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Processed:  ${stats.processed}`);
  console.log(`  Succeeded:  ${stats.succeeded}`);
  console.log(`  Failed:     ${stats.failed}`);
  console.log(`  Moments:    ${stats.momentsGenerated}`);
  console.log(`  Warnings:   ${stats.validationWarnings}`);
  console.log(`  Errors:     ${stats.validationErrors}`);
  if (!DRY_RUN) {
    console.log(`  Run ID:     ${runId}`);
    console.log(`\n  Next: npx tsx scripts/ingest/review.ts --run ${runId}`);
  } else {
    console.log(`\n  [DRY RUN — no items inserted]`);
  }
}

// ── Curated Seed List ────────────────────────────────────────────────
// Top ~50 most notable people in history, spanning all continents.
// Used when the full dataset CSV is not available.

const SEED_PEOPLE: NotablePerson[] = [
  // Europe
  { name: 'Albert Einstein', birthYear: 1879, deathYear: 1955, birthLat: 48.4, birthLng: 10.0, occupation: 'Physicist', notabilityRank: 1, continent: 'Europe' },
  { name: 'Leonardo da Vinci', birthYear: 1452, deathYear: 1519, birthLat: 43.79, birthLng: 10.92, occupation: 'Polymath', notabilityRank: 2, continent: 'Europe' },
  { name: 'William Shakespeare', birthYear: 1564, deathYear: 1616, birthLat: 52.19, birthLng: -1.71, occupation: 'Playwright', notabilityRank: 3, continent: 'Europe' },
  { name: 'Isaac Newton', birthYear: 1643, deathYear: 1727, birthLat: 52.94, birthLng: -0.56, occupation: 'Physicist', notabilityRank: 4, continent: 'Europe' },
  { name: 'Napoleon Bonaparte', birthYear: 1769, deathYear: 1821, birthLat: 41.93, birthLng: 8.74, occupation: 'Emperor', notabilityRank: 5, continent: 'Europe' },
  { name: 'Wolfgang Amadeus Mozart', birthYear: 1756, deathYear: 1791, birthLat: 47.80, birthLng: 13.04, occupation: 'Composer', notabilityRank: 6, continent: 'Europe' },
  { name: 'Charles Darwin', birthYear: 1809, deathYear: 1882, birthLat: 52.71, birthLng: -2.75, occupation: 'Naturalist', notabilityRank: 7, continent: 'Europe' },
  { name: 'Galileo Galilei', birthYear: 1564, deathYear: 1642, birthLat: 43.72, birthLng: 11.25, occupation: 'Astronomer', notabilityRank: 8, continent: 'Europe' },
  { name: 'Marie Curie', birthYear: 1867, deathYear: 1934, birthLat: 52.23, birthLng: 21.01, occupation: 'Physicist', notabilityRank: 9, continent: 'Europe' },
  { name: 'Ludwig van Beethoven', birthYear: 1770, deathYear: 1827, birthLat: 50.73, birthLng: 7.10, occupation: 'Composer', notabilityRank: 10, continent: 'Europe' },
  { name: 'Michelangelo', birthYear: 1475, deathYear: 1564, birthLat: 43.56, birthLng: 11.99, occupation: 'Artist', notabilityRank: 11, continent: 'Europe' },
  { name: 'Karl Marx', birthYear: 1818, deathYear: 1883, birthLat: 49.76, birthLng: 6.64, occupation: 'Philosopher', notabilityRank: 12, continent: 'Europe' },
  { name: 'Nikola Tesla', birthYear: 1856, deathYear: 1943, birthLat: 44.57, birthLng: 15.32, occupation: 'Inventor', notabilityRank: 13, continent: 'Europe' },
  { name: 'Alexander the Great', birthYear: -356, deathYear: -323, birthLat: 40.52, birthLng: 22.35, occupation: 'Conqueror', notabilityRank: 14, continent: 'Europe' },
  { name: 'Cleopatra', birthYear: -69, deathYear: -30, birthLat: 31.20, birthLng: 29.92, occupation: 'Pharaoh', notabilityRank: 15, continent: 'Africa' },

  // North America
  { name: 'Abraham Lincoln', birthYear: 1809, deathYear: 1865, birthLat: 37.56, birthLng: -85.74, occupation: 'President', notabilityRank: 16, continent: 'North America' },
  { name: 'Martin Luther King Jr.', birthYear: 1929, deathYear: 1968, birthLat: 33.75, birthLng: -84.37, occupation: 'Civil Rights Leader', notabilityRank: 17, continent: 'North America' },
  { name: 'Thomas Edison', birthYear: 1847, deathYear: 1931, birthLat: 41.05, birthLng: -82.85, occupation: 'Inventor', notabilityRank: 18, continent: 'North America' },
  { name: 'Benjamin Franklin', birthYear: 1706, deathYear: 1790, birthLat: 42.36, birthLng: -71.06, occupation: 'Polymath', notabilityRank: 19, continent: 'North America' },
  { name: 'George Washington', birthYear: 1732, deathYear: 1799, birthLat: 38.18, birthLng: -76.93, occupation: 'President', notabilityRank: 20, continent: 'North America' },

  // Asia
  { name: 'Confucius', birthYear: -551, deathYear: -479, birthLat: 35.60, birthLng: 116.99, occupation: 'Philosopher', notabilityRank: 21, continent: 'Asia' },
  { name: 'Genghis Khan', birthYear: 1162, deathYear: 1227, birthLat: 48.50, birthLng: 108.82, occupation: 'Conqueror', notabilityRank: 22, continent: 'Asia' },
  { name: 'Mahatma Gandhi', birthYear: 1869, deathYear: 1948, birthLat: 21.17, birthLng: 72.83, occupation: 'Political Leader', notabilityRank: 23, continent: 'Asia' },
  { name: 'Buddha', birthYear: -563, deathYear: -483, birthLat: 27.47, birthLng: 83.28, occupation: 'Spiritual Leader', notabilityRank: 24, continent: 'Asia' },
  { name: 'Sun Tzu', birthYear: -544, deathYear: -496, birthLat: 31.30, birthLng: 120.60, occupation: 'Military Strategist', notabilityRank: 25, continent: 'Asia' },
  { name: 'Akbar', birthYear: 1542, deathYear: 1605, birthLat: 24.52, birthLng: 74.84, occupation: 'Emperor', notabilityRank: 26, continent: 'Asia' },
  { name: 'Laozi', birthYear: -601, deathYear: -531, birthLat: 33.89, birthLng: 115.69, occupation: 'Philosopher', notabilityRank: 27, continent: 'Asia' },
  { name: 'Mao Zedong', birthYear: 1893, deathYear: 1976, birthLat: 27.50, birthLng: 112.53, occupation: 'Political Leader', notabilityRank: 28, continent: 'Asia' },
  { name: 'Ashoka', birthYear: -304, deathYear: -232, birthLat: 25.32, birthLng: 83.01, occupation: 'Emperor', notabilityRank: 29, continent: 'Asia' },
  { name: 'Ibn Battuta', birthYear: 1304, deathYear: 1368, birthLat: 35.77, birthLng: -5.81, occupation: 'Explorer', notabilityRank: 30, continent: 'Africa' },

  // Africa
  { name: 'Nelson Mandela', birthYear: 1918, deathYear: 2013, birthLat: -31.78, birthLng: 28.79, occupation: 'President', notabilityRank: 31, continent: 'Africa' },
  { name: 'Shaka Zulu', birthYear: 1787, deathYear: 1828, birthLat: -28.52, birthLng: 31.17, occupation: 'King', notabilityRank: 32, continent: 'Africa' },
  { name: 'Mansa Musa', birthYear: 1280, deathYear: 1337, birthLat: 12.65, birthLng: -8.0, occupation: 'Emperor', notabilityRank: 33, continent: 'Africa' },
  { name: 'Haile Selassie', birthYear: 1892, deathYear: 1975, birthLat: 9.31, birthLng: 42.12, occupation: 'Emperor', notabilityRank: 34, continent: 'Africa' },
  { name: 'Nefertiti', birthYear: -1370, deathYear: -1330, birthLat: 27.65, birthLng: 30.90, occupation: 'Queen', notabilityRank: 35, continent: 'Africa' },
  { name: 'Sundiata Keita', birthYear: 1217, deathYear: 1255, birthLat: 12.08, birthLng: -8.07, occupation: 'King', notabilityRank: 36, continent: 'Africa' },

  // South America
  { name: 'Simón Bolívar', birthYear: 1783, deathYear: 1830, birthLat: 10.50, birthLng: -66.92, occupation: 'Liberator', notabilityRank: 37, continent: 'South America' },
  { name: 'Che Guevara', birthYear: 1928, deathYear: 1967, birthLat: -32.95, birthLng: -60.64, occupation: 'Revolutionary', notabilityRank: 38, continent: 'South America' },
  { name: 'Pedro II of Brazil', birthYear: 1825, deathYear: 1891, birthLat: -22.91, birthLng: -43.17, occupation: 'Emperor', notabilityRank: 39, continent: 'South America' },
  { name: 'Eva Perón', birthYear: 1919, deathYear: 1952, birthLat: -33.76, birthLng: -61.97, occupation: 'Political Leader', notabilityRank: 40, continent: 'South America' },

  // Middle East
  { name: 'Saladin', birthYear: 1137, deathYear: 1193, birthLat: 36.41, birthLng: 44.35, occupation: 'Sultan', notabilityRank: 41, continent: 'Asia' },
  { name: 'Cyrus the Great', birthYear: -600, deathYear: -530, birthLat: 30.04, birthLng: 53.04, occupation: 'Emperor', notabilityRank: 42, continent: 'Asia' },
  { name: 'Rumi', birthYear: 1207, deathYear: 1273, birthLat: 36.55, birthLng: 69.17, occupation: 'Poet', notabilityRank: 43, continent: 'Asia' },

  // Oceania
  { name: 'James Cook', birthYear: 1728, deathYear: 1779, birthLat: 54.53, birthLng: -1.17, occupation: 'Explorer', notabilityRank: 44, continent: 'Europe' },

  // More Europe
  { name: 'Julius Caesar', birthYear: -100, deathYear: -44, birthLat: 41.89, birthLng: 12.49, occupation: 'Dictator', notabilityRank: 45, continent: 'Europe' },
  { name: 'Joan of Arc', birthYear: 1412, deathYear: 1431, birthLat: 48.44, birthLng: 5.67, occupation: 'Military Leader', notabilityRank: 46, continent: 'Europe' },
  { name: 'Sigmund Freud', birthYear: 1856, deathYear: 1939, birthLat: 49.73, birthLng: 18.17, occupation: 'Psychologist', notabilityRank: 47, continent: 'Europe' },
  { name: 'Vincent van Gogh', birthYear: 1853, deathYear: 1890, birthLat: 51.59, birthLng: 5.26, occupation: 'Artist', notabilityRank: 48, continent: 'Europe' },
  { name: 'Harriet Tubman', birthYear: 1822, deathYear: 1913, birthLat: 38.57, birthLng: -75.93, occupation: 'Abolitionist', notabilityRank: 49, continent: 'North America' },
  { name: 'Frida Kahlo', birthYear: 1907, deathYear: 1954, birthLat: 19.35, birthLng: -99.16, occupation: 'Artist', notabilityRank: 50, continent: 'North America' },
];

// ── Run ──────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('\n💀 Pipeline failed:', err);
  process.exit(1);
});
