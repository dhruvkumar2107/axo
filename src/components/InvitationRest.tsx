'use client';

import { useMemo } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Blessings } from '@/scenes/Blessings';
import { Celebration } from '@/scenes/Celebration';
import { Countdown } from '@/scenes/Countdown';
import { Destination } from '@/scenes/Destination';
import { Details } from '@/scenes/Details';
import { Final } from '@/scenes/Final';
import { Footer } from '@/scenes/Footer';
import { Gallery } from '@/scenes/Gallery';
import { Rsvp } from '@/scenes/Rsvp';
import { SaveTheDate } from '@/scenes/SaveTheDate';
import { Story } from '@/scenes/Story';

/**
 * ============================================================================
 *  THE INVITATION, BELOW THE FOLD
 * ============================================================================
 *
 *  Everything from the couple's story to the sign-off, as one lazily imported
 *  chunk.
 *
 *  This is nine scenes and a footer that a guest cannot reach for the first
 *  several seconds — they have to press ENTER and watch the doors open first.
 *  Imported statically, they were in the critical path anyway: the whole
 *  invitation was parsed, compiled and resident before the opening screen had
 *  finished its first paint, which put roughly 1.5MB of JavaScript between the
 *  guest and the one screen they had actually asked for.
 *
 *  They are mounted from `InvitationApp` during the idle window after first
 *  paint, so the download happens while the guest is reading the opening and
 *  before they can possibly scroll. From their point of view the cost is free;
 *  on a phone on cellular it is the difference between a first paint that
 *  waits on the network and one that does not.
 *
 *  Page order is load-bearing. `SiteNav`'s scene list and the scroll targets in
 *  `scrollTo` both address these sections by id, so this order must stay
 *  identical to the one it replaced.
 */

const SCENES = [
  { name: 'story', Node: Story },
  { name: 'save-the-date', Node: SaveTheDate },
  { name: 'celebration', Node: Celebration },
  { name: 'countdown', Node: Countdown },
  { name: 'destination', Node: Destination },
  { name: 'gallery', Node: Gallery },
  { name: 'details', Node: Details },
  { name: 'blessings', Node: Blessings },
  { name: 'rsvp', Node: Rsvp },
  { name: 'final', Node: Final },
] as const;

export function InvitationRest() {
  // Resolved once so the list identity is stable across renders; these are
  // component references, not values, so nothing here can go stale.
  const scenes = useMemo(() => SCENES, []);

  return (
    <>
      {scenes.map(({ name, Node }) => (
        <ErrorBoundary key={name} label={name} onError={(error) => console.error(`[scene:${name}]`, error)}>
          <Node />
        </ErrorBoundary>
      ))}

      <ErrorBoundary label="footer" onError={(error) => console.error('[scene:footer]', error)}>
        <Footer />
      </ErrorBoundary>
    </>
  );
}