'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getDeviceProfile, shouldUseWebGL, type DeviceProfile, type QualityTier } from '@/lib/perf';
import { resolveSalutation, slugFromPathname } from '@/lib/greeting';
import { config } from '@/lib/site';

/**
 * The entry sequence is a state machine, not a set of booleans.
 *
 *   loading ──▶ doors ──▶ entering ──▶ inside
 *
 * `loading`   Preloader: monogram, names, a discreet progress read-out.
 * `doors`     The palace at night. Monogram, tagline, ENTER THE CELEBRATION.
 * `entering`  Doors swing, light pours out, camera pushes through.
 * `inside`    The invitation proper. Smooth scroll unlocks.
 *
 * Everything downstream of `inside` is mounted from the very first frame but
 * held behind an invisible curtain, so typefaces and photography are already
 * warm by the time the guest is let in — no second loading bar.
 */
export type Phase = 'loading' | 'doors' | 'entering' | 'inside';

interface ExperienceValue {
  phase: Phase;
  profile: DeviceProfile;
  /** Chosen before render; may be revised downward at runtime. */
  useWebGL: boolean;
  tier: QualityTier;
  /** Personalised salutation, when arriving via /invite/[slug]. */
  greeting: string | null;
  /** Entered at least once this session (drives the replay affordance). */
  hasEntered: boolean;
  /** Move to the palace doors. */
  goToDoors: () => void;
  /** Guest pressed ENTER — the doors begin to open. */
  beginEntry: () => void;
  /** Doors finished — reveal the invitation. */
  completeEntry: () => void;
  /** True only while the guest is inside, used to gate scroll and audio. */
  isInside: boolean;
}

const ExperienceContext = createContext<ExperienceValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  // Start conservative on the server-render pass and correct on the client,
  // which avoids a hydration mismatch and a wasted 3D context on weak devices.
  const [profile, setProfile] = useState<DeviceProfile | null>(null);
  const [useWebGL, setUseWebGL] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [hasEntered, setHasEntered] = useState(false);

  // Personalisation is read from the URL rather than threaded through the root
  // layout, so `/invite/raj-family` works with zero extra wiring.
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    const p = getDeviceProfile();
    const slug = slugFromPathname(window.location.pathname);
    // Deliberately synchronous: this is the one client-only correction after the
    // server render, and it must land before the first interactive paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(p);
    setUseWebGL(shouldUseWebGL(p));
    setGreeting(slug ? resolveSalutation(slug, config.invites, 'Dear Friends,') : null);
  }, []);

  const goToDoors = useCallback(() => setPhase('doors'), []);

  const beginEntry = useCallback(() => {
    setHasEntered(true);
    setPhase('entering');
  }, []);

  const completeEntry = useCallback(() => setPhase('inside'), []);

  const value = useMemo<ExperienceValue>(
    () => ({
      phase,
      profile: profile ?? {
        tier: 'balanced',
        isMobile: false,
        isReducedMotion: false,
        webgl: false,
        cores: 4,
        memoryGb: 4,
        dpr: 1,
        saveData: false,
        width: 1280,
      },
      useWebGL,
      tier: profile?.tier ?? 'balanced',
      greeting,
      hasEntered,
      goToDoors,
      beginEntry,
      completeEntry,
      isInside: phase === 'inside',
    }),
    [phase, profile, useWebGL, greeting, hasEntered, goToDoors, beginEntry, completeEntry],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience(): ExperienceValue {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceProvider>');
  return ctx;
}

/**
 * Gate that keeps an expensive scene unmounted until it is genuinely needed.
 * Scenes observe their own visibility so nothing off-screen is ever painting.
 */
export function useInView<T extends HTMLElement>(
  options: IntersectionObserverInit & { rootMargin?: string } = {},
) {
  const { rootMargin = '0px 0px -12% 0px', threshold = 0 } = options;
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const ref = useCallback((el: T | null) => setNode(el), []);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setHasEntered(true);
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, rootMargin, threshold]);

  return { ref, inView, hasEntered };
}
