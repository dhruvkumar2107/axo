'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { MediaFrame } from '@/components/primitives/MediaFrame';
import type { GalleryFrame } from '@/config/wedding.config';
import { lockScroll, unlockScroll } from '@/lib/scroll';
import { cn } from '@/lib/cn';

/**
 * ============================================================================
 *  GALLERY LIGHTBOX
 * ============================================================================
 *
 *  A full-screen viewing of one frame. The brief asked for a lightbox, and the
 *  album had none, so this is it: click any frame to open it, then arrow keys,
 *  swipe or the on-screen arrows to move through the set.
 *
 *  It behaves like a dialog in every way that matters, because a guest who
 *  cannot close it is trapped:
 *
 *    - Escape closes, and so do the close button and a click on the backdrop.
 *    - Focus moves into the dialog on open and returns to the frame that opened
 *      it on close, so keyboard and screen-reader users are never dumped at the
 *      top of the document.
 *    - Tab is cycled inside the dialog.
 *    - The page behind is scroll-locked, matching the mobile menu.
 *
 *  `AnimatePresence` keeps the backdrop out of the DOM when closed so the
 *  gallery underneath stays reachable.
 */

/** A frame paired with the crop Gallery resolved for it, so the two agree. */
export interface GalleryLightboxItem {
  frame: GalleryFrame;
  ratio: string;
}

export interface GalleryLightboxProps {
  items: GalleryLightboxItem[];
  /** Index into `items`, or `null` when the lightbox is closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
  /** The element focus returns to when the lightbox closes. */
  returnFocusTo?: HTMLElement | null;
}

export function GalleryLightbox({
  items,
  index,
  onClose,
  onNavigate,
  returnFocusTo,
}: GalleryLightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);

  const open = index !== null;
  const item = open ? items[index] : undefined;
  const count = items.length;

  /** Move through the album, wrapping at both ends. */
  const step = useCallback(
    (delta: 1 | -1) => {
      if (index === null || count === 0) return;
      onNavigate((index + delta + count) % count);
    },
    [index, count, onNavigate],
  );

  /* --- Lock the page, handle keys, manage focus --------------------------- */
  useEffect(() => {
    if (!open) return;

    lockScroll();
    closeRef.current?.focus();

    const previouslyFocused = returnFocusTo ?? null;

    const onKey = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowRight':
          event.preventDefault();
          step(1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          step(-1);
          break;
        case 'Tab': {
          // Cycle focus so Tab cannot walk out behind the overlay.
          const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          );
          if (!focusable || focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (!first || !last) return;
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      unlockScroll();
      previouslyFocused?.focus();
    };
  }, [open, index, onClose, returnFocusTo, step]);

  if (!open || !item) return null;

  const { frame } = item;
  const hasPrevious = count > 1;
  const position = `${(index ?? 0) + 1} / ${count}`;

  return (
    <AnimatePresence>
      <motion.div
        // The backdrop is a click target, so it needs a name and a role.
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 z-overlay flex items-center justify-center bg-velvet/94 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Gallery frame ${(index ?? 0) + 1} of ${count}: ${frame.alt}`}
          className="relative flex max-h-[100svh] w-full max-w-5xl flex-col items-center gap-5 px-[var(--gutter)] py-[clamp(3rem,8vh,5rem)]"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          onClick={(event) => event.stopPropagation()}
          onTouchStart={(event) => {
            touchX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchX.current;
            touchX.current = null;
            if (start === null) return;
            const end = event.changedTouches[0]?.clientX;
            if (end === undefined) return;
            const delta = end - start;
            // Ignore taps and short drags so a plain tap never skips a frame.
            if (Math.abs(delta) < 48) return;
            step(delta < 0 ? 1 : -1);
          }}
        >
          <MediaFrame
            src={frame.src}
            alt={frame.alt}
            art={frame.art}
            tone="dark"
            // Never taller than the dialog, and capped so a 3:4 frame does not
            // push the caption and controls off screen.
            ratio={item.ratio}
            align={frame.align}
            className="max-h-[68svh] w-auto max-w-full border border-gold/30 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
          />

          <div className="flex w-full flex-col items-center gap-3 text-center">
            {frame.caption ? (
              <p className="measure font-display text-fluid-sm italic leading-relaxed text-ivory/85">
                {frame.caption}
              </p>
            ) : null}
            <p className="label text-[0.5rem] text-ivory/45">{position}</p>
          </div>

          <div className="flex items-center gap-3">
            <ArrowButton direction="left" onClick={() => step(-1)} disabled={!hasPrevious} />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="label border border-gold/25 px-6 py-3 text-[0.5rem] text-ivory/70 transition-colors duration-500 hover:border-gold/50 hover:text-ivory"
            >
              Close
            </button>
            <ArrowButton direction="right" onClick={() => step(1)} disabled={!hasPrevious} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ArrowButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Previous frame' : 'Next frame'}
      className={cn(
        'grid size-11 place-items-center rounded-full border border-gold/30 text-gold-light transition-all duration-500 ease-silk',
        disabled
          ? 'cursor-not-allowed opacity-30'
          : 'hover:border-gold/70 hover:bg-gold/10',
      )}
    >
      <span aria-hidden="true" className="font-display text-lg leading-none">
        {direction === 'left' ? '←' : '→'}
      </span>
    </button>
  );
}