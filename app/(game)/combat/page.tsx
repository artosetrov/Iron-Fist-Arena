"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CombatBattleScreen from "@/app/components/CombatBattleScreen";
import CombatResultModal from "@/app/components/CombatResultModal";
import PageLoader from "@/app/components/PageLoader";
import HeroCard from "@/app/components/HeroCard";
import useCharacterAvatar from "@/app/hooks/useCharacterAvatar";

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

type TrainingRewards = {
  xp: number;
  remaining: number;
  leveledUp: boolean;
};

type CombatResult = {
  winnerId: string | null;
  loserId: string | null;
  draw: boolean;
  turns: number;
  log: CombatLogEntry[];
  playerSnapshot: CombatantSnapshot;
  enemySnapshot: CombatantSnapshot;
  rewards: TrainingRewards;
};

type TrainingStatus = {
  used: number;
  remaining: number;
  max: number;
};

/* ────────────────── Preset cards data ────────────────── */

type PresetCard = {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** Weight applied to player VIT when computing dummy HP */
  vitW: number;
};

const PRESETS: PresetCard[] = [
  {
    id: "warrior",
    label: "Warrior Dummy",
    icon: "⚔️",
    description: "High STR, moderate VIT. Hits hard but predictable.",
    vitW: 1.0,
  },
  {
    id: "rogue",
    label: "Rogue Dummy",
    icon: "🗡️",
    description: "High AGI & LCK. Fast and evasive, but fragile.",
    vitW: 0.6,
  },
  {
    id: "mage",
    label: "Mage Dummy",
    icon: "🔮",
    description: "High INT & WIS. Devastating spells, low HP.",
    vitW: 0.7,
  },
  {
    id: "tank",
    label: "Tank Dummy",
    icon: "🛡️",
    description: "High VIT & END. Extremely tanky but slow.",
    vitW: 1.3,
  },
];

/* ── Dummy stat helpers (mirrors server logic) ── */
const DUMMY_STAT_MULT = 0.6;
const DUMMY_LEVEL_OFFSET = -3;
const HP_PER_VIT = 10;

const getDummyLevel = (playerLevel: number) =>
  Math.max(1, playerLevel + DUMMY_LEVEL_OFFSET);

const getDummyHp = (playerVitality: number, vitW: number) => {
  const vit = Math.max(5, Math.floor(playerVitality * DUMMY_STAT_MULT * vitW));
  return Math.max(100, vit * HP_PER_VIT);
};

/* ────────────────── Screen states ────────────────── */

type ScreenState =
  | { kind: "select" }
  | { kind: "battle"; result: CombatResult }
  | { kind: "result"; result: CombatResult };

/* ────────────────── Combat Content ────────────────── */

function CombatContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const avatarSrc = useCharacterAvatar(characterId);
  const [character, setCharacter] = useState<Character | null>(null);
  const [preset, setPreset] = useState("warrior");
  const [loading, setLoading] = useState(true);
  const [fighting, setFighting] = useState(false);
  const [screen, setScreen] = useState<ScreenState>({ kind: "select" });
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TrainingStatus | null>(null);

  /* ── Load character + training status ── */
  useEffect(() => {
    if (!characterId) return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const [charRes, statusRes] = await Promise.all([
          fetch(`/api/characters/${characterId}`, { signal: controller.signal }),
          fetch(`/api/combat/status?characterId=${characterId}`, { signal: controller.signal }),
        ]);
        if (!charRes.ok) throw new Error("Failed to load character");
        setCharacter(await charRes.json());
        if (statusRes.ok) setStatus(await statusRes.json());
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

  /* ── Refresh status helper ── */
  const refreshStatus = useCallback(async () => {
    if (!characterId) return;
    try {
      const res = await fetch(`/api/combat/status?characterId=${characterId}`);
      if (res.ok) setStatus(await res.json());
    } catch {
      /* silent */
    }
  }, [characterId]);

  const handleTrain = async () => {
    if (!character) return;
    setError(null);
    setFighting(true);
    try {
      const res = await fetch("/api/combat/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          opponentPreset: preset,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Battle error" }));
        throw new Error(err.error ?? "Battle error");
      }
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
    refreshStatus();
    // Reload character to reflect XP/level changes
    if (characterId) {
      fetch(`/api/characters/${characterId}`)
        .then((r) => r.json())
        .then(setCharacter)
        .catch(() => {});
    }
  };

  if (loading || !character) {
    return <PageLoader emoji="🎯" text="Loading Training Arena…" avatarSrc={avatarSrc} />;
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
  const limitReached = status !== null && status.remaining <= 0;

  return (
    <div className="flex min-h-full flex-col p-4 lg:p-6">
      {/* Header */}
      <div className="relative mb-2 flex flex-col items-center gap-2">
        <Link
          href="/hub"
          className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white"
          aria-label="Back to Hub"
          tabIndex={0}
        >
          ✕
        </Link>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-amber-400">
          Training Arena
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {status && (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5">
                <span className="text-xs text-slate-400">Today:</span>
                <div className="flex gap-1">
                  {Array.from({ length: status.max }, (_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        i < status.used
                          ? "bg-amber-500"
                          : "bg-slate-700"
                      }`}
                      aria-label={i < status.used ? "Used" : "Available"}
                    />
                  ))}
                </div>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    limitReached ? "text-red-400" : "text-amber-400"
                  }`}
                >
                  {status.remaining}/{status.max}
                </span>
              </div>

              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-400">
                Win: <span className="ml-1 font-semibold text-blue-400">{10 + character.level * 2} XP</span>
                <span className="mx-1">·</span>Defeat: <span className="ml-1 text-slate-500">0 XP</span>
              </div>
            </>
          )}

        </div>
      </div>

      <p className="mb-4 text-xs text-slate-500">
        Fight training dummies to gain XP. No stamina cost, no rating, no loot.
      </p>

      {/* Choose an opponent */}
      <h2 className="mb-4 text-center font-display text-base text-slate-300">
        Choose your opponent:
      </h2>

      {/* Opponent cards grid */}
      <div className="scrollbar-hide mx-auto mb-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4" style={{ maxWidth: 4 * 320 + 3 * 16 }}>
        {PRESETS.map((card) => {
          const dummyLvl = getDummyLevel(character.level);
          const dummyHp = getDummyHp(character.vitality, card.vitW);

          return (
            <div
              key={card.id}
              className="w-[75vw] min-w-[220px] max-w-[320px] flex-shrink-0 snap-center sm:w-auto sm:min-w-0 sm:max-w-none sm:flex-shrink"
            >
              <HeroCard
                name={card.label}
                className={card.id}
                icon={card.icon}
                level={dummyLvl}
                hp={{ current: dummyHp, max: dummyHp }}
                selected={preset === card.id}
                onClick={() => setPreset(card.id)}
                ariaLabel={`Select ${card.label}`}
                description={card.description}
              >
                <p className="pb-1 text-center text-[10px] text-slate-600">
                  Stats scale to your level
                </p>
              </HeroCard>
            </div>
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
        onClick={handleTrain}
        disabled={fighting || limitReached}
        aria-label={limitReached ? "Daily limit reached" : "Start Training"}
        className={`rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-lg transition ${
          limitReached
            ? "cursor-not-allowed bg-slate-700 text-slate-400 shadow-none"
            : "bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-900/40 hover:from-amber-500 hover:to-orange-500"
        } disabled:opacity-50`}
      >
        {limitReached
          ? "Daily Limit Reached — Come Back Tomorrow"
          : fighting
            ? "Fighting…"
            : `${selected.icon} Train vs ${selected.label}`}
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
          trainingRewards={screen.result.rewards}
        />
      )}
    </div>
  );
}

/* ────────────────── Page wrapper ────────────────── */

export default function CombatPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🎯" text="Loading Training Arena…" />}>
      <CombatContent />
    </Suspense>
  );
}
