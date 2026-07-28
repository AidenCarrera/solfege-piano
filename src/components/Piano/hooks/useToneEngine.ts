"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as ToneType from "tone";

// Reduce Tone's default scheduling delay for live input.
const LOOK_AHEAD_S = 0.01;

// Leave a small amount of output headroom.
const LIMITER_THRESHOLD_DB = -1;

// Warm the output device so its startup latency does not affect the first note.
function primeOutputDevice(Tone: typeof ToneType) {
  const context = Tone.getContext().rawContext;
  const source = context.createBufferSource();
  source.buffer = context.createBuffer(1, 1, context.sampleRate);
  source.connect(context.destination);
  source.start(0);
}

export interface ToneEngine {
  Tone: typeof ToneType | null;
  limiterRef: React.RefObject<ToneType.Limiter | null>;
  contextState: AudioContextState;
  error: string | null;
  retry: () => void;
}

export function useToneEngine(enabled: boolean): ToneEngine {
  const [Tone, setTone] = useState<typeof ToneType | null>(null);
  const [attempt, setAttempt] = useState(0);
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
        // Initialize scheduling before constructing LFO effects.
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

  // Remember activation that occurs before the Tone bundle finishes loading.
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

  useEffect(() => {
    if (!Tone || !hasActivated) return;
    let cancelled = false;

    const unlock = async () => {
      if (Tone.getContext().state !== "running") await Tone.start();
      if (!cancelled) primeOutputDevice(Tone);
    };

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
