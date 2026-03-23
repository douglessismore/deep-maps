import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useAdminData } from '../AdminDataProvider';
import type { LocationAccuracy } from '../../types';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

const ACCURACY_COLORS: Record<LocationAccuracy, string> = {
  exact: 'bg-green-500/20 text-green-400 border-green-500/30',
  approximate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'general-area': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

interface MiniMapProps {
  lat: number;
  lng: number;
  accuracy?: LocationAccuracy;
  itemType?: string;
  itemId?: string;
}

export function MiniMap({ lat, lng, accuracy, itemType, itemId }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const { addNote } = useAdminData();
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    });

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR }).addTo(map);

    L.circleMarker([lat, lng], {
      radius: 6,
      fillColor: '#ef4444',
      fillOpacity: 0.9,
      color: '#ef4444',
      weight: 2,
      opacity: 0.5,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [lat, lng]);

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

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[200px] rounded border border-[#2a2a2a]" />
      {/* Accuracy badge overlay */}
      {accuracy && (
        <div className="absolute top-2 right-2 z-[1000]">
          <span className={`px-1.5 py-0.5 text-[10px] border rounded ${ACCURACY_COLORS[accuracy]}`}>
            {accuracy}
          </span>
        </div>
      )}
      {/* Coordinates + report */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-gray-600 font-mono">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
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
  );
}
