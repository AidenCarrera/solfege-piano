import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEffectNode, type EffectNode } from "@/lib/effects";
import { EffectsTab } from "./EffectsTab";

/** Mirrors how ControlPanel drives the tab, so edits round-trip through state. */
function Rack({ initial = [] }: { initial?: EffectNode[] }) {
  const [effectChain, setEffectChain] = useState<EffectNode[]>(initial);

  return (
    <>
      <EffectsTab
        effectChain={effectChain}
        setEffectChain={setEffectChain}
        borderColor="#000"
      />
      <output data-testid="chain">
        {effectChain.map((effect) => effect.type).join(",")}
      </output>
    </>
  );
}

const chain = () => screen.getByTestId("chain").textContent;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EffectsTab", () => {
  // The palette buttons also start drags, so a plain tap must still add.
  it("adds an effect when a palette button is tapped", () => {
    render(<Rack />);

    fireEvent.click(screen.getByRole("button", { name: "Delay" }));

    expect(chain()).toBe("Delay");
  });

  it("appends to the end of an existing chain", () => {
    render(<Rack initial={[createEffectNode("Reverb")]} />);

    fireEvent.click(screen.getByRole("button", { name: "Delay" }));

    expect(chain()).toBe("Reverb,Delay");
  });

  // The rack has to be mounted before the drag starts, or the drop is lost.
  it("drops a dragged effect into an empty chain", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0,
      right: 500,
      top: 0,
      bottom: 200,
      width: 500,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    render(<Rack />);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Delay" }), {
      button: 0,
      clientX: 10,
      clientY: 10,
    });
    // First move passes the activation threshold, second one picks the slot.
    fireEvent.pointerMove(document, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(document, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(document, { clientX: 100, clientY: 100 });

    expect(chain()).toBe("Delay");
  });

  it("removes the effect whose card button is pressed", () => {
    render(
      <Rack
        initial={[createEffectNode("Delay"), createEffectNode("Reverb")]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Delay" }));

    expect(chain()).toBe("Reverb");
  });
});
