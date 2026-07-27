import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Tracks which keys are lit.
 *
 * `activeNotes` is replaced rather than mutated so React sees the change, and
 * flash timers are keyed by note so retriggering a note during its flash
 * restarts the timer instead of stacking two.
 */
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
    flashTimers.current.forEach((timer) => clearTimeout(timer));
    flashTimers.current.clear();
    setActiveNotes(new Set());
  }, []);

  useEffect(
    () => () => {
      flashTimers.current.forEach((timer) => clearTimeout(timer));
      flashTimers.current.clear();
    },
    [],
  );

  return {
    activeNotes,
    activateNote,
    deactivateNote,
    flashNote,
    clearAllNotes,
  };
}
