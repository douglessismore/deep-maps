/**
 * Automated orphan moment → entity matching.
 *
 * Strategy: Match entity NAMES against moment NAME and SUBTITLE only.
 * Description matching produces too many false positives (entity descriptions
 * mention related topics that cause cross-contamination).
 *
 * Usage:
 *   npx tsx scripts/tag-orphans.ts              # Preview matches
 *   npx tsx scripts/tag-orphans.ts --apply       # Apply matches to moments.ts
 */
import { moments } from '../src/data/moments';
import { entities } from '../src/data/entities';
import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

// ─── Build entity search index ──────────────────────────────────────

interface EntityMatch {
  entityId: string;
  entityName: string;
  entityType: string;
  matchedIn: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface MomentMatch {
  momentId: string;
  momentName: string;
  year: number | null;
  entities: EntityMatch[];
  confidence: 'high' | 'medium' | 'low';
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Common words that should NOT be used as standalone matching terms
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'von', 'van', 'der', 'de', 'del', 'di', 'dos',
  'los', 'las', 'san', 'santa', 'great', 'young', 'old', 'king', 'queen',
  'saint', 'fort', 'lake', 'park', 'city', 'west', 'east', 'north', 'south',
  'new', 'mount', 'camp', 'isle', 'bay', 'cape', 'port', 'point',
  'general', 'captain', 'colonel', 'major', 'chief', 'lord', 'sir',
  'state', 'national', 'museum', 'hotel', 'church', 'cemetery',
]);

// Entities whose names are too generic for text matching
const SKIP_ENTITIES = new Set([
  'nasa', // "NASA" appears in tons of unrelated moments
  'fbi', 'cia',
]);

interface SearchEntity {
  id: string;
  name: string;
  type: string;
  fullNameRegex: RegExp;
  lastNameRegex: RegExp | null;
  lastNameStr: string | null;
}

const entityIndex: SearchEntity[] = [];

for (const e of entities) {
  if (e.type === 'concept') continue;
  if (SKIP_ENTITIES.has(e.id)) continue;
  if (e.name.length < 4) continue;

  const fullNameRegex = new RegExp(`\\b${escapeRegex(e.name)}\\b`, 'i');

  let lastNameRegex: RegExp | null = null;
  let lastNameStr: string | null = null;

  if (e.type === 'person') {
    const parts = e.name.split(/\s+/);
    if (parts.length >= 2) {
      const lastName = parts[parts.length - 1];
      if (lastName.length >= 6 && !STOP_WORDS.has(lastName.toLowerCase())) {
        lastNameRegex = new RegExp(`\\b${escapeRegex(lastName)}\\b`, 'i');
        lastNameStr = lastName.toLowerCase();
      }
    }
  }

  entityIndex.push({
    id: e.id,
    name: e.name,
    type: e.type,
    fullNameRegex,
    lastNameRegex,
    lastNameStr,
  });
}

console.log(`Entity search index: ${entityIndex.length} entities`);

// ─── Find orphan moments ────────────────────────────────────────────

const orphans = moments.filter(m => !m.entityIds || m.entityIds.length === 0);
console.log(`Orphan moments: ${orphans.length}`);

// ─── Match logic ────────────────────────────────────────────────────

const matches: MomentMatch[] = [];
let totalLinks = 0;

