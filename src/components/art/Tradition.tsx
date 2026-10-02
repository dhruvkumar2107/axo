/**
 * ============================================================================
 *  TRADITION — Dravidian motifs as vector line work
 * ============================================================================
 *
 *  Every element in this file is drawn, not imported. That is deliberate:
 *
 *    · No request. A motif is markup the browser already has.
 *    · No rasterisation cost at the viewport edge. The one thing that measurably
 *      delayed first paint in the previous build was a full-bleed SVG filter,
 *      so nothing here uses `filter`, `feTurbulence` or a large blur.
 *    · Resolution-independent, and crisp on a 3× phone screen.
 *    · Themeable. Colour comes from CSS custom properties and `currentColor`,
 *      so a motif on cream paper and a motif on maroon velvet are the same
 *      drawing with a different `--motif` value.
 *
 *  The drawing rules that keep these from looking like clip-art:
 *
 *    1. Hairlines. Strokes are 1–1.5 units on a 200-unit canvas — drawn, not
 *       filled. Filled ornament reads as cheap; engraved line reads as metal.
 *    2. Symmetry from a mirrored half, never a traced photograph.
 *    3. Asymmetry in the *arrangement* (how many, where, how tilted) so the
 *       pattern does not read as a stamp.
 *    4. Every motif can be given a seed, so repeating it on a page produces
 *       varied geometry rather than the same stamp repeated.
 */

