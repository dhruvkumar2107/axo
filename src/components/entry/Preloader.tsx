'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

import { Monogram } from '@/components/primitives/Monogram';
import { config } from '@/lib/site';
import { useExperience } from '@/lib/experience';

/**
 * ============================================================================
 *  THE PRELOADER
 * ============================================================================
 *
 *  Reads as arriving at the entrance of a palace, not as a loading bar:
 *
 *    · a thin gold line draws itself across the centre
 *    · the G × Y monogram resolves inside a slowly closing ring
 *    · the couple's names rise beneath it
 *    · a discreet two-digit counter climbs in the corner
 *
 *  The counter tracks *real* readiness (webfonts, then a minimum dwell), so it
 *  never sits at 100% while the page is still visibly assembling. It is capped
 *  at a maximum dwell so a slow connection can never strand the guest here.
 */

const MIN_DWELL = 1500;
const MAX_DWELL = 5200;
/** Counter easing: fast at first, then a long approach to 100. */
const APPROACH = 0.055;

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const { profile } = useExperience();
  const [count, setCount] = useState(1);
  const [exiting, setExiting] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const namesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = profile.isReducedMotion;
    const root = rootRef.current;
    // The effect only runs after mount, so the ref is always populated; the
    // guard simply satisfies the type checker and documents the assumption.
    if (!root) return;

    let raf = 0;
    let done = false;
    let shown = 1;
    let target = 1;
    const start = performance.now();

    const ctx = gsap.context(() => {
      /* --- Entrance --------------------------------------------------- */
      if (!reduce) {
        gsap
          .timeline()
          .fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1.9, ease: 'expo.inOut' })
          .fromTo(
            namesRef.current,
            { yPercent: 40, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 1.3, ease: 'power3.out' },
            0.75,
          );
      }

      /* --- Progress loop ----------------------------------------------- */
      const tick = () => {
        const elapsed = performance.now() - start;
        const fontsReady = document.fonts?.status === 'loaded';

        // Approach 92 while waiting for fonts, then run to 100.
        target = Math.min(fontsReady && elapsed > MIN_DWELL ? 100 : 92, 6 + (elapsed / MIN_DWELL) * 86);
        shown += (target - shown) * APPROACH;

        const display = Math.min(100, Math.max(1, Math.round(shown)));
        setCount(display);

        const ready = fontsReady && elapsed > MIN_DWELL;
        const expired = elapsed > MAX_DWELL;

        if (!done && (ready || expired)) {
          done = true;
          setCount(100);
          finish();
          return;
        }
        raf = requestAnimationFrame(tick);
      };

      const finish = () => {
        setExiting(true);

        const exit = gsap.timeline({
          onComplete: () => {
            onComplete();
          },
        });

        if (reduce) {
          exit.to(root, { autoAlpha: 0, duration: 0.25 });
          return;
        }

        exit
          .to(counterRef.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0)
          .to(lineRef.current, { scaleX: 0, transformOrigin: 'right center', duration: 0.9, ease: 'expo.inOut' }, 0.15)
          .to(
            root.querySelector('[data-preloader-mark]'),
            { scale: 1.08, autoAlpha: 0, duration: 1.1, ease: 'power2.inOut' },
            0.25,
          )
          .to(namesRef.current, { yPercent: -30, autoAlpha: 0, duration: 0.9, ease: 'power2.in' }, 0.3)
          // The last thing to go is the darkness itself.
          .to(root, { autoAlpha: 0, duration: 0.85, ease: 'power2.inOut' }, 0.55);
      };

      raf = requestAnimationFrame(tick);
    }, root);

    return () => {
      cancelAnimationFrame(raf);
      ctx.revert();
    };
    // Intentionally runs once on mount: this is the entry sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-overlay grid place-items-center bg-ink material-cinema"
      data-preloader
      role="status"
      aria-live="polite"
      aria-label={`Preparing the invitation of ${config.meta.groom} and ${config.meta.bride}`}
    >
      <span className="grain-layer" aria-hidden="true" />

      {/* Discreet progress, kept to the lower left like a plate number */}
      <div
        ref={counterRef}
        className="label absolute bottom-[max(2.5rem,env(safe-area-inset-bottom))] left-[var(--gutter)] font-mono text-[0.625rem] tracking-[0.3em] text-ivory/30"
        aria-hidden="true"
      >
        <span>{String(count).padStart(3, '0')}</span>
        <span className="mx-2 text-gold/40">—</span>
        <span className="text-ivory/20">100</span>
      </div>

      <div className="relative flex flex-col items-center px-[var(--gutter)]">
        <span data-preloader-mark className="block">
          <Monogram size="hero" foil withRing={false} className="relative" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <svg viewBox="0 0 200 200" className="absolute size-[min(58vw,15rem)] text-gold/40">
              <circle
                cx="100"
                cy="100"
                r="94"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.6"
                className="monogram-ring"
              />
            </svg>
          </span>
        </span>

        {/* The thin gold line, drawn through the monogram */}
        <span
          aria-hidden="true"
          className="mt-8 block h-px w-[min(62vw,20rem)] origin-center bg-gradient-to-r from-transparent via-gold-light to-transparent"
        >
          <span ref={lineRef} className="block h-full w-full origin-left bg-gradient-to-r from-transparent via-gold-light to-transparent" />
        </span>

        <div ref={namesRef} className="mt-8 flex flex-col items-center gap-2 text-center">
          <p className="label text-ivory/40">{config.meta.groom}</p>
          <span aria-hidden="true" className="font-display text-gold/60">
            {config.meta.monogramGlyph}
          </span>
          <p className="label text-ivory/40">{config.meta.bride}</p>
        </div>
      </div>

      {/* A whispered instruction for the very first screen reader user. */}
      <p className="sr-only">{exiting ? 'Loading complete.' : 'Loading the invitation.'}</p>
    </div>
  );
}
