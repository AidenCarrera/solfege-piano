"use client";
import { useCallback, useEffect, useRef } from "react";
import { refocusSustainPedal } from "@/lib/keyboard";

/** Tracks each touch independently so chords and glissandos remain polyphonic. */
export function useTouchControls(
  playNote: (noteName: string) => void,
  stopNote: (noteName: string) => void,
  activateNote: (noteName: string) => void,
  deactivateNote: (noteName: string) => void,
) {
  const activeTouches = useRef<Map<number, string>>(new Map());

  const releaseTouch = useCallback(
    (touchId: number) => {
      const noteName = activeTouches.current.get(touchId);
      if (!noteName) return;

      activeTouches.current.delete(touchId);

      // Two fingers can land on the same key; only the last one to lift ends it.
      const stillHeld = Array.from(activeTouches.current.values()).includes(
        noteName,
      );
      if (stillHeld) return;

      stopNote(noteName);
      deactivateNote(noteName);
    },
    [stopNote, deactivateNote],
  );

  const triggerNote = useCallback(
    (noteName: string, touchId: number) => {
      const currentNote = activeTouches.current.get(touchId);

      if (currentNote && currentNote !== noteName) {
        releaseTouch(touchId);
      }

      activeTouches.current.set(touchId, noteName);
      playNote(noteName);
      activateNote(noteName);
    },
    [playNote, activateNote, releaseTouch],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>, noteName: string) => {
      e.preventDefault();
      refocusSustainPedal();
      Array.from(e.changedTouches).forEach((touch) => {
        triggerNote(noteName, touch.identifier);
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
        const keyElement = element?.closest<HTMLElement>("[data-note-name]");
        const newNoteName = keyElement?.dataset.noteName;
        if (!newNoteName) return;

        const currentNote = activeTouches.current.get(touch.identifier);
        if (currentNote === newNoteName) return;

        if (currentNote) releaseTouch(touch.identifier);
        triggerNote(newNoteName, touch.identifier);
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
      // Wrapped rather than passed directly: `Set.forEach` also supplies the
      // key and the set itself, which would leak into `stopNote`'s arguments.
      new Set(activeTouches.current.values()).forEach((noteName) =>
        stopNote(noteName),
      );
      activeTouches.current.clear();
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
