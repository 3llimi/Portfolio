"use client";
import React, { useRef, useState } from "react";
import ui from "./ui.module.css";

/**
 * Text whose letters ripple (lift + gold flash) one after another on hover.
 * The wave always plays to the end, even if the pointer leaves halfway, so it never snaps.
 */
export function WaveText({ text, className = "" }: { text: string; className?: string }) {
  const [active, setActive] = useState(false);
  const runningRef = useRef(false);
  const words = text.split(" ");
  const lastIndex = text.replace(/ /g, "").length - 1;
  let index = 0;

  const start = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setActive(true);
  };

  const finish = () => {
    runningRef.current = false;
    setActive(false);
  };

  return (
    <span className={`${ui.wave} ${active ? ui.waveActive : ""} ${className}`} onPointerEnter={start}>
      <span className={ui.srOnly}>{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) => (
          <React.Fragment key={`${word}-${w}`}>
            {w > 0 && " "}
            <span className={ui.waveWord}>
              {Array.from(word).map((char, c) => {
                const i = index++;
                return (
                  <span
                    key={`${char}-${c}`}
                    className={ui.waveChar}
                    style={{ ["--i" as string]: i } as React.CSSProperties}
                    onAnimationEnd={i === lastIndex ? finish : undefined}
                  >
                    {char}
                  </span>
                );
              })}
            </span>
          </React.Fragment>
        ))}
      </span>
    </span>
  );
}

/** Shared visual building blocks so every section looks like part of the same site. */

type OrbPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "none";

const ORB_CLASS: Record<Exclude<OrbPosition, "none">, string> = {
  "top-left": ui.orbTopLeft,
  "top-right": ui.orbTopRight,
  "bottom-left": ui.orbBottomLeft,
  "bottom-right": ui.orbBottomRight,
};

/** Faint grid + two slowly drifting colour glows. Place inside a `position: relative` section. */
export function SectionBackdrop({
  blue = "top-left",
  gold = "bottom-right",
  grid = true,
}: {
  blue?: OrbPosition;
  gold?: OrbPosition;
  grid?: boolean;
}) {
  return (
    <div className={ui.backdrop} aria-hidden="true">
      {grid && <div className={ui.grid} />}
      {blue !== "none" && <div className={`${ui.orb} ${ui.orbBlue} ${ORB_CLASS[blue]}`} />}
      {gold !== "none" && <div className={`${ui.orb} ${ui.orbGold} ${ORB_CLASS[gold]}`} />}
    </div>
  );
}

/** Pointer handler that feeds the cursor position to a `.card` spotlight. */
export function trackSpotlight(event: React.PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

/** Text with a leading "*" rendered as the gold star used across the site. */
export function Starred({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className={ui.star} aria-hidden="true">*</span>
      {children}
    </>
  );
}

export { ui };
