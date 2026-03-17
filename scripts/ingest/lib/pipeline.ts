/**
 * Deep Maps — Pipeline Utilities
 *
 * Shared functions for all ingestion pipelines: Wikipedia/Wikidata fetching,
 * content validation, review queue management, and publishing.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Supabase Client (service_role for writes) ────────────────────────

function loadEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, '../../../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
  return vars;
}

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  _supabase = createClient(url, key);
  return _supabase;
}

// ── Wikipedia Fetching ───────────────────────────────────────────────

interface WikipediaArticle {
  title: string;
  extract: string;       // plain text extract
  pageId: number;
  slug: string;
}

/**
 * Fetch Wikipedia article text via the REST API.
 * Returns plain text extract (no HTML).
 */
export async function fetchWikipediaArticle(slug: string): Promise<WikipediaArticle | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DeepMaps/1.0 (content pipeline)' },
    });
    if (!res.ok) {
      console.warn(`  ⚠ Wikipedia article not found: ${slug} (${res.status})`);
      return null;
    }
    const data = await res.json();
    return {
      title: data.title,
      extract: data.extract,
      pageId: data.pageid,
      slug,
    };
  } catch (err) {
    console.warn(`  ⚠ Wikipedia fetch error for ${slug}:`, err);
    return null;
  }
}

/**
 * Fetch full Wikipedia article text (not just summary).
 * Uses the TextExtracts API for longer content.
 */
