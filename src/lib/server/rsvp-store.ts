import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type { RsvpRecord, RsvpSubmission } from '@/lib/rsvp';

/**
 * ============================================================================
 *  RSVP STORE
 * ============================================================================
 *
 *  A JSON file, written atomically. That is the whole point: this invitation
 *  serves one wedding, from one small deployment, and needs a few hundred
 *  replies — not a database.
 *
 *  Why this shape still holds up:
 *
 *    · atomic — every write goes to a temporary file and is renamed over the
 *      real one, so a crash mid-write can never truncate the guest list
 *    · serialised — a promise queue means two guests replying in the same
 *      millisecond cannot clobber each other
 *    · swappable — `readAll` / `add` is the entire surface. Replacing this file
 *      with Postgres, a hosted KV, or Google Sheets is a contained change, and
 *      nothing upstream knows or cares.
 *
 *  Privacy: no IP addresses, no user agents, no tracking. A reply contains only
 *  what the guest typed. The file is written to `RSVP_DATA_DIR`, which should sit
 *  outside `public/` and is excluded from version control.
 */

const DATA_DIR = process.env.RSVP_DATA_DIR
  ? path.resolve(process.env.RSVP_DATA_DIR)
  : path.join(process.cwd(), 'data');

const DATA_FILE = path.join(DATA_DIR, 'rsvp.json');

/**
 * Whether these replies can actually be relied on to still be there tomorrow.
 *
 * Serverless platforms hand each deployment a fresh, throwaway filesystem: a
 * reply written now is readable now, and gone after the next deploy or a cold
 * start on another instance. That is a silent, data-losing failure — the worst
 * possible kind — so the admin page is told about it out loud rather than the
 * family discovering an empty list the week after the wedding.
 *
 * Set `RSVP_DATA_DIR` to a mounted volume, or swap this one file for a database,
 * and this reports `true` on its own.
 */
export function storageIsDurable(): boolean {
  if (process.env.RSVP_DATA_DIR) return true;
  if (process.env.VERCEL) return false;
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
  if (process.env.NETLIFY) return false;
  return true;
}

/** Serialises every write. A queue of one is plenty for a single wedding. */
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  // Keep the chain alive even if this task rejects.
  queue = run.catch(() => undefined);
  return run;
}

async function ensureDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function readAll(): Promise<RsvpRecord[]> {
  try {
    const contents = await readFile(DATA_FILE, 'utf8');
    const parsed: unknown = JSON.parse(contents);
    return Array.isArray(parsed) ? (parsed as RsvpRecord[]) : [];
  } catch (error) {
    // A missing file is simply an invitation nobody has answered yet.
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
    if (error instanceof SyntaxError) {
      // Corrupt file: preserve it for inspection rather than silently destroying
      // the only copy of the guest list.
      await ensureDir();
      await rename(DATA_FILE, `${DATA_FILE}.corrupt-${Date.now()}`).catch(() => undefined);
      return [];
    }
    throw error;
  }
}

async function writeAll(records: RsvpRecord[]): Promise<void> {
  await ensureDir();
  const temporary = `${DATA_FILE}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  await rename(temporary, DATA_FILE);
}

/** Append one reply and return the stored record. */
export function add(submission: RsvpSubmission): Promise<RsvpRecord> {
  return enqueue(async () => {
    const records = await readAll();
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
  return enqueue(async () => {
    const records = await readAll();
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