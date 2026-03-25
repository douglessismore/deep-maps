#!/usr/bin/env npx tsx
/**
 * Fix orphan person entities — create invisible biography stories.
 *
 * Two phases:
 *   Phase A: Wire moments to EXISTING biography stories (Bucket A)
 *   Phase B: Create NEW biography stories for entities without one (Bucket B)
 *
 * Safety:
 *   - Never deletes anything
 *   - Checks for duplicates before every insert
 *   - biography stories are invisible infrastructure (filtered from UI)
 *
 * Usage:
 *   npx tsx scripts/ingest/fix-orphan-biographies.ts --dry-run         # preview both phases
 *   npx tsx scripts/ingest/fix-orphan-biographies.ts --phase-a          # wire to existing stories only
 *   npx tsx scripts/ingest/fix-orphan-biographies.ts --phase-b          # create new biography stories only
 *   npx tsx scripts/ingest/fix-orphan-biographies.ts                    # run both phases
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getSupabase } from './lib/pipeline.js';
import { generateJSON } from './lib/llm-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '../output');
const DRY_RUN = process.argv.includes('--dry-run');
const PHASE_A_ONLY = process.argv.includes('--phase-a');
const PHASE_B_ONLY = process.argv.includes('--phase-b');
const RUN_BOTH = !PHASE_A_ONLY && !PHASE_B_ONLY;

// Category assignment for person entities (matches existing generate-bucket-b-biographies.mjs)
const CATEGORY_MAP: Record<string, string> = {
  // Sacred/biblical
  solomon: 'sacred-history', 'elijah-prophet': 'sacred-history', 'john-the-baptist': 'sacred-history',
  umar: 'sacred-history', 'augustine-of-hippo': 'sacred-history', 'francis-of-assisi': 'sacred-history',
  rumi: 'sacred-history', confucius: 'sacred-history', chanakya: 'sacred-history',
  // Dark history
  'ed-gein': 'dark-history', 'jeffrey-dahmer': 'dark-history', 'john-wayne-gacy': 'dark-history',
  'jack-the-ripper': 'dark-history', 'billy-the-kid': 'dark-history', 'pat-garrett': 'dark-history',
  'john-tunstall': 'dark-history',
  // Science
  'michael-faraday': 'discovery-science', 'johannes-kepler': 'discovery-science',
  'leonhard-euler': 'discovery-science', 'charles-darwin': 'discovery-science',
  'rene-descartes': 'discovery-science', 'immanuel-kant': 'discovery-science',
  'isaac-newton': 'discovery-science', 'nikola-tesla': 'discovery-science',
  'galileo-galilei': 'discovery-science', democritus: 'discovery-science',
  'carl-linnaeus': 'discovery-science', 'carl-friedrich-gauss': 'discovery-science',
  'thales-of-miletus': 'discovery-science', 'gottfried-wilhelm-leibniz': 'discovery-science',
  'omar-khayyam': 'discovery-science', avicenna: 'discovery-science',
  herodotus: 'discovery-science', epicurus: 'discovery-science', 'adam-smith': 'discovery-science',
  'john-locke': 'discovery-science', plato: 'discovery-science', 'sun-tzu': 'discovery-science',
  'louis-pasteur': 'discovery-science', 'sigmund-freud': 'discovery-science',
  'thomas-edison': 'discovery-science',
  // Explorers → discovery-science
  'ferdinand-magellan': 'discovery-science', 'vasco-da-gama': 'discovery-science',
  'jacques-cartier': 'discovery-science', 'amelia-earhart': 'discovery-science',
  'ibn-battuta': 'discovery-science', 'jim-white': 'discovery-science',
  'james-cook': 'discovery-science',
  // Arts/culture
  'frederic-chopin': 'arts-culture', 'richard-wagner': 'arts-culture',
  'johann-sebastian-bach': 'arts-culture', 'albrecht-durer': 'arts-culture',
  'leonardo-da-vinci': 'arts-culture', 'li-bai': 'arts-culture',
  'johann-wolfgang-von-goethe': 'arts-culture', 'walt-disney': 'arts-culture',
  'oscar-wilde': 'arts-culture', 'franz-kafka': 'arts-culture',
  'gabriel-garcia-marquez': 'arts-culture', 'wolfgang-mozart': 'arts-culture',
  'bob-marley': 'arts-culture', caravaggio: 'arts-culture',
  'diego-rivera': 'arts-culture', 'ernest-hemingway': 'arts-culture',
  'mark-twain': 'arts-culture', 'alexander-pushkin': 'arts-culture',
  'hans-christian-andersen': 'arts-culture', sappho: 'arts-culture',
  'geoffrey-chaucer': 'arts-culture', moliere: 'arts-culture',
  'lord-byron': 'arts-culture', 'francisco-goya': 'arts-culture',
  'antonio-vivaldi': 'arts-culture', 'jean-jacques-rousseau': 'arts-culture',
  'leo-tolstoy': 'arts-culture', 'fyodor-dostoevsky': 'arts-culture',
  'miguel-de-cervantes': 'arts-culture', 'edgar-allan-poe': 'arts-culture',
  rembrandt: 'arts-culture', 'frida-kahlo': 'arts-culture',
  'marcel-proust': 'arts-culture', 'judy-garland': 'arts-culture',
  'johnny-ramone': 'arts-culture', 'leonard-bernstein': 'arts-culture',
  'cecil-b-demille': 'arts-culture', 'douglas-fairbanks': 'arts-culture',
  'irving-berlin': 'arts-culture', 'louis-comfort-tiffany': 'arts-culture',
  'mickey-rooney': 'arts-culture', 'gertrude-stein': 'arts-culture',
  'elizabeth-cady-stanton': 'political-drama',
  'joseph-pulitzer': 'arts-culture', 'fiorello-la-guardia': 'political-drama',
  // Battles/military
  timur: 'battles-conflicts', 'hannibal-barca': 'battles-conflicts',
  'alexander-the-great': 'battles-conflicts', 'horatio-nelson': 'battles-conflicts',
  geronimo: 'battles-conflicts', 'nelson-miles': 'battles-conflicts',
  'william-the-conqueror': 'battles-conflicts',
  // Political
  'alexander-hamilton': 'political-drama', 'harriet-tubman': 'political-drama',
  'vladimir-lenin': 'political-drama', 'fidel-castro': 'political-drama',
  charlemagne: 'political-drama', 'karl-marx': 'political-drama',
  'che-guevara': 'political-drama', 'simon-bolivar': 'political-drama',
  'mao-zedong': 'political-drama', 'mustafa-kemal-ataturk': 'political-drama',
  'genghis-khan': 'political-drama', 'otto-von-bismarck': 'political-drama',
  'marcus-aurelius': 'political-drama', tiberius: 'political-drama',
  tutankhamun: 'political-drama', hammurabi: 'political-drama',
  'john-adams': 'political-drama', 'peter-the-great': 'political-drama',
  'elizabeth-ii': 'political-drama', 'queen-victoria': 'political-drama',
  'charles-v-holy-roman-emperor': 'political-drama',
  'constantine-the-great': 'political-drama', nero: 'political-drama',
  'benjamin-franklin': 'political-drama', 'florence-nightingale': 'political-drama',
  'marie-curie': 'discovery-science', nostradamus: 'mystery-unexplained',
  'friedrich-nietzsche': 'arts-culture',
  // BG cemetery entities (new)
  'judy-garland-burial': 'arts-culture',
};

function getCategory(entityId: string): string {
  return CATEGORY_MAP[entityId] || 'political-drama';
}

const BIOGRAPHY_SYSTEM_PROMPT = `You generate biography story descriptions for Deep Maps, a geospatial storytelling app. Biography stories are invisible infrastructure — they're never displayed to users directly but are required for entity panels to show moments.

Rules for biography story descriptions (150-250 characters):
- Name-check 3-4 of the person's most dramatic moments/achievements in vivid shorthand
- Front-load the hook in the first ~60 characters (mobile truncation)
- End with a category statement tying the moments together
- No editorializing or superlatives — just factual drama
- Must feel like a movie trailer in miniature

Rules for tags (3-5 tags):
- Lowercase, relevant to the person's domain
- Include geographic tags if they're strongly associated with a place

Return JSON: { "description": "...", "tags": ["..."] }`;

// ── Phase A: Wire orphan moments to existing biography stories ──

async function phaseA() {
  const sb = getSupabase();
  console.log('═══════════════════════════════════════');
  console.log('  PHASE A: Wire moments to existing stories');
  console.log('═══════════════════════════════════════\n');

  // Find all moments that have entity links but no story_moments entry
  // AND where the entity HAS a canonical_story_id
  const { data: allMoments } = await sb
    .from('moments')
    .select('id, name');

  if (!allMoments) {
    console.log('No moments found');
    return { wired: 0 };
  }

  let wired = 0;
  let alreadyLinked = 0;
  let noEntityLink = 0;
  let noStory = 0;

  // Process in batches to avoid timeout
  for (const moment of allMoments) {
    // Check if already has story_moments entry
    const { data: storyLinks } = await sb
      .from('story_moments')
      .select('story_id')
      .eq('moment_id', moment.id);

    if (storyLinks && storyLinks.length > 0) {
      alreadyLinked++;
      continue;
    }

    // Find entity link
    const { data: entityLinks } = await sb
      .from('moment_entities')
      .select('entity_id')
      .eq('moment_id', moment.id);

    if (!entityLinks || entityLinks.length === 0) {
      noEntityLink++;
      continue;
    }

    // Check if any linked entity has a canonical_story_id
    let storyId: string | null = null;
    for (const link of entityLinks) {
      const { data: entity } = await sb
        .from('entities')
        .select('id, name, canonical_story_id')
        .eq('id', link.entity_id)
        .single();

      if (entity?.canonical_story_id) {
        storyId = entity.canonical_story_id;
        break;
      }
    }

    if (!storyId) {
      noStory++;
      continue;
    }

    // Wire it!
    const { data: existing } = await sb
      .from('story_moments')
      .select('sort_order')
      .eq('story_id', storyId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSort = (existing?.[0]?.sort_order ?? 0) + 1;

    if (DRY_RUN) {
      console.log(`  → ${moment.id}: would wire to ${storyId} (sort: ${nextSort})`);
    } else {
      const { error } = await sb.from('story_moments').insert({
        story_id: storyId,
        moment_id: moment.id,
        sort_order: nextSort,
        is_primary: false,
      });
      if (error) {
        console.error(`  ❌ ${moment.id}: ${error.message}`);
        continue;
      }
      console.log(`  ✓ ${moment.id} → ${storyId} (sort: ${nextSort})`);
    }
    wired++;
  }

  console.log(`\n  Phase A Results:`);
  console.log(`    Already linked: ${alreadyLinked}`);
  console.log(`    Newly wired: ${wired}`);
  console.log(`    No entity link: ${noEntityLink}`);
  console.log(`    Entity has no story: ${noStory}\n`);

  return { wired };
}

// ── Phase B: Create biography stories for orphan person entities ──

async function phaseB() {
  const sb = getSupabase();
  console.log('═══════════════════════════════════════');
  console.log('  PHASE B: Create biography stories');
  console.log('═══════════════════════════════════════\n');

  // Find person entities without canonical_story_id
  const { data: orphanEntities } = await sb
    .from('entities')
    .select('id, name, type, years, description, wikipedia_slug')
    .eq('type', 'person')
    .is('canonical_story_id', null);

  if (!orphanEntities || orphanEntities.length === 0) {
    console.log('No orphan person entities found!');
    return { created: 0 };
  }

  console.log(`Found ${orphanEntities.length} orphan person entities\n`);

  // Filter to entities that actually have moments
  const entitiesWithMoments: Array<{
    entity: typeof orphanEntities[0];
    momentIds: string[];
    momentNames: string[];
  }> = [];

  for (const entity of orphanEntities) {
    const { data: momentLinks } = await sb
      .from('moment_entities')
      .select('moment_id')
      .eq('entity_id', entity.id);

    if (momentLinks && momentLinks.length > 0) {
      // Get moment names for LLM context
      const momentIds = momentLinks.map(l => l.moment_id);
      const { data: moments } = await sb
        .from('moments')
        .select('id, name')
        .in('id', momentIds);

      entitiesWithMoments.push({
        entity,
        momentIds,
        momentNames: moments?.map(m => m.name) || [],
      });
    }
  }

  console.log(`${entitiesWithMoments.length} orphan entities have moments (${orphanEntities.length - entitiesWithMoments.length} have zero moments)\n`);

  // Check for existing biography stories that might already exist but aren't linked
  let created = 0;
  let skipped = 0;
  let errors = 0;
  const results: any[] = [];

  for (let i = 0; i < entitiesWithMoments.length; i++) {
    const { entity, momentIds, momentNames } = entitiesWithMoments[i];
    const storyId = `${entity.id}-biography`;

    console.log(`[${i + 1}/${entitiesWithMoments.length}] ${entity.name} (${momentIds.length} moments)`);

    // DUPLICATE CHECK: Does this biography story already exist?
    const { data: existingStory } = await sb
      .from('stories')
      .select('id')
      .eq('id', storyId)
      .single();

    if (existingStory) {
      // Story exists but entity doesn't reference it — just link them
      console.log(`  ⚡ Story ${storyId} exists — linking to entity`);
      if (!DRY_RUN) {
        await sb.from('entities').update({ canonical_story_id: storyId }).eq('id', entity.id);
      }
      skipped++;

      // Also wire any unlinked moments
      for (let j = 0; j < momentIds.length; j++) {
        const { data: existingLink } = await sb
          .from('story_moments')
          .select('story_id')
          .eq('story_id', storyId)
          .eq('moment_id', momentIds[j]);

        if (!existingLink || existingLink.length === 0) {
          const { data: maxSort } = await sb
            .from('story_moments')
            .select('sort_order')
            .eq('story_id', storyId)
            .order('sort_order', { ascending: false })
            .limit(1);
          const nextSort = (maxSort?.[0]?.sort_order ?? 0) + 1;

          if (!DRY_RUN) {
            await sb.from('story_moments').insert({
              story_id: storyId,
              moment_id: momentIds[j],
              sort_order: nextSort + j,
              is_primary: false,
            });
          }
          console.log(`  ✓ Wired moment ${momentIds[j]}`);
        }
      }
      continue;
    }

    // Generate description via LLM
    const category = getCategory(entity.id);
    const momentList = momentNames.slice(0, 6).join('; ');
    const prompt = `Generate a biography story description and tags for: ${entity.name}${entity.years ? ` (${entity.years})` : ''}

Their key moments in Deep Maps: ${momentList}

Category: ${category}
Wikipedia: ${entity.wikipedia_slug || 'none'}`;

    try {
      const result = await generateJSON<{ description: string; tags: string[] }>({
        system: BIOGRAPHY_SYSTEM_PROMPT,
        prompt,
        maxTokens: 512,
        temperature: 0.3,
      });

      // Validate description length
      if (result.description.length < 100 || result.description.length > 300) {
        console.log(`  ⚠ Description length ${result.description.length} — adjusting`);
        if (result.description.length > 300) {
          result.description = result.description.slice(0, 247) + '...';
        }
      }

      const storyRow = {
        id: storyId,
        name: entity.name,
        years: entity.years || '',
        category,
        story_type: 'biography' as const,
        description: result.description,
        tags: result.tags || [],
        wikipedia_slug: entity.wikipedia_slug || null,
      };

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would create: ${storyId}`);
        console.log(`  [DRY RUN] Description: ${result.description.slice(0, 80)}...`);
      } else {
        // 1. Insert story
        const { error: storyErr } = await sb.from('stories').insert(storyRow);
        if (storyErr) {
          console.error(`  ❌ Story insert failed: ${storyErr.message}`);
          errors++;
          continue;
        }

        // 2. Update entity canonical_story_id
        const { error: entityErr } = await sb
          .from('entities')
          .update({ canonical_story_id: storyId })
          .eq('id', entity.id);
        if (entityErr) {
          console.error(`  ❌ Entity update failed: ${entityErr.message}`);
        }

        // 3. Wire moments to story
        for (let j = 0; j < momentIds.length; j++) {
          const { error: linkErr } = await sb.from('story_moments').insert({
            story_id: storyId,
            moment_id: momentIds[j],
            sort_order: j + 1,
            is_primary: j === 0,
          });
          if (linkErr) {
            console.error(`  ⚠ story_moments link failed for ${momentIds[j]}: ${linkErr.message}`);
          }
        }

        console.log(`  ✓ Created ${storyId} (${result.description.slice(0, 60)}...)`);
      }

      results.push({ entityId: entity.id, storyId, ...storyRow });
      created++;
    } catch (err) {
      console.error(`  ❌ LLM failed for ${entity.name}: ${(err as Error).message}`);
      errors++;
    }

    // Rate limit (1 req/sec)
    if (i < entitiesWithMoments.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Save results for audit
  writeFileSync(
    resolve(OUTPUT_DIR, 'orphan-biography-results.json'),
    JSON.stringify(results, null, 2),
  );

  console.log(`\n  Phase B Results:`);
  console.log(`    Created: ${created}`);
  console.log(`    Skipped (already existed): ${skipped}`);
  console.log(`    Errors: ${errors}`);
  console.log(`    Output: scripts/output/orphan-biography-results.json\n`);

  return { created };
}

// ── Main ──

async function main() {
  console.log(`\n🔧 Fix Orphan Biographies ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}\n`);

  if (RUN_BOTH || PHASE_A_ONLY) {
    await phaseA();
  }

  if (RUN_BOTH || PHASE_B_ONLY) {
    await phaseB();
  }

  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
