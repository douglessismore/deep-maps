/**
 * Loads all data from Supabase and transforms rows into the app's TypeScript types.
 * Called once at app startup when data source is 'supabase'.
 */
import { supabase } from '../supabase';
import type { Moment, Story, StoryMoment, Entity, StoryCollection, StoryMedia, LocationLink } from '../../types';

// ─── Row types (what PostgREST returns) ──────────────────────────────

interface MomentRow {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  location: { type: string; coordinates: [number, number] }; // GeoJSON [lng, lat]
  type_id: string;
  importance: string;
  notability: number;
  accuracy: string;
  kind: string;
  year: number | null;
  date: string | null;
  address: string | null;
  verification_level: string;
  wiki_section: string | null;
  source: string | null;
  source_id: string | null;
}

interface StoryRow {
  id: string;
  name: string;
  nickname: string | null;
  years: string;
  start_year: number | null;
  end_year: number | null;
  category: string;
  story_type: string;
  description: string;
  tags: string[];
  content_warning: string | null;
  wikipedia_slug: string | null;
}

interface EntityRow {
  id: string;
  name: string;
  type: string;
  years: string | null;
  description: string | null;
  canonical_story_id: string | null;
  wikipedia_slug: string | null;
}

interface CollectionRow {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  tags: string[];
}

interface StoryMomentRow {
  story_id: string;
  moment_id: string;
  sort_order: number;
  narrative_glue: string | null;
  is_primary: boolean;
}

interface CollectionMomentRow {
  collection_id: string;
  moment_id: string;
  sort_order: number;
}

interface MomentEntityRow {
  moment_id: string;
  entity_id: string;
}

interface RelatedStoryRow {
  story_id: string;
  related_story_id: string;
}

interface MomentMediaRow {
  moment_id: string;
  type: string;
  url: string;
  caption: string | null;
  sort_order: number;
}

interface MomentLinkRow {
  moment_id: string;
  label: string;
  url: string;
  type: string;
  sort_order: number;
}

// ─── Fetch helpers ───────────────────────────────────────────────────

const PAGE_SIZE = 1000;

async function fetchAll<T>(table: string): Promise<T[]> {
  // Supabase server-side max is 1000 rows per request, regardless of .limit().
  // Must paginate with .range() to get all rows.
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to fetch ${table} at offset ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }
  return all;
}

// ─── Main loader ─────────────────────────────────────────────────────

export interface SupabaseData {
  moments: Moment[];
  stories: Story[];
  entities: Entity[];
  collections: StoryCollection[];
}

