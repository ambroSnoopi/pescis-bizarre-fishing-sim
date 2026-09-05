/**
 * Hex math for the Golden Spirit battlefield.
 *
 * Pointy-top hexagons in an "odd-r" offset layout: odd-numbered rows sit half a
 * hex to the right, which is why the two halves stay level with each other and
 * the line between them zig-zags.
 *
 *   col 0..cols-1 (left to right), row 0..rows-1 (top to bottom)
 *
 * Every PvP scene has its own board, so nothing here assumes a shape: the
 * functions take a `Board`, built in `lib/maps.ts` from that scene's deploy
 * zones. Offset coordinates are what the UI talks in (A2 … G3); distance math
 * converts to axial/cube first.
 */

export type Hex = { col: number; row: number };
export type Zone = "ally" | "enemy" | "neutral";

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

/**
 * One scene's battlefield.
 *
 * `tiles` is every hex on the board: the two deploy zones plus the middle
 * ground between them. Nobody deploys in the middle, so those tiles aren't
 * clickable, but they are drawn and they carry the hook's catch back across.
 */
export type Board = {
  cols: number;
  rows: number;
  /** Every tile, in reading order. */
  tiles: readonly Hex[];
  /** `key(hex)` → its zone. Missing means the hex is off the board. */
  zones: ReadonlyMap<string, Zone>;
  /** How far apart two opposing deploy tiles can sit — closest and furthest. */
  span: { min: number; max: number };
};

export function key(h: Hex): string {
  return `${h.col},${h.row}`;
}

export function sameHex(a: Hex | null, b: Hex | null): boolean {
  return !!a && !!b && a.col === b.col && a.row === b.row;
}

/**
 * Assemble a board from its two deploy zones, each written as one array of
 * column indices per row — the shape a scene gets read off a screenshot in.
 *
 * A screenshot only shows the deploy tiles; the middle ground is drawn as
 * plain ground, so the tiles there have to be inferred. Every row runs from
 * its leftmost deploy tile to its rightmost, and whatever isn't a deploy tile
 * inside that run is the middle ground. That fills the gap between the halves
 * — and any hole *within* a half, which several scenes have — without
 * inventing tiles off the ends of a row.
 */
export function makeBoard(
  ally: readonly (readonly number[])[],
  enemy: readonly (readonly number[])[],
): Board {
  const zones = new Map<string, Zone>();
  const allyTiles: Hex[] = [];
  const enemyTiles: Hex[] = [];

  for (const [zone, deploy, into] of [
    ["ally", ally, allyTiles],
    ["enemy", enemy, enemyTiles],
  ] as const) {
    deploy.forEach((cols, row) => {
      for (const col of cols) {
        into.push({ col, row });
        zones.set(key({ col, row }), zone);
      }
    });
  }

  const rows = Math.max(ally.length, enemy.length);
  const deployed = [...allyTiles, ...enemyTiles];

  for (let row = 0; row < rows; row++) {
    const inRow = deployed.filter((h) => h.row === row).map((h) => h.col);
    if (!inRow.length) continue;
    for (let col = Math.min(...inRow); col <= Math.max(...inRow); col++) {
      const h = { col, row };
      if (!zones.has(key(h))) zones.set(key(h), "neutral");
    }
  }

  const tiles = [...zones.keys()]
    .map((k) => {
      const [col, row] = k.split(",").map(Number);
      return { col, row };
    })
    .sort((a, b) => a.row - b.row || a.col - b.col);

  const cols = tiles.reduce((w, h) => Math.max(w, h.col + 1), 0);
  const across = allyTiles.flatMap((a) =>
    enemyTiles.map((e) => hexDistance(a, e)),
  );

  return {
    cols,
    rows,
    tiles,
    zones,
    span: { min: Math.min(...across), max: Math.max(...across) },
  };
}

/** The zone `h` sits in, or null when it is off the board entirely. */
export function zoneOf(board: Board, h: Hex): Zone | null {
  return board.zones.get(key(h)) ?? null;
}

/** Membership in the tile list — *not* a bounds check; boards have holes. */
export function onBoard(board: Board, h: Hex): boolean {
  return board.zones.has(key(h));
}

/**
 * The middle ground is no-man's land: nobody deploys there, so it can hold
 * neither Pesci nor a mark. It still counts for distance, and the hook drags
 * its catch back across it like any other tile.
 */
export function isPlayable(board: Board, h: Hex): boolean {
  const zone = zoneOf(board, h);
  return zone === "ally" || zone === "enemy";
}

/** True when two tiles sit on opposite halves of the field. */
export function oppositeHalves(board: Board, a: Hex, b: Hex): boolean {
  const za = zoneOf(board, a);
  const zb = zoneOf(board, b);
  return (
    za !== null &&
    zb !== null &&
    za !== "neutral" &&
    zb !== "neutral" &&
    za !== zb
  );
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
export function neighbors(board: Board, h: Hex): Hex[] {
  const a = toAxial(h);
  return AXIAL_DIRS.map(([dq, dr]) =>
    fromAxial({ q: a.q + dq, r: a.r + dr }),
  ).filter((n) => onBoard(board, n));
}

/**
 * Where the target ends up after being reeled in.
 *
 * The hook drags the target one tile per second for three seconds. It only
 * ever moves along real tiles, and it can't end up on top of Pesci, so the
 * pull stops as soon as the target is next to him.
 */
export function pullPath(board: Board, target: Hex, pesci: Hex): Hex[] {
  const path: Hex[] = [target];
  let current = target;

  for (let step = 0; step < PULL_TILES; step++) {
    if (hexDistance(current, pesci) <= 1) break;

    const from = hexToPixel(pesci);
    const next = neighbors(board, current)
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
export function boardWidth(board: Board): number {
  return 2 * PAD + (board.cols + 0.5) * HEX_W;
}

export function boardHeight(board: Board): number {
  return 2 * PAD + (1.5 * board.rows + 0.5) * HEX_SIZE * Y_SQUASH;
}

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