export async function fetchWikipediaFullText(slug: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(slug)}&prop=extracts&explaintext=1&format=json`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DeepMaps/1.0 (content pipeline)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as { extract?: string };
    return page?.extract || null;
  } catch (err) {
    console.warn(`  ⚠ Wikipedia full text fetch error for ${slug}:`, err);
    return null;
  }
}

// ── Wikimedia Commons Image Search ───────────────────────────────────

interface CommonsImage {
  title: string;      // e.g. "File:Globe_theatre.jpg"
  thumbUrl: string;   // 800px thumbnail
  fullUrl: string;    // original file
  width: number;
  height: number;
  mime: string;
}

/**
 * Search Wikimedia Commons for a location-relevant CC-licensed photo.
 * Uses keyword search (more relevant than geosearch for historical moments).
 * Returns the best match or null.
 */
export async function searchCommonsImage(
  searchTerms: string,
  maxResults: number = 3,
): Promise<CommonsImage | null> {
  const ua = 'DeepMaps/1.0 (content pipeline)';

  // Step 1: Search for files matching the terms
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerms)}&srnamespace=6&srlimit=${maxResults}&format=json`;
  try {
    const res = await fetch(searchUrl, { headers: { 'User-Agent': ua } });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.query?.search;
    if (!results || results.length === 0) return null;

    // Step 2: Get image info for the first result
    // Prefer results with larger file sizes (more likely to be real photos)
    const best = results.sort(
      (a: { size: number }, b: { size: number }) => b.size - a.size,
    )[0];
    const title = best.title;

    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=800&format=json`;
    const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': ua } });
    if (!infoRes.ok) return null;
    const infoData = await infoRes.json();
    const pages = infoData.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as { imageinfo?: Array<Record<string, unknown>> };
    const info = page?.imageinfo?.[0];
    if (!info) return null;

    // Only accept actual images
    const mime = info.mime as string;
    if (!mime?.startsWith('image/')) return null;

    return {
      title,
      thumbUrl: (info.thumburl || info.url) as string,
      fullUrl: info.url as string,
      width: info.width as number,
      height: info.height as number,
      mime,
    };
  } catch (err) {
    console.warn(`  ⚠ Commons search error for "${searchTerms}":`, err);
    return null;
  }
}

/**
 * Validate that an image URL actually resolves.
 * Uses GET with Range header (some servers reject HEAD requests).
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'DeepMaps/1.0 (content pipeline)',
        'Range': 'bytes=0-0',
      },
    });
    // 200 (full response) or 206 (partial content) both mean the image exists
    return res.status === 200 || res.status === 206;
  } catch {
    return false;
  }
}

/**
 * Fetch the main Wikipedia article image (portrait/hero) for an entity.
 * Uses the Wikipedia REST API summary which includes the main image.
 */
export async function fetchWikipediaMainImage(slug: string): Promise<{
  url: string;
  caption: string;
} | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DeepMaps/1.0 (content pipeline)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    // The summary API returns originalimage and thumbnail
    const img = data.originalimage || data.thumbnail;
    if (!img?.source) return null;
    return {
      url: img.source,
      caption: data.description || data.title || '',
    };
  } catch {
    return null;
  }
}

/**
 * Build a search query for a moment's location photo.
 * Strategy: use the specific venue/address + key subject noun.
 * Commons responds best to concrete location names, not event descriptions.
 */
export function buildImageSearchQuery(moment: {
  name: string;
  address?: string;
  year?: number;
}): string {
  const parts: string[] = [];

  if (moment.address) {
    // Use the first part of the address (the specific venue/building)
    const addressParts = moment.address.split(',').map(s => s.trim());
    // Take venue name (first part) and city (second-to-last part)
    parts.push(addressParts[0]);
    if (addressParts.length > 2) {
      parts.push(addressParts[addressParts.length - 2]); // city
    }
  }

  // Extract proper nouns from moment name (capitalized words that aren't common verbs/articles)
  const skip = new Set(['A', 'An', 'The', 'Is', 'Are', 'Was', 'Were', 'Has', 'Have', 'Had',
    'Dies', 'Born', 'His', 'Her', 'And', 'Or', 'In', 'On', 'At', 'To', 'Of', 'For',
    'That', 'This', 'With', 'From', 'Not', 'But', 'During', 'After', 'Before', 'Never',
    'Publishes', 'Signs', 'Opens', 'Writes', 'Paints', 'Begins', 'Learns', 'Joins',
    'Presents', 'Retires', 'Takes', 'Becomes', 'Invents', 'Over', 'Among']);
  const nameNouns = moment.name.split(/\s+/)
    .filter(w => /^[A-Z]/.test(w) && !skip.has(w))
    .slice(0, 3); // Take up to 3 key nouns

  if (nameNouns.length > 0 && parts.length === 0) {
    // No address — fall back to name nouns
    parts.push(...nameNouns);
  } else if (nameNouns.length > 0) {
    // Add the first proper noun from the name if not already in address
    const firstNoun = nameNouns[0];
    if (!parts.some(p => p.includes(firstNoun))) {
      parts.push(firstNoun);
    }
  }

  return parts.join(' ').slice(0, 100);
}

// ── Wikidata Fetching ────────────────────────────────────────────────

interface WikidataEntity {
  qid: string;
  label: string;
  description: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: { lat: number; lng: number; name: string };
  deathPlace?: { lat: number; lng: number; name: string };
  occupations: string[];
  wikipediaSlug?: string;
  image?: string;         // Wikimedia Commons filename
}

/**
 * Fetch structured data from Wikidata for a given QID.
 */
export async function fetchWikidataEntity(qid: string): Promise<WikidataEntity | null> {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DeepMaps/1.0 (content pipeline)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const entity = data.entities?.[qid];
    if (!entity) return null;

    const claims = entity.claims || {};
    const getStringClaim = (prop: string): string | undefined => {
      const claim = claims[prop]?.[0]?.mainsnak?.datavalue?.value;
      return typeof claim === 'string' ? claim : undefined;
    };
    const getTimeClaim = (prop: string): string | undefined => {
      return claims[prop]?.[0]?.mainsnak?.datavalue?.value?.time;
    };

    // Get English Wikipedia slug
    const enwiki = entity.sitelinks?.enwiki?.title;

    // Get image from P18
    const imageFile = getStringClaim('P18');

    return {
      qid,
      label: entity.labels?.en?.value || '',
      description: entity.descriptions?.en?.value || '',
      birthDate: getTimeClaim('P569'),
      deathDate: getTimeClaim('P570'),
      occupations: [],  // Would need to resolve P106 QIDs — simplified for now
      wikipediaSlug: enwiki?.replace(/ /g, '_'),
      image: imageFile,
    };
  } catch (err) {
    console.warn(`  ⚠ Wikidata fetch error for ${qid}:`, err);
    return null;
  }
}

/**
 * Search Wikidata for a person by name, return their QID.
 */
export async function searchWikidata(name: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=1&format=json`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DeepMaps/1.0 (content pipeline)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.search?.[0]?.id || null;
  } catch {
    return null;
  }
}

