# Solfege Piano

A browser-based piano built with **Next.js**, **React**, and **Tone.js** that helps users learn and practice **solfege** efficiently.
This project combines interactive web audio, responsive design, customizable controls, and a dynamic audio effects rack.

## Purpose

The goal of this project is to help users learn solfege faster and more effectively.
With Solfege Mode, users see and hear solfege syllables directly on the piano keys, making scale patterns, intervals, and melodic skips (C → E → D → F → E → G, etc.) much easier to internalize and play.
This tool is suitable for beginners and advanced learners practicing scales, intervals, and melodic patterns interactively.

## Features

- **Play notes** using keyboard keys, mouse clicks/drags, touch, or a **MIDI keyboard** (with velocity and sustain pedal)
- **Solfege mode**: plays solfege syllables samples on keys
- **Any key, any scale**: movable-do labels follow the tonic you pick, across major, minor, modal, pentatonic, and blues scales, with in-scale notes marked on the keys
- **Syllable colors**: each scale degree keeps one color in every key, on the keys and in the display
- **Live display**: names the note, interval, or chord you play, including inversions
- **Ear training**: hear Do and a mystery note, play it back, and track your score and streak
- **Dynamic Effects Rack**: add, toggle, and drag-to-reorder audio effects (Distortion, Filter, Compressor, Modulation, Delay, Reverb)
- **Adjustable parameters** for each effect, plus selectable modes (Chorus/Vibrato/Phaser, BitCrusher/Chebyshev, AutoWah/AutoFilter)
- **Toggle key labels** on/off (solfege, note names, and keyboard shortcuts)
- **Dynamically scale** the piano (zoom in/out)
- **Background presets** plus a custom color picker, with light and dark themes
- **Sustain mode** with Spacebar or button toggle
- **Preloading of audio samples** with progress indicator and retry on failure
- **Dynamic octave ranges** from one to four octaves
- **Help overlay** (press `?`) showing every keyboard shortcut
- **Full-screen mode** for distraction-free practice
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
pnpm typecheck
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

If `SITE_URL` is not set, the app uses Vercel’s stable production URL and falls back to `https://solfege.aidencarrera.com`.

If you add a custom domain, set `SITE_URL` to that domain so canonical URLs, the sitemap, and `robots.txt` use it.

To test on a phone over your local network, run pnpm dev:mobile and set DEV_ORIGIN to your machine's LAN IP so the dev server accepts the request.

## Playing The Piano

- Mouse / Touch: click, drag, or touch keys to play notes
- Keyboard: press mapped keys to play notes; press `?` to see the full map
- MIDI: choose "Connect" under Settings → MIDI keyboard; the browser asks for permission once
- Key & Scale: pick the tonic (Do) and scale in the top bar; labels, colors, and scale markers follow
- Sound: switch between Piano and the sung Solfege voice in the top bar (the voice is recorded in C, so the key stays on C)
- Volume: adjust with slider
- Piano Scale: zoom in/out using slider
- Labels: toggle solfege, note names, and keyboard shortcuts
- Sustain Mode: toggle button with click, Spacebar, or a MIDI sustain pedal
- Background: pick a preset or a custom color
- Octaves: adjust octave range (except when Solfege is active, which locks to one octave)
- Ear Training: press Start in the "Ear Training" tab, listen, and play the note back in any octave
- Effects Rack: add effects under the "Effects Chain" tab, tweak sliders, and drag card handles to reorder the signal chain
- Reset Settings: restore defaults from the "Settings" tab; your effects chain is kept
- Control Panel: collapse or expand it with the chevron button in the tab bar

Your settings are saved in the browser and restored on your next visit.

### How the solfege works

Syllables are movable do: the tonic of the chosen key is always **Do**. Minor scales use do-based minor (Do Re Me Fa Sol Le Te), and notes outside the scale take their usual chromatic names (Di, Me, Fi, Si, Te in major). Note names are spelled from the syllable, so the leading tone of G minor shows as F♯ rather than G♭. With the Chromatic scale or the Solfege voice, the labels use the ascending chromatic syllables (Di Ri Fi Si Li) that match the recordings.

## Future Improvements

- Add customizable key mappings
- Add more instrument soundbanks (strings, synths, etc.)
- Add recording & looping features
- Add interval and chord ear-training drills
