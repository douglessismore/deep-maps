/**
 * Batch geocode moments with street addresses using Nominatim.
 *
 * Reads all moments from Supabase, filters to those with street-level addresses
 * that haven't been geo-verified, geocodes via Nominatim, and auto-updates
 * moments whose pins are 50m–5km off. Flags >5km discrepancies for manual review.
 *
 * Usage:
 *   npx tsx scripts/batch-geocode.ts
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY env var (from .env.local)
 * Rate limit: 1 req/sec (Nominatim policy)
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local (where the service role key lives)
config({ path: new URL('../.env.local', import.meta.url).pathname });
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, 'output');
mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Supabase setup ─────────────────────────────────────────────────

const SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env.local or as an env var.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Types ──────────────────────────────────────────────────────────

interface MomentRow {
  id: string;
  name: string;
  address: string | null;
  type_id: string;
  geo_verified: boolean;
  location: { type: string; coordinates: [number, number] }; // GeoJSON [lng, lat]
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface GeocodedMoment {
  id: string;
  name: string;
  address: string;
  oldLat: number;
  oldLng: number;
  newLat: number;
  newLng: number;
  distanceM: number;
}

// ─── Constants ──────────────────────────────────────────────────────

const EXCLUDED_TYPES = new Set([
  'geological_site',
  'discovery_site',
  'natural_site',
  'battlefield',
  'ocean',
]);

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'DeepMaps/1.0 (deepmaps.app)';
const RATE_LIMIT_MS = 1100; // slightly over 1s to be safe

// ─── Helpers ────────────────────────────────────────────────────────

/** Haversine distance in meters between two lat/lng pairs. */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Does the address look like it contains a street-level component? */
function hasStreetAddress(address: string): boolean {
  const trimmed = address.trim();
  if (!trimmed) return false;

  // Must contain a street number somewhere
  const hasNumber = /\d+/.test(trimmed);
  if (!hasNumber) return false;

  // Street keywords (case-insensitive)
  const streetKeywords =
    /\b(st\.?|street|ave\.?|avenue|blvd\.?|boulevard|rd\.?|road|dr\.?|drive|way|lane|ln\.?|pl\.?|place|plaza|square|sq\.?|park|pkwy\.?|parkway|ct\.?|court|circle|cir\.?|terrace|ter\.?|trail|highway|hwy\.?|route|row|walk|alley|path|pier|quay|promenade|corso|via|rue|strasse|straße|calle|avenida|prospekt|ulitsa|piazza|platz)\b/i;

  if (streetKeywords.test(trimmed)) return true;

  // Pattern: starts with digits followed by a word (e.g. "1600 Pennsylvania")
  if (/^\d+\s+[A-Za-z]/.test(trimmed)) return true;

  return false;
}

/** Sleep for ms milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Geocode a single address via Nominatim. Returns null on failure. */
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) {
      console.warn(`  Nominatim HTTP ${res.status} for: ${address}`);
      return null;
    }
    const data = (await res.json()) as NominatimResult[];
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) {
    console.warn(`  Nominatim error for "${address}":`, (err as Error).message);
    return null;
  }
}

// ─── Fetch all moments ──────────────────────────────────────────────

