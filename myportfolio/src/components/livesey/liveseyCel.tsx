"use client";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import manifest from "./animations.json";

/**
 * Dr. Livesey — Cel Edition animation pack. Frame list + timings: ./animations.json (bundled).
 * Sprite atlases: public/livesey/.
 *
 * Every frame is a 256 × 256 cel on one of three WebP atlas pages, all sharing the foot anchor
 * (128, 235). At scale `s` the cel's top-left goes at (perchX − 128s, perchY − 235s); mirroring for
 * a left-facing doctor happens around that same anchor (the cel's horizontal centre).
 */

export type CelFrameRef = { id: string; ms: number };
export type CelEnd = "loop" | "hold" | "idle";
export type CelClip = { end: CelEnd; frames: CelFrameRef[]; travelPerCyclePx?: number };
export type CelLink = { frames: CelFrameRef[]; nextClip: string; nextFrame: number };

type Manifest = {
  canvas: { width: number; height: number };
  anchor: { x: number; y: number };
  defaultFrame: string;
  frames: Record<string, { file: string; rect: number[]; atlas: string }>;
  clips: Record<string, CelClip>;
  transitions: Record<string, CelLink>;
  releases: Record<string, CelLink>;
  atlases: string[];
};

export const CEL = manifest as unknown as Manifest;
export type CelClipName = "idle" | "notice" | "walk" | "present" | "jump" | "land" | "brace" | "nod" | "laugh";

export const CEL_SIZE = CEL.canvas.width; // 256
export const CEL_ANCHOR = CEL.anchor; // (128, 235)
/** source pixels travelled by one walk cycle (two steps) */
export const WALK_TRAVEL_PX = CEL.clips.walk.travelPerCyclePx ?? 104;
export const WALK_CYCLE_MS = CEL.clips.walk.frames.reduce((sum, f) => sum + f.ms, 0);

const PACK_DIR = "/livesey/";
export const celUrl = (file: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${PACK_DIR}${file}`;

/** atlas page sizes, derived from the frame rects (every page is fully packed) */
const ATLAS_SIZE: Record<string, [number, number]> = {};
for (const f of Object.values(CEL.frames)) {
  const [x, y, w, h] = f.rect;
  const cur = ATLAS_SIZE[f.atlas] ?? [0, 0];
  ATLAS_SIZE[f.atlas] = [Math.max(cur[0], x + w), Math.max(cur[1], y + h)];
}

/** Start downloading the atlas pages (the first one holds idle, so it goes first). */
export function preloadCelAtlases() {
  return Promise.all(
    CEL.atlases.map(
      (name) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          img.onload = img.onerror = () => resolve();
          img.src = celUrl(name);
        }),
    ),
  );
}

export type CelSpriteHandle = { setFrame: (id: string) => void };

/**
 * One cel, drawn from its atlas page as a CSS background. Frame changes are applied straight to the
 * DOM through the handle (no React re-render per 30 ms frame).
 */
export const CelSprite = forwardRef<CelSpriteHandle, { scale: number; initial?: string; className?: string }>(
  function CelSprite({ scale, initial = CEL.defaultFrame, className }, ref) {
    const el = useRef<HTMLDivElement | null>(null);
    const current = useRef(initial);

    const styleFor = (id: string): React.CSSProperties => {
      const f = CEL.frames[id] ?? CEL.frames[CEL.defaultFrame];
      const [x, y] = f.rect;
      const [aw, ah] = ATLAS_SIZE[f.atlas];
      return {
        backgroundImage: `url("${celUrl(f.atlas)}")`,
        backgroundSize: `${aw * scale}px ${ah * scale}px`,
        backgroundPosition: `${-x * scale}px ${-y * scale}px`,
      };
    };

    useImperativeHandle(
      ref,
      () => ({
        setFrame: (id: string) => {
          current.current = id;
          const node = el.current;
          if (!node) return;
          const s = styleFor(id);
          node.style.backgroundImage = s.backgroundImage as string;
          node.style.backgroundSize = s.backgroundSize as string;
          node.style.backgroundPosition = s.backgroundPosition as string;
          node.dataset.frame = id;
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [scale],
    );

    return (
      <div
        ref={el}
        className={className}
        data-frame={current.current}
        style={{
          width: CEL_SIZE * scale,
          height: CEL_SIZE * scale,
          backgroundRepeat: "no-repeat",
          ...styleFor(current.current),
        }}
      />
    );
  },
);
