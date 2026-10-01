'use client';

import { ProceduralArt } from '@/components/art/ProceduralArt';
import { SceneHeading } from '@/components/motion/Reveal';
import { config, site } from '@/lib/site';

/**
 * ============================================================================
 *  SCENE 10 — BLESSINGS
 * ============================================================================
 *
 *  The quietest scene in the invitation, and the one closest to its purpose.
 *  No photography, no ornament competing for attention — a single line of
 *  blessing, set large, and the two families beneath it.
 *
 *  The family names are empty in the configuration because they have not been
 *  supplied. Rather than invent them, the scene holds a neutral, dignified state
 *  and becomes a proper family dedication the moment the names are added.
 */

export function Blessings() {
  const { brideFamily, groomFamily, note } = config.family;
  const hasNames = brideFamily.length > 0 || groomFamily.length > 0;

  return (
    <section
      id="blessings"
      data-scene="blessings"
      className="scene material-cinema scene-pad relative isolate flex flex-col items-center overflow-hidden px-[var(--gutter)] text-center"
      aria-labelledby="blessings-heading"
    >
      {/* A toran drawn faintly across the top, as if over a doorway. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34vh] opacity-[0.35]"
      >
        <ProceduralArt art="toran" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-[clamp(2.5rem,7vh,4.5rem)]">
        <SceneHeading label="With Blessings" className="mx-auto">
          <span id="blessings-heading">{config.invitation.blessingsLine}</span>
        </SceneHeading>

        <p className="measure max-w-[30ch] text-balance font-display text-fluid-2xl font-light italic leading-[1.25] text-ivory/80">
          {config.invitation.openingLine}
        </p>

        {hasNames ? (
          <div className="grid w-full grid-cols-1 gap-[clamp(2rem,6vw,4rem)] pt-4 sm:grid-cols-2">
            {groomFamily.length > 0 ? (
              <FamilyColumn title={site.namesStacked.groom} names={groomFamily} />
            ) : null}
            {brideFamily.length > 0 ? (
              <FamilyColumn title={site.namesStacked.bride} names={brideFamily} />
            ) : null}
          </div>
        ) : (
          /*
            No names yet. Rather than leave a hole, the scene states its own
            intention once, plainly, and never pretends otherwise.
          */
          <div className="flex flex-col items-center gap-4 pt-2">
            <span aria-hidden="true" className="rule w-full max-w-[14rem]">
              <span>◆</span>
            </span>
            <p className="measure max-w-[40ch] font-display text-fluid-sm italic leading-relaxed text-ivory/40">
              With gratitude to the families who made this day possible.
            </p>
          </div>
        )}

        {note ? (
          <p className="measure max-w-[44ch] font-display text-fluid-sm italic text-ivory/45">
            {note}
          </p>
        ) : null}

        <p className="label text-ivory/25">{site.tagline}</p>
      </div>
    </section>
  );
}

function FamilyColumn({ title, names }: { title: string; names: string[] }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="label text-gold/60">{title}</p>
      <ul className="flex flex-col items-center gap-2">
        {names.map((name) => (
          <li key={name} className="font-display text-fluid-lg font-light text-ivory/85">
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
