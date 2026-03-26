/**
 * Drift detection: compare Supabase row counts vs static file counts.
 * Warns if content exists in one source but not the other.
 *
 * Usage:
 *   npx tsx scripts/check-drift.ts
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var (from .env.local)
 */
import { createClient } from '@supabase/supabase-js';
import { moments } from '../src/data/moments';
import { entities } from '../src/data/entities';
import { stories } from '../src/data/stories';
import { collections } from '../src/data/collections';

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local or as an env var.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getCount(table: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) {
    console.error(`  Error counting ${table}: ${error.message}`);
    return -1;
  }
  return count ?? 0;
}

async function main() {
  console.log('Drift Detection: Supabase vs Static Files\n');

  const supabaseCounts = {
    moments: await getCount('moments'),
    stories: await getCount('stories'),
    entities: await getCount('entities'),
    collections: await getCount('collections'),
  };

  const staticCounts = {
    moments: moments.length,
    stories: stories.length,
    entities: entities.length,
    collections: collections.length,
  };

  let driftFound = false;

  for (const table of ['moments', 'stories', 'entities', 'collections'] as const) {
    const sb = supabaseCounts[table];
    const st = staticCounts[table];
    const diff = sb - st;
    const status = diff === 0 ? '✅' : diff > 0 ? '⚠️ ' : '🔴';

    console.log(`  ${status} ${table.padEnd(12)} Supabase: ${sb.toString().padStart(5)}  Static: ${st.toString().padStart(5)}  Δ: ${diff >= 0 ? '+' : ''}${diff}`);

    if (diff !== 0) driftFound = true;
  }

  console.log('');
  if (driftFound) {
    console.log('⚠️  Drift detected. Run `npx tsx scripts/dump-from-supabase.ts` to sync static files.');
    process.exit(1);
  } else {
    console.log('✅ No drift — static files match Supabase.');
  }
}

main().catch(console.error);
