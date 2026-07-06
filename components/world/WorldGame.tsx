"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import {
  PALETTE,
  PLAYER_FRAMES,
  SPRITES,
  roomToDataUrl,
  spriteToDataUrl,
  starfieldToDataUrl,
  type SpriteName,
} from "@/lib/world/sprites";
import {
  OBJECTS,
  PARSED,
  ROOMS,
  START_ROOM,
  roomFallback,
  tileKey,
  type DoorDef,
  type ParsedRoom,
  type Pt,
} from "@/lib/world/rooms";
import {
  isRadioOn,
  playFootstep,
  startRadio,
  stopRadio,
} from "@/lib/world/audio";
import TerminalShop, {
  type TerminalProduct,
} from "@/components/world/TerminalShop";

const STORAGE_KEY = "shit_shop_world_v1";
const STEP_MS = 150;

// The camera window, in tiles. Rooms can be much larger; the view scrolls.
const VIEW_W = 18;
const VIEW_H = 11;

// Fill the viewport while keeping the camera's aspect ratio.
const FRAME_WIDTH = `min(1500px, 100%, calc((100vh - 170px) * ${VIEW_W / VIEW_H}))`;

type WorldProduct = {
  id: string;
  variantId: string;
  name: string;
  priceEUR: number;
} | null;

type PanelState =
  | { type: "object"; objectId: string; stage: number }
  | { type: "inventory" }
  | { type: "message"; title: string; text: string }
  | null;

function bfsPath(
  fromPt: Pt,
  targets: Pt[],
  room: ParsedRoom,
  walkable: (x: number, y: number) => boolean
): Pt[] | null {
  const targetKeys = new Set(targets.map((t) => tileKey(t.x, t.y)));
  const parent = new Map<string, string | null>();
  const queue: Pt[] = [fromPt];
  parent.set(tileKey(fromPt.x, fromPt.y), null);

  while (queue.length > 0) {
    const cur = queue.shift() as Pt;
    const curKey = tileKey(cur.x, cur.y);

    if (targetKeys.has(curKey)) {
      const path: Pt[] = [];
      let k: string | null = curKey;

      while (k && k !== tileKey(fromPt.x, fromPt.y)) {
        const [px, py] = k.split(",").map(Number);
        path.unshift({ x: px, y: py });
        k = parent.get(k) ?? null;
      }

      return path;
    }

    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ] as const) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nk = tileKey(nx, ny);

      if (parent.has(nk)) continue;
      if (nx < 0 || ny < 0 || nx >= room.w || ny >= room.h) continue;
      if (!walkable(nx, ny) && !targetKeys.has(nk)) continue;

      parent.set(nk, curKey);
      queue.push({ x: nx, y: ny });
    }
  }

  return null;
}

// Center the camera on the player, clamped to the land; center small rooms.
function cameraAxis(p: number, view: number, size: number): number {
  if (size <= view) return (size - view) / 2;
  return Math.min(Math.max(p + 0.5 - view / 2, 0), size - view);
}

function TypeText({ text }: { text: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);

    const t = window.setInterval(() => {
      setShown((prev) => {
        if (prev >= text.length) {
          window.clearInterval(t);
          return prev;
        }
        return prev + 1;
      });
    }, 14);

    return () => window.clearInterval(t);
  }, [text]);

  return (
    <span style={{ whiteSpace: "pre-line" }}>{text.slice(0, shown)}</span>
  );
}

const choiceStyle: React.CSSProperties = {
  background: PALETTE.dark,
  border: `3px solid ${PALETTE.mauve}`,
  color: PALETTE.pale,
  padding: "10px 14px",
  fontFamily: "inherit",
  fontSize: 10,
  cursor: "pointer",
  textTransform: "uppercase",
};

const hudButtonStyle: React.CSSProperties = {
  ...choiceStyle,
  textDecoration: "none",
  display: "inline-block",
};

