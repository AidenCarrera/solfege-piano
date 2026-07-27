# Solfege Piano

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
- **Adjustable parameters** for each effect, plus selectable modes (Chorus/Vibrato/Phaser, BitCrusher/Chebyshev, AutoWah/AutoFilter)
- **Toggle note labels** on/off (traditional names or solfege)
- **Dynamically scale** the piano (zoom in/out)
- **Customizable background color** via color picker
- **Sustain mode** with Spacebar or button toggle
- **Preloading of audio samples** with progress indicator and retry on failure
- **Dynamic octave ranges** with slider control
- **Polyphony support** with automatic voice management
- **Multi-touch input** so chords and glissandos work on phones and tablets
- **Saved preferences**: settings persist across visits, with a reset that keeps your effects chain

## Tech Stack

- **Next.js 16** – Frontend framework with Turbopack for fast builds
- **React 19** – UI library for building interactive components
- **Tailwind CSS v4** – Utility-first CSS framework for responsive design
- **TypeScript** – Adds static type checking and improved developer experience
- **Tone.js & Web Audio API** – Handles audio synthesis, sampler playback, and custom effects routing
- **Framer Motion** – Powers interface animation and effects-rack reordering
- **Lucide React** – Icon set used across the control panel
- **Vitest & Testing Library** – Unit tests for the input, settings, and audio hooks
- **Vercel Analytics** – Privacy-friendly page and event metrics

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

Before submitting a change, run the automated checks:

```bash
pnpm test
pnpm lint
pnpm format:check
pnpm build
```

## Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Set `SITE_URL` when developing locally or deploying outside Vercel:

```env
# Local: http://localhost:3000
# Production: https://your-domain.com
SITE_URL=
```

If `SITE_URL` is not set, the app uses Vercel’s stable production URL and falls back to `https://solfegepiano.vercel.app`.

If you add a custom domain, set `SITE_URL` to that domain so canonical URLs, the sitemap, and `robots.txt` use it.


## Playing The Piano

- Mouse / Touch: click, drag, or touch keys to play notes
- Keyboard: press mapped keys to play notes
- Volume: adjust with slider
- Piano Scale: zoom in/out using slider
- Labels: toggle keyboard or solfege labels
- Sustain Mode: toggle button with click or Spacebar
- Background: select color using color picker
- Octaves: adjust octave range (except when Solfege is active, which locks to one octave)
- Effects Rack: add effects under the "Effects Chain" tab, tweak sliders, and drag card handles to reorder the signal chain
- Reset Settings: restore defaults from the "Settings" tab; your effects chain is kept
- Control Panel: collapse or expand it with the chevron button in the tab bar

Your settings are saved in the browser and restored on your next visit.

## Future Improvements

- Add customizable key mappings
- Add MIDI keyboard support
- Add more instrument soundbanks (strings, synths, etc.)
- Add recording & looping features
