"use client";
import { useCallback, useRef } from "react";

export function useTouchControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  setActiveNotes: React.Dispatch<React.SetStateAction<Set<string>>>,
  noteActiveDuration = 150 // duration of visual highlight in ms
) {
  const activeTouches = useRef<Map<number, string>>(new Map());
  const activeTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const triggerNote = useCallback(
    (fileName: string, noteName: string, touchId: number) => {
      // Stop previous note for this touch
      const currentNote = activeTouches.current.get(touchId);
      if (currentNote && currentNote !== noteName) {
        stopNote(currentNote, false);
      }

      activeTouches.current.set(touchId, noteName);
      playNote(fileName, noteName, false);

      // Momentary visual highlight
      if (activeTimeouts.current.has(noteName)) {
        clearTimeout(activeTimeouts.current.get(noteName)!);
      }
      setActiveNotes((prev) => new Set(prev).add(noteName));

      const timeout = setTimeout(() => {
        setActiveNotes((prev) => {
          const copy = new Set(prev);
          copy.delete(noteName);
          return copy;
        });
        activeTimeouts.current.delete(noteName);
      }, noteActiveDuration);

      activeTimeouts.current.set(noteName, timeout);
    },
    [playNote, stopNote, setActiveNotes, noteActiveDuration]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>, fileName: string, noteName: string) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((touch) => {
        triggerNote(fileName, noteName, touch.identifier);
      });
    },
    [triggerNote]
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
        if (currentNote !== newNoteName) {
          if (currentNote) stopNote(currentNote, false);
          triggerNote(newFileName, newNoteName, touch.identifier);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playNote, stopNote, triggerNote]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((touch) => {
        const noteName = activeTouches.current.get(touch.identifier);
        if (noteName) {
          stopNote(noteName, false);
          activeTouches.current.delete(touch.identifier);

          if (activeTimeouts.current.has(noteName)) {
            clearTimeout(activeTimeouts.current.get(noteName)!);
            activeTimeouts.current.delete(noteName);
          }
          setActiveNotes((prev) => {
            const copy = new Set(prev);
            copy.delete(noteName);
            return copy;
          });
        }
      });
    },
    [stopNote, setActiveNotes]
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
