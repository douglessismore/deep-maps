import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useAdminData } from '../AdminDataProvider';
import type { LocationAccuracy } from '../../types';

const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';
const SAT_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_TILE_ATTR = '&copy; <a href="https://www.esri.com/">Esri</a>';

const ACCURACY_COLORS: Record<LocationAccuracy, string> = {
  exact: 'bg-green-500/20 text-green-400 border-green-500/30',
  approximate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'general-area': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const RED_MARKER_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width: 14px; height: 14px;
    background: #ef4444;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 6px rgba(0,0,0,0.5);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface MiniMapProps {
  lat: number;
  lng: number;
  accuracy?: LocationAccuracy;
  address?: string;
  geoVerified?: boolean;
  geoSourceUrl?: string;
  editable?: boolean;
  onSave?: (lat: number, lng: number, sourceUrl: string) => Promise<void>;
  itemType?: string;
  itemId?: string;
}

export function MiniMap({
  lat,
  lng,
  accuracy,
  address,
  geoVerified,
  geoSourceUrl,
  editable = false,
  onSave,
  itemType,
  itemId,
}: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const darkTileRef = useRef<L.TileLayer | null>(null);
  const satTileRef = useRef<L.TileLayer | null>(null);

  const { addNote } = useAdminData();
  const [reporting, setReporting] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [draftLat, setDraftLat] = useState(lat);
  const [draftLng, setDraftLng] = useState(lng);
  const [sourceUrl, setSourceUrl] = useState(geoSourceUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Track whether coordinates were changed from original
  const coordsChanged = draftLat !== lat || draftLng !== lng;

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
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
    darkLayer.addTo(map);
    darkTileRef.current = darkLayer;
    satTileRef.current = satLayer;

    const marker = L.marker([lat, lng], {
      icon: RED_MARKER_ICON,
      draggable: editable,
    }).addTo(map);

    if (editable) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setDraftLat(pos.lat);
        setDraftLng(pos.lng);
      });
    }

    markerRef.current = marker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      darkTileRef.current = null;
      satTileRef.current = null;
    };
  }, [lat, lng, editable]);

  // Toggle satellite
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

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(draftLat, draftLng, sourceUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[MiniMap] Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReportInaccuracy = async () => {
    if (!itemType || !itemId) return;
    setReporting(true);
    await addNote(
      itemType as 'moment',
      itemId,
      'Location',
      'Location flagged as potentially inaccurate.'
    );
    setReporting(false);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${draftLat},${draftLng}`;

  return (
    <div className="relative">
      {/* Map */}
      <div ref={mapRef} className="w-full h-[350px] rounded border border-[#2a2a2a]" />

      {/* Accuracy badge overlay */}
      {accuracy && (
        <div className="absolute top-2 right-2 z-[1000] flex items-center gap-1.5">
          {geoVerified && (
            <span className="px-1.5 py-0.5 text-[10px] border rounded bg-green-500/20 text-green-400 border-green-500/30">
              &#10003; Verified
            </span>
          )}
          <span className={`px-1.5 py-0.5 text-[10px] border rounded ${ACCURACY_COLORS[accuracy]}`}>
            {accuracy}
          </span>
        </div>
      )}

      {/* Satellite toggle */}
      <button
        onClick={handleToggleSatellite}
        className="absolute top-2 left-2 z-[1000] px-2 py-1 text-[10px] bg-[#111]/90 text-gray-300 border border-[#2a2a2a] rounded hover:bg-[#222] transition-colors"
      >
        {satellite ? 'Dark' : 'Satellite'}
      </button>

      {/* Address */}
      {address && (
        <div className="mt-1.5 text-[10px] text-gray-500 truncate">
          {address}
        </div>
      )}

      {/* Coordinates + links */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-gray-600 font-mono">
          {draftLat.toFixed(5)}, {draftLng.toFixed(5)}
          {coordsChanged && <span className="text-yellow-400 ml-1">(moved)</span>}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-400/70 hover:text-blue-400 transition-colors"
          >
            Google Maps &#8599;
          </a>
          {itemType && itemId && (
            <button
              onClick={handleReportInaccuracy}
              disabled={reporting}
              className="text-[10px] text-orange-400/70 hover:text-orange-400 disabled:opacity-50 transition-colors"
            >
              {reporting ? 'Reporting...' : 'Report Inaccuracy'}
            </button>
          )}
        </div>
      </div>

      {/* Editable save controls */}
      {editable && onSave && (
        <div className="mt-2 space-y-2">
          {/* Source URL input */}
          <input
            type="text"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Source URL (Google Maps link, wiki, etc.)"
            className="w-full px-2 py-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
          />

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-50
              bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30"
          >
            {saving ? 'Saving...' : saved ? '\u2713 Saved & Verified' : 'Save & Verify'}
          </button>
        </div>
      )}
    </div>
  );
}
