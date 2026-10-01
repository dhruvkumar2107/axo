'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

import { ProceduralArt } from '@/components/art/ProceduralArt';
import { config, site } from '@/lib/site';
import { useExperience } from '@/lib/experience';
import { scroll } from '@/lib/scroll';

/**
 * ============================================================================
 *  THE OVERTURE — the first screen
 * ============================================================================
 *
 *  Replaces the old preloader entirely. The governing rule changed:
 *
 *    before   hold the guest behind a black screen until the site was "ready"
 *    now      paint the finished composition immediately and let 3D catch up
 *
 *  This screen is fully composed from the first byte of HTML. There is no
 *  counter, no progress read-out and no word telling anyone to wait, because
 *  there is nothing left to wait for: what arrives is the real opening, not a
 *  placeholder for it.
 *
 *  Everything expensive — Three.js, the palace, the environment map — is loaded
 *  *behind* this composition and only ever cross-fades in once it can render a
 *  frame. A guest on a slow phone, on a throttled tab, or with WebGL disabled
 *  sees exactly this screen, indefinitely, and can still press ENTER.
 */

interface OvertureProps {
  /** 3D has produced a frame and can now be shown behind the type. */
  stageReady: boolean;
  /** The 3D layer has loaded, or has definitively failed and will not. */
  onStageReady: () => void;
}

