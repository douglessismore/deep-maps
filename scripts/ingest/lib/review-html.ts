/**
 * review-html.ts
 *
 * Generates a self-contained HTML review page for a pipeline run.
 * Groups items by person (entity → story → moments) for easy scanning.
 *
 * Used by: review.ts --generate-review
 */

interface ReviewItem {
  id: number;
  ingestion_run_id: number;
  item_type: string;
  item_id: string;
  draft_data: Record<string, unknown>;
  related_items: Record<string, unknown[]> | null;
  status: string;
  reviewer_notes: string | null;
  validation_errors: Array<{ field: string; message: string; severity: string }> | null;
  created_at: string;
  reviewed_at: string | null;
}

interface RunInfo {
  id: number;
  source: string;
  started_at: string;
  config: Record<string, unknown> | null;
}

interface PersonGroup {
  entity: ReviewItem | null;
  story: ReviewItem | null;
  moments: ReviewItem[];
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function groupByPerson(items: ReviewItem[]): PersonGroup[] {
  const entities = items.filter(i => i.item_type === 'entity');
  const stories = items.filter(i => i.item_type === 'story');
  const moments = items.filter(i => i.item_type === 'moment');

  // Build story → entity mapping
  const storyToEntity = new Map<string, ReviewItem>();
  for (const entity of entities) {
    const storyId = (entity.draft_data.canonical_story_id || entity.draft_data.canonicalStoryId) as string;
    if (storyId) storyToEntity.set(storyId, entity);
  }

  // Build story → moments mapping via related_items
  const storyMoments = new Map<string, ReviewItem[]>();
  for (const moment of moments) {
    // Find which story this moment belongs to via related_items
    const related = moment.related_items as Record<string, unknown[]> | null;
    if (related?.story_moments) {
      for (const sm of related.story_moments as Array<{ story_id: string }>) {
        if (!storyMoments.has(sm.story_id)) storyMoments.set(sm.story_id, []);
        storyMoments.get(sm.story_id)!.push(moment);
      }
    }
  }

  // Group: for each story, find its entity and moments
  const groups: PersonGroup[] = [];
  const usedMomentIds = new Set<number>();

  for (const story of stories) {
    const storyId = story.item_id || (story.draft_data.id as string);
    const entity = storyToEntity.get(storyId) || null;
    const storyMs = storyMoments.get(storyId) || [];
    for (const m of storyMs) usedMomentIds.add(m.id);
    groups.push({ entity, story, moments: storyMs });
  }

  // Orphan moments (not linked to any story in this run)
  const orphans = moments.filter(m => !usedMomentIds.has(m.id));
  if (orphans.length > 0) {
    groups.push({ entity: null, story: null, moments: orphans });
  }

  // Entities without stories
  const usedEntityIds = new Set(groups.filter(g => g.entity).map(g => g.entity!.id));
  const orphanEntities = entities.filter(e => !usedEntityIds.has(e.id));
  for (const oe of orphanEntities) {
    groups.push({ entity: oe, story: null, moments: [] });
  }

  return groups;
}

function statusBadge(status: string): string {
  switch (status) {
    case 'approved':
      return '<span class="badge badge-approved">Approved</span>';
    case 'rejected':
      return '<span class="badge badge-rejected">Rejected</span>';
    case 'pending':
      return '<span class="badge badge-pending">Pending</span>';
    default:
      return `<span class="badge">${esc(status)}</span>`;
  }
}

function renderMoment(item: ReviewItem): string {
  const d = item.draft_data;
  const name = (d.name || '') as string;
  const subtitle = (d.subtitle || '') as string;
  const desc = (d.description || '') as string;
  const year = d.year || '?';
  const lat = d.lat as number | undefined;
  const lng = d.lng as number | undefined;
  const accuracy = (d.accuracy || '?') as string;
  const importance = (d.importance || '?') as string;
  const typeId = (d.type_id || d.type || '?') as string;
  const address = (d.address || '') as string;

  const errors = item.validation_errors || [];
  const hasErrors = errors.some(e => e.severity === 'error');
  const hasWarnings = errors.some(e => e.severity === 'warning');
  const momentClass = hasErrors ? 'moment-card moment-error' : hasWarnings ? 'moment-card moment-warning' : 'moment-card';

  let coordStr = '';
  if (lat !== undefined && lng !== undefined) {
    coordStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  const errorsHtml = errors.length > 0
    ? errors.map(e => {
        const cls = e.severity === 'error' ? 'validation-error' : 'validation-warning';
        const icon = e.severity === 'error' ? '&#x274C;' : '&#x26A0;&#xFE0F;';
        return `<div class="${cls}">${icon} <strong>${esc(e.field)}</strong>: ${esc(e.message)}</div>`;
      }).join('\n')
    : '';

  return `<div class="${momentClass}" data-status="${item.status}" data-has-errors="${hasErrors}" data-has-warnings="${hasWarnings}">
  <div class="moment-header">
    <div class="moment-name">${esc(name)}</div>
    ${statusBadge(item.status)}
  </div>
  ${subtitle ? `<div class="moment-subtitle">${esc(subtitle)}</div>` : ''}
  <div class="moment-meta">
    <span>&#x1F4C5; ${year}</span>
    <span>&#x1F4CD; ${coordStr || 'no coords'}</span>
    <span>${esc(accuracy)}</span>
    <span>${esc(String(importance))}</span>
    <span>${esc(String(typeId))}</span>
  </div>
  ${address ? `<div class="moment-address">${esc(address)}</div>` : ''}
  <div class="moment-desc">${esc(desc)}</div>
  ${errorsHtml}
</div>`;
}

function renderGroup(group: PersonGroup, index: number): string {
  const entity = group.entity;
  const story = group.story;
  const moments = group.moments;

  // Determine person name
  let personName = 'Ungrouped Moments';
  let personMeta = '';
  let entityStatus = '';

  if (entity) {
    const ed = entity.draft_data;
    personName = (ed.name || entity.item_id) as string;
    personMeta = `${(ed.type || '') as string} | ${(ed.years || '') as string}`;
    entityStatus = entity.status;
  }

  let storyHtml = '';
  if (story) {
    const sd = story.draft_data;
    storyHtml = `<div class="story-info">
      <span class="story-label">Story:</span> ${esc((sd.name || story.item_id) as string)}
      <span class="story-meta">${esc((sd.category || '') as string)} | ${esc((sd.story_type || sd.storyType || '') as string)}</span>
      ${statusBadge(story.status)}
    </div>`;
    if (sd.description) {
      storyHtml += `<div class="story-desc">${esc((sd.description as string).slice(0, 200))}</div>`;
    }
  }

  // Count issues
  const allItems = [entity, story, ...moments].filter(Boolean) as ReviewItem[];
  const errorCount = allItems.reduce((sum, item) => {
    return sum + (item.validation_errors || []).filter(e => e.severity === 'error').length;
  }, 0);
  const warningCount = allItems.reduce((sum, item) => {
    return sum + (item.validation_errors || []).filter(e => e.severity === 'warning').length;
  }, 0);

  const issuesSummary = [];
  if (errorCount > 0) issuesSummary.push(`<span class="issue-count issue-errors">${errorCount} error${errorCount !== 1 ? 's' : ''}</span>`);
  if (warningCount > 0) issuesSummary.push(`<span class="issue-count issue-warnings">${warningCount} warning${warningCount !== 1 ? 's' : ''}</span>`);

  const collapsed = index > 2 ? 'collapsed' : ''; // First 3 expanded by default

  const momentsHtml = moments
    .sort((a, b) => {
      const yearA = (a.draft_data.year as number) || 0;
      const yearB = (b.draft_data.year as number) || 0;
      return yearA - yearB;
    })
    .map(m => renderMoment(m))
    .join('\n');

  return `<div class="person-card ${collapsed}" id="person-${index}">
  <div class="person-header" onclick="togglePerson(${index})">
    <div class="person-title">
      <span class="person-name">${esc(personName)}</span>
      ${personMeta ? `<span class="person-meta">${esc(personMeta)}</span>` : ''}
    </div>
    <div class="person-summary">
      <span class="moment-count">${moments.length} moment${moments.length !== 1 ? 's' : ''}</span>
      ${issuesSummary.join(' ')}
      ${entityStatus ? statusBadge(entityStatus) : ''}
      <span class="toggle-icon">&#x25BC;</span>
    </div>
  </div>
  <div class="person-body">
    ${entity ? `<div class="entity-desc">${esc((entity.draft_data.description || '') as string)}</div>` : ''}
    ${storyHtml}
    <div class="moments-list">
      ${momentsHtml || '<div class="no-moments">No moments in this group</div>'}
    </div>
  </div>
</div>`;
}

export function generateReviewHtml(run: RunInfo, items: ReviewItem[]): string {
  const groups = groupByPerson(items);
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  // Stats
  const total = items.length;
  const approved = items.filter(i => i.status === 'approved').length;
  const rejected = items.filter(i => i.status === 'rejected').length;
  const pending = items.filter(i => i.status === 'pending').length;

  const allErrors = items.reduce((sum, item) => {
    return sum + (item.validation_errors || []).filter(e => e.severity === 'error').length;
  }, 0);
  const allWarnings = items.reduce((sum, item) => {
    return sum + (item.validation_errors || []).filter(e => e.severity === 'warning').length;
  }, 0);

  const entityCount = items.filter(i => i.item_type === 'entity').length;
  const storyCount = items.filter(i => i.item_type === 'story').length;
  const momentCount = items.filter(i => i.item_type === 'moment').length;

  const runConfig = run.config || {};
  const started = run.started_at ? new Date(run.started_at).toLocaleString() : '?';

  const groupsHtml = groups.map((g, i) => renderGroup(g, i)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deep Maps — Run #${run.id} Review</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a; color: #c9d1d9; line-height: 1.5;
    padding: 0; margin: 0;
  }
  .container { max-width: 900px; margin: 0 auto; padding: 24px 16px 64px; }

  /* Header */
  .header { padding: 32px 0 24px; border-bottom: 1px solid #1e1e1e; margin-bottom: 24px; }
  .header h1 { font-size: 1.4rem; font-weight: 700; color: #f0f0f0; margin-bottom: 4px; }
  .header .run-info { font-size: 0.82rem; color: #6e7681; margin-bottom: 16px; }

  .stats-row {
    display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px;
  }
  .stat-pill {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; background: #161616; border: 1px solid #1e1e1e;
    border-radius: 20px; font-size: 0.82rem;
  }
  .stat-pill .stat-num {
    font-weight: 700; font-family: 'SF Mono', 'Fira Code', monospace;
  }
  .stat-approved .stat-num { color: #3fb950; }
  .stat-pending .stat-num { color: #d29922; }
  .stat-rejected .stat-num { color: #f85149; }
  .stat-errors .stat-num { color: #f85149; }
  .stat-warnings .stat-num { color: #d29922; }
  .stat-items .stat-num { color: #e6edf3; }

  /* Filters */
  .filters {
    display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;
  }
  .filter-btn {
    padding: 6px 14px; border: 1px solid #1e1e1e; border-radius: 6px;
    background: #111; color: #8b949e; font-size: 0.78rem; cursor: pointer;
    transition: all 0.15s;
  }
  .filter-btn:hover { border-color: #30363d; color: #c9d1d9; }
  .filter-btn.active { border-color: #58a6ff; color: #58a6ff; background: rgba(88,166,255,0.08); }

  /* Person cards */
  .person-card {
    border: 1px solid #1e1e1e; border-radius: 10px; margin-bottom: 12px;
    overflow: hidden; background: #111;
  }
  .person-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px; cursor: pointer; user-select: none;
    background: #141414; transition: background 0.15s; gap: 12px;
  }
  .person-header:hover { background: #1a1a1a; }
  .person-title { flex: 1; min-width: 0; }
  .person-name { font-weight: 600; color: #e6edf3; font-size: 0.95rem; }
  .person-meta { font-size: 0.75rem; color: #6e7681; margin-left: 8px; }
  .person-summary { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .moment-count {
    font-size: 0.72rem; color: #6e7681; background: #1e1e1e;
    padding: 2px 8px; border-radius: 10px;
  }
  .toggle-icon { font-size: 0.7rem; color: #484f58; transition: transform 0.2s; }
  .person-card.collapsed .toggle-icon { transform: rotate(-90deg); }
  .person-body { padding: 0 16px 16px; border-top: 1px solid #1e1e1e; }
  .person-card.collapsed .person-body { display: none; }

  .entity-desc {
    font-size: 0.82rem; color: #8b949e; padding: 12px 0 8px;
    border-bottom: 1px solid #1a1a1a; margin-bottom: 8px;
  }

  /* Story info */
  .story-info {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    padding: 8px 0; font-size: 0.82rem;
  }
  .story-label { color: #6e7681; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .story-meta { color: #484f58; font-size: 0.72rem; }
  .story-desc { font-size: 0.78rem; color: #6e7681; padding-bottom: 8px; }

  /* Moment cards */
  .moments-list { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
  .moment-card {
    padding: 12px; background: #161616; border-radius: 8px;
    border-left: 3px solid #2d2d2d;
  }
  .moment-card.moment-warning { border-left-color: #d29922; }
  .moment-card.moment-error { border-left-color: #f85149; }
  .moment-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .moment-name { font-weight: 600; color: #e6edf3; font-size: 0.88rem; flex: 1; }
  .moment-subtitle { font-size: 0.78rem; color: #8b949e; font-style: italic; margin: 2px 0 4px; }
  .moment-meta {
    display: flex; gap: 12px; flex-wrap: wrap;
    font-size: 0.72rem; color: #6e7681; margin: 4px 0;
  }
  .moment-address { font-size: 0.72rem; color: #6e7681; }
  .moment-desc { font-size: 0.82rem; color: #8b949e; margin-top: 6px; line-height: 1.5; }
  .no-moments { font-size: 0.82rem; color: #484f58; font-style: italic; padding: 8px 0; }

  /* Badges */
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .badge-approved { background: rgba(63,185,80,0.15); color: #3fb950; }
  .badge-rejected { background: rgba(248,81,73,0.15); color: #f85149; }
  .badge-pending { background: rgba(210,153,34,0.15); color: #d29922; }

  /* Issues */
  .issue-count { font-size: 0.68rem; font-weight: 600; }
  .issue-errors { color: #f85149; }
  .issue-warnings { color: #d29922; }

  .validation-error, .validation-warning {
    font-size: 0.75rem; padding: 4px 0; margin-top: 4px;
  }
  .validation-error { color: #f85149; }
  .validation-warning { color: #d29922; }

  /* Responsive */
  @media (max-width: 600px) {
    .container { padding: 12px 8px 48px; }
    .person-meta { display: none; }
    .moment-meta { gap: 6px; }
    .stats-row { gap: 8px; }
    .stat-pill { padding: 4px 10px; font-size: 0.75rem; }
  }
</style>
</head>
<body>
<div class="container">

<div class="header">
  <h1>Run #${run.id} Review</h1>
  <div class="run-info">
    Source: ${esc(run.source)} | Started: ${esc(started)} | Generated: ${esc(timestamp)}
    ${runConfig.limit ? ` | Limit: ${runConfig.limit}` : ''}${runConfig.offset !== undefined ? ` | Offset: ${runConfig.offset}` : ''}
  </div>
  <div class="stats-row">
    <div class="stat-pill stat-items"><span class="stat-num">${total}</span> items</div>
    <div class="stat-pill stat-items"><span class="stat-num">${entityCount}</span> people</div>
    <div class="stat-pill stat-items"><span class="stat-num">${storyCount}</span> stories</div>
    <div class="stat-pill stat-items"><span class="stat-num">${momentCount}</span> moments</div>
  </div>
  <div class="stats-row">
    <div class="stat-pill stat-approved"><span class="stat-num">${approved}</span> approved</div>
    ${pending > 0 ? `<div class="stat-pill stat-pending"><span class="stat-num">${pending}</span> pending</div>` : ''}
    ${rejected > 0 ? `<div class="stat-pill stat-rejected"><span class="stat-num">${rejected}</span> rejected</div>` : ''}
    ${allErrors > 0 ? `<div class="stat-pill stat-errors"><span class="stat-num">${allErrors}</span> errors</div>` : ''}
    ${allWarnings > 0 ? `<div class="stat-pill stat-warnings"><span class="stat-num">${allWarnings}</span> warnings</div>` : ''}
  </div>
</div>

<div class="filters">
  <button class="filter-btn active" onclick="filterCards('all')">All</button>
  <button class="filter-btn" onclick="filterCards('warnings')">Warnings Only</button>
  <button class="filter-btn" onclick="filterCards('errors')">Errors Only</button>
  <button class="filter-btn" onclick="filterCards('pending')">Pending Only</button>
  <button class="filter-btn" onclick="toggleAll(true)">Expand All</button>
  <button class="filter-btn" onclick="toggleAll(false)">Collapse All</button>
</div>

${groupsHtml}

</div>

<script>
function togglePerson(i) {
  document.getElementById('person-' + i).classList.toggle('collapsed');
}

function toggleAll(expand) {
  document.querySelectorAll('.person-card').forEach(function(card) {
    if (expand) card.classList.remove('collapsed');
    else card.classList.add('collapsed');
  });
}

function filterCards(mode) {
  document.querySelectorAll('.filter-btn').forEach(function(btn) { btn.classList.remove('active'); });
  event.target.classList.add('active');

  document.querySelectorAll('.person-card').forEach(function(card) {
    var moments = card.querySelectorAll('.moment-card');
    if (mode === 'all') {
      card.style.display = '';
      moments.forEach(function(m) { m.style.display = ''; });
    } else if (mode === 'warnings') {
      var hasW = card.querySelector('.moment-warning, .moment-error');
      card.style.display = hasW ? '' : 'none';
      moments.forEach(function(m) {
        m.style.display = (m.classList.contains('moment-warning') || m.classList.contains('moment-error')) ? '' : 'none';
      });
      if (hasW) card.classList.remove('collapsed');
    } else if (mode === 'errors') {
      var hasE = card.querySelector('.moment-error');
      card.style.display = hasE ? '' : 'none';
      moments.forEach(function(m) {
        m.style.display = m.classList.contains('moment-error') ? '' : 'none';
      });
      if (hasE) card.classList.remove('collapsed');
    } else if (mode === 'pending') {
      var hasPending = card.querySelector('.badge-pending');
      card.style.display = hasPending ? '' : 'none';
      if (hasPending) card.classList.remove('collapsed');
    }
  });
}
</script>
</body>
</html>`;
}
