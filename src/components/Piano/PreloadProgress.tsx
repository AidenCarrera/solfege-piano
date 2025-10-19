"use client";

import React from "react";

type PreloadProgressProps = {
  progress: number;      // 0.0 - 1.0
  isPreloading: boolean; // whether the preloader is active
};

export default function PreloadProgress({ progress, isPreloading }: PreloadProgressProps) {
  if (!isPreloading) return null;

  return (
    <div className="mb-4 w-full flex justify-center pointer-events-none">
      <div className="w-72 max-w-full bg-[rgba(0,0,0,0.15)] rounded-md p-2 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs font-medium text-foreground/90 mb-1">Loading samples…</div>
          <div className="h-2 w-full bg-foreground/10 rounded overflow-hidden">
            <div
              className="h-full bg-foreground rounded transition-all duration-150 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
        <div className="text-xs font-mono text-foreground/80 w-12 text-right">
          {Math.round(progress * 100)}%
        </div>
      </div>
    </div>
  );
}
