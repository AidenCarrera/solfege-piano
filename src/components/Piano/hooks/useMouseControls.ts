"use client";

import { useRef, useCallback, useEffect } from "react";
import type { NoteHandlers } from "@/lib/note";
import { blurFocusedControl } from "@/lib/keyboard";
import { usePageInactive } from "./usePageInactive";

export function useMouseControls(
  handlers: NoteHandlers,
  clearAllNotes: () => void,
) {
  const { playNote, stopNote, activateNote, deactivateNote } = handlers;
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
      blurFocusedControl();
      isMouseDown.current = true;
      triggerNote(name);
    },
    [triggerNote],
  );

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

  useEffect(() => {
    window.addEventListener("mouseup", releaseMouse);
    return () => window.removeEventListener("mouseup", releaseMouse);
  }, [releaseMouse]);

  usePageInactive(releaseMouse);

  return { handleMouseDown, handleMouseEnter, handleMouseUp };
}
