export type MidiEvent =
  | { type: "noteon"; note: number; velocity: number }
  | { type: "noteoff"; note: number }
  | { type: "sustain"; on: boolean };

const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;
const CONTROL_CHANGE = 0xb0;
const SUSTAIN_PEDAL = 64;
const MAX_DATA_VALUE = 127;

/** Returns null for messages the piano ignores, such as clock and sysex. */
export function parseMidiMessage(
  data: ArrayLike<number> | null | undefined,
): MidiEvent | null {
  if (!data || data.length < 3) return null;

  const command = data[0]! & 0xf0;
  const first = data[1]!;
  const second = data[2]!;

  switch (command) {
    case NOTE_ON:
      // Many devices send note-on with zero velocity instead of note-off.
      return second > 0
        ? { type: "noteon", note: first, velocity: second / MAX_DATA_VALUE }
        : { type: "noteoff", note: first };
    case NOTE_OFF:
      return { type: "noteoff", note: first };
    case CONTROL_CHANGE:
      return first === SUSTAIN_PEDAL
        ? { type: "sustain", on: second >= 64 }
        : null;
    default:
      return null;
  }
}
