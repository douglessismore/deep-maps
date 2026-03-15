/**
 * Supercluster-based geographic clustering for the fractal zoom system.
 *
 * At world zoom: ~15-25 constellation orbs (story-aware clusters).
 * As you zoom in: constellations fracture into smaller clusters, then individual pins.
 * At city zoom (11+): all individual pins, no clusters.
 *
 * Each cluster aggregates:
 * - point_count: number of moments
 * - totalNotability: sum of notability scores
 * - maxNotability: highest notability in cluster
 * - categories: { 'dark-history': 5, 'arts-culture': 3, ... } for donut chart
 * - topStoryNames: names of the highest-notability stories for tooltip
 */

import Supercluster from 'supercluster';
import { moments } from '../data/moments';
import { stories } from '../data/stories';
import { getEffectiveNotability } from './notability';
import type { StoryCategory } from '../types';

// ── Pre-computed lookup tables ─────────────────────────────────────────

/** Map each moment ID → its primary story's category */
const momentCategoryMap = new Map<string, StoryCategory>();
/** Map each moment ID → its primary story's name */
const momentStoryNameMap = new Map<string, string>();
/** Map each moment ID → its primary story's ID */
const momentStoryIdMap = new Map<string, string>();

for (const story of stories) {
  for (const sm of story.moments) {
    if (!momentCategoryMap.has(sm.momentId)) {
      momentCategoryMap.set(sm.momentId, story.category);
      momentStoryNameMap.set(sm.momentId, story.name);
      momentStoryIdMap.set(sm.momentId, story.id);
    }
  }
}

// ── Point properties (per moment) ──────────────────────────────────────

export interface MomentPointProps {
  momentId: string;
  storyId: string;
  storyName: string;
  notability: number;
  category: StoryCategory;
  importance: string;
}

// ── Cluster properties (aggregated) ────────────────────────────────────

export interface ConstellationClusterProps {
  totalNotability: number;
  maxNotability: number;
  categories: Record<string, number>;
  topStories: Array<{ name: string; notability: number }>;
}

// ── Build GeoJSON features from moments ────────────────────────────────

const features: Supercluster.PointFeature<MomentPointProps>[] = moments.map(m => ({
  type: 'Feature' as const,
  properties: {
    momentId: m.id,
    storyId: momentStoryIdMap.get(m.id) || '',
    storyName: momentStoryNameMap.get(m.id) || '',
    notability: getEffectiveNotability(m),
    category: momentCategoryMap.get(m.id) || 'dark-history' as StoryCategory,
    importance: m.importance,
  },
  geometry: {
    type: 'Point' as const,
    coordinates: [m.lng, m.lat], // GeoJSON is [lng, lat]
  },
}));

// ── Create Supercluster index ──────────────────────────────────────────

const index = new Supercluster<MomentPointProps, ConstellationClusterProps>({
  radius: 60,      // Cluster radius in pixels — tuned for ~15-25 clusters at world zoom
  maxZoom: 10,     // Stop clustering at zoom 10 (everything individual at 11+)
  minZoom: 2,
  minPoints: 2,    // Minimum points to form a cluster
  map: (props) => ({
    totalNotability: props.notability,
    maxNotability: props.notability,
    categories: { [props.category]: 1 },
    topStories: [{ name: props.storyName, notability: props.notability }],
  }),
  reduce: (accumulated, props) => {
    accumulated.totalNotability += props.totalNotability;
    accumulated.maxNotability = Math.max(accumulated.maxNotability, props.maxNotability);

    // Merge category counts
    for (const [cat, count] of Object.entries(props.categories)) {
      accumulated.categories[cat] = (accumulated.categories[cat] || 0) + count;
    }

    // Merge top stories (keep top 5 by notability, deduplicated)
    for (const story of props.topStories) {
      if (!accumulated.topStories.some(s => s.name === story.name)) {
        accumulated.topStories.push(story);
      }
    }
    accumulated.topStories.sort((a, b) => b.notability - a.notability);
    if (accumulated.topStories.length > 5) {
      accumulated.topStories = accumulated.topStories.slice(0, 5);
    }
  },
});

index.load(features);

// ── Build category-filtered indices ────────────────────────────────────

const categoryIndices = new Map<StoryCategory, Supercluster<MomentPointProps, ConstellationClusterProps>>();

/**
 * Get or create a Supercluster index filtered to a single category.
 * Lazy-initialized — only built when first requested.
 */
function getCategoryIndex(category: StoryCategory): Supercluster<MomentPointProps, ConstellationClusterProps> {
  let catIndex = categoryIndices.get(category);
  if (!catIndex) {
    const filtered = features.filter(f => f.properties.category === category);
    catIndex = new Supercluster<MomentPointProps, ConstellationClusterProps>({
      radius: 60,
      maxZoom: 10,
      minZoom: 2,
      minPoints: 2,
      map: (props) => ({
        totalNotability: props.notability,
        maxNotability: props.notability,
        categories: { [props.category]: 1 },
        topStories: [{ name: props.storyName, notability: props.notability }],
      }),
      reduce: (accumulated, props) => {
        accumulated.totalNotability += props.totalNotability;
        accumulated.maxNotability = Math.max(accumulated.maxNotability, props.maxNotability);
        for (const [cat, count] of Object.entries(props.categories)) {
          accumulated.categories[cat] = (accumulated.categories[cat] || 0) + count;
        }
        for (const story of props.topStories) {
          if (!accumulated.topStories.some(s => s.name === story.name)) {
            accumulated.topStories.push(story);
          }
        }
        accumulated.topStories.sort((a, b) => b.notability - a.notability);
        if (accumulated.topStories.length > 5) {
          accumulated.topStories = accumulated.topStories.slice(0, 5);
        }
      },
    });
    catIndex.load(filtered);
    categoryIndices.set(category, catIndex);
  }
  return catIndex;
}

// ── Public API ─────────────────────────────────────────────────────────

export type ClusterOrPoint =
  | Supercluster.ClusterFeature<ConstellationClusterProps>
  | Supercluster.PointFeature<MomentPointProps>;

/**
 * Query clusters and individual points for the current viewport + zoom.
 * Returns a mix of cluster features and point features.
 */
export function getClusterData(
  zoom: number,
  bounds: { west: number; south: number; east: number; north: number },
  categoryFilter?: StoryCategory | null,
): ClusterOrPoint[] {
  const bbox: [number, number, number, number] = [
    bounds.west,
    bounds.south,
    bounds.east,
    bounds.north,
  ];

  const activeIndex = categoryFilter
    ? getCategoryIndex(categoryFilter)
    : index;

  return activeIndex.getClusters(bbox, Math.floor(zoom));
}

/**
 * Get the zoom level at which a cluster expands into its children.
 * Used for "click to zoom into cluster" behavior.
 */
export function getClusterExpansionZoom(
  clusterId: number,
  categoryFilter?: StoryCategory | null,
): number {
  const activeIndex = categoryFilter
    ? getCategoryIndex(categoryFilter)
    : index;
  return activeIndex.getClusterExpansionZoom(clusterId);
}

/**
 * Check if a feature is a cluster (vs individual point).
 */
export function isCluster(
  feature: ClusterOrPoint
): feature is Supercluster.ClusterFeature<ConstellationClusterProps> {
  return 'cluster' in feature.properties && feature.properties.cluster === true;
}
