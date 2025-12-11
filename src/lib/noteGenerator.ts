// lib/noteGenerator.ts
import { Note, BASE_NOTES, KEYBOARD_MAP_C4_C5 } from "./note";

/**
 * Generates a list of piano notes for a given octave range
 * 
 * @param startOctave - Starting octave (inclusive)
 * @param endOctave - Ending octave (inclusive, but only includes C)
 * @returns Array of Note objects with keyboard mappings for C4-C5 range
 * 
 * @example
 * generateNotes(3, 4) // Returns C3 to C4 with keyboard shortcuts
 * generateNotes(2, 6) // Returns C2 to C6 (full piano range)
 */
export function generateNotes(startOctave: number, endOctave: number): Note[] {
  const notes: Note[] = [];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    BASE_NOTES.forEach((n, i) => {
      // Only include C from the end octave (for clean octave boundaries)
      if (octave === endOctave && n.base !== "C") return;

      // Assign keyboard shortcuts only for C4-C5 range
      let key = "";
      if (octave === 3) {
        // C4-B4 get mapped to keyboard
        key = KEYBOARD_MAP_C4_C5[i] ?? "";
      } else if (octave === 4 && n.base === "C") {
        // C5 gets the last key
        key = KEYBOARD_MAP_C4_C5[KEYBOARD_MAP_C4_C5.length - 1] ?? "";
      }

      notes.push({
        name: `${n.base}${octave}`,
        isSharp: n.isSharp,
        fileName: `${n.base}${octave}`,
        key,
        solfege: n.solfege,
      });
    });
  }

  return notes;
}