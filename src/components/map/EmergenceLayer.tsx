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
  const offScreenArrowRef = useRef<HTMLDivElement | null>(null);

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

  // ── Off-screen arrow helper ──────────────────────────────────────────
  // Shows/hides a directional arrow at the map edge pointing toward off-screen content.
  const showOffScreenArrow = (targetLat: number, targetLng: number, label?: string) => {
    hideOffScreenArrow();
    const container = map.getContainer();
    const sz = map.getSize();
    const target = map.latLngToContainerPoint([targetLat, targetLng]);
    const cx = sz.x / 2;
    const cy = sz.y / 2;
    // Angle from center to target
    const angle = Math.atan2(target.y - cy, target.x - cx);
    // Clamp to edge of map with padding
    const pad = 40;
    const edgeX = Math.max(pad, Math.min(sz.x - pad, cx + Math.cos(angle) * (sz.x / 2 - pad)));
    const edgeY = Math.max(pad, Math.min(sz.y - pad, cy + Math.sin(angle) * (sz.y / 2 - pad)));
    const degrees = angle * (180 / Math.PI);
    const div = document.createElement('div');
    div.className = 'offscreen-arrow';
    div.style.cssText = `position:absolute;left:${edgeX}px;top:${edgeY}px;z-index:800;pointer-events:none;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;`;
    div.innerHTML = `
      <div style="transform:rotate(${degrees}deg);font-size:18px;color:rgba(212,168,83,0.9);text-shadow:0 0 8px rgba(212,168,83,0.4);">&#x27A4;</div>
      ${label ? `<span style="font-family:'Space Grotesk',monospace;font-size:9px;color:rgba(255,255,255,0.6);max-width:80px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${label}</span>` : ''}
    `;
    container.appendChild(div);
    offScreenArrowRef.current = div;
  };

  const hideOffScreenArrow = () => {
    if (offScreenArrowRef.current) {
      offScreenArrowRef.current.remove();
      offScreenArrowRef.current = null;
    }
  };

  // ── Scroll highlight overlay (DOM marker with inline label) ──────────
  // Uses a single DivIcon containing BOTH the dot and the label text.
  // No Leaflet tooltip — eliminates the flash caused by tooltip repositioning.
  useEffect(() => {
    if (scrollOverlayRef.current) {
      map.removeLayer(scrollOverlayRef.current);
      scrollOverlayRef.current = null;
    }
    hideOffScreenArrow();

    if (scrollHighlight && scrollHighlight.length >= 1) {
      // Close any open hover tooltips on existing markers to prevent duplicates
      // with the scroll overlay label
      map.eachLayer((layer: any) => {
        if (layer.getTooltip?.() && layer.isTooltipOpen?.()) layer.closeTooltip();
      });
      const isMulti = scrollHighlight.length > 1;
      const hasLabel = scrollHighlightLabel && isMulti;

      if (hasLabel) {
        // Multi-moment: show parent name at the center of VISIBLE markers
        const bounds = map.getBounds();
        const visibleMoments = scrollHighlight.filter(m => bounds.contains([m.lat, m.lng]));
        if (visibleMoments.length === 0) {
          // All moments off-screen — show directional arrow toward the nearest one
          const center = bounds.getCenter();
          const nearest = scrollHighlight.reduce((best, m) => {
            const bDist = Math.hypot(best.lat - center.lat, best.lng - center.lng);
            const mDist = Math.hypot(m.lat - center.lat, m.lng - center.lng);
            return mDist < bDist ? m : best;
          }, scrollHighlight[0]);
          showOffScreenArrow(nearest.lat, nearest.lng, scrollHighlightLabel || undefined);
          return;
        }
        const lats = visibleMoments.map(m => m.lat);
        const lngs = visibleMoments.map(m => m.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        // Detect direction: label goes beside or above/below center point
        const point = map.latLngToContainerPoint([centerLat, centerLng]);
        const mapSize = map.getSize();
        const labelRight = point.x <= mapSize.x * 0.5;
        const nearBottom = point.y > mapSize.y * 0.65;
        const containerStyle = nearBottom
          ? 'flex-direction:column-reverse;align-items:center;'
          : labelRight ? '' : 'flex-direction:row-reverse;';
        const anchorY = nearBottom ? 50 : 0;
        const icon = L.divIcon({
          className: '',
          html: `<div class="scroll-label-container" style="${containerStyle}">
            <div class="scroll-label-dot" style="width:0;height:0;"></div>
            <div class="scroll-label-text dark-tooltip">${scrollHighlightLabel}</div>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, anchorY],
        });
        const marker = L.marker([centerLat, centerLng], { icon, zIndexOffset: 900, interactive: true });
        const firstMoment = scrollHighlight[0];
        const firstStory = momentStoryMap.get(firstMoment.id);
        if (firstStory) {
          marker.on('click', () => onClickRef.current(firstMoment, firstStory));
        }
        marker.addTo(map);
        scrollOverlayRef.current = marker;
      } else {
        // Single moment: show dot + label inline
        const moment = scrollHighlight[0];
        const vpBounds = map.getBounds();
        if (!vpBounds.contains([moment.lat, moment.lng])) {
          // Off-screen — show directional arrow
          showOffScreenArrow(moment.lat, moment.lng, scrollHighlightLabel || moment.name);
          return;
        }
        const category = momentCategoryMap.get(moment.id);
        const color = category ? CATEGORIES[category]?.color || '#fff' : '#fff';
        const tooltipText = scrollHighlightLabel || moment.name;
        const pt = map.latLngToContainerPoint([moment.lat, moment.lng]);
        const sz = map.getSize();
        const labelRight = pt.x <= sz.x * 0.5;
        const nearBottom = pt.y > sz.y * 0.65;
        // Near bottom: render label above the dot using column-reverse layout
        // with a large enough iconAnchor Y offset to pull the whole container up
        const containerStyle = nearBottom
          ? 'flex-direction:column-reverse;align-items:center;'
          : labelRight ? '' : 'flex-direction:row-reverse;';
        const borderStyle = nearBottom
          ? `border-bottom:3px solid ${color};padding-bottom:4px;`
          : `border-left:3px solid ${color};`;
        // When near bottom, shift anchor down so the container (which grows upward in column-reverse) stays visible
        const anchorY = nearBottom ? 60 : 6;
        const icon = L.divIcon({
          className: '',
          html: `<div class="scroll-label-container" style="${containerStyle}">
            <div class="scroll-label-dot" style="width:12px;height:12px;background:${color};box-shadow:0 0 8px ${color};border-radius:50%;flex-shrink:0;"></div>
            <div class="scroll-label-text dark-tooltip" style="${borderStyle}">${tooltipText}</div>
          </div>`,
          iconSize: [12, 12],
          iconAnchor: [6, anchorY],
        });
        const marker = L.marker([moment.lat, moment.lng], { icon, zIndexOffset: 900, interactive: true });
        const story = momentStoryMap.get(moment.id);
        if (story) {
          marker.on('click', () => onClickRef.current(moment, story));
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
      hideOffScreenArrow();
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
