'use client';

import { useCallback, useState } from 'react';

import { Monogram } from '@/components/primitives/Monogram';
import { config, site } from '@/lib/site';
import { summarise, type RsvpRecord } from '@/lib/rsvp';
import { cn } from '@/lib/cn';

/**
 * ============================================================================
 *  /admin — the guest list
 * ============================================================================
 *
 *  Unlisted: there is no link to this page anywhere in the invitation, and it
 *  returns 404 to crawlers. Access is a password held in `ADMIN_PASSWORD` and
 *  sent per request as a header.
 *
 *  The password is deliberately kept in memory for the life of the tab and never
 *  written to a cookie or local storage: closing the tab logs the family out,
 *  and a shared device keeps nothing behind.
 *
 *  No analytics, no tracking, no IP addresses are recorded anywhere — see
 *  `rsvp-store.ts`.
 */

interface Payload {
  summary: ReturnType<typeof summarise>;
  records: RsvpRecord[];
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (secret: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/rsvp', { headers: { 'x-admin-password': secret } });
      if (response.status === 401) {
        setError('That password is not correct.');
        setPayload(null);
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      setPayload((await response.json()) as Payload);
    } catch {
      setError('The guest list could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void load(password);
  };

  const withdraw = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/rsvp?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });
      if (response.ok) void load(password);
    },
    [password, load],
  );

  return (
    <main className="material-cinema min-h-[100svh] px-[var(--gutter)] py-[clamp(2rem,8vh,5rem)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-3">
            <Monogram size="sm" foil />
            <h1 className="font-display text-fluid-2xl font-light text-ivory/90">Guest list</h1>
            <p className="label text-ivory/35">
              {site.dateLabel} &middot; {config.location.city}
            </p>
          </div>

          {payload ? (
            <button
              type="button"
              className="link-gold label"
              onClick={() =>
                void fetch('/api/rsvp?format=csv', {
                  headers: { 'x-admin-password': password },
                })
                  .then((response) => response.text())
                  .then((csv) => {
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = 'rsvp-responses.csv';
                    anchor.click();
                    URL.revokeObjectURL(url);
                  })
              }
            >
              Download CSV
            </button>
          ) : null}
        </header>

        {!payload ? (
          <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-5">
            <div className="field" data-filled={password.length > 0}>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <label htmlFor="admin-password">Password</label>
            </div>
            <button type="submit" className="seal-button self-start" disabled={loading}>
              {loading ? 'Opening' : 'Open the list'}
            </button>
            {error ? (
              <p className="label text-[0.5rem] text-burgundy-muted" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Stat label="Replies" value={payload.summary.responses} />
              <Stat label="Attending" value={payload.summary.attending} />
              <Stat label="Seats" value={payload.summary.seats} />
              <Stat label="Declined" value={payload.summary.declined} />
            </dl>

            {payload.records.length === 0 ? (
              <p className="font-display text-fluid-lg italic text-ivory/45">
                No replies yet. The first one will appear here.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-gold/10 border-y border-gold/10">
                {payload.records.map((record) => (
                  <li
                    key={record.id}
                    className="flex flex-wrap items-baseline justify-between gap-3 py-4"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-display text-fluid-md text-ivory/90">{record.name}</span>
                      <span className="label text-[0.5rem] text-ivory/30">
                        {record.attending === 'yes'
                          ? `${record.guests} seat${record.guests === 1 ? '' : 's'}`
                          : 'Declined'}
                        {record.slug ? ` · ${record.slug}` : ''}
                      </span>
                      {record.message ? (
                        <span className="max-w-[52ch] font-display text-fluid-sm italic text-ivory/45">
                          &ldquo;{record.message}&rdquo;
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-5">
                      <span className="label text-[0.5rem] text-ivory/25">
                        {new Date(record.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => void withdraw(record.id)}
                        className="label text-[0.5rem] text-ivory/25 transition-colors duration-500 hover:text-burgundy-muted"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn('flex flex-col gap-1 border-l border-gold/20 pl-4')}>
      <dt className="label text-[0.5rem] text-ivory/30">{label}</dt>
      <dd className="tnum font-display text-fluid-xl font-light text-gold-light">{value}</dd>
    </div>
  );
}