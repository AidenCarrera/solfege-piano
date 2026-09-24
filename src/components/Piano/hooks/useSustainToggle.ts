import { useCallback, useEffect, useRef, useState } from "react";
import { isTextEntryTarget } from "@/lib/keyboard";

const SPACE_ACTIVATED_SELECTOR =
  'button, select, summary, input, [role="button"], [role="checkbox"], [role="switch"], [role="tab"], [role="option"], [role="slider"]';

/** `onRelease` runs when sustain turns off so held-over notes can stop. */
export function useSustainToggle(onRelease: () => void) {
  const [sustainActive, setSustainActive] = useState(false);
  // Pedal messages can arrive faster than React re-renders.
  const sustainRef = useRef(false);

  const onReleaseRef = useRef(onRelease);
  useEffect(() => {
    onReleaseRef.current = onRelease;
  });

  const setSustain = useCallback((next: boolean) => {
    if (sustainRef.current === next) return;
    sustainRef.current = next;
    setSustainActive(next);
    if (!next) onReleaseRef.current();
  }, []);

  const toggleSustain = useCallback(
    () => setSustain(!sustainRef.current),
    [setSustain],
  );

  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      if (isTextEntryTarget(e.target)) return;
      if (
        e.target instanceof Element &&
        e.target.closest(SPACE_ACTIVATED_SELECTOR)
      ) {
        return;
      }

      e.preventDefault();
      toggleSustain();
    };

    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  }, [toggleSustain]);

  return { sustainActive, setSustain, toggleSustain };
}
