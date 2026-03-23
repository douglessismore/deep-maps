#!/usr/bin/env npx tsx
/**
 * Deep Maps — Import ROADMAP.md into roadmap_items table.
 *
 * One-time script. Parses each `- [ ]` item from ROADMAP.md and inserts
 * into Supabase roadmap_items table.
 *
 * Usage:
 *   npx tsx scripts/import-roadmap.ts            # dry run (preview)
 *   npx tsx scripts/import-roadmap.ts --write    # actually insert into Supabase
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const DRY_RUN = !process.argv.includes('--write');

// ─── Section → category mapping ──────────────────────────────────────

const SECTION_MAP: Record<string, string> = {
  'immediate': 'immediate',
  'quick wins': 'immediate',
  'ux': 'ux',
  'frontend': 'ux',
  'content curation': 'content-curation',
  'content ideas': 'content-ideas',
  'thematic collections': 'content-ideas',
  'geographic gap-filling': 'content-ideas',
  'austin local': 'content-ideas',
  'data quality': 'tooling',
  'tooling': 'tooling',
  'architecture': 'architecture',
  'scaling': 'architecture',
  'business': 'business',
  'strategy': 'business',
  'monetization': 'business',
};

// ─── Priority mapping based on subsection headers ────────────────────

const PRIORITY_MAP: Record<string, 'high' | 'medium' | 'low'> = {
  'high priority': 'high',
  'in progress': 'high',
  'immediate': 'high',
  'quick wins': 'high',
  'top-down curation': 'medium',
  'medium priority': 'medium',
  'needed': 'medium',
  'low priority': 'low',
  'parked': 'low',
};

function resolveCategory(sectionName: string): string {
  const lower = sectionName.toLowerCase();
  for (const [key, cat] of Object.entries(SECTION_MAP)) {
    if (lower.includes(key)) return cat;
  }
  return 'tooling'; // fallback
}

function resolvePriority(subsection: string, section: string): 'high' | 'medium' | 'low' {
  const lowerSub = subsection.toLowerCase();
  for (const [key, pri] of Object.entries(PRIORITY_MAP)) {
    if (lowerSub.includes(key)) return pri;
  }
  // If main section is Immediate, default to high
  if (section.toLowerCase().includes('immediate')) return 'high';
  return 'medium'; // fallback
}

interface ParsedItem {
  title: string;
  description: string | null;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'done';
}

function parseRoadmap(content: string): ParsedItem[] {
  const lines = content.split('\n');
  const items: ParsedItem[] = [];

  let currentSection = '';
  let currentSubsection = '';

  for (const line of lines) {
    // Track h2 sections (## ...)
    const h2Match = line.match(/^## .+?\s+(.+)/);
    if (h2Match) {
      currentSection = h2Match[1].trim();
      currentSubsection = '';
      continue;
    }

    // Track h3 subsections (### ...)
    const h3Match = line.match(/^### (.+)/);
    if (h3Match) {
      currentSubsection = h3Match[1].trim();
      continue;
    }

    // Skip completed items
    if (line.match(/^- \[x\]/i)) continue;

    // Parse unchecked items: - [ ] **Title** — description
    const itemMatch = line.match(/^- \[ \] \*\*(.+?)\*\*\s*(?:—\s*(.+))?$/);
    if (itemMatch) {
      const title = itemMatch[1].trim();
      const description = itemMatch[2]?.trim() || null;

      items.push({
        title,
        description,
        category: resolveCategory(currentSection),
        priority: resolvePriority(currentSubsection || currentSection, currentSection),
        status: 'todo',
      });
      continue;
    }

    // Parse simple unchecked items without bold: - [ ] Some text
    const simpleMatch = line.match(/^- \[ \] (.+)$/);
    if (simpleMatch) {
      const text = simpleMatch[1].trim();
      items.push({
        title: text,
        description: null,
        category: resolveCategory(currentSection),
        priority: resolvePriority(currentSubsection || currentSection, currentSection),
        status: 'todo',
      });
    }
  }

  return items;
}

async function main() {
  const roadmapPath = path.resolve(import.meta.dirname, '..', 'ROADMAP.md');
  const content = fs.readFileSync(roadmapPath, 'utf-8');
  const items = parseRoadmap(content);

  console.log(`Parsed ${items.length} items from ROADMAP.md\n`);

  // Group by category for preview
  const byCategory: Record<string, ParsedItem[]> = {};
  for (const item of items) {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  }

  for (const [cat, catItems] of Object.entries(byCategory)) {
    console.log(`\n  ${cat} (${catItems.length}):`);
    for (const item of catItems) {
      console.log(`    [${item.priority}] ${item.title}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n--- DRY RUN --- Pass --write to insert into Supabase.\n');
    return;
  }

  // Insert into Supabase
  console.log('\nInserting into Supabase...');

  const rows = items.map((item, i) => ({
    title: item.title,
    description: item.description,
    category: item.category,
    priority: item.priority,
    status: item.status,
    sort_order: i,
  }));

  const { data, error } = await sb
    .from('roadmap_items')
    .insert(rows)
    .select('id');

  if (error) {
    console.error('Insert error:', error);
    process.exit(1);
  }

  console.log(`Inserted ${data?.length ?? 0} roadmap items.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
