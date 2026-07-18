"use client";

import React from "react";

type PreloadProgressProps = {
  progress: number;
  isPreloading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function PreloadProgress({
  progress,
  isPreloading,
  error,
  onRetry,
}: PreloadProgressProps) {
  if (!isPreloading && !error) return null;

  if (error) {
    return (
      <div
        className="mb-4 w-72 max-w-full rounded-md bg-red-950/70 p-3 text-center text-sm text-red-100"
        role="alert"
      >
        <p>{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-md bg-red-100 px-3 py-1 font-semibold text-red-950 transition-colors hover:bg-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="mb-4 w-full flex justify-center pointer-events-none"
      aria-live="polite"
    >
      <div className="w-72 max-w-full bg-[rgba(0,0,0,0.15)] rounded-md p-2 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-xs font-medium text-foreground/90 mb-1">
            Loading samples…
          </div>

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
