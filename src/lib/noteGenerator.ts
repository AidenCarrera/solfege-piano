import { Note, BASE_NOTES, KEYBOARD_MAP_C3_C4 } from "./note";

/** The octave the computer-keyboard shortcuts are mapped to. */
const SHORTCUT_OCTAVE = 3;

/**
 * Generates complete octaves followed by the ending octave's C boundary.
 * Computer-key mappings are limited to the primary C3-C4 range.
 */
export function generateNotes(startOctave: number, endOctave: number): Note[] {
  const notes: Note[] = [];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    BASE_NOTES.forEach((baseNote, index) => {
      // Close the range on C instead of adding another full octave.
      if (octave === endOctave && baseNote.base !== "C") return;

      let shortcut = "";
      if (octave === SHORTCUT_OCTAVE) {
        shortcut = KEYBOARD_MAP_C3_C4[index] ?? "";
      } else if (octave === SHORTCUT_OCTAVE + 1 && baseNote.base === "C") {
        // The range's closing C completes the one-octave shortcut span.
        shortcut = KEYBOARD_MAP_C3_C4[KEYBOARD_MAP_C3_C4.length - 1] ?? "";
      }

      const natural = baseNote.base.replace("s", "");

      notes.push({
        name: `${baseNote.base}${octave}`,
        base: baseNote.base,
        naturalName: `${natural}${octave}`,
        octave,
        isSharp: baseNote.isSharp,
        toneName: `${baseNote.isSharp ? `${natural}#` : natural}${octave}`,
        shortcut,
        solfege: baseNote.solfege,
        spokenName: `${natural}${baseNote.isSharp ? " sharp" : ""} ${octave}`,
      });
    });
  }

  return notes;
}
