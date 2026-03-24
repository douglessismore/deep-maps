#!/usr/bin/env npx tsx
/**
 * Deep Maps — Notable People Pipeline (Local/Subagent Mode)
 *
 * Same pipeline as notable-people.ts but replaces Claude API calls with
 * file-based handoff — writes prompt files that Claude Code subagents
 * can process using plan credits instead of API credits.
 *
 * Three-phase workflow:
 *   Phase 1 (prep):     Fetch Wikipedia, check dedup, write prompt files
 *   Phase 2 (generate): Subagents read prompts, write output JSON files
 *   Phase 3 (assemble): Read outputs, validate, search images, insert to review queue
 *
 * Usage:
 *   npx tsx scripts/ingest/notable-people-local.ts --phase prep --offset 78 --limit 25
 *   # ... subagents process the prompt files ...
 *   npx tsx scripts/ingest/notable-people-local.ts --phase assemble --batch <batch-id>
 *
 * Or all-in-one (for Claude Code to orchestrate):
 *   npx tsx scripts/ingest/notable-people-local.ts --phase prep --offset 78 --limit 25
 *   # Returns batch ID, subagent prompt files at data/pipeline-batches/<batch-id>/
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

const PHASE = getArg('phase') || 'prep';
const LIMIT = getArg('limit') ? parseInt(getArg('limit')!, 10) : 25;
const OFFSET = getArg('offset') ? parseInt(getArg('offset')!, 10) : 0;
const BATCH_ID = getArg('batch');

// ── Dataset Loading ──────────────────────────────────────────────────

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

/** Prompt file written per person for subagent consumption */
interface PersonPromptFile {
  person: NotablePerson;
  wikiText: string;
  notability: number;
  existing: ExistingPersonData | null;
  systemPrompt: string;
  userPrompt: string;
}

/** Output file written by subagent */
interface PersonOutputFile {
  personName: string;
  content: GeneratedContent;
}

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

// ── Batch Directory ──────────────────────────────────────────────────

const BATCHES_DIR = path.resolve(__dirname, '../../data/pipeline-batches');

function getBatchDir(batchId: string): string {
  return path.join(BATCHES_DIR, batchId);
}

function ensureBatchDir(batchId: string): string {
  const dir = getBatchDir(batchId);
  fs.mkdirSync(path.join(dir, 'prompts'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'outputs'), { recursive: true });
  return dir;
}

// ── Phase 1: Prep ────────────────────────────────────────────────────

