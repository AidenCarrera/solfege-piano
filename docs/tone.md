### Start Local Server

Source: https://github.com/tonejs/tone.js/blob/dev/examples/README.md

Start a local HTTP server using Python to serve the examples.

```bash
python -m SimpleHTTPServer 8000
```

--------------------------------

### Install Dependencies and Build Tone.js

Source: https://github.com/tonejs/tone.js/wiki/Installation

Commands to install project dependencies and build Tone.js from source. This is part of the quick start guide for running examples.

```bash
$ npm install 
...
$ npm run build

```

--------------------------------

### Tone.js Bus Setup and Routing Example

Source: https://github.com/tonejs/tone.js/blob/dev/examples/buses.html

This snippet demonstrates setting up multiple effect buses (Chorus, Chebyshev, Reverb) and routing an audio player's output to these buses. It also includes event listeners for controlling playback and adjusting the volume of individual effect channels.

```javascript
// the source
const player = new Tone.Player({
  url: "https://tonejs.github.io/audio/berklee/femalevoice_oo_A4.mp3",
  loop: true,
});

// make some effects
const chorus = new Tone.Chorus({
  wet: 1,
})
  .toDestination()
  .start();
const chorusChannel = new Tone.Channel({
  volume: -60
}).connect(chorus);
chorusChannel.receive("chorus");

const cheby = new Tone.Chebyshev(50).toDestination();
const chebyChannel = new Tone.Channel({
  volume: -60
}).connect(cheby);
chebyChannel.receive("cheby");

const reverb = new Tone.Reverb(3).toDestination();
const reverbChannel = new Tone.Channel({
  volume: -60
}).connect(reverb);
reverbChannel.receive("reverb");

// send the player to all of the channels
const playerChannel = new Tone.Channel().toDestination();
playerChannel.send("chorus");
playerChannel.send("cheby");
playerChannel.send("reverb");
player.connect(playerChannel);

drawer()
  .add({
    tone: chorus,
  })
  .add({
    tone: reverb,
  })
  .add({
    tone: cheby,
  });

document
  .querySelector("tone-play-toggle")
  .addEventListener("start", () => player.start());
document
  .querySelector("tone-play-toggle")
  .addEventListener("stop", () => player.stop());

// bind the interface
document
  .querySelector('\\[label="Chorus Send"\\]')
  .addEventListener("input", (e) => {
    chorusChannel.volume.value = parseFloat(e.target.value);
  });

document
  .querySelector('\\[label="Chebyshev Send"\\]')
  .addEventListener("input", (e) => {
    chebyChannel.volume.value = parseFloat(e.target.value);
  });

document
  .querySelector('\\[label="Reverb Send"\\]')
  .addEventListener("input", (e) => {
    reverbChannel.volume.value = parseFloat(e.target.value);
  });
```

--------------------------------

### Serve Tone.js Files Locally

Source: https://github.com/tonejs/tone.js/wiki/Installation

Command to start a simple Python HTTP server in the current directory. This is used to serve the Tone.js files and examples for local testing.

```bash
$ python -m SimpleHTTPServer 8000

```

--------------------------------

### Install Dependencies

Source: https://github.com/tonejs/tone.js/wiki/Building

Run this command to install all necessary project dependencies.

```bash
npm install
```

--------------------------------

### Install Tone.js with npm

Source: https://github.com/tonejs/tone.js/blob/dev/README.md

Install the latest stable or next version of Tone.js using npm.

```bash
npm install tone      // Install the latest stable version
npm install tone@next // Or, alternatively, use the 'next' version
```

--------------------------------

### Create and Schedule a Tone.Part

Source: https://github.com/tonejs/tone.js/wiki/Events

Construct a Tone.Part with an array of time-value pairs to schedule multiple events. This example defines notes and their timings, then starts the part at a specific time.

```javascript
var part = new Tone.Part(function(time, pitch){
	synth.triggerAttackRelease(pitch, "8n", time);
}, [["0", "C#3"], ["4n", "G3"], [3 * Tone.Time("8n"), "G#3"], ["2n", "C3"]]);

part.start("4m");
```

--------------------------------

### Vanilla JavaScript Tone.js Sampler Example

Source: https://github.com/tonejs/tone.js/wiki/Using-Tone.js-with-React-React-Typescript-or-Vue

A basic example demonstrating Tone.js Sampler usage in vanilla JavaScript. It initializes a sampler and triggers an attack on button click after loading.

```javascript
import { Sampler } from "tone";

const sampler = new Sampler(
  {
    A1: "A1.mp3"
  },
  {
    onload: () => {
      document.querySelector("button").removeAttribute("disabled");
    }
  }
).toDestination();

document.querySelector("button").addEventListener("click", () => {
  sampler.triggerAttack("A2");
});

```

--------------------------------

### Microphone Setup and FFT Processing

Source: https://github.com/tonejs/tone.js/blob/dev/examples/mic.html

This snippet demonstrates how to initialize Tone.UserMedia, connect it to a Tone.FFT node for analysis, and bind it to a custom UI element. It includes essential setup for audio processing and feedback prevention.

```javascript
const mic = new Tone.UserMedia();
const micFFT = new Tone.FFT();
mic.connect(micFFT);
fft({ tone: micFFT, parent: document.querySelector("#content"), });

const micButton = document.querySelector("tone-mic-button");
micButton.supported = Tone.UserMedia.supported;
micButton.addEventListener("open", () => mic.open());
micButton.addEventListener("close", () => mic.close());
```

--------------------------------

### DAW Player Setup and Transport Synchronization

Source: https://github.com/tonejs/tone.js/blob/dev/examples/daw.html

Configures Tone.js Transport for BPM and looping, then initializes three audio Players (kick, snare, hi-hat) with specific URLs, loop settings, and synchronized start times/offsets. Connects UI controls to start/stop the transport and updates a progress indicator.

