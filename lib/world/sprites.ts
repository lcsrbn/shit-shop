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
  | "hoodie"
  | "radio"
  | "terminal"
  | "plant"
  | "monolith"
  | "heap"
  | "spores";

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
  monolith: [
    "________________",
    "______pm________",
    "_____pmmk_______",
    "_____pmmk_______",
    "_____pmmk_______",
    "_____pmmk_______",
    "_____pmmk_______",
    "_____pmmk_______",
    "_____pmmk_______",
    "_____pmmk_______",
    "_____pmmk_______",
    "_____pmmk_______",
    "____pmmmk_______",
    "____bbbbbb______",
    "________________",
    "________________",
  ],
  // Once a shopkeeper, now a mound. One gold eye. (after Mold Mold Mold)
  heap: [
    "________________",
    "________________",
    "_______tt_______",
    "_____tttttt_____",
    "____tttuttt_____",
    "___ttttttttt____",
    "__ttgkttttttt___",
    "_tttttttmmtttt__",
    "_ttttttttmttttt_",
    "_tutttttttttttt_",
    "tttttttttttttttt",
    "ttttmmtttttutttt",
    "tttttttttttttttt",
    "_bt_ttt_tt_ttb__",
    "________________",
    "________________",
  ],
  // A colony of small wet things that speak in unison.
  spores: [
    "________________",
    "________________",
    "___uu___________",
    "__uukuu_________",
    "__uuuuu____tt___",
    "___uu_____tkkt__",
    "__________tttt__",
    "___________tt___",
    "_____ttttt______",
    "____tttkttt_____",
    "____ttttttt_mm__",
    "_uu_ttttttt_mkm_",
    "_uku_ttttt__mm__",
    "__u___ttt_______",
    "________________",
    "________________",
  ],
};

// ======================= THE WANDERER — PLAYER ==========================
// A dead pilgrim, though nothing should say so out loud. 24x40 — 1.5
// tiles wide, 2.5 tall, anchored to the bottom of its cell.
//
// THREE VIEWS: front (walking down), back (walking up), side (walking
// right — left is the CSS mirror). Each view = a torso ("TOP") plus
// interchangeable legs.
//
// THE WALK PLAYS IN FILE ORDER. Each view's `walk` array (bottom of this
// section) is the exact temporal sequence:
//   walk[0] → walk[1] → walk[2] → walk[3] → back to walk[0] …
// One tile-step plays half the cycle (two frames). TIP sounds on frame 1,
// TAP on frame 3. To edit the animation, edit the LEGS_WALK_* blocks
// top-to-bottom: they are already in play order.
// Rules: every row is 24 chars; contact legs are 18 rows; passing legs
// are 17 rows (they pair with the 1px-lower "LOW" torso — the bob).

const PLAYER_TOP = [
  "________________________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
  "_________kkkkk__________",
  "_________kbbbk__________",
  "_________kwbbw__________",
  "_________kbbbk__________",
  "__________kbk___________",
  "___________k____________",
  "_____ff__kkkkkk_________",
  "____feeekbbbbbbk________",
  "____feeekbebbebk________",
  "____fegekbbbbbbk_e______",
  "____feeekbebbebk_e______",
  "____feeekbbbbbbk_e______",
  "_____eeekbbbbbbk_e______",
  "________kbbbbbbk_p______",
  "________kkkkkkkk________",
  "_________kbbbbk_________",
];

// Seen from behind, walking away: no eyes, and the pack shows itself
// for what it is — worn on the back, buckle out.
const PLAYER_TOP_BACK = [
  "________________________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
  "_________kkkkk__________",
  "_________kkkkk__________",
  "_________kkkkkw_________",
  "_________kkkkk__________",
  "__________kkk___________",
  "___________k____________",
  "_________bbbbb__________",
  "________bbbbbbb_________",
  "________bfffffbe________",
  "________beeeeeb_e_______",
  "________beegeeb_e_______",
  "________beeeeeb_e_______",
  "________bbbbbbb_e_______",
  "________bbbbbbb_p_______",
  "________bbbbbbb_________",
  "_________bbbbb__________",
];

