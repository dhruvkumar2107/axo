'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { gsap } from 'gsap';

import { scroll } from '@/lib/scroll';
import { afterDelay, once } from '@/lib/frame';
import { QUALITY_BUDGET, type QualityTier } from '@/lib/perf';

/**
 * ============================================================================
 *  THE PALACE — 2.5D fallback
 * ============================================================================
 *
 *  Used when WebGL is unavailable, when the guest has asked for reduced motion,
 *  or when the 3D scene measurably fails to hold frame rate.
 *
 *  This is not a degraded placeholder. It is a deliberately art-directed
 *  sequence built from layered gradients, perspective transforms and parallax:
 *
 *      · a warm interior field that blooms behind the doors
 *      · two leaves of timber, each hinged on its own outer edge
 *      · brass banding and a ring handle catching a specular highlight
 *      · light shafts, dust and petals as composited layers
 *
 *  It runs the identical timeline to the WebGL version, so the guest's
 *  experience is the same in structure — only the technique differs.
 *
 *  Like `PalaceScene`, this component is purely decorative: every piece of copy
 *  and every control belongs to the parent, which is why it is `aria-hidden`.
 */

const OPEN_SECONDS = 5.5;
/** Enough motes to read as air, few enough to stay free on a budget phone. */
const MOTE_COUNT = 22;

export interface PalaceFallbackProps {
  /** The entry sequence moved from 'doors' to 'entering'. */
  opening: boolean;
  /** Fired once the doors have finished swinging. */
  onOpened: () => void;
  /** Called once the first frame is committed. */
  onReady?: () => void;
  tier: QualityTier;
}

