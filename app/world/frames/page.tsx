"use client";

// Dev reference: lays the walk cycle out in the order the frames actually
// play, with a live animation, so editing the poses in lib/world/sprites.ts
// is intuitive. Not linked from the game. Visit /world/frames.

import { useEffect, useMemo, useState } from "react";
import {
  PALETTE,
  PLAYER_FRAMES,
  PLAYER_STEP_SEQUENCE,
  spriteToDataUrl,
} from "@/lib/world/sprites";

// Index → human name, matching the order of PLAYER_FRAMES.front/back.
const POSE_NAMES = [
  "idle",
  "contact L",
  "half L",
  "passing",
  "half R",
  "contact R",
];

// In game a footfall spans this long, split across its sub-sequence.
const STEP_MS = 150;

type View = "front" | "back";

export default function WalkFramesPage() {
  const [urls, setUrls] = useState<{ front: string[]; back: string[] } | null>(
    null
  );
  const [view, setView] = useState<View>("front");
  const [mirror, setMirror] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setUrls({
      front: PLAYER_FRAMES.front.map(spriteToDataUrl),
      back: PLAYER_FRAMES.back.map(spriteToDataUrl),
    });
  }, []);

  // The real temporal loop: left footfall then right footfall, repeating.
  const loop = useMemo(
    () => [...PLAYER_STEP_SEQUENCE.left, ...PLAYER_STEP_SEQUENCE.right],
    []
  );

  const frameMs = STEP_MS / PLAYER_STEP_SEQUENCE.left.length;

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(
      () => setTick((n) => (n + 1) % loop.length),
      frameMs
    );
    return () => window.clearInterval(t);
  }, [playing, loop.length, frameMs]);

  const viewUrls = urls?.[view] ?? [];
  const contactIdx = { 1: "TIP", 5: "TAP" } as Record<number, string>;

  function Sprite({ poseIndex, scale }: { poseIndex: number; scale: number }) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={viewUrls[poseIndex]}
        alt={POSE_NAMES[poseIndex]}
        style={{
          width: 24 * scale,
          height: 40 * scale,
          imageRendering: "pixelated",
          transform: mirror ? "scaleX(-1)" : undefined,
          display: "block",
        }}
      />
    );
  }

  const btn = (active: boolean): React.CSSProperties => ({
    background: active ? PALETTE.mauve : PALETTE.dark,
    border: `2px solid ${PALETTE.mauve}`,
    color: active ? PALETTE.ink : PALETTE.pale,
    padding: "6px 12px",
    fontFamily: "inherit",
    fontSize: 11,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: 1,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PALETTE.void,
        color: PALETTE.pale,
        fontFamily: "monospace",
        padding: "28px 24px 60px",
        letterSpacing: 1,
      }}
    >
      <div style={{ color: PALETTE.gold, fontSize: 14, marginBottom: 4 }}>
        WALK FRAMES — reference
      </div>
      <div style={{ fontSize: 11, color: PALETTE.mauve, marginBottom: 20 }}>
        Edit the leg poses in{" "}
        <span style={{ color: PALETTE.pale }}>lib/world/sprites.ts</span> and
        reload. Order comes from PLAYER_STEP_SEQUENCE.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <button style={btn(view === "front")} onClick={() => setView("front")}>
          Front
        </button>
        <button style={btn(view === "back")} onClick={() => setView("back")}>
          Back
        </button>
        <button style={btn(mirror)} onClick={() => setMirror((m) => !m)}>
          Mirror (facing L)
        </button>
        <button style={btn(playing)} onClick={() => setPlaying((p) => !p)}>
          {playing ? "Pause" : "Play"}
        </button>
      </div>

      {/* All poses, in array order, labelled with their edit name + index. */}
      <div style={{ fontSize: 11, color: PALETTE.gold, marginBottom: 10 }}>
        POSES (PLAYER_FRAMES.{view})
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 40 }}>
        {POSE_NAMES.map((name, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                border: `1px solid ${PALETTE.wall}`,
                background: PALETTE.dark,
                padding: 6,
              }}
            >
              {viewUrls.length > 0 && <Sprite poseIndex={i} scale={3} />}
            </div>
            <div style={{ fontSize: 10, marginTop: 6, color: PALETTE.pale }}>
              {i} · {name}
            </div>
          </div>
        ))}
      </div>

      {/* The frames in the exact order they play while walking. */}
      <div style={{ fontSize: 11, color: PALETTE.gold, marginBottom: 10 }}>
        TEMPORAL ORDER — one full stride (loops)
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 40 }}>
        {loop.map((poseIndex, i) => {
          const isNow = i === tick;
          const word = contactIdx[poseIndex];
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: PALETTE.mauve, height: 12 }}>
                {word ?? ""}
              </div>
              <div
                style={{
                  border: `2px solid ${isNow ? PALETTE.gold : PALETTE.wall}`,
                  background: PALETTE.dark,
                  padding: 5,
                }}
              >
                {viewUrls.length > 0 && <Sprite poseIndex={poseIndex} scale={2.5} />}
              </div>
              <div style={{ fontSize: 9, marginTop: 5, color: PALETTE.pale }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 8, color: PALETTE.mauve }}>
                {Math.round(i * frameMs)}ms
              </div>
              <div style={{ fontSize: 8, color: PALETTE.mauve }}>
                {POSE_NAMES[poseIndex]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live animation at in-game timing. */}
      <div style={{ fontSize: 11, color: PALETTE.gold, marginBottom: 10 }}>
        PLAYING (in-game speed)
      </div>
      <div
        style={{
          border: `1px solid ${PALETTE.wall}`,
          background: PALETTE.dark,
          padding: 16,
          width: "fit-content",
        }}
      >
        {viewUrls.length > 0 && <Sprite poseIndex={loop[tick]} scale={5} />}
      </div>
    </div>
  );
}
