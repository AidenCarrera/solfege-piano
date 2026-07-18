"use client";
import { useCallback, useEffect, useRef } from "react";
import { PIANO_CONFIG } from "@/lib/config";

/** Tracks each touch independently so chords and glissandos remain polyphonic. */
export function useTouchControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  activateNote?: (note: string) => void,
  deactivateNote?: (note: string) => void,
) {
  const activeTouches = useRef<Map<number, string>>(new Map());
  const activeTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const releaseTouch = useCallback(
    (touchId: number) => {
      const noteName = activeTouches.current.get(touchId);
      if (!noteName) return;

      activeTouches.current.delete(touchId);
      const stillHeld = Array.from(activeTouches.current.values()).includes(
        noteName,
      );
      if (stillHeld) return;

      stopNote(noteName, false);
      deactivateNote?.(noteName);
      const timeout = activeTimeouts.current.get(noteName);
      if (timeout) clearTimeout(timeout);
      activeTimeouts.current.delete(noteName);
    },
    [stopNote, deactivateNote],
  );

  const triggerNote = useCallback(
    (fileName: string, noteName: string, touchId: number) => {
      const currentNote = activeTouches.current.get(touchId);

      if (currentNote && currentNote !== noteName) {
        releaseTouch(touchId);
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
    [playNote, activateNote, deactivateNote, releaseTouch],
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
            releaseTouch(touch.identifier);
          }
          triggerNote(newFileName, newNoteName, touch.identifier);
        }
      });
    },
    [releaseTouch, triggerNote],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((touch) => {
        releaseTouch(touch.identifier);
      });
    },
    [releaseTouch],
  );

  useEffect(
    () => () => {
      new Set(activeTouches.current.values()).forEach((noteName) => {
        stopNote(noteName, false);
      });
      activeTouches.current.clear();
      activeTimeouts.current.forEach(clearTimeout);
      activeTimeouts.current.clear();
    },
    [stopNote],
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel: handleTouchEnd,
  };
}
