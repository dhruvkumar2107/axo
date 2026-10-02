'use client';

import { useCallback, useMemo, useState, type FormEvent } from 'react';

import { CalendarActions } from '@/components/ui/CalendarActions';
import { ShareActions } from '@/components/ui/ShareActions';
import { SceneHeading } from '@/components/motion/Reveal';
import { useAudio } from '@/lib/audio';
import { useExperience } from '@/lib/experience';
import { config, site } from '@/lib/site';
import { EMPTY_SUBMISSION, validateSubmission, type RsvpSubmission } from '@/lib/rsvp';
import { cn } from '@/lib/cn';

/**
 * ============================================================================
 *  SCENE 11 — RSVP
 * ============================================================================
 *
 *  A reply card on ivory paper, set into the velvet of the scene. The guest
 *  chooses whether they are coming, how many seats they need, which functions
 *  they can attend, and may leave a note.
 *
 *  Design decisions that matter for this one in particular:
 *
 *    · validation runs on the client *and* the server from one shared function,
 *      so a guest can never be told a reply was accepted when it was not
 *    · all errors surface at once, not one field at a time
 *    · the seat count is a stepper rather than a select, because it is the one
 *      field most likely to be changed on a phone in a hurry
 *    · declining is a first-class, equally dignified choice — never greyed out
 */

type Errors = Partial<Record<keyof RsvpSubmission, string>>;
type Status = 'idle' | 'sending' | 'sent' | 'failed';

