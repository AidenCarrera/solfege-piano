import { describe, expect, it } from "vitest";
import {
  SCALES,
  SCALE_IDS,
  analyzeHarmony,
  analyzeNote,
  chordSymbol,
  intervalName,
  isScaleId,
  keyName,
  pitchClassName,
  prefersFlats,
  syllableFor,
  tonicName,
  type ScaleId,
} from "./theory";

const C4 = 60;

function syllables(scale: ScaleId) {
  return Array.from({ length: 12 }, (_, degree) =>
    syllableFor(degree, scale, "Piano"),
  );
}

describe("syllableFor", () => {
  it("names chromatic notes in a major key by their common tonal names", () => {
    expect(syllables("major")).toEqual([
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
    ]);
  });

  it("raises every note of the chromatic scale, as it ascends", () => {
    expect(syllables("chromatic")).toEqual([
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
    ]);
  });

  it("names notes like chromatic when no scale is chosen", () => {
    expect(syllables("none")).toEqual(syllables("chromatic"));
  });

  it("uses do-based minor, lowering the 3rd, 6th, and 7th", () => {
    const minor = syllables("naturalMinor");
    expect([0, 2, 3, 5, 7, 8, 10].map((step) => minor[step])).toEqual([
      "Do",
      "Re",
      "Me",
      "Fa",
      "Sol",
      "Le",
      "Te",
    ]);
  });

  it("keeps the raised leading tone of harmonic minor", () => {
    expect(syllableFor(11, "harmonicMinor", "Piano")).toBe("Ti");
    expect(syllableFor(10, "harmonicMinor", "Piano")).toBe("Te");
  });

  it("names the lowered 7th of Mixolydian Te, not Li", () => {
    expect(syllableFor(10, "mixolydian", "Piano")).toBe("Te");
  });

  it("matches the recorded syllables whenever the Solfege voice plays", () => {
    expect(syllableFor(3, "naturalMinor", "Solfege")).toBe("Ri");
    expect(syllableFor(10, "blues", "Solfege")).toBe("Li");
  });
});

describe("keys and spelling", () => {
  it("uses the conventional name for each tonic", () => {
    expect(tonicName(1, "major")).toBe("D♭");
    expect(tonicName(1, "naturalMinor")).toBe("C♯");
    expect(tonicName(6, "major")).toBe("F♯");
    expect(tonicName(3, "naturalMinor")).toBe("E♭");
    expect(keyName(7, "harmonicMinor")).toBe("G harmonic minor");
    expect(keyName(0, "none")).toBe("C chromatic");
  });

  it("drops degree colors without a scale but keeps every note", () => {
    const context = { tonic: 0, soundType: "Piano" as const };
    expect(analyzeNote(C4, { ...context, scale: "major" }).colored).toBe(true);
    for (let midi = C4; midi < C4 + 12; midi++) {
      expect(analyzeNote(midi, { ...context, scale: "none" })).toMatchObject({
        colored: false,
        inScale: true,
      });
    }
  });

  it("prefers flats for keys whose signatures use them", () => {
    expect(prefersFlats(5, "major")).toBe(true);
    expect(prefersFlats(7, "major")).toBe(false);
    expect(prefersFlats(2, "naturalMinor")).toBe(true);
    expect(prefersFlats(9, "naturalMinor")).toBe(false);
    expect(pitchClassName(10, true)).toBe("B♭");
    expect(pitchClassName(10, false)).toBe("A♯");
  });

  it("makes the key's tonic Do and moves the syllables with it", () => {
    const g = {
      tonic: 7,
      scale: "major" as const,
      soundType: "Piano" as const,
    };
    expect(analyzeNote(67, g)).toMatchObject({
      syllable: "Do",
      isTonic: true,
      inScale: true,
      displayName: "G4",
    });
    expect(analyzeNote(66, g)).toMatchObject({
      syllable: "Ti",
      degreeLabel: "7",
      displayName: "F♯4",
    });
    expect(analyzeNote(65, g)).toMatchObject({
      syllable: "Te",
      inScale: false,
    });
  });

  it("spells notes by their syllable rather than the key signature", () => {
    const gMinor = {
      tonic: 7,
      scale: "harmonicMinor" as const,
      soundType: "Piano" as const,
    };
    // The leading tone of G minor is F♯, even though the key uses flats.
    expect(analyzeNote(66, gMinor).letter).toBe("F♯");
    expect(analyzeNote(70, gMinor).letter).toBe("B♭");
    expect(analyzeNote(63, gMinor).letter).toBe("E♭");
  });

  it("keeps the octave with the letter across the B-C boundary", () => {
    const cSharp = {
      tonic: 1,
      scale: "naturalMinor" as const,
      soundType: "Piano" as const,
    };
    // Ti in C♯ minor is B♯, which sounds as C.
    expect(analyzeNote(C4, cSharp)).toMatchObject({
      syllable: "Ti",
      displayName: "B♯3",
    });
  });

  it("only accepts known scales", () => {
    expect(SCALE_IDS).toContain("major");
    expect(isScaleId("dorian")).toBe(true);
    expect(isScaleId("toString")).toBe(false);
    expect(isScaleId(3)).toBe(false);
  });

  it("starts every scale on its tonic", () => {
    for (const id of SCALE_IDS) {
      expect(SCALES[id].steps[0]).toBe(0);
    }
  });
});

