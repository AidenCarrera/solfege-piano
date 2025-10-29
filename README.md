# Playable Piano 🎹 – Next.js Side Project

A browser-based piano built with **Next.js**, **React**, and **Howler.js** that helps users learn and practice **solfege** efficiently.
This project combines interactive web audio, responsive design, and customizable controls to make a playable piano/sampler.

## Purpose

The goal of this project is to help users learn solfege faster and more effectively.
With Solfege Mode, users see and hear solfege syllables directly on the piano keys, making scale patterns, intervals, and melodic skips (C → E → D → F → E → G, etc.) much easier to internalize and play.
This tool is suitable for beginners and advanced learners practicing scales, intervals, and melodic patterns interactively.

## Features

- Play notes using keyboard keys or mouse clicks/drags
- Solfege mode: plays solfege syllables samples on keys
- Adjustable volume
- Toggle note labels on/off
- Dynamically scale the piano (zoom in/out)
- Customizable background color via color picker
- Sustain mode with Spacebar or button toggle
- Smooth audio playback using Howler.js
- Preloading of audio samples with progress indicator
- Dynamic octave ranges with slider control
- Polyphony support with automatic voice management

## Tech Stack

- **Next.js 16** – Frontend framework with Turbopack for fast builds
- **React 19** – UI library for building interactive components
- **Tailwind CSS v4** – Utility-first CSS framework for responsive design
- **TypeScript** – Adds static type checking and improved developer experience
- **Howler.js** – Handles audio playback and polyphony in the browser

## Installation and setup

To clone and run this application, you'll need Git and Node.js installed. Then:
```
# Clone this repository
git clone https://github.com/AidenCarrera/solfege-piano.git

# Go into the repository
cd solfege-piano

# Install dependencies
npm install

# Run the app
npm run dev

# Open your browser at http://localhost:3000 to view the app
```

## Playing The Piano

- Mouse / Touch: click, drag, or touch keys to play notes
- Keyboard: press mapped keys to play notes
- Volume: adjust with slider
- Piano Scale: zoom in/out using slider
- Labels: toggle keyboard or solfege labels
- Sustain Mode: toggle button with click or Spacebar
- Background: select color using color picker
- Octaves: adjust octave range (except when Solfege is active, which locks to one octave)

## Future Improvements

- Add customizable key mappings
- Add more instrument sounds (strings, synths, etc.)
- Add compression, eq, and limiter settings for advanced users
- Improve mobile responsiveness
