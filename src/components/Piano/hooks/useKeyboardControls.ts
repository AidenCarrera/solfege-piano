"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { Note } from "@/lib/note";
import { isTextEntryTarget, refocusSustainPedal } from "@/lib/keyboard";
import { usePageInactive } from "./usePageInactive";

export function useKeyboardControls(
  notes: Note[],
  playNote: (noteName: string) => void,
  stopNote: (noteName: string) => void,
  activateNote: (noteName: string) => void,
  deactivateNote: (noteName: string) => void,
) {
  const pressedKeys = useRef<Set<string>>(new Set());

  const notesByShortcut = useMemo(() => {
    const map = new Map<string, Note>();
    notes.forEach((note) => {
      if (note.shortcut) map.set(note.shortcut, note);
    });
    return map;
  }, [notes]);

  // Piano rebuilds these on nearly every render: activateNote is an inline
  // arrow and playNote changes with volume. Reading them through a ref keeps
  // the listener effect mounted for the component's lifetime. When it re-ran
  // per render instead, its cleanup released the note that had just been
  // pressed, cutting each keystroke off within a few milliseconds.
  const latest = useRef({
    notes,
    notesByShortcut,
    playNote,
    stopNote,
    activateNote,
    deactivateNote,
  });
  useEffect(() => {
    latest.current = {
      notes,
      notesByShortcut,
      playNote,
      stopNote,
      activateNote,
      deactivateNote,
    };
  });

  const triggerNote = useCallback((noteObj: Note) => {
    if (pressedKeys.current.has(noteObj.shortcut)) return;

    refocusSustainPedal();
    pressedKeys.current.add(noteObj.shortcut);
    latest.current.playNote(noteObj.name);
    latest.current.activateNote(noteObj.name);
  }, []);

  const stopNoteIfPressed = useCallback((noteObj: Note) => {
    if (!pressedKeys.current.has(noteObj.shortcut)) return;

    pressedKeys.current.delete(noteObj.shortcut);
    latest.current.stopNote(noteObj.name);
    latest.current.deactivateNote(noteObj.name);
  }, []);

  const releasePressedKeys = useCallback(() => {
    latest.current.notes.forEach((note) => stopNoteIfPressed(note));
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

      const noteObj = latest.current.notesByShortcut.get(e.key.toLowerCase());
      if (!noteObj) return;

      e.preventDefault();

      if (e.repeat) return;

      triggerNote(noteObj);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") return;

      const noteObj = latest.current.notesByShortcut.get(e.key.toLowerCase());
      if (!noteObj) return;

      stopNoteIfPressed(noteObj);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      releasePressedKeys();
    };
  }, [triggerNote, stopNoteIfPressed, releasePressedKeys]);

  usePageInactive(releasePressedKeys);

  // The shortcut map moves with the octave range, so release whatever is still
  // held against the outgoing note set before it is swapped out.
  useEffect(() => {
    const boundNotes = notes;
    const heldKeys = pressedKeys.current;
    return () => {
      boundNotes.forEach((note) => stopNoteIfPressed(note));
      heldKeys.clear();
    };
  }, [notes, stopNoteIfPressed]);
}