// ── Wikipedia Pageviews (for notability estimation) ──────────────────

/**
 * Fetch average monthly pageviews for a Wikipedia article.
 * Uses the Wikimedia Pageviews API (last 12 months).
 */
export async function fetchPageviews(slug: string): Promise<number> {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 12);

  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${encodeURIComponent(slug)}/monthly/${fmt(start)}/${fmt(end)}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DeepMaps/1.0 (content pipeline)' },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) return 0;
    const total = items.reduce((sum: number, item: { views: number }) => sum + item.views, 0);
    return Math.round(total / items.length);
  } catch {
    return 0;
  }
}

/**
 * Estimate notability score (0-100) from Wikipedia pageviews.
 * Uses log10 scale matching the existing score-moments.ts approach.
 */
export function estimateNotability(avgMonthlyViews: number): number {
  if (avgMonthlyViews <= 0) return 25;  // default floor
  // log10 scale: 1K views ≈ 30, 10K ≈ 50, 100K ≈ 70, 1M ≈ 85
  const raw = Math.log10(avgMonthlyViews) * 18 - 20;
  return Math.max(5, Math.min(95, Math.round(raw)));
}

// ── Content Guide Validation ─────────────────────────────────────────

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface DraftMoment {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  lat: number;
  lng: number;
  type: string;
  importance: string;
  accuracy: string;
  kind?: string;
  year?: number;
  date?: string;
  address?: string;
  entityIds?: string[];
  verificationLevel?: string;
  wikiSection?: string;
  media?: Array<{ type: string; url: string; caption?: string }>;
  notability?: number;
}

interface DraftEntity {
  id: string;
  name: string;
  type: string;
  years?: string;
  description?: string;
  wikipediaSlug?: string;
  canonicalStoryId?: string;
}

interface DraftStory {
  id: string;
  name: string;
  years: string;
  category: string;
  storyType: string;
  description: string;
  tags: string[];
  wikipediaSlug?: string;
  relatedStoryIds?: string[];
}

const VALID_TYPES = [
  'archaeological_site', 'art_installation', 'battlefield', 'biblical_event',
  'burial_site', 'crash_site', 'crime_scene', 'cultural_site', 'cultural_venue',
  'disaster', 'discovery_site', 'government', 'haunted_site', 'historic_meeting',
  'historical_site', 'industrial_site', 'institution', 'landmark', 'military_site',
  'monument', 'natural_site', 'organization_hq', 'political_event', 'religious_site',
  'residence', 'settlement_site', 'university', 'workplace',
];

const VALID_CATEGORIES = [
  'dark-history', 'battles-conflicts', 'discovery-science', 'arts-culture',
  'mystery-unexplained', 'political-drama', 'everyday-extraordinary', 'sacred-history',
];

/**
 * Validate a draft moment against content guide rules.
 */