export async function loadFromSupabase(): Promise<SupabaseData> {
  // Fetch all tables in parallel
  const [
    momentRows,
    storyRows,
    entityRows,
    collectionRows,
    storyMomentRows,
    collectionMomentRows,
    momentEntityRows,
    relatedStoryRows,
    momentMediaRows,
    momentLinkRows,
  ] = await Promise.all([
    fetchAll<MomentRow>('moments'),
    fetchAll<StoryRow>('stories'),
    fetchAll<EntityRow>('entities'),
    fetchAll<CollectionRow>('collections'),
    fetchAll<StoryMomentRow>('story_moments'),
    fetchAll<CollectionMomentRow>('collection_moments'),
    fetchAll<MomentEntityRow>('moment_entities'),
    fetchAll<RelatedStoryRow>('related_stories'),
    fetchAll<MomentMediaRow>('moment_media'),
    fetchAll<MomentLinkRow>('moment_links'),
  ]);

  // ── Build lookup maps for join tables ──

  // moment_id → entity_ids
  const momentEntityMap = new Map<string, string[]>();
  for (const row of momentEntityRows) {
    const arr = momentEntityMap.get(row.moment_id) ?? [];
    arr.push(row.entity_id);
    momentEntityMap.set(row.moment_id, arr);
  }

  // moment_id → media[]
  const mediaMap = new Map<string, StoryMedia[]>();
  for (const row of momentMediaRows.sort((a, b) => a.sort_order - b.sort_order)) {
    const arr = mediaMap.get(row.moment_id) ?? [];
    arr.push({
      type: row.type as StoryMedia['type'],
      url: row.url,
      ...(row.caption ? { caption: row.caption } : {}),
    });
    mediaMap.set(row.moment_id, arr);
  }

  // moment_id → links[]
  const linkMap = new Map<string, LocationLink[]>();
  for (const row of momentLinkRows.sort((a, b) => a.sort_order - b.sort_order)) {
    const arr = linkMap.get(row.moment_id) ?? [];
    arr.push({
      label: row.label,
      url: row.url,
      type: row.type as LocationLink['type'],
    });
    linkMap.set(row.moment_id, arr);
  }

  // story_id → StoryMoment[] (sorted)
  const storyMomentsMap = new Map<string, StoryMoment[]>();
  for (const row of storyMomentRows.sort((a, b) => a.sort_order - b.sort_order)) {
    const arr = storyMomentsMap.get(row.story_id) ?? [];
    arr.push({
      momentId: row.moment_id,
      ...(row.narrative_glue ? { narrativeGlue: row.narrative_glue } : {}),
      ...(row.is_primary ? { isPrimary: true } : {}),
    });
    storyMomentsMap.set(row.story_id, arr);
  }

  // story_id → related_story_ids
  const relatedMap = new Map<string, string[]>();
  for (const row of relatedStoryRows) {
    const arr = relatedMap.get(row.story_id) ?? [];
    arr.push(row.related_story_id);
    relatedMap.set(row.story_id, arr);
  }

  // collection_id → moment_ids (sorted)
  const collMomentsMap = new Map<string, string[]>();
  for (const row of collectionMomentRows.sort((a, b) => a.sort_order - b.sort_order)) {
    const arr = collMomentsMap.get(row.collection_id) ?? [];
    arr.push(row.moment_id);
    collMomentsMap.set(row.collection_id, arr);
  }

  // ── Transform rows → app types ──

  const moments: Moment[] = momentRows.map((r) => ({
    id: r.id,
    name: r.name,
    subtitle: r.subtitle,
    description: r.description,
    lat: r.location.coordinates[1],
    lng: r.location.coordinates[0],
    type: r.type_id,
    importance: r.importance as Moment['importance'],
    notability: r.notability,
    accuracy: r.accuracy as Moment['accuracy'],
    kind: r.kind as Moment['kind'],
    ...(r.year != null ? { year: r.year } : {}),
    ...(r.date ? { date: r.date } : {}),
    ...(r.address ? { address: r.address } : {}),
    ...(r.verification_level !== 'verified' ? { verificationLevel: r.verification_level as Moment['verificationLevel'] } : { verificationLevel: 'verified' as const }),
    ...(r.wiki_section ? { wikiSection: r.wiki_section } : {}),
    ...(momentEntityMap.has(r.id) ? { entityIds: momentEntityMap.get(r.id)! } : {}),
    ...(mediaMap.has(r.id) ? { media: mediaMap.get(r.id)! } : {}),
    ...(linkMap.has(r.id) ? { links: linkMap.get(r.id)! } : {}),
  }));

  const stories: Story[] = storyRows.map((r) => ({
    id: r.id,
    name: r.name,
    ...(r.nickname ? { nickname: r.nickname } : {}),
    years: r.years,
    category: r.category as Story['category'],
    storyType: r.story_type as Story['storyType'],
    description: r.description,
    tags: r.tags,
    ...(r.content_warning ? { contentWarning: r.content_warning } : {}),
    moments: storyMomentsMap.get(r.id) ?? [],
    ...(relatedMap.has(r.id) ? { relatedStoryIds: relatedMap.get(r.id)! } : {}),
    ...(r.wikipedia_slug ? { wikipediaSlug: r.wikipedia_slug } : {}),
  }));

  const entities: Entity[] = entityRows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as Entity['type'],
    ...(r.years ? { years: r.years } : {}),
    ...(r.description ? { description: r.description } : {}),
    ...(r.canonical_story_id ? { canonicalStoryId: r.canonical_story_id } : {}),
    ...(r.wikipedia_slug ? { wikipediaSlug: r.wikipedia_slug } : {}),
  }));

  const collections: StoryCollection[] = collectionRows.map((r) => ({
    id: r.id,
    name: r.name,
    subtitle: r.subtitle,
    description: r.description,
    momentIds: collMomentsMap.get(r.id) ?? [],
    tags: r.tags,
  }));

  // ── Validate required fields on moments ──
  const invalidMoments = moments.filter(m => !m.id || !m.name || m.lat == null || m.lng == null);
  if (invalidMoments.length > 0) {
    console.warn(
      `[supabase-loader] ${invalidMoments.length} moment(s) missing required fields (id, name, lat, lng):`,
      invalidMoments.map(m => m.id || '(no id)'),
    );
  }

  // ── Sanity check: warn if row counts look truncated ──
  if (momentRows.length === PAGE_SIZE) {
    console.error(`[supabase-loader] WARNING: moments fetch returned exactly ${PAGE_SIZE} rows — pagination may be broken!`);
  }
  if (momentEntityRows.length === PAGE_SIZE) {
    console.error(`[supabase-loader] WARNING: moment_entities fetch returned exactly ${PAGE_SIZE} rows — pagination may be broken!`);
  }
  console.log(`[supabase-loader] Loaded ${moments.length} moments, ${entities.length} entities, ${stories.length} stories, ${momentEntityRows.length} entity links`);

  return { moments, stories, entities, collections };
}
