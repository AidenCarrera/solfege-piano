"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type * as ToneType from "tone";
import type { Note } from "@/lib/note";
import type { SoundType } from "@/lib/config";

interface KeyedState<T> {
  key: string;
  value: T;
}

interface LoadOutcome {
  buffers: ToneType.ToneAudioBuffers | null;
  error: string | null;
}

export interface SampleBuffers {
  buffers: ToneType.ToneAudioBuffers | null;
  progress: number;
  error: string | null;
  retry: () => void;
}

export function useSampleBuffers(
  Tone: typeof ToneType | null,
  soundType: SoundType,
  notes: Note[],
  enabled: boolean,
): SampleBuffers {
  const [outcome, setOutcome] = useState<KeyedState<LoadOutcome> | null>(null);
  const [loadedCount, setLoadedCount] = useState<KeyedState<number> | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);

  // Tag async results so an older request cannot replace the current bank.
  const requestKey = useMemo(
    () => [soundType, attempt, notes.map((note) => note.name).join()].join("|"),
    [soundType, attempt, notes],
  );

  useEffect(() => {
    if (!enabled || !Tone) return;
    let settled = false;

    const buffers = new Tone.ToneAudioBuffers();
    const baseUrl = `/samples/${soundType.toLowerCase()}/`;
    let decoded = 0;

    const fail = () => {
      if (settled) return;
      settled = true;
      setOutcome({
        key: requestKey,
        value: {
          buffers: null,
          error: "The audio samples could not be loaded.",
        },
      });
    };

    notes.forEach((note) => {
      buffers.add(
        note.toneName,
        `${baseUrl}${note.name}.mp3`,
        () => {
          if (settled) return;
          decoded += 1;
          setLoadedCount({ key: requestKey, value: decoded });
          if (decoded === notes.length) {
            settled = true;
            setOutcome({ key: requestKey, value: { buffers, error: null } });
          }
        },
        fail,
      );
    });

    return () => {
      settled = true;
      buffers.dispose();
    };
  }, [Tone, soundType, notes, enabled, requestKey]);

  const retry = useCallback(() => setAttempt((previous) => previous + 1), []);

  const current = outcome?.key === requestKey ? outcome.value : null;
  const decoded = loadedCount?.key === requestKey ? loadedCount.value : 0;

  return {
    buffers: current?.buffers ?? null,
    progress: notes.length === 0 ? 1 : decoded / notes.length,
    error: current?.error ?? null,
    retry,
  };
}
