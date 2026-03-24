// Orphan moments analysis script
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'src', 'data');

// Parse moments.ts
const momentsRaw = fs.readFileSync(path.join(dataDir, 'moments.ts'), 'utf-8');
const storiesRaw = fs.readFileSync(path.join(dataDir, 'stories.ts'), 'utf-8');
const entitiesRaw = fs.readFileSync(path.join(dataDir, 'entities.ts'), 'utf-8');

// Extract all moment objects - get id and entityIds
const moments = [];
const momentRegex = /\{\s*\n\s*id:\s*'([^']+)'/g;
let m;
while ((m = momentRegex.exec(momentsRaw)) !== null) {
  const id = m[1];
  // Find the block for this moment - from this match to the next top-level closing brace
  const startIdx = m.index;
  // Find entityIds in this block
  const blockEnd = momentsRaw.indexOf('\n  },', startIdx);
  const block = momentsRaw.substring(startIdx, blockEnd !== -1 ? blockEnd : startIdx + 2000);

  const entityIdsMatch = block.match(/entityIds:\s*\[([^\]]*)\]/);
  let entityIds = [];
  if (entityIdsMatch && entityIdsMatch[1].trim()) {
    entityIds = entityIdsMatch[1].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || [];
  }

  moments.push({ id, entityIds });
}

// Extract all story objects - get id, storyType, moments[]
const stories = [];
const storyRegex = /\{\s*\n\s*id:\s*'([^']+)'/g;
while ((m = storyRegex.exec(storiesRaw)) !== null) {
  const id = m[1];
  const startIdx = m.index;
  const blockEnd = storiesRaw.indexOf('\n  },', startIdx);
  const block = storiesRaw.substring(startIdx, blockEnd !== -1 ? blockEnd : startIdx + 5000);

  const storyTypeMatch = block.match(/storyType:\s*'([^']+)'/);
  const storyType = storyTypeMatch ? storyTypeMatch[1] : 'unknown';

  // Extract momentIds from moments array
  const momentIds = [];
  const momentIdRegex = /momentId:\s*'([^']+)'/g;
  let mm;
  while ((mm = momentIdRegex.exec(block)) !== null) {
    momentIds.push(mm[1]);
  }

  stories.push({ id, storyType, momentIds });
}

// Extract all entities - get id, type, canonicalStoryId
const entities = [];
const entityRegex = /\{\s*\n\s*id:\s*'([^']+)'/g;
while ((m = entityRegex.exec(entitiesRaw)) !== null) {
  const id = m[1];
  const startIdx = m.index;
  const blockEnd = entitiesRaw.indexOf('\n  },', startIdx);
  const block = entitiesRaw.substring(startIdx, blockEnd !== -1 ? blockEnd : startIdx + 2000);

  const typeMatch = block.match(/type:\s*'([^']+)'/);
  const type = typeMatch ? typeMatch[1] : 'unknown';

  const canonicalMatch = block.match(/canonicalStoryId:\s*'([^']+)'/);
  const canonicalStoryId = canonicalMatch ? canonicalMatch[1] : null;

  const nameMatch = block.match(/name:\s*'([^']+)'/);
  const name = nameMatch ? nameMatch[1] : id;

  entities.push({ id, name, type, canonicalStoryId });
}

// Build entity lookup
const entityMap = new Map();
entities.forEach(e => entityMap.set(e.id, e));

// Build story lookup
const storyMap = new Map();
stories.forEach(s => storyMap.set(s.id, s));

// Build set of all moment IDs in any story
const wiredMomentIds = new Set();
stories.forEach(s => {
  s.momentIds.forEach(mid => wiredMomentIds.add(mid));
});

// Find orphans
const orphans = moments.filter(m => !wiredMomentIds.has(m.id));

console.log(`Total moments: ${moments.length}`);
console.log(`Moments wired to stories: ${wiredMomentIds.size}`);
console.log(`Orphan moments: ${orphans.length}`);
console.log(`Total stories: ${stories.length}`);
console.log(`Total entities: ${entities.length}`);
console.log('');

// Categorize orphans
const bucketA = []; // Has entity with existing biography story
const bucketB = []; // Has person entity but NO biography story
const bucketC = []; // Has entity but not person type
const bucketD = []; // No entityIds at all
const bucketE = []; // Other

