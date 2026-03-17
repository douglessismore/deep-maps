import type { Story, StoryCategory } from '../types';

export interface TimelinePoint {
  storyId: string;
  name: string;
  startYear: number; // -21000 for 21,000 BC
  endYear: number; // same as start for single-year stories
  category: StoryCategory;
}

/**
 * Parse the "years" string from a Story into numeric [start, end].
 *
 * Handles all formats in the dataset:
 *   "1954–1957"      → [1954, 1957]
 *   "~21,000 BC"     → [-21000, -21000]
 *   "1980–present"   → [1980, 2026]
 *   "850–1150 AD"    → [850, 1150]
 *   "1692"           → [1692, 1692]
 *   "~11,000 BC"     → [-11000, -11000]
 */
export function parseYears(str: string): [number, number] {
  // Normalize: strip tilde, replace en-dash/em-dash with hyphen
  const cleaned = str.replace(/~/g, '').replace(/[–—]/g, '-').trim();

  // Check for "present"
  const hasPresent = /present/i.test(cleaned);
  const withoutPresent = cleaned.replace(/-?\s*present/i, '').trim();

  // Check for BC / AD suffix (can be at end of entire string or on individual parts)
  const overallBC = /\bBC\b/i.test(withoutPresent);
  // AD suffix stripped along with BC but only BC negates the year
  const stripped = withoutPresent.replace(/\s*(BC|AD)\b/gi, '').trim();

  // Split on hyphen that separates two year values (not negative sign)
  // Pattern: a number, then hyphen, then another number
  const rangeMatch = stripped.match(/^([\d,]+)\s*-\s*([\d,]+)$/);

  if (rangeMatch) {
    let start = parseInt(rangeMatch[1].replace(/,/g, ''), 10);
    let end = parseInt(rangeMatch[2].replace(/,/g, ''), 10);
    if (overallBC) {
      start = -start;
      end = -end;
      // BC ranges: "21,000-11,000 BC" → start should be more negative
      if (start > end) [start, end] = [end, start];
    }
    return [start, end];
  }

  // Single year
  const singleMatch = stripped.match(/^([\d,]+)$/);
  if (singleMatch) {
    let year = parseInt(singleMatch[1].replace(/,/g, ''), 10);
    if (overallBC) year = -year;
    if (hasPresent) return [year, 2026];
    return [year, year];
  }

  // Fallback for "YYYY-present" after stripping
  const presentMatch = stripped.match(/([\d,]+)/);
  if (presentMatch && hasPresent) {
    let year = parseInt(presentMatch[1].replace(/,/g, ''), 10);
    if (overallBC) year = -year;
    return [year, 2026];
  }

  // Last resort — try to extract any number
  const nums = stripped.match(/\d+/g);
  if (nums && nums.length >= 2) {
    return [parseInt(nums[0], 10), parseInt(nums[1], 10)];
  }
  if (nums && nums.length === 1) {
    const y = parseInt(nums[0], 10);
    return [overallBC ? -y : y, overallBC ? -y : y];
  }

  // Shouldn't reach here with valid data
  return [0, 0];
}

/**
 * Pre-parse all stories into TimelinePoints for the timeline visualization.
 */
export function getTimelinePoints(stories: Story[]): TimelinePoint[] {
  return stories.map((s) => {
    const [startYear, endYear] = parseYears(s.years);
    return {
      storyId: s.id,
      name: s.name,
      startYear,
      endYear,
      category: s.category,
    };
  });
}

/**
 * Generate smart tick mark years for a given visible range.
 * Returns an array of year values where labels should appear.
 */
export function getTickYears(viewStart: number, viewEnd: number): number[] {
  const span = viewEnd - viewStart;
  if (span <= 0) return [];

  // Choose interval based on visible span
  let interval: number;
  if (span > 10000) interval = 5000;
  else if (span > 2000) interval = 1000;
  else if (span > 500) interval = 200;
  else if (span > 200) interval = 100;
  else if (span > 80) interval = 50;
  else if (span > 30) interval = 10;
  else interval = 5;

  // Find first tick at or after viewStart, aligned to interval
  const firstTick = Math.ceil(viewStart / interval) * interval;
  const ticks: number[] = [];

  for (let y = firstTick; y <= viewEnd; y += interval) {
    ticks.push(y);
  }

  return ticks;
}

/**
 * Format a year number for display.
 * -21000 → "21000 BC"
 * 0      → "1 AD"
 * 1960   → "1960"
 */
