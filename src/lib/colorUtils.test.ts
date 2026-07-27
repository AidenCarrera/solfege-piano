import { describe, expect, it } from "vitest";
import { adjustColor, getContrastColor, getShadowColor } from "./colorUtils";

describe("color utilities", () => {
  it("selects the stronger black-or-white contrast", () => {
    expect(getContrastColor("#0f172a")).toBe("#ffffff");
    expect(getContrastColor("#777777")).toBe("#000000");
    expect(getContrastColor("#ffffff")).toBe("#000000");
  });

  it("provides soft drop shadows without harsh glows", () => {
    expect(getShadowColor("#0f172a")).toBe("rgba(0, 0, 0, 0.3)");
    expect(getShadowColor("#ffffff")).toBe("rgba(0, 0, 0, 0.12)");
  });

  it("clamps adjusted channels to valid RGB values", () => {
    expect(adjustColor("#fefefe", 20)).toBe("#ffffff");
    expect(adjustColor("#010101", -20)).toBe("#000000");
  });
});
