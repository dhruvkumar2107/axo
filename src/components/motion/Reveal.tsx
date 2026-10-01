'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { cn } from '@/lib/cn';
import { scroll } from '@/lib/scroll';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/**
 * ============================================================================
 *  REVEAL — the single motion vocabulary for the whole site
 * ============================================================================
 *
 *  Every entrance is one of three gestures, and nothing else:
 *
 *    · mask   — type rises out of an invisible mask, line by line
 *    · rise   — elements lift 24px and fade
 *    · wipe   — gold hairlines draw themselves across
 *
 *  That restraint is the point. A luxury site is legible and calm; it is not
 *  busy. Anything that is not one of these three does not animate.
 */

/* ---------------------------------------------------------------------------
   Mask: text rising from behind an invisible edge
   --------------------------------------------------------------------------- */

export interface RevealTextProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Forwarded to the rendered element, for `aria-labelledby` and anchors. */
  id?: string;
  /** Seconds. */
  delay?: number;
  /** Stagger between lines/words. */
  stagger?: number;
  duration?: number;
  /** Start the animation as soon as it mounts, instead of on scroll. */
  immediate?: boolean;
  /** Replay every time it re-enters. Off by default — replays read as tacky. */
  repeat?: boolean;
}

export function RevealText({
  children,
  as: Tag = 'span',
  className,
  id,
  delay = 0,
  stagger = 0.085,
  duration = 1.25,
  immediate = false,
  repeat = false,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const split = new SplitText(el, {
      type: 'lines,words,chars',
      mask: 'lines',
      linesClass: 'reveal-split-line',
      autoSplit: true,
    });

    const targets = split.chars.length ? split.chars : split.words;

    const tween = gsap.from(targets, {
      yPercent: 118,
      opacity: 0,
      duration: scroll.reduceMotion ? 0.001 : duration,
      stagger: scroll.reduceMotion ? 0 : stagger,
      delay: scroll.reduceMotion ? 0 : delay,
      ease: 'power4.out',
      paused: true,
    });

    if (immediate || scroll.reduceMotion) {
      tween.play();
    } else {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: !repeat,
        onEnter: () => tween.play(),
      });
    }

    return () => {
      tween.kill();
      split.revert();
    };
  }, [children, delay, stagger, duration, immediate, repeat]);

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------------------
   Rise: the workhorse for blocks of content
   --------------------------------------------------------------------------- */

export interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  duration?: number;
  /** Pixels lifted. Smaller reads as more refined. */
  distance?: number;
  stagger?: number;
  /** Animate direct children individually instead of the block as one. */
  staggerChildren?: boolean;
  start?: string;
  immediate?: boolean;
}

export function Reveal({
  children,
  as: Tag = 'div',
  className,
  delay = 0,
  duration = 1.1,
  distance = 26,
  stagger = 0.09,
  staggerChildren = false,
  start = 'top 86%',
  immediate = false,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = staggerChildren ? Array.from(el.children) : [el];
    if (targets.length === 0) return;

    const tween = gsap.from(targets, {
      y: scroll.reduceMotion ? 0 : distance,
      opacity: 0,
      duration: scroll.reduceMotion ? 0.001 : duration,
      stagger: scroll.reduceMotion ? 0 : stagger,
      delay: scroll.reduceMotion ? 0 : delay,
      ease: 'power3.out',
      paused: true,
      // Without this, `from` tweens apply their start state immediately and the
      // content is invisible before the trigger fires.
      immediateRender: true,
    });

    if (immediate || scroll.reduceMotion) {
      tween.play();
    } else {
      ScrollTrigger.create({
        trigger: el,
        start,
        once: true,
        onEnter: () => tween.play(),
      });
    }

    return () => {
      tween.kill();
      gsap.set(targets, { clearProps: 'transform,opacity' });
    };
  }, [children, delay, duration, distance, stagger, staggerChildren, start, immediate]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------------------
   Wipe: a gold hairline drawing itself
   --------------------------------------------------------------------------- */

export function GoldHairline({
  className,
  delay = 0,
  duration = 1.6,
  immediate = false,
}: {
  className?: string;
  delay?: number;
  duration?: number;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tween = gsap.fromTo(
      el,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: scroll.reduceMotion ? 0.001 : duration,
        delay: scroll.reduceMotion ? 0 : delay,
        ease: 'expo.out',
        transformOrigin: 'left center',
        paused: true,
      },
    );

    if (immediate || scroll.reduceMotion) {
      tween.play();
    } else {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: () => tween.play(),
      });
    }

    return () => {
      tween.kill();
    };
  }, [delay, duration, immediate]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn('block h-px w-full origin-left bg-gold/45', className)}
    />
  );
}

/* ---------------------------------------------------------------------------
   Scene heading — label, rule, display line
   --------------------------------------------------------------------------- */

export function SceneHeading({
  label,
  children,
  sub,
  tone = 'dark',
  className,
  align = 'center',
}: {
  label?: string;
  children: ReactNode;
  sub?: ReactNode;
  /**
   * `dark`   — heading sits on a cinematic scene; set in ivory.
   * `ivory`  — heading sits on paper; set in warm ink.
   */
  tone?: 'dark' | 'ivory';
  className?: string;
  align?: 'center' | 'left';
}) {
  const fg = tone === 'dark' ? 'text-ivory' : 'text-inkwarm';
  const muted = tone === 'dark' ? 'text-ivory/45' : 'text-inkwarm/55';
  const faint = tone === 'dark' ? 'text-ivory/55' : 'text-inkwarm/65';

  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {label ? (
        <Reveal as="p" className={cn('label', muted)}>
          {label}
        </Reveal>
      ) : null}
      <RevealText
        as="h2"
        className={cn(
          'max-w-[16ch] font-display text-fluid-2xl font-light leading-[1.06] tracking-[0.01em] text-balance',
          fg,
        )}
      >
        {children}
      </RevealText>
      <GoldHairline className={cn('max-w-[9rem]', align === 'center' && 'mx-auto')} />
      {sub ? (
        <Reveal as="p" className={cn('measure mt-1 font-display text-fluid-md italic', faint)}>
          {sub}
        </Reveal>
      ) : null}
    </div>
  );
}
