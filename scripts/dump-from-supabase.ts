/**
 * Dump all data from Supabase back to static TypeScript files.
 * This is the backup mechanism — run periodically to keep git history of content.
 *
 * Supabase is the single source of truth. This script reads FROM Supabase
 * and writes to src/data/*.ts files matching the existing format.
 *
 * Usage:
 *   npx tsx scripts/dump-from-supabase.ts
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var (from .env.local)
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/data');

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local or as an env var.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Fetch helpers ───────────────────────────────────────────────────

async function fetchAll<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .limit(10000);
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
  return (data ?? []) as T[];
}

// ─── Serialization helpers ──────────────────────────────────────────

/** Escape a string for use inside single-quoted TypeScript string literals. */
function escStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

/** Format an optional string field. Returns empty string if value is null/undefined. */
function optStr(key: string, value: string | null | undefined, indent: string): string {
  if (value == null) return '';
  return `\n${indent}${key}: '${escStr(value)}',`;
}

/** Format an optional number field. */
function optNum(key: string, value: number | null | undefined, indent: string): string {
  if (value == null) return '';
  return `\n${indent}${key}: ${value},`;
}

const SEED_HEADER = '// SEED DATA ONLY — Do not edit directly. Use Supabase as source of truth. Run scripts/dump-from-supabase.ts to update.\n';

// ─── Row types ──────────────────────────────────────────────────────

interface MomentRow {
  id: string; name: string; subtitle: string; description: string;
  location: { type: string; coordinates: [number, number] };
  type_id: string; importance: string; notability: number; accuracy: string; kind: string;
  year: number | null; date: string | null; address: string | null;
  verification_level: string; wiki_section: string | null;
  source: string | null; source_id: string | null;
}

interface StoryRow {
  id: string; name: string; nickname: string | null; years: string;
  start_year: number | null; end_year: number | null;
  category: string; story_type: string; description: string;
  tags: string[]; content_warning: string | null; wikipedia_slug: string | null;
}

interface EntityRow {
  id: string; name: string; type: string; years: string | null;
  description: string | null; canonical_story_id: string | null;
  wikipedia_slug: string | null;
}

interface CollectionRow {
  id: string; name: string; subtitle: string; description: string; tags: string[];
}

interface StoryMomentRow {
  story_id: string; moment_id: string; sort_order: number;
  narrative_glue: string | null; is_primary: boolean;
}

interface CollectionMomentRow {
  collection_id: string; moment_id: string; sort_order: number;
}

interface MomentEntityRow { moment_id: string; entity_id: string; }
interface RelatedStoryRow { story_id: string; related_story_id: string; }

interface MomentMediaRow {
  moment_id: string; type: string; url: string; caption: string | null; sort_order: number;
}

interface MomentLinkRow {
  moment_id: string; label: string; url: string; type: string; sort_order: number;
}

// ─── Dump functions ─────────────────────────────────────────────────

