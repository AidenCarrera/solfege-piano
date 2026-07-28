import { SETTINGS_STORAGE_KEY } from "./settings";

/**
 * Self-contained because this function is serialized into an inline script.
 * Keep its contrast calculation aligned with getContrastColor.
 */
export function applyStoredTheme(storageKey: string) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    const bgColor: unknown = JSON.parse(raw).bgColor;
    if (typeof bgColor !== "string" || !/^#[0-9a-f]{6}$/i.test(bgColor)) return;

    const channel = (offset: number) => {
      const value = parseInt(bgColor.slice(offset, offset + 2), 16) / 255;
      return value <= 0.03928
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4);
    };
    const luminance =
      0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);

    const style = document.documentElement.style;
    style.setProperty("--background", bgColor);
    style.setProperty(
      "--foreground",
      (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
        ? "#000000"
        : "#ffffff",
    );
  } catch {
    // CSS defaults remain active when storage is unavailable.
  }
}

export const THEME_SCRIPT = `(${applyStoredTheme.toString()})(${JSON.stringify(
  SETTINGS_STORAGE_KEY,
)})`;
