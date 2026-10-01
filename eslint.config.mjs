import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Flat config. Next.js 16 ships native flat configs, so no FlatCompat wrapper is
 * needed — the legacy compatibility layer mis-handles the plugin graph and
 * throws a circular-structure error on this dependency set.
 */
const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'data/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];

export default eslintConfig;
