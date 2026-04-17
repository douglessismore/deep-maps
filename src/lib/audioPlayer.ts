/**
 * Singleton audio manager for moment card playback.
 * One HTMLAudioElement reused for all playback (avoids iOS Safari issues).
 * Tracks play count in localStorage for the $2 payment gate.
 */

/**
 * Rewrite direct Supabase Storage URLs to same-origin /audio/* paths.
 * Vercel proxies /audio/:filename → Supabase Storage (see vercel.json).
 * This eliminates the DNS dependency on supabase.co for audio playback —
 * if the site loads, audio loads (hotel Wi-Fi, airplane Wi-Fi, etc).
 * Safe to run on any URL: non-Supabase URLs pass through unchanged.
 */
const SUPABASE_AUDIO_PREFIX = 'https://fhxyaoaaeztrycfoppeu.supabase.co/storage/v1/object/public/moment-audio/';
function proxyAudioUrl(url: string): string {
  if (url.startsWith(SUPABASE_AUDIO_PREFIX)) {
    return '/audio/' + url.slice(SUPABASE_AUDIO_PREFIX.length);
  }
  return url;
}

const FREE_PLAYS = 5;
const PLAYS_KEY = 'dm-audio-plays';
const UNLOCKED_KEY = 'dm-audio-unlocked';

// Module-level singleton
let audio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let currentMomentId: string | null = null;
const subscribers = new Set<() => void>();
let gateHandler: (() => void) | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.addEventListener('ended', () => {
      trackEvent('audio-complete', currentMomentId);
      currentUrl = null;
      currentMomentId = null;
      notifySubscribers();
    });
    audio.addEventListener('pause', () => notifySubscribers());
    audio.addEventListener('play', () => notifySubscribers());
  }
  return audio;
}

function notifySubscribers() {
  subscribers.forEach((cb) => cb());
}

function trackEvent(name: string, momentId?: string | null) {
  if (typeof window !== 'undefined' && (window as unknown as { plausible?: (name: string, opts?: { props?: Record<string, string> }) => void }).plausible) {
    const plausible = (window as unknown as { plausible: (name: string, opts?: { props?: Record<string, string> }) => void }).plausible;
    plausible(name, momentId ? { props: { moment: momentId } } : undefined);
  }
}

// ── Gate logic ──

export function isAudioGated(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(UNLOCKED_KEY) === 'true') return false;
  if (localStorage.getItem('deepmaps-admin') === 'true') return false;
  const plays = parseInt(localStorage.getItem(PLAYS_KEY) || '0', 10);
  return plays >= FREE_PLAYS;
}

export function getPlayCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(PLAYS_KEY) || '0', 10);
}

function incrementPlayCount(): void {
  const plays = getPlayCount();
  localStorage.setItem(PLAYS_KEY, String(plays + 1));
}

export function isAudioUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(UNLOCKED_KEY) === 'true';
}

// ── Playback API ──

export function playAudio(url: string, momentId: string): void {
  // Check gate before playing
  if (isAudioGated()) {
    trackEvent('gate-shown');
    if (gateHandler) gateHandler();
    return;
  }

  // Rewrite Supabase URLs to same-origin /audio/* (DNS-resilient)
  const proxiedUrl = proxyAudioUrl(url);

  const el = getAudio();

  // If same URL is paused, resume
  if (currentUrl === proxiedUrl && el.paused) {
    el.play();
    return;
  }

  // New track
  if (currentUrl !== proxiedUrl) {
    el.src = proxiedUrl;
    el.load();
  }
  currentUrl = proxiedUrl;
  currentMomentId = momentId;
  el.play();
  incrementPlayCount();
  trackEvent('audio-play', momentId);
}

export function pauseAudio(): void {
  const el = getAudio();
  if (!el.paused) {
    el.pause();
  }
}

export function stopAudio(): void {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  currentUrl = null;
  currentMomentId = null;
  notifySubscribers();
}

export function isPlaying(url: string): boolean {
  if (!audio) return false;
  // Compare against the proxied URL since that's what currentUrl stores
  if (currentUrl !== proxyAudioUrl(url)) return false;
  return !audio.paused;
}

export function getCurrentUrl(): string | null {
  return currentUrl;
}

// ── Subscriber pattern for UI updates ──

export function onAudioStateChange(cb: () => void): () => void {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

// ── Gate handler registration (called by App.tsx) ──

export function setGateHandler(handler: () => void): void {
  gateHandler = handler;
}
