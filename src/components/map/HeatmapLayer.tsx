import { useEffect, useMemo, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { StoryCategory, InteractionMode } from '../../types';
import { getEffectiveNotability } from '../../lib/notability';
import { useAppData } from '../../lib/data/provider';

// ── Max notability in the dataset (for normalization) ──
const MAX_NOTABILITY = 88;

// ── Warm amber gradient — visible on light, dark, and satellite tiles ──
// leaflet.heat controls alpha internally via intensity; gradient colors must be solid.
// Compressed so low-intensity areas still get a visible amber tint.
const HEAT_GRADIENT: Record<number, string> = {
  0.0: '#0d0500',       // Near-transparent warm black (only used at zero intensity)
  0.1: '#92400e',       // amber-800 — visible even at low intensity
  0.3: '#b45309',       // amber-700
  0.5: '#d97706',       // amber-600
  0.7: '#f59e0b',       // amber-500
  0.85: '#fbbf24',      // amber-400
  1.0: '#fde68a',       // amber-200 — bright hot center
};

// ── Zoom-dependent opacity curve ──
// At zoom ≤ 4: full opacity (sparse pins, heatmap guides exploration)
// At zoom 5-10: linear fade as more pins appear
// At zoom ≥ 11: invisible (all pins visible, heatmap redundant)
function getHeatmapOpacity(zoom: number): number {
  if (zoom <= 4) return 0.55;
  if (zoom >= 11) return 0;
  // Linear: zoom 4 → 0.55, zoom 11 → 0
  return 0.55 * (1 - (zoom - 4) / 7);
}

interface HeatmapLayerProps {
  categoryFilter: StoryCategory | null;
  mode: InteractionMode;
}

export function HeatmapLayer({ categoryFilter, mode }: HeatmapLayerProps) {
  const { moments, stories } = useAppData();

  const momentCategoryMap = useMemo(() => {
    const catMap = new Map<string, StoryCategory>();
    for (const story of stories) {
      for (const sm of story.moments) {
        if (!catMap.has(sm.momentId)) catMap.set(sm.momentId, story.category);
      }
    }
    return catMap;
  }, [stories]);

  const map = useMap();
  const heatLayerRef = useRef<L.HeatLayer | null>(null);

  // ── Build heatmap data points ──
  // Uses ALL moments (bypasses notability filter) — that's the whole point.
  // Notability score becomes intensity weight.
  const heatData = useMemo(() => {
    const source = categoryFilter
      ? moments.filter((m) => momentCategoryMap.get(m.id) === categoryFilter)
      : moments;

    return source.map((m) => {
      const score = getEffectiveNotability(m);
      const intensity = Math.max(0.1, Math.min(1, score / MAX_NOTABILITY));
      return [m.lat, m.lng, intensity] as [number, number, number];
    });
  }, [categoryFilter]);

  // ── Create / update / destroy the heat layer ──
  useEffect(() => {
    // Hide in story/entity mode — focused views, heatmap is noise
    if (mode === 'story' || mode === 'entity') {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    if (heatData.length === 0) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    if (heatLayerRef.current) {
      // Update existing layer's data (category filter changed)
      heatLayerRef.current.setLatLngs(heatData);
    } else {
      // Create new heat layer
      const layer = L.heatLayer(heatData, {
        radius: 40,
        blur: 30,
        maxZoom: 10,
        max: 1.0,
        minOpacity: 0.35,
        gradient: HEAT_GRADIENT,
      });

      layer.addTo(map);
      heatLayerRef.current = layer;
    }

    // Set opacity for current zoom
    const opacity = getHeatmapOpacity(map.getZoom());
    const canvas = heatLayerRef.current?._canvas;
    if (canvas) {
      canvas.style.opacity = String(opacity);
      canvas.style.transition = 'opacity 0.3s ease';
    }

    // Cleanup on unmount
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [heatData, mode, map]);

  // ── Zoom-dependent opacity updates ──
  useMapEvents({
    zoomend: () => {
      if (!heatLayerRef.current) return;
      const opacity = getHeatmapOpacity(map.getZoom());
      const canvas = heatLayerRef.current._canvas;
      if (canvas) {
        canvas.style.opacity = String(opacity);
        canvas.style.transition = 'opacity 0.3s ease';
      }
    },
  });

  return null;
}
