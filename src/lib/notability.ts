import type { Moment, Story } from '../types';

// ── Tier Definitions ─────────────────────────────────────────────────
// Calibrated to v0.2 composite scoring distribution.
// Natural composite ceiling is ~88 (no moment maxes all 3 signals).
// Thresholds shifted to match the actual data distribution (Tufte principle).

export const NOTABILITY_TIERS = [
  { name: 'S', min: 82, max: 100, label: 'World zoom — civilizational anchors' },
  { name: 'A', min: 65, max: 81, label: 'Continental zoom — globally significant' },
  { name: 'B', min: 45, max: 64, label: 'Country zoom — nationally significant' },
  { name: 'C', min: 25, max: 44, label: 'Regional zoom — locally notable' },
  { name: 'D', min: 5, max: 24, label: 'City/local zoom — deep cuts' },
] as const;

/** Default notability for moments without a computed score (treat as locally notable). */
const DEFAULT_NOTABILITY = 30;

// ── Zoom → Threshold Mapping ─────────────────────────────────────────
// Determines the MINIMUM notability score a moment needs to be visible at a given zoom.
// Critical rule: threshold is a FLOOR, not a CEILING.
// At zoom 10 (threshold=16), a moment with score 88 is STILL visible.

/** Anti-flicker hysteresis buffer (±points). */
const HYSTERESIS = 3;

/**
 * Get the notability threshold for a given zoom level.
 * Moments with notability >= this threshold are visible.
 *
 * At zoom 2-3 (world): only S-tier civilizational anchors (82+)
 * At zoom 11+: everything visible (threshold = 0)
 * Linear interpolation between.
 */
export function getNotabilityThreshold(zoom: number): number {
  if (zoom >= 11) return 0;     // Street level: show everything
  if (zoom <= 2) return 82;     // World zoom: civilizational anchors only
  // Linear interpolation from zoom 3 (threshold=72) to zoom 10 (threshold=8)
  return Math.round(72 - ((zoom - 3) * 8));
}

/**
 * Get threshold with hysteresis to prevent marker flicker during smooth zooming.
 * When zooming IN (revealing more), use a slightly lower threshold.
 * When zooming OUT (hiding more), use a slightly higher threshold.
 */
export function getNotabilityThresholdWithHysteresis(
  zoom: number,
  previousThreshold: number
): number {
  const baseThreshold = getNotabilityThreshold(zoom);
  if (baseThreshold < previousThreshold) {
    // Zooming in — reveal markers slightly earlier
    return Math.max(0, baseThreshold - HYSTERESIS);
  } else if (baseThreshold > previousThreshold) {
    // Zooming out — hide markers slightly later
    return baseThreshold + HYSTERESIS;
  }
  return baseThreshold;
}

// ── Effective Notability ─────────────────────────────────────────────

/**
 * Get the effective notability score for a moment.
 * Returns the moment's notability if set, otherwise DEFAULT_NOTABILITY.
 */
export function getEffectiveNotability(moment: Moment): number {
  return moment.notability ?? DEFAULT_NOTABILITY;
}

// ── Primary Moment Logic ─────────────────────────────────────────────

/**
 * Determine which moment is the "primary" representative for a story at low zoom.
 *
 * Resolution order:
 * 1. Explicit `isPrimary: true` on a StoryMoment → that moment
 * 2. First moment in the story's moments array (default)
 *
 * Returns the momentId of the primary moment.
 */
export function getPrimaryMomentId(story: Story): string | null {
  if (story.moments.length === 0) return null;

  // Check for explicit isPrimary flag
  const explicit = story.moments.find(sm => sm.isPrimary);
  if (explicit) return explicit.momentId;

  // Default: first moment in array
  return story.moments[0].momentId;
}

/**
 * Build a Set of all primary moment IDs across all stories.
 * Used for quick lookup during filtering.
 */
export function buildPrimaryMomentSet(stories: Story[]): Set<string> {
  const primaryIds = new Set<string>();
  for (const story of stories) {
    const primaryId = getPrimaryMomentId(story);
    if (primaryId) primaryIds.add(primaryId);
  }
  return primaryIds;
}

// ── Tier Classification ──────────────────────────────────────────────

/**
 * Get the tier name for a notability score.
 */
export function getNotabilityTier(score: number): string {
  for (const tier of NOTABILITY_TIERS) {
    if (score >= tier.min && score <= tier.max) return tier.name;
  }
  return 'ARCHIVE';
}
