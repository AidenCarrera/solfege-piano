/** Calculates WCAG relative luminance for an RGB color. */
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return (a[0] ?? 0) * 0.2126 + (a[1] ?? 0) * 0.7152 + (a[2] ?? 0) * 0.0722;
}

/** Parses a six-digit hex color. */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1] ?? "0", 16),
        g: parseInt(result[2] ?? "0", 16),
        b: parseInt(result[3] ?? "0", 16),
      }
    : null;
}

/** Selects black or white text using the WCAG luminance threshold. */
export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#ffffff";

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export function getShadowColor(
  hexColor: string,
  opacity: number = 0.5,
): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return `rgba(0, 0, 0, ${opacity})`;

  return `rgba(0, 0, 0, ${opacity})`;
}

/** Adjusts each RGB channel by a signed amount. */
export function adjustColor(hex: string, amount: number): string {
  let color = hex.replace("#", "");
  if (color.length === 3) {
    color = color
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const num = parseInt(color, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x00ff) + amount;

  r = Math.max(Math.min(255, r), 0);
  g = Math.max(Math.min(255, g), 0);
  b = Math.max(Math.min(255, b), 0);

  return "#" + (b | (g << 8) | (r << 16)).toString(16).padStart(6, "0");
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function getGlassPanelColor(bgColor: string): string {
  const contrast = getContrastColor(bgColor);
  const isDarkBg = contrast === "#ffffff";

  const adjustment = isDarkBg ? 20 : -20;
  const adjustedHex = adjustColor(bgColor, adjustment);

  return hexToRgba(adjustedHex, 0.3);
}
