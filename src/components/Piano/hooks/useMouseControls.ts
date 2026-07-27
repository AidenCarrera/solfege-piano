"use client";

import { useRef, useCallback, useEffect } from "react";
import { refocusSustainPedal } from "@/lib/keyboard";
import { usePageInactive } from "./usePageInactive";

/**
 * Plays notes with the mouse, including drag-glissando across keys.
 *
 * Only one note sounds at a time: the pointer has a single position, so
 * entering a new key releases the previous one.
 */
export function useMouseControls(
  playNote: (noteName: string) => void,
  stopNote: (noteName: string) => void,
  activateNote: (noteName: string) => void,
  deactivateNote: (noteName: string) => void,
  clearAllNotes: () => void,
) {
  const isMouseDown = useRef(false);
  const currentNote = useRef<string | null>(null);

  const releaseCurrentNote = useCallback(() => {
    if (!currentNote.current) return;
    stopNote(currentNote.current);
    deactivateNote(currentNote.current);
    currentNote.current = null;
  }, [stopNote, deactivateNote]);

  const triggerNote = useCallback(
    (name: string) => {
      if (currentNote.current === name) return;
      releaseCurrentNote();

      currentNote.current = name;
      playNote(name);
      activateNote(name);
    },
    [playNote, activateNote, releaseCurrentNote],
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
    releaseCurrentNote();
    isMouseDown.current = false;
  }, [releaseCurrentNote]);

  const releaseMouse = useCallback(() => {
    releaseCurrentNote();
    isMouseDown.current = false;
    clearAllNotes();
  }, [releaseCurrentNote, clearAllNotes]);

  // Release notes even when the pointer leaves the key before mouseup.
  useEffect(() => {
    window.addEventListener("mouseup", releaseMouse);
    return () => window.removeEventListener("mouseup", releaseMouse);
  }, [releaseMouse]);

  usePageInactive(releaseMouse);

  return { handleMouseDown, handleMouseEnter, handleMouseUp };
}
