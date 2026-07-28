import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMouseControls } from "./useMouseControls";

const handlers = {
  playNote: vi.fn(),
  stopNote: vi.fn(),
  activateNote: vi.fn(),
  deactivateNote: vi.fn(),
  clearAllNotes: vi.fn(),
};

function setup() {
  return renderHook(() =>
    useMouseControls(
      handlers.playNote,
      handlers.stopNote,
      handlers.activateNote,
      handlers.deactivateNote,
      handlers.clearAllNotes,
    ),
  );
}

describe("useMouseControls", () => {
  beforeEach(() => {
    Object.values(handlers).forEach((handler) => handler.mockClear());
  });

  it("lights a key on press and clears it on release", () => {
    const { result } = setup();

    act(() => result.current.handleMouseDown("C3"));
    expect(handlers.playNote).toHaveBeenCalledWith("C3");
    expect(handlers.activateNote).toHaveBeenCalledWith("C3");
    expect(handlers.deactivateNote).not.toHaveBeenCalled();

    act(() => result.current.handleMouseUp());
    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
    expect(handlers.deactivateNote).toHaveBeenCalledWith("C3");
  });

  it("ignores hover when the button is not held", () => {
    const { result } = setup();

    act(() => result.current.handleMouseEnter("C3"));

    expect(handlers.playNote).not.toHaveBeenCalled();
  });

  it("hands off cleanly when dragging across keys", () => {
    const { result } = setup();

    act(() => result.current.handleMouseDown("C3"));
    act(() => result.current.handleMouseEnter("D3"));

    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
    expect(handlers.deactivateNote).toHaveBeenCalledWith("C3");
    expect(handlers.playNote).toHaveBeenCalledWith("D3");
    expect(handlers.activateNote).toHaveBeenCalledWith("D3");
  });

  it("does not retrigger when re-entering the key already held", () => {
    const { result } = setup();

    act(() => result.current.handleMouseDown("C3"));
    act(() => result.current.handleMouseEnter("C3"));

    expect(handlers.playNote).toHaveBeenCalledTimes(1);
    expect(handlers.stopNote).not.toHaveBeenCalled();
  });

  it("releases when the button comes up outside the keyboard", () => {
    const { result } = setup();

    act(() => result.current.handleMouseDown("C3"));
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
    expect(handlers.clearAllNotes).toHaveBeenCalled();
  });

  it("releases when the page goes inactive mid-press", () => {
    const { result } = setup();

    act(() => result.current.handleMouseDown("C3"));
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
    expect(handlers.deactivateNote).toHaveBeenCalledWith("C3");
  });
});
