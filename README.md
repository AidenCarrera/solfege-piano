# Playable Piano 🎹 – Next.js Side Project

A browser-based piano built with **Next.js**, **React**, and **Tone.js** that helps users learn and practice **solfege** efficiently.
This project combines interactive web audio, responsive design, customizable controls, and a dynamic audio effects rack.

## Purpose

The goal of this project is to help users learn solfege faster and more effectively.
With Solfege Mode, users see and hear solfege syllables directly on the piano keys, making scale patterns, intervals, and melodic skips (C → E → D → F → E → G, etc.) much easier to internalize and play.
This tool is suitable for beginners and advanced learners practicing scales, intervals, and melodic patterns interactively.

## Features

- **Play notes** using keyboard keys, mouse clicks/drags, or touch
- **Solfege mode**: plays solfege syllables samples on keys
- **Dynamic Effects Rack**: add, toggle, and drag-to-reorder audio effects (Distortion, Filter, Compressor, Modulation, Delay, Reverb)
- **Adjustable parameters** for each effect
- **Toggle note labels** on/off (traditional names or solfege)
- **Dynamically scale** the piano (zoom in/out)
- **Customizable background color** via color picker
- **Sustain mode** with Spacebar or button toggle
- **Preloading of audio samples** with progress indicator
- **Dynamic octave ranges** with slider control
- **Polyphony support** with automatic voice management

## Tech Stack

- **Next.js 16** – Frontend framework with Turbopack for fast builds
- **React 19** – UI library for building interactive components
- **Tailwind CSS v4** – Utility-first CSS framework for responsive design
- **TypeScript** – Adds static type checking and improved developer experience
- **Tone.js & Web Audio API** – Handles audio synthesis, sampler playback, and custom effects routing
- **Framer Motion** – Powers interface animation and effects-rack reordering

## Installation and setup

To clone and run this application, you'll need Git and Node.js installed. Then:

```
# Clone this repository
git clone https://github.com/AidenCarrera/solfege-piano.git

# Go into the repository
cd solfege-piano

# Install dependencies
# (Install pnpm globally if you don’t have it: npm install -g pnpm)
pnpm install

# Run the app
pnpm dev

# Open your browser at http://localhost:3000 to view the app
```

## Environment Configuration

Copy the template environment file and customize the site's base URL (used for metadata and sitemaps) as needed:

```bash
cp .env.example .env.local
```

The config uses the following variable:

```env
# The public base URL of the site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

If not provided, the app dynamically falls back to Vercel's preview environment variables in deployment or defaults to `https://solfegepiano.vercel.app`.

## Playing The Piano

- Mouse / Touch: click, drag, or touch keys to play notes
- Keyboard: press mapped keys to play notes
- Volume: adjust with slider
- Piano Scale: zoom in/out using slider
- Labels: toggle keyboard or solfege labels
- Sustain Mode: toggle button with click or Spacebar
- Background: select color using color picker
- Octaves: adjust octave range (except when Solfege is active, which locks to one octave)
- Effects Rack: add effects under the "Effects" tab, tweak sliders, and drag card handles to reorder the signal chain

## Future Improvements

- Add customizable key mappings
- Add MIDI keyboard support
- Add recording & looping features
- Add more instrument soundbanks (strings, synths, etc.)
- Improve responsiveness
