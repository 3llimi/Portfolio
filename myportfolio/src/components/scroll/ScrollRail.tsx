"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import styles from "./ScrollRail.module.css";
import {
  currentScroll,
  getSections,
  maxScroll as pageMaxScroll,
  scrollToSection,
  scrollToY,
  sectionScrollTop,
} from "./smoothScroll";

type Marker = { name: string; ratio: number };

const maxScroll = () => Math.max(1, pageMaxScroll());

/** Slim custom scrollbar: spring-smoothed gold thumb, section markers, drag and click-to-jump. */
export default function ScrollRail() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startY: number; startScroll: number } | null>(null);
  const idleTimer = useRef<number | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [active, setActive] = useState(0);
  const [awake, setAwake] = useState(false);
  const [thumbRatio, setThumbRatio] = useState(0.1);

  const [railHeight, setRailHeight] = useState(0);
  const progress = useMotionValue(0);
  const smooth = useSpring(progress, { stiffness: 260, damping: 34, mass: 0.6 });
  const thumbY = useMotionValue(0);
  const thumbHeight = Math.max(36, railHeight * thumbRatio);

  // Section tops and the scroll range only change with layout, so they're measured on resize
  // and reused by the scroll handler instead of walking the offsetTop chain on every event.
  const sectionTops = useRef<number[]>([]);
  const scrollRange = useRef(1);

  const measure = useCallback(() => {
    const total = document.documentElement.scrollHeight;
    const sections = getSections();
    sectionTops.current = sections.map(sectionScrollTop);
    scrollRange.current = maxScroll();
    setThumbRatio(Math.min(1, window.innerHeight / total));
    setRailHeight(railRef.current?.clientHeight ?? 0);
    setMarkers(
      sections.map((el, i) => ({
        name: el.dataset.section ?? "",
        ratio: Math.min(1, sectionTops.current[i] / scrollRange.current),
      })),
    );
  }, []);

  const wake = useCallback(() => {
    setAwake(true);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setAwake(false), 1400);
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      progress.set(y / scrollRange.current);
      // Same section tops as the nav arrows (clamped, so the short footer still lights up at the end)
      const probe = y + window.innerHeight * 0.45;
      let index = 0;
      sectionTops.current.forEach((top, i) => {
        if (top <= probe) index = i;
      });
      setActive(index);
      wake();
    };
    // At most one update per frame: phones fire scroll events faster than they paint
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    measure();
    update();
    const observer = new ResizeObserver(onResize);
    observer.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [measure, progress, wake]);

  // Translate the spring value into the thumb's pixel offset (no React re-render per frame)
  useEffect(() => {
    const travel = Math.max(0, railHeight - thumbHeight);
    thumbY.set(smooth.get() * travel);
    return smooth.on("change", (v) => thumbY.set(v * travel));
  }, [smooth, thumbY, railHeight, thumbHeight]);

  const onThumbPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startY: event.clientY, startScroll: currentScroll() };
  };

  const onThumbPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const scrollPerPixel = maxScroll() / Math.max(1, railHeight - thumbHeight);
    const top = drag.startScroll + (event.clientY - drag.startY) * scrollPerPixel;
    scrollToY(Math.min(maxScroll(), Math.max(0, top)), { immediate: true });
    wake();
  };

  const onThumbPointerUp = () => {
    dragRef.current = null;
  };

  const onTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;
    // Land the thumb centred under the pointer (not its top edge at a proportional spot)
    const rect = rail.getBoundingClientRect();
    const travel = Math.max(1, rect.height - thumbHeight);
    const ratio = Math.min(1, Math.max(0, (event.clientY - rect.top - thumbHeight / 2) / travel));
    scrollToY(ratio * maxScroll());
  };

  return (
    <div className={`${styles.wrap} ${awake ? styles.awake : ""}`} aria-hidden="true">
      <div ref={railRef} className={styles.rail} onClick={onTrackClick}>
        <div className={styles.track} />
        {markers.map((marker, i) => (
          <button
            key={marker.name}
            type="button"
            tabIndex={-1}
            className={`${styles.marker} ${i === active ? styles.markerActive : ""}`}
            style={{ top: `${marker.ratio * 100}%` }}
            onClick={(event) => {
              event.stopPropagation();
              const section = getSections()[i];
              if (section) scrollToSection(section);
            }}
          >
            <span className={styles.markerLabel}>{marker.name}</span>
          </button>
        ))}
        <motion.div
          className={styles.thumb}
          style={{ height: thumbHeight, y: thumbY }}
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={onThumbPointerUp}
          onPointerCancel={onThumbPointerUp}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}
