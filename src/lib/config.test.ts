import { describe, expect, it } from "vitest";
import {
  clampScale,
  fitScale,
  getReleaseCurve,
  getReleaseMs,
  shortScreenFitScale,
  sideInset,
  PIANO_CONFIG,
  PIANO_INSET,
  PIANO_SCALE,
} from "./config";

function keyboardWidth(whiteKeys: number): number {
  return whiteKeys * PIANO_CONFIG.WHITE_KEY_WIDTH_REM * 16;
}

const KEYBOARD_HEIGHT_PX = 380;

describe("sample release", () => {
  it("gives Solfege a slower initial fade without changing the piano", () => {
    expect(getReleaseMs("Piano")).toBe(PIANO_CONFIG.FADE_OUT_MS);
    expect(getReleaseMs("Solfege")).toBe(PIANO_CONFIG.SOLFEGE_FADE_OUT_MS);
    expect(getReleaseMs("Solfege")).toBeGreaterThan(getReleaseMs("Piano"));
    expect(getReleaseCurve("Piano")).toBe("exponential");
    expect(getReleaseCurve("Solfege")).toBe("linear");
  });
});

describe("clampScale", () => {
  it("holds the slider's own bounds", () => {
    expect(clampScale(0.1)).toBe(PIANO_SCALE.MIN);
    expect(clampScale(9)).toBe(PIANO_SCALE.MAX);
    expect(clampScale(1.2)).toBe(1.2);
  });
});

describe("sideInset", () => {
  it("grows with the viewport, between its two bounds", () => {
    expect(sideInset(320)).toBe(PIANO_INSET.SIDE_MIN_PX);
    expect(sideInset(10000)).toBe(PIANO_INSET.SIDE_MAX_PX);
    expect(sideInset(1920)).toBeCloseTo(1920 * PIANO_INSET.SIDE_RATIO);
  });
});

describe("fitScale", () => {
  it("shrinks a one-octave keyboard onto a phone in landscape", () => {
    const scale = fitScale(844, 300, keyboardWidth(8), KEYBOARD_HEIGHT_PX);

    expect(scale).toBeLessThan(1);
    expect(keyboardWidth(8) * scale).toBeLessThanOrEqual(844);
  });

  it("fills a phone screen when the keyboard has it to itself", () => {
    const content = 332;
    const scale = fitScale(844, 390, keyboardWidth(8), content);

    expect(content * scale).toBeGreaterThan(390 * 0.75);
    expect(content * scale).toBeLessThanOrEqual(390);
  });

  it("keeps a phone in portrait on screen too", () => {
    const scale = fitScale(390, 600, keyboardWidth(8), KEYBOARD_HEIGHT_PX);

    expect(keyboardWidth(8) * scale).toBeLessThanOrEqual(390);
  });

  it("leaves a wide keyboard clear of the edges of a large display", () => {
    const scale = fitScale(1904, 780, keyboardWidth(29), KEYBOARD_HEIGHT_PX);
    const margin = (1904 - keyboardWidth(29) * scale) / 2;

    expect(margin).toBeGreaterThanOrEqual(PIANO_INSET.SIDE_MIN_PX);
    expect(margin).toBeCloseTo(sideInset(1904));
  });

  it("stops at the preferred zoom instead of filling spare height", () => {
    expect(fitScale(1904, 780, keyboardWidth(8), KEYBOARD_HEIGHT_PX)).toBe(
      PIANO_SCALE.FIT_MAX,
    );
    expect(PIANO_SCALE.FIT_MAX).toBeLessThan(PIANO_SCALE.MAX);
  });

  it("takes whichever axis runs out first", () => {
    const wideAndShort = fitScale(4000, 200, 500, 400);
    const narrowAndTall = fitScale(200, 4000, 500, 400);

    expect(wideAndShort).toBeLessThan(1);
    expect(narrowAndTall).toBeLessThan(1);
  });

  it("never leaves the range the keyboard can actually be drawn at", () => {
    expect(fitScale(10000, 10000, 100, 100)).toBe(PIANO_SCALE.FIT_MAX);
    expect(fitScale(100, 100, 10000, 10000)).toBe(PIANO_SCALE.MIN);
  });

  it("falls back rather than dividing by an unmeasured element", () => {
    expect(fitScale(800, 600, 0, 0)).toBe(PIANO_SCALE.DEFAULT);
    expect(fitScale(800, 600, 500, 0)).toBe(PIANO_SCALE.DEFAULT);
  });
});

describe("shortScreenFitScale", () => {
  it("keeps one octave at its natural size on a landscape phone", () => {
    expect(shortScreenFitScale(844, keyboardWidth(8))).toBe(
      PIANO_SCALE.SHORT_SCREEN_FIT_MAX,
    );
    expect(PIANO_SCALE.SHORT_SCREEN_FIT_MAX).toBe(1);
  });

  it("makes two octaves slightly larger than a strict width fit", () => {
    const contentWidth = keyboardWidth(15);
    const strictFit = (844 - sideInset(844) * 2) / contentWidth;
    const scale = shortScreenFitScale(844, contentWidth);

    expect(scale).toBeGreaterThan(strictFit);
    expect(scale).toBeCloseTo(0.9, 1);
  });

  it("falls back before the keyboard has been measured", () => {
    expect(shortScreenFitScale(844, 0)).toBe(PIANO_SCALE.DEFAULT);
  });
});
