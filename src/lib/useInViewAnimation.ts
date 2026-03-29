import { useEffect, useRef, type RefObject } from 'react';

/**
 * Staggered card entry animation. Cards with `.card-animate-in` start invisible,
 * then fade+slide in when they enter the scroll container's visible area.
 *
 * Cards already visible on first paint get `.card-visible` immediately (no flash).
 * Cards below the fold animate when scrolled into view.
 */
export function useInViewAnimation(containerRef: RefObject<HTMLElement | null>) {
  const initialized = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // On first meaningful paint, make all currently-rendered cards visible immediately
    // (prevents invisible-content flash). Cards added later will animate.
    const revealExisting = () => {
      if (initialized.current) return;
      const cards = container.querySelectorAll('.card-animate-in');
      if (cards.length === 0) return; // data not loaded yet
      initialized.current = true;
      cards.forEach((el) => el.classList.add('card-visible'));
    };

    // Try immediately, then again after data loads
    const timer = setTimeout(revealExisting, 150);

    // Watch for new children — animate these ones (they come from scrolling/section toggle)
    const mutation = new MutationObserver(() => {
      if (!initialized.current) {
        revealExisting();
        return;
      }
      // New cards added after initial paint get staggered animation
      const newCards = container.querySelectorAll('.card-animate-in:not(.card-visible)');
      newCards.forEach((el, i) => {
        (el as HTMLElement).style.setProperty('--stagger-index', String(i));
        // Small delay then add visible class to trigger transition
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.classList.add('card-visible');
          });
        });
      });
    });
    mutation.observe(container, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      mutation.disconnect();
    };
  }, [containerRef]);
}
