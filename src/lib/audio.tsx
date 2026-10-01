'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { config } from '@/lib/site';

/* ==========================================================================
   AUDIO

   Two sources behind one interface:

   1. `config.music.source` — a real track in /public. Preferred.
   2. A live-synthesised ambience, generated with the Web Audio API when no
      track has been supplied. Not a placeholder beep: a slow filtered drone
      under a distant, recurring bell. It gives the invitation an atmosphere out
      of the box and disappears entirely once a real track is dropped in.

   Interaction cues (door, seal, paper, chime) are synthesised the same way, so
   the site is never silent for want of assets and never ships large files.
   ========================================================================== */

export type CueName = 'door' | 'seal' | 'paper' | 'chime';

interface AudioValue {
  playing: boolean;
  /** True until the guest has interacted, so we can invite them politely. */
  needsGesture: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  /** 0–1 position through the current loop, for the circular player. */
  progress: number;
  cue: (name: CueName) => void;
  volume: number;
  sourceKind: 'track' | 'synth';
}

const AudioCtx = createContext<AudioValue | null>(null);

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

interface Ambience {
  gain: GainNode;
  nodes: AudioScheduledSourceNode[];
  timers: number[];
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const sourceKind: 'track' | 'synth' = config.music.source ? 'track' : 'synth';

  const [playing, setPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(true);
  const [progress, setProgress] = useState(0);

  const elRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const ambienceRef = useRef<Ambience | null>(null);

  /* --- Track: construct only, never fetch on mount ----------------------- */
  useEffect(() => {
    if (sourceKind !== 'track') return;
    const audio = new Audio();
    audio.src = config.music.source;
    audio.loop = config.music.loop;
    audio.preload = 'none';
    audio.volume = config.music.volume;
    elRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute('src');
      elRef.current = null;
    };
  }, [sourceKind]);

  /* --- Loop progress, only while a track is actually playing ------------- */
  useEffect(() => {
    if (sourceKind !== 'track' || !playing) return;
    const audio = elRef.current;
    if (!audio) return;
    let raf = 0;
    const tick = () => {
      const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      setProgress(total > 0 ? (audio.currentTime % total) / total : 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, sourceKind]);

  /* --- Web Audio plumbing ------------------------------------------------ */
  const ensureContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctxRef.current) ctxRef.current = new Ctor();
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  /* --- Synthesised ambience ---------------------------------------------- */
  const startAmbience = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx || ambienceRef.current) return;

    const now = ctx.currentTime;
    const peak = config.music.volume * 0.22;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(peak, now + 5);
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.Q.value = 0.6;
    filter.connect(master);

    const sources: AudioScheduledSourceNode[] = [];

    // Slow breathing on the cutoff, so the drone is never quite still.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.035;
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    sources.push(lfo);

