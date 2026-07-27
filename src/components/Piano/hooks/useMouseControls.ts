"use client";

import { useRef, useCallback, useEffect } from "react";
import { PIANO_CONFIG } from "@/lib/config";
import { refocusSustainPedal } from "@/lib/keyboard";
import { usePageInactive } from "./usePageInactive";

export function useMouseControls(
  playNote: (noteName: string) => void,
  stopNote: (noteName: string) => void,
  flashNote: (noteName: string, durationMs: number) => void,
  clearAllNotes: () => void,
) {
  const isMouseDown = useRef(false);
  const currentNote = useRef<string | null>(null);

  const triggerNote = useCallback(
    (name: string) => {
      if (currentNote.current && currentNote.current !== name) {
        stopNote(currentNote.current);
      }

      currentNote.current = name;
      playNote(name);
      flashNote(name, PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS);
    },
    [playNote, stopNote, flashNote],
  );

  const handleMouseDown = useCallback(
    (name: string) => {
      refocusSustainPedal();
      isMouseDown.current = true;
      triggerNote(name);
    },
    [triggerNote],
  );

  // Dragging across keys glissandos; entering with the button up does nothing.
  const handleMouseEnter = useCallback(
    (name: string) => {
      if (!isMouseDown.current) return;
      triggerNote(name);
    },
    [triggerNote],
  );

  const handleMouseUp = useCallback(() => {
    if (currentNote.current) {
      stopNote(currentNote.current);
      currentNote.current = null;
    }
    isMouseDown.current = false;
  }, [stopNote]);

  const releaseMouse = useCallback(() => {
    if (currentNote.current) stopNote(currentNote.current);
    currentNote.current = null;
    isMouseDown.current = false;
    clearAllNotes();
  }, [stopNote, clearAllNotes]);

  // Release notes even when the pointer leaves the key before mouseup.
  useEffect(() => {
    window.addEventListener("mouseup", releaseMouse);
    return () => window.removeEventListener("mouseup", releaseMouse);
  }, [releaseMouse]);

  usePageInactive(releaseMouse);

  return { handleMouseDown, handleMouseEnter, handleMouseUp };
}
