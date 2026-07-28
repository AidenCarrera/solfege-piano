"use client";

import { useEffect, useRef } from "react";

// Covers desktop blur and mobile tab backgrounding.
export function usePageInactive(onInactive: () => void) {
  // Keep subscriptions stable while the callback changes.
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
