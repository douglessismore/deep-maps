import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function loadAll(table: string, select: string) {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(select).range(from, from + 999);
    if (error) { console.error(table, error); break; }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

(async () => {
  const queries = [
    'starbucks', 'coffee bean', 'rave', 'bezos', 'ridgway', 'five bodies',
    'oregon trail', 'celilo', 'hanford', 'plutonium', 'fish at celilo'
  ];

  const [storyMoments, collectionMoments] = await Promise.all([
    loadAll('story_moments', 'story_id,moment_id'),
    loadAll('collection_moments', 'collection_id,moment_id'),
  ]);
  const inStory = new Map<string, string[]>();
  for (const r of storyMoments) {
    if (!inStory.has(r.moment_id)) inStory.set(r.moment_id, []);
    inStory.get(r.moment_id)!.push(r.story_id);
  }
  const inColl = new Map<string, string[]>();
  for (const r of collectionMoments) {
    if (!inColl.has(r.moment_id)) inColl.set(r.moment_id, []);
    inColl.get(r.moment_id)!.push(r.collection_id);
  }

  for (const q of queries) {
    const { data } = await sb.from('moments').select('id,name,year,lat,lng').ilike('name', `%${q}%`);
    console.log(`\n=== ${q} (${data?.length || 0}) ===`);
    for (const m of data || []) {
      const stories = inStory.get(m.id) || [];
      const colls = inColl.get(m.id) || [];
      console.log(`  ${m.id} (${m.year}) [${m.lat.toFixed(3)},${m.lng.toFixed(3)}]`);
      console.log(`    ${m.name.slice(0, 100)}`);
      console.log(`    stories: [${stories.join(',')}]  collections: [${colls.join(',')}]`);
    }
  }
})();
