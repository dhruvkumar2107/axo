import type { Metadata } from 'next';

/**
 * The guest list is not part of the invitation.
 *
 * `robots.txt` disallows `/admin` and `/api`, and this layout repeats the
 * instruction in the document head, because a private page that a search engine
 * indexes is a private page that eventually appears in someone's results.
 */
export const metadata: Metadata = {
  title: 'Guest list',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}