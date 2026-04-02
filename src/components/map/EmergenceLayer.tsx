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
import { distanceMiles } from '../../lib/geo';
import { useAppData } from '../../lib/data/provider';

// ── Helpers ────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
  // Soft mode (homepage): dim non-highlighted significantly so highlighted ones pop
  if (isSoft) return Math.max(0.08, computeAlpha(moment, zoom) * 0.2);
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
    // Highlighted markers: same size, differentiated by opacity + stroke only
    return baseRadius;
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
  /** Contextual meta text (e.g., "3 events nearby", "From Ranchland... · 2011") */
  scrollHighlightMeta?: string | null;
  /** Called when user taps the map to dismiss scroll highlights */
  onDismissHighlight?: () => void;
  /** Navigate to the source entity/story/collection from a scroll highlight label click */
  onScrollHighlightNavigate?: () => void;
}

export function EmergenceLayer({ categoryFilter, activeCollection, storyIdFilter, onLocationClick, activeLocation, scrollHighlight, softHighlight, scrollHighlightLabel, scrollHighlightMeta, onDismissHighlight, onScrollHighlightNavigate }: EmergenceLayerProps) {
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
  const scrollPolylineRef = useRef<L.Polyline | null>(null);
  const offScreenArrowRef = useRef<HTMLDivElement | null>(null);
  // Track active arrow-click flyTo so the arrow tracks during animation
  const arrowFlyRef = useRef<{ lat: number; lng: number; label?: string; meta?: string; cleanup: () => void } | null>(null);

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
        const yearStr = moment.year;
        const metaText = storyName ? (yearStr ? `${yearStr} · ${storyName}` : storyName) : (yearStr ? `${yearStr}` : '');
        marker.bindTooltip(
          `<div style="font-family:'Newsreader',Georgia,serif;font-size:13px;max-width:220px;border-left:2px solid ${catColor};padding-left:7px;letter-spacing:0.01em;">
            <strong>${moment.name}</strong>
            ${metaText ? `<div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px;font-family:'Space Grotesk','Courier New',monospace;letter-spacing:0.04em;">${metaText}</div>` : ''}
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
  // Stable ref for dismiss callback
  const onDismissRef = useRef(onDismissHighlight);
  onDismissRef.current = onDismissHighlight;

  const onNavigateRef = useRef(onScrollHighlightNavigate);
  onNavigateRef.current = onScrollHighlightNavigate;

  useMapEvents({
    click: () => {
      // Tap on map background → dismiss all scroll highlights and arrows
      if (scrollOverlayRef.current) {
        map.removeLayer(scrollOverlayRef.current);
        scrollOverlayRef.current = null;
      }
      hideOffScreenArrow();
      arrowFlyRef.current = null;
      onDismissRef.current?.();
    },
    zoomend: () => {
      const zoom = map.getZoom();
      const baseRadius = getRadius(zoom);

      const hl = scrollHighlightRef.current;
      const highlightIds = new Set(hl?.map(m => m.id) ?? []);
      const hasHighlight = highlightIds.size > 0;

      for (const [id, marker] of markersRef.current) {
        const moment = momentById.get(id);
        if (!moment) continue;
        const isHighlighted = hasHighlight && highlightIds.has(id);
        const opacity = getHighlightOpacity(id, highlightIds, hasHighlight, moment, zoom, !!activeCollection, softHighlightRef.current);
        const radius = getHighlightRadius(id, highlightIds, hasHighlight, baseRadius);
        marker.setRadius(radius);
        marker.setStyle({
          fillOpacity: isHighlighted ? 1.0 : opacity,
          weight: 1.5,
          color: isHighlighted ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
        });
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
      const isHighlighted = hasHighlight && highlightIds.has(id);
      const opacity = getHighlightOpacity(id, highlightIds, hasHighlight, moment, zoom, !!activeCollection, softHighlightRef.current);
      const radius = getHighlightRadius(id, highlightIds, hasHighlight, baseRadius);
      marker.setRadius(radius);
      marker.setStyle({
        fillOpacity: isHighlighted ? 1.0 : opacity,
        weight: isHighlighted ? 3 : 1.5,
        color: isHighlighted ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)',
      });
    }
  }, [scrollHighlight, map]);

  // ── Off-screen arrow helper ──────────────────────────────────────────
  // Shows/hides a directional arrow at the map edge pointing toward off-screen content.
  // Computes position, rotation, and distance for the arrow DOM element.
  const updateArrowPosition = (div: HTMLDivElement, targetLat: number, targetLng: number, label?: string) => {
    const sz = map.getSize();
    const target = map.latLngToContainerPoint([targetLat, targetLng]);
    const cx = sz.x / 2;
    const cy = sz.y / 2;
    const dx = target.x - cx;
    const dy = target.y - cy;

    // If target is now in viewport, hide arrow
    const bounds = map.getBounds();
    if (bounds.contains([targetLat, targetLng])) {
      div.style.display = 'none';
      return;
    }
    div.style.display = 'flex';

    if (dx === 0 && dy === 0) return;

    // Ray-rectangle intersection
    const pad = 48;
    const halfW = sz.x / 2 - pad;
    const halfH = sz.y / 2 - pad;
    const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
    const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
    const scale = Math.min(scaleX, scaleY);
    const edgeX = cx + dx * scale;
    const edgeY = cy + dy * scale;
    const degrees = Math.atan2(dy, dx) * (180 / Math.PI);

    const center = map.getCenter();
    const dist = distanceMiles(center.lat, center.lng, targetLat, targetLng);
    const distStr = dist < 1 ? `${(dist * 5280).toFixed(0)} ft` : dist < 10 ? `${dist.toFixed(1)} mi` : `${Math.round(dist)} mi`;

    div.style.left = `${edgeX}px`;
    div.style.top = `${edgeY}px`;
    div.innerHTML = `
      <div style="transform:rotate(${degrees}deg);font-size:22px;color:rgba(212,168,83,0.95);text-shadow:0 0 10px rgba(212,168,83,0.5);filter:drop-shadow(0 0 4px rgba(212,168,83,0.3));">&#x27A4;</div>
      <span style="font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:600;color:rgba(212,168,83,0.85);white-space:nowrap;">${distStr}</span>
      ${label ? `<span style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:500;color:rgba(255,255,255,0.8);max-width:140px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,0.8);">${label}</span>` : ''}
    `;
  };

  const showOffScreenArrow = (targetLat: number, targetLng: number, label?: string, meta?: string) => {
    // Don't override an active arrow-click flyTo
    if (arrowFlyRef.current) return;
    // Always replace the arrow with current data. The cardId-based lookup
    // in HomePage ensures scrollHighlight matches the visible card.
    hideOffScreenArrow();
    const container = map.getContainer();

    // Check if target is already in viewport
    if (map.getBounds().contains([targetLat, targetLng])) return;

    const div = document.createElement('div');
    div.className = 'offscreen-arrow';
    div.style.cssText = `position:absolute;z-index:800;cursor:pointer;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px;`;
    updateArrowPosition(div, targetLat, targetLng, label);

    div.addEventListener('click', (e) => {
      e.stopPropagation();
      // Lock in this target — prevent scroll highlight from overriding
      const onMove = () => updateArrowPosition(div, targetLat, targetLng, label);
      const onMoveEnd = () => {
        // If target is now in view, clean up and show a label at the target
        if (map.getBounds().contains([targetLat, targetLng])) {
          map.off('move', onMove);
          map.off('moveend', onMoveEnd);
          hideOffScreenArrow();
          // Show a temporary label at the landed location so the user sees what they clicked
          if (label && scrollOverlayRef.current === null) {
            const pt = map.latLngToContainerPoint([targetLat, targetLng]);
            const sz = map.getSize();
            const labelRight = pt.x <= sz.x * 0.5;
            const nearBottom = pt.y > sz.y * 0.65;
            const containerStyle = nearBottom
              ? 'flex-direction:column-reverse;align-items:center;'
              : labelRight ? '' : 'flex-direction:row-reverse;';
            const anchorY = nearBottom ? 50 : 0;
            const landedMeta = arrowFlyRef.current?.meta || '';
            const landedIcon = L.divIcon({
              className: '',
              html: `<div class="scroll-label-container" style="${containerStyle}">
                <div class="scroll-label-text dark-tooltip">
                  <div>${label}</div>
                  ${landedMeta ? `<div class="scroll-label-meta">${landedMeta}</div>` : ''}
                </div>
              </div>`,
              iconSize: [0, 0],
              iconAnchor: [0, anchorY],
            });
            const landedMarker = L.marker([targetLat, targetLng], { icon: landedIcon, zIndexOffset: 900, interactive: true });
            landedMarker.on('click', () => {
              // Navigate to the source entity/story/collection
              onNavigateRef.current?.();
            });
            landedMarker.addTo(map);
            scrollOverlayRef.current = landedMarker;
          }
          // Clear the lock after 5 seconds. Also remove the landed label
          // to prevent stale data when the scroll highlight effect resumes.
          setTimeout(() => {
            if (scrollOverlayRef.current) {
              map.removeLayer(scrollOverlayRef.current);
              scrollOverlayRef.current = null;
            }
            arrowFlyRef.current = null;
          }, 5000);
        }
      };
      arrowFlyRef.current = {
        lat: targetLat, lng: targetLng, label, meta,
        cleanup: () => { map.off('move', onMove); map.off('moveend', onMoveEnd); }
      };
      map.on('move', onMove);
      map.on('moveend', onMoveEnd);
      map.flyTo([targetLat, targetLng], map.getZoom(), { duration: 1.5 });
    });
    container.appendChild(div);
    offScreenArrowRef.current = div;
  };

  const hideOffScreenArrow = () => {
    if (arrowFlyRef.current) {
      arrowFlyRef.current.cleanup();
      // Don't clear arrowFlyRef here — it's the flyTo lock.
      // Only the scroll highlight effect clears it when new data arrives.
    }
    if (offScreenArrowRef.current) {
      offScreenArrowRef.current.remove();
      offScreenArrowRef.current = null;
    }
  };

  // ── Scroll highlight overlay (DOM marker with inline label) ──────────
  // Uses a single DivIcon containing BOTH the dot and the label text.
  // No Leaflet tooltip — eliminates the flash caused by tooltip repositioning.
  useEffect(() => {
    // If an arrow-click flyTo lock is active, block ALL scroll highlight
    // updates. The lock is cleared by a timeout in the moveEnd handler.
    // This prevents viewport-driven reshuffles from overriding the landed label.
    // Always clean up old arrows (prevents stuck arrows alongside new highlights)
    hideOffScreenArrow();

    if (arrowFlyRef.current) return;

    if (scrollOverlayRef.current) {
      map.removeLayer(scrollOverlayRef.current);
      scrollOverlayRef.current = null;
    }
    if (scrollPolylineRef.current) {
      map.removeLayer(scrollPolylineRef.current);
      scrollPolylineRef.current = null;
    }

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
          showOffScreenArrow(nearest.lat, nearest.lng, scrollHighlightLabel || undefined, scrollHighlightMeta || undefined);
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
        const firstCat = momentCategoryMap.get(scrollHighlight[0]?.id);
        const multiColor = firstCat ? CATEGORIES[firstCat]?.color || '#888' : '#888';
        const multiGlow = hexToRgba(multiColor, 0.06);
        const metaHtml = scrollHighlightMeta ? `<div class="scroll-label-meta">${scrollHighlightMeta}</div>` : '';
        const multiBorderStyle = nearBottom
          ? `border-bottom:2px solid ${multiColor};padding-bottom:4px;`
          : `border-left:2px solid ${multiColor};`;
        const icon = L.divIcon({
          className: '',
          html: `<div class="scroll-label-container" style="${containerStyle}">
            <div class="scroll-label-text dark-tooltip" style="${multiBorderStyle}box-shadow:0 4px 24px rgba(0,0,0,0.65),inset 0 0 12px ${multiGlow};">
              <div>${scrollHighlightLabel}</div>
              ${metaHtml}
            </div>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, anchorY],
        });
        const marker = L.marker([centerLat, centerLng], { icon, zIndexOffset: 900, interactive: true });
        // Click navigates to the nearest visible moment, not the first in the array
        const mapCenter = map.getCenter();
        const nearestMoment = visibleMoments.reduce((best, m) => {
          const bDist = Math.hypot(best.lat - mapCenter.lat, best.lng - mapCenter.lng);
          const mDist = Math.hypot(m.lat - mapCenter.lat, m.lng - mapCenter.lng);
          return mDist < bDist ? m : best;
        }, visibleMoments[0]);
        const nearestStory = momentStoryMap.get(nearestMoment.id);
        marker.on('click', () => {
          if (onNavigateRef.current) {
            onNavigateRef.current();
          } else if (nearestStory) {
            onClickRef.current(nearestMoment, nearestStory);
          }
        });
        marker.addTo(map);
        scrollOverlayRef.current = marker;
      } else {
        // Single moment: show dot + label inline
        const moment = scrollHighlight[0];
        const vpBounds = map.getBounds();
        if (!vpBounds.contains([moment.lat, moment.lng])) {
          // Off-screen — show directional arrow
          showOffScreenArrow(moment.lat, moment.lng, scrollHighlightLabel || moment.name, scrollHighlightMeta || undefined);
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
          ? `border-bottom:2px solid ${color};padding-bottom:4px;`
          : `border-left:2px solid ${color};`;
        const innerGlow = hexToRgba(color, 0.06);
        const stemStyle = nearBottom
          ? `width:1px;height:8px;background:${color};opacity:0.35;flex-shrink:0;`
          : `width:8px;height:1px;background:${color};opacity:0.35;flex-shrink:0;`;
        // Build meta line: use scrollHighlightMeta if available, else story name + year
        let singleMeta = scrollHighlightMeta || '';
        if (!singleMeta) {
          const story = momentStoryMap.get(moment.id);
          const storyName = story?.name || '';
          const year = moment.year;
          singleMeta = storyName ? (year ? `${storyName} · ${year}` : storyName) : (year ? `${year}` : '');
        }
        const singleMetaHtml = singleMeta ? `<div class="scroll-label-meta">${singleMeta}</div>` : '';
        // When near bottom, shift anchor down so the container (which grows upward in column-reverse) stays visible
        const anchorY = nearBottom ? 60 : 6;
        const icon = L.divIcon({
          className: '',
          html: `<div class="scroll-label-container" style="${containerStyle}">
            <div class="scroll-label-dot" style="width:12px;height:12px;background:${color};box-shadow:0 0 8px ${color};border-radius:50%;flex-shrink:0;"></div>
            <div style="${stemStyle}"></div>
            <div class="scroll-label-text dark-tooltip" style="${borderStyle}box-shadow:0 4px 24px rgba(0,0,0,0.65),inset 0 0 12px ${innerGlow};">
              <div>${tooltipText}</div>
              ${singleMetaHtml}
            </div>
          </div>`,
          iconSize: [12, 12],
          iconAnchor: [6, anchorY],
        });
        const marker = L.marker([moment.lat, moment.lng], { icon, zIndexOffset: 900, interactive: true });
        const story = momentStoryMap.get(moment.id);
        marker.on('click', () => {
          if (onNavigateRef.current) {
            onNavigateRef.current();
          } else if (story) {
            onClickRef.current(moment, story);
          }
        });
        marker.addTo(map);
        scrollOverlayRef.current = marker;
      }
    }

    return () => {
      if (scrollOverlayRef.current) {
        map.removeLayer(scrollOverlayRef.current);
        scrollOverlayRef.current = null;
      }
      if (scrollPolylineRef.current) {
        map.removeLayer(scrollPolylineRef.current);
        scrollPolylineRef.current = null;
      }
      hideOffScreenArrow();
    };
  }, [scrollHighlight, scrollHighlightLabel, scrollHighlightMeta, map, momentCategoryMap]);

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
