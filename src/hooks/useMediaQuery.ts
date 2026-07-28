"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a CSS media query currently matches.
 *
 * `useSyncExternalStore` rather than state seeded from an effect: `matchMedia`
 * does not exist while prerendering, and this is the API that lets the server
 * render the fallback and the client swap in the real answer without either a
 * hydration mismatch or a cascading render.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // Nothing matches on a server, which has no viewport to measure.
    () => false,
  );
}