```javascript
// set the transport
Tone.Transport.bpm.value = 108;
Tone.Transport.loop = true;
Tone.Transport.loopStart = "4m";
Tone.Transport.loopEnd = "8m";

const kick = new Tone.Player({
  url: "https://tonejs.github.io/audio/loop/kick.mp3",
  loop: true,
})
  .toDestination()
  .sync()
  .start(0);

const snare = new Tone.Player({
  url: "https://tonejs.github.io/audio/loop/snare.mp3",
  loop: true,
})
  .toDestination()
  .sync()
  .start("2n");

const hh = new Tone.Player({
  url: "https://tonejs.github.io/audio/loop/hh.mp3",
  loop: true,
})
  .toDestination()
  .sync()
  .start("3:3", "4n"); // start with an offset

// connect the UI with the components
document
  .querySelector("tone-play-toggle")
  .addEventListener("start", () => Tone.Transport.start());

document
  .querySelector("tone-play-toggle")
  .addEventListener("stop", () => Tone.Transport.stop());

// keep the play head on track
setInterval(() => {
  // scale it between 0-1
  const progress = (Tone.Transport.progress + 1) / 2;
  document.querySelector("#progress").style = `left: ${progress * 100}%`;
}, 16);
```

--------------------------------

### Initialize and Start Tone.Oscillator

Source: https://github.com/tonejs/tone.js/wiki/Sources

Creates a square wave oscillator at 440Hz, connects it to the master output, and starts it immediately. Ensure Tone.js is included and initialized.

```javascript
var osc = new Tone.Oscillator(440, "square")
	.toMaster()
	.start();
```

--------------------------------

### Tone.js LFO Effects Setup

Source: https://github.com/tonejs/tone.js/blob/dev/examples/lfoEffects.html

Initializes and starts Tone.js LFO effects: AutoPanner, AutoFilter, and Tremolo. These effects are connected to the destination and their parameters can be modulated by LFOs.

```javascript
// AutoPanner - a panning modulation effect const panner = new Tone.AutoPanner({
  frequency: 4,
  depth: 1,
}).toDestination().start();
// AutoFilter - a filter modulation effect const filter = new Tone.AutoFilter({
  frequency: 2,
  depth: 0.6,
}).toDestination().start();
// Tremolo - an amplitude modulation effect const tremolo = new Tone.Tremolo({
  frequency: 0.6,
  depth: 0.7,
}).toDestination().start();
```

--------------------------------

### Initialize and Connect ReverseDelay

Source: https://github.com/tonejs/tone.js/blob/dev/examples/reverseDelay.html

Instantiate the ReverseDelay effect and connect it to the destination. This is the basic setup for using the effect.

```javascript
const reverseDelay = new Tone.ReverseDelay().toDestination();
const synth = new Tone.Synth().connect(reverseDelay);
```

--------------------------------

### Start the Arpeggio Pattern

Source: https://github.com/tonejs/tone.js/wiki/Arpeggiator

Begin playback of the defined arpeggio pattern from the start of the Transport timeline. The '0' indicates the beginning.

```javascript
// begin at the beginning
pattern.start(0);
```

--------------------------------

### Phasing Composition Setup

Source: https://github.com/tonejs/tone.js/blob/dev/examples/pianoPhase.html

Initializes Tone.js transport, sets up stereo output with reverb, and configures two synthesizers for left and right channels. The synthesizers use a custom oscillator with specific partials and a defined envelope.

```javascript
// set the bpm and time signature first
Tone.Transport.timeSignature = [6, 4];
Tone.Transport.bpm.value = 180;

// L/R channel merging
const merge = new Tone.Merge();

// a little reverb
const reverb = new Tone.Reverb({
  wet: 0.3
});
merge.chain(reverb, Tone.Destination);

// left and right synthesizers
const synthL = new Tone.Synth({
  oscillator: {
    type: "custom",
    partials: [2, 1, 2, 2],
  },
  envelope: {
    attack: 0.005,
    decay: 0.3,
    sustain: 0.2,
    release: 1,
  },
  portamento: 0.01,
  volume: -20
}).connect(merge, 0, 0);

const synthR = new Tone.Synth({
  oscillator: {
    type: "custom",
    partials: [2, 1, 2, 2],
  },
  envelope: {
    attack: 0.005,
    decay: 0.3,
    sustain: 0.2,
    release: 1,
  },
  portamento: 0.01,
  volume: -20
}).connect(merge, 0, 1);
```

--------------------------------

### Vue Component Tone.js Sampler Example

Source: https://github.com/tonejs/tone.js/wiki/Using-Tone.js-with-React-React-Typescript-or-Vue

An example of integrating Tone.js Sampler into a Vue.js application using Vue's component structure. It manages audio loading and playback within the component's lifecycle and methods.

```javascript
import { Sampler } from "tone";
import A1 from "./A1.mp3";
import Vue from "vue";

new Vue({
  el: "#app",
  template: "\n  <div id=\"app\">\n    <button :disabled="!isLoaded" @click=\"handleClick\">
      start
    </button>
  </div>",
  data: {
    isLoaded: false
  },
  created() {
    this.sampler = new Sampler(
      { A1 },
      {
        onload: () => {
          this.isLoaded = true;
        }
      }
    ).toDestination();
  },
  methods: {
    handleClick() {
      this.sampler.triggerAttack("A1");
    }
  }
});

```

--------------------------------

### Start a Tone.Loop at Transport Time 0

Source: https://github.com/tonejs/tone.js/wiki/TransportTime

Starts a previously defined Tone.Loop from the beginning of the Transport timeline (time = 0). This schedules the loop to begin when the Transport is started.

```javascript
loop.start(0);
```

--------------------------------

### Start Audio After User Interaction

Source: https://github.com/tonejs/tone.js/blob/dev/README.md

Initiate audio playback after a user interaction, such as a click, by calling Tone.start(). This is required by most browsers to enable audio.

```javascript
//attach a click listener to a play button
document.querySelector("button")?.addEventListener("click", async () => {
	await Tone.start();
	console.log("audio is ready");
});
```

