'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { SceneHeading } from '@/components/motion/Reveal';
import { CalendarActions } from '@/components/ui/CalendarActions';
import { config, site } from '@/lib/site';
import { scroll } from '@/lib/scroll';

/**
 * ============================================================================
 *  SCENE 04 — SAVE THE DATE
 * ============================================================================
 *
 *  A calendar card in ivory and gold leaf, with the date pressed into it.
 *  Beneath it, a layer of gold leaf the guest can physically scratch away —
 *  the oldest gesture in the language of anticipation, and the reason an
 *  invitation like this is worth opening twice.
 *
 *  The scratch layer is a real canvas: dragging erases it with a soft brush,
 *  progress is measured as the fraction of pixels cleared, and past 55% the
 *  remainder lifts away on its own so the interaction can never trap a guest
 *  mid-scratch. A Skip control is always present, and reduced-motion guests are
 *  shown the revealed date immediately.
 */

type Phase = 'sealed' | 'scratching' | 'revealed';

export function SaveTheDate() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /*
    A guest who has asked their device for less motion is not going to enjoy a
    puzzle. The date is the message; the scratching is decoration. So the seal
    starts already lifted for them, decided before the first paint — there is no
    flash of gold leaf to apologise for afterwards.
  */
  const [phase, setPhase] = useState<Phase>(() =>
    scroll.reduceMotion ? 'revealed' : 'sealed',
  );
  const [progress, setProgress] = useState(0);

  const draggingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  /* ======================================================================
     Paint the gold leaf
     ====================================================================== */
  const paintFoil = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    // Render at device resolution so the brush edge stays crisp on retina.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));

    const w = canvas.width;
    const h = canvas.height;

    // Antique leaf: the same metallic ramp as the `.foil` material, so the
    // scratch-off and the typography are visibly the same gold.
    const ramp = ctx.createLinearGradient(0, 0, w * 0.6, h);
    ramp.addColorStop(0, '#7A5F17');
    ramp.addColorStop(0.18, '#A8842B');
    ramp.addColorStop(0.34, '#E8D9A0');
    ramp.addColorStop(0.44, '#F0E6C8');
    ramp.addColorStop(0.56, '#C9A227');
    ramp.addColorStop(0.74, '#A8842B');
    ramp.addColorStop(1, '#6B5114');

    ctx.fillStyle = ramp;
    ctx.fillRect(0, 0, w, h);

    // A specular band, as on real leaf.
    const sheen = ctx.createLinearGradient(w * 0.1, 0, w * 0.45, h);
    sheen.addColorStop(0, 'rgba(255,252,236,0)');
    sheen.addColorStop(0.42, 'rgba(255,252,236,0.42)');
    sheen.addColorStop(0.55, 'rgba(255,252,236,0.05)');
    sheen.addColorStop(1, 'rgba(255,252,236,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);

    // Grain, so the leaf is not glassy.
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 900; i += 1) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? '#FFF6D6' : '#4A370E';
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;

    // A whisper of the monogram, debossed into the leaf.
    // Canvas cannot read `var(--font-cormorant)` — the font shorthand is
    // validated by the browser and a custom property is simply invalid, which
    // leaves the context on its 10px default. Resolve the family for real.
    const displayFace =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--font-cormorant')
        .trim() || 'serif';
    ctx.fillStyle = 'rgba(74,55,14,0.30)';
    ctx.font = `500 ${Math.round(h * 0.16)}px ${displayFace}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.meta.monogram, w / 2, h / 2);
  }, []);

  /*
    The scene is mounted while the invitation is still hidden behind the entry
    sequence, so the first honest measurement of this canvas can legitimately be
    0×0 — and a 1×1 canvas accepts no scratching at all. Watch the box and paint
    the leaf as soon as it has a real size.

    `paintedAt` guards the repaint so that resizing never wipes a guest's
    halfway scratch, and so the effect can stay mounted across the whole gesture.
  */
  const paintedAt = useRef('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const paintWhenSized = () => {
      if (scroll.reduceMotion) return;

      const { width, height } = canvas.getBoundingClientRect();
      if (width < 1 || height < 1) return;

      const size = `${Math.round(width)}x${Math.round(height)}`;
      if (paintedAt.current === size) return;
      paintedAt.current = size;

      paintFoil();
    };

    paintWhenSized();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(paintWhenSized);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [paintFoil]);

  /* ======================================================================
     Measure how much has been cleared
     ====================================================================== */
  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 0;

    // Sample a grid rather than reading every pixel: fast, and accurate enough.
    const { width, height } = canvas;
    const step = Math.max(4, Math.floor(Math.min(width, height) / 40));
    const { data } = ctx.getImageData(0, 0, width, height);
    let cleared = 0;
    let total = 0;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        total += 1;
        // Alpha 0 where the guest has scratched.
        if ((data[(y * width + x) * 4 + 3] ?? 0) < 24) cleared += 1;
      }
    }
    return total === 0 ? 0 : cleared / total;
  }, []);

  /* ======================================================================
     The gesture
     ====================================================================== */
  const eraseAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = canvas.width / rect.width;
      const x = (clientX - rect.left) * dpr;
      const y = (clientY - rect.top) * dpr;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 58 * dpr;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.01, y + 0.01);
      ctx.stroke();
      ctx.restore();

      lastPointRef.current = { x: clientX, y: clientY };
    },
    [],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (phase === 'revealed') return;
    draggingRef.current = true;
    setPhase('scratching');
    event.currentTarget.setPointerCapture(event.pointerId);
    eraseAt(event.clientX, event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current || phase === 'revealed') return;
    const last = lastPointRef.current;
    if (last) {
      // Interpolate along the drag so fast swipes do not leave gaps.
      const steps = Math.max(1, Math.round(Math.hypot(event.clientX - last.x, event.clientY - last.y) / 10));
      for (let i = 1; i <= steps; i += 1) {
        eraseAt(last.x + ((event.clientX - last.x) * i) / steps, last.y + ((event.clientY - last.y) * i) / steps);
      }
    }
    eraseAt(event.clientX, event.clientY);

    const cleared = measure();
    setProgress(cleared);
    if (cleared > 0.55) setPhase('revealed');
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = false;
    lastPointRef.current = null;
    if (phase !== 'revealed') {
      const cleared = measure();
      setProgress(cleared);
      if (cleared > 0.55) setPhase('revealed');
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  /** Reveal without scratching — always available, always visible. */
  const reveal = useCallback(() => {
    setProgress(1);
    setPhase('revealed');
  }, []);

  const revealed = phase === 'revealed';

  return (
    <section
      id="save-the-date"
      data-scene="save-the-date"
      className="scene scene-paper paper paper-grain scene-pad relative isolate flex flex-col items-center justify-center overflow-hidden px-[var(--gutter)]"
      aria-labelledby="save-the-date-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(70% 50% at 50% 42%, rgb(232 217 178 / 0.5), transparent 65%)',
        }}
      />

      <SceneHeading label="Save the date" tone="ivory" className="mx-auto">
        <span id="save-the-date-heading">The seventeenth of October</span>
      </SceneHeading>

      {/* --- The card --------------------------------------------------- */}
      <div className="mt-[clamp(3rem,8vh,5rem)] w-full max-w-[min(92vw,30rem)]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-12%' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-[3/4] w-full sm:aspect-[4/3]"
        >
          {/* The card itself: ivory, gold-edged, with the date pressed in. */}
          <div className="material-ivory absolute inset-0 flex flex-col items-center justify-between overflow-hidden px-[9%] py-[9%] shadow-[0_50px_110px_-60px_rgba(0,0,0,0.95)]">
            <span aria-hidden="true" className="pointer-events-none absolute inset-[3%] border border-gold-antique/45" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-[4.4%] border border-gold-antique/20" />

            <p className="label fg-paper-muted">Save the date</p>

            {/* The date, embossed into the paper */}
            <div className="flex flex-col items-center gap-1">
              <p className="foil-ink font-display text-[clamp(5rem,26vw,10rem)] font-light leading-[0.8] tracking-[0.02em]">
                {config.date.day}
              </p>
              <p className="font-display text-[clamp(1.1rem,5vw,1.9rem)] font-light uppercase tracking-[0.44em] text-maroon">
                {config.date.month}
              </p>
              <p className="label mt-2 fg-paper-muted">{config.location.city}</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span aria-hidden="true" className="rule w-full max-w-[12rem]">
                <span>◆</span>
              </span>
              <p className="font-display text-[clamp(0.8rem,3vw,0.95rem)] italic fg-paper-muted">
                {site.names}
              </p>
            </div>
          </div>

          {/* --- The gold leaf the guest scratches away -------------------- */}
          {/*
            The canvas sits exactly over the date and carries the accessible
            affordance: it is a real button, so keyboard and screen-reader users
            can reveal the date without a pointer.
          */}
          <motion.button
            type="button"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={(event) => {
              // A plain click (no drag) is a request to reveal.
              if (progress < 0.12) reveal();
              else event.preventDefault();
            }}
            aria-label="Scratch away the gold leaf to reveal the date"
            className="absolute inset-[3%] cursor-crosshair touch-none overflow-hidden rounded-[1px] disabled:cursor-default"
            style={{ touchAction: 'none' }}
            animate={revealed ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            disabled={revealed}
          >
            <canvas ref={canvasRef} className="size-full" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(74,55,14,0.45),inset_0_1px_0_rgba(255,246,214,0.5)]"
            />
            {!revealed ? (
              <span
                aria-hidden="true"
                className="label pointer-events-none absolute inset-x-0 bottom-[14%] text-center text-[0.5rem] text-[#2E0A13]/70"
                style={{ textShadow: '0 1px 0 rgba(255,246,214,0.35)' }}
              >
                Scratch to reveal
              </span>
            ) : null}
          </motion.button>
        </motion.div>

        {/* --- Controls --------------------------------------------------- */}
        <div className="mt-8 flex flex-col items-center gap-5">
          <CalendarActions />

          {!revealed ? (
            /* Padded to a full 44px touch height without changing the type. */
            <button type="button" className="link-gold label -my-3 py-3" onClick={reveal}>
              Reveal without scratching
            </button>
          ) : (
            <p className="label fg-paper-faint" aria-live="polite">
              {config.date.day} {config.date.month} &middot; {config.location.label}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
