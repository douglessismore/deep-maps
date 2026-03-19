/**
 * generate-tracker.ts
 *
 * Reads top-people.json and queries Supabase to produce a self-contained
 * tracker.html showing ingestion status, completeness matrix, and
 * interactive note-taking for all planned people and entities.
 *
 * Usage:  npx tsx scripts/generate-tracker.ts
 * Output: tracker.html in project root
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

dotenv.config({ path: resolve(ROOT, ".env.local") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface TopPerson {
  rank: number;
  deepMapsScore: number;
  name: string;
  category: string;
  occupation: string;
  occupationDetail: string;
  wikipediaSlug: string;
  birthYear: number;
  deathYear: number;
}

interface EntityRow {
  id: string;
  name: string;
  type: string;
  wikipedia_slug: string;
  canonical_story_id: string | null;
  years: string | null;
  description: string | null;
}

interface StoryMomentRow {
  story_id: string;
  moment_id: string;
}

interface MomentRow {
  id: string;
  name: string;
  type_id: string;
  importance: string;
  year: number | null;
  kind: string;
  description: string | null;
  notability: number | null;
  date: string | null;
  accuracy: string | null;
  location: unknown | null; // PostGIS geometry, we only check null/non-null
}

interface MomentQuality {
  g1_verbName: boolean;
  g2_description: boolean;
  g3_coordinates: boolean;
  g4_date: boolean;
  g5_notability: boolean;
  gatesPass: number; // 0-5
}

interface MomentEntityRow {
  moment_id: string;
  entity_id: string;
}

interface MomentMediaRow {
  moment_id: string;
}

interface TrackerRow {
  rank: number;
  name: string;
  slug: string;
  score: number;
  category: string;
  occupation: string;
  entityId: string;
  storyId: string;
  momentCount: number;
  status: "complete" | "partial" | "not_started";
  years: string;
  birthYear: number;
  deathYear: number;
  hasBirth: boolean;
  hasDeath: boolean;
  hasBurial: boolean;
  hasEducation: boolean;
  hasMajorWork: boolean;
  geoSpread: number;
  qualityPct: number; // 0-100, average gate pass rate across moments
  qualityGateFailures: { g1: number; g2: number; g3: number; g4: number; g5: number }; // count of failures per gate
  imageCount: number; // moments with images
  accuracyExact: number;
  accuracyApprox: number;
  accuracyGeneral: number;
  moments: Array<{
    name: string;
    year: number | null;
    type_id: string;
    importance: string;
    quality: MomentQuality;
    hasImage: boolean;
    accuracy: string;
  }>;
}

interface CompletenessCheck {
  key: string;
  label: string;
  emoji: string;
  detect: (moments: MomentRow[]) => boolean;
}

interface GenericEntityRow {
  name: string;
  slug: string;
  entityId: string;
  entityType: string;
  storyId: string;
  momentCount: number;
  status: "complete" | "partial" | "not_started";
  years: string;
  description: string;
  qualityPct: number;
  completeness: Record<string, boolean>;
  imageCount: number;
  accuracyExact: number;
  accuracyApprox: number;
  accuracyGeneral: number;
  moments: Array<{ name: string; year: number | null; type_id: string; importance: string; quality: MomentQuality; hasImage: boolean; accuracy: string }>;
}

// ---------------------------------------------------------------------------
// Completeness presets per entity type
// ---------------------------------------------------------------------------

const COMPLETENESS_PRESETS: Record<string, CompletenessCheck[]> = {
  person: [
    { key: "birth", label: "Birth", emoji: "&#x1F423;", detect: (ms) => ms.some(m => /\b(born|birth)\b/i.test(m.name) || (m.type_id === "residence" && m.year !== null)) },
    { key: "death", label: "Death", emoji: "&#x1F480;", detect: (ms) => ms.some(m => /\b(dies|died|death|killed|assassinated|executed|murder)\b/i.test(m.name)) },
    { key: "burial", label: "Burial", emoji: "&#x26B0;&#xFE0F;", detect: (ms) => ms.some(m => m.type_id === "burial" || /\b(buried|burial|tomb|grave|funeral|mausoleum|cemetery)\b/i.test(m.name)) },
    { key: "education", label: "Education", emoji: "&#x1F393;", detect: (ms) => ms.some(m => m.type_id === "university" || m.type_id === "institution" || /\b(studies|studied|university|school|college|academy|educated)\b/i.test(m.name)) },
    { key: "majorWork", label: "Major", emoji: "&#x2B50;", detect: (ms) => ms.some(m => m.importance === "major") },
  ],
  place: [
    { key: "founding", label: "Founded", emoji: "&#x1F3D7;", detect: (ms) => ms.some(m => /\b(founded|established|settled|built|constructed)\b/i.test(m.name)) },
    { key: "keyEvents", label: "Events", emoji: "&#x1F4CC;", detect: (ms) => ms.filter(m => m.importance === "major").length >= 2 },
    { key: "coordinates", label: "Coords", emoji: "&#x1F4CD;", detect: (ms) => ms.some(m => m.location !== null) },
    { key: "modern", label: "Modern", emoji: "&#x1F3E2;", detect: (ms) => ms.some(m => m.year !== null && m.year >= 1900) },
  ],
  organization: [
    { key: "founding", label: "Founded", emoji: "&#x1F3D7;", detect: (ms) => ms.some(m => /\b(founded|established|incorporated|created)\b/i.test(m.name)) },
    { key: "milestones", label: "Milestones", emoji: "&#x1F3AF;", detect: (ms) => ms.filter(m => m.importance === "major").length >= 1 },
    { key: "dissolution", label: "End", emoji: "&#x1F6D1;", detect: (ms) => ms.some(m => /\b(dissolved|closed|ended|disbanded|abolished)\b/i.test(m.name)) },
    { key: "headquarters", label: "HQ", emoji: "&#x1F3E2;", detect: (ms) => ms.some(m => m.type_id === "organization_hq" || /\b(headquarters|HQ)\b/i.test(m.name)) },
  ],
  work: [
    { key: "creation", label: "Created", emoji: "&#x1F3A8;", detect: (ms) => ms.some(m => /\b(created|composed|wrote|published|premiered|released|painted|sculpted)\b/i.test(m.name)) },
    { key: "keyScenes", label: "Scenes", emoji: "&#x1F3AC;", detect: (ms) => ms.filter(m => m.importance === "major").length >= 1 },
    { key: "impact", label: "Impact", emoji: "&#x1F30D;", detect: (ms) => ms.some(m => /\b(influence|legacy|impact|cultural|iconic)\b/i.test(m.name)) },
    { key: "majorWork", label: "Major", emoji: "&#x2B50;", detect: (ms) => ms.some(m => m.importance === "major") },
  ],
  concept: [
    { key: "origin", label: "Origin", emoji: "&#x1F4A1;", detect: (ms) => ms.some(m => /\b(coined|conceived|originated|theorized|invented)\b/i.test(m.name)) },
    { key: "keyMoments", label: "Moments", emoji: "&#x1F4CC;", detect: (ms) => ms.length >= 2 },
    { key: "majorWork", label: "Major", emoji: "&#x2B50;", detect: (ms) => ms.some(m => m.importance === "major") },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchAllPages<T>(
  table: string,
  select: string,
): Promise<T[]> {
  const PAGE = 1000;
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Supabase ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Verb-first name check: content guide says moment names should describe WHAT HAPPENED
const VERB_PATTERN = /\b(is|are|was|were|born|dies|died|builds|built|founds|founded|creates|created|writes|wrote|written|publishes|published|discovers|discovered|invents|invented|defeats|defeated|conquers|conquered|flees|fled|arrives|arrived|signs|signed|declares|declared|launches|launched|opens|opened|establishes|established|begins|began|starts|started|ends|ended|leads|led|fights|fought|wins|won|loses|lost|meets|met|marries|married|moves|moved|travels|traveled|returns|returned|visits|visited|presents|presented|coins|coined|turns|turned|delivers|delivered|makes|made|takes|took|learns|learned|becomes|became|receives|received|completes|completed|escapes|escaped|crosses|crossed|falls|fell|rises|rose|burns|burned|destroys|destroyed|kills|killed|assassinates|assassinated|executes|executed|buries|buried|captures|captured|surrenders|surrendered|abolishes|abolished|proclaims|proclaimed|crowns|crowned|abdicates|abdicated|annexes|annexed|colonizes|colonized|liberates|liberated|composes|composed|paints|painted|sculpts|sculpted|directs|directed|performs|performed|records|recorded|premieres|premiered|debuts|debuted|graduates|graduated|enrolls|enrolled|attends|attended|studies|studied|teaches|teaches|incorporates|incorporated|erupts|erupted|strikes|struck|floods|flooded|sinks|sank|crashes|crashed|explodes|exploded|lands|landed|orbits|orbited|docks|docked|rewrite|reshapes|reshape|coins|flees|appears|converts|retreats|enters|unifies|expands|rules|rules|serves|governs|develops|emerges|introduces|launches|adopts|adopts|acquires|ascends|descends|migrates|settles|raids|invades|besieges|defends|survives|witnesses|commissions|inaugurates|consecrates|demolishes|restores|renovates)\b/i;

function checkVerbName(name: string): boolean {
  return VERB_PATTERN.test(name);
}

function computeMomentQuality(m: MomentRow): MomentQuality {
  const g1 = checkVerbName(m.name);
  const g2 = m.description !== null && m.description.length >= 50 && m.description.length <= 800;
  const g3 = m.location !== null;
  const g4 = m.year !== null || m.date !== null;
  const g5 = m.notability !== null && m.notability >= 30;
  return {
    g1_verbName: g1,
    g2_description: g2,
    g3_coordinates: g3,
    g4_date: g4,
    g5_notability: g5,
    gatesPass: [g1, g2, g3, g4, g5].filter(Boolean).length,
  };
}

// ---------------------------------------------------------------------------
// HTML generation helpers
// ---------------------------------------------------------------------------

const statusIcon = (s: "complete" | "partial" | "not_started") =>
  s === "complete" ? "&#x2705;" : s === "partial" ? "&#x1F7E1;" : "&#x2B1C;";
const statusLabel = (s: "complete" | "partial" | "not_started") =>
  s === "complete" ? "Complete" : s === "partial" ? "Partial" : "Not Started";

const checkMark = (val: boolean) =>
  val ? '<span class="check-yes">&#x2713;</span>' : '<span class="check-no">&#x2717;</span>';

const qualityBadge = (pct: number, hasMoments: boolean) => {
  if (!hasMoments) return '<span class="quality-na">&mdash;</span>';
  const cls = pct >= 90 ? "quality-high" : pct >= 70 ? "quality-mid" : "quality-low";
  return `<span class="${cls}">${pct}%</span>`;
};

function generateEntityTableRows(
  rows: GenericEntityRow[],
  preset: CompletenessCheck[],
  prefix: string,
): string {
  return rows.map((r, i) => {
    const idx = prefix + i;
    const momentsJson = esc(JSON.stringify(r.moments));
    const compCells = preset.map(c =>
      `  <td class="completeness">${checkMark(r.completeness[c.key] || false)}</td>`
    ).join("\n");
    const compData = preset.map(c => `data-${c.key}="${r.completeness[c.key] ? 1 : 0}"`).join(" ");

    return `<tr class="data-row entity-row" data-tab="${r.entityType}" data-status="${r.status}" data-name="${esc(r.name.toLowerCase())}" data-slug="${esc(r.slug)}" data-idx="${idx}" data-quality="${r.momentCount > 0 ? r.qualityPct : -1}" ${compData} data-moments-json="${momentsJson}">
  <td class="name">${esc(r.name)}${r.years ? '<span class="years">' + esc(r.years) + '</span>' : ''}</td>
  <td class="status">${statusIcon(r.status)} ${statusLabel(r.status)}</td>
  <td class="moments">${r.momentCount}</td>
  <td class="quality-cell">${qualityBadge(r.qualityPct, r.momentCount > 0)}</td>
${compCells}
  <td class="notes-count" id="notes-count-${idx}"><span class="note-badge hidden">0</span></td>
</tr>
<tr class="detail-row hidden" id="detail-${idx}"><td colspan="${4 + preset.length + 1}"><div class="detail-panel">
  <div class="detail-grid" style="grid-template-columns:1fr 200px 1fr;">
    <div class="detail-moments">
      <h4>Moments</h4>
      <div class="moments-list" id="moments-list-${idx}"></div>
    </div>
    <div class="detail-audit">
      <h4>Manual Audit</h4>
      <div class="audit-gates" id="audit-gates-${idx}">
        <div class="audit-gate" id="audit-tone-${idx}">
          <span class="audit-gate-icon">&#x2B1C;</span>
          <span class="audit-gate-label">Encyclopedic tone</span>
          <button class="btn-audit" onclick="markAuditGate('${idx}', 'audit-tone')">Mark done</button>
        </div>
        <div class="audit-gate" id="audit-sensitivity-${idx}">
          <span class="audit-gate-icon">&#x2B1C;</span>
          <span class="audit-gate-label">Cultural sensitivity</span>
          <button class="btn-audit" onclick="markAuditGate('${idx}', 'audit-sensitivity')">Mark done</button>
        </div>
      </div>
    </div>
    <div class="detail-notes">
      <h4>Notes <span class="note-total" id="note-total-${idx}"></span></h4>
      <div class="notes-list" id="notes-list-${idx}"></div>
      <div class="note-input-row">
        <input type="text" class="note-input" id="note-input-${idx}" placeholder="Add a note...">
        <button class="btn-add-note" onclick="addNote('${idx}')">Add</button>
      </div>
    </div>
  </div>
</div></td></tr>`;
  }).join("\n");
}

function generateEntityTab(
  entityType: string,
  rows: GenericEntityRow[],
  preset: CompletenessCheck[],
  prefix: string,
): string {
  const t = rows.length;
  const c = rows.filter(r => r.status === "complete").length;
  const p = rows.filter(r => r.status === "partial").length;
  const ns = rows.filter(r => r.status === "not_started").length;

  const compStats = preset.map(check => {
    const count = rows.filter(r => r.completeness[check.key]).length;
    return `<span class="cstat">${check.emoji} ${check.label}: <strong>${count}/${t}</strong></span>`;
  }).join("\n  ");

  // Image and accuracy stats for this entity type
  const etMoments = rows.reduce((s, r) => s + r.momentCount, 0);
  const etImages = rows.reduce((s, r) => s + r.imageCount, 0);
  const etExact = rows.reduce((s, r) => s + r.accuracyExact, 0);
  const etApprox = rows.reduce((s, r) => s + r.accuracyApprox, 0);
  const etGeneral = rows.reduce((s, r) => s + r.accuracyGeneral, 0);

  const compHeaders = preset.map(check =>
    `<th data-col="${check.key}" data-type="num" class="comp-col" data-tab="${entityType}" title="${check.label}">${check.emoji}<br><span class="comp-label">${check.label}</span></th>`
  ).join("\n    ");

  const missingOptions = preset.map(check =>
    `<option value="${check.key}">Missing: ${check.label}</option>`
  ).join("\n      ");

  const tableRows = generateEntityTableRows(rows, preset, prefix);

  const typeLabel = entityType === "organization" ? "Organizations" :
    entityType.charAt(0).toUpperCase() + entityType.slice(1) + "s";

  return `<div class="tab-content" id="tab-${entityType}">
<div class="stats">
  <div class="stat stat-total"><span class="stat-value">${t}</span><span class="stat-label">Total ${typeLabel}</span></div>
  <div class="stat stat-complete"><span class="stat-value">${c}</span><span class="stat-label">Complete</span></div>
  <div class="stat stat-partial"><span class="stat-value">${p}</span><span class="stat-label">Partial</span></div>
  <div class="stat stat-not-started"><span class="stat-value">${ns}</span><span class="stat-label">Not Started</span></div>
</div>
<div class="completeness-stats">
  ${compStats}
</div>
<div class="audit-stats">
  <span class="astat">&#x1F4F7; Images: <strong>${etImages}/${etMoments}</strong> moments</span>
  <span class="astat">&#x1F4CD; Accuracy: <strong class="aq-high">${etExact}</strong> exact &middot; <strong class="aq-mid">${etApprox}</strong> approx &middot; <strong class="aq-low">${etGeneral}</strong> general</span>
</div>
<div class="filters">
  <input type="text" class="tab-search" data-tab="${entityType}" placeholder="Search ${typeLabel.toLowerCase()}..." autocomplete="off">
  <select class="tab-status-filter" data-tab="${entityType}">
    <option value="">All statuses</option>
    <option value="complete">&#x2705; Complete</option>
    <option value="partial">&#x1F7E1; Partial</option>
    <option value="not_started">&#x2B1C; Not Started</option>
  </select>
  <select class="tab-missing-filter" data-tab="${entityType}">
    <option value="">Missing: any</option>
    ${missingOptions}
  </select>
  <select class="tab-quality-filter" data-tab="${entityType}">
    <option value="">Quality: any</option>
    <option value="low">Quality &lt; 70%</option>
    <option value="mid">Quality 70-89%</option>
    <option value="high">Quality &#x2265; 90%</option>
  </select>
  <label><input type="checkbox" class="tab-notes-filter" data-tab="${entityType}"> Has Notes</label>
  <span class="filter-count tab-filter-count" data-tab="${entityType}">${t} shown</span>
</div>
<table>
<thead>
<tr>
  <th data-col="name" data-type="str" data-tab="${entityType}">Name</th>
  <th data-col="status" data-type="str" data-tab="${entityType}">Status</th>
  <th data-col="moments" data-type="num" data-tab="${entityType}">Moments</th>
  <th data-col="quality" data-type="num" data-tab="${entityType}" title="Quality audit score">Quality</th>
    ${compHeaders}
  <th class="comp-col" data-tab="${entityType}">Notes</th>
</tr>
</thead>
<tbody class="entity-tbody" data-tab="${entityType}">
${tableRows}
</tbody>
</table>
</div>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // 1. Load top-people
  const people: TopPerson[] = JSON.parse(
    readFileSync(resolve(ROOT, "data/top-people.json"), "utf-8"),
  );
  console.log(`Loaded ${people.length} people from top-people.json`);

  // 2. Query Supabase
  console.log("Querying entities...");
  const entities = await fetchAllPages<EntityRow>("entities", "id,name,type,wikipedia_slug,canonical_story_id,years,description");
  console.log(`  ${entities.length} entities found`);

  console.log("Querying story_moments...");
  const storyMoments = await fetchAllPages<StoryMomentRow>("story_moments", "story_id,moment_id");
  console.log(`  ${storyMoments.length} story_moment links found`);

  console.log("Querying moments...");
  const moments = await fetchAllPages<MomentRow>("moments", "id,name,type_id,importance,year,kind,description,notability,date,accuracy,location");
  console.log(`  ${moments.length} moments found`);

  console.log("Querying moment_entities...");
  const momentEntities = await fetchAllPages<MomentEntityRow>("moment_entities", "moment_id,entity_id");
  console.log(`  ${momentEntities.length} moment_entity links found`);

  console.log("Querying moment_media...");
  const momentMedia = await fetchAllPages<MomentMediaRow>("moment_media", "moment_id");
  console.log(`  ${momentMedia.length} moment_media records found`);

  // 3. Build lookup maps
  const slugToEntity = new Map<string, EntityRow>();
  for (const e of entities) {
    if (e.wikipedia_slug) {
      slugToEntity.set(e.wikipedia_slug, e);
    }
  }

  const nameToEntity = new Map<string, EntityRow>();
  for (const e of entities) {
    nameToEntity.set(e.name.toLowerCase(), e);
  }

  // story_id -> moment_ids
  const storyToMomentIds = new Map<string, string[]>();
  for (const sm of storyMoments) {
    if (!storyToMomentIds.has(sm.story_id)) storyToMomentIds.set(sm.story_id, []);
    storyToMomentIds.get(sm.story_id)!.push(sm.moment_id);
  }

  // entity_id -> moment_ids (via moment_entities)
  const entityToMomentIds = new Map<string, string[]>();
  for (const me of momentEntities) {
    if (!entityToMomentIds.has(me.entity_id)) entityToMomentIds.set(me.entity_id, []);
    entityToMomentIds.get(me.entity_id)!.push(me.moment_id);
  }

  // moment_id -> MomentRow
  const momentById = new Map<string, MomentRow>();
  for (const m of moments) {
    momentById.set(m.id, m);
  }

  // moment_id -> has image
  const momentHasImage = new Set<string>();
  for (const mm of momentMedia) {
    momentHasImage.add(mm.moment_id);
  }

  // 4. Build rows with completeness matrix (people)
  const rows: TrackerRow[] = people.map((p) => {
    const entity =
      slugToEntity.get(p.wikipediaSlug) ||
      nameToEntity.get(p.name.toLowerCase());

    const entityId = entity?.id || "";
    const storyId = entity?.canonical_story_id || "";

    // Gather all moments linked to this person via story AND via moment_entities
    const momentIdSet = new Set<string>();
    if (storyId) {
      const smIds = storyToMomentIds.get(storyId) || [];
      for (const mid of smIds) momentIdSet.add(mid);
    }
    if (entityId) {
      const meIds = entityToMomentIds.get(entityId) || [];
      for (const mid of meIds) momentIdSet.add(mid);
    }

    const personMoments = [...momentIdSet]
      .map((mid) => momentById.get(mid))
      .filter((m): m is MomentRow => m !== undefined);

    const momentCount = personMoments.length;

    let status: TrackerRow["status"] = "not_started";
    if (momentCount >= 4) status = "complete";
    else if (momentCount >= 1 || entityId) status = "partial";

    const birthStr = p.birthYear < 0 ? `${Math.abs(p.birthYear)} BCE` : `${p.birthYear}`;
    const deathStr = p.deathYear < 0 ? `${Math.abs(p.deathYear)} BCE` : `${p.deathYear}`;
    const years = `${birthStr} \u2013 ${deathStr}`;

    // Completeness checks
    const birthDeathPatterns = {
      birth: /\b(born|birth)\b/i,
      death: /\b(dies|died|death|killed|assassinated|executed|murder)\b/i,
      burial: /\b(buried|burial|tomb|grave|funeral|mausoleum|cemetery)\b/i,
      education: /\b(studies|studied|university|school|college|academy|educated)\b/i,
    };

    let hasBirth = false;
    let hasDeath = false;
    let hasBurial = false;
    let hasEducation = false;
    let hasMajorWork = false;
    let geoSpread = 0;

    for (const m of personMoments) {
      // Birth check
      if (birthDeathPatterns.birth.test(m.name)) {
        hasBirth = true;
      } else if (m.type_id === "residence" && m.year !== null && Math.abs(m.year - p.birthYear) <= 2) {
        hasBirth = true;
      }

      // Death check
      if (birthDeathPatterns.death.test(m.name)) {
        hasDeath = true;
      }

      // Burial check
      if (m.type_id === "burial" || birthDeathPatterns.burial.test(m.name)) {
        hasBurial = true;
      }

      // Education check
      if (m.type_id === "university" || m.type_id === "institution" || birthDeathPatterns.education.test(m.name)) {
        hasEducation = true;
      }

      // Major work check
      if (m.importance === "major") {
        hasMajorWork = true;
      }

      // Geo spread: count all moments (they all have coordinates by schema)
      geoSpread++;
    }

    // Image and accuracy stats
    let imageCount = 0;
    let accuracyExact = 0;
    let accuracyApprox = 0;
    let accuracyGeneral = 0;
    for (const m of personMoments) {
      if (momentHasImage.has(m.id)) imageCount++;
      if (m.accuracy === "exact") accuracyExact++;
      else if (m.accuracy === "approximate") accuracyApprox++;
      else if (m.accuracy === "general-area") accuracyGeneral++;
    }

    const momentsForDetail = personMoments.map((m) => ({
      name: m.name,
      year: m.year,
      type_id: m.type_id,
      importance: m.importance,
      quality: computeMomentQuality(m),
      hasImage: momentHasImage.has(m.id),
      accuracy: m.accuracy || "unknown",
    }));

    // Per-person quality score: average gate pass rate
    let qualityPct = 0;
    const qualityGateFailures = { g1: 0, g2: 0, g3: 0, g4: 0, g5: 0 };
    if (momentsForDetail.length > 0) {
      let totalGates = 0;
      for (const m of momentsForDetail) {
        totalGates += m.quality.gatesPass;
        if (!m.quality.g1_verbName) qualityGateFailures.g1++;
        if (!m.quality.g2_description) qualityGateFailures.g2++;
        if (!m.quality.g3_coordinates) qualityGateFailures.g3++;
        if (!m.quality.g4_date) qualityGateFailures.g4++;
        if (!m.quality.g5_notability) qualityGateFailures.g5++;
      }
      qualityPct = Math.round((totalGates / (momentsForDetail.length * 5)) * 100);
    }

    return {
      rank: p.rank,
      name: p.name,
      slug: p.wikipediaSlug,
      score: p.deepMapsScore,
      category: p.category,
      occupation: p.occupation,
      entityId,
      storyId,
      momentCount,
      status,
      years,
      birthYear: p.birthYear,
      deathYear: p.deathYear,
      hasBirth,
      hasDeath,
      hasBurial,
      hasEducation,
      hasMajorWork,
      geoSpread,
      qualityPct,
      qualityGateFailures,
      imageCount,
      accuracyExact,
      accuracyApprox,
      accuracyGeneral,
      moments: momentsForDetail,
    };
  });

  // 5. Stats (people)
  const total = rows.length;
  const complete = rows.filter((r) => r.status === "complete").length;
  const partial = rows.filter((r) => r.status === "partial").length;
  const notStarted = rows.filter((r) => r.status === "not_started").length;
  const withBirth = rows.filter((r) => r.hasBirth).length;
  const withDeath = rows.filter((r) => r.hasDeath).length;
  const withBurial = rows.filter((r) => r.hasBurial).length;
  const withEducation = rows.filter((r) => r.hasEducation).length;
  const withMajorWork = rows.filter((r) => r.hasMajorWork).length;

  // Quality audit stats
  const rowsWithMoments = rows.filter((r) => r.momentCount > 0);
  const qualityHigh = rowsWithMoments.filter((r) => r.qualityPct >= 90).length;
  const qualityMid = rowsWithMoments.filter((r) => r.qualityPct >= 70 && r.qualityPct < 90).length;
  const qualityLow = rowsWithMoments.filter((r) => r.qualityPct < 70).length;
  const totalGateFailures = {
    g1: rows.reduce((s, r) => s + r.qualityGateFailures.g1, 0),
    g2: rows.reduce((s, r) => s + r.qualityGateFailures.g2, 0),
    g3: rows.reduce((s, r) => s + r.qualityGateFailures.g3, 0),
    g4: rows.reduce((s, r) => s + r.qualityGateFailures.g4, 0),
    g5: rows.reduce((s, r) => s + r.qualityGateFailures.g5, 0),
  };

  // Image and accuracy stats (across all moments)
  const totalMoments = rows.reduce((s, r) => s + r.momentCount, 0);
  const totalImages = rows.reduce((s, r) => s + r.imageCount, 0);
  const totalExact = rows.reduce((s, r) => s + r.accuracyExact, 0);
  const totalApprox = rows.reduce((s, r) => s + r.accuracyApprox, 0);
  const totalGeneral = rows.reduce((s, r) => s + r.accuracyGeneral, 0);

  // 6. Collect unique categories
  const categories = [...new Set(rows.map((r) => r.category))].sort();

  // 7. Build people table rows HTML
  const tableRows = rows
    .map(
      (r, i) => {
        const momentsJson = esc(JSON.stringify(r.moments));
        return `<tr class="data-row" data-status="${r.status}" data-category="${esc(r.category)}" data-name="${esc(r.name.toLowerCase())}" data-slug="${esc(r.slug)}" data-idx="${i}" data-birth="${r.hasBirth ? 1 : 0}" data-death="${r.hasDeath ? 1 : 0}" data-burial="${r.hasBurial ? 1 : 0}" data-education="${r.hasEducation ? 1 : 0}" data-major="${r.hasMajorWork ? 1 : 0}" data-quality="${r.momentCount > 0 ? r.qualityPct : -1}" data-moments-json="${momentsJson}">
  <td class="rank">${r.rank}</td>
  <td class="name">${esc(r.name)}<span class="years">${esc(r.years)}</span></td>
  <td class="score">${r.score}</td>
  <td class="cat">${esc(r.category)}</td>
  <td class="occ">${esc(r.occupation)}</td>
  <td class="status">${statusIcon(r.status)} ${statusLabel(r.status)}</td>
  <td class="moments">${r.momentCount}</td>
  <td class="quality-cell">${qualityBadge(r.qualityPct, r.momentCount > 0)}</td>
  <td class="completeness">${checkMark(r.hasBirth)}</td>
  <td class="completeness">${checkMark(r.hasDeath)}</td>
  <td class="completeness">${checkMark(r.hasBurial)}</td>
  <td class="completeness">${checkMark(r.hasEducation)}</td>
  <td class="completeness">${checkMark(r.hasMajorWork)}</td>
  <td class="notes-count" id="notes-count-${i}"><span class="note-badge hidden">0</span></td>
</tr>
<tr class="detail-row hidden" id="detail-${i}"><td colspan="14"><div class="detail-panel">
  <div class="detail-grid">
    <div class="detail-moments">
      <h4>Moments</h4>
      <div class="moments-list" id="moments-list-${i}"></div>
    </div>
    <div class="detail-audit">
      <h4>Manual Audit</h4>
      <div class="audit-gates" id="audit-gates-${i}">
        <div class="audit-gate" id="audit-tone-${i}">
          <span class="audit-gate-icon">&#x2B1C;</span>
          <span class="audit-gate-label">Encyclopedic tone</span>
          <button class="btn-audit" onclick="markAuditGate('${i}', 'audit-tone')">Mark done</button>
        </div>
        <div class="audit-gate" id="audit-sensitivity-${i}">
          <span class="audit-gate-icon">&#x2B1C;</span>
          <span class="audit-gate-label">Cultural sensitivity</span>
          <button class="btn-audit" onclick="markAuditGate('${i}', 'audit-sensitivity')">Mark done</button>
        </div>
      </div>
    </div>
    <div class="detail-notes">
      <h4>Notes <span class="note-total" id="note-total-${i}"></span></h4>
      <div class="notes-list" id="notes-list-${i}"></div>
      <div class="note-input-row">
        <input type="text" class="note-input" id="note-input-${i}" placeholder="Add a note...">
        <button class="btn-add-note" onclick="addNote('${i}')">Add</button>
      </div>
    </div>
  </div>
</div></td></tr>`;
      },
    )
    .join("\n");

  const categoryOptions = categories
    .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
    .join("\n");

  // 8. Build entity type rows
  const entityTypes = ["place", "organization", "work", "concept"];
  const entityRowsByType: Record<string, GenericEntityRow[]> = {};
  const prefixMap: Record<string, string> = { place: "p-", organization: "o-", work: "w-", concept: "c-" };

  for (const entityType of entityTypes) {
    const typeEntities = entities.filter(e => e.type === entityType);
    const preset = COMPLETENESS_PRESETS[entityType] || [];

    entityRowsByType[entityType] = typeEntities.map(entity => {
      const entityId = entity.id;
      const storyId = entity.canonical_story_id || "";

      const momentIdSet = new Set<string>();
      if (storyId) {
        const smIds = storyToMomentIds.get(storyId) || [];
        for (const mid of smIds) momentIdSet.add(mid);
      }
      const meIds = entityToMomentIds.get(entityId) || [];
      for (const mid of meIds) momentIdSet.add(mid);

      const entityMoments = [...momentIdSet]
        .map(mid => momentById.get(mid))
        .filter((m): m is MomentRow => m !== undefined);

      const momentCount = entityMoments.length;
      let status: "complete" | "partial" | "not_started" = "not_started";
      if (momentCount >= 4) status = "complete";
      else if (momentCount >= 1) status = "partial";

      const completeness: Record<string, boolean> = {};
      for (const check of preset) {
        completeness[check.key] = check.detect(entityMoments);
      }

      const momentsForDetail = entityMoments.map(m => ({
        name: m.name, year: m.year, type_id: m.type_id,
        importance: m.importance, quality: computeMomentQuality(m),
        hasImage: momentHasImage.has(m.id),
        accuracy: m.accuracy || "unknown",
      }));

      let qualityPct = 0;
      if (momentsForDetail.length > 0) {
        let totalGatesVal = 0;
        for (const m of momentsForDetail) totalGatesVal += m.quality.gatesPass;
        qualityPct = Math.round((totalGatesVal / (momentsForDetail.length * 5)) * 100);
      }

      let eImageCount = 0;
      let eAccExact = 0;
      let eAccApprox = 0;
      let eAccGeneral = 0;
      for (const m of entityMoments) {
        if (momentHasImage.has(m.id)) eImageCount++;
        if (m.accuracy === "exact") eAccExact++;
        else if (m.accuracy === "approximate") eAccApprox++;
        else if (m.accuracy === "general-area") eAccGeneral++;
      }

      return {
        name: entity.name,
        slug: entity.wikipedia_slug || entity.id,
        entityId,
        entityType,
        storyId,
        momentCount,
        status,
        years: entity.years || "",
        description: entity.description || "",
        qualityPct,
        completeness,
        imageCount: eImageCount,
        accuracyExact: eAccExact,
        accuracyApprox: eAccApprox,
        accuracyGeneral: eAccGeneral,
        moments: momentsForDetail,
      };
    });
  }

  // Entity type stats
  const entityTypeCounts: Record<string, { total: number; complete: number; partial: number; notStarted: number }> = {};
  for (const [type, typeRows] of Object.entries(entityRowsByType)) {
    entityTypeCounts[type] = {
      total: typeRows.length,
      complete: typeRows.filter(r => r.status === "complete").length,
      partial: typeRows.filter(r => r.status === "partial").length,
      notStarted: typeRows.filter(r => r.status === "not_started").length,
    };
  }

  // Generate entity tab HTML
  const entityTabsHtml = entityTypes.map(entityType => {
    const typeRows = entityRowsByType[entityType] || [];
    const preset = COMPLETENESS_PRESETS[entityType] || [];
    const prefix = prefixMap[entityType];
    return generateEntityTab(entityType, typeRows, preset, prefix);
  }).join("\n\n");

  // 9. Generate HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deep Maps \u2014 Ingestion Tracker</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"><\/script>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0d1117; color: #c9d1d9; line-height: 1.5;
    padding: 24px; max-width: 1800px; margin: 0 auto;
  }
  h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 4px; color: #e6edf3; }
  .subtitle { color: #8b949e; font-size: 0.85rem; margin-bottom: 20px; }

  /* Idea Inbox */
  .idea-inbox {
    background: #161b22; border: 2px dashed #30363d; border-radius: 10px;
    padding: 16px 20px; margin-bottom: 20px;
  }
  .idea-inbox-header {
    display: flex; align-items: center; justify-content: space-between;
    cursor: pointer; user-select: none; margin-bottom: 0;
  }
  .idea-inbox-header h2 { font-size: 1.1rem; font-weight: 600; color: #e6edf3; }
  .idea-inbox-toggle { font-size: 0.8rem; color: #484f58; transition: transform 0.2s; }
  .idea-inbox.collapsed .idea-inbox-toggle { transform: rotate(-90deg); }
  .idea-inbox-body { margin-top: 12px; }
  .idea-inbox.collapsed .idea-inbox-body { display: none; }
  .idea-input-row { display: flex; gap: 8px; margin-bottom: 12px; }
  .idea-input {
    flex: 1; background: #0d1117; border: 1px solid #30363d; color: #c9d1d9;
    padding: 8px 12px; border-radius: 6px; font-size: 0.85rem;
  }
  .idea-input:focus { outline: none; border-color: #58a6ff; }
  .btn-add-idea {
    background: #238636; color: #fff; border: none; padding: 8px 16px;
    border-radius: 6px; font-size: 0.85rem; cursor: pointer; font-weight: 500;
  }
  .btn-add-idea:hover { background: #2ea043; }
  .idea-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; }
  .idea-item {
    display: flex; align-items: center; gap: 8px; padding: 6px 8px;
    background: #0d1117; border-radius: 6px; font-size: 0.82rem;
  }
  .idea-item.resolved { opacity: 0.5; }
  .idea-item.resolved .idea-text { text-decoration: line-through; color: #484f58; }
  .idea-text { flex: 1; color: #c9d1d9; }
  .idea-time { color: #484f58; font-size: 0.72rem; white-space: nowrap; }
  .idea-type {
    font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.04em;
    padding: 1px 5px; border-radius: 3px; background: #21262d; color: #8b949e;
  }
  .btn-resolve, .btn-delete-idea {
    background: none; border: 1px solid #30363d; color: #8b949e;
    padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer;
  }
  .btn-resolve:hover { border-color: #3fb950; color: #3fb950; }
  .btn-delete-idea:hover { border-color: #f85149; color: #f85149; }

  /* Idea category badges */
  .idea-cat { font-size: 0.65rem; padding: 1px 5px; border-radius: 3px; }
  .idea-cat-collection { background: #1f6feb26; color: #58a6ff; }
  .idea-cat-datasource { background: #23863626; color: #3fb950; }
  .idea-cat-entity { background: #d2992226; color: #d29922; }
  .idea-cat-connection { background: #a371f726; color: #bc8cff; }
  .idea-cat-pipeline { background: #f8514926; color: #f85149; }
  .idea-cat-general { background: #21262d; color: #8b949e; }

  /* Idea filter pills */
  .idea-filter-btn {
    background: #21262d; border: 1px solid #30363d; color: #8b949e;
    padding: 2px 10px; border-radius: 12px; font-size: 0.72rem; cursor: pointer;
  }
  .idea-filter-btn:hover { border-color: #58a6ff; color: #c9d1d9; }
  .idea-filter-btn.active { background: #388bfd26; border-color: #58a6ff; color: #58a6ff; }

  /* Summary dashboard */
  .summary-dashboard {
    padding: 10px 16px; background: #161b22; border: 1px solid #30363d;
    border-radius: 8px; margin-bottom: 12px; font-size: 0.82rem; color: #8b949e;
  }
  .summary-dashboard strong { color: #e6edf3; font-family: 'SF Mono', 'Fira Code', monospace; }

  /* Tab bar */
  .tab-bar {
    display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 2px solid #21262d;
    padding-bottom: 0;
  }
  .tab-btn {
    background: none; border: none; color: #8b949e; padding: 8px 16px;
    font-size: 0.85rem; cursor: pointer; border-bottom: 2px solid transparent;
    margin-bottom: -2px; transition: color 0.15s;
  }
  .tab-btn:hover { color: #e6edf3; }
  .tab-btn.active { color: #58a6ff; border-bottom-color: #58a6ff; font-weight: 600; }
  .tab-content { display: none; }
  .tab-content.active { display: block; }

  /* Completeness column labels */
  .comp-label { font-size: 9px; color: #8b949e; font-weight: 400; text-transform: none; letter-spacing: 0; }

  /* Stats bar */
  .stats {
    display: flex; gap: 16px; flex-wrap: wrap;
    margin-bottom: 8px; padding: 16px; background: #161b22;
    border: 1px solid #30363d; border-radius: 8px;
  }
  .stat {
    display: flex; flex-direction: column; min-width: 90px;
  }
  .stat-value { font-size: 1.8rem; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; }
  .stat-label { font-size: 0.75rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-complete .stat-value { color: #3fb950; }
  .stat-partial .stat-value { color: #d29922; }
  .stat-not-started .stat-value { color: #8b949e; }
  .stat-total .stat-value { color: #e6edf3; }

  .completeness-stats {
    display: flex; gap: 14px; flex-wrap: wrap;
    margin-bottom: 20px; padding: 10px 16px; background: #161b22;
    border: 1px solid #30363d; border-radius: 0 0 8px 8px; border-top: none;
  }
  .cstat { font-size: 0.78rem; color: #8b949e; }
  .cstat strong { color: #c9d1d9; font-family: 'SF Mono', 'Fira Code', monospace; }

  .progress-bar {
    width: 100%; height: 8px; background: #21262d; border-radius: 4px;
    overflow: hidden; margin-bottom: 4px;
  }
  .progress-bar-inner { display: flex; height: 100%; }
  .pb-complete { background: #3fb950; }
  .pb-partial { background: #d29922; }
  .pb-not-started { background: #30363d; }

  /* Filters */
  .filters {
    display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; align-items: center;
  }
  .filters input, .filters select {
    background: #0d1117; border: 1px solid #30363d; color: #c9d1d9;
    padding: 8px 12px; border-radius: 6px; font-size: 0.85rem;
  }
  .filters input { width: 220px; }
  .filters select { min-width: 130px; }
  .filters input:focus, .filters select:focus { outline: none; border-color: #58a6ff; }
  .filter-count { color: #8b949e; font-size: 0.8rem; margin-left: auto; }
  .filters label { font-size: 0.82rem; color: #8b949e; display: flex; align-items: center; gap: 4px; cursor: pointer; }
  .filters label input[type="checkbox"] { accent-color: #58a6ff; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  thead { position: sticky; top: 0; z-index: 10; }
  th {
    background: #161b22; color: #8b949e; font-weight: 600; text-align: left;
    padding: 10px 6px; border-bottom: 2px solid #30363d;
    text-transform: uppercase; font-size: 0.68rem; letter-spacing: 0.05em;
    cursor: pointer; user-select: none; white-space: nowrap;
  }
  th:hover { color: #e6edf3; }
  th.sorted-asc::after { content: ' \\25B2'; }
  th.sorted-desc::after { content: ' \\25BC'; }
  td { padding: 7px 6px; border-bottom: 1px solid #21262d; vertical-align: top; }
  tr.data-row { cursor: pointer; }
  tr.data-row:hover { background: #161b22; }
  tr[data-status="partial"] td:first-child { border-left: 3px solid #d29922; }
  tr[data-status="not_started"] { opacity: 0.7; }

  .rank { text-align: center; width: 44px; font-family: 'SF Mono', 'Fira Code', monospace; color: #8b949e; }
  .name { font-weight: 500; color: #e6edf3; min-width: 140px; }
  .name .years { display: block; font-size: 0.72rem; color: #8b949e; font-weight: 400; }
  .score { text-align: center; font-family: 'SF Mono', 'Fira Code', monospace; width: 50px; }
  .cat { color: #8b949e; }
  .occ { color: #8b949e; }
  .status { white-space: nowrap; }
  .moments { text-align: center; font-family: 'SF Mono', 'Fira Code', monospace; font-weight: 600; width: 50px; }
  .completeness { text-align: center; width: 36px; }
  .check-yes { color: #3fb950; font-weight: 700; }
  .check-no { color: #484f58; }
  .notes-count { text-align: center; width: 44px; }
  .note-badge {
    display: inline-block; background: #58a6ff; color: #0d1117; font-size: 0.68rem;
    font-weight: 700; padding: 0 6px; border-radius: 10px; min-width: 18px; text-align: center;
  }
  .note-badge.hidden { display: none; }
  .dim { color: #484f58; }

  /* Quality badges */
  .quality-cell { text-align: center; width: 50px; }
  .quality-high { color: #3fb950; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.78rem; }
  .quality-mid { color: #d29922; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.78rem; }
  .quality-low { color: #f85149; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.78rem; }
  .quality-na { color: #484f58; }

  /* Quality gate icons in moments */
  .moment-gates { display: flex; gap: 2px; flex-shrink: 0; font-size: 0.68rem; }
  .gate-pass { color: #3fb950; }
  .gate-fail { color: #f85149; }

  /* Audit stats */
  .audit-stats {
    display: flex; gap: 14px; flex-wrap: wrap;
    padding: 10px 16px; background: #161b22;
    border: 1px solid #30363d; border-radius: 0 0 8px 8px; border-top: none;
    margin-bottom: 20px;
  }
  .astat { font-size: 0.78rem; color: #8b949e; }
  .astat strong { font-family: 'SF Mono', 'Fira Code', monospace; }
  .astat .aq-high { color: #3fb950; }
  .astat .aq-mid { color: #d29922; }
  .astat .aq-low { color: #f85149; }

  /* Audit gates in detail */
  .audit-gates { display: flex; flex-direction: column; gap: 6px; }
  .audit-gate {
    display: flex; align-items: center; gap: 8px; font-size: 0.82rem;
    padding: 6px 8px; background: #161b22; border-radius: 4px;
  }
  .audit-gate-icon { font-size: 0.9rem; }
  .audit-gate-label { flex: 1; color: #c9d1d9; }
  .audit-gate.done .audit-gate-icon { color: #3fb950; }
  .audit-gate.done .audit-gate-label { color: #8b949e; }
  .btn-audit {
    background: none; border: 1px solid #30363d; color: #8b949e;
    padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer;
  }
  .btn-audit:hover { border-color: #3fb950; color: #3fb950; }
  .audit-gate.done .btn-audit { display: none; }

  /* Detail row */
  .detail-row { background: #0d1117; }
  .detail-row.hidden { display: none; }
  .detail-panel { padding: 12px 8px; }
  .detail-grid { display: grid; grid-template-columns: 1fr 200px 1fr; gap: 20px; }
  .detail-moments h4, .detail-notes h4, .detail-audit h4 {
    font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em;
    color: #8b949e; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #21262d;
  }
  .note-total { font-weight: 400; color: #484f58; }
  .moments-list { display: flex; flex-direction: column; gap: 3px; max-height: 300px; overflow-y: auto; }
  .moment-item {
    display: flex; align-items: baseline; gap: 8px; font-size: 0.8rem;
    padding: 3px 6px; border-radius: 4px; background: #161b22;
  }
  .moment-year {
    font-family: 'SF Mono', 'Fira Code', monospace; color: #8b949e;
    font-size: 0.72rem; min-width: 48px; text-align: right; flex-shrink: 0;
  }
  .moment-type {
    font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.04em;
    padding: 1px 5px; border-radius: 3px; background: #21262d; color: #6e7681; flex-shrink: 0;
  }
  .moment-name-detail { color: #c9d1d9; flex: 1; }
  .moment-importance-major { border-left: 2px solid #3fb950; }
  .moment-img { font-size: 0.72rem; flex-shrink: 0; }
  .acc-exact { color: #3fb950; font-size: 0.78rem; flex-shrink: 0; font-weight: 700; }
  .acc-approx { color: #d29922; font-size: 0.78rem; flex-shrink: 0; }
  .acc-general { color: #f85149; font-size: 0.78rem; flex-shrink: 0; }
  .no-moments-msg { color: #484f58; font-style: italic; font-size: 0.82rem; }

  .notes-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; max-height: 250px; overflow-y: auto; }
  .note-item {
    display: flex; align-items: center; gap: 6px; font-size: 0.8rem;
    padding: 4px 6px; background: #161b22; border-radius: 4px;
  }
  .note-item.resolved .note-text-content { text-decoration: line-through; color: #484f58; }
  .note-text-content { flex: 1; color: #c9d1d9; }
  .note-time { color: #484f58; font-size: 0.68rem; white-space: nowrap; }
  .btn-resolve-note {
    background: none; border: 1px solid #30363d; color: #8b949e;
    padding: 1px 6px; border-radius: 3px; font-size: 0.68rem; cursor: pointer;
  }
  .btn-resolve-note:hover { border-color: #3fb950; color: #3fb950; }
  .note-input-row { display: flex; gap: 6px; }
  .note-input {
    flex: 1; background: #0d1117; border: 1px solid #30363d; color: #c9d1d9;
    padding: 6px 10px; border-radius: 6px; font-size: 0.82rem;
  }
  .note-input:focus { outline: none; border-color: #58a6ff; }
  .btn-add-note {
    background: #238636; color: #fff; border: none; padding: 6px 12px;
    border-radius: 6px; font-size: 0.82rem; cursor: pointer; font-weight: 500;
  }
  .btn-add-note:hover { background: #2ea043; }

  @media (max-width: 1024px) {
    .completeness, th.comp-col { display: none; }
    .detail-grid { grid-template-columns: 1fr; }
    .detail-audit { order: 2; }
    .detail-notes { order: 3; }
  }
  @media (max-width: 768px) {
    body { padding: 12px; font-size: 0.9rem; }
    table { font-size: 0.88rem; }
    .cat, .occ, th.hide-mobile { display: none; }
    .filters { gap: 6px; }
    .filters input { width: 100%; }
    .stats { gap: 10px; padding: 12px; }
    .stat-value { font-size: 1.4rem; }
    .idea-inbox { padding: 12px; }
  }
</style>
</head>
<body>
<h1>Deep Maps \u2014 Ingestion Tracker</h1>
<p class="subtitle">Generated ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC &middot; ${total} people from top-people.json</p>

<!-- Idea Inbox -->
<div class="idea-inbox" id="ideaInbox">
  <div class="idea-inbox-header" onclick="document.getElementById('ideaInbox').classList.toggle('collapsed')">
    <h2>&#x1F4A1; Idea Inbox <span id="ideaCount" style="color:#484f58;font-size:0.85rem;font-weight:400;"></span></h2>
    <span class="idea-inbox-toggle">&#x25BC;</span>
  </div>
  <div class="idea-inbox-body">
    <div class="idea-input-row">
      <input type="text" class="idea-input" id="ideaInput" placeholder="Brain dump an idea, todo, or note..." autocomplete="off">
      <select id="ideaType" style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:6px 8px;border-radius:6px;font-size:0.82rem;">
        <option value="idea">Idea</option>
        <option value="todo">Todo</option>
        <option value="note">Note</option>
      </select>
      <select id="ideaCategory" style="background:#0d1117;border:1px solid #30363d;color:#c9d1d9;padding:6px 8px;border-radius:6px;font-size:0.82rem;">
        <option value="general">General</option>
        <option value="collection">Collection</option>
        <option value="datasource">Data Source</option>
        <option value="entity">Entity</option>
        <option value="connection">Connection</option>
        <option value="pipeline">Pipeline</option>
      </select>
      <button class="btn-add-idea" onclick="addIdea()">Add</button>
    </div>
    <div class="idea-filters" id="ideaFilters" style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;">
      <button class="idea-filter-btn active" data-cat="" onclick="filterIdeas('')">All</button>
      <button class="idea-filter-btn" data-cat="collection" onclick="filterIdeas('collection')">Collection</button>
      <button class="idea-filter-btn" data-cat="datasource" onclick="filterIdeas('datasource')">Data Source</button>
      <button class="idea-filter-btn" data-cat="entity" onclick="filterIdeas('entity')">Entity</button>
      <button class="idea-filter-btn" data-cat="connection" onclick="filterIdeas('connection')">Connection</button>
      <button class="idea-filter-btn" data-cat="pipeline" onclick="filterIdeas('pipeline')">Pipeline</button>
    </div>
    <div class="idea-list" id="ideaList"></div>
  </div>
</div>

<!-- Summary Dashboard -->
<div class="summary-dashboard">
  Total: <strong>${entities.length}</strong> entities &middot;
  <span>People: <strong>${total}</strong></span> &middot;
  <span>Places: <strong>${entityTypeCounts.place?.total || 0}</strong></span> &middot;
  <span>Orgs: <strong>${entityTypeCounts.organization?.total || 0}</strong></span> &middot;
  <span>Works: <strong>${entityTypeCounts.work?.total || 0}</strong></span> &middot;
  <span>Concepts: <strong>${entityTypeCounts.concept?.total || 0}</strong></span>
</div>

<!-- Tab Bar -->
<div class="tab-bar">
  <button class="tab-btn active" data-tab="people" onclick="switchTab('people')">People (${total})</button>
  <button class="tab-btn" data-tab="place" onclick="switchTab('place')">Places (${entityTypeCounts.place?.total || 0})</button>
  <button class="tab-btn" data-tab="organization" onclick="switchTab('organization')">Orgs (${entityTypeCounts.organization?.total || 0})</button>
  <button class="tab-btn" data-tab="work" onclick="switchTab('work')">Works (${entityTypeCounts.work?.total || 0})</button>
  <button class="tab-btn" data-tab="concept" onclick="switchTab('concept')">Concepts (${entityTypeCounts.concept?.total || 0})</button>
</div>

<!-- People Tab -->
<div class="tab-content active" id="tab-people">
<div class="stats">
  <div class="stat stat-total"><span class="stat-value">${total}</span><span class="stat-label">Total</span></div>
  <div class="stat stat-complete"><span class="stat-value">${complete}</span><span class="stat-label">Complete (&#x2265;4)</span></div>
  <div class="stat stat-partial"><span class="stat-value">${partial}</span><span class="stat-label">Partial</span></div>
  <div class="stat stat-not-started"><span class="stat-value">${notStarted}</span><span class="stat-label">Not Started</span></div>
</div>
<div class="completeness-stats">
  <span class="cstat">&#x1F423; Birth: <strong>${withBirth}/${total}</strong></span>
  <span class="cstat">&#x1F480; Death: <strong>${withDeath}/${total}</strong></span>
  <span class="cstat">&#x26B0;&#xFE0F; Burial: <strong>${withBurial}/${total}</strong></span>
  <span class="cstat">&#x1F393; Education: <strong>${withEducation}/${total}</strong></span>
  <span class="cstat">&#x2B50; Major Work: <strong>${withMajorWork}/${total}</strong></span>
</div>
<div class="audit-stats">
  <span class="astat">&#x1F50D; Audit: <strong class="aq-high">${qualityHigh}</strong> &#x2265;90% &middot; <strong class="aq-mid">${qualityMid}</strong> 70-89% &middot; <strong class="aq-low">${qualityLow}</strong> &lt;70%</span>
  <span class="astat">Gate fails: <strong>${totalGateFailures.g1}</strong> verb-name &middot; <strong>${totalGateFailures.g2}</strong> description &middot; <strong>${totalGateFailures.g3}</strong> coords &middot; <strong>${totalGateFailures.g4}</strong> date &middot; <strong>${totalGateFailures.g5}</strong> notability</span>
</div>
<div class="audit-stats">
  <span class="astat">&#x1F4F7; Images: <strong>${totalImages}/${totalMoments}</strong> moments have images</span>
  <span class="astat">&#x1F4CD; Accuracy: <strong class="aq-high">${totalExact}</strong> exact &middot; <strong class="aq-mid">${totalApprox}</strong> approximate &middot; <strong class="aq-low">${totalGeneral}</strong> general-area</span>
</div>

<div class="progress-bar"><div class="progress-bar-inner">
  <div class="pb-complete" style="width:${((complete / total) * 100).toFixed(1)}%"></div>
  <div class="pb-partial" style="width:${((partial / total) * 100).toFixed(1)}%"></div>
  <div class="pb-not-started" style="width:${((notStarted / total) * 100).toFixed(1)}%"></div>
</div></div>

<div class="filters">
  <input type="text" id="search" placeholder="Search by name..." autocomplete="off">
  <select id="statusFilter">
    <option value="">All statuses</option>
    <option value="complete">&#x2705; Complete</option>
    <option value="partial">&#x1F7E1; Partial</option>
    <option value="not_started">&#x2B1C; Not Started</option>
  </select>
  <select id="categoryFilter">
    <option value="">All categories</option>
    ${categoryOptions}
  </select>
  <select id="missingFilter">
    <option value="">Missing: any</option>
    <option value="birth">Missing: Birth</option>
    <option value="death">Missing: Death</option>
    <option value="burial">Missing: Burial</option>
    <option value="education">Missing: Education</option>
    <option value="major">Missing: Major Work</option>
  </select>
  <select id="qualityFilter">
    <option value="">Quality: any</option>
    <option value="low">Quality &lt; 70%</option>
    <option value="mid">Quality 70-89%</option>
    <option value="high">Quality &#x2265; 90%</option>
  </select>
  <label><input type="checkbox" id="hasNotesFilter"> Has Notes</label>
  <span class="filter-count" id="filterCount">${total} shown</span>
</div>

<table>
<thead>
<tr>
  <th data-col="rank" data-type="num" data-tab="people" class="sorted-asc">Rank</th>
  <th data-col="name" data-type="str" data-tab="people">Name</th>
  <th data-col="score" data-type="num" data-tab="people">Score</th>
  <th data-col="cat" data-type="str" data-tab="people" class="hide-mobile">Category</th>
  <th data-col="occ" data-type="str" data-tab="people" class="hide-mobile">Occupation</th>
  <th data-col="status" data-type="str" data-tab="people">Status</th>
  <th data-col="moments" data-type="num" data-tab="people">Moments</th>
  <th data-col="quality" data-type="num" data-tab="people" title="Quality audit score">Quality</th>
  <th data-col="birth" data-type="num" class="comp-col" data-tab="people" title="Birth moment">&#x1F423;<br><span class="comp-label">Birth</span></th>
  <th data-col="death" data-type="num" class="comp-col" data-tab="people" title="Death moment">&#x1F480;<br><span class="comp-label">Death</span></th>
  <th data-col="burial" data-type="num" class="comp-col" data-tab="people" title="Burial moment">&#x26B0;&#xFE0F;<br><span class="comp-label">Burial</span></th>
  <th data-col="education" data-type="num" class="comp-col" data-tab="people" title="Education moment">&#x1F393;<br><span class="comp-label">Education</span></th>
  <th data-col="major" data-type="num" class="comp-col" data-tab="people" title="Major work">&#x2B50;<br><span class="comp-label">Major</span></th>
  <th class="comp-col" data-tab="people">Notes</th>
</tr>
</thead>
<tbody id="tbody">
${tableRows}
</tbody>
</table>
</div>

<!-- Entity Type Tabs -->
${entityTabsHtml}

<script>
(function() {
  var SUPABASE_URL = 'https://fhxyaoaaeztrycfoppeu.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoeHlhb2FhZXp0cnljZm9wcGV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzYwNDIsImV4cCI6MjA4OTIxMjA0Mn0.mdFYWteB8Tdf3443otxSzOwCvwUvFNFFoaOLR3XY3fw';

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // State
  var allNotes = [];       // all notes from tracker_notes
  var notesBySlug = {};    // slug -> [notes]
  var globalIdeas = [];    // notes where entity_slug is null
  var slugHasNotes = {};   // slug -> boolean (for filtering)
  var expandedIdx = null;  // currently expanded row idx (string)
  var ideaCategoryFilter = ''; // active idea category filter

  // ----- Tab switching -----
  window.switchTab = function(tab) {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(function(div) {
      div.classList.toggle('active', div.id === 'tab-' + tab);
    });
    location.hash = tab;
  };

  // On load, check hash
  var initialTab = location.hash.replace('#', '') || 'people';
  if (['people', 'place', 'organization', 'work', 'concept'].indexOf(initialTab) >= 0) {
    switchTab(initialTab);
  }

  // ----- Supabase fetch on load -----
  async function loadNotes() {
    var { data, error } = await sb.from('tracker_notes').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Failed to load notes:', error); return; }
    allNotes = data || [];
    notesBySlug = {};
    globalIdeas = [];
    slugHasNotes = {};
    for (var n of allNotes) {
      if (!n.entity_slug) {
        globalIdeas.push(n);
      } else {
        if (!notesBySlug[n.entity_slug]) notesBySlug[n.entity_slug] = [];
        notesBySlug[n.entity_slug].push(n);
        slugHasNotes[n.entity_slug] = true;
      }
    }
    renderIdeas();
    updateNoteBadges();
    if (expandedIdx !== null) renderPersonNotes(expandedIdx);
  }

  // ----- Idea Inbox -----
  function renderIdeas() {
    var list = document.getElementById('ideaList');
    var countEl = document.getElementById('ideaCount');
    var filtered = globalIdeas;
    if (ideaCategoryFilter) {
      filtered = globalIdeas.filter(function(idea) {
        return (idea.category || 'general') === ideaCategoryFilter;
      });
    }
    countEl.textContent = '(' + filtered.length + (ideaCategoryFilter ? ' filtered' : '') + ')';
    if (filtered.length === 0) {
      list.innerHTML = '<div style="color:#484f58;font-style:italic;font-size:0.82rem;padding:4px;">No ideas yet. Add one above.</div>';
      return;
    }
    list.innerHTML = filtered.map(function(idea) {
      var cls = idea.resolved ? 'idea-item resolved' : 'idea-item';
      var ts = new Date(idea.created_at).toLocaleDateString();
      var cat = idea.category || 'general';
      var catBadge = '<span class="idea-cat idea-cat-' + esc(cat) + '">' + esc(cat) + '</span>';
      return '<div class="' + cls + '">' +
        '<span class="idea-type">' + esc(idea.note_type) + '</span>' +
        catBadge +
        '<span class="idea-text">' + esc(idea.text) + '</span>' +
        '<span class="idea-time">' + ts + '</span>' +
        (idea.resolved
          ? '<span style="color:#3fb950;font-size:0.72rem;">resolved</span>'
          : '<button class="btn-resolve" onclick="resolveIdea(\\'' + idea.id + '\\')">resolve</button>') +
      '</div>';
    }).join('');
  }

  window.filterIdeas = function(cat) {
    ideaCategoryFilter = cat;
    document.querySelectorAll('.idea-filter-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
    renderIdeas();
  };

  window.addIdea = async function() {
    var input = document.getElementById('ideaInput');
    var typeSelect = document.getElementById('ideaType');
    var catSelect = document.getElementById('ideaCategory');
    var text = input.value.trim();
    if (!text) return;
    var noteType = typeSelect.value;
    var category = catSelect.value;
    input.value = '';

    // Optimistic
    var tempId = 'temp-' + Date.now();
    var tempNote = { id: tempId, entity_slug: null, note_type: noteType, category: category, text: text, resolved: false, created_at: new Date().toISOString() };
    globalIdeas.unshift(tempNote);
    renderIdeas();

    var { data, error } = await sb.from('tracker_notes').insert({ entity_slug: null, note_type: noteType, category: category, text: text }).select();
    if (error) { console.error('Failed to add idea:', error); return; }
    // Replace temp
    var idx = globalIdeas.findIndex(function(n) { return n.id === tempId; });
    if (idx >= 0 && data && data[0]) globalIdeas[idx] = data[0];
    renderIdeas();
  };

  window.resolveIdea = async function(id) {
    var note = globalIdeas.find(function(n) { return n.id === id; });
    if (note) { note.resolved = true; renderIdeas(); }
    await sb.from('tracker_notes').update({ resolved: true }).eq('id', id);
  };

  // ----- Note badges -----
  function updateNoteBadges() {
    document.querySelectorAll('.data-row').forEach(function(row) {
      var slug = row.dataset.slug;
      var idx = row.dataset.idx;
      var notes = notesBySlug[slug] || [];
      var badge = document.getElementById('notes-count-' + idx);
      if (badge) {
        var span = badge.querySelector('.note-badge');
        if (notes.length > 0) {
          span.textContent = notes.length;
          span.classList.remove('hidden');
        } else {
          span.classList.add('hidden');
        }
      }
    });
  }

  // ----- Row expand/collapse -----
  document.querySelectorAll('.data-row').forEach(function(row) {
    row.addEventListener('click', function() {
      toggleRow(row.dataset.idx);
    });
  });

  function showDetail(el) { el.classList.remove('hidden'); el.style.display = ''; }
  function hideDetail(el) { el.classList.add('hidden'); el.style.display = 'none'; }

  function toggleRow(idx) {
    var detail = document.getElementById('detail-' + idx);
    if (expandedIdx === idx) {
      hideDetail(detail);
      expandedIdx = null;
      return;
    }
    // Collapse previous
    if (expandedIdx !== null) {
      var prev = document.getElementById('detail-' + expandedIdx);
      if (prev) hideDetail(prev);
    }
    expandedIdx = idx;
    showDetail(detail);
    renderPersonMoments(idx);
    renderPersonNotes(idx);
    updateAuditGates(idx);
  }

  function renderPersonMoments(idx) {
    var row = document.querySelector('.data-row[data-idx="' + idx + '"]');
    var momentsJson = row.dataset.momentsJson;
    var moments = [];
    try { moments = JSON.parse(momentsJson); } catch(e) {}
    var list = document.getElementById('moments-list-' + idx);
    if (moments.length === 0) {
      list.innerHTML = '<div class="no-moments-msg">No moments linked to this entity.</div>';
      return;
    }
    moments.sort(function(a, b) { return (a.year || 0) - (b.year || 0); });
    list.innerHTML = moments.map(function(m) {
      var yearStr = m.year ? (m.year < 0 ? Math.abs(m.year) + ' BCE' : String(m.year)) : '?';
      var majorCls = m.importance === 'major' ? ' moment-importance-major' : '';
      var q = m.quality || {};
      var gateIcons = '<span class="moment-gates">' +
        '<span class="' + (q.g1_verbName ? 'gate-pass' : 'gate-fail') + '" title="Verb-first name">' + (q.g1_verbName ? '\\u2713' : '\\u2717') + '</span>' +
        '<span class="' + (q.g2_description ? 'gate-pass' : 'gate-fail') + '" title="Description">' + (q.g2_description ? '\\u2713' : '\\u2717') + '</span>' +
        '<span class="' + (q.g3_coordinates ? 'gate-pass' : 'gate-fail') + '" title="Coordinates">' + (q.g3_coordinates ? '\\u2713' : '\\u2717') + '</span>' +
        '<span class="' + (q.g4_date ? 'gate-pass' : 'gate-fail') + '" title="Date">' + (q.g4_date ? '\\u2713' : '\\u2717') + '</span>' +
        '<span class="' + (q.g5_notability ? 'gate-pass' : 'gate-fail') + '" title="Notability">' + (q.g5_notability ? '\\u2713' : '\\u2717') + '</span>' +
      '</span>';
      var accCls = m.accuracy === 'exact' ? 'acc-exact' : m.accuracy === 'approximate' ? 'acc-approx' : 'acc-general';
      var accLabel = m.accuracy === 'exact' ? '\\u2316' : m.accuracy === 'approximate' ? '\\u25CE' : '\\u25CB';
      var imgIcon = m.hasImage ? '<span class="moment-img" title="Has image">\\u{1F4F7}</span>' : '';
      return '<div class="moment-item' + majorCls + '">' +
        '<span class="moment-year">' + yearStr + '</span>' +
        '<span class="moment-type">' + esc(m.type_id) + '</span>' +
        '<span class="moment-name-detail">' + esc(m.name) + '</span>' +
        imgIcon +
        '<span class="' + accCls + '" title="' + (m.accuracy || 'unknown') + '">' + accLabel + '</span>' +
        gateIcons +
      '</div>';
    }).join('');
  }

  function renderPersonNotes(idx) {
    var row = document.querySelector('.data-row[data-idx="' + idx + '"]');
    var slug = row.dataset.slug;
    var notes = notesBySlug[slug] || [];
    var list = document.getElementById('notes-list-' + idx);
    var total = document.getElementById('note-total-' + idx);
    total.textContent = notes.length > 0 ? '(' + notes.length + ')' : '';
    if (notes.length === 0) {
      list.innerHTML = '<div style="color:#484f58;font-style:italic;font-size:0.8rem;">No notes yet.</div>';
      return;
    }
    list.innerHTML = notes.map(function(n) {
      var cls = n.resolved ? 'note-item resolved' : 'note-item';
      var ts = new Date(n.created_at).toLocaleDateString();
      return '<div class="' + cls + '">' +
        '<span class="note-text-content">' + esc(n.text) + '</span>' +
        '<span class="note-time">' + ts + '</span>' +
        (n.resolved ? '' : '<button class="btn-resolve-note" onclick="event.stopPropagation(); resolveNote(\\'' + n.id + '\\', \\'' + idx + '\\')">resolve</button>') +
      '</div>';
    }).join('');
  }

  window.addNote = async function(idx) {
    var input = document.getElementById('note-input-' + idx);
    var text = input.value.trim();
    if (!text) return;
    var row = document.querySelector('.data-row[data-idx="' + idx + '"]');
    var slug = row.dataset.slug;
    input.value = '';

    var tempId = 'temp-' + Date.now();
    var tempNote = { id: tempId, entity_slug: slug, note_type: 'note', text: text, resolved: false, created_at: new Date().toISOString() };
    if (!notesBySlug[slug]) notesBySlug[slug] = [];
    notesBySlug[slug].unshift(tempNote);
    slugHasNotes[slug] = true;
    renderPersonNotes(idx);
    updateNoteBadges();

    var { data, error } = await sb.from('tracker_notes').insert({ entity_slug: slug, note_type: 'note', text: text }).select();
    if (error) { console.error('Failed to add note:', error); return; }
    var tempIdx = notesBySlug[slug].findIndex(function(n) { return n.id === tempId; });
    if (tempIdx >= 0 && data && data[0]) notesBySlug[slug][tempIdx] = data[0];
    renderPersonNotes(idx);
    updateNoteBadges();
  };

  window.resolveNote = async function(id, idx) {
    var row = document.querySelector('.data-row[data-idx="' + idx + '"]');
    var slug = row.dataset.slug;
    var notes = notesBySlug[slug] || [];
    var note = notes.find(function(n) { return n.id === id; });
    if (note) { note.resolved = true; renderPersonNotes(idx); }
    await sb.from('tracker_notes').update({ resolved: true }).eq('id', id);
  };

  // ----- Escape helper -----
  function esc(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ----- Filtering (people tab) -----
  var search = document.getElementById('search');
  var statusFilter = document.getElementById('statusFilter');
  var categoryFilter = document.getElementById('categoryFilter');
  var missingFilter = document.getElementById('missingFilter');
  var qualityFilter = document.getElementById('qualityFilter');
  var hasNotesFilter = document.getElementById('hasNotesFilter');
  var filterCount = document.getElementById('filterCount');
  var peopleDataRows = Array.from(document.getElementById('tbody').querySelectorAll('tr.data-row'));

  function applyFilters() {
    var q = search.value.toLowerCase();
    var s = statusFilter.value;
    var c = categoryFilter.value;
    var m = missingFilter.value;
    var qf = qualityFilter.value;
    var hn = hasNotesFilter.checked;
    var visible = 0;
    for (var i = 0; i < peopleDataRows.length; i++) {
      var row = peopleDataRows[i];
      var matchName = !q || row.dataset.name.includes(q);
      var matchStatus = !s || row.dataset.status === s;
      var matchCat = !c || row.dataset.category === c;

      var matchMissing = true;
      if (m === 'birth') matchMissing = row.dataset.birth === '0';
      else if (m === 'death') matchMissing = row.dataset.death === '0';
      else if (m === 'burial') matchMissing = row.dataset.burial === '0';
      else if (m === 'education') matchMissing = row.dataset.education === '0';
      else if (m === 'major') matchMissing = row.dataset.major === '0';

      var matchQuality = true;
      if (qf) {
        var qVal = parseInt(row.dataset.quality);
        if (qVal < 0) matchQuality = false;
        else if (qf === 'low') matchQuality = qVal < 70;
        else if (qf === 'mid') matchQuality = qVal >= 70 && qVal < 90;
        else if (qf === 'high') matchQuality = qVal >= 90;
      }

      var matchNotes = !hn || slugHasNotes[row.dataset.slug];

      var show = matchName && matchStatus && matchCat && matchMissing && matchQuality && matchNotes;
      row.style.display = show ? '' : 'none';
      var dataIdx = row.dataset.idx;
      var detailEl = document.getElementById('detail-' + dataIdx);
      if (detailEl) {
        detailEl.style.display = show && expandedIdx === dataIdx ? '' : 'none';
        if (!show && expandedIdx === dataIdx) {
          expandedIdx = null;
        }
      }
      if (show) visible++;
    }
    filterCount.textContent = visible + ' shown';
  }

  search.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);
  missingFilter.addEventListener('change', applyFilters);
  qualityFilter.addEventListener('change', applyFilters);
  hasNotesFilter.addEventListener('change', applyFilters);

  // ----- Filtering (entity tabs) -----
  document.querySelectorAll('.tab-search').forEach(function(input) {
    input.addEventListener('input', function() { applyEntityFilters(input.dataset.tab); });
  });
  document.querySelectorAll('.tab-status-filter').forEach(function(sel) {
    sel.addEventListener('change', function() { applyEntityFilters(sel.dataset.tab); });
  });
  document.querySelectorAll('.tab-missing-filter').forEach(function(sel) {
    sel.addEventListener('change', function() { applyEntityFilters(sel.dataset.tab); });
  });
  document.querySelectorAll('.tab-quality-filter').forEach(function(sel) {
    sel.addEventListener('change', function() { applyEntityFilters(sel.dataset.tab); });
  });
  document.querySelectorAll('.tab-notes-filter').forEach(function(cb) {
    cb.addEventListener('change', function() { applyEntityFilters(cb.dataset.tab); });
  });

  function applyEntityFilters(tab) {
    var searchEl = document.querySelector('.tab-search[data-tab="' + tab + '"]');
    var statusEl = document.querySelector('.tab-status-filter[data-tab="' + tab + '"]');
    var missingEl = document.querySelector('.tab-missing-filter[data-tab="' + tab + '"]');
    var qualityEl = document.querySelector('.tab-quality-filter[data-tab="' + tab + '"]');
    var notesEl = document.querySelector('.tab-notes-filter[data-tab="' + tab + '"]');
    var countEl = document.querySelector('.tab-filter-count[data-tab="' + tab + '"]');

    var q = searchEl ? searchEl.value.toLowerCase() : '';
    var s = statusEl ? statusEl.value : '';
    var m = missingEl ? missingEl.value : '';
    var qf = qualityEl ? qualityEl.value : '';
    var hn = notesEl ? notesEl.checked : false;
    var visible = 0;

    var tbody = document.querySelector('.entity-tbody[data-tab="' + tab + '"]');
    if (!tbody) return;
    var rows = Array.from(tbody.querySelectorAll('tr.data-row'));

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var matchName = !q || row.dataset.name.includes(q);
      var matchStatus = !s || row.dataset.status === s;

      var matchMissing = true;
      if (m) matchMissing = row.dataset[m] === '0';

      var matchQuality = true;
      if (qf) {
        var qVal = parseInt(row.dataset.quality);
        if (qVal < 0) matchQuality = false;
        else if (qf === 'low') matchQuality = qVal < 70;
        else if (qf === 'mid') matchQuality = qVal >= 70 && qVal < 90;
        else if (qf === 'high') matchQuality = qVal >= 90;
      }

      var matchNotes = !hn || slugHasNotes[row.dataset.slug];

      var show = matchName && matchStatus && matchMissing && matchQuality && matchNotes;
      row.style.display = show ? '' : 'none';
      var dataIdx = row.dataset.idx;
      var detailEl = document.getElementById('detail-' + dataIdx);
      if (detailEl) {
        detailEl.style.display = show && expandedIdx === dataIdx ? '' : 'none';
        if (!show && expandedIdx === dataIdx) {
          expandedIdx = null;
        }
      }
      if (show) visible++;
    }
    if (countEl) countEl.textContent = visible + ' shown';
  }

  // ----- Column sorting (people tab) -----
  var peopleHeaders = document.querySelectorAll('th[data-col][data-tab="people"]');
  var currentSort = { col: 'rank', dir: 'asc' };
  var colIndexMap = { rank: 0, name: 1, score: 2, cat: 3, occ: 4, status: 5, moments: 6, quality: 7, birth: 8, death: 9, burial: 10, education: 11, major: 12 };
  var tbody = document.getElementById('tbody');
  var detailRows = Array.from(tbody.querySelectorAll('tr.detail-row'));

  peopleHeaders.forEach(function(th) {
    th.addEventListener('click', function() {
      var col = th.dataset.col;
      var type = th.dataset.type;
      var dir = (currentSort.col === col && currentSort.dir === 'asc') ? 'desc' : 'asc';
      currentSort = { col: col, dir: dir };

      peopleHeaders.forEach(function(h) { h.classList.remove('sorted-asc', 'sorted-desc'); });
      th.classList.add('sorted-' + dir);

      var pairs = [];
      for (var i = 0; i < peopleDataRows.length; i++) {
        pairs.push({ data: peopleDataRows[i], detail: detailRows[i] });
      }

      pairs.sort(function(a, b) {
        var aVal, bVal;
        if (type === 'num') {
          if (['birth','death','burial','education','major','quality'].indexOf(col) >= 0) {
            aVal = parseInt(a.data.dataset[col]) || 0;
            bVal = parseInt(b.data.dataset[col]) || 0;
          } else {
            var aCell = a.data.children[colIndexMap[col]];
            var bCell = b.data.children[colIndexMap[col]];
            aVal = parseFloat(aCell.textContent) || 0;
            bVal = parseFloat(bCell.textContent) || 0;
          }
        } else {
          var aCell2 = a.data.children[colIndexMap[col]];
          var bCell2 = b.data.children[colIndexMap[col]];
          aVal = aCell2.textContent.toLowerCase();
          bVal = bCell2.textContent.toLowerCase();
        }
        if (aVal < bVal) return dir === 'asc' ? -1 : 1;
        if (aVal > bVal) return dir === 'asc' ? 1 : -1;
        return 0;
      });

      for (var j = 0; j < pairs.length; j++) {
        tbody.appendChild(pairs[j].data);
        tbody.appendChild(pairs[j].detail);
      }

      peopleDataRows = pairs.map(function(p) { return p.data; });
      detailRows = pairs.map(function(p) { return p.detail; });
    });
  });

  // ----- Enter key for inputs -----
  document.getElementById('ideaInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') window.addIdea();
  });

  // Delegate enter for note inputs
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.classList.contains('note-input')) {
      var noteIdx = e.target.id.replace('note-input-', '');
      if (noteIdx) window.addNote(noteIdx);
    }
  });

  // Stop click propagation on note inputs, buttons, and audit buttons
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('note-input') || e.target.classList.contains('btn-add-note') || e.target.classList.contains('btn-audit')) {
      e.stopPropagation();
    }
  }, true);

  // ----- Audit gate display -----
  function updateAuditGates(idx) {
    var row = document.querySelector('.data-row[data-idx="' + idx + '"]');
    if (!row) return;
    var slug = row.dataset.slug;
    var notes = notesBySlug[slug] || [];
    var hasTone = notes.some(function(n) { return n.note_type === 'audit-tone'; });
    var hasSensitivity = notes.some(function(n) { return n.note_type === 'audit-sensitivity'; });

    var toneGate = document.getElementById('audit-tone-' + idx);
    var sensitivityGate = document.getElementById('audit-sensitivity-' + idx);
    if (toneGate) {
      if (hasTone) {
        toneGate.classList.add('done');
        toneGate.querySelector('.audit-gate-icon').innerHTML = '\\u2705';
      } else {
        toneGate.classList.remove('done');
        toneGate.querySelector('.audit-gate-icon').innerHTML = '\\u2B1C';
      }
    }
    if (sensitivityGate) {
      if (hasSensitivity) {
        sensitivityGate.classList.add('done');
        sensitivityGate.querySelector('.audit-gate-icon').innerHTML = '\\u2705';
      } else {
        sensitivityGate.classList.remove('done');
        sensitivityGate.querySelector('.audit-gate-icon').innerHTML = '\\u2B1C';
      }
    }
  }

  window.markAuditGate = async function(idx, gateType) {
    var row = document.querySelector('.data-row[data-idx="' + idx + '"]');
    var slug = row.dataset.slug;
    var text = gateType === 'audit-tone' ? 'Encyclopedic tone reviewed' : 'Cultural sensitivity reviewed';

    // Optimistic
    var tempNote = { id: 'temp-' + Date.now(), entity_slug: slug, note_type: gateType, text: text, resolved: false, created_at: new Date().toISOString() };
    if (!notesBySlug[slug]) notesBySlug[slug] = [];
    notesBySlug[slug].push(tempNote);
    updateAuditGates(idx);

    var { data, error } = await sb.from('tracker_notes').insert({ entity_slug: slug, note_type: gateType, text: text }).select();
    if (error) { console.error('Failed to mark audit gate:', error); return; }
    // Replace temp
    var tempIdx = notesBySlug[slug].findIndex(function(n) { return n.id === tempNote.id; });
    if (tempIdx >= 0 && data && data[0]) notesBySlug[slug][tempIdx] = data[0];
  };

  // ----- Init -----
  loadNotes();
})();
<\/script>
</body>
</html>`;

  const outPath = resolve(ROOT, "tracker.html");
  writeFileSync(outPath, html, "utf-8");
  console.log(`\nWrote ${outPath}`);
  console.log(`\nSummary: ${complete} complete, ${partial} partial, ${notStarted} not started (of ${total})`);
  console.log(`Completeness: birth=${withBirth}, death=${withDeath}, burial=${withBurial}, education=${withEducation}, majorWork=${withMajorWork}`);

  // Entity type summary
  for (const [type, counts] of Object.entries(entityTypeCounts)) {
    console.log(`${type}: ${counts.total} total, ${counts.complete} complete, ${counts.partial} partial, ${counts.notStarted} not started`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
