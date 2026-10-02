import type { ReactNode } from 'react';

import Image from 'next/image';

import { ProceduralArt } from '@/components/art/ProceduralArt';
import type { ProceduralArt as ArtKind } from '@/config/wedding.config';
import { cn } from '@/lib/cn';

/**
 * A single photography frame.
 *
 * If the family has supplied a photograph (`src`), it is rendered through
 * next/image — lazy, responsive, AVIF/WebP, and never blocking the first paint.
 * If not, an art-directed composition stands in. The layout is identical either
 * way, so adding photography never requires touching a component.
 */
export interface MediaFrameProps {
  src: string | null;
  alt: string;
  art: ArtKind;
  tone?: 'dark' | 'ivory';
  /** Any CSS aspect-ratio value, e.g. `'3 / 4'`. */
  ratio?: string;
  /** Above-the-fold frames should be eager and high priority. */
  priority?: boolean;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  align?: 'top' | 'center' | 'bottom';
  /**
   * Rendered as a `<figcaption>` inside this frame's `<figure>`.
   *
   * The caption lives here rather than in the caller because a `figcaption` is
   * only valid as a direct child of `figure`. Callers that want a caption pass
   * the node; callers that do not are unaffected.
   */
  caption?: ReactNode;
  /** Extra classes on the caption, so the gallery can style its numbered label. */
  captionClassName?: string;
}

export function MediaFrame({
  src,
  alt,
  art,
  tone = 'dark',
  ratio = '3 / 4',
  priority = false,
  sizes = '(max-width: 768px) 92vw, 46vw',
  className,
  imageClassName,
  align = 'center',
  caption,
  captionClassName,
}: MediaFrameProps) {
  const objectPosition = align === 'top' ? 'center top' : align === 'bottom' ? 'center bottom' : 'center';

  return (
    <figure
      className={cn('relative isolate overflow-hidden bg-emerald-deep', className)}
      style={{ aspectRatio: ratio }}
      data-media={src ? 'photo' : 'art'}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          loading={priority ? undefined : 'lazy'}
          quality={82}
          className={cn(
            'object-cover transition-transform duration-[1600ms] ease-silk will-change-transform',
            imageClassName,
          )}
          style={{ objectPosition }}
        />
      ) : (
        <ProceduralArt art={art} tone={tone} />
      )}

      {/* A hairline inner edge: the frame is part of the object, not the page. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/15"
      />
      {/* Bottom lift, so type set over an image always has contrast. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/55 to-transparent"
      />
      {caption ? <figcaption className={cn('relative', captionClassName)}>{caption}</figcaption> : null}
    </figure>
  );
}