export function Overture({ stageReady, onStageReady }: OvertureProps) {
  const { beginEntry, greeting, profile } = useExperience();
  const rootRef = useRef<HTMLDivElement>(null);
  const monogramRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  /*
   * ENTER is available from the first frame. Nothing is waiting on an animation
   * to finish before the guest may act — a button that appears late is the most
   * common reason a guest decides a site is broken.
   */

  /* -------------------------------------------------------------------------
     The entrance.

     Runs on mount against elements that are already in the DOM and already
     visible, so it only ever *refines* the composition. Every tween starts
     from a visible state and is short; if the guest has reduced motion, or the
     frames are not arriving, the screen simply holds its finished appearance.
     ---------------------------------------------------------------------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || scroll.reduceMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(
        monogramRef.current,
        { opacity: 0, scale: 0.94, y: 18 },
        { opacity: 1, scale: 1, y: 0, duration: 1.5 },
        0,
      )
        .fromTo(
          typeRef.current?.querySelectorAll('[data-rise]') ?? [],
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 1.25, stagger: 0.13 },
          0.35,
        );
    }, root);

    return () => ctx.revert();
  }, []);

  /* -------------------------------------------------------------------------
     The 3D cross-fade.

     Fires only once 3D has genuinely drawn something, so the type never sits
     on top of an empty canvas.
     ---------------------------------------------------------------------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !stageReady) return;
    const node = root.querySelector('[data-stage-veil]');
    if (!node) return;
    const ctx = gsap.context(() => {
      gsap.to(node, { autoAlpha: 0, duration: 1.6, ease: 'power2.inOut' });
    }, root);
    return () => ctx.revert();
  }, [stageReady]);

  const handleEnter = useCallback(() => beginEntry(), [beginEntry]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-hud overflow-hidden bg-ink material-cinema"
      data-scene="overture"
    >
      {/* -------------------------------------------------------------------
          Layer 0 — the estate. Art-directed vector scenery, inline in the
          document, so it costs no request and paints on the first frame.
          ------------------------------------------------------------------ */}
      <div className="absolute inset-0" aria-hidden="true">
        <ProceduralArt art="couple" className="opacity-70" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(118% 82% at 50% 60%, rgba(255,214,150,0.16) 0%, rgba(12,43,34,0.42) 40%, rgba(8,8,10,0.94) 78%)',
          }}
        />
      </div>

      {/* -------------------------------------------------------------------
          Layer 1 — 3D, once it exists. Hidden until it has drawn a frame, and
          never allowed to obstruct the interface.
          ------------------------------------------------------------------ */}
      <div
        data-stage-veil
        aria-hidden="true"
        className="absolute inset-0"
        style={{ opacity: stageReady ? 1 : 0 }}
      >
        <OvertureStage onReady={onStageReady} />
      </div>

      {/* Layer 2 — atmosphere. The wash is expressed purely as gradients: an
          equivalent `blur()` here costs a full-viewport filter pass on the
          critical path to first paint, and a radial gradient is already soft. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-x-[-18%] top-[30%] h-[52vh]"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(232,217,160,0.14) 0%, rgba(232,217,160,0.05) 42%, transparent 72%)',
          }}
        />
        <div className="vignette absolute inset-0" />
      </div>

      {/* -------------------------------------------------------------------
          Layer 3 — the type. The whole first screen, and nothing else.
          ------------------------------------------------------------------ */}
      <div
        ref={typeRef}
        className="relative z-10 flex h-full flex-col items-center justify-between px-[var(--gutter)] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))]"
      >
        {/* --- Top: the date, small, as printed on a plate --- */}
        <p
          data-rise
          className="label order-1 mt-[clamp(0.5rem,3vh,2rem)] text-center text-ivory/45"
        >
          {site.dateLabel.toUpperCase()}
          <span className="mx-2 text-gold/45">&middot;</span>
          {config.location.city.toUpperCase()}
        </p>

        {/* --- Centre: the monogram, then the names --- */}
        <div className="order-2 flex flex-col items-center justify-center">
          {greeting ? (
            <p data-rise className="label mb-[clamp(1.25rem,4vh,2.5rem)] text-ivory/40">
              {greeting}
            </p>
          ) : null}

          <div
            ref={monogramRef}
            className="relative flex h-[min(34svh,320px)] w-full items-center justify-center"
          >
            <EmbossedMonogram />
          </div>

          <div className="mt-[clamp(1.5rem,5vh,3.25rem)] flex flex-col items-center gap-[clamp(0.35rem,1vh,0.75rem)] text-center">
            <p
              data-rise
              className="foil foil-shimmer font-display font-light uppercase leading-[1.02] tracking-[0.03em] text-fluid-3xl"
            >
              {site.namesStacked.groom}
            </p>
            <p data-rise className="label text-gold/60">
              {config.meta.monogramGlyph}
            </p>
            <p
              data-rise
              className="foil foil-shimmer font-display font-light uppercase leading-[1.02] tracking-[0.03em] text-fluid-3xl"
            >
              {site.namesStacked.bride}
            </p>
          </div>
        </div>

        {/* --- Bottom: the only call to action on the first screen --- */}
        <div className="order-3 flex flex-col items-center gap-3">
          <button type="button" onClick={handleEnter} className="seal-button">
            Enter the celebration
          </button>
          <p className="label text-[0.5rem] text-ivory/25" aria-hidden="true">
            {profile.isMobile ? 'Touch to begin' : 'Sound accompanies the invitation'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   The monogram, embossed rather than typeset.

   A physical object: a bevelled metal disc with engraved letters, lit from one
   side so the edge catches light. Built from gradients and masks so it is a
   handful of bytes rather than a texture fetch, and so it is crisp at any size
   on any display.
   ------------------------------------------------------------------------- */
function EmbossedMonogram() {
  const { first, second } = readMonogram(config.meta.monogram);

  return (
    <div className="relative grid h-full w-full place-items-center" role="img" aria-label={`Monogram: ${config.meta.monogram}`}>
      {/* The disc: a dark metal plate with a single lit edge. */}
      <div
        aria-hidden="true"
        className="absolute inset-[8%] rounded-full"
        style={{
          background:
            'conic-gradient(from 210deg, rgba(201,162,39,0.30) 0deg, rgba(74,55,14,0.05) 90deg, rgba(232,217,160,0.22) 200deg, rgba(74,55,14,0.06) 300deg, rgba(201,162,39,0.28) 360deg)',
          boxShadow:
            'inset 0 2px 3px rgba(255,246,214,0.28), inset 0 -3px 8px rgba(0,0,0,0.85), 0 18px 60px rgba(0,0,0,0.7)',
        }}
      />
      {/* Engraved double rule. */}
      <div
        aria-hidden="true"
        className="absolute inset-[14%] rounded-full"
        style={{
          border: '1px solid rgba(201,162,39,0.28)',
          boxShadow: '0 0 0 4px rgba(8,8,10,0.35), inset 0 1px 0 rgba(255,246,214,0.22)',
        }}
      />

      {/* The letters. Two passes: a dark offset for the cut, then metal on top. */}
      <span
        aria-hidden="true"
        className="relative select-none font-display font-light leading-none"
        style={{ fontSize: 'clamp(2.75rem, 11vw, 5.5rem)' }}
      >
        <span className="foil-emboss foil foil-shimmer">{first}</span>
        <span className="mx-[0.06em] text-[0.42em] font-light opacity-70 text-gold/80">
          {config.meta.monogramGlyph}
        </span>
        <span className="foil-emboss foil foil-shimmer">{second}</span>
      </span>
    </div>
  );
}

/** `GY` → first and second letters. */
function readMonogram(monogram: string): { first: string; second: string } {
  const chars = monogram.replace(/[^A-Za-z]/g, '').toUpperCase().split('');
  return { first: chars[0] ?? 'G', second: chars[1] ?? chars[0] ?? 'Y' };
}

/* ---------------------------------------------------------------------------
   The 3D stage.

   Loaded lazily and entirely optional. If Three.js fails, is slow, or is not
   wanted, this resolves to nothing and the art-directed layer above simply
   stays — which is the whole point of the two-layer design.
   ------------------------------------------------------------------------- */
function OvertureStage({ onReady }: { onReady?: () => void }) {
  const [Component, setComponent] = useState<React.ComponentType<{ onReady?: () => void }> | null>(
    null,
  );

  /*
   * Three.js is a large dependency and its first frame costs real main-thread
   * time. Importing it during hydration steals the very milliseconds the guest
   * is waiting to see, so we wait until the screen has painted and the browser
   * is idle before asking for it. The 2D shell is complete on its own; this only
   * adds depth behind it.
   */
  useEffect(() => {
    let live = true;
    let idle = 0;

    const load = () => {
      if (!live) return;
      void import('./MonogramScene')
        .then((mod) => {
          if (!live) return;
          setComponent(() => mod.MonogramScene);
          onReady?.();
        })
        .catch((error) => {
          // A missing 3D module is not an error the guest should ever see.
          console.warn('[invitation] 3D stage unavailable, using the 2D shell:', error);
          onReady?.();
        });
    };

    const ric = window.requestIdleCallback;
    if (typeof ric === 'function') {
      idle = ric(load, { timeout: 1800 });
    } else {
      idle = window.setTimeout(load, 400);
    }

    return () => {
      live = false;
      if (typeof ric === 'function') window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [onReady]);

  if (!Component) return null;
  return <Component onReady={onReady} />;
}