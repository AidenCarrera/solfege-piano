"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { fitScale, shortScreenFitScale } from "@/lib/config";

export interface PianoFit {
  scale: number;
  width: number;
  height: number;
}

export interface FitRefs {
  /** Stable probe that spans the viewport. */
  viewport: RefObject<HTMLElement | null>;
  /** Everything stacked above the piano. */
  header: RefObject<HTMLElement | null>;
  /** Unscaled cabinet around the keys. */
  frame: RefObject<HTMLElement | null>;
  /** Layout box that holds the scaled keys. */
  box: RefObject<HTMLElement | null>;
  /** Unscaled keys. */
  content: RefObject<HTMLElement | null>;
}

/**
 * Measures the unscaled keyboard against a stable viewport probe.
 * Short screens constrain width only because they scroll vertically.
 * Returns null until the first measurement.
 */
export function useFitScale(
  refs: FitRefs,
  fillViewport: boolean,
): PianoFit | null {
  const [fit, setFit] = useState<PianoFit | null>(null);
  const { viewport: viewportRef, header: headerRef } = refs;
  const { frame: frameRef, box: boxRef, content: contentRef } = refs;

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const header = headerRef.current;
    const frame = frameRef.current;
    const box = boxRef.current;
    const content = contentRef.current;
    if (!viewport || !header || !frame || !box || !content) return;

    const measure = () => {
      const width = content.offsetWidth;
      const height = content.offsetHeight;
      // The cabinet tracks the box, so their difference is constant chrome.
      const chrome = {
        width: frame.offsetWidth - box.offsetWidth,
        height: frame.offsetHeight - box.offsetHeight,
      };
      const scale = fillViewport
        ? shortScreenFitScale(viewport.clientWidth, width, chrome)
        : fitScale(
            viewport.clientWidth,
            viewport.clientHeight - header.offsetHeight,
            width,
            height,
            chrome,
          );

      setFit((previous) =>
        previous?.scale === scale &&
        previous.width === width &&
        previous.height === height
          ? previous
          : { scale, width, height },
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(header);
    observer.observe(frame);
    observer.observe(content);
    return () => observer.disconnect();
  }, [viewportRef, headerRef, frameRef, boxRef, contentRef, fillViewport]);

  return fit;
}
