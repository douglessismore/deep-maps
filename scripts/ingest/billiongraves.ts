#!/usr/bin/env npx tsx
/**
 * Deep Maps — BillionGraves Burial Verification Pipeline (Phase 2)
 *
 * Reads a mapping file (produced by Phase 1: billiongraves-discover.ts)
 * that maps moment IDs → BG record IDs. For each mapping, fetches the
 * BG record page to extract GPS coordinates, compares with existing
 * moment coordinates, and auto-updates or flags for review.
 *
 * Two-phase approach:
 *   Phase 1: npx tsx scripts/ingest/billiongraves-discover.ts   (Chrome browser search)
 *   Phase 2: npx tsx scripts/ingest/billiongraves.ts             (this script)
 *
 * Usage:
 *   npx tsx scripts/ingest/billiongraves.ts --dry-run             # test
 *   npx tsx scripts/ingest/billiongraves.ts                       # live update
 *   npx tsx scripts/ingest/billiongraves.ts --mapping path.json   # custom mapping file
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  getSupabase,
  createIngestionRun,
  updateIngestionRun,
  insertToReviewQueue,
  type ReviewQueueItem,
} from './lib/pipeline.js';
import { fetchRecordData, type BGMapping } from './lib/billiongraves-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '../output');
mkdirSync(OUTPUT_DIR, { recursive: true });

const DEFAULT_MAPPING_PATH = resolve(OUTPUT_DIR, 'bg-mappings.json');

// ── CLI Args ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const DRY_RUN = hasFlag('dry-run');
const MAPPING_PATH = getArg('mapping') || DEFAULT_MAPPING_PATH;

// ── Types ────────────────────────────────────────────────────────────

interface VerifyResult {
  momentId: string;
  momentName: string;
  entityName: string;
  action: 'verified' | 'updated' | 'flagged' | 'error';
  reason: string;
  oldLat?: number;
  oldLng?: number;
  newLat?: number;
  newLng?: number;
  distanceM?: number;
  bgUrl?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Main Pipeline ────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Deep Maps — BillionGraves Burial Verification');
  console.log('  Phase 2: Verify coordinates from mapping file');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Mapping: ${MAPPING_PATH}`);
  console.log(`  Dry run: ${DRY_RUN}`);
  console.log('');

  // 1. Load mappings
  if (!existsSync(MAPPING_PATH)) {
    console.error(`❌ Mapping file not found: ${MAPPING_PATH}`);
    console.error('   Run Phase 1 first: npx tsx scripts/ingest/billiongraves-discover.ts');
    process.exit(1);
  }

  const mappings: BGMapping[] = JSON.parse(readFileSync(MAPPING_PATH, 'utf-8'));
  console.log(`📂 Loaded ${mappings.length} mappings\n`);

  if (mappings.length === 0) {
    console.log('No mappings to process. Done.');
    return;
  }

  // 2. Create ingestion run
  let runId = 0;
  if (!DRY_RUN) {
    runId = await createIngestionRun('billiongraves-verify', {
      mappingFile: MAPPING_PATH,
      mappingCount: mappings.length,
    });
    console.log(`📝 Ingestion run #${runId} created\n`);
  }

  // 3. Process each mapping
  const stats = { processed: 0, verified: 0, updated: 0, flagged: 0, errors: 0 };
  const results: VerifyResult[] = [];
  const reviewItems: ReviewQueueItem[] = [];
  const sb = getSupabase();

  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i];
    console.log(`\n[${i + 1}/${mappings.length}] ${mapping.entityName} → BG record ${mapping.bgRecordId}`);

    // Fetch current moment data from Supabase
    const { data: moment, error: momentErr } = await sb
      .from('moments')
      .select('id, name, location, accuracy, geo_verified')
      .eq('id', mapping.momentId)
      .single();

    if (momentErr || !moment) {
      console.error(`  ❌ Moment ${mapping.momentId} not found`);
      stats.errors++;
      stats.processed++;
      continue;
    }

    const [lng, lat] = moment.location.coordinates;
    console.log(`  Current: ${lat.toFixed(6)}, ${lng.toFixed(6)} | Accuracy: ${moment.accuracy}`);

    // Fetch BG record data (GPS from __NEXT_DATA__)
    console.log(`  🔍 Fetching BG record ${mapping.bgRecordId}...`);
    const record = await fetchRecordData(mapping.bgRecordId);
    if (!record) {
      console.error(`  ❌ Failed to extract GPS from BG record ${mapping.bgRecordId}`);
      stats.errors++;
      stats.processed++;
      results.push({
        momentId: mapping.momentId,
        momentName: moment.name,
        entityName: mapping.entityName,
        action: 'error',
        reason: 'Failed to extract GPS from BG record page',
      });
      continue;
    }

    console.log(`  BG GPS: ${record.lat.toFixed(6)}, ${record.lng.toFixed(6)}`);
    console.log(`  Cemetery: ${record.cemeteryName} (${record.cemeteryCity}, ${record.cemeteryState})`);

    // Calculate distance
    const distM = haversineM(lat, lng, record.lat, record.lng);
    const distStr = distM < 1000 ? `${Math.round(distM)}m` : `${(distM / 1000).toFixed(1)}km`;
    console.log(`  Distance: ${distStr}`);

    const bgUrl = mapping.bgUrl || `https://billiongraves.com/grave/r/${mapping.bgRecordId}`;

    if (distM > 2000) {
      // Large distance — flag for review (might be wrong record)
      console.log(`  🏳 Flagging for review (${distStr} is too far — verify correct record)`);
      stats.flagged++;
      results.push({
        momentId: mapping.momentId, momentName: moment.name, entityName: mapping.entityName,
        action: 'flagged', reason: `Large distance (${distStr})`,
        oldLat: lat, oldLng: lng, newLat: record.lat, newLng: record.lng,
        distanceM: Math.round(distM), bgUrl,
      });
      if (!DRY_RUN) {
        reviewItems.push({
          ingestion_run_id: runId,
          item_type: 'moment',
          item_id: mapping.momentId,
          draft_data: {
            action: 'update_coordinates',
            new_lat: record.lat, new_lng: record.lng,
            bg_source_url: bgUrl,
            distance_m: Math.round(distM),
            reason: `Large distance — verify correct BG record`,
          },
        });
      }
    } else if (distM < 50) {
      // Already accurate — just mark verified
      console.log(`  ✓ Already accurate — marking geo_verified`);
      stats.verified++;
      results.push({
        momentId: mapping.momentId, momentName: moment.name, entityName: mapping.entityName,
        action: 'verified', reason: 'Coords already accurate',
        distanceM: Math.round(distM), bgUrl,
      });
      if (!DRY_RUN) {
        await sb.from('moments').update({
          geo_verified: true,
          geo_source_url: bgUrl,
          geo_verified_at: new Date().toISOString(),
        }).eq('id', mapping.momentId);
      }
    } else {
      // 50m–2km — auto-update coordinates
      console.log(`  ✓ Auto-updating coordinates (${distStr} correction)`);
      stats.updated++;
      results.push({
        momentId: mapping.momentId, momentName: moment.name, entityName: mapping.entityName,
        action: 'updated', reason: `Corrected by ${distStr}`,
        oldLat: lat, oldLng: lng, newLat: record.lat, newLng: record.lng,
        distanceM: Math.round(distM), bgUrl,
      });
      if (!DRY_RUN) {
        const { error } = await sb.rpc('update_moment_location', {
          p_id: mapping.momentId,
          p_lng: record.lng,
          p_lat: record.lat,
          p_source_url: bgUrl,
        });
        if (error) {
          console.error(`  ❌ RPC failed: ${error.message}`);
          stats.errors++;
        } else {
          // Update accuracy to pinpoint (BG GPS is headstone-level ~3m)
          await sb.from('moments').update({ accuracy: 'pinpoint' }).eq('id', mapping.momentId);
        }
      }
    }

    stats.processed++;
  }

  // 4. Insert flagged items into review queue
  if (!DRY_RUN && reviewItems.length > 0) {
    console.log(`\n📤 Inserting ${reviewItems.length} items into review queue...`);
    await insertToReviewQueue(reviewItems);
  }

  // 5. Update ingestion run
  if (!DRY_RUN && runId > 0) {
    await updateIngestionRun(runId, 'completed', stats);
  }

  // 6. Generate report
  const report = generateReport(stats, results);
  const reportPath = resolve(OUTPUT_DIR, 'billiongraves-verify-report.md');
  writeFileSync(reportPath, report, 'utf-8');
  console.log(`\n📄 Report: ${reportPath}`);

  // 7. Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Processed:  ${stats.processed}`);
  console.log(`  Verified:   ${stats.verified} (already accurate)`);
  console.log(`  Updated:    ${stats.updated} (coords corrected)`);
  console.log(`  Flagged:    ${stats.flagged} (needs review)`);
  console.log(`  Errors:     ${stats.errors}`);
  if (DRY_RUN) console.log(`\n  [DRY RUN — no changes written]`);
}

// ── Report ───────────────────────────────────────────────────────────

function generateReport(stats: Record<string, number>, results: VerifyResult[]): string {
  const lines: string[] = [
    '# BillionGraves Burial Verification Report',
    '', `**Date**: ${new Date().toISOString().split('T')[0]}`,
    `**Mode**: ${DRY_RUN ? 'Dry run' : 'Live'}`,
    '',
    '## Summary',
    '', '| Metric | Count |', '|--------|-------|',
    `| Processed | ${stats.processed} |`,
    `| Verified (already accurate) | ${stats.verified} |`,
    `| Updated (coords corrected) | ${stats.updated} |`,
    `| Flagged (needs review) | ${stats.flagged} |`,
    `| Errors | ${stats.errors} |`,
    '',
  ];

  for (const [section, filter, cols] of [
    ['Auto-Updated', 'updated', '| Moment | Entity | Distance | Old | New | BG |\n|--|--|--|--|--|--|'] as const,
    ['Verified (Already Accurate)', 'verified', '| Moment | Entity | Distance | BG |\n|--|--|--|--|'] as const,
    ['Flagged for Review', 'flagged', '| Moment | Entity | Reason | Distance | BG |\n|--|--|--|--|--|'] as const,
  ]) {
    const items = results.filter(r => r.action === filter);
    if (items.length === 0) continue;
    lines.push(`## ${section}`, '', cols);
    for (const r of items) {
      if (filter === 'updated') {
        lines.push(`| ${r.momentName} | ${r.entityName} | ${r.distanceM}m | ${r.oldLat?.toFixed(5)}, ${r.oldLng?.toFixed(5)} | ${r.newLat?.toFixed(5)}, ${r.newLng?.toFixed(5)} | [link](${r.bgUrl}) |`);
      } else if (filter === 'verified') {
        lines.push(`| ${r.momentName} | ${r.entityName} | ${r.distanceM}m | [link](${r.bgUrl}) |`);
      } else {
        lines.push(`| ${r.momentName} | ${r.entityName} | ${r.reason} | ${r.distanceM ? `${(r.distanceM / 1000).toFixed(1)}km` : '-'} | [link](${r.bgUrl}) |`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── Run ──────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('\n💀 Pipeline failed:', err);
  process.exit(1);
});
