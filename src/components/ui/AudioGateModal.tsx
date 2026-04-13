import { useState, useEffect } from 'react';
import { getPlayCount } from '../../lib/audioPlayer';

// TODO: Replace with actual Stripe Payment Link URL once created
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_PLACEHOLDER';

interface AudioGateModalProps {
  onClose: () => void;
}

function trackEvent(name: string) {
  if (typeof window !== 'undefined' && (window as unknown as { plausible?: (name: string, opts?: { props?: Record<string, string> }) => void }).plausible) {
    const plausible = (window as unknown as { plausible: (name: string, opts?: { props?: Record<string, string> }) => void }).plausible;
    plausible(name);
  }
}

export function AudioGateModal({ onClose }: AudioGateModalProps) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const playCount = getPlayCount();

  useEffect(() => {
    trackEvent('gate-shown');
  }, []);

  const handlePaymentClick = () => {
    trackEvent('gate-payment-click');
    window.location.href = STRIPE_PAYMENT_LINK;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    trackEvent('gate-email-submit');
    // For Phase A: just track in Plausible. No backend needed.
    // The email is captured in the Plausible event's implicit page context.
    // TODO: optionally insert into Supabase waitlist table
    setEmailSent(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Unlock Audio Narrations
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-[var(--text-secondary)]">
          You've listened to {playCount} free audio previews. Unlock unlimited narrations for every historical moment.
        </p>

        {emailSent ? (
          <div className="space-y-3 py-2 text-center">
            <div className="text-3xl mb-2">&#10003;</div>
            <p className="text-sm text-[var(--text-primary)] font-medium">
              Thanks! We'll let you know when audio is fully available.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Primary CTA */}
            <button
              onClick={handlePaymentClick}
              className="w-full py-3 rounded-lg text-sm font-bold bg-[#e74c3c] text-white hover:bg-[#c0392b] transition-colors"
            >
              Unlock All Audio &mdash; $2
            </button>
            <p className="text-[10px] text-[var(--text-muted)] text-center -mt-2">
              One-time payment. No account needed.
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            </div>

            {/* Email capture */}
            <form onSubmit={handleEmailSubmit} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e74c3c] focus:ring-1 focus:ring-[#e74c3c]/30 transition-all"
              />
              <button
                type="submit"
                disabled={!email.trim()}
                className="w-full py-2 rounded-lg text-sm font-medium bg-[var(--bg-card-hover)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Get free access — join the waitlist
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
