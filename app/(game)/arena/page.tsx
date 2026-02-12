"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import CombatBattleScreen from "@/app/components/CombatBattleScreen";
import CombatResultModal from "@/app/components/CombatResultModal";
import PageLoader from "@/app/components/PageLoader";
import HeroCard from "@/app/components/HeroCard";

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
const HP_PER_VIT = 10;
const getMaxHp = (vit: number) => Math.max(100, vit * HP_PER_VIT);

const CLASS_LABEL: Record<string, string> = {
  warrior: "Warrior",
  rogue: "Rogue",
  mage: "Mage",
  tank: "Tank",
};

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
    <div className="relative flex min-h-full flex-col p-4 lg:p-6">
      {/* Arena background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/images/generated/arena-background.png"
          alt=""
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      </div>
      {/* Content wrapper above background */}
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
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
            const cls = opp.class.toLowerCase();
            const maxHp = getMaxHp(opp.vitality);

            return (
              <HeroCard
                key={opp.id}
                name={opp.characterName}
                className={cls}
                origin={opp.origin}
                level={opp.level}
                rating={opp.pvpRating}
                hp={{ current: maxHp, max: maxHp }}
                selected={selectedOpponent === opp.id}
                onClick={() => setSelectedOpponent(opp.id)}
                ariaLabel={`Select ${opp.characterName}`}
                stats={{
                  strength: opp.strength,
                  agility: opp.agility,
                  intelligence: opp.intelligence,
                  vitality: opp.vitality,
                  luck: opp.luck,
                }}
              />
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
      </div>{/* end content wrapper */}
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
