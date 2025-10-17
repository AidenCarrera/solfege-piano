# Playable Piano 🎹 – Next.js Side Project

A browser-based piano built with Next.js, React, and Howler.js that helps users learn and practice solfege efficiently.
This project combines interactive web audio, responsive design, and customizable controls to make a playable piano/sampler.

------------------------------------------------------------
Purpose
------------------------------------------------------------

The goal of this project is to help users learn solfege faster and more effectively.
Traditional solfege practice often requires mental gymnastics to internalize scales, intervals, and skip patterns.
With Solfege Mode, users can see and hear solfege syllables directly on the piano keys, making patterns like skips (C → E → D → F → E → G, etc.) much easier to understand and play.
This tool is designed for beginners and advanced learners alike to practice scales, intervals, and melodic patterns interactively.

------------------------------------------------------------
Features
------------------------------------------------------------

- Play notes using keyboard keys or mouse clicks/drags
- Solfege mode: plays solfege syllables samples on keys
- Adjustable volume
- Toggle note labels on/off
- Scale the piano size dynamically
- Customizable background color with a color picker
- Sustain mode with Spacebar or button toggle
- Smooth audio playback using Howler.js
- Preloading of audio samples with progress indicator

------------------------------------------------------------
Tech Stack
------------------------------------------------------------

- **Next.js 15** – Frontend framework
- **React** – UI library
- **Tailwind CSS** – Styling and responsive layout
- **TypeScript** – Type safety
- **Howler.js** – Audio playback

------------------------------------------------------------
How To Use
------------------------------------------------------------

To clone and run this application, you'll need Git and Node.js (which comes with npm) installed on your computer. From your command line:
```
# Clone this repository
git clone https://github.com/AidenCarrera/solfege-piano.git

# Go into the repository
cd solfege-piano

# Install dependencies
npm install

# Run the app
npm run dev
```
------------------------------------------------------------
Playing The Piano
------------------------------------------------------------

- Click or drag on the piano keys to play notes
- Press the corresponding keyboard keys to play notes
- Adjust volume and piano scale using sliders
- Toggle note labels on/off
- Enable sustain mode with the button or Spacebar
- Use the color picker to change the background color

------------------------------------------------------------
Future Improvements
------------------------------------------------------------

- Add customizable key mappings
- Add more instrument sounds (e.g., strings, synth)
- Add compression and eq and limiter settings for advanced users
- Improve mobile responsiveness and touch interactions further
