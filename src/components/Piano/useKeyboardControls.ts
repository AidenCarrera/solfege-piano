"use client";

import { useEffect, useRef, useCallback } from "react";
import { Note } from "@/lib/note";
import { isTextEntryTarget } from "@/lib/keyboard";

export function useKeyboardControls(
  notes: Note[],
  playNote: (fileName: string, note: string, isKeyboard: boolean) => void,
  stopNote: (note: string, isKeyboard: boolean) => void,
  activateNote?: (note: string) => void,
  deactivateNote?: (note: string) => void,
) {
  const pressedKeys = useRef<Set<string>>(new Set());

  // Piano rebuilds these on nearly every render: activateNote is an inline
  // arrow and playNote changes with volume. Reading them through a ref keeps
  // the listener effect mounted for the component's lifetime. When it re-ran
  // per render instead, its cleanup released the note that had just been
  // pressed, cutting each keystroke off within a few milliseconds.
  const latest = useRef({
    notes,
    playNote,
    stopNote,
    activateNote,
    deactivateNote,
  });
  useEffect(() => {
    latest.current = {
      notes,
      playNote,
      stopNote,
      activateNote,
      deactivateNote,
    };
  });

  const triggerNote = useCallback((noteObj: Note) => {
    if (pressedKeys.current.has(noteObj.key)) return;

    pressedKeys.current.add(noteObj.key);
    latest.current.playNote(noteObj.fileName, noteObj.name, true);
    latest.current.activateNote?.(noteObj.name);
  }, []);

  const stopNoteIfPressed = useCallback((noteObj: Note) => {
    if (!pressedKeys.current.has(noteObj.key)) return;

    pressedKeys.current.delete(noteObj.key);
    latest.current.stopNote(noteObj.name, true);
    latest.current.deactivateNote?.(noteObj.name);
  }, []);

  const releasePressedKeys = useCallback(() => {
    latest.current.notes.forEach(stopNoteIfPressed);
    pressedKeys.current.clear();
  }, [stopNoteIfPressed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space is reserved for sustain; modified shortcuts belong to the browser.
      if (
        e.code === "Space" ||
        e.metaKey ||
        e.altKey ||
        e.ctrlKey ||
        isTextEntryTarget(e.target)
      )
        return;

      const key = e.key.toLowerCase();
      const noteObj = latest.current.notes.find((n) => n.key === key);
      if (!noteObj) return;

      e.preventDefault();

      if (e.repeat) return;

      triggerNote(noteObj);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") return;

      const key = e.key.toLowerCase();
      const noteObj = latest.current.notes.find((n) => n.key === key);
      if (!noteObj) return;

      stopNoteIfPressed(noteObj);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") releasePressedKeys();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", releasePressedKeys);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", releasePressedKeys);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releasePressedKeys();
    };
  }, [triggerNote, stopNoteIfPressed, releasePressedKeys]);

  // The shortcut map moves with the octave range, so release whatever is still
  // held against the outgoing note set before it is swapped out.
  useEffect(() => {
    const boundNotes = notes;
    const heldKeys = pressedKeys.current;
    return () => {
      boundNotes.forEach(stopNoteIfPressed);
      heldKeys.clear();
    };
  }, [notes, stopNoteIfPressed]);
}