export function PalaceFallback({ opening, onOpened, onReady, tier }: PalaceFallbackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shaftRef = useRef<HTMLDivElement>(null);
  const petalsRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);

  const openingRef = useRef(opening);
  const onOpenedRef = useRef(onOpened);
  const onReadyRef = useRef(onReady);

  // Keep the latest props available to the imperative timeline without reading
  // them during render.
  useEffect(() => {
    openingRef.current = opening;
    onOpenedRef.current = onOpened;
    onReadyRef.current = onReady;
  });

  const budget = QUALITY_BUDGET[tier];
  const petalCount = Math.min(14, Math.round(budget.petals / 8));

  /* ======================================================================
     Readiness: report immediately, do not wait for a frame

     This used to fire from `requestAnimationFrame`, which meant that on a
     throttled tab the entrance copy never animated in — it stayed at its
     initial hidden state behind a scene the guest could not dismiss. The
     component has rendered, so it is ready; the animation is decoration.
     ====================================================================== */
  useEffect(() => {
    const id = requestAnimationFrame(() => onReadyRef.current?.());
    // Belt and braces: if no frame ever arrives, still report readiness.
    const bail = afterDelay(() => onReadyRef.current?.(), 400);
    return () => {
      cancelAnimationFrame(id);
      bail();
    };
  }, []);

  /* ======================================================================
     The open — mirrors the WebGL timings exactly
     ====================================================================== */
  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    const ctx = gsap.context(() => {
      if (!opening) return;

      /*
       * `opened` is guarded so the hand-over to the invitation happens exactly
       * once, and is scheduled independently of GSAP's frame-driven ticker.
       */
      const opened = once(() => onOpenedRef.current());

      if (scroll.reduceMotion) {
        // No swing and no parallax: the interior simply brightens, which
        // conveys the same beat without any vestibular cost.
        gsap.to(glowRef.current, { opacity: 1, scale: 1.7, duration: 2.4, ease: 'power2.inOut' });
        gsap.to(shaftRef.current, { opacity: 0.6, duration: 2.4, ease: 'power2.inOut' });
        afterDelay(opened, 2600);
        return;
      }

      gsap
        .timeline({ onComplete: opened })
        .to(left, { rotateY: -88, duration: OPEN_SECONDS, ease: 'power2.inOut' }, 0)
        .to(right, { rotateY: 88, duration: OPEN_SECONDS, ease: 'power2.inOut' }, 0)
        .to(
          glowRef.current,
          { scale: 2.1, opacity: 1, duration: OPEN_SECONDS * 0.8, ease: 'power2.in' },
          0,
        )
        .to(
          shaftRef.current,
          { opacity: 0.85, scaleY: 1.25, duration: OPEN_SECONDS * 0.7, ease: 'power2.out' },
          0.2,
        )
        .to(petalsRef.current, { opacity: 0.9, duration: 2.4, ease: 'sine.out' }, 0.6)
        .to(planeRef.current, { scale: 1.22, duration: OPEN_SECONDS, ease: 'power2.inOut' }, 0);

      // The doors must finish opening even if no frame is ever painted again.
      afterDelay(opened, (OPEN_SECONDS + 0.6) * 1000);
    }, rootRef);

    return () => ctx.revert();
  }, [opening]);

  /* ======================================================================
     Idle: a slow breath on the whole plane, plus a mouse lean on fine pointers
     ====================================================================== */
  useEffect(() => {
    if (scroll.reduceMotion) return;
    const plane = planeRef.current;
    if (!plane) return;

    const ctx = gsap.context(() => {
      gsap.to(plane, {
        scale: 1.045,
        duration: 18,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });
    }, rootRef);

    let onMove: ((event: PointerEvent) => void) | null = null;
    if (window.matchMedia('(pointer: fine)').matches) {
      onMove = (event: PointerEvent) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        // Rotate the outer plane only; the leaves keep their own transforms.
        gsap.to(plane.parentElement, {
          rotateY: nx * 3.2,
          rotateX: -ny * 2.2,
          duration: 1.4,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      };
      window.addEventListener('pointermove', onMove, { passive: true });
    }

    return () => {
      ctx.revert();
      if (onMove) window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden bg-ink"
      aria-hidden="true"
    >
      <div className="vignette absolute inset-0" />

      <div
        className="absolute inset-[-6%] [perspective:1400px] [transform-style:preserve-3d]"
      >
        <div
          ref={planeRef}
          className="relative size-full [transform-style:preserve-3d]"
          style={{ transform: 'rotateX(2deg)' }}
        >
          {/* --- Interior: the light beyond the doors --------------------- */}
          <div
            ref={glowRef}
            className="absolute left-1/2 top-[42%] aspect-square w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 blur-[60px]"
            style={{
              background:
                'radial-gradient(circle, rgba(255,224,164,0.95) 0%, rgba(214,164,74,0.42) 38%, rgba(120,88,28,0.12) 62%, transparent 74%)',
            }}
          />

          {/* --- Light shafts --------------------------------------------- */}
          <div ref={shaftRef} className="absolute inset-0 opacity-25">
            {[
              { left: '18%', skew: -9, delay: '0s' },
              { left: '44%', skew: -4, delay: '0.4s' },
              { left: '68%', skew: 6, delay: '0.8s' },
            ].map((shaft) => (
              <span
                key={shaft.left}
                className="absolute -top-[20%] h-[150%] w-[16vw] min-w-[70px] origin-top"
                style={{
                  left: shaft.left,
                  // The animation owns `transform`, so the skew is passed in as
                  // a custom property and read back by the keyframes.
                  '--skew': `${shaft.skew}deg`,
                  background:
                    'linear-gradient(180deg, rgba(255,232,178,0.30) 0%, rgba(240,206,132,0.10) 46%, transparent 82%)',
                  animation: `shaft-drift 9s ease-in-out ${shaft.delay} infinite alternate`,
                } as CSSProperties}
              />
            ))}
          </div>

          {/* --- Stone surround ------------------------------------------- */}
          <div
            className="absolute inset-y-0 left-0 w-[9%] min-w-[26px]"
            style={{ background: 'linear-gradient(90deg, #14120E 0%, #241F17 40%, #100E0A 100%)' }}
          />
          <div
            className="absolute inset-y-0 right-0 w-[9%] min-w-[26px]"
            style={{ background: 'linear-gradient(270deg, #14120E 0%, #241F17 40%, #100E0A 100%)' }}
          />
          <div
            className="absolute inset-x-0 top-0 h-[14%] min-h-[70px]"
            style={{ background: 'linear-gradient(180deg, #0C0A07 0%, #1E1A13 55%, #0A0907 100%)' }}
          />
          {/* Lintel shadow falling across the top of the doors. */}
          <div
            className="absolute inset-x-[9%] top-[14%] h-[16%]"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.72), transparent)' }}
          />

          {/* --- The two leaves ------------------------------------------- */}
          <div className="absolute inset-[14%_9%] [transform-style:preserve-3d]">
            {/* Hinge on each leaf's outer edge, so both swing inward. */}
            <div
              ref={leftRef}
              className="absolute inset-y-0 left-0 w-1/2 origin-left [transform-style:preserve-3d]"
            >
              <DoorLeaf side="left" />
            </div>
            <div
              ref={rightRef}
              className="absolute inset-y-0 right-0 w-1/2 origin-right [transform-style:preserve-3d]"
            >
              <DoorLeaf side="right" />
            </div>
          </div>

          {/* --- Threshold glow along the floor ---------------------------- */}
          <div
            className="absolute inset-x-[9%] bottom-0 h-[8%]"
            style={{ background: 'linear-gradient(0deg, rgba(255,206,130,0.22), transparent)' }}
          />
        </div>
      </div>

      {/* --- Petals and motes, above the architecture --------------------- */}
      {petalCount > 0 ? (
        <div ref={petalsRef} className="pointer-events-none absolute inset-0 opacity-0">
          {Array.from({ length: petalCount }).map((_, i) => (
            <span
              key={i}
              className="absolute size-[7px] rounded-[50%_50%_50%_0] bg-gold-pale/70"
              style={{
                left: `${(i * 37 + 11) % 100}%`,
                top: '-4%',
                animation: `petal-fall ${9 + (i % 5)}s linear ${i * 0.9}s infinite`,
              }}
            />
          ))}
        </div>
      ) : null}

      {budget.particles > 0 ? (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: MOTE_COUNT }).map((_, i) => (
            <span
              key={i}
              className="absolute size-[2px] rounded-full bg-gold-pale/45"
              style={{
                left: `${(i * 61 + 7) % 100}%`,
                top: `${(i * 43 + 5) % 100}%`,
                animation: `mote-drift ${14 + (i % 6) * 3}s ease-in-out ${i * 0.55}s infinite alternate`,
              }}
            />
          ))}
        </div>
      ) : null}

      <span className="grain-layer" />
    </div>
  );
}

