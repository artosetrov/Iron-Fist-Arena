"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import PageHeader from "@/app/components/PageHeader";
import CombatBattleScreen from "@/app/components/CombatBattleScreen";
import CombatResultModal from "@/app/components/CombatResultModal";
import StanceSelector from "@/app/components/StanceSelector";
import type { CombatStance } from "@/lib/game/types";
import PageLoader from "@/app/components/PageLoader";
import HeroCard, { CLASS_ICON, ORIGIN_IMAGE } from "@/app/components/HeroCard";
import GameIcon from "@/app/components/ui/GameIcon";
import GameModal from "@/app/components/ui/GameModal";
import { GameButton, PageContainer } from "@/app/components/ui";
import CardCarousel from "@/app/components/ui/CardCarousel";

/* ────────────────── Types ────────────────── */

type Character = {
  id: string;
  characterName: string;
  class: string;
  origin?: string;
  level: number;
  gold: number;
  currentStamina: number;
  maxStamina: number;
  pvpRating: number;
  strength: number;
  agility: number;
  vitality: number;
  intelligence: number;
  luck: number;
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
  bodyZone?: string;
  blocked?: boolean;
  blockReduction?: number;
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

/* ────────────────── Stat Compare (Card Back) ────────────────── */

type StatRow = { label: string; yours: number; theirs: number };

const COMPARE_STATS: { key: keyof Pick<Character, "strength" | "agility" | "intelligence" | "vitality" | "luck">; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "agility", label: "AGI" },
  { key: "intelligence", label: "INT" },
  { key: "vitality", label: "VIT" },
  { key: "luck", label: "LCK" },
];

const StatCompareRow = ({ label, yours, theirs }: StatRow) => {
  const diff = yours - theirs;
  const color = diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-slate-400";
  const sign = diff > 0 ? "+" : "";
  return (
    <div className="flex items-center justify-between gap-3 text-sm font-semibold">
      <span className="w-10 text-slate-500">{label}</span>
      <span className="w-7 text-right text-slate-300">{yours}</span>
      <span className="w-7 text-right text-white">{theirs}</span>
      <span className={`w-10 text-right font-black ${color}`}>
        {diff === 0 ? "=" : `${sign}${diff}`}
      </span>
    </div>
  );
};

type CardBackProps = {
  character: Character;
  opponent: Opponent;
  canAfford: boolean;
  fighting: boolean;
  onFight: () => void;
  onFlipBack: () => void;
};

