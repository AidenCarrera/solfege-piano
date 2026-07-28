"use client";

import { useState } from "react";
import { RotateCw, Smartphone } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * Phones held upright. `pointer: coarse` keeps the prompt away from a narrow
 * desktop window, and the width bound keeps it away from tablets, which have
 * room for a keyboard either way up.
 */
const PORTRAIT_PHONE =
  "(orientation: portrait) and (pointer: coarse) and (max-width: 900px)";

/**
 * Asks for a landscape screen before showing the piano.
 *
 * A portrait phone is barely two octaves wide once the keys are legible, so
 * the keyboard is asked for sideways rather than shrunk to fit. The dismissal
 * exists because a device with rotation locked cannot answer the prompt, and
 * it sticks for the session: the keyboard scales to whatever space it is
 * given, so someone who has chosen to play in portrait is not asked twice.
 */
export function OrientationGate() {
  const isPortraitPhone = useMediaQuery(PORTRAIT_PHONE);
  const [dismissed, setDismissed] = useState(false);

  if (!isPortraitPhone || dismissed) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="rotate-title"
      aria-describedby="rotate-description"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-8 text-center"
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="relative flex items-center justify-center">
        <Smartphone size={56} strokeWidth={1.5} aria-hidden="true" />
        <RotateCw
          size={26}
          className="absolute -right-7 -top-3 animate-pulse"
          aria-hidden="true"
        />
      </div>

      <h2 id="rotate-title" className="text-xl font-bold tracking-tight">
        Rotate your device
      </h2>
      <p
        id="rotate-description"
        className="max-w-xs text-sm leading-relaxed opacity-75"
      >
        Solfege Piano needs a landscape screen to fit a playable keyboard. Turn
        your phone sideways to start playing.
      </p>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="mt-2 rounded-lg px-3 py-2 text-xs font-medium underline underline-offset-4 opacity-50 transition-opacity hover:opacity-90"
      >
        Continue in portrait
      </button>
    </div>
  );
}
