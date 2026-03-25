#!/usr/bin/env npx tsx
/**
 * Generate burial moments for verified BG matches.
 *
 * Reads bg-final-verified.json, checks which entities already have burial
 * moments, and generates new burial moments via Claude API for the rest.
 * Outputs to review queue for human approval.
 *
 * Usage:
 *   npx tsx scripts/ingest/bg-generate-moments.ts --dry-run    # preview
 *   npx tsx scripts/ingest/bg-generate-moments.ts               # insert to review queue
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  getSupabase,
  createIngestionRun,
  updateIngestionRun,
  insertToReviewQueue,
  type ReviewQueueItem,
} from './lib/pipeline.js';
import { generateJSON } from './lib/llm-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '../output');

const DRY_RUN = process.argv.includes('--dry-run');

interface VerifiedMatch {
  momentId: string;
  entityId: string;
  entityName: string;
  bgRecordId: number;
  bgUrl: string;
  lat: number;
  lng: number;
  cemeteryName: string;
  cemeteryCity?: string;
  cemeteryState?: string;
  cemeteryCountry?: string;
  notes: string;
}

interface GeneratedMoment {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  lat: number;
  lng: number;
  type_id: string;
  importance: string;
  accuracy: string;
  kind: string;
  year: number;
  date?: string;
  address: string;
  verification_level: string;
  source: string;
  source_id: string;
  geo_verified: boolean;
  geo_source_url: string;
  geo_verified_at: string;
}

const SYSTEM_PROMPT = `You are a content writer for Deep Maps, a geospatial storytelling app. You write burial moments — short entries about where notable people are buried.

Rules:
- Moment NAME: 60-110 chars. Lead with person's name + verb. Include one specific detail that hooks interest. Examples:
  "Billy the Kid Is Buried Behind Iron Bars at Old Fort Sumner Cemetery"
  "Clyde Barrow Buried Apart from Bonnie by Their Families"
  "Marie Curie Dies from the Radiation That Made Her Famous"
- Moment SUBTITLE: 60-140 chars. Place-visit annotation: cemetery name + address + one physical detail about the grave.
  Example: "Old Fort Sumner Cemetery, Fort Sumner, NM. Grave behind iron cage to prevent theft"
- Moment DESCRIPTION: 250-400 chars. Standalone narrative. Include:
  1. Death date + circumstances (1-2 sentences)
  2. Burial location + specific grave details (inscription, companions, condition)
  3. One ironic or surprising detail about the burial or afterlife of the remains
  No pronouns without antecedent. No em-dashes. Specific > vague.
- YEAR: death year (integer)
- DATE: "DD Month YYYY" format if known
- ADDRESS: Full cemetery address with city/state/country

Return JSON with fields: name, subtitle, description, year, date, address`;

async function main() {
  const matches: VerifiedMatch[] = JSON.parse(
    readFileSync(resolve(OUTPUT_DIR, 'bg-final-verified.json'), 'utf-8')
  );

  console.log(`Loaded ${matches.length} verified BG matches`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  // Check which entities already have burial moments
  const sb = getSupabase();
  const { data: allBurials } = await sb
    .from('moments')
    .select('id, type_id')
    .eq('type_id', 'burial');
  const { data: burialLinks } = await sb
    .from('moment_entities')
    .select('entity_id, moment_id');

  const entitiesWithBurial = new Set<string>();
  for (const link of burialLinks ?? []) {
    if (allBurials?.some(m => m.id === link.moment_id)) {
      entitiesWithBurial.add(link.entity_id);
    }
  }

  // Also check for existing moments at same entity (to get story IDs)
  const entityStoryMap = new Map<string, string>();
  const { data: entityRows } = await sb
    .from('entities')
    .select('id, canonical_story_id, years, description, wikipedia_slug');
  for (const e of entityRows ?? []) {
    if (e.canonical_story_id) {
      entityStoryMap.set(e.id, e.canonical_story_id);
    }
  }

  const entityDataMap = new Map<string, any>();
  for (const e of entityRows ?? []) {
    entityDataMap.set(e.id, e);
  }

  // Filter to entities that need new burial moments
  const needsBurial = matches.filter(m => !entitiesWithBurial.has(m.entityId));
  const alreadyHas = matches.filter(m => entitiesWithBurial.has(m.entityId));

  console.log(`Already have burial moment: ${alreadyHas.length}`);
  for (const m of alreadyHas) {
    console.log(`  ⏭ ${m.entityName} (already has burial)`);
  }
  console.log(`Need new burial moment: ${needsBurial.length}\n`);

  if (needsBurial.length === 0) {
    console.log('Nothing to generate. Done.');
    return;
  }

  // Generate moments
  let runId = 0;
  if (!DRY_RUN) {
    runId = await createIngestionRun('billiongraves-burials', {
      count: needsBurial.length,
      source: 'bg-final-verified.json',
    });
    console.log(`📝 Ingestion run #${runId}\n`);
  }

  const reviewItems: ReviewQueueItem[] = [];
  const generated: GeneratedMoment[] = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < needsBurial.length; i++) {
    const match = needsBurial[i];
    const entityData = entityDataMap.get(match.entityId);
    const storyId = entityStoryMap.get(match.entityId);

    console.log(`[${i + 1}/${needsBurial.length}] ${match.entityName}`);
    console.log(`  Cemetery: ${match.cemeteryName}, ${match.cemeteryCity}, ${match.cemeteryState}`);
    console.log(`  GPS: ${match.lat.toFixed(6)}, ${match.lng.toFixed(6)}`);

    const prompt = `Generate a burial moment for ${match.entityName} (${entityData?.years ?? 'dates unknown'}).

Cemetery: ${match.cemeteryName}
City: ${match.cemeteryCity ?? 'unknown'}
State/Region: ${match.cemeteryState ?? 'unknown'}
Country: ${match.cemeteryCountry ?? 'unknown'}
GPS: ${match.lat.toFixed(6)}, ${match.lng.toFixed(6)}
BillionGraves URL: ${match.bgUrl}
${entityData?.description ? `\nAbout this person: ${entityData.description}` : ''}

Generate JSON with: name, subtitle, description, year (death year as integer), date (death date as "DD Month YYYY" or just year), address (full cemetery address)`;

    try {
      const result = await generateJSON<{
        name: string;
        subtitle: string;
        description: string;
        year: number;
        date?: string;
        address: string;
      }>({
        system: SYSTEM_PROMPT,
        prompt,
        maxTokens: 1024,
        temperature: 0.3,
      });

      console.log(`  ✓ "${result.name}"`);

      const momentId = `${match.entityId}-burial`;
      const moment: GeneratedMoment = {
        id: momentId,
        name: result.name,
        subtitle: result.subtitle,
        description: result.description,
        lat: match.lat,
        lng: match.lng,
        type_id: 'burial',
        importance: 'minor',
        accuracy: 'pinpoint',
        kind: 'milestone',
        year: result.year,
        date: result.date,
        address: result.address,
        verification_level: 'verified',
        source: 'billiongraves',
        source_id: String(match.bgRecordId),
        geo_verified: true,
        geo_source_url: match.bgUrl,
        geo_verified_at: new Date().toISOString(),
      };

      generated.push(moment);

      // Build review queue item with join table entries
      const related: Record<string, unknown[]> = {};

      // Link to entity
      related.moment_entities = [{
        moment_id: momentId,
        entity_id: match.entityId,
      }];

      // Link to story (if entity has a canonical story)
      if (storyId) {
        // Get current max sort_order for this story
        const { data: existingStoryMoments } = await sb
          .from('story_moments')
          .select('sort_order')
          .eq('story_id', storyId)
          .order('sort_order', { ascending: false })
          .limit(1);
        const nextSortOrder = (existingStoryMoments?.[0]?.sort_order ?? 0) + 1;

        related.story_moments = [{
          story_id: storyId,
          moment_id: momentId,
          sort_order: nextSortOrder,
          is_primary: false,
        }];
      }

      reviewItems.push({
        ingestion_run_id: runId,
        item_type: 'moment',
        item_id: momentId,
        draft_data: moment as unknown as Record<string, unknown>,
        related_items: related,
      });

      succeeded++;
    } catch (err) {
      console.error(`  ❌ Generation failed:`, (err as Error).message);
      failed++;
    }

    // Rate limit between LLM calls
    if (i < needsBurial.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Insert to review queue
  if (!DRY_RUN && reviewItems.length > 0) {
    console.log(`\n📤 Inserting ${reviewItems.length} moments into review queue...`);
    await insertToReviewQueue(reviewItems);
    await updateIngestionRun(runId, 'completed', { succeeded, failed });
    console.log('  ✓ Done');
  }

  // Save generated moments for reference
  writeFileSync(
    resolve(OUTPUT_DIR, 'bg-generated-moments.json'),
    JSON.stringify(generated, null, 2)
  );

  console.log('\n═══════════════════════════════════════');
  console.log(`  Generated: ${succeeded}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Written to: bg-generated-moments.json`);
  if (!DRY_RUN) {
    console.log(`  Review: npx tsx scripts/ingest/review.ts --run ${runId}`);
  } else {
    console.log(`  [DRY RUN — not inserted]`);
  }
  console.log('═══════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
