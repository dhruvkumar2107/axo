import type { Config } from 'tailwindcss';

/**
 * The palette is intentionally narrow. Luxury here comes from restraint:
 * four materials (ivory, antique gold, emerald, ink) and one accent (burgundy).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#F4EFE4',
          soft: '#FBF8F1',
          deep: '#E8DFCD',
        },
        gold: {
          DEFAULT: '#C9A227',
          light: '#E8D9A0',
          pale: '#F0E6C8',
          antique: '#A8842B',
          deep: '#7A5F17',
          shadow: '#4A370E',
        },
        emerald: {
          DEFAULT: '#0C2B22',
          rich: '#123A2D',
          deep: '#071A14',
          muted: '#1E5142',
        },
        burgundy: {
          DEFAULT: '#4A1220',
          rich: '#6B1A2C',
          muted: '#8A2E42',
        },
        ink: {
          DEFAULT: '#08080A',
          soft: '#101014',
          muted: '#1B1B21',
        },
        /* Warm near-black, for type set on ivory paper. */
        inkwarm: {
          DEFAULT: '#2A241C',
          soft: '#4A4034',
          faint: '#7A6E5C',
        },
        brass: {
          DEFAULT: '#9C7B33',
          deep: '#6E5420',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Didot', 'Bodoni MT', 'serif'],
        editorial: ['var(--font-playfair)', 'Georgia', 'serif'],
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
