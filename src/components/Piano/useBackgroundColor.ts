"use client";

import { useState, useEffect } from "react";
import { PIANO_CONFIG } from "@/lib/config";

/**
 * Handles the piano background color.
 * - Initializes from CSS variable `--background` if present
 * - Falls back to default piano config color
 * - Automatically updates document background when changed
 */
export function useBackgroundColor() {
  const [bgColor, setBgColor] = useState(() => {
    if (typeof window === "undefined") return PIANO_CONFIG.DEFAULT_BG_COLOR;
    const initial = getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim();
    return initial || PIANO_CONFIG.DEFAULT_BG_COLOR;
  });

  // Sync background color to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--background", bgColor);
  }, [bgColor]);

  return [bgColor, setBgColor] as const;
}
