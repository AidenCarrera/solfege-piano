// lib/note.ts
/**
 * Consolidated note definitions and types
 */

/* ----- TYPE DEFINITIONS ----- */
export type Note = {
  name: string;      // e.g., "C4"
  isSharp: boolean;  // true if sharp
  fileName: string;  // e.g., "Cs4" (for audio file)
  key: string;       // keyboard mapping, e.g., "a"
  solfege: string;   // e.g., "Do"
};

/* ----- BASE NOTE DEFINITIONS ----- */
/**
 * The 12 chromatic notes in an octave with their properties
 */
export const BASE_NOTES = [
  { base: "C",  isSharp: false, solfege: "Do" },
  { base: "Cs", isSharp: true,  solfege: "Di" },
  { base: "D",  isSharp: false, solfege: "Re" },
  { base: "Ds", isSharp: true,  solfege: "Ri" },
  { base: "E",  isSharp: false, solfege: "Mi" },
  { base: "F",  isSharp: false, solfege: "Fa" },
  { base: "Fs", isSharp: true,  solfege: "Fi" },
  { base: "G",  isSharp: false, solfege: "Sol" },
  { base: "Gs", isSharp: true,  solfege: "Si" },
  { base: "A",  isSharp: false, solfege: "La" },
  { base: "As", isSharp: true,  solfege: "Li" },
  { base: "B",  isSharp: false, solfege: "Ti" },
] as const;

/* ----- KEYBOARD MAPPING ----- */
/**
 * Maps computer keyboard keys to piano notes for C4-C5 range
 * Order matches BASE_NOTES chromatic sequence
 */
export const KEYBOARD_MAP_C4_C5 = [
  "a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j", "k"
] as const;