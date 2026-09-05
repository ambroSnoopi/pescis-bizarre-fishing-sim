# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A range planner for Pesci's *Fisher Man* ultimate in JoJo's Golden Spirit. The ability hits **the furthest enemy within 6 tiles** — you never pick the victim, so the only way to aim is to stand where your mark *is* the furthest one. The app exists to work that out on a board instead of mid-match.

Next.js App Router, one static prerendered page, no backend, no env vars.

## Commands

```bash
npm run dev      # dev server on :3000
npm run build    # production build
npm run start    # serve the build
npm run lint     # eslint
npx tsc --noEmit # types — NOT covered by `npm run lint`
```

**There is no test suite.** Run `npx tsc --noEmit`, `npm run lint` and `npm run build` before pushing. Behavioural changes have been verified by driving the dev server with throwaway Playwright scripts; Playwright and Chromium exist in the Claude Code environment but are *not* project dependencies, so never import them from `app/`.

Pure board logic is testable without a browser — `app/lib/*.ts` has no React or DOM in it, so a scratch script with `node --experimental-strip-types` importing `app/lib/hex.ts` works for checking geometry claims.

`main` is protected — every change goes through a pull request.

## Architecture

State lives in one place and flows one way:

```
Simulator.tsx  ──Selection──▶  deriveBoard()  ──TileView[]──▶  Board.tsx
   ▲                           (lib/board.ts)                  (pure SVG)
   └──────────── onPick / onHover ──────────────────────────────────┘
```

- `app/components/Simulator.tsx` — every piece of React state, plus all the surrounding panels (readout, options, legend, footer).
- `app/lib/board.ts` — turns a `Selection` into one `TileView` per tile. No React.
- `app/components/Board.tsx` — renders `TileView[]` as SVG. Holds no state; reports clicks and hovers upward.
- `app/lib/hex.ts` — the board itself and all geometry. No React.
- `app/components/tokens.tsx` — Pesci, the hook, and enemy markers.

`Selection` (`{ mode, pesci, target, enemies }`) is the whole user-visible state and is what both `actionFor()` and `deriveBoard()` take.

### The two modes are not symmetric

**Place mode** is two-phase. With no Pesci on the board, a click places him. Once he's down, his own half moves him and **the far half becomes the enemy line-up** — click a shaded tile to stand a body there, click it again to remove, capped at `MAX_ENEMIES` (5). `deriveBoard` then works out which of them the hook takes.

**Target mode** is the inverse: you mark one enemy first, and the app shows every position that makes them the furthest. The mark's own half re-marks, the far half places Pesci, and clicking the hook itself clears everything.

### Things that will bite you

**`actionFor()` in `board.ts` is the single source of truth for what a click does.** Both `handlePick` in `Simulator.tsx` and the `action` field on every `TileView` call it — that's what keeps behaviour and accessibility labels from drifting apart. Change click semantics there, never in the component.

**The enemy line-up has invariants the handler must maintain.** Enemies only ever stand on the half opposite Pesci, so moving him filters the list to those still on the far side, and lifting him clears it entirely (without Pesci there is no "other half"). If you add a path that changes `pesci`, it has to preserve that.

**`hooked` is an array, not a single hex.** Several enemies tie for furthest quite often, and the game picks among them at random — that tie is a headline result, not an edge case, so don't collapse it to one.

**On the current board nothing is out of range — but don't design around that.** The longest span anywhere on this map is 6 tiles, and the furthest cross-half pair (B1–G3) is exactly 6, so today `inRange`, `targetInRange` and the `out-of-range` enemy state never actually come out false. That's a property of this one map, not of the game: **larger maps are the next feature**, and on any board spanning more than 6 tiles these checks start doing real work and `out-of-range` starts rendering. Treat them as load-bearing. The reason to know this is the opposite of the usual one — not "why is this dead code" but "don't be surprised that you can't reproduce an out-of-range state on the default map."

**The board is not a rectangle.** `BOARD` in `hex.ts` is a hand-written list of 29 tiles with the corners cut (no A1, A5, G1, G2, G4, G5). `onBoard()` is set membership in `BOARD`, *not* a bounds check — anything walking the grid (`pullPath`, `neighbors`) depends on that. There is no width/height constant, and reintroducing one would be wrong: shape comes from the tile list alone.

**`BOARD` is a module-level constant, and multi-map support will have to change that.** Everything downstream reads it directly — `onBoard`, `zoneOf`, `deriveBoard`, and the `BOARD_W`/`BOARD_H` viewBox sizing — so making the map selectable means threading it through rather than swapping a global. Zone membership is currently hard-coded to this map's columns too (`zoneOf`, `isPlayable`), so those become per-map data.

**Two coordinate systems.** Internally tiles are 0-based `{col, row}` in an odd-r offset layout. `hexName()` renders them as a column letter plus `row + 1`, so the **C2** you see in the UI is `{col: 2, row: 1}`. Off-by-one here is the most common mistake in this repo.

**Neutral tiles are unplayable.** Column D *plus* the C2 and C4 notches. Nothing deploys there, so they aren't buttons and are excluded from suggestions and threats — but they still count for distance, because the hook flies over them. Use `isPlayable()` / `oppositeHalves()` rather than testing columns by hand.

**Range shading covers only the half opposite Pesci** (the `highlight` flag) — the only side an enemy can stand on, and it keeps the halves visually distinct once he's down. `counts.inRange` and `counts.maxRange` are counted over that same set, so the numbers match what's drawn rather than the whole board.

**Not every tile has one exactly 6 steps away.** `deriveBoard` falls back to the furthest reachable distance and reports it as `idealDist`, and the UI says so. Don't assume `idealDist === MAX_RANGE`.

### Geometry

Pointy-top hexes, odd-r offset (odd rows shift half a tile right — that's what makes the boundary zig-zag as it does in game). `Y_SQUASH` flattens everything vertically to fake the game's camera tilt, so `hexPoints()` is squashed by it and `HEX_W !== HEX_H`. Distances convert offset → axial → cube.

### Tokens

`PesciToken` and `HookToken` prefer real art at `public/pesci-card.png` and `public/pesci-hook.png`, probing for it at runtime via `useCustomAsset` and falling back to inline hand-drawn SVG. Pesci's marker is clipped to a hexagon sized to the tile, so custom art is cropped to that shape — a portrait crop suits it better than a full card.

## Styling

Tailwind v4, configured in `app/globals.css` via `@theme` — there is no `tailwind.config`. Custom animations (`animate-range-pulse`, `animate-reel`) live there, as does the `prefers-reduced-motion` opt-out.

The page background is a body-level gradient that must keep `background-repeat: no-repeat`. A propagated body background is positioned against the *root* box, which is one viewport tall, so without it the gradient tiles down any longer page — which is what it used to do on mobile.
