import type { RsvpRecord, RsvpSubmission } from '@/lib/rsvp';

/**
 * ============================================================================
 *  RSVP STORE — Upstash Redis
 * ============================================================================
 *
 *  The durable backend, used only when its credentials are present. It speaks
 *  Upstash's plain REST API, so there is no SDK to install, no connection pool
 *  to leak in a serverless function, and nothing added to the client bundle.
 *
 *  Recognises both naming conventions, because a Vercel KV store and a
 *  self-serve Upstash database hand out different variable names and the
 *  family should not have to care which one they created:
 *
 *    · KV_REST_API_URL        / KV_REST_API_TOKEN        (Vercel KV marketplace)
 *    · UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (Upstash console)
 *
 *  Data model: one Redis hash, field per reply, keyed by the record's `id`.
 *  Why a hash rather than a list:
 *
 *    · `HDEL` removes a reply in one command, with no read-modify-write of the
 *      whole guest list. A list would mean rewriting every reply to delete one.
 *    · No array to re-index, so two concurrent replies cannot interleave.
 *
 *  Ordering is computed on read (`createdAt` descending) rather than stored, so
 *  it cannot drift out of order the way a stored list index does. For a few
 *  hundred replies that sort is free.
 *
 *  Privacy is unchanged: only the fields the guest typed, no IPs or user agents.
 */

/** Resolved once at module load so a request never pays for env lookups. */
const ENDPOINT =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? '';
const TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? '';

/** Set false when only one half of the credentials is present. */
const credentialsLookPresent = Boolean(ENDPOINT || TOKEN);

/**
 * Whether this backend is in play.
 *
 * Requires *both* a URL and a token. Half-configured credentials fall back to
 * the file store deliberately: a partial Upstash setup would otherwise throw on
 * the first reply, and an unreadable guest list is worse than an ephemeral one.
 * `credentialsLookPresent` lets the admin page still complain about it.
 */
export function upstashConfigured(): boolean {
  return Boolean(ENDPOINT && TOKEN);
}

/** True when someone clearly meant to configure this but got it half-right. */
export function upstashMisconfigured(): boolean {
  return credentialsLookPresent && !upstashConfigured();
}

/** Single-key namespace. Change it to run a second wedding from one project. */
const KEY = 'rsvp';

interface UpstashEnvelope<T> {
  result?: T;
  error?: string;
}

/**
 * Run one Redis command.
 *
 * Upstash takes `POST /` with a JSON array of arguments and answers
 * `{ result }` or `{ error }`. A non-2xx or an `error` field is a real failure,
 * not something to paper over: a silently dropped reply is a lost reply.
 */
async function command<T>(...args: (string | number)[]): Promise<T> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    // Replies are written once and read a few times; a stale reply is a wrong
    // answer to a guest, so never serve one from a cache.
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`RSVP: Upstash responded ${response.status}`);
  }

  const payload = (await response.json()) as UpstashEnvelope<T>;
  if (payload.error) throw new Error(`RSVP: Upstash error - ${payload.error}`);
  return payload.result as T;
}

/** Parse the hash into records, dropping anything unreadable rather than 500ing. */
function toRecords(value: unknown): RsvpRecord[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];

  const records: RsvpRecord[] = [];
  for (const raw of Object.values(value as Record<string, unknown>)) {
    if (typeof raw !== 'string') continue;
    try {
      records.push(JSON.parse(raw) as RsvpRecord);
    } catch {
      // One malformed field should not hide the rest of the guest list.
    }
  }

  return records.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function readAll(): Promise<RsvpRecord[]> {
  return toRecords(await command<Record<string, string> | null>('HGETALL', KEY));
}

export async function add(submission: RsvpSubmission): Promise<RsvpRecord> {
  const now = new Date();
  const record: RsvpRecord = {
    ...submission,
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
    day: now.toISOString().slice(0, 10),
  };

  await command('HSET', KEY, record.id, JSON.stringify(record));
  return record;
}

export async function remove(id: string): Promise<boolean> {
  // HDEL reports how many fields it removed, which is exactly "did this reply
  // exist" — no read-modify-write needed.
  const removed = await command<number>('HDEL', KEY, id);
  return Number(removed) > 0;
}

/** Wipe every reply. Only reachable from the authenticated admin route. */
export async function clear(): Promise<void> {
  await command('DEL', KEY);
}

/** A cheap reachability probe, so the admin page can show the real backend. */
export async function ping(): Promise<boolean> {
  try {
    return (await command<string>('PING')) === 'PONG';
  } catch {
    return false;
  }
}