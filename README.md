# Pesci's Bizarre Fishing Simulator

A range planner for Pesci's **Fisher Man** ultimate in *JoJo's Bizarre Adventure: Golden Spirit*.

> Pesci hurls a fishing hook at the target, dealing damage equal to 1400% of Attack to **the furthest enemy within 6 tiles** 1 time. While channeling this skill, Pesci pulls the target toward him by 1 tile 1 time per second. This skill lasts for 3 seconds, and the target remains Stunned throughout this duration.

The hook picks its own victim — always the *furthest* body inside 6 tiles — so the only way to aim it is to stand somewhere that makes the enemy you want the furthest one. This app lets you work that out on the board instead of in the middle of a match.

## The two modes

**Place Pesci** — drop him on any tile, on either half. Every tile on the *opposite* half gets its distance, the ones within 6 light up, and the max-range ring (exactly 6 tiles) is highlighted in gold; tiles past 6 keep their number in dim type, so you can see exactly how far out of reach they are. Only the far half is shaded, because that's the only place an enemy can stand — and it keeps the two halves apart at a glance. Click his tile again to pick him back up.

Once he's down, the far half becomes the enemy line-up: click up to 5 tiles to stand bodies there, and click one again to take them off. Bodies the hook can't reach are drawn dashed and grey. Whoever the hook would actually grab — the furthest of them, the rule the whole app is about — gets a gold ring and a glowing hook over their head. Several of them glow when they tie for furthest, because that's exactly when the game picks at random. His own half still moves Pesci, so you can shuffle him around a fixed line-up and watch the hook change its mind.

**Pick a target** — click the enemy you want on the hook. The gold tiles are every position that puts them as far away as the hook can reach. Click one to place Pesci and the board switches to the full range view, keeping the target and the other ideal positions highlighted so you can hop between them. Placing him anywhere else works too, if you want to see how much a worse angle costs you.

In target mode the board also shows:

- **Steal warnings** — tiles further from Pesci than your mark. An enemy standing on one of them takes the hook instead. At true max range this set is empty, which is exactly why max range is the clean cast.
- **Ties** — tiles at the same distance as your mark, where the pick becomes a coin flip.
- **The reel-in path** — the tiles the target gets dragged across during the 3-second channel, and where it ends up. Off by default: the drag is what happens *after* the cast lands, so it's noise while you're still working out where to stand.

## The scenes

The game has six PvP scenes, and they are not just backdrops: every one has its own deployment zones, laid out differently and separated by a different amount of open ground. The same cast that sits at max range on one field is out of the hook's reach on the next, which is the whole reason the picker exists.

Each one is traced off a screenshot of its deployment view:

| Scene | Field | Deploy tiles | Opposing tiles sit |
| --- | --- | --- | --- |
| Night Pasture | 7×5 | 11 v 11 | 2–6 apart |
| Snowbound Lodge | 9×5 | 11 v 11 | 4–8 apart |
| Desert Mesa | 7×5 | 10 v 10 | 1–8 apart |
| Old Town Street | 8×5 | 11 v 11 | 4–8 apart |
| Monument Plaza | 8×5 | 11 v 11 | 2–8 apart |
| River Delta | 6×5 | 12 v 9 | 1–5 apart |

Night Pasture opens the app: it's the board the app had before the scenes were selectable. Note the first two rows — Night Pasture and Snowbound Lodge have *identical* deploy zones and play nothing alike, because the gap between the halves is two columns on one and four on the other. Zone shape doesn't tell you a scene; the gap does.

Night Pasture and River Delta are the only fields where nothing is ever out of range, so the only question on them is who is furthest. Everywhere else the hook genuinely fails to reach the back of the enemy line. River Delta is also the odd one out for shape: its halves are lopsided, twelve tiles against nine, where the other five are point-symmetric.

The scene names are descriptive — the in-game picker shows the artwork, not a name. The mini-maps are cropped out of that picker and live in `public/maps/`.

## The board model

Pointy-top hexes in an odd-r offset layout: odd rows sit half a tile to the right, which is what makes the boundary between the halves zig-zag in game.

Between the two deploy zones is the neutral middle ground. Nothing deploys there, so those tiles can't be clicked, but they still count for distance and the hook drags its catch back across them. A screenshot only shows the deploy tiles, so the middle is worked out from them: each row runs from its leftmost deploy tile to its rightmost, and whatever isn't a deploy tile inside that run is neutral. That fills the gap between the halves and the holes *within* a half that several scenes have — Desert Mesa's two outposts sit alone in no-man's land. You can hide the middle ground from Options if you'd rather see the deploy zones on their own; it's a drawing choice and changes no distance.

Distances are hex steps, converted to cube coordinates and measured straight across the field.

Two consequences worth knowing. Not every tile has another tile exactly 6 steps away, so for some targets the app falls back to the furthest position that does exist and says so. And on four of the six fields plenty of pairs sit outside the hook's reach entirely — out-of-range enemies show up dashed and grey, and the tiles past 6 keep their distance in dim type so you can see how far past.

## Using the real game art

The board draws hand-made SVG stand-ins for Pesci's portrait and the Fisher Man icon. Drop the real images into `public/` and they get picked up automatically, no code change:

| File | Used for |
| --- | --- |
| `public/pesci-card.png` | the selected position marker |
| `public/pesci-hook.png` | the hook — on the target, and on whoever it would grab |

Pesci's marker is clipped to the hex, so a portrait crop works better than a full card — the image is scaled to cover the tile and anything outside the hexagon is trimmed.

## Icons

The app ships its own mark — a gold hook over a honeycomb, with Fisher Man's tentacles around it — as a favicon, an installable home-screen icon and a social preview card. Added to a phone's home screen it opens standalone, without browser chrome.

Two hand-written SVGs are the masters: `app/icon.svg` is the simplified cut that stays readable at 16px, and `public/icons/mark.svg` is the detailed one. Everything else (`app/favicon.ico`, `app/apple-icon.png`, the `public/icons/icon-*.png` set and `app/opengraph-image.png`) is rasterised from those two and checked in.

`metadataBase` in `app/layout.tsx` pins the canonical host that social previews resolve against — change it there if the site moves.

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

Three things worth knowing before you touch the board:

- There is no global board. `app/lib/hex.ts` defines the `Board` type and the geometry that operates on one; `app/lib/maps.ts` holds the six scenes and builds a board for each from its deploy zones. Everything downstream takes the active board as an argument.
- The grid is not a rectangle and the middle ground is unplayable. `onBoard()` is membership in the tile list, not a bounds check, and `isPlayable()` is what excludes the middle.
- What a click does is decided in one place, `actionFor()` in `app/lib/board.ts`. Both the click handler and the per-tile accessibility labels call it, so change the rule there rather than in the component and the two stay in agreement.

Adding or correcting a scene is one `makeBoard(...)` call in `app/lib/maps.ts` — see the notes at the top of that file for how a layout is read off a deployment screenshot.

---

Fan-made planning tool, not affiliated with the game or its publisher.
