import type { Config } from 'tailwindcss';

/**
 * The palette is intentionally narrow. Luxury here comes from restraint.
 *
 * Warm ivory is the page; ink is the type. Maroon and temple green are the two
 * accents, carried by silk and leaf; antique gold is the line work that ties
 * them together. Every value is read from a CSS custom property so that the
 * motif layer in `globals.css` and the utility classes here cannot drift apart.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: 'rgb(var(--ivory))',
          soft: 'rgb(var(--ivory-soft))',
          deep: 'rgb(var(--ivory-deep))',
          warm: 'rgb(var(--ivory-warm))',
          turmeric: 'rgb(var(--ivory-turmeric))',
        },
        gold: {
          DEFAULT: 'rgb(var(--gold))',
          light: 'rgb(var(--gold-light))',
          pale: 'rgb(var(--gold-pale))',
          antique: 'rgb(var(--gold-antique))',
          deep: 'rgb(var(--gold-deep))',
          shadow: 'rgb(var(--gold-shadow))',
        },
        /* Banana leaf, mango leaf, the garland. */
        templegreen: {
          DEFAULT: 'rgb(var(--green-temple))',
          deep: 'rgb(var(--green-temple-deep))',
          muted: 'rgb(var(--green-temple-muted))',
        },
        /* The silk. Deep and dusty, never a bright red. */
        maroon: {
          DEFAULT: 'rgb(var(--maroon))',
          rich: 'rgb(var(--maroon-rich))',
          deep: 'rgb(var(--maroon-deep))',
          muted: 'rgb(var(--maroon-muted))',
        },
        /* Shaded terracotta of painted temple plaster. */
          templered: {
          DEFAULT: 'rgb(var(--temple-red))',
          deep: 'rgb(var(--temple-red-deep))',
        },
        /* Flame, marigold, haldi. */
        turmeric: {
          DEFAULT: 'rgb(var(--turmeric))',
          soft: 'rgb(var(--turmeric-soft))',
        },
        /* The night act: opening and palace. */
        emerald: {
          DEFAULT: 'rgb(var(--emerald))',
          rich: 'rgb(var(--emerald-rich))',
          deep: 'rgb(var(--emerald-deep))',
          muted: 'rgb(var(--emerald-muted, 30 90 70))',
        },
        burgundy: {
          DEFAULT: 'rgb(var(--burgundy))',
          rich: 'rgb(var(--maroon-rich))',
          muted: 'rgb(var(--burgundy-muted))',
        },
        /* Type colour on paper. */
        ink: {
          DEFAULT: 'rgb(var(--ink))',
          soft: 'rgb(var(--ink-warm-soft))',
          muted: 'rgb(var(--ink-warm-faint))',
        },
        /* Warm near-black, for type set on ivory paper. */
        inkwarm: {
          DEFAULT: 'rgb(var(--ink-warm))',
          soft: 'rgb(var(--ink-warm-soft))',
          faint: 'rgb(var(--ink-warm-faint))',
        },
        brass: {
          DEFAULT: 'rgb(var(--gold))',
          deep: 'rgb(var(--gold-deep))',
        },
      },
      fontFamily: {
        // Two families, both loaded. `--font-editorial` is kept as an alias so a
        // future face can be introduced without touching every call site.
        display: ['var(--font-cormorant)', 'Didot', 'Bodoni MT', 'serif'],
        editorial: ['var(--font-cormorant)', 'Didot', 'Bodoni MT', 'serif'],
        sans: ['var(--font-manrope)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        'ultra-wide': '0.42em',
        'cinematic': '0.28em',
        'hairline': '0.16em',
      },
      fontSize: {
        'fluid-xs': ['clamp(0.625rem, 0.55rem + 0.3vw, 0.75rem)', { lineHeight: '1.6' }],
        'fluid-sm': ['clamp(0.75rem, 0.68rem + 0.35vw, 0.875rem)', { lineHeight: '1.6' }],
        'fluid-md': ['clamp(0.875rem, 0.8rem + 0.4vw, 1rem)', { lineHeight: '1.6' }],
        'fluid-lg': ['clamp(1rem, 0.9rem + 0.5vw, 1.25rem)', { lineHeight: '1.5' }],
        'fluid-xl': ['clamp(1.25rem, 1.05rem + 1vw, 1.75rem)', { lineHeight: '1.4' }],
        'fluid-2xl': ['clamp(1.75rem, 1.3rem + 2.2vw, 3rem)', { lineHeight: '1.2' }],
        'fluid-3xl': ['clamp(2.5rem, 1.6rem + 4.5vw, 5.5rem)', { lineHeight: '1.05' }],
        'fluid-4xl': ['clamp(3.5rem, 1.6rem + 9vw, 11rem)', { lineHeight: '0.92' }],
      },
      transitionTimingFunction: {
        silk: 'cubic-bezier(0.16, 1, 0.3, 1)',
        seal: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      backdropBlur: {
        veil: '2px',
      },
      zIndex: {
        veil: '60',
        cursor: '90',
        hud: '70',
        overlay: '80',
        curtain: '85',
      },
    },
  },
  plugins: [],
};

export default config;
