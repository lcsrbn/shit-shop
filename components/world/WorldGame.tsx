"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { PALETTE, SPRITES, spriteToDataUrl, type SpriteName } from "@/lib/world/sprites";
import {
  GRID_H,
  GRID_W,
  OBJECTS,
  ROOMS,
  START_ROOM,
  type DoorDef,
} from "@/lib/world/rooms";
import { isRadioOn, startRadio, stopRadio } from "@/lib/world/audio";

const STORAGE_KEY = "shit_shop_world_v1";
const STEP_MS = 140;

type Pt = { x: number; y: number };

type WorldProduct = {
  id: string;
  variantId: string;
  name: string;
  priceEUR: number;
} | null;

type TileKind = "floor" | "wall" | "door";

type ParsedRoom = {
  tiles: TileKind[][];
  objects: Array<{ id: string; x: number; y: number }>;
  doors: Map<string, DoorDef>;
  start: Pt | null;
};

type PanelState =
  | { type: "object"; objectId: string; stage: number }
  | { type: "inventory" }
  | { type: "message"; title: string; text: string }
  | null;

function key(x: number, y: number) {
  return `${x},${y}`;
}

function parseRoom(roomId: string): ParsedRoom {
  const room = ROOMS[roomId];
  const tiles: TileKind[][] = [];
  const objects: ParsedRoom["objects"] = [];
  const doors = new Map<string, DoorDef>();
  let start: Pt | null = null;
  let doorIndex = 0;

  for (let y = 0; y < GRID_H; y++) {
    const row: TileKind[] = [];

    for (let x = 0; x < GRID_W; x++) {
      const ch = room.grid[y][x];

      if (ch === "#") {
        row.push("wall");
      } else if (ch === "D") {
        row.push("door");
        doors.set(key(x, y), room.doors[doorIndex]);
        doorIndex += 1;
      } else {
        row.push("floor");

        if (ch === "P") {
          start = { x, y };
        } else if (ch !== ".") {
          const objectId = room.objectChars[ch];
          if (objectId) objects.push({ id: objectId, x, y });
        }
      }
    }

    tiles.push(row);
  }

  return { tiles, objects, doors, start };
}

const PARSED: Record<string, ParsedRoom> = Object.fromEntries(
  Object.keys(ROOMS).map((id) => [id, parseRoom(id)])
);

