import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useToneEngine } from "./useToneEngine";

const mocks = vi.hoisted(() => {
  const contextState = { value: "suspended" as AudioContextState };
  return {
    contextState,
    start: vi.fn(async () => {
      contextState.value = "running";
    }),
    primedSource: { connect: vi.fn(), start: vi.fn(), buffer: null },
  };
});

vi.mock("tone", () => {
  const rawContext = {
    sampleRate: 44100,
    destination: {},
    createBuffer: vi.fn(() => ({})),
    createBufferSource: vi.fn(() => mocks.primedSource),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    get state() {
      return mocks.contextState.value;
    },
  };
  const context = {
    lookAhead: 0,
    rawContext,
    get state() {
      return mocks.contextState.value;
    },
  };

  return {
    getContext: () => context,
    getTransport: vi.fn(),
    gainToDb: (value: number) => value,
    start: mocks.start,
    Limiter: class {
      connect = vi.fn();
      dispose = vi.fn();
    },
  };
});

function Probe({ enabled }: { enabled: boolean }) {
  useToneEngine(enabled);
  return null;
}

describe("useToneEngine", () => {
  beforeEach(() => {
    mocks.contextState.value = "suspended";
    mocks.start.mockClear();
    mocks.primedSource.start.mockClear();
  });

  it("leaves the context alone until the user has interacted", async () => {
    render(<Probe enabled />);

    // Long enough for the dynamic import to settle.
    await waitFor(() => expect(mocks.start).not.toHaveBeenCalled());
  });

  it("unlocks with no second gesture when the engine loads after the click", async () => {
    // `enabled` off stands in for the bundle still being in flight: the click
    // that starts the import is the one that has to unlock audio, and it is
    // over before the engine can attach a listener of its own.
    const view = render(<Probe enabled={false} />);
    fireEvent.pointerDown(window);
    expect(mocks.start).not.toHaveBeenCalled();

    view.rerender(<Probe enabled />);

    await waitFor(() => expect(mocks.start).toHaveBeenCalledOnce());
  });

  it("starts the output device before the first note is triggered", async () => {
    render(<Probe enabled />);
    fireEvent.pointerDown(window);

    await waitFor(() => expect(mocks.primedSource.start).toHaveBeenCalled());
  });
});
