import type { Story, Moment } from '../types';

/**
 * Resolves a story's moment references into full Moment objects.
 * Returns Moment[] in the same order as story.moments.
 *
 * This is the primary backward-compatibility bridge during migration.
 * Moment is structurally compatible with StoryLocation (same fields + entityIds),
 * so the returned array works everywhere StoryLocation[] was used.
 */
export function resolveLocations(story: Story, allMoments: Moment[]): Moment[] {
  const momentMap = new Map(allMoments.map((m) => [m.id, m]));
  return story.moments
    .map((sm) => momentMap.get(sm.momentId))
    .filter((m): m is Moment => m !== undefined);
}

/**
 * Pre-built moment lookup map for performance.
 * Create once at app level, pass to resolveLocations or use directly.
 */
export function buildMomentMap(allMoments: Moment[]): Map<string, Moment> {
  return new Map(allMoments.map((m) => [m.id, m]));
}

/**
 * Resolves locations using a pre-built map (faster for repeated calls).
 */
export function resolveLocationsFromMap(
  story: Story,
  momentMap: Map<string, Moment>,
): Moment[] {
  return story.moments
    .map((sm) => momentMap.get(sm.momentId))
    .filter((m): m is Moment => m !== undefined);
}
