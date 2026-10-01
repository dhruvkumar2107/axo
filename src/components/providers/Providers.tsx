'use client';

import type { ReactNode } from 'react';

import { AudioProvider } from '@/lib/audio';
import { ExperienceProvider } from '@/lib/experience';
import { SmoothScroll } from './SmoothScroll';

/**
 * The full client shell.
 *
 * Order matters only in that `ExperienceProvider` wraps the content, because
 * the entry sequence has to sit above and control everything beneath it.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      <ExperienceProvider>
        <SmoothScroll>{children}</SmoothScroll>
      </ExperienceProvider>
    </AudioProvider>
  );
}
