'use client';

import { motion } from 'framer-motion';

import { useAudio } from '@/lib/audio';
import { useExperience } from '@/lib/experience';
import { config } from '@/lib/site';

/**
 * ============================================================================
 *  THE MUSIC
 * ============================================================================
 *
 *  A small disc, bottom-left, out of the way until the guest is inside.
 *
 *  It shows real progress: a ring drawn from the audio element's own
 *  `currentTime`, so when a real track is dropped into `music.source` the dial
 *  is honest about where the music is. When no track exists the ring is the
 *  synth ambience's state, and the label says so rather than pretending.
 */

const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AudioPlayer() {
  const { playing, progress, toggle, volume, sourceKind } = useAudio();
  const { isInside } = useExperience();

  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    /*
      The player is a fixed brass plate sitting on the paper of the invitation,
      so it carries its own surface: warm ivory, a hairline antique-gold ring,
      and a shadow that lifts it off the page. The ring doubles as the progress
      arc. Without its own surface it would be invisible the moment the page
      behind it went light.
    */
    <motion.div
      initial={false}
      animate={{ y: isInside ? 0 : 90, opacity: isInside ? 1 : 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: isInside ? 0.8 : 0 }}
      className="fixed z-hud"
      style={{
        left: 'max(1.25rem, env(safe-area-inset-left))',
        bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
      }}
      aria-hidden={!isInside}
    >
      <div className="group flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? 'Pause the music' : 'Play the music'}
          className="relative grid size-14 place-items-center rounded-full border border-gold-antique/35 bg-ivory-soft/92 shadow-[0_14px_34px_-18px_rgb(58_46_36/0.55)] backdrop-blur-sm transition-[border-color,transform] duration-700 ease-silk hover:border-gold-antique/70 active:scale-95"
        >
          {/* Progress ring */}
          <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
            <circle cx="24" cy="24" r={RADIUS} fill="none" stroke="rgb(138 104 40 / 0.22)" strokeWidth="1" />
            <circle
              cx="24"
              cy="24"
              r={RADIUS}
              fill="none"
              stroke="rgb(138 104 40 / 0.9)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-500 ease-out"
            />
          </svg>

          {/* A play triangle, or two bars when it is playing. */}
          <span aria-hidden="true" className="relative flex items-center justify-center">
            {playing ? (
              <span className="flex gap-[3px]">
                <span className="block h-3.5 w-[2px] bg-maroon/75" />
                <span className="block h-3.5 w-[2px] bg-maroon/75" />
              </span>
            ) : (
              <span className="ml-0.5 block h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-maroon/75" />
            )}
          </span>
        </button>

        {/*
          The label only appears on hover or focus. It must never sit permanently
          over the artwork at the foot of a scene.
        */}
        <div className="pointer-events-none hidden flex-col gap-1 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100 md:flex">
          <span className="label text-[0.5rem] fg-paper-muted">{config.music.title}</span>
          <span className="label text-[0.5rem] fg-paper-faint">
            {sourceKind === 'track' ? config.music.subtitle : `Ambience · ${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}