"use client";

import { useState, useEffect } from "react";
import { PIANO_SCALE, scaleForViewportWidth } from "@/lib/config";

/**
 * Sizes the keyboard to the viewport.
 *
 * The returned setter lets the zoom slider and the octave picker override the
 * value, but note that the next resize replaces it: on mobile, showing or
 * hiding the browser chrome fires `resize` and will reset a manual zoom.
 */
export function usePianoScale() {
  const [pianoScale, setPianoScale] = useState(PIANO_SCALE.DEFAULT);

  useEffect(() => {
    const handleResize = () =>
      setPianoScale(scaleForViewportWidth(window.innerWidth));

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return [pianoScale, setPianoScale] as const;
}
