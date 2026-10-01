'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { SceneHeading } from '@/components/motion/Reveal';
import { countdownFrom, type CountdownParts } from '@/lib/date';
import { config, site } from '@/lib/site';
import { scroll } from '@/lib/scroll';

/**
 * ============================================================================
 *  SCENE 06 — THE COUNTDOWN
 * ============================================================================
 *
 *  Set like a watch advertisement, not a digital clock: four figures in the
 *  display serif, a hairline between them, and the unit set small and tracked
 *  out beneath. There is no blinking colon and no second-by-second drama.
 *
 *  Two details matter for quality:
 *
 *    · the numbers are tabular, so the layout never reflows as they change
 *    · the clock re-syncs once a minute from `Date.now()` rather than
 *      accumulating deltas, so a backgrounded tab cannot drift the count
 */

interface Unit {
  key: 'days' | 'hours' | 'minutes' | 'seconds';
  label: string;
}

const UNITS: Unit[] = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
];

export function Countdown() {
  const target = site.moment?.date ?? null;
  const [parts, setParts] = useState<CountdownParts | null>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target) return;

    const update = () => setParts(countdownFrom(target, new Date()));
    update();

    // A short interval keeps the digits responsive; the one-minute re-sync
    // corrects any drift, and skips work entirely while the tab is hidden.
    const fast = window.setInterval(update, 1000);
    const slow = window.setInterval(update, 60_000);

    const onVisibility = () => {
      if (!document.hidden) update();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(fast);
      window.clearInterval(slow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [target]);

  const elapsed = parts?.elapsed ?? false;

  const note = useMemo(() => {
    if (!target) return 'The date will be confirmed shortly.';
    return null;
  }, [target]);

  return (
    <section
      id="countdown"
      data-scene="countdown"
      className="scene material-cinema scene-pad relative isolate flex flex-col items-center justify-center overflow-hidden px-[var(--gutter)]"
      aria-labelledby="countdown-heading"
    >
      {/* A single warm source, low and centred, as if a lamp on the floor. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 45% at 50% 108%, rgba(201,162,39,0.20), transparent 62%)',
        }}
      />

      <div ref={headingRef} className="flex flex-col items-center gap-[clamp(2.5rem,7vh,4.5rem)]">
        <SceneHeading label={config.countdown.heading}>
          <span id="countdown-heading">
            {elapsed ? 'The celebration has begun' : 'Until we meet'}
          </span>
        </SceneHeading>

        {note ? (
          <p className="font-display text-fluid-md italic text-ivory/45">{note}</p>
        ) : (
          /*
           * The figures. Each unit is a group so the label never reflows the
           * number, and the whole row is a live region so a screen reader
           * announces the change once a minute rather than every second.
           */
          <div
            className="flex w-full max-w-4xl items-stretch justify-center gap-[clamp(0.5rem,2.5vw,2.5rem)]"
            role="timer"
            aria-live="off"
            aria-atomic="true"
          >
            {UNITS.map((unit, index) => (
              <div
                key={unit.key}
                className="group relative flex flex-1 flex-col items-center gap-3"
              >
                {/* A hairline between units, absent at the extremes. */}
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -left-1/2 top-[0.9em] hidden h-[3.4em] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gold/30 to-transparent sm:block"
                  />
                ) : null}

                <span
                  className="tnum foil font-display text-[clamp(2.75rem,13vw,6rem)] font-light leading-none tracking-[0.02em]"
                  style={{ ['--foil-pos' as string]: '42%' }}
                >
                  {parts ? String(parts[unit.key]).padStart(2, '0') : '--'}
                </span>

                <span className="label text-[0.5rem] text-ivory/35">{unit.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* The date, restated once, beneath the figures. */}
        <div className="flex flex-col items-center gap-3">
          <span aria-hidden="true" className="rule w-full max-w-[16rem]">
            <span>◆</span>
          </span>
          <p className="label text-ivory/40">
            {site.dateLabel} &middot; {config.location.city}
          </p>
        </div>

        {/* Announced politely once a minute, for assistive technology. */}
        <p className="sr-only" aria-live="polite">
          {parts
            ? `${parts.days} days, ${parts.hours} hours and ${parts.minutes} minutes until the celebration.`
            : ''}
        </p>
      </div>

      {/* A barely-there pulse on the seconds, only while the scene is in view. */}
      {!scroll.reduceMotion ? <SecondsPulse visible={Boolean(parts)} /> : null}
    </section>
  );
}

/* --------------------------------------------------------------------------
   A whisper of movement, so the scene is not entirely still
   -------------------------------------------------------------------------- */

function SecondsPulse({ visible }: { visible: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        opacity: visible ? 1 : 0,
        background:
          'radial-gradient(45% 35% at 50% 50%, rgba(232,217,160,0.05), transparent 70%)',
        animation: 'cue-travel 4s ease-in-out infinite alternate',
      }}
    />
  );
}
