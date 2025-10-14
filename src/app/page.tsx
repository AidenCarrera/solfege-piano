"use client";

import { useState } from "react";
import { Howl } from "howler";

type Note = {
  name: string;
  isSharp: boolean;
  fileName: string;
};

const notes: Note[] = [
  { name: "C4", isSharp: false, fileName: "C4" },
  { name: "C#4", isSharp: true, fileName: "Cs4" },
  { name: "D4", isSharp: false, fileName: "D4" },
  { name: "D#4", isSharp: true, fileName: "Ds4" },
  { name: "E4", isSharp: false, fileName: "E4" },
  { name: "F4", isSharp: false, fileName: "F4" },
  { name: "F#4", isSharp: true, fileName: "Fs4" },
  { name: "G4", isSharp: false, fileName: "G4" },
  { name: "G#4", isSharp: true, fileName: "Gs4" },
  { name: "A4", isSharp: false, fileName: "A4" },
  { name: "A#4", isSharp: true, fileName: "As4" },
  { name: "B4", isSharp: false, fileName: "B4" },
  { name: "C5", isSharp: false, fileName: "C5" },
];

export default function Home() {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastPlayedNote, setLastPlayedNote] = useState<string | null>(null);

  const playNote = (fileName: string, noteName: string) => {
    // Prevent playing the same note twice in quick succession during drag
    if (noteName === lastPlayedNote) return;
    
    const sound = new Howl({
      src: [`/samples/piano/${fileName}.mp3`],
      volume: 0.25,
    });
    sound.play();
    setActiveNote(noteName);
    setLastPlayedNote(noteName);
    setTimeout(() => setActiveNote(null), 200);
  };

  const handleMouseDown = (fileName: string, noteName: string) => {
    setIsMouseDown(true);
    playNote(fileName, noteName);
  };

  const handleMouseEnter = (fileName: string, noteName: string) => {
    if (isMouseDown) {
      playNote(fileName, noteName);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setLastPlayedNote(null);
  };

  // Get white key index for positioning sharp keys
  const getWhiteKeyIndex = (note: Note) => {
    const whiteNotes = notes.filter(n => !n.isSharp);
    return whiteNotes.findIndex(n => n.name === note.name);
  };

  // Get position for sharp keys based on the white key to their left
  const getSharpKeyPosition = (note: Note) => {
    const baseNote = note.name[0]; // C, D, F, G, or A
    const whiteNotes = notes.filter(n => !n.isSharp);
    const whiteKeyIndex = whiteNotes.findIndex(n => n.name.startsWith(baseNote));
    return whiteKeyIndex * 4 + 3.5; // 4rem per white key (64px), centered between keys
  };

  return (
    <main 
      className="flex flex-col items-center justify-center min-h-screen bg-neutral-950"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <h1 className="text-white text-3xl font-semibold mb-8">🎹 Playable Piano</h1>

      <div className="relative flex">
        {notes.map((note) => (
          <button
            key={note.name}
            onMouseDown={() => handleMouseDown(note.fileName, note.name)}
            onMouseEnter={() => handleMouseEnter(note.fileName, note.name)}
            className={`${
              note.isSharp
                ? "absolute bg-black w-10 h-40 -mx-5 z-10 rounded-b-md"
                : "bg-white w-16 h-60 border border-gray-800 rounded-b-md"
            } ${
              activeNote === note.name
                ? note.isSharp
                  ? "bg-gray-600"
                  : "bg-blue-200"
                : ""
            } transition-colors duration-100`}
            style={
              note.isSharp
                ? {
                    left: `${getSharpKeyPosition(note)}rem`,
                  }
                : {}
            }
          ></button>
        ))}
      </div>

      <p className="text-gray-400 text-sm mt-10">
        Click or drag across keys to play notes (C4–C5)
      </p>
    </main>
  );
}