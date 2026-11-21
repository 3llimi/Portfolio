"use client";
import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth (inertial) page scrolling powered by Lenis, shared as a singleton so the nav arrows,
 * the custom scroll rail and "Back to top" all glide with the same feel — and all agree on
 * where each section starts.
 */

let lenis: Lenis | null = null;
/**
 * Destination of the programmatic glide in progress. Lenis moves `targetScroll` along with the
 * animation for programmatic scrolls, so it can't tell us where the page is headed.
 */
let pendingTarget: number | null = null;

export const getLenis = () => lenis;

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Largest reachable scroll position of the page. */
export const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

/**
 * Where the page is (or is about to be): while Lenis is gliding this is its destination, so
 * repeated clicks on the nav arrows advance section by section instead of re-targeting the same one.
 */
export const currentScroll = () => {
  if (!lenis || lenis.isStopped) return window.scrollY;
  if (pendingTarget !== null && lenis.isScrolling) return pendingTarget;
  return lenis.targetScroll;
};

/**
 * Document-space top of an element taken from layout (offsetTop chain), so the reveal
 * animations' translateY transforms never skew the measurement.
 */
export function layoutTop(el: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (parent) top += parent.clientTop;
    node = parent;
  }
  return top;
}

/** All page sections (marked with `data-section="Name"`) in document order. */
export const getSections = () => Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));

/** Scroll position at which a section sits at the top of the viewport (clamped to the page end). */
export const sectionScrollTop = (el: HTMLElement) => Math.min(maxScroll(), Math.round(layoutTop(el)));

type ScrollOptions = { duration?: number; immediate?: boolean; onComplete?: () => void };

/** Smoothly scroll the page to a Y position (falls back to native scrolling without Lenis). */
export function scrollToY(top: number, { duration = 1.2, immediate = false, onComplete }: ScrollOptions = {}) {
  if (lenis) {
    pendingTarget = immediate ? null : Math.min(Math.max(0, top), lenis.limit);
    lenis.scrollTo(top, {
      duration,
      easing: easeOutQuart,
      immediate,
      force: true,
      onComplete: () => {
        pendingTarget = null;
        onComplete?.();
      },
    });
    return;
  }

  const instant = immediate || prefersReducedMotion();
  window.scrollTo({ top, behavior: instant ? "auto" : "smooth" });
  if (!onComplete) return;
  if (instant) {
    requestAnimationFrame(() => onComplete());
  } else if ("onscrollend" in window) {
    window.addEventListener("scrollend", () => onComplete(), { once: true });
  }
}

/** A glide duration that feels the same for short hops and long jumps. */
const durationFor = (distance: number) => Math.min(1.3, Math.max(0.7, 0.5 + Math.abs(distance) / 1800));

/**
 * Scroll so the section's top lands exactly at the top of the viewport. The layout can shift
 * while gliding (lazy images, README content), so the target is re-measured when the glide ends
 * and corrected if it moved.
 */
export function scrollToSection(el: HTMLElement) {
  // Lenis debounces its own size measurement; refresh it so its scroll limit isn't stale.
  lenis?.resize();

  let corrections = 0;
  const go = (duration: number) => {
    const target = sectionScrollTop(el);
    scrollToY(target, {
      duration,
      onComplete: () => {
        const settled = sectionScrollTop(el);
        if (corrections < 2 && Math.abs(settled - window.scrollY) > 1) {
          corrections += 1;
          lenis?.resize();
          go(0.35);
        }
      },
    });
  };

  go(durationFor(sectionScrollTop(el) - window.scrollY));
}

/**
 * Step to the next (1) or previous (-1) section relative to where the page is heading.
 * Sections are compared by their exact top so the result never depends on viewport heuristics.
 */
export function adjacentSection(direction: 1 | -1): HTMLElement | null {
  const from = currentScroll();
  const sections = getSections().map((el) => ({ el, top: sectionScrollTop(el) }));
  const target =
    direction === 1
      ? sections.find((s) => s.top > from + 2)
      : [...sections].reverse().find((s) => s.top < from - 2);
  return target?.el ?? null;
}

/** Index of the section the page is in (or heading to), using the same tops as the arrows. */
export function currentSectionIndex() {
  const from = currentScroll();
  let index = 0;
  getSections().forEach((el, i) => {
    if (sectionScrollTop(el) <= from + 2) index = i;
  });
  return index;
}

export function scrollToAdjacentSection(direction: 1 | -1) {
  lenis?.resize();
  const target = adjacentSection(direction);
  const from = currentScroll();

  if (target) {
    scrollToSection(target);
  } else if (direction === -1 && from > 0) {
    scrollToY(0, { duration: durationFor(from) });
  }
}

export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const instance = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      // Let dialogs and the auto-scrolling carousels handle their own wheel events
      prevent: (node) => node.closest?.('[role="dialog"], [data-lenis-prevent]') != null,
    });
    lenis = instance;
    // Wheel/touch input takes over from any programmatic glide
    const offVirtualScroll = instance.on("virtual-scroll", () => {
      pendingTarget = null;
    });

    let frame = 0;
    const loop = (time: number) => {
      // Dialogs lock the page by setting overflow: hidden on <html>; pause smoothing meanwhile
      const locked = document.documentElement.style.overflow === "hidden";
      if (locked && !instance.isStopped) instance.stop();
      else if (!locked && instance.isStopped) instance.start();
      instance.raf(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      offVirtualScroll();
      instance.destroy();
      lenis = null;
      pendingTarget = null;
    };
  }, []);

  return null;
}