import { useId, type CSSProperties, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

/* ---------------------------------------------------------------------------
   Shared helpers
   --------------------------------------------------------------------------- */

/** Deterministic pseudo-random in [0,1) from a seed, so SSR and client agree. */
function rand(seed: number, salt: number): number {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

interface MotifProps {
  className?: string;
  /** Geometry seed. Same seed always draws the same thing. */
  seed?: number;
  style?: CSSProperties;
}

/* ===========================================================================
   1. TEMPLE ARCH — the kudu
   ===========================================================================
   The Dravidian arch is not a Roman semicircle. Its jambs rise vertically and
   then sweep inward on a flattened ogee to a slightly flattened apex, and the
   curve is *asymmetric in section* — tighter near the crown, generous near the
   springing. Drawing it as a semicircle is what makes most "Indian" web
   decoration read as costume.
   =========================================================================== */

export function TempleArch({
  className,
  style,
  ...rest
}: MotifProps & { children?: ReactNode }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <svg
      viewBox="0 0 200 260"
      className={cn('h-full w-full', className)}
      style={style}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      <defs>
        <clipPath id={`${id}-inner`}>
          <path d={archPath(200, 260, 0)} />
        </clipPath>
      </defs>

      {/* The opening. */}
      <path
        d={archPath(200, 260, 0)}
        stroke="var(--motif, var(--gold))"
        strokeWidth="1.1"
        opacity="0.5"
      />
      {/* A second, tighter line inside it — the reveal that gives depth. */}
      <path
        d={archPath(200, 260, 9)}
        stroke="var(--motif, var(--gold))"
        strokeWidth="0.6"
        opacity="0.3"
      />
      {/* Keystone boss at the crown, as on a carved lintel. */}
      <circle
        cx="100"
        cy="42"
        r="2.4"
        stroke="var(--motif, var(--gold))"
        strokeWidth="0.8"
        opacity="0.55"
      />
      <g clipPath={`url(#${id}-inner)`}>{rest.children}</g>
    </svg>
  );
}

/**
 * The kudu outline.
 *
 * Built from three segments — jamb, sweep, crown — because those are the three
 * things the eye reads as "this is a South Indian arch" rather than "this is a
 * doorway".
 */
function archPath(width: number, height: number, inset: number): string {
  const w = width - inset * 2;
  const base = height;
  const springLine = height * 0.52; // where the vertical jamb stops
  const halfW = w / 2;
  const x0 = inset;
  const crown = inset + 6;

  return [
    `M ${x0} ${base}`,
    `L ${x0} ${springLine}`,
    // The sweep: a cubic whose control points are pulled wide low and tight high.
    `C ${x0} ${height * 0.24}, ${crown + w * 0.16} ${height * 0.135}, ${width / 2} ${height * 0.135}`,
    `C ${crown + halfW - w * 0.16} ${height * 0.135}, ${x0 + w} ${height * 0.24}, ${x0 + w} ${springLine}`,
    `L ${x0 + w} ${base}`,
  ].join(' ');
}

/* ===========================================================================
   2. PILLAR — a lathe-turned column
   ===========================================================================
   Dravidian pillars are not round: they are faceted, with a pronounced capital
   (oturam) and base, and a swelling entasis. Drawn as a rectangle they read as
   scaffolding. This is the profile, mirrored.
   =========================================================================== */

export function Pillar({ className, style, ...rest }: MotifProps) {
  const profile = [
    'M 22 0',
    'L 30 0 L 30 7', // plinth
    'L 27 11 L 27 18', // base torus
    'L 24 22',
    'L 22.6 46', // entasis — the shaft swells then draws in
    'L 23.4 84',
    'L 25 96',
    'L 28 100 L 28 104', // neck
    'L 34 108 L 34 114', // capital
    'L 22 118 L 22 122',
  ];

  return (
    <svg
      viewBox="0 0 44 122"
      className={cn('h-full w-full', className)}
      style={style}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {/* The faceted shaft, hinted with two inner lines. */}
      <path d={profile.join(' ')} stroke="var(--motif, var(--gold))" strokeWidth="1" opacity="0.55" />
      <path
        d={profile.join(' ')}
        transform="translate(44 0) scale(-1 1)"
        stroke="var(--motif, var(--gold))"
        strokeWidth="1"
        opacity="0.55"
      />
      <path d="M 34 20 L 34 90" stroke="var(--motif, var(--gold))" strokeWidth="0.5" opacity="0.25" />
      <path d="M 30 18 L 30 92" stroke="var(--motif, var(--gold))" strokeWidth="0.5" opacity="0.25" />
    </svg>
  );
}

/* ===========================================================================
   3. GOPURAM — the tower, in silhouette
   ===========================================================================
   Used at very low opacity behind content. A gopuram is a stepped pyramid of
   diminishing storeys, each with its own cornice, crowned by finials. Drawn as
   a plain triangle it is a pyramid; drawn as storeys it is a temple.
   =========================================================================== */

export function Gopuram({
  className,
  seed = 3,
  style,
  ...rest
}: MotifProps) {
  const storeys = 7;
  const baseY = 250;
  const apexY = 34;
  const step = (baseY - apexY) / storeys;

  const tiers = Array.from({ length: storeys }, (_, i) => {
    const t = i / (storeys - 1);
    // Width shrinks non-linearly, the way a real gopuram tapers.
    const halfWidth = 118 * (1 - t * 0.72);
    const y = baseY - i * step;
    const cornice = halfWidth + 7;
    return { y, halfWidth, cornice, t };
  });

  return (
    <svg
      viewBox="0 0 240 260"
      className={cn('h-full w-full', className)}
      style={style}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {tiers.map((tier, i) => (
        <g key={i}>
          {/* The tapering body of the storey. */}
          <path
            d={`M ${120 - tier.halfWidth} ${tier.y} L ${120 + tier.halfWidth} ${tier.y}`}
            stroke="var(--motif, var(--gold))"
            strokeWidth="0.9"
            opacity={0.14 + (1 - tier.t) * 0.16}
          />
          {/* The cornice — the horizontal shadow line that reads as a storey. */}
          <path
            d={`M ${120 - tier.cornice} ${tier.y - 1} L ${120 + tier.cornice} ${tier.y - 1}`}
            stroke="var(--motif, var(--gold))"
            strokeWidth="0.6"
            opacity={0.1 + (1 - tier.t) * 0.14}
          />
          {/* Suggestion of sculpture in the niches of the lower tiers only. */}
          {i < 4 ? (
            <>
              <circle
                cx={120 - tier.halfWidth * 0.45}
                cy={tier.y - step * 0.5}
                r="2.1"
                stroke="var(--motif, var(--gold))"
                strokeWidth="0.5"
                opacity="0.18"
              />
              <circle
                cx={120 + tier.halfWidth * 0.45}
                cy={tier.y - step * 0.5}
                r="2.1"
                stroke="var(--motif, var(--gold))"
                strokeWidth="0.5"
                opacity="0.18"
              />
            </>
          ) : null}
        </g>
      ))}

      {/* The finial kalasams along the ridge. */}
      {[0, 1, 2].map((i) => {
        const x = 120 + (i - 1) * 13;
        const h = 12 + rand(seed, i) * 8;
        return (
          <g key={`f${i}`}>
            <path
              d={`M ${x} ${apexY + 4} C ${x - 4} ${apexY - h * 0.4}, ${x + 4} ${apexY - h * 0.4}, ${x} ${apexY - h}`}
              stroke="var(--motif, var(--gold))"
              strokeWidth="0.7"
              opacity="0.4"
            />
            <circle cx={x} cy={apexY - h - 1.6} r="1.4" fill="var(--motif, var(--gold))" opacity="0.45" />
          </g>
        );
      })}
    </svg>
  );
}

/* ===========================================================================
   4. KOLAM — drawn, not stamped
   ===========================================================================
   The defining behaviour of a kolam is that it is *drawn*: the artist lays a
   grid of rice-paste dots and pulls the line through them in one continuous
   motion. So it animates by drawing itself, via stroke-dashoffset, once, when
   it enters the viewport. That is the whole point — a pre-rendered kolam is a
   sticker, and it looks like one.
   =========================================================================== */

export function Kolam({
  className,
  seed: _seed = 5,
  style,
  animate = true,
  ...rest
}: MotifProps & { animate?: boolean }) {
  // A pulli grid. The loops are generated from the grid so the pattern is a real
  // weave rather than a texture swatch.
  const cells = 4;
  const span = 24;
  const origin = 20;
  const stepSize = span / cells;

  const loops: string[] = [];
  for (let r = 0; r < cells; r += 1) {
    for (let c = 0; c < cells; c += 1) {
      const x = origin + c * stepSize;
      const y = origin + r * stepSize;
      // Alternate the loop direction so the field reads as a woven lattice.
      const flip = (r + c) % 2 === 0;
      const k = stepSize * 0.46;
      loops.push(
        flip
          ? `M ${x} ${y} C ${x - k} ${y - k}, ${x + k} ${y + k}, ${x + stepSize} ${y + stepSize}`
          : `M ${x + stepSize} ${y} C ${x + stepSize + k} ${y - k}, ${x - k} ${y + k}, ${x} ${y + stepSize}`,
      );
    }
  }

  const path = loops.join(' ');

  return (
    <svg
      viewBox="0 0 70 70"
      className={cn('h-full w-full', className)}
      style={{ ...style, ...(animate ? { ['--kolam-draw' as string]: 'kolam-draw 5s ease-in-out infinite' } : null) }}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {/* The pulli grid — the rice-paste dots the line is pulled through. */}
      {Array.from({ length: cells + 1 }, (_, r) =>
        Array.from({ length: cells + 1 }, (_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={origin + c * stepSize}
            cy={origin + r * stepSize}
            r="0.7"
            fill="var(--motif, var(--gold))"
            opacity="0.32"
          />
        )),
      )}
      <path
        d={path}
        className={animate ? 'kolam-thread' : undefined}
        stroke="var(--motif, var(--gold))"
        strokeWidth="0.85"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

/* ===========================================================================
   5. JASMINE — a hanging garland
   ===========================================================================
   A toran is not a string of identical circles. Real jasmine is five-petalled,
   star-shaped, with two larger outer petals and three smaller inner ones, and
   the buds along the strand are closed. Flowers alternate open / bud, and the
   strand droops in a catenary rather than a straight line.
   =========================================================================== */

export function JasmineString({
  className,
  seed = 7,
  style,
  ...rest
}: MotifProps) {
  const count = 11;
  const width = 200;

  // A catenary-ish droop.
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const x = 12 + t * (width - 24);
    const y = 26 + Math.sin(t * Math.PI) * (30 + rand(seed, i) * 8);
    pts.push({ x, y });
  }
  const strand = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg
      viewBox="0 0 200 90"
      className={cn('h-full w-full', className)}
      style={style}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {/* The thread. */}
      <path d={strand} stroke="var(--motif, var(--turmeric, var(--gold)))" strokeWidth="0.9" opacity="0.5" />

      {pts.map((p, i) => {
        const open = i % 2 === 0;
        const scale = 0.82 + rand(seed, i + 40) * 0.34;
        if (!open) {
          // A bud: closed, teardrop, pointing along the strand.
          return (
            <g key={i} transform={`translate(${p.x} ${p.y}) scale(${scale})`}>
              <path
                d="M 0 -4.4 C 2.6 -2.2, 2.6 2.2, 0 4.4 C -2.6 2.2, -2.6 -2.2, 0 -4.4 Z"
                fill="var(--motif, var(--ivory))"
                stroke="var(--motif-line, var(--gold))"
                strokeWidth="0.5"
                opacity="0.92"
              />
            </g>
          );
        }
        return (
          // A five-petal jasmine flower: two wide outer petals, three narrow inner.
          <g key={i} transform={`translate(${p.x} ${p.y}) scale(${scale})`} opacity="0.96">
            {[0, 72, 144, 216, 288].map((deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-2.6"
                rx="1.5"
                ry="2.6"
                fill="var(--motif, var(--ivory))"
                stroke="var(--motif-line, var(--gold))"
                strokeWidth="0.4"
                transform={`rotate(${deg})`}
              />
            ))}
            <circle
              cx="0"
              cy="0"
              r="0.8"
              fill="var(--motif-line, var(--gold))"
              opacity="0.55"
            />
          </g>
        );
      })}

      {/* Mango leaves tucked into the strand — every second gap. */}
      {pts.slice(1, -1).filter((_, i) => i % 3 === 0).map((p, i) => (
        <path
          key={`leaf${i}`}
          d="M 0 0 C 4 -3.4, 9 -2.4, 11 0 C 9 2.4, 4 3.4, 0 0 Z"
          transform={`translate(${p.x + 3} ${p.y + 7}) rotate(${18 + rand(seed, i + 90) * 20})`}
          fill="var(--motif-leaf, var(--green-temple))"
          opacity="0.5"
        />
      ))}
    </svg>
  );
}

/* ===========================================================================
   6. BANANA LEAF — the offering plate
   ===========================================================================
   Wide, lanceolate, with a strong midrib and regular parallel veins. Used at
   low opacity behind cards and in corners. Half a leaf is usually enough.
   =========================================================================== */

export function BananaLeaf({
  className,
  seed = 11,
  style,
  ...rest
}: MotifProps) {
  const veins = Array.from({ length: 9 }, (_, i) => 6 + i * 11);

  return (
    <svg
      viewBox="0 0 200 80"
      className={cn('h-full w-full', className)}
      style={style}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {/* Blade. */}
      <path
        d="M 4 40 C 50 10, 130 6, 196 34 C 132 66, 50 66, 4 40 Z"
        fill="var(--motif-leaf, var(--green-temple))"
        opacity="0.16"
      />
      <path
        d="M 4 40 C 50 10, 130 6, 196 34 C 132 66, 50 66, 4 40 Z"
        stroke="var(--motif-leaf, var(--green-temple))"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Midrib. */}
      <path d="M 6 40 C 60 32, 140 30, 195 34" stroke="var(--motif-leaf, var(--green-temple))" strokeWidth="0.9" opacity="0.55" />
      {/* Veins, angled toward the tip the way a real blade runs. */}
      {veins.map((x, i) => (
        <path
          key={i}
          d={`M ${x} 37 C ${x + 6} ${34 + rand(seed, i) * 2}, ${x + 10} ${30}, ${x + 14} 27`}
          stroke="var(--motif-leaf, var(--green-temple))"
          strokeWidth="0.5"
          opacity="0.3"
        />
      ))}
      {/* Torn tip — a cut banana leaf never has a clean point. */}
      <path d="M 196 34 l -7 -3 M 196 34 l -6 4" stroke="var(--motif-leaf, var(--green-temple))" strokeWidth="0.5" opacity="0.35" />
    </svg>
  );
}

