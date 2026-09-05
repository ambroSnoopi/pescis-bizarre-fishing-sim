"use client";

import { useMemo, useState } from "react";

import Board from "./Board";
import ScenePicker from "./ScenePicker";
import { type Mode, actionFor, deriveBoard } from "../lib/board";
import {
  type Board as BoardShape,
  type Hex,
  MAX_ENEMIES,
  MAX_RANGE,
  PULL_TILES,
  hexDistance,
  hexName,
  oppositeHalves,
  sameHex,
  zoneOf,
} from "../lib/hex";
import { type Scene, DEFAULT_SCENE } from "../lib/maps";

export default function Simulator() {
  const [scene, setScene] = useState<Scene>(DEFAULT_SCENE);
  const [mode, setMode] = useState<Mode>("place");
  const [pesci, setPesci] = useState<Hex | null>(null);
  const [target, setTarget] = useState<Hex | null>(null);
  const [enemies, setEnemies] = useState<Hex[]>([]);
  const [hovered, setHovered] = useState<Hex | null>(null);
  // The middle ground is only ever scenery — on by default because it shows
  // how far apart the halves are, which is the thing that changes per scene.
  const [showNeutral, setShowNeutral] = useState(true);
  const [showThreats, setShowThreats] = useState(true);
  // Off by default: the reel-in is what happens *after* the cast lands, so it
  // is noise while you are still working out where to stand.
  const [showPull, setShowPull] = useState(false);

  const board = scene.board;

  const view = useMemo(
    () => deriveBoard(board, { mode, pesci, target, enemies }),
    [board, mode, pesci, target, enemies],
  );

  const awaitingTarget = mode === "target" && !target;

  function switchScene(next: Scene) {
    if (next.id === scene.id) return;
    setScene(next);
    // Tiles that exist on one field usually do not on the next, and a
    // half-transplanted line-up would quietly report the wrong distances.
    reset();
    setHovered(null);
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setTarget(null);
    setEnemies([]);
    if (next === "target") setPesci(null);
  }

  function handlePick(hex: Hex) {
    switch (actionFor(board, hex, { mode, pesci, target, enemies })) {
      case "set-target":
        // Re-marking keeps Pesci: he's on the far half either way, so his
        // position is still legal and you get the new distance immediately.
        setTarget(hex);
        return;
      case "place-pesci":
        setPesci(hex);
        // Moving him keeps the line-up — it's on the other half either way —
        // but anyone who ends up sharing his half is off the board.
        setEnemies((prev) => prev.filter((e) => oppositeHalves(board, hex, e)));
        return;
      case "lift-pesci":
        // Without Pesci there is no "other half", so the line-up goes too.
        setPesci(null);
        setEnemies([]);
        return;
      case "add-enemy":
        setEnemies((prev) =>
          prev.length >= MAX_ENEMIES ? prev : [...prev, hex],
        );
        return;
      case "remove-enemy":
        setEnemies((prev) => prev.filter((e) => !sameHex(e, hex)));
        return;
      case "reset":
        reset();
        return;
      case "none":
        return;
    }
  }

  function reset() {
    setPesci(null);
    setTarget(null);
    setEnemies([]);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <Header />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ScenePicker scene={scene} onPick={switchScene} />
          <ModeTabs mode={mode} onChange={switchMode} />
          <Instructions
            mode={mode}
            awaitingTarget={awaitingTarget}
            hasPesci={!!pesci}
            idealDist={view.idealDist}
            inRange={view.counts.inRange}
            enemyCount={view.counts.enemies}
            hooked={view.hooked}
            hookedDist={view.hookedDist}
          />

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl shadow-black/60 sm:p-3">
            <Board
              board={board}
              tiles={view.tiles}
              pull={view.pull}
              landing={view.landing}
              pesci={pesci}
              target={target}
              hovered={hovered}
              awaitingTarget={awaitingTarget}
              showNeutral={showNeutral}
              showThreats={showThreats && mode === "target"}
              showPull={showPull && mode === "target"}
              onPick={handlePick}
              onHover={setHovered}
            />
          </div>

          <Legend mode={mode} showNeutral={showNeutral} />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[22rem]">
          <Panel title="Options">
            <div className="flex flex-col gap-2">
              <Toggle
                label="Show the middle ground"
                hint="The tiles between the halves, where nobody deploys"
                checked={showNeutral}
                onChange={setShowNeutral}
              />
              {mode === "target" && (
                <>
                  <Toggle
                    label="Warn about hook stealers"
                    hint="Tiles where another enemy would be grabbed instead"
                    checked={showThreats}
                    onChange={setShowThreats}
                  />
                  <Toggle
                    label="Show the reel-in path"
                    hint={`Where the target is dragged over ${PULL_TILES}s`}
                    checked={showPull}
                    onChange={setShowPull}
                  />
                </>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                >
                  Clear board
                </button>
                {mode === "place" && enemies.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setEnemies([])}
                    className="flex-1 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
                  >
                    Clear enemies
                  </button>
                )}
                {mode === "target" && target && (
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 rounded-lg border border-pink-400/40 bg-pink-500/10 px-3 py-2 text-sm font-medium text-pink-200 transition hover:bg-pink-500/20"
                  >
                    New target
                  </button>
                )}
              </div>
            </div>
          </Panel>

          <Readout
            board={board}
            mode={mode}
            pesci={pesci}
            target={target}
            hovered={hovered}
            view={view}
          />

          <SkillCard />
        </aside>
      </div>

      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chrome                                                              */
/* ------------------------------------------------------------------ */

function Header() {
  return (
    <header className="flex flex-col gap-1">
      {/* Both titles shrink on narrow screens so they stay on one line. */}
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-300/70">
        JoJo&apos;s Bizarre Adventure ·{" "}
        <span className="sm:hidden">GS</span>
        <span className="hidden sm:inline">Golden Spirit</span>
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-transparent sm:text-4xl bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text">
        <span className="sm:hidden">Pesci&apos;s Bizarre Fishing Sim</span>
        <span className="hidden sm:inline">
          Pesci&apos;s Bizarre Fishing Simulator
        </span>
      </h1>
      <p className="max-w-3xl text-sm text-slate-400">
        Beach Boy only bites at the right distance. Line up{" "}
        <span className="text-amber-200">Fisher Man</span> on the hex
        battlefield before you waste the cast.
      </p>
    </header>
  );
}

function ModeTabs({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const tabs: { id: Mode; label: string; sub: string }[] = [
    { id: "place", label: "Place Pesci", sub: "See his range" },
    { id: "target", label: "Pick a Target", sub: "Find a fishing spot" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5">
      {tabs.map((tab) => {
        const active = tab.id === mode;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className={`rounded-lg px-3 py-2 text-center transition ${
              active
                ? "bg-gradient-to-b from-amber-400/25 to-amber-600/15 text-amber-100 ring-1 ring-amber-300/50"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span className="block text-xs opacity-70">{tab.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

function Instructions({
  mode,
  awaitingTarget,
  hasPesci,
  idealDist,
  inRange,
  enemyCount,
  hooked,
  hookedDist,
}: {
  mode: Mode;
  awaitingTarget: boolean;
  hasPesci: boolean;
  idealDist: number;
  inRange: number;
  enemyCount: number;
  hooked: Hex[];
  hookedDist: number | null;
}) {
  let text: string;
  if (mode === "place") {
    const room = MAX_ENEMIES - enemyCount;
    if (!hasPesci) {
      text =
        "Click any tile outside the middle ground to drop Pesci there. Every tile within 6 on the opposite half lights up, with the max-range ring in gold.";
    } else if (inRange === 0) {
      text = `Pesci is cast, but not one tile on the far half is inside ${MAX_RANGE} from there — the hook can't reach the enemy line at all. Click a tile closer to the middle to move him.`;
    } else if (enemyCount === 0) {
      text = `Pesci is cast. Now click up to ${MAX_ENEMIES} shaded tiles on the far half to stand enemies there — whoever the hook would grab gets it glowing over their head. Click a tile on Pesci's own half to move him, or his tile again to pick him up.`;
    } else if (hooked.length === 0) {
      text = `Not one of those ${enemyCount} is within ${MAX_RANGE} tiles, so the cast comes back empty. Move Pesci closer, or click an enemy to take them off the board.`;
    } else if (hooked.length > 1) {
      text = `${hooked.length} enemies tie at ${hookedDist} tiles — all of them are glowing because the hook picks between them at random. Move Pesci to break the tie.`;
    } else {
      text = `The hook takes ${hexName(hooked[0])}: the furthest body in range, at ${hookedDist} tiles. Click an enemy to remove them${
        room > 0 ? `, or stand up to ${room} more` : ""
      }.`;
    }
  } else if (awaitingTarget) {
    text =
      "Click the enemy you want on the hook. The gold tiles that appear are every spot that puts them as far away as the hook can reach.";
  } else if (hasPesci) {
    text =
      "Pesci is cast. Click another tile on his half to move him, anywhere on the target's half to re-mark, or the hook itself to start over.";
  } else if (idealDist === 0) {
    text = `Nothing on the opposite half is within ${MAX_RANGE} tiles of that mark, so no cast on this field reaches them. Click a different enemy, or the hook to start over.`;
  } else {
    const opening =
      idealDist === MAX_RANGE
        ? "Those gold tiles put your target at exactly 6 tiles — max range."
        : `No tile on this field sits 6 away from that target, so the gold tiles are the furthest you can get: ${idealDist} tiles.`;
    text = `${opening} Click one to place Pesci — he casts from the half opposite his mark. Clicking the target's own half re-marks instead, and clicking the hook starts over.`;
  }

  return (
    <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
      {text}
    </p>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-1.5 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-right font-mono text-sm text-slate-100">
        {value}
      </span>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1.5 transition hover:bg-white/5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
      />
      <span>
        <span className="block text-sm text-slate-200">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Readout                                                             */
/* ------------------------------------------------------------------ */

function Readout({
  board,
  mode,
  pesci,
  target,
  hovered,
  view,
}: {
  board: BoardShape;
  mode: Mode;
  pesci: Hex | null;
  target: Hex | null;
  hovered: Hex | null;
  view: ReturnType<typeof deriveBoard>;
}) {
  const { counts, targetDist, targetInRange, landing, hooked, hookedDist } =
    view;
  const showLineup = mode === "place" && !!pesci;

  return (
    <Panel title="Cast report">
      <div className="flex flex-col">
        <Row
          label="Pesci"
          value={
            pesci ? (
              <>
                {hexName(pesci)}{" "}
                <span className="text-slate-500">({zoneOf(board, pesci)})</span>
              </>
            ) : (
              <span className="text-slate-500">not placed</span>
            )
          }
        />

        {mode === "target" && (
          <Row
            label="Target"
            value={
              target ? (
                <>
                  {hexName(target)}{" "}
                  <span className="text-slate-500">({zoneOf(board, target)})</span>
                </>
              ) : (
                <span className="text-slate-500">pick one</span>
              )
            }
          />
        )}

        {pesci && (
          <>
            <Row
              label={`${
                zoneOf(board, pesci) === "ally" ? "Enemy" : "Ally"
              } tiles in range`}
              value={counts.inRange}
            />
            <Row
              label="At max range"
              value={<span className="text-amber-300">{counts.maxRange}</span>}
            />
          </>
        )}

        {showLineup && (
          <Row
            label="Enemies placed"
            value={
              <>
                {counts.enemies}
                <span className="text-slate-500"> / {MAX_ENEMIES}</span>
              </>
            }
          />
        )}

        {showLineup && counts.enemies > 0 && (
          <Row
            label="Hook takes"
            value={
              hooked.length === 0 ? (
                <span className="text-rose-300">nobody in range</span>
              ) : (
                <span className="text-amber-300">
                  {hooked.map(hexName).join(hooked.length > 2 ? ", " : " or ")}
                  <span className="text-slate-500"> · {hookedDist} tiles</span>
                </span>
              )
            }
          />
        )}

        {mode === "target" && target && !pesci && (
          <Row
            label={
              counts.ideal > 0
                ? `Ideal spots (${view.idealDist} tiles)`
                : "Ideal spots"
            }
            value={
              counts.ideal > 0 ? (
                <span className="text-amber-300">{counts.ideal}</span>
              ) : (
                <span className="text-rose-300">none in reach</span>
              )
            }
          />
        )}

        {targetDist !== null && (
          <Row
            label="Pesci → target"
            value={`${targetDist} ${targetDist === 1 ? "tile" : "tiles"}`}
          />
        )}

        {/* Always rendered: letting this row appear and disappear on hover
            would shift everything below it while the cursor is moving. */}
        <Row
          label="Hovering"
          value={
            !hovered ? (
              <span className="text-slate-600">—</span>
            ) : sameHex(hovered, pesci) ? (
              <>
                {hexName(hovered)}{" "}
                <span className="text-slate-500">Pesci&apos;s tile</span>
              </>
            ) : sameHex(hovered, target) ? (
              <>
                {hexName(hovered)}{" "}
                <span className="text-slate-500">your target</span>
              </>
            ) : pesci ? (
              `${hexName(hovered)} · ${hexDistance(pesci, hovered)} from Pesci`
            ) : target ? (
              `${hexName(hovered)} · ${hexDistance(target, hovered)} from target`
            ) : (
              <>
                {hexName(hovered)}{" "}
                <span className="text-slate-500">{zoneOf(board, hovered)}</span>
              </>
            )
          }
        />
      </div>

      {mode === "target" &&
        target &&
        !pesci &&
        view.idealDist > 0 &&
        view.idealDist < MAX_RANGE && (
          <p className="mt-3 rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-xs text-sky-200">
            Nothing on this field is a full {MAX_RANGE} tiles from{" "}
            {hexName(target)} — {view.idealDist} is as far as you can back off.
          </p>
        )}

      {mode === "target" && target && !pesci && view.idealDist === 0 && (
        <p className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          Every tile on the opposite half sits more than {MAX_RANGE} from{" "}
          {hexName(target)}, so there is no cast on this field that takes them.
        </p>
      )}

      {showLineup && counts.enemies > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {hooked.length === 1 && (
            <Badge tone="good">
              Hook locked on {hexName(hooked[0])} at {hookedDist} tiles
            </Badge>
          )}
          {hooked.length > 1 && (
            <Badge tone="warn">
              {hooked.length}-way tie at {hookedDist} tiles — the hook picks one
              at random
            </Badge>
          )}
          {hooked.length === 0 && (
            <Badge tone="bad">
              Nobody within {MAX_RANGE} tiles — the cast catches nothing
            </Badge>
          )}
          {counts.enemies > counts.enemiesInRange && hooked.length > 0 && (
            <Note tone="info">
              {counts.enemies - counts.enemiesInRange === 1
                ? "One of them stands"
                : `${counts.enemies - counts.enemiesInRange} of them stand`}
              {` further than ${MAX_RANGE} tiles out, so the hook can't reach them at all.`}
            </Note>
          )}
          {hooked.length === 1 && hookedDist === MAX_RANGE && (
            <Note tone="good">
              At max range nothing in reach can sit further out, so this pick
              can&apos;t be stolen.
            </Note>
          )}
          {hooked.length === 1 && hookedDist !== null && hookedDist < MAX_RANGE && (
            <Note tone="warn">
              {MAX_RANGE - hookedDist} tile
              {MAX_RANGE - hookedDist === 1 ? "" : "s"} of reach to spare — a
              body anywhere further out than {hexName(hooked[0])} would take the
              hook instead.
            </Note>
          )}
        </div>
      )}

      {targetDist !== null && (
        <div className="mt-3 flex flex-col gap-2">
          <Verdict
            targetDist={targetDist}
            targetInRange={targetInRange}
            idealDist={view.idealDist}
          />

          {targetInRange && (
            <>
              {counts.steal > 0 && (
                <Note tone="bad">
                  {counts.steal} tile{counts.steal === 1 ? "" : "s"} in range
                  sit further out than your mark. An enemy standing on any of
                  them eats the hook instead.
                </Note>
              )}
              {counts.steal === 0 && counts.tie > 0 && (
                <Note tone="warn">
                  {counts.tie} tile{counts.tie === 1 ? "" : "s"} are the same
                  distance as your mark — a body there makes the pick a coin
                  flip.
                </Note>
              )}
              {counts.steal === 0 && counts.tie === 0 && (
                <Note tone="good">
                  Nothing in range is further out than your mark. The hook can
                  only take them.
                </Note>
              )}
              {landing && (
                <Note tone="info">
                  Reeled from {hexName(target as Hex)} to {hexName(landing)},
                  stunned for {PULL_TILES}s.
                </Note>
              )}
            </>
          )}
        </div>
      )}
    </Panel>
  );
}

function Verdict({
  targetDist,
  targetInRange,
  idealDist,
}: {
  targetDist: number;
  targetInRange: boolean;
  idealDist: number;
}) {
  if (!targetInRange) {
    return (
      <Badge tone="bad">
        Out of range — {targetDist} tiles, the hook only reaches {MAX_RANGE}
      </Badge>
    );
  }
  if (targetDist === MAX_RANGE) {
    return <Badge tone="good">Max range — the cleanest possible cast</Badge>;
  }
  if (targetDist === idealDist) {
    return (
      <Badge tone="good">
        {targetDist} tiles — as far back as this board allows
      </Badge>
    );
  }
  return (
    <Badge tone="warn">
      In range, but {idealDist - targetDist} tile
      {idealDist - targetDist === 1 ? "" : "s"} closer than you could stand
    </Badge>
  );
}

const TONES = {
  good: "border-amber-300/40 bg-amber-400/10 text-amber-200",
  warn: "border-sky-300/30 bg-sky-400/10 text-sky-200",
  bad: "border-rose-400/40 bg-rose-500/10 text-rose-200",
  info: "border-white/10 bg-white/5 text-slate-300",
} as const;

function Badge({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <p
      className={`rounded-lg border px-3 py-2 text-center text-sm font-semibold ${TONES[tone]}`}
    >
      {children}
    </p>
  );
}

function Note({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <p className={`rounded-lg border px-3 py-2 text-xs ${TONES[tone]}`}>
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Legend + flavour                                                    */
/* ------------------------------------------------------------------ */

function Swatch({
  color,
  border,
  dashed,
  label,
}: {
  color: string;
  border: string;
  dashed?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-4 w-6 shrink-0 rounded-sm"
        style={{
          background: color,
          border: `1.5px ${dashed ? "dashed" : "solid"} ${border}`,
        }}
      />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

function Legend({ mode, showNeutral }: { mode: Mode; showNeutral: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:grid-cols-3">
      <Swatch
        color="#101d24"
        border="rgba(125,211,252,0.4)"
        label="Your deploy zone"
      />
      {showNeutral && (
        <Swatch
          color="#15151f"
          border="rgba(226,214,168,0.4)"
          dashed
          label="Neutral middle"
        />
      )}
      <Swatch
        color="#231019"
        border="rgba(248,113,113,0.5)"
        label="Enemy deploy zone"
      />
      <Swatch
        color="rgba(245,158,11,0.14)"
        border="rgba(251,191,36,0.4)"
        label="Within 6 tiles"
      />
      <Swatch
        color="rgba(250,204,21,0.26)"
        border="#facc15"
        label="Max range (exactly 6)"
      />
      {mode === "place" && (
        <>
          <Swatch
            color="rgba(251,113,133,0.14)"
            border="#fb7185"
            label="Enemy standing here"
          />
          <Swatch
            color="rgba(250,204,21,0.20)"
            border="#facc15"
            label="Takes the hook"
          />
        </>
      )}
      {mode === "target" && (
        <>
          <Swatch
            color="rgba(244,114,182,0.18)"
            border="#f472b6"
            label="Your target"
          />
          <Swatch
            color="rgba(250,204,21,0.14)"
            border="#fde047"
            dashed
            label="Ideal cast positions"
          />
          <Swatch
            color="rgba(251,191,36,0.15)"
            border="#fbbf24"
            dashed
            label="Ties with your target"
          />
          <Swatch
            color="rgba(251,113,133,0.25)"
            border="#fb7185"
            label="Steals the hook"
          />
        </>
      )}
    </div>
  );
}

function SkillCard() {
  return (
    <section className="rounded-2xl border border-amber-300/20 bg-gradient-to-b from-amber-500/[0.07] to-transparent p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-amber-200">Fisher Man</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/60">
          Ultimate
        </span>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">
        Pesci hurls a fishing hook at the target, dealing damage equal to{" "}
        <span className="text-amber-200">1400%</span> of Attack to{" "}
        <span className="text-amber-200">the furthest enemy within 6 tiles</span>{" "}
        1 time. While channeling this skill, Pesci pulls the target toward him
        by 1 tile 1 time per second. This skill lasts for 3 seconds, and the
        target remains Stunned throughout this duration.
      </p>
      <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-400">
        <span className="text-slate-200">Why aiming is awkward:</span> you never
        pick the victim — the hook does, and it always takes the{" "}
        <em>furthest</em> body inside 6 tiles. Standing so your mark is at
        exactly 6 makes them the furthest one by definition.
      </p>
    </section>
  );
}

const REPO_URL = "https://github.com/ambroSnoopi/pescis-bizarre-fishing-sim";
/** `bug` and `enhancement` are GitHub's stock labels, so these prefill cleanly. */
const BUG_URL = `${REPO_URL}/issues/new?labels=bug`;
const FEATURE_URL = `${REPO_URL}/issues/new?labels=enhancement`;

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-sm text-slate-300 no-underline decoration-amber-300/60 underline-offset-4 transition hover:text-amber-200 hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
    >
      {children}
    </a>
  );
}

function Dot() {
  return (
    <span aria-hidden="true" className="text-slate-700">
      ·
    </span>
  );
}

/** GitHub's mark, linking to the source. */
function GitHubLink() {
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Source on GitHub"
      className="rounded-sm text-slate-300 transition hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
    >
      <svg
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill="currentColor"
        aria-hidden="true"
        className="block"
      >
        <title>Source on GitHub</title>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    </a>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-slate-500">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <GitHubLink />
        <Dot />
        <FooterLink href={BUG_URL}>Report a Bug</FooterLink>
        <Dot />
        <FooterLink href={FEATURE_URL}>Request a Feature</FooterLink>
      </p>
      <p>
        Fan-made planning tool. Not affiliated with or endorsed by the game or
        its publisher; all trademarks belong to their respective owners.
      </p>
    </footer>
  );
}
