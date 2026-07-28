import { afterEach, describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { OrientationGate } from "./OrientationGate";

const originalMatchMedia = window.matchMedia;

/**
 * jsdom has no `matchMedia`. This stands in for one, and hands back a way to
 * flip the answer and notify subscribers the way a real rotation would.
 */
function stubMatchMedia(initiallyMatches: boolean) {
  const listeners = new Set<() => void>();
  let matches = initiallyMatches;

  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() {
      return matches;
    },
    addEventListener: (_type: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;

  return function rotateTo(next: boolean) {
    matches = next;
    act(() => listeners.forEach((listener) => listener()));
  };
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

const prompt = () => screen.queryByRole("alertdialog");

describe("OrientationGate", () => {
  it("stays out of the way on a landscape screen", () => {
    stubMatchMedia(false);
    render(<OrientationGate />);

    expect(prompt()).toBeNull();
  });

  it("asks a portrait phone to rotate", () => {
    stubMatchMedia(true);
    render(<OrientationGate />);

    expect(prompt()).not.toBeNull();
    expect(screen.getByText("Rotate your device")).toBeTruthy();
  });

  it("clears itself once the phone is turned sideways", () => {
    const rotateTo = stubMatchMedia(true);
    render(<OrientationGate />);

    rotateTo(false);

    expect(prompt()).toBeNull();
  });

  it("lets a device that cannot rotate through anyway", () => {
    stubMatchMedia(true);
    render(<OrientationGate />);

    fireEvent.click(
      screen.getByRole("button", { name: /continue in portrait/i }),
    );

    expect(prompt()).toBeNull();
  });

  it("does not ask again after the prompt has been waved off", () => {
    const rotateTo = stubMatchMedia(true);
    render(<OrientationGate />);

    fireEvent.click(
      screen.getByRole("button", { name: /continue in portrait/i }),
    );
    rotateTo(false);
    rotateTo(true);

    expect(prompt()).toBeNull();
  });
});
