/**
 * Device capability tiering.
 *
 * The site has an ambitious 3D entry sequence and must never become unusable
 * because of it. Two mechanisms protect the guest:
 *
 *   1. A *static* tier, computed once before anything renders, decides whether
 *      the WebGL palace is worth attempting at all.
 *   2. A *runtime* watchdog, started once the scene is live, measures real
 *      frame times and demotes to the 2.5D sequence if the device struggles.
 *
 * Both paths land on the same cinematic timeline, so the experience is
 * identical in structure — only the rendering technique changes.
 */

export type QualityTier = 'cinematic' | 'balanced' | 'essential';

export interface DeviceProfile {
  tier: QualityTier;
  isMobile: boolean;
  isReducedMotion: boolean;
  /** WebGL is present and a WebGL context can actually be created. */
  webgl: boolean;
  cores: number;
  memoryGb: number;
  dpr: number;
  /** The guest asked for reduced data usage. */
  saveData: boolean;
  /** Viewport width at decision time. */
  width: number;
}

const MOBILE_UA = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i;

export function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    if (!gl) return false;
    // Release the probe context immediately so we do not hold a GPU context.
    const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function getDeviceProfile(): DeviceProfile {
  if (typeof window === 'undefined') {
    return {
      tier: 'balanced',
      isMobile: false,
      isReducedMotion: false,
      webgl: false,
      cores: 4,
      memoryGb: 4,
      dpr: 1,
      saveData: false,
      width: 1280,
    };
  }

  const nav = window.navigator as Navigator & { deviceMemory?: number };
  const isMobile = MOBILE_UA.test(nav.userAgent) || window.innerWidth < 820;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean(
    (nav as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
  );
  const cores = nav.hardwareConcurrency ?? 4;
  const memoryGb = nav.deviceMemory ?? 4;
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const webgl = supportsWebGL();

  let tier: QualityTier;
  if (isReducedMotion || saveData) {
    tier = 'essential';
  } else if (!webgl || cores <= 2 || memoryGb <= 2) {
    tier = 'essential';
  } else if (isMobile || cores <= 4 || memoryGb <= 4) {
    tier = 'balanced';
  } else {
    tier = 'cinematic';
  }

  return { tier, isMobile, isReducedMotion, webgl, cores, memoryGb, dpr, saveData, width };
}

/** Whether the 3D palace should be attempted at all, before we measure frames. */
export function shouldUseWebGL(profile: DeviceProfile): boolean {
  return profile.webgl && profile.tier !== 'essential';
}

/* ---------------------------------------------------------------------------
   Budgets per tier. Kept in one place so the scene and the fallback agree.
   --------------------------------------------------------------------------- */

export const QUALITY_BUDGET: Record<
  QualityTier,
  {
    /** Renderer pixel-ratio cap. */
    maxDpr: number;
    /** Ambient dust motes. */
    particles: number;
    /** Falling petals during the door sequence. */
    petals: number;
    /** Soft shadows from the interior lamps. */
    shadows: boolean;
    /** Volumetric light shafts. */
    godRays: boolean;
    /** Warm rim lighting on the door edges. */
    rimLight: boolean;
  }
> = {
  cinematic: { maxDpr: 2, particles: 900, petals: 220, shadows: true, godRays: true, rimLight: true },
  balanced: { maxDpr: 1.75, particles: 420, petals: 110, shadows: false, godRays: true, rimLight: true },
  essential: { maxDpr: 1, particles: 0, petals: 0, shadows: false, godRays: false, rimLight: false },
};

/* ---------------------------------------------------------------------------
   Runtime watchdog
   --------------------------------------------------------------------------- */

export interface FpsWatchdogOptions {
  /** Rolling window length, in frames. */
  windowSize?: number;
  /** Consecutive windows below this average FPS before demoting. */
  demoteBelow?: number;
  /** Never demote before this many samples have been collected. */
  warmupFrames?: number;
  onDemote: () => void;
}

/**
 * Watches real frame cadence and calls `onDemote` once, if the scene cannot
 * hold a comfortable frame rate. Deliberately conservative: it needs several
 * bad windows in a row, so a single hitch (a GC pause, an incoming call) never
 * downgrades the experience.
 */
export function startFpsWatchdog(options: FpsWatchdogOptions): () => void {
  const { windowSize = 90, demoteBelow = 38, warmupFrames = 150, onDemote } = options;
  let frames = 0;
  let elapsed = 0;
  let badWindows = 0;
  let totalFrames = 0;
  let last = performance.now();
  let stopped = false;

  const tick = (now: number) => {
    if (stopped) return;
    const delta = now - last;
    last = now;
    // Ignore absurd frame times: those are tab-switches or GC pauses, not GPU load.
    if (delta > 0 && delta < 400) {
      frames += 1;
      elapsed += delta;
      totalFrames += 1;
    }

    if (frames >= windowSize) {
      const fps = (frames * 1000) / elapsed;
      if (totalFrames >= warmupFrames && fps < demoteBelow) {
        badWindows += 1;
        if (badWindows >= 3) {
          stopped = true;
          onDemote();
          return;
        }
      } else {
        badWindows = 0;
      }
      frames = 0;
      elapsed = 0;
    }
    requestAnimationFrame(tick);
  };

  const id = requestAnimationFrame(tick);
  return () => {
    stopped = true;
    cancelAnimationFrame(id);
  };
}
