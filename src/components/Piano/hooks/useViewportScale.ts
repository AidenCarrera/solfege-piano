"use client";

import { useState, useEffect } from "react";
import { PIANO_SCALE, scaleForViewportWidth } from "@/lib/config";

/**
 * The zoom level that fits the current viewport.
 *
 * This is only the *fallback*: once the user picks a zoom it is stored and
 * wins from then on, so resizing — including a mobile browser showing or
 * hiding its chrome — can no longer discard their choice.
 */
export function useViewportScale(): number {
  const [scale, setScale] = useState(PIANO_SCALE.DEFAULT);

  useEffect(() => {
    const handleResize = () =>
      setScale(scaleForViewportWidth(window.innerWidth));

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return scale;
}
