import {
  type Board,
  type Hex,
  MAX_ENEMIES,
  MAX_RANGE,
  type Zone,
  hexDistance,
  isPlayable,
  key,
  oppositeHalves,
  pullPath,
  sameHex,
  zoneOf,
} from "./hex";

export type Mode = "place" | "target";

/** Everything the player has put on the board, in one bag. */
export type Selection = {
  mode: Mode;
  pesci: Hex | null;
  target: Hex | null;
  /**
   * Bodies standing on the half opposite Pesci, in place mode. Capped at
   * `MAX_ENEMIES` — a full enemy team.
   */
  enemies: Hex[];
};

/**
 * Fisher Man grabs the *furthest* enemy within 6 tiles, so any enemy standing
 * further from Pesci than your mark steals the hook ("steal"), and one at the
 * exact same distance makes the pick a coin flip ("tie").
 */
export type Threat = "none" | "steal" | "tie";

/**
 * What clicking a tile does, given the current selection.
 *
 * In target mode the two halves mean different things: the mark's own half
 * re-marks, the far half is where Pesci can stand, and the hook itself starts
 * over. Deriving it once keeps the click handler and the tile labels honest
 * about each other.
 */
export type TileAction =
  | "none"
  | "set-target"
  | "place-pesci"
  | "lift-pesci"
  | "reset"
  | "add-enemy"
  | "remove-enemy";

export function actionFor(
  board: Board,
  hex: Hex,
  { mode, pesci, target, enemies }: Selection,
): TileAction {
  if (!isPlayable(board, hex)) return "none";

  if (mode === "place") {
    if (sameHex(hex, pesci)) return "lift-pesci";
    // Once Pesci is down the far half belongs to the enemy line-up: his own
    // half moves him, the other one populates the board he's aiming at.
    if (pesci && oppositeHalves(board, pesci, hex)) {
      if (enemies.some((e) => sameHex(e, hex))) return "remove-enemy";
      return enemies.length < MAX_ENEMIES ? "add-enemy" : "none";
    }
    return "place-pesci";
  }

  if (!target) return "set-target";
  // Clicking the hook again drops everything and starts a fresh cast.
  if (sameHex(hex, target)) return "reset";
  // Enemies share a half, so anything on the mark's side re-marks instead.
  if (!oppositeHalves(board, target, hex)) return "set-target";
  return sameHex(hex, pesci) ? "lift-pesci" : "place-pesci";
}

/**
 * A placed enemy's relationship to the hook: the one it takes ("hooked" — or
 * several, when they tie for furthest), one it passes over because someone
 * else is further out ("safe"), or one it can't reach at all.
 */
export type EnemyState = "none" | "hooked" | "safe" | "out-of-range";

export type TileView = {
  hex: Hex;
  zone: Zone;
  /** What a click here would do right now. */
  action: TileAction;
  /** Tiles from Pesci, or null when he isn't placed. */
  dist: number | null;
  inRange: boolean;
  /**
   * On the half opposite Pesci — the only place an enemy can stand, whether
   * or not the hook reaches it. Worth its own flag because on most scenes a
   * good part of that half sits past `MAX_RANGE`.
   */
  farHalf: boolean;
  /**
   * Far half *and* in range. Only these tiles get shaded, so the two halves
   * stay legible once Pesci is down.
   */
  highlight: boolean;
  isMax: boolean;
  isIdeal: boolean;
  isTarget: boolean;
  isPesci: boolean;
  /** Whether an enemy stands here, and what the hook would do about them. */
  enemy: EnemyState;
  threat: Threat;
  onPullPath: boolean;
  isPullLanding: boolean;
};

export type BoardView = {
  tiles: TileView[];
  /** Positions as far from the target as the board allows, up to max range. */
  ideal: Hex[];
  /**
   * How far those positions actually are. `MAX_RANGE` when the scene has a
   * tile a full 6 steps out; less when it doesn't, and 0 when the target is
   * out of reach from the whole opposite half.
   */
  idealDist: number;
  /** Ordered tiles the target is dragged across, empty when there's no pull. */
  pull: Hex[];
  /** Where the target ends up after 3 seconds of reeling. */
  landing: Hex | null;
  /** Pesci → target distance, or null when either is missing. */
  targetDist: number | null;
  targetInRange: boolean;
  /**
   * The placed enemies the hook could take. More than one means they tie for
   * furthest and the pick is a coin flip; empty means nothing is in reach.
   */
  hooked: Hex[];
  /** How far those enemies stand, or null when none are in range. */
  hookedDist: number | null;
  counts: {
    inRange: number;
    maxRange: number;
    ideal: number;
    steal: number;
    tie: number;
    /** Placed enemies, and how many of them the hook can actually reach. */
    enemies: number;
    enemiesInRange: number;
  };
};

