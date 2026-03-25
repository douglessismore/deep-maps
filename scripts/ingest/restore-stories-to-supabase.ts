#!/usr/bin/env npx tsx
/**
 * Restore 46 deleted stories to Supabase.
 * Reads from /tmp/deleted-stories.json (extracted from git history).
 * Inserts stories + story_moments join table entries.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { readFileSync } from 'fs';
import { getSupabase } from './lib/pipeline.js';

const DRY_RUN = process.argv.includes('--dry-run');

interface DeletedStory {
  id: string;
  name: string;
  nickname?: string;
  years: string;
  category: string;
  storyType: string;
  description: string;
  tags: string[];
  contentWarning?: string;
  momentIds: string[];
  relatedStoryIds: string[];
  wikipediaSlug?: string;
}

async function main() {
  const sb = getSupabase();
  const stories: DeletedStory[] = JSON.parse(readFileSync('/tmp/deleted-stories.json', 'utf-8'));

  console.log(`Restoring ${stories.length} stories to Supabase ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  let momentsLinked = 0;

  for (const s of stories) {
    // Check if story already exists
    const { data: existing } = await sb.from('stories').select('id').eq('id', s.id).single();
    if (existing) {
      console.log(`⏭ ${s.id} already exists`);
      skipped++;
      continue;
    }

    console.log(`→ ${s.id}: "${s.name}" (${s.category}, ${s.momentIds.length} moments)`);

    if (DRY_RUN) {
      inserted++;
      continue;
    }

    // Parse years for start_year/end_year
    const yearsMatch = s.years.match(/(-?\d+)/g);
    const startYear = yearsMatch ? parseInt(yearsMatch[0], 10) : null;
    const endYear = yearsMatch && yearsMatch.length > 1 ? parseInt(yearsMatch[1], 10) : null;

    // Insert story
    const { error: storyErr } = await sb.from('stories').insert({
      id: s.id,
      name: s.name,
      nickname: s.nickname ?? null,
      years: s.years,
      category: s.category,
      story_type: s.storyType,
      description: s.description,
      tags: s.tags,
      content_warning: s.contentWarning ?? null,
      wikipedia_slug: s.wikipediaSlug ?? null,
      start_year: startYear,
      end_year: endYear,
    });

    if (storyErr) {
      console.error(`  ❌ Story insert: ${storyErr.message}`);
      errors++;
      continue;
    }

    // Insert story_moments links
    for (let i = 0; i < s.momentIds.length; i++) {
      const momentId = s.momentIds[i];

      // Check if the moment exists
      const { data: moment } = await sb.from('moments').select('id').eq('id', momentId).single();
      if (!moment) {
        console.log(`  ⚠ Moment ${momentId} not in Supabase — skipping link`);
        continue;
      }

      const { error: linkErr } = await sb.from('story_moments').insert({
        story_id: s.id,
        moment_id: momentId,
        sort_order: i,
        is_primary: i === 0,
      });

      if (linkErr) {
        // Might already exist from another story
        if (!linkErr.message.includes('duplicate')) {
          console.log(`  ⚠ Link failed ${momentId}: ${linkErr.message}`);
        }
      } else {
        momentsLinked++;
      }
    }

    // Insert related_stories links
    for (const relatedId of s.relatedStoryIds) {
      await sb.from('related_stories').insert({
        story_id: s.id,
        related_story_id: relatedId,
      }).then(() => {}).catch(() => {}); // Ignore errors (related story may not exist yet)
    }

    console.log(`  ✓ Inserted + ${s.momentIds.length} moment links`);
    inserted++;
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Moments linked: ${momentsLinked}`);
  console.log(`═══════════════════════════════════════`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
