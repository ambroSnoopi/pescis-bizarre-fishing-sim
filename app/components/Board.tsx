"use client";

import { TileView } from "../lib/board";
import {
  BOARD_H,
  BOARD_W,
  HEX_H,
  Hex,
  MAX_RANGE,
  PAD,
  hexName,
  hexPoints,
  hexToPixel,
  sameHex,
} from "../lib/hex";
import { HookToken, PesciToken } from "./tokens";

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

/** Rings get slightly denser the further out they sit. */
function ringFill(dist: number): string {
  return dist === MAX_RANGE
    ? "rgba(250, 204, 21, 0.26)"
    : `rgba(96, 165, 250, ${(0.05 + dist * 0.022).toFixed(3)})`;
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
      aria-label="Battlefield, 7 by 5 hex grid"
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

      {/* Range rings */}
      <g>
        {tiles
          .filter((t) => t.inRange)
          .map((t) => (
            <polygon
              key={`ring-${t.hex.col}-${t.hex.row}`}
              points={hexPoints(t.hex)}
              fill={ringFill(t.dist as number)}
              stroke="rgba(147, 197, 253, 0.28)"
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
          .filter((t) => t.isMax)
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
          if (t.isPesci || t.isTarget) return null;

          // Tiles Pesci can't reach keep their name, so the board stays
          // readable while you compare positions.
          if (!t.inRange) {
            return (
              <text
                key={`name-${t.hex.col}-${t.hex.row}`}
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize="13"
                fill={
                  t.dist === null
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
              <PesciToken cx={x} cy={y - HEX_H * 0.1} height={HEX_H * 1.5} />
            </g>
          );
        })()}

      {/* Hover + interaction layer */}
      <g>
        {tiles.map((t) => {
          const isHovered = sameHex(hovered, t.hex);
          const label = [
            hexName(t.hex),
            `${t.zone} side`,
            t.dist === null
              ? null
              : t.isPesci
                ? "Pesci is here"
                : `${t.dist} tiles from Pesci`,
            t.isTarget ? "selected target" : null,
            t.isIdeal ? "ideal position" : null,
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <polygon
              key={`hit-${t.hex.col}-${t.hex.row}`}
              points={hexPoints(t.hex)}
              fill="transparent"
              stroke={isHovered ? "rgba(255,255,255,0.85)" : "transparent"}
              strokeWidth={2}
              tabIndex={0}
              role="button"
              aria-label={label}
              className="cursor-pointer outline-none focus-visible:stroke-white"
              onClick={() => onPick(t.hex)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick(t.hex);
                }
              }}
              onMouseEnter={() => onHover(t.hex)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(t.hex)}
              onBlur={() => onHover(null)}
            >
              <title>{label}</title>
            </polygon>
          );
        })}
      </g>
    </svg>
  );
}
