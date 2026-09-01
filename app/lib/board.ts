import {
  BOARD,
  Hex,
  MAX_RANGE,
  Zone,
  hexDistance,
  key,
  pullPath,
  sameHex,
  zoneOf,
} from "./hex";

export type Mode = "place" | "target";

/**
 * Fisher Man grabs the *furthest* enemy within 6 tiles, so any enemy standing
 * further from Pesci than your mark steals the hook ("steal"), and one at the
 * exact same distance makes the pick a coin flip ("tie").
 */
export type Threat = "none" | "steal" | "tie";

export type TileView = {
  hex: Hex;
  zone: Zone;
  /** Tiles from Pesci, or null when he isn't placed. */
  dist: number | null;
  inRange: boolean;
  isMax: boolean;
  isIdeal: boolean;
  isTarget: boolean;
  isPesci: boolean;
  threat: Threat;
  onPullPath: boolean;
  isPullLanding: boolean;
};

export type BoardView = {
  tiles: TileView[];
  /** Positions as far from the target as the board allows, up to max range. */
  ideal: Hex[];
  /**
   * How far those positions actually are. Usually `MAX_RANGE`, but tiles near
   * the middle of the board simply have no tile 6 steps away, so the best
   * available cast is shorter.
   */
  idealDist: number;
  /** Ordered tiles the target is dragged across, empty when there's no pull. */
  pull: Hex[];
  /** Where the target ends up after 3 seconds of reeling. */
  landing: Hex | null;
  /** Pesci → target distance, or null when either is missing. */
  targetDist: number | null;
  targetInRange: boolean;
  counts: {
    inRange: number;
    maxRange: number;
    ideal: number;
    steal: number;
    tie: number;
  };
};

export function deriveBoard({
  mode,
  pesci,
  target,
  allySideOnly,
}: {
  mode: Mode;
  pesci: Hex | null;
  target: Hex | null;
  allySideOnly: boolean;
}): BoardView {
  const candidates =
    mode === "target" && target
      ? BOARD.filter(
          (h) =>
            (!allySideOnly || zoneOf(h) === "ally") &&
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

  const pull = pesci && target && targetInRange ? pullPath(target, pesci) : [];
  const pullKeys = new Set(pull.map(key));
  const landing = pull.length > 1 ? pull[pull.length - 1] : null;

  const tiles = BOARD.map<TileView>((hex) => {
    const dist = pesci ? hexDistance(pesci, hex) : null;
    const inRange = dist !== null && dist > 0 && dist <= MAX_RANGE;

    let threat: Threat = "none";
    if (
      inRange &&
      targetInRange &&
      targetDist !== null &&
      dist !== null &&
      !sameHex(hex, target)
    ) {
      if (dist > targetDist) threat = "steal";
      else if (dist === targetDist) threat = "tie";
    }

    return {
      hex,
      zone: zoneOf(hex),
      dist,
      inRange,
      isMax: dist === MAX_RANGE,
      isIdeal: idealKeys.has(key(hex)),
      isTarget: sameHex(hex, target),
      isPesci: sameHex(hex, pesci),
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
    counts: {
      inRange: tiles.filter((t) => t.inRange).length,
      maxRange: tiles.filter((t) => t.isMax).length,
      ideal: ideal.length,
      steal: tiles.filter((t) => t.threat === "steal").length,
      tie: tiles.filter((t) => t.threat === "tie").length,
    },
  };
}
