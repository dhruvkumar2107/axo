'use client';

import { Monogram } from '@/components/primitives/Monogram';
import { CornerLamp, HangingJasmine, LotusDivider } from '@/components/art/Manapam';
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
    <footer className="paper paper-grain relative border-t border-gold-antique/20 px-[var(--gutter)] pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[clamp(2.5rem,7vh,4rem)]">
      {/* A jasmine strand across the head of the footer and a lamp on the
          floor of it: the two ornaments that say "the ceremony is over" without
          saying anything at all. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10" aria-hidden="true">
        <HangingJasmine count={2} />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 text-center">
        <CornerLamp className="w-[1.8rem] opacity-80" />

        <Monogram size="sm" foil="ink" />

        <p className="font-display text-fluid-md italic fg-paper-muted">{site.tagline}</p>

        {/* --- Practical links ------------------------------------------- */}
        <nav aria-label="Footer" className="flex flex-col items-center gap-6">
          <a
            href={config.location.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="label fg-paper transition-colors duration-500 hover:text-maroon"
          >
            {config.location.label}
          </a>

          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {config.nav.map((item) => (
              <li key={item.target}>
                <button
                  type="button"
                  onClick={() => scrollTo(`#${item.target}`, -40)}
                  className="label text-[0.5rem] fg-paper-muted transition-colors duration-500 hover:text-maroon"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <LotusDivider className="w-[11rem] opacity-80" />

        {/* --- Colophon --------------------------------------------------- */}
        <div className="flex flex-col items-center gap-2">
          <p className="label text-[0.5rem] fg-paper-faint">
            {config.location.city} &middot; {config.date.day} {config.date.month}
            {/* The year is printed only once it is confirmed. */}
            {year && !site.dateYearAssumed ? ` ${year}` : ''}
          </p>
          <button
            type="button"
            onClick={() => scrollTo(0, 0)}
            className="label mt-3 text-[0.5rem] fg-paper-faint transition-colors duration-500 hover:text-maroon"
          >
            Return to the beginning
          </button>
        </div>
      </div>
    </footer>
  );
}