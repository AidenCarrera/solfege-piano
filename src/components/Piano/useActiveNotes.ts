import { useState, useCallback, useEffect, useRef } from "react";

export function useActiveNotes() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const flashTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

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
      const existingTimer = flashTimers.current.get(note);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        deactivateNote(note);
        flashTimers.current.delete(note);
      }, durationMs);
      flashTimers.current.set(note, timer);
    },
    [activateNote, deactivateNote],
  );

  const clearAllNotes = useCallback(() => {
    flashTimers.current.forEach(clearTimeout);
    flashTimers.current.clear();
    setActiveNotes(new Set());
  }, []);

  useEffect(
    () => () => {
      flashTimers.current.forEach(clearTimeout);
      flashTimers.current.clear();
    },
    [],
  );

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
