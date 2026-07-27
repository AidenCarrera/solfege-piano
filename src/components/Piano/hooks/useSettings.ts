"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_PREFERENCES,
  createDefaultSettings,
  loadSettings,
  saveSettings,
  type PianoSettings,
} from "@/lib/settings";

/** Sliders fire continuously; coalesce writes rather than serialising per frame. */
const SAVE_DEBOUNCE_MS = 250;

/**
 * Settings live in a module-level store read through `useSyncExternalStore`.
 *
 * `localStorage` does not exist while prerendering, and this is the API that
 * lets the server and the hydrating client agree on defaults before the stored
 * values swap in. A `useState` initialiser reading storage would render markup
 * that disagrees with the server's and break hydration.
 */
const serverSnapshot = createDefaultSettings();
let snapshot: PianoSettings | null = null;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function getSnapshot(): PianoSettings {
  // Cached, so repeated reads return an identical reference as React requires.
  snapshot ??= loadSettings();
  return snapshot;
}

function getServerSnapshot(): PianoSettings {
  return serverSnapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: PianoSettings): void {
  snapshot = next;
  listeners.forEach((listener) => listener());

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveSettings(next);
  }, SAVE_DEBOUNCE_MS);
}

/** Discards the in-memory store. Exported for tests, which share the module. */
export function resetSettingsStore(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  snapshot = null;
  listeners.clear();
}

export function useSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  /** Replaces several settings at once, in a single render and a single write. */
  const patchSettings = useCallback((patch: Partial<PianoSettings>) => {
    commit({ ...getSnapshot(), ...patch });
  }, []);

  /** Restores default preferences, keeping the user's effect chain intact. */
  const resetSettings = useCallback(() => {
    commit({ ...getSnapshot(), ...DEFAULT_PREFERENCES });
  }, []);

  /** Accepts a value or an updater, mirroring a `useState` setter. */
  const updateSetting = useCallback(
    <K extends keyof PianoSettings>(
      key: K,
      value:
        PianoSettings[K] | ((previous: PianoSettings[K]) => PianoSettings[K]),
    ) => {
      const previous = getSnapshot();
      const next =
        typeof value === "function"
          ? (value as (previous: PianoSettings[K]) => PianoSettings[K])(
              previous[key],
            )
          : value;

      if (Object.is(previous[key], next)) return;
      commit({ ...previous, [key]: next });
    },
    [],
  );

  return { settings, updateSetting, patchSettings, resetSettings };
}
