"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type PreloadProgressProps = {
  progress: number;
  isPreloading: boolean;
  error: string | null;
  onRetry: () => void;
};

/**
 * Sample-loading status. Positioned as an absolute overlay above the piano keys
 * so it never shifts the layout when appearing or disappearing.
 */
export function PreloadProgress({
  progress,
  isPreloading,
  error,
  onRetry,
}: PreloadProgressProps) {
  return (
    <AnimatePresence>
      {(isPreloading || error) && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0,
            y: -4,
            scale: 0.98,
            transition: { duration: 0.45, ease: "easeOut" },
          }}
          transition={{ duration: 0.08, ease: "easeOut" }}
          className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-72 max-w-[90vw]"
          aria-live="polite"
        >
          {error ? (
            <div
              className="w-full rounded-xl bg-red-950/90 border border-red-800/50 backdrop-blur-md p-3 text-center text-sm text-red-100 shadow-xl"
              role="alert"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 rounded-md bg-red-100 px-3 py-1 text-xs font-semibold text-red-950 transition-colors hover:bg-white cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div
              className="w-full border backdrop-blur-md rounded-xl p-2.5 flex items-center gap-3 shadow-xl"
              style={{
                background: "var(--panel-surface)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                color: "var(--panel-fg)",
              }}
            >
              <div className="flex-1">
                <div className="text-[11px] font-medium uppercase tracking-wider mb-1 opacity-90">
                  Loading samples…
                </div>

                <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-xs font-mono w-9 text-right font-medium opacity-80">
                {Math.round(progress * 100)}%
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
