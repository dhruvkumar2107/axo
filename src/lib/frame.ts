'use client';

/**
 * ============================================================================
 *  FRAME INDEPENDENCE
 * ============================================================================
 *
 *  The invitation is a *timed* experience, not a frame-driven one, but JavaScript
 *  animation has a habit of putting `requestAnimationFrame` in charge of time.
 *
 *  That is a trap. `requestAnimationFrame` does not fire when:
 *
 *    · the tab is in the background or occluded
 *    · the device is in a low-power state and the compositor has gone idle
 *    · an aggressive in-app browser or battery saver throttles rendering
 *    · the main thread is saturated, so frames are dropped indefinitely
 *
 *  Any of those used to strand the guest on the opening for good, because the
 *  "have we waited long enough yet?" check lived *inside* the rAF callback and so
 *  never ran.
 *
 *  Everything time-based here is therefore scheduled with `setTimeout`, which
 *  fires regardless of whether a frame is ever painted, and rAF is used only
 *  for what it is genuinely good at: advancing a visual value once per painted
 *  frame when frames *are* available.
 */

/**
 * Run `fn` once, after `ms`, guaranteed.
 *
 * Unlike an rAF-based countdown this cannot be starved by a paused compositor.
 * Cleared automatically on unmount, so it is safe to call unconditionally in an
 * effect body.
 */
export function afterDelay(fn: () => void, ms: number): () => void {
  const id = setTimeout(fn, ms);
  return () => clearTimeout(id);
}

/**
 * Guard for work that must happen *at most once* and must never throw its way
 * into an unhandled rejection.
 *
 * Used to wrap the beats that advance the entry state machine, so that a fault
 * in one layer (WebGL, audio, a malformed asset) can never leave the guest
 * stuck on a loading screen.
 */
export function once(fn: () => void): () => void {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    try {
      fn();
    } catch (error) {
      // Deliberately swallowed and reported: the sequence must advance even if
      // this particular beat failed. A stuck loading screen is a far worse
      // outcome than a missing animation.
      console.error('[invitation] sequence beat failed:', error);
    }
  };
}

/**
 * Run `fn` once the browser has actually painted the page.
 *
 * `requestIdleCallback` is not enough on its own: an idle moment can be reported
 * before the first paint, and doing expensive work there delays the very paint
 * the guest is waiting for. So we require positive evidence that a frame has been
 * presented — either two delivered animation frames, or a recorded paint timing
 * entry — and only then hand over.
 *
 * Both signals are optional: a browser that reports neither still runs `fn`,
 * because deferred work is never worth stranding. The `maxWait` ceiling is a
 * plain timer, so this cannot hang.
 */
export function afterFirstPaint(fn: () => void, maxWait = 2500): () => void {
  if (typeof window === 'undefined') return () => undefined;

  let done = false;
  let cancelCeiling: () => void = () => undefined;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const finish = () => {
    if (done) return;
    done = true;
    cancelCeiling();
    for (const id of timers) clearTimeout(id);
    try {
      fn();
    } catch (error) {
      console.error('[invitation] deferred work failed:', error);
    }
  };

  const painted = () => {
    if (typeof performance === 'undefined') return true;
    try {
      return performance
        .getEntriesByType('paint')
        .some((entry) => entry.name === 'first-contentful-paint' || entry.name === 'first-paint');
    } catch {
      return true;
    }
  };

  // A hard ceiling, independent of every other signal.
  const ceiling = setTimeout(finish, maxWait);
  cancelCeiling = () => clearTimeout(ceiling);

  if (painted()) {
    // Paint already recorded: yield once so the current frame can finish.
    const id = setTimeout(finish, 0);
    timers.push(id);
    return () => {
      done = true;
      clearTimeout(ceiling);
      clearTimeout(id);
    };
  }

  /*
   * Otherwise wait for two consecutive frames. One frame can be consumed before
   * anything is committed to the screen; two in a row means a frame was painted
   * and the next one is being scheduled, so we are past the critical path.
   */
  let delivered = 0;
  const tick = () => {
    delivered += 1;
    if (delivered >= 2 || painted()) finish();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return () => {
    done = true;
    cancelCeiling();
    for (const id of timers) clearTimeout(id);
  };
}

/**
 * Detect an environment where animation frames are unreliable.
 *
 * Probes once, after a short grace period, by checking whether a requested
 * frame ever arrived. Scenes use this to abandon decorative motion — never
 * content — so that a throttled device still reaches every part of the
 * invitation.
 */
export function framesAreStalled(probeMs = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    let settled = false;
    const finish = (stalled: boolean) => {
      if (settled) return;
      settled = true;
      resolve(stalled);
    };
    const id = setTimeout(() => finish(true), probeMs);
    requestAnimationFrame(() => {
      clearTimeout(id);
      finish(false);
    });
  });
}
