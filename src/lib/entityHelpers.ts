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
 *  Sorted by year ascending. */
export function getEntityMomentStories(
  entityId: string
): Array<{ moment: Moment; stories: Story[] }> {
  const entityMoments = getMomentsForEntity(entityId);
  return entityMoments.map((moment) => {
    const parentStories = stories.filter((s) =>
      s.moments.some((sm) => sm.momentId === moment.id)
    );
    return { moment, stories: parentStories };
  });
}

/** All entity locations for map display: moment + first parent story. */
export function getEntityLocations(
  entityId: string
): Array<{ location: Moment; story: Story }> {
  return getEntityMomentStories(entityId)
    .filter(({ stories: s }) => s.length > 0)
    .map(({ moment, stories: s }) => ({ location: moment, story: s[0] }));
}