export function Rsvp() {
  const { cue } = useAudio();
  const { greeting } = useExperience();

  const [form, setForm] = useState<RsvpSubmission>(() => ({
    ...EMPTY_SUBMISSION,
    slug: null,
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [failure, setFailure] = useState<string | null>(null);

  const attending = form.attending === 'yes';
  const maxGuests = config.rsvp.maxGuests;

  const set = useCallback(<K extends keyof RsvpSubmission>(key: K, value: RsvpSubmission[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const toggleEvent = useCallback((id: string) => {
    setForm((current) => ({
      ...current,
      events: current.events.includes(id)
        ? current.events.filter((eventId) => eventId !== id)
        : [...current.events, id],
    }));
  }, []);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === 'sending') return;

      // Validate locally first so the guest is not made to wait on a round trip
      // to learn their own name is missing.
      const local = validateSubmission({ ...form, salutation: greeting });
      if (!local.ok || !local.value) {
        setErrors(local.errors);
        cue('seal');
        return;
      }

      setStatus('sending');
      setFailure(null);

      try {
        const response = await fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...local.value, salutation: greeting }),
        });

        if (response.status === 422) {
          const body = (await response.json()) as { errors?: Errors };
          setErrors(body.errors ?? {});
          setStatus('idle');
          cue('seal');
          return;
        }

        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }

        setStatus('sent');
        cue('chime');
      } catch {
        setStatus('failed');
        setFailure('We could not send your reply just now. Please try again in a moment.');
      }
    },
    [form, greeting, status, cue],
  );

  const firstErrorId = useMemo(
    () => Object.keys(errors)[0],
    [errors],
  );

  if (!config.rsvp.enabled) return null;

  return (
    <section
      id="rsvp"
      data-scene="rsvp"
      className="scene scene-paper paper paper-grain scene-pad relative isolate overflow-hidden px-[var(--gutter)]"
      aria-labelledby="rsvp-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(70% 45% at 50% 0%, rgba(232,217,160,0.10), transparent 65%)',
        }}
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-[clamp(2.5rem,7vh,4rem)]">
        <SceneHeading label="Kindly Respond" tone="ivory" className="mx-auto" sub={config.rsvp.subheading}>
          <span id="rsvp-heading">{config.rsvp.heading}</span>
        </SceneHeading>

        {status === 'sent' ? (
          <Confirmation name={form.name} attending={attending} />
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="card-wedding w-full p-[clamp(1.5rem,5vw,3rem)] text-inkwarm shadow-[0_40px_80px_-50px_rgb(58_46_36/0.5)]"
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-[6%] border border-gold/40" />

            <div className="relative flex flex-col gap-9">
              {/* --- The decision ------------------------------------------- */}
              <fieldset className="flex flex-col gap-4">
                <legend className="label mb-1 fg-paper-muted">Will you be joining us</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Choice
                    name="attending"
                    value="yes"
                    checked={attending}
                    onChange={() => set('attending', 'yes')}
                    label={config.rsvp.acceptLabel}
                  />
                  <Choice
                    name="attending"
                    value="no"
                    checked={!attending}
                    onChange={() => set('attending', 'no')}
                    label={config.rsvp.declineLabel}
                  />
                </div>
              </fieldset>

              {/* --- Seats --------------------------------------------------- */}
              {attending ? (
                <fieldset className="flex flex-col gap-3">
                  <legend className="label mb-1 fg-paper-muted">Seats required</legend>
                  <div className="flex items-center justify-between gap-4 border-b border-inkwarm/15 pb-4">
                    <Stepper
                      value={form.guests}
                      min={1}
                      max={maxGuests}
                      onChange={(next) => set('guests', next)}
                    />
                    <p className="font-display text-fluid-sm italic fg-paper-muted">
                      {form.guests === 1 ? 'One seat' : `${form.guests} seats, including you`}
                    </p>
                  </div>
                  <FieldError id="rsvp-guests-error" message={errors.guests} />
                </fieldset>
              ) : null}

              {/* --- Which functions ----------------------------------------- */}
              {attending && config.events.length > 1 ? (
                <fieldset className="flex flex-col gap-3">
                  <legend className="label mb-1 fg-paper-muted">Functions you can attend</legend>
                  <div className="flex flex-col gap-2">
                    {config.events.map((event) => (
                      <label
                        key={event.id}
                        className="flex cursor-pointer items-center gap-3 py-1 font-display text-fluid-md fg-paper"
                      >
                        <input
                          type="checkbox"
                          name="events"
                          value={event.id}
                          checked={form.events.includes(event.id)}
                          onChange={() => toggleEvent(event.id)}
                          className="size-4 accent-[#C9A227]"
                        />
                        <span>
                          {event.name}
                          <span className="ml-2 fg-paper-faint">
                            {event.dateLabel ?? 'To be announced'}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}

              {/* --- Who ----------------------------------------------------- */}
              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="field" data-filled={form.name.length > 0}>
                    <input
                      id="rsvp-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(event) => set('name', event.target.value)}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'rsvp-name-error' : undefined}
                      required
                    />
                    <label htmlFor="rsvp-name">Your name</label>
                  </div>
                  <FieldError id="rsvp-name-error" message={errors.name} />
                </div>

                <div>
                  <div className="field" data-filled={form.email.length > 0}>
                    <input
                      id="rsvp-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => set('email', event.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'rsvp-email-error' : undefined}
                    />
                    <label htmlFor="rsvp-email">Email, if you would like</label>
                  </div>
                  <FieldError id="rsvp-email-error" message={errors.email} />
                </div>

                <div>
                  <div className="field" data-filled={form.phone.length > 0}>
                    <input
                      id="rsvp-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) => set('phone', event.target.value)}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'rsvp-phone-error' : undefined}
                    />
                    <label htmlFor="rsvp-phone">Telephone, if you would like</label>
                  </div>
                  <FieldError id="rsvp-phone-error" message={errors.phone} />
                </div>

                <div className="sm:col-span-2">
                  <div className="field" data-filled={form.message.length > 0}>
                    <textarea
                      id="rsvp-message"
                      name="message"
                      rows={3}
                      value={form.message}
                      onChange={(event) => set('message', event.target.value)}
                    />
                    <label htmlFor="rsvp-message">A note for the family</label>
                  </div>
                </div>
              </div>

              {config.rsvp.deadlineLabel ? (
                <p className="label fg-paper-muted">{config.rsvp.deadlineLabel}</p>
              ) : null}

              {/* --- Send ------------------------------------------------------ */}
              <div className="flex flex-col items-start gap-4 pt-2">
                <button
                  type="submit"
                  className="seal-button"
                  style={{ color: 'rgb(74 55 14)' }}
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? 'Sending' : 'Send our reply'}
                </button>

                {failure ? (
                  <p className="label text-[0.5rem] text-burgundy" role="alert">
                    {failure}
                  </p>
                ) : null}

                <p className="max-w-[42ch] font-display text-fluid-sm italic leading-relaxed fg-paper-muted">
                  {config.rsvp.note}
                </p>
              </div>

              {firstErrorId ? (
                <p className="sr-only" role="alert">
                  The form has {Object.keys(errors).length} errors. The first is{' '}
                  {errors[firstErrorId as keyof RsvpSubmission]}.
                </p>
              ) : null}
            </div>
          </form>
        )}

        {status === 'sent' ? (
          <div className="flex w-full flex-col items-center gap-10">
            <CalendarActions />
            <ShareActions />
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------
   Pieces
   -------------------------------------------------------------------------- */

function Choice({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 px-5 py-4 transition-all duration-500 ease-silk',
        checked
          ? 'border border-gold-antique/70 bg-gold-antique/10 text-inkwarm'
          : 'border border-inkwarm/25 fg-paper-muted hover:border-inkwarm/45',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-500',
          checked ? 'border-gold' : 'border-inkwarm/30',
        )}
      >
        <span className={cn('size-2 rounded-full bg-gold transition-transform duration-500', checked ? 'scale-100' : 'scale-0')} />
      </span>
      <span className="font-display text-fluid-md">{label}</span>
    </label>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="One seat fewer"
        className="grid size-10 place-items-center rounded-full border border-inkwarm/25 fg-paper transition-all duration-400 ease-silk enabled:hover:border-gold-antique/70 disabled:opacity-30"
      >
        &minus;
      </button>
      <span className="tnum min-w-[2ch] text-center font-display text-fluid-2xl font-light text-inkwarm">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="One seat more"
        className="grid size-10 place-items-center rounded-full border border-inkwarm/25 fg-paper transition-all duration-400 ease-silk enabled:hover:border-gold-antique/70 disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 font-display text-fluid-xs italic text-burgundy">
      {message}
    </p>
  );
}

function Confirmation({ name, attending }: { name: string; attending: boolean }) {
  return (
    <div className="card-wedding w-full p-[clamp(2rem,6vw,3.5rem)] text-center text-inkwarm shadow-[0_40px_80px_-50px_rgb(58_46_36/0.5)]">
      <p className="label fg-paper-muted">Thank you</p>
      <p className="mx-auto mt-6 max-w-[24ch] text-balance font-display text-fluid-2xl font-light italic leading-[1.2]">
        {attending
          ? `We cannot wait to welcome you, ${name.split(' ')[0] ?? name}.`
          : `Thank you for letting us know, ${name.split(' ')[0] ?? name}. You will be missed.`}
      </p>
      <span aria-hidden="true" className="rule mx-auto mt-8 max-w-[10rem]">
        <span>◆</span>
      </span>
      <p className="mx-auto mt-6 max-w-[38ch] font-display text-fluid-sm italic fg-paper-muted">
        {site.dateLabel} &middot; {config.location.label}
      </p>
    </div>
  );
}