'use client';

import { useEffect } from 'react';

import { weddingConfig } from '@/config/wedding.config';
import { site } from '@/lib/site';

/**
 * Route-level recovery.
 *
 * Reached when a server render or a client render throws somewhere below this
 * boundary. The invitation's facts are printed here in plain, unstyled type,
 * because the single most important thing a guest needs from a failure is still
 * the date and the place.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[invitation] route error:', error);
  }, [error]);

  return (
    <main
      className="flex min-h-svh flex-col items-center justify-center gap-8 bg-ink px-[var(--gutter)] text-center"
      role="alert"
    >
      <p className="label text-gold/60">{site.monogramLabel}</p>

      <h1 className="font-display text-fluid-2xl font-light leading-[1.1] text-ivory">
        {site.namesStacked.groom}
        <span className="mx-3 text-gold/70">&amp;</span>
        {site.namesStacked.bride}
      </h1>

      <div className="flex flex-col items-center gap-3">
        <p className="label text-ivory/70">{site.dateLabel}</p>
        <p className="label text-ivory/45">
          {weddingConfig.location.city}, {weddingConfig.location.state}
        </p>
      </div>

      <p className="measure font-display text-fluid-md italic text-ivory/50">
        A part of this invitation could not be displayed. The details above are
        unaffected.
      </p>

      <button type="button" onClick={reset} className="seal-button mt-2">
        Try again
      </button>
    </main>
  );
}