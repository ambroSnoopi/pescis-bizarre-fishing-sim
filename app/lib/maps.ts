import { type Board, makeBoard } from "./hex";

/**
 * The six PvP scenes, in the order the game's "Switch Scene" picker lists them.
 *
 * Each layout is traced off a screenshot of that scene's deployment view: the
 * shaded hexes are your half, the red ones the enemy's, and `ally`/`enemy`
 * below list their column indices row by row, top row first. `makeBoard` fills
 * in the middle ground between them.
 *
 * Two things the tracing makes obvious, and that a single board hid:
 *
 *  - **The halves sit different distances apart on every scene.** Night
 *    Pasture and Snowbound Lodge have the same zone shapes and play nothing
 *    alike: two columns of middle ground against four, so a cast that is max
 *    range on one is out of reach on the other. That gap is what decides
 *    whether the hook's 6 tiles matter.
 *  - **The two zones are not always the same shape.** Five scenes are
 *    point-symmetric (rotate 180° about the middle of the field and one half
 *    lands on the other); River Delta simply is not — its shaded half has
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
  board: Board;
};

export const SCENES: readonly Scene[] = [
  {
    id: "meadow",
    name: "Night Pasture",
    blurb: "Farmhouses over a dark field",
    thumb: "/maps/meadow.webp",
    board: makeBoard(
      [[1, 2], [0, 1], [0, 1, 2], [0, 1], [1, 2]],
      [[4, 5], [4, 5], [4, 5, 6], [4, 5], [4, 5]],
    ),
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

/**
 * Night Pasture opens the app: it is the board the app shipped with before
 * scenes were selectable, and the one scene where the halves are close enough
 * that nothing is ever out of the hook's reach.
 */
export const DEFAULT_SCENE: Scene = SCENES[0];
