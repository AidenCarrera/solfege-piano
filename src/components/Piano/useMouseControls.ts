"use client";
import { useRef, useCallback, useEffect } from "react";

export function useMouseControls(
  playNote: (fileName: string, noteName: string, isKeyboard: boolean) => void,
  stopNote: (noteName: string, isKeyboard: boolean) => void,
  setActiveNotes: React.Dispatch<React.SetStateAction<Set<string>>>,
  noteActiveDuration = 150 // visual highlight duration in ms
) {
  const isMouseDown = useRef(false);
  const currentNote = useRef<string | null>(null);

  const triggerNote = useCallback(
    (file: string, name: string) => {
      // Stop previous note for playback
      if (currentNote.current && currentNote.current !== name) {
        stopNote(currentNote.current, false);
      }

      // Play new note
      currentNote.current = name;
      playNote(file, name, false);

      // Momentary highlight
      setActiveNotes((prev) => {
        const copy = new Set(prev);
        copy.add(name);
        return copy;
      });
      setTimeout(() => {
        setActiveNotes((prev) => {
          const copy = new Set(prev);
          copy.delete(name);
          return copy;
        });
      }, noteActiveDuration);
    },
    [playNote, stopNote, setActiveNotes, noteActiveDuration]
  );

  const handleMouseDown = useCallback(
    (file: string, name: string) => {
      isMouseDown.current = true;
      triggerNote(file, name);
    },
    [triggerNote]
  );

  const handleMouseEnter = useCallback(
    (file: string, name: string) => {
      if (!isMouseDown.current) return;
      triggerNote(file, name);
    },
    [triggerNote]
  );

  const handleMouseUp = useCallback(() => {
    if (currentNote.current) {
      stopNote(currentNote.current, false);
      currentNote.current = null;
    }
    isMouseDown.current = false;
  }, [stopNote]);

  // Global mouse-up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (currentNote.current) stopNote(currentNote.current, false);
      currentNote.current = null;
      isMouseDown.current = false;
      setActiveNotes(new Set());
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [stopNote, setActiveNotes]);

  return { handleMouseDown, handleMouseEnter, handleMouseUp };
}
