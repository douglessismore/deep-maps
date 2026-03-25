#!/usr/bin/env npx tsx
/**
 * Score BG search results against our entities.
 *
 * Reads bg-chrome-results.json (raw search results from Chrome batch),
 * scores each BG record against the entity using name + death year matching,
 * and outputs:
 *   1. bg-matched.json — entities with their best BG match (high confidence)
 *   2. bg-mappings-full.json — mapping file for Phase 2 pipeline
 *   3. Console summary of match quality
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getSupabase } from './lib/pipeline.js';
import { normalizeName, extractDeathYear } from './lib/name-matching.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '../output');

interface BGResult {
  id: number;
  name: string;
  ctx: string;  // "Name | Born: X | Died: Y | Location: Cemetery: Country, State, City"
}

interface SearchResult {
  entityId: string;
  name: string;
  deathYear: number;
  bgResults: BGResult[];
}

interface ScoredMatch {
  entityId: string;
  entityName: string;
  entityDeathYear: number;
  bgRecordId: number;
  bgName: string;
  bgDeathYear?: number;
  bgBirthYear?: number;
  cemetery: string;
  location: string;
  confidence: number;
  reason: string;
}

// ── Parsing ──────────────────────────────────────────────────────────

function parseContext(ctx: string): {
  birthDate?: string;
  deathDate?: string;
  birthYear?: number;
  deathYear?: number;
  cemetery?: string;
  location?: string;
} {
  const bornMatch = ctx.match(/Born:\s*([\w\s,]+?)(?:\s*\||\s*$)/);
  const diedMatch = ctx.match(/Died:\s*([\w\s,]+?)(?:\s*\||\s*$)/);
  const locMatch = ctx.match(/Location:\s*(.+?)(?:\s*$)/);

  const birthDate = bornMatch?.[1]?.trim();
  const deathDate = diedMatch?.[1]?.trim();

  let cemetery: string | undefined;
  let location: string | undefined;
  if (locMatch) {
    const locParts = locMatch[1].split(':');
    if (locParts.length >= 2) {
      cemetery = locParts[0].trim();
      location = locParts.slice(1).join(':').trim();
    } else {
      cemetery = locParts[0].trim();
    }
  }

  return {
    birthDate,
    deathDate,
    birthYear: birthDate ? parseYear(birthDate) : undefined,
    deathYear: deathDate ? parseYear(deathDate) : undefined,
    cemetery,
    location,
  };
}

function parseYear(dateStr: string): number | undefined {
  if (!dateStr || dateStr === 'Not Available') return undefined;
  const m = dateStr.match(/\b(\d{4})\b/);
  return m ? parseInt(m[1], 10) : undefined;
}

// ── Scoring ──────────────────────────────────────────────────────────

function jaroWinkler(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;

  const matchWindow = Math.max(Math.floor(Math.max(a.length, b.length) / 2) - 1, 0);
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);
  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const jaro = (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

function scoreMatch(
  entityName: string,
  entityDeathYear: number,
  bgResult: BGResult,
): { confidence: number; reason: string; parsed: ReturnType<typeof parseContext> } {
  const parsed = parseContext(bgResult.ctx);

  // Name similarity
  const entityNorm = normalizeName(entityName);
  const bgNorm = normalizeName(bgResult.name);
  const givenSim = jaroWinkler(entityNorm.given, bgNorm.given);
  const surnameSim = jaroWinkler(entityNorm.surname, bgNorm.surname);
  const nameScore = surnameSim * 0.6 + givenSim * 0.4;

  // Death year match
  let yearScore = 0.3;
  if (parsed.deathYear && entityDeathYear) {
    const diff = Math.abs(parsed.deathYear - entityDeathYear);
    if (diff === 0) yearScore = 1.0;
    else if (diff <= 1) yearScore = 0.9;
    else if (diff <= 3) yearScore = 0.7;
    else if (diff <= 5) yearScore = 0.5;
    else yearScore = 0.0;
  }

  const confidence = nameScore * 0.5 + yearScore * 0.5;

  const reasons: string[] = [];
  if (nameScore >= 0.9) reasons.push('exact name');
  else if (nameScore >= 0.7) reasons.push('close name');
  else reasons.push(`weak name (${nameScore.toFixed(2)})`);
  if (yearScore >= 0.9) reasons.push('death year match');
  else if (yearScore < 0.5) reasons.push('year mismatch');
  if (parsed.cemetery) reasons.push(parsed.cemetery);

  return { confidence, reason: reasons.join(', '), parsed };
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const results: SearchResult[] = JSON.parse(
    readFileSync(resolve(OUTPUT_DIR, 'bg-chrome-results.json'), 'utf-8')
  );

  console.log(`Processing ${results.length} entity search results\n`);

  // Also check which entities already have burial moments
  const sb = getSupabase();
  const { data: existingBurials } = await sb
    .from('moments')
    .select('id, type_id')
    .eq('type_id', 'burial');
  const { data: burialLinks } = await sb
    .from('moment_entities')
    .select('entity_id, moment_id');

  const entitiesWithBurial = new Set<string>();
  for (const link of burialLinks ?? []) {
    const hasBurial = existingBurials?.some(m => m.id === link.moment_id);
    if (hasBurial) entitiesWithBurial.add(link.entity_id);
  }

  const matched: ScoredMatch[] = [];
  const noMatch: string[] = [];
  const lowConfidence: Array<{ name: string; confidence: number; reason: string }> = [];

  for (const result of results) {
    if (result.bgResults.length === 0) {
      noMatch.push(result.name);
      continue;
    }

    // Score each BG result
    const scored = result.bgResults.map(bg => {
      const { confidence, reason, parsed } = scoreMatch(result.name, result.deathYear, bg);
      return { bg, confidence, reason, parsed };
    }).sort((a, b) => b.confidence - a.confidence);

    const best = scored[0];

    if (best.confidence >= 0.7) {
      matched.push({
        entityId: result.entityId,
        entityName: result.name,
        entityDeathYear: result.deathYear,
        bgRecordId: best.bg.id,
        bgName: best.bg.name,
        bgDeathYear: best.parsed.deathYear,
        bgBirthYear: best.parsed.birthYear,
        cemetery: best.parsed.cemetery ?? '',
        location: best.parsed.location ?? '',
        confidence: best.confidence,
        reason: best.reason,
      });
    } else {
      lowConfidence.push({
        name: result.name,
        confidence: best.confidence,
        reason: best.reason,
      });
    }
  }

  // Separate into: already has burial vs needs new burial
  const existingBurialMatches = matched.filter(m => entitiesWithBurial.has(m.entityId));
  const newBurialCandidates = matched.filter(m => !entitiesWithBurial.has(m.entityId));

  // Sort new candidates by confidence
  newBurialCandidates.sort((a, b) => b.confidence - a.confidence);

  console.log('═══════════════════════════════════════════════════');
  console.log('  BillionGraves Match Results');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Total entities searched: ${results.length}`);
  console.log(`  High-confidence matches: ${matched.length}`);
  console.log(`    Already have burial moment: ${existingBurialMatches.length}`);
  console.log(`    NEW burial candidates: ${newBurialCandidates.length}`);
  console.log(`  Low confidence (<0.7): ${lowConfidence.length}`);
  console.log(`  No BG results: ${noMatch.length}`);

  console.log('\n── Top NEW Burial Candidates ──\n');
  for (let i = 0; i < Math.min(30, newBurialCandidates.length); i++) {
    const m = newBurialCandidates[i];
    console.log(`${i + 1}. ${m.entityName} (d. ${m.entityDeathYear}) → ${m.cemetery}`);
    console.log(`   BG: "${m.bgName}" | Confidence: ${m.confidence.toFixed(3)} | ${m.reason}`);
    console.log(`   Record: ${m.bgRecordId}`);
  }

  if (existingBurialMatches.length > 0) {
    console.log('\n── Existing Burials to Verify ──\n');
    for (const m of existingBurialMatches) {
      console.log(`  ${m.entityName} → ${m.cemetery} (conf: ${m.confidence.toFixed(3)})`);
    }
  }

  if (lowConfidence.length > 0) {
    console.log('\n── Low Confidence (skipped) ──\n');
    for (const m of lowConfidence) {
      console.log(`  ${m.name}: ${m.confidence.toFixed(3)} — ${m.reason}`);
    }
  }

  // Write mapping file for Phase 2 pipeline (new burials only)
  const mappings = newBurialCandidates.map(m => ({
    momentId: `${m.entityId}-burial`,  // Will be created
    entityId: m.entityId,
    entityName: m.entityName,
    bgRecordId: m.bgRecordId,
    bgUrl: `https://billiongraves.com/grave/r/${m.bgRecordId}`,
    cemetery: m.cemetery,
    location: m.location,
    confidence: m.confidence,
    notes: `${m.bgName}, d. ${m.bgDeathYear ?? '?'}, ${m.cemetery}`,
  }));

  writeFileSync(
    resolve(OUTPUT_DIR, 'bg-matched.json'),
    JSON.stringify({ matched, lowConfidence, noMatch }, null, 2)
  );

  writeFileSync(
    resolve(OUTPUT_DIR, 'bg-new-burials.json'),
    JSON.stringify(mappings, null, 2)
  );

  console.log(`\nWritten:`);
  console.log(`  bg-matched.json — full match data`);
  console.log(`  bg-new-burials.json — ${mappings.length} new burial candidates for GPS extraction`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
