/**
 * Sent when the invitation is opened with JavaScript unavailable — an in-app
 * reader, a crawler, or a browser where the bundle failed to execute.
 *
 * Without this the guest would see an unstyled, non-interactive opening, which
 * reads as a broken page. The invitation's essential facts are printed instead,
 * in the site's own visual language.
 */

export default function NoScript() {
  return (
    <noscript>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          padding: '2rem',
          textAlign: 'center',
          background: '#08080A',
          color: '#F4EFE4',
        }}
      >
        <p
          style={{
            letterSpacing: '0.42em',
            fontSize: '0.6875rem',
            opacity: 0.6,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          YASHASWINI MANJUNATH &nbsp;×&nbsp; SAGAR GIRISHA
        </p>
        <h1
          style={{
            fontFamily: 'Didot, Georgia, serif',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            margin: 0,
            letterSpacing: '0.04em',
          }}
        >
          26 November 2026
        </h1>
        <p
          style={{
            letterSpacing: '0.28em',
            fontSize: '0.75rem',
            opacity: 0.75,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          POORNIMA PALACE, DEVAM HALL &middot; BENGALURU
        </p>
        <p
          style={{
            maxWidth: '34ch',
            fontFamily: 'Didot, Georgia, serif',
            fontStyle: 'italic',
            fontSize: '1.0625rem',
            opacity: 0.6,
            lineHeight: 1.6,
          }}
        >
          Muhurtham 8:00–9:00 a.m. · Dhanur Lagna
        </p>
        <p
          style={{
            letterSpacing: '0.16em',
            fontSize: '0.625rem',
            opacity: 0.4,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Enable JavaScript to view the full invitation
        </p>
      </div>
    </noscript>
  );
}