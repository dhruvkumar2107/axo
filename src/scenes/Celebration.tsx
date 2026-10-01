'use client';

import { useState } from 'react';

import { CalendarActions } from '@/components/ui/CalendarActions';
import { SceneHeading } from '@/components/motion/Reveal';
import { config } from '@/lib/site';
import { scroll } from '@/lib/scroll';
import type { WeddingEvent } from '@/config/wedding.config';

/**
 * ============================================================================
 *  SCENE 05 — THE CELEBRATION
 * ============================================================================
 *
 *  Only one function is confirmed: the wedding, on 17 October, in Kanakapura.
 *  Everything else is deliberately absent rather than invented.
 *
 *  The architecture is already in place for the rest. Adding an object to
 *  `config.events` — a Mehendi, a Sangeet, a Reception — gives that function
 *  its own card, its own dress code, its own map link and its own calendar
 *  entry, with no further code.
 *
 *  Fields that have not been confirmed render as a discreet em dash and an
 *  italic "to be announced", never as a guess.
 */

export function Celebration() {
  return (
    <section
      id="celebration"
      data-scene="celebration"
      className="scene material-velvet scene-pad relative isolate overflow-hidden px-[var(--gutter)]"
      aria-labelledby="celebration-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(75% 50% at 78% 18%, rgba(232,217,160,0.09), transparent 62%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-[clamp(3rem,8vh,5.5rem)]">
        <SceneHeading label="The Celebration" className="mx-auto">
          <span id="celebration-heading">One confirmed day</span>
        </SceneHeading>

        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
          {config.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {/*
          A quiet, dignified note about the remaining functions. This is the
          only place the site admits to awaiting information, and it does so
          once, plainly.
        */}
        {config.events.length === 1 ? (
          <p className="measure max-w-[44ch] text-center font-display text-[clamp(0.85rem,3.2vw,1rem)] italic leading-relaxed text-ivory/40">
            Further functions will be added here as each is confirmed.
          </p>
        ) : null}

        <p className="label text-ivory/30">
          {config.location.city} &middot; {config.location.state} &middot; {config.date.month} {config.date.day}
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   One function
   -------------------------------------------------------------------------- */

const TONE_CLASS = {
  ivory: 'material-ivory',
  emerald: 'material-velvet',
  burgundy: '',
} as const;

const TONE_TEXT = {
  ivory: 'text-inkwarm',
  emerald: 'text-ivory',
  burgundy: 'text-ivory',
} as const;

const TONE_MUTED = {
  ivory: 'text-inkwarm/55',
  emerald: 'text-ivory/55',
  burgundy: 'text-ivory/60',
} as const;

function EventCard({ event }: { event: WeddingEvent }) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, active: false });

  const isBurgundy = event.tone === 'burgundy';

  /* A very small 3D tilt. Anything more would read as a novelty. */
  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (scroll.reduceMotion || e.pointerType === 'touch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -py * 3.4, ry: px * 4.2, active: true });
  };

  const reset = () => setTilt({ rx: 0, ry: 0, active: false });

  return (
    <article
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      className={`group relative flex flex-col gap-6 p-[clamp(1.5rem,4vw,2.5rem)] transition-[transform,box-shadow] duration-700 ease-silk ${
        isBurgundy ? 'bg-burgundy/85 text-ivory' : TONE_CLASS[event.tone]
      } ${TONE_TEXT[event.tone]} ${
        event.tone === 'emerald' ? 'edge-gold-soft' : 'shadow-[0_40px_90px_-60px_rgba(0,0,0,0.8)]'
      }`}
      style={{
        transform: tilt.active
          ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
          : undefined,
        transitionProperty: 'transform, box-shadow',
      }}
    >
      {/* Gold edge on every tone */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-[6%] border ${
          isBurgundy || event.tone === 'emerald' ? 'border-gold/25' : 'border-gold/35'
        }`}
      />

      <header className="flex items-baseline justify-between gap-4">
        <p className={`label ${TONE_MUTED[event.tone]}`}>{event.numeral}</p>
        <p
          className={`label ${
            isBurgundy || event.tone === 'emerald' ? 'text-gold/60' : 'text-inkwarm/45'
          }`}
        >
          {event.dateLabel ?? 'To be announced'}
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <h3 className="font-display text-fluid-xl font-light leading-tight">{event.name}</h3>
        <span
          aria-hidden="true"
          className={`block h-px w-full ${
            isBurgundy || event.tone === 'emerald' ? 'bg-gold/25' : 'bg-gold/40'
          }`}
        />
      </div>

      <dl className="flex flex-col gap-4">
        <Detail
          label="When"
          tone={event.tone}
          value={event.dateLabel}
          fallback={`17 ${config.date.month}`}
        />
        <Detail
          label="Time"
          tone={event.tone}
          value={event.timeLabel}
          fallback="To be announced"
        />
        <Detail
          label="Where"
          tone={event.tone}
          value={event.venue ?? event.address}
          fallback={config.location.label}
        />
        <Detail
          label="Dress"
          tone={event.tone}
          value={event.dressCode}
          fallback="To be announced"
        />
      </dl>

      {event.description ? (
        <p className={`font-display text-fluid-sm italic ${TONE_MUTED[event.tone]}`}>
          {event.description}
        </p>
      ) : null}

      <footer className="mt-auto flex flex-col gap-4 pt-2">
        <CalendarActions event={event} compact />

        {/* Padded to a full 44px touch height without changing the type. */}
        <a
          className={`link-gold -my-3 self-start py-3 text-[0.6rem] font-medium uppercase tracking-[0.26em] ${
            isBurgundy || event.tone === 'emerald' ? '' : 'text-inkwarm/80'
          }`}
          href={event.mapUrl ?? config.location.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Explore location
        </a>
      </footer>
    </article>
  );
}

/**
 * One row of the detail list.
 *
 * A missing value prints as an italic note rather than being hidden, because a
 * guest needs to know the detail exists and is simply not settled yet.
 */
function Detail({
  label,
  value,
  fallback,
  tone,
}: {
  label: string;
  value: string | null;
  fallback: string;
  tone: WeddingEvent['tone'];
}) {
  const present = Boolean(value);
  return (
    <div className="flex items-baseline justify-between gap-5">
      <dt
        className={`label shrink-0 ${
          tone === 'ivory' ? 'text-inkwarm/40' : 'text-ivory/35'
        }`}
      >
        {label}
      </dt>
      <dd
        className={`text-right font-display text-[clamp(0.95rem,3.4vw,1.1rem)] ${
          present ? '' : 'italic'
        } ${
          present
            ? tone === 'ivory'
              ? 'text-inkwarm/85'
              : 'text-ivory/85'
            : tone === 'ivory'
              ? 'text-inkwarm/40'
              : 'text-ivory/35'
        }`}
      >
        {value ?? fallback}
      </dd>
    </div>
  );
}