async function runPrep() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Phase 1: PREP — Fetch Wikipedia & Write Prompts');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Offset: ${OFFSET} | Limit: ${LIMIT}`);
  console.log('');

  // Load dataset
  const jsonPath = path.resolve(__dirname, '../../data/top-people.json');
  const raw: TopPersonEntry[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const allPeople: NotablePerson[] = raw.map(p => ({
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

  const selected = allPeople
    .sort((a, b) => a.notabilityRank - b.notabilityRank)
    .slice(OFFSET, OFFSET + LIMIT);

  console.log(`📋 Selected ${selected.length} people (ranks ${OFFSET + 1}–${OFFSET + selected.length})\n`);

  // Create batch
  const batchId = `batch-${OFFSET}-${OFFSET + selected.length - 1}-${Date.now()}`;
  const batchDir = ensureBatchDir(batchId);
  console.log(`📁 Batch: ${batchId}\n`);

  const prepResults: Array<{ index: number; name: string; status: string; promptFile?: string }> = [];
  let skipped = 0;

  for (let i = 0; i < selected.length; i++) {
    const person = selected[i];
    const slug = person.wikipediaSlug || deriveWikipediaSlug(person.name);
    console.log(`[${i + 1}/${selected.length}] ${person.name}`);

    // Dedup check
    const existing = await checkExistingPerson(person.name, slug);
    if (existing && existing.existingMomentIds.length >= 4) {
      console.log(`  ⏭ Already has ${existing.existingMomentIds.length} moments — skipping`);
      skipped++;
      prepResults.push({ index: i, name: person.name, status: 'skipped-complete' });
      continue;
    }
    if (existing) {
      console.log(`  🔍 Existing: ${existing.existingMomentIds.length} moments — will gap-fill`);
    }

    // Fetch Wikipedia
    console.log(`  📖 Fetching Wikipedia: ${slug}`);
    const wikiText = await fetchWikipediaFullText(slug);
    if (!wikiText) {
      console.log(`  ⚠ No Wikipedia article — skipping`);
      prepResults.push({ index: i, name: person.name, status: 'no-wiki' });
      continue;
    }
    console.log(`  ✓ ${wikiText.length} chars`);

    // Pageviews
    const avgViews = await fetchPageviews(slug);
    const notability = estimateNotability(avgViews);
    console.log(`  📊 Notability: ${notability} (~${avgViews.toLocaleString()}/mo)`);

    // Build prompt
    const years = person.deathYear
      ? `${person.birthYear}–${person.deathYear}`
      : `${person.birthYear}–present`;

    let userPrompt = BIOGRAPHY_GENERATION_PROMPT
      .replace('{name}', person.name)
      .replace('{years}', years)
      .replace('{occupation}', person.occupation)
      .replace('{birthLat}', String(person.birthLat))
      .replace('{birthLng}', String(person.birthLng))
      .replace('{wikiText}', wikiText.slice(0, 12000));

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
      userPrompt += dedupContext.join('\n');
    }

    // Write prompt file
    const promptData: PersonPromptFile = {
      person,
      wikiText: wikiText.slice(0, 12000),
      notability,
      existing,
      systemPrompt: CONTENT_GUIDE_SYSTEM_PROMPT,
      userPrompt,
    };

    const safeSlug = toKebabCase(person.name);
    const promptFile = path.join(batchDir, 'prompts', `${safeSlug}.json`);
    fs.writeFileSync(promptFile, JSON.stringify(promptData, null, 2));
    console.log(`  ✓ Wrote prompt: ${safeSlug}.json`);
    prepResults.push({ index: i, name: person.name, status: 'ready', promptFile: `${safeSlug}.json` });

    // Rate limit: 2s between people to avoid Wikipedia throttling
    if (i < selected.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Write batch manifest
  const manifest = {
    batchId,
    offset: OFFSET,
    limit: LIMIT,
    created: new Date().toISOString(),
    people: prepResults,
    totalReady: prepResults.filter(r => r.status === 'ready').length,
    totalSkipped: skipped,
  };
  fs.writeFileSync(path.join(batchDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Prep Complete');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Ready: ${manifest.totalReady} people`);
  console.log(`  Skipped: ${manifest.totalSkipped} (already complete)`);
  console.log(`  Batch ID: ${batchId}`);
  console.log(`  Prompts: ${batchDir}/prompts/`);
  console.log(`  Outputs: ${batchDir}/outputs/ (subagents write here)`);
  console.log(`\n  Next: Have subagents process each prompt file, then run:`);
  console.log(`  npx tsx scripts/ingest/notable-people-local.ts --phase assemble --batch ${batchId}`);
}

// ── Phase 3: Assemble ────────────────────────────────────────────────

async function runAssemble() {
  if (!BATCH_ID) {
    console.error('❌ --batch <id> required for assemble phase');
    process.exit(1);
  }

  const batchDir = getBatchDir(BATCH_ID);
  if (!fs.existsSync(batchDir)) {
    console.error(`❌ Batch not found: ${batchDir}`);
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  Phase 3: ASSEMBLE — Validate & Insert');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Batch: ${BATCH_ID}\n`);

  const manifest = JSON.parse(fs.readFileSync(path.join(batchDir, 'manifest.json'), 'utf-8'));
  const outputDir = path.join(batchDir, 'outputs');
  const promptDir = path.join(batchDir, 'prompts');

  // Create ingestion run
  const runId = await createIngestionRun('notable-people-local', {
    batchId: BATCH_ID,
    offset: manifest.offset,
    limit: manifest.limit,
  });
  console.log(`📝 Ingestion run #${runId}\n`);

  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    momentsGenerated: 0,
    validationWarnings: 0,
    validationErrors: 0,
  };

  const reviewItems: ReviewQueueItem[] = [];

  // Process each output file
  const readyPeople = manifest.people.filter((p: any) => p.status === 'ready');

  for (const entry of readyPeople) {
    const slug = entry.promptFile.replace('.json', '');
    const outputFile = path.join(outputDir, `${slug}.json`);

    console.log(`[${stats.processed + 1}/${readyPeople.length}] ${entry.name}`);

    if (!fs.existsSync(outputFile)) {
      console.log(`  ⚠ No output file — skipping`);
      stats.failed++;
      stats.processed++;
      continue;
    }

    // Read prompt (for metadata) and output
    const promptData: PersonPromptFile = JSON.parse(
      fs.readFileSync(path.join(promptDir, entry.promptFile), 'utf-8')
    );
    const outputData: PersonOutputFile = JSON.parse(
      fs.readFileSync(outputFile, 'utf-8')
    );

    const content = outputData.content;
    const person = promptData.person;
    const existing = promptData.existing;
    const notability = promptData.notability;

    // Apply dedup filtering if existing
    if (existing) {
      content.entity.id = existing.entityId;
      if (existing.storyId) content.story.id = existing.storyId;
      content.entity.canonicalStoryId = content.story.id;

      const existingNamesLower = existing.existingMomentNames.map((n: string) => n.toLowerCase());
      const originalCount = content.moments.length;
      content.moments = content.moments.filter(m => {
        if (existing.existingMomentIds.includes(m.id)) return false;
        const mWords = new Set(m.name.toLowerCase().split(/\s+/));
        for (const en of existingNamesLower) {
          const enWords = en.split(/:\s*/)[1]?.split(/\s+/) || en.split(/\s+/);
          const overlap = enWords.filter((w: string) => mWords.has(w)).length;
          if (overlap / Math.max(mWords.size, enWords.length) > 0.5) return false;
        }
        return true;
      });
      const filtered = originalCount - content.moments.length;
      if (filtered > 0) console.log(`  🔍 Filtered ${filtered} duplicate moments`);
    }

    console.log(`  ✓ ${content.moments.length} moments, 1 story, 1 entity`);

    // Validate
    const entityErrors = validateEntity(content.entity);
    const storyErrors = validateStory(content.story);
    const momentErrors = content.moments.flatMap((m: any, idx: number) => {
      const errs = validateMoment(m);
      return errs.map((e: any) => ({ ...e, field: `moments[${idx}].${e.field}` }));
    });
    const allErrors = [...entityErrors, ...storyErrors, ...momentErrors];
    stats.validationErrors += allErrors.filter(e => e.severity === 'error').length;
    stats.validationWarnings += allErrors.filter(e => e.severity === 'warning').length;

    if (allErrors.filter(e => e.severity === 'error').length > 0) {
      for (const err of allErrors.filter(e => e.severity === 'error')) {
        console.log(`    ❌ ${err.field}: ${err.message}`);
      }
    }

    // Apply notability
    for (const moment of content.moments) {
      (moment as Record<string, unknown>).notability = notability;
      (moment as Record<string, unknown>).source = 'notable-people';
      (moment as Record<string, unknown>).source_id = String(person.notabilityRank);
    }

    // Build review items — entity
    if (!existing) {
      reviewItems.push({
        ingestion_run_id: runId,
        item_type: 'entity',
        item_id: content.entity.id,
        draft_data: content.entity as unknown as Record<string, unknown>,
        validation_errors: entityErrors.length > 0 ? entityErrors : undefined,
      });
    } else {
      console.log(`  ⏭ Skipping entity — "${existing.entityId}" exists`);
    }

    // Story
    const storyData = { ...content.story } as Record<string, unknown>;
    const yearsMatch = content.story.years.match(/(-?\d+)/g);
    if (yearsMatch) {
      storyData.start_year = parseInt(yearsMatch[0], 10);
      if (yearsMatch.length > 1) storyData.end_year = parseInt(yearsMatch[1], 10);
    }
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
    }

    // Moments + image search
    const sortOrderOffset = existing?.existingMomentIds.length || 0;
    for (let mIdx = 0; mIdx < content.moments.length; mIdx++) {
      const moment = content.moments[mIdx];
      const momentData = { ...moment } as Record<string, unknown>;
      const related: Record<string, unknown[]> = {};

      related.story_moments = [{
        story_id: content.story.id,
        moment_id: moment.id,
        sort_order: sortOrderOffset + mIdx,
        is_primary: !existing && mIdx === 0,
      }];

      if (moment.entityIds?.length) {
        related.moment_entities = moment.entityIds.map(eid => ({
          moment_id: moment.id,
          entity_id: eid,
        }));
      }

      // Image search (free — Wikimedia Commons)
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

      delete momentData.entityIds;
      delete momentData.media;
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
  }

  // Insert to review queue
  if (reviewItems.length > 0) {
    console.log(`\n📤 Inserting ${reviewItems.length} items into review queue...`);
    await insertToReviewQueue(reviewItems);
    await updateIngestionRun(runId, 'completed', stats);
    console.log('  ✓ Done');
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Assemble Complete');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Processed:  ${stats.processed}`);
  console.log(`  Succeeded:  ${stats.succeeded}`);
  console.log(`  Failed:     ${stats.failed}`);
  console.log(`  Moments:    ${stats.momentsGenerated}`);
  console.log(`  Warnings:   ${stats.validationWarnings}`);
  console.log(`  Errors:     ${stats.validationErrors}`);
  console.log(`  Run ID:     ${runId}`);
  console.log(`\n  Next: npx tsx scripts/ingest/review.ts --run ${runId}`);
}

// ── Run ──────────────────────────────────────────────────────────────

if (PHASE === 'prep') {
  runPrep().catch(err => { console.error('💀 Prep failed:', err); process.exit(1); });
} else if (PHASE === 'assemble') {
  runAssemble().catch(err => { console.error('💀 Assemble failed:', err); process.exit(1); });
} else {
  console.error(`❌ Unknown phase: ${PHASE}. Use --phase prep or --phase assemble`);
  process.exit(1);
}
