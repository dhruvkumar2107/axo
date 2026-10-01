'use client';

import { cn } from '@/lib/cn';
import { config } from '@/lib/site';

/**
 * G × Y — the visual identity of the invitation.
 *
 * Appears in the preloader, the palace doors, the invitation seal, the
 * navigation, every transition, the RSVP and the final scene. It must therefore
 * hold up at 14px in a navigation corner and at 40vh in the hero, so it is built
 * from live type rather than a flattened image, and scales as one unit.
 */

export type MonogramSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

const SIZE_MAP: Record<MonogramSize, { text: string; ring: number; gap: string }> = {
  xs: { text: 'text-[0.8125rem]', ring: 22, gap: 'gap-[0.14em]' },
  sm: { text: 'text-base', ring: 30, gap: 'gap-[0.16em]' },
  md: { text: 'text-xl', ring: 40, gap: 'gap-[0.18em]' },
  lg: { text: 'text-3xl', ring: 56, gap: 'gap-[0.2em]' },
  xl: { text: 'text-5xl', ring: 78, gap: 'gap-[0.2em]' },
  hero: { text: 'text-[clamp(3.5rem,15vw,11rem)]', ring: 0, gap: 'gap-[0.14em]' },
};

/** `GY` → `{ first: 'G', second: 'Y' }`, padding defensively. */
function readMonogram(monogram: string): { first: string; second: string } {
  const chars = monogram.replace(/[^A-Za-z]/g, '').toUpperCase().split('');
  return { first: chars[0] ?? 'G', second: chars[1] ?? chars[0] ?? 'Y' };
}

export interface MonogramProps {
  size?: MonogramSize;
  /** Draw a fine engraved ring around the letters. */
  withRing?: boolean;
  /** Apply the gold foil treatment to the letters. */
  foil?: boolean;
  /** Show the hairline rule and the date, as on the invitation seal. */
  /** Animate the ring drawing itself in (preloader only). */
  draw?: boolean;
  className?: string;
  /** Accessible label. The visible glyphs read as "G × Y". */
  label?: string;
}

export function Monogram({
  size = 'md',
  withRing = false,
  foil = false,
  draw = false,
  className,
  label = `Monogram: ${config.meta.monogram}`,
}: MonogramProps) {
  const { text, ring, gap } = SIZE_MAP[size];

  const { first, second } = readMonogram(config.meta.monogram);

  const letters = (
    <span
      className={cn(
        'inline-flex items-baseline font-display leading-none tracking-[0.02em]',
        gap,
        text,
        foil ? 'foil' : 'text-current',
      )}
      aria-hidden="true"
    >
      <span>{first}</span>
      <span
        className={cn(
          'translate-y-[-0.12em] font-display opacity-60',
          size === 'hero' ? 'text-[0.34em]' : 'text-[0.42em]',
        )}
      >
        {config.meta.monogramGlyph}
      </span>
      <span>{second}</span>
    </span>
  );

  if (!withRing) {
    return (
      <span className={cn('inline-flex items-center justify-center', className)} role="img" aria-label={label}>
        {letters}
      </span>
    );
  }

  const stroke = 0.75;
  const circumference = 2 * Math.PI * ring;

  return (
    <span
      className={cn('relative inline-grid place-items-center', className)}
      role="img"
      aria-label={label}
    >
      <svg
        className="absolute inset-0 size-full -rotate-90 text-gold/45"
        viewBox={`0 0 ${ring * 2} ${ring * 2}`}
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <circle
          cx={ring}
          cy={ring}
          r={ring - stroke}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={draw ? circumference : 0}
          opacity={draw ? undefined : 1}
          vectorEffect="non-scaling-stroke"
          className={draw ? 'monogram-ring' : undefined}
        />
        {/* A second, inner hairline — the engraved double rule. */}
        <circle
          cx={ring}
          cy={ring}
          r={ring - 4}
          stroke="currentColor"
          strokeWidth={0.4}
          opacity={0.4}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="relative">{letters}</span>
    </span>
  );
}
