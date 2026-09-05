"use client";

import { TileView } from "../lib/board";
import {
  BOARD_H,
  BOARD_W,
  HEX_H,
  HEX_W,
  Hex,
  MAX_RANGE,
  PAD,
  hexName,
  hexPoints,
  hexToPixel,
  sameHex,
} from "../lib/hex";
import { EnemyToken, HookToken, PesciToken } from "./tokens";

const ZONE_FILL: Record<TileView["zone"], string> = {
  ally: "#101d24",
  neutral: "#15151f",
  enemy: "#231019",
};

const ZONE_STROKE: Record<TileView["zone"], string> = {
  ally: "rgba(125, 211, 252, 0.22)",
  neutral: "rgba(226, 214, 168, 0.20)",
  enemy: "rgba(248, 113, 113, 0.38)",
};

/** Spoken hint for what a click does, appended to each tile's label. */
const ACTION_HINT: Record<TileView["action"], string | null> = {
  none: null,
  "set-target": "click to mark this enemy",
  "place-pesci": "click to place Pesci",
  "lift-pesci": "click to pick Pesci up",
  reset: "click to clear the board",
  "add-enemy": "click to stand an enemy here",
  "remove-enemy": "click to take this enemy off the board",
};

/** Hover outline, colour-coded to the same actions. */
const ACTION_STROKE: Record<TileView["action"], string> = {
  none: "transparent",
  "set-target": "#f472b6",
  "place-pesci": "rgba(255,255,255,0.85)",
  "lift-pesci": "rgba(255,255,255,0.85)",
  reset: "#fb7185",
  "add-enemy": "#fb7185",
  "remove-enemy": "rgba(255,255,255,0.85)",
};

/** How a placed enemy reads on the board, once the hook has picked. */
const ENEMY_STYLE: Record<
  Exclude<TileView["enemy"], "none">,
  { fill: string; stroke: string; token: string; dashed?: boolean }
> = {
  hooked: {
    fill: "rgba(250, 204, 21, 0.20)",
    stroke: "#facc15",
    token: "#fca5a5",
  },
  safe: {
    fill: "rgba(251, 113, 133, 0.14)",
    stroke: "#fb7185",
    token: "#fb7185",
  },
  "out-of-range": {
    fill: "rgba(148, 163, 184, 0.10)",
    stroke: "rgba(148, 163, 184, 0.55)",
    token: "#94a3b8",
    dashed: true,
  },
};

/** Spoken state for a placed enemy, so the board reads the same as it looks. */
const ENEMY_HINT: Record<TileView["enemy"], string | null> = {
  none: null,
  hooked: "enemy here, the hook takes them",
  safe: "enemy here, someone further out takes the hook",
  "out-of-range": "enemy here, out of the hook's reach",
};

/**
 * Rings get slightly denser the further out they sit, warming towards the gold
 * of the max-range ring so the whole range reads as one scale.
 */
function ringFill(dist: number): string {
  return dist === MAX_RANGE
    ? "rgba(250, 204, 21, 0.26)"
    : `rgba(245, 158, 11, ${(0.04 + dist * 0.025).toFixed(3)})`;
}

export type BoardProps = {
  tiles: TileView[];
  pull: Hex[];
  landing: Hex | null;
  pesci: Hex | null;
  target: Hex | null;
  hovered: Hex | null;
  awaitingTarget: boolean;
  showThreats: boolean;
  showPull: boolean;
  onPick: (hex: Hex) => void;
  onHover: (hex: Hex | null) => void;
};