describe("analyzeHarmony", () => {
  it("ignores single notes", () => {
    expect(analyzeHarmony([])).toBeNull();
    expect(analyzeHarmony([C4])).toBeNull();
  });

  it("names simple, compound, and octave intervals", () => {
    expect(analyzeHarmony([C4, C4 + 7])).toMatchObject({
      kind: "interval",
      name: "Perfect 5th",
    });
    expect(analyzeHarmony([C4 + 4, C4])).toMatchObject({ name: "Major 3rd" });
    expect(analyzeHarmony([C4, C4 + 16])).toMatchObject({
      name: "Major 10th",
    });
    expect(analyzeHarmony([C4, C4 + 12])).toMatchObject({ name: "Octave" });
    expect(intervalName(31)).toBe("Perfect 5th (compound)");
  });

  it("reads a doubled dyad as its simple interval", () => {
    expect(analyzeHarmony([48, 55, 60])).toMatchObject({
      kind: "interval",
      name: "Perfect 5th",
    });
  });

  it("recognizes triads and sevenths in any voicing", () => {
    expect(analyzeHarmony([C4, 64, 67])).toMatchObject({
      kind: "chord",
      rootPc: 0,
      quality: "major",
      inversion: null,
    });
    expect(analyzeHarmony([57, 60, 64])).toMatchObject({
      rootPc: 9,
      quality: "minor",
    });
    expect(analyzeHarmony([55, 59, 62, 65])).toMatchObject({
      rootPc: 7,
      suffix: "7",
      quality: "dominant 7th",
    });
  });

  it("names inversions from the bass", () => {
    expect(analyzeHarmony([64, 67, 72])).toMatchObject({
      rootPc: 0,
      bassPc: 4,
      inversion: "1st inversion",
    });
    expect(analyzeHarmony([55, 60, 64])).toMatchObject({
      rootPc: 0,
      inversion: "2nd inversion",
    });
  });

  it("prefers the bass as root for ambiguous chords", () => {
    // A-C-E-G is A minor 7th, not C major 6th, when A is lowest.
    expect(analyzeHarmony([57, 60, 64, 67])).toMatchObject({
      rootPc: 9,
      suffix: "m7",
    });
    expect(analyzeHarmony([C4, 64, 67, 69])).toMatchObject({
      rootPc: 0,
      suffix: "6",
    });
  });

  it("calls anything else a cluster", () => {
    expect(analyzeHarmony([C4, 61, 62])).toEqual({ kind: "cluster" });
  });

  it("builds slash chord symbols from a speller", () => {
    const chord = analyzeHarmony([64, 67, 72]);
    if (chord?.kind !== "chord") throw new Error("expected a chord");
    expect(chordSymbol(chord, (pc) => pitchClassName(pc, false))).toBe("C/E");
  });
});
