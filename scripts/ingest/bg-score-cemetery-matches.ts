#!/usr/bin/env npx tsx
/**
 * Score BG cemetery search results.
 * For each person, find the BG record that matches their name + death year
 * AND is at the expected cemetery. This is more precise than the earlier
 * entity matching because we know which cemetery to expect.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { normalizeName } from './lib/name-matching.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '../output');

interface BGResult {
  id: number;
  name: string;
  ctx: string;
}

interface CemeterySearchResult {
  entityId: string;
  name: string;
  deathYear: number;
  cemetery: string;
  bgResults: BGResult[];
}

function parseContext(ctx: string) {
  const bornMatch = ctx.match(/Born:\s*([\w\s,]+?)(?:\s*\||\s*$)/);
  const diedMatch = ctx.match(/Died:\s*([\w\s,]+?)(?:\s*\||\s*$)/);
  const locMatch = ctx.match(/Location:\s*(.+?)(?:\s*$)/);
  return {
    birthYear: bornMatch ? parseYear(bornMatch[1]) : undefined,
    deathYear: diedMatch ? parseYear(diedMatch[1]) : undefined,
    location: locMatch?.[1]?.trim() ?? '',
  };
}

function parseYear(s: string): number | undefined {
  if (!s || s === 'Not Available') return undefined;
  const m = s.match(/\b(\d{4})\b/);
  return m ? parseInt(m[1], 10) : undefined;
}

function jaroWinkler(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  const matchWindow = Math.max(Math.floor(Math.max(a.length, b.length) / 2) - 1, 0);
  const aM = new Array(a.length).fill(false);
  const bM = new Array(b.length).fill(false);
  let matches = 0, trans = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = Math.max(0, i - matchWindow); j < Math.min(i + matchWindow + 1, b.length); j++) {
      if (bM[j] || a[i] !== b[j]) continue;
      aM[i] = bM[j] = true; matches++; break;
    }
  }
  if (!matches) return 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) { if (!aM[i]) continue; while (!bM[k]) k++; if (a[i] !== b[k]) trans++; k++; }
  const jaro = (matches/a.length + matches/b.length + (matches - trans/2)/matches) / 3;
  let pfx = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) { if (a[i] === b[i]) pfx++; else break; }
  return jaro + pfx * 0.1 * (1 - jaro);
}

function main() {
  const results: CemeterySearchResult[] = JSON.parse(
    readFileSync(resolve(OUTPUT_DIR, 'bg-cemetery-results.json'), 'utf-8')
  );

  // Also load cemetery targets for expected cemetery names
  const targets = JSON.parse(readFileSync(resolve(OUTPUT_DIR, 'cemetery-targets.json'), 'utf-8'));
  const cemeteryKeywords = new Map<string, string[]>();
  for (const t of targets) {
    // Extract key words from cemetery name for fuzzy matching in BG location strings
    const words = t.cemetery.toLowerCase().split(/[\s-]+/).filter((w: string) => w.length > 3);
    cemeteryKeywords.set(t.cemetery, words);
  }

  const matched: any[] = [];
  const noMatch: string[] = [];

  for (const r of results) {
    if (r.bgResults.length === 0) {
      noMatch.push(`${r.name} (${r.cemetery})`);
      continue;
    }

    const entityNorm = normalizeName(r.name);
    const cemKeywords = cemeteryKeywords.get(r.cemetery) ?? r.cemetery.toLowerCase().split(/\s+/);

    // Score each BG result
    const scored = r.bgResults.map(bg => {
      const parsed = parseContext(bg.ctx);
      const bgNorm = normalizeName(bg.name);

      // Name score
      const givenSim = jaroWinkler(entityNorm.given, bgNorm.given);
      const surnameSim = jaroWinkler(entityNorm.surname, bgNorm.surname);
      const nameScore = surnameSim * 0.6 + givenSim * 0.4;

      // Death year score
      let yearScore = 0.3;
      if (parsed.deathYear && r.deathYear) {
        const diff = Math.abs(parsed.deathYear - r.deathYear);
        if (diff === 0) yearScore = 1.0;
        else if (diff <= 1) yearScore = 0.9;
        else if (diff <= 5) yearScore = 0.5;
        else yearScore = 0.0;
      }

      // Cemetery match score — does the BG result mention the expected cemetery?
      const locLower = parsed.location.toLowerCase();
      const cemMatches = cemKeywords.filter(w => locLower.includes(w));
      const cemScore = cemMatches.length / Math.max(cemKeywords.length, 1);

      // Combined: name 35%, year 30%, cemetery 35%
      const confidence = nameScore * 0.35 + yearScore * 0.30 + cemScore * 0.35;

      return { bg, parsed, nameScore, yearScore, cemScore, confidence };
    }).sort((a, b) => b.confidence - a.confidence);

    const best = scored[0];

    if (best.confidence >= 0.65 && best.cemScore >= 0.3) {
      matched.push({
        entityId: r.entityId,
        name: r.name,
        deathYear: r.deathYear,
        cemetery: r.cemetery,
        bgRecordId: best.bg.id,
        bgName: best.bg.name,
        bgLocation: best.parsed.location,
        confidence: best.confidence,
        nameScore: best.nameScore,
        yearScore: best.yearScore,
        cemScore: best.cemScore,
      });
    } else {
      noMatch.push(`${r.name} (${r.cemetery}) — best: ${best.confidence.toFixed(3)}, cem: ${best.cemScore.toFixed(2)}`);
    }
  }

  // Group matches by cemetery
  const byCem = new Map<string, any[]>();
  for (const m of matched) {
    if (!byCem.has(m.cemetery)) byCem.set(m.cemetery, []);
    byCem.get(m.cemetery)!.push(m);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  Cemetery BG Match Results');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Searched: ${results.length}`);
  console.log(`  Matched: ${matched.length}`);
  console.log(`  No match: ${noMatch.length}`);

  for (const [cem, matches] of byCem) {
    console.log(`\n── ${cem} (${matches.length} matches) ──`);
    for (const m of matches) {
      const flag = m.confidence >= 0.85 ? '✓' : '⚠';
      console.log(`  ${flag} ${m.name} → BG "${m.bgName}" | conf: ${m.confidence.toFixed(3)} | ${m.bgLocation.slice(0, 60)}`);
    }
  }

  if (noMatch.length > 0) {
    console.log(`\n── No Match ──`);
    for (const n of noMatch) console.log(`  ✗ ${n}`);
  }

  writeFileSync(resolve(OUTPUT_DIR, 'bg-cemetery-matched.json'), JSON.stringify(matched, null, 2));
  console.log(`\nWritten to bg-cemetery-matched.json (${matched.length} matches)`);
}

main();
