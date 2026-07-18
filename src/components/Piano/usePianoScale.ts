"use client";

import { useState, useEffect } from "react";
import { PIANO_CONFIG } from "@/lib/config";

/** Tracks the responsive piano scale while allowing manual overrides. */
export function usePianoScale() {
  const [pianoScale, setPianoScale] = useState(() => {
    if (typeof window === "undefined") return PIANO_CONFIG.DEFAULT_PIANO_SCALE;
    const width = window.innerWidth;
    if (width < 640) return 1.0;
    if (width < 768) return 1.25;
    if (width < 1024) return 1.4;
    return PIANO_CONFIG.DEFAULT_PIANO_SCALE;
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setPianoScale(1.0);
      else if (width < 768) setPianoScale(1.25);
      else if (width < 1024) setPianoScale(1.4);
      else setPianoScale(PIANO_CONFIG.DEFAULT_PIANO_SCALE);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return [pianoScale, setPianoScale] as const;
}
