#!/usr/bin/env npx tsx
/**
 * Generate burial moments for 15 missing US Presidents.
 * These were NOT found on BillionGraves, so burial GPS is from
 * Wikipedia/FindAGrave research.
 *
 * Creates: entity (if needed) + burial moment + biography story + all wiring.
 *
 * Usage:
 *   npx tsx scripts/ingest/presidents-missing-generate.ts --dry-run
 *   npx tsx scripts/ingest/presidents-missing-generate.ts
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

// ── 15 Missing Presidents — researched burial data ──

interface PresidentBurial {
  entityId: string;
  name: string;
  years: string;
  deathYear: number;
  cemetery: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  wikipediaSlug: string;
  findAGraveUrl?: string;
}

const MISSING_PRESIDENTS: PresidentBurial[] = [
  {
    entityId: 'john-adams',
    name: 'John Adams',
    years: '1735–1826',
    deathYear: 1826,
    cemetery: 'United First Parish Church',
    city: 'Quincy',
    state: 'Massachusetts',
    lat: 42.2510,
    lng: -71.0025,
    wikipediaSlug: 'John_Adams',
  },
  {
    entityId: 'james-madison',
    name: 'James Madison',
    years: '1751–1836',
    deathYear: 1836,
    cemetery: 'Montpelier',
    city: 'Orange',
    state: 'Virginia',
    lat: 38.2201,
    lng: -78.1725,
    wikipediaSlug: 'James_Madison',
  },
  {
    entityId: 'william-henry-harrison',
    name: 'William Henry Harrison',
    years: '1773–1841',
    deathYear: 1841,
    cemetery: 'Harrison Tomb State Memorial',
    city: 'North Bend',
    state: 'Ohio',
    lat: 39.1458,
    lng: -84.7336,
    wikipediaSlug: 'William_Henry_Harrison',
  },
  {
    entityId: 'james-k-polk',
    name: 'James K. Polk',
    years: '1795–1849',
    deathYear: 1849,
    cemetery: 'Tennessee State Capitol',
    city: 'Nashville',
    state: 'Tennessee',
    lat: 36.1658,
    lng: -86.7844,
    wikipediaSlug: 'James_K._Polk',
  },
  {
    entityId: 'james-buchanan',
    name: 'James Buchanan',
    years: '1791–1868',
    deathYear: 1868,
    cemetery: 'Woodward Hill Cemetery',
    city: 'Lancaster',
    state: 'Pennsylvania',
    lat: 40.0378,
    lng: -76.3028,
    wikipediaSlug: 'James_Buchanan',
  },
  {
    entityId: 'rutherford-b-hayes',
    name: 'Rutherford B. Hayes',
    years: '1822–1893',
    deathYear: 1893,
    cemetery: 'Spiegel Grove',
    city: 'Fremont',
    state: 'Ohio',
    lat: 41.3516,
    lng: -83.1147,
    wikipediaSlug: 'Rutherford_B._Hayes',
  },
  {
    entityId: 'james-a-garfield',
    name: 'James A. Garfield',
    years: '1831–1881',
    deathYear: 1881,
    cemetery: 'Lake View Cemetery',
    city: 'Cleveland',
    state: 'Ohio',
    lat: 41.5137,
    lng: -81.5923,
    wikipediaSlug: 'James_A._Garfield',
  },
  {
    entityId: 'chester-a-arthur',
    name: 'Chester A. Arthur',
    years: '1829–1886',
    deathYear: 1886,
    cemetery: 'Albany Rural Cemetery',
    city: 'Menands',
    state: 'New York',
    lat: 42.6917,
    lng: -73.7256,
    wikipediaSlug: 'Chester_A._Arthur',
  },
  {
    entityId: 'william-mckinley',
    name: 'William McKinley',
    years: '1843–1901',
    deathYear: 1901,
    cemetery: 'McKinley National Memorial',
    city: 'Canton',
    state: 'Ohio',
    lat: 40.7995,
    lng: -81.3786,
    wikipediaSlug: 'William_McKinley',
  },
  {
    entityId: 'woodrow-wilson',
    name: 'Woodrow Wilson',
    years: '1856–1924',
    deathYear: 1924,
    cemetery: 'Washington National Cathedral',
    city: 'Washington',
    state: 'D.C.',
    lat: 38.9306,
    lng: -77.0711,
    wikipediaSlug: 'Woodrow_Wilson',
  },
  {
    entityId: 'warren-g-harding',
    name: 'Warren G. Harding',
    years: '1865–1923',
    deathYear: 1923,
    cemetery: 'Harding Memorial',
    city: 'Marion',
    state: 'Ohio',
    lat: 40.5969,
    lng: -83.1195,
    wikipediaSlug: 'Warren_G._Harding',
  },
  {
    entityId: 'john-f-kennedy',
    name: 'John F. Kennedy',
    years: '1917–1963',
    deathYear: 1963,
    cemetery: 'Arlington National Cemetery',
    city: 'Arlington',
    state: 'Virginia',
    lat: 38.8808,
    lng: -77.0711,
    wikipediaSlug: 'John_F._Kennedy',
  },
  {
    entityId: 'richard-nixon',
    name: 'Richard Nixon',
    years: '1913–1994',
    deathYear: 1994,
    cemetery: 'Richard Nixon Presidential Library',
    city: 'Yorba Linda',
    state: 'California',
    lat: 33.8692,
    lng: -117.8117,
    wikipediaSlug: 'Richard_Nixon',
  },
  {
    entityId: 'gerald-ford',
    name: 'Gerald Ford',
    years: '1913–2006',
    deathYear: 2006,
    cemetery: 'Gerald R. Ford Presidential Museum',
    city: 'Grand Rapids',
    state: 'Michigan',
    lat: 42.9681,
    lng: -85.6775,
    wikipediaSlug: 'Gerald_Ford',
  },
  {
    entityId: 'jimmy-carter',
    name: 'Jimmy Carter',
    years: '1924–2024',
    deathYear: 2024,
    cemetery: 'Maranatha Baptist Church',
    city: 'Plains',
    state: 'Georgia',
    lat: 32.0341,
    lng: -84.3932,
    wikipediaSlug: 'Jimmy_Carter',
  },
];

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
- No pronouns without antecedent. Specific > vague.

Return JSON with:
- entity: { description }
- moment: { name, subtitle, description, date, year }`;

async function main() {
  const sb = getSupabase();
  console.log(`Generating ${MISSING_PRESIDENTS.length} missing president burial moments ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}\n`);

  const generated: any[] = [];
  let succeeded = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < MISSING_PRESIDENTS.length; i++) {
    const p = MISSING_PRESIDENTS[i];
    const momentId = `${p.entityId}-burial`;
    console.log(`[${i + 1}/${MISSING_PRESIDENTS.length}] ${p.name} — ${p.cemetery}, ${p.state}`);

    // Check if moment already exists
    const { data: existingMoment } = await sb.from('moments').select('id').eq('id', momentId).single();
    if (existingMoment) {
      console.log(`  ⏭ Burial moment already exists — skipping`);
      skipped++;
      continue;
    }

    // Generate content via LLM
    const prompt = `Generate burial content for ${p.name} (${p.years}, d. ${p.deathYear}).
Burial location: ${p.cemetery}, ${p.city}, ${p.state}
GPS: ${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}
Wikipedia: https://en.wikipedia.org/wiki/${p.wikipediaSlug}`;

    try {
      const result = await generateJSON<{
        entity: { description: string };
        moment: { name: string; subtitle: string; description: string; date?: string; year: number };
      }>({
        system: SYSTEM_PROMPT,
        prompt,
        maxTokens: 1024,
        temperature: 0.3,
      });

      console.log(`  ✓ "${result.moment.name.slice(0, 60)}..."`);

      // Check if entity exists
      const { data: existingEntity } = await sb.from('entities').select('id').eq('id', p.entityId).single();
      const entityExists = !!existingEntity;

      const entityData = {
        id: p.entityId,
        name: p.name,
        type: 'person' as const,
        years: p.years,
        description: result.entity.description,
        wikipedia_slug: p.wikipediaSlug,
      };

      const momentData = {
        id: momentId,
        name: result.moment.name,
        subtitle: result.moment.subtitle,
        description: result.moment.description,
        type_id: 'burial',
        importance: 'minor' as const,
        accuracy: 'exact' as const,
        kind: 'milestone' as const,
        year: result.moment.year || p.deathYear,
        date: result.moment.date,
        address: `${p.cemetery}, ${p.city}, ${p.state}`,
        verification_level: 'verified' as const,
        source: 'editorial',
      };

      generated.push({
        entity: entityData,
        moment: momentData,
        gps: { lat: p.lat, lng: p.lng },
        cemetery: p.cemetery,
      });

      if (!DRY_RUN) {
        // 1. Create entity if needed
        if (!entityExists) {
          const { error: entityErr } = await sb.from('entities').insert(entityData);
          if (entityErr) {
            console.error(`  ❌ Entity insert failed: ${entityErr.message}`);
            errors++;
            continue;
          }
          console.log(`  ✓ Created entity: ${p.entityId}`);
        }

        // 2. Create biography story if entity has no canonical_story_id
        const { data: entityCheck } = await sb.from('entities').select('canonical_story_id').eq('id', p.entityId).single();
        if (!entityCheck?.canonical_story_id) {
          const storyId = `${p.entityId}-biography`;
          const { data: existingStory } = await sb.from('stories').select('id').eq('id', storyId).single();

          if (!existingStory) {
            const { error: storyErr } = await sb.from('stories').insert({
              id: storyId,
              name: p.name,
              years: p.years,
              category: 'political-drama',
              story_type: 'biography',
              description: result.entity.description,
              tags: ['presidents', 'american-history', 'burial'],
              wikipedia_slug: p.wikipediaSlug,
            });
            if (storyErr) {
              console.error(`  ❌ Story insert failed: ${storyErr.message}`);
            } else {
              console.log(`  ✓ Created biography story: ${storyId}`);
            }
          }

          // Link entity to story
          await sb.from('entities').update({ canonical_story_id: storyId }).eq('id', p.entityId);
        }

        // 3. Insert moment with PostGIS location
        const { error: momentErr } = await sb.from('moments').insert({
          ...momentData,
          location: `SRID=4326;POINT(${p.lng} ${p.lat})`,
        });

        if (momentErr) {
          // Fallback: insert without location, then use RPC
          console.log(`  ⚠ EWKT insert failed (${momentErr.message}), trying RPC...`);
          const { error: momentErr2 } = await sb.from('moments').insert(momentData);
          if (momentErr2) {
            console.error(`  ❌ Moment insert failed: ${momentErr2.message}`);
            errors++;
            continue;
          }
          await sb.rpc('update_moment_location', {
            p_id: momentId,
            p_lng: p.lng,
            p_lat: p.lat,
            p_source_url: null,
          });
        }

        // 4. Link moment to entity
        const { error: meErr } = await sb.from('moment_entities').insert({
          moment_id: momentId,
          entity_id: p.entityId,
        });
        if (meErr) console.error(`  ⚠ moment_entities: ${meErr.message}`);

        // 5. Link moment to biography story
        const { data: entityFinal } = await sb.from('entities').select('canonical_story_id').eq('id', p.entityId).single();
        if (entityFinal?.canonical_story_id) {
          const { data: maxSort } = await sb
            .from('story_moments')
            .select('sort_order')
            .eq('story_id', entityFinal.canonical_story_id)
            .order('sort_order', { ascending: false })
            .limit(1);
          const nextSort = (maxSort?.[0]?.sort_order ?? 0) + 1;

          const { error: smErr } = await sb.from('story_moments').insert({
            story_id: entityFinal.canonical_story_id,
            moment_id: momentId,
            sort_order: nextSort,
            is_primary: false,
          });
          if (smErr) console.error(`  ⚠ story_moments: ${smErr.message}`);
          else console.log(`  ✓ Linked to story ${entityFinal.canonical_story_id}`);
        }

        console.log(`  ✓ Published ${momentId}`);
      } else {
        console.log(`  [DRY RUN] Would create entity + moment + story`);
      }

      succeeded++;
    } catch (err) {
      console.error(`  ❌ Failed: ${(err as Error).message}`);
      errors++;
    }

    // Rate limit
    if (i < MISSING_PRESIDENTS.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  writeFileSync(
    resolve(OUTPUT_DIR, 'presidents-missing-generated.json'),
    JSON.stringify(generated, null, 2),
  );

  console.log('\n═══════════════════════════════════════');
  console.log(`  Generated: ${succeeded}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Output: scripts/output/presidents-missing-generated.json`);
  console.log('═══════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
