/**
 * Calendar generation.
 *
 * Three ways for a guest to keep the date, all built from the same event
 * record so they can never disagree:
 *
 *   · Google Calendar — a formatted URL
 *   · Apple / Outlook — a real RFC 5545 .ics file, downloaded
 *   · Any other calendar — the same .ics file
 *
 * The year is resolved once by `resolveWeddingMoment`, so if the family has not
 * yet confirmed it, the countdown still targets the next 17 October without the
 * file ever asserting a year in its printed title.
 */

import { addDays, toICSDate, toLocalISO } from '@/lib/date';
import type { WeddingEvent } from '@/config/wedding.config';
import { config, site } from '@/lib/site';

const CRLF = '\r\n';

function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold long lines to 75 octets, as the specification requires. */
function foldLine(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 73) {
    parts.push(` ${rest.slice(0, 73)}`);
    rest = rest.slice(73);
  }
  parts.push(` ${rest}`);
  return parts.join(CRLF);
}

export interface CalendarEventInput {
  uid: string;
  title: string;
  /** Printed date, e.g. "17 October". */
  dateLabel: string;
  /** Printed location. */
  location: string;
  description: string;
  startsAt: Date;
  /** Falls back to a single day when no end is configured. */
  endsAt: Date | null;
  url: string;
  /** True for an all-day event with no confirmed ceremony time. */
  allDay: boolean;
}

/**
 * Build an .ics file.
 *
 * When no ceremony time has been confirmed the event is emitted as all-day,
 * which is both the honest representation and what most guests actually want in
 * their calendar. Only a confirmed time produces a timed event with a timezone.
 */
export function buildICS(event: CalendarEventInput): string {
  const stamp = (date: Date) => `${toICSDate(date)}T000000`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    // Deliberately omitted: PRODID would fingerprint the client. Most
    // consumers accept its absence, and it keeps the file free of vendor data.
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@invitation`,
    `DTSTAMP:${toICSDate(new Date())}T000000Z`,
    `SUMMARY:${escapeICS(event.title)}`,
    `LOCATION:${escapeICS(event.location)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `URL:${escapeICS(event.url)}`,
  ];

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${toICSDate(event.startsAt)}`);
    const end = event.endsAt ?? addDays(event.startsAt, 1);
    lines.push(`DTEND;VALUE=DATE:${toICSDate(end)}`);
  } else {
    lines.push(`DTSTART;TZID=Asia/Kolkata:${stamp(event.startsAt)}`);
    const end = event.endsAt ?? new Date(event.startsAt.getTime() + 3 * 3_600_000);
    lines.push(`DTEND;TZID=Asia/Kolkata:${stamp(end)}`);
  }

  lines.push('TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR');

  return lines.map(foldLine).join(CRLF) + CRLF;
}

/** Trigger a client-side download of the .ics file. */
export function downloadICS(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke on the next tick so Safari has finished reading the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function googleCalendarUrl(event: CalendarEventInput): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: event.allDay
      ? `${toICSDate(event.startsAt)}/${toICSDate(event.endsAt ?? addDays(event.startsAt, 1))}`
      : `${toLocalISO(event.startsAt).replace(/[-:]/g, '')}/${toLocalISO(
          event.endsAt ?? new Date(event.startsAt.getTime() + 3 * 3_600_000),
        ).replace(/[-:]/g, '')}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* --------------------------------------------------------------------------
   Turn a configured event into a calendar event
   -------------------------------------------------------------------------- */

export function toCalendarEvent(event: WeddingEvent, origin: string): CalendarEventInput {
  const startsAt = event.startsAt ? new Date(event.startsAt) : site.dateMoment?.date ?? new Date();
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;

  const title = `${config.meta.groom} & ${config.meta.bride} — ${event.name}`;
  const location = [event.venue, event.address, config.location.label]
    .filter((part): part is string => Boolean(part))
    .join(', ');

  const description = [
    `${event.dateLabel ?? config.date.month}${event.timeLabel ? `, ${event.timeLabel}` : ''}`,
    event.dressCode ? `Dress code: ${event.dressCode}` : null,
    config.invitation.blessingsLine,
    origin,
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    uid: `wedding-${event.id}-${config.date.day}${config.date.month}`,
    title,
    dateLabel: event.dateLabel ?? '',
    location,
    description,
    startsAt,
    endsAt,
    url: origin,
    allDay: !event.startsAt,
  };
}
