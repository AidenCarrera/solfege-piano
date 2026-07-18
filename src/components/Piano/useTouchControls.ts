"use client";
import { useCallback, useRef } from "react";
import { PIANO_CONFIG } from "@/lib/config";

/** Tracks each touch independently so chords and glissandos remain polyphonic. */
export function useTouchControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  activateNote?: (note: string) => void,
  deactivateNote?: (note: string) => void,
) {
  const activeTouches = useRef<Map<number, string>>(new Map());
  const activeTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const triggerNote = useCallback(
    (fileName: string, noteName: string, touchId: number) => {
      const currentNote = activeTouches.current.get(touchId);

      if (currentNote && currentNote !== noteName) {
        stopNote(currentNote, false);
        if (deactivateNote) {
          deactivateNote(currentNote);
        }
      }

      activeTouches.current.set(touchId, noteName);
      playNote(fileName, noteName, false);

      if (activateNote) {
        activateNote(noteName);
      }

      if (activeTimeouts.current.has(noteName)) {
        clearTimeout(activeTimeouts.current.get(noteName)!);
      }

      // Retain the highlight while another finger still holds the same note.
      const timeout = setTimeout(() => {
        const stillActive = Array.from(activeTouches.current.values()).includes(
          noteName,
        );
        if (!stillActive && deactivateNote) {
          deactivateNote(noteName);
        }
        activeTimeouts.current.delete(noteName);
      }, PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS);

      activeTimeouts.current.set(noteName, timeout);
    },
    [playNote, stopNote, activateNote, deactivateNote],
  );

  const handleTouchStart = useCallback(
    (
      e: React.TouchEvent<HTMLButtonElement>,
      fileName: string,
      noteName: string,
    ) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((touch) => {
        triggerNote(fileName, noteName, touch.identifier);
      });
    },
    [triggerNote],
  );

  // Touch events stay bound to their origin, so hit-test each finger while moving.
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      Array.from(e.touches).forEach((touch) => {
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!element) return;

        const keyElement = element.closest(
          "[data-note-name]",
        ) as HTMLButtonElement;
        if (!keyElement) return;

        const newNoteName = keyElement.dataset.noteName;
        const newFileName = keyElement.dataset.fileName;
        if (!newNoteName || !newFileName) return;

        const currentNote = activeTouches.current.get(touch.identifier);
        if (currentNote !== newNoteName) {
          if (currentNote) {
            stopNote(currentNote, false);
            if (deactivateNote) {
              deactivateNote(currentNote);
            }
          }
          triggerNote(newFileName, newNoteName, touch.identifier);
        }
      });
    },
    [stopNote, deactivateNote, triggerNote],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((touch) => {
        const noteName = activeTouches.current.get(touch.identifier);
        if (noteName) {
          stopNote(noteName, false);
          activeTouches.current.delete(touch.identifier);

          if (deactivateNote) {
            deactivateNote(noteName);
          }

          if (activeTimeouts.current.has(noteName)) {
            clearTimeout(activeTimeouts.current.get(noteName)!);
            activeTimeouts.current.delete(noteName);
          }
        }
      });
    },
    [stopNote, deactivateNote],
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
