/**
 * RSVP — shared contract.
 *
 * The shapes and the validation live here so the browser and the server can
 * never disagree about what a valid response looks like. The API route imports
 * `validateSubmission`; the RSVP scene imports the types.
 *
 * No field is invented as required. A name is the only thing we truly need; a
 * phone number and a message are offered because they are genuinely useful to a
 * family planning four hundred seats, and neither is demanded.
 */

import { config } from '@/lib/site';

export type Attending = 'yes' | 'no';

export interface RsvpSubmission {
  /** Guest's name, as they wish it written in the seating list. */
  name: string;
  /** Optional contact — at least one of email/phone is useful but not required. */
  email: string;
  phone: string;
  attending: Attending;
  /** Number of seats needed. Always 1 when declining. */
  guests: number;
  /** Which functions they plan to attend. Empty means "the wedding". */
  events: string[];
  /** A note for the family. */
  message: string;
  /** Personalisation, so the family knows which link the reply came from. */
  salutation: string | null;
  /** The `/invite/[slug]` that produced it, when there was one. */
  slug: string | null;
}

export interface RsvpRecord extends RsvpSubmission {
  id: string;
  createdAt: string;
  /** IANA-free local stamp, purely so the admin list can group by day. */
  day: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof RsvpSubmission, string>>;
  value: RsvpSubmission | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\-\s\d]{6,20}$/;

/** `Raj and Meera's family` → `Raj and Meera` is not attempted; only trimmed. */
function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // Collapse whitespace, strip control characters, cap the length.
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * Validate and normalise an untrusted submission.
 *
 * Returns every error at once so the guest is not walked through the form one
 * field at a time — on a phone, at a wedding, that is the difference between
 * finishing and giving up.
 */
export function validateSubmission(input: unknown): ValidationResult {
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;

  const name = clean(raw.name, 80);
  const email = clean(raw.email, 120).toLowerCase();
  const phone = clean(raw.phone, 24);
  const attending: Attending = raw.attending === 'no' ? 'no' : 'yes';
  const message = clean(raw.message, 600);
  const salutation = raw.salutation ? clean(raw.salutation, 80) : null;
  const slug = raw.slug ? clean(raw.slug, 60).toLowerCase() : null;

  const allowedEvents = new Set(config.events.map((event) => event.id));
  const events = Array.isArray(raw.events)
    ? [...new Set(raw.events.filter((id): id is string => typeof id === 'string'))]
        .filter((id) => allowedEvents.has(id))
        .slice(0, 8)
    : [];

  const requestedGuests = Number(raw.guests);
  const guests = Number.isFinite(requestedGuests) ? Math.trunc(requestedGuests) : 1;

  const errors: ValidationResult['errors'] = {};

  if (name.length < 2) errors.name = 'Please tell us your name.';

  if (email.length > 0 && !EMAIL.test(email)) errors.email = 'That email address looks incomplete.';
  if (phone.length > 0 && !PHONE.test(phone)) errors.phone = 'That number looks incomplete.';

  if (attending === 'yes') {
    if (guests < 1) errors.guests = 'At least one seat, please.';
    else if (guests > config.rsvp.maxGuests) {
      errors.guests = `Please contact the family for more than ${config.rsvp.maxGuests} guests.`;
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    ok: !hasErrors,
    errors,
    value: {
      name,
      email,
      phone,
      attending,
      // Declining never holds seats.
      guests: attending === 'no' ? 1 : guests,
      events,
      message,
      salutation,
      slug,
    },
  };
}

export const EMPTY_SUBMISSION: RsvpSubmission = {
  name: '',
  email: '',
  phone: '',
  attending: 'yes',
  guests: 2,
  events: [],
  message: '',
  salutation: null,
  slug: null,
};

/** Seat totals, for the admin header. */
export function summarise(records: RsvpRecord[]) {
  const attending = records.filter((record) => record.attending === 'yes');
  const declined = records.length - attending.length;
  return {
    responses: records.length,
    attending: attending.length,
    declined,
    seats: attending.reduce((total, record) => total + record.guests, 0),
  };
}