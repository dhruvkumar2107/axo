'use client';

/**
 * A single controller for the page scroll.
 *
 * Lenis owns smoothing, GSAP's ScrollTrigger owns the scenes, and both need to
 * be able to say "stop, something cinematic is happening". Rather than passing
 * the Lenis instance through context and every call site, it is parked here and
 * addressed through functions.
 *
 * `lock()` works even before Lenis has mounted (during the entry sequence), which
 * is why it touches the document element directly as well as the instance.
 */

type ScrollTarget = string | number | HTMLElement | null | undefined;

interface ScrollController {
  attach: (lenis: unknown) => void;
  detach: () => void;
  lock: () => void;
  unlock: () => void;
  scrollTo: (target: ScrollTarget, offset?: number, immediate?: boolean) => void;
  /** Snap to the top instantly, used when the entry sequence completes. */
  reset: () => void;
  reduceMotion: boolean;
}

let instance: ScrollController | null = null;

function controller(): ScrollController {
  if (instance) return instance;

  let lenis: {
    lock: () => void;
    unlock: () => void;
    scrollTo: (target: unknown, options?: { offset?: number; duration?: number; immediate?: boolean }) => void;
    stop: () => void;
    start: () => void;
  } | null = null;
  let locks = 0;

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  instance = {
    reduceMotion: prefersReduced,

    attach(next) {
      lenis = next as typeof lenis;
    },

    detach() {
      lenis = null;
    },

    lock() {
      locks += 1;
      if (locks > 1) return;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.add('lenis-stopped');
        document.body.style.overflow = 'hidden';
      }
      lenis?.stop();
    },

    unlock() {
      locks = Math.max(0, locks - 1);
      if (locks > 0) return;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('lenis-stopped');
        document.body.style.overflow = '';
      }
      lenis?.start();
    },

    /**
     * `immediate` jumps instead of easing. It matters most for the long haul
     * back to the top: smoothing across sixteen thousand pixels takes over a
     * second and a half and reads as a frozen page, so a tap on "home" from the
     * footer should just arrive.
     */
    scrollTo(target, offset = 0, immediate = false) {
      const jump = immediate || prefersReduced;

      if (!lenis) {
        // Before Lenis exists, fall back to native scrolling.
        if (typeof window === 'undefined') return;
        const node =
          typeof target === 'string' ? document.querySelector(target) : target;
        if (node instanceof HTMLElement) {
          window.scrollTo({
            top: Math.max(0, node.offsetTop + offset),
            behavior: jump ? 'auto' : 'smooth',
          });
        }
        return;
      }

      lenis.scrollTo(target as never, {
        offset,
        duration: jump ? 0 : 1.6,
        immediate: jump,
      });
    },

    reset() {
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
      lenis?.scrollTo(0, { immediate: true } as never);
    },
  };

  return instance;
}

export const scroll = controller();

/** Convenience: free-floating calls that read better at the call site. */
export const lockScroll = () => scroll.lock();
export const unlockScroll = () => scroll.unlock();
export const scrollTo = (target: ScrollTarget, offset?: number, immediate?: boolean) =>
  scroll.scrollTo(target, offset, immediate);
