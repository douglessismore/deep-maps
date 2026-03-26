/**
 * Constellation icon generator — creates SVG icons for map cluster markers.
 *
 * Nine visual variants (toggled in MapView for rapid comparison):
 * - classic:  Donut ring + dark fill + count text (original data-forward design)
 * - glass:    Frosted glass portal + thin ring (map blurs through via CSS backdrop-filter)
 * - rings:    Concentric depth rings, fully transparent (suggests layers to explore)
 * - luminous: Single glowing outline, maximum minimalism (just a ring of light)
 * - wisps:    Miyazaki-inspired floating dots (HTML elements, not SVG)
 * - minimal:  Tufte-inspired tiny dot + always-visible count (data speaks for itself)
 *
 * Count shows at 0.4 opacity at rest, 1.0 on hover (CSS .constellation-count).
 * Minimal variant shows count at 0.85 always — the count IS the design.
 * Visual language: "portals you can fall into"
 */

import { CATEGORIES } from './categories';
import type { StoryCategory } from '../types';
import type { ConstellationClusterProps } from './clustering';

// ── Types ─────────────────────────────────────────────────────────────

export type ConstellationVariant = 'classic' | 'glass' | 'rings' | 'luminous' | 'wisps' | 'minimal' | 'essence' | 'palimpsest' | 'emergence';

// ── Render mode discriminator ─────────────────────────────────────────
// Most variants use Supercluster; emergence bypasses it entirely.

export type VariantRenderMode = 'clustered' | 'unclustered';

export function getVariantRenderMode(variant: ConstellationVariant): VariantRenderMode {
  if (variant === 'emergence') return 'unclustered';
  return 'clustered';
}

// ── Helpers ────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Size Calculation ───────────────────────────────────────────────────

const MIN_SIZE = 36;
const MAX_SIZE = 64;

/**
 * Compute icon diameter based on point count.
 * Uses log scale so a 200-point cluster isn't 20× bigger than a 10-point one.
 */
export function computeConstellationSize(pointCount: number): number {
  if (pointCount <= 2) return MIN_SIZE;
  // log2 scale: 2→36, 10→46, 50→55, 200→64
  const t = Math.log2(pointCount) / Math.log2(200);
  return Math.round(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.min(1, t));
}

// ── Shared: Build category ring segments ─────────────────────────────

interface RingConfig {
  center: number;
  radius: number;
  width: number;
  opacity: number;
}

interface RingResult {
  segments: string;
  sorted: [string, number][];
  dominantColor: string;
}

function buildRingSegments(
  categories: Record<string, number>,
  config: RingConfig,
): RingResult {
  const sorted = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0) as [string, number][];

  const total = sorted.reduce((sum, [, c]) => sum + c, 0);
  const circumference = 2 * Math.PI * config.radius;
  const dominantColor = CATEGORIES[sorted[0]?.[0] as StoryCategory]?.color || '#666';

  let segments = '';
  let offset = 0;

  if (sorted.length === 1) {
    segments = `<circle cx="${config.center}" cy="${config.center}" r="${config.radius}"
      fill="none" stroke="${dominantColor}" stroke-width="${config.width}"
      opacity="${config.opacity}" />`;
  } else {
    const gapPx = 2;
    for (const [category, catCount] of sorted) {
      const fraction = catCount / total;
      const segLen = fraction * circumference;
      const color = CATEGORIES[category as StoryCategory]?.color || '#666';
      const effectiveGap = segLen > gapPx * 3 ? gapPx : 0;
      const visibleLen = segLen - effectiveGap;

      if (visibleLen > 0) {
        segments += `<circle cx="${config.center}" cy="${config.center}" r="${config.radius}"
          fill="none" stroke="${color}" stroke-width="${config.width}"
          stroke-dasharray="${visibleLen} ${circumference - visibleLen}"
          stroke-dashoffset="${-offset - effectiveGap / 2}"
          stroke-linecap="round"
          opacity="${config.opacity}" />`;
      }
      offset += segLen;
    }
  }

  return { segments, sorted, dominantColor };
}

