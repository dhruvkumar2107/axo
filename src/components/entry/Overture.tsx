'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

import { ProceduralArt } from '@/components/art/ProceduralArt';
import {
  HangingJasmine,
  KolamDivider,
  LampPair,
  Petals,
  TempleFrame,
  TempleHorizon,
} from '@/components/art/Manapam';
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
      className="surface-night material-cinema fixed inset-0 z-hud overflow-hidden"
      data-scene="overture"
    >
      {/* -------------------------------------------------------------------
          Layer 0 — the mandapam at night.

          A wedding mandapam after dusk: the lamps are lit, the plaster is warm,
          and everything beyond the arch falls away. The scene is carried by
          gradients plus two line motifs rather than by a photograph, so it is
          complete on the first frame and never blocks first paint.
          ------------------------------------------------------------------ */}
      <div className="absolute inset-0" aria-hidden="true">
        <ProceduralArt art="couple" className="opacity-40" />

        {/* Warm plaster wash: the light the lamps throw on the back wall. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(78% 52% at 50% 34%, rgb(var(--turmeric) / 0.22) 0%, rgb(var(--maroon) / 0.5) 44%, rgb(var(--emerald-deep)) 82%)',
          }}
        />

        {/* The temple silhouette, sitting on the floor of the scene. */}
        <TempleHorizon opacity={0.2} />

        {/* The arch and its pillars, framing the monogram. */}
        <TempleFrame />
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
        {/* Lamplight bloom, from the two deepams on the floor. */}
        <div
          className="absolute inset-x-[-18%] bottom-[-10%] h-[58vh]"
          style={{
            background:
              'radial-gradient(ellipse 58% 46% at 50% 50%, rgb(var(--turmeric) / 0.2) 0%, rgb(var(--turmeric) / 0.07) 44%, transparent 74%)',
          }}
        />
        <div className="vignette absolute inset-0" />

        {/* Jasmine, hung from the lintel. Two strands, unequal lengths. */}
        <HangingJasmine count={2} />

        {/* Floating flower petals - subtle South Indian aesthetic */}
        <Petals count={6} />
      </div>

      {/* -------------------------------------------------------------------
            Layer 3 — the type. The whole first screen, and nothing else.

            Viewport-safe layout: fits inside 100vh / 100svh / 100dvh without
            any scrolling on desktop (1366x768, 1440x900, 1920x1080) and mobile.
            All requested wedding details are immediately visible.
            ------------------------------------------------------------------ */}
      <div
        ref={typeRef}
        className="relative z-10 flex h-[100svh] flex-col items-center justify-between overflow-hidden px-[var(--gutter)] pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] supports-[height:100dvh]:h-[100dvh]"
      >
        {/* --- Top: Welcoming label or salutation --- */}
        <div data-rise className="order-1 mt-[clamp(0.25rem,1.2vh,0.75rem)] text-center">
          {greeting ? (
            <p className="label fg-night-muted">{greeting}</p>
          ) : (
            <p className="label fg-night-muted tracking-[0.34em]">
              WEDDING INVITATION
            </p>
          )}
        </div>

        {/* --- Centre: monogram, couple names, date, location, tagline --- */}
        <div className="order-2 flex min-h-0 flex-col items-center justify-center">
          <div
            ref={monogramRef}
            className="relative flex h-[min(18svh,140px)] w-full items-center justify-center"
          >
            <EmbossedMonogram />
          </div>

          <div className="mt-[clamp(0.35rem,1.2svh,0.85rem)] flex flex-col items-center gap-[clamp(0.15rem,0.4svh,0.35rem)] text-center">
            <h1
              data-rise
              className="foil foil-shimmer font-display font-light uppercase leading-[1.02] tracking-[0.03em] text-fluid-2xl"
            >
              {site.namesStacked.groom}
            </h1>
            <p data-rise className="label fg-brass-muted" aria-hidden="true">
              {config.meta.monogramGlyph}
            </p>
            <p
              data-rise
              className="foil foil-shimmer font-display font-light uppercase leading-[1.02] tracking-[0.03em] text-fluid-2xl"
            >
              {site.namesStacked.bride}
            </p>
          </div>

          {/* 17 October · Kanakapura, Karnataka & Celebration Tagline */}
          <div data-rise className="mt-[clamp(0.35rem,1svh,0.75rem)] flex flex-col items-center gap-1 text-center">
            <p className="label tracking-[0.26em] text-[clamp(0.6rem,0.85vw,0.72rem)] text-gold-light">
              17 OCTOBER
              <span className="mx-2 fg-brass-muted">&middot;</span>
              KANAKAPURA, KARNATAKA
            </p>
            <p className="font-display italic text-[clamp(0.8rem,1.3svh,0.98rem)] fg-night-muted tracking-wide text-balance max-w-[28ch]">
              A celebration of love, family and forever.
            </p>
          </div>

          {/* Kolam divider at feet of names: hidden on short viewports */}
          <div data-rise className="mt-[clamp(0.25rem,0.8svh,0.6rem)] hidden [@media(min-height:640px)]:block">
            <KolamDivider className="w-[2.25rem] opacity-45" />
          </div>
        </div>

        {/* --- Bottom: CTA section --- */}
        <div className="order-3 flex w-full shrink-0 flex-col items-center gap-2">
          {/* Subtle brass deepams on the floor */}
          <div className="hidden [@media(min-height:580px)]:block w-full">
            <LampPair className="w-full max-w-[20rem] opacity-70" />
          </div>

          <button type="button" onClick={handleEnter} className="seal-button">
            ENTER THE CELEBRATION
          </button>
          <p className="label text-[0.5rem] fg-night-faint" aria-hidden="true">
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