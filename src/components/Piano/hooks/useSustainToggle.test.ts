import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSustainToggle } from "./useSustainToggle";

function pressSpace(target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "Space",
        key: " ",
        bubbles: true,
        cancelable: true,
      }),
    );
  });
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

  it("leaves the spacebar to focused buttons", () => {
    const { result } = renderHook(() => useSustainToggle(vi.fn()));
    const button = document.createElement("button");
    document.body.append(button);

    pressSpace(button);

    expect(result.current.sustainActive).toBe(false);
    button.remove();
  });
});