// Profile, facing right (left is the CSS mirror): one ember eye forward,
// the pack a hump on the back, the arm a dark line down the torso.
const PLAYER_TOP_SIDE = [
  "________________________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
  "___________kkkk_________",
  "___________kbbk_________",
  "___________kbbw_________",
  "___________kbbk_________",
  "____________kk__________",
  "____________k___________",
  "__________kkkkk_________",
  "________ffkbbbbk________",
  "________eekbbbbk________",
  "________egkbbbbk________",
  "________eekbkbbk________",
  "________eekbkbbk________",
  "_________ekbkbbk________",
  "__________kbpbbk________",
  "__________kkkkkk________",
  "___________kbbk_________",
];

// Body dropped one pixel for the passing frames — the walk's bob.
// (23 rows; paired with the 17-row passing legs to stay 40 tall.)
const PLAYER_TOP_LOW = ["________________________", ...PLAYER_TOP];
const PLAYER_TOP_BACK_LOW = ["________________________", ...PLAYER_TOP_BACK];
const PLAYER_TOP_SIDE_LOW = ["________________________", ...PLAYER_TOP_SIDE];

// ---- Legs, front & back views (shared) — IN PLAY ORDER -----------------

const LEGS_IDLE = [
  "________kk___kk_________",
  "________k_____k_________",
  "________k_____k_________",
  "________k_____k_________",
  "________k_____k_________",
  "________k_____k_________",
  "________k_____k_________",
  "________k_____k_________",
  "________k_____k_________",
  "________k_____k_________",
  "________k_____k_________",
  "________k_____k_________",
  "________k_____k_________",
  "_______kk_____kk________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
];

// walk frame 1/4 — contact: left leg forward, planted. TIP.
const LEGS_WALK_1 = [
  "________kk_____kk_______",
  "_______k________k_______",
  "_______k________k_______",
  "______k_________k_______",
  "______k_________k_______",
  "______k_________k_______",
  "______k_________k_______",
  "______kk________k_______",
  "________________k_______",
  "________________k_______",
  "________________k_______",
  "________________k_______",
  "________________k_______",
  "________________kk______",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
];

// walk frame 2/4 — passing: legs under the body (torso drops 1px).
const LEGS_WALK_2 = [
  "_______kk______kk_______",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "______kk_______kk_______",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
];

// walk frame 3/4 — contact: right leg forward, planted. TAP.
const LEGS_WALK_3 = [
  "________kk___kk_________",
  "________k______k________",
  "________k______k________",
  "________k______k________",
  "________k______k________",
  "________k______k________",
  "________k______k________",
  "________k___kk__________",
  "________k_______________",
  "________k_______________",
  "________k_______________",
  "________k_______________",
  "________k_______________",
  "_______kk_______________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
];

// walk frame 4/4 — passing again (free to differ from frame 2/4).
const LEGS_WALK_4 = [
  "_______kk______kk_______",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "_______k_______k________",
  "______kk_______kk_______",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
];

// ---- Legs, side view — IN PLAY ORDER (after the S&S 4-frame sheet) -----
// Facing right; the near leg reads in silhouette, knees bend, the
// trailing shin drags flat behind, the swinging foot reaches forward.

const SIDE_LEGS_IDLE = [
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "___________k__k_________",
  "__________kk__kk________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
];

// walk frame 1/4 — stride: front leg planted, back shin trailing flat. TIP.
const SIDE_LEGS_WALK_1 = [
  "___________k__k_________",
  "__________k___k_________",
  "__________k___k_________",
  "_________k____k_________",
  "_________k____k_________",
  "________k_____k_________",
  "____kkkkk_____k_________",
  "____k_________k_________",
  "______________k_________",
  "______________k_________",
  "______________k_________",
  "______________k_________",
  "______________k_________",
  "______________kk________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
];

// walk frame 2/4 — passing: swing knee tucks up, foot reaching forward.
const SIDE_LEGS_WALK_2 = [
  "____________kk__________",
  "____________k___________",
  "____________kk__________",
  "____________k_k_________",
  "____________k_kkkk______",
  "____________k___________",
  "____________k___________",
  "____________k___________",
  "____________k___________",
  "____________k___________",
  "____________k___________",
  "____________k___________",
  "____________kk__________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
];

