"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { fitScale, shortScreenFitScale } from "@/lib/config";

export interface PianoFit {
  /** The zoom at which the keyboard fills its frame without overflowing. */
  scale: number;
  /** The keyboard's unscaled layout size, which the caller scales to size a
   *  real layout box around the transformed keyboard. */
  width: number;
  height: number;
}

/**
 * Measures the keyboard against the space a screen has for it.
 *
 * The available height is derived from a viewport-sized probe rather than
 * read off a container the keyboard sits in. Nothing the keyboard does can
 * change a probe, whereas a container sized from its contents would grow with
 * the keyboard and feed the measurement straight back into itself.
 *
 * `fillViewport` picks between the two layouts. Normally the keyboard shares
 * a screen with the header and fits both axes. On a screen too short for both,
 * the page scrolls down to the keyboard and only its width constrains zoom.
 *
 * The scale is only the *fallback*: once the user picks a zoom it is stored
 * and wins from then on, so resizing — including a mobile browser showing or
 * hiding its chrome — can no longer discard their choice.
 *
 * Returns `null` until the elements have been measured, which lets the first
 * paint settle on the real zoom instead of animating away from a placeholder.
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

      // Same object for the same measurement, so a resize that changes
      // nothing does not re-render every key.
      setFit((previous) =>
        previous?.scale === scale &&
        previous.width === width &&
        previous.height === height
          ? previous
          : { scale, width, height },
      );
    };

    measure();

    // Every input moves: the probe with the viewport, the header as the panel
    // expands and collapses, the content with the octave range and the label
    // toggles. None of them moves *because* of the zoom — the content's
    // layout box ignores its own transform — so a new scale cannot retrigger
    // the measurement that produced it.
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(header);
    observer.observe(content);
    return () => observer.disconnect();
  }, [viewportRef, headerRef, contentRef, fillViewport]);

  return fit;
}
