import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { LoginModal } from './LoginModal';

export function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowLogin(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] transition-all"
        >
          Sign in
        </button>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  const displayName = user.user_metadata?.display_name
    || user.email?.split('@')[0]
    || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-[var(--bg-card-hover)] transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-[#e74c3c] flex items-center justify-center text-[10px] font-bold text-white">
          {initials}
        </div>
        <span className="text-xs text-[var(--text-secondary)] hidden sm:block max-w-[100px] truncate">
          {displayName}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg shadow-xl z-50 py-1">
          <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">{displayName}</p>
            <p className="text-[10px] text-[var(--text-muted)] truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setMenuOpen(false);
              signOut();
            }}
            className="w-full text-left px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