orphans.forEach(orphan => {
  if (!orphan.entityIds || orphan.entityIds.length === 0) {
    bucketD.push(orphan);
    return;
  }

  // Check entities
  let hasPersonWithBio = false;
  let hasPersonWithoutBio = false;
  let hasNonPerson = false;
  let bioStoryIds = [];
  let personEntityIdsWithoutBio = [];
  let nonPersonEntityIds = [];

  let hasMissingEntity = false;
  orphan.entityIds.forEach(eid => {
    const entity = entityMap.get(eid);
    if (!entity) {
      hasMissingEntity = true;
      return;
    }

    if (entity.type === 'person') {
      if (entity.canonicalStoryId) {
        hasPersonWithBio = true;
        bioStoryIds.push(entity.canonicalStoryId);
      } else {
        hasPersonWithoutBio = true;
        personEntityIdsWithoutBio.push(eid);
      }
    } else {
      hasNonPerson = true;
      nonPersonEntityIds.push({ id: eid, type: entity.type });
    }
  });

  // Priority: A > B > C > E
  if (hasPersonWithBio) {
    bucketA.push({ ...orphan, bioStoryIds });
  } else if (hasPersonWithoutBio) {
    bucketB.push({ ...orphan, personEntityIdsWithoutBio });
  } else if (hasNonPerson) {
    bucketC.push({ ...orphan, nonPersonEntityIds });
  } else if (hasMissingEntity) {
    bucketE.push({ ...orphan, reason: `Entity ID(s) not found in entities.ts: ${orphan.entityIds.join(', ')}` });
  } else {
    bucketE.push({ ...orphan, reason: 'Unknown edge case' });
  }
});

console.log(`Bucket A (has entity with bio story): ${bucketA.length}`);
console.log(`Bucket B (has person, no bio story): ${bucketB.length}`);
console.log(`Bucket C (non-person entity only): ${bucketC.length}`);
console.log(`Bucket D (no entityIds): ${bucketD.length}`);
console.log(`Bucket E (other): ${bucketE.length}`);
console.log('');

// For Bucket A, build the edits needed: storyId -> [momentIds to add] (deduplicated)
const bioStoryEdits = new Map();
bucketA.forEach(orphan => {
  const uniqueStoryIds = [...new Set(orphan.bioStoryIds)];
  uniqueStoryIds.forEach(sid => {
    if (!bioStoryEdits.has(sid)) {
      bioStoryEdits.set(sid, []);
    }
    if (!bioStoryEdits.get(sid).includes(orphan.id)) {
      bioStoryEdits.get(sid).push(orphan.id);
    }
  });
});

// For Bucket B, collect unique person entity IDs without bios
const personEntitiesNeedingBios = new Set();
bucketB.forEach(orphan => {
  orphan.personEntityIdsWithoutBio.forEach(eid => personEntitiesNeedingBios.add(eid));
});

// For Bucket C, collect entity types
const nonPersonEntityTypes = new Map();
bucketC.forEach(orphan => {
  orphan.nonPersonEntityIds.forEach(({ id, type }) => {
    if (!nonPersonEntityTypes.has(id)) {
      nonPersonEntityTypes.set(id, { type, count: 0 });
    }
    nonPersonEntityTypes.get(id).count++;
  });
});

// Generate report
let report = `# Orphan Moments Analysis

Generated: ${new Date().toISOString().split('T')[0]}

## Summary

| Metric | Count |
|--------|-------|
| Total moments | ${moments.length} |
| Moments wired to stories | ${wiredMomentIds.size} |
| **Orphan moments** | **${orphans.length}** |
| Total stories | ${stories.length} |
| Total entities | ${entities.length} |

## Bucket Breakdown

| Bucket | Description | Count |
|--------|------------|-------|
| **A** | Has entity with existing biography story — just add to moments[] | **${bucketA.length}** |
| **B** | Has person entity but NO biography story | **${bucketB.length}** |
| **C** | Has non-person entity only (place, org, work, concept) | **${bucketC.length}** |
| **D** | No entityIds at all — needs entity tagging | **${bucketD.length}** |
| **E** | Other (missing entities, edge cases) | **${bucketE.length}** |

---

## Bucket A: Ready to Wire (${bucketA.length} moments)

These orphans have at least one entity with a \`canonicalStoryId\` pointing to an existing biography story. They just need to be added to that story's \`moments[]\` array.

### Stories That Need Updating

${Array.from(bioStoryEdits.entries())
  .sort((a, b) => b[1].length - a[1].length)
  .map(([storyId, momentIds]) => {
    const story = storyMap.get(storyId);
    const currentCount = story ? story.momentIds.length : '?';
    return `#### \`${storyId}\` (currently ${currentCount} moments, adding ${momentIds.length})

