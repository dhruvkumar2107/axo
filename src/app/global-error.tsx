'use client';

/**
 * Last line of defence.
 *
 * Replaces the entire document — including its own `<html>` and `<body>` — when
 * even the root layout fails to render. Without this, a root-level fault leaves
 * a blank white page, which is the worst possible outcome for an invitation.
 *
 * Everything here is inline and unstyled on purpose: no font, no stylesheet, no
 * script, nothing that could itself be the thing that failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[invitation] global error:', error);

  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#08080A',
          color: '#F4EFE4',
          fontFamily: 'Didot, Georgia, serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <main role="alert">
          <p style={{ letterSpacing: '0.42em', fontSize: '0.75rem', opacity: 0.7 }}>
            GIRISHA SAGAR &amp; YASHASWINI
          </p>
          <h1 style={{ fontWeight: 300, fontSize: '2rem', margin: '1.25rem 0' }}>
            17 October
          </h1>
          <p style={{ opacity: 0.7, letterSpacing: '0.16em', fontSize: '0.75rem' }}>
            KANAKAPURA, KARNATAKA
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              background: 'none',
              border: '1px solid rgba(201,162,39,0.5)',
              color: '#E8D9A0',
              padding: '0.85rem 1.75rem',
              letterSpacing: '0.28em',
              fontSize: '0.6875rem',
              cursor: 'pointer',
            }}
          >
            RELOAD
          </button>
        </main>
      </body>
    </html>
  );
}