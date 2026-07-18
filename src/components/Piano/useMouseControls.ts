"use client";

import { useRef, useCallback, useEffect } from "react";
import { PIANO_CONFIG } from "@/lib/config";

export function useMouseControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  flashNote?: (note: string, duration: number) => void,
  clearAllNotes?: () => void,
) {
  const isMouseDown = useRef(false);
  const currentNote = useRef<string | null>(null);

  const triggerNote = useCallback(
    (file: string, name: string) => {
      if (currentNote.current && currentNote.current !== name) {
        stopNote(currentNote.current, false);
      }

      currentNote.current = name;
      playNote(file, name, false);
      if (flashNote) {
        flashNote(name, PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS);
      }
    },
    [playNote, stopNote, flashNote],
  );

  const handleMouseDown = useCallback(
    (file: string, name: string) => {
      isMouseDown.current = true;
      triggerNote(file, name);
    },
    [triggerNote],
  );

  const handleMouseEnter = useCallback(
    (file: string, name: string) => {
      if (!isMouseDown.current) return;
      triggerNote(file, name);
    },
    [triggerNote],
  );

  const handleMouseUp = useCallback(() => {
    if (currentNote.current) {
      stopNote(currentNote.current, false);
      currentNote.current = null;
    }
    isMouseDown.current = false;
  }, [stopNote]);

  // Release notes even when the pointer leaves the key before mouseup.
  useEffect(() => {
    const releaseMouse = () => {
      if (currentNote.current) stopNote(currentNote.current, false);
      currentNote.current = null;
      isMouseDown.current = false;

      if (clearAllNotes) clearAllNotes();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") releaseMouse();
    };

    window.addEventListener("mouseup", releaseMouse);
    window.addEventListener("blur", releaseMouse);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("mouseup", releaseMouse);
      window.removeEventListener("blur", releaseMouse);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stopNote, clearAllNotes]);

  return { handleMouseDown, handleMouseEnter, handleMouseUp };
}
