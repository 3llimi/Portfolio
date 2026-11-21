"use client";
import Image from "next/image";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import styles from "./LiveseyGuide.module.css";

/**
 * Doctor Livesey — a little character that lives on top of the page.
 *
 * He stands on elements marked with `data-perch="<Section>"` and rides along with them as the page
 * scrolls. When his perch leaves the screen or a new section comes into view, he leaps (anticipation
 * crouch → stretched take-off → parabolic arc, sometimes a flip → squash landing with a dust puff)
 * onto a perch in the new section. Left alone he hops around, bounces and looks about; clicking him
 * makes him backflip. A corner toggle sends him away or brings him back (remembered per browser).
 */

const getImagePath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;

const LINES: Record<string, string> = {
  Home: "Ha-ha-ha! Welcome aboard, matey!",
  About: "A software engineer? Splendid fellow!",
  Skills: "Rust, Go, Kubernetes… ho-ho, a fine crew!",
  Projects: "Treasure! Every last piece of it!",
  GitHub: "Read the README. Doctor's orders!",
  Contact: "Write to him, matey! Ha-ha-ha!",
};

const CLICK_LINES = [
  "Ha-ha-ha-ha-ha!",
  "Steady as she goes!",
  "I'm a doctor, not a recruiter… but hire him!",
  "Ho-ho! Mind the scurvy.",
  "To the treasure, lads!",
];

const STORAGE_KEY = "livesey-enabled";
const RATIO = 339 / 360; // sprite height / width
const FOOT_INSET = 6; // the sprite's feet sit slightly above its bottom edge
const RAIL_GUTTER = 30; // keep clear of the custom scroll rail on the right

type Point = { x: number; y: number };
type PerchTarget = { el: HTMLElement | null; anchor: number; section: string };
type Target = PerchTarget | { point: Point };
type Jump = {
  fromX: number;
  fromY: number;
  start: number;
  duration: number;
  arc: number;
  spin: number;
  dir: 1 | -1;
  to: Target;
  onLand?: () => void;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const readEnabled = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
};

const saveEnabled = (on: boolean) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* storage unavailable — fine, it just won't be remembered */
  }
};

type Controller = { click: () => void; summon: () => void; dismiss: () => void };

