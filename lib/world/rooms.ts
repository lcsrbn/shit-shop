import type { SpriteName } from "@/lib/world/sprites";

// Rooms are hand-drawn text grids, one char per cell:
//   (space)  void — the abyss around the land, not walkable
//   .  floor       #  wall        P  player start
//   D  door (exit) other letters = objects/NPCs, mapped per room below.
// Rows may have ragged right edges; they are padded with void when parsed.
// Rooms can be larger than the viewport — the camera follows the player.

export type ObjectKind =
  | "product"
  | "song"
  | "terminal"
  | "locked"
  | "scenery"
  | "npc";

export type DialogStage = {
  text: string;
  choices: Array<{ label: string; next?: number }>; // no `next` = close panel
};

export type WorldObjectDef = {
  id: string;
  name: string;
  sprite: SpriteName;
  kind: ObjectKind;
  takeable?: boolean;
  lines?: string[];
  dialog?: DialogStage[];
};

export const OBJECTS: Record<string, WorldObjectDef> = {
  hoodie: {
    id: "hoodie",
    name: "OLD HOODIE",
    sprite: "hoodie",
    kind: "product",
    takeable: true,
    lines: ["An old hoodie lies folded on the floor.", "It smells like rain and dust."],
  },
  radio: {
    id: "radio",
    name: "SMALL RADIO",
    sprite: "radio",
    kind: "song",
    lines: ["A small radio, older than you.", "Its antenna points at nothing."],
  },
  terminal: {
    id: "terminal",
    name: "COMPUTER",
    sprite: "terminal",
    kind: "terminal",
    lines: ["A computer hums in the corner.", "The screen is dark, but warm."],
  },
  gate: {
    id: "gate",
    name: "IRON GATE",
    sprite: "gate",
    kind: "locked",
    lines: ["A gate of thin iron, at the end of the land.", "It waits for a word you don't have yet."],
  },
  plant: {
    id: "plant",
    name: "WEED",
    sprite: "plant",
    kind: "scenery",
    lines: ["It grows without permission."],
  },
  monolith: {
    id: "monolith",
    name: "MONOLITH",
    sprite: "monolith",
    kind: "scenery",
    lines: [
      "A stone taller than your idea of stones.",
      "Someone sanded it smooth, or it was born tired.",
      "It hums at a frequency reserved for teeth.",
    ],
  },
  heap: {
    id: "heap",
    name: "THE HEAP",
    sprite: "heap",
    kind: "npc",
    dialog: [
      {
        text:
          "A mound of something patient.\n" +
          "An eye, gold and unhurried, finds you.\n" +
          "It was a person once. Or a shop. Or both.",
        choices: [
          { label: "Ask what it is", next: 1 },
          { label: "Ask about the gate", next: 2 },
          { label: "Leave it" },
        ],
      },
      {
        text:
          "«I kept a store. Then the store kept me.\n" +
          "Now I grow. Business is slow.\n" +
          "Growth is steady.»",
        choices: [
          { label: "Ask about the gate", next: 2 },
          { label: "Leave it" },
        ],
      },
      {
        text:
          "«The gate eats words. I fed it mine\n" +
          "long ago — that is why I have so few left.\n" +
          "Find one that tastes of rust.»",
        choices: [{ label: "Leave it" }],
      },
    ],
  },
  spores: {
    id: "spores",
    name: "THE TENANTS",
    sprite: "spores",
    kind: "npc",
    dialog: [
      {
        text:
          "A colony of small wet things,\n" +
          "huddled like a crowd at an accident.\n" +
          "They notice you all at once.",
        choices: [
          { label: "Say hello", next: 1 },
          { label: "Count them", next: 2 },
          { label: "Leave them" },
        ],
      },
      {
        text:
          "«HELLO,» they say, in one voice.\n" +
          "Then, quieter: «hello. hello. hello.»\n" +
          "as each remembers it is alone.",
        choices: [
          { label: "Count them", next: 2 },
          { label: "Leave them" },
        ],
      },
      {
        text:
          "You count eleven. Maybe twelve.\n" +
          "They count you back: «ONE.»\n" +
          "The difference delights them.",
        choices: [{ label: "Leave them" }],
      },
    ],
  },
};

