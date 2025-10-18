"use client";
import React from "react";
import type { Note } from "@/lib/notes";

type PianoKeyProps = {
  note: Note;
  activeNotes: Set<string>;
  onMouseDown: (fileName: string, noteName: string) => void;
  onMouseEnter: (fileName: string, noteName: string) => void;
  onMouseUp: (noteName: string) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchMove?: (e: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLButtonElement>) => void;
  getSharpKeyPosition: (note: Note) => number;
  showLabel?: boolean;
  showSolfege?: boolean;
};

function PianoKey({
  note,
  activeNotes,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  getSharpKeyPosition,
  showLabel = true,
  showSolfege = true,
}: PianoKeyProps) {
  const isActive = activeNotes.has(note.name);

  const base = note.isSharp
    ? "absolute w-10 h-40 -mx-5 z-10 rounded-b-md bg-black"
    : "relative w-16 h-60 rounded-b-md border border-gray-800 bg-white";

  const activeClass = isActive
    ? note.isSharp
      ? "ring-2 ring-blue-400/50 shadow-inner"
      : "bg-blue-100 shadow-inner shadow-blue-400"
    : "";

  const position = note.isSharp ? { left: `${getSharpKeyPosition(note)}rem` } : {};

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(note.fileName, note.name);
      }}
      onMouseEnter={() => onMouseEnter(note.fileName, note.name)}
      onMouseUp={() => onMouseUp(note.name)}
      className={`${base} ${activeClass} transition-all duration-100`}
      style={{
        ...position,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
      data-note-name={note.name}
      data-file-name={note.fileName}
      tabIndex={-1}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {showSolfege && (
        <span
          className={`absolute bottom-7 left-1/2 -translate-x-1/2 text-base font-semibold pointer-events-none ${
            note.isSharp ? "text-white" : "text-black"
          }`}
        >
          {note.solfege}
        </span>
      )}

      {showLabel && (
        <span
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-mono pointer-events-none ${
            note.isSharp ? "text-white/80" : "text-gray-500"
          }`}
        >
          {note.key.toUpperCase()}
        </span>
      )}
    </button>
  );
}

export default React.memo(PianoKey);
