"use client";

import { useEffect } from "react";
import { getContrastColor } from "@/lib/colorUtils";

export function useThemeTokens(bgColor: string): void {
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--background", bgColor);
    root.setProperty("--foreground", getContrastColor(bgColor));
  }, [bgColor]);
}
