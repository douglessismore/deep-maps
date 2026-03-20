/**
 * EmergenceLayer — Kevin Kelly's "Out of Control" rendering strategy.
 *
 * Bypasses Supercluster entirely. Renders ALL moments as tiny canvas-based
 * CircleMarkers at every zoom level. Size scales with zoom, color = category,
 * opacity = notability alpha. The density pattern is emergent — no clustering
 * algorithm designed it. The human eye IS the clustering algorithm.
 *
 * Uses L.CircleMarker with L.canvas() renderer — draws all markers on a single
 * Canvas element. No DOM overhead. Handles 50K+ points easily.
 *
 * Architecture follows HeatmapLayer.tsx pattern: side-effect component,
 * returns null, manages its own layer lifecycle.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Moment, Story, StoryCategory, StoryCollection } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { getEffectiveNotability, getNotabilityThreshold } from '../../lib/notability';
import { useAppData } from '../../lib/data/provider';

// ── Zoom-dependent dot radius ──────────────────────────────────────
// Zoom 2: 1px dots (star field). Zoom 14: ~10px (full markers).
function getRadius(zoom: number): number {
  return Math.max(1, Math.round((zoom - 1) * 0.8));
}

// ── Notability alpha for a moment at given zoom ────────────────────
function computeAlpha(moment: Moment, zoom: number): number {
  const threshold = getNotabilityThreshold(zoom);
  if (threshold <= 0) return 1;
  const notability = getEffectiveNotability(moment);
  if (notability >= threshold) return 1;
  return Math.max(0.15, notability / threshold);
}

// ── Component ──────────────────────────────────────────────────────

interface EmergenceLayerProps {
  categoryFilter: StoryCategory | null;
  activeCollection?: StoryCollection | null;
  /** When set, only show moments whose parent story is in this set (timeline era filtering) */
  storyIdFilter?: Set<string> | null;
  onLocationClick: (location: Moment, story: Story) => void;
  activeLocation: Moment | null;
  scrollHighlight?: Moment[];
}

