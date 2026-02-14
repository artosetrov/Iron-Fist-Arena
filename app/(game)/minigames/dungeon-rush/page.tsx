"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import CombatBattleScreen from "@/app/components/CombatBattleScreen";
import CombatLootScreen from "@/app/components/CombatLootScreen";
import PageLoader from "@/app/components/PageLoader";
import GameIcon from "@/app/components/ui/GameIcon";
import { GameButton, PageContainer } from "@/app/components/ui";
/* ────────────────── Types ────────────────── */

type Character = {
  id: string;
  characterName: string;
  level: number;
  currentStamina: number;
  maxStamina: number;
  gold?: number;
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

type FightResult = {
  victory?: boolean;
  wave?: number;
  totalWaves?: number;
  isFullClear?: boolean;
  log?: CombatLogEntry[];
  playerSnapshot?: CombatantSnapshot;
  enemySnapshot?: CombatantSnapshot;
  goldEarned?: number;
  xpEarned?: number;
  fullClearBonus?: number;
  accumulatedGold?: number;
  accumulatedXp?: number;
  nextWave?: number | null;
  message?: string;
};

/* ────────────────── Screen state ────────────────── */

type RushScreen =
  | { kind: "ready"; runId: string | null; wave: number }
  | { kind: "starting" }
  | { kind: "fighting"; runId: string; wave: number }
  | { kind: "battle"; runId: string; wave: number; fightResult: FightResult }
  | { kind: "wave_result"; runId: string; fightResult: FightResult }
  | { kind: "complete"; fightResult: FightResult }
  | { kind: "defeat"; fightResult: FightResult };

/* ────────────────── Mob avatars ────────────────── */

const MOB_EMOJIS: Record<string, string> = {
  "Goblin Thug": "👺",
  "Cave Rat": "🐀",
  "Orc Grunt": "👹",
  "Feral Wolf": "🐺",
  "Skeleton Scout": "💀",
  "Mushroom Creep": "🍄",
  "Bandit Rogue": "🗡️",
  "Plague Bat": "🦇",
  "Swamp Toad": "🐸",
  "Ember Imp": "😈",
  "Stone Golem Shard": "🗿",
  "Shadow Wisp": "🌑",
  "Crypt Spider": "🕷️",
  "Dust Wraith": "🌫️",
  "Iron Beetle": "🪲",
  "Frost Sprite": "❄️",
  "Lava Slime": "🫧",
  "Rot Zombie": "🧟",
  "Sand Scorpion": "🦂",
  "Vine Creeper": "🌿",
};

const STAMINA_COST = 3;
const TOTAL_WAVES = 5;

/* ────────────────── Component ────────────────── */

const DungeonRushContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screen, setScreen] = useState<RushScreen>({ kind: "ready", runId: null, wave: 1 });

  const [abandoning, setAbandoning] = useState(false);

  /* ── Load character + check active run ── */
  const loadCharacter = useCallback(async () => {
    if (!characterId) return;
    setLoading(true);
    try {
      const [charRes, statusRes] = await Promise.all([
        fetch(`/api/characters/${characterId}`),
        fetch(`/api/dungeon-rush/status?characterId=${characterId}`),
      ]);
      if (!charRes.ok) throw new Error("Failed to load character");
      const charData = await charRes.json();
      setCharacter(charData);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.activeRun) {
          setScreen({
            kind: "ready",
            runId: statusData.activeRun.runId,
            wave: statusData.activeRun.currentWave,
          });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Loading error");
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    loadCharacter();
  }, [loadCharacter]);

  /* ── Abandon run ── */
  const handleAbandon = async () => {
    if (!characterId) return;
    setAbandoning(true);
    setError(null);
    try {
      const res = await fetch("/api/dungeon-rush/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error abandoning run");
        return;
      }
      setScreen({ kind: "ready", runId: null, wave: 1 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setAbandoning(false);
    }
  };

  /* ── Start run ── */
  const handleStart = async () => {
    if (!characterId || !character) return;
    setError(null);

    if (character.currentStamina < STAMINA_COST) {
      setError(`Not enough stamina (need ${STAMINA_COST})`);
      return;
    }

    setScreen({ kind: "starting" });

    try {
      const res = await fetch("/api/dungeon-rush/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If there's already an active run, reload status to recover it
        if (data.error?.includes("active run")) {
          await loadCharacter();
          return;
        }
        setError(data.error ?? "Error starting run");
        setScreen({ kind: "ready", runId: null, wave: 1 });
        return;
      }

      setCharacter((c) =>
        c ? { ...c, currentStamina: c.currentStamina - STAMINA_COST } : null,
      );
      window.dispatchEvent(new Event("character-updated"));

      setScreen({
        kind: "ready",
        runId: data.runId,
        wave: data.currentWave,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setScreen({ kind: "ready", runId: null, wave: 1 });
    }
  };

  /* ── Fight wave ── */
  const handleFight = async (runId: string, wave: number) => {
    setError(null);
    setScreen({ kind: "fighting", runId, wave });

    try {
      const res = await fetch("/api/dungeon-rush/fight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      const data = (await res.json()) as FightResult;

      if (data.playerSnapshot && data.enemySnapshot && data.log) {
        setScreen({ kind: "battle", runId, wave, fightResult: data });
      } else {
        handleFightDone(data, runId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setScreen({ kind: "ready", runId, wave });
    }
  };

  /* ── Process fight result ── */
  const handleFightDone = (data: FightResult, runId: string) => {
    window.dispatchEvent(new Event("character-updated"));

    if (!data.victory) {
      setScreen({ kind: "defeat", fightResult: data });
      return;
    }

    if (data.isFullClear) {
      setScreen({ kind: "complete", fightResult: data });
      return;
    }

    setScreen({ kind: "wave_result", runId, fightResult: data });
  };

  const handleBattleComplete = () => {
    if (screen.kind !== "battle") return;
    handleFightDone(screen.fightResult, screen.runId);
  };

  const handleNextWave = () => {
    if (screen.kind !== "wave_result") return;
    const nextWave = screen.fightResult.nextWave ?? 1;
    setScreen({ kind: "ready", runId: screen.runId, wave: nextWave });
  };

  const handleBackToTavern = () => {
    window.dispatchEvent(new Event("character-updated"));
    router.push(`/minigames?characterId=${characterId}`);
  };

  /* ── Loading ── */
  if (loading || !character) {
    return <PageLoader icon={<GameIcon name="dungeon-rush" size={32} />} text="Preparing Dungeon Rush..." />;
  }

  /* ══════════════════════════════════════════
     BATTLE SCREEN — animated combat
     ══════════════════════════════════════════ */
  if (
    screen.kind === "battle" &&
    screen.fightResult.playerSnapshot &&
    screen.fightResult.enemySnapshot
  ) {
    return (
      <CombatBattleScreen
        result={{
          winnerId: screen.fightResult.victory ? character.id : "rush_mob",
          loserId: screen.fightResult.victory ? "rush_mob" : character.id,
          draw: false,
          turns: screen.fightResult.log?.length ?? 0,
          log: screen.fightResult.log ?? [],
          playerSnapshot: screen.fightResult.playerSnapshot,
          enemySnapshot: screen.fightResult.enemySnapshot,
        }}
        playerId={character.id}
        onComplete={handleBattleComplete}
      />
    );
  }

  /* ══════════════════════════════════════════
     WAVE RESULT — after winning a wave (not full clear)
     ══════════════════════════════════════════ */
  if (screen.kind === "wave_result") {
    const mobName = screen.fightResult.enemySnapshot?.name ?? "Mob";
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md rounded-2xl border border-emerald-700/60 bg-gradient-to-b from-emerald-900/30 to-slate-900/80 p-6 text-center">
          <p className="mb-1 text-3xl">
            {MOB_EMOJIS[mobName] ?? "⚔️"}
          </p>
          <p className="font-display text-xl text-emerald-400">
            Wave {screen.fightResult.wave}/{TOTAL_WAVES} Cleared!
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {mobName} defeated
          </p>

          {/* Rewards */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex flex-col items-center text-center">
              <GameIcon name="gold" size={20} />
              <p className="font-bold text-yellow-400">+{screen.fightResult.goldEarned}</p>
              <p className="text-[10px] text-slate-500">Gold</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <GameIcon name="xp" size={20} />
              <p className="font-bold text-blue-400">+{screen.fightResult.xpEarned}</p>
              <p className="text-[10px] text-slate-500">XP</p>
            </div>
          </div>

          {/* Accumulated */}
          <div className="mt-3 rounded-lg border border-slate-700/40 bg-slate-800/40 px-3 py-2 text-xs text-slate-400">
            Total earned: {screen.fightResult.accumulatedGold} gold, {screen.fightResult.accumulatedXp} XP
          </div>

          {/* Progress pips */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: TOTAL_WAVES }, (_, i) => {
              const waveNum = i + 1;
              const currentWave = screen.fightResult.wave ?? 0;
              const isDone = waveNum <= currentWave;
              return (
                <div
                  key={waveNum}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40"
                      : "border border-slate-700 bg-slate-800 text-slate-500"
                  }`}
                >
                  {isDone ? "✓" : waveNum}
                </div>
              );
            })}
          </div>

          <GameButton
            fullWidth
            onClick={handleNextWave}
            aria-label="Next Wave"
            className="mt-5"
          >
            <span className="inline-flex items-center gap-1.5"><GameIcon name="fights" size={16} /> Next Wave ({(screen.fightResult.nextWave ?? 0)}/{TOTAL_WAVES})</span>
          </GameButton>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     FULL CLEAR — all 5 waves beaten
     ══════════════════════════════════════════ */
  if (screen.kind === "complete") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md rounded-2xl border border-amber-600/60 bg-gradient-to-b from-amber-900/30 to-slate-900/80 p-6 text-center">
          <p className="mb-1"><GameIcon name="leaderboard" size={40} /></p>
          <p className="font-display text-2xl text-amber-400">
            Dungeon Rush Complete!
          </p>
          <p className="mt-1 text-xs text-slate-500">
            All {TOTAL_WAVES} waves cleared
          </p>

          {/* Total rewards */}
          <div className="mt-5 flex items-center justify-center gap-8 text-sm">
            <div className="flex flex-col items-center text-center">
              <GameIcon name="gold" size={28} />
              <p className="font-display text-xl text-yellow-400">
                +{screen.fightResult.accumulatedGold}
              </p>
              <p className="text-[10px] text-slate-500">Total Gold</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <GameIcon name="xp" size={28} />
              <p className="font-display text-xl text-blue-400">
                +{screen.fightResult.accumulatedXp}
              </p>
              <p className="text-[10px] text-slate-500">Total XP</p>
            </div>
          </div>

          {screen.fightResult.fullClearBonus ? (
            <div className="mt-3 rounded-lg border border-amber-600/30 bg-amber-900/20 px-3 py-2 text-xs font-medium text-amber-300">
              Full clear bonus: +{screen.fightResult.fullClearBonus} gold
            </div>
          ) : null}

          {/* All pips filled */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: TOTAL_WAVES }, (_, i) => (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white shadow-lg shadow-amber-900/40"
              >
                ✓
              </div>
            ))}
          </div>

          <GameButton
            fullWidth
            onClick={handleBackToTavern}
            aria-label="Back to Tavern"
            className="mt-5"
          >
            ← Back to Tavern
          </GameButton>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DEFEAT
     ══════════════════════════════════════════ */
  if (screen.kind === "defeat") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-700/60 bg-gradient-to-b from-red-900/30 to-slate-900/80 p-6 text-center">
          <p className="mb-1 text-3xl">💀</p>
          <p className="font-display text-xl text-red-400">Defeat</p>
          <p className="mt-1 text-xs text-slate-500">
            Fell on wave {screen.fightResult.wave}/{TOTAL_WAVES}
          </p>

          {/* Accumulated rewards (already granted per-wave) */}
          {(screen.fightResult.accumulatedGold ?? 0) > 0 ||
          (screen.fightResult.accumulatedXp ?? 0) > 0 ? (
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex flex-col items-center text-center">
                <GameIcon name="gold" size={20} />
                <p className="font-bold text-yellow-400">
                  {screen.fightResult.accumulatedGold}
                </p>
                <p className="text-[10px] text-slate-500">Gold earned</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <GameIcon name="xp" size={20} />
                <p className="font-bold text-blue-400">
                  {screen.fightResult.accumulatedXp}
                </p>
                <p className="text-[10px] text-slate-500">XP earned</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No rewards earned this run.
            </p>
          )}

          {/* Wave progress pips */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {Array.from({ length: TOTAL_WAVES }, (_, i) => {
              const waveNum = i + 1;
              const failedWave = screen.fightResult.wave ?? 1;
              const isDone = waveNum < failedWave;
              const isFailed = waveNum === failedWave;
              return (
                <div
                  key={waveNum}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isFailed
                        ? "bg-red-600 text-white"
                        : "border border-slate-700 bg-slate-800 text-slate-500"
                  }`}
                >
                  {isDone ? "✓" : isFailed ? "✗" : waveNum}
                </div>
              );
            })}
          </div>

          <GameButton
            variant="secondary"
            fullWidth
            onClick={handleBackToTavern}
            aria-label="Back to Tavern"
            className="mt-5"
          >
            ← Back to Tavern
          </GameButton>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     READY / PRE-FIGHT — show wave info + fight button
     ══════════════════════════════════════════ */
  const isStarting = screen.kind === "starting";
  const isFighting = screen.kind === "fighting";
  const canAfford = character.currentStamina >= STAMINA_COST;
  const hasRun = screen.kind === "ready" && screen.runId !== null;
  const currentWave = screen.kind === "ready" ? screen.wave : 1;

  return (
    <div className="relative flex min-h-full flex-col items-center justify-center p-4 lg:p-6">
      {/* Back button — top-left */}
      <button
        type="button"
        onClick={handleBackToTavern}
        aria-label="Back to Tavern"
        className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white lg:left-6 lg:top-6"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Close button — top-right */}
      <Link
        href="/hub"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white lg:right-6 lg:top-6"
        aria-label="Back to Hub"
        tabIndex={0}
      >
        ✕
      </Link>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="relative mb-6 flex items-center justify-center">
          <h1 className="text-center font-display text-2xl font-bold uppercase text-white">Dungeon Rush</h1>
          <div className="absolute right-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
              <GameIcon name="stamina" size={14} />
              <span className="font-bold text-amber-400">
                {character.currentStamina}/{character.maxStamina}
              </span>
            </span>
          </div>
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-6 text-center">
          {/* Wave progress pips */}
          <div className="mb-5 flex items-center justify-center gap-2">
            {Array.from({ length: TOTAL_WAVES }, (_, i) => {
              const waveNum = i + 1;
              const isDone = hasRun && waveNum < currentWave;
              const isCurrent = hasRun && waveNum === currentWave;
              return (
                <div
                  key={waveNum}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                      : isCurrent
                        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-900/40 ring-2 ring-amber-400/50"
                        : "border border-slate-700 bg-slate-800 text-slate-500"
                  }`}
                >
                  {isDone ? "✓" : waveNum}
                </div>
              );
            })}
          </div>

          {hasRun ? (
            <>
              <p className="font-display text-3xl text-white">
                Wave {currentWave}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Defeat the enemy to advance
              </p>
            </>
          ) : (
            <>
              <p className="mb-2"><GameIcon name="dungeon-rush" size={40} /></p>
              <p className="font-display text-2xl text-white">Dungeon Rush</p>
              <p className="mt-1 text-xs text-slate-400">
                5 waves of PvE combat. Earn XP and Gold!
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1">
                  <GameIcon name="stamina" size={14} /> {STAMINA_COST} Energy
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1">
                  <GameIcon name="gold" size={14} /> Up to 800 Gold
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1">
                  <GameIcon name="xp" size={14} /> Up to 300 XP
                </span>
              </div>
            </>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-6 space-y-3">
            {hasRun ? (
              <>
                <GameButton
                  size="lg"
                  fullWidth
                  onClick={() => handleFight(screen.runId!, currentWave)}
                  disabled={isFighting || abandoning}
                  aria-label={`Fight Wave ${currentWave}`}
                >
                  {isFighting ? "Fighting..." : <span className="inline-flex items-center gap-1.5"><GameIcon name="fights" size={16} /> Fight Wave {currentWave}</span>}
                </GameButton>
                <GameButton
                  variant="secondary"
                  fullWidth
                  onClick={handleAbandon}
                  disabled={abandoning || isFighting}
                  aria-label="Abandon Run"
                >
                  {abandoning ? "Abandoning..." : "🚪 Abandon Run"}
                </GameButton>
              </>
            ) : (
              <GameButton
                size="lg"
                fullWidth
                onClick={handleStart}
                disabled={isStarting || !canAfford}
                aria-label="Start Dungeon Rush"
                className={!canAfford ? "bg-slate-800 text-slate-500" : ""}
              >
                {isStarting
                  ? "Preparing..."
                  : !canAfford
                    ? `Not enough stamina (need ${STAMINA_COST})`
                    : <span className="inline-flex items-center gap-1.5"><GameIcon name="dungeon-rush" size={16} /> Start Rush (<GameIcon name="stamina" size={14} />{STAMINA_COST})</span>}
              </GameButton>
            )}
          </div>
        </div>

        {/* Reward breakdown */}
        <div className="mt-4 rounded-xl border border-slate-700/40 bg-slate-900/40 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Reward Breakdown
          </p>
          <div className="space-y-1.5 text-xs text-slate-400">
            {Array.from({ length: TOTAL_WAVES }, (_, i) => {
              const w = i + 1;
              return (
                <div key={w} className="flex items-center justify-between">
                  <span>Wave {w}</span>
                  <span>
                    <span className="text-yellow-400">{40 * w}g</span>
                    {" + "}
                    <span className="text-blue-400">{20 * w} XP</span>
                  </span>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t border-slate-700/40 pt-1.5 font-bold text-amber-400">
              <span>Full Clear Bonus</span>
              <span>+200g</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────── Page wrapper ────────────────── */

const DungeonRushPage = () => (
  <Suspense fallback={<PageLoader icon={<GameIcon name="dungeon-rush" size={32} />} text="Preparing Dungeon Rush..." />}>
    <DungeonRushContent />
  </Suspense>
);

export default DungeonRushPage;
