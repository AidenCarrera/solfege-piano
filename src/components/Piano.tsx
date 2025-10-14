"use client";

import { useState, useEffect } from "react";
import { Howl } from "howler";
import { notes, type Note } from "@/lib/notes";
import PianoKey from "./PianoKey";

export default function Piano() {
  // ----- STATE -----
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastPlayedNote, setLastPlayedNote] = useState<string | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // ----- KEYBOARD HANDLERS -----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (pressedKeys.has(key)) return; // avoid repeat

      const note = notes.find(n => n.key === key);
      if (note) {
        e.preventDefault();
        setPressedKeys(prev => new Set(prev).add(key));
        playNote(note.fileName, note.name);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [pressedKeys]);

  // ----- AUDIO PLAYBACK -----
  const playNote = (fileName: string, noteName: string) => {
    if (noteName === lastPlayedNote) return; // prevent duplicates
    const sound = new Howl({
      src: [`/samples/piano/${fileName}.mp3`],
      volume: 0.25,
    });
    sound.play();
    setActiveNote(noteName);
    setLastPlayedNote(noteName);
    setTimeout(() => setActiveNote(null), 200);
  };

  // ----- MOUSE HANDLERS -----
  const handleMouseDown = (fileName: string, noteName: string) => {
    setIsMouseDown(true);
    playNote(fileName, noteName);
  };

  const handleMouseEnter = (fileName: string, noteName: string) => {
    if (isMouseDown) playNote(fileName, noteName);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setLastPlayedNote(null);
  };

  // ----- KEY POSITIONING HELPERS -----
  const getSharpKeyPosition = (note: Note) => {
    const baseNote = note.name[0];
    const whiteNotes = notes.filter(n => !n.isSharp);
    const whiteIndex = whiteNotes.findIndex(n => n.name.startsWith(baseNote));
    return whiteIndex * 4 + 4; // 4rem per white key
  };

  // ----- RENDER -----
  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen bg-neutral-950"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <h1 className="text-white text-3xl font-semibold mb-8">🎹 Playable Piano</h1>

      <div className="relative flex">
        {notes.map(note => (
          <PianoKey
            key={note.name}
            note={note}
            activeNote={activeNote}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            getSharpKeyPosition={getSharpKeyPosition}
          />
        ))}
      </div>

      <p className="text-gray-400 text-sm mt-10">
        Click, drag, or use your keyboard to play notes (C4–C5)
      </p>
    </main>
  );
}
