import { mkdir, readFile, rename, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

import * as upstash from '@/lib/server/rsvp-store-upstash';
import type { RsvpRecord, RsvpSubmission } from '@/lib/rsvp';

/**
 * ============================================================================
 *  RSVP STORE
 * ============================================================================
 *
 *  Two backends behind one surface: an Upstash Redis hash when its credentials
 *  are configured, and an atomically-written JSON file otherwise. `readAll` and
 *  `add` are the entire surface, so nothing upstream — the API route or the
 *  admin page — knows or cares which one answered.
 *
 *  The file backend is the right default for a single wedding from a single
 *  small deployment: a few hundred replies is not a database. It is also the
 *  wrong default on a host with an ephemeral filesystem, which is why the
 *  durable backend exists and why `storageIsDurable()` says so out loud.
 *
 *  Why this shape holds up:
 *
 *    · atomic — every file write goes to a temporary file and is renamed over
 *      the real one, so a crash mid-write can never truncate the guest list
 *    · serialised — a promise queue means two guests replying in the same
 *      millisecond cannot clobber each other
 *    · swappable — swapping in Postgres or Google Sheets is a contained change
 *
 *  Privacy: no IP addresses, no user agents, no tracking. A reply contains only
 *  what the guest typed. The file is written outside `public/` and is excluded
 *  from version control.
 */

/** Which backend actually answered the last call. Shown to the family in /admin. */
export type StorageBackend = 'upstash' | 'file';

/**
 * Candidate directories for the file backend, best first.
 *
 * `RSVP_DATA_DIR` is the real answer when it is set: a mounted volume survives
 * deploys. Everything after it is a fallback for hosts that give the process a
 * read-only filesystem — Vercel builds into `/var/task`, so `process.cwd()/data`
 * throws `EROFS` there and every reply was returning a 500 to the guest.
 *
 * The OS temp directory is writable on those hosts, so a reply is at least
 * accepted and readable for the life of the instance. That is still ephemeral,
 * which is why `storageIsDurable()` says so out loud rather than pretending.
 */
const CANDIDATE_DIRS = [
  process.env.RSVP_DATA_DIR ? path.resolve(process.env.RSVP_DATA_DIR) : null,
  path.join(process.cwd(), 'data'),
  path.join(os.tmpdir(), 'wedding-invitation-rsvp'),
].filter((dir): dir is string => Boolean(dir));

let resolvedDir: string | null = null;

/**
 * The first candidate directory we can actually write to.
 *
 * Resolved once per instance and cached: the answer cannot change while the
 * process is alive, and probing on every reply would mean a filesystem round
 * trip in the guest's path.
 */
async function writableDir(): Promise<string> {
  if (resolvedDir) return resolvedDir;

  for (const dir of CANDIDATE_DIRS) {
    try {
      await mkdir(dir, { recursive: true });
      await access(dir, constants.W_OK);
      resolvedDir = dir;
      return dir;
    } catch {
      // Read-only or unavailable — try the next candidate.
    }
  }

  throw new Error(
    `RSVP: no writable data directory. Tried ${CANDIDATE_DIRS.join(', ')}. ` +
      'Set RSVP_DATA_DIR to a mounted volume.',
  );
}

async function dataFile(): Promise<string> {
  return path.join(await writableDir(), 'rsvp.json');
}

/**
 * Whether these replies can actually be relied on to still be there tomorrow.
 *
 * Serverless platforms hand each deployment a fresh, throwaway filesystem: a
 * reply written now is readable now, and gone after the next deploy or a cold
 * start on another instance. That is a silent, data-losing failure — the worst
 * possible kind — so the admin page is told about it out loud rather than the
 * family discovering an empty list the week after the wedding.
 *
 * Durable when the Upstash credentials are set, or when `RSVP_DATA_DIR` points
 * somewhere the host preserves. The temp-directory fallback keeps a reply from
 * being refused, but it is not a promise that it will still be there.
 */
export function storageIsDurable(): boolean {
  return upstash.upstashConfigured() || Boolean(process.env.RSVP_DATA_DIR);
}

/** Name the live backend so /admin can tell the family where replies are going. */
export function storageBackend(): StorageBackend {
  return upstash.upstashConfigured() ? 'upstash' : 'file';
}

/** Set when someone meant to configure Upstash but supplied only half of it. */
export function storageIsMisconfigured(): boolean {
  return upstash.upstashMisconfigured();
}

/** Whether the configured durable backend answers right now. */
export function storageResponds(): Promise<boolean> {
  return upstash.upstashConfigured() ? upstash.ping() : Promise.resolve(true);
}

/** Serialises every write. A queue of one is plenty for a single wedding. */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  // Keep the chain alive even if this task rejects.
  queue = run.catch(() => undefined);
  return run;
}

export async function readAll(): Promise<RsvpRecord[]> {
  if (upstash.upstashConfigured()) return upstash.readAll();
  return readAllFromFile();
}

async function readAllFromFile(): Promise<RsvpRecord[]> {
  const file = await dataFile();
  try {
    const contents = await readFile(file, 'utf8');
    const parsed: unknown = JSON.parse(contents);
    return Array.isArray(parsed) ? (parsed as RsvpRecord[]) : [];
  } catch (error) {
    // A missing file is simply an invitation nobody has answered yet.
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
    if (error instanceof SyntaxError) {
      // Corrupt file: preserve it for inspection rather than silently destroying
      // the only copy of the guest list.
      await rename(file, `${file}.corrupt-${Date.now()}`).catch(() => undefined);
      return [];
    }
    throw error;
  }
}

async function writeAll(records: RsvpRecord[]): Promise<void> {
  const file = await dataFile();
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  await rename(temporary, file);
}

/** Append one reply and return the stored record. */
export function add(submission: RsvpSubmission): Promise<RsvpRecord> {
  // The queue only guards the file backend. Redis writes are independent field
  // updates to a hash, so two replies in the same millisecond are already safe.
  if (upstash.upstashConfigured()) return upstash.add(submission);

  return enqueue(async () => {
    const records = await readAllFromFile();
    const now = new Date();
    const record: RsvpRecord = {
      ...submission,
      id: randomUUID(),
      createdAt: now.toISOString(),
      day: now.toISOString().slice(0, 10),
    };
    // Newest first: the admin list wants the latest reply at the top.
    await writeAll([record, ...records]);
    return record;
  });
}

export function remove(id: string): Promise<boolean> {
  if (upstash.upstashConfigured()) return upstash.remove(id);

  return enqueue(async () => {
    const records = await readAllFromFile();
    const next = records.filter((record) => record.id !== id);
    if (next.length === records.length) return false;
    await writeAll(next);
    return true;
  });
}

/** Export as CSV for the family's own records. */
export function toCsv(records: RsvpRecord[]): string {
  const header = ['Received', 'Name', 'Attending', 'Seats', 'Email', 'Phone', 'Functions', 'Note'];
  const escape = (value: string | number | null) => {
    const text = value === null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const rows = records.map((record) =>
    [
      record.createdAt,
      record.name,
      record.attending === 'yes' ? 'Yes' : 'No',
      record.attending === 'yes' ? record.guests : 0,
      record.email,
      record.phone,
      record.events.join(' '),
      record.message,
    ]
      .map(escape)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}