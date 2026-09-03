"use client";

import { useMemo, useState } from "react";

import Board from "./Board";
import { Mode, deriveBoard } from "../lib/board";
import {
  Hex,
  MAX_RANGE,
  PULL_TILES,
  hexDistance,
  hexName,
  isPlayable,
  sameHex,
  zoneOf,
} from "../lib/hex";

export default function Simulator() {
  const [mode, setMode] = useState<Mode>("place");
  const [pesci, setPesci] = useState<Hex | null>(null);
  const [target, setTarget] = useState<Hex | null>(null);
  const [hovered, setHovered] = useState<Hex | null>(null);
  const [showThreats, setShowThreats] = useState(true);
  const [showPull, setShowPull] = useState(true);
  const [allySideOnly, setAllySideOnly] = useState(false);

  const view = useMemo(
    () => deriveBoard({ mode, pesci, target, allySideOnly }),
    [mode, pesci, target, allySideOnly],
  );

  const awaitingTarget = mode === "target" && !target;

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setTarget(null);
    if (next === "target") setPesci(null);
  }

  function handlePick(hex: Hex) {
    // The middle ground is no-man's land — nothing deploys there.
    if (!isPlayable(hex)) return;

    if (mode === "place") {
      setPesci(sameHex(hex, pesci) ? null : hex);
      return;
    }
    if (!target) {
      setTarget(hex);
      setPesci(null);
      return;
    }
    // Standing on your own mark isn't a position — ignore it.
    if (sameHex(hex, target)) return;
    setPesci(sameHex(hex, pesci) ? null : hex);
  }

  function reset() {
    setPesci(null);
    setTarget(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <Header />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ModeTabs mode={mode} onChange={switchMode} />
          <Instructions
            mode={mode}
            awaitingTarget={awaitingTarget}
            hasPesci={!!pesci}
            idealDist={view.idealDist}
          />

          <div className="rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl shadow-black/60 sm:p-3">
            <Board
              tiles={view.tiles}
              pull={view.pull}
              landing={view.landing}
              pesci={pesci}
              target={target}
              hovered={hovered}
              awaitingTarget={awaitingTarget}
              showThreats={showThreats && mode === "target"}
              showPull={showPull && mode === "target"}
              onPick={handlePick}
              onHover={setHovered}
            />
          </div>

          <Legend mode={mode} />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[22rem]">
          <Readout
            mode={mode}
            pesci={pesci}
            target={target}
            hovered={hovered}
            view={view}
          />

          <Panel title="Options">
            <div className="flex flex-col gap-2">
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
                  <Toggle
                    label="Only suggest ally-side spots"
                    hint="Hide max-range tiles past the middle ground"
                    checked={allySideOnly}
                    onChange={setAllySideOnly}
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
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-300/70">
        JoJo&apos;s Bizarre Adventure · Golden Spirit
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-transparent sm:text-4xl bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text">
        Pesci&apos;s Bizarre Fishing Simulator
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
    { id: "target", label: "Pick a target", sub: "Find the cast spot" },
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
            className={`rounded-lg px-3 py-2 text-left transition ${
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
}: {
  mode: Mode;
  awaitingTarget: boolean;
  hasPesci: boolean;
  idealDist: number;
}) {
  let text: string;
  if (mode === "place") {
    text = hasPesci
      ? "Click another tile to move Pesci, or click his tile again to pick him up. Only the far half is shaded — that's where enemies stand. Gold tiles are exactly 6 away."
      : "Click any tile outside the middle ground to drop Pesci there. Every tile within 6 on the opposite half lights up, with the max-range ring in gold.";
  } else if (awaitingTarget) {
    text =
      "Click the enemy you want on the hook. The gold tiles that appear are every spot that puts them as far away as the hook can reach.";
  } else if (hasPesci) {
    text =
      "Pesci is cast. Click any other gold tile to slide him to a different ideal spot, or any tile at all to test a worse angle.";
  } else {
    text =
      idealDist === MAX_RANGE
        ? "Those gold tiles put your target at exactly 6 tiles — max range. Click one to place Pesci, or place him anywhere to compare."
        : `No tile on this board sits 6 away from that target, so the gold tiles are the furthest you can get: ${idealDist} tiles. Click one to place Pesci.`;
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
  mode,
  pesci,
  target,
  hovered,
  view,
}: {
  mode: Mode;
  pesci: Hex | null;
  target: Hex | null;
  hovered: Hex | null;
  view: ReturnType<typeof deriveBoard>;
}) {
  const { counts, targetDist, targetInRange, landing } = view;

  return (
    <Panel title="Cast report">
      <div className="flex flex-col">
        <Row
          label="Pesci"
          value={
            pesci ? (
              <>
                {hexName(pesci)}{" "}
                <span className="text-slate-500">({zoneOf(pesci)})</span>
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
                  <span className="text-slate-500">({zoneOf(target)})</span>
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
                zoneOf(pesci) === "ally" ? "Enemy" : "Ally"
              } tiles in range`}
              value={counts.inRange}
            />
            <Row
              label="At max range"
              value={<span className="text-amber-300">{counts.maxRange}</span>}
            />
          </>
        )}

        {mode === "target" && target && !pesci && (
          <Row
            label={`Ideal spots (${view.idealDist} tiles)`}
            value={<span className="text-amber-300">{counts.ideal}</span>}
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
                <span className="text-slate-500">{zoneOf(hovered)}</span>
              </>
            )
          }
        />
      </div>

      {mode === "target" && target && !pesci && view.idealDist < MAX_RANGE && (
        <p className="mt-3 rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-xs text-sky-200">
          Nothing on this board is a full {MAX_RANGE} tiles from{" "}
          {hexName(target)} — {view.idealDist} is as far as you can back off.
        </p>
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

function Legend({ mode }: { mode: Mode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:grid-cols-3">
      <Swatch
        color="#101d24"
        border="rgba(125,211,252,0.4)"
        label="Ally half (columns A–C)"
      />
      <Swatch
        color="#15151f"
        border="rgba(226,214,168,0.4)"
        dashed
        label="Neutral middle (column D)"
      />
      <Swatch
        color="#231019"
        border="rgba(248,113,113,0.5)"
        label="Enemy half (columns E–G)"
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
            color="rgba(251,113,133,0.25)"
            border="#fb7185"
            label="Steals the hook"
          />
          <Swatch
            color="rgba(251,191,36,0.15)"
            border="#fbbf24"
            dashed
            label="Ties with your target"
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

function Footer() {
  return (
    <footer className="border-t border-white/10 pt-4 text-xs text-slate-500">
      Fan-made planning tool. Not affiliated with or endorsed by the game or its
      publisher; all trademarks belong to their respective owners.
    </footer>
  );
}
