// lib/types/note.ts
export type Note = {
  name: string;      // e.g., "C4"
  isSharp: boolean;  // true if sharp
  fileName: string;  // e.g., "Cs4" (for audio file)
  key: string;       // keyboard mapping, e.g., "a"
  solfege: string;   // e.g., "Do"
};
