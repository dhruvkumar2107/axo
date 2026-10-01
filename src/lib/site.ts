/**
 * Derived, presentation-ready values.
 *
 * Components import from here rather than reaching into `wedding.config.ts`,
 * so there is exactly one place where configuration becomes copy.
 */
import { weddingConfig } from '@/config/wedding.config';
import { formatDateLabel, resolveWeddingMoment, type WeddingMoment } from '@/lib/date';

const cfg = weddingConfig;

export interface SiteCopy {
  names: string;
  namesStacked: { groom: string; bride: string };
  monogram: string;
  monogramLabel: string;
  dateLabel: string;
  dateLong: string | null;
  dateYear: number | null;
  dateYearAssumed: boolean;
  locationLabel: string;
  city: string;
  tagline: string;
  /** Which moment the countdown should aim at, if any. */
  moment: WeddingMoment | null;
  /** Fallback target derived from the date alone. */
  dateMoment: WeddingMoment | null;
}

const dateMoment = resolveWeddingMoment({
  day: cfg.date.day,
  month: cfg.date.month,
  year: cfg.date.year,
  assumeNextOccurrence: cfg.date.assumeNextOccurrence,
});

const countdownMoment = (() => {
  if (cfg.countdown.targetIso) {
    const parsed = new Date(cfg.countdown.targetIso);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        date: parsed,
        year: parsed.getFullYear(),
        assumed: false,
        iso: parsed.toISOString(),
      } satisfies WeddingMoment;
    }
  }
  return dateMoment;
})();

export const site: SiteCopy = {
  names: `${cfg.meta.groom} & ${cfg.meta.bride}`,
  namesStacked: { groom: cfg.meta.groom, bride: cfg.meta.bride },
  monogram: cfg.meta.monogram,
  monogramLabel: `${cfg.meta.monogram} ${cfg.meta.monogramGlyph} ${cfg.meta.monogram}`,
  dateLabel: formatDateLabel(cfg.date.day, cfg.date.month),
  dateLong: dateMoment
    ? dateMoment.date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : null,
  dateYear: dateMoment?.year ?? null,
  dateYearAssumed: dateMoment?.assumed ?? false,
  locationLabel: cfg.location.label,
  city: cfg.location.city,
  tagline: cfg.tagline,
  moment: countdownMoment,
  dateMoment,
};

export { weddingConfig as config };
export { cfg };