--------------------------------

### Create a Tone.Sequence with Evenly-Spaced Events

Source: https://github.com/tonejs/tone.js/wiki/Events

Instantiate a Tone.Sequence with a callback, an array of values, and a subdivision. This example creates a sequence of 8th notes.

```javascript
//a series of 8th notes
var seq = new Tone.Sequence(callback, ["C3", "Eb3", "F4", "Bb4"], "8n");
```

--------------------------------

### Initialize and Control Tone.js Oscillator

Source: https://github.com/tonejs/tone.js/blob/dev/examples/oscillator.html

Demonstrates initializing a square wave oscillator, setting its frequency and volume, and connecting it to the destination. Includes UI event listeners to start and stop the oscillator.

```javascript
const osc = new Tone.Oscillator({ type: "square", frequency: 440, volume: -16, }).toDestination();
ui({ tone: osc, parent: document.querySelector("#content"), }); // bind the interface
document
  .querySelector("tone-momentary-button")
  .addEventListener("down", () => osc.start());
document
  .querySelector("tone-momentary-button")
  .addEventListener("up", () => osc.stop());
```

--------------------------------

### Playing Audio Samples with Tone.Player

Source: https://github.com/tonejs/tone.js/blob/dev/README.md

Load and play back an audio file using Tone.Player. Use Tone.loaded() to ensure all audio files are ready before starting playback.

```javascript
const player = new Tone.Player(
	"https://tonejs.github.io/audio/berklee/gong_1.mp3"
).toDestination();
Tone.loaded().then(() => {
	player.start();
});
```

--------------------------------

### Ramp Oscillator Frequency

Source: https://github.com/tonejs/tone.js/blob/dev/README.md

Use the rampTo method on a Signal to smoothly change an oscillator's frequency over a specified duration. The oscillator is started and stopped within the example.

```javascript
const osc = new Tone.Oscillator().toDestination();
// start at "C4"
osc.frequency.value = "C4";
// ramp to "C2" over 2 seconds
osc.frequency.rampTo("C2", 2);
// start the oscillator for 2 seconds
osc.start().stop("+3");
```

--------------------------------

### Start Oscillator and Trigger Envelope Attack

Source: https://github.com/tonejs/tone.js/wiki/BasicSynth

Initiate the oscillator and trigger the attack phase of the envelope to begin the sound, smoothing its onset.

```javascript
osc.start();
env.triggerAttack();
```

--------------------------------

### Tone.js Audio Control Interface Setup

Source: https://github.com/tonejs/tone.js/blob/dev/examples/funkyShape.html

Initializes a 'drawer' interface to control various Tone.js audio components. Folders are created for Hihat, Bass, Bleep, and Kick, allowing adjustment of their respective synthesizers, filters, and envelopes.

```javascript
const controls = drawer({
    parent: document.body,
    open: false,
});

controls.folder({
    name: "Hihat"
}).add({
    tone: lowPass,
}).add({
    name: "Open Hihat",
    tone: openHiHat,
}).add({
    name: "Closed Hihat",
    tone: closedHiHat
});

controls.folder({
    name: "Bass"
}).add({
    tone: bassFilter,
}).add({
    tone: bass,
}).add({
    tone: bassEnvelope
});

controls.folder({
    name: "Bleep"
}).add({
    tone: bleep,
}).add({
    tone: bleepEnvelope,
});

controls.folder({
    name: "Kick"
}).add({
    tone: kick,
}).add({
    tone: kickEnvelope,
}).add({
    tone: kickSnapEnv,
});
```

--------------------------------

### Trigger Note Attack Immediately

Source: https://github.com/tonejs/tone.js/wiki/Instruments

Use triggerAttack to start a note. If no time is specified, it triggers immediately.

```javascript
//trigger the start of a note.
synth.triggerAttack("C4");
```

--------------------------------

### React Class Component Tone.js Sampler Example

Source: https://github.com/tonejs/tone.js/wiki/Using-Tone.js-with-React-React-Typescript-or-Vue

Demonstrates Tone.js Sampler integration within a React class component. It manages sampler loading state and triggers audio on button click.

```javascript
import React from "react";
import ReactDOM from "react-dom";
import { Sampler } from "tone";
import A1 from "../A1.mp3";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isLoaded: false };
    this.handleClick = this.handleClick.bind(this);

    this.sampler = new Sampler(
      { A1 },
      {
        onload: () => {
          this.setState({ isLoaded: true });
        }
      }
    ).toDestination();
  }

  handleClick() {
    this.sampler.triggerAttack("A1");
  }

  render() {
    const { isLoaded } = this.state;
    return (
      <div>
        <button disabled={!isLoaded} onClick={this.handleClick}>
          start
        </button>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));

```

--------------------------------

### Initialize and Control Tone.js Player

Source: https://github.com/tonejs/tone.js/blob/dev/examples/player.html

This snippet shows how to create a Tone.js Player instance with looping enabled and connect it to the audio destination. It also includes event listeners for UI controls to start and stop playback.

```javascript
const player = new Tone.Player({
  url: "https://tonejs.github.io/audio/loop/FWDL.mp3",
  loop: true,
  loopStart: 0.5,
  loopEnd: 0.7,
}).toDestination();
ui({
  tone: player,
  parent: document.querySelector("#content"),
});

document
  .querySelector("tone-play-toggle")
  .addEventListener("start", () => player.start());
document
  .querySelector("tone-play-toggle")
  .addEventListener("stop", () => player.stop());
```

--------------------------------

### Trigger Note Attack and Release with Duration

Source: https://github.com/tonejs/tone.js/wiki/Arpeggiator

A convenience method to trigger both the attack and release of a note with a specified duration and start time. If the start time is omitted, it defaults to the current time.

```javascript
synth.triggerAttackRelease("C4", 0.25, time);
```

--------------------------------

### Navigate to Tone.js Directory

Source: https://github.com/tonejs/tone.js/wiki/Installation