export function deriveBoard(
  board: Board,
  { mode, pesci, target, enemies }: Selection,
): BoardView {
  // Pesci casts from the half opposite his mark, so that's the only place a
  // suggested position can be. `oppositeHalves` already rules out neutral.
  const candidates =
    mode === "target" && target
      ? board.tiles.filter(
          (h) =>
            oppositeHalves(board, target, h) &&
            hexDistance(target, h) <= MAX_RANGE,
        )
      : [];

  const idealDist = candidates.reduce(
    (best, h) => Math.max(best, hexDistance(target as Hex, h)),
    0,
  );
  const ideal =
    idealDist > 0
      ? candidates.filter((h) => hexDistance(target as Hex, h) === idealDist)
      : [];
  const idealKeys = new Set(ideal.map(key));

  const targetDist = pesci && target ? hexDistance(pesci, target) : null;
  const targetInRange =
    targetDist !== null && targetDist > 0 && targetDist <= MAX_RANGE;

  const pull =
    pesci && target && targetInRange ? pullPath(board, target, pesci) : [];
  const pullKeys = new Set(pull.map(key));
  const landing = pull.length > 1 ? pull[pull.length - 1] : null;

  // The hook always takes the furthest body it can reach, so the enemies worth
  // flagging are the ones tied for the largest in-range distance. On most
  // scenes the halves are far enough apart that some pairs sit past
  // `MAX_RANGE`, and then the hook simply can't reach them.
  const enemyKeys = new Set(enemies.map(key));
  const reachable = pesci
    ? enemies.filter((e) => {
        const d = hexDistance(pesci, e);
        return d > 0 && d <= MAX_RANGE;
      })
    : [];
  const hookedDist = reachable.length
    ? Math.max(...reachable.map((e) => hexDistance(pesci as Hex, e)))
    : null;
  const hooked =
    hookedDist === null
      ? []
      : reachable.filter((e) => hexDistance(pesci as Hex, e) === hookedDist);
  const hookedKeys = new Set(hooked.map(key));

  const tiles = board.tiles.map<TileView>((hex) => {
    const dist = pesci ? hexDistance(pesci, hex) : null;
    const inRange = dist !== null && dist > 0 && dist <= MAX_RANGE;
    // The far half is the only place a body can be, so it is also the only
    // place a body can steal the hook from — that rules out the middle
    // ground too, since nothing stands there.
    const farHalf = !!pesci && oppositeHalves(board, pesci, hex);

    let threat: Threat = "none";
    if (
      inRange &&
      farHalf &&
      targetInRange &&
      targetDist !== null &&
      dist !== null &&
      !sameHex(hex, target)
    ) {
      if (dist > targetDist) threat = "steal";
      else if (dist === targetDist) threat = "tie";
    }

    const enemy: EnemyState = !enemyKeys.has(key(hex))
      ? "none"
      : hookedKeys.has(key(hex))
        ? "hooked"
        : inRange
          ? "safe"
          : "out-of-range";

    return {
      hex,
      zone: zoneOf(board, hex) as Zone,
      action: actionFor(board, hex, { mode, pesci, target, enemies }),
      dist,
      inRange,
      farHalf,
      highlight: inRange && farHalf,
      isMax: dist === MAX_RANGE,
      isIdeal: idealKeys.has(key(hex)),
      isTarget: sameHex(hex, target),
      isPesci: sameHex(hex, pesci),
      enemy,
      threat,
      onPullPath: pullKeys.has(key(hex)),
      isPullLanding: sameHex(hex, landing),
    };
  });

  return {
    tiles,
    ideal,
    idealDist,
    pull,
    landing,
    targetDist,
    targetInRange,
    hooked,
    hookedDist,
    counts: {
      // Counted over the far half only, so the numbers match what's shaded:
      // tiles an enemy could actually be standing on.
      inRange: tiles.filter((t) => t.highlight).length,
      maxRange: tiles.filter((t) => t.highlight && t.isMax).length,
      ideal: ideal.length,
      steal: tiles.filter((t) => t.threat === "steal").length,
      tie: tiles.filter((t) => t.threat === "tie").length,
      enemies: enemies.length,
      enemiesInRange: reachable.length,
    },
  };
}
