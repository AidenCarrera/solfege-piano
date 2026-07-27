"use client";

import { useEffect } from "react";
import { getContrastColor } from "@/lib/colorUtils";

/**
 * Publishes the page's colour tokens on the document element.
 *
 * They go on `:root` rather than on the piano so chrome outside the app — the
 * footer, other routes — stays legible against whichever colour is chosen.
 * The pre-paint script in `theme.ts` sets the same two properties, so the
 * value here matches what is already on screen and nothing flashes.
 */
export function useThemeTokens(bgColor: string): void {
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--background", bgColor);
    root.setProperty("--foreground", getContrastColor(bgColor));
  }, [bgColor]);
}
