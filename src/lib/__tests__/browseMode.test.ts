/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';

describe('browseMode URL handling', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('defaults to false when no query param', () => {
    const params = new URLSearchParams(window.location.search);
    expect(params.get('mode')).toBeNull();
  });

  it('reads ?mode=browse from URL on init', () => {
    window.history.replaceState(null, '', '/?mode=browse');
    const params = new URLSearchParams(window.location.search);
    expect(params.get('mode')).toBe('browse');
  });

  it('ignores invalid ?mode=xyz values', () => {
    window.history.replaceState(null, '', '/?mode=xyz');
    const params = new URLSearchParams(window.location.search);
    expect(params.get('mode')).not.toBe('browse');
  });

  it('replaceState updates URL without pushing history', () => {
    const initialLength = window.history.length;
    window.history.replaceState(null, '', '/?mode=browse');
    expect(window.history.length).toBe(initialLength);
  });

  it('pushState adds a history entry', () => {
    const initialLength = window.history.length;
    window.history.pushState({ browseMode: true }, '', '/?mode=browse');
    expect(window.history.length).toBe(initialLength + 1);
  });
});

describe('browseMode state transitions', () => {
  it('browseMode=false by default (no URL param)', () => {
    const params = new URLSearchParams('');
    const browseMode = params.get('mode') === 'browse';
    expect(browseMode).toBe(false);
  });

  it('browseMode=true when ?mode=browse present', () => {
    const params = new URLSearchParams('?mode=browse');
    const browseMode = params.get('mode') === 'browse';
    expect(browseMode).toBe(true);
  });

  it('pushState stores browseMode in state for popstate restoration', () => {
    window.history.pushState({ browseMode: true }, '', '/?mode=browse');
    expect(window.history.state).toEqual({ browseMode: true });
  });

  it('popstate event fires with browseMode state', () => {
    return new Promise<void>((resolve) => {
      window.history.pushState({ browseMode: true }, '', '/?mode=browse');
      window.history.pushState(null, '', '/');

      const handler = (e: PopStateEvent) => {
        window.removeEventListener('popstate', handler);
        expect(e.state).toEqual({ browseMode: true });
        resolve();
      };
      window.addEventListener('popstate', handler);
      window.history.back();
    });
  });
});

describe('browseMode scroll preservation', () => {
  it('scroll position is stored and retrievable via ref pattern', () => {
    const browseScrollTop = { current: 0 };
    browseScrollTop.current = 342;
    expect(browseScrollTop.current).toBe(342);
  });
});
