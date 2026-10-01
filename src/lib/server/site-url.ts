import { headers } from 'next/headers';

/**
 * ============================================================================
 *  The one place that decides what this site calls itself
 * ============================================================================
 *
 *  Every absolute URL that leaves the building — Open Graph images, canonical
 *  URLs, the sitemap, robots.txt — is built from here, so they can never
 *  disagree with each other.
 *
 *  Two sources, in order of preference:
 *
 *    1. `NEXT_PUBLIC_SITE_URL`, set at build time. Preferred: the invitation can
 *       then be served statically from a CDN with no per-request work at all.
 *    2. The incoming request, when the domain is not known until deploy. This
 *       is what stops a link shared on WhatsApp from previewing as `localhost`.
 *
 *  A forwarded host is trusted over `host` because behind Vercel, Netlify or
 *  Cloudflare the internal host is the container's own name.
 */

export function configuredSiteUrl(): string | null {
  const value = process.env['NEXT_PUBLIC_SITE_URL']?.trim();
  if (!value) return null;

  // Tolerate a bare domain: `sagarsir.in` is a common way to write this down.
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

export async function resolveSiteUrl(): Promise<string> {
  const configured = configuredSiteUrl();
  if (configured) return configured;

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');

  if (!host) return 'http://localhost:3000';

  const isLocal =
    host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0');
  const protocol =
    requestHeaders.get('x-forwarded-proto') ??
    requestHeaders.get('x-forwarded-ssl') ??
    (isLocal ? 'http' : 'https');

  return `${protocol}://${host}`;
}