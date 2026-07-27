"use client";
import { useCallback, useEffect, useRef } from "react";
import { refocusSustainPedal } from "@/lib/keyboard";

const noteNameOf = (element: Element | null | undefined) =>
  element?.closest<HTMLElement>("[data-note-name]")?.dataset.noteName;

/** Tracks each touch independently so chords and glissandos remain polyphonic. */
export function useTouchControls(
  playNote: (noteName: string) => void,
  stopNote: (noteName: string) => void,
  activateNote: (noteName: string) => void,
  deactivateNote: (noteName: string) => void,
) {
  const activeTouches = useRef<Map<number, string>>(new Map());
  const keyboardRef = useRef<HTMLDivElement>(null);

  // For the same reason as `useKeyboardControls`: Piano rebuilds these on
  // nearly every render, and depending on them directly would re-run both
  // effects below — tearing the listeners down mid-glissando and firing the
  // unmount cleanup, which cuts every held note off, on something as ordinary
  // as a volume change.
  const latest = useRef({ playNote, stopNote, activateNote, deactivateNote });
  useEffect(() => {
    latest.current = { playNote, stopNote, activateNote, deactivateNote };
  });

  const releaseTouch = useCallback((touchId: number) => {
    const noteName = activeTouches.current.get(touchId);
    if (!noteName) return;

    activeTouches.current.delete(touchId);

    // Two fingers can land on the same key; only the last one to lift ends it.
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
      // Each touch reports the element it landed on, so one listener on the
      // keyboard can serve every key.
      const started = Array.from(e.changedTouches).filter((touch) => {
        const noteName = noteNameOf(touch.target as Element | null);
        if (!noteName) return false;
        triggerNote(noteName, touch.identifier);
        return true;
      });
      if (started.length === 0) return;

      // Suppresses the compatibility mouse events the browser would otherwise
      // replay after the tap, which `useMouseControls` would hear as a second
      // press of the same key.
      e.preventDefault();
      refocusSustainPedal();
    },
    [triggerNote],
  );

  // Touch events stay bound to their origin, so hit-test each finger while moving.
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (activeTouches.current.size === 0) return;
      e.preventDefault();

      Array.from(e.touches).forEach((touch) => {
        const newNoteName = noteNameOf(
          document.elementFromPoint(touch.clientX, touch.clientY),
        );
        if (!newNoteName) return;

        // `triggerNote` releases whatever this finger was holding.
        if (activeTouches.current.get(touch.identifier) === newNoteName) return;
        triggerNote(newNoteName, touch.identifier);
      });
    },
    [triggerNote],
  );

  // No `preventDefault` here: touchstart already cancelled the compatibility
  // mouse events, and touchend is uncancelable once a scroll has begun.
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      Array.from(e.changedTouches).forEach((touch) => {
        releaseTouch(touch.identifier);
      });
    },
    [releaseTouch],
  );

  // React binds touchstart and touchmove passively at the root, which makes
  // `preventDefault` a no-op there, so the keyboard binds them itself.
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
      // Wrapped rather than passed directly: `Set.forEach` also supplies the
      // key and the set itself, which would leak into `stopNote`'s arguments.
      new Set(heldTouches.values()).forEach((noteName) =>
        latest.current.stopNote(noteName),
      );
      heldTouches.clear();
    };
  }, []);

  return keyboardRef;
}