export function validateMoment(m: DraftMoment): ValidationError[] {
  const errors: ValidationError[] = [];

  // Name checks
  if (!m.name) errors.push({ field: 'name', message: 'Missing name', severity: 'error' });
  else {
    if (m.name.length > 120) errors.push({ field: 'name', message: `Name too long (${m.name.length}/120)`, severity: 'error' });
    if (m.name.length < 20) errors.push({ field: 'name', message: `Name suspiciously short (${m.name.length})`, severity: 'warning' });
    // Check for verb-first pattern (rough heuristic: first word should not be a proper noun article)
    if (/^(The |A |An )/i.test(m.name)) {
      errors.push({ field: 'name', message: 'Name starts with article — should be verb-first', severity: 'warning' });
    }
  }

  // Subtitle checks
  if (!m.subtitle) errors.push({ field: 'subtitle', message: 'Missing subtitle', severity: 'error' });
  else {
    if (m.subtitle.length > 140) errors.push({ field: 'subtitle', message: `Subtitle too long (${m.subtitle.length}/140)`, severity: 'error' });
    if (m.subtitle.endsWith('.')) errors.push({ field: 'subtitle', message: 'Subtitle should not end with a period', severity: 'warning' });
  }

  // Description checks
  if (!m.description) errors.push({ field: 'description', message: 'Missing description', severity: 'error' });
  else {
    if (m.description.length > 800) errors.push({ field: 'description', message: `Description too long (${m.description.length}/800)`, severity: 'error' });
    if (m.description.length < 300) errors.push({ field: 'description', message: `Description too short (${m.description.length}/300)`, severity: 'warning' });
  }

  // Coordinates
  if (typeof m.lat !== 'number' || typeof m.lng !== 'number') {
    errors.push({ field: 'coordinates', message: 'Missing or invalid coordinates', severity: 'error' });
  } else {
    if (m.lat < -90 || m.lat > 90) errors.push({ field: 'lat', message: `Invalid latitude: ${m.lat}`, severity: 'error' });
    if (m.lng < -180 || m.lng > 180) errors.push({ field: 'lng', message: `Invalid longitude: ${m.lng}`, severity: 'error' });
  }

  // Metadata
  if (!VALID_TYPES.includes(m.type)) {
    errors.push({ field: 'type', message: `Invalid type: "${m.type}". Must be one of: ${VALID_TYPES.join(', ')}`, severity: 'error' });
  }
  if (!['major', 'minor', 'contextual'].includes(m.importance)) {
    errors.push({ field: 'importance', message: `Invalid importance: "${m.importance}"`, severity: 'error' });
  }
  if (!['exact', 'approximate', 'general-area'].includes(m.accuracy)) {
    errors.push({ field: 'accuracy', message: `Invalid accuracy: "${m.accuracy}"`, severity: 'error' });
  }

  // Entity wiring
  if (!m.entityIds || m.entityIds.length === 0) {
    errors.push({ field: 'entityIds', message: 'No entities linked', severity: 'warning' });
  }

  return errors;
}

/**
 * Validate a draft entity against content guide rules.
 */
export function validateEntity(e: DraftEntity): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!e.id) errors.push({ field: 'id', message: 'Missing id', severity: 'error' });
  if (!e.name) errors.push({ field: 'name', message: 'Missing name', severity: 'error' });

  if (e.description) {
    if (e.description.length > 400) errors.push({ field: 'description', message: `Description too long (${e.description.length}/400)`, severity: 'error' });
    // Check for dead-weight opening
    if (/^Born /i.test(e.description)) {
      errors.push({ field: 'description', message: 'Description starts with "Born..." — frontload the hook instead', severity: 'warning' });
    }
  }

  if (!e.wikipediaSlug) errors.push({ field: 'wikipediaSlug', message: 'Missing Wikipedia slug', severity: 'warning' });

  return errors;
}

/**
 * Validate a draft story against content guide rules.
 */
export function validateStory(s: DraftStory): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!s.id) errors.push({ field: 'id', message: 'Missing id', severity: 'error' });
  if (!s.name) errors.push({ field: 'name', message: 'Missing name', severity: 'error' });
  if (!VALID_CATEGORIES.includes(s.category)) {
    errors.push({ field: 'category', message: `Invalid category: "${s.category}"`, severity: 'error' });
  }
  if (!['incident', 'biography', 'place', 'era'].includes(s.storyType)) {
    errors.push({ field: 'storyType', message: `Invalid storyType: "${s.storyType}"`, severity: 'error' });
  }
  if (s.description && s.description.length > 300) {
    errors.push({ field: 'description', message: `Description too long (${s.description.length}/300)`, severity: 'warning' });
  }
  if (!s.wikipediaSlug) errors.push({ field: 'wikipediaSlug', message: 'Missing Wikipedia slug', severity: 'warning' });

  return errors;
}

