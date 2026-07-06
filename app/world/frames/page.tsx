"use client";

// Dev reference: shows each view's walk frames in the order they play
// (which is the order they appear in lib/world/sprites.ts), plus a live
// animation at in-game speed. Not linked from the game. /world/frames.

import { useEffect, useState } from "react";
import { PALETTE, PLAYER_FRAMES, spriteToDataUrl } from "@/lib/world/sprites";

const STEP_MS = 150; // one footfall in game = half the cycle

type View = "front" | "back" | "side";

export default function WalkFramesPage() {
  const [urls, setUrls] = useState<Record<
    View,
    { idle: string; walk: string[] }
  > | null>(null);
  const [view, setView] = useState<View>("side");
  const [mirror, setMirror] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const make = (v: View) => ({
      idle: spriteToDataUrl(PLAYER_FRAMES[v].idle),
      walk: PLAYER_FRAMES[v].walk.map(spriteToDataUrl),
    });
    setUrls({ front: make("front"), back: make("back"), side: make("side") });
  }, []);

  const cycleLen = PLAYER_FRAMES.front.walk.length;
  const frameMs = STEP_MS / (cycleLen / 2);

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(
      () => setTick((n) => (n + 1) % cycleLen),
      frameMs
    );
    return () => window.clearInterval(t);
  }, [playing, cycleLen, frameMs]);

  const v = urls?.[view];

  function Sprite({ src, scale }: { src: string; scale: number }) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="frame"
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
        Frames play left to right, looping — the same order they appear in{" "}
        <span style={{ color: PALETTE.pale }}>lib/world/sprites.ts</span>.
        One footfall = half the cycle. TIP on frame 1, TAP on frame{" "}
        {cycleLen / 2 + 1}.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {(["front", "back", "side"] as View[]).map((name) => (
          <button key={name} style={btn(view === name)} onClick={() => setView(name)}>
            {name}
          </button>
        ))}
        <button style={btn(mirror)} onClick={() => setMirror((m) => !m)}>
          Mirror
        </button>
        <button style={btn(playing)} onClick={() => setPlaying((p) => !p)}>
          {playing ? "Pause" : "Play"}
        </button>
      </div>

      <div style={{ fontSize: 11, color: PALETTE.gold, marginBottom: 10 }}>
        PLAYER_FRAMES.{view}.walk — temporal order
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          flexWrap: "wrap",
          marginBottom: 40,
        }}
      >
        {v && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                border: `2px solid ${PALETTE.wall}`,
                background: PALETTE.dark,
                padding: 6,
              }}
            >
              <Sprite src={v.idle} scale={3} />
            </div>
            <div style={{ fontSize: 10, marginTop: 6, color: PALETTE.mauve }}>
              idle
            </div>
          </div>
        )}

        {v?.walk.map((src, i) => {
          const isNow = i === tick;
          const word =
            i === 0 ? "TIP" : i === cycleLen / 2 ? "TAP" : "";
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: PALETTE.mauve, height: 12 }}>
                {word}
              </div>
              <div
                style={{
                  border: `2px solid ${isNow ? PALETTE.gold : PALETTE.wall}`,
                  background: PALETTE.dark,
                  padding: 6,
                }}
              >
                <Sprite src={src} scale={3} />
              </div>
              <div style={{ fontSize: 10, marginTop: 6, color: PALETTE.pale }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 8, color: PALETTE.mauve }}>
                {Math.round(i * frameMs)}ms
              </div>
            </div>
          );
        })}
      </div>

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
        {v && <Sprite src={v.walk[tick]} scale={5} />}
      </div>
    </div>
  );
}
