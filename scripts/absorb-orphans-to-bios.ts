/**
 * Absorb orphan moments into the biography story of their tagged person entity.
 *
 * Guardrails (to prevent loose matches that fail the Physical Presence Rule):
 *  1. Orphan must have at least one PERSON entity tag
 *  2. That entity must be the subject of a biography story (storyType='biography')
 *  3. The orphan's NAME must contain the person's name (first or last word, ≥4 chars)
 *     — rules out entities that were incidentally tagged on broader events
 *  4. Never absorb into non-biography stories (too risky without a specific arc)
 *
 * For each qualifying orphan:
 *  - Inserts a story_moments row linking orphan → biography
 *  - Does NOT modify the moment itself or delete anything
 *
 * Note: biographies are NOT browseable on the frontend (filterBrowseableStories
 * whitelist is incident+era only), so absorbed moments remain discoverable only
 * via the person entity — which matches the user's rule that biographical
 * figures should only appear on frontend as person entities.
 *
 * Pass --apply to execute; default is dry run.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local', override: true });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const APPLY = process.argv.includes('--apply');

function nameTokens(name: string): Set<string> {
  return new Set((name || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length >= 4));
}

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
  console.log(APPLY ? '=== APPLY MODE ===\n' : '=== DRY RUN (pass --apply) ===\n');

  const [moments, storyMoments, collectionMoments, momentEntities, stories, entities] = await Promise.all([
    loadAll('moments', 'id,name,year'),
    loadAll('story_moments', 'story_id,moment_id'),
    loadAll('collection_moments', 'collection_id,moment_id'),
    loadAll('moment_entities', 'moment_id,entity_id'),
    loadAll('stories', 'id,name,story_type'),
    loadAll('entities', 'id,name,type'),
  ]);
  const inStory = new Set(storyMoments.map(r => r.moment_id));
  const inCollection = new Set(collectionMoments.map(r => r.moment_id));
  const orphans = moments.filter(m => !inStory.has(m.id) && !inCollection.has(m.id));
  const storyById = new Map(stories.map(s => [s.id, s]));
  const entityById = new Map(entities.map(e => [e.id, e]));

  const momentToEntities = new Map<string, string[]>();
  for (const r of momentEntities) {
    if (!momentToEntities.has(r.moment_id)) momentToEntities.set(r.moment_id, []);
    momentToEntities.get(r.moment_id)!.push(r.entity_id);
  }
  // entity → biography story(ies) it stars in (determined by membership)
  const momentToStories = new Map<string, string[]>();
  for (const r of storyMoments) {
    if (!momentToStories.has(r.moment_id)) momentToStories.set(r.moment_id, []);
    momentToStories.get(r.moment_id)!.push(r.story_id);
  }
  const entityToBiographies = new Map<string, Set<string>>();
  for (const r of momentEntities) {
    const sids = momentToStories.get(r.moment_id) || [];
    for (const sid of sids) {
      const s = storyById.get(sid);
      if (!s || s.story_type !== 'biography') continue;
      if (!entityToBiographies.has(r.entity_id)) entityToBiographies.set(r.entity_id, new Set());
      entityToBiographies.get(r.entity_id)!.add(sid);
    }
  }

  // Compute each biography's existing moment year range → enforces "within
  // person's lifetime (plus small margin)". Blocks post-death legacy moments.
  // For sparse biographies (<5 moments), the range is unreliable — fall back
  // to a wider ±100 year window to avoid rejecting legitimate early/late-life
  // moments just because the biography was only partially seeded.
  const storyYearRange = new Map<string, { min: number; max: number; count: number }>();
  const storyMomentMap = new Map<string, string[]>();
  for (const r of storyMoments) {
    if (!storyMomentMap.has(r.story_id)) storyMomentMap.set(r.story_id, []);
    storyMomentMap.get(r.story_id)!.push(r.moment_id);
  }
  const momentYearById = new Map(moments.map(m => [m.id, m.year]));
  for (const [sid, mids] of storyMomentMap) {
    const years = mids.map(id => momentYearById.get(id)).filter((y): y is number => typeof y === 'number');
    if (years.length === 0) continue;
    storyYearRange.set(sid, { min: Math.min(...years), max: Math.max(...years), count: years.length });
  }

  const planned: Array<{ orphan: any; story: any; entity: any; match: string }> = [];
  const rejected: Array<{ orphan: any; reason: string; entity?: any; story?: any }> = [];

  for (const o of orphans) {
    const eids = momentToEntities.get(o.id) || [];
    let absorbed = false;
    for (const eid of eids) {
      const entity = entityById.get(eid);
      if (!entity || entity.type !== 'person') continue;
      const bios = entityToBiographies.get(eid);
      if (!bios || bios.size === 0) continue;

      // GUARDRAIL: orphan name must contain at least one distinctive entity-name
      // token (>=4 chars, excluding filler like "the", "of", "de", "von").
      // Covers epithets like "Alexander the Great" (matches on "alexander"),
      // "Hannibal Barca" ("hannibal"), "Galileo Galilei" ("galileo").
      const FILLER = new Set(['great','barca','galilei','conqueror','miletus','hippo','assisi','allan','nazareth','aurelius','godwinson','vinci','henry','sforza','augustus']);
      const orphanTokens = nameTokens(o.name);
      const entityNameTokens = [...nameTokens(entity.name)];
      const distinctiveTokens = entityNameTokens.filter(t => !FILLER.has(t));
      const nameTokensToCheck = distinctiveTokens.length > 0 ? distinctiveTokens : entityNameTokens;
      const matchToken = nameTokensToCheck.find(t => orphanTokens.has(t));
      if (!matchToken) {
        rejected.push({ orphan: o, entity, reason: `orphan name does not contain any of [${nameTokensToCheck.join(',')}]` });
        continue;
      }
      const lastWord = matchToken;

      // GUARDRAIL: biography must actually be about this entity (not just contain
      // a moment where they're tagged). Require biography id/name to contain
      // ANY distinctive token of the entity's name.
      const matchingBio = [...bios].find(sid => {
        const s = storyById.get(sid);
        if (!s) return false;
        const storyTokens = new Set([...nameTokens(s.id), ...nameTokens(s.name)]);
        return nameTokensToCheck.some(t => storyTokens.has(t));
      });
      if (!matchingBio) {
        rejected.push({ orphan: o, entity, reason: `no biography subject matches any of [${nameTokensToCheck.join(',')}] (saw: ${[...bios].join(',')})` });
        continue;
      }
      // GUARDRAIL: year must be within biography's existing range ± margin.
      // Blocks post-death legacy events (museum displays, reconstructions,
      // reburials) and anachronistic moments about descendants.
      // - ≥5 moments in bio: trust range, allow ±15 years
      // - <5 moments: sparse — use generous ±100 years (roughly one lifetime)
      const range = storyYearRange.get(matchingBio);
      if (range && typeof o.year === 'number') {
        const margin = range.count >= 5 ? 15 : 100;
        if (o.year < range.min - margin || o.year > range.max + margin) {
          rejected.push({ orphan: o, entity, reason: `year ${o.year} outside biography range [${range.min},${range.max}] ±${margin} (n=${range.count})` });
          continue;
        }
        // LIFETIME CAP: no moment more than 150 years after the earliest
        // existing biography moment. Catches post-death legacy events even
        // when the biography already contains an anomalous late moment.
        if (o.year > range.min + 150) {
          rejected.push({ orphan: o, entity, reason: `year ${o.year} exceeds lifetime cap (earliest bio moment ${range.min}+150)` });
          continue;
        }
      }
      const story = storyById.get(matchingBio);
      planned.push({ orphan: o, story, entity, match: lastWord || entity.name });
      absorbed = true;
      break; // only one absorb per orphan
    }
    if (!absorbed && eids.length > 0 && !rejected.find(r => r.orphan.id === o.id)) {
      // had entities but none qualified
    }
  }

  console.log(`Planned absorbs: ${planned.length}`);
  console.log(`Rejected (name-mismatch guardrail): ${rejected.length}\n`);

  // Group planned by story for readability
  const byStory = new Map<string, typeof planned>();
  for (const p of planned) {
    if (!byStory.has(p.story.id)) byStory.set(p.story.id, []);
    byStory.get(p.story.id)!.push(p);
  }
  const sorted = [...byStory.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [sid, group] of sorted) {
    console.log(`→ ${sid} (${group.length})`);
    for (const p of group) console.log(`    ${p.orphan.id} (${p.orphan.year}) — "${p.orphan.name.slice(0, 80)}"`);
  }

  // Write rejected list so we can review edge cases
  fs.writeFileSync('scripts/staging/absorb-rejected.json', JSON.stringify(
    rejected.map(r => ({ orphan_id: r.orphan.id, orphan_name: r.orphan.name, entity: r.entity?.name, reason: r.reason })),
    null, 2));
  console.log(`\nRejected list written to scripts/staging/absorb-rejected.json`);

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply.');
    return;
  }

  // Apply: insert story_moments rows. Compute sort_order = max existing + 1
  // for each biography (so new moments land at the end; manual reordering later).
  let inserted = 0;
  const maxOrderByStory = new Map<string, number>();
  for (const r of storyMoments) {
    const cur = maxOrderByStory.get(r.story_id) || 0;
    if ((r as any).sort_order > cur) maxOrderByStory.set(r.story_id, (r as any).sort_order);
  }
  // Re-query sort_order since loadAll stripped it
  const { data: smFull } = await sb.from('story_moments').select('story_id,sort_order');
  for (const r of smFull || []) {
    const cur = maxOrderByStory.get(r.story_id) || 0;
    if (r.sort_order > cur) maxOrderByStory.set(r.story_id, r.sort_order);
  }

  for (const p of planned) {
    const nextOrder = (maxOrderByStory.get(p.story.id) || 0) + 1;
    maxOrderByStory.set(p.story.id, nextOrder);
    const { error } = await sb.from('story_moments').insert({
      story_id: p.story.id,
      moment_id: p.orphan.id,
      sort_order: nextOrder,
      is_primary: false,
    });
    if (error) {
      console.error(`  ! insert failed ${p.orphan.id} → ${p.story.id}:`, error.message);
      continue;
    }
    inserted++;
  }
  console.log(`\nInserted ${inserted} story_moments rows.`);
})();
