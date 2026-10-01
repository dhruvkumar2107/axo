'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { MediaFrame } from '@/components/primitives/MediaFrame';
import { SceneHeading } from '@/components/motion/Reveal';
import { config } from '@/lib/site';
import { cn } from '@/lib/cn';

/**
 * ============================================================================
 *  SCENE 08 — GALLERY
 * ============================================================================
 *
 *  A filmstrip, not a grid. Nine frames running off the right edge of the
 *  screen; the guest pulls them across with a finger, a trackpad or the arrow
 *  controls. Photographs run at alternating heights and near-editorial crops so
 *  the strip has rhythm rather than a monotonous baseline.
 *
 *  Implemented with native overflow scrolling and CSS scroll-snap rather than a
 *  pinned GSAP timeline. That choice is deliberate: it is smooth on every
 *  device, it works with keyboards and screen readers, it respects the guest's
 *  own scroll physics, and it never fights Lenis.
 */

/** Varying heights and widths keep the strip from reading as a spreadsheet. */
const CROPS: Array<{ ratio: string; width: string; shift?: string }> = [
  { ratio: '3 / 4', width: 'w-[68vw] sm:w-[34vw] lg:w-[22vw]' },
  { ratio: '4 / 5', width: 'w-[54vw] sm:w-[26vw] lg:w-[17vw]', shift: 'sm:mt-16' },
  { ratio: '1 / 1', width: 'w-[62vw] sm:w-[32vw] lg:w-[20vw]' },
  { ratio: '3 / 4', width: 'w-[70vw] sm:w-[36vw] lg:w-[24vw]', shift: 'sm:mt-8' },
  { ratio: '5 / 4', width: 'w-[80vw] sm:w-[42vw] lg:w-[28vw]', shift: 'sm:mt-20' },
  { ratio: '4 / 5', width: 'w-[56vw] sm:w-[28vw] lg:w-[18vw]' },
  { ratio: '1 / 1', width: 'w-[60vw] sm:w-[30vw] lg:w-[20vw]', shift: 'sm:mt-12' },
  { ratio: '3 / 4', width: 'w-[66vw] sm:w-[34vw] lg:w-[23vw]' },
];

const DEFAULT_CROP: (typeof CROPS)[number] = {
  ratio: '3 / 4',
  width: 'w-[68vw] sm:w-[34vw] lg:w-[22vw]',
};

export function Gallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const read = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    const value = max <= 0 ? 0 : track.scrollLeft / max;
    setProgress(value);
    setAtStart(track.scrollLeft <= 8);
    setAtEnd(max - track.scrollLeft <= 8);
  }, []);

  useEffect(() => {
    read();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      track.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, [read]);

  const nudge = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.72, behavior: 'smooth' });
  }, []);

  return (
    <section
      id="gallery"
      data-scene="gallery"
      className="scene scene-pad relative isolate overflow-hidden bg-ink"
      aria-labelledby="gallery-heading"
    >
      <div className="relative flex flex-col gap-[clamp(2.5rem,7vh,4.5rem)]">
        <div className="mx-auto w-full max-w-6xl px-[var(--gutter)]">
          <SceneHeading
            label="The Gallery"
            sub={config.gallery.subheading}
            className="mx-auto"
          >
            <span id="gallery-heading">{config.gallery.heading}</span>
          </SceneHeading>
        </div>

        {/* --- The strip --------------------------------------------------- */}
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory items-start gap-[clamp(0.75rem,2vw,1.75rem)] overflow-x-auto overflow-y-hidden px-[var(--gutter)] pb-2"
          style={{ touchAction: 'pan-x pan-y' }}
          tabIndex={0}
          role="region"
          aria-label="Gallery, horizontally scrollable"
        >
          {config.gallery.frames.map((frame, index) => {
            const crop = CROPS[index % CROPS.length] ?? DEFAULT_CROP;
            return (
              <figure
                key={`${frame.alt}-${index}`}
                className={cn('group relative shrink-0 snap-center', crop.width, crop.shift)}
              >
                <MediaFrame
                  src={frame.src}
                  alt={frame.alt}
                  art={frame.art}
                  ratio={crop.ratio}
                  tone="dark"
                  align={frame.align}
                  className="w-full border border-gold/10 transition-[transform,border-color] duration-1000 ease-silk group-hover:-translate-y-2 group-hover:border-gold/35"
                  sizes="(max-width: 640px) 70vw, (max-width: 1024px) 36vw, 24vw"
                />
                {frame.caption ? (
                  <figcaption className="label mt-4 text-[0.5rem] text-ivory/40">
                    <span className="mr-2 text-gold/50">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {frame.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}

          {/* A closing note as the last "frame". */}
          <div className="flex h-[50vw] max-h-[28rem] w-[60vw] shrink-0 snap-center items-center sm:h-80 sm:w-[24rem]">
            <p className="measure font-display text-fluid-lg italic leading-relaxed text-ivory/40">
              More to come — a film still being shot.
            </p>
          </div>
        </div>

        {/* --- Controls ---------------------------------------------------- */}
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-[var(--gutter)]">
          <div className="relative h-px flex-1 bg-ivory/12">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 bg-gold/70 transition-[width] duration-200 ease-out"
              style={{ width: `${8 + progress * 92}%` }}
            />
          </div>
          <div className="flex items-center gap-3">
            <ArrowButton direction="left" disabled={atStart} onClick={() => nudge(-1)} />
            <ArrowButton direction="right" disabled={atEnd} onClick={() => nudge(1)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Previous frames' : 'Next frames'}
      className={cn(
        'grid size-11 place-items-center rounded-full border border-gold/25 text-gold-light transition-all duration-500 ease-silk',
        disabled ? 'cursor-not-allowed opacity-25' : 'hover:border-gold/60 hover:bg-gold/5',
      )}
    >
      <span aria-hidden="true" className="font-display text-lg leading-none">
        {direction === 'left' ? '←' : '→'}
      </span>
    </button>
  );
}
