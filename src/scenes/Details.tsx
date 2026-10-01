'use client';

import { MediaFrame } from '@/components/primitives/MediaFrame';
import { SceneHeading } from '@/components/motion/Reveal';
import { config } from '@/lib/site';
import { cn } from '@/lib/cn';

/**
 * ============================================================================
 *  SCENE 09 — DETAILS
 * ============================================================================
 *
 *  The macro chapter. Rings, paper, flowers, lamps, henna, zari — the small
 *  things a guest would otherwise never notice, framed the way a jewellery
 *  campaign frames them: one object per frame, generous air, a single label.
 *
 *  Six items in an asymmetric grid, on ivory paper so the whole scene reads as a
 *  printed lookbook rather than a dark website.
 */

/** The grid deliberately avoids a clean 3-column rhythm. */
const SPANS = [
  'sm:col-span-7 sm:row-span-2',
  'sm:col-span-5',
  'sm:col-span-5',
  'sm:col-span-4',
  'sm:col-span-4',
  'sm:col-span-4',
];

const RATIOS = ['4 / 5', '4 / 3', '4 / 3', '1 / 1', '1 / 1', '1 / 1'];

export function Details() {
  return (
    <section
      id="details"
      data-scene="details"
      className="scene material-ivory scene-pad relative isolate overflow-hidden px-[var(--gutter)]"
      aria-labelledby="details-heading"
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-[clamp(2.5rem,7vh,4.5rem)]">
        <SceneHeading
          label="The Details"
          tone="ivory"
          align="left"
          sub="The objects and the craft, up close."
        >
          <span id="details-heading">{config.details.heading}</span>
        </SceneHeading>

        <div className="grid grid-cols-1 gap-[clamp(1rem,2.5vw,1.75rem)] sm:grid-cols-12">
          {config.details.items.map((item, index) => (
            <figure
              key={item.label}
              className={cn('group relative flex flex-col gap-4', SPANS[index % SPANS.length])}
            >
              <MediaFrame
                src={item.src}
                alt={item.alt}
                art={item.art}
                tone="ivory"
                ratio={RATIOS[index % RATIOS.length]}
                align="center"
                className="w-full border border-gold/30 bg-ivory-soft shadow-[0_30px_70px_-50px_rgba(42,36,28,0.6)] transition-[transform,border-color] duration-1000 ease-silk group-hover:-translate-y-1.5 group-hover:border-gold/60"
                sizes="(max-width: 640px) 92vw, 40vw"
              />
              <figcaption className="flex items-baseline justify-between gap-4">
                <span className="font-display text-fluid-md text-inkwarm/85">{item.label}</span>
                <span className="label text-[0.5rem] text-inkwarm/35">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
