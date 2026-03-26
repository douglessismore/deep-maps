/**
 * Session 4 content fixes — applies directly to Supabase.
 *
 * Fixes:
 * 1. Rename "Dazed and Confused — Austin on Film" → "Dazed and Confused"
 * 2. Delete "Booker T Washington Denied the Texas Capitol" story + story_moments
 * 3. Wire Paramount Theatre moment_entities (3 moments)
 * 4. Wire Scholz Garden moment_entities (3 moments)
 * 5. Rename outlaw collection
 * 6. Audit + clean escaped backslashes in stories/moments/entities
 *
 * Usage: npx tsx scripts/fix-content-session4.ts
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local or as an env var.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Session 4 Content Fixes\n');

  // 1. Rename Dazed and Confused
  console.log('1. Renaming Dazed and Confused story...');
  const { error: e1 } = await supabase
    .from('stories')
    .update({ name: 'Dazed and Confused' })
    .eq('id', 'dazed-and-confused-austin');
  console.log(e1 ? `   ❌ ${e1.message}` : '   ✅ Renamed');

  // 2. Delete Booker T story + story_moments
  console.log('2. Deleting Booker T Washington "denied capitol" story...');
  const { error: e2a } = await supabase
    .from('story_moments')
    .delete()
    .eq('story_id', 'booker-t-washington-denied-capitol');
  console.log(e2a ? `   ❌ story_moments: ${e2a.message}` : '   ✅ story_moments deleted');
  const { error: e2b } = await supabase
    .from('stories')
    .delete()
    .eq('id', 'booker-t-washington-denied-capitol');
  console.log(e2b ? `   ❌ story: ${e2b.message}` : '   ✅ Story deleted');

  // 3. Wire Paramount Theatre moment_entities
  console.log('3. Wiring Paramount Theatre moment_entities...');
  const paramountMoments = ['paramount-majestic-opening', 'paramount-near-death', 'paramount-film-revival'];
  for (const momentId of paramountMoments) {
    const { error } = await supabase
      .from('moment_entities')
      .upsert({ moment_id: momentId, entity_id: 'paramount-theatre-austin' }, { onConflict: 'moment_id,entity_id' });
    console.log(error ? `   ❌ ${momentId}: ${error.message}` : `   ✅ ${momentId}`);
  }

  // 4. Wire Scholz Garden moment_entities
  console.log('4. Wiring Scholz Garden moment_entities...');
  const scholzMoments = ['scholz-opening-1866', 'scholz-political-backroom', 'scholz-longhorn-tradition'];
  for (const momentId of scholzMoments) {
    const { error } = await supabase
      .from('moment_entities')
      .upsert({ moment_id: momentId, entity_id: 'scholz-garden' }, { onConflict: 'moment_id,entity_id' });
    console.log(error ? `   ❌ ${momentId}: ${error.message}` : `   ✅ ${momentId}`);
  }

  // 5. Rename outlaw collection
  console.log('5. Renaming outlaw collection...');
  const { error: e5 } = await supabase
    .from('collections')
    .update({
      name: 'Where Outlaws Lived and Died',
      subtitle: 'The courthouses, canyons, and crossroads of Billy the Kid, Bonnie & Clyde, and Pancho Villa',
    })
    .eq('id', 'outlaw-gunfighter-sites');
  console.log(e5 ? `   ❌ ${e5.message}` : '   ✅ Renamed');

  // 6. Audit escaped backslashes
  console.log('6. Auditing escaped backslashes in stories...');
  const { data: badStories } = await supabase
    .from('stories')
    .select('id, name, description')
    .or('name.like.%\\\\%,description.like.%\\\\%');
  if (badStories && badStories.length > 0) {
    console.log(`   Found ${badStories.length} stories with backslashes:`);
    for (const s of badStories) {
      const cleanName = s.name?.replace(/\\+$/, '') ?? s.name;
      const cleanDesc = s.description?.replace(/\\+$/, '') ?? s.description;
      if (cleanName !== s.name || cleanDesc !== s.description) {
        const { error } = await supabase
          .from('stories')
          .update({ name: cleanName, description: cleanDesc })
          .eq('id', s.id);
        console.log(error ? `   ❌ ${s.id}: ${error.message}` : `   ✅ Cleaned ${s.id}`);
      } else {
        console.log(`   ℹ️  ${s.id}: backslash not trailing, skipping`);
      }
    }
  } else {
    console.log('   ✅ No backslashes found in stories');
  }

  console.log('\n6b. Auditing escaped backslashes in moments...');
  const { data: badMoments } = await supabase
    .from('moments')
    .select('id, name, description, subtitle')
    .or('name.like.%\\\\%,description.like.%\\\\%,subtitle.like.%\\\\%');
  if (badMoments && badMoments.length > 0) {
    console.log(`   Found ${badMoments.length} moments with backslashes:`);
    for (const m of badMoments) {
      const cleanName = m.name?.replace(/\\+$/, '') ?? m.name;
      const cleanDesc = m.description?.replace(/\\+$/, '') ?? m.description;
      const cleanSub = m.subtitle?.replace(/\\+$/, '') ?? m.subtitle;
      if (cleanName !== m.name || cleanDesc !== m.description || cleanSub !== m.subtitle) {
        const { error } = await supabase
          .from('moments')
          .update({ name: cleanName, description: cleanDesc, subtitle: cleanSub })
          .eq('id', m.id);
        console.log(error ? `   ❌ ${m.id}: ${error.message}` : `   ✅ Cleaned ${m.id}`);
      }
    }
  } else {
    console.log('   ✅ No backslashes found in moments');
  }

  console.log('\n✅ All fixes applied.');
}

main().catch(console.error);
