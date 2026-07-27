"use client";

import { useEffect, useRef } from "react";

/**
 * Runs a callback when the page stops receiving input.
 *
 * Notes are released on key-up and pointer-up, neither of which fires if the
 * user switches tabs or windows mid-press. Both `blur` and `visibilitychange`
 * are needed: alt-tabbing away fires only `blur`, while backgrounding the tab
 * on mobile may fire only `visibilitychange`.
 *
 * The callback is read through a ref, so callers can pass an inline function
 * without re-subscribing on every render.
 */
export function usePageInactive(onInactive: () => void) {
  const callbackRef = useRef(onInactive);

  useEffect(() => {
    callbackRef.current = onInactive;
  });

  useEffect(() => {
    const handleBlur = () => callbackRef.current();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") callbackRef.current();
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
