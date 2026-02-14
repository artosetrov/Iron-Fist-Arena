"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import dynamic from "next/dynamic";

const CombatBattleScreen = dynamic(
  () => import("@/app/components/CombatBattleScreen"),
  { ssr: false },
);
const CombatResultModal = dynamic(
  () => import("@/app/components/CombatResultModal"),
  { ssr: false },
);
const CombatLoadingScreen = dynamic(
  () => import("@/app/components/CombatLoadingScreen"),
  { ssr: false },
);
import PageLoader from "@/app/components/PageLoader";
import HeroCard from "@/app/components/HeroCard";
import { GameButton, PageContainer } from "@/app/components/ui";
import GameIcon from "@/app/components/ui/GameIcon";
import type { GameIconKey } from "@/app/components/ui/GameIcon";
import {
  collectBattleAssets,
  preloadImages,
} from "@/lib/game/preload-combat-assets";

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
  icon: GameIconKey;
  description: string;
  /** Weight applied to player VIT when computing dummy HP */
  vitW: number;
};

const PRESETS: PresetCard[] = [
  {
    id: "warrior",
    label: "Warrior Dummy",
    icon: "warrior",
    description: "High STR, moderate VIT. Hits hard but predictable.",
    vitW: 1.0,
  },
  {
    id: "rogue",
    label: "Rogue Dummy",
    icon: "rogue",
    description: "High AGI & LCK. Fast and evasive, but fragile.",
    vitW: 0.6,
  },
  {
    id: "mage",
    label: "Mage Dummy",
    icon: "mage",
    description: "High INT & WIS. Devastating spells, low HP.",
    vitW: 0.7,
  },
  {
    id: "tank",
    label: "Tank Dummy",
    icon: "tank",
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
  | { kind: "loading"; preset: string }
  | { kind: "battle"; result: CombatResult }
  | { kind: "result"; result: CombatResult };

/* ────────────────── Training Card Back ────────────────── */

type TrainingCardBackProps = {
  card: PresetCard;
  character: Character;
  limitReached: boolean;
  fighting: boolean;
  error: string | null;
  onTrain: () => void;
  onFlipBack: () => void;
};

const TrainingCardBack = ({
  card,
  character,
  limitReached,
  fighting,
  error,
  onTrain,
  onFlipBack,
}: TrainingCardBackProps) => {
  const dummyLvl = getDummyLevel(character.level);
  const dummyHp = getDummyHp(character.vitality, card.vitW);

  const handleTrain = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTrain();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlipBack}
      onKeyDown={(e) => { if (e.key === "Escape") onFlipBack(); }}
      aria-label={`Flip back ${card.label}`}
      className="relative flex h-full w-full flex-col items-stretch justify-center overflow-hidden rounded-2xl border-2 border-slate-700/80 bg-slate-950/95 p-4 transition-colors hover:border-slate-600"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onFlipBack(); }}
        aria-label="Cancel"
        tabIndex={0}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-sm text-slate-400 transition hover:border-slate-500 hover:bg-slate-700 hover:text-slate-200"
      >
        ✕
      </button>

      {/* Icon + Name */}
      <div className="mb-3 flex flex-col items-center gap-1">
        <GameIcon name={card.icon} size={40} />
        <p className="font-display text-lg font-bold text-white">{card.label}</p>
        <p className="text-xs text-slate-500">Level {dummyLvl} · HP {dummyHp}</p>
      </div>

      {/* Divider */}
      <div className="mb-3 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* Description */}
      <p className="mb-4 text-center text-sm leading-relaxed text-slate-400">
        {card.description}
      </p>

      <p className="mb-4 text-center text-[10px] text-slate-600">
        Stats scale to your level
      </p>

      {/* Error */}
      {error && (
        <p className="mb-3 text-center text-sm text-red-400">{error}</p>
      )}

      {/* Train button */}
      <GameButton
        onClick={handleTrain}
        disabled={limitReached || fighting}
        aria-label={limitReached ? "Daily limit reached" : `Train vs ${card.label}`}
        variant={limitReached ? "secondary" : "primary"}
        fullWidth
        className="mt-auto"
      >
        {limitReached
          ? "Daily Limit Reached"
          : fighting
            ? "Fighting…"
            : <><GameIcon name={card.icon} size={16} className="-mt-0.5" /> Train</>}
      </GameButton>
    </div>
  );
};

/* ────────────────── Combat Content ────────────────── */

function CombatContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<Character | null>(null);
  const [preset, setPreset] = useState("warrior");
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
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

  /* Ref to prevent double-fire during loading */
  const loadingRef = useRef(false);

  const handleTrain = async (overridePreset?: string) => {
    if (!character || loadingRef.current) return;
    const selectedPreset = overridePreset ?? preset;
    setPreset(selectedPreset);
    setError(null);
    setFighting(true);
    loadingRef.current = true;

    /* Immediately show loading screen */
    setScreen({ kind: "loading", preset: selectedPreset });

    try {
      /* Fire API call */
      const res = await fetch("/api/combat/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          opponentPreset: selectedPreset,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Battle error" }));
        throw new Error(err.error ?? "Battle error");
      }
      const data = (await res.json()) as CombatResult;

      /* Preload all VFX assets needed for this specific battle */
      const assets = collectBattleAssets(
        data.log,
        data.playerSnapshot,
        data.enemySnapshot,
      );
      await preloadImages(assets);

      /* All ready — transition to battle */
      setScreen({ kind: "battle", result: data });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setScreen({ kind: "select" });
    } finally {
      setFighting(false);
      loadingRef.current = false;
    }
  };

  const handleBattleComplete = () => {
    if (screen.kind === "battle") {
      setScreen({ kind: "result", result: screen.result });
    }
  };

  const closeResultControllerRef = useRef<AbortController | null>(null);
  const handleCloseResult = () => {
    setScreen({ kind: "select" });
    refreshStatus();
    // Reload character to reflect XP/level changes
    if (characterId) {
      closeResultControllerRef.current?.abort();
      const controller = new AbortController();
      closeResultControllerRef.current = controller;
      fetch(`/api/characters/${characterId}`, { signal: controller.signal })
        .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
        .then((data) => { if (!controller.signal.aborted) setCharacter(data); })
        .catch(() => {});
    }
  };

  if (loading || !character) {
    return <PageLoader icon={<GameIcon name="training" size={32} />} text="Loading Training Arena…" />;
  }

  /* ── Loading screen (preloading VFX assets + waiting for API) ── */
  if (screen.kind === "loading") {
    return <CombatLoadingScreen preset={screen.preset} />;
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
  const limitReached = status !== null && status.remaining <= 0;

  return (
    <PageContainer>
      <PageHeader title="Training Arena" />

      <p className="mb-2 text-xs text-slate-500 text-center">
        Fight training dummies to gain XP. No stamina cost, no rating, no loot.
      </p>

      {status && (
        <div className="mx-auto mb-4 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5">
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
      )}

      {/* Choose an opponent */}
      <h2 className="mb-4 text-center font-display text-base text-slate-300">
        Choose your opponent:
      </h2>

      {/* ── Mobile scroll (< sm): flip cards ── */}
      <div className="scrollbar-hide -mx-4 mb-6 flex max-w-[100vw] snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50vw-140px)] pb-2 sm:hidden">
        {PRESETS.map((card) => {
          const dummyLvl = getDummyLevel(character.level);
          const dummyHp = getDummyHp(character.vitality, card.vitW);

          return (
            <div key={card.id} className="w-[280px] flex-shrink-0 snap-center">
                <HeroCard
                    name={card.label}
                    className={card.id}
                    level={dummyLvl}
                    hp={{ current: dummyHp, max: dummyHp }}
                    onClick={() => setFlippedCard(card.id)}
                    ariaLabel={`View ${card.label}`}
                    description={card.description}
                  />
            </div>
          );
        })}
      </div>

      {/* ── Mobile flip-back modal ── */}
      {flippedCard && (() => {
        const flippedPreset = PRESETS.find((p) => p.id === flippedCard);
        if (!flippedPreset) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:hidden">
            <div className="w-full max-w-sm">
              <TrainingCardBack
                card={flippedPreset}
                character={character}
                limitReached={limitReached}
                fighting={fighting}
                error={error}
                onTrain={() => handleTrain(flippedCard)}
                onFlipBack={() => setFlippedCard(null)}
              />
            </div>
          </div>
        );
      })()}

      {/* ── Desktop (sm+): flip cards ── */}
      <div className="hidden sm:mx-auto sm:mb-6 sm:grid sm:gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ maxWidth: "fit-content" }}>
        {PRESETS.map((card) => {
          const dummyLvl = getDummyLevel(character.level);
          const dummyHp = getDummyHp(character.vitality, card.vitW);
          const isFlipped = flippedCard === card.id;

          return (
            <div key={card.id} className="card-flip-container w-[260px]">
              <div className={`card-flip-inner ${isFlipped ? "flipped" : ""}`}>
                {/* Front */}
                <div className="card-flip-front">
                  <HeroCard
                    name={card.label}
                    className={card.id}
                    level={dummyLvl}
                    hp={{ current: dummyHp, max: dummyHp }}
                    onClick={() => setFlippedCard(card.id)}
                    ariaLabel={`View ${card.label}`}
                    description={card.description}
                    fillHeight
                  />
                </div>
                {/* Back */}
                <div className="card-flip-back">
                  <TrainingCardBack
                    card={card}
                    character={character}
                    limitReached={limitReached}
                    fighting={fighting}
                    error={error}
                    onTrain={() => handleTrain(card.id)}
                    onFlipBack={() => setFlippedCard(null)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error (desktop) */}
      {error && !flippedCard && (
        <div className="mb-4 hidden items-center gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-2.5 sm:flex">
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
    </PageContainer>
  );
}

/* ────────────────── Page wrapper ────────────────── */

export default function CombatPage() {
  return (
    <Suspense fallback={<PageLoader icon={<GameIcon name="training" size={32} />} text="Loading Training Arena…" />}>
      <CombatContent />
    </Suspense>
  );
}