async function dumpMoments() {
  console.log('Fetching moments...');
  const [momentRows, entityLinks, mediaRows, linkRows] = await Promise.all([
    fetchAll<MomentRow>('moments'),
    fetchAll<MomentEntityRow>('moment_entities'),
    fetchAll<MomentMediaRow>('moment_media'),
    fetchAll<MomentLinkRow>('moment_links'),
  ]);

  // Build lookup maps
  const entityMap = new Map<string, string[]>();
  for (const r of entityLinks) {
    const arr = entityMap.get(r.moment_id) ?? [];
    arr.push(r.entity_id);
    entityMap.set(r.moment_id, arr);
  }

  const mediaMap = new Map<string, MomentMediaRow[]>();
  for (const r of mediaRows.sort((a, b) => a.sort_order - b.sort_order)) {
    const arr = mediaMap.get(r.moment_id) ?? [];
    arr.push(r);
    mediaMap.set(r.moment_id, arr);
  }

  const linkMap = new Map<string, MomentLinkRow[]>();
  for (const r of linkRows.sort((a, b) => a.sort_order - b.sort_order)) {
    const arr = linkMap.get(r.moment_id) ?? [];
    arr.push(r);
    linkMap.set(r.moment_id, arr);
  }

  const I = '    '; // indent
  const items = momentRows.map(r => {
    const lat = r.location.coordinates[1];
    const lng = r.location.coordinates[0];
    const eids = entityMap.get(r.id);
    const media = mediaMap.get(r.id);
    const links = linkMap.get(r.id);

    let s = `  {\n`;
    s += `${I}id: '${escStr(r.id)}',\n`;
    s += `${I}name: '${escStr(r.name)}',\n`;
    s += `${I}subtitle: '${escStr(r.subtitle)}',\n`;
    s += `${I}description: '${escStr(r.description)}',\n`;
    s += `${I}lat: ${lat},\n`;
    s += `${I}lng: ${lng},\n`;
    s += `${I}type: '${escStr(r.type_id)}',\n`;
    s += `${I}importance: '${r.importance}',\n`;
    s += `${I}notability: ${r.notability},\n`;
    s += `${I}verificationLevel: '${r.verification_level}',\n`;
    s += `${I}accuracy: '${r.accuracy}',\n`;
    s += `${I}kind: '${r.kind}',`;
    s += optNum('year', r.year, I);
    s += optStr('date', r.date, I);
    s += optStr('address', r.address, I);
    if (eids && eids.length > 0) {
      s += `\n${I}entityIds: [${eids.map(e => `'${escStr(e)}'`).join(', ')}],`;
    }
    s += optStr('wikiSection', r.wiki_section, I);
    if (media && media.length > 0) {
      s += `\n${I}media: [\n`;
      for (const m of media) {
        s += `${I}  { type: '${m.type}', url: '${escStr(m.url)}'`;
        if (m.caption) s += `, caption: '${escStr(m.caption)}'`;
        s += ` },\n`;
      }
      s += `${I}],`;
    }
    if (links && links.length > 0) {
      s += `\n${I}links: [\n`;
      for (const l of links) {
        s += `${I}  { label: '${escStr(l.label)}', url: '${escStr(l.url)}', type: '${l.type}' },\n`;
      }
      s += `${I}],`;
    }
    s += `\n  }`;
    return s;
  });

  const out = `${SEED_HEADER}import type { Moment } from '../types';\n\nexport const moments: Moment[] = [\n${items.join(',\n')},\n];\n`;
  const path = resolve(DATA_DIR, 'moments.ts');
  writeFileSync(path, out, 'utf-8');
  console.log(`  Wrote ${momentRows.length} moments → ${path}`);
}

async function dumpStories() {
  console.log('Fetching stories...');
  const [storyRows, smRows, relRows] = await Promise.all([
    fetchAll<StoryRow>('stories'),
    fetchAll<StoryMomentRow>('story_moments'),
    fetchAll<RelatedStoryRow>('related_stories'),
  ]);

  const smMap = new Map<string, StoryMomentRow[]>();
  for (const r of smRows.sort((a, b) => a.sort_order - b.sort_order)) {
    const arr = smMap.get(r.story_id) ?? [];
    arr.push(r);
    smMap.set(r.story_id, arr);
  }

  const relMap = new Map<string, string[]>();
  for (const r of relRows) {
    const arr = relMap.get(r.story_id) ?? [];
    arr.push(r.related_story_id);
    relMap.set(r.story_id, arr);
  }

  const I = '    ';
  const items = storyRows.map(r => {
    const moments = smMap.get(r.id) ?? [];
    const related = relMap.get(r.id);

    let s = `  {\n`;
    s += `${I}id: '${escStr(r.id)}',\n`;
    s += `${I}name: '${escStr(r.name)}',`;
    s += optStr('nickname', r.nickname, I);
    s += `\n${I}years: '${escStr(r.years)}',\n`;
    s += `${I}category: '${r.category}',\n`;
    s += `${I}storyType: '${r.story_type}',\n`;
    s += `${I}description: '${escStr(r.description)}',\n`;
    s += `${I}tags: [${r.tags.map(t => `'${escStr(t)}'`).join(', ')}],`;
    s += optStr('contentWarning', r.content_warning, I);
    // moments
    s += `\n${I}moments: [`;
    if (moments.length > 0) {
      for (const sm of moments) {
        s += `{ momentId: '${escStr(sm.moment_id)}'`;
        if (sm.narrative_glue) s += `, narrativeGlue: '${escStr(sm.narrative_glue)}'`;
        if (sm.is_primary) s += `, isPrimary: true`;
        s += ` }, `;
      }
      // trim trailing ", "
      s = s.slice(0, -2);
    }
    s += `],`;
    if (related && related.length > 0) {
      s += `\n${I}relatedStoryIds: [${related.map(id => `'${escStr(id)}'`).join(', ')}],`;
    }
    s += optStr('wikipediaSlug', r.wikipedia_slug, I);
    s += `\n  }`;
    return s;
  });

  const out = `${SEED_HEADER}import type { Story } from '../types';\n\nexport const stories: Story[] = [\n${items.join(',\n')},\n];\n`;
  const path = resolve(DATA_DIR, 'stories.ts');
  writeFileSync(path, out, 'utf-8');
  console.log(`  Wrote ${storyRows.length} stories → ${path}`);
}

