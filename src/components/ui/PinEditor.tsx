import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { supabase } from '../../lib/supabase';

const SAT_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_TILE_ATTR = '&copy; <a href="https://www.esri.com/">Esri</a>';
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const DRAGGABLE_MARKER_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width: 18px; height: 18px;
    background: #ef4444;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0,0,0,0.6);
    cursor: grab;
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

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
}

export function PinEditor({
  momentId,
  lat,
  lng,
  address: initialAddress,
  geoSourceUrl: initialSourceUrl,
  geoVerified,
  momentName,
  onClose,
  onSaved,
}: PinEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const darkTileRef = useRef<L.TileLayer | null>(null);
  const satTileRef = useRef<L.TileLayer | null>(null);

  const [draftLat, setDraftLat] = useState(lat);
  const [draftLng, setDraftLng] = useState(lng);
  const [coordInput, setCoordInput] = useState(`${lat}, ${lng}`);
  const [address, setAddress] = useState(initialAddress ?? '');
  const [sourceUrl, setSourceUrl] = useState(initialSourceUrl ?? '');
  const [satellite, setSatellite] = useState(true); // Start in satellite view
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update coord input when marker is dragged
  useEffect(() => {
    setCoordInput(`${draftLat.toFixed(6)}, ${draftLng.toFixed(6)}`);
  }, [draftLat, draftLng]);

  // Initialize map
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

    // Start in satellite
    satLayer.addTo(map);
    darkTileRef.current = darkLayer;
    satTileRef.current = satLayer;

    const marker = L.marker([lat, lng], {
      icon: DRAGGABLE_MARKER_ICON,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setDraftLat(pos.lat);
      setDraftLng(pos.lng);
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Force a resize after mount (fixes grey tiles in modals)
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      darkTileRef.current = null;
      satTileRef.current = null;
    };
  }, [lat, lng]);

  // Toggle satellite/dark
  const handleToggleSatellite = useCallback(() => {
    const map = mapInstanceRef.current;
    const dark = darkTileRef.current;
    const sat = satTileRef.current;
    if (!map || !dark || !sat) return;

    if (satellite) {
      map.removeLayer(sat);
      dark.addTo(map);
    } else {
      map.removeLayer(dark);
      sat.addTo(map);
    }
    setSatellite(!satellite);
  }, [satellite]);

  // Parse coordinate input
  const parseCoordInput = useCallback(() => {
    const trimmed = coordInput.trim();
    // Accept "lat, lng" or "lat lng"
    const match = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
    if (match) {
      const newLat = parseFloat(match[1]);
      const newLng = parseFloat(match[2]);
      if (newLat >= -90 && newLat <= 90 && newLng >= -180 && newLng <= 180) {
        setDraftLat(newLat);
        setDraftLng(newLng);
        // Move marker and map
        markerRef.current?.setLatLng([newLat, newLng]);
        mapInstanceRef.current?.panTo([newLat, newLng]);
        setError(null);
        return;
      }
    }
    setError('Invalid coordinates. Use format: 30.179407, -97.792633');
  }, [coordInput]);

  // Save handler
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // 1. Update geo via RPC (sets point, marks verified)
      const { error: rpcError } = await supabase.rpc('update_moment_location', {
        p_id: momentId,
        p_lng: draftLng,
        p_lat: draftLat,
        p_source_url: sourceUrl || null,
      });
      if (rpcError) throw rpcError;

      // 2. Update address via direct update
      if (address !== (initialAddress ?? '')) {
        const { error: addrError } = await supabase
          .from('moments')
          .update({ address })
          .eq('id', momentId);
        if (addrError) throw addrError;
      }

      setSaved(true);
      onSaved?.(draftLat, draftLng, address);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      console.error('[PinEditor] Save failed:', err);
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const coordsChanged = draftLat !== lat || draftLng !== lng;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchMove={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full sm:max-w-md bg-[#111] border border-[#2a2a2a] rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white truncate pr-2">
              Edit Location
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-lg leading-none p-1"
            >
              &times;
            </button>
          </div>
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{momentName}</p>
          {geoVerified && (
            <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 rounded">
              Currently verified
            </span>
          )}
        </div>

        {/* Map with satellite toggle only */}
        <div className="relative">
          <div ref={mapRef} className="w-full h-[200px] sm:h-[350px]" />

          {/* Satellite toggle — top-left on map */}
          <button
            onClick={handleToggleSatellite}
            className="absolute top-2 left-2 z-[1000] px-2 py-1 text-[10px] bg-[#111]/90 text-gray-300 border border-[#2a2a2a] rounded hover:bg-[#222] transition-colors"
          >
            {satellite ? 'Dark' : 'Satellite'}
          </button>
        </div>

        {/* Controls — below map */}
        <div className="px-4 py-3 space-y-2">
          {/* Live coordinates — editable inputs */}
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">Coordinates</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={coordInput}
                onChange={(e) => setCoordInput(e.target.value)}
                onBlur={parseCoordInput}
                onKeyDown={(e) => { if (e.key === 'Enter') parseCoordInput(); }}
                placeholder="30.179407, -97.792633"
                className="flex-1 px-2.5 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 font-mono"
              />
              <button
                onClick={parseCoordInput}
                className="px-2.5 py-1.5 text-[10px] font-medium bg-white/10 hover:bg-white/15 border border-[#2a2a2a] rounded text-gray-300 transition-colors shrink-0"
              >
                Apply
              </button>
              {coordsChanged && (
                <span className="text-[10px] text-yellow-400 font-mono bg-yellow-400/10 px-1.5 py-0.5 rounded shrink-0">moved</span>
              )}
            </div>
          </div>

          {/* Address + Source URL — compact 2-column on wider screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                className="w-full px-2.5 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Source URL</label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Google Maps link, wiki, etc."
                className="w-full px-2.5 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          {/* Error display */}
          {error && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium rounded border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#444] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors disabled:opacity-60 ${
                saved
                  ? 'bg-green-600/30 text-green-400 border border-green-500/40'
                  : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
              }`}
            >
              {saving ? 'Saving...' : saved ? '\u2713 Saved & Verified' : 'Save & Verify'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
