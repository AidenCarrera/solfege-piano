import { useState, useCallback } from "react";

export function useActiveNotes() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

  const activateNote = useCallback((note: string) => {
    setActiveNotes((prev) => (prev.has(note) ? prev : new Set(prev).add(note)));
  }, []);

  const deactivateNote = useCallback((note: string) => {
    setActiveNotes((prev) => {
      if (!prev.has(note)) return prev;
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }, []);

  const clearAllNotes = useCallback(() => {
    setActiveNotes((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  return { activeNotes, activateNote, deactivateNote, clearAllNotes };
}