const CardBack = ({ character, opponent, canAfford, fighting, onFight, onFlipBack }: CardBackProps) => {
  const router = useRouter();
  const [showStaminaModal, setShowStaminaModal] = useState(false);
  const playerImg = character.origin ? ORIGIN_IMAGE[character.origin] : undefined;
  const opponentImg = opponent.origin ? ORIGIN_IMAGE[opponent.origin] : undefined;
  const playerIcon = CLASS_ICON[character.class?.toLowerCase()] ?? "👤";
  const opponentIcon = CLASS_ICON[opponent.class.toLowerCase()] ?? "👤";

  const handleFight = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFight();
  };

  const handleGoToShop = () => {
    router.push(`/shop?tab=potions&characterId=${character.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlipBack}
      onKeyDown={(e) => { if (e.key === "Escape") onFlipBack(); }}
      aria-label={`Flip back ${opponent.characterName}`}
      className="relative flex h-full w-full flex-col items-stretch justify-center overflow-hidden rounded-2xl border-2 border-slate-700/80 bg-slate-950/95 p-3 transition-colors hover:border-slate-600"
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

      {/* Face-off avatars */}
      <div className="mb-3 flex items-center justify-center gap-6">
        {/* Player */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative h-[72px] w-[72px]">
            <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-emerald-500/60 bg-slate-800">
              {playerImg ? (
                <Image src={playerImg} alt={character.characterName} fill className="object-cover" sizes="72px" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl">{playerIcon}</span>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-emerald-600 font-display text-[10px] font-black text-white shadow">
              {character.level}
            </span>
          </div>
          <p className="max-w-[90px] truncate text-[10px] font-bold text-emerald-400">{character.characterName}</p>
        </div>

        {/* VS */}
        <span className="font-display text-lg font-black text-amber-500/80">VS</span>

        {/* Opponent */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative h-[72px] w-[72px]">
            <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-red-500/60 bg-slate-800">
              {opponentImg ? (
                <Image src={opponentImg} alt={opponent.characterName} fill className="object-cover" sizes="72px" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl">{opponentIcon}</span>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-red-600 font-display text-[10px] font-black text-white shadow">
              {opponent.level}
            </span>
          </div>
          <p className="max-w-[90px] truncate text-[10px] font-bold text-red-400">{opponent.characterName}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mb-3 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* Stat comparison */}
      <div className="space-y-1.5 px-4">
        {COMPARE_STATS.map((s) => (
          <StatCompareRow
            key={s.key}
            label={s.label}
            yours={character[s.key]}
            theirs={opponent[s.key]}
          />
        ))}
        {/* HP */}
        <div className="mt-1.5 border-t border-slate-700/50 pt-1.5">
          <StatCompareRow
            label="HP"
            yours={getMaxHp(character.vitality)}
            theirs={getMaxHp(opponent.vitality)}
          />
        </div>
      </div>

      {/* Fight button — wrapper intercepts click when stamina is low */}
      <div
        className="mt-6"
        onClick={!canAfford && !fighting ? (e: React.MouseEvent) => { e.stopPropagation(); setShowStaminaModal(true); } : undefined}
      >
        <GameButton
          onClick={canAfford ? handleFight : undefined}
          disabled={!canAfford || fighting}
          aria-label={`Fight ${opponent.characterName}`}
          fullWidth
          className={!canAfford ? "pointer-events-none" : ""}
        >
          {fighting ? "Fighting…" : <><GameIcon name="fights" size={16} /> Fight (<GameIcon name="stamina" size={16} /> {STAMINA_COST})</>}
        </GameButton>
      </div>

      {!canAfford && (
        <p className="mt-1 text-center text-[9px] text-red-400">
          Not enough stamina
        </p>
      )}

      {/* Stamina shortage modal */}
      <GameModal
        open={showStaminaModal}
        onClose={() => setShowStaminaModal(false)}
        size="sm"
        title="Not enough stamina"
      >
        <div className="flex flex-col items-center gap-4 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-3xl">
            <GameIcon name="stamina" size={32} />
          </div>
          <p className="text-sm text-slate-300">
            You need <span className="font-bold text-amber-400">{STAMINA_COST}</span> stamina to fight, but you only have{" "}
            <span className="font-bold text-red-400">{character.currentStamina}</span>.
          </p>
          <p className="text-xs text-slate-400">
            Buy a stamina potion to refill your energy and get back into the arena!
          </p>
          <div className="flex w-full flex-col gap-2">
            <GameButton
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleGoToShop(); }}
              fullWidth
              aria-label="Go to potion shop"
            >
              🧪 Buy Potions
            </GameButton>
            <GameButton
              variant="secondary"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowStaminaModal(false); }}
              fullWidth
              aria-label="Close stamina modal"
            >
              Cancel
            </GameButton>
          </div>
        </div>
      </GameModal>
    </div>
  );
};

/* ────────────────── Screen states ────────────────── */

type ScreenState =
  | { kind: "select" }
  | { kind: "stance"; opponentId: string }
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
  const [fighting, setFighting] = useState(false);
  const [screen, setScreen] = useState<ScreenState>({ kind: "select" });
  const [error, setError] = useState<string | null>(null);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);

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
    setFlippedCard(null);
    try {
      const res = await fetch(`/api/pvp/opponents?characterId=${characterId}`, { signal: controller.signal });
      const data = await res.json();
      if (res.ok) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'arena/page.tsx:loadOpponents',message:'API response opponents',data:{count:data.opponents?.length,opponents:data.opponents?.map((o:Record<string,unknown>)=>({id:o.id,characterName:o.characterName,class:o.class,origin:o.origin,level:o.level,pvpRating:o.pvpRating,strength:o.strength,agility:o.agility,vitality:o.vitality,intelligence:o.intelligence,luck:o.luck}))},timestamp:Date.now(),hypothesisId:'H4-data'})}).catch(()=>{});
        // #endregion
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

  /* ── Select opponent → go to stance selection ── */
  const handleFight = (opponentId: string) => {
    if (!characterId || fighting) return;
    setError(null);
    setScreen({ kind: "stance", opponentId });
  };

  /* ── Stance confirmed → start fight ── */
  const handleStanceConfirm = async (stance: CombatStance) => {
    if (!characterId || fighting || screen.kind !== "stance") return;
    setError(null);
    setFighting(true);
    try {
      const res = await fetch("/api/pvp/find-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, opponentId: screen.opponentId, stance }),
      });
      const data = (await res.json()) as MatchResult;
      if (!res.ok) {
        setError((data as unknown as { error: string }).error ?? "Error");
        setScreen({ kind: "select" });
        return;
      }
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

  /* ── Save stance as default ── */
  const handleSaveStance = async (stance: CombatStance) => {
    if (!characterId) return;
    await fetch(`/api/characters/${characterId}/stance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stance }),
    });
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
    return <PageLoader icon={<GameIcon name="arena" size={32} />} text="Loading arena…" />;
  }

  /* ── Stance selection screen ── */
  if (screen.kind === "stance") {
    return (
      <PageContainer>
        <PageHeader title="Arena" />
        <div className="flex min-h-[60vh] items-center justify-center p-4 lg:p-6">
          <StanceSelector
            onConfirm={handleStanceConfirm}
            onSaveDefault={handleSaveStance}
            onBack={() => setScreen({ kind: "select" })}
            loading={fighting}
            confirmLabel="Fight!"
          />
        </div>
        {error && (
          <p className="mt-2 text-center text-sm text-red-400">{error}</p>
        )}
      </PageContainer>
    );
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
    <PageContainer bgImage="/images/ui/arena-background.png">
      <PageHeader title="Arena" />

      {/* Choose opponent */}
      <h2 className="mb-4 text-center font-display text-base text-slate-300">
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
            <span className="absolute inset-0 flex items-center justify-center"><GameIcon name="arena" size={20} /></span>
          </div>
        </div>
      ) : opponents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <p className="mb-3 text-4xl">🏜️</p>
          <p className="text-sm">No opponents available</p>
          <GameButton variant="secondary" size="sm" onClick={loadOpponents} className="mt-3">
            Refresh
          </GameButton>
        </div>
      ) : (
        <>
          {/* ── Opponent carousel (unified for mobile & desktop) ── */}
          <CardCarousel ariaLabelPrev="Previous opponent" ariaLabelNext="Next opponent">
            {opponents.map((opp) => {
              const cls = opp.class.toLowerCase();
              const maxHp = getMaxHp(opp.vitality);

              return (
                <div key={opp.id} className="hero-card-container--default">
                  <HeroCard
                    name={opp.characterName}
                    variant="default"
                    className={cls}
                    origin={opp.origin}
                    level={opp.level}
                    rating={opp.pvpRating}
                    hp={{ current: maxHp, max: maxHp }}
                    onClick={() => setFlippedCard(opp.id)}
                    ariaLabel={`View stats for ${opp.characterName}`}
                    stats={{
                      strength: opp.strength,
                      agility: opp.agility,
                      intelligence: opp.intelligence,
                      vitality: opp.vitality,
                      luck: opp.luck,
                    }}
                  />
                </div>
              );
            })}
          </CardCarousel>

          {/* ── Stat-compare modal (on card click) ── */}
          {flippedCard && (() => {
            const flippedOpponent = opponents.find((o) => o.id === flippedCard);
            if (!flippedOpponent) return null;
            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => setFlippedCard(null)}
                role="dialog"
                aria-modal="true"
                aria-label="Stat comparison"
              >
                <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                  <CardBack
                    character={character}
                    opponent={flippedOpponent}
                    canAfford={canAfford}
                    fighting={fighting}
                    onFight={() => handleFight(flippedCard)}
                    onFlipBack={() => setFlippedCard(null)}
                  />
                </div>
              </div>
            );
          })()}

          {/* Refresh button under cards */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={loadOpponents}
              disabled={loadingOpponents}
              aria-label="Refresh opponents"
              tabIndex={0}
              className="group flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-800/50 px-4 py-2 font-display text-base font-medium uppercase tracking-wider text-slate-400 transition-all hover:border-slate-600 hover:bg-slate-800/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GameIcon name="switch-char" size={20} />
              Refresh
            </button>
          </div>
        </>
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
    </PageContainer>
  );
}

/* ────────────────── Page wrapper ────────────────── */

export default function ArenaPage() {
  return (
    <Suspense fallback={<PageLoader icon={<GameIcon name="arena" size={32} />} text="Loading arena…" />}>
      <ArenaContent />
    </Suspense>
  );
}
