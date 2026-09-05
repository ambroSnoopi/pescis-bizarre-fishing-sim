"use client";

import Image from "next/image";

import { SCENES, type Scene } from "../lib/maps";

/**
 * The game's "Switch Scene" list, rebuilt as the app's board picker.
 *
 * The cards carry the artwork and the name only — six of them across the
 * board's width leaves no room for a second line, and the blurb has somewhere
 * better to be: under the strip, for the one that is selected. What each scene
 * means for the cast is in the Scene info panel.
 */
export default function ScenePicker({
  scene,
  onPick,
}: {
  scene: Scene;
  onPick: (scene: Scene) => void;
}) {
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
        <span className="text-slate-200">{scene.name}</span> — {scene.blurb}
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
  onPick: (scene: Scene) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onPick(scene)}
      className={`group relative block overflow-hidden rounded-lg border text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
        active
          ? "border-amber-300/70 ring-2 ring-amber-300/40"
          : "border-white/10 hover:border-white/40"
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
          active ? "" : "opacity-70 group-hover:opacity-100"
        }`}
      />

      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-1.5 pb-1 pt-5">
        <span
          className={`block text-[11px] font-semibold leading-tight ${
            active ? "text-amber-200" : "text-slate-200"
          }`}
        >
          {scene.name}
        </span>
      </span>
    </button>
  );
}