/* ===========================================================================
   7. DEEPAM — the brass lamp
   ===========================================================================
   A standing kuthuvilakku: foot, stem, bowl, and the flame. The flame is the
   only thing on this page permitted to move quickly, and it moves by
   * deforming its own outline rather than by sliding around.
   =========================================================================== */

export function Deepam({
  className,
  style,
  flame = true,
  ...rest
}: MotifProps & { flame?: boolean }) {
  return (
    <svg
      viewBox="0 0 60 120"
      className={cn('h-full w-full', className)}
      style={style}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {/* Foot. */}
      <ellipse cx="30" cy="110" rx="15" ry="4.5" fill="var(--motif-brass, var(--gold))" opacity="0.24" />
      <ellipse cx="30" cy="110" rx="15" ry="4.5" stroke="var(--motif-brass, var(--gold))" strokeWidth="0.8" opacity="0.6" />
      {/* Stem, with two collars. */}
      <path d="M 30 104 L 30 74" stroke="var(--motif-brass, var(--gold))" strokeWidth="2.4" opacity="0.4" />
      <path d="M 24 96 h 12 M 25 84 h 10" stroke="var(--motif-brass, var(--gold))" strokeWidth="1.2" opacity="0.65" />
      {/* The bowl: a shallow spouted lamp, not a cup. */}
      <path
        d="M 12 72 C 14 58, 24 52, 30 52 C 36 52, 46 58, 48 72 C 40 70, 20 70, 12 72 Z"
        fill="var(--motif-brass, var(--gold))"
        opacity="0.2"
      />
      <path
        d="M 12 72 C 14 58, 24 52, 30 52 C 36 52, 46 58, 48 72"
        stroke="var(--motif-brass, var(--gold))"
        strokeWidth="1.1"
        opacity="0.72"
      />
      <path d="M 12 72 C 20 70, 40 70, 48 72" stroke="var(--motif-brass, var(--gold))" strokeWidth="1" opacity="0.6" />

      {/* Wick. */}
      <path d="M 30 56 L 30 48" stroke="var(--motif-brass, var(--gold))" strokeWidth="0.9" opacity="0.5" />

      {flame ? (
        <>
          {/* The halo — a warm bloom, cheap because it is a radial gradient on a
              small element rather than a filter. */}
          <circle cx="30" cy="40" r="20" fill="url(#deepam-glow)" opacity="0.5" />
          {/* The flame. Two nested teardrops; the inner one is the hot core. */}
          <g className="deepam-flame">
            <path
              d="M 30 12 C 36 24, 40 30, 40 38 C 40 46, 35 51, 30 51 C 25 51, 20 46, 20 38 C 20 30, 24 24, 30 12 Z"
              fill="var(--motif-flame, var(--turmeric))"
              opacity="0.55"
            />
            <path
              d="M 30 26 C 33 33, 35 36, 35 40 C 35 45, 32.5 48, 30 48 C 27.5 48, 25 45, 25 40 C 25 36, 27 33, 30 26 Z"
              fill="var(--motif-core, var(--gold-pale))"
              opacity="0.85"
            />
          </g>
          <defs>
            <radialGradient id="deepam-glow">
              <stop offset="0%" stopColor="var(--motif-flame, var(--turmeric))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--motif-flame, var(--turmeric))" stopOpacity="0" />
            </radialGradient>
          </defs>
        </>
      ) : null}
    </svg>
  );
}

