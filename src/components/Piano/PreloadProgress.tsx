"use client";

import React from "react";

type PreloadProgressProps = {
  progress: number;      // Progress value (0.0 - 1.0)
  isPreloading: boolean; // Whether the preloader is active
};

/**
 * PreloadProgress
 * Displays a horizontal loading bar indicating sample preloading progress.
 * Hidden when preloading is inactive.
 */
export default function PreloadProgress({ progress, isPreloading }: PreloadProgressProps) {
  // Hide component if not preloading
  if (!isPreloading) return null;

  return (
    <div className="mb-4 w-full flex justify-center pointer-events-none">
      {/* ----- Container ----- */}
      <div className="w-72 max-w-full bg-[rgba(0,0,0,0.15)] rounded-md p-2 flex items-center gap-3">
        
        {/* ----- Progress Bar ----- */}
        <div className="flex-1">
          {/* Label */}
          <div className="text-xs font-medium text-foreground/90 mb-1">Loading samples…</div>
          
          {/* Track */}
          <div className="h-2 w-full bg-foreground/10 rounded overflow-hidden">
            {/* Fill */}
            <div
              className="h-full bg-foreground rounded transition-all duration-150 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        {/* ----- Progress Percentage ----- */}
        <div className="text-xs font-mono text-foreground/80 w-12 text-right">
          {Math.round(progress * 100)}%
        </div>
      </div>
    </div>
  );
}
