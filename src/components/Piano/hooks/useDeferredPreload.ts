"use client";

import { useEffect, useRef } from "react";

export function useDeferredPreload(preloadFn: () => void, delay: number) {
  const hasPreloaded = useRef(false);

  useEffect(() => {
    const triggerPreload = () => {
      if (hasPreloaded.current) return;
      hasPreloaded.current = true;
      preloadFn();
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener("pointerdown", triggerPreload);
      window.removeEventListener("keydown", triggerPreload);
    };

    window.addEventListener("pointerdown", triggerPreload, { passive: true });
    window.addEventListener("keydown", triggerPreload);

    const timeout = window.setTimeout(triggerPreload, delay);

    return () => {
      clearTimeout(timeout);
      removeListeners();
    };
  }, [preloadFn, delay]);
}
