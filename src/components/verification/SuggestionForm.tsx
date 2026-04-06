import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import type { LocationAccuracy } from '../../types';
import { submitSuggestion } from '../../lib/verification';

const SAT_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_TILE_ATTR = '&copy; <a href="https://www.esri.com/">Esri</a>';
const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const DRAGGABLE_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width: 18px; height: 18px;
    background: #e74c3c;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0,0,0,0.6);
    cursor: grab;
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const CURRENT_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width: 10px; height: 10px;
    background: #666;
    border: 2px solid #999;
    border-radius: 50%;
    opacity: 0.7;
  "></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const ACCURACY_OPTIONS: { value: LocationAccuracy; label: string; desc: string }[] = [
  { value: 'pinpoint', label: 'Pinpoint', desc: 'Within a few feet' },
  { value: 'exact', label: 'Exact', desc: 'The right building/spot' },
  { value: 'approximate', label: 'Approx', desc: 'Close but not exact' },
  { value: 'general-area', label: 'Area', desc: 'General vicinity' },
];

interface SuggestionFormProps {
  momentId: string;
  momentName: string;
  currentLat: number;
  currentLng: number;
  currentAccuracy: LocationAccuracy;
  onClose: () => void;
  onSubmitted: () => void;
  parentSuggestionId?: string;
}

export function SuggestionForm({
  momentId,
  momentName,
  currentLat,
  currentLng,
  currentAccuracy,
  onClose,
  onSubmitted,
  parentSuggestionId,
}: SuggestionFormProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [lat, setLat] = useState(currentLat);
  const [lng, setLng] = useState(currentLng);
  const [coordInput, setCoordInput] = useState(`${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`);
  const [accuracy, setAccuracy] = useState<LocationAccuracy>(currentAccuracy);
  const [explanation, setExplanation] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceDescription, setSourceDescription] = useState('');
  const [satellite, setSatellite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync coord display when marker dragged
  useEffect(() => {
    setCoordInput(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  }, [lat, lng]);

  // Initialize mini-map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [currentLat, currentLng],
      zoom: 17,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
    });

    // Tile layers
    const darkTile = L.tileLayer(DARK_TILE_URL, { attribution: DARK_TILE_ATTR });
    const satTile = L.tileLayer(SAT_TILE_URL, { attribution: SAT_TILE_ATTR });
    satTile.addTo(map); // Start satellite

    // Current location marker (gray, non-draggable)
    L.marker([currentLat, currentLng], { icon: CURRENT_ICON, interactive: false }).addTo(map);

    // Draggable suggestion marker
    const marker = L.marker([currentLat, currentLng], {
      icon: DRAGGABLE_ICON,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setLat(pos.lat);
      setLng(pos.lng);
    });

    // Double-click to move marker
    map.on('dblclick', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Store tile refs for toggle
    (map as any)._darkTile = darkTile;
    (map as any)._satTile = satTile;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [currentLat, currentLng]);

  // Toggle satellite/dark
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const dark = (map as any)._darkTile as L.TileLayer;
    const sat = (map as any)._satTile as L.TileLayer;
    if (satellite) {
      if (map.hasLayer(dark)) map.removeLayer(dark);
      if (!map.hasLayer(sat)) sat.addTo(map);
    } else {
      if (map.hasLayer(sat)) map.removeLayer(sat);
      if (!map.hasLayer(dark)) dark.addTo(map);
    }
  }, [satellite]);

  // Parse pasted coordinates
  const handleCoordPaste = useCallback((value: string) => {
    setCoordInput(value);
    const match = value.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
    if (match) {
      const newLat = parseFloat(match[1]);
      const newLng = parseFloat(match[2]);
      if (!isNaN(newLat) && !isNaN(newLng) && Math.abs(newLat) <= 90 && Math.abs(newLng) <= 180) {
        setLat(newLat);
        setLng(newLng);
        markerRef.current?.setLatLng([newLat, newLng]);
        mapInstanceRef.current?.panTo([newLat, newLng]);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim()) {
      setError('Source URL is required');
      return;
    }
    if (!explanation.trim()) {
      setError('Explanation is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await submitSuggestion({
      momentId,
      lat,
      lng,
      accuracyLevel: accuracy,
      explanation: explanation.trim(),
      sourceUrl: sourceUrl.trim(),
      sourceDescription: sourceDescription.trim() || undefined,
      parentSuggestionId,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      onSubmitted();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {parentSuggestionId ? 'Suggest Refinement' : 'Suggest Location'}
            </h2>
            <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[250px]">
              {momentName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Mini-map with draggable pin */}
          <div>
            <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Drop pin on the correct location
            </label>
            <div className="relative">
              <div ref={mapRef} className="w-full h-[200px] rounded-lg border border-[var(--border-subtle)]" />
              <button
                type="button"
                onClick={() => setSatellite(!satellite)}
                className="absolute top-2 right-2 z-[1000] px-2 py-1 text-[10px] font-mono rounded bg-black/70 text-white hover:bg-black/90 transition-colors"
              >
                {satellite ? 'Map' : 'Satellite'}
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Drag the red pin or double-click to reposition. Gray dot = current location.
            </p>
          </div>

          {/* Coordinate input */}
          <div>
            <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Coordinates (paste from Google Maps)
            </label>
            <input
              type="text"
              value={coordInput}
              onChange={(e) => handleCoordPaste(e.target.value)}
              placeholder="30.267153, -97.743061"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e74c3c] focus:ring-1 focus:ring-[#e74c3c]/30 transition-all"
            />
          </div>

          {/* Accuracy level */}
          <div>
            <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
              Accuracy level
            </label>
            <div className="flex gap-1.5">
              {ACCURACY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAccuracy(opt.value)}
                  className={`flex-1 py-1.5 px-1 rounded-lg text-center transition-all border ${
                    accuracy === opt.value
                      ? 'bg-[#e74c3c]/15 border-[#e74c3c]/40 text-[#e74c3c]'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-hover)]'
                  }`}
                >
                  <div className="text-[11px] font-medium">{opt.label}</div>
                  <div className="text-[9px] opacity-60">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Source URL (required) */}
          <div>
            <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Source URL <span className="text-[#e74c3c]">*</span>
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              required
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e74c3c] focus:ring-1 focus:ring-[#e74c3c]/30 transition-all"
            />
          </div>

          {/* Source description */}
          <div>
            <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Source context (optional)
            </label>
            <input
              type="text"
              value={sourceDescription}
              onChange={(e) => setSourceDescription(e.target.value)}
              placeholder="Book reference, personal knowledge, etc."
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e74c3c] focus:ring-1 focus:ring-[#e74c3c]/30 transition-all"
            />
          </div>

          {/* Explanation (required) */}
          <div>
            <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Explanation <span className="text-[#e74c3c]">*</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Why is this location more accurate?"
              required
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e74c3c] focus:ring-1 focus:ring-[#e74c3c]/30 transition-all resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !sourceUrl.trim() || !explanation.trim()}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#e74c3c] text-white hover:bg-[#c0392b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
