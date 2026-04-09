/**
 * Create the "Seattle General Strike" incident story in Supabase and link
 * the existing orphan moment (seattle-general-strike-1919) to it.
 *
 * The moment and story happen to share the same slug — that's fine because
 * `stories.id` and `moments.id` live in separate tables with no cross-table
 * uniqueness constraint. The story_moments junction row ties them together.
 *
 * Pass --apply to execute; default is dry run.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const APPLY = process.argv.includes('--apply');

const STORY_ID = 'seattle-general-strike-1919';
const MOMENT_ID = 'seattle-general-strike-1919';

const STORY_ROW = {
  id: STORY_ID,
  name: 'The Seattle General Strike',
  nickname: '',
  years: '1919',
  start_year: 1919,
  end_year: 1919,
  category: 'political-drama',
  story_type: 'incident',
  description:
    "For five days in February 1919, roughly 65,000 workers walked off the job and shut down Seattle — the first citywide general strike in American history. Shipyard workers struck for higher wages and 110 local unions joined in solidarity, running milk stations and feeding 30,000 people a day through a labour-run General Strike Committee. The strike ended peacefully on 11 February, but Mayor Ole Hanson rode his 'Bolshevik revolution' rhetoric to national fame and the episode became a spark for the postwar Red Scare.",
  tags: ['labor', 'strike', 'seattle', '1919', 'red-scare'],
  content_warning: null,
  wikipedia_slug: 'Seattle_General_Strike',
  review_status: 'unreviewed',
  image_url: null,
};

(async () => {
  console.log(APPLY ? '=== APPLY MODE ===\n' : '=== DRY RUN (pass --apply) ===\n');

  // 1. Verify moment exists
  const { data: moment, error: mErr } = await sb
    .from('moments')
    .select('id,name,year')
    .eq('id', MOMENT_ID)
    .maybeSingle();
  if (mErr) throw mErr;
  if (!moment) {
    console.error(`Moment ${MOMENT_ID} not found.`);
    process.exit(1);
  }
  console.log(`Moment found: ${moment.id} (${moment.year}) — "${moment.name}"`);

  // 2. Verify orphan (no existing story_moments rows)
  const { data: existingLinks, error: lErr } = await sb
    .from('story_moments')
    .select('story_id,moment_id')
    .eq('moment_id', MOMENT_ID);
  if (lErr) throw lErr;
  if (existingLinks && existingLinks.length > 0) {
    console.error(`Moment already linked to ${existingLinks.length} story/ies:`, existingLinks);
    process.exit(1);
  }
  console.log('Moment confirmed orphan (no story_moments rows).');

  // 3. Verify story does not already exist
  const { data: existingStory, error: sErr } = await sb
    .from('stories')
    .select('id')
    .eq('id', STORY_ID)
    .maybeSingle();
  if (sErr) throw sErr;
  if (existingStory) {
    console.error(`Story ${STORY_ID} already exists — aborting.`);
    process.exit(1);
  }
  console.log(`Story id ${STORY_ID} is free.\n`);

  console.log('Planned story row:');
  console.log(JSON.stringify(STORY_ROW, null, 2));
  console.log('\nPlanned story_moments row:');
  console.log(JSON.stringify({ story_id: STORY_ID, moment_id: MOMENT_ID, sort_order: 1, is_primary: true }, null, 2));

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply.');
    return;
  }

  // 4. Insert story
  const { error: insStoryErr } = await sb.from('stories').insert(STORY_ROW);
  if (insStoryErr) {
    console.error('Failed to insert story:', insStoryErr);
    process.exit(1);
  }
  console.log(`\nInserted story ${STORY_ID}.`);

  // 5. Insert story_moments link
  const { error: insLinkErr } = await sb.from('story_moments').insert({
    story_id: STORY_ID,
    moment_id: MOMENT_ID,
    sort_order: 1,
    is_primary: true,
  });
  if (insLinkErr) {
    console.error('Failed to insert story_moments row:', insLinkErr);
    process.exit(1);
  }
  console.log(`Inserted story_moments link ${STORY_ID} ← ${MOMENT_ID}.`);
  console.log('\nDone.');
})();
