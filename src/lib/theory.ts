import type { SoundType } from "./config";

export type ScaleFamily = "major" | "minor";

interface ScaleDefinition {
  label: string;
  family: ScaleFamily;
  /** Semitones above the tonic. */
  steps: readonly number[];
}

// Declaration order controls the scale picker.
export const SCALES = {
  // Plays like chromatic, but without degree colors or scale dots.
  none: {
    label: "None",
    family: "major",
    steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  chromatic: {
    label: "Chromatic",
    family: "major",
    steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  major: { label: "Major", family: "major", steps: [0, 2, 4, 5, 7, 9, 11] },
  naturalMinor: {
    label: "Natural minor",
    family: "minor",
    steps: [0, 2, 3, 5, 7, 8, 10],
  },
  harmonicMinor: {
    label: "Harmonic minor",
    family: "minor",
    steps: [0, 2, 3, 5, 7, 8, 11],
  },
  melodicMinor: {
    label: "Melodic minor",
    family: "minor",
    steps: [0, 2, 3, 5, 7, 9, 11],
  },
  dorian: { label: "Dorian", family: "minor", steps: [0, 2, 3, 5, 7, 9, 10] },
  mixolydian: {
    label: "Mixolydian",
    family: "major",
    steps: [0, 2, 4, 5, 7, 9, 10],
  },
  majorPentatonic: {
    label: "Major pentatonic",
    family: "major",
    steps: [0, 2, 4, 7, 9],
  },
  minorPentatonic: {
    label: "Minor pentatonic",
    family: "minor",
    steps: [0, 3, 5, 7, 10],
  },
  blues: { label: "Blues", family: "minor", steps: [0, 3, 5, 6, 7, 10] },
} as const satisfies Record<string, ScaleDefinition>;

export type ScaleId = keyof typeof SCALES;
export const SCALE_IDS = Object.keys(SCALES) as ScaleId[];

export function isScaleId(value: unknown): value is ScaleId {
  return typeof value === "string" && Object.hasOwn(SCALES, value);
}

export const PITCH_CLASSES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export function mod12(value: number): number {
  return ((value % 12) + 12) % 12;
}

// Ascending chromatic syllables. These match the recorded Solfege samples.
const RAISED_SYLLABLES = [
  "Do",
  "Di",
  "Re",
  "Ri",
  "Mi",
  "Fa",
  "Fi",
  "Sol",
  "Si",
  "La",
  "Li",
  "Ti",
] as const;

// Chromatic notes in a major key take their most common tonal names, so the
// flat 7th is Te rather than Li.
const MAJOR_CHROMATIC_SYLLABLES = [
  "Do",
  "Di",
  "Re",
  "Me",
  "Mi",
  "Fa",
  "Fi",
  "Sol",
  "Si",
  "La",
  "Te",
  "Ti",
] as const;

// Do-based minor names its lowered degrees Ra, Me, Le, and Te.
const MINOR_CHROMATIC_SYLLABLES = [
  "Do",
  "Ra",
  "Re",
  "Me",
  "Mi",
  "Fa",
  "Fi",
  "Sol",
  "Le",
  "La",
  "Te",
  "Ti",
] as const;

// Altered degrees that belong to a scale use their conventional in-scale name.
const IN_SCALE_ALTERED: Partial<Record<number, string>> = {
  1: "Ra",
  3: "Me",
  6: "Fi",
  8: "Le",
  10: "Te",
};

const DEGREE_LABELS: Record<string, string> = {
  Do: "1",
  Di: "♯1",
  Ra: "♭2",
  Re: "2",
  Ri: "♯2",
  Me: "♭3",
  Mi: "3",
  Fa: "4",
  Fi: "♯4",
  Sol: "5",
  Si: "♯5",
  Le: "♭6",
  La: "6",
  Li: "♯6",
  Te: "♭7",
  Ti: "7",
};

/**
 * Movable-do syllable for a degree (semitones above the tonic).
 * The Solfege voice always uses the recorded syllables so labels match audio.
 */
export function syllableFor(
  degree: number,
  scale: ScaleId,
  soundType: SoundType,
): string {
  const step = mod12(degree);
  if (soundType === "Solfege" || scale === "chromatic" || scale === "none") {
    return RAISED_SYLLABLES[step]!;
  }

  const definition: ScaleDefinition = SCALES[scale];
  if (definition.steps.includes(step)) {
    return IN_SCALE_ALTERED[step] ?? RAISED_SYLLABLES[step]!;
  }

  return (
    definition.family === "minor"
      ? MINOR_CHROMATIC_SYLLABLES
      : MAJOR_CHROMATIC_SYLLABLES
  )[step]!;
}

export function degreeLabel(syllable: string): string {
  return DEGREE_LABELS[syllable] ?? "";
}

// Each degree keeps one hue in every key; altered degrees sit between neighbors.
const DEGREE_HUES = [25, 42, 62, 80, 98, 145, 172, 200, 232, 265, 292, 320];

export function degreeHue(degree: number): number {
  return DEGREE_HUES[mod12(degree)]!;
}

export function degreeColor(degree: number): string {
  return `oklch(0.76 0.15 ${degreeHue(degree)})`;
}

export function isInScale(degree: number, scale: ScaleId): boolean {
  return (SCALES[scale].steps as readonly number[]).includes(mod12(degree));
}

const SHARP_NAMES = [
  "C",
  "C♯",
  "D",
  "D♯",
  "E",
  "F",
  "F♯",
  "G",
  "G♯",
  "A",
  "A♯",
  "B",
] as const;

const FLAT_NAMES = [
  "C",
  "D♭",
  "D",
  "E♭",
  "E",
  "F",
  "G♭",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
] as const;

// Tonics whose key signatures use flats: F, B♭, E♭, A♭, D♭ major and
// D, G, C, F, B♭, E♭ minor.
const FLAT_MAJOR_TONICS = new Set([1, 3, 5, 8, 10]);
const FLAT_MINOR_TONICS = new Set([0, 2, 3, 5, 7, 10]);

export function prefersFlats(tonic: number, scale: ScaleId): boolean {
  const tonics =
    SCALES[scale].family === "minor" ? FLAT_MINOR_TONICS : FLAT_MAJOR_TONICS;
  return tonics.has(mod12(tonic));
}

export function pitchClassName(pitchClass: number, flats: boolean): string {
  return (flats ? FLAT_NAMES : SHARP_NAMES)[mod12(pitchClass)]!;
}

/** Conventional tonic spelling, such as D♭ major but C♯ minor. */
export function tonicName(tonic: number, scale: ScaleId): string {
  return pitchClassName(tonic, prefersFlats(tonic, scale));
}

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11] as const;
const ACCIDENTALS: Record<number, string> = {
  [-2]: "𝄫",
  [-1]: "♭",
  0: "",
  1: "♯",
  2: "𝄪",
};

// Letter steps above Do, so Fi is a raised 4th and Te a lowered 7th.
const SYLLABLE_STEPS: Record<string, number> = {
  Do: 0,
  Di: 0,
  Ra: 1,
  Re: 1,
  Ri: 1,
  Me: 2,
  Mi: 2,
  Fa: 3,
  Fi: 3,
  Se: 4,
  Sol: 4,
  Si: 4,
  Le: 5,
  La: 5,
  Li: 5,
  Te: 6,
  Ti: 6,
};

export interface SpelledNote {
  /** Letter and accidental, such as F♯. */
  letter: string;
  /** Scientific pitch name, such as B♯3 for the pitch of C4. */
  name: string;
}

/**
 * Spells a note from its syllable, so the leading tone of G minor is F♯
 * rather than G♭ even though the key signature uses flats.
 */
export function spellNote(
  midi: number,
  tonic: number,
  scale: ScaleId,
  syllable: string,
): SpelledNote {
  const tonicLetter = LETTERS.indexOf(
    tonicName(tonic, scale)[0] as (typeof LETTERS)[number],
  );
  const step = SYLLABLE_STEPS[syllable];
  if (tonicLetter >= 0 && step !== undefined) {
    const letterIndex = (tonicLetter + step) % LETTERS.length;
    let offset = mod12(midi - LETTER_PITCH_CLASSES[letterIndex]!);
    if (offset > 6) offset -= 12;
    const accidental = ACCIDENTALS[offset];
    if (accidental !== undefined) {
      const letter = `${LETTERS[letterIndex]}${accidental}`;
      // The octave belongs to the letter, so B♯3 sounds like C4.
      const octave = Math.floor((midi - offset) / 12) - 1;
      return { letter, name: `${letter}${octave}` };
    }
  }

  const letter = pitchClassName(midi, prefersFlats(tonic, scale));
  return { letter, name: `${letter}${Math.floor(midi / 12) - 1}` };
}

export function keyName(tonic: number, scale: ScaleId): string {
  // Without a scale every note is available, as in chromatic.
  const label = SCALES[scale === "none" ? "chromatic" : scale].label;
  return `${tonicName(tonic, scale)} ${label.toLowerCase()}`;
}

const INTERVAL_NAMES = [
  "Unison",
  "Minor 2nd",
  "Major 2nd",
  "Minor 3rd",
  "Major 3rd",
  "Perfect 4th",
  "Tritone",
  "Perfect 5th",
  "Minor 6th",
  "Major 6th",
  "Minor 7th",
  "Major 7th",
  "Octave",
  "Minor 9th",
  "Major 9th",
  "Minor 10th",
  "Major 10th",
  "Perfect 11th",
  "Augmented 11th",
  "Perfect 12th",
  "Minor 13th",
  "Major 13th",
  "Minor 14th",
  "Major 14th",
  "Two octaves",
] as const;

export function intervalName(semitones: number): string {
  const distance = Math.abs(semitones);
  return (
    INTERVAL_NAMES[distance] ?? `${INTERVAL_NAMES[distance % 12]} (compound)`
  );
}

interface ChordTemplate {
  suffix: string;
  quality: string;
  steps: readonly number[];
}

const CHORDS: readonly ChordTemplate[] = [
  { suffix: "", quality: "major", steps: [0, 4, 7] },
  { suffix: "m", quality: "minor", steps: [0, 3, 7] },
  { suffix: "dim", quality: "diminished", steps: [0, 3, 6] },
  { suffix: "aug", quality: "augmented", steps: [0, 4, 8] },
  { suffix: "sus2", quality: "suspended 2nd", steps: [0, 2, 7] },
  { suffix: "sus4", quality: "suspended 4th", steps: [0, 5, 7] },
  { suffix: "7", quality: "dominant 7th", steps: [0, 4, 7, 10] },
  { suffix: "maj7", quality: "major 7th", steps: [0, 4, 7, 11] },
  { suffix: "m7", quality: "minor 7th", steps: [0, 3, 7, 10] },
  { suffix: "m(maj7)", quality: "minor-major 7th", steps: [0, 3, 7, 11] },
  { suffix: "m7♭5", quality: "half-diminished 7th", steps: [0, 3, 6, 10] },
  { suffix: "dim7", quality: "diminished 7th", steps: [0, 3, 6, 9] },
  { suffix: "6", quality: "major 6th", steps: [0, 4, 7, 9] },
  { suffix: "m6", quality: "minor 6th", steps: [0, 3, 7, 9] },
  { suffix: "add9", quality: "add 9", steps: [0, 2, 4, 7] },
];

const INVERSIONS = [null, "1st inversion", "2nd inversion", "3rd inversion"];

export type Harmony =
  | { kind: "interval"; semitones: number; name: string }
  | {
      kind: "chord";
      rootPc: number;
      bassPc: number;
      suffix: string;
      quality: string;
      inversion: string | null;
    }
  | { kind: "cluster" };

function sameSteps(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((step, index) => step === b[index]);
}

/** Names the interval or chord formed by two or more MIDI notes. */
export function analyzeHarmony(midiNotes: readonly number[]): Harmony | null {
  if (midiNotes.length < 2) return null;

  const sorted = [...midiNotes].sort((a, b) => a - b);
  const bass = sorted[0]!;
  const top = sorted.at(-1)!;
  const bassPc = mod12(bass);
  const pitchClasses = [...new Set(sorted.map(mod12))];

  if (pitchClasses.length === 1) {
    return {
      kind: "interval",
      semitones: top - bass,
      name: intervalName(top - bass),
    };
  }

  if (pitchClasses.length === 2) {
    // A doubled dyad reads as its simple interval above the bass.
    const other = pitchClasses.find((pc) => pc !== bassPc)!;
    const semitones = sorted.length === 2 ? top - bass : mod12(other - bassPc);
    return { kind: "interval", semitones, name: intervalName(semitones) };
  }

  // Try the bass first so symmetric and ambiguous chords favor root position.
  const roots = [bassPc, ...pitchClasses.filter((pc) => pc !== bassPc)];
  for (const root of roots) {
    const steps = pitchClasses
      .map((pc) => mod12(pc - root))
      .sort((a, b) => a - b);
    const chord = CHORDS.find((template) => sameSteps(template.steps, steps));
    if (!chord) continue;

    const bassStep = chord.steps.indexOf(mod12(bassPc - root));
    return {
      kind: "chord",
      rootPc: root,
      bassPc,
      suffix: chord.suffix,
      quality: chord.quality,
      inversion: INVERSIONS[bassStep] ?? null,
    };
  }

  return { kind: "cluster" };
}

export function chordSymbol(
  harmony: Extract<Harmony, { kind: "chord" }>,
  spell: (pitchClass: number) => string,
): string {
  const slash =
    harmony.bassPc === harmony.rootPc ? "" : `/${spell(harmony.bassPc)}`;
  return `${spell(harmony.rootPc)}${harmony.suffix}${slash}`;
}

export interface NoteTheory {
  degree: number;
  syllable: string;
  degreeLabel: string;
  hue: number;
  /** False without a scale, so nothing is tinted by degree. */
  colored: boolean;
  inScale: boolean;
  isTonic: boolean;
  /** Key-aware name, such as B♭3 in F major. */
  displayName: string;
  /** Letter name without the octave. */
  letter: string;
}

export interface TheoryContext {
  tonic: number;
  scale: ScaleId;
  soundType: SoundType;
}

export function analyzeNote(
  midi: number,
  { tonic, scale, soundType }: TheoryContext,
): NoteTheory {
  const degree = mod12(midi - tonic);
  const syllable = syllableFor(degree, scale, soundType);
  const spelled = spellNote(midi, tonic, scale, syllable);
  return {
    degree,
    syllable,
    degreeLabel: degreeLabel(syllable),
    hue: degreeHue(degree),
    colored: scale !== "none",
    inScale: isInScale(degree, scale),
    isTonic: degree === 0,
    displayName: spelled.name,
    letter: spelled.letter,
  };
}
