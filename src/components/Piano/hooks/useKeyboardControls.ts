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
  const pressedKeys = useRef<Map<string, Note>>(new Map());

  const notesByShortcut = useMemo(() => {
    const map = new Map<string, Note>();
    notes.forEach((note) => {
      note.shortcuts.forEach((shortcut) => map.set(shortcut, note));
    });
    return map;
  }, [notes]);

  // Keep listeners stable while callbacks change.
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

  const triggerNote = useCallback((shortcut: string, noteObj: Note) => {
    if (pressedKeys.current.has(shortcut)) return;

    refocusSustainPedal();
    const noteIsAlreadyPressed = Array.from(pressedKeys.current.values()).some(
      (pressedNote) => pressedNote.name === noteObj.name,
    );
    pressedKeys.current.set(shortcut, noteObj);

    if (noteIsAlreadyPressed) return;

    latest.current.playNote(noteObj.name);
    latest.current.activateNote(noteObj.name);
  }, []);

  const stopShortcutIfPressed = useCallback((shortcut: string) => {
    const noteObj = pressedKeys.current.get(shortcut);
    if (!noteObj) return;

    pressedKeys.current.delete(shortcut);
    const noteIsStillPressed = Array.from(pressedKeys.current.values()).some(
      (pressedNote) => pressedNote.name === noteObj.name,
    );
    if (noteIsStillPressed) return;

    latest.current.stopNote(noteObj.name);
    latest.current.deactivateNote(noteObj.name);
  }, []);

  const releasePressedKeys = useCallback(() => {
    const pressedNotes = new Map(
      Array.from(pressedKeys.current.values()).map((note) => [note.name, note]),
    );
    pressedKeys.current.clear();
    pressedNotes.forEach((note) => {
      latest.current.stopNote(note.name);
      latest.current.deactivateNote(note.name);
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" ||
        e.metaKey ||
        e.altKey ||
        e.ctrlKey ||
        isTextEntryTarget(e.target)
      )
        return;

      const shortcut = e.key.toLowerCase();
      const noteObj = latest.current.notesByShortcut.get(shortcut);
      if (!noteObj) return;

      e.preventDefault();

      if (e.repeat) return;

      triggerNote(shortcut, noteObj);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") return;

      stopShortcutIfPressed(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      releasePressedKeys();
    };
  }, [triggerNote, stopShortcutIfPressed, releasePressedKeys]);

  usePageInactive(releasePressedKeys);

  // Release keys before replacing their shortcut map.
  useEffect(() => {
    return releasePressedKeys;
  }, [notes, releasePressedKeys]);
}