    // A warm, wistful chord. A minor ninth reads as longing, not sombre.
    const chord: ReadonlyArray<readonly [number, number, number]> = [
      [110, 0.5, 0],
      [164.81, 0.32, 4],
      [220, 0.24, -5],
      [277.18, 0.1, 7],
    ];
    for (const [freq, level, detune] of chord) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      gain.gain.value = level;
      osc.connect(gain).connect(filter);
      osc.start();
      sources.push(osc);
    }

    // A distant bell, recurring.
    const bell = () => {
      const ac = ctxRef.current;
      if (!ac || !ambienceRef.current) return;
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1174.66, t); // D6
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 6);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 6.2);
    };
    const timers = [window.setInterval(bell, 19000), window.setTimeout(bell, 2600)];

    ambienceRef.current = { gain: master, nodes: sources, timers };
  }, [ensureContext]);

  const stopAmbience = useCallback(() => {
    const ambience = ambienceRef.current;
    const ctx = ctxRef.current;
    ambienceRef.current = null;
    if (!ambience) return;

    ambience.timers.forEach((id) => {
      clearInterval(id);
      clearTimeout(id);
    });

    if (ctx) {
      ambience.gain.gain.cancelScheduledValues(ctx.currentTime);
      ambience.gain.gain.setValueAtTime(ambience.gain.gain.value, ctx.currentTime);
      ambience.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    }

    window.setTimeout(() => {
      ambience.nodes.forEach((node) => {
        try {
          node.stop();
        } catch {
          /* already stopped */
        }
        node.disconnect();
      });
      ambience.gain.disconnect();
    }, 1000);
  }, []);

  const play = useCallback(() => {
    setNeedsGesture(false);
    if (sourceKind === 'track') {
      const audio = elRef.current;
      if (!audio) return;
      void audio.play().then(
        () => setPlaying(true),
        () => setNeedsGesture(true),
      );
    } else {
      startAmbience();
      setPlaying(true);
    }
  }, [sourceKind, startAmbience]);

  const pause = useCallback(() => {
    if (sourceKind === 'track') elRef.current?.pause();
    else stopAmbience();
    setPlaying(false);
  }, [sourceKind, stopAmbience]);

  const toggle = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, play, pause]);

  /* --- Interaction cues -------------------------------------------------- */
  const cue = useCallback(
    (name: CueName) => {
      const ctx = ensureContext();
      if (!ctx) return;

      // When a real track is loaded its audio must not be muddied by cues.
      const bus = ctx.createGain();
      bus.gain.value = 0.4;
      bus.connect(ctx.destination);

      const now = ctx.currentTime;
      const tone = (
        freq: number,
        at: number,
        dur: number,
        peak: number,
        type: OscillatorType = 'sine',
        sweepTo?: number,
      ) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + at);
        if (sweepTo !== undefined) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), now + at + dur);
        }
        gain.gain.setValueAtTime(0.0001, now + at);
        gain.gain.linearRampToValueAtTime(peak, now + at + Math.min(0.04, dur * 0.25));
        gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
        osc.connect(gain).connect(bus);
        osc.start(now + at);
        osc.stop(now + at + dur + 0.05);
      };

      switch (name) {
        case 'door':
          // Weighty low swell, then a long timber groan.
          tone(52, 0, 3.2, 0.14, 'sine', 38);
          tone(148, 0.15, 2.1, 0.035, 'triangle', 96);
          tone(214, 0.9, 1.5, 0.02, 'sawtooth', 132);
          break;
        case 'seal':
          // Wax cracking: a short, dry, descending knock.
          tone(320, 0, 0.13, 0.07, 'triangle', 190);
          tone(190, 0.1, 0.2, 0.045, 'triangle', 96);
          break;
        case 'paper':
          // Fibrous rustle, rendered as filtered noise.
          {
            const frames = Math.ceil(ctx.sampleRate * 0.42);
            const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < frames; i += 1) {
              const env = Math.sin((i / frames) * Math.PI);
              data[i] = (Math.random() * 2 - 1) * env * env;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const hp = ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 1400;
            const out = ctx.createGain();
            out.gain.value = 0.09;
            noise.connect(hp).connect(out).connect(bus);
            noise.start(now);
          }
          break;
        case 'chime':
          // Confirmation: a soft perfect fifth.
          tone(880, 0, 1.6, 0.05);
          tone(1318.51, 0.04, 1.9, 0.028);
          break;
      }

      window.setTimeout(() => bus.disconnect(), 4000);
    },
    [ensureContext],
  );

  useEffect(() => {
    return () => {
      stopAmbience();
      void ctxRef.current?.close().catch(() => undefined);
    };
  }, [stopAmbience]);

  const value = useMemo<AudioValue>(
    () => ({
      playing,
      needsGesture,
      progress,
      toggle,
      play,
      pause,
      cue,
      volume: config.music.volume,
      sourceKind,
    }),
    [playing, needsGesture, progress, toggle, play, pause, cue, sourceKind],
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioValue {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used inside <AudioProvider>');
  return ctx;
}
