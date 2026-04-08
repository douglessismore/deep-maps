import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { supabase } from '../../lib/supabase';
import type { LocationAccuracy, Moment } from '../../types';
import type { AppData } from '../../lib/data/provider';
import { queryClient, dataSource } from '../../lib/data/provider';
import { submitSuggestion } from '../../lib/verification';

const SAT_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_TILE_ATTR = '&copy; <a href="https://www.esri.com/">Esri</a>';
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Gray dot showing the current/original location
const CURRENT_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width: 10px; height: 10px;
    background: #888;
    border: 2px solid #bbb;
    border-radius: 50%;
    opacity: 0.8;
  "></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// ─── Zoom → Accuracy mapping ────────────────────────────────────────
const ZOOM_ACCURACY: [number, LocationAccuracy][] = [
  [18, 'pinpoint'],
  [16, 'exact'],
  [13, 'approximate'],
  [0, 'general-area'],
];

function getAccuracyFromZoom(zoom: number): LocationAccuracy {
  for (const [minZoom, acc] of ZOOM_ACCURACY) {
    if (zoom >= minZoom) return acc;
  }
  return 'general-area';
}

const ACCURACY_META: Record<LocationAccuracy, { label: string; color: string }> = {
  pinpoint: { label: 'Pinpoint', color: '#10b981' },
  exact: { label: 'Exact', color: '#22c55e' },
  approximate: { label: 'Approx', color: '#eab308' },
  'general-area': { label: 'Area', color: '#f97316' },
};

const ACCURACY_OPTIONS: LocationAccuracy[] = ['pinpoint', 'exact', 'approximate', 'general-area'];

interface PinEditorProps {
  momentId: string;
  lat: number;
  lng: number;
  address?: string;
  accuracy?: string;
  geoVerified?: boolean;
  geoSourceUrl?: string;
  momentName: string;
  onClose: () => void;
  onSaved?: (lat: number, lng: number, address: string) => void;
  /** 'admin' = direct save (default), 'suggest' = creates a community suggestion */
  mode?: 'admin' | 'suggest';
  /** For refinement flow — links this suggestion as a child of another */
  parentSuggestionId?: string;
}

