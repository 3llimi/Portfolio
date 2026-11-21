"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { getLenis } from "@/components/scroll/smoothScroll";
import styles from "./LiveseyGuide.module.css";
import {
  CEL,
  CEL_ANCHOR,
  CEL_SIZE,
  CelSprite,
  WALK_CYCLE_MS,
  WALK_TRAVEL_PX,
  preloadCelAtlases,
  type CelClipName,
  type CelEnd,
  type CelFrameRef,
  type CelLink,
  type CelSpriteHandle,
} from "./liveseyCel";

/**
 * Doctor Livesey — the roaming guide, animated with the Cel Edition pack
 * (frame list in ./animations.json; sprite atlases served from public/livesey).
 *
 * This controller owns page position, visibility, scroll observation and speech:
 * - He stands on elements marked `data-perch="<Section>"`, rides along with them while scrolling and
 *   leaps to the next section once the scroll is about to settle (aimed at where the page will stop),
 *   so he doesn't chain hops mid-scroll. `data-perch-surface="text"` makes him stand on the tops of
 *   the letters rather than on the line box; `data-perch-x="0.5"` / `"0.2-0.6"` fixes or limits where
 *   along the surface his feet go. Destinations are scored (inside the reading band, a short hop), not
 *   random, and a spot where his body would cover another perch or a `data-perch-obstacle` above it
 *   is never used.
 * - Positioning runs after every other rAF callback of the frame (Lenis, the carousels), so he
 *   never trails a frame behind the ledge he stands on.
 * - Linger on a project card (or focus its README button) → notice → swagger one walk cycle (two
 *   steps) if that reaches the card, otherwise leap onto its near edge → present; right beside it,
 *   notice → present directly. The hand stays out while the visitor reads, then the release gesture
 *   folds it back.
 * - Fast flick (page or carousel), or his ledge leaving the screen mid-scroll → he vanishes in a puff
 *   of smoke; as the scroll settles he pops back in with another puff on the best perch in view.
 * - Tap / keyboard → laugh (never stacks). A dialog opens → he clears out; a selected skill gets a
 *   nod once its dialog closes. One short line of speech on a relevant section change.
 */

const LiveseyPreview = dynamic(() => import("./LiveseyPreview"), { ssr: false });

const getImagePath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;

/**
 * What he says, in the meme Livesey's voice: swaggering, unshakeable, always laughing — English
 * with a splash of Russian. (юнга = cabin boy, красавчик = handsome devil / legend, молодец = well
 * done, вот это да = now that's something, шикарно = gorgeous, сокровища = treasure, доктор прописал
 * = doctor's orders, огонь = fire, смелее = go on, be bold, полный вперёд = full speed ahead,
 * взгляни-ка = take a look, красота = beauty.) Each section rotates through its lines.
 */
const LINES: Record<string, string[]> = {
  Home: [
    "Ха-ха-ха-ха! Welcome aboard, юнга!",
    "Doctor Livesey, at your service! Ха-ха-ха!",
    "Добро пожаловать! Fine ship, fine captain!",
  ],
  About: [
    "A software engineer? Красавчик!",
    "Studies in Russia, ships real software — молодец!",
    "Clean architecture? The doctor approves. Ха-ха!",
  ],
  Skills: [
    "Rust, Go, Kubernetes… вот это да!",
    "What a crew of tools — шикарно!",
    "Ха-ха-ха! So many skills, not a drop of fear!",
  ],
  Projects: [
    "Сокровища! Every last piece of it!",
    "Hackathons, olympiads… красавчик!",
    "Ха-ха! A whole chest of trophies, юнга!",
  ],
  GitHub: [
    "Read the README. Доктор прописал!",
    "Fine code, юнга. Огонь! Ха-ха-ха!",
    "Pick any repo — all of them красавчики!",
  ],
  Contact: [
    "Write to him, юнга! Ха-ха-ха-ха!",
    "Don't be shy — смелее! He answers.",
    "Полный вперёд! Send that message!",
  ],
};
/** when he opens his hand over a project card (said now and then, not every time) */
const PRESENT_LINES = ["Взгляни-ка! A fine one, this.", "Красота! Have a look, юнга.", "Ха! Open the README — доктор прописал!"];
/** the famous laugh, when he's tapped */
const LAUGH_LINE = "Ха-ха-ха-ха-ха!";
const PRESENT_LINE_CHANCE = 0.45;
/** runs of Russian words (with the spaces/hyphens between them), so the bubble can style them */
const CYRILLIC_RUN = /([А-Яа-яЁё]+(?:[ -]+[А-Яа-яЁё]+)*)/;

const STORAGE_KEY = "livesey-enabled";
const RAIL_GUTTER = 30; // keep clear of the custom scroll rail on the right
/** cel scale: matches the site's character size (≈96 px wide on desktop, ≈60 px on phones) */
const SCALE_DESKTOP = 0.52;
const SCALE_MOBILE = 0.33;
/** horizontal extent of the character inside the 256-px cel (for keeping him on screen) */
const CHAR_LEFT = 18;
const CHAR_RIGHT = 210;

const HAT_Y = 16; // top of his hat inside the cel
const DWELL_MS = 140; // linger this long on a project before he reacts
const CARD_COOLDOWN_MS = 8000; // don't re-present the same card over and over
const RELEASE_GRACE_MS = 450; // visitor left the card → fold the hand back after this
const FAST_SCROLL = 2200; // px/s: above this he poofs away
const BRISK_SCROLL = 320; // px/s: losing his ledge faster than reading pace → poof away; slower → hop now
const BELT_WALK_MAX = 160; // px/s: a carousel faster than this carries him instead of being walked against
const BELT_FAST = 320; // px/s: a carousel flung this fast is no place to land
const SETTLED_SPEED = 180; // px/s: slow enough to commit to a destination…
const SETTLED_AHEAD = 40; // …with Lenis this close to where it will stop
const GLIDE_COMMIT_PX = 320; // or: Lenis has at most this far left to glide…
const INPUT_QUIET_MS = 160; // …and the visitor stopped scrolling this long ago (wheel notches pause ~100 ms)
const PICK_RETRY_MS = 400; // when no perch fits, look again this often (not every frame)

const JUMP_FRAMES = CEL.clips.jump.frames.length;
const TAKEOFF_FRAME = Math.round(JUMP_FRAMES * 0.25); // travel arc starts here…
const CONTACT_FRAME = Math.round(JUMP_FRAMES * 0.78); // …and touches down here; the rest settles
const QUICK_CROUCH_FRAME = 4; // reactive jumps skip the slow start of the wind-up
const PRESENT_HOLD = CEL.clips.present.frames[CEL.clips.present.frames.length - 1].id;
/** gestures play a little brisker than drawn so he answers the visitor quickly (walk stays 1× — it drives travel) */
const CLIP_SPEED: Partial<Record<string, number>> = {
  notice: 1.5,
  present: 1.2,
  nod: 1.1,
  "notice-release": 1.25,
  "present-release": 1.25,
};
const POOF_MS = 620; // how long the smoke cloud lives
const POOF_MIN_MS = 380; // stay gone at least this long, so the puff out isn't immediately a puff in
const SHOWN_MIN_MS = 400; // …and stay visible at least this long after popping back in
const LOOK_DEAD_ZONE = 40; // cel px either side of him where the cursor doesn't make him turn
const LOOK_TURN_DELAY_MS = 140; // the cursor must stay on his other side this long before he turns
const LOOK_MAX_LEAN = 4; // degrees he leans back / forward to look up / down at the cursor
const LOOK_HEAD_Y = 60; // cel px from the top to roughly his eyes

/**
 * Finale: when the visitor reaches "Get in touch", Livesey bows out in a puff and the whole crew
 * (Jim, the doctor, the squire) strolls along the footer line, round and round (off the right edge,
 * back in from the left), for as long as the visitor stays. When they leave, the crew vanishes in
 * smoke and the doctor pops back. The walk is a 15-cel strip made from the original GIF; cels advance
 * with the distance walked, so the planted shoes don't skate.
 */
const PARADE_SRC = "/livesey/walk-trio.webp";
const PARADE_FRAMES = 15;
const PARADE_FRAME_W = 466; // strip px per cel
const PARADE_FRAME_H = 300;
const PARADE_FEET = 298; // strip px from the top to the soles
const PARADE_STEP = 6.75; // strip px a planted shoe travels per cel (measured)
const PARADE_FPS = 24; // a little brisker than the original's 16.7 fps swagger
const PARADE_H_DESKTOP = 150;
const PARADE_H_MOBILE = 95;
const PARADE_ARRIVE_MS = 700; // the visitor has to stay at "Get in touch" this long first
const PARADE_REPEAT_MS = 1500; // after they leave, wait at least this long before coming back
const PARADE_LEAVE_MS = 300; // the visitor must be out of "Get in touch" this long before the crew goes
/** where each of the three stands across a cel (fraction of its width), for the farewell puffs */
const PARADE_CREW_X = [0.16, 0.48, 0.8];
const BODY_MID = 110; // cel px above his feet where the puff is centred
/** the smoke cloud: overlapping puffs (centre offset, diameter, drift — at desktop scale) and gold `*` sparks */
const PUFFS = [
  { x: 0, y: 0, r: 76, dx: 0, dy: -12, d: 0 },
  { x: -28, y: 10, r: 57, dx: -30, dy: 4, d: 0.02 },
  { x: 28, y: 8, r: 60, dx: 32, dy: 2, d: 0.03 },
  { x: -16, y: -28, r: 53, dx: -18, dy: -30, d: 0.05 },
  { x: 20, y: -30, r: 51, dx: 22, dy: -32, d: 0.04 },
  { x: -40, y: -10, r: 39, dx: -40, dy: -14, d: 0.07 },
  { x: 42, y: -12, r: 39, dx: 42, dy: -16, d: 0.06 },
  { x: 0, y: 30, r: 51, dx: 0, dy: 14, d: 0.03 },
];
const SPARKS = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
  const dist = 62 + (i % 3) * 10;
  return { x: Math.round(Math.cos(a) * dist), y: Math.round(Math.sin(a) * dist * 0.85), d: 0.04 + (i % 3) * 0.03 };
});
type Poof = { id: number; x: number; y: number; s: number };

