"use client";
import { useEffect, useState } from "react";

/**
 * Phones and tablets (touch-first) plus very narrow windows. Hover-driven or pointer-heavy
 * features (Doctor Livesey, the README reader, the custom cursor, wheel-driven carousels,
 * smooth wheel scrolling) are switched off here in favour of native touch behaviour.
 */
export const COMPACT_QUERY = "(hover: none) and (pointer: coarse), (max-width: 600px)";

/** Devices with a real mouse/trackpad and room for the custom cursor. Keep in sync with globals.css. */
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine) and (min-width: 601px)";

/** Live result of a CSS media query (false during SSR and the first client render). */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export const useIsCompact = () => useMediaQuery(COMPACT_QUERY);
