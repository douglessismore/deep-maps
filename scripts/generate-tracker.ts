/**
 * generate-tracker.ts
 *
 * Reads top-people.json and queries Supabase to produce a self-contained
 * tracker.html showing ingestion status for all 507 planned people.
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
  wikipedia_slug: string;
  canonical_story_id: string | null;
}

interface StoryMomentRow {
  story_id: string;
  moment_id: string;
}

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

async function main() {
  // 1. Load top-people
  const people: TopPerson[] = JSON.parse(
    readFileSync(resolve(ROOT, "data/top-people.json"), "utf-8"),
  );
  console.log(`Loaded ${people.length} people from top-people.json`);

  // 2. Query Supabase
  console.log("Querying entities...");
  const entities = await fetchAllPages<EntityRow>("entities", "id,name,wikipedia_slug,canonical_story_id");
  console.log(`  ${entities.length} entities found`);

  console.log("Querying story_moments...");
  const storyMoments = await fetchAllPages<StoryMomentRow>("story_moments", "story_id,moment_id");
  console.log(`  ${storyMoments.length} story_moment links found`);

  // 3. Build lookup maps
  // wikipedia_slug → entity
  const slugToEntity = new Map<string, EntityRow>();
  for (const e of entities) {
    if (e.wikipedia_slug) {
      slugToEntity.set(e.wikipedia_slug, e);
    }
  }

  // Also try matching by lowercased name for fallback
  const nameToEntity = new Map<string, EntityRow>();
  for (const e of entities) {
    nameToEntity.set(e.name.toLowerCase(), e);
  }

  // story_id → moment count
  const storyMomentCount = new Map<string, number>();
  for (const sm of storyMoments) {
    storyMomentCount.set(sm.story_id, (storyMomentCount.get(sm.story_id) || 0) + 1);
  }

  // 4. Build rows
  interface TrackerRow {
    rank: number;
    name: string;
    score: number;
    category: string;
    occupation: string;
    entityId: string;
    storyId: string;
    momentCount: number;
    status: "complete" | "partial" | "not_started";
    years: string;
  }

  const rows: TrackerRow[] = people.map((p) => {
    const entity =
      slugToEntity.get(p.wikipediaSlug) ||
      nameToEntity.get(p.name.toLowerCase());

    const entityId = entity?.id || "";
    const storyId = entity?.canonical_story_id || "";
    const momentCount = storyId ? (storyMomentCount.get(storyId) || 0) : 0;

    let status: TrackerRow["status"] = "not_started";
    if (momentCount >= 4) status = "complete";
    else if (momentCount >= 1 || entityId) status = "partial";

    const birthStr = p.birthYear < 0 ? `${Math.abs(p.birthYear)} BCE` : `${p.birthYear}`;
    const deathStr = p.deathYear < 0 ? `${Math.abs(p.deathYear)} BCE` : `${p.deathYear}`;
    const years = `${birthStr} – ${deathStr}`;

    return { rank: p.rank, name: p.name, score: p.deepMapsScore, category: p.category, occupation: p.occupation, entityId, storyId, momentCount, status, years };
  });

  // 5. Stats
  const total = rows.length;
  const complete = rows.filter((r) => r.status === "complete").length;
  const partial = rows.filter((r) => r.status === "partial").length;
  const notStarted = rows.filter((r) => r.status === "not_started").length;

  // 6. Collect unique categories
  const categories = [...new Set(rows.map((r) => r.category))].sort();

  // 7. Generate HTML
  const statusIcon = (s: TrackerRow["status"]) =>
    s === "complete" ? "&#x2705;" : s === "partial" ? "&#x1F7E1;" : "&#x2B1C;";
  const statusLabel = (s: TrackerRow["status"]) =>
    s === "complete" ? "Complete" : s === "partial" ? "Partial" : "Not Started";

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const tableRows = rows
    .map(
      (r) => `<tr data-status="${r.status}" data-category="${esc(r.category)}" data-name="${esc(r.name.toLowerCase())}">
  <td class="rank">${r.rank}</td>
  <td class="name">${esc(r.name)}<span class="years">${esc(r.years)}</span></td>
  <td class="score">${r.score}</td>
  <td class="cat">${esc(r.category)}</td>
  <td class="occ">${esc(r.occupation)}</td>
  <td class="status">${statusIcon(r.status)} ${statusLabel(r.status)}</td>
  <td class="mono">${r.entityId ? esc(r.entityId) : '<span class="dim">—</span>'}</td>
  <td class="mono">${r.storyId ? esc(r.storyId) : '<span class="dim">—</span>'}</td>
  <td class="moments">${r.momentCount}</td>
</tr>`,
    )
    .join("\n");

  const categoryOptions = categories
    .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deep Maps — Ingestion Tracker</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0d1117; color: #c9d1d9; line-height: 1.5;
    padding: 24px; max-width: 1600px; margin: 0 auto;
  }
  h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 4px; color: #e6edf3; }
  .subtitle { color: #8b949e; font-size: 0.85rem; margin-bottom: 20px; }

  /* Stats bar */
  .stats {
    display: flex; gap: 16px; flex-wrap: wrap;
    margin-bottom: 20px; padding: 16px; background: #161b22;
    border: 1px solid #30363d; border-radius: 8px;
  }
  .stat {
    display: flex; flex-direction: column; min-width: 100px;
  }
  .stat-value { font-size: 1.8rem; font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace; }
  .stat-label { font-size: 0.75rem; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-complete .stat-value { color: #3fb950; }
  .stat-partial .stat-value { color: #d29922; }
  .stat-not-started .stat-value { color: #8b949e; }
  .stat-total .stat-value { color: #e6edf3; }

  .progress-bar {
    width: 100%; height: 8px; background: #21262d; border-radius: 4px;
    overflow: hidden; margin-bottom: 20px;
  }
  .progress-bar-inner { display: flex; height: 100%; }
  .pb-complete { background: #3fb950; }
  .pb-partial { background: #d29922; }
  .pb-not-started { background: #30363d; }

  /* Filters */
  .filters {
    display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; align-items: center;
  }
  .filters input, .filters select {
    background: #0d1117; border: 1px solid #30363d; color: #c9d1d9;
    padding: 8px 12px; border-radius: 6px; font-size: 0.85rem;
  }
  .filters input { width: 260px; }
  .filters select { min-width: 140px; }
  .filters input:focus, .filters select:focus { outline: none; border-color: #58a6ff; }
  .filter-count { color: #8b949e; font-size: 0.8rem; margin-left: auto; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
  thead { position: sticky; top: 0; z-index: 10; }
  th {
    background: #161b22; color: #8b949e; font-weight: 600; text-align: left;
    padding: 10px 8px; border-bottom: 2px solid #30363d;
    text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em;
    cursor: pointer; user-select: none; white-space: nowrap;
  }
  th:hover { color: #e6edf3; }
  th.sorted-asc::after { content: ' ▲'; }
  th.sorted-desc::after { content: ' ▼'; }
  td { padding: 8px; border-bottom: 1px solid #21262d; vertical-align: top; }
  tr:hover { background: #161b22; }
  tr[data-status="complete"] { }
  tr[data-status="partial"] td:first-child { border-left: 3px solid #d29922; }
  tr[data-status="not_started"] { opacity: 0.7; }

  .rank { text-align: center; width: 50px; font-family: 'SF Mono', 'Fira Code', monospace; color: #8b949e; }
  .name { font-weight: 500; color: #e6edf3; }
  .name .years { display: block; font-size: 0.72rem; color: #8b949e; font-weight: 400; }
  .score { text-align: center; font-family: 'SF Mono', 'Fira Code', monospace; }
  .cat { color: #8b949e; }
  .occ { color: #8b949e; }
  .status { white-space: nowrap; }
  .mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.72rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .moments { text-align: center; font-family: 'SF Mono', 'Fira Code', monospace; font-weight: 600; }
  .dim { color: #484f58; }

  @media (max-width: 1024px) {
    .mono { display: none; }
  }
</style>
</head>
<body>
<h1>Deep Maps — Ingestion Tracker</h1>
<p class="subtitle">Generated ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC &middot; ${total} people from top-people.json</p>

<div class="stats">
  <div class="stat stat-total"><span class="stat-value">${total}</span><span class="stat-label">Total</span></div>
  <div class="stat stat-complete"><span class="stat-value">${complete}</span><span class="stat-label">Complete (≥4)</span></div>
  <div class="stat stat-partial"><span class="stat-value">${partial}</span><span class="stat-label">Partial</span></div>
  <div class="stat stat-not-started"><span class="stat-value">${notStarted}</span><span class="stat-label">Not Started</span></div>
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
  <span class="filter-count" id="filterCount">${total} shown</span>
</div>

<table>
<thead>
<tr>
  <th data-col="rank" data-type="num" class="sorted-asc">Rank</th>
  <th data-col="name" data-type="str">Name</th>
  <th data-col="score" data-type="num">Score</th>
  <th data-col="cat" data-type="str">Category</th>
  <th data-col="occ" data-type="str">Occupation</th>
  <th data-col="status" data-type="str">Status</th>
  <th>Entity ID</th>
  <th>Story ID</th>
  <th data-col="moments" data-type="num">Moments</th>
</tr>
</thead>
<tbody id="tbody">
${tableRows}
</tbody>
</table>

<script>
(function() {
  const tbody = document.getElementById('tbody');
  const search = document.getElementById('search');
  const statusFilter = document.getElementById('statusFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const filterCount = document.getElementById('filterCount');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  function applyFilters() {
    const q = search.value.toLowerCase();
    const s = statusFilter.value;
    const c = categoryFilter.value;
    let visible = 0;
    for (const row of rows) {
      const matchName = !q || row.dataset.name.includes(q);
      const matchStatus = !s || row.dataset.status === s;
      const matchCat = !c || row.dataset.category === c;
      const show = matchName && matchStatus && matchCat;
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    }
    filterCount.textContent = visible + ' shown';
  }

  search.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  categoryFilter.addEventListener('change', applyFilters);

  // Column sorting
  const headers = document.querySelectorAll('th[data-col]');
  let currentSort = { col: 'rank', dir: 'asc' };

  headers.forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const type = th.dataset.type;
      const dir = (currentSort.col === col && currentSort.dir === 'asc') ? 'desc' : 'asc';
      currentSort = { col, dir };

      headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
      th.classList.add('sorted-' + dir);

      rows.sort((a, b) => {
        let aVal, bVal;
        const aCell = a.querySelector('.' + col) || a.children[getColIndex(col)];
        const bCell = b.querySelector('.' + col) || b.children[getColIndex(col)];
        if (type === 'num') {
          aVal = parseFloat(aCell.textContent) || 0;
          bVal = parseFloat(bCell.textContent) || 0;
        } else {
          aVal = aCell.textContent.toLowerCase();
          bVal = bCell.textContent.toLowerCase();
        }
        if (aVal < bVal) return dir === 'asc' ? -1 : 1;
        if (aVal > bVal) return dir === 'asc' ? 1 : -1;
        return 0;
      });

      for (const row of rows) tbody.appendChild(row);
    });
  });

  function getColIndex(col) {
    const map = { rank: 0, name: 1, score: 2, cat: 3, occ: 4, status: 5, moments: 8 };
    return map[col] || 0;
  }
})();
</script>
</body>
</html>`;

  const outPath = resolve(ROOT, "tracker.html");
  writeFileSync(outPath, html, "utf-8");
  console.log(`\nWrote ${outPath}`);
  console.log(`\nSummary: ${complete} complete, ${partial} partial, ${notStarted} not started (of ${total})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
