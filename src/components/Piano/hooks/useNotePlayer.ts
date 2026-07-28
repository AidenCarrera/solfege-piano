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
  enablePreload?: boolean;
}

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

  // Build the source before routing it through the effect graph.
  useEffectChain(
    engine.Tone,
    sampler.samplerRef,
    samples.buffers,
    effectChain,
    engine.limiterRef,
    engine.contextState,
  );

  const preloadError = engine.error ?? samples.error;
  const isPreloading =
    enablePreload && preloadError === null && samples.buffers === null;

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
