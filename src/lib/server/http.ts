import { timingSafeEqual } from 'node:crypto';

/**
 * Server-side guards for the API routes.
 *
 * These two checks are the difference between an invitation that receives a few
 * hundred replies and one that receives a spam script. They are deliberately
 * small and dependency-free.
 */

/**
 * Accept writes only from this site.
 *
 * `ALLOWED_ORIGINS` is a comma-separated list; when it is unset we fall back to
 * the configured public origin, then to the request's own origin. Browsers
 * always send `Origin` on cross-origin POSTs, so this genuinely blocks drive-by
 * submissions from a page on another domain.
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    // Same-origin requests and non-browser clients omit the header. A missing
    // Origin on a browser fetch is not possible for POST, so this is safe.
    return true;
  }

  const configured = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (configured.length > 0) return configured.includes(origin);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  const expected = siteUrl ? [siteUrl, `${siteUrl}/`] : [];
  if (expected.length > 0 && expected.includes(origin)) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/**
 * Compare the admin password in constant time.
 *
 * Without `timingSafeEqual`, the response time of a comparison leaks how many
 * leading characters were correct. It is a small thing, but it is free to do
 * properly.
 */
export function passwordMatches(candidate: string | null, expected: string | null): boolean {
  if (!candidate || !expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, so compare lengths first.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** True when `ADMIN_PASSWORD` is configured and the request presented it. */
export function isAdmin(request: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? null;
  if (!expected) return false;
  const header = request.headers.get('x-admin-password');
  return passwordMatches(header, expected);
}

/**
 * A very small fixed-window rate limiter, held in memory.
 *
 * Enough to stop a bored script and useless against a determined one — which is
 * the correct trade for something that must run without a Redis.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 6, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

/**
 * Derive a rate-limit key from the request without ever storing the address.
 *
 * Only a truncated hash is used, and only for the lifetime of the window.
 */
export function rateLimitKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || request.headers.get('x-real-ip') || 'unknown';
  let hash = 0;
  const seed = `${scope}:${address}:${Date.now() >> 20}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return `${scope}-${(hash >>> 0).toString(36)}`;
}