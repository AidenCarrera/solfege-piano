"use client";

import { useState, useEffect } from "react";
import { PIANO_CONFIG } from "@/lib/config";

export function useBackgroundColor() {
  const [bgColor, setBgColor] = useState(PIANO_CONFIG.DEFAULT_BG_COLOR);

  // Keep global theme tokens aligned with the user-selected color.
  useEffect(() => {
    document.documentElement.style.setProperty("--background", bgColor);
  }, [bgColor]);

  return [bgColor, setBgColor] as const;
}