Command to change the current directory to the Tone.js project folder. This is a prerequisite for running npm install and build commands.

```bash
$ cd Tone.js-dev

```

--------------------------------

### Play a Note with Tone.js Synth

Source: https://github.com/tonejs/tone.js/blob/dev/examples/simpleHtml.html

This snippet creates a Tone.js synthesizer and plays a C4 note for an eighth note duration. It's a fundamental example for initiating sound.

```javascript
function playNote() {
  // create a synth
  const synth = new Tone.Synth().toDestination();

  // play a note from that synth
  synth.triggerAttackRelease("C4", "8n");
}
```

--------------------------------

### Trigger Attack and Release Separately

Source: https://github.com/tonejs/tone.js/blob/dev/README.md

Use triggerAttack to start a note and triggerRelease to stop it. This allows for more control over note duration and timing.

```javascript
const synth = new Tone.Synth().toDestination();
const now = Tone.now();
// trigger the attack immediately
synth.triggerAttack("C4", now);
// wait one second before triggering the release
synth.triggerRelease(now + 1);
```

--------------------------------

### Schedule a Repeating Event

Source: https://github.com/tonejs/tone.js/wiki/Transport

Schedules a callback to repeat at a specified interval, starting from a given time. If no start time is provided, it begins at the current tick or 0. If no duration is specified, it repeats indefinitely.

```javascript
//play a note every eighth note starting from the first measure
Tone.Transport.scheduleRepeat(function(time){
	note.triggerAttack(time);
}, "8n", "1m");
```

--------------------------------

### Create a Tone.Pattern with Arpeggiator Logic

Source: https://github.com/tonejs/tone.js/wiki/Events

Instantiate a Tone.Pattern with a callback, an array of values, and a pattern name. This example uses the 'upDown' pattern to cycle through notes.

```javascript
//cycle up and then down the array of values
var arp = new Tone.Pattern(callback, ["C3", "E3", "G3"], "upDown");
//callback order: "C3", "E3", "G3", "E3", ...repeat
```

--------------------------------

### Initialize and Control Tone.Noise

Source: https://github.com/tonejs/tone.js/blob/dev/examples/noises.html

Instantiate a Tone.Noise generator with specified volume and type, connect it to the audio destination, and set up event listeners for starting and stopping the noise.

```javascript
const noise = new Tone.Noise({
  volume: -10,
  type: "brown",
}).toDestination();
const toneWaveform = new Tone.Waveform();
noise.connect(toneWaveform);
waveform({
  parent: document.querySelector("#content"),
  tone: toneWaveform,
});
ui({
  parent: document.querySelector("#content"),
  tone: noise,
});

document
  .querySelector("tone-momentary-button")
  .addEventListener("down", () => noise.start());
document
  .querySelector("tone-momentary-button")
  .addEventListener("up", () => noise.stop());
```

--------------------------------

### Tone.js Transport Playback Control and Position Display

Source: https://github.com/tonejs/tone.js/blob/dev/examples/quantization.html

Initializes a PolySynth, starts the Transport on 'start' event, stops it on 'stop' event, and continuously updates the displayed Transport position (bar, beat, sixteenth).

```javascript
const polySynth = new Tone.PolySynth(Tone.Synth).toDestination(); function loop() {
  requestAnimationFrame(loop);
  // @ts-ignore
  const [bar, beat, sixteenth] = Tone.Transport.position.split(":");
  document.querySelector("#progress").textContent = ` bar: ${bar}, beat: ${beat}, sixteenth: ${sixteenth} `;
}
loop();
// bind the interface
document.querySelector("tone-play-toggle").addEventListener("start", e => {
  Tone.Transport.start();
  // enable all of the buttons if it's playing
  // @ts-ignore
  Array.from(document.querySelectorAll("tone-button")).forEach(el => el.disabled = false);
});
document.querySelector("tone-play-toggle").addEventListener("stop", () => {
  Tone.Transport.stop();
  // disable all of the buttons if it's not playing
  // @ts-ignore
  Array.from(document.querySelectorAll("tone-button")).forEach(el => el.disabled = true);
});
```

--------------------------------

### Trigger Attack and Release Together

Source: https://github.com/tonejs/tone.js/wiki/Instruments

Use triggerAttackRelease to schedule both the start and end of a note.

```javascript
//trigger "C4" and then 1 second later trigger the release
synth.triggerAttackRelease("C4", 1);
```

--------------------------------

### Start the Tone.js Transport

Source: https://github.com/tonejs/tone.js/wiki/Arpeggiator

Initiate the Tone.js Transport clock to begin scheduling and playing musical events. This is necessary for any timed events to occur.

```javascript
Tone.Transport.start();
```

--------------------------------

### Set Oscillator Frequency and Timing

Source: https://github.com/tonejs/tone.js/wiki/BasicSynth

Set the frequency of the oscillator to a specific note and define its start and stop times.

```javascript
osc.frequency.value = "C4";
osc.start().stop("+8n");
```

--------------------------------

### Set Tone.Event Probability

Source: https://github.com/tonejs/tone.js/wiki/Events

Adjust the probability of a Tone.Event firing each time it is scheduled. This example sets the probability to 50%.

```javascript
//fire 50% of the time
note.probability = 0.5;
```

--------------------------------

### Correct Audio Event Scheduling

Source: https://github.com/tonejs/tone.js/wiki/Accurate-Timing

This snippet demonstrates the correct way to schedule an audio event, ensuring sample-accurate timing. The scheduled time is passed to the player's start method.

```javascript
Transport.schedule((time) => {
  player.start(time);
}, 0);
```

--------------------------------

### Tone.Transport.scheduleRepeat

Source: https://github.com/tonejs/tone.js/wiki/Transport

Schedules a callback to be invoked repeatedly at a given interval, starting from a specified time and for an optional duration.

