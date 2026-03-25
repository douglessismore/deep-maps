import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { supabase } from '../lib/supabase';
import type { LocationAccuracy } from '../types';

// ─── Constants ───────────────────────────────────────────────────────

const SAT_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SAT_TILE_ATTR = '&copy; <a href="https://www.esri.com/">Esri</a>';
const PAGE_SIZE = 50;

const DRAGGABLE_MARKER_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width: 22px; height: 22px;
    background: #ef4444;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(0,0,0,0.7);
    cursor: grab;
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const ACCURACY_OPTIONS: { value: LocationAccuracy; icon: string; label: string }[] = [
  { value: 'exact', icon: '\ud83c\udfe0', label: 'Building' },
  { value: 'exact', icon: '\ud83d\udccd', label: 'Exact' },
  { value: 'general-area', icon: '\ud83d\uddfa\ufe0f', label: 'Area' },
];
// Fix: Building = approximate, Exact = exact, Area = general-area
ACCURACY_OPTIONS[0] = { value: 'approximate' as LocationAccuracy, icon: '\ud83c\udfe0', label: 'Building' };
ACCURACY_OPTIONS[1] = { value: 'exact', icon: '\ud83d\udccd', label: 'Exact' };
ACCURACY_OPTIONS[2] = { value: 'general-area', icon: '\ud83d\uddfa\ufe0f', label: 'Area' };

// ─── Types ───────────────────────────────────────────────────────────

interface VerifyMoment {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  lat: number;
  lng: number;
  address: string | null;
  accuracy: string;
  importance: string;
  geo_verified: boolean;
  geo_source_url: string | null;
  geo_verified_at: string | null;
  year: number | null;
}

interface CollectionOption {
  id: string;
  name: string;
}