export default function LiveseyGuide() {
  const [enabled, setEnabled] = useState(true);
  const [present, setPresent] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [airborne, setAirborne] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [dust, setDust] = useState(0);
  const [width, setWidth] = useState(96);
  const [bubblePos, setBubblePos] = useState<{ left: number; tail: number; below: boolean } | null>(null);

  // Position (viewport px of his top-left corner) and body pose
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const rotate = useMotionValue(0);
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const appear = useMotionValue(1);

  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const controller = useRef<Controller | null>(null);

  // ------------------------------------------------------------------
  // The animation engine: one rAF loop driving position from perches
  // ------------------------------------------------------------------
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = {
      mode: "hidden" as "hidden" | "idle" | "jumping",
      perch: null as HTMLElement | null,
      anchor: 0.5,
      perchSection: "Home",
      greeted: "",
      facing: 1 as 1 | -1,
      jump: null as Jump | null,
      nextIdleAt: 0,
      W: 96,
    };
    let frame = 0;
    let bubbleTimer = 0;

    const H = () => state.W * RATIO;

    const say = (text: string, ms = 4200) => {
      setBubble(text);
      window.clearTimeout(bubbleTimer);
      bubbleTimer = window.setTimeout(() => setBubble(null), ms);
    };

    const setFace = (dir: 1 | -1) => {
      if (state.facing !== dir) {
        state.facing = dir;
        setFacing(dir);
      }
    };

    const updateSize = () => {
      state.W = window.innerWidth <= 600 ? 60 : 96;
      setWidth(state.W);
    };

    const currentSection = () => {
      const probe = window.innerHeight * 0.5;
      let name = "Home";
      document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
        if (el.getBoundingClientRect().top <= probe) name = el.dataset.section ?? name;
      });
      return name;
    };

    /** Where his top-left corner goes to stand on `el` at `anchor` (0–1 across its width). */
    const standPoint = (el: HTMLElement, anchor: number) => {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const px = clamp(r.left + r.width * anchor - state.W / 2, 8, vw - state.W - RAIL_GUTTER);
      const py = r.top - H() + FOOT_INSET;
      const visible = r.width > 0 && r.height > 0 && py > 6 && r.top < vh - 12 && r.right > 0 && r.left < vw;
      return { x: px, y: py, visible };
    };

    const floorPoint = (anchor: number): Point => ({
      x: 12 + (window.innerWidth - state.W - 12 - RAIL_GUTTER) * anchor,
      y: window.innerHeight - H() - 8,
    });

    const anchorFor = (el: HTMLElement) => {
      const fixed = el.dataset.perchX;
      return fixed ? Number(fixed) : rand(0.18, 0.82);
    };

    const visiblePerches = (section: string) =>
      Array.from(document.querySelectorAll<HTMLElement>(`[data-perch="${section}"]`)).filter(
        (el) => standPoint(el, 0.5).visible,
      );

    const pickPerch = (section: string, avoid: HTMLElement | null): PerchTarget | null => {
      const options = visiblePerches(section);
      if (options.length === 0) return null;
      const fresh = options.filter((el) => el !== avoid);
      const el = (fresh.length ? fresh : options)[Math.floor(Math.random() * (fresh.length ? fresh.length : options.length))];
      return { el, anchor: anchorFor(el), section };
    };

    const resolve = (target: Target): Point => {
      if ("point" in target) return target.point;
      return target.el ? standPoint(target.el, target.anchor) : floorPoint(target.anchor);
    };

    const squash = (sx: number[], sy: number[], duration: number) => {
      animate(scaleX, sx, { duration, ease: "easeOut" });
      animate(scaleY, sy, { duration, ease: "easeOut" });
    };

    /** Leap to a target: crouch, take off, arc through the air, land. */
    const jumpTo = (
      target: Target,
      opts: { arc?: number; spin?: number; duration?: number; onLand?: () => void } = {},
    ) => {
      const now = performance.now();
      const fromX = x.get();
      const fromY = y.get();
      const dest = resolve(target);
      const dx = dest.x - fromX;
      const dist = Math.hypot(dx, dest.y - fromY);
      const dir: 1 | -1 = Math.abs(dx) < 2 ? state.facing : dx > 0 ? 1 : -1;

      if (reduceMotion) {
        x.set(dest.x);
        y.set(dest.y);
        land(target, opts.onLand);
        return;
      }

      setFace(dir);
      setBubble(null);
      state.mode = "jumping";
      const crouch = 140;
      squash([1, 1.14], [1, 0.8], crouch / 1000); // anticipation
      window.setTimeout(() => {
        squash([1.14, 0.88, 1], [0.8, 1.16, 1], 0.42); // stretch on take-off
        setAirborne(true);
      }, crouch);

      const autoSpin = dist > 650 && Math.random() < 0.5 ? dir * 360 : 0;
      const wantedArc = opts.arc ?? clamp(70 + dist * 0.28, 90, 280);
      const maxArc = Math.max(36, (fromY + dest.y) / 2 - 12); // apex stays inside the viewport
      state.jump = {
        fromX,
        fromY,
        start: now + crouch,
        duration: (opts.duration ?? clamp(0.5 + dist / 1900, 0.55, 1.15)) * 1000,
        arc: Math.min(wantedArc, maxArc),
        spin: opts.spin ?? autoSpin,
        dir,
        to: target,
        onLand: opts.onLand,
      };
    };

    const land = (target: Target, onLand?: () => void) => {
      state.mode = "idle";
      state.jump = null;
      rotate.set(0);
      setAirborne(false);
      if ("point" in target) {
        state.perch = null;
      } else {
        state.perch = target.el;
        state.anchor = target.anchor;
        state.perchSection = target.section;
        if (state.greeted !== target.section) {
          state.greeted = target.section;
          window.setTimeout(() => say(LINES[target.section] ?? LINES.Home), 260);
        }
      }
      if (!reduceMotion) {
        squash([1.28, 0.95, 1.03, 1], [0.7, 1.08, 0.98, 1], 0.5);
        setDust((d) => d + 1);
      }
      state.nextIdleAt = performance.now() + rand(5500, 9500);
      onLand?.();
    };

    /** Something to do when nobody is watching. */
    const idleAction = () => {
      const roll = Math.random();
      if (roll < 0.45) {
        const next = pickPerch(state.perchSection, state.perch);
        if (next && next.el !== state.perch) {
          jumpTo(next);
          return;
        }
      }
      if (roll < 0.75 && state.perch) {
        // shuffle along the same perch with a small hop
        const anchor = state.perch.dataset.perchX ? state.anchor : clamp(state.anchor + rand(-0.35, 0.35), 0.12, 0.88);
        jumpTo({ el: state.perch, anchor, section: state.perchSection }, { arc: 46, duration: 0.5, spin: 0 });
        return;
      }
      // look around
      setFace(state.facing === 1 ? -1 : 1);
      squash([1, 1.08, 1], [1, 0.93, 1], 0.35);
      state.nextIdleAt = performance.now() + rand(4000, 7000);
    };

    const tick = (now: number) => {
      if (state.mode === "jumping" && state.jump) {
        const j = state.jump;
        if (now >= j.start) {
          const t = clamp((now - j.start) / j.duration, 0, 1);
          // Track the target live so landings stay exact while the page scrolls,
          // but never chase it off-screen (if it's gone on landing he simply picks another perch)
          const live = resolve(j.to);
          const dest = {
            x: clamp(live.x, 8, window.innerWidth - state.W - RAIL_GUTTER),
            y: clamp(live.y, 8, window.innerHeight - H() - 8),
          };
          const ex = easeInOutSine(t);
          x.set(j.fromX + (dest.x - j.fromX) * ex);
          // Arc height is re-capped every frame against the live destination so the apex stays on screen
          const arc = Math.min(j.arc, Math.max(20, Math.min(j.fromY, dest.y) - 10));
          y.set(Math.max(2, j.fromY + (dest.y - j.fromY) * t - arc * 4 * t * (1 - t)));
          rotate.set(j.spin ? j.spin * easeInOutCubic(t) : j.dir * 10 * Math.sin(Math.PI * t));
          if (t >= 1) land(j.to, j.onLand);
        }
      } else if (state.mode === "idle") {
        const section = currentSection();
        if (state.perch) {
          const p = standPoint(state.perch, state.anchor);
          if (section !== state.perchSection) {
            const next = pickPerch(section, null);
            if (next) jumpTo(next);
            else if (!p.visible) jumpTo({ el: null, anchor: rand(0.1, 0.9), section });
            else {
              x.set(p.x);
              y.set(p.y);
            }
          } else if (!p.visible) {
            const next = pickPerch(section, state.perch);
            jumpTo(next ?? { el: null, anchor: rand(0.1, 0.9), section });
          } else {
            x.set(p.x); // ride along with the page
            y.set(p.y);
          }
        } else {
          // standing on the floor: hop onto something as soon as it appears
          const next = pickPerch(section, null);
          if (next) jumpTo(next);
          else {
            const p = floorPoint(state.anchor);
            x.set(p.x);
            y.set(p.y);
            state.perchSection = section;
          }
        }
        if (state.mode === "idle" && now > state.nextIdleAt) idleAction();
      }
      frame = requestAnimationFrame(tick);
    };

    const toggleCenter = (): Point => {
      const r = toggleRef.current?.getBoundingClientRect();
      if (!r) return { x: 16, y: window.innerHeight - H() - 16 };
      return { x: r.left + r.width / 2 - state.W / 2, y: r.top + r.height / 2 - H() / 2 };
    };

    const summon = () => {
      if (state.mode !== "hidden") return;
      const start = toggleCenter();
      x.set(start.x);
      y.set(start.y);
      appear.set(0.2);
      setPresent(true);
      state.mode = "idle";
      state.greeted = "";
      animate(appear, 1, { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] });
      const section = currentSection();
      jumpTo(pickPerch(section, null) ?? { el: null, anchor: 0.5, section }, { arc: 220 });
    };

    const dismiss = () => {
      if (state.mode === "hidden") return;
      say("Farewell, matey!", 1000);
      window.setTimeout(() => {
        jumpTo({ point: toggleCenter() }, {
          arc: 160,
          spin: -360 * state.facing,
          duration: 0.75,
          onLand: () => {
            state.mode = "hidden";
            setPresent(false);
            setBubble(null);
          },
        });
        animate(appear, 0.15, { duration: 0.85, ease: "easeIn" });
      }, 450);
    };

    const click = () => {
      if (state.mode !== "idle") return;
      const target: Target = state.perch
        ? { el: state.perch, anchor: state.anchor, section: state.perchSection }
        : { el: null, anchor: state.anchor, section: state.perchSection };
      jumpTo(target, { arc: 95, spin: -360 * state.facing, duration: 0.75 });
      window.setTimeout(() => say(CLICK_LINES[Math.floor(Math.random() * CLICK_LINES.length)], 2800), 950);
    };

    controller.current = { click, summon, dismiss };

    updateSize();
    window.addEventListener("resize", updateSize);
    frame = requestAnimationFrame(tick);

    // First appearance, after the hero intro has played
    const on = readEnabled();
    setEnabled(on);
    const intro = on ? window.setTimeout(summon, 1700) : 0;

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(intro);
      window.clearTimeout(bubbleTimer);
      window.removeEventListener("resize", updateSize);
      controller.current = null;
    };
  }, [appear, rotate, scaleX, scaleY, x, y]);

  // Keep the speech bubble on screen with its tail pointing at his head
  useLayoutEffect(() => {
    const el = bubbleRef.current;
    if (!bubble || !el) return;
    const bw = el.offsetWidth;
    const guideX = x.get();
    const preferred = guideX > window.innerWidth / 2 ? width - 10 - bw : 10;
    const left = clamp(preferred, 8 - guideX, window.innerWidth - RAIL_GUTTER - guideX - bw);
    const tail = clamp(width / 2 - left - 5, 14, bw - 24);
    const below = y.get() - el.offsetHeight - 14 < 8;
    setBubblePos({ left, tail, below });
  }, [bubble, width, x, y]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    saveEnabled(next);
    if (next) controller.current?.summon();
    else controller.current?.dismiss();
  };

  const height = width * RATIO;

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={`${styles.toggle} ${enabled ? "" : styles.toggleOff}`}
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? "Hide Doctor Livesey" : "Bring back Doctor Livesey"}
      >
        <Image src={getImagePath("/icons/doctor-livsey-favicon-64.png")} alt="" width={64} height={64} />
        <span className={styles.toggleSlash} aria-hidden="true" />
        <span className={styles.toggleTip}>{enabled ? "Hide Livesey" : "Bring Livesey back"}</span>
      </button>

      {present && (
        <motion.div className={styles.guide} style={{ x, y, width, scale: appear }}>
          <AnimatePresence>
            {bubble && (
              <motion.div
                key={bubble}
                ref={bubbleRef}
                className={`${styles.bubble} ${bubblePos?.below ? styles.bubbleBelow : ""}`}
                style={{
                  left: bubblePos?.left ?? 10,
                  ["--tail" as string]: `${bubblePos?.tail ?? 18}px`,
                  transformOrigin: `${(bubblePos?.tail ?? 18) + 5}px ${bubblePos?.below ? "0%" : "100%"}`,
                }}
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.92, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
              >
                <span className={styles.bubbleStar} aria-hidden="true">*</span>
                {bubble}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            className={styles.sprite}
            style={{ height }}
            onClick={() => controller.current?.click()}
            aria-label="Doctor Livesey. Click him!"
          >
            <span className={styles.shadow} data-airborne={airborne} aria-hidden="true" />
            <AnimatePresence>
              {dust > 0 && (
                <motion.span
                  key={dust}
                  className={styles.dust}
                  aria-hidden="true"
                  initial={{ opacity: 0.7, scaleX: 0.4, scaleY: 0.5 }}
                  animate={{ opacity: 0, scaleX: 1.6, scaleY: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
            <span className={styles.flip} style={{ transform: `scaleX(${facing})` }}>
              <motion.span className={styles.spin} style={{ rotate }}>
                <motion.span className={styles.squash} style={{ scaleX, scaleY }}>
                  <span className={`${styles.pose} ${airborne ? "" : styles.breathing}`}>
                    <Image
                      src={getImagePath("/icons/DoctorLiveseyR.png")}
                      alt=""
                      width={360}
                      height={339}
                      draggable={false}
                    />
                  </span>
                </motion.span>
              </motion.span>
            </span>
          </button>
        </motion.div>
      )}
    </>
  );
}
