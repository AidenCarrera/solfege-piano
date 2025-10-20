import { useState, useCallback } from "react";

/**
 * Hook to manage active piano notes state
 * Provides convenient methods to add, remove, and clear active notes
 * @returns Object with activeNotes set and manipulation functions
 */
export function useActiveNotes() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

  /**
   * Activate a note (add to the set)
   */
  const activateNote = useCallback((note: string) => {
    setActiveNotes((prev) => new Set(prev).add(note));
  }, []);

  /**
   * Deactivate a note (remove from the set)
   */
  const deactivateNote = useCallback((note: string) => {
    setActiveNotes((prev) => {
      const copy = new Set(prev);
      copy.delete(note);
      return copy;
    });
  }, []);

  /**
   * Activate a note temporarily with auto-deactivation after a delay
   * @param note - Note name to activate
   * @param durationMs - How long to keep the note active (in milliseconds)
   */
  const flashNote = useCallback((note: string, durationMs: number) => {
    activateNote(note);
    setTimeout(() => {
      deactivateNote(note);
    }, durationMs);
  }, [activateNote, deactivateNote]);

  /**
   * Clear all active notes
   */
  const clearAllNotes = useCallback(() => {
    setActiveNotes(new Set());
  }, []);

  /**
   * Direct setter for advanced use cases
   */
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