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

function PianoKey({
  note,
  activeNote,
  onMouseDown,
  onMouseEnter,
  getSharpKeyPosition,
}: PianoKeyProps) {
  const isActive = activeNote === note.name;

  const base = note.isSharp
    ? "absolute w-10 h-40 -mx-5 z-10 rounded-b-md bg-black"
    : "relative w-16 h-60 rounded-b-md border border-gray-800 bg-white";

  const active = isActive
    ? note.isSharp
      ? "ring-2 ring-blue-400/50 shadow-inner"
      : "bg-blue-100 shadow-inner shadow-blue-400"
    : "";

  const position = note.isSharp ? { left: `${getSharpKeyPosition(note)}rem` } : {};

  return (
    <button
      onMouseDown={e => {
        e.preventDefault(); // prevents focus outline
        onMouseDown(note.fileName, note.name);
      }}
      onMouseEnter={() => onMouseEnter(note.fileName, note.name)}
      className={`${base} ${active} transition-all duration-100`}
      style={position}
      tabIndex={-1}
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

// ✅ Prevent unnecessary re-renders
export default React.memo(PianoKey);
