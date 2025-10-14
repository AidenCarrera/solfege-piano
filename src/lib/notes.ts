// lib/notes.ts
export type Note = {
  name: string;
  isSharp: boolean;
  fileName: string;
  key: string;
};

// Each note corresponds to a key and audio file
export const notes: Note[] = [
  { name: "C4", isSharp: false, fileName: "C4", key: "a" },
  { name: "C#4", isSharp: true, fileName: "Cs4", key: "w" },
  { name: "D4", isSharp: false, fileName: "D4", key: "s" },
  { name: "D#4", isSharp: true, fileName: "Ds4", key: "e" },
  { name: "E4", isSharp: false, fileName: "E4", key: "d" },
  { name: "F4", isSharp: false, fileName: "F4", key: "f" },
  { name: "F#4", isSharp: true, fileName: "Fs4", key: "t" },
  { name: "G4", isSharp: false, fileName: "G4", key: "g" },
  { name: "G#4", isSharp: true, fileName: "Gs4", key: "y" },
  { name: "A4", isSharp: false, fileName: "A4", key: "h" },
  { name: "A#4", isSharp: true, fileName: "As4", key: "u" },
  { name: "B4", isSharp: false, fileName: "B4", key: "j" },
  { name: "C5", isSharp: false, fileName: "C5", key: "k" },
];