export default function Board({
  tiles,
  pull,
  landing,
  pesci,
  target,
  hovered,
  awaitingTarget,
  showThreats,
  showPull,
  onPick,
  onHover,
}: BoardProps) {
  const pullLine = pull
    .map((h) => {
      const { x, y } = hexToPixel(h);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
      className="w-full select-none"
      role="group"
      aria-label="Battlefield, 29 tile hex grid"
    >
      <defs>
        <radialGradient id="fieldBg" cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor="#16202a" />
          <stop offset="60%" stopColor="#0d1218" />
          <stop offset="100%" stopColor="#05070a" />
        </radialGradient>

        <pattern
          id="stealHatch"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            stroke="#fb7185"
            strokeWidth="2"
            opacity="0.3"
          />
        </pattern>

        <pattern
          id="tieHatch"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.28"
          />
        </pattern>

        <filter id="goldGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={BOARD_W} height={BOARD_H} fill="url(#fieldBg)" rx="14" />

      {/* Zone captions */}
      <g className="font-mono" fontSize="13" letterSpacing="3">
        <text x={PAD} y={PAD - 16} fill="rgba(125, 211, 252, 0.55)">
          ALLY SIDE
        </text>
        <text
          x={BOARD_W - PAD}
          y={PAD - 16}
          textAnchor="end"
          fill="rgba(248, 113, 113, 0.6)"
        >
          ENEMY SIDE
        </text>
        <text
          x={hexToPixel({ col: 3, row: 0 }).x}
          y={BOARD_H - PAD + 26}
          textAnchor="middle"
          fontSize="11"
          fill="rgba(226, 214, 168, 0.45)"
        >
          NEUTRAL
        </text>
      </g>

      {/* Base tiles */}
      <g>
        {tiles.map((t) => (
          <polygon
            key={`base-${t.hex.col}-${t.hex.row}`}
            points={hexPoints(t.hex)}
            fill={ZONE_FILL[t.zone]}
            stroke={ZONE_STROKE[t.zone]}
            strokeWidth={1.5}
            strokeDasharray={t.zone === "neutral" ? "5 4" : undefined}
          />
        ))}
      </g>

      {/* Range rings — far half only, so the two halves stay readable */}
      <g>
        {tiles
          .filter((t) => t.highlight)
          .map((t) => (
            <polygon
              key={`ring-${t.hex.col}-${t.hex.row}`}
              points={hexPoints(t.hex)}
              fill={ringFill(t.dist as number)}
              stroke="rgba(251, 191, 36, 0.3)"
              strokeWidth={1.2}
            />
          ))}
      </g>

      {/* Steal / tie warnings */}
      {showThreats && (
        <g>
          {tiles
            .filter((t) => t.threat !== "none")
            .map((t) => (
              <polygon
                key={`threat-${t.hex.col}-${t.hex.row}`}
                points={hexPoints(t.hex, 0.88)}
                fill={
                  t.threat === "steal" ? "url(#stealHatch)" : "url(#tieHatch)"
                }
                stroke={t.threat === "steal" ? "#fb7185" : "#fbbf24"}
                strokeWidth={1.4}
                strokeDasharray={t.threat === "tie" ? "4 4" : undefined}
                opacity={t.threat === "steal" ? 0.8 : 0.55}
              />
            ))}
        </g>
      )}

      {/* Max range ring — the sweet spot */}
      <g filter="url(#goldGlow)">
        {tiles
          .filter((t) => t.isMax && t.highlight)
          .map((t) => (
            <polygon
              key={`max-${t.hex.col}-${t.hex.row}`}
              points={hexPoints(t.hex, 0.92)}
              fill="none"
              stroke="#facc15"
              strokeWidth={2.6}
              className="animate-range-pulse"
            />
          ))}
      </g>

      {/* Ideal positions for the picked target */}
      <g>
        {tiles
          .filter((t) => t.isIdeal && !t.isPesci)
          .map((t) => {
            const { x, y } = hexToPixel(t.hex);
            return (
              <g key={`ideal-${t.hex.col}-${t.hex.row}`}>
                <polygon
                  points={hexPoints(t.hex, 0.8)}
                  fill="rgba(250, 204, 21, 0.14)"
                  stroke="#fde047"
                  strokeWidth={2}
                  strokeDasharray="7 5"
                  className={awaitingTarget ? "" : "animate-range-pulse"}
                />
                {awaitingTarget ? null : (
                  <g
                    stroke="#fde047"
                    strokeWidth={1.4}
                    fill="none"
                    opacity={0.85}
                  >
                    <circle cx={x} cy={y - 1} r={13} />
                    <line x1={x - 20} y1={y - 1} x2={x - 16} y2={y - 1} />
                    <line x1={x + 16} y1={y - 1} x2={x + 20} y2={y - 1} />
                  </g>
                )}
              </g>
            );
          })}
      </g>

      {/* Enemy line-up — the hooked ones wear the glowing hook */}
      <g>
        {tiles
          .filter((t) => t.enemy !== "none")
          .map((t) => {
            const style = ENEMY_STYLE[t.enemy as keyof typeof ENEMY_STYLE];
            const hooked = t.enemy === "hooked";
            const { x, y } = hexToPixel(t.hex);

            return (
              <g key={`enemy-${t.hex.col}-${t.hex.row}`}>
                {/* Inside the max-range ring, so both stay readable. */}
                <polygon
                  points={hexPoints(t.hex, 0.86)}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={hooked ? 2.8 : 2}
                  strokeDasharray={style.dashed ? "5 5" : undefined}
                />
                <EnemyToken
                  cx={x}
                  cy={y - 4}
                  height={HEX_H * 0.5}
                  color={style.token}
                />
                {hooked && (
                  /* Badged into the corner rather than over the token, so the
                     body underneath the hook stays visible. */
                  <g filter="url(#goldGlow)" className="animate-range-pulse">
                    <HookToken
                      cx={x + HEX_W * 0.25}
                      cy={y - HEX_H * 0.22}
                      height={HEX_H * 0.42}
                    />
                  </g>
                )}
                {t.dist !== null && (
                  <text
                    x={x}
                    y={y + HEX_H * 0.38}
                    textAnchor="middle"
                    className="font-mono pointer-events-none"
                    fontSize={13}
                    fontWeight={hooked ? 700 : 400}
                    fill={hooked ? "#fde047" : style.token}
                  >
                    {t.dist}
                  </text>
                )}
              </g>
            );
          })}
      </g>

      {/* Target marker */}
      {target && (
        <g>
          <polygon
            points={hexPoints(target, 0.96)}
            fill="rgba(244, 114, 182, 0.16)"
            stroke="#f472b6"
            strokeWidth={2.8}
            filter="url(#softGlow)"
          />
        </g>
      )}

      {/* Pull path */}
      {showPull && pull.length > 1 && (
        <g>
          <polyline
            points={pullLine}
            fill="none"
            stroke="#fcd34d"
            strokeWidth={2.4}
            strokeDasharray="8 6"
            strokeLinecap="round"
            opacity={0.85}
            className="animate-reel"
          />
          {landing && (
            <g>
              <polygon
                points={hexPoints(landing, 0.72)}
                fill="rgba(252, 211, 77, 0.16)"
                stroke="#fcd34d"
                strokeWidth={1.8}
                strokeDasharray="4 4"
              />
              {/* A ghost of the target, showing where it is dragged to. */}
              <g opacity={0.5}>
                <HookToken
                  cx={hexToPixel(landing).x}
                  cy={hexToPixel(landing).y}
                  height={HEX_H * 0.5}
                />
              </g>
            </g>
          )}
        </g>
      )}

      {/* Distance labels */}
      <g className="font-mono pointer-events-none">
        {tiles.map((t) => {
          const { x, y } = hexToPixel(t.hex);
          // Occupied tiles carry their own marker (and, for enemies, their own
          // distance beneath it) — a centred label would sit under the token.
          if (t.isPesci || t.isTarget || t.enemy !== "none") return null;

          // Distances are only worth reading where an enemy could stand, so
          // everything else keeps its name and the board stays legible.
          if (!t.highlight) {
            return (
              <text
                key={`name-${t.hex.col}-${t.hex.row}`}
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize="13"
                fill={
                  t.dist === null || t.inRange
                    ? "rgba(148, 163, 184, 0.45)"
                    : "rgba(148, 163, 184, 0.25)"
                }
              >
                {hexName(t.hex)}
              </text>
            );
          }

          return (
            <text
              key={`dist-${t.hex.col}-${t.hex.row}`}
              x={x}
              y={y + (t.isMax ? 6 : 5)}
              textAnchor="middle"
              fontSize={t.isMax ? 18 : 14}
              fontWeight={t.isMax ? 700 : 400}
              fill={t.isMax ? "#fde047" : "rgba(203, 213, 225, 0.6)"}
            >
              {t.dist}
            </text>
          );
        })}
      </g>

      {/* Tokens */}
      {target &&
        (() => {
          const { x, y } = hexToPixel(target);
          return <HookToken cx={x} cy={y} height={HEX_H * 0.86} />;
        })()}

      {pesci &&
        (() => {
          const { x, y } = hexToPixel(pesci);
          return (
            <g filter="url(#softGlow)">
              <PesciToken
                cx={x}
                cy={y}
                width={HEX_W * 0.88}
                height={HEX_H * 0.88}
              />
            </g>
          );
        })()}

      {/* Hover + interaction layer */}
      <g>
        {tiles.map((t) => {
          const isHovered = sameHex(hovered, t.hex);
          const playable = t.action !== "none";
          // A playable tile with nothing to do is the enemy line-up being
          // full — the middle ground is the only other dead tile.
          const blocked =
            t.zone === "neutral"
              ? "neutral middle, nobody stands here"
              : "enemy line-up is full, remove one first";
          const label = [
            hexName(t.hex),
            playable ? `${t.zone} side` : blocked,
            t.dist === null
              ? null
              : t.isPesci
                ? "Pesci is here"
                : `${t.dist} tiles from Pesci`,
            t.isTarget ? "selected target" : null,
            t.isIdeal ? "ideal position" : null,
            ENEMY_HINT[t.enemy],
            ACTION_HINT[t.action],
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <polygon
              key={`hit-${t.hex.col}-${t.hex.row}`}
              points={hexPoints(t.hex)}
              fill="transparent"
              stroke={
                isHovered && playable ? ACTION_STROKE[t.action] : "transparent"
              }
              strokeWidth={2}
              tabIndex={playable ? 0 : undefined}
              role={playable ? "button" : undefined}
              aria-label={label}
              aria-disabled={playable ? undefined : true}
              className={
                playable
                  ? "cursor-pointer outline-none focus-visible:stroke-white"
                  : "cursor-not-allowed outline-none"
              }
              onClick={playable ? () => onPick(t.hex) : undefined}
              onKeyDown={
                playable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onPick(t.hex);
                      }
                    }
                  : undefined
              }
              onMouseEnter={() => onHover(t.hex)}
              onMouseLeave={() => onHover(null)}
              onFocus={playable ? () => onHover(t.hex) : undefined}
              onBlur={playable ? () => onHover(null) : undefined}
            >
              <title>{label}</title>
            </polygon>
          );
        })}
      </g>
    </svg>
  );
}
