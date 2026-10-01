'use client';

import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { scroll } from '@/lib/scroll';

/**
 * Smooth scrolling, wired into GSAP's ticker so that ScrollTrigger and Lenis
 * advance on the same clock. Without this they drift, and pinned scenes judder.
 *
 * Under `prefers-reduced-motion` we never construct Lenis at all: the browser's
 * native scrolling is used, which is both faster and more accessible.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (scroll.reduceMotion) {
      // Still register the plugin so scenes can use its callbacks safely.
      ScrollTrigger.defaults({ toggleActions: 'play none none none' });
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      // Exponential ease-out — long, calm settle. No linear scrolling.
      easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.7,
      syncTouch: false,
      autoRaf: false,
    });

    scroll.attach(lenis);

    lenis.on('scroll', ScrollTrigger.update);

    const onRaf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onRaf);
    gsap.ticker.lagSmoothing(0);

    // Recalculate once webfonts land, or every pinned scene is a pixel out.
    if (document.fonts?.ready) {
      void document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(onRaf);
      scroll.detach();
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
