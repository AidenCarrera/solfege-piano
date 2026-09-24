import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSustainToggle } from "./useSustainToggle";

function space(type: "keydown" | "keyup", target: EventTarget = window) {
  const event = new KeyboardEvent(type, {
    code: "Space",
    key: " ",
    bubbles: true,
    cancelable: true,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

function pressSpace(target: EventTarget = window) {
  return space("keydown", target);
}

describe("useSustainToggle", () => {
  it("toggles with the spacebar and releases notes when turned off", () => {
    const onRelease = vi.fn();
    const { result } = renderHook(() => useSustainToggle(onRelease));

    pressSpace();
    expect(result.current.sustainActive).toBe(true);
    expect(onRelease).not.toHaveBeenCalled();

    pressSpace();
    expect(result.current.sustainActive).toBe(false);
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it("ignores repeated pedal messages", () => {
    const onRelease = vi.fn();
    const { result } = renderHook(() => useSustainToggle(onRelease));

    act(() => {
      result.current.setSustain(true);
      result.current.setSustain(true);
    });
    act(() => {
      result.current.setSustain(false);
      result.current.setSustain(false);
    });

    expect(result.current.sustainActive).toBe(false);
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it.each(["button", "select"])(
    "toggles instead of activating a focused %s",
    (tag) => {
      const { result } = renderHook(() => useSustainToggle(vi.fn()));
      const control = document.createElement(tag);
      document.body.append(control);

      const down = pressSpace(control);
      const up = space("keyup", control);

      expect(result.current.sustainActive).toBe(true);
      expect(down.defaultPrevented).toBe(true);
      expect(up.defaultPrevented).toBe(true);
      control.remove();
    },
  );

  it("ignores held-down repeats without letting them scroll", () => {
    const { result } = renderHook(() => useSustainToggle(vi.fn()));

    pressSpace();
    const repeat = new KeyboardEvent("keydown", {
      code: "Space",
      key: " ",
      repeat: true,
      cancelable: true,
    });
    act(() => {
      window.dispatchEvent(repeat);
    });

    expect(result.current.sustainActive).toBe(true);
    expect(repeat.defaultPrevented).toBe(true);
  });

  it("leaves the spacebar to text fields", () => {
    const { result } = renderHook(() => useSustainToggle(vi.fn()));
    const input = document.createElement("input");
    document.body.append(input);

    const down = pressSpace(input);

    expect(result.current.sustainActive).toBe(false);
    expect(down.defaultPrevented).toBe(false);
    input.remove();
  });
});
