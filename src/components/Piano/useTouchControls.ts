"use client";
import { useCallback, useRef } from "react";
import { PIANO_CONFIG } from "@/lib/config";

export function useTouchControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  setActiveNotes: React.Dispatch<React.SetStateAction<Set<string>>>,
  noteActiveDuration = PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS
) {
  const activeTouches = useRef<Map<number, string>>(new Map());
  const activeTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const triggerNote = useCallback(
    (fileName: string, noteName: string, touchId: number) => {
      const currentNote = activeTouches.current.get(touchId);
      if (currentNote && currentNote !== noteName) {
        stopNote(currentNote, false);
        setActiveNotes(prev => {
          const copy = new Set(prev);
          copy.delete(currentNote);
          return copy;
        });
      }

      activeTouches.current.set(touchId, noteName);
      playNote(fileName, noteName, false);

      setActiveNotes(prev => new Set(prev).add(noteName));

      // Clear any existing timeout for this note
      if (activeTimeouts.current.has(noteName)) {
        clearTimeout(activeTimeouts.current.get(noteName)!);
      }

      // Auto-remove highlight after noteActiveDuration
      const timeout = setTimeout(() => {
        // Only remove if no finger is still pressing it
        const stillActive = Array.from(activeTouches.current.values()).includes(noteName);
        if (!stillActive) {
          setActiveNotes(prev => {
            const copy = new Set(prev);
            copy.delete(noteName);
            return copy;
          });
        }
        activeTimeouts.current.delete(noteName);
      }, noteActiveDuration);

      activeTimeouts.current.set(noteName, timeout);
    },
    [playNote, stopNote, setActiveNotes, noteActiveDuration]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>, fileName: string, noteName: string) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach(touch => {
        triggerNote(fileName, noteName, touch.identifier);
      });
    },
    [triggerNote]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      Array.from(e.touches).forEach(touch => {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!element) return;

        const keyElement = element.closest("[data-note-name]") as HTMLButtonElement;
        if (!keyElement) return;

        const newNoteName = keyElement.dataset.noteName;
        const newFileName = keyElement.dataset.fileName;
        if (!newNoteName || !newFileName) return;

        const currentNote = activeTouches.current.get(touch.identifier);
        if (currentNote !== newNoteName) {
          if (currentNote) {
            stopNote(currentNote, false);
            setActiveNotes(prev => {
              const copy = new Set(prev);
              copy.delete(currentNote);
              return copy;
            });
          }
          triggerNote(newFileName, newNoteName, touch.identifier);
        }
      });
    },
    [stopNote, triggerNote, setActiveNotes]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach(touch => {
        const noteName = activeTouches.current.get(touch.identifier);
        if (noteName) {
          stopNote(noteName, false);
          activeTouches.current.delete(touch.identifier);

          setActiveNotes(prev => {
            const copy = new Set(prev);
            copy.delete(noteName);
            return copy;
          });

          if (activeTimeouts.current.has(noteName)) {
            clearTimeout(activeTimeouts.current.get(noteName)!);
            activeTimeouts.current.delete(noteName);
          }
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