```APIDOC
## Tone.Transport.scheduleRepeat(callback, interval, startTime, duration)

### Description
Schedules an event to be invoked at the given interval, starting at `startTime` and for the specified `duration`. If no `startTime` is passed in, the interval will start at the current tick if the Transport is started, or at 0 if the Transport is stopped. If no `duration` is given, the callback will repeat infinitely.

### Parameters
#### Path Parameters
- **callback** (function) - Required - The function to be invoked.
- **interval** (Time) - Required - The interval between invocations.
- **startTime** (Time) - Optional - The time to start the repetitions. Defaults to the current Transport time or 0.
- **duration** (Time) - Optional - The duration for which the repetitions should occur. If omitted, repeats infinitely.

### Request Example
```javascript
//play a note every eighth note starting from the first measure
Tone.Transport.scheduleRepeat(function(time){
	note.triggerAttack(time);
}, "8n", "1m");
```

### Response
#### Success Response (200)
- **eventID** (number) - The unique ID of the scheduled event, which can be used to clear it.
```

--------------------------------

### Trigger Note Attack at Specific Time

Source: https://github.com/tonejs/tone.js/wiki/Instruments

Schedule the start of a note at a specific time using the 'time' argument.

```javascript
//trigger the start of a note at `time`
synth.triggerAttack("C4", time);
```

--------------------------------

### Quantize Note Attack to Half Note

Source: https://github.com/tonejs/tone.js/blob/dev/examples/quantization.html

Triggers a 'G3' note with an '8n' duration, quantized to the '@2n' subdivision. Requires the Transport to be started.

```javascript
document.querySelector("#at2n").addEventListener("click", e => {
  polySynth.triggerAttackRelease("G3", "8n", "@2n");
});
```

--------------------------------

### Create and Schedule a Looping Tone.Event

Source: https://github.com/tonejs/tone.js/wiki/Events

This snippet demonstrates how to create a Tone.Event that triggers a synth note, sets it to loop, and schedules its start and stop times on the Transport.

```javascript
var note = new Tone.Event(function(time, pitch){
	synth.triggerAttackRelease(pitch, "16n", time);
}, "C2");

//set the note to loop every half measure
note.set({
	"loop" : true,
	"loopEnd" : "2n"
});

//start the note at the beginning of the Transport timeline
note.start(0);

//stop the note on the 4th measure
note.stop("4m");
```

--------------------------------

### Create and Configure an Arpeggio Pattern

Source: https://github.com/tonejs/tone.js/wiki/Arpeggiator

Define a repeating musical pattern using Tone.Pattern. This example arpeggiates over a C pentatonic scale. The pattern iterates upwards by default.

```javascript
var pattern = new Tone.Pattern(function(time, note){
	synth.triggerAttackRelease(note, 0.25);
}, ["C4", "D4", "E4", "G4", "A4"]);
```

--------------------------------

### Quantize Note Attack to Measure

Source: https://github.com/tonejs/tone.js/blob/dev/examples/quantization.html

Triggers a 'C2' note with an '8n' duration, quantized to the '@1m' subdivision. Requires the Transport to be started.

```javascript
document.querySelector("#at1m").addEventListener("click", e => {
  polySynth.triggerAttackRelease("C2", "8n", "@1m");
});
```

--------------------------------

### Quantize Note Attack to Quarter Note

Source: https://github.com/tonejs/tone.js/blob/dev/examples/quantization.html

Triggers an 'E4' note with an '8n' duration, quantized to the '@4n' subdivision. Requires the Transport to be started.

```javascript
document.querySelector("#at4n").addEventListener("click", e => {
  polySynth.triggerAttackRelease("E4", "8n", "@4n");
});
```

--------------------------------

### Tone.Transport.timeSignature

Source: https://github.com/tonejs/tone.js/wiki/Transport

Sets the time signature for the Transport. For example, 4/4 is represented as 4, and 6/8 as 3.

```APIDOC
## Tone.Transport.timeSignature

### Description
The transport is capable of any time signature, but the value will be reduced to a number over 4. So for example, 4/4 time would be set as just 4, and 6/8 time would be set as 3. If an array is given, it will be reduced to just the numerator value over 4 (`[7, 8]` becomes just `3.5`).

### Attributes
- **timeSignature** (number | Array<number>) - The time signature.
```

--------------------------------

### Change Tone.Pattern Type

Source: https://github.com/tonejs/tone.js/wiki/Events

Modify the pattern of a Tone.Pattern after instantiation. This example changes the pattern from 'upDown' to 'downUp'.

```javascript
arp.pattern = "downUp";
//callback order: "G3", "E3", "C3", "E3", ...repeat
```

--------------------------------

### Signal Chaining and Control

Source: https://github.com/tonejs/tone.js/blob/dev/examples/signal.html

This example demonstrates chaining Tone.js Signal nodes to control the frequency of two oscillators and an LFO. It uses Tone.Merge for panning, Tone.Oscillator for sound generation, and Tone.LFO for modulation. Event listeners are set up for play/stop toggles and a slider to control signal values.

```javascript
// use this to pan the two oscillators hard left/right
const merge = new Tone.Merge().toDestination();

// two oscillators panned hard left / hard right
const rightOsc = new Tone.Oscillator({
  type: "sawtooth",
  volume: -20,
}).connect(merge, 0, 0);
const leftOsc = new Tone.Oscillator({
  type: "square",
  volume: -20,
}).connect(merge, 0, 1);

// create an oscillation that goes from 0 to 1200
// connection it to the detune of the two oscillators
const detuneLFO = new Tone.LFO({
  type: "square",
  min: 0,
  max: 1200,
})
  .fan(rightOsc.detune, leftOsc.detune)
  .start();

// the frequency signal
const frequency = new Tone.Signal(0.5);

// the move the 0 to 1 value into frequency range
const scale = new Tone.ScaleExp(110, 440);

// multiply the frequency by 2.5 to get a 10th above
const mult = new Tone.Multiply(2.5);

// chain the components together
frequency.chain(scale, mult);
scale.connect(rightOsc.frequency);
mult.connect(leftOsc.frequency);

// multiply the frequency by 2 to get the octave above
const detuneScale = new Tone.Scale(14, 4);
frequency.chain(detuneScale, detuneLFO.frequency);

// start the oscillators with the play button
document
  .querySelector("tone-play-toggle")
  .addEventListener("start", () => {
    rightOsc.start();
    leftOsc.start();
  });

document
  .querySelector("tone-play-toggle")
  .addEventListener("stop", () => {
    rightOsc.stop();
    leftOsc.stop();
  });

// ramp the frequency with the slider
document
  .querySelector("tone-slider")
  .addEventListener("input", (e) => {
    frequency.rampTo(parseFloat(e.target.value), 0.1);
  });

```

