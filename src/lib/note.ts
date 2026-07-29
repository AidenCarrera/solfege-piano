export type Note = {
  /** Sample filename pitch, such as `Cs4`. */
  name: string;
  base: string;
  naturalName: string;
  octave: number;
  isSharp: boolean;
  toneName: string;
  /** Shortcut shown on the piano key. */
  shortcut: string;
  /** Every computer-keyboard shortcut that can play this note. */
  shortcuts: string[];
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

export const LOWER_KEYBOARD_MAP = [
  "z",
  "s",
  "x",
  "d",
  "c",
  "v",
  "g",
  "b",
  "h",
  "n",
  "j",
  "m",
  ",",
  "l",
  ".",
  ";",
  "/",
  "'",
] as const;

export const HIGHER_KEYBOARD_MAP = [
  "q",
  "2",
  "w",
  "3",
  "e",
  "r",
  "5",
  "t",
  "6",
  "y",
  "7",
  "u",
  "i",
  "9",
  "o",
  "0",
  "p",
  "[",
  "=",
  "]",
] as const;
