import type { MetadataRoute } from 'next';

import { resolveSiteUrl } from '@/lib/server/site-url';

/**
 * The invitation is meant to be found through the invitation itself.
 *
 * Personalised links are private by design — a household's address is nobody
 * else's business — and the guest list must never be indexed. Only the root and
 * the Open Graph image are crawlable.
 */

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await resolveSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api', '/invite/'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}