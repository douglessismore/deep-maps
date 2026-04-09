/**
 * Delete 9 confirmed duplicate moments flagged in handoff-narratives.md.
 * For each pair, references (entities/stories/collections) are first
 * migrated from LOSER → WINNER with upsert semantics, then the LOSER row
 * is deleted from the moments table.
 *
 * Winner selection rule: whichever ID has MORE wiring (stories + collections
 * + entities). Ties broken by preferring the more descriptive ID (year
 * suffix or more specific).
 *
 * Pass --apply to execute; default is dry run.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const APPLY = process.argv.includes('--apply');

// [winner, loser] based on investigate-dupe-moments.ts output + rationale in comments
const dedupe: Array<{ winner: string; loser: string; reason: string }> = [
  { winner: 'rosetta-stone-british-museum', loser: 'rosetta-stone-arrives-british-museum-1802', reason: 'winner has 1 entity, loser 0' },
  { winner: 'blitz-london-1940', loser: 'london-blitz-begins-1940', reason: 'winner has 1 entity, loser 0' },
  { winner: 'inv-fleming-penicillin', loser: 'penicillin-discovered-1928', reason: 'winner in collection invention-birthplaces' },
  { winner: 'bob-marley-records-exodus-london-1977', loser: 'marley-records-exodus-london-1977', reason: 'tie — prefer more descriptive ID' },
  { winner: 'keats-dies-spanish-steps-1821', loser: 'keats-dies-spanish-steps', reason: 'tie — prefer year-suffixed ID' },
  { winner: 'colosseum-opens-ad-80', loser: 'construction-colosseum-80ce', reason: 'tie — prefer more readable ID' },
  { winner: 'russian-revolution-winter-palace-1917', loser: 'october-revolution-winter-palace-1917', reason: 'tie — prefer descriptive ID' },
  { winner: 'alexander-dies-babylon-323bce', loser: 'alexander-dies-babylon', reason: 'tie — prefer year-suffixed ID' },
  { winner: 'library-alexandria-burns-48bce', loser: 'library-alexandria-destroyed-48bce', reason: 'tie — matches Agent B dedupe note' },
];

async function migrateLinks(table: string, idCol: string, winner: string, loser: string) {
  const { data: loserLinks, error } = await sb.from(table).select('*').eq('moment_id', loser);
  if (error) { console.error(`  ! ${table} read error`, error.message); return 0; }
  if (!loserLinks || loserLinks.length === 0) return 0;

  // Get existing winner links to avoid unique-constraint conflicts
  const { data: winnerLinks } = await sb.from(table).select('*').eq('moment_id', winner);
  const winnerKeys = new Set((winnerLinks || []).map(r => r[idCol]));

  const toInsert = loserLinks
    .filter(r => !winnerKeys.has(r[idCol]))
    .map(r => ({ ...r, moment_id: winner }));

  if (toInsert.length === 0) {
    console.log(`    ${table}: ${loserLinks.length} loser refs, all already on winner (no migration needed)`);
    return 0;
  }

  if (APPLY) {
    const { error: insErr } = await sb.from(table).insert(toInsert);
    if (insErr) { console.error(`    ! ${table} insert error`, insErr.message); return 0; }
  }
  console.log(`    ${table}: migrated ${toInsert.length} of ${loserLinks.length} refs${APPLY ? '' : ' (dry run)'}`);
  return toInsert.length;
}

(async () => {
  console.log(APPLY ? '=== APPLY MODE ===' : '=== DRY RUN (pass --apply to execute) ===\n');

  for (const { winner, loser, reason } of dedupe) {
    console.log(`\n[${loser}] → [${winner}]`);
    console.log(`  ${reason}`);

    // Verify both exist
    const { data: w } = await sb.from('moments').select('id').eq('id', winner).maybeSingle();
    const { data: l } = await sb.from('moments').select('id').eq('id', loser).maybeSingle();
    if (!w) { console.log(`  ! winner missing, skipping`); continue; }
    if (!l) { console.log(`  ! loser already gone, skipping`); continue; }

    // Migrate references
    await migrateLinks('moment_entities', 'entity_id', winner, loser);
    await migrateLinks('story_moments', 'story_id', winner, loser);
    await migrateLinks('collection_moments', 'collection_id', winner, loser);

    // Delete loser's remaining (now redundant) refs + the moment itself
    if (APPLY) {
      await sb.from('moment_entities').delete().eq('moment_id', loser);
      await sb.from('story_moments').delete().eq('moment_id', loser);
      await sb.from('collection_moments').delete().eq('moment_id', loser);
      const { error: delErr } = await sb.from('moments').delete().eq('id', loser);
      if (delErr) { console.error(`  ! delete error`, delErr.message); continue; }
      console.log(`  ✓ deleted loser moment ${loser}`);
    } else {
      console.log(`  (would delete loser moment ${loser})`);
    }
  }

  console.log(`\n${APPLY ? 'Done.' : 'Dry run complete. Re-run with --apply to execute.'}`);
})();
