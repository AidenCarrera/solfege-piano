"use client";
import { useEffect, useRef } from "react";
import { notes } from "@/lib/notes";

export function useKeyboardControls(playNote: (file: string, note: string) => void) {
  const pressedKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const note = notes.find((n) => n.key === key);
      if (!note) return;
      e.preventDefault();
      if (!pressedKeys.current.has(key)) {
        pressedKeys.current.add(key);
        playNote(note.fileName, note.name);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [playNote]);
}
