/**
 * Deep Maps Data Validator — Pre-commit enforcement
 *
 * Checks:
 * 1. Temporal impossibility (entity death year < moment year)
 * 2. Entity references exist (entityIds point to real entities)
 * 3. Story moment references exist
 * 4. ID uniqueness (no duplicate moment/entity/story IDs)
 * 5. Required fields present
 * 6. Biography story wiring (person entity → canonicalStoryId → story exists)
 * 7. Orphan detection (moments not in any story)
 *
 * Run: npx tsx scripts/validate-data.ts
 * Exit code 0 = clean, 1 = violations found
 */

import { moments } from '../src/data/moments.js';
import { stories } from '../src/data/stories.js';
import { entities } from '../src/data/entities.js';
import { collections } from '../src/data/collections.js';

interface Violation {
  severity: 'error' | 'warning';
  check: string;
  id: string;
  message: string;
}

const violations: Violation[] = [];

function error(check: string, id: string, message: string) {
  violations.push({ severity: 'error', check, id, message });
}

function warn(check: string, id: string, message: string) {
  violations.push({ severity: 'warning', check, id, message });
}

// Build lookup maps
const entityMap = new Map(entities.map(e => [e.id, e]));
const momentMap = new Map(moments.map(m => [m.id, m]));
const storyMap = new Map(stories.map(s => [s.id, s]));

// Parse year from entity years string like "1879–1955" or "c. 111–71 BCE"
function parseDeathYear(years: string | undefined): number | null {
  if (!years) return null;
  const match = years.match(/[–\-]\s*(\d+)\s*(BCE|BC|CE|AD)?$/i);
  if (!match) return null;
  const year = parseInt(match[1]);
  const era = match[2]?.toUpperCase();
  if (era === 'BCE' || era === 'BC') return -year;
  return year;
}

function parseBirthYear(years: string | undefined): number | null {
  if (!years) return null;
  const match = years.match(/^c?\.?\s*(\d+)\s*(BCE|BC|CE|AD)?/i);
  if (!match) return null;
  const year = parseInt(match[1]);
  const era = match[2]?.toUpperCase();
  if (era === 'BCE' || era === 'BC') return -year;
  return year;
}

console.log('🔍 Deep Maps Data Validator');
console.log('='.repeat(60));

// ============================================================
// CHECK 1: ID uniqueness
// ============================================================
console.log('\n📋 Check 1: ID uniqueness');

const momentIds = new Set<string>();
for (const m of moments) {
  if (momentIds.has(m.id)) {
    error('uniqueness', m.id, `Duplicate moment ID: ${m.id}`);
  }
  momentIds.add(m.id);
}

const entityIds = new Set<string>();
for (const e of entities) {
  if (entityIds.has(e.id)) {
    error('uniqueness', e.id, `Duplicate entity ID: ${e.id}`);
  }
  entityIds.add(e.id);
}

const storyIds = new Set<string>();
for (const s of stories) {
  if (storyIds.has(s.id)) {
    error('uniqueness', s.id, `Duplicate story ID: ${s.id}`);
  }
  storyIds.add(s.id);
}

console.log(`  ${momentIds.size} moments, ${entityIds.size} entities, ${storyIds.size} stories`);

// ============================================================
// CHECK 2: Entity references exist
// ============================================================
console.log('\n📋 Check 2: Entity references exist');
let badEntityRefs = 0;

for (const m of moments) {
  const eIds = (m as any).entityIds || [];
  for (const eid of eIds) {
    if (!entityMap.has(eid)) {
      error('entity-ref', m.id, `Moment references non-existent entity: ${eid}`);
      badEntityRefs++;
    }
  }
}
console.log(`  ${badEntityRefs} broken entity references`);

// ============================================================
// CHECK 3: Temporal impossibility
// ============================================================
console.log('\n📋 Check 3: Temporal impossibility (dead person tagged)');
let temporalViolations = 0;