export function EmergenceLayer({ categoryFilter, activeCollection, storyIdFilter, onLocationClick, activeLocation, scrollHighlight }: EmergenceLayerProps) {
  const { moments, stories } = useAppData();

  // Pre-compute lookups (rebuild when data changes — stable ref from TanStack Query)
  const momentStoryMap = useMemo(() => {
    const map = new Map<string, Story>();
    for (const story of stories) {
      for (const sm of story.moments) {
        if (!map.has(sm.momentId)) map.set(sm.momentId, story);
      }
    }
    return map;
  }, [stories]);

  const momentCategoryMap = useMemo(() => {
    const map = new Map<string, StoryCategory>();
    for (const story of stories) {
      for (const sm of story.moments) {
        if (!map.has(sm.momentId)) map.set(sm.momentId, story.category);
      }
    }
    return map;
  }, [stories]);

  const momentById = useMemo(() => new Map(moments.map(m => [m.id, m])), [moments]);

  const map = useMap();
  const canvasRenderer = useRef(L.canvas({ padding: 0.5, tolerance: 16 }));
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const activeOverlayRef = useRef<L.Marker | null>(null);

  // Stable callback ref — avoids marker recreation when parent re-renders
  const onClickRef = useRef(onLocationClick);
  onClickRef.current = onLocationClick;

  // Filter moments by active collection, category, and/or timeline era
  const filteredMoments = useMemo(() => {
    let result = moments as Moment[];
    if (activeCollection) {
      const idSet = new Set(activeCollection.momentIds);
      result = result.filter(m => idSet.has(m.id));
    }
    if (categoryFilter) {
      result = result.filter(m => momentCategoryMap.get(m.id) === categoryFilter);
    }
    if (storyIdFilter && storyIdFilter.size > 0) {
      result = result.filter(m => {
        const story = momentStoryMap.get(m.id);
        return story ? storyIdFilter.has(story.id) : false;
      });
    }
    return result;
  }, [categoryFilter, activeCollection, storyIdFilter, moments, momentStoryMap, momentCategoryMap]);

  // ── Create / update / destroy circle markers ──────────────────────
  useEffect(() => {
    const currentMarkers = markersRef.current;
    const zoom = map.getZoom();
    const radius = getRadius(zoom);
    const nextIds = new Set(filteredMoments.map(m => m.id));

    // Remove markers no longer needed (category change)
    for (const [id, marker] of currentMarkers) {
      if (!nextIds.has(id)) {
        map.removeLayer(marker);
        currentMarkers.delete(id);
      }
    }

    // Add or update markers
    for (const moment of filteredMoments) {
      const category = momentCategoryMap.get(moment.id);
      const color = category ? CATEGORIES[category]?.color || '#666' : '#666';
      const alpha = computeAlpha(moment, zoom);

      const existing = currentMarkers.get(moment.id);
      if (existing) {
        existing.setRadius(radius);
        existing.setStyle({ fillColor: color, fillOpacity: alpha });
      } else {
        const story = momentStoryMap.get(moment.id);
        const marker = L.circleMarker([moment.lat, moment.lng], {
          radius,
          renderer: canvasRenderer.current,
          fillColor: color,
          fillOpacity: alpha,
          stroke: false,
          interactive: true,
          bubblingMouseEvents: false,
        });

        // Tooltip
        const storyName = story?.name || '';
        marker.bindTooltip(
          `<div style="font-family:'Crimson Text',serif;font-size:13px;max-width:220px;">
            <strong>${moment.name}</strong>
            <div style="font-size:11px;color:#bfbfbf;margin-top:2px;font-family:'IBM Plex Mono',monospace;">${storyName}</div>
          </div>`,
          { direction: 'top', offset: [0, -radius - 2], className: 'dark-tooltip' }
        );

        // Click handler (uses ref for stable reference)
        if (story) {
          const m = moment;
          const s = story;
          marker.on('click', () => onClickRef.current(m, s));
        }

        marker.addTo(map);
        currentMarkers.set(moment.id, marker);
      }
    }

    return () => {
      for (const [, marker] of currentMarkers) {
        map.removeLayer(marker);
      }
      currentMarkers.clear();
    };
  }, [filteredMoments, map]);

  // ── Zoom-dependent radius + opacity updates ──────────────────────
  useMapEvents({
    zoomend: () => {
      const zoom = map.getZoom();
      const radius = getRadius(zoom);

      for (const [id, marker] of markersRef.current) {
        const moment = momentById.get(id);
        if (!moment) continue;
        const alpha = computeAlpha(moment, zoom);
        marker.setRadius(radius);
        marker.setStyle({ fillOpacity: alpha });
      }
    },
  });

  // ── Scroll highlight: boost highlighted dots, fade others ──────────
  useEffect(() => {
    const highlightIds = new Set(scrollHighlight?.map(m => m.id) ?? []);
    const hasHighlight = highlightIds.size > 0;
    const zoom = map.getZoom();
    const baseRadius = getRadius(zoom);

    for (const [id, marker] of markersRef.current) {
      const moment = momentById.get(id);
      if (!moment) continue;

      if (hasHighlight) {
        if (highlightIds.has(id)) {
          // Highlighted: full opacity, slightly larger
          marker.setRadius(Math.max(baseRadius, 5));
          marker.setStyle({ fillOpacity: 1 });
        } else {
          // Faded: dim
          marker.setStyle({ fillOpacity: 0.08 });
        }
      } else {
        // No highlight: restore normal
        const alpha = computeAlpha(moment, zoom);
        marker.setRadius(baseRadius);
        marker.setStyle({ fillOpacity: alpha });
      }
    }
  }, [scrollHighlight, map]);

  // ── Active location overlay (single DOM marker for pulse animation) ──
  useEffect(() => {
    if (activeOverlayRef.current) {
      map.removeLayer(activeOverlayRef.current);
      activeOverlayRef.current = null;
    }

    if (activeLocation) {
      const category = momentCategoryMap.get(activeLocation.id);
      const color = category ? CATEGORIES[category]?.color || '#fff' : '#fff';
      const icon = L.divIcon({
        className: '',
        html: `<div class="story-marker active pulsing" style="width:14px;height:14px;background:${color};"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const marker = L.marker([activeLocation.lat, activeLocation.lng], {
        icon,
        zIndexOffset: 1000,
        interactive: false,
      });
      marker.addTo(map);
      activeOverlayRef.current = marker;
    }

    return () => {
      if (activeOverlayRef.current) {
        map.removeLayer(activeOverlayRef.current);
        activeOverlayRef.current = null;
      }
    };
  }, [activeLocation, map]);

  return null;
}