\`\`\`
${momentIds.map(mid => `{ momentId: '${mid}' }`).join('\n')}
\`\`\`
`;
  }).join('\n')}

### Bucket A — Full Edit Map (JSON)

\`\`\`json
${JSON.stringify(Object.fromEntries(bioStoryEdits), null, 2)}
\`\`\`

---

## Bucket B: Needs Biography Story Created (${bucketB.length} moments)

These orphans have person entities that lack a \`canonicalStoryId\`. A biography story must be created first, then the moments wired to it.

### Person Entities Needing Biography Stories (${personEntitiesNeedingBios.size} entities)

| Entity ID | Entity Name | Type | Orphan Moment Count |
|-----------|-------------|------|---------------------|
${Array.from(personEntitiesNeedingBios).map(eid => {
  const entity = entityMap.get(eid);
  const count = bucketB.filter(o => o.personEntityIdsWithoutBio.includes(eid)).length;
  return `| \`${eid}\` | ${entity ? entity.name : 'UNKNOWN'} | ${entity ? entity.type : '?'} | ${count} |`;
}).join('\n')}

### Bucket B — Orphan Moments by Entity

${Array.from(personEntitiesNeedingBios).map(eid => {
  const entity = entityMap.get(eid);
  const relatedOrphans = bucketB.filter(o => o.personEntityIdsWithoutBio.includes(eid));
  return `#### \`${eid}\` — ${entity ? entity.name : 'UNKNOWN'} (${relatedOrphans.length} orphans)

${relatedOrphans.map(o => `- \`${o.id}\``).join('\n')}
`;
}).join('\n')}

---

## Bucket C: Non-Person Entities (${bucketC.length} moments)

These orphans have entities that are not person-type (places, organizations, works, concepts). They need a different kind of story or collection.

### Non-Person Entity Summary

| Entity ID | Type | Orphan Count |
|-----------|------|--------------|
${Array.from(nonPersonEntityTypes.entries())
  .sort((a, b) => b[1].count - a[1].count)
  .map(([eid, { type, count }]) => {
    const entity = entityMap.get(eid);
    return `| \`${eid}\` (${entity ? entity.name : 'UNKNOWN'}) | ${type} | ${count} |`;
  }).join('\n')}

### Bucket C — All Orphan Moment IDs

${bucketC.map(o => `- \`${o.id}\` → entities: ${o.nonPersonEntityIds.map(e => `\`${e.id}\` (${e.type})`).join(', ')}`).join('\n')}

---

## Bucket D: No Entity Tags (${bucketD.length} moments)

These orphans have no \`entityIds\` at all. They need entity tagging before they can be wired to any story.

### All Bucket D Moment IDs

${bucketD.map(o => `- \`${o.id}\``).join('\n')}

---

## Bucket E: Other / Edge Cases (${bucketE.length} moments)

${bucketE.length > 0 ? bucketE.map(o => `- \`${o.id}\` — ${o.reason || 'unknown'}`).join('\n') : 'None.'}
`;

const outputPath = path.join(__dirname, 'orphan-moments-analysis.md');
fs.writeFileSync(outputPath, report);
console.log(`Report written to ${outputPath}`);
console.log('');

// Quick stats for verification
console.log('--- Verification ---');
console.log(`Bucket A + B + C + D + E = ${bucketA.length + bucketB.length + bucketC.length + bucketD.length + bucketE.length}`);
console.log(`Top 5 stories needing most additions:`);
Array.from(bioStoryEdits.entries())
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 5)
  .forEach(([sid, mids]) => console.log(`  ${sid}: +${mids.length}`));
