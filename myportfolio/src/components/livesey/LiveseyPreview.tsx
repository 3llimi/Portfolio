"use client";
/**
 * DEVELOPMENT-ONLY preview of the Livesey Cel Edition (open the site with ?livesey-preview).
 * Plays every clip, transition and release at the on-site scales and at 1:1, at 1× or ¼ speed,
 * with frame stepping. The walk travels along a ledge at the pack's reference stride.
 */
import React, { useEffect, useRef, useState } from "react";
import { CEL, CEL_ANCHOR, CEL_SIZE, CelSprite, WALK_CYCLE_MS, WALK_TRAVEL_PX, type CelFrameRef, type CelSpriteHandle } from "./liveseyCel";

type Entry = { key: string; frames: CelFrameRef[]; loop: boolean };

const ENTRIES: Entry[] = [
  ...Object.entries(CEL.clips).map(([k, c]) => ({ key: k, frames: c.frames, loop: true })),
  ...Object.entries(CEL.transitions).map(([k, c]) => ({ key: `transition: ${k}`, frames: c.frames, loop: true })),
  ...Object.entries(CEL.releases).map(([k, c]) => ({ key: `release: ${k}`, frames: c.frames, loop: true })),
];
const SCALES = [0.52, 0.33, 1];

export default function LiveseyPreview({ onClose }: { onClose: () => void }) {
  const [entry, setEntry] = useState(ENTRIES[0]);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  const sprites = useRef<(CelSpriteHandle | null)[]>([]);
  const walkers = useRef<(HTMLDivElement | null)[]>([]);
  const st = useRef({ i: 0, t: 0, last: 0, travel: 0 });

  const apply = (i: number) => {
    st.current.i = i;
    setFrame(i);
    sprites.current.forEach((s) => s?.setFrame(entry.frames[i].id));
  };

  useEffect(() => {
    st.current = { i: 0, t: 0, last: performance.now(), travel: 0 };
    apply(0);
    walkers.current.forEach((w) => w && (w.style.transform = "translateX(0px)"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    st.current.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(100, now - st.current.last) * speed;
      st.current.last = now;
      st.current.t += dt;
      let i = st.current.i;
      while (st.current.t >= entry.frames[i].ms) {
        st.current.t -= entry.frames[i].ms;
        i = i + 1 >= entry.frames.length ? 0 : i + 1;
      }
      if (i !== st.current.i) apply(i);
      if (entry.key === "walk") {
        st.current.travel = (st.current.travel + (WALK_TRAVEL_PX / WALK_CYCLE_MS) * dt) % (WALK_TRAVEL_PX * 3);
        walkers.current.forEach((w, k) => w && (w.style.transform = `translateX(${st.current.travel * SCALES[k]}px)`));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, entry]);

  const step = (d: number) => {
    setPlaying(false);
    apply((st.current.i + d + entry.frames.length) % entry.frames.length);
  };

  const btn = (active = false): React.CSSProperties => ({
    padding: "5px 9px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.25)",
    background: active ? "#fff" : "rgba(255,255,255,.06)",
    color: active ? "#000" : "#fff",
    fontSize: 12,
    cursor: "pointer",
  });

  return (
    <div
      data-lenis-prevent
      style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(10,10,12,.97)", color: "#fff", overflow: "auto", padding: 20, fontFamily: "ui-monospace, monospace" }}
    >
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <strong style={{ marginRight: 8 }}>Livesey Cel Edition — preview (dev only)</strong>
        {ENTRIES.map((e) => (
          <button key={e.key} type="button" style={btn(e.key === entry.key)} onClick={() => setEntry(e)}>
            {e.key}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 12 }}>
        <button type="button" style={btn(speed === 1)} onClick={() => setSpeed(1)}>1×</button>
        <button type="button" style={btn(speed === 0.25)} onClick={() => setSpeed(0.25)}>¼×</button>
        <button type="button" style={btn()} onClick={() => setPlaying((p) => !p)}>{playing ? "pause" : "play"}</button>
        <button type="button" style={btn()} onClick={() => step(-1)}>◀ frame</button>
        <button type="button" style={btn()} onClick={() => step(1)}>frame ▶</button>
        <button type="button" style={btn()} onClick={onClose}>close</button>
        <span style={{ fontSize: 12, opacity: 0.75, marginLeft: 10 }}>
          {entry.key} · frame {frame + 1}/{entry.frames.length} · {entry.frames[frame]?.id} · {entry.frames[frame]?.ms} ms
        </span>
      </div>

      <div style={{ display: "flex", gap: 48, alignItems: "flex-end", flexWrap: "wrap" }}>
        {SCALES.map((s, k) => (
          <div key={s} style={{ position: "relative", width: CEL_SIZE * s + (entry.key === "walk" ? WALK_TRAVEL_PX * 3 * s : 0), height: CEL_SIZE * s + 20 }}>
            {/* ledge line at the foot anchor */}
            <div style={{ position: "absolute", left: 0, right: 0, top: CEL_ANCHOR.y * s, borderTop: "2px solid #ecc53c" }} />
            <div ref={(el) => { walkers.current[k] = el; }} style={{ position: "absolute", left: 0, top: 0 }}>
              <CelSprite ref={(h) => { sprites.current[k] = h; }} scale={s} initial={entry.frames[0].id} />
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, fontSize: 11, opacity: 0.7 }}>scale {s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
