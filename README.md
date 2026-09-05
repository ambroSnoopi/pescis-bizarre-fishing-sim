# Pesci's Bizarre Fishing Simulator

A range planner for Pesci's **Fisher Man** ultimate in *JoJo's Bizarre Adventure: Golden Spirit*.

> Pesci hurls a fishing hook at the target, dealing damage equal to 1400% of Attack to **the furthest enemy within 6 tiles** 1 time. While channeling this skill, Pesci pulls the target toward him by 1 tile 1 time per second. This skill lasts for 3 seconds, and the target remains Stunned throughout this duration.

The hook picks its own victim — always the *furthest* body inside 6 tiles — so the only way to aim it is to stand somewhere that makes the enemy you want the furthest one. This app lets you work that out on the board instead of in the middle of a match.

## The two modes

**Place Pesci** — drop him on any tile, on either half. Every tile within 6 on the *opposite* half lights up with its distance, and the max-range ring (exactly 6 tiles) is highlighted in gold. Only the far half is shaded, because that's the only place an enemy can stand — and it keeps the two halves apart at a glance. Click his tile again to pick him back up.

Once he's down, the far half becomes the enemy line-up: click up to 5 shaded tiles to stand bodies there, and click one again to take them off. Whoever the hook would actually grab — the furthest of them, the rule the whole app is about — gets a gold ring and a glowing hook over their head. Several of them glow when they tie for furthest, because that's exactly when the game picks at random. His own half still moves Pesci, so you can shuffle him around a fixed line-up and watch the hook change its mind.

**Pick a target** — click the enemy you want on the hook. The gold tiles are every position that puts them as far away as the hook can reach. Click one to place Pesci and the board switches to the full range view, keeping the target and the other ideal positions highlighted so you can hop between them. Placing him anywhere else works too, if you want to see how much a worse angle costs you.

In target mode the board also shows:

- **Steal warnings** — tiles further from Pesci than your mark. An enemy standing on one of them takes the hook instead. At true max range this set is empty, which is exactly why max range is the clean cast.
- **Ties** — tiles at the same distance as your mark, where the pick becomes a coin flip.
- **The reel-in path** — the tiles the target gets dragged across during the 3-second channel, and where it ends up. Off by default: the drag is what happens *after* the cast lands, so it's noise while you're still working out where to stand.

## The board model

Pointy-top hexes in an odd-r offset layout: odd rows sit half a tile to the right, which is what makes the boundary between the halves zig-zag in game. It is not a full 7×5 rectangle — the corners are cut, leaving 29 tiles (no A1, A5, G1, G2, G4 or G5).

Columns A–C are the ally half and columns E–G are the enemy half. The neutral middle ground is column D plus the C2 and C4 notches; nothing deploys there, so those tiles can't be clicked, though the hook still flies over them like any other tile.

Distances are hex steps (converted to cube coordinates), and plenty of pairs sit outside the hook's reach. One consequence worth knowing: not every tile has another tile exactly 6 steps away. For targets near the middle, the app falls back to the furthest position that does exist and says so.

The other consequence: *across* the halves nothing is out of reach — no ally tile is more than 6 steps from any enemy tile — so the hook can always take somebody, and the only question is who is furthest. The range check is still in the code, because that's the skill's wording and the board is data.

## Using the real game art

The board draws hand-made SVG stand-ins for Pesci's portrait and the Fisher Man icon. Drop the real images into `public/` and they get picked up automatically, no code change:

| File | Used for |
| --- | --- |
| `public/pesci-card.png` | the selected position marker |
| `public/pesci-hook.png` | the hook — on the target, and on whoever it would grab |

Pesci's marker is clipped to the hex, so a portrait crop works better than a full card — the image is scaled to cover the tile and anything outside the hexagon is trimmed.

## Running it

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Deploying

It's a stock Next.js App Router project with no server-side dependencies, environment variables or external services — the whole page prerenders as static content. Import the repo on [Vercel](https://vercel.com/new) and deploy with the defaults.

## Contributing

This is open source and contributions are welcome — bug reports and feature ideas as much as code.

- [Report a bug](https://github.com/ambroSnoopi/pescis-bizarre-fishing-sim/issues/new?labels=bug)
- [Request a feature](https://github.com/ambroSnoopi/pescis-bizarre-fishing-sim/issues/new?labels=enhancement)

For code changes: `main` is protected, so every change goes through a pull request — branch off `main`, push your branch, and open a PR. Before you do, make sure the checks pass:

```bash
npx tsc --noEmit   # types
npm run lint       # eslint
npm run build      # production build
```

Two things worth knowing before you touch the board:

- The grid is not a rectangle and the middle ground is unplayable. `app/lib/hex.ts` is the single source of truth for which tiles exist (`BOARD`), which are playable (`isPlayable`), and how far apart they are.
- What a click does is decided in one place, `actionFor()` in `app/lib/board.ts`. Both the click handler and the per-tile accessibility labels call it, so change the rule there rather than in the component and the two stay in agreement.

---

Fan-made planning tool, not affiliated with the game or its publisher.
