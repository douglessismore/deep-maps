/**
 * Deep Maps — Apply Notability Scores to moments.ts
 *
 * Reads scores from scripts/output/notability-scores.json and patches
 * src/data/moments.ts with `notability: XX` on each moment object.
 *
 * Run: npx tsx scripts/apply-scores.ts
 *
 * Safe to re-run: removes existing notability lines before inserting fresh ones.
 */

import * as fs from 'fs';
import * as path from 'path';

const SCORES_PATH = path.join(import.meta.dirname, 'output', 'notability-scores.json');
const MOMENTS_PATH = path.join(import.meta.dirname, '..', 'src', 'data', 'moments.ts');

interface ScoreEntry {
  momentId: string;
  effectiveScore: number;
}

function main() {
  // 1. Load scores
  if (!fs.existsSync(SCORES_PATH)) {
    console.error('❌ No scores file found. Run score-moments.ts first.');
    process.exit(1);
  }

  const scores: ScoreEntry[] = JSON.parse(fs.readFileSync(SCORES_PATH, 'utf-8'));
  const scoreMap = new Map<string, number>();
  for (const entry of scores) {
    scoreMap.set(entry.momentId, entry.effectiveScore);
  }
  console.log(`Loaded ${scoreMap.size} scores from notability-scores.json`);

  // 2. Read moments.ts
  let content = fs.readFileSync(MOMENTS_PATH, 'utf-8');
  const originalLength = content.length;

  // 3. Remove any existing notability lines (safe for re-runs)
  const existingCount = (content.match(/^\s*notability:\s*\d+,?\s*$/gm) || []).length;
  if (existingCount > 0) {
    content = content.replace(/^\s*notability:\s*\d+,?\s*\n/gm, '');
    console.log(`Removed ${existingCount} existing notability lines`);
  }

  // 4. Insert notability after each `importance: '...',` line
  //    Pattern: find `importance: 'xxx',` and add `notability: XX,` on the next line
  let insertCount = 0;
  let missCount = 0;

  // First, build a map of which moment ID corresponds to which importance line.
  // Strategy: find each `id: 'xxx',` line, extract the ID, then find the next
  // `importance:` line after it and insert notability there.
  const lines = content.split('\n');
  const newLines: string[] = [];
  let currentMomentId: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    newLines.push(line);

    // Detect moment ID
    const idMatch = line.match(/^\s+id:\s*'([^']+)',?\s*$/);
    if (idMatch) {
      currentMomentId = idMatch[1];
    }

    // Detect importance line — insert notability right after
    const importanceMatch = line.match(/^(\s+)importance:\s*'(major|minor|contextual)',?\s*$/);
    if (importanceMatch && currentMomentId) {
      const indent = importanceMatch[1];
      const score = scoreMap.get(currentMomentId);
      if (score !== undefined) {
        newLines.push(`${indent}notability: ${score},`);
        insertCount++;
      } else {
        missCount++;
      }
      currentMomentId = null; // Reset after processing
    }
  }

  // 5. Write back
  const newContent = newLines.join('\n');
  fs.writeFileSync(MOMENTS_PATH, newContent);

  console.log(`\n✅ Done!`);
  console.log(`   Inserted notability on ${insertCount} moments`);
  if (missCount > 0) {
    console.log(`   ⚠️ ${missCount} moments had no score (missing from scores JSON)`);
  }
  console.log(`   File size: ${originalLength.toLocaleString()} → ${newContent.length.toLocaleString()} bytes`);
  console.log(`\n   Run 'npx tsc -b' to verify types.`);
}

main();
