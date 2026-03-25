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

const ACCURACY_OPTIONS: { value: LocationAccuracy; icon: string; label: string; desc: string }[] = [
  { value: 'exact' as LocationAccuracy, icon: '📍', label: 'Pinpoint', desc: '~3m — the exact spot' },
  { value: 'approximate' as LocationAccuracy, icon: '🎯', label: 'Exact', desc: '~10-50m — correct building' },
  { value: 'general-area' as LocationAccuracy, icon: '🗺️', label: 'Area', desc: '~100m+ — right neighborhood' },
];

/** CSS for card slide animation and streak pulse */
const ANIMATION_STYLES = `
@keyframes rv-slide-out-left {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-100%); opacity: 0; }
}
@keyframes rv-slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes rv-pulse-progress {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
@keyframes rv-streak-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
@keyframes rv-toast-fade {
  0% { opacity: 1; transform: translateY(0); }
  70% { opacity: 1; transform: translateY(-8px); }
  100% { opacity: 0; transform: translateY(-16px); }
}
.rv-slide-out { animation: rv-slide-out-left 0.25s ease-in forwards; }
.rv-slide-in { animation: rv-slide-in-right 0.25s ease-out forwards; }
.rv-progress-pulse { animation: rv-pulse-progress 0.6s ease-in-out; }
.rv-streak-pulse { animation: rv-streak-pulse 0.3s ease-in-out; }
.rv-toast { animation: rv-toast-fade 0.8s ease-out forwards; }
`;

/** Generate verification source links for a moment */
function getSourceLinks(m: VerifyMoment): { label: string; url: string; primary?: boolean }[] {
  const links: { label: string; url: string; primary?: boolean }[] = [];
  // Google Maps search for the address
  if (m.address) {
    links.push({
      label: `📍 Google Maps: "${m.address.slice(0, 40)}${m.address.length > 40 ? '...' : ''}"`,
      url: `https://www.google.com/maps/search/${encodeURIComponent(m.address)}`,
      primary: true,
    });
  }
  // Web search for the event + location
  const searchTerms = m.name.replace(/[''""]/g, '').slice(0, 80);
  links.push({
    label: `🔍 Search: "${searchTerms.slice(0, 40)}..."`,
    url: `https://www.google.com/search?q=${encodeURIComponent(searchTerms + ' exact location address')}`,
  });
  return links;
}

