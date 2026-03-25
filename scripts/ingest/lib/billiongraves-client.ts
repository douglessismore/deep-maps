/**
 * Deep Maps — BillionGraves Client
 *
 * Searches BillionGraves for burial records and extracts GPS coordinates
 * from record pages. Pure fetch() + HTML parsing — no API keys needed.
 *
 * Data access strategy (confirmed via browser research):
 * 1. Search: billiongraves.com/search/results?GivenNames=X&FamilyName=Y&...
 *    → Returns HTML with record links in format /grave/{slug}/{recordId}
 * 2. Record page: contains MapTiler static map <img> with GPS in URL:
 *    api.maptiler.com/maps/streets/static/{lng},{lat},10/...
 * 3. Fallback: billiongraves.com/api/1.3/record/{id}/page (JSON)
 */

// ── Types ────────────────────────────────────────────────────────────

export interface BGSearchResult {
  fullName: string;
  birthDate?: string;     // e.g. "12 Dec 1936" or year only
  deathDate?: string;
  birthYear?: number;
  deathYear?: number;
  cemeteryName: string;
  cemeteryLocation: string;  // e.g. "United States, Illinois, Springfield"
  recordId: number;
  recordUrl: string;      // e.g. /grave/Abraham-Lincoln/73592261
}

export interface BurialSearchResult {
  fullName: string;
  birthYear?: number;
  deathYear?: number;
  lat: number;
  lng: number;
  cemeteryName: string;
  recordId: number;
  sourceUrl: string;
}

// ── Constants ────────────────────────────────────────────────────────

const BG_BASE = 'https://billiongraves.com';
const USER_AGENT = 'DeepMaps/1.0 (cemetery-verification)';
const RATE_LIMIT_MS = 3000;

// ── Rate Limiting ────────────────────────────────────────────────────

