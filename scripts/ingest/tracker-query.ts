#!/usr/bin/env npx tsx
/**
 * Deep Maps — Tracker Query Script
 *
 * Queries Supabase for ingestion status of all 507 people in top-people.json.
 * Outputs a JSON blob to stdout for embedding in tracker.html.
 *
 * Usage:
 *   npx tsx scripts/ingest/tracker-query.ts > /tmp/tracker-data.json
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

// --- Supabase client (service role for full read access) ---
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TopPerson {
  rank: number;
  deepMapsScore: number;
  name: string;
  birthYear: number;
  deathYear: number;
  occupation: string;
  continent: string;
  wikipediaSlug: string;
}

interface TrackerRow {
  rank: number;
  name: string;
  score: number;
  birthYear: number;
  continent: string;
  occupation: string;
  status: 'complete' | 'partial' | 'not_started';
  entityId: string | null;
  storyId: string | null;
  momentCount: number;
  wikipediaSlug: string;
}

async function main() {
  // 1. Load top-people.json
  const topPeople: TopPerson[] = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data/top-people.json'), 'utf-8')
  );
  console.error(`Loaded ${topPeople.length} people from top-people.json`);

  // 2. Query all person entities
  const { data: entities, error: entErr } = await supabase
    .from('entities')
    .select('id, name, type, canonical_story_id, wikipedia_slug')
    .eq('type', 'person');

  if (entErr) {
    console.error('Error fetching entities:', entErr);
    process.exit(1);
  }
  console.error(`Found ${entities?.length ?? 0} person entities in Supabase`);

  // 3. Query all stories (for matching)
  const { data: stories, error: storyErr } = await supabase
    .from('stories')
    .select('id, name, story_type')
    .eq('story_type', 'biography');

  if (storyErr) {
    console.error('Error fetching stories:', storyErr);
    process.exit(1);
  }
  console.error(`Found ${stories?.length ?? 0} biography stories`);

  // 4. Query story_moments counts for all biography stories
  const storyIds = (stories ?? []).map(s => s.id);

  // Batch query moment counts per story
  let momentCounts: Record<string, number> = {};
  if (storyIds.length > 0) {
    const { data: storyMoments, error: smErr } = await supabase
      .from('story_moments')
      .select('story_id, moment_id')
      .in('story_id', storyIds);

    if (smErr) {
      console.error('Error fetching story_moments:', smErr);
      process.exit(1);
    }

    for (const sm of storyMoments ?? []) {
      momentCounts[sm.story_id] = (momentCounts[sm.story_id] || 0) + 1;
    }
  }

  // 5. Build lookup maps
  // Match by wikipedia_slug (most reliable) or by name
  const entityBySlug = new Map<string, typeof entities[0]>();
  const entityByName = new Map<string, typeof entities[0]>();
  for (const e of entities ?? []) {
    if (e.wikipedia_slug) entityBySlug.set(e.wikipedia_slug.toLowerCase(), e);
    entityByName.set(e.name.toLowerCase(), e);
  }

  // 6. Build tracker rows
  const rows: TrackerRow[] = topPeople.map(person => {
    // Try to find matching entity
    const entity =
      entityBySlug.get(person.wikipediaSlug?.toLowerCase()) ??
      entityByName.get(person.name.toLowerCase()) ??
      null;

    const entityId = entity?.id ?? null;
    const storyId = entity?.canonical_story_id ?? null;
    const mCount = storyId ? (momentCounts[storyId] ?? 0) : 0;

    let status: TrackerRow['status'] = 'not_started';
    if (entityId && storyId && mCount >= 4) {
      status = 'complete';
    } else if (entityId || storyId || mCount > 0) {
      status = 'partial';
    }

    return {
      rank: person.rank,
      name: person.name,
      score: person.deepMapsScore,
      birthYear: person.birthYear,
      continent: person.continent || 'Unknown',
      occupation: person.occupation,
      status,
      entityId,
      storyId,
      momentCount: mCount,
      wikipediaSlug: person.wikipediaSlug,
    };
  });

  // 7. Output
  const summary = {
    total: rows.length,
    complete: rows.filter(r => r.status === 'complete').length,
    partial: rows.filter(r => r.status === 'partial').length,
    notStarted: rows.filter(r => r.status === 'not_started').length,
    generatedAt: new Date().toISOString(),
  };

  console.error(`\nSummary: ${summary.complete} complete, ${summary.partial} partial, ${summary.notStarted} not started`);

  // Output JSON to stdout
  console.log(JSON.stringify({ summary, rows }, null, 2));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
