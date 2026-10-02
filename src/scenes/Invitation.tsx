'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Monogram } from '@/components/primitives/Monogram';
import { SceneHeading } from '@/components/motion/Reveal';
import { useAudio } from '@/lib/audio';
import { config, site } from '@/lib/site';
import { scroll } from '@/lib/scroll';

/**
 * ============================================================================
 *  SCENE 02 — THE INVITATION
 * ============================================================================
 *
 *  A physical object, not a text block. Ivory handmade card stock, gold-leaf
 *  edges, an embossed monogram and a wax seal, folded shut.
 *
 *  The guest breaks the seal; the cover swings open on its fold; the words are
 *  inside. The whole interaction is three transforms and a handful of wax
 *  shards — no images, so it stays sharp at any density and costs nothing to
 *  load.
 *
 *  Once opened it stays open: the invitation does not close itself.
 */

type CardState = 'sealed' | 'opening' | 'open';

export function Invitation() {
  const [state, setState] = useState<CardState>('sealed');
  const { cue } = useAudio();

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLButtonElement>(null);
  const shardsRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /* ======================================================================
     The break
     ====================================================================== */
  const open = useCallback(() => {
    if (stateRef.current !== 'sealed') return;
    setState('opening');
    cue('seal');

    // Under reduced motion the invitation is simply open. Nothing swings.
    if (scroll.reduceMotion) {
      window.setTimeout(() => setState('open'), 120);
      return;
    }

    // Wax cracks first, then the card gives. Two sounds, 340ms apart.
    window.setTimeout(() => cue('paper'), 340);

    const shards = shardsRef.current;
    if (shards) {
      const children = Array.from(shards.children) as HTMLElement[];
      children.forEach((shard, i) => {
        const angle = (i / children.length) * Math.PI * 2;
        shard.animate(
          [
            { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
            {
              transform: `translate3d(${Math.cos(angle) * 90}px, ${
                Math.sin(angle) * 90 + 40
              }px, 0) rotate(${angle * 40}deg) scale(0.3)`,
              opacity: 0,
            },
          ],
          {
            duration: 900 + i * 60,
            easing: 'cubic-bezier(0.16,1,0.3,1)',
            delay: i * 18,
            fill: 'forwards',
          },
        );
      });
    }

    if (sealRef.current) {
      sealRef.current.animate(
        [
          { transform: 'scale(1) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.14) rotate(-6deg)', opacity: 1, offset: 0.28 },
          { transform: 'scale(0.86) rotate(4deg)', opacity: 0 },
        ],
        { duration: 620, easing: 'cubic-bezier(0.65,0,0.35,1)', fill: 'forwards' },
      );
    }

    if (innerRef.current) {
      innerRef.current.animate(
        [
          { transform: 'rotateY(0deg)' },
          { transform: 'rotateY(-14deg)', offset: 0.16 },
          { transform: 'rotateY(-176deg)' },
        ],
        { duration: 2000, easing: 'cubic-bezier(0.62,0.02,0.2,1)', fill: 'forwards' },
      );
    }

    window.setTimeout(() => setState('open'), 2000);
  }, [cue]);

  /* ======================================================================
     The hint retires once the seal has been broken
     ====================================================================== */
  useEffect(() => {
    if (state === 'sealed' || !hintRef.current) return;
    hintRef.current.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 500,
      fill: 'forwards',
    });
  }, [state]);

  const isOpen = state === 'open';

  return (
    <section
      ref={rootRef}
      id="invitation"
      data-scene="invitation"
      className="scene material-marble scene-pad relative isolate overflow-hidden px-[var(--gutter)]"
      aria-labelledby="invitation-heading"
    >
      {/* A soft pool of light behind the card, so it reads as an object on a surface. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 size-[min(120vw,80rem)] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle, rgba(255,252,242,0.9) 0%, rgba(240,232,212,0.5) 40%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-[clamp(3.5rem,9vh,7rem)]">
        <SceneHeading
          label="The Invitation"
          tone="ivory"
          sub={config.invitation.openingLine}
        >
          <span id="invitation-heading">You are invited</span>
        </SceneHeading>

        {/* --- The card ------------------------------------------------- */}
        <div
          ref={stageRef}
          className="relative w-full max-w-[min(88vw,26rem)]"
          style={{ perspective: '1600px' }}
        >
          <div
            ref={innerRef}
            className="relative aspect-[5/7] w-full [transform-style:preserve-3d]"
            style={{ transform: 'rotateY(0deg)' }}
          >
            {/* ---- COVER ---- */}
            <div
              ref={coverRef}
              className="material-ivory absolute inset-0 flex flex-col items-center justify-between px-[8%] py-[9%] shadow-[0_40px_90px_-50px_rgba(60,44,12,0.55)] [backface-visibility:hidden]"
              style={{ borderRadius: '2px' }}
            >
              {/* Gold edge: a double rule, as on a real letterpress card */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[3.2%] border border-gold/45"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[4.6%] border border-gold/20"
              />
              {/* The fold, catching a shadow down the right-hand side */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-[12%]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(90,66,20,0.10))',
                }}
              />

              <div className="flex flex-col items-center gap-5 text-center">
                <p className="label fg-paper-muted">{config.invitation.openingLine}</p>
                <Monogram size="lg" foil="ink" />
              </div>

              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <p className="foil-ink font-display text-[clamp(1.35rem,5.4vw,2rem)] font-light leading-tight">
                    {site.namesStacked.bride}
                  </p>
                  <span className="label text-[0.45rem] fg-paper-muted">{config.meta.brideCredentials}</span>
                  <span aria-hidden="true" className="font-display text-gold-antique">
                    {config.meta.monogramGlyph}
                  </span>
                  <p className="foil-ink font-display text-[clamp(1.35rem,5.4vw,2rem)] font-light leading-tight">
                    {site.namesStacked.groom}
                  </p>
                  <span className="label text-[0.45rem] fg-paper-muted">{config.meta.groomCredentials}</span>
                </div>

                <span aria-hidden="true" className="rule w-full">
                  <span>◆</span>
                </span>

                <p className="label fg-paper-muted">{site.dateLabel}</p>
              </div>
            </div>

            {/* ---- INSIDE ---- */}
            <div
              className="material-ivory absolute inset-0 flex flex-col items-center justify-between px-[10%] py-[10%] shadow-[0_40px_90px_-50px_rgba(60,44,12,0.55)] [backface-visibility:hidden]"
              style={{ transform: 'rotateY(180deg)', borderRadius: '2px' }}
              aria-hidden={!isOpen}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[3.2%] border border-gold/45"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[4.6%] border border-gold/20"
              />
              {/* The gutter shadow of the fold */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-[10%]"
                style={{ background: 'linear-gradient(270deg, transparent, rgba(90,66,20,0.10))' }}
              />

              <div className="flex flex-col items-center gap-3 text-center">
                <Monogram size="sm" foil="ink" />
                <span aria-hidden="true" className="rule w-full">
                  <span>◆</span>
                </span>
              </div>

              <div className="flex flex-col items-center gap-5 text-center">
                <p className="max-w-[22ch] font-display text-[clamp(1rem,4.4vw,1.35rem)] font-light italic leading-relaxed fg-paper text-balance">
                  {config.invitation.body}
                </p>

                <div className="flex flex-col items-center gap-2">
                  <p className="foil-ink font-display text-[clamp(1.5rem,6vw,2.25rem)] font-light uppercase tracking-[0.16em]">
                    {site.dateLabel}
                  </p>
                  <p className="label fg-paper-muted">{config.location.venue}</p>
                </div>

                <p className="max-w-[26ch] font-display text-[clamp(0.8rem,3.2vw,0.95rem)] italic fg-paper-muted">
                  {config.invitation.closingLine}
                </p>
              </div>
            </div>
          </div>

          {/* ---- The wax seal ---- */}
          {state !== 'open' ? (
            <button
              ref={sealRef}
              type="button"
              onClick={open}
              className="group absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
              aria-label="Break the seal and open the invitation"
            >
              <WaxSeal />
            </button>
          ) : null}

          {/* Wax shards, released when the seal gives. */}
          <div ref={shardsRef} className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
            {state !== 'open'
              ? Array.from({ length: 11 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute left-1/2 top-1/2 size-[6px] rounded-[40%_60%_55%_45%]"
                    style={{
                      background: 'linear-gradient(140deg, #6B1A2C, #3A0C16)',
                      boxShadow: 'inset 0 1px 1px rgba(255,190,190,0.25)',
                      translate: `${(i % 2 ? 1 : -1) * 6}px ${Math.floor(i / 2) * 5 - 10}px`,
                    }}
                  />
                ))
              : null}
          </div>
        </div>

        <p
          ref={hintRef}
          className="label text-center fg-paper-faint"
          aria-live="polite"
        >
          {state === 'sealed' ? 'Break the seal' : ''}
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   The wax seal
   -------------------------------------------------------------------------- */

function WaxSeal() {
  return (
    <span className="relative grid size-[clamp(4.5rem,17vw,6.5rem)] place-items-center">
      {/* The wax disc: an irregular blob, not a perfect circle. */}
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <radialGradient id="wax" cx="0.38" cy="0.32" r="0.78">
            <stop offset="0" stopColor="#8E2A40" />
            <stop offset="0.45" stopColor="#6B1A2C" />
            <stop offset="0.82" stopColor="#4A1220" />
            <stop offset="1" stopColor="#2E0A13" />
          </radialGradient>
          <linearGradient id="wax-rim" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#C4607A" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#6B1A2C" stopOpacity="0" />
            <stop offset="1" stopColor="#1C0509" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Blob outline — 18 points on a slightly irregular radius. */}
        <path
          d="M60 4 C74 4 84 8 92 14 C100 20 108 28 113 38 C118 48 118 60 116 72 C114 84 110 94 102 102 C94 110 82 116 70 117 C58 118 46 116 36 112 C26 108 16 102 10 92 C4 82 2 70 3 58 C4 46 8 34 14 26 C20 18 30 10 40 6 C46 4 53 4 60 4 Z"
          fill="url(#wax)"
        />
        <path
          d="M60 4 C74 4 84 8 92 14 C100 20 108 28 113 38 C118 48 118 60 116 72 C114 84 110 94 102 102 C94 110 82 116 70 117 C58 118 46 116 36 112 C26 108 16 102 10 92 C4 82 2 70 3 58 C4 46 8 34 14 26 C20 18 30 10 40 6 C46 4 53 4 60 4 Z"
          fill="url(#wax-rim)"
        />

        {/* Pressed ring */}
        <circle cx="60" cy="60" r="44" fill="none" stroke="#2E0A13" strokeWidth="1.4" opacity="0.6" />
        <circle cx="60" cy="60" r="46" fill="none" stroke="#B4556E" strokeWidth="0.7" opacity="0.28" />

        {/* The monogram, pressed into the wax */}
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#28070E"
          opacity="0.72"
          style={{ font: "500 34px var(--font-cormorant), serif", letterSpacing: '1px' }}
        >
          {config.meta.monogram}
        </text>
        <text
          x="60"
          y="58.5"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#C4788E"
          opacity="0.4"
          style={{ font: "500 34px var(--font-cormorant), serif", letterSpacing: '1px' }}
        >
          {config.meta.monogram}
        </text>
      </svg>

      {/* The seal lifts very slightly on hover — the only affordance it needs. */}
      <span className="relative transition-transform duration-700 ease-silk group-hover:-translate-y-0.5 group-hover:scale-[1.04]" />
    </span>
  );
}
