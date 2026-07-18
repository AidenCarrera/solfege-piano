import { describe, expect, it } from "vitest";
import { createEffectNode, EFFECT_PRESETS } from "./effects";

describe("effect presets", () => {
  it("creates independent enabled nodes", () => {
    const first = createEffectNode("Reverb");
    const second = createEffectNode("Reverb");

    expect(first.enabled).toBe(true);
    expect(first.id).not.toBe(second.id);
    expect(first.params).toEqual(EFFECT_PRESETS.Reverb);
    expect(first.params).not.toBe(EFFECT_PRESETS.Reverb);
  });

  it("keeps modulation defaults within supported modes", () => {
    const modulation = createEffectNode("Modulation");

    expect(["Chorus", "Vibrato", "Phaser"]).toContain(modulation.params.mode);
  });
});
