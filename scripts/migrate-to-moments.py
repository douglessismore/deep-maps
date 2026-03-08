#!/usr/bin/env python3
"""
Deep Maps — Migration Script: Story Architecture Redesign (Phase 1)

Converts the embedded StoryLocation model to the Moments-First model:
  - Extracts all story.locations[] → top-level Moment objects in moments.ts
  - Converts story.locations[] → story.moments: StoryMoment[] references
  - Adds storyType field to each story
  - Generates initial entities.ts from cross-story analysis
  - Preserves ALL existing fields (wikiSection, links, media, etc.)

Usage: python3 scripts/migrate-to-moments.py
"""

import json
import subprocess
import sys
import re
from collections import defaultdict
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
SRC_DATA = PROJECT_ROOT / "src" / "data"


def load_stories_via_tsx():
    """Use tsx to parse stories.ts and return JSON."""
    result = subprocess.run(
        ["npx", "tsx", "-e",
         "import { stories } from './src/data/stories'; "
         "console.log(JSON.stringify(stories, null, 0))"],
        cwd=str(PROJECT_ROOT),
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"ERROR: tsx failed:\n{result.stderr}", file=sys.stderr)
        sys.exit(1)
    # tsx may print npm warnings to stderr; JSON is on stdout
    # Filter out npm warn lines from stdout just in case
    lines = result.stdout.strip().split('\n')
    json_line = [l for l in lines if l.startswith('[')]
    if not json_line:
        print(f"ERROR: No JSON output from tsx.\nstdout: {result.stdout[:500]}", file=sys.stderr)
        sys.exit(1)
    return json.loads(json_line[0])


def infer_story_type(story):
    """Infer storyType from story content and tags."""
    sid = story['id']
    name = story['name'].lower()
    tags = [t.lower() for t in story.get('tags', [])]
    desc = story.get('description', '').lower()

    # Explicit biography indicators
    bio_tags = {'biography', 'life-story', 'historical-figure', 'profile'}
    bio_keywords_name = ['life', 'legacy', 'story of', 'rise and fall']
    if bio_tags & set(tags):
        return 'biography'
    if any(kw in name for kw in bio_keywords_name):
        return 'biography'

    # Place-history indicators
    place_tags = {'venue', 'landmark', 'architecture', 'place-history', 'neighborhood',
                  'venue-history', 'historical-venue', 'music-venue'}
    place_keywords = ['history of', 'the story of the', 'venue', 'building', 'hotel',
                      'theater', 'theatre', 'bar', 'saloon', 'garden', 'park',
                      'university', 'campus', 'bridge', 'road', 'river', 'cemetery']
    if place_tags & set(tags):
        return 'place'
    # Check if the story name is primarily a place name (not a person)
    # Heuristic: if it has place-related tags or description keywords
    if any(kw in name for kw in place_keywords):
        return 'place'

    # Era indicators
    era_tags = {'era', 'period', 'movement', 'cultural-movement'}
    era_keywords = ['era', 'movement', 'golden age', 'period', 'years of']
    if era_tags & set(tags):
        return 'era'
    if any(kw in name for kw in era_keywords):
        return 'era'

    # Default: incident (specific events, crimes, disasters, etc.)
    return 'incident'


def extract_entities(stories):
    """Extract entities from story data based on cross-references and patterns."""
    entities = {}
    person_appearances = defaultdict(list)  # person_name -> [story_ids]

    for story in stories:
        tags = story.get('tags', [])
        sid = story['id']

        # People mentioned in tags
        for tag in tags:
            # Tags that are clearly person-related
            if tag in ('serial-killer', 'historical-figure', 'musician', 'outlaw',
                       'politician', 'author', 'artist', 'activist', 'entrepreneur'):
                # The story itself might be about a person
                pass

        # If story looks like a biography, the story name is likely a person
        story_type = infer_story_type(story)
        if story_type == 'biography':
            # Use story name as entity, slug from story id
            eid = sid
            if eid not in entities:
                entities[eid] = {
                    'id': eid,
                    'name': story['name'],
                    'type': 'person',
                    'years': story.get('years'),
                    'description': story.get('description', '')[:200],
                    'canonicalStoryId': sid,
                    'wikipediaSlug': story.get('wikipediaSlug'),
                }

        # Extract notable places that could be entities
        if story_type == 'place':
            eid = sid
            if eid not in entities:
                entities[eid] = {
                    'id': eid,
                    'name': story['name'],
                    'type': 'place',
                    'years': story.get('years'),
                    'description': story.get('description', '')[:200],
                    'canonicalStoryId': sid,
                    'wikipediaSlug': story.get('wikipediaSlug'),
                }

    return list(entities.values())


def escape_ts_string(s):
    """Escape a string for use in TypeScript single-quoted strings."""
    if s is None:
        return None
    # Escape backslashes first, then single quotes
    s = s.replace('\\', '\\\\')
    s = s.replace("'", "\\'")
    # Handle any newlines
    s = s.replace('\n', '\\n')
    return s


