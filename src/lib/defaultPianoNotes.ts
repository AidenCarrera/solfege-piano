// lib/pianoNotes.ts
import { PIANO_CONFIG } from "./config";
import { generateNotes } from "./noteGenerator";

export const notes = generateNotes(
  PIANO_CONFIG.DEFAULT_OCTAVE_RANGE[0],
  PIANO_CONFIG.DEFAULT_OCTAVE_RANGE[1]
);