export function PinEditor({
  momentId,
  lat,
  lng,
  address: initialAddress,
  accuracy,
  geoSourceUrl: initialSourceUrl,
  momentName,
  onClose,
  onSaved,
  mode = 'admin',
  parentSuggestionId,
}: PinEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const darkTileRef = useRef<L.TileLayer | null>(null);
  const satTileRef = useRef<L.TileLayer | null>(null);

  const [draftLat, setDraftLat] = useState(lat);
  const [draftLng, setDraftLng] = useState(lng);
  const [coordInput, setCoordInput] = useState(`${lat}, ${lng}`);
  const [address, setAddress] = useState(initialAddress ?? '');
  const [sourceUrl, setSourceUrl] = useState(initialSourceUrl ?? '');
  const [satellite, setSatellite] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Accuracy
  const [suggestAccuracy, setSuggestAccuracy] = useState<LocationAccuracy>((accuracy as LocationAccuracy) ?? 'approximate');
  const [manualAccuracy, setManualAccuracy] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(17);
  // Suggestion-mode
  const [explanation, setExplanation] = useState('');

  // Sync coord display
  useEffect(() => {
    setCoordInput(`${draftLat.toFixed(6)}, ${draftLng.toFixed(6)}`);
  }, [draftLat, draftLng]);

  // ── Initialize map with crosshair approach ──
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 17,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
      touchZoom: true,
      boxZoom: false,
      keyboard: true,
      attributionControl: false,
    });

    const darkLayer = L.tileLayer(DARK_TILE_URL, { attribution: DARK_TILE_ATTR });
    const satLayer = L.tileLayer(SAT_TILE_URL, { attribution: SAT_TILE_ATTR });
    satLayer.addTo(map);
    darkTileRef.current = darkLayer;
    satTileRef.current = satLayer;

    // Gray dot at original location
    L.marker([lat, lng], { icon: CURRENT_ICON, interactive: false }).addTo(map);

    // Map center = selected location (crosshair approach)
    map.on('moveend', () => {
      const c = map.getCenter();
      setDraftLat(c.lat);
      setDraftLng(c.lng);
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      darkTileRef.current = null;
      satTileRef.current = null;
    };
  }, [lat, lng]);

  // Auto-detect accuracy from zoom (unless manually overridden)
  useEffect(() => {
    if (!manualAccuracy) {
      setSuggestAccuracy(getAccuracyFromZoom(currentZoom));
    }
  }, [currentZoom, manualAccuracy]);

  // Toggle satellite/dark
  const handleToggleSatellite = useCallback(() => {
    const map = mapInstanceRef.current;
    const dark = darkTileRef.current;
    const sat = satTileRef.current;
    if (!map || !dark || !sat) return;
    if (satellite) { map.removeLayer(sat); dark.addTo(map); }
    else { map.removeLayer(dark); sat.addTo(map); }
    setSatellite(!satellite);
  }, [satellite]);

  // Parse coordinate input → pan map (crosshair stays centered)
  const parseCoordInput = useCallback(() => {
    const match = coordInput.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
    if (match) {
      const newLat = parseFloat(match[1]);
      const newLng = parseFloat(match[2]);
      if (newLat >= -90 && newLat <= 90 && newLng >= -180 && newLng <= 180) {
        setDraftLat(newLat);
        setDraftLng(newLng);
        mapInstanceRef.current?.setView([newLat, newLng], mapInstanceRef.current.getZoom());
        setError(null);
        return;
      }
    }
    setError('Invalid coordinates. Use format: 30.179407, -97.792633');
  }, [coordInput]);

  // Suggestion save
  const handleSuggest = async () => {
    if (!sourceUrl.trim()) { setError('Source URL is required'); return; }
    if (!explanation.trim()) { setError('Please explain why this location is more accurate'); return; }
    setSaving(true);
    setError(null);
    try {
      const result = await submitSuggestion({
        momentId, lat: draftLat, lng: draftLng,
        accuracyLevel: suggestAccuracy,
        explanation: explanation.trim(),
        sourceUrl: sourceUrl.trim(),
        parentSuggestionId,
      });
      if (result.error) throw new Error(result.error);
      setSaved(true);
      onSaved?.(draftLat, draftLng, address);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally { setSaving(false); }
  };

  // Admin save
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('update_moment_location', {
        p_id: momentId, p_lng: draftLng, p_lat: draftLat,
        p_source_url: sourceUrl || null,
        p_accuracy: suggestAccuracy,
      });
      if (rpcError) throw rpcError;
      if (address !== (initialAddress ?? '')) {
        const { error: addrError } = await supabase.from('moments').update({ address }).eq('id', momentId);
        if (addrError) throw addrError;
      }
      // Patch TanStack Query cache so coords + geoVerified appear instantly
      queryClient.setQueryData(['app-data', dataSource], (prev: unknown) => {
        if (!prev || typeof prev !== 'object') return prev;
        const data = prev as AppData;
        return {
          ...data,
          moments: data.moments.map((m: Moment) =>
            m.id === momentId
              ? { ...m, lat: draftLat, lng: draftLng, accuracy: suggestAccuracy, geoVerified: true, address: address || m.address }
              : m
          ),
        };
      });
      setSaved(true);
      onSaved?.(draftLat, draftLng, address);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  };

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const coordsChanged = draftLat !== lat || draftLng !== lng;
  const autoAcc = getAccuracyFromZoom(currentZoom);
  const accMeta = ACCURACY_META[suggestAccuracy];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full sm:max-w-md bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)] truncate pr-2">
              {mode === 'suggest' ? 'Suggest Better Location' : 'Edit Location'}
            </h3>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-lg leading-none p-1">
              &times;
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{momentName}</p>
          {mode === 'suggest' && (
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Pan the map to position the crosshair. Zoom in for higher accuracy.
            </p>
          )}
        </div>

        {/* Map with crosshair overlay */}
        <div className="relative">
          <div ref={mapRef} className="w-full h-[220px] sm:h-[350px]" />

          {/* ── Crosshair overlay ── */}
          <div className="absolute inset-0 z-[1001] pointer-events-none flex items-center justify-center">
            {/* Outer circle */}
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full border-2"
                style={{
                  borderColor: `${accMeta.color}99`,
                  boxShadow: `0 0 12px ${accMeta.color}33, inset 0 0 8px ${accMeta.color}11`,
                }}
              />
              {/* Horizontal line */}
              <div className="absolute top-1/2 left-0 w-full h-px -translate-y-px" style={{ backgroundColor: `${accMeta.color}55` }} />
              {/* Vertical line */}
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-px" style={{ backgroundColor: `${accMeta.color}55` }} />
              {/* Center dot */}
              <div
                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{ backgroundColor: accMeta.color }}
              />
            </div>
            {/* Accuracy label below crosshair */}
            <div
              className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wider uppercase"
              style={{ top: 'calc(50% + 32px)', color: accMeta.color, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
            >
              {accMeta.label}
              {!manualAccuracy && <span className="opacity-50 ml-1 font-normal normal-case">auto</span>}
            </div>
          </div>

          {/* Satellite toggle */}
          <button
            onClick={handleToggleSatellite}
            className="absolute top-2 left-2 z-[1002] px-2 py-1 text-[10px] bg-black/60 text-white/80 rounded hover:bg-black/80 transition-colors backdrop-blur-sm"
          >
            {satellite ? 'Map' : 'Satellite'}
          </button>

          {/* Moved indicator */}
          {coordsChanged && (
            <div className="absolute top-2 right-2 z-[1002] px-2 py-1 text-[10px] font-mono bg-yellow-500/20 text-yellow-400 rounded backdrop-blur-sm">
              moved
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-4 py-3 space-y-2.5">
          {/* Coordinates */}
          <div>
            <label className="block text-[10px] text-[var(--text-muted)] mb-1">Coordinates</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={coordInput}
                onChange={(e) => setCoordInput(e.target.value)}
                onBlur={parseCoordInput}
                onKeyDown={(e) => { if (e.key === 'Enter') parseCoordInput(); }}
                placeholder="30.179407, -97.792633"
                className="flex-1 px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-red-500/50 font-mono"
              />
              <button
                onClick={parseCoordInput}
                className="px-2.5 py-1.5 text-[10px] font-medium bg-[var(--bg-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)] rounded text-[var(--text-secondary)] transition-colors shrink-0"
              >
                Go
              </button>
            </div>
          </div>

          {/* Address + Source URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mode === 'admin' && (
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">Address</label>
                <input
                  type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                  className="w-full px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-red-500/50"
                />
              </div>
            )}
            <div className={mode === 'admin' ? '' : 'col-span-full'}>
              <label className="block text-[10px] text-[var(--text-muted)] mb-1">
                Source URL {mode === 'suggest' && <span className="text-red-400">*</span>}
              </label>
              <input
                type="text" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Google Maps link, article, etc."
                className="w-full px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          {/* Suggest mode: accuracy + explanation */}
          {mode === 'suggest' && (
            <>
              {/* Accuracy selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-[var(--text-muted)]">Accuracy Level</label>
                  {manualAccuracy && (
                    <button
                      onClick={() => setManualAccuracy(false)}
                      className="text-[9px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      reset to auto
                    </button>
                  )}
                </div>
                <div className="flex gap-1">
                  {ACCURACY_OPTIONS.map((acc) => {
                    const meta = ACCURACY_META[acc];
                    const isActive = suggestAccuracy === acc;
                    const isAuto = !manualAccuracy && acc === autoAcc;
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => { setSuggestAccuracy(acc); setManualAccuracy(true); }}
                        className={`flex-1 py-1.5 rounded text-[10px] font-medium transition-all border ${
                          isActive
                            ? 'border-opacity-50'
                            : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                        }`}
                        style={isActive ? {
                          backgroundColor: `${meta.color}18`,
                          borderColor: `${meta.color}55`,
                          color: meta.color,
                        } : undefined}
                      >
                        {meta.label}
                        {isAuto && !isActive && <span className="opacity-40 ml-0.5">*</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">
                  Why is this more accurate? <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={explanation} onChange={(e) => setExplanation(e.target.value)}
                  placeholder="I found the exact spot using historical aerial photos..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-red-500/50 resize-none"
                />
              </div>
            </>
          )}

          {error && <p className="text-[11px] text-red-400">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium rounded border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={mode === 'suggest' ? handleSuggest : handleSave}
              disabled={saving || saved}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors disabled:opacity-60 ${
                saved
                  ? 'bg-green-600/30 text-green-400 border border-green-500/40'
                  : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
              }`}
            >
              {saving
                ? (mode === 'suggest' ? 'Submitting...' : 'Saving...')
                : saved
                  ? (mode === 'suggest' ? '\u2713 Submitted' : '\u2713 Saved')
                  : (mode === 'suggest' ? 'Submit Suggestion' : 'Save & Verify')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