def format_media(media_list):
    """Format media array as TypeScript."""
    if not media_list:
        return None
    items = []
    for m in media_list:
        parts = [f"type: '{m['type']}'", f"url: '{escape_ts_string(m['url'])}'"]
        if m.get('caption'):
            parts.append(f"caption: '{escape_ts_string(m['caption'])}'")
        items.append('{ ' + ', '.join(parts) + ' }')
    return '[' + ', '.join(items) + ']'


def format_links(links_list):
    """Format links array as TypeScript."""
    if not links_list:
        return None
    items = []
    for l in links_list:
        parts = [
            f"label: '{escape_ts_string(l['label'])}'",
            f"url: '{escape_ts_string(l['url'])}'",
            f"type: '{l['type']}'"
        ]
        items.append('{ ' + ', '.join(parts) + ' }')
    return '[' + ', '.join(items) + ']'


def format_string_array(arr):
    """Format a string array as TypeScript."""
    return '[' + ', '.join(f"'{escape_ts_string(s)}'" for s in arr) + ']'


def write_moments_ts(moments, output_path):
    """Write moments.ts file."""
    lines = [
        "import type { Moment } from '../types';",
        "",
        "export const moments: Moment[] = [",
    ]

    for m in moments:
        lines.append("  {")
        lines.append(f"    id: '{escape_ts_string(m['id'])}',")
        lines.append(f"    name: '{escape_ts_string(m['name'])}',")
        lines.append(f"    subtitle: '{escape_ts_string(m['subtitle'])}',")
        lines.append(f"    description: '{escape_ts_string(m['description'])}',")
        lines.append(f"    lat: {m['lat']},")
        lines.append(f"    lng: {m['lng']},")
        lines.append(f"    type: '{m['type']}',")
        lines.append(f"    importance: '{m['importance']}',")
        lines.append(f"    accuracy: '{m['accuracy']}',")

        if m.get('year') is not None:
            lines.append(f"    year: {m['year']},")
        if m.get('date'):
            lines.append(f"    date: '{escape_ts_string(m['date'])}',")
        if m.get('address'):
            lines.append(f"    address: '{escape_ts_string(m['address'])}',")
        if m.get('entityIds'):
            lines.append(f"    entityIds: {format_string_array(m['entityIds'])},")
        if m.get('media'):
            lines.append(f"    media: {format_media(m['media'])},")
        if m.get('wikiSection'):
            lines.append(f"    wikiSection: '{escape_ts_string(m['wikiSection'])}',")
        if m.get('links'):
            lines.append(f"    links: {format_links(m['links'])},")

        lines.append("  },")

    lines.append("];")
    lines.append("")

    output_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f"  ✓ Wrote {len(moments)} moments to {output_path.name}")


def write_entities_ts(entities, output_path):
    """Write entities.ts file."""
    lines = [
        "import type { Entity } from '../types';",
        "",
        "export const entities: Entity[] = [",
    ]

    for e in entities:
        lines.append("  {")
        lines.append(f"    id: '{escape_ts_string(e['id'])}',")
        lines.append(f"    name: '{escape_ts_string(e['name'])}',")
        lines.append(f"    type: '{e['type']}',")

        if e.get('years'):
            lines.append(f"    years: '{escape_ts_string(e['years'])}',")
        if e.get('description'):
            lines.append(f"    description: '{escape_ts_string(e['description'])}',")
        if e.get('canonicalStoryId'):
            lines.append(f"    canonicalStoryId: '{escape_ts_string(e['canonicalStoryId'])}',")
        if e.get('wikipediaSlug'):
            lines.append(f"    wikipediaSlug: '{escape_ts_string(e['wikipediaSlug'])}',")

        lines.append("  },")

    lines.append("];")
    lines.append("")

    output_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f"  ✓ Wrote {len(entities)} entities to {output_path.name}")


