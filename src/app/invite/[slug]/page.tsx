import type { Metadata } from 'next';

import { InvitationApp } from '@/components/InvitationApp';
import { weddingConfig } from '@/config/wedding.config';
import { resolveSalutation, slugFromPathname } from '@/lib/greeting';
import { site } from '@/lib/site';

/**
 * ============================================================================
 *  /invite/[slug] — a personalised invitation
 * ============================================================================
 *
 *  The same invitation, addressed to one household. The greeting is derived from
 *  the slug in two places, deliberately:
 *
 *    · here, on the server, so the message a crawler reads — and the WhatsApp
 *      preview — is already the personal one
 *    · in `ExperienceProvider`, on the client, because `/` must work identically
 *
 *  A slug that is not configured still resolves, using the slug itself as a
 *  courtesy salutation. An unconfigured invite never 404s: it would be a very
 *  poor moment to send someone a broken link.
 */

interface Params {
  params: Promise<{ slug: string }>;
}

function buildMetadata(slug: string): Metadata {
  const salutation = resolveSalutation(slug, weddingConfig.invites, '');
  // `absolute`, because the root layout's title template would otherwise append
  // the couple's names to a string that already contains them.
  const title = salutation
    ? { absolute: `${salutation.replace(/,+$/, '')} — ${site.names}` }
    : { absolute: `${site.names} — Wedding Invitation` };

  return {
    title,
    description: `${weddingConfig.invitation.openingLine}, ${site.namesStacked.groom} & ${site.namesStacked.bride} invite you to celebrate their wedding on ${site.dateLabel} in ${site.city}, ${weddingConfig.location.state}.`,
    // Personalised links address households, not search engines. They point
    // their canonical at the invitation itself, which is the page that should
    // ever appear in a result.
    alternates: { canonical: '/' },
    robots: { index: false, follow: true },
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata(slug);
}

export default async function InvitePage({ params }: Params) {
  const { slug } = await params;

  /*
    Rendered on the server as well as the client so the salutation is correct
    before hydration. The provider then takes over for the live experience.
  */
  const salutation = resolveSalutation(
    slugFromPathname(`/invite/${slug}`) ?? slug,
    weddingConfig.invites,
    'Dear Friends,',
  );

  return (
    <>
      <span className="sr-only">{salutation}</span>
      <InvitationApp />
    </>
  );
}