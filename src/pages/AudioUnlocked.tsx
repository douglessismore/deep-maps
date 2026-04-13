import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Post-payment redirect page. Stripe Payment Link returns the user here.
 * Sets localStorage flag to unlock audio, then redirects home.
 */
export default function AudioUnlocked() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    localStorage.setItem('dm-audio-unlocked', 'true');

    // Track the unlock event
    if (typeof window !== 'undefined' && (window as unknown as { plausible?: (name: string) => void }).plausible) {
      (window as unknown as { plausible: (name: string) => void }).plausible('audio-unlocked');
    }

    // Redirect home after a brief flash
    const timer = setTimeout(() => setLocation('/'), 1500);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] gap-3">
      <div className="text-4xl">&#127911;</div>
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Audio Unlocked!</h1>
      <p className="text-sm text-[var(--text-muted)]">Redirecting to Deep Maps...</p>
    </div>
  );
}
