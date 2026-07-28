"use client";
import { useCallback, useEffect, useRef } from "react";
import { refocusSustainPedal } from "@/lib/keyboard";

const noteNameOf = (element: Element | null | undefined) =>
  element?.closest<HTMLElement>("[data-note-name]")?.dataset.noteName;

export function useTouchControls(
  playNote: (noteName: string) => void,
  stopNote: (noteName: string) => void,
  activateNote: (noteName: string) => void,
  deactivateNote: (noteName: string) => void,
) {
  const activeTouches = useRef<Map<number, string>>(new Map());
  const keyboardRef = useRef<HTMLDivElement>(null);

  // Keep listeners stable while callbacks change.
  const latest = useRef({ playNote, stopNote, activateNote, deactivateNote });
  useEffect(() => {
    latest.current = { playNote, stopNote, activateNote, deactivateNote };
  });

  const releaseTouch = useCallback((touchId: number) => {
    const noteName = activeTouches.current.get(touchId);
    if (!noteName) return;

    activeTouches.current.delete(touchId);

    // A note ends only after every finger leaves it.
    const stillHeld = Array.from(activeTouches.current.values()).includes(
      noteName,
    );
    if (stillHeld) return;

    latest.current.stopNote(noteName);
    latest.current.deactivateNote(noteName);
  }, []);

  const triggerNote = useCallback(
    (noteName: string, touchId: number) => {
      const currentNote = activeTouches.current.get(touchId);

      if (currentNote && currentNote !== noteName) {
        releaseTouch(touchId);
      }

      activeTouches.current.set(touchId, noteName);
      latest.current.playNote(noteName);
      latest.current.activateNote(noteName);
    },
    [releaseTouch],
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const started = Array.from(e.changedTouches).filter((touch) => {
        const noteName = noteNameOf(touch.target as Element | null);
        if (!noteName) return false;
        triggerNote(noteName, touch.identifier);
        return true;
      });
      if (started.length === 0) return;

      // Prevent the browser from replaying the touch as a mouse press.
      e.preventDefault();
      refocusSustainPedal();
    },
    [triggerNote],
  );

  // Touch targets do not update during a drag, so hit-test the current point.
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (activeTouches.current.size === 0) return;
      e.preventDefault();

      Array.from(e.touches).forEach((touch) => {
        const newNoteName = noteNameOf(
          document.elementFromPoint(touch.clientX, touch.clientY),
        );
        if (!newNoteName) return;

        if (activeTouches.current.get(touch.identifier) === newNoteName) return;
        triggerNote(newNoteName, touch.identifier);
      });
    },
    [triggerNote],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach((touch) => {
        releaseTouch(touch.identifier);
      });
    },
    [releaseTouch],
  );

  // Native listeners allow preventDefault on touch movement.
  useEffect(() => {
    const keyboard = keyboardRef.current;
    if (!keyboard) return;

    keyboard.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    keyboard.addEventListener("touchmove", handleTouchMove, { passive: false });
    keyboard.addEventListener("touchend", handleTouchEnd);
    keyboard.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      keyboard.removeEventListener("touchstart", handleTouchStart);
      keyboard.removeEventListener("touchmove", handleTouchMove);
      keyboard.removeEventListener("touchend", handleTouchEnd);
      keyboard.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    const heldTouches = activeTouches.current;
    return () => {
      new Set(heldTouches.values()).forEach((noteName) =>
        latest.current.stopNote(noteName),
      );
      heldTouches.clear();
    };
  }, []);

  return keyboardRef;
}
