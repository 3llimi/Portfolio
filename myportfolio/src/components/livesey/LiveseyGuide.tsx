"use client";
import Image from "next/image";
import dynamic from "next/dynamic";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
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
 *   leaps to the next section when the visitor moves on.
 * - Linger on a project card (or focus its README button) → notice → swagger one walk cycle (two
 *   steps) if the ledge has room, settle, present; on a short ledge notice → present directly. The
 *   hand stays out while the visitor reads, then the release gesture folds it back.
 * - Fast flick → brace and hold; when scrolling settles he lands on one visible destination.
 * - Tap / keyboard → laugh (never stacks). A dialog opens → he clears out; a selected skill gets a
 *   nod once its dialog closes. One short line of speech on a relevant section change.
 */

const LiveseyPreview = dynamic(() => import("./LiveseyPreview"), { ssr: false });

const getImagePath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;

const LINES: Record<string, string> = {
  Home: "Ha-ha-ha! Welcome aboard, matey!",
  About: "A software engineer? Splendid fellow!",
  Skills: "Rust, Go, Kubernetes… ho-ho, a fine crew!",
  Projects: "Treasure! Every last piece of it!",
  GitHub: "Read the README. Doctor's orders!",
  Contact: "Write to him, matey! Ha-ha-ha!",
};

const STORAGE_KEY = "livesey-enabled";
const RAIL_GUTTER = 30; // keep clear of the custom scroll rail on the right
/** cel scale: matches the site's character size (≈96 px wide on desktop, ≈60 px on phones) */
const SCALE_DESKTOP = 0.52;
const SCALE_MOBILE = 0.33;
/** horizontal extent of the character inside the 256-px cel (for keeping him on screen) */
const CHAR_LEFT = 18;
const CHAR_RIGHT = 210;

const DWELL_MS = 250; // linger this long on a project before he reacts
const CARD_COOLDOWN_MS = 8000; // don't re-present the same card over and over
const RELEASE_GRACE_MS = 600; // visitor left the card → fold the hand back after this
const FAST_SCROLL = 2200; // px/s: above this he braces
const BRISK_SCROLL = 900; // px/s: brisk enough that losing his ledge counts as a flick too
const SETTLE_MS = 180; // scrolling must be still this long before he lands

const JUMP_FRAMES = CEL.clips.jump.frames.length;
const TAKEOFF_FRAME = Math.round(JUMP_FRAMES * 0.25); // travel arc starts here…
const CONTACT_FRAME = Math.round(JUMP_FRAMES * 0.78); // …and touches down here; the rest settles
const PRESENT_HOLD = CEL.clips.present.frames[CEL.clips.present.frames.length - 1].id;

