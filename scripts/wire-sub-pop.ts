/**
 * Wire moment `grunge-sub-pop-seattle-1988` into story `seattle-grunge-era`
 * and tag entity `kurt-cobain` on it.
 *
 * Dry run by default; pass --apply to execute.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const APPLY = process.argv.includes('--apply');

const MOMENT_ID = 'grunge-sub-pop-seattle-1988';
const STORY_ID = 'seattle-grunge-era';
const ENTITY_ID = 'kurt-cobain';

(async () => {
  console.log(APPLY ? '=== APPLY MODE ===\n' : '=== DRY RUN (pass --apply) ===\n');

  // 1. Verify IDs
  const [{ data: moment }, { data: story }, { data: entity }] = await Promise.all([
    sb.from('moments').select('id,name,year').eq('id', MOMENT_ID).maybeSingle(),
    sb.from('stories').select('id,name,story_type').eq('id', STORY_ID).maybeSingle(),
    sb.from('entities').select('id,name,type').eq('id', ENTITY_ID).maybeSingle(),
  ]);

  console.log('Verification:');
  console.log(`  moment  ${MOMENT_ID}: ${moment ? `FOUND — "${moment.name}" (${moment.year})` : 'NOT FOUND'}`);
  console.log(`  story   ${STORY_ID}: ${story ? `FOUND — "${story.name}" (${story.story_type})` : 'NOT FOUND'}`);
  console.log(`  entity  ${ENTITY_ID}: ${entity ? `FOUND — "${entity.name}" (${entity.type})` : 'NOT FOUND'}`);

  if (!moment || !story || !entity) {
    if (!moment) {
      const { data } = await sb.from('moments').select('id,name').ilike('id', '%sub-pop%').limit(5);
      console.log('\n  closest moments:', data);
    }
    if (!story) {
      const { data } = await sb.from('stories').select('id,name').ilike('id', '%grunge%').limit(5);
      console.log('\n  closest stories:', data);
    }
    if (!entity) {
      const { data } = await sb.from('entities').select('id,name').ilike('id', '%cobain%').limit(5);
      console.log('\n  closest entities:', data);
    }
    console.log('\nAborting — missing IDs.');
    process.exit(1);
  }

  // 2. Check if already wired
  const [{ data: existingStoryMoment }, { data: existingMomentEntity }] = await Promise.all([
    sb.from('story_moments').select('*').eq('story_id', STORY_ID).eq('moment_id', MOMENT_ID).maybeSingle(),
    sb.from('moment_entities').select('*').eq('moment_id', MOMENT_ID).eq('entity_id', ENTITY_ID).maybeSingle(),
  ]);

  console.log('\nExisting link check:');
  console.log(`  story_moments(${STORY_ID}, ${MOMENT_ID}): ${existingStoryMoment ? 'ALREADY WIRED' : 'not present'}`);
  console.log(`  moment_entities(${MOMENT_ID}, ${ENTITY_ID}): ${existingMomentEntity ? 'ALREADY TAGGED' : 'not present'}`);

  // 3. Compute next sort_order
  const { data: maxRow } = await sb
    .from('story_moments')
    .select('sort_order')
    .eq('story_id', STORY_ID)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSortOrder = (maxRow?.sort_order ?? -1) + 1;
  console.log(`\nNext sort_order for ${STORY_ID}: ${nextSortOrder} (current max: ${maxRow?.sort_order ?? 'none'})`);

  // 4. Plan
  const plans: Array<{ table: string; row: any }> = [];
  if (!existingStoryMoment) {
    plans.push({
      table: 'story_moments',
      row: { story_id: STORY_ID, moment_id: MOMENT_ID, sort_order: nextSortOrder, is_primary: false },
    });
  }
  if (!existingMomentEntity) {
    plans.push({
      table: 'moment_entities',
      row: { moment_id: MOMENT_ID, entity_id: ENTITY_ID },
    });
  }

  console.log('\nPlanned inserts:');
  if (plans.length === 0) {
    console.log('  (none — everything already wired)');
    process.exit(0);
  }
  for (const p of plans) {
    console.log(`  ${p.table}:`, JSON.stringify(p.row));
  }

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to execute.');
    process.exit(0);
  }

  // 5. Execute
  console.log('\nApplying...');
  for (const p of plans) {
    const { error } = await sb.from(p.table).insert(p.row);
    if (error) {
      console.error(`  ${p.table} insert FAILED:`, error.message);
      process.exit(1);
    }
    console.log(`  ${p.table}: inserted OK`);
  }
  console.log('\nDone.');
})();
