import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SETTINGS_STORAGE_KEY } from "@/lib/settings";
import { resetSettingsStore, useSettings } from "./useSettings";

describe("useSettings", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    resetSettingsStore();
  });
  afterEach(() => vi.useRealTimers());

  function stored() {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw === null ? null : JSON.parse(raw);
  }

  it("starts from stored settings", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ volume: 0.25, bgColor: "#123456" }),
    );

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings.volume).toBe(0.25);
    expect(result.current.settings.bgColor).toBe("#123456");
  });

  it("persists a change once writes settle", () => {
    const { result } = renderHook(() => useSettings());

    act(() => result.current.updateSetting("volume", 0.5));
    expect(result.current.settings.volume).toBe(0.5);

    act(() => vi.runAllTimers());
    expect(stored().volume).toBe(0.5);
  });

  it("coalesces a burst of slider changes into one write", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useSettings());

    act(() => {
      for (let value = 1; value <= 20; value += 1) {
        result.current.updateSetting("volume", value / 20);
      }
    });
    act(() => vi.runAllTimers());

    expect(setItem).toHaveBeenCalledTimes(1);
    expect(stored().volume).toBe(1);
    setItem.mockRestore();
  });

  it("accepts an updater function for list-valued settings", () => {
    const { result } = renderHook(() => useSettings());
    const initialLength = result.current.settings.effectChain.length;

    act(() =>
      result.current.updateSetting("effectChain", (previous) =>
        previous.slice(0, -1),
      ),
    );

    expect(result.current.settings.effectChain).toHaveLength(initialLength - 1);
  });

  it("applies a multi-field patch in one update", () => {
    const { result } = renderHook(() => useSettings());

    act(() => result.current.patchSettings({ startOctave: 2, endOctave: 6 }));

    expect(result.current.settings).toMatchObject({
      startOctave: 2,
      endOctave: 6,
    });
  });

  it("resets preferences but keeps the effect chain", () => {
    const { result } = renderHook(() => useSettings());

    act(() =>
      result.current.patchSettings({
        volume: 0.1,
        bgColor: "#abcdef",
        labelsEnabled: false,
        pianoScale: 1.9,
        startOctave: 2,
        endOctave: 6,
      }),
    );
    const chain = result.current.settings.effectChain;

    act(() => result.current.resetSettings());

    expect(result.current.settings).toMatchObject({
      volume: 0.75,
      bgColor: "#0f172a",
      labelsEnabled: true,
      startOctave: 3,
      endOctave: 4,
    });
    // Zoom returns to following the viewport rather than a pinned value.
    expect(result.current.settings.pianoScale).toBeNull();
    // Rebuilding a rack is expensive, so a settings reset leaves it alone.
    expect(result.current.settings.effectChain).toBe(chain);
  });

  it("persists a reset", () => {
    const { result } = renderHook(() => useSettings());

    act(() => result.current.updateSetting("volume", 0.1));
    act(() => result.current.resetSettings());
    act(() => vi.runAllTimers());

    expect(stored().volume).toBe(0.75);
  });

  it("ignores a write that changes nothing", () => {
    const { result } = renderHook(() => useSettings());
    const before = result.current.settings;

    act(() => result.current.updateSetting("volume", before.volume));

    expect(result.current.settings).toBe(before);
  });

  it("keeps playing when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const { result } = renderHook(() => useSettings());

    act(() => result.current.updateSetting("volume", 0.3));
    expect(() => act(() => vi.runAllTimers())).not.toThrow();
    expect(result.current.settings.volume).toBe(0.3);

    vi.restoreAllMocks();
  });
});
