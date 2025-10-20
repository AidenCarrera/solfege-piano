"use client";

import { useEffect, useRef, useCallback } from "react";
import { Note } from "@/lib/note";

/**
 * useKeyboardControls Hook
 *
 * Handles keyboard input for a piano component:
 * - Triggers notes on key press and stops them on key release
 * - Prevents repeated triggers from held-down keys
 *
 * @param notes - Array of Note objects with keyboard mappings
 * @param playNote - Callback to trigger note playback. Receives fileName, noteName, and isKeyboard flag.
 * @param stopNote - Callback to stop note playback. Receives noteName and isKeyboard flag.
 * @param activateNote - Optional callback to visually activate a note.
 * @param deactivateNote - Optional callback to visually deactivate a note.
 *
 * @returns void
 */
export function useKeyboardControls(
  notes: Note[],
  playNote: (fileName: string, note: string, isKeyboard: boolean) => void,
  stopNote: (note: string, isKeyboard: boolean) => void,
  activateNote?: (note: string) => void,
  deactivateNote?: (note: string) => void
) {
  /* ----- Track keys currently pressed to prevent repeated triggers ----- */
  const pressedKeys = useRef<Set<string>>(new Set());
  
  /**
   * Trigger a note if it is not already pressed
   * - Plays the note
   * - Optionally highlights the note visually
   */
  const triggerNote = useCallback(
    (noteObj: Note) => {
      if (!pressedKeys.current.has(noteObj.key)) {
        pressedKeys.current.add(noteObj.key);
        playNote(noteObj.fileName, noteObj.name, true);

        if (activateNote) {
          activateNote(noteObj.name);
        }
      }
    },
    [playNote, activateNote]
  );

  /**
   * Stop a note if it is currently pressed
   * - Stops playback
   * - Removes optional visual highlight immediately
   */
  const stopNoteIfPressed = useCallback(
    (noteObj: Note) => {
      if (pressedKeys.current.has(noteObj.key)) {
        pressedKeys.current.delete(noteObj.key);
        stopNote(noteObj.name, true);

        if (deactivateNote) {
          deactivateNote(noteObj.name);
        }
      }
    },
    [stopNote, deactivateNote]
  );

  /* ----- Set up event listeners for keyboard input ----- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore system modifiers and spacebar (used for sustain)
      if (e.code === "Space" || e.metaKey || e.altKey || e.ctrlKey) return;

      const key = e.key.toLowerCase();
      const noteObj = notes.find((n) => n.key === key);
      if (!noteObj) return;

      // Prevent browser default actions for shortcuts
      e.preventDefault();

      // Ignore repeated keydown events from holding the key
      if (e.repeat) return;

      triggerNote(noteObj);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") return;

      const key = e.key.toLowerCase();
      const noteObj = notes.find((n) => n.key === key);
      if (!noteObj) return;

      stopNoteIfPressed(noteObj);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [triggerNote, stopNoteIfPressed, notes]);
}