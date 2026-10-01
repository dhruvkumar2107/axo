import { ImageResponse } from 'next/og';

import { weddingConfig } from '@/config/wedding.config';
import { site } from '@/lib/site';

/**
 * ============================================================================
 *  /api/og — the invitation as a picture
 * ============================================================================
 *
 *  This is what appears when the link is pasted into WhatsApp, which is where
 *  almost every guest will first see it. It is generated rather than shipped as
 *  a file so it can never disagree with the configuration: change the date and
 *  the preview changes with it.
 *
 *  Drawn with satori's flexbox subset — no external font is fetched, so the
 *  route cannot fail because a third party is slow.
 */

export const runtime = 'nodejs';
export const revalidate = 3600;

const GOLD = '#C9A227';
const GOLD_LIGHT = '#E8D9A0';
const IVORY = '#F4EFE4';
const INK = '#08080A';

export async function GET() {
  const { groom, bride, monogram, monogramGlyph } = weddingConfig.meta;
  const letters = monogram.replace(/[^A-Za-z]/g, '').toUpperCase();
  const first = letters.charAt(0) || 'G';
  const second = letters.charAt(1) || first;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: INK,
          backgroundImage: `radial-gradient(circle at 50% 118%, ${GOLD}33 0%, transparent 62%)`,
          color: IVORY,
          fontFamily: 'serif',
          gap: 28,
        }}
      >
        {/* The monogram, as a gold rule with the glyph between two bars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 2, backgroundColor: `${GOLD}80` }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              fontSize: 58,
              color: GOLD_LIGHT,
              letterSpacing: 6,
            }}
          >
            {first}
            <span style={{ opacity: 0.5, fontSize: 32 }}>{monogramGlyph}</span>
            {second}
          </div>
          <div style={{ width: 72, height: 2, backgroundColor: `${GOLD}80` }} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            marginTop: 12,
          }}
        >
          <div style={{ fontSize: 92, letterSpacing: 2, lineHeight: 1.05 }}>{groom.toUpperCase()}</div>
          <div style={{ fontSize: 92, letterSpacing: 2, lineHeight: 1.05 }}>{bride.toUpperCase()}</div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginTop: 26,
            fontSize: 26,
            letterSpacing: 10,
            color: GOLD_LIGHT,
            fontFamily: 'sans-serif',
          }}
        >
          <span>{site.dateLabel.toUpperCase()}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginTop: 14,
            fontSize: 24,
            letterSpacing: 8,
            color: `${IVORY}99`,
            fontFamily: 'sans-serif',
          }}
        >
          <span>
            {weddingConfig.location.city.toUpperCase()} &middot;{' '}
            {weddingConfig.location.state.toUpperCase()}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}