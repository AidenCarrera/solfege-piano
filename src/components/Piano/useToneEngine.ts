"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as ToneType from "tone";

/** Keeps note attacks tight; the default look-ahead is audible when playing. */
const LOOK_AHEAD_S = 0.01;

/** Headroom below 0 dBFS so stacked voices and effects cannot clip. */
const LIMITER_THRESHOLD_DB = -1;

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

  // Browsers require AudioContext startup within a user gesture.
  useEffect(() => {
    if (!Tone) return;

    const resumeContext = () => {
      if (Tone.getContext().state !== "running") {
        Tone.start();
      }
    };

    window.addEventListener("pointerdown", resumeContext, { capture: true });
    window.addEventListener("keydown", resumeContext, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", resumeContext, {
        capture: true,
      });
      window.removeEventListener("keydown", resumeContext, { capture: true });
    };
  }, [Tone]);

  useEffect(() => {
    if (!Tone) return;
    const rawContext = Tone.getContext().rawContext;
    if (!rawContext) return;

    const handleStateChange = () => setContextState(rawContext.state);
    rawContext.addEventListener("statechange", handleStateChange);
    return () => {
      rawContext.removeEventListener("statechange", handleStateChange);
    };
  }, [Tone]);

  const retry = useCallback(() => setAttempt((previous) => previous + 1), []);

  const error =
    failedAttempt === attempt ? "The audio engine could not be loaded." : null;

  return { Tone, limiterRef, contextState, error, retry };
}
