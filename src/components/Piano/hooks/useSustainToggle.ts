import { useCallback, useEffect } from "react";
import { isTextEntryTarget } from "@/lib/keyboard";

const SPACE_ACTIVATED_SELECTOR =
  'button, select, summary, input, [role="button"], [role="checkbox"], [role="switch"], [role="tab"], [role="option"], [role="slider"]';

export function useSustainToggle(
  stopAllNotes: () => void,
  setSustainActive: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const toggleSustain = useCallback(() => {
    setSustainActive((prev) => {
      const newState = !prev;
      if (!newState) {
        stopAllNotes();
      }
      return newState;
    });
  }, [stopAllNotes, setSustainActive]);

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

  return { toggleSustain };
}