function bfsPath(
  fromPt: Pt,
  targets: Pt[],
  walkable: (x: number, y: number) => boolean
): Pt[] | null {
  const targetKeys = new Set(targets.map((t) => key(t.x, t.y)));
  const parent = new Map<string, string | null>();
  const queue: Pt[] = [fromPt];
  parent.set(key(fromPt.x, fromPt.y), null);

  while (queue.length > 0) {
    const cur = queue.shift() as Pt;
    const curKey = key(cur.x, cur.y);

    if (targetKeys.has(curKey)) {
      const path: Pt[] = [];
      let k: string | null = curKey;

      while (k && k !== key(fromPt.x, fromPt.y)) {
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
      const nk = key(nx, ny);

      if (parent.has(nk)) continue;
      if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
      if (!walkable(nx, ny) && !targetKeys.has(nk)) continue;

      parent.set(nk, curKey);
      queue.push({ x: nx, y: ny });
    }
  }

  return null;
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

export default function WorldGame({ product }: { product: WorldProduct }) {
  const cart = useCart();

  const [roomId, setRoomId] = useState(START_ROOM);
  const [pos, setPos] = useState<Pt>(
    () => PARSED[START_ROOM].start ?? { x: 1, y: 1 }
  );
  const [path, setPath] = useState<Pt[]>([]);
  const [taken, setTaken] = useState<string[]>([]);
  const [inv, setInv] = useState<string[]>([]);
  const [moved, setMoved] = useState<string[]>([]);
  const [panel, setPanel] = useState<PanelState>(null);
  const [radioOn, setRadioOn] = useState(false);
  const [fading, setFading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [urls, setUrls] = useState<Record<SpriteName, string> | null>(null);

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

  // Render sprites to data URLs once, on the client.
  useEffect(() => {
    const entries = Object.entries(SPRITES).map(([name, rows]) => [
      name,
      spriteToDataUrl(rows),
    ]);
    setUrls(Object.fromEntries(entries));
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

  // Walk along the current path, one step at a time.
  useEffect(() => {
    if (path.length === 0) return;

    const t = window.setTimeout(() => {
      const [next, ...rest] = path;
      setPos(next);
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
    if (panel || fading) return;

    const obj = objectAt(x, y);
    const door = room.doors.get(key(x, y));
    const target: Pt = { x, y };

    if (obj || door) {
      if (adjacent(pos, target)) {
        if (obj) setPanel({ type: "object", objectId: obj.id, stage: 0 });
        else if (door) goThroughDoor(door);
        return;
      }

      const found = bfsPath(pos, [target], walkable);
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
    const found = bfsPath(pos, [target], walkable);
    if (found) setPath(found);
  }

  // Keyboard controls.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

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

      const nx = pos.x + delta[0];
      const ny = pos.y + delta[1];

      const obj = objectAt(nx, ny);
      if (obj) {
        setPanel({ type: "object", objectId: obj.id, stage: 0 });
        return;
      }

      const door = room.doors.get(key(nx, ny));
      if (door) {
        goThroughDoor(door);
        return;
      }

      if (walkable(nx, ny)) setPos({ x: nx, y: ny });
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
    const base = def.lines.join("\n");

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
        if (stage === 1) {
          return {
            title: def.name,
            text: "Somewhere inside, a fan spins up.\nNot today.",
            choices: [{ label: "Step back", act: () => setPanel(null) }],
          };
        }
        return {
          title: def.name,
          text: base,
          choices: [
            {
              label: "Touch the screen",
              act: () => setPanel({ type: "object", objectId, stage: 1 }),
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

      default:
        return {
          title: def.name,
          text: base,
          choices: [{ label: "Leave it", act: () => setPanel(null) }],
        };
    }
  }

  const tileSizeW = 100 / GRID_W;
  const tileSizeH = 100 / GRID_H;

  function tileStyle(x: number, y: number, kind: TileKind): React.CSSProperties {
    const fallback =
      kind === "wall" ? PALETTE.wall : kind === "door" ? PALETTE.void : PALETTE.floor;

    return {
      position: "absolute",
      left: `${x * tileSizeW}%`,
      top: `${y * tileSizeH}%`,
      width: `${tileSizeW}%`,
      height: `${tileSizeH}%`,
      background: urls ? `url(${urls[kind]})` : fallback,
      backgroundSize: "100% 100%",
      imageRendering: "pixelated",
    };
  }

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
        @keyframes ghost-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9%); }
        }
        @keyframes radio-glow {
          0%, 100% { opacity: .25; }
          50% { opacity: .6; }
        }
      `}</style>

      <div
        style={{
          width: "min(920px, 100%)",
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

          <Link href="/" style={hudButtonStyle}>
            Shop{cart.ready && cart.count > 0 ? ` (${cart.count})` : ""}
          </Link>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: "min(920px, 100%)",
          aspectRatio: `${GRID_W} / ${GRID_H}`,
          border: `4px solid ${PALETTE.dark}`,
          background: PALETTE.void,
          overflow: "hidden",
          opacity: fading ? 0 : 1,
          transition: "opacity .25s ease",
          userSelect: "none",
        }}
      >
        {room.tiles.map((row, y) =>
          row.map((kind, x) => (
            <div
              key={key(x, y)}
              onClick={() => handleCellClick(x, y)}
              style={{ ...tileStyle(x, y, kind), cursor: "pointer" }}
            />
          ))
        )}

        {visibleObjects.map((o) => (
          <div
            key={`${o.id}-${key(o.x, o.y)}`}
            onClick={() => handleCellClick(o.x, o.y)}
            style={{
              position: "absolute",
              left: `${o.x * tileSizeW}%`,
              top: `${o.y * tileSizeH}%`,
              width: `${tileSizeW}%`,
              height: `${tileSizeH}%`,
              cursor: "pointer",
            }}
          >
            {o.id === "radio" && radioOn && (
              <div
                style={{
                  position: "absolute",
                  inset: "-40%",
                  background: `radial-gradient(circle, ${PALETTE.gold}55, transparent 70%)`,
                  animation: "radio-glow 2.4s ease-in-out infinite",
                  pointerEvents: "none",
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
                }}
              />
            )}
          </div>
        ))}

        <div
          style={{
            position: "absolute",
            left: `${pos.x * tileSizeW}%`,
            top: `${pos.y * tileSizeH}%`,
            width: `${tileSizeW}%`,
            height: `${tileSizeH}%`,
            transition: `left ${STEP_MS}ms linear, top ${STEP_MS}ms linear`,
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          {urls && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urls.ghost}
              alt="you"
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                imageRendering: "pixelated",
                opacity: 0.92,
                animation: "ghost-float 2.2s ease-in-out infinite",
              }}
            />
          )}
        </div>

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
              zIndex: 3,
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
