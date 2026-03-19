#!/usr/bin/env npx tsx
/**
 * Deep Maps — Review CLI
 *
 * Terminal-based review interface for AI-drafted content.
 * Review, approve, edit, or reject items from the review queue.
 *
 * Usage:
 *   npx tsx scripts/ingest/review.ts --run 1                # review items from run #1
 *   npx tsx scripts/ingest/review.ts --run 1 --publish      # publish approved items
 *   npx tsx scripts/ingest/review.ts --run 1 --auto-approve # auto-approve items with 0 errors
 *   npx tsx scripts/ingest/review.ts --run 1 --generate-review  # generate HTML review page
 *   npx tsx scripts/ingest/review.ts --list                 # list all ingestion runs
 *   npx tsx scripts/ingest/review.ts --stats                # show review queue stats
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import * as readline from 'readline';
import { getSupabase, publishApproved } from './lib/pipeline.js';
import { generateReviewHtml } from './lib/review-html.js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// ── CLI Args ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const RUN_ID = getArg('run') ? parseInt(getArg('run')!, 10) : undefined;
const DO_PUBLISH = hasFlag('publish');
const AUTO_APPROVE = hasFlag('auto-approve');
const GEN_REVIEW = hasFlag('generate-review');
const LIST_RUNS = hasFlag('list');
const SHOW_STATS = hasFlag('stats');
const FILTER_TYPE = getArg('type'); // 'moment', 'story', 'entity'

// ── Formatting Helpers ───────────────────────────────────────────────

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function c(color: keyof typeof COLORS, text: string): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function divider(): void {
  console.log(c('dim', '─'.repeat(60)));
}

function formatMoment(data: Record<string, unknown>): void {
  console.log(`  ${c('bold', data.name as string)}`);
  if (data.subtitle) console.log(`  ${c('italic', data.subtitle as string)}`);
  console.log(`  ${c('dim', `Year: ${data.year || '?'} | Type: ${data.type_id || data.type || '?'} | Importance: ${data.importance || '?'}`)}`);
  console.log(`  ${c('dim', `Accuracy: ${data.accuracy || '?'} | Lat: ${data.lat || '?'}, Lng: ${data.lng || '?'}`)}`);
  if (data.address) console.log(`  ${c('dim', `Address: ${data.address}`)}`);
  if (data.notability) console.log(`  ${c('dim', `Notability: ${data.notability}`)}`);
  console.log('');
  if (data.description) {
    const desc = data.description as string;
    // Word wrap at ~70 chars
    const words = desc.split(' ');
    let line = '  ';
    for (const word of words) {
      if (line.length + word.length > 72) {
        console.log(line);
        line = '  ';
      }
      line += word + ' ';
    }
    if (line.trim()) console.log(line);
  }
}

function formatEntity(data: Record<string, unknown>): void {
  console.log(`  ${c('bold', data.name as string)}`);
  console.log(`  ${c('dim', `Type: ${data.type} | Years: ${data.years || '?'}`)}`);
  if (data.wikipedia_slug || data.wikipediaSlug) {
    console.log(`  ${c('dim', `Wikipedia: ${data.wikipedia_slug || data.wikipediaSlug}`)}`);
  }
  console.log('');
  if (data.description) {
    const desc = data.description as string;
    const words = desc.split(' ');
    let line = '  ';
    for (const word of words) {
      if (line.length + word.length > 72) {
        console.log(line);
        line = '  ';
      }
      line += word + ' ';
    }
    if (line.trim()) console.log(line);
  }
}

function formatStory(data: Record<string, unknown>): void {
  console.log(`  ${c('bold', data.name as string)}`);
  console.log(`  ${c('dim', `Type: ${data.story_type || data.storyType} | Category: ${data.category} | Years: ${data.years || '?'}`)}`);
  if (data.tags) console.log(`  ${c('dim', `Tags: ${(data.tags as string[]).join(', ')}`)}`);
  if (data.wikipedia_slug || data.wikipediaSlug) {
    console.log(`  ${c('dim', `Wikipedia: ${data.wikipedia_slug || data.wikipediaSlug}`)}`);
  }
  console.log('');
  if (data.description) {
    const desc = data.description as string;
    const words = desc.split(' ');
    let line = '  ';
    for (const word of words) {
      if (line.length + word.length > 72) {
        console.log(line);
        line = '  ';
      }
      line += word + ' ';
    }
    if (line.trim()) console.log(line);
  }
}

function formatItem(item: Record<string, unknown>): void {
  const data = item.draft_data as Record<string, unknown>;
  const type = item.item_type as string;

  console.log(`\n${c('cyan', type.toUpperCase())}: ${c('bold', (item.item_id || data.id) as string)}`);
  divider();

  switch (type) {
    case 'moment':
      formatMoment(data);
      break;
    case 'entity':
      formatEntity(data);
      break;
    case 'story':
      formatStory(data);
      break;
    default:
      console.log(`  ${JSON.stringify(data, null, 2).slice(0, 500)}`);
  }

  // Show validation errors if any
  const errors = item.validation_errors as Array<{ field: string; message: string; severity: string }> | null;
  if (errors && errors.length > 0) {
    console.log('');
    for (const err of errors) {
      const icon = err.severity === 'error' ? c('red', '❌') : c('yellow', '⚡');
      console.log(`  ${icon} ${err.field}: ${err.message}`);
    }
  }
}

// ── Interactive Review ───────────────────────────────────────────────

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function reviewItems(runId: number): Promise<void> {
  const sb = getSupabase();

  // Fetch pending items
  let query = sb
    .from('review_queue')
    .select('*')
    .eq('ingestion_run_id', runId)
    .eq('status', 'pending')
    .order('item_type')
    .order('id');

  if (FILTER_TYPE) {
    query = query.eq('item_type', FILTER_TYPE);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error(`Failed to fetch items: ${error.message}`);
    return;
  }

  if (!items || items.length === 0) {
    console.log(c('green', '\n✓ No pending items to review.'));
    return;
  }

  // Count by type
  const typeCounts = new Map<string, number>();
  for (const item of items) {
    typeCounts.set(item.item_type, (typeCounts.get(item.item_type) || 0) + 1);
  }

  console.log(`\n📋 ${c('bold', `Review Queue: ${items.length} pending items`)} (Run #${runId})`);
  for (const [type, count] of typeCounts) {
    console.log(`  ${type}: ${count}`);
  }
  console.log('');
  console.log(c('dim', 'Commands: (a)pprove | (r)eject | (s)kip | (A)pprove all remaining | (q)uit'));

  let approved = 0;
  let rejected = 0;
  let skipped = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`\n${c('dim', `[${i + 1}/${items.length}]`)} ────────────────────────────────`);
    formatItem(item);
    console.log('');

    const answer = await promptUser(
      `  ${c('green', 'a')}pprove | ${c('red', 'r')}eject | ${c('yellow', 's')}kip | ${c('green', 'A')}ll remaining | ${c('red', 'q')}uit > `
    );

    switch (answer) {
      case 'a':
        await sb
          .from('review_queue')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .eq('id', item.id);
        console.log(c('green', '  ✓ Approved'));
        approved++;
        break;

      case 'r':
        const reason = await promptUser('  Rejection reason (optional): ');
        await sb
          .from('review_queue')
          .update({
            status: 'rejected',
            reviewer_notes: reason || null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', item.id);
        console.log(c('red', '  ✗ Rejected'));
        rejected++;
        break;

      case 's':
        console.log(c('yellow', '  → Skipped'));
        skipped++;
        break;

      case 'A': // Approve all remaining
      case 'all': {
        const remaining = items.slice(i);
        const ids = remaining.map(r => r.id);
        await sb
          .from('review_queue')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .in('id', ids);
        approved += remaining.length;
        console.log(c('green', `  ✓ Approved all ${remaining.length} remaining items`));
        i = items.length; // exit loop
        break;
      }

      case 'q':
      case 'quit':
        console.log('\nExiting review.');
        i = items.length; // exit loop
        break;

      default:
        console.log(c('yellow', '  → Skipped (unrecognized command)'));
        skipped++;
    }
  }

  divider();
  console.log(`\n📊 Review summary:`);
  console.log(`  ${c('green', `Approved: ${approved}`)}`);
  console.log(`  ${c('red', `Rejected: ${rejected}`)}`);
  console.log(`  ${c('yellow', `Skipped: ${skipped}`)}`);

  if (approved > 0) {
    console.log(`\n  To publish approved items:`);
    console.log(`  ${c('cyan', `npx tsx scripts/ingest/review.ts --run ${runId} --publish`)}`);
  }
}

// ── List Runs ────────────────────────────────────────────────────────

async function listRuns(): Promise<void> {
  const sb = getSupabase();
  const { data: runs, error } = await sb
    .from('ingestion_runs')
    .select('*')
    .order('id', { ascending: false })
    .limit(20);

  if (error) {
    console.error(`Failed to fetch runs: ${error.message}`);
    return;
  }

  if (!runs || runs.length === 0) {
    console.log('No ingestion runs found.');
    return;
  }

  console.log(`\n📋 ${c('bold', 'Ingestion Runs')}\n`);
  console.log(`${'ID'.padEnd(5)} ${'Source'.padEnd(20)} ${'Status'.padEnd(12)} ${'Started'.padEnd(22)} Config`);
  divider();

  for (const run of runs) {
    const started = run.started_at ? new Date(run.started_at).toLocaleString() : '?';
    const config = run.config ? JSON.stringify(run.config) : '';
    const statusColor = run.status === 'completed' ? 'green' : run.status === 'failed' ? 'red' : 'yellow';
    console.log(
      `${String(run.id).padEnd(5)} ${(run.source || '').padEnd(20)} ${c(statusColor, (run.status || '').padEnd(12))} ${started.padEnd(22)} ${config.slice(0, 40)}`
    );
  }
}

// ── Stats ────────────────────────────────────────────────────────────

async function showStats(): Promise<void> {
  const sb = getSupabase();

  // Count by status
  const { data: items, error } = await sb
    .from('review_queue')
    .select('status, item_type');

  if (error) {
    console.error(`Failed to fetch stats: ${error.message}`);
    return;
  }

  if (!items || items.length === 0) {
    console.log('Review queue is empty.');
    return;
  }

  const byStatus = new Map<string, number>();
  const byType = new Map<string, number>();
  for (const item of items) {
    byStatus.set(item.status, (byStatus.get(item.status) || 0) + 1);
    byType.set(item.item_type, (byType.get(item.item_type) || 0) + 1);
  }

  console.log(`\n📊 ${c('bold', 'Review Queue Stats')}\n`);
  console.log('By status:');
  for (const [status, count] of byStatus) {
    const color = status === 'approved' ? 'green' : status === 'rejected' ? 'red' : status === 'pending' ? 'yellow' : 'dim';
    console.log(`  ${c(color, status.padEnd(12))} ${count}`);
  }
  console.log('\nBy type:');
  for (const [type, count] of byType) {
    console.log(`  ${type.padEnd(12)} ${count}`);
  }
  console.log(`\nTotal: ${items.length}`);
}

// ── Publish ──────────────────────────────────────────────────────────

async function publish(runId: number): Promise<void> {
  console.log(`\n📤 Publishing approved items from run #${runId}...\n`);
  const counts = await publishApproved(runId);
  console.log(`\n${c('green', '✓ Publishing complete.')}`);
  for (const [key, count] of Object.entries(counts)) {
    console.log(`  ${key}: ${count}`);
  }
}

// ── Auto-Approve ────────────────────────────────────────────────────

async function autoApprove(runId: number): Promise<void> {
  const sb = getSupabase();

  const { data: items, error } = await sb
    .from('review_queue')
    .select('*')
    .eq('ingestion_run_id', runId)
    .eq('status', 'pending')
    .order('item_type')
    .order('id');

  if (error) {
    console.error(`Failed to fetch items: ${error.message}`);
    return;
  }

  if (!items || items.length === 0) {
    console.log(c('green', '\n✓ No pending items to auto-approve.'));
    return;
  }

  // Split into clean (0 errors) and dirty (has errors)
  const clean: number[] = [];
  const dirty: Array<{ id: number; item_type: string; item_id: string; errors: Array<{ field: string; message: string; severity: string }> }> = [];

  for (const item of items) {
    const errors = (item.validation_errors as Array<{ field: string; message: string; severity: string }>) || [];
    const hasErrors = errors.some(e => e.severity === 'error');
    if (hasErrors) {
      dirty.push({ id: item.id, item_type: item.item_type, item_id: item.item_id, errors });
    } else {
      clean.push(item.id);
    }
  }

  // Auto-approve clean items
  if (clean.length > 0) {
    // Supabase .in() has a limit, batch if needed
    const BATCH = 100;
    for (let i = 0; i < clean.length; i += BATCH) {
      const batch = clean.slice(i, i + BATCH);
      await sb
        .from('review_queue')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewer_notes: 'auto-approved (0 errors)',
        })
        .in('id', batch);
    }
  }

  console.log(`\n${c('bold', `Auto-approve results for Run #${runId}:`)}`);
  console.log(`  ${c('green', `✓ Auto-approved: ${clean.length} items`)} (0 validation errors)`);

  if (dirty.length > 0) {
    console.log(`  ${c('red', `✗ Needs manual review: ${dirty.length} items`)} (have validation errors)`);
    console.log('');
    for (const d of dirty) {
      console.log(`  ${c('yellow', d.item_type)} ${d.item_id}`);
      for (const err of d.errors.filter(e => e.severity === 'error')) {
        console.log(`    ${c('red', '❌')} ${err.field}: ${err.message}`);
      }
    }
    console.log(`\n  Review manually: ${c('cyan', `npx tsx scripts/ingest/review.ts --run ${runId}`)}`);
  } else {
    console.log(c('green', '  All items approved — no manual review needed.'));
  }

  if (clean.length > 0) {
    console.log(`\n  Generate review page: ${c('cyan', `npx tsx scripts/ingest/review.ts --run ${runId} --generate-review`)}`);
    console.log(`  Publish: ${c('cyan', `npx tsx scripts/ingest/review.ts --run ${runId} --publish`)}`);
  }
}

// ── Generate Review HTML ────────────────────────────────────────────

async function generateReview(runId: number): Promise<void> {
  const sb = getSupabase();

  // Fetch run info
  const { data: run, error: runError } = await sb
    .from('ingestion_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (runError || !run) {
    console.error(`Run #${runId} not found.`);
    return;
  }

  // Fetch all items (not just pending)
  const { data: items, error } = await sb
    .from('review_queue')
    .select('*')
    .eq('ingestion_run_id', runId)
    .order('item_type')
    .order('id');

  if (error) {
    console.error(`Failed to fetch items: ${error.message}`);
    return;
  }

  if (!items || items.length === 0) {
    console.log('No items found for this run.');
    return;
  }

  const html = generateReviewHtml(
    { id: run.id, source: run.source, started_at: run.started_at, config: run.config },
    items,
  );

  const outPath = resolve(ROOT, `review-run-${runId}.html`);
  writeFileSync(outPath, html, 'utf-8');
  console.log(`\n${c('green', '✓')} Review page written to ${c('cyan', outPath)}`);
  console.log(`  Open in browser to scan ${items.length} items grouped by person.`);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  if (LIST_RUNS) {
    await listRuns();
  } else if (SHOW_STATS) {
    await showStats();
  } else if (RUN_ID !== undefined) {
    if (DO_PUBLISH) {
      await publish(RUN_ID);
    } else if (AUTO_APPROVE) {
      await autoApprove(RUN_ID);
    } else if (GEN_REVIEW) {
      await generateReview(RUN_ID);
    } else {
      await reviewItems(RUN_ID);
    }
  } else {
    console.log('Deep Maps — Review CLI');
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx scripts/ingest/review.ts --list                   List ingestion runs');
    console.log('  npx tsx scripts/ingest/review.ts --stats                  Show queue stats');
    console.log('  npx tsx scripts/ingest/review.ts --run N                  Review items from run N');
    console.log('  npx tsx scripts/ingest/review.ts --run N --type X         Filter by type');
    console.log('  npx tsx scripts/ingest/review.ts --run N --auto-approve   Auto-approve clean items');
    console.log('  npx tsx scripts/ingest/review.ts --run N --generate-review  Generate HTML review page');
    console.log('  npx tsx scripts/ingest/review.ts --run N --publish        Publish approved items');
  }
}

main().catch(err => {
  console.error('\n💀 Review CLI failed:', err);
  process.exit(1);
});
