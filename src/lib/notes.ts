// lib/notes.ts
import { PIANO_CONFIG } from "./config";

export type Note = {
  name: string;
  isSharp: boolean;
  fileName: string;
  key: string;
  solfege: string;
};

const BASE_NOTES = [
  { base: "C",  isSharp: false, solfege: "Do" },
  { base: "C#", isSharp: true,  solfege: "Di" },
  { base: "D",  isSharp: false, solfege: "Re" },
  { base: "D#", isSharp: true,  solfege: "Ri" },
  { base: "E",  isSharp: false, solfege: "Mi" },
  { base: "F",  isSharp: false, solfege: "Fa" },
  { base: "F#", isSharp: true,  solfege: "Fi" },
  { base: "G",  isSharp: false, solfege: "Sol" },
  { base: "G#", isSharp: true,  solfege: "Si" },
  { base: "A",  isSharp: false, solfege: "La" },
  { base: "A#", isSharp: true,  solfege: "Li" },
  { base: "B",  isSharp: false, solfege: "Ti" },
];

// Map of physical keyboard keys (looped or reused per octave)
const KEYBOARD_MAP = ["a","w","s","e","d","f","t","g","y","h","u","j","k"];

export const notes: Note[] = [];

const [startOctave, endOctave] = PIANO_CONFIG.DEFAULT_OCTAVE_RANGE;

for (let octave = startOctave; octave <= endOctave; octave++) {
  BASE_NOTES.forEach((n, i) => {
    // Include only C5 if this is the final octave
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

