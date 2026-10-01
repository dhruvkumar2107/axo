import { useId } from 'react';

import type { ProceduralArt } from '@/config/wedding.config';

/**
 * ============================================================================
 *  PROCEDURAL ARTWORK
 * ============================================================================
 *
 *  No photography has been supplied, and stock wedding imagery would cheapen
 *  the whole thing. Instead every frame is an *art-directed composition* drawn
 *  in SVG — architecture, material and light only, no people, no clipart.
 *
 *  They exist so that:
 *    · the layout can be judged at true proportion before a single photograph
 *      exists,
 *    · nothing on screen ever looks broken or empty,
 *    · dropping in a real photograph is a one-line change (set `src` on the
 *      frame in `wedding.config.ts`) and the composition is simply discarded.
 *
 *  Every gradient id is scoped with `useId` so that many instances on one page
 *  can never collide.
 */

export interface ProceduralArtProps {
  art: ProceduralArt;
  /** 'dark' for cinematic scenes, 'ivory' for the paper scenes. */
  tone?: 'dark' | 'ivory';
  className?: string;
}

export function ProceduralArt({ art, tone = 'dark', className }: ProceduralArtProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div
      className={`size-full ${tone === 'ivory' ? 'bg-ivory-soft' : 'bg-emerald-deep'} ${className ?? ''}`}
      data-art={art}
    >
      <svg
        viewBox="0 0 800 1000"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          {palette(id, tone)}
        </defs>
        <rect width="800" height="1000" fill={`url(#bg-${id})`} />
        {COMPOSITIONS[art](id, tone)}
        <rect width="800" height="1000" fill={`url(#grain-${id})`} />
      </svg>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Shared palette + light
   -------------------------------------------------------------------------- */

function palette(id: string, tone: 'dark' | 'ivory') {
  const dark = tone === 'dark';
  return (
    <>
      <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0.35" y2="1">
        {dark ? (
          <>
            <stop offset="0" stopColor="#0B241C" />
            <stop offset="0.55" stopColor="#071A14" />
            <stop offset="1" stopColor="#040C09" />
          </>
        ) : (
          <>
            <stop offset="0" stopColor="#FBF8F1" />
            <stop offset="0.6" stopColor="#F2EBDD" />
            <stop offset="1" stopColor="#E6DCC8" />
          </>
        )}
      </linearGradient>

      {/* Warm key light, low and slightly off-centre — the light of a lamp. */}
      <radialGradient id={`key-${id}`} cx="0.5" cy="0.86" r="0.62">
        <stop offset="0" stopColor={dark ? '#E8D9A0' : '#C9A227'} stopOpacity={dark ? 0.5 : 0.22} />
        <stop offset="0.45" stopColor={dark ? '#A8842B' : '#A8842B'} stopOpacity={dark ? 0.16 : 0.1} />
        <stop offset="1" stopColor="#000000" stopOpacity="0" />
      </radialGradient>

      <linearGradient id={`goldline-${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={dark ? '#4A370E' : '#C9A227'} stopOpacity="0.15" />
        <stop offset="0.5" stopColor={dark ? '#E8D9A0' : '#7A5F17'} stopOpacity="0.9" />
        <stop offset="1" stopColor={dark ? '#4A370E' : '#C9A227'} stopOpacity="0.15" />
      </linearGradient>

      <linearGradient id={`fold-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#000000" stopOpacity="0.45" />
        <stop offset="0.42" stopColor={dark ? '#123A2D' : '#E8DFCD'} stopOpacity="0.9" />
        <stop offset="0.58" stopColor={dark ? '#1E5142' : '#FBF8F1'} stopOpacity="0.95" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.4" />
      </linearGradient>

      <filter id={`grain-${id}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </>
  );
}

/** Shared: the grain overlay, drawn last so it sits over the composition. */
type Draw = (id: string, tone: 'dark' | 'ivory') => React.ReactNode;

const COMPOSITIONS: Record<ProceduralArt, Draw> = {
  /* --- A carved jharokha arch, backlit. Architecture and light only. ------ */
  jharokha: (id) => (
    <g>
      <rect width="800" height="1000" fill={`url(#bg-${id})`} />
      <circle cx="400" cy="790" r="420" fill={`url(#key-${id})`} />

      {/* Outer arch frame */}
      <path
        d="M170 1000 V430 C170 250 275 150 400 150 C525 150 630 250 630 430 V1000"
        fill="#000000"
        fillOpacity="0.42"
      />
      <path
        d="M170 1000 V430 C170 250 275 150 400 150 C525 150 630 250 630 430 V1000"
        fill="none"
        stroke={`url(#goldline-${id})`}
        strokeWidth="2"
      />

      {/* Inner arch — the aperture, filled with warm light */}
      <path
        d="M222 1000 V442 C222 292 300 202 400 202 C500 202 578 292 578 442 V1000 Z"
        fill={`url(#key-${id})`}
      />
      <path
        d="M222 1000 V442 C222 292 300 202 400 202 C500 202 578 292 578 442 V1000 Z"
        fill="none"
        stroke={`url(#goldline-${id})`}
        strokeWidth="1.25"
        opacity="0.75"
      />

      {/* Pierced lattice — the jali */}
      <g stroke={`url(#goldline-${id})`} strokeWidth="1.4" fill="none" opacity="0.62">
        {Array.from({ length: 7 }).map((_, i) => (
          <path
            key={i}
            d={`M240 ${320 + i * 92} H560`}
            strokeDasharray="3 9"
            strokeLinecap="round"
          />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <path
            key={i}
            d={`M${258 + i * 30} 240 V1000`}
            strokeDasharray="3 11"
            strokeLinecap="round"
            opacity="0.6"
          />
        ))}
      </g>

      {/* Central finial */}
      <circle cx="400" cy="196" r="7" fill={`url(#goldline-${id})`} />
      <path d="M400 150 V178" stroke={`url(#goldline-${id})`} strokeWidth="1.5" />
    </g>
  ),

  /* --- A toran: marigold and leaf garland hung across the frame. --------- */
  toran: (id, tone) => (
    <g>
      <rect width="800" height="1000" fill={`url(#bg-${id})`} />
      <circle cx="400" cy="700" r="380" fill={`url(#key-${id})`} />

      {/* The cord, sagging under its own weight */}
      <path
        d="M-20 60 Q400 300 820 60"
        fill="none"
        stroke={tone === 'dark' ? '#7A5F17' : '#A8842B'}
        strokeWidth="3"
        opacity="0.85"
      />

      {/* Leaves and marigolds along the arc */}
      {Array.from({ length: 15 }).map((_, i) => {
        const t = i / 14;
        const x = -20 + t * 840;
        const y = 60 + Math.sin(t * Math.PI) * 240;
        const r = 15 + Math.sin(t * Math.PI) * 9;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            {/* leaf */}
            <path
              d={`M0 6 Q${-16} 34 0 62 Q${16} 34 0 6 Z`}
              fill={tone === 'dark' ? '#1E5142' : '#B99B63'}
              opacity="0.8"
            />
            {/* marigold */}
            <circle cx="0" cy="74" r={r} fill={`url(#goldline-${id})`} opacity="0.9" />
            <circle cx="0" cy="74" r={r * 0.55} fill={tone === 'dark' ? '#6B4E12' : '#C9A227'} opacity="0.7" />
          </g>
        );
      })}

      {/* Falling petals, sparse and slow */}
      {([
        [140, 560, 7],
        [300, 720, 5],
        [520, 620, 8],
        [660, 800, 6],
        [400, 880, 5],
      ] as const).map(([x, y, r], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx={r}
          ry={r * 0.6}
          fill={`url(#goldline-${id})`}
          opacity="0.35"
          transform={`rotate(${20 + i * 27} ${x} ${y})`}
        />
      ))}
    </g>
  ),

  /* --- Veined marble, lit from one side. --------------------------------- */
  marble: (id, tone) => (
    <g>
      <rect width="800" height="1000" fill={tone === 'dark' ? '#0A1512' : '#F4EFE4'} />
      <circle cx="620" cy="260" r="520" fill={`url(#key-${id})`} />

      <g opacity={tone === 'dark' ? 0.5 : 0.75}>
        <path
          d="M-40 180 C160 240 210 60 400 120 C600 184 640 40 860 96"
          fill="none"
          stroke={tone === 'dark' ? '#2A5445' : '#C9BCA0'}
          strokeWidth="2.4"
        />
        <path
          d="M-40 236 C170 300 240 120 420 176 C620 240 660 110 860 160"
          fill="none"
          stroke={tone === 'dark' ? '#1E5142' : '#D8CCB2'}
          strokeWidth="1.4"
        />
        <path
          d="M-40 620 C180 560 260 700 440 640 C620 580 700 720 860 664"
          fill="none"
          stroke={tone === 'dark' ? '#2A5445' : '#C9BCA0'}
          strokeWidth="2"
        />
        <path
          d="M-40 690 C200 630 280 760 460 706 C640 652 720 786 860 730"
          fill="none"
          stroke={tone === 'dark' ? '#1E5142' : '#D8CCB2'}
          strokeWidth="1.1"
        />
        <path
          d="M120 1000 C200 820 140 700 240 560 C330 434 300 320 380 200"
          fill="none"
          stroke={tone === 'dark' ? '#1E5142' : '#D8CCB2'}
          strokeWidth="1.2"
        />
      </g>

      {/* A single gold inlay — the only hard edge in a soft material */}
      <path
        d="M120 900 L680 120"
        stroke={`url(#goldline-${id})`}
        strokeWidth="1.6"
        opacity="0.85"
      />
      <circle cx="680" cy="120" r="4.5" fill={`url(#goldline-${id})`} />
    </g>
  ),

  /* --- Draped silk. Fold structure only. --------------------------------- */
  silk: (id, tone) => (
    <g>
      <rect width="800" height="1000" fill={`url(#bg-${id})`} />
      <circle cx="400" cy="620" r="440" fill={`url(#key-${id})`} />

      {Array.from({ length: 9 }).map((_, i) => {
        const x = -120 + i * 130;
        return (
          <path
            key={i}
            d={`M${x} -40 C${x + 90} 240 ${x - 70} 560 ${x + 40} 1040`}
            fill="none"
            stroke={`url(#fold-${id})`}
            strokeWidth={i % 2 ? 44 : 62}
            opacity={i % 2 ? 0.55 : 0.75}
          />
        );
      })}

      {/* Highlight along each fold crest */}
      {Array.from({ length: 9 }).map((_, i) => {
        const x = -120 + i * 130;
        return (
          <path
            key={i}
            d={`M${x + 26} -40 C${x + 116} 240 ${x - 44} 560 ${x + 66} 1040`}
            fill="none"
            stroke={tone === 'dark' ? '#E8D9A0' : '#FFFFFF'}
            strokeWidth="1.1"
            opacity="0.24"
          />
        );
      })}

      {/* A zari thread woven through */}
      <path
        d="M-40 300 Q200 240 400 320 T840 300"
        fill="none"
        stroke={`url(#goldline-${id})`}
        strokeWidth="1.8"
        opacity="0.7"
      />
    </g>
  ),

  /* --- A row of oil lamps at dusk. Warmth, reflection, nothing else. ----- */
  diya: (id, tone) => (
    <g>
      <rect width="800" height="1000" fill={`url(#bg-${id})`} />
      <circle cx="400" cy="560" r="470" fill={`url(#key-${id})`} />

      {/* Surface line */}
      <path d="M0 640 H800" stroke={`url(#goldline-${id})`} strokeWidth="1" opacity="0.45" />

      {([
        [120, 620, 1],
        [260, 650, 1.22],
        [400, 672, 1.45],
        [540, 650, 1.22],
        [680, 620, 1],
      ] as const).map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          {/* glow */}
          <circle cx="0" cy="-34" r="70" fill={`url(#key-${id})`} opacity="0.9" />
          {/* clay bowl */}
          <path
            d="M-30 -6 Q0 22 30 -6 Q22 -14 0 -14 Q-22 -14 -30 -6 Z"
            fill={tone === 'dark' ? '#2A1A0C' : '#8A6A3A'}
            opacity="0.95"
          />
          {/* flame */}
          <path
            d="M0 -14 C-9 -26 -5 -36 0 -52 C5 -36 9 -26 0 -14 Z"
            fill={tone === 'dark' ? '#E8D9A0' : '#C9A227'}
            opacity="0.95"
          />
          {/* reflection */}
          <path
            d="M-8 6 L-3 46 L3 46 L8 6 Z"
            fill={tone === 'dark' ? '#E8D9A0' : '#C9A227'}
            opacity="0.16"
          />
        </g>
      ))}
    </g>
  ),

  /* --- Lotus and marigold, drawn as line art. ---------------------------- */
  lotus: (id, tone) => (
    <g>
      <rect width="800" height="1000" fill={`url(#bg-${id})`} />
      <circle cx="400" cy="560" r="430" fill={`url(#key-${id})`} />

      {([
        [400, 430, 250],
        [220, 700, 170],
        [590, 690, 175],
      ] as const).map(([cx, cy, r], k) => (
        <g key={k}>
          {/* petals radiating from the centre */}
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2;
            const inner = r * 0.2;
            const outer = r * (i % 2 ? 0.92 : 1);
            const x1 = cx + Math.cos(a) * inner;
            const y1 = cy + Math.sin(a) * inner;
            const x2 = cx + Math.cos(a) * outer;
            const y2 = cy + Math.sin(a) * outer;
            const c1 = cx + Math.cos(a - 0.16) * outer * 0.9;
            const c1y = cy + Math.sin(a - 0.16) * outer * 0.9;
            const c2 = cx + Math.cos(a + 0.16) * outer * 0.9;
            const c2y = cy + Math.sin(a + 0.16) * outer * 0.9;
            return (
              <path
                key={i}
                d={`M${x1} ${y1} Q${c1} ${c1y} ${x2} ${y2} Q${c2} ${c2y} ${x1} ${y1} Z`}
                fill="none"
                stroke={`url(#goldline-${id})`}
                strokeWidth="1.1"
                opacity={i % 2 ? 0.4 : 0.62}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={r * 0.16} fill="none" stroke={`url(#goldline-${id})`} strokeWidth="1.2" opacity="0.8" />
          <circle cx={cx} cy={cy} r={r * 0.07} fill={`url(#goldline-${id})`} opacity="0.7" />
        </g>
      ))}

      {/* A few stems, to tie the composition together */}
      <path
        d="M400 430 C396 600 380 720 340 1000"
        fill="none"
        stroke={tone === 'dark' ? '#1E5142' : '#B99B63'}
        strokeWidth="1.6"
        opacity="0.5"
      />
    </g>
  ),

  /* --- Henna: a mandala built from arcs and dots. ------------------------ */
  mehndi: (id, tone) => (
    <g>
      <rect width="800" height="1000" fill={tone === 'dark' ? '#0B241C' : '#FBF8F1'} />
      <circle cx="400" cy="500" r="420" fill={`url(#key-${id})`} opacity="0.7" />

      <g transform="translate(400 500)">
        {/* Concentric rings */}
        {[300, 250, 190, 120, 60].map((r, i) => (
          <circle
            key={r}
            r={r}
            fill="none"
            stroke={`url(#goldline-${id})`}
            strokeWidth={i === 2 ? 1.8 : 0.9}
            opacity={0.5 - i * 0.05}
          />
        ))}

        {/* Scallop petals on two rings */}
        {[190, 120].map((r, ring) =>
          Array.from({ length: 12 + ring * 6 }).map((_, i) => {
            const a = (i / (12 + ring * 6)) * Math.PI * 2;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            const s = r * 0.16;
            return (
              <path
                key={`${ring}-${i}`}
                d={`M${x} ${y} Q${x + Math.cos(a - 0.5) * s} ${y + Math.sin(a - 0.5) * s} ${x + Math.cos(a) * s * 1.3} ${y + Math.sin(a) * s * 1.3} Q${x + Math.cos(a + 0.5) * s} ${y + Math.sin(a + 0.5) * s} ${x} ${y}`}
                fill="none"
                stroke={`url(#goldline-${id})`}
                strokeWidth="0.9"
                opacity="0.55"
              />
            );
          }),
        )}

        {/* Paisley corner motifs */}
        {[45, 135, 225, 315].map((deg) => (
          <g key={deg} transform={`rotate(${deg}) translate(0 -250)`}>
            <path
              d="M0 -30 C22 -22 30 0 18 20 C10 32 -10 32 -18 20 C-8 22 2 8 -4 -6 C-8 -16 -6 -26 0 -30 Z"
              fill="none"
              stroke={`url(#goldline-${id})`}
              strokeWidth="1.1"
              opacity="0.6"
            />
            <circle cx="0" cy="-2" r="3" fill={`url(#goldline-${id})`} opacity="0.7" />
          </g>
        ))}

        {/* Centre rosette */}
        <circle r="26" fill="none" stroke={`url(#goldline-${id})`} strokeWidth="1.4" opacity="0.85" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={Math.cos(a) * 13}
              cy={Math.sin(a) * 13}
              r="3"
              fill={`url(#goldline-${id})`}
              opacity="0.7"
            />
          );
        })}
      </g>
    </g>
  ),

  /* --- The couple, distant, in an arch of light. Line art only. ---------
     Drawn small and in hairline gold so it reads as art direction rather
     than as illustration. Once real photography arrives, this composition is
     simply discarded in favour of it.
     -------------------------------------------------------------------- */
  couple: (id) => (
    <g>
      <rect width="800" height="1000" fill={`url(#bg-${id})`} />
      <circle cx="400" cy="700" r="440" fill={`url(#key-${id})`} />

      {/* The arch they are standing in */}
      <path
        d="M212 1000 V470 C212 300 296 200 400 200 C504 200 588 300 588 470 V1000"
        fill="none"
        stroke={`url(#goldline-${id})`}
        strokeWidth="1.6"
        opacity="0.75"
      />
      <path
        d="M238 1000 V480 C238 322 312 228 400 228 C488 228 562 322 562 480 V1000"
        fill="none"
        stroke={`url(#goldline-${id})`}
        strokeWidth="0.8"
        opacity="0.45"
      />

      {/* Ground line */}
      <path
        d="M120 830 H680"
        stroke={`url(#goldline-${id})`}
        strokeWidth="0.9"
        opacity="0.5"
      />

      {/* Two figures, seen from behind, standing close */}
      <g
        transform="translate(400 830)"
        fill="none"
        stroke={`url(#goldline-${id})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      >
        {/* groom: broader shoulders, a sherwani line */}
        <g transform="translate(-30 0)">
          <circle cx="0" cy="-196" r="19" />
          <path d="M-40 -168 C-30 -178 30 -178 40 -168" />
          <path d="M-40 -168 C-46 -120 -44 -60 -40 -6 L40 -6 C44 -60 46 -120 40 -168" />
          <path d="M-16 -178 L0 -150 L16 -178" opacity="0.6" />
        </g>

        {/* bride: a sari drape and a longer line */}
        <g transform="translate(28 0)">
          <circle cx="0" cy="-200" r="17" />
          {/* the pallu falling over the shoulder */}
          <path d="M-14 -192 C-34 -168 -38 -120 -34 -60" opacity="0.75" />
          <path d="M32 -176 C40 -140 40 -80 36 -6 L-34 -6 C-38 -80 -36 -140 -28 -176" />
          <path d="M-28 -176 C-18 -186 18 -186 32 -176" />
          {/* hem, slightly pooled */}
          <path d="M-34 -6 C-18 4 18 4 36 -6" opacity="0.7" />
        </g>

        {/* the space between them, drawn closer */}
        <path d="M-30 -160 L-6 -150" opacity="0.4" />
        <path d="M28 -172 L10 -160" opacity="0.4" />
      </g>

      {/* Light falling past them, and their long shadows */}
      <g opacity="0.16">
        <path d="M370 830 L250 1000 L420 1000 Z" fill={`url(#goldline-${id})`} />
        <path d="M428 830 L480 1000 L640 1000 Z" fill={`url(#goldline-${id})`} />
      </g>
    </g>
  ),

  /* --- Warm light in a dark hall — a celebration, abstractly. ------------ */
  sangeet: (id, tone) => (
    <g>
      <rect width="800" height="1000" fill={`url(#bg-${id})`} />
      <circle cx="400" cy="620" r="500" fill={`url(#key-${id})`} />

      {/* Long light streaks, angled as if from hanging lanterns */}
      {([
        [140, -60, 320, 900, 2.2, 0.1],
        [300, -60, 400, 1000, 3.4, 0.14],
        [470, -60, 500, 960, 2.6, 0.11],
        [640, -60, 600, 880, 1.8, 0.09],
      ] as const).map(([x1, y1, x2, y2, w, o], i) => (
        <path
          key={i}
          d={`M${x1} ${y1} L${x2} ${y2}`}
          stroke={tone === 'dark' ? '#E8D9A0' : '#C9A227'}
          strokeWidth={w}
          opacity={o}
          strokeLinecap="round"
        />
      ))}

      {/* Bokeh — out-of-focus points of light, never multi-coloured */}
      {([
        [220, 380, 34, 0.16],
        [520, 300, 46, 0.13],
        [660, 560, 28, 0.14],
        [340, 660, 38, 0.12],
        [160, 700, 24, 0.11],
        [430, 180, 22, 0.1],
      ] as const).map(([cx, cy, r, o], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={tone === 'dark' ? '#E8D9A0' : '#C9A227'} opacity={o} />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={tone === 'dark' ? '#E8D9A0' : '#C9A227'}
            strokeWidth="0.8"
            opacity={o * 1.6}
          />
        </g>
      ))}

      {/* Floor line, to anchor the light */}
      <path d="M0 880 H800" stroke={`url(#goldline-${id})`} strokeWidth="1" opacity="0.4" />
    </g>
  ),
};

/** Convenience: the frame artwork used for the details scene. */
export const DETAIL_ART_ORDER: ProceduralArt[] = [
  'marble',
  'silk',
  'lotus',
  'diya',
  'mehndi',
  'toran',
];
