"use client";

import { useCallback } from "react";
import type { Note } from "@/lib/note";
import type { SoundType } from "@/lib/config";
import type { EffectNode } from "@/lib/effects";
import { useToneEngine } from "./useToneEngine";
import { useSampleBuffers } from "./useSampleBuffers";
import { useSampler } from "./useSampler";
import { useEffectChain } from "./useEffectChain";

export interface NotePlayerOptions {
  volume: number;
  effectChain: EffectNode[];
  soundType: SoundType;
  sustainMode: boolean;
  notes: Note[];
  /** Held back until the user is likely to play, to keep the first paint cheap. */
  enablePreload?: boolean;
}

/**
 * Composes the audio stack and exposes the piano's playback API.
 *
 * The stages are ordered by dependency: the engine provides Tone and the
 * master limiter, the buffers depend on Tone, the sampler depends on the
 * buffers, and the effect chain reroutes the sampler's output. `useSampler`
 * must run before `useEffectChain` so the source node exists when the chain
 * first wires itself up.
 */
export function useNotePlayer({
  volume,
  effectChain,
  soundType,
  sustainMode,
  notes,
  enablePreload = true,
}: NotePlayerOptions) {
  const engine = useToneEngine(enablePreload);
  const samples = useSampleBuffers(
    engine.Tone,
    soundType,
    notes,
    enablePreload,
  );
  const sampler = useSampler(
    engine.Tone,
    samples.buffers,
    notes,
    volume,
    sustainMode,
    engine.limiterRef,
  );

  useEffectChain(
    engine.Tone,
    sampler.samplerRef,
    // The sampler is rebuilt exactly when its buffers change.
    samples.buffers,
    effectChain,
    engine.limiterRef,
    engine.contextState,
  );

  const preloadError = engine.error ?? samples.error;
  const isPreloading =
    enablePreload && preloadError === null && samples.buffers === null;

  // Destructured to prevent callback recreation on every render.
  const { Tone, retry: retryEngine } = engine;
  const { retry: retrySamples } = samples;
  const retryPreload = useCallback(() => {
    if (Tone) retrySamples();
    else retryEngine();
  }, [Tone, retrySamples, retryEngine]);

  return {
    playNote: sampler.playNote,
    stopNote: sampler.stopNote,
    stopAllNotes: sampler.stopAllNotes,
    preloadProgress: samples.progress,
    isPreloading,
    preloadError,
    retryPreload,
  };
}
