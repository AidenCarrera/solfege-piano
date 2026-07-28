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
  // Passed as inline arrows, as `Piano` does: every render hands the hook a
  // fresh set of identities.
  const keyboardRef = useTouchControls(
    (note) => handlers.playNote(note),
    (note) => handlers.stopNote(note),
    (note) => handlers.activateNote(note),
    (note) => handlers.deactivateNote(note),
  );

  return (
    <div ref={keyboardRef}>
      {["C3", "D3"].map((note) => (
        <button key={note} data-testid={note} data-note-name={note} />
      ))}
    </div>
  );
}

/**
 * Touches carry the element they landed on; the hook reads the note from there
 * rather than from the listener's own element.
 */
const touch = (identifier: number, target?: Element) => ({
  identifier,
  target,
  clientX: 0,
  clientY: 0,
});

describe("useTouchControls", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.values(handlers).forEach((handler) => handler.mockClear());
  });
  afterEach(() => vi.useRealTimers());

  it("plays a note on touch and releases it on lift", () => {
    render(<Keyboard />);
    const key = screen.getByTestId("C3");

    fireEvent.touchStart(key, { changedTouches: [touch(0, key)] });
    expect(handlers.playNote).toHaveBeenCalledWith("C3");

    fireEvent.touchEnd(key, { changedTouches: [touch(0)] });
    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
  });

  it("cancels the touch so the tap is not replayed as a mouse press", () => {
    render(<Keyboard />);
    const key = screen.getByTestId("C3");

    const notPrevented = fireEvent.touchStart(key, {
      changedTouches: [touch(0, key)],
    });
    expect(notPrevented).toBe(false);
  });

  it("keeps a note sounding while a second finger still holds it", () => {
    render(<Keyboard />);
    const key = screen.getByTestId("C3");

    fireEvent.touchStart(key, { changedTouches: [touch(0, key)] });
    fireEvent.touchStart(key, { changedTouches: [touch(1, key)] });

    fireEvent.touchEnd(key, { changedTouches: [touch(0)] });
    expect(handlers.stopNote).not.toHaveBeenCalled();

    fireEvent.touchEnd(key, { changedTouches: [touch(1)] });
    expect(handlers.stopNote).toHaveBeenCalledExactlyOnceWith("C3");
  });

  it("plays each finger of a chord independently", () => {
    render(<Keyboard />);
    const low = screen.getByTestId("C3");
    const high = screen.getByTestId("D3");

    fireEvent.touchStart(low, { changedTouches: [touch(0, low)] });
    fireEvent.touchStart(high, { changedTouches: [touch(1, high)] });

    expect(handlers.playNote).toHaveBeenCalledWith("C3");
    expect(handlers.playNote).toHaveBeenCalledWith("D3");
  });

  it("swaps notes when a finger slides onto another key", () => {
    render(<Keyboard />);
    const from = screen.getByTestId("C3");
    const to = screen.getByTestId("D3");

    fireEvent.touchStart(from, { changedTouches: [touch(0, from)] });

    // Once moving, hit-testing goes through the point under the finger rather
    // than the touch's target, which stays pinned to the key it started on.
    // jsdom does no layout, so it has no `elementFromPoint` to spy on.
    document.elementFromPoint = () => to;
    fireEvent.touchMove(from, { touches: [touch(0)] });

    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
    expect(handlers.playNote).toHaveBeenCalledWith("D3");
  });

  it("keeps the key lit for as long as the finger is down", () => {
    render(<Keyboard />);
    const key = screen.getByTestId("C3");

    fireEvent.touchStart(key, { changedTouches: [touch(0, key)] });
    vi.advanceTimersByTime(1000);

    expect(handlers.activateNote).toHaveBeenCalledWith("C3");
    expect(handlers.deactivateNote).not.toHaveBeenCalled();

    fireEvent.touchEnd(key, { changedTouches: [touch(0)] });
    expect(handlers.deactivateNote).toHaveBeenCalledWith("C3");
  });

  it("holds a note through a re-render that rebuilds the callbacks", () => {
    const view = render(<Keyboard />);
    const key = screen.getByTestId("C3");

    fireEvent.touchStart(key, { changedTouches: [touch(0, key)] });
    // Piano does this whenever a setting like volume changes.
    view.rerender(<Keyboard />);
    expect(handlers.stopNote).not.toHaveBeenCalled();

    // The listeners have to survive it too, or the finger can never lift.
    fireEvent.touchEnd(key, { changedTouches: [touch(0)] });
    expect(handlers.stopNote).toHaveBeenCalledExactlyOnceWith("C3");
  });

  it("releases sounding notes on unmount", () => {
    const view = render(<Keyboard />);
    const key = screen.getByTestId("C3");

    fireEvent.touchStart(key, { changedTouches: [touch(0, key)] });
    view.unmount();

    expect(handlers.stopNote).toHaveBeenCalledWith("C3");
  });
});
