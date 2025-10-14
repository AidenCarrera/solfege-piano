"use client";
import React from "react";
import type { Note } from "@/lib/notes";

type PianoKeyProps = {
  note: Note;
  activeNote: string | null;
  onMouseDown: (fileName: string, noteName: string) => void;
  onMouseEnter: (fileName: string, noteName: string) => void;
  getSharpKeyPosition: (note: Note) => number;
};

export default function PianoKey({
  note,
  activeNote,
  onMouseDown,
  onMouseEnter,
  getSharpKeyPosition,
}: PianoKeyProps) {
  // Base key style
  const baseStyle = note.isSharp
    ? "absolute bg-black w-10 h-40 -mx-5 z-10 rounded-b-md"
    : "bg-white w-16 h-60 border border-gray-800 rounded-b-md relative";

  // Active (pressed) state color
  const activeStyle = activeNote === note.name
    ? note.isSharp
      ? "bg-gray-600"
      : "bg-blue-200"
    : "";

  // Inline style for sharp key positioning
  const positionStyle = note.isSharp
    ? { left: `${getSharpKeyPosition(note)}rem` }
    : {};

  return (
    <button
      key={note.name}
      onMouseDown={() => onMouseDown(note.fileName, note.name)}
      onMouseEnter={() => onMouseEnter(note.fileName, note.name)}
      className={`${baseStyle} ${activeStyle} transition-colors duration-100`}
      style={positionStyle}
    >
      <span
        className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-mono ${
          note.isSharp ? "text-white" : "text-gray-400"
        }`}
      >
        {note.key.toUpperCase()}
      </span>
    </button>
  );
}