def write_stories_ts(stories, output_path):
    """Write updated stories.ts with moments references instead of embedded locations."""
    lines = [
        "import type { Story } from '../types';",
        "",
        "export const stories: Story[] = [",
    ]

    for s in stories:
        lines.append("  {")
        lines.append(f"    id: '{escape_ts_string(s['id'])}',")
        lines.append(f"    name: '{escape_ts_string(s['name'])}',")

        if s.get('nickname'):
            lines.append(f"    nickname: '{escape_ts_string(s['nickname'])}',")

        lines.append(f"    years: '{escape_ts_string(s['years'])}',")
        lines.append(f"    category: '{s['category']}',")
        lines.append(f"    storyType: '{s['storyType']}',")
        lines.append(f"    description: '{escape_ts_string(s['description'])}',")
        lines.append(f"    tags: {format_string_array(s['tags'])},")

        if s.get('contentWarning'):
            lines.append(f"    contentWarning: '{escape_ts_string(s['contentWarning'])}',")

        # Write moments references
        if s['moments']:
            if len(s['moments']) <= 3:
                # Compact format for short lists
                moment_refs = ', '.join(
                    f"{{ momentId: '{escape_ts_string(sm['momentId'])}' }}"
                    for sm in s['moments']
                )
                lines.append(f"    moments: [{moment_refs}],")
            else:
                lines.append("    moments: [")
                for sm in s['moments']:
                    if sm.get('narrativeGlue'):
                        lines.append(f"      {{ momentId: '{escape_ts_string(sm['momentId'])}', narrativeGlue: '{escape_ts_string(sm['narrativeGlue'])}' }},")
                    else:
                        lines.append(f"      {{ momentId: '{escape_ts_string(sm['momentId'])}' }},")
                lines.append("    ],")
        else:
            lines.append("    moments: [],")

        if s.get('relatedStoryIds'):
            lines.append(f"    relatedStoryIds: {format_string_array(s['relatedStoryIds'])},")
        if s.get('wikipediaSlug'):
            lines.append(f"    wikipediaSlug: '{escape_ts_string(s['wikipediaSlug'])}',")

        lines.append("  },")

    lines.append("];")
    lines.append("")

    output_path.write_text('\n'.join(lines), encoding='utf-8')
    print(f"  ✓ Wrote {len(stories)} stories to {output_path.name}")


def main():
    print("Deep Maps — Migration: Story Architecture Redesign")
    print("=" * 55)

    # Step 1: Load current stories
    print("\n1. Loading stories via tsx...")
    stories = load_stories_via_tsx()
    print(f"   Loaded {len(stories)} stories")

    total_locations = sum(len(s.get('locations', [])) for s in stories)
    print(f"   Total embedded locations: {total_locations}")

    # Step 2: Extract all locations as moments
    print("\n2. Extracting moments from story locations...")
    all_moments = []
    moment_ids_seen = set()
    duplicate_ids = []

    for story in stories:
        for loc in story.get('locations', []):
            mid = loc['id']
            if mid in moment_ids_seen:
                duplicate_ids.append((mid, story['id']))
                continue
            moment_ids_seen.add(mid)

            # Create moment from location (1:1 field mapping)
            moment = {
                'id': loc['id'],
                'name': loc['name'],
                'subtitle': loc['subtitle'],
                'description': loc['description'],
                'lat': loc['lat'],
                'lng': loc['lng'],
                'type': loc['type'],
                'importance': loc['importance'],
                'accuracy': loc['accuracy'],
            }

            # Optional fields
            if loc.get('year') is not None:
                moment['year'] = loc['year']
            if loc.get('date'):
                moment['date'] = loc['date']
            if loc.get('address'):
                moment['address'] = loc['address']
            if loc.get('media'):
                moment['media'] = loc['media']
            if loc.get('wikiSection'):
                moment['wikiSection'] = loc['wikiSection']
            if loc.get('links'):
                moment['links'] = loc['links']

            # entityIds left empty for now — Phase 2 Gemini task
            all_moments.append(moment)

    if duplicate_ids:
        print(f"   ⚠ Found {len(duplicate_ids)} duplicate moment IDs:")
        for mid, sid in duplicate_ids:
            print(f"     - '{mid}' in story '{sid}' (skipped, using first occurrence)")

    print(f"   Extracted {len(all_moments)} unique moments")

    # Step 3: Infer story types
    print("\n3. Inferring story types...")
    type_counts = defaultdict(int)
    for story in stories:
        st = infer_story_type(story)
        story['storyType'] = st
        type_counts[st] += 1
    for t, c in sorted(type_counts.items()):
        print(f"   {t}: {c}")

    # Step 4: Convert story locations to moment references
    print("\n4. Converting stories to moment references...")
    for story in stories:
        story['moments'] = [
            {'momentId': loc['id']}
            for loc in story.get('locations', [])
        ]
        # Remove old locations field
        if 'locations' in story:
            del story['locations']

    # Step 5: Extract entities
    print("\n5. Extracting entities...")
    entities = extract_entities(stories)
    entity_types = defaultdict(int)
    for e in entities:
        entity_types[e['type']] += 1
    for t, c in sorted(entity_types.items()):
        print(f"   {t}: {c}")
    print(f"   Total entities: {len(entities)}")

    # Step 6: Write output files
    print("\n6. Writing output files...")
    write_moments_ts(all_moments, SRC_DATA / "moments.ts")
    write_entities_ts(entities, SRC_DATA / "entities.ts")
    write_stories_ts(stories, SRC_DATA / "stories.ts")

    # Summary
    print("\n" + "=" * 55)
    print("Migration complete!")
    print(f"  Moments: {len(all_moments)}")
    print(f"  Entities: {len(entities)}")
    print(f"  Stories: {len(stories)} (now using moment references)")
    print(f"\nNext: Update types/index.ts Story interface + run tsc --noEmit")


if __name__ == '__main__':
    main()