/* --------------------------------------------------------------------------
   One leaf of timber
   -------------------------------------------------------------------------- */

const PANEL_TOPS = [0.32, 0.56, 0.79] as const;

function DoorLeaf({ side }: { side: 'left' | 'right' }) {
  const meetingEdge = side === 'left' ? 'right' : 'left';

  return (
    <div
      className="relative size-full overflow-hidden"
      style={{
        background:
          side === 'left'
            ? 'linear-gradient(100deg, #100B06 0%, #33200F 26%, #241608 55%, #140D06 82%, #0C0805 100%)'
            : 'linear-gradient(80deg, #100B06 0%, #33200F 26%, #241608 55%, #140D06 82%, #0C0805 100%)',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.75), inset 0 0 140px rgba(0,0,0,0.55)',
      }}
    >
      <span
        className="absolute inset-0 opacity-[0.35]"
        style={{
          background:
            'repeating-linear-gradient(92deg, rgba(255,220,170,0.05) 0px, rgba(0,0,0,0.07) 2px, transparent 4px, rgba(255,220,170,0.03) 7px, transparent 11px)',
        }}
      />

      {/* Three carved panels, each with a cusped arch motif. */}
      {PANEL_TOPS.map((top) => (
        <span
          key={top}
          className="absolute inset-x-[7%] h-[21%] rounded-[3px]"
          style={{
            top: `${top * 100}%`,
            transform: 'translateY(-100%)',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.46), rgba(0,0,0,0.24))',
            boxShadow:
              'inset 0 0 0 1px rgba(196,150,88,0.2), inset 0 2px 0 rgba(214,168,96,0.16), inset 0 -2px 0 rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.5)',
          }}
        >
          <span
            className="absolute inset-[18%]"
            style={{
              borderRadius: '50% 50% 4px 4px / 34% 34% 4px 4px',
              boxShadow:
                'inset 0 0 0 1px rgba(206,162,92,0.26), inset 0 2px 0 rgba(224,186,120,0.16), inset 0 -2px 3px rgba(0,0,0,0.7)',
              background: 'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.5), transparent 70%)',
            }}
          />
        </span>
      ))}

      {/* Brass banding across the leaf. */}
      {[0.335, 0.565].map((top) => (
        <span
          key={top}
          className="absolute inset-x-[4%] h-[3px]"
          style={{
            top: `${top * 100}%`,
            background: 'linear-gradient(180deg, rgba(240,206,132,0.5), rgba(122,95,23,0.6))',
          }}
        />
      ))}

      {/* The meeting stile: the dark seam the two leaves almost share. */}
      <span
        className="absolute inset-y-0 w-[4px]"
        style={
          {
            [meetingEdge]: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(122,95,23,0.4), rgba(0,0,0,0.9))',
          } as CSSProperties
        }
      />

      {/* Brass ring handle, offset towards the meeting edge. */}
      <span
        className="absolute top-[44%] h-[13%] w-[9%] min-w-[18px]"
        style={
          {
            [meetingEdge]: '13%',
            transform: 'translateY(-50%)',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 38% 32%, #F0CE84 0%, #A8842B 40%, #4A370E 78%, #100B06 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,236,180,0.5)',
          } as CSSProperties
        }
      />
    </div>
  );
}
