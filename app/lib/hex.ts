/**
 * Hex math for the Golden Spirit battlefield.
 *
 * Pointy-top hexagons in an "odd-r" offset layout: odd-numbered rows sit half a
 * hex to the right, which is why the two halves stay level with each other and
 * the line between them zig-zags.
 *
 *   col 0..6 (left to right), row 0..4 (top to bottom)
 *
 * The grid is not a full 7x5 rectangle — the corners are cut, leaving 29 tiles
 * (see `BOARD`). Column A is the ally back line, column D and the C2/C4 notches
 * are the neutral middle ground, and columns E-G are the enemy half. Offset
 * coordinates are what the UI talks in (A2 … G3); distance math converts to
 * axial/cube first.
 */

export type Hex = { col: number; row: number };
export type Zone = "ally" | "neutral" | "enemy";

export const COLS = 7;
export const ROWS = 5;

/** "…the furthest enemy within 6 tiles" */
export const MAX_RANGE = 6;
/** "…pulls the target toward him by 1 tile 1 time per second… lasts for 3 seconds" */
export const PULL_TILES = 3;
/** A team fields at most five units, so that's the whole enemy line-up. */
export const MAX_ENEMIES = 5;

const SQRT3 = Math.sqrt(3);

/* ------------------------------------------------------------------ */
/* Board                                                               */
/* ------------------------------------------------------------------ */

export const BOARD: Hex[] = [
  // Row 0 (display "1"): B1, C1, D1, E1, F1
  { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }, { col: 4, row: 0 }, { col: 5, row: 0 },
  // Row 1 (display "2"): A2, B2, C2, D2, E2, F2 (no G2)
  { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 }, { col: 5, row: 1 },
  // Row 2 (display "3"): A3, B3, C3, D3, E3, F3, G3
  { col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }, { col: 4, row: 2 }, { col: 5, row: 2 }, { col: 6, row: 2 },
  // Row 3 (display "4"): A4, B4, C4, D4, E4, F4 (no G4)
  { col: 0, row: 3 }, { col: 1, row: 3 }, { col: 2, row: 3 }, { col: 3, row: 3 }, { col: 4, row: 3 }, { col: 5, row: 3 },
  // Row 4 (display "5"): B5, C5, D5, E5, F5 (no A5)
  { col: 1, row: 4 }, { col: 2, row: 4 }, { col: 3, row: 4 }, { col: 4, row: 4 }, { col: 5, row: 4 },
];

export function key(h: Hex): string {
  return `${h.col},${h.row}`;
}

export function sameHex(a: Hex | null, b: Hex | null): boolean {
  return !!a && !!b && a.col === b.col && a.row === b.row;
}

const BOARD_KEYS = new Set(BOARD.map((h) => `${h.col},${h.row}`));

/** The corners are cut, so this is membership in `BOARD`, not a bounds check. */
export function onBoard(h: Hex): boolean {
  return BOARD_KEYS.has(`${h.col},${h.row}`);
}

export function zoneOf(h: Hex): Zone {
  if (h.col === 3) return "neutral";
  if (h.col === 2 && (h.row === 1 || h.row === 3)) return "neutral";
  if (h.col < 3) return "ally";
  return "enemy";
}

/**
 * The middle ground is no-man's land: nobody deploys there, so it can hold
 * neither Pesci nor a mark. It still counts for distance — the hook flies over
 * it like any other tile.
 */
export function isPlayable(h: Hex): boolean {
  return zoneOf(h) !== "neutral";
}

/** True when two tiles sit on opposite halves of the field. */
export function oppositeHalves(a: Hex, b: Hex): boolean {
  const za = zoneOf(a);
  const zb = zoneOf(b);
  return za !== "neutral" && zb !== "neutral" && za !== zb;
}

/** Human readable tile name, e.g. `C4` — column letter + 1-based row. */
export function hexName(h: Hex): string {
  return `${String.fromCharCode(65 + h.col)}${h.row + 1}`;
}

/* ------------------------------------------------------------------ */
/* Offset <-> axial                                                    */
/* ------------------------------------------------------------------ */

type Axial = { q: number; r: number };