type Point = { x: number; y: number };
type PerchTarget = { el: HTMLElement | null; anchor: number; section: string };
type Target = PerchTarget | { point: Point };
type Mode = "hidden" | "idle" | "walking" | "takeoff" | "jumping" | "bracing" | "away";
type Flight = { fromX: number; fromY: number; start: number; duration: number; arc: number; to: Target; onLand?: () => void };
type Seq = {
  name: string;
  frames: CelFrameRef[];
  end: CelEnd | "next";
  next?: { clip: CelClipName; frame: number };
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

  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const appear = useMotionValue(1);

  const sprite = useRef<CelSpriteHandle | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
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
      stillSince: 0,
    };
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
      st.seq = seq;
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
            ? Math.max(st.beltAdvanceMs, dtMs * rate * 0.7)
            : st.beltAdvanceMs
          : dtMs * rate;
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

    const currentSection = () => {
      const probe = window.innerHeight * 0.5;
      let name = "Home";
      document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
        if (el.getBoundingClientRect().top <= probe) name = el.dataset.section ?? name;
      });
      return name;
    };

    /** cel top-left that puts his foot anchor at `anchor` across the perch's top edge */
    const standPoint = (el: HTMLElement, anchor: number) => {
      const r = el.getBoundingClientRect();
      const px = clampX(r.left + r.width * anchor - CEL_ANCHOR.x * st.s);
      const py = r.top - CEL_ANCHOR.y * st.s;
      const top = py + 16 * st.s; // his hat
      const visible =
        r.width > 0 && r.height > 0 && top > 6 && r.top < window.innerHeight - 12 && r.right > 0 && r.left < window.innerWidth;
      return { x: px, y: py, visible };
    };

    const floorPoint = (anchor: number): Point => ({
      x: clampX(12 + (window.innerWidth - 24 - RAIL_GUTTER) * anchor - CEL_ANCHOR.x * st.s),
      y: window.innerHeight - 8 - CEL_ANCHOR.y * st.s,
    });

    const anchorFor = (el: HTMLElement) => (el.dataset.perchX ? Number(el.dataset.perchX) : rand(0.18, 0.82));

    const visiblePerches = (section: string) =>
      Array.from(document.querySelectorAll<HTMLElement>(`[data-perch="${section}"]`)).filter(
        (el) => standPoint(el, 0.5).visible,
      );

    const pickPerch = (section: string, avoid: HTMLElement | null): PerchTarget | null => {
      let options = visiblePerches(section);
      // on the projects carousel he walks on the cards, not on the heading
      const cards = options.filter((el) => el.hasAttribute("data-project-card"));
      if (cards.length) {
        options = cards.filter((el) => {
          const r = el.getBoundingClientRect();
          return r.left > 40 && r.right < window.innerWidth - 40;
        });
        if (!options.length) options = cards;
      }
      if (options.length === 0) return null;
      const fresh = options.filter((el) => el !== avoid);
      const list = fresh.length ? fresh : options;
      const el = list[Math.floor(Math.random() * list.length)];
      return { el, anchor: anchorFor(el), section };
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
      const r = st.perch.getBoundingClientRect();
      if (fx < r.left || fx > r.right) {
        const next = Array.from(document.querySelectorAll<HTMLElement>(`[data-perch="${st.perchSection}"]`)).find((el) => {
          const e = el.getBoundingClientRect();
          return fx >= e.left && fx <= e.right && Math.abs(e.top - r.top) < 8;
        });
        if (next) st.perch = next;
      }
      const pr = st.perch.getBoundingClientRect();
      st.anchor = (fx - pr.left) / Math.max(1, pr.width);
    };

    // ---------------- jumping ----------------
    /** leave a ledge: play the jump crouch with the root held, then fly from ~25 % of the clip */
    const jumpTo = (target: Target, opts: { arc?: number; onLand?: () => void; fromBrace?: boolean } = {}) => {
      st.treadmill = false;
      st.treadmillStop = false;
      st.target = null;
      st.presenting = false;
      st.walkCyclesLeft = 0;
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
      st.pendingFlight = { target, arc: opts.arc, onLand: opts.onLand };
      if (opts.fromBrace) playLink(CEL.transitions["brace-takeoff"], "brace-takeoff");
      else playClip("jump");
    };

    const startFlight = (target: Target, arcOpt?: number, onLand?: () => void) => {
      const fromX = x.get();
      const fromY = y.get();
      const dest = resolve(target);
      const dist = Math.hypot(dest.x - fromX, dest.y - fromY);
      const wantedArc = arcOpt ?? clamp(60 + dist * 0.28, 70, 260);
      const maxArc = Math.max(30, (fromY + dest.y) / 2 - 12); // apex stays inside the viewport
      st.mode = "jumping";
      setAirborne(true);
      st.flight = {
        fromX,
        fromY,
        start: performance.now(),
        // short hops follow the clip's own airtime (25 % → 78 % of 1.08 s); long flights stretch it
        duration: (Math.max(0.57, Math.min(1.15, 0.45 + dist / 1900)) * 1000) / rate,
        arc: Math.min(wantedArc, maxArc),
        to: target,
        onLand,
      };
    };

    const tickFlight = (now: number) => {
      const f = st.flight;
      if (!f) return;
      const t = clamp((now - f.start) / f.duration, 0, 1);
      const live = resolve(f.to);
      const dest = { x: clampX(live.x), y: clamp(live.y, 8 - 16 * st.s, window.innerHeight - boxPx()) };
      x.set(f.fromX + (dest.x - f.fromX) * easeInOutSine(t));
      const arc = Math.min(f.arc, Math.max(20, Math.min(f.fromY, dest.y) + 10 * st.s));
      y.set(f.fromY + (dest.y - f.fromY) * t - arc * 4 * t * (1 - t));
      // the airborne drawings follow the real flight phase
      const idx = Math.round(TAKEOFF_FRAME + t * (CONTACT_FRAME - TAKEOFF_FRAME));
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
          later(() => say(LINES[target.section] ?? LINES.Home), 260);
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
      if (st.mode === "hidden" || st.mode === "away") return;
      if (st.mode === "jumping" || st.mode === "takeoff" || st.mode === "bracing") {
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
          } else if (plan.kind === "hop") {
            // too far for two steps: hop along the ledge first, then swagger the last two steps
            jumpTo(plan.spot, {
              arc: 60,
              onLand: () => {
                st.target = el;
                setFace(dir);
                startWalk(1, presentIt, true);
              },
            });
            st.target = el;
          } else {
            // short ledge: notice-present joins straight into the gesture
            st.presenting = true;
            playLink(CEL.transitions["notice-present"], "notice-present");
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

    /** a project card on the same ledge whose top edge spans screen-x `cx` */
    const cardAt = (cx: number, top: number) =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-project-card]")).find((c) => {
        const e = c.getBoundingClientRect();
        return cx >= e.left - 18 && cx <= e.right + 18 && Math.abs(e.top - top) < 8;
      }) ?? null;

    type Plan = { kind: "stay" } | { kind: "walk" } | { kind: "hop"; spot: PerchTarget };

    /**
     * He should finish standing just inside the target card's near edge, so his presenting hand
     * opens out over that card. One walk cycle if that's where two steps end; a hop along the ledge
     * first if it's further; stay planted (notice → present) if it's too close or not on his ledge.
     */
    const planApproach = (el: HTMLElement, dir: 1 | -1): Plan => {
      if (!st.perch || !st.perch.hasAttribute("data-project-card")) return { kind: "stay" };
      const ledgeTop = st.perch.getBoundingClientRect().top;
      const card = el.getBoundingClientRect();
      if (Math.abs(ledgeTop - card.top) > 8) return { kind: "stay" };
      const travel = walkTravel();
      const endFoot = dir === 1 ? card.left + card.width * 0.12 : card.right - card.width * 0.12;
      const endX = endFoot - CEL_ANCHOR.x * st.s;
      if (clampX(endX) !== endX) return { kind: "stay" };
      const needed = (endFoot - footX()) * dir;
      if (needed < travel * 0.7) return { kind: "stay" };
      if (needed <= travel * 1.35) return { kind: "walk" };
      const startFoot = endFoot - travel * dir;
      const under = cardAt(startFoot, ledgeTop);
      if (!under) return { kind: "stay" };
      const r = under.getBoundingClientRect();
      return { kind: "hop", spot: { el: under, anchor: clamp((startFoot - r.left) / r.width, 0.02, 0.98), section: st.perchSection } };
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
      if (roll < 0.35) {
        const next = pickPerch(st.perchSection, st.perch);
        if (next && next.el !== st.perch) {
          jumpTo(next);
          return;
        }
      }
      if (roll < 0.6 && st.perch && !reduceMotion) {
        // stroll one walk cycle along the ledge if there's room
        const r = st.perch.getBoundingClientRect();
        const travel = walkTravel();
        const fx = footX();
        const canRight = fx + travel < r.right - 20 && clampX(x.get() + travel) === x.get() + travel;
        const canLeft = fx - travel > r.left + 20 && clampX(x.get() - travel) === x.get() - travel;
        const dir: 1 | -1 | 0 = canRight && canLeft ? (Math.random() < 0.5 ? 1 : -1) : canRight ? 1 : canLeft ? -1 : 0;
        if (dir !== 0) {
          setFace(dir);
          startWalk(1, idle, true);
        }
      }
      st.nextIdleAt = performance.now() + rand(7000, 12000);
    };

    // ---------------- main loop ----------------
    const tick = (now: number) => {
      const dtMs = Math.min(50, now - st.last);
      st.last = now;

      // scroll speed (Lenis-smoothed scrolling still reports a high speed on a flick)
      const sy = window.scrollY;
      const v = (Math.abs(sy - st.lastScrollY) / Math.max(dtMs, 1)) * 1000;
      st.lastScrollY = sy;
      st.scrollSpeed = st.scrollSpeed * 0.6 + v * 0.4;
      if (st.scrollSpeed < 40) {
        if (!st.stillSince) st.stillSince = now;
      } else st.stillSince = 0;

      // dialogs take priority over everything ambient
      const dialogOpen = document.querySelector('[role="dialog"]') !== null;
      if (dialogOpen && st.mode !== "away" && st.mode !== "hidden") {
        st.mode = "away";
        st.flight = null;
        st.pendingFlight = null;
        st.target = null;
        st.presenting = false;
        st.walkCyclesLeft = 0;
        setAirborne(false);
        setBubble(null);
        setAway(true);
        idle();
      } else if (!dialogOpen && st.mode === "away") {
        // restore him to a visible perch with a standalone landing
        st.mode = "idle";
        setAway(false);
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
      } else if (st.mode === "bracing") {
        // hold (inside the viewport) until scrolling settles, then pick ONE visible destination
        y.set(clamp(y.get(), 8 - 16 * st.s, window.innerHeight - boxPx()));
        if (st.stillSince && now - st.stillSince > SETTLE_MS) {
          const section = currentSection();
          const here = st.perch ? standPoint(st.perch, st.anchor) : null;
          if (here && here.visible && section === st.perchSection) {
            st.mode = "idle";
            x.set(here.x);
            y.set(here.y);
            playLink(CEL.releases.brace, "brace-release");
          } else {
            const next = pickPerch(section, null);
            st.mode = "idle";
            st.perch = null; // take off from where he held the brace, not from the old (scrolled-away) ledge
            jumpTo(next ?? { el: null, anchor: clamp(footX() / window.innerWidth, 0.1, 0.9), section }, { fromBrace: true });
          }
        }
      } else if (st.mode === "idle" || st.mode === "walking" || st.mode === "takeoff") {
        const ledgeLost =
          st.mode === "idle" &&
          st.scrollSpeed > BRISK_SCROLL &&
          (!st.perch || !standPoint(st.perch, st.anchor).visible || currentSection() !== st.perchSection);
        if ((st.scrollSpeed > FAST_SCROLL || ledgeLost) && st.mode === "idle" && !reduceMotion) {
          // brace once and hold; discard intermediate greetings
          st.treadmill = false;
          st.treadmillStop = false;
          st.mode = "bracing";
          st.target = null;
          st.presenting = false;
          setBubble(null);
          playClip("brace");
        } else {
          const section = currentSection();
          if (st.mode === "walking") {
            // locomotion synced to accumulated clip time: one cycle covers WALK_TRAVEL_PX × s
            if (st.seq.name === "walk") {
              x.set(x.get() + (walkTravel() / WALK_CYCLE_MS) * dtMs * rate * st.facing);
              rePerch();
            }
            if (st.perch) y.set(standPoint(st.perch, st.anchor).y);
          } else if (st.perch && st.treadmill && section === st.perchSection && standPoint(st.perch, st.anchor).visible) {
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
            const p = standPoint(st.perch, st.anchor);
            if (st.mode === "idle" && (section !== st.perchSection || !p.visible)) {
              const next = pickPerch(section, section === st.perchSection ? st.perch : null);
              if (next) jumpTo(next);
              else if (!p.visible) jumpTo({ el: null, anchor: rand(0.1, 0.9), section });
              else {
                x.set(p.x);
                y.set(p.y);
              }
            } else {
              x.set(p.x); // ride along with the ledge (also through a jump's crouch)
              y.set(p.y);
            }
          } else if (st.mode === "idle") {
            const next = pickPerch(section, null);
            if (next) jumpTo(next);
            else {
              const p = floorPoint(st.anchor);
              x.set(p.x);
              y.set(p.y);
              st.perchSection = section;
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
          const beltMoving = Math.abs(st.ledgeV) > 10;
          if (onBelt && beltMoving && !st.noticeAfterStep && (st.seq.name === "idle" || (st.seq.name === "walk" && st.treadmill))) {
            if (!st.treadmill) {
              st.treadmill = true;
              setFace(st.ledgeV < 0 ? 1 : -1); // walk against the flow
              playClip("walk");
            }
            st.treadmillStop = false;
          } else if (st.treadmill && (!onBelt || Math.abs(st.ledgeV) < 6)) {
            st.treadmillStop = true; // finish the step, then settle
          }
          if (st.treadmill) st.walkRate = clamp(Math.abs(st.ledgeV) / nominal, 0.25, 1.8);

          // the visitor left the card he's presenting / noticing
          if (st.target && !st.targetActive && now - st.targetLeftAt > RELEASE_GRACE_MS && st.mode === "idle") {
            const n = st.seq.name;
            if (n === "present" || n === "notice" || n === "notice-present") releaseTarget();
          }
          if (st.mode === "idle" && st.seq.name === "idle" && !st.target && now > st.nextIdleAt) idleAction();
        }
      }

      tickPlayer(dtMs);
      frame = requestAnimationFrame(tick);
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
    frame = requestAnimationFrame(tick);

    const on = readEnabled();
    setEnabled(on);
    const intro = on ? window.setTimeout(summon, 1700) : 0;

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(intro);
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
      controller.current = null;
    };
  }, [appear, x, y]);

  // Keep the speech bubble on screen with its tail pointing at his head
  useLayoutEffect(() => {
    const el = bubbleRef.current;
    if (!bubble || !el) return;
    const bw = el.offsetWidth;
    const guideX = x.get();
    const head = box / 2;
    const preferred = guideX + head > window.innerWidth / 2 ? head + 30 - bw : head - 30;
    const left = clamp(preferred, 8 - guideX, window.innerWidth - RAIL_GUTTER - guideX - bw);
    const tail = clamp(head - left - 5, 14, bw - 24);
    const below = y.get() + 16 * scale - el.offsetHeight - 14 < 8;
    setBubblePos({ left, tail, below });
  }, [bubble, box, scale, x, y]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    saveEnabled(next);
    if (next) controller.current?.summon();
    else controller.current?.dismiss();
  };

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
        <motion.div
          className={`${styles.guide} ${away ? styles.guideAway : ""}`}
          style={{ x, y, width: box, scale: appear, transformOrigin: `${CEL_ANCHOR.x * scale}px ${CEL_ANCHOR.y * scale}px` }}
        >
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
            <span className={styles.flip} style={{ transform: `scaleX(${facing})` }}>
              <CelSprite ref={sprite} scale={scale} className={styles.cel} />
            </span>
          </button>
        </motion.div>
      )}

      {preview && <LiveseyPreview onClose={() => setPreview(false)} />}
    </>
  );
}