async function dumpEntities() {
  console.log('Fetching entities...');
  const entityRows = await fetchAll<EntityRow>('entities');

  const I = '    ';
  const items = entityRows.map(r => {
    let s = `  {\n`;
    s += `${I}id: '${escStr(r.id)}',\n`;
    s += `${I}name: '${escStr(r.name)}',\n`;
    s += `${I}type: '${r.type}',`;
    s += optStr('years', r.years, I);
    s += optStr('description', r.description, I);
    s += optStr('canonicalStoryId', r.canonical_story_id, I);
    s += optStr('wikipediaSlug', r.wikipedia_slug, I);
    s += `\n  }`;
    return s;
  });

  const out = `${SEED_HEADER}import type { Entity } from '../types';\n\nexport const entities: Entity[] = [\n${items.join(',\n')},\n];\n`;
  const path = resolve(DATA_DIR, 'entities.ts');
  writeFileSync(path, out, 'utf-8');
  console.log(`  Wrote ${entityRows.length} entities → ${path}`);
}

async function dumpCollections() {
  console.log('Fetching collections...');
  const [collRows, cmRows] = await Promise.all([
    fetchAll<CollectionRow>('collections'),
    fetchAll<CollectionMomentRow>('collection_moments'),
  ]);

  const cmMap = new Map<string, string[]>();
  for (const r of cmRows.sort((a, b) => a.sort_order - b.sort_order)) {
    const arr = cmMap.get(r.collection_id) ?? [];
    arr.push(r.moment_id);
    cmMap.set(r.collection_id, arr);
  }

  const I = '    ';
  const items = collRows.map(r => {
    const mids = cmMap.get(r.id) ?? [];
    let s = `  {\n`;
    s += `${I}id: '${escStr(r.id)}',\n`;
    s += `${I}name: '${escStr(r.name)}',\n`;
    s += `${I}subtitle: '${escStr(r.subtitle)}',\n`;
    s += `${I}description: '${escStr(r.description)}',\n`;
    s += `${I}momentIds: [\n`;
    // Wrap long arrays
    for (let i = 0; i < mids.length; i += 5) {
      const chunk = mids.slice(i, i + 5).map(id => `'${escStr(id)}'`).join(', ');
      s += `${I}  ${chunk},\n`;
    }
    s += `${I}],\n`;
    s += `${I}tags: [${r.tags.map(t => `'${escStr(t)}'`).join(', ')}],`;
    s += `\n  }`;
    return s;
  });

  const out = `${SEED_HEADER}import type { StoryCollection } from '../types';\n\nexport const collections: StoryCollection[] = [\n${items.join(',\n')},\n];\n`;
  const path = resolve(DATA_DIR, 'collections.ts');
  writeFileSync(path, out, 'utf-8');
  console.log(`  Wrote ${collRows.length} collections → ${path}`);
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('Dump: Supabase → static TypeScript files\n');

  await dumpMoments();
  await dumpStories();
  await dumpEntities();
  await dumpCollections();

  console.log('\nDone. Review changes with `git diff src/data/`');
}

main().catch(console.error);
