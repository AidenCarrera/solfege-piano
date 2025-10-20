import { useCallback, useEffect } from "react";

/**
 * Hook to manage sustain pedal toggle behavior and spacebar listener
 * @param stopAllNotes - Callback to stop all playing notes when sustain is released
 * @param setSustainActive - State setter for sustain active state
 * @returns Object with toggleSustain function
 */
export function useSustainToggle(
  stopAllNotes: () => void,
  setSustainActive: React.Dispatch<React.SetStateAction<boolean>>
) {
  const toggleSustain = useCallback(() => {
    setSustainActive((prev) => {
      const newState = !prev;
      // When sustain is turned off, stop all notes
      if (!newState) {
        stopAllNotes();
      }
      return newState;
    });
  }, [stopAllNotes, setSustainActive]);

  // Listen for spacebar to toggle sustain
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