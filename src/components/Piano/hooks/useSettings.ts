"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_PREFERENCES,
  createDefaultSettings,
  loadSettings,
  saveSettings,
  type PianoSettings,
  type UpdateSetting,
} from "@/lib/settings";

const SAVE_DEBOUNCE_MS = 250;

// SSR uses defaults; the client store hydrates from localStorage.
const serverSnapshot = createDefaultSettings();
let snapshot: PianoSettings | null = null;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function getSnapshot(): PianoSettings {
  // React requires repeated reads to return the same object until a change.
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

  const patchSettings = useCallback((patch: Partial<PianoSettings>) => {
    commit({ ...getSnapshot(), ...patch });
  }, []);

  const resetSettings = useCallback(() => {
    commit({ ...getSnapshot(), ...DEFAULT_PREFERENCES });
  }, []);

  const updateSetting = useCallback<UpdateSetting>((key, value) => {
    const previous = getSnapshot();
    const next = typeof value === "function" ? value(previous[key]) : value;

    if (Object.is(previous[key], next)) return;
    commit({ ...previous, [key]: next });
  }, []);

  return { settings, updateSetting, patchSettings, resetSettings };
}