/** Geocode an address using Nominatim (OpenStreetMap) — free, no API key */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { 'User-Agent': 'DeepMaps/1.0 (deepmaps.app)' } }
    );
    const results = await resp.json();
    if (results.length > 0) {
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

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
  const [descExpanded, setDescExpanded] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<{ lat: number; lng: number } | null>(null);

  // New UI state
  const [streak, setStreak] = useState(0);
  const [streakPulse, setStreakPulse] = useState(false);
  const [progressPulse, setProgressPulse] = useState(false);
  const [cardAnim, setCardAnim] = useState<'idle' | 'out' | 'in'>('idle');
  const [showToast, setShowToast] = useState(false);
  const [precisionOpen, setPrecisionOpen] = useState(false);

  // Search / jump-to
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sources + Notes
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [sourcesOpen, setSourcesOpen] = useState(false);

  // Flagged filter
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  // Adjust mode inputs
  const [adjustCoords, setAdjustCoords] = useState('');
  const [adjustAddress, setAdjustAddress] = useState('');
  const [adjustSourceUrl, setAdjustSourceUrl] = useState('');

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const draftCoordsRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  // Search click-away ref
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Swipe refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = moments[currentIndex] ?? null;

  /** Build combined geo_source_url value from sources + notes */
  const buildSourceField = useCallback((urls: string[], notes: string): string | null => {
    const urlsPart = urls.filter(Boolean).join('\n');
    const notesPart = notes.trim();
    if (!urlsPart && !notesPart) return null;
    if (!notesPart) return urlsPart;
    return urlsPart + '\n---NOTES---\n' + notesPart;
  }, []);

  /** Search results — check local array first, fall back to Supabase for full search */
  const [supabaseSearchResults, setSupabaseSearchResults] = useState<{ id: string; name: string }[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingJumpId = useRef<string | null>(null);

  // Local search (instant, within loaded moments)
  const localSearchResults = searchQuery.trim().length >= 2
    ? moments
        .map((m, i) => ({ moment: m, index: i }))
        .filter(({ moment }) => moment.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 8)
    : [];

  // Supabase search (debounced, searches ALL moments)
  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSupabaseSearchResults([]); return; }
    if (localSearchResults.length >= 3) { setSupabaseSearchResults([]); return; } // local has enough
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('moments')
        .select('id, name')
        .ilike('name', `%${searchQuery.trim()}%`)
        .limit(8);
      if (data) setSupabaseSearchResults(data.filter(d => !moments.some(m => m.id === d.id)));
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery, moments, localSearchResults.length]);

  const searchResults = localSearchResults;

  // Resolve pending jump when moments array updates
  useEffect(() => {
    if (pendingJumpId.current && moments.length > 0) {
      const idx = moments.findIndex(m => m.id === pendingJumpId.current);
      if (idx >= 0) {
        setCurrentIndex(idx);
        pendingJumpId.current = null;
      }
    }
  }, [moments]);

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

      if (flaggedOnly) {
        // Flagged = unverified AND has an address (attempted geocode)
        query = query.eq('geo_verified', false).not('address', 'is', null);
      } else if (unverifiedOnly) {
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
  }, [unverifiedOnly, flaggedOnly, collectionMomentIds]);

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
      setPrecisionOpen(false);

      // Parse geo_source_url into sources + notes
      const raw = current.geo_source_url ?? '';
      if (raw.includes('\n---NOTES---\n')) {
        const [urlsPart, notesPart] = raw.split('\n---NOTES---\n');
        setSourceUrls(urlsPart ? urlsPart.split('\n').filter(Boolean) : []);
        setVerifyNotes(notesPart ?? '');
      } else {
        setSourceUrls(raw ? raw.split('\n').filter(Boolean) : []);
        setVerifyNotes('');
      }
      setNewSourceUrl('');
      setSourcesOpen(false);

      // Adjust mode source URL — use raw value
      setAdjustSourceUrl(raw);
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
    // Street labels overlay on satellite for navigation
    L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png', {
      maxZoom: 19,
      opacity: 0.85,
    }).addTo(map);

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
    setSourceUrls([]);
    setNewSourceUrl('');
    setVerifyNotes('');
    setSourcesOpen(false);
    setDescExpanded(false);
    setGeocodeResult(null);
    setCardAnim('in');
    setTimeout(() => setCardAnim('idle'), 300);
    if (currentIndex < moments.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (hasMore) {
      fetchMoments(moments.length, false);
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, moments.length, hasMore, fetchMoments]);

  const showFlash = useCallback((color: 'green' | 'gray') => {
    setFlash(color);
    setTimeout(() => setFlash(null), 200);
  }, []);

  const triggerProgressPulse = useCallback(() => {
    setProgressPulse(true);
    setTimeout(() => setProgressPulse(false), 600);
  }, []);

  const handleCorrect = useCallback(async () => {
    if (!current) return;
    try {
      // Update accuracy if changed
      if (selectedAccuracy && selectedAccuracy !== current.accuracy) {
        await supabase.from('moments').update({ accuracy: selectedAccuracy }).eq('id', current.id);
      }
      // Mark verified via RPC (include source URLs + notes if provided)
      const sourceField = buildSourceField(sourceUrls, verifyNotes);
      const { error: rpcError } = await supabase.rpc('update_moment_location', {
        p_id: current.id,
        p_lng: current.lng,
        p_lat: current.lat,
        p_source_url: sourceField,
      });
      if (rpcError) throw rpcError;

      showFlash('green');
      triggerProgressPulse();

      // Streak
      setStreak((s) => {
        const next = s + 1;
        if (next >= 3) {
          setStreakPulse(true);
          setTimeout(() => setStreakPulse(false), 300);
        }
        return next;
      });

      // Toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 800);

      // Card slide-out animation
      setCardAnim('out');

      const updated = { ...sessionStats, verified: sessionStats.verified + 1 };
      setSessionStats(updated);
      saveSessionStats(updated);
      setVerifiedCount((c) => c + 1);
      setTimeout(advanceToNext, 250);
    } catch (err) {
      console.error('[RapidVerify] correct error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [current, selectedAccuracy, sourceUrls, verifyNotes, buildSourceField, sessionStats, advanceToNext, showFlash, triggerProgressPulse]);

  const handleSkip = useCallback(() => {
    showFlash('gray');
    setStreak(0);
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
      triggerProgressPulse();
      setStreak(0); // Adjust resets streak
      const updated = { ...sessionStats, adjusted: sessionStats.adjusted + 1 };
      setSessionStats(updated);
      saveSessionStats(updated);
      setVerifiedCount((c) => c + 1);
      setTimeout(advanceToNext, 400);
    } catch (err) {
      console.error('[RapidVerify] adjust error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [current, adjustCoords, adjustAddress, adjustSourceUrl, selectedAccuracy, sessionStats, advanceToNext, showFlash, triggerProgressPulse]);

  const toggleAdjustMode = useCallback(() => {
    setAdjustMode((prev) => !prev);
    setStreak(0); // Opening adjust resets streak
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
        case 'ArrowLeft':
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

  // ─── Click-away for search ───────────────────────────────────────

  useEffect(() => {
    if (!searchOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

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
  // Gradient from red (0%) to yellow (50%) to green (100%)
  const progressGradient = `linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%)`;

  const accuracyLabel = ACCURACY_OPTIONS.find((o) => o.value === selectedAccuracy);

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0a0a0a] text-white overflow-hidden select-none">
      {/* Inject animation styles */}
      <style>{ANIMATION_STYLES}</style>

      {/* Flash overlays */}
      {flash === 'green' && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-green-500/20 transition-opacity" />
      )}
      {flash === 'gray' && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-gray-500/15 transition-opacity" />
      )}

      {/* Toast on Correct */}
      {showToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none rv-toast">
          <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
            ✓
          </span>
        </div>
      )}

      {/* ─── Header + Progress ──────────────────────────────────────── */}
      <div className="flex-none px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base">{'\ud83d\udccd'}</span>
            {searchOpen ? (
              <div ref={searchContainerRef} className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
                  }}
                  placeholder="Jump to moment..."
                  className="w-full px-2 py-0.5 bg-[#111] border border-[#2a2a2a] rounded text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                  autoFocus
                />
                {(searchResults.length > 0 || supabaseSearchResults.length > 0) && (
                  <div className="fixed left-4 right-4 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-[9999] max-h-64 overflow-y-auto" style={{ top: searchInputRef.current ? searchInputRef.current.getBoundingClientRect().bottom + 4 : 60 }}>
                    {searchResults.map(({ moment, index }) => (
                      <button
                        key={moment.id}
                        onClick={() => {
                          setCurrentIndex(index);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 text-[11px] text-gray-300 hover:bg-white/5 border-b border-[#2a2a2a] last:border-b-0 transition-colors"
                      >
                        <span className="font-medium line-clamp-1">{moment.name}</span>
                        <span className="text-[9px] text-gray-600 ml-1">#{index + 1}</span>
                      </button>
                    ))}
                    {supabaseSearchResults.length > 0 && searchResults.length > 0 && (
                      <div className="px-3 py-1 text-[9px] text-gray-600 bg-[#111] border-b border-[#2a2a2a]">Also found (not in current filter):</div>
                    )}
                    {supabaseSearchResults.map((m) => (
                      <button
                        key={m.id}
                        onClick={async () => {
                          // Uncheck filters to load all moments, then search again
                          setUnverifiedOnly(false);
                          setFlaggedOnly(false);
                          setSelectedCollection('');
                          setSearchOpen(false);
                          setSearchQuery('');
                          // Set pending jump — will be resolved when moments array updates
                          pendingJumpId.current = m.id;
                        }}
                        className="w-full text-left px-3 py-2 text-[11px] text-gray-500 hover:bg-white/5 border-b border-[#2a2a2a] last:border-b-0 transition-colors italic"
                      >
                        <span className="line-clamp-1">{m.name}</span>
                        <span className="text-[9px] text-gray-600 ml-1">(clear filters to view)</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm font-bold tracking-tight">Rapid Verify</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => {
                setSearchOpen((o) => {
                  if (!o) setTimeout(() => searchInputRef.current?.focus(), 50);
                  else setSearchQuery('');
                  return !o;
                });
              }}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="Search moments (jump-to)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            {/* Streak counter */}
            {streak >= 3 && (
              <span className={`text-sm font-bold ${streakPulse ? 'rv-streak-pulse' : ''}`}>
                {'\ud83d\udd25'} {streak}
              </span>
            )}
            <span className="text-xs font-mono text-gray-500">
              {currentIndex + 1}/{moments.length}{hasMore ? '+' : ''}
            </span>
          </div>
        </div>

        {/* Progress bar — 6px, gradient, with pulse */}
        <div className={`w-full h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden ${progressPulse ? 'rv-progress-pulse' : ''}`}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: progressGradient }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] font-medium text-gray-400">
            {progressPct}% verified ({verifiedCount.toLocaleString()} of {totalCount.toLocaleString()})
          </span>
          <span className="text-[10px] text-gray-600">
            Session: {sessionStats.verified}v {sessionStats.adjusted}a {sessionStats.skipped}s
          </span>
        </div>
      </div>

      {/* ─── Map — smaller on mobile ─────────────────────────────────── */}
      <div className="flex-none relative" style={{ height: 'min(35dvh, 280px)' }}>
        <div ref={mapContainerRef} className="w-full h-full" />
        {/* Address overlay — no truncation */}
        {current.address && (
          <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-black/60 backdrop-blur-sm px-3 py-1.5">
            <p className="text-xs text-gray-200 leading-snug">{current.address}</p>
          </div>
        )}
      </div>

      {/* ─── Card content (scrollable middle) ────────────────────────── */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-2 ${
          cardAnim === 'out' ? 'rv-slide-out' : cardAnim === 'in' ? 'rv-slide-in' : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Moment info */}
        <div>
          <h2 className="text-sm font-bold leading-tight">{current.name}</h2>
          {current.address && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[11px] text-gray-400 flex-1 leading-snug">
                {'\ud83d\udccd'} {current.address}
              </p>
              {/* Geocode button — snap pin to address */}
              <button
                onClick={async () => {
                  if (!current.address || geocoding) return;
                  setGeocoding(true);
                  const result = await geocodeAddress(current.address);
                  setGeocoding(false);
                  if (result) {
                    setGeocodeResult(result);
                    // Move the marker to geocoded location
                    if (markerRef.current && mapRef.current) {
                      markerRef.current.setLatLng([result.lat, result.lng]);
                      mapRef.current.setView([result.lat, result.lng], 17, { animate: true });
                    }
                  } else {
                    setError('Geocode failed — address not found');
                  }
                }}
                className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium border transition-colors ${
                  geocodeResult
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                }`}
                title="Move pin to this address using geocoding"
              >
                {geocoding ? '...' : geocodeResult ? '\u2705 Snapped' : '\ud83c\udfaf Snap to address'}
              </button>
            </div>
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
            <div className="mt-1">
              <p className={`text-[11px] text-gray-400 ${descExpanded ? '' : 'line-clamp-2'}`}>
                {current.description}
              </p>
              {current.description.length > 120 && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="text-[10px] text-blue-400 hover:text-blue-300 mt-0.5"
                >
                  {descExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-[11px] text-red-400">{error}</p>
        )}

        {/* Precision selector — collapsed by default */}
        <div>
          {!precisionOpen ? (
            <button
              onClick={() => setPrecisionOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              <span className="text-[10px] text-gray-600">Precision:</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-[#2a2a2a] text-[10px] font-medium text-gray-400">
                {accuracyLabel ? `${accuracyLabel.icon} ${accuracyLabel.label}` : 'exact'}
              </span>
              <span className="text-[9px] text-gray-600">tap to change</span>
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] text-gray-600">Precision</label>
                <button
                  onClick={() => setPrecisionOpen(false)}
                  className="text-[9px] text-gray-600 hover:text-gray-400"
                >
                  close
                </button>
              </div>
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
                    title={opt.desc}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
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
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAdjustMode(false);
                  // Reset marker to original position
                  if (markerRef.current && mapRef.current) {
                    markerRef.current.setLatLng([current.lat, current.lng]);
                    mapRef.current.setView([current.lat, current.lng], 17, { animate: true });
                  }
                  setAdjustCoords(`${current.lat}, ${current.lng}`);
                }}
                className="flex-1 px-3 py-2 text-xs font-medium rounded bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjust}
                className="flex-1 px-3 py-2 text-xs font-medium rounded bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-600/30 transition-colors"
              >
                Save &amp; Next
              </button>
            </div>
          </div>
        )}

        {/* Sources + Notes (collapsible, shown in normal mode) */}
        {!adjustMode && (
          <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
            {/* Sources header — tappable to expand */}
            <button
              onClick={() => setSourcesOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-[#111] hover:bg-[#161616] transition-colors"
            >
              <span className="text-[11px] text-gray-400 font-medium">
                Sources ({sourceUrls.length}){verifyNotes ? ' + Notes' : ''}
              </span>
              <span className="text-[10px] text-gray-600">{sourcesOpen ? '\u25b2' : '\u25bc'}</span>
            </button>

            {sourcesOpen && (
              <div className="px-3 py-2 space-y-2 bg-[#0d0d0d]">
                {/* Existing source URLs */}
                {sourceUrls.length > 0 && (
                  <div className="space-y-1">
                    {sourceUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-1.5 group">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-[10px] text-blue-400 truncate hover:underline"
                          title={url}
                        >
                          {url}
                        </a>
                        <button
                          onClick={() => setSourceUrls((prev) => prev.filter((_, j) => j !== i))}
                          className="shrink-0 text-[10px] text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                        >
                          {'\u2715'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new source URL */}
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSourceUrl.trim()) {
                        setSourceUrls((prev) => [...prev, newSourceUrl.trim()]);
                        setNewSourceUrl('');
                      }
                    }}
                    placeholder="Paste source URL"
                    className="flex-1 px-2 py-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-[10px] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={() => {
                      if (newSourceUrl.trim()) {
                        setSourceUrls((prev) => [...prev, newSourceUrl.trim()]);
                        setNewSourceUrl('');
                      }
                    }}
                    className="shrink-0 px-2 py-1 text-[10px] font-medium text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/10 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Notes textarea */}
                <div>
                  <label className="block text-[10px] text-gray-600 mb-0.5">Notes</label>
                  <textarea
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    placeholder="Triangulation notes, reasoning, uncertainties..."
                    rows={2}
                    className="w-full px-2 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded text-[10px] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 resize-y"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verify sources — full-width pills ABOVE action buttons */}
        {!adjustMode && (
          <div className="space-y-1.5">
            {getSourceLinks(current).map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full text-[11px] px-3 py-2 rounded-lg font-medium text-center transition-colors ${
                  link.primary
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25'
                    : 'bg-[#1a1a2e] text-blue-400 border border-blue-500/20 hover:bg-blue-500/10'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 pb-2">
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={unverifiedOnly}
              onChange={(e) => {
                setUnverifiedOnly(e.target.checked);
                if (e.target.checked && flaggedOnly) setFlaggedOnly(false);
              }}
              className="rounded border-gray-600 bg-[#111] text-green-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
            />
            Unverified
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={(e) => {
                setFlaggedOnly(e.target.checked);
                if (e.target.checked) setUnverifiedOnly(false);
              }}
              className="rounded border-gray-600 bg-[#111] text-orange-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
            />
            Flagged (&gt;5km)
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

      {/* ─── Sticky action bar (fixed bottom) ────────────────────────── */}
      {!adjustMode && (
        <div className="flex-none px-4 pb-4 pt-2 bg-[#0a0a0a] border-t border-[#1a1a1a]"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {/* Question framing */}
          <p className="text-[11px] text-gray-500 text-center mb-1.5">Is this pin in the right spot?</p>
          {/* Yes button — full width, green */}
          <button
            onClick={handleCorrect}
            className="w-full h-11 text-sm font-bold rounded-lg bg-[#22c55e]/90 text-white hover:bg-[#22c55e] active:scale-[0.98] transition-all shadow-lg shadow-green-500/15"
          >
            ✓ Yes, looks right
            <span className="ml-2 text-[10px] font-normal opacity-70">C</span>
          </button>

          {/* Adjust + Skip row */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={toggleAdjustMode}
              className="flex-1 h-9 text-xs font-medium rounded-lg text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/10 active:scale-[0.98] transition-all"
            >
              📍 Adjust
              <span className="ml-1 text-[9px] font-normal opacity-60">A</span>
            </button>
            <button
              onClick={handleSkip}
              className="px-6 h-9 text-xs font-medium rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
            >
              Skip
              <span className="ml-1 text-[9px] font-normal opacity-60">S</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RapidVerify;
