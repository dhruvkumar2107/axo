'use client';

import { Monogram } from '@/components/primitives/Monogram';
import { config, site } from '@/lib/site';
import { scrollTo } from '@/lib/scroll';

/**
 * The quiet last line of the page.
 *
 * It carries the practical links — the map, the calendar, each scene — and
 * nothing else. No newsletter, no social feed, no legal paragraph written to be
 * skimmed.
 */
export function Footer() {
  const year = site.dateYear;

  return (
    <footer className="relative border-t border-gold/12 bg-ink px-[var(--gutter)] pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[clamp(2.5rem,7vh,4rem)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 text-center">
        <Monogram size="sm" foil />

        <p className="font-display text-fluid-md italic text-ivory/50">{site.tagline}</p>

        {/* --- Practical links ------------------------------------------- */}
        <nav aria-label="Footer" className="flex flex-col items-center gap-6">
          <a
            href={config.location.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="label text-ivory/45 transition-colors duration-500 hover:text-gold-light"
          >
            {config.location.label}
          </a>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {config.nav.map((item) => (
              <li key={item.target}>
                <button
                  type="button"
                  onClick={() => scrollTo(`#${item.target}`, -40)}
                  className="label text-[0.5rem] text-ivory/35 transition-colors duration-500 hover:text-gold-light"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* --- Colophon --------------------------------------------------- */}
        <div className="flex flex-col items-center gap-2">
          <p className="label text-[0.5rem] text-ivory/25">
            {config.location.city} &middot; {config.date.day} {config.date.month}
            {/* The year is printed only once it is confirmed. */}
            {year && !site.dateYearAssumed ? ` ${year}` : ''}
          </p>
          <button
            type="button"
            onClick={() => scrollTo(0, 0)}
            className="label mt-3 text-[0.5rem] text-ivory/25 transition-colors duration-500 hover:text-gold-light"
          >
            Return to the beginning
          </button>
        </div>
      </div>
    </footer>
  );
}