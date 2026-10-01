'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { ProceduralArt } from '@/components/art/ProceduralArt';
import { RevealText } from '@/components/motion/Reveal';
import { config, site } from '@/lib/site';
import { scroll } from '@/lib/scroll';

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
      className="scene scene-cinema relative isolate flex flex-col items-center justify-center overflow-hidden px-[var(--gutter)] pb-[clamp(5rem,12vh,9rem)] pt-[clamp(6rem,16vh,10rem)] text-center material-cinema"
      aria-labelledby="hero-names"
    >
      {/* --- Far plane: the estate, and the couple within it -------------- */}
      <div ref={backRef} className="pointer-events-none absolute inset-0 -z-20">
        <ProceduralArt art="couple" className="opacity-[0.55]" />
        {/* Golden-hour warmth, sitting over the architecture */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 50% 68%, rgba(255,214,150,0.20) 0%, rgba(18,58,45,0.35) 42%, rgba(8,8,10,0.9) 82%)',
          }}
        />
      </div>

      {/* --- Mid plane: haze --------------------------------------------- */}
      <div ref={midRef} className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-x-[-10%] top-[42%] h-[34vh]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(232,217,160,0.13), transparent 68%)',
            filter: 'blur(24px)',
          }}
        />
      </div>

      {/* --- Near plane: the frame edge ---------------------------------- */}
      <div ref={foreRef} className="pointer-events-none absolute inset-0 -z-10">
        <div className="vignette absolute inset-0" />
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
            className="foil font-display text-fluid-4xl font-light uppercase leading-[0.9] tracking-[0.02em] text-balance"
          >
            {site.namesStacked.groom}
          </RevealText>

          <div className="my-[clamp(0.5rem,1.6vh,1.1rem)] flex items-center gap-4" aria-hidden="true">
            <span className="h-px w-[clamp(2rem,10vw,5rem)] bg-gradient-to-r from-transparent to-gold/50" />
            <span className="font-display text-[clamp(1.1rem,3.4vw,2.2rem)] font-light text-gold/75">
              {config.meta.monogramGlyph}
            </span>
            <span className="h-px w-[clamp(2rem,10vw,5rem)] bg-gradient-to-l from-transparent to-gold/50" />
          </div>

          <RevealText
            as="p"
            immediate
            delay={0.78}
            stagger={0.055}
            className="foil font-display text-fluid-4xl font-light uppercase leading-[0.9] tracking-[0.02em] text-balance"
          >
            {site.namesStacked.bride}
          </RevealText>
        </div>

        {/* The date, embossed rather than printed */}
        <RevealText
          as="p"
          immediate
          delay={1.15}
          stagger={0.1}
          className="mt-[clamp(2.5rem,7vh,4.5rem)] font-display text-fluid-xl font-normal tracking-[0.42em] text-ivory/90"
        >
          {site.dateLabel.toUpperCase()}
        </RevealText>

        <RevealText
          as="p"
          immediate
          delay={1.35}
          stagger={0.08}
          className="label mt-4 text-gold/70"
        >
          {config.location.city} &middot; {config.location.state}
        </RevealText>

        {/* The single line of blessing. Nothing more. */}
        <RevealText
          as="p"
          immediate
          delay={1.6}
          stagger={0.06}
          className="mt-[clamp(2rem,6vh,3.5rem)] max-w-[26ch] font-display text-fluid-md italic leading-relaxed text-ivory/50 text-balance"
        >
          {config.invitation.blessingsLine}
        </RevealText>
      </div>

      {/* --- Scroll cue --------------------------------------------------- */}
      <div
        ref={cueRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
        aria-hidden="true"
      >
        <span className="label text-[0.5rem] text-ivory/25">Scroll</span>
        <span className="relative block h-12 w-px overflow-hidden bg-gold/12">
          <span className="cue-line absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-transparent via-gold/70 to-transparent" />
        </span>
      </div>
    </section>
  );
}