// ── Count label (HTML overlay for hover-reveal) ─────────────────────

/**
 * HTML count label positioned over the SVG. Hidden by default,
 * revealed on hover via CSS `.constellation-node:hover .constellation-count`.
 */
export function createCountLabel(point_count: number): string {
  const countStr = point_count >= 1000
    ? `${(point_count / 1000).toFixed(1)}k`
    : String(point_count);
  return `<span class="constellation-count">${countStr}</span>`;
}

// ── Variant: Classic (original donut chart) ─────────────────────────

function createClassicSVG(
  cluster: ConstellationClusterProps & { point_count: number },
): string {
  const { categories, point_count } = cluster;
  const size = computeConstellationSize(point_count);
  const center = size / 2;

  const ringWidth = 3.5;
  const outerPadding = 2;
  const ringRadius = center - outerPadding - ringWidth / 2;
  const innerRadius = ringRadius - ringWidth / 2 - 2;

  const { segments, dominantColor } = buildRingSegments(categories, {
    center, radius: ringRadius, width: ringWidth, opacity: 0.85,
  });

  const countStr = point_count >= 1000
    ? `${(point_count / 1000).toFixed(1)}k`
    : String(point_count);
  const fontSize = countStr.length > 2 ? 10 : 12;
  const glowRgba = hexToRgba(dominantColor, 0.07);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${center}" cy="${center}" r="${center - 1}" fill="${glowRgba}" />
    <circle cx="${center}" cy="${center}" r="${innerRadius}"
      fill="rgba(10, 10, 10, 0.88)"
      stroke="rgba(255, 255, 255, 0.06)" stroke-width="0.5" />
    <g transform="rotate(-90, ${center}, ${center})">
      ${segments}
    </g>
    <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central"
      fill="#e5e5e5" font-size="${fontSize}" font-family="'Space Grotesk', 'Courier New', monospace"
      font-weight="600" letter-spacing="0.5px">
      ${countStr}
    </text>
  </svg>`;
}

// ── Variant: Glass Portal ───────────────────────────────────────────
// CSS `backdrop-filter: blur()` on the wrapper div creates the frosted
// glass effect. The SVG just draws a thin category ring + tiny center dot.
// The map shows through, blurred, like looking into a portal.

function createGlassPortalSVG(
  cluster: ConstellationClusterProps & { point_count: number },
): string {
  const { categories } = cluster;
  const size = computeConstellationSize(cluster.point_count);
  const center = size / 2;

  const ringWidth = 2;
  const outerPadding = 3;
  const ringRadius = center - outerPadding - ringWidth / 2;

  const { segments, dominantColor } = buildRingSegments(categories, {
    center, radius: ringRadius, width: ringWidth, opacity: 0.7,
  });

  // Very subtle tint in the center — just enough color to hint at the dominant category
  const tintRgba = hexToRgba(dominantColor, 0.05);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${center}" cy="${center}" r="${ringRadius - ringWidth / 2 - 1}" fill="${tintRgba}" />
    <g transform="rotate(-90, ${center}, ${center})">
      ${segments}
    </g>
    <circle cx="${center}" cy="${center}" r="1.5" fill="rgba(255, 255, 255, 0.2)" />
  </svg>`;
}

// ── Variant: Depth Rings ────────────────────────────────────────────
// Three concentric rings at decreasing opacity suggest infinite depth.
// No fill whatsoever — fully transparent. The map shows through completely.
// Outer ring has category segments; middle and inner are subtle depth cues.

