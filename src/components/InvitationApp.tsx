'use client';

import { useEffect, useState } from 'react';

import { AudioPlayer } from '@/components/hud/AudioPlayer';
import { Cursor } from '@/components/hud/Cursor';
import { SiteNav } from '@/components/hud/SiteNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Overture } from '@/components/entry/Overture';
import { PalaceDoors } from '@/components/entry/PalaceDoors';
import { Blessings } from '@/scenes/Blessings';
import { Celebration } from '@/scenes/Celebration';
import { Countdown } from '@/scenes/Countdown';
import { Destination } from '@/scenes/Destination';
import { Details } from '@/scenes/Details';
import { Final } from '@/scenes/Final';
import { Footer } from '@/scenes/Footer';
import { Gallery } from '@/scenes/Gallery';
import { Hero } from '@/scenes/Hero';
import { Invitation } from '@/scenes/Invitation';
import { Rsvp } from '@/scenes/Rsvp';
import { SaveTheDate } from '@/scenes/SaveTheDate';
import { Story } from '@/scenes/Story';
import { useExperience } from '@/lib/experience';
import { afterFirstPaint } from '@/lib/frame';
import { lockScroll, scroll, unlockScroll } from '@/lib/scroll';

/**
 * ============================================================================
 *  THE INVITATION
 * ============================================================================
 *
 *  The orchestrator. Four phases and one page:
 *
 *      overture  the opening, and the guest's own gesture to begin
 *      doors     the palace
 *      entering  the doors swing open
 *      inside    the invitation itself
 *
 *  The whole invitation is mounted one act early — not when the guest arrives at
 *  the doors — so every font, gradient and vector composition is already resident
 *  by the time the doors open, and the reveal costs nothing. Until then it is
 *  present but inert: invisible, and unable to take focus or a pointer.
 *
 *  Scroll is locked for the entire entry sequence and released the instant the
 *  doors finish, so the guest never finds themselves halfway down a page they
 *  have not seen.
 */
export function InvitationApp() {
  const { phase, useWebGL } = useExperience();
  const [stageReady, setStageReady] = useState(false);
  /**
   * True once the opening has painted and the browser has gone idle. The palace
   * is not built before this moment, and not after the press either: this is the
   * window in between where the work is genuinely free.
   */
  const [quiet, setQuiet] = useState(false);

  /**
   * Content is mounted one act early, on purpose: warming it while the guest
   * reads the opening is invisible work that pays off at the reveal.
   */
  const mounted = phase !== 'overture';
  const inside = phase === 'inside';

  useEffect(() => {
    if (inside) return;
    lockScroll();
    return unlockScroll;
  }, [inside]);

  useEffect(() => {
    if (inside) scroll.reset();
  }, [inside]);

  /*
   * Build the palace in the gap between "the opening has painted" and "the guest
   * presses ENTER".
   *
   * Doing this work is unavoidable — a WebGL context, its shaders and its
   * textures have to be created at some point. The only question is when, and
   * the two obvious answers are both wrong. Too early and it steals the
   * milliseconds the guest is waiting to see. On the press, and the doors
   * visibly stall for over a second. So we wait until the browser reports it
   * has finished painting and gone idle, and build it there, where the guest is
   * only reading.
   */
  useEffect(() => {
    if (!useWebGL) return;
    // `afterFirstPaint` returns its own cancel, so the flag is redundant.
    return afterFirstPaint(() => setQuiet(true));
  }, [useWebGL]);

  return (
    <>
      {/* --- ACT I — the opening ----------------------------------------- */}
      {phase === 'overture' ? (
        <ErrorBoundary label="The opening">
          <Overture stageReady={stageReady} onStageReady={() => setStageReady(true)} />
        </ErrorBoundary>
      ) : null}

      {/*
       * ACT II mounts as soon as the opening has painted and gone idle, so the
       * palace builds itself while the guest is still reading. Until then it is
       * not mounted at all — an unmounted scene costs nothing, whereas a mounted
       * one is already compiling shaders before anyone asked for it.
       */}
      {phase !== 'overture' || quiet ? <PalaceDoors /> : null}

      {/* --- ACT III — the invitation ------------------------------------ */}
      {mounted ? (
        <div
          id="invitation-content"
          data-phase={phase}
          className="transition-opacity duration-[1200ms] ease-silk"
          style={{
            opacity: inside ? 1 : 0,
            // Inert until the guest is inside: no tab stops behind the doors.
            pointerEvents: inside ? undefined : 'none',
            visibility: inside ? undefined : 'hidden',
          }}
        >
          <SiteNav />
          <AudioPlayer />
          <Cursor />

          <main id="main">
            {/*
             * Each scene is fenced. A failure in one — a bad asset, a browser
             * quirk, a bug — costs that section only. The invitation itself, and
             * the RSVP, must always survive.
             */}
            <Scene name="hero">
              <Hero />
            </Scene>
            <Scene name="invitation">
              <Invitation />
            </Scene>
            <Scene name="story">
              <Story />
            </Scene>
            <Scene name="save-the-date">
              <SaveTheDate />
            </Scene>
            <Scene name="celebration">
              <Celebration />
            </Scene>
            <Scene name="countdown">
              <Countdown />
            </Scene>
            <Scene name="destination">
              <Destination />
            </Scene>
            <Scene name="gallery">
              <Gallery />
            </Scene>
            <Scene name="details">
              <Details />
            </Scene>
            <Scene name="blessings">
              <Blessings />
            </Scene>
            <Scene name="rsvp">
              <Rsvp />
            </Scene>
            <Scene name="final">
              <Final />
            </Scene>
          </main>

          <Footer />
        </div>
      ) : null}
    </>
  );
}

/**
 * Fence one scene. Keeps a failure local, and labels the space it leaves behind
 * so the page does not read as a hole.
 */
function Scene({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <ErrorBoundary label={name} onError={(error) => console.error(`[scene:${name}]`, error)}>
      {children}
    </ErrorBoundary>
  );
}