// ── Review Queue Management ──────────────────────────────────────────

export interface ReviewQueueItem {
  ingestion_run_id: number;
  item_type: 'moment' | 'story' | 'entity' | 'collection';
  item_id: string;
  draft_data: Record<string, unknown>;
  related_items?: Record<string, unknown>;
  validation_errors?: ValidationError[];
}

/**
 * Create a new ingestion run record.
 */
export async function createIngestionRun(
  source: string,
  config: Record<string, unknown>,
): Promise<number> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('ingestion_runs')
    .insert({ source, config, status: 'running' })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create ingestion run: ${error.message}`);
  return data.id;
}

/**
 * Update an ingestion run's status and stats.
 */
export async function updateIngestionRun(
  runId: number,
  status: string,
  stats?: Record<string, unknown>,
): Promise<void> {
  const sb = getSupabase();
  const update: Record<string, unknown> = { status };
  if (stats) update.stats = stats;
  if (status === 'completed' || status === 'failed') {
    update.completed_at = new Date().toISOString();
  }
  const { error } = await sb.from('ingestion_runs').update(update).eq('id', runId);
  if (error) throw new Error(`Failed to update ingestion run: ${error.message}`);
}

/**
 * Insert items into the review queue.
 */
export async function insertToReviewQueue(
  items: ReviewQueueItem[],
): Promise<void> {
  if (items.length === 0) return;
  const sb = getSupabase();

  // Insert in batches of 50
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    const { error } = await sb.from('review_queue').insert(batch);
    if (error) throw new Error(`Failed to insert review queue batch: ${error.message}`);
  }
}

// ── Publishing (move approved items to live tables) ──────────────────

/**
 * Publish all approved items from a given ingestion run.
 * Returns counts of published items by type.
 */
export async function publishApproved(runId: number): Promise<Record<string, number>> {
  const sb = getSupabase();
  const counts: Record<string, number> = {};

  // Fetch approved items, ordered: entities first, then stories, then moments
  const { data: items, error } = await sb
    .from('review_queue')
    .select('*')
    .eq('ingestion_run_id', runId)
    .eq('status', 'approved')
    .order('item_type');

  if (error) throw new Error(`Failed to fetch approved items: ${error.message}`);
  if (!items || items.length === 0) {
    console.log('No approved items to publish.');
    return counts;
  }

  // Group by type for ordered insertion (stories → entities → moments)
  // Stories before entities because entities.canonical_story_id is a FK to stories.
  const entities = items.filter(i => i.item_type === 'entity');
  const stories = items.filter(i => i.item_type === 'story');
  const moments = items.filter(i => i.item_type === 'moment');

  // Publish stories first (entities reference them via canonical_story_id FK)
  for (const item of stories) {
    const d = item.draft_data as Record<string, unknown>;
    // Map camelCase draft fields → snake_case DB columns
    const storyRow: Record<string, unknown> = {
      id: d.id,
      name: d.name,
      years: d.years,
      start_year: d.startYear ?? d.start_year,
      end_year: d.endYear ?? d.end_year,
      category: d.category,
      story_type: d.storyType ?? d.story_type ?? 'biography',
      description: d.description,
      tags: d.tags ?? [],
      wikipedia_slug: d.wikipediaSlug ?? d.wikipedia_slug,
    };
    // Remove undefined values
    for (const key of Object.keys(storyRow)) {
      if (storyRow[key] === undefined) delete storyRow[key];
    }
    const { error: err } = await sb.from('stories').upsert(storyRow);
    if (err) console.error(`  ❌ Story ${item.item_id}: ${err.message}`);
    else counts.stories = (counts.stories || 0) + 1;
  }

  // Publish entities (after stories, since canonical_story_id is a FK)
  for (const item of entities) {
    const d = item.draft_data as Record<string, unknown>;
    const entityRow: Record<string, unknown> = {
      id: d.id,
      name: d.name,
      type: d.type,
      years: d.years,
      description: d.description,
      canonical_story_id: d.canonicalStoryId ?? d.canonical_story_id,
      wikipedia_slug: d.wikipediaSlug ?? d.wikipedia_slug,
    };
    for (const key of Object.keys(entityRow)) {
      if (entityRow[key] === undefined) delete entityRow[key];
    }
    const { error: err } = await sb.from('entities').upsert(entityRow);
    if (err) console.error(`  ❌ Entity ${item.item_id}: ${err.message}`);
    else counts.entities = (counts.entities || 0) + 1;
  }

  // Publish moments (with EWKT geometry)
  for (const item of moments) {
    const d = item.draft_data as Record<string, unknown>;
    const lat = d.lat as number;
    const lng = d.lng as number;

    // Map camelCase draft fields → snake_case DB columns
    const momentRow: Record<string, unknown> = {
      id: d.id,
      name: d.name,
      subtitle: d.subtitle,
      description: d.description,
      location: `SRID=4326;POINT(${lng} ${lat})`,
      type_id: d.type ?? d.type_id,
      importance: d.importance,
      notability: d.notability ?? 30,
      accuracy: d.accuracy,
      kind: d.kind ?? 'event',
      year: d.year,
      date: d.date,
      address: d.address,
      verification_level: d.verificationLevel ?? d.verification_level ?? 'verified',
      wiki_section: d.wikiSection ?? d.wiki_section,
      source: d.source ?? 'notable-people',
      source_id: d.sourceId ?? d.source_id,
    };
    for (const key of Object.keys(momentRow)) {
      if (momentRow[key] === undefined) delete momentRow[key];
    }

    const { error: err } = await sb.from('moments').upsert(momentRow);
    if (err) {
      console.error(`  ❌ Moment ${item.item_id}: ${err.message}`);
      continue;
    }
    counts.moments = (counts.moments || 0) + 1;

    // Publish related items (join table rows)
    const related = item.related_items as Record<string, unknown[]> | undefined;
    if (related) {
      if (related.moment_entities) {
        const { error: meErr } = await sb.from('moment_entities').upsert(related.moment_entities);
        if (meErr) console.error(`  ⚠ moment_entities for ${item.item_id}: ${meErr.message}`);
        else counts.moment_entities = (counts.moment_entities || 0) + (related.moment_entities.length || 0);
      }
      if (related.story_moments) {
        const { error: smErr } = await sb.from('story_moments').upsert(related.story_moments);
        if (smErr) console.error(`  ⚠ story_moments for ${item.item_id}: ${smErr.message}`);
        else counts.story_moments = (counts.story_moments || 0) + (related.story_moments.length || 0);
      }
      if (related.moment_media) {
        for (const media of related.moment_media as Record<string, unknown>[]) {
          const { error: mmErr } = await sb.from('moment_media').upsert(media);
          if (mmErr) console.error(`  ⚠ moment_media for ${item.item_id}: ${mmErr.message}`);
          else counts.moment_media = (counts.moment_media || 0) + 1;
        }
      }
      if (related.related_stories) {
        const { error: rsErr } = await sb.from('related_stories').upsert(related.related_stories);
        if (rsErr) console.error(`  ⚠ related_stories for ${item.item_id}: ${rsErr.message}`);
        else counts.related_stories = (counts.related_stories || 0) + (related.related_stories.length || 0);
      }
    }
  }

  console.log(`\nPublished: ${JSON.stringify(counts, null, 2)}`);
  return counts;
}

// ── Deduplication ────────────────────────────────────────────────────

export interface ExistingPersonData {
  entityId: string;
  entityDescription: string;
  storyId: string | null;
  existingMomentIds: string[];
  existingMomentNames: string[];
}

/**
 * Check if a person already exists in the database.
 * Searches by wikipedia_slug (canonical) and name (fuzzy fallback).
 * Returns existing entity/story/moment data for dedup context.
 */
export async function checkExistingPerson(
  name: string,
  wikipediaSlug?: string,
): Promise<ExistingPersonData | null> {
  const sb = getSupabase();

  // 1. Search by wikipedia_slug (most reliable)
  let entityId: string | null = null;
  let entityDescription = '';

  if (wikipediaSlug) {
    const { data: bySlug } = await sb
      .from('entities')
      .select('id, name, description, wikipedia_slug')
      .eq('wikipedia_slug', wikipediaSlug)
      .eq('type', 'person')
      .limit(1);
    if (bySlug && bySlug.length > 0) {
      entityId = bySlug[0].id;
      entityDescription = bySlug[0].description || '';
    }
  }

  // 2. Fallback: search by kebab-case ID
  if (!entityId) {
    const candidateId = toKebabCase(name);
    const { data: byId } = await sb
      .from('entities')
      .select('id, name, description')
      .eq('id', candidateId)
      .eq('type', 'person')
      .limit(1);
    if (byId && byId.length > 0) {
      entityId = byId[0].id;
      entityDescription = byId[0].description || '';
    }
  }

  // 3. Fallback: search by name (case-insensitive)
  if (!entityId) {
    const { data: byName } = await sb
      .from('entities')
      .select('id, name, description')
      .ilike('name', name)
      .eq('type', 'person')
      .limit(1);
    if (byName && byName.length > 0) {
      entityId = byName[0].id;
      entityDescription = byName[0].description || '';
    }
  }

  if (!entityId) return null;

  // 4. Find the biography story for this entity
  let storyId: string | null = null;
  const { data: entityRow } = await sb
    .from('entities')
    .select('canonical_story_id')
    .eq('id', entityId)
    .limit(1);
  if (entityRow && entityRow.length > 0 && entityRow[0].canonical_story_id) {
    storyId = entityRow[0].canonical_story_id;
  }

  // Fallback: find story via story_moments join
  if (!storyId) {
    const { data: storyMoments } = await sb
      .from('story_moments')
      .select('story_id')
      .ilike('story_id', `%${toKebabCase(name)}%`)
      .limit(1);
    if (storyMoments && storyMoments.length > 0) {
      storyId = storyMoments[0].story_id;
    }
  }

  // 5. Get existing moments for this entity
  const { data: momentEntities } = await sb
    .from('moment_entities')
    .select('moment_id')
    .eq('entity_id', entityId);

  const momentIds = (momentEntities || []).map(me => me.moment_id);

  let momentNames: string[] = [];
  if (momentIds.length > 0) {
    const { data: moments } = await sb
      .from('moments')
      .select('id, name')
      .in('id', momentIds);
    momentNames = (moments || []).map(m => `${m.id}: ${m.name}`);
  }

  return {
    entityId,
    entityDescription,
    storyId,
    existingMomentIds: momentIds,
    existingMomentNames: momentNames,
  };
}

// ── Utility ──────────────────────────────────────────────────────────

/**
 * Convert a name to kebab-case ID.
 */
export function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Rate-limited fetch with delay between requests.
 */
export async function rateLimitedFetch(
  urls: string[],
  delayMs: number = 200,
): Promise<Response[]> {
  const results: Response[] = [];
  for (const url of urls) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DeepMaps/1.0 (content pipeline)' },
    });
    results.push(res);
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
  }
  return results;
}

/**
 * Parse a Wikidata time value like "+1879-03-14T00:00:00Z" into a year.
 */
export function parseWikidataYear(time: string | undefined): number | undefined {
  if (!time) return undefined;
  const match = time.match(/^[+-]?(\d+)/);
  if (!match) return undefined;
  const year = parseInt(match[1], 10);
  return time.startsWith('-') ? -year : year;
}

/**
 * Derive a Wikipedia slug from a person's name.
 * Handles common patterns (spaces → underscores, etc.)
 */
export function deriveWikipediaSlug(name: string): string {
  return name.replace(/ /g, '_');
}
