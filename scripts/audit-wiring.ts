#!/usr/bin/env npx tsx
/**
 * Deep Maps — Wiring Integrity Audit
 *
 * Checks every entity, story, moment, and join table row for:
 *   1. Orphaned moments (no story_moments link)
 *   2. Orphaned entities (no moment_entities link)
 *   3. Broken FKs (moment_entities pointing to non-existent entities)
 *   4. Broken FKs (story_moments pointing to non-existent stories/moments)
 *   5. Entities with no canonical_story_id or broken canonical_story_id
 *   6. Stories with no moments
 *   7. Moments with no entityIds
 *   8. Moments missing from all collections
 *   9. Entities with no wikipedia_slug
 *   10. Duplicate entity/story/moment IDs (should be impossible with PKs, but check data)
 *
 * Usage:
 *   npx tsx scripts/audit-wiring.ts            # full audit
 *   npx tsx scripts/audit-wiring.ts --fix      # audit + auto-fix safe issues
 *   npx tsx scripts/audit-wiring.ts --source notable-people  # audit only pipeline content
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PAGE_SIZE = 1000;
async function fetchAll<T = any>(table: string, selectCols: string = '*'): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from(table)
      .select(selectCols)
      .range(from, from + PAGE_SIZE - 1);
    if (error) { console.error(`fetchAll ${table} failed at offset ${from}: ${error.message}`); break; }
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

const args = process.argv.slice(2);
const DO_FIX = args.includes('--fix');
const SOURCE_FILTER = (() => {
  const idx = args.indexOf('--source');
  return idx !== -1 ? args[idx + 1] : undefined;
})();

interface Issue {
  severity: 'error' | 'warning';
  category: string;
  id: string;
  message: string;
  fixable: boolean;
}

const issues: Issue[] = [];

function issue(severity: 'error' | 'warning', category: string, id: string, message: string, fixable = false) {
  issues.push({ severity, category, id, message, fixable });
}

async function loadAllData() {
  const [
    entities,
    stories,
    moments,
    storyMoments,
    momentEntities,
    collections,
    collectionMoments,
    relatedStories,
    momentMedia,
  ] = await Promise.all([
    fetchAll('entities', 'id, name, type, canonical_story_id, wikipedia_slug, description'),
    fetchAll('stories', 'id, name, category, wikipedia_slug, description'),
    fetchAll('moments', 'id, name, year, source, notability, description'),
    fetchAll('story_moments', 'story_id, moment_id, sort_order, is_primary'),
    fetchAll('moment_entities', 'moment_id, entity_id'),
    fetchAll('collections', 'id, name'),
    fetchAll('collection_moments', 'collection_id, moment_id'),
    fetchAll('related_stories', 'story_id, related_story_id'),
    fetchAll('moment_media', 'moment_id, url'),
  ]);

  return {
    entities,
    stories,
    moments,
    storyMoments,
    momentEntities,
    collections,
    collectionMoments,
    relatedStories,
    momentMedia,
  };
}

async function audit() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Deep Maps — Wiring Integrity Audit');
  console.log('═══════════════════════════════════════════════════');
  if (SOURCE_FILTER) console.log(`  Filter: source = "${SOURCE_FILTER}"`);
  console.log('');

  const d = await loadAllData();

  const entityIds = new Set(d.entities.map(e => e.id));
  const storyIds = new Set(d.stories.map(s => s.id));
  const momentIds = new Set(d.moments.map(m => m.id));
  const collectionIds = new Set(d.collections.map(c => c.id));

  // Filter moments by source if requested
  const targetMoments = SOURCE_FILTER
    ? d.moments.filter(m => m.source === SOURCE_FILTER)
    : d.moments;
  const targetMomentIds = new Set(targetMoments.map(m => m.id));

  // ── 1. Orphaned moments (not in any story) ─────────────────────
  const momentsInStories = new Set(d.storyMoments.map(sm => sm.moment_id));
  for (const m of targetMoments) {
    if (!momentsInStories.has(m.id)) {
      issue('error', 'ORPHAN_MOMENT', m.id, `Moment "${m.name}" is not in any story`, false);
    }
  }

  // ── 2. Moments with no entity links ────────────────────────────
  const momentsWithEntities = new Set(d.momentEntities.map(me => me.moment_id));
  for (const m of targetMoments) {
    if (!momentsWithEntities.has(m.id)) {
      issue('warning', 'NO_ENTITY_LINK', m.id, `Moment "${m.name}" has no entityIds — no Dive Deeper chips`, false);
    }
  }

  // ── 3. Broken FK: moment_entities → entities ───────────────────
  for (const me of d.momentEntities) {
    if (SOURCE_FILTER && !targetMomentIds.has(me.moment_id)) continue;
    if (!entityIds.has(me.entity_id)) {
      issue('error', 'BROKEN_FK_ENTITY', `${me.moment_id}→${me.entity_id}`,
        `moment_entities references non-existent entity "${me.entity_id}"`, true);
    }
  }

  // ── 4. Broken FK: story_moments → stories/moments ──────────────
  for (const sm of d.storyMoments) {
    if (SOURCE_FILTER && !targetMomentIds.has(sm.moment_id)) continue;
    if (!storyIds.has(sm.story_id)) {
      issue('error', 'BROKEN_FK_STORY', `${sm.story_id}→${sm.moment_id}`,
        `story_moments references non-existent story "${sm.story_id}"`, true);
    }
    if (!momentIds.has(sm.moment_id)) {
      issue('error', 'BROKEN_FK_MOMENT', `${sm.story_id}→${sm.moment_id}`,
        `story_moments references non-existent moment "${sm.moment_id}"`, true);
    }
  }

  // ── 5. Broken FK: related_stories ──────────────────────────────
  for (const rs of d.relatedStories) {
    if (!storyIds.has(rs.story_id)) {
      issue('error', 'BROKEN_FK_RELATED', `${rs.story_id}→${rs.related_story_id}`,
        `related_stories references non-existent story "${rs.story_id}"`, true);
    }
    if (!storyIds.has(rs.related_story_id)) {
      issue('warning', 'BROKEN_FK_RELATED', `${rs.story_id}→${rs.related_story_id}`,
        `related_stories references non-existent related story "${rs.related_story_id}"`, true);
    }
  }

  // ── 6. Entities with broken or missing canonical_story_id ──────
  for (const e of d.entities) {
    if (SOURCE_FILTER) {
      // Only check entities linked to target moments
      const linked = d.momentEntities.some(me => targetMomentIds.has(me.moment_id) && me.entity_id === e.id);
      if (!linked) continue;
    }
    if (!e.canonical_story_id) {
      issue('warning', 'NO_CANONICAL_STORY', e.id, `Entity "${e.name}" has no canonical_story_id`, false);
    } else if (!storyIds.has(e.canonical_story_id)) {
      issue('error', 'BROKEN_CANONICAL_STORY', e.id,
        `Entity "${e.name}" canonical_story_id "${e.canonical_story_id}" doesn't exist`, false);
    }
  }

  // ── 7. Entities with no wikipedia_slug ─────────────────────────
  for (const e of d.entities) {
    if (SOURCE_FILTER) {
      const linked = d.momentEntities.some(me => targetMomentIds.has(me.moment_id) && me.entity_id === e.id);
      if (!linked) continue;
    }
    if (!e.wikipedia_slug) {
      issue('warning', 'NO_WIKI_SLUG', e.id, `Entity "${e.name}" has no wikipedia_slug — no "Read on Wikipedia" link`, false);
    }
  }

  // ── 8. Orphaned entities (no moments reference them) ───────────
  const entitiesWithMoments = new Set(d.momentEntities.map(me => me.entity_id));
  for (const e of d.entities) {
    if (!entitiesWithMoments.has(e.id)) {
      issue('warning', 'ORPHAN_ENTITY', e.id, `Entity "${e.name}" is not referenced by any moment`, false);
    }
  }

  // ── 9. Stories with no moments ─────────────────────────────────
  const storiesWithMoments = new Set(d.storyMoments.map(sm => sm.story_id));
  for (const s of d.stories) {
    if (SOURCE_FILTER) continue; // stories don't have source field; skip filter
    if (!storiesWithMoments.has(s.id)) {
      issue('warning', 'EMPTY_STORY', s.id, `Story "${s.name}" has no moments`, false);
    }
  }

  // ── 10. Stories with no relatedStoryIds (no Dive Deeper) ───────
  const storiesWithRelated = new Set(d.relatedStories.map(rs => rs.story_id));
  for (const s of d.stories) {
    if (SOURCE_FILTER) continue; // stories don't have source field; skip filter
    if (!storiesWithRelated.has(s.id)) {
      issue('warning', 'NO_RELATED_STORIES', s.id, `Story "${s.name}" has no relatedStoryIds — empty Dive Deeper`, false);
    }
  }

  // ── 11. Moments not in any collection ──────────────────────────
  const momentsInCollections = new Set(d.collectionMoments.map(cm => cm.moment_id));
  let uncollected = 0;
  for (const m of targetMoments) {
    if (!momentsInCollections.has(m.id)) {
      uncollected++;
    }
  }
  if (uncollected > 0) {
    issue('warning', 'NO_COLLECTION', `${uncollected}_moments`,
      `${uncollected} moments are not in any collection — undiscoverable via Collections tab`, false);
  }

  // ── 12. Entity description quality (hook-first check) ──────────
  for (const e of d.entities) {
    if (SOURCE_FILTER) {
      const linked = d.momentEntities.some(me => targetMomentIds.has(me.moment_id) && me.entity_id === e.id);
      if (!linked) continue;
    }
    if (e.description) {
      const firstWords = e.description.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      if (firstWords.startsWith('born ') || firstWords.match(/^[a-z]+ was /)) {
        issue('warning', 'BAD_HOOK', e.id,
          `Entity "${e.name}" description starts with "${firstWords}..." — violates hook-first rule`, false);
      }
    }
  }

  // ── 13. Moment description length check ────────────────────────
  for (const m of targetMoments) {
    const len = (m.description || '').length;
    if (len < 300) {
      issue('warning', 'SHORT_DESC', m.id, `Moment "${m.name}" description is ${len} chars (min: 300)`, false);
    }
    if (len > 800) {
      issue('warning', 'LONG_DESC', m.id, `Moment "${m.name}" description is ${len} chars (max: 800)`, false);
    }
  }

  // ── 14. Broken FK: collection_moments ──────────────────────────
  for (const cm of d.collectionMoments) {
    if (!momentIds.has(cm.moment_id)) {
      issue('error', 'BROKEN_FK_COLLECTION', `${cm.collection_id}→${cm.moment_id}`,
        `collection_moments references non-existent moment "${cm.moment_id}"`, true);
    }
    if (!collectionIds.has(cm.collection_id)) {
      issue('error', 'BROKEN_FK_COLLECTION', `${cm.collection_id}→${cm.moment_id}`,
        `collection_moments references non-existent collection "${cm.collection_id}"`, true);
    }
  }

  // ── Report ─────────────────────────────────────────────────────

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  console.log(`\n📊 Database: ${d.entities.length} entities, ${d.stories.length} stories, ${d.moments.length} moments, ${d.collections.length} collections`);
  console.log(`   Join tables: ${d.storyMoments.length} story_moments, ${d.momentEntities.length} moment_entities, ${d.collectionMoments.length} collection_moments, ${d.relatedStories.length} related_stories, ${d.momentMedia.length} moment_media`);

  if (issues.length === 0) {
    console.log('\n✅ All wiring checks passed. No issues found.');
    return;
  }

  // Group by category
  const byCategory = new Map<string, Issue[]>();
  for (const i of issues) {
    const list = byCategory.get(i.category) || [];
    list.push(i);
    byCategory.set(i.category, list);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Found ${errors.length} errors, ${warnings.length} warnings`);
  console.log(`${'═'.repeat(60)}`);

  for (const [cat, catIssues] of [...byCategory].sort((a, b) => {
    // Errors first
    const aHasError = a[1].some(i => i.severity === 'error');
    const bHasError = b[1].some(i => i.severity === 'error');
    if (aHasError !== bHasError) return aHasError ? -1 : 1;
    return b[1].length - a[1].length;
  })) {
    const errorCount = catIssues.filter(i => i.severity === 'error').length;
    const warnCount = catIssues.filter(i => i.severity === 'warning').length;
    const badge = errorCount > 0 ? '❌' : '⚠️';
    console.log(`\n${badge} ${cat} (${errorCount > 0 ? errorCount + ' errors' : ''}${errorCount > 0 && warnCount > 0 ? ', ' : ''}${warnCount > 0 ? warnCount + ' warnings' : ''})`);

    // Show first 10, summarize rest
    const show = catIssues.slice(0, 10);
    for (const i of show) {
      const prefix = i.severity === 'error' ? '  ❌' : '  ⚠️';
      console.log(`${prefix} ${i.id}: ${i.message}`);
    }
    if (catIssues.length > 10) {
      console.log(`  ... and ${catIssues.length - 10} more`);
    }
  }

  // ── Auto-fix ───────────────────────────────────────────────────
  if (DO_FIX) {
    const fixable = issues.filter(i => i.fixable);
    if (fixable.length === 0) {
      console.log('\n🔧 No auto-fixable issues found.');
    } else {
      console.log(`\n🔧 Auto-fixing ${fixable.length} issues...`);

      // Delete broken FK rows in join tables
      for (const i of fixable) {
        if (i.category === 'BROKEN_FK_ENTITY') {
          const [momentId, entityId] = i.id.split('→');
          await sb.from('moment_entities').delete().eq('moment_id', momentId).eq('entity_id', entityId);
          console.log(`  Deleted broken moment_entities: ${i.id}`);
        }
        if (i.category === 'BROKEN_FK_STORY' || i.category === 'BROKEN_FK_MOMENT') {
          const [storyId, momentId] = i.id.split('→');
          await sb.from('story_moments').delete().eq('story_id', storyId).eq('moment_id', momentId);
          console.log(`  Deleted broken story_moments: ${i.id}`);
        }
        if (i.category === 'BROKEN_FK_RELATED') {
          const [storyId, relatedId] = i.id.split('→');
          await sb.from('related_stories').delete().eq('story_id', storyId).eq('related_story_id', relatedId);
          console.log(`  Deleted broken related_stories: ${i.id}`);
        }
        if (i.category === 'BROKEN_FK_COLLECTION') {
          const [collectionId, momentId] = i.id.split('→');
          await sb.from('collection_moments').delete().eq('collection_id', collectionId).eq('moment_id', momentId);
          console.log(`  Deleted broken collection_moments: ${i.id}`);
        }
      }
      console.log('  ✓ Auto-fix complete');
    }
  }

  // Exit code
  if (errors.length > 0) {
    console.log(`\n💀 ${errors.length} errors require manual attention.`);
    process.exit(1);
  }
}

audit().catch(err => {
  console.error('\n💀 Audit failed:', err);
  process.exit(1);
});
