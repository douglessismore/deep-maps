/**
 * Investigate 9 suspected duplicate moment pairs flagged in
 * handoff-narratives.md. For each pair, fetch both moments and show:
 *   - name, year, coordinates, description preview
 *   - story_moments references (which stories wire each ID)
 *   - collection_moments references (which collections wire each ID)
 *   - moment_entities references (which entities wire each ID)
 *
 * Output lets us decide which ID to keep vs delete.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const pairs: Array<[string, string]> = [
  ['rosetta-stone-british-museum', 'rosetta-stone-arrives-british-museum-1802'],
  ['london-blitz-begins-1940', 'blitz-london-1940'],
  ['inv-fleming-penicillin', 'penicillin-discovered-1928'],
  ['marley-records-exodus-london-1977', 'bob-marley-records-exodus-london-1977'],
  ['keats-dies-spanish-steps-1821', 'keats-dies-spanish-steps'],
  ['colosseum-opens-ad-80', 'construction-colosseum-80ce'],
  ['october-revolution-winter-palace-1917', 'russian-revolution-winter-palace-1917'],
  ['alexander-dies-babylon', 'alexander-dies-babylon-323bce'],
  ['library-alexandria-destroyed-48bce', 'library-alexandria-burns-48bce'],
];

async function loadAllRefs(table: string, col: string) {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select('*').range(from, from + 999);
    if (error) { console.error(table, error); break; }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

(async () => {
  const [storyMoments, collectionMoments, momentEntities] = await Promise.all([
    loadAllRefs('story_moments', 'moment_id'),
    loadAllRefs('collection_moments', 'moment_id'),
    loadAllRefs('moment_entities', 'moment_id'),
  ]);
  const smByMoment = new Map<string, any[]>();
  for (const r of storyMoments) {
    if (!smByMoment.has(r.moment_id)) smByMoment.set(r.moment_id, []);
    smByMoment.get(r.moment_id)!.push(r);
  }
  const cmByMoment = new Map<string, any[]>();
  for (const r of collectionMoments) {
    if (!cmByMoment.has(r.moment_id)) cmByMoment.set(r.moment_id, []);
    cmByMoment.get(r.moment_id)!.push(r);
  }
  const meByMoment = new Map<string, any[]>();
  for (const r of momentEntities) {
    if (!meByMoment.has(r.moment_id)) meByMoment.set(r.moment_id, []);
    meByMoment.get(r.moment_id)!.push(r);
  }

  for (const [a, b] of pairs) {
    console.log('\n=== PAIR ===');
    for (const id of [a, b]) {
      const { data } = await sb.from('moments').select('id,name,subtitle,year,location,description').eq('id', id).maybeSingle();
      const sm = smByMoment.get(id) || [];
      const cm = cmByMoment.get(id) || [];
      const me = meByMoment.get(id) || [];
      if (!data) {
        console.log(`  [${id}] MISSING`);
        continue;
      }
      const coords = data.location?.coordinates;
      console.log(`  [${id}]`);
      console.log(`    name:  ${data.name}`);
      console.log(`    year:  ${data.year}`);
      console.log(`    coord: ${coords ? `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}` : 'n/a'}`);
      console.log(`    desc:  ${(data.description || '').slice(0, 120)}`);
      console.log(`    stories:     ${sm.length} ${sm.map(r => r.story_id).join(', ')}`);
      console.log(`    collections: ${cm.length} ${cm.map(r => r.collection_id).join(', ')}`);
      console.log(`    entities:    ${me.length}`);
    }
  }
})();