--------------------------------

### Initialize Audio Playback

Source: https://github.com/tonejs/tone.js/blob/dev/examples/mixer.html

Adds event listeners to a play/toggle button to start and stop the Tone.Transport. This is essential for controlling the playback of scheduled audio events.

```javascript
document
  .querySelector("tone-play-toggle")
  .addEventListener("start", () => Tone.Transport.start());
document
  .querySelector("tone-play-toggle")
  .addEventListener("stop", () => Tone.Transport.stop());
```

--------------------------------

### Tone.js Ping Pong Delay Setup

Source: https://github.com/tonejs/tone.js/blob/dev/examples/pingPongDelay.html

Initializes a Ping Pong Delay effect with specified delay time, feedback, and wetness, and connects it to the destination. This is used for creating stereo feedback delays.

```javascript
const feedbackDelay = new Tone.PingPongDelay({
  delayTime: "8n",
  feedback: 0.6,
  wet: 0.5
}).toDestination();
```

--------------------------------

### Skip Test Example in Javascript

Source: https://github.com/tonejs/tone.js/wiki/Typescripting-Tone.js

When a test cannot pass due to API changes during the TypeScript conversion, mark it with `.skip()` instead of commenting it out.

```javascript
it.skip("does not work yet", () => {
  // can't get this test to work
})
```

--------------------------------

### Quantize Note Attack to Eighth Note

Source: https://github.com/tonejs/tone.js/blob/dev/examples/quantization.html

Triggers a 'B4' note with an '8n' duration, quantized to the '@8n' subdivision. Requires the Transport to be started.

```javascript
document.querySelector("#at8n").addEventListener("click", e => {
  polySynth.triggerAttackRelease("B4", "8n", "@8n");
});
```

--------------------------------

### Tone.js Transport Control and Setup

Source: https://github.com/tonejs/tone.js/blob/dev/examples/funkyShape.html

Configures the Tone.Transport for looping and binds play/stop controls to DOM elements. This sets the overall timing and loop points for the sequence.

```javascript
// TRANSPORT
Tone.Transport.loopStart = 0;
Tone.Transport.loopEnd = "1:0";
Tone.Transport.loop = true;

// bind the interface
document.querySelector("tone-play-toggle").addEventListener("start", e => Tone.Transport.start());
document.querySelector("tone-play-toggle").addEventListener("stop", e => Tone.Transport.stop());
```

--------------------------------

### Initialize Tone.Sampler with Audio Samples

Source: https://github.com/tonejs/tone.js/blob/dev/examples/sampler.html

This snippet shows how to initialize a Tone.Sampler with a map of note pitches to audio file URLs. It also sets a release time and the base URL for the audio files. The sampler is then routed to the audio destination.

```javascript
const sampler = new Tone.Sampler({
  urls: {
    A0: "A0.mp3",
    C1: "C1.mp3",
    "D#1": "Ds1.mp3",
    "F#1": "Fs1.mp3",
    A1: "A1.mp3",
    C2: "C2.mp3",
    "D#2": "Ds2.mp3",
    "F#2": "Fs2.mp3",
    A2: "A2.mp3",
    C3: "C3.mp3",
    "D#3": "Ds3.mp3",
    "F#3": "Fs3.mp3",
    A3: "A3.mp3",
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
    C5: "C5.mp3",
    "D#5": "Ds5.mp3",
    "F#5": "Fs5.mp3",
    A5: "A5.mp3",
    C6: "C6.mp3",
    "D#6": "Ds6.mp3",
    "F#6": "Fs6.mp3",
    A6: "A6.mp3",
    C7: "C7.mp3",
    "D#7": "Ds7.mp3",
    "F#7": "Fs7.mp3",
    A7: "A7.mp3",
    C8: "C8.mp3",
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination();
```

--------------------------------

### React Hooks Tone.js Sampler Example

Source: https://github.com/tonejs/tone.js/wiki/Using-Tone.js-with-React-React-Typescript-or-Vue

Shows how to use Tone.js Sampler with React Hooks in a functional component. It utilizes `useState`, `useRef`, and `useEffect` for managing state and sampler instance.

```javascript
import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Sampler } from "tone";
import A1 from "../A1.mp3";

export const App = () => {
  const [isLoaded, setLoaded] = useState(false);
  const sampler = useRef(null);

  useEffect(() => {
    sampler.current = new Sampler(
      { A1 },
      {
        onload: () => {
          setLoaded(true);
        }
      }
    ).toDestination();
  }, []);

  const handleClick = () => sampler.current.triggerAttack("A1");

  return (
    <div>
      <button disabled={!isLoaded} onClick={handleClick}>
        start
      </button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));

```

--------------------------------

### Schedule Sine Wave with AudioContext Time

Source: https://github.com/tonejs/tone.js/wiki/TransportTime

Schedules a sine wave oscillator to start at the beginning of the AudioContext timeline and stop after 2 seconds. This is useful for simple, one-off events.

```javascript
var sine = new Tone.Oscillator(440, "sine").toDestination();
//start the oscillator at 0
sine.start(0);
//stop it at 2
sine.stop(2);
```

--------------------------------

### Schedule Multiple Transport Events

Source: https://github.com/tonejs/tone.js/wiki/TransportTime

