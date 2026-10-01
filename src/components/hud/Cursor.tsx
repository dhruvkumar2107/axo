'use client';

import { useEffect, useRef, useState } from 'react';

import { useExperience } from '@/lib/experience';
import { scroll } from '@/lib/scroll';

/**
 * ============================================================================
 *  THE CURSOR
 * ============================================================================
 *
 *  A small gold dot that trails the pointer and grows over anything clickable.
 *
 *  Three rules it obeys, without which this kind of flourish becomes an
 *  accessibility problem:
 *
 *    · it never appears for touch, where there is no pointer to follow
 *    · it never appears when the guest has asked for reduced motion
 *    · the native cursor is left exactly where it was — this is an addition,
 *      not a replacement
 */

/** Anything interactive. `closest` walks up, so wrappers are handled too. */
const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"]';

export function Cursor() {
  const { isInside } = useExperience();
  const dotRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);

  /* --- Only on a device that genuinely has a fine pointer ---------------- */
  useEffect(() => {
    if (scroll.reduceMotion) return;
    const fine = window.matchMedia('(pointer: fine)');
    const apply = () => setEnabled(fine.matches);
    apply();
    fine.addEventListener('change', apply);
    return () => fine.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // The dot follows instantly; the ring lags. Two transforms, no library.
    let raf = 0;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { ...target };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      target.x = event.clientX;
      target.y = event.clientY;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      }

      const interactive = (event.target as Element | null)?.closest(INTERACTIVE);
      setActive(Boolean(interactive));

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function follow() {
        ring.x += (target.x - ring.x) * 0.16;
        ring.y += (target.y - ring.y) * 0.16;
        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
        }
        raf = requestAnimationFrame(follow);
      });
    };

    const onLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };
    const onEnter = () => {
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('pointerenter', onEnter);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('pointerenter', onEnter);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-cursor" style={{ opacity: isInside ? 1 : 0, transition: 'opacity 900ms var(--ease-silk)' }}>
      <span
        ref={ringRef}
        className="absolute left-0 top-0 block rounded-full border border-gold/60 transition-[width,height,opacity,border-color] duration-500 ease-silk"
        style={{ width: active ? 44 : 28, height: active ? 44 : 28, opacity: 0 }}
      />
      <span
        ref={dotRef}
        className="absolute left-0 top-0 block size-1 rounded-full bg-gold-pale transition-opacity duration-500"
        style={{ opacity: 0 }}
      />
    </div>
  );
}