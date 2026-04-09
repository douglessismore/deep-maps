/**
 * Create the "Seattle Dark History" collection and wire qualifying orphan
 * moments to it.
 *
 * Schema notes (verified against live Supabase):
 *   collections: id, name, subtitle, description, tags, review_status, created_at, updated_at
 *     (no icon/category columns — icon/category are frontend concerns elsewhere)
 *   collection_moments: collection_id, moment_id, sort_order
 *
 * Curation: Seattle bbox (lat 47.4–47.8, lng -122.5 – -122.2) orphans filtered
 * to obvious dark-history themes. As of this run, only one orphan qualifies:
 *   - sea-capitol-hill-massacre (2006)
 * (The other Seattle orphan is the 1919 General Strike, which is labor
 * history, not dark history — excluded.)
 *
 * Pass --apply to execute; default is dry run.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const APPLY = process.argv.includes('--apply');

const COLLECTION = {
  id: 'seattle-dark-history',
  name: 'Seattle Dark History',
  subtitle: 'Murders, massacres, and crimes that shook the Emerald City',
  description:
    "Beneath Seattle's rain and coffee culture lies a darker story. From gunmen opening fire on partygoers to the crimes that made national headlines, these are the places where the Pacific Northwest's shadows gathered. A growing collection — more entries will be added as orphaned moments are wired in.",
  tags: ['seattle', 'dark-history', 'crime', 'murder'],
  review_status: 'unreviewed',
};

// Verified moment IDs to wire. Order = sort_order.
const MOMENT_IDS = [
  'sea-capitol-hill-massacre',
];

(async () => {
  console.log(APPLY ? '=== APPLY MODE ===\n' : '=== DRY RUN (pass --apply) ===\n');

  // Verify moments exist
  const { data: moments, error: mErr } = await sb
    .from('moments')
    .select('id,name,year,address')
    .in('id', MOMENT_IDS);
  if (mErr) { console.error('Moment lookup failed:', mErr); process.exit(1); }
  const found = new Set((moments || []).map(m => m.id));
  const missing = MOMENT_IDS.filter(id => !found.has(id));
  if (missing.length) {
    console.error('Missing moment IDs (aborting):', missing);
    process.exit(1);
  }

  console.log('Collection to upsert:');
  console.log(JSON.stringify(COLLECTION, null, 2));
  console.log('\nMoments to wire:');
  for (const id of MOMENT_IDS) {
    const m = (moments || []).find(x => x.id === id);
    console.log(`  [${MOMENT_IDS.indexOf(id) + 1}] ${id} (${m?.year ?? '?'}) — ${m?.name}`);
  }

  // Check if collection already exists
  const { data: existing } = await sb.from('collections').select('id').eq('id', COLLECTION.id).maybeSingle();
  if (existing) {
    console.log(`\nNote: collection "${COLLECTION.id}" already exists — will upsert.`);
  }

  if (!APPLY) {
    console.log('\n(dry run — pass --apply to execute)');
    return;
  }

  // Upsert collection
  const { error: cErr } = await sb.from('collections').upsert(COLLECTION, { onConflict: 'id' });
  if (cErr) { console.error('Collection upsert failed:', cErr); process.exit(1); }
  console.log(`\nUpserted collection "${COLLECTION.id}".`);

  // Insert collection_moments (upsert to be idempotent)
  const rows = MOMENT_IDS.map((moment_id, i) => ({
    collection_id: COLLECTION.id,
    moment_id,
    sort_order: i + 1,
  }));
  const { error: cmErr } = await sb
    .from('collection_moments')
    .upsert(rows, { onConflict: 'collection_id,moment_id' });
  if (cmErr) { console.error('collection_moments upsert failed:', cmErr); process.exit(1); }
  console.log(`Wired ${rows.length} moment(s) to collection.`);

  console.log('\nDone.');
})();
