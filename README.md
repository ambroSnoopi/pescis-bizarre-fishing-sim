# Pesci's Bizarre Fishing Simulator

A range planner for Pesci's **Fisher Man** ultimate in *JoJo's Bizarre Adventure: Golden Spirit*.

> Pesci hurls a fishing hook at the target, dealing damage equal to 1400% of Attack to **the furthest enemy within 6 tiles** 1 time. While channeling this skill, Pesci pulls the target toward him by 1 tile 1 time per second. This skill lasts for 3 seconds, and the target remains Stunned throughout this duration.

The hook picks its own victim — always the *furthest* body inside 6 tiles — so the only way to aim it is to stand somewhere that makes the enemy you want the furthest one. This app lets you work that out on the board instead of in the middle of a match.

## The two modes

**1 · Place Pesci** — drop him on any tile, on either half. Every tile within 6 lights up with its distance, and the max-range ring (exactly 6 tiles) is highlighted in gold. Click his tile again to pick him back up.

**2 · Pick a target** — click the enemy you want on the hook. The gold tiles are every position that puts them as far away as the hook can reach. Click one to place Pesci and the board switches to the full range view, keeping the target and the other ideal positions highlighted so you can hop between them. Placing him anywhere else works too, if you want to see how much a worse angle costs you.

In target mode the board also shows:

- **Steal warnings** — tiles further from Pesci than your mark. An enemy standing on one of them takes the hook instead. At true max range this set is empty, which is exactly why max range is the clean cast.
- **Ties** — tiles at the same distance as your mark, where the pick becomes a coin flip.
- **The reel-in path** — the tiles the target gets dragged across during the 3-second channel, and where it ends up.

## The board model

Seven columns by five rows of pointy-top hexes in an odd-r offset layout: odd rows sit half a tile to the right, which is what makes the boundary between the halves zig-zag in game. Columns A–C are the ally half, column D is the neutral middle ground and columns E–G are the enemy half. Distances are hex steps (converted to cube coordinates), so the board's longest span is 8 tiles and plenty of pairs sit outside the hook's reach.

One consequence worth knowing: not every tile has another tile exactly 6 steps away. For targets near the middle, the app falls back to the furthest position that does exist and says so.

## Using the real game art

The board draws hand-made SVG stand-ins for Pesci's card and the Fisher Man icon. Drop the real images into `public/` and they get picked up automatically, no code change:

| File | Used for |
| --- | --- |
| `public/pesci-card.png` | the selected position marker |
| `public/pesci-hook.png` | the selected target marker |

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

---

Fan-made planning tool, not affiliated with the game or its publisher.
