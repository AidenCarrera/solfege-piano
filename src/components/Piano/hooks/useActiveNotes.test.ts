import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveNotes } from "./useActiveNotes";

describe("useActiveNotes", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("replaces the set so React sees each change", () => {
    const { result } = renderHook(() => useActiveNotes());
    const initial = result.current.activeNotes;

    act(() => result.current.activateNote("C4"));

    expect(result.current.activeNotes.has("C4")).toBe(true);
    expect(result.current.activeNotes).not.toBe(initial);
  });

  it("clears a flashed note once its duration elapses", () => {
    const { result } = renderHook(() => useActiveNotes());

    act(() => result.current.flashNote("C4", 250));
    expect(result.current.activeNotes.has("C4")).toBe(true);

    act(() => vi.advanceTimersByTime(249));
    expect(result.current.activeNotes.has("C4")).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.activeNotes.has("C4")).toBe(false);
  });

  it("restarts the timer when a note is reflashed mid-flash", () => {
    const { result } = renderHook(() => useActiveNotes());

    act(() => result.current.flashNote("C4", 250));
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.flashNote("C4", 250));

    // The first timer must not fire and cut the second flash short.
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.activeNotes.has("C4")).toBe(true);

    act(() => vi.advanceTimersByTime(150));
    expect(result.current.activeNotes.has("C4")).toBe(false);
  });

  it("cancels pending flashes when cleared", () => {
    const { result } = renderHook(() => useActiveNotes());

    act(() => {
      result.current.flashNote("C4", 250);
      result.current.activateNote("E4");
    });
    act(() => result.current.clearAllNotes());

    expect(result.current.activeNotes.size).toBe(0);

    // A surviving timer would deactivate a note the user has since pressed.
    act(() => result.current.activateNote("C4"));
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.activeNotes.has("C4")).toBe(true);
  });

  it("drops flash timers on unmount", () => {
    const { result, unmount } = renderHook(() => useActiveNotes());

    act(() => result.current.flashNote("C4", 250));
    unmount();

    expect(() => vi.advanceTimersByTime(300)).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});
