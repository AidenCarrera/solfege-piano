"use client";
import { useEffect, useRef } from "react";
import { notes } from "@/lib/notes";

/**
 * useKeyboardControls Hook  
 * 
 * Handles keyboard input for triggering piano notes with correct sustain and retrigger behavior.
 * Adds safeguards for key repeat events and integrates seamlessly with useNotePlayer.
 */
export function useKeyboardControls(
  playNote: (fileName: string, note: string, isKeyboard: boolean) => void,
  stopNote: (note: string, isKeyboard: boolean) => void
) {
  /* ----- Track currently pressed keys to avoid repeated triggers ----- */
  const pressedKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    /* ----- Key Down Handler ----- */
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore system modifiers and spacebar (pedal handled separately)
      if (e.code === "Space" || e.metaKey || e.altKey || e.ctrlKey) return;

      const key = e.key.toLowerCase();
      const note = notes.find((n) => n.key === key);
      if (!note) return;

      // Prevent browser shortcut interference
      e.preventDefault();

      // Ignore held-down repeats (super important for stable playback)
      if (e.repeat) return;

      // Only trigger if not already pressed
      if (!pressedKeys.current.has(key)) {
        pressedKeys.current.add(key);
        playNote(note.fileName, note.name, true);
      }
    };

    /* ----- Key Up Handler ----- */
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") return;

      const key = e.key.toLowerCase();
      const note = notes.find((n) => n.key === key);
      if (!note) return;

      // Only trigger stop if key was marked as pressed
      if (pressedKeys.current.has(key)) {
        pressedKeys.current.delete(key);
        stopNote(note.name, true);
      }
    };

    /* ----- Register Event Listeners ----- */
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    /* ----- Cleanup on Unmount ----- */
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [playNote, stopNote]);
}
