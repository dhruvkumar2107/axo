'use client';

import { useEffect } from 'react';

import { AudioPlayer } from '@/components/hud/AudioPlayer';
import { Cursor } from '@/components/hud/Cursor';
import { SiteNav } from '@/components/hud/SiteNav';
import { PalaceDoors } from '@/components/entry/PalaceDoors';
import { Preloader } from '@/components/entry/Preloader';
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
import { lockScroll, scroll, unlockScroll } from '@/lib/scroll';

/**
 * ============================================================================
 *  THE INVITATION
 * ============================================================================
 *
 *  The orchestrator. Three acts and one page:
 *
 *      loading   the preloader
 *      doors     the palace, and the guest's own gesture to open it
 *      inside    the invitation itself
 *
 *  The whole invitation is mounted as soon as the preloader clears — not when
 *  the guest arrives at the doors — so every font, gradient and vector
 *  composition is already resident by the time the doors open, and the reveal
 *  costs nothing. Until then it is present but inert: invisible, and unable to
 *  take focus or a pointer.
 *
 *  Scroll is locked for the entire entry sequence and released the instant the
 *  doors finish, so the guest never finds themselves halfway down a page they
 *  have not seen.
 */
export function InvitationApp() {
  const { phase, goToDoors } = useExperience();

  /**
   * Content is mounted one act early, on purpose: warming it while the guest
   * reads the preloader is invisible work that pays off at the reveal.
   */
  const mounted = phase !== 'loading';
  const inside = phase === 'inside';

  useEffect(() => {
    if (inside) return;
    lockScroll();
    return unlockScroll;
  }, [inside]);

  useEffect(() => {
    if (inside) scroll.reset();
  }, [inside]);

  return (
    <>
      {/* --- ACT I — the preloader --------------------------------------- */}
      {phase === 'loading' ? <Preloader onComplete={goToDoors} /> : null}

      {/* --- ACT II — the palace ----------------------------------------- */}
      {phase !== 'loading' ? <PalaceDoors /> : null}

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
            <Hero />
            <Invitation />
            <Story />
            <SaveTheDate />
            <Celebration />
            <Countdown />
            <Destination />
            <Gallery />
            <Details />
            <Blessings />
            <Rsvp />
            <Final />
          </main>

          <Footer />
        </div>
      ) : null}
    </>
  );
}