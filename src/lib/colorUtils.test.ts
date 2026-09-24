import { describe, expect, it } from "vitest";
import { getContrastColor } from "./colorUtils";

describe("color utilities", () => {
  it("selects the stronger black-or-white contrast", () => {
    expect(getContrastColor("#0f172a")).toBe("#ffffff");
    expect(getContrastColor("#777777")).toBe("#000000");
    expect(getContrastColor("#ffffff")).toBe("#000000");
  });
});
