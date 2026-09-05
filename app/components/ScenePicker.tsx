"use client";

import Image from "next/image";

import { MAX_RANGE, zoneOf } from "../lib/hex";
import { type ChartedScene, SCENES, type Scene, isCharted } from "../lib/maps";

/**
 * The game's "Switch Scene" list, rebuilt as the app's board picker.
 *
 * The scenes are not interchangeable backdrops: their deploy zones sit
 * different distances apart, so the same cast is max range on one field and
 * out of reach on the next. The caption under the strip spells that out for
 * whichever one is selected.
 */
export default function ScenePicker({
  scene,
  onPick,
}: {
  scene: ChartedScene;
  onPick: (scene: ChartedScene) => void;
}) {
  const { board } = scene;
  const ally = board.tiles.filter((h) => zoneOf(board, h) === "ally").length;
  const enemy = board.tiles.length - ally;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
        Scene
      </h2>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {SCENES.map((s) => (
          <SceneCard
            key={s.id}
            scene={s}
            active={s.id === scene.id}
            onPick={onPick}
          />
        ))}
      </div>

      <p className="mt-3 border-t border-white/5 pt-3 text-xs text-slate-400">
        <span className="text-slate-200">{scene.name}</span> —{" "}
        <span className="font-mono text-slate-500">
          {board.cols}×{board.rows} field · {ally} v {enemy} deploy tiles ·
          opposing tiles sit {board.span.min}–{board.span.max} apart
        </span>
        .{" "}
        {board.span.max <= MAX_RANGE
          ? `Every pair across the field is inside the hook's ${MAX_RANGE}, so the cast always catches somebody.`
          : `Anything further out than ${MAX_RANGE} is past the hook entirely.`}
      </p>
    </section>
  );
}

function SceneCard({
  scene,
  active,
  onPick,
}: {
  scene: Scene;
  active: boolean;
  onPick: (scene: ChartedScene) => void;
}) {
  const charted = isCharted(scene);

  return (
    <button
      type="button"
      // Not `disabled`: an uncharted scene is still worth finding with the
      // keyboard, it just has nothing to select.
      aria-disabled={charted ? undefined : true}
      aria-pressed={active}
      onClick={charted ? () => onPick(scene) : undefined}
      className={`group relative block overflow-hidden rounded-lg border text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
        active
          ? "border-amber-300/70 ring-2 ring-amber-300/40"
          : charted
            ? "border-white/10 hover:border-white/40"
            : "cursor-not-allowed border-white/5"
      }`}
    >
      <Image
        // Already cropped to the size it is drawn at, so there is nothing for
        // the optimizer to do — and skipping it keeps the page fully static.
        unoptimized
        src={scene.thumb}
        alt=""
        width={384}
        height={208}
        className={`block h-auto w-full transition ${
          charted
            ? active
              ? ""
              : "opacity-70 group-hover:opacity-100"
            : "opacity-30 grayscale"
        }`}
      />

      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-1.5 pb-1 pt-4">
        <span
          className={`block text-[10px] font-semibold leading-tight ${
            active
              ? "text-amber-200"
              : charted
                ? "text-slate-200"
                : "text-slate-500"
          }`}
        >
          {scene.name}
        </span>
        <span className="block truncate text-[9px] leading-tight text-slate-500">
          {charted ? scene.blurb : "layout not traced yet"}
        </span>
      </span>
    </button>
  );
}
