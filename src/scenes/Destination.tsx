'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

import { SceneHeading } from '@/components/motion/Reveal';
import { config, site } from '@/lib/site';
import { scroll } from '@/lib/scroll';

/**
 * ============================================================================
 *  SCENE 07 — THE DESTINATION
 * ============================================================================
 *
 *  Kanakapura is the one place the family has confirmed, so this scene is built
 *  entirely around it and around the only truthful things we can say: where it
 *  is, and that it is a chosen place rather than a convenient one.
 *
 *  No venue is named, because none has been given to us. The map is a stylised
 *  drawing, not an embedded Google tile — which keeps the scene fast, private
 *  and on-palette — but it is a real link to the real coordinates.
 */

export function Destination() {
  const rootRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || scroll.reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        mapRef.current,
        { yPercent: 6 },
        {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  const { coordinates } = config.location;

  return (
    <section
      ref={rootRef}
      id="destination"
      data-scene="destination"
      className="scene scene-paper paper paper-grain scene-pad relative isolate overflow-hidden px-[var(--gutter)]"
      aria-labelledby="destination-heading"
    >
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-[clamp(2.5rem,7vw,5rem)] lg:grid-cols-[1.05fr_1fr]">
        {/* --- The map card ---------------------------------------------- */}
        <a
          ref={mapRef}
          href={config.location.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-[4/5] w-full overflow-hidden edge-gold-soft bg-emerald-deep sm:aspect-[5/4] lg:aspect-[4/5]"
          aria-label={`Open ${config.location.label} in Maps`}
        >
          <StylisedMap />

          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_110%,rgba(201,162,39,0.16),transparent_60%)]"
          />

          {/* The coordinates, set like a surveyor's note */}
          {coordinates ? (
            <span className="label absolute bottom-5 left-5 text-[0.5rem] fg-night-muted">
              {coordinates.lat.toFixed(4)}&deg; N &middot; {coordinates.lng.toFixed(4)}&deg; E
            </span>
          ) : null}

          <span className="label absolute bottom-5 right-5 flex items-center gap-2 text-[0.5rem] fg-brass-strong transition-colors duration-500 group-hover:fg-brass">
            Open in Maps
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-500 ease-silk group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </span>
        </a>

        {/* --- The copy --------------------------------------------------- */}
        <div className="flex flex-col gap-7">
          <SceneHeading label="The Destination" tone="ivory" align="left">
            <span id="destination-heading">{config.location.city}, {config.location.state}</span>
          </SceneHeading>

          <p className="measure text-pretty font-display text-fluid-lg font-light leading-relaxed fg-paper">
            {config.location.note}
          </p>

          <dl className="flex flex-col gap-5 border-t border-gold-antique/25 pt-7">
            <Row label="City" value={config.location.city} />
            <Row label="Region" value={`${config.location.state}, ${config.location.country}`} />
            <Row
              label="Nearest airport"
              value="Bengaluru (Kempegowda International)"
            />
            <Row label="Exact venue" value="To be announced" muted />
          </dl>

          <p className="label fg-paper-muted">
            Directions will be shared closer to the date
          </p>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="label fg-paper-faint shrink-0">{label}</dt>
      <dd
        className={`text-right font-display text-fluid-md ${
          muted ? 'italic fg-paper-muted' : 'fg-paper'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

/* --------------------------------------------------------------------------
   A stylised map — drawn, not embedded
   -------------------------------------------------------------------------- */

function StylisedMap() {
  return (
    <svg
      viewBox="0 0 600 750"
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        <linearGradient id="dest-field" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f3329" />
          <stop offset="55%" stopColor="#0a231c" />
          <stop offset="100%" stopColor="#061410" />
        </linearGradient>
        <radialGradient id="dest-glow" cx="50%" cy="46%" r="52%">
          <stop offset="0%" stopColor="#e8d9a0" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#c9a227" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="600" height="750" fill="url(#dest-field)" />

      {/* Contour lines — the land, abstracted */}
      <g fill="none" stroke="#c9a227" strokeOpacity="0.13" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <path
            key={i}
            d={`M-40 ${140 + i * 78} C 140 ${110 + i * 78}, 360 ${190 + i * 74}, 640 ${130 + i * 80}`}
          />
        ))}
      </g>

      {/* A river bending through the land */}
      <path
        d="M-20 120 C 120 190, 150 300, 90 400 C 40 500, 120 620, 260 760"
        fill="none"
        stroke="#2f6f5c"
        strokeOpacity="0.55"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* A tangle of roads */}
      <g fill="none" stroke="#e8d9a0" strokeOpacity="0.16" strokeWidth="1.2">
        <path d="M60 700 C 180 560, 300 520, 560 470" />
        <path d="M120 40 C 190 220, 360 300, 560 340" />
        <path d="M20 380 C 200 380, 380 330, 590 300" />
        <path d="M300 20 C 300 220, 340 420, 430 740" />
      </g>

      {/* Town grid near the centre */}
      <g stroke="#c9a227" strokeOpacity="0.12" fill="none">
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={230 + i * 18} y={330 + i * 16} width="150" height="120" rx="3" />
        ))}
      </g>

      <rect width="600" height="750" fill="url(#dest-glow)" />

      {/* The marker */}
      <g transform="translate(300 360)">
        <circle r="46" fill="none" stroke="#c9a227" strokeOpacity="0.28" />
        <circle r="28" fill="none" stroke="#e8d9a0" strokeOpacity="0.5" />
        <circle r="6.5" fill="#f0e6c8" />
        <circle r="6.5" fill="none" stroke="#4a370e" strokeOpacity="0.6" />
      </g>

      {/* A compass, drawn faintly in the corner */}
      <g transform="translate(510 90)" stroke="#c9a227" strokeOpacity="0.4" fill="none">
        <circle r="26" />
        <path d="M0 -30 L7 0 L0 30 L-7 0 Z" fill="#c9a227" fillOpacity="0.5" stroke="none" />
        <text
          x="0"
          y="-38"
          textAnchor="middle"
          fill="#e8d9a0"
          fontSize="12"
          fontFamily="serif"
          stroke="none"
        >
          N
        </text>
      </g>

      {/* Title plaque */}
      <text
        x="40"
        y="80"
        fill="#f0e6c8"
        fillOpacity="0.72"
        fontSize="20"
        fontFamily="serif"
        letterSpacing="6"
      >
        {site.city.toUpperCase()}
      </text>
    </svg>
  );
}
