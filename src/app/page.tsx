import { InvitationApp } from '@/components/InvitationApp';

/**
 * The invitation itself.
 *
 * A single route, composed on the client, because the entire experience — the
 * opening, the palace, the reveal — is one continuous sequence that cannot be
 * split across server renders without flashing the first act away.
 *
 * `metadata` for the page lives in `layout.tsx`, which is what search engines
 * and WhatsApp read.
 */
export default function Page() {
  return <InvitationApp />;
}