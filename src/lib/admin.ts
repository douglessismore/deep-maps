/**
 * Admin mode utilities.
 * Admin mode is a client-side flag — no auth system.
 * Activated via ?admin=true URL param or /admin route.
 */

const ADMIN_KEY = 'deepmaps-admin';

export function isAdminMode(): boolean {
  try {
    return localStorage.getItem(ADMIN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAdminMode(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(ADMIN_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_KEY);
    }
  } catch {
    // localStorage not available
  }
}

/** Call once on app mount to detect ?admin=true URL param. */
export function detectAdminParam(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setAdminMode(true);
      // Clean URL (remove ?admin=true) without reload
      params.delete('admin');
      const clean = params.toString();
      const newUrl = window.location.pathname + (clean ? `?${clean}` : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  } catch {
    // SSR or no window
  }
}
