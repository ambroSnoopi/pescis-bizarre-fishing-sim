<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## What this is

A range planner for Pesci's *Fisher Man* ultimate in JoJo's Golden Spirit. The ability hits **the furthest enemy within 6 tiles** — you never pick the victim, so the only way to aim is to stand where your mark *is* the furthest one. The app exists to work that out on a board instead of mid-match.

The game has six PvP scenes and their deployment zones are all different shapes and distances apart, so the board is selectable: `app/lib/maps.ts` carries one traced layout per scene. Night Pasture is the one the app shipped with before that, and it opens the app.

Next.js App Router, one static prerendered page, no backend, no env vars.

## Commands

```bash
npm run dev      # dev server on :3000
npm run build    # production build
npm run start    # serve the build
npm run lint     # eslint
npx tsc --noEmit # types — NOT covered by `npm run lint`
```

**There is no test suite.** Run `npx tsc --noEmit`, `npm run lint` and `npm run build` before pushing. Behavioural changes have been verified by driving the dev server with throwaway Playwright scripts, run from outside the project — Playwright is *not* a project dependency, so never import it from `app/`, and check it's actually available before reaching for it.

Pure board logic is testable without a browser — `app/lib/*.ts` has no React or DOM in it, so a scratch script with `node --experimental-strip-types` importing `app/lib/hex.ts` works for checking geometry claims. To pull in `maps.ts` as well you have to copy both files somewhere and add the `.ts` extension to its `./hex` import, which Node's ESM resolver wants and the bundler does not. Type stripping also can't tell a type from a value, which is why the cross-module type imports are written `import { type Board, … }`.

`main` is protected — every change goes through a pull request.

## Architecture

State lives in one place and flows one way:

```
Simulator.tsx  ──Board + Selection──▶  deriveBoard()  ──TileView[]──▶  Board.tsx
   ▲                                   (lib/board.ts)                  (pure SVG)
   └──────────── onPick / onHover ───────────────────────────────────────────┘
```

- `app/components/Simulator.tsx` — every piece of React state, plus all the surrounding panels (readout, options, legend, footer).
- `app/lib/maps.ts` — the six PvP scenes as data: name, mini-map, and the two deploy zones each one is traced from.
- `app/lib/board.ts` — turns a `Board` + `Selection` into one `TileView` per tile. No React.
- `app/components/Board.tsx` — renders `TileView[]` as SVG. Holds no state; reports clicks and hovers upward.
- `app/components/ScenePicker.tsx` — the mini-map strip that switches scene.
- `app/lib/hex.ts` — the `Board` type and all geometry. No React.
- `app/components/tokens.tsx` — Pesci, the hook, and enemy markers.

`Selection` (`{ mode, pesci, target, enemies }`) is the whole user-visible state bar the scene, and both `actionFor()` and `deriveBoard()` take it alongside the active `Board`.

### Tracing a scene

A layout comes from a screenshot of that scene's deployment view: shaded hexes are your half, red ones the enemy's. Read the column index of every hex row by row (top row first), remembering that odd rows sit half a tile right, then shift so the leftmost column is 0 — that pair of arrays is the whole map entry, and `makeBoard` works out the middle ground and the field size from it. `public/maps/*.webp` are the mini-maps from the in-game scene list, cropped inside their frames.

### The two modes are not symmetric

**Place mode** is two-phase. With no Pesci on the board, a click places him. Once he's down, his own half moves him and **the far half becomes the enemy line-up** — click a shaded tile to stand a body there, click it again to remove, capped at `MAX_ENEMIES` (5). `deriveBoard` then works out which of them the hook takes.

**Target mode** is the inverse: you mark one enemy first, and the app shows every position that makes them the furthest. The mark's own half re-marks, the far half places Pesci, and clicking the hook itself clears everything.

### Things that will bite you

**`actionFor()` in `board.ts` is the single source of truth for what a click does.** Both `handlePick` in `Simulator.tsx` and the `action` field on every `TileView` call it — that's what keeps behaviour and accessibility labels from drifting apart. Change click semantics there, never in the component.

**The enemy line-up has invariants the handler must maintain.** Enemies only ever stand on the half opposite Pesci, so moving him filters the list to those still on the far side, and lifting him clears it entirely (without Pesci there is no "other half"). If you add a path that changes `pesci`, it has to preserve that.

**`hooked` is an array, not a single hex.** Several enemies tie for furthest quite often, and the game picks among them at random — that tie is a headline result, not an edge case, so don't collapse it to one.