for (const m of orphans) {
  const mName = m.name || '';
  const mSubtitle = m.subtitle || '';
  const mId = m.id.toLowerCase();
  // Combine name + subtitle for matching (NOT description — too noisy)
  const searchText = `${mName} ${mSubtitle}`;

  const entityMatches: EntityMatch[] = [];
  const seenEntityIds = new Set<string>();

  for (const ei of entityIndex) {
    if (seenEntityIds.has(ei.id)) continue;

    const matchedIn: string[] = [];
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // 1. Full name match in name/subtitle → HIGH confidence
    if (ei.fullNameRegex.test(mName)) {
      matchedIn.push('name (full)');
      confidence = 'high';
    } else if (ei.fullNameRegex.test(mSubtitle)) {
      matchedIn.push('subtitle (full)');
      confidence = 'high';
    }
    // 2. Last name match in moment NAME only → MEDIUM confidence
    else if (ei.lastNameRegex && ei.lastNameRegex.test(mName)) {
      matchedIn.push('name (last name)');
      confidence = 'medium';
    }
    // 3. Entity ID slug overlap with moment ID → MEDIUM confidence
    else {
      const eiParts = ei.id.split('-');
      if (eiParts.length >= 2) {
        // Check if 2+ consecutive slug parts appear in moment ID
        for (let i = 0; i < eiParts.length - 1; i++) {
          const slug = eiParts[i] + '-' + eiParts[i + 1];
          if (slug.length >= 6 && mId.includes(slug)) {
            matchedIn.push('id overlap');
            confidence = 'medium';
            break;
          }
        }
      }
    }

    if (matchedIn.length > 0) {
      seenEntityIds.add(ei.id);
      entityMatches.push({
        entityId: ei.id,
        entityName: ei.name,
        entityType: ei.type,
        matchedIn,
        confidence,
      });
    }
  }

  if (entityMatches.length > 0) {
    // Sort by confidence
    entityMatches.sort((a, b) => {
      const order = { high: 3, medium: 2, low: 1 };
      return order[b.confidence] - order[a.confidence];
    });

    // Overall confidence = highest individual match
    const overallConfidence = entityMatches[0].confidence;

    matches.push({
      momentId: m.id,
      momentName: m.name,
      year: m.year ?? null,
      entities: entityMatches,
      confidence: overallConfidence,
    });
    totalLinks += entityMatches.length;
  }
}

// ─── Results ────────────────────────────────────────────────────────

const highConf = matches.filter(m => m.confidence === 'high');
const medConf = matches.filter(m => m.confidence === 'medium');

console.log(`\nMatched ${matches.length} orphans → ${totalLinks} total links`);
console.log(`  HIGH confidence: ${highConf.length} moments`);
console.log(`  MEDIUM confidence: ${medConf.length} moments`);
console.log(`  Unmatched: ${orphans.length - matches.length}`);

// Write JSON
const outputPath = resolve(__dirname, 'orphan-matches.json');
writeFileSync(outputPath, JSON.stringify(matches, null, 2));
console.log(`\nResults: ${outputPath}`);

// Print HIGH confidence matches
console.log(`\n${'═'.repeat(70)}`);
console.log(`  HIGH CONFIDENCE MATCHES (${highConf.length})`);
console.log(`${'═'.repeat(70)}`);
for (const m of highConf) {
  const entityStr = m.entities.map(e => `${e.entityId} [${e.matchedIn.join(',')}]`).join(', ');
  console.log(`  ${m.momentId}`);
  console.log(`    "${m.momentName.slice(0, 85)}"`);
  console.log(`    → ${entityStr}`);
}

// Print MEDIUM confidence matches
console.log(`\n${'═'.repeat(70)}`);
console.log(`  MEDIUM CONFIDENCE MATCHES (${medConf.length})`);
console.log(`${'═'.repeat(70)}`);
for (const m of medConf) {
  const entityStr = m.entities.map(e => `${e.entityId} [${e.matchedIn.join(',')}]`).join(', ');
  console.log(`  ${m.momentId}`);
  console.log(`    "${m.momentName.slice(0, 85)}"`);
  console.log(`    → ${entityStr}`);
}

// ─── Apply mode ─────────────────────────────────────────────────────

if (APPLY) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  APPLYING ${matches.length} matches to moments.ts`);
  console.log(`${'═'.repeat(70)}`);

  const momentsPath = resolve(__dirname, '../src/data/moments.ts');
  let content = readFileSync(momentsPath, 'utf-8');

  let applied = 0;
  for (const match of matches) {
    const entityIds = match.entities.map(e => e.entityId);
    const entityIdsStr = entityIds.map(id => `'${id}'`).join(', ');

    const idPattern = `id: '${match.momentId}',`;
    const idIdx = content.indexOf(idPattern);
    if (idIdx === -1) {
      console.error(`  SKIP: could not find moment ${match.momentId}`);
      continue;
    }

    // Find closing brace of this moment
    const closingPattern = '\n  }';
    const closingIdx = content.indexOf(closingPattern, idIdx);
    if (closingIdx === -1) {
      console.error(`  SKIP: could not find closing brace for ${match.momentId}`);
      continue;
    }

    // Check if entityIds already exists
    const momentBlock = content.substring(idIdx, closingIdx);
    if (momentBlock.includes('entityIds:')) continue;

    const insertStr = `\n    entityIds: [${entityIdsStr}],`;
    content = content.substring(0, closingIdx) + insertStr + content.substring(closingIdx);
    applied++;
  }

  writeFileSync(momentsPath, content, 'utf-8');
  console.log(`  Applied entityIds to ${applied} moments`);
}
