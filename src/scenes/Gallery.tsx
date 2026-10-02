'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MediaFrame } from '@/components/primitives/MediaFrame';
import { GalleryLightbox, type GalleryLightboxItem } from '@/components/ui/GalleryLightbox';
import { SceneHeading } from '@/components/motion/Reveal';
import { config } from '@/lib/site';
import { cn } from '@/lib/cn';

/**
 * ============================================================================
 *  SCENE 08 — GALLERY
 * ============================================================================
 *
 *  Two presentations of the same nine frames, chosen by viewport:
 *
 *    - Below `md`, a horizontal filmstrip. Frames run off the right edge and the
 *      guest pulls them across with a finger. Full-bleed cards on a small
 *      screen are worth more than a ragged grid.
 *    - From `md` up, a masonry album: CSS multi-column, two columns on tablet,
 *      three on desktop. The strip's alternating heights become real staggered
 *      columns, which is what makes the album look composed rather than tiled.
 *
 *  The filmstrip is native overflow scrolling with CSS scroll-snap, not a pinned
 *  timeline. That choice is deliberate: it is smooth on every device, it works
 *  with keyboards and screen readers, it respects the guest's own scroll
 *  physics, and it never fights Lenis.
 *
 *  Every frame opens a lightbox on both layouts, so the album is browsable at
 *  full size without ever leaving the page.
 */

/**
 * Varying heights keep the album from reading as a spreadsheet. `ratio` is the
 * crop used by both layouts, so a frame looks identical in the strip, the
 * masonry column and the lightbox.
 */
const CROPS: Array<{ ratio: string; width: string; shift?: string }> = [
  { ratio: '3 / 4', width: 'w-[68vw] md:w-full' },
  { ratio: '4 / 5', width: 'w-[54vw] md:w-full' },
  { ratio: '1 / 1', width: 'w-[62vw] md:w-full' },
  { ratio: '3 / 4', width: 'w-[70vw] md:w-full' },
  { ratio: '5 / 4', width: 'w-[80vw] md:w-full' },
  { ratio: '4 / 5', width: 'w-[56vw] md:w-full' },
  { ratio: '1 / 1', width: 'w-[60vw] md:w-full' },
  { ratio: '3 / 4', width: 'w-[66vw] md:w-full' },
];

const DEFAULT_CROP: (typeof CROPS)[number] = { ratio: '3 / 4', width: 'w-[68vw] md:w-full' };

