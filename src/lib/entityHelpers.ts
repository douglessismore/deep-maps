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

/** All entity locations for map display: moment + first parent story. */
export function getEntityLocations(
  entityId: string
): Array<{ location: Moment; story: Story }> {
  return getEntityMomentStories(entityId)
    .filter(({ stories: s }) => s.length > 0)
    .map(({ moment, stories: s }) => ({ location: moment, story: s[0] }));
}
