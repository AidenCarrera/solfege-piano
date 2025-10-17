"use client";
import { useCallback, useRef } from "react";
import { PIANO_CONFIG } from "@/lib/config";

/**
 * useTouchControls Hook
 *
 * Handles multi-touch interactions for a piano component:
 * - Supports independent touch tracking per finger
 * - Plays/stops notes reliably during touch movement
 * - Manages visual highlighting of active notes
 *
 * @param playNote - Callback to trigger note playback. Receives fileName, noteName, and isKeyboard flag.
 * @param stopNote - Callback to stop note playback. Receives noteName and isKeyboard flag.
 * @param setActiveNotes - State setter to highlight currently active notes.
 * @param noteActiveDuration - Duration (ms) for which a note is visually highlighted.
 *
 * @returns Object with handlers: handleTouchStart, handleTouchMove, handleTouchEnd
 */
export function useTouchControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  setActiveNotes: React.Dispatch<React.SetStateAction<Set<string>>>,
  noteActiveDuration = PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS // duration of visual highlight in ms
) {
  /* ----- Track currently active touches (touchId → noteName) ----- */
  const activeTouches = useRef<Map<number, string>>(new Map());

  /* ----- Track timeouts for note highlights (noteName → timeout) ----- */
  const activeTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Trigger a note
   * - Stops any previous note for this touch
   * - Plays the current note
   * - Applies and clears momentary visual highlight
   */
  const triggerNote = useCallback(
    (fileName: string, noteName: string, touchId: number) => {
      // Stop previous note for this touch
      const currentNote = activeTouches.current.get(touchId);
      if (currentNote && currentNote !== noteName) {
        stopNote(currentNote, false);
      }

      // Record the new active note for this touch
      activeTouches.current.set(touchId, noteName);

      // Play the note
      playNote(fileName, noteName, false);

      // Manage temporary visual highlight
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

  /**
   * Handle touch start on a key
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>, fileName: string, noteName: string) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach((touch) => {
        triggerNote(fileName, noteName, touch.identifier);
      });
    },
    [triggerNote]
  );

  /**
   * Handle touch move (dragging across keys)
   * - Dynamically changes notes as the touch moves across keys
   */
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

  /**
   * Handle touch end (finger release)
   * - Stops playback and removes visual highlight
   */
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

  /* ----- Return event handlers for component integration ----- */
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
