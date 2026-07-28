"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type * as ToneType from "tone";
import type { Note } from "@/lib/note";
import { PIANO_CONFIG } from "@/lib/config";
import { refocusSustainPedal } from "@/lib/keyboard";

// Leave headroom for chords and boosting effects.
const HEADROOM_DB = 3;

function createSampler(
  Tone: typeof ToneType,
  buffers: ToneType.ToneAudioBuffers,
  notes: Note[],
  volume: number,
  limiter: ToneType.Limiter | null,
): ToneType.Sampler {
  const bufferMap: Record<string, ToneType.ToneAudioBuffer> = {};
  notes.forEach((note) => {
    try {
      if (buffers.has && !buffers.has(note.toneName)) return;
      const buffer = buffers.get(note.toneName);
      if (buffer) bufferMap[note.toneName] = buffer;
    } catch {
      // A bank change can dispose buffers during this read.
    }
  });

  const sampler = new Tone.Sampler({
    urls: bufferMap,
    release: PIANO_CONFIG.FADE_OUT_MS / 1000,
    attack: PIANO_CONFIG.ATTACK_MS / 1000,
  });

  sampler.volume.value = Tone.gainToDb(volume) - HEADROOM_DB;
  sampler.connect(limiter ?? Tone.getContext().rawContext.destination);

  return sampler;
}

export interface SamplerControls {
  samplerRef: React.RefObject<ToneType.Sampler | null>;
  playNote: (noteName: string) => void;
  stopNote: (noteName: string) => void;
  stopAllNotes: () => void;
}

export function useSampler(
  Tone: typeof ToneType | null,
  buffers: ToneType.ToneAudioBuffers | null,
  notes: Note[],
  volume: number,
  sustainMode: boolean,
  limiterRef: React.RefObject<ToneType.Limiter | null>,
): SamplerControls {
  const samplerRef = useRef<ToneType.Sampler | null>(null);

  const toneNames = useMemo(() => {
    const map = new Map<string, string>();
    notes.forEach((note) => map.set(note.name, note.toneName));
    return map;
  }, [notes]);

  // Volume updates should not rebuild the sampler and cut off notes.
  const volumeRef = useRef(volume);

  useEffect(() => {
    if (!Tone || !buffers) {
      samplerRef.current?.dispose();
      samplerRef.current = null;
      return;
    }

    samplerRef.current = createSampler(
      Tone,
      buffers,
      notes,
      volumeRef.current,
      limiterRef.current,
    );

    return () => {
      samplerRef.current?.dispose();
      samplerRef.current = null;
    };
  }, [Tone, buffers, notes, limiterRef]);

  useEffect(() => {
    volumeRef.current = volume;
    if (samplerRef.current && Tone) {
      samplerRef.current.volume.value = Tone.gainToDb(volume) - HEADROOM_DB;
    }
  }, [volume, Tone]);

  const playNote = useCallback(
    (noteName: string) => {
      refocusSustainPedal();
      if (!Tone || !buffers?.loaded || !samplerRef.current) return;

      const toneNote = toneNames.get(noteName);
      if (!toneNote) return;

      if (Tone.getContext().state !== "running") {
        Tone.start();
      }

      const sampler = samplerRef.current;

      // Retrigger from silence instead of layering the same note.
      const now = Tone.now();
      sampler.triggerRelease(toneNote, now);
      sampler.triggerAttack(toneNote, now);
    },
    [Tone, buffers, toneNames],
  );

  const stopNote = useCallback(
    (noteName: string) => {
      if (sustainMode || !Tone || !samplerRef.current) return;

      const toneNote = toneNames.get(noteName);
      if (toneNote) samplerRef.current.triggerRelease(toneNote, Tone.now());
    },
    [sustainMode, Tone, toneNames],
  );

  const stopAllNotes = useCallback(() => {
    if (samplerRef.current && Tone) {
      samplerRef.current.releaseAll(Tone.now());
    }
  }, [Tone]);

  return { samplerRef, playNote, stopNote, stopAllNotes };
}
