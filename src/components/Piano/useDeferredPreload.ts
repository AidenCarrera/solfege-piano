"use client";

import { useEffect, useRef } from "react";

/**
 * useDeferredPreload
 *
 * Defers a preload function until either:
 * the first user interaction (click, keypress, touch), or
 * a timeout (default: 500ms)
 *
 * Great for loading audio or heavy assets after initial render,
 * improving FCP and LCP metrics.
 *
 * @param preloadFn - The function to execute once the trigger occurs
 * @param delay - The delay before auto-triggering (ms). Defaults to 500ms
 */
export function useDeferredPreload(preloadFn: () => void, delay = 500) {
  const hasPreloaded = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const triggerPreload = () => {
      if (hasPreloaded.current) return;
      hasPreloaded.current = true;
      preloadFn();
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener("click", triggerPreload);
      window.removeEventListener("keydown", triggerPreload);
      window.removeEventListener("touchstart", triggerPreload);
    };

    // User interaction triggers preload
    window.addEventListener("click", triggerPreload);
    window.addEventListener("keydown", triggerPreload);
    window.addEventListener("touchstart", triggerPreload);

    // Timeout fallback
    const timeout = window.setTimeout(triggerPreload, delay);

    return () => {
      clearTimeout(timeout);
      removeListeners();
    };
  }, [preloadFn, delay]);
}
