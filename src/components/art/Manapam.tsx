'use client';

/**
 * ============================================================================
 *  THE MANAPAM — shared traditional ornament
 * ============================================================================
 *
 *  Small compositions assembled from the motifs in `art/Tradition.tsx`. They
 *  exist as components rather than as markup repeated across scenes so that a
 *  change to, say, how a jasmine strand is hung happens in one place and every
 *  scene follows.
 *
 *  Rules that keep the page from tipping into theme-park:
 *
 *    · Ornament never sits behind body copy at full strength. Decorative
 *      elements stay in the margin, above a heading, or below type.
 *    · Ornament is asymmetric. A garland is tied by hand; a perfectly mirrored
 *      one is a stamp.
 *    · Nothing here moves quickly. The only fast movement on the site is the
 *      lamp flame, and even that is a 3.4s ease.
 *
 *  Every motif is placed in an `aspect-ratio` box derived from its own viewBox,
 *  so a motif is never squashed by whatever width it happens to be given.
 */

import { cn } from '@/lib/cn';
import {
  BananaLeaf,
  CardBorder,
  Deepam,
  Gopuram,
  JasmineString,
  Kalash,
  Kolam,
  LotusRule,
  Pillar,
  TempleArch,
  TempleBell,
} from '@/components/art/Tradition';

/* ===========================================================================
   Motif frame — one box, correct proportions
   ===========================================================================
   A wrapper keyed by motif name. Centralising this means no scene has to
   remember that a bell is 40:70 and a lotus rule is 200:24.
   =========================================================================== */

const RATIOS = {
  arch: '200 / 260',
  pillar: '44 / 122',
  gopuram: '240 / 260',
  kolam: '70 / 70',
  jasmine: '200 / 90',
  leaf: '200 / 80',
  deepam: '60 / 120',
  bell: '40 / 70',
  kalash: '60 / 76',
  card: '200 / 200',
  lotus: '200 / 24',
} as const;

type MotifName = keyof typeof RATIOS;

function Motif({
  name,
  className,
  children,
}: {
  name: MotifName;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('w-full', className)} style={{ aspectRatio: RATIOS[name] }}>
      {children}
    </div>
  );
}

/* ===========================================================================
   Floating petals — the one ambient particle layer on the site
   ===========================================================================
   Ten elements, transform-only, on one fixed layer behind content. They are
   `aria-hidden`, `pointer-events-none`, and animated by CSS, so the compositor
   does the work and the main thread never ticks for them.
   =========================================================================== */

const PETALS = [
  { left: '6%', size: 7, delay: 0, duration: 34 },
  { left: '15%', size: 5, delay: -7, duration: 41 },
  { left: '24%', size: 6, delay: -15, duration: 37 },
  { left: '38%', size: 4, delay: -22, duration: 44 },
  { left: '52%', size: 6, delay: -4, duration: 35 },
  { left: '63%', size: 5, delay: -18, duration: 40 },
  { left: '74%', size: 7, delay: -11, duration: 36 },
  { left: '84%', size: 4, delay: -26, duration: 43 },
  { left: '91%', size: 6, delay: -9, duration: 38 },
  { left: '97%', size: 5, delay: -30, duration: 42 },
] as const;

export function Petals({ count = PETALS.length }: { count?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {PETALS.slice(0, count).map((petal, i) => (
        <span
          key={i}
          className="drift-slow absolute top-0 block"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size * 1.5,
            animationDelay: `${petal.delay}s`,
            ['--drift-duration' as string]: `${petal.duration}s`,
            borderRadius: '60% 12% 60% 12%',
            background:
              'linear-gradient(150deg, rgb(var(--ivory-soft)) 0%, rgb(var(--gold-pale)) 55%, rgb(var(--turmeric-soft)) 100%)',
            opacity: 0.5,
            boxShadow: '0 1px 3px rgb(var(--maroon) / 0.12)',
          }}
        />
      ))}
    </div>
  );
}

/* ===========================================================================
   Brass lamps — a pair, for the flanks of a composition
   =========================================================================== */

export function LampPair({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none flex items-end justify-between', className)}
      aria-hidden="true"
    >
      <Motif name="deepam" className="w-[clamp(1.6rem,4vw,2.6rem)]">
        <Deepam className="h-full w-full" />
      </Motif>
      <Motif name="deepam" className="w-[clamp(1.6rem,4vw,2.6rem)]">
        <Deepam className="h-full w-full" />
      </Motif>
    </div>
  );
}

/* ===========================================================================
   Jasmine garland — hung from the top of a composition
   ===========================================================================
   Two or three strands at different lengths, seeds and offsets, because a real
   toran is tied by hand and the sides never match.
   =========================================================================== */