async function fetchAllMoments(): Promise<MomentRow[]> {
  const PAGE = 1000;
  const all: MomentRow[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('moments')
      .select('id, name, address, type_id, geo_verified, location')
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`Failed to fetch moments: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as MomentRow[]));
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching all moments from Supabase...');
  const allMoments = await fetchAllMoments();
  console.log(`Total moments: ${allMoments.length}`);

  // Filter to geocodable
  const geocodable = allMoments.filter((m) => {
    if (!m.address || !m.address.trim()) return false;
    if (m.geo_verified) return false;
    if (EXCLUDED_TYPES.has(m.type_id)) return false;
    if (!hasStreetAddress(m.address)) return false;
    return true;
  });

  console.log(`Moments with street addresses (geocodable): ${geocodable.length}`);
  console.log(`Estimated time: ~${Math.ceil(geocodable.length * RATE_LIMIT_MS / 60000)} minutes\n`);

  const autoUpdated: GeocodedMoment[] = [];
  const alreadyAccurate: GeocodedMoment[] = [];
  const flaggedForReview: GeocodedMoment[] = [];
  const failedToGeocode: { id: string; name: string; address: string }[] = [];

  for (let i = 0; i < geocodable.length; i++) {
    const m = geocodable[i];
    const [lng, lat] = m.location.coordinates; // GeoJSON is [lng, lat]

    if ((i + 1) % 50 === 0 || i === 0) {
      console.log(`Processing ${i + 1}/${geocodable.length}: ${m.name}`);
    }

    const result = await geocode(m.address!);
    if (!result) {
      failedToGeocode.push({ id: m.id, name: m.name, address: m.address! });
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    const distM = haversineM(lat, lng, result.lat, result.lng);
    const entry: GeocodedMoment = {
      id: m.id,
      name: m.name,
      address: m.address!,
      oldLat: lat,
      oldLng: lng,
      newLat: result.lat,
      newLng: result.lng,
      distanceM: Math.round(distM),
    };

    if (distM < 50) {
      alreadyAccurate.push(entry);
    } else if (distM <= 5000) {
      autoUpdated.push(entry);
    } else {
      flaggedForReview.push(entry);
    }

    await sleep(RATE_LIMIT_MS);
  }

  // ─── Apply auto-updates to Supabase ─────────────────────────────
  console.log(`\nApplying ${autoUpdated.length} auto-updates to Supabase...`);
  let updateSuccesses = 0;
  let updateFailures = 0;

  for (const m of autoUpdated) {
    const { error } = await supabase.rpc('update_moment_location', {
      p_id: m.id,
      p_lng: m.newLng,
      p_lat: m.newLat,
      p_source_url: 'nominatim-batch-geocode',
    });
    if (error) {
      console.error(`  Failed to update ${m.id}: ${error.message}`);
      updateFailures++;
    } else {
      updateSuccesses++;
    }
  }

  console.log(`  Updated: ${updateSuccesses}, Failed: ${updateFailures}`);

  // ─── Generate report ────────────────────────────────────────────
  const report = [
    '# Batch Geocode Report',
    '',
    `**Date**: ${new Date().toISOString().split('T')[0]}`,
    '',
    '## Summary',
    '',
    `| Metric | Count |`,
    `|--------|-------|`,
    `| Total moments in DB | ${allMoments.length} |`,
    `| Moments with street addresses | ${geocodable.length} |`,
    `| Already accurate (<50m) | ${alreadyAccurate.length} |`,
    `| Auto-updated (50m–5km) | ${autoUpdated.length} (${updateSuccesses} succeeded, ${updateFailures} failed) |`,
    `| Flagged for review (>5km) | ${flaggedForReview.length} |`,
    `| Failed to geocode | ${failedToGeocode.length} |`,
    '',
  ];

  if (autoUpdated.length > 0) {
    report.push(
      '## Auto-Updated Moments',
      '',
      '| ID | Name | Distance | Old Coords | New Coords |',
      '|----|------|----------|------------|------------|',
    );
    for (const m of autoUpdated) {
      report.push(
        `| ${m.id} | ${m.name} | ${m.distanceM}m | ${m.oldLat.toFixed(5)}, ${m.oldLng.toFixed(5)} | ${m.newLat.toFixed(5)}, ${m.newLng.toFixed(5)} |`,
      );
    }
    report.push('');
  }

  if (flaggedForReview.length > 0) {
    report.push(
      '## Flagged for Manual Review (>5km off)',
      '',
      'These moments have a large discrepancy between their current coordinates and the geocoded address.',
      'The geocoded result may be in the wrong city/country, or the address field may be incorrect.',
      '',
      '| ID | Name | Address | Distance | Old Coords | Geocoded Coords |',
      '|----|------|---------|----------|------------|-----------------|',
    );
    for (const m of flaggedForReview) {
      report.push(
        `| ${m.id} | ${m.name} | ${m.address} | ${(m.distanceM / 1000).toFixed(1)}km | ${m.oldLat.toFixed(5)}, ${m.oldLng.toFixed(5)} | ${m.newLat.toFixed(5)}, ${m.newLng.toFixed(5)} |`,
      );
    }
    report.push('');
  }

  if (failedToGeocode.length > 0) {
    report.push(
      '## Failed to Geocode',
      '',
      '| ID | Name | Address |',
      '|----|------|---------|',
    );
    for (const m of failedToGeocode) {
      report.push(`| ${m.id} | ${m.name} | ${m.address} |`);
    }
    report.push('');
  }

  const reportPath = resolve(OUTPUT_DIR, 'batch-geocode-report.md');
  writeFileSync(reportPath, report.join('\n'), 'utf-8');
  console.log(`\nReport written to ${reportPath}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
