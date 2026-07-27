import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useActiveNotes } from "./useActiveNotes";

describe("useActiveNotes", () => {
  it("replaces the set so React sees each change", () => {
    const { result } = renderHook(() => useActiveNotes());
    const initial = result.current.activeNotes;

    act(() => result.current.activateNote("C4"));

    expect(result.current.activeNotes.has("C4")).toBe(true);
    expect(result.current.activeNotes).not.toBe(initial);
  });

  it("keeps a note lit until it is explicitly released", () => {
    const { result } = renderHook(() => useActiveNotes());

    act(() => result.current.activateNote("C4"));
    expect(result.current.activeNotes.has("C4")).toBe(true);

    act(() => result.current.deactivateNote("C4"));
    expect(result.current.activeNotes.has("C4")).toBe(false);
  });

  it("holds a note lit while any input still has it down", () => {
    const { result } = renderHook(() => useActiveNotes());

    act(() => {
      result.current.activateNote("C4");
      result.current.activateNote("E4");
    });
    act(() => result.current.deactivateNote("E4"));

    expect(result.current.activeNotes.has("C4")).toBe(true);
    expect(result.current.activeNotes.has("E4")).toBe(false);
  });

  it("does not churn the set on redundant updates", () => {
    const { result } = renderHook(() => useActiveNotes());

    act(() => result.current.activateNote("C4"));
    const afterActivate = result.current.activeNotes;

    // A repeated activate would otherwise re-render every key.
    act(() => result.current.activateNote("C4"));
    expect(result.current.activeNotes).toBe(afterActivate);

    act(() => result.current.deactivateNote("G4"));
    expect(result.current.activeNotes).toBe(afterActivate);
  });

  it("clears everything at once", () => {
    const { result } = renderHook(() => useActiveNotes());

    act(() => {
      result.current.activateNote("C4");
      result.current.activateNote("E4");
    });
    act(() => result.current.clearAllNotes());

    expect(result.current.activeNotes.size).toBe(0);
  });
});
