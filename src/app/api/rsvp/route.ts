import { NextResponse } from 'next/server';

import { summarise, validateSubmission } from '@/lib/rsvp';
import {
  add,
  readAll,
  remove,
  storageBackend,
  storageIsDurable,
  storageIsMisconfigured,
  toCsv,
} from '@/lib/server/rsvp-store';
import { isAdmin, isAllowedOrigin, rateLimit, rateLimitKey } from '@/lib/server/http';

/**
 * /api/rsvp
 *
 *   POST            a guest replies
 *   GET   (admin)   the guest list, or CSV
 *   DELETE (admin)  withdraw one reply
 *
 * The store is a JSON file written atomically; see `rsvp-store.ts`. Nothing
 * here holds state of its own, so a reply only ever touches one place — but that
 * place is a file, so the host must give it somewhere that survives a restart.
 * Point `RSVP_DATA_DIR` at persistent storage when deploying.
 */

export const dynamic = 'force-dynamic';

/* --------------------------------------------------------------------------
   POST — a guest replies
   -------------------------------------------------------------------------- */
export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Not permitted' }, { status: 403 });
  }

  if (!rateLimit(rateLimitKey(request, 'rsvp-post'), 5, 60_000)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request' }, { status: 400 });
  }

  const result = validateSubmission(body);
  if (!result.ok || !result.value) {
    return NextResponse.json({ errors: result.errors }, { status: 422 });
  }

  const record = await add(result.value);

  // 201 with no body: the guest needs confirmation, not their own data back.
  return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
}

/* --------------------------------------------------------------------------
   GET — the guest list
   -------------------------------------------------------------------------- */
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Not permitted' }, { status: 401 });
  }

  const records = await readAll();

  if (new URL(request.url).searchParams.get('format') === 'csv') {
    return new NextResponse(toCsv(records), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rsvp-responses.csv"',
        'Cache-Control': 'no-store',
      },
    });
  }

return NextResponse.json(
      {
        summary: summarise(records),
        records,
        durable: storageIsDurable(),
        // Named so /admin can say exactly where replies are going, and flag a
        // half-configured durable store rather than quietly falling back to a
        // throwaway file and losing every reply after the next deploy.
        backend: storageBackend(),
        misconfigured: storageIsMisconfigured(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
}

/* --------------------------------------------------------------------------
   DELETE — withdraw a reply
   -------------------------------------------------------------------------- */
export async function DELETE(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Not permitted' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const removed = await remove(id);
  return NextResponse.json({ ok: removed }, { status: removed ? 200 : 404 });
}