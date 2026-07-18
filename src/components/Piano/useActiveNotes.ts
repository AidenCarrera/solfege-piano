import { useState, useCallback } from "react";

export function useActiveNotes() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

  const activateNote = useCallback((note: string) => {
    setActiveNotes((prev) => new Set(prev).add(note));
  }, []);

  const deactivateNote = useCallback((note: string) => {
    setActiveNotes((prev) => {
      const copy = new Set(prev);
      copy.delete(note);
      return copy;
    });
  }, []);

  const flashNote = useCallback(
    (note: string, durationMs: number) => {
      activateNote(note);
      setTimeout(() => {
        deactivateNote(note);
      }, durationMs);
    },
    [activateNote, deactivateNote],
  );

  const clearAllNotes = useCallback(() => {
    setActiveNotes(new Set());
  }, []);

  const setActiveNotesRaw = setActiveNotes;

  return {
    activeNotes,
    activateNote,
    deactivateNote,
    flashNote,
    clearAllNotes,
    setActiveNotes: setActiveNotesRaw,
  };
}
