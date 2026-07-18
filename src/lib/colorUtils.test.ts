import { describe, expect, it } from "vitest";
import { adjustColor, getContrastColor, getShadowColor } from "./colorUtils";

describe("color utilities", () => {
  it("selects the stronger black-or-white contrast", () => {
    expect(getContrastColor("#0f172a")).toBe("#ffffff");
    expect(getContrastColor("#777777")).toBe("#000000");
    expect(getContrastColor("#ffffff")).toBe("#000000");
  });

  it("uses a shadow opposite the foreground color", () => {
    expect(getShadowColor("#0f172a")).toBe("rgba(0, 0, 0, 0.5)");
    expect(getShadowColor("#ffffff")).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("clamps adjusted channels to valid RGB values", () => {
    expect(adjustColor("#fefefe", 20)).toBe("#ffffff");
    expect(adjustColor("#010101", -20)).toBe("#000000");
  });
});
