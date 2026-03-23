import type { Entity, Moment, Story } from '../types';
import { getEffectiveNotability } from './notability';

// ─── Module-scope data (set once via initEntityHelpers) ──────────────
let _entities: Entity[] = [];
let _moments: Moment[] = [];
let _stories: Story[] = [];

/** Pre-built entity lookup map for O(1) access by ID. */
export let entityMap: Map<string, Entity> = new Map();

/** Pre-built set of story IDs that are person biographies claimed by an entity.
 *  Only these are suppressed from the browse list — the entity card replaces them.
 *  A story is suppressed when: (1) it has storyType 'biography', and (2) at least
 *  one person entity claims it via canonicalStoryId. */
export let canonicalStoryIds: Set<string> = new Set();

/**
 * Initialize entity helpers with loaded data. Must be called once before
 * any helper function is used. Safe to call multiple times (idempotent).
 */
export function initEntityHelpers(entities: Entity[], moments: Moment[], stories: Story[]): void {
  _entities = entities;
  _moments = moments;
  _stories = stories;

  entityMap = new Map(entities.map((e) => [e.id, e]));

  const biographyStoryIds = new Set(
    stories.filter(s => s.storyType === 'biography').map(s => s.id)
  );
  canonicalStoryIds = new Set(
    entities
      .filter((e) => e.canonicalStoryId && biographyStoryIds.has(e.canonicalStoryId))
      .map((e) => e.canonicalStoryId!)
  );
}

/** All moments that reference this entity (sorted by year ascending, nulls at end). */
export function getMomentsForEntity(entityId: string): Moment[] {
  return _moments
    .filter((m) => m.entityIds?.includes(entityId))
    .sort((a, b) => {
      if (a.year == null && b.year == null) return 0;
      if (a.year == null) return 1;
      if (b.year == null) return -1;
      return a.year - b.year;
    });
}

/** All moments for an entity, each paired with the stories that reference it.
 *  Merges entityId-tagged moments with canonicalStory moments (safety net for
 *  untagged moments). Sorted by year ascending, nulls at end. */
export function getEntityMomentStories(
  entityId: string
): Array<{ moment: Moment; stories: Story[] }> {
  // Primary source: moments explicitly tagged with this entityId
  const taggedMoments = getMomentsForEntity(entityId);
  const seenIds = new Set(taggedMoments.map((m) => m.id));

  // Secondary source: moments from the canonical story (catches untagged moments)
  const entity = entityMap.get(entityId);
  const canonicalStory = entity?.canonicalStoryId
    ? _stories.find((s) => s.id === entity.canonicalStoryId)
    : null;

  const canonicalMoments = canonicalStory
    ? canonicalStory.moments
        .map((sm) => _moments.find((m) => m.id === sm.momentId))
        .filter((m): m is Moment => m != null && !seenIds.has(m.id))
    : [];

  // Merge and sort chronologically
  const allMoments = [...taggedMoments, ...canonicalMoments].sort((a, b) => {
    if (a.year == null && b.year == null) return 0;
    if (a.year == null) return 1;
    if (b.year == null) return -1;
    return a.year - b.year;
  });

  return allMoments.map((moment) => {
    const parentStories = _stories.filter((s) =>
      s.moments.some((sm) => sm.momentId === moment.id)
    );
    return { moment, stories: parentStories };
  });
}

/** For place entities: collect all person-type entities that appear on the same moments.
 *  Returns unique person entities sorted alphabetically, excluding the place itself. */
