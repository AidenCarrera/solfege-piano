"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as ToneType from "tone";

/** Keeps note attacks tight; the default look-ahead is audible when playing. */
const LOOK_AHEAD_S = 0.01;

/** Headroom below 0 dBFS so stacked voices and effects cannot clip. */
const LIMITER_THRESHOLD_DB = -1;

/**
 * Runs a silent one-frame buffer through the destination.
 *
 * A resumed context does not necessarily have a running output device behind
 * it, and the device's start-up is what the first note would otherwise wait
 * on. Pushing a throwaway sample through forces that work to happen now, while
 * nobody is listening.
 */
function primeOutputDevice(Tone: typeof ToneType) {
  const context = Tone.getContext().rawContext;
  const source = context.createBufferSource();
  source.buffer = context.createBuffer(1, 1, context.sampleRate);
  source.connect(context.destination);
  source.start(0);
}

export interface ToneEngine {
  /** `null` until the Tone bundle has loaded, or if loading failed. */
  Tone: typeof ToneType | null;
  /** Final node before the destination; every chain terminates here. */
  limiterRef: React.RefObject<ToneType.Limiter | null>;
  /**
   * Mirrors the raw context's state. Effects that need a running context read
   * this so they can be built once the browser unlocks audio.
   */
  contextState: AudioContextState;
  error: string | null;
  retry: () => void;
}

/**
 * Loads Tone.js on demand and owns the master output chain.
 *
 * Tone is imported dynamically because it is by far the largest dependency and
 * is not needed to render the keyboard.
 */
export function useToneEngine(enabled: boolean): ToneEngine {
  const [Tone, setTone] = useState<typeof ToneType | null>(null);
  const [attempt, setAttempt] = useState(0);
  /** The attempt that failed, so a retry clears the error without an effect. */
  const [failedAttempt, setFailedAttempt] = useState<number | null>(null);
  const [contextState, setContextState] =
    useState<AudioContextState>("suspended");
  const [hasActivated, setHasActivated] = useState(false);
  const limiterRef = useRef<ToneType.Limiter | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;

    import("tone")
      .then((tone) => {
        if (!mounted) return;
        tone.getContext().lookAhead = LOOK_AHEAD_S;
        // Instantiate the Transport up front so LFO-driven effects can schedule.
        tone.getTransport();

        const limiter = new tone.Limiter(LIMITER_THRESHOLD_DB);
        limiter.connect(tone.getContext().rawContext.destination);
        limiterRef.current = limiter;

        setTone(tone);
      })
      .catch(() => {
        if (mounted) setFailedAttempt(attempt);
      });

    return () => {
      mounted = false;
      limiterRef.current?.dispose();
      limiterRef.current = null;
    };
  }, [enabled, attempt]);

  /**
   * Watched separately from `Tone` because the gesture that triggers the
   * import is usually the same one that has to unlock audio, and it is long
   * over by the time the bundle arrives. Waiting for a gesture we can still
   * see would push the unlock onto the user's *second* interaction.
   */
  useEffect(() => {
    if (hasActivated) return;

    const activate = () => setHasActivated(true);
    const options = { capture: true } as const;

    window.addEventListener("pointerdown", activate, {
      ...options,
      passive: true,
    });
    window.addEventListener("keydown", activate, options);

    return () => {
      window.removeEventListener("pointerdown", activate, options);
      window.removeEventListener("keydown", activate, options);
    };
  }, [hasActivated]);

  /**
   * Unlocks as soon as the engine and a gesture both exist, rather than at the
   * first note. Browsers grant the page sticky activation, so `start` does not
   * have to run inside the handler itself — and starting the output device
   * here is what keeps its latency off the first note the user plays.
   */
  useEffect(() => {
    if (!Tone || !hasActivated) return;
    let cancelled = false;

    const unlock = async () => {
      if (Tone.getContext().state !== "running") await Tone.start();
      if (!cancelled) primeOutputDevice(Tone);
    };

    // A rejected resume leaves the context suspended; `playNote` retries.
    unlock().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [Tone, hasActivated]);

  useEffect(() => {
    if (!Tone) return;
    const rawContext = Tone.getContext().rawContext;
    if (!rawContext) return;

    const handleStateChange = () => setContextState(rawContext.state);
    rawContext.addEventListener("statechange", handleStateChange);
    // Seed initial state in case context is already running.
    handleStateChange();
    return () => {
      rawContext.removeEventListener("statechange", handleStateChange);
    };
  }, [Tone]);

  const retry = useCallback(() => setAttempt((previous) => previous + 1), []);

  const error =
    failedAttempt === attempt ? "The audio engine could not be loaded." : null;

  return { Tone, limiterRef, contextState, error, retry };
}
