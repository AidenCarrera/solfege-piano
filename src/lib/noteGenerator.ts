// lib/noteGenerator.ts
import { Note } from "./note";
import { BASE_NOTES } from "./noteDefinitions";

const KEYBOARD_MAP = ["a","w","s","e","d","f","t","g","y","h","u","j","k"];

export function generateNotes(startOctave: number, endOctave: number): Note[] {
  const notes: Note[] = [];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    BASE_NOTES.forEach((n, i) => {
      if (octave === endOctave && n.base !== "C") return;
      notes.push({
        name: `${n.base}${octave}`,
        isSharp: n.isSharp,
        fileName: `${n.base.replace("#", "s")}${octave}`,
        key: KEYBOARD_MAP[i % KEYBOARD_MAP.length],
        solfege: n.solfege,
      });
    });
  }

  return notes;
}
