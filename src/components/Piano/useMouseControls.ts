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
 * @param flashNote - Optional callback to temporarily highlight a note.
 * @param clearAllNotes - Optional callback to clear all visual highlights.
 * 
 * @returns Object with handlers: handleMouseDown, handleMouseEnter, handleMouseUp
 */
export function useMouseControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  flashNote?: (note: string, duration: number) => void,
  clearAllNotes?: () => void
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
      if (flashNote) {
        flashNote(name, PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS);
      }
    },
    [playNote, stopNote, flashNote]
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
      if (clearAllNotes) clearAllNotes();
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [stopNote, clearAllNotes]);

  /* ----- Return handlers for use in components ----- */
  return { handleMouseDown, handleMouseEnter, handleMouseUp };
}