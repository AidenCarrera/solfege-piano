"use client";
import React from "react";
import type { Note } from "@/lib/notes";

/**
 * PianoKey Component
 *
 * Renders an individual piano key (white or black).
 * Handles active visual states and interaction events.
 */
type PianoKeyProps = {
  note: Note;
  activeNote: string | null;
  onMouseDown: (fileName: string, noteName: string) => void;
  onMouseEnter: (fileName: string, noteName: string) => void;
  getSharpKeyPosition: (note: Note) => number;
  showLabel?: boolean; // Optional: controls key label visibility
};

function PianoKey({
  note,
  activeNote,
  onMouseDown,
  onMouseEnter,
  getSharpKeyPosition,
  showLabel = true,
}: PianoKeyProps) {
  /* ----- Determine if this key is currently active ----- */
  const isActive = activeNote === note.name;

  /* ----- Base styling depending on key type ----- */
  const base = note.isSharp
    ? "absolute w-10 h-40 -mx-5 z-10 rounded-b-md bg-black"
    : "relative w-16 h-60 rounded-b-md border border-gray-800 bg-white";

  /* ----- Visual style for active (pressed) key ----- */
  const active = isActive
    ? note.isSharp
      ? "ring-2 ring-blue-400/50 shadow-inner"
      : "bg-blue-100 shadow-inner shadow-blue-400"
    : "";

  /* ----- Positioning for black (sharp) keys ----- */
  const position = note.isSharp ? { left: `${getSharpKeyPosition(note)}rem` } : {};

  /* ----- Render key element ----- */
  return (
    <button
      onMouseDown={e => {
        e.preventDefault(); // Prevent focus outline on click
        onMouseDown(note.fileName, note.name);
      }}
      onMouseEnter={() => onMouseEnter(note.fileName, note.name)}
      className={`${base} ${active} transition-all duration-100`}
      style={position}
      tabIndex={-1}
    >
      {/* ----- Optional Key Label (e.g., "A", "C#", etc.) ----- */}
      {showLabel && (
        <span
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-mono ${
            note.isSharp ? "text-white" : "text-gray-400"
          }`}
        >
          {note.key.toUpperCase()}
        </span>
      )}
    </button>
  );
}

/* ----- Memoized to prevent unnecessary re-renders ----- */
export default React.memo(PianoKey);