for (const m of moments) {
  const momentYear = (m as any).year;
  if (momentYear == null) continue;

  const eIds = (m as any).entityIds || [];
  for (const eid of eIds) {
    const entity = entityMap.get(eid);
    if (!entity || entity.type !== 'person') continue;

    const deathYear = parseDeathYear(entity.years);
    if (deathYear !== null && deathYear < momentYear) {
      // Allow 5-year margin for approximate dates
      if (momentYear - deathYear > 5) {
        // Temporal mismatch is a WARNING (not error) because burial sites, sacred sites,
        // and discovery moments are legitimate — the person WAS physically at the coordinates
        // at some point, even if the moment's year is after their death.
        // Rule: person must have been at the physical coordinates at some point AND the moment
        // relates to that person at that place.
        warn('temporal', m.id,
          `${entity.name} (died ${deathYear >= 0 ? deathYear : Math.abs(deathYear) + ' BCE'}) tagged on moment from year ${momentYear >= 0 ? momentYear : Math.abs(momentYear) + ' BCE'} — dead ${Math.abs(momentYear - deathYear)} years before this event. REVIEW: was person ever physically at these coordinates?`);
        temporalViolations++;
      }
    }
  }
}
console.log(`  ${temporalViolations} temporal impossibilities`);

// ============================================================
// CHECK 4: Story moment references exist
// ============================================================
console.log('\n📋 Check 4: Story moment references exist');
let badStoryRefs = 0;

for (const s of stories) {
  const storyMoments = (s as any).moments || [];
  for (const sm of storyMoments) {
    if (!momentMap.has(sm.momentId)) {
      error('story-ref', s.id, `Story references non-existent moment: ${sm.momentId}`);
      badStoryRefs++;
    }
  }
}
console.log(`  ${badStoryRefs} broken story-moment references`);

// ============================================================
// CHECK 5: Required fields
// ============================================================
console.log('\n📋 Check 5: Required fields');
let missingFields = 0;

for (const m of moments) {
  if (!m.name) { error('required', m.id, 'Moment missing name'); missingFields++; }
  if (!(m as any).subtitle) { warn('required', m.id, 'Moment missing subtitle'); missingFields++; }
  if (!(m as any).description) { warn('required', m.id, 'Moment missing description'); missingFields++; }
  if ((m as any).lat == null) { error('required', m.id, 'Moment missing lat'); missingFields++; }
  if ((m as any).lng == null) { error('required', m.id, 'Moment missing lng'); missingFields++; }
}
console.log(`  ${missingFields} missing fields`);

// ============================================================
// CHECK 6: Biography wiring
// ============================================================
console.log('\n📋 Check 6: Biography story wiring');
let wiringIssues = 0;

for (const e of entities) {
  if (e.type !== 'person') continue;
  const csid = (e as any).canonicalStoryId;
  if (!csid) {
    warn('biography', e.id, `Person entity has no canonicalStoryId`);
    wiringIssues++;
    continue;
  }
  if (!storyMap.has(csid)) {
    error('biography', e.id, `canonicalStoryId '${csid}' does not exist in stories`);
    wiringIssues++;
  }
}
console.log(`  ${wiringIssues} biography wiring issues`);

// ============================================================
// CHECK 7: Orphan moments
// ============================================================
console.log('\n📋 Check 7: Orphan moments (not in any story or collection)');

const momentsInStories = new Set<string>();
for (const s of stories) {
  for (const sm of (s as any).moments || []) {
    momentsInStories.add(sm.momentId);
  }
}
for (const c of collections) {
  for (const mid of (c as any).momentIds || []) {
    momentsInStories.add(mid);
  }
}

let orphanCount = 0;
for (const m of moments) {
  if (!momentsInStories.has(m.id)) {
    warn('orphan', m.id, `Moment not in any story or collection`);
    orphanCount++;
  }
}
console.log(`  ${orphanCount} orphan moments`);

// ============================================================
// SUMMARY
// ============================================================
const errors = violations.filter(v => v.severity === 'error');
const warnings = violations.filter(v => v.severity === 'warning');

console.log('\n' + '='.repeat(60));
console.log(`\n🔴 ERRORS: ${errors.length}  |  🟡 WARNINGS: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n🔴 ERRORS (must fix):');
  for (const v of errors) {
    console.log(`  [${v.check}] ${v.id}: ${v.message}`);
  }
}

if (warnings.length > 0 && process.argv.includes('--verbose')) {
  console.log('\n🟡 WARNINGS:');
  for (const v of warnings) {
    console.log(`  [${v.check}] ${v.id}: ${v.message}`);
  }
}

if (errors.length > 0) {
  console.log(`\n❌ VALIDATION FAILED — ${errors.length} errors must be fixed before commit`);
  process.exit(1);
} else {
  console.log(`\n✅ VALIDATION PASSED — ${warnings.length} warnings (run with --verbose to see)`);
  process.exit(0);
}
