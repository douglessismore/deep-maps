import { useState } from 'react';
import { useAuth } from '../../lib/auth';

interface LoginModalProps {
  onClose: () => void;
  /** What the user was trying to do — shown as context. */
  action?: string;
}

export function LoginModal({ onClose, action }: LoginModalProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const result = await signIn(email.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
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
            Sign in to Deep Maps
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {action && (
          <p className="text-sm text-[var(--text-secondary)]">
            Sign in to {action}
          </p>
        )}

        {sent ? (
          /* Success state */
          <div className="space-y-3 py-2">
            <div className="text-center">
              <div className="text-3xl mb-2">&#9993;</div>
              <p className="text-sm text-[var(--text-primary)] font-medium">
                Check your email
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                We sent a sign-in link to <span className="font-mono text-[var(--text-secondary)]">{email}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg text-sm font-medium bg-[var(--bg-card-hover)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* Email form */
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                required
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#e74c3c] focus:ring-1 focus:ring-[#e74c3c]/30 transition-all"
              />
            </div>
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-[#e74c3c] text-white hover:bg-[#c0392b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send magic link'}
            </button>
            <p className="text-[10px] text-[var(--text-muted)] text-center">
              No password needed. We'll email you a sign-in link.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
