#!/usr/bin/env node
/**
 * Apply Bucket B biography changes:
 * 1. Append biography stories to stories.ts
 * 2. Add canonicalStoryId to entities in entities.ts
 */

import { readFileSync, writeFileSync } from 'fs';

const DEEP_MAPS = '/Users/sirdouglas/Documents/claude-code-projects/deep-maps';

// Read the generated stories (from stdout of generate script)
const storiesOutput = readFileSync('/tmp/bucket-b-stories.txt', 'utf8');

// Extract just the story entries (between the first marker and the entity updates marker)
const storySection = storiesOutput.split('// ═══ BUCKET B BIOGRAPHY STORIES (generated) ═══\n')[1]
  .split('\n// ═══ ENTITY canonicalStoryId UPDATES ═══')[0].trim();

// Read the entity updates JSON
const entityUpdates = JSON.parse(readFileSync('/tmp/bucket-b-entity-updates.json', 'utf8'));

console.log(`Story entries to add: ${storySection.split("\n  {").length} entries`);
console.log(`Entity updates: ${entityUpdates.length}`);

// ── 1. Append stories to stories.ts ──

let storiesSrc = readFileSync(`${DEEP_MAPS}/src/data/stories.ts`, 'utf8');

// Find the closing ]; of the stories array
const closingBracket = storiesSrc.lastIndexOf('];');
if (closingBracket === -1) throw new Error('Could not find closing ]; in stories.ts');

// Insert before the closing ];
const before = storiesSrc.substring(0, closingBracket);
const after = storiesSrc.substring(closingBracket);

storiesSrc = before + storySection + '\n' + after;

writeFileSync(`${DEEP_MAPS}/src/data/stories.ts`, storiesSrc);
console.log('✓ stories.ts updated');

// ── 2. Add canonicalStoryId to entities ──

let entitiesSrc = readFileSync(`${DEEP_MAPS}/src/data/entities.ts`, 'utf8');

let updatedCount = 0;
for (const { entityId, canonicalStoryId } of entityUpdates) {
  // Find the entity block by its id
  const idPattern = `id: '${entityId}',`;
  const idx = entitiesSrc.indexOf(idPattern);
  if (idx === -1) {
    console.error(`  WARNING: Could not find entity '${entityId}' in entities.ts`);
    continue;
  }

  // Find the closing of this entity block (next `  },`)
  const blockEnd = entitiesSrc.indexOf('\n  },', idx);
  if (blockEnd === -1) {
    console.error(`  WARNING: Could not find block end for entity '${entityId}'`);
    continue;
  }

  // Check if it already has canonicalStoryId
  const blockContent = entitiesSrc.substring(idx, blockEnd);
  if (blockContent.includes('canonicalStoryId')) {
    console.error(`  SKIP: Entity '${entityId}' already has canonicalStoryId`);
    continue;
  }

  // Find the wikipediaSlug line or last field before the closing
  // Insert canonicalStoryId before the wikipediaSlug line, or before the closing
  const wikiIdx = entitiesSrc.indexOf("    wikipediaSlug:", idx);
  if (wikiIdx !== -1 && wikiIdx < blockEnd) {
    // Insert before wikipediaSlug
    entitiesSrc = entitiesSrc.substring(0, wikiIdx) +
      `    canonicalStoryId: '${canonicalStoryId}',\n` +
      entitiesSrc.substring(wikiIdx);
  } else {
    // Insert before the closing },
    entitiesSrc = entitiesSrc.substring(0, blockEnd) +
      `\n    canonicalStoryId: '${canonicalStoryId}',` +
      entitiesSrc.substring(blockEnd);
  }
  updatedCount++;
}

writeFileSync(`${DEEP_MAPS}/src/data/entities.ts`, entitiesSrc);
console.log(`✓ entities.ts updated (${updatedCount} entities)`);
