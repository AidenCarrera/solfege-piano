"use client";
import { SOUND_OPTIONS, type SoundType } from "./config";

type Props = {
  volume: number;
  setVolume: (v: number) => void;
  labelsEnabled: boolean;
  setLabelsEnabled: (b: boolean) => void;
  pianoScale: number;
  setPianoScale: (v: number) => void;
  bgColor: string;
  setBgColor: (v: string) => void;
  soundType: SoundType;
  setSoundType: (s: SoundType) => void;
};

export default function PianoControls(props: Props) {
  const {
    volume,
    setVolume,
    labelsEnabled,
    setLabelsEnabled,
    pianoScale,
    setPianoScale,
    bgColor,
    setBgColor,
    soundType,
    setSoundType,
  } = props;

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8 items-center justify-center text-foreground">
      <div className="flex flex-col">
        <label>Volume: {volume.toFixed(2)}</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
      </div>

      <label>
        <input
          type="checkbox"
          checked={labelsEnabled}
          onChange={(e) => setLabelsEnabled(e.target.checked)}
        />
        Labels Enabled
      </label>

      <div className="flex flex-col">
        <label>Piano Scale: {pianoScale.toFixed(2)}</label>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.01}
          value={pianoScale}
          onChange={(e) => setPianoScale(parseFloat(e.target.value))}
        />
      </div>

      <div className="flex flex-col">
        <label>Background:</label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="w-16 h-8 p-0 border-0"
        />
      </div>

      <div className="flex flex-col">
        <label>Sound Type:</label>
        <select
          value={soundType}
          onChange={(e) => setSoundType(e.target.value as SoundType)}
          className="px-2 py-1 border rounded-md bg-transparent"
        >
          {SOUND_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
