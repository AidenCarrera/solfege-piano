import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
