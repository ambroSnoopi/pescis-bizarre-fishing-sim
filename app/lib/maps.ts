import { type Board, makeBoard } from "./hex";

/**
 * The six PvP scenes, in the order the game's "Switch Scene" picker lists them.
 *
 * Each layout is traced off a screenshot of that scene's deployment view: the
 * shaded hexes are your half, the red ones the enemy's, and `ally`/`enemy`
 * below list their column indices row by row, top row first.
 *
 * Two things the tracing makes obvious, and that the old single-board version
 * papered over:
 *
 *  - **The halves are far apart, and by a different amount on every scene.**
 *    Nothing is drawn in between — that ground is empty, not neutral tiles —
 *    but it still counts for distance, which is what puts most of these boards
 *    well outside the hook's 6 tiles at their extremes.
 *  - **The two zones are not the same shape.** Four of the five charted scenes
 *    are point-symmetric (rotate 180° about the middle of the field and one
 *    half lands on the other); River Delta simply is not — its shaded half has
 *    twelve tiles to the enemy's nine.
 *
 * Scene names are descriptive. The picker screenshots show the artwork but not
 * the game's own names for them.
 */
export type Scene = {
  id: string;
  name: string;
  /** One line of flavour for the picker. */
  blurb: string;
  /** Mini-map, cropped out of the in-game scene picker. */
  thumb: string;
  /** Null until the scene's deploy zones have been traced off a screenshot. */
  board: Board | null;
};

export type ChartedScene = Scene & { board: Board };

export const SCENES: readonly Scene[] = [
  {
    id: "meadow",
    name: "Night Pasture",
    blurb: "Farmhouses over a dark field",
    thumb: "/maps/meadow.webp",
    // No deployment screenshot for this one yet — the picker lists it so all
    // six scenes are accounted for, but there is nothing to plan on.
    board: null,
  },
  {
    id: "snow",
    name: "Snowbound Lodge",
    blurb: "A lit lodge in the pines",
    thumb: "/maps/snow.webp",
    board: makeBoard(
      [[1, 2], [0, 1], [0, 1, 2], [0, 1], [1, 2]],
      [[6, 7], [6, 7], [6, 7, 8], [6, 7], [6, 7]],
    ),
  },
  {
    id: "desert",
    name: "Desert Mesa",
    blurb: "Cracked flats under sandstone arches",
    thumb: "/maps/desert.webp",
    board: makeBoard(
      [[0, 1], [0, 2], [0, 1], [0, 2], [0, 1]],
      [[5, 6], [3, 5], [5, 6], [3, 5], [5, 6]],
    ),
  },
  {
    id: "street",
    name: "Old Town Street",
    blurb: "Shuttered shopfronts at golden hour",
    thumb: "/maps/street.webp",
    board: makeBoard(
      [[1], [0, 1], [1, 2], [0, 1, 2], [1, 2, 3]],
      [[5, 6, 7], [5, 6, 7], [6, 7], [6, 7], [7]],
    ),
  },
  {
    id: "plaza",
    name: "Monument Plaza",
    blurb: "Rain on the floodlit piazza",
    thumb: "/maps/plaza.webp",
    board: makeBoard(
      [[1, 2, 3], [0, 1, 2], [1, 2], [0, 3], [1]],
      [[7], [4, 7], [6, 7], [5, 6, 7], [5, 6, 7]],
    ),
  },
  {
    id: "beach",
    name: "River Delta",
    blurb: "Palms along the river mouth",
    thumb: "/maps/beach.webp",
    board: makeBoard(
      [[1, 2, 3], [0, 1], [0, 1], [0, 1], [1, 2, 3]],
      [[4], [3, 4], [3, 4, 5], [3, 4], [4]],
    ),
  },
];

export function isCharted(scene: Scene): scene is ChartedScene {
  return scene.board !== null;
}

export const CHARTED_SCENES: readonly ChartedScene[] = SCENES.filter(isCharted);

/**
 * Snowbound Lodge opens the app: it is the shape the board had before scenes
 * were selectable, and its 4–8 tile spread exercises the whole of the hook's
 * reach — some pairs inside it, some past it.
 */
export const DEFAULT_SCENE: ChartedScene =
  CHARTED_SCENES.find((s) => s.id === "snow") ?? CHARTED_SCENES[0];
