"use client";
import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth (inertial) page scrolling powered by Lenis, shared as a singleton so the nav arrows,
 * the custom scroll rail and "Back to top" all glide with the same feel.
 */

let lenis: Lenis | null = null;

export const getLenis = () => lenis;

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/** Smoothly scroll the page to a Y position (falls back to native smooth scrolling). */
export function scrollToY(top: number, { duration = 1.2, immediate = false } = {}) {
  if (lenis) {
    lenis.scrollTo(top, { duration, easing: easeOutQuart, immediate, force: true });
  } else {
    window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
  }
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 1,
      // Let dialogs and the auto-scrolling carousels handle their own wheel events
      prevent: (node) => node.closest?.('[role="dialog"], [data-lenis-prevent]') != null,
    });
    lenis = instance;

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
      instance.destroy();
      lenis = null;
    };
  }, []);

  return null;
}
