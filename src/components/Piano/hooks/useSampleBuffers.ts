"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type * as ToneType from "tone";
import type { Note } from "@/lib/note";
import type { SoundType } from "@/lib/config";

/** State carried from a load, tagged with the request that produced it. */
interface KeyedState<T> {
  key: string;
  value: T;
}

interface LoadOutcome {
  buffers: ToneType.ToneAudioBuffers | null;
  error: string | null;
}

export interface SampleBuffers {
  /** `null` while loading, after an error, or when the sound bank changes. */
  buffers: ToneType.ToneAudioBuffers | null;
  /** Fraction of the sample set decoded so far, from 0 to 1. */
  progress: number;
  error: string | null;
  retry: () => void;
}

/**
 * Loads the sample set for the current sound bank and note range.
 *
 * Samples are added one at a time rather than through the constructor's url
 * map, because that form reports only a single terminal `onload` and cannot
 * drive a progress bar.
 *
 * State carries the key of the request that produced it and is compared
 * against the current key during render, so a slow load that resolves after
 * the user has switched banks is ignored rather than briefly displayed.
 */
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

  // Describes the sample set by content, so it changes exactly when the loader
  // below re-runs. `notes` is derived from the octave range, so a new array
  // always means a different set of notes.
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
