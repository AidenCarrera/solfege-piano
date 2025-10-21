"use client";
import React from "react";
import type { Note } from "@/lib/note";

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
  // Determine if this note is currently active
  const isActive = activeNotes.has(note.name);

  // ----- Base Styles -----
  // White key base styling
  const baseWhite = "relative w-16 h-60 rounded-b-md border border-gray-800 bg-white";
  // Black key base styling
  const baseBlack = "absolute w-10 h-40 -mx-5 z-10 rounded-b-md bg-black";

  const base = note.isSharp ? baseBlack : baseWhite;

  // ----- Active State Styling -----
  // Applies color and shadow effects when the key is active
  const activeClass = isActive
    ? note.isSharp
      ? "ring-2 ring-blue-400/50 shadow-inner"
      : "bg-blue-100 shadow-inner shadow-blue-400"
    : "";

  // ----- Black Key Positioning -----
  // Black keys are positioned dynamically relative to white keys
  const position = note.isSharp ? { left: `${getSharpKeyPosition(note)}rem` } : {};

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent text selection on drag
        onMouseDown(note.fileName, note.name);
      }}
      onMouseEnter={() => onMouseEnter(note.fileName, note.name)}
      onMouseUp={() => onMouseUp(note.name)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`${base} ${activeClass} transition-colors transition-shadow duration-500 ease-in-out`}
      style={{
        ...position,
        touchAction: "none",       // Prevent default scrolling on touch
        userSelect: "none",        // Disable text selection
        WebkitUserSelect: "none",  // Safari-specific
        WebkitTouchCallout: "none" // Disable long-press menu
      }}
      data-note-name={note.name}
      data-file-name={note.fileName}
      tabIndex={-1} // Remove from keyboard tab order
    >
      {/* ----- Solfege Label ----- */}
      {showSolfege && (
        <span
          className={`absolute bottom-7 left-1/2 -translate-x-1/2 text-base font-semibold pointer-events-none ${
            note.isSharp ? "text-white" : "text-black"
          }`}
        >
          {note.solfege}
        </span>
      )}

      {/* ----- Key Label (MIDI / Keyboard) ----- */}
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

// Memoized to prevent unnecessary re-renders when props do not change
export default React.memo(PianoKey);
