/**
 * Round 2 dedupe — 29 pairs flagged by scripts/analyze-orphans.ts as
 * high-confidence duplicates, manually reviewed against the raw Supabase
 * rows, with 11 false positives removed.
 *
 * Winner is auto-selected by total wiring (story_moments + collection_moments
 * + moment_entities). Ties → prefer the already-non-orphan, then the more
 * descriptive ID.
 *
 * Pass --apply to execute; default is dry run.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const APPLY = process.argv.includes('--apply');

// Unordered candidate pairs. Winner auto-selected below.
const pairs: Array<[string, string]> = [
  ['colosseum-opens-ad-80', 'colosseum-opens'],
  ['machu-picchu-rediscovered-1911', 'machu-picchu-bingham-discovery-1911'],
  ['eiffel-tower-opens-1889', 'eiffel-tower-opens'],
  ['notre-dame-fire-2019', 'notre-dame-fire'],
  ['giordano-bruno-burned-campo-dei-fiori-1600', 'giordano-bruno-burned-campo-de-fiori-1600'],
  ['central-park-olmsted-vaux-1858', 'central-park-greensward-plan-1858'],
  ['tutankhamun-tomb-opened-1922', 'howard-carter-discovers-tomb-kv62'],
  ['romulus-founds-rome-753bce', 'romulus-founds-rome'],
  ['cleopatra-suicide-alexandria-30bce', 'cleopatra-suicide-alexandria'],
  ['pantheon-dome-built-ad-125', 'hadrian-rebuilds-pantheon-125'],
  ['edison-pearl-street-station-1882', 'edison-lights-lower-manhattan-pearl-street'],
  ['dahmer-arrested-1991', 'dahmer-apartment'],
  ['green-river-ridgway-home-1982', 'sea-ridgway-house'],
  ['starbucks-pike-place-1971', 'sea-original-starbucks'],
  ['execution-charles-i-banqueting-house-1649', 'charles-i-executed'],
  ['hannibal-annihilates-romans-cannae-216bce', 'cannae-hannibal'],
  ['diego-rivera-murals-national-palace-1929', 'rivera-palacio-nacional'],
  ['maradona-hand-of-god-azteca-1986', 'hand-of-god-azteca-1986'],
  ['ruth-called-shot-wrigley-1932', 'babe-ruth-called-shot-wrigley-1932'],
  ['thermopylae-300-spartans-480bce', 'thermopylae-last-stand'],
  ['google-founded-menlo-park-1998', 'inv-google-garage'],
  ['chernobyl-disaster-1986', 'chernobyl-reactor-4-explosion-1986'],
  ['bastille-storming-1789', 'storming-bastille'],
  ['leonardo-paints-last-supper-milan-1495', 'da-vinci-last-supper'],
  ['globe-theatre-opens-southwark-1599', 'shakespeare-globe-theatre'],
  ['basilica-guadalupe-mexico-city', 'guadalupe-tilma-reveal'],
  ['dna-structure-discovered-1953', 'crick-watson-dna-double-helix-1953'],
  ['hiroshima-atomic-bomb-1945', 'hnb-hiroshima-hypocenter'],
  // Einstein pair — separate from analyze-orphans output; both exist, orphan is
  // the unused version (einstein-publishes-relativity)
  ['einstein-annus-mirabilis-bern-1905', 'einstein-publishes-relativity'],
];

async function wiringCount(id: string) {
  const [sm, cm, me] = await Promise.all([
    sb.from('story_moments').select('story_id', { count: 'exact', head: true }).eq('moment_id', id),
    sb.from('collection_moments').select('collection_id', { count: 'exact', head: true }).eq('moment_id', id),
    sb.from('moment_entities').select('entity_id', { count: 'exact', head: true }).eq('moment_id', id),
  ]);
  return { stories: sm.count || 0, collections: cm.count || 0, entities: me.count || 0, total: (sm.count || 0) + (cm.count || 0) + (me.count || 0) };
}

async function pickWinner(a: string, b: string): Promise<{ winner: string; loser: string; reason: string }> {
  const [wa, wb] = await Promise.all([wiringCount(a), wiringCount(b)]);
  if (wa.total > wb.total) return { winner: a, loser: b, reason: `${a} wiring ${wa.total} > ${b} wiring ${wb.total}` };
  if (wb.total > wa.total) return { winner: b, loser: a, reason: `${b} wiring ${wb.total} > ${a} wiring ${wa.total}` };
  // tie → prefer longer (more descriptive) ID
  if (a.length > b.length) return { winner: a, loser: b, reason: `tie (${wa.total} each) — prefer longer ID` };
  return { winner: b, loser: a, reason: `tie (${wa.total} each) — prefer longer ID` };
}

async function migrateLinks(table: string, idCol: string, winner: string, loser: string) {
  const { data: loserLinks, error } = await sb.from(table).select('*').eq('moment_id', loser);
  if (error) { console.error(`  ! ${table} read error`, error.message); return; }
  if (!loserLinks || loserLinks.length === 0) return;

  const { data: winnerLinks } = await sb.from(table).select('*').eq('moment_id', winner);
  const winnerKeys = new Set((winnerLinks || []).map(r => r[idCol]));

  const toInsert = loserLinks
    .filter(r => !winnerKeys.has(r[idCol]))
    .map(r => ({ ...r, moment_id: winner }));

  if (toInsert.length === 0) {
    console.log(`    ${table}: ${loserLinks.length} loser ref(s), already on winner`);
    return;
  }

  if (APPLY) {
    const { error: insErr } = await sb.from(table).insert(toInsert);
    if (insErr) { console.error(`    ! ${table} insert error`, insErr.message); return; }
  }
  console.log(`    ${table}: migrated ${toInsert.length} of ${loserLinks.length} ref(s)${APPLY ? '' : ' (dry run)'}`);
}

(async () => {
  console.log(APPLY ? '=== APPLY MODE ===\n' : '=== DRY RUN (pass --apply) ===\n');
  for (const [a, b] of pairs) {
    console.log(`--- pair: ${a} / ${b}`);
    const { data: both } = await sb.from('moments').select('id').in('id', [a, b]);
    if (!both || both.length < 2) {
      console.log(`  ! one or both missing, skipping`);
      continue;
    }
    const { winner, loser, reason } = await pickWinner(a, b);
    console.log(`  winner: ${winner}`);
    console.log(`  loser:  ${loser}`);
    console.log(`  reason: ${reason}`);

    await migrateLinks('moment_entities', 'entity_id', winner, loser);
    await migrateLinks('story_moments', 'story_id', winner, loser);
    await migrateLinks('collection_moments', 'collection_id', winner, loser);

    if (APPLY) {
      await sb.from('moment_entities').delete().eq('moment_id', loser);
      await sb.from('story_moments').delete().eq('moment_id', loser);
      await sb.from('collection_moments').delete().eq('moment_id', loser);
      const { error: delErr } = await sb.from('moments').delete().eq('id', loser);
      if (delErr) { console.error(`  ! delete error`, delErr.message); continue; }
      console.log(`  ✓ deleted ${loser}`);
    } else {
      console.log(`  (would delete ${loser})`);
    }
    console.log();
  }
  console.log(APPLY ? 'Done.' : '\nDry run complete. Re-run with --apply.');
})();