export type DoorDef = {
  to: string;
  entry: { x: number; y: number };
};

export type RoomDef = {
  id: string;
  name: string;
  grid: string[];
  objectChars: Record<string, string>; // grid char -> object id
  doors: DoorDef[]; // in reading order of D chars in the grid
};

export const ROOMS: Record<string, RoomDef> = {
  backroom: {
    id: "backroom",
    name: "THE BACK ROOM",
    grid: [
      "     ###########",
      "   ###.........###",
      "  ##..R..........###",
      "  #...............###",
      " ##...........C......#",
      " #...................#",
      " #..P................#",
      " #...................##",
      " ##...................#",
      "  #...........H.......#",
      "  #...................##",
      " ##...................D",
      " #............T.......##",
      " #...................##",
      " ###...............###",
      "   #################",
    ],
    objectChars: { R: "radio", C: "terminal", H: "hoodie", T: "plant" },
    doors: [{ to: "courtyard", entry: { x: 7, y: 13 } }],
  },
  courtyard: {
    id: "courtyard",
    name: "THE OUTSKIRTS",
    grid: [
      "",
      "                 .....",
      "                 ..G..",
      "                 .....",
      "                  ...          ..",
      "                   .          ....",
      "                   .           ..",
      "              ......",
      "    ..     ...........",
      "   ....  .....T..........",
      "    .. ....................T...",
      "      ......    ....M...........",
      "     ....         .............H..",
      "    ..D.P          .............",
      "    ......         ...........",
      "     ..........................",
      "      .....T....................T.",
      "       .......................",
      "        ...        ..........",
      "                    .........",
      "         ..          .......",
      "        .T..          .S..",
      "         ..           ....",
      "                       ..",
      "",
      "",
    ],
    objectChars: { G: "gate", T: "plant", M: "monolith", H: "heap", S: "spores" },
    doors: [{ to: "backroom", entry: { x: 21, y: 11 } }],
  },
};

export const START_ROOM = "backroom";

// ---- Parsing ----

export type TileKind = "floor" | "wall" | "door" | "void";

export type Pt = { x: number; y: number };

export type ParsedRoom = {
  w: number;
  h: number;
  tiles: TileKind[][];
  objects: Array<{ id: string; x: number; y: number }>;
  doors: Map<string, DoorDef>;
  start: Pt | null;
};

export function tileKey(x: number, y: number) {
  return `${x},${y}`;
}

function parseRoom(room: RoomDef): ParsedRoom {
  const h = room.grid.length;
  const w = Math.max(...room.grid.map((row) => row.length));
  const tiles: TileKind[][] = [];
  const objects: ParsedRoom["objects"] = [];
  const doors = new Map<string, DoorDef>();
  let start: Pt | null = null;
  let doorIndex = 0;

  for (let y = 0; y < h; y++) {
    const row: TileKind[] = [];

    for (let x = 0; x < w; x++) {
      const ch = room.grid[y][x] ?? " ";

      if (ch === " ") {
        row.push("void");
      } else if (ch === "#") {
        row.push("wall");
      } else if (ch === "D") {
        row.push("door");
        doors.set(tileKey(x, y), room.doors[doorIndex]);
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

  return { w, h, tiles, objects, doors, start };
}

export const PARSED: Record<string, ParsedRoom> = Object.fromEntries(
  Object.values(ROOMS).map((room) => [room.id, parseRoom(room)])
);

// Where to place the player when a saved position is no longer valid.
export function roomFallback(parsed: ParsedRoom): Pt {
  if (parsed.start) return parsed.start;

  for (let y = 0; y < parsed.h; y++) {
    for (let x = 0; x < parsed.w; x++) {
      if (parsed.tiles[y][x] === "floor") return { x, y };
    }
  }

  return { x: 0, y: 0 };
}
