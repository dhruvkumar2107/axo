'use client';

import { useCallback, useState } from 'react';

import { useAudio } from '@/lib/audio';
import { config, site } from '@/lib/site';
import {
  INSTAGRAM_URL,
  canNativeShare,
  copyText,
  currentOrigin,
  invitationUrl,
  nativeShare,
  shareMessage,
  whatsappUrl,
} from '@/lib/share';

/**
 * SHARE THE INVITATION
 *
 * WhatsApp first, because that is how this invitation will actually travel.
 * Copy Link and the native share sheet follow. Instagram is offered honestly:
 * the app has no public web link-share endpoint, so the button copies the link
 * and opens the app rather than opening a share dialog that does nothing.
 */

export function ShareActions({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { cue } = useAudio();
  const [notice, setNotice] = useState<string | null>(null);

  const say = useCallback(
    (message: string) => {
      cue('chime');
      setNotice(message);
      window.setTimeout(() => setNotice(null), 2800);
    },
    [cue],
  );

  const onCopy = useCallback(async () => {
    const ok = await copyText(invitationUrl());
    say(ok ? 'Link copied' : 'Copy the address bar to share');
  }, [say]);

  const onNative = useCallback(async () => {
    const result = await nativeShare();
    if (result === 'shared') say('Invitation shared');
    else if (result === 'unavailable') await onCopy();
    // 'cancelled' needs no message at all.
  }, [say, onCopy]);

  const onInstagram = useCallback(async () => {
    await copyText(invitationUrl());
    say('Link copied — paste it into a message');
    window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer');
  }, [say]);

  const buttonClass = 'seal-button seal-button--ghost !px-5 !py-3 !text-[0.5rem] !tracking-[0.22em]';

  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ''}`}>
      <div
        className={
          compact
            ? 'flex flex-wrap items-center justify-center gap-3'
            : 'flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4'
        }
      >
        <a
          className={buttonClass}
          href={whatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => cue('chime')}
        >
          WhatsApp
        </a>

        <button type="button" className={buttonClass} onClick={onCopy}>
          Copy Link
        </button>

        <button type="button" className={buttonClass} onClick={onInstagram}>
          Instagram
        </button>

        {canNativeShare() ? (
          <button type="button" className={buttonClass} onClick={onNative}>
            Share
          </button>
        ) : null}
      </div>

      {/* The exact message a guest will send, shown so nothing is a surprise. */}
      <p className="measure max-w-[46ch] text-center font-display text-[clamp(0.78rem,3vw,0.9rem)] italic leading-relaxed text-ivory/40">
        &ldquo;{shareMessage(currentOrigin() || invitationUrl())}&rdquo;
      </p>

      <p className="label min-h-[1.2em] text-center text-[0.5rem] text-gold/70" aria-live="polite">
        {notice ?? ''}
      </p>

      <p className="sr-only">
        Sharing this invitation shares the link to {site.names}, {site.dateLabel}, {config.location.city}.
      </p>
    </div>
  );
}
