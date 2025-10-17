"use client";

import { useEffect, useRef, useCallback } from "react";
import { notes } from "@/lib/notes";

/**
 * useKeyboardControls Hook
 *
 * Handles keyboard input for a piano component:
 * - Triggers notes on key press and stops them on key release
 * - Prevents repeated triggers from held-down keys
 * - Optionally manages visual highlighting of active notes
 *
 * @param playNote - Callback to trigger note playback. Receives fileName, noteName, and isKeyboard flag.
 * @param stopNote - Callback to stop note playback. Receives noteName and isKeyboard flag.
 * @param setActiveNotes - Optional state setter to highlight currently active notes.
 * @param noteActiveDuration - Duration (ms) for which a note is visually highlighted.
 *
 * @returns void
 */
export function useKeyboardControls(
  playNote: (fileName: string, note: string, isKeyboard: boolean) => void,
  stopNote: (note: string, isKeyboard: boolean) => void,
  setActiveNotes?: React.Dispatch<React.SetStateAction<Set<string>>>,
  noteActiveDuration = 150
) {
  /* ----- Track keys currently pressed to prevent repeated triggers ----- */
  const pressedKeys = useRef<Set<string>>(new Set());

  /**
   * Trigger a note if it is not already pressed
   * - Plays the note
   * - Optionally highlights the note for a short duration
   */
  const triggerNote = useCallback(
    (noteObj: typeof notes[0]) => {
      if (!pressedKeys.current.has(noteObj.key)) {
        pressedKeys.current.add(noteObj.key);
        playNote(noteObj.fileName, noteObj.name, true);

        if (setActiveNotes) {
          setActiveNotes((prev) => new Set(prev).add(noteObj.name));

          setTimeout(() => {
            setActiveNotes((prev) => {
              const copy = new Set(prev);
              copy.delete(noteObj.name);
              return copy;
            });
          }, noteActiveDuration);
        }
      }
    },
    [playNote, setActiveNotes, noteActiveDuration]
  );

  /**
   * Stop a note if it is currently pressed
   * - Stops playback
   * - Removes optional visual highlight immediately
   */
  const stopNoteIfPressed = useCallback(
    (noteObj: typeof notes[0]) => {
      if (pressedKeys.current.has(noteObj.key)) {
        pressedKeys.current.delete(noteObj.key);
        stopNote(noteObj.name, true);

        if (setActiveNotes) {
          setActiveNotes((prev) => {
            const copy = new Set(prev);
            copy.delete(noteObj.name);
            return copy;
          });
        }
      }
    },
    [stopNote, setActiveNotes]
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
  }, [triggerNote, stopNoteIfPressed]);
}
