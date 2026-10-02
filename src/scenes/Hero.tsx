'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { ProceduralArt } from '@/components/art/ProceduralArt';
import {
  HangingJasmine,
  TempleFrame,
  TempleHorizon,
} from '@/components/art/Manapam';
import { RevealText } from '@/components/motion/Reveal';
import { EnterWedding } from '@/components/hud/EnterWedding';
import { config, site } from '@/lib/site';
import { scroll, scrollTo } from '@/lib/scroll';

/**
 * ============================================================================
 *  SCENE 01 — THE ESTATE AT TWILIGHT
 * ============================================================================
 *
 *  The first thing a guest sees once the doors are behind them. It behaves like
 *  a title card from a fashion campaign rather than a website header:
 *
 *    · a deep, layered background that parallaxes slower than the type
 *    · the couple's names in antique gold leaf, set as large as the viewport
 *      allows, with a specular band that travels across the foil as the guest
 *      scrolls
 *    · the date, the place, and a single line of blessing beneath
 *
 *  The gold is never a flat gradient: it is the `.foil` material, which layers
 *  a metallic ramp, a moving highlight and a paper grain, and is embossed into
 *  the page with a shadow above and a shadow below.
 */

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const foilRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const foreRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  /**
   * The opening screen used to be a wall: the names, the date and a 12px
   * hairline that most guests never noticed. One deliberate gesture should be
   * enough to move on, whether it arrives as a click, a wheel notch or an
   * upward swipe.
   *
   * This is a *hint*, not a scroll trap, so it is deliberately bounded:
   *
   *   · it only arms while the opening is genuinely the page's current view
   *     (`scrollY <= 4`), so it can never fight scrolling anywhere else
   *   · it only reacts to downward or upward intent, so scrollback is untouched
   *   · it disarms and detaches after the first gesture that carries the guest
   *     onward, or as soon as they scroll away by any other means
   *
   * Everything after that is ordinary scrolling, which is the point.
   */
  useEffect(() => {
    let touchY: number | null = null;
    let touchScrollY: number | null = null;

    function advance() {
      detach();
      // -56 keeps the next scene's heading clear of the fixed header.
      scrollTo('#invitation', -56);
    }

    // Non-passive: the native scroll has to be suppressed, or the wheel notch
    // and the animation fight each other and the guest lands in the wrong
    // place.
    function onWheel(event: WheelEvent) {
      if (window.scrollY > 4) {
        detach();
        return;
      }
      if (event.deltaY <= 0) return;
      event.preventDefault();
      advance();
    }

    function onTouchStart(event: TouchEvent) {
      touchY = event.touches[0]?.clientY ?? null;
      // Recorded here, not at touchend: by the time the finger lifts, the
      // browser has already carried the native scroll past the top, and the
      // gesture would never look like it began on the opening screen.
      touchScrollY = window.scrollY;
    }

    function onTouchEnd(event: TouchEvent) {
      const start = touchY;
      const end = event.changedTouches[0]?.clientY;
      const from = touchScrollY;
      touchY = null;
      touchScrollY = null;
      if (start == null || end == null || from == null) return;
      // Upward swipe, far enough to read as intent rather than rubber-banding.
      if (start - end > 48 && from <= 4) advance();
    }

    function detach() {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return detach;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || scroll.reduceMotion) return;

    const ctx = gsap.context(() => {
      // The specular band crossing the gold leaf as the guest scrolls.
      gsap.fromTo(
        foilRef.current,
        { '--foil-pos': '14%' },
        {
          '--foil-pos': '86%',
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        },
      );

      // Three planes at different depths. The travel between them is small —
      // enough to read as depth, not enough to look like a parallax toy.
      const layers: Array<[HTMLElement | null, number]> = [
        [backRef.current, 7],
        [midRef.current, -4],
        [foreRef.current, 13],
      ];

      for (const [node, travel] of layers) {
        if (!node) continue;
        gsap.fromTo(
          node,
          { yPercent: 0 },
          {
            yPercent: travel,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.5,
            },
          },
        );
      }

      // The names drift up and recede as the hero leaves, handing the page
      // over to the next scene rather than simply scrolling past.
      if (typeRef.current) {
        gsap.to(typeRef.current, {
          yPercent: -20,
          opacity: 0.12,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'center top',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
      }

      // The scroll cue retires as soon as the guest moves.
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: '+=200',
        onEnter: () => gsap.to(cueRef.current, { autoAlpha: 0, duration: 0.6 }),
        onLeaveBack: () => gsap.to(cueRef.current, { autoAlpha: 1, duration: 0.6 }),
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="hero"
      data-scene="hero"
      className="scene scene-paper paper paper-grain relative isolate flex h-[100svh] flex-col items-center justify-center overflow-hidden px-[var(--gutter)] pb-[clamp(8.5rem,17svh,11rem)] pt-[clamp(3rem,8svh,7rem)] text-center supports-[height:100dvh]:h-[100dvh]"
      aria-labelledby="hero-names"
    >
      {/* --- Far plane: the estate, and the couple within it -------------- */}
      <div ref={backRef} className="pointer-events-none absolute inset-0 -z-20">
        <ProceduralArt art="couple" className="opacity-25" />
        {/* Turmeric warmth over the architecture, kept light enough that the
            names can sit on top of it without a scrim. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 30%, rgb(232 217 178 / 0.5) 0%, rgb(246 238 224 / 0.86) 46%, rgb(250 246 237 / 0.97) 82%)',
          }}
        />
      </div>

      {/* --- Mid plane: the mandapam, and its parallax ---------------------
          The arch and pillars sit between the backdrop and the names. They are
          sized from the section, not scaled to fit, so they read as structure
          rather than as a sticker. Three planes move at different rates, which
          is what makes the arch read as *in front of* the backdrop. */}
      <div ref={midRef} className="pointer-events-none absolute inset-0 -z-10">
        <TempleFrame className="opacity-90" />
        <HangingJasmine count={3} />
      </div>

      {/* --- Near plane: the frame edge ------------------------------------ */}
      <div ref={foreRef} className="pointer-events-none absolute inset-0 -z-10">
        <TempleHorizon opacity={0.1} />
      </div>

      {/* --- Type --------------------------------------------------------- */}
      <div ref={typeRef} className="relative z-10 flex w-full flex-col items-center">
        {/*
          The couple's names. `data-foil` is the element that receives the
          travelling specular band, so the light crosses the letterforms rather
          than sliding across a flat rectangle of colour.
        */}
        <div ref={foilRef} data-foil className="flex flex-col items-center">
          <RevealText
            as="h1"
            id="hero-names"
            immediate
            delay={0.5}
            stagger={0.055}
            className="foil-ink font-display text-fluid-4xl font-light uppercase leading-[0.9] tracking-[0.02em] text-balance"
          >
            {site.namesStacked.bride}
          </RevealText>
          <p className="label mt-2 fg-paper-muted">{config.meta.brideCredentials}</p>

          <div className="my-[clamp(0.5rem,1.6vh,1.1rem)] flex items-center gap-4" aria-hidden="true">
            <span className="h-px w-[clamp(2rem,10vw,5rem)] bg-gradient-to-r from-transparent to-gold-antique/50" />
            <span className="font-display text-[clamp(1.1rem,3.4vw,2.2rem)] font-light text-gold-antique">
              {config.meta.monogramGlyph}
            </span>
            <span className="h-px w-[clamp(2rem,10vw,5rem)] bg-gradient-to-l from-transparent to-gold-antique/50" />
          </div>

          <RevealText
            as="p"
            immediate
            delay={0.78}
            stagger={0.055}
            className="foil-ink font-display text-fluid-4xl font-light uppercase leading-[0.9] tracking-[0.02em] text-balance"
          >
            {site.namesStacked.groom}
          </RevealText>
          <p className="label mt-2 fg-paper-muted">{config.meta.groomCredentials}</p>
        </div>

        {/* The date, set in the maroon of the silk border. */}
        <RevealText
          as="p"
          immediate
          delay={1.15}
          stagger={0.1}
          className="mt-[clamp(1.5rem,5svh,4rem)] font-display text-fluid-xl font-normal tracking-[0.42em] text-maroon"
        >
          {site.dateLabel.toUpperCase()}
        </RevealText>

        <RevealText
          as="p"
          immediate
          delay={1.35}
          stagger={0.08}
          className="label mt-4 fg-paper-muted"
        >
          {config.location.city} &middot; {config.location.state}
        </RevealText>

        {/* The single line of blessing. Nothing more. */}
        <RevealText
          as="p"
          immediate
          delay={1.6}
          stagger={0.06}
          className="mt-[clamp(1rem,4svh,3rem)] max-w-[26ch] font-display text-fluid-md italic leading-relaxed fg-paper-muted text-balance"
        >
          {config.invitation.blessingsLine}
        </RevealText>
      </div>

      {/* --- The way on ---------------------------------------------------
          Absolutely placed so it sits below the names without pushing them up
          the screen, and given a generous inset from the bottom edge: on a
          short phone this is the one thing a guest must be able to see and
          reach without scrolling first. */}
      <div
        ref={cueRef}
        className="absolute inset-x-0 bottom-0 flex justify-center px-[var(--gutter)] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <EnterWedding className="pointer-events-auto" />
      </div>
    </section>
  );
}