export function HangingJasmine({
  className,
  count = 3,
}: {
  className?: string;
  count?: number;
}) {
  const seeds = [4, 9, 15];
  // Offsets stagger the fall so the strands do not read as a comb.
  const offsets = [-16, 0, 13, -7];
  const widths = [62, 46, 54];

  return (
    <div
      className={cn('pointer-events-none absolute inset-x-0 top-0 flex justify-center', className)}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="-translate-y-[16%]"
          style={{ width: `${widths[i % widths.length]}%`, marginLeft: `${offsets[i % offsets.length]}%` }}
        >
          <Motif name="jasmine">
            <JasmineString className="h-full w-full" seed={seeds[i % seeds.length]} />
          </Motif>
        </div>
      ))}
    </div>
  );
}

/* ===========================================================================
   Temple framing — the arch a scene sits inside
   ===========================================================================
   Two pillars and an arch, behind the type. The pillars are dropped on the
   narrowest screens, where they would otherwise crowd the names.
   =========================================================================== */

export function TempleFrame({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 -z-10', className)} aria-hidden="true">
      <Motif
        name="arch"
        className="absolute left-1/2 top-[5%] w-[min(94%,44rem)] -translate-x-1/2 opacity-45"
      >
        <TempleArch className="h-full w-full" />
      </Motif>

      <Motif
        name="pillar"
        className="absolute bottom-[8%] left-[7%] hidden h-[56%] w-[2.6rem] opacity-50 sm:block"
      >
        <Pillar className="h-full w-full" />
      </Motif>
      <Motif
        name="pillar"
        className="absolute bottom-[8%] right-[7%] hidden h-[56%] w-[2.6rem] opacity-50 sm:block"
      >
        <Pillar className="h-full w-full" />
      </Motif>
    </div>
  );
}

/* ===========================================================================
   Gopuram silhouette — the horizon behind a section
   =========================================================================== */

export function TempleHorizon({
  className,
  opacity = 0.14,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 -z-10 flex justify-center',
        className,
      )}
      style={{ opacity }}
      aria-hidden="true"
    >
      <Motif name="gopuram" className="h-[34vh] w-[min(86%,40rem)]">
        <Gopuram className="h-full w-full" />
      </Motif>
    </div>
  );
}

/* ===========================================================================
   Dividers — the joints between sections
   =========================================================================== */

export function KolamDivider({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto w-[4.5rem] max-w-full', className)} aria-hidden="true">
      <Motif name="kolam">
        <Kolam className="h-full w-full" />
      </Motif>
    </div>
  );
}

export function LotusDivider({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto w-[12rem] max-w-full', className)} aria-hidden="true">
      <Motif name="lotus">
        <LotusRule className="h-full w-full" />
      </Motif>
    </div>
  );
}

/* ===========================================================================
   Card frame — the printed-invitation edge, with a banana leaf corner
   =========================================================================== */

export function CardFrame({
  className,
  leaf = true,
  children,
}: {
  className?: string;
  leaf?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('card-wedding relative overflow-hidden', className)}>
      <Motif name="card" className="pointer-events-none absolute inset-0 h-full w-full opacity-30">
        <CardBorder className="h-full w-full" />
      </Motif>
      {leaf ? <LeafCorner /> : null}
      {leaf ? <LeafCorner flip /> : null}
      <div className="relative">{children}</div>
    </div>
  );
}

/* Leaves sit outside the card box so they read as tucked in, not clipped. */
export function LeafCorner({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute -top-1 h-[3.4rem] w-[6rem] opacity-60',
        flip ? '-right-1 -scale-x-100' : '-left-1',
        className,
      )}
      aria-hidden="true"
    >
      <Motif name="leaf">
        <BananaLeaf className="h-full w-full" seed={flip ? 21 : 14} />
      </Motif>
    </div>
  );
}

/* ===========================================================================
   Bell and kalash — the ceremonial pair, for closings
   =========================================================================== */

export function BellAndKalash({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none flex items-end justify-center gap-6 sm:gap-10', className)}
      aria-hidden="true"
    >
      <Motif name="bell" className="w-[2.1rem] max-w-[16vw]">
        <TempleBell className="h-full w-full" />
      </Motif>
      <Motif name="kalash" className="w-[2.6rem] max-w-[20vw]">
        <Kalash className="h-full w-full" />
      </Motif>
      <Motif name="bell" className="w-[2.1rem] max-w-[16vw]">
        <TempleBell className="h-full w-full" />
      </Motif>
    </div>
  );
}

/* ===========================================================================
   Arch watermark — very large, very quiet, behind a heading. This is what
   "integrated rather than pasted on" looks like in practice: the ornament is
   sized off the layout it sits in.
   =========================================================================== */

export function ArchWatermark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 flex items-center justify-center',
        className,
      )}
      aria-hidden="true"
    >
      <Motif name="arch" className="h-[125%] w-[min(94%,38rem)] opacity-[0.07]">
        <TempleArch className="h-full w-full" />
      </Motif>
    </div>
  );
}

/* ===========================================================================
   A single lit deepam, for a corner of a card
   =========================================================================== */

export function CornerLamp({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none', className)} aria-hidden="true">
      <Motif name="deepam" className="w-[1.7rem] max-w-[12vw]">
        <Deepam className="h-full w-full" />
      </Motif>
    </div>
  );
}