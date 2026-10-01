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
 *   overture ──▶ doors ──▶ entering ──▶ inside
 *
 * `overture`  The opening. Fully painted from the first byte of HTML — there is
 *              no loading screen in front of it, because there is nothing left
 *              to wait for. 3D cross-fades in behind the type when it arrives.
 * `doors`     The guest pressed ENTER. The palace scene mounts and warms up
 *              while the opening is still on screen, so no guest ever waits on
 *              a download in order to see a door open.
 * `entering`  The scene is live. Doors swing, light pours out, camera pushes in.
 * `inside`    The invitation proper. Smooth scroll unlocks.
 *
 * Everything downstream of `inside` is mounted from the very first frame but
 * held behind an invisible curtain, so typefaces and composition are already
 * warm by the time the guest is let in — no second loading bar.
 */
export type Phase = 'overture' | 'doors' | 'entering' | 'inside';

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
  /** Guest pressed ENTER. Moves to the palace and begins warming the scene. */
  beginEntry: () => void;
  /** Scene is live and able to play the open — start the doors. */
  startOpen: () => void;
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
  const [phase, setPhase] = useState<Phase>('overture');
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

  const beginEntry = useCallback(() => {
    setHasEntered(true);
    setPhase('doors');
  }, []);

  /**
   * Guarded so a scene that reports ready twice — or reports ready and then
   * completes at the same instant — cannot skip the `entering` act.
   */
  const startOpen = useCallback(() => {
    setPhase((current) => (current === 'doors' ? 'entering' : current));
  }, []);

  const completeEntry = useCallback(() => setPhase((current) => (current === 'entering' ? 'inside' : current)), []);

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
      beginEntry,
      startOpen,
      completeEntry,
      isInside: phase === 'inside',
    }),
    [phase, profile, useWebGL, greeting, hasEntered, beginEntry, startOpen, completeEntry],
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