function toAxial(h: Hex): Axial {
  return { q: h.col - ((h.row - (h.row & 1)) >> 1), r: h.row };
}

function fromAxial(a: Axial): Hex {
  return { col: a.q + ((a.r - (a.r & 1)) >> 1), row: a.r };
}

/* ------------------------------------------------------------------ */
/* Distance                                                            */
/* ------------------------------------------------------------------ */

/** Number of tiles between two hexes. */
export function hexDistance(a: Hex, b: Hex): number {
  const pa = toAxial(a);
  const pb = toAxial(b);
  const dq = pa.q - pb.q;
  const dr = pa.r - pb.r;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

/** Every tile on the board at exactly `d` tiles from `from`. */
export function tilesAtDistance(from: Hex, d: number): Hex[] {
  return BOARD.filter((h) => hexDistance(from, h) === d);
}

/* ------------------------------------------------------------------ */
/* Neighbours and the hook's pull path                                 */
/* ------------------------------------------------------------------ */

const AXIAL_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

/** The (up to six) adjacent tiles that are still on the board. */
export function neighbors(h: Hex): Hex[] {
  const a = toAxial(h);
  return AXIAL_DIRS.map(([dq, dr]) =>
    fromAxial({ q: a.q + dq, r: a.r + dr }),
  ).filter(onBoard);
}

/**
 * Where the target ends up after being reeled in.
 *
 * The hook drags the target one tile per second for three seconds. It only
 * ever moves along real tiles, and it can't end up on top of Pesci, so the
 * pull stops as soon as the target is next to him.
 */
export function pullPath(target: Hex, pesci: Hex): Hex[] {
  const path: Hex[] = [target];
  let current = target;

  for (let step = 0; step < PULL_TILES; step++) {
    if (hexDistance(current, pesci) <= 1) break;

    const from = hexToPixel(pesci);
    const next = neighbors(current)
      .filter((h) => hexDistance(h, pesci) < hexDistance(current, pesci))
      .sort((a, b) => {
        // Prefer the neighbour that is physically closest to Pesci, so the
        // drag reads as a straight line.
        const pa = hexToPixel(a);
        const pb = hexToPixel(b);
        return (
          Math.hypot(pa.x - from.x, pa.y - from.y) -
          Math.hypot(pb.x - from.x, pb.y - from.y)
        );
      })[0];

    if (!next) break;
    path.push(next);
    current = next;
  }

  return path;
}

/* ------------------------------------------------------------------ */
/* Pixel layout                                                        */
/* ------------------------------------------------------------------ */

/** Circumradius of a hex, in SVG user units. */
export const HEX_SIZE = 44;
/** Vertical squash, mimicking the game's tilted camera. */
export const Y_SQUASH = 0.85;
/** Breathing room around the board for glows and the Pesci standee. */
export const PAD = 46;

/** Width of a pointy-top hex, and the horizontal step between neighbours. */
export const HEX_W = SQRT3 * HEX_SIZE;
/** Height of a (squashed) hex. */
export const HEX_H = 2 * HEX_SIZE * Y_SQUASH;

const ROW_STEP = 1.5 * HEX_SIZE * Y_SQUASH;

// The extra half column of width is the odd rows' offset.
export const BOARD_W = 2 * PAD + 7.5 * HEX_W;
export const BOARD_H = 2 * PAD + 8 * HEX_SIZE * Y_SQUASH;

export function hexToPixel(h: Hex): { x: number; y: number } {
  return {
    x: PAD + HEX_W * (h.col + 0.5 * (h.row & 1) + 0.5),
    y: PAD + HEX_SIZE * Y_SQUASH + ROW_STEP * h.row,
  };
}

/** `points` attribute for a pointy-top hexagon centred on `h`. */
export function hexPoints(h: Hex, shrink = 0.94): string {
  const { x, y } = hexToPixel(h);
  const rx = HEX_SIZE * shrink;
  const ry = HEX_SIZE * shrink * Y_SQUASH;

  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i + 30);
    return `${(x + rx * Math.cos(angle)).toFixed(2)},${(
      y +
      ry * Math.sin(angle)
    ).toFixed(2)}`;
  }).join(" ");
}
