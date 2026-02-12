"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CombatBattleScreen from "@/app/components/CombatBattleScreen";
import CombatLootScreen from "@/app/components/CombatLootScreen";
import PageLoader from "@/app/components/PageLoader";

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

type DungeonBoss = {
  index: number;
  name: string;
  description: string;
  level: number;
  statMultiplier: number;
};

type DungeonTheme = {
  gradient: string;
  cardBg: string;
  accent: string;
  glowColor: string;
  borderGlow: string;
  icon: string;
};

type DungeonInfo = {
  id: string;
  name: string;
  subtitle: string;
  minLevel: number;
  staminaCost: number;
  prevDungeonId: string | null;
  bosses: DungeonBoss[];
  theme: DungeonTheme;
  unlocked: boolean;
  bossIndex: number;
  completed: boolean;
  currentBoss: DungeonBoss | null;
};

type FightResult = {
  victory?: boolean;
  dungeonComplete?: boolean;
  rewards?: { gold: number; xp: number };
  log?: CombatLogEntry[];
  playerSnapshot?: CombatantSnapshot;
  enemySnapshot?: CombatantSnapshot;
  goldEarned?: number;
  xpEarned?: number;
  droppedItem?: { itemId: string | null; rarity: string } | null;
  bossIndex?: number;
  nextBossIndex?: number;
  dungeonName?: string;
  message?: string;
};

/* ────────────────── Screen state ────────────────── */

type DungeonScreen =
  | { kind: "list" }
  | { kind: "detail"; dungeon: DungeonInfo }
  | {
      kind: "boss";
      dungeon: DungeonInfo;
      runId: string;
      boss: { name: string; description: string; hp: number; maxHp: number };
    }
  | { kind: "battle"; dungeon: DungeonInfo; runId: string; fightResult: FightResult }
  | { kind: "loot"; dungeon: DungeonInfo; fightResult: FightResult }
  | { kind: "complete"; dungeon: DungeonInfo; fightResult: FightResult }
  | { kind: "defeat"; dungeon: DungeonInfo; fightResult: FightResult };

/* ────────────────── Lore data ────────────────── */

type DungeonLore = {
  tagline: string;
  paragraphs: string[];
  quote?: { text: string; author: string };
};

const DUNGEON_LORE: Record<string, DungeonLore> = {
  training_camp: {
    tagline: "Where pups become warriors",
    paragraphs: [
      "On the outskirts of the Stray City lies an old training ground, built by the first Arena fighters.",
      "No real enemies here — only wooden dummies, straw golems, and rusty training machines that sometimes… come alive.",
      "But at night the dummies start moving on their own. They say weak spirits from the depths of the Dungeons possess them.",
    ],
    quote: {
      text: "If you can't beat wood — the darkness will swallow you.",
      author: "Old Instructor Fang",
    },
  },
  realm_of_light: {
    tagline: "Where light burns brighter than fire",
    paragraphs: [
      "Beneath the city lie the Shining Catacombs — an ancient temple of the Order of Light.",
      "Marble halls bathed in warm golden glow. Floating fireflies light the way. But around every corner — animated statues, radiant guardians, and crystal beasts.",
      "The deeper the floor — the brighter the light. And the deadlier the foes.",
    ],
    quote: {
      text: "They say the Heart of the Ray lies at the very center — an artifact that empowers any fighter. But no one has returned from the last floor the same.",
      author: "Ancient Scroll",
    },
  },
  shadow_realm: {
    tagline: "Where the darkness stares back",
    paragraphs: [
      "Where light ends — the Whisper begins.",
      "Shadow Realm is a rift beneath the world. The ground pulses here, walls breathe, and darkness stares back at you.",
      "Shadows take the shape of fears. Monsters emerge from smoke. Sometimes your own silhouette attacks you.",
    ],
    quote: {
      text: "Dark relics. Shards of forbidden power. Legendary loot with odds found nowhere else. Only hardened warriors dare to descend.",
      author: "Guild Legend",
    },
  },
};

/* ────────────────── Component ────────────────── */

function DungeonContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [dungeons, setDungeons] = useState<DungeonInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [fighting, setFighting] = useState(false);
  const [screen, setScreen] = useState<DungeonScreen>({ kind: "list" });
  const [error, setError] = useState<string | null>(null);

  /* ── Load character + dungeons ── */
  const loadData = useCallback(async () => {
    if (!characterId) return;
    setLoading(true);
    setError(null);
    try {
      const [charRes, dungeonRes] = await Promise.all([
        fetch(`/api/characters/${characterId}`),
        fetch(`/api/dungeons?characterId=${characterId}`),
      ]);
      if (!charRes.ok) throw new Error("Failed to load character");
      if (!dungeonRes.ok) throw new Error("Failed to load dungeons");
      const charData = await charRes.json();
      const dungeonData = await dungeonRes.json();
      setCharacter(charData);
      setDungeons(dungeonData.dungeons ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Loading error");
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Start dungeon run ── */
  const handleStart = async (dungeon: DungeonInfo) => {
    if (!characterId || starting) return;
    setError(null);
    if (character && character.currentStamina < dungeon.staminaCost) {
      setError("Not enough stamina");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch("/api/dungeons/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, dungeonId: dungeon.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      setCharacter((c) =>
        c ? { ...c, currentStamina: c.currentStamina - dungeon.staminaCost } : null
      );
      setScreen({
        kind: "boss",
        dungeon,
        runId: data.runId,
        boss: {
          name: data.boss.name,
          description: data.boss.description,
          hp: data.boss.hp,
          maxHp: data.boss.maxHp,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setStarting(false);
    }
  };

  /* ── Fight boss ── */
  const handleFight = async () => {
    if (screen.kind !== "boss" || fighting) return;
    setError(null);
    setFighting(true);
    try {
      const res = await fetch(`/api/dungeons/run/${screen.runId}/fight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as FightResult;

      if (data.playerSnapshot && data.enemySnapshot && data.log) {
        setScreen({ kind: "battle", dungeon: screen.dungeon, runId: screen.runId, fightResult: data });
      } else {
        handleFightResultDirect(data, screen.dungeon);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setFighting(false);
    }
  };

  /* Process fight result */
  const handleFightResultDirect = (data: FightResult, dungeon: DungeonInfo) => {
    if (!data.victory) {
      setScreen({ kind: "defeat", dungeon, fightResult: data });
      return;
    }
    // Rewards saved server-side — notify sidebar to refresh
    window.dispatchEvent(new Event("character-updated"));
    if (data.dungeonComplete) {
      setCharacter((c) =>
        c && data.rewards ? { ...c, gold: (c.gold ?? 0) + data.rewards.gold } : c
      );
      setScreen({ kind: "complete", dungeon, fightResult: data });
      return;
    }
    setScreen({ kind: "loot", dungeon, fightResult: data });
  };

  const handleBattleComplete = () => {
    if (screen.kind !== "battle") return;
    handleFightResultDirect(screen.fightResult, screen.dungeon);
  };

  const handleLootContinue = () => {
    // Boss defeated, go back to list (run is already deleted, need to reload)
    loadData();
    setScreen({ kind: "list" });
    window.dispatchEvent(new Event("character-updated"));
  };

  const handleBackToList = () => {
    loadData();
    setScreen({ kind: "list" });
    setError(null);
    window.dispatchEvent(new Event("character-updated"));
  };

  /* ── Loading ── */
  if (loading || !character) {
    return <PageLoader emoji="🏰" text="Loading dungeons…" />;
  }

  /* ══════════════════════════════════════════
     BATTLE SCREEN — animated combat
     ══════════════════════════════════════════ */
  if (screen.kind === "battle" && screen.fightResult.playerSnapshot && screen.fightResult.enemySnapshot) {
    return (
      <CombatBattleScreen
        result={{
          winnerId: screen.fightResult.victory ? character.id : "boss",
          loserId: screen.fightResult.victory ? "boss" : character.id,
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
     LOOT SCREEN — after winning a boss fight
     ══════════════════════════════════════════ */
  if (screen.kind === "loot") {
    const bossName = screen.fightResult.enemySnapshot?.name ?? "Boss";
    return (
      <CombatLootScreen
        enemy={{ name: bossName, class: screen.fightResult.enemySnapshot?.class }}
        rewards={{
          gold: screen.fightResult.goldEarned,
          xp: screen.fightResult.xpEarned,
          droppedItem: screen.fightResult.droppedItem,
        }}
        onContinue={handleLootContinue}
      />
    );
  }

  /* ══════════════════════════════════════════
     BOSS ENCOUNTER — pre-fight screen
     ══════════════════════════════════════════ */
  if (screen.kind === "boss") {
    const { boss, dungeon } = screen;
    const hpPercent = Math.round((boss.hp / boss.maxHp) * 100);

    return (
      <div className="flex min-h-full flex-col p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              aria-label="Back to dungeons"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-sm text-slate-400 transition hover:bg-slate-700 hover:text-white"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-white">
              {dungeon.theme.icon} {dungeon.name}
            </h1>
          </div>
          <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
            Stamina{" "}
            <span className="font-bold text-amber-400">
              {character.currentStamina}/{character.maxStamina}
            </span>
          </span>
        </div>

        {/* Boss card */}
        <div className={`mb-6 overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b ${dungeon.theme.cardBg} p-6`}>
          <div className="mb-1 flex items-center justify-between text-sm text-slate-400">
            <span>
              Boss{" "}
              <span className="font-bold text-white">
                {(screen.dungeon.bossIndex ?? 0) + 1}
              </span>{" "}
              / {dungeon.bosses.length}
            </span>
          </div>
          <h2 className="mb-1 text-lg font-bold text-red-400">{boss.name}</h2>
          <p className="mb-3 text-xs italic text-slate-500">{boss.description}</p>

          {/* HP bar */}
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>HP</span>
            <span>
              {boss.hp} / {boss.maxHp}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleFight}
            disabled={fighting}
            aria-label="Fight Boss"
            className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-900/40 transition hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
          >
            {fighting ? "Fighting…" : "⚔️ Fight Boss"}
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DUNGEON COMPLETE
     ══════════════════════════════════════════ */
  if (screen.kind === "complete") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md rounded-2xl border border-green-700/60 bg-gradient-to-b from-green-900/30 to-slate-900/80 p-6 text-center">
          <p className="mb-1 text-3xl">🏆</p>
          <p className="text-lg font-bold text-green-400">
            {screen.dungeon.name} Complete!
          </p>
          <p className="mt-1 text-xs text-slate-500">All bosses defeated</p>
          {screen.fightResult.rewards && (
            <p className="mt-2 text-sm text-slate-300">
              Gold:{" "}
              <span className="font-bold text-yellow-400">
                +{screen.fightResult.rewards.gold}
              </span>{" "}
              · XP:{" "}
              <span className="font-bold text-blue-400">
                +{screen.fightResult.rewards.xp}
              </span>
            </p>
          )}
          <button
            type="button"
            onClick={handleBackToList}
            aria-label="Back to Dungeons"
            className="mt-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:from-amber-500 hover:to-orange-500"
          >
            ← Back to Dungeons
          </button>
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
          <p className="text-lg font-bold text-red-400">Defeat</p>
          <p className="mt-2 text-sm text-slate-400">
            The boss was too strong. Prepare and try again.
          </p>
          <button
            type="button"
            onClick={handleBackToList}
            aria-label="Back to Dungeons"
            className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
          >
            ← Back to Dungeons
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DETAIL — dungeon info with lore
     ══════════════════════════════════════════ */
  if (screen.kind === "detail") {
    const { dungeon } = screen;
    const lore = DUNGEON_LORE[dungeon.id];
    const canAfford = character.currentStamina >= dungeon.staminaCost;
    const canStart = dungeon.unlocked && !dungeon.completed && canAfford;

    return (
      <div className="flex min-h-full flex-col p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToList}
            aria-label="Back to dungeons"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-sm text-slate-400 transition hover:bg-slate-700 hover:text-white"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {dungeon.theme.icon} {dungeon.name}
            </h1>
            <p className="text-xs text-slate-500">{dungeon.subtitle}</p>
          </div>
          <span className="ml-auto rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
            ⚡ {dungeon.staminaCost} Energy
          </span>
        </div>

        {/* Lore section */}
        {lore && (
          <div className={`mb-6 rounded-2xl border border-slate-700/40 bg-gradient-to-b ${dungeon.theme.cardBg} p-5`}>
            <p className="mb-3 text-xs font-medium italic text-slate-400">{lore.tagline}</p>
            <div className="mb-3 space-y-2">
              {lore.paragraphs.map((p, i) => (
                <p key={i} className="text-xs leading-relaxed text-slate-400/90">{p}</p>
              ))}
            </div>
            {lore.quote && (
              <blockquote className="border-l-2 border-slate-600/50 pl-3">
                <p className="text-[11px] italic leading-relaxed text-slate-500">
                  &ldquo;{lore.quote.text}&rdquo;
                </p>
                <cite className="mt-0.5 block text-[10px] not-italic text-slate-600">
                  — {lore.quote.author}
                </cite>
              </blockquote>
            )}
          </div>
        )}

        {/* Boss progress */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
            Bosses ({dungeon.bossIndex}/{dungeon.bosses.length})
          </h2>
          <div className="space-y-2">
            {dungeon.bosses.map((boss) => {
              const isDefeated = boss.index < dungeon.bossIndex;
              const isCurrent = boss.index === dungeon.bossIndex && !dungeon.completed;
              return (
                <div
                  key={boss.index}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    isCurrent
                      ? "border-amber-500/50 bg-amber-950/20"
                      : isDefeated
                        ? "border-green-800/30 bg-green-950/10"
                        : "border-slate-800/50 bg-slate-900/30 opacity-50"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-sm">
                    {isDefeated ? "✅" : isCurrent ? "⚔️" : "🔒"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${isCurrent ? "text-amber-400" : isDefeated ? "text-green-400/70" : "text-slate-600"}`}>
                      {boss.name}
                    </p>
                    <p className="truncate text-[10px] text-slate-600">{boss.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-600">Lv.{boss.level}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 text-sm text-red-400" role="alert">{error}</p>
        )}

        {/* Action button */}
        {dungeon.completed ? (
          <div className="rounded-xl border border-green-800/40 bg-green-950/20 px-4 py-3 text-center text-sm font-medium text-green-400">
            ✅ Dungeon Completed
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleStart(dungeon)}
            disabled={!canStart || starting}
            aria-label="Enter Dungeon"
            className={`
              w-full rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-lg transition
              ${
                canStart
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-900/40 hover:from-amber-500 hover:to-orange-500 hover:shadow-xl"
                  : "bg-slate-800 text-slate-500"
              }
              disabled:opacity-50
            `}
          >
            {starting
              ? "Preparing…"
              : !dungeon.unlocked
                ? "🔒 Locked"
                : !canAfford
                  ? `Not enough stamina (need ${dungeon.staminaCost})`
                  : `⚔️ Fight ${dungeon.currentBoss?.name ?? "Boss"} (⚡ ${dungeon.staminaCost})`}
          </button>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     LIST — dungeon picker
     ══════════════════════════════════════════ */
  return (
    <div className="flex min-h-full flex-col p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">🏰 Dungeons</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Defeat 10 bosses in sequence to conquer each dungeon.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">
            <strong className="text-white">{character.characterName}</strong> ·
            Lv. {character.level}
          </span>
          <span className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
            Stamina{" "}
            <span className="font-bold text-amber-400">
              {character.currentStamina}/{character.maxStamina}
            </span>
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mb-4 text-sm text-red-400" role="alert">{error}</p>
      )}

      {/* Dungeon grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {dungeons.map((dungeon) => {
          const progressPercent = Math.round(
            (dungeon.bossIndex / dungeon.bosses.length) * 100
          );

          return (
            <button
              key={dungeon.id}
              type="button"
              onClick={() =>
                dungeon.unlocked
                  ? setScreen({ kind: "detail", dungeon })
                  : undefined
              }
              disabled={!dungeon.unlocked}
              aria-label={`${dungeon.unlocked ? "Open" : "Locked"} ${dungeon.name}`}
              tabIndex={0}
              className={`
                group relative w-full overflow-hidden rounded-2xl border-2 text-left
                transition-all duration-300
                ${
                  dungeon.unlocked
                    ? `border-slate-700/40 ${dungeon.theme.borderGlow} hover:border-slate-600 cursor-pointer`
                    : "border-slate-800/30 opacity-40 grayscale cursor-not-allowed"
                }
              `}
            >
              {/* Background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${dungeon.theme.cardBg} opacity-90`} />

              {/* Content */}
              <div className="relative flex items-center gap-4 p-4">
                {/* Icon */}
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${dungeon.theme.gradient} shadow-lg`}
                >
                  <span className="text-2xl drop-shadow-md">{dungeon.theme.icon}</span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{dungeon.name}</h3>
                    {dungeon.completed && (
                      <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[9px] font-bold text-green-400">
                        COMPLETE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">{dungeon.subtitle}</p>

                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          dungeon.completed
                            ? "bg-green-500"
                            : "bg-gradient-to-r from-amber-600 to-amber-400"
                        }`}
                        style={{ width: `${dungeon.completed ? 100 : progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {dungeon.bossIndex}/{dungeon.bosses.length}
                    </span>
                  </div>
                </div>

                {/* Cost / Level badge */}
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-md bg-black/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-sm">
                    ⚡ {dungeon.staminaCost}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    Lv. {dungeon.minLevel}+
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────── Page wrapper ────────────────── */

export default function DungeonPage() {
  return (
    <Suspense fallback={<PageLoader emoji="🏰" text="Loading dungeons…" />}>
      <DungeonContent />
    </Suspense>
  );
}
