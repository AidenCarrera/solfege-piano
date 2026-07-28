"use client";
import React from "react";
import type { Note } from "@/lib/note";

type PianoKeyProps = {
  note: Note;
  isActive: boolean;
  leftRem: number;
  onMouseDown: (noteName: string) => void;
  onMouseEnter: (noteName: string) => void;
  onMouseUp: () => void;
  showLabel: boolean;
  showSolfege: boolean;
};

const BASE_WHITE =
  "relative w-16 h-64 rounded-b-lg border-x border-b border-t-0 border-gray-300/20 bg-linear-to-b from-white to-gray-100 shadow-[0_2px_5px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-0.5 transform-gpu";
const BASE_BLACK =
  "absolute w-10 h-40 -mx-5 z-20 -top-px rounded-b-lg bg-linear-to-b from-gray-900 to-black shadow-[0_4px_8px_rgba(0,0,0,0.5)] active:shadow-sm active:translate-y-0.5 transform-gpu";
const ACTIVE_BLACK =
  "from-gray-800 to-black ring-2 ring-blue-500/50 !shadow-none !translate-y-0.5";
const ACTIVE_WHITE =
  "!bg-blue-50 !from-blue-100 !to-white !shadow-none !translate-y-0.5 ring-2 ring-blue-400/30";

function PianoKeyComponent({
  note,
  isActive,
  leftRem,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  showLabel,
  showSolfege,
}: PianoKeyProps) {
  const base = note.isSharp ? BASE_BLACK : BASE_WHITE;
  const activeClass = isActive
    ? note.isSharp
      ? ACTIVE_BLACK
      : ACTIVE_WHITE
    : "";

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(note.name);
      }}
      onMouseEnter={() => onMouseEnter(note.name)}
      onMouseUp={onMouseUp}
      onBlur={onMouseUp}
      className={`${base} ${activeClass} transition-[transform,box-shadow,background-color,border-color,color] duration-100 ease-out`}
      style={{
        ...(note.isSharp ? { left: `${leftRem}rem` } : {}),
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
      data-note-name={note.name}
      // Letter shortcuts avoid a tab stop for every piano key.
      tabIndex={-1}
      aria-label={`${note.spokenName} piano key${note.shortcut ? `, shortcut ${note.shortcut.toUpperCase()}` : ""}`}
      aria-pressed={isActive}
    >
      {showSolfege && (
        <span
          className={`absolute bottom-7 left-1/2 -translate-x-1/2 text-base font-semibold pointer-events-none ${
            note.isSharp ? "text-white" : "text-gray-800"
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
          {note.shortcut.toUpperCase()}
        </span>
      )}
    </button>
  );
}

export const PianoKey = React.memo(PianoKeyComponent);
