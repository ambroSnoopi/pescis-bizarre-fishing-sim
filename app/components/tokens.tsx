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
/* Pesci's character card — marks the selected position                */
/* ------------------------------------------------------------------ */

const CARD_RATIO = 0.74;

export function PesciToken({ cx, cy, height }: TokenProps) {
  const custom = useCustomAsset(PESCI_CARD_SRC);
  const width = height * CARD_RATIO;
  const x = cx - width / 2;
  const y = cy - height / 2;

  if (custom) {
    return (
      <image
        href={PESCI_CARD_SRC}
        x={x}
        y={y}
        width={width}
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
      width={width}
      height={height}
      viewBox="0 0 74 100"
      className="pointer-events-none"
      aria-hidden="true"
    >
      <defs>
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

      <rect
        x="1.5"
        y="1.5"
        width="71"
        height="97"
        rx="5"
        fill="url(#cardBody)"
        stroke="url(#cardFrame)"
        strokeWidth="3"
      />
      <rect
        x="5"
        y="5"
        width="64"
        height="90"
        rx="3"
        fill="none"
        stroke="#e8c86a"
        strokeWidth="0.8"
        opacity="0.55"
      />

      {/* Shoulders */}
      <path d="M12 96 Q37 68 62 96 Z" fill="#1d2a3a" />
      <path d="M20 96 Q37 76 54 96 Z" fill="#2f4257" />

      {/* Head + Pesci's unmistakable profile */}
      <path
        d="M27 42 Q26 30 37 29 Q49 30 49 43 L49 58 Q49 70 37 70 Q26 70 26 57 Z"
        fill="#d9a271"
      />
      <path d="M26 50 L17 56 L26 60 Z" fill="#d9a271" />
      <path d="M26 50 L17 56 L26 60 Z" fill="#000" opacity="0.12" />

      {/* Hair */}
      <path
        d="M24 40 Q23 24 37 23 Q52 24 51 40 Q47 31 37 31 Q28 31 24 40 Z"
        fill="#3f7d3a"
      />
      <path d="M30 25 L33 15 L37 25 Z" fill="#4f9a44" />
      <path d="M37 25 L41 14 L45 26 Z" fill="#4f9a44" />
      <path d="M25 30 L24 20 L31 27 Z" fill="#4f9a44" />
      <path d="M48 28 L52 19 L52 31 Z" fill="#4f9a44" />

      {/* Eyes */}
      <ellipse cx="32" cy="47" rx="2.6" ry="3" fill="#fff" />
      <ellipse cx="44" cy="47" rx="2.6" ry="3" fill="#fff" />
      <circle cx="32.4" cy="47.4" r="1.4" fill="#20130d" />
      <circle cx="43.6" cy="47.4" r="1.4" fill="#20130d" />
      <path
        d="M28 42 L36 44 M40 44 L48 42"
        stroke="#20130d"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M31 63 Q37 60 43 63"
        stroke="#8c5b3e"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Level badge */}
      <rect x="6" y="6" width="18" height="11" rx="3" fill="#a4142a" />
      <text
        x="15"
        y="14.6"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="#ffe9a8"
      >
        100
      </text>

      {/* Class pip */}
      <circle cx="63" cy="12" r="6.5" fill="#1b1226" stroke="#e8c86a" />
      <path
        d="M63 15.6 C58.6 12.4 59.4 9.2 61.4 9 C62.4 8.9 63 9.7 63 9.7 C63 9.7 63.6 8.9 64.6 9 C66.6 9.2 67.4 12.4 63 15.6 Z"
        fill="#e8c86a"
      />

      {/* Rank strip */}
      <text
        x="8"
        y="93"
        fontSize="10"
        fontWeight="700"
        fill="#d9a3ff"
        fontStyle="italic"
      >
        S11
      </text>
      <path
        d="M60 82 L62 87.5 L68 87.5 L63.2 91 L65 96.5 L60 93.2 L55 96.5 L56.8 91 L52 87.5 L58 87.5 Z"
        fill="#9be8ff"
        stroke="#e8c86a"
        strokeWidth="0.6"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Fisher Man ultimate icon — marks the selected target                */
/* ------------------------------------------------------------------ */

export function HookToken({ cx, cy, height }: TokenProps) {
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
      <defs>
        <linearGradient id="hookField" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a8818a" />
          <stop offset="50%" stopColor="#7d5c66" />
          <stop offset="100%" stopColor="#4a3540" />
        </linearGradient>
        <clipPath id="hookClip">
          <circle cx="50" cy="50" r="40" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="47" fill="#171327" />
      <circle
        cx="50"
        cy="50"
        r="43"
        fill="none"
        stroke="#3b3355"
        strokeWidth="2"
      />
      <circle cx="50" cy="50" r="40" fill="url(#hookField)" />

      <g clipPath="url(#hookClip)" opacity="0.85">
        <path d="M-10 34 L58 -14 L74 -14 L2 46 Z" fill="#2a2033" opacity="0.6" />
        <path d="M6 78 L88 12 L96 22 L14 92 Z" fill="#f0d089" opacity="0.85" />
        <path d="M22 96 L98 36 L100 48 L34 100 Z" fill="#c9a659" opacity="0.6" />
        <path d="M-4 58 L60 6 L66 12 L2 66 Z" fill="#fbeec2" opacity="0.35" />
      </g>

      <g
        fill="none"
        stroke="#f6d98a"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M63 28 L63 56" />
        <path d="M63 56 Q63 74 47 72 Q34 70 36 58 Q37 50 46 50" />
        <path d="M63 24 L58 20" />
      </g>
      <path
        d="M46 50 L41 44 L50 44 Z"
        fill="#f6d98a"
        stroke="#f6d98a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#20182f" strokeWidth="3" />
    </svg>
  );
}
