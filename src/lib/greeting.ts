/**
 * Personalised invitations.
 *
 * `/invite/raj-family` should say "Dear Raj Family," without the family having
 * to touch any code. Three cases, in order of preference:
 *
 *   1. An explicit entry in `config.invites` — always wins.
 *   2. A hyphenated name  → "Dear Raj Family,"
 *   3. "mr-and-mrs-rao"    → "Dear Mr. & Mrs. Rao,"
 *
 * Anything else falls back to the couple's own address, which is what an
 * unrecognised link should gracefully become.
 */

export interface InviteDefinition {
  slug: string;
  salutation: string;
}

const TITLE_CASE = /\b\p{Lu}/u;

function toTitleCase(value: string): string {
  return value.replace(/\b\p{L}[\p{L}']*/gu, (word) =>
    TITLE_CASE.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );
}

/** `raj-family` → `Raj Family` */
function hyphenToName(slug: string): string {
  return toTitleCase(slug.replace(/[-_]+/g, ' ').trim());
}

export function resolveSalutation(
  slug: string | null | undefined,
  invites: InviteDefinition[],
  fallback: string,
): string {
  if (!slug) return fallback;

  const normalised = slug.trim().toLowerCase();
  const configured = invites.find((entry) => entry.slug.trim().toLowerCase() === normalised);
  if (configured) return configured.salutation;

  // "mr-and-mrs-rao" / "mr-mrs-rao" / "sharma-family"
  const tokens = normalised.split(/[-_\s]+/).filter(Boolean);
  if (tokens.length === 0) return fallback;

  const isMrAndMrs =
    tokens[0] === 'mr' &&
    (tokens.includes('and') ? tokens.includes('mrs') : tokens[1] === 'mrs');

  if (isMrAndMrs) {
    const surname = hyphenToName(
      normalised
        .replace(/^mr[-_\s]*(and[-_\s]*)?mrs[-_\s]*/, '')
        .replace(/^and[-_\s]*/, ''),
    );
    if (surname) return `Dear Mr. & Mrs. ${surname},`;
  }

  const name = hyphenToName(normalised);
  return name ? `Dear ${name},` : fallback;
}

/** Read the slug out of a pathname, if this is a personalised link. */
export function slugFromPathname(pathname: string): string | null {
  const match = /^\/invite\/([^/?#]+)\/?$/.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}
