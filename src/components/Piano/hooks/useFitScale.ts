"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { fitScale, shortScreenFitScale } from "@/lib/config";

export interface PianoFit {
  scale: number;
  width: number;
  height: number;
}

/**
 * Measures the unscaled keyboard against a stable viewport probe.
 * Short screens constrain width only because they scroll vertically.
 * Returns null until the first measurement.
 */
export function useFitScale(
  viewportRef: RefObject<HTMLElement | null>,
  headerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  fillViewport: boolean,
): PianoFit | null {
  const [fit, setFit] = useState<PianoFit | null>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const header = headerRef.current;
    const content = contentRef.current;
    if (!viewport || !header || !content) return;

    const measure = () => {
      const width = content.offsetWidth;
      const height = content.offsetHeight;
      const scale = fillViewport
        ? shortScreenFitScale(viewport.clientWidth, width)
        : fitScale(
            viewport.clientWidth,
            viewport.clientHeight - header.offsetHeight,
            width,
            height,
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
    observer.observe(content);
    return () => observer.disconnect();
  }, [viewportRef, headerRef, contentRef, fillViewport]);

  return fit;
}
