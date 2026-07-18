import { Note, BASE_NOTES, KEYBOARD_MAP_C4_C5 } from "./note";

/**
 * Generates complete octaves followed by the ending octave's C boundary.
 * Computer-key mappings are limited to the playable C4-C5 range.
 */
export function generateNotes(startOctave: number, endOctave: number): Note[] {
  const notes: Note[] = [];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    BASE_NOTES.forEach((n, i) => {
      // Close the range on C instead of adding another full octave.
      if (octave === endOctave && n.base !== "C") return;

      let key = "";
      if (octave === 3) {
        key = KEYBOARD_MAP_C4_C5[i] ?? "";
      } else if (octave === 4 && n.base === "C") {
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
