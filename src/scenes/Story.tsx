'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { MediaFrame } from '@/components/primitives/MediaFrame';
import { SceneHeading } from '@/components/motion/Reveal';
import { config } from '@/lib/site';
import { scroll } from '@/lib/scroll';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * ============================================================================
 *  SCENE 03 — THEIR STORY
 * ============================================================================
 *
 *  Laid out as a magazine, not a timeline. There is no dotted line, no
 *  alternating left/right blocks and no year labels — just four chapters, set
 *  large, with the photography running off the edge of the page.
 *
 *  Two details do the work:
 *
 *    · the frame is pinned while the copy moves past it, so the page feels like
 *      film rather than like a scrolling document
 *    · odd chapters run image-left / copy-right, even chapters reverse, which
 *      creates rhythm without ever repeating a template
 */

export function Story() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || scroll.reduceMotion) return;

    const ctx = gsap.context(() => {
      // Each chapter's image drifts inside its own frame, at a third of the
      // rate of the page — the cheapest honest parallax there is.
      const frames = gsap.utils.toArray<HTMLElement>('[data-story-frame]');
      for (const frame of frames) {
        const inner = frame.querySelector('[data-story-media]');
        if (!inner) continue;
        gsap.fromTo(
          inner,
          { yPercent: -6, scale: 1.12 },
          {
            yPercent: 6,
            scale: 1.12,
            ease: 'none',
            scrollTrigger: {
              trigger: frame,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
            },
          },
        );
      }

      // The chapter numeral, drifting in from the margin.
      for (const numeral of gsap.utils.toArray<HTMLElement>('[data-story-index]')) {
        gsap.fromTo(
          numeral,
          { yPercent: 40, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: numeral, start: 'top 92%', once: true },
            duration: 1.2,
          },
        );
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="story"
      data-scene="story"
      className="scene material-velvet scene-pad relative isolate overflow-hidden px-[var(--gutter)]"
      aria-labelledby="story-heading"
    >
      {/* A single pool of warm light, high and off-centre. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(80% 55% at 22% 12%, rgba(232,217,160,0.10), transparent 62%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-[clamp(4rem,11vh,8rem)]">
        <SceneHeading
          label="Their Story"
          className="mx-auto"
          sub="Four chapters, told quietly."
        >
          <span id="story-heading">Before the celebration</span>
        </SceneHeading>

        {config.story.map((chapter, index) => {
          const flipped = index % 2 === 1;
          return (
            <article
              key={chapter.index}
              className="grid grid-cols-1 items-center gap-[clamp(2rem,5vw,5rem)] md:grid-cols-12"
            >
              {/* --- The frame ------------------------------------------- */}
              <div
                data-story-frame
                className={
                  flipped
                    ? 'md:col-span-7 md:col-start-6'
                    : 'md:col-span-7 md:col-start-1'
                }
              >
                <div className="overflow-hidden">
                  <div data-story-media className="will-change-transform">
                    <MediaFrame
                      src={chapter.src}
                      alt={chapter.alt}
                      art={chapter.art}
                      ratio={flipped ? '4 / 5' : '5 / 4'}
                      sizes="(max-width: 768px) 92vw, 58vw"
                      className="shadow-[0_50px_100px_-60px_rgba(0,0,0,0.9)]"
                    />
                  </div>
                </div>
              </div>

              {/* --- The copy -------------------------------------------- */}
              <div
                className={
                  flipped
                    ? 'flex flex-col gap-5 md:col-span-4 md:col-start-1 md:row-start-1'
                    : 'flex flex-col gap-5 md:col-span-4 md:col-start-9'
                }
              >
                <span
                  data-story-index
                  aria-hidden="true"
                  className="font-display text-fluid-2xl font-light leading-none text-gold/30"
                >
                  {chapter.index}
                </span>

                <p className="label text-gold/70">{chapter.chapter}</p>

                <h3 className="font-display text-fluid-xl font-light leading-[1.1] text-ivory text-balance">
                  {chapter.title}
                </h3>

                <span aria-hidden="true" className="rule w-full max-w-[7rem]">
                  <span>◆</span>
                </span>

                <p className="max-w-[38ch] font-display text-fluid-sm leading-relaxed text-ivory/55">
                  {chapter.body}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