function createDepthRingsSVG(
  cluster: ConstellationClusterProps & { point_count: number },
): string {
  const { categories } = cluster;
  const size = computeConstellationSize(cluster.point_count);
  const center = size / 2;

  const outerPadding = 3;
  const outerR = center - outerPadding - 1;
  const midR = outerR * 0.65;
  const innerR = outerR * 0.35;

  const { segments, dominantColor } = buildRingSegments(categories, {
    center, radius: outerR, width: 2, opacity: 0.55,
  });

  const midRgba = hexToRgba(dominantColor, 0.18);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="rotate(-90, ${center}, ${center})">
      ${segments}
    </g>
    <circle cx="${center}" cy="${center}" r="${midR}"
      fill="none" stroke="${midRgba}" stroke-width="1"
      stroke-dasharray="3 3" />
    <circle cx="${center}" cy="${center}" r="${innerR}"
      fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="0.5" />
    <circle cx="${center}" cy="${center}" r="1.5" fill="rgba(255, 255, 255, 0.12)" />
  </svg>`;
}

// ── Variant: Luminous Outline ───────────────────────────────────────
// Maximum minimalism: a single thin glowing ring of category-colored light.
// A thicker transparent ring behind creates a soft glow effect without SVG filters.
// Nothing else — just a luminous presence floating on the map.

function createLuminousOutlineSVG(
  cluster: ConstellationClusterProps & { point_count: number },
): string {
  const { categories } = cluster;
  const size = computeConstellationSize(cluster.point_count);
  const center = size / 2;

  const outerPadding = 4;
  const ringRadius = center - outerPadding;

  const { segments, dominantColor } = buildRingSegments(categories, {
    center, radius: ringRadius, width: 1.5, opacity: 0.75,
  });

  // Soft glow: a thicker, very transparent ring behind the crisp one
  const glowRgba = hexToRgba(dominantColor, 0.1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${center}" cy="${center}" r="${ringRadius}"
      fill="none" stroke="${glowRgba}" stroke-width="6" />
    <g transform="rotate(-90, ${center}, ${center})">
      ${segments}
    </g>
  </svg>`;
}

// ── Variant: Wisps (Miyazaki) ──────────────────────────────────────────
// Inspired by Mononoke's forest spirits and Totoro's dust motes.
// Floating category-colored dots in a golden-angle spiral. No rings, no fill.
// Pure HTML elements (not SVG) for CSS animation. "Something alive is here."

const GOLDEN_ANGLE = 137.508; // degrees — nature's distribution angle

/**
 * Generate HTML content for the Wisps variant.
 * Returns positioned <span class="wisp"> elements (NOT SVG).
 * Called separately from createConstellationSVG since this is HTML, not SVG.
 */
export function createWispsContent(
  cluster: ConstellationClusterProps & { point_count: number },
): string {
  const { categories, point_count } = cluster;
  const size = computeConstellationSize(point_count);
  const center = size / 2;

  // Number of wisps: 5–12 based on cluster size
  const numWisps = Math.min(Math.max(5, Math.floor(point_count / 3)), 12);

  // Build wisp color array proportional to categories
  const sorted = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0) as [string, number][];
  const total = sorted.reduce((sum, [, c]) => sum + c, 0);

  const wispColors: string[] = [];
  for (const [cat, count] of sorted) {
    const color = CATEGORIES[cat as StoryCategory]?.color || '#666';
    const numForCat = Math.max(1, Math.round((count / total) * numWisps));
    for (let i = 0; i < numForCat && wispColors.length < numWisps; i++) {
      wispColors.push(color);
    }
  }
  // Fill remaining if rounding left us short
  const fallbackColor = sorted[0] ? CATEGORIES[sorted[0][0] as StoryCategory]?.color || '#666' : '#666';
  while (wispColors.length < numWisps) wispColors.push(fallbackColor);

  // Position wisps in a golden-angle spiral
  const maxRadius = center - 6;
  let wispsHtml = '';

  for (let i = 0; i < numWisps; i++) {
    const angle = (i * GOLDEN_ANGLE * Math.PI) / 180;
    const r = maxRadius * Math.sqrt((i + 1) / numWisps) * 0.85;
    const x = center + r * Math.cos(angle) - 2; // -2 to center 3-4px dot
    const y = center + r * Math.sin(angle) - 2;
    const color = wispColors[i];
    const delay = (i * 0.3) % 2.5; // stagger animation
    const dotSize = 3 + (i % 2); // alternate 3px and 4px

    wispsHtml += `<span class="wisp" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${dotSize}px;height:${dotSize}px;background:${color};color:${color};animation-delay:${delay.toFixed(1)}s;"></span>`;
  }

  return wispsHtml;
}

