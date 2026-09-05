import type { MetadataRoute } from "next";

/**
 * Web app manifest — what an "Add to Home Screen" install looks like.
 *
 * The two `any` icons are the squircle mark with transparent corners, which is
 * what desktop Chrome and the install prompt show as-is. The `maskable` one is
 * the same art bled to the edges so a launcher can punch its own circle or
 * squircle out of it without clipping the hook.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pesci's Bizarre Fishing Simulator",
    short_name: "Pesci",
    description:
      "Plan Pesci's Fisher Man ultimate on the Golden Spirit hex battlefield: place him to see his 6-tile range, or pick a target to find every max-range casting spot.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#06080c",
    theme_color: "#05070a",
    categories: ["games", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
