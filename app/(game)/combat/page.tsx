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
import { GameButton, GameModal, PageContainer } from "@/app/components/ui";
import GameIcon from "@/app/components/ui/GameIcon";
import type { GameIconKey } from "@/app/components/ui/GameIcon";
import CardCarousel from "@/app/components/ui/CardCarousel";
import { getBossImagePath } from "@/lib/game/boss-catalog";
import { DUMMY_CLASS_WEIGHTS, TRAINING_DUMMY_PRESET_IDS } from "@/lib/game/training-dummies";
import {
  collectBattleAssets,
  preloadImages,
} from "@/lib/game/preload-combat-assets";
import { safeJson } from "@/lib/safe-fetch";

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
  baseMax: number;
  bonus: number;
  buys: number;
  maxBuys: number;
  buyCostGems: number;
};

/* ────────────────── Preset cards data ────────────────── */

type PresetCard = {
  id: string;
  label: string;
  icon: GameIconKey;
  description: string;
  /** Weight applied to player VIT when computing dummy HP */
  vitW: number;
  /** Temporary image (boss art used as placeholder) */
  imageSrc: string;
};

const PRESET_ICON_IMAGE: Record<string, { icon: GameIconKey; imageSrc: string }> = {
  warrior: { icon: "warrior", imageSrc: getBossImagePath("Straw Dummy") },
  rogue: { icon: "rogue", imageSrc: getBossImagePath("Flying Francis") },
  mage: { icon: "mage", imageSrc: getBossImagePath("Scarecrow Mage") },
  tank: { icon: "tank", imageSrc: getBossImagePath("Barrel Golem") },
};

const PRESETS: PresetCard[] = TRAINING_DUMMY_PRESET_IDS.map((id) => {
  const w = DUMMY_CLASS_WEIGHTS[id];
  const { icon, imageSrc } = PRESET_ICON_IMAGE[id] ?? { icon: "warrior" as GameIconKey, imageSrc: getBossImagePath("Straw Dummy") };
  return {
    id,
    label: w.name.replace("Training Dummy — ", "").replace(" — ", " "),
    icon,
    description: w.description,
    vitW: w.vitW,
    imageSrc,
  };
});

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
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyingExtra, setBuyingExtra] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

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

  /* ── Buy extra training sessions ── */
  const handleBuyExtra = async () => {
    if (!character || buyingExtra) return;
    setBuyError(null);
    setBuyingExtra(true);

    try {
      const res = await fetch("/api/combat/buy-extra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data.error ?? "Purchase failed");
      }
      setStatus(data.status);
      setShowBuyModal(false);
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setBuyingExtra(false);
    }
  };

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
      const data = (await safeJson(res)) as CombatResult;
      if (!res.ok) {
        throw new Error((data as unknown as { error: string }).error ?? "Battle error");
      }

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
    return <PageLoader icon={<GameIcon name="training" size={128} />} text="Loading Training Arena…" />;
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
        <button
          type="button"
          onClick={() => { if (limitReached) setShowBuyModal(true); }}
          className={`mx-auto mb-4 flex items-center gap-2 rounded-xl border bg-slate-800/60 px-3 py-1.5 transition-colors ${
            limitReached
              ? "cursor-pointer border-amber-600/60 hover:border-amber-500 hover:bg-slate-800/80"
              : "cursor-default border-slate-700"
          }`}
          aria-label={limitReached ? "Buy extra training sessions" : `${status.remaining} of ${status.max} training sessions remaining`}
          tabIndex={limitReached ? 0 : -1}
        >
          <span className="text-xs text-slate-400">Today:</span>
          <div className="flex gap-1">
            {Array.from({ length: status.max }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i < status.remaining
                    ? "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.4)]"
                    : "bg-slate-700/50 ring-1 ring-slate-600/50"
                }`}
                aria-label={i < status.remaining ? "Available" : "Used"}
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
          {limitReached && (
            <span className="ml-0.5 text-xs text-amber-500">💎</span>
          )}
        </button>
      )}

      {/* Choose an opponent */}
      <h2 className="mb-4 text-center font-display text-base text-slate-300">
        Choose your opponent:
      </h2>

      {/* ── Opponent carousel (unified for mobile & desktop) ── */}
      <CardCarousel ariaLabelPrev="Previous opponent" ariaLabelNext="Next opponent">
        {PRESETS.map((card) => {
          const dummyLvl = getDummyLevel(character.level);
          const dummyHp = getDummyHp(character.vitality, card.vitW);

          return (
            <div key={card.id} className="hero-card-container--default">
              <HeroCard
                name={card.label}
                variant="default"
                className={card.id}
                level={dummyLvl}
                hp={{ current: dummyHp, max: dummyHp }}
                imageSrc={card.imageSrc}
                onClick={() => setFlippedCard(card.id)}
                ariaLabel={`View ${card.label}`}
                description={card.description}
              />
            </div>
          );
        })}
      </CardCarousel>

      {/* ── Detail modal (on card click) ── */}
      {flippedCard && (() => {
        const flippedPreset = PRESETS.find((p) => p.id === flippedCard);
        if (!flippedPreset) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={() => setFlippedCard(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Training dummy details"
          >
            <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
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

      {/* Buy extra training sessions modal */}
      <GameModal
        open={showBuyModal}
        onClose={() => { setShowBuyModal(false); setBuyError(null); }}
        title="Extra Training"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 ring-2 ring-amber-500/30">
            <span className="text-2xl">⚔️</span>
          </div>

          <p className="text-center text-sm text-slate-300">
            You&apos;ve used all your daily training sessions!
            <br />
            Buy <span className="font-bold text-amber-400">+5 extra sessions</span> to keep training.
          </p>

          {status && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-xs">
              <div className="text-slate-400">
                Purchases today: <span className="font-bold text-white">{status.buys}/{status.maxBuys}</span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="text-slate-400">
                Cost: <span className="font-bold text-purple-400">{status.buyCostGems} 💎</span>
              </div>
            </div>
          )}

          {buyError && (
            <p className="text-center text-sm text-red-400">{buyError}</p>
          )}

          <div className="flex w-full gap-2">
            <GameButton
              variant="secondary"
              fullWidth
              onClick={() => { setShowBuyModal(false); setBuyError(null); }}
              aria-label="Cancel"
            >
              Cancel
            </GameButton>
            <GameButton
              variant="primary"
              fullWidth
              onClick={handleBuyExtra}
              disabled={buyingExtra || (status !== null && status.buys >= status.maxBuys)}
              aria-label="Buy extra training sessions"
            >
              {buyingExtra
                ? "Buying…"
                : status && status.buys >= status.maxBuys
                  ? "Sold Out"
                  : <>Buy for {status?.buyCostGems ?? 30} 💎</>}
            </GameButton>
          </div>
        </div>
      </GameModal>
    </PageContainer>
  );
}

/* ────────────────── Page wrapper ────────────────── */

export default function CombatPage() {
  return (
    <Suspense fallback={<PageLoader icon={<GameIcon name="training" size={128} />} text="Loading Training Arena…" />}>
      <CombatContent />
    </Suspense>
  );
}
