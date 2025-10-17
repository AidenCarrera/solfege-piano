"use client";
import { useCallback, useRef } from "react";

export function useTouchControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  setActiveNotes: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  const activeTouches = useRef<Map<number, string>>(new Map());

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>, fileName: string, noteName: string) => {
      e.preventDefault();
      if (!fileName || !noteName) return;

      Array.from(e.changedTouches).forEach((touch) => {
        if (!activeTouches.current.has(touch.identifier)) {
          activeTouches.current.set(touch.identifier, noteName);
          playNote(fileName, noteName, false);
          setActiveNotes(new Set(activeTouches.current.values()));
        }
      });
    },
    [playNote, setActiveNotes]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();

      Array.from(e.touches).forEach((touch) => {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!element) return;

        const keyElement = element.closest("[data-note-name]") as HTMLButtonElement;
        if (!keyElement) return;

        const newNoteName = keyElement.dataset.noteName;
        const newFileName = keyElement.dataset.fileName;
        if (!newNoteName || !newFileName) return;

        const currentNote = activeTouches.current.get(touch.identifier);

        if (currentNote && currentNote !== newNoteName) {
          stopNote(currentNote, false);
          activeTouches.current.set(touch.identifier, newNoteName);
          playNote(newFileName, newNoteName, false);
          setActiveNotes(new Set(activeTouches.current.values()));
        }
      });
    },
    [playNote, stopNote, setActiveNotes]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();

      Array.from(e.changedTouches).forEach((touch) => {
        const noteName = activeTouches.current.get(touch.identifier);
        if (noteName) {
          stopNote(noteName, false);
          activeTouches.current.delete(touch.identifier);
        }
      });

      setActiveNotes(new Set(activeTouches.current.values()));
    },
    [stopNote, setActiveNotes]
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
