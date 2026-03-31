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
  // Minimum 4px so markers are always visible on satellite view
  return Math.max(4, Math.round((zoom - 1) * 0.9));
}

// ── Notability alpha for a moment at given zoom ────────────────────
function computeAlpha(moment: Moment, zoom: number): number {
  const threshold = getNotabilityThreshold(zoom);
  if (threshold <= 0) return 1;
  const notability = getEffectiveNotability(moment);
  if (notability >= threshold) return 1;
  // Raised minimum from 0.15 to 0.35 so low-notability markers remain visible
  // in sparse areas where they may be the only markers
  return Math.max(0.5, notability / threshold);
}

// ── Highlight-aware opacity helpers ────────────────────────────────
// Centralized so create/update, highlight, and zoomend all use the
// same logic. Prevents race conditions between effects.

function getHighlightOpacity(
  momentId: string,
  highlightIds: Set<string>,
  hasHighlight: boolean,
  moment: Moment,
  zoom: number,
  isCollection?: boolean,
  isSoft?: boolean,
): number {
  if (!hasHighlight) return computeAlpha(moment, zoom);
  if (highlightIds.has(momentId)) return 1;
  // Soft mode (homepage): dim non-highlighted but keep visible (not 0.08 invisible)
  if (isSoft) return Math.max(0.12, computeAlpha(moment, zoom) * 0.3);
  // Collections: dim other moments gently (still visible). Stories: fade hard.
  return isCollection ? 0.3 : 0.08;
}

function getHighlightRadius(
  momentId: string,
  highlightIds: Set<string>,
  hasHighlight: boolean,
  baseRadius: number,
): number {
  if (hasHighlight && highlightIds.has(momentId)) {
    return Math.max(baseRadius, 5);
  }
  // Shrink non-highlighted markers when something is highlighted
  if (hasHighlight) return Math.max(1.5, baseRadius * 0.5);
  return baseRadius;
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
  /** When true, scroll highlight is "soft" — don't dim non-highlighted markers (homepage mode) */
  softHighlight?: boolean;
  /** Label to show on map for multi-moment scroll highlights (e.g., "Lady Bird Johnson") */
  scrollHighlightLabel?: string | null;
}

