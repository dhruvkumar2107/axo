'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Monogram } from '@/components/primitives/Monogram';
import { useExperience } from '@/lib/experience';
import { config } from '@/lib/site';
import { lockScroll, scrollTo, unlockScroll } from '@/lib/scroll';
import { cn } from '@/lib/cn';

/**
 * ============================================================================
 *  NAVIGATION
 * ============================================================================
 *
 *  A fixed header that appears only once the guest is inside, and behaves like a
 *  film credit rather than a website menu: a monogram on the left, a row of
 *  scene names on the right, and nothing until the guest is past the doors.
 *
 *  On a phone the names collapse into a single seal that opens a full-bleed
 *  menu — because nine tracked-out labels will not fit, and shrinking them to
 *  fit would be worse than showing them one at a time.
 */

/** Scene ids in page order. Used for the indicator and the mobile menu. */
const ORDER = [
  'hero',
  'invitation',
  'story',
  'save-the-date',
  'celebration',
  'countdown',
  'destination',
  'gallery',
  'details',
  'blessings',
  'rsvp',
  'final',
];

export function SiteNav() {
  const { isInside } = useExperience();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>('hero');
  const headerRef = useRef<HTMLElement>(null);

  /* --- Which scene is on screen ---------------------------------------- */
  useEffect(() => {
    if (!isInside) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-scene]'));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to filling the viewport.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.getAttribute('data-scene');
        if (id) setActive(id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isInside]);

  /* --- The menu freezes the page while it is open ------------------------ */
  useEffect(() => {
    if (!open) return;
    lockScroll();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      unlockScroll();
    };
  }, [open]);

  const go = (target: string) => {
    setOpen(false);
    // Let the menu unlock the scroll before we ask it to move.
    window.setTimeout(() => scrollTo(`#${target}`, -56), 40);
  };

  return (
    <>
{/*
        The header is fixed and the page beneath it alternates between paper and
        night scenes, so it cannot rely on inheriting contrast from whatever is
        behind it. It carries its own ivory plate with a hairline gold rule -
        the printed letterhead edge - which makes it legible over both.
      */}
      <motion.header
        ref={headerRef}
        initial={false}
        animate={{ y: isInside ? 0 : -80, opacity: isInside ? 1 : 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-hud"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="border-b border-gold-antique/15 bg-ivory/88 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-[var(--gutter)] py-3">
            <button
              type="button"
              onClick={() => go('hero')}
              aria-label="Return to the top"
              className="opacity-80 transition-opacity duration-500 hover:opacity-100"
            >
              <Monogram size="xs" foil="ink" />
            </button>

            {/* --- Desktop: the scene row ---------------------------------- */}
            <nav aria-label="Scenes" className="hidden lg:block">
              <ul className="flex items-center gap-7">
                {config.nav.map((item) => (
                  <li key={item.target}>
                    <button
                      type="button"
                      onClick={() => go(item.target)}
                      aria-current={active === item.target ? 'true' : undefined}
                      className={cn(
                        'label text-[0.5rem] transition-colors duration-500',
                        active === item.target
                          ? 'text-maroon'
                          : 'fg-paper-muted hover:fg-paper-strong',
                      )}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* --- Mobile: one seal ----------------------------------------- */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open the menu"
              aria-expanded={open}
              className="grid size-11 place-items-center rounded-full border border-gold-antique/40 transition-colors duration-500 hover:border-gold-antique/70 lg:hidden"
            >
              <span aria-hidden="true" className="flex flex-col items-center gap-[5px]">
                <span className="block h-px w-4 bg-maroon/70" />
                <span className="block h-px w-4 bg-maroon/70" />
                <span className="block h-px w-4 bg-maroon/70" />
              </span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* --- The full-bleed menu -------------------------------------------- */}
      <AnimatePresence>
        {open ? (
          <motion.div
            key="menu"
            className="fixed inset-0 z-overlay flex flex-col justify-center bg-ink px-[var(--gutter)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(70% 50% at 50% 20%, rgba(232,217,160,0.10), transparent 65%)',
              }}
            />

            <nav aria-label="All scenes" className="relative">
              <ul className="flex flex-col gap-1">
                {ORDER.map((target, index) => {
                  const item = config.nav.find((entry) => entry.target === target);
                  if (!item) return null;
                  return (
                    <motion.li
                      key={target}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.08 + index * 0.045,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => go(target)}
                        className="flex w-full items-baseline gap-5 py-2 text-left"
                      >
                        <span className="label text-[0.5rem] fg-brass-muted">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={cn(
                            'font-display text-fluid-xl font-light',
                            active === target ? 'fg-brass-strong' : 'fg-night-strong',
                          )}
                        >
                          {item.label}
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            <motion.button
              type="button"
              onClick={() => setOpen(false)}
              className="label relative mt-12 self-start fg-night-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Close
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}