// ── Variant: Minimal (Tufte) ──────────────────────────────────────────
// Maximum restraint. A tiny dot of the dominant category color.
// The count label (always visible via CSS) IS the design.
// "Above all else, show the data." — Edward Tufte

function createMinimalSVG(
  cluster: ConstellationClusterProps & { point_count: number },
): string {
  const { categories } = cluster;
  const size = computeConstellationSize(cluster.point_count);
  const center = size / 2;

  const sorted = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0);
  const dominantColor = CATEGORIES[sorted[0]?.[0] as StoryCategory]?.color || '#666';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${center}" cy="${center}" r="3" fill="${dominantColor}" opacity="0.6" />
  </svg>`;
}

// ── Variant: Essence (Jony Ive) ───────────────────────────────────────
// "Remove everything until you can't remove anything else."
// Clusters are single dots in the dominant category color. Count always visible.
// No ring chart at rest — it fades in on hover as a reward for curiosity.
// Size: radically smaller than other variants (8–20px).

const ESSENCE_MIN = 8;
const ESSENCE_MAX = 20;

export function computeEssenceSize(pointCount: number): number {
  if (pointCount <= 2) return ESSENCE_MIN;
  const t = Math.log2(pointCount) / Math.log2(200);
  return Math.round(ESSENCE_MIN + (ESSENCE_MAX - ESSENCE_MIN) * Math.min(1, t));
}

function createEssenceSVG(
  cluster: ConstellationClusterProps & { point_count: number },
): string {
  const { categories } = cluster;
  const size = computeEssenceSize(cluster.point_count);
  const center = size / 2;

  const sorted = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0);
  const dominantColor = CATEGORIES[sorted[0]?.[0] as StoryCategory]?.color || '#666';
  const bgRgba = hexToRgba(dominantColor, 0.40);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${center}" cy="${center}" r="${center - 1}" fill="${bgRgba}" />
  </svg>`;
}

/**
 * Generate the hover-reveal ring chart for the Essence variant.
 * This sits hidden in the DOM and fades in on hover via CSS.
 */
export function createEssenceHoverRing(
  cluster: ConstellationClusterProps & { point_count: number },
): string {
  const size = computeEssenceSize(cluster.point_count);
  // Ring chart is larger than the dot — it "expands" on hover
  const ringSize = size + 16;
  const center = ringSize / 2;
  const ringRadius = center - 3;

  const { segments } = buildRingSegments(cluster.categories, {
    center, radius: ringRadius, width: 2, opacity: 0.7,
  });

  return `<div class="essence-hover-ring"><svg xmlns="http://www.w3.org/2000/svg" width="${ringSize}" height="${ringSize}" viewBox="0 0 ${ringSize} ${ringSize}">
    <g transform="rotate(-90, ${center}, ${center})">${segments}</g>
  </svg></div>`;
}

// ── Variant: Palimpsest (Borges) ──────────────────────────────────────
// "The map is a text to be read, not a tool to be used."
// Clusters become floating text — the top story name. No circles, no icons.
// Dense areas create overlapping text like a manuscript page.
// Zoom controls font-size and truncation — closer = more readable.

/**
 * Generate HTML content for the Palimpsest variant.
 * Returns a styled text span with the top story name.
 * Zoom-aware: font-size, truncation, and opacity all depend on zoom.
 */
