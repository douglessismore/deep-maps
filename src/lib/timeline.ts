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
