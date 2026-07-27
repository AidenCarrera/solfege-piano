import { describe, expect, it } from "vitest";
import { EFFECT_PRESETS } from "./effects";
import { createDefaultSettings, parseSettings } from "./settings";

const defaults = createDefaultSettings();

describe("parseSettings", () => {
  it("falls back to defaults for anything that is not an object", () => {
    for (const value of [null, undefined, 42, "settings", []]) {
      expect(parseSettings(value)).toMatchObject({
        volume: defaults.volume,
        bgColor: defaults.bgColor,
        soundType: defaults.soundType,
      });
    }
  });

  it("keeps valid stored values", () => {
    const parsed = parseSettings({
      volume: 0.4,
      bgColor: "#AABBCC",
      soundType: "Solfege",
      startOctave: 2,
      endOctave: 6,
      pianoScale: 1.2,
      labelsEnabled: false,
      solfegeEnabled: true,
    });

    expect(parsed).toMatchObject({
      volume: 0.4,
      bgColor: "#AABBCC",
      soundType: "Solfege",
      startOctave: 2,
      endOctave: 6,
      pianoScale: 1.2,
      labelsEnabled: false,
      solfegeEnabled: true,
    });
  });

  it("clamps numbers into range instead of dropping them", () => {
    expect(parseSettings({ volume: 9 }).volume).toBe(1);
    expect(parseSettings({ volume: -3 }).volume).toBe(0);
    expect(parseSettings({ pianoScale: 99 }).pianoScale).toBe(2);
  });

  it("rejects values of the wrong type or shape", () => {
    expect(parseSettings({ volume: "loud" }).volume).toBe(defaults.volume);
    expect(parseSettings({ volume: NaN }).volume).toBe(defaults.volume);
    expect(parseSettings({ bgColor: "red" }).bgColor).toBe(defaults.bgColor);
    expect(parseSettings({ bgColor: "#fff" }).bgColor).toBe(defaults.bgColor);
    expect(parseSettings({ soundType: "Trumpet" }).soundType).toBe(
      defaults.soundType,
    );
    expect(parseSettings({ labelsEnabled: "yes" }).labelsEnabled).toBe(
      defaults.labelsEnabled,
    );
  });

  it("only accepts octave ranges the UI can actually select", () => {
    expect(parseSettings({ startOctave: 3, endOctave: 5 })).toMatchObject({
      startOctave: 3,
      endOctave: 5,
    });

    // Not a selectable pair, so both ends fall back together.
    expect(parseSettings({ startOctave: 1, endOctave: 9 })).toMatchObject({
      startOctave: defaults.startOctave,
      endOctave: defaults.endOctave,
    });
  });

  it("treats a missing zoom as 'follow the viewport'", () => {
    expect(parseSettings({}).pianoScale).toBeNull();
    expect(parseSettings({ pianoScale: null }).pianoScale).toBeNull();
  });

  describe("effect chain", () => {
    it("restores a stored chain with fresh, unique ids", () => {
      const parsed = parseSettings({
        effectChain: [
          { id: "effect-1", type: "Delay", enabled: false, params: {} },
          { id: "effect-1", type: "Reverb", enabled: true, params: {} },
        ],
      });

      expect(parsed.effectChain).toHaveLength(2);
      expect(parsed.effectChain[0]).toMatchObject({
        type: "Delay",
        enabled: false,
      });
      // Duplicate stored ids would collide as React keys and audio-graph keys.
      expect(parsed.effectChain[0]!.id).not.toBe(parsed.effectChain[1]!.id);
    });

    it("fills in parameters missing from an older stored chain", () => {
      const parsed = parseSettings({
        effectChain: [{ type: "Reverb", params: { mix: 0.9 } }],
      });

      // Consumers read every field with no fallback of their own.
      expect(parsed.effectChain[0]!.params).toEqual({
        ...EFFECT_PRESETS.Reverb,
        mix: 0.9,
      });
    });

    it("drops entries whose type cannot be built", () => {
      const parsed = parseSettings({
        effectChain: [
          { type: "Wormhole", params: {} },
          "not an effect",
          null,
          { type: "Delay", params: {} },
        ],
      });

      expect(parsed.effectChain).toHaveLength(1);
      expect(parsed.effectChain[0]!.type).toBe("Delay");
    });

    it("replaces a mode that has no builder", () => {
      const parsed = parseSettings({
        effectChain: [{ type: "Reverb", params: { mode: "Chorus" } }],
      });

      expect(parsed.effectChain[0]!.params.mode).toBe(
        EFFECT_PRESETS.Reverb.mode,
      );
    });

    it("distinguishes a deliberately empty chain from a missing one", () => {
      expect(parseSettings({ effectChain: [] }).effectChain).toEqual([]);
      expect(parseSettings({}).effectChain).toHaveLength(
        defaults.effectChain.length,
      );
    });

    it("caps an implausibly long chain", () => {
      const parsed = parseSettings({
        effectChain: Array.from({ length: 500 }, () => ({
          type: "Delay",
          params: {},
        })),
      });

      expect(parsed.effectChain.length).toBeLessThanOrEqual(24);
    });
  });
});