Schedules a Tone.Loop and a Tone.Event, then manipulates the Tone.Transport by starting, stopping, and restarting it at specific AudioContext times. This demonstrates synchronized scheduling of various events.

```javascript
function loopCallback(time){
	console.log("loop");
}
var loop = new Tone.Loop(loopCallback, 2);
loop.start(0).stop(5);


function eventCallback(time){
	console.log("event");
}
var event = new Tone.Event(eventCallback).start(3);

//start the Transport 2 seconds after the page loads
Tone.Transport.start(2);
//stop it and restart it
Tone.Transport.stop(6);
Tone.Transport.start(8);
```

--------------------------------

### Initialize Tone.Player with Default Callback

Source: https://github.com/tonejs/tone.js/wiki/Sources

Creates a player for an audio file. The audio file will be loaded and ready to play. Ensure the audio file path is correct.

```javascript
var player = new Tone.Player("./sound.mp3").toDestination();
```

--------------------------------

### Control Audio Playback with UI Events

Source: https://github.com/tonejs/tone.js/blob/dev/examples/meter.html

This snippet shows how to bind start and stop events from a UI element (like a play/stop button) to control an audio player. It ensures the audio playback is managed by user interaction.

```javascript
document
  .querySelector("tone-play-toggle")
  .addEventListener("start", () => player.start());
document
  .querySelector("tone-play-toggle")
  .addEventListener("stop", () => player.stop());
```

--------------------------------

### Connecting UI Playback Controls

Source: https://github.com/tonejs/tone.js/blob/dev/examples/animationSync.html

Add event listeners to UI elements to control Tone.Transport start and stop actions. This allows user interaction to manage the playback of scheduled audio events.

```javascript
drawer().add({ tone: synth, title: "Piano", });
// connect the UI with the components
document.querySelector("tone-play-toggle").addEventListener("start", () => Tone.Transport.start());
document.querySelector("tone-play-toggle").addEventListener("stop", () => Tone.Transport.stop());
```

--------------------------------

### Control Tone.Transport with Play Toggle

Source: https://github.com/tonejs/tone.js/blob/dev/examples/spatialPanner.html

Adds event listeners to a custom 'tone-play-toggle' element to start and stop the Tone.Transport. Ensure this element is present in your HTML.

```javascript
document.querySelector("tone-play-toggle").addEventListener("start", () => Tone.Transport.start());
document.querySelector("tone-play-toggle").addEventListener("stop", () => Tone.Transport.stop());
```

--------------------------------

### Webpack Configuration for Tone.js

Source: https://github.com/tonejs/tone.js/wiki/Installation

Configure Webpack to resolve Tone.js modules. Adjust the 'root' and 'modulesDirectories' (Webpack 1) or 'modules' (Webpack 2) paths to point to your Tone.js installation.

```javascript
module.exports = {
	resolve: {
		root: __dirname,
        // for webpack 1:
		modulesDirectories : ["path/to/Tone.js/"],
        // for webpack 2:
        modules : ["path/to/Tone.js/"]
	},
	//...

```

--------------------------------

### Initializing and Controlling Player

Source: https://github.com/tonejs/tone.js/blob/dev/examples/analysis.html

Initialize GUI elements for Meter, FFT, and Waveform, and set up event listeners for play/stop controls.

```javascript
// bind the GUI
drawer().add({
  tone: player,
  title: "Player",
});

meter({
  tone: toneMeter,
  parent: document.querySelector("#content"),
});

fft({
  tone: toneFFT,
  parent: document.querySelector("#content"),
});

waveform({
  tone: toneWaveform,
  parent: document.querySelector("#content"),
});

document
  .querySelector("tone-play-toggle")
  .addEventListener("start", () => player.start());

document
  .querySelector("tone-play-toggle")
  .addEventListener("stop", () => player.stop());
```

--------------------------------

### Tone.Oscillator

Source: https://github.com/tonejs/tone.js/wiki/Sources

A wrapper around the native OscillatorNode that simplifies starting and stopping and includes additional parameters such as phase rotation. It supports various wave types, including modified partials.

```APIDOC
## Tone.Oscillator

### Description
A wrapper around the native OscillatorNode which simplifies starting and stopping and includes additional parameters such as phase rotation.

### Usage
```javascript
//a square wave at 440hz
var osc = new Tone.Oscillator(440, "square")
	.toMaster()
	.start();
```

Tone.Oscillator also includes modifiers on the default oscillator types. Set the type to `"square4"` to hear the first 4 partials of the square wave, or `"triangle9"` for the first 9 partials of the triangle wave.
```

--------------------------------

### Initialize and Connect Tone.Meter

Source: https://github.com/tonejs/tone.js/blob/dev/examples/meter.html

This snippet shows how to create a Tone.Meter instance, connect it to an audio player, and then connect the meter to the destination. This is useful for monitoring audio levels in real-time.

```javascript
const player = new Tone.Player({
  url: "https://tonejs.github.io/audio/berklee/Resonant_FM_laser1.mp3",
  loop: true,
}).toDestination();
const toneMeter = new Tone.Meter({
  channelCount: 2,
});
player.connect(toneMeter);
```

--------------------------------

### Set BPM and Connect UI Controls

Source: https://github.com/tonejs/tone.js/blob/dev/examples/bembe.html

Sets the tempo for the Tone.Transport and connects UI elements to control playback. This snippet assumes a 'tone-play-toggle' element exists for starting and stopping the transport.

```javascript
Tone.Transport.bpm.value = 115;

drawer()
  .add({
    tone: conga,
    title: "Conga",
  })
  .add({
    tone: bell,
    title: "Bell",
  });

// connect the UI with the components
document
  .querySelector("tone-play-toggle")
  .addEventListener("start", () => Tone.Transport.start());

document
  .querySelector("tone-play-toggle")
  .addEventListener("stop", () => Tone.Transport.stop());
```

--------------------------------

### Initialize and Configure PolySynth

