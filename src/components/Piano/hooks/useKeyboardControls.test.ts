import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { generateNotes } from "@/lib/noteGenerator";
import { useKeyboardControls } from "./useKeyboardControls";

function setup(notes = generateNotes(3, 4)) {
  const handlers = {
    playNote: vi.fn(),
    stopNote: vi.fn(),
    activateNote: vi.fn(),
    deactivateNote: vi.fn(),
  };

  const view = renderHook(
    ({ currentNotes }: { currentNotes: typeof notes }) =>
      useKeyboardControls(
        currentNotes,
        handlers.playNote,
        handlers.stopNote,
        handlers.activateNote,
        handlers.deactivateNote,
      ),
    { initialProps: { currentNotes: notes } },
  );

  return { ...view, handlers };
}

function press(key: string, init: KeyboardEventInit = {}) {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key, cancelable: true, ...init }),
    );
  });
}

function release(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent("keyup", { key, cancelable: true }));
  });
}

describe("useKeyboardControls", () => {
  it("plays the note mapped to a key", () => {
    const { handlers } = setup();

    press("z");

    expect(handlers.playNote).toHaveBeenCalledWith("C3");
    expect(handlers.activateNote).toHaveBeenCalledWith("C3");
  });

  it("plays notes from the extended right-side keys", () => {
    const { handlers } = setup(generateNotes(2, 6));

    press("'");
    press("]");

    expect(handlers.playNote).toHaveBeenCalledWith("F4");
    expect(handlers.playNote).toHaveBeenCalledWith("G5");
  });

  it("keeps an aliased note held until both keyboard keys are released", () => {
    const { handlers } = setup(generateNotes(3, 5));

    press("q");
    press(",");

    expect(handlers.playNote).toHaveBeenCalledExactlyOnceWith("C4");

    release("q");
    expect(handlers.stopNote).not.toHaveBeenCalled();

    release(",");
    expect(handlers.stopNote).toHaveBeenCalledExactlyOnceWith("C4");
  });

  it("ignores auto-repeat so a held key retriggers only once", () => {
    const { handlers } = setup();

    press("z");
    press("z", { repeat: true });
    press("z", { repeat: true });

    expect(handlers.playNote).toHaveBeenCalledTimes(1);
  });

  it("releases on key up and ignores a second release", () => {
    const { handlers } = setup();

    press("z");
    release("z");
    release("z");

    expect(handlers.stopNote).toHaveBeenCalledExactlyOnceWith("C3");
    expect(handlers.deactivateNote).toHaveBeenCalledExactlyOnceWith("C3");
  });

  it("leaves Space and modified shortcuts alone", () => {
    const { handlers } = setup();

    press(" ", { code: "Space" });
    press("z", { ctrlKey: true });
    press("z", { metaKey: true });

    expect(handlers.playNote).not.toHaveBeenCalled();
  });

  it("ignores keys with no mapped note", () => {
    const { handlers } = setup();

    press("a");

    expect(handlers.playNote).not.toHaveBeenCalled();
  });

  it("releases held notes when the page goes inactive", () => {
    const { handlers } = setup();

    press("z");
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
  });

  it("releases against the outgoing notes when the octave range changes", () => {
    const { handlers, rerender } = setup();

    press("z");
    handlers.stopNote.mockClear();

    rerender({ currentNotes: generateNotes(2, 6) });

    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
  });

  it("releases everything held on unmount", () => {
    const { handlers, unmount } = setup();

    press("z");
    press("x");
    handlers.stopNote.mockClear();

    unmount();

    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
    expect(handlers.stopNote).toHaveBeenCalledWith("D3");
  });
});
