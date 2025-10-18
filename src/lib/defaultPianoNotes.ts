// lib/pianoNotes.ts
import { PIANO_CONFIG } from "./config";
import { generateNotes } from "./noteGenerator";

// Calculate the full range needed across all sound types
const allRanges = Object.values(PIANO_CONFIG.SAMPLE_RANGES);
const minOctave = Math.min(...allRanges.map(r => r.minOctave)); // 2
const maxOctave = Math.max(...allRanges.map(r => r.maxOctave)); // 6

export const notes = generateNotes(minOctave, maxOctave);