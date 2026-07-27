import { describe, expect, it } from "vitest";
import { generateNotes } from "./noteGenerator";

describe("generateNotes", () => {
  it("creates a complete C3-to-C4 keyboard range", () => {
    const notes = generateNotes(3, 4);

    expect(notes).toHaveLength(13);
    expect(notes[0]).toMatchObject({ name: "C3", shortcut: "a" });
    expect(notes[1]).toMatchObject({
      name: "Cs3",
      shortcut: "w",
      isSharp: true,
    });
    expect(notes.at(-1)).toMatchObject({ name: "C4", shortcut: "k" });
  });

  it("does not assign computer keys outside the primary octave", () => {
    const notes = generateNotes(2, 5);

    expect(notes.find((note) => note.name === "C2")?.shortcut).toBe("");
    expect(notes.find((note) => note.name === "C3")?.shortcut).toBe("a");
    expect(notes.find((note) => note.name === "C5")?.shortcut).toBe("");
  });
});