type Point = { x: number; y: number };
type PerchTarget = { el: HTMLElement | null; anchor: number; section: string };
type Target = PerchTarget | { point: Point };
type Mode = "hidden" | "idle" | "walking" | "takeoff" | "jumping" | "poofed" | "parade" | "away";
type Flight = {
  fromX: number;
  fromY: number;
  start: number;
  duration: number;
  arc: number;
  to: Target;
  onLand?: () => void;
  frameFrom: number; // airborne cel the flight starts from (later than take-off after a mid-air redirect)
  checkedAt: number;
};
type Seq = {
  name: string;
  frames: CelFrameRef[];
  end: CelEnd | "next";
  next?: { clip: CelClipName; frame: number };
  speed?: number;
};
/** the walkable top edge of a perch, in viewport px */
type Surface = { left: number; right: number; top: number };
/** a text perch's glyph-tight surface, relative to the element's box (re-measured when it resizes) */
type TextMetrics = {
  w: number;
  h: number;
  at: number;
  dl: number;
  dr: number;
  dt: number;
  db: number;
  glyphs: { el: HTMLElement; l: number; r: number }[];
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

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

/** the "you can hide him" hint shows every time the page loads with him enabled */
const HINT_DELAY_MS = 2600; // after he has flown out of the button and landed
const HINT_MS = 7000;

type Controller = { tap: () => void; summon: () => void; dismiss: () => void };

export default function LiveseyGuide() {
  const [enabled, setEnabled] = useState(true);
  const [present, setPresent] = useState(false);
  const [away, setAway] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [airborne, setAirborne] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [dust, setDust] = useState(0);
  const [scale, setScale] = useState(SCALE_DESKTOP);
  const [bubblePos, setBubblePos] = useState<{ left: number; tail: number; below: boolean } | null>(null);
  const [preview, setPreview] = useState(false);
  const [poofs, setPoofs] = useState<Poof[]>([]);
  const [hint, setHint] = useState<string | null>(null); // the verb: "Click" or "Tap"
  const [parade, setParade] = useState(false);

  // his cel's top-left on screen; written straight to the DOM once per frame (no motion-value hop)
  const pos = useRef<Point>({ x: -400, y: -400 });
  const guideEl = useRef<HTMLDivElement | null>(null);
  const appear = useMotionValue(1);

  const placeGuide = useCallback((node: HTMLDivElement | null) => {
    guideEl.current = node;
    if (node) node.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
  }, []);

  const sprite = useRef<CelSpriteHandle | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const leanEl = useRef<HTMLSpanElement | null>(null);
  const paradeEl = useRef<HTMLDivElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const controller = useRef<Controller | null>(null);

  const box = CEL_SIZE * scale;

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("livesey-preview")) {
      setPreview(true);
    }
  }, []);

  // ------------------------------------------------------------------
  // Engine: position controller + cel player on one rAF loop
  // ------------------------------------------------------------------
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const params = new URLSearchParams(window.location.search);
    // dev-only playback rate, e.g. ?livesey-speed=0.25 for quarter speed
    const rate =
      process.env.NODE_ENV !== "production" && params.has("livesey-speed")
        ? clamp(Number(params.get("livesey-speed")) || 1, 0.05, 4)
        : 1;

    const x = {
      get: () => pos.current.x,
      set: (v: number) => {
        pos.current.x = v;
      },
    };
    const y = {
      get: () => pos.current.y,
      set: (v: number) => {
        pos.current.y = v;
      },
    };
    let shownX = NaN;
    let shownY = NaN;
    const commit = () => {
      const g = guideEl.current;
      const { x: px, y: py } = pos.current;
      if (!g || (px === shownX && py === shownY)) return;
      shownX = px;
      shownY = py;
      g.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    };

    const st = {
      mode: "hidden" as Mode,
      s: SCALE_DESKTOP,
      perch: null as HTMLElement | null,
      anchor: 0.5,
      perchSection: "Home",
      greeted: "",
      facing: 1 as 1 | -1,
      flight: null as Flight | null,
      pendingFlight: null as null | { target: Target; arc?: number; onLand?: () => void },
      nextIdleAt: 0,
      last: performance.now(),
      // cel player
      seq: { name: "idle", frames: CEL.clips.idle.frames, end: "loop" } as Seq,
      frame: 0,
      t: 0,
      onEnd: null as null | (() => void),
      holdFired: false,
      // walking
      walkCyclesLeft: 0,
      afterWalk: null as null | (() => void),
      // treadmill: walking against the moving project carousel so he strides in place on it
      treadmill: false,
      treadmillStop: false,
      walkRate: 1,
      ledgeV: 0, // smoothed horizontal speed of the ledge under him (px/s), for start/stop decisions
      beltSpeed: 0, // smoothed speed of the project carousel, wherever he is (px/s)
      beltRef: null as HTMLElement | null,
      beltRefLeft: 0,
      takeoffAt: 0,
      poofedAt: 0,
      shownAt: 0,
      // the finale walk
      parade: null as null | { x: number; dist: number },
      paradeAt: -Infinity,
      paradeArmed: true, // re-armed each time the visitor leaves "Get in touch"
      contactSince: 0,
      contactLeftAt: 0,
      beltAdvanceMs: 0, // walk-clip time to advance this frame, locked to how far the cards moved
      noticeAfterStep: null as HTMLElement | null, // a project noticed mid-stride waits for the settle
      lastLedge: null as HTMLElement | null,
      lastLedgeLeft: 0,
      // what caught his attention
      target: null as HTMLElement | null,
      targetActive: false,
      targetLeftAt: 0,
      presenting: false,
      pendingTarget: null as HTMLElement | null,
      noticedAt: new WeakMap<HTMLElement, number>(),
      pendingNod: null as HTMLElement | null,
      // scrolling
      lastScrollY: window.scrollY,
      scrollSpeed: 0,
      scrollDir: 1 as 1 | -1,
      nextPickAt: 0,
      // the visitor's mouse (viewport px); he turns and leans toward it while idle
      cursor: { x: 0, y: 0, inside: false },
      lookWant: 0 as 1 | -1 | 0,
      lookWantSince: 0,
      lean: 0,
      lastTarget: NaN, // Lenis' target scroll last frame: it only moves while the visitor scrolls
      targetMovedAt: 0,
    };
    const textMetrics = new WeakMap<HTMLElement, TextMetrics>();
    let frame = 0;
    let bubbleTimer = 0;
    let dwellTimer = 0;
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms / rate);
      timers.add(id);
    };

    const boxPx = () => CEL_SIZE * st.s;
    const walkTravel = () => WALK_TRAVEL_PX * st.s; // px per walk cycle (two steps)

    // ---------------- speech ----------------
    /** a random line from `list`, never the same one twice in a row for the same `key` */
    const lastLine = new Map<string, string>();
    const lineFor = (key: string, list: string[]) => {
      const fresh = list.length > 1 ? list.filter((l) => l !== lastLine.get(key)) : list;
      const line = fresh[Math.floor(Math.random() * fresh.length)];
      lastLine.set(key, line);
      return line;
    };
    const sectionLine = (section: string) => lineFor(section, LINES[section] ?? LINES.Home);
    /** now and then a word about the card he is presenting */
    const maybeRemark = () => {
      if (Math.random() < PRESENT_LINE_CHANCE) say(lineFor("present", PRESENT_LINES), 2800);
    };

    const say = (text: string, ms = 4200) => {
      setBubble(text);
      window.clearTimeout(bubbleTimer);
      bubbleTimer = window.setTimeout(() => setBubble(null), ms);
    };

    const setFace = (dir: 1 | -1) => {
      if (st.facing !== dir) {
        st.facing = dir;
        setFacing(dir);
      }
    };

    // ---------------- cel player ----------------
    const showFrame = (id: string) => sprite.current?.setFrame(id);

    const startSeq = (seq: Seq, from = 0, onEnd: (() => void) | null = null) => {
      st.seq = { ...seq, speed: seq.speed ?? CLIP_SPEED[seq.name] ?? 1 };
      st.frame = clamp(from, 0, seq.frames.length - 1);
      st.t = 0;
      st.onEnd = onEnd;
      st.holdFired = false;
      if (reduceMotion) {
        // static neutral cel at rest, or the static presenting cel when relevant
        const presentLike = seq.name === "present" || seq.name === "notice-present";
        st.seq = presentLike
          ? { name: "present", frames: CEL.clips.present.frames, end: "hold" }
          : { name: "idle", frames: CEL.clips.idle.frames, end: "loop" };
        st.onEnd = null;
        showFrame(presentLike ? PRESENT_HOLD : CEL.defaultFrame);
        if (onEnd) queueMicrotask(onEnd);
        return;
      }
      showFrame(seq.frames[st.frame].id);
    };

    /** play a clip; `onEnd` fires when it finishes (or, for held clips, when the hold is reached) */
    const playClip = (name: CelClipName, opts: { from?: number; onEnd?: () => void } = {}) => {
      const c = CEL.clips[name];
      startSeq({ name, frames: c.frames, end: c.end }, opts.from ?? 0, opts.onEnd ?? null);
    };

    /** play a transition / release, then continue into its nextClip at nextFrame */
    const playLink = (link: CelLink, name: string, onEnd?: () => void) => {
      startSeq(
        { name, frames: link.frames, end: "next", next: { clip: link.nextClip as CelClipName, frame: link.nextFrame } },
        0,
        onEnd ?? null,
      );
    };

    const idle = () => playClip("idle");

    const finishSeq = () => {
      const seq = st.seq;
      const done = st.onEnd;
      if (seq.end === "next" && seq.next) {
        const nextEnd = CEL.clips[seq.next.clip].end;
        playClip(seq.next.clip, { from: seq.next.frame, onEnd: nextEnd === "loop" ? undefined : done ?? undefined });
        if (nextEnd === "loop") done?.();
        return;
      }
      if (seq.end === "hold") {
        st.frame = seq.frames.length - 1;
        if (!st.holdFired) {
          st.holdFired = true;
          st.onEnd = null;
          done?.();
        }
        return;
      }
      // "idle"
      st.onEnd = null;
      idle();
      done?.();
    };

    const tickPlayer = (dtMs: number) => {
      if (st.mode === "jumping" || st.mode === "hidden" || reduceMotion) return;
      // on the carousel the stride is distance-locked: the clip advances exactly as far as the cards
      // moved, so the planted shoe travels with the card no matter how uneven the frame timing is
      // when stopping he always finishes the step (a belt that halts mid-stride must not freeze him)
      st.t +=
        st.seq.name === "walk" && st.treadmill
          ? st.treadmillStop
            ? Math.max(st.beltAdvanceMs, dtMs * rate * (st.noticeAfterStep ? 1.8 : 0.7)) // hurry to contact when called
            : st.beltAdvanceMs
          : dtMs * rate * (st.seq.speed ?? 1);
      st.beltAdvanceMs = 0;
      for (let guard = 0; guard < 12; guard++) {
        const seq = st.seq;
        const cur = seq.frames[st.frame];
        if (st.t < cur.ms) break;
        const lastFrame = st.frame === seq.frames.length - 1;
        if (lastFrame && seq.end === "hold") {
          st.t = cur.ms;
          finishSeq();
          break;
        }
        st.t -= cur.ms;
        if (lastFrame && seq.end !== "loop") {
          finishSeq();
          continue;
        }
        st.frame = lastFrame ? 0 : st.frame + 1;
        showFrame(seq.frames[st.frame].id);

        // carousel stopped: step out of the stride on the next contact (A at frame 0, B at frame 18)
        if (seq.name === "walk" && st.treadmill && st.treadmillStop && (st.frame === 0 || st.frame === 18)) {
          st.treadmill = false;
          st.treadmillStop = false;
          playLink(CEL.transitions[st.frame === 0 ? "walk-contact-a-settle" : "walk-contact-b-settle"], "walk-settle", () => {
            const el = st.noticeAfterStep;
            st.noticeAfterStep = null;
            if (el && st.targetActive) notice(el);
          });
          break;
        }
        // a walk cycle (two steps) completes when the loop wraps back to contact A
        if (seq.name === "walk" && st.frame === 0 && st.mode === "walking") {
          st.walkCyclesLeft -= 1;
          if (st.walkCyclesLeft <= 0) {
            st.mode = "idle";
            const then = st.afterWalk;
            st.afterWalk = null;
            playLink(CEL.transitions["walk-contact-a-settle"], "walk-settle", then ?? undefined);
            break;
          }
        }
        // jump: the root stays on the old perch through the crouch; the arc starts at ~25 %
        if (seq.name === "jump" && st.mode === "takeoff" && st.frame >= TAKEOFF_FRAME && st.pendingFlight) {
          const pf = st.pendingFlight;
          st.pendingFlight = null;
          startFlight(pf.target, pf.arc, pf.onLand);
          break;
        }
      }
    };

    // ---------------- perches ----------------
    const updateSize = () => {
      st.s = window.innerWidth <= 600 ? SCALE_MOBILE : SCALE_DESKTOP;
      setScale(st.s);
    };

    const clampX = (px: number) =>
      clamp(px, 8 - CHAR_LEFT * st.s, window.innerWidth - RAIL_GUTTER - CHAR_RIGHT * st.s);

    /** px Lenis still has to glide before it stops (0 for native scrolling) */
    const scrollAhead = () => {
      const l = getLenis();
      if (!l || l.isStopped) return 0;
      const ahead = l.targetScroll - l.animatedScroll;
      return Number.isFinite(ahead) ? ahead : 0;
    };

    /**
     * Safe to commit to a destination: the page has (nearly) stopped, or — with Lenis — the visitor
     * has stopped feeding it input, so where it will rest is already known and he can leave while
     * it glides the last stretch (the flight tracks the moving ledge).
     */
    const isSettled = (now: number, ahead: number) => {
      if (Math.abs(ahead) < SETTLED_AHEAD) return st.scrollSpeed < SETTLED_SPEED || Math.abs(ahead) < 2;
      return Math.abs(ahead) < GLIDE_COMMIT_PX && now - st.targetMovedAt > INPUT_QUIET_MS;
    };

    /** the section under the middle of the screen — optionally where the page is about to stop */
    const currentSection = (ahead = 0) => {
      const probe = window.innerHeight * 0.5 + ahead;
      let name = "Home";
      document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
        if (el.getBoundingClientRect().top <= probe) name = el.dataset.section ?? name;
      });
      return name;
    };

    // ---- walkable surfaces ----
    const fontCache = new Map<string, { gap: number; cap: number }>();
    let measureCtx: CanvasRenderingContext2D | null | undefined;
    /** for a text run: from the top of its box down to the cap line, and the cap height (px) */
    const capMetrics = (el: Element, boxHeight: number) => {
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize) || 16;
      const font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      let ratios = fontCache.get(font);
      if (!ratios) {
        if (measureCtx === undefined) measureCtx = document.createElement("canvas").getContext("2d");
        ratios = { gap: 0.2, cap: 0.7 };
        if (measureCtx) {
          measureCtx.font = font;
          const m = measureCtx.measureText("H");
          if (m.fontBoundingBoxAscent && m.actualBoundingBoxAscent) {
            ratios = {
              gap: (m.fontBoundingBoxAscent - m.actualBoundingBoxAscent) / size,
              cap: m.actualBoundingBoxAscent / size,
            };
          }
        }
        fontCache.set(font, ratios);
      }
      const gap = clamp(ratios.gap * size, 0, boxHeight * 0.6);
      return { gap, cap: Math.min(ratios.cap * size, boxHeight - gap) };
    };

    /**
     * A spinning star or a waving letter inside the perch: its box says nothing about where the
     * letters rest. (The perch's own reveal animation moves everything together, so it's fine.)
     */
    const isAnimated = (node: Element, root: HTMLElement) => {
      for (let e: Element | null = node; e && e !== root; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.animationName && cs.animationName !== "none") return true;
        const t = cs.transform;
        if (t && t !== "none") {
          const m = /^matrix\(([^)]+)\)$/.exec(t);
          if (!m) return true; // 3D or unknown
          const [a, b, c, d] = m[1].split(",").map(Number);
          if (Math.abs(b) > 0.01 || Math.abs(c) > 0.01 || Math.abs(a - 1) > 0.01 || Math.abs(d - 1) > 0.01) return true;
        }
      }
      return false;
    };

    /** glyph-tight first line of a text perch: from the first to the last letter, at cap height */
    const measureText = (el: HTMLElement, box: DOMRect): TextMetrics | null => {
      const runs: { top: number; capTop: number; base: number; h: number; left: number; right: number }[] = [];
      const letters: { el: HTMLElement; top: number; h: number; l: number; r: number }[] = [];
      const range = document.createRange();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent?.trim()) continue;
        const parent = n.parentElement;
        if (!parent) continue;
        const pr = parent.getBoundingClientRect();
        if (pr.width < 2 || pr.height < 2) continue; // visually-hidden (screen-reader) copies
        if (parent !== el) letters.push({ el: parent, top: pr.top, h: pr.height, l: pr.left - box.left, r: pr.right - box.left });
        if (isAnimated(parent, el)) continue;
        range.selectNodeContents(n);
        for (const r of Array.from(range.getClientRects())) {
          if (r.width < 1 || r.height < 1) continue;
          const { gap, cap } = capMetrics(parent, r.height);
          runs.push({ top: r.top, capTop: r.top + gap, base: r.top + gap + cap, h: r.height, left: r.left, right: r.right });
        }
      }
      if (!runs.length) return null;
      const first = Math.min(...runs.map((r) => r.top));
      const line = runs.filter((r) => r.top < first + r.h * 0.5);
      // median cap line: a stray glyph must not lift the whole surface
      const tops = line.map((r) => r.capTop).sort((a, b) => a - b);
      const capTop = tops[Math.floor(tops.length / 2)];
      return {
        w: box.width,
        h: box.height,
        at: performance.now(),
        dl: Math.min(...line.map((r) => r.left)) - box.left,
        dr: Math.max(...line.map((r) => r.right)) - box.left,
        dt: capTop - box.top,
        db: Math.max(...runs.map((r) => r.base)) - box.top,
        // the first line's letter elements, so he can ride their hover wave (horizontal extents don't move)
        glyphs: letters.filter((g) => g.top < first + g.h * 0.5).map(({ el: g, l, r }) => ({ el: g, l, r })),
      };
    };

    /**
     * How far the letters under his shoes are lifted right now (≤ 0) — the titles' hover wave raises
     * each letter in turn, and he rides it instead of letting the letters rise through his feet.
     */
    const letterLift = (el: HTMLElement, foot: number) => {
      const m = textMetrics.get(el);
      if (!m) return 0;
      const left = el.getBoundingClientRect().left;
      const half = 40 * st.s; // his shoes' half-span
      let lift = 0;
      for (const g of m.glyphs) {
        if (left + g.r < foot - half || left + g.l > foot + half) continue;
        const t = getComputedStyle(g.el).transform;
        if (!t || t === "none") continue;
        try {
          lift = Math.min(lift, new DOMMatrixReadOnly(t).m42);
        } catch {
          /* unparsable transform: ignore */
        }
      }
      return lift;
    };

    const surfaceOf = (el: HTMLElement): Surface | null => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return null;
      if (el.dataset.perchSurface === "text") {
        let m = textMetrics.get(el);
        if (!m || Math.abs(m.w - r.width) > 0.5 || Math.abs(m.h - r.height) > 0.5 || performance.now() - m.at > 2000) {
          m = measureText(el, r) ?? undefined;
          if (m) textMetrics.set(el, m);
        }
        if (m) return { left: r.left + m.dl, right: r.left + m.dr, top: r.top + m.dt };
      }
      // boxes: keep his shoes off the rounded corners
      const inset = Math.min(12, r.width * 0.08);
      return { left: r.left + inset, right: r.right - inset, top: r.top };
    };

    /** where a perch's visible content ends (text: its lowest baseline, so descender space doesn't count) */
    const inkBottom = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      if (el.dataset.perchSurface === "text" && surfaceOf(el)) {
        const m = textMetrics.get(el);
        if (m) return r.top + m.db;
      }
      return r.bottom;
    };

    /** standing at `foot` on a surface at `top`, would his body run into the perch above (a stacked card, a title)? */
    const hasHeadroom = (el: HTMLElement, foot: number, top: number) => {
      const hat = top - (CEL_ANCHOR.y - HAT_Y) * st.s;
      const half = 58 * st.s;
      // other perches of the section, plus content he mustn't stand in front of (`data-perch-obstacle`)
      const above = document.querySelectorAll<HTMLElement>(`[data-perch="${el.dataset.perch}"], [data-perch-obstacle]`);
      for (const other of Array.from(above)) {
        if (other === el || other.contains(el) || el.contains(other)) continue;
        const r = other.getBoundingClientRect();
        if (r.width <= 0 || r.right < foot - half || r.left > foot + half) continue;
        if (r.top < top - 4 && inkBottom(other) > hat + 8) return false;
      }
      return true;
    };

    /** cel top-left that puts his foot anchor at `anchor` across the perch's surface */
    const standPoint = (el: HTMLElement, anchor: number) => {
      const s = surfaceOf(el);
      if (!s) return { x: x.get(), y: y.get(), visible: false };
      const foot = s.left + (s.right - s.left) * anchor;
      const ideal = foot - CEL_ANCHOR.x * st.s;
      const px = clampX(ideal);
      const lift = el.dataset.perchSurface === "text" ? letterLift(el, foot) : 0;
      const py = s.top + lift - CEL_ANCHOR.y * st.s;
      const hat = py + HAT_Y * st.s;
      const visible =
        hat > 6 &&
        s.top < window.innerHeight - 12 &&
        s.right > 0 &&
        s.left < window.innerWidth &&
        Math.abs(px - ideal) < 14; // pushed off the surface by the screen edge = standing on air
      return { x: px, y: py, visible };
    };

    const floorPoint = (anchor: number): Point => ({
      x: clampX(12 + (window.innerWidth - 24 - RAIL_GUTTER) * anchor - CEL_ANCHOR.x * st.s),
      y: window.innerHeight - 8 - CEL_ANCHOR.y * st.s,
    });

    /** `data-perch-x="0.5"` pins the spot, `"0.2-0.6"` limits it; otherwise anywhere sensible */
    const anchorFor = (el: HTMLElement) => {
      const [a, b] = (el.dataset.perchX ?? "").split("-").map(Number);
      if (Number.isFinite(a) && Number.isFinite(b)) return rand(a, b);
      if (Number.isFinite(a) && el.dataset.perchX) return a;
      return rand(0.2, 0.8);
    };

    /**
     * The best visible perch of a section — where the page will be once it stops (`ahead`).
     * Prefers spots in the reading band (biased toward where content is heading while scrolling),
     * then a short hop from where he is; `random` widens the choice for idle wandering.
     */
    const pickPerch = (
      section: string,
      avoid: HTMLElement | null,
      opts: { ahead?: number; random?: boolean; drift?: number } = {},
    ): PerchTarget | null => {
      const { ahead = 0, random = false, drift = 0 } = opts;
      const H = window.innerHeight;
      const W = window.innerWidth;
      const fx = footX();
      const fy = y.get() + CEL_ANCHOR.y * st.s;
      const [lo, hi] = drift > 0 ? [0.38, 0.8] : drift < 0 ? [0.16, 0.55] : [0.22, 0.72];
      let best: PerchTarget | null = null;
      let bestScore = Infinity;
      document.querySelectorAll<HTMLElement>(`[data-perch="${section}"]`).forEach((el) => {
        const s = surfaceOf(el);
        if (!s || s.right - s.left < 16) return;
        const top = s.top - ahead;
        const hat = top - (CEL_ANCHOR.y - HAT_Y) * st.s;
        if (hat < 52 || top > H - 40) return; // he and his hat must fit comfortably on screen
        if (isCard(el) && (s.left < 30 || s.right > W - RAIL_GUTTER - 20 || Math.abs(st.beltSpeed) > BELT_FAST)) return;
        const anchor = anchorFor(el);
        const foot = s.left + (s.right - s.left) * anchor;
        const cx = foot - CEL_ANCHOR.x * st.s;
        if (Math.abs(clampX(cx) - cx) > 1) return; // would be pushed off the surface
        let score = top < H * lo ? (H * lo - top) * 1.2 : top > H * hi ? (top - H * hi) * 1.2 : 0;
        // never stand where his body would cover the perch above (e.g. a lower skill card's edge,
        // right under the card above it); with nothing roomier in view he takes the floor instead
        if (!hasHeadroom(el, foot, s.top)) return;
        score += Math.hypot(foot - fx, top - fy) * 0.12;
        if (el === avoid) score += 500;
        score += Math.random() * (random ? 420 : 50);
        if (score < bestScore) {
          bestScore = score;
          best = { el, anchor, section };
        }
      });
      return best;
    };

    const resolve = (target: Target): Point => {
      if ("point" in target) return target.point;
      return target.el ? standPoint(target.el, target.anchor) : floorPoint(target.anchor);
    };

    /** screen x of his foot anchor */
    const footX = () => x.get() + CEL_ANCHOR.x * st.s;

    /** keep track of the ledge element under his shoes (he can cross from card to card) */
    const rePerch = () => {
      if (!st.perch) return;
      const fx = footX();
      const cur = surfaceOf(st.perch);
      if (!cur) return;
      if (fx < cur.left || fx > cur.right) {
        const next = Array.from(document.querySelectorAll<HTMLElement>(`[data-perch="${st.perchSection}"]`)).find((el) => {
          const e = surfaceOf(el);
          return !!e && fx >= e.left - 6 && fx <= e.right + 6 && Math.abs(e.top - cur.top) < 8;
        });
        if (next) st.perch = next;
      }
      const s = surfaceOf(st.perch);
      if (s) st.anchor = (fx - s.left) / Math.max(1, s.right - s.left);
    };

    // ---------------- jumping ----------------
    /** leave a ledge: play the jump crouch with the root held, then fly from ~25 % of the clip */
    const jumpTo = (target: Target, opts: { arc?: number; onLand?: () => void; quick?: boolean } = {}) => {
      st.treadmill = false;
      st.treadmillStop = false;
      st.target = null;
      st.presenting = false;
      st.walkCyclesLeft = 0;
      st.afterWalk = null;
      setBubble(null);
      const dest = resolve(target);
      const dx = dest.x - x.get();
      if (Math.abs(dx) > 2) setFace(dx > 0 ? 1 : -1);
      if (reduceMotion) {
        x.set(dest.x);
        y.set(dest.y);
        land(target, opts.onLand);
        return;
      }
      st.mode = "takeoff";
      st.takeoffAt = performance.now();
      st.pendingFlight = { target, arc: opts.arc, onLand: opts.onLand };
      playClip("jump", { from: opts.quick ? QUICK_CROUCH_FRAME : 0 });
    };

    const isCard = (el: HTMLElement | null) => !!el?.hasAttribute("data-project-card");

    /**
     * The visitor flung the page again after `since` (when he committed to a jump): with Lenis, new
     * wheel input that sends it far; natively, a fast scroll. A glide he already planned for doesn't count.
     */
    const flungSince = (since: number) => {
      const l = getLenis();
      if (l && !l.isStopped) {
        return st.targetMovedAt > since && (Math.abs(scrollAhead()) > GLIDE_COMMIT_PX || st.scrollSpeed > FAST_SCROLL);
      }
      return st.scrollSpeed > FAST_SCROLL;
    };

    /** will this destination still be on screen once the page stops? (the visitor may have scrolled on) */
    const stillFits = (target: Target, ahead: number) => {
      if ("point" in target || !target.el) return true;
      const s = surfaceOf(target.el);
      if (!s) return false;
      const top = s.top - ahead;
      return top - (CEL_ANCHOR.y - HAT_Y) * st.s > 16 && top < window.innerHeight - 16;
    };

    /** the same destination if it will still be there, otherwise the best one where the page is now heading */
    const retarget = (target: Target): Target => {
      const ahead = scrollAhead();
      if (Math.abs(ahead) < 4 || stillFits(target, ahead)) return target;
      return pickPerch(currentSection(ahead), null, { ahead }) ?? target;
    };

    const startFlight = (target: Target, arcOpt?: number, onLand?: () => void, frameFrom = TAKEOFF_FRAME) => {
      const planned = target;
      if (!onLand) target = retarget(target); // the visitor kept scrolling during the wind-up
      const fromX = x.get();
      const fromY = y.get();
      const dest = resolve(target);
      const dist = Math.hypot(dest.x - fromX, dest.y - fromY);
      const redirect = frameFrom > TAKEOFF_FRAME;
      if ((redirect || target !== planned) && Math.abs(dest.x - fromX) > 12) setFace(dest.x > fromX ? 1 : -1);
      const wantedArc = arcOpt ?? (redirect ? clamp(20 + dist * 0.1, 20, 90) : clamp(50 + dist * 0.22, 60, 200));
      // the apex (above the higher end) must keep his hat inside the viewport; fixed for the whole
      // flight so a moving destination never makes the arc wobble
      const room = Math.min(fromY, dest.y) + HAT_Y * st.s - 10;
      const now = performance.now();
      st.mode = "jumping";
      setAirborne(true);
      st.flight = {
        fromX,
        fromY,
        start: now,
        // short hops follow the clip's own airtime (25 % → 78 % of 1.08 s); long flights stretch a little
        duration: ((redirect ? clamp(0.25 + dist / 2400, 0.3, 0.7) : clamp(0.4 + dist / 2400, 0.5, 0.9)) * 1000) / rate,
        arc: clamp(wantedArc, 20, Math.max(20, room + Math.abs(dest.y - fromY) / 2)),
        to: target,
        onLand,
        frameFrom,
        checkedAt: now,
      };
    };

    const tickFlight = (now: number) => {
      const f = st.flight;
      if (!f) return;
      // the page (or the carousel he's aiming at) got flung while he's in the air: stop chasing
      // ledges that whizz past — vanish in a puff and come back once it settles
      if (!reduceMotion && !("point" in f.to) && (flungSince(f.start) || (isCard(f.to.el) && Math.abs(st.beltSpeed) > BELT_FAST))) {
        vanish();
        return;
      }
      // still scrolling gently while he's in the air and his ledge won't be there: bend toward a better one
      if (!f.onLand && !("point" in f.to) && now - f.checkedAt > 100) {
        f.checkedAt = now;
        const next = retarget(f.to);
        const t0 = (now - f.start) / f.duration;
        if (next !== f.to && t0 < 0.8) {
          const idx = Math.round(f.frameFrom + t0 * (CONTACT_FRAME - f.frameFrom));
          startFlight(next, undefined, undefined, Math.min(idx, CONTACT_FRAME - 3));
          return;
        }
      }
      const t = clamp((now - f.start) / f.duration, 0, 1);
      const live = resolve(f.to);
      const dest = { x: clampX(live.x), y: clamp(live.y, 8 - HAT_Y * st.s, window.innerHeight - boxPx()) };
      // near-constant horizontal speed + parabolic height = a real ballistic hop, softened at the ends
      const tx = t * 0.65 + easeInOutSine(t) * 0.35;
      x.set(f.fromX + (dest.x - f.fromX) * tx);
      y.set(Math.max(4 - HAT_Y * st.s, f.fromY + (dest.y - f.fromY) * t - f.arc * 4 * t * (1 - t)));
      // the airborne drawings follow the real flight phase
      const idx = Math.round(f.frameFrom + t * (CONTACT_FRAME - f.frameFrom));
      showFrame(CEL.clips.jump.frames[idx].id);
      if (t >= 1) land(f.to, f.onLand);
    };

    const land = (target: Target, onLand?: () => void) => {
      st.mode = "idle";
      st.flight = null;
      setAirborne(false);
      if ("point" in target) {
        st.perch = null;
      } else {
        st.perch = target.el;
        st.anchor = target.anchor;
        st.perchSection = target.section;
        // one line per relevant section change — never mid-flick
        if (st.greeted !== target.section && st.scrollSpeed < 300) {
          st.greeted = target.section;
          later(() => say(sectionLine(target.section)), 260);
        }
      }
      if (!reduceMotion) setDust((d) => d + 1);
      st.nextIdleAt = performance.now() + rand(6000, 11000);
      const after = () => {
        onLand?.();
        // a project the visitor lingered on while he was in the air
        if (st.pendingTarget) {
          const el = st.pendingTarget;
          st.pendingTarget = null;
          if (st.targetActive) notice(el);
        }
      };
      if (reduceMotion) {
        idle();
        after();
        return;
      }
      // the remaining jump frames carry the weight settling
      playClip("jump", { from: CONTACT_FRAME, onEnd: after });
    };

    // ---------------- the Projects sequence ----------------
    const targetCenter = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2;
    };

    /** notice → (walk one cycle if the ledge has room) → settle → present; hand stays out while read */
    const notice = (el: HTMLElement) => {
      if (st.mode === "hidden" || st.mode === "away" || st.mode === "parade") return;
      if (st.mode === "jumping" || st.mode === "takeoff" || st.mode === "poofed") {
        st.pendingTarget = el; // keep only the latest relevant target
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) return;
      if (st.treadmill && st.seq.name === "walk") {
        // mid-stride on the carousel: finish the step and settle first, then notice
        st.noticeAfterStep = el;
        st.treadmillStop = true;
        return;
      }
      st.noticedAt.set(el, performance.now());
      st.treadmill = false;
      st.treadmillStop = false;
      st.target = el;
      st.presenting = false;
      st.walkCyclesLeft = 0;
      st.mode = "idle";

      const dir: 1 | -1 = targetCenter(el) >= footX() ? 1 : -1;
      setFace(dir); // he presents toward his facing side; his eyes lead the turn in the notice cels

      const presentIt = () => {
        if (st.target !== el) return; // visitor moved on during the walk; the settle already left him idle
        st.presenting = true;
        playClip("present");
        maybeRemark();
      };

      if (reduceMotion) {
        st.presenting = true;
        showFrame(PRESENT_HOLD);
        st.seq = { name: "present", frames: CEL.clips.present.frames, end: "hold" };
        return;
      }

      playClip("notice", {
        onEnd: () => {
          if (st.target !== el) {
            playLink(CEL.releases.notice, "notice-release");
            return;
          }
          const plan = planApproach(el, dir);
          if (plan.kind === "walk") {
            playLink(CEL.transitions["notice-walk"], "notice-walk");
            startWalk(1, presentIt);
          } else if (plan.kind === "leap") {
            // he's somewhere else (a heading, another row): leap onto the card's near edge and present
            jumpTo(plan.spot, {
              quick: true,
              onLand: () => {
                if (!st.targetActive) {
                  st.target = null; // visitor already moved on: just stay on the card
                  return;
                }
                st.target = el;
                setFace(plan.face);
                presentIt();
              },
            });
            st.target = el;
          } else {
            // short ledge: notice-present joins straight into the gesture
            st.presenting = true;
            playLink(CEL.transitions["notice-present"], "notice-present");
            maybeRemark();
          }
        },
      });
    };

    /** walk `cycles` walk cycles (two steps each) in the facing direction, then settle and run `then` */
    const startWalk = (cycles: number, then: () => void, playClipNow = false) => {
      st.mode = "walking";
      st.walkCyclesLeft = cycles;
      st.afterWalk = then;
      if (playClipNow) playClip("walk");
      // otherwise the notice-walk transition is already running and continues into walk@0
    };

    type Plan = { kind: "stay" } | { kind: "walk" } | { kind: "leap"; spot: PerchTarget; face: 1 | -1 };

    /** land just inside the card's edge nearest to him, facing across it */
    const planLeap = (el: HTMLElement): Plan => {
      const s = surfaceOf(el);
      if (!s) return { kind: "stay" };
      const hat = s.top - (CEL_ANCHOR.y - HAT_Y) * st.s;
      if (hat < 40 || s.top > window.innerHeight - 30) return { kind: "stay" };
      const fromLeft = footX() <= (s.left + s.right) / 2;
      const anchor = fromLeft ? 0.1 : 0.9;
      const foot = s.left + (s.right - s.left) * anchor;
      const cx = foot - CEL_ANCHOR.x * st.s;
      if (Math.abs(clampX(cx) - cx) > 1 || !hasHeadroom(el, foot, s.top)) return { kind: "stay" };
      return { kind: "leap", spot: { el, anchor, section: el.dataset.perch ?? st.perchSection }, face: fromLeft ? 1 : -1 };
    };

    /**
     * He should finish standing just inside the target card's near edge, so his presenting hand
     * opens out over that card. One walk cycle if that's where two steps end; a leap there if it's
     * further or on another ledge; stay planted (notice → present) if it's already right beside him.
     */
    const planApproach = (el: HTMLElement, dir: 1 | -1): Plan => {
      if (!st.perch || !st.perch.hasAttribute("data-project-card")) return planLeap(el);
      const ledgeTop = st.perch.getBoundingClientRect().top;
      const card = el.getBoundingClientRect();
      if (Math.abs(ledgeTop - card.top) > 8) return planLeap(el);
      const travel = walkTravel();
      const endFoot = dir === 1 ? card.left + card.width * 0.12 : card.right - card.width * 0.12;
      const endX = endFoot - CEL_ANCHOR.x * st.s;
      if (clampX(endX) !== endX) return { kind: "stay" };
      const needed = (endFoot - footX()) * dir;
      if (needed < travel * 0.7) return { kind: "stay" };
      if (needed <= travel * 1.35) return { kind: "walk" };
      // further along the row: one leap straight to the card's near edge (quicker than hop + stroll)
      return planLeap(el);
    };

    /** visitor left the card → release the gesture (present or notice) back to idle */
    const releaseTarget = () => {
      const name = st.seq.name;
      st.target = null;
      if (st.presenting || name === "present" || name === "notice-present") {
        st.presenting = false;
        if (reduceMotion) {
          showFrame(CEL.defaultFrame);
          st.seq = { name: "idle", frames: CEL.clips.idle.frames, end: "loop" };
          return;
        }
        playLink(CEL.releases.present, "present-release");
      } else if (name === "notice") {
        playLink(CEL.releases.notice, "notice-release");
      }
    };

    // ---------------- idle life ----------------
    const idleAction = () => {
      const roll = Math.random();
      if (roll < 0.3) {
        const next = pickPerch(st.perchSection, st.perch, { random: true });
        if (next && next.el !== st.perch) {
          jumpTo(next);
          return;
        }
      }
      const s = st.perch ? surfaceOf(st.perch) : null;
      if (roll < 0.6 && s && !reduceMotion) {
        // stroll one walk cycle along the ledge if there's room
        const travel = walkTravel();
        const fx = footX();
        const canRight = fx + travel < s.right - 6 && clampX(x.get() + travel) === x.get() + travel;
        const canLeft = fx - travel > s.left + 6 && clampX(x.get() - travel) === x.get() - travel;
        const dir: 1 | -1 | 0 = canRight && canLeft ? (Math.random() < 0.5 ? 1 : -1) : canRight ? 1 : canLeft ? -1 : 0;
        if (dir !== 0) {
          setFace(dir);
          startWalk(1, idle, true);
        }
      }
      st.nextIdleAt = performance.now() + rand(7000, 12000);
    };

    // ---------------- poof: out of the way while the page flies, back when it settles ----------------
    let poofSeq = 0;
    let appearAnim: { stop: () => void } | null = null;
    const poofAt = (cx: number, cy: number, size = st.s / SCALE_DESKTOP) => {
      const id = ++poofSeq;
      setPoofs((list) => [...list.slice(-5), { id, x: cx, y: cy, s: size }]);
      window.setTimeout(() => setPoofs((list) => list.filter((p) => p.id !== id)), POOF_MS + 150);
    };
    const bodyMid = () => y.get() + (CEL_ANCHOR.y - BODY_MID) * st.s;

    /** fast scroll: vanish in a puff of smoke (cancels any walk, wind-up or flight) */
    const vanish = () => {
      st.treadmill = false;
      st.treadmillStop = false;
      st.walkCyclesLeft = 0;
      st.afterWalk = null;
      st.noticeAfterStep = null;
      st.pendingFlight = null;
      st.flight = null;
      st.perch = null;
      st.target = null;
      st.presenting = false;
      st.mode = "poofed";
      st.poofedAt = performance.now();
      st.nextPickAt = 0;
      setAirborne(false);
      setBubble(null);
      poofAt(footX(), bodyMid());
      appearAnim?.stop();
      // shrink a beat after the puff blooms, so the cloud is already covering him
      appearAnim = animate(appear, 0, { duration: 0.12, delay: 0.05, ease: "easeIn" });
      idle();
    };

    /** the page settled: pop back in, standing on `target`, behind a fresh puff */
    const reappear = (target: PerchTarget) => {
      const p = resolve(target);
      x.set(p.x);
      y.set(p.y);
      st.perch = target.el;
      st.anchor = target.anchor;
      st.perchSection = target.section;
      st.mode = "idle";
      st.shownAt = performance.now();
      st.nextIdleAt = st.shownAt + rand(6000, 11000);
      poofAt(footX(), bodyMid());
      appearAnim?.stop();
      appear.set(0);
      appearAnim = animate(appear, 1, { type: "spring", stiffness: 520, damping: 16, delay: 0.09 }); // out of the puff
      if (target.el && st.greeted !== target.section) {
        st.greeted = target.section;
        later(() => say(sectionLine(target.section)), 420);
      }
      playClip("land", {
        onEnd: () => {
          // a project the visitor lingered on while he was gone
          const el = st.pendingTarget;
          st.pendingTarget = null;
          if (el && st.targetActive) notice(el);
        },
      });
    };

    /** somewhere to stand on the floor when a section has no perch that fits */
    const floorTarget = (section: string): PerchTarget => ({
      el: null,
      anchor: clamp(footX() / window.innerWidth, 0.1, 0.9),
      section,
    });

    // ---------------- finale: the crew walks the footer line ----------------
    let paradeImg: HTMLImageElement | null = null;
    let paradeReady = false;
    /** fetch the walk strip once the visitor is heading for the bottom of the page */
    const preloadParade = () => {
      if (paradeImg) return;
      const img = new window.Image(); // (`Image` here is next/image)
      img.decoding = "async";
      img.onload = () => {
        paradeReady = true;
      };
      img.src = getImagePath(PARADE_SRC);
      paradeImg = img;
    };

    const paradeSize = () => {
      const h = Math.min(window.innerWidth <= 600 ? PARADE_H_MOBILE : PARADE_H_DESKTOP, window.innerHeight * 0.32);
      const k = h / PARADE_FRAME_H;
      return { h, k, w: PARADE_FRAME_W * k };
    };

    /** the line they walk on: the footer's divider, or the bottom of the screen if it isn't in view */
    const paradeGround = (h: number) => {
      const r = document.querySelector<HTMLElement>("[data-livesey-ground]")?.getBoundingClientRect();
      return r && r.top > h * 0.6 && r.top < window.innerHeight - 4 ? r.top : window.innerHeight - 6;
    };

    /** is it time for the finale? (the visitor reached "Get in touch" and is staying) */
    const paradeComing = (now: number, settled: boolean) =>
      !reduceMotion &&
      paradeReady &&
      st.paradeArmed &&
      settled &&
      !st.target &&
      st.contactSince > 0 &&
      now - st.paradeAt > PARADE_REPEAT_MS;
    const paradeDue = (now: number, settled: boolean) =>
      paradeComing(now, settled) && now - st.contactSince > PARADE_ARRIVE_MS;

    const startParade = () => {
      if (st.mode !== "poofed") vanish(); // the doctor bows out in a puff (unless he's already gone)…
      st.mode = "parade";
      const { w } = paradeSize();
      st.parade = { x: -w * 0.92, dist: 0 }; // …and the crew strolls in from the left edge
      setParade(true);
    };

    /** the crew vanishes in smoke (at the screen's edge, or wherever they are if the visitor leaves) */
    const endParade = () => {
      const p = st.parade;
      if (p) {
        const { h, w } = paradeSize();
        const ground = paradeGround(h);
        PARADE_CREW_X.forEach((fx, i) =>
          window.setTimeout(() => poofAt(p.x + w * fx, ground - h * 0.5, h / 140), i * 70),
        );
      }
      st.parade = null;
      st.paradeAt = performance.now();
      st.paradeArmed = false;
      window.setTimeout(() => setParade(false), 120); // gone behind the smoke
      // the doctor pops back in on a perch once the puffs clear
      st.mode = "poofed";
      st.poofedAt = performance.now() + 250;
      st.nextPickAt = 0;
    };

    const tickParade = (now: number, dtMs: number) => {
      const p = st.parade;
      if (!p) return;
      // they only leave when the visitor leaves (with a little grace at the section boundary)
      if (st.contactSince === 0 && now - st.contactLeftAt > PARADE_LEAVE_MS) {
        endParade();
        return;
      }
      const { h, k, w } = paradeSize();
      const stepPx = PARADE_STEP * k; // how far they travel per cel on screen
      const travel = stepPx * PARADE_FPS * (dtMs / 1000) * rate;
      p.x += travel;
      p.dist += travel;
      const cel = Math.floor(p.dist / stepPx) % PARADE_FRAMES;
      const top = paradeGround(h) - PARADE_FEET * k;
      const el = paradeEl.current;
      if (el) {
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.backgroundSize = `${w * PARADE_FRAMES}px ${h}px`;
        el.style.backgroundPosition = `${-cel * w}px 0`;
        el.style.transform = `translate3d(${p.x}px, ${top}px, 0)`;
      }
      // off the right edge → straight back in from the left, round and round
      if (p.x >= window.innerWidth) p.x = -w;
    };

    // ---------------- looking at the visitor's cursor ----------------
    /** gestures that already point somewhere (or move him) keep their own direction */
    const BUSY_SEQS = new Set(["walk", "notice", "notice-walk", "notice-present", "present", "present-release", "walk-settle"]);
    let shownLean = 0;

    /**
     * While he stands around, he turns to face the cursor (with a little dead zone and patience so
     * he doesn't flip-flop) and leans gently back to look up at it, or forward to look down at it.
     */
    const lookAtCursor = (now: number, dtMs: number) => {
      const c = st.cursor;
      const free =
        c.inside &&
        st.mode === "idle" &&
        !st.target &&
        !st.presenting &&
        !st.treadmill &&
        !st.noticeAfterStep &&
        !BUSY_SEQS.has(st.seq.name);
      let leanTarget = 0;
      if (free) {
        const fx = footX();
        const headY = y.get() + LOOK_HEAD_Y * st.s;
        const dx = c.x - fx;
        // turn around once the cursor has stayed on his other side for a moment
        const want: 1 | -1 | 0 = dx > LOOK_DEAD_ZONE * st.s ? 1 : dx < -LOOK_DEAD_ZONE * st.s ? -1 : 0;
        if (want !== 0 && want !== st.facing) {
          if (st.lookWant !== want) {
            st.lookWant = want;
            st.lookWantSince = now;
          } else if (now - st.lookWantSince > LOOK_TURN_DELAY_MS) {
            setFace(want);
          }
        } else st.lookWant = 0;
        // look up (lean back) / down (lean forward); fades out when the cursor is far off to the side
        const dy = c.y - headY;
        const pitch = clamp(-dy / 420, -1, 1) * clamp(1.4 - Math.abs(dx) / 900, 0.35, 1);
        if (!reduceMotion) leanTarget = -st.facing * pitch * LOOK_MAX_LEAN;
      } else st.lookWant = 0;
      st.lean += (leanTarget - st.lean) * (1 - Math.exp(-dtMs / 140));
      const el = leanEl.current;
      if (el && Math.abs(st.lean - shownLean) > 0.02) {
        shownLean = st.lean;
        el.style.transform = Math.abs(st.lean) < 0.02 ? "" : `rotate(${st.lean.toFixed(2)}deg)`;
      }
    };

    // ---------------- main loop ----------------
    const tick = (now: number) => {
      const dtMs = Math.min(50, now - st.last);
      st.last = now;

      // scroll speed (Lenis-smoothed scrolling still reports a high speed on a flick)
      const sy = window.scrollY;
      const v = (Math.abs(sy - st.lastScrollY) / Math.max(dtMs, 1)) * 1000;
      if (sy !== st.lastScrollY) st.scrollDir = sy > st.lastScrollY ? 1 : -1;
      st.lastScrollY = sy;
      st.scrollSpeed = st.scrollSpeed * 0.6 + v * 0.4;
      const lenis = getLenis();
      const target = lenis ? lenis.targetScroll : sy;
      if (target !== st.lastTarget) {
        st.lastTarget = target;
        st.targetMovedAt = now;
      }
      const ahead = scrollAhead();
      // the project carousel can be flung sideways by the wheel; track it wherever he is
      const beltRef = st.beltRef?.isConnected ? st.beltRef : document.querySelector<HTMLElement>("[data-project-card]");
      if (beltRef) {
        const left = beltRef.getBoundingClientRect().left;
        if (beltRef === st.beltRef && dtMs > 0) {
          const bv = ((left - st.beltRefLeft) / dtMs) * 1000;
          st.beltSpeed += (bv - st.beltSpeed) * (1 - Math.exp(-dtMs / 90));
        }
        st.beltRef = beltRef;
        st.beltRefLeft = left;
      }
      const beltFlung = Math.abs(st.beltSpeed) > BELT_FAST;
      const settled = isSettled(now, ahead) && !beltFlung;

      // heading for the bottom: fetch the finale's walk strip; track how long the visitor has been there
      const sectionNow = currentSection();
      if (sectionNow === "GitHub" || sectionNow === "Contact") preloadParade();
      if (sectionNow === "Contact") {
        if (!st.contactSince) st.contactSince = now;
      } else {
        if (st.contactSince) st.contactLeftAt = now;
        st.contactSince = 0;
        st.paradeArmed = true;
      }

      // dialogs take priority over everything ambient
      const dialogOpen = document.querySelector('[role="dialog"]') !== null;
      if (dialogOpen && st.mode !== "away" && st.mode !== "hidden") {
        if (st.parade) {
          st.parade = null;
          setParade(false);
        }
        st.mode = "away";
        st.flight = null;
        st.pendingFlight = null;
        st.target = null;
        st.presenting = false;
        st.walkCyclesLeft = 0;
        st.afterWalk = null;
        st.treadmill = false;
        st.treadmillStop = false;
        setAirborne(false);
        setBubble(null);
        setAway(true);
        idle();
      } else if (!dialogOpen && st.mode === "away") {
        // restore him to a visible perch with a standalone landing
        st.mode = "idle";
        setAway(false);
        appearAnim?.stop();
        appear.set(1); // he may have poofed away just before the dialog opened
        const section = currentSection();
        const spot = pickPerch(section, null);
        const p = spot ? resolve(spot) : floorPoint(0.5);
        x.set(p.x);
        y.set(p.y);
        st.perch = spot?.el ?? null;
        st.anchor = spot?.anchor ?? 0.5;
        st.perchSection = section;
        st.greeted = section;
        playClip("land", {
          onEnd: () => {
            const chip = st.pendingNod;
            st.pendingNod = null;
            const r = chip?.getBoundingClientRect();
            if (chip && r && r.bottom > 0 && r.top < window.innerHeight) {
              setFace(r.left + r.width / 2 >= footX() ? 1 : -1);
              playClip("nod");
            }
          },
        });
      }

      if (st.mode === "jumping") {
        tickFlight(now);
      } else if (st.mode === "parade") {
        tickParade(now, dtMs);
      } else if (st.mode === "poofed" && paradeComing(now, settled)) {
        // already out of sight at "Get in touch": stay hidden and cue the crew (no puff in, puff out)
        if (paradeDue(now, settled)) startParade();
      } else if (st.mode === "poofed") {
        // gone until the scroll is about to settle; then pop back in on the best perch in view
        if (settled && now - st.poofedAt > POOF_MIN_MS && now > st.nextPickAt) {
          st.nextPickAt = now + 90;
          const section = currentSection(ahead);
          const next = pickPerch(section, null, { ahead });
          if (next?.el) {
            // the page may still be gliding: only appear once that spot is actually on screen
            if (standPoint(next.el, next.anchor).visible) reappear(next);
          } else if (Math.abs(ahead) < 2 && st.scrollSpeed < SETTLED_SPEED) {
            reappear(floorTarget(section)); // nothing to stand on here: the bottom edge of the screen
          }
        }
      } else if (st.mode === "idle" || st.mode === "walking" || st.mode === "takeoff") {
        const here = st.perch ? standPoint(st.perch, st.anchor) : null;
        const lost = !!st.perch && !here?.visible;
        const grounded = st.mode !== "takeoff" && !reduceMotion;
        if (
          grounded &&
          // (just popped back in? ride his perch through a quick re-flick unless it actually leaves the screen)
          ((st.scrollSpeed > FAST_SCROLL && now - st.shownAt > SHOWN_MIN_MS) ||
            (lost && (st.scrollSpeed > BRISK_SCROLL || (isCard(st.perch) && beltFlung))))
        ) {
          vanish();
        } else if (st.mode === "takeoff" && !reduceMotion && flungSince(st.takeoffAt)) {
          // flung again during the wind-up: call the jump off and poof away instead
          vanish();
        } else {
          const section = currentSection();
          if (st.mode === "walking" && lost) {
            // the ledge scrolled away mid-stride: stop walking and let the ledge logic below re-home him
            st.mode = "idle";
            st.walkCyclesLeft = 0;
            st.afterWalk = null;
            idle();
          }
          if (st.mode === "walking") {
            // locomotion synced to accumulated clip time: one cycle covers WALK_TRAVEL_PX × s
            if (st.seq.name === "walk") {
              x.set(x.get() + (walkTravel() / WALK_CYCLE_MS) * dtMs * rate * (st.seq.speed ?? 1) * st.facing);
              rePerch();
            }
            if (st.perch) y.set(standPoint(st.perch, st.anchor).y);
          } else if (st.mode === "takeoff") {
            // ride the ledge through the wind-up, but never off screen
            if (here) {
              x.set(here.x);
              y.set(clamp(here.y, 8 - HAT_Y * st.s, window.innerHeight - boxPx()));
            }
          } else if (st.perch && st.treadmill && !lost && section === st.perchSection) {
            // treadmill: his feet move with the cards, so he stays put on screen while the row slides
            rePerch();
            y.set(standPoint(st.perch, st.anchor).y);
          } else if (st.perch) {
            if (st.treadmill) {
              // the visitor moved on: stop the treadmill and let the normal ledge logic take over
              st.treadmill = false;
              st.treadmillStop = false;
              idle();
            }
            if (lost) {
              // gentle scroll (or the layout moved): hop straight to the best ledge, aimed at where
              // the page is heading so he doesn't have to hop again a moment later
              const sec = currentSection(ahead);
              const next = pickPerch(sec, st.perch, { ahead, drift: settled ? 0 : st.scrollDir });
              if (next) jumpTo(next, { quick: true });
              else if (!settled && !reduceMotion) vanish(); // nothing in reach yet: poof away until it settles
              else jumpTo(floorTarget(sec), { quick: true });
            } else {
              x.set(here!.x); // ride along with the ledge
              y.set(here!.y);
              // a new section: wait until the scroll is about to rest, then make one decisive jump
              if (settled && !st.target && now > st.nextPickAt) {
                const sec = currentSection(ahead);
                if (sec !== st.perchSection) {
                  const next = pickPerch(sec, null, { ahead });
                  if (next) jumpTo(next, { quick: true });
                  else st.nextPickAt = now + PICK_RETRY_MS;
                }
              }
            }
          } else {
            // on the floor (no perch fitted): stand at the bottom edge and look for one now and then
            const p = floorPoint(st.anchor);
            x.set(p.x);
            y.set(p.y);
            if (st.mode === "idle" && settled && now > st.nextPickAt) {
              const sec = currentSection(ahead);
              const next = pickPerch(sec, null, { ahead });
              if (next) jumpTo(next, { quick: true });
              else {
                st.perchSection = sec;
                st.nextPickAt = now + PICK_RETRY_MS;
              }
            }
          }

          // ---- the projects carousel as a treadmill ----
          const nominal = (walkTravel() / WALK_CYCLE_MS) * 1000; // px/s of the drawn stride
          if (st.perch) {
            // measure on the same element as last frame (he may have just stepped onto the next card)
            if (st.lastLedge && dtMs > 0) {
              const moved = st.lastLedge.getBoundingClientRect().left - st.lastLedgeLeft;
              st.ledgeV += ((moved / dtMs) * 1000 - st.ledgeV) * (1 - Math.exp(-dtMs / 160));
              st.beltAdvanceMs = (Math.abs(moved) / nominal) * 1000;
            }
            st.lastLedge = st.perch;
            st.lastLedgeLeft = st.perch.getBoundingClientRect().left;
          } else {
            st.ledgeV = 0;
            st.lastLedge = null;
          }
          const onBelt =
            st.mode === "idle" &&
            !reduceMotion &&
            !st.target &&
            !!st.perch?.hasAttribute("data-project-card") &&
            section === st.perchSection;
          // walk against the cards' gentle drift; when the row is flung faster than he could stride,
          // stand still and let his card carry him
          const beltWalkable = Math.abs(st.ledgeV) > 10 && Math.abs(st.ledgeV) < BELT_WALK_MAX && !beltFlung;
          if (onBelt && beltWalkable && !st.noticeAfterStep && (st.seq.name === "idle" || (st.seq.name === "walk" && st.treadmill))) {
            if (!st.treadmill) {
              st.treadmill = true;
              setFace(st.ledgeV < 0 ? 1 : -1); // walk against the flow
              playClip("walk");
            }
            st.treadmillStop = false;
          } else if (st.treadmill && (!onBelt || Math.abs(st.ledgeV) < 6 || !beltWalkable)) {
            st.treadmillStop = true; // finish the step, then settle
          }
          if (st.treadmill) st.walkRate = clamp(Math.abs(st.ledgeV) / nominal, 0.25, 1.8);

          // the visitor left the card he's presenting / noticing
          if (st.target && !st.targetActive && now - st.targetLeftAt > RELEASE_GRACE_MS && st.mode === "idle") {
            const n = st.seq.name;
            if (n === "present" || n === "notice" || n === "notice-present") releaseTarget();
          }
          if (st.mode === "idle" && st.seq.name === "idle" && !st.target && settled && now > st.nextIdleAt) idleAction();
          // the finale: the visitor made it to "Get in touch" and is staying — cue the crew
          // (not right after he popped back in — no puff in, puff out)
          if (st.mode === "idle" && now - st.shownAt > 1200 && paradeDue(now, settled)) startParade();
        }
      }

      lookAtCursor(now, dtMs);
      tickPlayer(dtMs);
      commit();
    };

    // Run the frame AFTER every other requestAnimationFrame callback (Lenis, the carousels, the
    // cursor): a ResizeObserver fires once per frame after rAF and layout, before paint. Nudging a
    // hidden sentinel's size in rAF schedules it, so he always reads this frame's final positions
    // and never trails a frame behind the ledge he stands on.
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText =
      "position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;contain:strict";
    document.body.appendChild(sentinel);
    let pendingNow = 0;
    let flip = false;
    const late =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (!pendingNow) return;
            const n = pendingNow;
            pendingNow = 0;
            tick(n);
          })
        : null;
    late?.observe(sentinel);
    const onFrame = (now: number) => {
      if (late) {
        if (pendingNow) tick(pendingNow); // the observer didn't get to run last frame
        pendingNow = now;
        flip = !flip;
        sentinel.style.width = flip ? "1px" : "0px";
      } else tick(now);
      frame = requestAnimationFrame(onFrame);
    };

    // ---------------- visitor input ----------------
    const cardFrom = (node: EventTarget | null) =>
      node instanceof Element ? node.closest<HTMLElement>("[data-project-card]") : null;

    const queueNotice = (card: HTMLElement) => {
      window.clearTimeout(dwellTimer);
      st.targetActive = true;
      dwellTimer = window.setTimeout(() => {
        if (st.target === card) return; // already on it
        const last = st.noticedAt.get(card) ?? 0;
        if (performance.now() - last < CARD_COOLDOWN_MS) return;
        notice(card);
      }, DWELL_MS);
    };

    const leaveCard = () => {
      window.clearTimeout(dwellTimer);
      st.targetActive = false;
      st.targetLeftAt = performance.now();
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const card = cardFrom(e.target);
      if (card && card !== cardFrom(e.relatedTarget)) queueNotice(card);
    };
    const onOut = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const card = cardFrom(e.target);
      if (card && card !== cardFrom(e.relatedTarget)) leaveCard();
    };
    // touch: an explicit tap on a card selects it (the tap itself still works normally)
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      const card = cardFrom(e.target);
      if (card) {
        st.targetActive = true;
        notice(card);
        window.setTimeout(leaveCard, 3200);
      }
    };
    const onFocusIn = (e: FocusEvent) => {
      const card = cardFrom(e.target);
      if (card) queueNotice(card);
    };
    const onFocusOut = (e: FocusEvent) => {
      const card = cardFrom(e.target);
      if (card && card !== cardFrom(e.relatedTarget)) leaveCard();
    };
    const onClick = (e: MouseEvent) => {
      const chip = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-skill-chip]") : null;
      if (chip && st.mode !== "hidden") st.pendingNod = chip;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // no cursor to look at on touch screens
      st.cursor.x = e.clientX;
      st.cursor.y = e.clientY;
      st.cursor.inside = true;
    };
    const onPointerLeavePage = (e: MouseEvent) => {
      if (!e.relatedTarget) st.cursor.inside = false; // the mouse left the window
    };
    const onVisibility = () => {
      st.last = performance.now(); // no catch-up burst after a background tab
    };

    // ---------------- toggle / tap ----------------
    const toggleCenter = (): Point => {
      const r = toggleRef.current?.getBoundingClientRect();
      if (!r) return { x: 16, y: window.innerHeight - boxPx() };
      return { x: r.left + r.width / 2 - CEL_ANCHOR.x * st.s, y: r.top + r.height / 2 - CEL_ANCHOR.y * st.s };
    };

    const summon = () => {
      if (st.mode !== "hidden") return;
      const start = toggleCenter();
      x.set(start.x);
      y.set(start.y);
      appear.set(0.2);
      setPresent(true);
      setAway(false);
      st.mode = "idle";
      st.greeted = "";
      void preloadCelAtlases();
      animate(appear, 1, { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] });
      const section = currentSection();
      const target = pickPerch(section, null) ?? { el: null, anchor: 0.5, section };
      if (reduceMotion) {
        jumpTo(target);
        return;
      }
      // springs straight out of the toggle into the flight
      const dest = resolve(target);
      setFace(dest.x >= start.x ? 1 : -1);
      startFlight(target, 200);
    };

    const dismiss = () => {
      // a hide request cancels every gesture immediately
      st.mode = "hidden";
      st.parade = null;
      setParade(false);
      st.flight = null;
      st.pendingFlight = null;
      st.target = null;
      st.presenting = false;
      st.pendingTarget = null;
      st.walkCyclesLeft = 0;
      window.clearTimeout(dwellTimer);
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      setBubble(null);
      setAirborne(false);
      animate(appear, 0, { duration: reduceMotion ? 0 : 0.16, ease: "easeIn" }).then(() => {
        if (st.mode === "hidden") setPresent(false);
      });
    };

    const tap = () => {
      if (reduceMotion) return; // neutral resting grin stays
      if (st.mode !== "idle" || st.seq.name === "laugh") return; // a laugh never stacks
      st.target = null;
      st.presenting = false;
      playClip("laugh");
      say(LAUGH_LINE, 1700);
    };

    controller.current = { tap, summon, dismiss };
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __livesey?: unknown }).__livesey = {
        notice: (el: HTMLElement) => {
          st.targetActive = true;
          notice(el);
        },
        release: leaveCard,
        state: st,
        walkTravelPx: walkTravel,
        footX,
        surfaceOf,
        standPoint,
        letterLift,
        metrics: (el: HTMLElement) => textMetrics.get(el),
        poofAt,
        parade: () => {
          preloadParade();
          if (paradeReady) startParade();
        },
        standOn: (el: HTMLElement, anchor: number, section: string) => {
          st.perch = el;
          st.anchor = anchor;
          st.perchSection = section;
          st.greeted = section;
          st.nextIdleAt = performance.now() + 60000;
        },
      };
    }

    updateSize();
    window.addEventListener("resize", updateSize);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseout", onPointerLeavePage);
    frame = requestAnimationFrame(onFrame);

    const on = readEnabled();
    setEnabled(on);
    const intro = on ? window.setTimeout(summon, 1700) : 0;
    // on every page load: point out the corner button that hides him
    const showHint = on;
    const hintIn = showHint ? window.setTimeout(() => setHint(window.matchMedia("(hover: none), (pointer: coarse)").matches ? "Tap" : "Click"), HINT_DELAY_MS) : 0;
    const hintOut = showHint ? window.setTimeout(() => setHint(null), HINT_DELAY_MS + HINT_MS) : 0;

    return () => {
      cancelAnimationFrame(frame);
      late?.disconnect();
      sentinel.remove();
      window.clearTimeout(intro);
      window.clearTimeout(hintIn);
      window.clearTimeout(hintOut);
      window.clearTimeout(bubbleTimer);
      window.clearTimeout(dwellTimer);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", updateSize);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseout", onPointerLeavePage);
      controller.current = null;
    };
  }, [appear]);

  // Keep the speech bubble on screen with its tail pointing at his head
  useLayoutEffect(() => {
    const el = bubbleRef.current;
    if (!bubble || !el) return;
    const bw = el.offsetWidth;
    const { x: guideX, y: guideY } = pos.current;
    const head = box / 2;
    const preferred = guideX + head > window.innerWidth / 2 ? head + 30 - bw : head - 30;
    const left = clamp(preferred, 8 - guideX, window.innerWidth - RAIL_GUTTER - guideX - bw);
    const tail = clamp(head - left - 5, 14, bw - 24);
    const below = guideY + HAT_Y * scale - el.offsetHeight - 14 < 8;
    setBubblePos({ left, tail, below });
  }, [bubble, box, scale]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    saveEnabled(next);
    setHint(null);
    if (next) controller.current?.summon();
    else controller.current?.dismiss();
  };

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className={`${styles.toggle} ${enabled ? "" : styles.toggleOff} ${hint ? styles.toggleCalling : ""}`}
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={enabled ? "Hide Doctor Livesey" : "Bring back Doctor Livesey"}
      >
        <Image src={getImagePath("/icons/doctor-livsey-favicon-64.png")} alt="" width={64} height={64} />
        <span className={styles.toggleSlash} aria-hidden="true" />
        <span className={styles.toggleTip}>{enabled ? "Hide Livesey" : "Bring Livesey back"}</span>
      </button>

      {/* on-load hint: the corner button hides him */}
      <div className={styles.hintLive} role="status" aria-live="polite">
        <AnimatePresence>
          {hint && (
            <motion.div
              className={styles.hint}
              initial={{ opacity: 0, x: -12, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, transition: { duration: 0.25 } }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
            >
              <span className={styles.bubbleStar} aria-hidden="true">*</span>
              Meet <strong>Doctor Livesey</strong>! {hint} here anytime to hide him.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {present && (
        <div ref={placeGuide} className={`${styles.guide} ${away ? styles.guideAway : ""}`} style={{ width: box }}>
          <motion.div style={{ scale: appear, transformOrigin: `${CEL_ANCHOR.x * scale}px ${CEL_ANCHOR.y * scale}px` }}>
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
                {bubble.split(CYRILLIC_RUN).map((part, i) =>
                  i % 2 ? (
                    <span key={i} className={styles.bubbleRu} lang="ru">
                      {part}
                    </span>
                  ) : (
                    part
                  ),
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            className={styles.sprite}
            style={{ height: box }}
            onClick={() => controller.current?.tap()}
            aria-label="Doctor Livesey. Press to make him laugh."
          >
            <span
              className={styles.shadow}
              data-airborne={airborne}
              aria-hidden="true"
              style={{ bottom: (CEL_SIZE - CEL_ANCHOR.y) * scale - 4 }}
            />
            <AnimatePresence>
              {dust > 0 && (
                <motion.span
                  key={dust}
                  className={styles.dust}
                  aria-hidden="true"
                  style={{ bottom: (CEL_SIZE - CEL_ANCHOR.y) * scale - 6 }}
                  initial={{ opacity: 0.7, scaleX: 0.4, scaleY: 0.5 }}
                  animate={{ opacity: 0, scaleX: 1.6, scaleY: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
            {/* mirrored around the foot anchor (= the cel's centre line) when facing left */}
            {/* leans toward the cursor around his feet; written straight to the DOM by the engine */}
            <span
              ref={leanEl}
              className={styles.lean}
              style={{ transformOrigin: `${CEL_ANCHOR.x * scale}px ${CEL_ANCHOR.y * scale}px` }}
            >
              <span className={styles.flip} style={{ transform: `scaleX(${facing})` }}>
                <CelSprite ref={sprite} scale={scale} className={styles.cel} />
              </span>
            </span>
          </button>
          </motion.div>
        </div>
      )}

      {/* the finale: Jim, the doctor and the squire stroll along the footer (positioned by the engine) */}
      {parade && (
        <div
          ref={paradeEl}
          className={styles.parade}
          aria-hidden="true"
          style={{ backgroundImage: `url("${getImagePath(PARADE_SRC)}")` }}
        />
      )}

      {poofs.map((p) => (
        <span
          key={p.id}
          className={styles.poof}
          aria-hidden="true"
          style={{ left: p.x, top: p.y, ["--s" as string]: p.s, ["--poof-ms" as string]: `${POOF_MS}ms` }}
        >
          <span className={styles.poofRing} />
          {PUFFS.map((f, i) => (
            <span
              key={i}
              className={styles.puff}
              style={
                {
                  "--x": f.x,
                  "--y": f.y,
                  "--r": f.r,
                  "--dx": f.dx,
                  "--dy": f.dy,
                  animationDelay: `${f.d}s`,
                } as React.CSSProperties
              }
            />
          ))}
          {SPARKS.map((k, i) => (
            <span
              key={`s${i}`}
              className={styles.spark}
              style={{ "--sx": k.x, "--sy": k.y, animationDelay: `${k.d}s` } as React.CSSProperties}
            >
              *
            </span>
          ))}
        </span>
      ))}

      {preview && <LiveseyPreview onClose={() => setPreview(false)} />}
    </>
  );
}
