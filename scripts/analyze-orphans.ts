/**
 * Orphan analysis — turns raw signals from match-orphans-to-hmdb.ts into
 * actionable categories. Output written to scripts/staging/orphan-analysis.md.
 *
 * Categories produced:
 *  1. DUPE — orphan is same event as an existing non-orphan moment (name + proximity)
 *  2. ABSORB — orphan's existing entity tag points to a story that should adopt it
 *  3. COORD RESEARCH LEAD — strong HMDB name match (research clue, NOT coord copy)
 *  4. NEEDS STORY — orphan is notable enough to anchor a new story but currently homeless
 *  5. LEAVE AS-IS — orphan is discoverable via entity browsing; no action needed
 *
 * Ranking rules:
 *  - Dupe confidence: name-token overlap ≥3 AND proximity <500m → HIGH
 *  - Absorb confidence: orphan has entity E AND story S has E in entities → HIGH
 *  - Name match quality: discard generic tokens (united,states,first,texas,road,
 *    street,north,south,east,west,county,city,american,school,college,house)
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local', override: true });

const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function distMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const GENERIC_TOKENS = new Set([
  'united','states','first','texas','road','street','north','south','east','west',
  'county','city','american','school','college','house','site','historic','memorial',
  'monument','marker','place','park','river','creek','hill','valley','great','national',
  'state','early','late','years','year','here','there','people','came','came','world',
  'home','people','time','public','general','building','district','area','land','water',
]);

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

function tokens(s: string): string[] {
  return (s || '').toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length >= 4 && !GENERIC_TOKENS.has(t));
}

(async () => {
  console.log('Loading Supabase tables…');
  const [moments, storyMoments, collectionMoments, momentEntities, stories, entities] = await Promise.all([
    loadAll('moments', 'id,name,subtitle,year,location,description'),
    loadAll('story_moments', 'story_id,moment_id'),
    loadAll('collection_moments', 'collection_id,moment_id'),
    loadAll('moment_entities', 'moment_id,entity_id'),
    loadAll('stories', 'id,name,story_type,description'),
    loadAll('entities', 'id,name,type'),
  ]);
  // Unpack coords
  for (const m of moments) {
    const c = m.location?.coordinates;
    if (c) { m.lng = c[0]; m.lat = c[1]; }
  }

  const inStory = new Set(storyMoments.map(r => r.moment_id));
  const inCollection = new Set(collectionMoments.map(r => r.moment_id));
  const isOrphan = (id: string) => !inStory.has(id) && !inCollection.has(id);

  const orphans = moments.filter(m => isOrphan(m.id) && isFinite(m.lat) && isFinite(m.lng));
  const nonOrphans = moments.filter(m => !isOrphan(m.id) && isFinite(m.lat) && isFinite(m.lng));
  console.log(`Orphans: ${orphans.length}, non-orphans: ${nonOrphans.length}`);

  // Entity → moment index for orphans
  const momentToEntities = new Map<string, string[]>();
  for (const r of momentEntities) {
    if (!momentToEntities.has(r.moment_id)) momentToEntities.set(r.moment_id, []);
    momentToEntities.get(r.moment_id)!.push(r.entity_id);
  }
  // Entity → stories (derived: entity → moments → stories)
  // A story "contains" an entity if any of the story's moments has that entity tagged.
  const momentToStories = new Map<string, string[]>();
  for (const r of storyMoments) {
    if (!momentToStories.has(r.moment_id)) momentToStories.set(r.moment_id, []);
    momentToStories.get(r.moment_id)!.push(r.story_id);
  }
  const entityToStories = new Map<string, Set<string>>();
  for (const r of momentEntities) {
    const sids = momentToStories.get(r.moment_id) || [];
    if (sids.length === 0) continue;
    if (!entityToStories.has(r.entity_id)) entityToStories.set(r.entity_id, new Set());
    for (const sid of sids) entityToStories.get(r.entity_id)!.add(sid);
  }
  const storyById = new Map(stories.map(s => [s.id, s]));
  const entityById = new Map(entities.map(e => [e.id, e]));

  // --- CATEGORY 1: DUPE DETECTION (orphan ≈ non-orphan existing moment) ---
  const dupes: Array<{ orphan: any; existing: any; distance: number; shared: string[]; confidence: string }> = [];
  for (const o of orphans) {
    const oTok = new Set(tokens(o.name + ' ' + (o.subtitle || '')));
    if (oTok.size === 0) continue;
    for (const e of nonOrphans) {
      if (Math.abs(e.lat - o.lat) > 0.01 || Math.abs(e.lng - o.lng) > 0.01) continue;
      const d = distMeters(o.lat, o.lng, e.lat, e.lng);
      if (d > 1000) continue;
      const eTok = new Set(tokens(e.name + ' ' + (e.subtitle || '')));
      const shared = [...oTok].filter(t => eTok.has(t));
      if (shared.length < 2) continue;
      // Confidence: same year + shared ≥3 + <200m = HIGH
      let conf = 'low';
      if (d < 200 && shared.length >= 3) conf = 'high';
      else if (d < 500 && shared.length >= 3) conf = 'medium';
      else if (d < 200 && shared.length >= 2) conf = 'medium';
      if (o.year && e.year && Math.abs(o.year - e.year) > 5) continue;
      dupes.push({ orphan: o, existing: e, distance: Math.round(d), shared, confidence: conf });
    }
  }
  // De-dup: keep best match per orphan
  const bestDupe = new Map<string, typeof dupes[0]>();
  for (const d of dupes) {
    const prev = bestDupe.get(d.orphan.id);
    if (!prev || d.shared.length > prev.shared.length || (d.shared.length === prev.shared.length && d.distance < prev.distance)) {
      bestDupe.set(d.orphan.id, d);
    }
  }
  const dupeList = [...bestDupe.values()].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence] || a.distance - b.distance;
  });
  console.log(`Dupe candidates: ${dupeList.length} (${dupeList.filter(d => d.confidence === 'high').length} high-confidence)`);

  // --- CATEGORY 2: ABSORB (orphan's entity → existing story) ---
  const absorbs: Array<{ orphan: any; story: any; entity: any }> = [];
  for (const o of orphans) {
    if (bestDupe.has(o.id)) continue; // dupe takes precedence
    const eids = momentToEntities.get(o.id) || [];
    for (const eid of eids) {
      const entity = entityById.get(eid);
      if (!entity) continue;
      // Only person entities drive absorbs. Place/org entities produce too many
      // false positives (e.g., any moment at Westminster Abbey gets pulled into
      // Queen Victoria's biography).
      if (entity.type !== 'person') continue;
      const sids = entityToStories.get(eid) || new Set<string>();
      for (const sid of sids) {
        const story = storyById.get(sid);
        if (!story) continue;
        // Only absorb into biographies (tight person-centric narrative).
        // Era/incident stories are too broad — orphans belong there only if
        // they fit the specific arc, which entity-sharing alone can't prove.
        if (story.story_type !== 'biography') continue;
        absorbs.push({ orphan: o, story, entity });
      }
    }
  }
  // Keep best (most relevant) story per orphan — prefer biography type when entity is person
  const bestAbsorb = new Map<string, typeof absorbs[0]>();
  for (const a of absorbs) {
    const prev = bestAbsorb.get(a.orphan.id);
    if (!prev) { bestAbsorb.set(a.orphan.id, a); continue; }
    const prevBio = prev.story.story_type === 'biography';
    const curBio = a.story.story_type === 'biography';
    if (curBio && !prevBio) bestAbsorb.set(a.orphan.id, a);
  }
  const absorbList = [...bestAbsorb.values()];
  console.log(`Absorb candidates: ${absorbList.length}`);

  // --- CATEGORY 3: COORD RESEARCH LEADS (strong HMDB name match) ---
  // Load raw report for name matches
  const report = JSON.parse(fs.readFileSync('scripts/staging/orphan-hmdb-report.json', 'utf8'));
  const leads: Array<{ orphan: any; marker: any; distance: number; shared: string[] }> = [];
  for (const nm of report.nameMatches) {
    if (bestDupe.has(nm.orphan.id)) continue;
    const best = nm.markers[0];
    const sharedClean = (best.shared || []).filter((t: string) => !GENERIC_TOKENS.has(t));
    if (sharedClean.length < 2) continue;
    if (best.distance > 2000) continue; // within 2km suggests same event
    leads.push({ orphan: nm.orphan, marker: best, distance: best.distance, shared: sharedClean });
  }
  leads.sort((a, b) => b.shared.length - a.shared.length || a.distance - b.distance);
  console.log(`Coord research leads: ${leads.length}`);

  // --- CATEGORY 4: NEEDS NEW STORY (orphan not in any category above, high notability) ---
  const handled = new Set<string>([
    ...bestDupe.keys(),
    ...bestAbsorb.keys(),
    ...leads.map(l => l.orphan.id),
  ]);
  const remaining = orphans.filter(o => !handled.has(o.id));
  console.log(`Remaining (needs story or leave-as-is): ${remaining.length}`);

  // --- OUTPUT MARKDOWN ---
  const lines: string[] = [];
  lines.push('# Orphan Analysis — Actionable Categories');
  lines.push('');
  lines.push('_Source: scripts/staging/orphan-hmdb-report.json + live Supabase query._');
  lines.push('_Generated by scripts/analyze-orphans.ts — no data modified._');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total orphans (no story, no collection): **${orphans.length}**`);
  lines.push(`- Dupe candidates (same as existing moment): **${dupeList.length}** (${dupeList.filter(d => d.confidence === 'high').length} high-confidence)`);
  lines.push(`- Absorb candidates (entity → existing story): **${absorbList.length}**`);
  lines.push(`- Coord research leads (HMDB name match): **${leads.length}**`);
  lines.push(`- Remaining (needs new story or leave orphaned): **${remaining.length}**`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## 1. Dupe Candidates');
  lines.push('');
  lines.push('_These orphans appear to be the same event as an already-wired moment._');
  lines.push('_Recommended action: review each, pick winner, delete loser (same pattern as scripts/dedupe-moments.ts)._');
  lines.push('');
  lines.push('### High confidence');
  lines.push('');
  for (const d of dupeList.filter(x => x.confidence === 'high')) {
    lines.push(`- **\`${d.orphan.id}\`** ≈ \`${d.existing.id}\``);
    lines.push(`  - orphan: "${d.orphan.name}" (${d.orphan.year})`);
    lines.push(`  - existing: "${d.existing.name}" (${d.existing.year})`);
    lines.push(`  - distance: ${d.distance}m — shared tokens: ${d.shared.join(', ')}`);
  }
  lines.push('');
  lines.push('### Medium confidence');
  lines.push('');
  for (const d of dupeList.filter(x => x.confidence === 'medium').slice(0, 30)) {
    lines.push(`- \`${d.orphan.id}\` ≈ \`${d.existing.id}\` (${d.distance}m, shared: ${d.shared.join(', ')})`);
    lines.push(`  - orphan: "${d.orphan.name.slice(0, 80)}"`);
    lines.push(`  - existing: "${d.existing.name.slice(0, 80)}"`);
  }
  lines.push('');

  lines.push('## 2. Absorb into Existing Stories');
  lines.push('');
  lines.push('_Orphan already has an entity tag that points to an existing story. Clean absorption._');
  lines.push('_Caveat: must still pass Physical Presence Rule — the orphan must physically fit the story arc, not just share an entity._');
  lines.push('');
  // Group by story for readability
  const byStory = new Map<string, typeof absorbList>();
  for (const a of absorbList) {
    if (!byStory.has(a.story.id)) byStory.set(a.story.id, []);
    byStory.get(a.story.id)!.push(a);
  }
  const sortedStories = [...byStory.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [sid, group] of sortedStories) {
    const story = group[0].story;
    lines.push(`### → \`${sid}\` (${story.story_type || '?'}) — ${group.length} orphan${group.length === 1 ? '' : 's'}`);
    lines.push(`_"${story.name}"_`);
    lines.push('');
    for (const a of group) {
      lines.push(`- \`${a.orphan.id}\` (${a.orphan.year}) — "${a.orphan.name.slice(0, 90)}"`);
      lines.push(`  - entity: ${a.entity.name} (${a.entity.type})`);
    }
    lines.push('');
  }

  lines.push('## 3. Coord Research Leads (HMDB Name Matches)');
  lines.push('');
  lines.push('_Strong name overlap suggests the HMDB marker is about the same event. **Do NOT copy HMDB coords** —');
  lines.push('HMDB places markers wherever convenient (often roadside), not at the precise event location._');
  lines.push('_Use these as research prompts: open the HMDB link, read the marker text, find the true location yourself._');
  lines.push('');
  for (const l of leads.slice(0, 40)) {
    lines.push(`- **\`${l.orphan.id}\`** (${l.orphan.year})`);
    lines.push(`  - orphan: "${l.orphan.name.slice(0, 100)}"`);
    lines.push(`  - HMDB: "${l.marker.title}" — ${l.distance}m — shared: ${l.shared.join(', ')}`);
    lines.push(`  - ${l.marker.link}`);
  }
  lines.push('');

  lines.push('## 4. Remaining Orphans (need story decision)');
  lines.push('');
  lines.push(`_${remaining.length} orphans not matched as dupes/absorbs/HMDB-leads._`);
  lines.push('_These need either: new story, new collection (city + theme), or leave-as-is (discoverable via entity/search)._');
  lines.push('_For each, check if it has an entity tag — entity-tagged orphans are already discoverable via "dive deeper"._');
  lines.push('');
  const remainingWithEntity = remaining.filter(o => (momentToEntities.get(o.id) || []).length > 0);
  const remainingIsolated = remaining.filter(o => (momentToEntities.get(o.id) || []).length === 0);
  lines.push(`- With entity tags (already discoverable, lower priority): **${remainingWithEntity.length}**`);
  lines.push(`- Fully isolated (not in any story/collection/entity): **${remainingIsolated.length}**`);
  lines.push('');
  lines.push('### Fully isolated orphans — top 30 by description length (proxy for effort invested)');
  lines.push('');
  remainingIsolated.sort((a, b) => (b.description?.length || 0) - (a.description?.length || 0));
  for (const o of remainingIsolated.slice(0, 30)) {
    lines.push(`- \`${o.id}\` (${o.year}) — "${o.name.slice(0, 100)}"`);
  }
  lines.push('');

  fs.writeFileSync('scripts/staging/orphan-analysis.md', lines.join('\n'));
  console.log('\nReport written to scripts/staging/orphan-analysis.md');
})();
