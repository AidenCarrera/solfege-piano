// lib/notes.ts
export type Note = {
  name: string;
  isSharp: boolean;
  fileName: string;
  key: string;
  solfege: string;
};

export const notes: Note[] = [
  { name: "C4",  isSharp: false, fileName: "C4",  key: "a", solfege: "Do" },
  { name: "C#4", isSharp: true,  fileName: "Cs4", key: "w", solfege: "Di" },
  { name: "D4",  isSharp: false, fileName: "D4",  key: "s", solfege: "Re" },
  { name: "D#4", isSharp: true,  fileName: "Ds4", key: "e", solfege: "Ri" },
  { name: "E4",  isSharp: false, fileName: "E4",  key: "d", solfege: "Mi" },
  { name: "F4",  isSharp: false, fileName: "F4",  key: "f", solfege: "Fa" },
  { name: "F#4", isSharp: true,  fileName: "Fs4", key: "t", solfege: "Fi" },
  { name: "G4",  isSharp: false, fileName: "G4",  key: "g", solfege: "Sol" },
  { name: "G#4", isSharp: true,  fileName: "Gs4", key: "y", solfege: "Si" },
  { name: "A4",  isSharp: false, fileName: "A4",  key: "h", solfege: "La" },
  { name: "A#4", isSharp: true,  fileName: "As4", key: "u", solfege: "Li" },
  { name: "B4",  isSharp: false, fileName: "B4",  key: "j", solfege: "Ti" },
  { name: "C5",  isSharp: false, fileName: "C5",  key: "k", solfege: "Do" },
];
