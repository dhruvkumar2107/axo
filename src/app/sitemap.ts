import type { MetadataRoute } from 'next';

import { resolveSiteUrl } from '@/lib/server/site-url';

/**
 * Exactly one URL belongs in a sitemap.
 *
 * Personalised links are addressed to households, not to search engines, and
 * `/admin` is a page that should never be found. `robots.txt` disallows both;
 * this confirms the intent rather than contradicting it.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await resolveSiteUrl();
  const lastModified = new Date();

  return [
    {
      url: `${origin}/`,
      lastModified,
      changeFrequency: 'monthly',
      // Before the wedding this is where the date lives; afterwards, a fixed
      // record of the day.
      priority: 1,
    },
  ];
}