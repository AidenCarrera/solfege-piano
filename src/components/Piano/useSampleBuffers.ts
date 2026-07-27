"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type * as ToneType from "tone";
import type { Note } from "@/lib/note";
import type { SoundType } from "@/lib/config";
import { toToneNote } from "@/lib/note";

interface LoadResult {
  /** Identifies the request this result came from. */
  key: string;
  buffers: ToneType.ToneAudioBuffers | null;
  error: string | null;
}

export interface SampleBuffers {
  /** `null` while loading, after an error, or when the sound bank changes. */
  buffers: ToneType.ToneAudioBuffers | null;
  error: string | null;
  retry: () => void;
}

/**
 * Loads the sample set for the current sound bank and note range.
 *
 * Results carry the key of the request that produced them and are compared
 * against the current key during render, so a slow load that resolves after
 * the user has switched banks is ignored rather than briefly displayed.
 *
 * `ToneAudioBuffers` reports only a terminal `onload`, so callers derive
 * "loading" from `buffers === null` instead of a separate flag.
 */
export function useSampleBuffers(
  Tone: typeof ToneType | null,
  soundType: SoundType,
  notes: Note[],
  enabled: boolean,
): SampleBuffers {
  const [result, setResult] = useState<LoadResult | null>(null);
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
    let mounted = true;

    const urls: Record<string, string> = {};
    notes.forEach((note) => {
      urls[toToneNote(note.name)] = `${note.fileName}.mp3`;
    });

    const loaded = new Tone.ToneAudioBuffers({
      urls,
      baseUrl: `/samples/${soundType.toLowerCase()}/`,
      onload: () => {
        if (mounted)
          setResult({ key: requestKey, buffers: loaded, error: null });
      },
      onerror: () => {
        if (mounted) {
          setResult({
            key: requestKey,
            buffers: null,
            error: "The audio samples could not be loaded.",
          });
        }
      },
    });

    return () => {
      mounted = false;
      loaded.dispose();
    };
  }, [Tone, soundType, notes, enabled, requestKey]);

  const retry = useCallback(() => setAttempt((previous) => previous + 1), []);

  const current = result?.key === requestKey ? result : null;
  return {
    buffers: current?.buffers ?? null,
    error: current?.error ?? null,
    retry,
  };
}