/* ===========================================================================
   8. TEMPLE BELL
   ===========================================================================
   The manjira hangs from a chain and swings. Drawn as a bell with a flared lip
   and a clapper; the swing is a transform on the group, so the chain stays put
   and only the bell turns.
   =========================================================================== */

export function TempleBell({
  className,
  style,
  ...rest
}: MotifProps) {
  return (
    <svg
      viewBox="0 0 40 70"
      className={cn('h-full w-full', className)}
      style={style}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {/* Chain, fixed. */}
      <path d="M 20 0 L 20 14" stroke="var(--motif-brass, var(--gold))" strokeWidth="0.7" opacity="0.5" />
      <g className="temple-bell-swing">
        {/* Crown loop. */}
        <circle cx="20" cy="17" r="2.6" stroke="var(--motif-brass, var(--gold))" strokeWidth="0.9" opacity="0.7" />
        {/* Body with a flared lip. */}
        <path
          d="M 20 20 C 27 22, 30 30, 30 40 L 33 52 C 33 55, 30 56, 20 56 C 10 56, 7 55, 7 52 L 10 40 C 10 30, 13 22, 20 20 Z"
          fill="var(--motif-brass, var(--gold))"
          opacity="0.18"
        />
        <path
          d="M 20 20 C 27 22, 30 30, 30 40 L 33 52 C 33 55, 30 56, 20 56 C 10 56, 7 55, 7 52 L 10 40 C 10 30, 13 22, 20 20 Z"
          stroke="var(--motif-brass, var(--gold))"
          strokeWidth="1"
          opacity="0.7"
        />
        {/* Engraved bands. */}
        <path d="M 11 44 C 16 46, 24 46, 29 44" stroke="var(--motif-brass, var(--gold))" strokeWidth="0.6" opacity="0.5" />
        <path d="M 9 50 C 15 52, 25 52, 31 50" stroke="var(--motif-brass, var(--gold))" strokeWidth="0.6" opacity="0.5" />
        {/* Clapper. */}
        <path d="M 20 56 L 20 61" stroke="var(--motif-brass, var(--gold))" strokeWidth="0.8" opacity="0.55" />
        <circle cx="20" cy="62" r="1.8" fill="var(--motif-brass, var(--gold))" opacity="0.5" />
      </g>
    </svg>
  );
}

