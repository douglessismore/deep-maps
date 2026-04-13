/**
 * Singleton audio manager for moment card playback.
 * One HTMLAudioElement reused for all playback (avoids iOS Safari issues).
 * Tracks play count in localStorage for the $2 payment gate.
 */

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

  const el = getAudio();

  // If same URL is paused, resume
  if (currentUrl === url && el.paused) {
    el.play();
    return;
  }

  // New track
  if (currentUrl !== url) {
    el.src = url;
    el.load();
  }
  currentUrl = url;
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

export function isPlaying(url: string): boolean {
  if (!audio || currentUrl !== url) return false;
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
