'use client';

import { motion } from 'framer-motion';
import { useCallback } from 'react';

import { scrollTo } from '@/lib/scroll';
import { cn } from '@/lib/cn';

/**
 * ============================================================================
 *  ENTER THE WEDDING — the opening plaque
 * ============================================================================
 *
 *  The one thing a guest must be able to do on the first screen. It is a
 *  gavaksha rather than a button: a shallow domed arch, the shape of a temple
 *  doorway, with a double hairline rule inset from the edge the way a carved
 *  frame sits inside the stone it is cut from.
 *
 *  Everything here is deliberate restraint:
 *
 *    · the dome is shallow, not a horseshoe — a temple, not a horseshoe arch
 *    · the frame is *two* hairlines, not a border, and the inner one is fainter
 *      so the eye reads depth rather than weight
 *    · the type is letterspaced serif small caps, the same display face as the
 *      names above it, so the plaque belongs to the same invitation
 *    · the light that crosses it is the same specular idea as the gold leaf on
 *      the names, travelling the same direction, so it reads as one material
 *
 *  The arrow nudges downward forever, which is the whole point of it: it is the
 *  only motion in the scene, so the eye goes to it, and "down" is the one
 *  gesture it teaches before the guest has touched anything.
 */

/** The scene the plaque leads to. Page order, so it must match `main`. */
const NEXT_SCENE = '#invitation';

export function EnterWedding({ className }: { className?: string }) {
  const advance = useCallback(() => {
    // -56 leaves the next scene's heading clear of the fixed header.
    scrollTo(NEXT_SCENE, -56);
  }, []);

  return (
    <motion.button
      type="button"
      onClick={advance}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 2.05, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        // The tap target is padded well past the drawn frame, so the visible
        // ornament can stay thin while the button stays comfortable to hit.
        'group pointer-events-auto relative inline-flex cursor-pointer items-center justify-center',
        'rounded-t-[3.25rem] rounded-b-md px-7 pb-4 pt-9 sm:px-9',
        // Short viewports: tighten the plaque rather than let it collide with
        // the blessing line, and rather than hide either. The frame loses its
        // internal air; the arch and the arrow stay, and the tap target keeps
        // its 44px floor.
        '[@media(max-height:700px)]:gap-1.5 [@media(max-height:700px)]:pt-6 [@media(max-height:700px)]:pb-2.5',
        // Antique gold on paper: a brushed plate, not a fill. `border-solid` is
        // required, not redundant: the base reset sets `border: 0`, whose
        // `border-style: none` forces the used width to zero.
        'border border-solid border-gold-antique/45 bg-[linear-gradient(170deg,rgb(250_246_237/0.9),rgb(240_229_206/0.78))]',
        'shadow-[0_18px_40px_-26px_rgb(58_46_36/0.6)] backdrop-blur-[2px]',
        'transition-[border-color,box-shadow,transform] duration-700 ease-silk',
        'hover:border-gold-antique/75 hover:shadow-[0_22px_46px_-24px_rgb(58_46_36/0.65)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-antique/70 focus-visible:ring-offset-4 focus-visible:ring-offset-ivory-soft',
        'active:scale-[0.98]',
        className,
      )}
    >
      {/* The inner hairline. Inset rather than bordered, so it sits *inside*
          the stone instead of doubling its edge. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[5px] rounded-t-[2.6rem] rounded-b-[3px] border border-gold-antique/25"
      />

      {/* Two corner lozenges, the way a carved frame is pinned at its joints. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[1.15rem] bottom-[0.7rem] flex justify-between"
      >
        <Lozenge />
        <Lozenge />
      </span>

      {/* The travelling specular. Same idea as the foil on the names, and it
          only runs on hover, so the resting page is still. */}
      <span
        aria-hidden="true"
        className="enter-sweep pointer-events-none absolute inset-y-[6px] left-0 hidden w-1/3 bg-[linear-gradient(90deg,transparent,rgb(255_252_244/0.9),transparent)] group-hover:block"
      />

      <span className="relative z-10 flex flex-col items-center gap-2.5 [@media(max-height:700px)]:gap-1.5">
        <span
          className={cn(
            'font-display text-[0.78rem] font-medium uppercase leading-none tracking-[0.3em] sm:text-[0.86rem]',
            'indent-[0.3em]',
            'fg-paper',
          )}
        >
          Enter the Wedding
        </span>

        {/* A hairline broken by a single diamond: the ornament that says
            "threshold" without drawing an actual door. */}
        <span aria-hidden="true" className="flex items-center gap-2">
          <span className="h-px w-7 bg-gradient-to-r from-transparent to-gold-antique/55 sm:w-9" />
          <span className="size-[3px] rotate-45 bg-gold-antique/70" />
          <span className="h-px w-7 bg-gradient-to-l from-transparent to-gold-antique/55 sm:w-9" />
        </span>

        <DownArrow />
      </span>
    </motion.button>
  );
}

/** A 3px square turned on its corner. Cheaper than a border radius would be. */
function Lozenge() {
  return (
    <span
      aria-hidden="true"
      className="size-[3px] rotate-45 bg-gold-antique/45 transition-colors duration-700 ease-silk group-hover:bg-gold-antique/80"
    />
  );
}

/**
 * The arrow. A drawn shaft with a chevron head rather than a glyph, so it keeps
 * the hairline weight of the frame above it and never renders as a typeface's
 * idea of a down arrow.
 */
function DownArrow() {
  return (
    <span aria-hidden="true" className="enter-arrow relative block h-6 w-6 [@media(max-height:700px)]:h-5 [@media(max-height:700px)]:w-5">
      {/* The shaft, and the trail behind it. */}
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full" fill="none">
        <path
          d="M12 3v13"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-gold-antique/45"
        />
        <path
          d="M12 3v13"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-gold-antique/25"
          strokeDasharray="2 5"
        />
        <path
          d="M6.5 11.5 12 17l5.5-5.5"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gold-antique/75"
        />
      </svg>
    </span>
  );
}