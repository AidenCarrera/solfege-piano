import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateNotes } from "@/lib/noteGenerator";
import { useEarTraining } from "./useEarTraining";

const notes = generateNotes(3, 4);
const byName = (name: string) => notes.find((note) => note.name === name)!;

function setup({ candidates = [byName("E3")], playReference = true } = {}) {
  const playNote = vi.fn();
  const releaseNotes = vi.fn();
  const view = renderHook(() =>
    useEarTraining({
      candidates,
      notes,
      tonic: 0,
      playReference,
      playNote,
      releaseNotes,
    }),
  );
  return { ...view, playNote, releaseNotes };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useEarTraining", () => {
  it("plays Do before the mystery note, then waits for an answer", () => {
    const { result, playNote, releaseNotes } = setup();

    act(() => result.current.start());
    expect(result.current.state).toMatchObject({
      phase: "prompting",
      target: "E3",
    });

    act(() => vi.runAllTimers());

    expect(playNote.mock.calls.map(([name]) => name)).toEqual(["C3", "E3"]);
    expect(releaseNotes).toHaveBeenCalledWith(["E3"]);
    expect(result.current.state.phase).toBe("awaiting");
  });

  it("skips the reference when asked to", () => {
    const { result, playNote } = setup({ playReference: false });

    act(() => result.current.start());
    act(() => vi.runAllTimers());

    expect(playNote.mock.calls.map(([name]) => name)).toEqual(["E3"]);
  });

  it("marks a wrong key, then moves on after a right one", () => {
    const { result, playNote } = setup({
      candidates: [byName("E3"), byName("G3")],
    });
    act(() => result.current.start());
    act(() => vi.runAllTimers());
    const target = result.current.state.target!;
    const wrong = target === "E3" ? "F3" : "A3";

    act(() => result.current.handleNote(wrong));
    expect(result.current.state.phase).toBe("wrong");
    expect(result.current.keyFeedback.get(wrong)).toBe("wrong");

    act(() => result.current.handleNote(target));
    expect(result.current.state.phase).toBe("correct");
    expect(result.current.keyFeedback.get(target)).toBe("correct");

    playNote.mockClear();
    act(() => vi.advanceTimersByTime(1200));
    expect(result.current.state.phase).toBe("prompting");
    expect(result.current.state.target).not.toBe(target);
  });

  it("highlights the answer on reveal", () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => result.current.reveal());

    expect(result.current.state.phase).toBe("revealed");
    expect(result.current.keyFeedback.get("E3")).toBe("reveal");
  });

  it("stops pending prompts when stopped or reset", () => {
    const { result, playNote } = setup();

    act(() => result.current.start());
    act(() => result.current.reset());
    act(() => vi.runAllTimers());
    expect(playNote).not.toHaveBeenCalled();
    expect(result.current.state).toMatchObject({
      phase: "ready",
      target: null,
    });

    act(() => result.current.stop());
    expect(result.current.state.phase).toBe("idle");
  });
});
