export type Note = {
  /** Sample filename pitch, such as `Cs4`. */
  name: string;
  base: string;
  naturalName: string;
  octave: number;
  isSharp: boolean;
  toneName: string;
  shortcut: string;
  solfege: string;
  spokenName: string;
};

// Sample filenames encode sharps with "s".
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
