/**
 * A single key on the keyboard.
 *
 * Every field the UI and audio layers need is derived once by `generateNotes`,
 * so nothing downstream has to parse the note's name back apart.
 */
export type Note = {
  /** Sample-style identifier, e.g. `"Cs4"`. Unique across the keyboard. */
  name: string;
  /** Letter with its accidental, e.g. `"Cs"`. */
  base: string;
  /** The natural this note sits above, e.g. `"C4"` for `"Cs4"`. */
  naturalName: string;
  octave: number;
  isSharp: boolean;
  /** Scientific pitch notation for Tone.js, e.g. `"C#4"`. */
  toneName: string;
  /** Computer-keyboard shortcut, or `""` when the note has none. */
  shortcut: string;
  solfege: string;
  /** Spoken form for assistive technology, e.g. `"C sharp 4"`. */
  spokenName: string;
};

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
