'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';

import { Monogram } from '@/components/primitives/Monogram';
import { PalaceFallback } from './PalaceFallback';
import { useAudio } from '@/lib/audio';
import { useExperience } from '@/lib/experience';
import { site } from '@/lib/site';
import { lockScroll, unlockScroll } from '@/lib/scroll';
import { cn } from '@/lib/cn';

/**
 * ============================================================================
 *  THE PALACE DOORS
 * ============================================================================
 *
 *  The second act. The guest stands outside a private estate at night. This
 *  component owns everything the guest can *act on* — the copy, the seal, the
 *  audio prompt — while the scene beneath it is purely decorative and may be
 *  rendered as WebGL or as 2.5D without changing a line of the interface.
 *
 *  It also handles the audio unlock. Browsers will not start sound without a
 *  gesture, and the gesture the guest is about to make — pressing ENTER — is a
 *  perfectly good one, so music begins on the door press rather than on an
 *  extra, unexplained tap.
 */

export function PalaceDoors() {
  const { phase, tier, profile, useWebGL, greeting, beginEntry, completeEntry } = useExperience();
  const { play, cue, needsGesture } = useAudio();

  const [demoted, setDemoted] = useState(false);
  const [ready, setReady] = useState(false);
  const noop = useCallback(() => undefined, []);

  /**
   * Three.js is a large dependency and most guests will never need it: it is
   * loaded only on a device that has already been judged capable of the WebGL
   * scene, and only once that guest has actually chosen it. Until the module
   * arrives, the 2.5D palace is what the guest sees — so the first frame of the
   * sequence is never blank, and the swap happens behind an identical timeline.
   */
  const [WebGLScene, setWebGLScene] = useState<null | typeof import('./PalaceScene').PalaceScene>(
    null,
  );

  useEffect(() => {
    if (!useWebGL || demoted) return;
    let live = true;
    void import('./PalaceScene').then((module) => {
      if (live) setWebGLScene(() => module.PalaceScene);
    });
    return () => {
      live = false;
    };
  }, [useWebGL, demoted]);

  const rootRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  const isOpening = phase === 'entering';
  const isGone = phase === 'inside';

  /** WebGL is used only while it is both wanted and not yet demoted. */
  const useWebglNow = useWebGL && !demoted;

  /* ======================================================================
     Copy settles into place once the scene is on screen
     ====================================================================== */
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      if (profile.isReducedMotion) {
        gsap.set([copyRef.current, sealRef.current], { clearProps: 'all' });
        return;
      }
      gsap
        .timeline({ delay: 0.45 })
        .from(copyRef.current?.children ?? [], {
          y: 30,
          opacity: 0,
          duration: 1.7,
          stagger: 0.18,
          ease: 'power3.out',
        })
        .from(
          sealRef.current,
          { scale: 0.88, opacity: 0, duration: 1.8, ease: 'expo.out' },
          '-=0.9',
        );
    }, rootRef);
    return () => ctx.revert();
  }, [ready, profile.isReducedMotion]);

  /* ======================================================================
     The press
     ====================================================================== */
  const onEnter = useCallback(() => {
    if (isOpening) return;
    // This gesture is our one chance to satisfy autoplay policy.
    play();
    cue('door');
    beginEntry();
  }, [isOpening, play, cue, beginEntry]);

  /* ======================================================================
     Opening: a warm veil passes over the scene before the invitation appears
     ====================================================================== */
  useEffect(() => {
    if (!isOpening) return;
    const ctx = gsap.context(() => {
      if (profile.isReducedMotion) return;
      gsap.fromTo(
        veilRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 2.6, ease: 'power2.in', delay: 3.4 },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [isOpening, profile.isReducedMotion]);

  const handleOpened = useCallback(() => {
    cue('chime');
    completeEntry();
  }, [cue, completeEntry]);

  // Nothing scrolls while the guest is at the doors, and the page is released
  // the moment they are through.
  useEffect(() => {
    if (phase === 'inside' || phase === 'loading') return;
    lockScroll();
    return unlockScroll;
  }, [phase]);

  /* ======================================================================
     Leave
     ====================================================================== */
  useEffect(() => {
    if (!isGone) return;
    const ctx = gsap.context(() => {
      gsap.to(rootRef.current, {
        autoAlpha: 0,
        duration: profile.isReducedMotion ? 0.2 : 1.2,
        ease: 'power2.inOut',
      });
    }, rootRef);
    return () => ctx.revert();
  }, [isGone, profile.isReducedMotion]);

  return (
    <div
      ref={rootRef}
      className={cn(
        'fixed inset-0 z-hud overflow-hidden bg-ink',
        isGone && 'pointer-events-none',
      )}
      data-scene="doors"
    >
      {/* --- The scene ---------------------------------------------------- */}
      {useWebglNow ? (
        WebGLScene ? (
          <WebGLScene
            opening={isOpening}
            onOpened={handleOpened}
            onDemote={() => setDemoted(true)}
            tier={tier}
            interactive={!profile.isMobile}
            onReady={() => setReady(true)}
          />
        ) : (
          /*
            The 2.5D palace covers the few hundred milliseconds the 3D module
            needs to arrive. It is held static and silent, so the entry sequence
            begins once — from the scene that will actually play it.
          */
          <PalaceFallback opening={false} onOpened={noop} tier={tier} onReady={noop} />
        )
      ) : (
        <PalaceFallback
          opening={isOpening}
          onOpened={handleOpened}
          tier={tier}
          onReady={() => setReady(true)}
        />
      )}

      {/* --- The warm veil that closes the act --------------------------- */}
      <div
        ref={veilRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-0"
        style={{
          background:
            'radial-gradient(circle at 50% 46%, rgba(255,232,186,0.98) 0%, rgba(228,186,112,0.9) 34%, rgba(26,58,45,1) 76%)',
        }}
      />

      {/* --- Copy --------------------------------------------------------- */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-[var(--gutter)] text-center">
        <div ref={copyRef} className="flex flex-col items-center gap-5">
          {greeting ? (
            <p className="label text-ivory/45">{greeting}</p>
          ) : (
            <p className="label text-ivory/45">
              <span className="block">A celebration of love</span>
              <span className="mt-1 block text-gold/70">A celebration of legacy</span>
            </p>
          )}

          <Monogram size="hero" foil />

          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="label text-ivory/50">
              {site.dateLabel} &middot; {site.city}
            </p>
          </div>
        </div>
      </div>

      {/* --- The seal ----------------------------------------------------- */}
      <AnimatePresence>
        {!isOpening && !isGone ? (
          <motion.div
            key="seal"
            className="absolute inset-x-0 bottom-0 z-20 flex justify-center pb-[max(2.5rem,env(safe-area-inset-bottom))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            <div ref={sealRef} className="relative">
              {/* The seal is the invitation itself: a wax disc behind the type. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-10 -inset-y-6 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.10),transparent_72%)] blur-md"
              />
              <button type="button" className="seal-button group" onClick={onEnter}>
                <span className="relative">
                  Enter the celebration
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold-light/70 transition-transform duration-700 ease-silk group-hover:scale-x-100"
                  />
                </span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* --- Audio prompt -------------------------------------------------- */}
      <AnimatePresence>
        {needsGesture && !isGone ? (
          <motion.p
            key="audio-prompt"
            className="label pointer-events-none absolute inset-x-0 bottom-[max(1.1rem,env(safe-area-inset-bottom))] z-20 px-[var(--gutter)] text-center text-[0.5rem] text-ivory/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.6, duration: 1 }}
          >
            Sound accompanies this invitation
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
