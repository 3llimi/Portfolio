"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import styles from "./ScrollRail.module.css";
import { scrollToY } from "./smoothScroll";

type Marker = { name: string; top: number; ratio: number };

const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

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

  const measure = useCallback(() => {
    const total = document.documentElement.scrollHeight;
    setThumbRatio(Math.min(1, window.innerHeight / total));
    setRailHeight(railRef.current?.clientHeight ?? 0);
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    setMarkers(
      sections.map((el) => {
        const top = el.getBoundingClientRect().top + window.scrollY;
        return { name: el.dataset.section ?? "", top, ratio: Math.min(1, top / maxScroll()) };
      }),
    );
  }, []);

  const wake = useCallback(() => {
    setAwake(true);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setAwake(false), 1400);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      progress.set(window.scrollY / maxScroll());
      const probe = window.scrollY + window.innerHeight * 0.45;
      const sections = document.querySelectorAll<HTMLElement>("[data-section]");
      let index = 0;
      sections.forEach((el, i) => {
        if (el.getBoundingClientRect().top + window.scrollY <= probe) index = i;
      });
      setActive(index);
      wake();
    };
    measure();
    onScroll();
    const observer = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    observer.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
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
    dragRef.current = { startY: event.clientY, startScroll: window.scrollY };
  };

  const onThumbPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const scrollPerPixel = maxScroll() / Math.max(1, railHeight - thumbHeight);
    scrollToY(drag.startScroll + (event.clientY - drag.startY) * scrollPerPixel, { immediate: true });
    wake();
  };

  const onThumbPointerUp = () => {
    dragRef.current = null;
  };

  const onTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / rect.height;
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
              scrollToY(marker.top);
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
