#!/usr/bin/env npx tsx
/**
 * Generate + publish burial moments for US Presidents.
 * Creates new entities where needed, burial moments for all.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getSupabase } from './lib/pipeline.js';
import { generateJSON } from './lib/llm-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '../output');
const DRY_RUN = process.argv.includes('--dry-run');

const SYSTEM_PROMPT = `You are a content writer for Deep Maps, a geospatial storytelling app. Generate a burial moment for a US President.

Rules for ENTITY description (200-350 chars):
- First 8 words = hook for mobile preview
- Key facts about their presidency
- One memorable personal detail

Rules for MOMENT name (60-110 chars):
- Lead with president's name + verb
- Include one specific detail about the burial (ironic, surprising, or evocative)

Rules for MOMENT subtitle (60-140 chars):
- Cemetery/site name + address + one physical detail about the grave or monument

Rules for MOMENT description (300-480 chars):
- Death date and circumstances
- Burial location details
- One surprising or ironic detail
- No pronouns without antecedent

Return JSON with:
- entity: { description, years }
- moment: { name, subtitle, description, date, year }`;

async function main() {
  const matches = JSON.parse(readFileSync(resolve(OUTPUT_DIR, 'bg-presidents-with-gps.json'), 'utf-8'));
  const sb = getSupabase();

  console.log(`Generating ${matches.length} president burial moments ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}\n`);

  const generated: any[] = [];
  let succeeded = 0;
  let skipped = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    console.log(`[${i + 1}/${matches.length}] ${m.name} — ${m.cemeteryName}, ${m.cemeteryState}`);

    // Check if burial moment already exists
    const momentId = `${m.entityId}-burial`;
    const { data: existingMoment } = await sb.from('moments').select('id').eq('id', momentId).single();
    if (existingMoment) {
      console.log(`  ⏭ Already exists`);
      skipped++;
      continue;
    }

    // Check if entity exists
    const { data: existingEntity } = await sb.from('entities').select('id').eq('id', m.entityId).single();

    // Generate content
    const prompt = `Generate burial content for President ${m.name} (${m.deathYear ? 'd. ' + m.deathYear : ''}).
Burial site: ${m.cemeteryName}, ${m.cemeteryCity}, ${m.cemeteryState}
Expected location: ${m.expectedBurial}
GPS: ${m.lat.toFixed(6)}, ${m.lng.toFixed(6)}`;

    try {
      const result = await generateJSON<{
        entity: { description: string; years: string };
        moment: { name: string; subtitle: string; description: string; date?: string; year: number };
      }>({
        system: SYSTEM_PROMPT,
        prompt,
        maxTokens: 1024,
        temperature: 0.3,
      });

      // Trim description if over 500
      let desc = result.moment.description;
      if (desc.length > 500) {
        desc = desc.slice(0, 497) + '...';
      }

      console.log(`  ✓ "${result.moment.name}"`);

      generated.push({
        entity: {
          id: m.entityId,
          name: m.name,
          type: 'person',
          years: result.entity.years,
          description: result.entity.description,
          wikipedia_slug: m.name.replace(/\s+/g, '_'),
          isNew: !existingEntity,
        },
        moment: {
          id: momentId,
          name: result.moment.name,
          subtitle: result.moment.subtitle,
          description: desc,
          year: result.moment.year || m.deathYear,
          date: result.moment.date,
        },
        gps: { lat: m.lat, lng: m.lng },
        cemetery: m.cemeteryName,
        bgUrl: m.bgUrl,
        bgRecordId: m.bgRecordId,
      });

      if (!DRY_RUN) {
        // Create entity if new
        if (!existingEntity) {
          const { error } = await sb.from('entities').insert({
            id: m.entityId,
            name: m.name,
            type: 'person',
            years: result.entity.years,
            description: result.entity.description,
            wikipedia_slug: m.name.replace(/\s+/g, '_'),
          });
          if (error) { console.error(`  ❌ Entity: ${error.message}`); continue; }
        }

        // Create moment with PostGIS location
        const { error: mErr } = await sb.from('moments').insert({
          id: momentId,
          name: result.moment.name,
          subtitle: result.moment.subtitle,
          description: desc,
          type_id: 'burial',
          importance: 'major',
          accuracy: 'pinpoint',
          kind: 'milestone',
          year: result.moment.year || m.deathYear,
          date: result.moment.date,
          address: `${m.cemeteryName}, ${m.cemeteryCity}, ${m.cemeteryState}`,
          verification_level: 'verified',
          source: 'billiongraves',
          source_id: String(m.bgRecordId),
          geo_verified: true,
          geo_source_url: m.bgUrl,
          geo_verified_at: new Date().toISOString(),
          location: `SRID=4326;POINT(${m.lng} ${m.lat})`,
        });

        if (mErr) {
          console.error(`  ❌ Moment: ${mErr.message}`);
          continue;
        }

        // Link entity to moment
        await sb.from('moment_entities').insert({ moment_id: momentId, entity_id: m.entityId });

        // Link to story if entity has one
        if (existingEntity) {
          const { data: ent } = await sb.from('entities').select('canonical_story_id').eq('id', m.entityId).single();
          if (ent?.canonical_story_id) {
            const { data: sm } = await sb.from('story_moments').select('sort_order').eq('story_id', ent.canonical_story_id).order('sort_order', { ascending: false }).limit(1);
            await sb.from('story_moments').insert({
              story_id: ent.canonical_story_id,
              moment_id: momentId,
              sort_order: (sm?.[0]?.sort_order ?? 0) + 1,
              is_primary: false,
            });
            console.log(`  ✓ Linked to story: ${ent.canonical_story_id}`);
          }
        }

        console.log(`  ✓ Published`);
      }

      succeeded++;
    } catch (err) {
      console.error(`  ❌ ${(err as Error).message}`);
    }

    if (i < matches.length - 1) await new Promise(r => setTimeout(r, 1000));
  }

  writeFileSync(resolve(OUTPUT_DIR, 'bg-presidents-generated.json'), JSON.stringify(generated, null, 2));

  console.log('\n═══════════════════════════════════════');
  console.log(`  Generated: ${succeeded}`);
  console.log(`  Skipped: ${skipped}`);
  console.log('═══════════════════════════════════════');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
