"use client";

import { useEffect, useRef } from "react";

/** Defers work until the first interaction, with a timeout fallback. */
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

    window.addEventListener("click", triggerPreload);
    window.addEventListener("keydown", triggerPreload);
    window.addEventListener("touchstart", triggerPreload);

    const timeout = window.setTimeout(triggerPreload, delay);

    return () => {
      clearTimeout(timeout);
      removeListeners();
    };
  }, [preloadFn, delay]);
}
