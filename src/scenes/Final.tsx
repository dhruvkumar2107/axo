'use client';

import { useCallback } from 'react';

import { Monogram } from '@/components/primitives/Monogram';
import { ShareActions } from '@/components/ui/ShareActions';
import { BellAndKalash, HangingJasmine, KolamDivider } from '@/components/art/Manapam';
import { RevealText } from '@/components/motion/Reveal';
import { useExperience } from '@/lib/experience';
import { config, site } from '@/lib/site';
import { scroll } from '@/lib/scroll';

/**
 * ============================================================================
 *  SCENE 12 — UNTIL WE MEET
 * ============================================================================
 *
 *  The closing frame. The doors opened at the beginning of this invitation and
 *  the guest is asked to close them again here: a single line, the names, the
 *  date, and the invitation to share it with someone who was not on the list.
 *
 *  There is also a replay — some guests will want to walk back through the
 *  palace, and it costs us nothing to let them.
 */
export function Final() {
  const { beginEntry } = useExperience();

  const replay = useCallback(() => {
    scroll.reset();
    beginEntry();
  }, [beginEntry]);

  return (
    <section
      id="final"
      data-scene="final"
      className="scene silk scene-pad relative isolate flex flex-col items-center justify-center overflow-hidden px-[var(--gutter)] text-center"
      aria-labelledby="final-heading"
    >
      {/*
        The closing beat is the one place the invitation is allowed to be silk.
        A maroon Kanjivaram ground with a travelling zari band is the most
        unmistakably South Indian surface there is, and it earns its place by
        being the last thing a guest reads before the footer.
      */}
      <div className="silk-shimmer absolute inset-0 -z-20" aria-hidden="true" />

      {/* A single light source, high and behind the type. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 45% at 50% 26%, rgb(232 217 178 / 0.18), transparent 68%)',
        }}
      />

      {/* Jasmine at the lintel, and the ceremonial bell and kalash below. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <HangingJasmine count={2} />
      </div>

      <div className="flex w-full max-w-4xl flex-col items-center gap-[clamp(2.5rem,8vh,4.5rem)]">
        <Monogram size="lg" withRing foil="gold" />

        <RevealText
          as="h2"
          id="final-heading"
          immediate
          className="max-w-[18ch] font-display text-fluid-2xl font-light italic leading-[1.15] fg-silk text-balance"
        >
          Until we meet on the seventeenth of October
        </RevealText>

        <div className="flex flex-col items-center gap-3">
          <RevealText
            as="p"
            immediate
            delay={0.2}
            className="foil font-display text-fluid-xl font-light uppercase tracking-[0.18em]"
          >
            {site.namesStacked.groom}
          </RevealText>
          <RevealText
            as="p"
            immediate
            delay={0.32}
            className="foil font-display text-fluid-xl font-light uppercase tracking-[0.18em]"
          >
            {site.namesStacked.bride}
          </RevealText>
        </div>

        <KolamDivider className="w-[3.5rem] opacity-70" />

        <p className="measure max-w-[34ch] text-balance font-display text-fluid-md italic leading-relaxed fg-silk-muted">
          {config.invitation.blessingsLine} &mdash; {config.location.label}
        </p>

        <BellAndKalash />

        <div className="flex flex-col items-center gap-8">
          <p className="label fg-silk-muted">Share the invitation</p>
          <ShareActions compact tone="silk" />
        </div>

        {/* Padded to a full 44px touch height without changing the type. */}
        <button type="button" className="link-gold label -my-3 py-3" onClick={replay}>
          Walk back through the doors
        </button>
      </div>
    </section>
  );
}