import type { Story, Moment } from '../types';

/**
 * Pre-built moment lookup map for performance.
 * Create once at app level, pass to resolveLocationsFromMap.
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
