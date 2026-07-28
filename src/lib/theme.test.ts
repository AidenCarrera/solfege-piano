import { beforeEach, describe, expect, it } from "vitest";
import { getContrastColor } from "./colorUtils";
import { SETTINGS_STORAGE_KEY } from "./settings";
import { applyStoredTheme, THEME_SCRIPT } from "./theme";

function storedBackground(bgColor: unknown) {
  window.localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ bgColor }),
  );
}

function tokens() {
  const style = document.documentElement.style;
  return {
    background: style.getPropertyValue("--background"),
    foreground: style.getPropertyValue("--foreground"),
  };
}

describe("applyStoredTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("style");
  });

  it("applies a stored background before paint", () => {
    storedBackground("#ffffff");
    applyStoredTheme(SETTINGS_STORAGE_KEY);

    expect(tokens().background).toBe("#ffffff");
  });

  it("agrees with getContrastColor, which it duplicates by necessity", () => {
    const samples = [
      "#0f172a",
      "#ffffff",
      "#000000",
      "#777777",
      "#7f7f7f",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#123456",
      "#fedcba",
    ];

    for (const bgColor of samples) {
      storedBackground(bgColor);
      applyStoredTheme(SETTINGS_STORAGE_KEY);

      expect(tokens().foreground, bgColor).toBe(getContrastColor(bgColor));
    }
  });

  it("leaves the CSS defaults alone when nothing is stored or it is unusable", () => {
    for (const stored of [null, "red", "#fff", 42]) {
      window.localStorage.clear();
      if (stored !== null) storedBackground(stored);

      applyStoredTheme(SETTINGS_STORAGE_KEY);
      expect(tokens().background, String(stored)).toBe("");
    }
  });

  it("survives malformed JSON", () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, "{not json");

    expect(() => applyStoredTheme(SETTINGS_STORAGE_KEY)).not.toThrow();
    expect(tokens().background).toBe("");
  });

  it("serialises to a self-contained script", () => {
    expect(THEME_SCRIPT).toContain(JSON.stringify(SETTINGS_STORAGE_KEY));
    expect(THEME_SCRIPT.startsWith("(")).toBe(true);

    document.documentElement.removeAttribute("style");
    storedBackground("#ffffff");
    new Function(THEME_SCRIPT)();

    expect(tokens().background).toBe("#ffffff");
    expect(tokens().foreground).toBe(getContrastColor("#ffffff"));
  });
});
