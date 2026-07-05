import type { SpriteName } from "@/lib/world/sprites";

// Rooms are 15x10 text grids, one char per cell:
//   #  wall          .  floor          P  player start
//   D  door (exit)   other letters = objects, mapped per room below.
// Draw new rooms by hand in any editor; keep every row exactly 15 chars.

export const GRID_W = 24;
export const GRID_H = 14;

export type ObjectKind = "product" | "song" | "terminal" | "locked" | "scenery";

export type WorldObjectDef = {
  id: string;
  name: string;
  sprite: SpriteName;
  kind: ObjectKind;
  takeable?: boolean;
  lines: string[];
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
    lines: ["A gate of thin iron.", "It waits for a word you don't have yet."],
  },
  plant: {
    id: "plant",
    name: "WEED",
    sprite: "plant",
    kind: "scenery",
    lines: ["It grows without permission."],
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
      "########################",
      "#..........#...........#",
      "#..R.......#....C......#",
      "#..........#...........#",
      "#...P......#####.#######",
      "#......................#",
      "#......................#",
      "#..H...................D",
      "#......................#",
      "#......................#",
      "#..........T...........#",
      "#......................#",
      "#......................#",
      "########################",
    ],
    objectChars: { R: "radio", C: "terminal", H: "hoodie", T: "plant" },
    doors: [{ to: "courtyard", entry: { x: 1, y: 6 } }],
  },
  courtyard: {
    id: "courtyard",
    name: "THE COURTYARD",
    grid: [
      "###########G############",
      "#.....T........T.......#",
      "#......................#",
      "#...T..........T.......#",
      "#......................#",
      "#......................#",
      "D......................#",
      "#.........T............#",
      "#......................#",
      "#..T...............T...#",
      "#......................#",
      "#..........T...........#",
      "#......................#",
      "########################",
    ],
    objectChars: { T: "plant", G: "gate" },
    doors: [{ to: "backroom", entry: { x: 22, y: 7 } }],
  },
};

export const START_ROOM = "backroom";
