import { useCallback, useEffect, useRef, useState } from "react";
import { isTextEntryTarget } from "@/lib/keyboard";

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
    // Space always works the pedal, so it never clicks the focused control or
    // scrolls the page. Browsers click buttons on key up, so block both.
    const claimSpace = (e: KeyboardEvent) => {
      if (e.code !== "Space" || isTextEntryTarget(e.target)) return false;
      e.preventDefault();
      return true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (claimSpace(e) && !e.repeat) toggleSustain();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", claimSpace);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", claimSpace);
    };
  }, [toggleSustain]);

  return { sustainActive, setSustain, toggleSustain };
}
