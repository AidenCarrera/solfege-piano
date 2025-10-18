// lib/noteGenerator.ts
import { Note } from "./note";
import { BASE_NOTES } from "./noteDefinitions";

// Only map keys for C4–C5
const KEYBOARD_MAP_C4_C5 = ["a","w","s","e","d","f","t","g","y","h","u","j","k"];

export function generateNotes(startOctave: number, endOctave: number): Note[] {
  const notes: Note[] = [];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    BASE_NOTES.forEach((n, i) => {
      if (octave === endOctave && n.base !== "C") return;

      // Assign keys
      let key = "";
      if (octave === 4) {
        key = KEYBOARD_MAP_C4_C5[i]; // C4–B4
      } else if (octave === 5 && n.base === "C") {
        key = KEYBOARD_MAP_C4_C5[KEYBOARD_MAP_C4_C5.length - 1]; // C5 gets last key
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

