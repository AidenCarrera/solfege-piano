"use client";

import { useEffect, useRef, useCallback } from "react";
import { Note } from "@/lib/note";
import { isInteractiveKeyboardTarget } from "@/lib/keyboard";

export function useKeyboardControls(
  notes: Note[],
  playNote: (fileName: string, note: string, isKeyboard: boolean) => void,
  stopNote: (note: string, isKeyboard: boolean) => void,
  activateNote?: (note: string) => void,
  deactivateNote?: (note: string) => void,
) {
  const pressedKeys = useRef<Set<string>>(new Set());

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
    [playNote, activateNote],
  );

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
    [stopNote, deactivateNote],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space is reserved for sustain; modified shortcuts belong to the browser.
      if (
        e.code === "Space" ||
        e.metaKey ||
        e.altKey ||
        e.ctrlKey ||
        isInteractiveKeyboardTarget(e.target)
      )
        return;

      const key = e.key.toLowerCase();
      const noteObj = notes.find((n) => n.key === key);
      if (!noteObj) return;

      e.preventDefault();

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
