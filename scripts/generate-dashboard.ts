/**
 * generate-dashboard.ts
 *
 * Generates a self-contained dashboard.html in the project root.
 * A "CEO dashboard" for the Deep Maps project: project status, content
 * pipeline progress, pending tasks, open decisions, and architecture reference.
 *
 * Usage:  npx tsx scripts/generate-dashboard.ts
 * Output: dashboard.html in project root
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
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
// Helpers
// ---------------------------------------------------------------------------

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function fetchAllPages<T>(table: string, select: string): Promise<T[]> {
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

function readJsonSafe<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface TopPerson {
  rank: number;
  name: string;
  category: string;
  wikipediaSlug: string;
}

interface EntityRow {
  id: string;
  name: string;
  wikipedia_slug: string;
  canonical_story_id: string | null;
  created_at: string;
}

interface StoryRow {
  id: string;
}

interface MomentRow {
  id: string;
}

interface StoryMomentRow {
  story_id: string;
  moment_id: string;
}

interface CollectionRow {
  id: string;
}

interface PendingTask {
  priority: "high" | "medium" | "low";
  task: string;
  category: string;
}

interface OpenDecision {
  question: string;
  options: string[];
  context: string;
}

interface GitCommit {
  hash: string;
  date: string;
  message: string;
  filesChanged: number;
}

// ---------------------------------------------------------------------------
// Data gathering
// ---------------------------------------------------------------------------

async function main() {
  console.log("Gathering data for dashboard...\n");

  // --- Git log ---
  console.log("Reading git log...");
  let commits: GitCommit[] = [];
  try {
    const gitLog = execSync(
      `git log --oneline --format="%H|%ai|%s" -20`,
      { cwd: ROOT, encoding: "utf-8" },
    ).trim();
    commits = gitLog.split("\n").filter(Boolean).map((line) => {
      const [hash, date, ...msgParts] = line.split("|");
      const message = msgParts.join("|");
      let filesChanged = 0;
      try {
        const stat = execSync(`git diff --shortstat ${hash}^ ${hash} 2>/dev/null`, {
          cwd: ROOT,
          encoding: "utf-8",
        }).trim();
        const match = stat.match(/(\d+) file/);
        if (match) filesChanged = parseInt(match[1], 10);
      } catch { /* first commit or other edge case */ }
      return { hash: hash.slice(0, 7), date: date.slice(0, 10), message, filesChanged };
    });
  } catch (e) {
    console.warn("  Could not read git log:", e);
  }
  console.log(`  ${commits.length} commits loaded`);

  // --- Top people ---
  console.log("Loading top-people.json...");
  const people: TopPerson[] = JSON.parse(
    readFileSync(resolve(ROOT, "data/top-people.json"), "utf-8"),
  );
  console.log(`  ${people.length} people`);

  // --- Supabase counts ---
  console.log("Querying Supabase...");

  const entities = await fetchAllPages<EntityRow>(
    "entities",
    "id,name,wikipedia_slug,canonical_story_id,created_at",
  );
  console.log(`  ${entities.length} entities`);

  const stories = await fetchAllPages<StoryRow>("stories", "id");
  console.log(`  ${stories.length} stories`);

  const moments = await fetchAllPages<MomentRow>("moments", "id");
  console.log(`  ${moments.length} moments`);

  const storyMoments = await fetchAllPages<StoryMomentRow>("story_moments", "story_id,moment_id");
  console.log(`  ${storyMoments.length} story_moments`);

  let collectionsCount = 0;
  try {
    const collections = await fetchAllPages<CollectionRow>("collections", "id");
    collectionsCount = collections.length;
    console.log(`  ${collectionsCount} collections`);
  } catch {
    console.log("  collections table not found, skipping");
  }

  // --- Content pipeline stats (same logic as tracker) ---
  const slugToEntity = new Map<string, EntityRow>();
  const nameToEntity = new Map<string, EntityRow>();
  for (const e of entities) {
    if (e.wikipedia_slug) slugToEntity.set(e.wikipedia_slug, e);
    nameToEntity.set(e.name.toLowerCase(), e);
  }

  const storyMomentCount = new Map<string, number>();
  for (const sm of storyMoments) {
    storyMomentCount.set(sm.story_id, (storyMomentCount.get(sm.story_id) || 0) + 1);
  }

  let complete = 0;
  let partial = 0;
  let notStarted = 0;

  for (const p of people) {
    const entity = slugToEntity.get(p.wikipediaSlug) || nameToEntity.get(p.name.toLowerCase());
    const storyId = entity?.canonical_story_id || "";
    const mc = storyId ? (storyMomentCount.get(storyId) || 0) : 0;
    if (mc >= 4) complete++;
    else if (mc >= 1 || entity) partial++;
    else notStarted++;
  }

  // Recently created entities (last 10)
  const recentEntities = [...entities]
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 10);

  // --- Pending tasks ---
  const pendingTasks = readJsonSafe<PendingTask[]>(resolve(ROOT, "data/pending-tasks.json"), []);

  // --- Open decisions ---
  const openDecisions = readJsonSafe<OpenDecision[]>(resolve(ROOT, "data/open-decisions.json"), []);

  // ---------------------------------------------------------------------------
  // Build HTML
  // ---------------------------------------------------------------------------

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  const totalPeople = people.length;
  const completePct = ((complete / totalPeople) * 100).toFixed(1);
  const partialPct = ((partial / totalPeople) * 100).toFixed(1);

  // Group commits by date
  const commitsByDate = new Map<string, GitCommit[]>();
  for (const c of commits) {
    if (!commitsByDate.has(c.date)) commitsByDate.set(c.date, []);
    commitsByDate.get(c.date)!.push(c);
  }

  // --- Section builders ---

  const priorityIcon = (p: string) =>
    p === "high" ? "&#x1F534;" : p === "medium" ? "&#x1F7E1;" : "&#x1F7E2;";

  const priorityLabel = (p: string) =>
    p === "high" ? "High" : p === "medium" ? "Medium" : "Low";

  const commitGroupsHtml = Array.from(commitsByDate.entries())
    .map(([date, group]) => {
      const rows = group
        .map(
          (c) =>
            `<div class="commit-row">
              <span class="commit-hash">${esc(c.hash)}</span>
              <span class="commit-msg">${esc(c.message)}</span>
              ${c.filesChanged ? `<span class="commit-files">${c.filesChanged} file${c.filesChanged !== 1 ? "s" : ""}</span>` : ""}
            </div>`,
        )
        .join("\n");
      return `<div class="commit-group">
        <div class="commit-date">${esc(date)}</div>
        ${rows}
      </div>`;
    })
    .join("\n");

  const recentEntitiesHtml = recentEntities
    .map(
      (e) =>
        `<div class="recent-entity">
          <span class="entity-name">${esc(e.name)}</span>
          <span class="entity-date">${e.created_at ? e.created_at.slice(0, 10) : "—"}</span>
        </div>`,
    )
    .join("\n");

  const tasksHtml = pendingTasks.length
    ? pendingTasks
        .map(
          (t) =>
            `<div class="task-row task-${t.priority}">
              <span class="task-priority">${priorityIcon(t.priority)} ${priorityLabel(t.priority)}</span>
              <span class="task-text">${esc(t.task)}</span>
              <span class="task-category">${esc(t.category)}</span>
            </div>`,
        )
        .join("\n")
    : `<p class="placeholder">No pending tasks file found. Create <code>data/pending-tasks.json</code> to populate this section.</p>`;

  const decisionsHtml = openDecisions.length
    ? openDecisions
        .map(
          (d, i) =>
            `<div class="decision-card">
              <div class="decision-question">${i + 1}. ${esc(d.question)}</div>
              <div class="decision-context">${esc(d.context)}</div>
              <div class="decision-options">
                ${d.options.map((o, j) => `<div class="decision-option"><span class="option-letter">${String.fromCharCode(65 + j)}</span> ${esc(o)}</div>`).join("\n")}
              </div>
            </div>`,
        )
        .join("\n")
    : `<p class="placeholder">No open decisions file found. Create <code>data/open-decisions.json</code> to populate this section.</p>`;

  const archHtml = `
    <div class="arch-grid">
      <div class="arch-section">
        <h4>Key Files</h4>
        <div class="arch-item"><code>src/App.tsx</code> <span class="arch-desc">Main app entry, routing</span></div>
        <div class="arch-item"><code>src/components/MapView.tsx</code> <span class="arch-desc">Leaflet map with clustering</span></div>
        <div class="arch-item"><code>src/components/StoryPanel.tsx</code> <span class="arch-desc">Story detail view</span></div>
        <div class="arch-item"><code>src/lib/supabase.ts</code> <span class="arch-desc">Supabase client config</span></div>
        <div class="arch-item"><code>scripts/ingest/</code> <span class="arch-desc">Content pipeline (people ingestion)</span></div>
        <div class="arch-item"><code>scripts/generate-tracker.ts</code> <span class="arch-desc">Ingestion tracker HTML generator</span></div>
        <div class="arch-item"><code>scripts/generate-dashboard.ts</code> <span class="arch-desc">This dashboard generator</span></div>
        <div class="arch-item"><code>data/top-people.json</code> <span class="arch-desc">507 target people with scores</span></div>
      </div>
      <div class="arch-section">
        <h4>Common Commands</h4>
        <div class="arch-item"><code>npx vite --host --port 5174</code> <span class="arch-desc">Dev server</span></div>
        <div class="arch-item"><code>npx tsx scripts/generate-tracker.ts</code> <span class="arch-desc">Rebuild ingestion tracker</span></div>
        <div class="arch-item"><code>npx tsx scripts/generate-dashboard.ts</code> <span class="arch-desc">Rebuild this dashboard</span></div>
        <div class="arch-item"><code>npx tsx scripts/ingest/ingest-people.ts</code> <span class="arch-desc">Run people ingestion pipeline</span></div>
        <div class="arch-item"><code>npx tsx scripts/audit-wiring.ts</code> <span class="arch-desc">Audit entity/story/moment wiring</span></div>
        <div class="arch-item"><code>npx tsx scripts/score-moments.ts</code> <span class="arch-desc">Score moment quality</span></div>
      </div>
    </div>`;

  // --- Final HTML ---

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deep Maps &#8212; Project Dashboard</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a; color: #c9d1d9; line-height: 1.6;
    padding: 0; margin: 0;
  }

  .dashboard {
    max-width: 1100px; margin: 0 auto; padding: 32px 24px 64px;
  }

  /* Header */
  .header {
    text-align: center; padding: 48px 0 32px; border-bottom: 1px solid #1e1e1e;
    margin-bottom: 32px;
  }
  .header h1 {
    font-size: 2.2rem; font-weight: 700; color: #f0f0f0;
    letter-spacing: -0.02em; margin-bottom: 4px;
  }
  .header .tagline {
    font-size: 1rem; color: #6e7681; font-style: italic; margin-bottom: 20px;
  }
  .header .timestamp {
    font-size: 0.75rem; color: #484f58; margin-bottom: 24px;
  }

  .quick-stats {
    display: flex; justify-content: center; gap: 32px; flex-wrap: wrap;
  }
  .quick-stat {
    text-align: center;
  }
  .quick-stat-value {
    font-size: 2rem; font-weight: 700;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    color: #e6edf3;
  }
  .quick-stat-label {
    font-size: 0.7rem; color: #6e7681; text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* Sections */
  .section {
    margin-bottom: 8px; border: 1px solid #1e1e1e; border-radius: 10px;
    overflow: hidden; background: #111111;
  }
  .section-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px; cursor: pointer; user-select: none;
    background: #141414; transition: background 0.15s;
  }
  .section-header:hover { background: #1a1a1a; }
  .section-title {
    font-size: 1rem; font-weight: 600; color: #e6edf3;
  }
  .section-toggle {
    font-size: 0.8rem; color: #484f58; transition: transform 0.2s;
  }
  .section.collapsed .section-toggle { transform: rotate(-90deg); }
  .section-body {
    padding: 16px 20px 20px; border-top: 1px solid #1e1e1e;
  }
  .section.collapsed .section-body { display: none; }

  /* Progress bar */
  .pipeline-stats {
    display: flex; gap: 24px; margin-bottom: 16px; flex-wrap: wrap;
  }
  .pipeline-stat { display: flex; flex-direction: column; }
  .pipeline-stat-value {
    font-size: 1.5rem; font-weight: 700;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
  .pipeline-stat-label { font-size: 0.7rem; color: #6e7681; text-transform: uppercase; letter-spacing: 0.05em; }
  .ps-complete .pipeline-stat-value { color: #3fb950; }
  .ps-partial .pipeline-stat-value { color: #d29922; }
  .ps-notstarted .pipeline-stat-value { color: #6e7681; }
  .ps-total .pipeline-stat-value { color: #e6edf3; }

  .progress-bar {
    width: 100%; height: 10px; background: #1e1e1e; border-radius: 5px;
    overflow: hidden; margin-bottom: 8px;
  }
  .progress-inner { display: flex; height: 100%; }
  .pb-complete { background: #3fb950; }
  .pb-partial { background: #d29922; }
  .pb-notstarted { background: #2d2d2d; }
  .progress-legend {
    display: flex; gap: 16px; font-size: 0.75rem; color: #6e7681; margin-bottom: 20px;
  }
  .legend-dot {
    display: inline-block; width: 8px; height: 8px; border-radius: 50%;
    margin-right: 4px; vertical-align: middle;
  }

  .subsection-title {
    font-size: 0.8rem; font-weight: 600; color: #8b949e;
    text-transform: uppercase; letter-spacing: 0.06em;
    margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #1e1e1e;
  }

  .tracker-link {
    display: inline-block; margin-top: 12px; padding: 8px 16px;
    background: #1e1e1e; color: #58a6ff; border-radius: 6px;
    text-decoration: none; font-size: 0.85rem; transition: background 0.15s;
  }
  .tracker-link:hover { background: #262626; }

  /* Commits */
  .commit-group { margin-bottom: 16px; }
  .commit-date {
    font-size: 0.75rem; font-weight: 600; color: #8b949e;
    margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .commit-row {
    display: flex; align-items: baseline; gap: 10px;
    padding: 4px 0; font-size: 0.85rem;
  }
  .commit-hash {
    font-family: 'SF Mono', 'Fira Code', monospace;
    color: #58a6ff; font-size: 0.78rem; flex-shrink: 0;
  }
  .commit-msg { color: #c9d1d9; flex: 1; }
  .commit-files {
    font-size: 0.72rem; color: #6e7681; flex-shrink: 0;
    background: #1e1e1e; padding: 1px 6px; border-radius: 3px;
  }

  /* Recent entities */
  .recent-entity {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 0; border-bottom: 1px solid #1a1a1a; font-size: 0.85rem;
  }
  .recent-entity:last-child { border-bottom: none; }
  .entity-name { color: #e6edf3; }
  .entity-date { color: #6e7681; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.78rem; }

  /* Tasks */
  .task-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: 6px; margin-bottom: 4px;
    font-size: 0.85rem; background: #141414;
  }
  .task-row:hover { background: #1a1a1a; }
  .task-priority { flex-shrink: 0; width: 90px; font-size: 0.78rem; }
  .task-text { flex: 1; color: #c9d1d9; }
  .task-category {
    flex-shrink: 0; font-size: 0.72rem; color: #6e7681;
    background: #1e1e1e; padding: 2px 8px; border-radius: 3px;
  }
  .task-high { border-left: 3px solid #f85149; }
  .task-medium { border-left: 3px solid #d29922; }
  .task-low { border-left: 3px solid #3fb950; }

  /* Decisions */
  .decision-card {
    padding: 16px; border: 1px solid #1e1e1e; border-radius: 8px;
    margin-bottom: 12px; background: #141414;
  }
  .decision-question {
    font-weight: 600; color: #e6edf3; font-size: 0.95rem; margin-bottom: 6px;
  }
  .decision-context {
    font-size: 0.82rem; color: #6e7681; margin-bottom: 12px; line-height: 1.5;
  }
  .decision-options { display: flex; flex-direction: column; gap: 4px; }
  .decision-option {
    font-size: 0.85rem; color: #c9d1d9; padding: 6px 10px;
    background: #1a1a1a; border-radius: 4px;
  }
  .option-letter {
    display: inline-block; width: 22px; height: 22px; line-height: 22px;
    text-align: center; background: #262626; border-radius: 4px;
    font-size: 0.72rem; font-weight: 700; color: #8b949e; margin-right: 8px;
  }

  /* Architecture */
  .arch-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  }
  .arch-section h4 {
    font-size: 0.8rem; font-weight: 600; color: #8b949e;
    text-transform: uppercase; letter-spacing: 0.06em;
    margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #1e1e1e;
  }
  .arch-item {
    font-size: 0.82rem; padding: 5px 0; display: flex; align-items: baseline; gap: 8px;
  }
  .arch-item code {
    font-family: 'SF Mono', 'Fira Code', monospace;
    color: #58a6ff; font-size: 0.78rem; flex-shrink: 0; background: #1a1a1a;
    padding: 1px 5px; border-radius: 3px;
  }
  .arch-desc { color: #6e7681; }

  .placeholder {
    color: #484f58; font-style: italic; font-size: 0.85rem;
  }
  .placeholder code {
    font-family: 'SF Mono', 'Fira Code', monospace; color: #58a6ff;
    background: #1a1a1a; padding: 1px 5px; border-radius: 3px; font-size: 0.8rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .dashboard { padding: 16px 12px 48px; }
    .header h1 { font-size: 1.6rem; }
    .quick-stats { gap: 16px; }
    .quick-stat-value { font-size: 1.4rem; }
    .arch-grid { grid-template-columns: 1fr; }
    .task-row { flex-wrap: wrap; }
    .task-priority { width: auto; }
    .pipeline-stats { gap: 12px; }
  }
</style>
</head>
<body>
<div class="dashboard">

  <!-- Header -->
  <div class="header">
    <h1>&#x1F30D; Deep Maps</h1>
    <div class="tagline">Everything That Ever Happened Happened Somewhere</div>
    <div class="timestamp">Generated ${esc(timestamp)}</div>
    <div class="quick-stats">
      <div class="quick-stat">
        <div class="quick-stat-value">${entities.length.toLocaleString()}</div>
        <div class="quick-stat-label">Entities</div>
      </div>
      <div class="quick-stat">
        <div class="quick-stat-value">${stories.length.toLocaleString()}</div>
        <div class="quick-stat-label">Stories</div>
      </div>
      <div class="quick-stat">
        <div class="quick-stat-value">${moments.length.toLocaleString()}</div>
        <div class="quick-stat-label">Moments</div>
      </div>
      <div class="quick-stat">
        <div class="quick-stat-value">${collectionsCount.toLocaleString()}</div>
        <div class="quick-stat-label">Collections</div>
      </div>
    </div>
  </div>

  <!-- Content Pipeline -->
  <div class="section" id="sec-pipeline">
    <div class="section-header" onclick="toggleSection('sec-pipeline')">
      <span class="section-title">&#x1F4CA; Content Pipeline Progress</span>
      <span class="section-toggle">&#x25BC;</span>
    </div>
    <div class="section-body">
      <div class="pipeline-stats">
        <div class="pipeline-stat ps-total"><span class="pipeline-stat-value">${totalPeople}</span><span class="pipeline-stat-label">Total People</span></div>
        <div class="pipeline-stat ps-complete"><span class="pipeline-stat-value">${complete}</span><span class="pipeline-stat-label">Complete (&#x2265;4 moments)</span></div>
        <div class="pipeline-stat ps-partial"><span class="pipeline-stat-value">${partial}</span><span class="pipeline-stat-label">Partial</span></div>
        <div class="pipeline-stat ps-notstarted"><span class="pipeline-stat-value">${notStarted}</span><span class="pipeline-stat-label">Not Started</span></div>
      </div>
      <div class="progress-bar"><div class="progress-inner">
        <div class="pb-complete" style="width:${completePct}%"></div>
        <div class="pb-partial" style="width:${partialPct}%"></div>
        <div class="pb-notstarted" style="width:${(100 - parseFloat(completePct) - parseFloat(partialPct)).toFixed(1)}%"></div>
      </div></div>
      <div class="progress-legend">
        <span><span class="legend-dot" style="background:#3fb950"></span> Complete ${completePct}%</span>
        <span><span class="legend-dot" style="background:#d29922"></span> Partial ${partialPct}%</span>
        <span><span class="legend-dot" style="background:#2d2d2d"></span> Not Started ${(100 - parseFloat(completePct) - parseFloat(partialPct)).toFixed(1)}%</span>
      </div>

      <div class="subsection-title">Last 10 People Processed</div>
      ${recentEntitiesHtml || '<p class="placeholder">No entities found.</p>'}

      <a class="tracker-link" href="tracker.html">&#x1F50D; Open Full Ingestion Tracker &rarr;</a>
    </div>
  </div>

  <!-- Recent Changes -->
  <div class="section" id="sec-changelog">
    <div class="section-header" onclick="toggleSection('sec-changelog')">
      <span class="section-title">&#x1F4DD; Recent Changes</span>
      <span class="section-toggle">&#x25BC;</span>
    </div>
    <div class="section-body">
      ${commitGroupsHtml || '<p class="placeholder">No git history available.</p>'}
    </div>
  </div>

  <!-- Pending Tasks -->
  <div class="section" id="sec-tasks">
    <div class="section-header" onclick="toggleSection('sec-tasks')">
      <span class="section-title">&#x1F4CB; Pending Tasks</span>
      <span class="section-toggle">&#x25BC;</span>
    </div>
    <div class="section-body">
      ${tasksHtml}
    </div>
  </div>

  <!-- Open Decisions -->
  <div class="section" id="sec-decisions">
    <div class="section-header" onclick="toggleSection('sec-decisions')">
      <span class="section-title">&#x2753; Open Decisions</span>
      <span class="section-toggle">&#x25BC;</span>
    </div>
    <div class="section-body">
      ${decisionsHtml}
    </div>
  </div>

  <!-- Architecture Reference -->
  <div class="section collapsed" id="sec-arch">
    <div class="section-header" onclick="toggleSection('sec-arch')">
      <span class="section-title">&#x1F3D7;&#xFE0F; Architecture Quick Reference</span>
      <span class="section-toggle">&#x25BC;</span>
    </div>
    <div class="section-body">
      ${archHtml}
    </div>
  </div>

</div>

<script>
function toggleSection(id) {
  document.getElementById(id).classList.toggle('collapsed');
}
</script>
</body>
</html>`;

  const outPath = resolve(ROOT, "dashboard.html");
  writeFileSync(outPath, html, "utf-8");
  console.log(`\nWrote ${outPath}`);
  console.log(`\nDashboard summary:`);
  console.log(`  Entities: ${entities.length} | Stories: ${stories.length} | Moments: ${moments.length} | Collections: ${collectionsCount}`);
  console.log(`  Pipeline: ${complete} complete, ${partial} partial, ${notStarted} not started (of ${totalPeople})`);
  console.log(`  Tasks: ${pendingTasks.length} | Decisions: ${openDecisions.length}`);
  console.log(`  Commits: ${commits.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
