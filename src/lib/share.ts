/**
 * Sharing.
 *
 * WhatsApp is the channel this invitation will actually travel through — most
 * guests will first see it in that app — so it gets a properly pre-written
 * message rather than a bare URL. Every other target is a genuine capability:
 * where a platform has no link-share API we say so rather than pretending.
 */

import { config, site } from '@/lib/site';

/** Absolute origin of the current visit, for links that must work off-site. */
export function currentOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

/** Absolute URL of this invitation, including any personalised slug. */
export function invitationUrl(origin = currentOrigin()): string {
  return origin ? `${origin}/` : '/';
}

function fill(template: string, url: string): string {
  return template
    .replace(/\{names\}/g, site.names)
    .replace(/\{date\}/g, site.dateLabel)
    .replace(/\{location\}/g, config.location.label)
    .replace(/\{url\}/g, url);
}

export function shareMessage(url = invitationUrl()): string {
  return fill(config.share.whatsappMessage, url);
}

export function whatsappUrl(url = invitationUrl()): string {
  return `https://wa.me/?text=${encodeURIComponent(shareMessage(url))}`;
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  // Older Safari and insecure origins have no async clipboard.
  try {
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

/** True when the platform offers a real share sheet we can use. */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function nativeShare(url = invitationUrl()): Promise<'shared' | 'cancelled' | 'unavailable'> {
  if (!canNativeShare()) return 'unavailable';
  try {
    await navigator.share({
      title: `${site.names} — Wedding Invitation`,
      text: shareMessage(url),
      url,
    });
    return 'shared';
  } catch (error) {
    // AbortError means the guest closed the sheet — not a failure worth showing.
    return (error as Error)?.name === 'AbortError' ? 'cancelled' : 'unavailable';
  }
}

/**
 * Instagram has no public web link-share endpoint. Rather than opening a dead
 * share dialog, we copy the link and open the app so the guest can paste it —
 * which is exactly the flow Instagram asks people to use anyway.
 */
export const INSTAGRAM_URL = 'https://www.instagram.com/';
