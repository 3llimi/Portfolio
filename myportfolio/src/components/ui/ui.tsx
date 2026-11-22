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

export type CountryCode = "TN" | "RU" | "TR";

const COUNTRY_NAMES: Record<CountryCode, string> = { TN: "Tunisia", RU: "Russia", TR: "Turkey" };

/**
 * Tiny flag drawn as SVG: flag emoji don't render on Windows (they show up as "TN" letters).
 * All three are 3:2 and drawn in their own units, scaled to the pill by CSS.
 */
export function Flag({ country }: { country: CountryCode }) {
  const name = COUNTRY_NAMES[country];
  return (
    <svg className={ui.flag} viewBox={country === "TN" ? "0 0 120 80" : "0 0 30 20"} role="img" aria-label={name}>
      <title>{name}</title>
      {country === "RU" && (
        <>
          <rect width="30" height="20" fill="#fff" />
          <rect y="6.67" width="30" height="6.67" fill="#0039a6" />
          <rect y="13.33" width="30" height="6.67" fill="#d52b1e" />
        </>
      )}
      {country === "TN" && (
        <>
          <rect width="120" height="80" fill="#e70013" />
          <circle cx="60" cy="40" r="20" fill="#fff" />
          <circle cx="60" cy="40" r="15" fill="#e70013" />
          <circle cx="64" cy="40" r="12" fill="#fff" />
          <polygon
            fill="#e70013"
            points="55,40 61.22,37.98 61.22,31.44 65.06,36.73 71.28,34.71 67.44,40 71.28,45.29 65.06,43.27 61.22,48.56 61.22,42.02"
          />
        </>
      )}
      {country === "TR" && (
        <>
          <rect width="30" height="20" fill="#e30a17" />
          <circle cx="10.63" cy="10" r="5" fill="#fff" />
          <circle cx="11.88" cy="10" r="4" fill="#e30a17" />
          <polygon
            fill="#fff"
            points="12.08,10 13.81,9.44 13.81,7.62 14.88,9.09 16.6,8.53 15.54,10 16.6,11.47 14.88,10.91 13.81,12.38 13.81,10.56"
          />
        </>
      )}
    </svg>
  );
}

export { ui };