let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise(r => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      if (res.status === 429) {
        const backoff = (attempt + 1) * 5000;
        console.warn(`  ⚠ Rate limited (429), waiting ${backoff / 1000}s...`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }

      if (res.status >= 500 && attempt < maxRetries - 1) {
        const backoff = (attempt + 1) * 3000;
        console.warn(`  ⚠ Server error (${res.status}), retrying in ${backoff / 1000}s...`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }

      return res;
    } catch (err) {
      if (attempt < maxRetries - 1) {
        const backoff = (attempt + 1) * 3000;
        console.warn(`  ⚠ Fetch error, retrying in ${backoff / 1000}s:`, (err as Error).message);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      throw err;
    }
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
}

// ── Search ───────────────────────────────────────────────────────────

// BG's search is a client-side rendered Next.js SPA — fetch() cannot
// retrieve search results. Search must be done via browser automation
// (Phase 1: Discovery) which produces a mapping file. Phase 2 (this
// pipeline) reads those mappings and fetches GPS data via fetch().
//
// See scripts/ingest/billiongraves-discover.ts for the discovery phase.

// ── Mapping File ─────────────────────────────────────────────────────

export interface BGMapping {
  momentId: string;
  entityId: string;
  entityName: string;
  bgRecordId: number;
  bgUrl: string;
  notes?: string;
}

/**
 * Load BG record ID mappings from a JSON file.
 * Created by the discovery phase (billiongraves-discover.ts).
 */
export function loadMappings(filePath: string): BGMapping[] {
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Mapping file not found: ${filePath}. Run discovery phase first.`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// ── GPS Extraction ───────────────────────────────────────────────────

/** Full record data extracted from BG record page __NEXT_DATA__. */
export interface BGRecordData {
  recordId: string;
  givenNames: string;
  familyNames: string;
  lat: number;
  lng: number;
  cemeteryName: string;
  cemeteryCity?: string;
  cemeteryState?: string;
  cemeteryCountry?: string;
  description?: string;
}

/**
 * Fetch a BillionGraves record page and extract full record data from __NEXT_DATA__.
 *
 * BG record pages are server-side rendered with complete record data
 * in the Next.js __NEXT_DATA__ script tag, including exact GPS coordinates.
 */
export async function fetchRecordData(recordId: number): Promise<BGRecordData | null> {
  const pageUrl = `${BG_BASE}/grave/r/${recordId}`;
  const res = await rateLimitedFetch(pageUrl);

  if (!res.ok) {
    console.warn(`  ⚠ BG record page failed (${res.status}) for ID ${recordId}`);
    return null;
  }

  const html = await res.text();

  // Primary: extract from __NEXT_DATA__
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1]);
      const record = nd.props?.pageProps?.apiData?.Record;
      if (record && record.lat != null && record.lon != null) {
        const lat = Number(record.lat);
        const lng = Number(record.lon);
        if (isValidCoordinate(lat, lng)) {
          return {
            recordId: String(record.record_id || recordId),
            givenNames: record.given_names || '',
            familyNames: record.family_names || '',
            lat,
            lng,
            cemeteryName: record.cemetery_name || '',
            cemeteryCity: record.cemetery_city,
            cemeteryState: record.cemetery_state,
            cemeteryCountry: record.cemetery_country,
            description: record.description,
          };
        }
      }
    } catch {
      // JSON parse failed, fall through to fallback
    }
  }

  // Fallback: extract coordinates from raw HTML (MapTiler URLs, coordinate patterns)
  return extractGPSFromHtml(html, recordId);
}

/**
 * Legacy GPS extraction from raw HTML content.
 * Used as fallback when __NEXT_DATA__ parsing fails.
 */
function extractGPSFromHtml(html: string, recordId: number): BGRecordData | null {
  // Strategy 1: MapTiler static map URL
  const maptilerRegex = /maptiler\.com\/maps\/[^/]+\/static\/([-\d.]+),([-\d.]+),/;
  const maptilerMatch = html.match(maptilerRegex);
  if (maptilerMatch) {
    const lng = parseFloat(maptilerMatch[1]);
    const lat = parseFloat(maptilerMatch[2]);
    if (isValidCoordinate(lat, lng)) {
      return {
        recordId: String(recordId),
        givenNames: '', familyNames: '',
        lat, lng,
        cemeteryName: extractCemeteryName(html) || '',
      };
    }
  }

  // Strategy 2: Coordinate patterns in HTML
  const coordRegex = /["']?(?:latitude|lat)["']?\s*[:=]\s*([-\d.]+)[\s\S]*?["']?(?:longitude|lng|lon)["']?\s*[:=]\s*([-\d.]+)/;
  const coordMatch = html.match(coordRegex);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (isValidCoordinate(lat, lng)) {
      return {
        recordId: String(recordId),
        givenNames: '', familyNames: '',
        lat, lng,
        cemeteryName: extractCemeteryName(html) || '',
      };
    }
  }

  return null;
}

/** Backwards-compatible wrapper. */
export async function fetchRecordGPS(recordId: number): Promise<{
  lat: number;
  lng: number;
  cemeteryName?: string;
} | null> {
  const data = await fetchRecordData(recordId);
  if (!data) return null;
  return { lat: data.lat, lng: data.lng, cemeteryName: data.cemeteryName };
}

function extractCemeteryName(html: string): string | undefined {
  const buriedMatch = html.match(/Buried at\s+([^,.<]+)/);
  if (buriedMatch) return buriedMatch[1].trim();
  const cemLinkMatch = html.match(/href="\/cemetery\/[^"]*"[^>]*>([^<]+)/);
  if (cemLinkMatch) return cemLinkMatch[1].trim();
  return undefined;
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    lat !== 0 && lng !== 0  // (0,0) is null island, not a real cemetery
  );
}

// ── Combined Search + GPS ────────────────────────────────────────────

/**
 * Search BillionGraves for a person and return results with GPS coordinates.
 * Performs two steps: search for records, then fetch GPS for each result.
 */
export async function searchBurial(params: {
  givenName: string;
  surname: string;
  deathYear?: number;
}): Promise<BurialSearchResult[]> {
  const searchResults = await searchBillionGraves(params);

  if (searchResults.length === 0) return [];

  const results: BurialSearchResult[] = [];

  for (const sr of searchResults) {
    const gps = await fetchRecordGPS(sr.recordId);
    if (!gps) {
      console.log(`    ⚠ No GPS for record ${sr.recordId} (${sr.fullName})`);
      continue;
    }

    results.push({
      fullName: sr.fullName,
      birthYear: sr.birthYear,
      deathYear: sr.deathYear,
      lat: gps.lat,
      lng: gps.lng,
      cemeteryName: gps.cemeteryName ?? sr.cemeteryName,
      recordId: sr.recordId,
      sourceUrl: `${BG_BASE}${sr.recordUrl}`,
    });
  }

  return results;
}