export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BC`;
  if (year === 0) return '1 AD';
  return `${year}`;
}

/**
 * Compute the densest range containing ~80% of dots (tightest window).
 * Used for the smart default zoom so the timeline starts showing
 * the most interesting cluster instead of mostly empty space.
 */
export function getDenseRange(points: TimelinePoint[]): [number, number] {
  if (points.length <= 3) return getDataRange(points);

  const years = points.map((p) => p.startYear).sort((a, b) => a - b);
  const windowSize = Math.max(2, Math.ceil(years.length * 0.8));

  let bestStart = years[0];
  let bestEnd = years[years.length - 1];
  let bestSpan = bestEnd - bestStart;

  for (let i = 0; i <= years.length - windowSize; i++) {
    const span = years[i + windowSize - 1] - years[i];
    if (span < bestSpan) {
      bestSpan = span;
      bestStart = years[i];
      bestEnd = years[i + windowSize - 1];
    }
  }

  // Add padding (10% of span, min 30 years)
  const pad = Math.max(bestSpan * 0.1, 30);
  return [bestStart - pad, bestEnd + pad];
}

/**
 * Compute the full data range across all stories (with padding).
 */
export function getDataRange(points: TimelinePoint[]): [number, number] {
  if (points.length === 0) return [-21000, 2026];
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    if (p.startYear < min) min = p.startYear;
    if (p.endYear > max) max = p.endYear;
  }
  // Add modest padding — enough to see edge dots, but not hundreds of empty years
  const pad = Math.min(Math.max((max - min) * 0.01, 5), 30);
  return [min - pad, max + pad];
}

// ── Adaptive (non-linear) timeline scale ──
// Each era gets screen width proportional to log₂(storyCount + 1),
// not proportional to elapsed time. This prevents ancient eras with
// few events from being compressed to invisible slivers.

export const ERAS = [
  { id: 'origins', label: 'Origins', start: -25000, end: -3000 },
  { id: 'ancient', label: 'Ancient', start: -3000, end: 500 },
  { id: 'medieval', label: 'Medieval', start: 500, end: 1500 },
  { id: 'earlymodern', label: 'Early Modern', start: 1500, end: 1800 },
  { id: 'industrial', label: 'Industrial', start: 1800, end: 1914 },
  { id: 'c20', label: '20th Century', start: 1914, end: 2000 },
  { id: 'now', label: 'Now', start: 2000, end: 2030 },
] as const;

export type EraId = typeof ERAS[number]['id'];

export interface EraWeight {
  id: EraId;
  label: string;
  start: number;
  end: number;
  count: number;
  weight: number;
  /** Pixel offset of this era's left edge (set by layout) */
  xStart: number;
  /** Pixel width of this era's segment (set by layout) */
  width: number;
}

/**
 * Compute era weights from story data.
 * Weight = log₂(count + 1), with a minimum of 0.3 so empty eras
 * still get a sliver of space rather than disappearing entirely.
 */
export function getEraWeights(points: TimelinePoint[], totalWidth: number): EraWeight[] {
  const weights = ERAS.map((era) => {
    const count = points.filter(
      (p) => p.startYear >= era.start && p.startYear < era.end
    ).length;
    return {
      id: era.id,
      label: era.label,
      start: era.start,
      end: era.end,
      count,
      weight: Math.max(Math.log2(count + 1), 0.3),
      xStart: 0,
      width: 0,
    };
  });

  const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
  let xOffset = 0;
  for (const w of weights) {
    w.width = (w.weight / totalWeight) * totalWidth;
    w.xStart = xOffset;
    xOffset += w.width;
  }

  return weights;
}

/**
 * Map a year to a pixel X position using adaptive era-weighted scale.
 * Within each era, years are mapped linearly across that era's pixel segment.
 */
export function yearToAdaptiveX(year: number, weights: EraWeight[]): number {
  // Find which era this year falls into
  for (const w of weights) {
    if (year >= w.start && year < w.end) {
      const ratio = (year - w.start) / (w.end - w.start);
      return w.xStart + ratio * w.width;
    }
  }
  // Before first era
  if (year < weights[0].start) return 0;
  // After last era — clamp to end
  const last = weights[weights.length - 1];
  return last.xStart + last.width;
}

/**
 * Map a pixel X position back to a year using adaptive era-weighted scale.
 * Inverse of yearToAdaptiveX.
 */
export function adaptiveXToYear(x: number, weights: EraWeight[]): number {
  for (const w of weights) {
    if (x >= w.xStart && x < w.xStart + w.width) {
      const ratio = w.width > 0 ? (x - w.xStart) / w.width : 0;
      return w.start + ratio * (w.end - w.start);
    }
  }
  // Before first era
  if (x < 0) return weights[0].start;
  // After last era
  const last = weights[weights.length - 1];
  return last.end;
}

/**
 * Find which era a year belongs to.
 */
export function getEraForYear(year: number): EraId {
  for (const era of ERAS) {
    if (year >= era.start && year < era.end) return era.id;
  }
  // Edge cases
  if (year < ERAS[0].start) return ERAS[0].id;
  return ERAS[ERAS.length - 1].id;
}
