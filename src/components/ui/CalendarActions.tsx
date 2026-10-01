'use client';

import { useCallback, useState } from 'react';

import { useAudio } from '@/lib/audio';
import { buildICS, downloadICS, googleCalendarUrl, toCalendarEvent } from '@/lib/calendar';
import { config } from '@/lib/site';
import { currentOrigin } from '@/lib/share';
import type { WeddingEvent } from '@/config/wedding.config';

/**
 * SAVE THE DATE — Google Calendar, Apple Calendar, and a plain download.
 *
 * Every button is built from the same event record, so they cannot drift apart.
 * Apple Calendar has no URL-based add (it removed subscription-by-web), so it is
 * honestly offered as a file download, which is what Apple Calendar opens.
 */

export interface CalendarActionsProps {
  /** Defaults to the confirmed wedding function. */
  event?: WeddingEvent;
  /** Compact single-row layout for tight spaces. */
  compact?: boolean;
  className?: string;
}

export function CalendarActions({ event, compact = false, className }: CalendarActionsProps) {
  const { cue } = useAudio();
  const [saved, setSaved] = useState<string | null>(null);
  const target = event ?? config.events[0];

  const confirm = useCallback(
    (which: string) => {
      cue('chime');
      setSaved(which);
      window.setTimeout(() => setSaved(null), 2600);
    },
    [cue],
  );

  if (!target) return null;

  const openGoogle = () => {
    confirm('google');
    window.open(
      googleCalendarUrl(toCalendarEvent(target, currentOrigin())),
      '_blank',
      'noopener,noreferrer',
    );
  };

  const download = (which: 'apple' | 'file') => {
    const origin = currentOrigin();
    const ics = buildICS(toCalendarEvent(target, origin));
    downloadICS(`${config.date.day}-${config.date.month}-${target.id}.ics`, ics);
    confirm(which);
  };

  const buttonClass =
    'seal-button seal-button--ghost !px-5 !py-3 !text-[0.5rem] !tracking-[0.22em]';

  return (
    <div
      className={`flex flex-col items-center gap-4 ${compact ? '' : 'gap-5'} ${className ?? ''}`}
    >
      <div
        className={
          compact
            ? 'flex flex-wrap items-center justify-center gap-3'
            : 'flex flex-col items-center gap-3 sm:flex-row sm:gap-4'
        }
      >
        <button type="button" className={buttonClass} onClick={openGoogle}>
          Google Calendar
        </button>
        <button type="button" className={buttonClass} onClick={() => download('apple')}>
          Apple Calendar
        </button>
        <button type="button" className={buttonClass} onClick={() => download('file')}>
          Download .ics
        </button>
      </div>

      <p className="label min-h-[1.2em] text-center text-[0.5rem] text-gold/70" aria-live="polite">
        {saved === 'google'
          ? 'Opening Google Calendar'
          : saved === 'apple'
            ? 'Calendar file downloaded — open it to add'
            : saved === 'file'
              ? 'Calendar file downloaded'
              : ''}
      </p>
    </div>
  );
}
