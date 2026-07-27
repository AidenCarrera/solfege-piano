"use client";

import { useCallback, useEffect, useRef } from "react";
import type * as ToneType from "tone";
import { toToneNote, type Note } from "@/lib/note";
import { PIANO_CONFIG } from "@/lib/config";
import { refocusSustainPedal } from "@/lib/keyboard";

/**
 * Trimmed from the requested gain so a full chord through a boosting effect
 * chain still leaves headroom before the master limiter engages.
 */
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
    const toneNote = toToneNote(note.name);
    try {
      if (buffers.has && !buffers.has(toneNote)) return;
      const buffer = buffers.get(toneNote);
      if (buffer) bufferMap[toneNote] = buffer;
    } catch {
      // Buffers can disappear briefly while the sound bank changes.
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

/**
 * Owns the sampler and the note-triggering API.
 *
 * The sampler is rebuilt whenever its buffers change and is connected straight
 * to the limiter, so audio is available before `useEffectChain` reroutes it.
 */
export function useSampler(
  Tone: typeof ToneType | null,
  buffers: ToneType.ToneAudioBuffers | null,
  notes: Note[],
  volume: number,
  sustainMode: boolean,
  limiterRef: React.RefObject<ToneType.Limiter | null>,
): SamplerControls {
  const samplerRef = useRef<ToneType.Sampler | null>(null);
  const activeVoices = useRef<string[]>([]);

  // Read when building a sampler, but deliberately not a dependency of that
  // effect: rebuilding on every slider movement would cut off sounding notes.
  // The effect below keeps both the ref and the live sampler current.
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

      if (Tone.getContext().state !== "running") {
        Tone.start();
      }

      const sampler = samplerRef.current;
      const toneNote = toToneNote(noteName);

      // Retrigger from silence so a repeated note does not layer on itself.
      sampler.triggerRelease(toneNote, Tone.now());
      activeVoices.current = activeVoices.current.filter((v) => v !== toneNote);

      activeVoices.current.push(toneNote);
      if (activeVoices.current.length > PIANO_CONFIG.MAX_POLYPHONY) {
        const oldestNote = activeVoices.current.shift();
        if (oldestNote) {
          sampler.triggerRelease(oldestNote, Tone.now());
        }
      }

      sampler.triggerAttack(toneNote, Tone.now());
    },
    [Tone, buffers],
  );

  const stopNote = useCallback(
    (noteName: string) => {
      if (sustainMode || !Tone || !samplerRef.current) return;

      const toneNote = toToneNote(noteName);
      samplerRef.current.triggerRelease(toneNote, Tone.now());
      activeVoices.current = activeVoices.current.filter((v) => v !== toneNote);
    },
    [sustainMode, Tone],
  );

  const stopAllNotes = useCallback(() => {
    if (samplerRef.current && Tone) {
      samplerRef.current.releaseAll(Tone.now());
    }
    activeVoices.current = [];
  }, [Tone]);

  return { samplerRef, playNote, stopNote, stopAllNotes };
}