/* ===========================================================================
   9. KALASH
   ===========================================================================
   The auspicious brass pot: a swelling belly, a narrow neck, a flared rim, a
   coconut on top. Drawn in line so it sits on cream paper without a heavy fill.
   =========================================================================== */

export function Kalash({ className, style, ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 60 76"
      className={cn('h-full w-full', className)}
      style={style}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {/* Coconut and mango leaves at the mouth. */}
      <circle cx="30" cy="9" r="5" fill="var(--motif-leaf, var(--green-temple))" opacity="0.35" />
      <path d="M 25 7 C 20 4, 16 5, 14 7 C 18 10, 22 10, 25 7 Z" fill="var(--motif-leaf, var(--green-temple))" opacity="0.3" />
      <path d="M 35 7 C 40 4, 44 5, 46 7 C 42 10, 38 10, 35 7 Z" fill="var(--motif-leaf, var(--green-temple))" opacity="0.3" />
      {/* Rim. */}
      <path d="M 20 16 L 40 16 L 38 20 L 22 20 Z" fill="var(--motif-brass, var(--gold))" opacity="0.28" />
      <path d="M 20 16 L 40 16" stroke="var(--motif-brass, var(--gold))" strokeWidth="0.9" opacity="0.7" />
      {/* Neck, then the belly. */}
      <path d="M 22 20 C 22 26, 14 30, 14 42 C 14 56, 22 64, 30 64 C 38 64, 46 56, 46 42 C 46 30, 38 26, 38 20 Z"
        fill="var(--motif-brass, var(--gold))" opacity="0.16" />
      <path d="M 22 20 C 22 26, 14 30, 14 42 C 14 56, 22 64, 30 64 C 38 64, 46 56, 46 42 C 46 30, 38 26, 38 20 Z"
        stroke="var(--motif-brass, var(--gold))" strokeWidth="1" opacity="0.7" />
      {/* Engraved waist bands. */}
      <path d="M 17 36 C 23 38, 37 38, 43 36" stroke="var(--motif-brass, var(--gold))" strokeWidth="0.6" opacity="0.5" />
      <path d="M 16 48 C 23 50, 37 50, 44 48" stroke="var(--motif-brass, var(--gold))" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}

/* ===========================================================================
   10. TORAN BORDER — the card edge
   ===========================================================================
   A premium wedding card is framed, not merely filled. This is that frame: a
   double gold rule, a mango-leaf run along the top, and small floral bosses at
   the corners. Drawn once and reused by absolute positioning, so a card keeps
   its frame without the frame ever entering the layout.
   =========================================================================== */

export function CardBorder({ className, style, ...rest }: MotifProps) {
  const motifs = Array.from({ length: 9 }, (_, i) => 20 + i * 20);

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn('h-full w-full', className)}
      style={style}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
      {...rest}
    >
      {/* Outer and inner rules. */}
      <rect x="1" y="1" width="198" height="198" stroke="var(--motif, var(--gold))" strokeWidth="0.9" opacity="0.45" />
      <rect x="5.5" y="5.5" width="189" height="189" stroke="var(--motif, var(--gold))" strokeWidth="0.4" opacity="0.3" />
      {/* Corner bosses. */}
      {([[6, 6], [194, 6], [6, 194], [194, 194]] as const).map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <path
            d={`M ${x} ${y + 7} L ${x} ${y} L ${x + 7} ${y}`}
            stroke="var(--motif, var(--gold))"
            strokeWidth="1.1"
            opacity="0.7"
          />
          <circle cx={x} cy={y} r="1.1" fill="var(--motif, var(--gold))" opacity="0.6" />
        </g>
      ))}
      {/* Mango-leaf run along the top edge. */}
      {motifs.map((x, i) => (
        <path
          key={i}
          d="M 0 0 C 3 -4, 9 -4, 12 0 C 9 4, 3 4, 0 0 Z"
          transform={`translate(${x - 6} 10.5)`}
          fill="var(--motif-leaf, var(--green-temple))"
          opacity="0.28"
        />
      ))}
    </svg>
  );
}