export function createPalimpsestContent(
  cluster: ConstellationClusterProps & { point_count: number },
  zoom: number,
): string {
  const topStory = cluster.topStories[0]?.name || '...';

  // Zoom-dependent text treatment
  const fontSize = zoom <= 4 ? 8 : zoom <= 6 ? 10 : zoom <= 8 ? 11 : 13;
  const maxChars = zoom <= 4 ? 12 : zoom <= 6 ? 18 : zoom <= 8 ? 28 : 36;
  const opacity = zoom <= 4 ? 0.55 : zoom <= 6 ? 0.65 : zoom <= 8 ? 0.8 : 0.9;

  const displayText = topStory.length > maxChars
    ? topStory.slice(0, maxChars) + '\u2026'
    : topStory;

  // Count suffix — whispered alongside the title
  const countSuffix = cluster.point_count > 1
    ? `<span class="palimpsest-count">\u00A0(${cluster.point_count})</span>`
    : '';

  // Category color for the text
  const sorted = Object.entries(cluster.categories).sort((a, b) => b[1] - a[1]);
  const dominantColor = CATEGORIES[sorted[0]?.[0] as StoryCategory]?.color || '#999';

  return `<span class="palimpsest-text" style="font-size:${fontSize}px;color:${dominantColor};opacity:${opacity};">${displayText}${countSuffix}</span>`;
}

/**
 * Generate HTML for individual pin text in Palimpsest mode.
 * The moment name floats at its location instead of a colored dot.
 */
export function createPalimpsestPinContent(
  momentName: string,
  categoryColor: string,
  zoom: number,
  notabilityAlpha: number,
): string {
  const fontSize = zoom <= 10 ? 9 : zoom <= 12 ? 10 : 12;
  const maxChars = zoom <= 10 ? 14 : zoom <= 12 ? 22 : 32;
  const displayText = momentName.length > maxChars
    ? momentName.slice(0, maxChars) + '\u2026'
    : momentName;

  return `<span class="palimpsest-pin-text" style="font-size:${fontSize}px;color:${categoryColor};opacity:${notabilityAlpha};">${displayText}</span>`;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Generate an SVG string for a constellation cluster icon.
 * Returns raw SVG markup (for use in Leaflet DivIcon).
 * Note: Wisps variant returns '' — use createWispsContent() for its HTML content.
 * Note: Palimpsest variant returns '' — use createPalimpsestContent() instead.
 * Note: Essence uses its own size via computeEssenceSize().
 */
export function createConstellationSVG(
  cluster: ConstellationClusterProps & { point_count: number },
  variant: ConstellationVariant = 'classic',
): string {
  switch (variant) {
    case 'glass': return createGlassPortalSVG(cluster);
    case 'rings': return createDepthRingsSVG(cluster);
    case 'luminous': return createLuminousOutlineSVG(cluster);
    case 'wisps': return ''; // Wisps use HTML elements, not SVG
    case 'minimal': return createMinimalSVG(cluster);
    case 'essence': return createEssenceSVG(cluster);
    case 'palimpsest': return ''; // Palimpsest uses HTML text, not SVG
    case 'emergence': return ''; // Emergence bypasses clustering entirely
    default: return createClassicSVG(cluster);
  }
}

// ── Tooltip Content ────────────────────────────────────────────────────

/**
 * Generate tooltip HTML for a constellation cluster.
 */
export function createConstellationTooltip(
  cluster: ConstellationClusterProps & { point_count: number },
): string {
  const { topStories, point_count, categories } = cluster;

  // Category breakdown — top 3
  const catEntries = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const catHtml = catEntries.map(([cat, count]) => {
    const config = CATEGORIES[cat as StoryCategory];
    const label = config?.label || cat;
    const color = config?.color || '#666';
    return `<span style="color:${color};font-size:10px;">●</span> <span style="font-size:10px;color:#a3a3a3;">${label} (${count})</span>`;
  }).join('<br/>');

  // Top story names — up to 3
  const storyHtml = topStories.slice(0, 3).map(s =>
    `<div style="font-size:11px;color:#d4d4d4;margin-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">${s.name}</div>`
  ).join('');

  return `<div style="font-family:'Newsreader',Georgia,serif;max-width:240px;">
    <div style="font-size:13px;font-weight:700;color:#e5e5e5;margin-bottom:4px;">
      ${point_count} moments
    </div>
    ${storyHtml}
    ${topStories.length < point_count ? `<div style="font-size:10px;color:#737373;margin-top:2px;font-family:'Space Grotesk','Courier New',monospace;">+ ${point_count - topStories.length} more…</div>` : ''}
    <div style="margin-top:6px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.06);">
      ${catHtml}
    </div>
  </div>`;
}
