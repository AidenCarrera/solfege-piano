import {
  Note,
  BASE_NOTES,
  HIGHER_KEYBOARD_MAP,
  LOWER_KEYBOARD_MAP,
} from "./note";

const LOWER_SHORTCUT_START_OCTAVE = 3;
const HIGHER_SHORTCUT_START_OCTAVE = 4;

function shortcutAt(
  keyboardMap: readonly string[],
  startOctave: number,
  octave: number,
  noteIndex: number,
): string {
  const shortcutIndex = (octave - startOctave) * BASE_NOTES.length + noteIndex;
  return keyboardMap[shortcutIndex] ?? "";
}

function keyboardShortcuts(octave: number, noteIndex: number): string[] {
  return [
    shortcutAt(
      LOWER_KEYBOARD_MAP,
      LOWER_SHORTCUT_START_OCTAVE,
      octave,
      noteIndex,
    ),
    shortcutAt(
      HIGHER_KEYBOARD_MAP,
      HIGHER_SHORTCUT_START_OCTAVE,
      octave,
      noteIndex,
    ),
  ].filter(Boolean);
}

function displayedShortcut(octave: number, noteIndex: number): string {
  if (octave === LOWER_SHORTCUT_START_OCTAVE) {
    return LOWER_KEYBOARD_MAP[noteIndex] ?? "";
  }

  if (octave === HIGHER_SHORTCUT_START_OCTAVE) {
    return HIGHER_KEYBOARD_MAP[noteIndex] ?? "";
  }

  // The two-octave keyboard closes on C5.
  if (octave === HIGHER_SHORTCUT_START_OCTAVE + 1 && noteIndex === 0) {
    return "i";
  }

  return "";
}

export function generateNotes(startOctave: number, endOctave: number): Note[] {
  const notes: Note[] = [];

  for (let octave = startOctave; octave <= endOctave; octave++) {
    BASE_NOTES.forEach((baseNote, index) => {
      if (octave === endOctave && baseNote.base !== "C") return;

      const shortcut = displayedShortcut(octave, index);
      const mappedShortcuts = keyboardShortcuts(octave, index);
      const shortcuts = shortcut
        ? [shortcut, ...mappedShortcuts.filter((mapped) => mapped !== shortcut)]
        : mappedShortcuts;

      const natural = baseNote.base.replace("s", "");

      notes.push({
        name: `${baseNote.base}${octave}`,
        base: baseNote.base,
        naturalName: `${natural}${octave}`,
        octave,
        isSharp: baseNote.isSharp,
        toneName: `${baseNote.isSharp ? `${natural}#` : natural}${octave}`,
        shortcut,
        shortcuts,
        solfege: baseNote.solfege,
        spokenName: `${natural}${baseNote.isSharp ? " sharp" : ""} ${octave}`,
      });
    });
  }

  return notes;
}
