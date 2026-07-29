import { describe, expect, it } from "vitest";
import { generateNotes } from "./noteGenerator";

describe("generateNotes", () => {
  it("creates a complete C3-to-C4 keyboard range", () => {
    const notes = generateNotes(3, 4);

    expect(notes).toHaveLength(13);
    expect(notes[0]).toMatchObject({ name: "C3", shortcut: "z" });
    expect(notes[1]).toMatchObject({
      name: "Cs3",
      shortcut: "s",
      isSharp: true,
    });
    expect(notes.at(-1)).toMatchObject({ name: "C4", shortcut: "q" });
  });

  it("maps the lower and higher keyboard rows across two octaves", () => {
    const notes = generateNotes(3, 5);
    const shortcuts = Object.fromEntries(
      notes
        .filter((note) => note.shortcut)
        .map((note) => [note.name, note.shortcut]),
    );

    expect(shortcuts).toEqual({
      C3: "z",
      Cs3: "s",
      D3: "x",
      Ds3: "d",
      E3: "c",
      F3: "v",
      Fs3: "g",
      G3: "b",
      Gs3: "h",
      A3: "n",
      As3: "j",
      B3: "m",
      C4: "q",
      Cs4: "2",
      D4: "w",
      Ds4: "3",
      E4: "e",
      F4: "r",
      Fs4: "5",
      G4: "t",
      Gs4: "6",
      A4: "y",
      As4: "7",
      B4: "u",
      C5: "i",
    });
  });

  it("adds right-side aliases without changing the displayed key labels", () => {
    const notes = generateNotes(3, 6);

    expect(notes.find((note) => note.name === "C4")).toMatchObject({
      shortcut: "q",
      shortcuts: ["q", ","],
    });
    expect(notes.find((note) => note.name === "Cs4")).toMatchObject({
      shortcut: "2",
      shortcuts: ["2", "l"],
    });
    expect(notes.find((note) => note.name === "F4")).toMatchObject({
      shortcut: "r",
      shortcuts: ["r", "'"],
    });
    expect(notes.find((note) => note.name === "C5")).toMatchObject({
      shortcut: "i",
      shortcuts: ["i"],
    });
    expect(notes.find((note) => note.name === "Cs5")).toMatchObject({
      shortcut: "",
      shortcuts: ["9"],
    });
    expect(notes.find((note) => note.name === "G5")).toMatchObject({
      shortcut: "",
      shortcuts: ["]"],
    });
  });

  it("does not assign computer keys outside the extended shortcut range", () => {
    const notes = generateNotes(2, 6);

    expect(notes.find((note) => note.name === "C2")?.shortcut).toBe("");
    expect(notes.find((note) => note.name === "C3")?.shortcut).toBe("z");
    expect(notes.find((note) => note.name === "C4")?.shortcut).toBe("q");
    expect(notes.find((note) => note.name === "C5")?.shortcut).toBe("i");
    expect(notes.find((note) => note.name === "Gs5")?.shortcuts).toEqual([]);
    expect(notes.find((note) => note.name === "C6")?.shortcuts).toEqual([]);
  });
});