// walk frame 3/4 — stride again, trailing shin a touch higher. TAP.
const SIDE_LEGS_WALK_3 = [
  "___________k__k_________",
  "__________k___k_________",
  "__________k___k_________",
  "_________k____k_________",
  "________k_____k_________",
  "_____kkkk_____k_________",
  "_____k________k_________",
  "______________k_________",
  "______________k_________",
  "______________k_________",
  "______________k_________",
  "______________k_________",
  "______________k_________",
  "______________kk________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
];

// walk frame 4/4 — passing, the reaching foot a touch lower than 2/4.
const SIDE_LEGS_WALK_4 = [
  "____________kk__________",
  "____________k___________",
  "____________k___________",
  "____________kk__________",
  "____________k_k_________",
  "____________k_kkk_______",
  "____________k___________",
  "____________k___________",
  "____________k___________",
  "____________k___________",
  "____________k___________",
  "____________k___________",
  "____________kk__________",
  "________________________",
  "________________________",
  "________________________",
  "________________________",
];

// ---- The assembled views. `walk` arrays are the temporal sequence. -----

export type PlayerView = { idle: string[]; walk: string[][] };

export const PLAYER_FRAMES: {
  front: PlayerView;
  back: PlayerView;
  side: PlayerView;
} = {
  front: {
    idle: [...PLAYER_TOP, ...LEGS_IDLE],
    walk: [
      [...PLAYER_TOP, ...LEGS_WALK_1], // 1 · contact L · TIP
      [...PLAYER_TOP_LOW, ...LEGS_WALK_2], // 2 · passing
      [...PLAYER_TOP, ...LEGS_WALK_3], // 3 · contact R · TAP
      [...PLAYER_TOP_LOW, ...LEGS_WALK_4], // 4 · passing
    ],
  },
  back: {
    idle: [...PLAYER_TOP_BACK, ...LEGS_IDLE],
    walk: [
      [...PLAYER_TOP_BACK, ...LEGS_WALK_1], // 1 · contact L · TIP
      [...PLAYER_TOP_BACK_LOW, ...LEGS_WALK_2], // 2 · passing
      [...PLAYER_TOP_BACK, ...LEGS_WALK_3], // 3 · contact R · TAP
      [...PLAYER_TOP_BACK_LOW, ...LEGS_WALK_4], // 4 · passing
    ],
  },
  side: {
    idle: [...PLAYER_TOP_SIDE, ...SIDE_LEGS_IDLE],
    walk: [
      [...PLAYER_TOP_SIDE, ...SIDE_LEGS_WALK_1], // 1 · stride · TIP
      [...PLAYER_TOP_SIDE_LOW, ...SIDE_LEGS_WALK_2], // 2 · passing
      [...PLAYER_TOP_SIDE, ...SIDE_LEGS_WALK_3], // 3 · stride · TAP
      [...PLAYER_TOP_SIDE_LOW, ...SIDE_LEGS_WALK_4], // 4 · passing
    ],
  },
};

