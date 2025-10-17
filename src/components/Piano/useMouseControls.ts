"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * useMouseControls Hook
 * 
 * Handles mouse interactions for piano note playback.
 * Returns event handlers and a flag for mouseDown state.
 */
export function useMouseControls(
  playNote: (fileName: string, note: string, isKeyboard: boolean) => void,
  stopNote: (note: string, isKeyboard: boolean) => void,
  setActiveNote: (note: string | null) => void,
  noteActiveDuration: number
) {
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleMouseDown = useCallback(
    (file: string, name: string) => {
      setIsMouseDown(true);
      playNote(file, name, false);
      setActiveNote(name);
      setTimeout(() => setActiveNote(null), noteActiveDuration);
    },
    [playNote, noteActiveDuration, setActiveNote]
  );

  const handleMouseEnter = useCallback(
    (file: string, name: string) => {
      if (isMouseDown) handleMouseDown(file, name);
    },
    [isMouseDown, handleMouseDown]
  );

  const handleMouseUp = useCallback(
    (name: string) => {
      stopNote(name, false);
      setIsMouseDown(false);
    },
    [stopNote]
  );

  // Global mouse-up listener to prevent stuck notes
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsMouseDown(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  return { handleMouseDown, handleMouseEnter, handleMouseUp, isMouseDown };
}
