"use client";

import { useEffect, useState } from "react";

/**
 * Board tokens.
 *
 * Both tokens prefer a real screenshot dropped into `public/` and fall back to
 * a hand-drawn SVG stand-in when the file isn't there, so the app works out of
 * the box without shipping any game art:
 *
 *   public/pesci-card.png  → the selected position marker
 *   public/pesci-hook.png  → the selected target marker
 */
export const PESCI_CARD_SRC = "/pesci-card.png";
export const HOOK_ICON_SRC = "/pesci-hook.png";

const probes = new Map<string, Promise<boolean>>();

function probe(src: string): Promise<boolean> {
  let pending = probes.get(src);
  if (!pending) {
    pending = new Promise<boolean>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(img.naturalWidth > 0);
      img.onerror = () => resolve(false);
      img.src = src;
    });
    probes.set(src, pending);
  }
  return pending;
}

/** True once we know a custom asset exists at `src`. */
export function useCustomAsset(src: string): boolean {
  const [found, setFound] = useState(false);

  useEffect(() => {
    let alive = true;
    probe(src).then((ok) => {
      if (alive) setFound(ok);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  return found;
}

type TokenProps = {
  /** Centre of the token, in board coordinates. */
  cx: number;
  cy: number;
  /** Height of the token, in board units. */
  height: number;
};

/* ------------------------------------------------------------------ */
/* Pesci's portrait — marks the selected position                      */
/* ------------------------------------------------------------------ */

/**
 * A pointy-top hexagon filling a 100x100 viewBox. Rendered into a box the size
 * of a board hex it lands exactly on the tile, squash and all, so the token
 * sits *in* the grid instead of standing on top of it.
 */
const HEX_PATH = "M50 0 L100 25 L100 75 L50 100 L0 75 L0 25 Z";

export function PesciToken({
  cx,
  cy,
  width,
  height,
}: TokenProps & { width: number }) {
  const custom = useCustomAsset(PESCI_CARD_SRC);
  const x = cx - width / 2;
  const y = cy - height / 2;

  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={height}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="pesciHexClip">
          <path d={HEX_PATH} />
        </clipPath>
        <linearGradient id="cardBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7d2230" />
          <stop offset="55%" stopColor="#4a1622" />
          <stop offset="100%" stopColor="#2a0d16" />
        </linearGradient>
        <linearGradient id="cardFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7dc8a" />
          <stop offset="45%" stopColor="#c8992f" />
          <stop offset="100%" stopColor="#f7dc8a" />
        </linearGradient>
      </defs>

      <g clipPath="url(#pesciHexClip)">
        {custom ? (
          <image
            href={PESCI_CARD_SRC}
            x="0"
            y="0"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <>
            <rect width="100" height="100" fill="url(#cardBody)" />

            {/* Shoulders */}
            <path d="M8 100 Q50 66 92 100 Z" fill="#1d2a3a" />
            <path d="M20 100 Q50 76 80 100 Z" fill="#2f4257" />

            {/* Head + Pesci's unmistakable profile */}
            <path
              d="M36 40 Q35 25 50 24 Q65 25 65 41 L65 59 Q65 74 50 74 Q35 74 35 58 Z"
              fill="#d9a271"
            />
            <path d="M35 49 L24 56 L35 61 Z" fill="#d9a271" />
            <path d="M35 49 L24 56 L35 61 Z" fill="#000" opacity="0.12" />

            {/* Hair */}
            <path
              d="M32 38 Q31 18 50 17 Q69 18 68 38 Q63 27 50 27 Q37 27 32 38 Z"
              fill="#3f7d3a"
            />
            <path d="M39 19 L43 8 L48 19 Z" fill="#4f9a44" />
            <path d="M48 19 L53 7 L58 20 Z" fill="#4f9a44" />
            <path d="M33 26 L32 14 L41 22 Z" fill="#4f9a44" />
            <path d="M63 23 L69 13 L69 27 Z" fill="#4f9a44" />

            {/* Eyes */}
            <ellipse cx="43" cy="46" rx="3" ry="3.4" fill="#fff" />
            <ellipse cx="58" cy="46" rx="3" ry="3.4" fill="#fff" />
            <circle cx="43.5" cy="46.4" r="1.6" fill="#20130d" />
            <circle cx="57.5" cy="46.4" r="1.6" fill="#20130d" />
            <path
              d="M38 40 L47 42 M53 42 L62 40"
              stroke="#20130d"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M43 65 Q50 62 57 65"
              stroke="#8c5b3e"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
            />
          </>
        )}
      </g>

      {/* Gold rim, drawn last so it sits over the portrait */}
      <path
        d={HEX_PATH}
        fill="none"
        stroke="url(#cardFrame)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Fisher Man's hook — marks the target and whoever it would grab      */
/* ------------------------------------------------------------------ */

/**
 * Plain line-art on a flat disc, on purpose: the hook is drawn small, up to
 * six at a time, and always on top of a tile that already carries a range
 * ring and a distance label. A busy badge turns into mush at that size.
 */
export function HookToken({
  cx,
  cy,
  height,
  color = "#fcd34d",
}: TokenProps & { color?: string }) {
  const custom = useCustomAsset(HOOK_ICON_SRC);
  const x = cx - height / 2;
  const y = cy - height / 2;

  if (custom) {
    return (
      <image
        href={HOOK_ICON_SRC}
        x={x}
        y={y}
        width={height}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none"
      />
    );
  }

  return (
    <svg
      x={x}
      y={y}
      width={height}
      height={height}
      viewBox="0 0 100 100"
      className="pointer-events-none"
      aria-hidden="true"
    >
      {/* Just enough backdrop to keep the line readable on any tile. */}
      <circle cx="50" cy="50" r="46" fill="#080b10" opacity="0.55" />
      <g
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Eyelet, shank, bend, point. */}
        <circle cx="57" cy="21" r="8" strokeWidth="5" />
        <g strokeWidth="7">
          <path d="M57 29 L57 52" />
          <path d="M57 52 Q57 76 43 76 Q29 76 29 61 Q29 51 39 49" />
          <path d="M39 49 L35 37" />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Enemy standee — a body the hook could pick                          */
/* ------------------------------------------------------------------ */

export function EnemyToken({
  cx,
  cy,
  height,
  color = "#fb7185",
}: TokenProps & { color?: string }) {
  const x = cx - height / 2;
  const y = cy - height / 2;

  return (
    <svg
      x={x}
      y={y}
      width={height}
      height={height}
      viewBox="0 0 100 100"
      className="pointer-events-none"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" fill="#0b0d13" opacity="0.75" />
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke={color}
        strokeWidth="4"
        opacity="0.75"
      />
      <circle cx="50" cy="37" r="14" fill={color} />
      <path d="M20 84 Q24 57 50 57 Q76 57 80 84 Z" fill={color} />
    </svg>
  );
}
