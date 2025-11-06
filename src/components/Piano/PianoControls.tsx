import { useEffect } from "react";
import { SOUND_OPTIONS, type SoundType } from "@/lib/config";

type Props = {
  volume: number;
  setVolume: (v: number) => void;
  labelsEnabled: boolean;
  setLabelsEnabled: (b: boolean) => void;
  solfegeEnabled: boolean;
  setSolfegeEnabled: (b: boolean) => void;
  pianoScale: number;
  setPianoScale: (v: number) => void;
  bgColor: string;
  setBgColor: (v: string) => void;
  soundType: SoundType;
  setSoundType: (s: SoundType) => void;
  startOctave: number;
  endOctave: number;
  onOctaveChange: (start: number, end: number) => void;
};

// Maps slider positions to octave ranges
const OCTAVE_MAP: Record<number, [number, number]> = {
  1: [3, 4],
  2: [3, 5],
  3: [2, 5],
  4: [2, 6],
};

export default function PianoControls({
  volume,
  setVolume,
  labelsEnabled,
  setLabelsEnabled,
  solfegeEnabled,
  setSolfegeEnabled,
  pianoScale,
  setPianoScale,
  bgColor,
  setBgColor,
  soundType,
  setSoundType,
  startOctave,
  endOctave,
  onOctaveChange,
}: Props) {
  // Determine slider position based on current octave range
  const sliderValue = Object.entries(OCTAVE_MAP).find(
    ([, range]) => range[0] === startOctave && range[1] === endOctave
  )?.[0] ?? "2"; // default to 2 if no exact match

  // Auto-set piano scale when Solfege mode is enabled
  useEffect(() => {
    if (soundType === "Solfege") {
      setPianoScale(1.5);
    }
  }, [soundType, setPianoScale]);

  // Handle octave range slider changes
  const handleSliderChange = (val: number) => {
    const [start, end] = OCTAVE_MAP[val];
    onOctaveChange(start, end);

    // Calculate number of octaves and map to piano scale
    const numOctaves = end - start + 1;
    let newScale = 1;

    switch (numOctaves) {
      case 2:
        newScale = 1.5;
        break;
      case 3:
        newScale = 1.4;
        break;
      case 4:
        newScale = 1.0;
        break;
      case 5:
        newScale = 0.8;
        break;
      default:
        newScale = 1.5;
    }

    setPianoScale(newScale);
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-6 mb-8 items-center justify-center text-foreground">
      
      {/* ----- Volume Control ----- */}
      <div className="flex flex-col items-start">
        <label className="text-sm font-medium mb-1">
          Volume: {volume.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-40"
        />
      </div>

      {/* ----- Label Toggles (Keyboard / Solfege) ----- */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={labelsEnabled}
            onChange={(e) => setLabelsEnabled(e.target.checked)}
          />
          Keyboard Labels
        </label>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={solfegeEnabled}
            onChange={(e) => setSolfegeEnabled(e.target.checked)}
          />
          Solfege Labels
        </label>
      </div>

      {/* ----- Piano Scale (Zoom) ----- */}
      <div className="flex flex-col items-start">
        <label className="text-sm font-medium mb-1">
          Piano Scale: {pianoScale.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.01}
          value={pianoScale}
          onChange={(e) => setPianoScale(parseFloat(e.target.value))}
          className="w-40"
        />
      </div>

      {/* ----- Background Color Picker ----- */}
      <div className="flex flex-col items-start">
        <label className="text-sm font-medium mb-1">Background:</label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="w-16 h-8 rounded-md border border-[var(--input-border)]"
        />
      </div>

      {/* ----- Sound Type Selector ----- */}
      <div className="flex flex-col items-start">
        <label className="text-sm font-medium mb-1">Sound Type:</label>
        <select
          value={soundType}
          onChange={(e) => setSoundType(e.target.value as SoundType)}
          className="px-2 py-1 border rounded-md"
        >
          {SOUND_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ----- Octave Range Slider ----- */}
      <div className="flex flex-col items-start">
        <label className="text-sm font-medium mb-1">
          Octave Range: C{startOctave} - C{endOctave}
        </label>
        <input
          type="range"
          min={1}
          max={4}
          step={1}
          value={parseInt(sliderValue)}
          onChange={(e) => handleSliderChange(parseInt(e.target.value))}
          className="w-40"
          disabled={soundType === "Solfege"} // Disable slider for Solfege mode
        />
        {soundType === "Solfege" && (
          <span className="text-xs text-gray-500 mt-1">
            Solfege is locked to one octave
          </span>
        )}
      </div>
    </div>
  );
}