**Range checks are load-bearing now.** Four scenes span more than 6 tiles across the halves (snow and street 4–8, plaza 2–8, desert 1–8), so `inRange`, `targetInRange` and the `out-of-range` enemy state all come out false regularly and render. Night Pasture (2–6) and River Delta (1–5) are the exceptions — nothing on either is ever out of reach, which is the old "the only question is who is furthest" reading. Night Pasture is also the default scene, so a bug you can't reproduce may just need a different one; check which scene the report was on first.

**The board is a per-scene value, not a global.** `Board` (`hex.ts`) is `{ cols, rows, tiles, zones, span }` and every board function takes one: `onBoard`, `zoneOf`, `isPlayable`, `oppositeHalves`, `neighbors`, `pullPath`, `boardWidth`/`boardHeight`. `onBoard()` is membership in `tiles`, *not* a bounds check — boards have holes. Scenes build theirs with `makeBoard(ally, enemy)` in `maps.ts`, where each zone is written as one array of column indices per row — the shape it gets traced off a screenshot in. Nothing reads a module-level board; don't reintroduce one.

**The middle ground is inferred, not traced.** A screenshot only shows the deploy tiles — the game draws plain ground in between — so `makeBoard` fills it in: every row runs from its leftmost deploy tile to its rightmost, and whatever isn't a deploy tile inside that run is `"neutral"`. That covers the gap between the halves *and* the holes inside a half that several scenes have (desert's B2/E2, River Delta's C3), without inventing tiles off the ends of a row. On Night Pasture it reproduces the seven tiles the hand-written board used to list, D1/C2/D2/D3/C4/D4/D5, exactly.

Neutral tiles are drawn and they carry distance and the reel-in, but nobody deploys there: `isPlayable()` is the gate, and `oppositeHalves()` already excludes them. `showNeutral` in `Simulator.tsx` only decides whether they are *drawn* — `Board.tsx` filters them out of every layer at once — so it can never change a distance or a verdict.

**Zone shapes are per-scene and not always symmetric.** Five scenes are point-symmetric — rotate 180° about the middle and one half lands on the other — and River Delta is not: twelve tiles on the shaded half against nine on the enemy's. Don't "fix" that by mirroring; it is traced from the screenshot.

**Same shape, different scene.** Night Pasture and Snowbound Lodge have identical deploy zones and play nothing alike — two columns of middle ground against four. Zone shape alone doesn't identify a scene; the gap does.

**Two coordinate systems.** Internally tiles are 0-based `{col, row}` in an odd-r offset layout. `hexName()` renders them as a column letter plus `row + 1`, so the **C2** you see in the UI is `{col: 2, row: 1}`. Off-by-one here is the most common mistake in this repo. Fields run up to nine columns wide, so names reach `I`.

**Range shading covers only the half opposite Pesci** (the `highlight` flag) — the only side an enemy can stand on, and it keeps the halves visually distinct once he's down. `counts.inRange` and `counts.maxRange` are counted over that same set, so the numbers match what's drawn rather than the whole board. `farHalf` is the wider flag: that half regardless of range, which is what decides whether a tile shows its distance or its name.

**Not every tile has one exactly 6 steps away.** `deriveBoard` falls back to the furthest reachable distance and reports it as `idealDist`, and the UI says so. Don't assume `idealDist === MAX_RANGE` — on River Delta the best cast is 3–5 depending on the mark, and `idealDist` is `0` if a scene ever puts a target out of reach of the whole opposite half (none of the six do, but the branch is there).

### Geometry

Pointy-top hexes, odd-r offset (odd rows shift half a tile right — that's what makes the boundary zig-zag as it does in game). `Y_SQUASH` flattens everything vertically to fake the game's camera tilt, so `hexPoints()` is squashed by it and `HEX_W !== HEX_H`. Distances convert offset → axial → cube.

The viewBox comes from `boardWidth`/`boardHeight`, so a nine-column scene draws a wider SVG than a six-column one. The `<svg>` carries a per-column `minWidth` and its panel scrolls: scaled to fit a phone, the widest fields shrink the distance labels to a few pixels.

### Tokens

`PesciToken` and `HookToken` prefer real art at `public/pesci-card.png` and `public/pesci-hook.png`, probing for it at runtime via `useCustomAsset` and falling back to inline hand-drawn SVG. Pesci's marker is clipped to a hexagon sized to the tile, so custom art is cropped to that shape — a portrait crop suits it better than a full card.

## Styling

Tailwind v4, configured in `app/globals.css` via `@theme` — there is no `tailwind.config`. Custom animations (`animate-range-pulse`, `animate-reel`) live there, as does the `prefers-reduced-motion` opt-out.

The page background is a body-level gradient that must keep `background-repeat: no-repeat`. A propagated body background is positioned against the *root* box, which is one viewport tall, so without it the gradient tiles down any longer page — which is what it used to do on mobile.