export default function WorldGame({
  product,
  catalog,
}: {
  product: WorldProduct;
  catalog: TerminalProduct[];
}) {
  const cart = useCart();

  const [roomId, setRoomId] = useState(START_ROOM);
  const [pos, setPos] = useState<Pt>(() => roomFallback(PARSED[START_ROOM]));
  const [path, setPath] = useState<Pt[]>([]);
  const [taken, setTaken] = useState<string[]>([]);
  const [inv, setInv] = useState<string[]>([]);
  const [moved, setMoved] = useState<string[]>([]);
  const [panel, setPanel] = useState<PanelState>(null);
  const [radioOn, setRadioOn] = useState(false);
  const [fading, setFading] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [urls, setUrls] = useState<Record<SpriteName, string> | null>(null);
  const [playerUrls, setPlayerUrls] = useState<string[] | null>(null);
  const [roomUrls, setRoomUrls] = useState<Record<string, string> | null>(null);
  const [starUrl, setStarUrl] = useState<string | null>(null);
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [walkFrame, setWalkFrame] = useState(0); // 0 idle · 1 contact L · 2 passing · 3 contact R
  const [footWord, setFootWord] = useState<"TIP" | "TAP" | null>(null);

  const strideRef = useRef(0);
  const midTimerRef = useRef<number | null>(null);
  const stepTimerRef = useRef<number | null>(null);

  const pendingRef = useRef<
    | { type: "object"; objectId: string }
    | { type: "door"; door: DoorDef }
    | null
  >(null);

  const room = PARSED[roomId];

  const visibleObjects = useMemo(
    () => room.objects.filter((o) => !taken.includes(o.id)),
    [room, taken]
  );

  const objectAt = (x: number, y: number) =>
    visibleObjects.find((o) => o.x === x && o.y === y) ?? null;

  const walkable = (x: number, y: number) =>
    room.tiles[y]?.[x] === "floor" && !objectAt(x, y);

  // Render sprites and room composites to data URLs once, on the client.
  useEffect(() => {
    const entries = Object.entries(SPRITES).map(([name, rows]) => [
      name,
      spriteToDataUrl(rows),
    ]);
    setUrls(Object.fromEntries(entries));
    setPlayerUrls(PLAYER_FRAMES.map(spriteToDataUrl));

    setRoomUrls(
      Object.fromEntries(
        Object.entries(PARSED).map(([id, parsed]) => [
          id,
          roomToDataUrl(parsed.tiles),
        ])
      )
    );

    setStarUrl(starfieldToDataUrl());
  }, []);

  // Load saved state.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);

        if (typeof saved.roomId === "string" && PARSED[saved.roomId]) {
          setRoomId(saved.roomId);

          if (
            saved.pos &&
            PARSED[saved.roomId].tiles[saved.pos.y]?.[saved.pos.x] === "floor"
          ) {
            setPos(saved.pos);
          } else {
            setPos(roomFallback(PARSED[saved.roomId]));
          }
        }

        if (Array.isArray(saved.taken)) setTaken(saved.taken);
        if (Array.isArray(saved.inv)) setInv(saved.inv);
        if (Array.isArray(saved.moved)) setMoved(saved.moved);
      }
    } catch {}

    setLoaded(true);
  }, []);

  // Save state.
  useEffect(() => {
    if (!loaded) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ roomId, pos, taken, inv, moved })
      );
    } catch {}
  }, [roomId, pos, taken, inv, moved, loaded]);

  // One step: move, face the direction walked, and play the gait —
  // contact pose on the step, passing pose halfway through, idle when
  // the walking stops. Each footfall says its name: TIP, TAP.
  function stepTo(next: Pt) {
    if (next.x < pos.x) setFacing("left");
    else if (next.x > pos.x) setFacing("right");

    setPos(next);

    strideRef.current = strideRef.current === 0 ? 1 : 0;
    const left = strideRef.current === 0;

    setWalkFrame(left ? 1 : 3);
    setFootWord(left ? "TIP" : "TAP");
    playFootstep(left);

    if (midTimerRef.current) window.clearTimeout(midTimerRef.current);
    midTimerRef.current = window.setTimeout(
      () => setWalkFrame(2),
      STEP_MS / 2
    );

    if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    stepTimerRef.current = window.setTimeout(() => {
      setWalkFrame(0);
      setFootWord(null);
    }, STEP_MS + 110);
  }

  useEffect(() => {
    return () => {
      if (midTimerRef.current) window.clearTimeout(midTimerRef.current);
      if (stepTimerRef.current) window.clearTimeout(stepTimerRef.current);
    };
  }, []);

  // Walk along the current path, one step at a time.
  useEffect(() => {
    if (path.length === 0) return;

    const t = window.setTimeout(() => {
      const [next, ...rest] = path;
      stepTo(next);
      setPath(rest);

      if (rest.length === 0 && pendingRef.current) {
        const pending = pendingRef.current;
        pendingRef.current = null;

        if (pending.type === "object") {
          setPanel({ type: "object", objectId: pending.objectId, stage: 0 });
        } else {
          goThroughDoor(pending.door);
        }
      }
    }, STEP_MS);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  function goThroughDoor(door: DoorDef) {
    setFading(true);
    setPath([]);
    pendingRef.current = null;

    window.setTimeout(() => {
      setRoomId(door.to);
      setPos(door.entry);
      setFading(false);
    }, 260);
  }

  function adjacent(a: Pt, b: Pt) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
  }

  function handleCellClick(x: number, y: number) {
    if (panel || fading || terminalOpen) return;

    const obj = objectAt(x, y);
    const door = room.doors.get(tileKey(x, y));
    const target: Pt = { x, y };

    if (obj || door) {
      if (adjacent(pos, target)) {
        if (obj) setPanel({ type: "object", objectId: obj.id, stage: 0 });
        else if (door) goThroughDoor(door);
        return;
      }

      const found = bfsPath(pos, [target], room, walkable);
      if (!found || found.length === 0) return;

      // Stop on the cell before the target, then act.
      pendingRef.current = obj
        ? { type: "object", objectId: obj.id }
        : { type: "door", door: door as DoorDef };
      setPath(found.slice(0, -1));

      if (found.length === 1) {
        // Already adjacent through BFS; trigger immediately.
        const pending = pendingRef.current;
        pendingRef.current = null;

        if (pending?.type === "object") {
          setPanel({ type: "object", objectId: pending.objectId, stage: 0 });
        } else if (pending?.type === "door") {
          goThroughDoor(pending.door);
        }
      }

      return;
    }

    if (!walkable(x, y)) return;

    pendingRef.current = null;
    const found = bfsPath(pos, [target], room, walkable);
    if (found) setPath(found);
  }

  function handleWorldClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * room.w);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * room.h);
    handleCellClick(x, y);
  }

  // Keyboard controls.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (terminalOpen) return;

      if (e.key === "Escape") {
        setPanel(null);
        return;
      }

      if (panel || fading) return;

      if (e.key === "i" || e.key === "I") {
        setPanel({ type: "inventory" });
        return;
      }

      const dir: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        s: [0, 1],
        a: [-1, 0],
        d: [1, 0],
      };

      const delta = dir[e.key];
      if (!delta) return;

      e.preventDefault();
      setPath([]);
      pendingRef.current = null;

      // Turn in place even when the way is blocked.
      if (delta[0] < 0) setFacing("left");
      else if (delta[0] > 0) setFacing("right");

      const nx = pos.x + delta[0];
      const ny = pos.y + delta[1];

      const obj = objectAt(nx, ny);
      if (obj) {
        setPanel({ type: "object", objectId: obj.id, stage: 0 });
        return;
      }

      const door = room.doors.get(tileKey(nx, ny));
      if (door) {
        goThroughDoor(door);
        return;
      }

      if (walkable(nx, ny)) stepTo({ x: nx, y: ny });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function takeObject(objectId: string) {
    setTaken((prev) => [...prev, objectId]);
    setInv((prev) => [...prev, objectId]);
    setPanel({
      type: "message",
      title: OBJECTS[objectId].name,
      text: "It is yours now.\nIt weighs nothing.",
    });
  }

  function toggleRadio() {
    if (isRadioOn()) {
      stopRadio();
      setRadioOn(false);
      setPanel({
        type: "message",
        title: "SMALL RADIO",
        text: "The song folds itself away.\nThe room remembers it anyway.",
      });
    } else {
      startRadio();
      setRadioOn(true);
      setPanel({
        type: "message",
        title: "SMALL RADIO",
        text: "The room fills with something\nlike memory.",
      });
    }
  }

  function moveHoodieToCart() {
    if (!product) {
      setPanel({
        type: "message",
        title: "OLD HOODIE",
        text: "It belongs to no plane yet.\nCome back another dusk.",
      });
      return;
    }

    cart.add(product.id, product.variantId);
    setMoved((prev) => [...prev, "hoodie"]);
    setPanel({
      type: "message",
      title: "OLD HOODIE",
      text: "It slips out of this plane.\nCheck your cart — the real one.",
    });
  }

  function objectPanelContent(objectId: string, stage: number) {
    const def = OBJECTS[objectId];
    const base = (def.lines ?? []).join("\n");

    switch (def.kind) {
      case "product":
        return {
          title: def.name,
          text: base,
          choices: [
            { label: "Take it", act: () => takeObject(objectId) },
            { label: "Leave it", act: () => setPanel(null) },
          ],
        };

      case "song":
        return {
          title: def.name,
          text: radioOn ? `${base}\nIt is playing, quietly.` : base,
          choices: [
            { label: radioOn ? "Turn it off" : "Turn it on", act: toggleRadio },
            { label: "Leave it", act: () => setPanel(null) },
          ],
        };

      case "terminal":
        return {
          title: def.name,
          text: `${base}\nSomewhere inside, a fan spins up.`,
          choices: [
            {
              label: "Use the terminal",
              act: () => {
                setPanel(null);
                setTerminalOpen(true);
              },
            },
            { label: "Step back", act: () => setPanel(null) },
          ],
        };

      case "locked":
        if (stage === 1) {
          return {
            title: def.name,
            text: "You open your mouth.\nNothing you know fits.",
            choices: [{ label: "Leave it", act: () => setPanel(null) }],
          };
        }
        return {
          title: def.name,
          text: base,
          choices: [
            {
              label: "Speak a word",
              act: () => setPanel({ type: "object", objectId, stage: 1 }),
            },
            { label: "Leave it", act: () => setPanel(null) },
          ],
        };

      case "npc": {
        const stageDef = def.dialog?.[stage] ?? {
          text: base,
          choices: [{ label: "Leave it" }],
        };

        return {
          title: def.name,
          text: stageDef.text,
          choices: stageDef.choices.map((choice) => ({
            label: choice.label,
            act: () =>
              choice.next === undefined
                ? setPanel(null)
                : setPanel({ type: "object", objectId, stage: choice.next }),
          })),
        };
      }

      default:
        return {
          title: def.name,
          text: base,
          choices: [{ label: "Leave it", act: () => setPanel(null) }],
        };
    }
  }

  const camX = cameraAxis(pos.x, VIEW_W, room.w);
  const camY = cameraAxis(pos.y, VIEW_H, room.h);

  const cellW = 100 / room.w;
  const cellH = 100 / room.h;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PALETTE.void,
        color: PALETTE.pale,
        padding: "18px 12px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <style>{`
        @keyframes radio-glow {
          0%, 100% { opacity: .25; }
          50% { opacity: .6; }
        }
        @keyframes npc-breathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(.95) scaleX(1.03); }
        }
        @keyframes room-caption {
          0% { opacity: 0; }
          18% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <div
        style={{
          width: FRAME_WIDTH,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 11, color: PALETTE.gold, letterSpacing: 1 }}>
          {ROOMS[roomId].name}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() =>
              setPanel(panel?.type === "inventory" ? null : { type: "inventory" })
            }
            style={choiceStyle}
          >
            Inventory{inv.length > 0 ? ` (${inv.length})` : ""}
          </button>

          <Link href="/checkout" style={hudButtonStyle}>
            Shop{cart.ready && cart.count > 0 ? ` (${cart.count})` : ""}
          </Link>

          <Link href="/login" style={hudButtonStyle}>
            Login
          </Link>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: FRAME_WIDTH,
          aspectRatio: `${VIEW_W} / ${VIEW_H}`,
          border: `4px solid ${PALETTE.dark}`,
          backgroundColor: PALETTE.void,
          backgroundImage: starUrl ? `url(${starUrl})` : undefined,
          imageRendering: "pixelated",
          overflow: "hidden",
          opacity: fading ? 0 : 1,
          transition: "opacity .25s ease",
          userSelect: "none",
        }}
      >
        {/* The land: one composite image per room, scrolled by the camera. */}
        <div
          key={roomId}
          onClick={handleWorldClick}
          style={{
            position: "absolute",
            width: `${(room.w / VIEW_W) * 100}%`,
            height: `${(room.h / VIEW_H) * 100}%`,
            transform: `translate(${(-camX / room.w) * 100}%, ${
              (-camY / room.h) * 100
            }%)`,
            transition: `transform ${STEP_MS}ms linear`,
            backgroundImage: roomUrls?.[roomId]
              ? `url(${roomUrls[roomId]})`
              : undefined,
            backgroundSize: "100% 100%",
            imageRendering: "pixelated",
            cursor: "pointer",
          }}
        >
          {visibleObjects.map((o) => (
            <div
              key={`${o.id}-${tileKey(o.x, o.y)}`}
              style={{
                position: "absolute",
                left: `${o.x * cellW}%`,
                top: `${o.y * cellH}%`,
                width: `${cellW}%`,
                height: `${cellH}%`,
                pointerEvents: "none",
              }}
            >
              {o.id === "radio" && radioOn && (
                <div
                  style={{
                    position: "absolute",
                    inset: "-40%",
                    background: `radial-gradient(circle, ${PALETTE.gold}55, transparent 70%)`,
                    animation: "radio-glow 2.4s ease-in-out infinite",
                  }}
                />
              )}
              {urls && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[OBJECTS[o.id].sprite]}
                  alt={OBJECTS[o.id].name}
                  draggable={false}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    imageRendering: "pixelated",
                    ...(OBJECTS[o.id].kind === "npc"
                      ? {
                          animation: "npc-breathe 2.8s ease-in-out infinite",
                          transformOrigin: "50% 100%",
                        }
                      : null),
                  }}
                />
              )}
            </div>
          ))}

          <div
            style={{
              position: "absolute",
              left: `${pos.x * cellW}%`,
              top: `${pos.y * cellH}%`,
              width: `${cellW}%`,
              height: `${cellH}%`,
              transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms linear`,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {playerUrls && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={playerUrls[walkFrame]}
                alt="you"
                draggable={false}
                style={{
                  position: "absolute",
                  left: "-25%",
                  bottom: 0,
                  width: "150%",
                  height: "250%",
                  imageRendering: "pixelated",
                  transform: facing === "left" ? "scaleX(-1)" : undefined,
                }}
              />
            )}

            {footWord && (
              <div
                style={{
                  position: "absolute",
                  left: "-150%",
                  right: "-150%",
                  bottom: "265%",
                  textAlign: "center",
                  fontSize: 9,
                  letterSpacing: 2,
                  color: PALETTE.pale,
                  opacity: 0.85,
                  pointerEvents: "none",
                }}
              >
                {footWord}
              </div>
            )}
          </div>
        </div>

        {/* Crepuscular vignette over the whole view. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(120% 120% at 50% 45%, transparent 55%, rgba(12,10,20,.6) 100%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* Room title, fading in and out on entry. */}
        <div
          key={`caption-${roomId}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "36%",
            textAlign: "center",
            fontSize: 15,
            letterSpacing: 4,
            color: PALETTE.ghost,
            textShadow: `0 0 12px ${PALETTE.void}`,
            opacity: 0,
            animation: "room-caption 2.8s ease forwards",
            pointerEvents: "none",
            zIndex: 3,
          }}
        >
          {ROOMS[roomId].name}
        </div>

        {terminalOpen && (
          <TerminalShop
            catalog={catalog}
            onClose={() => setTerminalOpen(false)}
          />
        )}

        {panel && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(18,16,29,.95)",
              borderTop: `3px solid ${PALETTE.mauve}`,
              padding: "14px 16px 16px",
              zIndex: 4,
              fontSize: 11,
              lineHeight: 1.9,
            }}
          >
            {panel.type === "inventory" ? (
              <>
                <div style={{ color: PALETTE.gold, marginBottom: 8 }}>
                  INVENTORY
                </div>

                {inv.length === 0 ? (
                  <div>
                    <TypeText text={"Nothing yet.\nThe world is patient."} />
                  </div>
                ) : (
                  inv.map((id) => (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ color: PALETTE.ghost }}>
                        {OBJECTS[id].name}
                      </span>

                      {OBJECTS[id].kind === "product" &&
                        (moved.includes(id) ? (
                          <span style={{ color: PALETTE.mauve }}>
                            (in the other world)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={moveHoodieToCart}
                            style={{ ...choiceStyle, borderColor: PALETTE.gold }}
                          >
                            Move to cart
                          </button>
                        ))}
                    </div>
                  ))
                )}

                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPanel(null)}
                    style={choiceStyle}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : panel.type === "message" ? (
              <>
                <div style={{ color: PALETTE.gold, marginBottom: 8 }}>
                  {panel.title}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <TypeText text={panel.text} />
                </div>
                <button
                  type="button"
                  onClick={() => setPanel(null)}
                  style={choiceStyle}
                >
                  Close
                </button>
              </>
            ) : (
              (() => {
                const content = objectPanelContent(panel.objectId, panel.stage);

                return (
                  <>
                    <div style={{ color: PALETTE.gold, marginBottom: 8 }}>
                      {content.title}
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <TypeText text={content.text} />
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {content.choices.map((choice) => (
                        <button
                          key={choice.label}
                          type="button"
                          onClick={choice.act}
                          style={choiceStyle}
                        >
                          [{choice.label}]
                        </button>
                      ))}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: 9, color: PALETTE.mauve, letterSpacing: 1 }}>
        TAP TO MOVE · TAP THINGS TO LOOK CLOSER · WASD / ARROWS · I = INVENTORY
      </div>
    </div>
  );
}
