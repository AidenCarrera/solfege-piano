import { useCallback, useEffect } from "react";

export function useSustainToggle(
  stopAllNotes: () => void,
  setSustainActive: React.Dispatch<React.SetStateAction<boolean>>,
) {
  const toggleSustain = useCallback(() => {
    setSustainActive((prev) => {
      const newState = !prev;
      // Release voices that were retained by sustain.
      if (!newState) {
        stopAllNotes();
      }
      return newState;
    });
  }, [stopAllNotes, setSustainActive]);

  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        toggleSustain();
      }
    };

    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  }, [toggleSustain]);

  return { toggleSustain };
}
