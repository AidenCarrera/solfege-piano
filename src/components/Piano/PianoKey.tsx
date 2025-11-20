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
  const baseWhite =
    "relative w-16 h-64 rounded-b-lg border border-gray-300/20 bg-gradient-to-b from-white to-gray-100 shadow-[0_2px_5px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-0.5";
  // Black key base styling
  const baseBlack =
    "absolute w-10 h-40 -mx-5 z-20 rounded-b-lg bg-gradient-to-b from-gray-900 to-black shadow-[0_4px_8px_rgba(0,0,0,0.5)] active:shadow-sm active:translate-y-0.5";

  const base = note.isSharp ? baseBlack : baseWhite;

  // ----- Active State Styling -----
  // Applies color and shadow effects when the key is active
  // Applies color and shadow effects when the key is active
  const activeClass = isActive
    ? note.isSharp
      ? "from-gray-800 to-black ring-2 ring-blue-500/50 !shadow-none !translate-y-0.5"
      : "!bg-blue-50 !from-blue-100 !to-white !shadow-none !translate-y-0.5 ring-2 ring-blue-400/30"
    : "";

  // ----- Black Key Positioning -----
  // Black keys are positioned dynamically relative to white keys
  const position = note.isSharp
    ? { left: `${getSharpKeyPosition(note)}rem` }
    : {};

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
      className={`${base} ${activeClass} transition-all duration-100 ease-out`}
      style={{
        ...position,
        touchAction: "none", // Prevent default scrolling on touch
        userSelect: "none", // Disable text selection
        WebkitUserSelect: "none", // Safari-specific
        WebkitTouchCallout: "none", // Disable long-press menu
      }}
      data-note-name={note.name}
      data-file-name={note.fileName}
      tabIndex={-1} // Remove from keyboard tab order
    >
      {/* ----- Solfege Label ----- */}
      {showSolfege && (
        <span
          className={`absolute bottom-7 left-1/2 -translate-x-1/2 text-base font-semibold pointer-events-none ${
            note.isSharp ? "text-white" : "text-gray-800"
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