export function getNotableFigures(placeEntityId: string): Entity[] {
  const entityMoments = getEntityMomentStories(placeEntityId);
  const personIds = new Set<string>();
  for (const { moment } of entityMoments) {
    for (const eid of moment.entityIds ?? []) {
      if (eid !== placeEntityId) personIds.add(eid);
    }
  }
  return Array.from(personIds)
    .map((id) => entityMap.get(id))
    .filter((e): e is Entity => e != null && e.type === 'person')
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** For person entities: collect all place-type entities that appear on the same moments.
 *  Returns unique place entities sorted alphabetically, excluding the person itself.
 *  Mirrors getNotableFigures — but person → place direction. */
export function getKeyLocations(personEntityId: string): Entity[] {
  const entityMoments = getEntityMomentStories(personEntityId);
  const placeIds = new Set<string>();
  for (const { moment } of entityMoments) {
    for (const eid of moment.entityIds ?? []) {
      if (eid !== personEntityId) placeIds.add(eid);
    }
  }
  return Array.from(placeIds)
    .map((id) => entityMap.get(id))
    .filter((e): e is Entity => e != null && e.type === 'place')
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** All entity locations for map display: moment + first parent story. */
export function getEntityLocations(
  entityId: string
): Array<{ location: Moment; story: Story }> {
  return getEntityMomentStories(entityId)
    .filter(({ stories: s }) => s.length > 0)
    .map(({ moment, stories: s }) => ({ location: moment, story: s[0] }));
}

/** All unique stories that contain moments for this entity. Sorted by earliest year. */
export function getEntityStories(entityId: string): Story[] {
  const entries = getEntityMomentStories(entityId);
  const seenIds = new Set<string>();
  const result: Story[] = [];
  for (const { stories: parentStories } of entries) {
    for (const s of parentStories) {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        result.push(s);
      }
    }
  }
  return result.sort((a, b) => {
    const aYear = a.years ? parseInt(a.years) : Infinity;
    const bYear = b.years ? parseInt(b.years) : Infinity;
    return aYear - bYear;
  });
}

/** All unique entities referenced by a story's moments, sorted by frequency desc. */
export function getStoryEntities(storyId: string): Array<{ entity: Entity; momentCount: number; storyCount: number }> {
  const story = _stories.find(s => s.id === storyId);
  if (!story) return [];

  const entityCounts = new Map<string, number>();
  for (const sm of story.moments) {
    const moment = _moments.find(m => m.id === sm.momentId);
    if (!moment?.entityIds) continue;
    for (const eid of moment.entityIds) {
      entityCounts.set(eid, (entityCounts.get(eid) || 0) + 1);
    }
  }

  const result: Array<{ entity: Entity; momentCount: number; storyCount: number; maxNotability: number }> = [];
  for (const [eid, count] of entityCounts) {
    const entity = entityMap.get(eid);
    if (!entity) continue;
    const entries = getEntityMomentStories(eid);
    const storyIds = new Set(entries.flatMap(({ stories: s }) => s.map((st) => st.id)).filter(id => !canonicalStoryIds.has(id)));
    const maxNotability = entries.length > 0
      ? Math.max(...entries.map(({ moment }) => getEffectiveNotability(moment)))
      : 0;
    result.push({ entity, momentCount: count, storyCount: storyIds.size, maxNotability });
  }

  return result.sort((a, b) => b.momentCount - a.momentCount);
}

/** Reverse lookup: given a story ID, return the entity that owns it as canonical (if any). */
export function getEntityForCanonicalStory(storyId: string): Entity | undefined {
  return _entities.find((e) => e.canonicalStoryId === storyId);
}

export interface EntityWithCounts {
  entity: Entity;
  momentCount: number;
  storyCount: number;
  maxNotability: number;
}

/** Entities that have moments in the given set of moment IDs. Sorted by moment count desc. */
export function getViewportEntities(
  viewportMomentIds: Set<string>
): EntityWithCounts[] {
  const result: EntityWithCounts[] = [];
  for (const entity of _entities) {
    const entries = getEntityMomentStories(entity.id);
    const inViewport = entries.filter(({ moment }) =>
      viewportMomentIds.has(moment.id)
    );
    if (inViewport.length === 0) continue;
    const storyIds = new Set(
      entries.flatMap(({ stories: s }) => s.map((st) => st.id))
    );
    const maxNotability = entries.length > 0
      ? Math.max(...entries.map(({ moment }) => getEffectiveNotability(moment)))
      : 0;
    result.push({
      entity,
      momentCount: entries.length,
      storyCount: storyIds.size,
      maxNotability,
    });
  }
  return result.sort((a, b) => b.momentCount - a.momentCount);
}

/** Entity type → icon emoji. Handles `work` subtypes (film, book, etc.) */
export function getEntityIcon(entity: Entity): string {
  if (entity.type === 'work') {
    switch (entity.workType) {
      case 'film': return '🎬';
      case 'tv-show': return '📺';
      case 'album': return '🎵';
      case 'scripture': return '📜';
      default: return '📚'; // book, journal, paper, or unspecified
    }
  }
  switch (entity.type) {
    case 'person': return '👤';
    case 'organization': return '🏛';
    case 'concept': return '💡';
    case 'place':
    default: return '📍';
  }
}

/** Get a single display initial from entity name — "O. Henry" → "H", "Texas State Cemetery" → "T" */
export function getInitial(name: string): string {
  const words = name.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
  if (words.length >= 2) {
    // If first word is a single initial (e.g. "O."), use second word
    if (words[0].length <= 2) return words[1][0].toUpperCase();
    return words[0][0].toUpperCase();
  }
  return words[0][0].toUpperCase();
}

/** Group entities alphabetically by first letter of name. */
export function groupAlphabetically(
  entities: EntityWithCounts[]
): Map<string, EntityWithCounts[]> {
  const groups = new Map<string, EntityWithCounts[]>();
  const sorted = [...entities].sort((a, b) =>
    a.entity.name.localeCompare(b.entity.name)
  );
  for (const item of sorted) {
    const letter = item.entity.name[0].toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(item);
  }
  return groups;
}
