"use client";
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import styles from "./SectionNav.module.css";
import {
  adjacentSection,
  currentSectionIndex,
  getSections,
  maxScroll,
  scrollToAdjacentSection,
} from "./smoothScroll";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

type NavState = {
  index: number;
  total: number;
  prevName: string | null;
  nextName: string | null;
};

const INITIAL_STATE: NavState = { index: 0, total: 0, prevName: null, nextName: null };

const pad = (n: number) => String(n).padStart(2, "0");

function Chevron({ direction }: { direction: "up" | "down" }) {
  return (
    <svg className={styles.chevron} viewBox="0 0 24 24" aria-hidden="true">
      <path d={direction === "up" ? "M6 14.5 12 8.5l6 6" : "M6 9.5l6 6 6-6"} />
    </svg>
  );
}

/**
 * Section-to-section navigation dock: up/down arrows with "where it goes" tooltips, a rolling
 * section counter and a gold progress line tracing the capsule outline.
 */
export default function SectionNav() {
  const [state, setState] = useState<NavState>(INITIAL_STATE);
  const stateRef = useRef<NavState>(INITIAL_STATE);
  const dockRef = useRef<HTMLElement | null>(null);
  const liftRef = useRef(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const progress = useMotionValue(0);
  const smooth = useSpring(progress, { stiffness: 220, damping: 32, mass: 0.6 });
  const dashOffset = useTransform(smooth, (v) => 1 - v);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = getSections();
      const max = maxScroll();
      progress.set(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);

      // Ride up above anything marked data-nav-avoid (e.g. the footer's "Back to top") as it scrolls in
      const dock = dockRef.current;
      if (dock) {
        const rect = dock.getBoundingClientRect();
        const restTop = rect.top + liftRef.current;
        const restBottom = rect.bottom + liftRef.current;
        let lift = 0;
        document.querySelectorAll<HTMLElement>("[data-nav-avoid]").forEach((el) => {
          const r = el.getBoundingClientRect();
          const overlapsX = r.left < rect.right + 12 && r.right > rect.left - 12;
          if (overlapsX && r.top < restBottom + 12 && r.bottom > restTop) {
            lift = Math.max(lift, restBottom + 12 - r.top);
          }
        });
        if (Math.abs(lift - liftRef.current) > 0.5) {
          liftRef.current = lift;
          dock.style.translate = lift ? `0 ${-lift}px` : "";
        }
      }

      const index = currentSectionIndex();
      const prevName = adjacentSection(-1)?.dataset.section ?? (index > 0 || window.scrollY > 2 ? "Top" : null);
      const nextName = adjacentSection(1)?.dataset.section ?? null;
      const old = stateRef.current;
      if (
        old.index === index &&
        old.total === sections.length &&
        old.prevName === prevName &&
        old.nextName === nextName
      ) {
        return;
      }
      if (old.index !== index) setDirection(index > old.index ? 1 : -1);
      stateRef.current = { index, total: sections.length, prevName, nextName };
      setState(stateRef.current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [progress]);

  const go = (dir: 1 | -1) => {
    scrollToAdjacentSection(dir);
    // Reflect the new destination right away instead of waiting for the next scroll frame
    requestAnimationFrame(() => window.dispatchEvent(new Event("scroll")));
  };

  const canUp = state.prevName !== null;
  const canDown = state.nextName !== null;

  return (
    <motion.nav
      ref={dockRef}
      className={styles.dock}
      aria-label="Section navigation"
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, delay: 1.1, ease: EASE_OUT }}
    >
      <svg className={styles.progress} aria-hidden="true">
        <rect className={styles.progressTrack} x="0" y="0" width="100%" height="100%" rx="50%" />
        <motion.rect
          className={styles.progressBar}
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="50%"
          pathLength={1}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>

      <button
        type="button"
        className={styles.btn}
        onClick={() => go(-1)}
        disabled={!canUp}
        aria-label={canUp ? `Previous section: ${state.prevName}` : "Previous section"}
      >
        <Chevron direction="up" />
        {canUp && (
          <span className={styles.tip} aria-hidden="true">
            <span className={styles.tipHint}>Back to</span> {state.prevName}
          </span>
        )}
      </button>

      <div className={styles.counter} aria-live="polite">
        <span className={styles.counterWindow}>
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.span
              key={state.index}
              className={styles.counterCurrent}
              custom={direction}
              variants={{
                enter: (d: number) => ({ y: d * 14, opacity: 0, filter: "blur(3px)" }),
                center: { y: 0, opacity: 1, filter: "blur(0px)" },
                exit: (d: number) => ({ y: d * -14, opacity: 0, filter: "blur(3px)" }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              {pad(state.index + 1)}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className={styles.counterRule} aria-hidden="true" />
        <span className={styles.counterTotal}>{pad(state.total)}</span>
      </div>

      <button
        type="button"
        className={`${styles.btn} ${state.index === 0 && canDown ? styles.hint : ""}`}
        onClick={() => go(1)}
        disabled={!canDown}
        aria-label={canDown ? `Next section: ${state.nextName}` : "Next section"}
      >
        <Chevron direction="down" />
        {canDown && (
          <span className={styles.tip} aria-hidden="true">
            <span className={styles.tipHint}>Next</span> {state.nextName}
          </span>
        )}
      </button>
    </motion.nav>
  );
}