export function EmergenceLayer({ categoryFilter, activeCollection, storyIdFilter, onLocationClick, activeLocation, scrollHighlight, softHighlight, scrollHighlightLabel }: EmergenceLayerProps) {
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
  const scrollOverlayRef = useRef<L.Marker | null>(null);

  // Stable callback ref — avoids marker recreation when parent re-renders
  const onClickRef = useRef(onLocationClick);
  onClickRef.current = onLocationClick;

  const softHighlightRef = useRef(softHighlight);
  softHighlightRef.current = softHighlight;

  // Keep a ref to scrollHighlight so all effects and event handlers can
  // read the latest value without being listed as dependencies.
  const scrollHighlightRef = useRef(scrollHighlight);
  scrollHighlightRef.current = scrollHighlight;

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
  // Uses scrollHighlightRef so newly created/updated markers respect
  // the current highlight state from the start (no flash of full opacity).
  useEffect(() => {
    const currentMarkers = markersRef.current;
    const zoom = map.getZoom();
    const radius = getRadius(zoom);
    const nextIds = new Set(filteredMoments.map(m => m.id));

    // Current highlight state
    const hl = scrollHighlightRef.current;
    const highlightIds = new Set(hl?.map(m => m.id) ?? []);
    const hasHighlight = highlightIds.size > 0;

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
      const opacity = getHighlightOpacity(moment.id, highlightIds, hasHighlight, moment, zoom, !!activeCollection, softHighlightRef.current);
      const effectiveRadius = getHighlightRadius(moment.id, highlightIds, hasHighlight, radius);

      const existing = currentMarkers.get(moment.id);
      if (existing) {
        existing.setRadius(effectiveRadius);
        existing.setStyle({ fillColor: color, fillOpacity: opacity });
      } else {
        const story = momentStoryMap.get(moment.id);
        const marker = L.circleMarker([moment.lat, moment.lng], {
          radius: effectiveRadius,
          renderer: canvasRenderer.current,
          fillColor: color,
          fillOpacity: opacity,
          stroke: true,
          color: 'rgba(255,255,255,0.35)',
          weight: 1.5,
          interactive: true,
          bubblingMouseEvents: false,
        });

        // Tooltip with category color accent
        const storyName = story?.name || '';
        const catColor = category ? CATEGORIES[category]?.color || '#888' : '#888';
        marker.bindTooltip(
          `<div style="font-family:'Newsreader',Georgia,serif;font-size:13px;max-width:220px;border-left:3px solid ${catColor};padding-left:6px;">
            <strong>${moment.name}</strong>
            <div style="font-size:11px;color:#999;margin-top:2px;font-family:'Space Grotesk','Courier New',monospace;">${storyName}</div>
          </div>`,
          { direction: 'top', offset: [0, -radius - 2], className: 'dark-tooltip' }
        );

        // Click handler — both marker and tooltip text are clickable
        if (story) {
          const m = moment;
          const s = story;
          const handler = () => onClickRef.current(m, s);
          marker.on('click', handler);
          marker.on('tooltipopen', () => {
            const el = marker.getTooltip()?.getElement();
            if (el) { el.style.cursor = 'pointer'; el.onclick = handler; }
          });
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
      const baseRadius = getRadius(zoom);

      const hl = scrollHighlightRef.current;
      const highlightIds = new Set(hl?.map(m => m.id) ?? []);
      const hasHighlight = highlightIds.size > 0;

      for (const [id, marker] of markersRef.current) {
        const moment = momentById.get(id);
        if (!moment) continue;
        const opacity = getHighlightOpacity(id, highlightIds, hasHighlight, moment, zoom, !!activeCollection, softHighlightRef.current);
        const radius = getHighlightRadius(id, highlightIds, hasHighlight, baseRadius);
        marker.setRadius(radius);
        marker.setStyle({ fillOpacity: opacity });
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
      const opacity = getHighlightOpacity(id, highlightIds, hasHighlight, moment, zoom, !!activeCollection, softHighlightRef.current);
      const radius = getHighlightRadius(id, highlightIds, hasHighlight, baseRadius);
      marker.setRadius(radius);
      marker.setStyle({ fillOpacity: opacity });
    }
  }, [scrollHighlight, map]);

  // ── Scroll highlight overlay (DOM marker + permanent label) ──────────
  // Canvas CircleMarkers can't show permanent tooltips, so we overlay a
  // real DOM marker for the single scroll-highlighted moment. This gives
  // users a visible ring + the moment name on the map as they scroll.
  useEffect(() => {
    if (scrollOverlayRef.current) {
      map.removeLayer(scrollOverlayRef.current);
      scrollOverlayRef.current = null;
    }

    if (scrollHighlight && scrollHighlight.length >= 1) {
      const isMulti = scrollHighlight.length > 1;
      const hasLabel = scrollHighlightLabel && isMulti;

      if (hasLabel) {
        // Multi-moment: show parent name at the center of VISIBLE markers in viewport
        const bounds = map.getBounds();
        const visibleMoments = scrollHighlight.filter(m => bounds.contains([m.lat, m.lng]));
        const labelMoments = visibleMoments.length > 0 ? visibleMoments : scrollHighlight;
        const lats = labelMoments.map(m => m.lat);
        const lngs = labelMoments.map(m => m.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        const icon = L.divIcon({ className: '', html: '', iconSize: [0, 0] });
        const marker = L.marker([centerLat, centerLng], {
          icon,
          zIndexOffset: 900,
          interactive: true,
        });
        // Auto-detect label direction based on where the cluster center is in the viewport
        const point = map.latLngToContainerPoint([centerLat, centerLng]);
        const mapSize = map.getSize();
        const isRightHalf = point.x > mapSize.x * 0.5;
        const tooltipDir = isRightHalf ? 'left' as const : 'right' as const;
        const tooltipOffset: [number, number] = isRightHalf ? [-12, 0] : [12, 0];
        marker.bindTooltip(
          `<div style="font-family:'Newsreader',Georgia,serif;font-size:13px;max-width:220px;cursor:pointer;">
            <strong>${scrollHighlightLabel}</strong>
          </div>`,
          { direction: tooltipDir, offset: tooltipOffset, className: 'dark-tooltip clickable-tooltip', permanent: true }
        );
        // Click the label → navigate to the first highlighted moment's story
        const firstMoment = scrollHighlight[0];
        const firstStory = momentStoryMap.get(firstMoment.id);
        if (firstStory) {
          const handler = () => onClickRef.current(firstMoment, firstStory);
          marker.on('click', handler);
          // Also make the tooltip text itself clickable (Leaflet tooltips don't propagate clicks to marker)
          marker.on('tooltipopen', () => {
            const el = marker.getTooltip()?.getElement();
            if (el) { el.style.cursor = 'pointer'; el.onclick = handler; }
          });
        }
        marker.addTo(map);
        scrollOverlayRef.current = marker;
      } else {
        // Single moment: show label (e.g. person name) if provided, otherwise moment name
        const moment = scrollHighlight[0];
        const category = momentCategoryMap.get(moment.id);
        const color = category ? CATEGORIES[category]?.color || '#fff' : '#fff';
        const icon = L.divIcon({
          className: '',
          html: `<div class="story-marker active" style="width:12px;height:12px;background:${color};box-shadow:0 0 8px ${color};"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        const marker = L.marker([moment.lat, moment.lng], {
          icon,
          zIndexOffset: 900,
          interactive: true,
        });
        const tooltipText = scrollHighlightLabel || moment.name;
        // Auto-detect label direction: place left if moment is in the right half of the viewport
        const pt = map.latLngToContainerPoint([moment.lat, moment.lng]);
        const sz = map.getSize();
        const dir = pt.x > sz.x * 0.5 ? 'left' as const : 'right' as const;
        const off: [number, number] = dir === 'left' ? [-8, 0] : [8, 0];
        marker.bindTooltip(
          `<div style="font-family:'Newsreader',Georgia,serif;font-size:13px;max-width:220px;cursor:pointer;border-left:3px solid ${color};padding-left:6px;margin:-2px -4px;border-radius:2px;">
            <strong>${tooltipText}</strong>
          </div>`,
          { direction: dir, offset: off, className: 'dark-tooltip clickable-tooltip', permanent: true }
        );
        const story = momentStoryMap.get(moment.id);
        if (story) {
          const handler = () => onClickRef.current(moment, story);
          marker.on('click', handler);
          marker.on('tooltipopen', () => {
            const el = marker.getTooltip()?.getElement();
            if (el) { el.style.cursor = 'pointer'; el.onclick = handler; }
          });
        }
        marker.addTo(map);
        scrollOverlayRef.current = marker;
      }
    }

    return () => {
      if (scrollOverlayRef.current) {
        map.removeLayer(scrollOverlayRef.current);
        scrollOverlayRef.current = null;
      }
    };
  }, [scrollHighlight, scrollHighlightLabel, map, momentCategoryMap]);

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
