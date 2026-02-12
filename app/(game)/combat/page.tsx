"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CombatBattleScreen from "@/app/components/CombatBattleScreen";
import CombatResultModal from "@/app/components/CombatResultModal";
import PageLoader from "@/app/components/PageLoader";

/* ────────────────── Types ────────────────── */

type Character = {
  id: string;
  characterName: string;
  class: string;
  level: number;
  strength: number;
  agility: number;
  vitality: number;
  endurance: number;
  intelligence: number;
  wisdom: number;
  luck: number;
  charisma: number;
  armor: number;
};

type CombatLogEntry = {
  turn: number;
  actorId: string;
  targetId: string;
  action: string;
  damage?: number;
  healed?: number;
  dodge?: boolean;
  crit?: boolean;
  message: string;
  actorHpAfter?: number;
  targetHpAfter?: number;
  statusTicks?: { type: string; damage?: number; healed?: number }[];
};

type CombatantSnapshot = {
  id: string;
  name: string;
  class: string;
  level: number;
  currentHp: number;
  maxHp: number;
  baseStats: {
    strength: number;
    agility: number;
    vitality: number;
    endurance: number;
    intelligence: number;
    wisdom: number;
    luck: number;
    charisma: number;
  };
};

type CombatResult = {
  winnerId: string | null;
  loserId: string | null;
  draw: boolean;
  turns: number;
  log: CombatLogEntry[];
  playerSnapshot: CombatantSnapshot;
  enemySnapshot: CombatantSnapshot;
};

/* ────────────────── Preset cards data ────────────────── */

type PresetCard = {
  id: string;
  label: string;
  icon: string;
  gradient: string;
  border: string;
  glow: string;
  stats: { label: string; value: number }[];
  rating: number;
};

const PRESETS: PresetCard[] = [
  {
    id: "warrior",
    label: "Warrior",
    icon: "⚔️",
    gradient: "from-red-900 to-red-950",
    border: "border-red-700/60",
    glow: "border-red-500 shadow-red-500/30 ring-red-400/50",
    rating: 1200,
    stats: [
      { label: "Strength", value: 25 },
      { label: "Agility", value: 12 },
      { label: "Intelligence", value: 8 },
      { label: "Vitality", value: 20 },
      { label: "Luck", value: 10 },
    ],
  },
  {
    id: "rogue",
    label: "Rogue",
    icon: "🗡️",
    gradient: "from-emerald-900 to-emerald-950",
    border: "border-emerald-700/60",
    glow: "border-emerald-500 shadow-emerald-500/30 ring-emerald-400/50",
    rating: 1150,
    stats: [
      { label: "Strength", value: 15 },
      { label: "Agility", value: 28 },
      { label: "Intelligence", value: 10 },
      { label: "Vitality", value: 12 },
      { label: "Luck", value: 18 },
    ],
  },
  {
    id: "mage",
    label: "Mage",
    icon: "🔮",
    gradient: "from-blue-900 to-blue-950",
    border: "border-blue-700/60",
    glow: "border-blue-500 shadow-blue-500/30 ring-blue-400/50",
    rating: 1100,
    stats: [
      { label: "Strength", value: 8 },
      { label: "Agility", value: 14 },
      { label: "Intelligence", value: 30 },
      { label: "Vitality", value: 10 },
      { label: "Luck", value: 12 },
    ],
  },
  {
    id: "tank",
    label: "Tank",
    icon: "🛡️",
    gradient: "from-amber-900 to-amber-950",
    border: "border-amber-700/60",
    glow: "border-amber-500 shadow-amber-500/30 ring-amber-400/50",
    rating: 1050,
    stats: [
      { label: "Strength", value: 18 },
      { label: "Agility", value: 8 },
      { label: "Intelligence", value: 10 },
      { label: "Vitality", value: 30 },
      { label: "Luck", value: 8 },
    ],
  },
];

/* ────────────────── Stat row ────────────────── */

const StatRow = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-slate-400">{label}</span>
    <span className="font-bold text-white">{value}</span>
  </div>
);

/* ────────────────── Screen states ────────────────── */

type ScreenState =
  | { kind: "select" }
  | { kind: "battle"; result: CombatResult }
  | { kind: "result"; result: CombatResult };

/* ────────────────── Combat Content ────────────────── */

function CombatContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [preset, setPreset] = useState("warrior");
  const [loading, setLoading] = useState(true);
  const [fighting, setFighting] = useState(false);
  const [screen, setScreen] = useState<ScreenState>({ kind: "select" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`/api/characters/${characterId}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load character");
        setCharacter(await res.json());
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Character loading error");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [characterId]);

  const handleSimulate = async () => {
    if (!character) return;
    setError(null);
    setFighting(true);
    try {
      const res = await fetch("/api/combat/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: {
            id: character.id,
            name: character.characterName,
            class: character.class,
            level: character.level,
            strength: character.strength,
            agility: character.agility,
            vitality: character.vitality,
            endurance: character.endurance,
            intelligence: character.intelligence,
            wisdom: character.wisdom,
            luck: character.luck,
            charisma: character.charisma,
            armor: character.armor,
          },
          opponentPreset: preset,
        }),
      });
      if (!res.ok) throw new Error("Battle error");
      const data = (await res.json()) as CombatResult;
      setScreen({ kind: "battle", result: data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setFighting(false);
    }
  };

  const handleBattleComplete = () => {
    if (screen.kind === "battle") {
      setScreen({ kind: "result", result: screen.result });
    }
  };

  const handleCloseResult = () => {
    setScreen({ kind: "select" });
  };

  if (loading || !character) {
    return <PageLoader emoji="⚔️" text="Loading combat…" />;
  }

  /* ── Battle screen ── */
  if (screen.kind === "battle") {
    return (
      <CombatBattleScreen
        result={screen.result}
        playerId={character.id}
        onComplete={handleBattleComplete}
      />
    );
  }

  /* ── Result modal overlay on select screen ── */
  const showResult = screen.kind === "result";

  const selected = PRESETS.find((p) => p.id === preset)!;

  return (
    <div className="flex min-h-full flex-col p-4 lg:p-6">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold uppercase tracking-wider text-amber-400">
          Test Battle
        </h1>
        <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
          <strong className="text-white">{character.characterName}</strong>{" "}
          <span className="text-amber-400">(Lv. {character.level})</span>
        </span>
      </div>

      <p className="mb-6 text-xs text-slate-500">
        Choose an opponent for a practice fight. No stamina cost.
      </p>

      {/* Choose an opponent */}
      <h2 className="mb-4 text-center text-sm font-semibold text-slate-300">
        Choose your opponent:
      </h2>

      {/* Opponent cards grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {PRESETS.map((card) => {
          const isSelected = preset === card.id;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setPreset(card.id)}
              aria-label={`Select ${card.label}`}
              aria-pressed={isSelected}
              tabIndex={0}
              className={`
                group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300
                ${
                  isSelected
                    ? `${card.glow} shadow-lg ring-2 scale-[1.03]`
                    : `${card.border} hover:border-slate-500`
                }
                bg-slate-900/80
              `}
            >
              {/* Avatar area */}
              <div
                className={`relative flex h-28 flex-col items-center justify-center bg-gradient-to-b ${card.gradient}`}
              >
                <span className="text-5xl drop-shadow-lg">{card.icon}</span>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <p className="truncate text-center text-xs font-bold text-white">
                    {card.label}{" "}
                    <span className="text-slate-400">
                      (Lv. {character.level})
                    </span>
                  </p>
                </div>
              </div>

              {/* Rating bar */}
              <div className="flex justify-center border-b border-slate-800 bg-red-900/40 py-2">
                <span className="text-sm font-extrabold tabular-nums text-red-400">
                  {card.rating.toLocaleString()}
                </span>
              </div>

              {/* Stats */}
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                {card.stats.map((s) => (
                  <StatRow key={s.label} label={s.label} value={s.value} />
                ))}
              </div>

              {/* Bottom class badge */}
              <div className="border-t border-slate-800 px-3 py-2 text-center text-[10px] uppercase tracking-widest text-slate-500">
                {card.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-2.5">
          <span>⚠️</span>
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-xs text-red-500 hover:text-red-400"
            aria-label="Close error"
            tabIndex={0}
          >
            ✕
          </button>
        </div>
      )}

      {/* Action button */}
      <button
        type="button"
        onClick={handleSimulate}
        disabled={fighting}
        aria-label="Start Battle"
        className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-amber-900/40 transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
      >
        {fighting
          ? "Fighting…"
          : `${selected.icon} Fight ${selected.label}`}
      </button>

      {/* Result modal */}
      {showResult && screen.kind === "result" && (
        <CombatResultModal
          open
          onClose={handleCloseResult}
          title={
            screen.result.draw
              ? "Draw"
              : screen.result.winnerId === character.id
                ? "Victory!"
                : "Defeat"
          }
          turns={screen.result.turns}
        />
      )}
    </div>
  );
}

/* ────────────────── Page wrapper ────────────────── */

export default function CombatPage() {
  return (
    <Suspense fallback={<PageLoader emoji="⚔️" text="Loading combat…" />}>
      <CombatContent />
    </Suspense>
  );
}
