import type { Entity, Moment, Story } from '../types';
import { entities } from '../data/entities';
import { moments } from '../data/moments';
import { stories } from '../data/stories';

/** Pre-built entity lookup map for O(1) access by ID. */
export const entityMap: Map<string, Entity> = new Map(
  entities.map((e) => [e.id, e])
);

/** All moments that reference this entity (sorted by year ascending, nulls at end). */
export function getMomentsForEntity(entityId: string): Moment[] {
  return moments
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
    ? stories.find((s) => s.id === entity.canonicalStoryId)
    : null;

  const canonicalMoments = canonicalStory
    ? canonicalStory.moments
        .map((sm) => moments.find((m) => m.id === sm.momentId))
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
    const parentStories = stories.filter((s) =>
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

export interface EntityWithCounts {
  entity: Entity;
  momentCount: number;
  storyCount: number;
}

/** Entities that have moments in the given set of moment IDs. Sorted by moment count desc. */
export function getViewportEntities(
  viewportMomentIds: Set<string>
): EntityWithCounts[] {
  const result: EntityWithCounts[] = [];
  for (const entity of entities) {
    const entries = getEntityMomentStories(entity.id);
    const inViewport = entries.filter(({ moment }) =>
      viewportMomentIds.has(moment.id)
    );
    if (inViewport.length === 0) continue;
    const storyIds = new Set(
      entries.flatMap(({ stories: s }) => s.map((st) => st.id))
    );
    result.push({
      entity,
      momentCount: entries.length,
      storyCount: storyIds.size,
    });
  }
  return result.sort((a, b) => b.momentCount - a.momentCount);
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
