import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTouchControls } from "./useTouchControls";

const handlers = {
  playNote: vi.fn(),
  stopNote: vi.fn(),
  activateNote: vi.fn(),
  deactivateNote: vi.fn(),
};

/** Two keys, so a finger can slide from one to the other. */
function Keyboard() {
  const { handleTouchStart, handleTouchMove, handleTouchEnd } =
    useTouchControls(
      handlers.playNote,
      handlers.stopNote,
      handlers.activateNote,
      handlers.deactivateNote,
    );

  return (
    <>
      {["C3", "D3"].map((note) => (
        <button
          key={note}
          data-testid={note}
          data-note-name={note}
          onTouchStart={(e) => handleTouchStart(e, note)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      ))}
    </>
  );
}

const touch = (identifier: number) => ({ identifier, clientX: 0, clientY: 0 });

describe("useTouchControls", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.values(handlers).forEach((handler) => handler.mockClear());
  });
  afterEach(() => vi.useRealTimers());

  it("plays a note on touch and releases it on lift", () => {
    render(<Keyboard />);
    const key = screen.getByTestId("C3");

    fireEvent.touchStart(key, { changedTouches: [touch(0)] });
    expect(handlers.playNote).toHaveBeenCalledWith("C3");

    fireEvent.touchEnd(key, { changedTouches: [touch(0)] });
    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
  });

  it("keeps a note sounding while a second finger still holds it", () => {
    render(<Keyboard />);
    const key = screen.getByTestId("C3");

    fireEvent.touchStart(key, { changedTouches: [touch(0)] });
    fireEvent.touchStart(key, { changedTouches: [touch(1)] });

    fireEvent.touchEnd(key, { changedTouches: [touch(0)] });
    expect(handlers.stopNote).not.toHaveBeenCalled();

    fireEvent.touchEnd(key, { changedTouches: [touch(1)] });
    expect(handlers.stopNote).toHaveBeenCalledExactlyOnceWith("C3");
  });

  it("plays each finger of a chord independently", () => {
    render(<Keyboard />);

    fireEvent.touchStart(screen.getByTestId("C3"), {
      changedTouches: [touch(0)],
    });
    fireEvent.touchStart(screen.getByTestId("D3"), {
      changedTouches: [touch(1)],
    });

    expect(handlers.playNote).toHaveBeenCalledWith("C3");
    expect(handlers.playNote).toHaveBeenCalledWith("D3");
  });

  it("swaps notes when a finger slides onto another key", () => {
    render(<Keyboard />);
    const from = screen.getByTestId("C3");
    const to = screen.getByTestId("D3");

    fireEvent.touchStart(from, { changedTouches: [touch(0)] });

    // Hit-testing goes through the point under the finger, not the event
    // target. jsdom does no layout, so it has no `elementFromPoint` to spy on.
    document.elementFromPoint = () => to;
    fireEvent.touchMove(from, { touches: [touch(0)] });

    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
    expect(handlers.playNote).toHaveBeenCalledWith("D3");
  });

  it("holds the highlight past the flash timeout while a finger stays down", () => {
    render(<Keyboard />);
    const key = screen.getByTestId("C3");

    fireEvent.touchStart(key, { changedTouches: [touch(0)] });
    vi.advanceTimersByTime(1000);

    expect(handlers.deactivateNote).not.toHaveBeenCalled();
  });

  it("releases sounding notes on unmount", () => {
    const view = render(<Keyboard />);

    fireEvent.touchStart(screen.getByTestId("C3"), {
      changedTouches: [touch(0)],
    });
    view.unmount();

    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
  });
});
