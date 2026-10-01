import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';

import { weddingConfig } from '@/config/wedding.config';
import { site } from '@/lib/site';
import { resolveSiteUrl } from '@/lib/server/site-url';
import { Providers } from '@/components/providers/Providers';
import NoScript from '@/components/NoScript';

/* ---------------------------------------------------------------------------
   TYPOGRAPHY
   Two families, two jobs. The serif is used at display sizes only; the sans
   never appears above 16px, so the two never compete.

   Weights are declared one at a time and only where they are used, because
   every extra weight is a separate font file on the critical path. Three
   families with ten weights each was costing ~180KB before first paint; the
   site now ships the two faces it actually renders.
   --------------------------------------------------------------------------- */

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-cormorant',
  preload: true,
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '500'],
  display: 'swap',
  variable: '--font-manrope',
  // Not preloaded: the sans only appears in small utility text, and holding the
  // critical path open for it delays the display face that the guest actually
  // sees first.
  preload: false,
});

/* ---------------------------------------------------------------------------
   METADATA — this is what a guest sees when the link is pasted into WhatsApp.

   Built inside `generateMetadata` rather than at module scope so the origin can
   come from the request itself when the domain is not known at build time.
   Without this, a first deploy on a fresh hostname previews as `localhost`.
   --------------------------------------------------------------------------- */

const title = `${site.namesStacked.groom} & ${site.namesStacked.bride} — Wedding Invitation`;

const description = `With the blessings of their families, ${site.namesStacked.groom} & ${site.namesStacked.bride} invite you to celebrate their wedding on ${site.dateLabel} in ${site.city}, ${weddingConfig.location.state}.`;

/**
 * Rendered per request so the absolute origin can come from the request itself.
 *
 * This costs a dynamic render of a ~15KB shell — nothing next to the WebGL and
 * scroll work the browser is about to do — and it buys share previews that are
 * correct on any hostname without configuration. Set `NEXT_PUBLIC_SITE_URL` and
 * `resolveSiteUrl()` will prefer it; the request is simply the fallback.
 *
 * Note: `dynamic` must be a static string for the compiler, so the choice cannot
 * be conditional on the environment. Request-time is always safe.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const origin = await resolveSiteUrl();
  const ogImage = `${origin}/api/og`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: title,
      template: `%s — ${site.names}`,
    },
    description,
    applicationName: `${site.names} — Wedding Invitation`,
    keywords: [
      site.namesStacked.groom,
      site.namesStacked.bride,
      'wedding invitation',
      site.city,
      site.dateLabel,
      `${weddingConfig.location.state} wedding`,
      `${site.city} wedding`,
    ],
    authors: [{ name: site.names }],
    creator: site.names,
    publisher: site.names,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: `${site.names} — Wedding Invitation`,
      title,
      description,
      url: origin,
      locale: 'en_IN',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${site.names} — ${site.dateLabel}, ${site.city}`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    },
    manifest: '/manifest.webmanifest',
    formatDetection: { telephone: false, address: false, email: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08080A' },
    { media: '(prefers-color-scheme: light)', color: '#F4EFE4' },
  ],
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${cormorant.variable} ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-ink text-ivory antialiased">
        <NoScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
