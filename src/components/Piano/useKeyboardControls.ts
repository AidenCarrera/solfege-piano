"use client";
import { useEffect, useRef } from "react";
import { notes } from "@/lib/notes";

/**
 * useKeyboardControls Hook  
 * 
 * Handles keyboard input for triggering piano notes.
 * Prevents duplicate triggers by tracking currently pressed keys.
 * Calls both playNote and stopNote for proper sustain behavior.
 */
export function useKeyboardControls(
  playNote: (fileName: string, note: string) => void,
  stopNote: (note: string) => void
) {
  /* ----- Track currently pressed keys to avoid repeated triggers ----- */
  const pressedKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    /* ----- Key Down Handler ----- */
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore spacebar (used for sustain toggle)
      if (e.code === "Space") return;

      const key = e.key.toLowerCase();
      const note = notes.find((n) => n.key === key);
      if (!note) return; // Skip if key doesn't map to a note

      e.preventDefault(); // Prevent browser default shortcuts

      // Only trigger note if key wasn't already pressed
      if (!pressedKeys.current.has(key)) {
        pressedKeys.current.add(key);
        playNote(note.fileName, note.name);
      }
    };

    /* ----- Key Up Handler ----- */
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") return;

      const key = e.key.toLowerCase();
      const note = notes.find((n) => n.key === key);
      
      if (note && pressedKeys.current.has(key)) {
        pressedKeys.current.delete(key);
        stopNote(note.name);
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