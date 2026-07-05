// Crepuscular palette — the only colors allowed in the world.
// Owner-made sprites will replace these; keep the palette stable.
export const PALETTE = {
  void: "#12101d",
  dark: "#1f1b2e",
  floor: "#2a2440",
  floorHi: "#332c4d",
  wall: "#4a3f63",
  wallHi: "#5d5178",
  mauve: "#8a7f9e",
  pale: "#b8afc7",
  ghost: "#e8e4f0",
  gold: "#c9974f",
  teal: "#4e6e6a",
  tealHi: "#7fa08f",
  ink: "#0c0a14",
} as const;

// One char per pixel. "_" = transparent.
const INK: Record<string, string> = {
  a: PALETTE.void,
  b: PALETTE.dark,
  c: PALETTE.floor,
  d: PALETTE.floorHi,
  e: PALETTE.wall,
  f: PALETTE.wallHi,
  m: PALETTE.mauve,
  p: PALETTE.pale,
  w: PALETTE.ghost,
  g: PALETTE.gold,
  t: PALETTE.teal,
  u: PALETTE.tealHi,
  k: PALETTE.ink,
};

export type SpriteName =
  | "floor"
  | "wall"
  | "door"
  | "gate"
  | "ghost"
  | "hoodie"
  | "radio"
  | "terminal"
  | "plant";

export const SPRITES: Record<SpriteName, string[]> = {
  floor: [
    "cccccccccccccccc",
    "cccccdcccccccccc",
    "ccccccccccccbccc",
    "cccccccccccccccc",
    "ccdccccccccccccc",
    "cccccccccdcccccc",
    "cccccccccccccccc",
    "cbcccccccccccdcc",
    "cccccccccccccccc",
    "ccccccdccccccccc",
    "cccccccccccccccc",
    "cccdcccccccbcccc",
    "cccccccccccccccc",
    "ccccccccccdccccc",
    "cbcccccccccccccc",
    "cccccccccccccccc",
  ],
  wall: [
    "ffffffffffffffff",
    "ffffffffffffffff",
    "ffffffffffffffff",
    "eeeeeeeeeeeeeeee",
    "eeeebeeeeeeeeeee",
    "eeeeeeeeeeebeeee",
    "eeeeeeeeeeeeeeee",
    "eebeeeeeeeeeeeee",
    "eeeeeeeebeeeeeee",
    "eeeeeeeeeeeeeeee",
    "eeeeeeeeeeeeeebe",
    "eeebeeeeeeeeeeee",
    "eeeeeeeeeeeeeeee",
    "eeeeeeebeeeeeeee",
    "eeeeeeeeeeeeeeee",
    "aaaaaaaaaaaaaaaa",
  ],
  door: [
    "eeeeeeeeeeeeeeee",
    "eaaaaaaaaaaaaaae",
    "eaaaaaaaaaaaaaae",
    "eaaaaaaaaaaaaaae",
    "eaaaaaaaaaaaaaae",
    "eaaaaaaggaaaaaae",
    "eaaaaaggggaaaaae",
    "eaaaaaaggaaaaaae",
    "eaaaaaaggaaaaaae",
    "eaaaaaaaaaaaaaae",
    "eaaaaaaaaaaaaaae",
    "eaaaaaaaaaaaaaae",
    "eaaaaaaaaaaaaaae",
    "eaaaaaaaaaaaaaae",
    "eaaaaaaaaaaaaaae",
    "eeeeeeeeeeeeeeee",
  ],
  gate: [
    "aaaaaaaaaaaaaaaa",
    "ammmmmmmmmmmmmma",
    "amaamaamaamaamaa",
    "amaamaamaamaamaa",
    "amaamaamaamaamaa",
    "amaamaamaamaamaa",
    "amaamaamaamaamaa",
    "amaamaagaamaamaa",
    "amaamaagaamaamaa",
    "amaamaamaamaamaa",
    "amaamaamaamaamaa",
    "amaamaamaamaamaa",
    "amaamaamaamaamaa",
    "ammmmmmmmmmmmmma",
    "aaaaaaaaaaaaaaaa",
    "aaaaaaaaaaaaaaaa",
  ],
  ghost: [
    "________________",
    "_____wwwwww_____",
    "____wwwwwwww____",
    "___wwwwwwwwww___",
    "___wwwwwwwwww___",
    "___wkkwwwwkkw___",
    "___wkkwwwwkkw___",
    "___wwwwwwwwww___",
    "___wwwwmmwwww___",
    "___wwwwwwwwww___",
    "___wwwwwwwwww___",
    "___wwwwwwwwww___",
    "___w_ww_ww_w____",
    "________________",
    "________________",
    "________________",
  ],
  hoodie: [
    "________________",
    "________________",
    "________________",
    "______mm________",
    "____mmmmmm______",
    "___mmmmmmmmm____",
    "__mmmpmmmmmmm___",
    "__mmppmmmmkmm___",
    "_mmmpmmmmmmkmm__",
    "_mmmmmmgmgmmmm__",
    "_mmkmmmmmmmmpm__",
    "_mmmmmkkmmmmmm__",
    "__mmmmmmmmmmm___",
    "___mmmmmmmmm____",
    "________________",
    "________________",
  ],
  radio: [
    "________________",
    "__________p_____",
    "_________p______",
    "________p_______",
    "________________",
    "___kkkkkkkkkk___",
    "__kffffffffffk__",
    "__kfppppppfgfk__",
    "__kfppppppfffk__",
    "__kfppppppfgfk__",
    "__kffffffffffk__",
    "__kkkkkkkkkkkk__",
    "__bbbbbbbbbbbb__",
    "________________",
    "________________",
    "________________",
  ],
  terminal: [
    "________________",
    "___kkkkkkkkkk___",
    "__kaaaaaaaaaak__",
    "__kaaaaaaaaaak__",
    "__kaaaatuaaaak__",
    "__kaaaaaaaaaak__",
    "__kaaaaaaaaaak__",
    "___kkkkkkkkkk___",
    "______kkkk______",
    "____kkkkkkkk____",
    "____eeeeeeee____",
    "____bbbbbbbb____",
    "________________",
    "________________",
    "________________",
    "________________",
  ],
  plant: [
    "________________",
    "_______t________",
    "______ttu_______",
    "____t_ttt_t_____",
    "_____ttttt______",
    "____tutttttu____",
    "_____ttttu______",
    "______ttt_______",
    "_______t________",
    "______btb_______",
    "________________",
    "________________",
    "________________",
    "________________",
    "________________",
    "________________",
  ],
};

// Renders a sprite definition to a 16x16 PNG data URL. Client-only.
export function spriteToDataUrl(rows: string[]): string {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  for (let y = 0; y < 16; y++) {
    const row = rows[y] ?? "";

    for (let x = 0; x < 16; x++) {
      const color = INK[row[x] ?? "_"];
      if (!color) continue;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return canvas.toDataURL();
}