Source: https://github.com/tonejs/tone.js/blob/dev/examples/polySynth.html

Instantiates a PolySynth with a Tone.Synth and custom oscillator partials, then routes it to the destination. This is useful for creating complex polyphonic sounds.

```javascript
const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { partials: [0, 2, 3, 4], }, }).toDestination();
```

--------------------------------

### Tone.Part

Source: https://github.com/tonejs/tone.js/wiki/Events

Tone.Part aggregates multiple Tone.Events, allowing them to be controlled as a single unit. It supports starting, stopping, and looping, and provides methods to access and modify event values at specific times.

```APIDOC
## Tone.Part

### Description
Aggregates any number of Tone.Events which can be started, stopped and looped as a combined unit. Parts have all of the same methods as Tone.Events.

### Constructor
`new Tone.Part(callback: function, value?: Array<[Time, any]> | Array<{time: Time, [key: string]: any}>)`

### Methods
#### `start(time?: Time)`
Starts the part at the given time.

#### `stop(time?: Time)`
Stops the part at the given time.

#### `at(time: Time, value?: any)`
Gets or sets the value of a part at a given time.

### Example
```javascript
var part = new Tone.Part(function(time, pitch){
	synth.triggerAttackRelease(pitch, "8n", time);
}, [["0", "C#3"], ["4n", "G3"], [3 * Tone.Time("8n"), "G#3"], ["2n", "C3"]]);

part.start("4m");

//get the value at the given time
part.at("4n"); //returns "G3"

//change the first note to a G#
part.at("0", "G#2");
```
```

--------------------------------

### Initialize and Use Tone.Reverb

Source: https://github.com/tonejs/tone.js/blob/dev/examples/reverb.html

Set up a Tone.Reverb effect and connect an audio player to it. The reverb will be applied to the audio output. Ensure the Tone library is loaded and the UI is bound.

```javascript
const reverb = new Tone.Reverb().toDestination(); const player = new Tone.Player({
  url: "https://tonejs.github.io/audio/berklee/shaker_slow_1.mp3",
  loop: true,
  volume: 6,
}).connect(reverb);
ui({
  parent: document.querySelector("#content"),
  tone: reverb,
});
// bind the interface
document
  .querySelector("tone-play-toggle")
  .addEventListener("start", () => player.start());
document
  .querySelector("tone-play-toggle")
  .addEventListener("stop", () => player.stop());
```

--------------------------------

### Initialize Tone.Player with Load Callback

Source: https://github.com/tonejs/tone.js/wiki/Sources

Creates a player for an audio file and provides a callback function that executes once the audio file is loaded. This is useful for tracking individual buffer loading.

```javascript
var player = new Tone.Player("./sound.mp3", function(){
	//the player is now ready
}).toDestination();
```

--------------------------------

### Control GrainPlayer Playback with UI Events

Source: https://github.com/tonejs/tone.js/blob/dev/examples/grainPlayer.html

Attach event listeners to a custom UI element ('tone-play-toggle') to control the start and stop actions of the Tone.GrainPlayer instance. Ensure the UI element is correctly selected and the player instance is accessible.

```javascript
document.querySelector("tone-play-toggle").addEventListener("start", () => player.start());
```

```javascript
document.querySelector("tone-play-toggle").addEventListener("stop", () => player.stop());
```

--------------------------------

### Scheduling Looped Events with Tone.Transport

Source: https://github.com/tonejs/tone.js/blob/dev/README.md

Use Tone.Loop to create recurring callbacks scheduled by the Transport. The Transport's bpm can be ramped over time. Ensure the Transport is started to trigger scheduled events.

```javascript
const synthA = new Tone.FMSynth().toDestination();
const synthB = new Tone.AMSynth().toDestination();
//play a note every quarter-note
const loopA = new Tone.Loop((time) => {
	synthA.triggerAttackRelease("C2", "8n", time);
}, "4n").start(0);
//play another note every off quarter-note, by starting it "8n"
const loopB = new Tone.Loop((time) => {
	synthB.triggerAttackRelease("C4", "8n", time);
}, "4n").start("8n");
// all loops start when the Transport is started
Tone.getTransport().start();
// ramp up to 800 bpm over 10 seconds
Tone.getTransport().bpm.rampTo(800, 10);
```

--------------------------------

### Tone.Event

Source: https://github.com/tonejs/tone.js/wiki/Events

Tone.Event is the base class for musical events, allowing callbacks with associated values. It supports setting loop properties, start and stop times, probability, humanization, and playback rate.

```APIDOC
## Tone.Event

### Description
Creates a callback with a value that will be passed as the second argument to the callback. Events will not fire unless the Transport is started.

### Constructor
`new Tone.Event(callback: function, value: any)`

### Methods
#### `set(options: object)`
Sets various properties of the event.
- `loop` (boolean): If the event should loop.
- `loopEnd` (Time): The time at which the loop should end.

#### `start(time?: Time)`
Starts the event at the given time.

#### `stop(time?: Time)`
Stops the event at the given time.

### Properties
#### `probability` (number)
Adjusts the probability of the event firing each time it is scheduled to. Value between 0 and 1.

#### `humanize` (boolean | Time)
Adjusts how rigid the callback timing is. If `true`, the `time` parameter will drift slightly. Can also be set to a Time value for a specific drift amount.

#### `playbackRate` (number)
Adjusts the playback-rate of the event.

### Example
```javascript
//create a looped note event every half-note
var note = new Tone.Event(function(time, pitch){
	ssynth.triggerAttackRelease(pitch, "16n", time);
}, "C2");

//set the note to loop every half measure
note.set({
	"loop" : true,
	"loopEnd" : "2n"
});

//start the note at the beginning of the Transport timeline
note.start(0);

//stop the note on the 4th measure
note.stop("4m");

//fire 50% of the time
note.probability = 0.5;

//drift by +/- a 32nd-note
note.humanize = "32n";

//loop the event twice as fast.
note.playbackRate = 2;
```
```