function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  ox: number,
  oy: number
) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y] ?? "";

    for (let x = 0; x < row.length; x++) {
      const color = INK[row[x] ?? "_"];
      if (!color) continue;

      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

// Renders a sprite definition to a PNG data URL. Client-only.
// Sprites may be taller than one tile (e.g. 16x32 characters).
export function spriteToDataUrl(rows: string[]): string {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(...rows.map((r) => r.length), 1);
  canvas.height = rows.length;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  drawSprite(ctx, rows, 0, 0);
  return canvas.toDataURL();
}

// Deterministic per-pixel noise, so the land looks weathered but stable.
function hash2(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return (h ^ (h >>> 16)) >>> 0;
}

type PaintTile = "floor" | "wall" | "door" | "void";

// Composites a whole room into one PNG: speckled floor, walls, doors,
// glowing rims where the land meets the abyss, cliffs dripping into it.
// Void stays transparent so the fixed starfield shows through (parallax).
export function roomToDataUrl(tiles: PaintTile[][]): string {
  const h = tiles.length;
  const w = tiles[0]?.length ?? 0;

  const canvas = document.createElement("canvas");
  canvas.width = w * 16;
  canvas.height = h * 16;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const at = (x: number, y: number): PaintTile => tiles[y]?.[x] ?? "void";

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const kind = at(x, y);
      if (kind === "void") continue;

      if (kind === "wall") {
        // Context-aware wall: highlight cap only at the top of a run,
        // shadow only at the bottom, so vertical runs read as one wall.
        ctx.fillStyle = PALETTE.wall;
        ctx.fillRect(x * 16, y * 16, 16, 16);

        for (let py = 0; py < 16; py++) {
          for (let px = 0; px < 16; px++) {
            if (hash2(x * 16 + px, y * 16 + py) % 61 === 0) {
              ctx.fillStyle = PALETTE.dark;
              ctx.fillRect(x * 16 + px, y * 16 + py, 1, 1);
            }
          }
        }

        if (at(x, y - 1) !== "wall") {
          ctx.fillStyle = PALETTE.wallHi;
          ctx.fillRect(x * 16, y * 16, 16, 3);
        }

        if (at(x, y + 1) !== "wall" && at(x, y + 1) !== "floor") {
          ctx.fillStyle = PALETTE.ink;
          ctx.fillRect(x * 16, y * 16 + 15, 16, 1);
        }
      } else if (kind === "door") {
        drawSprite(ctx, SPRITES.door, x * 16, y * 16);
      } else {
        ctx.fillStyle = PALETTE.floor;
        ctx.fillRect(x * 16, y * 16, 16, 16);

        for (let py = 0; py < 16; py++) {
          for (let px = 0; px < 16; px++) {
            const r = hash2(x * 16 + px, y * 16 + py) % 89;
            if (r === 0) {
              ctx.fillStyle = PALETTE.floorHi;
              ctx.fillRect(x * 16 + px, y * 16 + py, 1, 1);
            } else if (r === 1) {
              ctx.fillStyle = PALETTE.dark;
              ctx.fillRect(x * 16 + px, y * 16 + py, 1, 1);
            }
          }
        }
      }
    }
  }

  // Edges: rim light where floor meets the void, cliff faces below.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (at(x, y) !== "floor") continue;

      ctx.fillStyle = PALETTE.floorHi;
      if (at(x, y - 1) === "void") ctx.fillRect(x * 16, y * 16, 16, 1);
      if (at(x - 1, y) === "void") ctx.fillRect(x * 16, y * 16, 1, 16);
      if (at(x + 1, y) === "void") ctx.fillRect(x * 16 + 15, y * 16, 1, 16);

      if (at(x, y + 1) === "void") {
        ctx.fillStyle = PALETTE.wallHi;
        ctx.fillRect(x * 16, y * 16 + 15, 16, 1);

        for (let px = 0; px < 16; px++) {
          const depth = 4 + (hash2(x * 16 + px, y) % 5);

          for (let py = 0; py < depth; py++) {
            ctx.fillStyle = py < 2 ? PALETTE.wall : PALETTE.dark;
            ctx.fillRect(x * 16 + px, (y + 1) * 16 + py, 1, 1);
          }

          if (hash2(x * 16 + px, y + 7) % 11 === 0) {
            ctx.fillStyle = PALETTE.dark;
            ctx.fillRect(x * 16 + px, (y + 1) * 16 + depth, 1, 3);
          }
        }
      }
    }
  }

  return canvas.toDataURL();
}

// A repeating tile of faint dust/stars for the abyss behind the land.
export function starfieldToDataUrl(): string {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  for (let i = 0; i < 70; i++) {
    const x = hash2(i, 1) % size;
    const y = hash2(i, 2) % size;
    const r = hash2(i, 3) % 12;

    ctx.fillStyle =
      r === 0 ? PALETTE.wall : r < 4 ? PALETTE.floorHi : PALETTE.dark;
    ctx.fillRect(x, y, 1, 1);
  }

  return canvas.toDataURL();
}
