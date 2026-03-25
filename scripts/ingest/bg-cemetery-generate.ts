#!/usr/bin/env npx tsx
/**
 * Generate burial moments + entities for cemetery discoveries.
 * These are NEW people not yet in Deep Maps. Creates:
 *   1. Entity (person type)
 *   2. Burial moment with BG pinpoint GPS
 *   3. Inserts both into Supabase directly
 *
 * Usage:
 *   npx tsx scripts/ingest/bg-cemetery-generate.ts --dry-run
 *   npx tsx scripts/ingest/bg-cemetery-generate.ts
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

const SYSTEM_PROMPT = `You are a content writer for Deep Maps, a geospatial storytelling app. Generate content for a notable person's burial moment.

Rules for the ENTITY description (200-350 chars):
- First 8 words = hook for mobile preview
- 2-3 key facts about the person
- One memorable detail

Rules for the MOMENT name (60-110 chars):
- Lead with person's name + verb
- Include one specific detail that hooks interest

Rules for the MOMENT subtitle (60-140 chars):
- Cemetery name + address + one physical detail about the grave

Rules for the MOMENT description (300-450 chars):
- Standalone narrative: death circumstances, burial details, one ironic/surprising detail
- No pronouns without antecedent. Specific > vague.

Return JSON with:
- entity: { description, category }
- moment: { name, subtitle, description, date, year }

Category must be one of: dark-history, last-stands, discovery-science, arts-culture, mystery-unexplained, political-drama, everyday-extraordinary`;

interface CemeteryMatch {
  entityId: string;
  name: string;
  deathYear: number;
  cemetery: string;
  city: string;
  bgRecordId: number;
  lat: number;
  lng: number;
  cemeteryName: string;
  cemeteryCity: string;
  cemeteryState: string;
  cemeteryCountry: string;
  bgUrl: string;
}

async function main() {
  const matches: CemeteryMatch[] = JSON.parse(
    readFileSync(resolve(OUTPUT_DIR, 'bg-cemetery-with-gps.json'), 'utf-8')
  );

  const sb = getSupabase();
  console.log(`Generating ${matches.length} cemetery burial moments ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}\n`);

  const generated: any[] = [];
  let succeeded = 0;
  let skipped = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    console.log(`[${i + 1}/${matches.length}] ${m.name} — ${m.cemetery}, ${m.city}`);

    // Check if entity already exists
    const { data: existing } = await sb
      .from('entities')
      .select('id')
      .eq('id', m.entityId)
      .single();

    // Check if moment already exists (entity may exist from failed previous run)
    const { data: existingMoment } = await sb
      .from('moments')
      .select('id')
      .eq('id', `${m.entityId}-burial`)
      .single();

    if (existingMoment) {
      console.log(`  ⏭ Moment ${m.entityId}-burial already exists — skipping`);
      skipped++;
      continue;
    }

    const entityExists = !!existing;

    // Generate content via LLM
    const prompt = `Generate burial content for ${m.name} (${m.deathYear ? 'd. ' + m.deathYear : 'dates unknown'}).
Cemetery: ${m.cemeteryName}, ${m.cemeteryCity}, ${m.cemeteryState}, ${m.cemeteryCountry}
GPS: ${m.lat.toFixed(6)}, ${m.lng.toFixed(6)}
BillionGraves: ${m.bgUrl}`;

    try {
      const result = await generateJSON<{
        entity: { description: string; category: string };
        moment: { name: string; subtitle: string; description: string; date?: string; year: number };
      }>({
        system: SYSTEM_PROMPT,
        prompt,
        maxTokens: 1024,
        temperature: 0.3,
      });

      console.log(`  ✓ "${result.moment.name}"`);

      const entityData = {
        id: m.entityId,
        name: m.name,
        type: 'person',
        years: `${m.deathYear ? '?–' + m.deathYear : 'unknown'}`,
        description: result.entity.description,
        wikipedia_slug: m.name.replace(/\s+/g, '_'),
      };

      const momentData = {
        id: `${m.entityId}-burial`,
        name: result.moment.name,
        subtitle: result.moment.subtitle,
        description: result.moment.description,
        lat: m.lat,
        lng: m.lng,
        type_id: 'burial',
        importance: 'minor',
        accuracy: 'pinpoint',
        kind: 'milestone',
        year: result.moment.year || m.deathYear,
        date: result.moment.date,
        address: `${m.cemeteryName}, ${m.cemeteryCity}, ${m.cemeteryState}, ${m.cemeteryCountry}`,
        verification_level: 'verified',
        source: 'billiongraves',
        source_id: String(m.bgRecordId),
        geo_verified: true,
        geo_source_url: m.bgUrl,
        geo_verified_at: new Date().toISOString(),
        category: result.entity.category,
      };

      generated.push({ entity: entityData, moment: momentData, cemetery: m.cemetery });

      if (!DRY_RUN) {
        // Insert entity (skip if already exists)
        if (!entityExists) {
          const { error: entityErr } = await sb.from('entities').insert(entityData);
          if (entityErr) {
            console.error(`  ❌ Entity insert failed: ${entityErr.message}`);
            continue;
          }
        }

        // Insert moment WITH PostGIS location
        const { category, lat, lng, ...momentRow } = momentData;
        const momentWithLocation = {
          ...momentRow,
          location: `SRID=4326;POINT(${m.lng} ${m.lat})`,
        };
        const { error: momentErr } = await sb.from('moments').insert(momentWithLocation);
        if (momentErr) {
          // Try alternative: insert without location, then use RPC
          console.log(`  ⚠ EWKT insert failed, trying RPC approach...`);
          const { error: momentErr2 } = await sb.from('moments').insert(momentRow);
          if (momentErr2) {
            console.error(`  ❌ Moment insert failed: ${momentErr2.message}`);
            continue;
          }
          await sb.rpc('update_moment_location', {
            p_id: momentData.id,
            p_lng: m.lng,
            p_lat: m.lat,
            p_source_url: m.bgUrl,
          });
        }

        // Link entity to moment
        await sb.from('moment_entities').insert({
          moment_id: momentData.id,
          entity_id: m.entityId,
        });

        console.log(`  ✓ Published entity + moment`);
      }

      succeeded++;
    } catch (err) {
      console.error(`  ❌ Failed: ${(err as Error).message}`);
    }

    // Rate limit
    if (i < matches.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  writeFileSync(
    resolve(OUTPUT_DIR, 'bg-cemetery-generated.json'),
    JSON.stringify(generated, null, 2)
  );

  console.log('\n═══════════════════════════════════════');
  console.log(`  Generated: ${succeeded}`);
  console.log(`  Skipped (existing): ${skipped}`);
  console.log(`  Written to: bg-cemetery-generated.json`);
  console.log('═══════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
