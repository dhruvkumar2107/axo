import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pinned explicitly, and absolute: without it the monorepo root is inferred
  // from a stray lockfile in the parent directory and the warning obscures real
  // errors.
  turbopack: { root: projectRoot },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 390, 412, 430, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [64, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
};

export default nextConfig;
