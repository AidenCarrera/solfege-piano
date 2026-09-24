"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

const subscribeNever = () => () => {};

export function useFullscreen() {
  const supported = useSyncExternalStore(
    subscribeNever,
    () => document.fullscreenEnabled === true,
    () => false,
  );
  const isFullscreen = useSyncExternalStore(
    subscribe,
    () => document.fullscreenElement !== null,
    () => false,
  );

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }

    document.documentElement
      .requestFullscreen({ navigationUI: "hide" })
      .then(() => {
        // Phones play best sideways; browsers that refuse keep their rotation.
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (orientation: string) => Promise<void>;
        };
        return orientation.lock?.("landscape");
      })
      .catch(() => {});
  }, []);

  return { supported, isFullscreen, toggle };
}
