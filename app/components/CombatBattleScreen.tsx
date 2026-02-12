"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

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

const CLASS_GRADIENT: Record<string, string> = {
  warrior: "from-red-900 to-red-950",
  rogue: "from-emerald-900 to-emerald-950",
  mage: "from-blue-900 to-blue-950",
  tank: "from-amber-900 to-amber-950",
};

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

  const sizeClass = data.isCrit ? "text-2xl font-black" : "text-lg font-bold";

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

/* ────────────────── HP Bar ────────────────── */

type HpBarProps = {
  current: number;
  max: number;
};

const HpBar = ({ current, max }: HpBarProps) => {
  const clamped = Math.max(0, Math.min(max, current));
  const pct = max > 0 ? Math.max(0, Math.min(100, (clamped / max) * 100)) : 0;
  const barColor =
    pct > 60
      ? "from-green-600 to-green-500"
      : pct > 30
        ? "from-orange-600 to-orange-500"
        : "from-red-700 to-red-500";

  return (
    <div className="w-full">
      <div className="relative h-6 w-full overflow-hidden rounded-sm border border-slate-600 bg-slate-900">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {clamped.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

/* ────────────────── Stat Row ────────────────── */

type StatRowProps = { label: string; value: number };

const StatRow = ({ label, value }: StatRowProps) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-slate-400">{label}</span>
    <span className="font-bold text-white tabular-nums">{value}</span>
  </div>
);

/* ────────────────── Fighter Card ────────────────── */

type FighterCardProps = {
  snapshot: CombatantSnapshot;
  currentHp: number;
  isShaking: boolean;
  isDodging: boolean;
  side: "left" | "right";
};

const FighterCard = ({
  snapshot,
  currentHp,
  isShaking,
  isDodging,
  side,
}: FighterCardProps) => {
  const cls = snapshot.class.toLowerCase();
  const icon = CLASS_ICON[cls] ?? "👤";
  const gradient = CLASS_GRADIENT[cls] ?? "from-slate-800 to-slate-900";

  const shakeClass = isShaking ? "animate-combat-shake" : "";
  const dodgeClass = isDodging ? "animate-dodge-slide" : "";

  return (
    <div
      className={`flex w-full max-w-[220px] flex-col overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/90 shadow-xl ${shakeClass} ${dodgeClass}`}
    >
      {/* Avatar */}
      <div
        className={`relative flex h-32 flex-col items-center justify-center overflow-hidden bg-gradient-to-b ${gradient}`}
      >
        {snapshot.origin && ORIGIN_IMAGE[snapshot.origin] ? (
          <Image
            src={ORIGIN_IMAGE[snapshot.origin]}
            alt={snapshot.origin}
            width={1024}
            height={1024}
            className="absolute left-1/2 -top-5 w-[300%] max-w-none -translate-x-1/2"
            sizes="384px"
          />
        ) : (
          <span className="text-5xl drop-shadow-lg" aria-hidden="true">
            {icon}
          </span>
        )}
        {/* Name plate */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 backdrop-blur-sm">
          <p className="truncate text-center text-xs font-bold text-white">
            {snapshot.name}{" "}
            <span className="text-slate-400">Level {snapshot.level}</span>
          </p>
        </div>
      </div>

      {/* HP bar */}
      <div className="px-2 pt-2">
        <HpBar current={currentHp} max={snapshot.maxHp} />
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-1 p-2 pt-2">
        <StatRow label="Strength" value={snapshot.baseStats.strength} />
        <StatRow label="Dexterity" value={snapshot.baseStats.agility} />
        <StatRow label="Intelligence" value={snapshot.baseStats.intelligence} />
        <StatRow label="Constitution" value={snapshot.baseStats.endurance} />
        <StatRow label="Luck" value={snapshot.baseStats.luck} />
      </div>
    </div>
  );
};

/* ────────────────── Battle Log Entry Row ────────────────── */

type LogEntryRowProps = {
  entry: CombatLogEntry;
  playerName: string;
  enemyName: string;
  playerId: string;
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

  return (
    <div className="flex gap-2 text-[11px] leading-relaxed">
      <span className="shrink-0 font-mono text-slate-600">{entry.turn}.</span>
      <span className={colorClass}>
        {entry.message}
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

  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);
  const timeoutIds = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  /* Cleanup all timeouts and reset module counter on unmount */
  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current.clear();
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
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
        x: 30 + Math.random() * 40,
        y: 20 + Math.random() * 30,
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
        spawnFloat(
          entry.damage.toString(),
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
    [isLeftFighter, spawnFloat]
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
    const tid = setTimeout(() => {
      timeoutIds.current.delete(tid);
      onComplete();
    }, 2000);
    timeoutIds.current.add(tid);
    return () => {
      clearTimeout(tid);
      timeoutIds.current.delete(tid);
    };
  }, [isFinished, onComplete]);

  /** Start playback on mount */
  useEffect(() => {
    const timer = setTimeout(() => {
      timeoutIds.current.delete(timer);
      if (log.length > 0) {
        setCurrentStep(0);
        processEntry(log[0]);
      } else {
        setIsFinished(true);
        setIsPlaying(false);
      }
    }, 600);
    timeoutIds.current.add(timer);
    return () => {
      clearTimeout(timer);
      timeoutIds.current.delete(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Turn indicator */}
      <div className="flex items-center justify-center gap-3 border-b border-slate-800 bg-slate-950/80 px-4 py-2">
        <span className="text-xs font-medium text-slate-500">
          Turn {currentTurnLabel} / {result.turns}
        </span>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{
              width: `${log.length > 0 ? ((currentStep + 1) / log.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Battle area */}
      <div className="relative flex flex-1 items-center justify-center gap-4 px-4 py-6 lg:gap-8 lg:px-8">
        {/* Left fighter */}
        <div className="relative">
          <FighterCard
            snapshot={leftSnapshot}
            currentHp={leftHp}
            isShaking={shakingLeft}
            isDodging={dodgingLeft}
            side="left"
          />
          {/* Floating numbers for left */}
          {floatingNumbers
            .filter((f) => f.side === "left")
            .map((f) => (
              <FloatingNumber key={f.id} data={f} />
            ))}
        </div>

        {/* Center VS area */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl font-black text-slate-700">VS</span>
          {/* Current action message */}
          {currentStep >= 0 && currentStep < log.length && (
            <div className="max-w-[180px] rounded-lg bg-slate-800/80 px-3 py-1.5 text-center text-[10px] text-slate-400 shadow-lg">
              {log[currentStep].message}
            </div>
          )}
        </div>

        {/* Right fighter */}
        <div className="relative">
          <FighterCard
            snapshot={rightSnapshot}
            currentHp={rightHp}
            isShaking={shakingRight}
            isDodging={dodgingRight}
            side="right"
          />
          {/* Floating numbers for right */}
          {floatingNumbers
            .filter((f) => f.side === "right")
            .map((f) => (
              <FloatingNumber key={f.id} data={f} />
            ))}
        </div>
      </div>

      {/* Battle log */}
      {visibleLog.length > 0 && (
        <div className="mx-4 mb-2 max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 lg:mx-8">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Battle Log
          </p>
          <div className="flex flex-col gap-0.5">
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
        </div>
      )}

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
            <button
              type="button"
              onClick={handleSkip}
              aria-label="Skip Battle"
              className="rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-900/40 transition hover:from-amber-500 hover:to-orange-500"
            >
              SKIP
            </button>
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
