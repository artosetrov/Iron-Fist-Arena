"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import HeroCard from "@/app/components/HeroCard";
import { BOSS_NAMES, getBossImagePath } from "@/lib/game/boss-catalog";
import { useCombatVfx, CombatVfxOverlay, type VfxCommand } from "@/app/components/CombatVfxLayer";
import { GameButton } from "@/app/components/ui";

/* ────────────────── Types ────────────────── */

type CombatLogEntry = {
  turn: number;
  actorId: string;
  targetId: string;
  action: string;
  damage?: number;
  healed?: number;
  dodge?: boolean;
  crit?: boolean;
  statusTicks?: { type: string; damage?: number; healed?: number }[];
  message: string;
  actorHpAfter?: number;
  targetHpAfter?: number;
  /** Body zone hit */
  bodyZone?: string;
  /** Whether hit was blocked */
  blocked?: boolean;
  /** Block damage reduction (0-0.75) */
  blockReduction?: number;
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

type CombatBattleResult = {
  winnerId: string | null;
  loserId: string | null;
  draw: boolean;
  turns: number;
  log: CombatLogEntry[];
  playerSnapshot: CombatantSnapshot;
  enemySnapshot: CombatantSnapshot;
};

type CombatBattleScreenProps = {
  result: CombatBattleResult;
  playerId: string;
  onComplete: () => void;
};

/* ────────────────── Constants ────────────────── */

const STEP_DURATION_MS = 1200;

/* ────────────────── FloatingNumber ────────────────── */

type FloatingNumberData = {
  id: number;
  value: string;
  isCrit: boolean;
  isDodge: boolean;
  isHeal: boolean;
  side: "left" | "right";
  x: number;
  y: number;
};

let floatIdCounter = 0;

const FloatingNumber = ({ data }: { data: FloatingNumberData }) => {
  const colorClass = data.isDodge
    ? "text-cyan-300"
    : data.isHeal
      ? "text-green-400"
      : data.isCrit
        ? "text-amber-300"
        : "text-white";

  const sizeClass = data.isCrit ? "font-display text-3xl" : "font-display text-xl";

  const animClass = data.isCrit
    ? "animate-float-damage-crit"
    : "animate-float-damage";

  return (
    <span
      className={`pointer-events-none absolute z-30 ${colorClass} ${sizeClass} ${animClass} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
      style={{ left: `${data.x}%`, top: `${data.y}%` }}
      aria-hidden="true"
    >
      {data.value}
    </span>
  );
};


/* ────────────────── Fighter Card (wraps HeroCard) ────────────────── */

type FighterCardProps = {
  snapshot: CombatantSnapshot;
  currentHp: number;
  isShaking: boolean;
  isDodging: boolean;
  side: "left" | "right";
};

const FighterCard = memo(({
  snapshot,
  currentHp,
  isShaking,
  isDodging,
  side,
}: FighterCardProps) => {
  const cls = snapshot.class.toLowerCase();

  return (
    <div className="hero-card-container--battle">
      <HeroCard
        name={snapshot.name}
        variant="battle"
        className={cls}
        origin={snapshot.origin}
        level={snapshot.level}
        imageSrc={BOSS_NAMES.has(snapshot.name) ? getBossImagePath(snapshot.name) : undefined}
        hp={{ current: currentHp, max: snapshot.maxHp }}
        stats={{
          strength: snapshot.baseStats.strength,
          agility: snapshot.baseStats.agility,
          intelligence: snapshot.baseStats.intelligence,
          endurance: snapshot.baseStats.endurance,
          luck: snapshot.baseStats.luck,
        }}
        battle={{ isShaking, isDodging, side }}
      />
    </div>
  );
});
FighterCard.displayName = "FighterCard";

/* ────────────────── Battle Log Entry Row ────────────────── */

type LogEntryRowProps = {
  entry: CombatLogEntry;
  playerName: string;
  enemyName: string;
  playerId: string;
};

const ZONE_BADGE_COLOR: Record<string, string> = {
  head: "bg-red-900/40 text-red-300",
  torso: "bg-amber-900/40 text-amber-300",
  waist: "bg-purple-900/40 text-purple-300",
  legs: "bg-emerald-900/40 text-emerald-300",
};

const LogEntryRow = ({ entry, playerName, enemyName, playerId }: LogEntryRowProps) => {
  const isPlayerActor = entry.actorId === playerId;
  const actorName = isPlayerActor ? playerName : enemyName;

  const colorClass = entry.dodge
    ? "text-cyan-400"
    : entry.healed
      ? "text-green-400"
      : isPlayerActor
        ? "text-blue-400"
        : "text-red-400";

  const hpInfo = entry.actorHpAfter !== undefined && entry.targetHpAfter !== undefined
    ? ` [${actorName}: ${entry.actorHpAfter} HP | ${isPlayerActor ? enemyName : actorName === enemyName ? playerName : enemyName}: ${entry.targetHpAfter} HP]`
    : "";

  const zoneBadge = entry.bodyZone ? (
    <span className={`ml-1 inline-block rounded px-1 py-0.5 text-[9px] font-bold uppercase ${ZONE_BADGE_COLOR[entry.bodyZone] ?? "bg-slate-700 text-slate-300"}`}>
      {entry.bodyZone}
    </span>
  ) : null;

  const blockBadge = entry.blocked && entry.blockReduction ? (
    <span className="ml-1 inline-block rounded bg-blue-900/40 px-1 py-0.5 text-[9px] font-bold text-blue-300">
      BLK -{Math.round(entry.blockReduction * 100)}%
    </span>
  ) : null;

  return (
    <div className="flex gap-2 text-[11px] leading-relaxed">
      <span className="shrink-0 font-mono text-slate-600">{entry.turn}.</span>
      <span className={colorClass}>
        {entry.message}
        {zoneBadge}
        {blockBadge}
        {entry.crit && <span className="ml-1 text-amber-400">CRIT!</span>}
      </span>
      {hpInfo && (
        <span className="ml-auto shrink-0 text-slate-500">{hpInfo}</span>
      )}
    </div>
  );
};

/* ────────────────── Main Component ────────────────── */

const CombatBattleScreen = ({
  result,
  playerId,
  onComplete,
}: CombatBattleScreenProps) => {
  const { log, playerSnapshot, enemySnapshot } = result;

  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumberData[]>(
    []
  );
  const [shakingLeft, setShakingLeft] = useState(false);
  const [shakingRight, setShakingRight] = useState(false);
  const [dodgingLeft, setDodgingLeft] = useState(false);
  const [dodgingRight, setDodgingRight] = useState(false);
  const [currentTurnLabel, setCurrentTurnLabel] = useState(0);
  const [visibleLog, setVisibleLog] = useState<CombatLogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [vfxCommand, setVfxCommand] = useState<VfxCommand | null>(null);
  const [screenShaking, setScreenShaking] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const timeoutIds = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  /* Cleanup all timeouts and reset module counter on unmount */
  useEffect(() => {
    const ids = timeoutIds.current;
    const interval = intervalRef;
    return () => {
      ids.forEach(clearTimeout);
      ids.clear();
      if (interval.current) {
        clearTimeout(interval.current);
        interval.current = null;
      }
      floatIdCounter = 0;
    };
  }, []);

  /* Player is always on the left */
  const leftSnapshot = playerSnapshot;
  const rightSnapshot = enemySnapshot;

  /* Track HP by fighter ID — avoids left/right mapping confusion */
  const [hpById, setHpById] = useState<Record<string, number>>({
    [playerSnapshot.id]: playerSnapshot.maxHp,
    [enemySnapshot.id]: enemySnapshot.maxHp,
  });
  const leftHp = hpById[leftSnapshot.id] ?? 0;
  const rightHp = hpById[rightSnapshot.id] ?? 0;

  /** Unique counter so each VFX command triggers a new effect */
  const vfxSeqRef = useRef(0);

  /** Handle screen shake from VFX layer */
  const handleScreenShake = useCallback(() => {
    setScreenShaking(true);
    const tid = setTimeout(() => {
      timeoutIds.current.delete(tid);
      setScreenShaking(false);
    }, 400);
    timeoutIds.current.add(tid);
  }, []);

  /** VFX hook — manages left/right element arrays */
  const { leftElements: vfxLeft, rightElements: vfxRight } = useCombatVfx({
    command: vfxCommand,
    onScreenShake: handleScreenShake,
  });

  /** Determine if an actor is the left fighter */
  const isLeftFighter = useCallback(
    (actorId: string) => actorId === playerSnapshot.id,
    [playerSnapshot.id]
  );

  /** Spawn a floating number */
  const spawnFloat = useCallback(
    (
      value: string,
      targetSide: "left" | "right",
      isCrit: boolean,
      isDodge: boolean,
      isHeal: boolean
    ) => {
      const newFloat: FloatingNumberData = {
        id: ++floatIdCounter,
        value,
        isCrit,
        isDodge,
        isHeal,
        side: targetSide,
        x: 20 + Math.random() * 60,
        y: 15 + Math.random() * 25,
      };
      setFloatingNumbers((prev) => [...prev, newFloat]);
      const tid = setTimeout(() => {
        timeoutIds.current.delete(tid);
        setFloatingNumbers((prev) => prev.filter((f) => f.id !== newFloat.id));
      }, 1500);
      timeoutIds.current.add(tid);
    },
    []
  );

  /** Process a single log entry */
  const processEntry = useCallback(
    (entry: CombatLogEntry) => {
      setCurrentTurnLabel(entry.turn);
      setVisibleLog((prev) => [...prev, entry]);

      /* Always update HP first — before any early returns */
      if (entry.actorHpAfter !== undefined && entry.targetHpAfter !== undefined) {
        setHpById((prev) => ({
          ...prev,
          [entry.actorId]: entry.actorHpAfter!,
          [entry.targetId]: entry.targetHpAfter!,
        }));
      }

      const actorIsLeft = isLeftFighter(entry.actorId);
      const targetSide = actorIsLeft ? "right" : "left";
      const actorSide: "left" | "right" = actorIsLeft ? "left" : "right";

      /* Resolve actor class from snapshots */
      const actorClass = entry.actorId === playerSnapshot.id
        ? playerSnapshot.class
        : enemySnapshot.class;

      /* Determine if this is a buff/heal (self-targeting) */
      const isSelfBuff = entry.actorId === entry.targetId && !entry.damage && !entry.dodge;
      const isHealAction = !!(entry.healed && entry.healed > 0 && !entry.damage);

      /* Dispatch VFX command */
      vfxSeqRef.current += 1;
      const vfxCmd: VfxCommand = {
        action: entry.action,
        actorClass: actorClass?.toLowerCase(),
        actorSide,
        isCrit: !!entry.crit,
        isDodge: !!entry.dodge,
        isHeal: isHealAction,
        isBuff: isSelfBuff && !isHealAction,
      };
      /* Create a new object reference each time so React picks up the change */
      setVfxCommand({ ...vfxCmd });

      if (entry.dodge) {
        /* Dodge */
        if (targetSide === "left") {
          setDodgingLeft(true);
          const tid = setTimeout(() => { timeoutIds.current.delete(tid); setDodgingLeft(false); }, 500);
          timeoutIds.current.add(tid);
        } else {
          setDodgingRight(true);
          const tid = setTimeout(() => { timeoutIds.current.delete(tid); setDodgingRight(false); }, 500);
          timeoutIds.current.add(tid);
        }
        spawnFloat("MISS", targetSide, false, true, false);
        return;
      }

      if (entry.damage && entry.damage > 0) {
        /* Damage */
        if (targetSide === "left") {
          setShakingLeft(true);
          const tid = setTimeout(() => { timeoutIds.current.delete(tid); setShakingLeft(false); }, 400);
          timeoutIds.current.add(tid);
        } else {
          setShakingRight(true);
          const tid = setTimeout(() => { timeoutIds.current.delete(tid); setShakingRight(false); }, 400);
          timeoutIds.current.add(tid);
        }
        // Build floating text with zone label
        const zoneTag = entry.bodyZone ? `${entry.bodyZone.toUpperCase()} ` : "";
        const blockTag = entry.blocked ? " BLK" : "";
        spawnFloat(
          `${zoneTag}${entry.damage}${blockTag}`,
          targetSide,
          !!entry.crit,
          false,
          false
        );
      }

      if (entry.healed && entry.healed > 0) {
        const healSide = actorIsLeft ? "left" : "right";
        spawnFloat(`+${entry.healed}`, healSide, false, false, true);
      }

      if (entry.statusTicks) {
        const tickSide = actorIsLeft ? "left" : "right";
        for (const tick of entry.statusTicks) {
          if (tick.damage) {
            spawnFloat(tick.damage.toString(), tickSide, false, false, false);
          }
          if (tick.healed) {
            spawnFloat(`+${tick.healed}`, tickSide, false, false, true);
          }
        }
      }
    },
    [isLeftFighter, spawnFloat, playerSnapshot, enemySnapshot]
  );

  /** Skip to end */
  const handleSkip = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(log.length - 1);
    setHpById({
      [result.playerSnapshot.id]: result.playerSnapshot.currentHp,
      [result.enemySnapshot.id]: result.enemySnapshot.currentHp,
    });
    setCurrentTurnLabel(result.turns);
    setFloatingNumbers([]);
    setVfxCommand(null);
    setScreenShaking(false);
    setVisibleLog([...log]);
    setIsFinished(true);
  }, [log, result]);

  /** Toggle play/pause */
  const handleTogglePlay = useCallback(() => {
    if (isFinished) return;
    setIsPlaying((prev) => !prev);
  }, [isFinished]);

  /** Auto-advance steps */
  useEffect(() => {
    if (!isPlaying || isFinished) return;

    const nextStep = currentStep + 1;
    if (nextStep >= log.length) {
      setIsFinished(true);
      setIsPlaying(false);
      return;
    }

    intervalRef.current = setTimeout(() => {
      setCurrentStep(nextStep);
      processEntry(log[nextStep]);

      if (nextStep >= log.length - 1) {
        setIsFinished(true);
        setIsPlaying(false);
      }
    }, STEP_DURATION_MS);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, isFinished, currentStep, log, processEntry]);

  /** Auto-scroll battle log */
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleLog.length]);

  /** Auto-proceed to loot screen after battle ends */
  useEffect(() => {
    if (!isFinished) return;
    const ids = timeoutIds.current;
    const tid = setTimeout(() => {
      ids.delete(tid);
      onComplete();
    }, 2000);
    ids.add(tid);
    return () => {
      clearTimeout(tid);
      ids.delete(tid);
    };
  }, [isFinished, onComplete]);

  /** Stable refs for mount-only effect */
  const logRef = useRef(log);
  const processEntryRef = useRef(processEntry);
  logRef.current = log;
  processEntryRef.current = processEntry;

  /** Start playback on mount */
  useEffect(() => {
    const ids = timeoutIds.current;
    const timer = setTimeout(() => {
      ids.delete(timer);
      if (logRef.current.length > 0) {
        setCurrentStep(0);
        processEntryRef.current(logRef.current[0]);
      } else {
        setIsFinished(true);
        setIsPlaying(false);
      }
    }, 600);
    ids.add(timer);
    return () => {
      clearTimeout(timer);
      ids.delete(timer);
    };
  }, []);

  const turnProgress = log.length > 0 ? ((currentStep + 1) / log.length) * 100 : 0;

  return (
    <div className="relative flex min-h-full flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Log toggle — top right corner */}
      <button
        type="button"
        onClick={() => setShowLog((prev) => !prev)}
        aria-label={showLog ? "Hide battle log" : "Show battle log"}
        aria-pressed={showLog}
        className={`absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-lg border text-sm transition ${
          showLog
            ? "border-amber-500/60 bg-amber-900/30 text-amber-400"
            : "border-slate-700 bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        }`}
      >
        📜
      </button>

      {/* Battle area */}
      <div className={`relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-6 lg:px-8 ${screenShaking ? "animate-screen-shake" : ""}`}>
        {/* Fighters row */}
        <div className="flex items-center justify-center gap-4 lg:gap-8">
          {/* Left fighter */}
          <div className="relative">
            <FighterCard
              snapshot={leftSnapshot}
              currentHp={leftHp}
              isShaking={shakingLeft}
              isDodging={dodgingLeft}
              side="left"
            />
            {/* VFX overlay — positioned relative to this card wrapper */}
            <CombatVfxOverlay elements={vfxLeft} />
            {floatingNumbers
              .filter((f) => f.side === "left")
              .map((f) => (
                <FloatingNumber key={f.id} data={f} />
              ))}
          </div>

          {/* Center VS */}
          <span className="font-display text-3xl text-slate-700">VS</span>

          {/* Right fighter */}
          <div className="relative">
            <FighterCard
              snapshot={rightSnapshot}
              currentHp={rightHp}
              isShaking={shakingRight}
              isDodging={dodgingRight}
              side="right"
            />
            {/* VFX overlay — positioned relative to this card wrapper */}
            <CombatVfxOverlay elements={vfxRight} />
            {floatingNumbers
              .filter((f) => f.side === "right")
              .map((f) => (
                <FloatingNumber key={f.id} data={f} />
              ))}
          </div>
        </div>

        {/* Combined turn + action block below cards */}
        <div className="mt-6 w-full max-w-md">
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800/90 to-slate-900/90 shadow-xl shadow-black/30 backdrop-blur-sm">
            {/* Turn header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Turn
              </span>
              <span className="font-display text-lg font-bold tabular-nums text-amber-400">
                {currentTurnLabel}
                <span className="text-sm font-normal text-slate-500"> / {result.turns}</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="mx-5 mb-3 h-1.5 overflow-hidden rounded-full bg-slate-700/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
                style={{ width: `${turnProgress}%` }}
              />
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />

            {/* Action message */}
            <div className="flex min-h-[48px] items-center justify-center px-5 py-3">
              {currentStep >= 0 && currentStep < log.length ? (
                <p className="text-center text-base font-medium leading-snug text-slate-200">
                  {log[currentStep].message}
                  {log[currentStep].crit && (
                    <span className="ml-2 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-bold text-amber-400">
                      CRIT!
                    </span>
                  )}
                  {log[currentStep].dodge && (
                    <span className="ml-2 inline-block rounded bg-cyan-500/20 px-1.5 py-0.5 text-xs font-bold text-cyan-400">
                      DODGE
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-center text-sm text-slate-500 animate-pulse">
                  Preparing battle…
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Battle log slide-in panel (right side) */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          showLog ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setShowLog(false)}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-slate-700 bg-slate-900/95 shadow-2xl backdrop-blur-sm transition-transform duration-300 ease-out ${
          showLog ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Battle Log"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-3">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-300">
            📜 Battle Log
          </p>
          <button
            type="button"
            onClick={() => setShowLog(false)}
            aria-label="Close log"
            tabIndex={0}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-sm text-slate-400 transition hover:border-slate-500 hover:bg-slate-700 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {visibleLog.length > 0 ? (
            <div className="flex flex-col gap-1">
              {visibleLog.map((entry, i) => (
                <LogEntryRow
                  key={i}
                  entry={entry}
                  playerName={playerSnapshot.name}
                  enemyName={enemySnapshot.name}
                  playerId={playerSnapshot.id}
                />
              ))}
              <div ref={logEndRef} />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              No actions yet…
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 border-t border-slate-800 bg-slate-950/80 px-4 py-3">
        {!isFinished ? (
          <>
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? "Pause" : "Resume"}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700"
            >
              {isPlaying ? (
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <rect x="5" y="4" width="3" height="12" rx="1" />
                  <rect x="12" y="4" width="3" height="12" rx="1" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.5 4.5l10 5.5-10 5.5V4.5z" />
                </svg>
              )}
            </button>
            <GameButton
              onClick={handleSkip}
              aria-label="Skip Battle"
              size="md"
            >
              SKIP
            </GameButton>
          </>
        ) : (
          <span className="text-sm text-slate-400 animate-pulse">
            Continuing…
          </span>
        )}
      </div>
    </div>
  );
};

export default CombatBattleScreen;
