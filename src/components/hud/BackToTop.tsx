'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { scrollTo } from '@/lib/scroll';
import { useExperience } from '@/lib/experience';
import { cn } from '@/lib/cn';

/**
 * ============================================================================
 *  BACK TO TOP
 * ============================================================================
 *
 *  The header monogram does return to the top, but it is a small target and it
 *  only exists once the guest is inside the invitation. Somebody who has read
 *  to the end and wants to go back to the beginning should not have to hunt for
 *  it.
 *
 *  So: a plain, permanent control that appears once the guest is two screens
 *  down. It jumps rather than eases, because the distance from here to the top
 *  is the whole page and an eased scroll across that reads as a stalled page
 *  rather than a deliberate movement.
 *
 *  It sits above the music toggle and below the header in the stack, so the two
 *  controls never overlap.
 */

/** Stay out of the way until the guest has actually travelled. */
const REVEAL_AFTER_PX = 2000;

export function BackToTop() {
  const { isInside } = useExperience();
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!isInside) return;

    const read = () => setPast(window.scrollY > REVEAL_AFTER_PX);

    // Lenis drives the scroll but writes to window.scrollY, so listening to
    // scroll is enough. Passive, because this runs on every frame.
    window.addEventListener('scroll', read, { passive: true });
    // Deferred a frame so the initial read happens after Lenis has taken over,
    // rather than racing it on mount.
    const frame = requestAnimationFrame(read);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', read);
    };
  }, [isInside]);

  // Hidden until the guest is inside, and until they have actually travelled.
  const visible = isInside && past;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          // Bottom-right, because the music disc already owns the bottom-left
          // corner and the header owns the top-right. Sitting on top of the
          // audio control would make both unusable on a phone.
          className={cn(
            'fixed bottom-6 right-[max(1.25rem,env(safe-area-inset-right))] z-hud grid size-11 place-items-center rounded-full',
            'border border-gold-antique/25 bg-ivory/90 text-inkwarm shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]',
            'backdrop-blur-md transition-colors duration-500 ease-silk',
            'hover:border-gold-antique/60 hover:bg-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon',
          )}
          onClick={() => scrollTo(0, 0, true)}
          aria-label="Back to the top"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <span aria-hidden="true" className="font-display text-lg leading-none">
            ↑
          </span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}