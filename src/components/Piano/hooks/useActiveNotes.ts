import { useState, useCallback } from "react";

/**
 * Tracks which keys are lit.
 *
 * A key stays lit for exactly as long as it is held, whichever input started
 * it, so every input path pairs `activateNote` with `deactivateNote` rather
 * than relying on a timer to clear the highlight.
 *
 * The set is replaced rather than mutated so React sees the change, but only
 * when the contents actually differ: a repeated activate must not re-render
 * every key.
 */
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
