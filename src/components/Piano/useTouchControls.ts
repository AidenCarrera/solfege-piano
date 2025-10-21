"use client";
import { useCallback, useRef } from "react";
import { PIANO_CONFIG } from "@/lib/config";

/**
 * useTouchControls Hook
 *
 * Handles multi-touch interactions for a piano component:
 * Supports simultaneous multiple finger touches
 * Handles touch drag across keys
 * Manages visual highlighting with auto-cleanup
 *
 * @param playNote - Callback to trigger note playback
 * @param stopNote - Callback to stop note playback
 * @param activateNote - Optional callback to visually activate a note
 * @param deactivateNote - Optional callback to visually deactivate a note
 * 
 * @returns Object with touch handlers
 */
export function useTouchControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  activateNote?: (note: string) => void,
  deactivateNote?: (note: string) => void
) {
  /* ----- Track which touch ID is playing which note ----- */
  const activeTouches = useRef<Map<number, string>>(new Map());
  
  /* ----- Track auto-deactivation timeouts for visual highlights ----- */
  const activeTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  /**
   * Trigger a note for a specific touch
   * - Stops previous note from this touch if different
   * - Plays new note and activates visual highlight
   * - Sets up auto-deactivation timeout
   */
  const triggerNote = useCallback(
    (fileName: string, noteName: string, touchId: number) => {
      const currentNote = activeTouches.current.get(touchId);
      
      // If this touch was playing a different note, stop it
      if (currentNote && currentNote !== noteName) {
        stopNote(currentNote, false);
        if (deactivateNote) {
          deactivateNote(currentNote);
        }
      }

      // Update touch mapping and play note
      activeTouches.current.set(touchId, noteName);
      playNote(fileName, noteName, false);

      // Activate visual highlight
      if (activateNote) {
        activateNote(noteName);
      }

      // Clear any existing timeout for this note
      if (activeTimeouts.current.has(noteName)) {
        clearTimeout(activeTimeouts.current.get(noteName)!);
      }

      // Auto-remove highlight after duration (if no finger is still on it)
      const timeout = setTimeout(() => {
        const stillActive = Array.from(activeTouches.current.values()).includes(noteName);
        if (!stillActive && deactivateNote) {
          deactivateNote(noteName);
        }
        activeTimeouts.current.delete(noteName);
      }, PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS);

      activeTimeouts.current.set(noteName, timeout);
    },
    [playNote, stopNote, activateNote, deactivateNote]
  );

  /**
   * Handle touch start on a key
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>, fileName: string, noteName: string) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach(touch => {
        triggerNote(fileName, noteName, touch.identifier);
      });
    },
    [triggerNote]
  );

  /**
   * Handle touch drag across keys
   * Uses elementFromPoint to detect which key is under each finger
   */
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
            if (deactivateNote) {
              deactivateNote(currentNote);
            }
          }
          triggerNote(newFileName, newNoteName, touch.identifier);
        }
      });
    },
    [stopNote, deactivateNote, triggerNote]
  );

  /**
   * Handle touch end (finger lifted)
   * Stops note and cleans up visual state
   */
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach(touch => {
        const noteName = activeTouches.current.get(touch.identifier);
        if (noteName) {
          stopNote(noteName, false);
          activeTouches.current.delete(touch.identifier);

          if (deactivateNote) {
            deactivateNote(noteName);
          }

          // Clean up timeout
          if (activeTimeouts.current.has(noteName)) {
            clearTimeout(activeTimeouts.current.get(noteName)!);
            activeTimeouts.current.delete(noteName);
          }
        }
      });
    },
    [stopNote, deactivateNote]
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}