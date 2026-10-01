'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * ============================================================================
 *  ERROR BOUNDARY
 * ============================================================================
 *
 *  The invitation has one non-negotiable rule: the guest must always be able to
 *  reach the details of the wedding. A failed WebGL context, a broken image, a
 *  malformed audio file or a bug in one scene must never take the whole thing
 *  down — and above all must never leave someone staring at a loading screen.
 *
 *  Used in three places:
 *
 *    · around the WebGL entry scene, so a GPU failure falls back to the 2.5D one
 *    · around individual scenes, so one broken section degrades in isolation
 *    · at the route level (`error.tsx`, `global-error.tsx`)
 *
 *  The fallback is deliberately *useful* rather than apologetic: it names the
 *  date and the place, so even a total failure still tells the guest what they
 *  came for.
 */

interface Props {
  children: ReactNode;
  /** Rendered instead of the children when something throws. */
  fallback?: ReactNode;
  /** Notified on failure — used to demote 3D to the 2.5D path. */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Shown in the default fallback, so the guest knows what is still available. */
  label?: string;
}

interface State {
  failed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced rather than swallowed: a console-clean site is a requirement, and
    // an error that leaves no trace is an error nobody will ever fix.
    console.error('[invitation] a section failed to render:', error, info.componentStack);
    try {
      this.props.onError?.(error, info);
    } catch {
      /* the notifier must never itself throw */
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return <QuietFallback label={this.props.label} />;
  }
}

/**
 * The default: the section disappears, the page keeps its shape. Used for
 * decorative scenes, where an empty space is a better outcome than a stack
 * trace shown to a wedding guest.
 */
function QuietFallback({ label }: { label?: string }) {
  return (
    <section
      aria-label={label}
      className="relative flex min-h-[60svh] w-full items-center justify-center overflow-hidden bg-ink"
    >
      {/* Keeps the act from reading as a broken hole in the page. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at 50% 42%, rgba(201,162,39,0.07) 0%, rgba(12,43,34,0.14) 42%, transparent 72%)',
        }}
      />
      <span
        aria-hidden="true"
        className="block h-px w-[min(38vw,9rem)] bg-gradient-to-r from-transparent via-gold/30 to-transparent"
      />
    </section>
  );
}