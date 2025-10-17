"use client";

import { useRef, useCallback, useEffect } from "react";
import { PIANO_CONFIG } from "@/lib/config";

/**
 * useMouseControls Hook
 *
 * Handles mouse interactions for a piano component:
 * - Supports click, drag, and release
 * - Plays/stops notes via provided callbacks
 * - Optionally manages visual highlighting of active notes
 *
 * @param playNote - Callback to trigger note playback. Receives fileName, noteName, and isKeyboard flag.
 * @param stopNote - Callback to stop note playback. Receives noteName and isKeyboard flag.
 * @param setActiveNotes - Optional state setter to highlight currently active notes.
 * @param noteActiveDuration - Duration (ms) for which a note is visually highlighted.
 * 
 * @returns Object with handlers: handleMouseDown, handleMouseEnter, handleMouseUp
 */
export function useMouseControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  setActiveNotes?: React.Dispatch<React.SetStateAction<Set<string>>>,
  noteActiveDuration = PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS
) {
  /* ----- Track if the mouse is currently pressed ----- */
  const isMouseDown = useRef(false);

  /* ----- Track the note currently being played ----- */
  const currentNote = useRef<string | null>(null);

  /**
   * Trigger a note
   * - Stops the previous note if a new one is triggered
   * - Plays the current note
   * - Optionally highlights the note for a short duration
   */
  const triggerNote = useCallback(
    (file: string, name: string) => {
      // Stop previous note to prevent overlapping playback
      if (currentNote.current && currentNote.current !== name) {
        stopNote(currentNote.current, false);
      }

      // Update current note
      currentNote.current = name;

      // Trigger playback
      playNote(file, name, false);

      // Handle momentary visual highlight
      if (setActiveNotes) {
        setActiveNotes((prev) => new Set(prev).add(name));

        setTimeout(() => {
          setActiveNotes((prev) => {
            const copy = new Set(prev);
            copy.delete(name);
            return copy;
          });
        }, noteActiveDuration);
      }
    },
    [playNote, stopNote, setActiveNotes, noteActiveDuration]
  );

  /**
   * Handle mouse down on a key
   */
  const handleMouseDown = useCallback(
    (file: string, name: string) => {
      isMouseDown.current = true;
      triggerNote(file, name);
    },
    [triggerNote]
  );

  /**
   * Handle mouse entering a key while mouse is pressed (dragging)
   */
  const handleMouseEnter = useCallback(
    (file: string, name: string) => {
      if (!isMouseDown.current) return;
      triggerNote(file, name);
    },
    [triggerNote]
  );

  /**
   * Handle mouse release
   */
  const handleMouseUp = useCallback(() => {
    if (currentNote.current) {
      stopNote(currentNote.current, false);
      currentNote.current = null;
    }
    isMouseDown.current = false;
  }, [stopNote]);

  /**
   * Global mouse-up listener
   * Ensures notes are released even if mouse is released outside a key
   */
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (currentNote.current) stopNote(currentNote.current, false);
      currentNote.current = null;
      isMouseDown.current = false;

      // Clear all highlights
      if (setActiveNotes) setActiveNotes(new Set());
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [stopNote, setActiveNotes]);

  /* ----- Return handlers for use in components ----- */
  return { handleMouseDown, handleMouseEnter, handleMouseUp };
}