export function Gallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLElement | null>(null);

  /** The crop each frame gets, resolved once so all three views agree. */
  const items = useMemo<GalleryLightboxItem[]>(
    () =>
      config.gallery.frames.map((frame, index) => ({
        frame,
        ratio: (CROPS[index % CROPS.length] ?? DEFAULT_CROP).ratio,
      })),
    [],
  );

  /* --- Strip scroll state (mobile only) ---------------------------------- */
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

  const openLightbox = useCallback((index: number, trigger: HTMLElement) => {
    setReturnFocusTo(trigger);
    setLightbox(index);
  }, []);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  return (
    <section
      id="gallery"
      data-scene="gallery"
      className="scene scene-paper paper paper-grain scene-pad relative isolate overflow-hidden"
      aria-labelledby="gallery-heading"
    >
      <div className="relative flex flex-col gap-[clamp(2.5rem,7vh,4.5rem)]">
        <div className="mx-auto w-full max-w-6xl px-[var(--gutter)]">
          <SceneHeading
            label="The Gallery"
            sub={config.gallery.subheading}
            tone="ivory"
            className="mx-auto"
          >
            <span id="gallery-heading">{config.gallery.heading}</span>
          </SceneHeading>
        </div>

        {/* --- Masonry album: tablet and desktop --------------------------- */}
        <div className="hidden px-[var(--gutter)] md:block">
          <div className="mx-auto w-full max-w-6xl [column-fill:_balance] columns-2 gap-[clamp(0.75rem,1.6vw,1.5rem)] lg:columns-3">
            {items.map((item, index) => (
              <GalleryFigure
                key={`${item.frame.alt}-${index}`}
                item={item}
                index={index}
                onOpen={openLightbox}
                sizes="(max-width: 1024px) 45vw, 30vw"
              />
            ))}

            {/* A closing note, laid out like one more frame. */}
            <p className="measure break-inside-avoid pb-2 pt-6 font-display text-fluid-lg italic leading-relaxed fg-paper-muted">
              More to come &mdash; a film still being shot.
            </p>
          </div>
        </div>

        {/* --- Filmstrip: phones -------------------------------------------- */}
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory items-start gap-[clamp(0.75rem,2vw,1.75rem)] overflow-x-auto overflow-y-hidden px-[var(--gutter)] pb-2 md:hidden"
          style={{ touchAction: 'pan-x pan-y' }}
          tabIndex={0}
          role="region"
          aria-label="Gallery, horizontally scrollable"
        >
          {items.map((item, index) => {
            const crop = CROPS[index % CROPS.length] ?? DEFAULT_CROP;
            return (
              <div
                key={`${item.frame.alt}-${index}`}
                className={cn('group relative shrink-0 snap-center', crop.width, crop.shift)}
              >
                <GalleryFigure
                  item={item}
                  index={index}
                  onOpen={openLightbox}
                  sizes="(max-width: 640px) 70vw, 36vw"
                  bare
                />
              </div>
            );
          })}

          <div className="flex h-[50vw] max-h-[28rem] w-[60vw] shrink-0 snap-center items-center">
            <p className="measure font-display text-fluid-lg italic leading-relaxed fg-paper-muted">
              More to come &mdash; a film still being shot.
            </p>
          </div>
        </div>

        {/* --- Controls: strip only ----------------------------------------- */}
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-[var(--gutter)] md:hidden">
          <div className="relative h-px flex-1 bg-gold-antique/20">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 bg-gold-antique/80 transition-[width] duration-200 ease-out"
              style={{ width: `${8 + progress * 92}%` }}
            />
          </div>
          <div className="flex items-center gap-3">
            <ArrowButton direction="left" disabled={atStart} onClick={() => nudge(-1)} />
            <ArrowButton direction="right" disabled={atEnd} onClick={() => nudge(1)} />
          </div>
        </div>
      </div>

      <GalleryLightbox
        items={items}
        index={lightbox}
        onClose={closeLightbox}
        onNavigate={setLightbox}
        returnFocusTo={returnFocusTo}
      />
    </section>
  );
}

/**
 * One frame. `MediaFrame` owns the `<figure>` and its `<figcaption>`, because
 * a `figcaption` is only valid as a direct child of `figure` - wrapping the
 * frame in a second figure here would nest them, which is invalid HTML.
 *
 * The picture is inside a button so opening the lightbox is one discoverable
 * tap on touch and one Enter on a keyboard.
 */
function GalleryFigure({
  item,
  index,
  onOpen,
  sizes,
  bare = false,
}: {
  item: GalleryLightboxItem;
  index: number;
  onOpen: (index: number, trigger: HTMLElement) => void;
  sizes: string;
  /** Inside the filmstrip the caller supplies the sizing element. */
  bare?: boolean;
}) {
  const { frame, ratio } = item;

  const caption = frame.caption ? (
    <>
      <span className="mr-2 text-gold-antique">{String(index + 1).padStart(2, '0')}</span>
      {frame.caption}
    </>
  ) : null;

  return (
    <div className={cn(bare ? 'group' : 'group mb-[clamp(0.75rem,1.6vw,1.5rem)] break-inside-avoid')}>
      <button
        type="button"
        onClick={(event) => onOpen(index, event.currentTarget)}
        className="block w-full cursor-zoom-in text-left"
        aria-label={`Enlarge: ${frame.alt}`}
      >
        <MediaFrame
          src={frame.src}
          alt={frame.alt}
          art={frame.art}
          ratio={ratio}
          align={frame.align}
          sizes={sizes}
          caption={caption}
          captionClassName="label mt-4 text-[0.5rem] fg-paper-muted"
          className={cn(
            'w-full border border-gold-antique/30 transition-[transform,border-color] duration-1000 ease-silk',
            bare ? '' : 'group-hover:-translate-y-1.5 group-hover:border-gold-antique/60',
          )}
        />
      </button>
    </div>
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