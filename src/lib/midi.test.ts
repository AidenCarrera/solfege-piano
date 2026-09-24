import { describe, expect, it } from "vitest";
import { parseMidiMessage } from "./midi";

describe("parseMidiMessage", () => {
  it("reads note-on on any channel with a normalized velocity", () => {
    expect(parseMidiMessage([0x90, 60, 127])).toEqual({
      type: "noteon",
      note: 60,
      velocity: 1,
    });
    expect(parseMidiMessage(new Uint8Array([0x93, 64, 0x40]))).toMatchObject({
      type: "noteon",
      note: 64,
    });
  });

  it("treats zero-velocity note-on as note-off", () => {
    expect(parseMidiMessage([0x90, 60, 0])).toEqual({
      type: "noteoff",
      note: 60,
    });
    expect(parseMidiMessage([0x80, 62, 30])).toEqual({
      type: "noteoff",
      note: 62,
    });
  });

  it("maps the sustain pedal controller to on and off", () => {
    expect(parseMidiMessage([0xb0, 64, 127])).toEqual({
      type: "sustain",
      on: true,
    });
    expect(parseMidiMessage([0xb0, 64, 10])).toEqual({
      type: "sustain",
      on: false,
    });
  });

  it("ignores everything else", () => {
    expect(parseMidiMessage([0xb0, 7, 100])).toBeNull();
    expect(parseMidiMessage([0xf8])).toBeNull();
    expect(parseMidiMessage([0xe0, 0, 64])).toBeNull();
    expect(parseMidiMessage(null)).toBeNull();
  });
});
