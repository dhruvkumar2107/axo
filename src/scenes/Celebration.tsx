'use client';

import { useState } from 'react';

import { CalendarActions } from '@/components/ui/CalendarActions';
import { SceneHeading } from '@/components/motion/Reveal';
import {
  CardFrame,
  CornerLamp,
  KolamDivider,
  LampPair,
  LeafCorner,
  LotusDivider,
  TempleHorizon,
} from '@/components/art/Manapam';
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
 *  Two presentations of the same data:
 *
 *    · the cards — printed invitation cards, cream stock, hairline gold frame,
 *      a banana leaf tucked into the corner, one per function
 *    · the spine — a vertical ceremonial timeline, drawn only once there are
 *      actually two or more functions to place on it
 *
 *  Fields that have not been confirmed render as an italic "to be announced",
 *  never as a guess.
 */

export function Celebration() {
  return (
    <section
      id="celebration"
      data-scene="celebration"
      className="scene scene-paper paper paper-grain scene-pad relative isolate overflow-hidden px-[var(--gutter)]"
      aria-labelledby="celebration-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(75% 50% at 78% 12%, rgb(232 217 178 / 0.45), transparent 62%)',
        }}
      />
      <TempleHorizon opacity={0.07} />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-[clamp(3rem,8vh,5.5rem)]">
        <SceneHeading label="The Celebration" tone="ivory" className="mx-auto">
          <span id="celebration-heading">One confirmed day</span>
        </SceneHeading>

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 md:gap-7">
          {config.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {/* The ceremonial spine. With a single confirmed function there is
            nothing to place on it, so it is not drawn at all. */}
        {config.events.length > 1 ? <CeremonySpine events={config.events} /> : null}

        {/*
          A quiet, dignified note about the remaining functions. This is the
          only place the site admits to awaiting information, and it does so
          once, plainly.
        */}
        {config.events.length === 1 ? (
          <p className="measure max-w-[44ch] text-center font-display text-[clamp(0.85rem,3.2vw,1rem)] italic leading-relaxed fg-paper-muted">
            Further functions will be added here as each is confirmed.
          </p>
        ) : null}

        <LampPair className="w-full max-w-[16rem] opacity-70" />

        <p className="label fg-paper-muted">
          {config.location.city} &middot; {config.location.state} &middot; {config.date.month} {config.date.day}
        </p>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   One function, as a printed invitation card
   --------------------------------------------------------------------------
   Every card is the same cream stock. Traditional invitation cards are not
   colour-coded by function; they are identical objects in a stack, and the
   difference between them is in the lettering and the rule work. Colour-coding
   them would be the single most modern-looking thing on the page, so the tone
   on the event is used for the audio ambience only.
   -------------------------------------------------------------------------- */

function EventCard({ event }: { event: WeddingEvent }) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, active: false });

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
    <CardFrame
      className="flex flex-col gap-6 p-[clamp(1.75rem,4vw,2.75rem)] pt-[clamp(2.25rem,4vw,3.25rem)] transition-[transform] duration-700 ease-silk"
      leaf={false}
    >
      <article
        onPointerMove={onPointerMove}
        onPointerLeave={reset}
        className="relative flex flex-col gap-6"
        style={{
          transform: tilt.active
            ? `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
            : undefined,
        }}
      >
        {/* A leaf tucked under the frame's top edge, not inside the text block. */}
        <LeafCorner className="-top-2 left-3 w-[4.5rem] opacity-80" />

        {/* Brass pin in the top corner: the small metal stud on a real card. */}
        <CornerLamp className="absolute -top-1 right-1 w-[1.5rem]" />

        <header className="flex items-baseline justify-between gap-4">
          <p className="label fg-paper-muted">{event.numeral}</p>
          <p className="label fg-paper-faint">{event.dateLabel ?? 'To be announced'}</p>
        </header>

        <div className="flex flex-col gap-3">
          <h3 className="font-display text-fluid-xl font-light leading-tight text-maroon text-balance">
            {event.name}
          </h3>
          <LotusDivider className="w-[8.5rem]" />
        </div>

        <dl className="flex flex-col gap-4">
          <Detail label="When" value={event.dateLabel} fallback={`17 ${config.date.month}`} />
          <Detail label="Time" value={event.timeLabel} fallback="To be announced" />
          <Detail
            label="Where"
            value={event.venue ?? event.address}
            fallback={config.location.label}
          />
          <Detail label="Dress" value={event.dressCode} fallback="To be announced" />
        </dl>

        {event.description ? (
          <p className="font-display text-fluid-sm italic fg-paper-muted">{event.description}</p>
        ) : null}

        <footer className="mt-auto flex flex-col gap-4 pt-2">
          <CalendarActions event={event} compact />

          {/* Padded to a full 44px touch height without changing the type. */}
          <a
            className="link-gold -my-3 self-start py-3 text-[0.6rem] font-medium uppercase tracking-[0.26em] text-maroon"
            href={event.mapUrl ?? config.location.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore location
          </a>
        </footer>
      </article>
    </CardFrame>
  );
}

/* --------------------------------------------------------------------------
   The ceremonial spine
   --------------------------------------------------------------------------
   A single vertical rule with one lit lamp per function, read top to bottom in
   the order the day happens. Traditional in layout, quiet in execution: the
   spine is a hairline and the type stays the same size as the cards, so the
   timeline never turns the page into a wedding programme.
   -------------------------------------------------------------------------- */

function CeremonySpine({ events }: { events: WeddingEvent[] }) {
  return (
    <div className="relative mt-[clamp(1.5rem,4vh,2.5rem)] w-full max-w-2xl">
      <SceneHeading label="The order of the day" tone="ivory" align="left" className="mb-10">
        <span className="text-[0.9em]">In sequence</span>
      </SceneHeading>

      <ol className="relative flex flex-col gap-12 border-l border-gold-antique/30 pl-[clamp(1.75rem,5vw,3rem)]">
        {events.map((event, i) => (
          <li key={event.id} className="relative">
            {/* The lamp on the spine. Sits on the rule, not beside it. */}
            <span
              aria-hidden="true"
              className="absolute -left-[clamp(2.35rem,6vw,3.85rem)] top-0 flex size-7 -translate-y-[0.1rem] items-center justify-center rounded-full border border-gold-antique/40 bg-ivory-soft"
            >
              <span className="block size-2 rounded-full bg-turmeric" />
            </span>

            <div className="flex flex-col gap-2">
              <p className="label fg-paper-faint">
                {event.dateLabel ?? 'To be announced'}
                {i === 0 ? ' · begins the day' : ''}
              </p>
              <h3 className="font-display text-fluid-lg font-light leading-tight text-maroon">
                {event.name}
              </h3>
              <p className="max-w-[42ch] font-display text-fluid-sm italic leading-relaxed fg-paper-muted">
                {event.description ??
                  event.venue ??
                  config.location.label}
              </p>
              {event.dressCode ? (
                <p className="label fg-paper-faint">Dress &middot; {event.dressCode}</p>
              ) : null}
            </div>

            {i < events.length - 1 ? <KolamDivider className="mt-8 w-8 opacity-40" /> : null}
          </li>
        ))}
      </ol>
    </div>
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
}: {
  label: string;
  value: string | null;
  fallback: string;
}) {
  const present = Boolean(value);
  return (
    <div className="flex items-baseline justify-between gap-5">
      <dt className="label fg-paper-faint shrink-0">{label}</dt>
      <dd
        className={`text-right font-display text-[clamp(0.95rem,3.4vw,1.1rem)] ${
          present ? 'fg-paper' : 'italic fg-paper-muted'
        }`}
      >
        {value ?? fallback}
      </dd>
    </div>
  );
}