/* ===========================================================================
   11. SECTION DIVIDER — the lotus rule
   ===========================================================================
   A hairline that opens into a lotus at the centre. Used between scenes so the
   page has joints rather than seams.
   =========================================================================== */

export function LotusRule({ className, style, ...rest }: MotifProps) {
  return (
    <svg
      viewBox="0 0 200 24"
      className={cn('h-full w-full', className)}
      style={style}
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      <path d="M 4 12 L 82 12" stroke="var(--motif, var(--gold))" strokeWidth="0.7" opacity="0.35" />
      <path d="M 118 12 L 196 12" stroke="var(--motif, var(--gold))" strokeWidth="0.7" opacity="0.35" />
      {/* Centre lotus: three petals and a seed pod. */}
      <path d="M 100 5 C 96 9, 96 12, 100 15 C 104 12, 104 9, 100 5 Z" fill="var(--motif, var(--gold))" opacity="0.45" />
      <path d="M 100 8 C 93 9, 90 12, 94 15 C 97 14, 99 12, 100 8 Z" fill="var(--motif, var(--gold))" opacity="0.32" />
      <path d="M 100 8 C 107 9, 110 12, 106 15 C 103 14, 101 12, 100 8 Z" fill="var(--motif, var(--gold))" opacity="0.32" />
      <circle cx="100" cy="17" r="1.3" fill="var(--motif, var(--gold))" opacity="0.5" />
      {/* Small flanking buds. */}
      <circle cx="90" cy="12" r="1" fill="var(--motif, var(--gold))" opacity="0.35" />
      <circle cx="110" cy="12" r="1" fill="var(--motif, var(--gold))" opacity="0.35" />
    </svg>
  );
}