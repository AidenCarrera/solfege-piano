"use client";

import { useState, useEffect } from "react";
import { PIANO_CONFIG } from "@/lib/config";

/** Tracks the responsive piano scale while allowing manual overrides. */
export function usePianoScale() {
  const [pianoScale, setPianoScale] = useState(
    PIANO_CONFIG.DEFAULT_PIANO_SCALE,
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setPianoScale(1.15);
      else if (width < 768) setPianoScale(1.35);
      else if (width < 1024) setPianoScale(1.55);
      else setPianoScale(PIANO_CONFIG.DEFAULT_PIANO_SCALE);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return [pianoScale, setPianoScale] as const;
}