interface SessionStats {
  verified: number;
  adjusted: number;
  skipped: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function loadSessionStats(): SessionStats {
  try {
    const raw = localStorage.getItem('deepmaps-verify-session');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { verified: 0, adjusted: 0, skipped: 0 };
}

function saveSessionStats(stats: SessionStats) {
  try {
    localStorage.setItem('deepmaps-verify-session', JSON.stringify(stats));
  } catch { /* ignore */ }
}

function isAdminMode(): boolean {
  try {
    return localStorage.getItem('deepmaps-admin') === 'true';
  } catch {
    return false;
  }
}

// ─── Component ───────────────────────────────────────────────────────

export function RapidVerify() {
  // Auth check
  const [isAdmin] = useState(isAdminMode);

  // Data
  const [moments, setMoments] = useState<VerifyMoment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [unverifiedOnly, setUnverifiedOnly] = useState(true);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [collectionMomentIds, setCollectionMomentIds] = useState<string[] | null>(null);

  // UI state
  const [adjustMode, setAdjustMode] = useState(false);
  const [flash, setFlash] = useState<'green' | 'gray' | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>(loadSessionStats);
  const [selectedAccuracy, setSelectedAccuracy] = useState<LocationAccuracy | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Adjust mode inputs
  const [adjustCoords, setAdjustCoords] = useState('');
  const [adjustAddress, setAdjustAddress] = useState('');
  const [adjustSourceUrl, setAdjustSourceUrl] = useState('');

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const draftCoordsRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  // Swipe refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = moments[currentIndex] ?? null;

  // ─── Fetch collections ────────────────────────────────────────────

  useEffect(() => {
    async function fetchCollections() {
      const { data } = await supabase
        .from('collections')
        .select('id, name')
        .order('name');
      if (data) setCollections(data);
    }
    fetchCollections();
  }, []);

  // ─── Fetch collection moment IDs when selection changes ───────────

  useEffect(() => {
    if (!selectedCollection) {
      setCollectionMomentIds(null);
      return;
    }
    async function fetchCollectionMoments() {
      const { data } = await supabase
        .from('collection_moments')
        .select('moment_id')
        .eq('collection_id', selectedCollection);
      if (data) setCollectionMomentIds(data.map((d) => d.moment_id));
    }
    fetchCollectionMoments();
  }, [selectedCollection]);

  // ─── Fetch moments ────────────────────────────────────────────────

  const fetchMoments = useCallback(async (offset: number, reset: boolean) => {
    setLoading(true);
    setError(null);
    try {
      // Build query for total/verified counts
      let countQuery = supabase.from('moments').select('id, geo_verified', { count: 'exact' });
      if (collectionMomentIds) {
        countQuery = countQuery.in('id', collectionMomentIds);
      }
      const { data: countData, count } = await countQuery;
      if (count != null) setTotalCount(count);
      if (countData) setVerifiedCount(countData.filter((m) => m.geo_verified).length);

      // Build query for page of moments
      let query = supabase
        .from('moments')
        .select('id, name, subtitle, description, location, address, accuracy, importance, geo_verified, geo_source_url, geo_verified_at, year')
        .order('importance', { ascending: true }) // 'major' sorts before 'minor' alphabetically — but we want major first
        .order('created_at', { ascending: true });

      if (unverifiedOnly) {
        query = query.eq('geo_verified', false);
      }
      if (collectionMomentIds) {
        query = query.in('id', collectionMomentIds);
      }

      query = query.range(offset, offset + PAGE_SIZE - 1);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const mapped: VerifyMoment[] = (data ?? []).map((row) => {
        const coords = row.location?.coordinates ?? [0, 0];
        return {
          id: row.id,
          name: row.name,
          subtitle: row.subtitle,
          description: row.description,
          lat: coords[1],
          lng: coords[0],
          address: row.address,
          accuracy: row.accuracy,
          importance: row.importance,
          geo_verified: row.geo_verified,
          geo_source_url: row.geo_source_url,
          geo_verified_at: row.geo_verified_at,
          year: row.year,
        };
      });

      // Sort: major first, then minor, then contextual
      const importanceOrder: Record<string, number> = { major: 0, minor: 1, contextual: 2 };
      mapped.sort((a, b) => (importanceOrder[a.importance] ?? 9) - (importanceOrder[b.importance] ?? 9));

      if (reset) {
        setMoments(mapped);
        setCurrentIndex(0);
      } else {
        setMoments((prev) => [...prev, ...mapped]);
      }
      setHasMore(mapped.length === PAGE_SIZE);
    } catch (err) {
      console.error('[RapidVerify] fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load moments');
    } finally {
      setLoading(false);
    }
  }, [unverifiedOnly, collectionMomentIds]);

  // Initial fetch + refetch on filter change
  useEffect(() => {
    fetchMoments(0, true);
  }, [fetchMoments]);

  // ─── Sync selected accuracy when current moment changes ───────────

  useEffect(() => {
    if (current) {
      setSelectedAccuracy(current.accuracy as LocationAccuracy);
      setAdjustMode(false);
      setAdjustCoords(`${current.lat.toFixed(6)}, ${current.lng.toFixed(6)}`);
      setAdjustAddress(current.address ?? '');
      setAdjustSourceUrl(current.geo_source_url ?? '');
    }
  }, [current]);

  // ─── Init / update Leaflet map ────────────────────────────────────

  useEffect(() => {
    if (!current || !mapContainerRef.current) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [current.lat, current.lng],
      zoom: 17,
      zoomControl: false,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
      touchZoom: true,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    });

    L.tileLayer(SAT_TILE_URL, { attribution: SAT_TILE_ATTR, maxZoom: 19 }).addTo(map);

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const marker = L.marker([current.lat, current.lng], {
      icon: DRAGGABLE_MARKER_ICON,
      draggable: true,
    }).addTo(map);

    draftCoordsRef.current = { lat: current.lat, lng: current.lng };

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      draftCoordsRef.current = { lat: pos.lat, lng: pos.lng };
      setAdjustCoords(`${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
    });

    markerRef.current = marker;
    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ──────────────────────────────────────────────────────

  const advanceToNext = useCallback(() => {
    setAdjustMode(false);
    if (currentIndex < moments.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (hasMore) {
      fetchMoments(moments.length, false);
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, moments.length, hasMore, fetchMoments]);

  const showFlash = useCallback((color: 'green' | 'gray') => {
    setFlash(color);
    setTimeout(() => setFlash(null), 400);
  }, []);

  const handleCorrect = useCallback(async () => {
    if (!current) return;
    try {
      // Update accuracy if changed
      if (selectedAccuracy && selectedAccuracy !== current.accuracy) {
        await supabase.from('moments').update({ accuracy: selectedAccuracy }).eq('id', current.id);
      }
      // Mark verified via RPC
      const { error: rpcError } = await supabase.rpc('update_moment_location', {
        p_id: current.id,
        p_lng: current.lng,
        p_lat: current.lat,
        p_source_url: null,
      });
      if (rpcError) throw rpcError;

      showFlash('green');
      const updated = { ...sessionStats, verified: sessionStats.verified + 1 };
      setSessionStats(updated);
      saveSessionStats(updated);
      setVerifiedCount((c) => c + 1);
      setTimeout(advanceToNext, 400);
    } catch (err) {
      console.error('[RapidVerify] correct error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [current, selectedAccuracy, sessionStats, advanceToNext, showFlash]);

  const handleSkip = useCallback(() => {
    showFlash('gray');
    const updated = { ...sessionStats, skipped: sessionStats.skipped + 1 };
    setSessionStats(updated);
    saveSessionStats(updated);
    setTimeout(advanceToNext, 200);
  }, [sessionStats, advanceToNext, showFlash]);

  const handleSaveAdjust = useCallback(async () => {
    if (!current) return;
    try {
      // Parse coordinates
      const match = adjustCoords.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
      if (!match) {
        setError('Invalid coordinates. Use format: 30.179407, -97.792633');
        return;
      }
      const newLat = parseFloat(match[1]);
      const newLng = parseFloat(match[2]);

      // Update accuracy if changed
      if (selectedAccuracy && selectedAccuracy !== current.accuracy) {
        await supabase.from('moments').update({ accuracy: selectedAccuracy }).eq('id', current.id);
      }

      // Update address if changed
      if (adjustAddress !== (current.address ?? '')) {
        await supabase.from('moments').update({ address: adjustAddress }).eq('id', current.id);
      }

      // Update location via RPC
      const { error: rpcError } = await supabase.rpc('update_moment_location', {
        p_id: current.id,
        p_lng: newLng,
        p_lat: newLat,
        p_source_url: adjustSourceUrl || null,
      });
      if (rpcError) throw rpcError;

      showFlash('green');
      const updated = { ...sessionStats, adjusted: sessionStats.adjusted + 1 };
      setSessionStats(updated);
      saveSessionStats(updated);
      setVerifiedCount((c) => c + 1);
      setTimeout(advanceToNext, 400);
    } catch (err) {
      console.error('[RapidVerify] adjust error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [current, adjustCoords, adjustAddress, adjustSourceUrl, selectedAccuracy, sessionStats, advanceToNext, showFlash]);

  const toggleAdjustMode = useCallback(() => {
    setAdjustMode((prev) => !prev);
  }, []);

  // ─── Keyboard shortcuts ───────────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'c':
          e.preventDefault();
          if (!adjustMode) handleCorrect();
          break;
        case 's':
          e.preventDefault();
          if (!adjustMode) handleSkip();
          break;
        case 'a':
          e.preventDefault();
          toggleAdjustMode();
          break;
        case '1':
          e.preventDefault();
          setSelectedAccuracy('approximate');
          break;
        case '2':
          e.preventDefault();
          setSelectedAccuracy('exact');
          break;
        case '3':
          e.preventDefault();
          setSelectedAccuracy('general-area');
          break;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adjustMode, handleCorrect, handleSkip, toggleAdjustMode]);

  // ─── Touch / swipe gestures ───────────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    // Long press for adjust
    holdTimerRef.current = setTimeout(() => {
      setAdjustMode(true);
      touchStartRef.current = null; // prevent swipe after hold
    }, 500);
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel hold if finger moves
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Require horizontal swipe > 80px in < 300ms, with horizontal dominance
    if (dt < 300 && Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0 && !adjustMode) {
        handleCorrect();
      } else if (dx < 0 && !adjustMode) {
        handleSkip();
      }
    }
  }, [adjustMode, handleCorrect, handleSkip]);

  // ─── Parse coord input and update marker ──────────────────────────

  const parseAndMoveMarker = useCallback(() => {
    const match = adjustCoords.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
    if (match) {
      const newLat = parseFloat(match[1]);
      const newLng = parseFloat(match[2]);
      if (newLat >= -90 && newLat <= 90 && newLng >= -180 && newLng <= 180) {
        draftCoordsRef.current = { lat: newLat, lng: newLng };
        markerRef.current?.setLatLng([newLat, newLng]);
        mapRef.current?.panTo([newLat, newLng]);
        setError(null);
        return;
      }
    }
    setError('Invalid coordinates. Use format: 30.179407, -97.792633');
  }, [adjustCoords]);

  // ─── Render ────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">Admin access required</p>
          <p className="text-sm text-gray-600">Set deepmaps-admin in localStorage to &quot;true&quot;</p>
        </div>
      </div>
    );
  }

  if (loading && moments.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Loading moments...</p>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-white text-lg mb-2">All done!</p>
          <p className="text-gray-400 text-sm">
            No {unverifiedOnly ? 'unverified ' : ''}moments
            {selectedCollection ? ' in this collection' : ''} to review.
          </p>
          <p className="text-gray-500 text-xs mt-4">
            Session: {sessionStats.verified} verified, {sessionStats.adjusted} adjusted, {sessionStats.skipped} skipped
          </p>
        </div>
      </div>
    );
  }

  const progressPct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0a0a0a] text-white overflow-hidden select-none">
      {/* Flash overlays */}
      {flash === 'green' && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-green-500/15 transition-opacity" />
      )}
      {flash === 'gray' && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-gray-500/15 transition-opacity" />
      )}

      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex-none px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base">{'\ud83d\udccd'}</span>
            <span className="text-sm font-bold tracking-tight">Rapid Verify</span>
          </div>
          <span className="text-xs font-mono text-gray-500">
            {currentIndex + 1}/{moments.length}{hasMore ? '+' : ''}
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500/70 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-600">
            {verifiedCount}/{totalCount} verified ({progressPct}%)
          </span>
          <span className="text-[10px] text-gray-600">
            Session: {sessionStats.verified}v {sessionStats.adjusted}a {sessionStats.skipped}s
          </span>
        </div>
      </div>

      {/* ─── Map ───────────────────────────────────────────────────── */}
      <div className="flex-none relative" style={{ height: '55dvh' }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        {/* Address overlay */}
        {current.address && (
          <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-black/60 backdrop-blur-sm px-3 py-1.5">
            <p className="text-xs text-gray-200 truncate">{current.address}</p>
          </div>
        )}
      </div>

      {/* ─── Card + controls (scrollable) ──────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Moment info */}
        <div>
          <h2 className="text-sm font-bold leading-tight">{current.name}</h2>
          {current.address && (
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
              {'\ud83d\udccd'} {current.address}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
            <span className="capitalize">{current.importance}</span>
            {current.year && <span>{'\u00b7'} {current.year}</span>}
            <span>{'\u00b7'} {current.accuracy}</span>
            {current.geo_verified && (
              <span className="text-green-500">{'\u00b7'} Verified</span>
            )}
          </div>
          {current.description && (
            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{current.description}</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-[11px] text-red-400">{error}</p>
        )}

        {/* Precision selector */}
        <div>
          <label className="block text-[10px] text-gray-600 mb-1">Precision</label>
          <div className="flex gap-1.5">
            {ACCURACY_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setSelectedAccuracy(opt.value)}
                className={`flex-1 px-2 py-1.5 rounded text-[11px] font-medium border transition-colors ${
                  selectedAccuracy === opt.value
                    ? 'border-white/30 bg-white/10 text-white'
                    : 'border-[#2a2a2a] bg-[#111] text-gray-500 hover:text-gray-300'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Adjust mode inputs */}
        {adjustMode && (
          <div className="space-y-2 border border-yellow-500/30 rounded-lg p-3 bg-yellow-500/5">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Coordinates</label>
              <input
                type="text"
                value={adjustCoords}
                onChange={(e) => setAdjustCoords(e.target.value)}
                onBlur={parseAndMoveMarker}
                onKeyDown={(e) => { if (e.key === 'Enter') parseAndMoveMarker(); }}
                placeholder="30.179407, -97.792633"
                className="w-full px-2.5 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Address</label>
              <input
                type="text"
                value={adjustAddress}
                onChange={(e) => setAdjustAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                className="w-full px-2.5 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Source URL</label>
              <input
                type="text"
                value={adjustSourceUrl}
                onChange={(e) => setAdjustSourceUrl(e.target.value)}
                placeholder="Google Maps link, wiki, etc."
                className="w-full px-2.5 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <button
              onClick={handleSaveAdjust}
              className="w-full px-3 py-2 text-xs font-medium rounded bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-600/30 transition-colors"
            >
              Save &amp; Next
            </button>
          </div>
        )}

        {/* Action buttons */}
        {!adjustMode && (
          <div className="flex gap-2">
            <button
              onClick={handleCorrect}
              className="flex-1 px-3 py-2.5 text-xs font-medium rounded bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 transition-colors active:scale-95"
            >
              {'\u2705'} Correct
            </button>
            <button
              onClick={toggleAdjustMode}
              className="flex-1 px-3 py-2.5 text-xs font-medium rounded bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-600/30 transition-colors active:scale-95"
            >
              {'\ud83d\udccd'} Adjust
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 px-3 py-2.5 text-xs font-medium rounded bg-gray-600/20 text-gray-400 border border-gray-500/30 hover:bg-gray-600/30 transition-colors active:scale-95"
            >
              {'\u23ed'} Skip
            </button>
          </div>
        )}

        {/* Filter controls */}
        <div className="flex items-center gap-2 pt-1 pb-2">
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={unverifiedOnly}
              onChange={(e) => setUnverifiedOnly(e.target.checked)}
              className="rounded border-gray-600 bg-[#111] text-green-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
            />
            Unverified only
          </label>
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="flex-1 px-2 py-1 bg-[#111] border border-[#2a2a2a] rounded text-[11px] text-gray-400 focus:outline-none focus:border-gray-500 max-w-[180px]"
          >
            <option value="">All moments</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default RapidVerify;
