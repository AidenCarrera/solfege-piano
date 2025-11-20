/**
 * Calculates the relative luminance of a color.
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Relative luminance (0-1)
 */
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Converts a hex color string to an RGB object.
 * @param hex - Hex color string (e.g., "#ffffff" or "#fff")
 * @returns Object with r, g, b values or null if invalid
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Determines the best contrast color (black or white) for a given background color.
 * @param hexColor - Background color in hex format
 * @returns "#000000" (black) or "#ffffff" (white)
 */
export function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#ffffff"; // Default to white if invalid

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/**
 * Generates a shadow color based on the background color.
 * Darkens the color for light backgrounds, or uses a dark shadow for dark backgrounds.
 * @param hexColor - Background color in hex format
 * @param opacity - Opacity of the shadow (0-1)
 * @returns RGBA color string
 */
export function getShadowColor(hexColor: string, opacity: number = 0.5): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return `rgba(0, 0, 0, ${opacity})`;

  // If background is very dark, use a lighter shadow (glow) or keep it black?
  // Usually shadows are black. Let's stick to black shadows but maybe adjust opacity.
  // Alternatively, for very dark backgrounds, we might want a colored glow, but standard shadow is safe.
  
  // For now, let's return a standard black shadow with variable opacity
  return `rgba(0, 0, 0, ${opacity})`;
}

/**
 * Adjusts a color by a given amount (positive for lighter, negative for darker).
 * @param hex - Hex color string
 * @param amount - Amount to adjust (-255 to 255)
 * @returns Adjusted hex color string
 */
export function adjustColor(hex: string, amount: number): string {
    let color = hex.replace('#', '');
    if (color.length === 3) {
        color = color.split('').map(c => c + c).join('');
    }

    const num = parseInt(color, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x00FF) + amount;

    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);

    return '#' + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
}

/**
 * Converts a hex color to an RGBA string with specified opacity.
 * @param hex - Hex color string
 * @param alpha - Opacity (0-1)
 * @returns RGBA string
 */
export function hexToRgba(hex: string, alpha: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Generates a glass panel color based on the background color.
 * @param bgColor - Background color in hex
 * @returns RGBA string for the panel background
 */
export function getGlassPanelColor(bgColor: string): string {
    const contrast = getContrastColor(bgColor);
    const isDarkBg = contrast === "#ffffff";
    
    // If background is dark, make panel slightly lighter.
    // If background is light, make panel slightly darker.
    // But keep it subtle.
    const adjustment = isDarkBg ? 20 : -20;
    const adjustedHex = adjustColor(bgColor, adjustment);
    
    // Use low opacity for glass effect
    return hexToRgba(adjustedHex, 0.3); 
}
