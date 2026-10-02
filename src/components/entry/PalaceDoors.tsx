'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

import { Monogram } from '@/components/primitives/Monogram';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PalaceFallback } from './PalaceFallback';
import { useAudio } from '@/lib/audio';
import { useExperience } from '@/lib/experience';
import { site } from '@/lib/site';
import { afterDelay, once } from '@/lib/frame';
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

/** Duration of the door swing, in seconds. Shared with the 2.5D fallback. */
const OPEN_SECONDS = 5.5;

/**
 * The one guarantee this act must never break.
 *
 * Whoever swings the doors — WebGL, the 2.5D fallback, or nothing at all — the
 * guest gets let in. This timer lives here rather than inside the scene because
 * it must not depend on the scene existing, drawing a frame, or surviving: a
 * guest who pressed ENTER is never left standing at a closed door.
 */
const OPEN_MILLIS = (OPEN_SECONDS + 1.2) * 1000;

export function PalaceDoors() {
  const { phase, tier, profile, useWebGL, greeting, startOpen, completeEntry } = useExperience();
  const { play, cue } = useAudio();

  const [demoted, setDemoted] = useState(false);
  const [ready, setReady] = useState(false);
  const noop = useCallback(() => undefined, []);

  /**
   * True while the guest is still reading the opening: this act is mounted and
   * has built its scene, but it must stay invisible and must not run a frame of
   * animation. It is a workshop, not a stage.
   */
  const warming = phase === 'overture';

  /*
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
    /*
     * The palace is built while the guest reads the opening, so by the time they
     * press ENTER the module is already downloaded, parsed and compiled and the
     * context is created without waiting on the network. This import therefore
     * resolves from cache in the common case; it exists so that a guest who
     * decides quickly — or whose device is too slow to have warmed — is never
     * left waiting on a chunk.
     */
    void import('./PalaceScene')
      .then((module) => {
        if (live) setWebGLScene(() => module.PalaceScene);
      })
      .catch((error) => {
        // A failed 3D chunk must never strand the guest: fall back to the CSS
        // palace, which runs the identical timeline.
        console.warn('[invitation] palace 3D unavailable, using the 2.5D path:', error);
        if (live) setDemoted(true);
      });
    return () => {
      live = false;
    };
  }, [useWebGL, demoted]);

  const rootRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  const isOpening = phase === 'entering';
  const isGone = phase === 'inside';

  /** WebGL is used only while it is both wanted and not yet demoted. */
  const useWebglNow = useWebGL && !demoted;

  /* ======================================================================
     Start the open.

     The guest pressed ENTER on the opening; the doors now open by themselves.
     We wait for the scene to be genuinely able to draw so the swing is not
     missed, but the wait is bounded by a plain timer rather than by the scene's
     cooperation — a guest is never left staring at closed doors.
     ====================================================================== */
  const openedRef = useRef(false);
  const launchOpen = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    // This gesture is our one chance to satisfy autoplay policy.
    play();
    cue('door');
    startOpen();
  }, [play, cue, startOpen]);

  useEffect(() => {
    if (phase !== 'doors') return;
    /*
     * If the scene is already warm — which it usually is, because it was built
     * while the guest read the opening — the effect below opens the moment it
     * reports it can draw. This timer is only the floor beneath that: it exists
     * for the case where the scene never reports readiness, and it is
     * deliberately generous so the swing is never missed.
     */
    return afterDelay(launchOpen, 800);
  }, [phase, launchOpen]);

  /** The moment the scene says it can play, stop waiting. */
  useEffect(() => {
    if (phase !== 'doors' || !ready) return;
    launchOpen();
  }, [phase, ready, launchOpen]);

  /* ======================================================================
     Copy settles into place once the scene is on screen
     ====================================================================== */
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      if (profile.isReducedMotion) {
        gsap.set(copyRef.current, { clearProps: 'all' });
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
        });
    }, rootRef);
    return () => ctx.revert();
  }, [ready, profile.isReducedMotion]);

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

  /*
   * The hand-over, guaranteed.
   *
   * Armed the moment the doors begin to swing. Whichever renderer is running
   * will normally finish first and hand over sooner; this exists so that a lost
   * WebGL context, a failed fallback, or a device that never delivers a frame
   * still cannot strand the guest. `once` means the first signal wins and the
   * second is ignored.
   */
  const handOver = useRef(once(handleOpened));
  useEffect(() => {
    if (!isOpening) return;
    return afterDelay(() => handOver.current(), OPEN_MILLIS);
  }, [isOpening]);

  // Nothing scrolls while the guest is at the doors, and the page is released
  // the moment they are through.
  useEffect(() => {
    if (phase === 'inside' || phase === 'overture') return;
    lockScroll();
    return unlockScroll;
  }, [phase]);

  /* ======================================================================
     Leave

     The exit is deliberately CSS rather than GSAP. A transition is advanced by
     the browser's own compositor rather than by our `requestAnimationFrame`
     calls, so the doors still dissolve on exactly the kind of device that never
     delivers a frame — the same environment the hand-over above defends
     against. Animating the exit with the animation library that *needs* frames
     would leave the act parked on screen, covering the invitation it just
     handed over.
     ====================================================================== */
  useEffect(() => {
    if (!isGone) return;
    const root = rootRef.current;
    if (!root) return;

    const fade = profile.isReducedMotion ? 200 : 1200;
    // Opacity fades; visibility is switched only once the fade has finished, so
    // the act stops being composited without snapping out early.
    root.style.transition = `opacity ${fade}ms linear, visibility 0s linear ${fade}ms`;
    root.style.opacity = '0';
    root.style.visibility = 'hidden';
  }, [isGone, profile.isReducedMotion]);

  return (
    <div
      ref={rootRef}
      className={cn(
        'fixed inset-0 z-hud overflow-hidden bg-ink',
        isGone && 'pointer-events-none',
      )}
      // While warming, the whole act is present and working but cannot be seen,
      // touched, or found by a screen reader — it is not part of the page yet.
      aria-hidden={warming || undefined}
      data-scene="doors"
      style={
        warming
          ? { visibility: 'hidden', pointerEvents: 'none' }
          : undefined
      }
    >
      {/* --- The scene ---------------------------------------------------- */}
      {useWebglNow ? (
        WebGLScene ? (
          /*
           * A GPU failure, a lost context or a bug in the scene must demote to
           * the 2.5D palace rather than blanking the act. The boundary resets
           * `demoted`, which flips the branch below to the CSS sequence.
           */
          <ErrorBoundary
            label="The palace entrance"
            onError={() => setDemoted(true)}
            fallback={null}
          >
            <WebGLScene
              opening={isOpening}
              onOpened={() => handOver.current()}
              onDemote={() => setDemoted(true)}
              tier={tier}
              interactive={!profile.isMobile}
              onReady={() => setReady(true)}
              active={phase === 'doors' || phase === 'entering'}
            />
          </ErrorBoundary>
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
          onOpened={() => handOver.current()}
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
            <p className="label fg-night-muted">{greeting}</p>
          ) : (
            <p className="label fg-night-muted">
              <span className="block">A celebration of love</span>
              <span className="mt-1 block fg-brass">A celebration of legacy</span>
            </p>
          )}

          <Monogram size="hero" foil="gold" />

          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="label fg-night-muted">
              {site.dateLabel} &middot; {site.city}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
