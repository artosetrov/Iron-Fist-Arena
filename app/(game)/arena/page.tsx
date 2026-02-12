"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import CombatBattleScreen from "@/app/components/CombatBattleScreen";
import CombatResultModal from "@/app/components/CombatResultModal";
import PageLoader from "@/app/components/PageLoader";

/* ────────────────── Types ────────────────── */

type Character = {
  id: string;
  characterName: string;
  level: number;
  gold: number;
  currentStamina: number;
  maxStamina: number;
  pvpRating: number;
};

type Opponent = {
  id: string;
  characterName: string;
  class: string;
  origin?: string;
  level: number;
  pvpRating: number;
  strength: number;
  agility: number;
  vitality: number;
  intelligence: number;
  luck: number;
};

type CombatantSnapshot = {
  id: string;
  name: string;
  class: string;
  origin?: string;
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

type MatchResult = {
  winnerId: string | null;
  loserId: string | null;
  draw: boolean;
  turns: number;
  log: CombatLogEntry[];
  playerSnapshot: CombatantSnapshot;
  enemySnapshot: CombatantSnapshot;
  opponent: {
    id: string;
    characterName: string;
    class: string;
    level: number;
    pvpRating: number;
  };
  rewards: {
    gold: number;
    xp: number;
    ratingChange: number;
    newRating: number;
    won: boolean;
  };
};

/* ────────────────── Constants ────────────────── */

const STAMINA_COST = 10;

const CLASS_LABEL: Record<string, string> = {
  warrior: "Warrior",
  rogue: "Rogue",
  mage: "Mage",
  tank: "Tank",
};

const CLASS_GRADIENT: Record<string, string> = {
  warrior: "from-red-900 to-red-950",
  rogue: "from-emerald-900 to-emerald-950",
  mage: "from-blue-900 to-blue-950",
  tank: "from-amber-900 to-amber-950",
};

const CLASS_BORDER: Record<string, string> = {
  warrior: "border-red-700/60",
  rogue: "border-emerald-700/60",
  mage: "border-blue-700/60",
  tank: "border-amber-700/60",
};

const CLASS_ICON: Record<string, string> = {
  warrior: "⚔️",
  rogue: "🗡️",
  mage: "🔮",
  tank: "🛡️",
};

const ORIGIN_IMAGE: Record<string, string> = {
  human: "/images/generated/origin-human.png",
  orc: "/images/generated/origin-orc.png",
  skeleton: "/images/generated/origin-skeleton.png",
  demon: "/images/generated/origin-demon.png",
  dogfolk: "/images/generated/origin-dogfolk.png",
};

/* ────────────────── Stat row ────────────────── */

type StatRowProps = { label: string; value: number };
const StatRow = ({ label, value }: StatRowProps) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-slate-400">{label}</span>
    <span className="font-bold text-white">{value}</span>
  </div>
);

/* ────────────────── Screen states ────────────────── */

type ScreenState =
  | { kind: "select" }
  | { kind: "battle"; matchResult: MatchResult }
  | { kind: "result"; matchResult: MatchResult };

/* ────────────────── Arena Content ────────────────── */

function ArenaContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOpponents, setLoadingOpponents] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  const [fighting, setFighting] = useState(false);
  const [screen, setScreen] = useState<ScreenState>({ kind: "select" });
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(10);

  /* ── Load character ── */
  useEffect(() => {
    if (!characterId) return;
    const controller = new AbortController();
    const loadCharacter = async () => {
      try {
        const res = await fetch(`/api/characters/${characterId}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load character");
        const data = await res.json();
        setCharacter(data);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Character loading error");
      } finally {
        setLoading(false);
      }
    };
    loadCharacter();
    return () => controller.abort();
  }, [characterId]);

  /* ── Load opponents ── */
  const loadOpponentsControllerRef = useRef<AbortController | null>(null);
  const loadOpponents = useCallback(async () => {
    if (!characterId) return;
    loadOpponentsControllerRef.current?.abort();
    const controller = new AbortController();
    loadOpponentsControllerRef.current = controller;
    setLoadingOpponents(true);
    setError(null);
    setSelectedOpponent(null);
    try {
      const res = await fetch(`/api/pvp/opponents?characterId=${characterId}`, { signal: controller.signal });
      const data = await res.json();
      if (res.ok) {
        setOpponents(data.opponents ?? []);
      } else {
        setError(data.error ?? "Failed to load opponents");
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to load opponents");
    } finally {
      setLoadingOpponents(false);
    }
  }, [characterId]);

  useEffect(() => {
    loadOpponents();
  }, [loadOpponents]);

  /* ── Fight selected opponent ── */
  const handleFight = async () => {
    if (!characterId || !selectedOpponent || fighting) return;
    setError(null);
    setFighting(true);
    try {
      const res = await fetch("/api/pvp/find-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, opponentId: selectedOpponent }),
      });
      const data = (await res.json()) as MatchResult;
      if (!res.ok) {
        setError((data as unknown as { error: string }).error ?? "Error");
        return;
      }
      setAttemptsLeft((p) => Math.max(0, p - 1));
      setCharacter((c) =>
        c
          ? {
              ...c,
              currentStamina: c.currentStamina - STAMINA_COST,
              gold: c.gold + (data.rewards?.gold ?? 0),
              pvpRating: data.rewards?.newRating ?? c.pvpRating,
            }
          : null
      );
      setScreen({ kind: "battle", matchResult: data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Battle error");
    } finally {
      setFighting(false);
    }
  };

  /* ── Battle complete → show result modal ── */
  const handleBattleComplete = () => {
    if (screen.kind === "battle") {
      setScreen({ kind: "result", matchResult: screen.matchResult });
    }
  };

  /* ── Close result and refresh opponents ── */
  const handleCloseResult = () => {
    setScreen({ kind: "select" });
    loadOpponents();
  };

  /* ── Loading state ── */
  if (loading || !character) {
    return <PageLoader emoji="🏟️" text="Loading arena…" />;
  }

  /* ── Battle screen ── */
  if (screen.kind === "battle") {
    return (
      <CombatBattleScreen
        result={{
          winnerId: screen.matchResult.winnerId,
          loserId: screen.matchResult.loserId,
          draw: screen.matchResult.draw,
          turns: screen.matchResult.turns,
          log: screen.matchResult.log,
          playerSnapshot: screen.matchResult.playerSnapshot,
          enemySnapshot: screen.matchResult.enemySnapshot,
        }}
        playerId={character.id}
        onComplete={handleBattleComplete}
      />
    );
  }

  const canAfford = character.currentStamina >= STAMINA_COST;

  return (
    <div className="flex min-h-full flex-col p-4 lg:p-6">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold uppercase tracking-wider text-amber-400">
          Arena
        </h1>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
            Stamina{" "}
            <span className="font-bold text-amber-400">
              {character.currentStamina}/{character.maxStamina}
            </span>
          </span>
          <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
            Rating{" "}
            <span className="font-bold text-amber-400">
              {character.pvpRating}
            </span>
          </span>
        </div>
      </div>

      {/* Attempts */}
      <div className="mb-6 text-xs text-slate-500">
        {attemptsLeft}/10 <span className="text-slate-600">XP</span>
      </div>

      {/* Choose opponent */}
      <h2 className="mb-4 text-center text-sm font-semibold text-slate-300">
        Choose your opponent:
      </h2>

      {/* Error */}
      {error && (
        <p className="mb-4 text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Opponent cards */}
      {loadingOpponents ? (
        <div className="flex items-center justify-center py-16">
          <div className="relative mx-auto h-10 w-10">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400" />
            <div className="absolute inset-1.5 animate-spin rounded-full border-2 border-slate-700 border-t-purple-400" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            <span className="absolute inset-0 flex items-center justify-center text-sm">🏟️</span>
          </div>
        </div>
      ) : opponents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <p className="mb-3 text-4xl">🏜️</p>
          <p className="text-sm">No opponents available</p>
          <button
            type="button"
            onClick={loadOpponents}
            className="mt-3 rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-400 transition hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {opponents.map((opp) => {
            const isSelected = selectedOpponent === opp.id;
            const cls = opp.class.toLowerCase();

            return (
              <button
                key={opp.id}
                type="button"
                onClick={() => setSelectedOpponent(opp.id)}
                aria-label={`Select ${opp.characterName}`}
                tabIndex={0}
                className={`
                  group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300
                  ${
                    isSelected
                      ? "border-amber-500 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/50 scale-[1.02]"
                      : `${CLASS_BORDER[cls] ?? "border-slate-700/60"} hover:border-slate-500`
                  }
                  bg-slate-900/80
                `}
              >
                {/* Avatar area */}
                <div
                  className={`relative flex h-32 flex-col items-center justify-center overflow-hidden bg-gradient-to-b ${CLASS_GRADIENT[cls] ?? "from-slate-800 to-slate-900"}`}
                >
                  {opp.origin && ORIGIN_IMAGE[opp.origin] ? (
                    <Image
                      src={ORIGIN_IMAGE[opp.origin]}
                      alt={opp.origin}
                      width={1024}
                      height={1024}
                      className="absolute left-1/2 -top-5 w-[300%] max-w-none -translate-x-1/2"
                      sizes="384px"
                    />
                  ) : (
                    <span className="text-5xl drop-shadow-lg">
                      {CLASS_ICON[cls] ?? "👤"}
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                    <p className="truncate text-center text-xs font-bold text-white">
                      {opp.characterName}{" "}
                      <span className="text-amber-400">
                        (Lv. {opp.level})
                      </span>
                    </p>
                  </div>
                </div>

                {/* Rating bar */}
                <div className="flex justify-center border-b border-slate-800 bg-red-900/40 py-2">
                  <span className="text-sm font-extrabold tabular-nums text-red-400">
                    {opp.pvpRating.toLocaleString()}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <StatRow label="Strength" value={opp.strength} />
                  <StatRow label="Agility" value={opp.agility} />
                  <StatRow label="Intelligence" value={opp.intelligence} />
                  <StatRow label="Vitality" value={opp.vitality} />
                  <StatRow label="Luck" value={opp.luck} />
                </div>

                {/* Class label */}
                <div className="border-t border-slate-800 px-3 py-2 text-center text-[10px] uppercase tracking-widest text-slate-500">
                  {CLASS_LABEL[cls] ?? cls}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleFight}
          disabled={!selectedOpponent || fighting || !canAfford}
          aria-label="Start Battle"
          className={`
            flex-1 rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-lg transition
            ${
              selectedOpponent && canAfford
                ? "bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-900/40 hover:from-amber-500 hover:to-orange-500"
                : "bg-slate-800 text-slate-500"
            }
            disabled:opacity-50
          `}
        >
          {fighting
            ? "Fighting…"
            : selectedOpponent
              ? `⚔️ Attack (⚡ ${STAMINA_COST})`
              : "Choose opponent"}
        </button>
        <button
          type="button"
          onClick={loadOpponents}
          disabled={loadingOpponents}
          aria-label="Refresh opponents"
          className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-4 text-sm font-medium text-slate-400 transition hover:bg-slate-700 disabled:opacity-50"
        >
          🔄 Refresh
        </button>
      </div>

      {!canAfford && (
        <p className="mt-2 text-center text-xs text-slate-500">
          Not enough stamina. Need {STAMINA_COST}, you have{" "}
          {character.currentStamina}.
        </p>
      )}

      {/* Combat result modal */}
      {screen.kind === "result" && (
        <CombatResultModal
          open
          onClose={handleCloseResult}
          title={
            screen.matchResult.draw
              ? "Draw"
              : screen.matchResult.rewards.won
                ? "Victory!"
                : "Defeat"
          }
          turns={screen.matchResult.turns}
          rewards={screen.matchResult.rewards}
        />
      )}
    </div>
  );
}

/* ────────────────── Page wrapper ────────────────── */

export default function ArenaPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🏟️" text="Loading arena…" />}>
      <ArenaContent />
    </Suspense>
  );
}
