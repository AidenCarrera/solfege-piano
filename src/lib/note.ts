export type Note = {
  name: string;
  isSharp: boolean;
  fileName: string;
  key: string;
  solfege: string;
};

/**
 * Converts a sample-style name (`"Cs4"`) to the scientific pitch notation
 * Tone.js expects (`"C#4"`).
 */
export function toToneNote(name: string): string {
  return name.replace("s", "#");
}

/** Chromatic note metadata; `s` encodes sharps in sample filenames. */
export const BASE_NOTES = [
  { base: "C", isSharp: false, solfege: "Do" },
  { base: "Cs", isSharp: true, solfege: "Di" },
  { base: "D", isSharp: false, solfege: "Re" },
  { base: "Ds", isSharp: true, solfege: "Ri" },
  { base: "E", isSharp: false, solfege: "Mi" },
  { base: "F", isSharp: false, solfege: "Fa" },
  { base: "Fs", isSharp: true, solfege: "Fi" },
  { base: "G", isSharp: false, solfege: "Sol" },
  { base: "Gs", isSharp: true, solfege: "Si" },
  { base: "A", isSharp: false, solfege: "La" },
  { base: "As", isSharp: true, solfege: "Li" },
  { base: "B", isSharp: false, solfege: "Ti" },
] as const;

/** Keyboard shortcuts in chromatic order from C3 through C4. */
export const KEYBOARD_MAP_C3_C4 = [
  "a",
  "w",
  "s",
  "e",
  "d",
  "f",
  "t",
  "g",
  "y",
  "h",
  "u",
  "j",
  "k",
] as const;
