import { describe, expect, it } from "vitest";
import {
  EFFECT_PRESETS,
  type EffectType,
  type EffectParams,
} from "@/lib/effects";
import { EFFECT_BUILDERS } from "@/lib/audio/effectSpecs";
import { EFFECT_MODES, EFFECT_PARAM_SLIDERS } from "./effectControls";

const effectTypes = Object.keys(EFFECT_PRESETS) as EffectType[];

describe("effect tables", () => {
  it("can build every mode the UI offers", () => {
    effectTypes.forEach((type) => {
      const builders = EFFECT_BUILDERS[type] as Record<string, unknown>;
      EFFECT_MODES[type].forEach((mode) => {
        expect(builders[mode.value], `${type}/${mode.value}`).toBeDefined();
      });
    });
  });

  it("offers every buildable mode in the UI", () => {
    effectTypes.forEach((type) => {
      const offered = EFFECT_MODES[type].map((mode) => mode.value as string);
      const buildable = Object.keys(EFFECT_BUILDERS[type]);

      if (offered.length === 0) {
        expect(buildable).toHaveLength(1);
        return;
      }
      expect(offered.toSorted()).toEqual(buildable.toSorted());
    });
  });

  it("starts each effect in a buildable mode", () => {
    effectTypes.forEach((type) => {
      const builders = EFFECT_BUILDERS[type] as Record<string, unknown>;
      expect(builders[EFFECT_PRESETS[type].mode], type).toBeDefined();
    });
  });

  it("gives every slider a preset value within its own range", () => {
    effectTypes.forEach((type) => {
      const preset = EFFECT_PRESETS[type] as EffectParams &
        Record<string, number>;
      EFFECT_PARAM_SLIDERS[type].forEach((slider) => {
        const value = preset[slider.field as string];
        expect(value, `${type}.${String(slider.field)}`).toBeTypeOf("number");
        expect(value).toBeGreaterThanOrEqual(slider.min);
        expect(value).toBeLessThanOrEqual(slider.max);
      });
    });
  });
});
